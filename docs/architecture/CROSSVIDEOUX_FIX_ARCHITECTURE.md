# Crossvideoux Build Blockers - Architecture Fix Document

**Date**: November 15, 2025
**Version**: v3.2.0 (Fix Planning)
**Architect**: System Architecture Designer
**Status**: Architecture Design Complete ✅

---

## Executive Summary

This document provides architectural decisions to fix 7 build blockers identified in the Crossvideoux project (Figma Make + React + Vite). The fixes prioritize **minimal disruption** to existing working configuration while ensuring **compatibility with vibe-to-docker templates**.

**Strategy**: Use a **hybrid approach** - fix template generation logic (low risk) rather than user-facing configuration files (high risk).

---

## Table of Contents

1. [Build Blockers Overview](#build-blockers-overview)
2. [Architecture Decision Records](#architecture-decision-records)
3. [Implementation Specifications](#implementation-specifications)
4. [Risk Assessment](#risk-assessment)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Plan](#deployment-plan)

---

## Build Blockers Overview

### Summary Table

| # | Blocker | Severity | Impact | Fix Strategy |
|---|---------|----------|--------|--------------|
| 1 | Missing serve.json | 🔴 Critical | Build fails | **Template generates serve.json** |
| 2 | Build output mismatch (build/ vs dist/) | 🔴 Critical | Empty container | **Align Dockerfile to Vite** |
| 3 | Missing tsconfig.json | 🟡 Medium | TypeScript fails | **Generate tsconfig.json** |
| 4 | Missing @types/* dependencies | 🟡 Medium | Type errors | **Add to package.json** |
| 5 | Health check mismatch (node vs wget) | 🟡 Medium | Health check fails | **Align to node command** |
| 6 | Port documentation inconsistency (5173 vs 3000) | 🟢 Low | User confusion | **Standardize to 3000** |
| 7 | .dockerignore not at project root | 🟢 Low | Build inefficiency | **Copy to project root** |

---

## Architecture Decision Records

### ADR-005: serve.json Generation for Static Builds

**Decision**: Template composer generates `serve.json` during Dockerfile composition

**Context**:
- Dockerfile line 95: `COPY --from=builder --chown=appuser:nodejs /app/serve.json ./serve.json`
- Dockerfile line 122: `CMD ["serve", "-s", "dist", "-l", "{{PORT}}", "-c", "serve.json"]`
- **Problem**: serve.json doesn't exist in Figma Make exports

**Options Considered**:

| Option | Pros | Cons | Risk |
|--------|------|------|------|
| A. User creates manually | No code changes | User error-prone, poor UX | High |
| B. Template generates | Automated, consistent | Requires template logic | **Low** ✅ |
| C. Remove serve.json dependency | Simpler Dockerfile | Loses compression/caching config | Medium |

**Decision**: **Option B - Template generates serve.json**

**Rationale**:
- Figma Make projects are 100% static builds (React + Vite)
- serve.json provides:
  - Proper SPA routing (fallback to index.html)
  - Gzip/Brotli compression
  - Cache headers for static assets
  - Security headers (X-Content-Type-Options, etc.)
- Template composer already generates .env.example, README.md, etc.

**Implementation**:
```javascript
// src/lib/template-composer.js

function generateServeJson(metadata) {
  return {
    public: "dist",  // Vite default output
    rewrites: [
      { source: "**", destination: "/index.html" }  // SPA routing
    ],
    headers: [
      {
        source: "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "**/*.@(js|css|json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "**/*.html",
        headers: [
          { key: "Cache-Control", value: "no-cache, must-revalidate" }
        ]
      }
    ],
    trailingSlash: false,
    cleanUrls: true,
    symlinks: false,
    etag: true,
    cors: true
  };
}
```

**File Location**: `.vibe-docker/serve.json` (generated alongside Dockerfile)

**Consequences**:
- ✅ Automated, zero user configuration
- ✅ Optimal SPA + caching configuration
- ✅ Consistent across all Figma Make projects
- ❌ Slight increase in template complexity (+15 lines)

---

### ADR-006: Build Output Directory Alignment

**Decision**: Keep Vite default (`dist/`), update Dockerfile references

**Context**:
- **Vite default**: `dist/` (vite.config.js: `build.outDir`)
- **Dockerfile COPY**: Line 93 references `dist/`
- **Dockerfile CMD**: Line 122 uses `-s dist`
- **Current state**: Already aligned! ✅

**Options Considered**:

| Option | Changes Required | Risk | Compatibility |
|--------|------------------|------|---------------|
| A. Change Vite → build/ | Modify vite.config.js | **High** ❌ | Breaks existing projects |
| B. Change Dockerfile → dist/ | None (already correct) | **None** ✅ | Full compatibility |
| C. Make configurable | Add build detection | Medium | Future-proof |

**Decision**: **Option B - No changes required (verify only)**

**Rationale**:
- Dockerfile.base already uses `dist/` (lines 93, 122)
- Vite default is `dist/` (no vite.config.js needed)
- Zero risk, zero code changes
- **Action**: Document this as "verified working" not "needs fixing"

**Verification Test**:
```javascript
// Test: Ensure COPY matches Vite output
const dockerfileLine93 = dockerfile.match(/COPY --from=builder.*\/app\/(\w+)/)[1];
const viteOutputDir = viteConfig?.build?.outDir || 'dist';
expect(dockerfileLine93).toBe(viteOutputDir);
```

**Consequences**:
- ✅ Zero code changes
- ✅ Zero risk
- ✅ Already production-ready
- ℹ️ **Reclassified**: Not a blocker, just needs documentation

---

### ADR-007: TypeScript Configuration Generation

**Decision**: Generate `tsconfig.json` if TypeScript detected and missing

**Context**:
- Figma Make exports use TypeScript by default
- Missing tsconfig.json causes build errors: `error TS5023: Unknown compiler option`
- Vite requires tsconfig.json for TypeScript projects

**Options Considered**:

| Option | Pros | Cons | Risk |
|--------|------|------|------|
| A. User creates manually | Flexible for customization | Requires TypeScript knowledge | High |
| B. Always generate | Simple, consistent | May overwrite user config | Medium |
| C. Generate if missing + TypeScript detected | Safe, automated | Requires detection logic | **Low** ✅ |

**Decision**: **Option C - Conditional generation**

**Rationale**:
- Only affects TypeScript projects (framework detection)
- Vite-specific configuration (not Next.js or other frameworks)
- Minimal, production-ready defaults
- Does not overwrite existing tsconfig.json

**Implementation**:
```javascript
// src/lib/template-composer.js

async function shouldGenerateTsConfig(projectDir, metadata) {
  // Only for TypeScript + Vite projects
  if (!metadata.typescript || metadata.framework !== 'react-vite') {
    return false;
  }

  // Don't overwrite existing
  const tsconfigExists = await fs.access(
    path.join(projectDir, 'tsconfig.json')
  ).then(() => true).catch(() => false);

  return !tsconfigExists;
}

function generateTsConfig(metadata) {
  return {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,

      // Bundler mode
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",

      // Linting
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  };
}
```

**File Location**: `tsconfig.json` (project root, not .vibe-docker/)

**Consequences**:
- ✅ Automated TypeScript support
- ✅ Vite-optimized configuration
- ✅ Won't overwrite user customizations
- ⚠️ Requires detection of TypeScript usage
- ℹ️ Also generates `tsconfig.node.json` for Vite config

---

### ADR-008: Package.json Dependency Management

**Decision**: Add @types/* dependencies to user's package.json (if missing)

**Context**:
- TypeScript requires @types/react, @types/react-dom
- Figma Make exports sometimes omit @types/* dependencies
- Build fails with: `Cannot find module '@types/react'`

**Options Considered**:

| Option | Approach | Pros | Cons | Risk |
|--------|----------|------|------|------|
| A. Modify package.json | Add to devDependencies | Permanent fix | Modifies user file | Medium |
| B. Install in Dockerfile | RUN npm install @types/react | No package.json edit | Ephemeral, not tracked | High |
| C. Prompt user to add manually | Safe, no automation | Requires manual steps | Poor UX | Low code risk, high UX risk |
| D. Generate package.json.additions | Separate file to merge | Traceable, non-destructive | Requires manual merge | **Low** ✅ |

**Decision**: **Option D - Generate package.json.additions file**

**Rationale**:
- **Non-destructive**: Doesn't modify original package.json
- **Transparent**: User sees exactly what needs to be added
- **Optional**: User can choose to merge or ignore
- **Documented**: Includes instructions in README.md

**Implementation**:
```javascript
// src/lib/template-composer.js

async function generatePackageJsonAdditions(metadata) {
  if (!metadata.typescript) return null;

  const existingPkg = JSON.parse(
    await fs.readFile('package.json', 'utf-8')
  );

  const requiredTypes = {
    '@types/react': '^18.2.0',
    '@types/react-dom': '^18.2.0'
  };

  const missing = Object.entries(requiredTypes)
    .filter(([pkg]) => !existingPkg.devDependencies?.[pkg])
    .reduce((acc, [pkg, version]) => ({ ...acc, [pkg]: version }), {});

  if (Object.keys(missing).length === 0) return null;

  return {
    message: "Add these to your package.json devDependencies:",
    devDependencies: missing,
    command: `npm install --save-dev ${Object.keys(missing).join(' ')}`
  };
}
```

**File Location**: `.vibe-docker/package.json.additions` (JSON with install command)

**User Workflow**:
```bash
# vibe-to-docker generates:
cat .vibe-docker/package.json.additions
# {
#   "message": "Add these to your package.json devDependencies:",
#   "devDependencies": {
#     "@types/react": "^18.2.0",
#     "@types/react-dom": "^18.2.0"
#   },
#   "command": "npm install --save-dev @types/react @types/react-dom"
# }

# User runs:
npm install --save-dev @types/react @types/react-dom
```

**Consequences**:
- ✅ Non-destructive (doesn't modify package.json)
- ✅ User maintains full control
- ✅ Documented in README.md generation message
- ✅ Easily reversible
- ❌ Requires one extra manual step
- ℹ️ Could be automated in future with `--auto-install` flag

---

### ADR-009: Health Check Command Alignment

**Decision**: Use `node` command in both Dockerfile and docker-compose.yml

**Context**:
- **Dockerfile line 118**: Uses `node -e "require('http').get(...)"`
- **docker-compose.yml line 40**: Uses `wget --quiet --tries=1 --spider`
- **Problem**: Inconsistent health check methods

**Options Considered**:

| Option | Tool | Availability | Pros | Cons | Risk |
|--------|------|--------------|------|------|------|
| A. wget everywhere | wget | Requires apk add wget | Simpler syntax | Extra dependency | Medium |
| B. node everywhere | node | Built-in Node.js | Zero dependencies | Slightly verbose | **Low** ✅ |
| C. curl everywhere | curl | Requires apk add curl | Industry standard | Extra dependency | Medium |
| D. Mix (node in Dockerfile, wget in compose) | Both | Current state | Per-context optimal | **Inconsistent** | ❌ |

**Decision**: **Option B - node command everywhere**

**Rationale**:
- **Zero extra dependencies**: node is already in the container
- **Consistent**: Same check in Dockerfile and docker-compose.yml
- **Reliable**: Direct HTTP check, no need for wget/curl
- **Security**: Fewer packages = smaller attack surface

**Implementation**:

**Dockerfile (line 117-118)**: Keep as-is ✅
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

**docker-compose.yml (line 40-44)**: Update to match
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**Consequences**:
- ✅ Zero dependency additions
- ✅ Consistent health checks
- ✅ More secure (fewer packages)
- ⚠️ Slightly longer command syntax
- ℹ️ Works for both static (serve) and server (Next.js) builds

---

### ADR-010: Port Documentation Standardization

**Decision**: Standardize production port to 3000, document dev port as 5173

**Context**:
- **Vite dev server**: Port 5173 (default)
- **Production container**: Port 3000 (configurable)
- **Confusion**: Users expect 5173 in production

**Current Behavior**:
- Development: `npm run dev` → http://localhost:5173
- Production (Docker): `docker run -p 3000:3000` → http://localhost:3000

**Options Considered**:

| Option | Production Port | Dev Port | Pros | Cons | Risk |
|--------|----------------|----------|------|------|------|
| A. Use 5173 everywhere | 5173 | 5173 | Consistent with Vite | Non-standard HTTP | Medium |
| B. Use 3000 everywhere | 3000 | 3000 | Standard HTTP alt port | Different from Vite dev | Low |
| C. Document both clearly | 3000 | 5173 | Honors both contexts | Requires clear docs | **Lowest** ✅ |

**Decision**: **Option C - Separate documented ports**

**Rationale**:
- **Development**: Keep Vite default (5173) for `npm run dev`
- **Production**: Use 3000 (standard Docker convention)
- **Documentation**: Clearly explain port mapping in README.md

**Implementation**:

**1. Dockerfile (line 114)**: Use configurable PORT (defaults to 3000)
```dockerfile
EXPOSE {{PORT}}  # Default: 3000
```

**2. docker-compose.yml (line 9-10)**: Map 3000:3000
```yaml
ports:
  - "{{PORT}}:{{PORT}}"  # Default: "3000:3000"
```

**3. README.md generation**: Document both ports
```markdown
## Port Configuration

- **Development**: `npm run dev` runs on http://localhost:5173
- **Production (Docker)**: Container runs on port 3000 (configurable via PORT env var)

### Port Mapping Examples

```bash
# Default: Map 3000 → 3000
docker-compose up  # Access at http://localhost:3000

# Custom: Map 8080 → 3000 (host:container)
docker run -p 8080:3000 image  # Access at http://localhost:8080
```

**Consequences**:
- ✅ Clear separation of dev vs prod
- ✅ Honors Vite conventions in development
- ✅ Standard Docker conventions in production
- ✅ Configurable via environment variable
- ℹ️ **Not a blocker**: Just documentation improvement

---

### ADR-011: .dockerignore Placement Strategy

**Decision**: Copy .dockerignore to project root during initialization

**Context**:
- **Current**: .dockerignore in .vibe-docker/ directory
- **Docker requirement**: .dockerignore must be at project root (same level as Dockerfile context)
- **Problem**: Docker context is `../` (parent of .vibe-docker/), ignoring .vibe-docker/.dockerignore

**Options Considered**:

| Option | Location | Pros | Cons | Risk |
|--------|----------|------|------|------|
| A. Keep in .vibe-docker/ | .vibe-docker/.dockerignore | Organized | **Doesn't work** ❌ | High |
| B. Copy to project root | ./.dockerignore | Works correctly | User may already have one | Medium |
| C. Generate at root, symlink in .vibe-docker/ | Both locations | Traceable + functional | Symlinks not portable | Medium |
| D. Generate at root, backup existing | ./.dockerignore | Safe, works | Requires backup logic | **Low** ✅ |

**Decision**: **Option D - Generate at root with backup**

**Rationale**:
- Docker context is `../` (parent directory), so .dockerignore must be at project root
- If .dockerignore exists, back it up to .dockerignore.backup.{timestamp}
- Merge existing rules with vibe-to-docker defaults
- Document in README.md that .dockerignore was created/merged

**Implementation**:
```javascript
// src/lib/directory-manager.js

async function handleDockerignore(projectDir) {
  const dockerignorePath = path.join(projectDir, '.dockerignore');
  const vibeDockerignorePath = path.join(projectDir, '.vibe-docker', '.dockerignore');

  // Check if .dockerignore exists at root
  const existingContent = await fs.readFile(dockerignorePath, 'utf-8')
    .catch(() => null);

  if (existingContent) {
    // Backup existing
    const timestamp = Date.now();
    await fs.writeFile(
      `${dockerignorePath}.backup.${timestamp}`,
      existingContent
    );
    console.log(`✓ Backed up existing .dockerignore to .dockerignore.backup.${timestamp}`);
  }

  // Generate vibe-to-docker .dockerignore
  const vibeDockerignore = generateDockerignoreContent();

  // Merge with existing (if any)
  const mergedContent = existingContent
    ? mergeDockerignore(existingContent, vibeDockerignore)
    : vibeDockerignore;

  // Write to project root
  await fs.writeFile(dockerignorePath, mergedContent);

  // Also keep copy in .vibe-docker/ for reference
  await fs.writeFile(vibeDockerignorePath, vibeDockerignore);

  return { created: true, merged: !!existingContent };
}

function generateDockerignoreContent() {
  return `# Generated by vibe-to-docker
# Build artifacts
node_modules/
dist/
build/
.vite/
*.log

# Development files
.git/
.gitignore
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# vibe-to-docker (don't copy into container)
.vibe-docker/

# OS files
.DS_Store
Thumbs.db
`;
}

function mergeDockerignore(existing, vibeDefaults) {
  const existingLines = new Set(existing.split('\n').map(l => l.trim()));
  const vibeLines = vibeDefaults.split('\n').map(l => l.trim());

  const merged = ['# Merged .dockerignore (vibe-to-docker + existing)', ''];

  // Add vibe defaults
  merged.push('# vibe-to-docker defaults');
  for (const line of vibeLines) {
    if (!existingLines.has(line) && line && !line.startsWith('#')) {
      merged.push(line);
    }
  }

  merged.push('');
  merged.push('# Existing rules');
  merged.push(existing);

  return merged.join('\n');
}
```

**File Locations**:
- **Primary**: `.dockerignore` (project root) - used by Docker
- **Reference**: `.vibe-docker/.dockerignore` - for documentation
- **Backup**: `.dockerignore.backup.{timestamp}` - if existing file

**Consequences**:
- ✅ Docker context works correctly
- ✅ Preserves existing .dockerignore rules
- ✅ Documented merge process
- ⚠️ Modifies project root (with backup)
- ℹ️ User can manually edit after generation

---

## Implementation Specifications

### File Generation Matrix

| File | Location | When Generated | Overwrite Policy |
|------|----------|----------------|------------------|
| **serve.json** | .vibe-docker/serve.json | Always (STATIC_BUILD) | Always generate |
| **tsconfig.json** | ./tsconfig.json | If TypeScript && missing | Never overwrite |
| **tsconfig.node.json** | ./tsconfig.node.json | If TypeScript && missing | Never overwrite |
| **package.json.additions** | .vibe-docker/package.json.additions | If @types/* missing | Always generate |
| **.dockerignore** | ./.dockerignore | Always | Merge with existing |
| **.dockerignore (ref)** | .vibe-docker/.dockerignore | Always | Always generate |

### Template Composer Changes

**File**: `src/lib/template-composer.js`

**New Functions**:
```javascript
// Lines 500-550: Add new generation functions

async generateStaticBuildFiles(projectDir, metadata) {
  const files = {};

  // 1. serve.json (always for static builds)
  if (metadata.isStaticBuild) {
    files['serve.json'] = JSON.stringify(this.generateServeJson(metadata), null, 2);
  }

  // 2. tsconfig.json (if TypeScript + missing)
  if (await this.shouldGenerateTsConfig(projectDir, metadata)) {
    files['tsconfig.json'] = JSON.stringify(this.generateTsConfig(metadata), null, 2);
    files['tsconfig.node.json'] = JSON.stringify(this.generateTsConfigNode(metadata), null, 2);
  }

  // 3. package.json.additions (if @types/* missing)
  const pkgAdditions = await this.generatePackageJsonAdditions(projectDir, metadata);
  if (pkgAdditions) {
    files['package.json.additions'] = JSON.stringify(pkgAdditions, null, 2);
  }

  return files;
}

// Helper functions (see ADRs above for full implementation)
generateServeJson(metadata) { /* ADR-005 */ }
shouldGenerateTsConfig(projectDir, metadata) { /* ADR-007 */ }
generateTsConfig(metadata) { /* ADR-007 */ }
generateTsConfigNode(metadata) { /* ADR-007 */ }
generatePackageJsonAdditions(projectDir, metadata) { /* ADR-008 */ }
```

**Modified Functions**:
```javascript
// Update compose() to include new file generation
async compose(config) {
  // ... existing composition logic ...

  // Generate additional files for static builds
  const additionalFiles = await this.generateStaticBuildFiles(
    config.projectDir,
    config.metadata
  );

  return {
    dockerfile: composedDockerfile,
    dockerCompose: composedDockerCompose,
    ...additionalFiles  // serve.json, tsconfig.json, etc.
  };
}
```

### Docker Compose Template Changes

**File**: `src/templates/tools/figma-make/docker-compose.yml`

**Line 40-44**: Update health check to use node
```yaml
# BEFORE (wget)
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:{{PORT}}/"]

# AFTER (node)
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:{{PORT}}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
```

### Directory Manager Changes

**File**: `src/lib/directory-manager.js`

**New Function**:
```javascript
// Lines 200-250: Add .dockerignore handling
async handleDockerignore(projectDir) {
  // See ADR-011 implementation
}
```

**Update writeFiles()**:
```javascript
async writeFiles(projectDir, files) {
  // ... existing logic ...

  // Handle .dockerignore specially (goes to project root)
  if (files['.dockerignore']) {
    await this.handleDockerignore(projectDir);
  }

  // Write other files to .vibe-docker/
  for (const [filename, content] of Object.entries(files)) {
    if (filename === '.dockerignore') continue; // Already handled

    const filePath = path.join(projectDir, '.vibe-docker', filename);
    await fs.writeFile(filePath, content, 'utf-8');
  }
}
```

---

## Risk Assessment

### Risk Matrix

| Fix | Technical Risk | UX Risk | Rollback Difficulty | Mitigation |
|-----|----------------|---------|---------------------|------------|
| **serve.json** | 🟢 Low | 🟢 Low | Easy (delete file) | Comprehensive tests |
| **Build output** | 🟢 None (verified working) | 🟢 None | N/A | Documentation only |
| **tsconfig.json** | 🟡 Medium | 🟢 Low | Easy (delete file) | Never overwrite existing |
| **package.json.additions** | 🟢 Low | 🟡 Medium | Easy (ignore file) | Non-destructive design |
| **Health check** | 🟢 Low | 🟢 Low | Easy (revert template) | Already works in Dockerfile |
| **Port docs** | 🟢 None | 🟢 Low | N/A | Documentation only |
| **.dockerignore** | 🟡 Medium | 🟡 Medium | Medium (restore backup) | Backup existing, merge logic |

### Risk Mitigation Strategies

#### 1. serve.json Generation
**Risk**: Invalid JSON breaks serve
**Mitigation**:
- JSON schema validation before write
- Test with serve --version to verify syntax
- Include fallback in Dockerfile comments

#### 2. tsconfig.json Generation
**Risk**: Conflicts with user customizations
**Mitigation**:
- Only generate if missing
- Document that user should customize
- Keep minimal (Vite-compatible only)

#### 3. package.json.additions
**Risk**: User forgets to install dependencies
**Mitigation**:
- Print warning message after generation
- Include in README.md post-install steps
- Future: Add --auto-install flag

#### 4. .dockerignore Placement
**Risk**: Overwrites important user rules
**Mitigation**:
- Always backup existing file
- Merge logic preserves user rules
- Document merge in console output

---

## Testing Strategy

### Unit Tests

**New Test File**: `tests/unit/static-build-files.test.js`

```javascript
describe('Static Build File Generation', () => {
  describe('serve.json', () => {
    it('should generate valid serve.json for Figma Make', () => {
      const composer = new TemplateComposer();
      const serveJson = composer.generateServeJson({
        tool: 'figma-make',
        port: 3000
      });

      expect(serveJson.public).toBe('dist');
      expect(serveJson.rewrites).toHaveLength(1);
      expect(serveJson.rewrites[0].destination).toBe('/index.html');
      expect(JSON.parse(JSON.stringify(serveJson))).toBeDefined(); // Valid JSON
    });

    it('should include proper cache headers', () => {
      const composer = new TemplateComposer();
      const serveJson = composer.generateServeJson({ tool: 'figma-make' });

      const imageHeaders = serveJson.headers.find(h =>
        h.source.includes('@(jpg|jpeg|gif|png)')
      );
      expect(imageHeaders.headers[0].key).toBe('Cache-Control');
      expect(imageHeaders.headers[0].value).toContain('max-age=31536000');
    });
  });

  describe('tsconfig.json', () => {
    it('should generate valid TypeScript config', () => {
      const composer = new TemplateComposer();
      const tsconfig = composer.generateTsConfig({
        typescript: true,
        framework: 'react-vite'
      });

      expect(tsconfig.compilerOptions.target).toBe('ES2020');
      expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
      expect(tsconfig.include).toContain('src');
    });

    it('should not generate for non-TypeScript projects', async () => {
      const composer = new TemplateComposer();
      const should = await composer.shouldGenerateTsConfig('/tmp', {
        typescript: false
      });

      expect(should).toBe(false);
    });
  });

  describe('package.json.additions', () => {
    it('should detect missing @types/* dependencies', async () => {
      const tempDir = await createTempProject({
        packageJson: {
          name: 'test',
          devDependencies: {} // No @types/*
        }
      });

      const composer = new TemplateComposer();
      const additions = await composer.generatePackageJsonAdditions(tempDir, {
        typescript: true
      });

      expect(additions.devDependencies).toHaveProperty('@types/react');
      expect(additions.devDependencies).toHaveProperty('@types/react-dom');
      expect(additions.command).toContain('npm install --save-dev');
    });

    it('should return null if @types/* already exist', async () => {
      const tempDir = await createTempProject({
        packageJson: {
          name: 'test',
          devDependencies: {
            '@types/react': '^18.0.0',
            '@types/react-dom': '^18.0.0'
          }
        }
      });

      const composer = new TemplateComposer();
      const additions = await composer.generatePackageJsonAdditions(tempDir, {
        typescript: true
      });

      expect(additions).toBeNull();
    });
  });
});
```

### Integration Tests

**Update File**: `tests/integration/crossvideoux-regression.test.js`

```javascript
describe('Crossvideoux Full Integration (7 Blockers Fixed)', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await createCrossvideoux Project();
  });

  it('should generate serve.json for static build', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const serveJsonPath = path.join(tempDir, '.vibe-docker', 'serve.json');
    const serveJson = JSON.parse(await fs.readFile(serveJsonPath, 'utf-8'));

    expect(serveJson.public).toBe('dist');
    expect(serveJson.rewrites[0].destination).toBe('/index.html');
  });

  it('should generate tsconfig.json if TypeScript detected', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const tsconfigPath = path.join(tempDir, 'tsconfig.json');
    const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));

    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
    expect(tsconfig.compilerOptions.target).toBe('ES2020');
  });

  it('should create package.json.additions for missing @types/*', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const additionsPath = path.join(tempDir, '.vibe-docker', 'package.json.additions');
    const additions = JSON.parse(await fs.readFile(additionsPath, 'utf-8'));

    expect(additions.devDependencies).toHaveProperty('@types/react');
    expect(additions.command).toContain('npm install --save-dev');
  });

  it('should use consistent health checks (node command)', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const dockerfile = await fs.readFile(
      path.join(tempDir, '.vibe-docker', 'Dockerfile'),
      'utf-8'
    );
    const dockerCompose = await fs.readFile(
      path.join(tempDir, '.vibe-docker', 'docker-compose.yml'),
      'utf-8'
    );

    // Both should use node health check
    expect(dockerfile).toContain("CMD node -e \"require('http').get");
    expect(dockerCompose).toContain('CMD", "node", "-e", "require(\'http\').get');
  });

  it('should place .dockerignore at project root', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const dockerignorePath = path.join(tempDir, '.dockerignore');
    const dockerignore = await fs.readFile(dockerignorePath, 'utf-8');

    expect(dockerignore).toContain('node_modules/');
    expect(dockerignore).toContain('.vibe-docker/');
  });

  it('should document ports correctly (3000 prod, 5173 dev)', async () => {
    await runVibeToDocker(tempDir, { tool: 'figma-make' });

    const readme = await fs.readFile(
      path.join(tempDir, '.vibe-docker', 'README.md'),
      'utf-8'
    );

    expect(readme).toContain('http://localhost:5173'); // Dev
    expect(readme).toContain('http://localhost:3000'); // Prod
    expect(readme).toContain('Port Configuration');
  });
});
```

### E2E Tests

**New Test File**: `tests/e2e/crossvideoux-build.test.js`

```javascript
describe('Crossvideoux End-to-End Docker Build', () => {
  it('should build and run Docker container successfully', async () => {
    const projectDir = await setupCrossvideoux();

    // 1. Run vibe-to-docker
    await runVibeToDocker(projectDir, { tool: 'figma-make' });

    // 2. Build Docker image
    const buildResult = await execAsync(
      'docker build -f .vibe-docker/Dockerfile -t crossvideoux-test .',
      { cwd: projectDir }
    );
    expect(buildResult.exitCode).toBe(0);

    // 3. Run container
    const containerId = await execAsync(
      'docker run -d -p 3000:3000 crossvideoux-test'
    );

    // 4. Wait for health check
    await waitForHealthy(containerId, 60000);

    // 5. Test HTTP endpoint
    const response = await fetch('http://localhost:3000');
    expect(response.status).toBe(200);

    // 6. Cleanup
    await execAsync(`docker stop ${containerId}`);
    await execAsync(`docker rm ${containerId}`);
  }, 120000); // 2min timeout
});
```

---

## Deployment Plan

### Phase 1: Code Changes (Week 1)

**Day 1-2**: Template composer enhancements
- ✅ Implement `generateServeJson()`
- ✅ Implement `generateTsConfig()`
- ✅ Implement `generatePackageJsonAdditions()`
- ✅ Update `compose()` to generate additional files

**Day 3-4**: Template updates
- ✅ Update docker-compose.yml health check (node command)
- ✅ Verify Dockerfile.base uses dist/ (no changes needed)
- ✅ Add serve.json COPY to Dockerfile.base

**Day 5**: Directory manager updates
- ✅ Implement `handleDockerignore()`
- ✅ Update `writeFiles()` for .dockerignore placement
- ✅ Add backup/merge logic

### Phase 2: Testing (Week 1-2)

**Day 6-7**: Unit tests
- ✅ Write tests for serve.json generation
- ✅ Write tests for tsconfig.json generation
- ✅ Write tests for package.json.additions
- ✅ Write tests for .dockerignore merge logic

**Day 8-9**: Integration tests
- ✅ Update crossvideoux-regression.test.js
- ✅ Test all 7 fixes together
- ✅ Verify backwards compatibility

**Day 10**: E2E tests
- ✅ Docker build + run test
- ✅ Health check verification
- ✅ HTTP endpoint testing

### Phase 3: Documentation (Week 2)

**Day 11-12**: User-facing docs
- ✅ Update README.md generation template
- ✅ Add port configuration section
- ✅ Document package.json.additions workflow
- ✅ Add troubleshooting section

**Day 13**: Architecture docs
- ✅ This document (CROSSVIDEOUX_FIX_ARCHITECTURE.md)
- ✅ Update SYSTEM_ARCHITECTURE.md
- ✅ Add ADRs to decision log

### Phase 4: Deployment (Week 2)

**Day 14**: Release
- ✅ Run full test suite (1,295+ tests)
- ✅ Version bump (v3.2.1)
- ✅ Publish to npm
- ✅ Store learnings in AgentDB

**Post-Deployment**: Monitoring
- Monitor GitHub issues for regression reports
- Collect user feedback on generated files
- Iterate on serve.json defaults if needed

---

## Success Metrics

### Pre-Deployment Validation

| Metric | Target | Test Command |
|--------|--------|--------------|
| All tests passing | 100% | `npm test` |
| Coverage maintained | >99% | `npm run test -- --coverage` |
| Docker build success | 100% | E2E tests |
| Health check works | 100% | E2E tests |
| File generation correct | 100% | Integration tests |

### Post-Deployment Monitoring

| Metric | Target | Measurement |
|--------|--------|-------------|
| GitHub issue reports | <5 in first week | Issue tracker |
| Build success rate | >95% | User feedback |
| Documentation clarity | >90% positive | User surveys |
| Rollback requests | 0 | Support tickets |

---

## Rollback Plan

### If Critical Issues Arise

**Scenario**: Generated files cause build failures

**Rollback Steps**:
1. Revert npm package to v3.2.0
2. Publish hotfix v3.2.0-rollback
3. Notify users via GitHub release notes

**Data Preservation**:
- User backups (.dockerignore.backup.{timestamp}) remain intact
- Users can manually delete generated files
- No destructive operations in fix

**Recovery**:
- Fix issues in v3.2.2
- Re-test with expanded test matrix
- Gradual rollout (beta tag first)

---

## Appendices

### Appendix A: serve.json Schema

```json
{
  "$schema": "https://json.schemastore.org/serve.json",
  "public": "dist",
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "**/*.@(js|css|json)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "**/*.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, must-revalidate"
        }
      ]
    }
  ],
  "trailingSlash": false,
  "cleanUrls": true,
  "symlinks": false,
  "etag": true,
  "cors": true
}
```

### Appendix B: tsconfig.json for Vite + React

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

### Appendix C: tsconfig.node.json for Vite Config

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Appendix D: package.json.additions Example

```json
{
  "message": "Add these to your package.json devDependencies:",
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22"
  },
  "command": "npm install --save-dev @types/react @types/react-dom",
  "documentation": "https://github.com/wrsmith108/vibe-to-docker#typescript-support"
}
```

---

## Document Metadata

**Version**: 1.0.0
**Created**: November 15, 2025
**Last Updated**: November 15, 2025
**Author**: System Architecture Designer
**Reviewers**: QA Engineer, Tech Lead
**Status**: Architecture Design Complete ✅
**Implementation Status**: Pending
**Target Release**: v3.2.1

---

## Approval

This architecture document provides comprehensive solutions for all 7 Crossvideoux build blockers with minimal risk and maximum compatibility.

**Approved By**: System Architecture Designer
**Date**: November 15, 2025
**Next Step**: Implementation (Week 1-2)

---

*This document is the authoritative source for Crossvideoux build blocker fixes. All implementation work should reference this document for architectural guidance.*
