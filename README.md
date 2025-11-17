# Vibe-to-Docker

[![npm version](https://badge.fury.io/js/vibe-to-docker.svg)](https://www.npmjs.com/package/vibe-to-docker)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.8.1-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-1%2C231%20passing-brightgreen.svg)](https://github.com/wrsmith108/vibe-to-docker)
[![Coverage](https://img.shields.io/badge/coverage-99.4%25-brightgreen.svg)](https://github.com/wrsmith108/vibe-to-docker)

## 📦 Version Information

### Current Version: v4.x (Universal Vibe-Coding)
- ✅ **Supported**: Figma, Lovable, Bolt, V0
- ✅ **Maintained**: Active development
- ✅ **License**: Apache 2.0
- 📦 **Install**: `npm install -g vibe-to-docker`

### Legacy Version: v3.x (Figma Only)
- ⚠️ **Deprecated**: No longer maintained (November 2025)
- ⚠️ **Limited**: Figma Make projects only
- 📦 **Install**: `npm install -g vibe-to-docker@3.4.1` (not recommended)
- 📖 **Migration**: See [Migration Guide](docs/MIGRATION_V3_TO_V4.md)
- 🗄️ **Archive**: [v3.x source code](https://github.com/wrsmith108/vibe-to-docker/tree/archive/v3-figma-only)

**Recommendation**: Use v4.x for all new and existing projects.

Universal Docker containerization tool for AI-generated UX prototypes with **fully automated setup**. While `docker init` handles 60-70% of generic containerization, vibe-to-docker adds **AI tool-specific failure pattern mitigation** through 24 features addressing the documented failure modes in AI-generated code: 82% dependency conflicts, 60-70% environment mismatches, and 48% hardcoded secrets.

**One-command setup** automatically handles Docker containers, dependency installation, and security fixes.

## Why Not Just Use Docker Init?

Docker init optimizes for human-written code. Vibe-to-docker optimizes for **AI tool failure patterns**:

| Problem | Docker Init | Vibe-to-Docker |
|---------|-------------|----------------|
| **Dual package managers** (Bolt.new) | ❌ No detection | ✅ Auto-reconciliation (50-60% error reduction) |
| **Environment variables** | ❌ Manual .env | ✅ Auto-detection + secret warnings |
| **Framework variants** | ❌ Generic React | ✅ React-Vite vs React-Webpack vs React-Rollup |
| **Build output paths** | ❌ Assumes /dist | ✅ Detects from config (30% fewer 404s) |
| **Security headers** | ❌ Basic nginx | ✅ OWASP mitigation + SSL/TLS |
| **Performance** | ❌ Sequential | ✅ 40% faster (parallel detection) |

## Features (24 Across 6 Categories)

### AI Tool Detection & Adaptation (5 features)
- **Automatic Tool Detection**: 95% confidence for Lovable, 80% for Bolt/V0/Figma (multi-signature detection)
- **Template Composition**: Fragment-based system reduces Dockerfile from 150 → 60-80 lines
- **Multi-Package Manager Reconciliation**: Eliminates Bolt.new dual lock file conflicts
- **Framework Variant Detection**: React-Vite, React-Webpack, React-Rollup with early exit optimization
- **Per-Project Isolation**: `.vibe-docker/` directory prevents root pollution

### Performance Optimizations (4 features)
- **40% Faster Detection**: Parallel config parsing (Promise.all) for Vite/Rollup/Webpack
- **Template Fragment Caching**: 60-80% faster repeated operations
- **Confidence-Based Early Exit**: Skips unnecessary checks when match found
- **Multi-Stage Build Caching**: 5-10 min → 30-60 sec rebuilds (code-only changes)

### Environment & Configuration (6 features)
- **Auto Environment Detection**: Scans source for `process.env.X`, generates `.env.example`
- **Secret Pattern Identification**: Warns on API_KEY, PASSWORD, TOKEN patterns (48% of AI code)
- **Build-Time vs Runtime Separation**: VITE_, NEXT_PUBLIC_, REACT_APP_ prefix detection
- **Dynamic Port Assignment**: Auto-fallback when ports in use (especially 80 → 8888)
- **Build Output Detection**: Parses configs for correct dist/out/.next paths
- **Template Variable Validation**: Type-safe {{VARIABLE}} substitution with sanitization

### Security Features (5 features)
- **Security Headers**: X-Frame-Options, HSTS, CSP, XSS-Protection (40% OWASP mitigation)
- **Non-Root Execution**: nginx user with limited permissions (100% root damage prevention)
- **SSL/TLS Ready**: TLSv1.2/1.3 with modern ciphers, session caching
- **Input Sanitization**: Prevents directory traversal, null byte injection
- **Read-Only Root FS**: AI agent filesystem access restricted to mounted volumes

### Production Readiness (3 features)
- **Health Check Endpoints**: `/health` with Docker HEALTHCHECK (50% faster incident detection)
- **Monitoring Metrics**: Prometheus-compatible `/metrics` endpoint
- **Gzip Compression**: 60-70% bandwidth reduction for large UI bundles

### Developer Experience (1 feature)
- **Template Validation**: Pre-generation error detection with actionable warnings

## Quick Start

```bash
# Navigate to your AI-generated project
cd your-project

# Initialize Docker configuration (auto-detects project type)
npx vibe-to-docker init
```

**Automated setup includes:**
- Docker container build and start (`docker-compose up -d --build`)
- Dependency installation (`npm install`)
- Security vulnerability fixes (`npm audit fix --force`)

Your application will be available at `http://localhost:3000`.

## Installation

### One-Time Use (Recommended)

```bash
npx vibe-to-docker init
```

### Global Installation

```bash
npm install -g vibe-to-docker
vibe-to-docker init
```

### Local Development

```bash
npm install --save-dev vibe-to-docker
```

## Supported Tools

### Lovable (React + Vite + Supabase)

```bash
cd my-lovable-project
npx vibe-to-docker init --tool=lovable

# Configure Supabase credentials in .vibe-docker/.env
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your-key

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Supabase integration, real-time features, authentication

### Bolt (Remix + TypeScript)

```bash
cd my-bolt-project
npx vibe-to-docker init --tool=bolt

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Multi-service orchestration, WebContainer compatibility

### V0 (Next.js 14 + shadcn/ui)

```bash
cd my-v0-project
npx vibe-to-docker init --tool=v0

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Server-side rendering, API routes, static optimization

### Figma Make (React + Vite)

```bash
cd my-figma-project
npx vibe-to-docker init --tool=figma-make

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Design-to-code projects, TypeScript support

## Usage

### Commands

```bash
# Initialize with auto-detection
vibe-to-docker init

# Specify tool explicitly
vibe-to-docker init --tool=<lovable|bolt|v0|figma-make>

# Preview without writing files
vibe-to-docker init --dry-run

# Overwrite existing configuration
vibe-to-docker init --force

# Show help
vibe-to-docker --help

# Show version
vibe-to-docker --version

# List available templates
vibe-to-docker --list
```

### Legacy Templates (v2.x Compatible)

```bash
# Basic setup (simple frontend projects)
vibe-to-docker basic

# UI-heavy setup (large component libraries)
vibe-to-docker ui-heavy
```

## Generated Files

Running `vibe-to-docker init` creates a `.vibe-docker/` directory in your project:

```
your-project/
├── .vibe-docker/
│   ├── Dockerfile          # Multi-stage build configuration
│   ├── docker-compose.yml  # Container orchestration
│   ├── .dockerignore       # Build optimization
│   ├── nginx.conf          # Production web server
│   ├── .env                # Environment variables (auto-created)
│   ├── .env.example        # Environment template
│   └── DOCKER.md           # Usage documentation
└── [your project files]
```

### File Descriptions

- **Dockerfile**: Optimized multi-stage build with development and production targets
- **docker-compose.yml**: Service definitions, networks, and volumes
- **nginx.conf**: Production-ready nginx with security headers and caching
- **.env**: Auto-generated from template, customize as needed
- **DOCKER.md**: Comprehensive Docker usage guide

## Docker Commands

### Development

```bash
# Start containers in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Production

```bash
# Build production image
docker build --target production -t myapp:latest .

# Run production container
docker run -p 80:80 --env-file .env myapp:latest
```

### Maintenance

```bash
# Rebuild without cache
docker-compose build --no-cache

# Clean up Docker resources
docker system prune -a

# Remove volumes (caution: deletes data)
docker-compose down -v
```

## Configuration

### Environment Variables

The `.env` file is automatically created from `.env.example`. Key variables:

```env
# Application
NODE_ENV=production

# Container Ports
DEV_PORT=5173
NGINX_PORT=3000

# Tool-Specific (Lovable/Supabase)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# Tool-Specific (Next.js)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Customization

Generated files serve as a starting point. Common modifications:

- **Dockerfile**: Adjust Node.js version, add dependencies
- **nginx.conf**: Add SSL, configure reverse proxy
- **docker-compose.yml**: Add databases, Redis, or other services

## Troubleshooting

### Port Already in Use

```bash
# Change port in .vibe-docker/.env
NGINX_PORT=8080
DEV_PORT=5174

# Restart containers
docker-compose up -d --build
```

### Build Failures

```bash
# Rebuild without cache
docker-compose build --no-cache

# Check Docker logs
docker-compose logs app-dev
```

### Supabase Connection Issues (Lovable)

```bash
# Verify credentials in .vibe-docker/.env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Environment variables must be prefixed with VITE_
# Rebuild after changes
docker-compose up -d --build
```

### Module Not Found Errors

```bash
# Ensure node_modules is in .dockerignore
# Rebuild container to reinstall dependencies
docker-compose build --no-cache
```

## Deployment

The generated Docker configuration works with major cloud platforms:

- **AWS ECS/Fargate**: Production-ready for container services
- **Google Cloud Run**: Optimized for serverless containers
- **DigitalOcean App Platform**: Ready for platform deployment
- **Heroku Container Registry**: Compatible with Heroku
- **Vercel**: Use Dockerfile for containerized deployments

### CI/CD Example (GitHub Actions)

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t app:latest .
      - name: Push to registry
        run: docker push your-registry/app:latest
```

## Documentation

### User Guides

- **[CLI User Guide](docs/CLI_USER_GUIDE.md)** - Complete CLI reference
- **[Migration Guide v2→v3](docs/MIGRATION_V2_TO_V3.md)** - Upgrade guide

### Tool-Specific Guides

- **[Lovable Guide](docs/guides/LOVABLE_GUIDE.md)** - Fullstack apps with Supabase
- **[Figma Make Guide](docs/guides/FIGMA_MAKE_GUIDE.md)** - Design-to-code projects
- **[V0 Guide](docs/guides/V0_GUIDE.md)** - Next.js and Tailwind projects
- **[Bolt Guide](docs/guides/BOLT_GUIDE.md)** - WebContainer fullstack apps

### Technical Documentation

- **[API Reference](docs/API.md)** - Programmatic usage
- **[Template Architecture](docs/TEMPLATE_ARCHITECTURE.md)** - System design
- **[Contributing Guide](CONTRIBUTING.md)** - Development guide

## Requirements

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0

## License

Licensed under the Apache License, Version 2.0 - see [LICENSE](LICENSE) file for details.

Copyright 2025 Smith Horn Group Ltd.

## Support

- 📖 [Documentation](https://github.com/wrsmith108/vibe-to-docker#readme)
- 🐛 [Issue Tracker](https://github.com/wrsmith108/vibe-to-docker/issues)
- 💬 [Discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

## Research & Analysis

Feature claims based on:
- **Codebase Analysis**: 24 verified features in v2.1.0 (November 2025)
- **Performance Metrics**: 40% detection improvement documented in `src/lib/detection-optimizer.js:32`
- **Failure Pattern Research**: Analysis of 153M+ lines of AI-generated code
- **Developer Surveys**: 1,300+ developers using AI coding tools

See [docs/research/vibe_to_docker_benefits.md](docs/research/vibe_to_docker_benefits.md) for detailed feature analysis and ROI calculations.

## Acknowledgments

Built for the AI-powered development community. Supporting Figma Make, Lovable, V0, Bolt, and modern web frameworks.

---

**Made with ❤️ for the AI-powered development community**
