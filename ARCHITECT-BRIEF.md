# Architect Brief

## Step 5c — Restyle: Board, Calendar, Expenses, Menu — COMPLETE

### Context
Dernière passe du restyle composants. Ces 4 composants sont les plus gros (434-698 lignes). Mêmes principes : coins réduits, couleurs alignées sur la palette lofi, style plus cohérent. Changements CSS uniquement.

### Definition of Done
- [x] Board : coins réduits, bouton ajout plus subtil
- [x] Calendar : coins réduits, bordures cohérentes
- [x] Expenses : coins réduits, backdrop-blur sur cartes
- [x] Menu : coins réduits, backdrop-blur sur cartes
- [x] Aucune fonctionnalité cassée

### Review: APPROVED (after fix)
- Fix applied: `Expenses.tsx:548` — `hover:border-b-hover` → `hover:border-accent/30`
