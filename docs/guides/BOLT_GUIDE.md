# Bolt (StackBlitz) Docker Guide

Complete guide for containerizing Bolt projects with vibe-to-docker.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Docker Configuration](#docker-configuration)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

Bolt (by StackBlitz) generates full-stack applications using WebContainers with:

- **Frontend**: React, Vue, Svelte, Angular, or Solid
- **Backend**: Node.js, Express, Fastify
- **Database**: SQLite, PostgreSQL, MySQL
- **Build Tools**: Vite, Webpack, Turbopack, Angular CLI
- **Full-Stack**: Complete frontend + backend in one project

Vibe-to-docker provides comprehensive Docker configurations for Bolt's multi-service architecture.

### Recent Improvements (v5.0.0 - v5.0.4)

**Enhanced Detection (November 2025)**:
- ✅ **Angular CLI Support**: Automatic detection with 80-90% confidence
- ✅ **Dynamic Script Reading**: Reads package.json for accurate build/start commands
- ✅ **Confidence Tuning**: Prevents conflicts with FigmaDetector (<5% false positives)
- ✅ **Framework Metadata**: Accurate framework, buildTool, and command detection

**Detection Accuracy**:
- **100% confidence**: `.stackblitzrc` or `stackblitz` field in package.json
- **80-90% confidence**: Angular projects (angular.json + @angular/core)
- **85% confidence**: Remix projects (app/routes/ directory)
- **<50% confidence**: Generic React + Vite (requires explicit `--tool=bolt`)

See [Bolt Detector Updates](../BOLT_DETECTOR_UPDATES.md) for technical details.

## Prerequisites

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Docker Compose >= 2.0.0
- Bolt project export

## Quick Start

### 1. Export from Bolt

From Bolt interface:
1. Click "Download" or "Export"
2. Save the project ZIP file
3. Extract to your local machine

### 2. Initialize Docker Configuration

```bash
cd your-bolt-project
npx vibe-to-docker init --tool=bolt
```

**Recommended**: Always specify `--tool=bolt` for explicit detection.

The CLI will:
- ✓ Detect Bolt WebContainer structure (100% confidence with .stackblitzrc)
- ✓ Identify frontend and backend frameworks (React, Angular, Remix, Vue, etc.)
- ✓ Read package.json scripts for accurate build/start commands
- ✓ Detect database requirements (PostgreSQL, MySQL, SQLite)
- ✓ Generate multi-service Docker configuration
- ✓ Create `.vibe-docker/` directory

**Angular Projects**: Automatically detected with Angular CLI integration:
```bash
# Detects: ng serve, ng build commands
# Sets: buildTool=angular-cli, framework=angular
npx vibe-to-docker init --tool=bolt
```

### 3. Configure Services

```bash
nano .vibe-docker/.env
```

Update database and API settings:
```env
DATABASE_URL=postgresql://user:pass@db:5432/mydb
API_PORT=3001
```

### 4. Start All Services

```bash
cd .vibe-docker
docker-compose up -d --build
```

### 5. Access Your Application

```
Frontend: http://localhost:3000
Backend API: http://localhost:3001
```

## Project Structure

### Typical Bolt Project

```
bolt-project/
├── client/              # Frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── server/              # Backend API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── db/                  # Database files
│   ├── schema.sql
│   └── migrations/
├── package.json         # Root package.json
└── README.md
```

### After vibe-to-docker

```
bolt-project/
├── .vibe-docker/        # Docker configuration
│   ├── Dockerfile.client    # Frontend container
│   ├── Dockerfile.server    # Backend container
│   ├── docker-compose.yml   # Multi-service orchestration
│   ├── nginx.conf           # Reverse proxy
│   ├── .env
│   ├── .env.example
│   ├── .dockerignore
│   └── DOCKER.md
├── client/              # Frontend
├── server/              # Backend
└── db/                  # Database
```

## Docker Configuration

### Generated docker-compose.yml

Multi-service setup with frontend, backend, and database:

```yaml
version: '3.8'

services:
  # Frontend service
  client:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.client
    ports:
      - "${CLIENT_PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://localhost:${API_PORT:-3001}
    depends_on:
      - server
    networks:
      - bolt-network
    restart: unless-stopped

  # Backend service
  server:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.server
    ports:
      - "${API_PORT:-3001}:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    networks:
      - bolt-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Database service
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-bolt_db}
      POSTGRES_USER: ${DB_USER:-bolt}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    networks:
      - bolt-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-bolt}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "${NGINX_PORT:-8888}:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - client
      - server
    networks:
      - bolt-network
    restart: unless-stopped

networks:
  bolt-network:
    driver: bridge

volumes:
  postgres_data:
```

### Dockerfile.client (Frontend)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY client/package*.json ./
RUN npm ci

# Copy source
COPY client/ ./

# Build
RUN npm run build

# Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY .vibe-docker/nginx-client.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile.server (Backend)

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY server/package*.json ./
RUN npm ci --production

# Copy source
COPY server/ ./

# Build TypeScript (if applicable)
RUN npm run build || true

EXPOSE 3001

CMD ["node", "dist/server.js"]
```

### Nginx Reverse Proxy

```nginx
events {
    worker_connections 1024;
}

http {
    upstream client {
        server client:3000;
    }

    upstream api {
        server server:3001;
    }

    server {
        listen 80;

        # Frontend
        location / {
            proxy_pass http://client;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api {
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # WebSocket support
        location /ws {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
        }
    }
}
```

## Environment Variables

### Bolt-Specific Variables

**Client (Frontend):**
```env
# API Configuration
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Feature Flags
VITE_ENABLE_AUTH=true
VITE_ENABLE_ANALYTICS=false

# Ports
CLIENT_PORT=3000
```

**Server (Backend):**
```env
# Server Configuration
API_PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://bolt:password@db:5432/bolt_db
DB_NAME=bolt_db
DB_USER=bolt
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Database:**
```env
POSTGRES_DB=bolt_db
POSTGRES_USER=bolt
POSTGRES_PASSWORD=password
```

**Nginx:**
```env
NGINX_PORT=8888
```

## Build Process

### Development Build

```bash
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up
```

**Features:**
- Frontend hot reload (Vite HMR)
- Backend auto-restart (nodemon)
- Database with persistent volumes
- Live code synchronization

### Production Build

```bash
cd .vibe-docker
docker-compose up -d --build
```

**Optimizations:**
- Minified frontend builds
- Production Node.js environment
- Optimized database queries
- Health checks for all services
- Automatic service restarts

### Database Initialization

The database service automatically runs `db/schema.sql` on first start:

```sql
-- db/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Development Workflow

### Local Development with Docker

```bash
# Start all services in development mode
cd .vibe-docker
docker-compose -f docker-compose.dev.yml up

# Access services:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
# - Database: localhost:5432
```

### Development Compose File

`docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  client-dev:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.client.dev
    ports:
      - "3000:3000"
    volumes:
      - ../client/src:/app/src
      - ../client/public:/app/public
    environment:
      - NODE_ENV=development
      - VITE_API_URL=http://localhost:3001
    command: npm run dev
    networks:
      - bolt-network

  server-dev:
    build:
      context: ..
      dockerfile: .vibe-docker/Dockerfile.server.dev
    ports:
      - "3001:3001"
    volumes:
      - ../server/src:/app/src
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://bolt:password@db:5432/bolt_db
    command: npm run dev
    depends_on:
      - db
    networks:
      - bolt-network

  db:
    # Same as production
```

### Running Database Migrations

```bash
# Create migration
docker-compose exec server npm run migration:create add_users_table

# Run migrations
docker-compose exec server npm run migration:run

# Rollback
docker-compose exec server npm run migration:rollback
```

### Accessing Database

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U bolt -d bolt_db

# Dump database
docker-compose exec db pg_dump -U bolt bolt_db > backup.sql

# Restore database
docker-compose exec -T db psql -U bolt bolt_db < backup.sql
```

## Production Deployment

### Option 1: Full Stack on Single Server

```bash
# Build all images
cd .vibe-docker
docker-compose build

# Push to registry
docker tag bolt-client:latest registry.example.com/bolt-client:v1
docker tag bolt-server:latest registry.example.com/bolt-server:v1
docker push registry.example.com/bolt-client:v1
docker push registry.example.com/bolt-server:v1

# Deploy on server
ssh production-server
docker-compose pull
docker-compose up -d
```

### Option 2: Separate Services

**Frontend on Vercel:**
```bash
cd client
vercel --prod
```

**Backend on Cloud Run:**
```bash
cd server
gcloud builds submit --tag gcr.io/project/bolt-server
gcloud run deploy bolt-api --image gcr.io/project/bolt-server
```

**Database on Managed Service:**
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Update `DATABASE_URL` to point to managed instance

### Option 3: Kubernetes

```bash
# Generate Kubernetes manifests
cd .vibe-docker
docker-compose convert > k8s.yaml

# Apply to cluster
kubectl apply -f k8s.yaml

# Expose services
kubectl expose deployment bolt-client --type=LoadBalancer --port=80
kubectl expose deployment bolt-server --type=LoadBalancer --port=3001
```

## Troubleshooting

### Issue: Database Connection Failed

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure database service is running:
   ```bash
   docker-compose ps db
   ```
2. Check `DATABASE_URL` uses service name (`db` not `localhost`):
   ```env
   DATABASE_URL=postgresql://bolt:password@db:5432/bolt_db
   ```
3. Wait for database to be ready (add `depends_on` with health check)

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. Configure CORS in backend:
   ```typescript
   // server/src/server.ts
   app.use(cors({
     origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
     credentials: true,
   }));
   ```
2. Update `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

### Issue: WebSocket Connection Failed

**Symptoms:**
WebSocket connections fail or disconnect

**Solutions:**
1. Ensure nginx proxy supports WebSocket (see nginx.conf above)
2. Configure WebSocket in backend:
   ```typescript
   const wss = new WebSocketServer({ server });
   ```
3. Update client to use correct WS URL:
   ```env
   VITE_WS_URL=ws://localhost:3001
   ```

### Issue: Migrations Not Running

**Symptoms:**
Tables don't exist in database

**Solutions:**
1. Check `schema.sql` is mounted correctly in docker-compose.yml
2. Manually run migrations:
   ```bash
   docker-compose exec db psql -U bolt -d bolt_db -f /docker-entrypoint-initdb.d/schema.sql
   ```
3. Clear database and restart:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Examples

### Example 1: Basic Bolt CRUD App

```bash
cd bolt-crud-app
vibe-to-docker init --tool=bolt --template=fullstack

# Configure database
cat >> .vibe-docker/.env << EOF
DATABASE_URL=postgresql://bolt:password@db:5432/bolt_db
JWT_SECRET=$(openssl rand -hex 32)
EOF

# Start services
cd .vibe-docker
docker-compose up -d --build

# Access at http://localhost:8888
```

### Example 2: Bolt with Redis Cache

```bash
cd bolt-app-with-redis
vibe-to-docker init --tool=bolt

# Add Redis to docker-compose.yml
cat >> .vibe-docker/docker-compose.yml << 'EOF'
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - bolt-network
    restart: unless-stopped
EOF

# Update backend to use Redis
# Start services
cd .vibe-docker
docker-compose up -d --build
```

### Example 3: Bolt with File Uploads

```bash
cd bolt-upload-app
vibe-to-docker init --tool=bolt

# Add volume for uploads
cat >> .vibe-docker/docker-compose.yml << 'EOF'
    volumes:
      - upload_data:/app/uploads

volumes:
  upload_data:
EOF

# Configure upload directory
echo "UPLOAD_DIR=/app/uploads" >> .vibe-docker/.env

# Start services
cd .vibe-docker
docker-compose up -d --build
```

---

## Additional Resources

- [Bolt Documentation](https://bolt.new/docs)
- [StackBlitz WebContainers](https://webcontainers.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Documentation](https://expressjs.com/)

---

**Last Updated:** November 2025
