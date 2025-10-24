#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================
// Functions: ValidationError, ConfigError
// Purpose: Custom error types for consistent error handling across the application
// =============================================================================

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Custom error class for configuration errors
 */
class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

// =============================================================================
// INPUT VALIDATION AND SANITIZATION UTILITIES
// =============================================================================
// Functions: sanitizeString, validateTemplateName, validateProjectDirectory, validatePort, validateProjectName, sanitizeTemplateVariable, validateFilePath
// Purpose: Ensure all user inputs are safe and valid before processing
// =============================================================================

/**
 * Sanitizes a string by removing null bytes, control characters, and trimming whitespace.
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {string} The sanitized string
 * @throws {Error} If input is not a string or exceeds maxLength
 */
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }
  // Remove null bytes and control characters
  const sanitized = input.replace(/[\x00-\x1F\x7F]/g, '').trim();
  if (sanitized.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`);
  }
  return sanitized;
}

/**
 * Validates and sanitizes a template name.
 * @param {string} templateName - The template name to validate
 * @returns {string} The validated and sanitized template name
 * @throws {Error} If template name contains invalid characters
 */
function validateTemplateName(templateName) {
  const sanitized = sanitizeString(templateName, 50);
  // Only allow alphanumeric characters, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new ValidationError('Template name contains invalid characters. Only alphanumeric characters, hyphens, and underscores are allowed.');
  }
  return sanitized;
}

/**
 * Validates and sanitizes a project directory path.
 * @param {string} projectDir - The project directory path to validate
 * @returns {string} The validated and resolved project directory path
 * @throws {Error} If directory is outside current working directory
 */
function validateProjectDirectory(projectDir) {
  const sanitized = sanitizeString(projectDir, 4096);
  const resolvedPath = path.resolve(sanitized);
  // Prevent directory traversal attacks
  if (!resolvedPath.startsWith(process.cwd())) {
    throw new ValidationError('Project directory must be within the current working directory');
  }
  return resolvedPath;
}

/**
 * Validates a port number.
 * @param {string|number} port - The port number to validate
 * @returns {number} The validated port number
 * @throws {Error} If port is not a valid number between 1 and 65535
 */
function validatePort(port) {
  const numPort = parseInt(port, 10);
  if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
    throw new ValidationError('Port must be a valid number between 1 and 65535');
  }
  return numPort;
}

/**
 * Validates and sanitizes a project name.
 * @param {string} name - The project name to validate
 * @returns {string} The validated and sanitized project name
 * @throws {Error} If project name contains invalid characters
 */
function validateProjectName(name) {
  const sanitized = sanitizeString(name, 100);
  // Allow alphanumeric, hyphens, underscores, and dots
  if (!/^[a-zA-Z0-9._-]+$/.test(sanitized)) {
    throw new ValidationError('Project name contains invalid characters');
  }
  return sanitized;
}

/**
 * Sanitizes template variable values for safe replacement.
 * @param {*} value - The value to sanitize
 * @returns {*} The sanitized value
 */
function sanitizeTemplateVariable(value) {
  if (typeof value === 'string') {
    // Escape special characters that could be used for injection
    return value.replace(/[<>]/g, '').trim();
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }
  // Convert other types to string and sanitize
  return sanitizeString(String(value), 1000);
}

/**
 * Validates a file path to ensure it's within the allowed base directory.
 * @param {string} filePath - The file path to validate
 * @param {string} baseDir - The base directory the path must be within
 * @returns {string} The validated and resolved file path
 * @throws {Error} If file path is outside the allowed directory
 */
function validateFilePath(filePath, baseDir) {
  const sanitized = sanitizeString(filePath, 4096);
  const resolvedPath = path.resolve(baseDir, sanitized);
  // Ensure path is within base directory
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw new ValidationError('File path is outside allowed directory');
  }
  return resolvedPath;
}

// =============================================================================
// CONFIGURATION PARSING FUNCTIONS
// =============================================================================
// Functions: parseConfig, parseViteConfig, parseRollupConfig, parseWebpackConfig, detectBuildOutputDir
// Purpose: Extract build configuration from various build tool config files
// =============================================================================

/**
 * Parse configuration file to extract values using regex pattern
 * @param {string} configPath - Full path to config file (with or without extension)
 * @param {RegExp} pattern - Regex pattern to extract value
 * @returns {Promise<string|null>} Extracted value or null if not found
 */
async function parseConfig(configPath, pattern) {
  const extensions = ['js', 'ts'];

  // If path already has extension, try it directly
  if (configPath.endsWith('.js') || configPath.endsWith('.ts')) {
    try {
      const content = await fs.promises.readFile(configPath, 'utf-8');
      const match = content.match(pattern);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  // Try adding .js and .ts extensions
  for (const ext of extensions) {
    try {
      const fullPath = `${configPath}.${ext}`;
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      const match = content.match(pattern);
      return match ? match[1] : null;
    } catch (error) {
      // Try next extension
      continue;
    }
  }

  return null;
}

/**
 * Parses Vite configuration to extract build output directory.
 * @param {string} projectDir - The project directory path
 * @returns {Promise<string|null>} The build output directory or null if not found
 */
async function parseViteConfig(projectDir) {
  const configPath = path.join(projectDir, 'vite.config');
  return await parseConfig(
    configPath,
    /build\s*:\s*{[^}]*outDir\s*:\s*['"]([^'"]+)['"]/
  );
}

/**
 * Parses Rollup configuration to extract build output directory.
 * @param {string} projectDir - The project directory path
 * @returns {Promise<string|null>} The build output directory or null if not found
 */
async function parseRollupConfig(projectDir) {
  const configPath = path.join(projectDir, 'rollup.config');
  return await parseConfig(
    configPath,
    /output\s*:\s*{[^}]*dir\s*:\s*['"]([^'"]+)['"]/
  );
}

/**
 * Parses Webpack configuration to extract build output directory.
 * @param {string} projectDir - The project directory path
 * @returns {Promise<string|null>} The build output directory or null if not found
 */
async function parseWebpackConfig(projectDir) {
  const configPath = path.join(projectDir, 'webpack.config');
  return await parseConfig(
    configPath,
    /output\s*:\s*{[^}]*path\s*:\s*path\.resolve\([^,]+,\s*['"]([^'"]+)['"]/
  );
}

/**
 * Detects the build output directory by trying different build tool configurations.
 * @param {string} projectDir - The project directory path
 * @returns {Promise<string|null>} The detected build output directory or null
 */
async function detectBuildOutputDir(projectDir) {
  // Try Vite first
  let outputDir = await parseViteConfig(projectDir);
  if (outputDir) return outputDir;

  // Try Rollup
  outputDir = await parseRollupConfig(projectDir);
  if (outputDir) return outputDir;

  // Try Webpack
  outputDir = await parseWebpackConfig(projectDir);
  if (outputDir) return outputDir;

  return null;
}

// =============================================================================
// PROJECT DETECTION AND ANALYSIS FUNCTIONS
// =============================================================================
// Functions: detectProjectValues
// Purpose: Auto-detect project settings from package.json and config files
// =============================================================================

/**
 * Detects project values from package.json and other configuration files.
 * @param {string} projectDir - The project directory path (default: '.')
 * @returns {Promise<Object>} Object containing detected project values
 */
async function detectProjectValues(projectDir = '.') {
  const values = {};

  // Validate project directory
  let validatedProjectDir;
  try {
    validatedProjectDir = validateProjectDirectory(projectDir);
  } catch (error) {
    log(`Invalid project directory: ${error.message}`, colors.red);
    throw error;
  }

  // Detect PROJECT_NAME from package.json
  try {
    const packagePath = path.join(validatedProjectDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (pkg.name) {
        values.PROJECT_NAME = validateProjectName(pkg.name);
      } else {
        values.PROJECT_NAME = 'my-app';
      }
    }
  } catch (error) {
    const packagePath = path.join(validatedProjectDir, 'package.json');
    log(`Warning: Could not read or parse package.json at ${packagePath}. Error: ${error.message}. This may be due to invalid JSON syntax, missing file, or permission issues. Using default project name 'my-app'.`, colors.yellow);
    values.PROJECT_NAME = 'my-app';
  }

  // Detect BUILD_OUTPUT_DIR dynamically
  values.BUILD_OUTPUT_DIR = await detectBuildOutputDir(validatedProjectDir) || 'dist';

  // Detect FRAMEWORK, TYPESCRIPT, UI_LIBRARY, and DEPENDENCY_COUNT from package.json dependencies
  try {
    const packagePath = path.join(validatedProjectDir, 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      const allDeps = Object.keys(deps);

      // Calculate dependency count
      values.DEPENDENCY_COUNT = allDeps.length;

      // Detect TypeScript
      values.TYPESCRIPT = allDeps.some(dep => dep.includes('typescript') || dep.includes('@types/'));

      // Detect UI Library
      if (deps['@mui/material'] || deps['@mui/core']) {
        values.UI_LIBRARY = 'Material-UI';
      } else if (deps['antd'] || deps['@ant-design/icons']) {
        values.UI_LIBRARY = 'Ant Design';
      } else if (deps['@chakra-ui/react']) {
        values.UI_LIBRARY = 'Chakra UI';
      } else if (deps['@mantine/core']) {
        values.UI_LIBRARY = 'Mantine';
      } else if (deps['react-bootstrap'] || deps['bootstrap']) {
        values.UI_LIBRARY = 'Bootstrap';
      } else if (deps['tailwindcss']) {
        values.UI_LIBRARY = 'Tailwind CSS';
      } else {
        values.UI_LIBRARY = 'none';
      }

      // Enhanced FRAMEWORK detection with build tools
      if (deps['next']) {
        values.FRAMEWORK = 'next.js';
      } else if (deps['vite']) {
        if (deps['react']) {
          values.FRAMEWORK = 'react-vite';
        } else if (deps['vue']) {
          values.FRAMEWORK = 'vue-vite';
        } else if (deps['svelte']) {
          values.FRAMEWORK = 'svelte-vite';
        } else {
          values.FRAMEWORK = 'vite';
        }
      } else if (deps['webpack'] || deps['webpack-cli']) {
        if (deps['react']) {
          values.FRAMEWORK = 'react-webpack';
        } else if (deps['vue']) {
          values.FRAMEWORK = 'vue-webpack';
        } else {
          values.FRAMEWORK = 'webpack';
        }
      } else if (deps['rollup']) {
        if (deps['react']) {
          values.FRAMEWORK = 'react-rollup';
        } else if (deps['vue']) {
          values.FRAMEWORK = 'vue-rollup';
        } else if (deps['svelte']) {
          values.FRAMEWORK = 'svelte-rollup';
        } else {
          values.FRAMEWORK = 'rollup';
        }
      } else if (deps['react']) {
        values.FRAMEWORK = 'react';
      } else if (deps['vue']) {
        values.FRAMEWORK = 'vue';
      } else if (deps['svelte']) {
        values.FRAMEWORK = 'svelte';
      } else {
        values.FRAMEWORK = 'vanilla';
      }
    }
  } catch (error) {
    const packagePath = path.join(validatedProjectDir, 'package.json');
    log(`Warning: Could not read or parse package.json at ${packagePath} for project detection. Error: ${error.message}. This may be due to invalid JSON syntax, missing file, or permission issues. Using default framework detection values.`, colors.yellow);
    values.FRAMEWORK = 'vanilla';
    values.TYPESCRIPT = false;
    values.UI_LIBRARY = 'none';
    values.DEPENDENCY_COUNT = 0;
  }

  // Assign dynamic ports
  const dynamicPorts = await assignDynamicPorts();
  Object.assign(values, dynamicPorts);

  return values;
}

// =============================================================================
// TEMPLATE VALIDATION AND PROCESSING FUNCTIONS
// =============================================================================
// Functions: validateTemplate, checkBuildCompatibility, replaceTemplateVariables
// Purpose: Validate and process template files with variable replacement
// =============================================================================

/**
 * Validates a template by checking for required variables and syntax errors.
 * @param {string} templatePath - Path to the template directory
 * @param {Object} variables - Template variables object
 * @returns {Object} Validation result with errors and warnings arrays
 */
function validateTemplate(templatePath, variables) {
  const requiredVars = ['PROJECT_NAME', 'BUILD_OUTPUT_DIR', 'FRAMEWORK', 'TYPESCRIPT', 'UI_LIBRARY', 'DEPENDENCY_COUNT', 'DEV_PORT', 'PROD_PORT', 'NGINX_PORT'];
  const errors = [];
  const warnings = [];

  // Check for required variables
  const missingVars = requiredVars.filter(varName => !(varName in variables));
  if (missingVars.length > 0) {
    errors.push(`Missing required variables: ${missingVars.join(', ')}`);
  }

  // Check template files for syntax errors and undefined variables
  let files;
  try {
    files = fs.readdirSync(templatePath);
  } catch (error) {
    throw new Error(`Failed to read template directory at ${templatePath}. Error: ${error.message}. This may be due to directory not found, permission issues, or invalid path.`);
  }
  files.forEach(file => {
    const filePath = path.join(templatePath, file);
    let isFile;
    try {
      isFile = fs.statSync(filePath).isFile();
    } catch (error) {
      throw new Error(`Failed to stat file "${file}" at ${filePath}. Error: ${error.message}. This may be due to file not found or permission issues.`);
    }
    if (isFile) {
      try {
        // Validate file path before reading
        validateFilePath(filePath, templatePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const variableRegex = /\{\{(\w+)\}\}/g;
        let match;
        const foundVars = new Set();

        while ((match = variableRegex.exec(content)) !== null) {
          const varName = match[1];
          foundVars.add(varName);
          if (!(varName in variables)) {
            warnings.push(`Undefined template variable "${varName}" found in file "${file}". This may cause incomplete template processing.`);
          }
        }

        // Check for unmatched braces
        const openBraces = (content.match(/\{\{/g) || []).length;
        const closeBraces = (content.match(/\}\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push(`Template syntax error in "${file}": Unmatched template braces ({{ and }}). Found ${openBraces} opening braces and ${closeBraces} closing braces.`);
        }

        // Check for potentially dangerous content
        if (content.includes('<script') || content.includes('javascript:')) {
          warnings.push(`Potentially unsafe content detected in "${file}". Please review template content for security.`);
        }
      } catch (error) {
        const filePath = path.join(templatePath, file);
        errors.push(`Failed to validate template file "${file}" at ${filePath}. Error: ${error.message}. This may be due to file read permission issues, invalid file path, or corrupted file content.`);
      }
    }
  });

  return { errors, warnings };
}

/**
 * Checks build compatibility between framework and build output directory.
 * @param {string} framework - The detected framework
 * @param {string} buildOutputDir - The build output directory
 * @returns {Object} Compatibility check result with errors and warnings arrays
 */
function checkBuildCompatibility(framework, buildOutputDir) {
  const errors = [];
  const warnings = [];

  // Basic compatibility checks
  if (framework.includes('vite') && !buildOutputDir) {
    warnings.push('Vite framework detected but no build output directory specified');
  }

  if (framework.includes('next.js') && buildOutputDir !== 'out') {
    warnings.push('Next.js typically uses "out" as build directory, but detected different');
  }

  // Add more specific checks as needed

  return { errors, warnings };
}

/**
 * Replaces template variables in content with provided values.
 * @param {string} content - The template content
 * @param {Object} variables - Variables to replace
 * @returns {string} Content with variables replaced
 */
function replaceTemplateVariables(content, variables) {
  let result = content;
  const regex = /\{\{(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variableName = match[1];
    let replacement = variables[variableName];

    // Validate and sanitize template variables
    if (replacement !== undefined) {
      try {
        replacement = sanitizeTemplateVariable(replacement);
      } catch (error) {
        log(`Warning: Failed to sanitize template variable "${variableName}". Error: ${error.message}. This may be due to invalid variable value type or length. Keeping original placeholder.`, colors.yellow);
        replacement = `{{${variableName}}}`; // Keep original placeholder on sanitization failure
      }
    } else {
      replacement = `{{${variableName}}}`; // Keep original placeholder if variable not found
    }

    result = result.replace(new RegExp(`\\{\\{${variableName}\\}\\}`, 'g'), replacement);
  }

  return result;
}

// =============================================================================
// PORT MANAGEMENT FUNCTIONS
// =============================================================================
// Functions: checkPortAvailability, findAvailablePort, assignDynamicPorts
// Purpose: Manage port allocation and availability checking
// =============================================================================

/**
 * Checks if a port is available for binding.
 * @param {number} port - The port number to check
 * @returns {Promise<boolean>} True if port is available, false otherwise
 */
function checkPortAvailability(port) {
  return new Promise((resolve) => {
    // Validate port before checking availability
    try {
      validatePort(port);
    } catch (error) {
      log(`Invalid port for availability check: ${error.message}`, colors.red);
      resolve(false);
      return;
    }

    const net = require('net');
    const server = net.createServer();

    server.listen(port, '127.0.0.1', () => {
      server.close();
      resolve(true); // Port is available
    });

    server.on('error', (error) => {
      log(`Port ${port} availability check failed: ${error.message}`, colors.yellow);
      resolve(false); // Port is in use or invalid
    });
  });
}

/**
 * Finds an available port starting from a given port number.
 * @param {number} startPort - The port number to start searching from
 * @param {number} maxAttempts - Maximum number of attempts (default: 100)
 * @returns {Promise<number>} The first available port found
 * @throws {Error} If no available port is found within maxAttempts
 */
async function findAvailablePort(startPort, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await checkPortAvailability(port)) {
      return port;
    }
  }
  throw new Error(`Could not find available port starting from ${startPort}`);
}

/**
 * Assigns dynamic ports for development, production, and nginx services.
 * @returns {Promise<Object>} Object containing assigned port numbers
 */
async function assignDynamicPorts() {
  const defaultPorts = {
    DEV_PORT: 3000,
    PROD_PORT: 8080,
    NGINX_PORT: 80
  };

  const assignedPorts = {};

  for (const [key, defaultPort] of Object.entries(defaultPorts)) {
    const isAvailable = await checkPortAvailability(defaultPort);
    if (isAvailable) {
      assignedPorts[key] = defaultPort;
    } else {
      try {
        assignedPorts[key] = await findAvailablePort(defaultPort + 1);
        log(`${colors.yellow}Port ${defaultPort} is in use, assigned ${assignedPorts[key]} instead${colors.reset}`);
      } catch (error) {
        log(`${colors.red}Error finding available port for ${key}: ${error.message}${colors.reset}`);
        assignedPorts[key] = defaultPort; // Fallback to default
      }
    }
  }

  return assignedPorts;
}

// =============================================================================
// CLI INTERFACE FUNCTIONS
// =============================================================================
// Functions: showHelp, showVersion, listTemplates
// Purpose: Command-line interface and user interaction
// =============================================================================

/**
 * Displays help information for the CLI tool.
 */
function showHelp() {
  log(`
${colors.bold}${colors.blue}Figma Docker Init${colors.reset}
Quick-start Docker setup for Figma-exported React/Vite/TypeScript projects

${colors.bold}Usage:${colors.reset}
  figma-docker-init [template] [options]

${colors.bold}Templates:${colors.reset}
  basic      Basic Docker setup with minimal configuration
  ui-heavy   Optimized for UI-heavy applications with advanced caching

${colors.bold}Options:${colors.reset}
  -h, --help     Show this help message
  -v, --version  Show version number
  --list         List available templates

${colors.bold}Examples:${colors.reset}
  figma-docker-init basic
  figma-docker-init ui-heavy
  figma-docker-init --list
`);
}

/**
 * Displays version information.
 */
function showVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    log(`figma-docker-init v${pkg.version}`, colors.blue);
  } else {
    log('figma-docker-init v1.0.0', colors.blue);
  }
}

/**
 * Lists available templates.
 */
function listTemplates() {
  log(`${colors.bold}Available Templates:${colors.reset}\n`);

    if (!fs.existsSync(TEMPLATES_DIR)) {
    log(`Error: Templates directory not found at ${TEMPLATES_DIR}. Please ensure the templates directory exists and is accessible.`, colors.red);
    return;
  }

  const templates = fs.readdirSync(TEMPLATES_DIR).filter(item => {
    return fs.statSync(path.join(TEMPLATES_DIR, item)).isDirectory();
  });

  if (templates.length === 0) {
    log('No templates available', colors.yellow);
    return;
  }

  templates.forEach(template => {
    log(`  ${colors.blue}${template}${colors.reset}`);
  });
}

// =============================================================================
// UTILITIES
// =============================================================================
// Functions: log, colors
// Purpose: Logging and console output formatting
// =============================================================================

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Logs a message to the console with optional color formatting.
 * @param {string} message - The message to log
 * @param {string} color - The color code to use (default: reset)
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// =============================================================================
// MAIN APPLICATION LOGIC
// =============================================================================
// Functions: copyTemplate, main
// Purpose: Core workflow orchestration and CLI entry point
// =============================================================================

/**
 * Copies and processes a template to the target directory.
 * @param {string} templateName - Name of the template to copy
 * @param {string} targetDir - Target directory (default: '.')
 * @returns {Promise<void>}
 */
async function copyTemplate(templateName, targetDir = '.') {
  // Validate template name
  const validatedTemplateName = validateTemplateName(templateName);

  // Validate target directory
  const validatedTargetDir = validateProjectDirectory(targetDir);

  // Check if template exists
  const templatePath = path.join(TEMPLATES_DIR, validatedTemplateName);
  if (!fs.existsSync(templatePath)) {
    log(`Template "${validatedTemplateName}" not found!`, colors.red);
    log(`Available templates: ${fs.readdirSync(TEMPLATES_DIR).filter(item => fs.statSync(path.join(TEMPLATES_DIR, item)).isDirectory()).join(', ')}`, colors.yellow);
    process.exit(1);
  }

  log(`${colors.bold}${colors.blue}Setting up Docker configuration for "${validatedTemplateName}" template...${colors.reset}\n`);

  // Detect project values
  const projectValues = await detectProjectValues(validatedTargetDir);

  // Validate template
  const validation = validateTemplate(templatePath, projectValues);
  if (validation.errors.length > 0) {
    log(`${colors.red}Template validation errors:${colors.reset}`);
    validation.errors.forEach(error => log(`  ${colors.red}✗${colors.reset} ${error}`));
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    log(`${colors.yellow}Template validation warnings:${colors.reset}`);
    validation.warnings.forEach(warning => log(`  ${colors.yellow}⚠${colors.reset} ${warning}`));
  }

  // Check build compatibility
  const compatibility = checkBuildCompatibility(projectValues.FRAMEWORK, projectValues.BUILD_OUTPUT_DIR);
  if (compatibility.errors.length > 0) {
    log(`${colors.red}Build compatibility errors:${colors.reset}`);
    compatibility.errors.forEach(error => log(`  ${colors.red}✗${colors.reset} ${error}`));
    process.exit(1);
  }

  if (compatibility.warnings.length > 0) {
    log(`${colors.yellow}Build compatibility warnings:${colors.reset}`);
    compatibility.warnings.forEach(warning => log(`  ${colors.yellow}⚠${colors.reset} ${warning}`));
  }

  // Process template files
  let files;
  try {
    files = fs.readdirSync(templatePath);
  } catch (error) {
    log(`Error: Failed to read template directory at ${templatePath}. Error: ${error.message}. This may be due to directory not found, permission issues, or invalid path.`, colors.red);
    throw error;
  }
  const copiedFiles = [];
  const skippedFiles = [];

  files.forEach(file => {
    const sourcePath = path.join(templatePath, file);
    const targetPath = path.join(validatedTargetDir, file);

    try {
      // Validate file paths
      validateFilePath(sourcePath, TEMPLATES_DIR);
      validateFilePath(targetPath, validatedTargetDir);

      if (fs.existsSync(targetPath)) {
        log(`  ${colors.yellow}Skipped${colors.reset} ${file} (already exists)`);
        skippedFiles.push(file);
      } else {
        // Read template content and replace variables
        let templateContent;
        try {
          templateContent = fs.readFileSync(sourcePath, 'utf8');
        } catch (error) {
          log(`Error: Failed to read template file "${file}" from ${sourcePath}. Error: ${error.message}. This may be due to file not found, permission issues, or corrupted file.`, colors.red);
          throw error;
        }
        const processedContent = replaceTemplateVariables(templateContent, projectValues);

        // Write processed content to target file
        try {
          fs.writeFileSync(targetPath, processedContent);
          log(`  ${colors.green}Created${colors.reset} ${file}`);
        } catch (error) {
          log(`Error: Failed to write template file "${file}" to ${targetPath}. Error: ${error.message}. This may be due to insufficient permissions, disk space issues, or invalid file path.`, colors.red);
          throw error;
        }
        copiedFiles.push(file);
      }
    } catch (error) {
      log(`${colors.red}Error processing ${file}: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  });

  log(`\n${colors.bold}${colors.green}Setup Complete!${colors.reset}`);
  log(`${colors.bold}Files created:${colors.reset} ${copiedFiles.length}`);
  log(`${colors.bold}Files skipped:${colors.reset} ${skippedFiles.length}`);

  if (copiedFiles.length > 0) {
    log(`\n${colors.bold}Port Assignments:${colors.reset}`);
    log(`  ${colors.blue}Development server:${colors.reset} http://localhost:${projectValues.DEV_PORT}`);
    log(`  ${colors.blue}Production server:${colors.reset} http://localhost:${projectValues.PROD_PORT}`);
    log(`  ${colors.blue}Nginx proxy:${colors.reset} http://localhost:${projectValues.NGINX_PORT}`);

    log(`\n${colors.bold}Next Steps:${colors.reset}`);
    log(`1. Review and customize the generated Docker configuration files`);
    log(`2. Update environment variables in .env.example and rename to .env`);
    log(`3. Build and run your Docker container:`);
    log(`   ${colors.blue}docker-compose up --build${colors.reset}`);

    if (fs.existsSync(path.join(targetDir, 'DOCKER.md'))) {
      log(`4. Read DOCKER.md for detailed documentation and advanced usage`);
    }
  }

  if (skippedFiles.length > 0) {
    log(`\n${colors.yellow}Note: Some files were skipped because they already exist.${colors.reset}`);
    log(`${colors.yellow}Remove existing files if you want to regenerate them.${colors.reset}`);
  }
}

/**
 * Main entry point for the CLI application.
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return;
  }

  if (args.includes('--list')) {
    listTemplates();
    return;
  }

  const templateName = args[0];

  if (!templateName) {
    log('Please specify a template name!', colors.red);
    showHelp();
    process.exit(1);
  }

  // Validate current directory has package.json (basic sanity check)
  if (!fs.existsSync('./package.json')) {
    log(`${colors.yellow}Warning: No package.json found in current directory.${colors.reset}`);
    log(`${colors.yellow}Make sure you're in the root of your project.${colors.reset}\n`);
  }

  copyTemplate(templateName);
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`${colors.red}Error: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`${colors.red}Unhandled Rejection: ${reason}${colors.reset}`);
  process.exit(1);
});

// Only run main() when this file is executed directly (not when imported for testing)
// Check if this module is the main module being executed
// Handle both direct execution and symlink execution (e.g., via npm bin)
const isMainModule = process.argv[1] && (
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
  fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])
);

if (isMainModule) {
  main();
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

export {
  // Custom Error Classes
  ValidationError,
  ConfigError,

  // Validation Functions
  sanitizeString,
  validateTemplateName,
  validateProjectDirectory,
  validatePort,
  validateProjectName,
  sanitizeTemplateVariable,
  validateFilePath,

  // Config Parsing Functions
  parseConfig,
  parseViteConfig,
  parseRollupConfig,
  parseWebpackConfig,
  detectBuildOutputDir,
  detectProjectValues,

  // Template Processing Functions
  validateTemplate,
  checkBuildCompatibility,
  replaceTemplateVariables,

  // Port Management Functions
  checkPortAvailability,
  findAvailablePort,
  assignDynamicPorts,

  // CLI Interface Functions
  showHelp,
  showVersion,
  listTemplates,

  // Main Logic Functions
  copyTemplate
};