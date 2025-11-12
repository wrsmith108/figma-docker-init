# Bolt Quick Reference Guide

A concise reference for Bolt (StackBlitz AI Tool) essentials.

---

## Quick Facts

| Aspect | Details |
|--------|---------|
| **Official Name** | Bolt.new (by StackBlitz) |
| **Type** | AI-powered web development IDE |
| **Platform** | Browser-based (Chrome/Chromium recommended) |
| **Runtime** | WebContainers (WASM) |
| **AI Model** | Claude Sonnet 3.5 (Anthropic) |
| **Framework** | Remix (internal) |
| **Deployment** | Cloudflare Pages/Workers |
| **License** | Proprietary (bolt.new) / MIT (bolt.diy) |
| **Repository** | github.com/stackblitz/bolt.new |
| **Open Source Fork** | github.com/stackblitz-labs/bolt.diy |

---

## One-Minute Detection

**Check these in order:**

1. **Has `.stackblitzrc`?** → Definitely Bolt-ready
2. **Has `"stackblitz"` field in `package.json`?** → Definitely Bolt-ready
3. **Uses Remix + Vite?** → Likely Bolt
4. **Has `app/routes/` directory?** → Likely Bolt (Remix pattern)
5. **Uses React + Tailwind + TypeScript?** → Possibly Bolt

**Quick Command:**
```bash
# Check for Bolt indicators
ls -la .stackblitzrc 2>/dev/null && echo "FOUND .stackblitzrc"
grep -q '"stackblitz"' package.json 2>/dev/null && echo "FOUND stackblitz config"
grep -q '"remix"' package.json 2>/dev/null && echo "USES REMIX"
test -d app/routes && echo "HAS REMIX STRUCTURE"
```

---

## Project Structure at a Glance

```
bolt-project/
├── app/                 # Remix app (routes + components)
│   ├── routes/         # File-based routing
│   ├── components/     # Reusable components
│   └── lib/           # Utilities
├── public/             # Static assets
├── types/              # TypeScript definitions
├── functions/          # Serverless functions
├── package.json        # Dependencies
├── vite.config.ts      # Build config
├── remix.config.js     # Framework config
├── tsconfig.json       # TypeScript config
├── .stackblitzrc       # StackBlitz config (optional)
└── wrangler.toml       # CloudFlare config
```

---

## Configuration Quick Reference

### .stackblitzrc
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

### package.json stackblitz field
```json
{
  "stackblitz": {
    "installDependencies": true,
    "startCommand": "npm start",
    "compileTrigger": "save"
  }
}
```

---

## Framework Compatibility Matrix

| Framework | WebContainer | Bolt Ready | Notes |
|-----------|--------------|-----------|-------|
| **React** | ✅ Full | ✅ Native | Hooks, Context API |
| **Vue 3** | ✅ Full | ✅ Good | Composition API |
| **Svelte** | ✅ Full | ✅ Good | Recently added support |
| **Angular** | ✅ Full | ✅ Good | Ivy compatible |
| **Next.js** | ✅ Full | ✅ Excellent | App + Pages Router |
| **Nuxt** | ✅ Full | ✅ Good | SSR compatible |
| **Remix** | ✅ Full | ✅ **Native** | Used by Bolt itself |
| **Astro** | ✅ Full | ✅ Good | Hybrid rendering |
| **SvelteKit** | ✅ Full | ✅ Good | Full SSR support |
| **Express** | ✅ Full | ✅ Good | Backend capable |

---

## Common Dependencies in Bolt Projects

### Frontend Stack
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "tailwindcss": "^3.x",
  "zustand": "^4.x",
  "axios": "^1.6.x"
}
```

### Backend Stack
```json
{
  "express": "^4.18.x",
  "cors": "^2.8.x",
  "dotenv": "^16.x",
  "mongoose": "^7.x",
  "jsonwebtoken": "^9.x"
}
```

### Build Tools
```json
{
  "vite": "^5.0.0",
  "@vitejs/plugin-react": "^4.0.0",
  "remix": "^2.0.0",
  "typescript": "^5.0.0"
}
```

---

## WebContainer Essentials

### What WebContainer Does
- Runs Node.js in browser (WASM)
- Provides filesystem, package manager, terminal
- Installs npm packages 10x faster
- Supports ~95% of npm ecosystem

### Browser Requirements
- **Required**: SharedArrayBuffer support
- **Required**: Cross-Origin-Embedder-Policy headers
- **Required**: Cross-Origin-Opener-Policy headers
- **Best**: Chrome Canary or latest Chromium
- **Partial**: Firefox, Safari

### Technical Headers
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Performance Metrics
- Cold start: 2-5 seconds
- Package installation: ~10x faster than local npm
- Virtual filesystem: In-memory (ephemeral)
- Max file size: Browser storage dependent

---

## Build Commands Patterns

### Typical Bolt Vite Config
```bash
npm run dev      # Start dev server (Vite)
npm run build    # Production build
npm run preview  # Preview production build
```

### Typical Remix Config
```bash
npm run dev      # Dev with Vite
npm run build    # Build for production
npm run start    # Run production server
```

### Detection in package.json
```json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "start": "remix-serve ./build/index.js"
  }
}
```

---

## Detection Decision Tree

```
Is it a Bolt project?
│
├─ Does .stackblitzrc exist?
│  └─ YES → BOLT PROJECT ✅
│
├─ Does package.json have "stackblitz" field?
│  └─ YES → BOLT PROJECT ✅
│
├─ Does it use Remix?
│  ├─ YES + Vite?
│  │  └─ YES + app/routes/?
│  │     └─ YES → LIKELY BOLT (85%+) 🟢
│  │     └─ NO → Remix project (not Bolt) 🟡
│  └─ NO → Check next criteria
│
├─ Does it have app/routes/ directory?
│  └─ YES → Remix-based (likely Bolt) 🟢
│  └─ NO → Check next criteria
│
├─ Is it React + TypeScript + Vite?
│  └─ YES → Possibly Bolt 🟡
│  └─ NO → Probably not Bolt ❌
│
└─ Has WebContainer-compatible frameworks?
   └─ YES → Could run in Bolt 🟡
   └─ NO → Cannot run in Bolt ❌
```

---

## Migration Checklist: From Bolt to Local

- [ ] Export project files from Bolt
- [ ] Copy all files to local directory
- [ ] Run `npm install` (or `pnpm install`)
- [ ] Check for `.env` variables
- [ ] Verify local database connections
- [ ] Test with `npm run dev`
- [ ] Update any Bolt-specific configs
- [ ] Test build: `npm run build`
- [ ] Review deployment configuration
- [ ] Remove `.stackblitzrc` if no longer needed

---

## Common Issues & Solutions

### Issue: Package installation fails
**Solution**: Check Node.js version compatibility; WebContainer works better with Node 14+

### Issue: Native modules won't compile
**Solution**: Some packages with native bindings may not work; consider JavaScript alternatives

### Issue: Environment variables not set
**Solution**: Use `.stackblitzrc` env field or `stackblitz` field in package.json

### Issue: Start command not running
**Solution**: Ensure `startCommand` points to valid npm script in `package.json`

### Issue: Build takes too long
**Solution**: Disable `installDependencies` if not needed on startup

---

## Deployment Targets

### Bolt-Native Options
- **Cloudflare Pages** - Built-in support
- **Cloudflare Workers** - For backend

### WebContainer-Compatible Options
- **Vercel** - Next.js projects
- **Netlify** - Static + serverless
- **Railway** - Full-stack apps
- **Render** - Node.js applications
- **Fly.io** - Docker applications

---

## Performance Tips

### Optimization Checklist
- [ ] Use Vite (faster builds than Webpack)
- [ ] Enable code splitting in build config
- [ ] Lazy load routes (React Router)
- [ ] Optimize images (Vite handles this)
- [ ] Use pnpm (faster than npm)
- [ ] Cache dependencies with lock files
- [ ] Minimize bundle size (tree-shaking)

### WebContainer-Specific Tips
- [ ] Don't rely on persistent filesystem
- [ ] Use environment variables for config
- [ ] Keep `node_modules` size reasonable
- [ ] Avoid very large file operations
- [ ] Monitor terminal output for errors

---

## File Size Limits

| Item | Limit |
|------|-------|
| File content | Browser storage dependent |
| Project size | ~100MB (browser storage) |
| `node_modules` | Browser memory |
| Single file | ~50MB (typical) |

---

## Useful Resources

### Official
- **Bolt Help Center**: https://support.bolt.new/
- **StackBlitz Docs**: https://developer.stackblitz.com/
- **WebContainers**: https://webcontainers.io/
- **Remix Docs**: https://remix.run/

### Community
- **Bolt Discord**: https://discord.com/invite/stackblitz
- **GitHub Issues**: https://github.com/stackblitz/bolt.new/issues
- **bolt.diy Docs**: https://stackblitz-labs.github.io/bolt.diy/

### Related Tools
- **StackBlitz IDE**: https://stackblitz.com/
- **StackBlitz Codeflow**: https://codeflow.stackblitz.com/

---

## Quick Comparisons

### Bolt vs StackBlitz
| Feature | Bolt | StackBlitz |
|---------|------|-----------|
| AI-Powered | ✅ Yes | ❌ No |
| Full-Stack | ✅ Yes | ✅ Yes |
| AI Chat | ✅ Yes | ❌ No |
| Code Generation | ✅ Yes | ❌ No |
| Free Tier | ✅ Yes | ✅ Yes |

### Bolt vs GitHub Copilot
| Feature | Bolt | Copilot |
|---------|------|---------|
| Full App Generation | ✅ Yes | ❌ No (coding only) |
| Live Execution | ✅ Yes | ❌ No |
| Deployment | ✅ Yes | ❌ No |
| Browser-Based | ✅ Yes | ❌ No (VS Code) |

### Bolt vs v0 (Vercel)
| Feature | Bolt | v0 |
|---------|------|-----|
| Full-Stack | ✅ Yes | ❌ Components only |
| Backend | ✅ Yes | ❌ No |
| Deployment | ✅ Yes | ⚠️ Export only |
| Live Preview | ✅ Yes | ✅ Yes |

---

## Command Cheat Sheet

```bash
# Detection
ls .stackblitzrc
grep '"stackblitz"' package.json
grep '"remix"' package.json

# Installation
npm install
pnpm install
yarn install

# Development
npm run dev       # Start dev server
npm start         # Start server

# Building
npm run build     # Production build
npm run preview   # Preview production build

# WebContainers (internal)
npm list          # List dependencies
npm ls --depth=0  # Top-level only

# Project Info
npm ls            # Dependency tree
npm outdated      # Check outdated packages
npm audit         # Security audit
```

---

## Version Information (Nov 2024)

- **Latest bolt.new**: Actively maintained
- **Latest bolt.diy**: v1.x+ (open source)
- **WebContainer API**: v1.x stable
- **Remix**: v2.x recommended
- **Vite**: v5.x recommended
- **React**: v18.x recommended
- **Node.js**: v18+ recommended

---

## License Information

- **Bolt.new (StackBlitz)**: Proprietary/Commercial
- **bolt.diy (open source)**: MIT License
- **WebContainer API**: Free for open source
- **Dependencies**: Various (check package.json)

