# syntax=docker/dockerfile:1
FROM gcc:14-bookworm AS native
WORKDIR /source
COPY shared ./shared
COPY engines/engine-1 ./engines/engine-1
RUN g++ -std=c++20 -O2 -static -s -Ishared/include -Ishared/third_party \
    engines/engine-1/main.cpp engines/engine-1/protocol.cpp engines/engine-1/search.cpp \
    shared/src/geometry.cpp shared/src/hex_rules.cpp shared/variants/*.cpp \
    -o /engine-one

FROM node:24-bookworm-slim AS api-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json
COPY manager/package.json ./manager/package.json
COPY cloud/engine-worker/package.json ./cloud/engine-worker/package.json
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --workspace @hexars/api --include-workspace-root --strict-ssl=true
COPY shared/protocol ./shared/protocol
COPY api ./api
RUN npm run build:api
RUN npm prune --omit=dev --workspace @hexars/api --include-workspace-root

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8080 HEXARS_ENGINE_PATH=/app/engine-one
WORKDIR /app
COPY --from=api-build --chown=node:node /app/node_modules ./node_modules
COPY --from=api-build --chown=node:node /app/api/dist/server.mjs ./server.mjs
COPY --from=native --chown=node:node /engine-one ./engine-one
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD node -e 'fetch("http://127.0.0.1:8080/health").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))'
CMD ["node", "server.mjs"]
