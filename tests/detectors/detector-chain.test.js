/**
 * DetectorChain - Comprehensive Test Suite
 * Tests for Strategy pattern implementation with parallel execution
 *
 * @file tests/detectors/detector-chain.test.js
 */

import { BaseDetector, DetectorChain } from '../../src/detectors/detector-chain.js';

/**
 * Mock Detector Classes for Testing
 */
class MockDetectorHigh extends BaseDetector {
  constructor(tool = 'figma-make', confidence = 0.9, delayMs = 10) {
    super(10); // High priority
    this.tool = tool;
    this.confidence = confidence;
    this.delayMs = delayMs;
    this.detectCalls = 0;
  }

  async detect(projectRoot) {
    this.detectCalls++;
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, this.delayMs));

    return {
      tool: this.tool,
      confidence: this.confidence,
      evidence: [
        `Found ${this.tool} configuration`,
        `Confidence: ${this.confidence}`
      ],
      metadata: {
        detectorName: 'MockDetectorHigh',
        priority: this.priority
      }
    };
  }
}

class MockDetectorMedium extends BaseDetector {
  constructor(tool = 'bolt', confidence = 0.7, delayMs = 15) {
    super(5); // Medium priority
    this.tool = tool;
    this.confidence = confidence;
    this.delayMs = delayMs;
    this.detectCalls = 0;
  }

  async detect(projectRoot) {
    this.detectCalls++;
    await new Promise(resolve => setTimeout(resolve, this.delayMs));

    return {
      tool: this.tool,
      confidence: this.confidence,
      evidence: [
        `Found ${this.tool} markers`
      ],
      metadata: {
        detectorName: 'MockDetectorMedium',
        priority: this.priority
      }
    };
  }
}

class MockDetectorLow extends BaseDetector {
  constructor(tool = 'v0', confidence = 0.5, delayMs = 20) {
    super(1); // Low priority
    this.tool = tool;
    this.confidence = confidence;
    this.delayMs = delayMs;
    this.detectCalls = 0;
  }

  async detect(projectRoot) {
    this.detectCalls++;
    await new Promise(resolve => setTimeout(resolve, this.delayMs));

    return {
      tool: this.tool,
      confidence: this.confidence,
      evidence: [
        `Possible ${this.tool} project`
      ],
      metadata: {
        detectorName: 'MockDetectorLow',
        priority: this.priority
      }
    };
  }
}

class FailingDetector extends BaseDetector {
  constructor() {
    super(2);
  }

  async detect(projectRoot) {
    throw new Error('Detector malfunction');
  }
}

/**
 * Test Suite: BaseDetector
 */
describe('BaseDetector', () => {
  test('should create detector with default priority', () => {
    const detector = new BaseDetector();
    expect(detector.priority).toBe(0);
  });

  test('should create detector with custom priority', () => {
    const detector = new BaseDetector(42);
    expect(detector.priority).toBe(42);
  });

  test('should return default detection result', async () => {
    const detector = new BaseDetector();
    const result = await detector.detect('/some/path');

    expect(result).toEqual({
      tool: null,
      confidence: 0.0,
      evidence: [],
      metadata: {}
    });
  });

  test('should validate detector', () => {
    const detector = new BaseDetector(5);
    expect(detector.validate()).toBe(true);
  });

  test('should fail validation for invalid priority', () => {
    const detector = new BaseDetector(-1);
    expect(detector.validate()).toBe(false);
  });
});

/**
 * Test Suite: DetectorChain - Initialization
 */
describe('DetectorChain - Initialization', () => {
  test('should create empty chain', () => {
    const chain = new DetectorChain();
    expect(chain.getDetectorCount()).toBe(0);
  });

  test('should create chain with detectors', () => {
    const detectors = [
      new MockDetectorHigh(),
      new MockDetectorLow()
    ];
    const chain = new DetectorChain(detectors);
    expect(chain.getDetectorCount()).toBe(2);
  });

  test('should sort detectors by priority descending', () => {
    const detectors = [
      new MockDetectorLow(), // Priority: 1
      new MockDetectorHigh(), // Priority: 10
      new MockDetectorMedium() // Priority: 5
    ];
    const chain = new DetectorChain(detectors);

    // Verify sorted order
    expect(chain.detectors[0].priority).toBe(10);
    expect(chain.detectors[1].priority).toBe(5);
    expect(chain.detectors[2].priority).toBe(1);
  });

  test('should throw error for non-array input', () => {
    expect(() => {
      new DetectorChain('not an array');
    }).toThrow('Detectors must be an array');
  });

  test('should throw error for invalid detector instance', () => {
    expect(() => {
      new DetectorChain([{ fake: 'detector' }]);
    }).toThrow('must have a detect() method');
  });

  test('should throw error for detector with invalid priority', () => {
    const badDetector = new BaseDetector(-5);
    expect(() => {
      new DetectorChain([badDetector]);
    }).toThrow('failed validation');
  });
});

/**
 * Test Suite: DetectorChain - Add/Remove
 */
describe('DetectorChain - Add/Remove Operations', () => {
  test('should add detector to chain', () => {
    const chain = new DetectorChain();
    const detector = new MockDetectorHigh();

    chain.addDetector(detector);
    expect(chain.getDetectorCount()).toBe(1);
  });

  test('should maintain priority order after adding', () => {
    const chain = new DetectorChain();
    chain.addDetector(new MockDetectorLow());
    chain.addDetector(new MockDetectorHigh());
    chain.addDetector(new MockDetectorMedium());

    expect(chain.detectors[0].priority).toBe(10);
    expect(chain.detectors[1].priority).toBe(5);
    expect(chain.detectors[2].priority).toBe(1);
  });

  test('should throw error adding invalid detector', () => {
    const chain = new DetectorChain();
    expect(() => {
      chain.addDetector({ fake: 'detector' });
    }).toThrow(); // Will throw due to validation failure
  });

  test('should remove detector by priority', () => {
    const chain = new DetectorChain([
      new MockDetectorHigh(),
      new MockDetectorMedium()
    ]);

    const removed = chain.removeDetector(5);
    expect(removed).toBe(true);
    expect(chain.getDetectorCount()).toBe(1);
  });

  test('should return false when removing non-existent priority', () => {
    const chain = new DetectorChain([new MockDetectorHigh()]);
    const removed = chain.removeDetector(999);
    expect(removed).toBe(false);
  });
});

/**
 * Test Suite: DetectorChain - Parallel Execution
 */
describe('DetectorChain - Parallel Execution', () => {
  test('should execute all detectors in parallel', async () => {
    const detectors = [
      new MockDetectorHigh(),
      new MockDetectorMedium(),
      new MockDetectorLow()
    ];
    const chain = new DetectorChain(detectors);

    const startTime = Date.now();
    const result = await chain.detect('/test/path');
    const elapsed = Date.now() - startTime;

    // Parallel execution: max delay (20ms) + overhead should be < sequential (10+15+20=45ms)
    expect(elapsed).toBeLessThan(40); // Should complete faster than sequential
    expect(result).toBeDefined();
  });

  test('should call all detectors exactly once per detection', async () => {
    const high = new MockDetectorHigh();
    const medium = new MockDetectorMedium();
    const low = new MockDetectorLow();

    const chain = new DetectorChain([high, medium, low]);
    await chain.detect('/test/path');

    expect(high.detectCalls).toBe(1);
    expect(medium.detectCalls).toBe(1);
    expect(low.detectCalls).toBe(1);
  });

  test('should handle detector failures gracefully', async () => {
    const detectors = [
      new MockDetectorHigh(),
      new FailingDetector(),
      new MockDetectorMedium()
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    // Should still return a valid result despite failure
    expect(result).toBeDefined();
    expect(result.tool).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: DetectorChain - Confidence Scoring
 */
describe('DetectorChain - Confidence Scoring', () => {
  test('should return highest confidence result', async () => {
    const detectors = [
      new MockDetectorLow('v0', 0.5),
      new MockDetectorHigh('figma-make', 0.9),
      new MockDetectorMedium('bolt', 0.7)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    expect(result.tool).toBe('figma-make');
    expect(result.confidence).toBe(0.9);
  });

  test('should handle equal confidence scores', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.8),
      new MockDetectorMedium('bolt', 0.8)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    // Should return first one with equal confidence (after sorting by priority)
    expect(result.tool).toBe('figma-make');
    expect(result.confidence).toBe(0.8);
  });

  test('should handle zero confidence', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.0)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    expect(result.confidence).toBe(0.0);
    expect(result.tool).toBe('figma-make');
  });

  test('should handle maximum confidence', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 1.0)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    expect(result.confidence).toBe(1.0);
  });
});

/**
 * Test Suite: DetectorChain - Early Exit Optimization
 */
describe('DetectorChain - Early Exit Optimization', () => {
  test('should exit early with high confidence (> 0.95)', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.98),
      new MockDetectorMedium('bolt', 0.7),
      new MockDetectorLow('v0', 0.5)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    expect(result.metadata.earlyExit).toBe(true);
    expect(result.confidence).toBe(0.98);
    expect(chain.executionMetrics.earlyExits).toBe(1);
  });

  test('should not exit early with confidence <= 0.95', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.95),
      new MockDetectorMedium('bolt', 0.7)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    expect(result.metadata.earlyExit).toBe(false);
    expect(chain.executionMetrics.earlyExits).toBe(0);
  });

  test('should increment early exit counter', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.99)
    ];
    const chain = new DetectorChain(detectors);

    expect(chain.executionMetrics.earlyExits).toBe(0);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.earlyExits).toBe(1);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.earlyExits).toBe(2);
  });
});

/**
 * Test Suite: DetectorChain - Result Structure
 */
describe('DetectorChain - Result Structure', () => {
  test('should return properly structured detection result', async () => {
    const chain = new DetectorChain([new MockDetectorHigh()]);
    const result = await chain.detect('/test/path');

    expect(result).toHaveProperty('tool');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('metadata');

    expect(typeof result.tool).toBe('string');
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(typeof result.metadata).toBe('object');
  });

  test('should include execution metrics in metadata', async () => {
    const chain = new DetectorChain([new MockDetectorHigh()]);
    const result = await chain.detect('/test/path');

    expect(result.metadata).toHaveProperty('executionTime');
    expect(result.metadata).toHaveProperty('detectorCount');
    expect(typeof result.metadata.executionTime).toBe('number');
    expect(result.metadata.detectorCount).toBe(1);
  });

  test('should include all results in metadata', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.9),
      new MockDetectorMedium('bolt', 0.7)
    ];
    const chain = new DetectorChain(detectors);
    const result = await chain.detect('/test/path');

    expect(result.metadata.allResults).toBeDefined();
    expect(Array.isArray(result.metadata.allResults)).toBe(true);
    expect(result.metadata.allResults.length).toBe(2);
  });

  test('should include evidence from detection', async () => {
    const chain = new DetectorChain([new MockDetectorHigh()]);
    const result = await chain.detect('/test/path');

    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence[0]).toContain('Found');
  });
});

/**
 * Test Suite: DetectorChain - Empty Chain
 */
describe('DetectorChain - Empty Chain', () => {
  test('should handle empty detector list', async () => {
    const chain = new DetectorChain([]);
    const result = await chain.detect('/test/path');

    expect(result.tool).toBeNull();
    expect(result.confidence).toBe(0.0);
    expect(result.evidence).toContain('No detectors configured');
    expect(result.metadata.detectorCount).toBe(0);
  });

  test('should return valid result for empty chain', async () => {
    const chain = new DetectorChain();
    const result = await chain.detect('/test/path');

    expect(result).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.executionTime).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Test Suite: DetectorChain - Error Handling
 */
describe('DetectorChain - Error Handling', () => {
  test('should throw error for invalid projectRoot', async () => {
    const chain = new DetectorChain([new MockDetectorHigh()]);

    await expect(chain.detect('')).rejects.toThrow();
    await expect(chain.detect(null)).rejects.toThrow();
    await expect(chain.detect(undefined)).rejects.toThrow();
    await expect(chain.detect(123)).rejects.toThrow();
  });

  test('should wrap detection errors', async () => {
    const detectors = [
      new MockDetectorHigh(),
      new FailingDetector()
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/path');

    // Should still succeed despite one failure
    expect(result).toBeDefined();
    expect(result.tool).toBeTruthy();
  });
});

/**
 * Test Suite: DetectorChain - Metrics
 */
describe('DetectorChain - Metrics', () => {
  test('should track execution metrics', async () => {
    const detectors = [
      new MockDetectorHigh(),
      new MockDetectorMedium()
    ];
    const chain = new DetectorChain(detectors);

    expect(chain.executionMetrics.totalExecutions).toBe(0);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.totalExecutions).toBe(1);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.totalExecutions).toBe(2);
  });

  test('should calculate average execution time', async () => {
    const detectors = [
      new MockDetectorHigh(undefined, undefined, 10)
    ];
    const chain = new DetectorChain(detectors);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.averageTime).toBeGreaterThan(0);
  });

  test('should provide detector metrics', () => {
    const detectors = [
      new MockDetectorHigh(),
      new MockDetectorMedium()
    ];
    const chain = new DetectorChain(detectors);

    const metrics = chain.getMetrics();

    expect(metrics).toHaveProperty('totalExecutions');
    expect(metrics).toHaveProperty('averageTime');
    expect(metrics).toHaveProperty('earlyExits');
    expect(metrics).toHaveProperty('detectorCount');
    expect(metrics).toHaveProperty('detectorPriorities');
    expect(metrics.detectorCount).toBe(2);
    expect(Array.isArray(metrics.detectorPriorities)).toBe(true);
  });

  test('should reset metrics', async () => {
    const detectors = [new MockDetectorHigh()];
    const chain = new DetectorChain(detectors);

    await chain.detect('/test/path');
    expect(chain.executionMetrics.totalExecutions).toBe(1);

    chain.resetMetrics();
    expect(chain.executionMetrics.totalExecutions).toBe(0);
    expect(chain.executionMetrics.averageTime).toBe(0);
    expect(chain.executionMetrics.earlyExits).toBe(0);
  });
});

/**
 * Test Suite: DetectorChain - Integration
 */
describe('DetectorChain - Integration', () => {
  test('should handle complex detection scenario', async () => {
    const detectors = [
      new MockDetectorHigh('figma-make', 0.85),
      new MockDetectorMedium('bolt', 0.75),
      new MockDetectorLow('v0', 0.6)
    ];
    const chain = new DetectorChain(detectors);

    const result = await chain.detect('/test/project');

    // Verify result
    expect(result.tool).toBe('figma-make');
    expect(result.confidence).toBe(0.85);
    expect(result.evidence).toBeDefined();
    expect(result.metadata.detectorCount).toBe(3);
    expect(result.metadata.allResults.length).toBe(3);

    // Verify metrics
    const metrics = chain.getMetrics();
    expect(metrics.totalExecutions).toBe(1);
    expect(metrics.detectorCount).toBe(3);
  });

  test('should handle multiple sequential detections', async () => {
    const chain = new DetectorChain([
      new MockDetectorHigh('figma-make', 0.9)
    ]);

    const result1 = await chain.detect('/path1');
    const result2 = await chain.detect('/path2');

    expect(result1.tool).toBe('figma-make');
    expect(result2.tool).toBe('figma-make');
    expect(chain.executionMetrics.totalExecutions).toBe(2);
  });

  test('should maintain detector independence', async () => {
    const high = new MockDetectorHigh('figma-make', 0.9);
    const medium = new MockDetectorMedium('bolt', 0.7);

    const chain1 = new DetectorChain([high]);
    const chain2 = new DetectorChain([medium]);

    const result1 = await chain1.detect('/test');
    const result2 = await chain2.detect('/test');

    expect(result1.tool).toBe('figma-make');
    expect(result2.tool).toBe('bolt');
    expect(high.detectCalls).toBe(1);
    expect(medium.detectCalls).toBe(1);
  });
});
