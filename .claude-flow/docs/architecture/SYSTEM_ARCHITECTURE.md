# vibe-to-docker System Architecture Design
## System Architecture Designer Deliverable

**Version**: 2.0.0
**Design Date**: November 20, 2025
**Agent**: System Architecture Designer
**Status**: ✅ COMPLETE - Ready for Implementation

---

## Executive Summary

This document defines the comprehensive system architecture for vibe-to-docker's initialization and runtime systems. The design integrates three existing architecture documents into a unified, modular system that supports:

- **5-phase initialization** with Byzantine fault tolerance (45-90 seconds)
- **Modular CLI architecture** with <100 line entry point
- **Multi-agent orchestration** with 7 specialized agents
- **Persistent memory** using AgentDB with 150x faster HNSW indexing
- **Cross-platform compatibility** (Windows/macOS/Linux)
- **Security-first design** with SLSA Level 2 compliance

### Key Architectural Decisions

1. **Modular CLI** - Extract 1900-line monolith into organized src/cli/commands/
2. **Initialization System** - 5-phase checkpoint-based workflow with rollback
3. **Detector Chain** - Parallel tool detection with confidence scoring
4. **Template Fragments** - Reusable Docker template components with caching
5. **Byzantine Consensus** - 7-agent validation with 6/7 approval threshold
6. **Semantic Memory** - AgentDB ReflexION for learning from failures

---

## 1. System Overview

### 1.1 Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                          │
│  bin/vibe-to-docker.js (CLI Entry) + Interactive Prompts        │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                   COMMAND HANDLER LAYER                          │
│  src/cli/commands/ (init, check-versions, fix-versions, etc.)   │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  ORCHESTRATION LAYER                             │
│  src/core/orchestrator.js + lifecycle.js + hooks.js             │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                          │
│  Parallel Execution:                                             │
│  ├─ Detection: src/detectors/ (5 parallel detectors)            │
│  ├─ Templates: src/templates/ (fragment composition)            │
│  ├─ Validation: src/lib/validators/ (security, type checking)   │
│  └─ Configuration: src/lib/generators/ (Docker, env, nginx)     │
└───────────────────────┬─────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PERSISTENCE LAYER                               │
│  AgentDB (SQLite .swarm/memory.db) + Cache (template-cache.js)  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Interaction Map

```
CLI Command
    │
    ├─→ Pre-Flight Validator (Phase 0)
    │   ├─ Node.js version check (≥20.8.1)
    │   ├─ Git installation check
    │   └─ File system permissions
    │
    ├─→ Dependency Installer (Phase 1) [PARALLEL]
    │   ├─ npm install (production dependencies)
    │   ├─ AgentDB binary download
    │   └─ Claude-Flow installation
    │
    ├─→ Storage Initializer (Phase 2) [SEQUENTIAL]
    │   ├─ AgentDB initialization (.swarm/memory.db)
    │   ├─ HNSW index creation (M=16, efConstruction=200)
    │   └─ Default pattern storage (cross-platform, timing, tests)
    │
    ├─→ Coordination Setup (Phase 3) [SEQUENTIAL]
    │   ├─ Claude-Flow config (.claude-flow/config.json)
    │   ├─ MCP server registration
    │   └─ Git hooks installation
    │
    ├─→ Health Validator (Phase 4) [PARALLEL]
    │   ├─ AgentDB query test (<50ms)
    │   ├─ Claude-Flow status check
    │   ├─ MCP server connectivity
    │   └─ Git hooks execution test
    │
    └─→ Post-Init Finalizer (Phase 5)
        ├─ Manifest creation
        ├─ Episode storage in AgentDB
        └─ Success summary display
```

---

## 2. Directory Structure Design

### 2.1 Recommended Architecture

```
vibe-to-docker/
├── bin/
│   └── vibe-to-docker.js              # Thin CLI wrapper (<50 lines)
│
├── src/
│   ├── cli/                           # CLI layer (NEW)
│   │   ├── index.js                   # CLI entry point
│   │   ├── commands/                  # Command handlers
│   │   │   ├── init.js                # Initialize Docker setup
│   │   │   ├── check-versions.js      # Version compatibility
│   │   │   ├── fix-versions.js        # Auto-fix versions
│   │   │   ├── uninstall.js           # Remove .vibe-docker
│   │   │   └── list.js                # List templates
│   │   ├── parsers/
│   │   │   ├── flags.js               # Argument parsing
│   │   │   └── validators.js          # Input validation
│   │   └── ui/
│   │       ├── progress.js            # Progress indicators
│   │       ├── logger.js              # Console output
│   │       └── colors.js              # Terminal colors
│   │
│   ├── core/                          # Core orchestration (ENHANCED)
│   │   ├── orchestrator.js            # Main workflow coordinator
│   │   ├── cache.js                   # Result caching (existing)
│   │   ├── lifecycle.js               # Initialization lifecycle
│   │   ├── hooks.js                   # Claude-Flow hook integration
│   │   ├── checkpoint-manager.js      # Phase checkpoint tracking
│   │   ├── rollback-manager.js        # Atomic rollback per phase
│   │   └── retry-handler.js           # Exponential backoff retry
│   │
│   ├── init/                          # Initialization system (NEW)
│   │   ├── phase-0-preflight.js       # System requirements check
│   │   ├── phase-1-dependencies.js    # Parallel dep installation
│   │   ├── phase-2-storage.js         # AgentDB initialization
│   │   ├── phase-3-coordination.js    # Claude-Flow setup
│   │   ├── phase-4-validation.js      # Health checks
│   │   ├── phase-5-post-init.js       # Finalization
│   │   └── phase-validator.js         # Validation logic
│   │
│   ├── detectors/                     # Tool detection (existing)
│   │   ├── base-detector.js
│   │   ├── figma-detector.js
│   │   ├── lovable-detector.js
│   │   ├── bolt-detector.js
│   │   ├── v0-detector.js
│   │   ├── replit-detector.js
│   │   ├── detector-chain.js          # Sequential chain
│   │   └── cached-detector-chain.js   # Parallel with caching
│   │
│   ├── lib/                           # Business logic (existing)
│   │   ├── template-composer.js       # Fragment composition
│   │   ├── env-manager.js             # Environment variables
│   │   ├── template-validator.js      # Template validation
│   │   ├── config-generators.js       # Config file generation
│   │   ├── package-fixer.js           # Package.json fixes
│   │   ├── version-checker.js         # Version compatibility
│   │   ├── version-fixer.js           # Auto version fixes
│   │   ├── project.js                 # Project metadata
│   │   ├── path-resolver.js           # Cross-platform paths
│   │   └── directory-manager.js       # Directory operations
│   │
│   └── templates/                     # Template system (existing)
│       ├── fragments/
│       │   ├── fragment-composer.js
│       │   ├── fragment-merger.js
│       │   ├── fragment-types.js
│       │   └── fragment-validator.js
│       └── tools/
│
├── templates/                         # Template files
│   ├── basic/                         # Base Docker templates
│   ├── ui-heavy/                      # Optimized for UI
│   ├── advanced/                      # Full-stack templates
│   └── replit/                        # Replit-specific
│
├── tests/                             # Test suite (REORGANIZED)
│   ├── unit/
│   │   ├── cli/                       # Mirror src/cli
│   │   ├── core/                      # Mirror src/core
│   │   ├── init/                      # Mirror src/init
│   │   ├── detectors/                 # Mirror src/detectors
│   │   ├── lib/                       # Mirror src/lib
│   │   └── templates/                 # Mirror src/templates
│   ├── e2e/
│   │   ├── init-workflows/            # Full init tests per tool
│   │   ├── version-fixes/             # Version checking E2E
│   │   └── cross-platform/            # OS compatibility
│   ├── integration/
│   │   ├── swarm-coordination/        # Multi-agent tests
│   │   ├── docker-compose/            # Container orchestration
│   │   └── agentdb-memory/            # Memory persistence
│   └── fixtures/
│       ├── figma-project/
│       ├── lovable-project/
│       ├── bolt-project/
│       ├── v0-project/
│       └── replit-project/
│
├── docs/                              # Documentation (STRUCTURED)
│   ├── adr/                           # Architecture Decision Records
│   │   ├── 001-detector-pattern.md
│   │   ├── 002-template-fragments.md
│   │   ├── 003-per-project-install.md
│   │   ├── 004-ai-validation.md
│   │   ├── 005-cli-modularization.md
│   │   ├── 006-test-organization.md
│   │   ├── 007-build-pipeline.md
│   │   └── 008-initialization-system.md
│   ├── api/                           # API documentation
│   │   ├── cli-reference.md
│   │   ├── public-api.md
│   │   └── internal-api.md
│   ├── guides/                        # User guides
│   │   ├── QUICK_START.md
│   │   ├── MIGRATION_GUIDE.md
│   │   ├── TROUBLESHOOTING.md
│   │   ├── CONTRIBUTING.md
│   │   └── INITIALIZATION_GUIDE.md
│   ├── architecture/                  # Architecture docs
│   │   ├── SYSTEM_ARCHITECTURE.md     # This document
│   │   ├── COMPONENT_INTERACTIONS.md
│   │   └── DATA_FLOW.md
│   └── archive/                       # Historical docs
│
├── scripts/                           # Build/dev scripts
│   ├── init.js                        # Main initialization script
│   ├── build.js                       # Build orchestration
│   ├── test-runner.js                 # Custom test runner
│   ├── ai-validate.js                 # AI validation (existing)
│   └── release.js                     # Release automation
│
├── config/                            # Configuration files
│   ├── jest.config.js                 # Jest configuration
│   ├── babel.config.js                # Babel configuration
│   └── eslint.config.js               # ESLint rules
│
├── .claude-flow/                      # Claude-Flow coordination
│   ├── config.json                    # Swarm configuration
│   ├── init-manifest.json             # Initialization state
│   ├── state/
│   │   ├── checkpoints.json           # Phase completion status
│   │   ├── session-manifest.json      # Session persistence
│   │   └── rollback-history.json      # Failed attempts
│   └── hooks/
│       ├── pre-commit
│       ├── pre-push
│       └── post-failure
│
├── .swarm/                            # Swarm coordination
│   └── memory.db                      # AgentDB SQLite database
│
└── agentdb.db                         # Root-level AgentDB (existing)
```

---

## 3. Initialization System Architecture

### 3.1 Five-Phase Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    INITIALIZATION PHASES                         │
│                   (Total: 45-90 seconds)                         │
└─────────────────────────────────────────────────────────────────┘

Phase 0: Pre-Flight Validation (5-10s)
├── System Requirements Check
│   ├── Node.js Version ≥20.8.1
│   ├── Git Installation
│   └── Platform Detection (darwin/linux/win32)
├── File System Permissions
│   ├── Write access to project root
│   ├── Write access to ~/.config (for git hooks)
│   └── Write access to .claude-flow/
└── Network Connectivity (optional)
    ├── npm registry reachable
    └── GitHub API reachable

                    ↓ [CHECKPOINT 0] ↓

Phase 1: Core Dependencies (15-30s) [PARALLEL]
├── Thread 1: npm install
│   ├── Install production dependencies (none)
│   ├── Install devDependencies (claude-flow, agentdb, jest)
│   └── Verify package integrity
├── Thread 2: AgentDB Binary
│   ├── Check if agentdb already installed
│   ├── Download platform binary (if needed)
│   └── Verify checksum
└── Thread 3: Claude-Flow Installation
    ├── Install claude-flow@alpha globally
    ├── Verify CLI availability
    └── Check version compatibility

                    ↓ [CHECKPOINT 1] ↓

Phase 2: Database & Storage (10-15s) [SEQUENTIAL]
├── Step 1: AgentDB Initialization
│   ├── Create ./agentdb.db (SQLite)
│   ├── Initialize vector schema
│   ├── Create HNSW index (M=16, efConstruction=200)
│   └── Create namespaces:
│       ├── learning
│       ├── ci-cd/failures
│       └── swarm-coordination
├── Step 2: Memory Store Setup
│   ├── Validate AgentDB connection
│   ├── Test vector insertion (smoke test)
│   └── Pre-populate default patterns:
│       ├── Cross-platform path patterns
│       ├── Timing assumption patterns
│       └── Test assertion patterns
└── Step 3: Persistence Configuration
    ├── Create .claude-flow/state/ directory
    ├── Initialize session manifest
    └── Configure auto-backup (every 100 operations)

                    ↓ [CHECKPOINT 2] ↓

Phase 3: Coordination Infrastructure (10-20s) [SEQUENTIAL]
├── Step 1: Claude-Flow Configuration
│   ├── Initialize config (.claude-flow/config.json)
│   │   ├── Set default topology: hierarchical
│   │   ├── Set maxAgents: 7
│   │   ├── Set strategy: balanced
│   │   └── Enable hooks: true
│   ├── Create hooks directory structure
│   └── Set executable permissions (chmod +x)
├── Step 2: MCP Server Registration
│   ├── Register claude-flow (required)
│   ├── Register ruv-swarm (optional)
│   └── Register flow-nexus (optional)
└── Step 3: Git Hooks Installation
    ├── Configure git hooks path
    ├── Verify hooks are executable
    └── Test hook execution (dry-run)

                    ↓ [CHECKPOINT 3] ↓

Phase 4: Validation & Health Checks (5-10s) [PARALLEL]
├── Thread 1: AgentDB Health Check
├── Thread 2: Claude-Flow Status Check
├── Thread 3: MCP Server Connectivity Test
├── Thread 4: Git Hooks Execution Test
└── Thread 5: Memory Store Query Test

                    ↓ [CHECKPOINT 4] ↓

Phase 5: Post-Init Configuration (5s)
├── Create initialization manifest
├── Store initialization in AgentDB
├── Generate health report
└── Display success summary

                    ↓ [INITIALIZATION COMPLETE] ↓
```

### 3.2 Checkpoint-Based State Management

**Checkpoint File**: `.claude-flow/state/checkpoints.json`

```json
{
  "version": "2.0.0",
  "lastUpdate": "2025-11-20T19:45:00Z",
  "checkpoints": [
    {
      "phase": 0,
      "name": "pre-flight",
      "status": "completed",
      "timestamp": "2025-11-20T19:35:10Z",
      "duration": 8500,
      "validation": {
        "nodeVersion": "20.8.1",
        "gitInstalled": true,
        "platform": "darwin",
        "permissions": true
      }
    },
    {
      "phase": 1,
      "name": "dependencies",
      "status": "completed",
      "timestamp": "2025-11-20T19:35:45Z",
      "duration": 28300,
      "validation": {
        "npmInstallSuccess": true,
        "agentdbBinaryDownloaded": true,
        "claudeFlowInstalled": true
      }
    }
  ],
  "currentPhase": 2,
  "totalDuration": 36800,
  "errors": []
}
```

### 3.3 Rollback Strategy

**Principle**: Atomic rollback per phase with granular cleanup

```javascript
class RollbackManager {
  async rollbackPhase(phase, checkpointData) {
    switch (phase) {
      case 0:
        // No rollback needed - no modifications
        return { success: true, message: 'Pre-flight only, no cleanup' };

      case 1:
        // Remove dependencies
        await this.removeNodeModules();
        await this.uninstallAgentDB();
        await this.uninstallClaudeFlow();
        return { success: true, message: 'Dependencies removed' };

      case 2:
        // Remove database and state
        await this.removeAgentDB();
        await this.removeStateDirectory();
        return { success: true, message: 'Storage cleaned up' };

      case 3:
        // Remove configuration
        await this.removeClaudeFlowConfig();
        await this.unregisterMCPServers();
        await this.removeGitHooks();
        return { success: true, message: 'Coordination removed' };

      case 4:
        // No rollback needed - validation only
        return { success: true, message: 'Validation only, no cleanup' };

      case 5:
        // Remove manifest
        await this.removeInitManifest();
        return { success: true, message: 'Manifest removed' };
    }
  }

  async removeNodeModules() {
    const modulesPath = path.join(process.cwd(), 'node_modules');
    if (fs.existsSync(modulesPath)) {
      await fs.promises.rm(modulesPath, { recursive: true, force: true });
    }
  }

  async removeAgentDB() {
    const dbPaths = [
      path.join(process.cwd(), 'agentdb.db'),
      path.join(process.cwd(), '.swarm/memory.db')
    ];
    for (const dbPath of dbPaths) {
      if (fs.existsSync(dbPath)) {
        await fs.promises.unlink(dbPath);
      }
    }
  }

  async removeStateDirectory() {
    const statePath = path.join(process.cwd(), '.claude-flow/state');
    if (fs.existsSync(statePath)) {
      await fs.promises.rm(statePath, { recursive: true, force: true });
    }
  }
}
```

---

## 4. CLI Architecture Design

### 4.1 Entry Point (`bin/vibe-to-docker.js`)

**Size Target**: <50 lines
**Purpose**: Minimal wrapper delegating to src/cli/index.js

```javascript
#!/usr/bin/env node

import { run } from '../src/cli/index.js';
import { handleError } from '../src/cli/ui/logger.js';

// Global error handlers
process.on('uncaughtException', handleError);
process.on('unhandledRejection', handleError);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nInterrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\nTerminated');
  process.exit(143);
});

// Run CLI
run(process.argv.slice(2)).catch(handleError);
```

### 4.2 Command Handlers Pattern

**Interface**:
```javascript
// src/cli/commands/init.js
export async function execute(options) {
  const { tool, projectDir, verbose, dryRun, skipDockerStart } = options;

  // Command logic
  const orchestrator = new Orchestrator();
  const result = await orchestrator.initialize(tool, projectDir, {
    verbose,
    dryRun,
    skipDockerStart
  });

  return { success: result.success, message: result.message };
}

export const metadata = {
  name: 'init',
  description: 'Initialize Docker setup for AI-generated project',
  flags: [
    { name: '--tool', type: 'string', required: false, default: 'auto' },
    { name: '--verbose', type: 'boolean', default: false },
    { name: '--dry-run', type: 'boolean', default: false },
    { name: '--no-docker-start', type: 'boolean', default: false }
  ],
  examples: [
    'npx vibe-to-docker init --tool=figma-make',
    'npx vibe-to-docker init --tool=lovable --verbose',
    'npx vibe-to-docker init --tool=auto --dry-run'
  ]
};
```

---

## 5. Multi-Agent Orchestration Design

### 5.1 Agent Hierarchy

```
                 ┌────────────────────────┐
                 │  Queen Coordinator     │
                 │ (Strategic Oversight)  │
                 └──────────┬─────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
           ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │ Validation  │  │ Detection   │  │ Composition │
   │   Swarm     │  │   Swarm     │  │   Swarm     │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
    ┌─────┼─────┐    ┌─────┼─────┐    ┌─────┼─────┐
    ▼     ▼     ▼    ▼     ▼     ▼    ▼     ▼     ▼
  Test   Cov  Plat  Tool  DB   BE   Tmpl  Env  Cfg
  Pred   Anlz  Val  Det   Det  Det  Cmp   Mgr  Gen

Byzantine Consensus: 6/7 agents must approve
Failure Tolerance: Can tolerate 2 faulty agents
Validation Speed: 45-60 seconds
Prevention Rate: 85%+ CI failures
```

### 5.2 Agent Coordination Protocol

```bash
# Pre-task hook
npx claude-flow@alpha hooks pre-task \
  --description "Initialize Docker setup for [tool]"

# During work: Store progress
npx claude-flow@alpha memory store "swarm/[agent-type]/[step]" \
  "[progress update]" \
  --namespace "coordination"

# Post-edit hook
npx claude-flow@alpha hooks post-edit \
  --file "[file]" \
  --memory-key "swarm/[agent]/[step]"

# Notify team
npx claude-flow@alpha hooks notify \
  --message "[Agent]: Completed [task]" \
  --level "info"

# Post-task hook
npx claude-flow@alpha hooks post-task \
  --task-id "task-[id]"
```

---

## 6. Quality Attributes

### 6.1 Performance Targets

| Metric | Target | Current | Measurement |
|--------|--------|---------|-------------|
| CLI Startup | <150ms | ~200ms | Time to first output |
| Detection | <500ms | ~300ms | Parallel detector execution |
| Template Gen | <1000ms | ~800ms | Fragment composition |
| Full Init | <5000ms | ~4500ms | End-to-end workflow |
| Initialization | 45-90s | TBD | Full 5-phase init |

### 6.2 Maintainability Goals

- **Module Size**: <300 lines per file (enforced by linter)
- **Function Complexity**: Cyclomatic complexity <10
- **Test Coverage**: 80%+ (enforced in CI)
- **Documentation**: 100% public API coverage
- **Type Safety**: 100% JSDoc coverage

### 6.3 Security Requirements

1. **Input Validation**: All CLI inputs sanitized
2. **Path Traversal**: Directory validation enforced
3. **Secret Detection**: Hardcoded API key warnings
4. **Template Safety**: Security validation on generation
5. **Dependency Security**: Zero high/critical vulnerabilities

---

## 7. Success Criteria

### 7.1 Functional Metrics

- ✅ Modular CLI architecture (<100 line entry point)
- ✅ 5-phase initialization (45-90 seconds)
- ✅ Clear separation of concerns
- ✅ 80%+ test coverage maintained
- ✅ 100% CI success rate

### 7.2 Quality Metrics

- ✅ Zero high/critical security vulnerabilities
- ✅ Complete API documentation
- ✅ Backward compatibility preserved
- ✅ Organized test suite
- ✅ <10 minute CI pipeline

### 7.3 Developer Experience

- ✅ Clear architecture documentation
- ✅ Easy to add new commands
- ✅ Testable components
- ✅ <30 minute onboarding
- ✅ Comprehensive troubleshooting guides

---

## 8. Integration Points

### 8.1 Claude-Flow Integration

```javascript
// Initialize swarm
await mcp__claude-flow__swarm_init({
  topology: 'hierarchical',
  maxAgents: 7,
  strategy: 'balanced'
});

// Memory operations
await mcp__claude-flow__memory_usage({
  action: 'store',
  key: 'architecture/init',
  value: JSON.stringify(designDoc),
  namespace: 'learning'
});

// Neural training
await mcp__claude-flow__neural_train({
  pattern_type: 'optimization',
  training_data: JSON.stringify(failurePatterns),
  epochs: 50
});
```

### 8.2 AgentDB Memory Storage

```bash
# Store architecture decisions
npx agentdb@latest memory-store \
  --namespace "architecture/decisions" \
  --key "init-system-design" \
  --value "{design details}"

# ReflexION episodes
npx agentdb@latest reflexion store \
  "init-architecture-$(date +%s)" \
  "5-phase initialization system design" \
  0.95 \
  true \
  "Comprehensive architecture with rollback and validation"
```

---

## 9. Risk Assessment

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CLI extraction breaks imports | Medium | High | Incremental refactoring + test coverage |
| Init phase failures | Medium | High | Checkpoint system + rollback |
| Performance regression | Low | Medium | Benchmark tests in CI |
| AgentDB corruption | Low | Medium | Auto-backup every 100 operations |

### 9.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CI/CD failures during migration | Medium | High | Feature branch + gradual rollout |
| User adoption confusion | Low | Medium | Clear migration guide |
| Documentation incomplete | Low | High | Documentation-first approach |

---

## 10. Migration Strategy

### Phase 1: CLI Extraction (Week 1)

**Tasks**:
1. Create `src/cli/` structure
2. Extract command handlers from vibe-to-docker.js
3. Create thin `bin/vibe-to-docker.js` wrapper
4. Update imports across tests
5. Validate CLI functionality

**Success Criteria**:
- vibe-to-docker.js <100 lines
- All commands work identically
- 100% test pass rate
- Zero breaking changes

### Phase 2: Initialization System (Week 2)

**Tasks**:
1. Create `src/init/` directory structure
2. Implement 5 phase modules
3. Add checkpoint manager
4. Add rollback manager
5. Integrate with orchestrator

**Success Criteria**:
- All 5 phases implemented
- Checkpoint system working
- Rollback tested
- <90s total duration

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
- <10 minute CI duration
- Zero flaky tests

### Phase 4: Documentation (Week 4)

**Tasks**:
1. Write 8+ ADRs
2. Create API documentation
3. Write user guides
4. Migration guide
5. Developer onboarding

**Success Criteria**:
- Complete API docs
- User-friendly guides
- Tested migration path
- <30 min onboarding

---

## 11. Appendix: Component Dependencies

### 11.1 Dependency Graph

```
bin/vibe-to-docker.js
  └─→ src/cli/index.js
      └─→ src/cli/commands/init.js
          └─→ src/core/orchestrator.js
              ├─→ src/init/phase-0-preflight.js
              ├─→ src/init/phase-1-dependencies.js
              ├─→ src/init/phase-2-storage.js
              ├─→ src/init/phase-3-coordination.js
              ├─→ src/init/phase-4-validation.js
              ├─→ src/init/phase-5-post-init.js
              ├─→ src/detectors/cached-detector-chain.js
              ├─→ src/templates/fragment-composer.js
              └─→ src/lib/template-validator.js
```

### 11.2 External Dependencies

**Runtime**:
- None (zero production dependencies)

**Development**:
- `claude-flow@^2.7.35` - Swarm orchestration
- `agentdb@^1.6.1` - Vector database
- `agentic-flow@^1.10.2` - MCP tools (optional)
- `jest@^30.2.0` - Testing framework
- `babel-jest@^30.2.0` - Jest transformer

---

**Document Version**: 2.0.0
**Last Updated**: November 20, 2025
**Status**: ✅ COMPLETE - Ready for Implementation
**Next Review**: Week 1 - Post CLI extraction
