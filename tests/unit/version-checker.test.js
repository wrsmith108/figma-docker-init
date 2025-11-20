import { checkNodeVersion, checkAngularVersions, checkDependencyConflicts, runAllChecks } from '../../src/lib/version-checker.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Version Checker', () => {
  describe('checkNodeVersion', () => {
    const originalVersion = process.version;

    afterEach(() => {
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true,
        configurable: true
      });
    });

    it('should detect odd-numbered Node.js versions', () => {
      Object.defineProperty(process, 'version', {
        value: 'v23.6.0',
        writable: true,
        configurable: true
      });

      const result = checkNodeVersion();

      expect(result.version).toBe('v23.6.0');
      expect(result.majorVersion).toBe(23);
      expect(result.isLTS).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('node_version');
      expect(result.warnings[0].severity).toBe('warning');
    });

    it('should accept even-numbered LTS versions', () => {
      Object.defineProperty(process, 'version', {
        value: 'v22.3.0',
        writable: true,
        configurable: true
      });

      const result = checkNodeVersion();

      expect(result.version).toBe('v22.3.0');
      expect(result.majorVersion).toBe(22);
      expect(result.isLTS).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should accept Node.js v20 LTS', () => {
      Object.defineProperty(process, 'version', {
        value: 'v20.10.0',
        writable: true,
        configurable: true
      });

      const result = checkNodeVersion();

      expect(result.isLTS).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('checkAngularVersions', () => {
    const tempDir = path.join(__dirname, '../fixtures/temp-angular-check');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should detect Angular version mismatch', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^17.3.12',
          '@angular/common': '^17.3.12'
        },
        devDependencies: {
          '@angular/build': '^19.0.0',
          '@angular/cli': '^17.3.12'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkAngularVersions(tempDir);

      expect(result.isAngular).toBe(true);
      expect(result.majorVersions.core).toBe(17);
      expect(result.majorVersions.build).toBe(19);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('angular_version_mismatch');
      expect(result.warnings[0].severity).toBe('error');
    });

    it('should detect CLI version mismatch', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^19.0.0'
        },
        devDependencies: {
          '@angular/cli': '^17.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkAngularVersions(tempDir);

      expect(result.isAngular).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('angular_cli_mismatch');
    });

    it('should pass when Angular versions match', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^19.0.0',
          '@angular/common': '^19.0.0'
        },
        devDependencies: {
          '@angular/build': '^19.0.0',
          '@angular/cli': '^19.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkAngularVersions(tempDir);

      expect(result.isAngular).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return isAngular=false for non-Angular projects', async () => {
      const packageJson = {
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkAngularVersions(tempDir);

      expect(result.isAngular).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle missing package.json gracefully', async () => {
      const result = await checkAngularVersions(tempDir);

      expect(result.isAngular).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('checkDependencyConflicts', () => {
    const tempDir = path.join(__dirname, '../fixtures/temp-dep-check');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should detect duplicate dependencies', async () => {
      const packageJson = {
        dependencies: {
          'typescript': '^5.0.0',
          'lodash': '^4.0.0'
        },
        devDependencies: {
          'typescript': '^5.2.0',
          'jest': '^29.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkDependencyConflicts(tempDir);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toContain('typescript');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('duplicate_dependencies');
    });

    it('should pass with no duplicate dependencies', async () => {
      const packageJson = {
        dependencies: {
          'react': '^18.0.0'
        },
        devDependencies: {
          'jest': '^29.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await checkDependencyConflicts(tempDir);

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('runAllChecks', () => {
    const tempDir = path.join(__dirname, '../fixtures/temp-all-checks');

    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should combine all warnings and sort by severity', async () => {
      // Create package.json with multiple issues
      const packageJson = {
        dependencies: {
          '@angular/core': '^17.0.0',
          'typescript': '^5.0.0'
        },
        devDependencies: {
          '@angular/build': '^19.0.0',
          'typescript': '^5.2.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock odd Node version
      Object.defineProperty(process, 'version', {
        value: 'v23.0.0',
        writable: true,
        configurable: true
      });

      const result = await runAllChecks(tempDir);

      expect(result.allWarnings.length).toBeGreaterThan(0);
      expect(result.hasErrors).toBe(true);
      expect(result.hasWarnings).toBe(true);

      // Verify error warnings come first
      const firstWarning = result.allWarnings[0];
      expect(firstWarning.severity).toBe('error');
    });

    it('should return empty warnings for clean project', async () => {
      const packageJson = {
        dependencies: {
          'react': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Mock even Node version
      Object.defineProperty(process, 'version', {
        value: 'v20.10.0',
        writable: true,
        configurable: true
      });

      const result = await runAllChecks(tempDir);

      expect(result.allWarnings).toHaveLength(0);
      expect(result.hasErrors).toBe(false);
      expect(result.hasWarnings).toBe(false);
    });
  });
});
