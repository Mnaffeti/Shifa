# ── SHIFA back office — Vite build served by nginx ──────────────────────────
# Served on its own origin (port 8081) with its own nginx, which proxies /api
# to the same backend. Keeping the call same-origin means the session cookie
# stays first-party here too.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time, so this is a build arg, not runtime env.
# Empty on purpose: requests go to /api on this nginx's own origin, which
# proxies to the api service. See nginx.admin.conf.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

# nginx.conf is NOT copied here: it is stack configuration living at the repo
# root (nginx.admin.conf), bind-mounted by compose at runtime.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
