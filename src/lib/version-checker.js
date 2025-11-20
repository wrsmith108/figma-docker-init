#!/usr/bin/env node

/**
 * Version Compatibility Checker
 *
 * Detects version mismatches in AI-generated projects, particularly:
 * - Angular version incompatibilities between core and build tools
 * - Node.js odd-numbered versions (not LTS)
 * - Dependency version conflicts
 *
 * This addresses a common failure pattern in Bolt-generated projects
 * where @angular/build and @angular/core versions diverge.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check Node.js version and warn if using odd-numbered version
 */
export function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1), 10);

  const warnings = [];

  // Odd-numbered versions don't enter LTS
  if (majorVersion % 2 !== 0) {
    warnings.push({
      type: 'node_version',
      severity: 'warning',
      message: `Node.js ${nodeVersion} detected (odd-numbered version)`,
      detail: 'Odd-numbered Node.js versions will not enter LTS status and should not be used for production.',
      recommendation: `Use an even-numbered LTS version (e.g., v20.x, v22.x)`,
      learnMore: 'https://nodejs.org/en/about/previous-releases/'
    });
  }

  return {
    version: nodeVersion,
    majorVersion,
    isLTS: majorVersion % 2 === 0,
    warnings
  };
}

/**
 * Check Angular version compatibility
 * @param {string} projectRoot - Project root directory
 */
export async function checkAngularVersions(projectRoot) {
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const warnings = [];

    // Check if this is an Angular project
    if (!deps['@angular/core']) {
      return { isAngular: false, warnings: [] };
    }

    // Extract versions
    const coreVersion = deps['@angular/core'];
    const buildVersion = deps['@angular/build'];
    const cliVersion = deps['@angular/cli'];

    if (!coreVersion) {
      return { isAngular: false, warnings: [] };
    }

    // Parse major versions
    const coreMajor = extractMajorVersion(coreVersion);
    const buildMajor = buildVersion ? extractMajorVersion(buildVersion) : null;
    const cliMajor = cliVersion ? extractMajorVersion(cliVersion) : null;

    // Check for version mismatches
    if (buildMajor && buildMajor !== coreMajor) {
      warnings.push({
        type: 'angular_version_mismatch',
        severity: 'error',
        message: `Angular version mismatch detected`,
        detail: `@angular/core is v${coreMajor} but @angular/build expects v${buildMajor}`,
        current: {
          core: coreVersion,
          build: buildVersion
        },
        recommendation: 'Run Angular update migration',
        fixCommand: `npx @angular/cli@latest update @angular/core@${buildMajor} @angular/cli@${buildMajor}`,
        learnMore: 'https://update.angular.dev/'
      });
    }

    if (cliMajor && cliMajor !== coreMajor) {
      warnings.push({
        type: 'angular_cli_mismatch',
        severity: 'warning',
        message: `Angular CLI version mismatch`,
        detail: `@angular/core is v${coreMajor} but @angular/cli is v${cliMajor}`,
        current: {
          core: coreVersion,
          cli: cliVersion
        },
        recommendation: 'Update Angular CLI to match core version',
        fixCommand: `npm install --save-dev @angular/cli@${coreMajor}`
      });
    }

    return {
      isAngular: true,
      versions: {
        core: coreVersion,
        build: buildVersion,
        cli: cliVersion
      },
      majorVersions: {
        core: coreMajor,
        build: buildMajor,
        cli: cliMajor
      },
      warnings
    };
  } catch (error) {
    return {
      isAngular: false,
      warnings: [],
      error: error.message
    };
  }
}

/**
 * Extract major version from semver string
 * @param {string} version - Version string (e.g., "^17.3.12", "~19.0.0")
 */
function extractMajorVersion(version) {
  if (!version) return null;

  // Remove semver prefixes (^, ~, >=, etc.)
  const cleanVersion = version.replace(/^[\^~>=<]+/, '');

  // Extract major version
  const match = cleanVersion.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check for dependency conflicts in package.json
 * @param {string} projectRoot - Project root directory
 */
export async function checkDependencyConflicts(projectRoot) {
  try {
    const packagePath = path.join(projectRoot, 'package.json');
    const content = await fs.readFile(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    const warnings = [];
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};

    // Check for duplicate dependencies
    const duplicates = Object.keys(deps).filter(key => key in devDeps);

    if (duplicates.length > 0) {
      warnings.push({
        type: 'duplicate_dependencies',
        severity: 'warning',
        message: `${duplicates.length} dependencies listed in both dependencies and devDependencies`,
        detail: `Packages: ${duplicates.join(', ')}`,
        recommendation: 'Move production dependencies to dependencies, dev-only to devDependencies',
        packages: duplicates
      });
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
      warnings
    };
  } catch (error) {
    return {
      hasDuplicates: false,
      duplicates: [],
      warnings: [],
      error: error.message
    };
  }
}

/**
 * Run all version checks
 * @param {string} projectRoot - Project root directory
 */
export async function runAllChecks(projectRoot) {
  const results = {
    node: checkNodeVersion(),
    angular: await checkAngularVersions(projectRoot),
    dependencies: await checkDependencyConflicts(projectRoot)
  };

  // Collect all warnings
  const allWarnings = [
    ...results.node.warnings,
    ...results.angular.warnings,
    ...results.dependencies.warnings
  ];

  // Sort by severity (errors first, then warnings)
  allWarnings.sort((a, b) => {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    ...results,
    allWarnings,
    hasErrors: allWarnings.some(w => w.severity === 'error'),
    hasWarnings: allWarnings.some(w => w.severity === 'warning')
  };
}

/**
 * Format warnings for console output
 */
export function formatWarnings(warnings) {
  if (warnings.length === 0) {
    return '';
  }

  let output = '\n⚠️  Version Compatibility Warnings:\n';
  output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  warnings.forEach((warning, index) => {
    const icon = warning.severity === 'error' ? '❌' : '⚠️';
    output += `${icon} ${warning.message}\n`;
    if (warning.detail) {
      output += `   ${warning.detail}\n`;
    }
    if (warning.recommendation) {
      output += `   💡 ${warning.recommendation}\n`;
    }
    if (warning.fixCommand) {
      output += `   🔧 Fix: ${warning.fixCommand}\n`;
    }
    if (warning.learnMore) {
      output += `   📖 Learn more: ${warning.learnMore}\n`;
    }
    if (index < warnings.length - 1) {
      output += '\n';
    }
  });

  output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  return output;
}

/**
 * Main entry point for CLI usage
 */
async function main() {
  const projectRoot = process.argv[2] || process.cwd();

  console.log('🔍 Running version compatibility checks...\n');

  const results = await runAllChecks(projectRoot);

  // Display Node.js version
  console.log(`Node.js: ${results.node.version} ${results.node.isLTS ? '✅ (LTS)' : '⚠️  (Not LTS)'}`);

  // Display Angular versions if applicable
  if (results.angular.isAngular) {
    console.log('\nAngular Versions:');
    console.log(`  @angular/core: ${results.angular.versions.core}`);
    if (results.angular.versions.build) {
      console.log(`  @angular/build: ${results.angular.versions.build}`);
    }
    if (results.angular.versions.cli) {
      console.log(`  @angular/cli: ${results.angular.versions.cli}`);
    }
  }

  // Display warnings
  if (results.allWarnings.length > 0) {
    console.log(formatWarnings(results.allWarnings));
  } else {
    console.log('\n✅ No version compatibility issues detected!\n');
  }

  // Exit with error code if there are errors
  process.exit(results.hasErrors ? 1 : 0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
