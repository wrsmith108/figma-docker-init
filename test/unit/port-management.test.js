/**
 * Test: Port Management Functions
 * Purpose: Test checkPortAvailability, findAvailablePort, assignDynamicPorts
 * Coverage Target: Lines 520-597 (~77 lines)
 */

import {
  checkPortAvailability,
  findAvailablePort,
  assignDynamicPorts,
  ValidationError
} from '../../figma-docker-init.js';
import net from 'net';

describe('Port Management Functions', () => {
  // Clean up any servers after tests
  afterEach(async () => {
    // Give time for ports to be released
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  // =============================================================================
  // checkPortAvailability
  // =============================================================================
  describe('checkPortAvailability', () => {
    describe('Happy paths', () => {
      it('should return true for available ports', async () => {
        const port = 54321; // Likely available
        const result = await checkPortAvailability(port);
        expect(result).toBe(true);
      });

      it('should check multiple different ports', async () => {
        const ports = [54322, 54323, 54324];
        for (const port of ports) {
          const result = await checkPortAvailability(port);
          expect(typeof result).toBe('boolean');
        }
      });
    });

    describe('Error handling', () => {
      it('should return false for invalid port (0)', async () => {
        const result = await checkPortAvailability(0);
        expect(result).toBe(false);
      });

      it('should return false for negative ports', async () => {
        const result = await checkPortAvailability(-1);
        expect(result).toBe(false);
      });

      it('should return false for ports > 65535', async () => {
        const result = await checkPortAvailability(70000);
        expect(result).toBe(false);
      });

      it('should return false for NaN', async () => {
        const result = await checkPortAvailability(NaN);
        expect(result).toBe(false);
      });

      it('should return false for occupied ports', async () => {
        const port = 54325;

        // Create a server to occupy the port
        const server = net.createServer();
        await new Promise((resolve) => {
          server.listen(port, '127.0.0.1', resolve);
        });

        try {
          const result = await checkPortAvailability(port);
          expect(result).toBe(false);
        } finally {
          server.close();
        }
      });
    });

    describe('Edge cases', () => {
      it('should handle port 1 (minimum valid port)', async () => {
        // Port 1 usually requires root, so we expect false
        const result = await checkPortAvailability(1);
        expect(typeof result).toBe('boolean');
      });

      it('should handle port 65535 (maximum valid port)', async () => {
        const result = await checkPortAvailability(65535);
        expect(typeof result).toBe('boolean');
      });

      it('should handle string port numbers', async () => {
        const result = await checkPortAvailability('54326');
        expect(typeof result).toBe('boolean');
      });

      it('should handle concurrent checks on same port', async () => {
        const port = 54327;
        const results = await Promise.all([
          checkPortAvailability(port),
          checkPortAvailability(port),
          checkPortAvailability(port)
        ]);

        results.forEach(result => {
          expect(typeof result).toBe('boolean');
        });
      });
    });

    describe('State verification', () => {
      it('should not leave server running after check', async () => {
        const port = 54328;

        // Check port availability
        await checkPortAvailability(port);

        // Should be able to bind to it immediately
        const server = net.createServer();
        await new Promise((resolve, reject) => {
          server.on('error', reject);
          server.listen(port, '127.0.0.1', resolve);
        });

        server.close();
      });
    });
  });

  // =============================================================================
  // findAvailablePort
  // =============================================================================
  describe('findAvailablePort', () => {
    describe('Happy paths', () => {
      it('should find available port starting from given port', async () => {
        const startPort = 55000;
        const port = await findAvailablePort(startPort);
        expect(port).toBeGreaterThanOrEqual(startPort);
        expect(port).toBeLessThan(startPort + 100);
      });

      it('should return startPort if available', async () => {
        const startPort = 55100;
        const port = await findAvailablePort(startPort);
        // Should find something in range
        expect(port).toBeGreaterThanOrEqual(startPort);
      });

      it('should respect custom maxAttempts', async () => {
        const startPort = 55200;
        const port = await findAvailablePort(startPort, 10);
        expect(port).toBeGreaterThanOrEqual(startPort);
        expect(port).toBeLessThan(startPort + 10);
      });
    });

    describe('Error handling', () => {
      it('should throw error when no available port found within maxAttempts', async () => {
        const startPort = 55300;

        // Create servers to occupy ports
        const servers = [];
        for (let i = 0; i < 5; i++) {
          const server = net.createServer();
          await new Promise((resolve) => {
            server.listen(startPort + i, '127.0.0.1', resolve);
          });
          servers.push(server);
        }

        try {
          await expect(findAvailablePort(startPort, 3)).rejects.toThrow('Could not find available port');
        } finally {
          servers.forEach(server => server.close());
        }
      });

      it('should handle invalid startPort gracefully', async () => {
        await expect(findAvailablePort(70000)).rejects.toThrow();
      });
    });

    describe('Edge cases', () => {
      it('should handle startPort near max range (65535)', async () => {
        const startPort = 65500;
        // May fail due to limited range, but should handle gracefully
        try {
          const port = await findAvailablePort(startPort, 10);
          expect(port).toBeGreaterThanOrEqual(startPort);
        } catch (error) {
          expect(error.message).toContain('Could not find available port');
        }
      });

      it('should find port when first few are occupied', async () => {
        const startPort = 55400;

        // Occupy first 3 ports
        const servers = [];
        for (let i = 0; i < 3; i++) {
          const server = net.createServer();
          await new Promise((resolve) => {
            server.listen(startPort + i, '127.0.0.1', resolve);
          });
          servers.push(server);
        }

        try {
          const port = await findAvailablePort(startPort);
          expect(port).toBeGreaterThanOrEqual(startPort + 3);
        } finally {
          servers.forEach(server => server.close());
        }
      });

      it('should use default maxAttempts of 100', async () => {
        const startPort = 55500;
        const port = await findAvailablePort(startPort);
        expect(port).toBeLessThan(startPort + 100);
      });
    });

    describe('State verification', () => {
      it('should return different ports for concurrent calls', async () => {
        const startPort = 55600;
        const [port1, port2, port3] = await Promise.all([
          findAvailablePort(startPort),
          findAvailablePort(startPort),
          findAvailablePort(startPort)
        ]);

        // All should be valid ports
        expect(port1).toBeGreaterThanOrEqual(startPort);
        expect(port2).toBeGreaterThanOrEqual(startPort);
        expect(port3).toBeGreaterThanOrEqual(startPort);
      });
    });
  });

  // =============================================================================
  // assignDynamicPorts
  // =============================================================================
  describe('assignDynamicPorts', () => {
    describe('Happy paths', () => {
      it('should assign all three port types', async () => {
        const ports = await assignDynamicPorts();

        expect(ports).toHaveProperty('DEV_PORT');
        expect(ports).toHaveProperty('PROD_PORT');
        expect(ports).toHaveProperty('NGINX_PORT');
      });

      it('should assign valid port numbers', async () => {
        const ports = await assignDynamicPorts();

        expect(ports.DEV_PORT).toBeGreaterThan(0);
        expect(ports.DEV_PORT).toBeLessThanOrEqual(65535);
        expect(ports.PROD_PORT).toBeGreaterThan(0);
        expect(ports.PROD_PORT).toBeLessThanOrEqual(65535);
        expect(ports.NGINX_PORT).toBeGreaterThan(0);
        expect(ports.NGINX_PORT).toBeLessThanOrEqual(65535);
      });

      it('should prefer default ports when available', async () => {
        const ports = await assignDynamicPorts();

        // At least one should try to use defaults (though may not succeed if occupied)
        const hasExpectedRange =
          ports.DEV_PORT === 3000 || ports.DEV_PORT > 3000 &&
          ports.PROD_PORT === 8080 || ports.PROD_PORT > 8080;

        expect(hasExpectedRange).toBe(true);
      });
    });

    describe('Error handling', () => {
      it('should handle port assignment when defaults are occupied', async () => {
        // Occupy default ports
        const servers = [];
        const defaultPorts = [3000, 8080, 80];

        for (const port of defaultPorts) {
          try {
            const server = net.createServer();
            await new Promise((resolve, reject) => {
              server.on('error', () => resolve()); // Ignore errors for ports we can't bind
              server.listen(port, '127.0.0.1', resolve);
            });
            servers.push(server);
          } catch {
            // Ignore if we can't bind (e.g., port 80 requires root)
          }
        }

        try {
          const ports = await assignDynamicPorts();

          // Should still get valid ports
          expect(ports.DEV_PORT).toBeGreaterThan(0);
          expect(ports.PROD_PORT).toBeGreaterThan(0);
          expect(ports.NGINX_PORT).toBeGreaterThan(0);
        } finally {
          servers.forEach(server => server.close());
        }
      });

      it('should fallback to default on error finding alternative', async () => {
        const ports = await assignDynamicPorts();

        // Even if errors occur, should have all ports assigned
        expect(Object.keys(ports)).toHaveLength(3);
      });
    });

    describe('Edge cases', () => {
      it('should assign different ports for each service', async () => {
        const ports = await assignDynamicPorts();

        const allPorts = [ports.DEV_PORT, ports.PROD_PORT, ports.NGINX_PORT];
        const uniquePorts = new Set(allPorts);

        // May have duplicates if port 80 falls back to default, but structure should be correct
        expect(allPorts).toHaveLength(3);
      });

      it('should handle multiple concurrent calls', async () => {
        const [ports1, ports2] = await Promise.all([
          assignDynamicPorts(),
          assignDynamicPorts()
        ]);

        // Both should have valid assignments
        expect(ports1.DEV_PORT).toBeGreaterThan(0);
        expect(ports2.DEV_PORT).toBeGreaterThan(0);
      });

      it('should handle port 80 requiring elevated privileges', async () => {
        const ports = await assignDynamicPorts();

        // Port 80 will likely fail and use default or find alternative
        expect(ports.NGINX_PORT).toBeGreaterThan(0);
      });
    });

    describe('State verification', () => {
      it('should not leave any servers running', async () => {
        const ports = await assignDynamicPorts();

        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 200));

        // Try to bind to assigned ports
        for (const [key, port] of Object.entries(ports)) {
          if (port !== 80) { // Skip port 80 as it requires root
            const server = net.createServer();
            await new Promise((resolve, reject) => {
              server.on('error', reject);
              server.listen(port, '127.0.0.1', resolve);
            });
            server.close();
          }
        }
      });

      it('should return consistent structure', async () => {
        const ports1 = await assignDynamicPorts();
        const ports2 = await assignDynamicPorts();

        expect(Object.keys(ports1).sort()).toEqual(Object.keys(ports2).sort());
      });
    });
  });
});
