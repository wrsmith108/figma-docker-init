import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  generateServeJson,
  generateTsConfig,
  normalizeBuildOutput,
  fixDockerComposeContext,
  detectPackageManager,
  generateNextConfig,
  fixRemixBuildOutput,
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

  describe('detectPackageManager', () => {
    test('should detect npm from package-lock.json', async () => {
      await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');

      const result = await detectPackageManager(tempDir);

      expect(result.detected).toBe(true);
      expect(result.manager).toBe('npm');
      expect(result.lockfile).toBe('package-lock.json');
      expect(result.installCommand).toBe('npm install');
    });

    test('should detect yarn from yarn.lock', async () => {
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');

      const result = await detectPackageManager(tempDir);

      expect(result.detected).toBe(true);
      expect(result.manager).toBe('yarn');
      expect(result.lockfile).toBe('yarn.lock');
      expect(result.installCommand).toBe('yarn install');
    });

    test('should detect pnpm from pnpm-lock.yaml', async () => {
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

      const result = await detectPackageManager(tempDir);

      expect(result.detected).toBe(true);
      expect(result.manager).toBe('pnpm');
      expect(result.lockfile).toBe('pnpm-lock.yaml');
      expect(result.installCommand).toBe('pnpm install');
    });

    test('should detect bun from bun.lockb', async () => {
      await fs.writeFile(path.join(tempDir, 'bun.lockb'), '');

      const result = await detectPackageManager(tempDir);

      expect(result.detected).toBe(true);
      expect(result.manager).toBe('bun');
      expect(result.lockfile).toBe('bun.lockb');
      expect(result.installCommand).toBe('bun install');
    });

    test('should default to npm when no lockfile exists', async () => {
      const result = await detectPackageManager(tempDir);

      expect(result.detected).toBe(false);
      expect(result.manager).toBe('npm');
      expect(result.lockfile).toBe(null);
      expect(result.installCommand).toBe('npm install');
    });

    test('should prioritize pnpm over yarn over npm', async () => {
      // Create multiple lockfiles
      await fs.writeFile(path.join(tempDir, 'package-lock.json'), '{}');
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');
      await fs.writeFile(path.join(tempDir, 'pnpm-lock.yaml'), '');

      const result = await detectPackageManager(tempDir);

      // pnpm-lock.yaml is checked first in the lockfiles object
      expect(result.manager).toBe('pnpm');
    });
  });

  describe('generateNextConfig', () => {
    test('should create next.config.js with standalone output', async () => {
      const result = await generateNextConfig(tempDir);

      expect(result.created).toBe(true);
      expect(result.modified).toBe(false);
      expect(result.path).toBe(path.join(tempDir, 'next.config.js'));
      expect(result.message).toContain('Created next.config.js');

      const content = await fs.readFile(path.join(tempDir, 'next.config.js'), 'utf8');
      expect(content).toContain("output: 'standalone'");
      expect(content).toContain('reactStrictMode: true');
    });

    test('should not overwrite existing next.config.js with standalone output', async () => {
      const existingConfig = `const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
`;
      await fs.writeFile(path.join(tempDir, 'next.config.js'), existingConfig);

      const result = await generateNextConfig(tempDir);

      expect(result.created).toBe(false);
      expect(result.modified).toBe(false);
      expect(result.message).toContain('already has standalone output');

      const content = await fs.readFile(path.join(tempDir, 'next.config.js'), 'utf8');
      expect(content).toBe(existingConfig);
    });

    test('should add standalone output to existing next.config.js without it', async () => {
      const existingConfig = `const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`;
      await fs.writeFile(path.join(tempDir, 'next.config.js'), existingConfig);

      const result = await generateNextConfig(tempDir);

      expect(result.created).toBe(false);
      expect(result.modified).toBe(true);
      expect(result.message).toContain('Added output');

      const content = await fs.readFile(path.join(tempDir, 'next.config.js'), 'utf8');
      expect(content).toContain("output: 'standalone'");
    });

    test('should handle next.config.mjs files', async () => {
      const existingConfig = `export default {
  reactStrictMode: true,
}
`;
      await fs.writeFile(path.join(tempDir, 'next.config.mjs'), existingConfig);

      const result = await generateNextConfig(tempDir);

      expect(result.created).toBe(false);
      expect(result.modified).toBe(true);
      expect(result.path).toBe(path.join(tempDir, 'next.config.mjs'));

      const content = await fs.readFile(path.join(tempDir, 'next.config.mjs'), 'utf8');
      expect(content).toContain("output: 'standalone'");
    });

    test('should handle next.config.ts files', async () => {
      const existingConfig = `const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`;
      await fs.writeFile(path.join(tempDir, 'next.config.ts'), existingConfig);

      const result = await generateNextConfig(tempDir);

      expect(result.created).toBe(false);
      expect(result.modified).toBe(true);
      expect(result.path).toBe(path.join(tempDir, 'next.config.ts'));
    });

    test('should check all config file variants', async () => {
      // No next.config file exists
      const result = await generateNextConfig(tempDir);

      // Should create default next.config.js
      expect(result.created).toBe(true);
      expect(result.path).toContain('next.config.js');
    });
  });

  describe('fixRemixBuildOutput', () => {
    test('should skip if remix.config.js already exists', async () => {
      await fs.writeFile(path.join(tempDir, 'remix.config.js'), 'module.exports = {}');

      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.path).toBe(path.join(tempDir, 'remix.config.js'));
      expect(result.message).toContain('already configured');
    });

    test('should skip if remix.config.ts already exists', async () => {
      await fs.writeFile(path.join(tempDir, 'remix.config.ts'), 'export default {}');

      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.path).toBe(path.join(tempDir, 'remix.config.ts'));
      expect(result.message).toContain('already configured');
    });

    test('should detect Remix project and check for @remix-run/serve', async () => {
      const packageJson = {
        name: 'remix-app',
        dependencies: {
          '@remix-run/react': '^2.5.0',
          '@remix-run/serve': '^2.5.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.needsServe).toBeUndefined();
      expect(result.message).toContain('@remix-run/serve already installed');
    });

    test('should suggest adding @remix-run/serve if missing', async () => {
      const packageJson = {
        name: 'remix-app',
        dependencies: {
          '@remix-run/react': '^2.5.0'
        },
        devDependencies: {
          '@remix-run/dev': '^2.5.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.needsServe).toBe(true);
      expect(result.message).toContain('consider adding @remix-run/serve');
    });

    test('should skip if not a Remix project', async () => {
      const packageJson = {
        name: 'react-app',
        dependencies: {
          react: '^18.2.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.message).toContain('Not a Remix project');
    });

    test('should handle missing package.json gracefully', async () => {
      const result = await fixRemixBuildOutput(tempDir);

      expect(result.fixed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Could not analyze');
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

      const results = await runAllConfigFixes(tempDir, { tool: 'figma-make' });

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
      const isWindows = process.platform === 'win32';

      if (isWindows) {
        // Windows: Use a non-existent directory to trigger errors
        const nonExistentDir = path.join(tempDir, 'non-existent-directory-xyz');
        const results = await runAllConfigFixes(nonExistentDir, { tool: 'figma-make' });

        expect(results.serveJson.error).toBeDefined();
        expect(results.tsConfig.error).toBeDefined();
      } else {
        // Unix: Make directory read-only to cause errors
        await fs.chmod(tempDir, 0o444);

        const results = await runAllConfigFixes(tempDir, { tool: 'figma-make' });

        expect(results.serveJson.error).toBeDefined();
        expect(results.tsConfig.error).toBeDefined();

        // Restore permissions for cleanup
        await fs.chmod(tempDir, 0o755);
      }
    });

    test('should pass framework option to tsConfig generator', async () => {
      const results = await runAllConfigFixes(tempDir, { framework: 'vue' });

      expect(results.tsConfig.created).toBe(true);

      const content = await fs.readFile(path.join(tempDir, 'tsconfig.json'), 'utf8');
      const config = JSON.parse(content);
      expect(config.compilerOptions.jsx).toBe('preserve');
    });

    test('should detect package manager for all tools', async () => {
      await fs.writeFile(path.join(tempDir, 'yarn.lock'), '');

      const results = await runAllConfigFixes(tempDir, { tool: 'figma-make' });

      expect(results.packageManager).toBeDefined();
      expect(results.packageManager.detected).toBe(true);
      expect(results.packageManager.manager).toBe('yarn');
    });

    test('should generate serve.json for figma-make and lovable only', async () => {
      // Test figma-make
      const figmaResults = await runAllConfigFixes(tempDir, { tool: 'figma-make' });
      expect(figmaResults.serveJson).toBeDefined();
      expect(figmaResults.serveJson.created).toBe(true);

      // Clean up
      await fs.rm(path.join(tempDir, 'serve.json'));

      // Test lovable
      const lovableResults = await runAllConfigFixes(tempDir, { tool: 'lovable' });
      expect(lovableResults.serveJson).toBeDefined();
      expect(lovableResults.serveJson.created).toBe(true);

      // Clean up
      await fs.rm(path.join(tempDir, 'serve.json'));

      // Test v0 (should skip)
      const v0Results = await runAllConfigFixes(tempDir, { tool: 'v0' });
      expect(v0Results.serveJson).toBeNull();

      // Test bolt (should skip)
      const boltResults = await runAllConfigFixes(tempDir, { tool: 'bolt' });
      expect(boltResults.serveJson).toBeNull();
    });

    test('should normalize build output for all tools except v0', async () => {
      const viteConfig = "export default { build: { outDir: 'build' } };";

      // Test figma-make
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);
      const figmaResults = await runAllConfigFixes(tempDir, { tool: 'figma-make' });
      expect(figmaResults.buildOutput.normalized).toBe(true);

      // Reset
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);

      // Test bolt
      const boltResults = await runAllConfigFixes(tempDir, { tool: 'bolt' });
      expect(boltResults.buildOutput.normalized).toBe(true);

      // Test v0 (should skip)
      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), viteConfig);
      const v0Results = await runAllConfigFixes(tempDir, { tool: 'v0' });
      expect(v0Results.buildOutput).toBeNull();
    });

    test('should generate next.config.js for v0 only', async () => {
      // Test v0
      const v0Results = await runAllConfigFixes(tempDir, { tool: 'v0' });
      expect(v0Results.nextConfig).toBeDefined();
      expect(v0Results.nextConfig.created).toBe(true);

      const nextConfigExists = await fs.access(path.join(tempDir, 'next.config.js'))
        .then(() => true)
        .catch(() => false);
      expect(nextConfigExists).toBe(true);

      // Test other tools (should skip)
      const figmaResults = await runAllConfigFixes(tempDir, { tool: 'figma-make' });
      expect(figmaResults.nextConfig).toBeNull();

      const boltResults = await runAllConfigFixes(tempDir, { tool: 'bolt' });
      expect(boltResults.nextConfig).toBeNull();
    });

    test('should check Remix build for bolt only', async () => {
      const packageJson = {
        name: 'remix-app',
        dependencies: {
          '@remix-run/react': '^2.5.0'
        },
        devDependencies: {
          '@remix-run/dev': '^2.5.0'
        }
      };
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Test bolt
      const boltResults = await runAllConfigFixes(tempDir, { tool: 'bolt' });
      expect(boltResults.remixBuild).toBeDefined();
      expect(boltResults.remixBuild.needsServe).toBe(true);

      // Test other tools (should skip)
      const figmaResults = await runAllConfigFixes(tempDir, { tool: 'figma-make' });
      expect(figmaResults.remixBuild).toBeNull();

      const v0Results = await runAllConfigFixes(tempDir, { tool: 'v0' });
      expect(v0Results.remixBuild).toBeNull();
    });
  });
});
