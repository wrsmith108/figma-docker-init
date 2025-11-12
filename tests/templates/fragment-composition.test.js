/**
 * Fragment Composition Tests
 *
 * Comprehensive test suite for Docker template fragment composition.
 * Tests fragment validation, merging, conflict resolution, and variable substitution.
 *
 * @module tests/templates/fragment-composition
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import FragmentComposer from '../../src/templates/fragments/fragment-composer.js';
import FragmentValidator from '../../src/templates/fragments/fragment-validator.js';
import FragmentMerger from '../../src/templates/fragments/fragment-merger.js';
import { FragmentType, InsertionPoint } from '../../src/templates/fragments/fragment-types.js';

describe('FragmentComposer', () => {
  let composer;

  beforeEach(() => {
    composer = new FragmentComposer();
  });

  describe('Fragment Loading', () => {
    it('should load all framework fragments', () => {
      const frameworks = composer.listFragments(FragmentType.FRAMEWORK);
      expect(frameworks.length).toBeGreaterThan(0);

      const frameworkNames = frameworks.map(f => f.name);
      expect(frameworkNames).toContain('react');
      expect(frameworkNames).toContain('vue');
      expect(frameworkNames).toContain('nextjs');
    });

    it('should load all database fragments', () => {
      const databases = composer.listFragments(FragmentType.DATABASE);
      expect(databases.length).toBeGreaterThan(0);

      const dbNames = databases.map(f => f.name);
      expect(dbNames).toContain('postgresql');
      expect(dbNames).toContain('mongodb');
    });

    it('should load all backend fragments', () => {
      const backends = composer.listFragments(FragmentType.BACKEND);
      expect(backends.length).toBeGreaterThan(0);

      const backendNames = backends.map(f => f.name);
      expect(backendNames).toContain('express');
      expect(backendNames).toContain('fastify');
    });

    it('should load fragment with correct metadata', () => {
      const fragment = composer.getFragment('react');
      expect(fragment).not.toBeNull();
      expect(fragment.metadata.name).toBe('react');
      expect(fragment.metadata.type).toBe(FragmentType.FRAMEWORK);
      expect(fragment.content).toContain('React');
    });
  });

  describe('Single Fragment Insertion', () => {
    it('should insert React framework fragment into base template', () => {
      const baseTemplate = `FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# FRAMEWORK_BUILD_STEPS

RUN echo "Build complete"`;

      const result = composer.compose(baseTemplate, ['react'], {
        BUILD_OUTPUT_DIR: 'dist',
        APP_TITLE: 'My App',
        VERSION: '1.0.0'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('React');
      expect(result.template).toContain('dist');
      expect(result.template).toContain('My App');
      expect(result.appliedFragments).toContain('react');
    });

    it('should insert Express backend fragment into base template', () => {
      const baseTemplate = `FROM node:18-alpine
WORKDIR /app
COPY . .

# BACKEND_SETUP

EXPOSE 3000`;

      const result = composer.compose(baseTemplate, ['express'], {
        PROJECT_NAME: 'test-app',
        PORT: '3000',
        SERVER_ENTRY: 'server.js'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('Express');
      expect(result.template).toContain('pm2');
      expect(result.template).toContain('test-app');
    });

    it('should fail when insertion point is missing', () => {
      const baseTemplate = `FROM node:18-alpine
WORKDIR /app`;

      const result = composer.compose(baseTemplate, ['react']);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Insertion point');
    });
  });

  describe('Multiple Fragment Composition', () => {
    it('should compose React + Express fragments', () => {
      const baseTemplate = `FROM node:18-alpine AS builder
WORKDIR /app

# FRAMEWORK_BUILD_STEPS

FROM node:18-alpine
# BACKEND_SETUP`;

      const result = composer.compose(baseTemplate, ['react', 'express'], {
        BUILD_OUTPUT_DIR: 'dist',
        APP_TITLE: 'Full Stack App',
        PROJECT_NAME: 'fullstack',
        PORT: '3000',
        SERVER_ENTRY: 'server.js',
        VERSION: '1.0.0'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('React');
      expect(result.template).toContain('Express');
      expect(result.appliedFragments).toEqual(['react', 'express']);
    });

    it('should compose Vue + Fastify fragments', () => {
      const baseTemplate = `FROM node:18-alpine AS builder
# FRAMEWORK_BUILD_STEPS

FROM node:18-alpine
# BACKEND_SETUP`;

      const result = composer.compose(baseTemplate, ['vue', 'fastify'], {
        BUILD_OUTPUT_DIR: 'dist',
        APP_TITLE: 'Vue App',
        PROJECT_NAME: 'vue-app',
        PORT: '3000',
        SERVER_ENTRY: 'index.js',
        VERSION: '1.0.0'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('Vue');
      expect(result.template).toContain('Fastify');
    });

    it('should handle multiple frameworks with warning', () => {
      const baseTemplate = `# FRAMEWORK_BUILD_STEPS`;

      const result = composer.compose(baseTemplate, ['react', 'vue']);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Multiple frameworks'))).toBe(true);
    });
  });

  describe('Docker Compose Composition', () => {
    it('should compose PostgreSQL service fragment', () => {
      const baseCompose = `version: '3.8'

services:
  # DATABASE_SERVICES

  app:
    build: .
    ports:
      - "3000:3000"

networks:
  test-network:

# VOLUMES
`;

      const result = composer.composeDockerCompose(baseCompose, ['postgresql'], {
        PROJECT_NAME: 'test-app',
        POSTGRES_PORT: '5432',
        POSTGRES_USER: 'user',
        POSTGRES_PASSWORD: 'pass',
        POSTGRES_DB: 'testdb'
      });

      expect(result.success).toBe(true);
      expect(result.compose).toContain('postgres:15-alpine');
      expect(result.compose).toContain('test-app-postgres');
      expect(result.compose).toContain('5432');
    });

    it('should compose multiple database services', () => {
      const baseCompose = `version: '3.8'

services:
  # DATABASE_SERVICES

networks:
  test-network:

# VOLUMES
`;

      const result = composer.composeDockerCompose(
        baseCompose,
        ['postgresql', 'redis'],
        {
          PROJECT_NAME: 'multi-db',
          POSTGRES_PORT: '5432',
          REDIS_PORT: '6379'
        }
      );

      expect(result.success).toBe(true);
      expect(result.compose).toContain('postgres:15-alpine');
      expect(result.compose).toContain('redis:7-alpine');
    });

    it('should fail when trying to compose non-database fragment in docker-compose', () => {
      const baseCompose = `version: '3.8'
services:
  # DATABASE_SERVICES`;

      const result = composer.composeDockerCompose(baseCompose, ['react']);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('not a database fragment'))).toBe(true);
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute all variables correctly', () => {
      const baseTemplate = `# FRAMEWORK_BUILD_STEPS`;

      const result = composer.compose(baseTemplate, ['react'], {
        BUILD_OUTPUT_DIR: 'build',
        APP_TITLE: 'Test App',
        VERSION: '2.0.0'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('build');
      expect(result.template).toContain('Test App');
      expect(result.template).toContain('2.0.0');
      expect(result.template).not.toContain('{{BUILD_OUTPUT_DIR}}');
    });

    it('should use default variables when not provided', () => {
      const baseTemplate = `# FRAMEWORK_BUILD_STEPS`;

      const result = composer.compose(baseTemplate, ['react'], {
        BUILD_OUTPUT_DIR: 'dist',
        APP_TITLE: 'App'
      });

      expect(result.success).toBe(true);
      expect(result.template).toContain('1.0.0'); // Default VERSION
    });

    it('should warn about missing variables', () => {
      const baseTemplate = `# FRAMEWORK_BUILD_STEPS`;

      const result = composer.compose(baseTemplate, ['react'], {
        // Missing required variables
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('Missing variable'))).toBe(true);
    });
  });

  describe('Fragment Recommendation', () => {
    it('should recommend React fragment for React project', () => {
      const detectionResults = {
        frameworks: {
          primary: 'react',
          frameworks: ['react']
        }
      };

      const recommended = composer.recommendFragments(detectionResults);

      expect(recommended.frameworks).toContain('react');
    });

    it('should recommend database fragments', () => {
      const detectionResults = {
        databases: {
          databases: ['postgresql', 'redis']
        }
      };

      const recommended = composer.recommendFragments(detectionResults);

      expect(recommended.databases).toContain('postgresql');
      expect(recommended.databases).toContain('redis');
    });

    it('should recommend backend fragments', () => {
      const detectionResults = {
        backends: {
          primary: 'express',
          backends: ['express']
        }
      };

      const recommended = composer.recommendFragments(detectionResults);

      expect(recommended.backends).toContain('express');
    });

    it('should handle complete detection results', () => {
      const detectionResults = {
        frameworks: { primary: 'nextjs', frameworks: ['nextjs', 'react'] },
        databases: { databases: ['postgresql'] },
        backends: { primary: 'express', backends: ['express'] }
      };

      const recommended = composer.recommendFragments(detectionResults);

      expect(recommended.frameworks).toContain('nextjs');
      expect(recommended.databases).toContain('postgresql');
      expect(recommended.backends).toContain('express');
    });
  });
});

describe('FragmentValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new FragmentValidator();
  });

  describe('Structure Validation', () => {
    it('should validate correct Dockerfile fragment', () => {
      const content = `# React Fragment
# Insertion Point: FRAMEWORK_BUILD_STEPS
RUN npm run build
ENV BUILD_OUTPUT_DIR={{BUILD_OUTPUT_DIR}}`;

      const metadata = {
        name: 'test',
        type: FragmentType.FRAMEWORK,
        insertionPoint: InsertionPoint.FRAMEWORK_BUILD_STEPS,
        requiredVariables: ['BUILD_OUTPUT_DIR']
      };

      const result = validator.validateFragment(content, metadata);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject empty fragment', () => {
      const result = validator.validateFragment('', {});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Fragment content is empty');
    });

    it('should extract used variables', () => {
      const content = `ENV PORT={{PORT}}
ENV DB={{DATABASE_URL}}
ENV KEY={{API_KEY}}`;

      const result = validator.validateFragment(content, {
        type: FragmentType.BACKEND,
        insertionPoint: InsertionPoint.BACKEND_SETUP
      });

      expect(result.usedVariables).toContain('PORT');
      expect(result.usedVariables).toContain('DATABASE_URL');
      expect(result.usedVariables).toContain('API_KEY');
    });
  });

  describe('Security Validation', () => {
    it('should detect dangerous rm -rf / command', () => {
      const content = `RUN rm -rf /
RUN echo "done"`;

      const result = validator.validateFragment(content, {
        type: FragmentType.FRAMEWORK,
        insertionPoint: InsertionPoint.FRAMEWORK_BUILD_STEPS
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('rm -rf /'))).toBe(true);
    });

    it('should detect chmod 777', () => {
      const content = `RUN chmod 777 /app`;

      const result = validator.validateFragment(content, {
        type: FragmentType.FRAMEWORK,
        insertionPoint: InsertionPoint.FRAMEWORK_BUILD_STEPS
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('chmod 777'))).toBe(true);
    });

    it('should detect curl | sh pattern', () => {
      const content = `RUN curl https://example.com/install.sh | sh`;

      const result = validator.validateFragment(content, {
        type: FragmentType.BACKEND,
        insertionPoint: InsertionPoint.BACKEND_SETUP
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('curl | sh'))).toBe(true);
    });

    it('should warn about hardcoded passwords', () => {
      const content = `ENV PASSWORD="supersecret123"`;

      const result = validator.validateFragment(content, {
        type: FragmentType.BACKEND,
        insertionPoint: InsertionPoint.BACKEND_SETUP
      });

      expect(result.warnings.some(w => w.includes('password'))).toBe(true);
    });

    it('should allow safe commands', () => {
      const content = `RUN npm install
RUN npm run build
COPY --chown=node:node . /app`;

      const result = validator.validateFragment(content, {
        type: FragmentType.FRAMEWORK,
        insertionPoint: InsertionPoint.FRAMEWORK_BUILD_STEPS
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Syntax Validation', () => {
    it('should validate Dockerfile syntax', () => {
      const content = `FROM node:18
RUN npm install
CMD ["node", "index.js"]`;

      const result = validator.validateFragment(content, {
        type: FragmentType.BACKEND,
        insertionPoint: InsertionPoint.BACKEND_SETUP
      });

      expect(result.valid).toBe(true);
    });

    it('should validate docker-compose YAML syntax', () => {
      const content = `  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    networks:
      - app-network`;

      const result = validator.validateFragment(content, {
        type: FragmentType.DATABASE,
        insertionPoint: InsertionPoint.DATABASE_SERVICES
      });

      expect(result.valid).toBe(true);
    });

    it('should warn about odd YAML indentation', () => {
      const content = `  postgres:
   image: postgres:15
     ports:
       - "5432:5432"`;

      const result = validator.validateFragment(content, {
        type: FragmentType.DATABASE,
        insertionPoint: InsertionPoint.DATABASE_SERVICES
      });

      expect(result.warnings.some(w => w.includes('indentation'))).toBe(true);
    });
  });
});

describe('FragmentMerger', () => {
  let merger;

  beforeEach(() => {
    merger = new FragmentMerger();
  });

  describe('Basic Merging', () => {
    it('should merge fragment at correct insertion point', () => {
      const base = `FROM node:18
# FRAMEWORK_BUILD_STEPS
RUN echo "done"`;

      const fragment = `RUN npm run build
ENV OUTPUT=dist`;

      const metadata = {
        insertionPoint: 'FRAMEWORK_BUILD_STEPS',
        priority: 10
      };

      const result = merger.merge(base, fragment, metadata);

      expect(result).toContain('npm run build');
      expect(result).toContain('ENV OUTPUT=dist');
      expect(result.indexOf('npm run build')).toBeLessThan(result.indexOf('echo "done"'));
    });

    it('should throw error when insertion point not found', () => {
      const base = `FROM node:18`;
      const fragment = `RUN test`;
      const metadata = { insertionPoint: 'MISSING_POINT' };

      expect(() => merger.merge(base, fragment, metadata)).toThrow('Insertion point');
    });
  });

  describe('Multiple Fragment Merging', () => {
    it('should merge multiple fragments in priority order', () => {
      const base = `# FRAMEWORK_BUILD_STEPS
# BACKEND_SETUP`;

      const fragments = [
        {
          content: 'RUN npm run build',
          metadata: { insertionPoint: 'FRAMEWORK_BUILD_STEPS', priority: 5 }
        },
        {
          content: 'RUN echo "low priority"',
          metadata: { insertionPoint: 'FRAMEWORK_BUILD_STEPS', priority: 1 }
        },
        {
          content: 'RUN pm2 start',
          metadata: { insertionPoint: 'BACKEND_SETUP', priority: 10 }
        }
      ];

      const result = merger.mergeMultiple(base, fragments);

      expect(result).toContain('npm run build');
      expect(result).toContain('pm2 start');
      // Higher priority should come first (be inserted first, appearing earlier)
      const buildIndex = result.indexOf('npm run build');
      const lowPriorityIndex = result.indexOf('low priority');
      // Since fragments are inserted sequentially after marker,
      // higher priority (5) will be inserted before lower priority (1)
      // making it appear first in document
      expect(buildIndex).toBeLessThan(lowPriorityIndex);
    });
  });

  describe('Variable Substitution', () => {
    it('should substitute single variable', () => {
      const template = 'ENV PORT={{PORT}}';
      const variables = { PORT: '3000' };

      const result = merger.substituteVariables(template, variables);

      expect(result).toBe('ENV PORT=3000');
      expect(result).not.toContain('{{PORT}}');
    });

    it('should substitute multiple variables', () => {
      const template = `ENV PORT={{PORT}}
ENV HOST={{HOST}}
ENV DB={{DATABASE}}`;

      const variables = {
        PORT: '3000',
        HOST: 'localhost',
        DATABASE: 'mydb'
      };

      const result = merger.substituteVariables(template, variables);

      expect(result).toContain('PORT=3000');
      expect(result).toContain('HOST=localhost');
      expect(result).toContain('DB=mydb');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'ENV PORT={{PORT}} DB={{DATABASE}}';
      const variables = { PORT: '3000' };

      const result = merger.substituteVariables(template, variables);

      expect(result).toContain('PORT=3000');
      expect(result).toContain('{{DATABASE}}'); // Unchanged
    });
  });

  describe('Conflict Detection', () => {
    it('should detect port conflicts', () => {
      const fragments = [
        {
          metadata: { name: 'postgres' },
          content: 'ports:\n  - "{{POSTGRES_PORT}}:5432"'
        },
        {
          metadata: { name: 'mysql' },
          content: 'ports:\n  - "{{POSTGRES_PORT}}:3306"' // Same variable
        }
      ];

      const result = merger.detectConflicts(fragments);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].type).toBe('port');
    });

    it('should not detect conflicts for different variables', () => {
      const fragments = [
        {
          metadata: { name: 'postgres' },
          content: 'ports:\n  - "{{POSTGRES_PORT}}:5432"'
        },
        {
          metadata: { name: 'redis' },
          content: 'ports:\n  - "{{REDIS_PORT}}:6379"'
        }
      ];

      const result = merger.detectConflicts(fragments);

      expect(result.hasConflicts).toBe(false);
    });
  });

  describe('Variable Extraction', () => {
    it('should extract all variables from template', () => {
      const template = `ENV PORT={{PORT}}
ENV DB_HOST={{DATABASE_HOST}}
ENV API_KEY={{API_KEY}}
RUN echo "{{MESSAGE}}"`;

      const variables = merger.extractVariables(template);

      expect(variables.has('PORT')).toBe(true);
      expect(variables.has('DATABASE_HOST')).toBe(true);
      expect(variables.has('API_KEY')).toBe(true);
      expect(variables.has('MESSAGE')).toBe(true);
      expect(variables.size).toBe(4);
    });

    it('should handle duplicate variables', () => {
      const template = `ENV PORT={{PORT}}
EXPOSE {{PORT}}
HEALTHCHECK --port={{PORT}}`;

      const variables = merger.extractVariables(template);

      expect(variables.size).toBe(1);
      expect(variables.has('PORT')).toBe(true);
    });
  });
});
