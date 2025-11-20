#!/bin/bash
#
# Tracked AgentDB Retrieval Wrapper
#
# Automatically logs all retrieval operations to memory_access_log
# for tracking knowledge utilization.
#
# Usage:
#   ./scripts/agentdb-retrieve-tracked.sh "query" [k] [--only-successes]
#
# Examples:
#   ./scripts/agentdb-retrieve-tracked.sh "CI coverage failure" 5
#   ./scripts/agentdb-retrieve-tracked.sh "Angular upgrade" 10 --only-successes
#

set -e

QUERY="$1"
K="${2:-5}"
EXTRA_FLAGS="${@:3}"

if [ -z "$QUERY" ]; then
  echo "Usage: $0 <query> [k] [--only-successes|--only-failures]"
  exit 1
fi

TIMESTAMP=$(date +%s)
DB_PATH="./agentdb.db"

echo "🔍 Retrieving: \"$QUERY\" (k=$K)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run retrieval with synthesis
RESULT=$(npx agentdb@latest reflexion retrieve "$QUERY" \
  --k "$K" \
  $EXTRA_FLAGS \
  --synthesize-context 2>&1)

EXIT_CODE=$?

# Log to memory_access_log regardless of success (if table exists)
if [ -f "$DB_PATH" ]; then
  sqlite3 "$DB_PATH" <<EOF 2>/dev/null || true
INSERT INTO memory_access_log
  (memory_type, memory_id, query, relevance_score, was_useful, accessed_at)
VALUES
  ('episode', 0, '${QUERY//\'/\'\'}', 0.0, NULL, $TIMESTAMP);
EOF
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Retrieved successfully"
  echo ""
  echo "$RESULT"

  # Count episodes in result (rough estimate)
  EPISODE_COUNT=$(echo "$RESULT" | grep -c "Episode #" || echo "0")
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Retrieved $EPISODE_COUNT episode(s)"

  # Update retrieval statistics (if database exists)
  if [ -f "$DB_PATH" ]; then
    TOTAL_RETRIEVALS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM memory_access_log;" 2>/dev/null || echo "0")
    TOTAL_EPISODES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM episodes;" 2>/dev/null || echo "1")

    if [ "$TOTAL_EPISODES" != "0" ]; then
      RATIO=$(echo "scale=2; $TOTAL_RETRIEVALS / $TOTAL_EPISODES" | bc -l 2>/dev/null || echo "0.00")

      echo "📈 Retrieval Health: $TOTAL_RETRIEVALS retrievals / $TOTAL_EPISODES episodes = ${RATIO}"
      echo "   Target: 5.0+ (excellent knowledge utilization)"

      if (( $(echo "$RATIO < 1.0" | bc -l 2>/dev/null || echo "1") )); then
        echo "   ⚠️  LOW: Increase retrieval frequency"
      elif (( $(echo "$RATIO < 3.0" | bc -l 2>/dev/null || echo "1") )); then
        echo "   ⚡ MODERATE: Good progress"
      else
        echo "   ✅ EXCELLENT: High knowledge utilization"
      fi
    fi
  fi
else
  echo "⚠️  Retrieval encountered errors (logged anyway)"
  echo "$RESULT"
fi

exit $EXIT_CODE
