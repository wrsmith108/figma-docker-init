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

export class TemplateValidator {
  /**
   * Validate Dockerfile content
   * @param {string} content - Dockerfile content
   * @returns {object} Validation result with errors and warnings
   */
  validateDockerfile(content) {
    const errors = [];
    const warnings = [];
    const lines = content.split('\n');

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

    // Check for security issues
    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Check for secrets in ENV
      if (trimmed.startsWith('ENV') && /password|secret|key|token/i.test(trimmed)) {
        errors.push(`Line ${idx + 1}: Potential secret in ENV instruction`);
      }

      // Check for latest tag
      if (trimmed.startsWith('FROM') && trimmed.includes(':latest')) {
        warnings.push(`Line ${idx + 1}: Using :latest tag - pin to specific version`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
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
}

export default TemplateValidator;
