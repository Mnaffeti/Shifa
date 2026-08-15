# SHIFA API

Next.js backend for the SHIFA medical workspace. Replaces the browser
`localStorage` stores the Vite frontend previously used, with Postgres
(Supabase) behind Prisma.

## Setup

```bash
cd api
npm install
cp .env.example .env.local     # then fill in the values
```

### Environment variables

Get the connection strings from **Supabase → Project Settings → Database**.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled connection, port **6543**, keep `?pgbouncer=true`. Used at runtime. |
| `DIRECT_URL` | Direct connection, port **5432**. Prisma Migrate needs this — migrations can't run through the pooler. |
| `SESSION_SECRET` | ≥32 chars, signs the session cookie. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SEED_PASSWORD` | Password assigned to the two demo accounts by the seed script. |
| `ALLOWED_ORIGIN` | Origin of the Vite frontend, for CORS. Vite uses `:3001` when `:3000` is taken. |

`.env.local` is gitignored. Never commit real credentials.

### Create the schema and seed

```bash
npm run db:push     # push schema to Supabase (or: npm run db:migrate)
npm run db:seed     # 20 demo patients, a week of appointments, 2 accounts
npm run dev         # http://localhost:4000
```

Verify with `curl http://localhost:4000/api/health` → `{"status":"ok","database":"connected"}`.

Demo accounts after seeding: `doctor@shifa.com` and `secretary@shifa.com`,
both with whatever you set as `SEED_PASSWORD`.

## Endpoints

`GET /` lists them all. Every route except `/api/health` requires a session.

| Group | Routes |
| --- | --- |
| Auth | `POST /api/auth/login`, `/signup`, `/logout` · `GET /api/auth/me` |
| Patients | `GET POST /api/patients` · `GET PATCH DELETE /api/patients/:id` |
| Charts | `GET PATCH /api/patients/:id/chart` · notes and attachments sub-routes |
| Appointments | `GET POST /api/appointments` · `PATCH DELETE /api/appointments/:id` |
| Consultations | `GET POST /api/consultations` · `GET PATCH /api/consultations/:id` · `/sign`, `/unlock`, `/addenda` |
| Reminders | `GET POST /api/reminders` · `PATCH DELETE /api/reminders/:id` |
| Waitlist | `GET POST /api/waitlist` |

## Behaviour worth knowing

**Access control.** A doctor sees only patients where `assignedDoctor` matches
their name; a secretary sees everyone. Deleting a patient is secretary-only.
Signing and unlocking a consultation is doctor-only. These rules live in
`lib/api.ts` (`patientScope`, `canAccessPatient`) so they can't drift apart.

**Signed consultations are immutable.** `PATCH /api/consultations/:id` returns
409 once a consultation is signed. Amend it with `POST .../addenda` (preserves
the audit trail) or reopen it with `POST .../unlock` — the latter only for the
doctor who signed it.

**Sessions** are stateless signed cookies (HMAC-SHA256, httpOnly, 7 days).
The old model kept the user object in `localStorage`, where anyone could edit
their own role; identity now comes from the server on every request.

**Passwords** are bcrypt hashes. The previous localStorage accounts stored
plaintext, so they cannot be migrated — accounts must be re-created.

**Attachments** are base64 in a Postgres column, matching the original model.
Chart responses omit the blobs unless `?withAttachmentData=1`; fetch a single
attachment's payload from its own endpoint. Uploads are capped at ~6 MB. If
attachment volume grows, move these to Supabase Storage and keep only the key.
