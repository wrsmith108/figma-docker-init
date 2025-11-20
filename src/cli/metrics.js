#!/usr/bin/env node

/**
 * Metrics CLI
 *
 * Command-line interface for vibe-to-docker metrics.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  generateDashboard,
  generateDetectionReport,
  generateBuildReport,
  generateErrorTrends,
  generateInsights
} from '../lib/metrics-dashboard.js';
import { getMetricsCollector } from '../lib/metrics-collector.js';

const program = new Command();

program
  .name('vibe-to-docker metrics')
  .description('View and analyze vibe-to-docker metrics')
  .version('1.0.0');

// Main metrics dashboard command
program
  .command('dashboard')
  .description('Display comprehensive metrics dashboard')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d, 24h)', '7d')
  .option('-f, --format <format>', 'Output format (console, json)', 'console')
  .option('-e, --export <path>', 'Export to file (JSON format)')
  .action(async (options) => {
    try {
      await generateDashboard(options);
    } catch (error) {
      console.error(chalk.red('Error generating dashboard:'), error.message);
      process.exit(1);
    }
  });

// Detection metrics report
program
  .command('detection')
  .description('View detection accuracy metrics')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d)', '30d')
  .option('-f, --framework <framework>', 'Filter by framework')
  .action(async (options) => {
    try {
      const report = await generateDetectionReport(options);

      console.log(chalk.bold.cyan('\n📊 Detection Metrics Report'));
      console.log(chalk.gray(`Period: Last ${options.since}\n`));

      report.forEach(metric => {
        const successRate = ((metric.successful / metric.total) * 100).toFixed(1);
        const avgConfidence = (metric.avg_confidence * 100).toFixed(1);

        console.log(chalk.white(`${metric.framework}:`));
        console.log(`  Total Detections: ${chalk.yellow(metric.total)}`);
        console.log(`  Success Rate: ${chalk.green(successRate + '%')}`);
        console.log(`  Avg Confidence: ${chalk.blue(avgConfidence + '%')}`);
        console.log(`  Min Confidence: ${(metric.min_confidence * 100).toFixed(1)}%`);
        console.log(`  Max Confidence: ${(metric.max_confidence * 100).toFixed(1)}%`);
        console.log(`  Explicit Flags: ${metric.explicit_flags}`);
        console.log(`  Avg Detection Time: ${metric.avg_time.toFixed(0)}ms\n`);
      });
    } catch (error) {
      console.error(chalk.red('Error generating detection report:'), error.message);
      process.exit(1);
    }
  });

// Build metrics report
program
  .command('build')
  .description('View build performance metrics')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d)', '30d')
  .option('-t, --template <template>', 'Filter by template')
  .action(async (options) => {
    try {
      const report = await generateBuildReport(options);

      console.log(chalk.bold.cyan('\n🔨 Build Metrics Report'));
      console.log(chalk.gray(`Period: Last ${options.since}\n`));

      report.forEach(metric => {
        const successRate = ((metric.successful / metric.total) * 100).toFixed(1);

        console.log(chalk.white(`${metric.template} (${metric.framework || 'unknown'}):`));
        console.log(`  Total Builds: ${chalk.yellow(metric.total)}`);
        console.log(`  Success Rate: ${chalk.green(successRate + '%')}`);
        console.log(`  Avg Duration: ${(metric.avg_duration / 1000).toFixed(1)}s`);
        console.log(`  Min Duration: ${(metric.min_duration / 1000).toFixed(1)}s`);
        console.log(`  Max Duration: ${(metric.max_duration / 1000).toFixed(1)}s`);
        console.log(`  Avg Retries: ${metric.avg_retries.toFixed(1)}\n`);
      });
    } catch (error) {
      console.error(chalk.red('Error generating build report:'), error.message);
      process.exit(1);
    }
  });

// Error trends report
program
  .command('errors')
  .description('View error patterns and trends')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d)', '30d')
  .option('-l, --limit <number>', 'Number of errors to display', '10')
  .action(async (options) => {
    try {
      const limit = parseInt(options.limit);
      const errors = await generateErrorTrends({ since: options.since, limit });

      console.log(chalk.bold.cyan('\n🐛 Error Patterns Report'));
      console.log(chalk.gray(`Period: Last ${options.since}`));
      console.log(chalk.gray(`Top ${limit} errors\n`));

      errors.forEach((error, index) => {
        console.log(chalk.white(`${index + 1}. ${error.error_type || 'Unknown Error'}:`));
        console.log(`   Frequency: ${chalk.red(error.frequency)}`);
        console.log(`   Last Seen: ${new Date(error.last_occurrence).toLocaleString()}`);
        if (error.resolution) {
          console.log(chalk.green(`   Resolution: ${error.resolution}`));
        }
        console.log(chalk.gray(`   Message: ${error.error_message.substring(0, 80)}...`));
        console.log();
      });
    } catch (error) {
      console.error(chalk.red('Error generating error trends:'), error.message);
      process.exit(1);
    }
  });

// Insights and recommendations
program
  .command('insights')
  .description('Get AI-powered insights and recommendations')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d)', '7d')
  .action(async (options) => {
    try {
      const insights = await generateInsights(options);

      console.log(chalk.bold.cyan('\n💡 Insights & Recommendations'));
      console.log(chalk.gray(`Period: Last ${options.since}\n`));

      // Detection insights
      if (insights.detection.length > 0) {
        console.log(chalk.bold.yellow('Detection Issues:'));
        insights.detection.forEach(insight => {
          const icon = insight.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${insight.message}`);
          console.log(chalk.gray(`     → ${insight.recommendation}\n`));
        });
      }

      // Build insights
      if (insights.build.length > 0) {
        console.log(chalk.bold.yellow('Build Issues:'));
        insights.build.forEach(insight => {
          const icon = insight.severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${insight.message}`);
          console.log(chalk.gray(`     → ${insight.recommendation}\n`));
        });
      }

      // Error insights
      if (insights.errors.length > 0) {
        console.log(chalk.bold.red('Error Issues:'));
        insights.errors.forEach(insight => {
          console.log(`  🔴 ${insight.message}`);
          console.log(chalk.gray(`     → ${insight.recommendation}\n`));
        });
      }

      // Overall recommendations
      console.log(chalk.bold.green('Recommendations:'));
      insights.recommendations.forEach(rec => {
        const icon = rec.type === 'success' ? '✓' : rec.type === 'priority' ? '🔥' : '💡';
        console.log(`  ${icon} ${rec.message}\n`);
      });
    } catch (error) {
      console.error(chalk.red('Error generating insights:'), error.message);
      process.exit(1);
    }
  });

// Export metrics
program
  .command('export')
  .description('Export metrics to file')
  .argument('<format>', 'Export format (json, csv)')
  .argument('<output>', 'Output file path')
  .option('-s, --since <time>', 'Time range (e.g., 7d, 30d)', '30d')
  .option('-t, --table <table>', 'Table to export for CSV', 'detection_metrics')
  .action(async (format, output, options) => {
    try {
      const collector = getMetricsCollector();
      await collector.initialize();

      const sinceTimestamp = require('../lib/metrics-collector.js').parseTimeString(options.since);

      let success = false;

      if (format === 'json') {
        success = await collector.exportToJSON(output, sinceTimestamp);
      } else if (format === 'csv') {
        success = await collector.exportToCSV(output, options.table, sinceTimestamp);
      } else {
        console.error(chalk.red('Invalid format. Use "json" or "csv"'));
        process.exit(1);
      }

      if (success) {
        console.log(chalk.green(`✓ Metrics exported to ${output}`));
      } else {
        console.error(chalk.red('Failed to export metrics'));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('Error exporting metrics:'), error.message);
      process.exit(1);
    }
  });

// Clear old metrics
program
  .command('clear')
  .description('Clear old metrics data')
  .option('-d, --days <days>', 'Clear metrics older than days', '90')
  .action(async (options) => {
    try {
      const collector = getMetricsCollector();
      await collector.initialize();

      const days = parseInt(options.days);
      await collector.clearOldMetrics(days);

      console.log(chalk.green(`✓ Cleared metrics older than ${days} days`));
    } catch (error) {
      console.error(chalk.red('Error clearing metrics:'), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check metrics collection status')
  .action(() => {
    const collector = getMetricsCollector();

    console.log(chalk.bold.cyan('\nMetrics Collection Status'));
    console.log(chalk.gray('─────────────────────────────────────\n'));

    if (collector.isEnabled()) {
      console.log(chalk.green('✓ Metrics collection is ENABLED'));
      console.log(chalk.gray(`  Database: ${collector.dbPath}`));
    } else {
      console.log(chalk.yellow('⚠ Metrics collection is DISABLED'));
      console.log(chalk.gray('  To enable, unset VIBE_DOCKER_DISABLE_METRICS'));
      console.log(chalk.gray('  or set VIBE_DOCKER_DISABLE_METRICS=0'));
    }

    console.log();
  });

// Help command
program
  .command('help')
  .description('Display help information')
  .action(() => {
    console.log(chalk.bold.cyan('\nVibe-to-Docker Metrics CLI\n'));
    console.log('Available commands:\n');
    console.log(chalk.yellow('  dashboard') + '  - Display comprehensive metrics dashboard');
    console.log(chalk.yellow('  detection') + '  - View detection accuracy metrics');
    console.log(chalk.yellow('  build') + '      - View build performance metrics');
    console.log(chalk.yellow('  errors') + '     - View error patterns and trends');
    console.log(chalk.yellow('  insights') + '   - Get AI-powered insights');
    console.log(chalk.yellow('  export') + '     - Export metrics to file');
    console.log(chalk.yellow('  clear') + '      - Clear old metrics data');
    console.log(chalk.yellow('  status') + '     - Check metrics status\n');
    console.log('Options:\n');
    console.log('  -s, --since <time>      Time range (7d, 30d, 24h)');
    console.log('  -f, --format <format>   Output format (console, json)');
    console.log('  -e, --export <path>     Export to file\n');
    console.log('Privacy:\n');
    console.log('  Set VIBE_DOCKER_DISABLE_METRICS=1 to disable metrics collection\n');
  });

program.parse();
