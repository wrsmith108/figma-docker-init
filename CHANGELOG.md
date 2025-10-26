# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0-beta.1] - 2025-10-26

### Added
- Per-Project Architecture Design (66-page architecture document)
- Module System: src/lib/directory-manager.js, path-resolver.js, template-cache.js
- 158 comprehensive tests (97.4% pass rate)
- Complete API documentation and migration guide

### Fixed
- **CRITICAL**: NPM package now includes src/lib/ directory
- YAML syntax errors in docker-compose.yml templates (8 files)
- Import path consistency (all use src/lib/)

### Known Issues
- Test coverage shows 0% (under investigation)
- Some integration tests have intermittent failures
- .figma-docker/ architecture designed but not fully implemented

## [1.0.0] - 2025-01-20
Initial stable release
