/**
 * Test Fixtures for Phase 2 Template System
 *
 * Provides sample data for all 4 tool types:
 * - Lovable project structures
 * - Bolt project structures
 * - V0 project structures
 * - Figma Make project structures
 *
 * Also includes:
 * - Sample detection results
 * - Expected template outputs
 * - Environment variable sets
 */

export const sampleDetections = {
  lovable: {
    minimal: {
      tool: 'lovable',
      confidence: 0.95,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        backend: 'supabase',
        language: 'typescript',
        styling: 'tailwind'
      },
      evidence: [
        'Found lovable-tagger in devDependencies',
        'Found componentTagger in vite.config.ts',
        'Detected Supabase integration'
      ]
    },
    full: {
      tool: 'lovable',
      confidence: 0.98,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        backend: 'supabase',
        database: 'postgresql',
        language: 'typescript',
        styling: 'tailwind',
        uiLibrary: 'shadcn',
        routing: 'react-router'
      },
      evidence: [
        'Found lovable-tagger@1.1.0 in devDependencies',
        'Found componentTagger in vite.config.ts',
        'Detected Supabase integration at src/integrations/supabase/',
        'Found shadcn/ui components',
        'Found @radix-ui dependencies',
        'TypeScript strict mode enabled'
      ]
    }
  },

  bolt: {
    minimal: {
      tool: 'bolt',
      confidence: 0.92,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        language: 'typescript'
      },
      evidence: [
        'Found .bolt/ directory',
        'Found @stackblitz/sdk in devDependencies',
        'Found stackblitz configuration in package.json'
      ]
    },
    full: {
      tool: 'bolt',
      confidence: 0.95,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        language: 'typescript',
        backend: 'nodejs',
        database: 'sqlite'
      },
      evidence: [
        'Found .bolt/config.json',
        'Found @stackblitz/sdk@1.9.0',
        'Detected WebContainer configuration'
      ]
    }
  },

  v0: {
    minimal: {
      tool: 'v0',
      confidence: 0.94,
      metadata: {
        framework: 'next',
        language: 'typescript',
        styling: 'tailwind'
      },
      evidence: [
        'Found Next.js 14+ in dependencies',
        'Found @radix-ui components',
        'Detected Tailwind CSS configuration'
      ]
    },
    full: {
      tool: 'v0',
      confidence: 0.96,
      metadata: {
        framework: 'next',
        language: 'typescript',
        styling: 'tailwind',
        uiLibrary: 'radix',
        backend: 'vercel',
        database: 'postgresql'
      },
      evidence: [
        'Found next@14.0.0',
        'Found multiple @radix-ui/* components',
        'Found lucide-react icons',
        'Detected Vercel configuration'
      ]
    }
  },

  figmaMake: {
    minimal: {
      tool: 'figma-make',
      confidence: 0.90,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        language: 'typescript'
      },
      evidence: [
        'Found React + Vite + TypeScript stack',
        'Standard Figma Make project structure'
      ]
    },
    full: {
      tool: 'figma-make',
      confidence: 0.93,
      metadata: {
        framework: 'react',
        buildTool: 'vite',
        language: 'typescript',
        styling: 'css',
        routing: 'react-router'
      },
      evidence: [
        'Found React 18+ with Vite 5+',
        'Found TypeScript 5+ configuration',
        'Detected Figma export patterns'
      ]
    }
  }
};

export const samplePackageJsons = {
  lovable: {
    name: 'lovable-test-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      'react-router-dom': '^6.18.0',
      '@supabase/supabase-js': '^2.38.0',
      '@radix-ui/react-dialog': '^1.0.0',
      '@radix-ui/react-dropdown-menu': '^2.0.0',
      'lucide-react': '^0.292.0',
      'clsx': '^2.0.0',
      'tailwind-merge': '^2.0.0'
    },
    devDependencies: {
      'lovable-tagger': '^1.1.0',
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
      '@vitejs/plugin-react-swc': '^3.5.0',
      'tailwindcss': '^3.3.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0'
    }
  },

  bolt: {
    name: 'bolt-test-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    stackblitz: {
      startCommand: 'npm run dev',
      installDependencies: true
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    },
    devDependencies: {
      '@stackblitz/sdk': '^1.9.0',
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0'
    }
  },

  v0: {
    name: 'v0-test-app',
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'next': '^14.0.0',
      '@radix-ui/react-dialog': '^1.0.0',
      '@radix-ui/react-dropdown-menu': '^2.0.0',
      '@radix-ui/react-slot': '^1.0.0',
      'lucide-react': '^0.292.0',
      'tailwindcss': '^3.3.0',
      'class-variance-authority': '^0.7.0',
      'clsx': '^2.0.0',
      'tailwind-merge': '^2.0.0'
    },
    devDependencies: {
      'typescript': '^5.0.0',
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0',
      'eslint': '^8.0.0',
      'eslint-config-next': '^14.0.0'
    }
  },

  figmaMake: {
    name: 'figma-make-test-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview'
    },
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.18.0'
    },
    devDependencies: {
      'vite': '^5.0.0',
      'typescript': '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0'
    }
  }
};

export const sampleViteConfigs = {
  lovable: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    componentTagger(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});`,

  bolt: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});`,

  figmaMake: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});`
};

export const sampleTsConfigs = {
  lovable: {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      strict: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      baseUrl: '.',
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }]
  },

  v0: {
    compilerOptions: {
      target: 'es5',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next'
        }
      ],
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  }
};

export const expectedDockerfiles = {
  lovable: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["npm", "run", "preview"]`,

  v0: `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY package*.json ./

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]`
};

export const expectedDockerComposes = {
  lovable: `version: "3.8"

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./src:/app/src
      - node_modules:/app/node_modules
    networks:
      - lovable-network

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - lovable-network

volumes:
  node_modules:
  postgres_data:

networks:
  lovable-network:
    driver: bridge`,

  v0: `version: "3.8"

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - node_modules:/app/node_modules
    networks:
      - v0-network

volumes:
  node_modules:

networks:
  v0-network:
    driver: bridge`
};

export const expectedEnvExamples = {
  lovable: `# Lovable Application Environment Variables

# Build-time Variables (embedded in build)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Runtime Variables (server-side only)
NODE_ENV=development

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your-secure-password>
POSTGRES_DB=lovable_db
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}

# Application Configuration
PORT=8080
HOST=0.0.0.0`,

  v0: `# V0 Application Environment Variables

# Build-time Variables (public, embedded in build)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=https://api.example.com

# Runtime Variables (server-side only)
NODE_ENV=development

# Application Configuration
PORT=3000
HOST=0.0.0.0`
};

export const sampleFragments = {
  frameworks: {
    react: `# React framework setup
RUN npm install react@19 react-dom@19`,

    next: `# Next.js framework setup
RUN npm install next@14 react@18 react-dom@18`,

    vue: `# Vue framework setup
RUN npm install vue@3`,

    svelte: `# Svelte framework setup
RUN npm install svelte@4 @sveltejs/kit`
  },

  databases: {
    postgresql: `  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=\${POSTGRES_USER}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
      - POSTGRES_DB=\${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5`,

    mysql: `  mysql:
    image: mysql:8-alpine
    environment:
      - MYSQL_ROOT_PASSWORD=\${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=\${MYSQL_DATABASE}
      - MYSQL_USER=\${MYSQL_USER}
      - MYSQL_PASSWORD=\${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql`,

    mongodb: `  mongodb:
    image: mongo:7-alpine
    environment:
      - MONGO_INITDB_ROOT_USERNAME=\${MONGO_USERNAME}
      - MONGO_INITDB_ROOT_PASSWORD=\${MONGO_PASSWORD}
    volumes:
      - mongo_data:/data/db`
  },

  backends: {
    supabase: `# Supabase configuration
ENV SUPABASE_URL=\${VITE_SUPABASE_URL}
ENV SUPABASE_ANON_KEY=\${VITE_SUPABASE_ANON_KEY}`,

    firebase: `# Firebase configuration
ENV FIREBASE_PROJECT_ID=\${FIREBASE_PROJECT_ID}
ENV FIREBASE_API_KEY=\${FIREBASE_API_KEY}`,

    nodejs: `# Node.js backend setup
RUN npm install express cors dotenv`
  }
};

export const createMockProjectStructure = async (fs, baseDir, tool) => {
  const structures = {
    lovable: [
      'src/main.tsx',
      'src/App.tsx',
      'src/components/ui/button.tsx',
      'src/components/ui/card.tsx',
      'src/integrations/supabase/client.ts',
      'src/integrations/supabase/types.ts',
      'public/index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tailwind.config.ts',
      'components.json'
    ],

    bolt: [
      'src/main.tsx',
      'src/App.tsx',
      '.bolt/config.json',
      'vite.config.ts',
      'tsconfig.json'
    ],

    v0: [
      'src/app/page.tsx',
      'src/app/layout.tsx',
      'src/components/ui/button.tsx',
      'src/lib/utils.ts',
      'next.config.js',
      'tsconfig.json',
      'tailwind.config.ts'
    ],

    'figma-make': [
      'src/main.tsx',
      'src/App.tsx',
      'src/components/Header.tsx',
      'vite.config.ts',
      'tsconfig.json',
      'index.html'
    ]
  };

  const files = structures[tool] || [];

  for (const file of files) {
    const fullPath = `${baseDir}/${file}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, `// ${file}`);
  }
};

export default {
  sampleDetections,
  samplePackageJsons,
  sampleViteConfigs,
  sampleTsConfigs,
  expectedDockerfiles,
  expectedDockerComposes,
  expectedEnvExamples,
  sampleFragments,
  createMockProjectStructure
};
