# Multi-stage Dockerfile for Replit Node.js/Express projects
# Optimized for both TypeScript and JavaScript projects with PostgreSQL support

# Stage 1: Builder - TypeScript compilation and dependency installation
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript if tsconfig.json exists, otherwise skip
RUN if [ -f "tsconfig.json" ]; then \
      npm run build || echo "No build script found, skipping build"; \
    fi

# Stage 2: Production - Minimal runtime image
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder stage
# Handle both dist/ (TypeScript) and server/ (common Replit structure) outputs
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || true
COPY --from=builder --chown=nodejs:nodejs /app/server ./server 2>/dev/null || true
COPY --from=builder --chown=nodejs:nodejs /app/client ./client 2>/dev/null || true

# Copy remaining application files
COPY --chown=nodejs:nodejs . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application - try multiple common entry points
CMD ["sh", "-c", "node dist/index.js || node server/index.js || node dist/server/index.js || npm start"]
