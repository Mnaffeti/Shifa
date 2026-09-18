# SHIFA — Project Rules for Claude

## Design

**Color is welcome.** The earlier "no colors" rule is retired — the UI should feel alive and warm, not monochrome. Use color *with intent* to encode meaning, separate categories, and add vivacity.

### Palette

- **Brand:** `primary` `#1A4747` (deep teal), `accent` `#C8E04A` (lime), `teal-light` `#3DD6D0`, `amber` `#FFCF44`, `gold` `#F5C518`. Defined in `client/src/index.css`.
- **Status:** `pending` `#F59E0B` / `pending-bg` `#FEF3C7`; `completed` `#06B6D4` / `completed-bg` `#CFFAFE`.
- **Soft tinted surfaces (Tailwind):** `*-50`/`*-100` shades from `amber`, `emerald`, `sky`, `rose`, `violet`, `cyan`, `indigo`, `teal` are all fair game for icon containers, badges, alert blocks, and category tints.

### Usage guidance

- **Icons may have colored containers.** Pair a `bg-<color>-50` chip with a `text-<color>-600` icon — this is encouraged on stat cards, summary tiles, and section-card heads.
- **Severity stays semantic:** red for allergies/critical, amber for warnings/follow-up, emerald/green for done/healthy, sky/blue for informational, primary teal for "active now".
- **Charts** can use the full brand palette — don't force grayscale bars.
- **Text weight** is still `font-medium` / `font-normal` for body and data; reserve `font-bold` for headings or emphasis. (This part of the old rule stays.)
- **Don't oversaturate one view.** A dashboard tile can be amber; the card next to it might be sky; the next emerald — but limit to ~4 distinct hues per surface so it reads as intentional, not chaotic.

### Hover & vivacity (accent green `#C8E04A`)

Cards and interactive list-rows must come alive on hover with the brand `accent`. Use these utility classes from `client/src/index.css` rather than redefining the hover treatment ad-hoc:

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

## Layout

- `client/` — doctor app (React + Vite). Most UI work happens here.
- `admin/` — back office (React + Vite). Admin-only: doctor accounts, requests, activity.
- `server/` — API (Next.js + Prisma).
- Root holds stack-level config only: `docker-compose.yml`, `nginx*.conf`, `vercel.json`.

`admin/` re-uses `client/`'s design system verbatim (`src/index.css` is a copy:
same tokens, `.card`, `.hover-card`, `.hover-row`, `.pulse-accent`). Keep the two
in sync — a token change in one belongs in the other.

## Routing

`client/` uses `react-router-dom`. URLs are French and stable — a doctor may
bookmark or share one:

| Path | View |
|---|---|
| `/` | dashboard |
| `/patients` · `/patients/:patientId` | archive · one open file |
| `/agenda` | schedule |
| `/parametres` | settings |
| `/connexion` · `/demande-de-compte` | pre-login |

The Navbar still speaks in view ids (`dashboard`, `patients`…); `App.tsx`
translates between those and paths. `admin/` stays on tab state — it has no
shareable deep links.

## Stack

- React 19 + TypeScript 5.8 + Vite + Tailwind CSS
- `react-router-dom` for routing (client only)
- `motion/react` (Framer Motion) for animations
- `lucide-react` for all icons
- `date-fns` with `fr` locale for date formatting
- Context API + localStorage for all state persistence

## Architecture

- Two roles: `DOCTOR` (the only clinical role; signs in with a matricule) and `ADMIN` (back office — creates doctor accounts and reviews doctor account requests, no patient data)
- **Free trial**: `Account.trialEndsAt` (null = unlimited). Set at provisioning, checked on every request via `isTrialExpired` in `server/lib/trial.ts` — expiry is computed, never written by a job, so there is no cron and no lag. An expired trial blocks sign-in *and* invalidates a live session; admins extend or convert from the Médecins page.
- **Every back-office action is audited** (`AuditLog`, written by `recordAudit` in `server/lib/audit.ts`). The log is append-only — there is no endpoint to edit or delete an entry — and entries copy in the actor and target names at write time, so they still read correctly after a rename or deletion. Never log a password, even a temporary one.
- **Back-office activity comes from `Account`** (`lastLoginAt`, `loginCount`), not from the old `DemoLead` table — that one was written outside the account transaction and drifted. `DemoLead` is deprecated and no longer read or written.
- **Reminders are private to their author** (`Reminder.authorId`), not a shared board: they quote patients by name. `authorName` is a display label only.
- **Record ownership is `doctorId`, never the doctor's name.** `Patient.assignedDoctor`, `Appointment.doctor` and `Consultation.doctor` are display labels only; every authorization check and every count goes through `doctorId` (`patientScope` / `canAccessPatient` in `server/lib/api.ts`). Renaming a doctor refreshes those labels in the same transaction, except on signed consultations, which keep the name they were signed under.
- Contexts: `AuthContext`, `AppointmentContext`, `PatientContext`, `ChartContext`, `ConsultationContext`
- Wrap order in App.tsx: `ChartProvider > ConsultationProvider > PatientProvider > AppointmentProvider`
