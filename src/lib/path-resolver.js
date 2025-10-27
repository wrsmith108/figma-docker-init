/**
 * Path Resolver Module
 *
 * Provides cross-platform path resolution and validation for figma-docker-init.
 * Handles project root detection, template paths, and security validation.
 *
 * @module lib/path-resolver
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Maximum path traversal depth for security
 * @constant {number}
 */
const MAX_TRAVERSAL_DEPTH = 10;

/**
 * Project root markers to identify the project directory
 * @constant {string[]}
 */
const PROJECT_ROOT_MARKERS = [
  'package.json',
  '.git',
  '.figma-docker',
  'figma-docker-init.config.js'
];

/**
 * Resolves the project root directory by searching for marker files
 *
 * Traverses up the directory tree from the current working directory
 * to find the project root, identified by the presence of marker files
 * like package.json, .git, or .figma-docker.
 *
 * @param {string} [startPath=process.cwd()] - Starting directory path
 * @returns {string} Absolute path to project root
 * @throws {Error} If project root cannot be found within traversal limit
 *
 * @example
 * const projectRoot = resolveProjectRoot();
 * console.log(projectRoot); // '/Users/user/my-project'
 */
function resolveProjectRoot(startPath = process.cwd()) {
  let currentPath = path.resolve(startPath);
  let depth = 0;

  while (depth < MAX_TRAVERSAL_DEPTH) {
    // Check if any marker file exists in current directory
    const hasMarker = PROJECT_ROOT_MARKERS.some(marker => {
      const markerPath = path.join(currentPath, marker);
      try {
        return fs.existsSync(markerPath);
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
 * Resolves the .figma-docker directory path
 *
 * Returns the absolute path to the .figma-docker directory within
 * the project root. This is where per-project configuration and
 * state files are stored.
 *
 * @param {string} [projectRoot] - Project root path (auto-detected if not provided)
 * @returns {string} Absolute path to .figma-docker directory
 *
 * @example
 * const figmaDockerPath = resolveFigmaDockerPath();
 * console.log(figmaDockerPath); // '/Users/user/my-project/.figma-docker'
 */
function resolveFigmaDockerPath(projectRoot) {
  const root = projectRoot || resolveProjectRoot();
  return path.join(root, '.figma-docker');
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
function resolveTemplatePath(templateName, projectRoot) {
  // If template name is an absolute path, return it as-is
  if (path.isAbsolute(templateName)) {
    return templateName;
  }

  // If template name starts with ./ or ../, resolve relative to project root
  if (templateName.startsWith('./') || templateName.startsWith('../')) {
    const root = projectRoot || resolveProjectRoot();
    return path.resolve(root, templateName);
  }

  // Otherwise, treat as a built-in template from the package's templates directory
  const templatesDir = getTemplatesDir();
  const templatePath = path.join(templatesDir, templateName);
  return templatePath;
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
function validatePath(targetPath, basePath) {
  const base = basePath || resolveProjectRoot();

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
function normalizePath(inputPath) {
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
 * const configPath = resolveFromRoot('.figma-docker/config.json');
 */
function resolveFromRoot(relativePath, projectRoot) {
  const root = projectRoot || resolveProjectRoot();
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
function pathExists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
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
function getRelativeFromRoot(targetPath, projectRoot) {
  const root = projectRoot || resolveProjectRoot();
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
 * ensureDirectory('.figma-docker/plugins');
 */
function ensureDirectory(dirPath, projectRoot) {
  const validated = validatePath(dirPath, projectRoot);

  if (!pathExists(validated)) {
    fs.mkdirSync(validated, { recursive: true });
  }

  return validated;
}

/**
 * Gets the templates directory path
 *
 * Returns the absolute path to the templates directory within
 * the figma-docker-init package installation.
 *
 * @param {string} [packageRoot] - Package root path (where figma-docker-init is installed)
 * @returns {string} Absolute path to templates directory
 *
 * @example
 * const templatesPath = getTemplatesDir();
 * console.log(templatesPath); // '/path/to/node_modules/figma-docker-init/templates'
 */
function getTemplatesDir(packageRoot) {
  // If packageRoot is provided, use it; otherwise find the package root
  // by resolving from this module's location
  if (packageRoot) {
    return path.join(packageRoot, 'templates');
  }

  // Resolve package root from this module's location
  // This file is at: /path/to/package/src/lib/path-resolver.js
  // We need: /path/to/package/templates
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentFileDir = path.dirname(currentFilePath);
  const srcLibDir = currentFileDir; // .../src/lib
  const srcDir = path.dirname(srcLibDir); // .../src
  const pkgRoot = path.dirname(srcDir); // package root

  return path.join(pkgRoot, 'templates');
}

// Export functions with both original and alias names for compatibility
export {
  resolveProjectRoot,
  resolveFigmaDockerPath,
  resolveTemplatePath,
  validatePath,
  normalizePath,
  resolveFromRoot,
  pathExists,
  getRelativeFromRoot,
  ensureDirectory,
  getTemplatesDir,
  // Aliases for backward compatibility with main file imports
  resolveProjectRoot as findProjectRoot,
  resolveFigmaDockerPath as getFigmaDockerDir
};
