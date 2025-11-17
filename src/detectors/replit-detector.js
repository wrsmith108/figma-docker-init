/**
 * ReplitDetector - Detects Replit.com projects
 *
 * Detection Strategy:
 * - PRIMARY: .replit file (40% confidence)
 * - PRIMARY: replit.nix file (40% confidence)
 * - SECONDARY: @replit/* packages in package.json (10% confidence)
 * - TERTIARY: .replit.d/ directory, tsx, port 5000 (10% confidence)
 *
 * Minimum confidence threshold: 50%
 *
 * Key Replit Signatures:
 * - .replit: Configuration file with modules, run, deployment settings
 * - replit.nix: Nix package configuration
 * - @replit/* packages: vite-plugin-cartographer, vite-plugin-runtime-error-modal, vite-plugin-shadcn-theme-json
 * - tsx: TypeScript execution (common in Replit fullstack apps)
 * - Port 5000: Default Replit development port
 *
 * Framework Detection:
 * - express: REST API framework
 * - react + vite: Frontend SPA
 * - next.js: Fullstack framework
 * - fastify: API framework
 * - sveltekit/nuxt: Alternative fullstack frameworks
 *
 * Database Detection:
 * - postgresql: PostgreSQL database
 * - mongodb: MongoDB database
 * - mysql: MySQL database
 * - replit-db: Replit's built-in key-value store
 */

import { BaseDetector } from './base-detector.js';
import fs from 'fs/promises';
import path from 'path';

export class ReplitDetector extends BaseDetector {
  constructor(projectRoot = process.cwd()) {
    super();
    this.projectRoot = projectRoot;
    this.priority = 3; // Same priority as other vibe-coding tools
    this.tool = 'replit';
  }

  /**
   * Detect if project is from Replit
   *
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<{tool: string|null, confidence: number, evidence: string[], metadata: Object}>}
   */
  async detect(projectRoot = this.projectRoot) {
    let confidence = 0;
    const evidence = [];
    const metadata = {
      framework: null,
      database: null,
      language: null,
      port: null,
      replitModules: [],
      projectName: null,
      entrypoint: null,
      runCommand: null,
      hasPackageJson: false,
      isTypeScript: false,
      hasReplitDB: false,
    };

    try {
      // PRIMARY: Check for .replit file (40% confidence)
      const replitConfigPath = path.join(projectRoot, '.replit');
      const hasReplitConfig = await this.fileExists(replitConfigPath);

      if (hasReplitConfig) {
        confidence += 0.4;
        evidence.push('Found .replit configuration file');

        // Parse .replit for additional metadata
        const replitContent = await this.readFile(replitConfigPath);
        if (replitContent) {
          await this.parseReplitConfig(replitContent, metadata, evidence);
        }
      }

      // PRIMARY: Check for replit.nix file (40% confidence)
      const replitNixPath = path.join(projectRoot, 'replit.nix');
      const hasReplitNix = await this.fileExists(replitNixPath);

      if (hasReplitNix) {
        confidence += 0.4;
        evidence.push('Found replit.nix package configuration');

        // Parse replit.nix for database detection
        const nixContent = await this.readFile(replitNixPath);
        if (nixContent) {
          await this.parseReplitNix(nixContent, metadata, evidence);
        }
      }

      // SECONDARY: Check for @replit/* packages (10% confidence)
      const packageJson = await this.readPackageJson(projectRoot);
      if (packageJson) {
        metadata.hasPackageJson = true;
        metadata.projectName = packageJson.name || null;

        const replitPackages = this.findReplitPackages(packageJson);
        if (replitPackages.length > 0) {
          confidence += 0.1;
          evidence.push(`Found ${replitPackages.length} @replit/* package(s): ${replitPackages.join(', ')}`);

          // Check for @replit/database
          if (replitPackages.includes('@replit/database')) {
            metadata.hasReplitDB = true;
          }
        }

        // Detect framework and language
        await this.detectFramework(packageJson, metadata, evidence);
        await this.detectLanguage(packageJson, metadata, evidence);
      }

      // TERTIARY: Check for .replit.d/ directory (5% confidence)
      const replitTypesPath = path.join(projectRoot, '.replit.d');
      const hasReplitTypes = await this.dirExists(replitTypesPath);

      if (hasReplitTypes) {
        confidence += 0.05;
        evidence.push('Found .replit.d/ type definitions directory');
      }

      // TERTIARY: Check for tsx in devDependencies (5% confidence)
      if (packageJson?.devDependencies?.tsx) {
        confidence += 0.05;
        evidence.push('Found tsx (TypeScript execution) - common in Replit projects');
      }

      // Return null if confidence is below threshold
      if (confidence < 0.5) {
        return {
          tool: null,
          confidence: 0,
          evidence: [],
          metadata: {},
        };
      }

      return {
        tool: this.tool,
        confidence: Math.min(confidence, 1.0), // Cap at 100%
        evidence,
        metadata,
      };
    } catch (error) {
      // Return null result on any error
      return {
        tool: null,
        confidence: 0,
        evidence: [`Error during detection: ${error.message}`],
        metadata: {},
      };
    }
  }

  /**
   * Parse .replit configuration file
   *
   * @param {string} content - .replit file content
   * @param {Object} metadata - Metadata object to populate
   * @param {string[]} evidence - Evidence array to append to
   */
  async parseReplitConfig(content, metadata, evidence) {
    // Extract modules (e.g., "nodejs-20", "postgresql-16", "web")
    const modulesMatch = content.match(/modules\s*=\s*\[([^\]]+)\]/);
    if (modulesMatch) {
      const modules = modulesMatch[1]
        .split(',')
        .map(m => m.trim().replace(/['"]/g, ''));
      metadata.replitModules = modules;

      // Detect database from modules
      if (modules.some(m => m.includes('postgresql'))) {
        metadata.database = 'postgresql';
      } else if (modules.some(m => m.includes('mongodb'))) {
        metadata.database = 'mongodb';
      } else if (modules.some(m => m.includes('mysql'))) {
        metadata.database = 'mysql';
      }

      evidence.push(`Replit modules: ${modules.join(', ')}`);
    }

    // Extract port from [[ports]] section
    const portMatch = content.match(/localPort\s*=\s*(\d+)/);
    if (portMatch) {
      metadata.port = parseInt(portMatch[1], 10);
      evidence.push(`Configured for port ${metadata.port}`);
    }

    // Extract run command
    const runMatch = content.match(/run\s*=\s*"([^"]+)"/);
    if (runMatch) {
      metadata.runCommand = runMatch[1];
      evidence.push(`Run command: ${runMatch[1]}`);
    }

    // Extract entrypoint
    const entrypointMatch = content.match(/entrypoint\s*=\s*"([^"]+)"/);
    if (entrypointMatch) {
      metadata.entrypoint = entrypointMatch[1];
      evidence.push(`Entrypoint: ${entrypointMatch[1]}`);
    }
  }

  /**
   * Parse replit.nix file
   *
   * @param {string} content - replit.nix file content
   * @param {Object} metadata - Metadata object to populate
   * @param {string[]} evidence - Evidence array to append to
   */
  async parseReplitNix(content, metadata, evidence) {
    // Detect databases from pkgs dependencies
    if (content.includes('pkgs.postgresql') && !metadata.database) {
      metadata.database = 'postgresql';
    } else if (content.includes('pkgs.mongodb') && !metadata.database) {
      metadata.database = 'mongodb';
    } else if (content.includes('pkgs.mysql') && !metadata.database) {
      metadata.database = 'mysql';
    }
  }

  /**
   * Find @replit/* packages in package.json
   *
   * @param {Object} packageJson - Parsed package.json
   * @returns {string[]} List of @replit/* package names
   */
  findReplitPackages(packageJson) {
    const replitPackages = [];
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.optionalDependencies,
    };

    for (const pkg in allDeps) {
      if (pkg.startsWith('@replit/')) {
        replitPackages.push(pkg);
      }
    }

    return replitPackages;
  }

  /**
   * Detect framework from package.json
   *
   * @param {Object} packageJson - Parsed package.json
   * @param {Object} metadata - Metadata object to populate
   * @param {string[]} evidence - Evidence array to append to
   */
  async detectFramework(packageJson, metadata, evidence) {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Prioritize fullstack frameworks
    if (deps.next) {
      metadata.framework = 'next';
      evidence.push('Framework: Next.js');
    } else if (deps.nuxt) {
      metadata.framework = 'nuxt';
      evidence.push('Framework: Nuxt');
    } else if (deps['@sveltejs/kit']) {
      metadata.framework = 'sveltekit';
      evidence.push('Framework: SvelteKit');
    } else if (deps.express) {
      metadata.framework = 'express';
      evidence.push('Framework: Express');
    } else if (deps.fastify) {
      metadata.framework = 'fastify';
      evidence.push('Framework: Fastify');
    } else if (deps.react && deps.vite) {
      metadata.framework = 'react-vite';
      evidence.push('Framework: React + Vite');
    } else if (deps.react) {
      metadata.framework = 'react';
      evidence.push('Framework: React');
    } else if (deps.vue) {
      metadata.framework = 'vue';
      evidence.push('Framework: Vue');
    }
  }

  /**
   * Detect language from package.json and project structure
   *
   * @param {Object} packageJson - Parsed package.json
   * @param {Object} metadata - Metadata object to populate
   * @param {string[]} evidence - Evidence array to append to
   */
  async detectLanguage(packageJson, metadata, evidence) {
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Check for TypeScript
    if (deps.typescript || deps.tsx || deps['@types/node']) {
      metadata.language = 'typescript';
      metadata.isTypeScript = true;
      evidence.push('Language: TypeScript');
    } else {
      metadata.language = 'javascript';
      metadata.isTypeScript = false;
      evidence.push('Language: JavaScript');
    }
  }
}

export default ReplitDetector;
