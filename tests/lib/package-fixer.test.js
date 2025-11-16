import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  validatePackageJson,
  fixPackageJson,
  needsFixing
} from '../../src/lib/package-fixer.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('package-fixer', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'package-fixer-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('validatePackageJson', () => {
    test('should return valid for non-TypeScript project', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(true);
      expect(result.isTypeScript).toBe(false);
      expect(result.issues).toEqual([]);
      expect(result.fixes).toEqual([]);
    });

    test('should detect missing @types/react for TypeScript project', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(false);
      expect(result.isTypeScript).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0]).toMatchObject({
        type: 'missing_types',
        package: '@types/react',
        severity: 'warning'
      });
      expect(result.fixes).toHaveLength(1);
      expect(result.fixes[0]).toContain('@types/react');
    });

    test('should detect missing @types/react-dom', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(false);
      expect(result.isTypeScript).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].package).toBe('@types/react-dom');
      expect(result.fixes).toHaveLength(1);
    });

    test('should detect both missing @types/react and @types/react-dom', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(2);
      expect(result.fixes).toHaveLength(2);
      expect(result.issues.map(i => i.package)).toContain('@types/react');
      expect(result.issues.map(i => i.package)).toContain('@types/react-dom');
    });

    test('should return valid when @types packages are present', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.fixes).toEqual([]);
    });

    test('should handle missing package.json', async () => {
      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.issues[0].type).toBe('read_error');
    });

    test('should handle invalid JSON', async () => {
      await fs.writeFile(path.join(tempDir, 'package.json'), 'invalid json {{{');

      const result = await validatePackageJson(tempDir);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.issues[0].type).toBe('read_error');
    });

    test('should detect TypeScript from dependencies', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          typescript: '^5.0.0',
          react: '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.isTypeScript).toBe(true);
      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    test('should detect TypeScript from tsc script', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        scripts: {
          build: 'tsc && vite build'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.isTypeScript).toBe(true);
    });

    test('should provide suggestions for fixing', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('TypeScript types');
    });

    test('should map React 19 to correct types version', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^19.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await validatePackageJson(tempDir);

      expect(result.issues[0].fix.version).toBe('^19.0.0');
    });
  });

  describe('fixPackageJson', () => {
    test('should not modify valid package.json', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixPackageJson(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.message).toBe('No issues found');
      expect(result.applied).toEqual([]);
    });

    test('should add missing @types/react', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixPackageJson(tempDir);

      expect(result.fixed).toBe(true);
      expect(result.applied).toHaveLength(1);
      expect(result.applied[0]).toMatchObject({
        package: '@types/react',
        version: '^18.2.0',
        type: 'devDependency'
      });

      // Verify package.json was updated
      const updatedContent = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const updatedPackageJson = JSON.parse(updatedContent);
      expect(updatedPackageJson.devDependencies['@types/react']).toBe('^18.2.0');
    });

    test('should create backup by default', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await fixPackageJson(tempDir);

      // Check for backup file
      const backupExists = await fs.access(path.join(tempDir, 'package.json.backup'))
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(true);
    });

    test('should not create backup when backup option is false', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await fixPackageJson(tempDir, { backup: false });

      // Check no backup file exists
      const backupExists = await fs.access(path.join(tempDir, 'package.json.backup'))
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(false);
    });

    test('should perform dry run without modifying files', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      const originalContent = JSON.stringify(packageJson, null, 2);
      await fs.writeFile(path.join(tempDir, 'package.json'), originalContent);

      const result = await fixPackageJson(tempDir, { dryRun: true });

      expect(result.fixed).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.applied).toHaveLength(1);

      // Verify package.json was NOT modified
      const content = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      expect(content).toBe(originalContent);
    });

    test('should initialize devDependencies if missing', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixPackageJson(tempDir);

      expect(result.fixed).toBe(true);

      // Verify devDependencies was created
      const updatedContent = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const updatedPackageJson = JSON.parse(updatedContent);
      expect(updatedPackageJson.devDependencies).toBeDefined();
      expect(updatedPackageJson.devDependencies['@types/react']).toBe('^18.2.0');
    });

    test('should handle multiple missing type packages', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixPackageJson(tempDir);

      expect(result.fixed).toBe(true);
      expect(result.applied).toHaveLength(2);
      expect(result.applied.map(a => a.package)).toContain('@types/react');
      expect(result.applied.map(a => a.package)).toContain('@types/react-dom');
    });

    test('should provide next steps after fixing', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixPackageJson(tempDir);

      expect(result.nextSteps).toBeDefined();
      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.nextSteps[0]).toContain('npm install');
    });

    test('should handle read error gracefully', async () => {
      const result = await fixPackageJson(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to read package.json');
    });
  });

  describe('needsFixing', () => {
    test('should return true for package.json needing fixes', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await needsFixing(tempDir);

      expect(result).toBe(true);
    });

    test('should return false for valid package.json', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/react': '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await needsFixing(tempDir);

      expect(result).toBe(false);
    });

    test('should return false for non-TypeScript project', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await needsFixing(tempDir);

      expect(result).toBe(false);
    });

    test('should return false for missing package.json', async () => {
      const result = await needsFixing(tempDir);

      expect(result).toBe(false);
    });
  });
});
