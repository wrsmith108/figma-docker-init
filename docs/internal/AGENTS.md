# Agents Configuration for Vibe-to-Docker Project

## Overview
This document defines the AI agents available for the vibe-to-docker migration project. Agents are specialized AI assistants that handle specific aspects of development, testing, and documentation.

## Active Agents

### Development Agents

#### 1. Tool Detector Agent
**Purpose**: Research and implement detection logic for vibe-coding tools
**Specializations**:
- Pattern recognition in project structures
- Package.json dependency analysis
- Config file detection
- Source tool signature identification

**Tools**: Researcher, Coder
**Token Budget**: 15,000 tokens per tool signature

#### 2. Framework Detector Agent
**Purpose**: Identify JavaScript frameworks and build tools
**Specializations**:
- React, Vue, Svelte, Next.js detection
- Vite, Webpack, Turbopack identification
- TypeScript configuration analysis
- Build script parsing

**Tools**: Researcher, Coder
**Token Budget**: 12,000 tokens per framework detector

#### 3. Database Detector Agent
**Purpose**: Identify database requirements and configurations
**Specializations**:
- Supabase, PostgreSQL, MongoDB, SQLite detection
- Connection string analysis
- Schema file discovery
- ORM/Query builder identification

**Tools**: Researcher, Coder
**Token Budget**: 10,000 tokens per database detector

#### 4. Backend Detector Agent
**Purpose**: Identify backend frameworks and API patterns
**Specializations**:
- Express, Fastify, Hono, NestJS detection
- API route discovery (Next.js, SvelteKit)
- Server directory identification
- Middleware and handler analysis

**Tools**: Researcher, Coder
**Token Budget**: 12,000 tokens per backend detector

#### 5. Template Generator Agent
**Purpose**: Create Docker templates for different project types
**Specializations**:
- Dockerfile generation
- docker-compose.yml creation
- nginx configuration
- Multi-stage builds
- Environment variable management

**Tools**: Coder, Reviewer
**Token Budget**: 20,000 tokens per template

### Testing Agents

#### 6. Test Migration Agent
**Purpose**: Update existing tests for vibe-to-docker
**Specializations**:
- Test refactoring
- Assertion updates
- Mock data generation
- Integration test creation

**Tools**: Tester, Reviewer
**Token Budget**: 15,000 tokens per test suite

#### 7. Detection Testing Agent
**Purpose**: Create tests for tool/framework detection
**Specializations**:
- Unit tests for detectors
- Mock project generation
- Edge case coverage
- False positive prevention

**Tools**: Tester, Coder
**Token Budget**: 10,000 tokens per detector test suite

### Documentation Agents

#### 8. Migration Documentation Agent
**Purpose**: Create comprehensive migration guides
**Specializations**:
- Tool-specific guides (Figma, Lovable, V0, Bolt)
- API documentation
- Example project creation
- Tutorial content

**Tools**: Researcher, Writer
**Token Budget**: 25,000 tokens per guide

#### 9. README Generator Agent
**Purpose**: Rewrite README for vibe-to-docker branding
**Specializations**:
- Marketing copy
- Feature descriptions
- Installation instructions
- Quick start guides

**Tools**: Writer, Reviewer
**Token Budget**: 15,000 tokens

### Review & Quality Agents

#### 10. Code Review Agent
**Purpose**: Review all code changes for quality and consistency
**Specializations**:
- Security review
- Performance analysis
- Best practices enforcement
- Breaking change detection

**Tools**: Reviewer, Analyst
**Token Budget**: 30,000 tokens for full codebase review

#### 11. Architecture Validator Agent
**Purpose**: Ensure architectural consistency
**Specializations**:
- Design pattern validation
- Dependency analysis
- Module cohesion review
- Scalability assessment

**Tools**: Architect, Reviewer
**Token Budget**: 20,000 tokens

## Agent Coordination

### Parallel Execution Pattern
Agents can run in parallel when working on independent components:

```javascript
// Example: Run 4 detector agents in parallel
Task("Tool Detector", "Implement Figma/Lovable/V0/Bolt detection", "researcher")
Task("Framework Detector", "Implement React/Vue/Svelte/Next detection", "researcher")
Task("Database Detector", "Implement DB detection system", "researcher")
Task("Backend Detector", "Implement backend framework detection", "researcher")
```

### Sequential Execution Pattern
Some tasks must complete before others can start:

```
Phase 1: Research (Detectors research APIs and patterns)
  ↓
Phase 2: Implementation (Detectors write code)
  ↓
Phase 3: Testing (Test agents validate detectors)
  ↓
Phase 4: Integration (Templates use detector results)
  ↓
Phase 5: Documentation (Docs explain new features)
```

## Memory Coordination with AgentDB

All agents store learnings in AgentDB for cross-session persistence:

```javascript
// Agent stores detection pattern
await agentdb.store({
  type: 'pattern',
  tool: 'lovable',
  signature: { dependencies: ['@lovable/core'], files: ['.lovable'] },
  confidence: 0.95
});

// Later agent retrieves pattern
const patterns = await agentdb.retrieve({ type: 'pattern', tool: 'lovable' });
```

## Agent Communication Protocol

Agents communicate through:
1. **AgentDB Memory**: Persistent storage of findings, patterns, decisions
2. **File System**: Shared access to docs/ for handoffs
3. **Git Commits**: Clear commit messages document progress
4. **Retros**: End-of-phase retrospectives capture learnings

## Token Budget Allocation

Total project budget: ~280,000 tokens

| Phase | Token Allocation | Key Agents |
|-------|-----------------|------------|
| Research | 45,000 | Researcher agents (4× detectors) |
| Implementation | 120,000 | Coder agents, Template generators |
| Testing | 50,000 | Tester agents, Review agents |
| Documentation | 35,000 | Documentation agents |
| Review | 30,000 | Code review, Architecture validation |

## Agent Selection Guidelines

### When to Use Specialized Agents
- **Complex logic**: Use dedicated agents for detection systems
- **Multiple frameworks**: Parallel agents for each framework
- **Independent modules**: One agent per module

### When to Use General Agents
- **Simple refactoring**: General coder agent sufficient
- **Documentation updates**: General writer agent sufficient
- **Quick fixes**: General reviewer can handle

## Success Criteria for Agents

Each agent must:
1. **Complete objectives**: Achieve all listed goals
2. **Stay within budget**: Use ≤ estimated tokens
3. **Maintain quality**: Pass all reviews
4. **Document learnings**: Update AgentDB with findings
5. **Enable next phase**: Provide clean handoff to next agents

## Agent Retro Schedule

Retrospectives occur after each phase:
- **Phase 1 Retro**: After research completion
- **Phase 2 Retro**: After implementation
- **Phase 3 Retro**: After testing
- **Phase 4 Retro**: After documentation
- **Phase 5 Retro**: Final project retrospective

Template: docs/RETROSPECTIVE_TEMPLATE.md

---

## CI/CD Agent Coordination Patterns

### 12. CI/CD Engineer Agent
**Purpose**: Manage and optimize GitHub Actions pipelines
**Specializations**:
- Pipeline debugging and failure analysis
- Cross-platform testing (Ubuntu, Windows, macOS)
- Performance optimization
- Dependency security auditing

**Tools**: cicd-engineer, reviewer, tester
**Token Budget**: 20,000 tokens per CI/CD issue

**Recent Success**: Fixed 4 CI failures (January 2025)
- Coverage configuration mismatch
- Flaky performance tests
- Cross-platform path resolution
- SIGPIPE error in package verification

### CI/CD Troubleshooting Pattern

**Workflow**: Sequential diagnostic → Parallel fix implementation → Validation

```javascript
// Step 1: Analyze failures
Task("CI/CD Coordinator", "Analyze GitHub Actions logs, identify failure patterns", "cicd-engineer")

// Step 2: Parallel investigation
Task("Test Analyzer", "Investigate coverage configuration issues", "tester")
Task("Performance Reviewer", "Analyze flaky timing tests", "reviewer")
Task("Platform Expert", "Check cross-platform path compatibility", "code-analyzer")

// Step 3: Implement fixes in parallel
Task("Fix Coverage Config", "Update jest.config.js collectCoverageFrom paths", "coder")
Task("Fix Timing Tests", "Add CI threshold multipliers (3x tolerance)", "coder")
Task("Fix Path Resolution", "Convert to dynamic path.resolve()", "coder")
Task("Fix SIGPIPE Error", "Add || true to tar command", "coder")

// Step 4: Validation
Task("Run CI Pipeline", "Trigger GitHub Actions, verify all tests pass", "cicd-engineer")
```

**Memory Coordination**:
```bash
# Store failure analysis
npx agentdb@latest reflexion store \
  "ci-analysis-$(date +%s)" \
  "CI Failure Analysis" \
  0.95 true \
  "Coverage config outdated, timing tests too strict, hardcoded paths, SIGPIPE error" \
  '{"failures": 4, "root_causes": ["config", "timing", "paths", "sigpipe"]}' \
  '{"fixes": ["jest.config.js", "test files", "path handling", "ci.yml"]}'

# Share findings across agents
npx claude-flow@alpha hooks notify \
  --message "Identified 4 CI failures with root causes and solutions"
```

**Results**:
- ✅ 100% CI success rate restored
- ✅ All 4 failures fixed in parallel
- ✅ Learnings stored in AgentDB (episode #1)

### Cross-Platform Testing Pattern

**Workflow**: Parallel OS/Node matrix validation

```javascript
// Matrix testing across platforms
Task("Ubuntu Tester", "Run tests on Ubuntu with Node 20/22", "tester")
Task("Windows Tester", "Run tests on Windows with Node 20/22", "tester")
Task("macOS Tester", "Run tests on macOS with Node 20/22", "tester")

// Platform-specific validation
Task("Path Validator", "Ensure path.sep usage is cross-platform", "code-analyzer")
Task("File System Checker", "Validate file operations on all platforms", "reviewer")
```

**Key Learnings**:
1. **Dynamic Path Resolution**: Use `path.resolve()` instead of hardcoded paths
2. **Platform Detection**: Check `process.platform` for OS-specific logic
3. **CI Timing**: Add 3x multiplier for timing thresholds in CI environments

**Memory Pattern**:
```bash
# Store cross-platform skill
npx agentdb@latest skill create \
  "cross-platform-paths" \
  "Use dynamic path resolution for cross-platform compatibility" \
  'const expected = path.resolve(projectRoot, "templates");'
```

### Performance Optimization Pattern

**Workflow**: Measure → Analyze → Optimize → Validate

```javascript
// Measure baseline
Task("Performance Baseline", "Run benchmarks, identify slow tests", "perf-analyzer")

// Analyze bottlenecks
Task("Bottleneck Analysis", "Identify tests with high variance in CI", "performance-benchmarker")

// Optimize in parallel
Task("Optimize Timing Tests", "Add CI_THRESHOLD_MULTIPLIER = 3", "optimizer")
Task("Optimize Test Execution", "Add --runInBand for sequential execution", "optimizer")
Task("Optimize Jest Config", "Add detectOpenHandles and forceExit", "optimizer")

// Validate improvements
Task("Validate Performance", "Measure improvement and stability", "performance-benchmarker")
```

**Key Optimizations**:
- **Timing Thresholds**: 500ms local → 1500ms CI (3x tolerance)
- **Test Execution**: `--runInBand` for sequential CI execution
- **Resource Cleanup**: `detectOpenHandles: true` for proper cleanup

**Causal Learning**:
```bash
# Learn cause-effect relationships
npx agentdb@latest causal add-edge \
  "add_runInBand_flag" \
  "tests_pass_reliably" \
  0.85 \
  0.92 \
  10

npx agentdb@latest causal add-edge \
  "relax_timing_thresholds" \
  "reduced_flaky_tests" \
  1.0 \
  0.95 \
  10
```

**Results**:
- ✅ Flaky test rate: 15% → 0%
- ✅ CI stability improved
- ✅ Causal edges stored for future reference

## AgentDB Memory Patterns for CI/CD

### Pattern 1: Episode-Based Learning

Store successful CI/CD runs for pattern recognition:

```bash
# After successful fix
npx agentdb@latest reflexion store \
  "ci-fix-coverage-$(date +%s)" \
  "Fixed Jest coverage configuration" \
  0.95 \
  true \
  "Updated collectCoverageFrom to match modular src/ structure" \
  '{"file": "jest.config.js", "issue": "coverage_not_found"}' \
  '{"solution": "updated_paths", "test_result": "pass"}' \
  1500 \
  5000
```

**Database**: `./agentdb.db` (sqlite)
**Episodes Stored**: 5+ CI/CD episodes (January 2025)

### Pattern 2: Skill Consolidation

Convert successful patterns into reusable skills:

```bash
# Extract patterns from episodes
npx agentdb@latest skill consolidate \
  --min-attempts 3 \
  --min-reward 0.8 \
  --time-window-days 7 \
  --extract-patterns true
```

**Generated Skills**:
- `fix-flaky-tests` - Add CI threshold multipliers
- `cross-platform-paths` - Use dynamic path resolution
- `test-isolation` - Add Jest cleanup flags

### Pattern 3: Context Synthesis

Retrieve and synthesize past CI/CD experiences:

```bash
# Query similar issues
npx agentdb@latest reflexion retrieve "CI test failures" \
  --k 10 \
  --synthesize-context \
  --filters '{"success":true,"reward":{"$gte":0.8}}'
```

**Example Synthesized Output**:
```
📊 Retrieved 5 successful CI/CD episodes
🎯 Common patterns:
   - Use dynamic paths (4/5 episodes)
   - Add timing tolerance for CI (3/5 episodes)
   - Sequential test execution (3/5 episodes)
🔧 Recommended actions:
   1. Convert hardcoded paths to path.resolve()
   2. Add CI_THRESHOLD_MULTIPLIER = 3
   3. Add --runInBand flag to Jest
```

## CI/CD Agent Communication Protocol

### 1. Pre-Task Coordination
```bash
npx claude-flow@alpha hooks pre-task --description "Investigate CI failures"
```

### 2. During Implementation
```bash
npx claude-flow@alpha hooks post-edit \
  --file "jest.config.js" \
  --memory-key "swarm/ci-fixes/coverage-config"
```

### 3. Post-Task Summary
```bash
npx claude-flow@alpha hooks post-task --task-id "ci-fixes"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## CI/CD Metrics

**Current Performance (January 2025)**:
- ✅ **CI Success Rate**: 100% (after fixes)
- ⏱️ **Average Pipeline Duration**: 8-12 minutes
- 🔄 **Test Matrix**: 6 combinations (3 OS × 2 Node versions)
- 📦 **Package Size**: ~50KB
- 🧪 **Test Coverage**: 78% (target: 80%)
- 🤖 **Agent Resolution Time**: 25 minutes average per issue

**AgentDB Stats**:
- **Episodes**: 5+ CI/CD episodes stored
- **Skills**: 3+ reusable CI/CD skills
- **Causal Edges**: 2+ learned cause-effect relationships
- **Query Speed**: <100ms (HNSW index)
