# Metrics Tracking Implementation Plan

**Priority**: HIGH (Immediate)
**Estimated Effort**: 2-3 days
**Target Version**: v4.4.0

## Overview

Add anonymous metrics collection to track feature adoption, success rates, and common error patterns. This will inform future development priorities and improve user experience.

## Privacy-First Approach

**✅ Collected**:
- Tool detected (lovable, bolt, v0, figma-make, replit, etc.)
- Detection confidence score (0.0 - 1.0)
- Auto-detection vs manual tool selection
- Build success/failure
- Port conflicts encountered
- Error types (categorized)
- Timestamp
- Platform (darwin, linux, win32)
- Node version

**❌ NOT Collected**:
- Project names
- File paths
- Directory names
- Source code
- Environment variables
- User identifiable information

**Opt-Out**: `vibe-to-docker init --no-metrics` or environment variable

## Database Schema

**SQLite database**: `~/.vibe-to-docker/metrics.db`

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,           -- UUID for this init session
  tool TEXT,                           -- Detected tool name
  confidence REAL,                     -- Detection confidence (0.0-1.0)
  auto_detected BOOLEAN,               -- True if auto-detected
  manual_tool TEXT,                    -- If manually specified
  build_success BOOLEAN,               -- Did docker-compose up succeed?
  port_conflict BOOLEAN,               -- Port conflict detected?
  error_type TEXT,                     -- Error category if failed
  error_message TEXT,                  -- First 200 chars of error
  platform TEXT,                       -- darwin, linux, win32
  node_version TEXT,                   -- Node.js version
  package_version TEXT,                -- vibe-to-docker version
  timestamp INTEGER NOT NULL,          -- Unix timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tool ON metrics(tool);
CREATE INDEX idx_timestamp ON metrics(timestamp);
CREATE INDEX idx_session ON metrics(session_id);

CREATE TABLE error_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,
  error_hash TEXT UNIQUE,              -- SHA256 of normalized error
  occurrence_count INTEGER DEFAULT 1,
  first_seen INTEGER,
  last_seen INTEGER,
  resolution_hint TEXT,                -- Suggested fix
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Files

### 1. `src/lib/metrics-collector.js`

```javascript
import crypto from 'crypto';
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export class MetricsCollector {
  constructor(opts = {}) {
    this.enabled = !opts.noMetrics && process.env.VIBE_NO_METRICS !== 'true';
    this.dbPath = opts.dbPath || path.join(os.homedir(), '.vibe-to-docker', 'metrics.db');
    this.sessionId = uuidv4();

    if (this.enabled) {
      this.initDatabase();
    }
  }

  initDatabase() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');

    // Create tables if not exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        tool TEXT,
        confidence REAL,
        auto_detected BOOLEAN,
        manual_tool TEXT,
        build_success BOOLEAN,
        port_conflict BOOLEAN,
        error_type TEXT,
        error_message TEXT,
        platform TEXT,
        node_version TEXT,
        package_version TEXT,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tool ON metrics(tool);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_session ON metrics(session_id);

      CREATE TABLE IF NOT EXISTS error_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        error_type TEXT NOT NULL,
        error_hash TEXT UNIQUE,
        occurrence_count INTEGER DEFAULT 1,
        first_seen INTEGER,
        last_seen INTEGER,
        resolution_hint TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  track(data) {
    if (!this.enabled || !this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO metrics (
          session_id, tool, confidence, auto_detected, manual_tool,
          build_success, port_conflict, error_type, error_message,
          platform, node_version, package_version, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        this.sessionId,
        data.tool || null,
        data.confidence || null,
        data.autoDetected ? 1 : 0,
        data.manualTool || null,
        data.buildSuccess ? 1 : 0,
        data.portConflict ? 1 : 0,
        data.errorType || null,
        data.errorMessage ? data.errorMessage.substring(0, 200) : null,
        process.platform,
        process.version,
        data.packageVersion || require('../../package.json').version,
        Date.now()
      );
    } catch (error) {
      // Silently fail - don't break user's workflow
      console.debug('Metrics tracking failed:', error.message);
    }
  }

  trackError(error, context = {}) {
    if (!this.enabled || !this.db) return;

    try {
      const errorType = this.categorizeError(error);
      const errorHash = this.hashError(error);
      const now = Date.now();

      // Update error patterns
      const upsert = this.db.prepare(`
        INSERT INTO error_patterns (error_type, error_hash, first_seen, last_seen, occurrence_count)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT(error_hash) DO UPDATE SET
          occurrence_count = occurrence_count + 1,
          last_seen = ?
      `);

      upsert.run(errorType, errorHash, now, now, now);

      // Track in metrics
      this.track({
        ...context,
        buildSuccess: false,
        errorType,
        errorMessage: error.message
      });
    } catch (err) {
      console.debug('Error tracking failed:', err.message);
    }
  }

  categorizeError(error) {
    const msg = error.message.toLowerCase();

    if (msg.includes('eaddrinuse')) return 'PORT_CONFLICT';
    if (msg.includes('enoent')) return 'FILE_NOT_FOUND';
    if (msg.includes('eacces')) return 'PERMISSION_DENIED';
    if (msg.includes('docker')) return 'DOCKER_ERROR';
    if (msg.includes('network')) return 'NETWORK_ERROR';
    if (msg.includes('template')) return 'TEMPLATE_ERROR';
    if (msg.includes('validation')) return 'VALIDATION_ERROR';

    return 'UNKNOWN_ERROR';
  }

  hashError(error) {
    // Normalize error message (remove paths, numbers) before hashing
    const normalized = error.message
      .replace(/\/[\w\/\-\.]+/g, '<path>')  // Remove paths
      .replace(/\d+/g, '<num>')             // Remove numbers
      .replace(/["'][\w\s]+["']/g, '<str>') // Remove quoted strings
      .toLowerCase();

    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  getStats() {
    if (!this.enabled || !this.db) return null;

    try {
      const stats = {
        totalRuns: 0,
        toolUsage: {},
        successRate: 0,
        topErrors: [],
        avgConfidence: {}
      };

      // Total runs
      const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM metrics');
      stats.totalRuns = totalStmt.get().count;

      // Tool usage
      const toolStmt = this.db.prepare(`
        SELECT tool, COUNT(*) as count, AVG(confidence) as avg_conf
        FROM metrics WHERE tool IS NOT NULL
        GROUP BY tool ORDER BY count DESC
      `);

      for (const row of toolStmt.all()) {
        stats.toolUsage[row.tool] = row.count;
        stats.avgConfidence[row.tool] = parseFloat(row.avg_conf.toFixed(3));
      }

      // Success rate
      const successStmt = this.db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN build_success = 1 THEN 1 ELSE 0 END) as successes
        FROM metrics WHERE build_success IS NOT NULL
      `);
      const successRow = successStmt.get();
      if (successRow.total > 0) {
        stats.successRate = parseFloat((successRow.successes / successRow.total).toFixed(3));
      }

      // Top errors
      const errorStmt = this.db.prepare(`
        SELECT error_type, occurrence_count
        FROM error_patterns
        ORDER BY occurrence_count DESC LIMIT 5
      `);
      stats.topErrors = errorStmt.all();

      return stats;
    } catch (error) {
      console.debug('Stats retrieval failed:', error.message);
      return null;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

export default MetricsCollector;
```

### 2. Integration in `vibe-to-docker.js`

```javascript
import MetricsCollector from './src/lib/metrics-collector.js';

// At the start of init command
const metrics = new MetricsCollector({ noMetrics: args.includes('--no-metrics') });

// After detection
metrics.track({
  tool: detectionResult.tool,
  confidence: detectionResult.confidence,
  autoDetected: !toolArg,
  manualTool: toolArg || null
});

// After build attempt
try {
  await runDockerCompose();
  metrics.track({ buildSuccess: true });
} catch (error) {
  metrics.trackError(error, {
    tool: detectionResult.tool,
    portConflict: error.message.includes('EADDRINUSE')
  });
}

// Before exit
metrics.close();
```

### 3. CLI Command for Viewing Stats

```bash
vibe-to-docker stats
```

Output:
```
📊 vibe-to-docker Usage Statistics

Total Runs: 127
Success Rate: 87.4%

Tool Usage:
  lovable:     45 runs (avg confidence: 0.931)
  replit:      32 runs (avg confidence: 0.893)
  bolt:        28 runs (avg confidence: 0.812)
  v0:          15 runs (avg confidence: 0.845)
  figma-make:   7 runs (avg confidence: 0.923)

Top Errors:
  1. PORT_CONFLICT: 12 occurrences
  2. DOCKER_ERROR: 8 occurrences
  3. VALIDATION_ERROR: 4 occurrences

📍 Metrics stored at: ~/.vibe-to-docker/metrics.db
🔒 All data is anonymous. To disable: vibe-to-docker init --no-metrics
```

## Testing

### Unit Tests: `tests/lib/metrics-collector.test.js`

```javascript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import MetricsCollector from '../../src/lib/metrics-collector.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('MetricsCollector', () => {
  let tempDbPath;
  let collector;

  beforeEach(() => {
    tempDbPath = path.join(os.tmpdir(), `metrics-test-${Date.now()}.db`);
    collector = new MetricsCollector({ dbPath: tempDbPath });
  });

  afterEach(() => {
    collector.close();
    if (fs.existsSync(tempDbPath)) {
      fs.unlinkSync(tempDbPath);
    }
  });

  it('should track successful detection', () => {
    collector.track({
      tool: 'replit',
      confidence: 0.95,
      autoDetected: true,
      buildSuccess: true
    });

    const stats = collector.getStats();
    expect(stats.totalRuns).toBe(1);
    expect(stats.toolUsage.replit).toBe(1);
    expect(stats.avgConfidence.replit).toBeCloseTo(0.95, 2);
  });

  it('should categorize errors correctly', () => {
    const error = new Error('Error: listen EADDRINUSE: address already in use :::3000');
    const category = collector.categorizeError(error);
    expect(category).toBe('PORT_CONFLICT');
  });

  it('should hash similar errors identically', () => {
    const error1 = new Error('File not found: /path/to/file.txt');
    const error2 = new Error('File not found: /different/path/other.txt');

    const hash1 = collector.hashError(error1);
    const hash2 = collector.hashError(error2);

    expect(hash1).toBe(hash2); // Same normalized error
  });
});
```

## Rollout Plan

### Phase 1: Development (Week 1)
- [ ] Implement `MetricsCollector` class
- [ ] Add database schema and migrations
- [ ] Write comprehensive tests
- [ ] Add `--no-metrics` flag support

### Phase 2: Integration (Week 1)
- [ ] Integrate into `vibe-to-docker.js`
- [ ] Add `stats` CLI command
- [ ] Add metrics to README (privacy section)
- [ ] Update CONTRIBUTING.md with metrics info

### Phase 3: Testing (Week 2)
- [ ] Test opt-out functionality
- [ ] Test database performance (1000+ entries)
- [ ] Cross-platform testing (macOS, Linux, Windows)
- [ ] Ensure graceful failure if DB locked

### Phase 4: Documentation (Week 2)
- [ ] Add PRIVACY.md explaining metrics
- [ ] Update CLI help text
- [ ] Add to troubleshooting guide
- [ ] Blog post on data-driven development

## Success Criteria

- ✅ <1ms overhead on init command
- ✅ Opt-out rate <20%
- ✅ Zero metrics-related bugs reported
- ✅ Database size <1MB after 1000 runs
- ✅ Stats command runs in <100ms

## Future Enhancements

### v4.5.0+
- Export stats to JSON for sharing
- Aggregate stats (opt-in) for community insights
- Trend analysis (success rate over time)
- Predictive error detection
- Integration with AgentDB for ML-based insights

---

## References

- SQLite Best Practices: https://www.sqlite.org/bestpractice.html
- Privacy by Design: https://www.privacy-regulation.eu/en/r49.htm
- Anonymous Metrics Examples: Homebrew, npm, cargo
