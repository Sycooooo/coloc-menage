# Review Request — Step 5c: Restyle Board, Calendar, Expenses, Menu

## Summary
CSS-only restyle of four large components (434-698 lines each). Reduced corner radii, replaced ambiguous `border-b` color classes with explicit `border-[var(--border)]`, added `backdrop-blur-sm` on key cards and notes. No logic, state, or animation changes.

## Files Modified

### `src/components/Board.tsx`
- Drop overlay: `rounded-2xl` -> `rounded-xl`, `border-accent` -> `border-accent/40` (subtler dashed border)
- Form toolbar divider: `border-b border-b` -> `border-b border-[var(--border)]`
- Form inputs (textarea, image preview border, link input): `border border-b` -> `border border-[var(--border)]`
- Post-it colors (NOTE_COLORS): untouched
- Framer Motion animations: untouched

### `src/components/BoardNote.tsx`
- Note cards: `rounded-xl` -> `rounded-lg`, added `backdrop-blur-sm`
- Post-it colors (`colors.bg`, `colors.border`): untouched
- `border-current/10`, `border-current/20` on editing UI: untouched (functional)
- Framer Motion animations: untouched

### `src/components/Calendar.tsx`
- Month cards (year view): `rounded-xl` -> `rounded-lg`, `border-b` -> `border-[var(--border)]`
- Navigation buttons (4 total): `border border-b` -> `border border-[var(--border)]`
- Calendar grid header: `border-b border-b` -> `border-b border-[var(--border)]`
- Calendar cells (empty + day): `border-b/50` -> `border-[var(--border)]/50`
- Form inputs (title, description, time): `border border-b` -> `border border-[var(--border)]`
- Today marker (`bg-accent text-white`): untouched
- Event colors (COLORS, COLOR_DOTS): untouched
- Framer Motion animations: untouched

### `src/components/Expenses.tsx`
- Summary cards (2): added `backdrop-blur-sm`
- Settlements container: `rounded-2xl` -> `rounded-xl`
- Settlement rows: `rounded-xl` -> `rounded-lg`
- Debt detail cards: `border border-b rounded-xl` -> `border border-[var(--border)] rounded-lg`
- Split method buttons: `rounded-xl` -> `rounded-lg`, `border-b` -> `border-[var(--border)]`
- Custom split inputs container: `rounded-xl` -> `rounded-lg`
- Custom split input fields: `border border-b` -> `border border-[var(--border)]`
- Preview container: `rounded-xl` -> `rounded-lg`
- Form inputs (amount, description, category): `border border-b` -> `border border-[var(--border)]`
- History items: `border-b border-b` -> `border-b border-[var(--border)]`
- Balance colors (`text-success`, `text-danger`): untouched
- Avatar colors (`bg-accent/20`): untouched
- Framer Motion animations: untouched

### `src/components/Menu.tsx`
- All form inputs (6 total): `border border-b` -> `border border-[var(--border)]`
- Day cards: added `backdrop-blur-sm`
- Meal divider: `border-t border-b` -> `border-t border-[var(--border)]`
- Timer colors: untouched
- Day emojis: untouched
- Framer Motion animations: untouched

## NOT Modified
- No HTML structure changes
- No Framer Motion animations changed
- No logic, state, data fetching, or event handlers changed
- No functional colors (success/danger, event colors, post-it colors)
- No timer functionality

## Build Verification
- `tsc --noEmit`: pass (0 errors)
- `next build`: pass (all routes compile)

## Verification Checklist
- [ ] Board: drop overlay has subtler dashed border, notes have backdrop blur, form inputs have explicit borders
- [ ] Calendar: month cards have tighter corners, grid cells use theme border color, nav buttons consistent
- [ ] Expenses: summary cards have backdrop blur, settlements/debt cards have tighter corners, all inputs themed
- [ ] Menu: day cards have backdrop blur, all form inputs themed, meal divider uses theme border
- [ ] No functionality regressions
