#!/bin/bash
#
# Pre-Task Hook
# Executes before agent starts work
#

set -e

TASK_DESCRIPTION="${1:-Unknown task}"
AGENT_NAME="${2:-Unknown agent}"

echo "🔄 Pre-Task Hook: ${AGENT_NAME}"
echo "📋 Task: ${TASK_DESCRIPTION}"

# Register with hooks system
npx claude-flow@alpha hooks pre-task --description "${TASK_DESCRIPTION}"

# Store agent task assignment
npx claude-flow@alpha memory store "swarm/${AGENT_NAME}/current-task" "${TASK_DESCRIPTION}" --namespace coordination

# Restore session if available
SWARM_ID=$(npx claude-flow@alpha memory get "swarm/config" --namespace coordination 2>/dev/null | grep -o '"id":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$SWARM_ID" ]; then
  echo "🔄 Restoring session: ${SWARM_ID}"
  npx claude-flow@alpha hooks session-restore --session-id "${SWARM_ID}" || true
fi

echo "✅ Pre-task preparation complete"
