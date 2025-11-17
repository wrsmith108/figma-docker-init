/**
 * Project Module - Consolidated
 *
 * Combines path resolution, directory management, and template caching
 * for vibe-to-docker initialization.
 *
 * This module consolidates:
 * - Path resolution and validation
 * - .vibe-docker directory management
 * - Template caching with TTL and LRU eviction
 *
 * @module lib/project
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum path traversal depth for security
 */
const MAX_TRAVERSAL_DEPTH = 10;

/**
 * Project root markers to identify the project directory
 */
const PROJECT_ROOT_MARKERS = [
  'package.json',
  '.git',
  '.vibe-docker',
  'vibe-to-docker.config.js'
];

// ============================================================================
// PATH RESOLUTION FUNCTIONS
// ============================================================================

/**
 * Finds the project root directory by searching for marker files
 *
 * Traverses up the directory tree from the current working directory
 * to find the project root, identified by the presence of marker files
 * like package.json, .git, or .vibe-docker.
 *
 * @param {string} [startPath=process.cwd()] - Starting directory path
 * @returns {string} Absolute path to project root
 * @throws {Error} If project root cannot be found within traversal limit
 *
 * @example
 * const projectRoot = findProjectRoot();
 * console.log(projectRoot); // '/Users/user/my-project'
 */
export function findProjectRoot(startPath = process.cwd()) {
  let currentPath = path.resolve(startPath);
  let depth = 0;

  while (depth < MAX_TRAVERSAL_DEPTH) {
    // Check if any marker file exists in current directory
    const hasMarker = PROJECT_ROOT_MARKERS.some(marker => {
      const markerPath = path.join(currentPath, marker);
      try {
        return fsSync.existsSync(markerPath);
      } catch (error) {
        return false;
      }
    });

    if (hasMarker) {
      return currentPath;
    }

    // Move up one directory
    const parentPath = path.dirname(currentPath);

    // Stop if we've reached the filesystem root
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
    depth++;
  }

  // If no marker found, return the original start path
  // This allows the tool to work in any directory
  return path.resolve(startPath);
}

/**
 * Resolves the .vibe-docker directory path
 *
 * Returns the absolute path to the .vibe-docker directory within
 * the project root. This is where per-project configuration and
 * state files are stored.
 *
 * @param {string} [projectRoot] - Project root path (auto-detected if not provided)
 * @returns {string} Absolute path to .vibe-docker directory
 *
 * @example
 * const vibeDockerPath = getVibeDockerDir();
 * console.log(vibeDockerPath); // '/Users/user/my-project/.vibe-docker'
 */
export function getVibeDockerDir(projectRoot) {
  const root = projectRoot || findProjectRoot();
  return path.join(root, '.vibe-docker');
}

/**
 * Resolves template file paths
 *
 * Converts a template name or relative path to an absolute path.
 * Supports both built-in package templates and custom template paths.
 *
 * @param {string} templateName - Template name or relative path
 * @param {string} [projectRoot] - Project root for custom templates (optional)
 * @returns {string} Absolute path to template file
 *
 * @example
 * // Built-in template from package
 * const template = resolveTemplatePath('basic');
 *
 * // Custom template path
 * const custom = resolveTemplatePath('./my-templates/custom');
 */
export function resolveTemplatePath(templateName, projectRoot) {
  // If template name is an absolute path, return it as-is
  if (path.isAbsolute(templateName)) {
    return templateName;
  }

  // If template name starts with ./ or ../, resolve relative to project root
  if (templateName.startsWith('./') || templateName.startsWith('../')) {
    const root = projectRoot || findProjectRoot();
    return path.resolve(root, templateName);
  }

  // Otherwise, treat as a built-in template from the package's templates directory
  const templatesDir = getTemplatesDir();
  return path.join(templatesDir, templateName);
}

/**
 * Validates a path for security and accessibility
 *
 * Performs security checks to prevent path traversal attacks and
 * ensures the path is within the allowed project boundary.
 *
 * @param {string} targetPath - Path to validate
 * @param {string} [basePath] - Base path boundary (defaults to project root)
 * @returns {string} Normalized absolute path
 * @throws {Error} If path traversal attack detected or path is outside boundary
 *
 * @example
 * try {
 *   const safePath = validatePath('../../../etc/passwd');
 * } catch (error) {
 *   console.error('Path traversal attack detected');
 * }
 */
export function validatePath(targetPath, basePath) {
  const base = basePath || findProjectRoot();

  // Normalize and resolve the path
  const normalized = normalizePath(targetPath);
  const resolved = path.resolve(base, normalized);

  // Ensure the resolved path is within the base path boundary
  const relative = path.relative(base, resolved);

  // Check for path traversal (trying to escape the base directory)
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `Path traversal detected: "${targetPath}" resolves outside project boundary "${base}"`
    );
  }

  return resolved;
}

/**
 * Normalizes a path for cross-platform compatibility
 *
 * Converts path separators to the current platform's format,
 * resolves . and .. segments, and removes redundant separators.
 *
 * @param {string} inputPath - Path to normalize
 * @returns {string} Normalized path with platform-specific separators
 *
 * @example
 * // On Windows
 * normalizePath('src/lib/utils.js'); // 'src\\lib\\utils.js'
 *
 * // On Unix
 * normalizePath('src\\lib\\utils.js'); // 'src/lib/utils.js'
 */
export function normalizePath(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Invalid path: path must be a non-empty string');
  }

  // Convert all separators to platform-specific format
  let normalized = inputPath.replace(/[/\\]/g, path.sep);

  // Use path.normalize to resolve . and .. segments
  normalized = path.normalize(normalized);

  return normalized;
}

/**
 * Resolves a path relative to the project root
 *
 * Converts a relative or absolute path to an absolute path
 * relative to the project root, with security validation.
 *
 * @param {string} relativePath - Path relative to project root
 * @param {string} [projectRoot] - Project root path (auto-detected if not provided)
 * @returns {string} Absolute path
 *
 * @example
 * const configPath = resolveFromRoot('.vibe-docker/config.json');
 */
export function resolveFromRoot(relativePath, projectRoot) {
  const root = projectRoot || findProjectRoot();
  const normalized = normalizePath(relativePath);
  const resolved = path.resolve(root, normalized);
  return validatePath(resolved, root);
}

/**
 * Checks if a path exists and is accessible
 *
 * @param {string} targetPath - Path to check
 * @returns {boolean} True if path exists and is accessible
 *
 * @example
 * if (pathExists('./config.json')) {
 *   console.log('Config file found');
 * }
 */
export function pathExists(targetPath) {
  try {
    fsSync.accessSync(targetPath, fsSync.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the relative path from project root
 *
 * @param {string} targetPath - Absolute path to convert
 * @param {string} [projectRoot] - Project root path (auto-detected if not provided)
 * @returns {string} Relative path from project root
 *
 * @example
 * const rel = getRelativeFromRoot('/Users/user/project/src/index.js');
 * console.log(rel); // 'src/index.js'
 */
export function getRelativeFromRoot(targetPath, projectRoot) {
  const root = projectRoot || findProjectRoot();
  return path.relative(root, targetPath);
}

/**
 * Ensures a directory exists, creating it if necessary
 *
 * @param {string} dirPath - Directory path to ensure
 * @param {string} [projectRoot] - Project root for validation
 * @returns {string} Absolute path to the directory
 * @throws {Error} If path is invalid or cannot be created
 *
 * @example
 * ensureDirectory('.vibe-docker/plugins');
 */
export function ensureDirectory(dirPath, projectRoot) {
  const validated = validatePath(dirPath, projectRoot);

  if (!pathExists(validated)) {
    fsSync.mkdirSync(validated, { recursive: true });
  }

  return validated;
}

/**
 * Gets the templates directory path
 *
 * Returns the absolute path to the templates directory within
 * the vibe-to-docker package installation.
 *
 * @param {string} [packageRoot] - Package root path (where vibe-to-docker is installed)
 * @returns {string} Absolute path to templates directory
 *
 * @example
 * const templatesPath = getTemplatesDir();
 * console.log(templatesPath); // '/path/to/node_modules/vibe-to-docker/templates'
 */
export function getTemplatesDir(packageRoot) {
  // If packageRoot is provided, use it; otherwise find the package root
  // by resolving from this module's location
  if (packageRoot) {
    return path.join(packageRoot, 'templates');
  }

  // Resolve package root from this module's location
  // This file is at: /path/to/package/src/lib/project.js
  // We need: /path/to/package/templates
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentFileDir = path.dirname(currentFilePath);
  const srcLibDir = currentFileDir; // .../src/lib
  const srcDir = path.dirname(srcLibDir); // .../src
  const pkgRoot = path.dirname(srcDir); // package root

  return path.join(pkgRoot, 'templates');
}

// ============================================================================
// DIRECTORY MANAGEMENT CLASS
// ============================================================================

/**
 * Directory Manager for .vibe-docker directory structure
 *
 * Manages the .vibe-docker/ directory structure for per-project installations
 *
 * Directory Structure:
 * .vibe-docker/
 * ├── config.json           # Project-specific configuration
 * ├── templates/            # Custom templates
 * ├── cache/                # Template processing cache
 * ├── docker/               # Docker-specific files
 * │   ├── Dockerfile
 * │   ├── docker-compose.yml
 * │   └── nginx.conf
 * └── logs/                 # Installation and runtime logs
 */
export class DirectoryManager {
  /**
   * Create a new DirectoryManager instance
   * @param {string} projectRoot - Root directory of the project
   */
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.vibeDockerDir = path.join(projectRoot, '.vibe-docker');
    this.backupDir = path.join(this.vibeDockerDir, '.backup');

    // Define directory structure
    this.directories = {
      root: this.vibeDockerDir,
      templates: path.join(this.vibeDockerDir, 'templates'),
      cache: path.join(this.vibeDockerDir, 'cache'),
      docker: path.join(this.vibeDockerDir, 'docker'),
      logs: path.join(this.vibeDockerDir, 'logs'),
      backup: this.backupDir
    };

    // Define required files
    this.requiredFiles = {
      config: path.join(this.vibeDockerDir, 'config.json'),
      gitignore: path.join(this.vibeDockerDir, '.gitignore')
    };
  }

  /**
   * Create the complete .vibe-docker/ directory hierarchy
   * @returns {Promise<Object>} Creation results with status and created paths
   * @throws {Error} If directory creation fails
   */
  async createVibeDockerDirectory() {
    const results = {
      success: false,
      created: [],
      skipped: [],
      errors: []
    };

    try {
      // Check if .vibe-docker already exists
      const exists = await this.exists(this.vibeDockerDir);

      if (exists) {
        const validation = await this.validateDirectory();

        if (validation.isValid) {
          results.skipped.push(this.vibeDockerDir);
          results.success = true;
          return results;
        } else {
          // Backup existing directory if invalid
          await this.backupExistingDirectory();
        }
      }

      // Create all directories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        try {
          await fs.mkdir(dirPath, { recursive: true });

          // Verify directory was created and is writable
          await this.verifyWritePermission(dirPath);

          results.created.push(dirPath);
        } catch (error) {
          const errorMsg = `Failed to create directory ${name}: ${error.message}`;
          results.errors.push(errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Create default configuration file
      await this.createDefaultConfig();
      results.created.push(this.requiredFiles.config);

      // Create .gitignore for cache and logs
      await this.createGitignore();
      results.created.push(this.requiredFiles.gitignore);

      // Create README for the directory
      await this.createReadme();
      results.created.push(path.join(this.vibeDockerDir, 'README.md'));

      results.success = true;
      return results;

    } catch (error) {
      // Cleanup on failure
      await this.cleanupOnFailure(results.created);
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  }

  /**
   * Validate existing .vibe-docker/ directory structure
   * @returns {Promise<Object>} Validation results
   */
  async validateDirectory() {
    const validation = {
      isValid: true,
      exists: false,
      writable: false,
      hasCorrectStructure: false,
      missingDirectories: [],
      permissionIssues: [],
      conflicts: []
    };

    try {
      // Check if directory exists
      validation.exists = await this.exists(this.vibeDockerDir);

      if (!validation.exists) {
        validation.isValid = false;
        return validation;
      }

      // Check write permissions
      try {
        await this.verifyWritePermission(this.vibeDockerDir);
        validation.writable = true;
      } catch (error) {
        validation.writable = false;
        validation.permissionIssues.push(this.vibeDockerDir);
        validation.isValid = false;
      }

      // Check for required subdirectories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        if (name === 'backup') continue; // Backup is optional

        const exists = await this.exists(dirPath);

        if (!exists) {
          validation.missingDirectories.push(dirPath);
        } else {
          // Check write permissions for existing directories
          try {
            await this.verifyWritePermission(dirPath);
          } catch (error) {
            validation.permissionIssues.push(dirPath);
            validation.isValid = false;
          }
        }
      }

      // Directory structure is correct if no missing directories
      validation.hasCorrectStructure = validation.missingDirectories.length === 0;

      // Check for conflicting files
      const conflicts = await this.detectConflicts();
      validation.conflicts = conflicts;

      if (conflicts.length > 0) {
        validation.isValid = false;
      }

      // Overall validation passes if writable and no conflicts
      validation.isValid = validation.writable &&
                          validation.conflicts.length === 0 &&
                          validation.permissionIssues.length === 0;

      return validation;

    } catch (error) {
      validation.isValid = false;
      validation.errors = [error.message];
      return validation;
    }
  }

  /**
   * Cleanup on installation failure - rollback mechanism
   * @param {Array<string>} createdPaths - Paths that were created during failed installation
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOnFailure(createdPaths = []) {
    const results = {
      success: false,
      removed: [],
      errors: []
    };

    try {
      // Remove created paths in reverse order
      for (const dirPath of createdPaths.reverse()) {
        try {
          const stats = await fs.stat(dirPath);

          if (stats.isDirectory()) {
            await fs.rm(dirPath, { recursive: true, force: true });
          } else {
            await fs.unlink(dirPath);
          }

          results.removed.push(dirPath);
        } catch (error) {
          results.errors.push(`Failed to remove ${dirPath}: ${error.message}`);
        }
      }

      // Remove main .vibe-docker directory if it's now empty
      try {
        const files = await fs.readdir(this.vibeDockerDir);

        if (files.length === 0) {
          await fs.rmdir(this.vibeDockerDir);
          results.removed.push(this.vibeDockerDir);
        }
      } catch (error) {
        // Directory might not exist, which is fine
      }

      // Restore backup if it exists
      if (await this.exists(this.backupDir)) {
        await this.restoreFromBackup();
      }

      results.success = results.errors.length === 0;
      return results;

    } catch (error) {
      results.errors.push(`Cleanup failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Detect legacy global installation
   * @returns {Promise<Object>} Detection results
   */
  async detectLegacyInstallation() {
    const detection = {
      hasLegacyInstallation: false,
      legacyPath: null,
      legacyType: null,
      migrationRequired: false,
      migrationPath: null
    };

    try {
      // Check common legacy installation locations
      const legacyPaths = [
        path.join(os.homedir(), '.vibe-docker'),
        path.join(os.homedir(), '.config', 'figma-docker'),
        '/usr/local/lib/vibe-docker',
        '/opt/vibe-docker'
      ];

      for (const legacyPath of legacyPaths) {
        if (await this.exists(legacyPath)) {
          detection.hasLegacyInstallation = true;
          detection.legacyPath = legacyPath;
          detection.legacyType = this.determineLegacyType(legacyPath);
          detection.migrationRequired = true;
          detection.migrationPath = this.vibeDockerDir;
          break;
        }
      }

      // Check for legacy config in npm global directory
      try {
        const { stdout } = await import('child_process')
          .then(cp => {
            return new Promise((resolve, reject) => {
              cp.exec('npm root -g', (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve({ stdout, stderr });
              });
            });
          });

        const npmGlobalRoot = stdout.trim();
        const npmLegacyPath = path.join(npmGlobalRoot, 'vibe-to-docker');

        if (await this.exists(npmLegacyPath)) {
          detection.hasLegacyInstallation = true;
          detection.legacyPath = npmLegacyPath;
          detection.legacyType = 'npm-global';
          detection.migrationRequired = true;
        }
      } catch (error) {
        // npm not available or command failed, skip
      }

      return detection;

    } catch (error) {
      detection.error = error.message;
      return detection;
    }
  }

  /**
   * Get directory structure information
   * @returns {Promise<Object>} Directory structure details
   */
  async getDirectoryInfo() {
    const info = {
      projectRoot: this.projectRoot,
      vibeDockerDir: this.vibeDockerDir,
      exists: false,
      size: 0,
      directories: {},
      files: {}
    };

    try {
      info.exists = await this.exists(this.vibeDockerDir);

      if (!info.exists) {
        return info;
      }

      // Get size of .vibe-docker directory
      info.size = await this.getDirectorySize(this.vibeDockerDir);

      // Get info for each subdirectory
      for (const [name, dirPath] of Object.entries(this.directories)) {
        const exists = await this.exists(dirPath);

        info.directories[name] = {
          path: dirPath,
          exists,
          size: exists ? await this.getDirectorySize(dirPath) : 0
        };
      }

      // Get info for required files
      for (const [name, filePath] of Object.entries(this.requiredFiles)) {
        const exists = await this.exists(filePath);

        info.files[name] = {
          path: filePath,
          exists,
          size: exists ? (await fs.stat(filePath)).size : 0
        };
      }

      return info;

    } catch (error) {
      info.error = error.message;
      return info;
    }
  }

  /**
   * Create default configuration file
   * @private
   */
  async createDefaultConfig() {
    const config = {
      version: '2.0.0',
      projectRoot: this.projectRoot,
      createdAt: new Date().toISOString(),
      framework: null,
      template: null,
      docker: {
        compose: {
          version: '3.8',
          projectName: path.basename(this.projectRoot)
        }
      },
      paths: {
        templates: './templates',
        cache: './cache',
        docker: './docker',
        logs: './logs'
      }
    };

    await fs.writeFile(
      this.requiredFiles.config,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  }

  /**
   * Create .gitignore for cache and logs
   * @private
   */
  async createGitignore() {
    const gitignoreContent = `# Vibe Docker Init - Generated files
cache/
logs/
.backup/
*.log

# Keep templates and docker configs in version control
!templates/
!docker/
`;

    await fs.writeFile(
      this.requiredFiles.gitignore,
      gitignoreContent,
      'utf8'
    );
  }

  /**
   * Create README for the .vibe-docker directory
   * @private
   */
  async createReadme() {
    const readmeContent = `# Vibe Docker Configuration

This directory contains the Docker configuration for this project, generated by \`vibe-to-docker\`.

## Directory Structure

- **templates/**: Custom Docker templates for this project
- **cache/**: Template processing cache (not committed to git)
- **docker/**: Generated Docker configuration files
  - Dockerfile
  - docker-compose.yml
  - nginx.conf
- **logs/**: Installation and runtime logs (not committed to git)
- **config.json**: Project-specific configuration

## Usage

To rebuild the Docker configuration:
\`\`\`bash
npx vibe-to-docker
\`\`\`

To start the Docker containers:
\`\`\`bash
npm run docker:up
\`\`\`

## Documentation

For more information, see: https://github.com/wrsmith108/vibe-to-docker
`;

    await fs.writeFile(
      path.join(this.vibeDockerDir, 'README.md'),
      readmeContent,
      'utf8'
    );
  }

  /**
   * Backup existing directory before modification
   * @private
   */
  async backupExistingDirectory() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, timestamp);

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Copy all files except backup directory
      await this.copyDirectory(this.vibeDockerDir, backupPath, ['.backup']);

      return backupPath;
    } catch (error) {
      throw new Error(`Failed to backup existing directory: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   * @private
   */
  async restoreFromBackup() {
    try {
      // Find most recent backup
      const backups = await fs.readdir(this.backupDir);

      if (backups.length === 0) {
        return;
      }

      const latestBackup = backups.sort().reverse()[0];
      const backupPath = path.join(this.backupDir, latestBackup);

      // Remove current directory (except backup)
      const files = await fs.readdir(this.vibeDockerDir);

      for (const file of files) {
        if (file === '.backup') continue;

        const filePath = path.join(this.vibeDockerDir, file);
        await fs.rm(filePath, { recursive: true, force: true });
      }

      // Restore from backup
      await this.copyDirectory(backupPath, this.vibeDockerDir);

    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Check if path exists
   * @private
   */
  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify write permissions for a directory
   * @private
   */
  async verifyWritePermission(dirPath) {
    const testFile = path.join(dirPath, `.test-${Date.now()}`);

    try {
      await fs.writeFile(testFile, 'test', 'utf8');
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      throw new Error(`No write permission for ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Detect conflicting files
   * @private
   */
  async detectConflicts() {
    const conflicts = [];

    try {
      // Check for files that should be directories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        if (name === 'backup') continue;

        if (await this.exists(dirPath)) {
          const stats = await fs.stat(dirPath);

          if (!stats.isDirectory()) {
            conflicts.push({
              path: dirPath,
              type: 'file-instead-of-directory',
              message: `Expected directory but found file: ${dirPath}`
            });
          }
        }
      }

      return conflicts;

    } catch (error) {
      return conflicts;
    }
  }

  /**
   * Determine legacy installation type
   * @private
   */
  determineLegacyType(legacyPath) {
    if (legacyPath.includes(os.homedir())) {
      return 'user-global';
    } else if (legacyPath.startsWith('/usr/local')) {
      return 'system-global';
    } else if (legacyPath.startsWith('/opt')) {
      return 'system-opt';
    }
    return 'unknown';
  }

  /**
   * Get size of directory recursively
   * @private
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Copy directory recursively
   * @private
   */
  async copyDirectory(src, dest, exclude = []) {
    await fs.mkdir(dest, { recursive: true });

    const files = await fs.readdir(src, { withFileTypes: true });

    for (const file of files) {
      if (exclude.includes(file.name)) continue;

      const srcPath = path.join(src, file.name);
      const destPath = path.join(dest, file.name);

      if (file.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, exclude);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

// ============================================================================
// TEMPLATE CACHE CLASS
// ============================================================================

/**
 * Template Cache Manager
 *
 * Purpose: Cache template processing results for 50%+ speed improvement
 * Handles: In-memory caching, invalidation, TTL management
 */
export class TemplateCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
    this.maxSize = 100; // Maximum number of cached entries
  }

  /**
   * Generates a cache key from template path and variables
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @returns {string} Cache key
   */
  generateKey(templatePath, variables) {
    const data = JSON.stringify({ templatePath, variables });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Gets the modification time of a file
   * @param {string} filePath - Path to file
   * @returns {number} Modification time in milliseconds
   */
  getFileModTime(filePath) {
    try {
      const stats = fsSync.statSync(filePath);
      return stats.mtimeMs;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Checks if a cache entry is valid
   * @param {Object} entry - Cache entry
   * @param {string} templatePath - Path to template file
   * @returns {boolean} True if entry is valid
   */
  isValid(entry, templatePath) {
    const now = Date.now();

    // Check TTL
    if (now - entry.timestamp > this.ttl) {
      return false;
    }

    // Check if template file has been modified
    const currentModTime = this.getFileModTime(templatePath);
    if (currentModTime !== entry.modTime) {
      return false;
    }

    return true;
  }

  /**
   * Gets a cached template result
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @returns {string|null} Cached result or null if not found/invalid
   */
  get(templatePath, variables) {
    const key = this.generateKey(templatePath, variables);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (!this.isValid(entry, templatePath)) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.content;
  }

  /**
   * Stores a template result in cache
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @param {string} content - Processed content
   */
  set(templatePath, variables, content) {
    // Enforce max cache size using LRU strategy
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(templatePath, variables);
    const entry = {
      content,
      timestamp: Date.now(),
      modTime: this.getFileModTime(templatePath),
      hits: 0
    };

    this.cache.set(key, entry);
  }

  /**
   * Evicts the least recently used entry
   */
  evictLRU() {
    let lruKey = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Invalidates cache entries for a specific template
   * @param {string} templatePath - Path to template file
   */
  invalidate(templatePath) {
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      // Check if entry is for this template by comparing mod times
      const currentModTime = this.getFileModTime(templatePath);
      if (entry.modTime !== currentModTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    let totalHits = 0;
    let entries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      entries++;
    }

    return {
      entries,
      maxSize: this.maxSize,
      totalHits,
      averageHits: entries > 0 ? totalHits / entries : 0,
      ttl: this.ttl
    };
  }

  /**
   * Sets the TTL for cache entries
   * @param {number} ttlMs - TTL in milliseconds
   */
  setTTL(ttlMs) {
    this.ttl = ttlMs;
  }

  /**
   * Sets the maximum cache size
   * @param {number} size - Maximum number of entries
   */
  setMaxSize(size) {
    this.maxSize = size;
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Ensure .vibe-docker directory structure exists (synchronous wrapper)
 *
 * Creates the .vibe-docker directory structure for the project.
 * This is a simplified synchronous version for immediate directory creation.
 *
 * @param {string} projectRoot - Project root directory path
 * @returns {Object} Directory structure paths
 * @throws {Error} If directory creation fails
 *
 * @example
 * const dirs = ensureVibeDockerStructure('/path/to/project');
 * console.log(dirs.root); // '/path/to/project/.vibe-docker'
 */
export function ensureVibeDockerStructure(projectRoot) {
  const manager = new DirectoryManager(projectRoot);

  // Create all required directories synchronously
  for (const [name, dirPath] of Object.entries(manager.directories)) {
    if (!fsSync.existsSync(dirPath)) {
      fsSync.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Return directory structure
  return manager.directories;
}

// Export singleton template cache instance
export const templateCache = new TemplateCache();

// Backward compatibility aliases
export const findProjectRootAlias = findProjectRoot;
export const getVibeDockerDirAlias = getVibeDockerDir;
