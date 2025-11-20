# Component Interaction Design
## vibe-to-docker Initialization System

**Version**: 2.0.0
**Date**: November 20, 2025
**Related**: SYSTEM_ARCHITECTURE.md, ADR-008

---

## Overview

This document details the interaction patterns between components in the vibe-to-docker initialization system. It provides sequence diagrams, data flow charts, and interaction protocols for the 5-phase initialization workflow.

---

## 1. Initialization Sequence Diagram

### Full 5-Phase Workflow

```
User → CLI → Orchestrator → Phases → Components → Storage

┌──────┐
│ User │
└───┬──┘
    │ npx vibe-to-docker init --tool=lovable
    ↓
┌──────────────────────┐
│ bin/vibe-to-docker.js│
└───────┬──────────────┘
        │ run(args)
        ↓
┌──────────────────────┐
│  src/cli/index.js    │
│  - Parse arguments   │
│  - Route command     │
└───────┬──────────────┘
        │ execute({ tool: 'lovable', projectDir: '.' })
        ↓
┌────────────────────────────────────────────────────────┐
│  src/cli/commands/init.js                              │
│  - Validate inputs                                     │
│  - Create orchestrator                                 │
└────────┬───────────────────────────────────────────────┘
         │ initialize(tool, projectDir, options)
         ↓
┌────────────────────────────────────────────────────────┐
│  src/core/orchestrator.js                              │
│  - Load checkpoint state                               │
│  - Execute phases sequentially                         │
└────────┬───────────────────────────────────────────────┘
         │
         ├──→ Phase 0: Pre-Flight (5-10s)
         │    ┌──────────────────────────────────────────┐
         │    │ src/init/phase-0-preflight.js            │
         │    │ - Check Node.js version (≥20.8.1)        │
         │    │ - Verify Git installation                │
         │    │ - Test file permissions                  │
         │    │ - Detect platform (darwin/linux/win32)   │
         │    └──────────┬───────────────────────────────┘
         │               │ ✓ Checkpoint 0 saved
         │               ↓
         ├──→ Phase 1: Dependencies (15-30s) [PARALLEL]
         │    ┌──────────────────────────────────────────┐
         │    │ src/init/phase-1-dependencies.js         │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Thread 1: npm   │                     │
         │    │ │ npm install     │                     │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Thread 2: AgentDB│                    │
         │    │ │ Download binary │                     │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Thread 3: Claude│                     │
         │    │ │ Install CLI     │                     │
         │    │ └─────────────────┘                     │
         │    └──────────┬───────────────────────────────┘
         │               │ ✓ Checkpoint 1 saved
         │               ↓
         ├──→ Phase 2: Storage (10-15s) [SEQUENTIAL]
         │    ┌──────────────────────────────────────────┐
         │    │ src/init/phase-2-storage.js              │
         │    │                                          │
         │    │ Step 1: AgentDB Init                    │
         │    │   → Create agentdb.db                   │
         │    │   → Initialize schema                   │
         │    │                                          │
         │    │ Step 2: HNSW Index                      │
         │    │   → Build index (M=16, ef=200)          │
         │    │                                          │
         │    │ Step 3: Namespaces                      │
         │    │   → learning                            │
         │    │   → ci-cd/failures                      │
         │    │   → swarm-coordination                  │
         │    │                                          │
         │    │ Step 4: Default Patterns                │
         │    │   → Cross-platform paths                │
         │    │   → Timing assumptions                  │
         │    │   → Test assertion patterns             │
         │    └──────────┬───────────────────────────────┘
         │               │ ✓ Checkpoint 2 saved
         │               ↓
         ├──→ Phase 3: Coordination (10-20s) [SEQUENTIAL]
         │    ┌──────────────────────────────────────────┐
         │    │ src/init/phase-3-coordination.js         │
         │    │                                          │
         │    │ Step 1: Claude-Flow Config              │
         │    │   → .claude-flow/config.json            │
         │    │   → Set topology: hierarchical          │
         │    │   → Set maxAgents: 7                    │
         │    │                                          │
         │    │ Step 2: MCP Servers                     │
         │    │   → claude-flow (required)              │
         │    │   → ruv-swarm (optional)                │
         │    │   → flow-nexus (optional)               │
         │    │                                          │
         │    │ Step 3: Git Hooks                       │
         │    │   → .claude-flow/hooks/pre-commit       │
         │    │   → .claude-flow/hooks/pre-push         │
         │    │   → .claude-flow/hooks/post-failure     │
         │    │   → chmod +x hooks/*                    │
         │    └──────────┬───────────────────────────────┘
         │               │ ✓ Checkpoint 3 saved
         │               ↓
         ├──→ Phase 4: Validation (5-10s) [PARALLEL]
         │    ┌──────────────────────────────────────────┐
         │    │ src/init/phase-4-validation.js           │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ AgentDB Health  │ <50ms query        │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Claude-Flow     │ status check       │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ MCP Servers     │ connectivity       │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Git Hooks       │ dry-run test       │
         │    │ └─────────────────┘                     │
         │    │                                          │
         │    │ ┌─────────────────┐                     │
         │    │ │ Memory Store    │ pattern query      │
         │    │ └─────────────────┘                     │
         │    └──────────┬───────────────────────────────┘
         │               │ ✓ Checkpoint 4 saved
         │               ↓
         └──→ Phase 5: Post-Init (5s)
              ┌──────────────────────────────────────────┐
              │ src/init/phase-5-post-init.js            │
              │ - Create init-manifest.json              │
              │ - Store episode in AgentDB               │
              │ - Generate health report                 │
              │ - Display success summary                │
              └──────────┬───────────────────────────────┘
                         │ ✓ Initialization Complete
                         ↓
                  ┌─────────────────┐
                  │  Success! 🎉    │
                  │  Total: 52.3s   │
                  │  Checkpoints: 5 │
                  │  Errors: 0      │
                  └─────────────────┘
```

---

## 2. Data Flow Architecture

### Checkpoint State Flow

```
┌────────────────────────────────────────────────────────────┐
│                     Checkpoint Manager                      │
│                (.claude-flow/state/checkpoints.json)        │
└────────────────────────┬───────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────┐      ┌────────┐      ┌────────┐
   │ Phase  │      │ Phase  │      │ Phase  │
   │   0    │──────│   1    │──────│   2    │
   └────┬───┘      └────┬───┘      └────┬───┘
        │               │               │
        │ save()        │ save()        │ save()
        ↓               ↓               ↓
   ┌────────────────────────────────────────┐
   │  Checkpoint Data                       │
   │  {                                     │
   │    "phase": 1,                         │
   │    "status": "completed",              │
   │    "timestamp": "2025-11-20T...",      │
   │    "duration": 28300,                  │
   │    "validation": {                     │
   │      "npmInstallSuccess": true,        │
   │      "agentdbBinaryDownloaded": true   │
   │    }                                   │
   │  }                                     │
   └────────────────────────────────────────┘
```

### Memory Coordination Flow

```
┌─────────────────────────────────────────────────────────┐
│                   AgentDB Memory Store                   │
│                    (agentdb.db)                          │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐     ┌─────────┐     ┌─────────┐
   │learning │     │ci-cd/   │     │swarm-   │
   │         │     │failures │     │coord    │
   └────┬────┘     └────┬────┘     └────┬────┘
        │               │               │
        │               │               │
   Architecture    CI patterns    Agent states
   decisions       learned        coordination
```

---

## 3. Component Communication Protocols

### 3.1 Orchestrator ↔ Phase Modules

**Interface**:
```javascript
interface PhaseModule {
  // Execute phase logic
  async execute(context: PhaseContext): Promise<PhaseResult>;

  // Validate phase preconditions
  async validate(context: PhaseContext): Promise<ValidationResult>;

  // Rollback phase changes
  async rollback(context: PhaseContext): Promise<RollbackResult>;
}

interface PhaseContext {
  projectDir: string;
  checkpointManager: CheckpointManager;
  logger: Logger;
  dryRun: boolean;
}

interface PhaseResult {
  success: boolean;
  duration: number;
  validation: Record<string, any>;
  error?: Error;
}
```

**Example Usage**:
```javascript
// src/core/orchestrator.js
async executePhase(phaseNumber, phaseModule) {
  const context = {
    projectDir: this.projectDir,
    checkpointManager: this.checkpointManager,
    logger: this.logger,
    dryRun: this.options.dryRun
  };

  // Load checkpoint
  const checkpoint = await this.checkpointManager.load(phaseNumber);
  if (checkpoint?.status === 'completed') {
    this.logger.info(`Phase ${phaseNumber} already completed, skipping`);
    return checkpoint;
  }

  // Validate preconditions
  const validationResult = await phaseModule.validate(context);
  if (!validationResult.success) {
    throw new Error(`Phase ${phaseNumber} validation failed: ${validationResult.error}`);
  }

  // Execute phase
  const startTime = Date.now();
  try {
    const result = await phaseModule.execute(context);
    const duration = Date.now() - startTime;

    // Save checkpoint
    await this.checkpointManager.save({
      phase: phaseNumber,
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration,
      validation: result.validation
    });

    return result;
  } catch (error) {
    // Rollback on failure
    await phaseModule.rollback(context);

    // Save failed checkpoint
    await this.checkpointManager.save({
      phase: phaseNumber,
      status: 'failed',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      error: { message: error.message, stack: error.stack }
    });

    throw error;
  }
}
```

### 3.2 Phase Modules ↔ External Services

**AgentDB Communication**:
```javascript
// src/init/phase-2-storage.js
import { AgentDB } from 'agentdb';

export class Phase2Storage {
  async execute(context) {
    const dbPath = path.join(context.projectDir, 'agentdb.db');

    // Initialize AgentDB
    const db = new AgentDB(dbPath);
    await db.initialize();

    // Create HNSW index
    await db.createIndex({
      type: 'hnsw',
      M: 16,
      efConstruction: 200
    });

    // Create namespaces
    const namespaces = ['learning', 'ci-cd/failures', 'swarm-coordination'];
    for (const namespace of namespaces) {
      await db.createNamespace(namespace);
    }

    // Verify health
    const healthCheck = await db.query('SELECT 1', { timeout: 50 });
    if (healthCheck.latency > 50) {
      context.logger.warn(`AgentDB query latency ${healthCheck.latency}ms exceeds 50ms target`);
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      validation: {
        dbExists: fs.existsSync(dbPath),
        queryLatency: healthCheck.latency,
        namespacesCreated: namespaces.length
      }
    };
  }
}
```

**Claude-Flow Communication**:
```javascript
// src/init/phase-3-coordination.js
import { execSync } from 'child_process';

export class Phase3Coordination {
  async execute(context) {
    // Create config file
    const config = {
      topology: 'hierarchical',
      maxAgents: 7,
      strategy: 'balanced',
      hooks: {
        enabled: true,
        preTask: true,
        postTask: true,
        postEdit: true
      }
    };

    const configPath = path.join(
      context.projectDir,
      '.claude-flow/config.json'
    );
    await fs.promises.writeFile(
      configPath,
      JSON.stringify(config, null, 2)
    );

    // Verify Claude-Flow installation
    try {
      const version = execSync('npx claude-flow@alpha --version', {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();

      context.logger.info(`Claude-Flow version: ${version}`);
    } catch (error) {
      throw new Error(`Claude-Flow not installed: ${error.message}`);
    }

    return {
      success: true,
      validation: {
        configCreated: fs.existsSync(configPath),
        claudeFlowInstalled: true
      }
    };
  }
}
```

---

## 4. Error Handling & Rollback

### 4.1 Error Propagation

```
Phase Execution Error
        ↓
Catch in Orchestrator
        ↓
Trigger Rollback
        ↓
Save Failed Checkpoint
        ↓
Log Error Details
        ↓
Display User-Friendly Message
```

### 4.2 Rollback Sequence

```javascript
// src/core/rollback-manager.js
export class RollbackManager {
  async rollbackPhase(phase, context) {
    const rollbackActions = {
      0: async () => {
        // No rollback needed - no modifications
        return { success: true, message: 'Pre-flight only' };
      },

      1: async () => {
        // Remove dependencies
        await this.removeNodeModules(context.projectDir);
        await this.uninstallAgentDB();
        await this.uninstallClaudeFlow();
        return { success: true, message: 'Dependencies removed' };
      },

      2: async () => {
        // Remove database
        await this.removeAgentDB(context.projectDir);
        await this.removeStateDirectory(context.projectDir);
        return { success: true, message: 'Storage cleaned up' };
      },

      3: async () => {
        // Remove coordination
        await this.removeClaudeFlowConfig(context.projectDir);
        await this.unregisterMCPServers();
        await this.removeGitHooks(context.projectDir);
        return { success: true, message: 'Coordination removed' };
      },

      4: async () => {
        // No rollback needed - validation only
        return { success: true, message: 'Validation only' };
      },

      5: async () => {
        // Remove manifest
        await this.removeInitManifest(context.projectDir);
        return { success: true, message: 'Manifest removed' };
      }
    };

    const action = rollbackActions[phase];
    if (!action) {
      throw new Error(`Unknown phase: ${phase}`);
    }

    try {
      const result = await action();
      context.logger.info(`Rollback phase ${phase}: ${result.message}`);
      return result;
    } catch (error) {
      context.logger.error(`Rollback phase ${phase} failed: ${error.message}`);
      throw error;
    }
  }
}
```

---

## 5. Parallel Execution Coordination

### 5.1 Phase 1: Dependencies (Parallel)

```javascript
// src/init/phase-1-dependencies.js
export class Phase1Dependencies {
  async execute(context) {
    const startTime = Date.now();

    // Execute all dependency installations in parallel
    const results = await Promise.allSettled([
      this.installNpmDependencies(context),
      this.downloadAgentDBBinary(context),
      this.installClaudeFlow(context)
    ]);

    // Check for failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      const errors = failures.map(f => f.reason.message).join(', ');
      throw new Error(`Dependency installation failed: ${errors}`);
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      validation: {
        npmInstallSuccess: results[0].status === 'fulfilled',
        agentdbBinaryDownloaded: results[1].status === 'fulfilled',
        claudeFlowInstalled: results[2].status === 'fulfilled'
      }
    };
  }

  async installNpmDependencies(context) {
    return new Promise((resolve, reject) => {
      exec('npm install', { cwd: context.projectDir }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`npm install failed: ${stderr}`));
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async downloadAgentDBBinary(context) {
    // Check if already installed
    try {
      execSync('npx agentdb@latest --version', { stdio: 'ignore' });
      return { alreadyInstalled: true };
    } catch {
      // Not installed, download
      execSync('npx agentdb@latest --help', { stdio: 'ignore' });
      return { downloaded: true };
    }
  }

  async installClaudeFlow(context) {
    execSync('npm install -g claude-flow@alpha', { stdio: 'pipe' });
    return { installed: true };
  }
}
```

### 5.2 Phase 4: Validation (Parallel)

```javascript
// src/init/phase-4-validation.js
export class Phase4Validation {
  async execute(context) {
    const startTime = Date.now();

    // Execute all health checks in parallel
    const healthChecks = await Promise.allSettled([
      this.checkAgentDBHealth(context),
      this.checkClaudeFlowStatus(context),
      this.checkMCPServerConnectivity(context),
      this.checkGitHooksExecution(context),
      this.checkMemoryStoreQuery(context)
    ]);

    // Aggregate results
    const results = {
      agentdb: healthChecks[0].status === 'fulfilled' ? healthChecks[0].value : null,
      claudeFlow: healthChecks[1].status === 'fulfilled' ? healthChecks[1].value : null,
      mcpServers: healthChecks[2].status === 'fulfilled' ? healthChecks[2].value : null,
      gitHooks: healthChecks[3].status === 'fulfilled' ? healthChecks[3].value : null,
      memoryStore: healthChecks[4].status === 'fulfilled' ? healthChecks[4].value : null
    };

    // Check for critical failures
    const failures = healthChecks.filter(r => r.status === 'rejected');
    if (failures.length > 2) {
      throw new Error(`Health checks failed: ${failures.length}/5 checks failed`);
    }

    return {
      success: true,
      duration: Date.now() - startTime,
      validation: results
    };
  }

  async checkAgentDBHealth(context) {
    const db = new AgentDB(path.join(context.projectDir, 'agentdb.db'));
    const start = Date.now();
    await db.query('SELECT 1');
    const latency = Date.now() - start;

    return {
      healthy: latency < 50,
      latency,
      target: 50
    };
  }
}
```

---

## 6. Integration Testing Strategy

### 6.1 Mock Checkpoint State

```javascript
// tests/integration/init-workflows/resume-from-checkpoint.test.js
describe('Checkpoint Resume', () => {
  it('should resume from Phase 2 after Phase 1 failure', async () => {
    // Setup: Create checkpoint with Phase 0 and Phase 1 completed
    const checkpointManager = new CheckpointManager(projectDir);
    await checkpointManager.save({
      phase: 0,
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: 8500
    });
    await checkpointManager.save({
      phase: 1,
      status: 'completed',
      timestamp: new Date().toISOString(),
      duration: 28300
    });

    // Execute initialization (should skip Phase 0 and Phase 1)
    const orchestrator = new Orchestrator(projectDir);
    const result = await orchestrator.initialize('lovable', projectDir);

    // Verify Phase 0 and Phase 1 were skipped
    expect(result.phasesExecuted).not.toContain(0);
    expect(result.phasesExecuted).not.toContain(1);
    expect(result.phasesExecuted).toContain(2);
  });
});
```

---

**Document Version**: 2.0.0
**Last Updated**: November 20, 2025
**Status**: ✅ COMPLETE
**Related**: SYSTEM_ARCHITECTURE.md, ADR-008, ARCHITECTURE_SUMMARY.md
