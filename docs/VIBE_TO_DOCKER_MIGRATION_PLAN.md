# Vibe-to-Docker Migration Plan

## Executive Summary

This document outlines the comprehensive plan to migrate `figma-docker-init` to `vibe-to-docker`, a more generalized Docker containerization tool for projects created by various "vibe-coding" tools including Figma Make, Lovable, V0, Bolt, and others.

## Background

### Current State
- **Package Name**: `figma-docker-init`
- **Purpose**: Docker setup specifically for Figma Make exported projects
- **Target Stack**: React/Vite/TypeScript projects
- **Current Version**: 2.1.0
- **Test Coverage**: 573/579 tests passing (98.9%)

### Target State
- **New Package Name**: `vibe-to-docker`
- **Purpose**: Universal Docker containerization for vibe-coded projects
- **Supported Tools**:
  - Figma Make
  - Lovable (formerly GPT Engineer)
  - V0 (Vercel)
  - Bolt (StackBlitz)
  - Other AI-assisted development tools
- **Target Stacks**: React, Vue, Svelte, Next.js, Vite, with various backends

## Analysis of Vibe-Coding Tools

### 1. Figma Make
- **Output**: React + Vite + TypeScript
- **Structure**: Component-based, design-first
- **Database**: Typically none (frontend only)
- **APIs**: Optional, usually separate

### 2. Lovable (formerly GPT Engineer)
- **Output**: Multiple frameworks (React, Vue, Svelte)
- **Structure**: Full-stack capable
- **Database**: Supabase, PostgreSQL, MongoDB support
- **APIs**: Often integrated with backend

### 3. V0 (Vercel)
- **Output**: Next.js, React, Tailwind CSS
- **Structure**: Component library focused
- **Database**: Vercel Postgres, external databases
- **APIs**: Edge functions, API routes

### 4. Bolt (StackBlitz)
- **Output**: React, Vue, Svelte, vanilla JS
- **Structure**: Full-stack WebContainers
- **Database**: SQLite, external databases
- **APIs**: Backend APIs supported

## Migration Strategy

### Phase 1: Preparation & Research (1-2 days)
- [x] Analyze current codebase architecture
- [x] Identify all Figma-specific references
- [ ] Research common patterns across vibe-coding tools
- [ ] Define new directory structure (.vibe-docker/)
- [ ] Create feature detection system

### Phase 2: Code Refactoring (3-5 days)

#### 2.1 Rename Package
- [ ] Change package name from `figma-docker-init` to `vibe-to-docker`
- [ ] Update all references in package.json
- [ ] Update bin command from `figma-docker-init` to `vibe-to-docker`
- [ ] Create legacy alias for backward compatibility

#### 2.2 Directory Structure Changes
```
Current:  .figma-docker/
New:      .vibe-docker/
          ├── config.json          # Project detection metadata
          ├── source-tool.json     # Which tool generated the project
          ├── Dockerfile
          ├── docker-compose.yml
          ├── nginx.conf
          ├── .env.example
          └── DOCKER.md
```

#### 2.3 Framework Detection System
Create intelligent detection for:
- **Framework**: React, Vue, Svelte, Next.js, etc.
- **Build Tool**: Vite, Webpack, Turbopack, esbuild
- **Database**: Supabase, PostgreSQL, MongoDB, SQLite
- **Backend**: Express, Fastify, Hono, none
- **Source Tool**: Figma Make, Lovable, V0, Bolt, unknown

Detection strategy:
```javascript
// Example detection logic
{
  "detection": {
    "framework": "auto-detect from package.json",
    "sourceTool": "detect from project structure patterns",
    "hasBackend": "check for server/api directories",
    "hasDatabase": "check for db config files",
    "buildTool": "check package.json scripts"
  }
}
```

#### 2.4 Template System Expansion
Current templates:
- `basic` - minimal setup
- `ui-heavy` - optimized for UI-heavy apps

New templates:
- `basic` - minimal frontend-only
- `fullstack` - frontend + backend + database
- `nextjs` - Next.js specific optimizations
- `supabase` - Supabase integration
- `api-heavy` - backend-focused with API gateway
- `static` - static site generation

### Phase 3: Source File Updates (2-3 days)

#### Files requiring changes (98 files identified):

##### Core Files
1. **package.json** - Name, description, keywords, bin command
2. **figma-docker-init.js** → **vibe-to-docker.js** - Main CLI entry
3. **README.md** - Full rewrite for multi-tool support
4. **CONTRIBUTING.md** - Update references
5. **LICENSE** - Update copyright if needed

##### Source Code Files
6. **src/lib/path-resolver.js** - Rename functions:
   - `resolveFigmaDockerPath()` → `resolveVibeDockerPath()`
   - `getFigmaDockerDir()` → `getVibeDockerDir()`
   - `.figma-docker` → `.vibe-docker`

7. **src/lib/directory-manager.js** - Update directory constants:
   - `figmaDockerDir` → `vibeDockerDir`
   - All references to `.figma-docker` → `.vibe-docker`

8. **src/lib/template-cache.js** - Update cache paths

##### New Files to Create
9. **src/lib/tool-detector.js** - Detect source vibe-coding tool
10. **src/lib/framework-detector.js** - Enhanced framework detection
11. **src/lib/database-detector.js** - Detect database requirements
12. **src/lib/backend-detector.js** - Detect backend framework

##### Template Files (36 files)
All template files in:
- `templates/basic/` - Update Figma references
- `templates/ui-heavy/` - Update Figma references
- Add new templates for other stacks

##### Test Files (47 files)
Update all test files to use new naming:
- Replace `figma-docker` with `vibe-docker`
- Update test fixtures and mocks
- Add new tests for tool detection

##### Documentation Files (14 files)
- `docs/` - All documentation files
- `CHANGELOG.md` - Document migration
- `DEPLOYMENT_COMPLETE.md` - Update deployment instructions

### Phase 4: Testing & Validation (2-3 days)

#### Test Coverage Expansion
- [ ] Add tests for Lovable project detection
- [ ] Add tests for V0 project detection
- [ ] Add tests for Bolt project detection
- [ ] Add tests for fullstack template
- [ ] Add tests for database integration
- [ ] Ensure 100% backward compatibility with Figma Make

#### Integration Testing
- [ ] Test with real Figma Make project
- [ ] Test with Lovable export
- [ ] Test with V0 components
- [ ] Test with Bolt project
- [ ] Test fullstack scenarios
- [ ] Test database configurations

### Phase 5: Documentation & Release (1-2 days)

#### Documentation Updates
- [ ] Complete README rewrite
- [ ] Add migration guide from figma-docker-init
- [ ] Create tool-specific guides:
  - Figma Make → Docker guide
  - Lovable → Docker guide
  - V0 → Docker guide
  - Bolt → Docker guide
- [ ] Update API documentation
- [ ] Create example projects for each tool

#### Release Strategy
- [ ] Publish as new package: `vibe-to-docker@1.0.0`
- [ ] Keep `figma-docker-init` active with deprecation notice
- [ ] Add forwarding: `figma-docker-init` can install `vibe-to-docker`
- [ ] Update NPM keywords for discoverability

## Implementation Details

### Tool Detection Algorithm

```javascript
// Proposed detection logic
async function detectSourceTool(projectRoot) {
  const packageJson = await readPackageJson(projectRoot);
  const fileStructure = await analyzeFileStructure(projectRoot);

  // Check for tool-specific signatures
  const signatures = {
    'figma-make': {
      patterns: ['Figma', 'figma-plugin', 'design-tokens'],
      files: ['.figmarc', 'figma.config.js']
    },
    'lovable': {
      patterns: ['gpt-engineer', 'lovable'],
      files: ['.lovable', '.gpt-engineer']
    },
    'v0': {
      patterns: ['@vercel/ai', 'v0-'],
      files: ['v0.config.js', '.v0']
    },
    'bolt': {
      patterns: ['@stackblitz', 'webcontainer'],
      files: ['.bolt', 'bolt.config.js']
    }
  };

  for (const [tool, signature] of Object.entries(signatures)) {
    if (matchesSignature(packageJson, fileStructure, signature)) {
      return tool;
    }
  }

  return 'unknown';
}
```

### Database Detection

```javascript
async function detectDatabase(projectRoot) {
  const indicators = {
    supabase: ['@supabase/supabase-js', 'supabase/'],
    postgresql: ['pg', 'postgres', 'postgresql://'],
    mongodb: ['mongodb', 'mongoose'],
    sqlite: ['better-sqlite3', 'sqlite3'],
    mysql: ['mysql', 'mysql2']
  };

  // Check package.json dependencies
  // Check for config files
  // Check for schema files
  // Return detected database(s)
}
```

### Backend Detection

```javascript
async function detectBackend(projectRoot) {
  const frameworks = {
    express: 'express',
    fastify: 'fastify',
    hono: '@hono/hono',
    nestjs: '@nestjs/core',
    nextjs: 'next', // API routes
    none: null
  };

  // Check package.json
  // Check for server directories
  // Check for API routes
  // Return backend framework
}
```

## Breaking Changes & Migration

### For Existing Users

#### Option 1: Alias Support (Recommended)
```bash
# Old command still works via alias
npx figma-docker-init basic

# New command
npx vibe-to-docker basic --tool=figma-make
```

#### Option 2: Migration Tool
```bash
# Migrate existing .figma-docker to .vibe-docker
npx vibe-to-docker migrate

# This will:
# 1. Rename .figma-docker to .vibe-docker
# 2. Update config.json with tool metadata
# 3. Update docker-compose.yml references
# 4. Preserve all customizations
```

### Backward Compatibility Strategy

1. **Keep figma-docker-init alive**: Publish updates that redirect to vibe-to-docker
2. **Deprecation notice**: Show message but continue working
3. **Support both directory names**: Accept both `.figma-docker/` and `.vibe-docker/`
4. **12-month migration period**: Full support for old package

## Risk Assessment

### High Risk
- **Name change confusion**: Mitigate with clear documentation and deprecation notices
- **Breaking existing workflows**: Maintain backward compatibility for 12 months
- **Test coverage**: Requires extensive testing with multiple tools

### Medium Risk
- **Template complexity**: More templates = more maintenance
- **Detection accuracy**: False positives in tool detection
- **Performance**: More detection logic = slower startup

### Low Risk
- **Code refactoring**: Well-tested, isolated changes
- **Documentation**: Time-consuming but straightforward

## Timeline

### Estimated Timeline: 10-15 days

- **Phase 1** (Research): 1-2 days
- **Phase 2** (Refactoring): 3-5 days
- **Phase 3** (File Updates): 2-3 days
- **Phase 4** (Testing): 2-3 days
- **Phase 5** (Documentation): 1-2 days

### Milestones

1. **Day 3**: Core refactoring complete, basic functionality working
2. **Day 7**: All templates created, detection systems working
3. **Day 10**: Testing complete, documentation drafted
4. **Day 12**: Ready for beta release
5. **Day 15**: Public release v1.0.0

## File Change Summary

### Files to Rename/Move (5 core files)
- `figma-docker-init.js` → `vibe-to-docker.js`
- All internal `.figma-docker` references → `.vibe-docker`

### Files to Modify (98 files)
- 1 package.json
- 3 source files (path-resolver, directory-manager, template-cache)
- 47 test files
- 36 template files
- 11 documentation files

### Files to Create (15 new files)
- 4 detection modules (tool, framework, database, backend)
- 4 new templates (fullstack, nextjs, supabase, api-heavy)
- 4 tool-specific guides
- 1 migration script
- 1 migration guide
- 1 comparison doc

## Success Criteria

### Functional Requirements
✅ Detects source tool correctly (Figma Make, Lovable, V0, Bolt)
✅ Generates appropriate Docker configuration for each tool
✅ Supports fullstack projects with databases
✅ Maintains 100% backward compatibility with Figma Make
✅ All existing tests pass (573+ tests)
✅ New tests for each supported tool

### Quality Requirements
✅ Test coverage maintained at >95%
✅ Documentation complete and accurate
✅ Zero breaking changes for existing users
✅ Clear migration path documented

### Performance Requirements
✅ Detection completes in <500ms
✅ Template generation in <2s
✅ No regression in installation time

## Next Steps

### Immediate Actions Required

1. **User Approval**: Get confirmation to proceed with this plan
2. **Repository Decision**:
   - Clone and rename repository? OR
   - Rename in-place with redirects?
3. **NPM Package Name**: Verify `vibe-to-docker` is available
4. **Scope Clarification**: Which tools to support in v1.0.0?
   - Minimum: Figma Make + Lovable + V0 + Bolt
   - Nice-to-have: Cursor, Replit, Codeium, others

### Questions for User

1. **Repository Strategy**: Should we create a new repository or rename existing?
2. **Package Ownership**: Who will own the `vibe-to-docker` NPM package?
3. **Priority Tools**: Which vibe-coding tools are highest priority?
4. **Timeline**: Is 10-15 days acceptable or do you need faster/slower?
5. **Backward Compatibility**: 12 months support for old package acceptable?

## Conclusion

This migration will transform `figma-docker-init` from a Figma-specific tool into a universal Docker containerization solution for all vibe-coded projects. The plan ensures backward compatibility, comprehensive testing, and clear documentation while expanding capabilities to support the growing ecosystem of AI-assisted development tools.

The phased approach allows for incremental progress with validation at each step, minimizing risk while maximizing value to users across multiple platforms.

---

**Document Version**: 1.0
**Created**: November 12, 2025
**Author**: Claude (AI Assistant)
**Status**: Awaiting User Approval
