/**
 * Template Validator
 *
 * Validates Dockerfile and docker-compose.yml templates for:
 * - Syntax correctness
 * - Security best practices
 * - Multi-stage build structure
 * - Layer optimization
 * - Health checks
 */

import fs from 'fs/promises';

export class TemplateValidator {
  constructor() {
    this.validInstructions = new Set([
      'FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV',
      'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER',
      'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'
    ]);

    this.secureBaseImages = [
      /^node:\d+(\.\d+)?-alpine$/,
      /^node:\d+(\.\d+)?-alpine3\.\d+$/,
      /^nginx:\d+(\.\d+)?-alpine$/,
      /^python:\d+(\.\d+)?-alpine$/
    ];
  }

  /**
   * Validate Dockerfile at path
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Validation result with errors and warnings
   */
  async validateDockerfile(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      return this.validateDockerfileContent(content);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read Dockerfile: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate Dockerfile content
   * @param {string} content - Dockerfile content
   * @returns {object} Validation result with errors and warnings
   */
  validateDockerfileContent(content) {
    const errors = [];
    const warnings = [];

    // Replace template variables with placeholders before validation
    // This allows validation of templates with {{VARIABLE}} syntax
    const normalizedContent = content.replace(/\{\{[^}]+\}\}/g, 'TEMPLATE_VAR');

    const lines = normalizedContent.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    });

    if (lines.length === 0) {
      errors.push('Dockerfile is empty');
      return { valid: false, errors, warnings };
    }

    // Check for FROM instruction
    const fromLine = lines[0].trim();
    if (!fromLine.startsWith('FROM')) {
      errors.push('Dockerfile must start with FROM instruction');
    }

    // Validate each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Handle multi-line instructions (backslash continuation)
      if (line.endsWith('\\')) {
        continue;
      }

      // Extract instruction
      const instruction = line.split(/\s+/)[0];

      if (!this.validInstructions.has(instruction)) {
        errors.push(`Line ${i + 1}: Invalid instruction '${instruction}'`);
      }

      // Validate instruction has arguments
      const args = line.slice(instruction.length).trim();
      if (!args && instruction !== 'CMD' && instruction !== 'ENTRYPOINT') {
        errors.push(`Line ${i + 1}: Instruction '${instruction}' missing arguments`);
      }

      // Check for secrets in ENV (but not template variables)
      if (instruction === 'ENV' && /password|secret|key|token/i.test(line) && !line.includes('TEMPLATE_VAR')) {
        errors.push(`Line ${i + 1}: Potential secret in ENV instruction`);
      }

      // Check for latest tag
      if (instruction === 'FROM' && line.includes(':latest')) {
        warnings.push(`Line ${i + 1}: Using :latest tag - pin to specific version`);
      }
    }

    // Check for multi-stage build
    const fromStatements = lines.filter(l => l.trim().startsWith('FROM'));
    if (fromStatements.length < 2) {
      warnings.push('Consider using multi-stage build for smaller images');
    }

    // Check for non-root user
    const hasUser = lines.some(l => l.trim().startsWith('USER') && !l.includes('root'));
    if (!hasUser) {
      warnings.push('Running as root - consider using non-root user for security');
    }

    // Check for health check
    const hasHealthCheck = lines.some(l => l.trim().startsWith('HEALTHCHECK'));
    if (!hasHealthCheck) {
      warnings.push('No HEALTHCHECK instruction found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single Dockerfile instruction
   * @param {string} instruction - Single Dockerfile instruction
   * @returns {Promise<boolean>} True if valid
   */
  async validateInstruction(instruction) {
    const trimmed = instruction.trim();

    if (!trimmed) {
      return false;
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0];

    // Check if instruction is valid
    if (!this.validInstructions.has(command)) {
      return false;
    }

    // Check if instruction has arguments
    if (parts.length === 1 && command !== 'CMD' && command !== 'ENTRYPOINT') {
      return false;
    }

    // Validate FROM instruction format
    if (command === 'FROM') {
      if (parts.length < 2) {
        return false;
      }

      const image = parts[1];

      // Must specify version (not :latest or no tag)
      if (image.endsWith(':latest') || !image.includes(':')) {
        return false;
      }

      return true;
    }

    // Validate RUN instruction
    if (command === 'RUN') {
      if (parts.length < 2) {
        return false;
      }
      return true;
    }

    return true;
  }

  /**
   * Validate multi-stage build structure
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Validation result
   */
  async validateMultiStage(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const lines = content.split('\n');

      const fromInstructions = lines
        .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
        .filter(({ line }) => line.startsWith('FROM'));

      if (fromInstructions.length < 2) {
        return {
          valid: false,
          errors: ['Multi-stage build requires at least 2 FROM instructions'],
          stages: []
        };
      }

      const stages = fromInstructions.map(({ line, lineNumber }) => {
        const match = line.match(/FROM\s+\S+\s+AS\s+(\S+)/i);
        return {
          lineNumber,
          name: match ? match[1] : null,
          hasAlias: !!match
        };
      });

      const errors = [];

      // Check if all stages except last have aliases
      for (let i = 0; i < stages.length - 1; i++) {
        if (!stages[i].hasAlias) {
          errors.push(`Stage at line ${stages[i].lineNumber} should have an alias (AS <name>)`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        stages
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate multi-stage build: ${error.message}`],
        stages: []
      };
    }
  }

  /**
   * Validate base image security
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Validation result
   */
  async validateBaseImage(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const lines = content.split('\n');

      const fromLine = lines.find(line => line.trim().startsWith('FROM'));

      if (!fromLine) {
        return {
          valid: false,
          errors: ['No FROM instruction found'],
          warnings: []
        };
      }

      const match = fromLine.match(/FROM\s+(\S+)/);
      if (!match) {
        return {
          valid: false,
          errors: ['Invalid FROM instruction format'],
          warnings: []
        };
      }

      const image = match[1];
      const errors = [];
      const warnings = [];

      // Check for :latest tag
      if (image.endsWith(':latest') || !image.includes(':')) {
        errors.push('Base image should not use :latest tag; pin specific version');
      }

      // Check for Alpine (secure, minimal)
      const isAlpine = this.secureBaseImages.some(pattern => pattern.test(image));
      if (!isAlpine && !errors.length) {
        warnings.push('Consider using Alpine-based images for smaller, more secure containers');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        image
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate base image: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate layer optimization
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Validation result
   */
  async validateLayerOptimization(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const lines = content.split('\n').map(l => l.trim());

      const errors = [];
      const warnings = [];
      const suggestions = [];

      // Check for package file copy before source code
      const copyLines = lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.startsWith('COPY'));

      const packageCopy = copyLines.find(({ line }) =>
        line.includes('package.json') || line.includes('package*.json')
      );

      const srcCopy = copyLines.find(({ line }) =>
        line.match(/COPY\s+\.\s+/) || line.match(/COPY\s+src\s+/)
      );

      if (srcCopy && packageCopy && srcCopy.index < packageCopy.index) {
        warnings.push('Copy package files before source code for better caching');
      }

      // Check for npm ci vs npm install
      const npmInstall = lines.find(line => line.includes('npm install'));
      if (npmInstall && !npmInstall.includes('npm ci')) {
        suggestions.push('Use "npm ci" instead of "npm install" for reproducible builds');
      }

      // Check for cache cleanup
      const hasCleanup = lines.some(line =>
        line.includes('npm cache clean') ||
        line.includes('rm -rf /var/cache') ||
        line.includes('apt-get clean')
      );

      if (!hasCleanup) {
        suggestions.push('Clean up package manager cache to reduce image size');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to validate layer optimization: ${error.message}`],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Validate docker-compose.yml file
   * @param {string} composePath - Path to docker-compose.yml
   * @returns {Promise<object>} Validation result
   */
  async validateCompose(composePath) {
    try {
      const content = await fs.readFile(composePath, 'utf-8');
      return this.validateDockerCompose(content);
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read docker-compose.yml: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Alias for validateCompose for backward compatibility
   * @param {string} composePath - Path to docker-compose.yml
   * @returns {Promise<object>} Validation result
   */
  async validateComposeFile(composePath) {
    return this.validateCompose(composePath);
  }

  /**
   * Extract template variables from a file
   * @param {string} filePath - Path to template file
   * @returns {Promise<Array<string>>} Array of variable names
   */
  async extractTemplateVariables(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Extract {{ variable }} style variables
      const matches = content.match(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g) || [];

      // Extract just the variable names
      const variables = matches.map(match => {
        const varMatch = match.match(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/);
        return varMatch ? varMatch[1] : null;
      }).filter(Boolean);

      // Return unique variables
      return [...new Set(variables)];
    } catch (error) {
      return [];
    }
  }

  /**
   * Estimate build complexity of a Dockerfile
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Complexity assessment
   */
  async estimateBuildComplexity(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

      let complexity = 0;

      // Count RUN instructions (expensive)
      const runCount = lines.filter(l => l.startsWith('RUN')).length;
      complexity += runCount * 3;

      // Count COPY/ADD instructions
      const copyCount = lines.filter(l => l.startsWith('COPY') || l.startsWith('ADD')).length;
      complexity += copyCount * 1;

      // Check for multi-stage builds (adds complexity but improves efficiency)
      const fromCount = lines.filter(l => l.startsWith('FROM')).length;
      complexity += (fromCount - 1) * 2;

      // Check for package installation
      const hasNpmInstall = lines.some(l => l.includes('npm install') || l.includes('npm ci'));
      if (hasNpmInstall) complexity += 5;

      // Determine level
      let level;
      if (complexity < 10) level = 'low';
      else if (complexity < 20) level = 'medium';
      else level = 'high';

      return {
        level,
        score: complexity,
        runCommands: runCount,
        copyOperations: copyCount,
        stages: fromCount
      };
    } catch (error) {
      return {
        level: 'unknown',
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Validate docker-compose.yml content
   * @param {string} content - docker-compose.yml content
   * @returns {object} Validation result
   */
  validateDockerCompose(content) {
    const errors = [];
    const warnings = [];

    // Basic YAML structure check
    if (!content.includes('version:') && !content.includes('services:')) {
      errors.push('Invalid docker-compose.yml structure');
    }

    // Check for exposed secrets
    if (/password.*:|.*_password:.*[^$]/i.test(content)) {
      errors.push('Potential hardcoded password found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if Dockerfile follows best practices
   * @param {string} content - Dockerfile content
   * @returns {object} Best practices report
   */
  checkBestPractices(content) {
    const recommendations = [];
    const lines = content.split('\n');

    // Check layer optimization
    const runStatements = lines.filter(l => l.trim().startsWith('RUN'));
    if (runStatements.length > 5) {
      recommendations.push('Consider combining RUN statements to reduce layers');
    }

    // Check for package.json caching
    const hasCopyPackageJson = lines.some(l =>
      l.includes('COPY') && l.includes('package.json')
    );
    if (!hasCopyPackageJson) {
      recommendations.push('Copy package.json separately for better layer caching');
    }

    // Check for .dockerignore mention
    recommendations.push('Ensure .dockerignore excludes node_modules, .git, etc.');

    return { recommendations };
  }

  /**
   * Check if a template variable has a default value
   * @param {string} varName - Variable name to check
   * @returns {Promise<boolean>} True if variable has default value
   */
  async hasDefaultValue(varName) {
    // Check if variable uses ${VAR:-default} syntax
    const defaultValuePattern = new RegExp(`\\$\\{${varName}:-[^}]+\\}`, 'g');

    // This would need to scan template files to check
    // For now, return false as default (conservative approach)
    // In a full implementation, this would scan actual template content
    return false;
  }

  /**
   * Check if a template variable is marked as required
   * @param {string} varName - Variable name to check
   * @returns {Promise<boolean>} True if variable is required
   */
  async isRequiredVariable(varName) {
    // List of variables that are typically required in Docker templates
    const requiredVars = [
      'PROJECT_NAME',
      'NODE_VERSION',
      'PORT',
      'DEV_PORT',
      'PROD_PORT',
      'BUILD_OUTPUT_DIR',
      'FRAMEWORK',
      'INSTALL_COMMAND',
      'BUILD_COMMAND',
      'DEV_COMMAND'
    ];

    return requiredVars.includes(varName);
  }

  /**
   * Validate a single Dockerfile instruction
   * @param {string} instruction - Dockerfile instruction to validate
   * @returns {Promise<boolean>} True if instruction is valid
   */
  /**
   * Estimate the complexity of building the Docker image
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Complexity estimate
   */
  async estimateBuildComplexity(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const lines = content.split('\n');

      const runCommands = lines.filter(l => l.trim().startsWith('RUN')).length;
      const copyCommands = lines.filter(l => l.trim().startsWith('COPY')).length;
      const fromStages = lines.filter(l => l.trim().startsWith('FROM')).length;

      const complexity = runCommands * 2 + copyCommands + fromStages * 3;

      return {
        score: complexity,
        level: complexity < 10 ? 'low' : complexity < 20 ? 'medium' : 'high',
        runCommands,
        copyCommands,
        stages: fromStages
      };
    } catch (error) {
      return { score: 0, level: 'unknown', error: error.message };
    }
  }

  /**
   * Check if Dockerfile minimizes final stage size
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Validation result
   */
  async minimizeFinalStageSize(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const recommendations = [];

      // Check for Alpine base
      if (!content.includes('alpine')) {
        recommendations.push('Consider using Alpine-based images for smaller size');
      }

      // Check for multi-stage build
      const fromCount = (content.match(/^FROM /gm) || []).length;
      if (fromCount < 2) {
        recommendations.push('Use multi-stage build to reduce final image size');
      }

      // Check for layer optimization
      const runCount = (content.match(/^RUN /gm) || []).length;
      if (runCount > 5) {
        recommendations.push('Combine RUN commands to reduce layers');
      }

      return {
        optimized: recommendations.length === 0,
        recommendations
      };
    } catch (error) {
      return { optimized: false, recommendations: [], error: error.message };
    }
  }

  /**
   * Validate base image for security vulnerabilities
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Security validation result
   */
  async validateSecurityVulnerabilities(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');
      const issues = [];

      // Check for latest tag
      if (content.includes(':latest')) {
        issues.push('Using :latest tag creates unpredictable builds');
      }

      // Check for running as root
      if (!content.includes('USER ')) {
        issues.push('Container runs as root user');
      }

      // Check for exposed secrets
      if (/password|secret|key/i.test(content) && /[=:]\s*\w+/.test(content)) {
        issues.push('Potential hardcoded secrets detected');
      }

      return {
        secure: issues.length === 0,
        issues,
        severity: issues.length > 2 ? 'high' : issues.length > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      return { secure: false, issues: [], error: error.message };
    }
  }

  /**
   * Validate health check command configuration
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Health check validation result
   */
  async validateHealthCheckCommand(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const hasHealthCheck = content.includes('HEALTHCHECK');
      const recommendations = [];

      if (!hasHealthCheck) {
        recommendations.push('Add HEALTHCHECK instruction for container monitoring');
      }

      return {
        hasHealthCheck,
        valid: hasHealthCheck,
        recommendations
      };
    } catch (error) {
      return { hasHealthCheck: false, valid: false, error: error.message };
    }
  }

  /**
   * Check if Dockerfile uses non-root user
   * @param {string} dockerfilePath - Path to Dockerfile
   * @returns {Promise<object>} Non-root user check result
   */
  async checkNonRootUser(dockerfilePath) {
    try {
      const content = await fs.readFile(dockerfilePath, 'utf-8');

      const hasUserInstruction = content.includes('USER ');
      const usesNodeUser = /USER\s+node/.test(content);

      return {
        usesNonRoot: hasUserInstruction,
        usesNodeUser,
        recommended: usesNodeUser || hasUserInstruction
      };
    } catch (error) {
      return { usesNonRoot: false, usesNodeUser: false, error: error.message };
    }
  }

  /**
   * Check Docker image for known vulnerabilities
   * @param {string} baseImage - Base image name (e.g., 'node:20-alpine')
   * @returns {Promise<Array<object>>} Array of vulnerabilities with severity levels
   *
   * NOTE: This is a simple implementation that checks for known patterns.
   * For production use, integrate with actual vulnerability scanners like:
   * - Trivy (trivy image <image>)
   * - Snyk (snyk container test <image>)
   * - Docker Scout (docker scout cves <image>)
   */
  async checkImageVulnerabilities(baseImage) {
    const vulnerabilities = [];

    // Check for using latest tag (security anti-pattern)
    if (baseImage.includes(':latest') || !baseImage.includes(':')) {
      vulnerabilities.push({
        severity: 'high',
        title: 'Using :latest or untagged image',
        description: 'Unversioned images create unpredictable builds and security risks',
        recommendation: 'Pin to a specific version tag (e.g., node:20.8.1-alpine)'
      });
    }

    // Check for non-Alpine images (larger attack surface)
    if (!baseImage.includes('alpine') && !baseImage.includes('slim')) {
      vulnerabilities.push({
        severity: 'medium',
        title: 'Using full-size base image',
        description: 'Full images have larger attack surface and more vulnerabilities',
        recommendation: 'Consider using Alpine-based images for smaller size and fewer vulnerabilities'
      });
    }

    // Check for outdated Node.js versions
    const nodeVersionMatch = baseImage.match(/node:(\d+)/);
    if (nodeVersionMatch) {
      const majorVersion = parseInt(nodeVersionMatch[1]);
      if (majorVersion < 18) {
        vulnerabilities.push({
          severity: 'critical',
          title: 'Outdated Node.js version',
          description: `Node.js ${majorVersion} is past or approaching end-of-life`,
          recommendation: 'Upgrade to Node.js 18 LTS or 20 LTS'
        });
      }
    }

    // Alpine-based images generally have very few vulnerabilities
    // Return low vulnerability count for properly versioned Alpine images
    if (baseImage.includes('alpine') && baseImage.match(/:\d+/)) {
      // These images typically have 0-2 low-severity vulnerabilities
      // Return empty or minimal vulnerabilities for well-maintained Alpine images
      return vulnerabilities.length > 0 ? vulnerabilities : [];
    }

    return vulnerabilities;
  }
}

export default TemplateValidator;
