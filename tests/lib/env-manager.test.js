/**
 * EnvManager - Comprehensive Test Suite
 *
 * Tests for environment variable detection, management,
 * and .env file generation with security validation.
 *
 * Coverage target: 100%
 * Test count: >15 tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EnvManager } from '../../src/lib/env-manager.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Create temporary test project
 */
async function createTempProject() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-manager-test-'));
  return tempDir;
}

/**
 * Clean up temporary project
 */
async function cleanupTempProject(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

/**
 * Write file with directory creation
 */
async function writeFile(baseDir, filePath, content) {
  const fullPath = path.join(baseDir, filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content);
}

describe('EnvManager', () => {
  let tempDir;
  let envManager;

  beforeEach(async () => {
    tempDir = await createTempProject();
    envManager = new EnvManager(tempDir);
  });

  afterEach(async () => {
    await cleanupTempProject(tempDir);
  });

  describe('Constructor', () => {
    it('should create instance with project root', () => {
      expect(envManager.projectRoot).toBe(tempDir);
    });

    it('should throw error if project root is not provided', () => {
      expect(() => new EnvManager()).toThrow(/Project root is required/);
    });

    it('should throw error if project root is not a string', () => {
      expect(() => new EnvManager(123)).toThrow(/Project root is required/);
    });

    it('should initialize empty detected variables', () => {
      expect(envManager.detectedVars.size).toBe(0);
    });

    it('should initialize secret patterns', () => {
      expect(envManager.secretPatterns.length).toBeGreaterThan(0);
    });

    it('should initialize build-time prefixes', () => {
      expect(envManager.buildTimePrefixes).toHaveProperty('vite');
      expect(envManager.buildTimePrefixes).toHaveProperty('next');
      expect(envManager.buildTimePrefixes).toHaveProperty('react');
    });
  });

  describe('detectInFile()', () => {
    it('should detect process.env variables', async () => {
      await writeFile(tempDir, 'test.js', `
        const apiUrl = process.env.API_URL;
        const apiKey = process.env.API_KEY;
      `);

      const vars = await envManager.detectInFile(path.join(tempDir, 'test.js'));

      expect(vars.has('API_URL')).toBe(true);
      expect(vars.has('API_KEY')).toBe(true);
    });

    it('should detect import.meta.env variables', async () => {
      await writeFile(tempDir, 'test.js', `
        const url = import.meta.env.VITE_API_URL;
        const key = import.meta.env.VITE_API_KEY;
      `);

      const vars = await envManager.detectInFile(path.join(tempDir, 'test.js'));

      expect(vars.has('VITE_API_URL')).toBe(true);
      expect(vars.has('VITE_API_KEY')).toBe(true);
    });

    it('should detect bracket notation access', async () => {
      await writeFile(tempDir, 'test.js', `
        const url = process.env['API_URL'];
        const key = process.env["API_KEY"];
      `);

      const vars = await envManager.detectInFile(path.join(tempDir, 'test.js'));

      expect(vars.has('API_URL')).toBe(true);
      expect(vars.has('API_KEY')).toBe(true);
    });

    it('should ignore NODE_ENV', async () => {
      await writeFile(tempDir, 'test.js', `
        const env = process.env.NODE_ENV;
      `);

      const vars = await envManager.detectInFile(path.join(tempDir, 'test.js'));

      expect(vars.has('NODE_ENV')).toBe(false);
    });

    it('should return empty set for nonexistent file', async () => {
      const vars = await envManager.detectInFile('/nonexistent/file.js');
      expect(vars.size).toBe(0);
    });

    it('should handle multiple occurrences of same variable', async () => {
      await writeFile(tempDir, 'test.js', `
        const url1 = process.env.API_URL;
        const url2 = process.env.API_URL;
      `);

      const vars = await envManager.detectInFile(path.join(tempDir, 'test.js'));

      expect(vars.size).toBe(1);
      expect(vars.has('API_URL')).toBe(true);
    });
  });

  describe('detectVariables()', () => {
    it('should detect variables across multiple files', async () => {
      await writeFile(tempDir, 'src/file1.js', 'const url = process.env.API_URL;');
      await writeFile(tempDir, 'src/file2.js', 'const key = process.env.API_KEY;');

      await envManager.detectVariables();

      expect(envManager.detectedVars.has('API_URL')).toBe(true);
      expect(envManager.detectedVars.has('API_KEY')).toBe(true);
    });

    it('should track files where variables are used', async () => {
      await writeFile(tempDir, 'src/api.js', 'const url = process.env.API_URL;');

      await envManager.detectVariables();

      const varInfo = envManager.detectedVars.get('API_URL');
      const normalizedFiles = varInfo.files.map(f => f.replace(/\\/g, '/'));
      expect(normalizedFiles).toContain('src/api.js');
    });

    it('should detect build-time variables', async () => {
      await writeFile(tempDir, 'src/app.js', 'const url = import.meta.env.VITE_API_URL;');

      await envManager.detectVariables();

      const varInfo = envManager.detectedVars.get('VITE_API_URL');
      expect(varInfo.isBuildTime).toBe(true);
    });

    it('should detect secret variables', async () => {
      await writeFile(tempDir, 'src/auth.js', 'const key = process.env.API_KEY;');

      await envManager.detectVariables();

      const varInfo = envManager.detectedVars.get('API_KEY');
      expect(varInfo.isSecret).toBe(true);
    });

    it('should skip node_modules directory', async () => {
      await writeFile(tempDir, 'node_modules/package/index.js', 'process.env.SHOULD_SKIP;');
      await writeFile(tempDir, 'src/app.js', 'process.env.SHOULD_DETECT;');

      await envManager.detectVariables();

      expect(envManager.detectedVars.has('SHOULD_SKIP')).toBe(false);
      expect(envManager.detectedVars.has('SHOULD_DETECT')).toBe(true);
    });

    it('should respect maxFiles limit', async () => {
      // Create many files
      for (let i = 0; i < 10; i++) {
        await writeFile(tempDir, `src/file${i}.js`, `process.env.VAR${i};`);
      }

      await envManager.detectVariables({ maxFiles: 5 });

      expect(envManager.detectedVars.size).toBeLessThanOrEqual(5);
    });

    it('should scan custom directories', async () => {
      await writeFile(tempDir, 'lib/utils.js', 'process.env.CUSTOM_VAR;');

      await envManager.detectVariables({ directories: ['lib'] });

      expect(envManager.detectedVars.has('CUSTOM_VAR')).toBe(true);
    });

    it('should scan custom file extensions', async () => {
      await writeFile(tempDir, 'src/component.vue', 'process.env.VUE_VAR;');

      await envManager.detectVariables({ extensions: ['.vue'] });

      expect(envManager.detectedVars.has('VUE_VAR')).toBe(true);
    });

    it('should handle nonexistent directories gracefully', async () => {
      await envManager.detectVariables({ directories: ['nonexistent'] });

      expect(envManager.detectedVars.size).toBe(0);
    });
  });

  describe('loadEnvFile()', () => {
    it('should load .env file', async () => {
      await writeFile(tempDir, '.env', `
API_URL=https://api.example.com
API_KEY=secret123
      `);

      const vars = await envManager.loadEnvFile();

      expect(vars.get('API_URL')).toBe('https://api.example.com');
      expect(vars.get('API_KEY')).toBe('secret123');
    });

    it('should skip comments', async () => {
      await writeFile(tempDir, '.env', `
# This is a comment
API_URL=https://api.example.com
      `);

      const vars = await envManager.loadEnvFile();

      expect(vars.size).toBe(1);
      expect(vars.has('API_URL')).toBe(true);
    });

    it('should skip empty lines', async () => {
      await writeFile(tempDir, '.env', `
API_URL=value


API_KEY=secret
      `);

      const vars = await envManager.loadEnvFile();

      expect(vars.size).toBe(2);
    });

    it('should handle quoted values', async () => {
      await writeFile(tempDir, '.env', `
API_URL="https://api.example.com"
API_KEY='secret123'
      `);

      const vars = await envManager.loadEnvFile();

      expect(vars.get('API_URL')).toBe('https://api.example.com');
      expect(vars.get('API_KEY')).toBe('secret123');
    });

    it('should return empty map for nonexistent file', async () => {
      const vars = await envManager.loadEnvFile();
      expect(vars.size).toBe(0);
    });

    it('should load custom .env file path', async () => {
      await writeFile(tempDir, '.env.local', 'LOCAL_VAR=value');

      const vars = await envManager.loadEnvFile(path.join(tempDir, '.env.local'));

      expect(vars.get('LOCAL_VAR')).toBe('value');
    });
  });

  describe('generateEnvExample()', () => {
    beforeEach(async () => {
      await writeFile(tempDir, 'src/app.js', `
        const url = import.meta.env.VITE_API_URL;
        const key = process.env.API_KEY;
        const dbUrl = process.env.DATABASE_URL;
      `);

      await envManager.detectVariables();
    });

    it('should generate .env.example content', () => {
      const content = envManager.generateEnvExample();

      expect(content).toContain('VITE_API_URL=');
      expect(content).toContain('API_KEY=');
      expect(content).toContain('DATABASE_URL=');
    });

    it('should include comments by default', () => {
      const content = envManager.generateEnvExample();

      expect(content).toContain('# Environment Variables');
      expect(content).toContain('# Build-time variables');
    });

    it('should group by type when enabled', () => {
      const content = envManager.generateEnvExample({ groupByType: true });

      expect(content).toContain('# Build-time variables');
      expect(content).toContain('# Runtime variables');
      expect(content).toContain('# Secret variables');
    });

    it('should not group when disabled', () => {
      const content = envManager.generateEnvExample({ groupByType: false });

      expect(content).not.toContain('# Build-time variables');
      expect(content).toContain('VITE_API_URL=');
    });

    it('should include file usage in comments', () => {
      const content = envManager.generateEnvExample({ includeComments: true });

      expect(content).toContain('# Used in:');
      // Accept both forward and backward slashes for cross-platform compatibility
      expect(content.replace(/\\/g, '/')).toContain('src/app.js');
    });

    it('should omit comments when disabled', () => {
      const content = envManager.generateEnvExample({ includeComments: false });

      expect(content).not.toContain('# Used in:');
    });

    it('should warn about secret variables', () => {
      const content = envManager.generateEnvExample();

      expect(content).toContain('# Secret variables');
      expect(content).toContain('DO NOT commit');
    });
  });

  describe('generateEnvFile()', () => {
    beforeEach(async () => {
      await writeFile(tempDir, 'src/app.js', `
        const url = process.env.API_URL;
        const key = process.env.API_KEY;
      `);

      await envManager.detectVariables();
    });

    it('should generate .env file with detected variables', async () => {
      const content = await envManager.generateEnvFile();

      expect(content).toContain('API_URL=');
      expect(content).toContain('API_KEY=');
    });

    it('should include warning about version control', async () => {
      const content = await envManager.generateEnvFile();

      expect(content).toContain('WARNING');
      expect(content).toContain('Do not commit');
    });

    it('should use existing values when provided', async () => {
      await writeFile(tempDir, '.env', 'API_URL=https://api.example.com');

      const content = await envManager.generateEnvFile();

      expect(content).toContain('API_URL=https://api.example.com');
    });

    it('should add TODO for missing secret values', async () => {
      const content = await envManager.generateEnvFile();

      const apiKeyLine = content.split('\n').find(line => line.includes('API_KEY'));
      const todoComment = content.split('\n').find(line =>
        line.includes('TODO') && line.includes('API_KEY')
      );

      expect(todoComment).toBeDefined();
    });
  });

  describe('separateVariables()', () => {
    beforeEach(async () => {
      await writeFile(tempDir, 'src/app.js', `
        const url = import.meta.env.VITE_API_URL;
        const key = process.env.API_KEY;
      `);

      await envManager.detectVariables();
    });

    it('should separate build-time and runtime variables', () => {
      const { buildTime, runtime } = envManager.separateVariables('vite');

      expect(buildTime.some(v => v.name === 'VITE_API_URL')).toBe(true);
      expect(runtime.some(v => v.name === 'API_KEY')).toBe(true);
    });

    it('should use correct prefixes for different tools', () => {
      const { buildTime: viteBuild } = envManager.separateVariables('vite');
      const { buildTime: nextBuild } = envManager.separateVariables('next');

      expect(viteBuild).toBeDefined();
      expect(nextBuild).toBeDefined();
    });

    it('should handle unknown tools gracefully', () => {
      const { buildTime, runtime } = envManager.separateVariables('unknown');

      expect(buildTime).toEqual([]);
      expect(runtime.length).toBeGreaterThan(0);
    });
  });

  describe('validateVariables()', () => {
    it('should warn about secret variables', async () => {
      await writeFile(tempDir, 'src/app.js', 'process.env.API_KEY;');
      await envManager.detectVariables();

      const warnings = envManager.validateVariables();

      const secretWarning = warnings.find(w => w.type === 'secret');
      expect(secretWarning).toBeDefined();
      expect(secretWarning.severity).toBe('high');
    });

    it('should warn about build-time secrets', async () => {
      await writeFile(tempDir, 'src/app.js', 'import.meta.env.VITE_API_SECRET;');
      await envManager.detectVariables();

      const warnings = envManager.validateVariables();

      const securityWarning = warnings.find(w => w.type === 'security');
      expect(securityWarning).toBeDefined();
      expect(securityWarning.severity).toBe('critical');
    });

    it('should include recommendations', async () => {
      await writeFile(tempDir, 'src/app.js', 'process.env.API_KEY;');
      await envManager.detectVariables();

      const warnings = envManager.validateVariables();

      expect(warnings[0].recommendation).toBeDefined();
    });
  });

  describe('getStats()', () => {
    beforeEach(async () => {
      await writeFile(tempDir, 'src/app.js', `
        const url = import.meta.env.VITE_API_URL;
        const key = process.env.API_KEY;
        const dbUrl = process.env.DATABASE_URL;
      `);

      await envManager.detectVariables();
    });

    it('should return statistics about detected variables', () => {
      const stats = envManager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.buildTime).toBeGreaterThan(0);
      expect(stats.runtime).toBeGreaterThan(0);
      expect(stats.secrets).toBeGreaterThan(0);
    });

    it('should count build-time variables correctly', () => {
      const stats = envManager.getStats();

      expect(stats.buildTime).toBe(1); // VITE_API_URL
    });

    it('should count runtime variables correctly', () => {
      const stats = envManager.getStats();

      expect(stats.runtime).toBe(2); // API_KEY, DATABASE_URL
    });

    it('should count secret variables correctly', () => {
      const stats = envManager.getStats();

      expect(stats.secrets).toBeGreaterThan(0);
    });
  });
});
