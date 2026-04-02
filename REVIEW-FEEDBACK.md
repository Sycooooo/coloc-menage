# Review Feedback — Step 5c: Restyle Board, Calendar, Expenses, Menu

## Verdict: APPROVED (after fix)

All 5 files pass every check. One non-blocking issue found (`hover:border-b-hover` leftover in Expenses.tsx) — fixed in follow-up.

---

## Checklist

| Check | Status |
|---|---|
| Only CSS classes changed, no logic modifications | PASS |
| Border radii reduced consistently | PASS |
| backdrop-blur-sm added where specified | PASS |
| border-[var(--border)] replaces ambiguous border-b colors | PASS |
| Post-it colors (NOTE_COLORS) untouched | PASS |
| Event colors (COLORS, COLOR_DOTS) untouched | PASS |
| Timer colors/functionality untouched | PASS |
| Framer Motion animations untouched | PASS |
| No remaining double border-b patterns | PASS |

---

## Detail

**Board.tsx** — Drop overlay `rounded-2xl` → `rounded-xl`, dashed border softened to `border-accent/40`. 4 form inputs (toolbar divider, textarea, image preview, link input) switched from `border-b` to `border-[var(--border)]`. One `rounded-xl` remains on drop overlay inner box — appropriate for that element size. No logic changes.

**BoardNote.tsx** — Main note card `rounded-xl` → `rounded-lg`, `backdrop-blur-sm` added. NOTE_COLORS (8 colors) untouched. `border-current/10` and `border-current/20` remain on editing UI — intentional (inherits note color). Framer Motion layout/hover/exit props identical.

**Calendar.tsx** — 12 instances of `border-b` → `border-[var(--border)]` across nav buttons, month cards, day header, grid cells, form inputs. Month cards: `rounded-xl` → `rounded-lg`. Follow-up commit added `bg-[#161628]/65` with `backdrop-blur-sm` for lofi transparency. Event colors (COLORS, COLOR_DOTS) untouched. Today marker (`bg-accent text-white`) untouched.

**Expenses.tsx** — `rounded-2xl` → `rounded-xl` (settlements card), `rounded-xl` → `rounded-lg` (6 instances: settlement items, debt cards, split buttons, custom split container, preview). `backdrop-blur-sm` on both summary cards + settlements card. All form inputs themed. Functional colors (`text-success`, `text-danger`) preserved. **Fix applied:** `hover:border-b-hover` → `hover:border-accent/30` on split method buttons (line 548).

**Menu.tsx** — 7 form inputs/selects themed with `border-[var(--border)]`. `backdrop-blur-sm` on day cards. Lunch/dinner divider: `border-t border-b` → `border-t border-[var(--border)]`. Timer colors and functionality untouched. Day emojis untouched.

---

## Fix Applied

- `Expenses.tsx:548` — `hover:border-b-hover` → `hover:border-accent/30` (consistent hover border with lofi theme)

Ship it.
