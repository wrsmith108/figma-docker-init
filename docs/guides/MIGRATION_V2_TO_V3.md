# Migration Guide: v2.x to v3.0

Complete guide for upgrading from vibe-to-docker v2.x to v3.0.

## Table of Contents

- [Overview](#overview)
- [What's New in v3.0](#whats-new-in-v30)
- [Breaking Changes](#breaking-changes)
- [Migration Steps](#migration-steps)
- [New Features](#new-features)
- [Backward Compatibility](#backward-compatibility)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Overview

Version 3.0 introduces major improvements to vibe-to-docker:

- **Universal Tool Support**: Explicit support for Lovable, V0, and Bolt (not just Figma Make)
- **Intelligent Detection**: Automatic project type detection
- **Enhanced CLI**: New `--tool` flag and improved commands
- **Better Templates**: Tool-specific Docker configurations
- **Improved Documentation**: Comprehensive guides for each tool

**Upgrade Recommendation**: ✅ Recommended for all users

**Migration Time**: ~10-15 minutes per project

## What's New in v3.0

### 1. Universal Tool Support

**v2.x** (Figma Make only):
```bash
vibe-to-docker basic
```

**v3.0** (All tools):
```bash
# Automatic detection
vibe-to-docker init

# Explicit tool selection
vibe-to-docker init --tool=lovable
vibe-to-docker init --tool=figma-make
vibe-to-docker init --tool=v0
vibe-to-docker init --tool=bolt
```

### 2. Automatic Project Detection

v3.0 automatically detects:
- Source tool (Figma Make, Lovable, V0, Bolt)
- Framework (React, Vue, Next.js, etc.)
- Build tool (Vite, Webpack, etc.)
- Database (Supabase, PostgreSQL, none)
- Backend (Express, Fastify, none)

**Example:**
```bash
$ vibe-to-docker init

Detecting project type...
✓ Detected: Lovable (confidence: 95%)
✓ Framework: React + Vite
✓ Database: Supabase
✓ Backend: Express

Generating Docker configuration...
```

### 3. Tool-Specific Templates

Each tool gets optimized configurations:

| Tool | Template | Optimizations |
|------|----------|---------------|
| Figma Make | `basic` | Static site, Vite optimizations |
| Lovable | `supabase` | Supabase integration, fullstack |
| V0 | `nextjs` | Next.js App Router, SSR |
| Bolt | `fullstack` | Multi-service, database, API |

### 4. Enhanced CLI Commands

**New Commands:**
- `vibe-to-docker init` - Auto-detect and initialize
- `vibe-to-docker init --tool=<tool>` - Explicit tool selection
- `vibe-to-docker init --dry-run` - Preview without writing files
- `vibe-to-docker init --force` - Overwrite existing configuration

**Updated Commands:**
- `vibe-to-docker --list` - Show all templates
- `vibe-to-docker --help` - Enhanced help with examples
- `vibe-to-docker --version` - Version information

### 5. Improved Documentation

New tool-specific guides:
- `docs/guides/LOVABLE_GUIDE.md`
- `docs/guides/FIGMA_MAKE_GUIDE.md`
- `docs/guides/V0_GUIDE.md`
- `docs/guides/BOLT_GUIDE.md`

## Breaking Changes

### ⚠️ Command Changes

**v2.x:**
```bash
vibe-to-docker basic
vibe-to-docker ui-heavy
```

**v3.0 (Recommended):**
```bash
vibe-to-docker init
vibe-to-docker init --template=basic
vibe-to-docker init --template=ui-heavy
```

**Backward Compatibility:** ✅ Old commands still work in v3.0

### ⚠️ Directory Structure (No Change)

`.vibe-docker/` directory structure remains the same:
```
.vibe-docker/
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .env
├── .env.example
├── .dockerignore
└── DOCKER.md
```

**Action Required:** ✅ None - existing projects work as-is

### ⚠️ Environment Variables

**Added in v3.0:**
- Tool-specific environment variables (e.g., `VITE_SUPABASE_URL` for Lovable)
- Enhanced auto-detection variables

**Removed:** None

**Action Required:** ✅ None for existing projects

## Migration Steps

### Step 1: Update vibe-to-docker

#### Global Installation

```bash
# Check current version
vibe-to-docker --version

# Update to v3.0
npm update -g vibe-to-docker

# Verify new version
vibe-to-docker --version
# Should show: vibe-to-docker v3.0.0
```

#### Local Installation

```bash
# Update package
npm install --save-dev vibe-to-docker@latest

# Verify version
npx vibe-to-docker --version
```

### Step 2: Review Existing Projects

Your existing `.vibe-docker/` directories continue to work without changes.

**Optional: Regenerate with new features:**

```bash
cd your-project

# Backup existing configuration
mv .vibe-docker .vibe-docker.backup

# Generate new configuration with auto-detection
vibe-to-docker init

# Or specify tool explicitly
vibe-to-docker init --tool=figma-make

# Compare configurations
diff -r .vibe-docker .vibe-docker.backup
```

### Step 3: Update Scripts (Optional)

If using vibe-to-docker in scripts:

**Before (v2.x):**
```json
{
  "scripts": {
    "docker:init": "vibe-to-docker basic"
  }
}
```

**After (v3.0):**
```json
{
  "scripts": {
    "docker:init": "vibe-to-docker init --tool=figma-make",
    "docker:up": "cd .vibe-docker && docker-compose up -d --build"
  }
}
```

### Step 4: Test Docker Configuration

```bash
# Test build
cd .vibe-docker
docker-compose up --build

# Verify services start correctly
docker-compose ps

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Step 5: Update Documentation References

If you've documented vibe-to-docker usage:

**Update:**
- Command references (use `init` instead of template name)
- Add tool-specific guides
- Reference new `--tool` flag

## New Features

### Feature 1: Automatic Tool Detection

**Usage:**
```bash
cd your-lovable-project
vibe-to-docker init

# CLI automatically detects Lovable
```

**How It Works:**
- Analyzes `package.json` dependencies
- Checks file structure patterns
- Examines configuration files
- Reports detection confidence

### Feature 2: Tool-Specific Optimizations

**Lovable Projects:**
- Automatic Supabase configuration
- Environment variable templates
- Fullstack setup

**V0 Projects:**
- Next.js App Router support
- Server Components configuration
- Tailwind CSS optimization

**Bolt Projects:**
- Multi-service docker-compose
- Database integration
- Backend + Frontend orchestration

### Feature 3: Dry Run Mode

Preview changes before applying:

```bash
vibe-to-docker init --dry-run
```

**Output:**
```
[DRY RUN] Would create:
  .vibe-docker/Dockerfile
  .vibe-docker/docker-compose.yml
  .vibe-docker/nginx.conf
  .vibe-docker/.env.example
  .vibe-docker/.dockerignore
  .vibe-docker/DOCKER.md

[DRY RUN] Detected configuration:
  Tool: Lovable
  Framework: React + Vite
  Database: Supabase
  Template: supabase
```

### Feature 4: Force Overwrite

Regenerate configuration even if files exist:

```bash
vibe-to-docker init --force
```

**Warning:** This overwrites existing files. Backup first!

### Feature 5: Enhanced Help

```bash
vibe-to-docker --help
```

Shows:
- Available commands
- Tool options
- Template list
- Usage examples
- Quick start guide

## Backward Compatibility

### ✅ Full Backward Compatibility

**v2.x commands work in v3.0:**
```bash
# These still work:
vibe-to-docker basic
vibe-to-docker ui-heavy
vibe-to-docker --list
vibe-to-docker --help
vibe-to-docker --version
```

**Existing `.vibe-docker/` directories:**
- No changes required
- Continue working as-is
- Can be regenerated for new features (optional)

**Environment variables:**
- All v2.x variables still supported
- New variables are additive, not breaking

### Migration Timeline

**Recommended Timeline:**
- **Immediate**: Update vibe-to-docker to v3.0 globally
- **Week 1**: Test new `init` command on new projects
- **Month 1**: Gradually migrate existing projects (optional)
- **Month 3**: Update all documentation and scripts

**Support for v2.x:**
- v2.x will receive critical bug fixes for 6 months
- v3.0 is recommended for all new projects
- Migration is optional but recommended

## Troubleshooting

### Issue: Detection Confidence Low

**Symptoms:**
```
⚠ Detected: Unknown (confidence: 30%)
```

**Solutions:**
1. Specify tool explicitly:
   ```bash
   vibe-to-docker init --tool=lovable
   ```
2. Ensure `package.json` exists and has dependencies
3. Check project structure matches tool patterns

### Issue: Old Commands Not Working

**Symptoms:**
```
Command 'vibe-to-docker basic' not found
```

**Solutions:**
1. Update to v3.0:
   ```bash
   npm update -g vibe-to-docker
   ```
2. Check version:
   ```bash
   vibe-to-docker --version
   ```

### Issue: Environment Variables Missing

**Symptoms:**
Supabase or database variables not in `.env.example`

**Solutions:**
1. Regenerate with correct tool:
   ```bash
   vibe-to-docker init --tool=lovable --force
   ```
2. Manually add missing variables:
   ```env
   VITE_SUPABASE_URL=your-url
   VITE_SUPABASE_ANON_KEY=your-key
   ```

### Issue: Docker Compose Fails

**Symptoms:**
```
ERROR: yaml.parser.ParserError
```

**Solutions:**
1. Regenerate configuration:
   ```bash
   vibe-to-docker init --force
   ```
2. Check docker-compose.yml syntax
3. Ensure Docker Compose v2+ is installed

## FAQ

### Q: Do I need to migrate existing projects?

**A:** No, migration is optional. Existing v2.x configurations continue to work in v3.0. Migrate when you want new features or optimizations.

### Q: Will v2.x stop working?

**A:** No, v2.x commands are fully supported in v3.0 for backward compatibility.

### Q: How do I know which tool my project uses?

**A:** Run `vibe-to-docker init` and it will auto-detect. Or check:
- **Lovable**: Has Supabase integration, `src/integrations/supabase/`
- **Figma Make**: React + Vite, component-based structure
- **V0**: Next.js, Tailwind, shadcn/ui
- **Bolt**: Multi-service, has `client/` and `server/` directories

### Q: Can I use v3.0 for non-AI projects?

**A:** Yes! While optimized for AI-generated projects, v3.0 works with any React, Vue, Next.js, or fullstack project.

### Q: What if auto-detection is wrong?

**A:** Use the `--tool` flag to specify explicitly:
```bash
vibe-to-docker init --tool=lovable
```

### Q: How do I get help?

**A:**
1. Read tool-specific guides: `docs/guides/`
2. Check CLI help: `vibe-to-docker --help`
3. GitHub Issues: [vibe-to-docker/issues](https://github.com/wrsmith108/vibe-to-docker/issues)
4. Discussions: [vibe-to-docker/discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

---

## Additional Resources

- [CLI User Guide](./CLI_USER_GUIDE.md)
- [Lovable Guide](./guides/LOVABLE_GUIDE.md)
- [Figma Make Guide](./guides/FIGMA_MAKE_GUIDE.md)
- [V0 Guide](./guides/V0_GUIDE.md)
- [Bolt Guide](./guides/BOLT_GUIDE.md)
- [GitHub Repository](https://github.com/wrsmith108/vibe-to-docker)

---

**Last Updated:** November 2025
**Version:** 3.0.0
