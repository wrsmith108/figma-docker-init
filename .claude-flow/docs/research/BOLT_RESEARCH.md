# Comprehensive Research: Bolt (StackBlitz AI Tool)

**Research Date**: November 2024
**Focus**: Project Structure, WebContainer Implementation, Framework Support, Dependencies, Build Configuration, and Detection Signatures

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [WebContainer Technology](#webcontainer-technology)
4. [Framework Support](#framework-support)
5. [Package Dependencies](#package-dependencies)
6. [Build Configuration](#build-configuration)
7. [Detection Signatures](#detection-signatures)
8. [Architecture Patterns](#architecture-patterns)

---

## Overview

### What is Bolt?

Bolt (bolt.new) is an AI-powered web development tool by StackBlitz that enables users to:
- Prompt, run, edit, and deploy full-stack web applications directly in the browser
- Build applications without requiring local development environment setup
- Leverage AI to generate, understand, and modify code in real-time

### Key Components

- **Platform**: Browser-based IDE built with Remix and the AI SDK
- **AI Integration**: Claude Sonnet 3.5 via Anthropic's API
- **Runtime**: StackBlitz WebContainers (full WASM-powered sandbox)
- **Deployment**: Cloudflare Pages and Cloudflare Workers
- **Package Management**: npm, pnpm, yarn (native browser versions)

### Variants

1. **bolt.new** - Commercial, hosted StackBlitz product
2. **bolt.diy** - Open-source community version (12K+ GitHub stars)

---

## Project Structure

### bolt.new Directory Layout

```
bolt.new/
├── app/                          # Core application source code
│   ├── components/               # React components
│   ├── lib/                      # Utility libraries
│   ├── routes/                   # Remix route definitions
│   └── styles/                   # CSS/SCSS styling
├── functions/                    # Serverless/Cloudflare Workers functions
├── public/                       # Static assets and public files
├── icons/                        # Icon resources
├── types/                        # TypeScript type definitions
├── .github/                      # GitHub workflows and CI/CD
├── package.json                  # npm dependencies and scripts
├── vite.config.ts               # Vite build configuration
├── remix.config.js              # Remix framework config
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # Linting rules
├── uno.config.ts                # UnoCSS utility framework
├── wrangler.toml                # Cloudflare Workers config
└── README.md                    # Project documentation
```

### bolt.diy Directory Layout

```
bolt.diy/
├── app/                         # Remix application source
│   ├── components/              # Reusable UI components
│   ├── lib/                     # Core utilities and helpers
│   ├── routes/                  # Remix routes
│   ├── styles/                  # Global styles
│   └── modules/                 # Feature modules
├── electron/                    # Electron desktop app files
├── functions/                   # Backend serverless functions
├── public/                      # Static assets
├── docs/                        # Documentation
├── scripts/                     # Build and utility scripts
├── assets/                      # Project assets
├── icons/                       # Icon files
├── types/                       # TypeScript definitions
├── .github/                     # GitHub workflows
├── docker/                      # Docker configurations
├── vite.config.ts              # Vite configuration
├── vite-electron.config.ts     # Electron build config
├── remix.config.js             # Remix configuration
├── tsconfig.json               # TypeScript config
├── package.json                # Dependencies
├── pnpm-lock.yaml              # Lock file
├── Dockerfile                  # Container definition
├── docker-compose.yaml         # Multi-container setup
├── electron-builder.yml        # Electron build config
├── .env.example                # Environment template
└── load-context.ts             # Context loading
```

### Key Structural Patterns

#### Remix Framework Structure
- Routes are colocated with components in `app/routes/`
- File-based routing system (filename maps to URL)
- Loaders for data fetching, actions for mutations

#### Component Organization
```
components/
├── common/                      # Shared across app
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── Navigation.tsx
├── features/                    # Feature-specific
│   ├── CodeEditor/
│   ├── FileExplorer/
│   └── Terminal/
└── ui/                          # Basic UI primitives
    ├── Button.tsx
    ├── Input.tsx
    └── Modal.tsx
```

#### Services/Utils Pattern
```
lib/
├── ai/                          # AI integration
│   ├── providers/               # LLM provider implementations
│   ├── models.ts                # Model definitions
│   └── api.ts                   # API client
├── webcontainer/                # WebContainer utilities
│   ├── context.ts               # WebContainer context
│   └── terminal.ts              # Terminal interface
├── auth/                        # Authentication
└── utils/                       # General utilities
```

---

## WebContainer Technology

### Architecture Overview

WebContainers is a WASM-powered runtime that brings Node.js and the entire npm ecosystem directly to the browser, enabling:

- Full-stack application development without server infrastructure
- Package installation and management (npm, pnpm, yarn)
- File system operations
- Process execution
- Network isolation within browser sandbox

### Core Capabilities

#### 1. File System Operations

```typescript
// WebContainer filesystem API (modeled after fs.promises)
interface FileSystemAPI {
  mkdir(path: string, options?: MkdirOptions): Promise<void>;
  readdir(path: string): Promise<DirEnt[]>;
  readFile(path: string, encoding: string): Promise<string | Buffer>;
  writeFile(path: string, data: string | Buffer): Promise<void>;
  rm(path: string, options?: RmOptions): Promise<void>;
  stat(path: string): Promise<Stats>;
  mount(source: FileSystemTree, path: string): Promise<void>;
}

// FileSystemTree structure for mounting
interface FileSystemTree {
  [filename: string]: {
    file?: {
      contents: string; // File content
    };
    directory?: FileSystemTree; // Nested structure
  };
}

// Example usage in Bolt
const fs = webcontainerInstance.fs;
await fs.mkdir('/app', { recursive: true });
await fs.writeFile('/app/index.js', 'console.log("Hello");');
```

#### 2. Process and Shell Execution

```typescript
// WebContainer process execution
interface SpawnOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdio?: 'inherit' | 'pipe' | 'ipc';
}

const process = await webcontainerInstance.spawn('npm', ['install'], {
  cwd: '/app'
});

process.output.pipeTo(new WritableStream({
  write: (chunk) => console.log(chunk)
}));

await process.exit;
```

#### 3. Package Manager Integration

```typescript
// npm/pnpm/yarn run natively in browser
const npmProcess = await webcontainerInstance.spawn('npm', ['install'], {
  cwd: '/project'
});

const yarnProcess = await webcontainerInstance.spawn('yarn', ['install'], {
  cwd: '/project'
});

const pnpmProcess = await webcontainerInstance.spawn('pnpm', ['install'], {
  cwd: '/project'
});
```

### Technical Requirements

#### Browser Requirements
- **SharedArrayBuffer**: Required for WebContainer to function
- **Cross-Origin Isolation**: Website must serve specific headers

```javascript
// Required HTTP Headers
{
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin'
}
```

#### Browser Support
- Chrome/Chromium-based: Full support
- Firefox: Partial support
- Safari: Limited support
- Recommended: Chrome Canary for development

#### Performance Characteristics
- Package installation: ~10x faster than local npm
- Due to optimized proxying of package registry requests
- Virtual in-memory filesystem (ephemeral)
- Booting time: Typically 2-5 seconds

### WebContainer vs Traditional Approach

| Aspect | WebContainer | Traditional Server |
|--------|--------------|-------------------|
| Execution Location | Browser (WASM) | Remote Server |
| Cold Start | 2-5 seconds | Deployment dependent |
| File System | Virtual (Memory) | Persistent disk |
| Package Installation | 10x faster (optimized) | Variable |
| Network | Browser sandbox | Full server access |
| Cost | Free (browser resource) | Infrastructure cost |
| Security | Isolated environment | Server security model |

---

## Framework Support

### Officially Supported Frameworks

#### React Ecosystem
- **React** - Core library with hooks, context
- **Next.js** - Full-stack framework (App Router, Pages Router)
- **Gatsby** - Static site generator
- **Remix** - Full-stack web framework (used in Bolt itself)
- **Create React App** - Legacy setup

**Common Bolt-Generated React Pattern**:
```jsx
// Typical structure in Bolt-generated React projects
import React, { useState, useEffect } from 'react';

export default function App() {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div className="app">
      {/* Content */}
    </div>
  );
}
```

#### Vue Ecosystem
- **Vue 3** - Progressive framework
- **Nuxt** - Meta-framework for Vue
- **Vite** - Lightning-fast build tool

**Composition API Support**:
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const state = ref(initialValue);
const computed_value = computed(() => state.value * 2);

onMounted(() => {
  // Setup lifecycle
});
</script>

<template>
  <div class="container">
    {{ computed_value }}
  </div>
</template>
```

#### Svelte Ecosystem
- **Svelte** - Compiler-based framework
- **SvelteKit** - Full-stack framework for Svelte
- **SvelteKit with WebContainers** - Recently fully supported

**SvelteKit Pattern**:
```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  export let data: PageData;

  let count = 0;
</script>

<h1>{data.title}</h1>
<p>Count: {count}</p>
<button on:click={() => count++}>Increment</button>
```

#### Other Supported Frameworks
- **Angular** - Full support with latest versions
- **Astro** - Static and dynamic hybrid
- **Express/Node.js** - Backend frameworks
- **Vite** - Build tool (base for many projects)
- **Webpack** - Module bundler
- **Parcel** - Zero-config bundler

### Universal Meta-Frameworks
- **Remix** - Modern full-stack
- **Next.js** - React meta-framework
- **Nuxt** - Vue meta-framework
- **SvelteKit** - Svelte meta-framework

---

## Package Dependencies

### Core Bolt.new Dependencies

```json
{
  "name": "bolt.new",
  "version": "1.0.0",
  "packageManager": "pnpm@9.4.0",
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "remix": "^2.0.0",
    "@remix-run/node": "^2.0.0",
    "@remix-run/react": "^2.0.0",
    "ai": "^latest",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Common Bolt-Generated Project Dependencies

#### Frontend Stack
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.x.x",
    "axios": "^1.6.x",
    "zustand": "^4.x.x",
    "tailwindcss": "^3.x.x",
    "@tailwindcss/forms": "^0.5.x"
  }
}
```

#### Backend Stack (Node.js/Express)
```json
{
  "dependencies": {
    "express": "^4.18.x",
    "cors": "^2.8.x",
    "dotenv": "^16.x.x",
    "axios": "^1.6.x",
    "mongoose": "^7.x.x",
    "jsonwebtoken": "^9.x.x",
    "bcryptjs": "^2.4.x"
  }
}
```

#### Database & ORM
```json
{
  "dependencies": {
    "mongoose": "^7.x.x",
    "prisma": "^5.x.x",
    "@prisma/client": "^5.x.x",
    "pg": "^8.x.x",
    "sqlite3": "^5.x.x"
  }
}
```

#### Testing & Quality
```json
{
  "devDependencies": {
    "jest": "^29.x.x",
    "@testing-library/react": "^14.x.x",
    "vitest": "^1.x.x",
    "eslint": "^8.x.x",
    "prettier": "^3.x.x"
  }
}
```

### Dependency Installation Pattern

Bolt automatically detects and installs:
1. Dependencies from `package.json`
2. DevDependencies (in development mode)
3. PeerDependencies (with warnings)
4. Uses npm/pnpm/yarn based on lock file presence

```typescript
// Bolt's dependency detection logic (conceptual)
async function detectAndInstallDependencies(projectPath: string) {
  // 1. Check for lock files (priority order)
  const lockFileExists = await checkForLockFile(projectPath);
  // pnpm-lock.yaml > yarn.lock > package-lock.json

  // 2. Determine package manager
  const packageManager = detectPackageManager(lockFileExists);

  // 3. Read package.json
  const packageJson = await readPackageJson(projectPath);

  // 4. Install dependencies
  await webcontainerInstance.spawn(packageManager, ['install'], {
    cwd: projectPath
  });

  // 5. Monitor installation progress
  // AI monitors and reports progress to user
}
```

---

## Build Configuration

### Vite Configuration Pattern

```typescript
// vite.config.ts (typical Bolt project)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Remix Configuration Pattern

```javascript
// remix.config.js (Bolt framework itself)
export default {
  ignoredRouteFiles: ['**/*.css'],
  future: {
    v3_fetcherPersist: true,
    v3_relativeSplatPath: true,
    v3_throwAbortReason: true,
  },
  tailwind: true,
  postcss: true,
};
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@lib/*": ["./src/lib/*"]
    }
  }
}
```

### ESBuild Configuration

```typescript
// Typical Bolt project build output
{
  jsx: 'automatic',
  target: ['es2020'],
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  format: 'esm',
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  assetsInlineLimit: 8192,
}
```

### Environment Configuration

```bash
# .env.example (Bolt project pattern)
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=MyApp
VITE_LOG_LEVEL=info

# Backend
DATABASE_URL=mongodb://localhost:27017/mydb
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### StackBlitz Configuration

#### .stackblitzrc
```json
{
  "installDependencies": true,
  "startCommand": "npm run dev",
  "compileTrigger": "auto",
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### package.json stackblitz Field
```json
{
  "name": "my-bolt-project",
  "stackblitz": {
    "installDependencies": true,
    "startCommand": "npm run dev",
    "compileTrigger": "auto",
    "env": {
      "VITE_API_URL": "http://localhost:5173"
    }
  }
}
```

---

## Detection Signatures

### File-Based Detection

#### 1. StackBlitz Configuration Files

```typescript
/**
 * Detect if project is configured for StackBlitz/Bolt
 */
function detectStackBlitzConfig(projectPath: string): {
  isStackBlitz: boolean;
  configPath: string | null;
  config: any;
} {
  const fs = require('fs');
  const path = require('path');

  const configPaths = [
    path.join(projectPath, '.stackblitzrc'),
    path.join(projectPath, 'package.json'),
  ];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;

    try {
      if (configPath.endsWith('.stackblitzrc')) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return {
          isStackBlitz: true,
          configPath,
          config,
        };
      }

      if (configPath.endsWith('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (packageJson.stackblitz) {
          return {
            isStackBlitz: true,
            configPath,
            config: packageJson.stackblitz,
          };
        }
      }
    } catch (error) {
      console.error(`Error reading ${configPath}:`, error);
    }
  }

  return {
    isStackBlitz: false,
    configPath: null,
    config: null,
  };
}
```

#### 2. WebContainer Markers

```typescript
/**
 * Detect WebContainer-specific patterns
 */
function detectWebContainerMarkers(projectPath: string): string[] {
  const fs = require('fs');
  const path = require('path');
  const markers: string[] = [];

  // Check for WebContainer-compatible build tools
  const buildToolIndicators = [
    { file: 'vite.config.ts', pattern: /vite/i },
    { file: 'vite.config.js', pattern: /vite/i },
    { file: 'remix.config.js', pattern: /remix/i },
    { file: 'remix.config.ts', pattern: /remix/i },
  ];

  for (const { file, pattern } of buildToolIndicators) {
    const filePath = path.join(projectPath, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (pattern.test(content)) {
        markers.push(`WebContainer-compatible build: ${file}`);
      }
    }
  }

  // Check for WebContainer-supporting frameworks
  const supportedFrameworks = [
    'react',
    'vue',
    'svelte',
    'sveltekit',
    'next.js',
    'nuxt',
    'remix',
    'astro',
  ];

  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const framework of supportedFrameworks) {
      if (deps[framework]) {
        markers.push(`WebContainer-supported framework: ${framework}`);
      }
    }
  }

  return markers;
}
```

### Package.json-Based Detection

```typescript
/**
 * Analyze package.json for Bolt/StackBlitz patterns
 */
function analyzePackageJsonForBolt(packageJsonPath: string): {
  isBoltProject: boolean;
  confidence: number;
  indicators: string[];
} {
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const indicators: string[] = [];
  let score = 0;

  // Check for Remix (core Bolt technology)
  if (packageJson.dependencies?.['remix'] || packageJson.devDependencies?.['remix']) {
    indicators.push('Uses Remix framework (Bolt native)');
    score += 25;
  }

  // Check for StackBlitz configuration
  if (packageJson.stackblitz) {
    indicators.push('Has stackblitz field in package.json');
    score += 30;
  }

  // Check for AI SDK (Bolt uses Anthropic AI SDK)
  if (packageJson.dependencies?.['ai']) {
    indicators.push('Uses AI SDK (Bolt integration)');
    score += 15;
  }

  // Check for common Bolt stack
  const commonBoltDeps = {
    'react': 5,
    'react-dom': 5,
    'vite': 10,
    '@vitejs/plugin-react': 10,
    'typescript': 5,
    'zustand': 3,
    'tailwindcss': 3,
  };

  for (const [dep, points] of Object.entries(commonBoltDeps)) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      indicators.push(`Uses ${dep}`);
      score += points;
    }
  }

  // Check for WebContainer compatibility
  const buildTools = packageJson.devDependencies || {};
  if (buildTools.vite || buildTools['@vitejs/plugin-react'] || packageJson.dependencies?.['remix']) {
    indicators.push('WebContainer-compatible build setup');
    score += 10;
  }

  return {
    isBoltProject: score > 40,
    confidence: Math.min(score / 100, 1.0),
    indicators,
  };
}
```

### Script-Based Detection

```typescript
/**
 * Detect Bolt projects by build scripts
 */
function detectByBuildScripts(packageJsonPath: string): {
  detected: boolean;
  scripts: string[];
} {
  const fs = require('fs');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};

  const detectedScripts: string[] = [];
  const boltPatterns = [
    /remix.*vite/i,
    /vite.*build/i,
    /remix.*dev/i,
    /tsx.*dev/i,
  ];

  for (const [name, command] of Object.entries(scripts)) {
    for (const pattern of boltPatterns) {
      if (pattern.test(command as string)) {
        detectedScripts.push(`${name}: ${command}`);
      }
    }
  }

  return {
    detected: detectedScripts.length > 0,
    scripts: detectedScripts,
  };
}
```

### Directory Structure Detection

```typescript
/**
 * Detect Bolt project by directory structure
 */
function detectByDirectoryStructure(projectPath: string): {
  isBoltProject: boolean;
  structure: string[];
} {
  const fs = require('fs');
  const path = require('path');
  const structure: string[] = [];

  // Typical Bolt project structure
  const expectedDirs = [
    'app',           // Remix app directory
    'app/routes',    // Route definitions
    'app/components', // UI components
    'public',        // Static assets
    'types',         // TypeScript definitions
  ];

  for (const dir of expectedDirs) {
    const dirPath = path.join(projectPath, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      structure.push(dir);
    }
  }

  // Check for Remix-specific structure
  const hasRemixStructure =
    structure.includes('app') &&
    structure.includes('app/routes');

  return {
    isBoltProject: hasRemixStructure,
    structure,
  };
}
```

### Comprehensive Detection Function

```typescript
/**
 * Complete Bolt project detection
 */
function isBoltProject(projectPath: string): {
  isBolt: boolean;
  confidence: number;
  indicators: string[];
  details: {
    stackblitzConfig: any;
    packageJsonAnalysis: any;
    directoryStructure: any;
  };
} {
  const stackblitzConfig = detectStackBlitzConfig(projectPath);
  const packageJsonPath = require('path').join(projectPath, 'package.json');
  const packageJsonAnalysis = analyzePackageJsonForBolt(packageJsonPath);
  const directoryStructure = detectByDirectoryStructure(projectPath);

  const allIndicators = [
    ...stackblitzConfig.config ? ['Has StackBlitz configuration'] : [],
    ...packageJsonAnalysis.indicators,
    ...directoryStructure.structure.map(d => `Has ${d} directory`),
  ];

  const confidence =
    (stackblitzConfig.isStackBlitz ? 0.3 : 0) +
    (packageJsonAnalysis.confidence * 0.5) +
    (directoryStructure.isBoltProject ? 0.2 : 0);

  return {
    isBolt: confidence > 0.5,
    confidence,
    indicators: allIndicators,
    details: {
      stackblitzConfig,
      packageJsonAnalysis,
      directoryStructure,
    },
  };
}
```

---

## Architecture Patterns

### Component Hierarchy

```
App
├── RootLayout
│   ├── Navigation
│   ├── MainContent
│   │   ├── EditorPane
│   │   │   └── CodeEditor
│   │   ├── PreviewPane
│   │   │   └── BrowserPreview
│   │   └── TerminalPane
│   │       └── Terminal
│   └── Footer
└── Modal (AI Chat, Settings, etc.)
```

### Data Flow Pattern

```
User Input
  ↓
AI Processing (Claude)
  ↓
Code Generation
  ↓
File System Update (WebContainer)
  ↓
Build Trigger
  ↓
Browser Preview Update
  ↓
User Sees Results
```

### State Management Pattern

```typescript
// Typical Bolt app state structure
interface AppState {
  project: {
    id: string;
    name: string;
    files: Map<string, FileContent>;
    currentFile: string;
  };
  ui: {
    editorOpen: boolean;
    previewOpen: boolean;
    terminalOpen: boolean;
  };
  build: {
    isBuilding: boolean;
    lastBuild: number;
    errors: BuildError[];
  };
  ai: {
    isProcessing: boolean;
    messages: ChatMessage[];
  };
}
```

### Module Organization

```typescript
// @/lib/ai/providers/anthropic.ts
class AnthropicProvider implements LLMProvider {
  async generateCode(prompt: string): Promise<CodeGeneration> {
    // Uses AI SDK
  }
}

// @/lib/webcontainer/context.ts
class WebContainerManager {
  async initializeEnvironment(): Promise<void> {
    // Setup WebContainer
  }

  async executeCommand(command: string): Promise<string> {
    // Run commands in WebContainer
  }
}

// @/app/routes/editor.tsx
export default function Editor() {
  // Remix route component
  return <EditorInterface />;
}
```

---

## Key Findings Summary

### Strengths of Bolt Architecture

1. **Browser-Native Development**: Full-stack development without local setup
2. **Real-time AI Integration**: Claude Sonnet processes changes instantly
3. **WebContainer Sandbox**: Isolated, secure execution environment
4. **Framework Agnostic**: Supports React, Vue, Svelte, and meta-frameworks
5. **Package Manager Support**: Native npm/pnpm/yarn in browser
6. **Live Preview**: Immediate feedback on changes
7. **Deployment Ready**: Direct integration with hosting platforms

### Technical Advantages

- **10x Faster Package Installation**: Optimized npm proxy
- **Zero Local Setup**: Works in any modern browser
- **Persistent State**: WebContainer maintains development state
- **Terminal Access**: Full terminal emulation in browser
- **File System Access**: Direct filesystem operations in WASM
- **Process Management**: Run servers, build tools, scripts

### Detection Strategy

Best detection involves checking (in priority order):
1. `.stackblitzrc` or `package.json` stackblitz field
2. Remix framework presence
3. WebContainer-compatible build tools (Vite, Remix)
4. Directory structure (app/routes pattern)
5. Common dependency combinations

### Integration Points for Other Tools

To migrate from Bolt:
1. Export project files from browser
2. Run `npm install` locally to verify dependencies
3. Check for WebContainer-specific code patterns
4. Adapt build configuration if needed
5. Test locally before deployment

---

## References

- **Official Documentation**: https://developer.stackblitz.com
- **WebContainers API**: https://webcontainers.io
- **Bolt Repository**: https://github.com/stackblitz/bolt.new
- **Bolt.diy Repository**: https://github.com/stackblitz-labs/bolt.diy
- **Remix Framework**: https://remix.run
- **Vite Build Tool**: https://vitejs.dev

