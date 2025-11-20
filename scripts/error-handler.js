#!/usr/bin/env node
/**
 * Error Handler with AgentDB Integration
 *
 * Automatically logs errors to AgentDB for learning and pattern detection.
 * Can be called from any script or hook to capture failure patterns.
 *
 * Usage:
 *   node scripts/error-handler.js <error-type> <error-message> [context]
 *
 * Example:
 *   node scripts/error-handler.js "test-failure" "Coverage below threshold" '{"file":"src/app.js"}'
 */

import { execSync } from 'child_process';
import fs from 'fs';

const [,, errorType, errorMessage, contextJson] = process.argv;

if (!errorType || !errorMessage) {
  console.error('Usage: node scripts/error-handler.js <error-type> <error-message> [context]');
  process.exit(1);
}

const timestamp = Date.now();
const episodeId = `error-${errorType}-${timestamp}`;

// Parse context if provided
let context = {};
try {
  context = contextJson ? JSON.parse(contextJson) : {};
} catch (e) {
  console.warn('⚠️  Invalid JSON context, using empty object');
}

// Color output
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

console.log(`\n${red}❌ Error Handler Triggered${reset}`);
console.log(`${cyan}Type:${reset} ${errorType}`);
console.log(`${cyan}Message:${reset} ${errorMessage}`);
console.log(`${cyan}Timestamp:${reset} ${new Date(timestamp).toISOString()}`);

// Store error in AgentDB using reflexion store
console.log(`\n${cyan}💾 Storing error pattern in AgentDB...${reset}`);

const trajectory = `Error occurred: ${errorType}\nMessage: ${errorMessage}`;
const reflection = `This error should be prevented in future by checking: ${errorType}`;
const correction = JSON.stringify({
  error_type: errorType,
  prevention: `Add validation or checks to prevent: ${errorMessage}`,
  context
});

try {
  const command = `npx agentdb@latest reflexion store \
    "${episodeId}" \
    "${trajectory.replace(/"/g, '\\"')}" \
    0.2 \
    false \
    "${reflection.replace(/"/g, '\\"')}" \
    "${correction.replace(/"/g, '\\"')}" \
    '{"timestamp": ${timestamp}, "type": "${errorType}"}' \
    120000 \
    3000`;

  execSync(command, { encoding: 'utf-8', stdio: 'inherit' });

  console.log(`${cyan}✅ Error pattern stored as episode: ${episodeId}${reset}`);
} catch (e) {
  console.error(`${yellow}⚠️  Failed to store in AgentDB: ${e.message}${reset}`);
}

// Also log to file for backup
const logDir = '.claude-flow/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logEntry = {
  timestamp,
  episodeId,
  errorType,
  errorMessage,
  context
};

const logFile = `${logDir}/errors.jsonl`;
fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');

console.log(`${cyan}📝 Error logged to: ${logFile}${reset}\n`);

// Return non-zero exit code
process.exit(1);
