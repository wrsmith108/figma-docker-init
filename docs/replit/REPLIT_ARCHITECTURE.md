# Replit Integration - Architecture Design

**Version**: 1.0
**Date**: November 16, 2025
**Status**: Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Detection Algorithm](#detection-algorithm)
5. [Template Structure](#template-structure)
6. [Migration Strategy](#migration-strategy)
7. [Integration Points](#integration-points)
8. [Error Handling](#error-handling)
9. [Testing Strategy](#testing-strategy)

---

## Overview

### Goal

Add Replit project detection and Docker containerization support to vibe-to-docker, enabling seamless migration from Replit's cloud environment to local/production Docker deployments.

### Success Criteria

1. **Detection Accuracy**: ≥95% confidence for Replit projects
2. **Auto-Detection**: Works with `npx vibe-to-docker init --tool=auto`
3. **Template Coverage**: Supports Node.js/Express, Full-Stack, and Database projects
4. **Migration Success**: Exported Replit projects run in Docker without manual configuration
5. **Documentation**: Comprehensive guides for users migrating from Replit

### Scope

**In Scope:**
- Replit project detection via `.replit` and `replit.nix` files
- Docker templates for Node.js/Express with PostgreSQL
- Environment variable migration
- Database connection adaptation
- Port binding fixes
- Documentation and migration guides

**Out of Scope (Future Enhancements):**
- Python/Django Replit projects
- Replit Deployment integration
- Nix-to-Docker direct conversion
- Replit DB (key-value) migration tools

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     vibe-to-docker CLI                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Lovable    │    │     Bolt     │    │      V0      │     │
│  │   Detector   │    │   Detector   │    │   Detector   │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │    Figma     │    │   Replit     │◄── NEW COMPONENT  │     │
│  │   Detector   │    │   Detector   │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                             │                                  │
│                             ├─► Priority: 3 (after Figma)      │
│                             ├─► Confidence: .replit + .nix     │
│                             └─► Template: replit-node          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   Detector Chain (Parallel)                     │
│                                                                 │
│  Promise.all([                                                  │
│    lovable.detect(),                                            │
│    bolt.detect(),                                               │
│    v0.detect(),                                                 │
│    figma.detect(),                                              │
│    replit.detect()  ◄── NEW                                     │
│  ])                                                             │
│                                                                 │
│  → Find highest confidence → Return tool name                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     Template System                             │
│                                                                 │
│  templates/                                                     │
│  ├── lovable/                                                   │
│  ├── bolt/                                                      │
│  ├── v0/                                                        │
│  ├── figma-make/                                                │
│  └── replit/          ◄── NEW TEMPLATES                         │
│      ├── node-express/                                          │
│      │   ├── Dockerfile                                         │
│      │   ├── docker-compose.yml                                 │
│      │   ├── .dockerignore                                      │
│      │   ├── nginx.conf                                         │
│      │   └── .env.example                                       │
│      └── full-stack/  (Future)                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. ReplitDetector Class

**File**: `src/detectors/replit-detector.js`

**Responsibilities:**
- Detect `.replit` configuration file
- Detect `replit.nix` package file
- Check for `@replit/*` npm packages
- Analyze project structure (server/, src/)
- Calculate confidence score

**Interface:**

```javascript
export class ReplitDetector extends BaseDetector {
  constructor(projectRoot = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.priority = 3; // After Lovable (2), Bolt (2), V0 (2), Figma (1)
    this.tool = 'replit';
  }

  /**
   * Main detection method
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<DetectionResult>}
   */
  async detect(projectRoot = this.projectRoot): Promise<DetectionResult> {
    // Detection logic
  }

  /**
   * Check for .replit configuration file
   * @returns {Promise<boolean>}
   */
  async checkReplitConfig(): Promise<boolean> {}

  /**
   * Check for replit.nix file
   * @returns {Promise<boolean>}
   */
  async checkReplitNix(): Promise<boolean> {}

  /**
   * Check for Replit-specific npm packages
   * @returns {Promise<boolean>}
   */
  async checkReplitPackages(): Promise<boolean> {}

  /**
   * Analyze project structure
   * @returns {Promise<Object>}
   */
  async analyzeStructure(): Promise<Object> {}

  /**
   * Calculate confidence score
   * @returns {number} 0.0 - 1.0
   */
  calculateConfidence(): number {}
}
```

**Detection Algorithm:**

```javascript
async detect(projectRoot) {
  this.indicators = {
    strong: 0,
    medium: 0,
    weak: 0
  };
  this.findings = [];

  // PRIMARY: .replit file (40% confidence)
  if (await this.checkReplitConfig()) {
    this.indicators.strong += 4;
    this.findings.push({
      type: 'strong',
      message: '.replit configuration file found (PRIMARY)',
      confidence: 0.40
    });
  }

  // PRIMARY: replit.nix file (40% confidence)
  if (await this.checkReplitNix()) {
    this.indicators.strong += 4;
    this.findings.push({
      type: 'strong',
      message: 'replit.nix package file found (PRIMARY)',
      confidence: 0.40
    });
  }

  // SECONDARY: @replit/* packages (10% confidence)
  const replitPackages = await this.checkReplitPackages();
  if (replitPackages.length > 0) {
    this.indicators.medium += 1;
    this.findings.push({
      type: 'medium',
      message: `Replit packages found: ${replitPackages.join(', ')}`,
      confidence: 0.10
    });
  }

  // TERTIARY: .replit.d/ directory (5% confidence)
  if (await this.fileExists(path.join(projectRoot, '.replit.d'))) {
    this.indicators.weak += 1;
    this.findings.push({
      type: 'weak',
      message: '.replit.d/ internal directory found',
      confidence: 0.05
    });
  }

  // TERTIARY: tsx in devDependencies (5% confidence)
  const pkg = await this.readPackageJson(projectRoot);
  if (pkg?.devDependencies?.tsx) {
    this.indicators.weak += 1;
    this.findings.push({
      type: 'weak',
      message: 'tsx runtime detected (common in Replit)',
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
      backend: await this.detectBackend(pkg),
      database: await this.detectDatabase(pkg),
      language: 'typescript'
    }
  };
}
```

**Confidence Calculation:**

```javascript
calculateConfidence() {
  // Weighted scoring:
  // Strong indicators: 0.10 each
  // Medium indicators: 0.05 each
  // Weak indicators: 0.01 each

  const strongScore = this.indicators.strong * 0.10;
  const mediumScore = this.indicators.medium * 0.05;
  const weakScore = this.indicators.weak * 0.01;

  return Math.min(strongScore + mediumScore + weakScore, 1.0);
}
```

### 2. Template Structure

**Directory**: `templates/replit/`

```
templates/replit/
├── node-express/           # Node.js + Express template
│   ├── Dockerfile          # Multi-stage production build
│   ├── docker-compose.yml  # App + PostgreSQL
│   ├── .dockerignore       # Build optimization
│   ├── nginx.conf          # Production reverse proxy
│   └── .env.example        # Environment template
└── README.md               # Migration guide
```

**Template: Dockerfile**

```dockerfile
# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============================================================================
# STAGE 2: Production
# ============================================================================
FROM node:20-alpine

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy static assets (if any)
COPY --from=builder /app/public ./public

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/index.js"]
```

**Template: docker-compose.yml**

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
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-mydb}
      - PORT=5000
    depends_on:
      db:
        condition: service_healthy
    networks:
      - replit-network
    volumes:
      - ./logs:/app/logs

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

**Template: .env.example**

```bash
# ============================================================================
# Replit to Docker Migration - Environment Variables
# ============================================================================

# Application
NODE_ENV=production
PORT=5000

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@db:5432/mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=mydb
POSTGRES_PORT=5432

# Replit Migration Notes:
# - REPL_ID, REPL_OWNER, REPL_SLUG are Replit-specific (not needed)
# - Replace @replit/database with standard PostgreSQL
# - Update port binding from 0.0.0.0 to localhost in server code
```

---

## Detection Algorithm

### Confidence Scoring System

| Indicator | Confidence | Weight |
|-----------|------------|--------|
| `.replit` file exists | 40% | Strong |
| `replit.nix` file exists | 40% | Strong |
| `@replit/database` in deps | 10% | Medium |
| `@replit/auth` in deps | 5% | Medium |
| `.replit.d/` directory | 5% | Weak |
| `tsx` in devDependencies | 5% | Weak |
| Port 5000 default | 3% | Weak |

**Minimum Confidence for Detection: 50%**

**Typical Scenarios:**

1. **Complete Replit Export** (95% confidence)
   - ✅ `.replit` file (40%)
   - ✅ `replit.nix` file (40%)
   - ✅ `@replit/database` (10%)
   - ✅ `.replit.d/` directory (5%)
   - **Total: 95%**

2. **Minimal Replit Export** (80% confidence)
   - ✅ `.replit` file (40%)
   - ✅ `replit.nix` file (40%)
   - **Total: 80%**

3. **Partial Replit Export** (50% confidence)
   - ✅ `.replit` file (40%)
   - ✅ `tsx` in devDependencies (5%)
   - ✅ Port 5000 default (3%)
   - ✅ `@replit/database` removed but structure matches (2%)
   - **Total: 50%**

---

## Migration Strategy

### Code Transformations

**1. Database Connection**

```typescript
// BEFORE (Replit)
import Database from "@replit/database";
const db = new Database();

await db.set("user:1", { name: "John" });
const user = await db.get("user:1");

// AFTER (Docker + PostgreSQL)
import pg from 'pg';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

await pool.query(
  'INSERT INTO users (id, data) VALUES ($1, $2)',
  [1, JSON.stringify({ name: "John" })]
);
const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
const user = result.rows[0].data;
```

**2. Port Binding**

```typescript
// BEFORE (Replit)
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// AFTER (Docker)
const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => {  // Remove '0.0.0.0'
  console.log(`Server running on port ${PORT}`);
});
```

**3. Environment Variables**

```typescript
// BEFORE (Replit)
const DATABASE_URL = process.env.DATABASE_URL;  // Provided by Replit
const REPL_ID = process.env.REPL_ID;  // Replit-specific

// AFTER (Docker)
import dotenv from 'dotenv';
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;  // From .env file
// Remove REPL_ID usage
```

---

## Integration Points

### 1. CLI Integration

**File**: `vibe-to-docker.js`

```javascript
// Add Replit detector to autoDetectToolType()
import { ReplitDetector } from './src/detectors/replit-detector.js';

async function autoDetectToolType(projectDir) {
  const detectors = [
    new LovableDetector(validatedProjectDir),
    new BoltDetector(validatedProjectDir),
    new V0Detector(validatedProjectDir),
    new FigmaDetector(validatedProjectDir),
    new ReplitDetector(validatedProjectDir)  // ← ADD THIS
  ];

  const results = await Promise.all(
    detectors.map(detector => detector.detect())
  );

  // Find highest confidence
  let bestResult = results[0];
  for (let i = 1; i < results.length; i++) {
    if (results[i].confidence > bestResult.confidence) {
      bestResult = results[i];
    }
  }

  return bestResult;
}
```

### 2. Template Selection

```javascript
async function initializeDockerSetup(toolName, projectDir, options) {
  let detection = null;

  if (toolName === 'auto') {
    detection = await autoDetectToolType(projectDir);
    toolName = detection.tool;
  }

  // Select template based on tool
  const templateMap = {
    'lovable': 'lovable',
    'bolt': 'bolt',
    'v0': 'v0',
    'figma-make': 'figma-make',
    'replit': 'replit/node-express'  // ← ADD THIS
  };

  const templatePath = templateMap[toolName];
  if (!templatePath) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  await copyTemplate(templatePath, projectDir);
}
```

---

## Error Handling

### Common Errors and Responses

**1. No Replit Files Found**

```javascript
if (confidence < 0.5) {
  return {
    tool: null,
    confidence,
    evidence: [
      'No .replit file found',
      'No replit.nix file found',
      'Project may not be from Replit'
    ],
    metadata: {
      suggestion: 'Try specifying tool explicitly: --tool=lovable, --tool=bolt, etc.'
    }
  };
}
```

**2. Partial Replit Export**

```javascript
if (hasReplitConfig && !hasReplitNix) {
  this.findings.push({
    type: 'warning',
    message: 'Found .replit but missing replit.nix - partial export detected'
  });
}
```

**3. Database Migration Required**

```javascript
if (hasReplitDatabase) {
  this.findings.push({
    type: 'info',
    message: '@replit/database detected - manual migration to PostgreSQL required',
    action: 'See migration guide: docs/REPLIT_MIGRATION.md'
  });
}
```

---

## Testing Strategy

### Unit Tests

**File**: `tests/replit-detector.test.js`

```javascript
describe('ReplitDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new ReplitDetector();
  });

  test('detects complete Replit project', async () => {
    const result = await detector.detect('./fixtures/replit-complete');
    expect(result.tool).toBe('replit');
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
  });

  test('detects .replit file', async () => {
    const hasConfig = await detector.checkReplitConfig('./fixtures/replit-minimal');
    expect(hasConfig).toBe(true);
  });

  test('detects replit.nix file', async () => {
    const hasNix = await detector.checkReplitNix('./fixtures/replit-minimal');
    expect(hasNix).toBe(true);
  });

  test('rejects non-Replit projects', async () => {
    const result = await detector.detect('./fixtures/react-app');
    expect(result.tool).toBeNull();
    expect(result.confidence).toBeLessThan(0.5);
  });

  test('detects Replit packages', async () => {
    const packages = await detector.checkReplitPackages('./fixtures/replit-db');
    expect(packages).toContain('@replit/database');
  });
});
```

### Integration Tests

**Test Scenarios:**

1. **Complete Workflow**
   - Export Replit project as ZIP
   - Run `npx vibe-to-docker init --tool=auto`
   - Verify detection confidence ≥ 80%
   - Verify Docker files created
   - Run `docker-compose up`
   - Verify application starts successfully

2. **Database Migration**
   - Start with Replit DB usage
   - Run migration script
   - Verify PostgreSQL connection works
   - Verify data migrated correctly

3. **Environment Variables**
   - Verify `.env.example` created
   - Verify all Replit env vars documented
   - Verify Docker Compose uses env vars

---

## Next Steps

1. **Implementation**
   - Create `ReplitDetector` class
   - Implement detection algorithm
   - Write unit tests

2. **Template Development**
   - Create `templates/replit/node-express/`
   - Add Dockerfile, docker-compose.yml
   - Add migration documentation

3. **CLI Integration**
   - Add Replit detector to autoDetectToolType()
   - Update template selection logic
   - Update help text and examples

4. **Documentation**
   - Create `REPLIT_MIGRATION.md` guide
   - Update main README with Replit examples
   - Add troubleshooting section

5. **Testing**
   - Create test fixtures
   - Write unit tests
   - Run integration tests
   - Test with real Replit project (3DModelViewer)

---

## Success Metrics

- **Detection Accuracy**: ≥95% for Replit projects
- **False Positives**: <5%
- **Migration Success Rate**: ≥90% (works without manual fixes)
- **User Satisfaction**: Positive feedback on migration ease
