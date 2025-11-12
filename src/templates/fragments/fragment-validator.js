/**
 * Fragment Validator
 *
 * Validates Docker template fragments for correctness and security.
 * Ensures fragments are safe to compose and don't contain malicious code.
 *
 * @module templates/fragments/fragment-validator
 */

import { FragmentValidationRules } from './fragment-types.js';

/**
 * FragmentValidator - Validates fragments before composition
 */
export class FragmentValidator {
  constructor() {
    this.validationErrors = [];
    this.validationWarnings = [];
  }

  /**
   * Validates a single fragment
   *
   * @param {string} content - Fragment content
   * @param {Object} metadata - Fragment metadata
   * @returns {Object} Validation result
   *
   * @example
   * const validator = new FragmentValidator();
   * const result = validator.validateFragment(content, metadata);
   * if (!result.valid) {
   *   console.error(result.errors);
   * }
   */
  validateFragment(content, metadata) {
    const errors = [];
    const warnings = [];

    // Basic content validation
    if (!content || content.trim().length === 0) {
      errors.push('Fragment content is empty');
      return { valid: false, errors, warnings };
    }

    // Validate structure
    const structureResult = FragmentValidationRules.validateStructure(content, metadata);
    errors.push(...structureResult.errors);
    warnings.push(...structureResult.warnings);

    // Validate file type
    if (metadata.type === 'framework' || metadata.type === 'backend') {
      if (!content.includes('Dockerfile') && !content.includes('RUN')) {
        warnings.push('Fragment may not be a valid Dockerfile fragment');
      }
    } else if (metadata.type === 'database') {
      if (!content.includes('image:') && !content.includes('services:')) {
        warnings.push('Fragment may not be a valid docker-compose fragment');
      }
    }

    // Security validation
    const securityResult = this.validateSecurity(content);
    errors.push(...securityResult.errors);
    warnings.push(...securityResult.warnings);

    // Syntax validation
    const syntaxResult = this.validateSyntax(content, metadata.type);
    errors.push(...syntaxResult.errors);
    warnings.push(...syntaxResult.warnings);

    this.validationErrors = errors;
    this.validationWarnings = warnings;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      usedVariables: structureResult.usedVariables
    };
  }

  /**
   * Validates fragment security
   *
   * @param {string} content - Fragment content
   * @returns {Object} Security validation result
   */
  validateSecurity(content) {
    const errors = [];
    const warnings = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      { pattern: /rm\s+-rf\s+\/(?![a-z])/i, message: 'Dangerous rm -rf / command detected' },
      { pattern: /chmod\s+777/i, message: 'Insecure chmod 777 detected' },
      { pattern: /curl\s+[^|]+\|\s*sh/i, message: 'Dangerous curl | sh pattern detected' },
      { pattern: /wget\s+[^|]+\|\s*sh/i, message: 'Dangerous wget | sh pattern detected' },
      { pattern: /eval\s*\(/i, message: 'Potentially dangerous eval() detected' },
      { pattern: /\$\(curl/i, message: 'Command substitution with curl detected' }
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        errors.push(message);
      }
    });

    // Check for hardcoded secrets
    const secretPatterns = [
      { pattern: /password\s*=\s*["'][^"']{8,}["']/i, message: 'Hardcoded password detected' },
      { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/i, message: 'Hardcoded API key detected' },
      { pattern: /secret\s*=\s*["'][^"']{8,}["']/i, message: 'Hardcoded secret detected' }
    ];

    secretPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        warnings.push(message);
      }
    });

    // Check for proper user handling
    if (content.includes('USER root') && !content.includes('USER ')) {
      warnings.push('Container runs as root user - consider switching to non-root user');
    }

    return { errors, warnings };
  }

  /**
   * Validates fragment syntax
   *
   * @param {string} content - Fragment content
   * @param {string} type - Fragment type
   * @returns {Object} Syntax validation result
   */
  validateSyntax(content, type) {
    const errors = [];
    const warnings = [];

    if (type === 'framework' || type === 'backend') {
      // Dockerfile syntax validation
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Check for valid Dockerfile instructions
        if (trimmed && !trimmed.startsWith('#')) {
          const instruction = trimmed.split(/\s+/)[0];
          const validInstructions = ['FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV',
                                     'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'USER',
                                     'WORKDIR', 'ARG', 'ONBUILD', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'];

          if (!validInstructions.includes(instruction.toUpperCase()) && instruction.length > 0) {
            // Might be a continuation line
            if (!trimmed.startsWith('&&') && !trimmed.startsWith('||') && !trimmed.endsWith('\\')) {
              warnings.push(`Line ${index + 1}: Possibly invalid Dockerfile instruction: ${instruction}`);
            }
          }
        }

        // Check for unescaped variables that should use template syntax
        if (trimmed.includes('$') && !trimmed.includes('{{')) {
          const shellVarPattern = /\$[A-Z_]+/;
          if (shellVarPattern.test(trimmed)) {
            warnings.push(`Line ${index + 1}: Found shell variable - consider using {{VAR}} template syntax`);
          }
        }
      });
    } else if (type === 'database') {
      // docker-compose YAML syntax validation
      const requiredKeys = ['image:', 'container_name:', 'networks:'];
      const hasRequiredKeys = requiredKeys.some(key => content.includes(key));

      if (!hasRequiredKeys) {
        warnings.push('Missing common docker-compose keys (image, container_name, or networks)');
      }

      // Check for proper indentation
      const lines = content.split('\n');
      let lastIndent = -1;
      lines.forEach((line, index) => {
        if (line.trim().length > 0 && !line.trim().startsWith('#')) {
          const indent = line.search(/\S/);
          if (indent !== -1 && indent % 2 !== 0) {
            warnings.push(`Line ${index + 1}: YAML indentation should be multiples of 2 spaces`);
          }
        }
      });
    }

    return { errors, warnings };
  }

  /**
   * Validates multiple fragments for compatibility
   *
   * @param {Array} fragments - Array of {content, metadata} objects
   * @param {Map} fragmentRegistry - Registry of all available fragments
   * @returns {Object} Compatibility validation result
   */
  validateCompatibility(fragments, fragmentRegistry) {
    const fragmentNames = fragments.map(f => f.metadata.name);
    return FragmentValidationRules.validateCompatibility(fragmentNames, fragmentRegistry);
  }

  /**
   * Gets validation errors
   * @returns {string[]} Array of error messages
   */
  getErrors() {
    return this.validationErrors;
  }

  /**
   * Gets validation warnings
   * @returns {string[]} Array of warning messages
   */
  getWarnings() {
    return this.validationWarnings;
  }

  /**
   * Clears validation results
   */
  clear() {
    this.validationErrors = [];
    this.validationWarnings = [];
  }
}

export default FragmentValidator;
