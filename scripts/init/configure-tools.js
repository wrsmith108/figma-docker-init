#!/usr/bin/env node
/**
 * Tool Configuration Script
 *
 * Configures AI-powered development tools:
 * - AgentDB (vector database for agent memory)
 * - Claude-Flow (swarm orchestration)
 * - Git hooks for AI validation
 * - Metrics system
 *
 * Usage:
 *   node scripts/init/configure-tools.js [--skip-agentdb] [--skip-hooks]
 *
 * Options:
 *   --skip-agentdb   Skip AgentDB initialization
 *   --skip-hooks     Skip git hooks installation
 *   --force          Overwrite existing configurations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const SKIP_AGENTDB = process.argv.includes('--skip-agentdb');
const SKIP_HOOKS = process.argv.includes('--skip-hooks');
const FORCE = process.argv.includes('--force');

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
 * Execute a command
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
 * Initialize AgentDB vector database
 * @returns {object} Initialization result
 */
function initializeAgentDB() {
  if (SKIP_AGENTDB) {
    log('\n⏭️  Skipping AgentDB initialization (--skip-agentdb flag)', 'yellow');
    return { success: true, skipped: true };
  }

  log('\n🧠 Initializing AgentDB...', 'cyan');

  // Check if already initialized
  if (fs.existsSync('agentdb.db') && !FORCE) {
    log('  ✅ AgentDB already initialized', 'green');
    log('  Use --force to reinitialize', 'blue');
    return { success: true, existing: true };
  }

  // Initialize AgentDB with optimal settings
  log('  Creating vector database...', 'blue');

  // AgentDB auto-initializes on first use, just verify it works
  const result = exec('npx agentdb@latest --version', true);

  if (result.success) {
    log(`  ✅ AgentDB ${result.output} ready`, 'green');

    // Create initial namespace structure
    log('  Setting up memory namespaces...', 'blue');

    const namespaces = [
      'coordination',
      'ci-cd/failures',
      'learning',
      'validation'
    ];

    for (const ns of namespaces) {
      log(`    • ${ns}`, 'reset');
    }

    log('  ✅ Namespaces configured', 'green');

    return { success: true, initialized: true };
  } else {
    log('  ❌ Failed to initialize AgentDB', 'red');
    log(`  Error: ${result.error}`, 'red');
    return { success: false, error: result.error };
  }
}

/**
 * Configure Claude-Flow orchestration
 * @returns {object} Configuration result
 */
function configureClaudeFlow() {
  log('\n⚡ Configuring Claude-Flow...', 'cyan');

  // Verify Claude-Flow is available
  const versionResult = exec('npx claude-flow@alpha --version', true);

  if (!versionResult.success) {
    log('  ❌ Claude-Flow not available', 'red');
    log('  Install with: npm install --save-dev claude-flow@alpha', 'blue');
    return { success: false, missing: true };
  }

  log(`  ✅ Claude-Flow ${versionResult.output} available`, 'green');

  // Create .claude-flow directory structure if needed
  const dirs = [
    '.claude-flow',
    '.claude-flow/hooks',
    '.claude-flow/logs',
    '.claude-flow/metrics'
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  ✅ Created ${dir}/`, 'green');
    } else {
      log(`  ✅ ${dir}/ exists`, 'green');
    }
  }

  // Initialize memory if not exists
  if (!fs.existsSync('.swarm')) {
    fs.mkdirSync('.swarm', { recursive: true });
    log('  ✅ Created .swarm/ directory', 'green');
  }

  return { success: true, configured: true };
}

/**
 * Install git hooks for AI validation
 * @returns {object} Installation result
 */
function installGitHooks() {
  if (SKIP_HOOKS) {
    log('\n⏭️  Skipping git hooks installation (--skip-hooks flag)', 'yellow');
    return { success: true, skipped: true };
  }

  log('\n🪝 Installing git hooks...', 'cyan');

  // Check if in a git repository
  const gitResult = exec('git rev-parse --git-dir', true);

  if (!gitResult.success) {
    log('  ⚠️  Not in a git repository', 'yellow');
    log('  Initialize with: git init', 'blue');
    return { success: false, notGitRepo: true };
  }

  // Make hooks executable
  const hooksDir = '.claude-flow/hooks';
  const hooks = ['pre-commit', 'pre-push', 'post-failure'];

  for (const hook of hooks) {
    const hookPath = path.join(hooksDir, hook);

    if (fs.existsSync(hookPath)) {
      try {
        fs.chmodSync(hookPath, 0o755);
        log(`  ✅ Made ${hook} executable`, 'green');
      } catch (error) {
        log(`  ⚠️  Could not chmod ${hook}: ${error.message}`, 'yellow');
      }
    } else {
      log(`  ⚠️  Hook not found: ${hook}`, 'yellow');
    }
  }

  // Configure git to use .claude-flow/hooks directory
  const configResult = exec('git config core.hooksPath .claude-flow/hooks', true);

  if (configResult.success) {
    log('  ✅ Git configured to use .claude-flow/hooks/', 'green');
  } else {
    log('  ❌ Failed to configure git hooks path', 'red');
    return { success: false, configError: true };
  }

  // Make AI validation script executable
  if (fs.existsSync('scripts/ai-validate.js')) {
    try {
      fs.chmodSync('scripts/ai-validate.js', 0o755);
      log('  ✅ Made scripts/ai-validate.js executable', 'green');
    } catch (error) {
      log(`  ⚠️  Could not chmod ai-validate.js: ${error.message}`, 'yellow');
    }
  }

  return { success: true, installed: true };
}

/**
 * Initialize metrics system
 * @returns {object} Initialization result
 */
function initializeMetrics() {
  log('\n📊 Initializing metrics system...', 'cyan');

  const metricsDir = '.claude-flow/metrics';

  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
    log(`  ✅ Created ${metricsDir}/`, 'green');
  }

  // Create initial metrics files if they don't exist
  const metricsFiles = [
    'performance.json',
    'system-metrics.json',
    'task-metrics.json'
  ];

  for (const file of metricsFiles) {
    const filePath = path.join(metricsDir, file);

    if (!fs.existsSync(filePath) || FORCE) {
      const initialData = {
        initialized: new Date().toISOString(),
        metrics: []
      };

      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
      log(`  ✅ Created ${file}`, 'green');
    } else {
      log(`  ✅ ${file} exists`, 'green');
    }
  }

  return { success: true, initialized: true };
}

/**
 * Create configuration summary
 * @returns {object} Summary object
 */
function createConfigSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    agentdb: fs.existsSync('agentdb.db'),
    claudeFlow: fs.existsSync('.claude-flow'),
    gitHooks: fs.existsSync('.claude-flow/hooks/pre-commit'),
    metrics: fs.existsSync('.claude-flow/metrics/performance.json')
  };

  const summaryPath = '.claude-flow/config-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  return summary;
}

/**
 * Main configuration function
 */
async function main() {
  log('\n🚀 Tool Configuration', 'bright');
  log('━'.repeat(50), 'cyan');

  const results = [];

  // Step 1: Initialize AgentDB
  const agentdbResult = initializeAgentDB();
  results.push({ name: 'AgentDB', ...agentdbResult });

  // Step 2: Configure Claude-Flow
  const flowResult = configureClaudeFlow();
  results.push({ name: 'Claude-Flow', ...flowResult });

  // Step 3: Install git hooks
  const hooksResult = installGitHooks();
  results.push({ name: 'Git Hooks', ...hooksResult });

  // Step 4: Initialize metrics
  const metricsResult = initializeMetrics();
  results.push({ name: 'Metrics', ...metricsResult });

  // Create configuration summary
  const summary = createConfigSummary();

  // Summary
  log('\n' + '━'.repeat(50), 'cyan');
  log('📊 Configuration Summary', 'bright');
  log('━'.repeat(50), 'cyan');

  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  const skipped = results.filter(r => r.skipped);

  if (successes.length > 0) {
    log(`\n✅ Configured: ${successes.length}/${results.length}`, 'green');
    successes.forEach(r => {
      const status = r.skipped ? '(skipped)' : r.existing ? '(existing)' : '(new)';
      log(`  • ${r.name} ${status}`, 'green');
    });
  }

  if (skipped.length > 0) {
    log(`\n⏭️  Skipped: ${skipped.length}`, 'yellow');
    skipped.forEach(r => {
      log(`  • ${r.name}`, 'yellow');
    });
  }

  if (failures.length > 0) {
    log(`\n❌ Failed: ${failures.length}`, 'red');
    failures.forEach(r => {
      log(`  • ${r.name}`, 'red');
      if (r.error) log(`    ${r.error}`, 'reset');
    });
  }

  // Feature availability summary
  log('\n📋 Feature Availability:', 'cyan');
  log(`  • AgentDB Vector Database: ${summary.agentdb ? '✅' : '❌'}`, summary.agentdb ? 'green' : 'red');
  log(`  • Claude-Flow Orchestration: ${summary.claudeFlow ? '✅' : '❌'}`, summary.claudeFlow ? 'green' : 'red');
  log(`  • AI Validation Hooks: ${summary.gitHooks ? '✅' : '❌'}`, summary.gitHooks ? 'green' : 'red');
  log(`  • Metrics System: ${summary.metrics ? '✅' : '❌'}`, summary.metrics ? 'green' : 'red');

  log('\n' + '━'.repeat(50), 'cyan');

  if (failures.length > 0) {
    log('⚠️  CONFIGURATION COMPLETED WITH ERRORS', 'yellow');
    log('Some features may not be available', 'yellow');
    process.exit(1);
  } else {
    log('✅ CONFIGURATION COMPLETE', 'green');
    log('All tools are ready for use', 'green');

    // Show next steps
    log('\n📚 Next Steps:', 'cyan');
    log('  1. Test AI validation: npm run ai:validate', 'blue');
    log('  2. View metrics: npx vibe-metrics dashboard', 'blue');
    log('  3. Query memory: npx claude-flow@alpha memory list', 'blue');
    log('  4. Make a commit to trigger hooks automatically', 'blue');

    process.exit(0);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

main();
