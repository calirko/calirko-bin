# ---- production dependencies only ----
FROM oven/bun:1-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- build ----
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# ---- runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache ffmpeg \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 sveltekit \
 && mkdir -p /app/data \
 && chown sveltekit:nodejs /app/data

COPY --from=builder   --chown=sveltekit:nodejs /app/build        ./build
COPY --from=prod-deps --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --chown=sveltekit:nodejs package.json ./

USER sveltekit

EXPOSE 3000
CMD ["node", "build/index.js"]
