# SHIFA — Project Rules for Claude

## Design

**Color is welcome.** The earlier "no colors" rule is retired — the UI should feel alive and warm, not monochrome. Use color *with intent* to encode meaning, separate categories, and add vivacity.

### Palette

- **Brand:** `primary` `#1A4747` (deep teal), `accent` `#C8E04A` (lime), `teal-light` `#3DD6D0`, `amber` `#FFCF44`, `gold` `#F5C518`. Defined in `src/index.css`.
- **Status:** `pending` `#F59E0B` / `pending-bg` `#FEF3C7`; `completed` `#06B6D4` / `completed-bg` `#CFFAFE`.
- **Soft tinted surfaces (Tailwind):** `*-50`/`*-100` shades from `amber`, `emerald`, `sky`, `rose`, `violet`, `cyan`, `indigo`, `teal` are all fair game for icon containers, badges, alert blocks, and category tints.

### Usage guidance

- **Icons may have colored containers.** Pair a `bg-<color>-50` chip with a `text-<color>-600` icon — this is encouraged on stat cards, summary tiles, and section-card heads.
- **Severity stays semantic:** red for allergies/critical, amber for warnings/follow-up, emerald/green for done/healthy, sky/blue for informational, primary teal for "active now".
- **Charts** can use the full brand palette — don't force grayscale bars.
- **Text weight** is still `font-medium` / `font-normal` for body and data; reserve `font-bold` for headings or emphasis. (This part of the old rule stays.)
- **Don't oversaturate one view.** A dashboard tile can be amber; the card next to it might be sky; the next emerald — but limit to ~4 distinct hues per surface so it reads as intentional, not chaotic.

### Hover & vivacity (accent green `#C8E04A`)

Cards and interactive list-rows must come alive on hover with the brand `accent`. Use these utility classes from `src/index.css` rather than redefining the hover treatment ad-hoc:

- `.card` — default card surface; already includes `hover:border-accent`, `hover:-translate-y-0.5`, `hover:shadow-card-hover`.
- `.hover-card` — apply to bespoke `bg-white rounded-[...] border border-border-subtle` panels that need the same hover treatment as `.card` (border-accent + lift + shadow).
- `.hover-row` — for in-card rows or list items: border-accent on hover, **no** lift.
- `.pulse-accent` — accent halo-pulse animation; use sparingly on "live now" markers (e.g. *Prochain patient* dot, *today* eyebrow dot, active-consultation indicator).

Guidelines:
- Wrap a card in `group` and use `group-hover:text-primary` / `group-hover:bg-accent/15` / `group-hover:border-accent` / `group-hover:rotate-3` on icon chips so the chip "wakes up" with the card.
- Nested rows inside an already-hovering card should use a distinct group name (`group/row` + `group-hover/row:...`) so they don't fire on parent hover.
- Disable hover treatment on disabled rows: `disabled:hover:translate-y-0 disabled:hover:border-border-subtle`.
- Keep hover transitions 200–300ms (`duration-200` / `duration-300`); avoid scale transforms that shift layout.
- A small `+` button can rotate 90° on group-hover (`group-hover:rotate-90 transition-transform duration-300`) for a playful touch on add-CTAs.

## Stack

- React 19 + TypeScript 5.8 + Vite + Tailwind CSS
- `motion/react` (Framer Motion) for animations
- `lucide-react` for all icons
- `date-fns` with `fr` locale for date formatting
- Context API + localStorage for all state persistence

## Architecture

- Two roles: `DOCTOR` and `SECRETARY` — guard role-specific UI with `user?.role === 'DOCTOR'`
- Contexts: `AuthContext`, `AppointmentContext`, `PatientContext`, `ChartContext`, `ConsultationContext`
- Wrap order in App.tsx: `ChartProvider > ConsultationProvider > PatientProvider > AppointmentProvider`
