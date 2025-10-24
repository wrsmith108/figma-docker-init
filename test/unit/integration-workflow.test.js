/**
 * Test: Integration Workflow
 * Purpose: Test detectProjectValues and copyTemplate integration
 * Coverage Target: Lines 260-383 (detectProjectValues), 696-822 (copyTemplate)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  detectProjectValues,
  copyTemplate,
  ValidationError
} from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Integration Workflow Functions', () => {
  const fixturesDir = path.join(__dirname, '../fixtures');
  const testProjectDir = path.join(fixturesDir, 'test-project');
  const templatesDir = path.join(__dirname, '../../templates');

  // Setup
  beforeAll(() => {
    // Create fixtures directory if needed
    if (!fs.existsSync(testProjectDir)) {
      fs.mkdirSync(testProjectDir, { recursive: true });
    }
  });

  // Cleanup
  afterAll(() => {
    // Clean up test files
    try {
      if (fs.existsSync(testProjectDir)) {
        fs.rmSync(testProjectDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Cleanup warning:', error.message);
    }
  });

  // =============================================================================
  // detectProjectValues
  // =============================================================================
  describe('detectProjectValues', () => {
    describe('Happy paths', () => {
      it('should detect project name from package.json', async () => {
        const projectDir = path.join(fixturesDir, 'detect-name');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ name: 'test-app' })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.PROJECT_NAME).toBe('test-app');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect framework from dependencies', async () => {
        const projectDir = path.join(fixturesDir, 'detect-framework');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({
            name: 'react-app',
            dependencies: { react: '^18.0.0' }
          })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.FRAMEWORK).toBe('react');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect TypeScript from dependencies', async () => {
        const projectDir = path.join(fixturesDir, 'detect-typescript');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({
            name: 'ts-app',
            devDependencies: { typescript: '^5.0.0' }
          })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.TYPESCRIPT).toBe(true);

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect UI library from dependencies', async () => {
        const projectDir = path.join(fixturesDir, 'detect-ui-lib');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({
            name: 'mui-app',
            dependencies: { '@mui/material': '^5.0.0' }
          })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.UI_LIBRARY).toBe('Material-UI');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should count dependencies', async () => {
        const projectDir = path.join(fixturesDir, 'detect-deps-count');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({
            name: 'app',
            dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' }
          })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.DEPENDENCY_COUNT).toBe(3);

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should assign dynamic ports', async () => {
        const projectDir = path.join(fixturesDir, 'detect-ports');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ name: 'app' })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.DEV_PORT).toBeGreaterThan(0);
        expect(values.PROD_PORT).toBeGreaterThan(0);
        expect(values.NGINX_PORT).toBeGreaterThan(0);

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect Vite build output from vite.config.js', async () => {
        const projectDir = path.join(fixturesDir, 'detect-vite-config');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ name: 'vite-app', dependencies: { vite: '^4.0.0' } })
        );
        fs.writeFileSync(
          path.join(projectDir, 'vite.config.js'),
          'export default { build: { outDir: "custom-dist" } }'
        );

        const values = await detectProjectValues(projectDir);
        expect(values.BUILD_OUTPUT_DIR).toBe('custom-dist');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect Next.js framework', async () => {
        const projectDir = path.join(fixturesDir, 'detect-nextjs');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({
            name: 'next-app',
            dependencies: { next: '^14.0.0', react: '^18.0.0' }
          })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.FRAMEWORK).toBe('next.js');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect various framework + build tool combinations', async () => {
        const combinations = [
          { deps: { vite: '^4.0.0', react: '^18.0.0' }, expected: 'react-vite' },
          { deps: { vite: '^4.0.0', vue: '^3.0.0' }, expected: 'vue-vite' },
          { deps: { webpack: '^5.0.0', react: '^18.0.0' }, expected: 'react-webpack' },
          { deps: { rollup: '^3.0.0', svelte: '^4.0.0' }, expected: 'svelte-rollup' }
        ];

        for (const combo of combinations) {
          const projectDir = path.join(fixturesDir, `detect-combo-${combo.expected}`);
          fs.mkdirSync(projectDir, { recursive: true });
          fs.writeFileSync(
            path.join(projectDir, 'package.json'),
            JSON.stringify({ name: 'app', dependencies: combo.deps })
          );

          const values = await detectProjectValues(projectDir);
          expect(values.FRAMEWORK).toBe(combo.expected);

          fs.rmSync(projectDir, { recursive: true, force: true });
        }
      });
    });

    describe('Error handling', () => {
      it('should use defaults when package.json is missing', async () => {
        const projectDir = path.join(fixturesDir, 'no-package-json');
        fs.mkdirSync(projectDir, { recursive: true });

        const values = await detectProjectValues(projectDir);
        expect(values.PROJECT_NAME).toBe('my-app');
        expect(values.FRAMEWORK).toBe('vanilla');
        expect(values.TYPESCRIPT).toBe(false);
        expect(values.DEPENDENCY_COUNT).toBe(0);

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should use defaults when package.json has no name', async () => {
        const projectDir = path.join(fixturesDir, 'no-name');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ dependencies: {} })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.PROJECT_NAME).toBe('my-app');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should handle invalid JSON in package.json', async () => {
        const projectDir = path.join(fixturesDir, 'invalid-json');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          '{ invalid json'
        );

        const values = await detectProjectValues(projectDir);
        expect(values.PROJECT_NAME).toBe('my-app');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should throw ValidationError for invalid project directory', async () => {
        await expect(detectProjectValues('..')).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError for directory traversal', async () => {
        await expect(detectProjectValues('../../etc')).rejects.toThrow(ValidationError);
      });
    });

    describe('Edge cases', () => {
      it('should default BUILD_OUTPUT_DIR to "dist" when not detected', async () => {
        const projectDir = path.join(fixturesDir, 'no-build-config');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ name: 'app' })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.BUILD_OUTPUT_DIR).toBe('dist');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });

      it('should detect UI library variants', async () => {
        const libraries = [
          { deps: { antd: '^5.0.0' }, expected: 'Ant Design' },
          { deps: { '@chakra-ui/react': '^2.0.0' }, expected: 'Chakra UI' },
          { deps: { '@mantine/core': '^6.0.0' }, expected: 'Mantine' },
          { deps: { 'react-bootstrap': '^2.0.0' }, expected: 'Bootstrap' },
          { deps: { tailwindcss: '^3.0.0' }, expected: 'Tailwind CSS' }
        ];

        for (const lib of libraries) {
          const projectDir = path.join(fixturesDir, `ui-lib-${lib.expected.replace(/\s+/g, '-')}`);
          fs.mkdirSync(projectDir, { recursive: true });
          fs.writeFileSync(
            path.join(projectDir, 'package.json'),
            JSON.stringify({ name: 'app', dependencies: lib.deps })
          );

          const values = await detectProjectValues(projectDir);
          expect(values.UI_LIBRARY).toBe(lib.expected);

          fs.rmSync(projectDir, { recursive: true, force: true });
        }
      });

      it('should default to "none" when no UI library detected', async () => {
        const projectDir = path.join(fixturesDir, 'no-ui-lib');
        fs.mkdirSync(projectDir, { recursive: true });
        fs.writeFileSync(
          path.join(projectDir, 'package.json'),
          JSON.stringify({ name: 'app', dependencies: {} })
        );

        const values = await detectProjectValues(projectDir);
        expect(values.UI_LIBRARY).toBe('none');

        fs.rmSync(projectDir, { recursive: true, force: true });
      });
    });
  });

  // =============================================================================
  // copyTemplate (Integration Test)
  // =============================================================================
  describe('copyTemplate', () => {
    describe('Happy paths', () => {
      it('should copy template files to target directory', async () => {
        const targetDir = path.join(fixturesDir, 'copy-test');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'package.json'),
          JSON.stringify({ name: 'test-app', dependencies: { react: '^18.0.0' } })
        );

        // Create a simple template
        const templateDir = path.join(templatesDir, 'test-template');
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(
          path.join(templateDir, 'Dockerfile'),
          'FROM node:18\nEXPOSE {{DEV_PORT}}'
        );

        await copyTemplate('test-template', targetDir);

        const dockerfilePath = path.join(targetDir, 'Dockerfile');
        expect(fs.existsSync(dockerfilePath)).toBe(true);

        const content = fs.readFileSync(dockerfilePath, 'utf8');
        expect(content).toContain('FROM node:18');
        expect(content).toContain('EXPOSE');
        expect(content).not.toContain('{{DEV_PORT}}'); // Should be replaced

        // Cleanup
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.rmSync(templateDir, { recursive: true, force: true });
      });

      it('should skip existing files', async () => {
        const targetDir = path.join(fixturesDir, 'skip-test');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'package.json'),
          JSON.stringify({ name: 'test-app' })
        );
        fs.writeFileSync(
          path.join(targetDir, 'Dockerfile'),
          'EXISTING CONTENT'
        );

        const templateDir = path.join(templatesDir, 'skip-template');
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(
          path.join(templateDir, 'Dockerfile'),
          'FROM node:18'
        );

        await copyTemplate('skip-template', targetDir);

        const content = fs.readFileSync(path.join(targetDir, 'Dockerfile'), 'utf8');
        expect(content).toBe('EXISTING CONTENT'); // Should not be overwritten

        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.rmSync(templateDir, { recursive: true, force: true });
      });
    });

    describe('Error handling', () => {
      it('should exit on non-existent template', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
          throw new Error(`process.exit(${code})`);
        });

        const targetDir = path.join(fixturesDir, 'error-test');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'package.json'),
          JSON.stringify({ name: 'app' })
        );

        await expect(copyTemplate('non-existent-template-xyz', targetDir)).rejects.toThrow('process.exit');

        mockExit.mockRestore();
        fs.rmSync(targetDir, { recursive: true, force: true });
      });

      it('should exit on template validation errors', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
          throw new Error(`process.exit(${code})`);
        });

        const targetDir = path.join(fixturesDir, 'validation-error-test');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'package.json'),
          JSON.stringify({ name: 'app' })
        );

        const templateDir = path.join(templatesDir, 'invalid-template');
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(
          path.join(templateDir, 'bad.txt'),
          'Unclosed brace: {{VARIABLE'
        );

        await expect(copyTemplate('invalid-template', targetDir)).rejects.toThrow();

        mockExit.mockRestore();
        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.rmSync(templateDir, { recursive: true, force: true });
      });

      it('should throw ValidationError for invalid template name', async () => {
        await expect(copyTemplate('../../../etc/passwd')).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError for invalid target directory', async () => {
        await expect(copyTemplate('basic', '../../')).rejects.toThrow(ValidationError);
      });
    });

    describe('State verification', () => {
      it('should replace template variables correctly', async () => {
        const targetDir = path.join(fixturesDir, 'replace-test');
        fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(
          path.join(targetDir, 'package.json'),
          JSON.stringify({ name: 'my-awesome-app', dependencies: { react: '^18.0.0' } })
        );

        const templateDir = path.join(templatesDir, 'replace-template');
        fs.mkdirSync(templateDir, { recursive: true });
        fs.writeFileSync(
          path.join(templateDir, 'config.txt'),
          'Project: {{PROJECT_NAME}}\nFramework: {{FRAMEWORK}}'
        );

        await copyTemplate('replace-template', targetDir);

        const content = fs.readFileSync(path.join(targetDir, 'config.txt'), 'utf8');
        expect(content).toContain('Project: my-awesome-app');
        expect(content).toContain('Framework: react');

        fs.rmSync(targetDir, { recursive: true, force: true });
        fs.rmSync(templateDir, { recursive: true, force: true });
      });
    });
  });
});
