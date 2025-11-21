#!/usr/bin/env node
/**
 * Dependency Setup Script
 *
 * Installs and verifies project dependencies:
 * - Core npm dependencies
 * - AgentDB for AI memory
 * - Claude-Flow for orchestration
 * - Development tools
 *
 * Usage:
 *   node scripts/init/setup-dependencies.js [--skip-install] [--verify-only]
 *
 * Options:
 *   --skip-install   Skip npm install (only verify)
 *   --verify-only    Alias for --skip-install
 *   --production     Install production dependencies only
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SKIP_INSTALL = process.argv.includes('--skip-install') || process.argv.includes('--verify-only');
const PRODUCTION_ONLY = process.argv.includes('--production');

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
 * Execute a command with output
 * @param {string} command - Command to execute
 * @param {boolean} silent - Suppress output
 * @returns {object} Result object
 */
function exec(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: output ? output.trim() : '' };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout ? error.stdout.trim() : ''
    };
  }
}

/**
 * Check if package.json exists
 * @returns {boolean}
 */
function checkPackageJson() {
  log('\n🔍 Checking package.json...', 'cyan');

  if (!fs.existsSync('package.json')) {
    log('  ❌ package.json not found', 'red');
    return false;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    log(`  ✅ Found package.json (${pkg.name}@${pkg.version})`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Invalid package.json: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Install npm dependencies
 * @returns {object} Result object
 */
function installDependencies() {
  if (SKIP_INSTALL) {
    log('\n⏭️  Skipping npm install (--skip-install flag)', 'yellow');
    return { success: true, skipped: true };
  }

  log('\n📦 Installing dependencies...', 'cyan');

  const installCmd = PRODUCTION_ONLY
    ? 'npm install --production'
    : 'npm install';

  log(`  Running: ${installCmd}`, 'blue');

  const result = exec(installCmd);

  if (result.success) {
    log('  ✅ Dependencies installed successfully', 'green');
  } else {
    log('  ❌ Failed to install dependencies', 'red');
    log(`  Error: ${result.error}`, 'red');
  }

  return result;
}

/**
 * Verify critical dependencies
 * @returns {object} Verification results
 */
function verifyDependencies() {
  log('\n🔍 Verifying critical dependencies...', 'cyan');

  const critical = [
    { name: 'agentdb', type: 'dev', command: 'npx agentdb@latest --version' },
    { name: 'claude-flow', type: 'dev', command: 'npx claude-flow@alpha --version' },
    { name: 'jest', type: 'dev', command: 'npx jest --version' }
  ];

  const results = [];

  for (const dep of critical) {
    const result = exec(dep.command, true);

    if (result.success) {
      log(`  ✅ ${dep.name}: ${result.output}`, 'green');
      results.push({ ...dep, verified: true, version: result.output });
    } else {
      log(`  ❌ ${dep.name}: not available`, 'red');
      results.push({ ...dep, verified: false, error: result.error });
    }
  }

  return {
    passed: results.every(r => r.verified),
    results
  };
}

/**
 * Check for security vulnerabilities
 * @returns {object} Audit results
 */
function runSecurityAudit() {
  log('\n🔒 Running security audit...', 'cyan');

  const result = exec('npm audit --audit-level=high --production', true);

  if (result.success) {
    log('  ✅ No high/critical vulnerabilities found', 'green');
    return { passed: true, vulnerabilities: 0 };
  } else {
    // Parse audit output for vulnerability count
    const vulnMatch = result.output.match(/(\d+) vulnerabilities/);
    const count = vulnMatch ? parseInt(vulnMatch[1]) : 0;

    if (count === 0) {
      log('  ✅ No vulnerabilities found', 'green');
      return { passed: true, vulnerabilities: 0 };
    } else {
      log(`  ⚠️  Found ${count} vulnerabilities`, 'yellow');
      log('  Run: npm audit fix', 'blue');
      return { passed: false, vulnerabilities: count, details: result.output };
    }
  }
}

/**
 * Verify package-lock.json integrity
 * @returns {object} Integrity check result
 */
function verifyLockFile() {
  log('\n🔍 Verifying package-lock.json...', 'cyan');

  if (!fs.existsSync('package-lock.json')) {
    log('  ⚠️  package-lock.json not found', 'yellow');
    log('  Run: npm install to generate', 'blue');
    return { passed: false, missing: true };
  }

  try {
    const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8'));
    log(`  ✅ package-lock.json valid (lockfileVersion: ${lock.lockfileVersion})`, 'green');

    // Check for integrity issues
    const result = exec('npm ls --depth=0', true);

    if (result.success) {
      log('  ✅ Dependency tree is consistent', 'green');
      return { passed: true };
    } else {
      log('  ⚠️  Dependency tree has issues', 'yellow');
      log('  Run: npm install to fix', 'blue');
      return { passed: false, inconsistent: true };
    }
  } catch (error) {
    log(`  ❌ Invalid package-lock.json: ${error.message}`, 'red');
    return { passed: false, invalid: true };
  }
}

/**
 * Check node_modules size
 * @returns {object} Size information
 */
function checkNodeModulesSize() {
  log('\n📊 Checking node_modules size...', 'cyan');

  if (!fs.existsSync('node_modules')) {
    log('  ⚠️  node_modules not found', 'yellow');
    return { exists: false };
  }

  const result = exec('du -sh node_modules 2>/dev/null || echo "0"', true);

  if (result.success && result.output !== '0') {
    const size = result.output.split('\t')[0];
    log(`  ℹ️  node_modules size: ${size}`, 'blue');
    return { exists: true, size };
  } else {
    log('  ℹ️  node_modules size: calculating...', 'blue');
    return { exists: true, size: 'unknown' };
  }
}

/**
 * Initialize AgentDB if not already initialized
 * @returns {object} Initialization result
 */
function initializeAgentDB() {
  log('\n🧠 Checking AgentDB initialization...', 'cyan');

  if (fs.existsSync('agentdb.db')) {
    log('  ✅ AgentDB database exists', 'green');

    // Verify it's a valid SQLite database
    const result = exec('npx agentdb@latest status', true);

    if (result.success) {
      log('  ✅ AgentDB is functional', 'green');
      return { initialized: true, existing: true };
    } else {
      log('  ⚠️  AgentDB database may be corrupted', 'yellow');
      return { initialized: false, corrupted: true };
    }
  } else {
    log('  ℹ️  AgentDB not initialized', 'blue');
    log('  Initialize with: npx agentdb@latest init', 'blue');
    return { initialized: false, missing: true };
  }
}

/**
 * Main setup function
 */
async function main() {
  log('\n🚀 Dependency Setup & Verification', 'bright');
  log('━'.repeat(50), 'cyan');

  // Step 1: Check package.json
  if (!checkPackageJson()) {
    log('\n❌ Cannot proceed without valid package.json', 'red');
    process.exit(1);
  }

  // Step 2: Install dependencies
  const installResult = installDependencies();
  if (!installResult.success && !installResult.skipped) {
    log('\n❌ Dependency installation failed', 'red');
    process.exit(1);
  }

  // Step 3: Verify critical dependencies
  const verifyResult = verifyDependencies();

  // Step 4: Check package-lock integrity
  const lockResult = verifyLockFile();

  // Step 5: Security audit
  const auditResult = runSecurityAudit();

  // Step 6: Check node_modules size
  checkNodeModulesSize();

  // Step 7: Initialize AgentDB
  const agentdbResult = initializeAgentDB();

  // Summary
  log('\n' + '━'.repeat(50), 'cyan');
  log('📊 Setup Summary', 'bright');
  log('━'.repeat(50), 'cyan');

  const issues = [];
  const warnings = [];

  if (!verifyResult.passed) {
    issues.push('Critical dependencies missing or invalid');
  }

  if (!lockResult.passed) {
    warnings.push('package-lock.json needs attention');
  }

  if (!auditResult.passed && auditResult.vulnerabilities > 0) {
    warnings.push(`${auditResult.vulnerabilities} security vulnerabilities found`);
  }

  if (!agentdbResult.initialized) {
    warnings.push('AgentDB not initialized (optional but recommended)');
  }

  if (issues.length > 0) {
    log('\n❌ Issues Found:', 'red');
    issues.forEach(issue => log(`  • ${issue}`, 'red'));
    log('\n❌ SETUP FAILED', 'red');
    process.exit(1);
  } else if (warnings.length > 0) {
    log('\n⚠️  Warnings:', 'yellow');
    warnings.forEach(warning => log(`  • ${warning}`, 'yellow'));
    log('\n✅ SETUP COMPLETED WITH WARNINGS', 'yellow');
    log('Address warnings above for optimal functionality', 'blue');
    process.exit(0);
  } else {
    log('\n✅ ALL CHECKS PASSED', 'green');
    log('Dependencies are ready for use', 'green');
    process.exit(0);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

main();
