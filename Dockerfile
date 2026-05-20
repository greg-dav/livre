FROM node:20-alpine AS build-client
WORKDIR /build
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client/ ./client/
RUN npm run build --prefix client
# outputs to /build/server/public (vite outDir: ../server/public)

FROM node:20-alpine AS build-server
WORKDIR /build
COPY server/package*.json ./
RUN npm ci
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npm run build
# outputs to /build/dist/

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=build-server /build/dist ./dist
COPY --from=build-client /build/server/public ./public
# schema.sql must live beside its compiled caller in dist/db/
COPY server/src/db/schema.sql ./dist/db/schema.sql

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "dist/index.js"]
