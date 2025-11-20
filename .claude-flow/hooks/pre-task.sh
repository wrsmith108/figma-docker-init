#!/bin/bash
#
# Pre-Task Hook
# Executes before agent starts work with tracked retrieval
#

set -e

TASK_DESCRIPTION="${1:-Unknown task}"
AGENT_NAME="${2:-Unknown agent}"

echo "🔄 Pre-Task Hook: ${AGENT_NAME}"
echo "📋 Task: ${TASK_DESCRIPTION}"

# Query relevant knowledge using tracked retrieval
echo ""
echo "🧠 Querying relevant knowledge from AgentDB..."
if [ -f "./scripts/agentdb-retrieve-tracked.sh" ]; then
  # Extract key terms from task description for query
  QUERY_TERMS=$(echo "$TASK_DESCRIPTION" | head -c 100)
  ./scripts/agentdb-retrieve-tracked.sh "$QUERY_TERMS" 5 --only-successes 2>&1 | head -n 20 || true
fi

# Register with hooks system (skip if binary issue)
npx claude-flow@alpha hooks pre-task --description "${TASK_DESCRIPTION}" 2>/dev/null || {
  echo "⚠️  Hooks system unavailable (binary rebuild needed)"
  echo "   Continuing with manual coordination..."
}

# Store agent task assignment (skip if memory unavailable)
npx claude-flow@alpha memory store "swarm/${AGENT_NAME}/current-task" "${TASK_DESCRIPTION}" --namespace coordination 2>/dev/null || true

# Restore session if available
SWARM_ID=$(npx claude-flow@alpha memory get "swarm/config" --namespace coordination 2>/dev/null | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$SWARM_ID" ]; then
  echo "🔄 Restoring session: ${SWARM_ID}"
  npx claude-flow@alpha hooks session-restore --session-id "${SWARM_ID}" 2>/dev/null || true
fi

echo "✅ Pre-task preparation complete"
