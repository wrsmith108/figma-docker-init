#!/bin/bash
#
# Weekly AgentDB Retrieval Report
#
# Generates comprehensive analytics on knowledge retrieval patterns
# to identify underutilized episodes and optimization opportunities.
#
# Usage:
#   ./scripts/weekly-retrieval-report.sh [days]
#
# Default: Last 7 days
#

DAYS="${1:-7}"
DB_PATH="./agentdb.db"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     AgentDB Retrieval Report (Last $DAYS Days)          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Overall statistics
echo "📊 Overall Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_EPISODES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM episodes;")
echo "Total Episodes Stored: $TOTAL_EPISODES"

TOTAL_RETRIEVALS=$(sqlite3 "$DB_PATH" \
  "SELECT COUNT(*) FROM memory_access_log
   WHERE accessed_at > strftime('%s', 'now', '-$DAYS days');")
echo "Total Retrievals (${DAYS}d): $TOTAL_RETRIEVALS"

if [ "$TOTAL_EPISODES" -gt 0 ]; then
  RATIO=$(echo "scale=2; $TOTAL_RETRIEVALS / $TOTAL_EPISODES" | bc)
  echo "Retrieval/Episode Ratio: ${RATIO}"

  if (( $(echo "$RATIO < 1.0" | bc -l) )); then
    echo "Status: ⚠️  CRITICAL - Knowledge underutilized"
    echo "Action: Enable pre-task and pre-commit retrieval hooks"
  elif (( $(echo "$RATIO < 3.0" | bc -l) )); then
    echo "Status: ⚡ MODERATE - Improvement needed"
    echo "Action: Add retrieval to error handlers"
  else
    echo "Status: ✅ EXCELLENT - High knowledge utilization"
  fi
fi

echo ""

# Unique queries
echo "🔍 Query Diversity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

UNIQUE_QUERIES=$(sqlite3 "$DB_PATH" \
  "SELECT COUNT(DISTINCT query) FROM memory_access_log
   WHERE accessed_at > strftime('%s', 'now', '-$DAYS days');")
echo "Unique Queries: $UNIQUE_QUERIES"

if [ "$TOTAL_RETRIEVALS" -gt 0 ]; then
  DIVERSITY=$(echo "scale=2; $UNIQUE_QUERIES / $TOTAL_RETRIEVALS" | bc)
  echo "Query Diversity: ${DIVERSITY} (1.0 = all unique, 0.0 = all repeated)"
fi

echo ""

# Most common queries
echo "🔥 Top Queries (Last ${DAYS} Days)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sqlite3 "$DB_PATH" <<EOF
SELECT
  query,
  COUNT(*) as count,
  datetime(MAX(accessed_at), 'unixepoch', 'localtime') as last_access
FROM memory_access_log
WHERE accessed_at > strftime('%s', 'now', '-$DAYS days')
GROUP BY query
ORDER BY count DESC
LIMIT 10;
EOF

echo ""

# Temporal pattern
echo "📅 Retrieval Timeline (Last ${DAYS} Days)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

sqlite3 "$DB_PATH" <<EOF
SELECT
  date(accessed_at, 'unixepoch', 'localtime') as date,
  COUNT(*) as retrievals
FROM memory_access_log
WHERE accessed_at > strftime('%s', 'now', '-$DAYS days')
GROUP BY date
ORDER BY date DESC;
EOF

echo ""

# Episode utilization
echo "💎 Episode Utilization (Never Retrieved)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEVER_RETRIEVED=$(sqlite3 "$DB_PATH" <<EOF
SELECT COUNT(*) FROM episodes e
WHERE NOT EXISTS (
  SELECT 1 FROM memory_access_log m
  WHERE m.memory_id = e.id
);
EOF
)

echo "Episodes Never Retrieved: $NEVER_RETRIEVED / $TOTAL_EPISODES"

if [ "$NEVER_RETRIEVED" -gt 0 ]; then
  echo ""
  echo "Orphaned Episodes (High Reward, Never Retrieved):"
  sqlite3 "$DB_PATH" <<EOF
SELECT
  task,
  reward,
  success,
  datetime(created_at, 'unixepoch', 'localtime') as created
FROM episodes e
WHERE NOT EXISTS (
  SELECT 1 FROM memory_access_log m WHERE m.memory_id = e.id
)
AND reward > 0.7
ORDER BY reward DESC
LIMIT 5;
EOF
fi

echo ""

# Skills utilization
echo "🛠️  Skills & Consolidation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL_SKILLS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM skills;")
echo "Skills Consolidated: $TOTAL_SKILLS"

if [ "$TOTAL_SKILLS" -eq 0 ]; then
  echo "⚠️  No skills consolidated yet"
  echo "Run: npx agentdb@latest skill consolidate 3 0.7 7 true"
fi

echo ""

# Recommendations
echo "💡 Recommendations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$TOTAL_RETRIEVALS" -lt "$TOTAL_EPISODES" ]; then
  echo "1. Enable tracked retrieval wrapper in all scripts"
  echo "   Use: ./scripts/agentdb-retrieve-tracked.sh instead of direct npx calls"
fi

if [ "$NEVER_RETRIEVED" -gt 5 ]; then
  echo "2. Review orphaned high-reward episodes for consolidation"
  echo "   Run: npx agentdb@latest skill consolidate 3 0.7 14 true"
fi

if [ "$TOTAL_SKILLS" -eq 0 ]; then
  echo "3. Enable automatic skill consolidation"
  echo "   Add to CI: npm run agentdb:consolidate"
fi

if (( $(echo "$RATIO < 3.0" | bc -l) )); then
  echo "4. Add retrieval to error handlers and pre-task hooks"
  echo "   See: docs/AGENTDB_RETRIEVAL_TRACKING.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Report generated: $(date)"
