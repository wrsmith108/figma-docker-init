/**
 * Test: Unified Config Parser
 * Purpose: Test parseConfig helper for all bundler types
 * TDD Phase: RED - These tests will FAIL until parseConfig is implemented
 */

const fs = require('fs');
const path = require('path');

describe('parseConfig Helper', () => {
  let parseConfig;
  const testDir = path.join(__dirname, '../fixtures/configs');

  beforeEach(() => {
    jest.resetModules();
    // This will fail until parseConfig is implemented and exported
    parseConfig = require('../../index.js').parseConfig;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be a function', () => {
      expect(typeof parseConfig).toBe('function');
    });

    it('should accept configPath and pattern as parameters', () => {
      expect(parseConfig.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('File Extension Handling', () => {
    it('should try .js extension if no extension provided', async () => {
      const readFileSpy = jest.spyOn(fs.promises, 'readFile');
      const configPath = path.join(testDir, 'vite.config');

      try {
        await parseConfig(configPath, /build\.outDir\s*:\s*['"](.+?)['"]/);
      } catch (error) {
        // Expected to fail in Red phase
      }

      expect(readFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('vite.config.js'),
        'utf-8'
      );
    });

    it('should try .ts extension if .js not found', async () => {
      const readFileSpy = jest.spyOn(fs.promises, 'readFile')
        .mockRejectedValueOnce(new Error('ENOENT: .js not found'))
        .mockResolvedValueOnce('export default { build: { outDir: "dist" } }');

      const configPath = path.join(testDir, 'vite.config');
      await parseConfig(configPath, /build\.outDir\s*:\s*['"](.+?)['"]/);

      expect(readFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('vite.config.ts'),
        'utf-8'
      );
    });
  });

  describe('Pattern Matching', () => {
    it('should extract value using provided regex pattern', async () => {
      const mockContent = 'export default { build: { outDir: "custom-dist" } }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'vite.config.js',
        /build\.outDir\s*:\s*['"](.+?)['"]/
      );

      expect(result).toBe('custom-dist');
    });

    it('should return null if pattern does not match', async () => {
      const mockContent = 'export default { }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'vite.config.js',
        /nonexistent\.pattern/
      );

      expect(result).toBeNull();
    });

    it('should handle complex Vite config patterns', async () => {
      const mockContent = `
        export default defineConfig({
          build: {
            outDir: 'production-build'
          }
        })
      `;
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'vite.config.js',
        /build\.outDir\s*:\s*['"](.+?)['"]/
      );

      expect(result).toBe('production-build');
    });

    it('should handle Webpack output.path patterns', async () => {
      const mockContent = `
        module.exports = {
          output: {
            path: path.resolve(__dirname, 'webpack-dist')
          }
        }
      `;
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'webpack.config.js',
        /output\.path[^'"]+'(.+?)'/
      );

      expect(result).toBe('webpack-dist');
    });
  });

  describe('Error Handling', () => {
    it('should return null when config file does not exist', async () => {
      jest.spyOn(fs.promises, 'readFile')
        .mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await parseConfig(
        'nonexistent.config.js',
        /pattern/
      );

      expect(result).toBeNull();
    });

    it('should handle file read errors gracefully', async () => {
      jest.spyOn(fs.promises, 'readFile')
        .mockRejectedValue(new Error('EACCES: permission denied'));

      const result = await parseConfig(
        'protected.config.js',
        /pattern/
      );

      expect(result).toBeNull();
    });

    it('should handle invalid regex patterns', async () => {
      const mockContent = 'export default { build: { outDir: "dist" } }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      // Invalid regex should not crash
      const result = await parseConfig(
        'vite.config.js',
        null // Invalid pattern
      );

      expect(result).toBeNull();
    });
  });

  describe('Integration with Config Loaders', () => {
    it('should work with loadViteConfig pattern', async () => {
      const mockContent = 'export default { build: { outDir: "vite-out" } }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'vite.config.js',
        /build\.outDir\s*:\s*['"](.+?)['"]/
      );

      expect(result).toBe('vite-out');
    });

    it('should work with loadWebpackConfig pattern', async () => {
      const mockContent = "output: { path: path.resolve(__dirname, 'wp-dist') }";
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'webpack.config.js',
        /output\.path[^'"]+'(.+?)'/
      );

      expect(result).toBe('wp-dist');
    });

    it('should work with loadNextConfig pattern', async () => {
      const mockContent = 'module.exports = { distDir: ".next-custom" }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'next.config.js',
        /distDir\s*:\s*['"](.+?)['"]/
      );

      expect(result).toBe('.next-custom');
    });

    it('should work with loadNuxtConfig pattern', async () => {
      const mockContent = 'export default { buildDir: ".nuxt-build" }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result = await parseConfig(
        'nuxt.config.js',
        /buildDir\s*:\s*['"](.+?)['"]/
      );

      expect(result).toBe('.nuxt-build');
    });
  });

  describe('State-Based Testing (Chicago School)', () => {
    it('should maintain consistent state across multiple calls', async () => {
      const mockContent = 'export default { build: { outDir: "dist" } }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      const result1 = await parseConfig('config.js', /build\.outDir\s*:\s*['"](.+?)['"]/);
      const result2 = await parseConfig('config.js', /build\.outDir\s*:\s*['"](.+?)['"]/);

      expect(result1).toBe(result2);
      expect(result1).toBe('dist');
    });

    it('should not modify global state', async () => {
      const originalEnv = { ...process.env };
      const mockContent = 'export default { build: { outDir: "dist" } }';
      jest.spyOn(fs.promises, 'readFile').mockResolvedValue(mockContent);

      await parseConfig('config.js', /pattern/);

      expect(process.env).toEqual(originalEnv);
    });
  });
});
