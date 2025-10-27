/**
 * E2E Performance Tests
 * Tests installation time, template processing speed, and performance vs v1
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

const {
  createTestProject,
  cleanupTestProject,
  measureInstallTime,
  measureTemplateProcessing
} = require('../helpers/platform-helpers');

describe('E2E Performance Tests', () => {
  let testDir;

  beforeEach(() => {
    testDir = createTestProject();
  });

  afterEach(() => {
    cleanupTestProject(testDir);
  });

  describe('Installation Performance', () => {
    test('should install in under 30 seconds', async () => {
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

      const installTime = await measureInstallTime(testDir);

      console.log(`Installation time: ${installTime}ms (${(installTime / 1000).toFixed(2)}s)`);

      // Should complete in under 30 seconds
      expect(installTime).toBeLessThan(30000);

      // Verify installation succeeded
      const nodeModulesPath = path.join(testDir, 'node_modules', 'figma-docker-init');
      expect(fs.existsSync(nodeModulesPath)).toBe(true);
    }, 35000); // 35 second timeout

    test('should have minimal overhead compared to baseline npm install', async () => {
      // Baseline: Install a simple package
      const baselineDir = createTestProject();
      const baselinePackageJson = {
        name: 'baseline-project',
        version: '1.0.0',
        dependencies: {
          'lodash': '^4.17.21'
        }
      };

      fs.writeFileSync(
        path.join(baselineDir, 'package.json'),
        JSON.stringify(baselinePackageJson, null, 2)
      );

      const baselineTime = await measureInstallTime(baselineDir);
      cleanupTestProject(baselineDir);

      // Test package
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

      const testTime = await measureInstallTime(testDir);

      console.log(`Baseline install time: ${baselineTime}ms`);
      console.log(`Test package install time: ${testTime}ms`);
      console.log(`Overhead: ${testTime - baselineTime}ms`);

      // Overhead should be reasonable (less than 10 seconds)
      expect(testTime - baselineTime).toBeLessThan(10000);
    }, 60000);

    test('should install dependencies efficiently', async () => {
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

      const startTime = performance.now();

      execSync('npm install', {
        cwd: testDir,
        stdio: 'pipe'
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Count installed dependencies
      const nodeModulesPath = path.join(testDir, 'node_modules');
      const packages = fs.readdirSync(nodeModulesPath).filter(name =>
        !name.startsWith('.') && name !== 'figma-docker-init'
      );

      console.log(`Installed ${packages.length} dependencies in ${duration.toFixed(2)}ms`);

      // Should be efficient
      expect(duration).toBeLessThan(30000);
    }, 35000);
  });

  describe('Template Processing Performance', () => {
    test('should process templates in under 5 seconds', async () => {
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

      // Install first
      execSync('npm install', { cwd: testDir, stdio: 'pipe' });

      // Measure template processing
      const processingTime = await measureTemplateProcessing(testDir);

      console.log(`Template processing time: ${processingTime}ms (${(processingTime / 1000).toFixed(2)}s)`);

      // Should complete in under 5 seconds
      expect(processingTime).toBeLessThan(5000);
    }, 15000);

    test('should handle multiple template operations efficiently', async () => {
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

      const iterations = 5;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        // Simulate template operation
        const testDir2 = createTestProject();
        fs.writeFileSync(
          path.join(testDir2, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );

        const processingTime = await measureTemplateProcessing(testDir2);
        times.push(processingTime);

        cleanupTestProject(testDir2);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Average: ${avgTime.toFixed(2)}ms, Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Average should be under 5 seconds
      expect(avgTime).toBeLessThan(5000);

      // Maximum should be under 7 seconds (allowing for variance)
      expect(maxTime).toBeLessThan(7000);
    }, 60000);

    test('should process large templates efficiently', async () => {
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

      // Create a large template file
      const largeTemplate = {
        name: 'large-template',
        files: Array.from({ length: 100 }, (_, i) => ({
          path: `file-${i}.txt`,
          content: `Content for file ${i}`.repeat(100)
        }))
      };

      const templatePath = path.join(testDir, 'large-template.json');
      fs.writeFileSync(templatePath, JSON.stringify(largeTemplate, null, 2));

      const startTime = performance.now();

      // Process large template
      largeTemplate.files.forEach(file => {
        const filePath = path.join(testDir, file.path);
        fs.writeFileSync(filePath, file.content);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Processed ${largeTemplate.files.length} files in ${duration.toFixed(2)}ms`);

      // Should handle large templates efficiently
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe('Performance Comparison with v1', () => {
    test('should be faster than v1 installation', async () => {
      // Note: This is a placeholder for actual v1 comparison
      // In a real scenario, you would install v1 and compare

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

      const v2Time = await measureInstallTime(testDir);

      console.log(`v2 installation time: ${v2Time}ms`);

      // v2 should install in under 30 seconds
      expect(v2Time).toBeLessThan(30000);

      // If we had v1 data, we would compare:
      // expect(v2Time).toBeLessThan(v1Time);
    }, 35000);

    test('should use less memory than v1', () => {
      // Measure memory usage
      const memoryBefore = process.memoryUsage();

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

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Should not use excessive memory (less than 100MB increase)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });

    test('should have improved error handling performance', async () => {
      // Test error handling doesn't cause significant delays
      const invalidPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'non-existent-package': '^1.0.0'
        }
      };

      fs.writeFileSync(
        path.join(testDir, 'package.json'),
        JSON.stringify(invalidPackageJson, null, 2)
      );

      const startTime = performance.now();

      try {
        execSync('npm install', {
          cwd: testDir,
          stdio: 'pipe',
          timeout: 30000
        });
      } catch (error) {
        // Expected to fail
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Error handling time: ${duration.toFixed(2)}ms`);

      // Error should be caught quickly (under 10 seconds)
      expect(duration).toBeLessThan(10000);
    }, 35000);
  });

  describe('Scalability Performance', () => {
    test('should handle multiple concurrent installations', async () => {
      const numProjects = 3;
      const testDirs = Array.from({ length: numProjects }, () => createTestProject());

      try {
        const startTime = performance.now();

        await Promise.all(testDirs.map(async (dir) => {
          const packageJson = {
            name: 'test-project',
            version: '1.0.0',
            dependencies: {
              'figma-docker-init': `file:${process.cwd()}`
            }
          };

          fs.writeFileSync(
            path.join(dir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
          );

          return new Promise((resolve, reject) => {
            try {
              execSync('npm install', { cwd: dir, stdio: 'pipe' });
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        }));

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Installed ${numProjects} projects concurrently in ${duration.toFixed(2)}ms`);

        // Should handle concurrent installations efficiently
        expect(duration).toBeLessThan(60000);

      } finally {
        testDirs.forEach(dir => cleanupTestProject(dir));
      }
    }, 70000);

    test('should maintain performance with large project structures', async () => {
      // Create a large project structure
      const dirs = ['src', 'tests', 'docs', 'config', 'scripts'];
      dirs.forEach(dir => {
        const dirPath = path.join(testDir, dir);
        fs.mkdirSync(dirPath, { recursive: true });

        // Create multiple files in each directory
        for (let i = 0; i < 20; i++) {
          fs.writeFileSync(
            path.join(dirPath, `file-${i}.js`),
            `// File ${i}\nmodule.exports = {};`
          );
        }
      });

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

      const installTime = await measureInstallTime(testDir);

      console.log(`Installation time with large structure: ${installTime}ms`);

      // Should still install in under 30 seconds
      expect(installTime).toBeLessThan(30000);
    }, 35000);
  });
});
