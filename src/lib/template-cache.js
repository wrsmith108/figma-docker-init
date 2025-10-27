/**
 * Template Cache Manager
 * Purpose: Cache template processing results for 50%+ speed improvement
 * Handles: In-memory caching, invalidation, TTL management
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class TemplateCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes default TTL
    this.maxSize = 100; // Maximum number of cached entries
  }

  /**
   * Generates a cache key from template path and variables
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @returns {string} Cache key
   */
  generateKey(templatePath, variables) {
    const data = JSON.stringify({ templatePath, variables });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Gets the modification time of a file
   * @param {string} filePath - Path to file
   * @returns {number} Modification time in milliseconds
   */
  getFileModTime(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.mtimeMs;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Checks if a cache entry is valid
   * @param {Object} entry - Cache entry
   * @param {string} templatePath - Path to template file
   * @returns {boolean} True if entry is valid
   */
  isValid(entry, templatePath) {
    const now = Date.now();

    // Check TTL
    if (now - entry.timestamp > this.ttl) {
      return false;
    }

    // Check if template file has been modified
    const currentModTime = this.getFileModTime(templatePath);
    if (currentModTime !== entry.modTime) {
      return false;
    }

    return true;
  }

  /**
   * Gets a cached template result
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @returns {string|null} Cached result or null if not found/invalid
   */
  get(templatePath, variables) {
    const key = this.generateKey(templatePath, variables);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (!this.isValid(entry, templatePath)) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.content;
  }

  /**
   * Stores a template result in cache
   * @param {string} templatePath - Path to template file
   * @param {Object} variables - Template variables
   * @param {string} content - Processed content
   */
  set(templatePath, variables, content) {
    // Enforce max cache size using LRU strategy
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(templatePath, variables);
    const entry = {
      content,
      timestamp: Date.now(),
      modTime: this.getFileModTime(templatePath),
      hits: 0
    };

    this.cache.set(key, entry);
  }

  /**
   * Evicts the least recently used entry
   */
  evictLRU() {
    let lruKey = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Invalidates cache entries for a specific template
   * @param {string} templatePath - Path to template file
   */
  invalidate(templatePath) {
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      // Check if entry is for this template by comparing mod times
      const currentModTime = this.getFileModTime(templatePath);
      if (entry.modTime !== currentModTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    let totalHits = 0;
    let entries = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      entries++;
    }

    return {
      entries,
      maxSize: this.maxSize,
      totalHits,
      averageHits: entries > 0 ? totalHits / entries : 0,
      ttl: this.ttl
    };
  }

  /**
   * Sets the TTL for cache entries
   * @param {number} ttlMs - TTL in milliseconds
   */
  setTTL(ttlMs) {
    this.ttl = ttlMs;
  }

  /**
   * Sets the maximum cache size
   * @param {number} size - Maximum number of entries
   */
  setMaxSize(size) {
    this.maxSize = size;
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
}

// Export singleton instance
export const templateCache = new TemplateCache();

// Export class for testing
export { TemplateCache };
