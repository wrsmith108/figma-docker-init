# Dependency Upgrade Plan - Fix Deprecated Packages

## Analysis Date: November 14, 2025

## Deprecated Packages Identified

### 1. **inflight@1.0.6** (Memory Leak)
- **Source**: Jest 29.7.0 → Uses glob@7.2.3 → Uses inflight@1.0.6
- **Impact**: Memory leak in file system operations
- **Solution**: Upgrade Jest to v30.x which uses glob@10.x (no inflight dependency)

### 2. **glob@7.2.3** (Deprecated)
- **Source**: Multiple Jest 29.x internal packages
- **Impact**: Old API, security concerns, uses deprecated inflight
- **Solution**: Jest 30.x uses glob@10.4.5

### 3. **semver-diff@5.0.0** (Deprecated)
- **Source**: semantic-release@24.2.9
- **Impact**: Unmaintained package, should use built-in semver
- **Solution**: Upgrade to semantic-release@25.x

### 4. **node-domexception@1.0.0** (Deprecated)
- **Source**: Not found in current dependency tree
- **Impact**: None (not actually used)
- **Solution**: No action needed

## Upgrade Strategy

### Phase 1: Major Version Upgrades (Breaking Changes Possible)

#### Jest Ecosystem: 29.7.0 → 30.2.0
- **jest**: 29.7.0 → 30.2.0
- **babel-jest**: 29.7.0 → 30.2.0
- **Benefits**:
  - Removes glob@7.x and inflight@1.x completely
  - Uses glob@10.4.5 (modern, maintained)
  - Better performance and memory management
  - Node 20+ native features

#### Semantic Release: 24.2.9 → 25.0.2
- **semantic-release**: 24.2.9 → 25.0.2
- **Benefits**:
  - Removes semver-diff@5.0.0
  - Uses modern semver utilities
  - Better plugin architecture

### Phase 2: Minor Version Updates

#### Babel Ecosystem
- **@babel/core**: 7.28.4 → 7.28.5
- **@babel/preset-env**: 7.28.3 → 7.28.5

#### Configuration
- **js-yaml**: 4.1.0 → 4.1.1

## Implementation Plan

### Step 1: Update package.json
```json
{
  "devDependencies": {
    "@babel/core": "^7.28.5",
    "@babel/preset-env": "^7.28.5",
    "babel-jest": "^30.2.0",
    "jest": "^30.2.0",
    "js-yaml": "^4.1.1",
    "semantic-release": "^25.0.2"
  }
}
```

### Step 2: Update Jest Configuration (if needed)
Jest 30.x maintains backward compatibility for most configurations, but may need:
- ESM support improvements (already using `--experimental-vm-modules`)
- No configuration changes expected for this project

### Step 3: Test Compatibility
```bash
npm install
npm test
npm run test:coverage
```

### Step 4: Verify No Deprecated Packages
```bash
npm ls inflight glob semver-diff node-domexception
npm audit
```

## Breaking Changes Assessment

### Jest 29 → 30 (Low Risk)
- ✅ No breaking changes for ES modules (already configured)
- ✅ No breaking changes for Jest config format
- ✅ No breaking changes for test syntax
- ✅ Backward compatible APIs
- ⚠️ Some internal APIs changed (not used by this project)

### Semantic Release 24 → 25 (Low Risk)
- ✅ Plugin API remains compatible
- ✅ Configuration format unchanged
- ✅ All current plugins support v25
- ⚠️ Node 20+ required (already met: engines.node >= 20.8.1)

## Risk Assessment: LOW

All upgrades are low-risk because:
1. Project already uses Node 20+ (required by new versions)
2. ES module configuration already in place
3. No custom Jest transformers or complex setup
4. Semantic release plugins all support v25
5. Test suite is comprehensive for validation

## Rollback Plan

If issues occur:
```bash
git checkout package.json package-lock.json
npm install
```

## Expected Outcomes

### Performance Improvements
- Faster test execution (Jest 30 optimizations)
- Better memory management (no inflight leak)
- Faster file system operations (glob@10)

### Security Improvements
- Remove deprecated packages with known issues
- Update to actively maintained versions
- Fix npm audit warnings

### Maintenance Benefits
- Modern dependency tree
- Better long-term support
- Easier future upgrades

## Verification Checklist

- [ ] package.json updated with new versions
- [ ] npm install completes successfully
- [ ] npm test passes all tests
- [ ] npm run test:coverage generates reports
- [ ] npm audit shows no vulnerabilities
- [ ] npm ls shows no deprecated packages
- [ ] CI/CD pipeline passes
- [ ] No console warnings during test runs
