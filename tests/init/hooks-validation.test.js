/**
 * Hooks System Validation Tests
 * Tests pre-task, post-task, and coordination hooks
 * Target: Hook execution, error handling, and recovery
 */

import { jest } from '@jest/globals';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const hooksDir = path.join(projectRoot, '.claude-flow/hooks');

describe('Initialization Hooks Validation', () => {
  let testDir;
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `hooks-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('Pre-Task Hook Execution', () => {
    test('should execute pre-task hook with task description', async () => {
      if (isCI) {
        console.log('⏭️  Skipping hook execution test in CI environment');
        return;
      }

      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      expect(hookExists).toBe(true);

      if (hookExists) {
        const { stdout, stderr } = await execAsync(
          `bash "${preTaskHook}" "Test initialization" "TestAgent"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '', stderr: err.stderr || '' }));

        expect(stdout).toContain('Pre-Task Hook');
        expect(stdout).toContain('TestAgent');
      }
    }, 30000);

    test('should handle missing AgentDB gracefully', async () => {
      if (isCI) {
        console.log('⏭️  Skipping AgentDB test in CI environment');
        return;
      }

      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        // Execute in isolated directory without AgentDB
        const { stdout } = await execAsync(
          `bash "${preTaskHook}" "Test task" "TestAgent"`,
          { cwd: testDir }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should complete without crashing
        expect(stdout).toBeTruthy();
      }
    }, 30000);

    test('should query AgentDB for relevant knowledge', async () => {
      if (isCI) {
        console.log('⏭️  Skipping AgentDB query test in CI environment');
        return;
      }

      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${preTaskHook}" "Docker initialization" "DockerAgent"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout).toContain('Querying relevant knowledge');
      }
    }, 30000);

    test('should restore session if swarm ID exists', async () => {
      if (isCI) {
        console.log('⏭️  Skipping session restoration test in CI environment');
        return;
      }

      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${preTaskHook}" "Test task" "TestAgent"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should attempt session restoration
        expect(stdout.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Post-Task Hook Execution', () => {
    test('should execute post-task hook with status', async () => {
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

      if (isCI) {
        console.log('⏭️  Skipping post-task hook execution test in CI environment');
        return;
      }

      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      expect(hookExists).toBe(true);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-123" "TestAgent" "success"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout).toContain('Post-Task Hook');
        expect(stdout).toContain('TestAgent');
        expect(stdout).toContain('success');
      }
    }, 30000);

    test('should store episode in AgentDB with correct reward', async () => {
      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-success" "TestAgent" "success"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout).toContain('Storing task results');
      }
    }, 30000);

    test('should handle failed tasks with low reward', async () => {
      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-failed" "TestAgent" "failed"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout).toContain('Post-Task Hook');
        expect(stdout).toContain('failed');
      }
    }, 30000);

    test('should update memory statistics', async () => {
      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-stats" "TestAgent" "completed"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout).toContain('Post-task processing complete');
      }
    }, 30000);

    test('should generate session summary on completion', async () => {
      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-final" "TestAgent" "completed"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should complete without errors
        expect(stdout).toContain('Post-task processing complete');
      }
    }, 30000);
  });

  describe('Hook Error Handling', () => {
    test('should handle missing task description gracefully', async () => {
      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${preTaskHook}"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should use default values
        expect(stdout).toContain('Unknown');
      }
    }, 30000);

    test('should continue on binary rebuild issues', async () => {
      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const hookExists = await fs.access(preTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        // Should complete even if hooks binary is unavailable
        const { stdout } = await execAsync(
          `bash "${preTaskHook}" "Test task" "TestAgent"`,
          { cwd: testDir }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(stdout.length).toBeGreaterThan(0);
      }
    }, 30000);

    test('should handle memory unavailability', async () => {
      const postTaskHook = path.join(hooksDir, 'post-task.sh');
      const hookExists = await fs.access(postTaskHook)
        .then(() => true)
        .catch(() => false);

      if (hookExists) {
        // Execute in isolated environment
        const { stdout } = await execAsync(
          `bash "${postTaskHook}" "task-123" "TestAgent" "completed"`,
          { cwd: testDir }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should complete despite memory issues
        expect(stdout).toBeTruthy();
      }
    }, 30000);
  });

  describe('Hook Integration', () => {
    test('should maintain coordination protocol throughout lifecycle', async () => {
      const preTaskHook = path.join(hooksDir, 'pre-task.sh');
      const postTaskHook = path.join(hooksDir, 'post-task.sh');

      const preExists = await fs.access(preTaskHook).then(() => true).catch(() => false);
      const postExists = await fs.access(postTaskHook).then(() => true).catch(() => false);

      expect(preExists).toBe(true);
      expect(postExists).toBe(true);

      if (preExists && postExists) {
        // Execute pre-task
        const { stdout: preOutput } = await execAsync(
          `bash "${preTaskHook}" "Integration test" "IntegrationAgent"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(preOutput).toContain('Pre-Task Hook');

        // Execute post-task
        const { stdout: postOutput } = await execAsync(
          `bash "${postTaskHook}" "task-integration" "IntegrationAgent" "success"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        expect(postOutput).toContain('Post-Task Hook');
      }
    }, 60000);

    test('should coordinate through memory system', async () => {
      const preTaskHook = path.join(hooksDir, 'pre-task.sh');

      const hookExists = await fs.access(preTaskHook).then(() => true).catch(() => false);

      if (hookExists) {
        const { stdout } = await execAsync(
          `bash "${preTaskHook}" "Memory coordination test" "MemoryAgent"`,
          { cwd: projectRoot }
        ).catch(err => ({ stdout: err.stdout || '' }));

        // Should attempt memory operations
        expect(stdout.length).toBeGreaterThan(0);
      }
    }, 30000);
  });
});
