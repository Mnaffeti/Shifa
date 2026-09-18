# SHIFA

Clinic management for doctors — React 19 + Vite frontend, Next.js 16 + Prisma API, Postgres.

## Layout

```
.
├── client/     doctor app — React + Vite (own package.json, Dockerfile)
├── admin/      back office — React + Vite (own package.json, Dockerfile)
├── server/     API — Next.js + Prisma (own package.json, Dockerfile)
├── docker-compose.yml   orchestrates all three + postgres
├── nginx.conf           serves client/, proxies /api
├── nginx.admin.conf     serves admin/, proxies /api
└── vercel.json          production deploy config
```

Each app owns its dependencies; there is no root `package.json`. Anything at
the root configures the stack as a whole.

`admin/` carries its own trimmed copy of the API client and auth context —
the back office never touches patients, charts or consultations, so those
modules are absent rather than shipped unused.

## Run with Docker Compose (recommended)

Starts the database, API and frontend together. Requires Docker only — no Node install.

```bash
docker compose --env-file .env.docker up -d --build
```

Then open **http://localhost:8080**.

Sign in with the seeded demo doctor:

| Field | Value |
|---|---|
| Matricule | `DOC-0001` |
| Password | whatever `SEED_PASSWORD` is set to in `.env.docker` |

### Record ownership

Patients, appointments, consultations and reminders are owned by an account id
(`doctorId`, or `authorId` on reminders), not by the doctor's name. The name is kept alongside as a display label
and refreshed whenever the doctor is renamed.

Upgrading a database created before this change needs the one-off backfill,
which matches existing rows by name:

```bash
cd server && npm run db:backfill-doctor-id
```

### Free trial

A doctor account provisioned through the back office gets a free trial —
14 days by default, configurable with `TRIAL_DAYS` on the API.

The clock starts at account creation, so the back office has a predictable end
date. Once it runs out the account cannot sign in, and any session it already
holds stops working on the next request. Patient records are untouched.

Admins lift it from the Médecins page (the calendar button on a row): extend by
7, 14 or 30 days, or grant unlimited access. Extending an already-lapsed trial
counts from today, not from the old end date. Both actions are audited.

Accounts with no `trialEndsAt` — the seeded demo doctor, and every admin — have
unlimited access.

### Administrators

The back office manages its own accounts under **Administrateurs**. Two refusals
protect against locking everyone out: you cannot delete your own account, and
you cannot delete the last remaining admin. The `db:create-admin` script stays
as the way to bootstrap the very first one.

### Audit trail

Every action an admin takes on an account — create, edit, activate, deactivate,
delete, reset password, accept or reject a request — is recorded in `AuditLog`
and shown under **Journal** in the back office.

It is append-only: the API exposes a read endpoint only, so no operator can
rewrite their own trail. Entries store the actor and target names as they were
at the time, which is why a deleted doctor still reads correctly in the log.
Passwords are never recorded.

### Lost passwords

A doctor signs in with a matricule and has no verified e-mail, so there is no
self-service reset. The back office issues a new temporary password from the
Médecins page (the circular-arrow button on a row): the old one stops working
immediately, and the doctor must choose their own on next sign-in. Until they
do, the API refuses every clinical request from that account.

The back office lives at **http://localhost:8081** and needs an ADMIN account,
which the seed does not create. Make one with:

```bash
cd server
ADMIN_EMAIL="admin@shifa.com" ADMIN_PASSWORD="choose-a-strong-one" npm run db:create-admin
```

Or, against the running stack:

```bash
docker compose --env-file .env.docker exec   -e ADMIN_EMAIL="admin@shifa.com" -e ADMIN_PASSWORD="choose-a-strong-one"   api npx tsx prisma/create-admin.ts
```

### Services

| Service | Host port | Purpose |
|---|---|---|
| `web` | 8080 | Doctor app (nginx). Proxies `/api` to the API. |
| `admin` | 8081 | Back office (nginx). Proxies `/api` to the API. |
| `api` | 4000 | Next.js API. Published for curl/Postman; the apps don't use it. |
| `postgres` | 5432 | Database. Data lives in the `shifa-db-data` volume. |

Both frontends proxy `/api` through their own nginx rather than calling port
4000 directly, so the session cookie stays first-party on each origin.

### One session per browser

Cookies are scoped by host, **not by port**, so `localhost:8080` and
`localhost:8081` share a single session. Signing in to one signs you into the
other — you cannot hold a doctor and an admin session in the same browser
window at once. This is how browsers work, not an app bug.

To use both side by side, open one in a **private window** or a second browser.

Each app rejects the role it is not for: the back office refuses a doctor
session, and the doctor app shows an admin where to go instead. The API is the
real boundary — every clinical route requires role `DOCTOR` (`requireDoctor`
in `lib/api.ts`), so an admin session gets a 403 there regardless of which
frontend sent it.

The browser talks only to port 8080. nginx proxies `/api` to the API container so
both share one origin and the session cookie stays first-party — the same shape
production gets from the rewrite in `vercel.json`. Pointing the frontend directly
at port 4000 would make the cookie third-party, which Safari blocks outright.

### Common commands

```bash
docker compose --env-file .env.docker logs -f        # follow logs
docker compose --env-file .env.docker ps             # status
docker compose --env-file .env.docker restart api    # restart one service
docker compose --env-file .env.docker down           # stop (data survives)
docker compose --env-file .env.docker down -v        # stop and WIPE the database
```

After changing application code, rebuild:

```bash
docker compose --env-file .env.docker up -d --build
```

### Configuration

`.env.docker` holds ports, database credentials and secrets. It is gitignored.
`SESSION_SECRET` and `SEED_PASSWORD` are required; the stack refuses to start
without them.

The API seeds demo data (1 doctor, 20 patients, 37 appointments) only when the
database has no accounts, so restarts never disturb existing data. Set
`SEED_ON_START=false` to start blank.

> `ALLOW_PROD_SEED=true` in `.env.docker` exists because the container runs with
> `NODE_ENV=production`, and `seed.ts` refuses to seed a production database
> without it. That guard protects real deployments — never set it against one.

### The chatbot

`VITE_GROQ_API_KEY` in `.env.docker` is empty by default, so the consultation
assistant shows a "missing key" notice instead of failing. Set it and rebuild to
enable it.

> **Warning:** any `VITE_`-prefixed value is inlined into the public browser
> bundle at build time. A key set here is readable by anyone who opens devtools.
> It belongs behind a server route before this ships.

## Run locally without Docker

Requires Node 22+ and a Postgres instance.

```bash
cd server && npm install && npm run db:push && npm run db:seed
npm run dev                  # API        → localhost:4000

cd ../client && npm install
npm run dev                  # doctor app → localhost:3000

cd ../admin && npm install
npm run dev                  # back office → localhost:3001
```

Copy `client/.env.example` → `client/.env` and `server/.env.example` →
`server/.env.local`, then fill in the values.
