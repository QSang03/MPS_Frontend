# Multi-stage Dockerfile to keep runtime image small (<1GB)
# Uses Next.js standalone output so runtime only needs the built server bundle.

# Base image
FROM node:20-alpine AS base
WORKDIR /app

# Install all dependencies (including dev) but skip lifecycle scripts (husky)
FROM base AS deps
ENV HUSKY=0
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

# Build stage
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runtime stage: only ship the standalone output and static assets
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Use an unprivileged user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
