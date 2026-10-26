# Image de production pour Atlas Dépêche (Next.js 16)
# Compatible Northflank, Railway (Docker), Render et tout hébergeur conteneurisé.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Le dossier public est optionnel dans le dépôt : on le crée pour que la copie
# vers l'image finale ne casse jamais.
RUN mkdir -p /app/public && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ffmpeg est requis par le module publicitaire (génération vidéo).
RUN apk add --no-cache ffmpeg

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/public       ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 3000
CMD ["npm", "run", "start"]
