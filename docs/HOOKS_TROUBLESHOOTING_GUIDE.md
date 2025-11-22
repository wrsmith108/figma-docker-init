# AI Validation Hooks - Troubleshooting & Re-enablement Guide

**Date**: January 22, 2025
**Status**: Hooks temporarily disabled due to CI/CD incompatibility
**Related Issues**:
- [Claude Code GitHub Actions Bug #3573](https://github.com/anthropics/claude-code/issues/3573)
- [Pre-commit CI/CD Issues](https://stackoverflow.com/questions/67608493/how-to-ensure-that-all-pre-commit-hooks-pass-in-ci-cd)

---

## Executive Summary

**Problem**: AI validation hooks (pre-commit, pre-push) work perfectly in local development but cause GitHub Actions CI/CD to hang/timeout.

**Root Cause**: Hooks designed for interactive local development (using `npx` commands, swarm initialization, AgentDB queries) are incompatible with CI environments due to:
1. stdin/stdout availability differences
2. Working directory/environment differences
3. Desktop notification commands fail in headless CI
4. No circuit breaker to stop failed hooks from re-executing
5. Swarm initialization hangs waiting for user input

**Solution**: Hooks disabled for CI stability. This guide documents how to re-enable them with CI-safe configurations.

---

## Original Hook Configuration

### Location
- **Pre-commit**: `.git/hooks/pre-commit` → `.claude-flow/hooks/pre-commit`
- **Pre-push**: `.git/hooks/pre-push` → `.claude-flow/hooks/pre-push`
- **Post-failure**: `.claude-flow/hooks/post-failure`

### Git Configuration
```bash
git config core.hooksPath .claude-flow/hooks
```

### Hook Functionality

#### Pre-commit Hook
**Purpose**: AI-powered validation before commits using 7-agent hierarchical swarm

**Agents**:
1. Test Predictor - Predicts test failures before CI
2. Coverage Analyzer - Ensures coverage thresholds
3. Platform Validator - Detects cross-platform issues
4. Security Scanner - Identifies vulnerabilities
5. Performance Analyzer - Predicts performance failures
6. Semantic Validator - Validates commit format
7. Queen Coordinator - Strategic oversight

**Approval**: Requires 6/7 agent consensus (Byzantine fault tolerance)

**Execution**:
```bash
node scripts/ai-validate.js --verbose
```

**Why It Hangs in CI**:
```javascript
// This line hangs in CI:
npx claude-flow@alpha swarm init --topology hierarchical --max-agents 7

// Waits for:
// - User interaction (not available in CI)
// - stdin confirmation (CI has no stdin)
// - Desktop notifications (headless CI)
```

#### Pre-push Hook
**Purpose**: Final Byzantine consensus validation (100% approval required)

**Execution**:
```bash
node scripts/ai-validate.js --strict
```

**Why It Hangs in CI**: Same swarm initialization issue, but stricter (requires 100% consensus).

#### Post-failure Hook
**Purpose**: Store failure patterns in AgentDB for learning

**Execution**:
```bash
./.claude-flow/hooks/post-failure "test" "failure details"
```

**Works in CI**: This hook is manual-only, not triggered by git.

---

## Known Solutions (Not Yet Implemented)

### Solution 1: CI Environment Detection

**Modify hooks to skip in CI**:

```bash
#!/bin/bash
# .claude-flow/hooks/pre-commit

# Detect CI environment
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
  echo "⏭️  Skipping AI validation in CI environment"
  exit 0
fi

# Run validation for local development only
node scripts/ai-validate.js --verbose
```

**Pros**: Hooks work locally, skip in CI
**Cons**: No AI validation in CI (defeats purpose)

---

### Solution 2: Use GitHub Actions for Validation

**Move AI validation from hooks to GitHub Actions workflow**:

```yaml
# .github/workflows/ai-validate.yml
name: AI Pre-deployment Validation

on:
  push:
    branches: [pack-master]
  pull_request:

jobs:
  ai-validate:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install Claude Flow Globally
        run: |
          npm install -g claude-flow@alpha
          export PATH="$PATH:$(npm config get prefix)/bin"

      - name: Run AI Validation
        run: node scripts/ai-validate.js --ci-mode
        env:
          CI: true
          GITHUB_ACTIONS: true
        continue-on-error: false
```

**Pros**:
- AI validation runs in CI
- Proper timeout handling
- Global claude-flow installation (no npx hangs)

**Cons**:
- Validation happens AFTER push (not before)
- Slower feedback loop

---

### Solution 3: Hybrid Approach (RECOMMENDED)

**Local**: Use AI validation hooks
**CI**: Use standard pre-commit framework

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: local
    hooks:
      - id: tests
        name: Run test suite
        entry: npm test
        language: system
        pass_filenames: false
        always_run: true
```

**GitHub Actions**:
```yaml
- name: Run pre-commit hooks
  run: pre-commit run --all-files --show-diff-on-failure
```

**Pros**:
- Standard, reliable CI validation
- Local AI validation optional
- No hanging issues

**Cons**:
- Lose AI prediction capabilities in CI

---

### Solution 4: Fix Swarm Initialization for CI

**Modify `scripts/ai-validate.js` to be CI-aware**:

```javascript
// scripts/ai-validate.js (FIXED)

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

async function initSwarm() {
  if (isCI) {
    // CI-safe initialization (no user interaction)
    return await exec('claude-flow swarm init --topology hierarchical --max-agents 7 --non-interactive || exit 0');
  } else {
    // Local interactive initialization
    return await exec('npx claude-flow@alpha swarm init --topology hierarchical --max-agents 7');
  }
}
```

**Add to hook scripts**:
```bash
# .claude-flow/hooks/pre-commit (FIXED)

if [ "$CI" = "true" ]; then
  # Use global claude-flow with fallback
  claude-flow swarm init --non-interactive || exit 0
else
  # Use npx for local development
  npx claude-flow@alpha swarm init --topology hierarchical
fi
```

**Pros**:
- Works in both local and CI
- Preserves AI validation

**Cons**:
- Requires claude-flow to support `--non-interactive` flag
- May need upstream changes

---

## Re-enablement Steps

### Prerequisites

1. Choose one of the solutions above
2. Test locally first:
   ```bash
   CI=true GITHUB_ACTIONS=true node scripts/ai-validate.js --verbose
   ```
3. Ensure no hangs/timeouts

### Step 1: Re-enable Git Hooks

```bash
# Set hooks path back to .claude-flow/hooks
git config core.hooksPath .claude-flow/hooks

# Make hooks executable
chmod +x .claude-flow/hooks/*

# Test pre-commit hook
git commit --dry-run -m "test"
```

### Step 2: Verify Local Operation

```bash
# Should run AI validation
echo "test" >> test.txt
git add test.txt
git commit -m "test: verify hooks"

# Should see:
# - Swarm initialization
# - 7 agents spawned
# - Byzantine consensus vote
# - Approval or rejection
```

### Step 3: Test CI Simulation

```bash
# Simulate CI environment locally
CI=true GITHUB_ACTIONS=true git commit -m "test"

# Should:
# - Skip hooks gracefully (Solution 1)
# - OR run with --non-interactive (Solution 4)
# - NOT hang
```

### Step 4: Push to Feature Branch

```bash
# Test on non-main branch first
git checkout -b test-hooks-re-enable
git push --set-upstream origin test-hooks-re-enable

# Monitor GitHub Actions:
gh run watch
```

### Step 5: Verify CI Passes

- Security Scan: PASS
- Lint & Code Quality: PASS
- Tests (6 jobs): PASS
- No hangs or timeouts

### Step 6: Merge to Main

```bash
git checkout pack-master
git merge test-hooks-re-enable
git push
```

---

## Debugging Commands

### Check Hook Configuration
```bash
git config --get core.hooksPath
ls -la .claude-flow/hooks/
```

### Test Hook Execution
```bash
# Dry run
./.claude-flow/hooks/pre-commit --dry-run

# With CI environment
CI=true ./.claude-flow/hooks/pre-commit
```

### Monitor Swarm Initialization
```bash
# Check if swarm hangs
timeout 10 npx claude-flow@alpha swarm init --topology hierarchical || echo "TIMEOUT"
```

### Check AgentDB Status
```bash
npx agentdb@latest stats
npx agentdb@latest reflexion retrieve "ci-failure" --k 5
```

---

## Related Documentation

- **Current Hooks**: `.claude-flow/hooks/` directory
- **AI Validation Script**: `scripts/ai-validate.js`
- **Agent Definitions**: `docs/AGENTS.md`
- **Pre-Push Report**: `docs/PRE_PUSH_VALIDATION_REPORT.md`
- **Phase 2 Analysis**: `docs/PHASE_2_FIX_ANALYSIS.md`

---

## Sources & References

1. [Claude Code GitHub Actions Bug #3573](https://github.com/anthropics/claude-code/issues/3573) - Stop hook infinite loop in CI
2. [Claude Flow Hooks System Issue #145](https://github.com/ruvnet/claude-flow/issues/145) - Automated lifecycle management
3. [Pre-commit CI/CD Best Practices](https://stackoverflow.com/questions/67608493/how-to-ensure-that-all-pre-commit-hooks-pass-in-ci-cd)
4. [Running Pre-commit in GitHub Actions](https://thomasthornton.cloud/2022/08/04/running-pre-commit-hooks-as-github-actions/)
5. [Claude Flow Wiki: Hooks System](https://github.com/ruvnet/claude-flow/wiki/Hooks-System)
6. [Claude Flow Wiki: GitHub Actions Tutorial](https://github.com/ruvnet/claude-flow/wiki/GitHub-Actions-Tutorial)

---

## Change Log

- **2025-01-22**: Hooks disabled due to CI/CD incompatibility (this document created)
- **2025-01-21**: Hooks implemented with 7-agent Byzantine consensus
- **2025-01-20**: Initial AI validation system design

---

**Status**: Ready for re-enablement when solution is chosen and implemented.
