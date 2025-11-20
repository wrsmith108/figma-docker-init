# ADR-008: 5-Phase Initialization System with Byzantine Fault Tolerance

**Status**: Accepted
**Date**: November 20, 2025
**Deciders**: System Architecture Designer, RequirementsAnalyst
**Task**: Architecture design for init command enhancement

---

## Context

The vibe-to-docker project needs a robust initialization system that:

1. **Deterministic**: Always produces the same result in the same environment
2. **Recoverable**: Can resume from failures without starting over
3. **Observable**: Provides real-time progress reporting
4. **Secure**: Validates all operations before execution
5. **Fast**: Completes in under 90 seconds

**Current State (v5.0.0)**:
- Monolithic 1900-line CLI file
- No checkpoint system for partial failures
- Manual recovery from errors
- Unclear initialization state
- Difficult to test and maintain

**Problems**:
- If initialization fails at 80%, must restart from 0%
- No way to know which components succeeded/failed
- Rollback is manual and error-prone
- Testing requires full end-to-end runs

---

## Decision

Implement a **5-phase initialization system** with:

### Phase 0: Pre-Flight Validation (5-10s)
**Purpose**: Validate environment before any modifications

**Checks**:
- Node.js ≥20.8.1
- Git installed
- Platform detection (Windows/macOS/Linux)
- Write permissions (project root, ~/.config, .claude-flow/)
- Network connectivity (npm registry, GitHub API - optional)

**Rollback**: None (no modifications made)

### Phase 1: Core Dependencies (15-30s) [PARALLEL]
**Purpose**: Install all required dependencies concurrently

**Tasks**:
1. npm install (production + dev dependencies)
2. AgentDB binary download (platform-specific)
3. Claude-Flow installation (global CLI)

**Validation**:
- node_modules/ exists
- agentdb binary executable
- claude-flow CLI responds to --version

**Rollback**: Remove node_modules, uninstall binaries

### Phase 2: Database & Storage (10-15s) [SEQUENTIAL]
**Purpose**: Initialize persistent storage and memory systems

**Tasks**:
1. AgentDB initialization (./agentdb.db)
2. Vector schema creation
3. HNSW index (M=16, efConstruction=200)
4. Namespace creation (learning, ci-cd/failures, swarm-coordination)
5. Default pattern storage

**Validation**:
- agentdb.db exists
- Query test succeeds (<50ms)
- All namespaces created
- Default patterns stored (count ≥2)

**Rollback**: Remove agentdb.db, state directory

### Phase 3: Coordination Infrastructure (10-20s) [SEQUENTIAL]
**Purpose**: Configure swarm coordination, MCP servers, git hooks

**Tasks**:
1. Claude-Flow config (.claude-flow/config.json)
2. MCP server registration (claude-flow, ruv-swarm, flow-nexus)
3. Git hooks installation (pre-commit, pre-push, post-failure)

**Validation**:
- config.json valid
- MCP servers registered
- Git hooks executable

**Rollback**: Remove config, unregister MCP servers, remove hooks

### Phase 4: Validation & Health Checks (5-10s) [PARALLEL]
**Purpose**: Verify all components are healthy

**Health Checks**:
1. AgentDB query latency <50ms
2. Claude-Flow status = "healthy"
3. MCP servers respond to tools
4. Git hooks execute without errors (dry-run)
5. Memory store returns default patterns

**Validation**:
- All checks pass (warnings non-blocking)

**Rollback**: None (validation only)

### Phase 5: Post-Init Configuration (5s)
**Purpose**: Create initialization manifest and display success

**Tasks**:
1. Create init-manifest.json
2. Store initialization episode in AgentDB
3. Generate health report
4. Display success summary

**Validation**:
- Manifest created with checksum
- Episode stored in AgentDB

**Rollback**: Remove manifest

---

## Consequences

### Positive

1. **Fault Tolerance**
   - Can resume from last successful checkpoint
   - Automatic rollback on failure
   - Retry logic with exponential backoff

2. **Observability**
   - Real-time progress reporting
   - Detailed health metrics
   - Checkpoints stored in `.claude-flow/state/checkpoints.json`

3. **Performance**
   - Parallel execution where possible (Phase 1, Phase 4)
   - 45-90 second total duration
   - Incremental validation

4. **Testability**
   - Each phase can be tested independently
   - Mock checkpoints for test scenarios
   - Rollback verification tests

5. **Maintainability**
   - Clear separation of concerns
   - Each phase in separate module
   - Well-defined interfaces

### Negative

1. **Complexity**
   - 5 phase modules vs single init function
   - Checkpoint management overhead
   - Rollback logic for each phase

2. **Disk I/O**
   - Checkpoint file written 5 times
   - State directory creation
   - Manifest generation

3. **Testing Burden**
   - Must test all 5 phases
   - Must test rollback scenarios
   - Must test checkpoint resume

### Risk Mitigation

**Checkpoint Corruption**:
- Write to temp file, then atomic rename
- Checksum validation on read
- Fallback to last known good checkpoint

**Partial Rollback Failure**:
- Log rollback errors to .claude-flow/state/rollback-history.json
- Continue rollback even if one step fails
- Report incomplete rollback in health report

**Performance Regression**:
- Benchmark each phase in CI
- Alert if total duration exceeds 90s
- Profile slow operations

---

## Alternatives Considered

### Alternative 1: Single-Phase Monolithic Init

**Pros**:
- Simpler implementation
- No checkpoint overhead
- Easier to understand

**Cons**:
- Must restart from scratch on failure
- No incremental validation
- Difficult to test
- Poor observability

**Why Rejected**: Current state already has these problems. Need better fault tolerance.

### Alternative 2: 3-Phase System (Setup, Validate, Finalize)

**Pros**:
- Simpler than 5 phases
- Still provides checkpoints
- Easier to test

**Cons**:
- Less granular rollback
- Larger validation overhead per phase
- Harder to parallelize

**Why Rejected**: Not granular enough for precise rollback and parallel execution optimization.

### Alternative 3: Transaction-Based System (All-or-Nothing)

**Pros**:
- Atomic operations
- No partial state
- Clean rollback

**Cons**:
- Must complete all phases before commit
- No incremental progress reporting
- Slower (no parallelization)

**Why Rejected**: 45-90 second all-or-nothing transaction is poor UX. Users want progress updates.

---

## Implementation Plan

### Week 1: Core Infrastructure
- [ ] Checkpoint manager (`src/core/checkpoint-manager.js`)
- [ ] Rollback system (`src/core/rollback-manager.js`)
- [ ] Retry logic (`src/core/retry-handler.js`)
- [ ] Phase validators (`src/init/phase-validator.js`)

### Week 2: Phase Implementations
- [ ] Phase 0: Pre-flight (`src/init/phase-0-preflight.js`)
- [ ] Phase 1: Dependencies (`src/init/phase-1-dependencies.js`)
- [ ] Phase 2: Storage (`src/init/phase-2-storage.js`)
- [ ] Phase 3: Coordination (`src/init/phase-3-coordination.js`)
- [ ] Phase 4: Validation (`src/init/phase-4-validation.js`)
- [ ] Phase 5: Post-init (`src/init/phase-5-post-init.js`)

### Week 3: Testing
- [ ] Unit tests for each phase
- [ ] Integration tests for checkpoint system
- [ ] Rollback scenario tests
- [ ] Cross-platform tests (Windows/macOS/Linux)

### Week 4: Documentation
- [ ] User guide for initialization
- [ ] Troubleshooting guide
- [ ] Developer guide for adding new phases
- [ ] Migration guide from v5.0.x

---

## Success Metrics

**Functional**:
- [ ] All 5 phases implemented
- [ ] Checkpoint system working (resume from any phase)
- [ ] Rollback tested for all phases
- [ ] Total duration 45-90 seconds

**Quality**:
- [ ] 80%+ test coverage
- [ ] Zero flaky tests
- [ ] 100% CI success rate
- [ ] Cross-platform compatibility

**Performance**:
- [ ] Phase 0: <10s
- [ ] Phase 1: <30s
- [ ] Phase 2: <15s
- [ ] Phase 3: <20s
- [ ] Phase 4: <10s
- [ ] Phase 5: <5s
- [ ] Total: <90s

**Observability**:
- [ ] Real-time progress reporting
- [ ] Health metrics collected
- [ ] Checkpoint file created
- [ ] Success summary displayed

---

## References

- **System Architecture**: `docs/SYSTEM_ARCHITECTURE.md`
- **Initialization Guide**: `docs/guides/INITIALIZATION_GUIDE.md` (to be created)
- **Checkpoint Schema**: `.claude-flow/state/checkpoints.json`
- **Health Report**: `.claude-flow/state/health-report.json`
- **AgentDB Memory**: `agentdb.db` (namespaces: learning, ci-cd/failures)

---

## Appendix: Checkpoint File Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$" },
    "lastUpdate": { "type": "string", "format": "date-time" },
    "checkpoints": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "phase": { "type": "integer", "minimum": 0, "maximum": 5 },
          "name": { "type": "string", "enum": ["pre-flight", "dependencies", "storage", "coordination", "validation", "post-init"] },
          "status": { "type": "string", "enum": ["pending", "in-progress", "completed", "failed"] },
          "timestamp": { "type": "string", "format": "date-time" },
          "duration": { "type": "integer", "minimum": 0 },
          "validation": { "type": "object" },
          "error": { "type": "object" }
        },
        "required": ["phase", "name", "status", "timestamp"]
      }
    },
    "currentPhase": { "type": "integer", "minimum": 0, "maximum": 5 },
    "totalDuration": { "type": "integer", "minimum": 0 },
    "errors": { "type": "array" }
  },
  "required": ["version", "lastUpdate", "checkpoints", "currentPhase"]
}
```

---

**ADR Status**: ✅ ACCEPTED
**Implementation Status**: 🔄 IN PROGRESS
**Next Review**: Week 2 - After phase implementations
