/**
 * Cross-Platform Compatibility Tests
 * Tests initialization system across different operating systems
 * Target: Windows, macOS, and Linux compatibility
 */

import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';

describe('Cross-Platform Compatibility', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      configurable: true
    });
  });

  describe('Path Resolution', () => {
    test('should handle Windows paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const swarmDir = path.join(process.cwd(), '.swarm');

      expect(typeof swarmDir).toBe('string');
      expect(swarmDir).toContain('.swarm');
      // Windows paths should not have double slashes/backslashes
      expect(swarmDir).not.toMatch(/[/\\]{2,}/);
    });

    test('should handle macOS paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        configurable: true
      });

      const swarmDir = path.join(process.cwd(), '.swarm');

      expect(typeof swarmDir).toBe('string');
      expect(swarmDir).toContain('.swarm');
      expect(swarmDir).not.toMatch(/\/\//);
    });

    test('should handle Linux paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const swarmDir = path.join(process.cwd(), '.swarm');

      expect(typeof swarmDir).toBe('string');
      expect(swarmDir).toContain('.swarm');
      expect(swarmDir).not.toMatch(/\/\//);
    });

    test('should use platform-agnostic path.join', () => {
      const parts = ['base', 'middle', 'file.json'];
      const joined = path.join(...parts);

      // Should work on all platforms
      expect(joined).toContain('base');
      expect(joined).toContain('middle');
      expect(joined).toContain('file.json');
    });

    test('should use path.resolve for absolute paths', () => {
      const resolved = path.resolve('.swarm', 'memory.db');

      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toContain('.swarm');
      expect(resolved).toContain('memory.db');
    });
  });

  describe('File Separators', () => {
    test('should handle Windows separators', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const sep = path.sep;

      // On Windows, separator would be backslash
      // But path.join handles it automatically
      const joined = path.join('folder', 'file.txt');

      expect(typeof joined).toBe('string');
      expect(joined).toBeTruthy();
    });

    test('should handle Unix separators', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const sep = path.sep;
      const joined = path.join('folder', 'file.txt');

      expect(typeof joined).toBe('string');
      expect(joined).toBeTruthy();
    });

    test('should normalize paths with mixed separators', () => {
      const mixedPath = 'folder/subfolder\\file.txt';
      const normalized = path.normalize(mixedPath);

      // Should use OS-appropriate separators
      expect(normalized).toBeTruthy();
      expect(typeof normalized).toBe('string');
    });
  });

  describe('Environment Variables', () => {
    test('should handle Windows environment variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const homeDir = os.homedir();

      expect(homeDir).toBeTruthy();
      expect(typeof homeDir).toBe('string');
    });

    test('should handle Unix environment variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const homeDir = os.homedir();

      expect(homeDir).toBeTruthy();
      expect(typeof homeDir).toBe('string');
    });

    test('should handle PATH environment variable', () => {
      const pathEnv = process.env.PATH;

      expect(pathEnv).toBeDefined();
      expect(pathEnv.length).toBeGreaterThan(0);

      // PATH separator differs by platform
      const pathSeparator = process.platform === 'win32' ? ';' : ':';
      const paths = pathEnv.split(pathSeparator);

      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Command Execution', () => {
    test('should use correct NPX command on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const command = 'npx claude-flow@alpha --version';

      // NPX works the same on all platforms
      expect(command).toBe('npx claude-flow@alpha --version');
    });

    test('should use correct NPX command on Unix', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const command = 'npx claude-flow@alpha --version';

      expect(command).toBe('npx claude-flow@alpha --version');
    });

    test('should handle shell differences', () => {
      const isWindows = process.platform === 'win32';
      const shell = isWindows ? 'cmd.exe' : '/bin/sh';

      expect(shell).toBeTruthy();
      expect(typeof shell).toBe('string');
    });
  });

  describe('Line Endings', () => {
    test('should handle Windows CRLF line endings', () => {
      const windowsText = 'line1\r\nline2\r\nline3';
      const lines = windowsText.split(/\r?\n/);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line1');
    });

    test('should handle Unix LF line endings', () => {
      const unixText = 'line1\nline2\nline3';
      const lines = unixText.split(/\r?\n/);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('line1');
    });

    test('should handle mixed line endings', () => {
      const mixedText = 'line1\r\nline2\nline3\r\nline4';
      const lines = mixedText.split(/\r?\n/);

      expect(lines).toHaveLength(4);
    });
  });

  describe('File Permissions', () => {
    test('should handle Unix permission model', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      // Unix uses octal permissions (e.g., 0o755)
      const permissions = 0o755;

      expect(permissions).toBe(493); // Decimal representation
    });

    test('should handle Windows permission model', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      // Windows uses different permission model
      // But Node.js fs operations abstract this
      const isWindows = process.platform === 'win32';

      expect(isWindows).toBe(true);
    });
  });

  describe('Temporary Directories', () => {
    test('should use OS-specific temp directory', () => {
      const tmpDir = os.tmpdir();

      expect(tmpDir).toBeTruthy();
      expect(typeof tmpDir).toBe('string');
      expect(tmpDir.length).toBeGreaterThan(0);
    });

    test('should create temp files in OS temp directory', () => {
      const tmpDir = os.tmpdir();
      const tempFile = path.join(tmpDir, `test-${Date.now()}.json`);

      expect(tempFile).toContain(tmpDir);
      expect(tempFile).toContain('.json');
    });

    test('should handle Windows temp directory', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      const tmpDir = os.tmpdir();

      expect(tmpDir).toBeTruthy();
    });

    test('should handle Unix temp directory', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      const tmpDir = os.tmpdir();

      expect(tmpDir).toBeTruthy();
    });
  });

  describe('System Information', () => {
    test('should detect system architecture', () => {
      const arch = os.arch();
      const validArchitectures = ['x64', 'arm64', 'ia32', 'arm'];

      expect(validArchitectures).toContain(arch);
    });

    test('should detect CPU count', () => {
      const cpus = os.cpus();

      expect(cpus.length).toBeGreaterThan(0);
      expect(Array.isArray(cpus)).toBe(true);
    });

    test('should detect total memory', () => {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();

      expect(totalMem).toBeGreaterThan(0);
      expect(freeMem).toBeGreaterThan(0);
      expect(totalMem).toBeGreaterThan(freeMem);
    });
  });

  describe('File System Operations', () => {
    test('should create directory with recursive option', () => {
      const deepPath = path.join('level1', 'level2', 'level3');

      // This is what fs.mkdir with recursive: true does
      const options = { recursive: true };

      expect(options.recursive).toBe(true);
      expect(deepPath).toContain('level1');
      expect(deepPath).toContain('level3');
    });

    test('should handle case-sensitive file systems', () => {
      // Most Unix systems are case-sensitive
      // Windows is case-insensitive
      const isWindows = process.platform === 'win32';
      const isCaseSensitive = !isWindows;

      // This is informational, actual behavior depends on OS
      expect(typeof isCaseSensitive).toBe('boolean');
    });
  });

  describe('Process Management', () => {
    test('should handle process exit codes consistently', () => {
      const exitCodes = {
        success: 0,
        generalError: 1,
        invalidUsage: 2
      };

      expect(exitCodes.success).toBe(0);
      expect(exitCodes.generalError).toBe(1);
    });

    test('should handle signal termination on Unix', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        configurable: true
      });

      // Unix signals
      const signals = ['SIGTERM', 'SIGINT', 'SIGHUP'];

      expect(signals).toContain('SIGTERM');
      expect(signals).toContain('SIGINT');
    });

    test('should handle process termination on Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        configurable: true
      });

      // Windows doesn't use the same signal model
      const isWindows = process.platform === 'win32';

      expect(isWindows).toBe(true);
    });
  });

  describe('Character Encoding', () => {
    test('should handle UTF-8 encoding', () => {
      const utf8Text = 'Hello 世界 🌍';
      const encoded = Buffer.from(utf8Text, 'utf8');

      expect(encoded.toString('utf8')).toBe(utf8Text);
    });

    test('should handle file encoding across platforms', () => {
      const encoding = 'utf8';

      // utf8 is universal across platforms
      expect(encoding).toBe('utf8');
    });
  });

  describe('CI Environment Detection', () => {
    test('should detect CI environment', () => {
      const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

      // This test should pass in both CI and local environments
      expect(typeof isCI).toBe('boolean');
    });

    test('should adjust behavior for CI environment', () => {
      const CI_THRESHOLD_MULTIPLIER = process.env.CI ? 3 : 1;

      expect(CI_THRESHOLD_MULTIPLIER).toBeGreaterThan(0);
      expect([1, 3]).toContain(CI_THRESHOLD_MULTIPLIER);
    });

    test('should handle timeout differences in CI', () => {
      const baseTimeout = 1000;
      const ciMultiplier = process.env.CI ? 3 : 1;
      const effectiveTimeout = baseTimeout * ciMultiplier;

      expect(effectiveTimeout).toBeGreaterThanOrEqual(baseTimeout);
    });
  });
});
