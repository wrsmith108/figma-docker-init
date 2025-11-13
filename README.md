# Vibe-to-Docker

[![npm version](https://badge.fury.io/js/vibe-to-docker.svg)](https://www.npmjs.com/package/vibe-to-docker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.8.1-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-1%2C231%20passing-brightgreen.svg)](https://github.com/wrsmith108/vibe-to-docker)
[![Coverage](https://img.shields.io/badge/coverage-99.4%25-brightgreen.svg)](https://github.com/wrsmith108/vibe-to-docker)

Universal Docker containerization tool for AI-generated projects. Automatically detects and configures Docker for projects created with Lovable, Bolt, V0, and Figma Make.

## Features

- **Automatic Tool Detection**: Intelligently identifies project type (Lovable, Bolt, V0, Figma Make)
- **Tool-Specific Optimization**: Tailored Docker configurations for each AI development tool
- **Production Ready**: Multi-stage builds, nginx proxy, security best practices
- **Zero Config**: Works out of the box with sensible defaults
- **Per-Project Setup**: Configurations install to `.vibe-docker/` directory
- **Multi-Service Support**: Full-stack applications with databases and backends

## Quick Start

```bash
# Navigate to your AI-generated project
cd your-project

# Initialize Docker configuration (auto-detects project type)
npx vibe-to-docker init

# Start containers
cd .vibe-docker && docker-compose up -d --build
```

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

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://github.com/wrsmith108/vibe-to-docker#readme)
- 🐛 [Issue Tracker](https://github.com/wrsmith108/vibe-to-docker/issues)
- 💬 [Discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

## Acknowledgments

Built for the AI-powered development community. Supporting Figma Make, Lovable, V0, Bolt, and modern web frameworks.

---

**Made with ❤️ for the AI-powered development community**
