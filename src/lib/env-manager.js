/**
 * EnvManager - Environment variable detection and management
 *
 * Provides functionality to:
 * - Detect environment variables in project files
 * - Generate .env and .env.example files
 * - Separate build-time vs runtime variables
 * - Validate secrets and provide warnings
 *
 * @module src/lib/env-manager
 * @author Claude Code
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * EnvManager - Manages environment variables for Docker containerization
 *
 * @class EnvManager
 */
export class EnvManager {
  /**
   * Create a new EnvManager instance
   *
   * @param {string|Object} projectRootOrOptions - Project root directory or options object
   * @param {string} projectRootOrOptions.projectRoot - Project root (if using options)
   * @param {string} projectRootOrOptions.projectDir - Alias for projectRoot (if using options)
   */
  constructor(projectRootOrOptions) {
    // Support both string (projectRoot) and object (options) for backward compatibility
    if (typeof projectRootOrOptions === 'string') {
      this.projectRoot = projectRootOrOptions;
    } else if (projectRootOrOptions && typeof projectRootOrOptions === 'object') {
      this.projectRoot = projectRootOrOptions.projectRoot || projectRootOrOptions.projectDir;
    } else {
      this.projectRoot = null;
    }

    if (!this.projectRoot || typeof this.projectRoot !== 'string') {
      throw new Error('Project root is required');
    }

    this.projectRoot = this.projectRoot;
    this.detectedVars = new Map();
    this.buildTimeVars = new Set();
    this.runtimeVars = new Set();
    this.secretVars = new Set();

    // Patterns for detecting secrets
    this.secretPatterns = [
      /API[_-]?KEY/i,
      /SECRET/i,
      /PASSWORD/i,
      /TOKEN/i,
      /PRIVATE[_-]?KEY/i,
      /AUTH/i,
      /CREDENTIALS?/i
    ];

    // Build-time variable prefixes by tool
    this.buildTimePrefixes = {
      'vite': ['VITE_'],
      'next': ['NEXT_PUBLIC_'],
      'react': ['REACT_APP_'],
      'nuxt': ['NUXT_PUBLIC_']
    };
  }

  /**
   * Detect environment variables in a file
   *
   * @async
   * @param {string} filePath - Path to file to scan
   * @returns {Promise<Set<string>>} Set of detected variable names
   */
  async detectInFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const vars = new Set();

      // Pattern for environment variable access
      // Matches: process.env.VAR_NAME, import.meta.env.VAR_NAME, etc.
      const patterns = [
        /process\.env\.(\w+)/g,
        /import\.meta\.env\.(\w+)/g,
        /process\.env\['([^']+)'\]/g,
        /process\.env\["([^"]+)"\]/g,
        /import\.meta\.env\['([^']+)'\]/g,
        /import\.meta\.env\["([^"]+)"\]/g
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const varName = match[1];
          if (varName && varName !== 'NODE_ENV') {
            vars.add(varName);
          }
        }
      }

      return vars;
    } catch (error) {
      // File doesn't exist or can't be read
      return new Set();
    }
  }

  /**
   * Detect environment variables in project
   *
   * Scans source files for env variable usage
   *
   * @async
   * @param {Object} options - Detection options
   * @param {string[]} options.extensions - File extensions to scan (default: ['.js', '.jsx', '.ts', '.tsx'])
   * @param {string[]} options.directories - Directories to scan (default: ['src'])
   * @param {number} options.maxFiles - Maximum files to scan (default: 100)
   * @returns {Promise<Map<string, Object>>} Map of variable names to metadata
   */
  async detectVariables(options = {}) {
    const {
      extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'],
      directories = ['src'],
      maxFiles = 100
    } = options;

    this.detectedVars.clear();
    let filesScanned = 0;

    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);

      try {
        await this._scanDirectory(dirPath, extensions, maxFiles - filesScanned);
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    return this.detectedVars;
  }

  /**
   * Recursively scan directory for env variables
   *
   * @private
   * @async
   * @param {string} dirPath - Directory to scan
   * @param {string[]} extensions - File extensions to include
   * @param {number} maxFiles - Maximum files to scan
   */
  async _scanDirectory(dirPath, extensions, maxFiles) {
    if (maxFiles <= 0) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      let scanned = 0;

      for (const entry of entries) {
        if (scanned >= maxFiles) break;

        const fullPath = path.join(dirPath, entry.name);

        // Skip common ignored directories
        if (entry.isDirectory()) {
          if (['node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.nuxt'].includes(entry.name)) {
            continue;
          }
          await this._scanDirectory(fullPath, extensions, maxFiles - scanned);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const vars = await this.detectInFile(fullPath);

            for (const varName of vars) {
              if (!this.detectedVars.has(varName)) {
                this.detectedVars.set(varName, {
                  name: varName,
                  files: [],
                  isBuildTime: this._isBuildTimeVar(varName),
                  isSecret: this._isSecretVar(varName)
                });
              }

              const varInfo = this.detectedVars.get(varName);
              varInfo.files.push(path.relative(this.projectRoot, fullPath));
            }

            scanned++;
          }
        }
      }
    } catch (error) {
      // Ignore scan errors
    }
  }

  /**
   * Check if variable is a build-time variable
   *
   * @private
   * @param {string} varName - Variable name
   * @returns {boolean} True if build-time variable
   */
  _isBuildTimeVar(varName) {
    for (const prefixes of Object.values(this.buildTimePrefixes)) {
      for (const prefix of prefixes) {
        if (varName.startsWith(prefix)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if variable is likely a secret
   *
   * @private
   * @param {string} varName - Variable name
   * @returns {boolean} True if likely a secret
   */
  _isSecretVar(varName) {
    return this.secretPatterns.some(pattern => pattern.test(varName));
  }

  /**
   * Load existing .env file
   *
   * @async
   * @param {string} envPath - Path to .env file (default: .env in project root)
   * @returns {Promise<Map<string, string>>} Map of variable names to values
   */
  async loadEnvFile(envPath = null) {
    const filePath = envPath || path.join(this.projectRoot, '.env');

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const vars = new Map();

      for (const line of content.split('\n')) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith('#')) {
          continue;
        }

        // Parse VAR=value format
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
        if (match) {
          const [, name, value] = match;
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          vars.set(name, cleanValue);
        }
      }

      return vars;
    } catch (error) {
      // File doesn't exist
      return new Map();
    }
  }

  /**
   * Generate .env.example file content
   *
   * Creates example file with placeholder values and comments
   *
   * @param {Object} options - Generation options
   * @param {Map<string, Object>} options.variables - Variables to include (default: detected vars)
   * @param {boolean} options.includeComments - Include usage comments (default: true)
   * @param {boolean} options.groupByType - Group by build/runtime (default: true)
   * @returns {string} .env.example file content
   */
  generateEnvExample(options = {}) {
    const {
      variables = this.detectedVars,
      includeComments = true,
      groupByType = true
    } = options;

    let content = '';

    if (includeComments) {
      content += '# Environment Variables\n';
      content += '# Copy this file to .env and fill in your values\n\n';
    }

    const buildVars = [];
    const runtimeVars = [];
    const secretVars = [];

    for (const [name, info] of variables) {
      // Defensive check: Ensure info has required properties
      if (!info || typeof info !== 'object') {
        continue;
      }

      // Ensure files is always an array
      const files = Array.isArray(info.files) ? info.files : [];
      const safeInfo = { ...info, files };

      if (info.isSecret) {
        secretVars.push({ name, info: safeInfo });
      } else if (info.isBuildTime) {
        buildVars.push({ name, info: safeInfo });
      } else {
        runtimeVars.push({ name, info: safeInfo });
      }
    }

    // Build-time variables
    if (groupByType && buildVars.length > 0) {
      content += '# Build-time variables (bundled into application)\n';
      for (const { name, info } of buildVars) {
        if (includeComments && info.files && info.files.length > 0) {
          content += `# Used in: ${info.files.slice(0, 3).join(', ')}\n`;
        }
        content += `${name}=\n`;
      }
      content += '\n';
    }

    // Runtime variables
    if (groupByType && runtimeVars.length > 0) {
      content += '# Runtime variables\n';
      for (const { name, info } of runtimeVars) {
        if (includeComments && info.files && info.files.length > 0) {
          content += `# Used in: ${info.files.slice(0, 3).join(', ')}\n`;
        }
        content += `${name}=\n`;
      }
      content += '\n';
    }

    // Secret variables (with warnings)
    if (secretVars.length > 0) {
      content += '# Secret variables (DO NOT commit real values to git!)\n';
      for (const { name, info } of secretVars) {
        if (includeComments && info.files && info.files.length > 0) {
          content += `# Used in: ${info.files.slice(0, 3).join(', ')}\n`;
        }
        content += `${name}=\n`;
      }
    }

    // If not grouping, just list all variables
    if (!groupByType) {
      for (const [name, info] of variables) {
        // Defensive check: Skip null/undefined entries
        if (!info || typeof info !== 'object') {
          continue;
        }

        // Defensive check for non-grouped mode
        const files = Array.isArray(info.files) ? info.files : [];
        if (includeComments && files.length > 0) {
          content += `# Used in: ${files.slice(0, 3).join(', ')}\n`;
        }
        if (info.isSecret) {
          content += `# WARNING: Secret variable - keep secure!\n`;
        }
        content += `${name}=\n`;
      }
    }

    return content;
  }

  /**
   * Generate .env file with values from existing file
   *
   * @async
   * @param {Object} options - Generation options
   * @param {Map<string, string>} options.existingValues - Existing variable values
   * @param {Map<string, Object>} options.variables - Variables to include
   * @returns {Promise<string>} .env file content
   */
  async generateEnvFile(options = {}) {
    const {
      existingValues = await this.loadEnvFile(),
      variables = this.detectedVars
    } = options;

    let content = '# Environment Variables\n';
    content += '# WARNING: Do not commit this file to version control!\n\n';

    for (const [name, info] of variables) {
      const value = existingValues.get(name) || '';

      if (info.isSecret && !value) {
        content += `# TODO: Set secret value for ${name}\n`;
      }

      content += `${name}=${value}\n`;
    }

    return content;
  }

  /**
   * Separate build-time and runtime variables
   *
   * @param {string} tool - Tool name (vite, next, react, etc.)
   * @returns {Object} Object with buildTime and runtime arrays
   */
  separateVariables(tool = 'vite') {
    const buildTime = [];
    const runtime = [];

    const prefixes = this.buildTimePrefixes[tool] || [];

    for (const [name, info] of this.detectedVars) {
      if (prefixes.some(prefix => name.startsWith(prefix))) {
        buildTime.push({ name, ...info });
      } else {
        runtime.push({ name, ...info });
      }
    }

    return { buildTime, runtime };
  }

  /**
   * Validate environment variables and return warnings
   *
   * @returns {Object[]} Array of warning objects
   */
  validateVariables() {
    const warnings = [];

    for (const [name, info] of this.detectedVars) {
      // Warn about secrets
      if (info.isSecret) {
        warnings.push({
          type: 'secret',
          severity: 'high',
          variable: name,
          message: `Variable '${name}' appears to be a secret. Ensure it's not committed to version control.`,
          recommendation: 'Add .env to .gitignore and use .env.example for documentation.'
        });
      }

      // Warn about undefined variables
      if (info.files.length === 0) {
        warnings.push({
          type: 'unused',
          severity: 'low',
          variable: name,
          message: `Variable '${name}' is defined but not used in scanned files.`,
          recommendation: 'Remove if not needed.'
        });
      }

      // Warn about build-time variables that might be secrets
      if (info.isBuildTime && info.isSecret) {
        warnings.push({
          type: 'security',
          severity: 'critical',
          variable: name,
          message: `Build-time variable '${name}' appears to be a secret. Build-time variables are bundled into the application and visible to clients.`,
          recommendation: 'Use runtime variables for secrets, or ensure this is intentional.'
        });
      }
    }

    return warnings;
  }

  /**
   * Validate an environment file for secrets and issues
   *
   * @async
   * @param {string} envFilePath - Path to environment file to validate
   * @returns {Promise<Object[]>} Array of warning objects
   */
  async validateEnvFile(envFilePath) {
    const warnings = [];

    try {
      const content = await fs.readFile(envFilePath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNum = i + 1;

        // Skip comments and empty lines
        if (!line || line.startsWith('#')) {
          continue;
        }

        // Parse VAR=value format
        const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
        if (match) {
          const [, name, value] = match;

          // Check if variable appears to be a secret
          if (this._isSecretVar(name)) {
            // Check if it has an actual value (not placeholder)
            if (value && value !== '' && !value.startsWith('your-') && !value.startsWith('your_')) {
              warnings.push({
                type: 'secret',
                severity: 'high',
                variable: name,
                line: lineNum,
                message: `Variable '${name}' appears to be a secret with an actual value in ${path.basename(envFilePath)}`,
                recommendation: 'Do not commit actual secrets to .env.example. Use placeholder values instead.'
              });
            }
          }

          // Check for common mistakes
          if (value.includes(' ') && !value.match(/^["'].*["']$/)) {
            warnings.push({
              type: 'format',
              severity: 'medium',
              variable: name,
              line: lineNum,
              message: `Variable '${name}' value contains spaces but is not quoted`,
              recommendation: 'Quote values with spaces: VAR="value with spaces"'
            });
          }
        }
      }
    } catch (error) {
      // File doesn't exist or can't be read - not an error for validation
    }

    return warnings;
  }

  /**
   * Get statistics about detected variables
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    let buildTimeCount = 0;
    let runtimeCount = 0;
    let secretCount = 0;

    for (const [, info] of this.detectedVars) {
      if (info.isBuildTime) buildTimeCount++;
      else runtimeCount++;

      if (info.isSecret) secretCount++;
    }

    return {
      total: this.detectedVars.size,
      buildTime: buildTimeCount,
      runtime: runtimeCount,
      secrets: secretCount
    };
  }
}

export default EnvManager;
