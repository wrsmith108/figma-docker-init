#!/usr/bin/env node
/**
 * Environment Validation Script
 *
 * Validates system requirements for vibe-to-docker:
 * - Node.js version (>=20.8.1)
 * - npm version (>=10.0.0)
 * - Docker availability
 * - Git configuration
 *
 * Usage:
 *   node scripts/init/check-environment.js [--strict]
 *
 * Options:
 *   --strict   Fail on warnings (default: fail only on errors)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const STRICT_MODE = process.argv.includes('--strict');

// Minimum version requirements from package.json
const REQUIRED_NODE_VERSION = '20.8.1';
const REQUIRED_NPM_VERSION = '10.0.0';

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Execute a command and return the result
 * @param {string} command - Command to execute
 * @param {boolean} silent - Suppress output
 * @returns {object} Result object with success, output, and error
 */
function exec(command, silent = true) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.trim() : ''
    };
  }
}

/**
 * Compare semantic versions
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @returns {number} -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1 = v1Parts[i] || 0;
    const v2 = v2Parts[i] || 0;

    if (v1 < v2) return -1;
    if (v1 > v2) return 1;
  }

  return 0;
}

/**
 * Check Node.js version
 * @returns {object} Check result
 */
function checkNodeVersion() {
  log('\n🔍 Checking Node.js version...', 'cyan');

  const result = exec('node --version');

  if (!result.success) {
    return {
      passed: false,
      level: 'error',
      message: 'Node.js not found. Please install Node.js >= 20.8.1',
      details: result.error
    };
  }

  const version = result.output.replace('v', '');
  const comparison = compareVersions(version, REQUIRED_NODE_VERSION);

  if (comparison >= 0) {
    log(`  ✅ Node.js ${version} (required: >=${REQUIRED_NODE_VERSION})`, 'green');
    return { passed: true, level: 'success', version };
  } else {
    return {
      passed: false,
      level: 'error',
      message: `Node.js ${version} is below minimum ${REQUIRED_NODE_VERSION}`,
      details: 'Please upgrade Node.js to the latest LTS version'
    };
  }
}

/**
 * Check npm version
 * @returns {object} Check result
 */
function checkNpmVersion() {
  log('\n🔍 Checking npm version...', 'cyan');

  const result = exec('npm --version');

  if (!result.success) {
    return {
      passed: false,
      level: 'error',
      message: 'npm not found. Please install npm >= 10.0.0',
      details: result.error
    };
  }

  const version = result.output;
  const comparison = compareVersions(version, REQUIRED_NPM_VERSION);

  if (comparison >= 0) {
    log(`  ✅ npm ${version} (required: >=${REQUIRED_NPM_VERSION})`, 'green');
    return { passed: true, level: 'success', version };
  } else {
    return {
      passed: false,
      level: 'error',
      message: `npm ${version} is below minimum ${REQUIRED_NPM_VERSION}`,
      details: 'Please upgrade npm: npm install -g npm@latest'
    };
  }
}

/**
 * Check Docker availability
 * @returns {object} Check result
 */
function checkDocker() {
  log('\n🔍 Checking Docker...', 'cyan');

  const versionResult = exec('docker --version');

  if (!versionResult.success) {
    return {
      passed: false,
      level: 'warning',
      message: 'Docker not found',
      details: 'Docker is recommended for containerization. Install from https://docker.com'
    };
  }

  const version = versionResult.output;
  log(`  ✅ ${version}`, 'green');

  // Check if Docker daemon is running
  const pingResult = exec('docker ps');

  if (!pingResult.success) {
    return {
      passed: false,
      level: 'warning',
      message: 'Docker is installed but not running',
      details: 'Start Docker Desktop or Docker daemon to use containerization features'
    };
  }

  log(`  ✅ Docker daemon is running`, 'green');
  return { passed: true, level: 'success', version };
}

/**
 * Check Git configuration
 * @returns {object} Check result
 */
function checkGit() {
  log('\n🔍 Checking Git...', 'cyan');

  const versionResult = exec('git --version');

  if (!versionResult.success) {
    return {
      passed: false,
      level: 'error',
      message: 'Git not found',
      details: 'Git is required. Install from https://git-scm.com'
    };
  }

  log(`  ✅ ${versionResult.output}`, 'green');

  // Check if in a git repository
  const repoResult = exec('git rev-parse --git-dir');

  if (!repoResult.success) {
    return {
      passed: false,
      level: 'warning',
      message: 'Not in a Git repository',
      details: 'Initialize with: git init'
    };
  }

  log(`  ✅ Git repository detected`, 'green');

  // Check git user configuration
  const nameResult = exec('git config user.name');
  const emailResult = exec('git config user.email');

  if (!nameResult.success || !emailResult.success) {
    return {
      passed: false,
      level: 'warning',
      message: 'Git user not configured',
      details: 'Configure with: git config --global user.name "Your Name" && git config --global user.email "you@example.com"'
    };
  }

  log(`  ✅ Git configured: ${nameResult.output} <${emailResult.output}>`, 'green');

  return { passed: true, level: 'success' };
}

/**
 * Check project directory structure
 * @returns {object} Check result
 */
function checkProjectStructure() {
  log('\n🔍 Checking project structure...', 'cyan');

  const requiredDirs = ['src', 'scripts', 'templates'];
  const requiredFiles = ['package.json', 'vibe-to-docker.js'];

  const missing = [];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      missing.push(`directory: ${dir}`);
    } else {
      log(`  ✅ ${dir}/ directory exists`, 'green');
    }
  }

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      missing.push(`file: ${file}`);
    } else {
      log(`  ✅ ${file} exists`, 'green');
    }
  }

  if (missing.length > 0) {
    return {
      passed: false,
      level: 'error',
      message: 'Missing required project files/directories',
      details: missing.join(', ')
    };
  }

  return { passed: true, level: 'success' };
}

/**
 * Check write permissions
 * @returns {object} Check result
 */
function checkPermissions() {
  log('\n🔍 Checking write permissions...', 'cyan');

  const testDirs = ['.', '.claude-flow', 'scripts', 'src'];
  const issues = [];

  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    try {
      const testFile = path.join(dir, `.write-test-${Date.now()}`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      log(`  ✅ Write access to ${dir}/`, 'green');
    } catch (error) {
      issues.push(`${dir}: ${error.message}`);
    }
  }

  if (issues.length > 0) {
    return {
      passed: false,
      level: 'error',
      message: 'Write permission issues',
      details: issues.join('; ')
    };
  }

  return { passed: true, level: 'success' };
}

/**
 * Main validation function
 */
async function main() {
  log('\n🚀 Environment Validation', 'bright');
  log('━'.repeat(50), 'cyan');

  const checks = [
    { name: 'Node.js Version', fn: checkNodeVersion },
    { name: 'npm Version', fn: checkNpmVersion },
    { name: 'Docker', fn: checkDocker },
    { name: 'Git', fn: checkGit },
    { name: 'Project Structure', fn: checkProjectStructure },
    { name: 'Write Permissions', fn: checkPermissions }
  ];

  const results = [];

  for (const check of checks) {
    const result = check.fn();
    results.push({ ...result, name: check.name });
  }

  // Summary
  log('\n' + '━'.repeat(50), 'cyan');
  log('📊 Validation Summary', 'bright');
  log('━'.repeat(50), 'cyan');

  const errors = results.filter(r => r.level === 'error');
  const warnings = results.filter(r => r.level === 'warning');
  const successes = results.filter(r => r.level === 'success');

  if (successes.length > 0) {
    log(`\n✅ Passed: ${successes.length}/${results.length}`, 'green');
    successes.forEach(r => {
      log(`  • ${r.name}`, 'green');
    });
  }

  if (warnings.length > 0) {
    log(`\n⚠️  Warnings: ${warnings.length}`, 'yellow');
    warnings.forEach(r => {
      log(`  • ${r.name}: ${r.message}`, 'yellow');
      if (r.details) log(`    ${r.details}`, 'reset');
    });
  }

  if (errors.length > 0) {
    log(`\n❌ Errors: ${errors.length}`, 'red');
    errors.forEach(r => {
      log(`  • ${r.name}: ${r.message}`, 'red');
      if (r.details) log(`    ${r.details}`, 'reset');
    });
  }

  // Exit code
  log('\n' + '━'.repeat(50), 'cyan');

  if (errors.length > 0) {
    log('❌ VALIDATION FAILED', 'red');
    log('Fix the errors above before proceeding', 'yellow');
    process.exit(1);
  } else if (warnings.length > 0 && STRICT_MODE) {
    log('⚠️  VALIDATION PASSED WITH WARNINGS', 'yellow');
    log('Running in strict mode - warnings treated as failures', 'yellow');
    process.exit(1);
  } else {
    log('✅ ENVIRONMENT VALIDATION PASSED', 'green');
    log('System is ready for vibe-to-docker', 'green');
    process.exit(0);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

main();
