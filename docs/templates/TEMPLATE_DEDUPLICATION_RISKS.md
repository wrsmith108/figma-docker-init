# Template Deduplication Risk Analysis

## Overview

This document analyzes potential failure modes in the template deduplication system, particularly focusing on the preservation of template syntax (`{{...}}`).

## Current Implementation

```javascript
// In mergeFragments() - line-by-line deduplication
const lines = merged.split('\n');
const seen = new Set();
const uniqueLines = lines.filter(line => {
  const trimmed = line.trim();

  // Keep empty lines and comments
  if (!trimmed || trimmed.startsWith('#')) {
    return true;
  }

  // NEVER deduplicate template syntax (variables, conditionals)
  if (trimmed.includes('{{') && trimmed.includes('}}')) {
    return true;
  }

  if (seen.has(trimmed)) {
    return false;
  }
  seen.add(trimmed);
  return true;
});
```

## Risk Assessment

### 🚨 CRITICAL: Multi-line Conditional Blocks

**Status**: NOT CURRENTLY USED, but supported by `substituteVariables()`

**Problem**: Content inside `{{#if}}...{{/if}}` blocks can be deduplicated

**Example**:
```dockerfile
# Fragment 1
{{#if BUILD}}
RUN npm run build
RUN npm test
{{/if}}

# Fragment 2
RUN npm run build
RUN npm run lint
```

**What happens**:
1. Lines split: `['{{#if BUILD}}', 'RUN npm run build', 'RUN npm test', '{{/if}}', '', 'RUN npm run build', 'RUN npm run lint']`
2. Deduplication:
   - `{{#if BUILD}}` - preserved (has template syntax) ✓
   - `RUN npm run build` - **DEDUPLICATED** (appears twice) ❌
   - `RUN npm test` - kept ✓
   - `{{/if}}` - preserved (has template syntax) ✓
   - `RUN npm run lint` - kept ✓
3. **Result**: Conditional block is broken!

**Impact**: If users add conditional blocks to templates, content may be incorrectly removed

**Mitigation Options**:
1. Track state while processing (inside conditional = preserve all)
2. Disable deduplication when conditionals are detected
3. Process conditionals BEFORE deduplication
4. Document limitation clearly

**Recommended Fix**: Add state tracking for conditional blocks:
```javascript
let insideConditional = false;
const uniqueLines = lines.filter(line => {
  const trimmed = line.trim();

  // Track conditional state
  if (trimmed.match(/\{\{#if\s+/)) insideConditional = true;
  if (trimmed.match(/\{\{\/if\}\}/)) {
    const keep = insideConditional;
    insideConditional = false;
    return keep;
  }

  // Preserve everything inside conditionals
  if (insideConditional) return true;

  // ... rest of logic
});
```

### ⚠️ MEDIUM: Partial Template Syntax

**Problem**: Malformed templates without closing `}}` would be deduplicated

**Example**:
```dockerfile
RUN echo "{{INCOMPLETE
RUN echo "{{INCOMPLETE
```

**Impact**: Duplicate malformed syntax would be deduplicated, potentially hiding errors

**Likelihood**: Low (templates are validated elsewhere)

### ⚠️ LOW: Template Syntax in Comments

**Problem**: Comments containing template syntax are preserved, potentially creating duplicates

**Example**:
```dockerfile
# Port: {{PORT}}
# Port: {{PORT}}
```

**Impact**: Duplicate comments preserved unnecessarily

**Likelihood**: Low impact (comments are small, duplication acceptable)

### ⚠️ LOW: Whitespace Variations

**Problem**: Template syntax with different whitespace is treated as different lines

**Example**:
```dockerfile
ENV VAR={{VALUE}}     # Line 1
ENV VAR={{ VALUE }}   # Line 2 - different after trim
```

**Impact**: Both lines preserved even though they're functionally identical

**Likelihood**: Low (style should be consistent)

### ✅ SAFE: Order of Operations

**Current Flow**:
1. Load fragments
2. Merge fragments (deduplication happens here)
3. Substitute variables

**Why safe**: Template syntax remains in text during deduplication, so we can detect and preserve it.

**Why this matters**: If substitution happened BEFORE deduplication, we couldn't detect template lines.

### ✅ SAFE: JSON and Other Syntaxes

**Not affected**:
- JSON: `{"key": "value"}` (single braces)
- Bash: `[[ condition ]]` (different syntax)
- Heredocs: `<<EOF` (no double braces)

## Real-World Template Usage

Based on current codebase analysis:

**Current Usage** (safe):
```dockerfile
LABEL maintainer="{{PROJECT_NAME}} Team"
COPY /app/{{BUILD_OUTPUT_DIR}} /usr/share/nginx/html
ARG PROJECT_ROOT={{PROJECT_ROOT}}
# Output directory: {{BUILD_OUTPUT_DIR}}
```

**Not Currently Used** (would break):
- Multi-line conditionals
- Nested conditionals
- Conditional blocks with duplicate content

## Recommendations

### Immediate Actions

1. **Document the limitation** in code comments and README
2. **Add warning** if conditional syntax is detected during deduplication
3. **Add integration test** for multi-line conditionals (currently missing)

### Future Improvements

1. **Implement state-aware deduplication** for conditional blocks
2. **Add template validation** before composition
3. **Consider AST-based approach** instead of line-by-line processing

### For Users

**Safe to use**:
- Simple variables: `{{PORT}}`, `{{PROJECT_NAME}}`
- Variables with defaults: `{{PORT:-3000}}`
- Variables in any context (ENV, COPY, LABEL, comments)

**Avoid for now**:
- Multi-line `{{#if}}...{{/if}}` blocks with duplicate content
- Conditionals containing commonly duplicated commands

## Testing Coverage

**Current tests** ✅:
- Simple template variable preservation
- Deduplication of non-template content
- Comments and empty lines preservation

**Missing tests** ❌:
- Multi-line conditional blocks
- Partial template syntax
- Whitespace variations in templates
- Edge cases with malformed syntax

## Conclusion

The current implementation is **safe for all existing template usage** in the codebase. However, there's a **critical bug waiting to happen** if users add multi-line conditional blocks.

**Priority**: Medium (not affecting current users, but blocks future enhancement)

**Effort to fix**: Low (state tracking is ~10 lines of code)

**Recommended**: Fix before 4.0.0 or document limitation clearly
