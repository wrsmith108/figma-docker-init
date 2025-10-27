/**
 * Platform-Specific Test Helpers
 * Utilities for cross-platform testing
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

/**
 * Get platform information
 */
function getPlatformInfo() {
  return {
    name: process.platform,
    arch: process.arch,
    version: os.release(),
    type: os.type(),
    hostname: os.hostname(),
    cpus: os.cpus().length,
    memory: os.totalmem(),
    freeMemory: os.freemem()
  };
}

/**
 * Check if running in CI environment
 */
function isCI() {
  return !!(
    process.env.CI ||
    process.env.CONTINUOUS_INTEGRATION ||
    process.env.BUILD_NUMBER ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.CIRCLECI ||
    process.env.TRAVIS ||
    process.env.JENKINS_URL
  );
}

/**
 * Create a temporary test project directory
 */
function createTestProject() {
  const tmpDir = os.tmpdir();
  const testDir = path.join(tmpDir, `figma-docker-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);

  fs.mkdirSync(testDir, { recursive: true });

  return testDir;
}

/**
 * Clean up test project directory
 */
function cleanupTestProject(testDir) {
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup test directory: ${error.message}`);
    }
  }
}

/**
 * Measure npm install time
 */
async function measureInstallTime(projectDir) {
  const startTime = performance.now();

  try {
    execSync('npm install', {
      cwd: projectDir,
      stdio: 'pipe',
      timeout: 60000
    });
  } catch (error) {
    console.error(`Install failed: ${error.message}`);
    throw error;
  }

  const endTime = performance.now();
  return endTime - startTime;
}

/**
 * Measure template processing time
 */
async function measureTemplateProcessing(projectDir) {
  const startTime = performance.now();

  try {
    // Simulate template processing
    const templateDir = path.join(projectDir, 'templates');
    if (fs.existsSync(templateDir)) {
      const files = fs.readdirSync(templateDir);

      files.forEach(file => {
        const filePath = path.join(templateDir, file);
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf8');
          // Process content (parsing, validation, etc.)
          JSON.parse(JSON.stringify(content));
        }
      });
    }
  } catch (error) {
    console.error(`Template processing failed: ${error.message}`);
  }

  const endTime = performance.now();
  return endTime - startTime;
}

/**
 * Check if a command exists in PATH
 */
function commandExists(command) {
  try {
    const checkCommand = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${checkCommand} ${command}`, { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get npm version
 */
function getNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    return version;
  } catch (error) {
    return null;
  }
}

/**
 * Get Node.js version
 */
function getNodeVersion() {
  return process.version;
}

/**
 * Check if Docker is available
 */
function isDockerAvailable() {
  return commandExists('docker');
}

/**
 * Check if Git is available
 */
function isGitAvailable() {
  return commandExists('git');
}

/**
 * Get file permissions (Unix-style)
 */
function getFilePermissions(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return {
      mode: stats.mode,
      isExecutable: !!(stats.mode & fs.constants.S_IXUSR),
      isReadable: !!(stats.mode & fs.constants.S_IRUSR),
      isWritable: !!(stats.mode & fs.constants.S_IWUSR)
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set file executable (Unix-like systems)
 */
function setFileExecutable(filePath) {
  if (process.platform === 'win32') {
    // Windows doesn't use Unix permissions
    return;
  }

  try {
    fs.chmodSync(filePath, 0o755);
  } catch (error) {
    console.warn(`Failed to set executable: ${error.message}`);
  }
}

/**
 * Normalize path for current platform
 */
function normalizePath(inputPath) {
  return path.normalize(inputPath);
}

/**
 * Convert to Unix-style path (for cross-platform comparison)
 */
function toUnixPath(inputPath) {
  return inputPath.split(path.sep).join('/');
}

/**
 * Convert to Windows-style path
 */
function toWindowsPath(inputPath) {
  return inputPath.split('/').join('\\');
}

/**
 * Get line ending for current platform
 */
function getLineEnding() {
  return process.platform === 'win32' ? '\r\n' : '\n';
}

/**
 * Normalize line endings in text
 */
function normalizeLineEndings(text, targetEnding = null) {
  const ending = targetEnding || getLineEnding();
  return text.replace(/\r?\n/g, ending);
}

/**
 * Check if path is case-sensitive
 */
function isPathCaseSensitive() {
  const tmpFile1 = path.join(os.tmpdir(), 'TestCaseSensitive.txt');
  const tmpFile2 = path.join(os.tmpdir(), 'testcasesensitive.txt');

  try {
    fs.writeFileSync(tmpFile1, 'test');
    const exists = fs.existsSync(tmpFile2);
    fs.unlinkSync(tmpFile1);

    // If both files "exist", filesystem is case-insensitive
    return !exists;
  } catch (error) {
    return true; // Default to case-sensitive
  }
}

/**
 * Get environment variable with platform-specific handling
 */
function getEnvVar(name, defaultValue = null) {
  return process.env[name] || defaultValue;
}

/**
 * Set environment variable with platform-specific handling
 */
function setEnvVar(name, value) {
  process.env[name] = value;
}

/**
 * Get temp directory for current platform
 */
function getTempDir() {
  return os.tmpdir();
}

/**
 * Get home directory for current user
 */
function getHomeDir() {
  return os.homedir();
}

/**
 * Check available disk space
 */
function getAvailableDiskSpace(dirPath = '/') {
  // Note: This is a simplified version
  // In production, you might use a library like 'diskusage'
  try {
    if (process.platform === 'win32') {
      // Windows
      const output = execSync(`fsutil volume diskfree ${dirPath}`, { encoding: 'utf8' });
      const match = output.match(/Total # of free bytes\s+:\s+(\d+)/);
      return match ? parseInt(match[1], 10) : null;
    } else {
      // Unix-like systems
      const output = execSync(`df -k "${dirPath}" | tail -1 | awk '{print $4}'`, { encoding: 'utf8' });
      return parseInt(output.trim(), 10) * 1024;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Execute command with timeout
 */
function execWithTimeout(command, options = {}) {
  const timeout = options.timeout || 30000;
  const cwd = options.cwd || process.cwd();

  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout
    });
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

/**
 * Check if running with elevated privileges
 */
function isElevated() {
  if (process.platform === 'win32') {
    // Windows: Check if running as administrator
    try {
      execSync('net session', { stdio: 'pipe' });
      return true;
    } catch (error) {
      return false;
    }
  } else {
    // Unix-like: Check if running as root
    return process.getuid && process.getuid() === 0;
  }
}

/**
 * Get CPU architecture
 */
function getCpuArch() {
  return {
    arch: process.arch,
    platform: process.platform,
    endianness: os.endianness(),
    cpus: os.cpus()
  };
}

/**
 * Get system memory info
 */
function getMemoryInfo() {
  return {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem(),
    percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
  };
}

module.exports = {
  getPlatformInfo,
  isCI,
  createTestProject,
  cleanupTestProject,
  measureInstallTime,
  measureTemplateProcessing,
  commandExists,
  getNpmVersion,
  getNodeVersion,
  isDockerAvailable,
  isGitAvailable,
  getFilePermissions,
  setFileExecutable,
  normalizePath,
  toUnixPath,
  toWindowsPath,
  getLineEnding,
  normalizeLineEndings,
  isPathCaseSensitive,
  getEnvVar,
  setEnvVar,
  getTempDir,
  getHomeDir,
  getAvailableDiskSpace,
  execWithTimeout,
  isElevated,
  getCpuArch,
  getMemoryInfo
};
