#!/bin/bash
#
# Example: Pre-Task Hook with AgentDB Retrieval
#
# Install: cp examples/pre-task-hook.sh .claude-flow/hooks/pre-task && chmod +x .claude-flow/hooks/pre-task
#
# This hook queries AgentDB before starting any development task,
# providing relevant context from past work.
#
# Usage:
#   .claude-flow/hooks/pre-task "implement authentication"
#   .claude-flow/hooks/pre-task "fix CI coverage failure"
#

set -e

TASK_DESC="$1"
AGENTDB_RETRIEVE="./scripts/agentdb-retrieve-tracked.sh"

if [ -z "$TASK_DESC" ]; then
  echo "Usage: $0 <task-description>"
  echo "Example: $0 \"implement user authentication\""
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Pre-Task AgentDB Context Retrieval"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Task: $TASK_DESC"
echo ""

# Query for successful past approaches
echo "🧠 Querying AgentDB for relevant past experiences..."
echo ""

if SUCCESSES=$("$AGENTDB_RETRIEVE" "$TASK_DESC" 5 --only-successes 2>&1); then
  if echo "$SUCCESSES" | grep -q "Episode"; then
    echo "✅ Found relevant successful approaches:"
    echo "$SUCCESSES"
  else
    echo "⚠️  No successful episodes found for this exact task"
  fi
else
  echo "⚠️  AgentDB query encountered errors (may be first run)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Also query for failures to avoid (optional)
echo "📚 Checking for common pitfalls..."
echo ""

if FAILURES=$("$AGENTDB_RETRIEVE" "$TASK_DESC" 3 --only-failures 2>&1); then
  if echo "$FAILURES" | grep -q "Episode"; then
    echo "⚠️  Found past failures to avoid:"
    echo "$FAILURES"
  else
    echo "✅ No known failures for this task type"
  fi
else
  echo "⚠️  Failure query skipped"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Recommendations based on past episodes:"
echo ""

# Extract key learnings from critique fields (simplified grep)
if echo "$SUCCESSES" | grep -q "Critique:"; then
  echo "$SUCCESSES" | grep -A 1 "Critique:" | sed 's/^/  • /'
fi

echo ""
echo "🎯 You can now start work with context from past experiences!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
