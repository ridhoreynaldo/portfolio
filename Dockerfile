# syntax=docker/dockerfile:1.7
# Satu Dockerfile, dua target: migrate (one-shot: migrasi + seed) | web (Next.js standalone)

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm run build:migrate

FROM deps AS prod-deps
RUN npm prune --omit=dev

# ---------- migrate ----------
FROM node:22-bookworm-slim AS migrate
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist/migrate.mjs ./dist/migrate.mjs
COPY drizzle ./drizzle
COPY package.json ./
USER node
CMD ["node", "dist/migrate.mjs"]

# ---------- web ----------
FROM node:22-bookworm-slim AS web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
