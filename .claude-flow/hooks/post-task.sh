#!/bin/bash
#
# Post-Task Hook
# Executes after agent completes work
# Stores results and learnings in AgentDB
#

set -e

TASK_ID="${1:-task-unknown}"
AGENT_NAME="${2:-Unknown agent}"
STATUS="${3:-completed}"

echo ""
echo "✅ Post-Task Hook: ${AGENT_NAME}"
echo "🆔 Task ID: ${TASK_ID}"
echo "📊 Status: ${STATUS}"

# Determine reward based on status
REWARD=0.8
if [[ "$STATUS" == "success" ]] || [[ "$STATUS" == "completed" ]]; then
  REWARD=0.95
elif [[ "$STATUS" == "failed" ]] || [[ "$STATUS" == "error" ]]; then
  REWARD=0.2
fi

# Store episode in AgentDB using reflexion store
TIMESTAMP=$(date +%s)
EPISODE_ID="task-${TASK_ID}-${TIMESTAMP}"

echo ""
echo "💾 Storing task results in AgentDB..."

# Get task details from memory if available
TASK_DESCRIPTION=$(npx claude-flow@alpha memory get "swarm/${AGENT_NAME}/current-task" --namespace coordination 2>/dev/null || echo "Task execution")

# Store as reflexion episode
npx agentdb@latest reflexion store \
  "$EPISODE_ID" \
  "$TASK_DESCRIPTION" \
  "$REWARD" \
  true \
  "Agent ${AGENT_NAME} completed task with status: ${STATUS}" \
  "{\"agent\": \"${AGENT_NAME}\", \"task_id\": \"${TASK_ID}\"}" \
  "{\"status\": \"${STATUS}\", \"timestamp\": ${TIMESTAMP}}" \
  180000 \
  5000 2>&1 || {
    echo "⚠️  AgentDB storage failed (may need database setup)"
  }

# Register completion with hooks system (skip if binary issue)
npx claude-flow@alpha hooks post-task --task-id "${TASK_ID}" 2>/dev/null || true

# Update task status in memory (skip if unavailable)
npx claude-flow@alpha memory store "swarm/${AGENT_NAME}/last-status" "${STATUS}" --namespace coordination 2>/dev/null || true

# Update memory statistics
npx claude-flow@alpha memory store "stats/tasks-completed" "$(($(npx claude-flow@alpha memory get "stats/tasks-completed" 2>/dev/null || echo "0") + 1))" 2>/dev/null || true

# Generate session summary and metrics
npx claude-flow@alpha hooks session-end --generate-summary true --export-metrics true 2>/dev/null || true

echo "✅ Post-task processing complete"
echo ""
