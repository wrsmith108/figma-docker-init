# Docker Best Practices for AI-Generated Projects

**Research Date**: November 2025
**Purpose**: Inform Phase 2 template architecture for universal Docker containerization
**Scope**: Figma Make, Lovable, V0, Bolt projects

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Multi-Stage Build Patterns](#multi-stage-build-patterns)
3. [Environment Variable Strategies](#environment-variable-strategies)
4. [Port Configuration Standards](#port-configuration-standards)
5. [Build Optimization Techniques](#build-optimization-techniques)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Tool-Specific Recommendations](#tool-specific-recommendations)
9. [Cross-Platform Considerations](#cross-platform-considerations)
10. [Production Deployment Patterns](#production-deployment-patterns)

---

## Executive Summary

### Key Findings

**Universal Docker patterns work across all AI-generated project types**, with minor tool-specific optimizations:

- **Multi-stage builds** reduce image size by 60-80%
- **Layer caching** improves rebuild speed by 3-5x
- **Build-time vs runtime variables** critical for security
- **Standard ports** (3000 dev, 80/443 prod) work universally
- **Node.js optimization** (node_modules caching) reduces install time by 70%

### Critical Success Factors

1. **Separate dependency and build stages** for optimal layer caching
2. **Use .dockerignore** aggressively to minimize build context
3. **Never commit secrets** - use runtime environment variables
4. **Health checks** for container orchestration reliability
5. **Non-root users** for production security

---

## Multi-Stage Build Patterns

### Pattern 1: Three-Stage Build (Recommended)

**Use Case**: Production-ready React, Vue, Svelte apps (Figma Make, V0, Lovable)

```dockerfile
# Stage 1: Dependencies (cached separately)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production (minimal)
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Benefits**:
- **60-80% smaller** final image (nginx:alpine ~23MB vs node:18 ~170MB)
- **Faster rebuilds** via dependency layer caching
- **Security**: No build tools or source code in production image

**Metrics**:
- Build time (cold): ~2-3 minutes
- Build time (warm): ~15-30 seconds (cached deps)
- Image size: 25-40MB (nginx) vs 180-250MB (node)

---

### Pattern 2: Full-Stack Multi-Stage (Lovable, Bolt with Backend)

**Use Case**: Full-stack apps with Node.js backend + React frontend

```dockerfile
# Stage 1: Frontend Dependencies
FROM node:18-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Frontend Build
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 3: Backend Dependencies
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 4: Backend Build (if TypeScript)
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./
RUN npm run build || echo "No build step"

# Stage 5: Production Runtime
FROM node:18-alpine AS production
WORKDIR /app

# Copy backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Benefits**:
- **Parallel dependency installation** (frontend + backend)
- **Optimized final image** with only runtime dependencies
- **Security**: Non-root user, minimal attack surface

---

### Pattern 3: Next.js Optimized (V0, Lovable with Next.js)

**Use Case**: Next.js 13+ with App Router, Server Components

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Next.js Specific Optimizations**:
- `standalone` output mode (add to `next.config.js`):
  ```javascript
  module.exports = {
    output: 'standalone',
  }
  ```
- **85% smaller** images with standalone mode
- Automatic code splitting and tree shaking

---

### Pattern 4: Vite + HMR Development (All Tools)

**Use Case**: Development environment with hot module reload

```dockerfile
FROM node:18-alpine AS development
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Enable polling for file watching in containers
ENV CHOKIDAR_USEPOLLING=true
ENV VITE_HOST=0.0.0.0

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Development Features**:
- Hot Module Replacement (HMR) works in containers
- File watching with polling for cross-platform compatibility
- Source maps enabled for debugging

---

## Environment Variable Strategies

### Build-Time vs Runtime Variables

#### Build-Time Variables (ARG)

**Use for**: Values needed during image build, public API URLs, feature flags

```dockerfile
# Build-time arguments
ARG NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=https://api.example.com
ARG VITE_APP_VERSION=1.0.0

# Convert to ENV if needed at runtime
ENV NODE_ENV=$NODE_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
```

**Docker build command**:
```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg NEXT_PUBLIC_API_URL=https://api.prod.com \
  -t myapp:latest .
```

---

#### Runtime Variables (ENV)

**Use for**: Secrets, environment-specific configs, database URLs

```dockerfile
# Runtime environment variables (defaults)
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=""
ENV API_SECRET=""
```

**Docker run command**:
```bash
docker run \
  -e DATABASE_URL="postgresql://user:pass@db:5432/mydb" \
  -e API_SECRET="secret123" \
  -p 80:3000 \
  myapp:latest
```

**With .env file**:
```bash
docker run --env-file .env -p 80:3000 myapp:latest
```

---

### Tool-Specific Variable Patterns

#### Figma Make (React + Vite)

```dockerfile
# Build-time (baked into bundle)
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_FEATURE_FLAG_NEW_UI

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_FEATURE_FLAG_NEW_UI=$VITE_FEATURE_FLAG_NEW_UI
```

**Important**: Vite only exposes vars prefixed with `VITE_` to the client bundle.

---

#### Lovable (React + Supabase)

```dockerfile
# Build-time (public)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Runtime (backend/Edge Functions)
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV DATABASE_URL=""
ENV JWT_SECRET=""
```

**Security**: Never put service role keys in build-time args!

---

#### V0 (Next.js)

```dockerfile
# Build-time (client-side, public)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL

# Runtime (server-side only)
ENV DATABASE_URL=""
ENV API_SECRET_KEY=""
ENV NEXTAUTH_SECRET=""
ENV NEXTAUTH_URL=""
```

**Next.js Rule**: `NEXT_PUBLIC_*` = client-side, everything else = server-side only

---

#### Bolt (Remix + WebContainers)

```dockerfile
# Build-time
ARG NODE_ENV=production
ARG REMIX_PUBLIC_API_URL

# Runtime
ENV SESSION_SECRET=""
ENV DATABASE_URL=""
ENV CLOUDFLARE_API_TOKEN=""
```

---

### Secret Management Best Practices

#### ❌ **NEVER DO THIS**:
```dockerfile
# WRONG! Secret baked into image layers
ENV DATABASE_PASSWORD=supersecret123
ENV API_KEY=abc123def456
```

#### ✅ **DO THIS**:
```dockerfile
# Dockerfile: Define placeholder
ENV DATABASE_PASSWORD=""
ENV API_KEY=""
```

```bash
# Runtime: Inject secrets
docker run -e DATABASE_PASSWORD=$SECRET_PASS myapp:latest
```

Or use **Docker secrets** (Swarm/Compose):
```yaml
services:
  app:
    image: myapp:latest
    secrets:
      - db_password
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    external: true
```

---

### Environment Variable Validation

**Add validation in application startup**:

```typescript
// src/config/env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'API_SECRET',
  'SUPABASE_URL'
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export const config = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  api: {
    secret: process.env.API_SECRET!,
  },
};
```

---

## Port Configuration Standards

### Standard Port Allocation

| Environment | Frontend | Backend | Database | Nginx |
|-------------|----------|---------|----------|-------|
| **Development** | 3000 (Vite), 5173 (alt) | 3001 | 5432 (Postgres), 27017 (Mongo) | 8080 |
| **Production** | 80 (HTTP), 443 (HTTPS) | - | - | 80/443 |

---

### Tool-Specific Default Ports

#### Figma Make (React + Vite)
```dockerfile
EXPOSE 5173  # Vite dev server
# or
EXPOSE 3000  # Alternative Vite port
# Production: nginx on 80
```

**docker-compose.yml**:
```yaml
services:
  app-dev:
    ports:
      - "3000:5173"  # Host:Container
```

---

#### Lovable (React + Vite + Supabase)
```dockerfile
# Frontend
EXPOSE 5173  # Vite dev server
EXPOSE 54321 # Supabase local API
EXPOSE 54323 # Supabase Studio
```

**docker-compose.yml**:
```yaml
services:
  frontend:
    ports:
      - "3000:5173"

  supabase:
    image: supabase/postgres
    ports:
      - "54321:8000"  # Supabase API
      - "54323:3000"  # Supabase Studio
```

---

#### V0 (Next.js)
```dockerfile
EXPOSE 3000  # Next.js default
```

**docker-compose.yml**:
```yaml
services:
  app:
    ports:
      - "3000:3000"  # Development
      # or
      - "80:3000"    # Production
```

---

#### Bolt (Remix)
```dockerfile
EXPOSE 5173  # Vite dev server (Remix uses Vite)
EXPOSE 3000  # Production server
```

---

### Port Configuration Best Practices

#### 1. Use Environment Variables
```dockerfile
ENV PORT=3000
EXPOSE $PORT

CMD node server.js --port $PORT
```

#### 2. Non-Root Port Binding
```dockerfile
# Bind to high port (>1024) for non-root user
USER nodejs
EXPOSE 3000  # ✅ OK for non-root

# Not EXPOSE 80  # ❌ Requires root
```

**Solution for port 80**: Use nginx reverse proxy or docker port mapping

#### 3. Health Check Ports
```dockerfile
EXPOSE 3000       # Application
EXPOSE 9090       # Metrics (Prometheus)
EXPOSE 8080       # Health checks

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider \
  http://localhost:8080/health || exit 1
```

---

### Docker Compose Port Mapping Examples

#### Development (Multiple Services)
```yaml
services:
  frontend:
    ports:
      - "3000:5173"    # Vite dev server

  backend:
    ports:
      - "3001:3001"    # API server

  database:
    ports:
      - "5432:5432"    # PostgreSQL

  nginx:
    ports:
      - "80:80"        # HTTP proxy
      - "443:443"      # HTTPS proxy
```

#### Production (Nginx Proxy)
```yaml
services:
  app:
    expose:
      - "3000"         # Internal only

  nginx:
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - app
```

---

## Build Optimization Techniques

### 1. Layer Caching Strategy

**Principle**: Order Dockerfile commands from least to most frequently changing

```dockerfile
# ✅ OPTIMAL ORDER:
FROM node:18-alpine
WORKDIR /app

# 1. System dependencies (changes rarely)
RUN apk add --no-cache git python3 make g++

# 2. Package files (changes occasionally)
COPY package*.json ./

# 3. Install dependencies (reuses cache if package.json unchanged)
RUN npm ci

# 4. Source code (changes frequently)
COPY . .

# 5. Build (reuses all above layers if source unchanged)
RUN npm run build
```

**Impact**:
- Cold build: ~3 minutes
- Warm build (source change only): ~30 seconds (90% faster)

---

### 2. Node Modules Optimization

#### Pattern A: Separate Dependency Stage
```dockerfile
FROM node:18-alpine AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
```

**Benefits**:
- Dependency layer cached separately
- Faster rebuilds when only source changes

---

#### Pattern B: Named Volume (Development)
```yaml
services:
  app:
    volumes:
      - .:/app
      - node_modules:/app/node_modules  # Named volume
      - /app/node_modules               # Anonymous volume (override)

volumes:
  node_modules:
```

**Benefits**:
- node_modules isolated from host filesystem
- Avoids cross-platform incompatibility (Windows/Mac/Linux)
- 70% faster `npm install` (no bind mount overhead)

---

### 3. .dockerignore Best Practices

**Comprehensive .dockerignore**:
```
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build outputs
dist
build
.next
out
.cache
.vite

# Development
.git
.gitignore
.env
.env.local
.env.*.local
*.log

# Testing
coverage
.nyc_output
*.test.js
*.spec.js
__tests__
__mocks__

# IDE
.vscode
.idea
*.swp
*.swo
.DS_Store

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# Documentation
README.md
docs
*.md

# CI/CD
.github
.gitlab-ci.yml
.travis.yml

# Large files
*.mp4
*.mov
*.zip
*.tar.gz
```

**Impact**:
- 80-90% smaller build context
- 3-5x faster image transfer to Docker daemon
- Fewer layers to invalidate

---

### 4. Multi-Architecture Builds

**Build for ARM and x86**:
```bash
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  --push .
```

**In Dockerfile**:
```dockerfile
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"
```

**Benefits**:
- Works on Apple Silicon (M1/M2) and Intel
- Compatible with ARM cloud instances (AWS Graviton)

---

### 5. Build Cache Optimization

#### Using BuildKit Cache Mounts
```dockerfile
# Enable BuildKit
# syntax=docker/dockerfile:1

FROM node:18-alpine
WORKDIR /app

COPY package*.json ./

# Cache npm packages between builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN npm run build
```

**Enable BuildKit**:
```bash
export DOCKER_BUILDKIT=1
docker build -t myapp:latest .
```

**Benefits**:
- npm cache persists between builds
- 50-70% faster dependency installation

---

### 6. Parallel Dependency Installation

#### Concurrent npm installs
```dockerfile
FROM node:18-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci &

FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
```

**Build with parallel stages**:
```bash
docker buildx build --progress=plain .
```

---

## Security Best Practices

### 1. Non-Root User

#### React/Vite Apps (Nginx)
```dockerfile
FROM nginx:1.25-alpine

# Create nginx user
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx \
    -s /sbin/nologin -G nginx -g nginx nginx

# Copy files with correct ownership
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Run as non-root
USER nginx

EXPOSE 8080  # Non-privileged port
CMD ["nginx", "-g", "daemon off;"]
```

---

#### Node.js Apps
```dockerfile
FROM node:18-alpine

# Create application user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy files as root
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Security Impact**:
- Prevents privilege escalation attacks
- Limits damage from compromised container
- Follows principle of least privilege

---

### 2. Minimal Base Images

**Image Size Comparison**:
| Base Image | Size | Use Case |
|------------|------|----------|
| `node:18` | ~900MB | ❌ Avoid |
| `node:18-slim` | ~180MB | ✅ Good for development |
| `node:18-alpine` | ~120MB | ✅ Best for production |
| `alpine:3.18` | ~7MB | ✅ Optimal (static sites) |
| `scratch` | ~0MB | ⚠️ Advanced (static binaries only) |

**Alpine Recommendation**:
```dockerfile
FROM node:18-alpine  # ✅ Recommended

# Not FROM node:18  # ❌ 5-7x larger
```

---

### 3. Scan for Vulnerabilities

**Scan with Docker Scout**:
```bash
docker scout cves myapp:latest
docker scout recommendations myapp:latest
```

**Scan with Trivy**:
```bash
trivy image myapp:latest
```

**In CI/CD (GitHub Actions)**:
```yaml
- name: Scan image
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:latest
    severity: 'CRITICAL,HIGH'
```

---

### 4. Read-Only Filesystem

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy application
COPY --from=builder /app .

# Create temp directory for writable files
RUN mkdir /tmp/app-cache && chown nodejs:nodejs /tmp/app-cache

USER nodejs

# Run with read-only root filesystem
CMD ["node", "--max-old-space-size=512", "server.js"]
```

**Docker run with read-only root**:
```bash
docker run --read-only \
  --tmpfs /tmp \
  -v app-cache:/tmp/app-cache \
  myapp:latest
```

---

### 5. Security Headers (Nginx)

```nginx
server {
    listen 80;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # HTTPS only (if using SSL)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CSP (Content Security Policy)
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
}
```

---

### 6. Secret Scanning Prevention

**Never commit secrets**:
```bash
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
*.crt
secrets/
```

**Scan repository for secrets**:
```bash
# Use git-secrets
git secrets --scan

# Use truffleHog
trufflehog git file://. --only-verified
```

---

## Performance Optimization

### 1. Nginx Configuration

#### Optimized nginx.conf
```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Caching
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # No cache for HTML
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            expires 0;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**Performance Impact**:
- Gzip: 70-80% size reduction
- Static asset caching: 90% fewer requests
- Keepalive: 50% faster subsequent requests

---

### 2. Health Checks

**Lightweight health check**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
```

**Or using curl**:
```dockerfile
RUN apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1
```

**Health endpoint in app**:
```typescript
// Express example
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: Date.now() });
});

// Next.js API route
export async function GET() {
  return Response.json({ status: 'healthy', timestamp: Date.now() });
}
```

---

### 3. Resource Limits

**docker-compose.yml**:
```yaml
services:
  app:
    image: myapp:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

**Or via docker run**:
```bash
docker run \
  --cpus=1.0 \
  --memory=512m \
  --memory-swap=512m \
  myapp:latest
```

---

### 4. Node.js Memory Optimization

```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"

CMD ["node", "--max-old-space-size=512", "server.js"]
```

**For build stage**:
```dockerfile
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

---

## Tool-Specific Recommendations

### Figma Make (React + Vite + TypeScript)

#### Recommended Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM nginx:1.25-alpine AS production
RUN apk add --no-cache dumb-init && apk upgrade --no-cache

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Non-root user
USER nginx

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -q --spider http://localhost/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
```

**Key Features**:
- Vite optimized build
- Nginx for production serving
- Static asset caching
- Gzip compression for UI libraries

**Environment Variables**:
```dockerfile
ARG VITE_API_URL
ARG VITE_APP_NAME
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
```

**Port**: 80 (production), 5173 (development)

---

### Lovable (React + Vite + Supabase)

#### Recommended Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm ci
COPY . .

# Build-time Supabase config (public)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 3: Production
FROM nginx:1.25-alpine AS production
RUN apk add --no-cache dumb-init

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

USER nginx
EXPOSE 80

HEALTHCHECK CMD wget -q --spider http://localhost/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["nginx", "-g", "daemon off;"]
```

**Supabase Edge Functions** (separate container):
```dockerfile
FROM denoland/deno:alpine

WORKDIR /app

# Copy Edge Functions
COPY supabase/functions ./functions

CMD ["deno", "run", "--allow-net", "--allow-env", "functions/index.ts"]
```

**docker-compose.yml**:
```yaml
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

  supabase:
    image: supabase/postgres:latest
    ports:
      - "54321:8000"
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - supabase-data:/var/lib/postgresql/data

volumes:
  supabase-data:
```

**Port**: 80 (frontend), 54321 (Supabase API)

---

### V0 (Next.js + Vercel)

#### Recommended Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Enable standalone output
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**next.config.js**:
```javascript
module.exports = {
  output: 'standalone',  // Essential for Docker!
  images: {
    domains: ['your-cdn.com'],
  },
}
```

**Key Features**:
- Standalone output (85% smaller)
- Server Components support
- Image optimization
- API routes included

**Port**: 3000

---

### Bolt (Remix + StackBlitz)

#### Recommended Dockerfile
```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
RUN npm ci
COPY . .

# Build Remix app
RUN npm run build

# Stage 3: Production
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built app and dependencies
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["npm", "run", "start"]
```

**remix.config.js**:
```javascript
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildPath: "build/index.js",
  ignoredRouteFiles: ["**/.*"],
}
```

**WebContainer Compatibility**:
- Bolt apps typically run in browser WebContainers
- Docker used for local development or server deployment
- Ensure Vite dev server binds to 0.0.0.0

**Port**: 5173 (dev), 3000 (production)

---

## Cross-Platform Considerations

### 1. File Permissions

**Issue**: File permission differences between Windows/Mac/Linux

**Solution**:
```dockerfile
# Always set ownership explicitly
COPY --chown=nodejs:nodejs /app/build ./build

# Or set after copy
COPY . .
RUN chown -R nodejs:nodejs /app
```

---

### 2. Line Endings

**Issue**: CRLF (Windows) vs LF (Unix) in scripts

**Solution**:
```dockerfile
# Convert line endings during build
RUN dos2unix entrypoint.sh || sed -i 's/\r$//' entrypoint.sh
RUN chmod +x entrypoint.sh
```

Or use `.gitattributes`:
```
* text=auto
*.sh text eol=lf
*.js text eol=lf
```

---

### 3. Node Modules Platform Issues

**Issue**: Native modules compiled for different platforms

**Solution**: Use named volumes in development
```yaml
services:
  app:
    volumes:
      - .:/app
      - node_modules:/app/node_modules  # Isolated from host
```

Or rebuild in container:
```dockerfile
RUN npm rebuild
```

---

### 4. Apple Silicon (M1/M2) Support

**Build multi-platform images**:
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myapp:latest \
  --push .
```

**Or specify platform explicitly**:
```bash
docker build --platform linux/amd64 -t myapp:latest .
```

---

## Production Deployment Patterns

### 1. Kubernetes Deployment

**Deployment manifest**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

### 2. Docker Swarm

**Stack file**:
```yaml
version: '3.8'

services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    secrets:
      - db_password
    environment:
      - NODE_ENV=production
      - DATABASE_PASSWORD_FILE=/run/secrets/db_password
    ports:
      - "80:3000"
    networks:
      - app-network

secrets:
  db_password:
    external: true

networks:
  app-network:
    driver: overlay
```

**Deploy**:
```bash
docker stack deploy -c docker-stack.yml myapp
```

---

### 3. Docker Compose Production

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  app:
    image: myapp:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    ports:
      - "80:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

---

### 4. Cloud Platform Patterns

#### AWS ECS/Fargate
```json
{
  "family": "myapp",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "myapp",
      "image": "myapp:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

---

#### Google Cloud Run
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project/myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        resources:
          limits:
            memory: 512Mi
            cpu: 1
```

**Deploy**:
```bash
gcloud run deploy myapp \
  --image gcr.io/project/myapp:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

#### Azure Container Instances
```yaml
apiVersion: 2019-12-01
location: eastus
name: myapp
properties:
  containers:
  - name: myapp
    properties:
      image: myapp:latest
      resources:
        requests:
          cpu: 1.0
          memoryInGB: 1.5
      ports:
      - port: 3000
  osType: Linux
  ipAddress:
    type: Public
    ports:
    - protocol: tcp
      port: 80
    - protocol: tcp
      port: 443
```

---

## Conclusion

### Key Takeaways

1. **Multi-stage builds** are essential for production-ready images
2. **Layer caching** dramatically improves rebuild times
3. **Environment variables** must distinguish build-time vs runtime
4. **Standard ports** (3000 dev, 80/443 prod) work across all tools
5. **Security** requires non-root users, minimal images, and secret management
6. **Performance** gains come from nginx optimization, health checks, and resource limits

### Template Architecture Recommendations

For Phase 2 template system:

1. **Create 4 base templates**:
   - `frontend-only`: React/Vue/Svelte with Vite → nginx
   - `nextjs`: Next.js 13+ with standalone output
   - `fullstack`: Node.js backend + React frontend
   - `supabase`: Frontend + Supabase integration

2. **Tool-specific variations**:
   - Figma Make → `frontend-only` template
   - V0 → `nextjs` template
   - Lovable → `supabase` template
   - Bolt → `fullstack` or `frontend-only`

3. **Configurable options**:
   - Development vs production
   - With/without SSL
   - Database type (PostgreSQL, MongoDB, Supabase)
   - API gateway (nginx, Traefik)

4. **Standardize across templates**:
   - Multi-stage build pattern
   - Non-root users
   - Health checks
   - .dockerignore
   - Environment variable handling

---

**Research Complete**: Ready for Phase 2 implementation

**Next Steps**:
- Design template architecture
- Create Dockerfile generators
- Build docker-compose templates
- Add environment variable validation
- Implement tool detection logic
