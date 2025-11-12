/**
 * Fragment Composer
 *
 * Main orchestrator for composing Docker templates from fragments.
 * Coordinates validation, merging, and variable substitution.
 *
 * @module templates/fragments/fragment-composer
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FragmentValidator from './fragment-validator.js';
import FragmentMerger from './fragment-merger.js';
import { FragmentType, getDefaultMetadata } from './fragment-types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * FragmentComposer - Composes templates from fragments
 */
export class FragmentComposer {
  constructor() {
    this.validator = new FragmentValidator();
    this.merger = new FragmentMerger();
    this.fragmentRegistry = new Map();
    this.loadFragments();
  }

  /**
   * Loads all available fragments from the filesystem
   */
  loadFragments() {
    const fragmentsDir = __dirname;
    const types = [FragmentType.FRAMEWORK, FragmentType.DATABASE, FragmentType.BACKEND];

    types.forEach(type => {
      const typeDir = join(fragmentsDir, `${type}s`);
      if (!existsSync(typeDir)) return;

      const files = readdirSync(typeDir);
      files.forEach(file => {
        if (file.startsWith('.')) return;

        const name = file.replace(/\.(dockerfile|yml)$/, '');
        const filePath = join(typeDir, file);
        const content = readFileSync(filePath, 'utf-8');

        const metadata = {
          name,
          type,
          filePath,
          ...getDefaultMetadata(type)
        };

        this.fragmentRegistry.set(name, { content, metadata });
      });
    });
  }

  /**
   * Composes a Dockerfile from base template and fragments
   *
   * @param {string} baseTemplate - Base Dockerfile template
   * @param {string[]} fragmentNames - Names of fragments to compose
   * @param {Object} variables - Variables for substitution
   * @returns {Object} Composition result
   *
   * @example
   * const composer = new FragmentComposer();
   * const result = composer.compose(baseTemplate, ['react', 'express'], {
   *   PROJECT_NAME: 'my-app',
   *   BUILD_OUTPUT_DIR: 'dist',
   *   PORT: '3000'
   * });
   */
  compose(baseTemplate, fragmentNames, variables = {}) {
    const fragments = [];
    const errors = [];
    const warnings = [];

    // Load and validate each fragment
    fragmentNames.forEach(name => {
      const fragment = this.fragmentRegistry.get(name);

      if (!fragment) {
        errors.push(`Fragment not found: ${name}`);
        return;
      }

      // Validate fragment
      const validation = this.validator.validateFragment(
        fragment.content,
        fragment.metadata
      );

      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `${name}: ${e}`));
      }
      warnings.push(...validation.warnings.map(w => `${name}: ${w}`));

      fragments.push(fragment);
    });

    // Check compatibility
    const compatibility = this.validator.validateCompatibility(
      fragments,
      this.fragmentRegistry
    );

    if (!compatibility.compatible) {
      errors.push(...compatibility.conflicts);
    }
    warnings.push(...compatibility.warnings);

    // Additional warning for multiple frameworks
    const frameworkFragments = fragments.filter(f => f.metadata.type === 'framework');
    if (frameworkFragments.length > 1) {
      const names = frameworkFragments.map(f => f.metadata.name).join(', ');
      warnings.push(`Multiple frameworks detected: ${names}`);
    }

    // Stop if there are errors
    if (errors.length > 0) {
      return {
        success: false,
        template: null,
        errors,
        warnings
      };
    }

    // Merge fragments
    let composed = baseTemplate;
    try {
      composed = this.merger.mergeMultiple(baseTemplate, fragments);
    } catch (error) {
      errors.push(`Merge error: ${error.message}`);
      return {
        success: false,
        template: null,
        errors,
        warnings
      };
    }

    // Substitute variables
    const allVariables = {
      ...this.getDefaultVariables(fragments),
      ...variables
    };

    const final = this.merger.substituteVariables(composed, allVariables);

    // Extract used variables for validation
    const usedVars = this.merger.extractVariables(final);
    const missingVars = Array.from(usedVars).filter(v => !allVariables[v]);

    if (missingVars.length > 0) {
      warnings.push(`Missing variable values: ${missingVars.join(', ')}`);
    }

    return {
      success: true,
      template: final,
      errors,
      warnings,
      usedVariables: Array.from(usedVars),
      appliedFragments: fragmentNames
    };
  }

  /**
   * Composes docker-compose.yml from fragments
   *
   * @param {string} baseCompose - Base docker-compose.yml template
   * @param {string[]} databaseNames - Names of database fragments
   * @param {Object} variables - Variables for substitution
   * @returns {Object} Composition result
   */
  composeDockerCompose(baseCompose, databaseNames, variables = {}) {
    const fragments = [];
    const errors = [];
    const warnings = [];

    // Load database fragments
    databaseNames.forEach(name => {
      const fragment = this.fragmentRegistry.get(name);

      if (!fragment) {
        errors.push(`Database fragment not found: ${name}`);
        return;
      }

      if (fragment.metadata.type !== FragmentType.DATABASE) {
        errors.push(`Fragment ${name} is not a database fragment`);
        return;
      }

      // Validate fragment
      const validation = this.validator.validateFragment(
        fragment.content,
        fragment.metadata
      );

      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `${name}: ${e}`));
      }
      warnings.push(...validation.warnings.map(w => `${name}: ${w}`));

      fragments.push(fragment.content);
    });

    if (errors.length > 0) {
      return {
        success: false,
        compose: null,
        errors,
        warnings
      };
    }

    // Merge compose services
    let composed = baseCompose;
    try {
      composed = this.merger.mergeComposeServices(baseCompose, fragments);
    } catch (error) {
      errors.push(`Merge error: ${error.message}`);
      return {
        success: false,
        compose: null,
        errors,
        warnings
      };
    }

    // Substitute variables
    const final = this.merger.substituteVariables(composed, variables);

    return {
      success: true,
      compose: final,
      errors,
      warnings,
      appliedFragments: databaseNames
    };
  }

  /**
   * Gets default variables from fragments
   *
   * @param {Array} fragments - Fragment objects
   * @returns {Object} Default variables
   */
  getDefaultVariables(fragments) {
    const defaults = {};

    fragments.forEach(({ metadata }) => {
      Object.assign(defaults, metadata.defaultVariables || {});
    });

    return defaults;
  }

  /**
   * Lists all available fragments
   *
   * @param {string} type - Optional type filter
   * @returns {Array} Fragment metadata
   */
  listFragments(type = null) {
    const fragments = [];

    this.fragmentRegistry.forEach((fragment, name) => {
      if (!type || fragment.metadata.type === type) {
        fragments.push({
          name,
          type: fragment.metadata.type,
          insertionPoint: fragment.metadata.insertionPoint,
          requiredVariables: fragment.metadata.requiredVariables
        });
      }
    });

    return fragments.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Gets fragment content by name
   *
   * @param {string} name - Fragment name
   * @returns {Object|null} Fragment object or null
   */
  getFragment(name) {
    return this.fragmentRegistry.get(name) || null;
  }

  /**
   * Detects recommended fragments based on project detection results
   *
   * @param {Object} detectionResults - Results from detector chain
   * @returns {Object} Recommended fragments
   */
  recommendFragments(detectionResults) {
    const recommended = {
      frameworks: [],
      databases: [],
      backends: []
    };

    // Framework recommendations
    if (detectionResults.frameworks?.primary) {
      const framework = detectionResults.frameworks.primary.toLowerCase();
      if (this.fragmentRegistry.has(framework)) {
        recommended.frameworks.push(framework);
      }
    }

    // Database recommendations
    if (detectionResults.databases?.databases) {
      detectionResults.databases.databases.forEach(db => {
        const dbName = db.toLowerCase();
        if (this.fragmentRegistry.has(dbName)) {
          recommended.databases.push(dbName);
        }
      });
    }

    // Backend recommendations
    if (detectionResults.backends?.primary && detectionResults.backends.primary !== 'none') {
      const backend = detectionResults.backends.primary.toLowerCase().replace('_api', '');
      if (this.fragmentRegistry.has(backend)) {
        recommended.backends.push(backend);
      }
    }

    return recommended;
  }
}

export default FragmentComposer;
