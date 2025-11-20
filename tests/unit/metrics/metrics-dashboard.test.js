/**
 * Tests for Metrics Dashboard
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { MetricsCollector } from '../../../src/lib/metrics-collector.js';
import {
  generateDashboard,
  generateDetectionReport,
  generateBuildReport,
  generateErrorTrends,
  generateInsights
} from '../../../src/lib/metrics-dashboard.js';

const TEST_DB_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'test-dashboard.db');

describe('Metrics Dashboard', () => {
  let collector;

  beforeEach(async () => {
    // Clean up test database
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    // Ensure test directory exists
    const testDir = path.dirname(TEST_DB_PATH);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create fresh collector instance
    collector = new MetricsCollector(TEST_DB_PATH);
    await collector.initialize();

    // Seed with test data
    await seedTestData(collector);
  });

  afterEach(async () => {
    if (collector) {
      collector.close();
    }

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('generateDashboard', () => {
    it('should generate dashboard summary', async () => {
      const result = await generateDashboard({
        since: '30d',
        format: 'json'
      });

      expect(result).toBeDefined();
      expect(result.detection).toBeDefined();
      expect(result.build).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should handle disabled metrics collection', async () => {
      const originalEnv = process.env.VIBE_DOCKER_DISABLE_METRICS;
      process.env.VIBE_DOCKER_DISABLE_METRICS = '1';

      const result = await generateDashboard({ format: 'json' });

      expect(result.error).toBeDefined();
      expect(result.error).toContain('disabled');

      process.env.VIBE_DOCKER_DISABLE_METRICS = originalEnv;
    });

    it('should export to JSON file', async () => {
      const exportPath = path.join(process.cwd(), 'tests', 'fixtures', 'dashboard-export.json');

      await generateDashboard({
        since: '30d',
        format: 'json',
        export: exportPath
      });

      expect(fs.existsSync(exportPath)).toBe(true);

      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exported.detection).toBeDefined();

      // Cleanup
      fs.unlinkSync(exportPath);
    });
  });

  describe('generateDetectionReport', () => {
    it('should generate detection accuracy report', async () => {
      const report = await generateDetectionReport({
        since: '30d'
      });

      expect(report).toBeInstanceOf(Array);
      expect(report.length).toBeGreaterThan(0);

      const reactMetrics = report.find(m => m.framework === 'react');
      expect(reactMetrics).toBeDefined();
      expect(reactMetrics.total).toBeGreaterThan(0);
      expect(reactMetrics.avg_confidence).toBeGreaterThan(0);
      expect(reactMetrics.successful).toBeDefined();
    });

    it('should filter by framework', async () => {
      const report = await generateDetectionReport({
        since: '30d',
        framework: 'vue'
      });

      expect(report).toBeInstanceOf(Array);

      if (report.length > 0) {
        report.forEach(metric => {
          expect(metric.framework).toBe('vue');
        });
      }
    });

    it('should include confidence metrics', async () => {
      const report = await generateDetectionReport({
        since: '30d'
      });

      const firstMetric = report[0];
      expect(firstMetric.avg_confidence).toBeDefined();
      expect(firstMetric.min_confidence).toBeDefined();
      expect(firstMetric.max_confidence).toBeDefined();
      expect(firstMetric.avg_confidence).toBeGreaterThanOrEqual(firstMetric.min_confidence);
      expect(firstMetric.avg_confidence).toBeLessThanOrEqual(firstMetric.max_confidence);
    });
  });

  describe('generateBuildReport', () => {
    it('should generate build performance report', async () => {
      const report = await generateBuildReport({
        since: '30d'
      });

      expect(report).toBeInstanceOf(Array);
      expect(report.length).toBeGreaterThan(0);

      const basicTemplate = report.find(m => m.template === 'basic');
      expect(basicTemplate).toBeDefined();
      expect(basicTemplate.total).toBeGreaterThan(0);
      expect(basicTemplate.successful).toBeDefined();
      expect(basicTemplate.avg_duration).toBeGreaterThan(0);
    });

    it('should filter by template', async () => {
      const report = await generateBuildReport({
        since: '30d',
        template: 'advanced'
      });

      expect(report).toBeInstanceOf(Array);

      if (report.length > 0) {
        report.forEach(metric => {
          expect(metric.template).toBe('advanced');
        });
      }
    });

    it('should include duration metrics', async () => {
      const report = await generateBuildReport({
        since: '30d'
      });

      const firstMetric = report[0];
      expect(firstMetric.avg_duration).toBeDefined();
      expect(firstMetric.min_duration).toBeDefined();
      expect(firstMetric.max_duration).toBeDefined();
      expect(firstMetric.avg_duration).toBeGreaterThanOrEqual(firstMetric.min_duration);
      expect(firstMetric.avg_duration).toBeLessThanOrEqual(firstMetric.max_duration);
    });
  });

  describe('generateErrorTrends', () => {
    it('should generate error patterns report', async () => {
      const errors = await generateErrorTrends({
        since: '30d',
        limit: 10
      });

      expect(errors).toBeInstanceOf(Array);

      if (errors.length > 0) {
        const firstError = errors[0];
        expect(firstError.error_message).toBeDefined();
        expect(firstError.frequency).toBeGreaterThan(0);
        expect(firstError.last_occurrence).toBeDefined();
      }
    });

    it('should limit results', async () => {
      const errors = await generateErrorTrends({
        since: '30d',
        limit: 3
      });

      expect(errors.length).toBeLessThanOrEqual(3);
    });

    it('should order by frequency', async () => {
      const errors = await generateErrorTrends({
        since: '30d',
        limit: 10
      });

      if (errors.length > 1) {
        for (let i = 0; i < errors.length - 1; i++) {
          expect(errors[i].frequency).toBeGreaterThanOrEqual(errors[i + 1].frequency);
        }
      }
    });
  });

  describe('generateInsights', () => {
    it('should generate insights and recommendations', async () => {
      const insights = await generateInsights({
        since: '7d'
      });

      expect(insights).toBeDefined();
      expect(insights.detection).toBeInstanceOf(Array);
      expect(insights.build).toBeInstanceOf(Array);
      expect(insights.errors).toBeInstanceOf(Array);
      expect(insights.recommendations).toBeInstanceOf(Array);
    });

    it('should identify low detection success rates', async () => {
      // Add low success rate data
      for (let i = 0; i < 10; i++) {
        await collector.recordDetection({
          framework: 'angular',
          confidence: 0.6,
          sourceTool: 'detector',
          success: i < 6, // 60% success rate
          detectionTimeMs: 100
        });
      }

      const insights = await generateInsights({ since: '7d' });

      const angularIssue = insights.detection.find(
        i => i.framework === 'angular' && i.severity === 'warning'
      );

      expect(angularIssue).toBeDefined();
      expect(angularIssue.message).toContain('Low success rate');
    });

    it('should identify low confidence scores', async () => {
      // Add low confidence data
      for (let i = 0; i < 5; i++) {
        await collector.recordDetection({
          framework: 'svelte',
          confidence: 0.5,
          sourceTool: 'detector',
          success: true,
          detectionTimeMs: 100
        });
      }

      const insights = await generateInsights({ since: '7d' });

      const svelteIssue = insights.detection.find(
        i => i.framework === 'svelte'
      );

      expect(svelteIssue).toBeDefined();
      expect(svelteIssue.message).toContain('confidence');
    });

    it('should identify high explicit flag usage', async () => {
      // Add explicit flag data
      for (let i = 0; i < 10; i++) {
        await collector.recordDetection({
          framework: 'nextjs',
          confidence: 1.0,
          sourceTool: 'explicit-flag',
          success: true,
          detectionTimeMs: 50,
          explicitFlag: true
        });
      }

      const insights = await generateInsights({ since: '7d' });

      const nextjsIssue = insights.detection.find(
        i => i.framework === 'nextjs'
      );

      expect(nextjsIssue).toBeDefined();
      expect(nextjsIssue.message).toContain('explicit flags');
    });

    it('should identify build performance issues', async () => {
      // Add slow build data
      for (let i = 0; i < 5; i++) {
        await collector.recordBuild({
          template: 'complex',
          success: true,
          durationMs: 150000 // 2.5 minutes
        });
      }

      const insights = await generateInsights({ since: '7d' });

      const complexIssue = insights.build.find(
        i => i.template === 'complex'
      );

      expect(complexIssue).toBeDefined();
      expect(complexIssue.message).toContain('build time');
    });

    it('should identify frequent errors', async () => {
      // Add frequent error data
      const errorMessage = 'Frequent test error';

      for (let i = 0; i < 15; i++) {
        await collector.recordErrorPattern({
          errorMessage,
          errorType: 'TestError'
        });
      }

      const insights = await generateInsights({ since: '7d' });

      const errorIssue = insights.errors.find(
        e => e.errorType === 'TestError'
      );

      expect(errorIssue).toBeDefined();
      expect(errorIssue.severity).toBe('error');
      expect(errorIssue.message).toContain('frequency');
    });

    it('should provide overall recommendations', async () => {
      const insights = await generateInsights({ since: '7d' });

      expect(insights.recommendations.length).toBeGreaterThan(0);

      insights.recommendations.forEach(rec => {
        expect(rec.message).toBeDefined();
        expect(rec.type).toBeDefined();
      });
    });
  });
});

/**
 * Seed test database with sample data
 */
async function seedTestData(collector) {
  // Detection metrics
  const frameworks = ['react', 'vue', 'angular', 'svelte'];

  for (let i = 0; i < 20; i++) {
    const framework = frameworks[i % frameworks.length];
    await collector.recordDetection({
      framework,
      confidence: 0.7 + (Math.random() * 0.3), // 0.7-1.0
      sourceTool: 'detector',
      success: Math.random() > 0.1, // 90% success rate
      detectionTimeMs: 50 + Math.floor(Math.random() * 200)
    });
  }

  // Build metrics
  const templates = ['basic', 'advanced', 'ui-heavy'];

  for (let i = 0; i < 15; i++) {
    const template = templates[i % templates.length];
    const success = Math.random() > 0.05; // 95% success rate

    await collector.recordBuild({
      template,
      framework: frameworks[i % frameworks.length],
      success,
      durationMs: 3000 + Math.floor(Math.random() * 10000),
      errorType: success ? null : 'BuildError',
      errorMessage: success ? null : 'Sample build error'
    });
  }

  // Error patterns
  const errors = [
    { message: 'Port 3000 in use', type: 'PortError', freq: 5 },
    { message: 'Module not found', type: 'DependencyError', freq: 3 },
    { message: 'Network timeout', type: 'NetworkError', freq: 2 }
  ];

  for (const error of errors) {
    for (let i = 0; i < error.freq; i++) {
      await collector.recordErrorPattern({
        errorMessage: error.message,
        errorType: error.type
      });
    }
  }

  // Performance metrics
  for (let i = 0; i < 10; i++) {
    await collector.recordPerformance({
      operation: 'detection',
      durationMs: 100 + Math.floor(Math.random() * 100),
      memoryUsageMb: 40 + Math.random() * 20,
      cpuUsagePercent: 20 + Math.random() * 30
    });
  }
}
