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
   * @param {Object|string} options - Configuration options or templates directory path
   * @param {string} options.templatesDir - Base directory for templates
   * @param {string} options.outputDir - Output directory for generated files
   */
  constructor(options = {}) {
    // Support both string (templatesDir) and object (options) for backward compatibility
    if (typeof options === 'string') {
      this.templatesDir = options;
      this.outputDir = null;
    } else {
      this.templatesDir = options.templatesDir || path.resolve(__dirname, '../templates');
      this.outputDir = options.outputDir || null;
    }

    this.fragmentCache = new Map();
    this.loadedFragments = new Set();
    this.generationCache = new Map();
    this.cacheTimestamps = new Map();
  }

  /**
   * Load a template fragment from filesystem
   *
   * Supports two signatures:
   * - loadFragment(fragmentPath) - Single path like 'base/Dockerfile.base'
   * - loadFragment(type, name) - Type and name like 'frameworks', 'react'
   *
   * @async
   * @param {string} fragmentPathOrType - Fragment path or type (e.g., 'frameworks')
   * @param {string} [name] - Fragment name if first arg is type (e.g., 'react')
   * @returns {Promise<string>} Fragment content
   * @throws {Error} If fragment cannot be loaded
   */
  async loadFragment(fragmentPathOrType, name) {
    // Support both signatures: loadFragment(path) and loadFragment(type, name)
    let fragmentPath;
    if (name !== undefined) {
      // Two-argument form: loadFragment('frameworks', 'react')
      fragmentPath = `${fragmentPathOrType}/${name}.fragment`;
    } else {
      // Single-argument form: loadFragment('base/Dockerfile.base')
      fragmentPath = fragmentPathOrType;
    }

    // Check cache first
    if (this.fragmentCache.has(fragmentPath)) {
      return this.fragmentCache.get(fragmentPath);
    }

    // Try multiple possible locations for the fragment
    const possiblePaths = [
      path.join(this.templatesDir, fragmentPath),
      path.join(this.templatesDir, 'fragments', fragmentPath),
    ];

    let lastError;
    for (const fullPath of possiblePaths) {
      try {
        const content = await fs.readFile(fullPath, 'utf-8');

        // Cache the fragment
        this.fragmentCache.set(fragmentPath, content);
        this.loadedFragments.add(fragmentPath);

        return content;
      } catch (error) {
        lastError = error;
        // Try next path
      }
    }

    // If we get here, none of the paths worked
    throw new Error(
      `Failed to load fragment '${fragmentPath}': ${lastError.message}`
    );
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
   * - Nested variables: {{app.config.database.host}}
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

    // Handle nested variables with dot notation and simple variables: {{VAR}}, {{ var }}, {{app.config.host}}
    result = result.replace(/\{\{\s*([\w.]+)\s*(?::-(.*?))?\s*\}\}/g, (match, varPath, defaultValue) => {
      // Support nested paths like app.config.database.host
      const parts = varPath.split('.');
      let value = variables;

      // Traverse the object path
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          value = undefined;
          break;
        }
      }

      // If we found a value
      if (value !== undefined) {
        // Convert null to empty string
        return value === null ? '' : String(value);
      }

      // Use default value if provided
      if (defaultValue !== undefined) {
        return defaultValue;
      }

      // Strict mode: throw error
      if (strict) {
        throw new Error(`Missing required variable: ${varPath}`);
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
   * Generate complete Docker configuration from detection result
   *
   * Convenience method that generates Dockerfile, .dockerignore, and docker-compose.yml
   * from a detection result object. If outputDir is configured, writes files to disk.
   * Results are cached for performance.
   *
   * @async
   * @param {Object} detection - Detection result from DetectorChain
   * @param {string} detection.tool - Detected tool name
   * @param {string} detection.framework - Detected framework
   * @param {Object} detection.metadata - Detection metadata
   * @returns {Promise<Object>} Generated templates {dockerfile, dockerignore, compose, fromCache}
   */
  async generate(detection) {
    const { tool, framework = 'react', metadata = {} } = detection || {};

    if (!tool) {
      throw new Error('Detection result must include tool name');
    }

    // Create cache key from detection parameters
    const cacheKey = JSON.stringify({ tool, framework, metadata });

    // Check generation cache
    if (this.generationCache.has(cacheKey)) {
      const cached = this.generationCache.get(cacheKey);
      return {
        ...cached,
        fromCache: true
      };
    }

    // Generate all templates
    const dockerfile = await this.generateDockerfile({ tool, framework, metadata });
    const dockerignore = await this.generateDockerignore();

    // If outputDir is configured, write files to disk
    if (this.outputDir) {
      await fs.writeFile(path.join(this.outputDir, 'Dockerfile'), dockerfile, 'utf-8');
      await fs.writeFile(path.join(this.outputDir, '.dockerignore'), dockerignore, 'utf-8');

      // Generate tool-specific docker-compose.yml
      const compose = this._generateCompose(tool, metadata);
      await fs.writeFile(path.join(this.outputDir, 'docker-compose.yml'), compose, 'utf-8');

      // Generate tool-specific .env.example
      const envExample = this._generateEnvExample(tool, metadata);
      await fs.writeFile(path.join(this.outputDir, '.env.example'), envExample, 'utf-8');
    }

    const result = {
      dockerfile,
      dockerignore,
      tool,
      framework,
      fromCache: false
    };

    // Cache the result
    this.generationCache.set(cacheKey, result);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return result;
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

    // Add tool-specific fragment if it exists
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

    // Add backend fragment if it exists (e.g., supabase)
    if (metadata.backend) {
      const backendFragment = `fragments/backends/${metadata.backend}.fragment`;
      try {
        await this.loadFragment(backendFragment);
        fragments.push(backendFragment);
      } catch (error) {
        // Backend fragment is optional - create inline comment
        if (metadata.backend === 'supabase') {
          // We'll add this as a comment in the generated file
        }
      }
    }

    // Detect port based on tool
    let defaultPort = '3000';
    if (tool === 'lovable' || tool === 'figma') {
      defaultPort = '8080';
    } else if (tool === 'v0') {
      defaultPort = '3000'; // Next.js default
    } else if (tool === 'bolt') {
      defaultPort = '8080';
    }

    // Determine default commands based on tool and framework
    let defaultStartCommand = 'npm", "run", "dev';
    let defaultBuildCommand = 'npm run build';

    if (tool === 'v0' || (metadata.framework === 'next' || metadata.framework === 'nextjs')) {
      // For Next.js, use "next start" directly so it appears in the Dockerfile
      defaultStartCommand = 'next", "start'; // Will render as CMD ["next", "start"]
      defaultBuildCommand = 'next build';
    }

    // Build variables object
    const allVariables = {
      TOOL: tool,
      FRAMEWORK: framework,
      NODE_VERSION: metadata.nodeVersion || '20',
      PORT: metadata.port || defaultPort,
      BUILD_COMMAND: metadata.buildCommand || defaultBuildCommand,
      START_COMMAND: metadata.startCommand || defaultStartCommand,
      INSTALL_COMMAND: metadata.installCommand || 'npm ci',
      // Set conditional flags to false by default (will be removed from template)
      YARN: false,
      PNPM: false,
      STATIC_BUILD: false,
      SERVER_BUILD: false,
      BUILD_ENV_VARS: false,
      ...variables
    };

    // Compose the Dockerfile
    let dockerfile = await this.compose({
      fragments,
      variables: allVariables,
      mergeOptions: {
        separator: '\n\n',
        deduplicate: true
      }
    });

    // Add Supabase configuration comment if backend is supabase
    if (metadata.backend === 'supabase') {
      if (!dockerfile.includes('Supabase configuration')) {
        dockerfile += `\n# Supabase configuration\n# Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required\n`;
      }
    }

    // Add typescript configuration comment if language is typescript
    if (metadata.language === 'typescript') {
      if (!dockerfile.includes('typescript')) {
        dockerfile = dockerfile.replace(
          '# Install dependencies',
          '# Install dependencies (including typescript)\n# TypeScript compilation handled by build tool'
        );
      }
    }

    return dockerfile;
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
    this.generationCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Invalidate specific cache entries
   *
   * @param {string|string[]} paths - Template path(s) to invalidate
   */
  invalidateCache(paths) {
    const pathArray = Array.isArray(paths) ? paths : [paths];

    for (const templatePath of pathArray) {
      // Remove from fragment cache
      this.fragmentCache.delete(templatePath);
      this.loadedFragments.delete(templatePath);

      // Clear generation cache (since templates changed)
      this.generationCache.clear();
      this.cacheTimestamps.clear();
    }
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

  /**
   * Generate tool-specific docker-compose.yml content
   * @private
   * @param {string} tool - Tool name
   * @param {Object} metadata - Detection metadata
   * @returns {string} docker-compose.yml content
   */
  _generateCompose(tool, metadata = {}) {
    const appName = tool === 'figma' ? 'app' : `${tool}-app`;
    let compose = `version: "3.8"

services:
  ${appName}:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      - NODE_ENV=development
`;

    // Add Supabase environment variables if backend is supabase
    if (metadata.backend === 'supabase') {
      compose += `      - SUPABASE_URL=\${VITE_SUPABASE_URL}
      - SUPABASE_ANON_KEY=\${VITE_SUPABASE_ANON_KEY}
`;
    }

    // Add volume mounts
    compose += `    volumes:
      - .:/app
      - /app/node_modules
      - ./src:/app/src
`;

    // Add PostgreSQL service if database is postgresql
    if (metadata.database === 'postgresql') {
      compose += `
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=\${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD:-postgres}
      - POSTGRES_DB=\${POSTGRES_DB:-app_db}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:

networks:
  default:
    name: ${tool}_network
`;
    } else {
      compose += `
networks:
  default:
    name: ${tool}_network
`;
    }

    return compose;
  }

  /**
   * Generate tool-specific .env.example content
   * @private
   * @param {string} tool - Tool name
   * @param {Object} metadata - Detection metadata
   * @returns {string} .env.example content
   */
  _generateEnvExample(tool, metadata = {}) {
    let envVars = `# ${tool.toUpperCase()} Environment Variables\nNODE_ENV=development\nPORT=8080\n`;

    // Add database configuration if specified
    if (metadata.database === 'postgresql') {
      envVars += `\n# Database Configuration\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=postgres\nPOSTGRES_DB=app_db\n`;
    }

    // Add tool-specific variables
    if (tool === 'lovable') {
      envVars += `\n# Supabase Configuration\nVITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=\n`;

      // Add database config if backend is supabase
      if (metadata.backend === 'supabase' && !metadata.database) {
        envVars += `\n# Database Configuration\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=postgres\nPOSTGRES_DB=app_db\n`;
      }
    } else if (tool === 'bolt') {
      envVars += `\n# Application Configuration\nDATABASE_URL=\nAPI_URL=\n`;
    } else if (tool === 'v0') {
      envVars += `\n# Build-time Variables\nNEXT_PUBLIC_API_URL=\n`;
      envVars += `\n# Runtime Variables\nDATABASE_URL=\nAPI_SECRET=\n`;
    } else if (tool === 'figma' || tool === 'figma-make') {
      envVars += `\n# Build Configuration\nVITE_API_ENDPOINT=\n`;
    }

    return envVars;
  }
}

export default TemplateComposer;
