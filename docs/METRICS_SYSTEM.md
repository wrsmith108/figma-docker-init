# Metrics System Documentation

## Overview

The vibe-to-docker metrics system provides automated collection, storage, and analysis of operational metrics including detection accuracy, build performance, and error patterns. The system uses sql.js (WASM) for zero-dependency database management and includes comprehensive privacy controls.

## Table of Contents

- [Features](#features)
- [Privacy Controls](#privacy-controls)
- [Installation](#installation)
- [Usage](#usage)
- [Database Schema](#database-schema)
- [CLI Commands](#cli-commands)
- [API Reference](#api-reference)
- [Analytics Dashboard](#analytics-dashboard)
- [Troubleshooting](#troubleshooting)

## Features

### 1. Automated Metrics Collection
- **Detection Metrics**: Framework detection confidence, success rates, detection time
- **Build Metrics**: Template performance, build duration, success/failure rates
- **Error Patterns**: Automatic error tracking with frequency and resolution storage
- **Performance Metrics**: Operation timing, memory usage, CPU utilization

### 2. Privacy Controls
- **Opt-out Support**: Set `VIBE_DOCKER_DISABLE_METRICS=1` to disable all metrics collection
- **Local Storage**: All metrics stored locally in SQLite database
- **No External Transmission**: Zero metrics sent to external servers
- **User Control**: Complete control over data collection and retention

### 3. Analytics Dashboard
- **Visual Reports**: Console-based dashboard with color-coded insights
- **Trend Analysis**: Identify patterns in detection accuracy and build performance
- **AI-Powered Insights**: Automatic recommendations for improvement
- **Export Capabilities**: Export metrics to JSON or CSV formats

### 4. Zero Native Dependencies
- **sql.js (WASM)**: Pure JavaScript SQLite implementation
- **Cross-Platform**: Works on all operating systems without native binaries
- **Easy Deployment**: No compilation or native module issues

## Privacy Controls

### Disabling Metrics Collection

Metrics collection can be disabled via environment variable:

```bash
# Disable metrics collection
export VIBE_DOCKER_DISABLE_METRICS=1

# Verify status
npx vibe-metrics status
```

### Data Storage

All metrics are stored locally in:
```
.claude-flow/metrics/metrics.db
```

### Data Retention

Old metrics can be automatically cleaned:

```bash
# Clear metrics older than 90 days (default)
npx vibe-metrics clear

# Clear metrics older than 30 days
npx vibe-metrics clear --days 30
```

## Installation

Metrics system is included with vibe-to-docker v5.1.0+:

```bash
# Install vibe-to-docker
npm install -g vibe-to-docker

# Verify metrics CLI
npx vibe-metrics --version
```

## Usage

### Basic Dashboard

Display comprehensive metrics dashboard:

```bash
# Last 7 days (default)
npx vibe-metrics dashboard

# Last 30 days
npx vibe-metrics dashboard --since 30d

# Last 24 hours
npx vibe-metrics dashboard --since 24h
```

### Detection Metrics

View framework detection accuracy:

```bash
# All frameworks
npx vibe-metrics detection

# Specific framework
npx vibe-metrics detection --framework react

# Custom time range
npx vibe-metrics detection --since 7d
```

### Build Metrics

View build performance:

```bash
# All templates
npx vibe-metrics build

# Specific template
npx vibe-metrics build --template basic

# Custom time range
npx vibe-metrics build --since 30d
```

### Error Analysis

View error patterns and trends:

```bash
# Top 10 errors
npx vibe-metrics errors

# Top 20 errors
npx vibe-metrics errors --limit 20

# Custom time range
npx vibe-metrics errors --since 7d
```

### AI-Powered Insights

Get intelligent recommendations:

```bash
# Generate insights
npx vibe-metrics insights

# Custom time range
npx vibe-metrics insights --since 30d
```

### Export Metrics

Export metrics to files:

```bash
# Export to JSON
npx vibe-metrics export json metrics.json --since 30d

# Export to CSV
npx vibe-metrics export csv detection.csv --since 7d --table detection_metrics
```

## Database Schema

### Detection Metrics Table

```sql
CREATE TABLE detection_metrics (
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
```

### Build Metrics Table

```sql
CREATE TABLE build_metrics (
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
```

### Error Patterns Table

```sql
CREATE TABLE error_patterns (
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
```

### Performance Metrics Table

```sql
CREATE TABLE performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  memory_usage_mb REAL,
  cpu_usage_percent REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## CLI Commands

### Dashboard Commands

```bash
npx vibe-metrics dashboard [options]

Options:
  -s, --since <time>     Time range (7d, 30d, 24h) [default: 7d]
  -f, --format <format>  Output format (console, json) [default: console]
  -e, --export <path>    Export to file (JSON format)
```

### Report Commands

```bash
# Detection report
npx vibe-metrics detection [options]
  -s, --since <time>       Time range [default: 30d]
  -f, --framework <name>   Filter by framework

# Build report
npx vibe-metrics build [options]
  -s, --since <time>       Time range [default: 30d]
  -t, --template <name>    Filter by template

# Error report
npx vibe-metrics errors [options]
  -s, --since <time>       Time range [default: 30d]
  -l, --limit <number>     Number of errors [default: 10]

# Insights
npx vibe-metrics insights [options]
  -s, --since <time>       Time range [default: 7d]
```

### Management Commands

```bash
# Export metrics
npx vibe-metrics export <format> <output> [options]
  formats: json, csv
  -s, --since <time>       Time range [default: 30d]
  -t, --table <table>      Table to export (CSV only)

# Clear old data
npx vibe-metrics clear [options]
  -d, --days <days>        Clear older than days [default: 90]

# Check status
npx vibe-metrics status
```

## API Reference

### MetricsCollector Class

```javascript
import { MetricsCollector } from 'vibe-to-docker/src/lib/metrics-collector.js';

const collector = new MetricsCollector();
await collector.initialize();

// Record detection
await collector.recordDetection({
  framework: 'react',
  confidence: 0.95,
  sourceTool: 'auto-detector',
  success: true,
  detectionTimeMs: 150,
  projectPath: '/path/to/project',
  explicitFlag: false
});

// Record build
await collector.recordBuild({
  template: 'basic',
  framework: 'react',
  success: true,
  durationMs: 5000,
  errorType: null,
  errorMessage: null,
  retryCount: 0
});

// Record error pattern
await collector.recordErrorPattern({
  errorMessage: 'Port 3000 in use',
  errorType: 'PortError',
  resolution: 'Use PORT=3001'
});

// Record performance
await collector.recordPerformance({
  operation: 'detection',
  durationMs: 150,
  memoryUsageMb: 45.5,
  cpuUsagePercent: 25.3
});

// Get summary
const summary = await collector.getSummary();

// Export metrics
await collector.exportToJSON('metrics.json');
await collector.exportToCSV('detection.csv', 'detection_metrics');

// Cleanup
await collector.clearOldMetrics(90);
collector.close();
```

### Dashboard Functions

```javascript
import {
  generateDashboard,
  generateDetectionReport,
  generateBuildReport,
  generateErrorTrends,
  generateInsights
} from 'vibe-to-docker/src/lib/metrics-dashboard.js';

// Generate dashboard
const dashboard = await generateDashboard({
  since: '7d',
  format: 'json',
  export: 'dashboard.json'
});

// Detection report
const detectionReport = await generateDetectionReport({
  since: '30d',
  framework: 'react'
});

// Build report
const buildReport = await generateBuildReport({
  since: '30d',
  template: 'basic'
});

// Error trends
const errorTrends = await generateErrorTrends({
  since: '30d',
  limit: 10
});

// AI insights
const insights = await generateInsights({
  since: '7d'
});
```

## Analytics Dashboard

### Console Dashboard Output

```
═══════════════════════════════════════════════════
         Vibe-to-Docker Metrics Dashboard
═══════════════════════════════════════════════════
Period: Last 7d
Generated: 2025-11-20 14:30:00
═══════════════════════════════════════════════════

📊 Detection Metrics
─────────────────────────────────────────────────

  react:
    Total Detections: 45
    Success Rate: 95.6%
    Avg Confidence: 92.3%
    Avg Detection Time: 128ms

  vue:
    Total Detections: 23
    Success Rate: 91.3%
    Avg Confidence: 88.7%
    Avg Detection Time: 145ms

🔨 Build Metrics
─────────────────────────────────────────────────

  basic:
    Total Builds: 38
    Success Rate: 97.4%
    Avg Duration: 4.2s
    Max Duration: 8.5s

  advanced:
    Total Builds: 12
    Success Rate: 91.7%
    Avg Duration: 6.8s
    Max Duration: 12.3s

🐛 Top Error Patterns
─────────────────────────────────────────────────

  1. DependencyError:
    Total Errors: 8
    Total Occurrences: 15
    Last Seen: 2 days ago

  2. PortError:
    Total Errors: 3
    Total Occurrences: 7
    Last Seen: Today

═══════════════════════════════════════════════════
```

### Insights Example

```
💡 Insights & Recommendations
Period: Last 7d

Detection Issues:
  ⚠️ Low success rate (88.2%) for angular detection
     → Consider improving detection algorithms or adding more signature patterns

  ℹ️ High usage of explicit flags (62.5%)
     → Automatic detection may need improvement for this framework

Build Issues:
  ⚠️ Low build success rate (85.3%) for ui-heavy
     → Review template configuration and common error patterns

  ℹ️ Long average build time (2.8m) for complex
     → Consider optimizing Docker build steps or dependencies

Error Issues:
  🔴 High frequency error (12 occurrences): DockerError
     → Investigate and document resolution steps

Recommendations:
  🔥 Focus on resolving frequent errors to improve build success rates
  💡 Improve detection accuracy by refining signature patterns
  💡 Optimize build templates to reduce failure rates and build times
```

## Troubleshooting

### Metrics Not Being Collected

**Check if metrics are disabled:**
```bash
npx vibe-metrics status
```

**Enable metrics:**
```bash
unset VIBE_DOCKER_DISABLE_METRICS
# or
export VIBE_DOCKER_DISABLE_METRICS=0
```

### Database Corruption

**Recreate database:**
```bash
rm .claude-flow/metrics/metrics.db
npx vibe-metrics status  # Will recreate database
```

### Export Failures

**Check permissions:**
```bash
# Ensure write permissions in target directory
ls -la /path/to/export/directory
```

**Verify database exists:**
```bash
ls -la .claude-flow/metrics/metrics.db
```

### Performance Issues

**Clear old metrics:**
```bash
npx vibe-metrics clear --days 30
```

**Rebuild database indexes:**
```javascript
// Manually via API
const collector = new MetricsCollector();
await collector.initialize();
// Database will rebuild indexes automatically
```

## Integration with Vibe-to-Docker

### Automatic Collection

Metrics are automatically collected during normal vibe-to-docker operations:

```bash
# Detection metrics collected during framework detection
npx vibe-to-docker /path/to/project

# Build metrics collected during containerization
npx vibe-to-docker /path/to/project --template basic

# Error patterns collected when failures occur
```

### Programmatic Integration

```javascript
import { getMetricsCollector } from 'vibe-to-docker/src/lib/metrics-collector.js';

const collector = getMetricsCollector();

// Before detection
const detectionStart = Date.now();

// ... perform detection ...

// After detection
await collector.recordDetection({
  framework: detectedFramework,
  confidence: confidenceScore,
  sourceTool: 'auto-detector',
  success: detectionSuccessful,
  detectionTimeMs: Date.now() - detectionStart
});
```

## Best Practices

### 1. Regular Cleanup
Clean old metrics monthly to maintain performance:
```bash
# Add to cron or task scheduler
0 0 1 * * npx vibe-metrics clear --days 90
```

### 2. Monitor Insights
Review insights weekly to identify improvement opportunities:
```bash
npx vibe-metrics insights --since 7d
```

### 3. Export for Analysis
Export metrics for external analysis tools:
```bash
npx vibe-metrics export json monthly-report.json --since 30d
```

### 4. Privacy Compliance
Ensure compliance with organizational policies:
```bash
# For CI/CD environments
export VIBE_DOCKER_DISABLE_METRICS=1
```

## Support

For issues or questions about the metrics system:

- GitHub Issues: https://github.com/wrsmith108/vibe-to-docker/issues
- Documentation: https://github.com/wrsmith108/vibe-to-docker
- Email: support@vibe-to-docker.dev

## License

Apache-2.0 License - See LICENSE file for details
