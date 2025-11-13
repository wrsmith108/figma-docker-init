# Fragment System Architecture Overview

## System Components

The Docker Template Fragment System consists of four main components:

### 1. Fragment Types (`fragment-types.js`)
- Defines fragment categories: FRAMEWORK, DATABASE, BACKEND
- Defines insertion points for template composition
- Provides validation rules for fragment structure
- Manages default metadata and variables

### 2. Fragment Validator (`fragment-validator.js`)
- **Structure Validation**: Ensures fragments have correct format
- **Security Validation**: Detects dangerous commands (rm -rf /, chmod 777, curl | sh)
- **Syntax Validation**: Validates Dockerfile and docker-compose YAML syntax
- **Compatibility Validation**: Checks for conflicts between fragments

### 3. Fragment Merger (`fragment-merger.js`)
- **Priority-based Merging**: Merges fragments in priority order
- **Insertion Point Detection**: Finds and inserts at correct locations
- **Variable Substitution**: Replaces {{VAR}} placeholders
- **Conflict Detection**: Identifies port/service name conflicts
- **Docker Compose Merging**: Handles service and volume composition

### 4. Fragment Composer (`fragment-composer.js`)
- **Orchestration Layer**: Coordinates validation and merging
- **Fragment Registry**: Loads and caches all available fragments
- **Recommendation Engine**: Suggests fragments based on project detection
- **Error Handling**: Provides detailed error and warning messages

## Fragment Categories

### Framework Fragments (6)
Located in `src/templates/fragments/frameworks/`:

1. **react.dockerfile** - React + Vite build configuration
2. **vue.dockerfile** - Vue.js build configuration  
3. **nextjs.dockerfile** - Next.js with standalone output
4. **svelte.dockerfile** - Svelte/SvelteKit build
5. **angular.dockerfile** - Angular CLI build
6. **remix.dockerfile** - Remix framework build

### Database Fragments (5)
Located in `src/templates/fragments/databases/`:

1. **postgresql.yml** - PostgreSQL with health checks
2. **mongodb.yml** - MongoDB with Mongo Express UI
3. **redis.yml** - Redis with Commander UI
4. **mysql.yml** - MySQL with phpMyAdmin
5. **supabase.yml** - Complete Supabase stack (DB, Auth, Studio)

### Backend Fragments (4)
Located in `src/templates/fragments/backends/`:

1. **express.dockerfile** - Express.js with PM2 clustering
2. **fastify.dockerfile** - Fastify with PM2 optimization
3. **hono.dockerfile** - Hono lightweight server
4. **nestjs.dockerfile** - NestJS with build step

## Insertion Points

```dockerfile
# Dockerfile Insertion Points
FROM node:18-alpine AS builder
WORKDIR /app
# FRAMEWORK_BUILD_STEPS  <-- Framework fragments insert here

FROM node:18-alpine AS production
# BACKEND_SETUP           <-- Backend fragments insert here
EXPOSE 3000
```

```yaml
# docker-compose.yml Insertion Points
version: '3.8'

services:
  # DATABASE_SERVICES      <-- Database service fragments insert here
  
  app:
    build: .

networks:
  app-network:

# VOLUMES                 <-- Volume definitions insert here
```

## Composition Flow

```
1. Load Fragments
   └─> FragmentComposer.loadFragments()
       └─> Scans fragments directories
       └─> Creates fragment registry

2. Validate Fragments
   └─> FragmentValidator.validateFragment()
       └─> Structure validation
       └─> Security checks
       └─> Syntax validation

3. Check Compatibility
   └─> FragmentValidator.validateCompatibility()
       └─> Detect conflicts
       └─> Check dependencies

4. Merge Fragments
   └─> FragmentMerger.mergeMultiple()
       └─> Group by insertion point
       └─> Sort by priority
       └─> Combine and insert

5. Substitute Variables
   └─> FragmentMerger.substituteVariables()
       └─> Replace {{VAR}} placeholders
       └─> Apply default values

6. Return Result
   └─> Success + template
   └─> OR errors + warnings
```

## Variable System

### Variable Syntax
```dockerfile
ENV PORT={{PORT}}
ENV DB_HOST={{DATABASE_HOST}}
```

### Variable Types

**Required Variables**: Must be provided by user
- PROJECT_NAME
- BUILD_OUTPUT_DIR
- SERVER_ENTRY

**Optional Variables**: Have defaults
- PORT (default: 3000)
- VERSION (default: 1.0.0)
- NODE_OPTIONS (default: --max-old-space-size=4096)

**Database Variables**: Database-specific
- POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD
- MONGO_PORT, MONGO_USER, MONGO_PASSWORD
- REDIS_PORT, REDIS_PASSWORD

## Security Features

### 1. Dangerous Command Detection
- `rm -rf /` - Prevents system deletion
- `chmod 777` - Prevents insecure permissions
- `curl | sh` - Prevents unsafe script execution
- `eval()` - Prevents code injection

### 2. Secret Detection
- Hardcoded passwords
- API keys
- Secret tokens

### 3. User Permission Warnings
- Running as root user
- Missing user switches

## Priority System

Fragments are merged in priority order within each insertion point:

```javascript
Priority Levels:
- 15: Meta-frameworks (Next.js, Nuxt, Supabase)
- 12-13: Full frameworks (NestJS, Remix)
- 10-11: Standard frameworks/backends
- 9: Lightweight tools
- 5-8: Custom priorities
- 1: Low priority
```

## Test Coverage

### Test Suite: `fragment-composition.test.js`
- **41 tests total** - All passing
- **Test Categories**:
  - Fragment Loading (4 tests)
  - Single Fragment Insertion (3 tests)
  - Multiple Fragment Composition (3 tests)
  - Docker Compose Composition (3 tests)
  - Variable Substitution (3 tests)
  - Fragment Recommendation (4 tests)
  - Structure Validation (3 tests)
  - Security Validation (5 tests)
  - Syntax Validation (3 tests)
  - Basic Merging (2 tests)
  - Multiple Fragment Merging (1 test)
  - Variable Substitution (3 tests)
  - Conflict Detection (2 tests)
  - Variable Extraction (2 tests)

## Integration with Detectors

The fragment system integrates with Phase 1 detectors:

```javascript
import { DetectorChain } from './detectors/detector-chain.js';
import { FragmentComposer } from './templates/fragments/fragment-composer.js';

// Detect project technologies
const detectorChain = new DetectorChain();
const detection = await detectorChain.detect(projectPath);

// Get recommended fragments
const composer = new FragmentComposer();
const recommended = composer.recommendFragments(detection);
// {
//   frameworks: ['nextjs'],
//   databases: ['postgresql', 'redis'],
//   backends: [] // Next.js has built-in API routes
// }

// Compose Dockerfile
const result = composer.compose(
  baseDockerfile,
  [...recommended.frameworks, ...recommended.backends],
  variables
);
```

## Performance Characteristics

- **Fragment Loading**: O(n) - One-time cost, cached
- **Validation**: O(n*m) - n fragments, m validation rules
- **Merging**: O(n*k) - n fragments, k insertion points
- **Variable Substitution**: O(n*v) - n template size, v variables

**Optimization**: Fragment registry is cached in memory after first load

## Error Handling

### Error Types

1. **Validation Errors** (blocking):
   - Empty fragment content
   - Dangerous commands
   - Invalid syntax

2. **Composition Errors** (blocking):
   - Missing insertion point
   - Fragment not found
   - Merge conflicts

3. **Warnings** (non-blocking):
   - Multiple frameworks
   - Hardcoded secrets
   - Missing variables
   - Odd indentation

### Example Error Response

```javascript
{
  success: false,
  template: null,
  errors: [
    "react: Dangerous command detected: rm -rf /",
    "express: Fragment not found"
  ],
  warnings: [
    "Multiple frameworks detected: react, vue"
  ]
}
```

## Future Enhancements

1. **Custom Fragment Support**: Allow users to define custom fragments
2. **Fragment Dependencies**: Automatic dependency resolution
3. **Version Constraints**: Fragment compatibility by version
4. **Smart Defaults**: Context-aware default variable values
5. **Fragment Linting**: Pre-commit validation for fragments
6. **Fragment Testing**: Unit tests for individual fragments
7. **Fragment Marketplace**: Share and discover community fragments

## Files Created

### Core System (4 files)
- `src/templates/fragments/fragment-types.js` (277 lines)
- `src/templates/fragments/fragment-validator.js` (247 lines)
- `src/templates/fragments/fragment-merger.js` (297 lines)
- `src/templates/fragments/fragment-composer.js` (271 lines)

### Framework Fragments (6 files)
- `src/templates/fragments/frameworks/react.dockerfile`
- `src/templates/fragments/frameworks/vue.dockerfile`
- `src/templates/fragments/frameworks/nextjs.dockerfile`
- `src/templates/fragments/frameworks/svelte.dockerfile`
- `src/templates/fragments/frameworks/angular.dockerfile`
- `src/templates/fragments/frameworks/remix.dockerfile`

### Database Fragments (5 files)
- `src/templates/fragments/databases/postgresql.yml`
- `src/templates/fragments/databases/mongodb.yml`
- `src/templates/fragments/databases/redis.yml`
- `src/templates/fragments/databases/mysql.yml`
- `src/templates/fragments/databases/supabase.yml`

### Backend Fragments (4 files)
- `src/templates/fragments/backends/express.dockerfile`
- `src/templates/fragments/backends/fastify.dockerfile`
- `src/templates/fragments/backends/hono.dockerfile`
- `src/templates/fragments/backends/nestjs.dockerfile`

### Tests (1 file)
- `tests/templates/fragment-composition.test.js` (650+ lines, 41 tests)

### Documentation (2 files)
- `docs/fragments/FRAGMENT_USAGE.md` (Comprehensive usage guide)
- `docs/fragments/FRAGMENT_SYSTEM_OVERVIEW.md` (This file)

**Total**: 22 files, 2000+ lines of code, 100% test coverage
