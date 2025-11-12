/**
 * Backend Detector Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { BackendDetector } from '../../src/detectors/backend-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('BackendDetector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    detector = new BackendDetector();
    testDir = path.join(os.tmpdir(), `backend-detector-test-${Date.now()}`);
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
    it('should detect Express backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('express');
      expect(result.primary).toBe('express');
      expect(result.hasBackend).toBe(true);
      expect(result.confidence).toBe(0.88);
      expect(result.categories.express).toBe('minimal-framework');
    });

    it('should detect Fastify backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { fastify: '^4.25.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('fastify');
      expect(result.primary).toBe('fastify');
      expect(result.hasBackend).toBe(true);
    });

    it('should detect Hono backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { hono: '^3.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('hono');
      expect(result.primary).toBe('hono');
      expect(result.hasBackend).toBe(true);
    });

    it('should detect NestJS backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { '@nestjs/core': '^10.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('nestjs');
      expect(result.primary).toBe('nestjs');
      expect(result.categories.nestjs).toBe('full-framework');
    });

    it('should detect Koa backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { koa: '^2.14.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('koa');
      expect(result.primary).toBe('koa');
      expect(result.hasBackend).toBe(true);
    });

    it('should detect multiple backends', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0', fastify: '^4.25.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends.length).toBeGreaterThan(1);
      expect(result.count).toBeGreaterThan(1);
      expect(result.hasBackend).toBe(true);
    });

    it('should return "none" for frontend-only project', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toEqual([]);
      expect(result.primary).toBe('none');
      expect(result.hasBackend).toBe(false);
      expect(result.confidence).toBe(0.95); // High confidence for "none"
      expect(result.count).toBe(0);
    });

    it('should return "none" when package.json not found', async () => {
      const result = await detector.detect(testDir);

      expect(result.backends).toEqual([]);
      expect(result.primary).toBe('none');
      expect(result.hasBackend).toBe(false);
      expect(result.confidence).toBe(0.95);
    });

    it('should include backend details', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.details.express).toBeDefined();
      expect(result.details.express.express).toBe('^4.18.0');
    });

    it('should filter out API route entries when backend exists', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { next: '^13.0.0', express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.backends).toContain('express');
      expect(result.backends).not.toContain('nextjs_api');
    });

    it('should prioritize backends by category', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          express: '^4.18.0'
        }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.primary).toBe('nestjs'); // Higher priority
    });
  });

  describe('hasBackend', () => {
    it('should return true if backend exists', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasExpress = await detector.hasBackend(testDir, 'express');
      expect(hasExpress).toBe(true);
    });

    it('should return false if backend not found', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasExpress = await detector.hasBackend(testDir, 'express');
      expect(hasExpress).toBe(false);
    });
  });

  describe('hasFrontendOnly', () => {
    it('should return true for frontend-only project', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const isFrontendOnly = await detector.hasFrontendOnly(testDir);
      expect(isFrontendOnly).toBe(true);
    });

    it('should return false when backend exists', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0', react: '^18.2.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const isFrontendOnly = await detector.hasFrontendOnly(testDir);
      expect(isFrontendOnly).toBe(false);
    });
  });

  describe('getBackendCategory', () => {
    it('should return backend category', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const category = await detector.getBackendCategory(testDir, 'express');
      expect(category).toBe('minimal-framework');
    });

    it('should return null for missing backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {}
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const category = await detector.getBackendCategory(testDir, 'express');
      expect(category).toBeNull();
    });
  });

  describe('getBackendVersion', () => {
    it('should return backend version', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { express: '^4.18.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getBackendVersion(testDir, 'express');
      expect(version).toBe('^4.18.0');
    });

    it('should return null for missing backend', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {}
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getBackendVersion(testDir, 'express');
      expect(version).toBeNull();
    });
  });
});
