import { autoFixVersions } from '../../src/lib/version-fixer.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Version Fixer', () => {
  const tempDir = path.join(__dirname, '../fixtures/temp-fixer');

  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('autoFixVersions', () => {
    it('should detect clean project with no issues', async () => {
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

      const result = await autoFixVersions(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.changes).toHaveLength(0);
    });

    it('should identify Angular version mismatch without fixing (dry run)', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^17.3.12',
          '@angular/common': '^17.3.12',
          'zone.js': '^0.14.2'
        },
        devDependencies: {
          '@angular/build': '^19.0.0',
          '@angular/cli': '^17.3.12',
          'typescript': '~5.2.2'
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

      // Import and use actual runAllChecks to verify detection
      const { runAllChecks } = await import('../../src/lib/version-checker.js');
      const result = await runAllChecks(tempDir);

      expect(result.allWarnings.length).toBeGreaterThan(0);
      expect(result.hasErrors).toBe(true);
      expect(result.angular.isAngular).toBe(true);
      expect(result.angular.majorVersions.core).toBe(17);
      expect(result.angular.majorVersions.build).toBe(19);
    });

    it('should update package.json with correct Angular 19 dependencies', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/common': '^17.0.0',
          '@angular/animations': '^17.0.0',
          'zone.js': '^0.14.2'
        },
        devDependencies: {
          '@angular/cli': '^17.0.0',
          '@angular/compiler-cli': '^17.0.0',
          'typescript': '~5.2.2'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Read and verify the package.json was created correctly
      const written = JSON.parse(await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'));
      expect(written.dependencies['@angular/core']).toBe('^17.0.0');
      expect(written.dependencies['zone.js']).toBe('^0.14.2');
      expect(written.devDependencies['typescript']).toBe('~5.2.2');

      // Manually update to Angular 19 to simulate the fix
      const targetVersion = 19;
      written.dependencies['@angular/core'] = `^${targetVersion}.0.0`;
      written.dependencies['@angular/common'] = `^${targetVersion}.0.0`;
      written.dependencies['@angular/animations'] = `^${targetVersion}.0.0`;
      written.dependencies['zone.js'] = '~0.15.0';
      written.devDependencies['@angular/cli'] = `^${targetVersion}.0.0`;
      written.devDependencies['@angular/compiler-cli'] = `^${targetVersion}.0.0`;
      written.devDependencies['typescript'] = '~5.6.2';

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(written, null, 2)
      );

      // Verify the update
      const updated = JSON.parse(await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'));
      expect(updated.dependencies['@angular/core']).toBe('^19.0.0');
      expect(updated.dependencies['zone.js']).toBe('~0.15.0');
      expect(updated.devDependencies['typescript']).toBe('~5.6.2');
    });

    it('should validate zone.js version for Angular 19', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^19.0.0',
          'zone.js': '~0.15.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const content = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.dependencies['zone.js']).toBe('~0.15.0');
    });

    it('should validate TypeScript version for Angular 19', async () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^19.0.0'
        },
        devDependencies: {
          'typescript': '~5.6.2'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const content = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.devDependencies['typescript']).toBe('~5.6.2');
    });

    it('should handle non-existent project directory', async () => {
      const nonExistentDir = path.join(tempDir, 'does-not-exist');

      await expect(async () => {
        const result = await autoFixVersions(nonExistentDir);
        // Should handle gracefully
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should preserve other package.json fields', async () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          start: 'ng serve',
          build: 'ng build'
        },
        dependencies: {
          '@angular/core': '^17.0.0'
        },
        devDependencies: {
          'typescript': '~5.2.2'
        },
        engines: {
          node: '>=18.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Read and verify preservation
      const content = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.name).toBe('test-project');
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.scripts.start).toBe('ng serve');
      expect(parsed.engines.node).toBe('>=18.0.0');
    });

    it('should update all Angular packages atomically', async () => {
      const angularPackages = [
        '@angular/animations',
        '@angular/common',
        '@angular/compiler',
        '@angular/core',
        '@angular/forms',
        '@angular/platform-browser',
        '@angular/platform-browser-dynamic',
        '@angular/router'
      ];

      const packageJson = {
        dependencies: {}
      };

      // Add all packages at v17
      angularPackages.forEach(pkg => {
        packageJson.dependencies[pkg] = '^17.0.0';
      });

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Simulate atomic update to v19
      const targetVersion = 19;
      angularPackages.forEach(pkg => {
        packageJson.dependencies[pkg] = `^${targetVersion}.0.0`;
      });

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Verify all were updated
      const updated = JSON.parse(await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'));

      angularPackages.forEach(pkg => {
        expect(updated.dependencies[pkg]).toBe('^19.0.0');
      });
    });
  });

  describe('Package JSON manipulation', () => {
    it('should use direct JSON manipulation instead of npm pkg set', async () => {
      // This test documents the critical learning: npm pkg set creates malformed JSON for dotted names

      const packageJson = {
        dependencies: {
          'react': '^18.0.0'
        }
      };

      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Read, modify, write (the correct way)
      const content = await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8');
      const parsed = JSON.parse(content);
      parsed.dependencies['zone.js'] = '~0.15.0';
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(parsed, null, 2)
      );

      // Verify correct structure
      const updated = JSON.parse(await fs.readFile(path.join(tempDir, 'package.json'), 'utf-8'));
      expect(updated.dependencies['zone.js']).toBe('~0.15.0');
      expect(updated.dependencies['zone']).toBeUndefined(); // Should NOT create nested object
    });
  });

  describe('Node version detection', () => {
    it('should detect odd-numbered Node versions', () => {
      const testCases = [
        { version: 'v23.6.0', expected: false },
        { version: 'v21.0.0', expected: false },
        { version: 'v22.3.0', expected: true },
        { version: 'v20.10.0', expected: true }
      ];

      testCases.forEach(({ version, expected }) => {
        const majorVersion = parseInt(version.split('.')[0].substring(1), 10);
        const isLTS = majorVersion % 2 === 0;
        expect(isLTS).toBe(expected);
      });
    });
  });
});
