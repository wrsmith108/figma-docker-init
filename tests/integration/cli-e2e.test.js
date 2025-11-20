/**
 * End-to-End CLI Integration Tests
 * Tests the complete flow: detection → generation → display
 * Catches runtime errors that unit tests miss
 */

import fs from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLI_PATH = path.join(__dirname, '../../vibe-to-docker.js');
const TEST_FIXTURES_DIR = path.join(__dirname, '../fixtures');

/**
 * Run CLI command and capture output
 * @param {string[]} args - Command line arguments
 * @param {string} cwd - Working directory
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
async function runCLI(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    child.on('error', (error) => {
      reject(error);
    });

    // Set 30 second timeout for CLI execution
    setTimeout(() => {
      child.kill();
      reject(new Error('CLI execution timeout'));
    }, 30000);
  });
}

describe('CLI End-to-End Tests', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(TEST_FIXTURES_DIR, `cli-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Bolt.new Angular Projects', () => {
    beforeEach(async () => {
      // Create Angular project structure
      const packageJson = {
        name: 'test-angular-app',
        version: '1.0.0',
        scripts: {
          start: 'ng serve',
          build: 'ng build'
        },
        dependencies: {
          '@angular/core': '^17.3.0',
          '@angular/common': '^17.3.0'
        },
        devDependencies: {
          '@angular/cli': '^17.3.0',
          'typescript': '^5.2.0'
        }
      };

      const angularJson = {
        version: 1,
        projects: {
          'test-app': {
            projectType: 'application'
          }
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      await fs.writeFile(
        path.join(testDir, 'angular.json'),
        JSON.stringify(angularJson, null, 2)
      );
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    });

    it('should detect Angular and display correct build commands', async () => {
      const result = await runCLI(['init', '--tool=auto'], testDir);

      // Should exit successfully
      expect(result.exitCode).toBe(0);

      // Should not have runtime errors
      expect(result.stderr).not.toContain('is not defined');
      expect(result.stderr).not.toContain('ReferenceError');
      expect(result.stderr).not.toContain('TypeError');

      // Should display benefits section
      expect(result.stdout).toContain('What You Just Got');
      expect(result.stdout).toContain('Next Steps');

      // Should show correct build command for Angular
      expect(result.stdout).toContain('npm start');
    }, 35000);

    it('should complete full generation without errors', async () => {
      const result = await runCLI(['init', '--tool=bolt'], testDir);

      // Should exit successfully
      expect(result.exitCode).toBe(0);

      // Should not have any runtime errors
      expect(result.stderr).not.toContain('Error during template composition');
      expect(result.stderr).not.toContain('is not defined');

      // Should create .vibe-docker directory
      const vibeDockerExists = await fs.access(path.join(testDir, '.vibe-docker'))
        .then(() => true)
        .catch(() => false);
      expect(vibeDockerExists).toBe(true);

      // Should display completion message
      expect(result.stdout).toContain('vibe-to-docker');
    }, 35000);
  });

  describe('Bolt.new React Projects', () => {
    beforeEach(async () => {
      const packageJson = {
        name: 'test-react-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        },
        devDependencies: {
          'vite': '^5.0.0',
          '@vitejs/plugin-react': '^4.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    });

    it('should detect Bolt and display correct build commands', async () => {
      const result = await runCLI(['init', '--tool=auto'], testDir);

      expect(result.exitCode).toBe(0);
      expect(result.stderr).not.toContain('is not defined');
      expect(result.stdout).toContain('npm run dev');
    }, 35000);
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      // Empty directory - no package.json
      const result = await runCLI(['init', '--tool=auto'], testDir);

      // Should exit with error or warning
      expect(result.exitCode).toBeGreaterThan(0);

      // Should not have runtime errors
      expect(result.stderr).not.toContain('is not defined');
      expect(result.stderr).not.toContain('ReferenceError');
    }, 35000);
  });

  describe('Display Functions', () => {
    beforeEach(async () => {
      // Create minimal valid project
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    });

    it('should display benefits section without errors', async () => {
      const result = await runCLI(['init', '--tool=figma-make'], testDir);

      expect(result.exitCode).toBe(0);

      // Verify all display sections render
      expect(result.stdout).toContain('What You Just Got');
      expect(result.stdout).toContain('Production-Grade Security');
      expect(result.stdout).toContain('Configuration & Optimization');
      expect(result.stdout).toContain('Time Saved');
      expect(result.stdout).toContain('Next Steps');

      // No runtime errors
      expect(result.stderr).not.toContain('is not defined');
      expect(result.stderr).not.toContain('Error during template composition');
    }, 35000);

    it('should handle all tool types correctly', async () => {
      const tools = ['figma-make', 'lovable', 'bolt', 'v0'];

      for (const tool of tools) {
        // Clean up between tests
        try {
          await fs.rm(path.join(testDir, '.vibe-docker'), { recursive: true, force: true });
        } catch (e) {}

        const result = await runCLI(['init', `--tool=${tool}`], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).not.toContain('is not defined');
        expect(result.stdout).toContain('What You Just Got');
      }
    }, 60000);
  });
});
