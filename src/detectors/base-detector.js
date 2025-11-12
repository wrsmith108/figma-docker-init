/**
 * BaseDetector - Abstract base class for project detectors
 *
 * Provides common functionality for detecting different vibe-coding tools
 * (Figma Make, V0, Lovable, Bolt)
 *
 * Features:
 * - Common file system operations (readPackageJson, fileExists, dirExists)
 * - Standardized detection interface
 * - Confidence scoring and evidence tracking
 * - Prioritization support for multiple detectors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class BaseDetector {
  /**
   * Priority for detector ordering (lower = higher priority)
   * Override in subclasses to set custom priority
   */
  priority = 100;

  /**
   * The tool name this detector identifies
   * Override in subclasses
   */
  tool = null;

  /**
   * Read and parse package.json from project root
   *
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<Object|null>} Parsed package.json or null if not found
   */
  async readPackageJson(projectRoot) {
    try {
      const packagePath = path.join(projectRoot, 'package.json');
      const content = await fs.promises.readFile(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Read file contents
   *
   * @param {string} filePath - Full path to file
   * @returns {Promise<string|null>} File contents or null if not found
   */
  async readFile(filePath) {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if file exists
   *
   * @param {string} filePath - Full path to file
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if directory exists
   *
   * @param {string} dirPath - Full path to directory
   * @returns {Promise<boolean>} True if directory exists
   */
  async dirExists(dirPath) {
    try {
      const stats = await fs.promises.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * List files in directory
   *
   * @param {string} dirPath - Full path to directory
   * @returns {Promise<string[]>} Array of file names
   */
  async listFiles(dirPath) {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.filter(e => e.isFile()).map(e => e.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * List directories in a directory
   *
   * @param {string} dirPath - Full path to directory
   * @returns {Promise<string[]>} Array of directory names
   */
  async listDirs(dirPath) {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all TypeScript/JavaScript files recursively
   *
   * @param {string} dirPath - Directory to search
   * @param {RegExp} extensions - File extension pattern (default: /\.(ts|tsx|js|jsx)$/)
   * @returns {Promise<string[]>} Array of file paths
   */
  async getAllSourceFiles(dirPath, extensions = /\.(ts|tsx|js|jsx)$/) {
    const files = [];

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip common ignored directories
        if (
          entry.isDirectory() &&
          ['node_modules', 'dist', 'build', '.git', '.vibe-docker', 'coverage'].includes(
            entry.name
          )
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          const subfiles = await this.getAllSourceFiles(fullPath, extensions);
          files.push(...subfiles);
        } else if (extensions.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  /**
   * Search for patterns in files
   *
   * @param {string} dirPath - Directory to search
   * @param {RegExp} pattern - Pattern to match
   * @param {number} maxFiles - Maximum files to check
   * @returns {Promise<{file: string, matches: number}>} Matching files and counts
   */
  async searchPattern(dirPath, pattern, maxFiles = 20) {
    const results = [];

    try {
      const files = await this.getAllSourceFiles(dirPath);

      for (const file of files.slice(0, maxFiles)) {
        try {
          const content = await this.readFile(file);
          if (content && pattern.test(content)) {
            const matches = (content.match(pattern) || []).length;
            results.push({ file, matches });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    } catch (error) {
      // Skip errors
    }

    return results;
  }

  /**
   * Main detection method - must be implemented by subclasses
   *
   * @param {string} projectRoot - Project root directory
   * @returns {Promise<{tool: string|null, confidence: number, evidence: string[], metadata: Object}>}
   *   Detection result with tool name, confidence score (0-1), evidence list, and metadata
   */
  async detect(projectRoot) {
    throw new Error('detect() must be implemented by subclass');
  }

  /**
   * Format detection results as string for display
   *
   * @param {Object} result - Detection result from detect()
   * @returns {string} Formatted result
   */
  formatResult(result) {
    const { tool, confidence, evidence, metadata } = result;
    const confidencePercent = (confidence * 100).toFixed(1);

    let output = `Tool: ${tool || 'Unknown'} (${confidencePercent}% confidence)\n`;

    if (evidence && evidence.length > 0) {
      output += 'Evidence:\n';
      evidence.forEach(e => {
        output += `  - ${e}\n`;
      });
    }

    if (metadata && Object.keys(metadata).length > 0) {
      output += 'Metadata:\n';
      Object.entries(metadata).forEach(([key, value]) => {
        output += `  ${key}: ${JSON.stringify(value)}\n`;
      });
    }

    return output;
  }
}

export default BaseDetector;
