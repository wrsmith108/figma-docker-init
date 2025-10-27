# API Documentation

## Overview

This document describes the internal APIs and configuration schemas for `figma-docker-init` v2.0.0. This is useful for:

- Contributing to the project
- Understanding the per-project architecture
- Extending functionality
- Debugging issues

## Configuration File Schema

### .figma-docker/config.json

The project configuration file stores project-specific settings.

```json
{
  "$schema": "https://figma-docker-init.dev/schema/config.v1.json",
  "version": "2.0.0",
  "template": "ui-heavy",
  "project": {
    "name": "my-app",
    "framework": "react-vite",
    "typescript": true,
    "ui_library": "Material-UI"
  },
  "build": {
    "output_dir": "dist",
    "dependency_count": 42
  },
  "ports": {
    "dev": 3000,
    "prod": 8080,
    "nginx": 8888
  },
  "paths": {
    "dockerfile": ".figma-docker/Dockerfile",
    "compose": ".figma-docker/docker-compose.yml",
    "nginx": ".figma-docker/nginx.conf",
    "env": ".figma-docker/.env"
  },
  "created_at": "2025-01-26T20:46:56.767Z",
  "updated_at": "2025-01-26T20:46:56.767Z"
}
```

#### Schema Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `version` | string | Yes | figma-docker-init version |
| `template` | string | Yes | Template name used (basic, ui-heavy) |
| `project.name` | string | Yes | Project name from package.json |
| `project.framework` | string | Yes | Detected framework (react-vite, vue, etc.) |
| `project.typescript` | boolean | Yes | TypeScript usage detected |
| `project.ui_library` | string | Yes | UI library detected or "none" |
| `build.output_dir` | string | Yes | Build output directory (dist, out, etc.) |
| `build.dependency_count` | number | Yes | Number of npm dependencies |
| `ports.dev` | number | Yes | Development server port |
| `ports.prod` | number | Yes | Production server port |
| `ports.nginx` | number | Yes | Nginx proxy port |
| `paths.*` | string | Yes | Relative paths to Docker files |
| `created_at` | string (ISO8601) | Yes | Creation timestamp |
| `updated_at` | string (ISO8601) | Yes | Last update timestamp |

## Path Resolver API

### Module: `lib/path-resolver.js`

Centralized path resolution for per-project installations.

#### `resolveProjectRoot(startDir = process.cwd())`

Finds the project root directory by looking for `package.json`.

**Parameters:**
- `startDir` (string): Directory to start search from

**Returns:** `string` - Absolute path to project root

**Throws:**
- `Error` - If package.json not found in directory tree

**Example:**
```javascript
import { resolveProjectRoot } from './lib/path-resolver.js';

const projectRoot = resolveProjectRoot();
// /Users/username/projects/my-app
```

#### `resolveDockerDir(projectRoot)`

Resolves the `.figma-docker/` directory path.

**Parameters:**
- `projectRoot` (string): Project root directory

**Returns:** `string` - Absolute path to `.figma-docker/` directory

**Example:**
```javascript
const dockerDir = resolveDockerDir(projectRoot);
// /Users/username/projects/my-app/.figma-docker
```

#### `resolveTemplatePath(templateName)`

Resolves template directory path.

**Parameters:**
- `templateName` (string): Template name (basic, ui-heavy)

**Returns:** `string` - Absolute path to template directory

**Throws:**
- `ValidationError` - If template name invalid

**Example:**
```javascript
const templatePath = resolveTemplatePath('ui-heavy');
// /usr/local/lib/node_modules/figma-docker-init/templates/ui-heavy
```

#### `validateFilePath(filePath, baseDir)`

Validates file path is within allowed base directory.

**Parameters:**
- `filePath` (string): File path to validate
- `baseDir` (string): Base directory path must be within

**Returns:** `string` - Validated and resolved file path

**Throws:**
- `ValidationError` - If path outside base directory

**Example:**
```javascript
try {
  const safe = validateFilePath('./config.json', projectRoot);
} catch (error) {
  console.error('Path validation failed:', error.message);
}
```

## Directory Manager API

### Module: `lib/directory-manager.js`

Manages `.figma-docker/` directory structure.

#### `createDockerDirectory(projectRoot, options = {})`

Creates `.figma-docker/` directory structure.

**Parameters:**
- `projectRoot` (string): Project root directory
- `options` (object): Creation options
  - `force` (boolean): Overwrite existing directory
  - `backup` (boolean): Backup existing directory

**Returns:** `Promise<object>` - Creation result
```javascript
{
  path: '/path/to/.figma-docker',
  created: true,
  backed_up: false
}
```

**Throws:**
- `Error` - If directory exists and force=false

**Example:**
```javascript
import { createDockerDirectory } from './lib/directory-manager.js';

const result = await createDockerDirectory(projectRoot, {
  force: false,
  backup: true
});
```

#### `validateDockerDirectory(dockerDir)`

Validates `.figma-docker/` directory structure.

**Parameters:**
- `dockerDir` (string): Path to `.figma-docker/` directory

**Returns:** `Promise<object>` - Validation result
```javascript
{
  valid: true,
  errors: [],
  warnings: [],
  missing_files: []
}
```

**Example:**
```javascript
const validation = await validateDockerDirectory(dockerDir);
if (!validation.valid) {
  console.error('Invalid structure:', validation.errors);
}
```

#### `cleanupDockerDirectory(dockerDir, options = {})`

Cleans up `.figma-docker/` directory.

**Parameters:**
- `dockerDir` (string): Path to `.figma-docker/` directory
- `options` (object): Cleanup options
  - `remove_env` (boolean): Remove .env file
  - `remove_logs` (boolean): Remove log files
  - `full` (boolean): Remove entire directory

**Returns:** `Promise<void>`

**Example:**
```javascript
await cleanupDockerDirectory(dockerDir, {
  remove_logs: true,
  remove_env: false
});
```

## Template Processing API

### Module: `lib/template-processor.js`

Processes and renders templates with variable substitution.

#### `processTemplate(templatePath, outputPath, variables)`

Processes a template file with variable substitution.

**Parameters:**
- `templatePath` (string): Path to template file
- `outputPath` (string): Path to output file
- `variables` (object): Template variables

**Returns:** `Promise<void>`

**Throws:**
- `ValidationError` - If template invalid
- `Error` - If file operations fail

**Example:**
```javascript
import { processTemplate } from './lib/template-processor.js';

await processTemplate(
  '/templates/ui-heavy/Dockerfile',
  '.figma-docker/Dockerfile',
  {
    PROJECT_NAME: 'my-app',
    BUILD_OUTPUT_DIR: 'dist',
    NODE_VERSION: '20'
  }
);
```

#### `substituteVariables(content, variables)`

Replaces template variables in content.

**Parameters:**
- `content` (string): Template content
- `variables` (object): Variables to substitute

**Returns:** `string` - Content with variables replaced

**Example:**
```javascript
const result = substituteVariables(
  'FROM node:{{NODE_VERSION}}',
  { NODE_VERSION: '20' }
);
// 'FROM node:20'
```

## Project Detection API

### Module: `lib/project-detector.js`

Auto-detects project configuration.

#### `detectProjectValues(projectDir = '.')`

Detects project configuration from package.json and config files.

**Parameters:**
- `projectDir` (string): Project directory path

**Returns:** `Promise<object>` - Detected project values
```javascript
{
  PROJECT_NAME: 'my-app',
  FRAMEWORK: 'react-vite',
  TYPESCRIPT: true,
  UI_LIBRARY: 'Material-UI',
  BUILD_OUTPUT_DIR: 'dist',
  DEPENDENCY_COUNT: 42,
  DEV_PORT: 3000,
  PROD_PORT: 8080,
  NGINX_PORT: 8888
}
```

**Example:**
```javascript
import { detectProjectValues } from './lib/project-detector.js';

const values = await detectProjectValues();
console.log('Detected framework:', values.FRAMEWORK);
```

## Port Management API

### Module: `lib/port-manager.js`

Manages port allocation and availability.

#### `checkPortAvailability(port)`

Checks if a port is available.

**Parameters:**
- `port` (number): Port number to check

**Returns:** `Promise<boolean>` - True if available

**Example:**
```javascript
import { checkPortAvailability } from './lib/port-manager.js';

const available = await checkPortAvailability(3000);
if (!available) {
  console.log('Port 3000 is in use');
}
```

#### `findAvailablePort(startPort, maxAttempts = 100)`

Finds an available port starting from a given port.

**Parameters:**
- `startPort` (number): Port to start searching from
- `maxAttempts` (number): Maximum number of ports to try

**Returns:** `Promise<number>` - First available port

**Throws:**
- `Error` - If no available port found

**Example:**
```javascript
const port = await findAvailablePort(3000);
console.log('Using port:', port);
```

#### `assignDynamicPorts()`

Assigns ports for dev, prod, and nginx services.

**Returns:** `Promise<object>` - Assigned ports
```javascript
{
  DEV_PORT: 3000,
  PROD_PORT: 8080,
  NGINX_PORT: 8888
}
```

**Example:**
```javascript
import { assignDynamicPorts } from './lib/port-manager.js';

const ports = await assignDynamicPorts();
```

## Configuration Parsing API

### Module: `lib/config-parser.js`

Parses build tool configuration files.

#### `parseConfig(configPath, pattern)`

Generic config file parser using regex.

**Parameters:**
- `configPath` (string): Path to config file (with or without extension)
- `pattern` (RegExp): Regex pattern to extract value

**Returns:** `Promise<string|null>` - Extracted value or null

**Example:**
```javascript
import { parseConfig } from './lib/config-parser.js';

const outDir = await parseConfig(
  'vite.config',
  /build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/
);
```

#### `parseViteConfig(projectDir)`

Parses Vite configuration for build output directory.

**Parameters:**
- `projectDir` (string): Project directory path

**Returns:** `Promise<string|null>` - Build output directory

#### `parseWebpackConfig(projectDir)`

Parses Webpack configuration for build output directory.

**Parameters:**
- `projectDir` (string): Project directory path

**Returns:** `Promise<string|null>` - Build output directory

#### `detectBuildOutputDir(projectDir)`

Auto-detects build output directory.

**Parameters:**
- `projectDir` (string): Project directory path

**Returns:** `Promise<string|null>` - Detected output directory

**Example:**
```javascript
const outputDir = await detectBuildOutputDir('.');
console.log('Build output:', outputDir || 'dist');
```

## Error Classes

### ValidationError

Custom error for validation failures.

```javascript
import { ValidationError } from 'figma-docker-init';

throw new ValidationError('Invalid port number');
```

### ConfigError

Custom error for configuration issues.

```javascript
import { ConfigError } from 'figma-docker-init';

throw new ConfigError('Missing required field in config.json');
```

## Type Definitions

### ProjectConfig

```typescript
interface ProjectConfig {
  version: string;
  template: string;
  project: {
    name: string;
    framework: string;
    typescript: boolean;
    ui_library: string;
  };
  build: {
    output_dir: string;
    dependency_count: number;
  };
  ports: {
    dev: number;
    prod: number;
    nginx: number;
  };
  paths: {
    dockerfile: string;
    compose: string;
    nginx: string;
    env: string;
  };
  created_at: string;
  updated_at: string;
}
```

### TemplateVariables

```typescript
interface TemplateVariables {
  PROJECT_NAME: string;
  FRAMEWORK: string;
  TYPESCRIPT: boolean;
  UI_LIBRARY: string;
  BUILD_OUTPUT_DIR: string;
  DEPENDENCY_COUNT: number;
  DEV_PORT: number;
  PROD_PORT: number;
  NGINX_PORT: number;
  NODE_VERSION?: string;
}
```

## CLI Arguments

### Command-Line Interface

```bash
figma-docker-init [template] [options]
```

**Arguments:**
- `template` (string): Template name (basic, ui-heavy)

**Options:**
- `-h, --help`: Show help message
- `-v, --version`: Show version number
- `--list`: List available templates
- `--project-dir <dir>`: Custom project directory
- `--force`: Overwrite existing installation
- `--dry-run`: Test without creating files
- `--verbose`: Detailed output

## Environment Variables

### NODE_ENV

Controls logging and error handling behavior.

**Values:**
- `test`: Suppresses non-error logging
- `development`: Verbose logging
- `production`: Minimal logging

**Example:**
```bash
NODE_ENV=development figma-docker-init ui-heavy
```

## See Also

- [Migration Guide](./MIGRATION_GUIDE.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Architecture Overview](./ARCHITECTURE.md)
