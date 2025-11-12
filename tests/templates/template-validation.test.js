/**
 * Template Validation Tests
 *
 * Validates Docker template quality and security:
 * - Dockerfile syntax and structure
 * - Multi-stage build configuration
 * - Base image security
 * - Layer optimization
 * - Health checks
 * - Non-root user configuration
 * - docker-compose.yml validation
 *
 * Critical Success Criterion: All templates must pass security checks
 */

import { describe, test, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import path from 'path';
import { TemplateValidator } from '../../src/lib/template-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Template Validation', () => {
  let validator;
  const templatesDir = path.join(__dirname, '../../src/templates/tools');

  beforeAll(() => {
    validator = new TemplateValidator();
  });

  describe('Dockerfile Syntax Validation', () => {

    test('should validate Lovable Dockerfile syntax', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');

      const result = await validator.validateDockerfile(dockerfilePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate Bolt Dockerfile syntax', async () => {
      const dockerfilePath = path.join(templatesDir, 'bolt', 'Dockerfile');

      const result = await validator.validateDockerfile(dockerfilePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate V0 Dockerfile syntax', async () => {
      const dockerfilePath = path.join(templatesDir, 'v0', 'Dockerfile');

      const result = await validator.validateDockerfile(dockerfilePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate Figma Make Dockerfile syntax', async () => {
      const dockerfilePath = path.join(templatesDir, 'figma-make', 'Dockerfile');

      const result = await validator.validateDockerfile(dockerfilePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid Dockerfile syntax', async () => {
      const invalidDockerfile = `
        INVALID_INSTRUCTION node:20
        RUN missing continuation \\
      `;

      const result = await validator.validateDockerfileContent(invalidDockerfile);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate FROM instruction format', async () => {
      const validFrom = 'FROM node:20-alpine AS builder';
      const invalidFrom = 'FROM node';

      expect(await validator.validateInstruction(validFrom)).toBe(true);
      expect(await validator.validateInstruction(invalidFrom)).toBe(false);
    });

    test('should validate RUN instruction format', async () => {
      const validRun = 'RUN npm ci --only=production';
      const invalidRun = 'RUN';

      expect(await validator.validateInstruction(validRun)).toBe(true);
      expect(await validator.validateInstruction(invalidRun)).toBe(false);
    });
  });

  describe('Multi-Stage Build Validation', () => {

    test('should enforce multi-stage builds for all templates', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should have at least builder and production stages
        expect(content).toMatch(/FROM .+ AS builder/i);
        expect(content).toMatch(/FROM .+ AS production/i);
      }
    });

    test('should validate stage naming conventions', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const stages = content.match(/FROM .+ AS (\w+)/gi) || [];
      const stageNames = stages.map(s => s.match(/AS (\w+)/i)[1]);

      // Valid stage names
      const validStageNames = ['builder', 'dependencies', 'production', 'development'];
      stageNames.forEach(name => {
        expect(validStageNames).toContain(name.toLowerCase());
      });
    });

    test('should copy artifacts between stages correctly', async () => {
      const dockerfilePath = path.join(templatesDir, 'v0', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      // Should copy from builder stage
      expect(content).toMatch(/COPY --from=builder/i);
    });

    test('should minimize final stage size', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        const productionStage = content.match(/FROM .+ AS production[\s\S]*$/i)?.[0] || '';

        // Production stage should not install devDependencies
        expect(productionStage).not.toContain('npm install');

        // Should use --only=production or npm ci
        if (productionStage.includes('npm')) {
          expect(productionStage).toMatch(/npm ci|--only=production/);
        }
      }
    });
  });

  describe('Base Image Security', () => {

    test('should use official Node.js Alpine images', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should use Alpine variant
        expect(content).toMatch(/FROM node:\d+-alpine/);
      }
    });

    test('should pin specific Node.js versions', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should NOT use 'latest' tag
        expect(content).not.toMatch(/FROM node:latest/i);

        // Should specify major version
        expect(content).toMatch(/FROM node:\d+/);
      }
    });

    test('should validate base image security vulnerabilities', async () => {
      const baseImage = 'node:20-alpine';

      const vulnerabilities = await validator.checkImageVulnerabilities(baseImage);

      // Should have low/no critical vulnerabilities
      const critical = vulnerabilities.filter(v => v.severity === 'critical');
      expect(critical.length).toBeLessThan(3);
    });

    test('should use minimal base images', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Alpine is minimal (~5MB vs ~900MB for full Node)
        expect(content).toContain('alpine');

        // Should not use full/slim variants unless necessary
        expect(content).not.toMatch(/FROM node:\d+-stretch/);
      }
    });
  });

  describe('Layer Optimization', () => {

    test('should copy package files before source code', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        const lines = content.split('\n');
        const packageCopyIndex = lines.findIndex(l => l.includes('package*.json'));
        const sourceCopyIndex = lines.findIndex(l => l.match(/COPY \. \./));

        // package.json should be copied before source code
        if (packageCopyIndex !== -1 && sourceCopyIndex !== -1) {
          expect(packageCopyIndex).toBeLessThan(sourceCopyIndex);
        }
      }
    });

    test('should use npm ci instead of npm install', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Prefer npm ci for deterministic builds
        if (content.includes('npm install')) {
          // If npm install is used, it should be for specific reasons
          expect(content).toMatch(/npm ci|npm install --production/);
        }
      }
    });

    test('should combine RUN commands to reduce layers', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      // Count RUN instructions
      const runCount = (content.match(/^RUN /gm) || []).length;

      // Should have reasonable number of layers (<10)
      expect(runCount).toBeLessThan(10);
    });

    test('should clean up package manager cache', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should clean npm cache or use --no-cache flag
        const hasCleanup = content.includes('npm cache clean') ||
                          content.includes('--no-cache') ||
                          content.includes('rm -rf /tmp/*');

        expect(hasCleanup).toBe(true);
      }
    });
  });

  describe('Health Check Configuration', () => {

    test('should include HEALTHCHECK instruction', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        expect(content).toMatch(/HEALTHCHECK/i);
      }
    });

    test('should configure appropriate health check intervals', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const healthcheck = content.match(/HEALTHCHECK.+/i)?.[0] || '';

      // Should have interval, timeout, retries
      expect(healthcheck).toMatch(/--interval=/);
      expect(healthcheck).toMatch(/--timeout=/);
      expect(healthcheck).toMatch(/--retries=/);
    });

    test('should use appropriate health check commands', async () => {
      const tools = [
        { name: 'lovable', port: 8080 },
        { name: 'bolt', port: 5173 },
        { name: 'v0', port: 3000 },
        { name: 'figma-make', port: 5173 }
      ];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool.name, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        const healthcheck = content.match(/HEALTHCHECK.+/i)?.[0] || '';

        // Should check HTTP endpoint
        expect(healthcheck).toMatch(/curl|wget|nc/);
      }
    });
  });

  describe('Non-Root User Configuration', () => {

    test('should run as non-root user', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should have USER instruction
        expect(content).toMatch(/USER \w+/);

        // Should not be root
        expect(content).not.toMatch(/USER root/i);
      }
    });

    test('should use node user for Node.js applications', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        expect(content).toContain('USER node');
      }
    });

    test('should set correct file permissions for non-root user', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      // Should change ownership or use --chown flag
      const hasOwnership = content.includes('chown') ||
                          content.includes('--chown=node:node');

      expect(hasOwnership).toBe(true);
    });
  });

  describe('docker-compose.yml Validation', () => {

    test('should validate compose file syntax', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const composePath = path.join(templatesDir, tool, 'docker-compose.yml');

        const result = await validator.validateComposeFile(composePath);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should use compose file version 3.8', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const composePath = path.join(templatesDir, tool, 'docker-compose.yml');
        const content = await fs.readFile(composePath, 'utf-8');

        expect(content).toMatch(/version:\s*["']3\.8["']/);
      }
    });

    test('should define proper service structure', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const composePath = path.join(templatesDir, tool, 'docker-compose.yml');
        const content = await fs.readFile(composePath, 'utf-8');

        expect(content).toContain('services:');
        expect(content).toContain('build:');
        expect(content).toContain('ports:');
      }
    });

    test('should configure proper volume mounts', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const composePath = path.join(templatesDir, tool, 'docker-compose.yml');
        const content = await fs.readFile(composePath, 'utf-8');

        // Should mount source code
        expect(content).toMatch(/volumes:/);

        // Should preserve node_modules
        expect(content).toContain('node_modules');
      }
    });

    test('should configure environment variables', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const composePath = path.join(templatesDir, tool, 'docker-compose.yml');
        const content = await fs.readFile(composePath, 'utf-8');

        // Should reference .env file or define environment
        const hasEnv = content.includes('env_file:') ||
                      content.includes('environment:');

        expect(hasEnv).toBe(true);
      }
    });

    test('should configure proper networks', async () => {
      const composePath = path.join(templatesDir, 'lovable', 'docker-compose.yml');
      const content = await fs.readFile(composePath, 'utf-8');

      if (content.includes('networks:')) {
        // If networks are defined, should have driver
        expect(content).toMatch(/driver:\s*bridge/);
      }
    });
  });

  describe('Template Variable Substitution', () => {

    test('should use consistent variable syntax', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Variables should use {{ variable }} syntax
        const variables = content.match(/\{\{.+?\}\}/g) || [];

        variables.forEach(variable => {
          // Should have spaces around variable name
          expect(variable).toMatch(/\{\{\s*\w+\s*\}\}/);
        });
      }
    });

    test('should validate all template variables are defined', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const composePath = path.join(templatesDir, 'lovable', 'docker-compose.yml');

      const dockerfileVars = await validator.extractTemplateVariables(dockerfilePath);
      const composeVars = await validator.extractTemplateVariables(composePath);

      // All variables should have default values or be required
      const allVars = [...dockerfileVars, ...composeVars];

      for (const varName of allVars) {
        const hasDefault = await validator.hasDefaultValue(varName);
        const isRequired = await validator.isRequiredVariable(varName);

        expect(hasDefault || isRequired).toBe(true);
      }
    });
  });

  describe('Security Best Practices', () => {

    test('should not expose sensitive information in templates', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should not contain hardcoded secrets
        expect(content).not.toMatch(/password.*=.*\w+/i);
        expect(content).not.toMatch(/api_key.*=.*\w+/i);
        expect(content).not.toMatch(/secret.*=.*\w+/i);
      }
    });

    test('should use secure package installation', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');
        const content = await fs.readFile(dockerfilePath, 'utf-8');

        // Should not use --ignore-scripts unless necessary
        if (content.includes('--ignore-scripts')) {
          // Should have security justification comment
          expect(content).toMatch(/# Security:.+ignore-scripts/i);
        }
      }
    });

    test('should validate .dockerignore patterns', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerignorePath = path.join(templatesDir, tool, '.dockerignore');
        const content = await fs.readFile(dockerignorePath, 'utf-8');

        // Should ignore sensitive files
        expect(content).toContain('node_modules');
        expect(content).toContain('.env');
        expect(content).toContain('.git');
        expect(content).toMatch(/\.env\.\w+/);
      }
    });
  });

  describe('Build Performance Validation', () => {

    test('should estimate build time complexity', async () => {
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];

      for (const tool of tools) {
        const dockerfilePath = path.join(templatesDir, tool, 'Dockerfile');

        const complexity = await validator.estimateBuildComplexity(dockerfilePath);

        // Should be optimized (low-medium complexity)
        expect(['low', 'medium']).toContain(complexity.level);
      }
    });

    test('should use build cache effectively', async () => {
      const dockerfilePath = path.join(templatesDir, 'lovable', 'Dockerfile');
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const lines = content.split('\n').filter(l => l.trim());

      // Expensive operations should be early in the file
      const npmCiIndex = lines.findIndex(l => l.includes('npm ci'));
      const copySourceIndex = lines.findIndex(l => l.match(/COPY \. \./));

      if (npmCiIndex !== -1 && copySourceIndex !== -1) {
        // Dependencies should be installed before copying source
        expect(npmCiIndex).toBeLessThan(copySourceIndex);
      }
    });
  });
});
