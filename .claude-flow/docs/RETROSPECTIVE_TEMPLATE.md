# Retrospective Template

**Version**: 1.0.0
**Last Updated**: November 20, 2025

---

## Purpose

This template standardizes post-phase retrospectives with **token consumption analysis** and **AgentDB learning integration**.

---

## Phase Retrospective

### Phase: [Phase Name]

**Completed**: [Date]
**Duration**: [X] hours (wallclock time)
**Token Budget**: [X]K tokens
**Tokens Consumed**: [Y]K tokens
**Variance**: [(Y-X)/X × 100]%

---

## 1. Objectives Review

### Original Objectives
- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

### Achievements
- ✅ [What was completed]
- ✅ [What exceeded expectations]
- ⏳ [What is partial/pending]
- ❌ [What was not completed]

### Scope Changes
- **Added**: [Features/tasks added mid-stream]
- **Removed**: [Features/tasks descoped]
- **Deferred**: [Tasks moved to next phase]

---

## 2. Token Consumption Analysis

### Breakdown by Activity

| Activity | Estimated | Actual | Variance | % of Total |
|----------|-----------|--------|----------|-----------|
| Planning & Design | [X]K | [Y]K | [Z]% | [W]% |
| Implementation | [X]K | [Y]K | [Z]% | [W]% |
| Testing | [X]K | [Y]K | [Z]% | [W]% |
| Documentation | [X]K | [Y]K | [Z]% | [W]% |
| Debugging | [X]K | [Y]K | [Z]% | [W]% |
| Refactoring | [X]K | [Y]K | [Z]% | [W]% |
| **TOTAL** | **[X]K** | **[Y]K** | **[Z]%** | **100%** |

### Variance Analysis

**Underestimated** (consumed > estimated):
- **Component**: [Name]
  - Estimated: [X]K
  - Actual: [Y]K
  - Reason: [Why it took more tokens]
  - Learning: [How to estimate better next time]

**Overestimated** (consumed < estimated):
- **Component**: [Name]
  - Estimated: [X]K
  - Actual: [Y]K
  - Reason: [Why it took fewer tokens]
  - Learning: [Reusable pattern identified]

**Unexpected Work** (not in original estimate):
- **Task**: [Description]
  - Tokens: [X]K
  - Reason: [Why it wasn't anticipated]
  - Learning: [How to catch this earlier]

---

## 3. Quality Metrics

### Code Quality
- **Test Coverage**: [X]% (target: [Y]%)
- **Tests Added**: [X] (unit: [Y], integration: [Z])
- **Code Duplication**: [X]% (target: <10%)
- **Complexity**: [X] cyclomatic (target: <15)

### Documentation
- **User Docs**: [X] files, [Y] words
- **Developer Docs**: [X] files, [Y] words
- **API Docs**: [X]% coverage
- **Examples**: [X] working examples

### Technical Debt
- **Created**: [X] TODOs, [Y] FIXMEs
- **Resolved**: [X] TODOs, [Y] FIXMEs
- **Net Change**: [+/-X]

---

## 4. AgentDB Learnings

### Episodes Stored

```bash
# Episodes created this phase
npx agentdb@latest reflexion synthesize \
  --filter "phase-[name]-*" \
  --max-episodes 20
```

**Summary**:
- **Episodes Stored**: [X]
- **Average Reward**: [Y]
- **Success Rate**: [Z]%
- **Skills Consolidated**: [W]

### Retrieval Effectiveness

```bash
# Retrieval stats for this phase
./scripts/agentdb-retrieve-tracked.sh "phase summary" 1
```

**Retrieval Metrics**:
- **Queries Made**: [X]
- **Relevant Episodes Found**: [Y]
- **Retrieval Ratio**: [Z] (target: 5.0+)
- **Time Saved**: [W] minutes (estimated)

### Patterns Discovered

**Successful Patterns** (reward ≥ 0.9):
1. **Pattern**: [Name]
   - **Episode**: #[X]
   - **Approach**: [What worked]
   - **Tokens**: [Y]K consumed
   - **Reusability**: [High/Medium/Low]

**Failed Patterns** (reward < 0.5):
1. **Pattern**: [Name]
   - **Episode**: #[X]
   - **Approach**: [What didn't work]
   - **Tokens**: [Y]K wasted
   - **Lessons**: [What to avoid]

**Causal Edges Learned**:
```bash
npx agentdb@latest query-causal \
  --confidence-threshold 0.7
```

- Action: [X] → Outcome: [Y] (confidence: [Z]%)
- Action: [X] → Outcome: [Y] (confidence: [Z]%)

---

## 5. Performance Analysis

### Speed
- **Fastest Component**: [Name] ([X]K tokens)
  - Why: [Reason for efficiency]
- **Slowest Component**: [Name] ([Y]K tokens)
  - Why: [Reason for inefficiency]
  - Improvement: [How to optimize]

### Efficiency
- **Token Efficiency**: [Actual / Estimated] = [X]
  - >1.0 = Overran estimate
  - <1.0 = Beat estimate
- **Reuse Rate**: [X]% code reused from past episodes
- **Rework Rate**: [X]% tokens spent on rework/debugging

### Blockers
1. **Blocker**: [Description]
   - **Impact**: [X]K tokens, [Y] hours
   - **Resolution**: [How it was resolved]
   - **Prevention**: [How to avoid next time]

---

## 6. Team & Process

### What Went Well ✅
1. [Process/tool/practice that worked]
2. [Process/tool/practice that worked]
3. [Process/tool/practice that worked]

### What Needs Improvement ⚠️
1. [Process/tool/practice to improve]
   - **Action**: [Specific improvement to make]
2. [Process/tool/practice to improve]
   - **Action**: [Specific improvement to make]

### Surprises 🎉 / 😱
- **Pleasant Surprise**: [Unexpected win]
- **Unpleasant Surprise**: [Unexpected challenge]

---

## 7. Next Phase Planning

### Adjustments for Next Phase

**Estimation Factors**:
- **Familiarity**: [0.7-1.5] → [New value] (reason: [X])
- **Risk**: [0.9-1.8] → [New value] (reason: [X])
- **Quality**: [0.7-1.4] → [New value] (reason: [X])

**Process Changes**:
- [ ] Change 1: [Description]
- [ ] Change 2: [Description]
- [ ] Change 3: [Description]

**AgentDB Integration Improvements**:
- [ ] Increase retrieval frequency (current: [X] queries/phase, target: [Y])
- [ ] Improve query specificity (better pattern matching)
- [ ] Consolidate [X] skills for reuse

### Carryover Work
- [ ] Task 1: [X]K tokens estimated
- [ ] Task 2: [X]K tokens estimated
- [ ] Task 3: [X]K tokens estimated

---

## 8. Recommendations

### For This Project
1. **Immediate**: [Action to take now]
2. **Short-term**: [Action for next sprint]
3. **Long-term**: [Strategic change]

### For Organization
1. **Estimation**: [Insight for future estimates]
2. **Tooling**: [Tool/process recommendation]
3. **Training**: [Skill gap to address]

---

## 9. Store Retrospective in AgentDB

```bash
# Store this retrospective as an episode
npx agentdb@latest reflexion store \
  "phase-[name]-retro-$(date +%s)" \
  "Phase Retrospective: [phase name]" \
  [reward-score] \
  [success-true/false] \
  "Estimated [X]K tokens, consumed [Y]K ([Z]% variance). Key learnings: [summary of learnings]. Successful patterns: [patterns]. Failed patterns: [patterns]. Recommendations: [recommendations]." \
  '{"phase": "[name]", "estimated_tokens": X, "actual_tokens": Y, "variance_pct": Z, "test_coverage": W, "episodes_stored": V}' \
  '{"successful_patterns": ["pattern1", "pattern2"], "failed_patterns": ["pattern3"], "process_improvements": ["improvement1", "improvement2"], "estimation_accuracy": "high/medium/low"}' \
  [duration_ms] \
  [actual_tokens]
```

**Reward Score Guidelines**:
- **0.9-1.0**: Excellent - beat estimate, high quality, all objectives met
- **0.7-0.9**: Good - met estimate, good quality, most objectives met
- **0.5-0.7**: Fair - overran estimate, acceptable quality, some objectives met
- **0.0-0.5**: Poor - significantly overran, quality issues, objectives missed

---

## 10. Action Items

### For Next Phase
- [ ] Action 1: [Description] (Owner: [Name], Due: [Date])
- [ ] Action 2: [Description] (Owner: [Name], Due: [Date])
- [ ] Action 3: [Description] (Owner: [Name], Due: [Date])

### For Project
- [ ] Update `.claude-flow/docs/LEARNINGS.md` with patterns
- [ ] Update estimation factors in TOKEN_ESTIMATION_TEMPLATE.md
- [ ] Run skill consolidation: `npx agentdb@latest skill consolidate 3 0.7 14 true`
- [ ] Share retrospective with stakeholders

---

## Appendix: Token Consumption Details

### Detailed Breakdown

```bash
# Get comprehensive token analysis
./claude-flow analysis token-usage --breakdown --cost-analysis
```

**Output Summary**:
```
Total Tokens: [X]K
  Input:  [Y]K ([Z]%)
  Output: [W]K ([V]%)

Cost: $[X.XX]
  Sonnet 4.5: [X]K tokens = $[Y]
  [Other models if used]

By Agent:
  - coder: [X]K tokens ([Y]%)
  - tester: [X]K tokens ([Y]%)
  - reviewer: [X]K tokens ([Y]%)
```

### Cost Efficiency

- **Cost per LOC**: $[X] / [Y] LOC = $[Z] per line
- **Cost per Test**: $[X] / [Y] tests = $[Z] per test
- **Cost per Feature**: $[X] / [Y] features = $[Z] per feature

---

**Version History**:
- **1.0.0** (2025-11-20): Initial template with token analysis

**Related Documents**:
- `.claude-flow/docs/TOKEN_ESTIMATION_TEMPLATE.md` - Estimation methodology
- `.claude-flow/docs/AGENTDB_RETRIEVAL_TRACKING.md` - Learning integration
- `node_modules/claude-flow/docs/guides/token-tracking-guide.md` - Telemetry setup
