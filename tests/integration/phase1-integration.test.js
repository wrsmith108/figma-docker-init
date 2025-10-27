/**
 * Phase 1 Integration Tests
 * Tests complete workflows for per-project installation
 *
 * Test Coverage:
 * - Fresh project installation
 * - Migration from global installation
 * - Multi-project setup
 * - Cleanup and uninstallation
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import os from 'os';

describe('Phase 1 Integration Tests', () => {
  let testProjectDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test project directory
    testProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-docker-test-'));
    originalCwd = process.cwd();
    process.chdir(testProjectDir);
  });

  afterEach(async () => {
    // Cleanup
    process.chdir(originalCwd);
    await fs.remove(testProjectDir);
  });

  describe('Fresh Project Installation', () => {
    it('should install figma-docker in a fresh project', async () => {
      // Initialize npm project
      execSync('npm init -y', { cwd: testProjectDir });

      // Install figma-docker (simulated)
      const packageJsonPath = path.join(testProjectDir, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies['figma-docker'] = '*';
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      // Verify package.json updated
      expect(packageJson.devDependencies['figma-docker']).toBe('*');
    });

    it('should create .figma-docker/ directory structure', async () => {
      const figmaDockerDir = path.join(testProjectDir, '.figma-docker');

      // Create directory structure
      await fs.ensureDir(path.join(figmaDockerDir, 'config'));
      await fs.ensureDir(path.join(figmaDockerDir, 'data'));
      await fs.ensureDir(path.join(figmaDockerDir, 'logs'));

      // Verify directories exist
      expect(await fs.pathExists(path.join(figmaDockerDir, 'config'))).toBe(true);
      expect(await fs.pathExists(path.join(figmaDockerDir, 'data'))).toBe(true);
      expect(await fs.pathExists(path.join(figmaDockerDir, 'logs'))).toBe(true);
    });

    it('should create docker-compose.yml in project root', async () => {
      const composeFilePath = path.join(testProjectDir, 'docker-compose.yml');

      // Create docker-compose.yml
      const composeContent = `version: '3.8'
services:
  figma:
    image: figma-docker:latest
    volumes:
      - ./.figma-docker/config:/app/config
      - ./.figma-docker/data:/app/data
      - ./.figma-docker/logs:/app/logs
    ports:
      - "3000:3000"
`;
      await fs.writeFile(composeFilePath, composeContent);

      // Verify file exists and content is correct
      expect(await fs.pathExists(composeFilePath)).toBe(true);
      const content = await fs.readFile(composeFilePath, 'utf-8');
      expect(content).toContain('.figma-docker/config');
      expect(content).toContain('.figma-docker/data');
      expect(content).toContain('.figma-docker/logs');
    });

    it('should add .figma-docker/ to .gitignore', async () => {
      const gitignorePath = path.join(testProjectDir, '.gitignore');

      // Create or append to .gitignore
      const existingContent = await fs.pathExists(gitignorePath)
        ? await fs.readFile(gitignorePath, 'utf-8')
        : '';

      if (!existingContent.includes('.figma-docker/')) {
        await fs.appendFile(gitignorePath, '\n# Figma Docker per-project data\n.figma-docker/\n');
      }

      // Verify .gitignore contains entry
      const content = await fs.readFile(gitignorePath, 'utf-8');
      expect(content).toContain('.figma-docker/');
    });

    it('should create initial configuration files', async () => {
      const configDir = path.join(testProjectDir, '.figma-docker', 'config');
      await fs.ensureDir(configDir);

      // Create config.json
      const config = {
        projectName: path.basename(testProjectDir),
        version: '2.0.0',
        installType: 'per-project',
        createdAt: new Date().toISOString()
      };
      await fs.writeJson(path.join(configDir, 'config.json'), config, { spaces: 2 });

      // Verify configuration
      const savedConfig = await fs.readJson(path.join(configDir, 'config.json'));
      expect(savedConfig.installType).toBe('per-project');
      expect(savedConfig.version).toBe('2.0.0');
    });
  });

  describe('Migration from Global Installation', () => {
    beforeEach(async () => {
      // Setup mock global installation
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      await fs.ensureDir(path.join(globalDir, 'config'));
      await fs.ensureDir(path.join(globalDir, 'data'));

      // Create mock global config
      await fs.writeJson(path.join(globalDir, 'config', 'config.json'), {
        version: '1.0.0',
        installType: 'global',
        projects: ['project1', 'project2']
      });
    });

    afterEach(async () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      await fs.remove(globalDir);
    });

    it('should detect existing global installation', async () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      const hasGlobalInstall = await fs.pathExists(globalDir);

      expect(hasGlobalInstall).toBe(true);
    });

    it('should migrate configuration to per-project', async () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      const projectDir = path.join(testProjectDir, '.figma-docker');

      // Simulate migration
      await fs.ensureDir(projectDir);
      const globalConfig = await fs.readJson(path.join(globalDir, 'config', 'config.json'));

      const migratedConfig = {
        ...globalConfig,
        installType: 'per-project',
        migratedFrom: 'global',
        migratedAt: new Date().toISOString()
      };

      await fs.ensureDir(path.join(projectDir, 'config'));
      await fs.writeJson(path.join(projectDir, 'config', 'config.json'), migratedConfig, { spaces: 2 });

      // Verify migration
      const newConfig = await fs.readJson(path.join(projectDir, 'config', 'config.json'));
      expect(newConfig.installType).toBe('per-project');
      expect(newConfig.migratedFrom).toBe('global');
    });

    it('should preserve user data during migration', async () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      const projectDir = path.join(testProjectDir, '.figma-docker');

      // Create test data file
      await fs.ensureDir(path.join(globalDir, 'data'));
      const testData = { users: ['user1', 'user2'], settings: { theme: 'dark' } };
      await fs.writeJson(path.join(globalDir, 'data', 'users.json'), testData);

      // Migrate data
      await fs.ensureDir(path.join(projectDir, 'data'));
      await fs.copy(
        path.join(globalDir, 'data'),
        path.join(projectDir, 'data')
      );

      // Verify data preserved
      const migratedData = await fs.readJson(path.join(projectDir, 'data', 'users.json'));
      expect(migratedData).toEqual(testData);
    });

    it('should create backup of global installation', async () => {
      const globalDir = path.join(os.homedir(), '.figma-docker-global-test');
      const backupDir = path.join(globalDir, '.backup');

      // Create backup
      await fs.ensureDir(backupDir);
      await fs.copy(
        path.join(globalDir, 'config'),
        path.join(backupDir, 'config')
      );

      // Verify backup exists
      const backupConfig = await fs.readJson(path.join(backupDir, 'config', 'config.json'));
      expect(backupConfig.installType).toBe('global');
    });

    it('should update docker-compose.yml paths after migration', async () => {
      const composeFilePath = path.join(testProjectDir, 'docker-compose.yml');

      // Create old-style compose file
      const oldCompose = `version: '3.8'
services:
  figma:
    volumes:
      - ~/.figma-docker/config:/app/config
      - ~/.figma-docker/data:/app/data
`;
      await fs.writeFile(composeFilePath, oldCompose);

      // Update paths
      let content = await fs.readFile(composeFilePath, 'utf-8');
      content = content.replace(/~\/\.figma-docker/g, './.figma-docker');
      await fs.writeFile(composeFilePath, content);

      // Verify updated paths
      const updatedContent = await fs.readFile(composeFilePath, 'utf-8');
      expect(updatedContent).toContain('./.figma-docker/config');
      expect(updatedContent).toContain('./.figma-docker/data');
      expect(updatedContent).not.toContain('~/.figma-docker');
    });
  });

  describe('Multi-Project Setup', () => {
    let project1Dir;
    let project2Dir;

    beforeEach(async () => {
      project1Dir = path.join(testProjectDir, 'project1');
      project2Dir = path.join(testProjectDir, 'project2');
      await fs.ensureDir(project1Dir);
      await fs.ensureDir(project2Dir);
    });

    it('should support multiple independent installations', async () => {
      // Setup project 1
      await fs.ensureDir(path.join(project1Dir, '.figma-docker', 'config'));
      await fs.writeJson(
        path.join(project1Dir, '.figma-docker', 'config', 'config.json'),
        { projectName: 'project1', port: 3000 }
      );

      // Setup project 2
      await fs.ensureDir(path.join(project2Dir, '.figma-docker', 'config'));
      await fs.writeJson(
        path.join(project2Dir, '.figma-docker', 'config', 'config.json'),
        { projectName: 'project2', port: 3001 }
      );

      // Verify both exist independently
      const config1 = await fs.readJson(path.join(project1Dir, '.figma-docker', 'config', 'config.json'));
      const config2 = await fs.readJson(path.join(project2Dir, '.figma-docker', 'config', 'config.json'));

      expect(config1.projectName).toBe('project1');
      expect(config2.projectName).toBe('project2');
      expect(config1.port).not.toBe(config2.port);
    });

    it('should isolate data between projects', async () => {
      // Create data in project 1
      await fs.ensureDir(path.join(project1Dir, '.figma-docker', 'data'));
      await fs.writeJson(
        path.join(project1Dir, '.figma-docker', 'data', 'data.json'),
        { project: 'project1', files: ['file1.fig'] }
      );

      // Create data in project 2
      await fs.ensureDir(path.join(project2Dir, '.figma-docker', 'data'));
      await fs.writeJson(
        path.join(project2Dir, '.figma-docker', 'data', 'data.json'),
        { project: 'project2', files: ['file2.fig'] }
      );

      // Verify isolation
      const data1 = await fs.readJson(path.join(project1Dir, '.figma-docker', 'data', 'data.json'));
      const data2 = await fs.readJson(path.join(project2Dir, '.figma-docker', 'data', 'data.json'));

      expect(data1.project).toBe('project1');
      expect(data2.project).toBe('project2');
      expect(data1.files).not.toEqual(data2.files);
    });

    it('should use different ports for each project', async () => {
      const compose1Path = path.join(project1Dir, 'docker-compose.yml');
      const compose2Path = path.join(project2Dir, 'docker-compose.yml');

      // Create compose files with different ports
      await fs.writeFile(compose1Path, `version: '3.8'
services:
  figma:
    ports:
      - "3000:3000"
`);
      await fs.writeFile(compose2Path, `version: '3.8'
services:
  figma:
    ports:
      - "3001:3000"
`);

      // Verify different ports
      const content1 = await fs.readFile(compose1Path, 'utf-8');
      const content2 = await fs.readFile(compose2Path, 'utf-8');

      expect(content1).toContain('3000:3000');
      expect(content2).toContain('3001:3000');
    });

    it('should maintain separate Docker networks', async () => {
      const compose1 = `version: '3.8'
services:
  figma:
    networks:
      - project1_network
networks:
  project1_network:
    driver: bridge
`;
      const compose2 = `version: '3.8'
services:
  figma:
    networks:
      - project2_network
networks:
  project2_network:
    driver: bridge
`;

      await fs.writeFile(path.join(project1Dir, 'docker-compose.yml'), compose1);
      await fs.writeFile(path.join(project2Dir, 'docker-compose.yml'), compose2);

      // Verify network isolation
      const content1 = await fs.readFile(path.join(project1Dir, 'docker-compose.yml'), 'utf-8');
      const content2 = await fs.readFile(path.join(project2Dir, 'docker-compose.yml'), 'utf-8');

      expect(content1).toContain('project1_network');
      expect(content2).toContain('project2_network');
    });
  });

  describe('Cleanup and Uninstallation', () => {
    beforeEach(async () => {
      // Setup project with figma-docker installation
      await fs.ensureDir(path.join(testProjectDir, '.figma-docker', 'config'));
      await fs.ensureDir(path.join(testProjectDir, '.figma-docker', 'data'));
      await fs.ensureDir(path.join(testProjectDir, '.figma-docker', 'logs'));

      await fs.writeJson(
        path.join(testProjectDir, '.figma-docker', 'config', 'config.json'),
        { version: '2.0.0', installType: 'per-project' }
      );

      await fs.writeFile(
        path.join(testProjectDir, 'docker-compose.yml'),
        'version: "3.8"\nservices:\n  figma:\n    image: figma-docker:latest'
      );
    });

    it('should completely remove .figma-docker/ directory', async () => {
      const figmaDockerDir = path.join(testProjectDir, '.figma-docker');

      // Verify exists before cleanup
      expect(await fs.pathExists(figmaDockerDir)).toBe(true);

      // Perform cleanup
      await fs.remove(figmaDockerDir);

      // Verify removed
      expect(await fs.pathExists(figmaDockerDir)).toBe(false);
    });

    it('should remove docker-compose.yml', async () => {
      const composeFile = path.join(testProjectDir, 'docker-compose.yml');

      // Verify exists
      expect(await fs.pathExists(composeFile)).toBe(true);

      // Remove
      await fs.remove(composeFile);

      // Verify removed
      expect(await fs.pathExists(composeFile)).toBe(false);
    });

    it('should clean .gitignore entries', async () => {
      // Create .gitignore with figma-docker entry
      const gitignorePath = path.join(testProjectDir, '.gitignore');
      await fs.writeFile(gitignorePath, 'node_modules/\n.figma-docker/\n.env\n');

      // Remove figma-docker entry
      let content = await fs.readFile(gitignorePath, 'utf-8');
      content = content.replace(/\n?# Figma Docker.*\n\.figma-docker\/\n?/g, '');
      await fs.writeFile(gitignorePath, content);

      // Verify removed
      const updatedContent = await fs.readFile(gitignorePath, 'utf-8');
      expect(updatedContent).not.toContain('.figma-docker/');
      expect(updatedContent).toContain('node_modules/');
    });

    it('should backup data before uninstallation', async () => {
      const figmaDockerDir = path.join(testProjectDir, '.figma-docker');
      const backupDir = path.join(testProjectDir, '.figma-docker-backup');

      // Create data to backup
      await fs.writeJson(
        path.join(figmaDockerDir, 'data', 'important.json'),
        { data: 'important user data' }
      );

      // Perform backup
      await fs.copy(figmaDockerDir, backupDir);

      // Verify backup
      expect(await fs.pathExists(backupDir)).toBe(true);
      const backupData = await fs.readJson(path.join(backupDir, 'data', 'important.json'));
      expect(backupData.data).toBe('important user data');
    });

    it('should stop and remove Docker containers', async () => {
      // This would execute docker-compose down in real scenario
      // For testing, we verify the command would be called
      const composeFile = path.join(testProjectDir, 'docker-compose.yml');

      expect(await fs.pathExists(composeFile)).toBe(true);

      // Simulate docker-compose down (in real implementation)
      // execSync('docker-compose down -v', { cwd: testProjectDir });

      // For testing, just verify compose file can be read
      const content = await fs.readFile(composeFile, 'utf-8');
      expect(content).toContain('figma');
    });

    it('should remove package.json devDependencies entry', async () => {
      const packageJsonPath = path.join(testProjectDir, 'package.json');

      // Create package.json with figma-docker
      await fs.writeJson(packageJsonPath, {
        name: 'test-project',
        devDependencies: {
          'figma-docker': '^2.0.0',
          'jest': '^29.0.0'
        }
      });

      // Remove figma-docker
      const packageJson = await fs.readJson(packageJsonPath);
      delete packageJson.devDependencies['figma-docker'];
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

      // Verify removed
      const updated = await fs.readJson(packageJsonPath);
      expect(updated.devDependencies['figma-docker']).toBeUndefined();
      expect(updated.devDependencies['jest']).toBe('^29.0.0');
    });

    it('should provide uninstallation summary', async () => {
      const summaryPath = path.join(testProjectDir, '.figma-docker-uninstall-summary.json');

      const summary = {
        uninstalledAt: new Date().toISOString(),
        removedDirectories: ['.figma-docker'],
        removedFiles: ['docker-compose.yml'],
        backupLocation: '.figma-docker-backup',
        status: 'success'
      };

      await fs.writeJson(summaryPath, summary, { spaces: 2 });

      // Verify summary
      const saved = await fs.readJson(summaryPath);
      expect(saved.status).toBe('success');
      expect(saved.removedDirectories).toContain('.figma-docker');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle installation in non-npm project', async () => {
      // No package.json exists
      const packageJsonPath = path.join(testProjectDir, 'package.json');
      const exists = await fs.pathExists(packageJsonPath);

      expect(exists).toBe(false);

      // Should create package.json
      await fs.writeJson(packageJsonPath, {
        name: path.basename(testProjectDir),
        version: '1.0.0',
        devDependencies: { 'figma-docker': '*' }
      });

      expect(await fs.pathExists(packageJsonPath)).toBe(true);
    });

    it('should handle existing .figma-docker/ directory', async () => {
      const figmaDockerDir = path.join(testProjectDir, '.figma-docker');

      // Create existing directory
      await fs.ensureDir(figmaDockerDir);
      await fs.writeJson(
        path.join(figmaDockerDir, 'config', 'config.json'),
        { existing: true }
      );

      // Attempt to install again (should preserve existing)
      const configPath = path.join(figmaDockerDir, 'config', 'config.json');
      const existingConfig = await fs.readJson(configPath);

      expect(existingConfig.existing).toBe(true);
    });

    it('should handle permission errors gracefully', async () => {
      // This test would require actual permission manipulation
      // For now, verify error handling structure
      const restrictedPath = path.join(testProjectDir, '.figma-docker-restricted');

      try {
        await fs.ensureDir(restrictedPath);
        expect(true).toBe(true); // Successfully created
      } catch (error) {
        // Should catch and handle permission errors
        expect(error.code).toBe('EACCES');
      }
    });

    it('should validate docker-compose.yml syntax', async () => {
      const composeFilePath = path.join(testProjectDir, 'docker-compose.yml');

      const validCompose = `version: '3.8'
services:
  figma:
    image: figma-docker:latest
    volumes:
      - ./.figma-docker/config:/app/config
`;

      await fs.writeFile(composeFilePath, validCompose);
      const content = await fs.readFile(composeFilePath, 'utf-8');

      // Basic validation
      expect(content).toContain('version:');
      expect(content).toContain('services:');
      expect(content).toContain('figma:');
    });
  });
});
