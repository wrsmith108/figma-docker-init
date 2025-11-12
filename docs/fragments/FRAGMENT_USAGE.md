# Docker Template Fragments - Usage Guide

## Overview

The Fragment Composition System enables modular, reusable Docker template creation by composing fragments for different frameworks, databases, and backends.

## Quick Start

```javascript
import FragmentComposer from './src/templates/fragments/fragment-composer.js';

const composer = new FragmentComposer();

// Compose a Dockerfile with React + Express
const result = composer.compose(baseDockerfile, ['react', 'express'], {
  PROJECT_NAME: 'my-app',
  BUILD_OUTPUT_DIR: 'dist',
  PORT: '3000',
  SERVER_ENTRY: 'server.js'
});

if (result.success) {
  console.log(result.template);
} else {
  console.error('Composition failed:', result.errors);
}
```

## Available Fragments

### Framework Fragments

Located in `src/templates/fragments/frameworks/`:

- **react.dockerfile** - React/Vite build configuration
- **vue.dockerfile** - Vue.js build configuration
- **nextjs.dockerfile** - Next.js with standalone output
- **svelte.dockerfile** - Svelte/SvelteKit build
- **angular.dockerfile** - Angular CLI build
- **remix.dockerfile** - Remix framework build

**Insertion Point:** `FRAMEWORK_BUILD_STEPS`

**Required Variables:**
- `BUILD_OUTPUT_DIR` - Output directory (e.g., 'dist', 'build')
- `APP_TITLE` - Application title

**Optional Variables:**
- `VERSION` - Application version (default: '1.0.0')

### Database Fragments

Located in `src/templates/fragments/databases/`:

- **postgresql.yml** - PostgreSQL with health checks
- **mongodb.yml** - MongoDB with Mongo Express UI
- **redis.yml** - Redis with Commander UI
- **mysql.yml** - MySQL with phpMyAdmin
- **supabase.yml** - Complete Supabase stack (DB, Auth, Studio)

**Insertion Point:** `DATABASE_SERVICES`

**Required Variables:**
- `PROJECT_NAME` - Project name for container naming

**Database-Specific Variables:**

PostgreSQL:
- `POSTGRES_PORT` (default: 5432)
- `POSTGRES_USER` (default: postgres)
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

MongoDB:
- `MONGO_PORT` (default: 27017)
- `MONGO_USER`
- `MONGO_PASSWORD`
- `MONGO_DB`

Redis:
- `REDIS_PORT` (default: 6379)
- `REDIS_PASSWORD` (optional)

### Backend Fragments

Located in `src/templates/fragments/backends/`:

- **express.dockerfile** - Express.js with PM2 clustering
- **fastify.dockerfile** - Fastify with PM2 optimization
- **hono.dockerfile** - Hono lightweight server
- **nestjs.dockerfile** - NestJS with build step

**Insertion Point:** `BACKEND_SETUP`

**Required Variables:**
- `PROJECT_NAME` - Project name
- `SERVER_ENTRY` - Server entry file (e.g., 'server.js', 'index.js')

**Optional Variables:**
- `PORT` - Server port (default: 3000)

## Base Template Structure

Your base Dockerfile or docker-compose.yml must include insertion point markers:

### Dockerfile Example

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# FRAMEWORK_BUILD_STEPS

FROM node:18-alpine AS production
WORKDIR /app

# BACKEND_SETUP

EXPOSE 3000
```

### docker-compose.yml Example

```yaml
version: '3.8'

services:
  # DATABASE_SERVICES

  app:
    build: .
    ports:
      - "3000:3000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

# VOLUMES
```

## Composition Examples

### Example 1: React + Express Full-Stack

```javascript
const result = composer.compose(baseDockerfile, ['react', 'express'], {
  PROJECT_NAME: 'fullstack-app',
  BUILD_OUTPUT_DIR: 'dist',
  APP_TITLE: 'My Full Stack App',
  VERSION: '1.0.0',
  PORT: '3000',
  SERVER_ENTRY: 'server.js'
});
```

### Example 2: Vue + Fastify

```javascript
const result = composer.compose(baseDockerfile, ['vue', 'fastify'], {
  PROJECT_NAME: 'vue-api',
  BUILD_OUTPUT_DIR: 'dist',
  APP_TITLE: 'Vue API App',
  PORT: '3001',
  SERVER_ENTRY: 'index.js'
});
```

### Example 3: Next.js (Frontend + API Routes)

```javascript
// Next.js includes its own API routes, no separate backend needed
const result = composer.compose(baseDockerfile, ['nextjs'], {
  PROJECT_NAME: 'nextjs-app',
  BUILD_OUTPUT_DIR: '.next',
  APP_TITLE: 'Next.js Application'
});
```

### Example 4: PostgreSQL + Redis Stack

```javascript
const result = composer.composeDockerCompose(baseCompose, ['postgresql', 'redis'], {
  PROJECT_NAME: 'api-stack',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'admin',
  POSTGRES_PASSWORD: 'secure_password',
  POSTGRES_DB: 'app_db',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: 'redis_pass'
});
```

### Example 5: Complete Stack (React + Express + PostgreSQL)

```javascript
// Compose Dockerfile
const dockerfileResult = composer.compose(baseDockerfile, ['react', 'express'], {
  PROJECT_NAME: 'complete-app',
  BUILD_OUTPUT_DIR: 'build',
  APP_TITLE: 'Complete Stack App',
  PORT: '4000',
  SERVER_ENTRY: 'server.js'
});

// Compose docker-compose.yml
const composeResult = composer.composeDockerCompose(baseCompose, ['postgresql'], {
  PROJECT_NAME: 'complete-app',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'app_user',
  POSTGRES_PASSWORD: process.env.DB_PASSWORD,
  POSTGRES_DB: 'complete_db'
});
```

## Fragment Recommendations

Use automatic fragment detection based on project analysis:

```javascript
import { DetectorChain } from './src/detectors/detector-chain.js';

const detectorChain = new DetectorChain();
const detectionResults = await detectorChain.detect('/path/to/project');

// Get recommended fragments
const recommended = composer.recommendFragments(detectionResults);

console.log('Recommended fragments:', recommended);
// {
//   frameworks: ['nextjs'],
//   databases: ['postgresql', 'redis'],
//   backends: [] // Next.js has built-in API routes
// }

// Compose with recommendations
const result = composer.compose(
  baseDockerfile,
  [...recommended.frameworks, ...recommended.backends],
  variables
);
```

## Advanced Usage

### Custom Fragment Validation

```javascript
import FragmentValidator from './src/templates/fragments/fragment-validator.js';

const validator = new FragmentValidator();
const validation = validator.validateFragment(customFragment, metadata);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
}
```

### Conflict Detection

```javascript
import FragmentMerger from './src/templates/fragments/fragment-merger.js';

const merger = new FragmentMerger();
const conflicts = merger.detectConflicts(fragments);

if (conflicts.hasConflicts) {
  console.error('Conflicts detected:', conflicts.conflicts);
  console.log('Suggested resolutions:', conflicts.resolutions);
}
```

### List Available Fragments

```javascript
// List all frameworks
const frameworks = composer.listFragments('framework');
console.log('Available frameworks:', frameworks.map(f => f.name));

// List all databases
const databases = composer.listFragments('database');
console.log('Available databases:', databases.map(f => f.name));

// List all backends
const backends = composer.listFragments('backend');
console.log('Available backends:', backends.map(f => f.name));
```

## Security Best Practices

The fragment system includes built-in security validation:

1. **No hardcoded secrets** - Use template variables for sensitive data
2. **No dangerous commands** - Validates against `rm -rf /`, `curl | sh`, etc.
3. **User permissions** - Warns if running as root user
4. **Proper escaping** - Template syntax prevents injection

### Example: Secure Variable Usage

```javascript
// ❌ WRONG - Hardcoded password
const badFragment = 'ENV DB_PASSWORD=supersecret123';

// ✅ CORRECT - Template variable
const goodFragment = 'ENV DB_PASSWORD={{DB_PASSWORD}}';

// Provide at runtime
composer.compose(base, ['postgresql'], {
  DB_PASSWORD: process.env.DB_PASSWORD // From environment
});
```

## Error Handling

```javascript
const result = composer.compose(baseTemplate, fragmentNames, variables);

if (!result.success) {
  // Critical errors - composition failed
  console.error('Errors:', result.errors);
  process.exit(1);
}

if (result.warnings.length > 0) {
  // Warnings - composition succeeded but review needed
  console.warn('Warnings:', result.warnings);
}

// Success
console.log('Used variables:', result.usedVariables);
console.log('Applied fragments:', result.appliedFragments);
writeFileSync('Dockerfile', result.template);
```

## Testing Fragments

```javascript
import { describe, it, expect } from '@jest/globals';

describe('Custom Fragment', () => {
  it('should compose correctly', () => {
    const result = composer.compose(base, ['my-custom-fragment'], vars);

    expect(result.success).toBe(true);
    expect(result.template).toContain('expected content');
    expect(result.errors.length).toBe(0);
  });
});
```

## Contributing New Fragments

1. Create fragment file in appropriate directory:
   - `src/templates/fragments/frameworks/` for frameworks
   - `src/templates/fragments/databases/` for databases
   - `src/templates/fragments/backends/` for backends

2. Include insertion point comment:
   ```dockerfile
   # MyFramework Fragment
   # Insertion Point: FRAMEWORK_BUILD_STEPS
   ```

3. Use template variable syntax:
   ```dockerfile
   ENV MY_VAR={{MY_VAR}}
   ```

4. Test with validation:
   ```bash
   npm test -- fragment-composition.test.js
   ```

## Performance Tips

1. **Reuse composer instance** - Fragment loading is cached
2. **Batch compositions** - Compose multiple templates at once
3. **Validate early** - Check fragments before runtime
4. **Use defaults** - Leverage default variables when possible

## Troubleshooting

### "Insertion point not found"
Ensure your base template has the correct marker:
```dockerfile
# FRAMEWORK_BUILD_STEPS  # Exact marker needed
```

### "Fragment not found"
Check fragment name matches file name without extension:
```javascript
// File: react.dockerfile
composer.compose(base, ['react'], vars); // ✅ Correct
composer.compose(base, ['react.dockerfile'], vars); // ❌ Wrong
```

### "Missing variable values"
Provide all required variables:
```javascript
const result = composer.compose(base, ['react'], {
  BUILD_OUTPUT_DIR: 'dist',  // Required
  APP_TITLE: 'My App'         // Required
});
```

## Additional Resources

- [Fragment Types Reference](./fragment-types.js)
- [Validation Rules](./fragment-validator.js)
- [Merger API](./fragment-merger.js)
- [Test Suite](../../tests/templates/fragment-composition.test.js)
