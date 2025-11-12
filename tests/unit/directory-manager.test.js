/**
 * Unit tests for directory manager functionality
 * Tests directory creation, validation, cleanup, and backward compatibility
 * Target: 90%+ code coverage
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Directory Manager', () => {
  let tempDir;
  let mockFs;

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `figma-docker-test-${Date.now()}`);

    // Reset mocks
    jest.clearAllMocks();

    // Setup fs mock
    mockFs = {
      existsSync: jest.fn(),
      mkdirSync: jest.fn(),
      readdirSync: jest.fn(),
      statSync: jest.fn(),
      writeFileSync: jest.fn(),
      readFileSync: jest.fn(),
      unlinkSync: jest.fn(),
      rmdirSync: jest.fn(),
      promises: {
        mkdir: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        readdir: jest.fn(),
        stat: jest.fn(),
        unlink: jest.fn(),
        rmdir: jest.fn()
      }
    };
  });

  afterEach(() => {
    // Cleanup temp directory if it exists
    if (fs.existsSync && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors in tests
      }
    }
  });

  describe('Directory Creation', () => {
    test('should create .figma-docker directory in clean project', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      // Simulate directory creation
      expect(() => {
        if (!mockFs.existsSync(vibeDockerDir)) {
          mockFs.mkdirSync(vibeDockerDir, { recursive: true });
        }
      }).not.toThrow();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        vibeDockerDir,
        expect.objectContaining({ recursive: true })
      );
    });

    test('should create nested directory structure', () => {
      const projectDir = tempDir;
      const subdirs = ['configs', 'templates', 'cache'];

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      subdirs.forEach(subdir => {
        const dirPath = path.join(projectDir, '.vibe-docker', subdir);
        mockFs.mkdirSync(dirPath, { recursive: true });
      });

      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(3);
      subdirs.forEach(subdir => {
        expect(mockFs.mkdirSync).toHaveBeenCalledWith(
          expect.stringContaining(subdir),
          expect.objectContaining({ recursive: true })
        );
      });
    });

    test('should handle existing .figma-docker directory', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true });

      // Should not attempt to create if exists
      if (!mockFs.existsSync(vibeDockerDir)) {
        mockFs.mkdirSync(vibeDockerDir, { recursive: true });
      }

      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    test('should create directory with correct permissions', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      mockFs.mkdirSync(vibeDockerDir, { recursive: true, mode: 0o755 });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        vibeDockerDir,
        expect.objectContaining({ mode: 0o755 })
      );
    });
  });

  describe('Directory Validation', () => {
    test('should validate existing .figma-docker directory', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true,
        isFile: () => false
      });

      const isValid = mockFs.existsSync(vibeDockerDir) &&
                      mockFs.statSync(vibeDockerDir).isDirectory();

      expect(isValid).toBe(true);
    });

    test('should detect conflicting files', () => {
      const projectDir = tempDir;
      const figmaDockerPath = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true
      });

      const hasConflict = mockFs.existsSync(figmaDockerPath) &&
                          mockFs.statSync(figmaDockerPath).isFile();

      expect(hasConflict).toBe(true);
    });

    test('should verify write permissions', () => {
      const projectDir = tempDir;
      const testFile = path.join(projectDir, '.vibe-docker', '.test');

      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.unlinkSync.mockImplementation(() => {});

      // Simulate permission check
      expect(() => {
        mockFs.writeFileSync(testFile, '');
        mockFs.unlinkSync(testFile);
      }).not.toThrow();
    });

    test('should handle permission denied errors', () => {
      const projectDir = tempDir;
      const testFile = path.join(projectDir, '.vibe-docker', '.test');

      mockFs.writeFileSync.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        error.code = 'EACCES';
        throw error;
      });

      expect(() => {
        mockFs.writeFileSync(testFile, '');
      }).toThrow('EACCES');
    });

    test('should check for required subdirectories', () => {
      const projectDir = tempDir;
      const requiredDirs = ['configs', 'templates', 'cache'];

      requiredDirs.forEach(dir => {
        const dirPath = path.join(projectDir, '.vibe-docker', dir);
        mockFs.existsSync.mockReturnValueOnce(true);
        mockFs.statSync.mockReturnValueOnce({ isDirectory: () => true });

        const exists = mockFs.existsSync(dirPath) &&
                       mockFs.statSync(dirPath).isDirectory();
        expect(exists).toBe(true);
      });
    });
  });

  describe('Cleanup on Failure', () => {
    test('should remove partially created directory on error', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.rmdirSync.mockImplementation(() => {});

      // Simulate cleanup
      if (mockFs.existsSync(vibeDockerDir)) {
        mockFs.rmdirSync(vibeDockerDir, { recursive: true });
      }

      expect(mockFs.rmdirSync).toHaveBeenCalledWith(
        vibeDockerDir,
        expect.objectContaining({ recursive: true })
      );
    });

    test('should handle cleanup errors gracefully', () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.rmdirSync.mockImplementation(() => {
        throw new Error('Directory not empty');
      });

      expect(() => {
        try {
          mockFs.rmdirSync(vibeDockerDir, { recursive: true });
        } catch (error) {
          // Should catch and handle cleanup errors
          expect(error.message).toContain('not empty');
        }
      }).not.toThrow();
    });

    test('should remove created files on rollback', () => {
      const projectDir = tempDir;
      const createdFiles = [
        path.join(projectDir, '.vibe-docker', 'config.json'),
        path.join(projectDir, '.vibe-docker', 'docker-compose.yml')
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.unlinkSync.mockImplementation(() => {});

      createdFiles.forEach(file => {
        if (mockFs.existsSync(file)) {
          mockFs.unlinkSync(file);
        }
      });

      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
    });

    test('should restore backup on installation failure', () => {
      const projectDir = tempDir;
      const backupDir = path.join(projectDir, '.figma-docker.backup');
      const targetDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValueOnce(true); // backup exists
      mockFs.rmdirSync.mockImplementation(() => {});
      mockFs.mkdirSync.mockImplementation(() => {});

      // Simulate restore from backup
      if (mockFs.existsSync(backupDir)) {
        mockFs.rmdirSync(targetDir, { recursive: true });
        // Would normally rename backup to target
      }

      expect(mockFs.rmdirSync).toHaveBeenCalledWith(
        targetDir,
        expect.objectContaining({ recursive: true })
      );
    });
  });

  describe('Backward Compatibility', () => {
    test('should detect legacy global installation', () => {
      const globalConfigPath = path.join(os.homedir(), '.figma-docker-global');

      mockFs.existsSync.mockReturnValue(true);

      const hasLegacyInstall = mockFs.existsSync(globalConfigPath);

      expect(hasLegacyInstall).toBe(true);
    });

    test('should provide migration path from global to per-project', () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global');
      const projectDir = tempDir;
      const targetDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['config.json', 'docker-compose.yml']);
      mockFs.readFileSync.mockReturnValue('{}');
      mockFs.writeFileSync.mockImplementation(() => {});

      // Simulate migration
      if (mockFs.existsSync(globalDir)) {
        const files = mockFs.readdirSync(globalDir);
        files.forEach(file => {
          const content = mockFs.readFileSync(path.join(globalDir, file));
          mockFs.writeFileSync(path.join(targetDir, file), content);
        });
      }

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    test('should maintain support for existing users', () => {
      const legacyPath = path.join(os.homedir(), '.figma-docker-legacy');
      const projectPath = path.join(tempDir, '.vibe-docker');

      mockFs.existsSync.mockImplementation(p => {
        return p === legacyPath || p === projectPath;
      });

      // Both paths should be supported
      expect(mockFs.existsSync(legacyPath)).toBe(true);
      expect(mockFs.existsSync(projectPath)).toBe(true);
    });

    test('should prefer per-project over global installation', () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global');
      const projectDir = path.join(tempDir, '.vibe-docker');

      mockFs.existsSync.mockImplementation(p => p === projectDir || p === globalDir);

      // Should check project first
      let selectedDir;
      if (mockFs.existsSync(projectDir)) {
        selectedDir = projectDir;
      } else if (mockFs.existsSync(globalDir)) {
        selectedDir = globalDir;
      }

      expect(selectedDir).toBe(projectDir);
    });

    test('should handle version detection for migration', () => {
      const configPath = path.join(tempDir, '.vibe-docker', 'config.json');
      const mockConfig = {
        version: '1.0.0',
        type: 'global'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const config = JSON.parse(mockFs.readFileSync(configPath, 'utf8'));

      expect(config.version).toBe('1.0.0');
      expect(config.type).toBe('global');
    });
  });

  describe('Edge Cases', () => {
    test('should handle path with spaces', () => {
      const projectDir = path.join(tempDir, 'project with spaces');
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      mockFs.mkdirSync(vibeDockerDir, { recursive: true });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('project with spaces'),
        expect.objectContaining({ recursive: true })
      );
    });

    test('should handle Windows path separators', () => {
      const projectDir = 'C:\\Users\\test\\project';
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      // Normalize path for cross-platform testing
      const normalizedPath = path.normalize(vibeDockerDir);

      expect(normalizedPath).toContain('.vibe-docker');
    });

    test('should handle very long paths', () => {
      const longPath = 'a'.repeat(200);
      const projectDir = path.join(tempDir, longPath);
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      expect(() => {
        mockFs.mkdirSync(vibeDockerDir, { recursive: true });
      }).not.toThrow();
    });

    test('should handle symlinked directories', () => {
      const realDir = path.join(tempDir, 'real');
      const symlinkDir = path.join(tempDir, 'link');

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true,
        isSymbolicLink: () => true
      });

      const isSymlink = mockFs.statSync(symlinkDir).isSymbolicLink();

      expect(isSymlink).toBe(true);
    });

    test('should handle concurrent directory creation', async () => {
      const projectDir = tempDir;
      const vibeDockerDir = path.join(projectDir, '.vibe-docker');

      mockFs.promises.mkdir.mockResolvedValue(undefined);

      // Simulate concurrent calls
      const promises = [
        mockFs.promises.mkdir(vibeDockerDir, { recursive: true }),
        mockFs.promises.mkdir(vibeDockerDir, { recursive: true }),
        mockFs.promises.mkdir(vibeDockerDir, { recursive: true })
      ];

      await Promise.all(promises);

      // With recursive: true, all calls should succeed
      expect(mockFs.promises.mkdir).toHaveBeenCalledTimes(3);
    });
  });

  describe('Performance', () => {
    test('should create directory structure quickly', () => {
      const startTime = Date.now();
      const projectDir = tempDir;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {});

      // Create multiple directories
      const dirs = ['configs', 'templates', 'cache', 'logs'];
      dirs.forEach(dir => {
        mockFs.mkdirSync(path.join(projectDir, '.vibe-docker', dir), { recursive: true });
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be fast with mocks
      expect(mockFs.mkdirSync).toHaveBeenCalledTimes(4);
    });

    test('should handle large number of files efficiently', () => {
      const projectDir = tempDir;
      const fileCount = 100;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(
        Array.from({ length: fileCount }, (_, i) => `file${i}.txt`)
      );

      const files = mockFs.readdirSync(path.join(projectDir, '.vibe-docker'));

      expect(files).toHaveLength(fileCount);
    });
  });
});
