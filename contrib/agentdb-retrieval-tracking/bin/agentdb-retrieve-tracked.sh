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

# Log to memory_access_log regardless of success
sqlite3 "$DB_PATH" <<EOF
INSERT INTO memory_access_log
  (memory_type, memory_id, query, relevance_score, was_useful, accessed_at)
VALUES
  ('episode', 0, '${QUERY//\'/\'\'}', 0.0, NULL, $TIMESTAMP);
EOF

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Retrieved successfully"
  echo ""
  echo "$RESULT"

  # Count episodes in result (rough estimate)
  EPISODE_COUNT=$(echo "$RESULT" | grep -c "Episode #" || echo "0")
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📊 Retrieved $EPISODE_COUNT episode(s)"

  # Update retrieval statistics
  TOTAL_RETRIEVALS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM memory_access_log;")
  TOTAL_EPISODES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM episodes;")
  RATIO=$(echo "scale=2; $TOTAL_RETRIEVALS / $TOTAL_EPISODES" | bc)

  echo "📈 Retrieval Health: $TOTAL_RETRIEVALS retrievals / $TOTAL_EPISODES episodes = ${RATIO}"
  echo "   Target: 5.0+ (excellent knowledge utilization)"

  if (( $(echo "$RATIO < 1.0" | bc -l) )); then
    echo "   ⚠️  LOW: Increase retrieval frequency"
  elif (( $(echo "$RATIO < 3.0" | bc -l) )); then
    echo "   ⚡ MODERATE: Good progress"
  else
    echo "   ✅ EXCELLENT: High knowledge utilization"
  fi
else
  echo "⚠️  Retrieval encountered errors (logged anyway)"
  echo "$RESULT"
fi

exit $EXIT_CODE
