/**
 * Framework Detector Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FrameworkDetector } from '../../src/detectors/framework-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FrameworkDetector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    detector = new FrameworkDetector();
    testDir = path.join(os.tmpdir(), `framework-detector-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('detect', () => {
    it('should detect React framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toContain('react');
      expect(result.primary).toBe('react');
      expect(result.confidence).toBe(0.95);
      expect(result.details.react).toBeDefined();
    });

    it('should detect Next.js framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { next: '^13.0.0', react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toContain('nextjs');
      expect(result.primary).toBe('nextjs'); // nextjs has higher priority
      expect(result.confidence).toBe(0.95);
    });

    it('should detect Vue framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { vue: '^3.3.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toContain('vue');
      expect(result.primary).toBe('vue');
      expect(result.confidence).toBe(0.95);
    });

    it('should detect Svelte framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { svelte: '^3.59.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toContain('svelte');
      expect(result.primary).toBe('svelte');
    });

    it('should detect Angular framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { '@angular/core': '^15.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toContain('angular');
      expect(result.primary).toBe('angular');
    });

    it('should detect multiple frameworks', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: { next: '^13.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks.length).toBeGreaterThan(1);
      expect(result.frameworks).toContain('react');
      expect(result.frameworks).toContain('nextjs');
      expect(result.count).toBe(2);
    });

    it('should return unknown framework when none detected', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { lodash: '^4.17.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.frameworks).toEqual([]);
      expect(result.primary).toBe('unknown');
      expect(result.confidence).toBe(0.0);
      expect(result.count).toBe(0);
    });

    it('should return empty object when package.json not found', async () => {
      const result = await detector.detect(testDir);

      expect(result.frameworks).toEqual([]);
      expect(result.primary).toBe('unknown');
      expect(result.confidence).toBe(0.0);
    });

    it('should include version details', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.details.react).toBeDefined();
      expect(result.details.react.react).toBe('^18.2.0');
    });
  });

  describe('hasFramework', () => {
    it('should return true if framework exists', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasReact = await detector.hasFramework(testDir, 'react');
      expect(hasReact).toBe(true);
    });

    it('should return false if framework not found', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasVue = await detector.hasFramework(testDir, 'vue');
      expect(hasVue).toBe(false);
    });
  });

  describe('getFrameworkVersion', () => {
    it('should return framework version', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getFrameworkVersion(testDir, 'react');
      expect(version).toBe('^18.2.0');
    });

    it('should return null for missing framework', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {}
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getFrameworkVersion(testDir, 'react');
      expect(version).toBeNull();
    });
  });
});
