# Bolt Project Dockerfile
# Optimized for Remix + Vite + TypeScript stack
# StackBlitz WebContainer compatibility
# Port: 5173 (Vite default)

# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the Remix application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

# Copy server entry point if exists
COPY --from=builder /app/server.* ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bolt -u 1001 && \
    chown -R bolt:nodejs /app

# Switch to non-root user
USER bolt

# Expose Vite default port
EXPOSE {{PORT}}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the Remix server
CMD ["npm", "run", "start"]
