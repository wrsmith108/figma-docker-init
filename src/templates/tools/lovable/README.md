# Lovable Docker Template

Optimized Docker configuration for Lovable (formerly GPT Engineer) projects with React + TypeScript + Vite + Supabase stack.

## Features

- **Multi-stage build** for minimal production image size
- **Node 20 Alpine** base image for security and performance
- **Port 8080** (Lovable standard)
- **Supabase integration** with environment variable support
- **shadcn/ui** component support
- **Health checks** for container orchestration
- **Non-root user** for enhanced security
- **Optimized caching** for faster builds

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional)
- Supabase project (or local instance)

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Build and Run

**Using Docker:**

```bash
# Build the image
docker build -t my-lovable-app .

# Run the container
docker run -p 8080:8080 --env-file .env my-lovable-app
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

Open your browser to: http://localhost:8080

## Project Structure

```
.
├── Dockerfile              # Multi-stage production build
├── .dockerignore          # Optimize build context
├── docker-compose.yml     # Orchestration configuration
├── .env.example           # Environment variable template
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
└── src/                   # Application source code
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | - |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `PORT` | Application port | No | 8080 |
| `NODE_ENV` | Node environment | No | production |

## Build Optimization

The Dockerfile uses multi-stage builds to minimize image size:

1. **Builder stage**: Installs all dependencies and builds the app
2. **Production stage**: Only includes production dependencies and built assets

Typical image sizes:
- Builder: ~500MB
- Production: ~150MB

## Health Checks

The container includes health checks that ping the application every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
```

This enables:
- Automatic container restarts on failure
- Integration with orchestration platforms (Kubernetes, Docker Swarm)
- Load balancer health monitoring

## Security Features

- **Non-root user**: Application runs as `lovable` user (UID 1001)
- **Alpine Linux**: Minimal attack surface
- **No secrets in image**: Environment variables injected at runtime
- **Production dependencies only**: Smaller image, fewer vulnerabilities

## Troubleshooting

### Container fails to start

Check logs:
```bash
docker logs <container-id>
```

### Port already in use

Change the port mapping:
```bash
docker run -p 8081:8080 --env-file .env my-lovable-app
```

### Supabase connection fails

Verify environment variables:
```bash
docker exec <container-id> env | grep SUPABASE
```

### Build is slow

Docker caches layers. If you change dependencies:
```bash
docker build --no-cache -t my-lovable-app .
```

## Development vs Production

This template is optimized for **production**. For development:

```bash
# Run Vite dev server locally
npm install
npm run dev
```

## Integration with Supabase

The template supports both:

1. **Supabase Cloud**: Use your hosted project URL and keys
2. **Local Supabase**: Uncomment the database service in docker-compose.yml

### Using Supabase Cloud

1. Create a project at https://app.supabase.com
2. Get your URL and anon key from project settings
3. Add to `.env` file

### Using Local Supabase

1. Uncomment the `supabase-db` service in docker-compose.yml
2. Start with `docker-compose up -d`
3. Run Supabase migrations if needed

## shadcn/ui Components

The template supports shadcn/ui components out of the box. Install components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

Components are automatically included in the build.

## License

This template is part of vibe-to-docker and follows the same license.
