-- Vibe-to-Docker Metrics Database Schema
-- Version: 1.0.0
-- Purpose: Track detection accuracy, build success, and error patterns

-- Detection metrics table
CREATE TABLE IF NOT EXISTS detection_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  framework TEXT NOT NULL,
  confidence REAL NOT NULL,
  source_tool TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  detection_time_ms INTEGER NOT NULL,
  project_path TEXT,
  explicit_flag BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Build metrics table
CREATE TABLE IF NOT EXISTS build_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  template TEXT NOT NULL,
  framework TEXT,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_type TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Error patterns table
CREATE TABLE IF NOT EXISTS error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  error_type TEXT,
  resolution TEXT,
  frequency INTEGER DEFAULT 1,
  last_occurrence INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(error_message)
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb REAL,
  cpu_usage_percent REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table (for privacy controls)
CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_detection_timestamp ON detection_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_detection_framework ON detection_metrics(framework);
CREATE INDEX IF NOT EXISTS idx_detection_success ON detection_metrics(success);

CREATE INDEX IF NOT EXISTS idx_build_timestamp ON build_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_build_template ON build_metrics(template);
CREATE INDEX IF NOT EXISTS idx_build_success ON build_metrics(success);

CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_patterns(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_last_occurrence ON error_patterns(last_occurrence);
CREATE INDEX IF NOT EXISTS idx_error_frequency ON error_patterns(frequency DESC);

CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_operation ON performance_metrics(operation);

-- Views for common queries
CREATE VIEW IF NOT EXISTS detection_summary AS
SELECT
  framework,
  COUNT(*) as total_detections,
  AVG(confidence) as avg_confidence,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
  AVG(detection_time_ms) as avg_detection_time
FROM detection_metrics
GROUP BY framework;

CREATE VIEW IF NOT EXISTS build_summary AS
SELECT
  template,
  COUNT(*) as total_builds,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
  AVG(duration_ms) as avg_duration,
  MAX(duration_ms) as max_duration
FROM build_metrics
GROUP BY template;

CREATE VIEW IF NOT EXISTS error_summary AS
SELECT
  error_type,
  COUNT(*) as total_errors,
  SUM(frequency) as total_occurrences,
  MAX(last_occurrence) as most_recent
FROM error_patterns
GROUP BY error_type
ORDER BY total_occurrences DESC;
