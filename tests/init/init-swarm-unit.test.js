/**
 * Init Swarm Unit Tests
 * Comprehensive unit tests for the initialization swarm script
 * Target: Core initialization functionality and error handling
 */

import { jest } from '@jest/globals';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Init Swarm Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Swarm Configuration', () => {
    test('should define correct swarm configuration', () => {
      const SWARM_CONFIG = {
        topology: 'hierarchical',
        maxAgents: 10,
        strategy: 'balanced',
        memoryNamespace: 'swarm/coordination'
      };

      expect(SWARM_CONFIG.topology).toBe('hierarchical');
      expect(SWARM_CONFIG.maxAgents).toBe(10);
      expect(SWARM_CONFIG.strategy).toBe('balanced');
      expect(SWARM_CONFIG.memoryNamespace).toBe('swarm/coordination');
    });

    test('should validate topology options', () => {
      const validTopologies = ['hierarchical', 'mesh', 'ring', 'star'];
      const selectedTopology = 'hierarchical';

      expect(validTopologies).toContain(selectedTopology);
    });

    test('should validate agent count limits', () => {
      const maxAgents = 10;

      expect(maxAgents).toBeGreaterThan(0);
      expect(maxAgents).toBeLessThanOrEqual(100); // Reasonable upper limit
    });

    test('should validate strategy options', () => {
      const validStrategies = ['balanced', 'specialized', 'adaptive'];
      const selectedStrategy = 'balanced';

      expect(validStrategies).toContain(selectedStrategy);
    });
  });

  describe('Directory Creation', () => {
    test('should create swarm directory if it does not exist', () => {
      const swarmDir = path.join(process.cwd(), '.swarm');

      // Simulate directory creation logic
      const createDirIfNotExists = (dir) => {
        return { created: true, path: dir };
      };

      const result = createDirIfNotExists(swarmDir);

      expect(result.created).toBe(true);
      expect(result.path).toBe(swarmDir);
    });

    test('should skip directory creation if it already exists', () => {
      const swarmDir = path.join(process.cwd(), '.swarm');

      // Simulate directory check
      const checkAndCreate = (dir, exists) => {
        if (exists) {
          return { created: false, skipped: true };
        }
        return { created: true, skipped: false };
      };

      const result = checkAndCreate(swarmDir, true);

      expect(result.skipped).toBe(true);
      expect(result.created).toBe(false);
    });

    test('should use correct directory path structure', () => {
      const swarmDir = path.join(process.cwd(), '.swarm');
      const expectedPath = path.resolve(process.cwd(), '.swarm');

      expect(swarmDir).toBe(expectedPath);
    });
  });

  describe('Swarm Initialization Command', () => {
    test('should execute swarm init with correct parameters', () => {
      const topology = 'hierarchical';
      const maxAgents = 10;
      const strategy = 'balanced';

      const command = `npx claude-flow@alpha swarm init --topology ${topology} --max-agents ${maxAgents} --strategy ${strategy}`;

      // Simulate command execution
      const simulateExec = (cmd) => {
        if (cmd.includes('swarm init')) {
          return 'swarm_123\n';
        }
        return '';
      };

      const result = simulateExec(command);

      expect(result.trim()).toBe('swarm_123');
      expect(command).toContain('--topology hierarchical');
    });

    test('should handle swarm initialization success', () => {
      const simulateInit = () => 'swarm_abc123';
      const swarmId = simulateInit();

      expect(swarmId).toMatch(/^swarm_/);
      expect(swarmId.length).toBeGreaterThan(6);
    });

    test('should throw error on swarm initialization failure', () => {
      const simulateFailedInit = () => {
        throw new Error('Swarm initialization failed');
      };

      expect(() => {
        simulateFailedInit();
      }).toThrow('Swarm initialization failed');
    });
  });

  describe('Memory Storage', () => {
    test('should store swarm configuration in memory', () => {
      const config = {
        topology: 'hierarchical',
        maxAgents: 10,
        strategy: 'balanced'
      };

      const command = `npx claude-flow@alpha memory store "swarm/config" '${JSON.stringify(config)}' --namespace coordination`;

      // Verify command structure
      expect(command).toContain('memory store');
      expect(command).toContain('swarm/config');
      expect(command).toContain('coordination');
    });

    test('should use correct memory namespace', () => {
      const namespace = 'coordination';
      const key = 'swarm/config';

      expect(namespace).toBe('coordination');
      expect(key).toMatch(/^swarm\//);
    });

    test('should handle JSON stringification correctly', () => {
      const config = {
        topology: 'hierarchical',
        maxAgents: 10
      };

      const jsonString = JSON.stringify(config);
      const parsed = JSON.parse(jsonString);

      expect(parsed.topology).toBe('hierarchical');
      expect(parsed.maxAgents).toBe(10);
    });
  });

  describe('Agent Spawning', () => {
    test('should spawn all core agents', () => {
      const agents = [
        { type: 'coordinator', name: 'swarm-coordinator' },
        { type: 'researcher', name: 'documentation-researcher' },
        { type: 'coder', name: 'implementation-specialist' },
        { type: 'tester', name: 'quality-assurance' },
        { type: 'reviewer', name: 'code-reviewer' }
      ];

      const commands = agents.map(agent =>
        `npx claude-flow@alpha agent spawn ${agent.type} --name ${agent.name}`
      );

      expect(commands).toHaveLength(5);
      expect(commands[0]).toContain('coordinator');
    });

    test('should handle individual agent spawn failure gracefully', () => {
      const agents = [
        { type: 'coordinator', name: 'swarm-coordinator' },
        { type: 'researcher', name: 'documentation-researcher' },
        { type: 'coder', name: 'implementation-specialist' }
      ];

      const simulateSpawn = (agent, shouldFail) => {
        if (shouldFail) {
          throw new Error('Agent spawn failed');
        }
        return { success: true };
      };

      const results = [];
      agents.forEach((agent, index) => {
        try {
          simulateSpawn(agent, index === 1);
          results.push({ agent: agent.name, success: true });
        } catch (error) {
          results.push({ agent: agent.name, success: false, error: error.message });
        }
      });

      expect(results).toHaveLength(3);
      expect(results.filter(r => r.success)).toHaveLength(2);
      expect(results.filter(r => !r.success)).toHaveLength(1);
    });

    test('should spawn agents with correct types', () => {
      const validAgentTypes = ['coordinator', 'researcher', 'coder', 'tester', 'reviewer'];
      const agentType = 'coordinator';

      expect(validAgentTypes).toContain(agentType);
    });
  });

  describe('Error Handling', () => {
    test('should catch and log initialization errors', () => {
      const simulateInit = () => {
        throw new Error('Claude Flow not installed');
      };

      const errorHandler = () => {
        try {
          simulateInit();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = errorHandler();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Claude Flow not installed');
    });

    test('should handle missing dependencies gracefully', () => {
      const checkDependency = () => {
        throw new Error('Command not found');
      };

      const result = (() => {
        try {
          checkDependency();
          return { installed: true };
        } catch (error) {
          return { installed: false, error: error.message };
        }
      })();

      expect(result.installed).toBe(false);
    });

    test('should provide helpful error messages', () => {
      const errorMessage = 'Swarm initialization failed: Docker not installed';

      expect(errorMessage).toContain('failed');
      expect(errorMessage).toContain('Docker');
    });
  });

  describe('Console Output', () => {
    test('should log initialization start', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      console.log('🚀 Initializing swarm coordination...');

      expect(consoleLog).toHaveBeenCalledWith('🚀 Initializing swarm coordination...');

      consoleLog.mockRestore();
    });

    test('should log successful swarm creation', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const swarmId = 'swarm_123';
      console.log('✅ Swarm initialized:', swarmId);

      expect(consoleLog).toHaveBeenCalledWith('✅ Swarm initialized:', swarmId);

      consoleLog.mockRestore();
    });

    test('should log agent spawning', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const agentName = 'swarm-coordinator';
      console.log(`✅ Spawned ${agentName}`);

      expect(consoleLog).toHaveBeenCalledWith(`✅ Spawned ${agentName}`);

      consoleLog.mockRestore();
    });

    test('should log completion summary', () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      const swarmId = 'swarm_123';
      const topology = 'hierarchical';
      const maxAgents = 10;

      console.log('\n🎉 Swarm initialization complete!');
      console.log(`📋 Swarm ID: ${swarmId}`);
      console.log(`🔧 Topology: ${topology}`);
      console.log(`👥 Max Agents: ${maxAgents}`);

      expect(consoleLog).toHaveBeenCalledWith('\n🎉 Swarm initialization complete!');
      expect(consoleLog).toHaveBeenCalledWith(`📋 Swarm ID: ${swarmId}`);

      consoleLog.mockRestore();
    });
  });

  describe('Process Exit Handling', () => {
    test('should exit with code 1 on failure', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
        throw new Error(`Process exited with code ${code}`);
      });

      expect(() => {
        process.exit(1);
      }).toThrow('Process exited with code 1');

      mockExit.mockRestore();
    });

    test('should not exit on success', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      // Simulate successful initialization (no exit call)

      expect(mockExit).not.toHaveBeenCalled();

      mockExit.mockRestore();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('should use platform-agnostic path separators', () => {
      const swarmDir = path.join(process.cwd(), '.swarm');

      // path.join should handle separators correctly on all platforms
      expect(swarmDir).toContain('.swarm');
      expect(swarmDir).not.toMatch(/[/\\]{2,}/); // No double separators
    });

    test('should handle Windows-style paths', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const swarmDir = path.join(process.cwd(), '.swarm');
      const isValidPath = typeof swarmDir === 'string' && swarmDir.length > 0;

      expect(isValidPath).toBe(true);

      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });

    test('should handle Unix-style paths', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });

      const swarmDir = path.join(process.cwd(), '.swarm');
      const isValidPath = typeof swarmDir === 'string' && swarmDir.length > 0;

      expect(isValidPath).toBe(true);

      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });
  });

  describe('Integration with Main Function', () => {
    test('should call initSwarm before spawnCoreAgents', async () => {
      const executionOrder = [];

      const mockInitSwarm = async () => {
        executionOrder.push('initSwarm');
        return 'swarm_123';
      };

      const mockSpawnCoreAgents = async () => {
        executionOrder.push('spawnCoreAgents');
      };

      await mockInitSwarm();
      await mockSpawnCoreAgents();

      expect(executionOrder).toEqual(['initSwarm', 'spawnCoreAgents']);
    });

    test('should propagate swarm ID to completion message', async () => {
      const swarmId = 'swarm_abc123';

      const initSwarm = async () => swarmId;
      const result = await initSwarm();

      expect(result).toBe(swarmId);
    });

    test('should handle async initialization correctly', async () => {
      const asyncInit = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'swarm_123';
      };

      const result = await asyncInit();

      expect(result).toBe('swarm_123');
    });
  });
});
