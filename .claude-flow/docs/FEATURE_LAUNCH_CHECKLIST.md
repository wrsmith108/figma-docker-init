# Feature Launch Checklist

## Overview

This checklist ensures consistent quality, documentation, and learning capture for all significant features. Use this for new features, major enhancements, and breaking changes.

---

## Pre-Launch

### Code Quality
- [ ] **Tests written and passing**: Minimum 80% coverage for new code
  - Unit tests for core logic
  - Integration tests for API endpoints
  - End-to-end tests for critical user flows
- [ ] **Code review completed**: At least one approval from maintainer
- [ ] **Linting and formatting**: All automated checks passing
- [ ] **Type checking**: TypeScript strict mode passing (if applicable)

### Documentation
- [ ] **User-facing documentation updated**:
  - README.md reflects new functionality
  - Usage examples provided
  - CLI help text updated (if applicable)
- [ ] **Developer documentation updated**:
  - API documentation complete
  - Architecture diagrams updated
  - Code comments for complex logic
- [ ] **CHANGELOG.md entry added**: Follow [Keep a Changelog](https://keepachangelog.com/) format
- [ ] **Breaking changes documented**: Clear upgrade path provided
- [ ] **Migration guide created** (if needed): Step-by-step instructions

---

## Quality Assurance

### Security & Performance
- [ ] **Security review complete**:
  - Input validation implemented
  - Authentication/authorization checked
  - Secrets not hardcoded
  - Dependencies scanned for vulnerabilities
- [ ] **Performance impact assessed**:
  - Benchmarks run for critical paths
  - Memory usage profiled
  - No regressions introduced
  - CI timing thresholds respected

### Platform & Compatibility
- [ ] **Cross-platform tested**:
  - ✅ Linux (Ubuntu latest)
  - ✅ macOS (latest)
  - ✅ Windows (latest)
- [ ] **Node.js versions tested**:
  - ✅ Node 20.x
  - ✅ Node 22.x
- [ ] **Real-world project validation**:
  - Tested with actual user projects
  - Edge cases from production identified and handled

### Robustness
- [ ] **Error handling comprehensive**:
  - All error paths tested
  - User-friendly error messages
  - Graceful degradation implemented
- [ ] **Edge cases covered**:
  - Empty inputs
  - Large datasets
  - Network failures
  - File system permissions

---

## Learning & Metrics

### Knowledge Capture
- [ ] **AgentDB episode stored**: Document what worked and what didn't
  ```bash
  npx agentdb@latest reflexion store \
    "feature-{name}-$(date +%s)" \
    "Feature: {feature name}" \
    {0.0-1.0 reward} \
    {true/false success} \
    "Implementation summary and learnings" \
    '{"approach": "..."}' \
    '{"results": "..."}' \
    {duration_ms} \
    {token_estimate}
  ```

- [ ] **Token consumption tracked**: Update token estimation templates
  - Actual tokens vs estimated
  - Lessons learned for future estimates

- [ ] **Retrospective completed** (if phase-ending):
  - What went well
  - What could be improved
  - Action items for next iteration

- [ ] **Patterns documented for reuse**:
  - Reusable code patterns identified
  - Common pitfalls documented
  - Best practices captured

---

## Release

### Version Management
- [ ] **Version bumped**: Follow [Semantic Versioning](https://semver.org/)
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes
  - Update package.json version

### Artifacts
- [ ] **Git tag created**:
  ```bash
  git tag -a v{X.Y.Z} -m "Release v{X.Y.Z}: {feature summary}"
  git push origin v{X.Y.Z}
  ```

- [ ] **npm package published** (if applicable):
  ```bash
  npm publish --access public
  ```

- [ ] **GitHub release created**:
  - Release notes with highlights
  - Breaking changes prominently displayed
  - Migration guide linked
  - Artifacts attached

- [ ] **Announcement prepared** (if major feature):
  - Blog post draft
  - Social media posts
  - Community notification

---

## Post-Release

### Monitoring
- [ ] **Monitor for issues** (first 48 hours):
  - GitHub issues triaged
  - Error tracking dashboard reviewed
  - Community feedback monitored
  - Performance metrics checked

### Feedback Loop
- [ ] **User feedback collected**:
  - Direct user reports
  - Analytics data reviewed
  - Usage patterns analyzed

- [ ] **Hotfixes applied if needed**:
  - Critical bugs addressed immediately
  - Patch release prepared
  - Communication sent to users

- [ ] **Metrics dashboard reviewed**:
  - Adoption rate
  - Error rate
  - Performance metrics
  - User satisfaction

### Continuous Improvement
- [ ] **Learnings incorporated**:
  - Update estimation models
  - Refine development process
  - Train neural patterns (if applicable)
  - Share knowledge with team

---

## Usage Guidelines

### When to Use This Checklist

**✅ USE for:**
- **New features**: Any functionality that doesn't exist yet
- **Major enhancements**: Significant improvements to existing features
- **Breaking changes**: API changes that affect existing users
- **Architecture changes**: Refactoring that impacts multiple components
- **Public API additions**: New CLI commands, library exports, or endpoints

**❌ SKIP for:**
- **Bug fixes**: Simple fixes without API changes
- **Documentation updates**: Standalone documentation improvements
- **Dependency updates**: Routine dependency bumps
- **Internal refactoring**: Changes that don't affect users
- **Typo fixes**: Minor text corrections

### Integration with Existing Workflow

#### 1. Planning Phase
- Review this checklist during feature planning
- Estimate token budget for each checklist item
- Assign responsibilities for documentation and testing

#### 2. Development Phase
- Reference checklist items during implementation
- Use checklist as acceptance criteria for PR
- Complete learning capture as you work

#### 3. Review Phase
- Attach completed checklist to pull request
- Ensure all items checked before merging
- Use checklist as review guide

#### 4. Release Phase
- Verify all pre-release items complete
- Follow release steps in order
- Schedule post-release monitoring

### Examples of Past Successful Feature Launches

#### ✅ Bolt Detector v5.0.0 (November 2025)
**What went well**:
- Comprehensive testing across 8 framework types
- Confidence tuning reduced false positives from 15% to <5%
- AgentDB episode stored with reward 0.95
- Real-world validation with 20+ sample projects

**Checklist adherence**:
- ✅ 85% test coverage achieved
- ✅ Cross-platform tested (Linux, macOS, Windows)
- ✅ Documentation updated with detection algorithm details
- ✅ Breaking changes documented in CHANGELOG
- ✅ Learnings stored in AgentDB

#### ✅ Version Checker Utilities (January 2025)
**What went well**:
- TDD approach with tests written first
- Coverage threshold met (62.06%)
- Comprehensive documentation added
- Reusable patterns identified

**Checklist adherence**:
- ✅ 23 tests written before implementation
- ✅ Performance benchmarks established
- ✅ API documentation complete
- ✅ Token consumption tracked

### Common Pitfalls to Avoid

#### 🚫 Skipping Test Coverage
**Problem**: New code without tests drops overall coverage below thresholds
**Example**: Version utilities added 631 lines without tests, failed CI
**Solution**: Write tests FIRST using TDD methodology
**Prevention**: Set up pre-commit hooks to check coverage locally

#### 🚫 Hardcoded Platform-Specific Code
**Problem**: Code works on developer's machine but fails in CI or on other platforms
**Example**: Unix paths like `/Users/test/project` fail on Windows
**Solution**: Use `path.resolve()` and `path.join()` for all file paths
**Prevention**: Test on all supported platforms before PR

#### 🚫 Inadequate Documentation
**Problem**: Users don't know how to use new features
**Example**: New CLI flags without help text or README updates
**Solution**: Update all documentation before marking feature complete
**Prevention**: Make documentation a blocking PR requirement

#### 🚫 Missing Migration Guide
**Problem**: Breaking changes without upgrade path frustrate users
**Example**: API endpoint renamed without backward compatibility
**Solution**: Provide step-by-step migration instructions
**Prevention**: Flag all breaking changes early in planning

#### 🚫 No Performance Testing
**Problem**: Feature works but degrades system performance
**Example**: N+1 query problems in production
**Solution**: Run benchmarks and load tests before release
**Prevention**: Set performance budgets and monitor in CI

#### 🚫 Forgetting Cross-Platform Compatibility
**Problem**: CI fails on Windows or macOS after Linux-only development
**Example**: SIGPIPE errors on Unix systems with pipe operations
**Solution**: Use platform-agnostic APIs and test matrix in CI
**Prevention**: Enable GitHub Actions matrix testing early

---

## Integration with AgentDB

### Storing Feature Launch Episodes

After feature completion, store learnings in AgentDB:

```bash
# Store successful feature launch
npx agentdb@latest reflexion store \
  "feature-launch-{name}-$(date +%s)" \
  "Feature Launch: {feature name}" \
  0.85 \
  true \
  "Feature launched successfully. Key learnings: {summary}" \
  '{"token_estimate": 15000, "actual_tokens": 16500, "coverage": "85%"}' \
  '{"adoption_rate": "high", "issue_count": 2, "user_feedback": "positive"}' \
  3600000 \
  16500

# Store failed feature launch (for learning)
npx agentdb@latest reflexion store \
  "feature-launch-{name}-failed-$(date +%s)" \
  "Feature Launch: {feature name} (failed)" \
  0.3 \
  false \
  "Feature failed in production. Root cause: {analysis}" \
  '{"missed_tests": "edge case X", "coverage_gap": "module Y"}' \
  '{"rollback_time": 45, "user_impact": "medium"}' \
  7200000 \
  18000
```

### Querying Past Feature Launches

Before starting a new feature, query similar past launches:

```bash
# Find similar feature patterns
npx agentdb@latest reflexion retrieve "feature launch {similar area}" \
  --k 10 \
  --synthesize-context

# Generate launch strategy report
npx agentdb@latest reflexion synthesize \
  --filter "feature-launch-*" \
  --max-episodes 20 \
  --format markdown > docs/FEATURE_LAUNCH_LEARNINGS.md
```

---

## Checklist Maintenance

This checklist should evolve based on team learnings:

- **Monthly Review**: Update based on recent feature launches
- **Feedback Integration**: Add items based on production issues
- **Simplification**: Remove items that don't add value
- **Team Consensus**: Changes require team approval

**Version**: 1.0.0
**Last Updated**: January 2025
**Maintainer**: Technical Writing Agent
