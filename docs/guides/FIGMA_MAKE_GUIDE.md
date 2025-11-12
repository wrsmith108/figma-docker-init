# Figma Make Docker Guide

Complete guide for containerizing Figma Make (Figma-to-Code) projects with vibe-to-docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

Figma Make converts Figma designs into production-ready React code with:

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules or Styled Components
- **Component Library**: Auto-generated from Figma designs
- **Type Safety**: Full TypeScript support

Vibe-to-docker automatically detects Figma Make projects and generates optimized Docker configurations for design-to-production workflows.

## Prerequisites

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0
- Figma Make project export

## Quick Start

### 1. Export from Figma Make

From Figma Make plugin:
1. Select your design frames
2. Click "Export Code"
3. Choose "React + Vite + TypeScript"
4. Download and extract ZIP file

### 2. Initialize Docker Configuration

```bash
cd your-figma-project
vibe-to-docker init --tool=figma-make
```

The CLI will:
- ✓ Detect Figma Make project structure
- ✓ Identify component-based architecture
- ✓ Detect TypeScript configuration
- ✓ Generate optimized Docker configuration
- ✓ Create `.vibe-docker/` directory

### 3. Start Docker Containers

```bash
cd .vibe-docker
docker-compose up -d --build
```

### 4. Access Your Application

```
http://localhost:3000
```

## Project Structure

### Typical Figma Make Project

```
figma-make-project/
├── src/
│   ├── components/       # Auto-generated components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   └── About.tsx
│   ├── assets/          # Images, fonts from Figma
│   │   ├── images/
│   │   └── fonts/
│   ├── styles/          # Global styles
│   │   └── global.css
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### After vibe-to-docker

```
figma-make-project/
├── .vibe-docker/        # Docker configuration
│   ├── Dockerfile       # Optimized for Vite builds
│   ├── docker-compose.yml
│   ├── nginx.conf       # Static file serving
│   ├── .env
│   ├── .env.example
│   ├── .dockerignore
│   └── DOCKER.md
├── src/                 # Your Figma components
├── public/
└── package.json
```

## Docker Configuration

### Generated Dockerfile

Optimized for Figma Make's Vite + React stack:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

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

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Generated docker-compose.yml

Simple configuration for static site:

```yaml
version: '3.8'

services:
  figma-app:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile
    ports:
      - "${NGINX_PORT:-8888}:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - figma-network

networks:
  figma-network:
    driver: bridge
```

### Nginx Configuration

Optimized for React SPA with Figma assets:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache Figma assets aggressively
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache fonts
    location ~* \.(woff|woff2|ttf|otf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Cache images from Figma
    location ~* \.(png|jpg|jpeg|gif|svg|webp)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json image/svg+xml;
}
```

## Environment Variables

### Figma Make Specific

**Basic Configuration:**
```env
# Application
NODE_ENV=production
VITE_APP_TITLE=My Figma Design

# Build
BUILD_OUTPUT_DIR=dist

# Ports
DEV_PORT=3000
NGINX_PORT=8888
```

**API Integration (if adding backend):**
```env
# API Configuration
VITE_API_URL=https://api.example.com
VITE_API_KEY=your-api-key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

**Asset Configuration:**
```env
# Asset CDN (optional)
VITE_CDN_URL=https://cdn.example.com
VITE_IMAGE_OPTIMIZATION=true
```

## Build Process

### Development Build

```bash
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- Vite dev server with HMR
- Fast refresh for React components
- Source maps enabled
- Live asset reloading

### Production Build

```bash
cd .vibe-docker
docker-compose up -d --build
```

**Optimizations:**
- **Code Splitting**: Automatic chunking for faster loads
- **Tree Shaking**: Remove unused code
- **Minification**: JavaScript and CSS compression
- **Asset Optimization**: Image compression, font subsetting
- **Lazy Loading**: Route-based code splitting

### Build Performance

Figma Make projects benefit from:
- **Pre-generated Components**: No runtime component generation
- **Static Assets**: Optimized images and fonts from Figma
- **TypeScript**: Type checking happens at build time
- **CSS Modules**: Scoped styles with minimal runtime overhead

### Custom Build Configuration

Edit `vite.config.ts` for advanced optimizations:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'components': [
            './src/components/Button',
            './src/components/Card',
            // ... other Figma components
          ],
        },
      },
    },
    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

## Development Workflow

### Local Development with Docker

```bash
# Start development server
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up

# Access at http://localhost:3000
# Make changes to components in src/
# Changes hot-reload automatically
```

### Volume Mounting for Live Updates

`docker-compose.dev.yml`:

```yaml
services:
  figma-app-dev:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.dev
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ../src:/app/src
      - ../public:/app/public
    environment:
      - NODE_ENV=development
```

### Component Development Workflow

1. **Export from Figma Make** → Get new/updated components
2. **Replace in src/components/** → Update component files
3. **Hot Reload** → See changes instantly in browser
4. **Iterate** → Refine styles and behavior
5. **Build** → Generate production bundle

### Testing Figma Components

```bash
# Run tests in container
docker-compose run figma-app npm test

# Run component tests
docker-compose run figma-app npm run test:components

# Visual regression testing (optional)
docker-compose run figma-app npm run test:visual
```

## Production Deployment

### Option 1: Static Hosting (Recommended)

Figma Make projects are static sites, perfect for:

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd your-project
vercel --prod
```

**Netlify:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd your-project
netlify deploy --prod --dir=dist
```

**GitHub Pages:**
```bash
# Build
npm run build

# Deploy to gh-pages
npx gh-pages -d dist
```

### Option 2: Docker Container

**Build and Push:**
```bash
cd .vibe-docker
docker build -t figma-app:latest .
docker tag figma-app:latest registry.example.com/figma-app:v1.0.0
docker push registry.example.com/figma-app:v1.0.0
```

**Deploy to Cloud:**
```bash
# AWS ECS, Google Cloud Run, Azure Container Instances, etc.
# See cloud provider documentation
```

### Option 3: CDN Distribution

After building, upload `dist/` to CDN:

```bash
# Build
npm run build

# Upload to S3 + CloudFront
aws s3 sync dist/ s3://your-bucket/ --delete
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

## Troubleshooting

### Issue: Fonts Not Loading

**Symptoms:**
```
Failed to load font: network error
```

**Solutions:**
1. Ensure fonts are in `public/fonts/` or `src/assets/fonts/`
2. Update font paths in CSS:
   ```css
   @font-face {
     font-family: 'CustomFont';
     src: url('/fonts/CustomFont.woff2') format('woff2');
   }
   ```
3. Add CORS headers in nginx.conf:
   ```nginx
   location ~* \.(woff|woff2|ttf)$ {
       add_header Access-Control-Allow-Origin *;
   }
   ```

### Issue: Images Not Displaying

**Symptoms:**
Images show broken icon or 404 errors

**Solutions:**
1. Check image paths are relative to `public/`:
   ```tsx
   // Correct
   <img src="/assets/images/logo.png" />

   // Incorrect
   <img src="./assets/images/logo.png" />
   ```
2. Verify images are copied in Dockerfile:
   ```dockerfile
   COPY public /app/public
   ```
3. Check `.dockerignore` doesn't exclude images

### Issue: TypeScript Errors in Build

**Symptoms:**
```
TS2307: Cannot find module 'X' or its corresponding type declarations
```

**Solutions:**
1. Install type definitions:
   ```bash
   npm install --save-dev @types/react @types/react-dom
   ```
2. Update `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "skipLibCheck": true,
       "types": ["vite/client"]
     }
   }
   ```

### Issue: Build Size Too Large

**Symptoms:**
Docker image > 500MB or slow loading

**Solutions:**
1. Enable code splitting in `vite.config.ts`
2. Optimize images before export from Figma
3. Use lazy loading for routes:
   ```tsx
   const Home = lazy(() => import('./pages/Home'));
   ```
4. Analyze bundle:
   ```bash
   npm run build -- --analyze
   ```

## Examples

### Example 1: Simple Landing Page

```bash
cd figma-landing-page
vibe-to-docker init --tool=figma-make

cd .vibe-docker
docker-compose up -d --build

# Access at http://localhost:8888
```

### Example 2: Multi-Page Application

```bash
cd figma-multi-page-app
vibe-to-docker init --tool=figma-make --template=ui-heavy

# Add routing (React Router)
npm install react-router-dom

# Update App.tsx with routes
# Build and deploy
cd .vibe-docker
docker-compose up -d --build
```

### Example 3: Design System with Storybook

```bash
cd figma-design-system
vibe-to-docker init --tool=figma-make

# Install Storybook
npx storybook@latest init

# Update Dockerfile to include Storybook build
nano .vibe-docker/Dockerfile

# Build and run
cd .vibe-docker
docker-compose up -d --build
```

### Example 4: Figma + API Integration

```bash
cd figma-app-with-api
vibe-to-docker init --tool=figma-make

# Add API integration
cat >> .vibe-docker/.env << EOF
VITE_API_URL=https://api.example.com
VITE_API_KEY=xxx
EOF

# Update nginx to proxy API requests
nano .vibe-docker/nginx.conf

# Add proxy_pass for /api
```

---

## Additional Resources

- [Figma Make Documentation](https://www.figma.com/community/plugin/figma-make)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** November 2025
