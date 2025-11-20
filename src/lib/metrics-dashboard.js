/**
 * Metrics Dashboard
 *
 * Provides analytics and reporting for metrics data.
 * Generates summary reports, trends, and insights.
 */

import chalk from 'chalk';
import { getMetricsCollector, parseTimeString } from './metrics-collector.js';

/**
 * Generate a comprehensive metrics dashboard
 */
export async function generateDashboard(options = {}) {
  const {
    since = '7d',
    format = 'console',
    export: exportPath = null
  } = options;

  const collector = getMetricsCollector();

  if (!collector.isEnabled()) {
    return {
      error: 'Metrics collection is disabled. Set VIBE_DOCKER_DISABLE_METRICS=0 to enable.'
    };
  }

  await collector.initialize();

  // Parse time range
  const sinceTimestamp = since ? parseTimeString(since) : null;

  // Get metrics summary
  const summary = await collector.getSummary(sinceTimestamp);

  if (!summary) {
    return {
      error: 'Failed to retrieve metrics summary'
    };
  }

  // Generate dashboard based on format
  if (format === 'console') {
    displayConsoleDashboard(summary, since);
  } else if (format === 'json') {
    if (exportPath) {
      await collector.exportToJSON(exportPath, sinceTimestamp);
      console.log(chalk.green(`✓ Metrics exported to ${exportPath}`));
    }
    return summary;
  }

  return summary;
}

/**
 * Display dashboard in console
 */
function displayConsoleDashboard(summary, since) {
  console.log('\n' + chalk.bold.blue('═══════════════════════════════════════════════════'));
  console.log(chalk.bold.blue('         Vibe-to-Docker Metrics Dashboard'));
  console.log(chalk.bold.blue('═══════════════════════════════════════════════════'));
  console.log(chalk.gray(`Period: Last ${since}`));
  console.log(chalk.gray(`Generated: ${new Date().toLocaleString()}`));
  console.log(chalk.bold.blue('═══════════════════════════════════════════════════\n'));

  // Detection Metrics
  console.log(chalk.bold.cyan('📊 Detection Metrics'));
  console.log(chalk.gray('─────────────────────────────────────────────────\n'));

  if (summary.detection.length > 0) {
    summary.detection.forEach(metric => {
      const successRate = ((metric.successful / metric.total_detections) * 100).toFixed(1);
      const avgConfidence = (metric.avg_confidence * 100).toFixed(1);

      console.log(chalk.white(`  ${metric.framework}:`));
      console.log(`    Total Detections: ${chalk.yellow(metric.total_detections)}`);
      console.log(`    Success Rate: ${chalk.green(successRate + '%')}`);
      console.log(`    Avg Confidence: ${chalk.blue(avgConfidence + '%')}`);
      console.log(`    Avg Detection Time: ${chalk.gray(metric.avg_detection_time + 'ms')}\n`);
    });
  } else {
    console.log(chalk.gray('  No detection data available\n'));
  }

  // Build Metrics
  console.log(chalk.bold.cyan('🔨 Build Metrics'));
  console.log(chalk.gray('─────────────────────────────────────────────────\n'));

  if (summary.build.length > 0) {
    summary.build.forEach(metric => {
      const successRate = ((metric.successful / metric.total_builds) * 100).toFixed(1);

      console.log(chalk.white(`  ${metric.template}:`));
      console.log(`    Total Builds: ${chalk.yellow(metric.total_builds)}`);
      console.log(`    Success Rate: ${chalk.green(successRate + '%')}`);
      console.log(`    Avg Duration: ${chalk.blue(formatDuration(metric.avg_duration))}`);
      console.log(`    Max Duration: ${chalk.gray(formatDuration(metric.max_duration))}\n`);
    });
  } else {
    console.log(chalk.gray('  No build data available\n'));
  }

  // Error Patterns
  console.log(chalk.bold.cyan('🐛 Top Error Patterns'));
  console.log(chalk.gray('─────────────────────────────────────────────────\n'));

  if (summary.errors.length > 0) {
    summary.errors.slice(0, 5).forEach((error, index) => {
      console.log(chalk.white(`  ${index + 1}. ${error.error_type || 'Unknown Error'}:`));
      console.log(`    Total Errors: ${chalk.red(error.total_errors)}`);
      console.log(`    Total Occurrences: ${chalk.yellow(error.total_occurrences)}`);
      console.log(`    Last Seen: ${chalk.gray(formatTimestamp(error.most_recent))}\n`);
    });
  } else {
    console.log(chalk.gray('  No error data available\n'));
  }

  console.log(chalk.bold.blue('═══════════════════════════════════════════════════\n'));
}

/**
 * Generate detection accuracy report
 */
export async function generateDetectionReport(options = {}) {
  const {
    since = '30d',
    framework = null
  } = options;

  const collector = getMetricsCollector();
  await collector.initialize();

  const sinceTimestamp = parseTimeString(since);

  const whereClause = framework
    ? `WHERE timestamp >= ${sinceTimestamp} AND framework = '${framework}'`
    : `WHERE timestamp >= ${sinceTimestamp}`;

  const stmt = collector.db.prepare(`
    SELECT
      framework,
      COUNT(*) as total,
      AVG(confidence) as avg_confidence,
      MIN(confidence) as min_confidence,
      MAX(confidence) as max_confidence,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN explicit_flag = 1 THEN 1 ELSE 0 END) as explicit_flags,
      AVG(detection_time_ms) as avg_time
    FROM detection_metrics
    ${whereClause}
    GROUP BY framework
    ORDER BY total DESC
  `);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();

  return results;
}

/**
 * Generate build performance report
 */
export async function generateBuildReport(options = {}) {
  const {
    since = '30d',
    template = null
  } = options;

  const collector = getMetricsCollector();
  await collector.initialize();

  const sinceTimestamp = parseTimeString(since);

  const whereClause = template
    ? `WHERE timestamp >= ${sinceTimestamp} AND template = '${template}'`
    : `WHERE timestamp >= ${sinceTimestamp}`;

  const stmt = collector.db.prepare(`
    SELECT
      template,
      framework,
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      AVG(duration_ms) as avg_duration,
      MIN(duration_ms) as min_duration,
      MAX(duration_ms) as max_duration,
      AVG(retry_count) as avg_retries
    FROM build_metrics
    ${whereClause}
    GROUP BY template, framework
    ORDER BY total DESC
  `);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();

  return results;
}

/**
 * Generate error trend analysis
 */
export async function generateErrorTrends(options = {}) {
  const {
    since = '30d',
    limit = 10
  } = options;

  const collector = getMetricsCollector();
  await collector.initialize();

  const sinceTimestamp = parseTimeString(since);

  const stmt = collector.db.prepare(`
    SELECT
      error_type,
      error_message,
      frequency,
      last_occurrence,
      resolution
    FROM error_patterns
    WHERE last_occurrence >= ?
    ORDER BY frequency DESC
    LIMIT ?
  `);

  stmt.bind([sinceTimestamp, limit]);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();

  return results;
}

/**
 * Generate insights and recommendations
 */
export async function generateInsights(options = {}) {
  const { since = '7d' } = options;

  const collector = getMetricsCollector();
  await collector.initialize();

  const insights = {
    detection: [],
    build: [],
    errors: [],
    recommendations: []
  };

  // Detection insights
  const detectionReport = await generateDetectionReport({ since });

  detectionReport.forEach(metric => {
    const successRate = (metric.successful / metric.total) * 100;
    const avgConfidence = metric.avg_confidence * 100;

    if (successRate < 80) {
      insights.detection.push({
        severity: 'warning',
        framework: metric.framework,
        message: `Low success rate (${successRate.toFixed(1)}%) for ${metric.framework} detection`,
        recommendation: 'Consider improving detection algorithms or adding more signature patterns'
      });
    }

    if (avgConfidence < 0.7) {
      insights.detection.push({
        severity: 'info',
        framework: metric.framework,
        message: `Low average confidence (${avgConfidence.toFixed(1)}%) for ${metric.framework}`,
        recommendation: 'Consider using explicit --tool flag for better accuracy'
      });
    }

    if (metric.explicit_flags > metric.total * 0.5) {
      insights.detection.push({
        severity: 'info',
        framework: metric.framework,
        message: `High usage of explicit flags (${((metric.explicit_flags / metric.total) * 100).toFixed(1)}%)`,
        recommendation: 'Automatic detection may need improvement for this framework'
      });
    }
  });

  // Build insights
  const buildReport = await generateBuildReport({ since });

  buildReport.forEach(metric => {
    const successRate = (metric.successful / metric.total) * 100;

    if (successRate < 90) {
      insights.build.push({
        severity: 'warning',
        template: metric.template,
        message: `Low build success rate (${successRate.toFixed(1)}%) for ${metric.template}`,
        recommendation: 'Review template configuration and common error patterns'
      });
    }

    if (metric.avg_duration > 120000) { // 2 minutes
      insights.build.push({
        severity: 'info',
        template: metric.template,
        message: `Long average build time (${formatDuration(metric.avg_duration)}) for ${metric.template}`,
        recommendation: 'Consider optimizing Docker build steps or dependencies'
      });
    }

    if (metric.avg_retries > 1) {
      insights.build.push({
        severity: 'warning',
        template: metric.template,
        message: `High average retry count (${metric.avg_retries.toFixed(1)}) for ${metric.template}`,
        recommendation: 'Investigate and fix common build failures'
      });
    }
  });

  // Error insights
  const errorTrends = await generateErrorTrends({ since, limit: 5 });

  errorTrends.forEach(error => {
    if (error.frequency > 10) {
      insights.errors.push({
        severity: 'error',
        errorType: error.error_type,
        message: `High frequency error (${error.frequency} occurrences): ${error.error_type}`,
        recommendation: error.resolution || 'Investigate and document resolution steps'
      });
    }
  });

  // Generate overall recommendations
  if (insights.detection.length + insights.build.length + insights.errors.length === 0) {
    insights.recommendations.push({
      message: '✓ All systems operating within normal parameters',
      type: 'success'
    });
  } else {
    if (insights.errors.length > 0) {
      insights.recommendations.push({
        message: 'Focus on resolving frequent errors to improve build success rates',
        type: 'priority'
      });
    }

    if (insights.detection.some(i => i.severity === 'warning')) {
      insights.recommendations.push({
        message: 'Improve detection accuracy by refining signature patterns',
        type: 'improvement'
      });
    }

    if (insights.build.some(i => i.severity === 'warning')) {
      insights.recommendations.push({
        message: 'Optimize build templates to reduce failure rates and build times',
        type: 'improvement'
      });
    }
  }

  return insights;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    return `${(ms / 60000).toFixed(1)}m`;
  }
}

/**
 * Format timestamp to human-readable string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default {
  generateDashboard,
  generateDetectionReport,
  generateBuildReport,
  generateErrorTrends,
  generateInsights
};
