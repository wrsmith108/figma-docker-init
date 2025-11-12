/**
 * E2E Platform-Specific Tests
 * Tests installation and functionality across macOS, Windows, and Linux
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  createTestProject,
  cleanupTestProject,
  getPlatformInfo,
  isCI
} from '../helpers/platform-helpers.js';

describe('E2E Platform Tests', () => {
  let testDir;
  let platform;

  beforeAll(() => {
    platform = getPlatformInfo();
    console.log(`Running tests on: ${platform.name} (${platform.arch})`);
  });

  beforeEach(() => {
    testDir = createTestProject();
  });

  afterEach(() => {
    cleanupTestProject(testDir);
  });

  describe('macOS Platform', () => {
    beforeAll(() => {
      if (platform.name !== 'darwin') {
        console.log('Skipping macOS-specific tests');
      }
    });

    test('should install on macOS with Homebrew dependencies', () => {
      if (platform.name !== 'darwin') return;

      // Check if Homebrew is available
      try {
        execSync('which brew', { stdio: 'pipe' });
      } catch (error) {
        console.warn('Homebrew not available, skipping test');
        return;
      }

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Run installation
      const output = execSync('npm install', {
        cwd: testDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      expect(output).toContain('figma-docker-init');

      // Verify node_modules structure
      const nodeModulesPath = path.join(testDir, 'node_modules', 'figma-docker-init');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);

      // Verify CLI is executable
      const cliPath = path.join(nodeModulesPath, 'bin', 'figma-docker-init.js');
      expect(fs.existsSync(cliPath)).toBe(true);

      const stats = fs.statSync(cliPath);
      expect(stats.mode & fs.constants.S_IXUSR).toBeTruthy();
    });

    test('should handle macOS-specific file permissions', () => {
      if (platform.name !== 'darwin') return;

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      execSync('npm install', { cwd: testDir, stdio: 'pipe' });

      const cliPath = path.join(testDir, 'node_modules', 'figma-docker-init', 'bin', 'figma-docker-init.js');
      const stats = fs.statSync(cliPath);

      // Check executable permission
      expect(stats.mode & 0o111).toBeTruthy();
    });

    test('should work with macOS-specific paths', () => {
      if (platform.name !== 'darwin') return;

      const testPaths = [
        '/Users/testuser/project',
        '/Applications/Project.app',
        '/Library/Application Support/Project'
      ];

      testPaths.forEach(testPath => {
        const normalized = path.normalize(testPath);
        expect(normalized).toBe(testPath);
      });
    });
  });

  describe('Windows Platform', () => {
    beforeAll(() => {
      if (platform.name !== 'win32') {
        console.log('Skipping Windows-specific tests');
      }
    });

    test('should install on Windows with correct paths', () => {
      if (platform.name !== 'win32') return;

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const output = execSync('npm install', {
        cwd: testDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      expect(output).toContain('figma-docker-init');

      const nodeModulesPath = path.join(testDir, 'node_modules', 'figma-docker-init');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
    });

    test('should handle Windows path separators', () => {
      if (platform.name !== 'win32') return;

      const testPaths = [
        'C:\\Users\\testuser\\project',
        'D:\\Projects\\app',
        '\\\\network\\share\\folder'
      ];

      testPaths.forEach(testPath => {
        const normalized = path.normalize(testPath);
        // Windows paths should use backslashes
        expect(normalized.includes('\\')).toBe(true);
      });
    });

    test('should work with Windows line endings', () => {
      if (platform.name !== 'win32') return;

      const testContent = 'line1\r\nline2\r\nline3';
      const testFile = path.join(testDir, 'test.txt');

      fs.writeFileSync(testFile, testContent);
      const content = fs.readFileSync(testFile, 'utf8');

      expect(content).toBe(testContent);
      expect(content.includes('\r\n')).toBe(true);
    });

    test('should handle long Windows paths', () => {
      if (platform.name !== 'win32') return;

      // Windows has MAX_PATH limitation (260 characters)
      const longPath = 'C:\\' + 'a'.repeat(250);

      try {
        const normalized = path.normalize(longPath);
        expect(normalized).toBeDefined();
      } catch (error) {
        // Expected to handle or fail gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Linux Platform', () => {
    beforeAll(() => {
      if (platform.name !== 'linux') {
        console.log('Skipping Linux-specific tests');
      }
    });

    test('should install on Linux with correct permissions', () => {
      if (platform.name !== 'linux') return;

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const output = execSync('npm install', {
        cwd: testDir,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      expect(output).toContain('figma-docker-init');

      const cliPath = path.join(testDir, 'node_modules', 'figma-docker-init', 'bin', 'figma-docker-init.js');
      expect(fs.existsSync(cliPath)).toBe(true);

      const stats = fs.statSync(cliPath);
      expect(stats.mode & fs.constants.S_IXUSR).toBeTruthy();
    });

    test('should handle Linux-specific file permissions', () => {
      if (platform.name !== 'linux') return;

      const testFile = path.join(testDir, 'test-executable.sh');
      fs.writeFileSync(testFile, '#!/bin/bash\necho "test"', { mode: 0o755 });

      const stats = fs.statSync(testFile);
      expect(stats.mode & 0o755).toBe(0o755);
    });

    test('should work with Linux-specific paths', () => {
      if (platform.name !== 'linux') return;

      const testPaths = [
        '/home/user/project',
        '/opt/application',
        '/usr/local/bin',
        '/var/lib/app'
      ];

      testPaths.forEach(testPath => {
        const normalized = path.normalize(testPath);
        expect(normalized).toBe(testPath);
      });
    });

    test('should handle symbolic links on Linux', () => {
      if (platform.name !== 'linux') return;

      const targetFile = path.join(testDir, 'target.txt');
      const linkFile = path.join(testDir, 'link.txt');

      fs.writeFileSync(targetFile, 'content');
      fs.symlinkSync(targetFile, linkFile);

      expect(fs.existsSync(linkFile)).toBe(true);
      expect(fs.readlinkSync(linkFile)).toBe(targetFile);
      expect(fs.readFileSync(linkFile, 'utf8')).toBe('content');

      fs.unlinkSync(linkFile);
    });
  });

  describe('CI Environment', () => {
    test('should detect CI environment', () => {
      const ciEnv = isCI();

      if (process.env.CI) {
        expect(ciEnv).toBe(true);
      }

      console.log(`CI Environment: ${ciEnv ? 'Yes' : 'No'}`);
    });

    test('should install in CI without interactive prompts', () => {
      if (!isCI()) {
        console.log('Skipping CI-specific test (not in CI)');
        return;
      }

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // In CI, this should not hang waiting for input
      const output = execSync('npm install --no-progress', {
        cwd: testDir,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000 // 60 second timeout
      });

      expect(output).toContain('figma-docker-init');
    });

    test('should run without TTY in CI', () => {
      if (!isCI()) {
        console.log('Skipping CI-specific test (not in CI)');
        return;
      }

      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'figma-docker-init': `file:${process.cwd()}`
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // CI environments typically don't have TTY
      const output = execSync('npm install', {
        cwd: testDir,
        encoding: 'utf8',
        stdio: 'pipe',
        env: { ...process.env, CI: 'true' }
      });

      expect(output).toBeDefined();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should normalize paths across platforms', () => {
      const testPath = path.join('folder', 'subfolder', 'file.txt');
      const normalized = path.normalize(testPath);

      expect(normalized).toBeDefined();
      expect(path.isAbsolute(normalized)).toBe(false);
    });

    test('should handle environment variables consistently', () => {
      const testEnvVar = 'FIGMA_DOCKER_TEST_VAR';
      const testValue = 'test-value-123';

      process.env[testEnvVar] = testValue;
      expect(process.env[testEnvVar]).toBe(testValue);

      delete process.env[testEnvVar];
      expect(process.env[testEnvVar]).toBeUndefined();
    });

    test('should use correct path separators', () => {
      const separator = path.sep;

      if (platform.name === 'win32') {
        expect(separator).toBe('\\');
      } else {
        expect(separator).toBe('/');
      }
    });

    test('should handle temp directory across platforms', () => {
      const tmpDir = os.tmpdir();

      expect(tmpDir).toBeDefined();
      expect(fs.existsSync(tmpDir)).toBe(true);

      const testTmpFile = path.join(tmpDir, `figma-docker-test-${Date.now()}.txt`);
      fs.writeFileSync(testTmpFile, 'test');

      expect(fs.existsSync(testTmpFile)).toBe(true);

      fs.unlinkSync(testTmpFile);
    });
  });
});
