# Quick Fix Guide: parseConfig() Signature Mismatch

## Problem
parseConfig() implementation doesn't match test expectations, causing 10/17 test failures.

## Current Implementation (WRONG)
```javascript
// Location: figma-docker-init.js:167-193
function parseConfig(projectDir, configName, extractPattern) {
  const extensions = ['js', 'ts'];
  for (const ext of extensions) {
    try {
      const configPath = path.join(projectDir, `${configName}.config.${ext}`);
      if (!fs.existsSync(configPath)) continue;
      validateFilePath(`${configName}.config.${ext}`, projectDir);
      const content = fs.readFileSync(configPath, 'utf8');  // ❌ SYNC
      const match = content.match(extractPattern);
      return match ? match[1] : null;
    } catch (error) {
      log(`Warning: Could not parse ${configName} config.`, colors.yellow);
      continue;
    }
  }
  return null;
}
```

## Required Implementation (CORRECT)
```javascript
/**
 * Parse configuration file to extract values using regex pattern
 * @param {string} configPath - Full path to config file (with or without extension)
 * @param {RegExp} pattern - Regex pattern to extract value
 * @returns {Promise<string|null>} Extracted value or null if not found
 */
async function parseConfig(configPath, pattern) {
  const extensions = ['js', 'ts'];

  // If path already has extension, try it directly
  if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      const match = content.match(pattern);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Try adding .js and .ts extensions
  for (const ext of extensions) {
    try {
      const fullPath = `${configPath}.${ext}`;
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      const match = content.match(pattern);
      return match ? match[1] : null;
    } catch (error) {
      // Try next extension
      continue;
    }
  }

  return null;
}
```

## Update Dependent Functions

### 1. parseViteConfig
```javascript
// BEFORE
function parseViteConfig(projectDir) {
  return parseConfig(projectDir, 'vite', /build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/);
}

// AFTER
async function parseViteConfig(projectDir) {
  const configPath = path.join(projectDir, 'vite.config');
  return await parseConfig(
    configPath,
    /build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/
  );
}
```

### 2. parseRollupConfig
```javascript
// BEFORE
function parseRollupConfig(projectDir) {
  return parseConfig(projectDir, 'rollup', /output\s*:\s*{[^}]*dir\s*:\s*['"]([^'"]+)['"]/);
}

// AFTER
async function parseRollupConfig(projectDir) {
  const configPath = path.join(projectDir, 'rollup.config');
  return await parseConfig(
    configPath,
    /output\s*:\s*{[^}]*dir\s*:\s*['"]([^'"]+)['"]/
  );
}
```

### 3. parseWebpackConfig
```javascript
// BEFORE
function parseWebpackConfig(projectDir) {
  return parseConfig(projectDir, 'webpack', /output\s*:\s*{[^}]*path\s*:\s*path\.resolve\([^,]+,\s*['"]([^'"]+)['"]/);
}

// AFTER
async function parseWebpackConfig(projectDir) {
  const configPath = path.join(projectDir, 'webpack.config');
  return await parseConfig(
    configPath,
    /output\s*:\s*{[^}]*path\s*:\s*path\.resolve\([^,]+,\s*['"]([^'"]+)['"]/
  );
}
```

### 4. detectBuildOutputDir
```javascript
// BEFORE
function detectBuildOutputDir(projectDir) {
  return parseViteConfig(projectDir) ||
         parseWebpackConfig(projectDir) ||
         parseRollupConfig(projectDir) ||
         'dist'; // Default fallback
}

// AFTER
async function detectBuildOutputDir(projectDir) {
  return await parseViteConfig(projectDir) ||
         await parseWebpackConfig(projectDir) ||
         await parseRollupConfig(projectDir) ||
         'dist'; // Default fallback
}
```

### 5. detectProjectValues
```javascript
// BEFORE - Find this function and add async/await to all parseConfig calls
// Look for any calls to detectBuildOutputDir() and add await

// AFTER - Make sure function is async and awaits detectBuildOutputDir
async function detectProjectValues(projectDir) {
  // ... existing code ...
  const buildDir = await detectBuildOutputDir(projectDir);
  // ... rest of code ...
}
```

## Testing After Fix

```bash
# Run config-parser tests (should be 17/17)
npm test -- test/unit/config-parser.test.js

# Run all unit tests (should be 58/58)
npm test

# Run with coverage
npm test -- --coverage

# Expected results:
# ✅ All 58 unit tests passing
# ✅ All 9 integration tests passing
# ✅ Coverage improving toward 85%
```

## Checklist

- [ ] Replace parseConfig() function (lines 167-193)
- [ ] Update parseViteConfig() to async
- [ ] Update parseRollupConfig() to async
- [ ] Update parseWebpackConfig() to async
- [ ] Update detectBuildOutputDir() to async
- [ ] Update detectProjectValues() to async
- [ ] Find and update any other callers
- [ ] Run `npm test -- test/unit/config-parser.test.js`
- [ ] Verify 17/17 tests pass
- [ ] Run full test suite `npm test`
- [ ] Verify 67/67 tests pass (58 unit + 9 integration)
- [ ] Notify Test Verification Agent

## Expected Outcome

✅ All 17 config-parser tests passing
✅ Total 67/67 tests passing (100%)
✅ Ready for commit to feature/v1.1-refactor branch
