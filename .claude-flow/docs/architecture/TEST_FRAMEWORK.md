# Test Framework for Initialization System

**Version**: 1.0.0
**Created**: November 20, 2025
**Agent**: QA Engineer
**Status**: ✅ READY FOR IMPLEMENTATION

---

## Executive Summary

This document describes the comprehensive test framework created for the vibe-to-docker initialization system. The framework provides **complete test coverage** for the planned modular CLI architecture, ensuring quality and preventing regressions.

### Test Coverage Summary

| Component | Unit Tests | Integration Tests | E2E Tests | Total Tests |
|-----------|-----------|-------------------|-----------|-------------|
| CLI Commands | ✅ 45+ | ✅ 5+ | ✅ 15+ | **65+** |
| Core Orchestrator | ✅ 35+ | ✅ 8+ | N/A | **43+** |
| Core Lifecycle | ✅ 30+ | ✅ 6+ | N/A | **36+** |
| Full Workflows | N/A | ✅ 12+ | ✅ 25+ | **37+** |
| **TOTAL** | **110+** | **31+** | **40+** | **181+** |

---

## Test Files Created

### Unit Tests

#### 1. CLI Command Tests (`tests/unit/cli/commands/init.test.js`)

**Purpose**: Test the `init` command handler
**Coverage**: 45+ test cases
**Target Implementation**: `src/cli/commands/init.js` (PENDING)

**Test Categories**:
- ✅ Command metadata and structure
- ✅ Argument parsing (`--tool`, `--force`, `--dry-run`, `--skip-version-check`)
- ✅ Execution flow and orchestrator delegation
- ✅ Tool detection (auto vs explicit)
- ✅ Pre-flight checks integration
- ✅ Progress reporting
- ✅ Error recovery and user-friendly messages
- ✅ Orchestrator integration

**Key Test Scenarios**:
```javascript
// Argument parsing
test('should parse --tool flag correctly')
test('should default to auto tool detection')
test('should parse multiple flags together')

// Execution flow
test('should call orchestrator initialize with correct params')
test('should handle initialization errors gracefully')
test('should respect dry-run mode')

// Tool detection
test('should auto-detect tool when tool=auto')
test('should skip detection when tool is explicitly specified')

// Error handling
test('should provide actionable error messages')
test('should suggest fixes for common errors')
```

---

#### 2. Core Orchestrator Tests (`tests/unit/core/orchestrator.test.js`)

**Purpose**: Test the 5-phase initialization orchestration system
**Coverage**: 35+ test cases
**Target Implementation**: `src/core/orchestrator.js` (PENDING)

**Test Categories**:
- ✅ 5-phase initialization system
  - Phase 0: Pre-Flight Validation
  - Phase 1: Tool Detection
  - Phase 2: Project Analysis
  - Phase 3: Template Generation
  - Phase 4: File Writing
  - Phase 5: Post-Setup Validation
- ✅ Initialize method with phase sequencing
- ✅ Checkpoint system
- ✅ Rollback procedures
- ✅ Performance requirements (< 90 seconds)
- ✅ Lifecycle hooks integration

**Key Test Scenarios**:
```javascript
// 5-Phase System
test('Phase 0: Pre-Flight Validation')
test('Phase 1: Tool Detection')
test('Phase 2: Project Analysis')
test('Phase 3: Template Generation')
test('Phase 4: File Writing')
test('Phase 5: Post-Setup Validation')

// Initialize method
test('should execute all phases in correct order')
test('should handle phase failures gracefully')
test('should support force option to overwrite existing files')

// Checkpoint system
test('should save checkpoint after each phase')
test('should restore from checkpoint on failure')

// Rollback
test('should rollback changes on failure')

// Performance
test('should complete initialization in under 90 seconds')

// Lifecycle integration
test('should trigger lifecycle hooks at each phase')
```

---

#### 3. Core Lifecycle Tests (`tests/unit/core/lifecycle.test.js`)

**Purpose**: Test lifecycle management and Claude-Flow hooks integration
**Coverage**: 30+ test cases
**Target Implementation**: `src/core/lifecycle.js` (PENDING)

**Test Categories**:
- ✅ Hook registry (register, trigger, list)
- ✅ Lifecycle execution with hooks
- ✅ Claude-Flow integration
  - Pre-task hooks
  - Post-task hooks
  - Session state storage
  - Session restoration
- ✅ Session management
- ✅ Metrics collection
- ✅ Error handling in lifecycle

**Key Test Scenarios**:
```javascript
// Hook registry
test('should register hooks correctly')
test('should list all registered hooks')
test('should trigger hooks with correct data')

// Lifecycle execution
test('should execute full lifecycle with hooks')
test('should trigger phase hooks during execution')
test('should handle hook execution errors')

// Claude-Flow integration
test('should integrate with Claude-Flow pre-task hook')
test('should integrate with Claude-Flow post-task hook')
test('should store session state in memory')
test('should restore session state from memory')

// Session management
test('should create new session on execute')
test('should update session on phase completion')
test('should finalize session on completion')

// Metrics
test('should collect metrics during execution')
test('should export metrics on session end')

// Error handling
test('should handle orchestrator errors gracefully')
```

---

### Integration Tests

#### 4. Initialization Integration Tests (`tests/integration/init-integration.test.js`)

**Purpose**: Test integration between CLI, Orchestrator, and Lifecycle components
**Coverage**: 31+ test cases

**Test Categories**:
- ✅ CLI → Orchestrator integration
- ✅ Orchestrator → Lifecycle integration
- ✅ Lifecycle → Memory integration
- ✅ Orchestrator → Checkpoint System integration
- ✅ Full stack integration
- ✅ State management integration

**Key Test Scenarios**:
```javascript
// CLI → Orchestrator
test('should pass options from CLI to Orchestrator')
test('should handle orchestrator errors in CLI layer')

// Orchestrator → Lifecycle
test('should trigger lifecycle hooks during orchestration')
test('should pass orchestrator data through lifecycle hooks')

// Lifecycle → Memory
test('should store session data in memory via lifecycle')
test('should retrieve session data from memory')

// Checkpoint System
test('should save checkpoints during orchestration')
test('should restore orchestration from checkpoint')
test('should persist checkpoints to filesystem')
test('should load checkpoints from filesystem')

// Full Stack
test('should complete full initialization with all components')
test('should handle errors across component boundaries')

// State Management
test('should maintain state across components')
```

---

### End-to-End Tests

#### 5. Full Initialization Workflow E2E Tests (`tests/e2e/init-workflows/full-init-workflow.test.js`)

**Purpose**: Test complete user-facing initialization workflows
**Coverage**: 40+ test cases
**Scope**: Full `npx vibe-to-docker init` workflows

**Test Categories**:
- ✅ Figma Make initialization
- ✅ Lovable initialization
- ✅ Bolt initialization
- ✅ V0 initialization
- ✅ Replit initialization
- ✅ Initialization performance (< 90 seconds)
- ✅ Error scenarios
- ✅ Checkpoint system E2E

**Key Test Scenarios**:
```javascript
// Tool-specific workflows
test('should complete full initialization for Figma Make project')
test('should auto-detect Figma Make without explicit --tool flag')
test('should complete full initialization for Lovable project')
test('should complete full initialization for Bolt project')
test('should complete full initialization for V0 project')
test('should complete full initialization for Replit project')

// Performance
test('should complete initialization in under 90 seconds')

// Error scenarios
test('should fail gracefully when no package.json exists')
test('should fail when files already exist without --force')
test('should succeed when files exist with --force flag')

// Checkpoint system
test('should save checkpoints during initialization')
test('should restore from checkpoint after failure')
```

---

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── cli/
│   │   └── commands/
│   │       └── init.test.js           # ✅ CREATED (45+ tests)
│   └── core/
│       ├── orchestrator.test.js       # ✅ CREATED (35+ tests)
│       └── lifecycle.test.js          # ✅ CREATED (30+ tests)
├── integration/
│   └── init-integration.test.js       # ✅ CREATED (31+ tests)
└── e2e/
    └── init-workflows/
        └── full-init-workflow.test.js # ✅ CREATED (40+ tests)
```

### Test File Naming Convention

- **Unit tests**: `<component>.test.js`
- **Integration tests**: `<feature>-integration.test.js`
- **E2E tests**: `<workflow>-workflow.test.js`

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm test tests/unit/

# Integration tests only
npm test tests/integration/

# E2E tests only
npm test tests/e2e/

# Specific component
npm test tests/unit/core/orchestrator.test.js
```

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

---

## Test Patterns and Best Practices

### 1. Test Structure

All tests follow the **Arrange-Act-Assert** pattern:

```javascript
test('should execute all phases in correct order', async () => {
  // ARRANGE: Set up test data and mocks
  const phases = [];
  const mockOrchestrator = { /* ... */ };

  // ACT: Execute the functionality
  await orchestrator.initialize('auto', projectDir, options);

  // ASSERT: Verify results
  expect(phases).toEqual([
    'pre-flight',
    'detection',
    'analysis',
    'template-generation',
    'file-writing',
    'validation'
  ]);
});
```

### 2. Mock Usage

**When to mock**:
- External dependencies (fs, child_process)
- Components not under test
- Slow operations (network, disk I/O)

**When NOT to mock**:
- The component being tested
- Simple utility functions
- Integration tests (test real interactions)

### 3. Test Isolation

Each test is **completely isolated**:
- ✅ Independent temp directories
- ✅ Clean beforeEach/afterEach
- ✅ No shared state between tests
- ✅ Mocks reset between tests

```javascript
beforeEach(async () => {
  jest.clearAllMocks();
  tempDir = path.join(os.tmpdir(), `test-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
});

afterEach(async () => {
  await fs.rm(tempDir, { recursive: true, force: true });
});
```

### 4. CI-Friendly Tests

Tests are designed to run reliably in CI:
- ✅ Platform-agnostic paths (`path.join`, `path.resolve`)
- ✅ Relaxed timing thresholds for CI environments
- ✅ No hardcoded absolute paths
- ✅ Proper cleanup (no file leaks)

```javascript
// CI-aware timing
const CI_MULTIPLIER = process.env.CI ? 3 : 1;
expect(duration).toBeLessThan(1000 * CI_MULTIPLIER);
```

### 5. Descriptive Test Names

Test names follow the pattern: **"should [expected behavior] [context]"**

✅ GOOD:
- `test('should parse --tool flag correctly')`
- `test('should fail gracefully when no package.json exists')`
- `test('should complete initialization in under 90 seconds')`

❌ BAD:
- `test('test tool flag')`
- `test('error handling')`
- `test('performance')`

---

## Coverage Targets

### Unit Tests

- **Target**: 90%+ coverage
- **Enforced**: Statements, Branches, Functions, Lines

### Integration Tests

- **Target**: 80%+ coverage
- **Focus**: Component interactions, data flow

### E2E Tests

- **Target**: 100% user workflows covered
- **Focus**: User-facing functionality, error scenarios

---

## Test Execution in CI/CD

### GitHub Actions Integration

Tests run automatically on:
- ✅ Pull requests
- ✅ Pushes to pack-master
- ✅ Manual workflow dispatch

**Matrix Testing**:
- **Operating Systems**: Ubuntu, Windows, macOS
- **Node Versions**: 20.x, 22.x
- **Total Combinations**: 6

### Pre-Commit Validation

AI validation runs before commits:
- ✅ Predicts test failures
- ✅ Validates coverage impact
- ✅ Checks cross-platform compatibility

```bash
# Automatically runs on commit
git commit -m "feat: add initialization command"

# Manual validation
npm run ai:validate
```

---

## Implementation Checklist

### ✅ Completed (QA Engineer)

- [x] Create unit test files (3 files, 110+ tests)
- [x] Create integration test files (1 file, 31+ tests)
- [x] Create E2E test files (1 file, 40+ tests)
- [x] Document test framework
- [x] Store test plan in memory

### ⏳ Pending (Backend Developer)

- [ ] Implement `src/cli/commands/init.js`
- [ ] Implement `src/core/orchestrator.js`
- [ ] Implement `src/core/lifecycle.js`
- [ ] Update test mocks with real implementations
- [ ] Run full test suite
- [ ] Achieve 90%+ coverage

---

## Next Steps

### 1. Backend Implementation

The Backend Developer should now implement:
1. `src/cli/commands/init.js` - CLI command handler
2. `src/core/orchestrator.js` - 5-phase initialization system
3. `src/core/lifecycle.js` - Lifecycle and hooks management

### 2. Test Execution

After implementation:
```bash
# Run all tests
npm test

# Check coverage
npm test -- --coverage

# Verify coverage thresholds met
# Target: 90%+ statements, branches, functions, lines
```

### 3. Test Refinement

- Replace mock implementations with real components
- Add additional edge case tests as needed
- Ensure all tests pass in CI environment

### 4. Documentation

- Update implementation status in this document
- Document any deviations from planned architecture
- Add troubleshooting guide for common test failures

---

## Integration with Claude-Flow

### Coordination Protocol

All agents follow the coordination protocol:

**BEFORE starting work**:
```bash
npx claude-flow@alpha hooks pre-task --description "Implement initialization system"
npx claude-flow@alpha memory get "tests/framework/init" --namespace "coordination"
```

**DURING work**:
```bash
npx claude-flow@alpha hooks post-edit --file "src/core/orchestrator.js" --memory-key "swarm/backend/orchestrator"
npx claude-flow@alpha hooks notify --message "Implemented orchestrator phase: pre-flight"
```

**AFTER completion**:
```bash
npx claude-flow@alpha hooks post-task --task-id "init-implementation"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Memory Storage

Test framework details stored at:
- `tests/framework/init` - Complete test plan
- `tests/results/init-unit` - Unit test results (after implementation)
- `tests/results/init-integration` - Integration test results (after implementation)
- `tests/results/init-e2e` - E2E test results (after implementation)

---

## Summary

**Total Test Files Created**: 5
**Total Test Cases Written**: 181+
**Implementation Ready**: ✅ YES

The test framework is **complete and ready** for backend implementation. All tests are documented, follow project conventions, and will provide comprehensive coverage once the implementation is complete.

**Key Benefits**:
1. ✅ **Test-First Development**: Tests written before implementation (TDD)
2. ✅ **Complete Coverage**: 181+ tests across unit, integration, and E2E layers
3. ✅ **CI-Ready**: Platform-agnostic, CI-friendly test patterns
4. ✅ **Documentation**: Clear test structure and expectations
5. ✅ **Coordination**: Integrated with Claude-Flow hooks and memory

**Next Agent**: Backend Developer should implement the initialization system using these tests as the specification.

---

**Document Version**: 1.0.0
**Last Updated**: November 20, 2025
**Status**: ✅ COMPLETE - Ready for implementation
**Next Review**: After backend implementation
