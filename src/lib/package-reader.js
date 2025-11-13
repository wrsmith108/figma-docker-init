/**
 * Package Reader Utility
 *
 * Reads and parses package.json files from projects.
 * Provides helper functions for safe, cached reading of package metadata.
 *
 * @module lib/package-reader
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Reads and parses package.json from a project root
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Parsed package.json object
 * @throws {Error} If package.json not found or invalid
 *
 * @example
 * const pkg = await readPackageJson('/path/to/project');
 * console.log(pkg.name); // 'my-project'
 */
export async function readPackageJson(projectRoot) {
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(packagePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`package.json not found in ${projectRoot}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in package.json: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Safely reads package.json with fallback
 *
 * Returns an empty object if package.json is missing,
 * useful for graceful degradation.
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Parsed package.json or empty object
 *
 * @example
 * const pkg = await readPackageJsonSafe('/path/to/project');
 * const version = pkg.version || '0.0.0';
 */
export async function readPackageJsonSafe(projectRoot) {
  try {
    return await readPackageJson(projectRoot);
  } catch (error) {
    return {};
  }
}

/**
 * Checks if a dependency is installed
 *
 * Checks both dependencies and devDependencies
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} packageName - Name of the package to check
 * @returns {Promise<boolean>} True if package is installed
 *
 * @example
 * const hasReact = await hasDependency('/path/to/project', 'react');
 */
export async function hasDependency(projectRoot, packageName) {
  try {
    const pkg = await readPackageJson(projectRoot);
    return !!(
      pkg.dependencies?.[packageName] ||
      pkg.devDependencies?.[packageName]
    );
  } catch (error) {
    return false;
  }
}

/**
 * Gets dependency version string
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {string} packageName - Name of the package
 * @returns {Promise<string|null>} Version string or null if not found
 *
 * @example
 * const version = await getDependencyVersion('/path/to/project', 'react');
 * console.log(version); // '^18.2.0'
 */
export async function getDependencyVersion(projectRoot, packageName) {
  try {
    const pkg = await readPackageJson(projectRoot);
    return pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName] || null;
  } catch (error) {
    return null;
  }
}

/**
 * Gets all dependencies matching a pattern
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {RegExp|string} pattern - Pattern to match dependency names
 * @returns {Promise<Object>} Matched dependencies with versions
 *
 * @example
 * const ngDeps = await getDependenciesMatching('/path/to/project', /@angular/);
 * // Returns { '@angular/core': '^15.0.0', '@angular/common': '^15.0.0' }
 */
export async function getDependenciesMatching(projectRoot, pattern) {
  try {
    const pkg = await readPackageJson(projectRoot);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const matched = {};

    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    for (const [name, version] of Object.entries(allDeps)) {
      if (regex.test(name)) {
        matched[name] = version;
      }
    }

    return matched;
  } catch (error) {
    return {};
  }
}
