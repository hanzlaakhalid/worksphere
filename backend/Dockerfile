# --- Build stage: compile TypeScript and generate the Prisma client ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# `prisma generate` only reads the schema, but prisma.config.ts resolves
# DATABASE_URL eagerly just to load - a placeholder is enough at build time
# since no database connection is actually made here.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Full node_modules (not just prod deps) is copied so the generated Prisma
# client/query engine from the build stage, and the `prisma` CLI used by the
# migrate-deploy step below, are both available without regenerating anything.
# Trade-off: this also ships prisma's own devDependency tree (Prisma Studio's
# React-based UI, mysql2, etc.), which `npm audit` flags - none of that code
# path is reachable through this app's HTTP surface (we never invoke `prisma
# studio` here, and we only ever connect to Postgres, never MySQL), but a
# hardened production image would run migrations as a separate one-off step
# and ship only `npm ci --omit=dev` plus the generated client.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
