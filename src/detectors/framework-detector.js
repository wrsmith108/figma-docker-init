/**
 * Framework Detector
 *
 * Detects frontend frameworks in a project by analyzing package.json dependencies.
 * Supports React, Vue, Svelte, Next.js, Nuxt, Angular, and more.
 *
 * @module detectors/framework-detector
 */

import { readPackageJsonSafe } from '../lib/package-reader.js';

/**
 * Framework detection configuration
 * Maps framework names to their package identifiers
 */
const FRAMEWORK_CONFIG = {
  react: {
    packages: ['react'],
    priority: 10
  },
  vue: {
    packages: ['vue'],
    priority: 10
  },
  svelte: {
    packages: ['svelte'],
    priority: 10
  },
  nextjs: {
    packages: ['next'],
    priority: 15, // Higher priority - implies React
  },
  nuxt: {
    packages: ['nuxt'],
    priority: 15, // Higher priority - implies Vue
  },
  angular: {
    packages: ['@angular/core'],
    priority: 10
  },
  astro: {
    packages: ['astro'],
    priority: 10
  },
  remix: {
    packages: ['@remix-run/react'],
    priority: 12
  },
  gatsby: {
    packages: ['gatsby'],
    priority: 10
  },
  qwik: {
    packages: ['@builder.io/qwik'],
    priority: 10
  },
  solid: {
    packages: ['solid-js'],
    priority: 10
  }
};

/**
 * FrameworkDetector - Detects frontend frameworks
 */
export class FrameworkDetector {
  /**
   * Detects frameworks in a project
   *
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Detection results
   *
   * @example
   * const detector = new FrameworkDetector();
   * const result = await detector.detect('/path/to/project');
   * console.log(result);
   * // {
   * //   frameworks: ['nextjs', 'react'],
   * //   primary: 'nextjs',
   * //   confidence: 0.95,
   * //   details: { nextjs: '^13.0.0', react: '^18.2.0' }
   * // }
   */
  async detect(projectRoot) {
    const pkg = await readPackageJsonSafe(projectRoot);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const detectedFrameworks = [];

    // Check each framework
    for (const [frameworkName, config] of Object.entries(FRAMEWORK_CONFIG)) {
      const foundPackages = config.packages.filter(pkg => allDeps[pkg]);

      if (foundPackages.length > 0) {
        detectedFrameworks.push({
          name: frameworkName,
          priority: config.priority,
          packages: foundPackages,
          versions: Object.fromEntries(
            foundPackages.map(pkg => [pkg, allDeps[pkg]])
          )
        });
      }
    }

    // Sort by priority (highest first)
    detectedFrameworks.sort((a, b) => b.priority - a.priority);

    // Extract framework names for compatibility
    const frameworks = detectedFrameworks.map(f => f.name);
    const details = {};
    detectedFrameworks.forEach(f => {
      details[f.name] = f.versions;
    });

    return {
      frameworks,
      primary: frameworks.length > 0 ? frameworks[0] : 'unknown',
      confidence: frameworks.length > 0 ? 0.95 : 0.0,
      details,
      count: frameworks.length
    };
  }

  /**
   * Checks if a specific framework is detected
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} frameworkName - Name of framework to check
   * @returns {Promise<boolean>} True if framework is detected
   *
   * @example
   * const hasReact = await detector.hasFramework('/path/to/project', 'react');
   */
  async hasFramework(projectRoot, frameworkName) {
    const result = await this.detect(projectRoot);
    return result.frameworks.includes(frameworkName);
  }

  /**
   * Gets framework version if installed
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} frameworkName - Name of framework
   * @returns {Promise<string|null>} Version string or null
   */
  async getFrameworkVersion(projectRoot, frameworkName) {
    const result = await this.detect(projectRoot);
    const frameworkDetails = result.details[frameworkName];

    if (!frameworkDetails) {
      return null;
    }

    // Return the main package version
    const mainPackage = FRAMEWORK_CONFIG[frameworkName]?.packages[0];
    return mainPackage ? frameworkDetails[mainPackage] : null;
  }
}

export default FrameworkDetector;
