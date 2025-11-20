#!/bin/bash
#
# Example: Pre-Commit Hook with AgentDB Retrieval
#
# Install: cp examples/pre-commit-hook.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
#
# This hook queries AgentDB for patterns related to changed files
# before allowing commit, providing context from past work.
#

set -e

AGENTDB_RETRIEVE="./scripts/agentdb-retrieve-tracked.sh"

echo "🔍 Querying AgentDB for patterns related to changed files..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
  echo "⚠️  No files staged for commit"
  exit 0
fi

# Track retrievals performed
RETRIEVAL_COUNT=0

# Query for each file type
for file in $STAGED_FILES; do
  FILE_EXT="${file##*.}"
  FILE_NAME=$(basename "$file")

  # Construct context-aware query
  if [[ "$file" == *"test"* ]]; then
    QUERY="test ${FILE_EXT} ${FILE_NAME}"
  elif [[ "$file" == *"src"* ]]; then
    QUERY="implement ${FILE_EXT} ${FILE_NAME}"
  elif [[ "$file" == *"docs"* ]]; then
    QUERY="document ${FILE_EXT}"
  else
    QUERY="edit ${FILE_EXT}"
  fi

  # Query AgentDB (only show if patterns found)
  echo "  Checking: $file ($QUERY)"

  if PATTERNS=$("$AGENTDB_RETRIEVE" "$QUERY" 3 --only-successes 2>/dev/null); then
    if echo "$PATTERNS" | grep -q "Episode"; then
      echo "    ✅ Found relevant patterns"
      ((RETRIEVAL_COUNT++))

      # Optionally show patterns (comment out for quieter hook)
      # echo "$PATTERNS" | grep -A 2 "Task:"
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Retrieval Summary:"
echo "  Files analyzed: $(echo "$STAGED_FILES" | wc -l | tr -d ' ')"
echo "  Patterns found: $RETRIEVAL_COUNT"

if [ "$RETRIEVAL_COUNT" -gt 0 ]; then
  echo "  💡 Review relevant episodes above before committing"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Always allow commit (change to 'exit 1' to block if no patterns found)
exit 0
