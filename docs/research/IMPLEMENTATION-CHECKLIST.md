# CI/CD Optimization - Implementation Checklist
**Project:** vibe-to-docker | **Date:** November 14, 2025

---

## Phase 1: Immediate Security Updates ⚡
**Time Required:** 30 minutes | **Priority:** 🔴 HIGH

### Step 1: Update Dependencies (10 min)
- [ ] Open terminal in project root
- [ ] Run: `npm update @babel/core @babel/preset-env js-yaml`
- [ ] Run: `npm audit` to verify no vulnerabilities
- [ ] Expected output: "found 0 vulnerabilities"

```bash
cd /Users/williamsmith/Documents/GitHub/vibe-to-docker
npm update @babel/core @babel/preset-env js-yaml
npm audit
```

### Step 2: Verify Tests (10 min)
- [ ] Run: `npm test`
- [ ] Verify all tests pass
- [ ] Run: `npm run test:coverage` (optional)
- [ ] Check coverage reports look normal

```bash
npm test
# All tests should pass
```

### Step 3: Commit Changes (5 min)
- [ ] Review changes: `git diff package.json package-lock.json`
- [ ] Stage changes: `git add package.json package-lock.json`
- [ ] Commit: `git commit -m "fix(deps): update babel and js-yaml for security patches"`
- [ ] Push: `git push origin pack-master`

```bash
git status
git diff package.json package-lock.json
git add package.json package-lock.json
git commit -m "fix(deps): update babel and js-yaml for security patches

- Update @babel/core from 7.28.4 to 7.28.5
- Update @babel/preset-env from 7.28.3 to 7.28.5
- Update js-yaml from 4.1.0 to 4.1.1 (fixes GHSA-mh29-5h37-fv8m)"
git push origin pack-master
```

### Step 4: Verify Semantic Release (5 min)
- [ ] Run: `npx semantic-release --dry-run --no-ci`
- [ ] Check output for "Published release"
- [ ] If skipped, verify commit message follows convention
- [ ] Check GitHub secrets: `gh secret list`
- [ ] Verify NPM_TOKEN is present

```bash
npx semantic-release --dry-run --no-ci
gh secret list
# Should show: NPM_TOKEN and GITHUB_TOKEN
```

**✅ Phase 1 Complete Checklist:**
- [ ] Zero npm audit vulnerabilities
- [ ] All tests passing
- [ ] Changes committed and pushed
- [ ] Semantic release verified

---

## Phase 2: Automation Setup 🤖
**Time Required:** 2-3 hours | **Priority:** 🟡 MEDIUM

### Step 1: Create Dependabot Configuration (30 min)
- [ ] Create file: `.github/dependabot.yml`
- [ ] Copy configuration from template below
- [ ] Customize reviewers and labels
- [ ] Commit and push

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "wrsmith108"
    labels:
      - "dependencies"
      - "automated"
    groups:
      babel:
        patterns:
          - "@babel/*"
      semantic-release:
        patterns:
          - "@semantic-release/*"
          - "semantic-release"
      jest:
        patterns:
          - "jest*"
          - "@jest/*"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

**Commands:**
```bash
mkdir -p .github
cat > .github/dependabot.yml << 'EOF'
# Paste YAML above
EOF
git add .github/dependabot.yml
git commit -m "ci(deps): add Dependabot configuration for automated updates"
git push
```

### Step 2: Create Weekly Security Audit Workflow (45 min)
- [ ] Create file: `.github/workflows/security-audit.yml`
- [ ] Copy workflow from template below
- [ ] Test with: `gh workflow run security-audit.yml`
- [ ] Verify it runs successfully

```yaml
# .github/workflows/security-audit.yml
name: Weekly Security Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  security-audit:
    name: Dependency & Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check for outdated packages
        id: outdated
        run: |
          echo "### Outdated Packages" >> $GITHUB_STEP_SUMMARY
          npm outdated >> $GITHUB_STEP_SUMMARY || echo "All packages up to date" >> $GITHUB_STEP_SUMMARY
        continue-on-error: true

      - name: Security audit
        id: audit
        run: |
          echo "### Security Audit Results" >> $GITHUB_STEP_SUMMARY
          npm audit --audit-level=moderate >> $GITHUB_STEP_SUMMARY
        continue-on-error: false

      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const date = new Date().toISOString().split('T')[0];
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `🔒 Security Audit Failed - ${date}`,
              body: `Security vulnerabilities detected in weekly audit.

              **Action Required:**
              1. Review the [workflow run](${context.payload.repository.html_url}/actions/runs/${context.runId})
              2. Update vulnerable dependencies
              3. Run tests to verify fixes

              **Automated Report:** ${date}`,
              labels: ['security', 'dependencies', 'automated']
            });
```

**Commands:**
```bash
cat > .github/workflows/security-audit.yml << 'EOF'
# Paste YAML above
EOF
git add .github/workflows/security-audit.yml
git commit -m "ci(security): add weekly security audit workflow"
git push
```

### Step 3: Test Automation (30 min)
- [ ] Trigger Dependabot: Wait for Monday or manually trigger
- [ ] Trigger security audit: `gh workflow run security-audit.yml`
- [ ] Monitor workflow: `gh run watch`
- [ ] Verify no issues created

```bash
# Manually trigger security audit
gh workflow run security-audit.yml

# Watch the run
gh run watch

# Check recent runs
gh run list --workflow=security-audit.yml --limit 5
```

### Step 4: Document Automation (15 min)
- [ ] Update README.md with automation notes
- [ ] Add badge for security audit workflow (optional)
- [ ] Document Dependabot behavior for team

**✅ Phase 2 Complete Checklist:**
- [ ] Dependabot configured and running
- [ ] Weekly security audit scheduled
- [ ] Workflows tested manually
- [ ] Documentation updated

---

## Phase 3: Performance Optimization 🚀
**Time Required:** 1-2 days | **Priority:** 🟢 LOW

### Step 1: Enhanced Caching (2 hours)

#### A. Add Cache Metrics (30 min)
- [ ] Edit `.github/workflows/ci.yml`
- [ ] Add cache hit reporting to test jobs
- [ ] Commit and test

```yaml
# Add after actions/setup-node@v4
- name: Cache Hit Report
  id: cache-report
  run: |
    echo "### 📦 Cache Performance" >> $GITHUB_STEP_SUMMARY
    if [ "${{ steps.setup-node.outputs.cache-hit }}" == "true" ]; then
      echo "✅ Full cache hit - Saved ~45 seconds" >> $GITHUB_STEP_SUMMARY
    else
      echo "❌ Cache miss - Full install required" >> $GITHUB_STEP_SUMMARY
    fi
```

#### B. Add Jest Caching (30 min)
- [ ] Create or update `jest.config.js`
- [ ] Add cache configuration
- [ ] Update CI workflow to cache Jest results

```javascript
// jest.config.js additions
export default {
  // ... existing config
  cache: true,
  cacheDirectory: '.jest-cache',
  maxWorkers: process.env.CI ? '50%' : '100%',
};
```

```yaml
# Add to .github/workflows/ci.yml
- name: Cache Jest
  uses: actions/cache@v4
  with:
    path: .jest-cache
    key: ${{ runner.os }}-jest-${{ hashFiles('**/jest.config.js') }}
```

#### C. Test Cache Performance (1 hour)
- [ ] Run workflow twice in succession
- [ ] Compare execution times
- [ ] Document cache hit rates
- [ ] Adjust strategy if needed

### Step 2: Parallel Job Execution (3 hours)

#### A. Refactor Job Dependencies (2 hours)
- [ ] Analyze current job flow
- [ ] Identify parallelizable jobs
- [ ] Update `needs:` clauses
- [ ] Test workflow

```yaml
# Current (sequential):
jobs:
  security: ...
  lint:
    needs: security
  test:
    needs: lint
  build:
    needs: test

# Optimized (parallel):
jobs:
  setup:
    # Cache only

  security:
    needs: setup

  lint:
    needs: setup

  test:
    needs: setup

  build:
    needs: [security, lint, test]
```

#### B. Test Parallel Execution (1 hour)
- [ ] Push changes
- [ ] Monitor workflow execution
- [ ] Verify all jobs pass
- [ ] Measure time savings

### Step 3: Conditional Execution (2 hours)

#### A. Add Path Filters (1 hour)
- [ ] Add conditional logic for docs-only changes
- [ ] Add conditional logic for test-only changes
- [ ] Test with various commit types

```yaml
# Add to jobs
test:
  if: |
    !contains(github.event.head_commit.message, '[skip tests]') &&
    (contains(github.event.head_commit.modified, 'src/') ||
     contains(github.event.head_commit.modified, 'test/'))
```

#### B. Test Conditionals (1 hour)
- [ ] Make docs-only change
- [ ] Verify tests are skipped
- [ ] Make code change
- [ ] Verify full pipeline runs

### Step 4: Matrix Optimization (2 hours)

#### A. Refine Test Matrix (1 hour)
```yaml
# Current: 6 jobs (3 OS × 2 Node)
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [20, 22]

# Optimized: 4 jobs
strategy:
  matrix:
    os: [ubuntu-latest]
    node-version: [20, 22]
    include:
      - os: windows-latest
        node-version: 20
      - os: macos-latest
        node-version: 20
```

#### B. Test Matrix Changes (1 hour)
- [ ] Push changes
- [ ] Verify all essential platforms tested
- [ ] Verify both Node versions tested on Ubuntu
- [ ] Measure time/cost savings

### Step 5: Performance Monitoring (1 hour)

#### A. Add Timing Metrics
```yaml
- name: Performance Metrics
  run: |
    echo "### ⏱️ Performance Breakdown" >> $GITHUB_STEP_SUMMARY
    echo "Job start: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $GITHUB_STEP_SUMMARY
```

#### B. Create Performance Dashboard
- [ ] Track metrics in spreadsheet or dashboard
- [ ] Monitor trends over 2 weeks
- [ ] Adjust optimizations as needed

**✅ Phase 3 Complete Checklist:**
- [ ] Enhanced caching implemented
- [ ] Parallel execution configured
- [ ] Conditional execution added
- [ ] Matrix optimized
- [ ] Performance monitoring active
- [ ] 40% time reduction achieved

---

## Validation & Testing 🧪

### Post-Implementation Tests

#### Test 1: Security Audit
```bash
npm audit
# Expected: 0 vulnerabilities
```

#### Test 2: Dependency Freshness
```bash
npm outdated
# Expected: No major updates needed
```

#### Test 3: Semantic Release Dry Run
```bash
npx semantic-release --dry-run --no-ci
# Expected: Shows what would be released
```

#### Test 4: CI Pipeline
```bash
# Trigger workflow
gh workflow run ci.yml

# Watch execution
gh run watch

# Check duration
gh run list --limit 1 --json name,conclusion,updatedAt,workflowDatabaseId
```

#### Test 5: Cache Performance
- [ ] Run CI twice in succession
- [ ] Compare "Setup Node.js" step times
- [ ] Verify >50% time reduction on second run

---

## Monitoring Schedule 📊

### Daily (First Week)
- [ ] Check Dependabot PRs
- [ ] Review any security audit failures
- [ ] Monitor CI pipeline times

### Weekly
- [ ] Review Dependabot PRs and merge if tests pass
- [ ] Check security audit results
- [ ] Track pipeline performance trends

### Monthly
- [ ] Rotate NPM_TOKEN (security best practice)
- [ ] Review and update dependencies manually if needed
- [ ] Analyze cost/time metrics

### Quarterly
- [ ] Review entire CI/CD configuration
- [ ] Update this checklist based on lessons learned
- [ ] Consider new optimization opportunities

---

## Rollback Procedures 🔄

### If Dependencies Break Tests
```bash
# Revert to previous versions
git revert HEAD
git push

# Or manual rollback
npm install @babel/core@7.28.4 @babel/preset-env@7.28.3 js-yaml@4.1.0
npm test
git commit -am "revert(deps): rollback babel and js-yaml updates"
```

### If Dependabot Causes Issues
```yaml
# .github/dependabot.yml
# Add to ignore section:
ignore:
  - dependency-name: "problematic-package"
    versions: ["x.y.z"]
```

### If Workflow Changes Break CI
```bash
# Revert workflow changes
git revert <commit-hash>
git push

# Or edit directly
git checkout HEAD~1 .github/workflows/ci.yml
git commit -m "revert(ci): restore previous workflow configuration"
git push
```

---

## Success Metrics Dashboard 📈

### Before Optimization
| Metric | Value |
|--------|-------|
| Pipeline Duration | ~12 minutes |
| Cache Hit Rate | Unknown |
| Security Vulnerabilities | 1 moderate |
| Manual Updates | Weekly |
| Developer Feedback Loop | Slow |

### Target After All Phases
| Metric | Target |
|--------|--------|
| Pipeline Duration | ~7 minutes (40% ⬇️) |
| Cache Hit Rate | >85% |
| Security Vulnerabilities | 0 |
| Manual Updates | Automated |
| Developer Feedback Loop | Fast |

### Tracking Template
Create a simple spreadsheet or use GitHub Actions insights:

| Date | Duration | Cache Hit | Vulnerabilities | Notes |
|------|----------|-----------|-----------------|-------|
| 2025-01-14 | 12m | - | 1 | Baseline |
| After Phase 1 | - | - | 0 | Security fixed |
| After Phase 2 | - | 85% | 0 | Automation added |
| After Phase 3 | 7m | 90% | 0 | Optimizations done |

---

## Troubleshooting Guide 🔧

### Issue: Semantic Release Skipped
**Diagnosis:**
```bash
npx semantic-release --dry-run --no-ci --debug
```

**Common Fixes:**
1. Ensure on correct branch: `git branch --show-current`
2. Check commit format: `git log --oneline -5`
3. Verify NPM_TOKEN: `gh secret list`
4. Check no duplicate release: `git tag -l`

### Issue: npm audit Fails
**Diagnosis:**
```bash
npm audit --audit-level=moderate
npm audit --json > audit-report.json
```

**Fix:**
```bash
# Try automatic fix first
npm audit fix

# If that doesn't work
npm audit fix --force  # Caution: may break things

# Or update manually
npm update <package-name>
```

### Issue: Cache Not Working
**Diagnosis:**
- Check workflow logs for "Cache hit" messages
- Verify cache key hasn't changed
- Check storage quota: Settings → Actions → Caches

**Fix:**
```bash
# Clear cache via GitHub UI or API
gh api -X DELETE /repos/:owner/:repo/actions/caches?key=<cache-key>

# Or update cache key in workflow
key: ${{ runner.os }}-v2-${{ hashFiles('**/package-lock.json') }}
```

### Issue: Tests Timeout in CI
**Fix:**
```yaml
# Increase timeout
- name: Run tests
  run: npm test
  timeout-minutes: 15  # Default is 6

# Or optimize tests
# jest.config.js
testTimeout: 30000  # 30 seconds per test
```

---

## Resources & References 📚

### Official Documentation
- [GitHub Actions](https://docs.github.com/en/actions)
- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [npm audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

### Project-Specific
- [Full Research Report](./ci-cd-optimization-analysis.md)
- [Executive Summary](./EXECUTIVE-SUMMARY.md)
- Current CI/CD Workflow: `.github/workflows/ci.yml`
- Package Configuration: `package.json`

### External Tools
- [GitHub CLI](https://cli.github.com/)
- [act](https://github.com/nektos/act) - Local GitHub Actions testing
- [Snyk](https://snyk.io/) - Advanced security scanning

---

## Sign-Off Checklist ✍️

### Phase 1: Immediate (Required)
- [ ] Dependencies updated
- [ ] Tests passing
- [ ] Changes committed
- [ ] Semantic release verified

### Phase 2: Automation (Recommended)
- [ ] Dependabot configured
- [ ] Security audit scheduled
- [ ] Workflows tested
- [ ] Team notified

### Phase 3: Performance (Optional)
- [ ] Caching enhanced
- [ ] Jobs parallelized
- [ ] Matrix optimized
- [ ] Metrics tracked

---

**Last Updated:** November 14, 2025
**Next Review:** Weekly for first month, then monthly
**Owner:** DevOps/Platform Team
