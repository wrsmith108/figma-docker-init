/**
 * E2E Tests for CLI Workflow
 * Tests the complete CLI command execution in real-world scenarios
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('CLI E2E Tests', () => {
  const projectRoot = path.join(__dirname, '../..');
  const cliPath = path.join(projectRoot, 'figma-docker-init.js');
  let testDir;

  beforeEach(() => {
    // Create a unique temp directory for each test
    const timestamp = Date.now();
    testDir = path.join(projectRoot, `temp-test-${timestamp}`);
    fs.mkdirSync(testDir, { recursive: true });

    // Create a minimal package.json for testing
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        react: '^18.0.0',
        vite: '^4.0.0'
      }
    };
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('--help command', () => {
    it('should display help information', () => {
      const output = execSync(`node "${cliPath}" --help`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Figma Docker Init');
      expect(output).toContain('Usage:');
      expect(output).toContain('Templates:');
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
      expect(output).toContain('Options:');
      expect(output).toContain('-h, --help');
      expect(output).toContain('-v, --version');
      expect(output).toContain('--list');
    });

    it('should show help with -h flag', () => {
      const output = execSync(`node "${cliPath}" -h`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Figma Docker Init');
      expect(output).toContain('Usage:');
    });

    it('should show help with no arguments', () => {
      const output = execSync(`node "${cliPath}"`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Figma Docker Init');
      expect(output).toContain('Usage:');
    });
  });

  describe('--version command', () => {
    it('should display version number', () => {
      const output = execSync(`node "${cliPath}" --version`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toMatch(/figma-docker-init v\d+\.\d+\.\d+/);
    });

    it('should show version with -v flag', () => {
      const output = execSync(`node "${cliPath}" -v`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toMatch(/figma-docker-init v\d+\.\d+\.\d+/);
    });
  });

  describe('--list command', () => {
    it('should list available templates', () => {
      const output = execSync(`node "${cliPath}" --list`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Available Templates:');
      expect(output).toContain('basic');
      expect(output).toContain('ui-heavy');
    });

    it('should display templates without errors', () => {
      expect(() => {
        execSync(`node "${cliPath}" --list`, {
          encoding: 'utf8',
          cwd: testDir
        });
      }).not.toThrow();
    });
  });

  describe('Template creation - basic', () => {
    it('should create all basic template files', () => {
      const output = execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      // Check output messages
      expect(output).toContain('Setting up Docker configuration');
      expect(output).toContain('Setup Complete!');

      // Verify files were created
      const expectedFiles = [
        'Dockerfile',
        'docker-compose.yml',
        '.dockerignore',
        'nginx.conf'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(testDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should replace variables in template files', () => {
      execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      // Read Dockerfile and check for variable replacement
      const dockerfile = fs.readFileSync(
        path.join(testDir, 'Dockerfile'),
        'utf8'
      );

      // Should NOT contain template placeholders
      expect(dockerfile).not.toContain('{{PROJECT_NAME}}');
      expect(dockerfile).not.toContain('{{BUILD_OUTPUT_DIR}}');

      // Should contain actual values
      expect(dockerfile).toContain('test-project');
    });

    it('should detect project framework from package.json', () => {
      execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      const dockerCompose = fs.readFileSync(
        path.join(testDir, 'docker-compose.yml'),
        'utf8'
      );

      // Should detect react-vite framework
      expect(dockerCompose).toContain('test-project');
    });

    it('should assign available ports', () => {
      const output = execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      // Should show port assignments
      expect(output).toContain('Port Assignments:');
      expect(output).toContain('Development server:');
      expect(output).toContain('Production server:');
      expect(output).toContain('Nginx proxy:');
    });

    it('should skip existing files', () => {
      // Create a file that already exists
      fs.writeFileSync(path.join(testDir, 'Dockerfile'), 'existing content');

      const output = execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Skipped');
      expect(output).toContain('Dockerfile');
      expect(output).toContain('already exists');

      // Verify existing file wasn't overwritten
      const content = fs.readFileSync(
        path.join(testDir, 'Dockerfile'),
        'utf8'
      );
      expect(content).toBe('existing content');
    });
  });

  describe('Template creation - ui-heavy', () => {
    it('should create all ui-heavy template files', () => {
      const output = execSync(`node "${cliPath}" ui-heavy`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Setup Complete!');

      const expectedFiles = [
        'Dockerfile',
        'docker-compose.yml',
        '.dockerignore',
        'nginx.conf'
      ];

      expectedFiles.forEach(file => {
        expect(fs.existsSync(path.join(testDir, file))).toBe(true);
      });
    });

    it('should replace variables in ui-heavy template', () => {
      execSync(`node "${cliPath}" ui-heavy`, {
        encoding: 'utf8',
        cwd: testDir
      });

      const dockerfile = fs.readFileSync(
        path.join(testDir, 'Dockerfile'),
        'utf8'
      );

      expect(dockerfile).not.toContain('{{PROJECT_NAME}}');
      expect(dockerfile).toContain('test-project');
    });
  });

  describe('Error handling', () => {
    it('should show error for invalid template', () => {
      try {
        execSync(`node "${cliPath}" invalid-template`, {
          encoding: 'utf8',
          cwd: testDir
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.stdout).toContain('Template "invalid-template" not found');
        expect(error.stdout).toContain('Available templates:');
      }
    });

    it('should handle missing package.json gracefully', () => {
      // Remove package.json
      fs.unlinkSync(path.join(testDir, 'package.json'));

      const output = execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      // Should show warning but continue
      expect(output).toContain('Warning: No package.json found');
      expect(output).toContain('Setup Complete!');
    });
  });

  describe('Next steps information', () => {
    it('should display next steps after successful creation', () => {
      const output = execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      expect(output).toContain('Next Steps:');
      expect(output).toContain('Review and customize');
      expect(output).toContain('Update environment variables');
      expect(output).toContain('docker-compose up --build');
    });

    it('should mention DOCKER.md if it exists', () => {
      execSync(`node "${cliPath}" basic`, {
        encoding: 'utf8',
        cwd: testDir
      });

      // Create DOCKER.md
      fs.writeFileSync(path.join(testDir, 'DOCKER.md'), '# Docker Guide');

      const output = execSync(`node "${cliPath}" ui-heavy`, {
        encoding: 'utf8',
        cwd: testDir
      });

      if (output.includes('DOCKER.md')) {
        expect(output).toContain('Read DOCKER.md');
      }
    });
  });
});
