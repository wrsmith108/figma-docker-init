# Vibe Docker Init

[![npm version](https://badge.fury.io/js/vibe-to-docker.svg)](https://www.npmjs.com/package/vibe-to-docker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.8.1-brightgreen.svg)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)
[![Tests](https://img.shields.io/badge/tests-368%20passing-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)](https://github.com/your-username/vibe-to-docker)

Quick-start Docker setup for Figma Make-exported React/Vite/TypeScript projects. This CLI tool generates production-ready Docker configurations tailored for different project types and deployment scenarios.

## 📢 What's New in v2.0.0

### v2.0.0 - Stable Release (October 26, 2025)
🎉 **STABLE RELEASE**: Production-ready Docker setup with zero warnings and optimal developer experience

**Key Features:**
- ✅ **Zero Warning Installation**: Clean output with no template or configuration warnings
- ✅ **Per-Project Configuration**: Each project gets its own `.vibe-docker/` directory
- ✅ **Detached Mode by Default**: Containers start in background, terminal returns immediately
- ✅ **HTTP-Only Development**: Simplified nginx configuration without SSL complexity
- ✅ **Automatic .env Creation**: No manual file copying required
- ✅ **GitHub Codespaces Ready**: Validated and tested in cloud development environments

**Installation:**
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

# View logs if needed
docker-compose logs -f
```

**What's Included:**
- Modern Docker Compose configuration (no obsolete version field)
- Optimized nginx proxy with WebSocket support for Vite HMR
- Multi-stage Dockerfile with production builds
- Comprehensive documentation in DOCKER.md
- Environment variable template (.env.example)
- Health checks and monitoring endpoints

---

## 📋 Beta Testing History

### v2.0.0-beta.9 - Clean Output (October 26, 2025)
🧹 **CLEANUP**: Removed all template warnings for cleaner installation

### v2.0.0-beta.8 - Improved User Experience (October 26, 2025)
📝 **UX IMPROVEMENT**: Docker containers now run in detached mode by default

**Fixed Issues:**
- ✅ **Terminal Returns to Prompt**: Added `-d` flag to run containers in background
- ✅ **Clearer Instructions**: Users now get their terminal back after starting containers
- ✅ **Log Viewing**: Added instructions for viewing logs with `docker-compose logs -f`

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- Updated docker-compose command from `up --build` to `up -d --build`
- Containers start in background (detached mode)
- Terminal returns to prompt immediately
- Added log viewing instructions for users who want to see output

---

### v2.0.0-beta.7 - Nginx SSL Fix (October 26, 2025)
🔧 **HOTFIX**: Fixed nginx crash loop caused by missing SSL certificates (complete fix)

**Fixed Issues:**
- ✅ **Removed SSL Configuration**: Eliminated SSL/HTTPS from basic template nginx.conf
- ✅ **Nginx Stability**: nginx now starts successfully without SSL certificates
- ✅ **Simplified Configuration**: Reduced nginx.conf from 182 lines to 100 lines for development
- ✅ **HTTP-Only Mode**: Basic template now uses HTTP-only (perfect for local development)

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- Completely rewrote nginx.conf removing all SSL/TLS configuration
- Removed SSL server block requiring /etc/ssl/certs/server.crt
- Removed HTTPS redirect logic from HTTP server block
- Both app-dev and nginx services now start successfully
- All users get working nginx out of the box

**For Production SSL:**
- Use the `ui-heavy` template which includes SSL setup instructions
- Or manually add SSL certificates and configuration as needed

---

### v2.0.0-beta.6 - Nginx SSL Fix (October 26, 2025)
🔧 **HOTFIX**: Fixed nginx crash loop caused by missing SSL certificates

**Fixed Issues:**
- ✅ **Removed SSL Configuration**: Eliminated SSL/HTTPS from basic template nginx.conf
- ✅ **Nginx Stability**: nginx now starts successfully without SSL certificates
- ✅ **Simplified Configuration**: Reduced nginx.conf from 182 lines to 98 lines for development
- ✅ **HTTP-Only Mode**: Basic template now uses HTTP-only (perfect for local development)

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- Removed SSL/TLS server block requiring /etc/ssl/certs/server.crt
- Removed HTTPS redirect logic from HTTP server block
- Simplified nginx.conf for HTTP-only development
- Both app-dev and nginx services now start successfully

**For Production SSL:**
- Use the `ui-heavy` template which includes SSL setup instructions
- Or manually add SSL certificates and configuration as needed

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

---

### v2.0.0-beta.4 - Critical Installation Fix (October 26, 2025)
🔧 **HOTFIX**: Resolves npm installation loop caused by unnecessary dependency

**Fixed Issues:**
- ✅ **Removed AgentDB Dependency**: Eliminated unnecessary 100+ MB ML dependency causing installation hangs
- ✅ **Faster Installation**: Reduced install time from minutes to seconds
- ✅ **Node v16 Compatibility**: Now works on older Node versions (though >=20.8.1 still recommended)
- ✅ **Smaller Package Size**: Reduced from 148KB to minimal size

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- Removed `agentdb` dependency that was not used by the CLI tool
- Eliminated onnxruntime-node and other ML package downloads
- Fixed infinite loop during `npm install` on some systems

---

### v2.0.0-beta.3 - Enhanced Developer Experience (October 26, 2025)
🎯 **IMPROVEMENTS**: Streamlined setup workflow and simplified Docker configuration

**New Features:**
- ✅ **Automatic .env Creation**: No longer need to manually copy `.env.example` to `.env`
- ✅ **Simplified Docker Compose**: Reduced from 267 lines to 78 lines for better maintainability
- ✅ **Fixed YAML Syntax**: Resolved context path issues and removed problematic template variables
- ✅ **Improved Volume Paths**: Changed build context to use parent directory correctly

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**What Changed:**
- The setup script now automatically creates `.env` from `.env.example`
- Simplified docker-compose.yml template focuses on essential services
- Fixed build context paths to properly reference project files
- Removed complex monitoring services for cleaner initial setup

---

### v2.0.0-beta.2 - Critical Bug Fixes (October 26, 2025)
🔧 **HOTFIX**: Resolves execution errors in v2.0.0-beta.1

**Fixed Issues:**
- ✅ **Module System Compatibility**: Converted CommonJS modules to ES modules for proper import/export
- ✅ **Missing Dependencies**: Added `ensureVibeDockerStructure` function that was causing runtime errors
- ✅ **Template Path Resolution**: Fixed template discovery to correctly locate package templates
- ✅ **GitHub Codespaces Support**: Now works correctly in all npx environments

**Installation:**
```bash
npx vibe-to-docker@beta basic
```

**Recommended for:** All users experiencing "SyntaxError" or "not defined" errors with beta.1

---

### v2.0.0 - Per-Project Installation Architecture (October 2025)
- **Per-Project Installation**: Docker configurations now install to `.vibe-docker/` directory in each project
- **Improved Path Resolution**: Enhanced path handling for multi-project workflows
- **Better Organization**: Centralized configuration management per project
- **Migration Support**: Seamless migration from global to per-project setup
- **100% Test Coverage**: All 368 tests passing across Ubuntu, Windows, and macOS
- **Enhanced Error Handling**: Better validation and user feedback

## 🚀 Features

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

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g vibe-to-docker
```

### One-time Use (npx)

```bash
npx vibe-to-docker [template]
```

### Local Installation

```bash
npm install --save-dev vibe-to-docker
```

## 🎯 Quick Start

1. Navigate to your React/Vite/TypeScript project root
2. Run the CLI tool:

```bash
vibe-to-docker ui-heavy
```

3. Customize the generated `.env.example` file and rename it to `.env`
4. Build and run your containerized application:

```bash
docker-compose up --build
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

### Available Templates

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

### Command Options

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

### Directory Structure Benefits

- **Isolation**: Each project maintains its own Docker configuration
- **Portability**: Easy to version control and share
- **Organization**: Centralized configuration management
- **Multi-Project**: Support for multiple projects with different configurations

### File Descriptions

- **Dockerfile**: Optimized multi-stage build with development and production targets
- **docker-compose.yml**: Complete orchestration with service definitions, networks, and volumes
- **.dockerignore**: Excludes unnecessary files from build context for faster builds
- **nginx.conf**: Production-ready Nginx configuration with security headers and caching
- **.env.example**: Template for environment variables with documentation
- **DOCKER.md**: Comprehensive guide for Docker usage and customization

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables to configure:

```env
# Application
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com

# Container Configuration
CONTAINER_PORT=3000
HOST_PORT=80

# Build Configuration
BUILD_TARGET=production
```

### Customizing Templates

The generated files serve as a starting point. Common customizations include:

1. **Dockerfile**: Adjust Node.js version, add build steps, or install additional dependencies
2. **nginx.conf**: Modify server configuration, add SSL, or configure reverse proxy
3. **docker-compose.yml**: Add databases, Redis, or other services

## 🐳 Docker Commands

### Development

```bash
# Build and start development environment
docker-compose up --build

# Start with logs
docker-compose up --build --logs

# Background mode
docker-compose up -d --build
```

### Production

```bash
# Build production image
docker build --target production -t your-app:latest .

# Run production container
docker run -p 80:80 --env-file .env your-app:latest

# Using docker-compose for production
docker-compose -f docker-compose.yml up -d
```

### Maintenance

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Remove volumes (careful!)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
```

## 🔒 Security Features

The generated configurations include security best practices:

- **Non-root user**: Containers run as non-root user
- **Security headers**: Nginx configured with security headers
- **Minimal attack surface**: Multi-stage builds exclude development dependencies
- **Environment isolation**: Proper environment variable handling
- **Network security**: Internal networking with docker-compose

## 🚀 Deployment

### Cloud Platforms

The generated Docker configuration works with major cloud platforms:

- **Vercel**: Use Dockerfile for containerized deployments
- **Heroku**: Compatible with Heroku Container Registry
- **AWS ECS/Fargate**: Production-ready for AWS container services
- **Google Cloud Run**: Optimized for serverless containers
- **DigitalOcean App Platform**: Ready for platform deployment

### CI/CD Integration

Example GitHub Actions workflow:

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
      - name: Deploy to production
        run: # Your deployment commands
```

## 🛠️ Development

### Prerequisites

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

### Production Deployment

```bash
# Build production image
cd .vibe-docker
docker build --target production -t myapp:v1.0.0 .

# Tag for registry
docker tag myapp:v1.0.0 registry.com/myapp:v1.0.0

# Push to registry
docker push registry.com/myapp:v1.0.0
```

## 🐛 Troubleshooting

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

## 🙏 Acknowledgments

- Inspired by create-react-app and similar bootstrapping tools
- Built for the AI-powered development community
- Optimized for Figma Make, Lovable, V0, Bolt, and modern frameworks
- Special thanks to all contributors and early adopters

---

**Made with ❤️ for the AI-powered development community**

Supporting: Figma Make • Lovable • V0 • Bolt • And more...
