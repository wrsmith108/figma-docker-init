# NPM Beta Publish Instructions

**Version**: 2.0.0-beta.1
**Date**: October 26, 2025
**Status**: Ready for Beta Publish

---

## ✅ Pre-Publish Checklist

### Package Verification
- [x] package.json version: `2.0.0-beta.1`
- [x] src/lib/ included in package.json files array
- [x] CHANGELOG.md created
- [x] .npmignore configured
- [x] Package size: 32.2 kB (optimized)
- [x] Total files: 29 (core files only)

### Code Quality
- [x] Critical blockers fixed (3/3)
- [x] Tests passing: 97.4% (484/497)
- [x] YAML syntax validated
- [x] Import paths unified

### Documentation
- [x] README.md updated
- [x] BETA_RELEASE_NOTES.md created
- [x] CHANGELOG.md created
- [x] Known issues documented

---

## 🚀 Publishing Steps

### Step 1: Verify Package Contents
```bash
# Dry run to see what will be published
npm pack --dry-run

# Expected output:
# - package size: ~32 kB
# - total files: 29
# - includes: vibe-to-docker.js, src/lib/*, templates/*
```

### Step 2: Run Final Tests
```bash
# Quick verification
npm test -- --testPathPattern="vibe-to-docker.test.js"

# Should show: PASS test/vibe-to-docker.test.js
```

### Step 3: Commit All Changes
```bash
# Stage all changes
git add .

# Commit with conventional commit message
git commit -m "chore(release): prepare v2.0.0-beta.1

- Fixed NPM package to include src/lib/
- Fixed YAML syntax in docker-compose templates
- Unified import paths to src/lib/
- Added comprehensive documentation

BREAKING CHANGE: None - fully backward compatible"

# Push to feature branch
git push origin feature/per-project-installation-v2
```

### Step 4: Create Git Tag
```bash
# Create annotated tag
git tag -a v2.0.0-beta.1 -m "v2.0.0-beta.1 - Beta Release

Critical Fixes:
- NPM package includes src/lib/ directory
- YAML syntax errors fixed
- Import paths unified

Known Issues:
- Test coverage reporting (0%)
- 13 intermittent test failures
- Module integration incomplete

Test Results: 97.4% pass rate (484/497 tests)
"

# Push tag
git push origin v2.0.0-beta.1
```

### Step 5: Publish to NPM (Beta Channel)
```bash
# Login to npm (if not already logged in)
npm login

# Publish as beta
npm publish --tag beta

# Verify publish
npm view vibe-to-docker@beta
```

### Step 6: Test Installation
```bash
# Create clean test directory
mkdir /tmp/test-beta-install
cd /tmp/test-beta-install

# Test npm install
npm install vibe-to-docker@beta

# Test npx
npx vibe-to-docker@beta --version
# Should show: vibe-to-docker v2.0.0-beta.1

# Test basic template generation
npx create-vite test-app --template react
cd test-app
npx vibe-to-docker@beta basic

# Verify files created
ls -la docker-compose.yml Dockerfile nginx.conf
```

---

## 📦 What Gets Published

### Included (29 files, 32.2 kB)
```
✅ vibe-to-docker.js (main CLI)
✅ src/lib/*.js (3 modules)
✅ templates/basic/* (6 files)
✅ templates/ui-heavy/* (6 files)
✅ package.json
✅ README.md
✅ LICENSE
✅ CHANGELOG.md
```

### Excluded (via .npmignore)
```
❌ test/ (unit tests)
❌ tests/ (integration tests)
❌ docs/architecture/
❌ docs/archive/
❌ .swarm/
❌ .vibe-docker/
❌ coverage/
❌ All development files
```

---

## 🧪 Post-Publish Verification

### 1. NPM Registry Check
```bash
# Check version on npm
npm view vibe-to-docker versions

# Should include: '2.0.0-beta.1'

# Check beta dist-tag
npm dist-tag ls vibe-to-docker

# Should show: beta: 2.0.0-beta.1
```

### 2. Installation Test
```bash
# Install in fresh project
npm install vibe-to-docker@beta

# Verify module exists
ls node_modules/vibe-to-docker/src/lib/

# Should see:
# - directory-manager.js
# - path-resolver.js
# - template-cache.js
```

### 3. Functional Test
```bash
# Run CLI
npx vibe-to-docker@beta --list

# Should list templates without errors
```

---

## 🔄 Rollback Plan

If issues are discovered after publishing:

### Option 1: Deprecate Beta
```bash
npm deprecate vibe-to-docker@2.0.0-beta.1 "Known issues - use v1.0.0 or wait for beta.2"
```

### Option 2: Publish Beta.2
```bash
# Fix issues
# Update version: 2.0.0-beta.1 → 2.0.0-beta.2
npm version prerelease
npm publish --tag beta
```

### Option 3: Unpublish (within 72 hours)
```bash
# LAST RESORT - only if critical security issue
npm unpublish vibe-to-docker@2.0.0-beta.1
```

---

## 📋 Success Criteria

After publishing, verify:

- ✅ Package appears on npm registry
- ✅ `npm install vibe-to-docker@beta` works
- ✅ `npx vibe-to-docker@beta --version` shows correct version
- ✅ `npx vibe-to-docker@beta basic` generates files
- ✅ Generated docker-compose.yml is valid YAML
- ✅ src/lib/ modules are included and importable

---

## 🐛 Known Issues to Monitor

**Report these to users in beta release notes:**

1. **Test Coverage**: 0% reported (but 97.4% tests pass)
2. **Intermittent Test Failures**: 13 tests fail intermittently
3. **Module Integration**: src/lib/ created but not fully integrated
4. **Cross-Platform**: Needs Windows/Linux testing from community

---

## 📞 Support

**GitHub Issues**: https://github.com/wrsmith108/vibe-to-docker/issues
**Tag**: `beta-testing`

Encourage users to report:
- Installation issues
- Template generation errors
- Docker compatibility problems
- Cross-platform bugs

---

## 🎯 Next Steps After Beta

1. **Collect Feedback** (1-2 weeks)
   - Monitor GitHub issues
   - Track npm download stats
   - Gather user reports

2. **Fix Critical Issues**
   - Address any blockers
   - Improve test stability
   - Fix coverage reporting

3. **Release v2.0.0 Stable**
   - Remove beta tag
   - Full integration complete
   - 90%+ coverage achieved
   - All platforms tested

---

**Ready to publish?** Follow the steps above in order.

**Questions?** Check docs/BETA_RELEASE_NOTES.md
