# Docker Template Update Summary

**Task:** Update Docker templates for per-project installation structure
**Date:** 2025-10-26
**Status:** ✅ Complete

## Overview

All Docker templates have been updated to use the new `.vibe-docker/` directory structure with proper variable placeholders for per-project installation.

## Variables Used

- **{{PROJECT_ROOT}}**: Path to the project root directory (where package.json lives)
- **{{FIGMA_DOCKER_DIR}}**: Path to the .vibe-docker configuration directory
- **{{BUILD_OUTPUT_DIR}}**: Build output directory (e.g., dist, build)
- **{{PROJECT_NAME}}**: Project name for container naming

## Files Updated

### templates/basic/

#### 1. `Dockerfile`
**Changes:**
- Added `ARG PROJECT_ROOT={{PROJECT_ROOT}}` build argument
- Added `ARG FIGMA_DOCKER_DIR={{FIGMA_DOCKER_DIR}}` build argument
- These variables are available during build for future extensibility

#### 2. `docker-compose.yml`
**Changes:**
- Updated volume mount: `.:/app` → `{{PROJECT_ROOT}}:/app`
- Added new mount: `{{FIGMA_DOCKER_DIR}}:{{FIGMA_DOCKER_DIR}}:ro`
- Updated nginx config mount: `./nginx.conf` → `{{FIGMA_DOCKER_DIR}}/nginx.conf`
- Updated SSL mount: `./ssl` → `{{FIGMA_DOCKER_DIR}}/ssl`
- Updated monitoring mounts:
  - `./monitoring/prometheus.yml` → `{{FIGMA_DOCKER_DIR}}/monitoring/prometheus.yml`
  - `./monitoring/grafana/provisioning` → `{{FIGMA_DOCKER_DIR}}/monitoring/grafana/provisioning`

#### 3. `nginx.conf`
**Changes:**
- Added header comment indicating file location: `{{FIGMA_DOCKER_DIR}}/nginx.conf`
- Added comment explaining mount configuration

#### 4. `DOCKER.md`
**Changes:**
- Updated bind mount documentation to reflect new paths:
  - Source code: `{{PROJECT_ROOT}}:/app`
  - Nginx config: `{{FIGMA_DOCKER_DIR}}/nginx.conf`
  - Config directory: `{{FIGMA_DOCKER_DIR}}`

### templates/ui-heavy/

All changes identical to `templates/basic/` but with UI-heavy specific comments and resource limits.

#### 1. `Dockerfile`
- Added `ARG PROJECT_ROOT={{PROJECT_ROOT}}`
- Added `ARG FIGMA_DOCKER_DIR={{FIGMA_DOCKER_DIR}}`

#### 2. `docker-compose.yml`
- Updated all volume mounts to use new variables
- Same changes as basic template

#### 3. `nginx.conf`
- Added header comment with UI-heavy variant designation
- Same path updates as basic template

#### 4. `DOCKER.md`
- Updated bind mount documentation
- Same changes as basic template

## Variable Rendering Test

All template variables follow this pattern:
```
{{VARIABLE_NAME}}
```

When the template engine processes these files:
1. `{{PROJECT_ROOT}}` will be replaced with actual project path (e.g., `/path/to/user/project`)
2. `{{FIGMA_DOCKER_DIR}}` will be replaced with `.vibe-docker` relative to project root
3. All other variables ({{PROJECT_NAME}}, {{BUILD_OUTPUT_DIR}}, etc.) remain functional

## Volume Mount Structure (After Rendering)

**Development Container:**
```yaml
volumes:
  - /path/to/user/project:/app                          # Source code
  - node_modules:/app/node_modules                       # Named volume
  - /app/node_modules                                    # Anonymous volume
  - /path/to/user/project/.vibe-docker:/path/to/user/project/.vibe-docker:ro  # Config (read-only)
```

**Nginx Container:**
```yaml
volumes:
  - /path/to/user/project/.vibe-docker/nginx.conf:/etc/nginx/nginx.conf:ro
  - /path/to/user/project/.vibe-docker/ssl:/etc/ssl/certs:ro
```

**Monitoring Containers:**
```yaml
volumes:
  - /path/to/user/project/.vibe-docker/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
  - /path/to/user/project/.vibe-docker/monitoring/grafana/provisioning:/etc/grafana/provisioning:ro
```

## Verification Commands

### Check all variable usage:
```bash
grep -r "{{PROJECT_ROOT}}\|{{FIGMA_DOCKER_DIR}}" templates/
```

### Verify no hardcoded relative paths remain:
```bash
grep -r "^\s*-\s*\./" templates/*/docker-compose.yml
# Should return no results
```

## Benefits

1. **Separation of Concerns**: Docker configs live in `.vibe-docker/`, source code in project root
2. **Per-Project Installation**: Each project gets its own isolated Docker configuration
3. **Clear Structure**: Variables make it obvious what paths refer to what
4. **Maintainability**: Easy to update template generation logic
5. **Portability**: Absolute paths rendered from variables work across different systems

## Next Steps

The template engine (src/generator/template.ts) needs to:
1. Define these variables during initialization
2. Replace placeholders when copying templates
3. Handle both absolute and relative path resolution
4. Validate that paths exist and are accessible

## Related Files

- Task checklist: `docs/PHASE_1_CHECKLIST.md` (Task 1.5)
- Implementation plan: `docs/PER_PROJECT_INSTALLATION_PLAN.md`
- Template engine: `src/generator/template.ts`

## Coordination

All changes tracked in `.swarm/memory.db`:
- `swarm/docker-config/templates-basic-compose`
- `swarm/docker-config/templates-basic-dockerfile`
- `swarm/docker-config/templates-basic-nginx`
- `swarm/docker-config/templates-basic-docs`
- `swarm/docker-config/templates-ui-heavy-compose`
- `swarm/docker-config/templates-ui-heavy-dockerfile`
- `swarm/docker-config/templates-ui-heavy-nginx`
- `swarm/docker-config/templates-ui-heavy-docs`
