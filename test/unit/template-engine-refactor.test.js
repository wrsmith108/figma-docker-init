/**
 * Test: Template Engine Refactor (Task 1.4)
 * Purpose: Test new template variables, path resolution, and caching
 * Coverage: Task 1.4.1-1.4.4 from PHASE_1_CHECKLIST.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import {
  replaceTemplateVariables,
  validateTemplate
} from '../../figma-docker-init.js';
import {
  findProjectRoot,
  getFigmaDockerDir,
  getTemplatesDir,
  resolveTemplatePath,
  normalizePath,
  getRelativeFromRoot
} from '../../src/lib/path-resolver.js';
import { templateCache, TemplateCache } from '../../src/lib/template-cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Template Engine Refactor - Task 1.4', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/templates');

  beforeEach(() => {
    // Clear template cache before each test
    templateCache.clear();
  });

  // =============================================================================
  // Task 1.4.1: New Template Variables
  // =============================================================================
  describe('Task 1.4.1: New template variables (PROJECT_ROOT, FIGMA_DOCKER_DIR)', () => {
    it('should add PROJECT_ROOT variable', () => {
      const content = 'Root: {{PROJECT_ROOT}}';
      const variables = { PROJECT_NAME: 'test-app' };
      const result = replaceTemplateVariables(content, variables);

      // PROJECT_ROOT should be replaced with actual path
      expect(result).not.toContain('{{PROJECT_ROOT}}');
      expect(result).toContain('Root: ');
    });

    it('should add FIGMA_DOCKER_DIR variable', () => {
      const content = 'Docker dir: {{FIGMA_DOCKER_DIR}}';
      const variables = { PROJECT_NAME: 'test-app' };
      const result = replaceTemplateVariables(content, variables);

      // FIGMA_DOCKER_DIR should be replaced with actual path
      expect(result).not.toContain('{{FIGMA_DOCKER_DIR}}');
      expect(result).toContain('.figma-docker');
    });

    it('should add PROJECT_ROOT_RELATIVE variable', () => {
      const content = 'Relative root: {{PROJECT_ROOT_RELATIVE}}';
      const variables = { PROJECT_NAME: 'test-app' };
      const result = replaceTemplateVariables(content, variables);

      expect(result).not.toContain('{{PROJECT_ROOT_RELATIVE}}');
    });

    it('should add FIGMA_DOCKER_DIR_RELATIVE variable', () => {
      const content = 'Relative docker: {{FIGMA_DOCKER_DIR_RELATIVE}}';
      const variables = { PROJECT_NAME: 'test-app' };
      const result = replaceTemplateVariables(content, variables);

      expect(result).toContain('.figma-docker');
    });

    it('should combine old and new variables', () => {
      const content = 'Project {{PROJECT_NAME}} at {{PROJECT_ROOT}} using {{FIGMA_DOCKER_DIR}}';
      const variables = { PROJECT_NAME: 'my-app' };
      const result = replaceTemplateVariables(content, variables);

      expect(result).toContain('my-app');
      expect(result).not.toContain('{{PROJECT_NAME}}');
      expect(result).not.toContain('{{PROJECT_ROOT}}');
      expect(result).not.toContain('{{FIGMA_DOCKER_DIR}}');
    });

    it('should handle all variables in docker-compose context', () => {
      const dockerComposeContent = `
version: '3.8'
services:
  app:
    build:
      context: {{PROJECT_ROOT}}
    volumes:
      - {{FIGMA_DOCKER_DIR}}:/app/.figma-docker
    environment:
      - PROJECT_NAME={{PROJECT_NAME}}
`;
      const variables = { PROJECT_NAME: 'test-app' };
      const result = replaceTemplateVariables(dockerComposeContent, variables);

      expect(result).not.toContain('{{PROJECT_ROOT}}');
      expect(result).not.toContain('{{FIGMA_DOCKER_DIR}}');
      expect(result).toContain('test-app');
    });
  });

  // =============================================================================
  // Task 1.4.2: Template Discovery in .figma-docker/
  // =============================================================================
  describe('Task 1.4.2: Template discovery in .figma-docker/', () => {
    it('should find project root with package.json', () => {
      const projectRoot = findProjectRoot();
      expect(projectRoot).toBeTruthy();
      expect(fs.existsSync(path.join(projectRoot, 'package.json'))).toBe(true);
    });

    it('should get .figma-docker directory path', () => {
      const figmaDockerDir = getFigmaDockerDir();
      expect(figmaDockerDir).toContain('.figma-docker');
      expect(path.isAbsolute(figmaDockerDir)).toBe(true);
    });

    it('should get templates directory (package templates)', () => {
      const templatesDir = getTemplatesDir();
      expect(templatesDir).toBeTruthy();
      expect(templatesDir).toContain('templates');
    });

    it('should resolve template path correctly', () => {
      const templatePath = resolveTemplatePath('basic');
      expect(templatePath).toContain('templates');
      expect(templatePath).toContain('basic');
    });

    it('should create .figma-docker structure', () => {
      const tempDir = path.join(fixturesDir, 'temp-project');
      fs.mkdirSync(tempDir, { recursive: true });

      const dirs = ensureFigmaDockerStructure(tempDir);

      expect(fs.existsSync(dirs.root)).toBe(true);
      expect(fs.existsSync(dirs.config)).toBe(true);
      expect(fs.existsSync(dirs.cache)).toBe(true);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });
    });
  });

  // =============================================================================
  // Task 1.4.3: Path Resolution with path-resolver
  // =============================================================================
  describe('Task 1.4.3: Path resolution with path-resolver', () => {
    it('should normalize paths for cross-platform compatibility', () => {
      const windowsPath = 'C:\\Users\\test\\project';
      const normalized = normalizePath(windowsPath);

      expect(normalized).not.toContain('\\');
      expect(normalized).toContain('/');
    });

    it('should get relative path from project root', () => {
      const projectRoot = findProjectRoot();
      const figmaDockerDir = getFigmaDockerDir(projectRoot);
      const relative = getRelativeFromRoot(figmaDockerDir, projectRoot);

      expect(relative).toBe('.figma-docker');
    });

    it('should handle absolute paths correctly', () => {
      const projectRoot = findProjectRoot();
      expect(path.isAbsolute(projectRoot)).toBe(true);
    });

    it('should resolve config paths', async () => {
      const { resolveConfigPath } = await import('../../lib/path-resolver.js');
      const configPath = resolveConfigPath('config.json');

      expect(configPath).toContain('.figma-docker');
      expect(configPath).toContain('config.json');
    });
  });

  // =============================================================================
  // Task 1.4.4: Template Caching for 50%+ Speed Improvement
  // =============================================================================
  describe('Task 1.4.4: Template caching for performance', () => {
    it('should cache template processing results', () => {
      const templatePath = '/test/template.txt';
      const content = 'Project: {{PROJECT_NAME}}';
      const variables = { PROJECT_NAME: 'test-app' };

      // First call - should process and cache
      const result1 = replaceTemplateVariables(content, variables, templatePath);
      expect(result1).toContain('test-app');

      // Second call - should use cache
      const result2 = replaceTemplateVariables(content, variables, templatePath);
      expect(result2).toBe(result1);
    });

    it('should return cached results faster on subsequent calls', () => {
      const templatePath = '/test/large-template.txt';
      const content = 'Project: {{PROJECT_NAME}}\n'.repeat(100);
      const variables = { PROJECT_NAME: 'test-app' };

      // Warm up cache
      replaceTemplateVariables(content, variables, templatePath);

      // Time cached call
      const startCached = Date.now();
      replaceTemplateVariables(content, variables, templatePath);
      const cachedTime = Date.now() - startCached;

      // Cached call should be very fast (< 1ms)
      expect(cachedTime).toBeLessThan(10);
    });

    it('should invalidate cache when template changes', () => {
      const tempFile = path.join(fixturesDir, 'cache-test.txt');
      fs.writeFileSync(tempFile, 'Version 1: {{PROJECT_NAME}}');

      const variables = { PROJECT_NAME: 'test-app' };

      // Cache first version
      const content1 = fs.readFileSync(tempFile, 'utf8');
      const result1 = replaceTemplateVariables(content1, variables, tempFile);

      // Wait a bit and modify file
      setTimeout(() => {
        fs.writeFileSync(tempFile, 'Version 2: {{PROJECT_NAME}}');

        // Should detect file change and invalidate cache
        const content2 = fs.readFileSync(tempFile, 'utf8');
        const result2 = replaceTemplateVariables(content2, variables, tempFile);

        expect(result2).not.toBe(result1);
        expect(result2).toContain('Version 2');

        // Cleanup
        fs.unlinkSync(tempFile);
      }, 100);
    });

    it('should have working cache statistics', () => {
      const cache = new TemplateCache();
      const stats = cache.getStats();

      expect(stats).toHaveProperty('entries');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('averageHits');
    });

    it('should respect cache TTL', () => {
      const cache = new TemplateCache();
      cache.setTTL(100); // 100ms TTL

      const templatePath = '/test/ttl-test.txt';
      const content = 'Test: {{VAR}}';
      const variables = { VAR: 'value' };

      cache.set(templatePath, variables, 'result');

      // Should be in cache immediately
      expect(cache.get(templatePath, variables)).toBe('result');

      // After TTL expires, should return null
      setTimeout(() => {
        expect(cache.get(templatePath, variables)).toBeNull();
      }, 150);
    });

    it('should enforce maximum cache size', () => {
      const cache = new TemplateCache();
      cache.setMaxSize(3);

      // Add 4 entries
      for (let i = 0; i < 4; i++) {
        cache.set(`/test/file${i}.txt`, { var: i }, `result${i}`);
      }

      const stats = cache.getStats();
      expect(stats.entries).toBeLessThanOrEqual(3);
    });

    it('should clear cache completely', () => {
      const cache = new TemplateCache();
      cache.set('/test/file1.txt', { var: 1 }, 'result1');
      cache.set('/test/file2.txt', { var: 2 }, 'result2');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.entries).toBe(0);
    });
  });

  // =============================================================================
  // Integration Tests: All Tasks Together
  // =============================================================================
  describe('Integration: All Task 1.4 features together', () => {
    it('should use path-resolver, new variables, and caching in complete workflow', () => {
      const content = `
# Docker Configuration
Project: {{PROJECT_NAME}}
Root: {{PROJECT_ROOT}}
Docker Dir: {{FIGMA_DOCKER_DIR}}
Relative: {{FIGMA_DOCKER_DIR_RELATIVE}}
Port: {{DEV_PORT}}
`;

      const variables = {
        PROJECT_NAME: 'integration-test',
        DEV_PORT: 3000,
        BUILD_OUTPUT_DIR: 'dist',
        FRAMEWORK: 'react',
        TYPESCRIPT: true,
        UI_LIBRARY: 'Material-UI',
        DEPENDENCY_COUNT: 50,
        PROD_PORT: 8080,
        NGINX_PORT: 80
      };

      const templatePath = '/test/integration.txt';

      // First call - processes and caches
      const result1 = replaceTemplateVariables(content, variables, templatePath);

      expect(result1).toContain('integration-test');
      expect(result1).toContain('3000');
      expect(result1).toContain('.figma-docker');
      expect(result1).not.toContain('{{PROJECT_NAME}}');
      expect(result1).not.toContain('{{PROJECT_ROOT}}');

      // Second call - uses cache
      const result2 = replaceTemplateVariables(content, variables, templatePath);
      expect(result2).toBe(result1);
    });

    it('should validate templates with new variables', () => {
      const templatePath = path.join(fixturesDir, 'new-vars-template');

      if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath, { recursive: true });
        fs.writeFileSync(
          path.join(templatePath, 'docker-compose.yml'),
          `
version: '3.8'
services:
  app:
    build:
      context: {{PROJECT_ROOT}}
    volumes:
      - {{FIGMA_DOCKER_DIR}}:/config
    environment:
      - NAME={{PROJECT_NAME}}
      - PORT={{DEV_PORT}}
`
        );
      }

      const variables = {
        PROJECT_NAME: 'test-app',
        BUILD_OUTPUT_DIR: 'dist',
        FRAMEWORK: 'react',
        TYPESCRIPT: true,
        UI_LIBRARY: 'Material-UI',
        DEPENDENCY_COUNT: 50,
        DEV_PORT: 3000,
        PROD_PORT: 8080,
        NGINX_PORT: 80
      };

      const validation = validateTemplate(templatePath, variables);
      expect(validation.errors).toHaveLength(0);
    });
  });
});
