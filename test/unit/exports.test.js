/**
 * Test: Module Exports Validation - Phase 1 Implementation
 * Purpose: Verify all Phase 1 functions and error classes are properly exported
 *
 * Phase 1 Scope (v1.1.0):
 * - 23 functions across 6 categories
 * - 2 custom error classes
 * - Total: 25 exports
 *
 * Note: This tests the ACTUAL Phase 1 implementation, not the planned v2.0 API.
 * Functions like buildImage, runContainer, generateDockerCompose, etc. are planned
 * for Phase 2 and Phase 3 of the refactoring.
 */

import * as indexExports from '../../figma-docker-init.js';

describe('Module Exports - Phase 1 Implementation', () => {
  const exports = indexExports;

  // =============================================================================
  // CUSTOM ERROR CLASSES (2 classes)
  // =============================================================================

  describe('Custom Error Classes', () => {
    it('should export ValidationError as a class', () => {
      expect(exports.ValidationError).toBeDefined();
      expect(typeof exports.ValidationError).toBe('function');
      expect(exports.ValidationError.prototype instanceof Error).toBe(true);
    });

    it('should export ConfigError as a class', () => {
      expect(exports.ConfigError).toBeDefined();
      expect(typeof exports.ConfigError).toBe('function');
      expect(exports.ConfigError.prototype instanceof Error).toBe(true);
    });
  });

  // =============================================================================
  // VALIDATION FUNCTIONS (7 functions)
  // =============================================================================

  describe('Validation Functions', () => {
    it('should export sanitizeString as a function', () => {
      expect(exports.sanitizeString).toBeDefined();
      expect(typeof exports.sanitizeString).toBe('function');
    });

    it('should export validateTemplateName as a function', () => {
      expect(exports.validateTemplateName).toBeDefined();
      expect(typeof exports.validateTemplateName).toBe('function');
    });

    it('should export validateProjectDirectory as a function', () => {
      expect(exports.validateProjectDirectory).toBeDefined();
      expect(typeof exports.validateProjectDirectory).toBe('function');
    });

    it('should export validatePort as a function', () => {
      expect(exports.validatePort).toBeDefined();
      expect(typeof exports.validatePort).toBe('function');
    });

    it('should export validateProjectName as a function', () => {
      expect(exports.validateProjectName).toBeDefined();
      expect(typeof exports.validateProjectName).toBe('function');
    });

    it('should export sanitizeTemplateVariable as a function', () => {
      expect(exports.sanitizeTemplateVariable).toBeDefined();
      expect(typeof exports.sanitizeTemplateVariable).toBe('function');
    });

    it('should export validateFilePath as a function', () => {
      expect(exports.validateFilePath).toBeDefined();
      expect(typeof exports.validateFilePath).toBe('function');
    });
  });

  // =============================================================================
  // CONFIG PARSING FUNCTIONS (6 functions)
  // =============================================================================

  describe('Config Parsing Functions', () => {
    it('should export parseConfig as a function', () => {
      expect(exports.parseConfig).toBeDefined();
      expect(typeof exports.parseConfig).toBe('function');
    });

    it('should export parseViteConfig as a function', () => {
      expect(exports.parseViteConfig).toBeDefined();
      expect(typeof exports.parseViteConfig).toBe('function');
    });

    it('should export parseRollupConfig as a function', () => {
      expect(exports.parseRollupConfig).toBeDefined();
      expect(typeof exports.parseRollupConfig).toBe('function');
    });

    it('should export parseWebpackConfig as a function', () => {
      expect(exports.parseWebpackConfig).toBeDefined();
      expect(typeof exports.parseWebpackConfig).toBe('function');
    });

    it('should export detectBuildOutputDir as a function', () => {
      expect(exports.detectBuildOutputDir).toBeDefined();
      expect(typeof exports.detectBuildOutputDir).toBe('function');
    });

    it('should export detectProjectValues as a function', () => {
      expect(exports.detectProjectValues).toBeDefined();
      expect(typeof exports.detectProjectValues).toBe('function');
    });
  });

  // =============================================================================
  // TEMPLATE PROCESSING FUNCTIONS (3 functions)
  // =============================================================================

  describe('Template Processing Functions', () => {
    it('should export validateTemplate as a function', () => {
      expect(exports.validateTemplate).toBeDefined();
      expect(typeof exports.validateTemplate).toBe('function');
    });

    it('should export checkBuildCompatibility as a function', () => {
      expect(exports.checkBuildCompatibility).toBeDefined();
      expect(typeof exports.checkBuildCompatibility).toBe('function');
    });

    it('should export replaceTemplateVariables as a function', () => {
      expect(exports.replaceTemplateVariables).toBeDefined();
      expect(typeof exports.replaceTemplateVariables).toBe('function');
    });
  });

  // =============================================================================
  // PORT MANAGEMENT FUNCTIONS (3 functions)
  // =============================================================================

  describe('Port Management Functions', () => {
    it('should export checkPortAvailability as a function', () => {
      expect(exports.checkPortAvailability).toBeDefined();
      expect(typeof exports.checkPortAvailability).toBe('function');
    });

    it('should export findAvailablePort as a function', () => {
      expect(exports.findAvailablePort).toBeDefined();
      expect(typeof exports.findAvailablePort).toBe('function');
    });

    it('should export assignDynamicPorts as a function', () => {
      expect(exports.assignDynamicPorts).toBeDefined();
      expect(typeof exports.assignDynamicPorts).toBe('function');
    });
  });

  // =============================================================================
  // CLI INTERFACE FUNCTIONS (3 functions)
  // =============================================================================

  describe('CLI Interface Functions', () => {
    it('should export showHelp as a function', () => {
      expect(exports.showHelp).toBeDefined();
      expect(typeof exports.showHelp).toBe('function');
    });

    it('should export showVersion as a function', () => {
      expect(exports.showVersion).toBeDefined();
      expect(typeof exports.showVersion).toBe('function');
    });

    it('should export listTemplates as a function', () => {
      expect(exports.listTemplates).toBeDefined();
      expect(typeof exports.listTemplates).toBe('function');
    });
  });

  // =============================================================================
  // MAIN LOGIC FUNCTIONS (1 function)
  // =============================================================================

  describe('Main Logic Functions', () => {
    it('should export copyTemplate as a function', () => {
      expect(exports.copyTemplate).toBeDefined();
      expect(typeof exports.copyTemplate).toBe('function');
    });
  });

  // =============================================================================
  // COMPLETE EXPORT COUNT VALIDATION
  // =============================================================================

  describe('Complete Export Count - Phase 1', () => {
    it('should export exactly 23 functions', () => {
      const exportedFunctions = Object.keys(exports).filter(
        key => typeof exports[key] === 'function' &&
               key !== 'ValidationError' &&
               key !== 'ConfigError'
      );
      expect(exportedFunctions).toHaveLength(23);
    });

    it('should export exactly 2 error classes', () => {
      const errorClasses = Object.keys(exports).filter(
        key => (key === 'ValidationError' || key === 'ConfigError') &&
               typeof exports[key] === 'function'
      );
      expect(errorClasses).toHaveLength(2);
    });

    it('should have exactly 25 total exports (23 functions + 2 classes)', () => {
      const allExports = Object.keys(exports);
      expect(allExports).toHaveLength(25);
    });

    it('should not have any undefined exports', () => {
      const undefinedExports = Object.keys(exports).filter(
        key => exports[key] === undefined
      );
      expect(undefinedExports).toHaveLength(0);
    });

    it('should export all expected Phase 1 functions by name', () => {
      const expectedExports = [
        // Error classes (2)
        'ValidationError', 'ConfigError',

        // Validation functions (7)
        'sanitizeString', 'validateTemplateName', 'validateProjectDirectory',
        'validatePort', 'validateProjectName', 'sanitizeTemplateVariable',
        'validateFilePath',

        // Config parsing functions (6)
        'parseConfig', 'parseViteConfig', 'parseRollupConfig',
        'parseWebpackConfig', 'detectBuildOutputDir', 'detectProjectValues',

        // Template processing functions (3)
        'validateTemplate', 'checkBuildCompatibility', 'replaceTemplateVariables',

        // Port management functions (3)
        'checkPortAvailability', 'findAvailablePort', 'assignDynamicPorts',

        // CLI interface functions (3)
        'showHelp', 'showVersion', 'listTemplates',

        // Main logic functions (1)
        'copyTemplate'
      ];

      expectedExports.forEach(exportName => {
        expect(exports[exportName]).toBeDefined();
      });

      expect(Object.keys(exports).sort()).toEqual(expectedExports.sort());
    });
  });
});
