/**
 * Database Detector Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DatabaseDetector } from '../../src/detectors/database-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('DatabaseDetector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    detector = new DatabaseDetector();
    testDir = path.join(os.tmpdir(), `database-detector-test-${Date.now()}`);
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
    it('should detect Supabase', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { '@supabase/supabase-js': '^2.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('supabase');
      expect(result.primary).toBe('supabase');
      expect(result.confidence).toBe(0.90);
      expect(result.types.supabase).toBe('backend-as-a-service');
    });

    it('should detect PostgreSQL', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('postgresql');
      expect(result.primary).toBe('postgresql');
      expect(result.types.postgresql).toBe('sql-database');
    });

    it('should detect MongoDB', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { mongoose: '^7.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('mongodb');
      expect(result.primary).toBe('mongodb');
      expect(result.types.mongodb).toBe('nosql-database');
    });

    it('should detect SQLite', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { 'better-sqlite3': '^9.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('sqlite');
      expect(result.primary).toBe('sqlite');
      expect(result.types.sqlite).toBe('sql-database');
    });

    it('should detect MySQL', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { mysql2: '^3.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('mysql');
      expect(result.primary).toBe('mysql');
    });

    it('should detect Firebase', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { firebase: '^10.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('firebase');
      expect(result.types.firebase).toBe('backend-as-a-service');
    });

    it('should detect Prisma ORM', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { '@prisma/client': '^5.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toContain('prisma');
      expect(result.types.prisma).toBe('orm');
    });

    it('should detect multiple databases', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0', redis: '^4.0.0' },
        devDependencies: { '@supabase/supabase-js': '^2.0.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases.length).toBeGreaterThan(1);
      expect(result.count).toBeGreaterThan(1);
    });

    it('should return null for primary when no database detected', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { lodash: '^4.17.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.databases).toEqual([]);
      expect(result.primary).toBeNull();
      expect(result.confidence).toBe(0.0);
      expect(result.count).toBe(0);
    });

    it('should return empty when package.json not found', async () => {
      const result = await detector.detect(testDir);

      expect(result.databases).toEqual([]);
      expect(result.primary).toBeNull();
      expect(result.confidence).toBe(0.0);
    });

    it('should include database details', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { '@supabase/supabase-js': '^2.0.0', pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.details.supabase).toBeDefined();
      expect(result.details.postgresql).toBeDefined();
    });

    it('should prioritize by detection order', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {
          '@supabase/supabase-js': '^2.0.0',
          pg: '^8.10.0'
        }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const result = await detector.detect(testDir);

      expect(result.primary).toBe('supabase'); // Higher priority
    });
  });

  describe('hasDatabase', () => {
    it('should return true if database exists', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasPostgres = await detector.hasDatabase(testDir, 'postgresql');
      expect(hasPostgres).toBe(true);
    });

    it('should return false if database not found', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const hasMongo = await detector.hasDatabase(testDir, 'mongodb');
      expect(hasMongo).toBe(false);
    });
  });

  describe('getDatabaseType', () => {
    it('should return database type', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const type = await detector.getDatabaseType(testDir, 'postgresql');
      expect(type).toBe('sql-database');
    });

    it('should return null for missing database', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {}
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const type = await detector.getDatabaseType(testDir, 'postgresql');
      expect(type).toBeNull();
    });
  });

  describe('getDatabaseVersion', () => {
    it('should return database version', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: { pg: '^8.10.0' }
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getDatabaseVersion(testDir, 'postgresql');
      expect(version).toBe('^8.10.0');
    });

    it('should return null for missing database', async () => {
      const pkg = {
        name: 'test-app',
        dependencies: {}
      };
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(pkg)
      );

      const version = await detector.getDatabaseVersion(testDir, 'postgresql');
      expect(version).toBeNull();
    });
  });
});
