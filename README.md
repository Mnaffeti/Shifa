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
