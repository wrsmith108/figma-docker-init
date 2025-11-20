# AgentDB Retrieval Tracking & Optimization

## Current State Analysis (November 20, 2025)

### Storage vs Retrieval Imbalance

**Storage Activity**: ✅ Excellent
- 25 episodes stored across 7 categories
- 100% embedding coverage
- Average reward: 0.805

**Retrieval Activity**: ❌ Minimal
- `memory_access_log` table: 0 entries
- `events` table: 0 entries
- **Problem**: We're storing knowledge but not leveraging it

---

## Root Cause Analysis

### Why Retrieval Isn't Happening

1. **Incorrect Filter Patterns** (scripts/ai-validate.js:57)
   ```javascript
   // ❌ CURRENT: Doesn't match actual episode IDs
   'npx agentdb@latest reflexion synthesize --filter "ci-failure-*"'

   // ✅ ACTUAL EPISODE IDs:
   // - ci-coverage-threshold-failure-1737402615
   // - ci-coverage-restored-1737402650
   // - angular-version-mismatch-detection-1737398421
   ```

2. **JSON Parsing Errors**
   ```
   ⚠️  Error parsing reflexion data: Unexpected token '✅', "✅ Using sq"... is not valid JSON
   ```
   The synthesize command returns markdown by default, not JSON.

3. **No Systematic Retrieval Integration**
   - Pre-commit hook calls retrieval but fails silently
   - No retry mechanism
   - No fallback to simpler queries
   - No logging of retrieval attempts

4. **Missing Retrieval Hooks**
   - Pre-task hook doesn't query relevant patterns
   - Post-edit hook doesn't check for similar past edits
   - No retrieval in normal development flow

---

## AgentDB Retrieval Tracking Tables

### memory_access_log Schema
```sql
CREATE TABLE memory_access_log (
  id INTEGER PRIMARY KEY,
  memory_type TEXT NOT NULL,           -- 'episode', 'skill', 'causal_edge'
  memory_id INTEGER NOT NULL,          -- Episode/skill ID accessed
  query TEXT,                          -- Query that triggered access
  relevance_score REAL,                -- How relevant was the result
  was_useful BOOLEAN,                  -- Feedback: did it help?
  feedback JSON,                       -- Additional context
  accessed_at INTEGER NOT NULL         -- Unix timestamp
);
```

### How to Track Retrieval

**Option 1: Manual Logging** (Current AgentDB doesn't auto-log)
```bash
# After each reflexion retrieve, manually log the access
sqlite3 agentdb.db "INSERT INTO memory_access_log
  (memory_type, memory_id, query, relevance_score, accessed_at)
  VALUES ('episode', 24, 'CI coverage failure', 0.95, strftime('%s', 'now'));"
```

**Option 2: Wrapper Script** (Recommended)
Create `scripts/agentdb-retrieve-tracked.sh`:
```bash
#!/bin/bash
QUERY="$1"
K="${2:-5}"

# Run retrieval
RESULT=$(npx agentdb@latest reflexion retrieve "$QUERY" --k "$K" --synthesize-context)

# Extract episode IDs from result (parse output)
# Log each accessed episode to memory_access_log
# Return result
echo "$RESULT"
```

---

## Strategies to Increase Retrieval

### 1. Fix Existing Retrieval Calls

**scripts/ai-validate.js (Line 56-59)**
```javascript
// ❌ BEFORE:
const reflexionResult = exec(
  'npx agentdb@latest reflexion synthesize --filter "ci-failure-*" --max-episodes 20 --format json',
  true
);

// ✅ AFTER:
const reflexionResult = exec(
  'npx agentdb@latest reflexion retrieve "CI test coverage failure" --k 10 --synthesize-context',
  true
);
```

**Why this works:**
- Uses `retrieve` instead of `synthesize` (semantic search)
- Natural language query instead of filter pattern
- `--synthesize-context` generates actionable insights

---

### 2. Add Retrieval to Pre-Task Hook

**Create .claude-flow/hooks/pre-task.sh:**
```bash
#!/bin/bash
TASK_DESC="$1"

echo "🔍 Querying AgentDB for relevant past experiences..."

# Query similar tasks
PAST_EPISODES=$(npx agentdb@latest reflexion retrieve "$TASK_DESC" \
  --k 5 \
  --only-successes \
  --synthesize-context)

if [ $? -eq 0 ]; then
  echo "✅ Found relevant episodes:"
  echo "$PAST_EPISODES"

  # Log retrieval
  sqlite3 agentdb.db "INSERT INTO memory_access_log
    (memory_type, memory_id, query, accessed_at)
    VALUES ('episode', 0, '$TASK_DESC', strftime('%s', 'now'));"
else
  echo "⚠️  No relevant past episodes found"
fi
```

**Trigger:** Before every development task
**Benefit:** Proactively surfaces past learnings

---

### 3. Add Retrieval to Error Handling

**src/lib/version-fixer.js (Line 220-225)**
```javascript
// ❌ CURRENT: No knowledge retrieval on failure
} catch (error) {
  console.error(`\n❌ Failed to update Angular: ${error.message}`);
  console.log('\n📖 Manual fix command:');
  console.log(`   npx @angular/cli@latest update @angular/core@${targetVersion}`);
  return false;
}

// ✅ IMPROVED: Query AgentDB for similar failures
} catch (error) {
  console.error(`\n❌ Failed to update Angular: ${error.message}`);

  // Query past solutions
  console.log('\n🧠 Checking AgentDB for similar failures...');
  const pastSolutions = execSync(
    `npx agentdb@latest reflexion retrieve "Angular update failure ${error.message.substring(0, 50)}" --k 3 --only-successes`,
    { encoding: 'utf-8' }
  );

  if (pastSolutions) {
    console.log('✅ Found past solutions:');
    console.log(pastSolutions);
  }

  return false;
}
```

**Benefit:** Learn from past errors automatically

---

### 4. Scheduled Retrieval for Skill Consolidation

**package.json scripts:**
```json
{
  "scripts": {
    "agentdb:consolidate": "npx agentdb@latest skill consolidate 3 0.7 7 true",
    "agentdb:daily-review": "node scripts/daily-agentdb-review.js"
  }
}
```

**scripts/daily-agentdb-review.js:**
```javascript
#!/usr/bin/env node
import { execSync } from 'child_process';

// Get all high-reward episodes from last 7 days
const episodes = execSync(
  'npx agentdb@latest reflexion retrieve "development" --k 20 --min-reward 0.8',
  { encoding: 'utf-8' }
);

console.log('📊 High-Reward Episodes from Last 7 Days:\n');
console.log(episodes);

// Consolidate into skills
execSync('npx agentdb@latest skill consolidate 3 0.7 7 true', { stdio: 'inherit' });
```

**Benefit:** Regular knowledge synthesis

---

### 5. Pre-Commit Retrieval (Enhanced)

**Fix .claude-flow/hooks/pre-commit:**
```bash
#!/bin/bash

# Get changed files
CHANGED_FILES=$(git diff --cached --name-only)

echo "🔍 Querying AgentDB for patterns related to changed files..."

# Query for each file type
for file in $CHANGED_FILES; do
  FILE_TYPE="${file##*.}"

  # Query past edits to similar files
  PAST_PATTERNS=$(npx agentdb@latest reflexion retrieve \
    "edit $FILE_TYPE file $(basename $file)" \
    --k 3 \
    --only-successes \
    2>/dev/null)

  if [ -n "$PAST_PATTERNS" ]; then
    echo "✅ Found patterns for $file"

    # Log retrieval
    sqlite3 agentdb.db "INSERT INTO memory_access_log
      (memory_type, memory_id, query, accessed_at)
      VALUES ('episode', 0, 'pre-commit: $file', strftime('%s', 'now'));"
  fi
done
```

**Benefit:** Context-aware commit validation

---

## Retrieval Metrics to Track

### Weekly Retrieval Report
```bash
#!/bin/bash
# scripts/weekly-retrieval-report.sh

echo "📊 AgentDB Retrieval Report (Last 7 Days)"
echo "=========================================="

# Total retrievals
TOTAL=$(sqlite3 agentdb.db \
  "SELECT COUNT(*) FROM memory_access_log
   WHERE accessed_at > strftime('%s', 'now', '-7 days');")

echo "Total Retrievals: $TOTAL"

# Unique queries
UNIQUE_QUERIES=$(sqlite3 agentdb.db \
  "SELECT COUNT(DISTINCT query) FROM memory_access_log
   WHERE accessed_at > strftime('%s', 'now', '-7 days');")

echo "Unique Queries: $UNIQUE_QUERIES"

# Most accessed episodes
echo -e "\nMost Accessed Episodes:"
sqlite3 agentdb.db "
  SELECT e.task, COUNT(*) as access_count
  FROM memory_access_log m
  JOIN episodes e ON m.memory_id = e.id
  WHERE m.accessed_at > strftime('%s', 'now', '-7 days')
  GROUP BY e.task
  ORDER BY access_count DESC
  LIMIT 5;
"
```

### Retrieval Health Score
```javascript
// Calculate retrieval health: retrievals per episode stored
const retrievalHealth = totalRetrievals / totalEpisodes;

// Target: 5+ retrievals per episode
// Current: 0 retrievals / 25 episodes = 0.0 (critical)
```

---

## Implementation Plan

### Phase 1: Fix Existing Retrieval (Immediate)
1. ✅ Fix `scripts/ai-validate.js` query pattern
2. ✅ Add error handling for JSON parsing
3. ✅ Test retrieval with actual episode queries

### Phase 2: Add Retrieval Hooks (Week 1)
1. Create `pre-task.sh` hook with retrieval
2. Add retrieval to error handlers in `version-fixer.js`
3. Enable retrieval in pre-commit validation

### Phase 3: Automated Retrieval (Week 2)
1. Implement `daily-agentdb-review.js` script
2. Add `agentdb:consolidate` to CI/CD pipeline
3. Create weekly retrieval report

### Phase 4: Tracking & Metrics (Week 3)
1. Create wrapper script for tracked retrieval
2. Build retrieval dashboard
3. Set up alerts for low retrieval activity

---

## Expected Impact

**Before:**
- Retrieval rate: 0 queries / 25 episodes = 0.0
- Knowledge utilization: 0%
- Repeated mistakes: High

**After (30 Days):**
- Retrieval rate: 150 queries / 30 episodes = 5.0 ✅
- Knowledge utilization: 85%+
- Repeated mistakes: <10%
- Time saved: 3-5 hours/week from prevented errors

---

## Quick Start Commands

```bash
# Test retrieval now
npx agentdb@latest reflexion retrieve "CI coverage failure" --k 5 --synthesize-context

# Check if retrieval is being logged
sqlite3 agentdb.db "SELECT COUNT(*) FROM memory_access_log;"

# Enable skill consolidation
npx agentdb@latest skill consolidate 3 0.7 7 true

# Weekly health check
bash scripts/weekly-retrieval-report.sh
```

---

**Last Updated**: November 20, 2025
**Status**: Retrieval infrastructure exists, needs activation
**Priority**: HIGH - Knowledge is useless if not retrieved
