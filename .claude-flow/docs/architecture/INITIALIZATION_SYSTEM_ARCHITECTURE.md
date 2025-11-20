# Initialization System Architecture - vibe-to-docker v5.1.0

**Architect**: System Architecture Designer
**Date**: November 20, 2025
**Status**: DESIGN COMPLETE - READY FOR IMPLEMENTATION
**Project**: vibe-to-docker - Universal Docker containerization tool

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Module Architecture](#module-architecture)
4. [Component Specifications](#component-specifications)
5. [Data Flow](#data-flow)
6. [Interface Contracts](#interface-contracts)
7. [Implementation Plan](#implementation-plan)
8. [Architecture Decision Records](#architecture-decision-records)
9. [Integration Strategy](#integration-strategy)
10. [Testing Strategy](#testing-strategy)

---

## Executive Summary

### Design Philosophy

This architecture implements a **modular, testable, and maintainable** initialization system that transforms the vibe-to-docker CLI from a monolithic 2,031-line file into a clean, orchestrated workflow with clear separation of concerns.

**Core Principles**:
- ✅ **Single Responsibility**: Each module has one clear purpose
- ✅ **Dependency Injection**: All dependencies are explicit and testable
- ✅ **Progressive Enhancement**: Graceful degradation when optional features fail
- ✅ **Observable State**: Real-time progress tracking and health monitoring
- ✅ **Idempotent Operations**: Safe to retry without side effects

**Performance Targets**:
- ⚡ **Initialization Time**: 45-90 seconds (5 phases)
- 🎯 **Success Rate**: 95%+ on first attempt
- 🔄 **Recovery Time**: <15 seconds for rollback
- 💾 **Memory Footprint**: <50MB during initialization
- 📊 **Test Coverage**: 90%+ for all init modules

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI ENTRY POINT                          │
│                    bin/vibe-to-docker.js                         │
│                        (<50 lines)                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COMMAND ROUTER                              │
│                    src/cli/index.js                              │
│                  (Parse args, route to commands)                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │  init    │      │   fix    │ ... │  list    │
    │ command  │      │ command  │     │ command  │
    └────┬─────┘      └──────────┘     └──────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR LAYER                           │
│                  src/core/orchestrator.js                        │
│            (Coordinates 5-phase initialization)                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │ Phase 0  │ →    │ Phase 1  │ →   │ Phase 2  │ →
    │ Pre-     │      │  Core    │     │Database  │
    │ Flight   │      │  Deps    │     │ Setup    │
    └──────────┘      └──────────┘     └──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │ Phase 3  │ →    │ Phase 4  │ →   │ Phase 5  │
    │Coordin-  │      │Validate  │     │Post-Init │
    │ ation    │      │& Health  │     │ Config   │
    └──────────┘      └──────────┘     └──────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXECUTION MODULES                           │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Validator     │  │   Installer    │  │   Configurator │   │
│  │  (Pre-flight)  │  │  (Dependencies)│  │  (AgentDB/CF)  │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Health Check  │  │   Rollback     │  │   State Mgmt   │   │
│  │  (Validation)  │  │  (Recovery)    │  │  (Checkpoint)  │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPPORT LIBRARIES                          │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  Detectors     │  │   Templates    │  │   Version      │   │
│  │  (Existing)    │  │  (Existing)    │  │  (Existing)    │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │   Logger       │  │   Cache        │  │   Project      │   │
│  │  (Existing)    │  │  (Existing)    │  │  (Existing)    │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture

### Directory Structure (Target State)

```
figma-docker-init/
├── bin/
│   └── vibe-to-docker.js           # Thin wrapper (<50 lines)
│
├── src/
│   ├── cli/
│   │   ├── index.js                # Command router
│   │   ├── commands/
│   │   │   ├── init.js             # ✅ EXISTS - Init command handler
│   │   │   ├── fix-versions.js     # Version fixer command
│   │   │   ├── list-tools.js       # List supported tools
│   │   │   └── validate.js         # Validate project setup
│   │   ├── parsers/
│   │   │   ├── flags.js            # ✅ EXISTS - CLI flag parser
│   │   │   └── args.js             # Argument validator
│   │   └── ui/
│   │       └── logger.js           # ✅ EXISTS - Terminal UI
│   │
│   ├── core/
│   │   ├── orchestrator.js         # ⚠️ NEW - Main orchestration engine
│   │   ├── lifecycle.js            # ⚠️ NEW - Lifecycle hooks manager
│   │   ├── state-manager.js        # ⚠️ NEW - Checkpoint/state persistence
│   │   └── cache.js                # ✅ EXISTS - Caching layer
│   │
│   ├── init/                       # ⚠️ NEW - Initialization modules
│   │   ├── phases/
│   │   │   ├── phase0-preflight.js     # Pre-flight validation
│   │   │   ├── phase1-dependencies.js  # Install dependencies
│   │   │   ├── phase2-database.js      # AgentDB setup
│   │   │   ├── phase3-coordination.js  # Claude-Flow config
│   │   │   ├── phase4-validation.js    # Health checks
│   │   │   └── phase5-postinit.js      # Final config
│   │   ├── validators/
│   │   │   ├── system-validator.js     # Node.js, git, permissions
│   │   │   ├── network-validator.js    # npm, GitHub connectivity
│   │   │   └── health-validator.js     # Post-init health checks
│   │   ├── installers/
│   │   │   ├── npm-installer.js        # npm install wrapper
│   │   │   ├── agentdb-installer.js    # AgentDB binary installer
│   │   │   └── claude-flow-installer.js # Claude-Flow installer
│   │   └── configurators/
│   │       ├── agentdb-config.js       # AgentDB initialization
│   │       ├── claude-flow-config.js   # Claude-Flow setup
│   │       └── git-hooks-config.js     # Git hooks installation
│   │
│   ├── detectors/                  # ✅ EXISTS - Tool detection
│   │   ├── base-detector.js
│   │   ├── figma-detector.js
│   │   ├── lovable-detector.js
│   │   ├── bolt-detector.js
│   │   ├── v0-detector.js
│   │   └── replit-detector.js
│   │
│   ├── lib/                        # ✅ EXISTS - Business logic
│   │   ├── version-checker.js
│   │   ├── version-fixer.js
│   │   ├── template-composer.js
│   │   ├── env-manager.js
│   │   └── project.js
│   │
│   └── templates/                  # ✅ EXISTS - Template system
│       └── fragments/
│
├── tests/
│   ├── unit/
│   │   ├── cli/                    # CLI layer tests
│   │   ├── core/                   # Core orchestration tests
│   │   ├── init/                   # ⚠️ NEW - Init module tests
│   │   ├── detectors/              # Detector tests
│   │   └── lib/                    # Library tests
│   ├── e2e/
│   │   ├── init-workflow.test.js   # ⚠️ NEW - End-to-end init test
│   │   └── rollback.test.js        # ⚠️ NEW - Rollback scenarios
│   └── fixtures/
│       └── init-test-projects/     # Test projects for init
│
└── docs/
    ├── architecture/               # ⚠️ NEW - Architecture docs
    │   ├── INITIALIZATION_SYSTEM_ARCHITECTURE.md (this file)
    │   ├── ARCHITECTURE_DESIGN.md
    │   └── INITIALIZATION_ARCHITECTURE.md
    └── adr/                        # ⚠️ NEW - Architecture Decision Records
        ├── 001-orchestrator-pattern.md
        ├── 002-checkpoint-system.md
        ├── 003-phase-dependencies.md
        └── 004-rollback-strategy.md
```

**Legend**:
- ✅ **EXISTS**: Already implemented
- ⚠️ **NEW**: Needs to be created
- 📝 **UPDATE**: Needs modification

---

## Component Specifications

### 1. Core Orchestrator (`src/core/orchestrator.js`)

**Responsibility**: Coordinate 5-phase initialization workflow

**Dependencies**:
- `Lifecycle` (lifecycle.js) - Hook management
- `StateManager` (state-manager.js) - Checkpoint persistence
- Phase modules (phase0-5)
- Logger (cli/ui/logger.js)

**Interface**:
```javascript
class Orchestrator {
  constructor(options = {}) {
    this.lifecycle = new Lifecycle();
    this.stateManager = new StateManager();
    this.phases = this.loadPhases();
    this.options = options;
  }

  /**
   * Initialize the project with specified tool
   * @param {string} tool - Tool name (figma-make, lovable, bolt, v0, replit, auto)
   * @param {string} projectDir - Project directory
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} Result { success, message, state }
   */
  async initialize(tool, projectDir, options = {}) {
    const startTime = Date.now();
    const context = {
      tool,
      projectDir,
      options,
      startTime,
      checkpoints: []
    };

    try {
      // Run pre-init lifecycle hook
      await this.lifecycle.runHook('pre-init', context);

      // Execute phases sequentially
      for (const phase of this.phases) {
        await this.executePhase(phase, context);
      }

      // Run post-init lifecycle hook
      await this.lifecycle.runHook('post-init', context);

      return {
        success: true,
        message: 'Initialization complete',
        state: context,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Rollback on failure
      await this.rollback(context, error);
      throw error;
    }
  }

  /**
   * Execute a single phase with checkpoint management
   */
  async executePhase(phase, context) {
    const phaseStart = Date.now();

    try {
      // Pre-phase hook
      await this.lifecycle.runHook('pre-phase', { phase, context });

      // Execute phase
      const result = await phase.execute(context);

      // Create checkpoint
      await this.stateManager.createCheckpoint(phase.id, result);

      // Post-phase hook
      await this.lifecycle.runHook('post-phase', { phase, context, result });

      // Update context
      context.checkpoints.push({
        phase: phase.id,
        result,
        duration: Date.now() - phaseStart
      });

      return result;
    } catch (error) {
      error.phase = phase.id;
      throw error;
    }
  }

  /**
   * Rollback to last successful checkpoint
   */
  async rollback(context, error) {
    const lastCheckpoint = context.checkpoints[context.checkpoints.length - 1];

    if (lastCheckpoint) {
      await this.stateManager.rollbackToCheckpoint(lastCheckpoint.phase);
    }

    await this.lifecycle.runHook('rollback', { context, error });
  }

  /**
   * Resume from last checkpoint
   */
  async resume(checkpointId) {
    const state = await this.stateManager.loadCheckpoint(checkpointId);
    return this.initialize(state.tool, state.projectDir, { resume: true, state });
  }
}
```

**Key Methods**:
- `initialize(tool, projectDir, options)` - Main entry point
- `executePhase(phase, context)` - Execute single phase with hooks
- `rollback(context, error)` - Rollback on failure
- `resume(checkpointId)` - Resume from checkpoint

---

### 2. Lifecycle Manager (`src/core/lifecycle.js`)

**Responsibility**: Manage lifecycle hooks for extensibility

**Interface**:
```javascript
class Lifecycle {
  constructor() {
    this.hooks = new Map();
  }

  /**
   * Register a lifecycle hook
   * @param {string} event - Hook name (pre-init, post-init, pre-phase, etc.)
   * @param {Function} handler - Async handler function
   */
  on(event, handler) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(handler);
  }

  /**
   * Run all hooks for an event
   * @param {string} event - Hook name
   * @param {Object} data - Data to pass to hooks
   */
  async runHook(event, data) {
    const handlers = this.hooks.get(event) || [];

    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.warn(`Hook ${event} failed:`, error.message);
      }
    }
  }
}
```

**Available Hooks**:
- `pre-init` - Before initialization starts
- `post-init` - After successful initialization
- `pre-phase` - Before each phase execution
- `post-phase` - After each phase completes
- `rollback` - On failure/rollback

---

### 3. State Manager (`src/core/state-manager.js`)

**Responsibility**: Manage checkpoints and persistent state

**Interface**:
```javascript
class StateManager {
  constructor(stateDir = '.claude-flow/state') {
    this.stateDir = stateDir;
    this.checkpointsFile = path.join(stateDir, 'checkpoints.json');
  }

  /**
   * Create a checkpoint after successful phase
   * @param {string} phaseId - Phase identifier
   * @param {Object} data - Phase result data
   */
  async createCheckpoint(phaseId, data) {
    const checkpoint = {
      id: phaseId,
      timestamp: new Date().toISOString(),
      data
    };

    await this.saveCheckpoint(checkpoint);
    return checkpoint;
  }

  /**
   * Load checkpoint data
   * @param {string} checkpointId - Checkpoint identifier
   */
  async loadCheckpoint(checkpointId) {
    const checkpoints = await this.loadCheckpoints();
    return checkpoints.find(cp => cp.id === checkpointId);
  }

  /**
   * Rollback to checkpoint (delete subsequent checkpoints)
   * @param {string} checkpointId - Checkpoint to rollback to
   */
  async rollbackToCheckpoint(checkpointId) {
    const checkpoints = await this.loadCheckpoints();
    const index = checkpoints.findIndex(cp => cp.id === checkpointId);

    if (index === -1) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    // Keep checkpoints up to and including this one
    const remainingCheckpoints = checkpoints.slice(0, index + 1);
    await this.saveCheckpoints(remainingCheckpoints);
  }

  /**
   * Clear all checkpoints
   */
  async clearCheckpoints() {
    await this.saveCheckpoints([]);
  }
}
```

---

### 4. Phase Modules (`src/init/phases/`)

Each phase implements a standard interface:

```javascript
export class Phase {
  constructor() {
    this.id = 'phase-name';
    this.name = 'Human-readable name';
    this.dependencies = []; // Other phases that must complete first
  }

  /**
   * Execute phase logic
   * @param {Object} context - Shared initialization context
   * @returns {Promise<Object>} Phase result data
   */
  async execute(context) {
    // Phase-specific logic
    return {
      success: true,
      data: {}
    };
  }

  /**
   * Validate phase can execute
   * @param {Object} context - Shared initialization context
   * @returns {Promise<boolean>} True if phase can run
   */
  async canExecute(context) {
    return true;
  }

  /**
   * Cleanup on rollback
   * @param {Object} context - Shared initialization context
   */
  async cleanup(context) {
    // Rollback logic
  }
}
```

**Phase Implementations**:

#### Phase 0: Pre-Flight (`phase0-preflight.js`)
```javascript
export class PreFlightPhase extends Phase {
  constructor() {
    super();
    this.id = 'preflight';
    this.name = 'Pre-Flight Validation';
  }

  async execute(context) {
    const validator = new SystemValidator();

    // Validate Node.js version
    await validator.checkNodeVersion();

    // Validate Git installation
    await validator.checkGitInstalled();

    // Validate file system permissions
    await validator.checkPermissions(context.projectDir);

    // Optional: Check network connectivity
    const networkStatus = await validator.checkNetwork({ optional: true });

    return {
      success: true,
      validations: {
        node: true,
        git: true,
        permissions: true,
        network: networkStatus
      }
    };
  }
}
```

#### Phase 1: Dependencies (`phase1-dependencies.js`)
```javascript
export class DependenciesPhase extends Phase {
  constructor() {
    super();
    this.id = 'dependencies';
    this.name = 'Core Dependencies';
    this.dependencies = ['preflight'];
  }

  async execute(context) {
    // Parallel installation
    const results = await Promise.allSettled([
      this.installNpmDependencies(context),
      this.installAgentDB(context),
      this.installClaudeFlow(context)
    ]);

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Dependency installation failed: ${failures.map(f => f.reason).join(', ')}`);
    }

    return {
      success: true,
      installed: {
        npm: results[0].value,
        agentdb: results[1].value,
        claudeFlow: results[2].value
      }
    };
  }

  async installNpmDependencies(context) {
    const installer = new NpmInstaller();
    return installer.install(context.projectDir);
  }

  async installAgentDB(context) {
    const installer = new AgentDBInstaller();
    return installer.install(context.projectDir);
  }

  async installClaudeFlow(context) {
    const installer = new ClaudeFlowInstaller();
    return installer.install();
  }
}
```

#### Phase 2: Database (`phase2-database.js`)
```javascript
export class DatabasePhase extends Phase {
  constructor() {
    super();
    this.id = 'database';
    this.name = 'Database & Storage';
    this.dependencies = ['dependencies'];
  }

  async execute(context) {
    const configurator = new AgentDBConfigurator();

    // Initialize AgentDB
    await configurator.initialize(context.projectDir);

    // Create namespaces
    await configurator.createNamespaces([
      'learning',
      'ci-cd/failures',
      'swarm-coordination'
    ]);

    // Pre-populate default patterns
    await configurator.seedPatterns();

    return {
      success: true,
      database: {
        path: path.join(context.projectDir, 'agentdb.db'),
        namespaces: 3,
        patternsSeeded: true
      }
    };
  }
}
```

#### Phase 3: Coordination (`phase3-coordination.js`)
```javascript
export class CoordinationPhase extends Phase {
  constructor() {
    super();
    this.id = 'coordination';
    this.name = 'Coordination Infrastructure';
    this.dependencies = ['database'];
  }

  async execute(context) {
    const configurator = new ClaudeFlowConfigurator();

    // Initialize Claude-Flow config
    await configurator.initializeConfig(context.projectDir, {
      topology: 'hierarchical',
      maxAgents: 7,
      strategy: 'balanced',
      hooks: true
    });

    // Install git hooks
    await configurator.installGitHooks(context.projectDir);

    // Register MCP servers (optional)
    const mcpServers = await configurator.registerMCPServers({ optional: true });

    return {
      success: true,
      coordination: {
        config: true,
        hooks: true,
        mcpServers
      }
    };
  }
}
```

#### Phase 4: Validation (`phase4-validation.js`)
```javascript
export class ValidationPhase extends Phase {
  constructor() {
    super();
    this.id = 'validation';
    this.name = 'Validation & Health Checks';
    this.dependencies = ['coordination'];
  }

  async execute(context) {
    const validator = new HealthValidator();

    // Parallel health checks
    const results = await Promise.allSettled([
      validator.checkAgentDB(context.projectDir),
      validator.checkClaudeFlow(context.projectDir),
      validator.checkMCPServers(),
      validator.checkGitHooks(context.projectDir),
      validator.checkMemoryStore(context.projectDir)
    ]);

    // Collect results
    const healthChecks = {
      agentdb: results[0].status === 'fulfilled',
      claudeFlow: results[1].status === 'fulfilled',
      mcpServers: results[2].status === 'fulfilled',
      gitHooks: results[3].status === 'fulfilled',
      memoryStore: results[4].status === 'fulfilled'
    };

    // Calculate health score
    const passed = Object.values(healthChecks).filter(v => v).length;
    const total = Object.keys(healthChecks).length;
    const healthScore = (passed / total) * 100;

    if (healthScore < 80) {
      throw new Error(`Health check failed: ${healthScore}% (need 80%+)`);
    }

    return {
      success: true,
      healthChecks,
      healthScore
    };
  }
}
```

#### Phase 5: Post-Init (`phase5-postinit.js`)
```javascript
export class PostInitPhase extends Phase {
  constructor() {
    super();
    this.id = 'postinit';
    this.name = 'Post-Init Configuration';
    this.dependencies = ['validation'];
  }

  async execute(context) {
    // Create initialization manifest
    const manifest = {
      version: '5.1.0',
      tool: context.tool,
      timestamp: new Date().toISOString(),
      duration: Date.now() - context.startTime,
      checkpoints: context.checkpoints.map(cp => ({
        phase: cp.phase,
        duration: cp.duration
      }))
    };

    // Save manifest
    const manifestPath = path.join(context.projectDir, '.claude-flow/state/init-manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Store in AgentDB
    const agentdb = new AgentDBClient(context.projectDir);
    await agentdb.storeEpisode({
      id: `init-${Date.now()}`,
      trajectory: `Initialized vibe-to-docker for ${context.tool}`,
      verdict: 0.95,
      selfReflection: 'Successful initialization',
      selfCorrection: 'None needed',
      timestamp: manifest.timestamp
    });

    return {
      success: true,
      manifest,
      manifestPath
    };
  }
}
```

---

## Data Flow

### Initialization Context Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    INITIALIZATION CONTEXT                     │
│                  (Shared across all phases)                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  tool: string              // 'figma-make', 'lovable', etc.  │
│  projectDir: string        // '/path/to/project'             │
│  options: {                                                  │
│    skipVersionCheck: boolean                                 │
│    resume: boolean                                           │
│    state: object           // Resumed state                  │
│  }                                                           │
│  startTime: number         // Start timestamp                │
│  checkpoints: [            // Phase completion records       │
│    {                                                         │
│      phase: string         // 'preflight', 'dependencies'    │
│      result: object        // Phase-specific result          │
│      duration: number      // Phase execution time           │
│    }                                                         │
│  ]                                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │         Phase Execution             │
         │    (Sequential with checkpoints)    │
         └────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
    Phase 0-1-2          Phase 3-4           Phase 5
    (Setup)           (Coordination)       (Finalize)
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │     Checkpoint After Each Phase     │
         │  .claude-flow/state/checkpoints.json│
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │        Final Manifest Created       │
         │ .claude-flow/state/init-manifest.json│
         └────────────────────────────────────┘
```

### Error Handling Flow

```
         ┌────────────────────────────────────┐
         │      Phase Execution Failure        │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │    Identify Last Checkpoint         │
         │  (context.checkpoints.length - 1)   │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │   Run Phase.cleanup() Methods       │
         │   (In reverse order)                │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │  StateManager.rollbackToCheckpoint()│
         │  (Delete subsequent checkpoints)    │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │    Lifecycle.runHook('rollback')    │
         │  (Notify external systems)          │
         └────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────┐
         │       Log Error & Exit              │
         │  (User can resume with --resume)    │
         └────────────────────────────────────┘
```

---

## Interface Contracts

### Phase Interface

All phase modules MUST implement:

```typescript
interface Phase {
  // Properties
  id: string;                    // Unique phase identifier
  name: string;                  // Human-readable name
  dependencies: string[];        // Phase IDs that must complete first

  // Methods
  execute(context: Context): Promise<PhaseResult>;
  canExecute(context: Context): Promise<boolean>;
  cleanup(context: Context): Promise<void>;
}

interface PhaseResult {
  success: boolean;
  data?: object;
  warnings?: string[];
}

interface Context {
  tool: string;
  projectDir: string;
  options: {
    skipVersionCheck?: boolean;
    resume?: boolean;
    state?: object;
  };
  startTime: number;
  checkpoints: Checkpoint[];
}

interface Checkpoint {
  phase: string;
  result: PhaseResult;
  duration: number;
}
```

### Validator Interface

```typescript
interface Validator {
  validate(context: Context): Promise<ValidationResult>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

### Installer Interface

```typescript
interface Installer {
  install(options?: object): Promise<InstallResult>;
  isInstalled(): Promise<boolean>;
  uninstall(): Promise<void>;
}

interface InstallResult {
  success: boolean;
  version?: string;
  path?: string;
}
```

### Configurator Interface

```typescript
interface Configurator {
  configure(context: Context, options?: object): Promise<ConfigResult>;
  validate(): Promise<boolean>;
  reset(): Promise<void>;
}

interface ConfigResult {
  success: boolean;
  config: object;
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1, Day 1-3)

**Tasks**:
1. ✅ **Create `src/core/orchestrator.js`**
   - Implement basic phase execution loop
   - Add checkpoint management
   - Implement rollback logic
   - Add lifecycle hooks integration

2. ✅ **Create `src/core/lifecycle.js`**
   - Implement hook registration
   - Implement hook execution
   - Add error handling for hooks

3. ✅ **Create `src/core/state-manager.js`**
   - Implement checkpoint creation
   - Implement checkpoint loading
   - Implement rollback logic
   - Add file-based persistence

4. ✅ **Update `src/cli/commands/init.js`**
   - Integrate Orchestrator
   - Remove legacy logic
   - Add progress reporting

**Test Coverage**:
- Unit tests for Orchestrator (90%+)
- Unit tests for Lifecycle (90%+)
- Unit tests for StateManager (90%+)
- Integration test for phase execution

**Estimated Tokens**: ~15,000 tokens (implementation + tests)

---

### Phase 2: Phase Modules (Week 1, Day 4-5)

**Tasks**:
1. ✅ **Create `src/init/phases/phase0-preflight.js`**
   - System validator integration
   - Network validator integration
   - Permission checks

2. ✅ **Create `src/init/phases/phase1-dependencies.js`**
   - NPM installer integration
   - AgentDB installer integration
   - Claude-Flow installer integration
   - Parallel execution

3. ✅ **Create `src/init/phases/phase2-database.js`**
   - AgentDB initialization
   - Namespace creation
   - Pattern seeding

4. ✅ **Create `src/init/phases/phase3-coordination.js`**
   - Claude-Flow config
   - Git hooks installation
   - MCP server registration

5. ✅ **Create `src/init/phases/phase4-validation.js`**
   - Health check implementation
   - Parallel validation
   - Health score calculation

6. ✅ **Create `src/init/phases/phase5-postinit.js`**
   - Manifest generation
   - AgentDB episode storage
   - Success reporting

**Test Coverage**:
- Unit tests for each phase (90%+)
- Integration tests for phase dependencies
- E2E test for complete workflow

**Estimated Tokens**: ~25,000 tokens (implementation + tests)

---

### Phase 3: Support Modules (Week 2, Day 1-2)

**Tasks**:
1. ✅ **Create `src/init/validators/system-validator.js`**
   - Node.js version check
   - Git installation check
   - Permission validation

2. ✅ **Create `src/init/validators/network-validator.js`**
   - npm registry check
   - GitHub API check
   - Timeout handling

3. ✅ **Create `src/init/validators/health-validator.js`**
   - AgentDB health check
   - Claude-Flow health check
   - MCP server connectivity

4. ✅ **Create `src/init/installers/npm-installer.js`**
   - npm install wrapper
   - Progress reporting
   - Error handling

5. ✅ **Create `src/init/installers/agentdb-installer.js`**
   - Binary download
   - Platform detection
   - Checksum verification

6. ✅ **Create `src/init/installers/claude-flow-installer.js`**
   - Global npm install
   - Version verification
   - Compatibility check

7. ✅ **Create `src/init/configurators/agentdb-config.js`**
   - Database initialization
   - Namespace creation
   - Pattern seeding

8. ✅ **Create `src/init/configurators/claude-flow-config.js`**
   - Config file generation
   - Hooks installation
   - MCP registration

9. ✅ **Create `src/init/configurators/git-hooks-config.js`**
   - Hooks installation
   - Permission setting
   - Dry-run testing

**Test Coverage**:
- Unit tests for each module (90%+)
- Mock external dependencies
- Cross-platform compatibility tests

**Estimated Tokens**: ~20,000 tokens (implementation + tests)

---

### Phase 4: CLI Integration (Week 2, Day 3)

**Tasks**:
1. ✅ **Update `bin/vibe-to-docker.js`**
   - Reduce to thin wrapper (<50 lines)
   - Import CLI router
   - Error handling only

2. ✅ **Update `src/cli/index.js`**
   - Command routing
   - Flag parsing integration
   - Help text generation

3. ✅ **Add progress reporting**
   - Real-time phase progress
   - Checkpoint notifications
   - Health check results

**Test Coverage**:
- CLI integration tests
- Help text validation
- Error message formatting

**Estimated Tokens**: ~8,000 tokens (implementation + tests)

---

### Phase 5: Testing & Documentation (Week 2, Day 4-5)

**Tasks**:
1. ✅ **Create E2E tests**
   - Complete initialization workflow
   - Rollback scenarios
   - Resume from checkpoint
   - Cross-platform (Ubuntu, Windows, macOS)

2. ✅ **Create test fixtures**
   - Sample projects for each tool
   - Pre-configured checkpoints
   - Error scenarios

3. ✅ **Write Architecture Decision Records**
   - ADR-001: Orchestrator Pattern
   - ADR-002: Checkpoint System
   - ADR-003: Phase Dependencies
   - ADR-004: Rollback Strategy

4. ✅ **Update documentation**
   - User guide for init command
   - Developer guide for adding phases
   - Troubleshooting guide

**Test Coverage**:
- 90%+ overall code coverage
- All critical paths tested
- Cross-platform compatibility verified

**Estimated Tokens**: ~15,000 tokens (tests + docs)

---

### Total Estimated Effort

**Token Budget**: ~83,000 tokens
**Timeline**: 2 weeks (10 days)
**Files Created**: ~30 new files
**Files Modified**: ~5 existing files
**Test Coverage Target**: 90%+

---

## Architecture Decision Records

### ADR-001: Orchestrator Pattern

**Context**: Need coordinated multi-phase initialization with rollback capability

**Decision**: Implement Orchestrator pattern with lifecycle hooks

**Rationale**:
- Centralized coordination logic
- Easy to add new phases
- Clear checkpoint boundaries
- Testable in isolation

**Consequences**:
- ✅ Clear separation of concerns
- ✅ Easy to extend with new phases
- ✅ Rollback logic in one place
- ⚠️ Adds abstraction layer (slight complexity increase)

---

### ADR-002: File-Based Checkpoint System

**Context**: Need persistent state for resuming failed initializations

**Decision**: Use `.claude-flow/state/checkpoints.json` for checkpoint storage

**Rationale**:
- Simple to implement
- Human-readable (JSON)
- No external dependencies
- Easy to debug

**Consequences**:
- ✅ No database dependency for checkpoints
- ✅ Easy to inspect and debug
- ✅ Git-ignorable state directory
- ⚠️ Not suitable for concurrent initializations (single-user assumption)

**Alternatives Considered**:
- AgentDB storage: Too heavy for simple checkpoints
- In-memory only: No persistence across crashes
- SQLite: Overkill for this use case

---

### ADR-003: Sequential Phase Execution

**Context**: Phases have dependencies (e.g., database needs dependencies installed)

**Decision**: Execute phases sequentially, parallelize within phases

**Rationale**:
- Clear dependency order
- Easier error handling
- Predictable state transitions
- Individual phases can parallelize internally

**Consequences**:
- ✅ Simple to reason about
- ✅ Easy to add phase dependencies
- ✅ Clear checkpoint boundaries
- ⚠️ Longer total execution time vs. full parallelization
- ⚠️ Mitigated by parallelizing within phases (e.g., Phase 1 installs in parallel)

---

### ADR-004: Progressive Rollback Strategy

**Context**: Need to cleanup on failure without breaking existing setup

**Decision**: Each phase implements `cleanup()` method for rollback

**Rationale**:
- Phase knows best how to undo its changes
- Decentralized cleanup logic
- Can be tested independently

**Consequences**:
- ✅ Clean rollback per phase
- ✅ No global rollback logic
- ✅ Testable cleanup
- ⚠️ Each phase must implement cleanup correctly

---

## Integration Strategy

### Integration with Existing Codebase

**Minimal Changes Required**:

1. **`bin/vibe-to-docker.js`** (Currently 2,031 lines → Target: <50 lines)
   ```javascript
   #!/usr/bin/env node
   import { CLI } from '../src/cli/index.js';

   const cli = new CLI();
   cli.run(process.argv.slice(2))
     .catch(error => {
       console.error(error.message);
       process.exit(1);
     });
   ```

2. **`src/cli/commands/init.js`** (Already exists, needs Orchestrator integration)
   - Replace legacy logic with `orchestrator.initialize()`
   - Keep validation and UI logic
   - Add progress reporting

3. **New directories** (No conflicts with existing code)
   - `src/init/` - All new code
   - `tests/unit/init/` - New tests
   - `docs/architecture/` - New docs
   - `docs/adr/` - New ADRs

**No Breaking Changes**:
- All existing detectors work as-is
- Template system unchanged
- Version checking preserved
- CLI flags backward compatible

---

### Backward Compatibility

**Preserved Functionality**:
- ✅ `npx vibe-to-docker init --tool=figma-make` (same command)
- ✅ `--skip-version-check` flag (same behavior)
- ✅ `--dir=<path>` flag (same behavior)
- ✅ Auto-detection with `--tool=auto`
- ✅ Version checking (runAllChecks integration)

**New Functionality**:
- ✅ `--resume` flag (resume from checkpoint)
- ✅ Progress reporting during initialization
- ✅ Health checks after initialization
- ✅ Rollback on failure

---

## Testing Strategy

### Unit Testing

**Test Coverage by Module**:

1. **Core Modules** (90%+ coverage)
   - `orchestrator.js`: Phase execution, rollback, resume
   - `lifecycle.js`: Hook registration, hook execution
   - `state-manager.js`: Checkpoint CRUD operations

2. **Phase Modules** (90%+ coverage)
   - Each phase: execute(), canExecute(), cleanup()
   - Mocked dependencies (installers, configurators)
   - Error scenarios

3. **Support Modules** (90%+ coverage)
   - Validators: System, network, health checks
   - Installers: npm, AgentDB, Claude-Flow
   - Configurators: AgentDB, Claude-Flow, git hooks

**Testing Tools**:
- Jest (existing test framework)
- Mock file system operations
- Mock network calls
- Mock child_process.exec

---

### Integration Testing

**Test Scenarios**:

1. **Happy Path**
   - Complete initialization (all phases)
   - Verify all files created
   - Verify all configurations set
   - Verify health checks pass

2. **Error Scenarios**
   - Phase 1 failure → Rollback
   - Phase 3 failure → Rollback to Phase 2
   - Network failure → Graceful degradation

3. **Resume Scenarios**
   - Fail at Phase 2 → Resume from checkpoint
   - Verify phase 1-2 not re-executed

---

### E2E Testing

**Cross-Platform Matrix**:
- Ubuntu 22.04 + Node 20
- Ubuntu 22.04 + Node 22
- macOS 13 + Node 20
- macOS 13 + Node 22
- Windows 2022 + Node 20
- Windows 2022 + Node 22

**Test Fixtures**:
- `tests/fixtures/init-test-projects/figma-make/`
- `tests/fixtures/init-test-projects/lovable/`
- `tests/fixtures/init-test-projects/bolt/`
- `tests/fixtures/init-test-projects/v0/`
- `tests/fixtures/init-test-projects/replit/`

**E2E Test Cases**:
1. Initialize Figma Make project
2. Initialize Lovable project with auto-detection
3. Initialize Bolt project with version checks skipped
4. Rollback after Phase 2 failure
5. Resume from checkpoint

---

## Success Criteria

### Functional Requirements

- ✅ All 5 phases execute successfully
- ✅ Initialization completes in <90 seconds
- ✅ Rollback works on any phase failure
- ✅ Resume from checkpoint works
- ✅ All health checks pass
- ✅ No breaking changes to existing CLI

### Quality Requirements

- ✅ 90%+ test coverage on new code
- ✅ All E2E tests pass on 3 platforms
- ✅ No high/critical security vulnerabilities
- ✅ Zero ESLint errors
- ✅ TypeScript type checking passes

### Documentation Requirements

- ✅ 4+ Architecture Decision Records
- ✅ User guide for init command
- ✅ Developer guide for adding phases
- ✅ API documentation for all public interfaces
- ✅ Troubleshooting guide

### Performance Requirements

- ✅ Phase 0 (Pre-flight): <10 seconds
- ✅ Phase 1 (Dependencies): <30 seconds
- ✅ Phase 2 (Database): <15 seconds
- ✅ Phase 3 (Coordination): <20 seconds
- ✅ Phase 4 (Validation): <10 seconds
- ✅ Phase 5 (Post-init): <5 seconds
- ✅ Total: <90 seconds

---

## Next Steps

### Immediate Actions (Architect → Coder handoff)

**For the Coder Agent**:

1. **Read this architecture document** ✅
2. **Review interface contracts** (Phase, Validator, Installer, Configurator)
3. **Start with Phase 1**: Implement `src/core/orchestrator.js`
4. **Follow TDD**: Write tests first, then implementation
5. **Use TodoWrite**: Track progress with 8-10 todos

**Memory Coordination**:
```bash
# Architect stores design in memory
npx claude-flow@alpha memory store "architecture/init-system" "$(cat docs/INITIALIZATION_SYSTEM_ARCHITECTURE.md)"

# Coder retrieves design
npx claude-flow@alpha memory get "architecture/init-system"
```

**Key Files to Create (Priority Order)**:
1. `src/core/orchestrator.js` (Core engine)
2. `src/core/lifecycle.js` (Hooks)
3. `src/core/state-manager.js` (Checkpoints)
4. `src/init/phases/phase0-preflight.js` (First phase)
5. `tests/unit/core/orchestrator.test.js` (Tests)

**Estimated Timeline**:
- Week 1: Core infrastructure + Phase modules
- Week 2: Support modules + Testing + Documentation

---

## Appendix

### File Size Estimates

| File | Lines of Code | Test Lines |
|------|---------------|------------|
| orchestrator.js | 250 | 300 |
| lifecycle.js | 80 | 100 |
| state-manager.js | 150 | 200 |
| phase0-preflight.js | 120 | 150 |
| phase1-dependencies.js | 180 | 200 |
| phase2-database.js | 150 | 180 |
| phase3-coordination.js | 200 | 220 |
| phase4-validation.js | 180 | 200 |
| phase5-postinit.js | 120 | 150 |
| system-validator.js | 150 | 180 |
| network-validator.js | 100 | 120 |
| health-validator.js | 150 | 180 |
| npm-installer.js | 120 | 150 |
| agentdb-installer.js | 180 | 200 |
| claude-flow-installer.js | 150 | 180 |
| agentdb-config.js | 200 | 220 |
| claude-flow-config.js | 250 | 280 |
| git-hooks-config.js | 120 | 150 |
| **TOTAL** | **2,850** | **3,360** |

**All files under 500 lines** ✅

---

**Architecture Design Complete**: ✅
**Ready for Implementation**: ✅
**Coder Agent**: Ready to begin coding

---

*Architecture designed by: System Architecture Designer*
*Date: November 20, 2025*
*Version: 1.0.0*
*Status: APPROVED FOR IMPLEMENTATION*
