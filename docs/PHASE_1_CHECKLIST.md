# Phase 1: Core Per-Project Installation - Implementation Checklist

## Overview

**Duration**: Weeks 1-2  
**Status**: 🔴 Not Started  
**Goal**: Refactor architecture to support per-project `.figma-docker/` directory structure

---

## Week 1: Directory Structure & CLI Refactor

### Task 1.1: Directory Structure Design
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🔴 Critical

#### Subtasks
- [ ] **1.1.1** Design `.figma-docker/` directory structure
  - Define directory layout for configurations
  - Plan file organization (configs, templates, cache)
  - Document directory structure in ARCHITECTURE.md
  - **Acceptance Criteria**: Directory structure documented and approved

- [ ] **1.1.2** Create directory structure utility
  - Implement `lib/directory-manager.js`
  - Add function to create `.figma-docker/` hierarchy
  - Include error handling for permission issues
  - Add cleanup function for failed installations
  - **Acceptance Criteria**: Utility creates all required directories

- [ ] **1.1.3** Implement directory validation
  - Add validation for existing `.figma-docker/` directory
  - Check for conflicting files
  - Verify write permissions
  - Create backup mechanism for existing configs
  - **Acceptance Criteria**: Validation prevents installation conflicts

- [ ] **1.1.4** Add backward compatibility layer
  - Detect legacy global installations
  - Provide migration path from global to per-project
  - Maintain support for existing users temporarily
  - **Acceptance Criteria**: Legacy installations still function

#### Tests Required
```javascript
// test/unit/directory-manager.test.js
- Directory creation in clean project
- Directory creation with existing .figma-docker/
- Permission denied scenarios
- Cleanup on failure
- Backward compatibility detection
```

---

### Task 1.2: CLI Entry Point Refactor
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🔴 Critical

#### Subtasks
- [ ] **1.2.1** Update main CLI entry point
  - Modify `figma-docker-init.js` to detect project root
  - Implement project directory detection logic
  - Add validation for valid project directory
  - **Acceptance Criteria**: CLI correctly identifies project root

- [ ] **1.2.2** Implement installation flow
  - Create installation workflow for per-project setup
  - Add progress indicators for installation steps
  - Implement error handling and rollback
  - **Acceptance Criteria**: Installation completes successfully

- [ ] **1.2.3** Add command-line flags
  - Implement `--project-dir` flag for custom directory
  - Add `--force` flag to override existing installation
  - Create `--dry-run` flag for testing
  - Add `--verbose` flag for debugging
  - **Acceptance Criteria**: All flags work as documented

- [ ] **1.2.4** Create project config file
  - Design `.figma-docker/config.json` structure
  - Implement config file creation
  - Add validation for config file
  - Document config file schema
  - **Acceptance Criteria**: Config file created with valid schema

#### Tests Required
```javascript
// test/unit/cli-refactor.test.js
- Project root detection in various scenarios
- Installation flow completion
- Command-line flag parsing
- Config file creation and validation
```

---

### Task 1.3: Path Resolution System
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🟡 High

#### Subtasks
- [ ] **1.3.1** Create path resolver utility
  - Implement `lib/path-resolver.js`
  - Create centralized path resolution functions
  - Handle relative and absolute paths
  - Support cross-platform path formats
  - **Acceptance Criteria**: Path resolver works on all platforms

- [ ] **1.3.2** Update hardcoded paths
  - Audit codebase for hardcoded paths
  - Replace with path resolver calls
  - Update template paths
  - Update configuration paths
  - **Acceptance Criteria**: No hardcoded paths remain

- [ ] **1.3.3** Implement fallback mechanisms
  - Add fallback to global directory if needed
  - Handle missing project root gracefully
  - Provide clear error messages for path issues
  - **Acceptance Criteria**: Graceful degradation on path errors

- [ ] **1.3.4** Add path validation
  - Validate all resolved paths exist
  - Check for path traversal vulnerabilities
  - Ensure paths are within project boundary
  - **Acceptance Criteria**: All paths validated before use

#### Tests Required
```javascript
// test/unit/path-resolver.test.js
- Path resolution on Windows
- Path resolution on macOS/Linux
- Relative path handling
- Absolute path handling
- Path validation and security
```

---

## Week 2: Template Engine & Integration

### Task 1.4: Template Engine Refactor
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🔴 Critical

#### Subtasks
- [ ] **1.4.1** Update template processor
  - Modify template engine to use project-relative paths
  - Update variable substitution logic
  - Implement new template variable: `{{PROJECT_ROOT}}`
  - Add `{{FIGMA_DOCKER_DIR}}` variable
  - **Acceptance Criteria**: Templates render with correct paths

- [ ] **1.4.2** Refactor template selection
  - Update template selection based on project location
  - Modify template discovery to look in `.figma-docker/`
  - Add support for custom template directories
  - **Acceptance Criteria**: Template selection works per-project

- [ ] **1.4.3** Update template files
  - Modify `templates/basic/` files for new structure
  - Update `templates/ui-heavy/` files
  - Update `templates/advanced/` files
  - Change all template paths to use new variables
  - **Acceptance Criteria**: All templates use new path structure

- [ ] **1.4.4** Implement template caching
  - Cache template processing results
  - Invalidate cache when templates change
  - Improve template processing performance
  - **Acceptance Criteria**: 50%+ faster template processing

#### Tests Required
```javascript
// test/unit/template-engine-refactor.test.js
- Template rendering with new variables
- Template selection per-project
- Template file updates validation
- Template caching functionality
```

---

### Task 1.5: Docker Compose Integration
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🟡 High

#### Subtasks
- [ ] **1.5.1** Update docker-compose.yml template
  - Modify paths to use `.figma-docker/` directory
  - Update volume mounts for new structure
  - Change bind mount paths
  - **Acceptance Criteria**: Docker Compose uses correct paths

- [ ] **1.5.2** Update Dockerfile templates
  - Modify COPY commands for new structure
  - Update working directory paths
  - Adjust build context paths
  - **Acceptance Criteria**: Dockerfiles build successfully

- [ ] **1.5.3** Update nginx.conf template
  - Adjust configuration file paths
  - Update static file serving paths
  - Modify log file locations
  - **Acceptance Criteria**: Nginx serves files correctly

- [ ] **1.5.4** Test Docker integration
  - Verify containers start with new paths
  - Test volume mounts work correctly
  - Ensure networking functions properly
  - **Acceptance Criteria**: All containers run successfully

#### Tests Required
```javascript
// test/integration/docker-integration.test.js
- Docker Compose file validation
- Container startup with new paths
- Volume mount functionality
- Network configuration
```

---

### Task 1.6: Documentation Updates
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🟢 Medium

#### Subtasks
- [ ] **1.6.1** Update README.md
  - Document new per-project installation
  - Add examples of `.figma-docker/` structure
  - Update installation instructions
  - **Acceptance Criteria**: README reflects new architecture

- [ ] **1.6.2** Create migration guide
  - Document migration from global to per-project
  - Provide step-by-step migration instructions
  - Include troubleshooting section
  - **Acceptance Criteria**: Users can migrate successfully

- [ ] **1.6.3** Update API documentation
  - Document new path resolver API
  - Document directory manager API
  - Update configuration file schema docs
  - **Acceptance Criteria**: API docs are complete

- [ ] **1.6.4** Create developer guide
  - Document new architecture for contributors
  - Add architecture diagrams
  - Include contribution guidelines updates
  - **Acceptance Criteria**: Contributors understand new structure

---

### Task 1.7: Testing & Validation
**Status**: ⬜ Not Started  
**Owner**: TBD  
**Priority**: 🔴 Critical

#### Subtasks
- [ ] **1.7.1** Update unit tests
  - Update all unit tests for new structure
  - Add tests for new utilities
  - Ensure 90%+ code coverage
  - **Acceptance Criteria**: All unit tests pass

- [ ] **1.7.2** Create integration tests
  - Test complete installation workflow
  - Test Docker container lifecycle
  - Test template rendering end-to-end
  - **Acceptance Criteria**: Integration tests pass

- [ ] **1.7.3** E2E testing
  - Test on macOS
  - Test on Windows
  - Test on Linux
  - Test in CI environment
  - **Acceptance Criteria**: Works on all platforms

- [ ] **1.7.4** Performance testing
  - Benchmark installation time
  - Measure template processing speed
  - Compare with previous version
  - **Acceptance Criteria**: No performance regression

#### Tests Required
```javascript
// test/e2e/phase1-integration.test.js
- Full installation on fresh project
- Migration from global installation
- Multi-project setup (multiple .figma-docker/)
- Cleanup and uninstallation
```

---

## Success Metrics

### Functional Requirements
- [ ] ✅ All templates install to `.figma-docker/` directory
- [ ] ✅ CLI correctly detects and uses project root
- [ ] ✅ Path resolution works on all platforms
- [ ] ✅ No breaking changes for existing users
- [ ] ✅ All unit tests pass with >90% coverage

### Non-Functional Requirements
- [ ] ✅ Installation time < 30 seconds
- [ ] ✅ Template processing < 5 seconds
- [ ] ✅ Clear error messages for all failure modes
- [ ] ✅ Documentation complete and accurate

### Quality Gates
- [ ] ✅ Code review completed
- [ ] ✅ All tests passing in CI
- [ ] ✅ Security audit completed
- [ ] ✅ Performance benchmarks met

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes to existing users | Medium | High | Comprehensive backward compatibility testing |
| Path resolution issues on Windows | Medium | High | Early Windows testing, path normalization |
| Template engine regression | Low | Medium | Extensive template testing suite |
| Performance degradation | Low | Medium | Continuous performance monitoring |
| Documentation gaps | Medium | Low | Doc review as part of PR process |

---

## Dependencies

### External Dependencies
- Docker installed on test machines
- NPM registry access for testing
- CI/CD pipeline availability

### Internal Dependencies
- Path resolver must be completed before template updates
- Directory manager must work before CLI refactor
- Template engine must be updated before integration tests

---

## Review Checkpoints

### Week 1 Checkpoint (End of Week 1)
- [ ] Directory structure implementation complete
- [ ] CLI refactor complete
- [ ] Path resolution system working
- [ ] All Week 1 tests passing

### Week 2 Checkpoint (End of Week 2)
- [ ] Template engine refactored
- [ ] Docker integration updated
- [ ] Documentation complete
- [ ] All Phase 1 tests passing

### Phase 1 Completion Criteria
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Documentation reviewed and approved
- [ ] Ready for Phase 2 development

---

## Notes

- Keep backward compatibility as top priority
- Test on all platforms continuously
- Update documentation as code changes
- Regular team sync to address blockers
- Performance monitoring throughout development

---

**Last Updated**: January 26, 2025  
**Next Review**: Start of Week 2