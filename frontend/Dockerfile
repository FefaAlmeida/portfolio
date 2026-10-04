FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

FROM dependencies AS development
COPY frontend/ ./
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p /app/.next && chown node:node /app /app/.next
USER node
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM dependencies AS build
COPY frontend/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
FROM node:24-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
