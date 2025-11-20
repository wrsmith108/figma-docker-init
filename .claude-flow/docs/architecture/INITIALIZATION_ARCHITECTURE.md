# vibe-to-docker Initialization Architecture
## System Designer Deliverable

**Version**: 1.0.0
**Design Date**: 2025-11-19T22:58:00Z
**Agent**: System Designer
**Task**: Architecture design for init command enhancement

---

## Executive Summary

This document defines the initialization architecture for the vibe-to-docker project, focusing on improving the setup process, enhancing directory structure, and optimizing build/test workflows. The design follows the SPARC methodology and integrates with the existing swarm coordination system.

### Key Architectural Decisions

1. **Modular CLI Architecture**: Extract CLI logic from monolithic 1900-line file
2. **Enhanced Directory Structure**: Separate concerns (cli, core, lib, detectors, templates)
3. **Improved Build Pipeline**: Optimize for CI/CD and local development
4. **Test Organization**: Align with GitHub Actions matrix testing strategy
5. **Documentation Structure**: Comprehensive guides and ADRs

---

## 1. Directory Structure Enhancements

### Current State Analysis

```
figma-docker-init/
├── vibe-to-docker.js           # 1900+ lines - MONOLITHIC
├── src/
│   ├── core/                   # Only cache.js
│   ├── detectors/              # 11 files
│   ├── lib/                    # 13 files
│   └── templates/              # Fragment system
├── tests/                      # Mixed unit/e2e
├── docs/                       # 40+ files
└── Root clutter                # 20+ config files
```

**Issues**:
- CLI, orchestration, and business logic mixed in root file
- Test organization doesn't mirror src/ structure
- Documentation scattered across multiple directories
- No clear separation between public API and internal modules

### Recommended Architecture

```
figma-docker-init/
├── bin/
│   └── vibe-to-docker.js       # Thin CLI wrapper (< 50 lines)
│
├── src/
│   ├── cli/                    # CLI layer (NEW)
│   │   ├── index.js            # CLI entry point
│   │   ├── commands/           # Command handlers
│   │   │   ├── init.js         # Init command logic
│   │   │   ├── check-versions.js
│   │   │   ├── fix-versions.js
│   │   │   ├── uninstall.js
│   │   │   └── list.js
│   │   ├── parsers/
│   │   │   ├── flags.js        # Argument parsing
│   │   │   └── validators.js   # Input validation
│   │   └── ui/
│   │       ├── progress.js     # Progress indicators
│   │       ├── logger.js       # Console output
│   │       └── colors.js       # Terminal colors
│   │
│   ├── core/                   # Core orchestration (ENHANCED)
│   │   ├── orchestrator.js     # Main workflow coordinator
│   │   ├── cache.js            # Result caching (existing)
│   │   ├── lifecycle.js        # Initialization lifecycle
│   │   └── hooks.js            # Claude-Flow hook integration
│   │
│   ├── detectors/              # Tool detection (existing)
│   │   ├── base-detector.js
│   │   ├── figma-detector.js
│   │   ├── lovable-detector.js
│   │   ├── bolt-detector.js
│   │   ├── v0-detector.js
│   │   ├── replit-detector.js
│   │   └── cached-detector-chain.js
│   │
│   ├── lib/                    # Business logic (existing)
│   │   ├── template-composer.js
│   │   ├── env-manager.js
│   │   ├── template-validator.js
│   │   ├── config-generators.js
│   │   ├── package-fixer.js
│   │   ├── version-checker.js
│   │   ├── version-fixer.js
│   │   └── project.js
│   │
│   └── templates/              # Template system (existing)
│       ├── fragments/
│       └── tools/
│
├── tests/                      # Test suite (REORGANIZED)
│   ├── unit/
│   │   ├── cli/                # Mirror src/cli
│   │   ├── core/               # Mirror src/core
│   │   ├── detectors/          # Mirror src/detectors
│   │   ├── lib/                # Mirror src/lib
│   │   └── templates/          # Mirror src/templates
│   ├── e2e/
│   │   ├── init-workflows/     # Full init tests per tool
│   │   ├── version-fixes/      # Version checking E2E
│   │   └── cross-platform/     # OS compatibility
│   └── fixtures/
│       ├── figma-project/
│       ├── lovable-project/
│       ├── bolt-project/
│       ├── v0-project/
│       └── replit-project/
│
├── docs/                       # Documentation (STRUCTURED)
│   ├── adr/                    # Architecture Decision Records
│   │   ├── 001-detector-pattern.md
│   │   ├── 002-template-fragments.md
│   │   ├── 003-per-project-install.md
│   │   └── 004-ai-validation.md
│   ├── api/                    # API documentation
│   │   ├── cli-reference.md
│   │   ├── public-api.md
│   │   └── internal-api.md
│   ├── guides/                 # User guides
│   │   ├── QUICK_START.md
│   │   ├── MIGRATION_GUIDE.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── CONTRIBUTING.md
│   ├── architecture/           # Architecture docs
│   │   ├── ARCHITECTURE_DESIGN.md
│   │   ├── INITIALIZATION_ARCHITECTURE.md
│   │   └── COMPONENT_INTERACTIONS.md
│   └── archive/                # Historical docs
│
├── scripts/                    # Build/dev scripts (NEW)
│   ├── build.js                # Build orchestration
│   ├── test-runner.js          # Custom test runner
│   ├── ai-validate.js          # AI validation (existing)
│   └── release.js              # Release automation
│
└── config/                     # Configuration files (NEW)
    ├── jest.config.js          # Jest configuration
    ├── babel.config.js         # Babel configuration
    └── eslint.config.js        # ESLint rules
```

---

## 2. CLI Architecture Design

### Component Breakdown

#### 2.1 CLI Entry Point (`bin/vibe-to-docker.js`)

**Purpose**: Minimal wrapper that delegates to src/cli/index.js
**Size**: < 50 lines
**Responsibilities**:
- Set up Node.js environment
- Handle uncaught exceptions
- Delegate to CLI module

```javascript
#!/usr/bin/env node

import { run } from '../src/cli/index.js';
import { handleError } from '../src/cli/ui/logger.js';

process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

run(process.argv.slice(2)).catch(handleError);
```

#### 2.2 CLI Module (`src/cli/index.js`)

**Purpose**: Parse arguments and route to command handlers
**Dependencies**: commands/, parsers/
**Key Functions**:
- `run(args)` - Main entry point
- `parseArguments(args)` - Argument parsing
- `routeCommand(command, options)` - Command routing

#### 2.3 Command Handlers (`src/cli/commands/*.js`)

**Pattern**: Each command in separate file
**Interface**:
```javascript
export async function execute(options) {
  // Command logic
  // Returns: { success: boolean, message: string }
}

export const metadata = {
  name: 'init',
  description: 'Initialize Docker setup',
  flags: ['--tool', '--skip-version-check'],
  examples: [
    'npx vibe-to-docker init --tool=figma-make',
    'npx vibe-to-docker init --tool=auto'
  ]
};
```

**Commands to Extract**:
1. `init.js` - Initialize Docker setup (lines 1574-1633)
2. `check-versions.js` - Version compatibility checks (lines 1847-1858)
3. `fix-versions.js` - Auto-fix versions (lines 1841-1845)
4. `uninstall.js` - Remove .vibe-docker (lines 925-959)
5. `list.js` - List templates (lines 964-1023)

---

## 3. Core Orchestration Layer

### 3.1 Orchestrator Design (`src/core/orchestrator.js`)

**Purpose**: Coordinate initialization workflow
**Key Methods**:

```javascript
class Orchestrator {
  /**
   * Initialize Docker setup with tool-specific configuration
   */
  async initialize(tool, projectDir, options) {
    // 1. Pre-flight checks
    await this.runPreFlightChecks(projectDir);

    // 2. Tool detection (if auto)
    const detectedTool = tool === 'auto'
      ? await this.detectTool(projectDir)
      : tool;

    // 3. Project analysis
    const projectMetadata = await this.analyzeProject(projectDir);

    // 4. Template generation
    const templates = await this.generateTemplates(
      detectedTool,
      projectMetadata
    );

    // 5. File writing
    await this.writeFiles(templates, projectDir);

    // 6. Configuration fixes
    await this.applyConfigFixes(projectDir, detectedTool);

    // 7. Docker startup
    await this.startDockerServices(projectDir);

    // 8. Post-setup validation
    return await this.validateSetup(projectDir);
  }

  /**
   * Run pre-flight checks
   */
  async runPreFlightChecks(projectDir) {
    // Check Docker installed
    // Check package.json exists
    // Check version compatibility
    // Validate directory permissions
  }

  /**
   * Detect tool using detector chain
   */
  async detectTool(projectDir) {
    // Delegate to CachedDetectorChain
  }

  /**
   * Analyze project for metadata
   */
  async analyzeProject(projectDir) {
    // Package.json analysis
    // Build config detection
    // Environment variable scanning
    // Port assignment
  }

  /**
   * Generate templates
   */
  async generateTemplates(tool, metadata) {
    // Use TemplateComposer
    // Validate with TemplateValidator
  }
}
```

### 3.2 Lifecycle Hooks (`src/core/lifecycle.js`)

**Purpose**: Manage initialization lifecycle with Claude-Flow hooks
**Phases**:

```javascript
export class Lifecycle {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.hooks = new HookRegistry();
  }

  async execute(command, options) {
    // Pre-task hook
    await this.hooks.trigger('pre-task', {
      command,
      description: `Initialize ${options.tool} project`
    });

    // Main execution
    const result = await this.orchestrator.initialize(
      options.tool,
      options.projectDir,
      options
    );

    // Post-task hook
    await this.hooks.trigger('post-task', {
      taskId: command,
      success: result.success,
      metrics: result.metrics
    });

    return result;
  }
}
```

---

## 4. Build and Test Configuration

### 4.1 Build Pipeline

**Goals**:
- Fast incremental builds
- TypeScript type checking
- ESLint validation
- Dependency bundling

**Scripts** (package.json):
```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "build:clean": "rm -rf dist && npm run build",
    "build:watch": "node scripts/build.js --watch",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write 'src/**/*.js' 'tests/**/*.js'",
    "validate": "npm run typecheck && npm run lint && npm run test"
  }
}
```

**Build Script** (`scripts/build.js`):
```javascript
// 1. Clean dist/
// 2. Transpile ES modules
// 3. Copy templates/
// 4. Generate type definitions
// 5. Validate output
```

### 4.2 Test Organization

**Structure**:
```
tests/
├── unit/                       # Unit tests mirror src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── init.test.js
│   │   │   ├── check-versions.test.js
│   │   │   ├── fix-versions.test.js
│   │   │   └── uninstall.test.js
│   │   └── parsers/
│   │       └── flags.test.js
│   ├── core/
│   │   ├── orchestrator.test.js
│   │   ├── lifecycle.test.js
│   │   └── cache.test.js
│   ├── detectors/
│   │   ├── base-detector.test.js
│   │   ├── figma-detector.test.js
│   │   ├── lovable-detector.test.js
│   │   ├── bolt-detector.test.js
│   │   ├── v0-detector.test.js
│   │   └── replit-detector.test.js
│   ├── lib/
│   │   ├── template-composer.test.js
│   │   ├── env-manager.test.js
│   │   ├── template-validator.test.js
│   │   └── version-checker.test.js
│   └── templates/
│       ├── fragment-composer.test.js
│       └── fragment-merger.test.js
│
├── e2e/
│   ├── init-workflows/
│   │   ├── figma-make-init.test.js
│   │   ├── lovable-init.test.js
│   │   ├── bolt-init.test.js
│   │   ├── v0-init.test.js
│   │   └── auto-detect-init.test.js
│   ├── version-fixes/
│   │   ├── angular-version-fix.test.js
│   │   └── node-version-fix.test.js
│   └── cross-platform/
│       ├── windows-paths.test.js
│       ├── macos-permissions.test.js
│       └── linux-docker.test.js
│
└── fixtures/
    ├── figma-project/
    │   ├── package.json
    │   ├── vite.config.js
    │   └── src/main.jsx
    ├── lovable-project/
    ├── bolt-project/
    ├── v0-project/
    └── replit-project/
```

**Test Configuration** (config/jest.config.js):
```javascript
export default {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/e2e/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // CI-specific settings
  runInBand: process.env.CI === 'true',
  detectOpenHandles: true,
  forceExit: false
};
```

---

## 5. Configuration File Requirements

### 5.1 Core Configuration Files

#### package.json Enhancements

**Add**:
```json
{
  "exports": {
    ".": {
      "import": "./src/cli/index.js",
      "require": "./dist/cli/index.cjs"
    },
    "./orchestrator": "./src/core/orchestrator.js",
    "./detectors": "./src/detectors/index.js"
  },
  "files": [
    "bin/",
    "src/",
    "templates/",
    "README.md",
    "LICENSE"
  ]
}
```

#### TypeScript Configuration (tsconfig.json)

**Purpose**: Type checking for JSDoc comments
```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "moduleResolution": "node",
    "target": "ES2022",
    "module": "ES2022",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.js", "tests/**/*.js"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

#### ESLint Configuration (config/eslint.config.js)

**Rules**:
- ES module syntax
- Async/await best practices
- Security patterns (no hardcoded secrets)
- JSDoc validation

---

## 6. Documentation Structure

### 6.1 Required Documentation

#### Architecture Decision Records (docs/adr/)

**Template**:
```markdown
# ADR-NNN: [Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Date**: YYYY-MM-DD
**Deciders**: [Names]

## Context
[Background and problem statement]

## Decision
[Chosen solution with rationale]

## Consequences
**Positive**:
- [Benefit 1]
- [Benefit 2]

**Negative**:
- [Tradeoff 1]
- [Tradeoff 2]

## Alternatives Considered
1. [Alternative 1] - [Why rejected]
2. [Alternative 2] - [Why rejected]
```

**Required ADRs**:
1. ADR-001: Detector Pattern Design
2. ADR-002: Template Fragment System
3. ADR-003: Per-Project Installation
4. ADR-004: AI Validation Integration
5. ADR-005: CLI Modularization Strategy
6. ADR-006: Test Organization Pattern
7. ADR-007: Build Pipeline Architecture

#### API Documentation (docs/api/)

**Files**:
- `cli-reference.md` - Command-line interface
- `public-api.md` - Exported modules
- `internal-api.md` - Internal architecture

#### User Guides (docs/guides/)

**Required Guides**:
1. `QUICK_START.md` - 5-minute setup
2. `MIGRATION_GUIDE.md` - Upgrading from v5.0.x
3. `TROUBLESHOOTING.md` - Common issues
4. `CONTRIBUTING.md` - Development workflow

---

## 7. Migration Strategy

### Phase 1: CLI Extraction (Week 1)

**Tasks**:
1. Create `src/cli/` structure
2. Extract command handlers from vibe-to-docker.js
3. Create thin `bin/vibe-to-docker.js` wrapper
4. Update imports across tests
5. Validate CLI functionality

**Success Criteria**:
- vibe-to-docker.js < 100 lines
- All commands work identically
- 100% test pass rate
- Zero breaking changes

### Phase 2: Core Orchestration (Week 2)

**Tasks**:
1. Create `Orchestrator` class
2. Extract initialization logic
3. Implement lifecycle hooks
4. Add Claude-Flow integration
5. Update documentation

**Success Criteria**:
- Clear separation of concerns
- Testable orchestration layer
- Hook integration working
- Performance unchanged

### Phase 3: Test Reorganization (Week 3)

**Tasks**:
1. Mirror src/ structure in tests/
2. Create fixture projects
3. Add E2E workflows
4. Update CI/CD pipeline
5. Achieve 80%+ coverage

**Success Criteria**:
- Organized test suite
- 80%+ coverage
- < 10 minute CI duration
- Zero flaky tests

### Phase 4: Documentation (Week 4)

**Tasks**:
1. Write 7+ ADRs
2. Create API documentation
3. Write user guides
4. Migration guide
5. Developer onboarding

**Success Criteria**:
- Complete API docs
- User-friendly guides
- Tested migration path
- < 30 min onboarding

---

## 8. Integration Points

### 8.1 Claude-Flow Hooks

**Pre-Task Hook**:
```bash
npx claude-flow@alpha hooks pre-task \
  --description "Initialize Docker setup for [tool]"
```

**Post-Edit Hook**:
```bash
npx claude-flow@alpha hooks post-edit \
  --file "[file]" \
  --memory-key "swarm/[agent]/[step]"
```

**Session Management**:
```bash
npx claude-flow@alpha hooks session-end \
  --generate-summary true \
  --export-metrics true
```

### 8.2 AgentDB Memory Storage

**Architecture Decisions**:
```bash
npx agentdb@latest memory-store \
  --namespace "architecture/decisions" \
  --key "cli-modularization" \
  --value "{decision details}"
```

**ReflexION Episodes**:
```bash
npx agentdb@latest reflexion store \
  "init-architecture-$(date +%s)" \
  "Architecture design for initialization" \
  0.95 \
  true \
  "Comprehensive architecture with clear separation"
```

---

## 9. Quality Attributes

### 9.1 Performance Targets

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| CLI Startup | ~200ms | < 150ms | Time to first output |
| Detection | ~300ms | < 500ms | Parallel detector execution |
| Template Gen | ~800ms | < 1000ms | Fragment composition |
| Full Init | ~4500ms | < 5000ms | End-to-end workflow |

### 9.2 Maintainability Goals

- **Module Size**: < 300 lines per file
- **Function Complexity**: Cyclomatic complexity < 10
- **Test Coverage**: 80%+ (enforced)
- **Documentation**: 100% public API coverage
- **Type Safety**: 100% JSDoc coverage

### 9.3 Security Requirements

1. **Input Validation**: All CLI inputs sanitized
2. **Path Traversal**: Directory validation enforced
3. **Secret Detection**: Hardcoded API key warnings
4. **Template Safety**: Security validation on generation
5. **Dependency Security**: Zero high/critical vulnerabilities

---

## 10. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CLI extraction breaks imports | Medium | High | Incremental refactoring + test coverage |
| Performance regression | Low | Medium | Benchmark tests in CI |
| Backward compatibility issues | Low | High | Legacy mode maintained |
| Test flakiness increases | Medium | Medium | Parallel execution disabled in CI |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CI/CD failures during migration | Medium | High | Feature branch + gradual rollout |
| User adoption confusion | Low | Medium | Clear migration guide |
| Documentation incomplete | Low | High | Documentation-first approach |

---

## 11. Success Metrics

### Functional Metrics
- ✅ Modular CLI architecture (< 100 line entry point)
- ✅ Clear separation of concerns
- ✅ 80%+ test coverage maintained
- ✅ 100% CI success rate
- ✅ < 5 second initialization time

### Quality Metrics
- ✅ Zero high/critical security vulnerabilities
- ✅ Complete API documentation
- ✅ Backward compatibility preserved
- ✅ Organized test suite
- ✅ < 10 minute CI pipeline

### Developer Experience
- ✅ Clear architecture documentation
- ✅ Easy to add new commands
- ✅ Testable components
- ✅ < 30 minute onboarding
- ✅ Comprehensive troubleshooting guides

---

## 12. Next Steps

### Immediate Actions (This Week)
1. ✅ Store architecture in AgentDB memory
2. ⏳ Create CLI extraction plan
3. ⏳ Set up test fixtures
4. ⏳ Initialize ADR documentation
5. ⏳ Update GitHub Actions workflow

### Short-Term (Weeks 2-4)
1. Execute Phase 1: CLI extraction
2. Execute Phase 2: Core orchestration
3. Execute Phase 3: Test reorganization
4. Execute Phase 4: Documentation

### Medium-Term (Post-Migration)
1. Performance optimization
2. Additional tool support
3. Community feedback integration
4. v1.0.0 release preparation

---

## Appendix A: File Size Targets

| Component | Current | Target | Reduction |
|-----------|---------|--------|-----------|
| vibe-to-docker.js | 1900 lines | < 100 lines | 95% |
| src/cli/ | 0 lines | ~800 lines | NEW |
| src/core/ | 50 lines | ~400 lines | 8x |
| Total src/ | 4000 lines | ~5000 lines | +25% |

---

## Appendix B: Import Path Changes

### Before
```javascript
import { copyTemplate } from './vibe-to-docker.js';
```

### After
```javascript
import { InitCommand } from './src/cli/commands/init.js';
import { Orchestrator } from './src/core/orchestrator.js';
```

---

## Appendix C: CI/CD Pipeline Updates

**GitHub Actions Workflow**:
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: TypeScript Check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Format Check
        run: npm run format:check

  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Run Tests
        run: npm test -- --runInBand
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-19T22:58:00Z
**Status**: ✅ COMPLETE - Ready for implementation
**Next Review**: Week 1 - Post CLI extraction

