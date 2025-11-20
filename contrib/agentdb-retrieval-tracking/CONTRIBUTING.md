# Contributing to AgentDB Retrieval Tracking

Thank you for your interest in contributing to AgentDB retrieval tracking! This guide will help you contribute improvements back to AgentDB core.

---

## Upstream Contribution Strategy

This package is designed to be contributed to [AgentDB](https://github.com/ruvnet/agentdb) as a core feature. Here's how:

### Potential Integration Points

1. **Built-in Tracking** (`agentdb reflexion retrieve --track`)
   - Automatically log all retrievals to `memory_access_log`
   - No wrapper script needed
   - Native CLI support

2. **Analytics Command** (`agentdb analytics`)
   - Built-in retrieval health reports
   - Query diversity analysis
   - Orphaned episode detection

3. **Web UI Dashboard**
   - Visual retrieval metrics
   - Real-time health monitoring
   - Skill consolidation recommendations

---

## Code Contribution Guidelines

### 1. File Organization

```
agentdb/
├── src/
│   ├── cli/
│   │   ├── commands/
│   │   │   ├── reflexion.ts
│   │   │   └── analytics.ts (NEW)
│   │   └── utils/
│   │       └── tracking.ts (NEW)
│   └── db/
│       └── schema.ts (modify memory_access_log)
└── contrib/
    └── retrieval-tracking/
        ├── README.md
        ├── bin/
        └── docs/
```

### 2. Code Style

Follow AgentDB's existing TypeScript conventions:

```typescript
// src/cli/utils/tracking.ts
import { Database } from '../../db';

export interface RetrievalLog {
  memoryType: 'episode' | 'skill' | 'causal_edge';
  memoryId: number;
  query: string;
  relevanceScore?: number;
  wasUseful?: boolean;
  feedback?: Record<string, unknown>;
}

export async function logRetrieval(
  db: Database,
  log: RetrievalLog
): Promise<void> {
  await db.run(`
    INSERT INTO memory_access_log
      (memory_type, memory_id, query, relevance_score, was_useful, feedback, accessed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    log.memoryType,
    log.memoryId,
    log.query,
    log.relevanceScore || null,
    log.wasUseful || null,
    log.feedback ? JSON.stringify(log.feedback) : null,
    Math.floor(Date.now() / 1000)
  ]);
}
```

### 3. Modify Existing Commands

Update `src/cli/commands/reflexion.ts`:

```typescript
// Add --track flag
.option('--track', 'Log retrieval to memory_access_log')

// In retrieve command
if (options.track) {
  await logRetrieval(db, {
    memoryType: 'episode',
    memoryId: 0, // Extract from results
    query: task,
    relevanceScore: avgSimilarity
  });
}
```

### 4. Add New Analytics Command

Create `src/cli/commands/analytics.ts`:

```typescript
import { Command } from 'commander';
import { getDatabase } from '../../db';
import { generateRetrievalReport } from '../utils/analytics';

export const analyticsCommand = new Command('analytics')
  .description('Analyze retrieval patterns and knowledge utilization')
  .option('-d, --days <number>', 'Analysis window in days', '7')
  .option('-f, --format <type>', 'Output format (text|json|html)', 'text')
  .action(async (options) => {
    const db = await getDatabase();
    const report = await generateRetrievalReport(db, options);
    console.log(report);
  });
```

---

## Testing Requirements

### Unit Tests

```typescript
// tests/unit/tracking.test.ts
import { logRetrieval } from '../src/cli/utils/tracking';

describe('Retrieval Tracking', () => {
  it('should log retrieval to memory_access_log', async () => {
    const db = await getTestDatabase();

    await logRetrieval(db, {
      memoryType: 'episode',
      memoryId: 1,
      query: 'test query'
    });

    const logs = await db.all('SELECT * FROM memory_access_log');
    expect(logs).toHaveLength(1);
    expect(logs[0].query).toBe('test query');
  });
});
```

### Integration Tests

```typescript
// tests/integration/reflexion.test.ts
it('should track retrieval when --track flag is used', async () => {
  await exec('agentdb reflexion retrieve "test" --track --k 5');

  const logs = await queryDatabase('SELECT COUNT(*) FROM memory_access_log');
  expect(logs[0].count).toBeGreaterThan(0);
});
```

### Analytics Tests

```typescript
// tests/integration/analytics.test.ts
it('should generate retrieval health report', async () => {
  const output = await exec('agentdb analytics --days 7 --format json');
  const report = JSON.parse(output);

  expect(report).toHaveProperty('retrievalRatio');
  expect(report).toHaveProperty('orphanedEpisodes');
});
```

---

## PR Submission Process

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR-USERNAME/agentdb.git
cd agentdb
npm install
```

### 2. Create Feature Branch

```bash
git checkout -b feature/retrieval-tracking
```

### 3. Implement Changes

- Add tracking logic to `reflexion retrieve`
- Create `analytics` command
- Add comprehensive tests
- Update documentation

### 4. Run Tests

```bash
npm test
npm run lint
npm run typecheck
```

### 5. Update Documentation

- `README.md` - Add analytics command
- `docs/COMMANDS.md` - Document `--track` flag
- `docs/ANALYTICS.md` - Retrieval analytics guide

### 6. Commit with Conventional Commits

```bash
git commit -m "feat(reflexion): add automatic retrieval tracking

- Add --track flag to reflexion retrieve command
- Create agentdb analytics command for health reports
- Implement memory_access_log population
- Add retrieval health metrics calculation

BREAKING CHANGE: Requires database migration to ensure memory_access_log exists

Closes #XXX"
```

### 7. Push and Create PR

```bash
git push origin feature/retrieval-tracking
```

**PR Title**: `feat(reflexion): Add automatic retrieval tracking and analytics`

**PR Description Template**:
```markdown
## Summary
Adds automatic retrieval tracking to solve the problem of storing knowledge but never retrieving it.

## Motivation
AgentDB users often discover they have 25+ episodes stored but 0 retrievals logged, wasting 60-90 min/week re-solving known problems.

## Changes
- ✅ Add `--track` flag to `reflexion retrieve`
- ✅ Create `agentdb analytics` command
- ✅ Implement retrieval health metrics
- ✅ Add orphaned episode detection
- ✅ Comprehensive test coverage

## Breaking Changes
None (backward compatible)

## Testing
- Unit tests: 15 new tests
- Integration tests: 8 new tests
- Manual testing: Validated on vibe-to-docker project (25 episodes, 0→1 retrievals)

## Documentation
- Updated README.md
- Added docs/ANALYTICS.md
- Inline code documentation

## Related Issues
Closes #XXX
```

---

## Database Migration

If schema changes are needed:

```sql
-- migrations/006_retrieval_tracking.sql

-- memory_access_log already exists in AgentDB v1.6.0+
-- No migration needed, but verify columns

CREATE TABLE IF NOT EXISTS memory_access_log (
  id INTEGER PRIMARY KEY,
  memory_type TEXT NOT NULL CHECK(memory_type IN ('episode', 'skill', 'causal_edge')),
  memory_id INTEGER NOT NULL,
  query TEXT,
  relevance_score REAL CHECK(relevance_score >= 0 AND relevance_score <= 1),
  was_useful BOOLEAN,
  feedback JSON,
  accessed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_access_log_accessed_at
  ON memory_access_log(accessed_at);

CREATE INDEX IF NOT EXISTS idx_memory_access_log_query
  ON memory_access_log(query);
```

---

## Backward Compatibility

Ensure changes are backward compatible:

```typescript
// ✅ GOOD: Optional tracking
agentdb reflexion retrieve "query" --k 5          // Works as before
agentdb reflexion retrieve "query" --k 5 --track  // New feature

// ✅ GOOD: New command doesn't affect existing
agentdb analytics  // New, no conflict

// ❌ BAD: Breaking change
// Don't change existing behavior without --track flag
```

---

## Documentation Updates

### README.md

Add to "Commands" section:

```markdown
### Retrieval Tracking

Track knowledge utilization:

```bash
# Retrieve with automatic logging
agentdb reflexion retrieve "authentication" --k 10 --track

# View retrieval analytics
agentdb analytics --days 7

# Check retrieval health
agentdb analytics --format json | jq '.retrievalRatio'
```

### docs/ANALYTICS.md

Create comprehensive guide:

```markdown
# AgentDB Analytics

## Retrieval Health Metrics

- **Retrieval Ratio**: `total_retrievals / total_episodes`
  - < 1.0 = Critical (knowledge unused)
  - 1.0-3.0 = Moderate
  - > 5.0 = Excellent

## Orphaned Episodes

Episodes with high reward (>0.7) that have never been retrieved.

## Query Patterns

Most common queries and temporal analysis.
```

---

## Code Review Checklist

Before submitting PR:

- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Conventional commit format
- [ ] Backward compatible
- [ ] No breaking changes (or clearly documented)
- [ ] Performance impact measured
- [ ] Security considerations reviewed

---

## Performance Considerations

### Tracking Overhead

```typescript
// Minimize overhead
const startTime = performance.now();

// Retrieval logic
const episodes = await retrieveEpisodes(query);

// Async logging (non-blocking)
setImmediate(() => {
  logRetrieval(db, {
    memoryType: 'episode',
    memoryId: episodes[0]?.id || 0,
    query,
    relevanceScore: episodes[0]?.similarity
  });
});

const duration = performance.now() - startTime;
// Tracking should add < 5ms
```

### Database Indexing

```sql
-- Ensure fast queries
CREATE INDEX idx_memory_access_log_accessed_at ON memory_access_log(accessed_at);
CREATE INDEX idx_memory_access_log_memory_id ON memory_access_log(memory_id);
```

---

## Security Considerations

- **Query Sanitization**: Sanitize queries before storing
- **PII Protection**: Don't log sensitive data in queries
- **Access Control**: Ensure `memory_access_log` has proper permissions

```typescript
// Sanitize queries
function sanitizeQuery(query: string): string {
  // Remove potential PII patterns
  return query
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    .replace(/\b\d{16}\b/g, '[CARD]');
}
```

---

## Questions?

- **AgentDB Issues**: https://github.com/ruvnet/agentdb/issues
- **Discussions**: https://github.com/ruvnet/agentdb/discussions
- **Discord**: (if available)

---

**Maintainer**: AgentDB Core Team
**Last Updated**: November 20, 2025
