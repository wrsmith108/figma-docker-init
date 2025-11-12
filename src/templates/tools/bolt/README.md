# Bolt Docker Template

Optimized Docker configuration for Bolt (StackBlitz) projects with Remix + Vite + TypeScript stack.

## Features

- **Multi-stage build** for minimal production image size
- **Node 20 Alpine** base image for security and performance
- **Port 5173** (Vite default)
- **Remix routing** support with server-side rendering
- **WebContainer compatibility** for StackBlitz workflows
- **Health checks** for container orchestration
- **Non-root user** for enhanced security
- **Optimized caching** for faster builds

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional)
- Node.js 18+ (for local development)

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=production
PORT=5173
```

### 3. Build and Run

**Using Docker:**

```bash
# Build the image
docker build -t my-bolt-app .

# Run the container
docker run -p 5173:5173 --env-file .env my-bolt-app
```

**Using Docker Compose:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 4. Access Your Application

Open your browser to: http://localhost:5173

## Project Structure

```
.
├── Dockerfile              # Multi-stage production build
├── .dockerignore          # Optimize build context
├── docker-compose.yml     # Orchestration configuration
├── .env.example           # Environment variable template
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── remix.config.js        # Remix configuration
├── app/                   # Remix application code
│   ├── routes/           # Route components
│   ├── components/       # Shared components
│   └── entry.server.tsx  # Server entry point
├── public/                # Static assets
└── build/                 # Production build output (generated)
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Application port | No | 5173 |
| `HOST` | Bind host | No | 0.0.0.0 |
| `NODE_ENV` | Node environment | No | production |
| `SESSION_SECRET` | Session encryption key | Recommended | - |

## Remix Configuration

The template supports Remix with:

1. **Server-side rendering**: Full SSR support
2. **File-based routing**: Routes in `app/routes/`
3. **Loaders and actions**: Data fetching and mutations
4. **Sessions**: Cookie-based sessions (configure SESSION_SECRET)

### Build Output

Remix builds to two directories:
- `build/`: Server-side code
- `public/build/`: Client-side assets

Both are included in the production image.

## Build Optimization

The Dockerfile uses multi-stage builds to minimize image size:

1. **Builder stage**: Installs all dependencies and builds the app
2. **Production stage**: Only includes production dependencies and built assets

Typical image sizes:
- Builder: ~600MB
- Production: ~180MB

## Health Checks

The container includes health checks that ping the application every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3
```

This enables:
- Automatic container restarts on failure
- Integration with orchestration platforms
- Load balancer health monitoring

## Security Features

- **Non-root user**: Application runs as `bolt` user (UID 1001)
- **Alpine Linux**: Minimal attack surface
- **No secrets in image**: Environment variables injected at runtime
- **Production dependencies only**: Smaller image, fewer vulnerabilities

## Troubleshooting

### Container fails to start

Check logs:
```bash
docker logs <container-id>
```

Common issues:
- Missing `npm run start` script in package.json
- Build artifacts not copied correctly
- Port already in use

### Port already in use

Change the port mapping:
```bash
docker run -p 3000:5173 --env-file .env my-bolt-app
```

### Build fails

Ensure your package.json has the required scripts:

```json
{
  "scripts": {
    "build": "remix vite:build",
    "start": "remix-serve ./build/server/index.js"
  }
}
```

### WebContainer compatibility

Bolt uses StackBlitz WebContainers. This Docker template replicates the runtime environment:

- Node 20 (WebContainer uses latest Node)
- Vite dev server compatibility
- Remix SSR support

## Development vs Production

This template is optimized for **production**. For development:

```bash
# Run Remix dev server locally
npm install
npm run dev
```

The dev server includes:
- Hot module replacement (HMR)
- Instant feedback
- Better error messages

## StackBlitz WebContainer Notes

When migrating from StackBlitz:

1. **File system**: WebContainers use in-memory FS. Docker uses real FS.
2. **Ports**: WebContainers auto-assign ports. Docker uses explicit mapping.
3. **Build**: WebContainers build on-demand. Docker builds at image creation.

The template handles these differences automatically.

## Integration with Databases

For database integration (PostgreSQL, MySQL, etc.):

1. Add database service to docker-compose.yml:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
```

2. Update .env with DATABASE_URL
3. Install database client (Prisma, Drizzle, etc.)

## Performance Tuning

For production workloads:

1. **Enable caching**: Use Redis for session storage
2. **CDN**: Serve static assets from CDN
3. **Load balancing**: Run multiple containers behind a load balancer
4. **Monitoring**: Add APM tools (Sentry, New Relic)

## License

This template is part of vibe-to-docker and follows the same license.
