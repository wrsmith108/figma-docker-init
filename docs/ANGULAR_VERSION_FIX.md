# Angular Version Mismatch Fix Guide

## Problem

**Error Message**:
```
Error: The current version of "@angular/build" supports Angular versions ^19.0.0 || ^19.2.0-next.0,
but detected Angular version 17.3.12 instead.
```

**Cause**: Bolt-generated Angular projects sometimes have version mismatches between:
- `@angular/core` (framework)
- `@angular/build` (build tools)
- `@angular/cli` (CLI tools)

This commonly happens when:
1. Bolt uses newer Angular CLI but older core version
2. Dependencies are not fully synchronized
3. Project was generated during Angular version transition period

## Immediate Fix

### Option 1: Upgrade to Match Build Tools (Recommended)

```bash
# Update Angular to version 19 (matches @angular/build)
npx @angular/cli@latest update @angular/core@19 @angular/cli@19

# Install dependencies
npm install

# Verify versions match
npm list @angular/core @angular/build @angular/cli

# Test the application
npm start
```

**Expected Output**:
```
@angular/core@19.x.x
@angular/build@19.x.x
@angular/cli@19.x.x
```

### Option 2: Downgrade Build Tools to Match Core

```bash
# Downgrade @angular/build to version 17
npm install --save-dev @angular/build@17

# Verify
npm list @angular/core @angular/build

# Test
npm start
```

### Option 3: Fresh Install with Version Lock

```bash
# Remove existing dependencies
rm -rf node_modules package-lock.json

# Install with specific versions
npm install --save @angular/core@19 @angular/common@19 @angular/platform-browser@19
npm install --save-dev @angular/cli@19 @angular/build@19

# Reinstall all dependencies
npm install

# Test
npm start
```

## Node.js Version Warning

**Warning Message**:
```
Node.js version v23.6.0 detected.
Odd numbered Node.js versions will not enter LTS status and should not be used for production.
```

### Fix Node.js Version

```bash
# Install Node Version Manager (nvm)
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install LTS version (even-numbered)
nvm install 22
nvm use 22

# Verify
node --version  # Should show v22.x.x

# Reinstall dependencies with correct Node version
rm -rf node_modules package-lock.json
npm install
```

**Recommended LTS Versions** (as of November 2025):
- **Node.js 22.x** (Current LTS)
- **Node.js 20.x** (Active LTS)
- **Node.js 18.x** (Maintenance LTS)

**Avoid**:
- v23.x (odd-numbered, not LTS)
- v21.x (odd-numbered, not LTS)
- v19.x (odd-numbered, not LTS)

## Prevention in vibe-to-docker

### v5.0.6+ Features (Planned)

Starting in v5.0.6, vibe-to-docker will automatically detect and warn about version issues:

```bash
npx vibe-to-docker init --tool=bolt

# Will display:
⚠️  Version Compatibility Warnings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Angular version mismatch detected
   @angular/core is v17 but @angular/build expects v19
   💡 Run Angular update migration
   🔧 Fix: npx @angular/cli@latest update @angular/core@19 @angular/cli@19
   📖 Learn more: https://update.angular.dev/

⚠️  Node.js v23.6.0 detected (odd-numbered version)
   Odd-numbered Node.js versions will not enter LTS status
   💡 Use an even-numbered LTS version (e.g., v20.x, v22.x)
   📖 Learn more: https://nodejs.org/en/about/previous-releases/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Manual Version Check

```bash
# Run version checker manually
node src/lib/version-checker.js

# Or with npx (future release)
npx vibe-to-docker check-versions
```

## Docker Configuration Adjustments

If you've already generated Docker files with version issues:

### Update Dockerfile Node Version

Edit `.vibe-docker/Dockerfile`:

```dockerfile
# BEFORE (uses system Node version)
FROM node:current-alpine

# AFTER (explicit LTS version)
FROM node:22-alpine
```

### Pin Package Versions in Docker

Add to `.vibe-docker/Dockerfile`:

```dockerfile
# Install specific Angular versions
RUN npm install -g @angular/cli@19

# Install dependencies with exact versions
COPY package*.json ./
RUN npm ci --production=false
```

## Troubleshooting

### Issue: Update Command Fails

```bash
# Error: Cannot find module '@angular/cli'
# Fix: Install CLI globally first
npm install -g @angular/cli@latest
npx @angular/cli update
```

### Issue: Peer Dependency Conflicts

```bash
# Error: ERESOLVE unable to resolve dependency tree
# Fix: Use --force or --legacy-peer-deps
npm install --legacy-peer-deps

# Or for clean install
npm ci --legacy-peer-deps
```

### Issue: Different Versions in Docker vs Local

```bash
# Check Docker Node version
docker run --rm node:current-alpine node --version

# Use same version locally
nvm install 22
nvm use 22
```

## Best Practices

1. **Always Use LTS Node.js Versions**
   - Production: Node.js 22.x (Current LTS)
   - Legacy support: Node.js 20.x
   - Avoid odd-numbered versions (21, 23, etc.)

2. **Keep Angular Versions Synchronized**
   - Core, Build, and CLI should have same major version
   - Use `ng update` for migrations
   - Check compatibility at https://update.angular.dev/

3. **Lock Versions in package.json**
   ```json
   {
     "dependencies": {
       "@angular/core": "19.0.0",
       "@angular/common": "19.0.0"
     },
     "devDependencies": {
       "@angular/cli": "19.0.0",
       "@angular/build": "19.0.0"
     },
     "engines": {
       "node": ">=20.0.0 <23.0.0",
       "npm": ">=10.0.0"
     }
   }
   ```

4. **Use .nvmrc for Node Version**
   ```bash
   echo "22" > .nvmrc
   nvm use
   ```

5. **Document Versions in README**
   ```markdown
   ## Prerequisites
   - Node.js 22.x (LTS)
   - npm 10.x
   - Angular 19.x
   ```

## Related Issues

- **GitHub Issue**: #26 (Angular version mismatch detection)
- **Bolt Issue**: StackBlitz/bolt#xyz (if applicable)
- **Angular Guide**: https://angular.dev/update

## Quick Reference

| Problem | Command | Expected Result |
|---------|---------|-----------------|
| Angular mismatch | `npx @angular/cli@latest update @angular/core@19` | All @angular/* at v19 |
| Node.js odd version | `nvm install 22 && nvm use 22` | Node v22.x.x |
| Clean install | `rm -rf node_modules package-lock.json && npm install` | Fresh dependencies |
| Check versions | `npm list @angular/core @angular/build @angular/cli` | All same major version |
| Docker Node version | Edit `FROM node:22-alpine` in Dockerfile | Consistent environment |

---

**Last Updated**: November 19, 2025 (v5.0.5)
**Status**: Active Issue - Fix in Progress for v5.0.6
**User Report**: User testing on v5.0.5 street-fighter-meets-economics project
