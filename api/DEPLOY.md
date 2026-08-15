# Deploying to Vercel

Two Vercel projects from one repo: the Next.js API (`api/`) and the Vite SPA
(`Shifa/`). Deploy the API first — the frontend needs its URL.

## 0. Before anything

**Rotate the Supabase database password.** The development password was
exposed in a shared context. Supabase → Settings → Database → Reset database
password, then use the new value below.

**Commit `api/`.** It currently sits outside the git repo, so Vercel can't see
it. From the repo root (`Shifa/`), either move `api/` inside the repo or add it
as a second root. Verify `api/.env` is NOT committed:

```bash
git status --porcelain | grep -i "\.env$"   # must print nothing
```

## 1. API project

**New Project** → same repo → **Root Directory: `api`**. Framework preset
Next.js is detected automatically.

Environment variables (Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Supabase **pooled** URL, port 6543, with `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase **session-mode pooler** URL, port 5432 |
| `SESSION_SECRET` | A fresh 64-char secret — *not* the development one |
| `ALLOWED_ORIGIN` | Frontend URL, e.g. `https://shifa.vercel.app` (no trailing slash) |
| `CROSS_SITE_COOKIE` | `true` — required, since the two projects are on different domains |
| `SEED_PASSWORD` | Only if you intend to seed demo data |

Generate a production `SESSION_SECRET`:

```bash
node -e "console.log(crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,''))"
```

> Use the **pooler** hostname (`aws-1-<region>.pooler.supabase.com`) for both
> URLs. The direct `db.<ref>.supabase.co` host is IPv6-only and unreachable
> from many networks. Serverless functions also open many short-lived
> connections, which is exactly what the pooler exists to absorb.

Deploy, then check `https://<api>.vercel.app/api/health` → `{"status":"ok","database":"connected"}`.

## 2. Frontend project

**New Project** → same repo → **Root Directory: `Shifa`**. Vite preset,
build `npm run build`, output `dist`.

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://<your-api>.vercel.app` (no trailing slash) |
| `VITE_GROQ_API_KEY` | Only if the consultation chatbot is used |

`VITE_*` values are **baked in at build time**, not read at runtime — changing
one requires a redeploy, not just a restart.

## 3. Schema

Vercel builds don't run migrations. Push the schema once from your machine,
pointed at the production database:

```bash
cd api
npx prisma db push          # uses api/.env
```

To create real accounts without the demo patients, register through the app's
signup form. `npm run db:seed` refuses to run against a production database
unless `ALLOW_PROD_SEED=true`, since it inserts fictional medical records.

## 4. Verify

1. `GET /api/health` returns `database: connected`
2. Log in through the deployed frontend
3. Reload the page — if you stay signed in, cross-site cookies are working
4. DevTools → Network: no CORS errors, no 401s after login

## Things that actually go wrong

**Logged out on every refresh.** `CROSS_SITE_COOKIE` isn't `true`, so the
browser drops a `SameSite=Lax` cookie on cross-origin calls. Login appears to
succeed, then every request is anonymous.

**CORS errors.** `ALLOWED_ORIGIN` must match the frontend origin exactly —
scheme included, no trailing slash. Vercel *preview* deployments get unique
URLs that won't match; add them to the list or test on production.

**`Can't reach database server`.** Using the IPv6-only direct host instead of
the pooler.

**Prisma client errors at runtime.** `npm run build` runs `prisma generate`
first — keep that in the build script.

## Note on protected health information

This app stores patient records, and the demo seed contains fictional medical
data. Before any real clinical use: the deployment needs access controls
beyond a shared demo login, an audit trail, a backup policy, and a review
against the health-data rules that apply in your jurisdiction. A public Vercel
URL with seeded demo accounts is not a safe place for real patient data.
