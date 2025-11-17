# Migration Guide: v3.x → v4.x

## Overview

**vibe-to-docker v4.0+** introduces universal vibe-coding support, expanding from Figma-only to supporting **Lovable, Bolt, V0, and Figma Make**.

## Breaking Changes

### 1. License Change
- **v3.x**: MIT License
- **v4.x**: Apache 2.0 License

**Action Required:** Review and accept [Apache 2.0 terms](../LICENSE) before upgrading.

### 2. CLI Command Changes
- **v3.x**: `vibe-to-docker basic` or `vibe-to-docker ui-heavy`
- **v4.x**: `vibe-to-docker init` or `vibe-to-docker init --tool=<tool-name>`

### 3. Tool Detection
**New in v4.x:** Automatic detection of Lovable, Bolt, V0, and Figma Make projects.

```bash
# Old (v3.x) - Manual template selection
vibe-to-docker basic
vibe-to-docker ui-heavy

# New (v4.x) - Auto-detection or explicit tool
vibe-to-docker init                          # Auto-detect
vibe-to-docker init --tool=figma-make       # Explicit
vibe-to-docker init --tool=lovable
vibe-to-docker init --tool=bolt
vibe-to-docker init --tool=v0
```

## Migration Steps

### For Existing v3.x Users

#### 1. Uninstall v3.x
```bash
npm uninstall -g vibe-to-docker
```

#### 2. Install v4.x
```bash
npm install -g vibe-to-docker
```

#### 3. Verify Installation
```bash
vibe-to-docker --version  # Should show 4.x
```

#### 4. Re-initialize Your Project
```bash
cd your-figma-project
vibe-to-docker init --tool=figma-make
```

### For New Projects

Simply install v4.x and use the new CLI:

```bash
npm install -g vibe-to-docker
cd your-project
vibe-to-docker init  # Auto-detect tool type
```

## Feature Comparison

| Feature | v3.x | v4.x |
|---------|------|------|
| **Supported Tools** | Figma only | Figma, Lovable, Bolt, V0 |
| **License** | MIT | Apache 2.0 |
| **Auto-detection** | ❌ | ✅ |
| **Template System** | Basic/UI-heavy | Tool-specific + fragments |
| **Security Features** | Basic | Production-grade (SLSA Level 2) |
| **Automation** | Manual setup | One-command (Docker + npm install + audit) |
| **Environment Detection** | Manual | Automatic with secret warnings |
| **Port Conflict Resolution** | Manual | Automatic fallback |
| **Multi-package Manager** | npm only | npm, yarn, pnpm |
| **Framework Variants** | Generic React | React-Vite, React-Webpack, React-Rollup |
| **Performance** | Baseline | 40% faster (parallel detection) |

## New Features in v4.x

### 1. Universal Tool Support
```bash
# Lovable (Supabase + React + Vite)
vibe-to-docker init --tool=lovable

# Bolt (Remix + TypeScript)
vibe-to-docker init --tool=bolt

# V0 (Next.js 14 + shadcn/ui)
vibe-to-docker init --tool=v0

# Figma Make (React + Vite)
vibe-to-docker init --tool=figma-make
```

### 2. Production-Grade Security
- SHA256-pinned images (SLSA Level 2)
- Container hardening (no-new-privileges, dropped capabilities)
- Resource limits (CPU/memory caps)
- Read-only filesystem
- OCI metadata for automated scanning

### 3. Automated Setup
v4.x automatically handles:
- Docker container build and start
- Dependency installation (`npm install`)
- Security vulnerability fixes (`npm audit fix --force`)

### 4. Enhanced Performance
- 40% faster detection (parallel config parsing)
- Template fragment caching (60-80% faster repeated operations)
- Multi-stage build caching (5-10 min → 30-60 sec rebuilds)

## Troubleshooting

### "Command not found" after upgrade
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install -g vibe-to-docker
```

### Port conflicts
v4.x automatically resolves port conflicts with fallback ports.

### Environment variables
v4.x auto-generates `.env.example` with detected variables. Review and customize `.vibe-docker/.env`.

## Staying on v3.x

If you need to stay on v3.x (not recommended):

```bash
npm install -g vibe-to-docker@3.4.1
```

⚠️ **v3.x is deprecated** and no longer maintained. Security updates and new features are only available in v4.x.

## Support

- 📖 [Documentation](https://github.com/wrsmith108/vibe-to-docker#readme)
- 🐛 [Issue Tracker](https://github.com/wrsmith108/vibe-to-docker/issues)
- 💬 [Discussions](https://github.com/wrsmith108/vibe-to-docker/discussions)

## License

v4.x is licensed under [Apache 2.0](../LICENSE). See [NOTICE](../NOTICE) for copyright information.
