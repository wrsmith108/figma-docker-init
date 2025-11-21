/**
 * Tests for Metrics Collector
 */

import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { MetricsCollector, parseTimeString, getMetricsCollector, resetMetricsCollector } from '../../../src/lib/metrics-collector.js';

// Mock environment
const TEST_DB_PATH = path.join(process.cwd(), 'tests', 'fixtures', 'test-metrics.db');

describe('MetricsCollector', () => {
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
  });

  afterEach(async () => {
    // Clean up
    if (collector) {
      collector.close();
    }

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Privacy Controls', () => {
    it('should respect VIBE_DOCKER_DISABLE_METRICS environment variable', () => {
      const originalEnv = process.env.VIBE_DOCKER_DISABLE_METRICS;
      process.env.VIBE_DOCKER_DISABLE_METRICS = '1';

      const disabledCollector = new MetricsCollector(TEST_DB_PATH);
      expect(disabledCollector.isEnabled()).toBe(false);

      process.env.VIBE_DOCKER_DISABLE_METRICS = originalEnv;
    });

    it('should be enabled by default', () => {
      expect(collector.isEnabled()).toBe(true);
    });

    it('should not record metrics when disabled', async () => {
      const originalEnv = process.env.VIBE_DOCKER_DISABLE_METRICS;
      process.env.VIBE_DOCKER_DISABLE_METRICS = '1';

      const disabledCollector = new MetricsCollector(TEST_DB_PATH);
      await disabledCollector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 100
      });

      expect(fs.existsSync(TEST_DB_PATH)).toBe(false);

      process.env.VIBE_DOCKER_DISABLE_METRICS = originalEnv;
    });

    it('should reset singleton instance', async () => {
      // Get initial instance
      const instance1 = getMetricsCollector(TEST_DB_PATH);
      await instance1.initialize();

      // Reset
      resetMetricsCollector();

      // Get new instance - should be different
      const instance2 = getMetricsCollector(TEST_DB_PATH);

      expect(instance2).not.toBe(instance1);
      expect(instance2.initialized).toBe(false);

      // Cleanup
      if (instance2) instance2.close();
    });

    it('should recreate singleton when dbPath changes', async () => {
      const dbPath1 = path.join(process.cwd(), 'tests', 'fixtures', 'test-db-1.db');
      const dbPath2 = path.join(process.cwd(), 'tests', 'fixtures', 'test-db-2.db');

      try {
        // Get instance with first path
        const instance1 = getMetricsCollector(dbPath1);
        await instance1.initialize();
        expect(instance1.dbPath).toBe(dbPath1);

        // Get instance with different path - should recreate
        const instance2 = getMetricsCollector(dbPath2);
        expect(instance2.dbPath).toBe(dbPath2);
        expect(instance2.initialized).toBe(false);

        // Cleanup
        if (instance2) instance2.close();
        if (fs.existsSync(dbPath1)) fs.unlinkSync(dbPath1);
        if (fs.existsSync(dbPath2)) fs.unlinkSync(dbPath2);
      } finally {
        resetMetricsCollector();
      }
    });

    it('should return same singleton when dbPath unchanged', async () => {
      const instance1 = getMetricsCollector(TEST_DB_PATH);
      await instance1.initialize();

      const instance2 = getMetricsCollector(TEST_DB_PATH);

      expect(instance2).toBe(instance1);
      expect(instance2.initialized).toBe(true);

      // Cleanup
      resetMetricsCollector();
    });
  });

  describe('Database Initialization', () => {
    it('should initialize database with schema', async () => {
      await collector.initialize();

      expect(collector.initialized).toBe(true);
      expect(collector.db).not.toBeNull();
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should load existing database', async () => {
      // Initialize first time
      await collector.initialize();
      await collector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 100
      });
      collector.close();

      // Load existing database
      const collector2 = new MetricsCollector(TEST_DB_PATH);
      await collector2.initialize();

      const summary = await collector2.getSummary();
      expect(summary.detection.length).toBeGreaterThan(0);

      collector2.close();
    });
  });

  describe('Detection Metrics', () => {
    beforeEach(async () => {
      await collector.initialize();
    });

    it('should record detection metrics', async () => {
      await collector.recordDetection({
        framework: 'react',
        confidence: 0.95,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 150
      });

      const summary = await collector.getSummary();
      expect(summary.detection).toHaveLength(1);
      expect(summary.detection[0].framework).toBe('react');
      expect(summary.detection[0].total_detections).toBe(1);
    });

    it('should track detection confidence', async () => {
      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.85,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 120
      });

      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.75,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 130
      });

      const summary = await collector.getSummary();
      const vueMetrics = summary.detection.find(m => m.framework === 'vue');

      expect(vueMetrics).toBeDefined();
      expect(vueMetrics.avg_confidence).toBeCloseTo(0.8, 1);
    });

    it('should track explicit flag usage', async () => {
      await collector.recordDetection({
        framework: 'angular',
        confidence: 1.0,
        sourceTool: 'explicit-flag',
        success: true,
        detectionTimeMs: 50,
        explicitFlag: true
      });

      const stmt = collector.db.prepare(
        'SELECT explicit_flag FROM detection_metrics WHERE framework = ?'
      );
      stmt.bind(['angular']);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();

      expect(row.explicit_flag).toBe(1);
    });
  });

  describe('Build Metrics', () => {
    beforeEach(async () => {
      await collector.initialize();
    });

    it('should record build metrics', async () => {
      await collector.recordBuild({
        template: 'basic',
        framework: 'react',
        success: true,
        durationMs: 5000
      });

      const summary = await collector.getSummary();
      expect(summary.build).toHaveLength(1);
      expect(summary.build[0].template).toBe('basic');
      expect(summary.build[0].successful).toBe(1);
    });

    it('should track build failures and errors', async () => {
      await collector.recordBuild({
        template: 'advanced',
        framework: 'vue',
        success: false,
        durationMs: 3000,
        errorType: 'BuildError',
        errorMessage: 'Failed to compile dependencies'
      });

      const summary = await collector.getSummary();
      const advancedMetrics = summary.build.find(m => m.template === 'advanced');

      expect(advancedMetrics).toBeDefined();
      expect(advancedMetrics.successful).toBe(0);
    });

    it('should record error patterns from build failures', async () => {
      await collector.recordBuild({
        template: 'ui-heavy',
        success: false,
        durationMs: 2000,
        errorType: 'DependencyError',
        errorMessage: 'Module not found: @mui/material'
      });

      const summary = await collector.getSummary();
      expect(summary.errors.length).toBeGreaterThan(0);

      const errorPattern = summary.errors.find(
        e => e.error_type === 'DependencyError'
      );
      expect(errorPattern).toBeDefined();
    });
  });

  describe('Error Patterns', () => {
    beforeEach(async () => {
      await collector.initialize();
    });

    it('should record and track error frequency', async () => {
      const errorMessage = 'Port 3000 is already in use';

      // Record same error multiple times
      await collector.recordErrorPattern({
        errorMessage,
        errorType: 'PortError'
      });

      await collector.recordErrorPattern({
        errorMessage,
        errorType: 'PortError',
        resolution: 'Use different port with PORT=3001'
      });

      const stmt = collector.db.prepare(
        'SELECT frequency, resolution FROM error_patterns WHERE error_message = ?'
      );
      stmt.bind([errorMessage]);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();

      expect(row.frequency).toBe(2);
      expect(row.resolution).toContain('PORT=3001');
    });

    it('should update last occurrence timestamp', async () => {
      const errorMessage = 'Network timeout';

      await collector.recordErrorPattern({
        errorMessage,
        errorType: 'NetworkError'
      });

      const timestamp1 = Date.now();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await collector.recordErrorPattern({
        errorMessage,
        errorType: 'NetworkError'
      });

      const stmt = collector.db.prepare(
        'SELECT last_occurrence FROM error_patterns WHERE error_message = ?'
      );
      stmt.bind([errorMessage]);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();

      expect(row.last_occurrence).toBeGreaterThan(timestamp1);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await collector.initialize();
    });

    it('should record performance metrics', async () => {
      await collector.recordPerformance({
        operation: 'detection',
        durationMs: 150,
        memoryUsageMb: 45.5,
        cpuUsagePercent: 25.3
      });

      const stmt = collector.db.prepare(
        'SELECT * FROM performance_metrics WHERE operation = ?'
      );
      stmt.bind(['detection']);
      stmt.step();
      const row = stmt.getAsObject();
      stmt.free();

      expect(row.duration_ms).toBe(150);
      expect(row.memory_usage_mb).toBeCloseTo(45.5, 1);
      expect(row.cpu_usage_percent).toBeCloseTo(25.3, 1);
    });
  });

  describe('Data Export', () => {
    beforeEach(async () => {
      await collector.initialize();

      // Add some test data
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
    });

    it('should export metrics to JSON', async () => {
      const exportPath = path.join(process.cwd(), 'tests', 'fixtures', 'export.json');

      const success = await collector.exportToJSON(exportPath);
      expect(success).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);

      const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
      expect(exported.detection).toBeDefined();
      expect(exported.build).toBeDefined();
      expect(exported.errors).toBeDefined();

      // Cleanup
      fs.unlinkSync(exportPath);
    });

    it('should export metrics to CSV', async () => {
      const exportPath = path.join(process.cwd(), 'tests', 'fixtures', 'export.csv');

      const success = await collector.exportToCSV(exportPath, 'detection_metrics');
      expect(success).toBe(true);
      expect(fs.existsSync(exportPath)).toBe(true);

      const csv = fs.readFileSync(exportPath, 'utf8');
      expect(csv).toContain('framework');
      expect(csv).toContain('react');

      // Cleanup
      fs.unlinkSync(exportPath);
    });
  });

  describe('Data Cleanup', () => {
    beforeEach(async () => {
      await collector.initialize();
    });

    it('should clear old metrics', async () => {
      // Record old metric (simulated with direct DB insert)
      const oldTimestamp = Date.now() - (100 * 24 * 60 * 60 * 1000); // 100 days ago

      const stmt = collector.db.prepare(`
        INSERT INTO detection_metrics (
          timestamp, framework, confidence, source_tool, success, detection_time_ms
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run([oldTimestamp, 'react', 0.9, 'detector', 1, 100]);
      stmt.free();
      collector.save();

      // Record recent metric
      await collector.recordDetection({
        framework: 'vue',
        confidence: 0.85,
        sourceTool: 'detector',
        success: true,
        detectionTimeMs: 120
      });

      // Clear metrics older than 90 days
      await collector.clearOldMetrics(90);

      // Check remaining metrics
      const countStmt = collector.db.prepare('SELECT COUNT(*) as count FROM detection_metrics');
      countStmt.step();
      const row = countStmt.getAsObject();
      countStmt.free();

      expect(row.count).toBe(1); // Only recent metric should remain
    });
  });
});

describe('parseTimeString', () => {
  it('should parse seconds correctly', () => {
    const timestamp = parseTimeString('30s');
    const expected = Date.now() - 30000;
    expect(timestamp).toBeCloseTo(expected, -2); // Within 100ms
  });

  it('should parse minutes correctly', () => {
    const timestamp = parseTimeString('15m');
    const expected = Date.now() - (15 * 60 * 1000);
    expect(timestamp).toBeCloseTo(expected, -2);
  });

  it('should parse hours correctly', () => {
    const timestamp = parseTimeString('24h');
    const expected = Date.now() - (24 * 60 * 60 * 1000);
    expect(timestamp).toBeCloseTo(expected, -2);
  });

  it('should parse days correctly', () => {
    const timestamp = parseTimeString('7d');
    const expected = Date.now() - (7 * 24 * 60 * 60 * 1000);
    expect(timestamp).toBeCloseTo(expected, -2);
  });

  it('should throw error for invalid format', () => {
    expect(() => parseTimeString('invalid')).toThrow('Invalid time string format');
    expect(() => parseTimeString('7x')).toThrow('Invalid time string format');
  });
});
