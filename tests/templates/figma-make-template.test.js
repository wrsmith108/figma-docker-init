/**

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 * Figma Make Template Test Suite
 * Tests for Figma Make (React + Vite + TypeScript) Docker template
 * Target: >15 tests
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../../src/templates/tools/figma-make');

describe('Figma Make Template Files', () => {
  it('should have Dockerfile', () => {
    const dockerfilePath = path.join(TEMPLATE_DIR, 'Dockerfile');
    expect(fs.existsSync(dockerfilePath)).toBe(true);
  });

  it('should have .dockerignore', () => {
    const dockerignorePath = path.join(TEMPLATE_DIR, '.dockerignore');
    expect(fs.existsSync(dockerignorePath)).toBe(true);
  });

  it('should have docker-compose.yml', () => {
    const composePath = path.join(TEMPLATE_DIR, 'docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
  });

  it('should have .env.example', () => {
    const envPath = path.join(TEMPLATE_DIR, '.env.example');
    expect(fs.existsSync(envPath)).toBe(true);
  });

  it('should have README.md', () => {
    const readmePath = path.join(TEMPLATE_DIR, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
  });
});

describe('Figma Make Dockerfile Structure', () => {
  let dockerfileContent;

  beforeAll(() => {
    const dockerfilePath = path.join(TEMPLATE_DIR, 'Dockerfile');
    dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  });

  it('should be multi-stage build', () => {
    expect(dockerfileContent).toMatch(/FROM node:20-alpine AS builder/);
    expect(dockerfileContent).toMatch(/FROM node:20-alpine AS production/);
  });

  it('should use Node 20 Alpine', () => {
    expect(dockerfileContent).toMatch(/FROM node:20-alpine/);
  });

  it('should expose port placeholder', () => {
    expect(dockerfileContent).toMatch(/EXPOSE {{PORT}}/);
  });

  it('should include health check', () => {
    expect(dockerfileContent).toMatch(/HEALTHCHECK/);
  });

  it('should create non-root user', () => {
    expect(dockerfileContent).toMatch(/adduser.*figma/);
    expect(dockerfileContent).toMatch(/USER figma/);
  });

  it('should use npm ci for dependencies', () => {
    expect(dockerfileContent).toMatch(/npm ci/);
  });

  it('should build the Vite application', () => {
    expect(dockerfileContent).toMatch(/npm run build/);
  });

  it('should install serve globally', () => {
    expect(dockerfileContent).toMatch(/npm install -g serve/);
  });

  it('should copy dist folder', () => {
    expect(dockerfileContent).toMatch(/COPY --from=builder \/app\/dist/);
  });

  it('should serve static files', () => {
    expect(dockerfileContent).toMatch(/CMD.*serve.*-s.*dist/);
  });
});

describe('Figma Make Environment Variables', () => {
  let envContent;

  beforeAll(() => {
    const envPath = path.join(TEMPLATE_DIR, '.env.example');
    envContent = fs.readFileSync(envPath, 'utf8');
  });

  it('should include PORT variable with default 5173', () => {
    expect(envContent).toMatch(/PORT=5173/);
  });

  it('should include NODE_ENV variable', () => {
    expect(envContent).toMatch(/NODE_ENV/);
  });

  it('should include PROJECT_NAME variable', () => {
    expect(envContent).toMatch(/PROJECT_NAME/);
  });

  it('should include VITE prefix for environment variables', () => {
    expect(envContent).toMatch(/VITE_/);
  });
});

describe('Figma Make Docker Compose', () => {
  let composeContent;

  beforeAll(() => {
    const composePath = path.join(TEMPLATE_DIR, 'docker-compose.yml');
    composeContent = fs.readFileSync(composePath, 'utf8');
  });

  it('should define figma-make-app service', () => {
    expect(composeContent).toMatch(/figma-make-app:/);
  });

  it('should map port placeholder', () => {
    expect(composeContent).toMatch(/{{PORT}}:{{PORT}}/);
  });

  it('should include PORT environment variable', () => {
    expect(composeContent).toMatch(/PORT={{PORT}}/);
  });

  it('should include health check', () => {
    expect(composeContent).toMatch(/healthcheck:/);
  });

  it('should use restart policy', () => {
    expect(composeContent).toMatch(/restart:.*unless-stopped/);
  });

  it('should define network', () => {
    expect(composeContent).toMatch(/networks:/);
    expect(composeContent).toMatch(/figma-make-network:/);
  });
});

describe('Figma Make .dockerignore', () => {
  let dockerignoreContent;

  beforeAll(() => {
    const dockerignorePath = path.join(TEMPLATE_DIR, '.dockerignore');
    dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
  });

  it('should ignore node_modules', () => {
    expect(dockerignoreContent).toMatch(/node_modules/);
  });

  it('should ignore dist folder', () => {
    expect(dockerignoreContent).toMatch(/dist/);
  });

  it('should ignore .vite folder', () => {
    expect(dockerignoreContent).toMatch(/\.vite/);
  });

  it('should ignore .env files', () => {
    expect(dockerignoreContent).toMatch(/\.env/);
  });

  it('should ignore git directory', () => {
    expect(dockerignoreContent).toMatch(/\.git/);
  });

  it('should keep .env.example', () => {
    expect(dockerignoreContent).toMatch(/!\.env\.example/);
  });

  it('should ignore .figma files', () => {
    expect(dockerignoreContent).toMatch(/\.figma/);
  });

  it('should ignore CSS module type definitions', () => {
    expect(dockerignoreContent).toMatch(/\.module\.css\.d\.ts/);
  });
});

describe('Figma Make README Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(TEMPLATE_DIR, 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  it('should include title', () => {
    expect(readmeContent).toMatch(/# Figma Make Docker Template/);
  });

  it('should include features section', () => {
    expect(readmeContent).toMatch(/## Features/);
  });

  it('should mention React and TypeScript', () => {
    expect(readmeContent).toMatch(/React.*TypeScript/);
  });

  it('should mention Vite', () => {
    expect(readmeContent).toMatch(/Vite/);
  });

  it('should include quick start guide', () => {
    expect(readmeContent).toMatch(/## Quick Start/);
  });

  it('should document environment variables', () => {
    expect(readmeContent).toMatch(/Environment Variables/);
  });

  it('should include troubleshooting section', () => {
    expect(readmeContent).toMatch(/Troubleshooting/);
  });

  it('should mention port 5173', () => {
    expect(readmeContent).toMatch(/5173/);
  });

  it('should document Figma to React workflow', () => {
    expect(readmeContent).toMatch(/Figma.*React/i);
  });

  it('should mention CSS Modules support', () => {
    expect(readmeContent).toMatch(/CSS Modules/);
  });

  it('should document component structure', () => {
    expect(readmeContent).toMatch(/Component/i);
  });
});

describe('Figma Make Template Optimization', () => {
  let dockerfileContent;

  beforeAll(() => {
    const dockerfilePath = path.join(TEMPLATE_DIR, 'Dockerfile');
    dockerfileContent = fs.readFileSync(dockerfilePath, 'utf8');
  });

  it('should have minimal production image', () => {
    // No node_modules in production stage, just static files
    const productionStage = dockerfileContent.split('AS production')[1];
    expect(productionStage).not.toMatch(/COPY.*node_modules/);
  });

  it('should not have node_modules in production (static files only)', () => {
    // Figma Make serves static files only, no node_modules needed in production
    const productionStage = dockerfileContent.split('AS production')[1];
    expect(productionStage).not.toMatch(/npm ci --only=production/);
  });

  it('should install serve for static file serving', () => {
    const productionStage = dockerfileContent.split('AS production')[1];
    expect(productionStage).toMatch(/npm install -g serve/);
  });
});
