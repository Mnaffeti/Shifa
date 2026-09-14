#!/bin/sh
# Prepare the database, then hand off to the CMD (the Next.js server).
set -e

echo "[entrypoint] waiting for postgres…"
# `prisma db push` doubles as the readiness probe: it fails while the server
# is still starting, so retry rather than racing it.
i=0
until npx prisma db push --skip-generate >/tmp/dbpush.log 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] database unreachable after 30 attempts:"
    cat /tmp/dbpush.log
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] schema in sync"

# Seed only when the database holds no accounts, so a restart never disturbs
# real data. The seed itself is idempotent; this just keeps boot quiet.
if [ "${SEED_ON_START:-true}" = "true" ]; then
  COUNT=$(npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.account.count()
  .then(async n => { console.log(n); await p.\$disconnect(); })
  .catch(async () => { console.log('ERR'); await p.\$disconnect(); });
" 2>/dev/null | tail -1)

  if [ "$COUNT" = "0" ]; then
    echo "[entrypoint] empty database — seeding…"
    # Non-fatal: a failed seed must not crash-loop the container and take the
    # API down with it. The app still boots; the log says what went wrong.
    npx tsx prisma/seed.ts || echo "[entrypoint] WARNING: seed failed — starting anyway"
  elif [ "$COUNT" = "ERR" ] || [ -z "$COUNT" ]; then
    echo "[entrypoint] WARNING: could not read account count — skipping seed"
  else
    echo "[entrypoint] $COUNT account(s) present — skipping seed"
  fi
fi

echo "[entrypoint] starting API on port ${PORT:-4000}"
exec "$@"
