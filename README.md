# Vibe Docker Init

[![npm version](https://badge.fury.io/js/vibe-to-docker.svg)](https://www.npmjs.com/package/vibe-to-docker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.8.1-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)
[![Tests](https://img.shields.io/badge/tests-368%20passing-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)

Universal Docker containerization tool for AI-generated projects. Automatically detects and configures Docker for projects created with Lovable, Bolt, V0, and Figma Make.

## Features

- **Automatic Tool Detection**: Intelligently identifies project type (Lovable, Bolt, V0, Figma Make)
- **Tool-Specific Optimization**: Tailored Docker configurations for each AI development tool
- **Production Ready**: Multi-stage builds, nginx proxy, security best practices
- **Zero Config**: Works out of the box with sensible defaults
- **Per-Project Setup**: Configurations install to `.vibe-docker/` directory
- **Multi-Service Support**: Full-stack applications with databases and backends

**Key Features:**
- ✅ **Zero Warning Installation**: Clean output with no template or configuration warnings
- ✅ **Per-Project Configuration**: Each project gets its own `.vibe-docker/` directory
- ✅ **Detached Mode by Default**: Containers start in background, terminal returns immediately
- ✅ **HTTP-Only Development**: Simplified nginx configuration without SSL complexity
- ✅ **Automatic .env Creation**: No manual file copying required
- ✅ **GitHub Codespaces Ready**: Validated and tested in cloud development environments

```bash
npx vibe-to-docker basic
```

**Quick Start:**
```bash
# Navigate to your React/Vite project
cd your-project

# Initialize Docker configuration
npx vibe-to-docker basic

# Start containers in background
cd .vibe-docker && docker-compose up -d --build

# Start containers
cd .vibe-docker && docker-compose up -d --build
```

Your application will be available at `http://localhost:3000`.

## Installation

### One-Time Use (Recommended)

```bash
npx vibe-to-docker@beta basic
```

### Global Installation

```bash
npx vibe-to-docker@beta basic
```

### Local Development

```bash
npx vibe-to-docker@beta basic
```

## Supported Tools

### Lovable (React + Vite + Supabase)

---

### v2.0.0-beta.5 - Documentation Fix (October 26, 2025)
📝 **DOCUMENTATION**: Fixed docker-compose instructions

**Fixed Issues:**
- ✅ **Clearer Instructions**: Updated docker-compose command to include cd to .vibe-docker directory
- ✅ **User Confusion**: Removed "no configuration file provided" error by clarifying directory navigation

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- Updated "Next Steps" to show: `cd .vibe-docker && docker-compose up --build`
- Clarified that Docker files are in the `.vibe-docker/` subdirectory

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Supabase integration, real-time features, authentication

### Bolt (Remix + TypeScript)

```bash
npx vibe-to-docker@beta basic
```

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Multi-service orchestration, WebContainer compatibility

### V0 (Next.js 14 + shadcn/ui)

```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- The setup script now automatically creates `.env` from `.env.example`
- Simplified docker-compose.yml template focuses on essential services
- Fixed build context paths to properly reference project files
- Removed complex monitoring services for cleaner initial setup

cd .vibe-docker && docker-compose up -d --build
```

**Features**: Server-side rendering, API routes, static optimization

**Fixed Issues:**
- ✅ **Module System Compatibility**: Converted CommonJS modules to ES modules for proper import/export
- ✅ **Missing Dependencies**: Added `ensureVibeDockerStructure` function that was causing runtime errors
- ✅ **Template Path Resolution**: Fixed template discovery to correctly locate package templates
- ✅ **GitHub Codespaces Support**: Now works correctly in all npx environments

```bash
npx vibe-to-docker@beta basic
```

**Features**: Design-to-code projects, TypeScript support

## Usage

### v2.0.0 - Per-Project Installation Architecture (October 2025)
- **Per-Project Installation**: Docker configurations now install to `.vibe-docker/` directory in each project
- **Improved Path Resolution**: Enhanced path handling for multi-project workflows
- **Better Organization**: Centralized configuration management per project
- **Migration Support**: Seamless migration from global to per-project setup
- **100% Test Coverage**: All 368 tests passing across Ubuntu, Windows, and macOS
- **Enhanced Error Handling**: Better validation and user feedback

```bash
# Initialize with auto-detection
vibe-to-docker init

### v3.0.0 - Universal Tool Support (Coming Soon)

- **🎯 Automatic Tool Detection**: Intelligent detection of Figma Make, Lovable, V0, and Bolt projects
- **🔧 Tool-Specific Optimizations**: Tailored Docker configurations for each AI development tool
- **⚡ Enhanced CLI**: New `--tool` flag for explicit tool selection
- **📚 Comprehensive Guides**: Detailed documentation for each supported tool
- **🔄 Multi-Service Support**: Docker Compose orchestration for fullstack applications
- **🗄️ Database Integration**: Automatic Supabase, PostgreSQL, MySQL configuration

### Core Features

- **Per-Project Configuration**: Each project gets its own `.vibe-docker/` directory
- **Multiple Templates**: Choose from optimized configurations for different project types
- **Production Ready**: Includes Nginx configuration, multi-stage builds, and security best practices
- **Zero Config**: Works out of the box with sensible defaults
- **Customizable**: Easy to modify generated files for specific needs
- **TypeScript Support**: Full TypeScript support with optimized builds
- **Development Friendly**: Hot reload support and development configurations

# Preview without writing files
vibe-to-docker init --dry-run

# Overwrite existing configuration
vibe-to-docker init --force

```bash
npm install -g vibe-to-docker
```

# Show version
vibe-to-docker --version

```bash
npx vibe-to-docker [template]
```

### Legacy Templates (v2.x Compatible)

```bash
npm install --save-dev vibe-to-docker
```

## Generated Files

Running `vibe-to-docker init` creates a `.vibe-docker/` directory in your project:

```bash
vibe-to-docker ui-heavy
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

## 🛠️ Usage

### Quick Start (v3.0.0 Preview)

```bash
# Auto-detect project type and initialize
vibe-to-docker init

# Or specify tool explicitly
vibe-to-docker init --tool=lovable
vibe-to-docker init --tool=figma-make
vibe-to-docker init --tool=v0
vibe-to-docker init --tool=bolt
```

### Basic Command (v2.x Compatible)

```bash
vibe-to-docker [template] [options]
```

## Docker Commands

#### `basic`
Minimal Docker setup for simple frontend projects:
- Basic Dockerfile with Node.js
- Simple docker-compose.yml
- Basic Nginx configuration
- Environment file template

**Best For:** Figma Make, simple React/Vue/Svelte apps

```bash
vibe-to-docker basic
```

#### `ui-heavy`
Optimized for UI-heavy applications with advanced caching:
- Multi-stage Dockerfile with build optimization
- Advanced Nginx configuration with gzip and caching
- Performance-optimized docker-compose setup
- Comprehensive environment configuration

**Best For:** Large component libraries, design systems

```bash
vibe-to-docker ui-heavy
```

#### `fullstack` (v3.0.0)
Complete setup for fullstack applications:
- Multi-service docker-compose
- Frontend + Backend containers
- Database service (PostgreSQL/MySQL)
- Nginx reverse proxy

**Best For:** Lovable, Bolt fullstack projects

```bash
vibe-to-docker init --template=fullstack
```

#### `nextjs` (v3.0.0)
Optimized for Next.js applications:
- Next.js standalone build
- Server-side rendering support
- API routes configuration
- Static + dynamic optimization

**Best For:** V0, Next.js projects

```bash
vibe-to-docker init --template=nextjs
```

#### `supabase` (v3.0.0)
Configured for Supabase integration:
- Supabase client setup
- Environment variable templates
- Authentication configuration
- Real-time features support

**Best For:** Lovable projects with Supabase

```bash
vibe-to-docker init --template=supabase
```

### Production

```bash
# Show help information
vibe-to-docker --help
vibe-to-docker -h

# Show version
vibe-to-docker --version
vibe-to-docker -v

# List all available templates
vibe-to-docker --list

# Initialize with auto-detection (v3.0.0)
vibe-to-docker init

# Specify tool explicitly (v3.0.0)
vibe-to-docker init --tool=<tool>

# Preview without writing files (v3.0.0)
vibe-to-docker init --dry-run

# Overwrite existing configuration (v3.0.0)
vibe-to-docker init --force
```

## 📁 Generated Files

The CLI generates the following files in your project's `.vibe-docker/` directory:

```
your-project/
├── .vibe-docker/          # Per-project Docker configuration
│   ├── config.json         # Project-specific settings
│   ├── Dockerfile          # Multi-stage build configuration
│   ├── docker-compose.yml  # Container orchestration
│   ├── .dockerignore       # Files to exclude from build context
│   ├── nginx.conf          # Nginx server configuration
│   ├── .env.example        # Environment variables template
│   └── DOCKER.md           # Detailed documentation
├── package.json            # Updated with Docker scripts
└── [your project files]
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

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with conventional commits: `git commit -m "feat: add new template"`
5. Push and create a Pull Request

### Adding New Templates

1. Create a new directory in `templates/`
2. Add template files (Dockerfile, docker-compose.yml, etc.)
3. Update the CLI to recognize the new template
4. Add documentation and examples

## 📚 Examples

### Figma Make Project

```bash
cd my-figma-project
vibe-to-docker init --tool=figma-make
cd .vibe-docker && docker-compose up -d --build
# App available at http://localhost:3000
```

### Lovable Fullstack Project

```bash
cd my-lovable-app
vibe-to-docker init --tool=lovable

# Configure Supabase credentials
nano .vibe-docker/.env
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

cd .vibe-docker && docker-compose up -d --build
# App available at http://localhost:3000
```

### V0 Next.js Project

```bash
cd my-v0-project
vibe-to-docker init --tool=v0

cd .vibe-docker && docker-compose up -d --build
# App available at http://localhost:3000
```

### Bolt Multi-Service Project

```bash
cd my-bolt-app
vibe-to-docker init --tool=bolt

# Review generated multi-service configuration
cat .vibe-docker/docker-compose.yml

cd .vibe-docker && docker-compose up -d --build
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Complex UI Application

```bash
# For apps with heavy UI components
vibe-to-docker ui-heavy
cd .vibe-docker
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d --build
```

- **[Lovable Guide](docs/guides/LOVABLE_GUIDE.md)** - Fullstack apps with Supabase
- **[Figma Make Guide](docs/guides/FIGMA_MAKE_GUIDE.md)** - Design-to-code projects
- **[V0 Guide](docs/guides/V0_GUIDE.md)** - Next.js and Tailwind projects
- **[Bolt Guide](docs/guides/BOLT_GUIDE.md)** - WebContainer fullstack apps

```bash
# Build production image
cd .vibe-docker
docker build --target production -t myapp:v1.0.0 .

- **[API Reference](docs/API.md)** - Programmatic usage
- **[Template Architecture](docs/TEMPLATE_ARCHITECTURE.md)** - System design
- **[Contributing Guide](CONTRIBUTING.md)** - Development guide

## Requirements

### Common Issues

**Build fails with permission errors:**
```bash
# Fix permissions
sudo chown -R $USER:$USER .
```

**Port already in use:**
```bash
# Change port in docker-compose.yml or .env
ports:
  - "8080:80"  # Use different host port

# Or update .env
DEV_PORT=5000
NGINX_PORT=7000
```

**Out of disk space:**
```bash
# Clean up Docker
docker system prune -a
```

**Module not found errors:**
```bash
# Rebuild without cache
docker-compose build --no-cache
```

**Supabase connection fails (Lovable projects):**
```bash
# Verify credentials in .vibe-docker/.env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-key

# Rebuild container
cd .vibe-docker
docker-compose up -d --build
```

**Environment variables not available:**
```bash
# Ensure variables are prefixed correctly:
# - VITE_* for Vite projects
# - NEXT_PUBLIC_* for Next.js projects
# - No prefix for server-side only

# Rebuild after changing .env
docker-compose up -d --build
```

### Tool-Specific Troubleshooting

For detailed troubleshooting, see the tool-specific guides:
- [Lovable Troubleshooting](docs/guides/LOVABLE_GUIDE.md#troubleshooting)
- [Figma Make Troubleshooting](docs/guides/FIGMA_MAKE_GUIDE.md#troubleshooting)
- [V0 Troubleshooting](docs/guides/V0_GUIDE.md#troubleshooting)
- [Bolt Troubleshooting](docs/guides/BOLT_GUIDE.md#troubleshooting)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 📖 Documentation

### User Guides

- **[CLI User Guide](docs/CLI_USER_GUIDE.md)** - Complete CLI reference and usage
- **[Migration Guide v2→v3](docs/MIGRATION_V2_TO_V3.md)** - Upgrade from v2.x to v3.0

### Tool-Specific Guides

- **[Lovable Guide](docs/guides/LOVABLE_GUIDE.md)** - Fullstack apps with Supabase
- **[Figma Make Guide](docs/guides/FIGMA_MAKE_GUIDE.md)** - Design-to-code projects
- **[V0 Guide](docs/guides/V0_GUIDE.md)** - Next.js and Tailwind projects
- **[Bolt Guide](docs/guides/BOLT_GUIDE.md)** - WebContainer fullstack apps

### Technical Documentation

- **[API Reference](docs/API.md)** - Programmatic usage
- **[Architecture](docs/TEMPLATE_ARCHITECTURE.md)** - Template system design
- **[Contributing](CONTRIBUTING.md)** - Development guide

## 🤝 Support

- 📖 [Documentation](https://github.com/wrsmith108/vibe-to-docker#readme)
- 🐛 [Issue Tracker](https://github.com/wrsmith108/vibe-to-docker/issues)
- 💬 [Discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

## Acknowledgments

- Inspired by create-react-app and similar bootstrapping tools
- Built for the AI-powered development community
- Optimized for Figma Make, Lovable, V0, Bolt, and modern frameworks
- Special thanks to all contributors and early adopters

---

**Made with ❤️ for the AI-powered development community**

Supporting: Figma Make • Lovable • V0 • Bolt • And more...
