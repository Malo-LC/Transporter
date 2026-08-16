# Build stage
FROM oven/bun:1.3.14 AS builder

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./
COPY app/package.json ./app/
COPY api/package.json ./api/

RUN bun install --frozen-lockfile

COPY app ./app
COPY api ./api
COPY biome.json ./

RUN bun run --filter app build \
  && bun run --filter api build \
  && rm -rf api/dist/static \
  && cp -r app/build api/dist/static

# Production stage
FROM oven/bun:1.3.14-slim AS production

WORKDIR /app

ARG VERSION=dev
ARG REVISION=unknown
ARG CREATED=unknown

LABEL org.opencontainers.image.title="transporter" \
  org.opencontainers.image.version="${VERSION}" \
  org.opencontainers.image.revision="${REVISION}" \
  org.opencontainers.image.created="${CREATED}"

ENV NODE_ENV=production

COPY --from=builder /app/api/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "dist/index.js"]
