# Architect Brief

## Step 5c — Restyle: Board, Calendar, Expenses, Menu

### Context
Dernière passe du restyle composants. Ces 4 composants sont les plus gros (434-698 lignes). Mêmes principes : coins réduits, couleurs alignées sur la palette lofi, style plus cohérent. Changements CSS uniquement.

### Build Order

1. **Board.tsx — Tableau d'affichage (post-its)**
   - `rounded-xl` → `rounded-lg`, `rounded-2xl` → `rounded-xl`
   - Les couleurs des post-its (NOTE_COLORS) : les garder mais s'assurer qu'elles sont assez visibles sur le fond sombre. Si les couleurs sont trop vives, baisser légèrement leur opacité.
   - Le bouton "ajouter une note" : `border-dashed border-accent` → `border-dashed border-accent/40` (plus subtil)
   - `backdrop-blur-sm` sur les notes si pas trop lourd visuellement

2. **Calendar.tsx — Calendrier**
   - `rounded-xl` → `rounded-lg`
   - Les cellules du calendrier : `border-b/50` → `border-[var(--border)]/50`
   - Le marqueur "aujourd'hui" : garder `bg-accent text-white` (c'est bien)
   - Les couleurs d'événements (COLORS/COLOR_DOTS) : garder telles quelles — elles servent à différencier les événements
   - Le header du mois : s'assurer qu'il utilise `text-t-primary`

3. **Expenses.tsx — Gestion des dépenses**
   - `rounded-xl` → `rounded-lg`, `rounded-2xl` → `rounded-xl`
   - Les montants positifs/négatifs : garder `text-success` / `text-danger` (bien)
   - Les cartes de résumé : `card card-glow` → ajouter `backdrop-blur-sm`
   - Les avatars : garder `bg-accent/20` (bien)

4. **Menu.tsx — Planning repas**
   - `rounded-xl` → `rounded-lg`, `rounded-2xl` → `rounded-xl`
   - Les cartes de jour : `card card-glow` → ajouter `backdrop-blur-sm`
   - Le timer : garder les couleurs actuelles (fonctionnelles)
   - Les emojis de jours : garder tels quels

### Flags
- Flag: Ces composants sont GROS (400-700 lignes) — ne pas tout lire, utiliser grep pour trouver les classes à changer
- Flag: NE PAS changer la logique
- Flag: NE PAS changer les couleurs fonctionnelles (success/danger, couleurs d'événements, couleurs de post-its)
- Flag: Changements principalement mécaniques : rounded-xl → rounded-lg, ajout de backdrop-blur-sm
- Flag: Si un `border-b` est utilisé comme couleur de bordure (pas border-bottom), le remplacer par `border-[var(--border)]`

### Definition of Done
- [ ] Board : coins réduits, bouton ajout plus subtil
- [ ] Calendar : coins réduits, bordures cohérentes
- [ ] Expenses : coins réduits, backdrop-blur sur cartes
- [ ] Menu : coins réduits, backdrop-blur sur cartes
- [ ] Aucune fonctionnalité cassée

---

## Builder Plan
[Builder writes plan here]

Architect approval: [ ] Approved / [ ] Redirect — see notes below
