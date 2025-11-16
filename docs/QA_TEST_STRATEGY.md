# QA Test Strategy - vibe-to-docker

## Executive Summary

**Current Status (January 15, 2025)**
- **Test Coverage**: 62.72% statements, 62.33% branches, 69.86% functions
- **Test Suites**: 50 files, 1,275 tests passing
- **Target**: 80%+ coverage across all metrics
- **Gap**: 17.28% coverage increase needed

## Coverage Analysis

### Current Coverage Breakdown

```
Statements   : 62.72% ( 2216/3533 ) - Need +612 covered statements
Branches     : 62.33% ( 1107/1776 ) - Need +314 covered branches
Functions    : 69.86% ( 320/458 )   - Need +46 covered functions
Lines        : 63.11% ( 2158/3419 ) - Need +576 covered lines
```

### Critical Coverage Gaps (0% Coverage)

1. **directory-manager.js** (0% coverage, 676 lines)
   - Directory creation and management
   - Backup and restore operations
   - Validation and integrity checks
   - **Priority**: CRITICAL

2. **apply-parallel-optimization.js** (0% coverage, 134 lines)
   - Script-based file transformations
   - Performance optimization logic
   - **Priority**: HIGH

3. **package-reader.js** (30% coverage)
   - Package.json parsing
   - Dependency detection
   - **Priority**: HIGH

### Moderate Coverage Gaps (30-50%)

1. **path-resolver.js** (50% coverage)
   - Cross-platform path handling
   - Template path resolution
   - **Priority**: MEDIUM

2. **project.js** (21.68% coverage, 1,170 lines)
   - Main project orchestration
   - Template processing
   - Docker file generation
   - **Priority**: CRITICAL

3. **template-validator.js** (50.49% coverage)
   - Template integrity validation
   - Schema validation
   - **Priority**: MEDIUM

4. **base-detector.js** (53.73% coverage)
   - Base detection logic
   - File system scanning
   - **Priority**: MEDIUM

5. **bolt-detector.js** (48.29% coverage)
   - Bolt project detection
   - Framework identification
   - **Priority**: MEDIUM

## Test Suite Organization

### Current Structure
```
test/
├── e2e/
│   ├── cli.test.js                    ✅ CLI integration
│   └── npm-install.test.js            ✅ Package installation
├── unit/
│   ├── build-output-detection.test.js ✅ Build output logic
│   ├── cli-interface.test.js          ✅ CLI commands
│   ├── config-parser.test.js          ✅ Configuration parsing
│   ├── framework-detection.test.js    ✅ Framework detection
│   └── ... (12 more unit tests)
└── figma-docker-init.test.js          ✅ Main entry point

tests/
├── core/
│   └── cache.test.js                  ✅ 100% coverage
├── detectors/
│   ├── backend-detector.test.js       ✅ 100% coverage
│   ├── database-detector.test.js      ✅ 100% coverage
│   ├── detector-chain.test.js         ✅ 96% coverage
│   ├── framework-detector.test.js     ✅ 100% coverage
│   ├── lovable-detector.test.js       ✅ 67% coverage
│   └── ... (3 more detector tests)
├── e2e/
│   ├── performance-tests.test.js      ✅ Performance benchmarks
│   └── platform-tests.test.js         ✅ Cross-platform
├── integration/
│   ├── docker-integration.test.js     ✅ Docker Compose
│   └── phase1-integration.test.js     ✅ Phase 1 workflow
├── templates/
│   ├── bolt-template.test.js          ✅ Bolt templates
│   ├── figma-make-template.test.js    ✅ Figma Make templates
│   ├── lovable-template.test.js       ✅ Lovable templates
│   ├── v0-template.test.js            ✅ V0 templates
│   └── ... (2 more template tests)
└── unit/
    ├── cli-refactor.test.js           ✅ CLI refactoring
    ├── directory-manager.test.js      ❌ EXISTS BUT 0% COVERAGE
    ├── parallel-detection.test.js     ✅ Parallel optimization
    └── ... (2 more unit tests)
```

## Testing Priorities

### Phase 1: Critical Coverage Gaps (Week 1-2)

#### 1.1 directory-manager.js Tests
**File**: `tests/unit/directory-manager.test.js`
**Current**: Exists but provides 0% coverage
**Target**: 85%+ coverage

**Test Scenarios**:
```javascript
describe('DirectoryManager', () => {
  // ✅ Basic Operations (exists but needs fixes)
  - createVibeDockerDirectory()
  - validateDirectory()
  - exists()

  // ❌ Missing Critical Tests
  - backupExistingDirectory()
  - restoreFromBackup()
  - verifyWritePermission()
  - cleanupOldBackups()
  - migrateFromFigmaDocker()

  // ❌ Missing Edge Cases
  - Permission denied scenarios
  - Disk space exhaustion
  - Concurrent directory creation
  - Corrupted directory recovery
  - Nested directory structure
  - Symlink handling
});
```

#### 1.2 project.js Tests
**File**: `tests/unit/project-orchestration.test.js` (NEW)
**Current**: 21.68% coverage (lines 379-970 uncovered)
**Target**: 80%+ coverage

**Test Scenarios**:
```javascript
describe('Project Orchestration', () => {
  // ❌ Template Processing (lines 379-970)
  - processTemplate()
  - generateDockerfiles()
  - composeConfiguration()
  - environmentVariables()

  // ❌ Error Recovery
  - Partial installation recovery
  - Rollback on failure
  - State persistence

  // ❌ Integration
  - End-to-end project setup
  - Multi-framework detection
  - Template fallback logic
});
```

#### 1.3 package-reader.js Tests
**File**: `tests/unit/package-reader.test.js` (NEW)
**Current**: 30% coverage
**Target**: 85%+ coverage

**Test Scenarios**:
```javascript
describe('PackageReader', () => {
  // ❌ Missing Core Tests
  - readPackageJson() with caching
  - parseDevDependencies()
  - detectConflicts()
  - versionCompatibility()

  // ❌ Edge Cases
  - Malformed package.json
  - Missing package.json
  - Circular dependencies
  - Monorepo detection
  - Workspace resolution
});
```

### Phase 2: Moderate Coverage Improvements (Week 3-4)

#### 2.1 Cross-Platform Path Handling
**File**: `tests/unit/path-resolver-extended.test.js` (NEW)
**Current**: 50% coverage
**Target**: 90%+ coverage

**Test Scenarios**:
```javascript
describe('PathResolver Extended', () => {
  // ❌ Platform-Specific Tests
  - Windows UNC paths (\\server\share)
  - Windows long paths (>260 chars)
  - macOS special folders (/Applications)
  - Linux symlinks and /proc paths

  // ❌ Edge Cases
  - Relative path resolution
  - Absolute path normalization
  - Case sensitivity (Windows vs Unix)
  - Path traversal security
});
```

#### 2.2 Template Validation
**File**: `tests/unit/template-validator-extended.test.js` (NEW)
**Current**: 50.49% coverage
**Target**: 85%+ coverage

**Test Scenarios**:
```javascript
describe('TemplateValidator Extended', () => {
  // ❌ Advanced Validation (lines 208-379, 436-482)
  - Schema validation
  - Variable substitution
  - Fragment composition
  - Conditional blocks

  // ❌ Security Validation
  - Injection prevention
  - Path traversal detection
  - Resource limits
});
```

#### 2.3 Framework Detection
**File**: `tests/unit/framework-detector-extended.test.js` (NEW)
**Detectors**: bolt-detector.js, base-detector.js, lovable-detector.js

**Test Scenarios**:
```javascript
describe('Framework Detection Extended', () => {
  // ❌ Bolt Detector (48.29% coverage)
  - WebContainer detection
  - StackBlitz configuration
  - Multi-framework support
  - Monorepo handling

  // ❌ Base Detector (53.73% coverage)
  - File system scanning
  - Confidence scoring
  - Fallback logic

  // ❌ Lovable Detector (67.13% coverage)
  - Backend framework detection
  - Database integration
  - API configuration
});
```

### Phase 3: Security & Performance Testing (Week 5-6)

#### 3.1 Security Testing
**File**: `tests/security/security-validation.test.js` (NEW)

**Test Scenarios**:
```javascript
describe('Security Validation', () => {
  // ❌ Input Validation
  - Template variable injection
  - Command injection in Docker configs
  - Path traversal attempts
  - Environment variable pollution

  // ❌ Secrets Management
  - .env file encryption
  - API key detection
  - Secret leak prevention

  // ❌ Dependency Security
  - npm audit integration
  - Known vulnerability detection
  - Outdated dependency warnings
});
```

#### 3.2 Performance Testing
**File**: `tests/performance/benchmark-suite.test.js` (NEW)

**Test Scenarios**:
```javascript
describe('Performance Benchmarks', () => {
  // ✅ EXISTS (performance-tests.test.js)
  - Installation time (<30s)
  - Template processing (<5s)

  // ❌ Missing Benchmarks
  - Parallel detection speedup (2.8-4.4x)
  - Memory usage (<100MB)
  - Large project handling (1000+ files)
  - Concurrent operations
  - Cache effectiveness

  // ❌ Regression Detection
  - Performance baselines
  - CI performance tracking
  - Degradation alerts
});
```

#### 3.3 Error Recovery Testing
**File**: `tests/integration/error-recovery.test.js` (NEW)

**Test Scenarios**:
```javascript
describe('Error Recovery', () => {
  // ❌ Failure Scenarios
  - Network timeout during npm install
  - Disk space exhaustion
  - Permission denied errors
  - Corrupted template files
  - Invalid Docker configuration

  // ❌ Recovery Mechanisms
  - Automatic retry logic
  - State rollback
  - Backup restoration
  - Graceful degradation
  - User notification
});
```

### Phase 4: CI/CD & Integration Testing (Week 7-8)

#### 4.1 CI/CD Pipeline Testing
**File**: `tests/ci/pipeline-validation.test.js` (NEW)

**Test Scenarios**:
```javascript
describe('CI/CD Pipeline', () => {
  // ❌ GitHub Actions Integration
  - Matrix test execution (3 OS × 2 Node versions)
  - CodeQL security scanning
  - npm audit validation
  - Semantic release workflow

  // ❌ Pre-deployment Validation
  - AI validation hooks
  - Learned failure patterns
  - Byzantine consensus checks
  - Coverage threshold enforcement
});
```

#### 4.2 Multi-Framework Integration
**File**: `tests/integration/multi-framework.test.js` (NEW)

**Test Scenarios**:
```javascript
describe('Multi-Framework Integration', () => {
  // ❌ Framework Combinations
  - Figma Make + React + Vite
  - Lovable + Node.js + PostgreSQL
  - Bolt + Next.js + Tailwind
  - V0 + React + Vercel

  // ❌ Complex Scenarios
  - Monorepo detection
  - Fullstack applications
  - Microservices architecture
  - Multiple databases
});
```

## Test Quality Metrics

### Coverage Targets
```
Global Thresholds (jest.config.js):
✅ Branches:   60% → 75% (+15%)
✅ Functions:  69% → 80% (+11%)
✅ Lines:      62% → 80% (+18%)
✅ Statements: 62% → 80% (+18%)
```

### Test Performance Targets
```
✅ Unit Tests:        <100ms per test
✅ Integration Tests: <5s per test
✅ E2E Tests:         <30s per test
✅ Full Suite:        <3min total
```

### Test Reliability Targets
```
✅ Flaky Test Rate:   <1%
✅ False Positive:    <5%
✅ CI Success Rate:   >95%
✅ Cross-Platform:    100% (macOS, Windows, Linux)
```

## Testing Best Practices

### 1. CI-Friendly Test Design
```javascript
// ✅ GOOD: CI-aware timing thresholds
const CI_THRESHOLD_MULTIPLIER = process.env.CI ? 3 : 1;
const maxDuration = 500 * CI_THRESHOLD_MULTIPLIER;

// ✅ GOOD: Cross-platform path handling
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ GOOD: Test isolation
afterEach(async () => {
  await cleanupResources();
  jest.clearAllTimers();
});
```

### 2. Mock Strategy
```javascript
// ✅ GOOD: Mock external dependencies
jest.mock('child_process');
jest.mock('fs/promises');

// ✅ GOOD: Dependency injection
class ProjectManager {
  constructor(fs = fsDefault, exec = execDefault) {
    this.fs = fs;
    this.exec = exec;
  }
}
```

### 3. Fixture Management
```javascript
// ✅ GOOD: Reusable test fixtures
const fixtures = {
  packageJson: {
    valid: require('./fixtures/package.valid.json'),
    invalid: require('./fixtures/package.invalid.json'),
    lovable: require('./fixtures/package.lovable.json'),
  }
};
```

## AI Validation Integration

### Learned Failure Patterns (from AgentDB)

```javascript
// CI/CD Failure Patterns
{
  "test-failures": {
    "confidence-normalization": {
      "pattern": "Test assertions fail when normalization denominator changes",
      "detection": "toBeGreaterThan() on confidence scores",
      "fix": "Use toBeGreaterThanOrEqual() or adjust thresholds proportionally",
      "confidence": 0.98
    },
    "cross-platform-paths": {
      "pattern": "Hardcoded Unix paths fail on Windows",
      "detection": "Regex: /\\/Users\\/|\\/home\\//",
      "fix": "Use path.resolve() and path.join()",
      "confidence": 0.95
    },
    "timing-assumptions": {
      "pattern": "Performance tests with strict thresholds fail in CI",
      "detection": "toBeGreaterThan() on timing values",
      "fix": "Use CI_THRESHOLD_MULTIPLIER = process.env.CI ? 3 : 1",
      "confidence": 0.92
    }
  }
}
```

### Pre-Commit Validation

```bash
# Automated AI validation before commit
git commit -m "feat: add feature"
  ↓
.claude-flow/hooks/pre-commit triggers
  ↓
Query AgentDB for learned patterns
  ↓
Spawn 7 validation agents:
  - Test Predictor
  - Coverage Analyzer
  - Platform Validator
  - Security Scanner
  - Performance Analyzer
  - Semantic Validator
  - Queen Coordinator
  ↓
Byzantine Consensus (6/7 approval required)
  ↓
PASS → Commit  |  FAIL → Block + Report
```

## Test Implementation Roadmap

### Week 1-2: Critical Coverage
- [ ] Fix directory-manager.test.js (0% → 85%)
- [ ] Create project-orchestration.test.js (21% → 80%)
- [ ] Create package-reader.test.js (30% → 85%)

### Week 3-4: Moderate Coverage
- [ ] Extend path-resolver tests (50% → 90%)
- [ ] Extend template-validator tests (50% → 85%)
- [ ] Extend framework detector tests (48-67% → 85%)

### Week 5-6: Security & Performance
- [ ] Create security-validation.test.js (NEW)
- [ ] Create benchmark-suite.test.js (NEW)
- [ ] Create error-recovery.test.js (NEW)

### Week 7-8: CI/CD & Integration
- [ ] Create pipeline-validation.test.js (NEW)
- [ ] Create multi-framework.test.js (NEW)
- [ ] Update coverage thresholds in jest.config.js

## Success Metrics

### Coverage Goals
- ✅ Overall Coverage: 80%+ (current: 62.72%)
- ✅ Critical Files: 90%+ (directory-manager, project.js)
- ✅ Detector Files: 85%+ (all framework detectors)

### Quality Goals
- ✅ CI Success Rate: 95%+ (current: 100% after fixes)
- ✅ Test Stability: <1% flaky tests
- ✅ Cross-Platform: 100% (macOS, Windows, Linux)

### Performance Goals
- ✅ Test Suite Time: <3min (current: ~29s)
- ✅ Coverage Report: <10s generation
- ✅ Pre-commit Validation: <60s

## Coordination with Development Swarm

### Memory Keys
```bash
# Store test results
npx claude-flow@alpha memory store \
  --key "tests/coverage/current" \
  --value "62.72%" \
  --namespace "development"

# Store test gaps
npx claude-flow@alpha memory store \
  --key "tests/gaps/critical" \
  --value "directory-manager.js,project.js,package-reader.js" \
  --namespace "development"

# Store test strategy
npx claude-flow@alpha memory store \
  --key "tests/strategy/roadmap" \
  --value "8-week plan to reach 80% coverage" \
  --namespace "development"
```

### Agent Coordination
```bash
# Share test findings with Backend Developer
npx claude-flow@alpha hooks notify \
  --message "QA: Critical gaps found in directory-manager.js (0% coverage). Requires 85%+ coverage for production readiness."

# Share findings with Frontend Developer
npx claude-flow@alpha hooks notify \
  --message "QA: Template validators need security testing. Path traversal and injection tests required."
```

---

**Document Version**: 1.0.0
**Last Updated**: January 15, 2025
**Owner**: QA Engineer (Swarm Agent)
**Next Review**: January 29, 2025
