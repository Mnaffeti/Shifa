# SHIFA — Project Rules for Claude

## Design

- **No colors.** Use neutral grays throughout: `bg-bg-soft`, `border-border-subtle`, `text-text-muted`, `text-text-primary`. Do not use Tailwind color utilities like `bg-red-50`, `text-green-700`, `border-blue-100`, `bg-orange-50`, etc. on UI cards, section backgrounds, or data rows.
- The only exceptions are: the primary brand color (`text-primary`, `bg-primary`), explicit error/allergy alerts (keep red sparingly for critical safety warnings only), and status badges already established in the codebase.
- Icons should be colorless — use `text-text-muted/50` or similar neutral classes, no colored icon containers.
- Text should be `font-medium` or `font-normal`, not `font-black` or `font-extrabold` for body/data text.

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
