/**
 * Package Fixer Utility
 *
 * Validates and fixes common package.json issues for AI-generated projects.
 * Ensures TypeScript projects have required type definitions.
 *
 * @module lib/package-fixer
 */

import fs from 'fs/promises';
import path from 'path';
import { readPackageJson } from './package-reader.js';

/**
 * Check if project is using TypeScript
 *
 * @param {Object} pkg - Parsed package.json object
 * @returns {boolean} True if project uses TypeScript
 */
function isTypeScriptProject(pkg) {
  // Check for TypeScript in devDependencies
  if (pkg.devDependencies?.typescript) {
    return true;
  }

  // Check for TypeScript in dependencies (rare but possible)
  if (pkg.dependencies?.typescript) {
    return true;
  }

  // Check for tsconfig.json indicator in scripts
  const scripts = pkg.scripts || {};
  for (const script of Object.values(scripts)) {
    if (script.includes('tsc') || script.includes('typescript')) {
      return true;
    }
  }

  return false;
}

/**
 * Check if React types are installed
 *
 * @param {Object} pkg - Parsed package.json object
 * @returns {Object} Status of React type definitions
 */
function checkReactTypes(pkg) {
  const hasReact = !!(pkg.dependencies?.react || pkg.devDependencies?.react);
  const hasReactDom = !!(pkg.dependencies?.['react-dom'] || pkg.devDependencies?.['react-dom']);
  const hasReactTypes = !!(pkg.devDependencies?.['@types/react']);
  const hasReactDomTypes = !!(pkg.devDependencies?.['@types/react-dom']);

  return {
    hasReact,
    hasReactDom,
    hasReactTypes,
    hasReactDomTypes,
    needsReactTypes: hasReact && !hasReactTypes,
    needsReactDomTypes: hasReactDom && !hasReactDomTypes
  };
}

/**
 * Get appropriate @types version based on React version
 *
 * @param {string} reactVersion - React version string (e.g., '^18.2.0')
 * @returns {string} Appropriate @types version
 */
function getTypesVersion(reactVersion) {
  if (!reactVersion) {
    return '^18.2.0'; // Default to React 18 types
  }

  // Extract major version
  const match = reactVersion.match(/\^?(\d+)/);
  const majorVersion = match ? match[1] : '18';

  // Map React versions to @types versions
  const versionMap = {
    '19': '^19.0.0',
    '18': '^18.2.0',
    '17': '^17.0.0',
    '16': '^16.9.0'
  };

  return versionMap[majorVersion] || '^18.2.0';
}

/**
 * Validate package.json for common AI-generated project issues
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<Object>} Validation results with issues array
 *
 * @example
 * const validation = await validatePackageJson('/path/to/project');
 * if (!validation.valid) {
 *   console.log('Issues found:', validation.issues);
 * }
 */
export async function validatePackageJson(projectRoot) {
  const issues = [];
  const fixes = [];

  try {
    const pkg = await readPackageJson(projectRoot);

    // Check if TypeScript project
    const isTS = isTypeScriptProject(pkg);

    if (isTS) {
      // Check React types
      const reactTypes = checkReactTypes(pkg);

      if (reactTypes.needsReactTypes) {
        const reactVersion = pkg.dependencies?.react || pkg.devDependencies?.react;
        const typesVersion = getTypesVersion(reactVersion);

        issues.push({
          type: 'missing_types',
          severity: 'warning',
          package: '@types/react',
          message: 'TypeScript project is missing @types/react',
          fix: {
            action: 'add_dev_dependency',
            package: '@types/react',
            version: typesVersion
          }
        });

        fixes.push(`npm install --save-dev @types/react@${typesVersion}`);
      }

      if (reactTypes.needsReactDomTypes) {
        const reactDomVersion = pkg.dependencies?.['react-dom'] || pkg.devDependencies?.['react-dom'];
        const typesVersion = getTypesVersion(reactDomVersion);

        issues.push({
          type: 'missing_types',
          severity: 'warning',
          package: '@types/react-dom',
          message: 'TypeScript project is missing @types/react-dom',
          fix: {
            action: 'add_dev_dependency',
            package: '@types/react-dom',
            version: typesVersion
          }
        });

        fixes.push(`npm install --save-dev @types/react-dom@${typesVersion}`);
      }
    }

    return {
      valid: issues.length === 0,
      isTypeScript: isTS,
      issues,
      fixes,
      suggestions: fixes.length > 0 ? [
        'Run the following commands to fix missing TypeScript types:',
        ...fixes
      ] : []
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      issues: [{
        type: 'read_error',
        severity: 'error',
        message: `Failed to read package.json: ${error.message}`
      }],
      fixes: [],
      suggestions: []
    };
  }
}

/**
 * Auto-fix package.json issues by adding missing dependencies
 *
 * @param {string} projectRoot - Root directory of the project
 * @param {Object} options - Fix options
 * @param {boolean} options.dryRun - If true, only return changes without applying
 * @param {boolean} options.backup - If true, create backup before modifying
 * @returns {Promise<Object>} Fix results
 *
 * @example
 * const result = await fixPackageJson('/path/to/project');
 * console.log('Applied fixes:', result.applied);
 */
export async function fixPackageJson(projectRoot, options = {}) {
  const { dryRun = false, backup = true } = options;
  const validation = await validatePackageJson(projectRoot);

  if (validation.valid) {
    return {
      fixed: false,
      message: 'No issues found',
      applied: []
    };
  }

  const packagePath = path.join(projectRoot, 'package.json');
  let pkg;

  try {
    pkg = await readPackageJson(projectRoot);
  } catch (error) {
    return {
      fixed: false,
      error: `Failed to read package.json: ${error.message}`,
      applied: []
    };
  }

  // Create backup if requested
  if (backup && !dryRun) {
    const backupPath = path.join(projectRoot, 'package.json.backup');
    await fs.copyFile(packagePath, backupPath);
  }

  // Apply fixes
  const applied = [];
  for (const issue of validation.issues) {
    if (issue.fix && issue.fix.action === 'add_dev_dependency') {
      if (!pkg.devDependencies) {
        pkg.devDependencies = {};
      }

      pkg.devDependencies[issue.fix.package] = issue.fix.version;
      applied.push({
        package: issue.fix.package,
        version: issue.fix.version,
        type: 'devDependency'
      });
    }
  }

  if (applied.length === 0) {
    return {
      fixed: false,
      message: 'No fixable issues found',
      applied: []
    };
  }

  // Write updated package.json if not dry run
  if (!dryRun) {
    await fs.writeFile(
      packagePath,
      JSON.stringify(pkg, null, 2) + '\n',
      'utf8'
    );
  }

  return {
    fixed: true,
    dryRun,
    message: `Added ${applied.length} missing dependencies`,
    applied,
    nextSteps: ['Run npm install to install the new dependencies']
  };
}

/**
 * Check if package.json needs fixing without applying changes
 *
 * @param {string} projectRoot - Root directory of the project
 * @returns {Promise<boolean>} True if fixes are needed
 */
export async function needsFixing(projectRoot) {
  const validation = await validatePackageJson(projectRoot);
  return !validation.valid && validation.fixes.length > 0;
}

export default {
  validatePackageJson,
  fixPackageJson,
  needsFixing,
  checkReactTypes,
  isTypeScriptProject
};
