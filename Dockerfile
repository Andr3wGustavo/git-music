# Multi-Stage Dockerfile for Git-Music Global Relay & Daemon
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and daemon package manifests
COPY package.json ./
COPY daemon/package*.json daemon/
COPY daemon/tsconfig.json daemon/

# Install dependencies and compile TypeScript
RUN npm --prefix daemon install
COPY daemon/src daemon/src
RUN npm --prefix daemon run build

# Production Image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY daemon/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/daemon/dist ./dist

EXPOSE 8080
EXPOSE 4848
EXPOSE 4849

CMD ["node", "dist/cloud/standaloneRelay.js"]
