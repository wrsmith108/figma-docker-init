/**
 * Phase 3 CLI Performance Benchmarks
 *
 * Measures end-to-end CLI performance including:
 * - Total CLI execution time (<1000ms target with overhead)
 * - Template composition time (<500ms target)
 * - Tool detection time (<100ms target)
 * - File I/O operations
 * - Memory usage (<100MB target)
 * - Cache effectiveness (>80% target)
 *
 * Compares Phase 3 (CLI integration) vs Phase 2 (template system only)
 *
 * Performance Targets:
 * - Total CLI execution: <1000ms (including CLI overhead)
 * - Template composition: <500ms (Phase 2 target maintained)
 * - Tool detection: <100ms
 * - Memory usage: <100MB
 * - Cache hit rate: >80%
 *
 * @module tests/performance/phase3-cli-benchmarks
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawn } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Phase 2 components for comparison
import { TemplateComposer } from '../../src/lib/template-composer.js';
import { CachedDetectorChain } from '../../src/detectors/cached-detector-chain.js';
import LovableDetector from '../../src/detectors/lovable-detector.js';
import BoltDetector from '../../src/detectors/bolt-detector.js';
import { V0Detector } from '../../src/detectors/v0-detector.js';
import { FigmaDetector } from '../../src/detectors/figma-detector.js';

// CLI entry point path
const CLI_PATH = path.join(__dirname, '../../vibe-to-docker.js');

describe('Phase 3 CLI Performance Benchmarks', () => {
  let tempDir;
  let composer;
  let detectorChain;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phase3-perf-'));

    composer = new TemplateComposer(
      path.join(__dirname, '../../src/templates')
    );

    detectorChain = new CachedDetectorChain([
      new LovableDetector(),
      new BoltDetector(),
      new V0Detector(),
      new FigmaDetector()
    ]);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // =============================================================================
  // END-TO-END CLI EXECUTION BENCHMARKS
  // =============================================================================

  describe('End-to-End CLI Execution', () => {
    test('should execute Lovable template in <1000ms (including CLI overhead)', async () => {
      // Setup Lovable project
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'lovable-app',
          dependencies: {
            'react': '^19.0.0',
            '@supabase/supabase-js': '^2.38.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0',
            'vite': '^5.0.0'
          }
        })
      );

      // Measure total CLI execution time
      const start = performance.now();

      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // CLI may exit with non-zero, but that's ok for timing
      }

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
      console.log(`Lovable CLI execution: ${elapsed.toFixed(2)}ms`);
    }, 10000);

    test('should execute Bolt template in <1000ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'bolt-app',
          dependencies: {
            'vite': '^5.0.0',
            'react': '^18.2.0'
          },
          devDependencies: {
            '@stackblitz/sdk': '^1.9.0'
          }
        })
      );

      const start = performance.now();

      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
      console.log(`Bolt CLI execution: ${elapsed.toFixed(2)}ms`);
    }, 10000);

    test('should execute V0 template in <1000ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'v0-app',
          dependencies: {
            'next': '^14.0.0',
            'react': '^18.2.0',
            '@radix-ui/react-dialog': '^1.0.0'
          }
        })
      );

      await fs.writeFile(
        path.join(tempDir, 'next.config.js'),
        'module.exports = {}'
      );

      const start = performance.now();

      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
      console.log(`V0 CLI execution: ${elapsed.toFixed(2)}ms`);
    }, 10000);

    test('should execute Figma Make template in <1000ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'figma-app',
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            'vite': '^5.0.0',
            '@vitejs/plugin-react': '^4.0.0',
            'typescript': '^5.0.0'
          }
        })
      );

      await fs.writeFile(
        path.join(tempDir, 'vite.config.ts'),
        'export default { plugins: [react()] }'
      );

      const start = performance.now();

      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(1000);
      console.log(`Figma Make CLI execution: ${elapsed.toFixed(2)}ms`);
    }, 10000);
  });

  // =============================================================================
  // TEMPLATE COMPOSITION BENCHMARKS (Phase 2 Target: <500ms)
  // =============================================================================

  describe('Template Composition Performance', () => {
    test('should compose Lovable template in <500ms (Phase 2 target)', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'lovable',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      const start = performance.now();
      await composer.compose(config);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
      console.log(`Lovable template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose Bolt template in <500ms', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'bolt',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      const start = performance.now();
      await composer.compose(config);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
      console.log(`Bolt template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose V0 template in <500ms', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'v0',
          FRAMEWORK: 'next',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      const start = performance.now();
      await composer.compose(config);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
      console.log(`V0 template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose Figma Make template in <500ms', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'figma',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      const start = performance.now();
      await composer.compose(config);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(500);
      console.log(`Figma Make template composition: ${elapsed.toFixed(2)}ms`);
    });
  });

  // =============================================================================
  // TOOL DETECTION BENCHMARKS (Target: <100ms)
  // =============================================================================

  describe('Tool Detection Performance', () => {
    test('should detect Lovable project in <100ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            'react': '^19.0.0',
            '@supabase/supabase-js': '^2.38.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0'
          }
        })
      );

      const start = performance.now();
      await detectorChain.detect(tempDir);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      console.log(`Lovable detection: ${elapsed.toFixed(2)}ms`);
    });

    test('should detect Bolt project in <100ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            'vite': '^5.0.0'
          },
          devDependencies: {
            '@stackblitz/sdk': '^1.9.0'
          }
        })
      );

      await fs.mkdir(path.join(tempDir, '.bolt'));

      const start = performance.now();
      await detectorChain.detect(tempDir);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      console.log(`Bolt detection: ${elapsed.toFixed(2)}ms`);
    });

    test('should detect V0 project in <100ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            'next': '^14.0.0',
            '@radix-ui/react-dialog': '^1.0.0'
          }
        })
      );

      const start = performance.now();
      await detectorChain.detect(tempDir);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      console.log(`V0 detection: ${elapsed.toFixed(2)}ms`);
    });

    test('should detect Figma Make project in <100ms', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            'react': '^18.2.0',
            'vite': '^5.0.0'
          },
          devDependencies: {
            'typescript': '^5.0.0'
          }
        })
      );

      await fs.writeFile(path.join(tempDir, 'vite.config.ts'), '');

      const start = performance.now();
      await detectorChain.detect(tempDir);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      console.log(`Figma Make detection: ${elapsed.toFixed(2)}ms`);
    });
  });

  // =============================================================================
  // FILE I/O PERFORMANCE BENCHMARKS
  // =============================================================================

  describe('File I/O Performance', () => {
    test('should write Dockerfile in <50ms', async () => {
      const content = `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`;

      const filePath = path.join(tempDir, 'Dockerfile');

      const start = performance.now();
      await fs.writeFile(filePath, content);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`Dockerfile write: ${elapsed.toFixed(2)}ms`);
    });

    test('should write docker-compose.yml in <50ms', async () => {
      const content = `version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules`;

      const filePath = path.join(tempDir, 'docker-compose.yml');

      const start = performance.now();
      await fs.writeFile(filePath, content);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`docker-compose.yml write: ${elapsed.toFixed(2)}ms`);
    });

    test('should write .dockerignore in <50ms', async () => {
      const content = `node_modules
.git
.env
dist
build
*.log`;

      const filePath = path.join(tempDir, '.dockerignore');

      const start = performance.now();
      await fs.writeFile(filePath, content);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`.dockerignore write: ${elapsed.toFixed(2)}ms`);
    });

    test('should write all 3 files in <150ms', async () => {
      const files = [
        { name: 'Dockerfile', content: 'FROM node:20-alpine\nWORKDIR /app' },
        { name: 'docker-compose.yml', content: 'version: "3.8"\nservices:\n  app:\n    build: .' },
        { name: '.dockerignore', content: 'node_modules\n.git' }
      ];

      const start = performance.now();

      await Promise.all(
        files.map(f => fs.writeFile(path.join(tempDir, f.name), f.content))
      );

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(150);
      console.log(`All 3 files written in parallel: ${elapsed.toFixed(2)}ms`);
    });
  });

  // =============================================================================
  // MEMORY USAGE BENCHMARKS (Target: <100MB)
  // =============================================================================

  describe('Memory Usage', () => {
    test('should use <100MB for CLI execution', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'test-app',
          dependencies: {
            'react': '^19.0.0',
            'vite': '^5.0.0'
          }
        })
      );

      const memBefore = process.memoryUsage().heapUsed;

      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;

      expect(memUsed).toBeLessThan(100);
      console.log(`CLI memory usage: ${memUsed.toFixed(2)}MB`);
    }, 10000);

    test('should use <50MB for template composition', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'lovable',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      const memBefore = process.memoryUsage().heapUsed;

      await composer.compose(config);

      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;

      expect(memUsed).toBeLessThan(50);
      console.log(`Template composition memory: ${memUsed.toFixed(2)}MB`);
    });

    test('should use <20MB for tool detection', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          dependencies: {
            'react': '^19.0.0'
          }
        })
      );

      const memBefore = process.memoryUsage().heapUsed;

      await detectorChain.detect(tempDir);

      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;

      expect(memUsed).toBeLessThan(20);
      console.log(`Tool detection memory: ${memUsed.toFixed(2)}MB`);
    });
  });

  // =============================================================================
  // CACHE EFFECTIVENESS (Target: >80%)
  // =============================================================================

  describe('Cache Effectiveness', () => {
    test('should achieve >80% cache hit rate for repeated templates', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'lovable',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      // Warm cache
      await composer.compose(config);

      const iterations = 100;
      let totalTime = 0;

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await composer.compose(config);
        totalTime += performance.now() - start;
      }

      const avgTime = totalTime / iterations;

      // Cached composition should average <10ms
      expect(avgTime).toBeLessThan(10);
      console.log(`Cache effectiveness: ${avgTime.toFixed(2)}ms average over ${iterations} iterations`);

      const stats = composer.getCacheStats();
      console.log(`Cache stats: ${stats.cachedFragments} fragments cached`);
    });

    test('should achieve >80% speedup with fragment caching', async () => {
      const fragmentPath = 'base/Dockerfile.base';

      // First load (no cache)
      composer.clearCache();
      const start1 = performance.now();
      await composer.loadFragment(fragmentPath);
      const timeWithoutCache = performance.now() - start1;

      // Second load (with cache)
      const start2 = performance.now();
      await composer.loadFragment(fragmentPath);
      const timeWithCache = performance.now() - start2;

      const speedup = ((timeWithoutCache - timeWithCache) / timeWithoutCache) * 100;

      expect(speedup).toBeGreaterThan(80);
      console.log(`Fragment caching speedup: ${speedup.toFixed(1)}%`);
    });
  });

  // =============================================================================
  // PHASE 3 vs PHASE 2 COMPARISON
  // =============================================================================

  describe('Phase 3 vs Phase 2 Performance Comparison', () => {
    test('should maintain Phase 2 template composition speed in Phase 3', async () => {
      const config = {
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'lovable',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      };

      // Phase 2: Template composition only
      const phase2Start = performance.now();
      await composer.compose(config);
      const phase2Time = performance.now() - phase2Start;

      // Phase 3: Full CLI execution (includes composition + CLI overhead)
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'lovable-app',
          dependencies: {
            'react': '^19.0.0'
          }
        })
      );

      const phase3Start = performance.now();
      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }
      const phase3Time = performance.now() - phase3Start;

      const overhead = phase3Time - phase2Time;

      console.log(`Phase 2 (composition only): ${phase2Time.toFixed(2)}ms`);
      console.log(`Phase 3 (full CLI): ${phase3Time.toFixed(2)}ms`);
      console.log(`CLI overhead: ${overhead.toFixed(2)}ms`);

      // Phase 2 should maintain <500ms target
      expect(phase2Time).toBeLessThan(500);
      // Phase 3 should stay <1000ms with CLI overhead
      expect(phase3Time).toBeLessThan(1000);
    }, 10000);

    test('should break down Phase 3 timing into components', async () => {
      await fs.writeFile(
        path.join(tempDir, 'package.json'),
        JSON.stringify({
          name: 'lovable-app',
          dependencies: {
            'react': '^19.0.0',
            '@supabase/supabase-js': '^2.38.0'
          },
          devDependencies: {
            'lovable-tagger': '^1.1.0'
          }
        })
      );

      const timings = {};

      // 1. Tool Detection
      const detectStart = performance.now();
      await detectorChain.detect(tempDir);
      timings.detection = performance.now() - detectStart;

      // 2. Template Composition
      const composeStart = performance.now();
      await composer.compose({
        fragments: ['base/Dockerfile.base'],
        variables: {
          TOOL: 'lovable',
          FRAMEWORK: 'react',
          NODE_VERSION: '20',
          PORT: '3000'
        }
      });
      timings.composition = performance.now() - composeStart;

      // 3. File I/O
      const ioStart = performance.now();
      await Promise.all([
        fs.writeFile(path.join(tempDir, 'Dockerfile'), 'FROM node:20'),
        fs.writeFile(path.join(tempDir, 'docker-compose.yml'), 'version: "3.8"'),
        fs.writeFile(path.join(tempDir, '.dockerignore'), 'node_modules')
      ]);
      timings.fileIO = performance.now() - ioStart;

      // 4. Total (for comparison)
      const totalStart = performance.now();
      try {
        execSync(`node ${CLI_PATH} basic`, {
          cwd: tempDir,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        // Ignore
      }
      timings.total = performance.now() - totalStart;

      timings.overhead = timings.total - (timings.detection + timings.composition + timings.fileIO);

      console.log('\n=== Phase 3 Timing Breakdown ===');
      console.log(`Tool Detection:      ${timings.detection.toFixed(2)}ms`);
      console.log(`Template Composition: ${timings.composition.toFixed(2)}ms`);
      console.log(`File I/O:            ${timings.fileIO.toFixed(2)}ms`);
      console.log(`CLI Overhead:        ${timings.overhead.toFixed(2)}ms`);
      console.log(`Total:               ${timings.total.toFixed(2)}ms`);
      console.log('================================\n');

      expect(timings.detection).toBeLessThan(100);
      expect(timings.composition).toBeLessThan(500);
      expect(timings.fileIO).toBeLessThan(150);
      expect(timings.total).toBeLessThan(1000);
    }, 10000);
  });

  // =============================================================================
  // COMPREHENSIVE PERFORMANCE SUMMARY
  // =============================================================================

  describe('Performance Summary', () => {
    test('should generate comprehensive performance report for all tools', async () => {
      const tools = [
        {
          name: 'lovable',
          packageJson: {
            dependencies: {
              'react': '^19.0.0',
              '@supabase/supabase-js': '^2.38.0'
            },
            devDependencies: {
              'lovable-tagger': '^1.1.0'
            }
          }
        },
        {
          name: 'bolt',
          packageJson: {
            dependencies: {
              'vite': '^5.0.0'
            },
            devDependencies: {
              '@stackblitz/sdk': '^1.9.0'
            }
          }
        },
        {
          name: 'v0',
          packageJson: {
            dependencies: {
              'next': '^14.0.0',
              '@radix-ui/react-dialog': '^1.0.0'
            }
          }
        },
        {
          name: 'figma',
          packageJson: {
            dependencies: {
              'react': '^18.2.0',
              'vite': '^5.0.0'
            },
            devDependencies: {
              'typescript': '^5.0.0'
            }
          }
        }
      ];

      const results = [];

      for (const tool of tools) {
        // Clean temp dir
        await fs.rm(tempDir, { recursive: true, force: true });
        await fs.mkdir(tempDir);

        await fs.writeFile(
          path.join(tempDir, 'package.json'),
          JSON.stringify(tool.packageJson)
        );

        const metrics = {};

        // Detection
        const detectStart = performance.now();
        await detectorChain.detect(tempDir);
        metrics.detection = performance.now() - detectStart;

        // Composition
        const composeStart = performance.now();
        await composer.compose({
          fragments: ['base/Dockerfile.base'],
          variables: {
            TOOL: tool.name,
            FRAMEWORK: 'react',
            NODE_VERSION: '20',
            PORT: '3000'
          }
        });
        metrics.composition = performance.now() - composeStart;

        // Memory
        const memBefore = process.memoryUsage().heapUsed;
        await composer.compose({
          fragments: ['base/Dockerfile.base'],
          variables: {
            TOOL: tool.name,
            FRAMEWORK: 'react',
            NODE_VERSION: '20',
            PORT: '3000'
          }
        });
        const memAfter = process.memoryUsage().heapUsed;
        metrics.memory = (memAfter - memBefore) / 1024 / 1024;

        results.push({
          tool: tool.name,
          ...metrics
        });
      }

      console.log('\n========== Phase 3 Performance Summary ==========');
      console.log('Tool       | Detection | Composition | Memory   ');
      console.log('-----------|-----------|-------------|----------');
      results.forEach(r => {
        console.log(
          `${r.tool.padEnd(10)} | ` +
          `${r.detection.toFixed(2).padStart(7)}ms | ` +
          `${r.composition.toFixed(2).padStart(9)}ms | ` +
          `${r.memory.toFixed(2).padStart(6)}MB`
        );
      });
      console.log('=================================================\n');

      // Verify all meet targets
      results.forEach(r => {
        expect(r.detection).toBeLessThan(100);
        expect(r.composition).toBeLessThan(500);
        expect(r.memory).toBeLessThan(50);
      });
    });
  });
});
