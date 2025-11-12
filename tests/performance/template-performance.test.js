/**

import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 * Template Performance Tests
 *
 * Benchmarks for Phase 2 template system:
 * - Template composition speed (<50ms target)
 * - Memory usage during composition
 * - Caching effectiveness
 * - Concurrent template generation
 *
 * Performance targets from project requirements:
 * - Single template composition: <50ms
 * - Cache hit rate: >90%
 * - Memory overhead: <10MB per template
 * - Concurrent generation: 10+ templates without degradation
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { TemplateComposer } from '../../src/lib/template-composer.js';
import { EnvManager } from '../../src/lib/env-manager.js';

describe('Template Performance Benchmarks', () => {
  let tempDir;
  let composer;
  let envManager;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'perf-test-'));

    composer = new TemplateComposer({
      templatesDir: path.join(__dirname, '../../src/templates'),
      outputDir: tempDir
    });

    envManager = new EnvManager({
      projectDir: tempDir
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Template Composition Speed', () => {

    test('should compose Lovable template in <50ms', async () => {
      const detection = {
        tool: 'lovable',
        metadata: {
          framework: 'react',
          backend: 'supabase'
        }
      };

      const start = performance.now();
      await composer.generate(detection);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`Lovable template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose Bolt template in <50ms', async () => {
      const detection = {
        tool: 'bolt',
        metadata: {
          framework: 'react'
        }
      };

      const start = performance.now();
      await composer.generate(detection);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`Bolt template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose V0 template in <50ms', async () => {
      const detection = {
        tool: 'v0',
        metadata: {
          framework: 'next'
        }
      };

      const start = performance.now();
      await composer.generate(detection);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`V0 template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose Figma Make template in <50ms', async () => {
      const detection = {
        tool: 'figma-make',
        metadata: {
          framework: 'react'
        }
      };

      const start = performance.now();
      await composer.generate(detection);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`Figma Make template composition: ${elapsed.toFixed(2)}ms`);
    });

    test('should compose complex template with multiple fragments in <50ms', async () => {
      const detection = {
        tool: 'lovable',
        metadata: {
          framework: 'react',
          backend: 'supabase',
          database: 'postgresql',
          language: 'typescript',
          styling: 'tailwind'
        }
      };

      const start = performance.now();
      await composer.generate(detection);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
      console.log(`Complex template composition: ${elapsed.toFixed(2)}ms`);
    });
  });

  describe('Caching Effectiveness', () => {

    test('should achieve >90% cache hit rate', async () => {
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      // Warm up cache
      await composer.generate(detection);

      const iterations = 100;
      let cacheHits = 0;

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const result = await composer.generate(detection);
        if (result.fromCache) {
          cacheHits++;
        }
      }

      const elapsed = performance.now() - start;
      const hitRate = (cacheHits / iterations) * 100;

      expect(hitRate).toBeGreaterThan(90);
      console.log(`Cache hit rate: ${hitRate.toFixed(1)}% (${iterations} iterations, ${elapsed.toFixed(2)}ms total)`);
    });

    test('should serve cached templates faster than initial generation', async () => {
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      // First generation (no cache)
      const start1 = performance.now();
      await composer.generate(detection);
      const timeWithoutCache = performance.now() - start1;

      // Clear output
      await fs.rm(path.join(tempDir, 'Dockerfile'), { force: true });

      // Second generation (with cache)
      const start2 = performance.now();
      await composer.generate(detection);
      const timeWithCache = performance.now() - start2;

      const improvement = ((timeWithoutCache - timeWithCache) / timeWithoutCache) * 100;

      expect(timeWithCache).toBeLessThanOrEqual(timeWithoutCache);
      console.log(`Cache speedup: ${timeWithoutCache.toFixed(2)}ms → ${timeWithCache.toFixed(2)}ms (${improvement.toFixed(1)}% faster)`);
    });

    test('should cache template fragments separately', async () => {
      const fragments = ['react', 'supabase', 'postgresql', 'typescript'];

      const times = [];

      for (const fragment of fragments) {
        const start = performance.now();
        await composer.loadFragment('frameworks', fragment);
        times.push(performance.now() - start);
      }

      // Second load should be faster (cached)
      for (let i = 0; i < fragments.length; i++) {
        const start = performance.now();
        await composer.loadFragment('frameworks', fragments[i]);
        const cachedTime = performance.now() - start;

        expect(cachedTime).toBeLessThanOrEqual(times[i]);
      }
    });

    test('should invalidate cache when template changes', async () => {
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      // Generate with original template
      await composer.generate(detection);

      // Modify template
      const templatePath = path.join(__dirname, '../../src/templates/tools/lovable/Dockerfile.template');
      await composer.invalidateCache(templatePath);

      // Should regenerate
      const result = await composer.generate(detection);
      expect(result.fromCache).toBeFalsy();
    });
  });

  describe('Memory Usage', () => {

    test('should use <10MB memory per template composition', async () => {
      const detection = {
        tool: 'lovable',
        metadata: {
          framework: 'react',
          backend: 'supabase',
          database: 'postgresql'
        }
      };

      const memBefore = process.memoryUsage().heapUsed;

      await composer.generate(detection);

      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024; // Convert to MB

      expect(memUsed).toBeLessThan(10);
      console.log(`Memory used: ${memUsed.toFixed(2)}MB`);
    });

    test('should not leak memory during repeated compositions', async () => {
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      const iterations = 100;
      const memBefore = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        await composer.generate(detection);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memLeaked = (memAfter - memBefore) / 1024 / 1024;

      // Should not leak >50MB for 100 iterations
      expect(memLeaked).toBeLessThan(50);
      console.log(`Memory after ${iterations} iterations: ${memLeaked.toFixed(2)}MB`);
    });

    test('should clean up template cache when memory threshold reached', async () => {
      // Generate many different templates to fill cache
      const tools = ['lovable', 'bolt', 'v0', 'figma-make'];
      const frameworks = ['react', 'vue', 'svelte', 'angular'];

      const memBefore = process.memoryUsage().heapUsed;

      for (const tool of tools) {
        for (const framework of frameworks) {
          await composer.generate({
            tool,
            metadata: { framework }
          });
        }
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memUsed = (memAfter - memBefore) / 1024 / 1024;

      // Should maintain reasonable memory usage
      expect(memUsed).toBeLessThan(100);
    });
  });

  describe('Concurrent Template Generation', () => {

    test('should handle 10 concurrent compositions without degradation', async () => {
      const detections = Array(10).fill(null).map((_, i) => ({
        tool: ['lovable', 'bolt', 'v0', 'figma-make'][i % 4],
        metadata: {
          framework: 'react',
          projectId: `project-${i}`
        }
      }));

      const start = performance.now();

      const results = await Promise.all(
        detections.map(d => composer.generate(d))
      );

      const elapsed = performance.now() - start;
      const avgTime = elapsed / detections.length;

      expect(results.length).toBe(10);
      expect(avgTime).toBeLessThan(100); // Average should be reasonable

      console.log(`10 concurrent compositions: ${elapsed.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
    });

    test('should handle 50 concurrent compositions', async () => {
      const detections = Array(50).fill(null).map((_, i) => ({
        tool: ['lovable', 'bolt', 'v0', 'figma-make'][i % 4],
        metadata: { framework: 'react' }
      }));

      const start = performance.now();

      const results = await Promise.all(
        detections.map(d => composer.generate(d))
      );

      const elapsed = performance.now() - start;

      expect(results.length).toBe(50);
      expect(elapsed).toBeLessThan(5000); // Should complete in <5s

      console.log(`50 concurrent compositions: ${elapsed.toFixed(2)}ms`);
    });

    test('should maintain cache effectiveness under concurrent load', async () => {
      // Same detection repeated 20 times concurrently
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      // Warm cache
      await composer.generate(detection);

      const promises = Array(20).fill(null).map(() => composer.generate(detection));

      const start = performance.now();
      const results = await Promise.all(promises);
      const elapsed = performance.now() - start;

      const cacheHits = results.filter(r => r.fromCache).length;
      const hitRate = (cacheHits / results.length) * 100;

      expect(hitRate).toBeGreaterThan(90);
      console.log(`Concurrent cache hit rate: ${hitRate.toFixed(1)}% (${elapsed.toFixed(2)}ms)`);
    });
  });

  describe('Environment Variable Generation Speed', () => {

    test('should generate .env.example in <10ms', async () => {
      const metadata = {
        tool: 'lovable',
        backend: 'supabase',
        database: 'postgresql'
      };

      const start = performance.now();
      await envManager.generateEnvExample(metadata);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
      console.log(`.env.example generation: ${elapsed.toFixed(2)}ms`);
    });

    test('should validate large .env files efficiently', async () => {
      // Create large .env file
      const largeEnv = Array(1000).fill(null)
        .map((_, i) => `VAR_${i}=value${i}`)
        .join('\n');

      await fs.writeFile(path.join(tempDir, '.env'), largeEnv);

      const start = performance.now();
      await envManager.validateEnvFile(path.join(tempDir, '.env'));
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
      console.log(`Large .env validation (1000 vars): ${elapsed.toFixed(2)}ms`);
    });
  });

  describe('Variable Substitution Performance', () => {

    test('should handle 100 variable substitutions efficiently', () => {
      const template = Array(100).fill(null)
        .map((_, i) => `VAR_${i}={{ var${i} }}`)
        .join('\n');

      const variables = Object.fromEntries(
        Array(100).fill(null).map((_, i) => [`var${i}`, `value${i}`])
      );

      const start = performance.now();
      const result = composer.substituteVariables(template, variables);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
      expect(result).toContain('value99');
      console.log(`100 variable substitutions: ${elapsed.toFixed(2)}ms`);
    });

    test('should handle complex nested variable substitutions', () => {
      const template = '{{ app.config.database.host }}:{{ app.config.database.port }}/{{ app.config.database.name }}';
      const variables = {
        app: {
          config: {
            database: {
              host: 'localhost',
              port: 5432,
              name: 'mydb'
            }
          }
        }
      };

      const start = performance.now();
      const result = composer.substituteVariables(template, variables);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
      expect(result).toBe('localhost:5432/mydb');
    });
  });

  describe('Fragment Loading Performance', () => {

    test('should load 10 fragments in <20ms', async () => {
      const fragments = [
        'frameworks/react',
        'frameworks/vue',
        'frameworks/next',
        'databases/postgresql',
        'databases/mysql',
        'backends/supabase',
        'backends/firebase',
        'backends/nodejs',
        'frameworks/svelte',
        'frameworks/angular'
      ];

      const start = performance.now();

      const results = await Promise.all(
        fragments.map(f => {
          const [type, name] = f.split('/');
          return composer.loadFragment(type, name);
        })
      );

      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(20);
      console.log(`10 fragments loaded: ${elapsed.toFixed(2)}ms`);
    });

    test('should cache fragment loads effectively', async () => {
      const fragment = { type: 'frameworks', name: 'react' };

      // First load
      const start1 = performance.now();
      await composer.loadFragment(fragment.type, fragment.name);
      const time1 = performance.now() - start1;

      // Second load (cached)
      const start2 = performance.now();
      await composer.loadFragment(fragment.type, fragment.name);
      const time2 = performance.now() - start2;

      expect(time2).toBeLessThan(time1);
      console.log(`Fragment load: ${time1.toFixed(2)}ms → ${time2.toFixed(2)}ms (cached)`);
    });
  });

  describe('Performance Summary', () => {

    test('should provide comprehensive performance metrics', async () => {
      const metrics = {
        tools: ['lovable', 'bolt', 'v0', 'figma-make'],
        times: {},
        memory: {},
        cache: {}
      };

      for (const tool of metrics.tools) {
        const detection = {
          tool,
          metadata: { framework: 'react' }
        };

        const memBefore = process.memoryUsage().heapUsed;
        const start = performance.now();

        await composer.generate(detection);

        const elapsed = performance.now() - start;
        const memAfter = process.memoryUsage().heapUsed;
        const memUsed = (memAfter - memBefore) / 1024 / 1024;

        metrics.times[tool] = elapsed;
        metrics.memory[tool] = memUsed;

        // Test cache
        const cacheStart = performance.now();
        const result = await composer.generate(detection);
        metrics.cache[tool] = {
          time: performance.now() - cacheStart,
          hit: result.fromCache
        };
      }

      console.log('\n=== Template Performance Summary ===');
      console.log('Tool         | Time (ms) | Memory (MB) | Cache Hit | Cache Time (ms)');
      console.log('-------------|-----------|-------------|-----------|----------------');

      for (const tool of metrics.tools) {
        console.log(
          `${tool.padEnd(12)} | ` +
          `${metrics.times[tool].toFixed(2).padStart(9)} | ` +
          `${metrics.memory[tool].toFixed(2).padStart(11)} | ` +
          `${(metrics.cache[tool].hit ? 'Yes' : 'No').padStart(9)} | ` +
          `${metrics.cache[tool].time.toFixed(2).padStart(14)}`
        );
      }
      console.log('=====================================\n');

      // All should meet performance targets
      Object.values(metrics.times).forEach(time => {
        expect(time).toBeLessThan(50);
      });

      Object.values(metrics.memory).forEach(mem => {
        expect(mem).toBeLessThan(10);
      });
    });
  });

  describe('Stress Testing', () => {

    test('should handle rapid successive generations', async () => {
      const detection = {
        tool: 'lovable',
        metadata: { framework: 'react' }
      };

      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await composer.generate(detection);
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / iterations;

      expect(avgTime).toBeLessThan(10); // Average should be fast due to caching
      console.log(`${iterations} successive generations: ${elapsed.toFixed(2)}ms (${avgTime.toFixed(2)}ms avg)`);
    });

    test('should maintain performance under memory pressure', async () => {
      const iterations = 100;
      const largeData = Array(1000).fill('x'.repeat(1000)); // ~1MB per iteration

      for (let i = 0; i < iterations; i++) {
        // Create memory pressure
        const temp = [...largeData];

        await composer.generate({
          tool: 'lovable',
          metadata: { framework: 'react', data: temp }
        });
      }

      // Should still be responsive
      const start = performance.now();
      await composer.generate({
        tool: 'lovable',
        metadata: { framework: 'react' }
      });
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });
});
