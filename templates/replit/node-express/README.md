# Replit Node.js/Express Docker Template

This template provides a production-ready Docker setup for Replit Node.js/Express projects with PostgreSQL database support.

## Features

- **Multi-stage Docker build** - Optimized for TypeScript and JavaScript projects
- **PostgreSQL 16** - Database with health checks and persistent volumes
- **Nginx reverse proxy** - Optional production-ready web server
- **Security hardened** - Non-root user, security headers, rate limiting
- **Health checks** - Built-in health monitoring for all services
- **Hot reload** - Optional development mode with volume mounting

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and update the following:
- `POSTGRES_PASSWORD` - Use a strong password
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `SESSION_SECRET` - Generate: `openssl rand -base64 32`

### 3. Build and Run

**Development Mode:**
```bash
# Start services
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f app
```

**Production Mode (with Nginx):**
```bash
# Build and start all services including Nginx
docker-compose --profile production up -d

# Access application at http://localhost
```

### 4. Database Migrations

If your project uses a migration tool (Drizzle, Prisma, TypeORM, etc.):

```bash
# Run migrations inside the container
docker-compose exec app npm run db:migrate

# Or access the container shell
docker-compose exec app sh
npm run db:push
```

### 5. Access Services

- **Application**: http://localhost:5000
- **Database**: localhost:5432
- **Nginx** (if using production profile): http://localhost:80

## Project Structure

This template expects the following Replit project structure:

```
project/
├── server/              # Backend code (TypeScript or JavaScript)
│   ├── index.ts        # Main entry point
│   └── ...
├── client/             # Frontend code (optional)
│   ├── dist/          # Built frontend files
│   └── ...
├── db/                # Database migrations/schemas
├── package.json
├── tsconfig.json      # TypeScript configuration
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── nginx.conf
└── .env
```

**Alternative Structures Supported:**
- `dist/index.js` - Standard TypeScript build output
- `dist/server/index.js` - Nested build output
- `server/index.js` - JavaScript source

## Configuration

### Database Connection

The application automatically connects to PostgreSQL using the `DATABASE_URL` environment variable:

```
postgresql://postgres:password@db:5432/mydb
```

In your application code:

```typescript
// Example with Drizzle ORM
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);
```

### Health Check Endpoint

Your application should implement a `/health` endpoint:

```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### Environment Variables

All environment variables are configured in `.env` and passed to the container via `docker-compose.yml`.

## Common Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f db
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Access Container Shell

```bash
# App container
docker-compose exec app sh

# Database container
docker-compose exec db sh
```

### Database Backup

```bash
# Create backup
docker-compose exec db pg_dump -U postgres mydb > backup.sql

# Restore backup
docker-compose exec -T db psql -U postgres mydb < backup.sql
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes (CAUTION: deletes database data)
docker-compose down -v

# Remove images as well
docker-compose down --rmi all
```

## Troubleshooting

### Application Won't Start

1. **Check logs**: `docker-compose logs -f app`
2. **Verify entry point**: Ensure your main file is at `dist/index.js`, `server/index.js`, or `dist/server/index.js`
3. **Check environment variables**: Verify `.env` file exists and has correct values

### Database Connection Failed

1. **Wait for database**: Database takes 10-15 seconds to initialize on first run
2. **Check health**: `docker-compose ps` - db should show "healthy"
3. **Verify credentials**: Ensure `DATABASE_URL` matches `POSTGRES_*` variables
4. **Check network**: `docker network inspect vibe-to-docker_app-network`

### Port Already in Use

```bash
# Change ports in docker-compose.yml
ports:
  - "8080:5000"  # Use 8080 instead of 5000
```

### Build Failures

1. **Clean build cache**: `docker-compose build --no-cache`
2. **Check .dockerignore**: Ensure not excluding required files
3. **Verify dependencies**: Check `package.json` is valid

### TypeScript Build Issues

1. **Check tsconfig.json**: Ensure `outDir` is set to `dist`
2. **Verify build script**: `package.json` should have `"build": "tsc"`
3. **Manual test**: `docker-compose run --rm app npm run build`

## Production Deployment

### Using Nginx Reverse Proxy

The included `nginx.conf` provides:
- Static file serving for frontend
- API proxying to backend
- Security headers
- Rate limiting
- WebSocket support
- Gzip compression

Enable with production profile:
```bash
docker-compose --profile production up -d
```

### Security Checklist

- [ ] Change default database password
- [ ] Generate secure JWT_SECRET and SESSION_SECRET
- [ ] Configure CORS_ORIGIN for your domain
- [ ] Enable HTTPS (update nginx.conf)
- [ ] Set up SSL certificates
- [ ] Configure firewall rules
- [ ] Enable log rotation
- [ ] Set up monitoring and alerts

### Performance Tuning

1. **Database**:
   - Adjust PostgreSQL settings in docker-compose.yml
   - Configure connection pooling in application
   - Set up read replicas if needed

2. **Application**:
   - Enable clustering (PM2 or Node.js cluster module)
   - Configure memory limits in docker-compose.yml
   - Use Redis for session storage

3. **Nginx**:
   - Adjust worker processes
   - Configure caching headers
   - Enable HTTP/2

## Development Workflow

### Hot Reload Setup

For development with live code reloading:

```yaml
# Add to docker-compose.yml app service
volumes:
  - ./server:/app/server
  - ./client:/app/client
  - /app/node_modules  # Prevent overwriting
```

Then use nodemon or ts-node-dev:
```bash
docker-compose run --rm app npm run dev
```

### Running Tests

```bash
# Unit tests
docker-compose run --rm app npm test

# Integration tests
docker-compose run --rm app npm run test:integration

# Coverage
docker-compose run --rm app npm run test:coverage
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## Support

For issues specific to this template, please check:
1. This README troubleshooting section
2. Docker Compose logs: `docker-compose logs`
3. Container health: `docker-compose ps`

For Replit-specific issues:
- [Replit Documentation](https://docs.replit.com/)
- [Replit Community](https://community.replit.com/)
