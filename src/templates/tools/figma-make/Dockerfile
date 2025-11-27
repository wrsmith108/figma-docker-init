# Figma Make Project Dockerfile
# Optimized for React + Vite + TypeScript (classic stack)
# Port: 5173 or 3000 (configurable)

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

# Ensure serve.json exists for static file serving (create default SPA config if missing)
RUN if [ ! -f serve.json ]; then echo '{"rewrites":[{"source":"**","destination":"/index.html"}],"cleanUrls":true}' > serve.json; fi

# Build the Vite application
RUN npm run build

# Normalize build output directory to 'dist' for consistency
# Handles custom vite.config.ts with build.outDir = "build"
RUN if [ -d "build" ] && [ ! -d "dist" ]; then \
      mv build dist; \
    fi

# Stage 2: Production
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve@14

# Copy built assets from builder (now always in dist/ directory)
COPY --from=builder /app/dist ./dist
# Copy serve.json for static file server configuration (compression, caching, SPA routing)
COPY --from=builder /app/serve.json ./serve.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S figma -u 1001 && \
    chown -R figma:nodejs /app

# Switch to non-root user
USER figma

# Expose configurable port (default 5173)
EXPOSE {{PORT}}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with serve (using serve.json for compression, caching, SPA routing)
CMD ["serve", "-s", "dist", "-l", "{{PORT}}", "-c", "serve.json"]
