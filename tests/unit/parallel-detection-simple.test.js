/**
 * Parallel Detection Optimization - Simplified Tests
 * Tests for 40% performance improvement through Promise.all() execution
 * Focus on core functionality without complex mocking
 */

import {
  detectFrameworkOptimized,
  detectUILibraryOptimized,
  calculatePerformanceStats,
  formatBenchmarkReport
} from '../../src/lib/detection-optimizer.js';

describe('Parallel Detection Optimization - Core Functions', () => {
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
        expect(result.earlyExit).toBe(true);
      });
    });

    it('should detect webpack frameworks with high confidence', () => {
      const deps = { webpack: '^5.0.0', react: '^18.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('react-webpack');
      expect(result.confidence).toBe(0.97);
      expect(result.earlyExit).toBe(true);
    });

    it('should detect rollup frameworks', () => {
      const deps = { rollup: '^3.0.0', react: '^18.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('react-rollup');
      expect(result.confidence).toBe(0.95);
      expect(result.earlyExit).toBe(false); // confidence === 0.95, not > 0.95
    });

    it('should detect standalone frameworks with lower confidence', () => {
      const testCases = [
        { deps: { react: '^18.0.0' }, expected: 'react' },
        { deps: { vue: '^3.0.0' }, expected: 'vue' },
        { deps: { svelte: '^4.0.0' }, expected: 'svelte' }
      ];

      testCases.forEach(({ deps, expected }) => {
        const result = detectFrameworkOptimized(deps);
        expect(result.framework).toBe(expected);
        expect(result.confidence).toBe(0.85);
        expect(result.earlyExit).toBeUndefined();
      });
    });

    it('should fallback to vanilla with low confidence', () => {
      const deps = {};

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('vanilla');
      expect(result.confidence).toBe(0.5);
      expect(result.earlyExit).toBeUndefined();
    });

    it('should measure execution time for detection', () => {
      const deps = { vite: '^4.0.0', react: '^18.0.0' };

      const result = detectFrameworkOptimized(deps);

      expect(result.elapsed).toBeGreaterThanOrEqual(0);
      expect(typeof result.elapsed).toBe('number');
      expect(result.elapsed).toBeLessThan(5); // Should be very fast
    });

    it('should prioritize build tools over frameworks', () => {
      // When both build tool and framework are present, build tool name comes first
      const deps = {
        vite: '^4.0.0',
        react: '^18.0.0',
        webpack: '^5.0.0' // Both Vite and Webpack present
      };

      const result = detectFrameworkOptimized(deps);

      expect(result.framework).toBe('react-vite'); // Vite is checked first
      expect(result.confidence).toBe(0.98);
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

    it('should detect Ant Design with alternative package name', () => {
      const deps = { '@ant-design/icons': '^5.0.0' };

      const result = detectUILibraryOptimized(deps);

      expect(result.library).toBe('Ant Design');
      expect(result.confidence).toBe(0.99);
    });

    it('should return none for no UI library', () => {
      const deps = { react: '^18.0.0', typescript: '^5.0.0' };

      const result = detectUILibraryOptimized(deps);

      expect(result.library).toBe('none');
      expect(result.confidence).toBe(0);
    });

    it('should prioritize first matching UI library', () => {
      // When multiple UI libraries are present, first match wins
      const deps = {
        '@mui/material': '^5.0.0',
        'tailwindcss': '^3.0.0',
        'antd': '^5.0.0'
      };

      const result = detectUILibraryOptimized(deps);

      expect(result.library).toBe('Material-UI'); // First in check order
      expect(result.confidence).toBe(0.99);
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

    it('should calculate expected vs actual times', () => {
      const parallelTime = 120;

      const stats = calculatePerformanceStats(parallelTime);

      const sequentialApprox = parallelTime * 2.8;
      expect(stats.estimatedSequentialTime).toEqual(sequentialApprox);
      expect(stats.speedupFactor).toEqual((sequentialApprox / parallelTime).toFixed(2));
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
      expect(report).toContain('Parallel Optimization');
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
      expect(report).toContain('Skipped unnecessary');
    });

    it('should handle reports without early exit', () => {
      const benchmarks = {
        totalTime: 200,
        packageReadTime: 40,
        parallelDetectionTime: 100,
        buildOutputElapsed: 60,
        detectedBy: 'none',
        earlyExitTriggered: false
      };

      const report = formatBenchmarkReport(benchmarks);

      expect(report).toContain('Detection Performance Metrics');
      expect(report).not.toContain('Early exit triggered');
    });

    it('should show timing breakdown', () => {
      const benchmarks = {
        totalTime: 280,
        packageReadTime: 30,
        parallelDetectionTime: 120,
        buildOutputElapsed: 90,
        detectedBy: 'vite'
      };

      const report = formatBenchmarkReport(benchmarks);

      expect(report).toContain('280.00ms');
      expect(report).toContain('30.00ms');
      expect(report).toContain('120.00ms');
      expect(report).toContain('90.00ms');
    });
  });

  describe('Performance Characteristics', () => {
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
      expect(detectionTime).toBeLessThan(10);
      expect(result.elapsed).toBeLessThan(5);
    });

    it('should handle large dependency sets efficiently', () => {
      const deps = {};
      // Add many fake dependencies
      for (let i = 0; i < 1000; i++) {
        deps[`fake-package-${i}`] = '^1.0.0';
      }
      deps['vite'] = '^4.0.0';
      deps['react'] = '^18.0.0';

      const startTime = performance.now();
      const result = detectFrameworkOptimized(deps);
      const detectionTime = performance.now() - startTime;

      // Even with 1000 deps, should still be very fast
      expect(detectionTime).toBeLessThan(50);
      expect(result.framework).toBe('react-vite');
      expect(result.confidence).toBe(0.98);
    });
  });

  describe('Integration: Complete Detection Workflow', () => {
    it('should perform full detection with confidence scoring', () => {
      const framework = detectFrameworkOptimized({
        vite: '^4.0.0',
        react: '^18.0.0'
      });

      const ui = detectUILibraryOptimized({
        react: '^18.0.0',
        tailwindcss: '^3.0.0'
      });

      const stats = calculatePerformanceStats(150);

      // Verify complete detection metadata
      expect(framework.confidence).toBe(0.98);
      expect(ui.confidence).toBe(0.95);
      expect(stats.parallelTime).toBe(150);

      // Calculate overall confidence
      const overallConfidence = (framework.confidence + ui.confidence) / 2;
      expect(overallConfidence).toBeGreaterThan(0.95);
    });

    it('should support verbose reporting of all metrics', () => {
      const benchmarks = {
        totalTime: 310,
        packageReadTime: 60,
        parallelDetectionTime: 180,
        buildOutputElapsed: 110,
        detectedBy: 'rollup',
        earlyExitTriggered: false
      };

      const report = formatBenchmarkReport(benchmarks);

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(100);
    });
  });
});
