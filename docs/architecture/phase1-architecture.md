# Phase 1: Core Per-Project Installation Architecture

## Document Control

**Version**: 1.0
**Status**: Draft
**Last Updated**: January 26, 2025
**Author**: System Architect
**Review Required**: Yes

---

## Executive Summary

This document defines the complete architecture for Phase 1 of the Per-Project Installation refactor. The goal is to transition from a global installation model to a per-project `.figma-docker/` directory structure while maintaining backward compatibility.

### Key Changes

- **From**: Global installation in user home directory or system paths
- **To**: Per-project `.figma-docker/` directory containing all templates and configurations
- **Timeline**: 2 weeks (Weeks 1-2)
- **Success Criteria**: 90%+ test coverage, zero breaking changes, all templates in `.figma-docker/`

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure Design](#directory-structure-design)
3. [Module Interfaces](#module-interfaces)
4. [Backward Compatibility Strategy](#backward-compatibility-strategy)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Security Considerations](#security-considerations)
7. [Performance Requirements](#performance-requirements)
8. [Testing Strategy](#testing-strategy)
9. [Migration Path](#migration-path)
10. [Architecture Decision Records](#architecture-decision-records)

---

## Architecture Overview

### System Context Diagram (C4 Level 1)

```
┌─────────────────────────────────────────────────────────────────┐
│                       User's Development Machine                 │
│                                                                   │
│  ┌──────────────┐                                                │
│  │   Developer  │                                                │
│  └──────┬───────┘                                                │
│         │ executes                                               │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        npx figma-docker-init                              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │   Project Root                                    │    │  │
│  │  │   ├── src/                                        │    │  │
│  │  │   ├── package.json                                │    │  │
│  │  │   └── .figma-docker/  ◄── NEW STRUCTURE           │    │  │
│  │  │       ├── config.json                             │    │  │
│  │  │       ├── templates/                              │    │  │
│  │  │       │   ├── basic/                              │    │  │
│  │  │       │   │   ├── Dockerfile                      │    │  │
│  │  │       │   │   ├── docker-compose.yml              │    │  │
│  │  │       │   │   └── nginx.conf                      │    │  │
│  │  │       │   └── ui-heavy/                           │    │  │
│  │  │       │       ├── Dockerfile                      │    │  │
│  │  │       │       ├── docker-compose.yml              │    │  │
│  │  │       │       └── nginx.conf                      │    │  │
│  │  │       ├── cache/                                  │    │  │
│  │  │       └── logs/                                   │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │   Docker Engine                                          │  │
│  │   - Reads configs from .figma-docker/templates/         │  │
│  │   - Manages containers                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    figma-docker-init Application                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                       CLI Entry Point                           │ │
│  │                  figma-docker-init.js                           │ │
│  └─────────────────────┬──────────────────────────────────────────┘ │
│                        │                                             │
│         ┌──────────────┼──────────────┐                             │
│         ▼              ▼              ▼                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │Directory │  │Path Resolver │  │  Bootstrap   │                 │
│  │ Manager  │  │              │  │   Workflow   │                 │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘                 │
│       │               │                 │                           │
│       │ creates       │ resolves        │ orchestrates              │
│       ▼               ▼                 ▼                           │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              .figma-docker/ Directory                         │  │
│  │                                                               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │  config.json │  │  templates/  │  │    cache/    │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Backward Compatibility Layer                     │  │
│  │  - Detects legacy installations                               │  │
│  │  - Provides migration warnings                                │  │
│  │  - Maintains support for existing workflows                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure Design

### `.figma-docker/` Directory Layout

```
project-root/
├── src/                           # User's application code
├── package.json                   # User's package.json
├── README.md                      # User's README
└── .figma-docker/                 # NEW: Per-project Docker config
    ├── config.json                # Tool configuration
    ├── templates/                 # Docker templates
    │   ├── basic/                 # Basic template
    │   │   ├── Dockerfile
    │   │   ├── docker-compose.yml
    │   │   ├── nginx.conf
    │   │   ├── .dockerignore
    │   │   ├── .env.example
    │   │   └── DOCKER.md
    │   ├── ui-heavy/              # UI-heavy template
    │   │   ├── Dockerfile
    │   │   ├── docker-compose.yml
    │   │   ├── nginx.conf
    │   │   ├── .dockerignore
    │   │   ├── .env.example
    │   │   └── DOCKER.md
    │   └── custom/                # User custom templates
    │       └── (user-defined)
    ├── cache/                     # Build cache and temp files
    │   ├── .gitignore
    │   └── template-cache.json
    ├── logs/                      # Installation and error logs
    │   ├── .gitignore
    │   ├── install.log
    │   └── error.log
    └── .metadata/                 # Internal tool metadata
        ├── version.json           # Tool version info
        └── install-date.json      # Installation timestamp
```

### Config File Schema: `config.json`

```json
{
  "$schema": "https://figma-docker-init.dev/schemas/config.v1.json",
  "version": "2.0.0",
  "projectType": "react|vue|angular|static",
  "selectedTemplate": "basic|ui-heavy|custom",
  "installation": {
    "date": "2025-01-26T20:00:00Z",
    "toolVersion": "2.0.0",
    "projectRoot": "/absolute/path/to/project",
    "method": "npx|global|manual"
  },
  "docker": {
    "compose": {
      "version": "3.8",
      "serviceName": "app",
      "ports": {
        "web": 3000,
        "api": 5000
      }
    },
    "build": {
      "context": "./",
      "dockerfile": ".figma-docker/templates/basic/Dockerfile",
      "target": "production"
    },
    "volumes": {
      "nodeModules": true,
      "appData": false
    }
  },
  "features": {
    "nginx": true,
    "monitoring": false,
    "ssl": false,
    "healthcheck": true
  },
  "customization": {
    "templateOverrides": {},
    "environmentVariables": {
      "NODE_ENV": "production",
      "PORT": "3000"
    }
  },
  "migration": {
    "fromVersion": "1.x.x",
    "legacyPath": "/path/to/old/installation",
    "migrationDate": "2025-01-26T20:00:00Z"
  }
}
```

### Design Rationale

**Why `.figma-docker/` directory?**

1. **Isolation**: Keeps all Docker-related files in one location
2. **Portability**: Project is self-contained, can be moved/cloned
3. **Version Control**: Can be committed to Git for team consistency
4. **Multi-Project**: Supports multiple projects on same machine
5. **Convention**: Follows established patterns (`.github/`, `.vscode/`)

**Why nested `templates/` directory?**

1. **Clarity**: Separates templates from other config
2. **Extensibility**: Easy to add more templates
3. **Organization**: Clean separation of concerns
4. **Custom Templates**: Users can add their own templates

---

## Module Interfaces

### 1. Directory Manager Module

**Location**: `lib/directory-manager.js`

**Purpose**: Manages creation, validation, and lifecycle of `.figma-docker/` directory structure.

#### Interface Definition

```javascript
/**
 * Directory Manager Module
 * Handles creation and management of .figma-docker/ directory structure
 */
class DirectoryManager {
  /**
   * Create .figma-docker directory structure
   * @param {string} projectRoot - Absolute path to project root
   * @param {Object} options - Configuration options
   * @param {boolean} options.force - Overwrite existing installation
   * @param {boolean} options.dryRun - Simulate without creating files
   * @returns {Promise<DirectoryCreationResult>}
   */
  async createDirectory(projectRoot, options = {}) {}

  /**
   * Validate existing .figma-docker directory
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<DirectoryValidationResult>}
   */
  async validateDirectory(projectRoot) {}

  /**
   * Detect if legacy installation exists
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<LegacyDetectionResult>}
   */
  async detectLegacyInstallation(projectRoot) {}

  /**
   * Cleanup failed installation
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<CleanupResult>}
   */
  async cleanup(projectRoot) {}

  /**
   * Backup existing installation
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<BackupResult>}
   */
  async backupExisting(projectRoot) {}

  /**
   * Check write permissions
   * @param {string} projectRoot - Absolute path to project root
   * @returns {Promise<PermissionCheckResult>}
   */
  async checkPermissions(projectRoot) {}
}

// Type Definitions
interface DirectoryCreationResult {
  success: boolean;
  path: string;
  directoriesCreated: string[];
  filesCreated: string[];
  error?: string;
  dryRun: boolean;
}

interface DirectoryValidationResult {
  valid: boolean;
  exists: boolean;
  complete: boolean;
  missingFiles: string[];
  corruptedFiles: string[];
  version: string;
  warnings: string[];
}

interface LegacyDetectionResult {
  hasLegacy: boolean;
  legacyPaths: string[];
  version: string;
  canMigrate: boolean;
  migrationPath: string;
}

interface CleanupResult {
  success: boolean;
  removedPaths: string[];
  errors: string[];
}

interface BackupResult {
  success: boolean;
  backupPath: string;
  timestamp: string;
  size: number;
}

interface PermissionCheckResult {
  canWrite: boolean;
  canRead: boolean;
  canExecute: boolean;
  owner: string;
  group: string;
}
```

#### Usage Examples

```javascript
import { DirectoryManager } from './lib/directory-manager.js';

const manager = new DirectoryManager();

// Create new installation
const result = await manager.createDirectory('/path/to/project', {
  force: false,
  dryRun: false
});

if (result.success) {
  console.log(`Created .figma-docker/ at ${result.path}`);
  console.log(`Files created: ${result.filesCreated.length}`);
}

// Validate existing installation
const validation = await manager.validateDirectory('/path/to/project');

if (!validation.complete) {
  console.log('Missing files:', validation.missingFiles);
}

// Detect legacy installation
const legacy = await manager.detectLegacyInstallation('/path/to/project');

if (legacy.hasLegacy) {
  console.log('Legacy installation found');
  console.log('Migration path:', legacy.migrationPath);
}
```

---

### 2. Path Resolver Module

**Location**: `lib/path-resolver.js`

**Purpose**: Centralized path resolution for all file operations, replacing hardcoded paths throughout the codebase.

#### Interface Definition

```javascript
/**
 * Path Resolver Module
 * Provides centralized path resolution for all file operations
 */
class PathResolver {
  /**
   * Initialize path resolver
   * @param {string} projectRoot - Absolute path to project root
   */
  constructor(projectRoot) {}

  /**
   * Resolve path to .figma-docker directory
   * @returns {string} Absolute path to .figma-docker/
   */
  getFigmaDockerDir() {}

  /**
   * Resolve path to templates directory
   * @returns {string} Absolute path to templates/
   */
  getTemplatesDir() {}

  /**
   * Resolve path to specific template
   * @param {string} templateName - Template name (basic, ui-heavy, etc.)
   * @returns {string} Absolute path to template directory
   */
  getTemplateDir(templateName) {}

  /**
   * Resolve path to template file
   * @param {string} templateName - Template name
   * @param {string} fileName - File name within template
   * @returns {string} Absolute path to template file
   */
  getTemplateFile(templateName, fileName) {}

  /**
   * Resolve path to config file
   * @returns {string} Absolute path to config.json
   */
  getConfigFile() {}

  /**
   * Resolve path to cache directory
   * @returns {string} Absolute path to cache/
   */
  getCacheDir() {}

  /**
   * Resolve path to logs directory
   * @returns {string} Absolute path to logs/
   */
  getLogsDir() {}

  /**
   * Resolve project-relative path
   * @param {string} relativePath - Path relative to project root
   * @returns {string} Absolute path
   */
  resolveProjectPath(relativePath) {}

  /**
   * Validate path is within project boundary
   * @param {string} path - Path to validate
   * @returns {PathValidationResult}
   */
  validatePath(path) {}

  /**
   * Normalize path for current platform
   * @param {string} path - Path to normalize
   * @returns {string} Normalized path
   */
  normalizePath(path) {}

  /**
   * Check if path exists
   * @param {string} path - Path to check
   * @returns {Promise<boolean>}
   */
  async exists(path) {}

  /**
   * Get relative path from project root
   * @param {string} absolutePath - Absolute path
   * @returns {string} Relative path from project root
   */
  getRelativePath(absolutePath) {}
}

// Type Definitions
interface PathValidationResult {
  valid: boolean;
  withinBoundary: boolean;
  exists: boolean;
  isDirectory: boolean;
  isFile: boolean;
  absolute: string;
  relative: string;
  errors: string[];
}
```

#### Usage Examples

```javascript
import { PathResolver } from './lib/path-resolver.js';

const resolver = new PathResolver('/path/to/project');

// Get .figma-docker directory path
const figmaDir = resolver.getFigmaDockerDir();
// Returns: /path/to/project/.figma-docker

// Get template file path
const dockerfile = resolver.getTemplateFile('basic', 'Dockerfile');
// Returns: /path/to/project/.figma-docker/templates/basic/Dockerfile

// Validate path
const validation = resolver.validatePath('/path/to/project/src/App.jsx');
if (validation.valid && validation.withinBoundary) {
  console.log('Path is valid and safe');
}

// Normalize path (cross-platform)
const normalized = resolver.normalizePath('templates\\basic\\Dockerfile');
// Returns: templates/basic/Dockerfile (on Unix) or templates\basic\Dockerfile (on Windows)
```

---

### 3. Bootstrap Workflow Module

**Location**: `lib/bootstrap-workflow.js`

**Purpose**: Orchestrates the complete installation workflow from initial invocation to final setup.

#### Interface Definition

```javascript
/**
 * Bootstrap Workflow Module
 * Orchestrates the complete installation and setup process
 */
class BootstrapWorkflow {
  /**
   * Initialize workflow
   * @param {Object} options - Workflow options
   */
  constructor(options = {}) {}

  /**
   * Run complete bootstrap workflow
   * @returns {Promise<BootstrapResult>}
   */
  async run() {}

  /**
   * Step 1: Detect project root
   * @returns {Promise<ProjectRootResult>}
   */
  async detectProjectRoot() {}

  /**
   * Step 2: Validate environment
   * @returns {Promise<EnvironmentValidationResult>}
   */
  async validateEnvironment() {}

  /**
   * Step 3: Create directory structure
   * @returns {Promise<DirectoryCreationResult>}
   */
  async createDirectoryStructure() {}

  /**
   * Step 4: Copy templates
   * @returns {Promise<TemplateCopyResult>}
   */
  async copyTemplates() {}

  /**
   * Step 5: Generate configuration
   * @returns {Promise<ConfigGenerationResult>}
   */
  async generateConfiguration() {}

  /**
   * Step 6: Initialize cache
   * @returns {Promise<CacheInitResult>}
   */
  async initializeCache() {}

  /**
   * Step 7: Verify installation
   * @returns {Promise<InstallationVerificationResult>}
   */
  async verifyInstallation() {}

  /**
   * Handle installation failure
   * @param {Error} error - Error that caused failure
   * @returns {Promise<FailureHandlingResult>}
   */
  async handleFailure(error) {}

  /**
   * Display next steps to user
   * @param {BootstrapResult} result - Bootstrap result
   */
  displayNextSteps(result) {}
}

// Type Definitions
interface BootstrapResult {
  success: boolean;
  steps: StepResult[];
  projectRoot: string;
  figmaDockerDir: string;
  selectedTemplate: string;
  configFile: string;
  duration: number;
  error?: string;
}

interface StepResult {
  step: string;
  success: boolean;
  duration: number;
  output?: any;
  error?: string;
}

interface ProjectRootResult {
  found: boolean;
  path: string;
  hasPackageJson: boolean;
  hasGit: boolean;
  estimatedType: string;
}

interface EnvironmentValidationResult {
  valid: boolean;
  nodeVersion: string;
  npmVersion: string;
  dockerInstalled: boolean;
  diskSpace: number;
  warnings: string[];
}

interface TemplateCopyResult {
  success: boolean;
  templatesCopied: string[];
  filesCount: number;
  totalSize: number;
}

interface ConfigGenerationResult {
  success: boolean;
  configPath: string;
  config: Object;
}

interface CacheInitResult {
  success: boolean;
  cacheDir: string;
  initialized: boolean;
}

interface InstallationVerificationResult {
  verified: boolean;
  checks: VerificationCheck[];
  allPassed: boolean;
}

interface VerificationCheck {
  name: string;
  passed: boolean;
  message: string;
}

interface FailureHandlingResult {
  cleaned: boolean;
  backedUp: boolean;
  canRetry: boolean;
  nextSteps: string[];
}
```

#### Workflow Sequence Diagram

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ npx figma-docker-init
     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Bootstrap Workflow                          │
│                                                               │
│  Step 1: Detect Project Root                                 │
│    └─► Find package.json or .git directory                   │
│         ✓ Found: /path/to/project                            │
│                                                               │
│  Step 2: Validate Environment                                │
│    └─► Check Node, npm, Docker, disk space                   │
│         ✓ All checks passed                                  │
│                                                               │
│  Step 3: Create Directory Structure                          │
│    └─► Create .figma-docker/ and subdirectories              │
│         ✓ Created 8 directories                              │
│                                                               │
│  Step 4: Copy Templates                                      │
│    └─► Copy basic/ and ui-heavy/ templates                   │
│         ✓ Copied 12 files (2.4 MB)                           │
│                                                               │
│  Step 5: Generate Configuration                              │
│    └─► Create config.json with detected settings             │
│         ✓ Config saved to .figma-docker/config.json          │
│                                                               │
│  Step 6: Initialize Cache                                    │
│    └─► Create cache directory and cache manifest             │
│         ✓ Cache initialized                                  │
│                                                               │
│  Step 7: Verify Installation                                 │
│    └─► Run verification checks                               │
│         ✓ All checks passed (7/7)                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
     │
     │ Success
     ▼
┌─────────────────────────────────────────────────────────────┐
│              Display Next Steps                              │
│                                                               │
│  ✅ Installation complete!                                    │
│                                                               │
│  Next steps:                                                 │
│  1. Review configuration in .figma-docker/config.json        │
│  2. Select template: npm run docker:init --template=basic    │
│  3. Build containers: docker-compose build                   │
│  4. Start application: docker-compose up                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Backward Compatibility Strategy

### Compatibility Layer Architecture

```javascript
/**
 * Backward Compatibility Layer
 * Maintains support for legacy installations during transition period
 */
class BackwardCompatibilityLayer {
  /**
   * Detect installation type (legacy vs new)
   * @param {string} projectRoot - Project root path
   * @returns {Promise<InstallationType>}
   */
  async detectInstallationType(projectRoot) {}

  /**
   * Create compatibility shim for legacy code
   * @param {string} projectRoot - Project root path
   * @returns {CompatibilityShim}
   */
  createCompatibilityShim(projectRoot) {}

  /**
   * Migrate legacy installation to new structure
   * @param {string} projectRoot - Project root path
   * @param {Object} options - Migration options
   * @returns {Promise<MigrationResult>}
   */
  async migrateLegacy(projectRoot, options = {}) {}

  /**
   * Check if migration is needed
   * @param {string} projectRoot - Project root path
   * @returns {Promise<MigrationCheckResult>}
   */
  async needsMigration(projectRoot) {}

  /**
   * Display migration warning
   * @param {LegacyInstallation} legacy - Legacy installation info
   */
  displayMigrationWarning(legacy) {}
}

interface InstallationType {
  type: 'new' | 'legacy' | 'none';
  version: string;
  location: string;
  migrationAvailable: boolean;
}

interface MigrationResult {
  success: boolean;
  steps: MigrationStep[];
  oldLocation: string;
  newLocation: string;
  backupCreated: boolean;
  backupPath: string;
}

interface MigrationStep {
  step: string;
  success: boolean;
  details: string;
}

interface MigrationCheckResult {
  needsMigration: boolean;
  reason: string;
  severity: 'warning' | 'error' | 'info';
  canAutoMigrate: boolean;
  manualStepsRequired: string[];
}
```

### Migration Strategy

**Phase 1: Detection (Current)**
- Detect if legacy installation exists
- Display informational message
- Continue with new installation

**Phase 2: Dual Support (Weeks 3-4)**
- Support both legacy and new installations
- Provide migration tool
- Maintain backward compatibility

**Phase 3: Deprecation (Weeks 5-8)**
- Display deprecation warnings for legacy
- Encourage migration
- Document migration path

**Phase 4: Removal (Version 3.0.0)**
- Remove legacy support
- Only support per-project installation

### Compatibility Matrix

| Feature | Legacy (v1.x) | Current (v2.0) | Migration Path |
|---------|---------------|----------------|----------------|
| Template Location | Global | Per-project | Auto-copy on init |
| Config File | ~/.figma-docker/config.json | .figma-docker/config.json | Manual review |
| Path Resolution | Absolute paths | Project-relative | Path resolver handles |
| Cache | Global cache | Per-project cache | Cache rebuild |
| Logs | Global logs | Per-project logs | Copy relevant logs |

---

## Data Flow Architecture

### Installation Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│  1. User Invocation                                             │
│     npx figma-docker-init                                       │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  2. CLI Entry Point (figma-docker-init.js)                     │
│     - Parse command-line arguments                             │
│     - Initialize logging                                       │
│     - Load configuration                                       │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  3. Bootstrap Workflow                                         │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ Step 1: Detect Project Root                         │   │
│     │   PathResolver.findProjectRoot()                    │   │
│     │   → Returns: /absolute/path/to/project              │   │
│     └─────────────────────────────────────────────────────┘   │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ Step 2: Validate Environment                        │   │
│     │   Check Node, Docker, disk space                    │   │
│     │   → Returns: validation results                     │   │
│     └─────────────────────────────────────────────────────┘   │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ Step 3: Create .figma-docker/                       │   │
│     │   DirectoryManager.createDirectory()                │   │
│     │   → Creates directory structure                     │   │
│     └─────────────────────────────────────────────────────┘   │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ Step 4: Copy Templates                              │   │
│     │   TemplateManager.copyTemplates()                   │   │
│     │   → Copies templates to .figma-docker/templates/   │   │
│     └─────────────────────────────────────────────────────┘   │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ Step 5: Generate Config                             │   │
│     │   ConfigManager.generateConfig()                    │   │
│     │   → Writes .figma-docker/config.json                │   │
│     └─────────────────────────────────────────────────────┘   │
└──────────────────┬─────────────────────────────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────────────────────────────┐
│  4. Result Display                                             │
│     - Show success message                                     │
│     - Display next steps                                       │
│     - Log completion details                                   │
└────────────────────────────────────────────────────────────────┘
```

### Template Selection Flow

```
User Request
     │
     ▼
Auto-Detection
     │
     ├─► Project Type Detection
     │   ├─► Check package.json dependencies
     │   ├─► Analyze file structure
     │   └─► Determine framework (React/Vue/Angular)
     │
     ├─► Confidence Assessment
     │   ├─► High (>80%) → Auto-select template
     │   └─► Low (<80%) → Prompt user
     │
     └─► Template Selection
         ├─► basic: Static sites, simple apps
         └─► ui-heavy: React, Vue, Angular SPA
```

---

## Security Considerations

### Path Traversal Prevention

```javascript
/**
 * Validate path is within project boundary
 * Prevents path traversal attacks (../../../etc/passwd)
 */
function validatePathSecurity(requestedPath, projectRoot) {
  const normalizedRequested = path.normalize(requestedPath);
  const normalizedRoot = path.normalize(projectRoot);
  const resolved = path.resolve(normalizedRoot, normalizedRequested);

  // Ensure resolved path starts with project root
  if (!resolved.startsWith(normalizedRoot)) {
    throw new SecurityError('Path traversal detected');
  }

  return resolved;
}
```

### File Permission Management

- **Create with safe permissions**: 0644 for files, 0755 for directories
- **Validate file ownership**: Ensure files belong to current user
- **Check write permissions**: Verify before attempting file operations
- **Sanitize file names**: Remove dangerous characters from user input

### Template Injection Prevention

```javascript
/**
 * Safe variable substitution in templates
 * Prevents code injection through template variables
 */
function safeSubstitute(template, variables) {
  // Whitelist allowed variable names
  const allowedVars = ['PROJECT_NAME', 'PORT', 'NODE_VERSION'];

  // Sanitize variable values
  const sanitized = {};
  for (const [key, value] of Object.entries(variables)) {
    if (!allowedVars.includes(key)) {
      throw new SecurityError(`Invalid variable: ${key}`);
    }
    // Escape special characters
    sanitized[key] = String(value).replace(/[<>'"&]/g, '');
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return sanitized[varName] || match;
  });
}
```

### Security Checklist

- [ ] Path traversal prevention implemented
- [ ] File permissions set correctly
- [ ] Template injection prevented
- [ ] User input sanitized
- [ ] Secrets not logged or exposed
- [ ] Temporary files cleaned up
- [ ] Error messages don't leak sensitive info

---

## Performance Requirements

### Target Metrics

| Operation | Target Time | Maximum Acceptable |
|-----------|-------------|-------------------|
| Project root detection | < 100ms | 500ms |
| Directory structure creation | < 500ms | 2s |
| Template copying | < 2s | 10s |
| Config generation | < 100ms | 500ms |
| Total installation time | < 5s | 30s |
| Path resolution (single) | < 1ms | 10ms |
| Template rendering | < 100ms | 1s |

### Optimization Strategies

**1. Parallel Operations**
```javascript
// Copy templates in parallel instead of sequentially
await Promise.all([
  copyTemplate('basic'),
  copyTemplate('ui-heavy'),
  initializeCache()
]);
```

**2. Lazy Loading**
```javascript
// Only load templates when needed
class TemplateManager {
  async getTemplate(name) {
    if (!this.cache.has(name)) {
      this.cache.set(name, await this.loadTemplate(name));
    }
    return this.cache.get(name);
  }
}
```

**3. Caching**
```javascript
// Cache path resolutions to avoid repeated file system checks
class PathResolver {
  constructor() {
    this.cache = new Map();
  }

  async exists(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }
    const result = await fs.access(path).then(() => true).catch(() => false);
    this.cache.set(path, result);
    return result;
  }
}
```

### Performance Monitoring

```javascript
/**
 * Performance monitoring utility
 */
class PerformanceMonitor {
  start(operation) {
    this.marks.set(operation, performance.now());
  }

  end(operation) {
    const start = this.marks.get(operation);
    const duration = performance.now() - start;

    if (duration > this.thresholds[operation]) {
      logger.warn(`Slow operation: ${operation} took ${duration}ms`);
    }

    return duration;
  }
}
```

---

## Testing Strategy

### Test Coverage Requirements

| Module | Unit Tests | Integration Tests | E2E Tests | Target Coverage |
|--------|------------|------------------|-----------|-----------------|
| Directory Manager | ✅ Yes | ✅ Yes | ✅ Yes | 95% |
| Path Resolver | ✅ Yes | ✅ Yes | ⬜ No | 95% |
| Bootstrap Workflow | ✅ Yes | ✅ Yes | ✅ Yes | 90% |
| Backward Compatibility | ✅ Yes | ✅ Yes | ✅ Yes | 90% |
| Template Engine | ✅ Yes | ✅ Yes | ⬜ No | 90% |

### Unit Test Structure

```javascript
// test/unit/directory-manager.test.js
describe('DirectoryManager', () => {
  describe('createDirectory', () => {
    test('creates directory structure in clean project', async () => {
      const manager = new DirectoryManager();
      const result = await manager.createDirectory('/test/project');

      expect(result.success).toBe(true);
      expect(result.directoriesCreated).toContain('.figma-docker');
      expect(result.directoriesCreated).toContain('.figma-docker/templates');
    });

    test('handles existing .figma-docker directory', async () => {
      // Create existing directory
      await fs.mkdir('/test/project/.figma-docker');

      const manager = new DirectoryManager();
      const result = await manager.createDirectory('/test/project');

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    test('uses force flag to overwrite existing', async () => {
      await fs.mkdir('/test/project/.figma-docker');

      const manager = new DirectoryManager();
      const result = await manager.createDirectory('/test/project', {
        force: true
      });

      expect(result.success).toBe(true);
    });
  });
});
```

### Integration Test Scenarios

```javascript
// test/integration/phase1-installation.test.js
describe('Phase 1 Installation', () => {
  test('complete installation on fresh React project', async () => {
    // Setup
    const projectDir = await createTestProject('react');

    // Execute
    const workflow = new BootstrapWorkflow({ projectPath: projectDir });
    const result = await workflow.run();

    // Verify
    expect(result.success).toBe(true);
    expect(await fs.access(`${projectDir}/.figma-docker`)).resolves.toBeUndefined();
    expect(await fs.access(`${projectDir}/.figma-docker/config.json`)).resolves.toBeUndefined();
    expect(await fs.access(`${projectDir}/.figma-docker/templates/basic`)).resolves.toBeUndefined();
  });

  test('migration from legacy installation', async () => {
    // Setup legacy installation
    const projectDir = await createLegacyProject();

    // Execute migration
    const compat = new BackwardCompatibilityLayer();
    const result = await compat.migrateLegacy(projectDir);

    // Verify
    expect(result.success).toBe(true);
    expect(result.backupCreated).toBe(true);
    expect(await fs.access(`${projectDir}/.figma-docker`)).resolves.toBeUndefined();
  });
});
```

### E2E Test Coverage

```javascript
// test/e2e/real-world-scenarios.test.js
describe('Real-World Scenarios', () => {
  test('install on project without package.json', async () => {
    const projectDir = await createEmptyProject();
    const result = await runCLI(['--project-dir', projectDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Installation complete');
  });

  test('install on Windows with different path separator', async () => {
    if (os.platform() !== 'win32') {
      test.skip('Windows-only test');
    }

    const result = await runCLI(['--project-dir', 'C:\\Users\\test\\project']);
    expect(result.exitCode).toBe(0);
  });

  test('install in monorepo with multiple projects', async () => {
    const monorepoDir = await createMonorepo();

    // Install in first project
    await runCLI(['--project-dir', `${monorepoDir}/project1`]);

    // Install in second project
    await runCLI(['--project-dir', `${monorepoDir}/project2`]);

    // Verify both have independent .figma-docker/
    expect(await fs.access(`${monorepoDir}/project1/.figma-docker`)).resolves.toBeUndefined();
    expect(await fs.access(`${monorepoDir}/project2/.figma-docker`)).resolves.toBeUndefined();
  });
});
```

---

## Migration Path

### For End Users

**Automatic Migration**

```bash
# Detect and migrate legacy installation
npx figma-docker-init --migrate

# Output:
# ✓ Detected legacy installation at ~/.figma-docker
# ✓ Creating backup...
# ✓ Migrating to per-project installation...
# ✓ Migration complete!
#
# Your legacy installation has been backed up to:
# ~/.figma-docker.backup.2025-01-26
```

**Manual Migration Steps**

1. **Backup existing installation**
   ```bash
   cp -r ~/.figma-docker ~/.figma-docker.backup
   ```

2. **Run new installation**
   ```bash
   cd /path/to/project
   npx figma-docker-init
   ```

3. **Review and customize**
   ```bash
   # Edit .figma-docker/config.json if needed
   vim .figma-docker/config.json
   ```

4. **Test new installation**
   ```bash
   docker-compose -f .figma-docker/templates/basic/docker-compose.yml up
   ```

5. **Remove legacy (optional)**
   ```bash
   rm -rf ~/.figma-docker
   ```

### For Developers/Contributors

**Updating Existing Code**

```javascript
// OLD: Hardcoded paths
const templatePath = path.join(__dirname, 'templates', 'basic', 'Dockerfile');

// NEW: Use PathResolver
import { PathResolver } from './lib/path-resolver.js';
const resolver = new PathResolver(projectRoot);
const templatePath = resolver.getTemplateFile('basic', 'Dockerfile');
```

**Adding New Templates**

```bash
# OLD: Add to global templates/
cp new-template/* ~/figma-docker-init/templates/new-template/

# NEW: Add to project .figma-docker/templates/
cp new-template/* .figma-docker/templates/custom/new-template/
```

---

## Architecture Decision Records

### ADR-001: Per-Project vs Global Installation

**Status**: Accepted

**Context**: Need to decide between per-project `.figma-docker/` directories or global installation in user home directory.

**Decision**: Per-project installation in `.figma-docker/` directory.

**Rationale**:
- **Portability**: Projects are self-contained and can be moved/cloned
- **Multi-Project**: Supports multiple projects with different configurations
- **Version Control**: Configuration can be committed to Git
- **Team Consistency**: All team members use same configuration
- **Isolation**: No conflicts between projects

**Consequences**:
- Requires more disk space (each project has own templates)
- Breaking change for existing users (requires migration)
- Adds complexity to path resolution
- Improves long-term maintainability

**Alternatives Considered**:
1. Global installation: Simpler but lacks isolation
2. Hybrid approach: Too complex, adds confusion
3. Symlinks to global templates: Platform-dependent, fragile

---

### ADR-002: Directory Name `.figma-docker/`

**Status**: Accepted

**Context**: Need to choose directory name for per-project installation.

**Decision**: Use `.figma-docker/` (with leading dot).

**Rationale**:
- **Convention**: Follows established patterns (`.github/`, `.vscode/`, `.docker/`)
- **Hidden**: Leading dot hides from casual directory listings
- **Descriptive**: Clear purpose from name
- **Namespaced**: `figma-` prefix avoids conflicts

**Consequences**:
- Directory is hidden by default (less discoverable)
- May be unfamiliar to some users
- Consistent with ecosystem conventions

**Alternatives Considered**:
1. `figma-docker/` (no dot): More visible but clutters project root
2. `.figma/`: Too generic, could conflict with other tools
3. `docker/`: Could conflict with user's own Docker files

---

### ADR-003: Centralized Path Resolution

**Status**: Accepted

**Context**: Need consistent way to resolve file paths across codebase.

**Decision**: Implement centralized PathResolver module.

**Rationale**:
- **Consistency**: All path operations use same logic
- **Maintainability**: Changes to path structure only affect one module
- **Security**: Central point for path validation
- **Cross-Platform**: Handles platform-specific path differences
- **Testing**: Easier to mock and test path operations

**Consequences**:
- Requires refactoring existing hardcoded paths
- Adds dependency on PathResolver for all modules
- Improves code quality and security

**Alternatives Considered**:
1. Continue with hardcoded paths: Brittle, hard to maintain
2. Use environment variables: Inflexible, error-prone
3. Config file only: Doesn't solve code-level path issues

---

### ADR-004: Backward Compatibility Layer

**Status**: Accepted

**Context**: Need to support existing users while transitioning to new architecture.

**Decision**: Implement backward compatibility layer with migration path.

**Rationale**:
- **User Experience**: Smooth transition without breaking existing workflows
- **Gradual Migration**: Users can migrate at their own pace
- **Support Window**: Allows time for documentation and communication
- **Data Preservation**: Ensures no data loss during migration

**Consequences**:
- Adds complexity to codebase temporarily
- Requires maintenance of two code paths
- Clear deprecation timeline needed
- Will be removed in version 3.0.0

**Alternatives Considered**:
1. Breaking change immediately: Would alienate existing users
2. Permanent dual support: Too complex to maintain long-term
3. No migration tool: Forces manual migration, poor UX

---

## Appendix

### Glossary

- **Project Root**: Top-level directory containing package.json or .git directory
- **Template**: Pre-configured Docker files (Dockerfile, docker-compose.yml, etc.)
- **Bootstrap**: Initial setup and installation process
- **Legacy Installation**: Pre-v2.0 global installation method
- **Path Resolution**: Process of converting relative paths to absolute paths
- **Backward Compatibility**: Support for previous version's functionality

### References

- [PER_PROJECT_INSTALLATION_PLAN.md](/Users/williamsmith/Documents/GitHub/figma-docker-init/docs/PER_PROJECT_INSTALLATION_PLAN.md)
- [PHASE_1_CHECKLIST.md](/Users/williamsmith/Documents/GitHub/figma-docker-init/docs/PHASE_1_CHECKLIST.md)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Path Module](https://nodejs.org/api/path.html)

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-26 | System Architect | Initial architecture document |

---

**END OF DOCUMENT**
