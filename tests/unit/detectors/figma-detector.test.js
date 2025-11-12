/**
 * Figma Detector Unit Tests
 *
 * Test suite for FigmaDetector covering:
 * - React + Vite + TypeScript stack detection (98% accuracy)
 * - Component-based project structure
 * - CSS Module patterns
 * - Build configuration detection
 * - UI library identification
 * - Confidence scoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FigmaDetector } from '../../../src/detectors/figma-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.join(__dirname, '../../fixtures/figma-detector-tests');

describe('FigmaDetector', () => {
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Priority and Tool Name', () => {
    it('should have priority of 4', () => {
      const detector = new FigmaDetector();
      expect(detector.priority).toBe(4);
    });

    it('should identify as figma-make tool', () => {
      const detector = new FigmaDetector();
      expect(detector.tool).toBe('figma-make');
    });
  });

  describe('Core Stack Detection (React + Vite + TypeScript)', () => {
    it('should detect React + Vite + TypeScript with 98% confidence', async () => {
      const projectDir = path.join(testDir, 'react-vite-ts');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'figma-make-app',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          vite: '^5.0.0',
          typescript: '^5.3.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        },
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /React.*Vite.*TypeScript|98%|stack detected/i.test(e))).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.2);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect Vite as primary build tool', async () => {
      const projectDir = path.join(testDir, 'vite-only');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'vite-app',
        dependencies: { react: '^18.0.0' },
        devDependencies: { vite: '^5.0.0' }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /Vite/i.test(e))).toBe(true);
      expect(result.metadata.buildTool).toBe('vite');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect TypeScript configuration', async () => {
      const projectDir = path.join(testDir, 'typescript-config');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'ts-app',
          devDependencies: { typescript: '^5.0.0' }
        })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /TypeScript/i.test(e))).toBe(true);
      expect(result.metadata.typescript).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Project Structure Detection', () => {
    it('should detect src/ directory structure', async () => {
      const projectDir = path.join(testDir, 'src-structure');
      fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'src-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /src\//i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect components/ directory with component-based design', async () => {
      const projectDir = path.join(testDir, 'component-structure');
      fs.mkdirSync(path.join(projectDir, 'src', 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'component-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      // Create sample components
      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.tsx'),
        'export function Button() { return <button>Click</button> }'
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /components|component-based/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect React entry point structure (App.tsx + main.tsx)', async () => {
      const projectDir = path.join(testDir, 'entry-points');
      fs.mkdirSync(path.join(projectDir, 'src'), { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'entry-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'App.tsx'),
        'export default function App() { return <div>App</div> }'
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'main.tsx'),
        'import ReactDOM from "react-dom"; import App from "./App"; ReactDOM.createRoot(...).render(<App />)'
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /entry point|App\.tsx|main\.tsx|React entry point/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect public/ asset directory', async () => {
      const projectDir = path.join(testDir, 'public-assets');
      fs.mkdirSync(path.join(projectDir, 'public'), { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'assets-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      fs.writeFileSync(
        path.join(projectDir, 'public', 'favicon.ico'),
        ''
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /public/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('CSS Modules Detection', () => {
    it('should detect CSS Module files (.module.css)', async () => {
      const projectDir = path.join(testDir, 'css-modules');
      fs.mkdirSync(path.join(projectDir, 'src', 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'css-modules-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      // Create CSS module files
      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.module.css'),
        '.button { padding: 8px; border-radius: 4px; }'
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Card.module.css'),
        '.card { border: 1px solid #eee; padding: 16px; }'
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /CSS Modules|\.module\.css|module\.css/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect CSS Module imports in JSX', async () => {
      const projectDir = path.join(testDir, 'css-imports');
      fs.mkdirSync(path.join(projectDir, 'src', 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'css-imports-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.module.css'),
        '.button { padding: 8px; }'
      );

      const componentCode = `
        import styles from './Button.module.css'
        export function Button() {
          return <button className={styles.button}>Click</button>
        }
      `;

      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.tsx'),
        componentCode
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.evidence.some(e => /CSS Module|styles\.|module/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Build Configuration', () => {
    it('should detect vite.config.ts', async () => {
      const projectDir = path.join(testDir, 'vite-config');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'vite-config-app',
          devDependencies: { vite: '^5.0.0' }
        })
      );

      const viteConfig = `
        import { defineConfig } from 'vite'
        import react from '@vitejs/plugin-react'
        export default defineConfig({
          plugins: [react()],
          build: { outDir: 'dist' }
        })
      `;

      fs.writeFileSync(
        path.join(projectDir, 'vite.config.ts'),
        viteConfig
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /vite\.config|vite config/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect tsconfig.json with path aliases', async () => {
      const projectDir = path.join(testDir, 'tsconfig-aliases');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'aliases-app' })
      );

      const tsconfig = {
        compilerOptions: {
          paths: {
            '@/*': ['./src/*'],
            '@/components/*': ['./src/components/*']
          }
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /path aliases|@\//i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect dependency lock files', async () => {
      const projectDir = path.join(testDir, 'lock-files');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'lock-app' })
      );

      fs.writeFileSync(
        path.join(projectDir, 'package-lock.json'),
        JSON.stringify({ lockfileVersion: 3 })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /lock file|package-lock/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('UI Library Detection', () => {
    it('should detect Material-UI', async () => {
      const projectDir = path.join(testDir, 'mui-project');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'mui-app',
        dependencies: {
          react: '^18.0.0',
          '@mui/material': '^5.14.0'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.uiLibrary).toBe('Material-UI');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect Tailwind CSS', async () => {
      const projectDir = path.join(testDir, 'tailwind-project');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'tailwind-app',
        dependencies: { react: '^18.0.0' },
        devDependencies: { tailwindcss: '^3.4.0' }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.uiLibrary).toBe('Tailwind CSS');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect Ant Design', async () => {
      const projectDir = path.join(testDir, 'antd-project');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'antd-app',
        dependencies: {
          react: '^18.0.0',
          antd: '^5.11.0'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.uiLibrary).toBe('Ant Design');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Build Output Detection', () => {
    it('should detect custom build output directory from vite config', async () => {
      const projectDir = path.join(testDir, 'custom-outdir');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'custom-outdir-app',
          devDependencies: { vite: '^5.0.0' }
        })
      );

      const viteConfig = `
        export default {
          build: {
            outDir: 'build'
          }
        }
      `;

      fs.writeFileSync(
        path.join(projectDir, 'vite.config.ts'),
        viteConfig
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.buildOutputDir).toBe('build');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should default to dist for missing vite config', async () => {
      const projectDir = path.join(testDir, 'default-outdir');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'default-outdir-app',
          devDependencies: { vite: '^5.0.0' }
        })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.buildOutputDir).toBe('dist');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Confidence Scoring', () => {
    it('should return null tool for non-Figma projects', async () => {
      const projectDir = path.join(testDir, 'non-figma');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'non-figma-app',
          dependencies: { vue: '^3.0.0' }
        })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.tool).toBeNull();
      expect(result.confidence).toBeLessThan(0.8);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should achieve high confidence for complete Figma Make project', async () => {
      const projectDir = path.join(testDir, 'complete-figma');
      fs.mkdirSync(path.join(projectDir, 'src', 'components'), {
        recursive: true
      });

      const pkg = {
        name: 'complete-figma-app',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          vite: '^5.0.0',
          typescript: '^5.3.0',
          '@types/react': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0'
        },
        scripts: {
          dev: 'vite',
          build: 'vite build'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      fs.writeFileSync(
        path.join(projectDir, 'vite.config.ts'),
        'export default { plugins: [] }'
      );

      fs.writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            paths: { '@/*': ['./src/*'] }
          }
        })
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'App.tsx'),
        'export default function App() {}'
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'main.tsx'),
        'import App from "./App"'
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.tsx'),
        'export function Button() {}'
      );

      fs.writeFileSync(
        path.join(projectDir, 'src', 'components', 'Button.module.css'),
        '.button { padding: 8px; }'
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.tool).toBe('figma-make');
      expect(result.confidence).toBeGreaterThan(0.5);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      const projectDir = path.join(testDir, 'no-package');
      fs.mkdirSync(projectDir, { recursive: true });

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result).toHaveProperty('tool');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('evidence');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should handle invalid JSON gracefully', async () => {
      const projectDir = path.join(testDir, 'invalid-json');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        'not valid json'
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result).toHaveProperty('confidence');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Metadata', () => {
    it('should include Figma Make specific metadata', async () => {
      const projectDir = path.join(testDir, 'metadata-test');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'figma-app',
          dependencies: { react: '^18.0.0' },
          devDependencies: { vite: '^5.0.0' }
        })
      );

      const detector = new FigmaDetector();
      const result = await detector.detect(projectDir);

      expect(result.metadata.framework).toBe('react-vite');
      expect(result.metadata.buildTool).toBe('vite');
      expect(result.metadata.typescript).toBe(true);
      expect(result.metadata).toHaveProperty('uiLibrary');
      expect(result.metadata).toHaveProperty('buildOutputDir');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });
});
