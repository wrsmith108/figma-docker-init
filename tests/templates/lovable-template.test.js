/**

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 * Lovable Template Test Suite
 * Tests for Lovable (React + Vite + TypeScript + Supabase) Docker template
 * Target: >15 tests
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../../src/templates/tools/lovable');

describe('Lovable Template Files', () => {
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

describe('Lovable Dockerfile Structure', () => {
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
    expect(dockerfileContent).toMatch(/adduser.*lovable/);
    expect(dockerfileContent).toMatch(/USER lovable/);
  });

  it('should use npm ci for dependencies', () => {
    expect(dockerfileContent).toMatch(/npm ci/);
  });

  it('should build the application', () => {
    expect(dockerfileContent).toMatch(/npm run build/);
  });

  it('should serve static files', () => {
    // Check in production stage only
    const productionStage = dockerfileContent.split('AS production')[1];
    expect(productionStage).toMatch(/serve/);
  });

  it('should copy dist folder', () => {
    expect(dockerfileContent).toMatch(/COPY --from=builder \/app\/dist/);
  });
});

describe('Lovable Environment Variables', () => {
  let envContent;

  beforeAll(() => {
    const envPath = path.join(TEMPLATE_DIR, '.env.example');
    envContent = fs.readFileSync(envPath, 'utf8');
  });

  it('should include Supabase URL variable', () => {
    expect(envContent).toMatch(/VITE_SUPABASE_URL/);
  });

  it('should include Supabase anon key variable', () => {
    expect(envContent).toMatch(/VITE_SUPABASE_ANON_KEY/);
  });

  it('should include PORT variable', () => {
    expect(envContent).toMatch(/PORT=8080/);
  });

  it('should include NODE_ENV variable', () => {
    expect(envContent).toMatch(/NODE_ENV/);
  });

  it('should include PROJECT_NAME variable', () => {
    expect(envContent).toMatch(/PROJECT_NAME/);
  });
});

describe('Lovable Docker Compose', () => {
  let composeContent;

  beforeAll(() => {
    const composePath = path.join(TEMPLATE_DIR, 'docker-compose.yml');
    composeContent = fs.readFileSync(composePath, 'utf8');
  });

  it('should define lovable-app service', () => {
    expect(composeContent).toMatch(/lovable-app:/);
  });

  it('should map port placeholder', () => {
    expect(composeContent).toMatch(/{{PORT}}:{{PORT}}/);
  });

  it('should include Supabase environment variables', () => {
    expect(composeContent).toMatch(/VITE_SUPABASE_URL/);
    expect(composeContent).toMatch(/VITE_SUPABASE_ANON_KEY/);
  });

  it('should include health check', () => {
    expect(composeContent).toMatch(/healthcheck:/);
  });

  it('should use restart policy', () => {
    expect(composeContent).toMatch(/restart:.*unless-stopped/);
  });

  it('should define network', () => {
    expect(composeContent).toMatch(/networks:/);
    expect(composeContent).toMatch(/lovable-network:/);
  });
});

describe('Lovable .dockerignore', () => {
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

  it('should ignore .env files', () => {
    expect(dockerignoreContent).toMatch(/\.env/);
  });

  it('should ignore git directory', () => {
    expect(dockerignoreContent).toMatch(/\.git/);
  });

  it('should document env file handling', () => {
    // .env.example is not ignored by default, so no need for explicit whitelist
    expect(dockerignoreContent).toMatch(/# Environment files/);
  });
});

describe('Lovable README Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(TEMPLATE_DIR, 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  it('should include title', () => {
    expect(readmeContent).toMatch(/# Lovable Docker Template/);
  });

  it('should include features section', () => {
    expect(readmeContent).toMatch(/## Features/);
  });

  it('should mention Supabase integration', () => {
    expect(readmeContent).toMatch(/Supabase/);
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

  it('should mention port 8080', () => {
    expect(readmeContent).toMatch(/8080/);
  });
});
