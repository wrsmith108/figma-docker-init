# Replit Integration - Implementation Plan

**Version**: 1.0
**Date**: November 16, 2025
**Estimated Effort**: 12-16 hours
**Target Completion**: November 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Milestones](#milestones)
3. [Phase 1: Detection System](#phase-1-detection-system)
4. [Phase 2: Template Creation](#phase-2-template-creation)
5. [Phase 3: CLI Integration](#phase-3-cli-integration)
6. [Phase 4: Testing & Validation](#phase-4-testing--validation)
7. [Phase 5: Documentation](#phase-5-documentation)
8. [Dependencies](#dependencies)
9. [Risk Assessment](#risk-assessment)
10. [Rollout Strategy](#rollout-strategy)

---

## Overview

### Goals

1. **Primary**: Add Replit project detection with ≥95% accuracy
2. **Secondary**: Provide seamless Docker migration for Replit exports
3. **Tertiary**: Comprehensive documentation for Replit users

### Deliverables

- ✅ Replit detector class (`src/detectors/replit-detector.js`)
- ✅ Docker templates (`templates/replit/`)
- ✅ CLI integration (auto-detection)
- ✅ Unit and integration tests
- ✅ Migration documentation
- ✅ README updates

---

## Milestones

| # | Milestone | Effort | Status | Completion |
|---|-----------|--------|--------|------------|
| 1 | Detection System Complete | 4h | 🟡 In Progress | 0% |
| 2 | Templates Created | 3h | ⚪ Pending | 0% |
| 3 | CLI Integration | 2h | ⚪ Pending | 0% |
| 4 | Testing & Validation | 3h | ⚪ Pending | 0% |
| 5 | Documentation | 2h | ⚪ Pending | 0% |

**Total Estimated Effort**: 14 hours

---

## Phase 1: Detection System

**Goal**: Implement `ReplitDetector` class with 95% accuracy

**Effort**: 4 hours

### Tasks

#### Task 1.1: Create Base Detector (1h)

**File**: `src/detectors/replit-detector.js`

```javascript
import { BaseDetector } from './base-detector.js';
import fs from 'fs/promises';
import path from 'path';

export class ReplitDetector extends BaseDetector {
  constructor(projectRoot = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.priority = 3;
    this.tool = 'replit';
    this.indicators = { strong: 0, medium: 0, weak: 0 };
    this.findings = [];
  }

  async detect(projectRoot = this.projectRoot) {
    // Implementation
  }
}
```

**Acceptance Criteria:**
- ✅ Class extends `BaseDetector`
- ✅ Implements required interface
- ✅ Sets priority = 3
- ✅ Initializes indicators and findings

#### Task 1.2: Implement Detection Logic (2h)

**Methods to Implement:**

1. **checkReplitConfig()**
```javascript
async checkReplitConfig() {
  const configPath = path.join(this.projectRoot, '.replit');
  return await this.fileExists(configPath);
}
```

2. **checkReplitNix()**
```javascript
async checkReplitNix() {
  const nixPath = path.join(this.projectRoot, 'replit.nix');
  return await this.fileExists(nixPath);
}
```

3. **checkReplitPackages()**
```javascript
async checkReplitPackages() {
  const pkg = await this.readPackageJson(this.projectRoot);
  if (!pkg) return [];

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies
  };

  return Object.keys(deps).filter(dep => dep.startsWith('@replit/'));
}
```

4. **analyzeStructure()**
```javascript
async analyzeStructure() {
  const structure = {
    hasServer: await this.dirExists(path.join(this.projectRoot, 'server')),
    hasSrc: await this.dirExists(path.join(this.projectRoot, 'src')),
    hasClient: await this.dirExists(path.join(this.projectRoot, 'client')),
    hasPublic: await this.dirExists(path.join(this.projectRoot, 'public'))
  };

  return structure;
}
```

5. **calculateConfidence()**
```javascript
calculateConfidence() {
  const strongScore = this.indicators.strong * 0.10;
  const mediumScore = this.indicators.medium * 0.05;
  const weakScore = this.indicators.weak * 0.01;

  return Math.min(strongScore + mediumScore + weakScore, 1.0);
}
```

6. **Main detect() method**
```javascript
async detect(projectRoot = this.projectRoot) {
  this.projectRoot = projectRoot;
  this.indicators = { strong: 0, medium: 0, weak: 0 };
  this.findings = [];

  // PRIMARY: .replit file (40% confidence)
  if (await this.checkReplitConfig()) {
    this.indicators.strong += 4;
    this.findings.push({
      type: 'strong',
      message: '.replit configuration file found (PRIMARY SIGNATURE)',
      file: '.replit',
      confidence: 0.40
    });
  }

  // PRIMARY: replit.nix file (40% confidence)
  if (await this.checkReplitNix()) {
    this.indicators.strong += 4;
    this.findings.push({
      type: 'strong',
      message: 'replit.nix package file found (PRIMARY SIGNATURE)',
      file: 'replit.nix',
      confidence: 0.40
    });
  }

  // SECONDARY: @replit/* packages
  const replitPackages = await this.checkReplitPackages();
  if (replitPackages.length > 0) {
    this.indicators.medium += 2;
    this.findings.push({
      type: 'medium',
      message: `Replit packages found: ${replitPackages.join(', ')}`,
      file: 'package.json',
      confidence: 0.10
    });
  }

  // TERTIARY: .replit.d/ directory
  if (await this.dirExists(path.join(projectRoot, '.replit.d'))) {
    this.indicators.weak += 1;
    this.findings.push({
      type: 'weak',
      message: '.replit.d/ internal directory found',
      confidence: 0.05
    });
  }

  // TERTIARY: tsx in devDependencies
  const pkg = await this.readPackageJson(projectRoot);
  if (pkg?.devDependencies?.tsx) {
    this.indicators.weak += 1;
    this.findings.push({
      type: 'weak',
      message: 'tsx runtime detected (common in Replit Node.js projects)',
      file: 'package.json',
      confidence: 0.05
    });
  }

  const confidence = this.calculateConfidence();

  return {
    tool: confidence >= 0.5 ? 'replit' : null,
    confidence,
    evidence: this.findings.map(f => f.message),
    metadata: {
      framework: await this.detectFramework(pkg),
      backend: 'express',
      database: await this.detectDatabase(pkg),
      language: 'typescript',
      replitPackages
    },
    indicators: this.findings,
    score: {
      strong: this.indicators.strong,
      medium: this.indicators.medium,
      weak: this.indicators.weak
    }
  };
}
```

**Acceptance Criteria:**
- ✅ Detects `.replit` file (40% confidence)
- ✅ Detects `replit.nix` file (40% confidence)
- ✅ Detects `@replit/*` packages (10% confidence)
- ✅ Minimum 50% confidence threshold
- ✅ Returns metadata with framework/backend/database info

#### Task 1.3: Add Helper Methods (1h)

**Methods:**

```javascript
async detectFramework(pkg) {
  if (!pkg) return 'unknown';

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps.express) return 'express';
  if (deps.fastify) return 'fastify';
  if (deps.next) return 'next.js';
  if (deps.nuxt) return 'nuxt';
  if (deps.sveltekit || deps['@sveltejs/kit']) return 'sveltekit';

  return 'unknown';
}

async detectDatabase(pkg) {
  if (!pkg) return null;

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (deps['@replit/database']) return 'replit-db';
  if (deps.pg || deps.postgres) return 'postgresql';
  if (deps.mongodb || deps.mongoose) return 'mongodb';
  if (deps.mysql || deps.mysql2) return 'mysql';
  if (deps.sqlite3 || deps['better-sqlite3']) return 'sqlite';

  return null;
}
```

**Acceptance Criteria:**
- ✅ Correctly identifies Express, Fastify, Next.js, etc.
- ✅ Correctly identifies PostgreSQL, MongoDB, MySQL, etc.
- ✅ Returns 'unknown' / null for unrecognized patterns

---

## Phase 2: Template Creation

**Goal**: Create Docker templates for Replit Node.js/Express projects

**Effort**: 3 hours

### Tasks

#### Task 2.1: Create Template Directory (15min)

```bash
mkdir -p templates/replit/node-express
cd templates/replit/node-express
```

**Files to Create:**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `nginx.conf`
- `.env.example`
- `README.md`

#### Task 2.2: Create Dockerfile (1h)

**File**: `templates/replit/node-express/Dockerfile`

```dockerfile
# ============================================================================
# Replit to Docker Migration - Node.js + Express
# Multi-stage build for optimal image size and security
# ============================================================================

# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

LABEL maintainer="vibe-to-docker"
LABEL description="Replit Node.js/Express application (build stage)"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY . .

# Build TypeScript (if tsconfig.json exists)
RUN if [ -f "tsconfig.json" ]; then npm run build; fi

# ============================================================================
# STAGE 2: Production
# ============================================================================
FROM node:20-alpine

LABEL maintainer="vibe-to-docker"
LABEL description="Replit Node.js/Express application"
LABEL version="1.0.0"

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist 2>/dev/null || \
     COPY --from=builder /app/server ./server 2>/dev/null || \
     COPY --from=builder /app/src ./src

# Copy static assets (if any)
COPY --from=builder /app/public ./public 2>/dev/null || true

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port (Replit typically uses 5000)
EXPOSE 5000

# Health check endpoint (assumes /health route)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

**Acceptance Criteria:**
- ✅ Multi-stage build (builder + production)
- ✅ Non-root user (nodejs:nodejs)
- ✅ Production dependencies only
- ✅ Health check configured
- ✅ Port 5000 exposed
- ✅ Handles both TypeScript (dist/) and JavaScript (server/ or src/)

#### Task 2.3: Create docker-compose.yml (45min)

**File**: `templates/replit/node-express/docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: replit-app
    restart: unless-stopped
    ports:
      - "${PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-mydb}
      - PORT=5000
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    networks:
      - replit-network
    volumes:
      - ./logs:/app/logs:rw
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16-alpine
    container_name: replit-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}
      - POSTGRES_DB=${POSTGRES_DB:-mydb}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - replit-network

networks:
  replit-network:
    driver: bridge

volumes:
  postgres-data:
    driver: local
```

**Acceptance Criteria:**
- ✅ App service with health check
- ✅ PostgreSQL service with health check
- ✅ Environment variables from `.env`
- ✅ Persistent database volume
- ✅ Proper service dependencies
- ✅ Network isolation

#### Task 2.4: Create .dockerignore (15min)

**File**: `templates/replit/node-express/.dockerignore`

```
# Replit-specific files (not needed in Docker)
.replit
replit.nix
.replit.d/
.config/

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Build outputs
dist/
build/
.next/
out/

# Environment and secrets
.env
.env.local
.env.*.local

# Development
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore
.gitattributes

# CI/CD
.github/
.gitlab-ci.yml

# Documentation
README.md
docs/

# Docker
Dockerfile
docker-compose*.yml
.dockerignore
```

**Acceptance Criteria:**
- ✅ Excludes Replit-specific files
- ✅ Excludes node_modules
- ✅ Excludes .env files
- ✅ Optimizes Docker build cache

#### Task 2.5: Create .env.example (15min)

**File**: `templates/replit/node-express/.env.example`

```bash
# ============================================================================
# Replit to Docker Migration - Environment Variables
# ============================================================================
# Copy this file to .env and update with your values
# ============================================================================

# Application Settings
NODE_ENV=production
PORT=5000

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_in_production
POSTGRES_DB=mydb
POSTGRES_PORT=5432

# ============================================================================
# Replit Migration Notes
# ============================================================================
# The following Replit-specific environment variables are NOT needed:
# - REPL_ID (Replit project identifier)
# - REPL_OWNER (Replit username)
# - REPL_SLUG (Replit project slug)
#
# If your Replit project used @replit/database, you'll need to:
# 1. Migrate data from Replit DB to PostgreSQL
# 2. Update database queries to use PostgreSQL syntax
# 3. See docs/REPLIT_MIGRATION.md for detailed guide
# ============================================================================
```

**Acceptance Criteria:**
- ✅ Includes all required environment variables
- ✅ Documents Replit-specific variables (not needed)
- ✅ Provides migration guidance

#### Task 2.6: Create nginx.conf (30min)

**File**: `templates/replit/node-express/nginx.conf`

```nginx
# Nginx reverse proxy for Replit Node.js application

upstream app {
    server app:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Proxy to Node.js app
    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (if any)
    location /static {
        alias /app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://app/health;
        access_log off;
    }
}
```

**Acceptance Criteria:**
- ✅ Reverse proxy to app:5000
- ✅ Security headers configured
- ✅ WebSocket support (Upgrade headers)
- ✅ Static file serving
- ✅ Health check endpoint

---

## Phase 3: CLI Integration

**Goal**: Integrate Replit detector into auto-detection system

**Effort**: 2 hours

### Tasks

#### Task 3.1: Add Detector Import (5min)

**File**: `vibe-to-docker.js`

```javascript
// Phase 1: Tool Detection System
import LovableDetector from './src/detectors/lovable-detector.js';
import BoltDetector from './src/detectors/bolt-detector.js';
import { V0Detector } from './src/detectors/v0-detector.js';
import { FigmaDetector } from './src/detectors/figma-detector.js';
import { ReplitDetector } from './src/detectors/replit-detector.js'; // ← ADD THIS
```

#### Task 3.2: Add to Detector Array (10min)

**File**: `vibe-to-docker.js`

Update `autoDetectToolType()` function:

```javascript
async function autoDetectToolType(projectDir) {
  showProgress('DETECT', 0, 'Initializing tool detection...');

  const validatedProjectDir = validateProjectDirectory(projectDir);

  // Initialize all detectors
  const detectors = [
    new LovableDetector(validatedProjectDir),
    new BoltDetector(validatedProjectDir),
    new V0Detector(validatedProjectDir),
    new FigmaDetector(validatedProjectDir),
    new ReplitDetector(validatedProjectDir)  // ← ADD THIS
  ];

  showProgress('DETECT', 25, 'Scanning project files...');

  // Rest of function...
}
```

#### Task 3.3: Update Help Text (15min)

**File**: `vibe-to-docker.js`

Update help messages to include Replit:

```javascript
log(`Available tools: lovable, bolt, v0, figma-make, replit, auto\n`); // ← Add replit

// Add Replit example
log(`  ${colors.dim}# Replit project:${colors.reset}`);
log(`  ${colors.blue}npx vibe-to-docker init --tool=replit${colors.reset}\n`);
```

#### Task 3.4: Add Template Mapping (10min)

**File**: `vibe-to-docker.js`

Update template selection:

```javascript
const templateMap = {
  'lovable': 'lovable',
  'bolt': 'bolt',
  'v0': 'v0',
  'figma-make': 'figma-make',
  'replit': 'replit/node-express'  // ← ADD THIS
};
```

#### Task 3.5: Test Auto-Detection (1h)

**Manual Testing:**

1. Create test Replit project structure:
```bash
mkdir test-replit
cd test-replit
touch .replit replit.nix package.json
```

2. Run auto-detection:
```bash
npx vibe-to-docker init --tool=auto
```

3. Verify:
- ✅ Detection completes successfully
- ✅ Confidence ≥ 80%
- ✅ Tool detected as "replit"
- ✅ Correct template selected
- ✅ Docker files created in `.vibe-docker/`

---

## Phase 4: Testing & Validation

**Goal**: Ensure detector works correctly with comprehensive tests

**Effort**: 3 hours

### Tasks

#### Task 4.1: Create Test Fixtures (30min)

**Directory**: `tests/fixtures/`

Create test project structures:

1. **Complete Replit Project** (`tests/fixtures/replit-complete/`)
```
replit-complete/
├── .replit
├── replit.nix
├── server/
│   └── index.ts
├── package.json  (with @replit/database)
└── .replit.d/
```

2. **Minimal Replit Project** (`tests/fixtures/replit-minimal/`)
```
replit-minimal/
├── .replit
├── replit.nix
├── server/
│   └── index.js
└── package.json
```

3. **Partial Replit Project** (`tests/fixtures/replit-partial/`)
```
replit-partial/
├── .replit  (only .replit, no .nix)
├── server/
│   └── index.ts
└── package.json
```

4. **Non-Replit Project** (`tests/fixtures/react-app/`)
```
react-app/
├── src/
│   └── App.jsx
├── package.json  (React app)
└── vite.config.js
```

#### Task 4.2: Write Unit Tests (1.5h)

**File**: `tests/replit-detector.test.js`

```javascript
import { ReplitDetector } from '../src/detectors/replit-detector.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('ReplitDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new ReplitDetector();
  });

  describe('Complete Replit Project', () => {
    const projectPath = path.join(__dirname, 'fixtures/replit-complete');

    test('detects as replit with high confidence', async () => {
      const result = await detector.detect(projectPath);
      expect(result.tool).toBe('replit');
      expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    });

    test('finds .replit file', async () => {
      const hasConfig = await detector.checkReplitConfig();
      expect(hasConfig).toBe(true);
    });

    test('finds replit.nix file', async () => {
      const hasNix = await detector.checkReplitNix();
      expect(hasNix).toBe(true);
    });

    test('detects @replit/database package', async () => {
      const packages = await detector.checkReplitPackages();
      expect(packages).toContain('@replit/database');
    });

    test('provides correct metadata', async () => {
      const result = await detector.detect(projectPath);
      expect(result.metadata.backend).toBe('express');
      expect(result.metadata.database).toBe('replit-db');
      expect(result.metadata.language).toBe('typescript');
    });
  });

  describe('Minimal Replit Project', () => {
    const projectPath = path.join(__dirname, 'fixtures/replit-minimal');

    test('detects as replit with medium confidence', async () => {
      const result = await detector.detect(projectPath);
      expect(result.tool).toBe('replit');
      expect(result.confidence).toBeGreaterThanOrEqual(0.60);
    });

    test('confidence based on .replit + replit.nix only', async () => {
      const result = await detector.detect(projectPath);
      expect(result.confidence).toBeCloseTo(0.80, 1);
    });
  });

  describe('Partial Replit Project', () => {
    const projectPath = path.join(__dirname, 'fixtures/replit-partial');

    test('has lower confidence without replit.nix', async () => {
      const result = await detector.detect(projectPath);
      expect(result.confidence).toBeLessThan(0.60);
    });

    test('may not detect as replit', async () => {
      const result = await detector.detect(projectPath);
      // Could be null if confidence < 0.5
      expect([null, 'replit']).toContain(result.tool);
    });
  });

  describe('Non-Replit Project', () => {
    const projectPath = path.join(__dirname, 'fixtures/react-app');

    test('does not detect as replit', async () => {
      const result = await detector.detect(projectPath);
      expect(result.tool).toBeNull();
    });

    test('has low confidence', async () => {
      const result = await detector.detect(projectPath);
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('provides empty evidence', async () => {
      const result = await detector.detect(projectPath);
      expect(result.evidence).toHaveLength(0);
    });
  });

  describe('Helper Methods', () => {
    test('detectFramework identifies Express', async () => {
      const pkg = { dependencies: { express: '^4.18.0' } };
      const framework = await detector.detectFramework(pkg);
      expect(framework).toBe('express');
    });

    test('detectDatabase identifies PostgreSQL', async () => {
      const pkg = { dependencies: { pg: '^8.11.0' } };
      const database = await detector.detectDatabase(pkg);
      expect(database).toBe('postgresql');
    });

    test('detectDatabase identifies Replit DB', async () => {
      const pkg = { dependencies: { '@replit/database': '^2.1.0' } };
      const database = await detector.detectDatabase(pkg);
      expect(database).toBe('replit-db');
    });
  });

  describe('Confidence Calculation', () => {
    test('calculates correct confidence for strong indicators', () => {
      detector.indicators = { strong: 8, medium: 0, weak: 0 };
      const confidence = detector.calculateConfidence();
      expect(confidence).toBeCloseTo(0.80, 2);
    });

    test('caps confidence at 1.0', () => {
      detector.indicators = { strong: 20, medium: 10, weak: 10 };
      const confidence = detector.calculateConfidence();
      expect(confidence).toBe(1.0);
    });

    test('combines all indicator types', () => {
      detector.indicators = { strong: 4, medium: 2, weak: 5 };
      const confidence = detector.calculateConfidence();
      // (4 * 0.10) + (2 * 0.05) + (5 * 0.01) = 0.40 + 0.10 + 0.05 = 0.55
      expect(confidence).toBeCloseTo(0.55, 2);
    });
  });
});
```

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Coverage ≥ 80%
- ✅ Tests complete Replit projects (≥80% confidence)
- ✅ Tests minimal Replit projects (≥60% confidence)
- ✅ Rejects non-Replit projects (<50% confidence)

#### Task 4.3: Integration Testing (1h)

**Test with Real 3DModelViewer Project:**

1. Obtain 3DModelViewer project path from user
2. Run detection:
```bash
cd /path/to/3DModelViewer
npx vibe-to-docker init --tool=auto
```

3. Verify:
- ✅ Detection succeeds
- ✅ Confidence ≥ 70%
- ✅ Tool identified as "replit"
- ✅ Docker files created
- ✅ docker-compose up works

4. Test database migration:
- ✅ PostgreSQL container starts
- ✅ Application connects to database
- ✅ No port binding errors

**Acceptance Criteria:**
- ✅ Real-world Replit project detected correctly
- ✅ Docker containers start successfully
- ✅ Application runs without errors
- ✅ Database connection works

---

## Phase 5: Documentation

**Goal**: Provide comprehensive migration guides for users

**Effort**: 2 hours

### Tasks

#### Task 5.1: Create Migration Guide (1h)

**File**: `docs/REPLIT_MIGRATION.md`

**Contents:**
1. Overview of Replit to Docker migration
2. Prerequisites (Docker, Node.js)
3. Step-by-step migration process
4. Database migration (Replit DB → PostgreSQL)
5. Code changes required
6. Environment variable setup
7. Troubleshooting common issues
8. Next steps (deployment options)

#### Task 5.2: Update Main README (30min)

**File**: `README.md`

Add Replit section:

```markdown
### Supported Tools

- **Lovable** (formerly GPT Engineer) - React + Vite + Supabase
- **Bolt** (StackBlitz) - Multi-framework WebContainers
- **V0** (Vercel) - Next.js + Shadcn UI
- **Figma Make** - Figma to React export
- **Replit** - Node.js + Express + PostgreSQL ← NEW

### Replit Migration

Exported a Replit project? We've got you covered:

\`\`\`bash
# Automatic detection
npx vibe-to-docker init --tool=auto

# Or specify Replit explicitly
npx vibe-to-docker init --tool=replit
\`\`\`

**What gets migrated:**
- ✅ Node.js/Express application
- ✅ PostgreSQL database
- ✅ Environment variables
- ✅ TypeScript build configuration

**See**: [Replit Migration Guide](docs/REPLIT_MIGRATION.md)
```

#### Task 5.3: Create Quick Reference (30min)

**File**: `.claude-flow/docs/research/REPLIT_QUICK_REFERENCE.md`

**Contents:**
- Detection signatures
- Common file patterns
- Template selection guide
- Troubleshooting quick reference
- CLI command reference

---

## Dependencies

### External Dependencies

- **None** - Uses existing vibe-to-docker infrastructure

### Internal Dependencies

1. `BaseDetector` class (already exists)
2. Template system (already exists)
3. CLI auto-detection (already exists)

### Development Dependencies

```json
{
  "devDependencies": {
    "jest": "^30.2.0",  // Already in package.json
    "typescript": "^5.0.0"  // For type checking
  }
}
```

---

## Risk Assessment

### High Risk

**❌ Risk**: Detection fails for user's 3DModelViewer project
**Mitigation**: Test with actual project early; adjust confidence thresholds if needed

**❌ Risk**: Database migration too complex for automated approach
**Mitigation**: Provide manual migration guide; document common patterns

### Medium Risk

**⚠️ Risk**: Port binding errors on different operating systems
**Mitigation**: Test on macOS, Linux, Windows; document OS-specific fixes

**⚠️ Risk**: TypeScript build failures in Docker
**Mitigation**: Handle both `dist/` and `server/` output directories; provide build troubleshooting

### Low Risk

**✅ Risk**: Template not suitable for all Replit project types
**Mitigation**: Start with Node.js/Express; expand to other frameworks later

---

## Rollout Strategy

### Phase 1: Internal Testing (Week 1)

- ✅ Complete detector implementation
- ✅ Run unit tests
- ✅ Test with 3DModelViewer project

### Phase 2: Documentation (Week 1)

- ✅ Create migration guide
- ✅ Update README
- ✅ Create quick reference

### Phase 3: Release (Week 2)

- ✅ Merge to `feat/replit-support` branch
- ✅ Create pull request to `pack-master`
- ✅ Update CHANGELOG
- ✅ Tag release v4.3.0

### Phase 4: User Feedback (Ongoing)

- ✅ Monitor GitHub issues
- ✅ Collect user feedback
- ✅ Iterate on templates and detection

---

## Success Metrics

**Detection Performance:**
- ✅ Accuracy: ≥95% for Replit projects
- ✅ False Positives: <5%
- ✅ Response Time: <2 seconds

**Migration Success:**
- ✅ 3DModelViewer runs successfully
- ✅ No manual configuration required
- ✅ Database connects on first try

**User Experience:**
- ✅ Documentation rated helpful (positive feedback)
- ✅ No reported blockers in migration
- ✅ CI/CD passes all tests

---

## Next Steps

1. **Request 3DModelViewer path** from user for testing
2. **Start Phase 1**: Implement `ReplitDetector` class
3. **Test early** with real Replit project
4. **Iterate** based on test results
5. **Complete documentation** before release

---

## Tracking

- **GitHub Issue**: #[TBD]
- **Branch**: `feat/replit-support`
- **Milestone**: v4.3.0
- **Assignee**: Claude Code
- **Labels**: `feature`, `replit`, `detector`, `templates`
