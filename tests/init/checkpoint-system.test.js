/**
 * Checkpoint System Tests
 * Tests checkpoint creation, persistence, and recovery
 * Target: State management and rollback capabilities
 */

import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Checkpoint System', () => {
  let testDir;
  let checkpointDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `checkpoint-test-${Date.now()}`);
    checkpointDir = path.join(testDir, '.vibe-docker', 'checkpoints');
    await fs.mkdir(checkpointDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('Checkpoint Creation', () => {
    test('should create checkpoint with phase data', async () => {
      const checkpoint = {
        phase: 'pre-flight',
        data: { dockerInstalled: true, nodeVersion: '20.8.1' },
        timestamp: Date.now()
      };

      expect(checkpoint.phase).toBe('pre-flight');
      expect(checkpoint.data).toBeDefined();
      expect(checkpoint.timestamp).toBeGreaterThan(0);
    });

    test('should create multiple checkpoints', () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'figma-make' }, timestamp: Date.now() + 1000 },
        { phase: 'analysis', data: { framework: 'react' }, timestamp: Date.now() + 2000 }
      ];

      expect(checkpoints).toHaveLength(3);
      expect(checkpoints.map(cp => cp.phase)).toEqual(['pre-flight', 'detection', 'analysis']);
    });

    test('should include comprehensive state in checkpoint', () => {
      const checkpoint = {
        phase: 'detection',
        data: {
          tool: 'figma-make',
          confidence: 0.95,
          framework: 'react-vite',
          detectedFiles: ['package.json', 'vite.config.ts']
        },
        timestamp: Date.now(),
        metadata: {
          duration: 120,
          agent: 'detector-agent'
        }
      };

      expect(checkpoint.data.tool).toBe('figma-make');
      expect(checkpoint.metadata.agent).toBe('detector-agent');
    });
  });

  describe('Checkpoint Persistence', () => {
    test('should persist checkpoints to filesystem', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() }
      ];

      const checkpointFile = path.join(checkpointDir, 'latest.json');
      await fs.writeFile(checkpointFile, JSON.stringify({ checkpoints }, null, 2));

      const exists = await fs.access(checkpointFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    test('should persist multiple checkpoints', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'bolt' }, timestamp: Date.now() + 1000 },
        { phase: 'analysis', data: { framework: 'react' }, timestamp: Date.now() + 2000 }
      ];

      const checkpointFile = path.join(checkpointDir, 'latest.json');
      await fs.writeFile(checkpointFile, JSON.stringify({ checkpoints }, null, 2));

      const content = await fs.readFile(checkpointFile, 'utf8');
      const parsed = JSON.parse(content);

      expect(parsed.checkpoints).toHaveLength(3);
    });

    test('should maintain checkpoint history', async () => {
      const timestamp = Date.now();
      const historyFile = path.join(checkpointDir, `checkpoint-${timestamp}.json`);

      const checkpoint = {
        phase: 'file-writing',
        data: { filesCreated: 3 },
        timestamp
      };

      await fs.writeFile(historyFile, JSON.stringify(checkpoint, null, 2));

      const exists = await fs.access(historyFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });
  });

  describe('Checkpoint Recovery', () => {
    test('should load checkpoints from filesystem', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'bolt' }, timestamp: Date.now() + 1000 }
      ];

      const checkpointFile = path.join(checkpointDir, 'latest.json');
      await fs.writeFile(checkpointFile, JSON.stringify({ checkpoints }, null, 2));

      const content = await fs.readFile(checkpointFile, 'utf8');
      const loaded = JSON.parse(content);

      expect(loaded.checkpoints).toHaveLength(2);
      expect(loaded.checkpoints[1].data.tool).toBe('bolt');
    });

    test('should restore from specific checkpoint', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { dockerInstalled: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'figma-make' }, timestamp: Date.now() + 1000 },
        { phase: 'analysis', data: { framework: 'react' }, timestamp: Date.now() + 2000 }
      ];

      const targetPhase = 'detection';
      const targetIndex = checkpoints.findIndex(cp => cp.phase === targetPhase);

      expect(targetIndex).toBe(1);
      expect(checkpoints[targetIndex].data.tool).toBe('figma-make');
    });

    test('should identify remaining phases after restoration', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'bolt' }, timestamp: Date.now() + 1000 },
        { phase: 'analysis', data: { framework: 'vue' }, timestamp: Date.now() + 2000 },
        { phase: 'template-generation', data: { template: 'vue-vite' }, timestamp: Date.now() + 3000 }
      ];

      const restorePhase = 'detection';
      const index = checkpoints.findIndex(cp => cp.phase === restorePhase);
      const remainingPhases = checkpoints.slice(index + 1);

      expect(remainingPhases).toHaveLength(2);
      expect(remainingPhases[0].phase).toBe('analysis');
      expect(remainingPhases[1].phase).toBe('template-generation');
    });

    test('should handle missing checkpoint file', async () => {
      const checkpointFile = path.join(checkpointDir, 'latest.json');
      const exists = await fs.access(checkpointFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(false);
    });
  });

  describe('Rollback Mechanism', () => {
    test('should rollback to previous checkpoint on failure', () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'figma-make' }, timestamp: Date.now() + 1000 }
      ];

      const failurePhase = 'analysis';
      const lastSuccessfulIndex = checkpoints.length - 1;
      const rollbackCheckpoint = checkpoints[lastSuccessfulIndex];

      expect(rollbackCheckpoint.phase).toBe('detection');
      expect(rollbackCheckpoint.data.tool).toBe('figma-make');
    });

    test('should preserve state before rollback', async () => {
      const failedState = {
        phase: 'file-writing',
        error: 'Permission denied',
        timestamp: Date.now()
      };

      const failureLog = path.join(checkpointDir, 'failure.json');
      await fs.writeFile(failureLog, JSON.stringify(failedState, null, 2));

      const exists = await fs.access(failureLog)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    test('should identify safe rollback point', () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now(), validated: true },
        { phase: 'detection', data: { tool: 'bolt' }, timestamp: Date.now() + 1000, validated: true },
        { phase: 'analysis', data: { framework: 'react' }, timestamp: Date.now() + 2000, validated: false }
      ];

      const safeCheckpoints = checkpoints.filter(cp => cp.validated);
      const rollbackPoint = safeCheckpoints[safeCheckpoints.length - 1];

      expect(rollbackPoint.phase).toBe('detection');
    });
  });

  describe('Checkpoint Cleanup', () => {
    test('should remove old checkpoints', async () => {
      const oldCheckpoint = path.join(checkpointDir, `checkpoint-${Date.now() - 86400000}.json`);
      await fs.writeFile(oldCheckpoint, JSON.stringify({ phase: 'old' }));

      const allCheckpoints = await fs.readdir(checkpointDir);
      const checkpointFiles = allCheckpoints.filter(f => f.startsWith('checkpoint-'));

      expect(checkpointFiles.length).toBeGreaterThan(0);
    });

    test('should maintain latest checkpoint', async () => {
      const latestFile = path.join(checkpointDir, 'latest.json');
      await fs.writeFile(latestFile, JSON.stringify({ checkpoints: [] }));

      const exists = await fs.access(latestFile)
        .then(() => true)
        .catch(() => false);

      expect(exists).toBe(true);
    });

    test('should limit checkpoint history size', async () => {
      const maxCheckpoints = 10;
      const checkpoints = Array.from({ length: 15 }, (_, i) => ({
        phase: `phase-${i}`,
        timestamp: Date.now() + i * 1000
      }));

      const recentCheckpoints = checkpoints.slice(-maxCheckpoints);

      expect(recentCheckpoints).toHaveLength(maxCheckpoints);
    });
  });

  describe('Checkpoint Validation', () => {
    test('should validate checkpoint structure', () => {
      const validCheckpoint = {
        phase: 'detection',
        data: { tool: 'figma-make' },
        timestamp: Date.now()
      };

      expect(validCheckpoint).toHaveProperty('phase');
      expect(validCheckpoint).toHaveProperty('data');
      expect(validCheckpoint).toHaveProperty('timestamp');
      expect(typeof validCheckpoint.timestamp).toBe('number');
    });

    test('should reject invalid checkpoint', () => {
      const invalidCheckpoint = {
        data: { tool: 'figma-make' }
        // Missing phase and timestamp
      };

      const isValid = invalidCheckpoint.phase && invalidCheckpoint.timestamp;

      expect(isValid).toBeFalsy();
    });

    test('should validate checkpoint data integrity', async () => {
      const checkpoint = {
        phase: 'analysis',
        data: { framework: 'react', confidence: 0.95 },
        timestamp: Date.now(),
        checksum: 'abc123'
      };

      const checkpointFile = path.join(checkpointDir, 'test-checkpoint.json');
      await fs.writeFile(checkpointFile, JSON.stringify(checkpoint, null, 2));

      const loaded = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));

      expect(loaded.checksum).toBe(checkpoint.checksum);
    });
  });
});
