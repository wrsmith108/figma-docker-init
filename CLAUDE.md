# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Project Overview

**Current State**: vibe-to-docker v2.1.0 - Docker setup for Figma Make exported projects
**Migration Target**: vibe-to-docker v1.0.0 - Universal Docker containerization for AI-generated projects

This project is undergoing migration from Figma-specific tool to universal vibe-coding support.

### Vibe-to-Docker Initiative
**Goal**: Transform vibe-to-docker into a universal Docker containerization tool supporting:
- Figma Make (React/Vite/TypeScript)
- Lovable (formerly GPT Engineer) - Multi-framework fullstack
- V0 (Vercel) - Next.js/React/Tailwind
- Bolt (StackBlitz) - Multi-framework WebContainers

### Initialized Tools
- **Claude-Flow v2.7.33**: Swarm orchestration, neural training, GitHub integration
- **AgentDB v1.6.1**: Vector database for persistent agent memory (sqlite @ ./agentdb.db)
- **Agentic-Flow v1.10.2**: Multi-agent coordination with 213+ MCP tools

### Development Methodology
This project uses SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

### Token-Based Estimation
**No time estimates** - All planning uses token consumption estimates
- Estimation template: docs/TOKEN_ESTIMATION_TEMPLATE.md
- Retro template: docs/RETROSPECTIVE_TEMPLATE.md
- Migration plan: docs/VIBE_TO_DOCKER_MIGRATION_PLAN.md

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `npm run build` - Build project
- `npm run test` - Run tests
- `npm run lint` - Linting
- `npm run typecheck` - Type checking

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Pseudocode** - Algorithm design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

## 🚀 Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)
Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

## 🚀 Agent Execution Flow with Claude Code

### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build REST API with Express. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create React UI. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design PostgreSQL schema. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Jest tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")
  
  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }
  
  // All file operations together
  Write "backend/server.js"
  Write "frontend/App.jsx"
  Write "database/schema.sql"
```

## 📋 Agent Coordination Protocol

### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")
  
  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"}
  ]}
  
  // Parallel file operations
  Bash "mkdir -p app/{src,tests,docs,config}"
  Write "app/package.json"
  Write "app/src/server.js"
  Write "app/tests/server.test.js"
  Write "app/docs/API.md"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## 📚 Recent Project Learnings

### Bolt Detector Improvements (v5.0.0 - v5.0.4, November 2025)

**Key Learnings from Framework Detection Work**:

1. **Shared Technology Stacks Require Unique Signatures**
   - React + Vite + TypeScript is used by both Bolt AND Figma Make
   - Solution: Focus on unique signatures (`.stackblitzrc`, `angular.json`)
   - Use weak confidence (<50%) for generic patterns
   - Use strong confidence (80-100%) for unique markers

2. **Package.json is Source of Truth**
   - Always read actual scripts instead of hardcoding commands
   - Respect custom build configurations (Turbopack, custom Vite setups)
   - Example: `npm run build` vs `vite build` vs `ng build`

3. **Framework Detection Priority Order**
   ```
   1. Primary signatures (100%): .stackblitzrc, stackblitz field
   2. Framework files (80-90%): angular.json, remix.config.js
   3. Dependencies (70%): @angular/core, @remix-run/react
   4. Build configs (50%): vite.config.ts, webpack.config.js
   5. Directory structure (weak): app/, src/, public/
   ```

4. **Confidence Tuning Prevents False Positives**
   - Before tuning: 15-20% false positive rate
   - After tuning: <5% false positive rate
   - Explicit `--tool=` flag recommended for ambiguous projects

**Stored in AgentDB**: Episode "bolt-detector-v5-improvements" with 0.95 reward

**Documentation**:
- Technical details: `docs/BOLT_DETECTOR_UPDATES.md`
- User guide: `docs/guides/BOLT_GUIDE.md`

---

## 🏗️ CI/CD Pipeline Architecture

### Pipeline Overview
This project uses a **4-stage GitHub Actions pipeline** optimized for cross-platform compatibility:

```
Security → Lint → Test (Matrix) → Build → Release
   ↓         ↓         ↓            ↓       ↓
CodeQL    Validate  Node 20/22   Package  NPM
Audit     Templates  3 OS types   Verify   Publish
```

### CI/CD Stages

#### 1. Security Stage
- **CodeQL Analysis**: JavaScript security scanning
- **npm audit**: High/critical vulnerability detection (production only)
- **Permissions**: `security-events: write` for CodeQL integration

#### 2. Lint & Quality Stage
- **Template Validation**: User-facing templates only (basic, ui-heavy, advanced)
- **Package.json Validation**: JSON syntax verification
- **File Structure Checks**: Required Docker files presence

#### 3. Test Stage (Matrix)
- **Operating Systems**: Ubuntu, Windows, macOS
- **Node Versions**: 20.x, 22.x
- **Test Configuration**:
  ```bash
  node --experimental-vm-modules node_modules/jest/bin/jest.js \
    --runInBand \
    --detectOpenHandles \
    --coverage
  ```
- **CLI Smoke Tests**: `--help`, `--version`, `--list` commands

#### 4. Build & Package Stage
- **Package Creation**: `npm pack` with integrity verification
- **Installation Test**: Global package simulation
- **Template Integrity**: Dockerfile syntax validation

#### 5. Release Stage (pack-master only)
- **Semantic Release**: Automated versioning via conventional commits
- **NPM Publishing**: Automated package deployment
- **GitHub Releases**: Artifact uploads with `.tgz` packages

### Common CI Failure Patterns & Solutions

#### ✅ Fixed Issues (January 2025)

**1. Coverage Configuration Mismatch**
```javascript
// ❌ PROBLEM: Jest couldn't find coverage for modular codebase
// jest.config.js (OLD)
coveragePathIgnorePatterns: ['/node_modules/', '/tests/']

// ✅ SOLUTION: Updated coverage paths for src/ organization
// jest.config.js (NEW)
collectCoverageFrom: [
  'src/**/*.js',
  'vibe-to-docker.js',
  '!src/**/*.test.js',
  '!**/node_modules/**'
]
```
**Commit**: `65902f9` - Update coverage config for modular codebase architecture

**2. Flaky Performance Tests**
```javascript
// ❌ PROBLEM: Timing tests failed in CI (different CPU speeds)
expect(duration).toBeLessThan(500); // Too strict for CI

// ✅ SOLUTION: Relaxed thresholds for CI environments
expect(duration).toBeLessThan(1500); // 3x tolerance
```
**Commit**: `50cd5c0` - Relax flaky performance test for CI stability

**3. Cross-Platform Path Resolution**
```javascript
// ❌ PROBLEM: Hardcoded Unix paths failed on Windows
const expected = '/Users/test/project/templates';

// ✅ SOLUTION: Dynamic path resolution with path.resolve()
const expected = path.resolve(projectRoot, 'templates');
```
**Commit**: `56374da` - Use dynamic paths in path-resolver tests for CI

**4. SIGPIPE Error in Package Verification**
```bash
# ❌ PROBLEM: tar command caused broken pipe
tar -tzf $PACKAGE_FILE | head -20

# ✅ SOLUTION: Continue on pipe errors
tar -tzf $PACKAGE_FILE | head -20 || true
```
**Commit**: `4b13484` - Handle SIGPIPE error in package verification

**5. Test Isolation Issues**
```javascript
// ❌ PROBLEM: Async handles kept tests hanging
// No cleanup of timers, file watchers, or network connections

// ✅ SOLUTION: Added Jest flags for clean exit
{
  testEnvironment: 'node',
  detectOpenHandles: true,  // Detect hanging operations
  forceExit: false,         // Ensure proper cleanup
  runInBand: true          // Sequential execution in CI
}
```
**Commit**: `31932d1` - Add detectOpenHandles and runInBand for clean test exit

#### ⚠️ Identified Issues (Not Yet Fixed)

**1. Cache Errors**
```
Warning: Cache directory permissions issue
Solution: Add cache key versioning in workflow
```

**2. Deprecated Packages**
```
npm WARN deprecated @semantic-release/npm@12.0.2
Action: Monitor for security updates, plan migration
```

**3. Semantic Release Configuration**
```
Issue: Release script validation needed before execution
Solution: Pre-execution verification step added in ci.yml:249-256
```

### Testing Best Practices (Learned)

#### 1. CI-Friendly Test Design
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

#### 2. Performance Test Guidelines
- **Local Dev**: Strict thresholds (500ms)
- **CI Environment**: 3x tolerance (1500ms)
- **Rationale**: CI runners have variable CPU speeds

#### 3. Cross-Platform Testing
```javascript
// ✅ Platform-agnostic assertions
const isWindows = process.platform === 'win32';
const expectedSeparator = isWindows ? '\\' : '/';

// ✅ Dynamic fixture paths
const fixtureDir = path.join(__dirname, 'fixtures');
```

### Dependency Management Strategies

#### 1. Production vs Dev Dependencies
```json
{
  "dependencies": {},  // Runtime only - keep minimal
  "devDependencies": {
    "agentdb": "^1.6.1",
    "claude-flow": "^2.7.33",
    "jest": "^29.7.0"
  }
}
```

#### 2. Security Auditing
```bash
# Production dependencies only (reduces false positives)
npm audit --audit-level=high --production

# Full audit for development
npm audit --audit-level=moderate
```

#### 3. Cache Management
```yaml
# GitHub Actions cache optimization
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'  # Automatic cache based on package-lock.json
```

### Performance Optimization Techniques

#### 1. Matrix Test Optimization
```yaml
strategy:
  fail-fast: false  # Continue other tests if one fails
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [20, 22]
    include:
      - os: ubuntu-latest
        node-version: 20
        upload-coverage: true  # Only one coverage upload
```

#### 2. Test Execution Strategies
```javascript
// Sequential in CI (predictable, no race conditions)
--runInBand

// Parallel in local dev (faster feedback)
--maxWorkers=4
```

#### 3. Package Size Optimization
```json
{
  "files": [
    "vibe-to-docker.js",
    "src/lib/",
    "templates/",
    "!**/*.test.js",
    "!**/node_modules/**"
  ]
}
```

### CI/CD Metrics & Performance

**Current Stats (January 2025)**:
- ✅ **Success Rate**: 100% (after fixes)
- ⏱️ **Average Pipeline Duration**: 8-12 minutes
- 🔄 **Test Matrix**: 6 combinations (3 OS × 2 Node versions)
- 📦 **Package Size**: ~50KB (optimized with files filter)
- 🧪 **Test Coverage**: 78% (target: 80%)

**Performance Improvements**:
- Reduced flaky test failures by 100%
- Cross-platform compatibility: 3 OS types supported
- Test execution time reduced with `--runInBand` optimization

### GitHub Actions Best Practices

#### 1. Error Handling
```yaml
# ✅ GOOD: Explicit error handling
run: |
  set -e  # Exit on any error
  npm test
continue-on-error: false  # Fail the job on errors
```

#### 2. Security Best Practices
```yaml
permissions:
  contents: write  # Minimal required permissions
  pull-requests: read
  checks: write
  security-events: write  # For CodeQL only
```

#### 3. Conditional Execution
```yaml
# Only release on pack-master branch
if: github.ref == 'refs/heads/pack-master' && github.event_name == 'push'
```

### AgentDB Integration for CI/CD Learning

**Store CI/CD insights for future reference**:
```bash
# After successful pipeline run
npx agentdb@latest reflexion store \
  "ci-cd-success-$(date +%s)" \
  "CI/CD Pipeline Execution" \
  0.95 \
  true \
  "Pipeline completed successfully with learnings" \
  '{"stage": "test", "duration": "8min"}' \
  '{"coverage": "78%", "tests_passed": "42/42"}' \
  480000 \
  15000

# Query past CI/CD episodes
npx agentdb@latest reflexion retrieve "CI/CD" --k 10 --synthesize-context
```

**Memory Patterns for CI/CD Coordination**:
```bash
# Store test results
npx claude-flow@alpha hooks notify \
  --message "Tests passed: 42/42, Coverage: 78%" \
  --level "success"

# Session management
npx claude-flow@alpha hooks session-end \
  --generate-summary true \
  --export-metrics true
```

## 🧠 Intelligent DevOps with AI Learning

### Overview

This project uses **AI-powered pre-deployment validation** to catch CI/CD failures before code reaches GitHub Actions. The system learns from past failures and gets smarter over time.

### Architecture

**7-Agent Hierarchical Swarm with Byzantine Consensus**:
1. **Queen Coordinator** - Strategic oversight and final approval
2. **Test Predictor** - Predicts test failures before running CI
3. **Coverage Analyzer** - Ensures coverage thresholds will be met
4. **Platform Validator** - Detects cross-platform issues (Windows/macOS/Linux)
5. **Security Scanner** - Identifies vulnerabilities before npm audit
6. **Performance Analyzer** - Predicts performance test failures
7. **Semantic Validator** - Validates conventional commit format

**Key Features**:
- ✅ **Byzantine Fault Tolerance**: Requires 2/3+1 consensus for approval
- 🧠 **ReflexION Learning**: Stores failure patterns in AgentDB
- ⚡ **Fast Validation**: 45-60 seconds before commit
- 📊 **85%+ Prevention Rate**: Catches issues before GitHub Actions
- 💾 **Persistent Memory**: Learns from every failure

### Quick Setup

```bash
# 1. Make AI validation scripts executable
chmod +x scripts/ai-validate.js
chmod +x .claude-flow/hooks/*

# 2. Install git hooks for automatic validation
git config core.hooksPath .claude-flow/hooks

# 3. Test the system (optional)
node scripts/ai-validate.js --learn-only

# 4. Make a commit (validation runs automatically)
git commit -m "feat: add new feature"
```

### Usage

#### Automatic Validation (Pre-Commit Hook)
```bash
# Automatically runs when you commit
git commit -m "feat: add new feature"

# Pre-commit validation:
#   → Queries learned patterns from AgentDB
#   → Spawns 7 validation agents
#   → Runs Byzantine consensus vote
#   → Blocks commit if <6/7 agents approve
```

#### Manual Validation
```bash
# Run validation anytime
node scripts/ai-validate.js --verbose

# Strict mode (requires 100% approval)
node scripts/ai-validate.js --strict

# Query learned patterns only
node scripts/ai-validate.js --learn-only
```

#### Learn from CI Failures
```bash
# After GitHub Actions fails
gh run view <run-id> --log-failed > /tmp/failure.txt

# Store the failure pattern
./.claude-flow/hooks/post-failure "test" "$(cat /tmp/failure.txt)"

# Pattern is now stored in AgentDB
# Next validation will check against it
```

### How It Works

#### 1. Pre-Commit Validation Flow

```
User runs: git commit -m "feat: add feature"
           ↓
.claude-flow/hooks/pre-commit triggers
           ↓
Query AgentDB for learned failure patterns
           ↓
Spawn 7 validation agents in parallel:
  - Test Predictor: Check for test assertion mismatches
  - Coverage Analyzer: Predict coverage impact
  - Platform Validator: Detect hardcoded paths
  - Security Scanner: Check dependencies for CVEs
  - Performance Analyzer: Identify CI timing assumptions
  - Semantic Validator: Verify commit message format
  - Queen Coordinator: Oversee and make final decision
           ↓
Byzantine Consensus Vote (require 6/7 approval)
           ↓
PASS → Allow commit    |    FAIL → Block commit
```

#### 2. Learning from Failures

```
GitHub Actions fails
           ↓
Run: .claude-flow/hooks/post-failure "test" "failure details"
           ↓
Store in AgentDB ReflexION:
  - Episode ID: ci-failure-{timestamp}
  - Trajectory: What changed
  - Verdict: 0.2 (low = failure)
  - Self-Reflection: Why it failed
  - Self-Correction: How to prevent it
           ↓
Train Neural Patterns (optional)
           ↓
Update Memory Namespace: ci-cd/failures
           ↓
Next pre-deployment validation will query this pattern
```

#### 3. Continuous Improvement

The system gets smarter with each failure:

**After 1 failure**:
- ✅ Stores pattern in AgentDB
- ✅ Future commits checked against it

**After 5 failures**:
- ✅ Neural patterns trained
- ✅ Causal relationships learned
- ✅ Prevention skills consolidated

**After 20 failures**:
- ✅ 85%+ prevention rate
- ✅ <10% false positive rate
- ✅ Predictive accuracy 92%+

### AgentDB Memory Structure

#### Stored Learnings

```javascript
// Namespace: ci-cd/failures
{
  "test-failures": {
    "confidence-normalization": {
      "pattern": "Test assertions fail when normalization denominator changes",
      "detection": "toBeGreaterThan() on confidence scores",
      "fix": "Use toBeGreaterThanOrEqual() or adjust thresholds proportionally",
      "confidence": 0.98,
      "occurrences": 2,
      "last_seen": "2025-11-15T18:15:00Z"
    },
    "cross-platform-paths": {
      "pattern": "Hardcoded Unix paths fail on Windows",
      "detection": "Regex: /\\/Users\\/|\\/home\\//",
      "fix": "Use path.resolve() and path.join()",
      "confidence": 0.95,
      "occurrences": 12
    },
    "timing-assumptions": {
      "pattern": "Performance tests with strict thresholds fail in CI",
      "detection": "toBeGreaterThan() on timing values",
      "fix": "Use CI_THRESHOLD_MULTIPLIER = process.env.CI ? 3 : 1",
      "confidence": 0.92,
      "occurrences": 8
    }
  }
}
```

#### Query Examples

```bash
# Get all test failure patterns
npx agentdb@latest memory-search \
  --namespace "ci-cd/failures" \
  --query "test failures cross-platform" \
  --top-k 10

# Get ReflexION episodes
npx agentdb@latest reflexion synthesize \
  --filter "ci-failure-*" \
  --max-episodes 20 \
  --format markdown > docs/CI_CD_LEARNINGS.md

# Search specific patterns
npx agentdb@latest reflexion retrieve "timing assumptions CI" \
  --k 5 \
  --synthesize-context
```

### Hooks Reference

#### .claude-flow/hooks/pre-commit
**Trigger**: Before every `git commit`
**Purpose**: Validate code changes with AI agents
**Approval**: Requires 6/7 agent consensus
**Bypass**: `git commit --no-verify` (not recommended)

#### .claude-flow/hooks/pre-push
**Trigger**: Before every `git push`
**Purpose**: Final Byzantine consensus validation
**Approval**: Requires 100% agent consensus (strict mode)
**Bypass**: `git push --no-verify` (STRONGLY not recommended)

#### .claude-flow/hooks/post-failure
**Trigger**: Manual (after CI failure)
**Purpose**: Store failure pattern in AgentDB
**Usage**: `./.claude-flow/hooks/post-failure "type" "details"`

### Performance Metrics

**Target Performance**:
- ⚡ Validation Time: 45-60 seconds
- 🎯 Prevention Rate: 85%+ (up from ~60%)
- ✅ False Positives: <10%
- 🧠 Neural Accuracy: 92%+
- 💾 Query Latency: <50ms (HNSW index)

**Current Stats** (will improve over time):
- Episodes Stored: 5+ (January 2025)
- Skills Consolidated: 3+ reusable patterns
- Causal Edges: 2+ learned relationships

### Integration with Claude-Flow

The AI validation system integrates seamlessly with Claude-Flow:

```bash
# Initialize swarm (done automatically by hooks)
npx claude-flow@alpha swarm init \
  --topology hierarchical \
  --max-agents 7 \
  --strategy balanced

# Query memory (done automatically by hooks)
npx claude-flow@alpha memory get "ci-cd/failures/test-failures" \
  --namespace "learning"

# Train patterns (optional, can be enabled in post-failure hook)
npx claude-flow@alpha neural train \
  --pattern-type optimization \
  --training-data "{failure data}" \
  --epochs 50
```

### Troubleshooting

#### Validation is too strict
```bash
# Query what agents are rejecting
node scripts/ai-validate.js --verbose

# Review learned patterns
npx agentdb@latest reflexion synthesize \
  --filter "ci-failure-*" \
  --max-episodes 10
```

#### False positives
```bash
# Temporarily bypass validation (not recommended)
git commit --no-verify -m "message"

# Better: Update the learned pattern
npx agentdb@latest memory delete "ci-cd/failures/false-pattern"
```

#### Performance is slow
```bash
# Check AgentDB query performance
npx agentdb@latest benchmark

# Rebuild HNSW index if needed
npx agentdb@latest optimize --rebuild-index
```

### Documentation

- **Agent Definitions**: `docs/AGENTS.md`
- **Validation Script**: `scripts/ai-validate.js`
- **Pre-Commit Hook**: `.claude-flow/hooks/pre-commit`
- **Post-Failure Hook**: `.claude-flow/hooks/post-failure`
- **Pre-Push Hook**: `.claude-flow/hooks/pre-push`

### Next Steps

1. **Initial Setup**: Run `chmod +x` and `git config` commands above
2. **Make Changes**: Edit code as normal
3. **Commit**: AI validation runs automatically
4. **Learn from Failures**: Run post-failure hook after CI failures
5. **Monitor Improvements**: Track prevention rate over time

The system learns from every failure and gets smarter with each iteration. After 20+ failures stored, expect 85%+ prevention rate.

---

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)

---

Remember: **Claude Flow coordinates, Claude Code creates!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.
