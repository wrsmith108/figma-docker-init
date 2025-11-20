/**
 * Integration Tests for Metrics System
 *
 * Tests full workflow of metrics collection, storage, and reporting.
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { MetricsCollector } from '../../../src/lib/metrics-collector.js';
import {
  generateDashboard,
  generateDetectionReport,
  generateBuildReport,
  generateInsights
} from '../../../src/lib/metrics-dashboard.js';

const TEST_DB_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'integration-metrics.db');

describe('Metrics Integration Tests', () => {
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

    collector = new MetricsCollector(TEST_DB_PATH);
    await collector.initialize();
  });

  afterEach(async () => {
    if (collector) {
      collector.close();
    }

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Full Workflow: Detection → Build → Reporting', () => {
    it('should track complete detection and build workflow', async () => {
      // Simulate detection phase
      const detectionStart = Date.now();
      await collector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'auto-detector',
        success: true,
        detectionTimeMs: Date.now() - detectionStart,
        projectPath: '/test/project'
      });

      // Simulate build phase
      const buildStart = Date.now();
      await collector.recordBuild({
        template: 'basic',
        framework: 'react',
        success: true,
        durationMs: Date.now() - buildStart
      });

      // Generate reports
      const dashboard = await generateDashboard({
        since: '1d',
        format: 'json'
      });

      expect(dashboard.detection.length).toBeGreaterThan(0);
      expect(dashboard.build.length).toBeGreaterThan(0);

      const reactDetection = dashboard.detection.find(d => d.framework === 'react');
      expect(reactDetection).toBeDefined();
      expect(reactDetection.successful).toBe(1);

      const basicBuild = dashboard.build.find(b => b.template === 'basic');
      expect(basicBuild).toBeDefined();
      expect(basicBuild.successful).toBe(1);
    });

    it('should handle build failures and error tracking', async () => {
      // Successful detection
      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.88,
        sourceTool: 'auto-detector',
        success: true,
        detectionTimeMs: 150
      });

      // Failed build with error
      const errorMessage = 'Failed to install dependencies: npm ERR! 404 Not Found';
      await collector.recordBuild({
        template: 'advanced',
        framework: 'vue',
        success: false,
        durationMs: 5000,
        errorType: 'DependencyError',
        errorMessage
      });

      // Check error was recorded
      const summary = await collector.getSummary();
      expect(summary.errors.length).toBeGreaterThan(0);

      const depError = summary.errors.find(e => e.error_type === 'DependencyError');
      expect(depError).toBeDefined();
      expect(depError.total_errors).toBeGreaterThan(0);
    });

    it('should track retry attempts', async () => {
      // First attempt - failure
      await collector.recordBuild({
        template: 'ui-heavy',
        framework: 'react',
        success: false,
        durationMs: 3000,
        errorType: 'BuildError',
        errorMessage: 'Build failed - timeout',
        retryCount: 0
      });

      // Retry attempt - success
      await collector.recordBuild({
        template: 'ui-heavy',
        framework: 'react',
        success: true,
        durationMs: 4500,
        retryCount: 1
      });

      const report = await generateBuildReport({ since: '1d' });
      const uiHeavy = report.find(r => r.template === 'ui-heavy');

      expect(uiHeavy).toBeDefined();
      expect(uiHeavy.total).toBe(2);
      expect(uiHeavy.successful).toBe(1);
      expect(uiHeavy.avg_retries).toBeGreaterThan(0);
    });
  });

  describe('Multi-Framework Detection Accuracy', () => {
    it('should track accuracy across multiple frameworks', async () => {
      const frameworks = [
        { name: 'react', confidence: 0.95, success: true },
        { name: 'vue', confidence: 0.88, success: true },
        { name: 'angular', confidence: 0.92, success: true },
        { name: 'svelte', confidence: 0.75, success: false }, // Low confidence failure
        { name: 'nextjs', confidence: 1.0, success: true, explicit: true }
      ];

      for (const fw of frameworks) {
        await collector.recordDetection({
          framework: fw.name,
          confidence: fw.confidence,
          sourceTool: fw.explicit ? 'explicit-flag' : 'auto-detector',
          success: fw.success,
          detectionTimeMs: 100 + Math.random() * 100,
          explicitFlag: fw.explicit || false
        });
      }

      const report = await generateDetectionReport({ since: '1d' });

      expect(report.length).toBe(5);

      // Verify success rates
      const successful = report.filter(r => r.successful > 0);
      expect(successful.length).toBeGreaterThanOrEqual(4);

      // Verify confidence tracking
      const nextjs = report.find(r => r.framework === 'nextjs');
      expect(nextjs.avg_confidence).toBe(1.0);
      expect(nextjs.explicit_flags).toBe(1);
    });
  });

  describe('Error Pattern Analysis', () => {
    it('should identify recurring error patterns', async () => {
      const commonError = 'Port 3000 is already in use';

      // Simulate multiple occurrences of same error
      for (let i = 0; i < 5; i++) {
        await collector.recordBuild({
          template: 'basic',
          success: false,
          durationMs: 1000,
          errorType: 'PortError',
          errorMessage: commonError
        });

        // Wait a bit to simulate time passing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Add a resolution for the error
      await collector.recordErrorPattern({
        errorMessage: commonError,
        errorType: 'PortError',
        resolution: 'Use PORT=3001 environment variable'
      });

      const summary = await collector.getSummary();
      const portError = summary.errors.find(e => e.error_type === 'PortError');

      expect(portError).toBeDefined();
      expect(portError.total_occurrences).toBeGreaterThanOrEqual(5);
    });

    it('should track error frequency over time', async () => {
      const errors = [
        { msg: 'Network timeout', type: 'NetworkError', freq: 3 },
        { msg: 'Out of memory', type: 'MemoryError', freq: 1 },
        { msg: 'Module not found', type: 'DependencyError', freq: 7 }
      ];

      for (const error of errors) {
        for (let i = 0; i < error.freq; i++) {
          await collector.recordErrorPattern({
            errorMessage: error.msg,
            errorType: error.type
          });
        }
      }

      const summary = await collector.getSummary();

      // Errors should be ordered by frequency (descending)
      expect(summary.errors.length).toBe(3);

      const mostFrequent = summary.errors[0];
      expect(mostFrequent.error_type).toBe('DependencyError');
      expect(mostFrequent.total_occurrences).toBe(7);
    });
  });

  describe('Performance Tracking', () => {
    it('should track performance metrics over time', async () => {
      // Simulate multiple detections with varying performance
      for (let i = 0; i < 10; i++) {
        await collector.recordPerformance({
          operation: 'detection',
          durationMs: 100 + Math.random() * 200,
          memoryUsageMb: 40 + Math.random() * 20,
          cpuUsagePercent: 15 + Math.random() * 30
        });
      }

      // Query performance metrics
      const stmt = collector.db.prepare(`
        SELECT
          AVG(duration_ms) as avg_duration,
          MIN(duration_ms) as min_duration,
          MAX(duration_ms) as max_duration,
          AVG(memory_usage_mb) as avg_memory,
          AVG(cpu_usage_percent) as avg_cpu
        FROM performance_metrics
        WHERE operation = 'detection'
      `);

      stmt.step();
      const metrics = stmt.getAsObject();
      stmt.free();

      expect(metrics.avg_duration).toBeGreaterThan(0);
      expect(metrics.min_duration).toBeLessThanOrEqual(metrics.avg_duration);
      expect(metrics.max_duration).toBeGreaterThanOrEqual(metrics.avg_duration);
      expect(metrics.avg_memory).toBeGreaterThan(0);
      expect(metrics.avg_cpu).toBeGreaterThan(0);
    });
  });

  describe('Insights Generation', () => {
    it('should generate actionable insights from metrics', async () => {
      // Create scenario with low detection success for one framework
      for (let i = 0; i < 10; i++) {
        await collector.recordDetection({
          framework: 'angular',
          confidence: 0.65,
          sourceTool: 'auto-detector',
          success: i < 6, // 60% success rate
          detectionTimeMs: 150
        });
      }

      // Create scenario with slow builds
      for (let i = 0; i < 5; i++) {
        await collector.recordBuild({
          template: 'complex',
          success: true,
          durationMs: 180000 // 3 minutes
        });
      }

      // Create frequent error
      for (let i = 0; i < 12; i++) {
        await collector.recordErrorPattern({
          errorMessage: 'Docker daemon not running',
          errorType: 'DockerError'
        });
      }

      const insights = await generateInsights({ since: '1d' });

      // Should identify low detection success
      const detectionIssue = insights.detection.find(
        i => i.framework === 'angular' && i.severity === 'warning'
      );
      expect(detectionIssue).toBeDefined();

      // Should identify slow builds
      const buildIssue = insights.build.find(
        i => i.template === 'complex'
      );
      expect(buildIssue).toBeDefined();

      // Should identify frequent errors
      const errorIssue = insights.errors.find(
        e => e.errorType === 'DockerError'
      );
      expect(errorIssue).toBeDefined();

      // Should provide recommendations
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Data Export and Import', () => {
    it('should export metrics to JSON format', async () => {
      // Add some metrics
      await collector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 100
      });

      await collector.recordBuild({
        template: 'basic',
        success: true,
        durationMs: 5000
      });

      const exportPath = path.join(process.cwd(), 'tests', 'fixtures', 'export-test.json');

      const success = await collector.exportToJSON(exportPath);
      expect(success).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);

      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exported.detection).toBeDefined();
      expect(exported.build).toBeDefined();
      expect(exported.generatedAt).toBeDefined();

      // Cleanup
      fs.unlinkSync(exportPath);
    });

    it('should export metrics to CSV format', async () => {
      // Add some metrics
      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.88,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 120
      });

      const exportPath = path.join(process.cwd(), 'tests', 'fixtures', 'export-test.csv');

      const success = await collector.exportToCSV(exportPath, 'detection_metrics');
      expect(success).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);

      const csv = fs.readFileSync(exportPath, 'utf8');
      const lines = csv.split('\n');

      expect(lines.length).toBeGreaterThan(1); // Header + at least one data row
      expect(lines[0]).toContain('framework');
      expect(csv).toContain('vue');

      // Cleanup
      fs.unlinkSync(exportPath);
    });
  });

  describe('Privacy and Data Management', () => {
    it('should respect privacy opt-out setting', async () => {
      const originalEnv = process.env.VIBE_DOCKER_DISABLE_METRICS;
      process.env.VIBE_DOCKER_DISABLE_METRICS = '1';

      // Create new collector with opt-out enabled
      const disabledCollector = new MetricsCollector(
        path.join(process.cwd(), 'tests', 'fixtures', 'disabled-metrics.db')
      );

      expect(disabledCollector.isEnabled()).toBe(false);

      await disabledCollector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 100
      });

      // Database should not be created
      expect(fs.existsSync(disabledCollector.dbPath)).toBe(false);

      process.env.VIBE_DOCKER_DISABLE_METRICS = originalEnv;
    });

    it('should clean up old metrics data', async () => {
      // Insert old metrics (simulated)
      const oldTimestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago

      const stmt = collector.db.prepare(`
        INSERT INTO detection_metrics (
          timestamp, framework, confidence, source_tool, success, detection_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run([oldTimestamp, 'react', 0.9, 'detector', 1, 100]);
      stmt.free();
      collector.save();

      // Insert recent metrics
      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.85,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 120
      });

      // Clear old metrics
      await collector.clearOldMetrics(90);

      // Count remaining metrics
      const countStmt = collector.db.prepare('SELECT COUNT(*) as count FROM detection_metrics');
      countStmt.step();
      const row = countStmt.getAsObject();
      countStmt.free();

      expect(row.count).toBe(1); // Only recent metric should remain
    });
  });

  describe('Database Integrity and Performance', () => {
    it('should handle concurrent writes gracefully', async () => {
      const promises = [];

      // Simulate concurrent metric recording
      for (let i = 0; i < 10; i++) {
        promises.push(
          collector.recordDetection({
            framework: 'react',
            confidence: 0.9,
            sourceTool: 'detector',
            success: true,
            detectionTimeMs: 100
          })
        );

        promises.push(
          collector.recordBuild({
            template: 'basic',
            success: true,
            durationMs: 5000
          })
        );
      }

      await Promise.all(promises);

      const summary = await collector.getSummary();
      expect(summary.detection[0].total_detections).toBe(10);
      expect(summary.build[0].total_builds).toBe(10);
    });

    it('should maintain database integrity after multiple operations', async () => {
      // Perform various operations
      await collector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 100
      });

      await collector.recordBuild({
        template: 'basic',
        success: false,
        durationMs: 3000,
        errorType: 'BuildError',
        errorMessage: 'Test error'
      });

      await collector.recordPerformance({
        operation: 'detection',
        durationMs: 150
      });

      // Close and reopen database
      collector.close();

      const newCollector = new MetricsCollector(TEST_DB_PATH);
      await newCollector.initialize();

      const summary = await newCollector.getSummary();

      expect(summary.detection.length).toBeGreaterThan(0);
      expect(summary.build.length).toBeGreaterThan(0);
      expect(summary.errors.length).toBeGreaterThan(0);

      newCollector.close();
    });
  });
});
