/**

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 * Bolt Template Test Suite
 * Tests for Bolt (Remix + Vite + TypeScript) Docker template
 * Target: >15 tests
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../../src/templates/tools/bolt');

describe('Bolt Template Files', () => {
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

describe('Bolt Dockerfile Structure', () => {
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
    expect(dockerfileContent).toMatch(/adduser.*bolt/);
    expect(dockerfileContent).toMatch(/USER bolt/);
  });

  it('should use npm ci for dependencies', () => {
    expect(dockerfileContent).toMatch(/npm ci/);
  });

  it('should build the Remix application', () => {
    expect(dockerfileContent).toMatch(/npm run build/);
  });

  it('should copy build folder', () => {
    expect(dockerfileContent).toMatch(/COPY --from=builder \/app\/build/);
  });

  it('should copy public folder', () => {
    expect(dockerfileContent).toMatch(/COPY --from=builder \/app\/public/);
  });

  it('should start with npm run start', () => {
    expect(dockerfileContent).toMatch(/CMD.*npm.*run.*start/);
  });
});

describe('Bolt Environment Variables', () => {
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

  it('should include HOST variable', () => {
    expect(envContent).toMatch(/HOST/);
  });

  it('should include PROJECT_NAME variable', () => {
    expect(envContent).toMatch(/PROJECT_NAME/);
  });
});

describe('Bolt Docker Compose', () => {
  let composeContent;

  beforeAll(() => {
    const composePath = path.join(TEMPLATE_DIR, 'docker-compose.yml');
    composeContent = fs.readFileSync(composePath, 'utf8');
  });

  it('should define bolt-app service', () => {
    expect(composeContent).toMatch(/bolt-app:/);
  });

  it('should map port placeholder', () => {
    expect(composeContent).toMatch(/{{PORT}}:{{PORT}}/);
  });

  it('should include HOST environment variable', () => {
    expect(composeContent).toMatch(/HOST=0\.0\.0\.0/);
  });

  it('should include health check', () => {
    expect(composeContent).toMatch(/healthcheck:/);
  });

  it('should use restart policy', () => {
    expect(composeContent).toMatch(/restart:.*unless-stopped/);
  });

  it('should define network', () => {
    expect(composeContent).toMatch(/networks:/);
    expect(composeContent).toMatch(/bolt-network:/);
  });
});

describe('Bolt .dockerignore', () => {
  let dockerignoreContent;

  beforeAll(() => {
    const dockerignorePath = path.join(TEMPLATE_DIR, '.dockerignore');
    dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
  });

  it('should ignore node_modules', () => {
    expect(dockerignoreContent).toMatch(/node_modules/);
  });

  it('should ignore build folder', () => {
    expect(dockerignoreContent).toMatch(/build/);
  });

  it('should ignore .remix folder', () => {
    expect(dockerignoreContent).toMatch(/\.remix/);
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

  it('should ignore StackBlitz files', () => {
    expect(dockerignoreContent).toMatch(/\.stackblitz/);
  });
});

describe('Bolt README Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(TEMPLATE_DIR, 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  it('should include title', () => {
    expect(readmeContent).toMatch(/# Bolt Docker Template/);
  });

  it('should include features section', () => {
    expect(readmeContent).toMatch(/## Features/);
  });

  it('should mention Remix framework', () => {
    expect(readmeContent).toMatch(/Remix/);
  });

  it('should mention StackBlitz WebContainer', () => {
    expect(readmeContent).toMatch(/WebContainer/);
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

  it('should document Remix configuration', () => {
    expect(readmeContent).toMatch(/Remix Configuration/);
  });
});
