# Bootstrap and Setup Tool Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for transforming `vibe-to-docker` from a configuration management tool into a **full bootstrap and setup tool** designed for first-time users from vibe-coding platforms (Figma Make, Lovable, v0.dev, etc.).

### Core Transformation

**Previous Scope:** Configuration file generator that assumes Docker is already installed
**New Scope:** Complete bootstrap tool that:
- ✅ Verifies Docker installation and guides setup
- ✅ Automatically detects project type and framework
- ✅ Works via `npx vibe-to-docker` on fresh repositories
- ✅ Handles npm package installation
- ✅ Supports multiple platforms: macOS, Windows, Linux, GitHub Codespaces, Gitpod
- ✅ Adapts to cloud environments with Docker-in-Docker
- ✅ Provides interactive fallbacks when auto-detection fails

### Target User Journey

**Scenario 1: Local Development (Fresh Clone)**
```bash
# User exports project from vibe-coding tool to GitHub
# Clone repository to local machine
git clone https://github.com/user/project.git
cd project

# Run bootstrap tool
npx vibe-to-docker

# Tool automatically:
# 1. Checks if Docker is installed → Guides installation if missing
# 2. Detects project type (React/Vue/Angular/Static)
# 3. Runs npm install if package.json exists
# 4. Generates appropriate Docker configuration
# 5. Provides next steps for running the project
```

**Scenario 2: GitHub Codespaces**
```bash
# User exports project from Figma Make to GitHub
# Opens repository in GitHub Codespaces
# Codespaces automatically runs postCreateCommand

# In .devcontainer/devcontainer.json:
{
  "postCreateCommand": "npx vibe-to-docker"
}

# Tool automatically:
# 1. Detects Codespaces environment
# 2. Configures Docker-in-Docker
# 3. Detects project framework
# 4. Runs npm install
# 5. Generates devcontainer-optimized Docker configs
```

**Scenario 3: Gitpod**
```yaml
# .gitpod.yml
tasks:
  - init: npx vibe-to-docker && npm install
    command: npm run dev

# Tool handles Gitpod-specific Docker-in-Docker setup
```

## Architectural Design

### Module Overview

The tool is organized into five core modules that work together to provide a seamless bootstrap experience:

```
┌─────────────────────────────────────────────────────────────┐
│                    Bootstrap Entry Point                     │
│                  (npx vibe-to-docker)                     │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────────────┐
│   Docker    │  │     Environment     │
│ Management  │  │     Adaptation      │
└──────┬──────┘  └──────┬──────────────┘
       │                │
       └───────┬────────┘
               │
        ┌──────▼───────────┐
        │     Project      │
        │    Detection     │
        └──────┬───────────┘
               │
        ┌──────▼───────────┐
        │    Bootstrap     │
        │    Workflow      │
        └──────┬───────────┘
               │
        ┌──────▼───────────┐
        │  User Experience │
        │      Flow        │
        └──────────────────┘
```

### 1. Docker Management Module

**Purpose:** Detect Docker installation status and provide platform-specific installation guidance.

**Key Responsibilities:**
- Check if Docker is installed and accessible
- Detect platform (macOS, Windows, Linux, Codespaces, Gitpod)
- Provide installation instructions specific to the platform
- Verify Docker version compatibility
- Handle cloud environment Docker configurations

**Implementation Design:**

```javascript
// lib/docker-manager.js

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Docker Management Module
 * Handles Docker installation detection and guidance
 */
class DockerManager {
  constructor() {
    this.platform = this.detectPlatform();
    this.isCloudEnvironment = this.detectCloudEnvironment();
  }

  /**
   * Detect the current platform
   * @returns {string} Platform identifier
   */
  detectPlatform() {
    const platform = os.platform();
    const arch = os.arch();
    
    if (process.env.CODESPACES === 'true') return 'codespaces';
    if (process.env.GITPOD_WORKSPACE_ID) return 'gitpod';
    
    switch (platform) {
      case 'darwin':
        return arch === 'arm64' ? 'macos-arm' : 'macos-intel';
      case 'win32':
        return 'windows';
      case 'linux':
        return 'linux';
      default:
        return 'unknown';
    }
  }

  /**
   * Check if running in cloud environment
   * @returns {boolean}
   */
  detectCloudEnvironment() {
    return Boolean(
      process.env.CODESPACES || 
      process.env.GITPOD_WORKSPACE_ID ||
      process.env.REMOTE_CONTAINERS
    );
  }

  /**
   * Check if Docker is installed and accessible
   * @returns {Promise<Object>} Docker installation status
   */
  async checkDockerInstalled() {
    try {
      const { stdout } = await execAsync('docker --version');
      const versionMatch = stdout.match(/Docker version (\d+\.\d+\.\d+)/);
      
      return {
        installed: true,
        version: versionMatch ? versionMatch[1] : 'unknown',
        accessible: true
      };
    } catch (error) {
      // Check if Docker daemon is running but command failed
      if (error.message.includes('Cannot connect to the Docker daemon')) {
        return {
          installed: true,
          version: 'unknown',
          accessible: false,
          error: 'Docker daemon is not running'
        };
      }
      
      return {
        installed: false,
        version: null,
        accessible: false,
        error: 'Docker is not installed'
      };
    }
  }

  /**
   * Verify Docker version meets minimum requirements
   * @param {string} version - Docker version string
   * @returns {boolean}
   */
  verifyDockerVersion(version) {
    const MIN_VERSION = '20.10.0';
    
    if (!version || version === 'unknown') return true; // Skip check if version unknown
    
    const parseVersion = (v) => v.split('.').map(Number);
    const current = parseVersion(version);
    const minimum = parseVersion(MIN_VERSION);
    
    for (let i = 0; i < 3; i++) {
      if (current[i] > minimum[i]) return true;
      if (current[i] < minimum[i]) return false;
    }
    return true;
  }

  /**
   * Get installation guide URL for current platform
   * @returns {string} Installation guide URL
   */
  getInstallationGuideUrl() {
    const guides = {
      'macos-arm': 'https://docs.docker.com/desktop/install/mac-install/',
      'macos-intel': 'https://docs.docker.com/desktop/install/mac-install/',
      'windows': 'https://docs.docker.com/desktop/install/windows-install/',
      'linux': 'https://docs.docker.com/engine/install/',
      'codespaces': 'https://docs.github.com/en/codespaces/developing-in-codespaces/using-docker-in-codespaces',
      'gitpod': 'https://www.gitpod.io/docs/configure/workspaces/workspace-image#using-docker'
    };
    
    return guides[this.platform] || guides['linux'];
  }

  /**
   * Generate platform-specific installation instructions
   * @returns {string} Installation instructions
   */
  getInstallationInstructions() {
    const instructions = {
      'macos-arm': `
Docker Installation Required (macOS Apple Silicon)
═══════════════════════════════════════════════════

1. Download Docker Desktop for Mac (Apple Silicon):
   https://desktop.docker.com/mac/main/arm64/Docker.dmg

2. Open the downloaded .dmg file and drag Docker to Applications

3. Launch Docker from Applications folder

4. Wait for Docker to start (whale icon in menu bar)

5. Verify installation:
   docker --version

6. Run this tool again:
   npx vibe-to-docker
`,
      'macos-intel': `
Docker Installation Required (macOS Intel)
══════════════════════════════════════════

1. Download Docker Desktop for Mac (Intel):
   https://desktop.docker.com/mac/main/amd64/Docker.dmg

2. Open the downloaded .dmg file and drag Docker to Applications

3. Launch Docker from Applications folder

4. Wait for Docker to start (whale icon in menu bar)

5. Verify installation:
   docker --version

6. Run this tool again:
   npx vibe-to-docker
`,
      'windows': `
Docker Installation Required (Windows)
═══════════════════════════════════════

Prerequisites:
- Windows 10 64-bit: Pro, Enterprise, or Education (Build 19041 or higher)
- OR Windows 11 64-bit: Home, Pro, Enterprise, or Education
- WSL 2 enabled

Steps:
1. Download Docker Desktop for Windows:
   https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe

2. Run the installer and follow the installation wizard

3. Restart your computer when prompted

4. Launch Docker Desktop from Start menu

5. Wait for Docker to start (whale icon in system tray)

6. Verify installation in PowerShell or Command Prompt:
   docker --version

7. Run this tool again:
   npx vibe-to-docker
`,
      'linux': `
Docker Installation Required (Linux)
═════════════════════════════════════

For Ubuntu/Debian:
1. Update package index:
   sudo apt-get update

2. Install prerequisites:
   sudo apt-get install ca-certificates curl gnupg

3. Add Docker's official GPG key:
   sudo install -m 0755 -d /etc/apt/keyrings
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
   sudo chmod a+r /etc/apt/keyrings/docker.gpg

4. Set up repository:
   echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

5. Install Docker Engine:
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

6. Verify installation:
   sudo docker --version

7. Add your user to docker group (optional, avoids sudo):
   sudo usermod -aG docker $USER
   newgrp docker

8. Run this tool again:
   npx vibe-to-docker

For other distributions, see: https://docs.docker.com/engine/install/
`,
      'codespaces': `
Docker Setup for GitHub Codespaces
═══════════════════════════════════

Docker is available in Codespaces but needs to be configured.

Your .devcontainer/devcontainer.json needs:
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}

This tool will automatically configure Docker-in-Docker for Codespaces.
Proceeding with setup...
`,
      'gitpod': `
Docker Setup for Gitpod
═══════════════════════

Docker is available in Gitpod but needs to be configured.

Your .gitpod.yml needs:
image: gitpod/workspace-full

This tool will automatically configure Docker-in-Docker for Gitpod.
Proceeding with setup...
`
    };
    
    return instructions[this.platform] || instructions['linux'];
  }

  /**
   * Display Docker installation status and guide user
   * @returns {Promise<boolean>} True if Docker is ready, false if installation needed
   */
  async ensureDockerAvailable() {
    console.log('🔍 Checking Docker installation...\n');
    
    const status = await this.checkDockerInstalled();
    
    if (status.installed && status.accessible) {
      const versionValid = this.verifyDockerVersion(status.version);
      
      if (versionValid) {
        console.log(`✅ Docker ${status.version} is installed and running\n`);
        return true;
      } else {
        console.log(`⚠️  Docker ${status.version} is installed but outdated`);
        console.log(`   Minimum required version: 20.10.0`);
        console.log(`   Please update Docker and try again.\n`);
        return false;
      }
    }
    
    if (status.installed && !status.accessible) {
      console.log('⚠️  Docker is installed but not running');
      console.log('   Please start Docker Desktop and try again.\n');
      return false;
    }
    
    // Docker not installed - show installation guide
    console.log('❌ Docker is not installed\n');
    console.log(this.getInstallationInstructions());
    
    if (!this.isCloudEnvironment) {
      console.log(`\n📖 Full installation guide: ${this.getInstallationGuideUrl()}\n`);
      return false;
    }
    
    // For cloud environments, we can proceed with configuration
    return true;
  }

  /**
   * Configure Docker for cloud environments
   * @returns {Promise<Object>} Configuration to apply
   */
  async getCloudDockerConfig() {
    if (this.platform === 'codespaces') {
      return {
        type: 'devcontainer',
        config: {
          features: {
            'ghcr.io/devcontainers/features/docker-in-docker:2': {
              version: 'latest',
              moby: true
            }
          },
          runArgs: ['--privileged']
        }
      };
    }
    
    if (this.platform === 'gitpod') {
      return {
        type: 'gitpod',
        config: {
          image: 'gitpod/workspace-full',
          tasks: [{
            name: 'Docker Setup',
            init: 'docker --version'
          }]
        }
      };
    }
    
    return null;
  }
}

export { DockerManager };
```

**Unit Test Coverage:**

```javascript
// test/unit/docker-manager.test.js

import { DockerManager } from '../../lib/docker-manager.js';
import { jest } from '@jest/globals';

describe('DockerManager', () => {
  describe('Platform Detection', () => {
    test('detects macOS Apple Silicon', () => {
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'arch').mockReturnValue('arm64');
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('macos-arm');
    });

    test('detects macOS Intel', () => {
      jest.spyOn(os, 'platform').mockReturnValue('darwin');
      jest.spyOn(os, 'arch').mockReturnValue('x64');
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('macos-intel');
    });

    test('detects Windows', () => {
      jest.spyOn(os, 'platform').mockReturnValue('win32');
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('windows');
    });

    test('detects Linux', () => {
      jest.spyOn(os, 'platform').mockReturnValue('linux');
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('linux');
    });

    test('detects GitHub Codespaces', () => {
      process.env.CODESPACES = 'true';
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('codespaces');
      expect(manager.isCloudEnvironment).toBe(true);
      
      delete process.env.CODESPACES;
    });

    test('detects Gitpod', () => {
      process.env.GITPOD_WORKSPACE_ID = 'workspace-123';
      
      const manager = new DockerManager();
      expect(manager.platform).toBe('gitpod');
      expect(manager.isCloudEnvironment).toBe(true);
      
      delete process.env.GITPOD_WORKSPACE_ID;
    });
  });

  describe('Docker Installation Check', () => {
    test('detects installed and running Docker', async () => {
      const mockExec = jest.fn().mockResolvedValue({
        stdout: 'Docker version 24.0.5, build ced0996'
      });
      
      const manager = new DockerManager();
      manager.execAsync = mockExec;
      
      const status = await manager.checkDockerInstalled();
      
      expect(status.installed).toBe(true);
      expect(status.accessible).toBe(true);
      expect(status.version).toBe('24.0.5');
    });

    test('detects Docker not installed', async () => {
      const mockExec = jest.fn().mockRejectedValue(
        new Error('command not found: docker')
      );
      
      const manager = new DockerManager();
      manager.execAsync = mockExec;
      
      const status = await manager.checkDockerInstalled();
      
      expect(status.installed).toBe(false);
      expect(status.accessible).toBe(false);
    });

    test('detects Docker installed but daemon not running', async () => {
      const mockExec = jest.fn().mockRejectedValue(
        new Error('Cannot connect to the Docker daemon')
      );
      
      const manager = new DockerManager();
      manager.execAsync = mockExec;
      
      const status = await manager.checkDockerInstalled();
      
      expect(status.installed).toBe(true);
      expect(status.accessible).toBe(false);
      expect(status.error).toContain('daemon is not running');
    });
  });

  describe('Version Verification', () => {
    test('accepts version above minimum', () => {
      const manager = new DockerManager();
      expect(manager.verifyDockerVersion('24.0.5')).toBe(true);
    });

    test('accepts version equal to minimum', () => {
      const manager = new DockerManager();
      expect(manager.verifyDockerVersion('20.10.0')).toBe(true);
    });

    test('rejects version below minimum', () => {
      const manager = new DockerManager();
      expect(manager.verifyDockerVersion('19.03.12')).toBe(false);
    });

    test('accepts unknown version', () => {
      const manager = new DockerManager();
      expect(manager.verifyDockerVersion('unknown')).toBe(true);
    });
  });

  describe('Cloud Environment Configuration', () => {
    test('generates Codespaces configuration', async () => {
      process.env.CODESPACES = 'true';
      
      const manager = new DockerManager();
      const config = await manager.getCloudDockerConfig();
      
      expect(config.type).toBe('devcontainer');
      expect(config.config.features).toHaveProperty(
        'ghcr.io/devcontainers/features/docker-in-docker:2'
      );
      
      delete process.env.CODESPACES;
    });

    test('generates Gitpod configuration', async () => {
      process.env.GITPOD_WORKSPACE_ID = 'workspace-123';
      
      const manager = new DockerManager();
      const config = await manager.getCloudDockerConfig();
      
      expect(config.type).toBe('gitpod');
      expect(config.config.image).toBe('gitpod/workspace-full');
      
      delete process.env.GITPOD_WORKSPACE_ID;
    });
  });
});
```

### 2. Project Detection Module (Hybrid Approach)

**Purpose:** Automatically detect project type and framework using a hybrid detection strategy.

**Detection Priority:**
1. Parse package.json for "main" field and "scripts" hints
2. Scan dependencies/devDependencies for framework packages
3. Analyze file structure for framework-specific patterns
4. Apply priority: React > Vue > Angular > Svelte > Next.js/Nuxt > Static HTML

**Implementation Design:**

```javascript
// lib/project-detector.js

import fs from 'fs/promises';
import path from 'path';

/**
 * Project Detection Module
 * Uses hybrid approach to detect project framework and type
 */
class ProjectDetector {
  constructor(projectPath = process.cwd()) {
    this.projectPath = projectPath;
    this.detectionResults = {
      framework: null,
      buildTool: null,
      outputDir: null,
      packageManager: null,
      confidence: 0,
      detectionMethod: null
    };
  }

  /**
   * Run complete hybrid detection
   * @returns {Promise<Object>} Detection results
   */
  async detect() {
    const methods = [
      this.detectFromPackageJson.bind(this),
      this.detectFromDependencies.bind(this),
      this.detectFromFileStructure.bind(this)
    ];

    const results = [];
    
    for (const method of methods) {
      try {
        const result = await method();
        if (result) results.push(result);
      } catch (error) {
        // Method failed, continue to next
      }
    }

    if (results.length === 0) {
      return {
        framework: 'unknown',
        confidence: 0,
        detectionMethod: 'none'
      };
    }

    // Apply priority logic and combine results
    return this.consolidateResults(results);
  }

  /**
   * Detect framework from package.json main field and scripts
   * @returns {Promise<Object|null>}
   */
  async detectFromPackageJson() {
    const pkgPath = path.join(this.projectPath, 'package.json');
    
    try {
      const content = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(content);
      
      // Check scripts for framework hints
      const scripts = pkg.scripts || {};
      const scriptHints = this.analyzeScripts(scripts);
      
      // Check main field
      const mainHint = this.analyzeMainField(pkg.main);
      
      // Combine hints
      const framework = scriptHints.framework || mainHint.framework;
      const buildTool = scriptHints.buildTool || mainHint.buildTool;
      
      if (framework) {
        return {
          framework,
          buildTool,
          confidence: 0.7,
          detectionMethod: 'package.json',
          packageManager: this.detectPackageManager()
        };
      }
    } catch (error) {
      // package.json not found or invalid
    }
    
    return null;
  }

  /**
   * Analyze package.json scripts for framework hints
   * @param {Object} scripts - Scripts object from package.json
   * @returns {Object}
   */
  analyzeScripts(scripts) {
    const scriptString = JSON.stringify(scripts).toLowerCase();
    
    // Build tool detection
    let buildTool = null;
    if (scriptString.includes('vite')) buildTool = 'vite';
    else if (scriptString.includes('webpack')) buildTool = 'webpack';
    else if (scriptString.includes('react-scripts')) buildTool = 'create-react-app';
    else if (scriptString.includes('next')) buildTool = 'next';
    else if (scriptString.includes('nuxt')) buildTool = 'nuxt';
    else if (scriptString.includes('ng ') || scriptString.includes('angular')) buildTool = 'angular-cli';
    
    // Framework detection from scripts
    let framework = null;
    if (buildTool === 'next') framework = 'nextjs';
    else if (buildTool === 'nuxt') framework = 'nuxt';
    else if (buildTool === 'angular-cli') framework = 'angular';
    else if (buildTool === 'create-react-app') framework = 'react';
    
    return { framework, buildTool };
  }

  /**
   * Analyze package.json main field
   * @param {string} main - Main field value
   * @returns {Object}
   */
  analyzeMainField(main) {
    if (!main) return {};
    
    const mainLower = main.toLowerCase();
    
    if (mainLower.includes('.jsx')) return { framework: 'react' };
    if (mainLower.includes('.vue')) return { framework: 'vue' };
    if (mainLower.includes('.ts') || mainLower.includes('.tsx')) {
      return { framework: 'typescript' };
    }
    
    return {};
  }

  /**
   * Detect framework from dependencies
   * @returns {Promise<Object|null>}
   */
  async detectFromDependencies() {
    const pkgPath = path.join(this.projectPath, 'package.json');
    
    try {
      const content = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(content);
      
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies
      };
      
      const frameworks = this.analyzePackageDependencies(allDeps);
      
      if (frameworks.length === 0) {
        return null;
      }
      
      // Apply priority logic
      const prioritized = this.applyFrameworkPriority(frameworks);
      
      return {
        framework: prioritized.name,
        buildTool: prioritized.buildTool,
        outputDir: prioritized.outputDir,
        confidence: 0.9,
        detectionMethod: 'dependencies',
        alternativeFrameworks: frameworks.slice(1)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze package dependencies for framework indicators
   * @param {Object} dependencies - Combined dependencies object
   * @returns {Array<Object>} Detected frameworks
   */
  analyzePackageDependencies(dependencies) {
    const frameworks = [];
    const deps = Object.keys(dependencies);
    
    // React detection
    if (deps.includes('react')) {
      frameworks.push({
        name: 'react',
        priority: 1,
        buildTool: this.detectReactBuildTool(deps),
        outputDir: this.getDefaultOutputDir('react')
      });
    }
    
    // Vue detection
    if (deps.includes('vue')) {
      frameworks.push({
        name: 'vue',
        priority: 2,
        buildTool: this.detectVueBuildTool(deps),
        outputDir: this.getDefaultOutputDir('vue')
      });
    }
    
    // Angular detection
    if (deps.includes('@angular/core')) {
      frameworks.push({
        name: 'angular',
        priority: 3,
        buildTool: 'angular-cli',
        outputDir: 'dist'
      });
    }
    
    // Svelte detection
    if (deps.includes('svelte')) {
      frameworks.push({
        name: 'svelte',
        priority: 4,
        buildTool: this.detectSvelteBuildTool(deps),
        outputDir: this.getDefaultOutputDir('svelte')
      });
    }
    
    // Next.js detection
    if (deps.includes('next')) {
      frameworks.push({
        name: 'nextjs',
        priority: 5,
        buildTool: 'next',
        outputDir: '.next'
      });
    }
    
    // Nuxt detection
    if (deps.includes('nuxt')) {
      frameworks.push({
        name: 'nuxt',
        priority: 6,
        buildTool: 'nuxt',
        outputDir: '.output'
      });
    }
    
    return frameworks;
  }

  /**
   * Detect React build tool from dependencies
   * @param {Array<string>} deps - Dependency names
   * @returns {string}
   */
  detectReactBuildTool(deps) {
    if (deps.includes('react-scripts')) return 'create-react-app';
    if (deps.includes('vite')) return 'vite';
    if (deps.includes('webpack')) return 'webpack';
    if (deps.includes('parcel')) return 'parcel';
    return 'vite'; // Default for modern React
  }

  /**
   * Detect Vue build tool from dependencies
   * @param {Array<string>} deps - Dependency names
   * @returns {string}
   */
  detectVueBuildTool(deps) {
    if (deps.includes('@vue/cli')) return 'vue-cli';
    if (deps.includes('vite')) return 'vite';
    if (deps.includes('webpack')) return 'webpack';
    return 'vite'; // Default for modern Vue
  }

  /**
   * Detect Svelte build tool from dependencies
   * @param {Array<string>} deps - Dependency names
   * @returns {string}
   */
  detectSvelteBuildTool(deps) {
    if (deps.includes('vite')) return 'vite';
    if (deps.includes('rollup')) return 'rollup';
    if (deps.includes('webpack')) return 'webpack';
    return 'vite'; // Default for modern Svelte
  }

  /**
   * Apply framework priority to resolve conflicts
   * @param {Array<Object>} frameworks - Detected frameworks
   * @returns {Object} Highest priority framework
   */
  applyFrameworkPriority(frameworks) {
    if (frameworks.length === 0) return null;
    if (frameworks.length === 1) return frameworks[0];
    
    // Sort by priority (lower number = higher priority)
    return frameworks.sort((a, b) => a.priority - b.priority)[0];
  }

  /**
   * Get default output directory for framework
   * @param {string} framework - Framework name
   * @returns {string}
   */
  getDefaultOutputDir(framework) {
    const defaults = {
      'react': 'dist',
      'vue': 'dist',
      'angular': 'dist',
      'svelte': 'dist',
      'nextjs': '.next',
      'nuxt': '.output',
      'static': '.'
    };
    
    return defaults[framework] || 'dist';
  }

  /**
   * Detect framework from file structure
   * @returns {Promise<Object|null>}
   */
  async detectFromFileStructure() {
    const patterns = [
      { file: 'src/App.jsx', framework: 'react', confidence: 0.8 },
      { file: 'src/App.tsx', framework: 'react', confidence: 0.9 },
      { file: 'src/App.vue', framework: 'vue', confidence: 0.9 },
      { file: 'src/app/app.component.ts', framework: 'angular', confidence: 0.9 },
      { file: 'src/App.svelte', framework: 'svelte', confidence: 0.9 },
      { file: 'pages/index.js', framework: 'nextjs', confidence: 0.7 },
      { file: 'pages/index.vue', framework: 'nuxt', confidence: 0.7 },
      { file: 'index.html', framework: 'static', confidence: 0.5 }
    ];

    for (const pattern of patterns) {
      const filePath = path.join(this.projectPath, pattern.file);
      
      try {
        await fs.access(filePath);
        
        // File exists
        return {
          framework: pattern.framework,
          confidence: pattern.confidence,
          detectionMethod: 'file-structure',
          matchedFile: pattern.file
        };
      } catch (error) {
        // File doesn't exist, try next pattern
      }
    }
    
    return null;
  }

  /**
   * Consolidate results from multiple detection methods
   * @param {Array<Object>} results - Detection results
   * @returns {Object}
   */
  consolidateResults(results) {
    // Find result with highest confidence
    const highestConfidence = results.reduce((max, result) => 
      result.confidence > max.confidence ? result : max
    , results[0]);
    
    // If confidence is high enough, use it
    if (highestConfidence.confidence >= 0.8) {
      return highestConfidence;
    }
    
    // Multiple low-confidence results - check for consensus
    const frameworkCounts = {};
    results.forEach(result => {
      frameworkCounts[result.framework] = 
        (frameworkCounts[result.framework] || 0) + result.confidence;
    });
    
    const consensus = Object.entries(frameworkCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (consensus) {
      return {
        framework: consensus[0],
        confidence: Math.min(consensus[1] / results.length, 0.95),
        detectionMethod: 'hybrid-consensus',
        methods: results.map(r => r.detectionMethod)
      };
    }
    
    return highestConfidence;
  }

  /**
   * Detect package manager being used
   * @returns {string}
   */
  async detectPackageManager() {
    const lockFiles = {
      'package-lock.json': 'npm',
      'yarn.lock': 'yarn',
      'pnpm-lock.yaml': 'pnpm',
      'bun.lockb': 'bun'
    };
    
    for (const [file, manager] of Object.entries(lockFiles)) {
      try {
        await fs.access(path.join(this.projectPath, file));
        return manager;
      } catch (error) {
        // Lock file doesn't exist
      }
    }
    
    return 'npm'; // Default
  }
}

export { ProjectDetector };
```

**Unit Test Coverage:**

```javascript
// test/unit/project-detector.test.js

import { ProjectDetector } from '../../lib/project-detector.js';
import fs from 'fs/promises';
import { jest } from '@jest/globals';

describe('ProjectDetector', () => {
  describe('Framework Detection from package.json', () => {
    test('detects React from scripts', async () => {
      const mockPkg = {
        scripts: {
          dev: 'vite',
          build: 'vite build'
        },
        dependencies: {
          react: '^18.2.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('react');
      expect(result.buildTool).toBe('vite');
    });

    test('detects Vue from dependencies', async () => {
      const mockPkg = {
        dependencies: {
          vue: '^3.3.0'
        },
        devDependencies: {
          vite: '^4.0.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('vue');
      expect(result.buildTool).toBe('vite');
    });

    test('detects Angular from dependencies', async () => {
      const mockPkg = {
        dependencies: {
          '@angular/core': '^16.0.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('angular');
      expect(result.buildTool).toBe('angular-cli');
    });

    test('detects Next.js from dependencies', async () => {
      const mockPkg = {
        dependencies: {
          next: '^13.4.0',
          react: '^18.2.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('nextjs');
    });
  });

  describe('Framework Priority', () => {
    test('prioritizes React over Vue when both present', async () => {
      const mockPkg = {
        dependencies: {
          react: '^18.2.0',
          vue: '^3.3.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('react');
      expect(result.alternativeFrameworks).toContainEqual(
        expect.objectContaining({ name: 'vue' })
      );
    });

    test('prioritizes Vue over Angular when both present', async () => {
      const mockPkg = {
        dependencies: {
          vue: '^3.3.0',
          '@angular/core': '^16.0.0'
        }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('vue');
    });
  });

  describe('File Structure Detection', () => {
    test('detects React from App.jsx', async () => {
      jest.spyOn(fs, 'readFile').mockRejectedValue(new Error('ENOENT'));
      jest.spyOn(fs, 'access')
        .mockRejectedValueOnce(new Error('ENOENT')) // src/App.tsx
        .mockResolvedValueOnce(); // src/App.jsx
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detectFromFileStructure();
      
      expect(result.framework).toBe('react');
      expect(result.detectionMethod).toBe('file-structure');
    });

    test('detects Vue from App.vue', async () => {
      jest.spyOn(fs, 'access')
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(); // src/App.vue
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detectFromFileStructure();
      
      expect(result.framework).toBe('vue');
    });
  });

  describe('Hybrid Detection', () => {
    test('combines multiple detection methods', async () => {
      const mockPkg = {
        scripts: { dev: 'vite' },
        dependencies: { react: '^18.2.0' }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      jest.spyOn(fs, 'access').mockResolvedValue();
      
      const detector = new ProjectDetector('/test/path');
      const result = await detector.detect();
      
      expect(result.framework).toBe('react');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('uses consensus when confidence is low', async () => {
      const mockPkg = {
        dependencies: { react: '^18.2.0' }
      };
      
      jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockPkg));
      
      const detector = new ProjectDetector('/test/path');
      
      // Mock multiple low-confidence detections
      jest.spyOn(detector, 'detectFromPackageJson').mockResolvedValue({
        framework: 'react',
        confidence: 0.5
      });
      jest.spyOn(detector, 'detectFromDependencies').mockResolvedValue({
        framework: 'react',
        confidence: 0.6
      });
      
      const result = await detector.detect();
      
      expect(result.framework).toBe('react');
      expect(result.detectionMethod).toBe('hybrid-consensus');
    });
  });

  describe('Package Manager Detection', () => {
    test('detects npm from package-lock.json', async () => {
      jest.spyOn(fs, 'access')
        .mockResolvedValueOnce(); // package-lock.json exists
      
      const detector = new ProjectDetector('/test/path');
      const manager = await detector.detectPackageManager();
      
      expect(manager).toBe('npm');
    });

    test('detects yarn from yarn.lock', async () => {
      jest.spyOn(fs, 'access')
        .mockRejectedValueOnce(new Error('ENOENT')) // package-lock.json
        .mockResolvedValueOnce(); // yarn.lock
      
      const detector = new ProjectDetector('/test/path');
      const manager = await detector.detectPackageManager();
      
      expect(manager).toBe('yarn');
    });

    test('detects pnpm from pnpm-lock.yaml', async () => {
      jest.spyOn(fs, 'access')
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce(); // pnpm-lock.yaml
      
      const detector = new ProjectDetector('/test/path');
      const manager = await detector.detectPackageManager();
      
      expect(manager).toBe('pnpm');
    });

    test('defaults to npm when no lock file found', async () => {
      jest.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));
      
      const detector = new ProjectDetector('/test/path');
      const manager = await detector.detectPackageManager();
      
      expect(manager).toBe('npm');
    });
  });
});
```

### 3. Bootstrap Workflow Module

**Purpose:** Orchestrate the complete bootstrap process from initial invocation to final setup.

**Key Features:**
- Single entry point via `npx vibe-to-docker`
- Checks Docker availability
- Detects project configuration
- Runs `npm install` if package.json exists
- Generates Docker configuration files
- Adds tool to package.json scripts

**Implementation Design:**

```javascript
// lib/bootstrap-workflow.js

import { DockerManager } from './docker-manager.js';
import { ProjectDetector } from './project-detector.js';
import { TemplateSelector } from './template-selector.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Bootstrap Workflow Module
 * Orchestrates the complete setup process
 */
class BootstrapWorkflow {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.verbose = options.verbose || false;
    this.skipNpmInstall = options.skipNpmInstall || false;
    this.forceTemplate = options.forceTemplate || null;
    
    this.dockerManager = new DockerManager();
    this.projectDetector = new ProjectDetector(this.projectPath);
    this.templateSelector = new TemplateSelector();
  }

  /**
   * Run complete bootstrap workflow
   * @returns {Promise<Object>} Bootstrap results
   */
  async run() {
    console.log('🚀 Starting vibe-to-docker bootstrap...\n');
    
    const results = {
      steps: [],
      success: false,
      error: null
    };

    try {
      // Step 1: Check Docker
      await this.stepCheckDocker(results);
      
      // Step 2: Detect project
      await this.stepDetectProject(results);
      
      // Step 3: Run npm install
      if (!this.skipNpmInstall) {
        await this.stepNpmInstall(results);
      }
      
      // Step 4: Select template
      await this.stepSelectTemplate(results);
      
      // Step 5: Generate configuration
      await this.stepGenerateConfig(results);
      
      // Step 6: Update package.json
      await this.stepUpdatePackageJson(results);
      
      // Step 7: Display next steps
      this.displayNextSteps(results);
      
      results.success = true;
      
    } catch (error) {
      results.success = false;
      results.error = error.message;
      console.error(`\n❌ Bootstrap failed: ${error.message}\n`);
    }
    
    return results;
  }

  /**
   * Step 1: Check Docker installation
   */
  async stepCheckDocker(results) {
    this.log('Step 1: Checking Docker installation...');
    
    const dockerAvailable = await this.dockerManager.ensureDockerAvailable();
    
    results.steps.push({
      step: 'docker-check',
      success: dockerAvailable,
      message: dockerAvailable ? 'Docker is available' : 'Docker setup required'
    });
    
    if (!dockerAvailable && !this.dockerManager.isCloudEnvironment) {
      throw new Error('Docker is required but not installed. Please install Docker and try again.');
    }
    
    this.log('✓ Docker check complete\n');
  }

  /**
   * Step 2: Detect project configuration
   */
  async stepDetectProject(results) {
    this.log('Step 2: Detecting project configuration...');
    
    const detection = await this.projectDetector.detect();
    
    results.steps.push({
      step: 'project-detection',
      success: detection.framework !== 'unknown',
      detection
    });
    
    results.projectInfo = detection;
    
    if (detection.framework === 'unknown') {
      this.log('⚠️  Could not auto-detect project type');
    } else {
      this.log(`✓ Detected ${detection.framework} project (confidence: ${(detection.confidence * 100).toFixed(0)}%)\n`);
    }
  }

  /**
   * Step 3: Run npm install if package.json exists
   */
  async stepNpmInstall(results) {
    this.log('Step 3: Checking for dependencies...');
    
    const pkgPath = path.join(this.projectPath, 'package.json');
    
    try {
      await fs.access(pkgPath);
      
      // package.json exists - run npm install
      this.log('Running npm install...');
      
      const packageManager = results.projectInfo?.packageManager || 'npm';
      const installCommand = this.getInstallCommand(packageManager);
      
      const { stdout, stderr } = await execAsync(installCommand, {
        cwd: this.projectPath
      });
      
      results.steps.push({
        step: 'npm-install',
        success: true,
        command: installCommand,
        output: this.verbose ? stdout : null
      });
      
      this.log('✓ Dependencies installed\n');
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        // package.json doesn't exist - skip
        results.steps.push({
          step: 'npm-install',
          success: true,
          skipped: true,
          reason: 'No package.json found'
        });
        this.log('⊘ No package.json - skipping dependency installation\n');
      } else {
        // Installation failed
        results.steps.push({
          step: 'npm-install',
          success: false,
          error: error.message
        });
        this.log(`⚠️  npm install failed: ${error.message}\n`);
      }
    }
  }

  /**
   * Get install command for package manager
   */
  getInstallCommand(packageManager) {
    const commands = {
      npm: 'npm install',
      yarn: 'yarn install',
      pnpm: 'pnpm install',
      bun: 'bun install'
    };
    
    return commands[packageManager] || 'npm install';
  }

  /**
   * Step 4: Select appropriate template
   */
  async stepSelectTemplate(results) {
    this.log('Step 4: Selecting Docker template...');
    
    let template;
    
    if (this.forceTemplate) {
      template = this.forceTemplate;
      this.log(`Using specified template: ${template}`);
    } else {
      const detection = results.projectInfo;
      
      if (detection.framework === 'unknown' || detection.confidence < 0.6) {
        // Low confidence or unknown - prompt user
        template = await this.templateSelector.promptUser(detection);
      } else {
        // High confidence - auto-select
        template = this.templateSelector.selectFromDetection(detection);
        this.log(`Auto-selected template: ${template}`);
      }
    }
    
    results.steps.push({
      step: 'template-selection',
      success: true,
      template
    });
    
    results.selectedTemplate = template;
    this.log(`✓ Template selected: ${template}\n`);
  }

  /**
   * Step 5: Generate Docker configuration
   */
  async stepGenerateConfig(results) {
    this.log('Step 5: Generating Docker configuration...');
    
    const template = results.selectedTemplate;
    const config = await this.generateDockerConfig(template, results);
    
    results.steps.push({
      step: 'config-generation',
      success: true,
      filesGenerated: config.files
    });
    
    results.generatedFiles = config.files;
    this.log(`✓ Generated ${config.files.length} configuration files\n`);
  }

  /**
   * Generate Docker configuration files
   */
  async generateDockerConfig(template, results) {
    const templateDir = path.join(__dirname, '..', 'templates', template);
    const files = [];
    
    // Copy template files
    const templateFiles = await fs.readdir(templateDir, { recursive: true });
    
    for (const file of templateFiles) {
      const srcPath = path.join(templateDir, file);
      const destPath = path.join(this.projectPath, file);
      
      // Check if file already exists
      try {
        await fs.access(destPath);
        this.log(`⊘ Skipping ${file} (already exists)`);
        continue;
      } catch (error) {
        // File doesn't exist - copy it
      }
      
      // Create directory if needed
      const destDir = path.dirname(destPath);
      await fs.mkdir(destDir, { recursive: true });
      
      // Copy file with variable substitution
      let content = await fs.readFile(srcPath, 'utf8');
      content = this.substituteVariables(content, results);
      await fs.writeFile(destPath, content);
      
      files.push(file);
      this.log(`✓ Generated ${file}`);
    }
    
    return { files };
  }

  /**
   * Substitute template variables
   */
  substituteVariables(content, results) {
    const vars = {
      PROJECT_NAME: path.basename(this.projectPath),
      FRAMEWORK: results.projectInfo?.framework || 'unknown',
      BUILD_TOOL: results.projectInfo?.buildTool || 'vite',
      OUTPUT_DIR: results.projectInfo?.outputDir || 'dist',
      NODE_VERSION: '20',
      PORT: '3000'
    };
    
    let result = content;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    
    return result;
  }

  /**
   * Step 6: Update package.json with scripts
   */
  async stepUpdatePackageJson(results) {
    this.log('Step 6: Updating package.json...');
    
    const pkgPath = path.join(this.projectPath, 'package.json');
    
    try {
      const content = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(content);
      
      // Add scripts if not present
      pkg.scripts = pkg.scripts || {};
      
      const scriptsToAdd = {
        'docker:init': 'vibe-to-docker',
        'docker:build': 'docker-compose build',
        'docker:up': 'docker-compose up',
        'docker:down': 'docker-compose down'
      };
      
      let added = false;
      for (const [key, value] of Object.entries(scriptsToAdd)) {
        if (!pkg.scripts[key]) {
          pkg.scripts[key] = value;
          added = true;
          this.log(`✓ Added script: ${key}`);
        }
      }
      
      if (added) {
        await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        this.log('✓ package.json updated');
      } else {
        this.log('⊘ Scripts already exist in package.json');
      }
      
      results.steps.push({
        step: 'package-json-update',
        success: true,
        scriptsAdded: added
      });
      
    } catch (error) {
      // package.json doesn't exist or couldn't be updated
      results.steps.push({
        step: 'package-json-update',
        success: false,
        skipped: true,
        reason: error.message
      });
      this.log('⊘ Could not update package.json\n');
    }
  }

  /**
   * Display next steps to user
   */
  displayNextSteps(results) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Bootstrap Complete!');
    console.log('='.repeat(60) + '\n');
    
    console.log('📝 Next Steps:\n');
    
    console.log('1. Review generated configuration files:');
    results.generatedFiles?.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('');
    
    console.log('2. Customize .env.example and rename to .env\n');
    
    console.log('3. Build and run your Docker containers:');
    console.log('   npm run docker:build');
    console.log('   npm run docker:up\n');
    
    console.log('4. Access your application:');
    console.log('   http://localhost:3000\n');
    
    console.log('📚 Documentation: https://github.com/wrsmith108/vibe-to-docker\n');
  }

  /**
   * Log message (respects verbose mode)
   */
  log(message) {
    if (this.verbose || message.startsWith('✓') || message.startsWith('❌')) {
      console.log(message);
    }
  }
}

export { BootstrapWorkflow };
```

### 4. Environment Adaptation Module

**Purpose:** Detect and adapt to different development environments (local, Codespaces, Gitpod).

**Implementation Design:**

```javascript
// lib/environment-adapter.js

import fs from 'fs/promises';
import path from 'path';

/**
 * Environment Adaptation Module
 * Handles platform-specific optimizations and configurations
 */
class EnvironmentAdapter {
  constructor() {
    this.environment = this.detectEnvironment();
  }

  /**
   * Detect current environment
   * @returns {Object} Environment information
   */
  detectEnvironment() {
    if (process.env.CODESPACES === 'true') {
      return {
        type: 'codespaces',
        isCloud: true,
        supportsDocker: true,
        requiresDockerInDocker: true
      };
    }
    
    if (process.env.GITPOD_WORKSPACE_ID) {
      return {
        type: 'gitpod',
        isCloud: true,
        supportsDocker: true,
        requiresDockerInDocker: true
      };
    }
    
    if (process.env.REMOTE_CONTAINERS) {
      return {
        type: 'vscode-remote',
        isCloud: false,
        supportsDocker: true,
        requiresDockerInDocker: false
      };
    }
    
    return {
      type: 'local',
      isCloud: false,
      supportsDocker: true,
      requiresDockerInDocker: false
    };
  }

  /**
   * Generate environment-specific configuration
   * @returns {Promise<Object>} Configuration to apply
   */
  async generateEnvironmentConfig() {
    switch (this.environment.type) {
      case 'codespaces':
        return this.generateCodespacesConfig();
      case 'gitpod':
        return this.generateGitpodConfig();
      case 'vscode-remote':
        return this.generateVSCodeRemoteConfig();
      default:
        return null;
    }
  }

  /**
   * Generate Codespaces-specific configuration
   */
  async generateCodespacesConfig() {
    return {
      devcontainer: {
        name: 'Docker Development Environment',
        image: 'mcr.microsoft.com/devcontainers/javascript-node:20',
        features: {
          'ghcr.io/devcontainers/features/docker-in-docker:2': {
            version: 'latest',
            moby: true
          }
        },
        forwardPorts: [3000, 5000],
        postCreateCommand: 'npm install',
        customizations: {
          vscode: {
            extensions: [
              'ms-azuretools.vscode-docker',
              'dbaeumer.vscode-eslint'
            ]
          }
        }
      }
    };
  }

  /**
   * Generate Gitpod-specific configuration
   */
  async generateGitpodConfig() {
    return {
      gitpod: {
        image: 'gitpod/workspace-full',
        tasks: [
          {
            name: 'Setup',
            init: 'npm install',
            command: 'npm run dev'
          }
        ],
        ports: [
          {
            port: 3000,
            onOpen: 'open-preview',
            visibility: 'public'
          }
        ],
        vscode: {
          extensions: [
            'ms-azuretools.vscode-docker'
          ]
        }
      }
    };
  }

  /**
   * Generate VS Code Remote configuration
   */
  async generateVSCodeRemoteConfig() {
    return {
      vscode: {
        recommendations: [
          'ms-azuretools.vscode-docker',
          'dbaeumer.vscode-eslint'
        ]
      }
    };
  }

  /**
   * Apply environment-specific configuration
   */
  async applyEnvironmentConfig(projectPath) {
    const config = await this.generateEnvironmentConfig();
    
    if (!config) return [];
    
    const files = [];
    
    if (config.devcontainer) {
      const devcontainerPath = path.join(projectPath, '.devcontainer');
      await fs.mkdir(devcontainerPath, { recursive: true });
      
      const filePath = path.join(devcontainerPath, 'devcontainer.json');
      await fs.writeFile(
        filePath,
        JSON.stringify(config.devcontainer, null, 2)
      );
      files.push('.devcontainer/devcontainer.json');
    }
    
    if (config.gitpod) {
      const filePath = path.join(projectPath, '.gitpod.yml');
      const yaml = this.convertToYaml(config.gitpod);
      await fs.writeFile(filePath, yaml);
      files.push('.gitpod.yml');
    }
    
    if (config.vscode) {
      const vscodeDir = path.join(projectPath, '.vscode');
      await fs.mkdir(vscodeDir, { recursive: true });
      
      const filePath = path.join(vscodeDir, 'extensions.json');
      await fs.writeFile(
        filePath,
        JSON.stringify(config.vscode, null, 2)
      );
      files.push('.vscode/extensions.json');
    }
    
    return files;
  }

  /**
   * Convert object to YAML (simple implementation)
   */
  convertToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}- ${this.convertToYaml(item, indent + 1).trim()}\n`;
          } else {
            yaml += `${spaces}- ${item}\n`;
          }
        });
      } else if (typeof value === 'object' && value !== null) {
        yaml += `${spaces}${key}:\n${this.convertToYaml(value, indent + 1)}`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }
}

export { EnvironmentAdapter };
```

### 5. User Experience Flow Module

**Purpose:** Handle interactive prompts and provide fallback options when auto-detection fails.

**Implementation Design:**

```javascript
// lib/template-selector.js

import readline from 'readline';

/**
 * Template Selector Module
 * Handles template selection with interactive prompts
 */
class TemplateSelector {
  constructor() {
    this.templates = {
      basic: {
        name: 'Basic',
        description: 'Minimal Docker setup with essential configuration',
        recommended: ['static', 'unknown']
      },
      'ui-heavy': {
        name: 'UI-Heavy',
        description: 'Optimized for UI-heavy applications with advanced caching',
        recommended: ['react', 'vue', 'angular', 'svelte']
      },
      generic: {
        name: 'Generic',
        description: 'Universal template that works with any project',
        recommended: []
      }
    };
  }

  /**
   * Select template based on project detection
   * @param {Object} detection - Project detection results
   * @returns {string} Template name
   */
  selectFromDetection(detection) {
    const framework = detection.framework;
    
    // Find recommended template for framework
    for (const [template, config] of Object.entries(this.templates)) {
      if (config.recommended.includes(framework)) {
        return template;
      }
    }
    
    // Default to basic
    return 'basic';
  }

  /**
   * Prompt user to select template interactively
   * @param {Object} detection - Project detection results
   * @returns {Promise<string>} Selected template name
   */
  async promptUser(detection) {
    console.log('\n🤔 Could not confidently detect project type');
    
    if (detection.framework !== 'unknown') {
      console.log(`   Detected: ${detection.framework} (${(detection.confidence * 100).toFixed(0)}% confidence)`);
    }
    
    console.log('\n📋 Please select a Docker template:\n');
    
    const options = [];
    let index = 1;
    
    for (const [key, config] of Object.entries(this.templates)) {
      console.log(`${index}. ${config.name}`);
      console.log(`   ${config.description}\n`);
      options.push(key);
      index++;
    }
    
    console.log(`${index}. Exit with guidance\n`);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve, reject) => {
      rl.question('Enter your choice (1-' + index + '): ', (answer) => {
        rl.close();
        
        const choice = parseInt(answer);
        
        if (choice >= 1 && choice <= options.length) {
          resolve(options[choice - 1]);
        } else if (choice === index) {
          this.displayGuidance();
          process.exit(0);
        } else {
          console.log('\n❌ Invalid choice. Using generic template.\n');
          resolve('generic');
        }
      });
    });
  }

  /**
   * Display guidance for manual setup
   */
  displayGuidance() {
    console.log('\n📖 Manual Setup Guidance');
    console.log('='.repeat(60) + '\n');
    
    console.log('To manually set up Docker for your project:\n');
    
    console.log('1. Identify your project type:');
    console.log('   - React, Vue, Angular → Use ui-heavy template');
    console.log('   - Static HTML → Use basic template');
    console.log('   - Unknown/Custom → Use generic template\n');
    
    console.log('2. Run the tool with explicit template:');
    console.log('   npx vibe-to-docker --template=ui-heavy\n');
    
    console.log('3. Or explore templates manually:');
    console.log('   https://github.com/wrsmith108/vibe-to-docker/tree/main/templates\n');
    
    console.log('4. For help or questions:');
    console.log('   https://github.com/wrsmith108/vibe-to-docker/issues\n');
  }
}

export { TemplateSelector };
```

## Implementation Timeline

### Phase 1: Core Bootstrap Infrastructure (Week 1)

**Objectives:**
- Implement Docker Management Module
- Implement Project Detection Module (Hybrid Approach)
- Create basic Bootstrap Workflow

**Tasks:**

**Days 1-2: Docker Management**
- Implement platform detection (macOS, Windows, Linux)
- Create Docker installation check logic
- Generate platform-specific installation guides
- Write unit tests (100% coverage target)
- Test on all platforms

**Days 3-4: Project Detection**
- Implement package.json analysis
- Implement dependency scanning with priority logic
- Implement file structure pattern matching
- Create hybrid consolidation algorithm
- Write comprehensive unit tests

**Day 5: Basic Workflow**
- Integrate Docker Manager and Project Detector
- Create basic CLI entry point
- Implement progress logging
- End-to-end testing on sample projects

**Deliverables:**
- ✅ Docker detection working on all platforms
- ✅ Project detection with 85%+ accuracy
- ✅ Basic workflow functional
- ✅ 90%+ test coverage

### Phase 2: Bootstrap Features & npm Integration (Week 2)

**Objectives:**
- Complete Bootstrap Workflow Module
- Implement npm install automation
- Add package.json script integration
- Create template generation logic

**Tasks:**

**Days 1-2: npm Integration**
- Implement package manager detection (npm/yarn/pnpm/bun)
- Add automatic npm install step
- Handle installation errors gracefully
- Test with different package managers

**Days 3-4: Template Generation**
- Implement template file copying
- Add variable substitution logic
- Create package.json script injection
- Generate environment-specific files

**Day 5: Error Handling & Recovery**
- Implement comprehensive error handling
- Add recovery mechanisms
- Create helpful error messages
- Test failure scenarios

**Deliverables:**
- ✅ Automatic npm install working
- ✅ Template generation functional
- ✅ package.json integration complete
- ✅ Robust error handling

### Phase 3: Cloud Environments & UX (Week 3)

**Objectives:**
- Implement Environment Adaptation Module
- Add support for Codespaces and Gitpod
- Create interactive Template Selector
- Implement Docker-in-Docker configurations

**Tasks:**

**Days 1-2: Environment Detection**
- Implement Codespaces detection
- Implement Gitpod detection
- Create environment-specific config generators
- Test in cloud environments

**Days 3-4: Interactive UX**
- Implement template selection prompts
- Add progress indicators
- Create guidance display
- Improve console output formatting

**Day 5: Docker-in-Docker**
- Configure devcontainer.json generation
- Configure .gitpod.yml generation
- Test Docker-in-Docker in cloud environments
- Validate port forwarding

**Deliverables:**
- ✅ Codespaces support complete
- ✅ Gitpod support complete
- ✅ Interactive prompts functional
- ✅ Docker-in-Docker working

### Phase 4: Documentation & Polish (Week 4)

**Objectives:**
- Update all documentation
- Create comprehensive examples
- Final testing and bug fixes
- Prepare for release

**Tasks:**

**Days 1-2: Documentation**
- Rewrite README.md with Docker prerequisites
- Create DOCKER_SETUP.md guide
- Update npm package description
- Write user journey examples

**Days 3-4: Examples & Testing**
- Create example repositories for each framework
- Test with real vibe-coding tool exports
- Perform cross-platform validation
- Load testing and performance optimization

**Day 5: Release Preparation**
- Final bug fixes
- Version bump to 2.1.0
- Prepare changelog
- Create release notes

**Deliverables:**
- ✅ Complete documentation
- ✅ Example repositories
- ✅ All platforms tested
- ✅ Ready for release

## Testing Strategy

### Unit Tests

**Docker Management Module**
```javascript
// Platform detection on all systems
// Docker version checking
// Installation guide generation
// Cloud environment detection
// Error handling for missing Docker
```

**Project Detection Module**
```javascript
// package.json parsing
// Dependency analysis with priority
// File structure pattern matching
// Hybrid consolidation logic
// Edge cases (multi-framework projects)
// Package manager detection
```

**Bootstrap Workflow Module**
```javascript
// Complete workflow execution
// Step-by-step validation
// Error recovery mechanisms
// Template selection logic
// File generation
```

**Environment Adaptation Module**
```javascript
// Environment detection
// Config generation for each platform
// devcontainer.json creation
// .gitpod.yml creation
// YAML conversion
```

**Template Selector Module**
```javascript
// Auto-selection logic
// Interactive prompt flow
// Invalid input handling
// Guidance display
```

### Integration Tests

**End-to-End Bootstrap Scenarios**
```javascript
// Fresh React project from vibe-coding tool
// Existing Vue project with dependencies
// Static HTML project
// Unknown project type
// Multi-framework project
```

**Platform-Specific Tests**
```javascript
// macOS (Intel and Apple Silicon)
// Windows with WSL
// Linux (Ubuntu, Debian, Fedora)
// GitHub Codespaces
// Gitpod
```

**Error Scenarios**
```javascript
// Docker not installed
// Docker daemon not running
// npm install failure
// Permission errors
// Network failures
```

## Success Criteria

- ✅ Tool works identically via `npx vibe-to-docker` on fresh repositories
- ✅ Docker detection accurate on all platforms
- ✅ Project detection achieves 85%+ accuracy with hybrid approach
- ✅ npm install runs automatically when package.json exists
- ✅ Interactive prompts provide clear fallback options
- ✅ GitHub Codespaces integration works out of the box
- ✅ Gitpod integration works with Docker-in-Docker
- ✅ All tests pass with 90%+ code coverage
- ✅ Documentation is comprehensive and accurate
- ✅ Zero breaking changes for existing users

## Documentation Requirements

### README.md Updates

Add prominent Docker prerequisite section at the beginning:

```markdown
## ⚠️ Prerequisites

### Docker Installation Required

This tool requires Docker to be installed on your system. Follow the installation guide for your platform:

- **macOS**: [Install Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Windows**: [Install Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Linux**: [Install Docker Engine](https://docs.docker.com/engine/install/)
- **GitHub Codespaces**: Docker is pre-configured automatically
- **Gitpod**: Docker is pre-configured automatically

**Note:** The tool will check for Docker installation and guide you through setup if needed.
```

### New DOCKER_SETUP.md

Create comprehensive platform-specific installation guide with screenshots and troubleshooting.

### Updated Usage Examples

Show bootstrap from fresh clone:

```markdown
## Quick Start from Fresh Repository

1. Clone your project from any vibe-coding tool:
   ```bash
   git clone https://github.com/you/your-project.git
   cd your-project
   ```

2. Run the bootstrap tool:
   ```bash
   npx vibe-to-docker
   ```

3. The tool will automatically:
   - ✓ Check if Docker is installed
   - ✓ Detect your project type (React, Vue, Angular, etc.)
   - ✓ Run npm install if package.json exists
   - ✓ Generate Docker configuration files
   - ✓ Add convenient npm scripts

4. Start your containerized app:
   ```bash
   npm run docker:up
   ```
```

## Conclusion

This implementation plan transforms `vibe-to-docker` from a simple configuration generator into a comprehensive bootstrap tool that handles the complete first-time setup experience for users from vibe-coding platforms. 

The modular architecture ensures maintainability and testability, while the hybrid detection approach maximizes accuracy across different project types. Docker-in-Docker support for cloud environments enables seamless integration with modern development workflows.

The 4-week timeline provides adequate time for thorough implementation, testing, and documentation while maintaining high code quality standards.