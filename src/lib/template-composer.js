/**
 * TemplateComposer - Compose Docker templates from fragments
 *
 * Provides functionality to:
 * - Load template fragments from filesystem
 * - Merge multiple fragments into complete templates
 * - Substitute variables using {{variable}} syntax
 * - Generate multi-stage Dockerfiles
 *
 * @module src/lib/template-composer
 * @author Claude Code
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * TemplateComposer - Composes Docker templates from reusable fragments
 *
 * @class TemplateComposer
 */
export class TemplateComposer {
  /**
   * Create a new TemplateComposer instance
   *
   * @param {string} templatesDir - Base directory for templates (defaults to src/templates)
   */
  constructor(templatesDir = null) {
    this.templatesDir = templatesDir || path.resolve(__dirname, '../templates');
    this.fragmentCache = new Map();
    this.loadedFragments = new Set();
  }

  /**
   * Load a template fragment from filesystem
   *
   * @async
   * @param {string} fragmentPath - Relative path to fragment (e.g., 'base/Dockerfile.base')
   * @returns {Promise<string>} Fragment content
   * @throws {Error} If fragment cannot be loaded
   */
  async loadFragment(fragmentPath) {
    // Check cache first
    if (this.fragmentCache.has(fragmentPath)) {
      return this.fragmentCache.get(fragmentPath);
    }

    try {
      const fullPath = path.join(this.templatesDir, fragmentPath);
      const content = await fs.readFile(fullPath, 'utf-8');

      // Cache the fragment
      this.fragmentCache.set(fragmentPath, content);
      this.loadedFragments.add(fragmentPath);

      return content;
    } catch (error) {
      throw new Error(
        `Failed to load fragment '${fragmentPath}': ${error.message}`
      );
    }
  }

  /**
   * Load multiple fragments in parallel
   *
   * @async
   * @param {string[]} fragmentPaths - Array of fragment paths
   * @returns {Promise<string[]>} Array of fragment contents
   */
  async loadFragments(fragmentPaths) {
    return Promise.all(fragmentPaths.map(path => this.loadFragment(path)));
  }

  /**
   * Merge multiple fragments into a single template
   *
   * Fragments are concatenated in order with double newlines between them.
   *
   * @param {string[]} fragments - Array of fragment contents
   * @param {Object} options - Merge options
   * @param {string} options.separator - Separator between fragments (default: '\n\n')
   * @param {boolean} options.deduplicate - Remove duplicate lines (default: false)
   * @returns {string} Merged template
   */
  mergeFragments(fragments, options = {}) {
    const {
      separator = '\n\n',
      deduplicate = false
    } = options;

    if (!Array.isArray(fragments)) {
      throw new Error('Fragments must be an array');
    }

    if (fragments.length === 0) {
      return '';
    }

    let merged = fragments.join(separator);

    if (deduplicate) {
      const lines = merged.split('\n');
      const seen = new Set();
      const uniqueLines = lines.filter(line => {
        const trimmed = line.trim();
        // Keep empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) {
          return true;
        }
        if (seen.has(trimmed)) {
          return false;
        }
        seen.add(trimmed);
        return true;
      });
      merged = uniqueLines.join('\n');
    }

    return merged;
  }

  /**
   * Substitute variables in template using {{variable}} syntax
   *
   * Supports:
   * - Simple variables: {{PORT}}
   * - Default values: {{PORT:-3000}}
   * - Conditional blocks: {{#if VAR}}...{{/if}}
   *
   * @param {string} template - Template string with variables
   * @param {Object} variables - Variable values
   * @param {Object} options - Substitution options
   * @param {boolean} options.strict - Throw error on missing variables (default: false)
   * @param {string} options.missing - Replacement for missing variables (default: '')
   * @returns {string} Template with substituted variables
   * @throws {Error} If strict mode and variable is missing
   */
  substituteVariables(template, variables = {}, options = {}) {
    const {
      strict = false,
      missing = ''
    } = options;

    if (typeof template !== 'string') {
      throw new Error('Template must be a string');
    }

    if (typeof variables !== 'object' || variables === null) {
      throw new Error('Variables must be an object');
    }

    let result = template;

    // Handle conditional blocks: {{#if VAR}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      const value = variables[varName];
      // Include block if variable is truthy
      return value ? content : '';
    });

    // Handle simple variables with optional default: {{VAR:-default}}
    result = result.replace(/\{\{(\w+)(?::-(.*?))?\}\}/g, (match, varName, defaultValue) => {
      if (varName in variables) {
        const value = variables[varName];
        // Convert null/undefined to empty string
        return value === null || value === undefined ? '' : String(value);
      }

      // Use default value if provided
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      // Strict mode: throw error
      if (strict) {
        throw new Error(`Missing required variable: ${varName}`);
      }

      // Return missing placeholder
      return missing;
    });

    return result;
  }

  /**
   * Compose a complete template from fragments with variable substitution
   *
   * Main composition workflow:
   * 1. Load all fragments in parallel
   * 2. Merge fragments
   * 3. Substitute variables
   *
   * @async
   * @param {Object} config - Composition configuration
   * @param {string[]} config.fragments - Array of fragment paths to load
   * @param {Object} config.variables - Variables for substitution
   * @param {Object} config.mergeOptions - Options for mergeFragments()
   * @param {Object} config.substituteOptions - Options for substituteVariables()
   * @returns {Promise<string>} Composed template
   * @throws {Error} If composition fails
   */
  async compose(config) {
    const {
      fragments = [],
      variables = {},
      mergeOptions = {},
      substituteOptions = {}
    } = config;

    if (!Array.isArray(fragments) || fragments.length === 0) {
      throw new Error('Config must specify fragments array');
    }

    try {
      // Step 1: Load all fragments in parallel
      const fragmentContents = await this.loadFragments(fragments);

      // Step 2: Merge fragments
      const merged = this.mergeFragments(fragmentContents, mergeOptions);

      // Step 3: Substitute variables
      const final = this.substituteVariables(merged, variables, substituteOptions);

      return final;
    } catch (error) {
      throw new Error(`Template composition failed: ${error.message}`);
    }
  }

  /**
   * Generate a multi-stage Dockerfile
   *
   * Creates a Dockerfile with separate stages for:
   * - Base dependencies
   * - Build process
   * - Production runtime
   *
   * @async
   * @param {Object} config - Dockerfile configuration
   * @param {string} config.tool - Tool name (lovable, bolt, v0, figma-make)
   * @param {string} config.framework - Framework name (react, vue, etc.)
   * @param {Object} config.metadata - Additional detection metadata
   * @param {Object} config.variables - Custom variables
   * @returns {Promise<string>} Generated Dockerfile
   */
  async generateDockerfile(config) {
    const {
      tool,
      framework = 'react',
      metadata = {},
      variables = {}
    } = config;

    if (!tool) {
      throw new Error('Tool name is required for Dockerfile generation');
    }

    // Build fragment list based on tool and framework
    const fragments = ['base/Dockerfile.base'];

    // Add tool-specific fragments if they exist
    const toolFragment = `tools/${tool}/Dockerfile.fragment`;
    try {
      await this.loadFragment(toolFragment);
      fragments.push(toolFragment);
    } catch (error) {
      // Tool fragment is optional
    }

    // Add framework fragment if it exists
    if (framework) {
      const frameworkFragment = `fragments/frameworks/${framework}.fragment`;
      try {
        await this.loadFragment(frameworkFragment);
        fragments.push(frameworkFragment);
      } catch (error) {
        // Framework fragment is optional
      }
    }

    // Build variables object
    const allVariables = {
      TOOL: tool,
      FRAMEWORK: framework,
      NODE_VERSION: metadata.nodeVersion || '20',
      PORT: metadata.port || '3000',
      BUILD_COMMAND: metadata.buildCommand || 'npm run build',
      START_COMMAND: metadata.startCommand || 'npm start',
      INSTALL_COMMAND: metadata.installCommand || 'npm ci',
      ...variables
    };

    // Compose the Dockerfile
    return this.compose({
      fragments,
      variables: allVariables,
      mergeOptions: {
        separator: '\n\n',
        deduplicate: true
      }
    });
  }

  /**
   * Generate a .dockerignore file
   *
   * @async
   * @param {Object} config - Configuration
   * @param {string} config.tool - Tool name
   * @param {string[]} config.additionalPatterns - Additional ignore patterns
   * @returns {Promise<string>} Generated .dockerignore content
   */
  async generateDockerignore(config = {}) {
    const {
      tool,
      additionalPatterns = []
    } = config;

    try {
      // Load base dockerignore
      let content = await this.loadFragment('base/.dockerignore');

      // Add tool-specific patterns if they exist
      if (tool) {
        try {
          const toolIgnore = await this.loadFragment(`tools/${tool}/.dockerignore`);
          content += '\n\n' + toolIgnore;
        } catch (error) {
          // Tool-specific ignore is optional
        }
      }

      // Add additional patterns
      if (additionalPatterns.length > 0) {
        content += '\n\n# Additional patterns\n';
        content += additionalPatterns.join('\n');
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to generate .dockerignore: ${error.message}`);
    }
  }

  /**
   * Clear fragment cache
   */
  clearCache() {
    this.fragmentCache.clear();
    this.loadedFragments.clear();
  }

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cachedFragments: this.fragmentCache.size,
      loadedFragments: Array.from(this.loadedFragments)
    };
  }
}

export default TemplateComposer;
