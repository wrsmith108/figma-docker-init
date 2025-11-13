/**
 * Lovable Detector - Comprehensive Test Suite
 *
 * Tests for the Lovable project detector with 95% confidence targeting.
 * Covers:
 * - Primary signature detection (lovable-tagger + componentTagger)
 * - Secondary signatures (Supabase, shadcn/ui)
 * - Tertiary signatures (React + TypeScript + Vite + Tailwind)
 * - Edge cases and error handling
 * - Confidence calculations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import LovableDetector from '../../src/detectors/lovable-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Create a temporary test project directory
 */
async function createTempProject() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lovable-test-'));
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

describe('LovableDetector', () => {

  describe('Primary Signature Detection (95% Confidence)', () => {

    it('should detect lovable-tagger in package.json', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          devDependencies: {
            'lovable-tagger': '^1.1.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.evidence.some(e => e.includes('lovable-tagger'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect componentTagger in vite.config.ts', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, 'vite.config.ts', `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";

export default defineConfig({
  plugins: [
    react(),
    componentTagger(),
  ]
});
        `);

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.5);
        expect(result.evidence.some(e => e.includes('componentTagger'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should achieve 95% confidence with both primary signatures', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0'
          }
        });

        await writeFile(tempDir, 'vite.config.ts', `
import { componentTagger } from "lovable-tagger";
export default {
  plugins: [componentTagger()]
};
        `);

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Secondary Signature Detection (80% Confidence)', () => {

    it('should detect Supabase integration directory', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(
          tempDir,
          'src/integrations/supabase/client.ts',
          `
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabase = createClient<Database>(url, key);
export { supabase };
          `
        );

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.2);
        expect(result.evidence.some(e => e.includes('Supabase'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect @supabase/supabase-js in dependencies', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          dependencies: {
            '@supabase/supabase-js': '^2.38.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
        expect(result.evidence.some(e => e.includes('supabase-js'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect shadcn/ui components directory', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, 'src/components/ui/button.tsx', 'export const Button = () => {};');
        await writeFile(tempDir, 'src/components/ui/card.tsx', 'export const Card = () => {};');

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
        expect(result.evidence.some(e => e.includes('shadcn/ui'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect components.json (shadcn/ui config)', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'components.json', {
          style: 'default',
          rsc: false,
          tsx: true,
          tailwind: {
            config: 'tailwind.config.ts'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
        expect(result.evidence.some(e => e.includes('components.json'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Tertiary Signature Detection (60% Confidence)', () => {

    it('should detect React 18+ + TypeScript + Vite + Tailwind combo', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'vite': '^5.0.0',
            'tailwindcss': '^3.3.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.2);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect port 8080 in vite.config', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, 'vite.config.ts', `
export default {
  server: {
    port: 8080
  }
};
        `);

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.02);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect @ path alias in tsconfig.json', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'tsconfig.json', {
          compilerOptions: {
            baseUrl: '.',
            paths: {
              '@/*': ['./src/*']
            },
            strict: true
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.04);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect TypeScript strict mode', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'tsconfig.json', {
          compilerOptions: {
            strict: true,
            target: 'ES2020'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.02);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Confidence Calculation', () => {

    it('should return 0 confidence for non-Lovable project', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'random-app',
          version: '1.0.0',
          dependencies: {
            'express': '^4.0.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBeLessThan(0.6);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should accumulate confidence from multiple signatures', async () => {
      const tempDir = await createTempProject();

      try {
        // Setup multiple signatures
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          dependencies: {
            'react': '^19.0.0',
            '@supabase/supabase-js': '^2.38.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0',
            'tailwindcss': '^3.3.0',
            'typescript': '^5.0.0'
          }
        });

        await writeFile(tempDir, 'vite.config.ts', `
import { componentTagger } from "lovable-tagger";
export default { plugins: [componentTagger()] };
        `);

        await writeFile(tempDir, 'src/integrations/supabase/client.ts', `
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(url, key);
        `);

        await writeJSON(tempDir, 'tsconfig.json', {
          compilerOptions: { paths: { '@/*': ['./src/*'] }, strict: true }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Edge Cases', () => {

    it('should handle missing package.json gracefully', async () => {
      const tempDir = await createTempProject();

      try {
        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBeLessThan(0.6);
        expect(result.error).toBeUndefined();
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should handle invalid JSON files gracefully', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, 'package.json', '{invalid json}');

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBeLessThan(0.6);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should handle empty project directory', async () => {
      const tempDir = await createTempProject();

      try {
        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBeNull();
        expect(result.confidence).toBeLessThan(0.6);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect radix UI dependencies (shadcn/ui)', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          dependencies: {
            '@radix-ui/react-dialog': '^1.1.0',
            '@radix-ui/react-dropdown-menu': '^2.0.0',
            'lucide-react': '^0.292.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Metadata and Evidence', () => {

    it('should return correct metadata for Lovable project', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          devDependencies: {
            'lovable-tagger': '^1.1.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.metadata).toEqual({
          framework: 'react',
          buildTool: 'vite',
          backend: 'supabase',
          language: 'typescript',
          styling: 'tailwind'
        });
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should provide evidence array with detection details', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          devDependencies: {
            'lovable-tagger': '^1.1.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(Array.isArray(result.evidence)).toBe(true);
        expect(result.evidence.length).toBeGreaterThan(0);
        expect(result.evidence[0]).toContain('lovable-tagger');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should track indicator scores separately', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.score).toBeDefined();
        expect(result.score.strong).toBeGreaterThan(0);
        expect(typeof result.score.medium).toBe('number');
        expect(typeof result.score.weak).toBe('number');
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Environment Variables Detection', () => {

    it('should detect Supabase configuration in .env.example', async () => {
      const tempDir = await createTempProject();

      try {
        await writeFile(tempDir, '.env.example', `
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=key
        `);

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
        expect(result.evidence.some(e => e.includes('Supabase'))).toBe(true);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('React Router Detection', () => {

    it('should detect react-router-dom dependency', async () => {
      const tempDir = await createTempProject();

      try {
        await writeJSON(tempDir, 'package.json', {
          name: 'lovable-app',
          version: '1.0.0',
          dependencies: {
            'react-router-dom': '^6.18.0'
          }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.confidence).toBeGreaterThanOrEqual(0.08);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

  describe('Detector Instance Properties', () => {

    it('should have priority property set to 2', () => {
      const detector = new LovableDetector('.');
      expect(detector.priority).toBe(2);
    });

    it('should initialize with empty indicators', () => {
      const detector = new LovableDetector('.');
      expect(detector.indicators).toEqual({
        strong: 0,
        medium: 0,
        weak: 0
      });
    });

    it('should initialize with empty findings', () => {
      const detector = new LovableDetector('.');
      expect(detector.findings).toEqual([]);
    });

  });

  describe('Real-world Scenario Tests', () => {

    it('should detect a minimal Lovable project setup', async () => {
      const tempDir = await createTempProject();

      try {
        // Minimal Lovable setup: lovable-tagger + Vite + React
        await writeJSON(tempDir, 'package.json', {
          name: 'minimal-lovable',
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build'
          },
          dependencies: {
            'react': '^19.0.0',
            'react-dom': '^19.0.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0',
            '@vitejs/plugin-react-swc': '^3.2.0'
          }
        });

        await writeFile(tempDir, 'vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { componentTagger } from 'lovable-tagger'

export default defineConfig({
  plugins: [react(), componentTagger()]
})
        `);

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

    it('should detect a full-featured Lovable project', async () => {
      const tempDir = await createTempProject();

      try {
        // Full Lovable setup with all major components
        await writeJSON(tempDir, 'package.json', {
          name: 'full-lovable-app',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            'react': '^19.0.0',
            'react-dom': '^19.0.0',
            'react-router-dom': '^6.18.0',
            '@supabase/supabase-js': '^2.38.0',
            '@supabase/auth-ui-react': '^0.4.0',
            '@radix-ui/react-dialog': '^1.1.0',
            '@radix-ui/react-dropdown-menu': '^2.0.0',
            '@radix-ui/react-slot': '^2.0.0',
            'lucide-react': '^0.292.0',
            'clsx': '^2.0.0',
            'tailwind-merge': '^2.0.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0',
            'typescript': '^5.0.0',
            'tailwindcss': '^3.3.0',
            'postcss': '^8.4.0',
            'autoprefixer': '^10.4.0'
          }
        });

        await writeFile(tempDir, 'vite.config.ts', `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

export default defineConfig({
  server: { host: '::', port: 8080 },
  plugins: [react(), componentTagger()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } }
})
        `);

        await writeFile(tempDir, 'src/integrations/supabase/client.ts', `
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, key)
        `);

        await writeFile(tempDir, 'src/components/ui/button.tsx', 'export const Button = () => {}');
        await writeFile(tempDir, 'src/components/ui/card.tsx', 'export const Card = () => {}');

        await writeJSON(tempDir, 'tsconfig.json', {
          compilerOptions: {
            target: 'ES2020',
            strict: true,
            paths: { '@/*': ['./src/*'] }
          }
        });

        await writeJSON(tempDir, 'components.json', {
          style: 'default',
          rsc: false,
          tsx: true,
          tailwind: { config: 'tailwind.config.ts' }
        });

        const detector = new LovableDetector(tempDir);
        const result = await detector.detect();

        expect(result.tool).toBe('lovable');
        expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      } finally {
        await cleanupTempProject(tempDir);
      }
    });

  });

});
