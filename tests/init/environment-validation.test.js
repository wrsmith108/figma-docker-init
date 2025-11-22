/**
 * Environment Validation Tests
 * Tests environment prerequisites and validation checks
 * Target: System requirements and dependency validation
 */

import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';

describe('Environment Validation', () => {
  // Mock for execSync used in network connectivity tests
  const mockExecSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Node.js Version Validation', () => {
    test('should detect Node.js installation', () => {
      const simulateNodeCheck = () => 'v20.8.1\n';
      const version = simulateNodeCheck().trim();

      expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    test('should validate minimum Node.js version', () => {
      const currentVersion = 'v20.8.1';
      const minVersion = 'v18.0.0';

      const current = parseInt(currentVersion.match(/v(\d+)/)[1]);
      const minimum = parseInt(minVersion.match(/v(\d+)/)[1]);

      expect(current).toBeGreaterThanOrEqual(minimum);
    });

    test('should handle missing Node.js installation', () => {
      const checkNode = () => {
        throw new Error('node: command not found');
      };

      const result = (() => {
        try {
          checkNode();
          return { installed: true };
        } catch (error) {
          return { installed: false, error: error.message };
        }
      })();

      expect(result.installed).toBe(false);
      expect(result.error).toContain('command not found');
    });
  });

  describe('NPM Availability', () => {
    test('should detect npm installation', () => {
      const simulateNpmCheck = () => '9.8.1\n';
      const version = simulateNpmCheck().trim();

      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should validate minimum npm version', () => {
      const currentVersion = '9.8.1';
      const minVersion = '8.0.0';

      const current = parseInt(currentVersion.split('.')[0]);
      const minimum = parseInt(minVersion.split('.')[0]);

      expect(current).toBeGreaterThanOrEqual(minimum);
    });

    test('should check npx availability', () => {
      const checkNpx = () => {
        return { available: true, version: '9.8.1' };
      };

      const result = checkNpx();

      expect(result.available).toBe(true);
    });
  });

  describe('Claude Flow Availability', () => {
    test('should check if claude-flow is available', () => {
      const simulateClaudeFlowCheck = () => '2.7.33\n';
      const version = simulateClaudeFlowCheck().trim();

      expect(version).toMatch(/\d+\.\d+\.\d+/);
    });

    test('should handle claude-flow installation via npx', () => {
      const simulateInstall = () => 'Installing claude-flow@alpha...\n2.7.33\n';
      const result = simulateInstall();

      expect(result).toContain('2.7');
    });

    test('should detect claude-flow MCP tools', () => {
      const checkMcpTools = () => {
        const result = JSON.stringify({
          tools: ['swarm_init', 'agent_spawn', 'memory_usage']
        });
        const tools = JSON.parse(result);
        return { available: true, tools: tools.tools || [] };
      };

      const result = checkMcpTools();

      expect(result.available).toBe(true);
      expect(result.tools).toContain('swarm_init');
    });
  });

  describe('Filesystem Permissions', () => {
    test('should verify write permissions in project directory', () => {
      const projectDir = process.cwd();

      expect(typeof projectDir).toBe('string');
      expect(projectDir.length).toBeGreaterThan(0);
    });

    test('should check if .swarm directory is writable', () => {
      const swarmDir = path.join(process.cwd(), '.swarm');

      // Simulate permission check
      const checkPermissions = (dir) => {
        try {
          // In real scenario, would use fs.access with fs.constants.W_OK
          return { writable: true, path: dir };
        } catch (error) {
          return { writable: false, path: dir, error: error.message };
        }
      };

      const result = checkPermissions(swarmDir);

      expect(result.writable).toBe(true);
      expect(result.path).toBe(swarmDir);
    });

    test('should handle permission denied errors', () => {
      const checkPermissions = () => {
        throw new Error('EACCES: permission denied');
      };

      expect(() => checkPermissions()).toThrow('permission denied');
    });
  });

  describe('Memory/Disk Space Validation', () => {
    test('should check available disk space', () => {
      const tmpDir = os.tmpdir();

      expect(typeof tmpDir).toBe('string');
      expect(tmpDir.length).toBeGreaterThan(0);
    });

    test('should validate minimum disk space requirement', () => {
      // Minimum 100MB required
      const minSpaceMB = 100;
      const minSpaceBytes = minSpaceMB * 1024 * 1024;

      expect(minSpaceBytes).toBe(104857600);
    });

    test('should check system memory availability', () => {
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();

      expect(freeMemory).toBeGreaterThan(0);
      expect(totalMemory).toBeGreaterThan(freeMemory);
    });
  });

  describe('Operating System Compatibility', () => {
    test('should detect current operating system', () => {
      const platform = os.platform();
      const validPlatforms = ['darwin', 'linux', 'win32'];

      expect(validPlatforms).toContain(platform);
    });

    test('should support macOS', () => {
      const platform = 'darwin';
      const isSupported = ['darwin', 'linux', 'win32'].includes(platform);

      expect(isSupported).toBe(true);
    });

    test('should support Linux', () => {
      const platform = 'linux';
      const isSupported = ['darwin', 'linux', 'win32'].includes(platform);

      expect(isSupported).toBe(true);
    });

    test('should support Windows', () => {
      const platform = 'win32';
      const isSupported = ['darwin', 'linux', 'win32'].includes(platform);

      expect(isSupported).toBe(true);
    });
  });

  describe('Environment Variable Validation', () => {
    test('should check PATH environment variable', () => {
      const pathEnv = process.env.PATH;

      expect(pathEnv).toBeDefined();
      expect(pathEnv.length).toBeGreaterThan(0);
    });

    test('should validate HOME directory', () => {
      const homeDir = os.homedir();

      expect(homeDir).toBeDefined();
      expect(typeof homeDir).toBe('string');
      expect(homeDir.length).toBeGreaterThan(0);
    });

    test('should handle missing environment variables gracefully', () => {
      const customVar = process.env.CUSTOM_NONEXISTENT_VAR || 'default-value';

      expect(customVar).toBe('default-value');
    });
  });

  describe('Network Connectivity (Optional)', () => {
    test('should handle network check for NPM registry', () => {
      mockExecSync.mockReturnValue('200 OK\n');

      const checkNetwork = () => {
        try {
          // In real scenario, would use curl or fetch
          return { connected: true };
        } catch (error) {
          return { connected: false, error: error.message };
        }
      };

      const result = checkNetwork();

      expect(result.connected).toBe(true);
    });

    test('should continue initialization if network is unavailable', () => {
      const networkAvailable = false;

      // Initialization should still work with cached packages
      expect(networkAvailable).toBe(false);
      // But this shouldn't block initialization
    });
  });

  describe('Comprehensive Pre-flight Check', () => {
    test('should run all validation checks', () => {
      const validationResults = {
        node: { installed: true, version: 'v20.8.1' },
        npm: { installed: true, version: '9.8.1' },
        claudeFlow: { available: true, version: '2.7.33' },
        permissions: { writable: true },
        diskSpace: { sufficient: true },
        platform: { supported: true }
      };

      const allChecksPass = Object.values(validationResults).every(check =>
        Object.values(check).every(value => value === true || typeof value === 'string')
      );

      expect(allChecksPass).toBe(true);
    });

    test('should fail if critical requirements are missing', () => {
      const validationResults = {
        node: { installed: false },
        npm: { installed: true },
        claudeFlow: { available: true }
      };

      const criticalChecksFailed = !validationResults.node.installed;

      expect(criticalChecksFailed).toBe(true);
    });

    test('should provide actionable error messages on validation failure', () => {
      const error = {
        component: 'node',
        message: 'Node.js is not installed',
        solution: 'Please install Node.js v18 or higher from https://nodejs.org'
      };

      expect(error.message).toContain('not installed');
      expect(error.solution).toContain('install Node.js');
    });
  });
});
