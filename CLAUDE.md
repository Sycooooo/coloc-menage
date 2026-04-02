@AGENTS.md

# THC App — Tâches de l'Habitation en Colocation

Application de **gamification de la vie en colocation**. Les colocataires gèrent leurs tâches ménagères, dépenses, repas, et plus — le tout dans un univers pixel art / lofi avec un système de XP, niveaux, saisons et récompenses.

## Utilisateur

Le propriétaire du projet est **débutant en web design**. Toute explication doit être claire, concrète, et détaillée. Ne pas supposer de connaissances préalables en CSS, React, ou architecture web. Expliquer le "pourquoi" en plus du "comment".

---

## Stack Technique

| Couche | Techno |
|---|---|
| Framework | **Next.js 16.2.1** (App Router) |
| Langage | **TypeScript 5** |
| React | **React 19** |
| CSS | **Tailwind CSS v4** + CSS variables (thème lofi dual light/dark) |
| Base de données | **PostgreSQL** via **Prisma ORM 7.6** |
| Auth | **NextAuth v5** (beta 30), JWT + bcryptjs |
| IA | **Mistral AI** (génération menus/repas) |
| Temps réel | **Pusher** (server) + **pusher-js** (client) |
| Animations | **Framer Motion 12** |
| Drag & Drop | **@dnd-kit** (core + sortable) |
| Validation | **Zod v4** |
| Notifications | **Sonner** (toasts) |
| Musique | **Spotify API** (OAuth, stories, blind test) |

## Commandes

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run lint     # ESLint
npx prisma migrate dev   # Appliquer les migrations
npx prisma generate      # Générer le client Prisma
npx prisma db seed       # Seed la base de données
```

---

## Architecture

### Structure des fichiers

```
src/
├── app/                          # Pages et API (Next.js App Router)
│   ├── layout.tsx                # Layout racine (fonts, providers)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Thème complet (light cosy + dark lofi)
│   ├── login/ & register/        # Auth pages
│   ├── profile/                  # Profil, character creator, settings
│   ├── shop/                     # Boutique in-app
│   ├── coloc/
│   │   ├── new/ & join/          # Créer/rejoindre une coloc
│   │   └── [id]/                 # Pages de la coloc
│   │       ├── page.tsx          # Dashboard principal
│   │       ├── board/            # Tableau d'affichage (post-its)
│   │       ├── calendar/         # Calendrier partagé
│   │       ├── chat/             # Chat temps réel
│   │       ├── expenses/         # Gestion des dépenses (Tricount)
│   │       ├── menu/             # Planning repas IA
│   │       ├── music/            # Spotify (stories, blind test)
│   │       └── admin/            # Admin de la coloc
│   └── api/                      # Routes API (REST)
│       ├── auth/                 # NextAuth + register
│       ├── coloc/                # CRUD coloc, join, sous-routes par [id]
│       ├── tasks/                # CRUD tâches
│       ├── profile/              # Profil, avatar, password
│       ├── shop/                 # Boutique
│       ├── spotify/              # OAuth Spotify
│       ├── notifications/        # Notifications
│       └── season/reset/         # Reset de saison
├── components/                   # Composants React
│   ├── TaskList.tsx              # Liste des tâches + confettis
│   ├── AddTaskForm.tsx           # Formulaire ajout tâche
│   ├── Board.tsx + BoardNote.tsx  # Tableau post-its drag-and-drop
│   ├── Calendar.tsx              # Calendrier partagé
│   ├── Chat.tsx                  # Chat temps réel (@mentions, GIFs)
│   ├── Expenses.tsx              # Tricount-like (split equal/exact/%)
│   ├── Menu.tsx                  # Planning repas IA + timers
│   ├── ColocNav.tsx              # Barre de navigation bottom
│   ├── CharacterCreator.tsx      # Créateur avatar pixel art
│   ├── PixelAvatar.tsx           # Rendu avatar pixel art
│   ├── Shop.tsx                  # Boutique items
│   ├── RankCard/Badge/Emblem.tsx # Système de rang
│   ├── music/                    # Composants Spotify
│   └── ui/                       # Button, PageAmbiance, scenes pixel art
├── lib/                          # Utilitaires et configuration
│   ├── auth.ts                   # Config NextAuth
│   ├── prisma.ts                 # Client Prisma singleton
│   ├── pusher.ts / pusher-client.ts  # Config Pusher
│   ├── ai.ts                     # Client Mistral AI
│   ├── xp.ts                     # Système XP, niveaux, difficulté, couleurs
│   ├── ranking.ts                # Système de rangs et saisons
│   ├── spotify.ts                # Helpers Spotify API
│   ├── validations.ts            # Schémas Zod
│   └── animations.ts             # Helpers animation
├── middleware.ts                  # Redirections auth
└── types/index.ts                # Types TypeScript
```

### Base de données (Prisma — 22 modèles)

- **User** — auth, XP, currency, streaks, rank
- **Colocation** — espace partagé avec code d'invitation
- **UserColoc** — many-to-many user ↔ coloc (roles)
- **Task / TaskHistory** — tâches avec difficulté, catégorie, room, récurrence
- **Score** — points par user par coloc
- **ShopItem / UserItem** — boutique virtuelle (raretés: common → legendary)
- **AvatarConfig** — avatar pixel art customisable
- **Achievement / UserAchievement** — succès débloquables
- **Notification** — notifications in-app
- **BoardItem** — post-its (texte, image, lien) avec couleurs et positions
- **CalendarEvent** — événements calendrier partagé
- **QuestTemplate / ColocTemplate** — système de quêtes
- **MemberAffinity** — préférences de catégories par user
- **WeeklyMenu** — menus IA hebdo (JSON)
- **Expense / ExpenseSplit** — dépenses avec méthodes de split
- **SeasonRecord** — historique des saisons compétitives
- **PlacedFurniture** — meubles placés dans la room
- **SpotifyAccount** — tokens OAuth Spotify
- **MusicStory / BlindTestRound** — stories et quiz musical
- **Message** — chat (texte + GIF)

### Décision architecturale

- **Une seule coloc par utilisateur**, contrainte côté app (pas en base). Redirect direct vers la coloc, pas de page dashboard.

---

## Design System

### Thème dual

- **Light mode** : "Cosy warm" — beiges chauds, textures papier
- **Dark mode** (par défaut) : "Midnight Lofi" — navy-purple (#0a0a14), violet (#c084fc), amber (#f4b860), glass/blur, neon glow, film grain

### Variables CSS principales (dark)

| Variable | Valeur | Usage |
|---|---|---|
| `--bg` | `#0a0a14` | Background principal |
| `--surface` | `#161628` | Cartes, conteneurs |
| `--accent` | `#c084fc` | Violet principal |
| `--accent-secondary` | `#f4b860` | Amber secondaire |
| `--accent-tertiary` | `#f472b6` | Rose tertiaire |
| `--border` | `rgba(192,132,252,0.08)` | Bordures subtiles |
| `--success` | `#34d399` | Vert succès |
| `--danger` | `#f87171` | Rouge danger |

### Conventions CSS (post-restyle lofi)

- Coins : `rounded-lg` pour les cartes, `rounded-xl` pour les gros conteneurs
- Bordures : `border-[var(--border)]` (jamais `border-b` comme couleur)
- Effet glass : `backdrop-blur-sm` sur les cartes
- Pas de `rounded-2xl` sauf cas exceptionnels

---

## Workflow de développement

### Rôles : Architect → Builder → Reviewer

Le projet utilise un workflow structuré avec 3 rôles (tous joués par Claude) :

1. **Architect** — Écrit le brief dans `ARCHITECT-BRIEF.md` (quoi faire, dans quel ordre, contraintes)
2. **Builder** — Exécute le brief, écrit le code, crée `REVIEW-REQUEST.md`
3. **Reviewer** — Vérifie le code, écrit le verdict dans `REVIEW-FEEDBACK.md`

### Fichiers de suivi

| Fichier | Rôle | Contenu |
|---|---|---|
| `ARCHITECT-BRIEF.md` | Architect | Brief du step en cours (context, build order, flags, definition of done) |
| `BUILD-LOG.md` | Builder | Historique des steps, décisions, état actuel |
| `REVIEW-REQUEST.md` | Builder | Détail des changements soumis pour review |
| `REVIEW-FEEDBACK.md` | Reviewer | Checklist, verdict (APPROVED / NEEDS CHANGES) |

### Règle importante

**Quand le Builder termine une tâche, il doit immédiatement passer au Reviewer sans attendre de confirmation de l'utilisateur.** Le flow est : Builder finit → crée REVIEW-REQUEST.md → Reviewer review → écrit REVIEW-FEEDBACK.md → rapport à l'utilisateur.

---

## Fonctionnalités complètes

- [x] Auth (register/login, JWT, bcrypt)
- [x] Gestion des tâches (CRUD, difficulté, catégories, récurrence, assignation, confettis)
- [x] Chat temps réel (Pusher, @mentions, GIFs)
- [x] Dépenses / Tricount (split equal/exact/%/shares)
- [x] Board post-its (drag-and-drop, images, couleurs)
- [x] Calendrier partagé
- [x] Menu IA (Mistral, repas hebdo, liste de courses, timers)
- [x] Spotify (OAuth, Now Playing, Stories, Blind Test)
- [x] Shop virtuel (items, monnaie, raretés)
- [x] Avatar pixel art (créateur complet)
- [x] Quêtes (templates, génération IA)
- [x] Saisons compétitives (ranks, badges, reset)
- [x] Notifications in-app
- [x] Thème dual (light cosy / dark lofi)
- [x] Restyle lofi complet (Steps 5a, 5b, 5c — DONE)
