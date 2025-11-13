import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

/**
 * Directory Manager Module
 * Manages the .vibe-docker/ directory structure for per-project installations
 *
 * Directory Structure:
 * .vibe-docker/
 * ├── config.json           # Project-specific configuration
 * ├── templates/            # Custom templates
 * ├── cache/                # Template processing cache
 * ├── docker/               # Docker-specific files
 * │   ├── Dockerfile
 * │   ├── docker-compose.yml
 * │   └── nginx.conf
 * └── logs/                 # Installation and runtime logs
 */
class DirectoryManager {
  /**
   * Create a new DirectoryManager instance
   * @param {string} projectRoot - Root directory of the project
   */
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.vibeDockerDir = path.join(projectRoot, '.vibe-docker');
    this.backupDir = path.join(this.vibeDockerDir, '.backup');

    // Define directory structure
    this.directories = {
      root: this.vibeDockerDir,
      templates: path.join(this.vibeDockerDir, 'templates'),
      cache: path.join(this.vibeDockerDir, 'cache'),
      docker: path.join(this.vibeDockerDir, 'docker'),
      logs: path.join(this.vibeDockerDir, 'logs'),
      backup: this.backupDir
    };

    // Define required files
    this.requiredFiles = {
      config: path.join(this.vibeDockerDir, 'config.json'),
      gitignore: path.join(this.vibeDockerDir, '.gitignore')
    };
  }

  /**
   * Create the complete .vibe-docker/ directory hierarchy
   * @returns {Promise<Object>} Creation results with status and created paths
   * @throws {Error} If directory creation fails
   */
  async createVibeDockerDirectory() {
    const results = {
      success: false,
      created: [],
      skipped: [],
      errors: []
    };

    try {
      // Check if .figma-docker already exists
      const exists = await this.exists(this.vibeDockerDir);

      if (exists) {
        const validation = await this.validateDirectory();

        if (validation.isValid) {
          results.skipped.push(this.vibeDockerDir);
          results.success = true;
          return results;
        } else {
          // Backup existing directory if invalid
          await this.backupExistingDirectory();
        }
      }

      // Create all directories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        try {
          await fs.mkdir(dirPath, { recursive: true });

          // Verify directory was created and is writable
          await this.verifyWritePermission(dirPath);

          results.created.push(dirPath);
        } catch (error) {
          const errorMsg = `Failed to create directory ${name}: ${error.message}`;
          results.errors.push(errorMsg);
          throw new Error(errorMsg);
        }
      }

      // Create default configuration file
      await this.createDefaultConfig();
      results.created.push(this.requiredFiles.config);

      // Create .gitignore for cache and logs
      await this.createGitignore();
      results.created.push(this.requiredFiles.gitignore);

      // Create README for the directory
      await this.createReadme();
      results.created.push(path.join(this.vibeDockerDir, 'README.md'));

      results.success = true;
      return results;

    } catch (error) {
      // Cleanup on failure
      await this.cleanupOnFailure(results.created);
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  }

  /**
   * Validate existing .vibe-docker/ directory structure
   * @returns {Promise<Object>} Validation results
   */
  async validateDirectory() {
    const validation = {
      isValid: true,
      exists: false,
      writable: false,
      hasCorrectStructure: false,
      missingDirectories: [],
      permissionIssues: [],
      conflicts: []
    };

    try {
      // Check if directory exists
      validation.exists = await this.exists(this.vibeDockerDir);

      if (!validation.exists) {
        validation.isValid = false;
        return validation;
      }

      // Check write permissions
      try {
        await this.verifyWritePermission(this.vibeDockerDir);
        validation.writable = true;
      } catch (error) {
        validation.writable = false;
        validation.permissionIssues.push(this.vibeDockerDir);
        validation.isValid = false;
      }

      // Check for required subdirectories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        if (name === 'backup') continue; // Backup is optional

        const exists = await this.exists(dirPath);

        if (!exists) {
          validation.missingDirectories.push(dirPath);
        } else {
          // Check write permissions for existing directories
          try {
            await this.verifyWritePermission(dirPath);
          } catch (error) {
            validation.permissionIssues.push(dirPath);
            validation.isValid = false;
          }
        }
      }

      // Directory structure is correct if no missing directories
      validation.hasCorrectStructure = validation.missingDirectories.length === 0;

      // Check for conflicting files
      const conflicts = await this.detectConflicts();
      validation.conflicts = conflicts;

      if (conflicts.length > 0) {
        validation.isValid = false;
      }

      // Overall validation passes if writable and no conflicts
      validation.isValid = validation.writable &&
                          validation.conflicts.length === 0 &&
                          validation.permissionIssues.length === 0;

      return validation;

    } catch (error) {
      validation.isValid = false;
      validation.errors = [error.message];
      return validation;
    }
  }

  /**
   * Cleanup on installation failure - rollback mechanism
   * @param {Array<string>} createdPaths - Paths that were created during failed installation
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupOnFailure(createdPaths = []) {
    const results = {
      success: false,
      removed: [],
      errors: []
    };

    try {
      // Remove created paths in reverse order
      for (const dirPath of createdPaths.reverse()) {
        try {
          const stats = await fs.stat(dirPath);

          if (stats.isDirectory()) {
            await fs.rm(dirPath, { recursive: true, force: true });
          } else {
            await fs.unlink(dirPath);
          }

          results.removed.push(dirPath);
        } catch (error) {
          results.errors.push(`Failed to remove ${dirPath}: ${error.message}`);
        }
      }

      // Remove main .figma-docker directory if it's now empty
      try {
        const files = await fs.readdir(this.vibeDockerDir);

        if (files.length === 0) {
          await fs.rmdir(this.vibeDockerDir);
          results.removed.push(this.vibeDockerDir);
        }
      } catch (error) {
        // Directory might not exist, which is fine
      }

      // Restore backup if it exists
      if (await this.exists(this.backupDir)) {
        await this.restoreFromBackup();
      }

      results.success = results.errors.length === 0;
      return results;

    } catch (error) {
      results.errors.push(`Cleanup failed: ${error.message}`);
      return results;
    }
  }

  /**
   * Detect legacy global installation
   * @returns {Promise<Object>} Detection results
   */
  async detectLegacyInstallation() {
    const detection = {
      hasLegacyInstallation: false,
      legacyPath: null,
      legacyType: null,
      migrationRequired: false,
      migrationPath: null
    };

    try {
      // Check common legacy installation locations
      const legacyPaths = [
        path.join(os.homedir(), '.vibe-docker'),
        path.join(os.homedir(), '.config', 'figma-docker'),
        '/usr/local/lib/vibe-docker',
        '/opt/vibe-docker'
      ];

      for (const legacyPath of legacyPaths) {
        if (await this.exists(legacyPath)) {
          detection.hasLegacyInstallation = true;
          detection.legacyPath = legacyPath;
          detection.legacyType = this.determineLegacyType(legacyPath);
          detection.migrationRequired = true;
          detection.migrationPath = this.vibeDockerDir;
          break;
        }
      }

      // Check for legacy config in npm global directory
      try {
        const { stdout } = await import('child_process')
          .then(cp => {
            return new Promise((resolve, reject) => {
              cp.exec('npm root -g', (error, stdout, stderr) => {
                if (error) reject(error);
                else resolve({ stdout, stderr });
              });
            });
          });

        const npmGlobalRoot = stdout.trim();
        const npmLegacyPath = path.join(npmGlobalRoot, 'vibe-to-docker');

        if (await this.exists(npmLegacyPath)) {
          detection.hasLegacyInstallation = true;
          detection.legacyPath = npmLegacyPath;
          detection.legacyType = 'npm-global';
          detection.migrationRequired = true;
        }
      } catch (error) {
        // npm not available or command failed, skip
      }

      return detection;

    } catch (error) {
      detection.error = error.message;
      return detection;
    }
  }

  /**
   * Get directory structure information
   * @returns {Promise<Object>} Directory structure details
   */
  async getDirectoryInfo() {
    const info = {
      projectRoot: this.projectRoot,
      vibeDockerDir: this.vibeDockerDir,
      exists: false,
      size: 0,
      directories: {},
      files: {}
    };

    try {
      info.exists = await this.exists(this.vibeDockerDir);

      if (!info.exists) {
        return info;
      }

      // Get size of .figma-docker directory
      info.size = await this.getDirectorySize(this.vibeDockerDir);

      // Get info for each subdirectory
      for (const [name, dirPath] of Object.entries(this.directories)) {
        const exists = await this.exists(dirPath);

        info.directories[name] = {
          path: dirPath,
          exists,
          size: exists ? await this.getDirectorySize(dirPath) : 0
        };
      }

      // Get info for required files
      for (const [name, filePath] of Object.entries(this.requiredFiles)) {
        const exists = await this.exists(filePath);

        info.files[name] = {
          path: filePath,
          exists,
          size: exists ? (await fs.stat(filePath)).size : 0
        };
      }

      return info;

    } catch (error) {
      info.error = error.message;
      return info;
    }
  }

  /**
   * Create default configuration file
   * @private
   */
  async createDefaultConfig() {
    const config = {
      version: '2.0.0',
      projectRoot: this.projectRoot,
      createdAt: new Date().toISOString(),
      framework: null,
      template: null,
      docker: {
        compose: {
          version: '3.8',
          projectName: path.basename(this.projectRoot)
        }
      },
      paths: {
        templates: './templates',
        cache: './cache',
        docker: './docker',
        logs: './logs'
      }
    };

    await fs.writeFile(
      this.requiredFiles.config,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  }

  /**
   * Create .gitignore for cache and logs
   * @private
   */
  async createGitignore() {
    const gitignoreContent = `# Vibe Docker Init - Generated files
cache/
logs/
.backup/
*.log

# Keep templates and docker configs in version control
!templates/
!docker/
`;

    await fs.writeFile(
      this.requiredFiles.gitignore,
      gitignoreContent,
      'utf8'
    );
  }

  /**
   * Create README for the .figma-docker directory
   * @private
   */
  async createReadme() {
    const readmeContent = `# Vibe Docker Configuration

This directory contains the Docker configuration for this project, generated by \`vibe-to-docker\`.

## Directory Structure

- **templates/**: Custom Docker templates for this project
- **cache/**: Template processing cache (not committed to git)
- **docker/**: Generated Docker configuration files
  - Dockerfile
  - docker-compose.yml
  - nginx.conf
- **logs/**: Installation and runtime logs (not committed to git)
- **config.json**: Project-specific configuration

## Usage

To rebuild the Docker configuration:
\`\`\`bash
npx vibe-to-docker
\`\`\`

To start the Docker containers:
\`\`\`bash
npm run docker:up
\`\`\`

## Documentation

For more information, see: https://github.com/wrsmith108/vibe-to-docker
`;

    await fs.writeFile(
      path.join(this.vibeDockerDir, 'README.md'),
      readmeContent,
      'utf8'
    );
  }

  /**
   * Backup existing directory before modification
   * @private
   */
  async backupExistingDirectory() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupPath = path.join(this.backupDir, timestamp);

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Copy all files except backup directory
      await this.copyDirectory(this.vibeDockerDir, backupPath, ['.backup']);

      return backupPath;
    } catch (error) {
      throw new Error(`Failed to backup existing directory: ${error.message}`);
    }
  }

  /**
   * Restore from backup
   * @private
   */
  async restoreFromBackup() {
    try {
      // Find most recent backup
      const backups = await fs.readdir(this.backupDir);

      if (backups.length === 0) {
        return;
      }

      const latestBackup = backups.sort().reverse()[0];
      const backupPath = path.join(this.backupDir, latestBackup);

      // Remove current directory (except backup)
      const files = await fs.readdir(this.vibeDockerDir);

      for (const file of files) {
        if (file === '.backup') continue;

        const filePath = path.join(this.vibeDockerDir, file);
        await fs.rm(filePath, { recursive: true, force: true });
      }

      // Restore from backup
      await this.copyDirectory(backupPath, this.vibeDockerDir);

    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error.message}`);
    }
  }

  /**
   * Check if path exists
   * @private
   */
  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Verify write permissions for a directory
   * @private
   */
  async verifyWritePermission(dirPath) {
    const testFile = path.join(dirPath, `.test-${Date.now()}`);

    try {
      await fs.writeFile(testFile, 'test', 'utf8');
      await fs.unlink(testFile);
      return true;
    } catch (error) {
      throw new Error(`No write permission for ${dirPath}: ${error.message}`);
    }
  }

  /**
   * Detect conflicting files
   * @private
   */
  async detectConflicts() {
    const conflicts = [];

    try {
      // Check for files that should be directories
      for (const [name, dirPath] of Object.entries(this.directories)) {
        if (name === 'backup') continue;

        if (await this.exists(dirPath)) {
          const stats = await fs.stat(dirPath);

          if (!stats.isDirectory()) {
            conflicts.push({
              path: dirPath,
              type: 'file-instead-of-directory',
              message: `Expected directory but found file: ${dirPath}`
            });
          }
        }
      }

      return conflicts;

    } catch (error) {
      return conflicts;
    }
  }

  /**
   * Determine legacy installation type
   * @private
   */
  determineLegacyType(legacyPath) {
    if (legacyPath.includes(os.homedir())) {
      return 'user-global';
    } else if (legacyPath.startsWith('/usr/local')) {
      return 'system-global';
    } else if (legacyPath.startsWith('/opt')) {
      return 'system-opt';
    }
    return 'unknown';
  }

  /**
   * Get size of directory recursively
   * @private
   */
  async getDirectorySize(dirPath) {
    let totalSize = 0;

    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Copy directory recursively
   * @private
   */
  async copyDirectory(src, dest, exclude = []) {
    await fs.mkdir(dest, { recursive: true });

    const files = await fs.readdir(src, { withFileTypes: true });

    for (const file of files) {
      if (exclude.includes(file.name)) continue;

      const srcPath = path.join(src, file.name);
      const destPath = path.join(dest, file.name);

      if (file.isDirectory()) {
        await this.copyDirectory(srcPath, destPath, exclude);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }
}

/**
 * Ensure .figma-docker directory structure exists (synchronous wrapper)
 *
 * Creates the .figma-docker directory structure for the project.
 * This is a simplified synchronous version for immediate directory creation.
 *
 * @param {string} projectRoot - Project root directory path
 * @returns {Object} Directory structure paths
 * @throws {Error} If directory creation fails
 *
 * @example
 * const dirs = ensureVibeDockerStructure('/path/to/project');
 * console.log(dirs.root); // '/path/to/project/.figma-docker'
 */
export function ensureVibeDockerStructure(projectRoot) {
  const manager = new DirectoryManager(projectRoot);

  // Create all required directories synchronously
  for (const [name, dirPath] of Object.entries(manager.directories)) {
    if (!fsSync.existsSync(dirPath)) {
      fsSync.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Return directory structure
  return manager.directories;
}

export { DirectoryManager };
export default DirectoryManager;
