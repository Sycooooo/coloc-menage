import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExpenseSchema } from '@/lib/validations'
import { notifyColoc } from '@/lib/notifications'

// GET — Liste des dépenses + soldes
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { id: colocId } = await params

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const expenses = await prisma.expense.findMany({
    where: { colocId },
    include: {
      paidBy: { select: { id: true, username: true, avatar: true } },
      splits: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calcul des soldes : pour chaque membre, combien il a payé vs combien il doit
  const members = await prisma.userColoc.findMany({
    where: { colocId },
    include: { user: { select: { id: true, username: true, avatar: true } } },
  })

  const balances: Record<string, number> = {}
  for (const m of members) {
    balances[m.userId] = 0
  }

  for (const expense of expenses) {
    // Le payeur a avancé le montant total
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount
    // Chaque participant doit sa part
    for (const split of expense.splits) {
      balances[split.userId] = (balances[split.userId] || 0) - split.amount
    }
  }

  return NextResponse.json({ expenses, balances, members })
}

// POST — Ajouter une dépense
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { id: colocId } = await params

  const body = await request.json()
  const result = createExpenseSchema.safeParse({ ...body, colocId })
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
  }

  const { amount, description, category, splitBetween, splitMethod, customSplits } = result.data

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Calcul des montants par personne selon la méthode
  let splitAmounts: Record<string, number> = {}

  if (splitMethod === 'equal') {
    const perPerson = Math.round((amount / splitBetween.length) * 100) / 100
    for (const userId of splitBetween) {
      splitAmounts[userId] = perPerson
    }
  } else if (splitMethod === 'exact' && customSplits) {
    const total = Object.values(customSplits).reduce((s, v) => s + v, 0)
    if (Math.abs(total - amount) > 0.02) {
      return NextResponse.json({ error: `Le total des montants (${total.toFixed(2)}€) ne correspond pas au montant total (${amount.toFixed(2)}€)` }, { status: 400 })
    }
    splitAmounts = customSplits
  } else if (splitMethod === 'percentage' && customSplits) {
    const totalPercent = Object.values(customSplits).reduce((s, v) => s + v, 0)
    if (Math.abs(totalPercent - 100) > 0.1) {
      return NextResponse.json({ error: `Le total des pourcentages doit être 100% (actuellement ${totalPercent.toFixed(1)}%)` }, { status: 400 })
    }
    for (const [userId, percent] of Object.entries(customSplits)) {
      splitAmounts[userId] = Math.round((amount * percent / 100) * 100) / 100
    }
  } else if (splitMethod === 'shares' && customSplits) {
    const totalShares = Object.values(customSplits).reduce((s, v) => s + v, 0)
    if (totalShares === 0) {
      return NextResponse.json({ error: 'Le total des parts ne peut pas être 0' }, { status: 400 })
    }
    for (const [userId, shares] of Object.entries(customSplits)) {
      splitAmounts[userId] = Math.round((amount * shares / totalShares) * 100) / 100
    }
  } else {
    return NextResponse.json({ error: 'Méthode de partage invalide' }, { status: 400 })
  }

  const expense = await prisma.expense.create({
    data: {
      amount,
      description,
      category,
      paidById: session.user.id,
      colocId,
      splits: {
        create: Object.entries(splitAmounts).map(([userId, splitAmount]) => ({
          userId,
          amount: splitAmount,
        })),
      },
    },
    include: {
      paidBy: { select: { id: true, username: true, avatar: true } },
      splits: {
        include: { user: { select: { id: true, username: true, avatar: true } } },
      },
    },
  })

  await notifyColoc(
    colocId,
    session.user.id,
    'new_expense',
    `${session.user.name} a ajouté une dépense : ${description} (${amount.toFixed(2)}€)`,
    `/coloc/${colocId}/expenses`
  )

  return NextResponse.json(expense, { status: 201 })
}

// DELETE — Supprimer une dépense
export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  }

  const { expenseId } = await request.json()

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  })

  if (!expense) {
    return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 })
  }

  // Seul le payeur peut supprimer
  if (expense.paidById !== session.user.id) {
    return NextResponse.json({ error: 'Seul le payeur peut supprimer' }, { status: 403 })
  }

  await prisma.expense.delete({ where: { id: expenseId } })

  return NextResponse.json({ ok: true })
}
