/**
 * Template Validator - Placeholder Handling Tests
 *
 * Tests for regression issue where TEMPLATE_VAR placeholders
 * from template variable replacement were treated as invalid
 * Docker instructions.
 *
 * This resolves the error in release 3.0.3:
 * "Line X: Invalid instruction 'TEMPLATE_VAR'"
 */

import { describe, it, expect } from '@jest/globals';
import { TemplateValidator } from '../../src/lib/template-validator.js';

describe('TemplateValidator - Placeholder Handling', () => {
  let validator;

  beforeEach(() => {
    validator = new TemplateValidator();
  });

  describe('TEMPLATE_VAR Placeholder Skipping', () => {
    it('should skip lines with TEMPLATE_VAR after replacement', () => {
      const dockerfile = `
FROM node:20-alpine
WORKDIR {{APP_DIR}}
COPY package*.json ./
RUN npm ci
EXPOSE {{PORT}}
CMD ["npm", "start"]
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // Should not have errors about TEMPLATE_VAR being invalid instruction
      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
      expect(result.errors.length).toBe(0);
    });

    it('should handle multiple template variables on same line', () => {
      const dockerfile = `
FROM node:{{NODE_VERSION}}-alpine
WORKDIR {{WORKDIR}}
ENV NODE_ENV={{NODE_ENV}} PORT={{PORT}}
EXPOSE {{PORT}}
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
    });

    it('should handle template variables in complex expressions', () => {
      const dockerfile = `
FROM node:20-alpine
WORKDIR /app
RUN npm install {{PACKAGE_NAME}}@{{VERSION}}
ENV API_URL={{API_PROTOCOL}}://{{API_HOST}}:{{API_PORT}}
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      expect(result.errors.length).toBe(0);
    });
  });

  describe('Boolean and Numeric Value Skipping', () => {
    it('should skip boolean value "true" as instruction', () => {
      const dockerfile = `
FROM node:20-alpine
WORKDIR /app
{{#if ENABLE_CACHE}}
RUN npm ci --cache /tmp/npm-cache
{{else}}
RUN npm ci
{{/if}}
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // Should not error on 'true' or 'false' being invalid instructions
      expect(result.errors).not.toContain(expect.stringContaining("'true'"));
      expect(result.errors).not.toContain(expect.stringContaining("'false'"));
    });

    it('should skip numeric values as instructions', () => {
      const dockerfile = `
FROM node:20-alpine
EXPOSE {{PORT}}
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // If PORT is "3000", it shouldn't error on '3000' being invalid
      expect(result.errors).not.toContain(expect.stringContaining("Invalid instruction '3"));
    });
  });

  describe('Mixed Template and Valid Instructions', () => {
    it('should validate actual Docker instructions while skipping placeholders', () => {
      const dockerfile = `
FROM node:{{NODE_VERSION}}-alpine
INVALID_INSTRUCTION should fail
WORKDIR {{APP_DIR}}
COPY package*.json ./
RUN npm ci
EXPOSE {{PORT}}
CMD ["npm", "start"]
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // Should catch the invalid instruction
      expect(result.errors.some(err => err.includes('INVALID_INSTRUCTION'))).toBe(true);

      // But not report TEMPLATE_VAR as invalid
      expect(result.errors.some(err => err.includes('TEMPLATE_VAR'))).toBe(false);
    });
  });

  describe('Real-world Figma Make Template', () => {
    it('should validate typical Figma Make multi-stage Dockerfile with variables', () => {
      const dockerfile = `
# Build stage
FROM node:{{NODE_VERSION}}-alpine AS builder
WORKDIR {{WORKDIR}}
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder {{WORKDIR}}/dist /usr/share/nginx/html
EXPOSE {{PORT}}
CMD ["nginx", "-g", "daemon off;"]
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      expect(result.errors.length).toBe(0);
      expect(result.valid).toBe(true);
    });

    it('should validate Lovable template with conditional variables', () => {
      const dockerfile = `
FROM node:{{NODE_VERSION}}-alpine
WORKDIR {{WORKDIR}}

{{#if INSTALL_POSTGRES}}
RUN apk add --no-cache postgresql-client
{{/if}}

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE {{BACKEND_PORT}} {{FRONTEND_PORT}}
CMD ["npm", "run", "dev"]
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // Should not error on template syntax
      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty template variable replacements', () => {
      const dockerfile = `
FROM node:20-alpine
WORKDIR /app
ENV {{EMPTY_VAR}}
COPY . .
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      // Should skip TEMPLATE_VAR, won't error on missing args for ENV
      // (ENV with TEMPLATE_VAR becomes just "ENV" which is caught separately)
      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
    });

    it('should handle template variables at start of file', () => {
      const dockerfile = `
{{HEADER_COMMENT}}
FROM node:20-alpine
WORKDIR /app
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
    });

    it('should handle template variables at end of file', () => {
      const dockerfile = `
FROM node:20-alpine
WORKDIR /app
CMD ["npm", "start"]
{{FOOTER_COMMENT}}
      `.trim();

      const result = validator.validateDockerfileContent(dockerfile);

      expect(result.errors).not.toContain(expect.stringContaining('TEMPLATE_VAR'));
    });
  });

  describe('Regression Test for 3.0.3 Release Issue', () => {
    it('should NOT error with "Invalid instruction TEMPLATE_VAR" like in 3.0.3', () => {
      // This is the exact scenario that failed in production
      const dockerfileWithVariables = `
FROM node:{{NODE_VERSION}}-alpine
WORKDIR {{WORKDIR}}
COPY package*.json ./
RUN npm ci
{{ADDITIONAL_RUN_COMMANDS}}
COPY . .
EXPOSE {{PORT}}
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
      `.trim();

      const result = validator.validateDockerfileContent(dockerfileWithVariables);

      // The error in 3.0.3 was:
      // "Line 5: Invalid instruction 'TEMPLATE_VAR'"
      // "Line 11: Invalid instruction 'TEMPLATE_VAR'"
      // "Line 12: Invalid instruction 'false'"

      expect(result.errors).not.toContain(expect.stringContaining("Invalid instruction 'TEMPLATE_VAR'"));
      expect(result.errors).not.toContain(expect.stringContaining("Invalid instruction 'false'"));
      expect(result.errors).not.toContain(expect.stringContaining("Invalid instruction 'true'"));

      // Should pass validation
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
