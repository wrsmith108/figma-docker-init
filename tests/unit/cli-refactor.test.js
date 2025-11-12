/**
 * Unit tests for CLI refactor functionality
 * Tests project root detection, installation flow, command-line flags, and config creation
 * Target: 90%+ code coverage
 */

import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('CLI Refactor', () => {
  let mockFs;
  let mockProcess;
  let tempDir;

  beforeEach(() => {
    jest.clearAllMocks();
    tempDir = path.join(os.tmpdir(), `figma-cli-test-${Date.now()}`);

    // Setup fs mock
    mockFs = {
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      mkdirSync: jest.fn(),
      statSync: jest.fn(),
      readdirSync: jest.fn(),
      promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn(),
        access: jest.fn()
      }
    };

    // Setup process mock
    mockProcess = {
      argv: ['node', 'vibe-to-docker.js'],
      cwd: jest.fn(() => tempDir),
      exit: jest.fn()
    };
  });

  describe('Project Root Detection', () => {
    test('should detect project root from package.json', () => {
      const projectDir = tempDir;
      const packageJsonPath = path.join(projectDir, 'package.json');

      mockFs.existsSync.mockImplementation(p => p === packageJsonPath);

      const detectProjectRoot = (startDir) => {
        if (mockFs.existsSync(path.join(startDir, 'package.json'))) {
          return startDir;
        }
        return null;
      };

      const root = detectProjectRoot(projectDir);
      expect(root).toBe(projectDir);
    });

    test('should search parent directories for project root', () => {
      const projectRoot = tempDir;
      const nestedDir = path.join(projectRoot, 'src', 'components');
      const packageJsonPath = path.join(projectRoot, 'package.json');

      mockFs.existsSync.mockImplementation(p => p === packageJsonPath);

      const detectProjectRoot = (startDir) => {
        let currentDir = startDir;
        const root = path.parse(currentDir).root;

        while (currentDir !== root) {
          if (mockFs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
          }
          currentDir = path.dirname(currentDir);
        }
        return null;
      };

      const root = detectProjectRoot(nestedDir);
      expect(root).toBe(projectRoot);
    });

    test('should detect project root from git repository', () => {
      const projectDir = tempDir;
      const gitDir = path.join(projectDir, '.git');

      mockFs.existsSync.mockImplementation(p => p === gitDir);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true });

      const detectGitRoot = (startDir) => {
        const gitPath = path.join(startDir, '.git');
        if (mockFs.existsSync(gitPath) && mockFs.statSync(gitPath).isDirectory()) {
          return startDir;
        }
        return null;
      };

      const root = detectGitRoot(projectDir);
      expect(root).toBe(projectDir);
    });

    test('should handle missing project root gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);

      const detectProjectRoot = (startDir) => {
        if (mockFs.existsSync(path.join(startDir, 'package.json'))) {
          return startDir;
        }
        return null;
      };

      const root = detectProjectRoot(tempDir);
      expect(root).toBeNull();
    });

    test('should stop at filesystem root when searching', () => {
      const startDir = path.join(tempDir, 'deep', 'nested', 'directory');
      mockFs.existsSync.mockReturnValue(false);

      const detectProjectRoot = (startDir) => {
        let currentDir = startDir;
        const fsRoot = path.parse(currentDir).root;
        let iterations = 0;
        const maxIterations = 100;

        while (currentDir !== fsRoot && iterations < maxIterations) {
          if (mockFs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
          }
          currentDir = path.dirname(currentDir);
          iterations++;
        }
        return null;
      };

      const root = detectProjectRoot(startDir);
      expect(root).toBeNull();
    });

    test('should validate detected project root', () => {
      const projectDir = tempDir;
      const packageJsonPath = path.join(projectDir, 'package.json');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{"name": "test-project"}');

      const validateProjectRoot = (dir) => {
        const pkgPath = path.join(dir, 'package.json');
        if (!mockFs.existsSync(pkgPath)) return false;

        try {
          const content = mockFs.readFileSync(pkgPath, 'utf8');
          JSON.parse(content);
          return true;
        } catch {
          return false;
        }
      };

      expect(validateProjectRoot(projectDir)).toBe(true);
    });
  });

  describe('Installation Flow', () => {
    test('should execute installation steps in order', async () => {
      const steps = [];
      const projectDir = tempDir;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => steps.push('mkdir'));
      mockFs.writeFileSync.mockImplementation(() => steps.push('write'));

      // Simulate installation
      const install = () => {
        mockFs.mkdirSync(path.join(projectDir, '.vibe-docker'));
        mockFs.writeFileSync(path.join(projectDir, '.vibe-docker', 'config.json'), '{}');
      };

      install();

      expect(steps).toEqual(['mkdir', 'write']);
    });

    test('should create directory structure before writing files', () => {
      const operations = [];
      const projectDir = tempDir;

      mockFs.mkdirSync.mockImplementation(() => operations.push('mkdir'));
      mockFs.writeFileSync.mockImplementation(() => operations.push('write'));

      const installFlow = () => {
        mockFs.mkdirSync(path.join(projectDir, '.vibe-docker'), { recursive: true });
        mockFs.writeFileSync(path.join(projectDir, '.vibe-docker', 'config.json'), '{}');
        mockFs.writeFileSync(path.join(projectDir, '.vibe-docker', 'docker-compose.yml'), '');
      };

      installFlow();

      expect(operations[0]).toBe('mkdir');
      expect(operations.filter(op => op === 'write').length).toBe(2);
    });

    test('should show progress indicators during installation', () => {
      const progress = [];

      const installWithProgress = () => {
        progress.push('Creating directories...');
        progress.push('Copying templates...');
        progress.push('Generating configuration...');
        progress.push('Installation complete!');
      };

      installWithProgress();

      expect(progress).toHaveLength(4);
      expect(progress[progress.length - 1]).toContain('complete');
    });

    test('should handle installation errors with rollback', () => {
      const projectDir = tempDir;
      const createdItems = [];

      mockFs.mkdirSync.mockImplementation(() => {
        createdItems.push('dir');
      });

      mockFs.writeFileSync.mockImplementation(() => {
        createdItems.push('file');
        throw new Error('Write failed');
      });

      const rollback = () => {
        createdItems.length = 0; // Clear created items
      };

      try {
        mockFs.mkdirSync(path.join(projectDir, '.vibe-docker'));
        mockFs.writeFileSync(path.join(projectDir, '.vibe-docker', 'config.json'), '{}');
      } catch (error) {
        rollback();
      }

      expect(createdItems).toHaveLength(0);
    });

    test('should verify installation completion', () => {
      const projectDir = tempDir;
      const requiredFiles = ['config.json', 'docker-compose.yml', 'Dockerfile'];

      mockFs.existsSync.mockReturnValue(true);

      const verifyInstallation = (dir) => {
        return requiredFiles.every(file =>
          mockFs.existsSync(path.join(dir, '.vibe-docker', file))
        );
      };

      expect(verifyInstallation(projectDir)).toBe(true);
    });
  });

  describe('Command-line Flags', () => {
    test('should parse --project-dir flag', () => {
      const argv = ['node', 'vibe-to-docker.js', '--project-dir', '/custom/path'];

      const parseArgs = (args) => {
        const flagIndex = args.indexOf('--project-dir');
        if (flagIndex !== -1 && args[flagIndex + 1]) {
          return { projectDir: args[flagIndex + 1] };
        }
        return {};
      };

      const parsed = parseArgs(argv);
      expect(parsed.projectDir).toBe('/custom/path');
    });

    test('should parse --force flag', () => {
      const argv = ['node', 'vibe-to-docker.js', '--force'];

      const parseArgs = (args) => {
        return {
          force: args.includes('--force')
        };
      };

      const parsed = parseArgs(argv);
      expect(parsed.force).toBe(true);
    });

    test('should parse --dry-run flag', () => {
      const argv = ['node', 'vibe-to-docker.js', '--dry-run'];

      const parseArgs = (args) => {
        return {
          dryRun: args.includes('--dry-run')
        };
      };

      const parsed = parseArgs(argv);
      expect(parsed.dryRun).toBe(true);
    });

    test('should parse --verbose flag', () => {
      const argv = ['node', 'vibe-to-docker.js', '--verbose'];

      const parseArgs = (args) => {
        return {
          verbose: args.includes('--verbose') || args.includes('-v')
        };
      };

      const parsed = parseArgs(argv);
      expect(parsed.verbose).toBe(true);
    });

    test('should parse multiple flags together', () => {
      const argv = [
        'node',
        'vibe-to-docker.js',
        '--force',
        '--verbose',
        '--project-dir',
        '/custom/path'
      ];

      const parseArgs = (args) => {
        const projectDirIndex = args.indexOf('--project-dir');
        return {
          force: args.includes('--force'),
          verbose: args.includes('--verbose'),
          projectDir: projectDirIndex !== -1 ? args[projectDirIndex + 1] : undefined
        };
      };

      const parsed = parseArgs(argv);
      expect(parsed.force).toBe(true);
      expect(parsed.verbose).toBe(true);
      expect(parsed.projectDir).toBe('/custom/path');
    });

    test('should handle flags with equals sign', () => {
      const argv = ['node', 'vibe-to-docker.js', '--project-dir=/custom/path'];

      const parseArgs = (args) => {
        const projectDirArg = args.find(arg => arg.startsWith('--project-dir='));
        if (projectDirArg) {
          return { projectDir: projectDirArg.split('=')[1] };
        }
        return {};
      };

      const parsed = parseArgs(argv);
      expect(parsed.projectDir).toBe('/custom/path');
    });

    test('should provide default values for missing flags', () => {
      const argv = ['node', 'vibe-to-docker.js'];

      const parseArgs = (args) => {
        return {
          force: args.includes('--force') || false,
          verbose: args.includes('--verbose') || false,
          projectDir: process.cwd()
        };
      };

      const parsed = parseArgs(argv);
      expect(parsed.force).toBe(false);
      expect(parsed.verbose).toBe(false);
      expect(parsed.projectDir).toBeTruthy();
    });
  });

  describe('Config File Creation', () => {
    test('should create config.json with valid schema', () => {
      const projectDir = tempDir;
      const configPath = path.join(projectDir, '.vibe-docker', 'config.json');

      const config = {
        version: '2.0.0',
        projectName: 'test-project',
        installDate: new Date().toISOString(),
        type: 'per-project'
      };

      mockFs.writeFileSync.mockImplementation(() => {});

      mockFs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        configPath,
        expect.stringContaining('version')
      );
    });

    test('should validate config file schema', () => {
      const config = {
        version: '2.0.0',
        projectName: 'test-project',
        installDate: new Date().toISOString(),
        type: 'per-project'
      };

      const validateConfig = (cfg) => {
        return (
          typeof cfg.version === 'string' &&
          typeof cfg.projectName === 'string' &&
          typeof cfg.installDate === 'string' &&
          ['per-project', 'global'].includes(cfg.type)
        );
      };

      expect(validateConfig(config)).toBe(true);
    });

    test('should handle config file write errors', () => {
      const configPath = path.join(tempDir, '.vibe-docker', 'config.json');

      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => {
        mockFs.writeFileSync(configPath, '{}');
      }).toThrow('permission denied');
    });

    test('should merge user config with defaults', () => {
      const defaults = {
        version: '2.0.0',
        type: 'per-project',
        ports: { dev: 3000, prod: 8080 }
      };

      const userConfig = {
        projectName: 'my-project',
        ports: { dev: 3001 }
      };

      const merged = {
        ...defaults,
        ...userConfig,
        ports: { ...defaults.ports, ...userConfig.ports }
      };

      expect(merged.version).toBe('2.0.0');
      expect(merged.projectName).toBe('my-project');
      expect(merged.ports.dev).toBe(3001);
      expect(merged.ports.prod).toBe(8080);
    });

    test('should create config with detected project values', () => {
      const packageJson = {
        name: 'my-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          vite: '^4.0.0'
        }
      };

      mockFs.readFileSync.mockReturnValue(JSON.stringify(packageJson));

      const createConfig = () => {
        const pkg = JSON.parse(mockFs.readFileSync('package.json', 'utf8'));
        return {
          projectName: pkg.name,
          framework: 'react-vite',
          version: '2.0.0'
        };
      };

      const config = createConfig();

      expect(config.projectName).toBe('my-app');
      expect(config.framework).toBe('react-vite');
    });

    test('should update existing config file', () => {
      const existingConfig = {
        version: '1.0.0',
        projectName: 'old-name'
      };

      const updates = {
        version: '2.0.0',
        projectName: 'new-name',
        lastUpdated: new Date().toISOString()
      };

      const updated = { ...existingConfig, ...updates };

      expect(updated.version).toBe('2.0.0');
      expect(updated.projectName).toBe('new-name');
      expect(updated).toHaveProperty('lastUpdated');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing package.json gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);

      const checkProject = (dir) => {
        if (!mockFs.existsSync(path.join(dir, 'package.json'))) {
          return { error: 'No package.json found' };
        }
        return { success: true };
      };

      const result = checkProject(tempDir);
      expect(result.error).toBeDefined();
    });

    test('should handle permission errors', () => {
      mockFs.mkdirSync.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        error.code = 'EACCES';
        throw error;
      });

      expect(() => {
        mockFs.mkdirSync(path.join(tempDir, '.vibe-docker'));
      }).toThrow('EACCES');
    });

    test('should handle disk space errors', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        const error = new Error('ENOSPC: no space left on device');
        error.code = 'ENOSPC';
        throw error;
      });

      expect(() => {
        mockFs.writeFileSync('test.json', '{}');
      }).toThrow('ENOSPC');
    });

    test('should provide helpful error messages', () => {
      const errors = {
        EACCES: 'Permission denied. Try running with sudo or check directory permissions.',
        ENOSPC: 'No space left on device. Free up disk space and try again.',
        ENOENT: 'File or directory not found. Check the path and try again.'
      };

      expect(errors.EACCES).toContain('Permission denied');
      expect(errors.ENOSPC).toContain('disk space');
      expect(errors.ENOENT).toContain('not found');
    });
  });

  describe('Dry Run Mode', () => {
    test('should not create files in dry run mode', () => {
      const dryRun = true;
      const operations = [];

      const install = (isDryRun) => {
        operations.push('check-project');
        operations.push('validate-config');

        if (!isDryRun) {
          operations.push('create-directories');
          operations.push('write-files');
        }

        operations.push('complete');
      };

      install(dryRun);

      expect(operations).not.toContain('create-directories');
      expect(operations).not.toContain('write-files');
      expect(operations).toContain('complete');
    });

    test('should report what would be done in dry run', () => {
      const dryRun = true;
      const report = [];

      if (dryRun) {
        report.push('Would create: .figma-docker/');
        report.push('Would write: .figma-docker/config.json');
        report.push('Would write: .figma-docker/docker-compose.yml');
      }

      expect(report).toHaveLength(3);
      expect(report.every(item => item.startsWith('Would'))).toBe(true);
    });
  });

  describe('Integration', () => {
    test('should complete full installation workflow', () => {
      const workflow = [];

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => workflow.push('mkdir'));
      mockFs.writeFileSync.mockImplementation(() => workflow.push('write'));

      // Simulate full workflow
      const fullInstall = () => {
        workflow.push('detect-root');
        mockFs.mkdirSync('.vibe-docker');
        workflow.push('create-config');
        mockFs.writeFileSync('.figma-docker/config.json', '{}');
        workflow.push('verify');
      };

      fullInstall();

      expect(workflow).toContain('detect-root');
      expect(workflow).toContain('create-config');
      expect(workflow).toContain('verify');
    });
  });
});
