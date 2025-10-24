/**
 * Test: CLI Interface Functions
 * Purpose: Test showHelp, showVersion, listTemplates
 * Coverage Target: Lines 606-666 (~60 lines)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import {
  showHelp,
  showVersion,
  listTemplates
} from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI Interface Functions', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // =============================================================================
  // showHelp
  // =============================================================================
  describe('showHelp', () => {
    it('should display help information', () => {
      showHelp();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should display usage instructions', () => {
      showHelp();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Usage:');
      expect(output).toContain('figma-docker-init');
    });

    it('should list available templates', () => {
      showHelp();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Templates:');
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
    });

    it('should list available options', () => {
      showHelp();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Options:');
      expect(output).toContain('--help');
      expect(output).toContain('--version');
      expect(output).toContain('--list');
    });

    it('should include examples', () => {
      showHelp();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Examples:');
    });

    it('should not throw errors', () => {
      expect(() => showHelp()).not.toThrow();
    });
  });

  // =============================================================================
  // showVersion
  // =============================================================================
  describe('showVersion', () => {
    it('should display version from package.json', () => {
      showVersion();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('figma-docker-init');
      expect(output).toMatch(/v\d+\.\d+\.\d+/); // Should match semantic version
    });

    it('should handle missing package.json gracefully', () => {
      // Mock fs.existsSync to return false
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      showVersion();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('figma-docker-init v1.0.0'); // Default version

      existsSyncSpy.mockRestore();
    });

    it('should not throw errors', () => {
      expect(() => showVersion()).not.toThrow();
    });
  });

  // =============================================================================
  // listTemplates
  // =============================================================================
  describe('listTemplates', () => {
    const templatesDir = path.join(__dirname, '../../templates');

    it('should list available templates', () => {
      listTemplates();
      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Available Templates:');
    });

    it('should display basic template', () => {
      listTemplates();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('basic');
    });

    it('should display ui-heavy template', () => {
      listTemplates();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('ui-heavy');
    });

    it('should handle missing templates directory', () => {
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      listTemplates();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Templates directory not found');

      existsSyncSpy.mockRestore();
    });

    it('should handle empty templates directory', () => {
      const readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      listTemplates();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('No templates available');

      readdirSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
    });

    it('should filter out files (only show directories)', () => {
      const mockItems = ['basic', 'ui-heavy', 'README.md', 'file.txt'];
      const readdirSyncSpy = jest.spyOn(fs, 'readdirSync').mockReturnValue(mockItems);
      const statSyncSpy = jest.spyOn(fs, 'statSync').mockImplementation((itemPath) => ({
        isDirectory: () => {
          const item = path.basename(itemPath);
          return item === 'basic' || item === 'ui-heavy';
        }
      }));

      listTemplates();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
      expect(output).not.toContain('README.md');
      expect(output).not.toContain('file.txt');

      readdirSyncSpy.mockRestore();
      statSyncSpy.mockRestore();
    });

    it('should not throw errors', () => {
      expect(() => listTemplates()).not.toThrow();
    });
  });
});
