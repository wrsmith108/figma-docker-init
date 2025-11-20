# Project Structure Analysis - vibe-to-docker

**Generated**: November 20, 2025
**Analyst**: Project Analyzer Agent
**Session**: swarm-init

## Executive Summary

**vibe-to-docker v5.1.0** is a universal Docker containerization CLI tool for AI-generated projects. It solves specific failure patterns in AI-generated code through 24 features across 6 categories, achieving 99.4% test coverage with 1,231 passing tests.

## Project Overview

### Core Identity
- **Name**: vibe-to-docker
- **Version**: 5.1.0
- **Type**: CLI Tool / NPM Package
- **License**: Apache-2.0
- **Repository**: https://github.com/wrsmith108/vibe-to-docker

### Purpose
Universal Docker containerization tool addressing AI tool failure patterns:
- 82% dependency conflicts
- 60-70% environment mismatches
- 48% hardcoded secrets in AI-generated code

Supports: Figma Make, Lovable, Bolt, V0, Replit

## Technology Stack

### Runtime Environment
- **Node.js**: >= 20.8.1
- **npm**: >= 10.0.0
- **Module System**: ES Modules (`type: "module"`)
- **Language**: JavaScript

### Dependencies

**Production** (3):
- `chalk` 5.3.0 - Terminal styling
- `commander` 11.1.0 - CLI framework
- `sql.js` 1.10.3 - SQL database

**Development** (Key):
- `agentdb` 1.6.1 - Vector database for agent memory
- `agentic-flow` 1.10.2 - Multi-agent coordination (213+ MCP tools)
- `claude-flow` 2.7.35 - Swarm orchestration, neural training
- `jest` 30.2.0 - Testing framework
- `semantic-release` 25.0.2 - Automated versioning

### Build & Test Systems
- **Build**: None (direct execution)
- **Test Framework**: Jest with experimental-vm-modules
- **Test Coverage**: 99.4% (1,231 passing tests)
- **CI/CD**: GitHub Actions (4-stage pipeline)

## Architecture

### Design Pattern
**Modular CLI with Multi-Phase Detection and Composition**

### Entry Point
`vibe-to-docker.js` (main executable)

### Core Components

1. **Tool Detection System** (5 AI tool detectors)
   - `lovable-detector.js` - React + Vite + Supabase (95% confidence)
   - `bolt-detector.js` - Remix + TypeScript (80% confidence)
   - `v0-detector.js` - Next.js 14 + shadcn/ui (80% confidence)
   - `figma-detector.js` - React + Vite (80% confidence)
   - `replit-detector.js` - Full-stack Node.js (80-95% confidence)

2. **Template Composition System**
   - Fragment-based composition
   - Template caching (60-80% faster)
   - Variable substitution with sanitization

3. **Environment Management**
   - Auto environment variable detection
   - Secret pattern identification
   - Build-time vs runtime separation

4. **Validation & Sanitization Layer**
   - Input validation
   - Security sanitization
   - Template validation

5. **Version Compatibility Checker**
   - Automated version checking
   - Compatibility warnings

6. **Configuration Generators**
   - Dockerfile generation
   - docker-compose.yml creation
   - nginx.conf with security headers

7. **Package Fixers**
   - Multi-package manager reconciliation
   - Dependency conflict resolution

### Directory Structure

```
vibe-to-docker/
├── src/
│   ├── cli/                 # CLI utilities (metrics)
│   ├── core/                # Core functionality (cache)
│   ├── detectors/           # AI tool detection (5 detectors)
│   ├── lib/                 # Core utilities (16 modules)
│   └── templates/           # Template system with fragments
│       ├── base/            # Base templates
│       ├── fragments/       # Template fragments
│       └── tools/           # Tool-specific templates
├── templates/               # User-facing Docker templates
├── test/                    # Legacy tests (e2e, fixtures)
├── tests/                   # Primary test suite
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   ├── e2e/                # End-to-end tests
│   ├── performance/        # Performance tests
│   └── security/           # Security tests
├── scripts/                 # Utility scripts (ai-validate.js)
├── docs/                    # Documentation
├── .claude-flow/           # Claude-Flow integration
│   ├── hooks/              # Pre/post task hooks
│   ├── metrics/            # Performance metrics
│   └── dev-tools/          # Development tools
├── .swarm/                 # Swarm coordination memory
├── .github/workflows/      # CI/CD pipelines
└── vibe-to-docker.js       # Main entry point
```

### Source Files
- **Total**: 33 JavaScript files
- **Detectors**: 8 detection modules
- **Library**: 16 utility modules
- **CLI**: 1 metrics module
- **Core**: 1 cache module

## Features (24 Total)

### 1. AI Tool Detection & Adaptation (5 features)
- Automatic tool detection (95% confidence for Lovable)
- Template composition with fragment system
- Multi-package manager reconciliation
- Framework variant detection (React-Vite, React-Webpack, React-Rollup)
- Per-project isolation (`.vibe-docker/` directory)

### 2. Performance Optimizations (4 features)
- 40% faster detection via parallel processing
- Template fragment caching (60-80% faster)
- Confidence-based early exit
- Multi-stage build caching (5-10 min → 30-60 sec)

### 3. Environment & Configuration (6 features)
- Auto environment detection
- Secret pattern identification (API_KEY, PASSWORD, TOKEN)
- Build-time vs runtime separation (VITE_, NEXT_PUBLIC_, REACT_APP_)
- Dynamic port assignment
- Build output detection
- Template variable validation

### 4. Security Features (5 features)
- Security headers (X-Frame-Options, HSTS, CSP, XSS-Protection)
- Non-root execution
- SSL/TLS ready (TLSv1.2/1.3)
- Input sanitization (directory traversal, null byte injection)
- Read-only root filesystem

### 5. Production Readiness (3 features)
- Health check endpoints (`/health`)
- Monitoring metrics (Prometheus-compatible `/metrics`)
- Gzip compression (60-70% bandwidth reduction)

### 6. Developer Experience (1 feature)
- Template validation with actionable warnings

## Testing Infrastructure

### Framework Configuration
```javascript
// jest.config.js
{
  testEnvironment: 'node',
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 69,
      lines: 62,
      statements: 62
    }
  }
}
```

### Test Coverage
- **Overall**: 99.4%
- **Total Tests**: 1,231 passing
- **Test Types**: unit, integration, e2e, performance, security

### Test Organization
- `tests/unit/` - Component-level tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests
- `tests/performance/` - Performance benchmarks
- `tests/security/` - Security validation
- `test/` - Legacy tests (e2e, fixtures)

## CI/CD Pipeline

### Platform
GitHub Actions (4-stage pipeline)

### Stages
1. **Security** - CodeQL analysis, npm audit
2. **Lint** - Template validation, package.json validation
3. **Test** - Matrix testing (3 OS × 2 Node versions)
4. **Build & Package** - npm pack, integrity verification
5. **Release** - Semantic release, NPM publish (pack-master only)

### Matrix Testing
- **Operating Systems**: ubuntu-latest, windows-latest, macos-latest
- **Node Versions**: 20.x, 22.x
- **Total Combinations**: 6

### AI Validation System
- **Pre-commit hooks**: Enabled
- **Agents**: 7 (Byzantine consensus)
- **Approval Threshold**: 6/7 agents
- **Learning**: AgentDB ReflexION episodes
- **Prevention Rate**: 85%+ (after 20 failures)

## Supported AI Tools

### 1. Lovable
- **Framework**: React + Vite + Supabase
- **Confidence**: 95%
- **Features**: Real-time, Authentication, Database integration

### 2. Bolt
- **Framework**: Remix + TypeScript
- **Confidence**: 80%
- **Features**: Multi-service orchestration, WebContainer compatibility

### 3. V0
- **Framework**: Next.js 14 + shadcn/ui
- **Confidence**: 80%
- **Features**: SSR, API routes, Static optimization

### 4. Figma Make
- **Framework**: React + Vite
- **Confidence**: 80%
- **Features**: Design-to-code, TypeScript support

### 5. Replit
- **Framework**: Full-stack Node.js + PostgreSQL
- **Confidence**: 80-95%
- **Features**: Full-stack, Database, Express/React/Three.js

## AI/ML Tooling Integration

### AgentDB (v1.6.1)
- **Purpose**: Vector database for persistent agent memory
- **Location**: `./agentdb.db`
- **Features**: ReflexION learning, HNSW indexing, 150x faster vector search

### Claude-Flow (v2.7.35)
- **Purpose**: Swarm orchestration, neural training, GitHub integration
- **Features**: 54 agent types, 27+ neural models, memory coordination
- **Integration**: `.claude-flow/hooks/` for pre/post task automation

### Agentic-Flow (v1.10.2)
- **Purpose**: Multi-agent coordination
- **Features**: 213+ MCP tools
- **Capabilities**: Distributed systems, consensus mechanisms, DAA

### Hooks System
- `pre-task.sh` - Task initialization, agent assignment
- `post-task.sh` - Code formatting, neural training, metrics
- `pre-commit` - AI validation with 7-agent Byzantine consensus
- `post-failure` - Learning from CI failures

## Migration Status

### History
- **v3.x**: Figma-only (DEPRECATED November 2025)
- **v4.x**: Multi-tool support
- **v5.x**: Universal vibe-coding (CURRENT)

### Current Focus
Universal Docker containerization for all AI-generated projects

## Performance Metrics

### Speed Improvements
- **Detection**: 40% faster (parallel processing)
- **Template Caching**: 60-80% faster repeated operations
- **Rebuild Time**: 30-60 seconds (from 5-10 minutes)
- **Bandwidth**: 60-70% savings (gzip compression)

### Quality Metrics
- **Test Coverage**: 99.4%
- **Passing Tests**: 1,231
- **AI Validation Prevention**: 85%+ (after learning)
- **False Positive Rate**: <10%

## Key Files Reference

### Entry Points
- `vibe-to-docker.js` - Main CLI entry point
- `src/cli/metrics.js` - Metrics CLI

### Configuration
- `package.json` - Package configuration
- `jest.config.js` - Test configuration
- `babel.config.js` - Babel configuration
- `.github/workflows/ci.yml` - CI/CD pipeline

### Hooks
- `.claude-flow/hooks/pre-task.sh`
- `.claude-flow/hooks/post-task.sh`
- `.claude-flow/hooks/pre-commit`
- `.claude-flow/hooks/post-failure`
- `.claude-flow/hooks/pre-push`

### Documentation
- `README.md` - User guide
- `CLAUDE.md` - Claude Code configuration
- `docs/` - Comprehensive documentation

## Problem Solved

**Primary Issue**: AI-generated code contains predictable failure patterns that generic Docker tools don't address.

**Solution**: Tool-specific detection and mitigation:
- 82% dependency conflicts → Multi-package manager reconciliation
- 60-70% environment mismatches → Auto environment detection
- 48% hardcoded secrets → Secret pattern identification and warnings

**Differentiation from `docker init`**:
- Generic React detection → Framework variant detection (Vite/Webpack/Rollup)
- Manual .env setup → Auto .env generation with secret warnings
- Sequential processing → Parallel detection (40% faster)
- Basic nginx → OWASP security headers + SSL/TLS

## Recommendations for Development

### For New Features
1. Add detector in `src/detectors/`
2. Create tests in `tests/unit/detectors/`
3. Update `vibe-to-docker.js` to include new detector
4. Run `npm test -- --coverage` before committing

### For Bug Fixes
1. Write failing test first (TDD)
2. Implement fix
3. Verify all tests pass
4. Check coverage thresholds maintained

### For Performance Optimization
1. Profile with `tests/performance/`
2. Implement optimization
3. Benchmark improvements
4. Document in `docs/`

### For CI/CD Changes
1. Test locally with `npm run ai:validate`
2. Update `.github/workflows/ci.yml`
3. Store failure patterns with `.claude-flow/hooks/post-failure`
4. Monitor AI validation prevention rate

---

**Analysis Complete**: November 20, 2025
**Task ID**: task-1763679668621-5h8x2ell8
**Performance**: 248.59 seconds
**Status**: ✅ SUCCESS
