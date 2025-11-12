/**

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 * V0 Template Test Suite
 * Tests for V0 (Next.js 14+ with App Router) Docker template
 * Target: >15 tests
 */

import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll } from '@jest/globals';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, '../../src/templates/tools/v0');

describe('V0 Template Files', () => {
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

describe('V0 Dockerfile Structure', () => {
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

  it('should install libc6-compat', () => {
    expect(dockerfileContent).toMatch(/libc6-compat/);
  });

  it('should expose port placeholder', () => {
    expect(dockerfileContent).toMatch(/EXPOSE {{PORT}}/);
  });

  it('should include health check', () => {
    expect(dockerfileContent).toMatch(/HEALTHCHECK/);
  });

  it('should create non-root user', () => {
    expect(dockerfileContent).toMatch(/adduser.*nextjs/);
    expect(dockerfileContent).toMatch(/USER nextjs/);
  });

  it('should disable Next.js telemetry', () => {
    expect(dockerfileContent).toMatch(/NEXT_TELEMETRY_DISABLED=1/);
  });

  it('should use npm ci for dependencies', () => {
    expect(dockerfileContent).toMatch(/npm ci/);
  });

  it('should build the Next.js application', () => {
    expect(dockerfileContent).toMatch(/npm run build/);
  });

  it('should copy .next folder', () => {
    expect(dockerfileContent).toMatch(/COPY --from=builder \/app\/\.next/);
  });

  it('should start with npm run start', () => {
    expect(dockerfileContent).toMatch(/CMD.*npm.*run.*start/);
  });

  it('should set HOSTNAME environment variable', () => {
    expect(dockerfileContent).toMatch(/HOSTNAME="0\.0\.0\.0"/);
  });
});

describe('V0 Environment Variables', () => {
  let envContent;

  beforeAll(() => {
    const envPath = path.join(TEMPLATE_DIR, '.env.example');
    envContent = fs.readFileSync(envPath, 'utf8');
  });

  it('should include PORT variable with default 3000', () => {
    expect(envContent).toMatch(/PORT=3000/);
  });

  it('should include NODE_ENV variable', () => {
    expect(envContent).toMatch(/NODE_ENV/);
  });

  it('should include NEXT_TELEMETRY_DISABLED', () => {
    expect(envContent).toMatch(/NEXT_TELEMETRY_DISABLED/);
  });

  it('should include OPENAI_API_KEY option', () => {
    expect(envContent).toMatch(/OPENAI_API_KEY/);
  });

  it('should include ANTHROPIC_API_KEY option', () => {
    expect(envContent).toMatch(/ANTHROPIC_API_KEY/);
  });

  it('should include NEXT_PUBLIC_APP_URL', () => {
    expect(envContent).toMatch(/NEXT_PUBLIC_APP_URL/);
  });

  it('should include PROJECT_NAME variable', () => {
    expect(envContent).toMatch(/PROJECT_NAME/);
  });
});

describe('V0 Docker Compose', () => {
  let composeContent;

  beforeAll(() => {
    const composePath = path.join(TEMPLATE_DIR, 'docker-compose.yml');
    composeContent = fs.readFileSync(composePath, 'utf8');
  });

  it('should define v0-app service', () => {
    expect(composeContent).toMatch(/v0-app:/);
  });

  it('should map port placeholder', () => {
    expect(composeContent).toMatch(/{{PORT}}:{{PORT}}/);
  });

  it('should include HOSTNAME environment variable', () => {
    expect(composeContent).toMatch(/HOSTNAME=0\.0\.0\.0/);
  });

  it('should include health check', () => {
    expect(composeContent).toMatch(/healthcheck:/);
  });

  it('should check /api/health endpoint', () => {
    expect(composeContent).toMatch(/\/api\/health/);
  });

  it('should use restart policy', () => {
    expect(composeContent).toMatch(/restart:.*unless-stopped/);
  });

  it('should define network', () => {
    expect(composeContent).toMatch(/networks:/);
    expect(composeContent).toMatch(/v0-network:/);
  });
});

describe('V0 .dockerignore', () => {
  let dockerignoreContent;

  beforeAll(() => {
    const dockerignorePath = path.join(TEMPLATE_DIR, '.dockerignore');
    dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
  });

  it('should ignore node_modules', () => {
    expect(dockerignoreContent).toMatch(/node_modules/);
  });

  it('should ignore .next folder', () => {
    expect(dockerignoreContent).toMatch(/\.next/);
  });

  it('should ignore out folder', () => {
    expect(dockerignoreContent).toMatch(/out/);
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

  it('should ignore .vercel folder', () => {
    expect(dockerignoreContent).toMatch(/\.vercel/);
  });

  it('should ignore test files', () => {
    expect(dockerignoreContent).toMatch(/\.test\./);
  });
});

describe('V0 README Documentation', () => {
  let readmeContent;

  beforeAll(() => {
    const readmePath = path.join(TEMPLATE_DIR, 'README.md');
    readmeContent = fs.readFileSync(readmePath, 'utf8');
  });

  it('should include title', () => {
    expect(readmeContent).toMatch(/# V0.*Docker Template/);
  });

  it('should include features section', () => {
    expect(readmeContent).toMatch(/## Features/);
  });

  it('should mention Next.js 14+', () => {
    expect(readmeContent).toMatch(/Next\.js 14/);
  });

  it('should mention App Router', () => {
    expect(readmeContent).toMatch(/App Router/);
  });

  it('should mention Vercel AI SDK', () => {
    expect(readmeContent).toMatch(/Vercel AI SDK/);
  });

  it('should mention shadcn/ui', () => {
    expect(readmeContent).toMatch(/shadcn\/ui/);
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

  it('should mention port 3000', () => {
    expect(readmeContent).toMatch(/3000/);
  });

  it('should include AI SDK integration examples', () => {
    expect(readmeContent).toMatch(/OpenAI|Anthropic/);
  });
});
