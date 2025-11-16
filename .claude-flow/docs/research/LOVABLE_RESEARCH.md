# Lovable (formerly GPT Engineer) - Comprehensive Research

## Executive Summary

Lovable is an AI-powered web application builder that generates full-stack applications through natural language conversation. It is the evolution of the open-source GPT Engineer project and focuses on enabling users of any skill level to create production-ready web applications without writing code.

**Key Characteristics:**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **UI Components**: shadcn/ui (copy-paste React components)
- **Backend**: Supabase (PostgreSQL database, authentication, Edge Functions)
- **Build Tool**: Vite (fast build and dev server)
- **Deployment**: Cloudflare (frontend), Supabase (backend)

---

## 1. Project Structure

### Standard Directory Layout

Lovable projects follow a modern React/Vite structure:

```
lovable-project/
├── .github/
│   └── instructions/          # GitHub-specific AI instructions
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...other shadcn components
│   │   └── custom-components/ # Project-specific components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Navigation.tsx
│   │       └── ...
│   ├── pages/                 # Page components for routing
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── ContactPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useDatabase.ts
│   │   └── ...custom hooks
│   ├── integrations/          # Third-party service integrations
│   │   ├── supabase/
│   │   │   └── client.ts      # Supabase client initialization
│   │   ├── stripe/
│   │   └── ...other integrations
│   ├── lib/                   # Utility functions and helpers
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── App.tsx                # Main application component with routing
│   ├── main.tsx               # Vite entry point
│   └── index.css              # Global styles
├── supabase/
│   ├── functions/             # Edge Functions (serverless backend)
│   │   ├── send-email/
│   │   ├── process-payment/
│   │   └── ...other functions
│   └── migrations/            # Database migrations (optional)
├── public/
│   ├── images/
│   ├── fonts/
│   └── ...static assets
├── node_modules/              # Dependencies (not committed to git)
├── dist/                       # Build output (not committed to git)
├── .gitignore                 # Git ignore configuration
├── .env.local                 # Local environment variables (not committed)
├── .env.example               # Example environment variables
├── index.html                 # HTML entry point
├── package.json               # NPM package configuration
├── package-lock.json          # Dependency lock file
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript configuration for Node files
├── vite.config.ts             # Vite configuration with React plugin
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration (for Tailwind)
└── components.json            # shadcn/ui configuration
```

### Key Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `src/` | All source code files |
| `src/components/ui/` | shadcn/ui library components (copy-pasted) |
| `src/components/` | Custom React components |
| `src/pages/` | Page components for React Router routes |
| `src/integrations/` | Third-party service clients (Supabase, Stripe, etc.) |
| `src/hooks/` | Custom React hooks for reusable logic |
| `src/lib/` | Utility functions, helpers, and type definitions |
| `public/` | Static assets served directly |
| `supabase/functions/` | Serverless backend functions |
| `dist/` | Built output (generated, not committed) |

---

## 2. Package Dependencies

### Typical package.json Structure

```json
{
  "name": "lovable-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.x.x",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "@radix-ui/react-dialog": "^1.1.x",
    "@radix-ui/react-dropdown-menu": "^2.0.x",
    "@radix-ui/react-primitive": "^1.0.x",
    "@radix-ui/react-slot": "^2.0.x",
    "@supabase/supabase-js": "^2.x.x",
    "@supabase/auth-ui-react": "^0.x.x",
    "@supabase/auth-ui-shared": "^0.x.x",
    "lucide-react": "^0.x.x",
    "axios": "^1.x.x",
    "zustand": "^4.x.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.x.x",
    "@types/node": "^20.x.x",
    "@types/react": "^18.x.x",
    "@types/react-dom": "^18.x.x",
    "autoprefixer": "^10.x.x",
    "css-variables-webpack-plugin": "^2.x.x",
    "eslint": "^8.x.x",
    "eslint-plugin-react-hooks": "^4.x.x",
    "lovable-tagger": "^1.1.x",
    "postcss": "^8.x.x",
    "tailwindcss": "^3.x.x",
    "typescript": "^5.x.x",
    "vite": "^5.x.x"
  }
}
```

### Core Dependencies Explained

| Package | Purpose | Version |
|---------|---------|---------|
| `react` | UI library | ^19.0.0 |
| `react-dom` | React rendering | ^19.0.0 |
| `react-router-dom` | Client-side routing | ^6.x |
| `@vitejs/plugin-react-swc` | Vite React plugin (SWC compiler) | ^3.x |
| `@supabase/supabase-js` | Supabase client library | ^2.x |
| `tailwindcss` | Utility-first CSS framework | ^3.x |
| `lucide-react` | Icon library | Latest |
| `clsx` | Conditional CSS class names | ^2.0 |
| `tailwind-merge` | Merge Tailwind classes intelligently | ^2.0 |
| `lovable-tagger` | Component tagging for development | ^1.1 |

### Optional Integration Dependencies

```json
{
  "dependencies": {
    "@stripe/react-stripe-js": "^2.x.x",
    "@stripe/stripe-js": "^3.x.x",
    "@clerk/clerk-react": "^4.x.x",
    "zustand": "^4.x.x",
    "axios": "^1.x.x",
    "framer-motion": "^10.x.x"
  }
}
```

---

## 3. Configuration Files

### vite.config.ts

The Vite configuration is critical for Lovable projects:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/",
  build: {
    target: "ES2020",
    minify: "terser",
    sourcemap: false,
  },
}));
```

**Key Features:**
- Path alias `@` points to `./src` for cleaner imports
- `lovable-tagger` only loaded in development mode
- SWC compiler for faster builds
- Server runs on port 8080 by default

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### components.json (shadcn/ui Configuration)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate"
  },
  "aliases": {
    "@/components": "src/components",
    "@/lib": "src/lib"
  }
}
```

### postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### .env.example

```
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe Configuration (Optional)
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Clerk Configuration (Optional)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# API Configuration
VITE_API_URL=http://localhost:3000
```

### .gitignore

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Build outputs
/dist
/build
/.next
/out

# Runtime
.env.local
.env.*.local
.DS_Store

# Development
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
/coverage
/.nyc_output

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lovable App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 4. Framework Support

### Primary Framework: React

Lovable is **exclusively built on React** with no alternative framework support:

| Aspect | Details |
|--------|---------|
| **Framework** | React (v18.x - v19.x) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS v3 |
| **UI Components** | shadcn/ui (Radix UI + Tailwind) |
| **Routing** | React Router v6 |
| **State Management** | Zustand, React Context |
| **Build Tool** | Vite |
| **Dev Server** | Vite Dev Server (port 8080) |

### Why React-Only?

- **Consistency**: All generated code uses React patterns
- **Community**: Massive ecosystem of React libraries
- **AI Generation**: Easier to train AI models on single framework
- **Integration**: Works seamlessly with Supabase and other services

### Framework Limitations

From user feedback:
> "Lovable is stuck to React and Vite, which is not the stack some developers would choose, and it just ignores you when you ask to use anything else."

**Cannot be changed to:**
- Vue.js
- Svelte
- Angular
- Next.js (can migrate after generation)
- Astro
- Remix

---

## 5. Backend Integration

### Primary Backend: Supabase

Lovable's primary backend integration is **Supabase**, an open-source Firebase alternative:

#### Supabase Services Used by Lovable

| Service | Purpose | Example |
|---------|---------|---------|
| **PostgreSQL Database** | Primary data storage | User profiles, posts, comments |
| **Authentication** | User login/signup | Email, Google, GitHub OAuth |
| **File Storage** | Media uploads | Images, videos (50MB/file limit) |
| **Real-time Updates** | Live data streaming | Chat, collaborative editing |
| **Edge Functions** | Serverless backend logic | Email sending, payments, API integrations |
| **Vector Database** | Semantic search | AI embeddings, similarity search |

### Edge Functions (Serverless Backend)

Lovable generates Supabase Edge Functions for backend logic:

```typescript
// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@0.16.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  const { email, subject, html } = await req.json();

  const { data, error } = await resend.emails.send({
    from: "noreply@lovable.app",
    to: email,
    subject: subject,
    html: html,
  });

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 400 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
});
```

**Key Characteristics:**
- Written in TypeScript
- Runs on Deno runtime
- Can import npm packages
- Auto-deployed via Supabase CLI
- Accessible via HTTP endpoints

### Backend Integration Example

```typescript
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types"; // Generated from Supabase

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Using in components
export async function fetchUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
```

### Supabase Integration Setup

1. **Connect Supabase**:
   - Go to Project Settings → Integrations → Supabase
   - Click "Connect Supabase"
   - Login to Supabase account
   - Authorize Lovable

2. **Lovable Generates**:
   - Database schema based on prompts
   - TypeScript types from schema
   - Authentication flows (email, OAuth)
   - Edge Functions for custom logic
   - React hooks for data fetching

---

## 6. Database Support

### Primary Database: PostgreSQL (via Supabase)

Lovable uses **PostgreSQL** exclusively through Supabase:

#### Database Capabilities

| Feature | Details |
|---------|---------|
| **Database Type** | PostgreSQL 14+ |
| **Access** | REST API, GraphQL API, Realtime |
| **Authentication** | Row-Level Security (RLS) policies |
| **Scaling** | Supabase handles infrastructure |
| **Backups** | Automatic daily backups |
| **Vectors** | pgvector extension for embeddings |

#### Generated Database Schema Example

```sql
-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Posts table
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;
alter table posts enable row level security;

-- RLS Policies
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can view published posts"
  on posts for select
  using (true);
```

#### TypeScript Types (Auto-generated)

```typescript
// src/integrations/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
```

### Data Fetching Patterns

```typescript
// src/hooks/useDatabase.ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePosts() {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*, users(full_name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPosts(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Real-time subscription
    const subscription = supabase
      .channel("posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        (payload) => {
          // Update posts when database changes
          setPosts((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { posts, loading, error };
}
```

---

## 7. Build Tools

### Vite - The Primary Build Tool

Lovable uses **Vite** exclusively for development and production builds:

#### Vite Configuration Details

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode, command }) => ({
  // Development server configuration
  server: {
    host: "::",           // Listen on all interfaces
    port: 8080,           // Port number
    middlewareMode: false,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 8080,
    },
  },

  // Preview server configuration
  preview: {
    port: 5000,
  },

  // Plugins
  plugins: [
    react({
      jsxImportSource: "react",
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  // Module resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },

  // Build configuration
  build: {
    target: "ES2020",
    minify: "terser",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
        },
      },
    },
  },

  // CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        // SCSS options
      },
    },
  },
}));
```

#### Build Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  }
}
```

#### Build Output Structure

```
dist/
├── index.html           # Minified HTML entry point
├── assets/
│   ├── main-xxxxx.js    # Main app bundle (minified)
│   ├── vendor-xxxxx.js  # Vendor bundle (React, libraries)
│   └── style-xxxxx.css  # Global styles (minified)
└── ...other assets
```

### Development Workflow

```bash
# Start development server (hot reload)
npm run dev
# Runs on http://localhost:8080

# Type checking
npm run type-check

# Build for production
npm run build
# Creates optimized dist/ folder

# Preview production build
npm run preview
```

### Vite Features Used by Lovable

| Feature | Purpose |
|---------|---------|
| **Hot Module Replacement (HMR)** | Instant code updates without full reload |
| **Fast Refresh** | React Fast Refresh for component updates |
| **Code Splitting** | Automatic chunk splitting for optimization |
| **CSS Preprocessing** | PostCSS for Tailwind CSS |
| **Asset Optimization** | Automatic image/asset optimization |

---

## 8. Detection Signatures & Patterns

### Key Identifier: lovable-tagger

The most distinctive Lovable marker is the **lovable-tagger** npm package:

```typescript
// vite.config.ts - Characteristic pattern
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
}));
```

### Detection Patterns

#### 1. Package.json Signature

```json
{
  "dependencies": {
    "lovable-tagger": "^1.1.x"  // ← Unique to Lovable
  }
}
```

#### 2. Directory Structure Signature

```
src/
├── components/
│   └── ui/                 # shadcn/ui components
├── integrations/
│   └── supabase/           # Supabase client
├── pages/                  # Page components
```

#### 3. Vite Config Signature

```typescript
// Characteristic vite.config.ts patterns
import { componentTagger } from "lovable-tagger";

resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},

server: {
  host: "::",
  port: 8080,
},
```

#### 4. Supabase Integration Signature

```typescript
// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabase = createClient<Database>(url, key);
```

#### 5. Supabase Types File

```typescript
// src/integrations/supabase/types.ts - Auto-generated
export interface Database {
  public: {
    Tables: {
      // Table definitions auto-generated from Supabase
    };
  };
}
```

#### 6. tsconfig.json Signature

```json
{
  "paths": {
    "@/*": ["./src/*"]
  },
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

#### 7. tailwind.config.ts Signature

```typescript
const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ...
};
```

### Detection Logic (JavaScript)

```javascript
/**
 * Detects if a project is generated by Lovable
 */
function detectLovableProject(projectRoot) {
  const fs = require("fs");
  const path = require("path");

  const indicators = {
    hasLovableTagger: false,
    hasSupabaseIntegration: false,
    hasViteConfig: false,
    hasShadcnComponents: false,
    hasCorrectStructure: false,
  };

  // Check 1: lovable-tagger in package.json
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    indicators.hasLovableTagger = !!packageJson.devDependencies?.["lovable-tagger"];
  }

  // Check 2: Supabase integration
  const supabaseClientPath = path.join(projectRoot, "src/integrations/supabase/client.ts");
  indicators.hasSupabaseIntegration = fs.existsSync(supabaseClientPath);

  // Check 3: vite.config.ts with componentTagger
  const viteConfigPath = path.join(projectRoot, "vite.config.ts");
  if (fs.existsSync(viteConfigPath)) {
    const viteContent = fs.readFileSync(viteConfigPath, "utf-8");
    indicators.hasViteConfig = viteContent.includes("componentTagger");
  }

  // Check 4: shadcn/ui components in src/components/ui/
  const uiComponentsPath = path.join(projectRoot, "src/components/ui");
  indicators.hasShadcnComponents = fs.existsSync(uiComponentsPath);

  // Check 5: Project structure
  const requiredDirs = [
    "src/components",
    "src/integrations",
    "src/pages",
    "public",
  ];
  indicators.hasCorrectStructure = requiredDirs.every((dir) =>
    fs.existsSync(path.join(projectRoot, dir))
  );

  // Determine confidence level
  const indicatorCount = Object.values(indicators).filter(Boolean).length;
  const confidence = indicatorCount / Object.keys(indicators).length;

  return {
    isLovable: confidence >= 0.6,
    confidence: Math.round(confidence * 100),
    indicators,
  };
}

// Usage
const result = detectLovableProject("./my-project");
console.log(result);
// {
//   isLovable: true,
//   confidence: 100,
//   indicators: {
//     hasLovableTagger: true,
//     hasSupabaseIntegration: true,
//     hasViteConfig: true,
//     hasShadcnComponents: true,
//     hasCorrectStructure: true
//   }
// }
```

### Detection Patterns Summary

| Pattern | Indicator | Confidence |
|---------|-----------|-----------|
| **lovable-tagger in devDependencies** | Unique to Lovable | High (95%) |
| **vite.config.ts imports componentTagger** | Specific to Lovable | High (95%) |
| **src/integrations/supabase/client.ts** | Supabase integration | Medium-High (80%) |
| **src/components/ui/ directory** | shadcn/ui components | Medium (60%) |
| **TypeScript with @ path alias** | Standard React pattern | Low (40%) |
| **Vite port 8080 default** | Vite standard | Very Low (20%) |

### File Fingerprints

#### Characteristic imports:

```typescript
// Almost always present in Lovable projects
import { componentTagger } from "lovable-tagger";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./integrations/supabase/types";
import { BrowserRouter, Routes, Route } from "react-router-dom";
```

---

## 9. Integration Patterns

### Third-party Service Integrations

Lovable projects commonly integrate with:

#### Stripe (Payments)

```typescript
// src/integrations/stripe/client.ts
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createCheckoutSession(priceId: string) {
  const { sessionId } = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  }).then((res) => res.json());

  const stripe = await stripePromise;
  await stripe?.redirectToCheckout({ sessionId });
}
```

#### Clerk (Authentication)

```typescript
// src/main.tsx
import { ClerkProvider } from "@clerk/clerk-react";

<ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
  <App />
</ClerkProvider>
```

#### OpenAI (AI Features)

```typescript
// supabase/functions/generate-content/index.ts
import { OpenAI } from "npm:openai@4.0.0";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
});
```

---

## 10. Common Generated Patterns

### React Component Pattern

```typescript
// src/components/ExampleComponent.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ExampleComponent() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("example_table")
        .select("*");

      if (error) throw error;
      setData(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <Button onClick={handleFetch} disabled={loading}>
        {loading ? "Loading..." : "Fetch Data"}
      </Button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </Card>
  );
}
```

### App.tsx with Routing

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { AboutPage } from "@/pages/AboutPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### main.tsx Entry Point

```typescript
// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

## 11. Limitations and Constraints

### Framework Constraints

- **React-only**: Cannot switch to Vue, Svelte, or other frameworks
- **Vite-only**: Cannot use Webpack, Parcel, or other bundlers
- **TypeScript**: Always enabled (no JavaScript-only option)
- **Tailwind CSS**: Always included (no option for other CSS frameworks)

### Backend Constraints

- **Supabase-only**: Cannot use custom Node.js backends initially
- **PostgreSQL-only**: No MongoDB, MySQL, or other databases
- **Deno runtime**: Edge Functions run on Deno (limited npm compatibility)
- **No file-based databases**: Cannot use SQLite for offline-first apps

### Deployment Constraints

- **Cloudflare for frontend**: Limited alternative deployment options
- **Supabase for backend**: Vendor lock-in for database
- **No serverless choice**: Cannot use AWS Lambda, Google Cloud Functions

---

## 12. Key Takeaways

### What Makes Lovable Unique

1. **All-in-One Stack**: React + Vite + Tailwind + shadcn/ui + Supabase
2. **Component Tagging**: `lovable-tagger` for development workflow
3. **AI-Generated Code**: Optimized for LLM generation patterns
4. **No Configuration**: Sensible defaults for all tools
5. **Fast Development**: Hot reload, type safety, pre-built components

### Migration Path

Users commonly migrate from Lovable to:
- **Next.js**: For better SEO and server-side rendering
- **Custom Node.js**: For more control over backend
- **Self-hosted Supabase**: For data sovereignty

### Detection Summary

**Highest Confidence Detection:**
1. `lovable-tagger` in `package.json` devDependencies (95%)
2. `componentTagger` import in `vite.config.ts` (95%)
3. Supabase client in `src/integrations/supabase/client.ts` (80%)

**Complete Project Score:**
- All 5 indicators present: 100% confidence
- 4 indicators present: 80% confidence
- 3 indicators present: 60% confidence
- 2 indicators present: 40% confidence
- 1 indicator present: 20% confidence

---

## References

- **Lovable Official**: https://lovable.dev
- **Lovable Documentation**: https://docs.lovable.dev
- **Supabase Documentation**: https://supabase.com/docs
- **Vite Documentation**: https://vite.dev
- **React Router**: https://reactrouter.com
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

---

## Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-12 | Initial comprehensive research document |

