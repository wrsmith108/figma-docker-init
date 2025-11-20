# AgentDB Hooks Integration Guide

## Quick Reference

### Pre-Task Hook (Automatic Retrieval)
```bash
# Called before starting work
./.claude-flow/hooks/pre-task.sh "Task description" "agent-name"

# Automatically:
# 1. Queries AgentDB for relevant past episodes
# 2. Shows similarity scores
# 3. Provides context for decision-making
```

### Post-Task Hook (Automatic Learning)
```bash
# Called after completing work
./.claude-flow/hooks/post-task.sh "task-id" "agent-name" "status"

# Status values:
# - "completed" or "success" → reward: 0.95
# - "failed" or "error" → reward: 0.2
# - other → reward: 0.8

# Automatically:
# 1. Stores episode in AgentDB
# 2. Updates statistics
# 3. Generates session summary
```

### Error Handler (Manual or Automatic)
```bash
# Call when errors occur
node scripts/error-handler.js "error-type" "error-message" '{"context":"json"}'

# Example:
node scripts/error-handler.js "test-failure" "Coverage below 62%" '{"file":"src/app.js"}'

# Automatically:
# 1. Stores as low-reward episode (0.2)
# 2. Logs to .claude-flow/logs/errors.jsonl
# 3. Enables pattern detection
```

### Tracked Retrieval (Manual Query)
```bash
# Query AgentDB with tracking
./scripts/agentdb-retrieve-tracked.sh "query" [k] [--only-successes]

# Examples:
./scripts/agentdb-retrieve-tracked.sh "CI coverage failure" 5
./scripts/agentdb-retrieve-tracked.sh "Angular upgrade" 10 --only-successes

# Shows:
# - Retrieved episodes
# - Similarity scores
# - Retrieval health metrics
```

### AI Pre-Deployment Validation
```bash
# Query patterns only
node scripts/ai-validate.js --learn-only

# Full validation (with agent consensus)
node scripts/ai-validate.js

# Verbose output (show agent reasoning)
node scripts/ai-validate.js --verbose

# Strict mode (require 100% approval)
node scripts/ai-validate.js --strict
```

## Integration Pattern

### Typical Workflow
```bash
# 1. Pre-task: Query past knowledge
./.claude-flow/hooks/pre-task.sh "Implement feature X" "coder"

# 2. Work: Do the implementation
# ... your work here ...

# 3. Post-task: Store results
./.claude-flow/hooks/post-task.sh "task-123" "coder" "completed"

# 4. On error: Log for learning
node scripts/error-handler.js "build-error" "TypeScript compilation failed" '{"file":"src/app.ts"}'
```

### Git Workflow Integration
```bash
# Pre-commit hook runs automatically
git add .
git commit -m "feat: add feature X"
# → Triggers AI validation
# → Queries learned patterns
# → Prevents commit if validation fails

# Bypass if needed (not recommended)
git commit --no-verify -m "feat: add feature X"
```

## File Locations

```
scripts/
├── ai-validate.js                    # AI validation with learned patterns
├── agentdb-retrieve-tracked.sh       # Tracked retrieval wrapper
└── error-handler.js                  # Error logging with learning

.claude-flow/hooks/
├── pre-commit                        # Git pre-commit hook
├── pre-push                          # Git pre-push hook
├── pre-task.sh                       # Agent pre-task hook
└── post-task.sh                      # Agent post-task hook

.claude-flow/logs/
└── errors.jsonl                      # Error log backup
```

## AgentDB Episode Structure

### Success Episode (reward: 0.95)
```json
{
  "id": "task-123-1763679000000",
  "trajectory": "Implement user authentication",
  "verdict": 0.95,
  "is_success": true,
  "self_reflection": "Agent coder completed task with status: completed",
  "self_correction": "{\"agent\":\"coder\",\"task_id\":\"task-123\"}",
  "metadata": "{\"status\":\"completed\",\"timestamp\":1763679000000}"
}
```

### Error Episode (reward: 0.2)
```json
{
  "id": "error-test-failure-1763679000000",
  "trajectory": "Error occurred: test-failure\nMessage: Coverage below threshold",
  "verdict": 0.2,
  "is_success": false,
  "self_reflection": "This error should be prevented in future by checking: test-failure",
  "self_correction": "{\"error_type\":\"test-failure\",\"prevention\":\"Add validation...\"}",
  "metadata": "{\"timestamp\":1763679000000,\"type\":\"test-failure\"}"
}
```

## Retrieval Health Metrics

The system tracks **retrieval-to-episode ratio**:

```
Retrieval Health = Total Retrievals / Total Episodes

Ratios:
< 1.0   → ⚠️  LOW: Increase retrieval frequency
1.0-3.0 → ⚡ MODERATE: Good progress
> 5.0   → ✅ EXCELLENT: High knowledge utilization
```

**Goal**: Maintain ratio > 5.0 for excellent knowledge reuse

## Troubleshooting

### Issue: "No learned patterns found"
**Cause**: First run, no episodes stored yet
**Solution**: Normal behavior, patterns will build over time

### Issue: "better-sqlite3 binary mismatch"
**Cause**: Node.js version changed, binary needs rebuild
**Solution**: `npm rebuild better-sqlite3` (requires Xcode CLT)
**Workaround**: Hooks use fallback behavior, core functions still work

### Issue: "Hooks system unavailable"
**Cause**: Claude-Flow binary issue
**Solution**: Hooks continue with manual coordination
**Impact**: Minimal - tracked retrieval and AgentDB still work

### Issue: "AgentDB storage failed"
**Cause**: Database not initialized
**Solution**: Run `npx agentdb@latest init` to create database

## Best Practices

1. **Always run pre-task hook** before starting work
   - Provides context from past successes/failures
   - Reduces redundant problem-solving

2. **Always run post-task hook** after completing work
   - Builds knowledge base over time
   - Enables future pattern matching

3. **Use error handler** for all failures
   - Creates learning opportunities
   - Prevents repeated mistakes

4. **Monitor retrieval health**
   - Check ratio regularly
   - Aim for > 5.0 for optimal knowledge reuse

5. **Review learned patterns** periodically
   ```bash
   ./scripts/agentdb-retrieve-tracked.sh "summary of patterns" 20
   ```

## Advanced Usage

### Custom Episode Storage
```bash
# Store custom episode directly
npx agentdb@latest reflexion store \
  "custom-$(date +%s)" \
  "Task description" \
  0.95 \
  true \
  "Reflection about the task" \
  '{"metadata":"json"}' \
  '{"outcome":"json"}' \
  180000 \
  5000
```

### Query Specific Patterns
```bash
# Only successful episodes
./scripts/agentdb-retrieve-tracked.sh "CI failures" 10 --only-successes

# Only failed episodes
./scripts/agentdb-retrieve-tracked.sh "test errors" 10 --only-failures
```

### Export Patterns
```bash
# Export learned patterns for documentation
npx agentdb@latest reflexion synthesize \
  --filter "ci-failure-*" \
  --max-episodes 20 \
  --format markdown > docs/CI_CD_LEARNINGS.md
```

## Integration with Claude-Flow

The hooks system integrates seamlessly with Claude-Flow commands:

```bash
# Memory storage (if binary works)
npx claude-flow@alpha memory store "key" "value" --namespace "phase1"

# Neural training (future enhancement)
npx claude-flow@alpha neural train \
  --pattern-type optimization \
  --training-data "{episode data}"

# Session management
npx claude-flow@alpha hooks session-end \
  --generate-summary true \
  --export-metrics true
```

## Summary

The AgentDB hooks system provides:

✅ Automatic knowledge retrieval before tasks
✅ Automatic learning after task completion
✅ Error tracking and pattern detection
✅ Pre-deployment AI validation
✅ Retrieval health monitoring
✅ Seamless Git integration

For questions or issues, see:
- Task completion report: `docs/TASK_1.1_COMPLETION_REPORT.md`
- Architecture docs: `.claude-flow/docs/architecture/`
