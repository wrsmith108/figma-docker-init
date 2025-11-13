# Figma Make Docker Template

Optimized Docker configuration for Figma Make exported projects with React + Vite + TypeScript stack.

## Features

- **Multi-stage build** for minimal production image size
- **Node 20 Alpine** base image for security and performance
- **Port 5173 or 3000** (configurable)
- **React + TypeScript** with Vite build tool
- **Component-based architecture** from Figma designs
- **CSS Modules** support
- **Health checks** for container orchestration
- **Non-root user** for enhanced security
- **Optimized caching** for faster builds

## Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+ (optional)
- Figma Make exported project

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
docker build -t my-figma-make-app .

# Run the container
docker run -p 5173:5173 --env-file .env my-figma-make-app
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
├── tsconfig.json          # TypeScript configuration
├── index.html             # HTML entry point
├── src/                   # Application source code
│   ├── main.tsx          # React entry point
│   ├── App.tsx           # Root component
│   ├── components/       # React components (from Figma)
│   ├── assets/           # Images, fonts, etc.
│   └── styles/           # CSS/SCSS files
└── dist/                  # Production build output (generated)
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Application port | No | 5173 |
| `NODE_ENV` | Node environment | No | production |
| `VITE_API_URL` | API endpoint URL | No | - |
| `VITE_APP_TITLE` | Application title | No | - |

**Note**: All Vite environment variables must be prefixed with `VITE_` to be accessible in the client.

## Figma to React Workflow

When exporting from Figma Make:

1. **Design in Figma**: Create your UI design
2. **Export with Figma Make**: Generate React components
3. **Add to project**: Copy components to `src/components/`
4. **Integrate**: Import and use in your React app
5. **Build and deploy**: Use this Docker template

### Component Structure

Figma Make generates components like:

```typescript
// src/components/Button.tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  onClick
}) => {
  return (
    <button className={`button button--${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};
```

## Build Optimization

The Dockerfile uses multi-stage builds to minimize image size:

1. **Builder stage**: Installs all dependencies and builds the app with Vite
2. **Production stage**: Only includes built static files served with `serve`

Typical image sizes:
- Builder: ~500MB
- Production: ~80MB (smallest of all templates!)

## Health Checks

The container includes health checks that ping the application every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
```

This enables:
- Automatic container restarts on failure
- Integration with orchestration platforms
- Load balancer health monitoring

## Security Features

- **Non-root user**: Application runs as `figma` user (UID 1001)
- **Alpine Linux**: Minimal attack surface
- **No secrets in image**: Environment variables injected at runtime
- **Static file serving**: No runtime vulnerabilities
- **Minimal dependencies**: Only `serve` package in production

## Troubleshooting

### Container fails to start

Check logs:
```bash
docker logs <container-id>
```

Common issues:
- Build artifacts missing (check `dist/` folder)
- Port already in use
- Invalid Vite configuration

### Port already in use

Change the port mapping:
```bash
docker run -p 3000:5173 --env-file .env my-figma-make-app
```

Or update .env:
```env
PORT=3000
```

### Build fails

Ensure your package.json has the required scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Vite environment variables not working

Remember to prefix with `VITE_`:

```env
# ✅ Correct
VITE_API_URL=https://api.example.com

# ❌ Wrong
API_URL=https://api.example.com
```

## CSS Modules Support

The template supports CSS Modules out of the box:

```css
/* Button.module.css */
.button {
  padding: 10px 20px;
  border-radius: 4px;
}

.button--primary {
  background: blue;
  color: white;
}
```

```typescript
// Button.tsx
import styles from './Button.module.css';

export const Button = () => (
  <button className={styles.button}>Click me</button>
);
```

## Development vs Production

This template is optimized for **production**. For development:

```bash
# Run Vite dev server locally
npm install
npm run dev
```

The dev server includes:
- Hot Module Replacement (HMR)
- Instant feedback
- Better error messages
- Source maps

## Static Asset Handling

Vite automatically handles static assets:

```typescript
// Images
import logo from './assets/logo.png';

// Fonts
import './assets/fonts/custom-font.woff2';

// JSON
import data from './data/config.json';
```

Assets are optimized during build:
- Images: Compressed and hashed
- Fonts: Subset and optimized
- SVGs: Minified

## Performance Optimization

For production workloads:

1. **Code splitting**: Vite automatically splits code
2. **Tree shaking**: Removes unused code
3. **Minification**: JavaScript and CSS minified
4. **Compression**: Enable gzip/brotli in your server
5. **CDN**: Serve static assets from CDN

### Enable Compression

```yaml
# docker-compose.yml
services:
  figma-make-app:
    environment:
      - SERVE_COMPRESSION=true
```

## Integration with Backend API

For API integration:

1. Set API URL in .env:
```env
VITE_API_URL=https://api.example.com
```

2. Create API client:
```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export const fetchData = async () => {
  const response = await fetch(`${API_URL}/data`);
  return response.json();
};
```

3. Use in components:
```typescript
import { useEffect, useState } from 'react';
import { fetchData } from './lib/api';

export const DataComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData);
  }, []);

  return <div>{JSON.stringify(data)}</div>;
};
```

## TypeScript Configuration

The template includes TypeScript support. Update `tsconfig.json` as needed:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## Deployment Options

This template works with:

1. **Docker**: Self-hosted with this template
2. **Cloud Platforms**: AWS ECS, Google Cloud Run, Azure Container Apps
3. **Static Hosting**: Netlify, Vercel, Cloudflare Pages (deploy `dist/` folder)
4. **CDN**: CloudFront, Cloudflare, Fastly

For static hosting, just deploy the `dist/` folder after building locally.

## License

This template is part of vibe-to-docker and follows the same license.
