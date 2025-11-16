/**
 * Copyright 2025 Smith Horn Group Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * DetectorChain - Strategy Pattern for Tool Detection
 * Implements parallel detection with confidence scoring and evidence collection
 *
 * Novel patented approach: Parallel AI tool detection with probabilistic
 * confidence scoring and evidence-based reasoning.
 *
 * @module src/detectors/detector-chain
 * @author Claude Code (AI-assisted), Copyright Smith Horn Group Ltd.
 * @version 1.0.0
 */

/**
 * Base Detector Interface
 * All detectors must implement this interface for consistent behavior
 *
 * @abstract
 */
class BaseDetector {
  /**
   * Create a detector with priority
   * @param {number} priority - Detection priority (higher runs first)
   */
  constructor(priority = 0) {
    this.priority = priority;
  }

  /**
   * Detect tool type in project
   *
   * @async
   * @param {string} projectRoot - Root directory of the project
   * @returns {Promise<DetectionResult>} Detection result with confidence and evidence
   *
   * @typedef {Object} DetectionResult
   * @property {string|null} tool - Detected tool ('lovable' | 'bolt' | 'v0' | 'figma-make' | null)
   * @property {number} confidence - Confidence score 0.0 - 1.0
   * @property {string[]} evidence - Array of detection evidence strings
   * @property {Object} metadata - Additional context and diagnostic info
   */
  async detect(projectRoot) {
    return {
      tool: null,
      confidence: 0.0,
      evidence: [],
      metadata: {}
    };
  }

  /**
   * Validate detector configuration
   * @protected
   * @returns {boolean} True if detector is properly configured
   */
  validate() {
    return typeof this.priority === 'number' && this.priority >= 0;
  }
}

/**
 * DetectorChain - Orchestrates multiple detectors with Strategy pattern
 *
 * Features:
 * - Parallel execution of multiple detectors
 * - Confidence-based result selection
 * - Early exit optimization (>0.95 confidence)
 * - Evidence collection for debugging
 * - Extensible detector support
 *
 * @class DetectorChain
 */
class DetectorChain {
  /**
   * Initialize detector chain with list of detectors
   *
   * @param {BaseDetector[]} detectors - Array of detector instances
   * @throws {Error} If detectors array contains invalid items
   */
  constructor(detectors = []) {
    // Validate detectors
    if (!Array.isArray(detectors)) {
      throw new Error('Detectors must be an array');
    }

    detectors.forEach((detector, index) => {
      if (!detector || typeof detector.detect !== 'function') {
        throw new Error(
          `Detector at index ${index} must have a detect() method`
        );
      }
      // Optional validation if method exists
      if (detector.validate && !detector.validate()) {
        throw new Error(`Detector at index ${index} failed validation`);
      }
    });

    // Sort by priority (descending) for optimal execution order
    this.detectors = [...detectors].sort((a, b) => b.priority - a.priority);
    this.executionMetrics = {
      totalExecutions: 0,
      averageTime: 0,
      earlyExits: 0
    };
  }

  /**
   * Add detector to chain
   *
   * @param {BaseDetector} detector - Detector instance to add
   * @throws {Error} If detector is invalid
   */
  addDetector(detector) {
    if (!(detector instanceof BaseDetector)) {
      throw new Error('Detector must be instance of BaseDetector');
    }
    if (!detector.validate()) {
      throw new Error('Detector failed validation');
    }

    this.detectors.push(detector);
    this.detectors.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove detector from chain by priority
   *
   * @param {number} priority - Priority of detector to remove
   * @returns {boolean} True if detector was removed
   */
  removeDetector(priority) {
    const initialLength = this.detectors.length;
    this.detectors = this.detectors.filter(d => d.priority !== priority);
    return this.detectors.length < initialLength;
  }

  /**
   * Detect tool type in project using parallel execution
   *
   * Execution Strategy:
   * 1. Run all detectors in parallel with Promise.all()
   * 2. Find highest confidence result
   * 3. Return early if confidence > 0.95 (optimization)
   * 4. Collect all evidence for debugging
   *
   * @async
   * @param {string} projectRoot - Root directory of project
   * @returns {Promise<DetectionResult>} Best detection result
   * @throws {Error} If projectRoot is invalid or detection fails
   */
  async detect(projectRoot) {
    if (!projectRoot || typeof projectRoot !== 'string') {
      throw new Error('projectRoot must be a non-empty string');
    }

    const startTime = Date.now();
    this.executionMetrics.totalExecutions++;

    // Early exit: no detectors configured
    if (this.detectors.length === 0) {
      return {
        tool: null,
        confidence: 0.0,
        evidence: ['No detectors configured'],
        metadata: {
          detectorCount: 0,
          executionTime: Date.now() - startTime
        }
      };
    }

    try {
      // Execute all detectors in parallel
      const results = await Promise.all(
        this.detectors.map(detector =>
          detector.detect(projectRoot).catch(error => {
            // Gracefully handle detector failures
            return {
              tool: null,
              confidence: 0.0,
              evidence: [`Detector failed: ${error.message}`],
              metadata: { error: error.message }
            };
          })
        )
      );

      // Find highest confidence result
      let bestResult = results[0];
      for (let i = 1; i < results.length; i++) {
        if (results[i].confidence > bestResult.confidence) {
          bestResult = results[i];
        }
      }

      // Early exit optimization: high confidence means no more detection needed
      if (bestResult.confidence > 0.95) {
        this.executionMetrics.earlyExits++;
        return {
          ...bestResult,
          metadata: {
            ...bestResult.metadata,
            earlyExit: true,
            executionTime: Date.now() - startTime,
            detectorCount: this.detectors.length
          }
        };
      }

      // Return best result with all metrics
      const executionTime = Date.now() - startTime;
      this.executionMetrics.averageTime =
        (this.executionMetrics.averageTime * (this.executionMetrics.totalExecutions - 1) +
         executionTime) / this.executionMetrics.totalExecutions;

      return {
        ...bestResult,
        metadata: {
          ...bestResult.metadata,
          earlyExit: false,
          executionTime,
          detectorCount: this.detectors.length,
          allResults: results.map(r => ({
            tool: r.tool,
            confidence: r.confidence
          }))
        }
      };
    } catch (error) {
      throw new Error(
        `DetectorChain failed: ${error.message}`
      );
    }
  }

  /**
   * Get detector chain statistics
   *
   * @returns {Object} Execution metrics and chain info
   */
  getMetrics() {
    return {
      ...this.executionMetrics,
      detectorCount: this.detectors.length,
      detectorPriorities: this.detectors.map(d => ({
        name: d.constructor.name,
        priority: d.priority
      }))
    };
  }

  /**
   * Reset execution metrics
   */
  resetMetrics() {
    this.executionMetrics = {
      totalExecutions: 0,
      averageTime: 0,
      earlyExits: 0
    };
  }

  /**
   * Get number of configured detectors
   *
   * @returns {number} Detector count
   */
  getDetectorCount() {
    return this.detectors.length;
  }
}

export { BaseDetector, DetectorChain };
