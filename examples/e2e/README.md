# End-to-End Examples

This directory contains complete, working examples demonstrating how to use **vibe-to-docker** with projects from different AI-powered development tools.

## Overview

Each example represents a real-world project structure from popular vibe-coding platforms:

| Tool | Example | Framework | Description |
|------|---------|-----------|-------------|
| **Lovable** | [lovable-example](./lovable-example/) | React + Vite + Tailwind | Todo list application |
| **Bolt** | [bolt-example](./bolt-example/) | Remix + TypeScript | Dashboard application |
| **V0** | [v0-example](./v0-example/) | Next.js 14 + TypeScript | Landing page |
| **Figma Make** | [figma-make-example](./figma-make-example/) | React + Vite + Vanilla CSS | Portfolio website |

## Quick Start

### 1. Choose an Example

Navigate to any example directory:

```bash
cd lovable-example    # or bolt-example, v0-example, figma-make-example
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Without Docker

Test the application locally:

```bash
npm run dev
```

### 4. Dockerize with vibe-to-docker

Initialize Docker configuration:

```bash
vibe-to-docker basic
# or
vibe-to-docker ui-heavy
```

### 5. Build and Run with Docker

```bash
cd .vibe-docker
docker-compose up -d --build
```

### 6. Access Your Application

- **Development**: http://localhost:3000
- **Production**: http://localhost:8080
- **Nginx Proxy**: http://localhost:8888

## Example Details

### Lovable Example

**What it demonstrates:**
- React 18 with modern hooks
- Vite for fast development
- Tailwind CSS for styling
- TanStack Query integration
- Client-side state management

**Key Features:**
- Interactive todo list
- Real-time updates
- Responsive design
- Modern UI patterns

**Typical Use Case:**
Lovable projects are great for rapid prototyping and full-stack applications with modern React patterns.

[View Lovable Example →](./lovable-example/)

---

### Bolt Example

**What it demonstrates:**
- Remix full-stack framework
- TypeScript for type safety
- Server-side rendering
- File-based routing
- Modern React patterns

**Key Features:**
- Dashboard with metrics
- Server-side data loading
- TypeScript integration
- Activity feed

**Typical Use Case:**
Bolt projects excel at full-stack applications with SSR, data loading, and complex routing needs.

[View Bolt Example →](./bolt-example/)

---

### V0 Example

**What it demonstrates:**
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Lucide icons library
- Server Components

**Key Features:**
- Modern landing page
- Server Components
- Optimized images
- SEO-friendly

**Typical Use Case:**
V0 projects are perfect for marketing sites, landing pages, and content-driven applications with excellent SEO.

[View V0 Example →](./v0-example/)

---

### Figma Make Example

**What it demonstrates:**
- React 18 with Vite
- Vanilla CSS (no framework)
- Component-based architecture
- Figma-to-code workflow
- Custom styling

**Key Features:**
- Portfolio website
- Pixel-perfect design
- Custom CSS components
- Responsive layout

**Typical Use Case:**
Figma Make projects represent design-first workflows where designers create in Figma and developers implement with precision.

[View Figma Make Example →](./figma-make-example/)

## Comparison Matrix

| Feature | Lovable | Bolt | V0 | Figma Make |
|---------|---------|------|----|-----------|
| **Framework** | React + Vite | Remix | Next.js | React + Vite |
| **TypeScript** | Optional | ✅ Yes | ✅ Yes | Optional |
| **SSR** | ❌ No | ✅ Yes | ✅ Yes | ❌ No |
| **Routing** | Client-side | File-based | App Router | Client-side |
| **Styling** | Tailwind | CDN/Custom | Tailwind | Vanilla CSS |
| **Build Tool** | Vite | Vite | Next.js | Vite |
| **Complexity** | Low | Medium | Medium | Low |
| **Best For** | SPAs, Dashboards | Full-stack apps | Marketing sites | Design-first |

## What vibe-to-docker Detects

When you run `vibe-to-docker` on each example, it automatically detects:

### Lovable Example
```
✓ Project: lovable-todo-app
✓ Framework: react-vite
✓ TypeScript: false
✓ UI Library: Tailwind CSS
✓ Build Output: dist
✓ Dependencies: ~15
```

### Bolt Example
```
✓ Project: bolt-dashboard-app
✓ Framework: remix
✓ TypeScript: true
✓ UI Library: none (CDN)
✓ Build Output: build
✓ Dependencies: ~10
```

### V0 Example
```
✓ Project: v0-landing-page
✓ Framework: next.js
✓ TypeScript: true
✓ UI Library: Tailwind CSS
✓ Build Output: .next / out
✓ Dependencies: ~15
```

### Figma Make Example
```
✓ Project: figma-portfolio-site
✓ Framework: react-vite
✓ TypeScript: false
✓ UI Library: none (vanilla CSS)
✓ Build Output: dist
✓ Dependencies: ~10
```

## Common Workflows

### Testing an Example

```bash
# 1. Navigate to example
cd lovable-example

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser to http://localhost:3000
```

### Dockerizing an Example

```bash
# 1. From example directory
vibe-to-docker basic

# 2. Review generated files
ls -la .vibe-docker/

# 3. Customize if needed
nano .vibe-docker/.env

# 4. Build and run
cd .vibe-docker
docker-compose up -d --build

# 5. Check logs
docker-compose logs -f

# 6. Access application
open http://localhost:8888
```

### Building for Production

```bash
# 1. Test build locally
npm run build

# 2. Preview production build
npm run preview

# 3. Dockerize
vibe-to-docker ui-heavy

# 4. Build Docker image
cd .vibe-docker
docker-compose build

# 5. Run in production mode
docker-compose up -d
```

## Docker Templates

vibe-to-docker supports two templates:

### Basic Template
```bash
vibe-to-docker basic
```

**Features:**
- Standard multi-stage build
- Development and production modes
- Basic Nginx configuration
- Standard caching

**Best For:**
- Small to medium projects
- Simple deployment needs
- Quick setup

### UI-Heavy Template
```bash
vibe-to-docker ui-heavy
```

**Features:**
- Advanced dependency caching
- Optimized layer structure
- Enhanced Nginx configuration
- Performance monitoring
- Build-time optimizations

**Best For:**
- Large applications
- Many dependencies
- Production deployments
- Performance-critical apps

## Generated Docker Structure

After running `vibe-to-docker`, each example will have:

```
example-project/
├── .vibe-docker/
│   ├── Dockerfile          # Multi-stage build
│   ├── docker-compose.yml  # Service orchestration
│   ├── .env                # Environment variables
│   ├── .env.example        # Template
│   ├── nginx.conf          # Nginx configuration
│   └── DOCKER.md           # Docker documentation
├── src/                    # Original source code
├── package.json
└── ...
```

## Environment Variables

Each example supports custom environment variables in `.vibe-docker/.env`:

```env
# Port assignments (auto-detected)
DEV_PORT=3000
PROD_PORT=8080
NGINX_PORT=8888

# Project settings (auto-detected)
PROJECT_NAME=my-app
BUILD_OUTPUT_DIR=dist
FRAMEWORK=react-vite

# Custom variables (add your own)
API_URL=https://api.example.com
ANALYTICS_ID=your-analytics-id
FEATURE_FLAGS=experimental
```

## Troubleshooting

### Port Conflicts

If ports are already in use, vibe-to-docker automatically assigns alternatives. Check `.vibe-docker/.env`.

### Build Failures

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Try building locally first
npm run build

# Check for errors
npm run lint
```

### Docker Issues

```bash
# Rebuild containers
cd .vibe-docker
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

### Framework-Specific Issues

**Remix (Bolt):**
- Ensure `output: 'standalone'` in vite.config.ts
- Check server-side code for browser APIs

**Next.js (V0):**
- Use `output: 'standalone'` for Docker
- Check Image optimization settings
- Verify API routes work in Docker

**Vite (Lovable, Figma Make):**
- Ensure `server.host: '0.0.0.0'` in vite.config.js
- Check asset paths are relative

## Testing the Examples

### Manual Testing

```bash
# Test each example
for example in lovable-example bolt-example v0-example figma-make-example; do
  echo "Testing $example..."
  cd $example
  npm install
  npm run build
  cd ..
done
```

### Docker Testing

```bash
# Test Docker builds
for example in lovable-example bolt-example v0-example figma-make-example; do
  echo "Testing Docker for $example..."
  cd $example
  vibe-to-docker basic
  cd .vibe-docker
  docker-compose build
  cd ../..
done
```

## Learning Path

### Beginner
1. Start with **Figma Make Example** - Simple React + Vite
2. Try **Lovable Example** - Add Tailwind CSS
3. Explore Docker basics with `basic` template

### Intermediate
1. Try **V0 Example** - Next.js with SSR
2. Experiment with **Bolt Example** - Remix full-stack
3. Use `ui-heavy` template for optimization

### Advanced
1. Customize Docker configurations
2. Add databases and backend services
3. Implement CI/CD pipelines
4. Deploy to production

## Best Practices

### Development
- Always test locally before Dockerizing
- Use `.env` files for configuration
- Keep dependencies up to date
- Follow framework conventions

### Docker
- Use multi-stage builds
- Minimize image size
- Cache dependencies effectively
- Use `.dockerignore` file

### Production
- Enable production optimizations
- Use environment variables
- Implement health checks
- Monitor performance
- Set up logging

## Additional Resources

### Documentation
- [vibe-to-docker GitHub](https://github.com/wrsmith108/vibe-to-docker)
- [Docker Documentation](https://docs.docker.com)
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org)
- [Remix Documentation](https://remix.run)
- [Vite Documentation](https://vitejs.dev)

### Tools
- [Lovable (formerly GPT Engineer)](https://lovable.dev)
- [Bolt by StackBlitz](https://bolt.new)
- [V0 by Vercel](https://v0.dev)
- [Figma](https://www.figma.com)

### Community
- [GitHub Issues](https://github.com/wrsmith108/vibe-to-docker/issues)
- [GitHub Discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

## Contributing

Found an issue or want to improve an example?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

These examples are part of the vibe-to-docker project and are licensed under the MIT License.

---

**Ready to get started?** Choose an example and start building! 🚀
