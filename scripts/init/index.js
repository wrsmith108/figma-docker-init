#!/usr/bin/env node
/**
 * Main Initialization Orchestrator
 *
 * Coordinates all initialization steps for vibe-to-docker:
 * 1. Environment validation
 * 2. Dependency setup
 * 3. Tool configuration
 * 4. Post-initialization verification
 *
 * Usage:
 *   node scripts/init/index.js [options]
 *
 * Options:
 *   --quick          Skip optional steps (fast setup)
 *   --strict         Fail on warnings
 *   --skip-deps      Skip dependency installation
 *   --skip-tools     Skip tool configuration
 *   --verify-only    Only verify, don't install/configure
 *   --verbose        Show detailed output
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line options
const QUICK_MODE = process.argv.includes('--quick');
const STRICT_MODE = process.argv.includes('--strict');
const SKIP_DEPS = process.argv.includes('--skip-deps');
const SKIP_TOOLS = process.argv.includes('--skip-tools');
const VERIFY_ONLY = process.argv.includes('--verify-only');
const VERBOSE = process.argv.includes('--verbose');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Run a script and return the result
 * @param {string} scriptPath - Path to the script
 * @param {string[]} args - Arguments to pass
 * @param {string} description - Description for logging
 * @returns {Promise<object>} Result object
 */
function runScript(scriptPath, args = [], description = '') {
  return new Promise((resolve) => {
    const fullPath = path.join(__dirname, scriptPath);

    if (!fs.existsSync(fullPath)) {
      log(`  ❌ Script not found: ${scriptPath}`, 'red');
      resolve({ success: false, error: 'Script not found' });
      return;
    }

    log(`\n${'━'.repeat(50)}`, 'cyan');
    log(`${description}`, 'bright');
    log('━'.repeat(50), 'cyan');

    const child = spawn('node', [fullPath, ...args], {
      stdio: VERBOSE ? 'inherit' : 'pipe',
      env: process.env
    });

    let output = '';
    let errorOutput = '';

    if (!VERBOSE) {
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
    }

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        exitCode: code,
        output,
        errorOutput
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });
  });
}

/**
 * Display initialization banner
 */
function displayBanner() {
  log('\n' + '═'.repeat(60), 'cyan');
  log('🚀 VIBE-TO-DOCKER INITIALIZATION', 'bright');
  log('═'.repeat(60), 'cyan');
  log('Universal Docker containerization for AI-generated projects', 'dim');
  log('');

  const mode = QUICK_MODE ? 'Quick' : STRICT_MODE ? 'Strict' : VERIFY_ONLY ? 'Verify-Only' : 'Standard';
  log(`Mode: ${mode}`, 'blue');

  if (SKIP_DEPS) log('Skipping: Dependency installation', 'yellow');
  if (SKIP_TOOLS) log('Skipping: Tool configuration', 'yellow');

  log('═'.repeat(60), 'cyan');
}

/**
 * Run environment validation
 * @returns {Promise<object>} Validation result
 */
async function validateEnvironment() {
  const args = STRICT_MODE ? ['--strict'] : [];
  return runScript('check-environment.js', args, '🔍 Step 1: Environment Validation');
}

/**
 * Setup dependencies
 * @returns {Promise<object>} Setup result
 */
async function setupDependencies() {
  if (SKIP_DEPS || VERIFY_ONLY) {
    log('\n⏭️  Skipping dependency setup', 'yellow');
    return { success: true, skipped: true };
  }

  const args = [];
  if (VERIFY_ONLY) args.push('--verify-only');

  return runScript('setup-dependencies.js', args, '📦 Step 2: Dependency Setup');
}

/**
 * Configure tools
 * @returns {Promise<object>} Configuration result
 */
async function configureTools() {
  if (SKIP_TOOLS || VERIFY_ONLY) {
    log('\n⏭️  Skipping tool configuration', 'yellow');
    return { success: true, skipped: true };
  }

  const args = [];
  if (QUICK_MODE) {
    args.push('--skip-agentdb');
  }

  return runScript('configure-tools.js', args, '⚡ Step 3: Tool Configuration');
}

/**
 * Run post-initialization verification
 * @returns {object} Verification result
 */
function verifyInitialization() {
  log('\n' + '━'.repeat(50), 'cyan');
  log('✅ Step 4: Post-Initialization Verification', 'bright');
  log('━'.repeat(50), 'cyan');

  const checks = [
    {
      name: 'package.json',
      check: () => fs.existsSync('package.json'),
      required: true
    },
    {
      name: 'node_modules/',
      check: () => fs.existsSync('node_modules'),
      required: !VERIFY_ONLY
    },
    {
      name: 'agentdb.db',
      check: () => fs.existsSync('agentdb.db'),
      required: false
    },
    {
      name: '.claude-flow/',
      check: () => fs.existsSync('.claude-flow'),
      required: false
    },
    {
      name: 'git hooks',
      check: () => {
        try {
          const result = execSync('git config core.hooksPath', { encoding: 'utf-8' });
          return result.trim() === '.claude-flow/hooks';
        } catch {
          return false;
        }
      },
      required: false
    }
  ];

  const results = checks.map(check => ({
    ...check,
    passed: check.check()
  }));

  log('\n📋 Verification Results:', 'cyan');

  results.forEach(result => {
    const icon = result.passed ? '✅' : result.required ? '❌' : '⚠️';
    const color = result.passed ? 'green' : result.required ? 'red' : 'yellow';
    const status = result.required ? '(required)' : '(optional)';

    log(`  ${icon} ${result.name} ${status}`, color);
  });

  const requiredFailed = results.filter(r => r.required && !r.passed);
  const optionalFailed = results.filter(r => !r.required && !r.passed);

  return {
    success: requiredFailed.length === 0,
    requiredFailed,
    optionalFailed,
    allPassed: results.every(r => r.passed)
  };
}

/**
 * Display final summary
 * @param {object[]} stepResults - Results from all steps
 * @param {object} verification - Verification results
 */
function displaySummary(stepResults, verification) {
  log('\n' + '═'.repeat(60), 'cyan');
  log('📊 INITIALIZATION SUMMARY', 'bright');
  log('═'.repeat(60), 'cyan');

  // Step results
  log('\n🔄 Steps Completed:', 'cyan');

  stepResults.forEach((result, index) => {
    const stepNum = index + 1;
    const icon = result.success ? '✅' : result.skipped ? '⏭️' : '❌';
    const color = result.success ? 'green' : result.skipped ? 'yellow' : 'red';
    const status = result.skipped ? '(skipped)' : result.success ? '(success)' : '(failed)';

    log(`  ${icon} Step ${stepNum} ${status}`, color);
  });

  // Verification summary
  log('\n🔍 System Status:', 'cyan');

  if (verification.allPassed) {
    log('  ✅ All features available', 'green');
  } else if (verification.success) {
    log('  ✅ Core features available', 'green');
    if (verification.optionalFailed.length > 0) {
      log(`  ⚠️  ${verification.optionalFailed.length} optional features missing`, 'yellow');
    }
  } else {
    log('  ❌ Required features missing', 'red');
  }

  log('\n' + '═'.repeat(60), 'cyan');

  // Final verdict
  const allStepsSuccessful = stepResults.every(r => r.success || r.skipped);

  if (allStepsSuccessful && verification.success) {
    log('🎉 INITIALIZATION SUCCESSFUL', 'green');
    log('vibe-to-docker is ready to use!', 'green');

    // Quick start guide
    log('\n📚 Quick Start:', 'cyan');
    log('  1. Run: vibe-to-docker --help', 'blue');
    log('  2. Test: vibe-to-docker --tool=figma /path/to/project', 'blue');
    log('  3. Validate: npm run ai:validate', 'blue');
    log('  4. View metrics: npx vibe-metrics dashboard', 'blue');

    return 0;
  } else if (allStepsSuccessful && !verification.allPassed) {
    log('⚠️  INITIALIZATION COMPLETED WITH WARNINGS', 'yellow');
    log('Some optional features are unavailable', 'yellow');
    log('System is functional but not fully optimized', 'yellow');

    return 0;
  } else {
    log('❌ INITIALIZATION FAILED', 'red');
    log('Fix the errors above and try again', 'red');

    log('\n💡 Troubleshooting:', 'cyan');
    log('  • Check error messages in each step above', 'blue');
    log('  • Run individual steps with --verbose for details', 'blue');
    log('  • See docs/TROUBLESHOOTING.md for common issues', 'blue');

    return 1;
  }
}

/**
 * Store initialization metrics
 * @param {object[]} stepResults - Results from all steps
 * @param {object} verification - Verification results
 * @param {number} duration - Total duration in milliseconds
 */
function storeMetrics(stepResults, verification, duration) {
  const metricsDir = '.claude-flow/metrics';

  if (!fs.existsSync(metricsDir)) {
    return; // Metrics system not initialized yet
  }

  const metrics = {
    timestamp: new Date().toISOString(),
    mode: QUICK_MODE ? 'quick' : STRICT_MODE ? 'strict' : VERIFY_ONLY ? 'verify' : 'standard',
    duration,
    steps: stepResults.map((r, i) => ({
      step: i + 1,
      success: r.success,
      skipped: r.skipped || false,
      exitCode: r.exitCode
    })),
    verification: {
      success: verification.success,
      allPassed: verification.allPassed,
      requiredFailed: verification.requiredFailed.length,
      optionalFailed: verification.optionalFailed.length
    }
  };

  const metricsFile = path.join(metricsDir, 'initialization.json');

  let history = [];
  if (fs.existsSync(metricsFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
      history = data.history || [];
    } catch (error) {
      // Ignore parse errors, start fresh
    }
  }

  history.push(metrics);

  // Keep only last 10 initializations
  if (history.length > 10) {
    history = history.slice(-10);
  }

  fs.writeFileSync(metricsFile, JSON.stringify({ history }, null, 2));
}

/**
 * Main initialization function
 */
async function main() {
  const startTime = Date.now();

  displayBanner();

  const stepResults = [];

  try {
    // Step 1: Environment validation
    const envResult = await validateEnvironment();
    stepResults.push(envResult);

    if (!envResult.success) {
      throw new Error('Environment validation failed');
    }

    // Step 2: Dependency setup
    const depsResult = await setupDependencies();
    stepResults.push(depsResult);

    if (!depsResult.success && !depsResult.skipped) {
      throw new Error('Dependency setup failed');
    }

    // Step 3: Tool configuration
    const toolsResult = await configureTools();
    stepResults.push(toolsResult);

    if (!toolsResult.success && !toolsResult.skipped) {
      throw new Error('Tool configuration failed');
    }

    // Step 4: Verification
    const verification = verifyInitialization();

    // Store metrics
    const duration = Date.now() - startTime;
    storeMetrics(stepResults, verification, duration);

    // Display summary and exit
    const exitCode = displaySummary(stepResults, verification);

    log(`\n⏱️  Total time: ${(duration / 1000).toFixed(2)}s`, 'dim');
    log('═'.repeat(60) + '\n', 'cyan');

    process.exit(exitCode);

  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');

    const duration = Date.now() - startTime;
    storeMetrics(stepResults, { success: false, allPassed: false, requiredFailed: [], optionalFailed: [] }, duration);

    log('\n💡 Run with --verbose for detailed error output', 'blue');
    log('═'.repeat(60) + '\n', 'cyan');

    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

process.on('SIGINT', () => {
  log('\n\n⚠️  Initialization interrupted', 'yellow');
  log('Run again to complete setup\n', 'blue');
  process.exit(130);
});

main();
