/**
 * Metrics Collector
 *
 * Collects and stores metrics for vibe-to-docker operations
 * with privacy controls and opt-out functionality.
 *
 * Uses sql.js (WASM) to avoid native dependencies.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default metrics database path
const DEFAULT_DB_PATH = path.join(process.cwd(), '.claude-flow', 'metrics', 'metrics.db');

/**
 * Metrics Collector class
 */
export class MetricsCollector {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
    // Check environment variable at runtime to allow dynamic changes in tests
    this.enabled = !(process.env.VIBE_DOCKER_DISABLE_METRICS === '1' ||
                     process.env.VIBE_DOCKER_DISABLE_METRICS === 'true');
    this.initialized = false;
  }

  /**
   * Check if metrics collection is enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Initialize the database
   */
  async initialize() {
    if (!this.enabled) {
      console.log('Metrics collection is disabled via VIBE_DOCKER_DISABLE_METRICS');
      return;
    }

    if (this.initialized) {
      return;
    }

    try {
      // Initialize sql.js
      this.SQL = await initSqlJs();

      // Ensure metrics directory exists
      const metricsDir = path.dirname(this.dbPath);
      if (!fs.existsSync(metricsDir)) {
        fs.mkdirSync(metricsDir, { recursive: true });
      }

      // Load existing database or create new one
      if (fs.existsSync(this.dbPath)) {
        const buffer = fs.readFileSync(this.dbPath);
        this.db = new this.SQL.Database(buffer);
      } else {
        this.db = new this.SQL.Database();
        await this.initializeSchema();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize metrics database:', error.message);
      this.enabled = false;
    }
  }

  /**
   * Initialize database schema
   */
  async initializeSchema() {
    const schemaPath = path.join(process.cwd(), '.claude-flow', 'metrics', 'schema.sql');

    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.run(schema);
      this.save();
    } else {
      throw new Error(`Database schema file not found at: ${schemaPath}`);
    }
  }

  /**
   * Save database to disk
   */
  save() {
    if (!this.db || !this.enabled) return;

    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('Failed to save metrics database:', error.message);
    }
  }

  /**
   * Record detection metrics
   */
  async recordDetection({
    framework,
    confidence,
    sourceTool,
    success,
    detectionTimeMs,
    projectPath = null,
    explicitFlag = false
  }) {
    if (!this.enabled || !this.db) return;

    try {
      await this.initialize();

      const stmt = this.db.prepare(`
        INSERT INTO detection_metrics (
          timestamp,
          framework,
          confidence,
          source_tool,
          success,
          detection_time_ms,
          project_path,
          explicit_flag
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        Date.now(),
        framework,
        confidence,
        sourceTool,
        success ? 1 : 0,
        detectionTimeMs,
        projectPath,
        explicitFlag ? 1 : 0
      ]);

      stmt.free();
      this.save();
    } catch (error) {
      console.error('Failed to record detection metrics:', error.message);
    }
  }

  /**
   * Record build metrics
   */
  async recordBuild({
    template,
    framework = null,
    success,
    durationMs,
    errorType = null,
    errorMessage = null,
    retryCount = 0
  }) {
    if (!this.enabled || !this.db) return;

    try {
      await this.initialize();

      const stmt = this.db.prepare(`
        INSERT INTO build_metrics (
          timestamp,
          template,
          framework,
          success,
          duration_ms,
          error_type,
          error_message,
          retry_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        Date.now(),
        template,
        framework,
        success ? 1 : 0,
        durationMs,
        errorType,
        errorMessage,
        retryCount
      ]);

      stmt.free();
      this.save();

      // Record error pattern if applicable
      if (!success && errorMessage) {
        await this.recordErrorPattern({
          errorMessage,
          errorType,
          resolution: null
        });
      }
    } catch (error) {
      console.error('Failed to record build metrics:', error.message);
    }
  }

  /**
   * Record error pattern
   */
  async recordErrorPattern({
    errorMessage,
    errorType = null,
    resolution = null
  }) {
    if (!this.enabled || !this.db) return;

    try {
      await this.initialize();

      // Check if error pattern already exists
      const checkStmt = this.db.prepare(`
        SELECT id, frequency FROM error_patterns
        WHERE error_message = ?
      `);
      checkStmt.bind([errorMessage]);

      if (checkStmt.step()) {
        // Update existing pattern
        const row = checkStmt.getAsObject();
        const updateStmt = this.db.prepare(`
          UPDATE error_patterns
          SET frequency = ?,
              last_occurrence = ?,
              resolution = COALESCE(?, resolution)
          WHERE id = ?
        `);
        updateStmt.run([
          row.frequency + 1,
          Date.now(),
          resolution,
          row.id
        ]);
        updateStmt.free();
      } else {
        // Insert new pattern
        const insertStmt = this.db.prepare(`
          INSERT INTO error_patterns (
            timestamp,
            error_message,
            error_type,
            resolution,
            last_occurrence
          ) VALUES (?, ?, ?, ?, ?)
        `);
        insertStmt.run([
          Date.now(),
          errorMessage,
          errorType,
          resolution,
          Date.now()
        ]);
        insertStmt.free();
      }

      checkStmt.free();
      this.save();
    } catch (error) {
      console.error('Failed to record error pattern:', error.message);
    }
  }

  /**
   * Record performance metrics
   */
  async recordPerformance({
    operation,
    durationMs,
    memoryUsageMb = null,
    cpuUsagePercent = null
  }) {
    if (!this.enabled || !this.db) return;

    try {
      await this.initialize();

      const stmt = this.db.prepare(`
        INSERT INTO performance_metrics (
          timestamp,
          operation,
          duration_ms,
          memory_usage_mb,
          cpu_usage_percent
        ) VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run([
        Date.now(),
        operation,
        durationMs,
        memoryUsageMb,
        cpuUsagePercent
      ]);

      stmt.free();
      this.save();
    } catch (error) {
      console.error('Failed to record performance metrics:', error.message);
    }
  }

  /**
   * Get metrics summary
   */
  async getSummary(sinceTimestamp = null) {
    if (!this.enabled || !this.db) {
      return null;
    }

    try {
      await this.initialize();

      // Detection summary - build from base table since views don't support WHERE
      const detectionQuery = sinceTimestamp
        ? `
          SELECT
            framework,
            COUNT(*) as total_detections,
            AVG(confidence) as avg_confidence,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
            AVG(detection_time_ms) as avg_detection_time
          FROM detection_metrics
          WHERE timestamp >= ${sinceTimestamp}
          GROUP BY framework
        `
        : 'SELECT * FROM detection_summary';

      const detectionStmt = this.db.prepare(detectionQuery);
      const detectionMetrics = [];
      while (detectionStmt.step()) {
        detectionMetrics.push(detectionStmt.getAsObject());
      }
      detectionStmt.free();

      // Build summary
      const buildQuery = sinceTimestamp
        ? `
          SELECT
            template,
            COUNT(*) as total_builds,
            SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
            AVG(duration_ms) as avg_duration,
            MAX(duration_ms) as max_duration
          FROM build_metrics
          WHERE timestamp >= ${sinceTimestamp}
          GROUP BY template
        `
        : 'SELECT * FROM build_summary';

      const buildStmt = this.db.prepare(buildQuery);
      const buildMetrics = [];
      while (buildStmt.step()) {
        buildMetrics.push(buildStmt.getAsObject());
      }
      buildStmt.free();

      // Error summary
      const errorQuery = sinceTimestamp
        ? `
          SELECT
            error_type,
            COUNT(*) as total_errors,
            SUM(frequency) as total_occurrences,
            MAX(last_occurrence) as most_recent
          FROM error_patterns
          WHERE last_occurrence >= ${sinceTimestamp}
          GROUP BY error_type
          ORDER BY total_occurrences DESC
        `
        : 'SELECT * FROM error_summary';

      const errorStmt = this.db.prepare(errorQuery);
      const errorMetrics = [];
      while (errorStmt.step()) {
        errorMetrics.push(errorStmt.getAsObject());
      }
      errorStmt.free();

      return {
        detection: detectionMetrics,
        build: buildMetrics,
        errors: errorMetrics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get metrics summary:', error.message);
      return null;
    }
  }

  /**
   * Export metrics to JSON
   */
  async exportToJSON(outputPath, sinceTimestamp = null) {
    const summary = await this.getSummary(sinceTimestamp);

    if (summary) {
      fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
      return true;
    }

    return false;
  }

  /**
   * Export metrics to CSV
   */
  async exportToCSV(outputPath, table = 'detection_metrics', sinceTimestamp = null) {
    if (!this.enabled || !this.db) {
      return false;
    }

    try {
      await this.initialize();

      const whereClause = sinceTimestamp ? `WHERE timestamp >= ${sinceTimestamp}` : '';
      const stmt = this.db.prepare(`SELECT * FROM ${table} ${whereClause}`);

      const rows = [];
      let headers = [];

      while (stmt.step()) {
        const row = stmt.getAsObject();
        if (headers.length === 0) {
          headers = Object.keys(row);
        }
        rows.push(row);
      }

      stmt.free();

      // Generate CSV
      const csv = [
        headers.join(','),
        ...rows.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
      ].join('\n');

      fs.writeFileSync(outputPath, csv);
      return true;
    } catch (error) {
      console.error('Failed to export to CSV:', error.message);
      return false;
    }
  }

  /**
   * Clear old metrics
   */
  async clearOldMetrics(olderThanDays = 90) {
    if (!this.enabled || !this.db) return;

    try {
      await this.initialize();

      const cutoffTimestamp = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

      const tables = ['detection_metrics', 'build_metrics', 'performance_metrics'];

      for (const table of tables) {
        const stmt = this.db.prepare(`
          DELETE FROM ${table} WHERE timestamp < ?
        `);
        stmt.run([cutoffTimestamp]);
        stmt.free();
      }

      this.save();
    } catch (error) {
      console.error('Failed to clear old metrics:', error.message);
    }
  }

  /**
   * Close the database
   */
  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get metrics collector instance
 * If dbPath is provided and different from current instance, reset and create new instance
 */
export function getMetricsCollector(dbPath) {
  if (!instance) {
    instance = new MetricsCollector(dbPath);
  } else if (dbPath && instance.dbPath !== dbPath) {
    // dbPath changed, reset and create new instance
    instance.close();
    instance = new MetricsCollector(dbPath);
  }
  return instance;
}

/**
 * Reset singleton instance (for testing)
 */
export function resetMetricsCollector() {
  if (instance) {
    instance.close();
    instance = null;
  }
}

/**
 * Helper function to parse time string (e.g., "7d", "30d", "24h")
 */
export function parseTimeString(timeStr) {
  const match = timeStr.match(/^(\d+)([dhms])$/);
  if (!match) {
    throw new Error('Invalid time string format. Use format like "7d", "24h", "30m"');
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return Date.now() - (value * multipliers[unit]);
}

export default MetricsCollector;
