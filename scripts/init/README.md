# Initialization Scripts

Automated setup and configuration scripts for vibe-to-docker development environment.

## Overview

The initialization system validates the development environment, installs dependencies, and configures AI-powered tools for optimal development workflow.

## Scripts

### 1. check-environment.js

Validates system requirements:

- ✅ Node.js version (>=20.8.1)
- ✅ npm version (>=10.0.0)
- ✅ Docker availability
- ✅ Git configuration
- ✅ Project structure
- ✅ Write permissions

**Usage:**

```bash
# Standard validation
node scripts/init/check-environment.js

# Strict mode (fail on warnings)
node scripts/init/check-environment.js --strict
```

**Exit Codes:**

- `0` - All checks passed
- `1` - Validation failed

### 2. setup-dependencies.js

Installs and verifies project dependencies:

- 📦 Core npm dependencies
- 🧠 AgentDB (AI memory)
- ⚡ Claude-Flow (orchestration)
- 🧪 Development tools

**Usage:**

```bash
# Full install and verify
node scripts/init/setup-dependencies.js

# Verify only (skip install)
node scripts/init/setup-dependencies.js --verify-only

# Production dependencies only
node scripts/init/setup-dependencies.js --production
```

**Features:**

- Package.json validation
- Dependency integrity checks
- Security vulnerability scanning
- Lock file verification
- Critical dependency validation

### 3. configure-tools.js

Configures AI development tools:

- 🧠 AgentDB vector database
- ⚡ Claude-Flow swarm orchestration
- 🪝 Git hooks for AI validation
- 📊 Metrics system

**Usage:**

```bash
# Full configuration
node scripts/init/configure-tools.js

# Skip specific components
node scripts/init/configure-tools.js --skip-agentdb
node scripts/init/configure-tools.js --skip-hooks

# Force overwrite existing configs
node scripts/init/configure-tools.js --force
```

**What it configures:**

- AgentDB namespaces: `coordination`, `ci-cd/failures`, `learning`, `validation`
- Claude-Flow directories: `.claude-flow/`, `.claude-flow/hooks/`, `.swarm/`
- Git hooks: pre-commit, pre-push, post-failure
- Metrics files: performance.json, system-metrics.json, task-metrics.json

### 4. index.js (Main Orchestrator)

Coordinates all initialization steps in sequence:

1. 🔍 Environment validation
2. 📦 Dependency setup
3. ⚡ Tool configuration
4. ✅ Post-initialization verification

**Usage:**

```bash
# Standard initialization
node scripts/init/index.js

# Quick mode (skip optional steps)
node scripts/init/index.js --quick

# Strict mode (fail on warnings)
node scripts/init/index.js --strict

# Verify only (no installation)
node scripts/init/index.js --verify-only

# Skip specific steps
node scripts/init/index.js --skip-deps
node scripts/init/index.js --skip-tools

# Verbose output
node scripts/init/index.js --verbose
```

**Modes:**

- **Standard**: Full installation with all features
- **Quick**: Skip optional tools (faster)
- **Strict**: Fail on any warnings
- **Verify-Only**: Check system without changes

## Quick Start

### First-Time Setup

```bash
# Run full initialization
node scripts/init/index.js

# Or use npm script (if defined)
npm run init
```

### Verify Existing Setup

```bash
# Check environment without installing
node scripts/init/index.js --verify-only
```

### Minimal Setup (CI/CD)

```bash
# Quick setup without optional tools
node scripts/init/index.js --quick --skip-tools
```

## Integration with package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "init": "node scripts/init/index.js",
    "init:quick": "node scripts/init/index.js --quick",
    "init:verify": "node scripts/init/index.js --verify-only",
    "check:env": "node scripts/init/check-environment.js",
    "setup:deps": "node scripts/init/setup-dependencies.js",
    "setup:tools": "node scripts/init/configure-tools.js"
  }
}
```

## Post-Initialization

After successful initialization, you can use:

### AI Validation

```bash
# Test pre-deployment validation
npm run ai:validate

# Verbose mode with agent reasoning
npm run ai:validate:verbose

# Strict mode (100% approval required)
npm run ai:validate:strict
```

### Memory Management

```bash
# View stored patterns
npx claude-flow@alpha memory list

# Query specific namespace
npx claude-flow@alpha memory query "ci-cd" --namespace "learning"

# Export memory
npx claude-flow@alpha memory export backup.json
```

### Metrics Dashboard

```bash
# View system metrics
npx vibe-metrics dashboard

# View specific metrics
npx vibe-metrics performance
```

## Troubleshooting

### Common Issues

**Issue: Node version too low**

```bash
# Update Node.js
nvm install 20
nvm use 20
```

**Issue: npm install fails**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Docker not running**

```bash
# Start Docker Desktop
open -a Docker

# Or start Docker daemon (Linux)
sudo systemctl start docker
```

**Issue: Git hooks not working**

```bash
# Reconfigure hooks path
git config core.hooksPath .claude-flow/hooks

# Make hooks executable
chmod +x .claude-flow/hooks/*
```

**Issue: AgentDB initialization fails**

```bash
# Remove corrupted database
rm agentdb.db

# Reinitialize
npx agentdb@latest --version  # Auto-initializes on first use
```

### Debug Mode

Run any script with additional logging:

```bash
# Set DEBUG environment variable
DEBUG=* node scripts/init/index.js --verbose
```

### Manual Verification

Check individual components:

```bash
# Node and npm
node --version
npm --version

# Docker
docker --version
docker ps

# Git
git --version
git config --list

# AgentDB
npx agentdb@latest status

# Claude-Flow
npx claude-flow@alpha --version
```

## Architecture

### Script Organization

```
scripts/
└── init/
    ├── index.js                 # Main orchestrator
    ├── check-environment.js     # Environment validation
    ├── setup-dependencies.js    # Dependency management
    ├── configure-tools.js       # Tool configuration
    └── README.md               # This file
```

### Coordination with Hooks

All scripts integrate with Claude-Flow hooks system:

```javascript
// Pre-task coordination
npx claude-flow@alpha hooks pre-task --description "Task description"

// Post-edit memory storage
npx claude-flow@alpha hooks post-edit --file "path" --memory-key "key"

// Post-task completion
npx claude-flow@alpha hooks post-task --task-id "id"
```

### Memory Storage

Implementation details stored in memory:

- **Namespace**: `coordination`
- **Keys**:
  - `init/architecture` - System architecture
  - `init/implementation` - Implementation notes
  - `init/verification` - Verification results

## Exit Codes

All scripts use consistent exit codes:

- `0` - Success
- `1` - Error or validation failure
- `130` - User interrupted (Ctrl+C)

## Environment Variables

Optional environment variables:

- `DEBUG=*` - Enable debug logging
- `CI=true` - Adjust thresholds for CI environment
- `FORCE_COLOR=1` - Force colored output

## Best Practices

1. **Run before first commit**: Ensures environment is properly configured
2. **Run after cloning**: Validates new development environment
3. **Run in CI/CD**: Automates environment validation
4. **Commit hook integration**: Automatic validation on git operations
5. **Regular verification**: Periodic `--verify-only` checks

## Dependencies

### Required

- Node.js >= 20.8.1
- npm >= 10.0.0
- Git

### Recommended

- Docker (for containerization features)
- AgentDB (for AI memory)
- Claude-Flow (for orchestration)

### Optional

- GitHub CLI (`gh`) for enhanced GitHub integration

## Version History

- **v1.0.0** (January 2025) - Initial implementation
  - Environment validation
  - Dependency setup
  - Tool configuration
  - Orchestration system

## Related Documentation

- [Main README](../../README.md)
- [CI/CD Documentation](../../docs/CI_CD_LEARNINGS.md)
- [Agent Definitions](../../docs/AGENTS.md)
- [CLAUDE.md](../../CLAUDE.md) - Project configuration

## Support

For issues or questions:

- Create an issue: https://github.com/wrsmith108/vibe-to-docker/issues
- Check existing docs: `docs/` directory
- View logs: `.claude-flow/logs/`

---

**Last Updated**: January 20, 2025
**Maintained By**: InitScriptDev Coder Agent
