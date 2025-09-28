# --- Builder ---
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Runner ---
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev
# Copy server and built frontend
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist
# Server runtime helpers
COPY --from=builder /app/src/lib/logger.js ./src/lib/logger.js
COPY --from=builder /app/src/lib/metrics.js ./src/lib/metrics.js
EXPOSE 8080
CMD ["node", "server.js"]
