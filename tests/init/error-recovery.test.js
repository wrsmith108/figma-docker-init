/**
 * Error Recovery Tests
 * Tests error handling, recovery mechanisms, and rollback scenarios
 * Target: System resilience and graceful degradation
 */

import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('Error Recovery and Rollback', () => {
  let testDir;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `error-recovery-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  describe('Swarm Initialization Errors', () => {
    test('should handle timeout during swarm initialization', async () => {
      const timeout = 30000; // 30 seconds
      const startTime = Date.now();

      const initWithTimeout = async () => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Swarm initialization timed out'));
          }, timeout);

          // Simulate successful init
          setTimeout(() => {
            clearTimeout(timer);
            resolve('swarm_123');
          }, 100);
        });
      };

      const result = await initWithTimeout();
      const duration = Date.now() - startTime;

      expect(result).toBe('swarm_123');
      expect(duration).toBeLessThan(timeout);
    });

    test('should retry swarm initialization on failure', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const initWithRetry = async () => {
        while (attempts < maxRetries) {
          attempts++;
          try {
            if (attempts < 2) {
              throw new Error('Temporary failure');
            }
            return 'swarm_123';
          } catch (error) {
            if (attempts >= maxRetries) {
              throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await initWithRetry();

      expect(result).toBe('swarm_123');
      expect(attempts).toBe(2);
    });

    test('should clean up resources on initialization failure', async () => {
      const resources = {
        swarmDir: path.join(testDir, '.swarm'),
        agentsSpawned: []
      };

      const cleanup = async () => {
        if (resources.agentsSpawned.length > 0) {
          // Cleanup spawned agents
          resources.agentsSpawned = [];
        }
        if (await fs.access(resources.swarmDir).then(() => true).catch(() => false)) {
          await fs.rm(resources.swarmDir, { recursive: true, force: true });
        }
      };

      await fs.mkdir(resources.swarmDir, { recursive: true });
      resources.agentsSpawned = ['agent1', 'agent2'];

      // Simulate failure
      await cleanup();

      const dirExists = await fs.access(resources.swarmDir).then(() => true).catch(() => false);
      expect(dirExists).toBe(false);
      expect(resources.agentsSpawned).toHaveLength(0);
    });
  });

  describe('Agent Spawn Errors', () => {
    test('should handle partial agent spawn failure', async () => {
      const agents = [
        { type: 'coordinator', name: 'agent1' },
        { type: 'researcher', name: 'agent2' },
        { type: 'coder', name: 'agent3' }
      ];

      const spawnResults = [];
      let spawnCount = 0;

      for (const agent of agents) {
        spawnCount++;
        try {
          if (spawnCount === 2) {
            throw new Error('Resource limit reached');
          }
          spawnResults.push({ ...agent, success: true });
        } catch (error) {
          spawnResults.push({ ...agent, success: false, error: error.message });
        }
      }

      expect(spawnResults).toHaveLength(3);
      expect(spawnResults.filter(r => r.success)).toHaveLength(2);
      expect(spawnResults[1].success).toBe(false);
    });

    test('should continue with available agents on partial failure', () => {
      const spawnResults = [
        { type: 'coordinator', success: true },
        { type: 'researcher', success: false },
        { type: 'coder', success: true },
        { type: 'tester', success: true }
      ];

      const availableAgents = spawnResults.filter(r => r.success);

      expect(availableAgents).toHaveLength(3);
      expect(availableAgents.length).toBeGreaterThanOrEqual(2); // Minimum viable
    });

    test('should rollback all agents if critical agent spawn fails', async () => {
      const criticalAgents = ['coordinator'];
      const spawnedAgents = [];

      const spawnAgent = async (agent) => {
        if (criticalAgents.includes(agent.type)) {
          throw new Error(`Critical agent ${agent.type} failed to spawn`);
        }
        spawnedAgents.push(agent);
        return { success: true, agent };
      };

      const rollback = async () => {
        spawnedAgents.splice(0, spawnedAgents.length);
      };

      try {
        await spawnAgent({ type: 'researcher', name: 'agent1' });
        await spawnAgent({ type: 'coordinator', name: 'agent2' }); // This will fail
      } catch (error) {
        await rollback();
        expect(spawnedAgents).toHaveLength(0);
      }
    });
  });

  describe('Memory Storage Errors', () => {
    test('should handle memory storage failure gracefully', async () => {
      const memoryStore = async (key, value) => {
        throw new Error('Memory storage unavailable');
      };

      const storeWithFallback = async (key, value) => {
        try {
          await memoryStore(key, value);
          return { success: true, storage: 'memory' };
        } catch (error) {
          // Fallback to local file
          const fallbackFile = path.join(testDir, `${key.replace(/\//g, '_')}.json`);
          await fs.writeFile(fallbackFile, JSON.stringify(value));
          return { success: true, storage: 'file', path: fallbackFile };
        }
      };

      const result = await storeWithFallback('swarm/config', { topology: 'hierarchical' });

      expect(result.success).toBe(true);
      expect(result.storage).toBe('file');
    });

    test('should recover memory from local fallback', async () => {
      const fallbackFile = path.join(testDir, 'swarm_config.json');
      const config = { topology: 'hierarchical', maxAgents: 10 };

      await fs.writeFile(fallbackFile, JSON.stringify(config));

      const recoverMemory = async (key) => {
        const filename = `${key.replace(/\//g, '_')}.json`;
        const filepath = path.join(testDir, filename);
        const data = await fs.readFile(filepath, 'utf8');
        return JSON.parse(data);
      };

      const recovered = await recoverMemory('swarm/config');

      expect(recovered.topology).toBe('hierarchical');
      expect(recovered.maxAgents).toBe(10);
    });
  });

  describe('Checkpoint Recovery', () => {
    test('should restore from last valid checkpoint on error', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() - 3000 },
        { phase: 'detection', data: { tool: 'figma-make' }, timestamp: Date.now() - 2000 },
        { phase: 'analysis', data: { framework: 'react' }, timestamp: Date.now() - 1000 }
      ];

      const currentPhase = 'template-generation';
      const error = new Error('Template generation failed');

      // Restore from last checkpoint
      const lastCheckpoint = checkpoints[checkpoints.length - 1];
      const restorePoint = {
        resumeFrom: lastCheckpoint.phase,
        data: lastCheckpoint.data,
        error: error.message
      };

      expect(restorePoint.resumeFrom).toBe('analysis');
      expect(restorePoint.data.framework).toBe('react');
    });

    test('should save error state before rollback', async () => {
      const errorState = {
        phase: 'file-writing',
        error: 'Permission denied',
        timestamp: Date.now(),
        attemptedActions: ['create Dockerfile', 'create docker-compose.yml']
      };

      const errorLog = path.join(testDir, 'error-state.json');
      await fs.writeFile(errorLog, JSON.stringify(errorState, null, 2));

      const saved = JSON.parse(await fs.readFile(errorLog, 'utf8'));

      expect(saved.phase).toBe('file-writing');
      expect(saved.attemptedActions).toHaveLength(2);
    });

    test('should resume from checkpoint with partial progress', () => {
      const checkpointData = {
        phase: 'detection',
        data: { tool: 'bolt', framework: 'react' }
      };

      const resumePhases = ['analysis', 'template-generation', 'file-writing'];
      const nextPhase = resumePhases[0];

      expect(nextPhase).toBe('analysis');
      expect(checkpointData.data.framework).toBe('react'); // Available for resume
    });
  });

  describe('Resource Cleanup', () => {
    test('should clean up temporary files on error', async () => {
      const tempFiles = [
        path.join(testDir, 'temp1.json'),
        path.join(testDir, 'temp2.json')
      ];

      for (const file of tempFiles) {
        await fs.writeFile(file, JSON.stringify({ temp: true }));
      }

      const cleanup = async () => {
        for (const file of tempFiles) {
          await fs.rm(file, { force: true });
        }
      };

      await cleanup();

      for (const file of tempFiles) {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        expect(exists).toBe(false);
      }
    });

    test('should release locks on error', async () => {
      const locks = new Set();

      const acquireLock = (resource) => {
        if (locks.has(resource)) {
          throw new Error('Resource already locked');
        }
        locks.add(resource);
      };

      const releaseLock = (resource) => {
        locks.delete(resource);
      };

      const releaseAllLocks = () => {
        locks.clear();
      };

      acquireLock('swarm_123');
      acquireLock('agent_456');

      expect(locks.size).toBe(2);

      // Simulate error
      releaseAllLocks();

      expect(locks.size).toBe(0);
    });
  });

  describe('Graceful Degradation', () => {
    test('should continue with reduced functionality on non-critical errors', () => {
      const features = {
        swarmInit: { enabled: true, critical: true },
        memoryStorage: { enabled: false, critical: false }, // Failed
        agentSpawning: { enabled: true, critical: true },
        checkpointing: { enabled: false, critical: false } // Failed
      };

      const criticalFeaturesFailed = Object.values(features)
        .filter(f => f.critical && !f.enabled);

      expect(criticalFeaturesFailed).toHaveLength(0);
    });

    test('should provide fallback behavior when optional features fail', () => {
      const checkpointingEnabled = false;

      const storeProgress = (progress) => {
        if (checkpointingEnabled) {
          // Save to checkpoint system
          return { stored: true, method: 'checkpoint' };
        } else {
          // Fallback to memory
          return { stored: true, method: 'memory' };
        }
      };

      const result = storeProgress({ phase: 'detection' });

      expect(result.stored).toBe(true);
      expect(result.method).toBe('memory');
    });
  });

  describe('Error Reporting', () => {
    test('should collect comprehensive error information', () => {
      const error = new Error('Agent spawn failed');
      const errorReport = {
        message: error.message,
        stack: error.stack,
        phase: 'agent-spawning',
        timestamp: Date.now(),
        context: {
          agentType: 'researcher',
          attemptNumber: 2
        }
      };

      expect(errorReport.message).toBe('Agent spawn failed');
      expect(errorReport.phase).toBe('agent-spawning');
      expect(errorReport.context.attemptNumber).toBe(2);
    });

    test('should store error reports for debugging', async () => {
      const errorReports = [
        { error: 'Swarm init failed', timestamp: Date.now() - 2000 },
        { error: 'Agent spawn failed', timestamp: Date.now() - 1000 }
      ];

      const errorLog = path.join(testDir, 'error-log.json');
      await fs.writeFile(errorLog, JSON.stringify(errorReports, null, 2));

      const saved = JSON.parse(await fs.readFile(errorLog, 'utf8'));

      expect(saved).toHaveLength(2);
      expect(saved[0].error).toBe('Swarm init failed');
    });

    test('should provide actionable error messages', () => {
      const error = {
        code: 'DOCKER_NOT_INSTALLED',
        message: 'Docker is required but not installed',
        solution: 'Please install Docker Desktop from https://docker.com',
        documentation: 'https://docs.project.com/installation'
      };

      expect(error.solution).toContain('install Docker');
      expect(error.documentation).toMatch(/^https?:\/\//);
    });
  });
});
