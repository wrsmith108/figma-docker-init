# vibe-to-docker Roadmap

**Last Updated**: November 17, 2025
**Current Version**: v4.3.1

## Recent Achievements (v4.3.x)

### v4.3.1 - Bugfixes (November 17, 2025)
- ✅ **Auto-detection default**: `npx vibe-to-docker init` works without --tool flag
- ✅ **Validation improvement**: Secret detection changed from blocking error to warning
- ✅ **CI/CD success**: All 1,532 tests passing across 3 OS types

### v4.3.0 - Replit Support (November 17, 2025)
- ✅ **ReplitDetector**: 95% confidence detection on real projects
- ✅ **Docker Templates**: 6 production-ready template files
- ✅ **Comprehensive Tests**: 29 passing tests with 78% coverage
- ✅ **Documentation**: 15,578 words across 4 guides
- ✅ **Swarm Implementation**: 84x speedup (~10 min vs 14 hours estimated)

## Immediate Priorities (v4.4.0)

### 1. Replit DB Migration Tool
**Priority**: HIGH
**Estimated Effort**: Medium (3-5 days)
**Target**: v4.4.0

**Problem**: Replit projects use Replit DB (key-value store), which doesn't exist in Docker environments.

**Solution**:
```bash
vibe-to-docker migrate-db --from=replit-db --to=redis
vibe-to-docker migrate-db --from=replit-db --to=postgres-jsonb
```

**Implementation**:
- Detect Replit DB usage (`@replit/database` package)
- Generate migration scripts for Redis or PostgreSQL
- Update docker-compose.yml with chosen database
- Provide data migration utilities
- Update environment variables

**Success Criteria**:
- ✅ Automatic detection of Replit DB usage
- ✅ Choice of Redis (key-value) or PostgreSQL (JSONB) backends
- ✅ Migration scripts generated
- ✅ Docker Compose configured automatically
- ✅ Documentation with examples

**Files to Create**:
- `src/lib/replit-db-migrator.js` - Migration logic
- `templates/replit/migrations/` - Migration script templates
- `docs/replit/REPLIT_DB_MIGRATION.md` - User guide
- `tests/lib/replit-db-migrator.test.js` - Test suite

---

## Medium-Term Goals (v4.5.0 - v4.6.0)

### 2. Python/Django Support
**Priority**: MEDIUM
**Estimated Effort**: High (1-2 weeks)
**Target**: v4.5.0

**Rationale**: Many AI tools (Bolt, V0, Replit) generate Python/Django projects.

**Implementation**:
- Create `DjangoDetector` for Django projects
- Create `FlaskDetector` for Flask projects
- Docker templates with gunicorn/uWSGI
- PostgreSQL integration
- Static file handling (whitenoise)
- Celery/Redis for async tasks

**Detection Signatures**:
- `manage.py` file (Django)
- `requirements.txt` or `pyproject.toml`
- `settings.py` in project structure
- `wsgi.py` or `asgi.py`

**Success Criteria**:
- ✅ 80%+ detection confidence
- ✅ Multi-stage Docker builds for Python
- ✅ Development and production configurations
- ✅ Database migration support
- ✅ Static file serving in production

### 3. Nix-to-Docker Conversion
**Priority**: MEDIUM
**Estimated Effort**: High (1-2 weeks)
**Target**: v4.5.0

**Rationale**: Replit uses Nix for dependency management (`replit.nix`), but Docker uses system packages.

**Implementation**:
- Parse `replit.nix` configuration
- Map Nix packages to Alpine/Debian packages
- Generate equivalent Dockerfile RUN commands
- Handle edge cases (custom derivations)

**Example Conversion**:
```nix
# replit.nix
{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.postgresql
    pkgs.ffmpeg
  ];
}
```

Converts to:
```dockerfile
# Dockerfile
FROM node:20-alpine
RUN apk add --no-cache postgresql-client ffmpeg
```

**Success Criteria**:
- ✅ 90%+ accuracy on common Nix packages
- ✅ Fallback warnings for unmapped packages
- ✅ Support for multiple package ecosystems
- ✅ Documentation of unsupported packages

### 4. Cursor IDE Support
**Priority**: LOW
**Estimated Effort**: Low (2-3 days)
**Target**: v4.6.0

**Rationale**: Cursor (VS Code fork with AI) generates projects similar to V0/Bolt.

**Implementation**:
- Detect `.cursorrules` configuration
- Framework detection (usually Next.js/React)
- Template reuse from V0/Bolt detectors

**Success Criteria**:
- ✅ 70%+ detection confidence
- ✅ Reuse existing Next.js templates
- ✅ Minimal new code (leverage existing detectors)

---

## Process Improvements

### 5. Automated Metrics Collection
**Priority**: HIGH
**Implementation**: Immediate

**Goal**: Track feature adoption and success rates.

**Metrics to Track**:
- Detection confidence scores (per tool)
- Template usage statistics
- Build success/failure rates
- Auto-detection vs manual tool selection
- Port conflict frequency
- Error types and frequencies

**Implementation**:
```javascript
// Add to vibe-to-docker.js after successful init
await trackMetrics({
  tool: detectionResult.tool,
  confidence: detectionResult.confidence,
  autoDetected: !toolArg,
  timestamp: Date.now(),
  success: true
});
```

**Storage**: Local SQLite database (opt-out via flag)

**Privacy**: Anonymous, no project names or paths

### 6. Feature Launch Checklist
**Priority**: MEDIUM
**Implementation**: Immediate

**Checklist for ALL new features**:

#### Pre-Implementation
- [ ] Create research document in `.claude-flow/docs/research/`
- [ ] Create architecture plan
- [ ] Create implementation plan with token estimates
- [ ] Define success criteria
- [ ] Identify test cases (real projects)

#### Implementation
- [ ] Detector class created with BaseDetector pattern
- [ ] Templates created (Dockerfile, docker-compose.yml, etc.)
- [ ] CLI integration in vibe-to-docker.js
- [ ] Template composer integration
- [ ] Tests written (unit, integration, fixtures)
- [ ] Code coverage >75%

#### Pre-Commit QA
- [ ] **Scope check**: All files REQUIRED for feature?
- [ ] No hardcoded paths
- [ ] No timing assumptions (CI multiplier)
- [ ] No platform-specific code
- [ ] JSON/YAML files valid
- [ ] Docker syntax validated
- [ ] Templates tested on real projects

#### Post-Merge
- [ ] README.md updated
- [ ] Migration guide created (if needed)
- [ ] User-facing docs in `docs/<tool>/`
- [ ] Developer docs in `.claude-flow/docs/`
- [ ] CI/CD learnings stored in AgentDB
- [ ] Metrics collection added

#### Post-Release
- [ ] NPM package tested (`npx vibe-to-docker@latest`)
- [ ] Real project validation
- [ ] User feedback collected
- [ ] Bug reports triaged
- [ ] Retrospective completed

---

## Future Exploration (v5.0.0+)

### 7. Multi-Service Orchestration
- Complex apps with multiple services
- Kubernetes manifest generation
- Service mesh integration (Istio, Linkerd)

### 8. Cloud Provider Integration
- AWS ECS/Fargate deployment
- Google Cloud Run deployment
- Azure Container Instances
- DigitalOcean App Platform

### 9. AI-Specific Optimizations
- Detect AI-generated code patterns
- Auto-fix common AI code issues
- Dependency conflict resolution
- Security hardening for AI code

### 10. Performance Optimizations
- Parallel template generation
- Cache Docker layers more efficiently
- Reduce image sizes (multi-arch builds)
- Faster build times

---

## Success Metrics

### Detection Accuracy
- **Target**: 80%+ confidence across all tools
- **Current**: 95% (Lovable), 80% (Bolt/V0/Figma), 95% (Replit)

### Build Success Rate
- **Target**: 95%+ on first `docker-compose up`
- **Current**: ~85% (estimated, needs metrics)

### Test Coverage
- **Target**: 80%+ coverage
- **Current**: 78% (v4.3.1)

### CI/CD Stability
- **Target**: 100% passing on pack-master
- **Current**: 100% (1,532/1,532 tests)

### User Satisfaction
- **Target**: >90% successful setups
- **Measure**: GitHub issues, user surveys

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

### Feature Request Process
1. Open GitHub issue with `enhancement` label
2. Discuss scope and implementation
3. Create feature branch
4. Follow feature launch checklist (above)
5. Submit PR with comprehensive tests and docs

---

## License

Apache License 2.0 - see [LICENSE](../../LICENSE)

Copyright 2025 Smith Horn Group Ltd.
