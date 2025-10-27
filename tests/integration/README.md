# Integration Tests

Comprehensive integration test suite for Phase 1 per-project installation functionality.

## Test Files

### phase1-integration.test.js
End-to-end workflow tests for per-project installation:

**Fresh Project Installation (5 tests)**
- ✅ Install figma-docker in fresh project
- ✅ Create `.figma-docker/` directory structure
- ✅ Create `docker-compose.yml` in project root
- ✅ Add `.figma-docker/` to `.gitignore`
- ✅ Create initial configuration files

**Migration from Global Installation (5 tests)**
- ✅ Detect existing global installation
- ✅ Migrate configuration to per-project
- ✅ Preserve user data during migration
- ✅ Create backup of global installation
- ✅ Update `docker-compose.yml` paths after migration

**Multi-Project Setup (4 tests)**
- ✅ Support multiple independent installations
- ✅ Isolate data between projects
- ✅ Use different ports for each project
- ✅ Maintain separate Docker networks

**Cleanup and Uninstallation (7 tests)**
- ✅ Remove `.figma-docker/` directory
- ✅ Remove `docker-compose.yml`
- ✅ Clean `.gitignore` entries
- ✅ Backup data before uninstallation
- ✅ Stop and remove Docker containers
- ✅ Remove `package.json` devDependencies entry
- ✅ Provide uninstallation summary

**Error Handling and Edge Cases (4 tests)**
- ✅ Handle installation in non-npm project
- ✅ Handle existing `.figma-docker/` directory
- ✅ Handle permission errors gracefully
- ✅ Validate `docker-compose.yml` syntax

**Total: 25 comprehensive integration tests**

### docker-integration.test.js
Docker-specific functionality and configuration tests:

**Docker Compose File Validation (7 tests)**
- ✅ Create valid `docker-compose.yml` structure
- ✅ Validate volume mount paths
- ✅ Configure correct port mappings
- ✅ Set proper environment variables
- ✅ Validate network configuration
- ✅ Include restart policy
- ✅ Configure healthcheck

**Container Startup with New Paths (4 tests)**
- ✅ Validate required directories exist
- ✅ Create `docker-compose.yml` with correct paths
- ✅ Verify container can read config files
- ✅ Support custom container names

**Volume Mount Functionality (6 tests)**
- ✅ Mount config directory as read-only option
- ✅ Persist data across container restarts
- ✅ Handle volume permissions correctly
- ✅ Support named volumes for performance
- ✅ Create log files in mounted volume
- ✅ Handle nested directory structures in volumes

**Network Configuration (5 tests)**
- ✅ Create isolated bridge network
- ✅ Support custom subnet configuration
- ✅ Configure network aliases
- ✅ Support multiple network connections
- ✅ Configure network driver options

**Docker Compose Commands (4 tests)**
- ✅ Validate `docker-compose.yml` syntax
- ✅ Generate proper project name from directory
- ✅ Support `docker-compose up` command options
- ✅ Support `docker-compose down` with volume removal

**Resource Limits and Constraints (2 tests)**
- ✅ Configure memory limits
- ✅ Configure CPU constraints

**Total: 28 Docker-specific integration tests**

## Running Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm test tests/integration

# Run specific test file
npm test tests/integration/phase1-integration.test.js
npm test tests/integration/docker-integration.test.js

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:coverage:watch
```

## Test Structure

Each test follows the Arrange-Act-Assert pattern:

```javascript
it('should do something', async () => {
  // Arrange: Setup test data and environment
  await fs.ensureDir(testDir);

  // Act: Perform the operation
  const result = await performOperation();

  // Assert: Verify the outcome
  expect(result).toBe(expected);
});
```

## Test Environment

- **Node.js**: >=20.8.1
- **Test Framework**: Jest 29.7.0
- **Dependencies**:
  - `fs-extra`: Enhanced file system operations
  - `js-yaml`: YAML parsing for Docker Compose files
  - `child_process`: Command execution simulation

## Coverage Requirements

- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Integration Points Tested

1. **File System Operations**
   - Directory creation/deletion
   - File read/write operations
   - Permission handling
   - Nested structure support

2. **Configuration Management**
   - JSON configuration files
   - YAML Docker Compose files
   - `.gitignore` manipulation
   - `package.json` updates

3. **Docker Integration**
   - Volume mounts (bind and named)
   - Network configuration
   - Port mappings
   - Resource limits
   - Health checks

4. **Migration Workflows**
   - Global to per-project migration
   - Data preservation
   - Backup creation
   - Path updates

5. **Multi-Project Support**
   - Isolated installations
   - Separate data stores
   - Different ports
   - Independent networks

## Test Data Cleanup

All tests use temporary directories created with `fs.mkdtempSync()` and cleaned up in `afterEach()` hooks to ensure:
- No test pollution
- Reproducible results
- Clean test environment

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (<30s for full suite)
- No external dependencies required
- Isolated test environments
- Deterministic results

## Future Enhancements

- [ ] Add performance benchmarks
- [ ] Test Docker network connectivity
- [ ] Add security scanning tests
- [ ] Test backup/restore workflows
- [ ] Add rollback scenario tests
