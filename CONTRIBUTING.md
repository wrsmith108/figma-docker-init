# Contributing to vibe-to-docker

First off, thank you for considering contributing to vibe-to-docker! It's people like you that make this tool better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 20.8.1
- npm >= 10.0.0
- Docker >= 20.0.0
- Git

### Quick Start

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/vibe-to-docker.git
cd vibe-to-docker
```

3. Install dependencies:
```bash
npm install
```

4. Run tests to ensure everything works:
```bash
npm test
```

## Architecture Overview

### Per-Project Installation Architecture (v2.0.0+)

The v2.0.0 release introduced a new per-project architecture where Docker configurations are stored in a `.vibe-docker/` directory within each project.

#### Directory Structure

```
vibe-to-docker/
├── vibe-to-docker.js    # Main CLI entry point
├── lib/                     # Planned: Modular library code (Phase 1)
│   ├── path-resolver.js     # Path resolution utilities
│   ├── directory-manager.js # Directory structure management
│   ├── template-processor.js# Template processing
│   ├── config-parser.js     # Configuration file parsing
│   ├── project-detector.js  # Project auto-detection
│   └── port-manager.js      # Port allocation
├── templates/               # Template files
│   ├── basic/               # Basic template
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── nginx.conf
│   │   ├── .dockerignore
│   │   ├── .env.example
│   │   └── DOCKER.md
│   └── ui-heavy/            # UI-heavy template
│       └── [same structure]
├── test/                    # Test suite
│   ├── unit/                # Unit tests
│   └── e2e/                 # End-to-end tests
├── docs/                    # Documentation
│   ├── API.md               # API documentation
│   ├── MIGRATION_GUIDE.md   # Migration guide
│   └── ARCHITECTURE.md      # Architecture details
└── package.json
```

#### Current Architecture (v2.0.0)

The current implementation uses a monolithic `vibe-to-docker.js` file with well-organized sections:

1. **Custom Error Classes**: `ValidationError`, `ConfigError`
2. **Input Validation**: String sanitization, path validation
3. **Configuration Parsing**: Build tool config detection
4. **Project Detection**: Auto-detect framework, TypeScript, UI libraries
5. **Template Validation**: Template syntax checking
6. **Port Management**: Dynamic port allocation
7. **CLI Interface**: Help, version, list commands
8. **Main Logic**: Template copying and processing

#### Phase 1 Refactoring (In Progress)

We're refactoring to a modular architecture:

```
[Current: vibe-to-docker.js] → [Planned: Modular lib/ structure]
                                         ↓
                        ┌────────────────┴────────────────┐
                        │                                 │
            Path Resolver Module              Directory Manager Module
                        │                                 │
            Template Processor Module          Config Parser Module
                        │                                 │
            Project Detector Module            Port Manager Module
```

**Benefits:**
- Better testability
- Easier maintenance
- Clearer separation of concerns
- Simpler contribution process

### Key Components

#### 1. Path Resolver (Planned: lib/path-resolver.js)

Handles all path resolution for per-project installations:

```javascript
// Resolves project root by finding package.json
resolveProjectRoot(startDir)

// Resolves .vibe-docker/ directory
resolveDockerDir(projectRoot)

// Validates file paths for security
validateFilePath(filePath, baseDir)
```

#### 2. Directory Manager (Planned: lib/directory-manager.js)

Manages `.vibe-docker/` directory structure:

```javascript
// Creates .vibe-docker/ with proper structure
createDockerDirectory(projectRoot, options)

// Validates directory structure
validateDockerDirectory(dockerDir)

// Cleanup operations
cleanupDockerDirectory(dockerDir, options)
```

#### 3. Template Processor (Planned: lib/template-processor.js)

Processes templates with variable substitution:

```javascript
// Process a template file
processTemplate(templatePath, outputPath, variables)

// Substitute variables in content
substituteVariables(content, variables)

// Validate template syntax
validateTemplate(templatePath, variables)
```

#### 4. Config Parser (Planned: lib/config-parser.js)

Parses build tool configurations:

```javascript
// Generic config parser
parseConfig(configPath, pattern)

// Specific parsers
parseViteConfig(projectDir)
parseWebpackConfig(projectDir)
parseRollupConfig(projectDir)

// Auto-detect build output
detectBuildOutputDir(projectDir)
```

#### 5. Project Detector (Planned: lib/project-detector.js)

Auto-detects project configuration:

```javascript
// Detect all project values
detectProjectValues(projectDir)

// Detect specific aspects
detectFramework(packageJson)
detectTypeScript(dependencies)
detectUILibrary(dependencies)
```

#### 6. Port Manager (Planned: lib/port-manager.js)

Manages port allocation:

```javascript
// Check if port is available
checkPortAvailability(port)

// Find next available port
findAvailablePort(startPort, maxAttempts)

// Assign all needed ports
assignDynamicPorts()
```

### Architecture Diagrams

#### Current Flow (v2.0.0)

```
User runs CLI
      ↓
Parse arguments
      ↓
Validate template name
      ↓
Detect project values
  ├─ Read package.json
  ├─ Parse build configs
  └─ Assign ports
      ↓
Validate template
      ↓
Process template files
  ├─ Read template
  ├─ Substitute variables
  └─ Write to .vibe-docker/
      ↓
Show next steps
```

#### Planned Modular Flow (Phase 1)

```
User runs CLI
      ↓
Path Resolver
  └─ Find project root
      ↓
Directory Manager
  └─ Create .vibe-docker/
      ↓
Project Detector
  └─ Auto-detect config
      ↓
Template Processor
  └─ Process templates
      ↓
Config Writer
  └─ Write config.json
      ↓
Success!
```

## Development Setup

### Environment Setup

1. Install dependencies:
```bash
npm install
```

2. Link for local development:
```bash
npm link
```

3. Test your changes:
```bash
vibe-to-docker basic
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# View coverage report
npm run coverage:open
```

### Code Quality

```bash
# Run linter (when configured)
npm run lint

# Type checking (when TypeScript is added)
npm run typecheck

# Format code (when prettier is added)
npm run format
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title**: Describe the issue concisely
- **Steps to reproduce**: Detailed steps to trigger the bug
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, Node version, Docker version
- **Additional context**: Screenshots, error messages, logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title**: Describe the enhancement
- **Detailed description**: Explain the problem and proposed solution
- **Use case**: Why is this enhancement valuable?
- **Examples**: Show how the enhancement would work
- **Alternatives**: Other solutions you've considered

### Pull Requests

1. **Fork and clone** the repository
2. **Create a branch** from `pack-master`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
3. **Make your changes** following our coding standards
4. **Add tests** for new functionality
5. **Run tests** to ensure everything passes
6. **Commit your changes** using conventional commits
7. **Push to your fork**
8. **Create a Pull Request** against `pack-master`

## Coding Standards

### Code Style

- Use ES6+ features
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Maximum line length: 100 characters
- Meaningful variable names

### Naming Conventions

- **Functions**: camelCase (`detectProjectValues`)
- **Classes**: PascalCase (`ValidationError`)
- **Constants**: UPPER_SNAKE_CASE (`TEMPLATES_DIR`)
- **Files**: kebab-case (`path-resolver.js`)

### Comments

- Use JSDoc for function documentation
- Explain "why" not "what"
- Keep comments up-to-date

Example:
```javascript
/**
 * Detects project values from package.json and other configuration files.
 * @param {string} projectDir - The project directory path (default: '.')
 * @returns {Promise<Object>} Object containing detected project values
 */
async function detectProjectValues(projectDir = '.') {
  // Implementation
}
```

### Error Handling

- Use custom error classes (`ValidationError`, `ConfigError`)
- Provide helpful error messages
- Include context (file paths, values)
- Handle edge cases gracefully

Example:
```javascript
if (!fs.existsSync(packagePath)) {
  throw new ValidationError(
    `package.json not found at ${packagePath}. ` +
    `Ensure you're in the project root directory.`
  );
}
```

### Security

- Validate all user inputs
- Sanitize file paths
- Prevent path traversal
- No hardcoded secrets
- Use parameterized commands

## Testing Guidelines

### Test Structure

```javascript
describe('Module Name', () => {
  describe('functionName', () => {
    test('should handle normal case', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = functionName(input);

      // Assert
      expect(result).toBe('expected');
    });

    test('should handle edge case', () => {
      // Test edge cases
    });

    test('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow(ValidationError);
    });
  });
});
```

### Coverage Requirements

- **Minimum coverage**: 90%
- **Statement coverage**: >90%
- **Branch coverage**: >85%
- **Function coverage**: >90%
- **Line coverage**: >90%

### Test Types

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test module interactions
3. **E2E Tests**: Test complete workflows

## Submitting Changes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**
```
feat(templates): add support for Next.js template

Add comprehensive Next.js template with:
- Server-side rendering support
- API routes configuration
- Static optimization

Closes #123

---

fix(port-manager): handle EACCES on privileged ports

Jump to unprivileged port range when encountering
permission errors on ports < 1024.

Fixes #456

---

docs(api): update path resolver documentation

Add examples for new resolveDockerDir function
and clarify usage of validateFilePath.
```

### Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** for new features or bug fixes
3. **Update CHANGELOG.md** with your changes
4. **Ensure all tests pass** (`npm test`)
5. **Request review** from maintainers
6. **Address feedback** from code review
7. **Squash commits** if requested
8. **Wait for approval** and merge

### Review Checklist

Before submitting, verify:

- [ ] Code follows project style guidelines
- [ ] Comments are clear and necessary
- [ ] Tests cover new functionality
- [ ] All tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with pack-master
- [ ] Breaking changes are documented

## Development Workflow

### Phase 1: Core Refactoring (In Progress)

We're currently refactoring the monolithic structure into modular components. See [PHASE_1_CHECKLIST.md](docs/PHASE_1_CHECKLIST.md) for details.

**How to contribute to Phase 1:**
1. Pick a module from the checklist
2. Create the module in `lib/` directory
3. Extract relevant code from `vibe-to-docker.js`
4. Write comprehensive tests
5. Update documentation

### Adding New Templates

1. Create template directory in `templates/`
2. Add required files (Dockerfile, docker-compose.yml, etc.)
3. Use template variables: `{{VARIABLE_NAME}}`
4. Document template in README.md
5. Add template tests
6. Update template list

### Adding New Features

1. Discuss in GitHub issue first
2. Follow architecture guidelines
3. Add comprehensive tests
4. Update documentation
5. Submit pull request

## Resources

- [API Documentation](docs/API.md)
- [Migration Guide](docs/MIGRATION_GUIDE.md)
- [Architecture Details](docs/ARCHITECTURE.md)
- [Phase 1 Checklist](docs/PHASE_1_CHECKLIST.md)

## Questions?

- Open a [GitHub issue](https://github.com/wrsmith108/vibe-to-docker/issues)
- Start a [discussion](https://github.com/wrsmith108/vibe-to-docker/discussions)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to vibe-to-docker! 🎉**
