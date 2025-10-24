/**
 * Test: Build Output Directory Detection
 * Purpose: Cover parseViteConfig, parseRollupConfig, parseWebpackConfig, detectBuildOutputDir
 * Coverage Target: Lines 201-254
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseViteConfig,
  parseRollupConfig,
  parseWebpackConfig,
  detectBuildOutputDir
} from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, '../fixtures/build-output-tests');

describe('Build Output Directory Detection', () => {
  beforeAll(() => {
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('parseViteConfig', () => {
    it('should parse vite.config.js with build.outDir', async () => {
      const projectDir = path.join(fixturesDir, 'vite-js');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'vite.config.js'),
        `export default {
          build: {
            outDir: 'vite-dist'
          }
        }`
      );

      const result = await parseViteConfig(projectDir);
      expect(result).toBe('vite-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should parse vite.config.ts with build.outDir', async () => {
      const projectDir = path.join(fixturesDir, 'vite-ts');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'vite.config.ts'),
        `import { defineConfig } from 'vite';
        export default defineConfig({
          build: {
            outDir: 'vite-ts-dist'
          }
        });`
      );

      const result = await parseViteConfig(projectDir);
      expect(result).toBe('vite-ts-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should return null when vite config not found', async () => {
      const projectDir = path.join(fixturesDir, 'no-vite-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const result = await parseViteConfig(projectDir);
      expect(result).toBeNull();

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should return null when outDir not specified', async () => {
      const projectDir = path.join(fixturesDir, 'vite-no-outdir');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'vite.config.js'),
        'export default { plugins: [] }'
      );

      const result = await parseViteConfig(projectDir);
      expect(result).toBeNull();

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('parseRollupConfig', () => {
    it('should parse rollup.config.js with output.dir', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-js');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'rollup.config.js'),
        `export default {
          output: {
            dir: 'rollup-dist'
          }
        }`
      );

      const result = await parseRollupConfig(projectDir);
      expect(result).toBe('rollup-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should parse rollup.config.ts with output.dir', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-ts');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'rollup.config.ts'),
        `import typescript from '@rollup/plugin-typescript';
        export default {
          output: {
            dir: 'rollup-ts-dist'
          }
        };`
      );

      const result = await parseRollupConfig(projectDir);
      expect(result).toBe('rollup-ts-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should return null when rollup config not found', async () => {
      const projectDir = path.join(fixturesDir, 'no-rollup-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const result = await parseRollupConfig(projectDir);
      expect(result).toBeNull();

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('parseWebpackConfig', () => {
    it('should parse webpack.config.js with output.path', async () => {
      const projectDir = path.join(fixturesDir, 'webpack-js');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'webpack.config.js'),
        `const path = require('path');
        module.exports = {
          output: {
            path: path.resolve(__dirname, 'webpack-dist')
          }
        }`
      );

      const result = await parseWebpackConfig(projectDir);
      expect(result).toBe('webpack-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should parse webpack.config.ts with output.path', async () => {
      const projectDir = path.join(fixturesDir, 'webpack-ts');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'webpack.config.ts'),
        `import path from 'path';
        export default {
          output: {
            path: path.resolve(__dirname, 'webpack-ts-dist')
          }
        };`
      );

      const result = await parseWebpackConfig(projectDir);
      expect(result).toBe('webpack-ts-dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should return null when webpack config not found', async () => {
      const projectDir = path.join(fixturesDir, 'no-webpack-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const result = await parseWebpackConfig(projectDir);
      expect(result).toBeNull();

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('detectBuildOutputDir', () => {
    it('should prioritize Vite config', async () => {
      const projectDir = path.join(fixturesDir, 'priority-vite');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'vite.config.js'),
        'export default { build: { outDir: "vite-out" } }'
      );
      fs.writeFileSync(
        path.join(projectDir, 'webpack.config.js'),
        'module.exports = { output: { path: path.resolve(__dirname, "webpack-out") } }'
      );

      const result = await detectBuildOutputDir(projectDir);
      expect(result).toBe('vite-out');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should fallback to Rollup if Vite not found', async () => {
      const projectDir = path.join(fixturesDir, 'fallback-rollup');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'rollup.config.js'),
        'export default { output: { dir: "rollup-out" } }'
      );

      const result = await detectBuildOutputDir(projectDir);
      expect(result).toBe('rollup-out');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should fallback to Webpack if Vite and Rollup not found', async () => {
      const projectDir = path.join(fixturesDir, 'fallback-webpack');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'webpack.config.js'),
        'module.exports = { output: { path: path.resolve(__dirname, "webpack-out") } }'
      );

      const result = await detectBuildOutputDir(projectDir);
      expect(result).toBe('webpack-out');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should return null when no build config found', async () => {
      const projectDir = path.join(fixturesDir, 'no-build-config');
      fs.mkdirSync(projectDir, { recursive: true });

      const result = await detectBuildOutputDir(projectDir);
      expect(result).toBeNull();

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });
});
