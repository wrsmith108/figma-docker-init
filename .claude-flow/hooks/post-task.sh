#!/bin/bash
#
# Post-Task Hook
# Executes after agent completes work
#

set -e

TASK_ID="${1:-task-unknown}"
AGENT_NAME="${2:-Unknown agent}"
STATUS="${3:-completed}"

echo "✅ Post-Task Hook: ${AGENT_NAME}"
echo "📋 Task ID: ${TASK_ID}"
echo "📊 Status: ${STATUS}"

# Register completion with hooks system
npx claude-flow@alpha hooks post-task --task-id "${TASK_ID}"

# Update task status in memory
npx claude-flow@alpha memory store "swarm/${AGENT_NAME}/last-status" "${STATUS}" --namespace coordination

# Generate session summary and metrics
npx claude-flow@alpha hooks session-end --generate-summary true --export-metrics true || true

echo "✅ Post-task cleanup complete"
