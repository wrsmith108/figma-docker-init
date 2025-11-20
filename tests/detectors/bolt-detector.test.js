/**
 * BoltDetector Test Suite
 * Tests for Bolt.new project detection including Angular, Remix, and other frameworks
 */

import fs from 'fs/promises';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import BoltDetector from '../../src/detectors/bolt-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FIXTURES_DIR = path.join(__dirname, '../fixtures/bolt');

describe('BoltDetector - Angular Projects', () => {
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(TEST_FIXTURES_DIR, `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect Angular project with angular.json', async () => {
    // Create Angular project structure
    const packageJson = {
      name: 'test-angular-project',
      version: '1.0.0',
      scripts: {
        start: 'ng serve',
        build: 'ng build'
      },
      dependencies: {
        '@angular/core': '^17.3.12',
        '@angular/common': '^17.3.12'
      },
      devDependencies: {
        '@angular/cli': '^17.3.12',
        typescript: '^5.2.2'
      }
    };

    const angularJson = {
      version: 1,
      projects: {
        'test-app': {
          projectType: 'application'
        }
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    await fs.writeFile(
      path.join(testDir, 'angular.json'),
      JSON.stringify(angularJson, null, 2)
    );
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    expect(result.metadata.framework).toBe('angular');
    expect(result.metadata.buildTool).toBe('angular-cli');

    // Check that correct commands are suggested
    expect(result.metadata.startCommand).toBe('ng serve');
    expect(result.metadata.buildCommand).toBe('ng build');
  });

  it('should detect Angular project via @angular/core dependency', async () => {
    const packageJson = {
      name: 'test-angular-project',
      version: '1.0.0',
      dependencies: {
        '@angular/core': '^17.3.0'
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.metadata.framework).toBe('angular');
  });

  it('should detect StackBlitz Angular starter', async () => {
    // Simulate a StackBlitz Angular project
    const packageJson = {
      name: 'stackblitz-starters-angular',
      version: '0.0.0',
      scripts: {
        start: 'ng serve'
      },
      dependencies: {
        '@angular/animations': '^17.3.12',
        '@angular/common': '^17.3.12',
        '@angular/compiler': '^17.3.12',
        '@angular/core': '^17.3.12',
        '@angular/forms': '^17.3.12',
        '@angular/platform-browser': '^17.3.12',
        '@angular/platform-browser-dynamic': '^17.3.12',
        '@angular/router': '^17.3.12',
        'rxjs': '~7.8.0',
        'tslib': '^2.3.0',
        'zone.js': '~0.14.3'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '^17.3.12',
        '@angular/cli': '^17.3.12',
        '@angular/compiler-cli': '^17.3.12',
        'typescript': '~5.2.2'
      }
    };

    const angularJson = {
      $schema: './node_modules/@angular/cli/lib/config/schema.json',
      version: 1,
      newProjectRoot: 'projects',
      projects: {
        demo: {
          projectType: 'application',
          schematics: {},
          root: '',
          sourceRoot: 'src',
          prefix: 'app',
          architect: {
            build: {
              builder: '@angular-devkit/build-angular:browser'
            }
          }
        }
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    await fs.writeFile(
      path.join(testDir, 'angular.json'),
      JSON.stringify(angularJson, null, 2)
    );
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    expect(result.metadata.framework).toBe('angular');
    expect(result.metadata.buildTool).toBe('angular-cli');

    // Verify evidence
    const angularEvidence = result.evidence.find(e =>
      e.message && e.message.includes('Angular')
    );
    expect(angularEvidence).toBeTruthy();
  });
});

describe('BoltDetector - Remix Projects', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(TEST_FIXTURES_DIR, `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect Remix project with app/routes/', async () => {
    const packageJson = {
      name: 'test-remix-project',
      dependencies: {
        '@remix-run/react': '^2.0.0',
        '@remix-run/node': '^2.0.0',
        vite: '^5.0.0'
      },
      devDependencies: {
        typescript: '^5.0.0'
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    await fs.mkdir(path.join(testDir, 'app', 'routes'), { recursive: true });

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.metadata.framework).toBe('remix');
    expect(result.metadata.buildTool).toBe('vite');
  });
});

describe('BoltDetector - Other Frameworks', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(TEST_FIXTURES_DIR, `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect React + Vite project', async () => {
    const packageJson = {
      name: 'test-react-project',
      dependencies: {
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0'
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.metadata.framework).toBe('react');
    expect(result.metadata.buildTool).toBe('vite');
  });

  it('should detect Vue + Vite project', async () => {
    const packageJson = {
      name: 'test-vue-project',
      dependencies: {
        vue: '^3.0.0'
      },
      devDependencies: {
        vite: '^5.0.0'
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.metadata.framework).toBe('vue');
    expect(result.metadata.buildTool).toBe('vite');
  });
});

describe('BoltDetector - Primary Signatures', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(TEST_FIXTURES_DIR, `test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should detect .stackblitzrc file with 100% confidence', async () => {
    const stackblitzrc = {
      installDependencies: true,
      startCommand: 'npm start',
      compileTrigger: 'auto'
    };

    await fs.writeFile(
      path.join(testDir, '.stackblitzrc'),
      JSON.stringify(stackblitzrc, null, 2)
    );

    // Also create minimal package.json
    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify({ name: 'test', version: '1.0.0' }, null, 2)
    );

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.confidence).toBe(1.0);
    expect(result.isConfident).toBe(true);
  });

  it('should detect stackblitz field in package.json with 100% confidence', async () => {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      stackblitz: {
        installDependencies: true,
        startCommand: 'npm start'
      }
    };

    await fs.writeFile(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    const detector = new BoltDetector(testDir);
    const result = await detector.detect();

    expect(result.confidence).toBe(1.0);
    expect(result.isConfident).toBe(true);
  });
});
