/**
 * Integration tests for Dockerfile generation with correct build flags
 * Tests the critical STATIC_BUILD and SERVER_BUILD flag detection
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TemplateComposer } from '../../src/lib/template-composer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Dockerfile Generation Integration Tests', () => {
  let composer;
  // Use the actual templates directory (not fragments subdirectory)
  const projectRoot = path.join(__dirname, '../..');
  const templatesDir = path.join(projectRoot, 'src/templates');

  beforeEach(() => {
    composer = new TemplateComposer(templatesDir);
  });

  describe('STATIC_BUILD flag detection', () => {
    it('should set STATIC_BUILD=true for figma-make projects', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      // Should NOT contain unprocessed conditionals
      expect(dockerfile).not.toContain('{{#if STATIC_BUILD}}');
      expect(dockerfile).not.toContain('{{/if}}');

      // Should contain COPY commands for static build
      expect(dockerfile).toContain('COPY --from=builder');
      expect(dockerfile).toContain('/app/dist');

      // Should NOT have "false" literal value
      expect(dockerfile).not.toMatch(/BUILD_ENV_VARS}}\s*false/);
    });

    it('should set STATIC_BUILD=true for lovable projects', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'lovable',
        framework: 'react-vite',
        metadata: {
          port: 8080,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).not.toContain('{{#if STATIC_BUILD}}');
      expect(dockerfile).toContain('COPY --from=builder');
      expect(dockerfile).toContain('/app/dist');
    });

    it('should set STATIC_BUILD=true for bolt projects', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'bolt',
        framework: 'react-vite',
        metadata: {
          port: 8080,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).not.toContain('{{#if STATIC_BUILD}}');
      expect(dockerfile).toContain('COPY --from=builder');
      expect(dockerfile).toContain('/app/dist');
    });

    it('should set STATIC_BUILD=true for vite-based frameworks', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'unknown',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).not.toContain('{{#if STATIC_BUILD}}');
      expect(dockerfile).toContain('COPY --from=builder');
    });
  });

  describe('SERVER_BUILD flag detection', () => {
    it('should set SERVER_BUILD=true for v0 projects', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'v0',
        framework: 'nextjs',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      // Should NOT contain unprocessed conditionals
      expect(dockerfile).not.toContain('{{#if SERVER_BUILD}}');
      expect(dockerfile).not.toContain('{{/if}}');

      // Should contain COPY commands for server build
      expect(dockerfile).toContain('COPY --from=builder');
      // Next.js specific paths
      expect(dockerfile).toContain('.next');
    });

    it('should set SERVER_BUILD=true for next framework', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'unknown',
        framework: 'next',
        metadata: {
          port: 3000,
          nodeVersion: '20',
          framework: 'next'
        }
      });

      expect(dockerfile).not.toContain('{{#if SERVER_BUILD}}');
      expect(dockerfile).toContain('.next');
    });

    it('should set SERVER_BUILD=true for nextjs framework', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'unknown',
        framework: 'nextjs',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).not.toContain('{{#if SERVER_BUILD}}');
      expect(dockerfile).toContain('.next');
    });
  });

  describe('Package manager flag detection', () => {
    it('should set YARN=true when package manager is yarn', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20',
          packageManager: 'yarn'
        }
      });

      // yarn.lock should be copied
      expect(dockerfile).toContain('yarn.lock');
      expect(dockerfile).not.toContain('{{#if YARN}}');
    });

    it('should set PNPM=true when package manager is pnpm', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20',
          packageManager: 'pnpm'
        }
      });

      // pnpm-lock.yaml should be copied
      expect(dockerfile).toContain('pnpm-lock.yaml');
      expect(dockerfile).not.toContain('{{#if PNPM}}');
    });

    it('should default to npm when package manager not specified', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      // Should use npm ci
      expect(dockerfile).toContain('npm ci');
      expect(dockerfile).not.toContain('yarn.lock');
      expect(dockerfile).not.toContain('pnpm-lock.yaml');
    });
  });

  describe('No unprocessed template syntax', () => {
    const tools = ['figma', 'figma-make', 'lovable', 'bolt', 'v0'];

    tools.forEach(tool => {
      it(`should have no unprocessed Handlebars syntax for ${tool}`, async () => {
        const dockerfile = await composer.generateDockerfile({
          tool,
          framework: tool === 'v0' ? 'nextjs' : 'react-vite',
          metadata: {
            port: 3000,
            nodeVersion: '20'
          }
        });

        // No unprocessed conditionals
        expect(dockerfile).not.toContain('{{#if');
        expect(dockerfile).not.toContain('{{/if}}');

        // No unprocessed variables (except intentional comments)
        const unprocessedVars = dockerfile.match(/\{\{[^}]+\}\}/g);
        expect(unprocessedVars).toBeNull();
      });
    });
  });

  describe('Crossvideoux-specific regression test', () => {
    it('should generate valid Dockerfile for Vite + React project', async () => {
      // Simulate Crossvideoux project detection
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20',
          buildCommand: 'vite build',
          startCommand: 'npm", "run", "dev',
          installCommand: 'npm ci'
        }
      });

      // Critical checks from user bug report
      expect(dockerfile).not.toContain('{{#if PNPM}}');
      expect(dockerfile).not.toContain('{{#if BUILD_ENV_VARS}}');
      expect(dockerfile).not.toContain('{{#if STATIC_BUILD}}');
      expect(dockerfile).not.toContain('{{#if SERVER_BUILD}}');

      // Should have working WORKDIR
      expect(dockerfile).toContain('WORKDIR /app');

      // Should have proper COPY commands in production stage
      expect(dockerfile).toContain('COPY --from=builder');
      expect(dockerfile).toContain('/app/dist');

      // Should NOT have duplicate CMD instructions
      const cmdMatches = dockerfile.match(/^CMD\s+\[/gm);
      expect(cmdMatches?.length).toBeLessThanOrEqual(1);

      // Should have correct user (not node:1001)
      expect(dockerfile).not.toContain('USER node');
      expect(dockerfile).toContain('USER appuser');

      // Should NOT have "false" literal
      expect(dockerfile).not.toMatch(/BUILD_ENV_VARS}}\s*false/);
    });
  });

  describe('Build context validation', () => {
    it('should generate Dockerfile that works with docker-compose build context', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      // Paths should be relative to project root (not .vibe-docker/)
      expect(dockerfile).toContain('COPY package*.json ./');
      expect(dockerfile).toContain('COPY . .');

      // Should NOT have absolute paths
      expect(dockerfile).not.toContain('COPY /.vibe-docker');
      expect(dockerfile).not.toContain('WORKDIR /.vibe-docker');
    });
  });

  describe('Production readiness checks', () => {
    it('should have health check endpoint', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).toContain('HEALTHCHECK');
    });

    it('should expose correct port', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 5173,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).toContain('EXPOSE 5173');
    });

    it('should run as non-root user', async () => {
      const dockerfile = await composer.generateDockerfile({
        tool: 'figma-make',
        framework: 'react-vite',
        metadata: {
          port: 3000,
          nodeVersion: '20'
        }
      });

      expect(dockerfile).toContain('USER appuser');
      expect(dockerfile).toContain('RUN adduser --system --uid 1001 appuser');
    });
  });
});
