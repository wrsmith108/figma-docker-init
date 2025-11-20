# Phase 1: Foundation & Quick Wins - Implementation Plan

**Token Budget**: 75,000 tokens
**Buffer**: ±20% (60K - 90K tokens)
**Priority**: 🔴 HIGH
**Branch**: `feature/agentdb-retrieval-tracking` (AgentDB work) + `pack-master` (vibe-to-docker work)

---

## Branch Separation Strategy

### Work on `feature/agentdb-retrieval-tracking`:
- ✅ AgentDB retrieval tracking (COMPLETE)
- ✅ Token-based planning templates (COMPLETE)
- ⏳ AgentDB hook fixes (ai-validate.js)
- ⏳ Retrieval integration improvements

### Work on `pack-master`:
- ⏳ File organization cleanup
- ⏳ Automated metrics collection
- ⏳ Feature launch checklist
- ⏳ vibe-to-docker enhancements

---

## Phase 1 Tasks (Parallelized)

### Task 1.1: Fix AgentDB Hooks (AgentDB Branch)

**Branch**: `feature/agentdb-retrieval-tracking`
**Tokens**: 18,000
**Priority**: 🔴 CRITICAL
**Agent**: Backend Developer

**Objectives**:
- Fix `scripts/ai-validate.js` JSON parsing error
- Enable pre-task hooks with tracked retrieval
- Integrate error handlers with AgentDB

**Implementation**:
```javascript
// scripts/ai-validate.js FIX
// BEFORE (WRONG)
const reflexionData = await execPromise(
  `npx agentdb@latest reflexion synthesize --filter "ci-failure-*" --format json`
);
const parsed = JSON.parse(reflexionData);

// AFTER (CORRECT)
const reflexionOutput = await execPromise(
  `./scripts/agentdb-retrieve-tracked.sh "CI/CD failure patterns" 10`
);
// Parse markdown output, extract episode info
const episodePattern = /Episode (\d+).*?Reward: ([\d.]+)/g;
// ... markdown parsing logic
```

**Files to Edit**:
- `scripts/ai-validate.js` (fix query pattern)
- `.claude-flow/hooks/pre-task` (enable retrieval)
- `.claude-flow/hooks/pre-commit` (fix validation)

**Tests**:
```bash
# Test AI validation
git add . && git commit -m "test: validate hook fix"
# Should not see JSON parsing error

# Test pre-task hook
./.claude-flow/hooks/pre-task "test task description"
# Should query AgentDB successfully
```

**Deliverable**: Pre-commit hooks working without JSON errors

---

### Task 1.2: File Organization Cleanup (Main Branch)

**Branch**: `pack-master`
**Tokens**: 15,000
**Priority**: 🔴 HIGH
**Agent**: Code Organizer

**Objectives**:
- Move 9 internal docs from `/docs` to `.claude-flow/docs/architecture/`
- Clean temp directories
- Update documentation index

**Files to Move**:
```bash
# Create target directory
mkdir -p .claude-flow/docs/architecture

# Move internal docs
git mv docs/ARCHITECTURE_DESIGN.md .claude-flow/docs/architecture/
git mv docs/INITIALIZATION_ARCHITECTURE.md .claude-flow/docs/architecture/
git mv docs/INITIALIZATION_REPORT.md .claude-flow/docs/architecture/
git mv docs/SYSTEM_ARCHITECTURE.md .claude-flow/docs/architecture/
git mv docs/TEST_FRAMEWORK.md .claude-flow/docs/architecture/
git mv docs/BACKEND_IMPLEMENTATION_REPORT.md .claude-flow/docs/architecture/
git mv docs/ARCHITECTURE_SUMMARY.md .claude-flow/docs/architecture/
git mv docs/INIT_ANALYSIS.md .claude-flow/docs/architecture/
git mv docs/INITIALIZATION_SYSTEM_ARCHITECTURE.md .claude-flow/docs/architecture/
```

**Cleanup**:
```bash
# Remove temp test directories
rm -rf temp-test-*/

# Remove untracked architecture files
git clean -fd docs/adr/
git clean -fd docs/architecture/
git clean -fd docs/initialization/
git clean -fd src/cli/
git clean -fd src/core/
git clean -fd src/lib/init/
git clean -fd tests/e2e/init-workflows/
git clean -fd tests/unit/cli/
git clean -fd tests/unit/core/
git clean -fd tests/unit/init/
```

**Create Index**:
```bash
# .claude-flow/docs/INDEX.md
```

**Deliverable**: Clean directory structure, all docs in correct locations

---

### Task 1.3: Automated Metrics Collection (Main Branch)

**Branch**: `pack-master`
**Tokens**: 35,000
**Priority**: 🟡 MEDIUM
**Agent**: Full-Stack Developer

**Objectives**:
- Create SQLite metrics database
- Track detection, build, error metrics
- Privacy controls (opt-out)
- Analytics dashboard

**Database Schema**:
```sql
-- .claude-flow/metrics/schema.sql
CREATE TABLE IF NOT EXISTS detection_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  framework TEXT,
  confidence REAL,
  source_tool TEXT,
  success BOOLEAN,
  detection_time_ms INTEGER
);

CREATE TABLE IF NOT EXISTS build_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  template TEXT,
  success BOOLEAN,
  duration_ms INTEGER,
  error_type TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  error_message TEXT,
  resolution TEXT,
  frequency INTEGER DEFAULT 1,
  UNIQUE(error_message)
);

CREATE INDEX idx_detection_timestamp ON detection_metrics(timestamp);
CREATE INDEX idx_build_timestamp ON build_metrics(timestamp);
CREATE INDEX idx_error_timestamp ON error_patterns(timestamp);
```

**Implementation Files**:
- `src/lib/metrics-collector.js` (collector module)
- `src/lib/metrics-dashboard.js` (dashboard generator)
- `.claude-flow/metrics/schema.sql` (database schema)

**CLI Command**:
```bash
npx vibe-to-docker metrics [--since 7d] [--export json]
```

**Privacy**:
```bash
# Opt-out via environment variable
export VIBE_DOCKER_DISABLE_METRICS=1
```

**Deliverable**: Metrics collection operational, dashboard accessible

---

### Task 1.4: Feature Launch Checklist (Main Branch)

**Branch**: `pack-master`
**Tokens**: 7,000
**Priority**: 🟢 LOW
**Agent**: Technical Writer

**Objectives**:
- Create standardized checklist template
- Update PR template
- Document usage guidelines

**Checklist Template**:
```markdown
# Feature Launch Checklist

## Pre-Launch
- [ ] Tests written and passing (80%+ coverage)
- [ ] Documentation updated (user-facing + developer)
- [ ] CHANGELOG.md entry added
- [ ] Breaking changes documented (if any)
- [ ] Migration guide created (if needed)

## Quality Assurance
- [ ] Security review complete
- [ ] Performance impact assessed
- [ ] Cross-platform tested (Linux, macOS, Windows)
- [ ] Real-world project validation

## Learning & Metrics
- [ ] AgentDB episode stored with learnings
- [ ] Token consumption tracked and documented
- [ ] Retrospective completed (if phase-ending)

## Release
- [ ] Version bumped (semantic versioning)
- [ ] Git tag created
- [ ] npm package published
- [ ] GitHub release created with notes
```

**Deliverable**: Checklist template in `.claude-flow/docs/FEATURE_LAUNCH_CHECKLIST.md`

---

## Swarm Initialization

**Topology**: Hierarchical
**Max Agents**: 4 (one per task)
**Strategy**: Balanced
**Coordination**: Claude-Flow + AgentDB

**Agent Assignment**:
1. **Backend Developer** → Task 1.1 (AgentDB hooks fix)
2. **Code Organizer** → Task 1.2 (File organization)
3. **Full-Stack Developer** → Task 1.3 (Metrics collection)
4. **Technical Writer** → Task 1.4 (Feature checklist)

**Execution Strategy**:
- Tasks 1.1 and 1.2-1.4 run in parallel (different branches)
- Task 1.1 stays on `feature/agentdb-retrieval-tracking`
- Tasks 1.2-1.4 run on `pack-master`
- Merge AgentDB branch after completion

---

## Success Criteria

- ✅ Pre-commit hooks working (no JSON errors)
- ✅ Clean documentation structure
- ✅ Metrics collection active
- ✅ Feature checklist adopted
- ✅ AgentDB retrieval ratio > 1.0

**Total Tokens**: 75K (18K + 15K + 35K + 7K)

---

## Execution Commands

```bash
# Initialize swarm
npx claude-flow@alpha swarm init --topology hierarchical --max-agents 4

# Spawn agents
npx claude-flow@alpha agent spawn backend-dev --name "AgentDB Hook Fixer"
npx claude-flow@alpha agent spawn coder --name "File Organizer"
npx claude-flow@alpha agent spawn backend-dev --name "Metrics Developer"
npx claude-flow@alpha agent spawn tester --name "Checklist Writer"

# Orchestrate tasks
npx claude-flow@alpha task orchestrate "Phase 1: Foundation & Quick Wins" --strategy parallel
```
