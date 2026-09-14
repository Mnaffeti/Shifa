# ── SHIFA frontend — Vite build served by nginx ─────────────────────────────
# nginx also reverse-proxies /api to the backend, so the browser sees a single
# origin and the session cookie stays first-party — the same shape production
# gets from the rewrite in vercel.json.

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* at build time, so these are build args, not runtime env.
# VITE_API_URL is deliberately empty: requests go to /api on nginx's own
# origin. Pointing it at http://localhost:4000 would make the cookie
# third-party and every authenticated call would come back 401.
ARG VITE_API_URL=""
ARG VITE_GROQ_API_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
RUN npm run build

# ── runtime ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html

# nginx.conf is NOT copied here: it is stack configuration living at the repo
# root, and compose bind-mounts it at runtime. Editing it therefore needs only
# a restart, not an image rebuild.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
