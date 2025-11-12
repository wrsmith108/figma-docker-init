/**
 * Backend Detector
 *
 * Detects backend frameworks and API patterns in a project.
 * Supports Express, Fastify, Hono, NestJS, Next.js API routes, and more.
 *
 * @module detectors/backend-detector
 */

import { readPackageJsonSafe } from '../lib/package-reader.js';

/**
 * Backend detection configuration
 * Maps backend frameworks to their package identifiers
 */
const BACKEND_CONFIG = {
  express: {
    packages: ['express'],
    priority: 10,
    category: 'minimal-framework'
  },
  fastify: {
    packages: ['fastify'],
    priority: 11,
    category: 'minimal-framework'
  },
  hono: {
    packages: ['hono'],
    priority: 11,
    category: 'minimal-framework'
  },
  nestjs: {
    packages: ['@nestjs/core'],
    priority: 13,
    category: 'full-framework'
  },
  nextjs_api: {
    packages: ['next'],
    priority: 12,
    category: 'api-routes',
    requiresFramework: true
  },
  koa: {
    packages: ['koa'],
    priority: 10,
    category: 'minimal-framework'
  },
  restify: {
    packages: ['restify'],
    priority: 9,
    category: 'minimal-framework'
  },
  polka: {
    packages: ['polka'],
    priority: 9,
    category: 'minimal-framework'
  },
  elysia: {
    packages: ['elysia'],
    priority: 11,
    category: 'minimal-framework'
  },
  remix_api: {
    packages: ['@remix-run/node'],
    priority: 12,
    category: 'api-routes'
  },
  sveltekit_api: {
    packages: ['@sveltejs/kit'],
    priority: 12,
    category: 'api-routes'
  },
  astro_api: {
    packages: ['astro'],
    priority: 12,
    category: 'api-routes'
  }
};

/**
 * BackendDetector - Detects backend frameworks and patterns
 */
export class BackendDetector {
  /**
   * Detects backend frameworks in a project
   *
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Detection results
   *
   * @example
   * const detector = new BackendDetector();
   * const result = await detector.detect('/path/to/project');
   * console.log(result);
   * // {
   * //   backends: ['express', 'nextjs_api'],
   * //   primary: 'express',
   * //   hasBackend: true,
   * //   confidence: 0.88,
   * //   categories: { express: 'minimal-framework', nextjs_api: 'api-routes' }
   * // }
   */
  async detect(projectRoot) {
    const pkg = await readPackageJsonSafe(projectRoot);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const detectedBackends = [];

    // Check each backend
    for (const [backendName, config] of Object.entries(BACKEND_CONFIG)) {
      const foundPackages = config.packages.filter(pkg => allDeps[pkg]);

      if (foundPackages.length > 0) {
        detectedBackends.push({
          name: backendName,
          priority: config.priority,
          category: config.category,
          packages: foundPackages,
          versions: Object.fromEntries(
            foundPackages.map(pkg => [pkg, allDeps[pkg]])
          )
        });
      }
    }

    // Sort by priority (highest first)
    detectedBackends.sort((a, b) => b.priority - a.priority);

    // Extract backend names and filter if needed
    let backends = detectedBackends.map(b => b.name);

    // Remove api-route entries if we have a proper backend framework
    const hasProperBackend = backends.some(b => {
      const config = BACKEND_CONFIG[b];
      return config.category === 'minimal-framework' || config.category === 'full-framework';
    });

    if (hasProperBackend) {
      backends = backends.filter(b => {
        const config = BACKEND_CONFIG[b];
        return config.category !== 'api-routes';
      });
    }

    const categories = {};
    const details = {};
    detectedBackends.forEach(b => {
      categories[b.name] = b.category;
      details[b.name] = b.versions;
    });

    return {
      backends,
      primary: backends.length > 0 ? backends[0] : 'none',
      hasBackend: backends.length > 0,
      confidence: backends.length > 0 ? 0.88 : 0.95, // High confidence for "none"
      categories,
      details,
      count: backends.length
    };
  }

  /**
   * Checks if a specific backend is detected
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} backendName - Name of backend to check
   * @returns {Promise<boolean>} True if backend is detected
   */
  async hasBackend(projectRoot, backendName) {
    const result = await this.detect(projectRoot);
    return result.backends.includes(backendName);
  }

  /**
   * Checks if project has any backend
   *
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<boolean>} True if project has backend
   */
  async hasFrontendOnly(projectRoot) {
    const result = await this.detect(projectRoot);
    return !result.hasBackend;
  }

  /**
   * Gets backend category (framework type)
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} backendName - Name of backend
   * @returns {Promise<string|null>} Category or null
   */
  async getBackendCategory(projectRoot, backendName) {
    const result = await this.detect(projectRoot);
    return result.categories[backendName] || null;
  }

  /**
   * Gets backend version if installed
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} backendName - Name of backend
   * @returns {Promise<string|null>} Version string or null
   */
  async getBackendVersion(projectRoot, backendName) {
    const result = await this.detect(projectRoot);
    const backendDetails = result.details[backendName];

    if (!backendDetails) {
      return null;
    }

    // Return the main package version
    const mainPackage = BACKEND_CONFIG[backendName]?.packages[0];
    return mainPackage ? backendDetails[mainPackage] : null;
  }
}

export default BackendDetector;
