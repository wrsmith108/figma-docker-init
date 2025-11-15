/**
 * Regression Test: Crossvideoux Project Init Failure
 *
 * This test simulates the exact error scenario reported by the user:
 * - Project name "Crossvideoux" validation
 * - Environment variable detection with missing files property
 * - Template validation using correct method
 *
 * These tests ensure the fixes prevent the original errors:
 * 1. Error at 20%: "Project name contains invalid characters"
 * 2. Error at 80%: "Cannot read properties of undefined (reading 'length')"
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateProjectName, ValidationError } from '../../vibe-to-docker.js';
import { EnvManager } from '../../src/lib/env-manager.js';
import { TemplateValidator } from '../../src/lib/template-validator.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Crossvideoux Regression Tests', () => {
  describe('Issue #1: Project Name Validation at 20% Progress', () => {
    it('should normalize "Crossvideoux" project name instead of throwing error', () => {
      // This was causing: "Project name contains invalid characters"
      const result = validateProjectName('Crossvideoux');

      // Should normalize to lowercase
      expect(result).toBe('crossvideoux');
      expect(() => validateProjectName('Crossvideoux')).not.toThrow();
    });

    it('should handle real-world package.json name variations', () => {
      // Common package name patterns from Figma Make exports
      expect(validateProjectName('MyFigmaProject')).toBe('myfigmaproject');
      expect(validateProjectName('My_Figma_Project')).toBe('my-figma-project');
      expect(validateProjectName('My Figma Project')).toBe('my-figma-project');
      expect(validateProjectName('my-figma-project-v2')).toBe('my-figma-project-v2');
    });

    it('should handle package names with special characters', () => {
      // Figma exports might have these patterns
      expect(validateProjectName('@company/project')).toBe('companyproject');
      expect(validateProjectName('project (v2.0)')).toBe('project-v2.0');
      expect(validateProjectName('project-2024-01')).toBe('project-2024-01');
    });
  });

  describe('Issue #2: Environment Variable Detection at 80% Progress', () => {
    let tempDir;
    let envManager;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crossvideoux-test-'));
      envManager = new EnvManager(tempDir);
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should handle environment variables with missing files property', () => {
      // This was causing: "Cannot read properties of undefined (reading 'length')"
      const malformedVars = new Map([
        ['VITE_API_URL', { name: 'VITE_API_URL', isBuildTime: true, isSecret: false }], // Missing files
        ['API_KEY', { name: 'API_KEY', files: undefined, isBuildTime: false, isSecret: true }] // Undefined files
      ]);

      // Should not throw error during .env.example generation
      expect(() => {
        const content = envManager.generateEnvExample({
          variables: malformedVars,
          includeComments: true,
          groupByType: true
        });
        expect(content).toContain('VITE_API_URL=');
        expect(content).toContain('API_KEY=');
      }).not.toThrow();
    });

    it('should handle mixed valid and invalid variable data', () => {
      const mixedVars = new Map([
        ['VALID_VAR', { name: 'VALID_VAR', files: ['src/App.jsx'], isBuildTime: false, isSecret: false }],
        ['NO_FILES', { name: 'NO_FILES', isBuildTime: true, isSecret: false }], // Missing files property
        ['NULL_FILES', { name: 'NULL_FILES', files: null, isBuildTime: false, isSecret: false }],
        ['UNDEFINED_FILES', { name: 'UNDEFINED_FILES', files: undefined, isBuildTime: false, isSecret: true }]
      ]);

      const content = envManager.generateEnvExample({
        variables: mixedVars,
        includeComments: true,
        groupByType: true
      });

      // All variables should be included
      expect(content).toContain('VALID_VAR=');
      expect(content).toContain('NO_FILES=');
      expect(content).toContain('NULL_FILES=');
      expect(content).toContain('UNDEFINED_FILES=');

      // File usage comment should only appear for VALID_VAR
      const lines = content.split('\n');
      const validVarIndex = lines.findIndex(line => line.includes('VALID_VAR='));
      expect(lines[validVarIndex - 1]).toContain('# Used in:');
      expect(lines[validVarIndex - 1]).toContain('src/App.jsx');
    });

    it('should handle completely null variable info objects', () => {
      const badVars = new Map([
        ['NULL_VAR', null],
        ['UNDEFINED_VAR', undefined],
        ['VALID_VAR', { name: 'VALID_VAR', files: [], isBuildTime: false, isSecret: false }]
      ]);

      const content = envManager.generateEnvExample({
        variables: badVars,
        includeComments: true,
        groupByType: false
      });

      // Should skip null/undefined and only include valid var
      expect(content).toContain('VALID_VAR=');
      expect(content).not.toContain('NULL_VAR=');
      expect(content).not.toContain('UNDEFINED_VAR=');
    });
  });

  describe('Issue #3: Validator Method at 80% Progress', () => {
    it('should use validateDockerfileContent instead of validateDockerfile', () => {
      const validator = new TemplateValidator();

      const dockerfileContent = `
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
      `.trim();

      // Should work with content string
      const result = validator.validateDockerfileContent(dockerfileContent);

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate Figma Make Dockerfile content correctly', () => {
      const validator = new TemplateValidator();

      const figmaMakeDockerfile = `
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
      `.trim();

      const result = validator.validateDockerfileContent(figmaMakeDockerfile);

      expect(result.errors.length).toBe(0);
      expect(result.valid).toBe(true);
    });
  });

  describe('Full Integration: Simulated Crossvideoux Init Flow', () => {
    let tempDir;

    beforeEach(async () => {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'crossvideoux-integration-'));
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should complete full init flow without errors', async () => {
      // Step 1: Validate project name (20% progress)
      const projectName = validateProjectName('Crossvideoux');
      expect(projectName).toBe('crossvideoux');

      // Step 2: Create mock project structure
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'src', 'App.jsx'),
        'const apiUrl = import.meta.env.VITE_API_URL;'
      );
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: projectName, version: '1.0.0' })
      );

      // Step 3: Environment detection (should not crash)
      const envManager = new EnvManager(tempDir);
      await envManager.detectVariables();

      const envExample = envManager.generateEnvExample({
        includeComments: true,
        groupByType: true
      });

      expect(envExample).toContain('VITE_API_URL=');

      // Step 4: Dockerfile validation (80% progress)
      const validator = new TemplateValidator();
      const dockerfile = `
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
      `.trim();

      const validation = validator.validateDockerfileContent(dockerfile);

      expect(validation.errors.length).toBe(0);
      expect(validation.valid).toBe(true);
    });
  });
});
