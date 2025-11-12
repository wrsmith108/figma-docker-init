# V0 (Vercel) Docker Template

Optimized Docker configuration for V0 (Vercel) projects with Next.js 14+ App Router, shadcn/ui, and Vercel AI SDK.

## Features

- **Multi-stage build** for minimal production image size
- **Node 20 Alpine** base image for security and performance
- **Port 3000** (Next.js standard)
- **Next.js 14+ App Router** with server components
- **shadcn/ui** component support
- **Vercel AI SDK** integration (OpenAI, Anthropic, etc.)
- **Health checks** for container orchestration
- **Non-root user** for enhanced security
- **Optimized caching** for faster builds

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional)
- AI provider API key (OpenAI, Anthropic, etc.)

### 2. Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your AI provider credentials:

```env
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Build and Run

**Using Docker:**

```bash
# Build the image
docker build -t my-v0-app .

# Run the container
docker run -p 3000:3000 --env-file .env my-v0-app
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

Open your browser to: http://localhost:3000

## Project Structure

```
.
├── Dockerfile              # Multi-stage production build
├── .dockerignore          # Optimize build context
├── docker-compose.yml     # Orchestration configuration
├── .env.example           # Environment variable template
├── package.json           # Dependencies and scripts
├── next.config.js         # Next.js configuration
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── api/              # API routes
│   │   └── health/       # Health check endpoint
│   └── components/       # React components
├── components/            # shadcn/ui components
│   └── ui/               # UI primitives
├── lib/                   # Utility functions
│   └── utils.ts          # Helper utilities
└── public/                # Static assets
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Application port | No | 3000 |
| `NODE_ENV` | Node environment | No | production |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | No | 1 |
| `OPENAI_API_KEY` | OpenAI API key | For AI features | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | For AI features | - |
| `NEXT_PUBLIC_APP_URL` | Public app URL | No | http://localhost:3000 |

## Next.js App Router

The template supports Next.js 14+ App Router with:

1. **Server Components**: Default to server-side rendering
2. **Client Components**: Use `'use client'` directive
3. **Route Handlers**: API routes in `app/api/`
4. **Layouts**: Shared layouts with `layout.tsx`
5. **Loading & Error States**: `loading.tsx` and `error.tsx`

### Example Route Handler

```typescript
// app/api/chat/route.ts
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
  });

  return Response.json(response);
}
```

## Vercel AI SDK Integration

The template supports Vercel AI SDK for streaming AI responses:

### Installation

```bash
npm install ai
```

### Example Usage

```typescript
// app/api/chat/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

## shadcn/ui Components

The template supports shadcn/ui components. Install components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

Components are installed to `components/ui/` and automatically included in the build.

## Build Optimization

The Dockerfile uses multi-stage builds to minimize image size:

1. **Builder stage**: Installs all dependencies and builds the app
2. **Production stage**: Only includes production dependencies and built assets

Typical image sizes:
- Builder: ~700MB
- Production: ~200MB

## Health Checks

The container includes health checks that ping `/api/health` every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3
```

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

## Security Features

- **Non-root user**: Application runs as `nextjs` user (UID 1001)
- **Alpine Linux**: Minimal attack surface
- **No secrets in image**: Environment variables injected at runtime
- **Production dependencies only**: Smaller image, fewer vulnerabilities
- **Telemetry disabled**: No data sent to Vercel

## Troubleshooting

### Container fails to start

Check logs:
```bash
docker logs <container-id>
```

Common issues:
- Missing environment variables
- Invalid API keys
- Port already in use

### Port already in use

Change the port mapping:
```bash
docker run -p 3001:3000 --env-file .env my-v0-app
```

### Build fails

Ensure your package.json has the required scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### API calls fail

Verify environment variables are set:

```bash
docker exec <container-id> env | grep API_KEY
```

## Development vs Production

This template is optimized for **production**. For development:

```bash
# Run Next.js dev server locally
npm install
npm run dev
```

The dev server includes:
- Fast Refresh (HMR)
- Better error overlay
- Source maps

## Deployment to Vercel

While this Docker template works anywhere, V0 projects are optimized for Vercel:

```bash
# Deploy to Vercel (recommended)
vercel deploy

# Or use Docker for self-hosting
docker-compose up -d
```

## Performance Tuning

For production workloads:

1. **Image optimization**: Next.js automatically optimizes images
2. **Caching**: Use Redis for caching API responses
3. **CDN**: Serve static assets from CDN
4. **Edge runtime**: Use Edge API routes for global distribution
5. **Monitoring**: Add Vercel Analytics or custom APM

### Example Edge API Route

```typescript
// app/api/edge/route.ts
export const runtime = 'edge';

export async function GET() {
  return Response.json({ message: 'Hello from Edge' });
}
```

## Database Integration

For database support (PostgreSQL, MySQL, MongoDB):

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
```

Install Prisma or Drizzle ORM:

```bash
npm install prisma @prisma/client
npx prisma init
```

## Authentication

For authentication with NextAuth.js:

```bash
npm install next-auth
```

Configure providers in `app/api/auth/[...nextauth]/route.ts`.

## License

This template is part of vibe-to-docker and follows the same license.
