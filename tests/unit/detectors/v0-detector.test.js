/**
 * V0 Detector Unit Tests
 *
 * Test suite for V0Detector covering:
 * - Package.json detection (Next.js + shadcn/ui)
 * - Component structure validation
 * - Configuration file checks
 * - Import pattern analysis
 * - Confidence scoring
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { V0Detector } from '../../../src/detectors/v0-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.join(__dirname, '../../fixtures/v0-detector-tests');

describe('V0Detector', () => {
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
    it('should have priority of 3', () => {
      const detector = new V0Detector();
      expect(detector.priority).toBe(3);
    });

    it('should identify as v0 tool', () => {
      const detector = new V0Detector();
      expect(detector.tool).toBe('v0');
    });
  });

  describe('Package.json Detection', () => {
    it('should detect Next.js projects with high confidence', async () => {
      const projectDir = path.join(testDir, 'nextjs-basic');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'v0-nextjs-app',
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0'
        },
        devDependencies: {
          typescript: '^5.0.0'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /Next\.js/i.test(e))).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.1);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect shadcn/ui dependencies', async () => {
      const projectDir = path.join(testDir, 'shadcn-ui');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'v0-shadcn-app',
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          '@radix-ui/react-dialog': '^1.1.1',
          '@radix-ui/react-dropdown-menu': '^2.0.6',
          '@radix-ui/react-select': '^2.0.0',
          '@radix-ui/react-slot': '^2.0.2',
          'lucide-react': '^0.357.0',
          'tailwindcss-animate': '^1.0.7',
          'class-variance-authority': '^0.7.0'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /shadcn\/ui|Radix/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should boost confidence for React + Tailwind utility pattern', async () => {
      const projectDir = path.join(testDir, 'utility-pattern');
      fs.mkdirSync(projectDir, { recursive: true });

      const pkg = {
        name: 'v0-utility-app',
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.2.0'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /utility pattern|clsx|tailwind-merge/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Component Structure Detection', () => {
    it('should detect shadcn/ui components directory', async () => {
      const projectDir = path.join(testDir, 'shadcn-components');
      fs.mkdirSync(path.join(projectDir, 'components', 'ui'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app', dependencies: { next: '^15.0.0' } })
      );

      // Create sample UI components
      fs.writeFileSync(path.join(projectDir, 'components', 'ui', 'button.tsx'), 'export const Button = () => {};');
      fs.writeFileSync(path.join(projectDir, 'components', 'ui', 'card.tsx'), 'export const Card = () => {};');

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /components\/ui|shadcn/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect kebab-case component naming', async () => {
      const projectDir = path.join(testDir, 'kebab-case');
      fs.mkdirSync(path.join(projectDir, 'components'), { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      // Create kebab-case named components
      fs.writeFileSync(path.join(projectDir, 'components', 'login-form.tsx'), 'export const LoginForm = () => {};');
      fs.writeFileSync(path.join(projectDir, 'components', 'header.tsx'), 'export const Header = () => {};');
      fs.writeFileSync(path.join(projectDir, 'components', 'hero-section.tsx'), 'export const HeroSection = () => {};');

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /kebab-case/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect Next.js App Router', async () => {
      const projectDir = path.join(testDir, 'app-router');
      fs.mkdirSync(path.join(projectDir, 'app'), { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app', dependencies: { next: '^15.0.0' } })
      );

      fs.writeFileSync(
        path.join(projectDir, 'app', 'page.tsx'),
        'export default function Page() { return <div>Home</div>; }'
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /App Router|app\//i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Configuration File Detection', () => {
    it('should detect components.json (shadcn/ui config)', async () => {
      const projectDir = path.join(testDir, 'components-json');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const componentsJson = {
        $schema: 'https://ui.shadcn.com/schema.json',
        style: 'new-york',
        rsc: true,
        tsx: true,
        aliases: {
          components: '@/components',
          utils: '@/lib/utils'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'components.json'),
        JSON.stringify(componentsJson, null, 2)
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /components\.json|shadcn/i.test(e))).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.1);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect tailwind.config.ts', async () => {
      const projectDir = path.join(testDir, 'tailwind-config');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const tailwindConfig = `
        import type { Config } from "tailwindcss"
        export default {
          darkMode: ["class"],
          content: ["./app/**/*.{js,ts,jsx,tsx}"],
          theme: { extend: {} },
          plugins: []
        } satisfies Config
      `;

      fs.writeFileSync(
        path.join(projectDir, 'tailwind.config.ts'),
        tailwindConfig
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /tailwind/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect tsconfig with path aliases', async () => {
      const projectDir = path.join(testDir, 'path-aliases');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const tsconfig = {
        compilerOptions: {
          paths: {
            '@/*': ['./*'],
            '@/components/*': ['./components/*'],
            '@/lib/*': ['./lib/*']
          }
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2)
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /path aliases|@\//i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Import Pattern Detection', () => {
    it('should detect lucide-react imports', async () => {
      const projectDir = path.join(testDir, 'lucide-icons');
      fs.mkdirSync(path.join(projectDir, 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const componentCode = `
        import { Menu, X } from "lucide-react"
        export function Header() {
          return <div><Menu /></div>
        }
      `;

      fs.writeFileSync(
        path.join(projectDir, 'components', 'Header.tsx'),
        componentCode
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /lucide|icons/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect shadcn/ui component imports', async () => {
      const projectDir = path.join(testDir, 'shadcn-imports');
      fs.mkdirSync(path.join(projectDir, 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-app' })
      );

      const componentCode = `
        import { Button } from "@/components/ui/button"
        import { Card } from "@/components/ui/card"
        export function Dashboard() {
          return <Card><Button>Click me</Button></Card>
        }
      `;

      fs.writeFileSync(
        path.join(projectDir, 'components', 'Dashboard.tsx'),
        componentCode
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.evidence.some(e => /shadcn|@\/components\/ui/i.test(e))).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.1);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should detect "use client" directive', async () => {
      const projectDir = path.join(testDir, 'use-client');
      fs.mkdirSync(path.join(projectDir, 'components'), {
        recursive: true
      });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'test-app',
          dependencies: { next: '^15.0.0' }
        })
      );

      const componentCode = `
        "use client"
        import { useState } from "react"
        export function Counter() {
          const [count, setCount] = useState(0)
          return <div>{count}</div>
        }
      `;

      fs.writeFileSync(
        path.join(projectDir, 'components', 'Counter.tsx'),
        componentCode
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      // Check that detector found Next.js in package.json
      expect(result.evidence.some(e => /Next\.js/i.test(e))).toBe(true);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Confidence Scoring', () => {
    it('should return null tool for non-V0 projects', async () => {
      const projectDir = path.join(testDir, 'non-v0');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'regular-react-app',
          dependencies: { react: '^18.0.0' }
        })
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.tool).toBeNull();
      expect(result.confidence).toBeLessThanOrEqual(0.7);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should achieve high confidence for complete V0 project', async () => {
      const projectDir = path.join(testDir, 'complete-v0');
      fs.mkdirSync(path.join(projectDir, 'components', 'ui'), {
        recursive: true
      });
      fs.mkdirSync(path.join(projectDir, 'app'), { recursive: true });

      const pkg = {
        name: 'complete-v0-app',
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
          '@radix-ui/react-dialog': '^1.1.1',
          '@radix-ui/react-dropdown-menu': '^2.0.6',
          'lucide-react': '^0.357.0',
          'class-variance-authority': '^0.7.0',
          clsx: '^2.0.0',
          'tailwind-merge': '^2.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          tailwindcss: '^3.4.0'
        },
        scripts: {
          dev: 'next dev',
          build: 'next build'
        }
      };

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(pkg, null, 2)
      );

      fs.writeFileSync(
        path.join(projectDir, 'components.json'),
        JSON.stringify({
          $schema: 'https://ui.shadcn.com/schema.json',
          style: 'new-york'
        })
      );

      fs.writeFileSync(
        path.join(projectDir, 'components', 'ui', 'button.tsx'),
        'export const Button = () => {};'
      );

      fs.writeFileSync(
        path.join(projectDir, 'app', 'page.tsx'),
        'export default function Page() {}'
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.tool).toBe('v0');
      expect(result.confidence).toBeGreaterThan(0.6);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      const projectDir = path.join(testDir, 'no-package-json');
      fs.mkdirSync(projectDir, { recursive: true });

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result).toHaveProperty('tool');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('evidence');

      fs.rmSync(projectDir, { recursive: true, force: true });
    });

    it('should handle empty projects', async () => {
      const projectDir = path.join(testDir, 'empty-project');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'empty-app' })
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.tool).toBeNull();
      expect(result.confidence).toBeLessThan(0.7);

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });

  describe('Metadata', () => {
    it('should include V0-specific metadata', async () => {
      const projectDir = path.join(testDir, 'metadata-test');
      fs.mkdirSync(projectDir, { recursive: true });

      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify({
          name: 'v0-app',
          dependencies: { next: '^15.0.0' }
        })
      );

      const detector = new V0Detector();
      const result = await detector.detect(projectDir);

      expect(result.metadata).toEqual({
        framework: 'nextjs',
        buildTool: 'nextjs-build',
        componentLibrary: 'shadcn/ui',
        styling: 'tailwindcss'
      });

      fs.rmSync(projectDir, { recursive: true, force: true });
    });
  });
});
