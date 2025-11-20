#!/usr/bin/env node
/**
 * Example: Error Handler with AgentDB Retrieval
 *
 * Demonstrates how to query AgentDB for past solutions when errors occur.
 * Integrates with existing error handling to provide context.
 */

import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Query AgentDB for similar past errors and solutions
 *
 * @param {string} errorType - Type of error (e.g., "deployment", "build", "test")
 * @param {string} errorMessage - Error message or code
 * @param {number} k - Number of episodes to retrieve
 * @returns {string} Past episodes and solutions
 */
function queryPastSolutions(errorType, errorMessage, k = 5) {
  const query = `${errorType} error ${errorMessage.substring(0, 50)}`.trim();

  console.log(`\n🧠 Querying AgentDB for similar ${errorType} errors...`);

  try {
    const result = execSync(
      `./scripts/agentdb-retrieve-tracked.sh "${query}" ${k} --only-successes`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    if (result && result.includes('Episode')) {
      console.log('✅ Found past solutions:');
      console.log(result);
      return result;
    } else {
      console.log('⚠️  No similar errors found in AgentDB (first occurrence)');
      return null;
    }
  } catch (error) {
    console.log('⚠️  AgentDB query failed (retrieval tracking may not be installed)');
    return null;
  }
}

/**
 * Example: Enhanced error handler with AgentDB integration
 */
async function deployWithRetrieval() {
  try {
    console.log('🚀 Starting deployment...');

    // Simulate deployment error
    throw new Error('Port 3000 already in use');

  } catch (error) {
    console.error(`\n❌ Deployment failed: ${error.message}`);

    // Query AgentDB for past solutions
    const pastSolutions = queryPastSolutions('deployment', error.message, 3);

    if (pastSolutions) {
      console.log('\n💡 Apply solutions from past episodes above');
    } else {
      console.log('\n📝 This appears to be a new error. Storing for future reference...');

      // Store in AgentDB for future retrieval
      // (This would normally be done via reflexion store)
    }

    throw error;
  }
}

/**
 * Example: Build error handler
 */
async function buildWithRetrieval() {
  try {
    console.log('🔨 Building project...');

    // Simulate build error
    const error = new Error('TypeScript compilation failed: TS2304');
    error.code = 'TS2304';
    throw error;

  } catch (error) {
    console.error(`\n❌ Build failed: ${error.message}`);

    // Query with error code
    queryPastSolutions('build', error.code || error.message, 5);

    throw error;
  }
}

/**
 * Example: Test failure handler
 */
async function testWithRetrieval() {
  try {
    console.log('🧪 Running tests...');

    // Simulate test failure
    throw new Error('Coverage threshold not met: statements 60.58% < 62%');

  } catch (error) {
    console.error(`\n❌ Tests failed: ${error.message}`);

    // Query for coverage-related solutions
    queryPastSolutions('test coverage', 'threshold', 10);

    throw error;
  }
}

/**
 * Wrapper function for any operation with automatic retrieval on error
 *
 * @param {Function} operation - Async operation to execute
 * @param {string} operationType - Type for AgentDB query (e.g., "deployment", "build")
 * @returns {Promise<any>} Operation result
 */
async function executeWithRetrieval(operation, operationType) {
  try {
    return await operation();
  } catch (error) {
    console.error(`\n❌ ${operationType} failed: ${error.message}`);

    // Automatically query AgentDB
    queryPastSolutions(operationType, error.message, 5);

    // Re-throw to maintain error propagation
    throw error;
  }
}

/**
 * Example usage of wrapper
 */
async function exampleUsage() {
  // Wrap any operation
  await executeWithRetrieval(
    async () => {
      // Your deployment logic
      throw new Error('Database connection timeout');
    },
    'deployment'
  );
}

// Run examples (comment out to use as library)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Example: Deployment Error with AgentDB Retrieval');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    await deployWithRetrieval();
  } catch (error) {
    console.log('\n(Error expected - this is a demonstration)');
  }
}

export { queryPastSolutions, executeWithRetrieval };
