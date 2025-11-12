/**
 * Fragment Types and Interfaces
 *
 * Defines types and validation for Docker template fragments.
 * Fragments are composable pieces that can be merged into base templates.
 *
 * @module templates/fragments/fragment-types
 */

/**
 * Fragment types supported by the system
 */
export const FragmentType = {
  FRAMEWORK: 'framework',
  DATABASE: 'database',
  BACKEND: 'backend'
};

/**
 * Insertion points where fragments can be inserted
 */
export const InsertionPoint = {
  FRAMEWORK_BUILD_STEPS: 'FRAMEWORK_BUILD_STEPS',
  BACKEND_SETUP: 'BACKEND_SETUP',
  DATABASE_SERVICES: 'DATABASE_SERVICES',
  VOLUMES: 'VOLUMES',
  NETWORKS: 'NETWORKS',
  ENVIRONMENT: 'ENVIRONMENT'
};

/**
 * Fragment metadata structure
 *
 * @typedef {Object} FragmentMetadata
 * @property {string} name - Fragment name (e.g., 'react', 'postgresql')
 * @property {string} type - Fragment type from FragmentType
 * @property {string} insertionPoint - Where to insert the fragment
 * @property {string[]} requiredVariables - Variables that must be provided
 * @property {Object} defaultVariables - Default variable values
 * @property {string[]} dependencies - Other fragments this depends on
 * @property {number} priority - Insertion priority (higher = earlier)
 */

/**
 * Fragment validation rules
 */
export const FragmentValidationRules = {
  /**
   * Validates fragment structure
   * @param {string} content - Fragment content
   * @param {FragmentMetadata} metadata - Fragment metadata
   * @returns {Object} Validation result
   */
  validateStructure(content, metadata) {
    const errors = [];
    const warnings = [];

    // Check for insertion point comment
    if (!content.includes(`Insertion Point: ${metadata.insertionPoint}`)) {
      warnings.push(`Missing insertion point comment: ${metadata.insertionPoint}`);
    }

    // Check for required variables
    const variablePattern = /\{\{([A-Z_]+)\}\}/g;
    const usedVariables = new Set();
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      usedVariables.add(match[1]);
    }

    metadata.requiredVariables?.forEach(varName => {
      if (!usedVariables.has(varName) && !metadata.defaultVariables?.[varName]) {
        warnings.push(`Required variable ${varName} not used in fragment`);
      }
    });

    // Check for dangerous commands
    const dangerousCommands = ['rm -rf /', 'chmod 777', 'curl | sh'];
    dangerousCommands.forEach(cmd => {
      if (content.includes(cmd)) {
        errors.push(`Dangerous command detected: ${cmd}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      usedVariables: Array.from(usedVariables)
    };
  },

  /**
   * Validates fragment compatibility
   * @param {string[]} fragments - List of fragment names
   * @param {Map} fragmentRegistry - Registry of all fragments
   * @returns {Object} Compatibility result
   */
  validateCompatibility(fragments, fragmentRegistry) {
    const conflicts = [];
    const warnings = [];

    // Check for conflicting fragments
    const typeGroups = {};
    fragments.forEach(name => {
      const metadata = fragmentRegistry.get(name);
      if (!metadata) return;

      const type = metadata.type;
      if (!typeGroups[type]) typeGroups[type] = [];
      typeGroups[type].push(name);
    });

    // Warn about multiple frameworks
    if (typeGroups[FragmentType.FRAMEWORK]?.length > 1) {
      warnings.push(`Multiple frameworks detected: ${typeGroups[FragmentType.FRAMEWORK].join(', ')}`);
    }

    // Check dependencies
    fragments.forEach(name => {
      const metadata = fragmentRegistry.get(name);
      metadata?.dependencies?.forEach(dep => {
        if (!fragments.includes(dep)) {
          conflicts.push(`Fragment ${name} requires ${dep} but it's not included`);
        }
      });
    });

    return {
      compatible: conflicts.length === 0,
      conflicts,
      warnings
    };
  }
};

/**
 * Gets default metadata for a fragment type
 * @param {string} type - Fragment type
 * @returns {Partial<FragmentMetadata>} Default metadata
 */
export function getDefaultMetadata(type) {
  const defaults = {
    [FragmentType.FRAMEWORK]: {
      insertionPoint: InsertionPoint.FRAMEWORK_BUILD_STEPS,
      requiredVariables: ['BUILD_OUTPUT_DIR', 'APP_TITLE'],
      defaultVariables: {
        VERSION: '1.0.0',
        NODE_OPTIONS: '--max-old-space-size=4096'
      },
      priority: 10
    },
    [FragmentType.DATABASE]: {
      insertionPoint: InsertionPoint.DATABASE_SERVICES,
      requiredVariables: ['PROJECT_NAME'],
      defaultVariables: {},
      priority: 5
    },
    [FragmentType.BACKEND]: {
      insertionPoint: InsertionPoint.BACKEND_SETUP,
      requiredVariables: ['PROJECT_NAME', 'SERVER_ENTRY'],
      defaultVariables: {
        PORT: '3000'
      },
      priority: 8
    }
  };

  return defaults[type] || {};
}

export default {
  FragmentType,
  InsertionPoint,
  FragmentValidationRules,
  getDefaultMetadata
};
