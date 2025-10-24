# V2 Architecture Plan: figma-docker-init

**Project**: figma-docker-init
**Version**: 2.0.0
**Date**: October 23, 2025
**Status**: Proposed

---

## Executive Summary

After critical analysis of the v1.0.2 codebase, this plan proposes a **minimal refactoring approach** that fixes actual problems without over-engineering a simple CLI tool. The goal is to maintain the elegant simplicity of the current design while improving testability and eliminating code duplication.

### Key Principle: **Simplicity Over Sophistication**

This is a CLI tool that does one thing well: sets up Docker configs for Figma Make projects. It doesn't need enterprise architecture patterns. It needs to be **easy to read, easy to test, and easy to modify**.

---

## Critical Re-Assessment

### What the Tool Actually Does

1. Parse CLI arguments (`basic`, `ui-heavy`, `--help`, etc.)
2. Detect project configuration from package.json and build configs
3. Validate template files
4. Copy templates with variable replacement
5. Display results to user

**Total Scope**: ~850 lines of code, 24 functions, 2 templates

### Real Problems vs. Perceived Problems

| Issue | Type | Priority | Fix Complexity |
|-------|------|----------|----------------|
| **Config parser duplication** | Real | HIGH | Low (1 helper function) |
| **Missing module exports** | Real | HIGH | Low (add exports) |
| **Inconsistent error handling** | Real | MEDIUM | Medium (standardize) |
| **File is 854 lines** | Perceived | LOW | N/A (not actually a problem) |
| **Long functions** | Perceived | LOW | N/A (linear workflow is clear) |
| **Needs 12-15 modules** | Perceived | NONE | High (would add complexity) |

### Why the Current Design Works

✅ **Linear workflow**: Code flows top-to-bottom like a script
✅ **Clear sections**: Well-organized with comment headers
✅ **Single responsibility**: Does one thing (Docker setup)
✅ **Self-contained**: No external dependencies beyond Node built-ins
✅ **Good documentation**: JSDoc comments on all functions
✅ **Working tests**: Test coverage exists and passes

### Why Splitting into 12-15 Modules Would Be Wrong

❌ **Over-engineering**: Adds complexity without proportional benefit
❌ **Import overhead**: More boilerplate than actual code
❌ **Navigation cost**: Jump between files to understand workflow
❌ **Premature abstraction**: No evidence of needing reusable modules
❌ **Maintenance burden**: More files to keep in sync
❌ **Against YAGNI**: "You Aren't Gonna Need It"

---

## Architecture Decision Records (ADRs)

### ADR-001: Keep Single-File Architecture

**Status**: Accepted

**Context**:
The current codebase is 854 lines in a single file. Some might argue this violates best practices, but we need to examine whether splitting it improves the code for its actual use case.

**Decision**:
Keep the single-file architecture with minor organizational improvements.

**Rationale**:
1. **Linear Execution Model**: CLI tools execute sequentially. Reading the code top-to-bottom matches the execution model.
2. **Low Complexity**: 24 functions averaging 35 lines each. Functions are focused and understandable.
3. **Clear Organization**: Seven well-marked sections with comment headers make navigation easy.
4. **No Reuse Patterns**: Functions are used once in a specific workflow, not shared across modules.
5. **Grepability**: `grep` or IDE search finds any function instantly in one file.
6. **Agent-Friendly**: Modern LLMs can easily process 850 lines. The section headers help parsing.

**Alternatives Considered**:
- **Split into modules**: Rejected. Adds import/export boilerplate, makes workflow harder to follow.
- **Multi-file structure**: Rejected. No clear module boundaries that would improve comprehension.

**Consequences**:
- Positive: Simplicity, easy to understand end-to-end
- Positive: No circular dependency issues
- Positive: Fast to modify (everything in one place)
- Negative: File is "long" by some style guide standards (acceptable trade-off)

**When to Reconsider**:
- File exceeds 1500 lines
- Clear reusable modules emerge (e.g., "validation library" used elsewhere)
- Multiple developers working on different sections simultaneously

---

### ADR-002: Add Explicit Module Exports for Testability

**Status**: Accepted

**Context**:
Current code doesn't export functions. Test file works around this, but it's fragile and prevents proper unit testing.

**Decision**:
Add explicit named exports for all public functions while keeping the file structure intact.

**Rationale**:
1. **Testability**: Enables proper unit testing of individual functions
2. **Backward Compatible**: Doesn't break CLI usage
3. **Documentation**: Exports define the public API
4. **Minimal Change**: Add exports at end of file, no restructuring needed

**Implementation**:
```javascript
// At end of figma-docker-init.js
export {
  // Validation
  sanitizeString,
  validateTemplateName,
  validateProjectDirectory,
  validatePort,
  validateProjectName,
  validateFilePath,

  // Config Parsing
  parseConfig,  // New unified parser
  detectBuildOutputDir,
  detectProjectValues,

  // Template Processing
  validateTemplate,
  checkBuildCompatibility,
  replaceTemplateVariables,

  // Port Management
  checkPortAvailability,
  findAvailablePort,
  assignDynamicPorts,

  // CLI Interface
  showHelp,
  showVersion,
  listTemplates,

  // Main Logic
  copyTemplate
};
```

**Consequences**:
- Positive: Proper unit testing without workarounds
- Positive: Clear public API definition
- Positive: Enables reuse if needed in future
- Negative: None (exports are ignored when run as CLI)

---

### ADR-003: Eliminate Config Parser Duplication with Helper Function

**Status**: Accepted

**Context**:
Three config parsers (`parseViteConfig`, `parseRollupConfig`, `parseWebpackConfig`) contain ~90% identical code. Only the regex patterns differ.

**Decision**:
Create a single `parseConfig()` helper that takes the config name and extraction pattern as parameters.

**Rationale**:
1. **DRY Principle**: Eliminates 60+ lines of duplicated code
2. **Easier to Extend**: Adding support for new build tools is trivial
3. **Consistent Behavior**: Error handling and file checking in one place
4. **Simpler Testing**: Test one function instead of three

**Before** (90 lines total):
```javascript
function parseViteConfig(projectDir) {
  try {
    let configPath = path.join(projectDir, 'vite.config.js');
    if (!fs.existsSync(configPath)) {
      configPath = path.join(projectDir, 'vite.config.ts');
    }
    if (!fs.existsSync(configPath)) {
      return null;
    }
    validateFilePath(configPath, projectDir);
    const content = fs.readFileSync(configPath, 'utf8');
    const match = content.match(/build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  } catch (error) {
    log(`Warning: Could not parse Vite config...`, colors.yellow);
    return null;
  }
}

// ... nearly identical parseRollupConfig() ...
// ... nearly identical parseWebpackConfig() ...
```

**After** (35 lines total):
```javascript
/**
 * Generic config file parser
 * @param {string} projectDir - Project directory
 * @param {string} configName - Config file name (without extension)
 * @param {RegExp} extractPattern - Regex to extract output directory
 * @returns {string|null} Extracted output directory or null
 */
function parseConfig(projectDir, configName, extractPattern) {
  const extensions = ['js', 'ts'];

  for (const ext of extensions) {
    try {
      const configPath = path.join(projectDir, `${configName}.config.${ext}`);

      if (!fs.existsSync(configPath)) continue;

      validateFilePath(configPath, projectDir);
      const content = fs.readFileSync(configPath, 'utf8');
      const match = content.match(extractPattern);

      return match ? match[1] : null;
    } catch (error) {
      log(`Warning: Could not parse ${configName} config. ${error.message}`, colors.yellow);
      return null;
    }
  }

  return null;
}

// Specific parsers become one-liners
const parseViteConfig = (dir) => parseConfig(
  dir,
  'vite',
  /build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/
);

const parseRollupConfig = (dir) => parseConfig(
  dir,
  'rollup',
  /output\s*:\s*{[^}]*dir\s*:\s*['"]([^'"]+)['"]/
);

const parseWebpackConfig = (dir) => parseConfig(
  dir,
  'webpack',
  /output\s*:\s*{[^}]*path\s*:\s*path\.resolve\([^,]+,\s*['"]([^'"]+)['"]/
);
```

**Consequences**:
- Positive: 60 lines removed, easier to maintain
- Positive: Adding Parcel/Snowpack support is 3 lines
- Positive: Single place for error handling
- Negative: None (actually simpler than before)

---

### ADR-004: Standardize Error Handling Strategy

**Status**: Accepted

**Context**:
Current code mixes three error handling approaches:
1. `throw new Error()` in validation functions
2. `process.exit(1)` in main workflow
3. Logged warnings in config parsing

This inconsistency makes testing difficult and creates unpredictable behavior.

**Decision**:
Standardize on a **layered error handling approach**:
- **Library functions** (validation, parsing): Throw errors
- **Workflow functions** (copyTemplate): Catch and handle gracefully
- **Main entry point**: Single error handler with process.exit()

**Rationale**:
1. **Testable**: Can test error paths without mocking process.exit
2. **Predictable**: Same error type always handled the same way
3. **Informative**: Better error messages with context
4. **Recoverable**: Workflow can attempt recovery before failing

**Implementation**:
```javascript
// Custom error classes for clarity
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

// Library functions throw
function validateTemplateName(templateName) {
  const sanitized = sanitizeString(templateName, 50);
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new ValidationError('Template name contains invalid characters');
  }
  return sanitized;
}

// Workflow functions catch and handle
async function copyTemplate(templateName, targetDir = '.') {
  try {
    const validatedName = validateTemplateName(templateName);
    // ... rest of workflow
  } catch (error) {
    if (error instanceof ValidationError) {
      log(`Validation Error: ${error.message}`, colors.red);
      log('Run with --help for usage information', colors.yellow);
      throw error; // Re-throw for main() to handle
    }
    throw error;
  }
}

// Main entry point - single error handler
function main() {
  try {
    // ... argument parsing and dispatch
  } catch (error) {
    if (error instanceof ValidationError || error instanceof ConfigError) {
      // User errors - friendly message, exit 1
      process.exit(1);
    }
    // Unexpected errors - show stack trace, exit 2
    console.error('Unexpected error:', error);
    process.exit(2);
  }
}
```

**Consequences**:
- Positive: Testable error paths
- Positive: Clear error semantics
- Positive: Better user experience
- Negative: Slightly more boilerplate (acceptable for clarity)

---

### ADR-005: Maintain Current File Organization with Enhanced Comments

**Status**: Accepted

**Context**:
The current file uses section comments (`// ===...===`) to organize code. This works well but could be more explicit.

**Decision**:
Keep the current seven-section structure but enhance section comments with descriptions and function lists.

**Rationale**:
1. **Navigation Aid**: Helps developers and agents find code quickly
2. **Documentation**: Section headers serve as table of contents
3. **Zero Runtime Cost**: Comments have no performance impact
4. **IDE Integration**: Most IDEs can jump to comments

**Implementation**:
```javascript
// =============================================================================
// INPUT VALIDATION AND SANITIZATION UTILITIES
// =============================================================================
// Functions: sanitizeString, validateTemplateName, validateProjectDirectory,
//            validatePort, validateProjectName, sanitizeTemplateVariable,
//            validateFilePath
// Purpose: Ensure all user inputs are safe and valid before processing
// =============================================================================

// ... validation functions ...

// =============================================================================
// CONFIGURATION PARSING FUNCTIONS
// =============================================================================
// Functions: parseConfig, parseViteConfig, parseRollupConfig,
//            parseWebpackConfig, detectBuildOutputDir
// Purpose: Extract build configuration from various build tool configs
// =============================================================================

// ... config parsing functions ...
```

**Consequences**:
- Positive: Easier code navigation
- Positive: Self-documenting structure
- Positive: Helps agents understand organization
- Negative: None (purely additive)

---

### ADR-006: No TypeScript Conversion

**Status**: Accepted

**Context**:
The project could be converted to TypeScript for type safety, but we should evaluate if the benefits justify the complexity.

**Decision**:
Remain a JavaScript (ES modules) project with JSDoc for type hints.

**Rationale**:
1. **Tool Scope**: Simple CLI with well-defined inputs/outputs
2. **Type Coverage**: JSDoc provides type hints without build step
3. **Simplicity**: No transpilation, no tsconfig, no type gymnastics
4. **Build Time**: Zero compile time, instant execution
5. **Dependencies**: TypeScript adds dev dependency and complexity
6. **Error Surface**: Static typing unlikely to catch bugs in this linear workflow

**Example**:
```javascript
/**
 * Validates a port number
 * @param {string|number} port - The port number to validate
 * @returns {number} The validated port number
 * @throws {ValidationError} If port is invalid
 */
function validatePort(port) {
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
    throw new ValidationError('Port must be between 1 and 65535');
  }
  return numPort;
}
```

**Consequences**:
- Positive: Zero build complexity
- Positive: Instant startup time
- Positive: Easier for contributors (no TS knowledge needed)
- Negative: No compile-time type checking (acceptable for this scope)

**When to Reconsider**:
- Project grows beyond 2000 lines
- Complex data structures emerge
- Multiple contributors making type errors

---

### ADR-007: Keep Test File Co-Located with Source

**Status**: Accepted

**Context**:
Tests are currently in `test/figma-docker-init.test.js`. Some projects split into `src/` and `test/` directories.

**Decision**:
Keep flat structure: main file at root, tests in `test/` directory.

**Rationale**:
1. **npm Package Structure**: Root-level main file is standard for CLI tools
2. **Simplicity**: No nested directory navigation
3. **Package Size**: Fewer files to publish
4. **Clear Separation**: Tests clearly separated but easy to find

**Structure**:
```
figma-docker-init/
├── figma-docker-init.js          # Main CLI file
├── test/
│   └── figma-docker-init.test.js # All tests
├── templates/                     # Template files
├── package.json
└── ...config files
```

**Consequences**:
- Positive: Simple, flat structure
- Positive: Standard for CLI tools
- Positive: Easy to publish to npm
- Negative: None

---

## V2 Implementation Plan

### Phase 1: Code Quality (Week 1) - PRIORITY: HIGH

#### 1.1 Add Module Exports
- **File**: `figma-docker-init.js`
- **Changes**: Add export block at end of file
- **Testing**: Verify tests use imports instead of workarounds
- **Risk**: LOW - Additive change only

#### 1.2 Eliminate Config Parser Duplication
- **File**: `figma-docker-init.js` (lines 141-236)
- **Changes**:
  - Create `parseConfig()` helper function
  - Replace three parsers with one-liner wrappers
  - Update `detectBuildOutputDir()` to use new parsers
- **Testing**: Ensure all config types still detected correctly
- **Risk**: MEDIUM - Core functionality change, needs thorough testing

#### 1.3 Standardize Error Handling
- **Files**: `figma-docker-init.js`
- **Changes**:
  - Add `ValidationError` and `ConfigError` classes
  - Update functions to throw custom errors
  - Add centralized error handler in `main()`
- **Testing**: Add error path tests
- **Risk**: MEDIUM - Changes error behavior, needs careful testing

#### 1.4 Enhance Section Comments
- **File**: `figma-docker-init.js`
- **Changes**: Expand section headers with function lists and descriptions
- **Testing**: None needed (comments only)
- **Risk**: NONE

**Deliverables**:
- ✅ All functions properly exported
- ✅ Config parser reduced from 90 to 35 lines
- ✅ Consistent error handling throughout
- ✅ Enhanced code documentation

**Success Criteria**:
- All existing tests pass
- Test coverage improves (better error path coverage)
- File reduced to ~790 lines (60 lines removed from deduplication)
- Code runs identically to v1.0.2 from user perspective

---

### Phase 2: Testing & Documentation (Week 2) - PRIORITY: MEDIUM

#### 2.1 Improve Test Coverage
- **File**: `test/figma-docker-init.test.js`
- **Changes**:
  - Add tests for error paths (ValidationError, ConfigError)
  - Add tests for `parseConfig()` helper
  - Add edge case tests (empty configs, malformed files)
  - Add integration test for full workflow
- **Target**: 85%+ coverage (up from current ~50%)

#### 2.2 Update Documentation
- **Files**: `README.md`, new `CONTRIBUTING.md`
- **Changes**:
  - Document export usage for library consumers
  - Add architecture decision rationale
  - Create simple contribution guide
  - Add "Design Principles" section explaining simplicity choice

#### 2.3 Add Input Validation Tests
- **File**: `test/figma-docker-init.test.js`
- **Changes**: Comprehensive tests for all validation functions
- **Coverage**: 100% of validation functions

**Deliverables**:
- ✅ 85%+ test coverage
- ✅ All error paths tested
- ✅ Updated documentation
- ✅ Contribution guidelines

---

### Phase 3: Performance & Polish (Week 3) - PRIORITY: LOW

#### 3.1 Micro-Optimizations
- **File**: `figma-docker-init.js`
- **Changes**:
  - Cache package.json reads (currently read multiple times)
  - Use `Promise.all()` for parallel port checks if beneficial
  - Consider streaming for large template files
- **Benchmark**: Should not regress, ideally 10-20% faster

#### 3.2 Enhanced CLI Output
- **File**: `figma-docker-init.js`
- **Changes**:
  - Add progress indicators for long operations
  - Improve error messages with actionable suggestions
  - Add color coding for different message types

#### 3.3 Optional: Add Debug Mode
- **File**: `figma-docker-init.js`
- **Changes**: Add `--debug` flag for verbose output
- **Use Case**: Helps users troubleshoot issues

**Deliverables**:
- ✅ Performance maintained or improved
- ✅ Better user experience
- ✅ Debug mode for troubleshooting

---

## File Structure Comparison

### ❌ REJECTED: Multi-Module Approach (from Code Review Report)

```
src/
├── index.js
├── cli/
│   ├── commands.js
│   └── interface.js
├── validation/
│   ├── input-validator.js
│   └── template-validator.js
├── config/
│   ├── config-parser.js
│   ├── build-tools.js
│   └── project-detector.js
├── template/
│   ├── template-processor.js
│   └── template-copier.js
├── network/
│   └── port-manager.js
└── utils/
    ├── logger.js
    └── constants.js
```

**Why Rejected**:
- 12 files for 850 lines of code is excessive
- Import/export overhead exceeds actual code
- No clear benefit for a linear CLI workflow
- Harder to understand the flow
- Over-engineering for the scope

### ✅ ACCEPTED: Enhanced Single-File Approach

```
figma-docker-init/
├── figma-docker-init.js       # 790 lines (down from 854)
│   ├── [Section 1] Input Validation (7 functions)
│   ├── [Section 2] Config Parsing (5 functions, deduplicated)
│   ├── [Section 3] Project Detection (1 function)
│   ├── [Section 4] Template Processing (3 functions)
│   ├── [Section 5] Port Management (3 functions)
│   ├── [Section 6] CLI Interface (3 functions)
│   ├── [Section 7] Utilities (1 function)
│   ├── [Section 8] Main Logic (2 functions)
│   └── [Exports] Public API (20 exports)
├── test/
│   └── figma-docker-init.test.js
├── templates/
│   ├── basic/
│   └── ui-heavy/
└── package.json
```

**Why Accepted**:
- Simple, easy to understand
- All code in context
- Easy to modify and extend
- Standard for CLI tools
- Appropriate for scope

---

## Metrics & Goals

### Code Metrics

| Metric | v1.0.2 | v2.0.0 Target | Change |
|--------|--------|---------------|--------|
| **Lines of Code** | 854 | ~790 | -64 (7.5% reduction) |
| **Number of Files** | 1 | 1 | No change |
| **Functions** | 24 | 27 | +3 (error classes, helper) |
| **Code Duplication** | ~90 lines | ~0 lines | -100% |
| **Test Coverage** | ~50% | 85%+ | +35% |
| **Public Exports** | 0 | 20 | +20 |

### Performance Metrics

| Metric | v1.0.2 | v2.0.0 Target |
|--------|--------|---------------|
| **Template Copy Time** | 150ms | ≤150ms (no regression) |
| **Project Detection** | 50ms | ≤50ms (no regression) |
| **Port Assignment** | 30ms | ≤30ms (no regression) |
| **Startup Time** | 80ms | ≤80ms (no regression) |

### Quality Metrics

| Metric | v1.0.2 | v2.0.0 Target |
|--------|--------|---------------|
| **Cyclomatic Complexity** | Medium | Low-Medium |
| **Maintainability Index** | 65 | 75+ |
| **Documentation Coverage** | 80% | 95% |
| **Error Handling Consistency** | 40% | 100% |

---

## Risk Assessment

### Implementation Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Breaking Changes** | Low | High | Comprehensive test suite, semantic versioning |
| **Performance Regression** | Low | Medium | Benchmark before/after each phase |
| **Over-Complexity** | Very Low | High | ADRs keep us honest, reject unnecessary changes |
| **User Confusion** | Very Low | Low | No CLI interface changes |

### Mitigation Strategies

1. **Comprehensive Testing**
   - Full test suite runs after each change
   - Integration tests verify end-to-end workflow
   - Manual testing of all CLI commands

2. **Incremental Rollout**
   - v2.0.0-beta.1: Code quality improvements
   - v2.0.0-beta.2: Testing and documentation
   - v2.0.0-rc.1: Performance and polish
   - v2.0.0: Stable release

3. **Rollback Plan**
   - Git tags for each version
   - npm dist-tags for beta releases
   - Quick rollback to v1.0.2 if critical issues

---

## Success Criteria

### Must Have (v2.0.0 Release Blockers)

- [ ] All v1.0.2 functionality works identically
- [ ] All existing tests pass
- [ ] Test coverage ≥85%
- [ ] Config parser deduplication complete
- [ ] Proper module exports added
- [ ] Error handling standardized
- [ ] No performance regressions
- [ ] Documentation updated

### Should Have (v2.1.0 Features)

- [ ] Debug mode for troubleshooting
- [ ] Enhanced CLI output with progress indicators
- [ ] Performance optimizations (caching, parallelization)
- [ ] Property-based tests for validation functions

### Nice to Have (Future Versions)

- [ ] Snapshot testing for generated configs
- [ ] Interactive mode for template selection
- [ ] Config file (.dockerinitrc) support
- [ ] Plugin system for custom templates

---

## Decision Log

### Decisions Made

1. ✅ **Keep single-file architecture** - Simplicity appropriate for scope
2. ✅ **Add module exports** - Enables proper testing
3. ✅ **Deduplicate config parsers** - Reduces code by 60 lines
4. ✅ **Standardize error handling** - Improves testability
5. ✅ **Enhance section comments** - Better navigation
6. ✅ **Stay with JavaScript** - No TypeScript conversion
7. ✅ **Maintain flat structure** - No src/ directory

### Decisions Rejected

1. ❌ **Split into 12-15 modules** - Over-engineering
2. ❌ **TypeScript conversion** - Unnecessary complexity
3. ❌ **Separate src/ directory** - Not standard for CLI tools
4. ❌ **Class-based architecture** - Functional style is clearer
5. ❌ **Plugin system** - Not needed yet (YAGNI)

---

## Comparison: Code Review Report vs. V2 Architecture Plan

### Code Review Report Recommended

| Recommendation | Status | Rationale |
|----------------|--------|-----------|
| Split into 12-15 modules | REJECTED | Over-engineering for scope |
| Create src/ directory | REJECTED | Unnecessary for CLI tool |
| Multi-phase refactoring (3 weeks) | REJECTED | Too much for simple fixes |
| TypeScript conversion considered | REJECTED | Not needed |
| Complex module dependency graph | REJECTED | YAGNI |

### V2 Architecture Plan Proposes

| Proposal | Status | Rationale |
|----------|--------|-----------|
| Keep single file | ACCEPTED | Appropriate for linear workflow |
| Add exports for testing | ACCEPTED | Enables proper unit tests |
| Deduplicate config parsers | ACCEPTED | Actual problem, easy fix |
| Standardize error handling | ACCEPTED | Improves testability |
| Enhance documentation | ACCEPTED | Low cost, high value |

### Key Differences

**Code Review**: "This needs enterprise architecture patterns"
**V2 Plan**: "This needs targeted improvements to actual problems"

**Code Review**: 48-66 hours of refactoring
**V2 Plan**: 12-16 hours of targeted improvements

**Code Review**: 12-15 files
**V2 Plan**: 1 file, better organized

---

## Conclusion

### Core Philosophy

**"Perfection is achieved not when there is nothing more to add, but when there is nothing more to take away."** - Antoine de Saint-Exupéry

The v2 architecture maintains the elegant simplicity of the original design while fixing actual problems:
- ✅ Adds testability (exports)
- ✅ Removes duplication (config parser)
- ✅ Improves consistency (error handling)
- ✅ Enhances clarity (section comments)

It rejects unnecessary complexity:
- ❌ No module explosion
- ❌ No build steps
- ❌ No framework patterns
- ❌ No premature abstraction

### For Future Maintainers

When considering changes to this codebase, ask:
1. **Does it solve a real problem?** Not a perceived one.
2. **Is it the simplest solution?** Not the most sophisticated.
3. **Will it make the code easier to understand?** Not just "cleaner" by some metric.
4. **Does it fit the scope?** This is a CLI tool, not a framework.

### Approval Criteria

This plan should be approved if:
- ✅ ADRs are well-reasoned and clearly explain trade-offs
- ✅ Changes fix real problems without adding complexity
- ✅ Implementation is incremental and low-risk
- ✅ Success criteria are measurable and realistic

This plan should be rejected if:
- ❌ Simplicity is sacrificed for sophistication
- ❌ Changes don't solve actual user problems
- ❌ Implementation adds complexity without clear benefits

---

**Plan Status**: Ready for Review
**Expected Timeline**: 2-3 weeks
**Expected Effort**: 12-16 hours
**Risk Level**: Low
**Complexity Added**: Minimal
**Value Delivered**: High
