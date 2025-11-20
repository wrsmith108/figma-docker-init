#!/usr/bin/env node
/**
 * AI-Powered Pre-Deployment Validation
 *
 * Uses multi-agent swarm with learned patterns from AgentDB
 * to predict and prevent CI/CD failures before git push.
 *
 * Usage:
 *   node scripts/ai-validate.js [--strict] [--learn-only]
 *
 * Options:
 *   --strict      Require 100% agent approval (default: 6/7)
 *   --learn-only  Only query patterns, don't validate
 *   --verbose     Show detailed agent reasoning
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const VERBOSE = process.argv.includes('--verbose');
const STRICT = process.argv.includes('--strict');
const LEARN_ONLY = process.argv.includes('--learn-only');

// Color output for terminal
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

function exec(command, silent = false) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

async function queryLearnedPatterns() {
  log('\n🧠 Querying learned CI/CD failure patterns from AgentDB...', 'cyan');

  // Use tracked retrieval script (outputs markdown, not JSON)
  const retrievalResult = exec(
    './scripts/agentdb-retrieve-tracked.sh "CI/CD failure patterns" 20',
    true
  );

  if (!retrievalResult.success) {
    log('⚠️  No learned patterns found in AgentDB (first run)', 'yellow');
    return { patterns: [], confidence: 0 };
  }

  let patterns = [];
  try {
    // Parse markdown output from tracked retrieval
    const output = retrievalResult.output || '';

    // Extract episodes using regex patterns
    // Format: Episode #X (ID: episode-name) - Reward: 0.XX
    const episodePattern = /Episode #(\d+).*?Reward: ([\d.]+).*?Reflection: (.*?)(?=Episode #|\n\n|$)/gs;
    const matches = [...output.matchAll(episodePattern)];

    patterns = matches.map(match => {
      const episodeNum = match[1];
      const reward = parseFloat(match[2]);
      const reflection = match[3]?.trim() || '';

      // Extract failure type from episode context
      const typeMatch = reflection.match(/\[(.*?)\]/);
      const type = typeMatch ? typeMatch[1] : 'unknown';

      return {
        type,
        pattern: reflection,
        fix: null,  // Not directly available in markdown format
        confidence: reward  // Higher reward = higher confidence (successes)
      };
    });

    // If regex parsing didn't work, try simpler episode counting
    if (patterns.length === 0) {
      const episodeCount = (output.match(/Episode #/g) || []).length;
      if (episodeCount > 0) {
        log(`  Found ${episodeCount} episode(s) but couldn't parse details`, 'yellow');
        // Create generic pattern entries
        patterns = Array(Math.min(episodeCount, 5)).fill(null).map((_, i) => ({
          type: 'ci-failure',
          pattern: 'Historical CI/CD failure pattern',
          fix: null,
          confidence: 0.5
        }));
      }
    }
  } catch (e) {
    log(`⚠️  Error parsing retrieval data: ${e.message}`, 'yellow');
  }

  // Get memory-stored patterns using tracked retrieval
  const memoryResult = exec(
    './scripts/agentdb-retrieve-tracked.sh "test coverage platform security failures" 10',
    true
  );

  if (memoryResult.success && memoryResult.output) {
    try {
      // Parse additional patterns from memory retrieval
      const memoryOutput = memoryResult.output || '';
      const memoryMatches = [...memoryOutput.matchAll(/Episode #(\d+).*?Reward: ([\d.]+)/g)];

      patterns.push(...memoryMatches.slice(0, 5).map(match => ({
        type: 'memory-stored',
        pattern: 'Previously stored failure pattern',
        confidence: parseFloat(match[2]) || 0.5
      })));
    } catch (e) {
      // Silent fail for memory search
    }
  }

  if (patterns.length > 0) {
    log(`✅ Found ${patterns.length} learned patterns`, 'green');
    if (VERBOSE) {
      patterns.forEach((p, i) => {
        log(`\n  Pattern ${i + 1} (${p.type}):`, 'blue');
        log(`    ${p.pattern}`, 'reset');
        if (p.fix) log(`    Fix: ${p.fix}`, 'green');
        log(`    Confidence: ${(p.confidence * 100).toFixed(1)}%`, 'cyan');
      });
    }
  }

  return {
    patterns,
    confidence: patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0
  };
}

async function getGitChanges() {
  log('\n📝 Analyzing git changes...', 'cyan');

  const diffResult = exec('git diff HEAD --stat', true);
  const statusResult = exec('git status --short', true);

  const changedFiles = [];
  if (statusResult.success && statusResult.output) {
    const lines = statusResult.output.split('\n').filter(Boolean);
    lines.forEach(line => {
      const match = line.match(/^\s*[A-Z?]+\s+(.+)$/);
      if (match) changedFiles.push(match[1]);
    });
  }

  log(`  Modified files: ${changedFiles.length}`, 'blue');
  if (VERBOSE && changedFiles.length > 0) {
    changedFiles.forEach(f => log(`    - ${f}`, 'reset'));
  }

  return {
    files: changedFiles,
    stats: diffResult.output || ''
  };
}

async function spawnValidationSwarm(changes, learnedPatterns) {
  log('\n🤖 Spawning AI validation swarm...', 'cyan');

  // Initialize hierarchical swarm
  log('  Initializing hierarchical topology...', 'blue');
  const initResult = exec(
    'npx claude-flow@alpha swarm init --topology hierarchical --max-agents 7 --strategy balanced',
    true
  );

  if (!initResult.success) {
    log('❌ Failed to initialize swarm', 'red');
    return { success: false, agents: [] };
  }

  // Define validation task with learned patterns
  const taskDescription = `
Validate code changes for CI/CD deployment:

Changed Files: ${changes.files.join(', ')}

Learned Failure Patterns (${learnedPatterns.patterns.length}):
${learnedPatterns.patterns.map((p, i) =>
  `${i + 1}. [${p.type}] ${p.pattern} (confidence: ${(p.confidence * 100).toFixed(0)}%)`
).join('\n')}

Validation Requirements:
1. Test Prediction: Will tests pass on all platforms (Ubuntu/Windows/macOS, Node 20/22)?
2. Coverage Analysis: Will coverage thresholds be met (62% statements/lines, 60% branches, 69% functions)?
3. Platform Validation: Are there hardcoded paths or platform-specific code?
4. Security Check: Any vulnerable dependencies or security issues?
5. Performance Analysis: Any timing assumptions that will fail in CI?
6. Semantic Validation: Do commit messages follow conventional commits format?

Respond with: APPROVE or REJECT with reasoning.
  `.trim();

  log('  Orchestrating validation task...', 'blue');
  const orchestrateResult = exec(
    `npx claude-flow@alpha task orchestrate --task "${taskDescription.replace(/"/g, '\\"')}" --strategy adaptive --priority critical`,
    true
  );

  if (!orchestrateResult.success) {
    log('❌ Task orchestration failed', 'red');
    return { success: false, agents: [] };
  }

  // Get swarm status
  const statusResult = exec('npx claude-flow@alpha swarm status --json', true);

  let agents = [];
  if (statusResult.success && statusResult.output) {
    try {
      const status = JSON.parse(statusResult.output);
      agents = status.agents || [];
    } catch (e) {
      log(`⚠️  Could not parse swarm status: ${e.message}`, 'yellow');
    }
  }

  return { success: true, agents };
}

async function evaluateConsensus(agents) {
  log('\n🗳️  Evaluating agent consensus...', 'cyan');

  const approvals = agents.filter(a =>
    a.status === 'approved' ||
    a.verdict?.toLowerCase().includes('approve')
  );
  const rejections = agents.filter(a =>
    a.status === 'rejected' ||
    a.verdict?.toLowerCase().includes('reject')
  );

  const total = agents.length;
  const approvalCount = approvals.length;
  const requiredVotes = STRICT ? total : Math.ceil((total * 2 / 3) + 1);

  log(`  Total agents: ${total}`, 'blue');
  log(`  Approvals: ${approvalCount}`, approvalCount >= requiredVotes ? 'green' : 'red');
  log(`  Rejections: ${rejections.length}`, rejections.length > 0 ? 'yellow' : 'green');
  log(`  Required: ${requiredVotes} (${STRICT ? '100%' : '2/3+1'})`, 'cyan');

  if (VERBOSE) {
    log('\n  Agent Verdicts:', 'blue');
    agents.forEach((a, i) => {
      const status = a.status || 'unknown';
      const color = status === 'approved' ? 'green' : status === 'rejected' ? 'red' : 'yellow';
      log(`    ${i + 1}. ${a.type || 'Agent'}: ${status.toUpperCase()}`, color);
      if (a.reasoning) log(`       Reasoning: ${a.reasoning}`, 'reset');
    });
  }

  return {
    passed: approvalCount >= requiredVotes,
    approvals: approvalCount,
    rejections: rejections.length,
    required: requiredVotes,
    agents
  };
}

async function storeValidationMetrics(consensus, changes, learnedPatterns) {
  const timestamp = Date.now();
  const sessionId = `pre-deployment-${timestamp}`;

  // Store session metrics in memory
  const metrics = {
    timestamp,
    session_id: sessionId,
    result: consensus.passed ? 'PASS' : 'FAIL',
    approvals: consensus.approvals,
    rejections: consensus.rejections,
    total_agents: consensus.agents.length,
    changed_files: changes.files.length,
    learned_patterns_used: learnedPatterns.patterns.length,
    pattern_confidence: learnedPatterns.confidence
  };

  exec(
    `npx claude-flow@alpha memory store "metrics/pre-deployment/${timestamp}" '${JSON.stringify(metrics)}' --namespace "validation" --ttl 7776000`,
    true
  );

  // Export session for potential recovery
  exec(
    `npx claude-flow@alpha hooks session-end --generate-summary true --export-metrics true --session-id "${sessionId}"`,
    true
  );

  return metrics;
}

async function main() {
  log('\n🚀 AI-Powered Pre-Deployment Validation', 'bright');
  log('━'.repeat(50), 'cyan');

  // Step 1: Query learned patterns
  const learnedPatterns = await queryLearnedPatterns();

  if (LEARN_ONLY) {
    log('\n✅ Learn-only mode complete', 'green');
    process.exit(0);
  }

  // Step 2: Get git changes
  const changes = await getGitChanges();

  if (changes.files.length === 0) {
    log('\n⚠️  No changes detected', 'yellow');
    log('✅ Validation skipped', 'green');
    process.exit(0);
  }

  // Step 3: Spawn validation swarm
  const swarm = await spawnValidationSwarm(changes, learnedPatterns);

  if (!swarm.success) {
    log('\n❌ Swarm initialization failed', 'red');
    log('⚠️  Falling back to manual validation', 'yellow');
    process.exit(1);
  }

  // Step 4: Evaluate consensus
  const consensus = await evaluateConsensus(swarm.agents);

  // Step 5: Store metrics
  const metrics = await storeValidationMetrics(consensus, changes, learnedPatterns);

  // Final verdict
  log('\n' + '━'.repeat(50), 'cyan');
  if (consensus.passed) {
    log('✅ PRE-DEPLOYMENT VALIDATION PASSED', 'green');
    log(`   ${consensus.approvals}/${consensus.agents.length} agents approved`, 'green');
    log('   Safe to push to GitHub', 'green');
    process.exit(0);
  } else {
    log('❌ PRE-DEPLOYMENT VALIDATION FAILED', 'red');
    log(`   Only ${consensus.approvals}/${consensus.required} required approvals`, 'red');
    log('   Review agent feedback before pushing', 'yellow');
    log('\n   Run with --verbose for detailed reasoning', 'blue');
    process.exit(1);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  log('⚠️  Validation inconclusive - proceed with caution', 'yellow');
  process.exit(1);
});

main();
