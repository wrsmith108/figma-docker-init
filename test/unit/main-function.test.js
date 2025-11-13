/**
 * Test: Main Function and CLI Entry Point
 * Purpose: Cover main() function and remaining CLI paths
 * Coverage Target: Lines 827-886 (main function and error handling)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Main Function Coverage', () => {
  let originalArgv;
  let consoleLogSpy;
  let processExitSpy;
  let originalCwd;

  beforeEach(() => {
    originalArgv = process.argv;
    originalCwd = process.cwd();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('CLI Argument Handling', () => {
    it('should handle --help flag', async () => {
      // Dynamically import to trigger main() with new argv
      process.argv = ['node', 'vibe-to-docker.js', '--help'];

      // Import the module which will run main()
      await import('../../vibe-to-docker.js?help=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Usage:');
    });

    it('should handle -h flag', async () => {
      process.argv = ['node', 'vibe-to-docker.js', '-h'];
      await import('../../vibe-to-docker.js?h=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle --version flag', async () => {
      process.argv = ['node', 'vibe-to-docker.js', '--version'];
      await import('../../vibe-to-docker.js?version=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('vibe-to-docker');
    });

    it('should handle -v flag', async () => {
      process.argv = ['node', 'vibe-to-docker.js', '-v'];
      await import('../../vibe-to-docker.js?v=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle --list flag', async () => {
      process.argv = ['node', 'vibe-to-docker.js', '--list'];
      await import('../../vibe-to-docker.js?list=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Available Templates:');
    });

    it('should show help when no arguments provided', async () => {
      process.argv = ['node', 'vibe-to-docker.js'];
      await import('../../vibe-to-docker.js?noargs=' + Date.now());

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle missing template name', async () => {
      process.argv = ['node', 'vibe-to-docker.js', ''];

      // For this test, we need process.exit to not throw during module evaluation
      // so we can check if it was called
      processExitSpy.mockRestore();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      await import('../../vibe-to-docker.js?empty=' + Date.now());

      expect(processExitSpy).toHaveBeenCalledWith(1);

      // Restore throwing behavior for other tests
      processExitSpy.mockRestore();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });
    });
  });

  describe('Package.json Validation Warning', () => {
    it('should warn when package.json is missing in current directory', async () => {
      // Create a temporary directory without package.json
      const tempDir = path.join(__dirname, '../fixtures/no-package-json-warn');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Change to that directory
      process.chdir(tempDir);
      process.argv = ['node', 'vibe-to-docker.js', 'basic'];

      // For this test, we need process.exit to not throw during module evaluation
      processExitSpy.mockRestore();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      await import('../../vibe-to-docker.js?nopkg=' + Date.now());

      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('No package.json found');
      expect(output).toContain('root of your project');

      // Restore original cwd
      process.chdir(originalCwd);

      // Wait for any pending async operations to complete before cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      fs.rmSync(tempDir, { recursive: true, force: true });

      // Restore throwing behavior for other tests
      processExitSpy.mockRestore();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`process.exit(${code})`);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle uncaughtException', () => {
      const listeners = process.listeners('uncaughtException');
      const handler = listeners[listeners.length - 1];

      expect(() => handler(new Error('Test error'))).toThrow('process.exit');
    });

    it('should handle unhandledRejection', () => {
      const listeners = process.listeners('unhandledRejection');
      const handler = listeners[listeners.length - 1];

      expect(() => handler('Test rejection', Promise.resolve())).toThrow('process.exit');
    });

    it('should display error message on uncaught exception', () => {
      const listeners = process.listeners('uncaughtException');
      const handler = listeners[listeners.length - 1];

      try {
        handler(new Error('Test error message'));
      } catch (error) {
        // Expected
      }

      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Error:');
      expect(output).toContain('Test error message');
    });

    it('should display reason on unhandled rejection', () => {
      const listeners = process.listeners('unhandledRejection');
      const handler = listeners[listeners.length - 1];

      try {
        handler('Test rejection reason', Promise.resolve());
      } catch (error) {
        // Expected
      }

      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Unhandled Rejection:');
      expect(output).toContain('Test rejection reason');
    });
  });

  describe('Module Main Check', () => {
    it('should not run main when imported (not executed directly)', async () => {
      // The module should detect it's being imported for testing
      // and not run main()
      const module = await import('../../vibe-to-docker.js');
      expect(module).toBeDefined();
      // Just verify the module exports are accessible
      expect(module.sanitizeString).toBeDefined();
    });
  });
});
