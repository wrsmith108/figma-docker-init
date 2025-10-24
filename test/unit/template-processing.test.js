/**
 * Test: Template Processing Functions
 * Purpose: Test validateTemplate, checkBuildCompatibility, replaceTemplateVariables
 * Coverage Target: Lines 389-514 (~125 lines)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import {
  validateTemplate,
  checkBuildCompatibility,
  replaceTemplateVariables,
  ValidationError
} from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Template Processing Functions', () => {
  const fixturesDir = path.join(__dirname, '../fixtures/templates');

  // =============================================================================
  // validateTemplate
  // =============================================================================
  describe('validateTemplate', () => {
    const validVariables = {
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

    describe('Happy paths', () => {
      it('should return empty errors for valid template', () => {
        const templatePath = path.join(fixturesDir, 'valid-template');

        // Create fixture if it doesn't exist
        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(
            path.join(templatePath, 'Dockerfile'),
            'FROM node:18\nWORKDIR /app\nCOPY . .\nEXPOSE {{DEV_PORT}}\nRUN npm install'
          );
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect all required variables are present', () => {
        const templatePath = path.join(fixturesDir, 'minimal-template');

        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(path.join(templatePath, 'test.txt'), 'Test file');
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.errors).not.toContain(expect.stringContaining('Missing required variables'));
      });
    });

    describe('Error handling', () => {
      it('should detect missing required variables', () => {
        const templatePath = path.join(fixturesDir, 'minimal-template');
        const incompleteVars = { PROJECT_NAME: 'test' };

        const result = validateTemplate(templatePath, incompleteVars);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('Missing required variables');
      });

      it('should throw error for non-existent template directory', () => {
        const nonExistentPath = path.join(fixturesDir, 'non-existent-template-xyz');
        expect(() => validateTemplate(nonExistentPath, validVariables)).toThrow();
      });

      it('should detect unmatched template braces', () => {
        const templatePath = path.join(fixturesDir, 'invalid-braces');

        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(
            path.join(templatePath, 'bad.txt'),
            'Missing closing brace: {{VARIABLE'
          );
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.errors.some(err => err.includes('Unmatched template braces'))).toBe(true);
      });
    });

    describe('Warnings', () => {
      it('should warn about undefined template variables', () => {
        const templatePath = path.join(fixturesDir, 'undefined-vars');

        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(
            path.join(templatePath, 'test.txt'),
            'Using undefined variable: {{UNKNOWN_VAR}}'
          );
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.warnings.some(warn => warn.includes('Undefined template variable'))).toBe(true);
      });

      it('should warn about potentially unsafe content', () => {
        const templatePath = path.join(fixturesDir, 'unsafe-content');

        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(
            path.join(templatePath, 'script.html'),
            '<script>alert("XSS")</script>'
          );
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.warnings.some(warn => warn.includes('unsafe content'))).toBe(true);
      });

      it('should warn about javascript: protocol', () => {
        const templatePath = path.join(fixturesDir, 'js-protocol');

        if (!fs.existsSync(templatePath)) {
          fs.mkdirSync(templatePath, { recursive: true });
          fs.writeFileSync(
            path.join(templatePath, 'link.html'),
            '<a href="javascript:void(0)">Link</a>'
          );
        }

        const result = validateTemplate(templatePath, validVariables);
        expect(result.warnings.some(warn => warn.includes('unsafe content'))).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should handle template directory with no files', () => {
        const emptyPath = path.join(fixturesDir, 'empty-template');

        if (!fs.existsSync(emptyPath)) {
          fs.mkdirSync(emptyPath, { recursive: true });
        }

        const result = validateTemplate(emptyPath, validVariables);
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
      });

      it('should handle files with no template variables', () => {
        const noVarsPath = path.join(fixturesDir, 'no-vars');

        if (!fs.existsSync(noVarsPath)) {
          fs.mkdirSync(noVarsPath, { recursive: true });
          fs.writeFileSync(path.join(noVarsPath, 'plain.txt'), 'Plain text file');
        }

        const result = validateTemplate(noVarsPath, validVariables);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle multiple files with various patterns', () => {
        const multiPath = path.join(fixturesDir, 'multi-files');

        if (!fs.existsSync(multiPath)) {
          fs.mkdirSync(multiPath, { recursive: true });
          fs.writeFileSync(path.join(multiPath, 'file1.txt'), 'Project: {{PROJECT_NAME}}');
          fs.writeFileSync(path.join(multiPath, 'file2.txt'), 'Port: {{DEV_PORT}}');
          fs.writeFileSync(path.join(multiPath, 'file3.txt'), 'No variables');
        }

        const result = validateTemplate(multiPath, validVariables);
        expect(Array.isArray(result.errors)).toBe(true);
        expect(Array.isArray(result.warnings)).toBe(true);
      });
    });
  });

  // =============================================================================
  // checkBuildCompatibility
  // =============================================================================
  describe('checkBuildCompatibility', () => {
    describe('Happy paths', () => {
      it('should return empty errors for compatible configurations', () => {
        const result = checkBuildCompatibility('react', 'dist');
        expect(result.errors).toHaveLength(0);
      });

      it('should accept vite with build output directory', () => {
        const result = checkBuildCompatibility('vite', 'dist');
        expect(result.errors).toHaveLength(0);
      });

      it('should accept next.js with out directory', () => {
        const result = checkBuildCompatibility('next.js', 'out');
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });
    });

    describe('Warnings', () => {
      it('should warn when vite framework has no build output directory', () => {
        const result = checkBuildCompatibility('vite', null);
        expect(result.warnings.some(warn => warn.includes('Vite framework'))).toBe(true);
      });

      it('should warn when vite framework has undefined build output', () => {
        const result = checkBuildCompatibility('react-vite', undefined);
        expect(result.warnings.some(warn => warn.includes('Vite framework'))).toBe(true);
      });

      it('should warn when next.js uses non-standard output directory', () => {
        const result = checkBuildCompatibility('next.js', 'dist');
        expect(result.warnings.some(warn => warn.includes('Next.js'))).toBe(true);
      });

      it('should warn when next.js uses custom build dir', () => {
        const result = checkBuildCompatibility('next.js', 'build');
        expect(result.warnings.some(warn => warn.includes('typically uses "out"'))).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should handle empty framework string', () => {
        const result = checkBuildCompatibility('', 'dist');
        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
      });

      it('should handle various vite variants', () => {
        const frameworks = ['vite', 'react-vite', 'vue-vite', 'svelte-vite'];
        frameworks.forEach(framework => {
          const result = checkBuildCompatibility(framework, null);
          expect(result.warnings.some(w => w.includes('Vite'))).toBe(true);
        });
      });

      it('should not warn for non-vite frameworks without build dir', () => {
        const result = checkBuildCompatibility('react', null);
        expect(result.warnings.some(w => w.includes('Vite'))).toBe(false);
      });
    });

    describe('State verification', () => {
      it('should return consistent results for same inputs', () => {
        const result1 = checkBuildCompatibility('vite', 'dist');
        const result2 = checkBuildCompatibility('vite', 'dist');
        expect(result1).toEqual(result2);
      });
    });
  });

  // =============================================================================
  // replaceTemplateVariables
  // =============================================================================
  describe('replaceTemplateVariables', () => {
    const variables = {
      PROJECT_NAME: 'my-app',
      PORT: '3000',
      BUILD_DIR: 'dist',
      BOOLEAN_VAR: true,
      NUMBER_VAR: 42
    };

    describe('Happy paths', () => {
      it('should replace single variable', () => {
        const content = 'Project: {{PROJECT_NAME}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('Project: my-app');
      });

      it('should replace multiple variables', () => {
        const content = 'Project {{PROJECT_NAME}} on port {{PORT}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('Project my-app on port 3000');
      });

      it('should replace same variable multiple times', () => {
        const content = '{{PROJECT_NAME}} - {{PROJECT_NAME}} - {{PROJECT_NAME}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('my-app - my-app - my-app');
      });

      it('should handle boolean variables', () => {
        const content = 'TypeScript: {{BOOLEAN_VAR}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('TypeScript: true');
      });

      it('should handle number variables', () => {
        const content = 'Count: {{NUMBER_VAR}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('Count: 42');
      });

      it('should preserve content without variables', () => {
        const content = 'No variables here';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('No variables here');
      });
    });

    describe('Edge cases', () => {
      it('should keep placeholder for undefined variables', () => {
        const content = 'Value: {{UNDEFINED_VAR}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('Value: {{UNDEFINED_VAR}}');
      });

      it('should handle empty content', () => {
        const result = replaceTemplateVariables('', variables);
        expect(result).toBe('');
      });

      it('should handle content with only variables', () => {
        const content = '{{PROJECT_NAME}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('my-app');
      });

      it('should handle variables at start, middle, and end', () => {
        const content = '{{PROJECT_NAME}} middle {{PORT}} end {{BUILD_DIR}}';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toBe('my-app middle 3000 end dist');
      });

      it('should handle malformed brackets gracefully', () => {
        const content = 'Partial {PROJECT_NAME} or {{PROJECT_NAME';
        const result = replaceTemplateVariables(content, variables);
        expect(result).toContain('Partial {PROJECT_NAME}');
      });

      it('should handle nested-looking patterns', () => {
        const content = '{{{{PROJECT_NAME}}}}';
        const result = replaceTemplateVariables(content, variables);
        // Should replace the inner valid pattern
        expect(result).toContain('my-app');
      });
    });

    describe('Sanitization', () => {
      it('should sanitize string variables with angle brackets', () => {
        const unsafeVars = {
          UNSAFE: '<script>alert("xss")</script>'
        };
        const content = 'Content: {{UNSAFE}}';
        const result = replaceTemplateVariables(content, unsafeVars);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
      });

      it('should trim whitespace from string variables', () => {
        const spacedVars = {
          SPACED: '  value  '
        };
        const content = '{{SPACED}}';
        const result = replaceTemplateVariables(content, spacedVars);
        expect(result).toBe('value');
      });

      it('should handle sanitization errors gracefully', () => {
        const tooLongVars = {
          TOO_LONG: 'a'.repeat(1001)
        };
        const content = '{{TOO_LONG}}';
        const result = replaceTemplateVariables(content, tooLongVars);
        // Should keep placeholder on sanitization failure
        expect(result).toBe('{{TOO_LONG}}');
      });
    });

    describe('State verification', () => {
      it('should not modify input content', () => {
        const content = 'Project: {{PROJECT_NAME}}';
        const originalContent = content;
        replaceTemplateVariables(content, variables);
        expect(content).toBe(originalContent);
      });

      it('should not modify variables object', () => {
        const originalVars = { ...variables };
        replaceTemplateVariables('{{PROJECT_NAME}}', variables);
        expect(variables).toEqual(originalVars);
      });

      it('should produce consistent results', () => {
        const content = '{{PROJECT_NAME}} - {{PORT}}';
        const result1 = replaceTemplateVariables(content, variables);
        const result2 = replaceTemplateVariables(content, variables);
        expect(result1).toBe(result2);
      });
    });
  });
});
