# Linear Project: vibe-to-docker

**Project Name:** vibe-to-docker
**Team:** Engineering
**Created:** November 26, 2025
**Current Version:** v5.2.0

---

## Project Description

Universal Docker containerization CLI for AI-generated projects. Supports Figma Make, Lovable, Bolt, V0, and Replit with automatic framework detection and optimized Docker configurations.

---

## Issues for Review

### Priority: High

#### VTD-001: Upgrade Detection Sample Projects
**Type:** Feature
**Labels:** `enhancement`, `detection`
**Estimate:** 3 points
**GitHub Issue:** #24

**Description:**
For each supported tool, obtain a sample project to improve detection accuracy.

**Acceptance Criteria:**
- [ ] Get sample project for Figma Make
- [ ] Get sample project for Lovable
- [ ] Get sample project for Bolt
- [ ] Get sample project for V0
- [ ] Review Replit detection with sample project
- [ ] Create automated tests using sample projects
- [ ] Document detection patterns for each tool

---

#### VTD-002: Fix Dockerfile Template Copy Issues
**Type:** Bug
**Labels:** `bug`, `docker`, `templates`
**Estimate:** 2 points

**Description:**
The Dockerfile template fails to build because it tries to COPY files that don't exist in all project types.

**Current Issues:**
1. `COPY package*.json ./` missing in builder stage (needed for `npm run build`)
2. `COPY serve.json ./` in builder stage fails when file doesn't exist
3. `COPY index.html ./` assumes all projects have index.html at root

**Acceptance Criteria:**
- [ ] Add conditional COPY statements or multi-stage fallbacks
- [ ] Test template with minimal project (no serve.json)
- [ ] Test template with Next.js project (no index.html at root)
- [ ] Update template generation logic to detect file presence

---

#### VTD-003: CI/CD Hook Timeout Stabilization
**Type:** Bug
**Labels:** `bug`, `ci-cd`, `hooks`
**Estimate:** 3 points

**Description:**
AI validation hooks cause CI timeouts. Currently disabled (Option 3) but need proper fix.

**Root Cause:**
- Hooks execute AgentDB and Claude-Flow commands that hang in CI
- No timeout handling in hook scripts
- NPX package fetching adds latency

**Acceptance Criteria:**
- [ ] Add timeout wrapper to all hook executions
- [ ] Implement CI detection to skip heavy operations
- [ ] Re-enable hooks with proper guards
- [ ] Add hook execution metrics

---

### Priority: Medium

#### VTD-004: Node 24 Compatibility
**Type:** Enhancement
**Labels:** `enhancement`, `compatibility`, `node`
**Estimate:** 2 points

**Description:**
Research and implement Node 24 compatibility. Currently on Node 20/22.

**Tasks:**
- [ ] Review NODE_24_RESEARCH_REPORT.md findings
- [ ] Update Dockerfile base images for Node 24
- [ ] Test all detectors with Node 24
- [ ] Update CI matrix to include Node 24

---

#### VTD-005: Test Coverage Improvements
**Type:** Enhancement
**Labels:** `testing`, `quality`
**Estimate:** 3 points

**Description:**
Current coverage at ~78%. Target 85%+ coverage.

**Key Areas Needing Coverage:**
- [ ] `src/cli/init.js` - initialization flow
- [ ] `src/lib/env-validator.js` - environment validation
- [ ] Version checker/fixer utilities
- [ ] Template generation edge cases

---

#### VTD-006: Docker Compose Template Modernization
**Type:** Enhancement
**Labels:** `docker`, `templates`
**Estimate:** 1 point

**Description:**
Remove deprecated `version` attribute from docker-compose.yml template.

**Changes:**
- [ ] Remove `version: '3.8'` from template
- [ ] Update documentation
- [ ] Test with Docker Compose v2.40+

---

#### VTD-007: Multi-Framework Bolt Detection
**Type:** Enhancement
**Labels:** `detection`, `bolt`
**Estimate:** 3 points

**Description:**
Bolt supports multiple frameworks (Angular, React, Vue, Svelte). Improve detection to identify specific framework and adjust Docker config.

**Frameworks to Detect:**
- [ ] Angular (angular.json, @angular/core)
- [ ] React (react, vite.config)
- [ ] Vue (vue.config.js, @vue/cli)
- [ ] Svelte (svelte.config.js)
- [ ] Solid (solid-js)

---

### Priority: Low

#### VTD-008: Metrics Dashboard
**Type:** Feature
**Labels:** `feature`, `metrics`, `ui`
**Estimate:** 5 points

**Description:**
Create a web dashboard to visualize vibe-to-docker usage metrics.

**Features:**
- [ ] Project detection success rates
- [ ] Framework distribution
- [ ] Common errors/failures
- [ ] Build time statistics

---

#### VTD-009: Documentation Cleanup
**Type:** Chore
**Labels:** `documentation`, `maintenance`
**Estimate:** 2 points

**Description:**
Clean up and consolidate documentation. Currently 39 docs files, many are reports/analysis that could be archived.

**Tasks:**
- [ ] Archive old analysis reports
- [ ] Consolidate guides
- [ ] Update README with latest features
- [ ] Add migration guide for v5.x breaking changes

---

#### VTD-010: Security Scanning Integration
**Type:** Enhancement
**Labels:** `security`, `ci-cd`
**Estimate:** 2 points

**Description:**
Enhance generated Dockerfiles with security scanning.

**Features:**
- [ ] Add Trivy scanning to generated docker-compose
- [ ] Include security headers in nginx.conf template
- [ ] Add npm audit to build process
- [ ] Document security best practices

---

## Backlog Items

| ID | Title | Type | Priority | Estimate |
|----|-------|------|----------|----------|
| VTD-011 | Add Cursor IDE detection | Feature | Low | 2 |
| VTD-012 | Windows path handling improvements | Bug | Medium | 2 |
| VTD-013 | Add --dry-run flag for init command | Feature | Low | 1 |
| VTD-014 | Template caching for faster init | Enhancement | Low | 2 |
| VTD-015 | Plugin system for custom detectors | Feature | Low | 5 |

---

## Import Instructions

### Option 1: Linear CLI
```bash
# Install Linear CLI
npm install -g @linear/cli

# Authenticate
linear auth

# Create project
linear project create "vibe-to-docker" --team "Engineering"

# Import issues (manual or script)
```

### Option 2: Linear Web UI
1. Go to Linear → Create Project → "vibe-to-docker"
2. Manually create issues from this document
3. Use bulk import if available

### Option 3: Linear API
```javascript
// Use Linear GraphQL API
const response = await linearClient.createIssue({
  teamId: "YOUR_TEAM_ID",
  title: "VTD-001: Upgrade Detection Sample Projects",
  description: "...",
  priority: 1,
  estimate: 3
});
```

---

## Labels to Create

| Label | Color | Description |
|-------|-------|-------------|
| bug | Red | Something isn't working |
| enhancement | Blue | New feature or improvement |
| detection | Purple | Framework detection related |
| docker | Cyan | Docker/containerization |
| templates | Green | Template generation |
| ci-cd | Orange | CI/CD pipeline |
| testing | Yellow | Test coverage |
| documentation | Gray | Documentation updates |
| security | Red | Security related |

---

*Generated by Claude Code on November 26, 2025*
