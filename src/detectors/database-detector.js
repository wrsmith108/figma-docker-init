/**
 * Database Detector
 *
 * Detects database integrations in a project by analyzing package.json dependencies.
 * Supports Supabase, PostgreSQL, MongoDB, SQLite, MySQL, and Firebase.
 *
 * @module detectors/database-detector
 */

import { readPackageJsonSafe } from '../lib/package-reader.js';

/**
 * Database detection configuration
 * Maps database names to their package identifiers
 */
const DATABASE_CONFIG = {
  supabase: {
    packages: ['@supabase/supabase-js'],
    priority: 15,
    type: 'backend-as-a-service'
  },
  postgresql: {
    packages: ['pg', 'postgres'],
    priority: 10,
    type: 'sql-database'
  },
  mongodb: {
    packages: ['mongodb', 'mongoose'],
    priority: 10,
    type: 'nosql-database'
  },
  sqlite: {
    packages: ['better-sqlite3', 'sqlite3'],
    priority: 9,
    type: 'sql-database'
  },
  mysql: {
    packages: ['mysql2', 'mysql'],
    priority: 10,
    type: 'sql-database'
  },
  firebase: {
    packages: ['firebase', 'firebase-admin'],
    priority: 14,
    type: 'backend-as-a-service'
  },
  dynamodb: {
    packages: ['@aws-sdk/client-dynamodb'],
    priority: 11,
    type: 'nosql-database'
  },
  prisma: {
    packages: ['@prisma/client'],
    priority: 12,
    type: 'orm'
  },
  typeorm: {
    packages: ['typeorm'],
    priority: 11,
    type: 'orm'
  },
  sequelize: {
    packages: ['sequelize'],
    priority: 11,
    type: 'orm'
  },
  knex: {
    packages: ['knex'],
    priority: 10,
    type: 'query-builder'
  },
  redis: {
    packages: ['redis', 'ioredis'],
    priority: 9,
    type: 'cache-database'
  }
};

/**
 * DatabaseDetector - Detects database integrations
 */
export class DatabaseDetector {
  /**
   * Detects databases in a project
   *
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<Object>} Detection results
   *
   * @example
   * const detector = new DatabaseDetector();
   * const result = await detector.detect('/path/to/project');
   * console.log(result);
   * // {
   * //   databases: ['supabase', 'postgresql'],
   * //   primary: 'supabase',
   * //   confidence: 0.90,
   * //   types: { supabase: 'backend-as-a-service', postgresql: 'sql-database' }
   * // }
   */
  async detect(projectRoot) {
    const pkg = await readPackageJsonSafe(projectRoot);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const detectedDatabases = [];

    // Check each database
    for (const [dbName, config] of Object.entries(DATABASE_CONFIG)) {
      const foundPackages = config.packages.filter(pkg => allDeps[pkg]);

      if (foundPackages.length > 0) {
        detectedDatabases.push({
          name: dbName,
          priority: config.priority,
          type: config.type,
          packages: foundPackages,
          versions: Object.fromEntries(
            foundPackages.map(pkg => [pkg, allDeps[pkg]])
          )
        });
      }
    }

    // Sort by priority (highest first)
    detectedDatabases.sort((a, b) => b.priority - a.priority);

    // Extract database names for compatibility
    const databases = detectedDatabases.map(d => d.name);
    const types = {};
    const details = {};
    detectedDatabases.forEach(d => {
      types[d.name] = d.type;
      details[d.name] = d.versions;
    });

    return {
      databases,
      primary: databases.length > 0 ? databases[0] : null,
      confidence: databases.length > 0 ? 0.90 : 0.0,
      types,
      details,
      count: databases.length
    };
  }

  /**
   * Checks if a specific database is detected
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} databaseName - Name of database to check
   * @returns {Promise<boolean>} True if database is detected
   */
  async hasDatabase(projectRoot, databaseName) {
    const result = await this.detect(projectRoot);
    return result.databases.includes(databaseName);
  }

  /**
   * Gets database type (sql, nosql, etc.)
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} databaseName - Name of database
   * @returns {Promise<string|null>} Database type or null
   */
  async getDatabaseType(projectRoot, databaseName) {
    const result = await this.detect(projectRoot);
    return result.types[databaseName] || null;
  }

  /**
   * Gets database version if installed
   *
   * @param {string} projectRoot - Root directory of the project
   * @param {string} databaseName - Name of database
   * @returns {Promise<string|null>} Version string or null
   */
  async getDatabaseVersion(projectRoot, databaseName) {
    const result = await this.detect(projectRoot);
    const dbDetails = result.details[databaseName];

    if (!dbDetails) {
      return null;
    }

    // Return the main package version
    const mainPackage = DATABASE_CONFIG[databaseName]?.packages[0];
    return mainPackage ? dbDetails[mainPackage] : null;
  }
}

export default DatabaseDetector;
