# Health Check and Port Documentation Fixes

**Date**: November 15, 2025
**Issue**: Health check command mismatch and port documentation inconsistencies
**Status**: ✅ Completed

## Overview

Fixed critical inconsistencies between Dockerfile and docker-compose.yml health check commands, and clarified production vs development port usage across all templates.

## Issues Fixed

### 1. Health Check Command Mismatch ✅

**Problem**:
- Dockerfiles used: `node -e "require('http').get..."`
- docker-compose.yml used: `wget --quiet --tries=1 --spider`
- **wget is NOT installed in alpine images** → health checks would fail

**Solution**:
Changed all docker-compose.yml health checks to use node-based HTTP check for consistency:

```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Files Modified**:
- `/src/templates/tools/figma-make/docker-compose.yml`
- `/src/templates/tools/bolt/docker-compose.yml`
- `/src/templates/tools/lovable/docker-compose.yml`
- `/src/templates/tools/v0/docker-compose.yml`

**Benefits**:
- ✅ No additional dependencies required (node already in alpine image)
- ✅ Consistent with Dockerfile HEALTHCHECK commands
- ✅ Works across all templates
- ✅ Follows security best practices (v3.3.1 security fixes)

### 2. Port Documentation Inconsistencies ✅

**Problem**:
- READMEs mentioned port 5173 (Vite dev server default)
- Production actually uses port 3000
- No clear distinction between dev and production ports

**Solution**:
Updated all template READMEs to clarify:

**Production (Docker)**:
- Port: **3000** (configurable via PORT env var)
- Server: `serve` for static files (Figma Make) or SSR server (Bolt)
- Build: Optimized production bundle

**Development (Local)**:
- Port: **5173** (Vite default)
- Hot Module Replacement (HMR)
- Instant feedback

**Files Modified**:
- `/src/templates/tools/figma-make/README.md`
- `/src/templates/tools/bolt/README.md`
- `/src/templates/base/.env.example`

**Changes**:
1. Updated default PORT from 5173 → 3000 in examples
2. Added "Development vs Production" sections explaining port differences
3. Updated environment variable tables with "(production)" clarification
4. Enhanced .env.example with clearer PORT documentation

### 3. .dockerignore Placement ✅

**Status**: Already correct, no changes needed

**Verified Locations**:
- `/src/templates/base/.dockerignore` ✅
- `/src/templates/tools/figma-make/.dockerignore` ✅
- `/src/templates/tools/bolt/.dockerignore` ✅
- `/src/templates/tools/lovable/.dockerignore` ✅
- `/src/templates/tools/v0/.dockerignore` ✅

All .dockerignore files are properly placed at template level.

## Memory Storage

All fixes stored in Claude-Flow ReasoningBank for future reference:

```bash
npx claude-flow memory get "health-check-fix/docker-compose" --namespace "fixes"
npx claude-flow memory get "port-documentation/production-vs-dev" --namespace "fixes"
npx claude-flow memory get "dockerignore/placement" --namespace "fixes"
```

## Testing

To verify the fixes:

### Health Check Test
```bash
# Build and run any template
cd project-directory
docker-compose up -d

# Check health status
docker-compose ps
# Should show "healthy" status after start_period

# Verify health check is running
docker inspect <container-name> | grep -A 10 "Health"
```

### Port Test
```bash
# Production (should use port 3000)
docker run -p 3000:3000 --env-file .env image-name
curl http://localhost:3000

# Custom port (should respect PORT env var)
PORT=8080 docker run -p 8080:8080 --env-file .env image-name
curl http://localhost:8080
```

## Impact

**Before**:
- ❌ Health checks would fail in production (wget not found)
- ❌ Confusion about which port to use
- ❌ READMEs showed wrong default ports

**After**:
- ✅ Health checks work across all alpine-based templates
- ✅ Clear documentation of production (3000) vs dev (5173) ports
- ✅ Consistent configuration across all templates
- ✅ Better developer experience

## Related Documentation

- Security fixes (v3.3.1): Health check patterns align with security best practices
- vibe-to-docker templates: All templates now use consistent health check approach
- .env.example: Enhanced documentation for PORT variable

## Commit Message

```
fix(templates): align health checks and clarify port documentation

- Replace wget with node-based health checks in all docker-compose.yml files
  (wget not installed in alpine images)
- Update READMEs to clarify production (3000) vs dev (5173) port usage
- Enhance .env.example with PORT variable documentation
- Verify .dockerignore placement (all correct)

Benefits:
- Consistent health checks across Dockerfile and docker-compose.yml
- No additional dependencies required
- Clear developer guidance on port usage
- Better production deployment experience

Fixes health check failures in alpine-based containers and resolves
port confusion for developers migrating from dev to production.
```

## References

- Issue: Health check command mismatch (Dockerfile vs docker-compose.yml)
- Issue: Port documentation inconsistencies (5173 vs 3000)
- Security: Aligned with v3.3.1 security fixes for health check patterns
