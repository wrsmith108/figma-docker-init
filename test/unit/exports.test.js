/**
 * Test: Module Exports Validation
 * Purpose: Verify all 24 functions are properly exported
 * TDD Phase: RED - These tests will FAIL until exports are added
 */

describe('Module Exports', () => {
  let exports;

  beforeEach(() => {
    // Reset module cache to ensure clean imports
    jest.resetModules();
    exports = require('../../index.js');
  });

  describe('Template Management Exports', () => {
    it('should export listTemplates as a function', () => {
      expect(exports.listTemplates).toBeDefined();
      expect(typeof exports.listTemplates).toBe('function');
    });

    it('should export getTemplate as a function', () => {
      expect(exports.getTemplate).toBeDefined();
      expect(typeof exports.getTemplate).toBe('function');
    });

    it('should export validateTemplate as a function', () => {
      expect(exports.validateTemplate).toBeDefined();
      expect(typeof exports.validateTemplate).toBe('function');
    });

    it('should export buildDockerfile as a function', () => {
      expect(exports.buildDockerfile).toBeDefined();
      expect(typeof exports.buildDockerfile).toBe('function');
    });
  });

  describe('Configuration Exports', () => {
    it('should export parseConfig as a function', () => {
      expect(exports.parseConfig).toBeDefined();
      expect(typeof exports.parseConfig).toBe('function');
    });

    it('should export loadViteConfig as a function', () => {
      expect(exports.loadViteConfig).toBeDefined();
      expect(typeof exports.loadViteConfig).toBe('function');
    });

    it('should export loadWebpackConfig as a function', () => {
      expect(exports.loadWebpackConfig).toBeDefined();
      expect(typeof exports.loadWebpackConfig).toBe('function');
    });

    it('should export loadNextConfig as a function', () => {
      expect(exports.loadNextConfig).toBeDefined();
      expect(typeof exports.loadNextConfig).toBe('function');
    });

    it('should export loadNuxtConfig as a function', () => {
      expect(exports.loadNuxtConfig).toBeDefined();
      expect(typeof exports.loadNuxtConfig).toBe('function');
    });
  });

  describe('Docker Operations Exports', () => {
    it('should export generateDockerCompose as a function', () => {
      expect(exports.generateDockerCompose).toBeDefined();
      expect(typeof exports.generateDockerCompose).toBe('function');
    });

    it('should export generateNginxConfig as a function', () => {
      expect(exports.generateNginxConfig).toBeDefined();
      expect(typeof exports.generateNginxConfig).toBe('function');
    });

    it('should export buildImage as a function', () => {
      expect(exports.buildImage).toBeDefined();
      expect(typeof exports.buildImage).toBe('function');
    });

    it('should export runContainer as a function', () => {
      expect(exports.runContainer).toBeDefined();
      expect(typeof exports.runContainer).toBe('function');
    });

    it('should export testContainer as a function', () => {
      expect(exports.testContainer).toBeDefined();
      expect(typeof exports.testContainer).toBe('function');
    });
  });

  describe('Port Management Exports', () => {
    it('should export detectPort as a function', () => {
      expect(exports.detectPort).toBeDefined();
      expect(typeof exports.detectPort).toBe('function');
    });

    it('should export findAvailablePort as a function', () => {
      expect(exports.findAvailablePort).toBeDefined();
      expect(typeof exports.findAvailablePort).toBe('function');
    });

    it('should export isPortAvailable as a function', () => {
      expect(exports.isPortAvailable).toBeDefined();
      expect(typeof exports.isPortAvailable).toBe('function');
    });
  });

  describe('Validation Exports', () => {
    it('should export validateOptions as a function', () => {
      expect(exports.validateOptions).toBeDefined();
      expect(typeof exports.validateOptions).toBe('function');
    });

    it('should export validatePort as a function', () => {
      expect(exports.validatePort).toBeDefined();
      expect(typeof exports.validatePort).toBe('function');
    });

    it('should export validateFramework as a function', () => {
      expect(exports.validateFramework).toBeDefined();
      expect(typeof exports.validateFramework).toBe('function');
    });
  });

  describe('Utility Exports', () => {
    it('should export detectFramework as a function', () => {
      expect(exports.detectFramework).toBeDefined();
      expect(typeof exports.detectFramework).toBe('function');
    });

    it('should export copyProjectFiles as a function', () => {
      expect(exports.copyProjectFiles).toBeDefined();
      expect(typeof exports.copyProjectFiles).toBe('function');
    });

    it('should export executeDockerCommand as a function', () => {
      expect(exports.executeDockerCommand).toBeDefined();
      expect(typeof exports.executeDockerCommand).toBe('function');
    });

    it('should export cleanupContainer as a function', () => {
      expect(exports.cleanupContainer).toBeDefined();
      expect(typeof exports.cleanupContainer).toBe('function');
    });
  });

  describe('Complete Export Count', () => {
    it('should export exactly 24 functions', () => {
      const exportedFunctions = Object.keys(exports).filter(
        key => typeof exports[key] === 'function'
      );
      expect(exportedFunctions).toHaveLength(24);
    });

    it('should not have any undefined exports', () => {
      const undefinedExports = Object.keys(exports).filter(
        key => exports[key] === undefined
      );
      expect(undefinedExports).toHaveLength(0);
    });
  });
});
