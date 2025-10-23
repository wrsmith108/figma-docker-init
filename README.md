# Figma Docker Init

[![npm version](https://badge.fury.io/js/figma-docker-init.svg)](https://www.npmjs.com/package/figma-docker-init)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

Quick-start Docker setup for Figma Make-exported React/Vite/TypeScript projects. This CLI tool generates production-ready Docker configurations tailored for different project types and deployment scenarios.

## 🚀 Features

- **Multiple Templates**: Choose from optimized configurations for different project types
- **Production Ready**: Includes Nginx configuration, multi-stage builds, and security best practices
- **Zero Config**: Works out of the box with sensible defaults
- **Customizable**: Easy to modify generated files for specific needs
- **TypeScript Support**: Full TypeScript support with optimized builds
- **Development Friendly**: Hot reload support and development configurations

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g figma-docker-init
```

### One-time Use (npx)

```bash
npx figma-docker-init [template]
```

### Local Installation

```bash
npm install --save-dev figma-docker-init
```

## 🎯 Quick Start

1. Navigate to your React/Vite/TypeScript project root
2. Run the CLI tool:

```bash
figma-docker-init ui-heavy
```

3. Customize the generated `.env.example` file and rename it to `.env`
4. Build and run your containerized application:

```bash
docker-compose up --build
```

## 🛠️ Usage

### Basic Command

```bash
figma-docker-init [template] [options]
```

### Available Templates

#### `basic`
Minimal Docker setup with essential configuration:
- Basic Dockerfile with Node.js
- Simple docker-compose.yml
- Basic Nginx configuration
- Environment file template

```bash
figma-docker-init basic
```

#### `ui-heavy`
Optimized for UI-heavy applications with advanced caching and performance optimizations:
- Multi-stage Dockerfile with build optimization
- Advanced Nginx configuration with gzip and caching
- Performance-optimized docker-compose setup
- Comprehensive environment configuration

```bash
figma-docker-init ui-heavy
```

### Command Options

```bash
# Show help information
figma-docker-init --help
figma-docker-init -h

# Show version
figma-docker-init --version
figma-docker-init -v

# List all available templates
figma-docker-init --list
```

## 📁 Generated Files

The CLI generates the following files based on your chosen template:

```
your-project/
├── Dockerfile              # Multi-stage build configuration
├── docker-compose.yml      # Container orchestration
├── .dockerignore           # Files to exclude from build context
├── nginx.conf              # Nginx server configuration
├── .env.example            # Environment variables template
└── DOCKER.md               # Detailed documentation
```

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

- Node.js >= 18.0.0
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

### Basic React App

```bash
# In your React project
figma-docker-init basic
docker-compose up --build
# App available at http://localhost
```

### Complex UI Application

```bash
# For apps with heavy UI components
figma-docker-init ui-heavy
cp .env.example .env
# Edit .env with your configuration
docker-compose up --build
```

### Production Deployment

```bash
# Build production image
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
# Change port in docker-compose.yml
ports:
  - "8080:80"  # Use different host port
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

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

- 📖 [Documentation](https://github.com/your-username/figma-docker-init#readme)
- 🐛 [Issue Tracker](https://github.com/your-username/figma-docker-init/issues)
- 💬 [Discussions](https://github.com/your-username/figma-docker-init/discussions)

## 🙏 Acknowledgments

- Inspired by create-react-app and similar bootstrapping tools
- Built for the Figma developer community
- Optimized for modern React/Vite/TypeScript workflows

---

**Made with ❤️ for the Figma developer community**
