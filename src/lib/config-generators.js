/**
 * Configuration File Generators
 *
 * Generates required config files (serve.json, tsconfig.json) for AI-generated projects
 *
 * @module lib/config-generators
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Generate serve.json for static file serving with optimal caching
 *
 * @param {string} projectDir - Project directory path
 * @param {Object} options - Generation options
 * @param {string} options.publicDir - Public directory (default: 'dist')
 * @param {boolean} options.spa - Single Page Application mode (default: true)
 * @returns {Promise<Object>} Generation result
 */
export async function generateServeJson(projectDir, options = {}) {
  const {
    publicDir = 'dist',
    spa = true
  } = options;

  const serveJsonPath = path.join(projectDir, 'serve.json');

  // Check if serve.json already exists
  try {
    await fs.access(serveJsonPath);
    return {
      created: false,
      path: serveJsonPath,
      message: 'serve.json already exists'
    };
  } catch (error) {
    // File doesn't exist, create it
  }

  const serveConfig = {
    public: publicDir,
    cleanUrls: true,
    trailingSlash: false,
    headers: [
      {
        source: '**/*.@(js|css|woff|woff2|ttf|eot|otf|svg|png|jpg|jpeg|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '**/*.@(mp4|webm|ogg|mp3|wav|flac|aac)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      },
      {
        source: '**/*.@(html|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ],
    directoryListing: false
  };

  // Add SPA rewrite rule if enabled
  if (spa) {
    serveConfig.rewrites = [
      {
        source: '**',
        destination: '/index.html'
      }
    ];
  }

  await fs.writeFile(
    serveJsonPath,
    JSON.stringify(serveConfig, null, 2) + '\n',
    'utf8'
  );

  return {
    created: true,
    path: serveJsonPath,
    message: 'Created serve.json with optimal caching rules'
  };
}

/**
 * Generate tsconfig.json for TypeScript projects
 *
 * @param {string} projectDir - Project directory path
 * @param {Object} options - Generation options
 * @param {string} options.framework - Framework type (react, vue, etc.)
 * @param {boolean} options.strict - Enable strict mode (default: true)
 * @returns {Promise<Object>} Generation result
 */
export async function generateTsConfig(projectDir, options = {}) {
  const {
    framework = 'react',
    strict = true
  } = options;

  const tsconfigPath = path.join(projectDir, 'tsconfig.json');

  // Check if tsconfig.json already exists
  try {
    await fs.access(tsconfigPath);
    return {
      created: false,
      path: tsconfigPath,
      message: 'tsconfig.json already exists'
    };
  } catch (error) {
    // File doesn't exist, create it
  }

  const tsConfig = {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,

      /* Bundler mode */
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      // Support React-based frameworks: react, react-vite, react-webpack, react-rollup, next.js
      jsx: (framework?.includes('react') || framework === 'next.js') ? 'react-jsx' : 'preserve',

      /* Linting */
      strict,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,

      /* Path aliases */
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }]
  };

  await fs.writeFile(
    tsconfigPath,
    JSON.stringify(tsConfig, null, 2) + '\n',
    'utf8'
  );

  // Also create tsconfig.node.json for build tooling
  const tsconfigNodePath = path.join(projectDir, 'tsconfig.node.json');

  try {
    await fs.access(tsconfigNodePath);
  } catch (error) {
    const tsConfigNode = {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowSyntheticDefaultImports: true
      },
      include: ['vite.config.ts', 'vite.config.js']
    };

    await fs.writeFile(
      tsconfigNodePath,
      JSON.stringify(tsConfigNode, null, 2) + '\n',
      'utf8'
    );
  }

  return {
    created: true,
    path: tsconfigPath,
    message: 'Created tsconfig.json and tsconfig.node.json'
  };
}

/**
 * Normalize build output directory in vite.config
 * Changes 'build' to 'dist' for consistency with Dockerfile
 *
 * @param {string} projectDir - Project directory path
 * @returns {Promise<Object>} Normalization result
 */
export async function normalizeBuildOutput(projectDir) {
  const viteConfigFiles = [
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mts',
    'vite.config.mjs'
  ];

  for (const filename of viteConfigFiles) {
    const viteConfigPath = path.join(projectDir, filename);

    try {
      let content = await fs.readFile(viteConfigPath, 'utf8');

      // Check if outDir is set to 'build'
      if (content.includes("outDir: 'build'") || content.includes('outDir: "build"')) {
        // Replace with 'dist'
        content = content.replace(
          /outDir:\s*['"]build['"]/g,
          "outDir: 'dist'"
        );

        await fs.writeFile(viteConfigPath, content, 'utf8');

        return {
          normalized: true,
          file: filename,
          message: `Normalized build output directory to 'dist' in ${filename}`
        };
      }

      return {
        normalized: false,
        file: filename,
        message: `Build output already set to 'dist' in ${filename}`
      };
    } catch (error) {
      // File doesn't exist, try next one
      continue;
    }
  }

  return {
    normalized: false,
    message: 'No vite.config file found'
  };
}

/**
 * Fix docker-compose.yml context
 * Changes 'context: ../' to 'context: .' for correct build context
 *
 * @param {string} projectDir - Project directory path
 * @returns {Promise<Object>} Fix result
 */
export async function fixDockerComposeContext(projectDir) {
  const dockerComposePath = path.join(projectDir, 'docker-compose.yml');

  try {
    let content = await fs.readFile(dockerComposePath, 'utf8');

    // Check if context is set to '../'
    if (content.includes('context: ../') || content.includes('context: ..')) {
      // Replace with '.'
      content = content.replace(
        /context:\s*\.\.\/*/g,
        'context: .'
      );

      await fs.writeFile(dockerComposePath, content, 'utf8');

      return {
        fixed: true,
        path: dockerComposePath,
        message: 'Fixed docker-compose.yml context to use current directory'
      };
    }

    return {
      fixed: false,
      path: dockerComposePath,
      message: 'docker-compose.yml context already correct'
    };
  } catch (error) {
    return {
      fixed: false,
      error: error.message,
      message: 'docker-compose.yml not found or not readable'
    };
  }
}

/**
 * Detect package manager from lockfiles
 *
 * @param {string} projectDir - Project directory path
 * @returns {Promise<Object>} Package manager info
 */
export async function detectPackageManager(projectDir) {
  const lockfiles = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
    'bun.lockb': 'bun'
  };

  for (const [lockfile, manager] of Object.entries(lockfiles)) {
    try {
      await fs.access(path.join(projectDir, lockfile));
      return {
        detected: true,
        manager,
        lockfile,
        installCommand: manager === 'npm' ? 'npm install' :
                       manager === 'yarn' ? 'yarn install' :
                       manager === 'pnpm' ? 'pnpm install' :
                       'bun install'
      };
    } catch (error) {
      continue;
    }
  }

  return {
    detected: false,
    manager: 'npm',
    lockfile: null,
    installCommand: 'npm install'
  };
}

/**
 * Generate next.config.js for V0/Next.js projects
 *
 * @param {string} projectDir - Project directory path
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generation result
 */
export async function generateNextConfig(projectDir, options = {}) {
  const nextConfigFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];

  // Check if any next.config already exists
  for (const filename of nextConfigFiles) {
    try {
      const configPath = path.join(projectDir, filename);
      await fs.access(configPath);

      // File exists - check if it has output: 'standalone'
      let content = await fs.readFile(configPath, 'utf8');

      if (!content.includes("output:") && !content.includes("output =")) {
        // Add output: 'standalone' to existing config
        if (content.includes('module.exports')) {
          content = content.replace(
            /const\s+nextConfig\s*=\s*{/,
            "const nextConfig = {\n  output: 'standalone',"
          );
        } else if (content.includes('export default')) {
          content = content.replace(
            /export\s+default\s+{/,
            "export default {\n  output: 'standalone',"
          );
        }

        await fs.writeFile(configPath, content, 'utf8');

        return {
          created: false,
          modified: true,
          path: configPath,
          message: `Added output: 'standalone' to ${filename} for Docker optimization`
        };
      }

      return {
        created: false,
        modified: false,
        path: configPath,
        message: `${filename} already has standalone output configured`
      };
    } catch (error) {
      continue;
    }
  }

  // No next.config exists - create one
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
}

module.exports = nextConfig
`;

  const configPath = path.join(projectDir, 'next.config.js');
  await fs.writeFile(configPath, nextConfig, 'utf8');

  return {
    created: true,
    modified: false,
    path: configPath,
    message: 'Created next.config.js with standalone output for Docker'
  };
}

/**
 * Fix Remix/Bolt build output structure
 * Remix outputs to build/server and build/client by default
 *
 * @param {string} projectDir - Project directory path
 * @returns {Promise<Object>} Fix result
 */
export async function fixRemixBuildOutput(projectDir) {
  const remixConfigFiles = ['remix.config.js', 'remix.config.ts'];

  for (const filename of remixConfigFiles) {
    try {
      const configPath = path.join(projectDir, filename);
      await fs.access(configPath);

      return {
        fixed: false,
        path: configPath,
        message: `${filename} exists - Remix build output already configured`
      };
    } catch (error) {
      continue;
    }
  }

  // Check if this is actually a Remix project
  try {
    const packageJsonPath = path.join(projectDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    const isRemix = packageJson.dependencies?.['@remix-run/react'] ||
                   packageJson.devDependencies?.['@remix-run/dev'];

    if (!isRemix) {
      return {
        fixed: false,
        message: 'Not a Remix project - skipping Remix config'
      };
    }

    // Check if @remix-run/serve is in dependencies
    const hasServe = packageJson.dependencies?.['@remix-run/serve'];

    if (hasServe) {
      return {
        fixed: false,
        message: 'Remix detected - @remix-run/serve already installed'
      };
    }

    return {
      fixed: false,
      needsServe: true,
      message: 'Remix detected - consider adding @remix-run/serve for production'
    };
  } catch (error) {
    return {
      fixed: false,
      error: error.message,
      message: 'Could not analyze Remix configuration'
    };
  }
}

/**
 * Run all configuration fixes and generators
 *
 * @param {string} projectDir - Project directory path
 * @param {Object} options - Options for generators
 * @param {string} options.tool - Tool name (figma-make, lovable, bolt, v0)
 * @returns {Promise<Object>} Combined results
 */
export async function runAllConfigFixes(projectDir, options = {}) {
  const { tool = 'unknown' } = options;

  const results = {
    packageManager: null,
    serveJson: null,
    tsConfig: null,
    buildOutput: null,
    dockerCompose: null,
    nextConfig: null,
    remixBuild: null
  };

  // Detect package manager (all tools)
  try {
    results.packageManager = await detectPackageManager(projectDir);
  } catch (error) {
    results.packageManager = { error: error.message };
  }

  // Generate serve.json (figma-make, lovable only - not SSR tools)
  if (tool === 'figma-make' || tool === 'lovable') {
    try {
      results.serveJson = await generateServeJson(projectDir, options);
    } catch (error) {
      results.serveJson = { error: error.message };
    }
  }

  // Generate tsconfig.json (all tools)
  try {
    results.tsConfig = await generateTsConfig(projectDir, options);
  } catch (error) {
    results.tsConfig = { error: error.message };
  }

  // Normalize build output (figma-make, lovable, bolt - not v0)
  if (tool !== 'v0') {
    try {
      results.buildOutput = await normalizeBuildOutput(projectDir);
    } catch (error) {
      results.buildOutput = { error: error.message };
    }
  }

  // Fix docker-compose context (all tools)
  try {
    results.dockerCompose = await fixDockerComposeContext(projectDir);
  } catch (error) {
    results.dockerCompose = { error: error.message };
  }

  // Generate/fix next.config.js (v0 only)
  if (tool === 'v0') {
    try {
      results.nextConfig = await generateNextConfig(projectDir, options);
    } catch (error) {
      results.nextConfig = { error: error.message };
    }
  }

  // Fix Remix build output (bolt only)
  if (tool === 'bolt') {
    try {
      results.remixBuild = await fixRemixBuildOutput(projectDir);
    } catch (error) {
      results.remixBuild = { error: error.message };
    }
  }

  return results;
}

export default {
  generateServeJson,
  generateTsConfig,
  normalizeBuildOutput,
  fixDockerComposeContext,
  runAllConfigFixes
};
