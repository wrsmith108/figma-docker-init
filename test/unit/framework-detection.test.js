/**
 * Test: Framework Detection Edge Cases
 * Purpose: Cover lines 328-376 framework detection logic
 * Coverage Target: Complex framework + build tool combinations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectProjectValues } from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, '../fixtures/framework-tests');

describe('Framework Detection Edge Cases', () => {
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

  describe('Vite Combinations', () => {
    it('should detect vite with vue', async () => {
      const projectDir = path.join(fixturesDir, 'vite-vue');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vite-vue-app',
          dependencies: { vite: '^4.0.0', vue: '^3.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vue-vite');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect vite with svelte', async () => {
      const projectDir = path.join(fixturesDir, 'vite-svelte');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vite-svelte-app',
          dependencies: { vite: '^4.0.0', svelte: '^4.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('svelte-vite');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect vite without framework as "vite"', async () => {
      const projectDir = path.join(fixturesDir, 'vite-plain');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vite-app',
          dependencies: { vite: '^4.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vite');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Webpack Combinations', () => {
    it('should detect webpack with react', async () => {
      const projectDir = path.join(fixturesDir, 'webpack-react');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'webpack-react-app',
          dependencies: { webpack: '^5.0.0', react: '^18.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('react-webpack');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect webpack-cli with vue', async () => {
      const projectDir = path.join(fixturesDir, 'webpack-vue');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'webpack-vue-app',
          dependencies: { 'webpack-cli': '^5.0.0', vue: '^3.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vue-webpack');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect webpack without framework', async () => {
      const projectDir = path.join(fixturesDir, 'webpack-plain');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'webpack-app',
          dependencies: { webpack: '^5.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('webpack');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Rollup Combinations', () => {
    it('should detect rollup with react', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-react');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'rollup-react-app',
          dependencies: { rollup: '^3.0.0', react: '^18.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('react-rollup');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect rollup with vue', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-vue');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'rollup-vue-app',
          dependencies: { rollup: '^3.0.0', vue: '^3.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vue-rollup');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect rollup with svelte', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-svelte');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'rollup-svelte-app',
          dependencies: { rollup: '^3.0.0', svelte: '^4.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('svelte-rollup');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect rollup without framework', async () => {
      const projectDir = path.join(fixturesDir, 'rollup-plain');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'rollup-app',
          dependencies: { rollup: '^3.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('rollup');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Framework-Only Detection', () => {
    it('should detect standalone react', async () => {
      const projectDir = path.join(fixturesDir, 'react-only');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'react-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('react');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect standalone vue', async () => {
      const projectDir = path.join(fixturesDir, 'vue-only');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vue-app',
          dependencies: { vue: '^3.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vue');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect standalone svelte', async () => {
      const projectDir = path.join(fixturesDir, 'svelte-only');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'svelte-app',
          dependencies: { svelte: '^4.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('svelte');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should default to vanilla when no framework detected', async () => {
      const projectDir = path.join(fixturesDir, 'vanilla');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vanilla-app',
          dependencies: {}
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('vanilla');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('TypeScript Detection from @types', () => {
    it('should detect TypeScript from @types/node', async () => {
      const projectDir = path.join(fixturesDir, 'types-node');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'app',
          devDependencies: { '@types/node': '^20.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.TYPESCRIPT).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect TypeScript from @types/react', async () => {
      const projectDir = path.join(fixturesDir, 'types-react');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'app',
          dependencies: { react: '^18.0.0', '@types/react': '^18.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.TYPESCRIPT).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Priority Order (Next.js takes precedence)', () => {
    it('should prioritize next.js over vite', async () => {
      const projectDir = path.join(fixturesDir, 'next-priority');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'app',
          dependencies: { next: '^14.0.0', vite: '^4.0.0', react: '^18.0.0' }
        })
      );

      const values = await detectProjectValues(projectDir);
      expect(values.FRAMEWORK).toBe('next.js');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });
});
