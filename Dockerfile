FROM node:20-alpine
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

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "server/dist/index.js"]
