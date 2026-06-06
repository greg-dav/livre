# ---- build stage ----
FROM node:20-alpine AS builder
# better-sqlite3 ships a native addon; compiling it on musl needs a toolchain.
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Manifests first so the npm ci layer is cached until a dependency actually changes.
# This is an npm-workspaces monorepo: one root lockfile installs every workspace.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY fe-libs/ui/package.json ./fe-libs/ui/
COPY fe-libs/primitives/package.json ./fe-libs/primitives/
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN npm ci

COPY . .

# Build @livre/types + client (Vite -> server/public), then the server (tsc -> server/dist).
# schema.sql must sit beside its compiled caller in dist/db/.
RUN npm run build \
 && npm run build -w server \
 && mkdir -p server/dist/db \
 && cp server/src/db/schema.sql server/dist/db/schema.sql

# Strip devDependencies (Vite, TypeScript, sharp, vitest, tsx, …) from node_modules. prune never
# rebuilds, so the already-compiled better-sqlite3 addon survives and the runtime stage needs no
# build toolchain.
RUN npm prune --omit=dev

# ---- runtime stage ----
# Fresh node:20-alpine with no python3/make/g++ — same musl/Node ABI as the builder, so the
# prebuilt better-sqlite3 addon loads as-is.
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

# Pruned production deps (with the prebuilt better-sqlite3 addon) and the workspace manifests the
# @livre/types symlink resolves against, then the compiled server, the @livre/types build it
# imports, and the client bundle it serves.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/package.json ./server/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/public ./server/public

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
