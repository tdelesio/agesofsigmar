# Stage 1: Install dependencies and build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files first for optimal docker layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application files and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy runtime dependencies and build artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Ensure the data directory contents are available for bootstrap seeding
COPY --from=builder /app/app/data/default-factions.json ./app/data/default-factions.json
COPY --from=builder /app/app/data/default-factions-backup.ts ./app/data/default-factions-backup.ts
COPY --from=builder /app/app/data/default-factions.ts ./app/data/default-factions.ts

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
