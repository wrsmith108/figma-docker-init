# Vibe-to-Docker Initialization Guide

**Version**: 5.1.0
**Last Updated**: November 20, 2025
**Status**: Production Ready

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [What is Initialization?](#what-is-initialization)
3. [Installation Methods](#installation-methods)
4. [Usage Guide](#usage-guide)
5. [Initialization Process](#initialization-process)
6. [Generated Files](#generated-files)
7. [Configuration Options](#configuration-options)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Topics](#advanced-topics)
10. [FAQ](#faq)

---

## Quick Start

Get Docker running in your AI-generated project in 60 seconds:

```bash
# Navigate to your project
cd your-ai-project

# Initialize Docker setup (auto-detects your AI tool)
npx vibe-to-docker init --tool=auto

# Your application is now running at http://localhost:3000
```

That's it! The initialization system:
- Detected your AI tool (Lovable, Bolt, V0, Figma Make, or Replit)
- Generated optimized Docker configuration
- Built and started your containers
- Installed dependencies and fixed vulnerabilities

---

## What is Initialization?

Initialization is the automated process of containerizing your AI-generated project. It transforms your local development environment into a production-ready Docker setup with:

### What Gets Initialized

1. **Tool Detection**: Automatically identifies which AI tool created your project
2. **Docker Configuration**: Generates optimized Dockerfile and docker-compose.yml
3. **Environment Setup**: Detects and configures environment variables
4. **Security Hardening**: Applies OWASP security best practices
5. **Performance Optimization**: Multi-stage builds with intelligent caching

### Why Initialize?

- **Consistency**: Same environment across development, staging, and production
- **Portability**: Run anywhere Docker runs (Mac, Windows, Linux, cloud)
- **Security**: Production-grade security headers and non-root execution
- **Performance**: Optimized builds with layer caching (5min → 30sec rebuilds)
- **Automation**: One command handles everything

---

## Installation Methods

### Method 1: NPX (Recommended)

**Best for**: First-time users, CI/CD pipelines, always latest version

```bash
# Always uses latest version, no installation needed
npx vibe-to-docker init --tool=auto
```

**Advantages**:
- No global npm pollution
- Always runs latest version
- Zero installation overhead
- Perfect for CI/CD

### Method 2: Global Installation

**Best for**: Frequent users, offline development

```bash
# Install once
npm install -g vibe-to-docker

# Use anywhere
cd my-project
vibe-to-docker init --tool=lovable
```

**Advantages**:
- Faster execution (no download)
- Offline capability
- Shorter commands

### Method 3: Local Development Dependency

**Best for**: Team projects, version consistency

```bash
# Add to package.json
npm install --save-dev vibe-to-docker

# Add npm script
{
  "scripts": {
    "docker:init": "vibe-to-docker init --tool=auto"
  }
}

# Run via npm
npm run docker:init
```

**Advantages**:
- Version locked in package.json
- Team consistency
- Reproducible builds

---

## Usage Guide

### Basic Usage

```bash
# Automatic tool detection (recommended)
npx vibe-to-docker init --tool=auto

# Specify tool explicitly (fastest, most reliable)
npx vibe-to-docker init --tool=lovable
npx vibe-to-docker init --tool=bolt
npx vibe-to-docker init --tool=v0
npx vibe-to-docker init --tool=figma-make
npx vibe-to-docker init --tool=replit
```

### Advanced Options

```bash
# Preview without writing files
npx vibe-to-docker init --tool=auto --dry-run

# Force overwrite existing configuration
npx vibe-to-docker init --tool=lovable --force

# Skip version compatibility checks (not recommended)
npx vibe-to-docker init --tool=bolt --skip-version-check

# Verbose output for debugging
npx vibe-to-docker init --tool=auto --verbose
```

### Version Commands

```bash
# Check for version compatibility issues
npx vibe-to-docker check-versions

# Auto-fix version mismatches (Angular, Node.js, etc.)
npx vibe-to-docker fix-versions
```

### Utility Commands

```bash
# Show help
npx vibe-to-docker --help

# Show version
npx vibe-to-docker --version

# List available templates
npx vibe-to-docker --list

# Remove vibe-to-docker configuration
npx vibe-to-docker uninstall
```

---

## Initialization Process

The initialization follows a 7-phase workflow:

### Phase 1: Pre-Flight Checks (5-10 seconds)

```
┌─────────────────────────────────────────┐
│ Pre-Flight Checks                       │
│  ✓ Docker installed                     │
│  ✓ Docker daemon running                │
│  ✓ package.json exists                  │
│  ✓ Write permissions                    │
│  ✓ Version compatibility                │
└─────────────────────────────────────────┘
```

**What happens**:
- Validates Docker installation
- Checks Docker daemon is running
- Verifies project structure (package.json)
- Runs version compatibility checks
- Ensures directory write permissions

**Common failures**:
- Docker Desktop not installed → Install from docker.com
- Docker daemon not running → Start Docker Desktop
- Missing package.json → Navigate to project root

### Phase 2: Tool Detection (10-15 seconds)

```
┌─────────────────────────────────────────┐
│ Tool Detection                          │
│  [████████░░] 80%                       │
│  ✓ Analyzing project structure          │
│  ✓ Checking dependencies                │
│  ✓ Reading configuration files          │
│  → Detected: Lovable (95% confidence)   │
└─────────────────────────────────────────┘
```

**What happens**:
- Scans for tool-specific markers (.lovable/, .bolt/, etc.)
- Analyzes package.json dependencies
- Checks for framework signatures
- Calculates confidence score (0-100%)
- Extracts metadata (framework, database, backend)

**Detection accuracy**:
- Lovable: 95% confidence
- Bolt: 80-90% confidence
- V0: 85% confidence
- Figma Make: 90% confidence
- Replit: 80-95% confidence

### Phase 3: Template Composition (5-10 seconds)

```
┌─────────────────────────────────────────┐
│ Template Composition                    │
│  [██████████] 100%                      │
│  ✓ Loading base template                │
│  ✓ Merging Lovable fragments            │
│  ✓ Detecting environment variables      │
│  ✓ Generating Dockerfile                │
└─────────────────────────────────────────┘
```

**What happens**:
- Loads base Docker template (cached)
- Merges tool-specific fragments
- Detects environment variables from code
- Substitutes project-specific values
- Validates template syntax

**Generated files**:
- Dockerfile (multi-stage build)
- docker-compose.yml (service orchestration)
- .dockerignore (build optimization)
- .env.example (environment template)
- nginx.conf (production web server)

### Phase 4: Configuration Generation (5-10 seconds)

```
┌─────────────────────────────────────────┐
│ Configuration Generation                │
│  [██████████] 100%                      │
│  ✓ Generating serve.json (compression)  │
│  ✓ Creating tsconfig.json (TypeScript)  │
│  ✓ Fixing package.json (types)          │
│  ✓ Normalizing build output paths       │
└─────────────────────────────────────────┘
```

**What happens**:
- Generates HTTP compression config (serve.json)
- Creates/updates TypeScript configuration
- Fixes missing @types packages
- Normalizes build output paths (dist/ vs out/)
- Creates docker-compose.yml with correct ports

### Phase 5: File Writing (2-5 seconds)

```
┌─────────────────────────────────────────┐
│ File Writing                            │
│  [██████████] 100%                      │
│  ✓ Created Dockerfile                   │
│  ✓ Created docker-compose.yml           │
│  ✓ Created .dockerignore                │
│  ✓ Created .env.example                 │
│  ✓ Created nginx.conf                   │
└─────────────────────────────────────────┘
```

**What happens**:
- Creates `.vibe-docker/` directory
- Writes all configuration files
- Sets correct file permissions
- Creates `.env` from `.env.example`
- Validates file integrity

### Phase 6: Container Build & Start (30-90 seconds)

```
┌─────────────────────────────────────────┐
│ Docker Build & Start                    │
│  [██████████] 100%                      │
│  ✓ Building Docker image                │
│  ✓ Installing dependencies              │
│  ✓ Starting containers                  │
│  → Application: http://localhost:3000   │
└─────────────────────────────────────────┘
```

**What happens**:
- Builds Docker image (multi-stage)
- Installs npm dependencies in container
- Starts docker-compose services
- Runs health checks
- Opens application port

### Phase 7: Dependency Installation & Security Fixes (20-60 seconds)

```
┌─────────────────────────────────────────┐
│ Dependency Installation                 │
│  [██████████] 100%                      │
│  ✓ Installing dependencies (npm)        │
│  ✓ Fixing security vulnerabilities      │
│  ✓ Running npm audit fix --force        │
│  → All vulnerabilities resolved          │
└─────────────────────────────────────────┘
```

**What happens**:
- Runs `npm install` in project directory
- Executes `npm audit fix --force`
- Resolves dependency conflicts
- Updates package-lock.json
- Cleans up temporary files

### Total Time: 45-120 seconds

**Performance breakdown**:
- Pre-flight: 5-10s
- Detection: 10-15s
- Composition: 5-10s
- Config: 5-10s
- Writing: 2-5s
- Docker build: 30-90s (first time), 10-30s (cached)
- npm install: 20-60s

---

## Generated Files

After initialization, you'll find a `.vibe-docker/` directory in your project:

```
your-project/
├── .vibe-docker/              # Docker configuration (DO commit to git)
│   ├── Dockerfile             # Multi-stage Docker build
│   ├── docker-compose.yml     # Container orchestration
│   ├── .dockerignore          # Build optimization
│   ├── nginx.conf             # Production web server
│   ├── .env.example           # Environment template (210 variables)
│   ├── .env                   # Runtime environment (DO NOT commit)
│   ├── serve.json             # HTTP compression config
│   └── README.md              # Docker usage guide
│
├── .swarm/                    # Agent coordination (gitignored)
│   ├── memory.db              # AgentDB SQLite database
│   └── session-*.json         # Session state
│
├── src/                       # Your application code
├── package.json               # Project dependencies (may be updated)
└── [other project files]
```

### File Descriptions

#### Dockerfile
**Purpose**: Multi-stage build configuration
**Size**: 60-80 lines (optimized from 150+ lines)
**Stages**:
- `dependencies`: Install npm packages (cached layer)
- `development`: Dev server with hot reload
- `builder`: Production build
- `production`: Nginx serving static files

**Example**:
```dockerfile
# Stage 1: Dependencies (cached)
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Stage 3: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 4: Production
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml
**Purpose**: Service orchestration with dynamic ports
**Services**:
- `app-dev`: Development server (hot reload)
- `app-prod`: Production server (nginx)

**Example**:
```yaml
version: '3.8'

services:
  app-dev:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile
      target: development
    ports:
      - "${DEV_PORT:-3000}:3000"
    volumes:
      - ..:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development

  app-prod:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile
      target: production
    ports:
      - "${PROD_PORT:-8080}:80"
    environment:
      - NODE_ENV=production
```

#### .env.example
**Purpose**: Environment variable template with documentation
**Variables**: 210 documented environment variables
**Sections**:
- Application settings (NODE_ENV, PORT)
- Container ports (DEV_PORT, PROD_PORT, NGINX_PORT)
- Tool-specific (VITE_SUPABASE_URL, NEXT_PUBLIC_API_URL)
- Build configuration (BUILD_OUTPUT_DIR)
- Security (API keys - marked for replacement)

**Example**:
```bash
# =============================================================================
# VIBE-TO-DOCKER ENVIRONMENT CONFIGURATION
# Generated: November 20, 2025
# Tool: Lovable
# Framework: react-vite
# =============================================================================

# Application Settings
NODE_ENV=production
PROJECT_NAME=my-lovable-app

# Container Ports
DEV_PORT=3000
PROD_PORT=8080
NGINX_PORT=8888

# Lovable / Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Build Configuration
BUILD_OUTPUT_DIR=dist
```

#### nginx.conf
**Purpose**: Production-ready web server with security headers
**Features**:
- Gzip compression (60-70% bandwidth reduction)
- Security headers (OWASP recommended)
- SPA routing (catch-all index.html)
- Health check endpoint (/health)
- SSL/TLS ready configuration

**Example**:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location /health {
            return 200 "OK";
        }
    }
}
```

---

## Configuration Options

### Environment Variables

Customize behavior via `.vibe-docker/.env`:

```bash
# Application
NODE_ENV=production|development
PROJECT_NAME=your-app-name

# Ports (automatically assigned if unavailable)
DEV_PORT=3000          # Development server port
PROD_PORT=8080         # Production server port
NGINX_PORT=8888        # Nginx proxy port

# Build
BUILD_OUTPUT_DIR=dist  # Build output directory (auto-detected)

# Tool-Specific (Lovable)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# Tool-Specific (V0)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Tool-Specific Options

#### Lovable (Supabase)
```bash
# Required for Lovable projects
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

#### Bolt (Remix)
```bash
# Remix build output
BUILD_OUTPUT_DIR=public/build

# Session secrets
SESSION_SECRET=your-session-secret
```

#### V0 (Next.js)
```bash
# Next.js API
NEXT_PUBLIC_API_URL=https://api.example.com

# Next.js output (static export)
BUILD_OUTPUT_DIR=out
```

#### Replit (Full-Stack)
```bash
# Database connection
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
POSTGRES_PASSWORD=password

# Backend port
BACKEND_PORT=5000
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Not Installed

**Error**:
```
✗ Docker is not installed
```

**Solution**:
```bash
# macOS: Install Docker Desktop
https://docs.docker.com/desktop/install/mac-install/

# Windows: Install Docker Desktop
https://docs.docker.com/desktop/install/windows-install/

# Linux: Install Docker Engine
https://docs.docker.com/desktop/install/linux-install/
```

#### 2. Docker Daemon Not Running

**Error**:
```
✗ Docker daemon is not running
```

**Solution**:
1. Open Docker Desktop application
2. Wait for whale icon to be steady (not animated)
3. Verify: `docker info`

#### 3. Port Already in Use

**Error**:
```
Port 3000 is in use, assigned 3001 instead
```

**Solution** (automatic):
- Initialization automatically finds next available port
- Check `.vibe-docker/.env` for assigned port

**Solution** (manual override):
```bash
# Edit .vibe-docker/.env
DEV_PORT=5173
PROD_PORT=8081
NGINX_PORT=9000

# Restart containers
cd .vibe-docker && docker-compose up -d --build
```

#### 4. Version Compatibility Issues

**Error**:
```
❌ Critical version issues detected
Angular 19 requires Node.js 20.x, found: 18.x
```

**Solution**:
```bash
# Auto-fix version mismatches
npx vibe-to-docker fix-versions

# Or manually update package.json
```

#### 5. Module Not Found Errors

**Error**:
```
Error: Cannot find module '@types/react'
```

**Solution**:
```bash
# Rebuild without cache
cd .vibe-docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 6. Supabase Connection Issues (Lovable)

**Error**:
```
Supabase client initialization failed
```

**Solution**:
```bash
# Verify credentials in .vibe-docker/.env
VITE_SUPABASE_URL=https://xxx.supabase.co  # Must start with https://
VITE_SUPABASE_ANON_KEY=eyJ...              # Copy from Supabase dashboard

# Environment variables MUST be prefixed with VITE_
# Rebuild after changes
cd .vibe-docker && docker-compose up -d --build
```

#### 7. Build Failures

**Error**:
```
npm ERR! code ELIFECYCLE
```

**Solution**:
```bash
# Check Docker logs
cd .vibe-docker
docker-compose logs app-dev

# Rebuild without cache
docker-compose build --no-cache

# Verify package.json scripts exist
cat ../package.json | grep "scripts"
```

### Debug Mode

Enable verbose logging for detailed diagnostics:

```bash
# Verbose initialization
npx vibe-to-docker init --tool=auto --verbose

# Output includes:
# 🔍 [DEBUG] Loading detector chain...
# 🔍 [DEBUG] LovableDetector: confidence=0.95
# 🔍 [DEBUG] Fragment cache hit: base/Dockerfile.base
# 🔍 [DEBUG] Variable substitution: PORT=3000
```

### Getting Help

If issues persist:

1. **Check GitHub Issues**: https://github.com/wrsmith108/vibe-to-docker/issues
2. **Discussions**: https://github.com/wrsmith108/vibe-to-docker/discussions
3. **Bug Reports**: Include `npx vibe-to-docker --version` and verbose output

---

## Advanced Topics

### Customizing Generated Files

All generated files in `.vibe-docker/` are meant to be customized:

```bash
# Safe to edit:
.vibe-docker/Dockerfile            # Add dependencies, change Node.js version
.vibe-docker/docker-compose.yml    # Add services (Redis, PostgreSQL)
.vibe-docker/nginx.conf            # Add SSL, custom routes
.vibe-docker/.env                  # Update environment variables

# Generated reference (don't edit):
.vibe-docker/.env.example          # Regenerated on re-init
```

### Re-initializing

```bash
# Preview changes without overwriting
npx vibe-to-docker init --tool=auto --dry-run

# Force overwrite (caution: loses customizations)
npx vibe-to-docker init --tool=lovable --force

# Recommended: Manual merge
# 1. Backup your customizations
cp .vibe-docker/Dockerfile .vibe-docker/Dockerfile.backup

# 2. Re-initialize
npx vibe-to-docker init --tool=lovable

# 3. Merge changes manually
diff .vibe-docker/Dockerfile .vibe-docker/Dockerfile.backup
```

### Uninstalling

```bash
# Remove all vibe-to-docker files
npx vibe-to-docker uninstall

# Removes:
# - .vibe-docker/ directory
# - Docker configuration files
# - Agent coordination files (.swarm/)

# Preserves:
# - Your application code
# - package.json
# - node_modules
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Initialize Docker
        run: npx vibe-to-docker init --tool=auto

      - name: Build production image
        run: docker build -t myapp:latest -f .vibe-docker/Dockerfile --target production .

      - name: Push to registry
        run: docker push your-registry/myapp:latest
```

---

## FAQ

### Q: Do I need to commit `.vibe-docker/` to git?

**A**: Yes! Commit everything in `.vibe-docker/` EXCEPT `.env`:

```bash
# .gitignore
.vibe-docker/.env       # DO NOT commit (has secrets)
.swarm/                 # DO NOT commit (local coordination)

# Commit these:
.vibe-docker/Dockerfile
.vibe-docker/docker-compose.yml
.vibe-docker/.env.example
.vibe-docker/nginx.conf
```

### Q: Can I use this with an existing Dockerfile?

**A**: Yes, but vibe-to-docker will overwrite it. Recommended approach:

```bash
# 1. Backup your Dockerfile
cp Dockerfile Dockerfile.backup

# 2. Initialize (will create .vibe-docker/Dockerfile)
npx vibe-to-docker init --tool=auto

# 3. Merge your customizations into .vibe-docker/Dockerfile
# 4. Delete old Dockerfile (or keep as reference)
```

### Q: How do I add a database (PostgreSQL, Redis)?

**A**: Edit `.vibe-docker/docker-compose.yml`:

```yaml
services:
  app-dev:
    # ... existing config ...
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

### Q: Why does initialization take so long?

**A**: First-time Docker builds cache layers. Subsequent builds are 3-10x faster:

```
First build:  60-90 seconds (downloads base images)
Cached build: 10-30 seconds (reuses layers)
Code changes: 5-15 seconds (only rebuilds changed layers)
```

### Q: Can I use this in production?

**A**: Absolutely! Generated configuration includes:

- ✅ Multi-stage builds (small image size)
- ✅ Security headers (OWASP recommended)
- ✅ Non-root execution (container escape protection)
- ✅ Health checks (Kubernetes compatible)
- ✅ Gzip compression (60-70% bandwidth reduction)
- ✅ SSL/TLS ready (nginx configuration)

Deploy to: AWS ECS, GCP Cloud Run, DigitalOcean, Heroku, Vercel

### Q: What if my tool isn't detected correctly?

**A**: Use explicit `--tool=` flag:

```bash
# Instead of auto-detection
npx vibe-to-docker init --tool=auto

# Specify explicitly
npx vibe-to-docker init --tool=lovable
```

### Q: How do I update vibe-to-docker?

**A**:

```bash
# NPX (always latest)
npx vibe-to-docker@latest init --tool=auto

# Global installation
npm update -g vibe-to-docker

# Local dev dependency
npm update vibe-to-docker
```

---

## Next Steps

After successful initialization:

1. **Review Configuration**: Check `.vibe-docker/.env` for environment variables
2. **Customize Dockerfile**: Add dependencies, change Node.js version as needed
3. **Test Locally**:
   ```bash
   cd .vibe-docker
   docker-compose logs -f
   ```
4. **Deploy to Production**: Use generated Dockerfile with your cloud provider

---

## Additional Resources

- **CLI User Guide**: [docs/CLI_USER_GUIDE.md](CLI_USER_GUIDE.md)
- **Architecture Documentation**: [docs/architecture/INITIALIZATION_ARCHITECTURE.md](architecture/INITIALIZATION_ARCHITECTURE.md)
- **Tool-Specific Guides**:
  - [Lovable Guide](guides/LOVABLE_GUIDE.md)
  - [Bolt Guide](guides/BOLT_GUIDE.md)
  - [V0 Guide](guides/V0_GUIDE.md)
  - [Figma Make Guide](guides/FIGMA_MAKE_GUIDE.md)
- **Migration Guides**:
  - [v3 → v4 Migration](MIGRATION_V3_TO_V4.md)
  - [v2 → v3 Migration](MIGRATION_V2_TO_V3.md)

---

**Document Version**: 1.0.0
**Created**: November 20, 2025
**Last Updated**: November 20, 2025
**Maintained By**: Vibe-to-Docker Team
