# Lovable Docker Guide

Complete guide for containerizing Lovable (formerly GPT Engineer) projects with vibe-to-docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Supabase Integration](#supabase-integration)
- [Build Process](#build-process)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

Lovable (formerly GPT Engineer) generates full-stack applications with:

- **Frontend**: React, Vue, or Svelte
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: Supabase (PostgreSQL)
- **Build Tool**: Vite or Webpack
- **Styling**: Tailwind CSS or CSS-in-JS

Vibe-to-docker automatically detects Lovable projects and generates optimized Docker configurations.

## Prerequisites

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0
- Lovable project export
- Supabase account (if using database features)

## Quick Start

### 1. Export Your Lovable Project

From Lovable:
1. Click "Export" or "Download Code"
2. Extract the downloaded ZIP file
3. Navigate to the project directory

### 2. Initialize Docker Configuration

```bash
cd your-lovable-project
vibe-to-docker init --tool=lovable
```

The CLI will:
- ✓ Detect Lovable project structure
- ✓ Identify React/Vue/Svelte framework
- ✓ Detect Supabase integration
- ✓ Generate optimized Docker configuration
- ✓ Create `.vibe-docker/` directory with all files

### 3. Configure Supabase Credentials

```bash
nano .vibe-docker/.env
```

Update Supabase variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start Docker Containers

```bash
cd .vibe-docker
docker-compose up -d --build
```

### 5. Access Your Application

```
http://localhost:3000
```

## Project Structure

### Typical Lovable Project

```
lovable-project/
├── src/
│   ├── components/        # React/Vue components
│   ├── pages/            # Page components
│   ├── lib/              # Utility functions
│   ├── integrations/     # Supabase integration
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── hooks/            # Custom React hooks
│   └── App.tsx           # Main app component
├── public/               # Static assets
├── package.json
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── tsconfig.json         # TypeScript configuration
```

### After vibe-to-docker

```
lovable-project/
├── .vibe-docker/         # Docker configuration
│   ├── Dockerfile        # Multi-stage build
│   ├── docker-compose.yml
│   ├── nginx.conf        # Proxy configuration
│   ├── .env              # Environment variables
│   ├── .env.example      # Template
│   ├── .dockerignore
│   └── DOCKER.md         # Documentation
├── src/                  # Your application code
├── public/
└── package.json
```

## Docker Configuration

### Generated Dockerfile

The Lovable template generates a multi-stage Dockerfile:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Generated docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile
    ports:
      - "${NGINX_PORT:-8888}:80"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
    restart: unless-stopped
    networks:
      - lovable-network

networks:
  lovable-network:
    driver: bridge
```

### Nginx Configuration

Optimized for Lovable SPA routing:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing - all routes to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if backend exists)
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

## Environment Variables

### Lovable-Specific Variables

**Supabase Integration:**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (backend only, never expose to frontend)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Application Settings:**
```env
# Application
NODE_ENV=production
VITE_APP_NAME=My Lovable App
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
```

**Build Configuration:**
```env
# Build
BUILD_OUTPUT_DIR=dist
VITE_BUILD_SOURCEMAP=false
```

**Port Configuration:**
```env
# Ports
DEV_PORT=3000
PROD_PORT=8080
NGINX_PORT=8888
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy:
   - **URL**: Your project URL
   - **Anon/Public Key**: For client-side use
   - **Service Role Key**: For server-side use (keep secret!)

## Supabase Integration

### Client Configuration

Lovable typically includes Supabase client setup in `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variable Injection

In Docker, environment variables are injected at **build time** for Vite:

```dockerfile
# Build stage
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build
```

### Database Migrations

If your Lovable project includes migrations:

```bash
# Run migrations before starting app
cd .vibe-docker
docker-compose run app npm run migrate
docker-compose up -d
```

### Real-time Features

Ensure WebSocket connections work through nginx:

```nginx
location /realtime {
    proxy_pass https://your-project.supabase.co/realtime;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

## Build Process

### Development Build

```bash
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- Hot module replacement (HMR)
- Source maps enabled
- Development server on port 3000
- Volume mounting for live code updates

### Production Build

```bash
cd .vibe-docker
docker-compose up -d --build
```

**Optimizations:**
- Minified JavaScript and CSS
- Tree-shaking unused code
- Code splitting for optimal loading
- Asset fingerprinting for cache busting
- Gzip compression

### Build Customization

Edit `.vibe-docker/Dockerfile` to customize:

```dockerfile
# Example: Add build-time optimizations
RUN npm run build -- --mode production --minify

# Example: Generate PWA assets
RUN npm run generate-pwa-assets

# Example: Run post-build scripts
RUN npm run postbuild
```

## Development Workflow

### Local Development with Docker

```bash
# Start development containers
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up

# In another terminal, watch logs
docker-compose logs -f app

# Make code changes in src/
# Changes automatically reload in browser
```

### Testing in Container

```bash
# Run tests in container
cd .vibe-docker
docker-compose run app npm test

# Run tests with coverage
docker-compose run app npm run test:coverage
```

### Debugging

```bash
# Access container shell
docker-compose exec app sh

# View environment variables
docker-compose exec app env

# Check build output
docker-compose exec app ls -la /usr/share/nginx/html
```

## Production Deployment

### Option 1: Docker Registry

```bash
# Build production image
cd .vibe-docker
docker build -t lovable-app:latest .

# Tag for registry
docker tag lovable-app:latest registry.example.com/lovable-app:v1.0.0

# Push to registry
docker push registry.example.com/lovable-app:v1.0.0

# Deploy on production server
docker pull registry.example.com/lovable-app:v1.0.0
docker run -d -p 80:80 \
  -e VITE_SUPABASE_URL=https://prod.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=prod-key \
  registry.example.com/lovable-app:v1.0.0
```

### Option 2: Cloud Platforms

**Vercel/Netlify:**
- Use their native deployment (recommended)
- Or deploy Docker image to their container services

**AWS ECS/Fargate:**
```bash
# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin
docker tag lovable-app:latest xxx.dkr.ecr.region.amazonaws.com/lovable-app:latest
docker push xxx.dkr.ecr.region.amazonaws.com/lovable-app:latest

# Deploy with ECS task definition
```

**Google Cloud Run:**
```bash
# Push to GCR
gcloud auth configure-docker
docker tag lovable-app:latest gcr.io/project-id/lovable-app:latest
docker push gcr.io/project-id/lovable-app:latest

# Deploy
gcloud run deploy lovable-app \
  --image gcr.io/project-id/lovable-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### SSL/HTTPS Setup

Add SSL certificates to nginx:

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;

    # ... rest of configuration
}
```

Mount certificates in docker-compose.yml:

```yaml
volumes:
  - /path/to/ssl/certs:/etc/ssl/certs:ro
  - /path/to/ssl/private:/etc/ssl/private:ro
```

## Troubleshooting

### Issue: Supabase Connection Fails

**Symptoms:**
```
Error: Invalid Supabase URL or Key
```

**Solutions:**
1. Verify credentials in `.vibe-docker/.env`
2. Check Supabase project is active
3. Ensure CORS is configured in Supabase:
   - Go to Authentication > URL Configuration
   - Add your Docker container URL

### Issue: Build Fails with Module Not Found

**Symptoms:**
```
Module not found: Error: Can't resolve 'some-package'
```

**Solutions:**
1. Ensure package is in `package.json` dependencies
2. Clear Docker cache:
   ```bash
   docker-compose build --no-cache
   ```
3. Check for peer dependency issues:
   ```bash
   npm install --legacy-peer-deps
   ```

### Issue: Hot Reload Not Working

**Symptoms:**
Code changes don't reflect in browser

**Solutions:**
1. Use development compose file:
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```
2. Ensure volumes are mounted correctly in docker-compose.dev.yml

### Issue: Environment Variables Not Available

**Symptoms:**
```
import.meta.env.VITE_SUPABASE_URL is undefined
```

**Solutions:**
1. Prefix all env vars with `VITE_` for Vite projects
2. Rebuild container after changing `.env`:
   ```bash
   docker-compose up -d --build
   ```
3. Check that env vars are passed as build args in Dockerfile

## Examples

### Example 1: Basic Lovable React App

```bash
cd my-lovable-react-app
vibe-to-docker init --tool=lovable

# Configure Supabase
cat > .vibe-docker/.env << EOF
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
EOF

# Start
cd .vibe-docker
docker-compose up -d --build

# Access at http://localhost:3000
```

### Example 2: Fullstack with Backend

```bash
cd my-lovable-fullstack
vibe-to-docker init --tool=lovable --template=fullstack

# Update docker-compose to include backend service
nano .vibe-docker/docker-compose.yml

# Start all services
cd .vibe-docker
docker-compose up -d --build
```

### Example 3: Multi-Environment Setup

```bash
# Development
cp .vibe-docker/.env .vibe-docker/.env.dev
nano .vibe-docker/.env.dev  # Use dev Supabase project

# Production
cp .vibe-docker/.env .vibe-docker/.env.prod
nano .vibe-docker/.env.prod  # Use prod Supabase project

# Run development
docker-compose --env-file .env.dev up

# Build for production
docker-compose --env-file .env.prod build
```

---

## Additional Resources

- [Lovable Documentation](https://lovable.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Last Updated:** November 2025
