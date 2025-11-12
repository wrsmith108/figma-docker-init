# Bolt Project Detection Utilities

Complete, production-ready detection logic for identifying and analyzing Bolt projects.

---

## Table of Contents

1. [Single-File Detection Utility](#single-file-detection-utility)
2. [Configuration Analysis](#configuration-analysis)
3. [Framework Detection](#framework-detection)
4. [WebContainer Compatibility Check](#webcontainer-compatibility-check)
5. [Project Structure Analyzer](#project-structure-analyzer)
6. [Integration Examples](#integration-examples)

---

## Single-File Detection Utility

### `detectBolt.ts`

```typescript
import { readFileSync, existsSync, lstatSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Complete Bolt project detection utility
 * Usage: const result = detectBolt('/path/to/project');
 */
export class BoltDetector {
  private projectPath: string;
  private confidence: number = 0;
  private indicators: string[] = [];

  constructor(projectPath: string) {
    this.projectPath = resolve(projectPath);
  }

  /**
   * Run full detection
   */
  public detect(): BoltDetectionResult {
    this.confidence = 0;
    this.indicators = [];

    this.checkStackBlitzConfig();
    this.checkPackageJson();
    this.checkDirectoryStructure();
    this.checkBuildTools();
    this.checkFrameworks();

    return {
      isBolt: this.confidence > 0.5,
      confidence: Math.min(this.confidence, 1.0),
      indicators: this.indicators,
      projectPath: this.projectPath,
      details: {
        confidence_breakdown: {
          stackblitz_config: 0.3,
          package_json: 0.3,
          directory_structure: 0.2,
          build_tools: 0.1,
          frameworks: 0.1,
        },
      },
    };
  }

  /**
   * Check for StackBlitz configuration
   */
  private checkStackBlitzConfig(): void {
    const rcPath = join(this.projectPath, '.stackblitzrc');
    const pkgPath = join(this.projectPath, 'package.json');

    // Check .stackblitzrc
    if (existsSync(rcPath)) {
      try {
        const config = JSON.parse(readFileSync(rcPath, 'utf8'));
        this.indicators.push('Has .stackblitzrc configuration file');
        this.confidence += 0.25;

        if (config.startCommand) {
          this.indicators.push(`Configured start command: ${config.startCommand}`);
        }
      } catch (error) {
        console.error('Error reading .stackblitzrc:', error);
      }
    }

    // Check package.json for stackblitz field
    if (existsSync(pkgPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (packageJson.stackblitz) {
          this.indicators.push('Has stackblitz field in package.json');
          this.confidence += 0.3;

          if (packageJson.stackblitz.installDependencies !== undefined) {
            this.indicators.push(
              `installDependencies: ${packageJson.stackblitz.installDependencies}`
            );
          }
        }
      } catch (error) {
        console.error('Error reading package.json:', error);
      }
    }
  }

  /**
   * Analyze package.json for Bolt indicators
   */
  private checkPackageJson(): void {
    const pkgPath = join(this.projectPath, 'package.json');

    if (!existsSync(pkgPath)) return;

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for Remix (primary Bolt framework)
      if (allDeps.remix || allDeps['@remix-run/node']) {
        this.indicators.push('Uses Remix framework (Bolt native)');
        this.confidence += 0.25;
      }

      // Check for AI SDK
      if (allDeps.ai) {
        this.indicators.push('Uses AI SDK (Anthropic integration)');
        this.confidence += 0.1;
      }

      // Check for common Bolt stack
      const boltIndicators = {
        vite: 0.05,
        '@vitejs/plugin-react': 0.05,
        react: 0.03,
        'react-dom': 0.03,
        typescript: 0.02,
        zustand: 0.02,
        tailwindcss: 0.02,
        'unocss': 0.02,
      };

      for (const [dep, points] of Object.entries(boltIndicators)) {
        if (allDeps[dep]) {
          this.indicators.push(`Uses ${dep}`);
          this.confidence += points;
        }
      }

      // Check scripts for Remix/Vite patterns
      const scripts = packageJson.scripts || {};
      for (const [name, command] of Object.entries(scripts)) {
        if (
          /remix.*vite|vite.*build|remix.*dev/i.test(command as string)
        ) {
          this.indicators.push(`Build script: ${name}`);
        }
      }
    } catch (error) {
      console.error('Error analyzing package.json:', error);
    }
  }

  /**
   * Check directory structure
   */
  private checkDirectoryStructure(): void {
    const expectedDirs = {
      'app': 0.1,
      'app/routes': 0.1,
      'app/components': 0.05,
      'public': 0.02,
      'types': 0.02,
    };

    for (const [dir, points] of Object.entries(expectedDirs)) {
      const dirPath = join(this.projectPath, dir);
      if (existsSync(dirPath) && lstatSync(dirPath).isDirectory()) {
        this.indicators.push(`Has ${dir} directory`);
        this.confidence += points;
      }
    }
  }

  /**
   * Check build tools configuration
   */
  private checkBuildTools(): void {
    const configFiles = {
      'vite.config.ts': 'Vite configuration',
      'vite.config.js': 'Vite configuration',
      'remix.config.js': 'Remix configuration',
      'remix.config.ts': 'Remix configuration',
      'tsconfig.json': 'TypeScript configuration',
    };

    for (const [file, description] of Object.entries(configFiles)) {
      const filePath = join(this.projectPath, file);
      if (existsSync(filePath)) {
        this.indicators.push(`Has ${description} (${file})`);
        this.confidence += 0.02;
      }
    }
  }

  /**
   * Check for supported frameworks
   */
  private checkFrameworks(): void {
    const pkgPath = join(this.projectPath, 'package.json');

    if (!existsSync(pkgPath)) return;

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const frameworks = ['react', 'vue', 'svelte', 'angular', 'next', 'nuxt'];
      for (const framework of frameworks) {
        if (allDeps[framework]) {
          this.indicators.push(`Uses ${framework} framework`);
        }
      }
    } catch (error) {
      console.error('Error checking frameworks:', error);
    }
  }
}

/**
 * Detection result interface
 */
export interface BoltDetectionResult {
  isBolt: boolean;
  confidence: number;
  indicators: string[];
  projectPath: string;
  details: {
    confidence_breakdown: Record<string, number>;
  };
}

// Export convenience function
export function detectBolt(projectPath: string): BoltDetectionResult {
  return new BoltDetector(projectPath).detect();
}

// Example usage:
// const result = detectBolt('/path/to/project');
// console.log(`Is Bolt project: ${result.isBolt}`);
// console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
// console.log('Indicators:', result.indicators);
```

---

## Configuration Analysis

### `configAnalyzer.ts`

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Analyze StackBlitz and Bolt configurations
 */
export class ConfigAnalyzer {
  constructor(private projectPath: string) {}

  /**
   * Read and parse .stackblitzrc
   */
  public getStackBlitzRc(): StackBlitzConfig | null {
    const rcPath = join(this.projectPath, '.stackblitzrc');

    if (!existsSync(rcPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(rcPath, 'utf8'));
    } catch (error) {
      console.error('Error parsing .stackblitzrc:', error);
      return null;
    }
  }

  /**
   * Extract stackblitz field from package.json
   */
  public getPackageJsonStackBlitz(): StackBlitzConfig | null {
    const pkgPath = join(this.projectPath, 'package.json');

    if (!existsSync(pkgPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      return packageJson.stackblitz || null;
    } catch (error) {
      console.error('Error parsing package.json:', error);
      return null;
    }
  }

  /**
   * Get effective configuration (merging sources)
   */
  public getEffectiveConfig(): StackBlitzConfig {
    const rcConfig = this.getStackBlitzRc() || {};
    const pkgConfig = this.getPackageJsonStackBlitz() || {};

    return {
      installDependencies: rcConfig.installDependencies ?? pkgConfig.installDependencies ?? true,
      startCommand: rcConfig.startCommand ?? pkgConfig.startCommand ?? 'npm start',
      compileTrigger: rcConfig.compileTrigger ?? pkgConfig.compileTrigger ?? 'auto',
      env: {
        ...pkgConfig.env,
        ...rcConfig.env,
      },
    };
  }

  /**
   * Validate configuration
   */
  public validateConfig(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const config = this.getEffectiveConfig();

    // Validate startCommand
    if (config.startCommand && typeof config.startCommand !== 'string') {
      errors.push('startCommand must be a string');
    }

    // Validate compileTrigger
    if (config.compileTrigger && !['auto', 'save'].includes(config.compileTrigger)) {
      errors.push('compileTrigger must be "auto" or "save"');
    }

    // Validate env
    if (config.env && typeof config.env !== 'object') {
      errors.push('env must be an object');
    }

    // Warn about missing startCommand
    if (!config.startCommand) {
      warnings.push('No startCommand configured');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export interface StackBlitzConfig {
  installDependencies?: boolean;
  startCommand?: string;
  compileTrigger?: 'auto' | 'save';
  env?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Example usage:
// const analyzer = new ConfigAnalyzer('/path/to/project');
// const config = analyzer.getEffectiveConfig();
// const validation = analyzer.validateConfig();
```

---

## Framework Detection

### `frameworkDetector.ts`

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Detect and analyze frameworks used in project
 */
export class FrameworkDetector {
  constructor(private projectPath: string) {}

  /**
   * Detect all frameworks in project
   */
  public detectFrameworks(): FrameworkInfo[] {
    const frameworks: FrameworkInfo[] = [];
    const packageJson = this.readPackageJson();

    if (!packageJson) return frameworks;

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Define framework signatures
    const frameworkSignatures: FrameworkSignature[] = [
      {
        name: 'React',
        packages: ['react'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 10,
      },
      {
        name: 'Vue 3',
        packages: ['vue'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 10,
      },
      {
        name: 'Svelte',
        packages: ['svelte'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 10,
      },
      {
        name: 'Angular',
        packages: ['@angular/core'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 10,
      },
      {
        name: 'Next.js',
        packages: ['next'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 15,
      },
      {
        name: 'Nuxt',
        packages: ['nuxt'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 15,
      },
      {
        name: 'Remix',
        packages: ['remix', '@remix-run/node'],
        webcontainerCompatible: true,
        isBoltNative: true,
        priority: 20,
      },
      {
        name: 'SvelteKit',
        packages: ['@sveltejs/kit'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 15,
      },
      {
        name: 'Astro',
        packages: ['astro'],
        webcontainerCompatible: true,
        isBoltNative: false,
        priority: 15,
      },
    ];

    // Check each framework
    for (const sig of frameworkSignatures) {
      for (const pkg of sig.packages) {
        if (allDeps[pkg]) {
          frameworks.push({
            name: sig.name,
            version: allDeps[pkg],
            webcontainerCompatible: sig.webcontainerCompatible,
            isBoltNative: sig.isBoltNative,
            detected: true,
          });
          break; // Only add once per framework
        }
      }
    }

    // Sort by priority/importance
    return frameworks.sort((a, b) => {
      if (a.isBoltNative !== b.isBoltNative) {
        return a.isBoltNative ? -1 : 1;
      }
      return 0;
    });
  }

  /**
   * Get primary framework (most important one)
   */
  public getPrimaryFramework(): FrameworkInfo | null {
    const frameworks = this.detectFrameworks();
    return frameworks.length > 0 ? frameworks[0] : null;
  }

  /**
   * Check WebContainer compatibility
   */
  public isWebContainerCompatible(): boolean {
    const frameworks = this.detectFrameworks();

    if (frameworks.length === 0) {
      // Check for Node.js/Express
      const packageJson = this.readPackageJson();
      if (packageJson?.dependencies?.express) {
        return true;
      }
      return false;
    }

    // All detected frameworks must be compatible
    return frameworks.every((f) => f.webcontainerCompatible);
  }

  /**
   * Get framework recommendation for Bolt
   */
  public getBoltRecommendation(): BoltRecommendation {
    const primary = this.getPrimaryFramework();

    return {
      canRunInBolt: primary?.webcontainerCompatible ?? false,
      primaryFramework: primary,
      recommendation: primary
        ? `${primary.name} is WebContainer-compatible and can run in Bolt`
        : 'No recognized framework detected. Check Node.js/Express compatibility.',
      isBoltNative: primary?.isBoltNative ?? false,
    };
  }

  private readPackageJson(): any {
    const pkgPath = join(this.projectPath, 'package.json');

    if (!existsSync(pkgPath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (error) {
      console.error('Error reading package.json:', error);
      return null;
    }
  }
}

export interface FrameworkSignature {
  name: string;
  packages: string[];
  webcontainerCompatible: boolean;
  isBoltNative: boolean;
  priority: number;
}

export interface FrameworkInfo {
  name: string;
  version: string;
  webcontainerCompatible: boolean;
  isBoltNative: boolean;
  detected: boolean;
}

export interface BoltRecommendation {
  canRunInBolt: boolean;
  primaryFramework: FrameworkInfo | null;
  recommendation: string;
  isBoltNative: boolean;
}
```

---

## WebContainer Compatibility Check

### `webcontainerChecker.ts`

```typescript
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Check WebContainer compatibility for a project
 */
export class WebContainerChecker {
  constructor(private projectPath: string) {}

  /**
   * Comprehensive compatibility check
   */
  public checkCompatibility(): CompatibilityReport {
    const report: CompatibilityReport = {
      compatible: true,
      score: 100,
      checks: [],
      warnings: [],
      errors: [],
      recommendations: [],
    };

    // Check Node.js version requirement
    this.checkNodeVersion(report);

    // Check package manager
    this.checkPackageManager(report);

    // Check build tools
    this.checkBuildTools(report);

    // Check for native dependencies
    this.checkNativeDependencies(report);

    // Check environment variables
    this.checkEnvironment(report);

    // Calculate compatibility score
    report.score = Math.max(0, 100 - (report.errors.length * 10 + report.warnings.length * 5));
    report.compatible = report.errors.length === 0;

    return report;
  }

  private checkNodeVersion(report: CompatibilityReport): void {
    const pkgPath = join(this.projectPath, 'package.json');

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const engines = packageJson.engines;

      if (!engines?.node) {
        report.checks.push('No Node.js version specified in engines');
        report.recommendations.push('Consider specifying "engines.node" in package.json');
        return;
      }

      const nodeSpec = engines.node;
      report.checks.push(`Node.js requirement: ${nodeSpec}`);

      // WebContainer supports recent Node.js versions
      // Warn about very old versions
      if (nodeSpec.includes('12') || nodeSpec.includes('11') || nodeSpec.includes('10')) {
        report.warnings.push(
          `Node.js ${nodeSpec} is outdated. WebContainer works better with Node.js 14+`
        );
      }
    } catch (error) {
      report.errors.push('Could not parse package.json');
    }
  }

  private checkPackageManager(report: CompatibilityReport): void {
    const packageManagers = {
      'pnpm-lock.yaml': 'pnpm',
      'yarn.lock': 'yarn',
      'package-lock.json': 'npm',
    };

    let detected = false;
    for (const [file, manager] of Object.entries(packageManagers)) {
      if (existsSync(join(this.projectPath, file))) {
        report.checks.push(`Uses ${manager} (${file})`);
        detected = true;
        break;
      }
    }

    if (!detected) {
      report.warnings.push('No lock file detected. WebContainer prefers pnpm, yarn, or npm.');
    }
  }

  private checkBuildTools(report: CompatibilityReport): void {
    const webcontainerCompatibleTools = {
      'vite': 'Build tool (Excellent WC support)',
      'webpack': 'Module bundler (Good WC support)',
      'parcel': 'Zero-config bundler (Good WC support)',
      'esbuild': 'JavaScript bundler (Good WC support)',
      'rollup': 'Module bundler (Good WC support)',
      'next': 'Next.js (Excellent WC support)',
      'remix': 'Remix (Excellent WC support)',
      'astro': 'Astro (Good WC support)',
      'sveltekit': 'SvelteKit (Excellent WC support)',
      'nuxt': 'Nuxt (Good WC support)',
    };

    const problematicTools = {
      'gulp': 'Gulp (Task runner - may have issues)',
      'make': 'Make (System-level - incompatible)',
      'cmake': 'CMake (Build system - incompatible)',
    };

    const pkgPath = join(this.projectPath, 'package.json');

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      let foundCompatible = false;

      for (const [tool, description] of Object.entries(webcontainerCompatibleTools)) {
        if (allDeps[tool]) {
          report.checks.push(`${description}`);
          foundCompatible = true;
        }
      }

      for (const [tool, description] of Object.entries(problematicTools)) {
        if (allDeps[tool]) {
          report.errors.push(`${description} detected`);
        }
      }

      if (!foundCompatible) {
        report.warnings.push('No recognized WebContainer-compatible build tool detected');
      }
    } catch (error) {
      report.errors.push('Could not analyze build tools');
    }
  }

  private checkNativeDependencies(report: CompatibilityReport): void {
    const pkgPath = join(this.projectPath, 'package.json');

    try {
      const packageJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Common native dependencies that might cause issues
      const nativeDeps = ['node-gyp', 'node-pre-gyp', 'prebuild-install'];

      for (const dep of nativeDeps) {
        if (allDeps[dep]) {
          report.warnings.push(
            `${dep} detected - may require native compilation in WebContainer`
          );
        }
      }
    } catch (error) {
      // Ignore errors
    }
  }

  private checkEnvironment(report: CompatibilityReport): void {
    const envPath = join(this.projectPath, '.env.example');
    const envLocalPath = join(this.projectPath, '.env.local');

    if (existsSync(envPath)) {
      report.checks.push('Has .env.example file');
    }

    if (existsSync(envLocalPath)) {
      report.warnings.push('.env.local found - ensure secrets are in .env.example with placeholders');
    }
  }
}

export interface CompatibilityReport {
  compatible: boolean;
  score: number;
  checks: string[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
}
```

---

## Project Structure Analyzer

### `structureAnalyzer.ts`

```typescript
import { readdirSync, lstatSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Analyze project structure
 */
export class StructureAnalyzer {
  constructor(private projectPath: string) {}

  /**
   * Map directory structure
   */
  public mapStructure(
    maxDepth: number = 3,
    ignoreDirs: Set<string> = new Set(['node_modules', '.git', 'dist', '.next', 'build'])
  ): DirectoryNode {
    return this.mapDir(this.projectPath, 0, maxDepth, ignoreDirs);
  }

  /**
   * Analyze file types and counts
   */
  public analyzeFileTypes(): FileTypeAnalysis {
    const types: Record<string, number> = {};
    const extensions: Record<string, number> = {};

    const walk = (dir: string) => {
      try {
        const files = readdirSync(dir);

        for (const file of files) {
          if (file.startsWith('.')) continue;
          if (['node_modules', 'dist', 'build', '.next'].includes(file)) continue;

          const path = join(dir, file);
          const stat = lstatSync(path);

          if (stat.isDirectory()) {
            walk(path);
          } else {
            const ext = file.split('.').pop() || 'none';
            extensions[ext] = (extensions[ext] ?? 0) + 1;

            const type = this.getFileType(ext);
            types[type] = (types[type] ?? 0) + 1;
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    walk(this.projectPath);

    return { types, extensions };
  }

  /**
   * Get typical Bolt directory pattern
   */
  public getTypicalBoltPattern(): BoltPattern {
    const structure = this.mapStructure(2);

    const hasAppDir = structure.children.some((c) => c.name === 'app');
    const hasRoutesDir = structure.children.some((c) => {
      if (c.name === 'app' && c.children) {
        return c.children.some((sub) => sub.name === 'routes');
      }
      return false;
    });

    return {
      matches_remix_pattern: hasAppDir && hasRoutesDir,
      has_app_directory: hasAppDir,
      has_routes_directory: hasRoutesDir,
      has_public_directory: structure.children.some((c) => c.name === 'public'),
      has_functions_directory: structure.children.some((c) => c.name === 'functions'),
      has_types_directory: structure.children.some((c) => c.name === 'types'),
    };
  }

  private mapDir(
    dir: string,
    depth: number,
    maxDepth: number,
    ignoreDirs: Set<string>
  ): DirectoryNode {
    const name = dir.split('/').pop() || dir;
    const node: DirectoryNode = {
      name,
      type: 'directory',
      children: [],
    };

    if (depth >= maxDepth) {
      return node;
    }

    try {
      const files = readdirSync(dir);

      for (const file of files) {
        if (file.startsWith('.') && file !== '.github') continue;
        if (ignoreDirs.has(file)) continue;

        const path = join(dir, file);
        const stat = lstatSync(path);

        if (stat.isDirectory()) {
          node.children!.push(this.mapDir(path, depth + 1, maxDepth, ignoreDirs));
        } else {
          node.children!.push({
            name: file,
            type: 'file',
          });
        }
      }
    } catch (error) {
      // Ignore permission errors
    }

    return node;
  }

  private getFileType(ext: string): string {
    const typeMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      js: 'JavaScript',
      jsx: 'JavaScript React',
      vue: 'Vue',
      svelte: 'Svelte',
      json: 'JSON',
      yaml: 'YAML',
      yml: 'YAML',
      css: 'CSS',
      scss: 'SCSS',
      less: 'LESS',
      html: 'HTML',
      md: 'Markdown',
    };

    return typeMap[ext] || 'Other';
  }
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
}

export interface FileTypeAnalysis {
  types: Record<string, number>;
  extensions: Record<string, number>;
}

export interface BoltPattern {
  matches_remix_pattern: boolean;
  has_app_directory: boolean;
  has_routes_directory: boolean;
  has_public_directory: boolean;
  has_functions_directory: boolean;
  has_types_directory: boolean;
}
```

---

## Integration Examples

### Complete Detection Workflow

```typescript
import { BoltDetector } from './detectBolt';
import { ConfigAnalyzer } from './configAnalyzer';
import { FrameworkDetector } from './frameworkDetector';
import { WebContainerChecker } from './webcontainerChecker';
import { StructureAnalyzer } from './structureAnalyzer';

/**
 * Complete Bolt project analysis
 */
export async function analyzeBoltProject(projectPath: string) {
  console.log(`Analyzing project: ${projectPath}\n`);

  // 1. Detect if it's a Bolt project
  const detector = new BoltDetector(projectPath);
  const detection = detector.detect();

  console.log('=== Bolt Detection ===');
  console.log(`Is Bolt Project: ${detection.isBolt}`);
  console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
  console.log('Indicators:', detection.indicators);

  // 2. Analyze configuration
  console.log('\n=== Configuration ===');
  const configAnalyzer = new ConfigAnalyzer(projectPath);
  const config = configAnalyzer.getEffectiveConfig();
  const validation = configAnalyzer.validateConfig();

  console.log('Start Command:', config.startCommand);
  console.log('Install Dependencies:', config.installDependencies);
  console.log('Compile Trigger:', config.compileTrigger);
  console.log('Configuration Valid:', validation.valid);
  if (validation.errors.length > 0) {
    console.log('Errors:', validation.errors);
  }
  if (validation.warnings.length > 0) {
    console.log('Warnings:', validation.warnings);
  }

  // 3. Detect frameworks
  console.log('\n=== Framework Detection ===');
  const frameworkDetector = new FrameworkDetector(projectPath);
  const frameworks = frameworkDetector.detectFrameworks();
  const primary = frameworkDetector.getPrimaryFramework();

  console.log('Primary Framework:', primary?.name || 'None detected');
  console.log('All Frameworks:');
  frameworks.forEach((f) => {
    console.log(
      `  - ${f.name} ${f.version} (WebContainer: ${f.webcontainerCompatible}, Bolt Native: ${f.isBoltNative})`
    );
  });

  // 4. Check WebContainer compatibility
  console.log('\n=== WebContainer Compatibility ===');
  const webcontainerChecker = new WebContainerChecker(projectPath);
  const compatibility = webcontainerChecker.checkCompatibility();

  console.log(`Compatible: ${compatibility.compatible}`);
  console.log(`Score: ${compatibility.score}/100`);
  console.log('Checks:', compatibility.checks);
  if (compatibility.warnings.length > 0) {
    console.log('Warnings:', compatibility.warnings);
  }
  if (compatibility.errors.length > 0) {
    console.log('Errors:', compatibility.errors);
  }

  // 5. Analyze project structure
  console.log('\n=== Project Structure ===');
  const structureAnalyzer = new StructureAnalyzer(projectPath);
  const pattern = structureAnalyzer.getTypicalBoltPattern();
  const fileAnalysis = structureAnalyzer.analyzeFileTypes();

  console.log('Matches Remix Pattern:', pattern.matches_remix_pattern);
  console.log('File Type Distribution:');
  Object.entries(fileAnalysis.types).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  // Final Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Bolt Project: ${detection.isBolt ? 'YES' : 'NO'}`);
  console.log(`Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
  console.log(`WebContainer Compatible: ${compatibility.compatible ? 'YES' : 'NO'}`);
  console.log(`Compatibility Score: ${compatibility.score}/100`);
}

// Usage:
// analyzeBoltProject('/path/to/project');
```

---

## CLI Tool Example

### `bolt-detect.cli.ts`

```typescript
#!/usr/bin/env node

import { program } from 'commander';
import { resolve } from 'path';
import { BoltDetector } from './detectBolt';
import { ConfigAnalyzer } from './configAnalyzer';
import { FrameworkDetector } from './frameworkDetector';
import { WebContainerChecker } from './webcontainerChecker';

program
  .name('bolt-detect')
  .description('Detect and analyze Bolt projects')
  .version('1.0.0');

program
  .command('detect <path>')
  .description('Detect if a project is a Bolt project')
  .action((path: string) => {
    const projectPath = resolve(path);
    const detector = new BoltDetector(projectPath);
    const result = detector.detect();

    console.log(JSON.stringify(result, null, 2));
    process.exit(result.isBolt ? 0 : 1);
  });

program
  .command('analyze <path>')
  .description('Perform complete analysis')
  .action((path: string) => {
    const projectPath = resolve(path);

    const detector = new BoltDetector(projectPath);
    const detection = detector.detect();

    const configAnalyzer = new ConfigAnalyzer(projectPath);
    const config = configAnalyzer.getEffectiveConfig();

    const frameworkDetector = new FrameworkDetector(projectPath);
    const primary = frameworkDetector.getPrimaryFramework();

    const webcontainerChecker = new WebContainerChecker(projectPath);
    const compatibility = webcontainerChecker.checkCompatibility();

    const analysis = {
      detection: {
        isBolt: detection.isBolt,
        confidence: detection.confidence,
        indicators: detection.indicators,
      },
      config: config,
      framework: {
        primary: primary?.name,
        version: primary?.version,
        webcontainerCompatible: primary?.webcontainerCompatible,
      },
      compatibility: {
        compatible: compatibility.compatible,
        score: compatibility.score,
      },
    };

    console.log(JSON.stringify(analysis, null, 2));
  });

program.parse(process.argv);
```

---

## Summary

These utilities provide:

1. **Detection**: Identify Bolt projects with confidence scoring
2. **Configuration Analysis**: Parse and validate StackBlitz configs
3. **Framework Detection**: Identify supported frameworks
4. **Compatibility Checking**: Verify WebContainer compatibility
5. **Structure Analysis**: Map and analyze project structure
6. **Integration**: Combined workflows for complete analysis

All code is TypeScript with proper type definitions and error handling.
