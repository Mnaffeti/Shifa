# ── SHIFA API — Next.js 16 + Prisma ─────────────────────────────────────────
# Multi-stage: deps → build → runtime, so the final image carries no compiler
# toolchain and no dev dependencies.

FROM node:22-alpine AS base
# Prisma's engines are built against glibc; Alpine needs this shim.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── deps: full install (dev deps included — the build needs prisma + tsc) ───
FROM base AS deps
COPY server/package.json server/package-lock.json ./
RUN npm ci

# ── build ───────────────────────────────────────────────────────────────────
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY server/ ./

# `prisma generate` reads the datasource block, which references these vars.
# They are never connected to at build time — the value only has to parse.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=4000

# Prisma CLI (db push / seed) is a devDependency, so keep the full tree here
# rather than pruning: the entrypoint runs migrations on boot.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
COPY server/package.json server/next.config.ts server/proxy.ts server/tsconfig.json ./
COPY server/prisma ./prisma
COPY server/app ./app
COPY server/lib ./lib

COPY server/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
