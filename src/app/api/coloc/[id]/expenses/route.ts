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

  const { amount, description, category, splitBetween } = result.data

  const membership = await prisma.userColoc.findUnique({
    where: { userId_colocId: { userId: session.user.id, colocId } },
  })
  if (!membership) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Répartition équitable
  const splitAmount = Math.round((amount / splitBetween.length) * 100) / 100

  const expense = await prisma.expense.create({
    data: {
      amount,
      description,
      category,
      paidById: session.user.id,
      colocId,
      splits: {
        create: splitBetween.map((userId: string) => ({
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
