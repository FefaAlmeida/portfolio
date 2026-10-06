FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm ci --omit=dev
FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

FROM runtime AS development
WORKDIR /app
ENV NODE_ENV=development PORT=3001 DATABASE_PATH=/data/portfolio.sqlite BACKUP_DIR=/data/backups
COPY --from=dependencies /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/src ./src
COPY packages/i18n /packages/i18n
COPY backend/seed ./seed
RUN mkdir /data && chown node:node /data /app
USER node
EXPOSE 3001
CMD ["node", "--watch", "src/server.js"]

FROM runtime AS production
ENV NODE_ENV=production PORT=3001 DATABASE_PATH=/data/portfolio.sqlite BACKUP_DIR=/data/backups
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY backend/package*.json ./
COPY backend/src ./src
COPY backend/scripts/repair-bold.js ./scripts/repair-bold.js
COPY packages/i18n /packages/i18n
COPY backend/seed ./seed
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3001
CMD ["node", "src/server.js"]
