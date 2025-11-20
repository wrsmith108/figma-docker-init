# Token Estimation Template

**Version**: 1.0.0
**Last Updated**: November 20, 2025

---

## Purpose

This template provides a standardized methodology for estimating development effort using **token consumption** instead of time-based estimates (days/weeks).

**Why Token-Based Estimates?**
- ✅ More accurate for AI-assisted development
- ✅ Directly correlates to computational cost
- ✅ Consistent across different human work speeds
- ✅ Measurable and trackable via Claude Flow telemetry
- ✅ Better for distributed/async development

---

## Token Estimation Guidelines

### Task Complexity Tiers

| Complexity | Token Range | Description | Examples |
|-----------|-------------|-------------|----------|
| **Trivial** | 2K-5K | Simple edits, small fixes | Fix typo, update constant, add comment |
| **Small** | 5K-15K | Single file changes, basic features | Add validator, create utility function, write test |
| **Medium** | 15K-50K | Multi-file changes, moderate features | Implement detector class, create template, refactor module |
| **Large** | 50K-150K | Complex features, architectural changes | Add framework support, database integration, new CLI command |
| **Epic** | 150K-500K | Major features, system redesign | Multi-service architecture, new platform support, migration |
| **Mega** | 500K+ | Complete rewrites, multi-phase initiatives | Full system migration, new product, major version upgrade |

### Phase Estimation

Instead of "weeks", use **token phases**:

| Phase Type | Token Budget | Equivalent Effort | Use For |
|-----------|-------------|-------------------|---------|
| **Quick Win** | 10K-25K | 1-2 focused sessions | Bug fixes, documentation, small features |
| **Standard Phase** | 25K-100K | Feature implementation | New detector, template, integration |
| **Major Phase** | 100K-300K | Complex feature development | Multi-framework support, infrastructure |
| **Strategic Phase** | 300K-1M | Multi-feature initiatives | Platform expansion, major refactor |

---

## Estimation Formula

### Base Estimation

```
Base Tokens = (
  Code Complexity × 10K +
  Test Coverage × 5K +
  Documentation × 3K +
  Integration Points × 8K
)
```

**Where:**
- **Code Complexity**: Lines of meaningful code / 10 (e.g., 500 LOC = 50 complexity)
- **Test Coverage**: Number of test cases needed
- **Documentation**: Number of docs (README, guides, API docs)
- **Integration Points**: Number of external systems/APIs integrated

### Adjustment Factors

```
Adjusted Tokens = Base Tokens × (
  Familiarity Factor ×
  Risk Factor ×
  Quality Factor
)
```

| Factor | Multiplier | When to Apply |
|--------|-----------|---------------|
| **High Familiarity** | 0.7-0.8 | Team has done this before |
| **Medium Familiarity** | 1.0 | Standard work |
| **Low Familiarity** | 1.3-1.5 | New technology/pattern |
| **Low Risk** | 0.9 | Well-understood requirements |
| **Medium Risk** | 1.0-1.1 | Some unknowns |
| **High Risk** | 1.3-1.8 | Significant uncertainty |
| **Standard Quality** | 1.0 | Normal development |
| **High Quality** | 1.2-1.4 | Production-critical, security-sensitive |
| **MVP Quality** | 0.7-0.8 | Prototype, proof-of-concept |

---

## AgentDB Integration

### Query Past Patterns BEFORE Estimation

```bash
# Query similar tasks from AgentDB
./scripts/agentdb-retrieve-tracked.sh "task description" 5

# Review token consumption from past episodes
npx agentdb@latest reflexion retrieve "similar feature" --k 10

# Check consolidated skills for reusable patterns
npx agentdb@latest skill consolidate 3 0.7 14 true
```

**Adjust estimates based on**:
- Past token consumption for similar tasks
- Success rate of similar patterns
- Complexity trends from historical data

### Store Learnings AFTER Completion

```bash
# Store episode with actual token consumption
npx agentdb@latest reflexion store \
  "task-id-$(date +%s)" \
  "Task: [description]" \
  [reward] \
  [success] \
  "Critique: [learnings]" \
  '{"tokens_consumed": X, "complexity": "medium"}' \
  '{"approach": "pattern used", "optimizations": "what worked"}' \
  [duration_ms] \
  [tokens_consumed]

# Update token tracking metrics
./claude-flow analysis token-usage --breakdown
```

---

## Estimation Worksheet

### Phase: [Phase Name]

**Objective**: [What needs to be accomplished]

**Scope**:
- [ ] Component 1
- [ ] Component 2
- [ ] Component 3

**Base Token Calculation**:
```
Code Complexity:    [X] × 10K = [Y]K tokens
Test Coverage:      [X] × 5K  = [Y]K tokens
Documentation:      [X] × 3K  = [Y]K tokens
Integration Points: [X] × 8K  = [Y]K tokens
──────────────────────────────────────
Base Total:         [SUM]K tokens
```

**Adjustment Factors**:
```
Familiarity:  [0.7-1.5] (reason: [X])
Risk:         [0.9-1.8] (reason: [X])
Quality:      [0.7-1.4] (reason: [X])
──────────────────────────────────────
Multiplier:   [PRODUCT]
```

**Final Estimate**:
```
Base Total × Multiplier = [FINAL]K tokens
Range: [FINAL × 0.8]K - [FINAL × 1.2]K tokens
```

**AgentDB Query Results**:
- Similar task tokens: [X]K (Episode #[Y])
- Success rate: [X]%
- Recommended adjustments: [X]

**Confidence Level**: [Low/Medium/High]
- Low: ±40% variance
- Medium: ±20% variance
- High: ±10% variance

---

## Tracking Actuals

### During Development

```bash
# Enable telemetry
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# Monitor session
./claude-flow analysis claude-monitor

# Check current consumption
./claude-flow analysis claude-cost
```

### Post-Completion Analysis

```bash
# Get actual token usage
./claude-flow analysis token-usage --breakdown --cost-analysis

# Compare to estimate
Estimated: [X]K tokens
Actual:    [Y]K tokens
Variance:  [Z]%

# Store learning
npx agentdb@latest reflexion store \
  "phase-retrospective-$(date +%s)" \
  "Phase: [name] - Estimate vs Actual" \
  0.95 \
  true \
  "Estimated [X]K, consumed [Y]K, variance [Z]%. Learnings: [insights]" \
  '{"estimated_tokens": X, "actual_tokens": Y, "variance": Z}' \
  '{"accuracy": "high/medium/low", "surprises": "[what was unexpected]"}' \
  [duration_ms] \
  [actual_tokens]
```

---

## Example: Replit DB Migration Feature

### Estimation

**Objective**: Implement Replit DB → Redis/PostgreSQL migration tool

**Scope**:
- [x] Create `src/lib/replit-db-migrator.js` module
- [x] Redis migration strategy
- [x] PostgreSQL JSONB migration strategy
- [x] Docker Compose integration
- [x] Migration script templates
- [x] Unit tests (15 tests)
- [x] Integration tests (5 tests)
- [x] User documentation

**Base Calculation**:
```
Code Complexity:    80 LOC / 10 = 8 × 10K = 80K
Test Coverage:      20 tests × 5K = 100K
Documentation:      3 docs × 3K = 9K
Integration Points: 2 (Redis, PostgreSQL) × 8K = 16K
──────────────────────────────────────
Base Total:         205K tokens
```

**Adjustments**:
```
Familiarity:  1.2 (new: Replit DB, Redis patterns)
Risk:         1.1 (medium: database migration complexity)
Quality:      1.3 (high: data integrity critical)
──────────────────────────────────────
Multiplier:   1.72
```

**Final Estimate**:
```
205K × 1.72 = 353K tokens
Range: 282K - 424K tokens
```

**AgentDB Query**:
```bash
./scripts/agentdb-retrieve-tracked.sh "database migration docker" 5
# Retrieved: Episode #15 (Docker template architecture, 0.98 reward)
# Consumed: 187K tokens for similar complexity
# Adjustment: Reduce estimate by 10% (proven patterns available)
```

**Revised Final**: 318K tokens (range: 254K - 382K)

**Confidence**: Medium (±20%)

---

## Best Practices

### 1. Always Query AgentDB First
```bash
# Before any estimation
./scripts/agentdb-retrieve-tracked.sh "[task description]" 5
```

### 2. Track Intermediate Checkpoints
Don't wait until completion to track tokens:
```bash
# After each major milestone
./claude-flow analysis claude-cost
# Store intermediate learnings
```

### 3. Update Estimates Mid-Stream
If actual consumption deviates >30% from estimate:
- Pause and reassess
- Query AgentDB for alternative approaches
- Adjust remaining work estimates

### 4. Document Variance Causes
When actual differs from estimate, store detailed critique:
```
Causes of variance:
- Unexpected complexity in [X]
- Missing dependency on [Y]
- More efficient pattern found for [Z]
```

### 5. Consolidate Learnings
After 5+ similar tasks:
```bash
npx agentdb@latest skill consolidate 3 0.7 14 true
# Creates reusable patterns for future estimates
```

---

## Retrospective Analysis

After completing a phase, run:

```bash
# 1. Compare estimate vs actual
./claude-flow analysis token-usage --breakdown

# 2. Analyze variance
Estimated: [X]K
Actual:    [Y]K
Variance:  [(Y-X)/X × 100]%

# 3. Identify causes
- Underestimated: [component]
- Overestimated: [component]
- Unexpected: [surprise]

# 4. Store retrospective
npx agentdb@latest reflexion store \
  "retro-$(date +%s)" \
  "Phase Retrospective: [phase name]" \
  0.90 \
  true \
  "[detailed analysis of variance and learnings]" \
  '{"est": X, "actual": Y, "var": Z}' \
  '{"improvements": "[how to estimate better next time]"}' \
  [duration] \
  [tokens]

# 5. Update estimation factors for next phase
Document adjustments in .claude-flow/docs/LEARNINGS.md
```

---

## Token Budget Management

### Phase-Level Budgets

**Phase 1: Foundation** (Quick Win)
- Budget: 25K tokens
- Buffer: ±20% (20K - 30K)

**Phase 2: Implementation** (Standard Phase)
- Budget: 75K tokens
- Buffer: ±20% (60K - 90K)

**Phase 3: Integration** (Major Phase)
- Budget: 200K tokens
- Buffer: ±25% (150K - 250K)

### Project-Level Budget

**Total Project**: 300K tokens
- Foundation: 25K (8%)
- Implementation: 75K (25%)
- Integration: 200K (67%)

**Reserve**: 20% (60K tokens) for unknowns

---

## Continuous Improvement

### Weekly Reviews
```bash
# Run weekly retrieval report
npm run agentdb:report

# Analyze estimation accuracy
Phases completed: [X]
Avg variance: [Y]%
Accuracy trend: [improving/stable/declining]
```

### Monthly Calibration
```bash
# Query all completed phases
npx agentdb@latest reflexion synthesize \
  --filter "phase-retrospective-*" \
  --max-episodes 20

# Recalibrate estimation factors
- Update familiarity multipliers
- Adjust complexity coefficients
- Refine risk assessments
```

---

## Version History

- **1.0.0** (2025-11-20): Initial template with AgentDB integration

---

**Related Documents**:
- `.claude-flow/docs/RETROSPECTIVE_TEMPLATE.md` - Post-phase analysis
- `.claude-flow/docs/AGENTDB_RETRIEVAL_TRACKING.md` - Retrieval integration
- `node_modules/claude-flow/docs/guides/token-tracking-guide.md` - Telemetry setup
