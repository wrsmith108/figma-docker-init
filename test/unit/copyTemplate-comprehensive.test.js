/**
 * Test: copyTemplate Comprehensive Coverage
 * Purpose: Cover remaining lines in copyTemplate and CLI functions
 * Coverage Target: Lines 696-822 (copyTemplate), 606-666 (CLI)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';
import {
  copyTemplate,
  showHelp,
  showVersion,
  listTemplates
} from '../../figma-docker-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, '../fixtures/copyTemplate-tests');
const templatesDir = path.join(__dirname, '../../templates');

describe('copyTemplate Comprehensive Coverage', () => {
  let consoleLogSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });

    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true });
    }
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  afterAll(() => {
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }
  });

  describe('Success Paths - File Operations', () => {
    it('should display setup message', async () => {
      const targetDir = path.join(fixturesDir, 'setup-message');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'setup-msg-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'test.txt'), 'Content');

      await copyTemplate('setup-msg-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Setting up Docker configuration');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should display port assignments', async () => {
      const targetDir = path.join(fixturesDir, 'port-display');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'port-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'docker-compose.yml'), 'ports: {{DEV_PORT}}');

      await copyTemplate('port-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Port Assignments:');
      expect(output).toContain('Development server:');
      expect(output).toContain('Production server:');
      expect(output).toContain('Nginx proxy:');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should display next steps', async () => {
      const targetDir = path.join(fixturesDir, 'next-steps');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'next-steps-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'Dockerfile'), 'FROM node:18');

      await copyTemplate('next-steps-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Next Steps:');
      expect(output).toContain('docker-compose up --build');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should mention DOCKER.md if it exists', async () => {
      const targetDir = path.join(fixturesDir, 'docker-md');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'docker-md-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'DOCKER.md'), '# Docker Guide');

      await copyTemplate('docker-md-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Read DOCKER.md');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should display skipped files message', async () => {
      const targetDir = path.join(fixturesDir, 'skipped-files');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );
      fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'Existing content');

      const templateDir = path.join(templatesDir, 'skipped-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'existing.txt'), 'New content');

      await copyTemplate('skipped-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('files were skipped');
      expect(output).toContain('already exist');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should count created and skipped files correctly', async () => {
      const targetDir = path.join(fixturesDir, 'file-counts');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );
      fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'Existing');

      const templateDir = path.join(templatesDir, 'counts-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'new.txt'), 'New');
      fs.writeFileSync(path.join(templateDir, 'existing.txt'), 'Updated');

      await copyTemplate('counts-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Files created: 1');
      expect(output).toContain('Files skipped: 1');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });
  });

  describe('Error Paths - File Operations', () => {
    it('should handle template read errors', async () => {
      const targetDir = path.join(fixturesDir, 'read-error');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'read-error-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'test.txt'), 'Content');

      // Mock readFileSync to fail
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn((filePath, encoding) => {
        if (filePath.includes('test.txt') && !filePath.includes('package.json')) {
          throw new Error('Read permission denied');
        }
        return originalReadFileSync(filePath, encoding);
      });

      await expect(copyTemplate('read-error-template', targetDir)).rejects.toThrow('process.exit');

      fs.readFileSync = originalReadFileSync;
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should handle template write errors', async () => {
      const targetDir = path.join(fixturesDir, 'write-error');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'write-error-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'test.txt'), 'Content');

      // Mock writeFileSync to fail
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn((filePath, content) => {
        if (filePath.includes('test.txt') && filePath.includes('write-error')) {
          throw new Error('Write permission denied');
        }
        return originalWriteFileSync(filePath, content);
      });

      await expect(copyTemplate('write-error-template', targetDir)).rejects.toThrow('process.exit');

      fs.writeFileSync = originalWriteFileSync;
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should handle file validation errors during processing', async () => {
      const targetDir = path.join(fixturesDir, 'validation-error');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'validation-error-template');
      fs.mkdirSync(templateDir, { recursive: true });
      // Create a file that will cause validation issues during processing
      fs.writeFileSync(path.join(templateDir, '../../../etc/passwd'), 'hack');

      await expect(copyTemplate('validation-error-template', targetDir)).rejects.toThrow();

      fs.rmSync(targetDir, { recursive: true, force: true });
      try {
        fs.rmSync(templateDir, { recursive: true, force: true });
      } catch (e) { /* ignore */ }
    });
  });

  describe('Build Compatibility Warnings', () => {
    it('should display build compatibility warnings when present', async () => {
      const targetDir = path.join(fixturesDir, 'compat-warnings');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({
          name: 'test-app',
          dependencies: { vite: '^4.0.0' }
        })
      );
      // No vite.config.js = no build output detected = warning

      const templateDir = path.join(templatesDir, 'compat-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'Dockerfile'), 'FROM node:18');

      await copyTemplate('compat-template', targetDir);

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('Build compatibility warnings:');
      expect(output).toContain('Vite framework');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });
  });

  describe('Template Directory Read Errors', () => {
    it('should handle errors reading template directory', async () => {
      const targetDir = path.join(fixturesDir, 'dir-read-error');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'dir-error-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'test.txt'), 'Content');

      // Mock readdirSync to fail
      const originalReaddirSync = fs.readdirSync;
      let callCount = 0;
      fs.readdirSync = jest.fn((dirPath) => {
        callCount++;
        // Fail on the second call (template directory, not templates directory)
        if (callCount === 2 && dirPath.includes('dir-error-template')) {
          throw new Error('Permission denied');
        }
        return originalReaddirSync(dirPath);
      });

      await expect(copyTemplate('dir-error-template', targetDir)).rejects.toThrow();

      fs.readdirSync = originalReaddirSync;
      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });
  });

  describe('CLI Functions Additional Coverage', () => {
    it('showHelp should include all sections', () => {
      showHelp();
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

      expect(output).toContain('Figma Docker Init');
      expect(output).toContain('Usage:');
      expect(output).toContain('Templates:');
      expect(output).toContain('Options:');
      expect(output).toContain('Examples:');
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
    });

    it('showVersion should read from package.json when available', () => {
      showVersion();
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('figma-docker-init');
      expect(output).toMatch(/v\d+\.\d+\.\d+/);
    });

    it('listTemplates should filter directories correctly', () => {
      listTemplates();
      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

      expect(output).toContain('Available Templates:');
      // Should show actual template directories
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
    });
  });

  describe('Error Message Display', () => {
    it('should display validation errors in red', async () => {
      const targetDir = path.join(fixturesDir, 'validation-display');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const templateDir = path.join(templatesDir, 'validation-display-template');
      fs.mkdirSync(templateDir, { recursive: true });
      fs.writeFileSync(path.join(templateDir, 'bad.txt'), 'Unclosed {{BRACE');

      await expect(copyTemplate('validation-display-template', targetDir)).rejects.toThrow('process.exit');

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('validation errors');

      fs.rmSync(targetDir, { recursive: true, force: true });
      fs.rmSync(templateDir, { recursive: true, force: true });
    });

    it('should display available templates when template not found', async () => {
      const targetDir = path.join(fixturesDir, 'not-found-display');
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      await expect(copyTemplate('non-existent-xyz', targetDir)).rejects.toThrow('process.exit');

      const output = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');
      expect(output).toContain('not found');
      expect(output).toContain('Available templates');

      fs.rmSync(targetDir, { recursive: true, force: true });
    });
  });
});
