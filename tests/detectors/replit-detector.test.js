/**
 * Replit Detector - Comprehensive Test Suite
 *
 * Tests for the Replit project detector following established patterns.
 * Covers:
 * - Primary signature detection (.replit + replit.nix = 80% confidence)
 * - Secondary signatures (@replit/* packages)
 * - Tertiary signatures (.replit.d/, tsx, port 5000)
 * - Edge cases and error handling
 * - Confidence calculations
 * - Metadata extraction
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ReplitDetector } from '../../src/detectors/replit-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Create a temporary test project directory
 */
async function createTempProject() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'replit-test-'));
  return tempDir;
}

/**
 * Clean up temporary project directory
 */
async function cleanupTempProject(dir) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

/**
 * Helper to write JSON file
 */
async function writeJSON(dir, filename, data) {
  const filePath = path.join(dir, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

/**
 * Helper to write text file
 */
async function writeFile(dir, filename, content) {
  const filePath = path.join(dir, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

describe('ReplitDetector', () => {

  describe('Primary Signature Detection (80% Confidence)', () => {

    it('should detect .replit configuration file with additional signature', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', `
run = "npm run dev"
modules = ["nodejs-20", "web"]

[[ports]]
localPort = 5000
externalPort = 80
        `);

        await fs.mkdir(path.join(tempDir, '.replit.d'), { recursive: true });
        await writeJSON(tempDir, 'package.json', {
          name: 'test-app',
          devDependencies: { 'tsx': '^4.0.0' }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.evidence.some(e => e.includes('.replit'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect replit.nix package configuration with additional signature', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, 'replit.nix', `
{pkgs}: {
  deps = [
    pkgs.postgresql
  ];
}
        `);

        await writeJSON(tempDir, 'package.json', {
          name: 'test-app',
          dependencies: { '@replit/database': '^2.0.0' }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.evidence.some(e => e.includes('replit.nix'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should achieve 80% confidence with both primary signatures', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = [pkgs.nodejs]; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Secondary Signature Detection (@replit/* packages)', () => {

    it('should detect @replit/* packages in package.json', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            '@replit/vite-plugin-cartographer': '^0.0.11',
            '@replit/vite-plugin-runtime-error-modal': '^0.0.3'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.evidence.some(e => e.includes('@replit/'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect @replit/database dependency', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            '@replit/database': '^2.1.2'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.metadata.hasReplitDB).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Tertiary Signature Detection', () => {

    it('should detect .replit.d/ directory as tertiary indicator', async () => {
      const tempDir = await createTempProject();

      try {
        await fs.mkdir(path.join(tempDir, '.replit.d'), { recursive: true });
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeJSON(tempDir, 'package.json', {
          name: 'test-app',
          devDependencies: { 'tsx': '^4.0.0' }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect tsx in devDependencies as tertiary indicator', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          devDependencies: {
            'tsx': '^4.19.1'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await fs.mkdir(path.join(tempDir, '.replit.d'), { recursive: true });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Framework Detection', () => {

    it('should detect Express framework', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            'express': '^4.18.2'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.framework).toBe('express');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect React + Vite stack', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.3.1',
            'vite': '^5.0.0'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm run dev"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.framework).toBe('react-vite');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Database Detection', () => {

    it('should detect PostgreSQL from .replit modules', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', `
run = "npm start"
modules = ["nodejs-20", "postgresql-16", "web"]
        `);

        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.database).toBe('postgresql');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect PostgreSQL from replit.nix', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = [pkgs.postgresql]; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.metadata.database).toBe('postgresql');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Metadata Extraction', () => {

    it('should extract project name from package.json', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: '3dmodelviewer',
          version: '1.0.0'
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.projectName).toBe('3dmodelviewer');
        expect(result.metadata.hasPackageJson).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should extract run command from .replit file', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm run dev"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.runCommand).toBe('npm run dev');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should extract entrypoint from .replit file', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', `
run = "npm run dev"
entrypoint = "server/index.ts"
        `);

        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.entrypoint).toBe('server/index.ts');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should extract port from .replit file', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', `
run = "npm start"

[[ports]]
localPort = 5000
externalPort = 80
        `);

        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.port).toBe(5000);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect TypeScript usage', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          devDependencies: {
            'typescript': '^5.0.0',
            'tsx': '^4.19.1'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.language).toBe('typescript');
        expect(result.metadata.isTypeScript).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect JavaScript-only project', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            'express': '^4.0.0'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.language).toBe('javascript');
        expect(result.metadata.isTypeScript).toBe(false);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Confidence Calculation', () => {

    it('should return null for non-Replit project', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'random-app',
          version: '1.0.0',
          dependencies: {
            'express': '^4.0.0'
          }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBe(0);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should accumulate confidence from multiple signatures', async () => {
      const tempDir = await createTempProject();

      try {
        // Setup multiple signatures
        await writeFile(tempDir, '.replit', `
run = "npm run dev"
modules = ["nodejs-20", "web", "postgresql-16"]
entrypoint = "server/index.ts"

[[ports]]
localPort = 5000
externalPort = 80
        `);

        await writeFile(tempDir, 'replit.nix', `
{pkgs}: {
  deps = [
    pkgs.postgresql
  ];
}
        `);

        await fs.mkdir(path.join(tempDir, '.replit.d'), { recursive: true });

        await writeJSON(tempDir, 'package.json', {
          name: '3dmodelviewer',
          version: '1.0.0',
          dependencies: {
            'express': '^4.21.2',
            'react': '^18.3.1',
            '@replit/vite-plugin-cartographer': '^0.0.11'
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'tsx': '^4.19.1'
          }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Edge Cases', () => {

    it('should handle missing package.json gracefully', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
        expect(result.metadata.hasPackageJson).toBe(false);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should handle invalid JSON files gracefully', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');
        await writeFile(tempDir, 'package.json', '{invalid json}');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata.hasPackageJson).toBe(false);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should handle empty project directory', async () => {
      const tempDir = await createTempProject();

      try {
        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBe(0);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should handle non-existent project paths gracefully', async () => {
      const detector = new ReplitDetector('/nonexistent/path/12345');
      const result = await detector.detect();

      expect(result.tool).toBeNull();
      expect(result.confidence).toBe(0);
    });

  });

  describe('Metadata and Evidence', () => {

    it('should return correct metadata structure', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'replit-app',
          version: '1.0.0',
          dependencies: {
            'express': '^4.18.2'
          },
          devDependencies: {
            'tsx': '^4.19.1'
          }
        });

        await writeFile(tempDir, '.replit', 'run = "npm run dev"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.metadata).toBeDefined();
        expect(result.metadata.framework).toBe('express');
        expect(result.metadata.hasPackageJson).toBe(true);
        expect(result.metadata.projectName).toBe('replit-app');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should provide evidence array with detection details', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "npm start"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = []; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(Array.isArray(result.evidence)).toBe(true);
        expect(result.evidence.length).toBeGreaterThan(0);
        expect(result.evidence[0]).toContain('.replit');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Detector Instance Properties', () => {

    it('should have priority property set to 3', () => {
      const detector = new ReplitDetector('.');
      expect(detector.priority).toBe(3);
    });

    it('should have tool property set to "replit"', () => {
      const detector = new ReplitDetector('.');
      expect(detector.tool).toBe('replit');
    });

  });

  describe('Real-world Scenario Tests', () => {

    it('should detect a minimal Replit project setup', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', 'run = "node index.js"');
        await writeFile(tempDir, 'replit.nix', '{pkgs}: { deps = [pkgs.nodejs-20]; }');

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect a full-featured Replit project (3DModelViewer-like)', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.replit', `
run = "npm run dev"
modules = ["nodejs-20", "web", "postgresql-16"]
entrypoint = "server/index.ts"

[nix]
channel = "stable-24_05"

[[ports]]
localPort = 5000
externalPort = 80
        `);

        await writeFile(tempDir, 'replit.nix', `
{pkgs}: {
  deps = [
    pkgs.postgresql
  ];
}
        `);

        await fs.mkdir(path.join(tempDir, '.replit.d'), { recursive: true });

        await writeJSON(tempDir, 'package.json', {
          name: '3dmodelviewer',
          version: '0.0.0',
          type: 'module',
          dependencies: {
            'express': '^4.21.2',
            'react': '^18.3.1',
            'three': '^0.175.0',
            'postgres': '^3.4.5',
            '@replit/vite-plugin-shadcn-theme-json': '^0.0.4',
            '@replit/vite-plugin-cartographer': '^0.0.11',
            '@replit/vite-plugin-runtime-error-modal': '^0.0.3'
          },
          devDependencies: {
            'vite': '^6.0.6',
            'typescript': '^5.6.3',
            'tsx': '^4.19.1',
            'drizzle-kit': '^0.28.1'
          }
        });

        const detector = new ReplitDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('replit');
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        expect(result.metadata.framework).toBe('express'); // Express prioritized over React
        expect(result.metadata.database).toBe('postgresql');
        expect(result.metadata.isTypeScript).toBe(true);
        expect(result.metadata.port).toBe(5000);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

});
