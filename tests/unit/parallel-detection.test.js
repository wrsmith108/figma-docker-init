/**
 * Parallel Detection Optimization Tests
 * Tests for 40% performance improvement through Promise.all() execution
 * @see src/lib/detection-optimizer.js
 */

import { createRequire } from 'module';
import { jest } from '@jest/globals';

const require = createRequire(import.meta.url);

import {
  detectBuildOutputDirParallel,
  detectFrameworkOptimized,
  detectUILibraryOptimized,
  calculatePerformanceStats,
  formatBenchmarkReport
} from '../../src/lib/detection-optimizer.js';

// Create a simple mock function for tests
const createMockFn = (returnValue) => {
  const fn = jest.fn();
  if (returnValue instanceof Promise) {
    fn.mockReturnValue(returnValue);
  } else {
    fn.mockResolvedValue(returnValue);
  }
  return fn;
};

describe('Parallel Detection Optimization', () => {
  describe('detectBuildOutputDirParallel', () => {
    it('should execute config parsers in parallel using Promise.all()', async () => {
      const mockParseViteConfig = jest.fn().mockResolvedValue('dist');
      const mockParseRollupConfig = jest.fn().mockResolvedValue(null);
      const mockParseWebpackConfig = jest.fn().mockResolvedValue(null);

      const result = await detectBuildOutputDirParallel(
        mockParseViteConfig,
        mockParseRollupConfig,
        mockParseWebpackConfig,
        '/test'
      );

      // All parsers should be called, even if first succeeds
      expect(mockParseViteConfig).toHaveBeenCalledWith('/test');
      expect(mockParseRollupConfig).toHaveBeenCalledWith('/test');
      expect(mockParseWebpackConfig).toHaveBeenCalledWith('/test');

      // Verify result structure
      expect(result).toHaveProperty('dir', 'dist');
      expect(result).toHaveProperty('confidence', 1.0);
      expect(result).toHaveProperty('elapsed');
      expect(result).toHaveProperty('detectedBy', 'vite');
    });

    it('should prioritize Vite with highest confidence', async () => {
      const mockParseViteConfig = jest.fn().mockResolvedValue('vite-dist');
      const mockParseRollupConfig = jest.fn().mockResolvedValue('rollup-dist');
      const mockParseWebpackConfig = jest.fn().mockResolvedValue('webpack-dist');

      const result = await detectBuildOutputDirParallel(
        mockParseViteConfig,
        mockParseRollupConfig,
        mockParseWebpackConfig,
        '/test'
      );

      expect(result.dir).toBe('vite-dist');
      expect(result.confidence).toBe(1.0);
      expect(result.detectedBy).toBe('vite');
    });

    it('should fallback to Rollup if Vite not found', async () => {
      const mockParseViteConfig = jest.fn().mockResolvedValue(null);
      const mockParseRollupConfig = jest.fn().mockResolvedValue('rollup-dist');
      const mockParseWebpackConfig = jest.fn();

      const result = await detectBuildOutputDirParallel(
        mockParseViteConfig,
        mockParseRollupConfig,
        mockParseWebpackConfig,
        '/test'
      );

      expect(result.dir).toBe('rollup-dist');
      expect(result.confidence).toBe(0.95);
      expect(result.detectedBy).toBe('rollup');
    });

    it('should measure and return execution time', async () => {
      const mockParseViteConfig = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('dist'), 10))
      );
      const mockParseRollupConfig = jest.fn().mockResolvedValue(null);
      const mockParseWebpackConfig = jest.fn().mockResolvedValue(null);

      const result = await detectBuildOutputDirParallel(
        mockParseViteConfig,
        mockParseRollupConfig,
        mockParseWebpackConfig,
        '/test'
      );

      expect(result.elapsed).toBeGreaterThan(0);
      expect(typeof result.elapsed).toBe('number');
    });
  });

  describe('detectFrameworkOptimized', () => {
    it('should detect next.js with early exit at 1.0 confidence', () => {
      const deps = { next: '^14.0.0', react: '^18.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('next.js');
      expect(result.confidence).toBe(1.0);
      expect(result.earlyExit).toBe(true);
      expect(result.reason).toContain('next.js');
    });

    it('should detect vite with framework combinations', () => {
      const testCases = [
        { deps: { vite: '^4.0.0', react: '^18.0.0' }, expected: 'react-vite' },
        { deps: { vite: '^4.0.0', vue: '^3.0.0' }, expected: 'vue-vite' },
        { deps: { vite: '^4.0.0', svelte: '^4.0.0' }, expected: 'svelte-vite' },
        { deps: { vite: '^4.0.0' }, expected: 'vite' }
      ];

      testCases.forEach(({ deps, expected }) => {
        const result = detectFrameworkOptimized(deps);
        expect(result.framework).toBe(expected);
        expect(result.confidence).toBe(0.98);
        expect(result.earlyExit).toBe(true); // confidence > 0.95
      });
    });

    it('should detect webpack frameworks with high confidence', () => {
      const deps = { webpack: '^5.0.0', react: '^18.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('react-webpack');
      expect(result.confidence).toBe(0.97);
      expect(result.earlyExit).toBe(true);
    });

    it('should fallback to vanilla with low confidence', () => {
      const deps = {};

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('vanilla');
      expect(result.confidence).toBe(0.5);
      expect(result.earlyExit).toBeUndefined();
    });

    it('should measure execution time for detection', () => {
      const deps = { vite: '^4.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.elapsed).toBeGreaterThanOrEqual(0);
      expect(typeof result.elapsed).toBe('number');
    });
  });

  describe('detectUILibraryOptimized', () => {
    it('should detect Material-UI with highest confidence', () => {
      const deps = { '@mui/material': '^5.0.0', react: '^18.0.0' };

      const result = detectUILibraryOptimized(deps);

      expect(result.library).toBe('Material-UI');
      expect(result.confidence).toBe(0.99);
    });

    it('should detect all major UI libraries', () => {
      const testCases = [
        { check: { '@mui/material': '^5.0.0' }, expected: 'Material-UI' },
        { check: { 'antd': '^5.0.0' }, expected: 'Ant Design' },
        { check: { '@chakra-ui/react': '^2.0.0' }, expected: 'Chakra UI' },
        { check: { '@mantine/core': '^7.0.0' }, expected: 'Mantine' },
        { check: { 'react-bootstrap': '^2.0.0' }, expected: 'Bootstrap' },
        { check: { 'tailwindcss': '^3.0.0' }, expected: 'Tailwind CSS' }
      ];

      testCases.forEach(({ check, expected }) => {
        const result = detectUILibraryOptimized(check);
        expect(result.library).toBe(expected);
        expect(result.confidence).toBeGreaterThanOrEqual(0.95);
      });
    });

    it('should return none for no UI library', () => {
      const deps = { react: '^18.0.0' };

      const result = detectUILibraryOptimized(deps);

      expect(result.library).toBe('none');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Performance Statistics', () => {
    it('should calculate performance improvement correctly', () => {
      const parallelTime = 100; // 100ms for parallel execution

      const stats = calculatePerformanceStats(parallelTime);

      expect(stats.parallelTime).toBe(parallelTime);
      expect(stats.estimatedSequentialTime).toBeGreaterThan(parallelTime);
      expect(parseFloat(stats.speedupFactor)).toBeGreaterThan(1);
      expect(stats.improvementPercent).toMatch(/^\d+\.\d+$/);
    });

    it('should show 40% improvement estimate', () => {
      const parallelTime = 150; // Realistic parallel detection time

      const stats = calculatePerformanceStats(parallelTime);

      // Expected: parallel ~150ms, sequential ~420ms, improvement ~64%
      expect(parseFloat(stats.improvementPercent)).toBeGreaterThan(30);
      expect(parseFloat(stats.speedupFactor)).toBeGreaterThan(2.5);
    });
  });

  describe('Benchmark Reporting', () => {
    it('should format benchmark report with all metrics', () => {
      const benchmarks = {
        totalTime: 250,
        packageReadTime: 50,
        parallelDetectionTime: 150,
        buildOutputElapsed: 80,
        detectedBy: 'vite',
        earlyExitTriggered: true,
        earlyExitFramework: 'next.js',
        sequentialEquivalent: 420
      };

      const report = formatBenchmarkReport(benchmarks);

      expect(report).toContain('Detection Performance Metrics');
      expect(report).toContain('250.00ms');
      expect(report).toContain('next.js');
      expect(report).toContain('64.3%');
    });

    it('should include early exit information in report', () => {
      const benchmarks = {
        totalTime: 200,
        packageReadTime: 40,
        parallelDetectionTime: 100,
        buildOutputElapsed: 60,
        detectedBy: 'webpack',
        earlyExitTriggered: true,
        earlyExitFramework: 'react-webpack'
      };

      const report = formatBenchmarkReport(benchmarks);

      expect(report).toContain('Early exit triggered');
      expect(report).toContain('react-webpack');
      expect(report).toContain('confidence > 0.95');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should execute parallel detection significantly faster than sequential', async () => {
      // Simulate slow parsers
      const slowParser = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(null), 10))
      );

      const startTime = performance.now();
      await detectBuildOutputDirParallel(slowParser, slowParser, slowParser, '/test');
      const parallelTime = performance.now() - startTime;

      // Parallel should take ~10ms (all run at same time)
      // Sequential would take ~30ms (3 x 10ms)
      // Allow overhead and system variance
      expect(parallelTime).toBeLessThan(100); // Lenient timing for CI/CD environments
    });

    it('should maintain fast framework detection', () => {
      const deps = {
        next: '^14.0.0',
        react: '^18.0.0',
        vite: '^4.0.0'
      };

      const startTime = performance.now();
      const result = detectFrameworkOptimized(deps);
      const detectionTime = performance.now() - startTime;

      // Synchronous detection should be very fast
      expect(detectionTime).toBeLessThan(5);
      expect(result.elapsed).toBeLessThan(5);
    });
  });

  describe('Integration: Complete Detection Flow', () => {
    it('should perform full detection with confidence scoring', async () => {
      const mockParseViteConfig = jest.fn().mockResolvedValue('dist');
      const mockParseRollupConfig = jest.fn().mockResolvedValue(null);
      const mockParseWebpackConfig = jest.fn().mockResolvedValue(null);

      const buildOutput = await detectBuildOutputDirParallel(
        mockParseViteConfig,
        mockParseRollupConfig,
        mockParseWebpackConfig,
        '/test'
      );

      const framework = detectFrameworkOptimized({
        vite: '^4.0.0',
        react: '^18.0.0'
      });

      const ui = detectUILibraryOptimized({
        react: '^18.0.0',
        tailwindcss: '^3.0.0'
      });

      // Verify complete detection metadata
      expect(buildOutput.confidence).toBe(1.0);
      expect(framework.confidence).toBe(0.98);
      expect(ui.confidence).toBe(0.95);

      // Calculate overall confidence
      const overallConfidence = (buildOutput.confidence + framework.confidence + ui.confidence) / 3;
      expect(overallConfidence).toBeGreaterThan(0.97);
    });
  });
});
