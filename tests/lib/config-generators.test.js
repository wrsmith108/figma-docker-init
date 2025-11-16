import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateServeJson,
  generateTsConfig,
  normalizeBuildOutput,
  fixDockerComposeContext,
  runAllConfigFixes
} from '../../src/lib/config-generators.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('config-generators', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-generators-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('generateServeJson', () => {
    test('should create serve.json with default settings', async () => {
      const result = await generateServeJson(tempDir);

      expect(result.created).toBe(true);
      expect(result.path).toBe(path.join(tempDir, 'serve.json'));
      expect(result.message).toContain('optimal caching');

      const content = await fs.readFile(path.join(tempDir, 'serve.json'), 'utf8');
      const config = JSON.parse(content);

      expect(config.public).toBe('dist');
      expect(config.cleanUrls).toBe(true);
      expect(config.trailingSlash).toBe(false);
      expect(config.headers).toBeDefined();
      expect(config.rewrites).toBeDefined();
    });

    test('should not overwrite existing serve.json', async () => {
      const existing = { custom: 'config' };
      await fs.writeFile(
        path.join(tempDir, 'serve.json'),
        JSON.stringify(existing, null, 2)
      );

      const result = await generateServeJson(tempDir);

      expect(result.created).toBe(false);
      expect(result.message).toContain('already exists');

      const content = await fs.readFile(path.join(tempDir, 'serve.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.custom).toBe('config');
    });

    test('should use custom publicDir', async () => {
      const result = await generateServeJson(tempDir, { publicDir: 'build' });

      expect(result.created).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'serve.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.public).toBe('build');
    });

    test('should disable SPA mode when requested', async () => {
      const result = await generateServeJson(tempDir, { spa: false });

      expect(result.created).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'serve.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.rewrites).toBeUndefined();
    });

    test('should include cache headers for static assets', async () => {
      await generateServeJson(tempDir);

      const content = await fs.readFile(path.join(tempDir, 'serve.json'), 'utf8');
      const config = JSON.parse(content);

      const staticAssetHeader = config.headers.find(h =>
        h.source.includes('js|css|woff')
      );
      expect(staticAssetHeader).toBeDefined();
      expect(staticAssetHeader.headers[0].value).toContain('max-age=31536000');
    });
  });

  describe('generateTsConfig', () => {
    test('should create tsconfig.json with default settings', async () => {
      const result = await generateTsConfig(tempDir);

      expect(result.created).toBe(true);
      expect(result.path).toBe(path.join(tempDir, 'tsconfig.json'));
      expect(result.message).toContain('tsconfig.json and tsconfig.node.json');

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);

      expect(config.compilerOptions.target).toBe('ES2020');
      expect(config.compilerOptions.jsx).toBe('react-jsx');
      expect(config.compilerOptions.strict).toBe(true);
      expect(config.include).toContain('src');
    });

    test('should not overwrite existing tsconfig.json', async () => {
      const existing = { compilerOptions: { target: 'ES5' } };
      await fs.writeFile(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify(existing, null, 2)
      );

      const result = await generateTsConfig(tempDir);

      expect(result.created).toBe(false);
      expect(result.message).toContain('already exists');

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.target).toBe('ES5');
    });

    test('should create tsconfig.node.json', async () => {
      await generateTsConfig(tempDir);

      const nodeConfigExists = await fs.access(path.join(tempDir, 'tsconfig.node.json'))
        .then(() => true)
        .catch(() => false);

      expect(nodeConfigExists).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.node.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.composite).toBe(true);
    });

    test('should set jsx to preserve for Vue', async () => {
      await generateTsConfig(tempDir, { framework: 'vue' });

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.jsx).toBe('preserve');
    });

    test('should disable strict mode when requested', async () => {
      await generateTsConfig(tempDir, { strict: false });

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.strict).toBe(false);
    });

    test('should include path aliases', async () => {
      await generateTsConfig(tempDir);

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.paths['@/*']).toEqual(['./src/*']);
    });
  });

  describe('normalizeBuildOutput', () => {
    test('should normalize build to dist in vite.config.ts', async () => {
      const viteConfig = `
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'build'
  }
});
`;
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);

      const result = await normalizeBuildOutput(tempDir);

      expect(result.normalized).toBe(true);
      expect(result.file).toBe('vite.config.ts');

      const content = await fs.readFile(path.join(tempDir, 'vite.config.ts'), 'utf8');
      expect(content).toContain("outDir: 'dist'");
      expect(content).not.toContain("outDir: 'build'");
    });

    test('should handle double quotes', async () => {
      const viteConfig = `
export default {
  build: {
    outDir: "build"
  }
};
`;
      await fs.writeFile(path.join(tempDir, 'vite.config.js'), viteConfig);

      const result = await normalizeBuildOutput(tempDir);

      expect(result.normalized).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'vite.config.js'), 'utf8');
      expect(content).toContain("outDir: 'dist'");
    });

    test('should not modify if already set to dist', async () => {
      const viteConfig = `
export default {
  build: {
    outDir: 'dist'
  }
};
`;
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);

      const result = await normalizeBuildOutput(tempDir);

      expect(result.normalized).toBe(false);
      expect(result.message).toContain('already set to');
    });

    test('should return false if no vite.config file exists', async () => {
      const result = await normalizeBuildOutput(tempDir);

      expect(result.normalized).toBe(false);
      expect(result.message).toContain('No vite.config file found');
    });

    test('should try all vite config filename variants', async () => {
      const viteConfig = "export default { build: { outDir: 'build' } };";

      // Try .mjs variant
      await fs.writeFile(path.join(tempDir, 'vite.config.mjs'), viteConfig);

      const result = await normalizeBuildOutput(tempDir);

      expect(result.normalized).toBe(true);
      expect(result.file).toBe('vite.config.mjs');
    });
  });

  describe('fixDockerComposeContext', () => {
    test('should fix context from ../ to .', async () => {
      const dockerCompose = `
version: '3.8'
services:
  app:
    build:
      context: ../
      dockerfile: Dockerfile
`;
      await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), dockerCompose);

      const result = await fixDockerComposeContext(tempDir);

      expect(result.fixed).toBe(true);
      expect(result.message).toContain('Fixed');

      const content = await fs.readFile(path.join(tempDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('context: .');
      expect(content).not.toContain('context: ../');
    });

    test('should handle context: .. without trailing slash', async () => {
      const dockerCompose = `
services:
  app:
    build:
      context: ..
`;
      await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), dockerCompose);

      const result = await fixDockerComposeContext(tempDir);

      expect(result.fixed).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'docker-compose.yml'), 'utf8');
      expect(content).toContain('context: .');
    });

    test('should not modify if context is already correct', async () => {
      const dockerCompose = `
services:
  app:
    build:
      context: .
`;
      await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), dockerCompose);

      const result = await fixDockerComposeContext(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.message).toContain('already correct');
    });

    test('should return false if docker-compose.yml does not exist', async () => {
      const result = await fixDockerComposeContext(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('runAllConfigFixes', () => {
    test('should run all fixes and return combined results', async () => {
      // Create a vite.config with issues
      const viteConfig = "export default { build: { outDir: 'build' } };";
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);

      // Create docker-compose with issues
      const dockerCompose = "services:\n  app:\n    build:\n      context: ../";
      await fs.writeFile(path.join(tempDir, 'docker-compose.yml'), dockerCompose);

      const results = await runAllConfigFixes(tempDir);

      expect(results.serveJson).toBeDefined();
      expect(results.tsConfig).toBeDefined();
      expect(results.buildOutput).toBeDefined();
      expect(results.dockerCompose).toBeDefined();

      expect(results.serveJson.created).toBe(true);
      expect(results.tsConfig.created).toBe(true);
      expect(results.buildOutput.normalized).toBe(true);
      expect(results.dockerCompose.fixed).toBe(true);
    });

    test('should handle errors gracefully', async () => {
      // Make directory read-only to cause errors
      await fs.chmod(tempDir, 0o444);

      const results = await runAllConfigFixes(tempDir);

      expect(results.serveJson.error).toBeDefined();
      expect(results.tsConfig.error).toBeDefined();

      // Restore permissions for cleanup
      await fs.chmod(tempDir, 0o755);
    });

    test('should pass framework option to tsConfig generator', async () => {
      const results = await runAllConfigFixes(tempDir, { framework: 'vue' });

      expect(results.tsConfig.created).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.jsx).toBe('preserve');
    });
  });
});
