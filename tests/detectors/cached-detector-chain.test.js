import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { CachedDetectorChain } from '../../src/detectors/cached-detector-chain.js';
import { V0Detector } from '../../src/detectors/v0-detector.js';
import { FigmaDetector } from '../../src/detectors/figma-detector.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('CachedDetectorChain', () => {
  let tempDir;
  let chain;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cache-detector-test-'));

    // Create package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'test-project', version: '1.0.0', dependencies: {} })
    );

    chain = new CachedDetectorChain([
      new V0Detector(),
      new FigmaDetector()
    ]);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should use cache on second detection', async () => {
    // First detection - cache miss
    const result1 = await chain.detect(tempDir);
    expect(result1.cached).toBe(false);
    expect(result1.elapsed).toBeGreaterThan(0);

    // Second detection - cache hit (should be faster, but allow for timing variance)
    const result2 = await chain.detect(tempDir);
    expect(result2.cached).toBe(true);
    // Cache hit should be significantly faster OR at least complete successfully
    expect(result2.elapsed).toBeLessThanOrEqual(result1.elapsed);
  });

  test('should invalidate cache when package.json changes', async () => {
    // First detection
    const result1 = await chain.detect(tempDir);
    expect(result1.cached).toBe(false);

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    // Modify package.json
    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: { react: '^18.0.0' }
      })
    );

    // Third detection - cache should be invalidated
    const result2 = await chain.detect(tempDir);
    expect(result2.cached).toBe(false);
  });

  test('should work without cache when disabled', async () => {
    const noCacheChain = new CachedDetectorChain([new FigmaDetector()], { enableCache: false });

    const result1 = await noCacheChain.detect(tempDir);
    expect(result1.cached).toBeUndefined();

    const result2 = await noCacheChain.detect(tempDir);
    expect(result2.cached).toBeUndefined();
  });

  test('should clear cache', async () => {
    // Create cache
    await chain.detect(tempDir);

    // Clear cache
    await chain.clearCache(tempDir);

    // Next detection should be cache miss
    const result = await chain.detect(tempDir);
    expect(result.cached).toBe(false);
  });

  test('should measure performance improvement', async () => {
    // First run - no cache
    const result1 = await chain.detect(tempDir);
    const timeWithoutCache = result1.elapsed;

    // Second run - with cache
    const result2 = await chain.detect(tempDir);
    const timeWithCache = result2.elapsed;

    // Cache should be significantly faster
    expect(timeWithCache).toBeLessThan(timeWithoutCache * 0.5);
    expect(result2.cached).toBe(true);
  });

  test('should handle cache corruption gracefully', async () => {
    // Create valid cache
    await chain.detect(tempDir);

    // Corrupt cache file
    const cacheFile = path.join(tempDir, '.vibe-docker', 'cache', 'detection.json');
    await fs.writeFile(cacheFile, 'invalid json {{{');

    // Should fall back to detection
    const result = await chain.detect(tempDir);
    expect(result.cached).toBe(false);
    expect(result.tool).toBeDefined();
  });

  test('should cache null results', async () => {
    // Empty project - no tool detected
    const result1 = await chain.detect(tempDir);
    expect(result1.tool).toBe(null);
    expect(result1.cached).toBe(false);

    // Second detection should use cache
    const result2 = await chain.detect(tempDir);
    expect(result2.tool).toBe(null);
    expect(result2.cached).toBe(true);
  });

  test('should include cache metadata in result', async () => {
    const result = await chain.detect(tempDir);

    expect(result).toHaveProperty('cached');
    expect(result).toHaveProperty('elapsed');
    expect(typeof result.cached).toBe('boolean');
    expect(typeof result.elapsed).toBe('number');
  });

  test('should maintain result structure with cache', async () => {
    const result1 = await chain.detect(tempDir);
    const result2 = await chain.detect(tempDir);

    // Both should have same detection properties
    expect(result1.tool).toBe(result2.tool);
    expect(result1.confidence).toBe(result2.confidence);

    // Cache metadata should differ
    expect(result1.cached).toBe(false);
    expect(result2.cached).toBe(true);
  });
});
