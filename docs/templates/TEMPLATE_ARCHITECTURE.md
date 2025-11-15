# Template Architecture & Composition System
## Phase 2: Dynamic Docker Template Generation

**Version**: 1.0.0
**Date**: 2025-11-12
**Status**: Architecture Design
**Phase**: 2 of 6 (Migration to vibe-to-docker v1.0.0)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Template Structure Specification](#template-structure-specification)
4. [Composition System Design](#composition-system-design)
5. [Integration with Phase 1 Detectors](#integration-with-phase-1-detectors)
6. [API Specification](#api-specification)
7. [File Organization](#file-organization)
8. [Error Handling Strategy](#error-handling-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Security Considerations](#security-considerations)
11. [Testing Strategy](#testing-strategy)
12. [Migration Path](#migration-path)

---

## Executive Summary

### Purpose
Design a flexible, composable template system that dynamically generates Docker configurations based on Phase 1 detection results. The system must support 4 vibe-coding tools (Lovable, Bolt, V0, Figma Make) with arbitrary combinations of frameworks, databases, and backends.

### Key Design Goals
1. **Composability**: Mix and match tool templates with framework/database/backend fragments
2. **Conflict Resolution**: Intelligent merging when tool templates already include fragments
3. **Type Safety**: Full TypeScript support with comprehensive type definitions
4. **Performance**: Template composition <500ms per project
5. **Extensibility**: Easy addition of new tools, frameworks, databases

### Architecture Highlights
- **3-Layer Template System**: Base → Tool Templates → Fragments
- **Smart Composition Engine**: Priority-based merging with conflict detection
- **Environment Variable Management**: Centralized .env generation with validation
- **Cache Integration**: Leverage Phase 0 cache for template selection

---

## System Architecture Overview

### High-Level Architecture (C4 Context)

```
┌─────────────────────────────────────────────────────────────┐
│                    Vibe-to-Docker System                    │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │   Phase 1    │─────▶│   Phase 2    │─────▶│  Phase 3 │ │
│  │  Detectors   │      │  Templates   │      │Generator │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
│         │                      │                    │      │
│         │                      │                    │      │
│         ▼                      ▼                    ▼      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐ │
│  │ DetectorChain│      │TemplateComposer      │Dockerfile│ │
│  │   Results    │      │   + Fragments│      │Generator │ │
│  └──────────────┘      └──────────────┘      └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture (C4 Container)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Template Composition System                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    TemplateComposer (Core)                     │ │
│  │  - compose(config): Template                                   │ │
│  │  - validate(template): ValidationResult                        │ │
│  │  - preview(config): TemplatePreview                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│            │                    │                    │              │
│            ▼                    ▼                    ▼              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ TemplateLoader  │  │ FragmentMerger  │  │  EnvManager     │    │
│  │ - loadTool()    │  │ - merge()       │  │  - generate()   │    │
│  │ - loadFragment()│  │ - resolve()     │  │  - validate()   │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│            │                    │                    │              │
│            ▼                    ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Template File System Storage                   │   │
│  │  src/templates/                                             │   │
│  │    ├── tools/        (Lovable, Bolt, V0, Figma)           │   │
│  │    ├── fragments/    (Framework, Database, Backend)        │   │
│  │    └── base/         (Common base templates)               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌──────────────┐
│ User runs    │
│ vibe-docker  │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│ Phase 1: Detection  │
│ - Tool Detection    │
│ - Framework         │──────┐
│ - Database          │      │ DetectionResult
│ - Backend           │      │ {
└─────────────────────┘      │   tool: 'lovable',
       │                     │   metadata: {
       │                     │     framework: 'react',
       ▼                     │     database: 'supabase',
┌─────────────────────┐      │     backend: 'express'
│ Phase 2: Composition│◀─────┘   }
│                     │      }
│ TemplateComposer    │
│   .compose({        │
│     tool,           │
│     framework,      │
│     database,       │
│     backend         │
│   })                │
└─────────┬───────────┘
          │
          ▼
┌───────────────────────────────────────┐
│ Template Selection & Loading          │
│                                       │
│ 1. Load Tool Template                 │
│    └─▶ tools/lovable/                 │
│                                       │
│ 2. Load Fragments (if needed)         │
│    ├─▶ fragments/frameworks/react/   │
│    ├─▶ fragments/databases/supabase/ │
│    └─▶ fragments/backends/express/   │
└───────────────┬───────────────────────┘
                │
                ▼
┌────────────────────────────────────────┐
│ Fragment Merging & Conflict Resolution │
│                                        │
│ 1. Analyze tool template               │
│    - Check if framework included       │
│    - Check if database included        │
│    - Check if backend included         │
│                                        │
│ 2. Merge fragments                     │
│    - Priority: Tool > Fragment         │
│    - Conflict: Log warning, use tool   │
│    - Missing: Add fragment             │
│                                        │
│ 3. Variable substitution               │
│    - Replace {{PORT}}                  │
│    - Replace {{DB_NAME}}               │
│    - Replace {{FRAMEWORK}}             │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ Environment Variable Generation      │
│                                      │
│ EnvManager.generate({                │
│   tool: 'lovable',                   │
│   framework: 'react',                │
│   database: 'supabase',              │
│   backend: 'express'                 │
│ })                                   │
│                                      │
│ Output:                              │
│   - .env.example                     │
│   - .env.template                    │
│   - Variable validation rules        │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ Composed Template                    │
│                                      │
│ {                                    │
│   dockerfile: "...",                 │
│   dockerCompose: "...",              │
│   nginxConf: "...",                  │
│   envExample: "...",                 │
│   metadata: {...}                    │
│ }                                    │
└────────────────┬─────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────┐
│ Phase 3: File Generation             │
│ (Future phase - not in scope)        │
└──────────────────────────────────────┘
```

---

## Template Structure Specification

### 3-Layer Template Hierarchy

#### Layer 1: Base Templates (Foundation)
**Location**: `src/templates/base/`

Common templates shared across all tool types.

```
src/templates/base/
├── dockerfile.base.hbs        # Common Dockerfile directives
├── docker-compose.base.hbs    # Base compose structure
├── nginx.base.conf.hbs        # Base nginx configuration
├── env.base.hbs               # Common environment variables
└── metadata.json              # Base template metadata
```

**Base Dockerfile Structure**:
```dockerfile
# Templated sections marked with {{MERGE_POINT_*}}

# {{MERGE_POINT_FROM}} - Tool/framework sets base image
FROM node:18-alpine

# {{MERGE_POINT_WORKDIR}}
WORKDIR /app

# {{MERGE_POINT_SYSTEM_DEPS}} - System dependencies
RUN apk add --no-cache git

# {{MERGE_POINT_COPY_PACKAGE}} - Package files
COPY package*.json ./

# {{MERGE_POINT_INSTALL}} - Dependency installation
RUN npm install

# {{MERGE_POINT_COPY_SOURCE}} - Source code
COPY . .

# {{MERGE_POINT_BUILD}} - Build steps
RUN npm run build

# {{MERGE_POINT_EXPOSE}} - Port exposure
EXPOSE {{PORT}}

# {{MERGE_POINT_CMD}} - Start command
CMD ["npm", "start"]
```

**Merge Points**: Explicit placeholders where fragments inject content
**Variables**: `{{VAR}}` syntax for dynamic substitution

#### Layer 2: Tool Templates (Tool-Specific)
**Location**: `src/templates/tools/`

Complete templates optimized for each vibe-coding tool.

```
src/templates/tools/
├── lovable/
│   ├── dockerfile.hbs
│   ├── docker-compose.hbs
│   ├── nginx.conf.hbs
│   ├── env.template.hbs
│   ├── metadata.json
│   └── README.md
├── bolt/
│   ├── dockerfile.hbs
│   ├── docker-compose.hbs
│   ├── nginx.conf.hbs
│   ├── env.template.hbs
│   ├── metadata.json
│   └── README.md
├── v0/
│   ├── dockerfile.hbs
│   ├── docker-compose.hbs
│   ├── nginx.conf.hbs
│   ├── env.template.hbs
│   ├── metadata.json
│   └── README.md
└── figma-make/
    ├── dockerfile.hbs
    ├── docker-compose.hbs
    ├── nginx.conf.hbs
    ├── env.template.hbs
    ├── metadata.json
    └── README.md
```

**Tool Template Metadata** (`metadata.json`):
```json
{
  "tool": "lovable",
  "version": "1.0.0",
  "includes": {
    "framework": "react",
    "database": "supabase",
    "backend": null,
    "buildTool": "vite"
  },
  "defaults": {
    "port": 8080,
    "nodeVersion": "18",
    "buildCommand": "npm run build",
    "startCommand": "npm run preview"
  },
  "mergeStrategy": {
    "framework": "override",
    "database": "extend",
    "backend": "add"
  },
  "conflicts": {
    "framework": "warn-if-different",
    "database": "allow-multiple",
    "backend": "prefer-tool"
  }
}
```

**Example: Lovable Dockerfile Template**:
```dockerfile
# Lovable Project - React + Vite + TypeScript + Supabase
FROM node:18-alpine AS builder

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# {{MERGE_POINT_PRE_BUILD}} - Fragment injections before build

# Build application
RUN npm run build

# {{MERGE_POINT_POST_BUILD}} - Fragment injections after build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# {{MERGE_POINT_NGINX_EXTRAS}} - Additional nginx config

EXPOSE {{PORT}}

CMD ["nginx", "-g", "daemon off;"]
```

#### Layer 3: Fragment Templates (Composable Components)
**Location**: `src/templates/fragments/`

Reusable template components for frameworks, databases, backends.

```
src/templates/fragments/
├── frameworks/
│   ├── react/
│   │   ├── dockerfile.fragment.hbs
│   │   ├── docker-compose.fragment.hbs
│   │   ├── env.fragment.hbs
│   │   └── metadata.json
│   ├── vue/
│   ├── svelte/
│   ├── nextjs/
│   └── angular/
├── databases/
│   ├── supabase/
│   │   ├── docker-compose.fragment.hbs
│   │   ├── env.fragment.hbs
│   │   ├── init.sql
│   │   └── metadata.json
│   ├── postgresql/
│   ├── mongodb/
│   ├── mysql/
│   └── sqlite/
└── backends/
    ├── express/
    │   ├── dockerfile.fragment.hbs
    │   ├── docker-compose.fragment.hbs
    │   ├── env.fragment.hbs
    │   └── metadata.json
    ├── fastify/
    ├── nestjs/
    └── hono/
```

**Fragment Metadata** (`metadata.json`):
```json
{
  "type": "database",
  "name": "supabase",
  "version": "1.0.0",
  "priority": 10,
  "mergePoints": {
    "dockerfile": [],
    "dockerCompose": ["services", "volumes", "networks"],
    "env": ["SUPABASE_*"]
  },
  "dependencies": {
    "systemPackages": [],
    "npmPackages": ["@supabase/supabase-js"],
    "services": ["postgres", "supabase-studio"]
  },
  "conflicts": {
    "databases": ["firebase"],
    "services": []
  },
  "requirements": {
    "minNodeVersion": "16",
    "ports": [54321, 54322, 54323],
    "volumes": ["supabase_data"]
  }
}
```

**Example: Supabase Database Fragment**:
```yaml
# docker-compose.fragment.hbs
# This fragment adds Supabase services to docker-compose

# {{MERGE_INTO: services}}
supabase-db:
  image: supabase/postgres:15
  container_name: {{PROJECT_NAME}}_supabase_db
  environment:
    POSTGRES_PASSWORD: ${SUPABASE_DB_PASSWORD}
    POSTGRES_DB: ${SUPABASE_DB_NAME}
  volumes:
    - supabase_data:/var/lib/postgresql/data
  ports:
    - "${SUPABASE_DB_PORT:-54322}:5432"
  networks:
    - {{PROJECT_NAME}}_network

supabase-studio:
  image: supabase/studio:latest
  container_name: {{PROJECT_NAME}}_supabase_studio
  environment:
    SUPABASE_URL: http://supabase-kong:8000
    SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
  ports:
    - "${SUPABASE_STUDIO_PORT:-54323}:3000"
  networks:
    - {{PROJECT_NAME}}_network
  depends_on:
    - supabase-db

# {{MERGE_INTO: volumes}}
supabase_data:
  driver: local

# {{MERGE_INTO: networks}}
{{PROJECT_NAME}}_network:
  driver: bridge
```

**Example: Express Backend Fragment**:
```dockerfile
# dockerfile.fragment.hbs
# This fragment adds Express backend configuration

# {{MERGE_INTO: MERGE_POINT_SYSTEM_DEPS}}
# Express backend dependencies
RUN apk add --no-cache curl

# {{MERGE_INTO: MERGE_POINT_POST_BUILD}}
# Backend healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${BACKEND_PORT}/health || exit 1

# {{MERGE_INTO: MERGE_POINT_EXPOSE}}
EXPOSE ${BACKEND_PORT}

# {{MERGE_INTO: MERGE_POINT_CMD}}
# Start backend server
CMD ["node", "server/index.js"]
```

---

## Composition System Design

### Composition Algorithm (Pseudocode)

```javascript
/**
 * Template Composition Algorithm
 *
 * Input: DetectionResult from Phase 1
 * Output: ComposedTemplate ready for file generation
 */

function composeTemplate(detectionResult) {
  // Step 1: Initialize composition context
  const context = {
    tool: detectionResult.tool,
    framework: detectionResult.metadata.framework,
    database: detectionResult.metadata.database,
    backend: detectionResult.metadata.backend,
    variables: {},
    conflicts: [],
    warnings: []
  };

  // Step 2: Load tool template
  const toolTemplate = loadToolTemplate(context.tool);
  const toolMetadata = loadToolMetadata(context.tool);

  // Step 3: Determine required fragments
  const requiredFragments = determineRequiredFragments(
    toolMetadata,
    context
  );

  // Step 4: Load fragments
  const fragments = [];
  for (const fragmentSpec of requiredFragments) {
    const fragment = loadFragment(
      fragmentSpec.type,
      fragmentSpec.name
    );
    fragments.push({
      fragment,
      metadata: loadFragmentMetadata(fragmentSpec.type, fragmentSpec.name),
      spec: fragmentSpec
    });
  }

  // Step 5: Detect conflicts
  const conflicts = detectConflicts(toolMetadata, fragments);
  if (conflicts.length > 0) {
    context.conflicts = resolveConflicts(conflicts, toolMetadata);
  }

  // Step 6: Merge templates
  const mergedTemplate = mergeTemplates(
    toolTemplate,
    fragments,
    context
  );

  // Step 7: Variable substitution
  const variables = collectVariables(toolMetadata, fragments);
  const resolvedTemplate = substituteVariables(
    mergedTemplate,
    variables
  );

  // Step 8: Generate environment configuration
  const envConfig = generateEnvConfig(variables, context);

  // Step 9: Validate final template
  const validation = validateTemplate(resolvedTemplate, envConfig);
  if (!validation.valid) {
    throw new CompositionError(validation.errors);
  }

  // Step 10: Return composed template
  return {
    dockerfile: resolvedTemplate.dockerfile,
    dockerCompose: resolvedTemplate.dockerCompose,
    nginxConf: resolvedTemplate.nginxConf,
    envExample: envConfig.envExample,
    envTemplate: envConfig.envTemplate,
    metadata: {
      tool: context.tool,
      framework: context.framework,
      database: context.database,
      backend: context.backend,
      conflicts: context.conflicts,
      warnings: context.warnings
    }
  };
}

/**
 * Determine which fragments are needed
 */
function determineRequiredFragments(toolMetadata, context) {
  const required = [];

  // Check framework fragment
  if (context.framework) {
    if (toolMetadata.includes.framework !== context.framework) {
      // Tool template doesn't include this framework
      required.push({
        type: 'framework',
        name: context.framework,
        reason: 'detected-framework-differs-from-tool'
      });
    }
  }

  // Check database fragment
  if (context.database) {
    if (toolMetadata.includes.database !== context.database) {
      required.push({
        type: 'database',
        name: context.database,
        reason: 'additional-database-detected'
      });
    }
  }

  // Check backend fragment
  if (context.backend && context.backend !== 'none') {
    if (!toolMetadata.includes.backend) {
      required.push({
        type: 'backend',
        name: context.backend,
        reason: 'backend-detected-not-in-tool'
      });
    }
  }

  return required;
}

/**
 * Detect conflicts between tool and fragments
 */
function detectConflicts(toolMetadata, fragments) {
  const conflicts = [];

  for (const { fragment, metadata, spec } of fragments) {
    // Check if fragment conflicts with tool template
    if (toolMetadata.includes[spec.type] &&
        toolMetadata.includes[spec.type] !== spec.name) {
      conflicts.push({
        type: 'inclusion-mismatch',
        tool: toolMetadata.includes[spec.type],
        fragment: spec.name,
        category: spec.type,
        severity: toolMetadata.conflicts[spec.type] || 'warn'
      });
    }

    // Check fragment-to-fragment conflicts
    for (const otherFragment of fragments) {
      if (otherFragment === fragment) continue;

      if (metadata.conflicts[otherFragment.spec.type]?.includes(
        otherFragment.spec.name
      )) {
        conflicts.push({
          type: 'fragment-conflict',
          fragment1: spec.name,
          fragment2: otherFragment.spec.name,
          severity: 'error'
        });
      }
    }
  }

  return conflicts;
}

/**
 * Resolve conflicts based on merge strategy
 */
function resolveConflicts(conflicts, toolMetadata) {
  const resolutions = [];

  for (const conflict of conflicts) {
    const strategy = toolMetadata.mergeStrategy[conflict.category];

    switch (strategy) {
      case 'override':
        // Tool template wins, ignore fragment
        resolutions.push({
          conflict,
          resolution: 'use-tool-template',
          action: 'skip-fragment'
        });
        break;

      case 'extend':
        // Merge fragment into tool template
        resolutions.push({
          conflict,
          resolution: 'merge-fragment',
          action: 'extend-tool-template'
        });
        break;

      case 'add':
        // Add fragment alongside tool template
        resolutions.push({
          conflict,
          resolution: 'add-fragment',
          action: 'append-to-template'
        });
        break;

      default:
        // Error - unknown strategy
        resolutions.push({
          conflict,
          resolution: 'error',
          action: 'abort-composition'
        });
    }
  }

  return resolutions;
}

/**
 * Merge tool template with fragments
 */
function mergeTemplates(toolTemplate, fragments, context) {
  let merged = { ...toolTemplate };

  for (const { fragment, metadata, spec } of fragments) {
    // Find merge points in fragment
    const mergePoints = extractMergePoints(fragment);

    for (const mergePoint of mergePoints) {
      const targetPoint = mergePoint.target; // e.g., "MERGE_POINT_SYSTEM_DEPS"
      const content = mergePoint.content;

      if (merged.dockerfile.includes(`{{${targetPoint}}}`)) {
        // Replace merge point with fragment content
        merged.dockerfile = merged.dockerfile.replace(
          `{{${targetPoint}}}`,
          `{{${targetPoint}}}\n${content}`
        );
      } else {
        context.warnings.push({
          type: 'merge-point-not-found',
          mergePoint: targetPoint,
          fragment: spec.name
        });
      }
    }
  }

  return merged;
}

/**
 * Collect all template variables
 */
function collectVariables(toolMetadata, fragments) {
  const variables = {
    // Tool defaults
    ...toolMetadata.defaults,

    // Fragment variables
    ...fragments.reduce((vars, { metadata }) => ({
      ...vars,
      ...metadata.variables || {}
    }), {}),

    // Derived variables
    PROJECT_NAME: 'detected-from-package-json',
    NODE_VERSION: toolMetadata.defaults.nodeVersion
  };

  return variables;
}

/**
 * Substitute variables in template
 */
function substituteVariables(template, variables) {
  let result = { ...template };

  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

    result.dockerfile = result.dockerfile.replace(pattern, value);
    result.dockerCompose = result.dockerCompose.replace(pattern, value);
    result.nginxConf = result.nginxConf.replace(pattern, value);
  }

  return result;
}
```

### Conflict Resolution Strategy

#### Conflict Types

1. **Inclusion Mismatch**: Tool template includes framework A, but framework B detected
2. **Fragment Conflict**: Two fragments cannot coexist (e.g., Firebase + Supabase)
3. **Port Collision**: Multiple services want same port
4. **Volume Name Collision**: Fragments define same volume with different configs

#### Resolution Strategies

| Conflict Type | Strategy | Action | Example |
|---------------|----------|--------|---------|
| Inclusion Mismatch | `override` | Use tool template, skip fragment | Lovable includes React, skip React fragment |
| Inclusion Mismatch | `extend` | Merge fragment into tool | Tool has basic DB, add advanced DB features |
| Inclusion Mismatch | `add` | Add fragment alongside | Tool has frontend, add backend fragment |
| Fragment Conflict | `error` | Abort composition, require user input | Firebase + Supabase detected |
| Port Collision | `auto-increment` | Increment port number | Port 3000 → 3001 |
| Volume Collision | `merge` | Merge volume configs | Combine volume mount points |

#### Priority System

Template composition follows strict priority:

1. **Tool Template** (Highest priority)
2. **Framework Fragment**
3. **Database Fragment**
4. **Backend Fragment**
5. **Base Template** (Lowest priority)

---

## Integration with Phase 1 Detectors

### Detector Output → Template Input Mapping

```typescript
// Phase 1 Detector Output
interface DetectionResult {
  tool: 'lovable' | 'bolt' | 'v0' | 'figma-make' | null;
  confidence: number; // 0.0 - 1.0
  evidence: string[];
  metadata: {
    framework?: string;    // From FrameworkDetector
    database?: string;     // From DatabaseDetector
    backend?: string;      // From BackendDetector
    buildTool?: string;
    language?: string;
    styling?: string;
  };
}

// Phase 2 Template Composition Input
interface CompositionConfig {
  tool: string;                // detectionResult.tool
  framework: string;           // detectionResult.metadata.framework
  database: string | null;     // detectionResult.metadata.database
  backend: string | null;      // detectionResult.metadata.backend
  env?: Record<string, any>;   // User-provided overrides
  options?: CompositionOptions;
}

// Mapping function
function mapDetectionToComposition(
  detectionResult: DetectionResult
): CompositionConfig {
  return {
    tool: detectionResult.tool || 'unknown',
    framework: detectionResult.metadata.framework || 'unknown',
    database: detectionResult.metadata.database || null,
    backend: detectionResult.metadata.backend || null,
    env: {},
    options: {
      strict: detectionResult.confidence > 0.9,
      allowConflicts: detectionResult.confidence < 0.7,
      autoResolve: true
    }
  };
}
```

### Integration Flow

```
┌───────────────────────┐
│ User: vibe-docker init│
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│ DetectorChain.detect()│
│ ├─ LovableDetector    │
│ ├─ BoltDetector       │
│ ├─ V0Detector         │
│ └─ FigmaDetector      │
└──────────┬────────────┘
           │ DetectionResult
           │ { tool: 'lovable', confidence: 0.95, ... }
           ▼
┌───────────────────────┐
│ Parallel Auxiliary    │
│ Detection             │
│ ├─ FrameworkDetector  │─┐
│ ├─ DatabaseDetector   │─┤ Run in parallel
│ └─ BackendDetector    │─┘
└──────────┬────────────┘
           │ Enhanced DetectionResult
           │ { tool: 'lovable',
           │   metadata: {
           │     framework: 'react',
           │     database: 'supabase',
           │     backend: 'express'
           │   }
           │ }
           ▼
┌───────────────────────────┐
│ mapDetectionToComposition │
└──────────┬────────────────┘
           │ CompositionConfig
           ▼
┌───────────────────────────┐
│ TemplateComposer.compose()│
└──────────┬────────────────┘
           │ ComposedTemplate
           ▼
┌───────────────────────────┐
│ Phase 3: File Generation  │
│ (Future)                  │
└───────────────────────────┘
```

### Caching Integration

Leverage Phase 0 cache for template composition:

```typescript
class CachedTemplateComposer {
  constructor(private cache: TemplateCache) {}

  async compose(config: CompositionConfig): Promise<ComposedTemplate> {
    // Generate cache key from config
    const cacheKey = this.generateCacheKey(config);

    // Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached && !this.isStale(cached)) {
      return cached.template;
    }

    // Compose template
    const template = await this.composeUncached(config);

    // Cache result
    await this.cache.set(cacheKey, {
      template,
      timestamp: Date.now(),
      config
    });

    return template;
  }

  private generateCacheKey(config: CompositionConfig): string {
    return `template:${config.tool}:${config.framework}:${config.database}:${config.backend}`;
  }

  private isStale(cached: CachedTemplate): boolean {
    const age = Date.now() - cached.timestamp;
    const maxAge = 1000 * 60 * 60 * 24; // 24 hours
    return age > maxAge;
  }
}
```

---

## API Specification

### TypeScript Type Definitions

```typescript
// ============================================================================
// Core Types
// ============================================================================

/**
 * Tool types supported by vibe-to-docker
 */
type ToolType = 'lovable' | 'bolt' | 'v0' | 'figma-make';

/**
 * Fragment types for composition
 */
type FragmentType = 'framework' | 'database' | 'backend';

/**
 * Template file types
 */
type TemplateFileType =
  | 'dockerfile'
  | 'dockerCompose'
  | 'nginxConf'
  | 'envExample'
  | 'envTemplate';

/**
 * Merge strategies for conflict resolution
 */
type MergeStrategy = 'override' | 'extend' | 'add' | 'error';

/**
 * Conflict severity levels
 */
type ConflictSeverity = 'info' | 'warn' | 'error';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Template composition configuration
 */
interface CompositionConfig {
  /** Tool type detected in Phase 1 */
  tool: ToolType | 'unknown';

  /** Framework detected (react, vue, svelte, etc.) */
  framework: string;

  /** Database detected (supabase, postgresql, etc.) */
  database: string | null;

  /** Backend detected (express, fastify, etc.) */
  backend: string | null;

  /** User-provided environment variables */
  env?: Record<string, string | number | boolean>;

  /** Composition options */
  options?: CompositionOptions;
}

/**
 * Composition options
 */
interface CompositionOptions {
  /** Strict mode: fail on any conflict */
  strict?: boolean;

  /** Allow conflicts and auto-resolve */
  allowConflicts?: boolean;

  /** Automatically resolve conflicts */
  autoResolve?: boolean;

  /** Preview mode: don't write files */
  preview?: boolean;

  /** Cache composed templates */
  cache?: boolean;

  /** Validation level */
  validation?: 'none' | 'warn' | 'strict';
}

// ============================================================================
// Template Structure Types
// ============================================================================

/**
 * Tool template metadata
 */
interface ToolTemplateMetadata {
  /** Tool name */
  tool: ToolType;

  /** Template version */
  version: string;

  /** What this tool template includes by default */
  includes: {
    framework: string | null;
    database: string | null;
    backend: string | null;
    buildTool: string;
  };

  /** Default variable values */
  defaults: Record<string, string | number | boolean>;

  /** Merge strategy per fragment type */
  mergeStrategy: Record<FragmentType, MergeStrategy>;

  /** Conflict handling per fragment type */
  conflicts: Record<FragmentType, ConflictSeverity | 'allow-multiple'>;
}

/**
 * Fragment metadata
 */
interface FragmentMetadata {
  /** Fragment type */
  type: FragmentType;

  /** Fragment name */
  name: string;

  /** Version */
  version: string;

  /** Priority (higher = higher priority) */
  priority: number;

  /** Which merge points this fragment targets */
  mergePoints: {
    dockerfile: string[];
    dockerCompose: string[];
    env: string[];
  };

  /** Dependencies required by this fragment */
  dependencies: {
    systemPackages: string[];
    npmPackages: string[];
    services: string[];
  };

  /** Conflicts with other fragments */
  conflicts: {
    databases?: string[];
    backends?: string[];
    frameworks?: string[];
    services?: string[];
  };

  /** Requirements */
  requirements: {
    minNodeVersion: string;
    ports: number[];
    volumes: string[];
  };
}

/**
 * Template content structure
 */
interface TemplateContent {
  /** Dockerfile template content */
  dockerfile: string;

  /** docker-compose.yml template content */
  dockerCompose: string;

  /** nginx.conf template content */
  nginxConf: string;

  /** .env.example template content */
  envExample: string;

  /** .env template with descriptions */
  envTemplate: string;
}

// ============================================================================
// Composition Result Types
// ============================================================================

/**
 * Composed template ready for file generation
 */
interface ComposedTemplate extends TemplateContent {
  /** Template metadata */
  metadata: {
    tool: ToolType | 'unknown';
    framework: string;
    database: string | null;
    backend: string | null;
    conflicts: ConflictResolution[];
    warnings: TemplateWarning[];
    variables: Record<string, any>;
  };
}

/**
 * Conflict detected during composition
 */
interface ConflictDetection {
  /** Conflict type */
  type: 'inclusion-mismatch' | 'fragment-conflict' | 'port-collision' | 'volume-collision';

  /** Tool component involved */
  tool?: string;

  /** Fragment component involved */
  fragment?: string;

  /** Additional fragment (for fragment-fragment conflicts) */
  fragment2?: string;

  /** Category of conflict */
  category: FragmentType;

  /** Severity level */
  severity: ConflictSeverity;

  /** Human-readable description */
  description: string;
}

/**
 * Conflict resolution applied
 */
interface ConflictResolution extends ConflictDetection {
  /** Resolution strategy applied */
  resolution: 'use-tool-template' | 'merge-fragment' | 'add-fragment' | 'error';

  /** Action taken */
  action: string;

  /** Success status */
  success: boolean;
}

/**
 * Warning generated during composition
 */
interface TemplateWarning {
  /** Warning type */
  type: 'merge-point-not-found' | 'variable-not-found' | 'deprecated-feature' | 'performance';

  /** Component that generated warning */
  source: string;

  /** Warning message */
  message: string;

  /** Suggestion for resolution */
  suggestion?: string;
}

/**
 * Validation result
 */
interface ValidationResult {
  /** Overall validation status */
  valid: boolean;

  /** Validation errors (blocking) */
  errors: ValidationError[];

  /** Validation warnings (non-blocking) */
  warnings: ValidationWarning[];

  /** Validation info */
  info: ValidationInfo[];
}

interface ValidationError {
  code: string;
  message: string;
  file: TemplateFileType;
  line?: number;
  severity: 'error';
}

interface ValidationWarning {
  code: string;
  message: string;
  file: TemplateFileType;
  line?: number;
  severity: 'warn';
}

interface ValidationInfo {
  code: string;
  message: string;
  file: TemplateFileType;
  severity: 'info';
}

// ============================================================================
// API Classes
// ============================================================================

/**
 * Main template composition class
 */
class TemplateComposer {
  /**
   * Create a new template composer
   *
   * @param options Composer options
   */
  constructor(options?: {
    templatesDir?: string;
    cache?: TemplateCache;
    logger?: Logger;
  });

  /**
   * Compose template from detection results
   *
   * @param config Composition configuration
   * @returns Composed template
   * @throws CompositionError if composition fails
   */
  async compose(config: CompositionConfig): Promise<ComposedTemplate>;

  /**
   * Validate composed template
   *
   * @param template Template to validate
   * @returns Validation result
   */
  validate(template: ComposedTemplate): ValidationResult;

  /**
   * Preview composition without generating files
   *
   * @param config Composition configuration
   * @returns Preview of what would be generated
   */
  async preview(config: CompositionConfig): Promise<TemplatePreview>;

  /**
   * Get available tool templates
   *
   * @returns List of available tool templates
   */
  getAvailableTools(): ToolType[];

  /**
   * Get available fragments for a type
   *
   * @param type Fragment type
   * @returns List of available fragments
   */
  getAvailableFragments(type: FragmentType): string[];
}

/**
 * Template preview result
 */
interface TemplatePreview {
  /** Files that would be generated */
  files: {
    path: string;
    size: number;
    preview: string; // First 500 chars
  }[];

  /** Variables that would be substituted */
  variables: Record<string, any>;

  /** Conflicts that would be encountered */
  conflicts: ConflictDetection[];

  /** Warnings that would be generated */
  warnings: TemplateWarning[];

  /** Estimated composition time */
  estimatedTime: number; // milliseconds
}

/**
 * Environment variable manager
 */
class EnvManager {
  /**
   * Generate .env files from composition config
   *
   * @param variables Variables to include
   * @param config Composition config
   * @returns Environment configuration
   */
  generate(
    variables: Record<string, any>,
    config: CompositionConfig
  ): EnvConfig;

  /**
   * Validate environment variables
   *
   * @param env Environment variables
   * @param config Composition config
   * @returns Validation result
   */
  validate(
    env: Record<string, any>,
    config: CompositionConfig
  ): ValidationResult;

  /**
   * Merge environment variables from multiple sources
   *
   * @param sources Variable sources (tool, fragments, user)
   * @returns Merged variables with precedence
   */
  merge(...sources: Record<string, any>[]): Record<string, any>;
}

/**
 * Environment configuration
 */
interface EnvConfig {
  /** .env.example content */
  envExample: string;

  /** .env template with comments */
  envTemplate: string;

  /** Parsed variables */
  variables: EnvVariable[];

  /** Validation rules */
  validationRules: ValidationRule[];
}

interface EnvVariable {
  /** Variable name */
  name: string;

  /** Example value */
  example: string | number | boolean;

  /** Description */
  description: string;

  /** Required or optional */
  required: boolean;

  /** Default value */
  default?: string | number | boolean;

  /** Validation pattern */
  pattern?: string;
}

interface ValidationRule {
  variable: string;
  rule: 'required' | 'pattern' | 'range' | 'enum';
  value: any;
  message: string;
}

/**
 * Template loader
 */
class TemplateLoader {
  /**
   * Load tool template
   *
   * @param tool Tool type
   * @returns Template content and metadata
   */
  async loadTool(tool: ToolType): Promise<{
    content: TemplateContent;
    metadata: ToolTemplateMetadata;
  }>;

  /**
   * Load fragment template
   *
   * @param type Fragment type
   * @param name Fragment name
   * @returns Fragment content and metadata
   */
  async loadFragment(type: FragmentType, name: string): Promise<{
    content: Partial<TemplateContent>;
    metadata: FragmentMetadata;
  }>;

  /**
   * Check if tool template exists
   *
   * @param tool Tool type
   * @returns True if template exists
   */
  async hasTool(tool: ToolType): Promise<boolean>;

  /**
   * Check if fragment exists
   *
   * @param type Fragment type
   * @param name Fragment name
   * @returns True if fragment exists
   */
  async hasFragment(type: FragmentType, name: string): Promise<boolean>;
}

/**
 * Fragment merger - handles template merging logic
 */
class FragmentMerger {
  /**
   * Merge fragments into tool template
   *
   * @param toolTemplate Base tool template
   * @param fragments Fragments to merge
   * @param context Composition context
   * @returns Merged template
   */
  merge(
    toolTemplate: TemplateContent,
    fragments: LoadedFragment[],
    context: CompositionContext
  ): TemplateContent;

  /**
   * Resolve conflicts between templates
   *
   * @param conflicts Detected conflicts
   * @param strategy Merge strategy
   * @returns Conflict resolutions
   */
  resolve(
    conflicts: ConflictDetection[],
    strategy: MergeStrategy
  ): ConflictResolution[];

  /**
   * Extract merge points from template
   *
   * @param template Template content
   * @returns List of merge points found
   */
  extractMergePoints(template: string): MergePoint[];
}

interface LoadedFragment {
  content: Partial<TemplateContent>;
  metadata: FragmentMetadata;
  spec: FragmentSpec;
}

interface FragmentSpec {
  type: FragmentType;
  name: string;
  reason: string;
}

interface MergePoint {
  name: string;
  line: number;
  type: TemplateFileType;
}

interface CompositionContext {
  tool: ToolType | 'unknown';
  framework: string;
  database: string | null;
  backend: string | null;
  variables: Record<string, any>;
  conflicts: ConflictResolution[];
  warnings: TemplateWarning[];
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Composition error
 */
class CompositionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CompositionError';
  }
}

/**
 * Template not found error
 */
class TemplateNotFoundError extends CompositionError {
  constructor(tool: ToolType | FragmentType, name?: string) {
    super(
      `Template not found: ${tool}${name ? `/${name}` : ''}`,
      'TEMPLATE_NOT_FOUND',
      { tool, name }
    );
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Conflict error
 */
class ConflictError extends CompositionError {
  constructor(conflicts: ConflictDetection[]) {
    super(
      `Template composition failed due to ${conflicts.length} conflict(s)`,
      'COMPOSITION_CONFLICT',
      { conflicts }
    );
    this.name = 'ConflictError';
  }
}

/**
 * Validation error
 */
class TemplateValidationError extends CompositionError {
  constructor(errors: ValidationError[]) {
    super(
      `Template validation failed with ${errors.length} error(s)`,
      'VALIDATION_FAILED',
      { errors }
    );
    this.name = 'TemplateValidationError';
  }
}
```

### Usage Examples

#### Example 1: Basic Composition

```typescript
import { TemplateComposer } from './lib/template-composer.js';

// Initialize composer
const composer = new TemplateComposer({
  templatesDir: './src/templates',
  cache: new TemplateCache()
});

// Composition config from Phase 1 detection
const config: CompositionConfig = {
  tool: 'lovable',
  framework: 'react',
  database: 'supabase',
  backend: null,
  options: {
    autoResolve: true,
    cache: true
  }
};

// Compose template
const template = await composer.compose(config);

console.log('Composed template:', {
  tool: template.metadata.tool,
  conflicts: template.metadata.conflicts.length,
  warnings: template.metadata.warnings.length
});

// Validate
const validation = composer.validate(template);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

#### Example 2: Preview Mode

```typescript
// Preview without generating files
const preview = await composer.preview({
  tool: 'bolt',
  framework: 'vue',
  database: 'postgresql',
  backend: 'express',
  options: { preview: true }
});

console.log('Would generate files:');
preview.files.forEach(file => {
  console.log(`  - ${file.path} (${file.size} bytes)`);
  console.log(`    Preview: ${file.preview.substring(0, 100)}...`);
});

console.log('\nConflicts:', preview.conflicts);
console.log('Warnings:', preview.warnings);
console.log(`Estimated time: ${preview.estimatedTime}ms`);
```

#### Example 3: Environment Variable Management

```typescript
import { EnvManager } from './lib/env-manager.js';

const envManager = new EnvManager();

// Generate .env files
const envConfig = envManager.generate(
  {
    PORT: 8080,
    NODE_ENV: 'production',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'your-anon-key'
  },
  config
);

console.log('.env.example:');
console.log(envConfig.envExample);

// Validate environment
const validation = envManager.validate(
  process.env,
  config
);

if (!validation.valid) {
  console.error('Missing required variables:', validation.errors);
}
```

#### Example 4: Custom Fragment Merging

```typescript
import { FragmentMerger } from './lib/fragment-merger.js';

const merger = new FragmentMerger();

// Load templates
const toolTemplate = await loader.loadTool('v0');
const fragments = [
  await loader.loadFragment('database', 'mongodb'),
  await loader.loadFragment('backend', 'nestjs')
];

// Merge
const merged = merger.merge(
  toolTemplate.content,
  fragments,
  context
);

// Check merge points
const mergePoints = merger.extractMergePoints(merged.dockerfile);
console.log('Merge points found:', mergePoints);
```

---

## File Organization

### Directory Structure

```
vibe-to-docker/
├── src/
│   ├── templates/                    # Template storage
│   │   ├── base/                     # Base templates (Layer 1)
│   │   │   ├── dockerfile.base.hbs
│   │   │   ├── docker-compose.base.hbs
│   │   │   ├── nginx.base.conf.hbs
│   │   │   ├── env.base.hbs
│   │   │   └── metadata.json
│   │   │
│   │   ├── tools/                    # Tool templates (Layer 2)
│   │   │   ├── lovable/
│   │   │   │   ├── dockerfile.hbs
│   │   │   │   ├── docker-compose.hbs
│   │   │   │   ├── nginx.conf.hbs
│   │   │   │   ├── env.template.hbs
│   │   │   │   ├── metadata.json
│   │   │   │   └── README.md
│   │   │   ├── bolt/
│   │   │   ├── v0/
│   │   │   └── figma-make/
│   │   │
│   │   └── fragments/                # Fragment templates (Layer 3)
│   │       ├── frameworks/
│   │       │   ├── react/
│   │       │   │   ├── dockerfile.fragment.hbs
│   │       │   │   ├── docker-compose.fragment.hbs
│   │       │   │   ├── env.fragment.hbs
│   │       │   │   └── metadata.json
│   │       │   ├── vue/
│   │       │   ├── svelte/
│   │       │   ├── nextjs/
│   │       │   ├── nuxt/
│   │       │   └── angular/
│   │       │
│   │       ├── databases/
│   │       │   ├── supabase/
│   │       │   │   ├── docker-compose.fragment.hbs
│   │       │   │   ├── env.fragment.hbs
│   │       │   │   ├── init.sql
│   │       │   │   └── metadata.json
│   │       │   ├── postgresql/
│   │       │   ├── mongodb/
│   │       │   ├── mysql/
│   │       │   ├── sqlite/
│   │       │   └── firebase/
│   │       │
│   │       └── backends/
│   │           ├── express/
│   │           │   ├── dockerfile.fragment.hbs
│   │           │   ├── docker-compose.fragment.hbs
│   │           │   ├── env.fragment.hbs
│   │           │   └── metadata.json
│   │           ├── fastify/
│   │           ├── nestjs/
│   │           ├── hono/
│   │           └── koa/
│   │
│   ├── lib/                          # Template composition logic
│   │   ├── template-composer.js      # Main composition class
│   │   ├── template-loader.js        # Template loading
│   │   ├── fragment-merger.js        # Fragment merging
│   │   ├── env-manager.js            # Environment variable management
│   │   ├── conflict-resolver.js      # Conflict resolution
│   │   ├── variable-substitution.js  # Variable substitution
│   │   └── template-validator.js     # Template validation
│   │
│   ├── detectors/                    # Phase 1 detectors (existing)
│   │   ├── detector-chain.js
│   │   ├── lovable-detector.js
│   │   ├── bolt-detector.js
│   │   ├── v0-detector.js
│   │   ├── figma-detector.js
│   │   ├── framework-detector.js
│   │   ├── database-detector.js
│   │   └── backend-detector.js
│   │
│   └── core/                         # Core utilities
│       ├── cache.js
│       ├── logger.js
│       └── errors.js
│
├── tests/                            # Test files
│   ├── templates/
│   │   ├── template-composer.test.js
│   │   ├── fragment-merger.test.js
│   │   ├── env-manager.test.js
│   │   └── template-validator.test.js
│   │
│   └── integration/
│       ├── lovable-composition.test.js
│       ├── bolt-composition.test.js
│       ├── v0-composition.test.js
│       └── figma-composition.test.js
│
└── docs/                             # Documentation
    ├── TEMPLATE_ARCHITECTURE.md      # This document
    ├── TEMPLATE_GUIDE.md             # Template authoring guide
    └── FRAGMENT_SPEC.md              # Fragment specification
```

### Template File Naming Conventions

- **Base templates**: `{type}.base.hbs` (e.g., `dockerfile.base.hbs`)
- **Tool templates**: `{type}.hbs` (e.g., `dockerfile.hbs`)
- **Fragments**: `{type}.fragment.hbs` (e.g., `dockerfile.fragment.hbs`)
- **Metadata**: `metadata.json` (consistent across all)
- **Documentation**: `README.md` (per tool/fragment)

---

## Error Handling Strategy

### Error Categories

#### 1. Template Loading Errors
- **TemplateNotFoundError**: Template file doesn't exist
- **TemplateParseError**: Template syntax invalid
- **MetadataInvalidError**: metadata.json malformed

**Handling**:
```typescript
try {
  const template = await loader.loadTool('lovable');
} catch (error) {
  if (error instanceof TemplateNotFoundError) {
    // Fallback to generic template or abort
    logger.error(`Template not found: ${error.details.tool}`);
    throw new CompositionError(
      'Cannot compose template without tool template',
      'MISSING_TOOL_TEMPLATE'
    );
  }
}
```

#### 2. Composition Errors
- **ConflictError**: Unresolvable conflicts detected
- **MergePointNotFoundError**: Fragment targets non-existent merge point
- **CircularDependencyError**: Fragments have circular dependencies

**Handling**:
```typescript
try {
  const template = await composer.compose(config);
} catch (error) {
  if (error instanceof ConflictError) {
    // Log conflicts and provide resolution suggestions
    logger.error('Conflicts detected:', error.details.conflicts);

    // Suggest manual resolution
    console.log('\nSuggestions:');
    error.details.conflicts.forEach(conflict => {
      console.log(`  - ${conflict.description}`);
      console.log(`    Action: ${getSuggestion(conflict)}`);
    });
  }
}
```

#### 3. Validation Errors
- **TemplateValidationError**: Template doesn't meet validation rules
- **EnvValidationError**: Environment variables invalid
- **PortCollisionError**: Multiple services want same port

**Handling**:
```typescript
const validation = composer.validate(template);

if (!validation.valid) {
  // Separate blocking errors from warnings
  const blocking = validation.errors.filter(e => e.severity === 'error');
  const warnings = validation.errors.filter(e => e.severity === 'warn');

  if (blocking.length > 0) {
    throw new TemplateValidationError(blocking);
  }

  // Log warnings but continue
  warnings.forEach(warning => {
    logger.warn(`${warning.file}: ${warning.message}`);
  });
}
```

### Error Recovery Strategies

| Error Type | Recovery Strategy | Fallback |
|------------|------------------|----------|
| TemplateNotFoundError | Use generic template | Abort if critical |
| ConflictError | Auto-resolve or prompt user | Use tool template only |
| MergePointNotFoundError | Skip fragment, log warning | Continue without fragment |
| ValidationError | Fix and retry | Abort if unfixable |
| CircularDependencyError | Detect and break cycle | Abort composition |

### Logging Strategy

```typescript
class CompositionLogger {
  logConflict(conflict: ConflictDetection): void {
    const emoji = {
      'info': 'ℹ️',
      'warn': '⚠️',
      'error': '❌'
    }[conflict.severity];

    console.log(`${emoji} Conflict: ${conflict.description}`);
    console.log(`   Type: ${conflict.type}`);
    console.log(`   Tool: ${conflict.tool || 'N/A'}`);
    console.log(`   Fragment: ${conflict.fragment || 'N/A'}`);
  }

  logResolution(resolution: ConflictResolution): void {
    const emoji = resolution.success ? '✅' : '❌';
    console.log(`${emoji} Resolution: ${resolution.action}`);
  }

  logWarning(warning: TemplateWarning): void {
    console.warn(`⚠️  ${warning.message}`);
    if (warning.suggestion) {
      console.warn(`   💡 Suggestion: ${warning.suggestion}`);
    }
  }
}
```

---

## Performance Considerations

### Performance Targets

| Operation | Target | Rationale |
|-----------|--------|-----------|
| Template loading | <50ms | File I/O should be fast |
| Fragment merging | <100ms | Minimal string operations |
| Variable substitution | <50ms | Regex replacements |
| Validation | <100ms | Schema validation |
| **Total composition** | **<500ms** | User experience threshold |

### Optimization Strategies

#### 1. Template Caching

```typescript
class TemplateCache {
  private cache = new Map<string, CachedTemplate>();

  async get(key: string): Promise<CachedTemplate | null> {
    const cached = this.cache.get(key);

    if (!cached) return null;

    // Check if template files have been modified
    if (await this.isStale(cached)) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  async set(key: string, template: CachedTemplate): Promise<void> {
    this.cache.set(key, {
      ...template,
      timestamp: Date.now(),
      checksum: await this.calculateChecksum(template)
    });
  }
}
```

**Expected performance gain**: 80-96% (from Phase 0 experience)

#### 2. Lazy Fragment Loading

```typescript
class LazyFragmentLoader {
  private loadedFragments = new Map<string, LoadedFragment>();

  async loadFragment(
    type: FragmentType,
    name: string
  ): Promise<LoadedFragment> {
    const key = `${type}:${name}`;

    // Return cached if available
    if (this.loadedFragments.has(key)) {
      return this.loadedFragments.get(key)!;
    }

    // Load and cache
    const fragment = await this.loadFragmentUncached(type, name);
    this.loadedFragments.set(key, fragment);

    return fragment;
  }
}
```

**Expected performance gain**: 60-70% on subsequent compositions

#### 3. Parallel Fragment Loading

```typescript
async composeTemplate(config: CompositionConfig): Promise<ComposedTemplate> {
  // Load tool template and fragments in parallel
  const [toolTemplate, ...fragments] = await Promise.all([
    this.loader.loadTool(config.tool),
    config.framework ? this.loader.loadFragment('framework', config.framework) : null,
    config.database ? this.loader.loadFragment('database', config.database) : null,
    config.backend ? this.loader.loadFragment('backend', config.backend) : null
  ].filter(Boolean));

  // Continue with composition...
}
```

**Expected performance gain**: 2.8-4.4x (from Phase 1 parallel execution)

#### 4. String Builder Optimization

```typescript
class TemplateBuilder {
  private parts: string[] = [];

  append(content: string): void {
    this.parts.push(content);
  }

  build(): string {
    // More efficient than repeated concatenation
    return this.parts.join('');
  }
}
```

**Expected performance gain**: 40-50% for large templates

### Benchmarking

```typescript
// tests/performance/composition-benchmarks.test.js

describe('Template Composition Performance', () => {
  it('should compose Lovable template in <500ms', async () => {
    const start = Date.now();

    await composer.compose({
      tool: 'lovable',
      framework: 'react',
      database: 'supabase',
      backend: null
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should compose complex fullstack template in <500ms', async () => {
    const start = Date.now();

    await composer.compose({
      tool: 'bolt',
      framework: 'vue',
      database: 'postgresql',
      backend: 'nestjs'
    });

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should benefit from caching (>80% improvement)', async () => {
    const config = {
      tool: 'v0',
      framework: 'nextjs',
      database: null,
      backend: null
    };

    // First run (cold)
    const start1 = Date.now();
    await composer.compose(config);
    const cold = Date.now() - start1;

    // Second run (warm cache)
    const start2 = Date.now();
    await composer.compose(config);
    const warm = Date.now() - start2;

    const improvement = ((cold - warm) / cold) * 100;
    expect(improvement).toBeGreaterThan(80);
  });
});
```

---

## Security Considerations

### Template Injection Prevention

#### 1. Variable Sanitization

```typescript
class VariableSubstitution {
  sanitize(value: any): string {
    if (typeof value === 'string') {
      // Prevent template injection
      return value
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/`/g, '\\`');
    }

    return String(value);
  }

  substitute(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const sanitized = this.sanitize(value);
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, sanitized);
    }

    return result;
  }
}
```

#### 2. Path Traversal Prevention

```typescript
class TemplateLoader {
  private sanitizePath(path: string): string {
    // Prevent directory traversal
    const normalized = path.replace(/\.\./g, '');

    // Ensure path is within templates directory
    const resolved = resolve(this.templatesDir, normalized);
    if (!resolved.startsWith(this.templatesDir)) {
      throw new SecurityError('Path traversal attempt detected');
    }

    return resolved;
  }

  async loadTemplate(path: string): Promise<string> {
    const safePath = this.sanitizePath(path);
    return await fs.readFile(safePath, 'utf-8');
  }
}
```

#### 3. Environment Variable Validation

```typescript
class EnvValidator {
  private dangerousPatterns = [
    /rm\s+-rf/,
    /eval\(/,
    /exec\(/,
    /__proto__/,
    /constructor/
  ];

  validate(env: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [key, value] of Object.entries(env)) {
      // Check for dangerous patterns
      if (typeof value === 'string') {
        for (const pattern of this.dangerousPatterns) {
          if (pattern.test(value)) {
            errors.push({
              code: 'DANGEROUS_VALUE',
              message: `Potentially dangerous value in ${key}`,
              file: 'envExample',
              severity: 'error'
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      info: []
    };
  }
}
```

### Secret Management

```typescript
class SecretDetector {
  private secretPatterns = {
    'AWS_ACCESS_KEY': /AKIA[0-9A-Z]{16}/,
    'GITHUB_TOKEN': /ghp_[a-zA-Z0-9]{36}/,
    'PRIVATE_KEY': /-----BEGIN (RSA )?PRIVATE KEY-----/,
    'PASSWORD': /password\s*=\s*['"][^'"]{8,}['"]/i
  };

  detectSecrets(content: string): SecretDetection[] {
    const detected: SecretDetection[] = [];

    for (const [type, pattern] of Object.entries(this.secretPatterns)) {
      if (pattern.test(content)) {
        detected.push({
          type,
          severity: 'error',
          message: `Potential ${type} detected in template`,
          suggestion: 'Use environment variable instead'
        });
      }
    }

    return detected;
  }
}
```

---

## Testing Strategy

### Test Pyramid

```
         ┌─────────────┐
         │  E2E Tests  │  5% - Full composition workflows
         │   (10)      │
         └─────────────┘
       ┌─────────────────┐
       │ Integration Tests│  25% - Component integration
       │      (50)        │
       └─────────────────┘
   ┌─────────────────────────┐
   │    Unit Tests           │  70% - Individual functions
   │       (140)             │
   └─────────────────────────┘
```

**Total tests**: 200 (target for Phase 2)

### Unit Tests (140 tests)

#### TemplateComposer Tests (30 tests)
```typescript
describe('TemplateComposer', () => {
  describe('compose()', () => {
    it('should compose Lovable template with React', async () => {
      const result = await composer.compose({
        tool: 'lovable',
        framework: 'react',
        database: null,
        backend: null
      });

      expect(result.metadata.tool).toBe('lovable');
      expect(result.dockerfile).toContain('FROM node:18');
      expect(result.metadata.conflicts).toHaveLength(0);
    });

    it('should handle missing tool template gracefully', async () => {
      await expect(composer.compose({
        tool: 'nonexistent',
        framework: 'react',
        database: null,
        backend: null
      })).rejects.toThrow(TemplateNotFoundError);
    });

    // ... 28 more tests
  });
});
```

#### FragmentMerger Tests (25 tests)
```typescript
describe('FragmentMerger', () => {
  it('should merge database fragment into tool template', () => {
    const merged = merger.merge(
      toolTemplate,
      [databaseFragment],
      context
    );

    expect(merged.dockerCompose).toContain('supabase-db:');
  });

  it('should resolve conflicts with override strategy', () => {
    const resolutions = merger.resolve(conflicts, 'override');
    expect(resolutions[0].action).toBe('skip-fragment');
  });

  // ... 23 more tests
});
```

#### EnvManager Tests (20 tests)
#### TemplateLoader Tests (20 tests)
#### ConflictResolver Tests (15 tests)
#### VariableSubstitution Tests (15 tests)
#### TemplateValidator Tests (15 tests)

### Integration Tests (50 tests)

#### Lovable Composition Tests (12 tests)
```typescript
describe('Lovable Composition Integration', () => {
  it('should compose Lovable + React + Supabase', async () => {
    const result = await composer.compose({
      tool: 'lovable',
      framework: 'react',
      database: 'supabase',
      backend: null
    });

    // Verify Dockerfile
    expect(result.dockerfile).toContain('FROM node:18');
    expect(result.dockerfile).toContain('npm run build');

    // Verify docker-compose
    expect(result.dockerCompose).toContain('supabase-db:');

    // Verify environment
    expect(result.envExample).toContain('SUPABASE_URL');
  });
});
```

#### Bolt Composition Tests (12 tests)
#### V0 Composition Tests (12 tests)
#### Figma Composition Tests (12 tests)
#### Cache Integration Tests (2 tests)

### E2E Tests (10 tests)

```typescript
describe('End-to-End Template Composition', () => {
  it('should detect Lovable project and generate templates', async () => {
    // Setup test project
    const projectDir = await setupLovableProject();

    // Run detection
    const detectionResult = await detectorChain.detect(projectDir);
    expect(detectionResult.tool).toBe('lovable');

    // Run composition
    const template = await composer.compose({
      tool: detectionResult.tool,
      framework: detectionResult.metadata.framework,
      database: detectionResult.metadata.database,
      backend: detectionResult.metadata.backend
    });

    // Validate composition
    const validation = composer.validate(template);
    expect(validation.valid).toBe(true);

    // Verify files would be created
    expect(template.dockerfile).toBeDefined();
    expect(template.dockerCompose).toBeDefined();
    expect(template.nginxConf).toBeDefined();
  });
});
```

### Test Coverage Targets

| Component | Target Coverage | Rationale |
|-----------|----------------|-----------|
| TemplateComposer | 95% | Critical path |
| FragmentMerger | 90% | Complex logic |
| EnvManager | 85% | Business logic |
| TemplateLoader | 80% | I/O heavy |
| ConflictResolver | 90% | Complex logic |
| TemplateValidator | 85% | Validation rules |
| **Overall** | **90%** | High quality bar |

---

## Migration Path

### From Current State to Phase 2

#### Current State Assessment
- Phase 1: 7 detectors implemented (100% tests passing)
- Templates directory partially scaffolded
- No composition system yet

#### Migration Steps

**Step 1: Template Infrastructure** (Week 1, 15,000 tokens)
- [ ] Create base template structure
- [ ] Implement TemplateLoader class
- [ ] Write unit tests for TemplateLoader (20 tests)

**Step 2: Tool Templates** (Week 2, 20,000 tokens)
- [ ] Create Lovable tool template
- [ ] Create Bolt tool template
- [ ] Create V0 tool template
- [ ] Create Figma tool template
- [ ] Write tool template tests (40 tests)

**Step 3: Fragment System** (Week 3, 15,000 tokens)
- [ ] Create framework fragments (React, Vue, Svelte, Next.js)
- [ ] Create database fragments (Supabase, PostgreSQL, MongoDB)
- [ ] Create backend fragments (Express, Fastify, NestJS)
- [ ] Write fragment tests (30 tests)

**Step 4: Composition Engine** (Week 4, 15,000 tokens)
- [ ] Implement TemplateComposer class
- [ ] Implement FragmentMerger class
- [ ] Implement ConflictResolver class
- [ ] Write composition tests (50 tests)

**Step 5: Environment Management** (Week 5, 10,000 tokens)
- [ ] Implement EnvManager class
- [ ] Variable substitution system
- [ ] Environment validation
- [ ] Write env tests (30 tests)

**Step 6: Integration & Validation** (Week 6, 10,000 tokens)
- [ ] Integration with Phase 1 detectors
- [ ] E2E tests (10 tests)
- [ ] Performance benchmarks
- [ ] Documentation

**Total Estimate**: 85,000 tokens (within 75,000 + 10% buffer)

### Backwards Compatibility

Ensure Phase 1 detectors continue to work:

```typescript
// Compatibility layer
class Phase1Adapter {
  static toCompositionConfig(
    detectionResult: DetectionResult
  ): CompositionConfig {
    return {
      tool: detectionResult.tool || 'unknown',
      framework: detectionResult.metadata.framework || 'unknown',
      database: detectionResult.metadata.database || null,
      backend: detectionResult.metadata.backend || null
    };
  }
}
```

---

## Appendix

### A. Template Variables Reference

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `{{PORT}}` | Application port | `8080` | Tool metadata |
| `{{PROJECT_NAME}}` | Project name | `my-app` | package.json |
| `{{NODE_VERSION}}` | Node.js version | `18` | Tool metadata |
| `{{FRAMEWORK}}` | Framework name | `react` | Detection |
| `{{DATABASE}}` | Database type | `supabase` | Detection |
| `{{BACKEND}}` | Backend framework | `express` | Detection |
| `{{BUILD_COMMAND}}` | Build command | `npm run build` | Tool metadata |
| `{{START_COMMAND}}` | Start command | `npm start` | Tool metadata |

### B. Merge Points Reference

| Merge Point | Purpose | Used By |
|-------------|---------|---------|
| `MERGE_POINT_FROM` | Base image | Framework fragments |
| `MERGE_POINT_SYSTEM_DEPS` | System packages | Backend fragments |
| `MERGE_POINT_COPY_PACKAGE` | Package files | Tool templates |
| `MERGE_POINT_INSTALL` | Dependency install | Tool templates |
| `MERGE_POINT_PRE_BUILD` | Before build | Database fragments |
| `MERGE_POINT_BUILD` | Build step | Tool templates |
| `MERGE_POINT_POST_BUILD` | After build | Backend fragments |
| `MERGE_POINT_EXPOSE` | Port exposure | Backend fragments |
| `MERGE_POINT_CMD` | Start command | Tool templates |
| `MERGE_POINT_NGINX_EXTRAS` | Nginx config | Framework fragments |

### C. Glossary

- **Base Template**: Foundation template shared by all tools
- **Tool Template**: Complete template for a specific vibe-coding tool
- **Fragment**: Reusable template component (framework, database, backend)
- **Merge Point**: Explicit placeholder where fragments inject content
- **Composition**: Process of combining tool template with fragments
- **Conflict**: Situation where tool template and fragment overlap
- **Resolution**: Strategy for handling conflicts
- **Variable Substitution**: Replacing `{{VAR}}` with actual values

---

## Document Metadata

**Author**: System Architecture Designer
**Reviewers**: (TBD)
**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Status**: Draft → Review → Approved
**Next Review**: Before Phase 2 implementation

**Related Documents**:
- [Phase 1 Retrospective](/home/user/figma-docker-init/docs/retrospectives/PHASE_1_RETROSPECTIVE.md)
- [Migration Plan](/home/user/figma-docker-init/docs/VIBE_TO_DOCKER_MIGRATION_PLAN.md)
- [Detector Chain Specification](/home/user/figma-docker-init/src/detectors/detector-chain.js)

**Change Log**:
- 2025-11-12: Initial architecture design (v1.0.0)

---

**End of Document**
