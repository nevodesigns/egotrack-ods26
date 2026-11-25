# One image, built from the repo root, holding both the web app and the
# server. See ~/odS_hack/plan/06_ARCHITECTURE.md: one process, one server.

# ---- build the web app ----
FROM node:22-slim AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---- build the server ----
FROM node:22-slim AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# ---- the image that actually runs ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

COPY --from=server-build /app/server/dist ./server/dist
COPY --from=web-build /app/web/dist ./web/dist
COPY db/ ./db/

RUN mkdir -p /app/server/uploads

EXPOSE 8787
CMD ["node", "server/dist/index.js"]
