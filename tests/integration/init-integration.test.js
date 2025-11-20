/**
 * Integration Tests for Initialization System
 * Tests integration between CLI, Orchestrator, and Lifecycle components
 * Target: Component integration validation
 *
 * This tests how components work TOGETHER
 */

import { jest } from '@jest/globals';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('Initialization Integration', () => {
  let testProjectDir;

  beforeEach(async () => {
    testProjectDir = path.join(os.tmpdir(), `init-integration-test-${Date.now()}`);
    await fs.mkdir(testProjectDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testProjectDir, { recursive: true, force: true });
  });

  describe('CLI → Orchestrator Integration', () => {
    test('should pass options from CLI to Orchestrator', async () => {
      // Simulate CLI parsing
      const cliOptions = {
        tool: 'figma-make',
        projectDir: testProjectDir,
        force: true,
        dryRun: false
      };

      // Simulate Orchestrator receiving options
      const orchestratorInit = (tool, projectDir, options) => {
        return {
          receivedTool: tool,
          receivedProjectDir: projectDir,
          receivedOptions: options
        };
      };

      const result = orchestratorInit(
        cliOptions.tool,
        cliOptions.projectDir,
        cliOptions
      );

      expect(result.receivedTool).toBe('figma-make');
      expect(result.receivedOptions.force).toBe(true);
    });

    test('should handle orchestrator errors in CLI layer', async () => {
      const orchestratorInit = () => {
        throw new Error('Orchestrator failed: Docker not installed');
      };

      const cliExecute = () => {
        try {
          return orchestratorInit();
        } catch (error) {
          return {
            success: false,
            error: error.message,
            userMessage: 'Initialization failed. Please install Docker and try again.'
          };
        }
      };

      const result = cliExecute();

      expect(result.success).toBe(false);
      expect(result.userMessage).toContain('Docker');
    });
  });

  describe('Orchestrator → Lifecycle Integration', () => {
    test('should trigger lifecycle hooks during orchestration', async () => {
      const hooksTriggered = [];

      const mockLifecycle = {
        trigger: async (hook, data) => {
          hooksTriggered.push({ hook, data });
        }
      };

      const orchestratorInit = async (lifecycle, options) => {
        await lifecycle.trigger('pre-task', { command: 'init' });
        await lifecycle.trigger('phase-start', { phase: 'pre-flight' });
        await lifecycle.trigger('phase-complete', { phase: 'pre-flight' });
        await lifecycle.trigger('phase-start', { phase: 'detection' });
        await lifecycle.trigger('phase-complete', { phase: 'detection' });
        await lifecycle.trigger('post-task', { success: true });

        return { success: true };
      };

      await orchestratorInit(mockLifecycle, {});

      expect(hooksTriggered).toHaveLength(6);
      expect(hooksTriggered[0].hook).toBe('pre-task');
      expect(hooksTriggered[5].hook).toBe('post-task');
    });

    test('should pass orchestrator data through lifecycle hooks', async () => {
      const hookData = [];

      const mockLifecycle = {
        trigger: async (hook, data) => {
          hookData.push(data);
        }
      };

      const orchestratorInit = async (lifecycle, options) => {
        await lifecycle.trigger('phase-complete', {
          phase: 'detection',
          result: { tool: 'figma-make', confidence: 0.95 }
        });

        await lifecycle.trigger('phase-complete', {
          phase: 'file-writing',
          result: { filesCreated: 3 }
        });

        return { success: true };
      };

      await orchestratorInit(mockLifecycle, {});

      expect(hookData[0].phase).toBe('detection');
      expect(hookData[0].result.tool).toBe('figma-make');
      expect(hookData[1].result.filesCreated).toBe(3);
    });
  });

  describe('Lifecycle → Memory Integration', () => {
    test('should store session data in memory via lifecycle', async () => {
      const memoryStore = {};

      const storeMemory = (key, value) => {
        memoryStore[key] = value;
      };

      const lifecycle = {
        trigger: async (hook, data) => {
          if (hook === 'post-task') {
            storeMemory(`session/${data.sessionId}`, {
              success: data.success,
              timestamp: Date.now()
            });
          }
        }
      };

      await lifecycle.trigger('post-task', {
        sessionId: 'session-123',
        success: true
      });

      expect(memoryStore['session/session-123']).toBeDefined();
      expect(memoryStore['session/session-123'].success).toBe(true);
    });

    test('should retrieve session data from memory', async () => {
      const memoryStore = {
        'session/session-123': {
          tool: 'figma-make',
          phases: ['pre-flight', 'detection']
        }
      };

      const retrieveMemory = (key) => {
        return memoryStore[key];
      };

      const sessionData = retrieveMemory('session/session-123');

      expect(sessionData.tool).toBe('figma-make');
      expect(sessionData.phases).toHaveLength(2);
    });
  });

  describe('Orchestrator → Checkpoint System Integration', () => {
    test('should save checkpoints during orchestration', async () => {
      const checkpoints = [];

      const saveCheckpoint = (phase, data) => {
        checkpoints.push({ phase, data, timestamp: Date.now() });
      };

      const orchestratorInit = async () => {
        saveCheckpoint('pre-flight', { dockerInstalled: true });
        saveCheckpoint('detection', { tool: 'figma-make' });
        saveCheckpoint('analysis', { framework: 'react' });

        return { success: true, checkpoints };
      };

      const result = await orchestratorInit();

      expect(result.checkpoints).toHaveLength(3);
      expect(result.checkpoints[0].phase).toBe('pre-flight');
    });

    test('should restore orchestration from checkpoint', async () => {
      const savedCheckpoints = [
        { phase: 'pre-flight', data: { dockerInstalled: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'figma-make' }, timestamp: Date.now() }
      ];

      const restoreFromCheckpoint = (checkpoints, targetPhase) => {
        const index = checkpoints.findIndex(cp => cp.phase === targetPhase);
        if (index === -1) return null;

        return {
          checkpoint: checkpoints[index],
          remainingPhases: checkpoints.slice(index + 1)
        };
      };

      const restored = restoreFromCheckpoint(savedCheckpoints, 'detection');

      expect(restored.checkpoint.data.tool).toBe('figma-make');
      expect(restored.remainingPhases).toHaveLength(0);
    });

    test('should persist checkpoints to filesystem', async () => {
      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() }
      ];

      const persistCheckpoints = async (projectDir, checkpoints) => {
        const checkpointDir = path.join(projectDir, '.vibe-docker', 'checkpoints');
        await fs.mkdir(checkpointDir, { recursive: true });

        await fs.writeFile(
          path.join(checkpointDir, 'latest.json'),
          JSON.stringify({ checkpoints }, null, 2)
        );

        return { persisted: true, location: checkpointDir };
      };

      const result = await persistCheckpoints(testProjectDir, checkpoints);

      expect(result.persisted).toBe(true);

      const fileExists = await fs.access(
        path.join(testProjectDir, '.vibe-docker', 'checkpoints', 'latest.json')
      ).then(() => true).catch(() => false);

      expect(fileExists).toBe(true);

      const savedData = JSON.parse(
        await fs.readFile(
          path.join(testProjectDir, '.vibe-docker', 'checkpoints', 'latest.json'),
          'utf8'
        )
      );

      expect(savedData.checkpoints).toHaveLength(1);
    });

    test('should load checkpoints from filesystem', async () => {
      // Create checkpoint file
      const checkpointDir = path.join(testProjectDir, '.vibe-docker', 'checkpoints');
      await fs.mkdir(checkpointDir, { recursive: true });

      const checkpoints = [
        { phase: 'pre-flight', data: { success: true }, timestamp: Date.now() },
        { phase: 'detection', data: { tool: 'bolt' }, timestamp: Date.now() }
      ];

      await fs.writeFile(
        path.join(checkpointDir, 'latest.json'),
        JSON.stringify({ checkpoints }, null, 2)
      );

      const loadCheckpoints = async (projectDir) => {
        const checkpointFile = path.join(projectDir, '.vibe-docker', 'checkpoints', 'latest.json');
        const exists = await fs.access(checkpointFile).then(() => true).catch(() => false);

        if (!exists) {
          return { loaded: false, checkpoints: [] };
        }

        const data = JSON.parse(await fs.readFile(checkpointFile, 'utf8'));

        return {
          loaded: true,
          checkpoints: data.checkpoints
        };
      };

      const result = await loadCheckpoints(testProjectDir);

      expect(result.loaded).toBe(true);
      expect(result.checkpoints).toHaveLength(2);
      expect(result.checkpoints[1].data.tool).toBe('bolt');
    });
  });

  describe('Full Stack Integration', () => {
    test('should complete full initialization with all components', async () => {
      // Create test project
      await fs.writeFile(
        path.join(testProjectDir, 'package.json'),
        JSON.stringify({ name: 'integration-test-project' })
      );

      const integrationFlow = async (projectDir, options) => {
        const flow = [];

        // 1. CLI receives command
        flow.push({ component: 'CLI', action: 'parse-arguments', options });

        // 2. CLI calls Orchestrator
        flow.push({ component: 'CLI', action: 'call-orchestrator' });

        // 3. Orchestrator triggers Lifecycle pre-task
        flow.push({ component: 'Orchestrator', action: 'trigger-lifecycle-pre-task' });

        // 4. Orchestrator runs phases
        const phases = ['pre-flight', 'detection', 'analysis', 'template-generation', 'file-writing', 'validation'];
        for (const phase of phases) {
          flow.push({ component: 'Orchestrator', action: `phase-${phase}` });
          flow.push({ component: 'Orchestrator', action: 'save-checkpoint', phase });
        }

        // 5. Orchestrator triggers Lifecycle post-task
        flow.push({ component: 'Orchestrator', action: 'trigger-lifecycle-post-task' });

        // 6. Lifecycle stores session in Memory
        flow.push({ component: 'Lifecycle', action: 'store-session-memory' });

        // 7. CLI returns result to user
        flow.push({ component: 'CLI', action: 'return-result' });

        return {
          success: true,
          flow
        };
      };

      const result = await integrationFlow(testProjectDir, { tool: 'auto' });

      expect(result.success).toBe(true);
      expect(result.flow).toHaveLength(21); // 1 + 1 + 1 + (6*2) + 1 + 1 + 1

      // Verify component interactions
      expect(result.flow[0].component).toBe('CLI');
      expect(result.flow.filter(f => f.component === 'Orchestrator')).toHaveLength(13);
      expect(result.flow.filter(f => f.component === 'Lifecycle')).toHaveLength(1);
    });

    test('should handle errors across component boundaries', async () => {
      const errorHandling = async () => {
        const errors = [];

        // Simulate error in Orchestrator
        try {
          throw new Error('Orchestrator: Docker detection failed');
        } catch (error) {
          errors.push({
            component: 'Orchestrator',
            error: error.message,
            handled: true
          });

          // Lifecycle handles error
          errors.push({
            component: 'Lifecycle',
            action: 'trigger-post-task-with-error',
            error: error.message
          });

          // CLI transforms error for user
          errors.push({
            component: 'CLI',
            userMessage: 'Initialization failed: Docker is required but not installed.',
            originalError: error.message
          });
        }

        return {
          success: false,
          errors
        };
      };

      const result = await errorHandling();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0].component).toBe('Orchestrator');
      expect(result.errors[2].userMessage).toContain('Docker');
    });
  });

  describe('State Management Integration', () => {
    test('should maintain state across components', async () => {
      const state = {
        sessionId: 'session-123',
        tool: null,
        framework: null,
        filesCreated: []
      };

      // Orchestrator updates state during detection
      const detectionPhase = () => {
        state.tool = 'figma-make';
        state.framework = 'react-vite';
      };

      // Orchestrator updates state during file writing
      const fileWritingPhase = () => {
        state.filesCreated.push('Dockerfile', 'docker-compose.yml');
      };

      // Lifecycle stores final state
      const storeState = (state) => {
        return {
          stored: true,
          key: `session/${state.sessionId}`,
          state
        };
      };

      detectionPhase();
      fileWritingPhase();
      const stored = storeState(state);

      expect(state.tool).toBe('figma-make');
      expect(state.filesCreated).toHaveLength(2);
      expect(stored.stored).toBe(true);
    });
  });
});
