/**
 * TemplateComposer - Comprehensive Test Suite
 *
 * Tests for template composition system with fragment loading,
 * merging, variable substitution, and Dockerfile generation.
 *
 * Coverage target: 100%
 * Test count: >20 tests
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TemplateComposer } from '../../src/lib/template-composer.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Create temporary test directory
 */
async function createTempDir() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-composer-test-'));
  return tempDir;
}

/**
 * Clean up temporary directory
 */
async function cleanupTempDir(dir) {
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

describe('TemplateComposer', () => {
  let tempDir;
  let composer;

  beforeEach(async () => {
    tempDir = await createTempDir();
    composer = new TemplateComposer(tempDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('Constructor', () => {
    it('should create instance with custom templates directory', () => {
      const customComposer = new TemplateComposer('/custom/path');
      expect(customComposer.templatesDir).toBe('/custom/path');
    });

    it('should use default templates directory if not provided', () => {
      const defaultComposer = new TemplateComposer();
      const normalizedPath = defaultComposer.templatesDir.replace(/\\/g, '/');
      expect(normalizedPath).toContain('src/templates');
    });

    it('should initialize empty fragment cache', () => {
      expect(composer.fragmentCache.size).toBe(0);
      expect(composer.loadedFragments.size).toBe(0);
    });
  });

  describe('loadFragment()', () => {
    it('should load a fragment from filesystem', async () => {
      await writeFile(tempDir, 'test/fragment.txt', 'Hello World');

      const content = await composer.loadFragment('test/fragment.txt');
      expect(content).toBe('Hello World');
    });

    it('should cache loaded fragments', async () => {
      await writeFile(tempDir, 'test/fragment.txt', 'Cached');

      await composer.loadFragment('test/fragment.txt');
      await composer.loadFragment('test/fragment.txt');

      expect(composer.fragmentCache.size).toBe(1);
      expect(composer.fragmentCache.get('test/fragment.txt')).toBe('Cached');
    });

    it('should track loaded fragments', async () => {
      await writeFile(tempDir, 'test/fragment.txt', 'Test');

      await composer.loadFragment('test/fragment.txt');

      expect(composer.loadedFragments.has('test/fragment.txt')).toBe(true);
    });

    it('should throw error if fragment does not exist', async () => {
      await expect(
        composer.loadFragment('nonexistent.txt')
      ).rejects.toThrow(/Failed to load fragment/);
    });

    it('should return cached content on subsequent loads', async () => {
      await writeFile(tempDir, 'test/fragment.txt', 'Original');

      const first = await composer.loadFragment('test/fragment.txt');

      // Modify file on disk
      await writeFile(tempDir, 'test/fragment.txt', 'Modified');

      const second = await composer.loadFragment('test/fragment.txt');

      // Should return cached content
      expect(first).toBe('Original');
      expect(second).toBe('Original');
    });
  });

  describe('loadFragments()', () => {
    it('should load multiple fragments in parallel', async () => {
      await writeFile(tempDir, 'test/frag1.txt', 'Fragment 1');
      await writeFile(tempDir, 'test/frag2.txt', 'Fragment 2');
      await writeFile(tempDir, 'test/frag3.txt', 'Fragment 3');

      const fragments = await composer.loadFragments([
        'test/frag1.txt',
        'test/frag2.txt',
        'test/frag3.txt'
      ]);

      expect(fragments).toEqual(['Fragment 1', 'Fragment 2', 'Fragment 3']);
    });

    it('should handle empty array', async () => {
      const fragments = await composer.loadFragments([]);
      expect(fragments).toEqual([]);
    });

    it('should fail if any fragment is missing', async () => {
      await writeFile(tempDir, 'test/frag1.txt', 'Fragment 1');

      await expect(
        composer.loadFragments(['test/frag1.txt', 'test/missing.txt'])
      ).rejects.toThrow();
    });
  });

  describe('mergeFragments()', () => {
    it('should merge fragments with default separator', () => {
      const fragments = ['Fragment 1', 'Fragment 2', 'Fragment 3'];
      const merged = composer.mergeFragments(fragments);

      expect(merged).toBe('Fragment 1\n\nFragment 2\n\nFragment 3');
    });

    it('should merge fragments with custom separator', () => {
      const fragments = ['A', 'B', 'C'];
      const merged = composer.mergeFragments(fragments, { separator: '---' });

      expect(merged).toBe('A---B---C');
    });

    it('should handle single fragment', () => {
      const merged = composer.mergeFragments(['Only one']);
      expect(merged).toBe('Only one');
    });

    it('should handle empty array', () => {
      const merged = composer.mergeFragments([]);
      expect(merged).toBe('');
    });

    it('should deduplicate lines when option is set', () => {
      const fragments = [
        'RUN apt-get update\nRUN npm install',
        'RUN apt-get update\nRUN yarn install'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      expect(merged).toContain('RUN apt-get update');
      expect(merged.match(/RUN apt-get update/g)?.length).toBe(1);
    });

    it('should preserve comments and empty lines when deduplicating', () => {
      const fragments = [
        '# Comment\nRUN command\n\nRUN command',
        '# Comment\nRUN command'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      expect(merged).toContain('# Comment');
      expect(merged.match(/# Comment/g)?.length).toBeGreaterThan(1);
    });

    it('should preserve template syntax when deduplicating', () => {
      const fragments = [
        'ENV PORT={{PORT:-3000}}\nRUN npm install',
        'ENV HOST={{HOST:-localhost}}\nENV PORT={{PORT:-3000}}'
      ];

      const merged = composer.mergeFragments(fragments, { deduplicate: true });

      // Template syntax should appear twice (once from each fragment)
      const portMatches = merged.match(/ENV PORT=\{\{PORT:-3000\}\}/g);
      expect(portMatches?.length).toBe(2);

      // Other content should be deduplicated
      const installMatches = merged.match(/RUN npm install/g);
      expect(installMatches?.length).toBe(1);
    });

    it('should throw error if fragments is not an array', () => {
      expect(() => composer.mergeFragments('not an array')).toThrow(/must be an array/);
    });
  });

  describe('substituteVariables()', () => {
    it('should substitute simple variables', () => {
      const template = 'Hello {{NAME}}!';
      const result = composer.substituteVariables(template, { NAME: 'World' });

      expect(result).toBe('Hello World!');
    });

    it('should substitute multiple variables', () => {
      const template = '{{GREETING}} {{NAME}}!';
      const result = composer.substituteVariables(template, {
        GREETING: 'Hello',
        NAME: 'World'
      });

      expect(result).toBe('Hello World!');
    });

    it('should handle variables with default values', () => {
      const template = 'Port: {{PORT:-3000}}';
      const result = composer.substituteVariables(template, {});

      expect(result).toBe('Port: 3000');
    });

    it('should use provided value over default', () => {
      const template = 'Port: {{PORT:-3000}}';
      const result = composer.substituteVariables(template, { PORT: '8080' });

      expect(result).toBe('Port: 8080');
    });

    it('should handle conditional blocks (truthy)', () => {
      const template = '{{#if ENABLE}}Feature enabled{{/if}}';
      const result = composer.substituteVariables(template, { ENABLE: true });

      expect(result).toBe('Feature enabled');
    });

    it('should handle conditional blocks (falsy)', () => {
      const template = '{{#if ENABLE}}Feature enabled{{/if}}';
      const result = composer.substituteVariables(template, { ENABLE: false });

      expect(result).toBe('');
    });

    it('should handle nested content in conditionals', () => {
      const template = '{{#if BUILD}}RUN npm run build\nRUN npm test{{/if}}';
      const result = composer.substituteVariables(template, { BUILD: true });

      expect(result).toContain('RUN npm run build');
      expect(result).toContain('RUN npm test');
    });

    it('should replace missing variables with empty string by default', () => {
      const template = 'Hello {{NAME}}!';
      const result = composer.substituteVariables(template, {});

      expect(result).toBe('Hello !');
    });

    it('should use custom missing placeholder', () => {
      const template = 'Hello {{NAME}}!';
      const result = composer.substituteVariables(template, {}, { missing: 'UNDEFINED' });

      expect(result).toBe('Hello UNDEFINED!');
    });

    it('should throw error in strict mode for missing variables', () => {
      const template = 'Hello {{NAME}}!';

      expect(() =>
        composer.substituteVariables(template, {}, { strict: true })
      ).toThrow(/Missing required variable: NAME/);
    });

    it('should convert null and undefined values to empty string', () => {
      const template = '{{VAR1}}-{{VAR2}}';
      const result = composer.substituteVariables(template, {
        VAR1: null,
        VAR2: undefined
      });

      expect(result).toBe('-');
    });

    it('should convert non-string values to strings', () => {
      const template = 'Number: {{NUM}}, Boolean: {{BOOL}}';
      const result = composer.substituteVariables(template, {
        NUM: 42,
        BOOL: true
      });

      expect(result).toBe('Number: 42, Boolean: true');
    });

    it('should throw error if template is not a string', () => {
      expect(() =>
        composer.substituteVariables(123, {})
      ).toThrow(/Template must be a string/);
    });

    it('should throw error if variables is not an object', () => {
      expect(() =>
        composer.substituteVariables('test', 'not an object')
      ).toThrow(/Variables must be an object/);
    });
  });

  describe('compose()', () => {
    it('should compose template from fragments with variables', async () => {
      await writeFile(tempDir, 'header.txt', 'Hello {{NAME}}');
      await writeFile(tempDir, 'footer.txt', 'Goodbye {{NAME}}');

      const result = await composer.compose({
        fragments: ['header.txt', 'footer.txt'],
        variables: { NAME: 'World' }
      });

      expect(result).toBe('Hello World\n\nGoodbye World');
    });

    it('should apply merge options', async () => {
      await writeFile(tempDir, 'frag1.txt', 'Line 1');
      await writeFile(tempDir, 'frag2.txt', 'Line 1');

      const result = await composer.compose({
        fragments: ['frag1.txt', 'frag2.txt'],
        mergeOptions: { deduplicate: true }
      });

      expect(result.match(/Line 1/g)?.length).toBe(1);
    });

    it('should apply substitution options', async () => {
      await writeFile(tempDir, 'template.txt', 'Value: {{VAR}}');

      await expect(
        composer.compose({
          fragments: ['template.txt'],
          variables: {},
          substituteOptions: { strict: true }
        })
      ).rejects.toThrow(/Missing required variable/);
    });

    it('should throw error if fragments array is empty', async () => {
      await expect(
        composer.compose({ fragments: [] })
      ).rejects.toThrow(/must specify fragments array/);
    });

    it('should throw error if fragments is not provided', async () => {
      await expect(
        composer.compose({})
      ).rejects.toThrow(/must specify fragments array/);
    });

    it('should handle composition failure gracefully', async () => {
      await expect(
        composer.compose({
          fragments: ['nonexistent.txt']
        })
      ).rejects.toThrow(/Template composition failed/);
    });
  });

  describe('generateDockerfile()', () => {
    beforeEach(async () => {
      // Create base template
      await writeFile(tempDir, 'base/Dockerfile.base', 'FROM node:{{NODE_VERSION}}\nWORKDIR /app');
    });

    it('should generate Dockerfile with base template', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable'
      });

      expect(dockerfile).toContain('FROM node:20');
      expect(dockerfile).toContain('WORKDIR /app');
    });

    it('should use provided variables', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable',
        metadata: { nodeVersion: '18' }
      });

      expect(dockerfile).toContain('FROM node:18');
    });

    it('should include tool-specific fragment if available', async () => {
      await writeFile(tempDir, 'tools/lovable/Dockerfile.fragment', 'RUN echo "Lovable"');

      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable'
      });

      expect(dockerfile).toContain('RUN echo "Lovable"');
    });

    it('should include framework fragment if available', async () => {
      await writeFile(tempDir, 'fragments/frameworks/react.fragment', 'RUN echo "React"');

      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable',
        framework: 'react'
      });

      expect(dockerfile).toContain('RUN echo "React"');
    });

    it('should work without optional fragments', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'unknown-tool',
        framework: 'unknown-framework'
      });

      expect(dockerfile).toContain('FROM node:20');
    });

    it('should throw error if tool is not provided', async () => {
      await expect(
        composer.generateDockerfile({})
      ).rejects.toThrow(/Tool name is required/);
    });

    it('should use custom variables', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable',
        variables: { CUSTOM: 'value' }
      });

      // Variables should be available for substitution
      expect(dockerfile).toBeDefined();
    });

    it('should apply deduplication to Dockerfile', async () => {
      await writeFile(tempDir, 'base/Dockerfile.base', 'RUN apt-get update');
      await writeFile(tempDir, 'tools/lovable/Dockerfile.fragment', 'RUN apt-get update');

      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable'
      });

      expect(dockerfile.match(/RUN apt-get update/g)?.length).toBe(1);
    });
  });

  describe('generateDockerignore()', () => {
    beforeEach(async () => {
      await writeFile(tempDir, 'base/.dockerignore', 'node_modules\n.git');
    });

    it('should generate .dockerignore from base template', async () => {
      const dockerignore = await composer.generateDockerignore();

      expect(dockerignore).toContain('node_modules');
      expect(dockerignore).toContain('.git');
    });

    it('should include tool-specific patterns', async () => {
      await writeFile(tempDir, 'tools/lovable/.dockerignore', '.lovable\n*.local');

      const dockerignore = await composer.generateDockerignore({ tool: 'lovable' });

      expect(dockerignore).toContain('node_modules');
      expect(dockerignore).toContain('.lovable');
      expect(dockerignore).toContain('*.local');
    });

    it('should work without tool-specific patterns', async () => {
      const dockerignore = await composer.generateDockerignore({ tool: 'unknown' });

      expect(dockerignore).toContain('node_modules');
    });

    it('should include additional patterns', async () => {
      const dockerignore = await composer.generateDockerignore({
        additionalPatterns: ['*.tmp', 'temp/']
      });

      expect(dockerignore).toContain('*.tmp');
      expect(dockerignore).toContain('temp/');
    });

    it('should throw error if base .dockerignore is missing', async () => {
      const emptyComposer = new TemplateComposer('/nonexistent');

      await expect(
        emptyComposer.generateDockerignore()
      ).rejects.toThrow(/Failed to generate .dockerignore/);
    });
  });

  describe('Cache Management', () => {
    it('should clear fragment cache', async () => {
      await writeFile(tempDir, 'test.txt', 'Test');
      await composer.loadFragment('test.txt');

      expect(composer.fragmentCache.size).toBe(1);

      composer.clearCache();

      expect(composer.fragmentCache.size).toBe(0);
      expect(composer.loadedFragments.size).toBe(0);
    });

    it('should reload fragment after cache clear', async () => {
      await writeFile(tempDir, 'test.txt', 'Original');
      await composer.loadFragment('test.txt');

      await writeFile(tempDir, 'test.txt', 'Modified');
      composer.clearCache();

      const content = await composer.loadFragment('test.txt');
      expect(content).toBe('Modified');
    });

    it('should return cache statistics', async () => {
      await writeFile(tempDir, 'frag1.txt', 'Test 1');
      await writeFile(tempDir, 'frag2.txt', 'Test 2');

      await composer.loadFragment('frag1.txt');
      await composer.loadFragment('frag2.txt');

      const stats = composer.getCacheStats();

      expect(stats.cachedFragments).toBe(2);
      expect(stats.loadedFragments).toContain('frag1.txt');
      expect(stats.loadedFragments).toContain('frag2.txt');
    });
  });
});
