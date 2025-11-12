# V0 (Vercel) Docker Guide

Complete guide for containerizing V0 projects with vibe-to-docker.

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

V0 (by Vercel) generates modern web components and applications with:

- **Frontend**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **TypeScript**: Full type safety
- **Server Components**: React Server Components
- **API Routes**: Built-in API support

Vibe-to-docker provides optimized Docker configurations for V0 projects with Next.js-specific optimizations.

## Prerequisites

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0
- V0 project export

## Quick Start

### 1. Export from V0

From V0 interface:
1. Select your generated components/pages
2. Click "Export" or "Download Code"
3. Extract the project files

### 2. Initialize Docker Configuration

```bash
cd your-v0-project
vibe-to-docker init --tool=v0
```

The CLI will:
- ✓ Detect Next.js App Router structure
- ✓ Identify Tailwind CSS configuration
- ✓ Detect shadcn/ui components
- ✓ Generate Next.js-optimized Docker configuration
- ✓ Create `.vibe-docker/` directory

### 3. Configure Environment Variables

```bash
nano .vibe-docker/.env
```

Update as needed:
```env
NEXT_PUBLIC_API_URL=https://api.example.com
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

### Typical V0 Project

```
v0-project/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   └── api/             # API routes
│       └── route.ts
├── components/           # shadcn/ui components
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── custom/          # V0 generated components
│       └── hero.tsx
├── lib/                  # Utilities
│   └── utils.ts
├── public/              # Static assets
├── package.json
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
└── tsconfig.json
```

### After vibe-to-docker

```
v0-project/
├── .vibe-docker/        # Docker configuration
│   ├── Dockerfile       # Next.js optimized
│   ├── docker-compose.yml
│   ├── .env
│   ├── .env.example
│   ├── .dockerignore
│   └── DOCKER.md
├── app/                 # Your V0 components
├── components/
└── package.json
```

## Docker Configuration

### Generated Dockerfile

Optimized for Next.js 14+ with App Router:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Generated docker-compose.yml

```yaml
version: '3.8'

services:
  v0-app:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    restart: unless-stopped
    networks:
      - v0-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  v0-network:
    driver: bridge
```

### Next.js Configuration

Update `next.config.js` for standalone builds:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;
```

## Environment Variables

### V0-Specific Variables

**Public Environment Variables:**
```env
# API Configuration (exposed to browser)
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://example.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=false

# Third-party Services
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

**Server-Side Environment Variables:**
```env
# Database (if needed)
DATABASE_URL=postgresql://user:pass@host:5432/db

# API Keys (server-side only, never exposed)
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_test_xxx
EMAIL_API_KEY=xxx

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

**Build Configuration:**
```env
# Build settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Ports
APP_PORT=3000
```

### Environment Variable Naming

- **`NEXT_PUBLIC_*`**: Exposed to browser (client-side)
- **No prefix**: Server-side only (API routes, Server Components)

## Build Process

### Development Build

```bash
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- Fast Refresh
- Server Components hot reload
- Tailwind CSS JIT mode
- Source maps enabled

### Production Build

```bash
cd .vibe-docker
docker-compose up -d --build
```

**Next.js Optimizations:**
- **Automatic Code Splitting**: Per-route bundles
- **Image Optimization**: Next.js Image component
- **Font Optimization**: Google Fonts optimization
- **Static Generation**: ISR and SSG support
- **Server Components**: Zero JavaScript for static content

### Build Customization

**Optimize for Performance:**

```javascript
// next.config.js
module.exports = {
  output: 'standalone',

  // Image optimization
  images: {
    domains: ['cdn.example.com'],
    formats: ['image/avif', 'image/webp'],
  },

  // Compression
  compress: true,

  // Disable source maps in production
  productionBrowserSourceMaps: false,

  // Optimize CSS
  experimental: {
    optimizeCss: true,
  },
};
```

## Development Workflow

### Local Development with Docker

```bash
# Start development server
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up

# Access at http://localhost:3000
# Make changes - Fast Refresh handles updates
```

### Development Compose File

`docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  v0-app-dev:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.dev
      target: development
    ports:
      - "3000:3000"
    volumes:
      - ../app:/app/app
      - ../components:/app/components
      - ../lib:/app/lib
      - ../public:/app/public
      - ../package.json:/app/package.json
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    command: npm run dev
```

### Working with Server Components

```tsx
// app/page.tsx - Server Component (default)
export default async function HomePage() {
  // Fetch data on server
  const data = await fetch('https://api.example.com/data');

  return (
    <div>
      <h1>V0 Generated Page</h1>
      {/* Server-rendered content */}
    </div>
  );
}
```

### API Routes in Docker

```typescript
// app/api/hello/route.ts
export async function GET(request: Request) {
  return Response.json({ message: 'Hello from Docker!' });
}
```

Access at: `http://localhost:3000/api/hello`

## Production Deployment

### Option 1: Vercel (Recommended)

V0 projects are designed for Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd your-v0-project
vercel --prod
```

**Why Vercel?**
- Zero-config deployment
- Automatic optimizations
- Edge Network
- Built-in analytics
- Preview deployments

### Option 2: Docker Container

**For self-hosting or other platforms:**

```bash
# Build production image
cd .vibe-docker
docker build -t v0-app:latest .

# Run
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  v0-app:latest
```

**Deploy to Cloud:**

**AWS:**
```bash
# Push to ECR
docker tag v0-app:latest xxx.dkr.ecr.region.amazonaws.com/v0-app
docker push xxx.dkr.ecr.region.amazonaws.com/v0-app

# Deploy with App Runner or ECS
```

**Google Cloud Run:**
```bash
# Build and push
gcloud builds submit --tag gcr.io/project/v0-app
gcloud run deploy v0-app --image gcr.io/project/v0-app --platform managed
```

### Option 3: Static Export (Limited)

For purely static V0 sites:

```javascript
// next.config.js
module.exports = {
  output: 'export',
};
```

```bash
npm run build
# Deploy dist/ to any static host
```

**Note**: Static export disables:
- API Routes
- Server Actions
- Dynamic Routes with `generateStaticParams`

## Troubleshooting

### Issue: Server Components Not Working

**Symptoms:**
```
Error: async/await is not yet supported in Client Components
```

**Solutions:**
1. Ensure component is a Server Component (no `'use client'`)
2. Move client-side logic to separate Client Component:
   ```tsx
   // components/client-button.tsx
   'use client'

   export function ClientButton() {
     return <button onClick={() => alert('Hi!')}>Click</button>
   }
   ```

### Issue: Tailwind Styles Not Applied

**Symptoms:**
No styling in production build

**Solutions:**
1. Check `tailwind.config.ts` includes all content paths:
   ```typescript
   content: [
     './app/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
   ]
   ```
2. Verify PostCSS configuration exists
3. Rebuild without cache:
   ```bash
   docker-compose build --no-cache
   ```

### Issue: Environment Variables Undefined

**Symptoms:**
```
process.env.NEXT_PUBLIC_API_URL is undefined
```

**Solutions:**
1. Ensure variable is prefixed with `NEXT_PUBLIC_`
2. Rebuild container after changing `.env`
3. For server-side vars, access in Server Components or API Routes only

### Issue: Image Optimization Errors

**Symptoms:**
```
Error: Invalid src prop on `next/image`
```

**Solutions:**
1. Configure allowed domains in `next.config.js`:
   ```javascript
   images: {
     domains: ['cdn.example.com', 'images.unsplash.com'],
   }
   ```
2. Use relative paths for local images
3. Ensure images are in `public/` directory

## Examples

### Example 1: Simple V0 Landing Page

```bash
cd v0-landing-page
vibe-to-docker init --tool=v0

cd .vibe-docker
docker-compose up -d --build

# Access at http://localhost:3000
```

### Example 2: V0 with API Integration

```bash
cd v0-app-with-api
vibe-to-docker init --tool=v0

# Add API routes
mkdir -p app/api/data
cat > app/api/data/route.ts << 'EOF'
export async function GET() {
  const data = await fetch('https://api.example.com/data');
  return Response.json(await data.json());
}
EOF

# Configure environment
cat >> .vibe-docker/.env << EOF
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_SECRET_KEY=your-secret
EOF

# Build and run
cd .vibe-docker
docker-compose up -d --build
```

### Example 3: V0 with Database

```bash
cd v0-fullstack
vibe-to-docker init --tool=v0 --template=fullstack

# Add database to docker-compose.yml
cat >> .vibe-docker/docker-compose.yml << 'EOF'
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: v0_db
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - v0-network

volumes:
  postgres_data:
EOF

# Update .env
echo "DATABASE_URL=postgresql://user:password@postgres:5432/v0_db" >> .vibe-docker/.env

# Start all services
cd .vibe-docker
docker-compose up -d --build
```

---

## Additional Resources

- [V0 Documentation](https://v0.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Last Updated:** November 2025
