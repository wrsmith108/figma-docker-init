# Research Documentation Index

Comprehensive research on AI-powered web development tools and platform detection.

---

## Table of Contents

1. [Bolt Research](#bolt-research)
2. [Other Tools Research](#other-tools-research)
3. [Research Directory Structure](#research-directory-structure)
4. [Key Findings Summary](#key-findings-summary)

---

## Bolt Research

### [BOLT_RESEARCH.md](./BOLT_RESEARCH.md) - Comprehensive Technical Analysis
**Size**: ~1,065 lines | **Focus**: Complete technical reference

**Contents:**
- Project structure and directory layouts (bolt.new & bolt.diy)
- WebContainer architecture and specifications
- Framework support matrix (React, Vue, Svelte, etc.)
- Package dependency analysis and patterns
- Build configuration (Vite, Remix, TypeScript)
- Detection signatures and identification logic

**Key Sections:**
1. Overview - What is Bolt
2. Project Structure - Directory patterns and organization
3. WebContainer Technology - Browser runtime specifications
4. Framework Support - Compatibility matrix
5. Package Dependencies - Common dependency stacks
6. Build Configuration - Config files and patterns
7. Detection Signatures - How to identify Bolt projects
8. Architecture Patterns - Component hierarchy and data flow

**Best For:** Developers needing deep technical understanding of Bolt's architecture, WebContainer integration, and framework support patterns.

---

### [BOLT_DETECTION_UTILITIES.md](./BOLT_DETECTION_UTILITIES.md) - Production-Ready Code
**Size**: ~1,158 lines | **Focus**: Implementation and utilities

**Contents:**
- `BoltDetector` class - Complete detection logic
- `ConfigAnalyzer` - Configuration file parsing
- `FrameworkDetector` - Framework identification
- `WebContainerChecker` - Compatibility verification
- `StructureAnalyzer` - Directory structure mapping
- Integration examples and CLI tools

**Code Examples:**
- Single-file detection utility with confidence scoring
- Configuration analysis and validation
- Framework detection and WebContainer compatibility checking
- Project structure analyzer
- Complete detection workflow
- CLI tool implementation

**Best For:** Developers implementing Bolt detection in their tools, need TypeScript/JavaScript code examples, want production-ready utilities.

---

### [BOLT_QUICK_REFERENCE.md](./BOLT_QUICK_REFERENCE.md) - Quick Lookup Guide
**Size**: ~417 lines | **Focus**: Fast reference and lookup

**Contents:**
- One-minute detection guide
- Quick facts and configuration reference
- Framework compatibility matrix
- Common dependencies by stack
- Build commands patterns
- Detection decision tree
- Migration checklist
- Deployment targets
- Performance tips
- Command cheat sheet
- Quick comparisons (Bolt vs competitors)

**Best For:** Quick lookups during development, decision trees, checklists, performance optimization tips.

---

## Other Tools Research

The `/docs/research` directory also contains comprehensive analyses of related AI tools:

### [V0_RESEARCH.md](./V0_RESEARCH.md)
**Focus**: Vercel v0 component builder
- Project structure and file patterns
- Component generation patterns
- Shadcn/ui integration
- Build configuration details
- Detection signatures

### [LOVABLE_RESEARCH.md](./LOVABLE_RESEARCH.md)
**Focus**: Lovable AI builder
- Full-stack application structure
- Supabase integration
- Framework patterns
- Authentication flows
- Detection signatures

### [FIGMA_MAKE_RESEARCH.md](./FIGMA_MAKE_RESEARCH.md)
**Focus**: Figma and Make (Integromat) automation
- Figma design system structure
- Make workflow automation
- Integration patterns
- API specifications
- Detection signatures

---

## Research Directory Structure

```
docs/research/
├── INDEX.md                          # This file - navigation guide
├── BOLT_RESEARCH.md                  # [1,065 lines] Complete technical reference
├── BOLT_DETECTION_UTILITIES.md       # [1,158 lines] Production code & utilities
├── BOLT_QUICK_REFERENCE.md           # [417 lines] Quick lookup guide
├── V0_RESEARCH.md                    # [1,540 lines] v0 by Vercel research
├── LOVABLE_RESEARCH.md               # [1,263 lines] Lovable AI research
├── FIGMA_MAKE_RESEARCH.md            # [1,076 lines] Figma & Make research
└── v0-detector.js                    # [6,519 lines] v0 detection implementation
```

**Total Size**: ~183 KB of comprehensive research documentation

---

## Key Findings Summary

### Bolt (StackBlitz AI Tool)

#### What It Is
- AI-powered web development IDE running in the browser
- Uses Claude Sonnet 3.5 (Anthropic) for code generation
- Built with Remix framework and Vite build tool
- Powered by WebContainers (WASM-based Node.js runtime)
- Deploys to Cloudflare Pages/Workers

#### Key Technologies
- **Frontend**: React with TypeScript, Tailwind CSS
- **Framework**: Remix (file-based routing)
- **Runtime**: WebContainers (full-WASM Node.js in browser)
- **Build Tool**: Vite (5x faster than Webpack)
- **AI Integration**: Anthropic's AI SDK + Claude API
- **Deployment**: Cloudflare Pages & Workers

#### Framework Support
- **Native Support**: Remix (Bolt itself uses it)
- **Full Support**: React, Vue, Svelte, Next.js, Nuxt, Astro, Angular
- **Backend Support**: Express, Node.js, serverless functions
- **Build Tools**: Vite, Webpack, Parcel, Esbuild

#### Detection Signatures

**Strongest Indicators** (in priority order):
1. `.stackblitzrc` configuration file
2. `"stackblitz"` field in `package.json`
3. Remix framework with Vite configuration
4. Directory structure: `app/routes/` (Remix pattern)
5. Common Bolt stack: React + TypeScript + Tailwind + Zustand

**Confidence Scoring**:
- 0.75-1.0: Definitely Bolt (has stackblitz config)
- 0.5-0.75: Likely Bolt (Remix + Vite + structure)
- 0.25-0.5: Possibly Bolt (partial indicators)
- <0.25: Probably not Bolt

#### Common Dependency Patterns

**Frontend Stack**:
```
react@18.x, react-dom@18.x, react-router-dom@6.x
tailwindcss@3.x, zustand@4.x, axios@1.6.x
```

**Backend Stack**:
```
express@4.18.x, cors@2.8.x, mongoose@7.x
jsonwebtoken@9.x, bcryptjs@2.4.x
```

**Build Stack**:
```
vite@5.x, remix@2.x, typescript@5.x
@vitejs/plugin-react@4.x, prettier@3.x
```

---

## How to Use This Research

### For Detection Implementation
1. Start with **BOLT_QUICK_REFERENCE.md** - One-minute detection
2. Implement with **BOLT_DETECTION_UTILITIES.md** - Production code
3. Reference **BOLT_RESEARCH.md** - Deep understanding

### For Understanding Architecture
1. Read **BOLT_RESEARCH.md** - Comprehensive overview
2. Review **BOLT_DETECTION_UTILITIES.md** - Code patterns
3. Check **BOLT_QUICK_REFERENCE.md** - Configuration reference

### For Quick Lookups
1. Use **BOLT_QUICK_REFERENCE.md** - Find what you need fast
2. Check decision trees and checklists
3. Reference compatibility matrices

### For Integration Work
1. Read **BOLT_RESEARCH.md** - Framework support details
2. Use **BOLT_DETECTION_UTILITIES.md** - Practical examples
3. Follow migration checklist in **BOLT_QUICK_REFERENCE.md**

---

## Research Methodology

Each research document was created by:

1. **Web Research** - Multiple sources and official documentation
2. **Pattern Analysis** - Identifying structural and dependency patterns
3. **Code Analysis** - GitHub repository examination
4. **Comparative Analysis** - How tools differ and relate
5. **Documentation** - Structured, actionable findings

### Sources Used
- Official GitHub repositories
- Developer documentation
- Blog posts and technical articles
- Stack Overflow discussions
- Community forums
- Real project examples

---

## Key Technologies Across Tools

| Technology | Bolt | v0 | Lovable |
|-----------|------|-----|---------|
| **AI Model** | Claude 3.5 | Claude 3.5 | Claude 3.5 |
| **Framework** | Remix | React | React/Next.js |
| **Runtime** | WebContainers | Browser | Node.js |
| **Database** | Various | None | Supabase |
| **Styling** | Tailwind | Shadcn/ui | Tailwind |
| **Deployment** | Cloudflare | Vercel | Vercel |

---

## Comparison Matrix

### Detection Difficulty
- **Bolt**: Medium (clear indicators with stackblitz config)
- **v0**: Hard (components scattered, minimal config)
- **Lovable**: Medium (Supabase + specific patterns)

### Framework Flexibility
- **Bolt**: High (supports 10+ frameworks)
- **v0**: Low (React/Next.js focused)
- **Lovable**: Medium (React-based)

### WebContainer Support
- **Bolt**: Native (built on WebContainers)
- **v0**: N/A (browser component builder)
- **Lovable**: N/A (requires backend)

### Full-Stack Capability
- **Bolt**: Yes (full-stack support)
- **v0**: No (components only)
- **Lovable**: Yes (with Supabase)

---

## Research Completeness Checklist

### Bolt Research ✅ COMPLETE
- [x] Project structure mapping
- [x] WebContainer technical details
- [x] Framework compatibility matrix
- [x] Dependency analysis
- [x] Build configuration patterns
- [x] Detection signature definitions
- [x] Code examples (TypeScript)
- [x] Production-ready utilities
- [x] Quick reference guide
- [x] Migration guide

### Coverage
- **Lines of Code**: 2,640 lines
- **Code Examples**: 30+ examples
- **Detection Methods**: 5+ strategies
- **Framework Coverage**: 9+ frameworks
- **Tool Coverage**: Complete

---

## Related Documentation

### In This Repository
- `/docs/CLAUDE.md` - Project instructions and SPARC methodology
- `/docs/research/` - All research documentation
- GitHub repositories referenced in research

### External Resources
- [StackBlitz Developer Docs](https://developer.stackblitz.com/)
- [WebContainers API](https://webcontainers.io/)
- [Remix Documentation](https://remix.run/)
- [Bolt Help Center](https://support.bolt.new/)
- [bolt.diy GitHub](https://github.com/stackblitz-labs/bolt.diy)

---

## Updates and Maintenance

**Research Date**: November 2024
**Status**: Complete and verified
**Maintenance**: Update annually or when major versions released

**Key Versions Referenced**:
- Bolt.new: 2024 version
- bolt.diy: 1.x+
- WebContainer API: 1.x stable
- Remix: 2.x
- Vite: 5.x
- React: 18.x

---

## Quick Navigation

### By Use Case

**"How do I detect Bolt projects?"**
→ [BOLT_QUICK_REFERENCE.md - One-Minute Detection](./BOLT_QUICK_REFERENCE.md#one-minute-detection)

**"I need production code for detection"**
→ [BOLT_DETECTION_UTILITIES.md - Single-File Utility](./BOLT_DETECTION_UTILITIES.md#single-file-detection-utility)

**"What frameworks does Bolt support?"**
→ [BOLT_RESEARCH.md - Framework Support](./BOLT_RESEARCH.md#framework-support)

**"How do WebContainers work?"**
→ [BOLT_RESEARCH.md - WebContainer Technology](./BOLT_RESEARCH.md#webcontainer-technology)

**"What are typical dependencies?"**
→ [BOLT_RESEARCH.md - Package Dependencies](./BOLT_RESEARCH.md#package-dependencies)

**"Show me configuration examples"**
→ [BOLT_QUICK_REFERENCE.md - Configuration Reference](./BOLT_QUICK_REFERENCE.md#configuration-quick-reference)

**"How do I migrate from Bolt?"**
→ [BOLT_QUICK_REFERENCE.md - Migration Checklist](./BOLT_QUICK_REFERENCE.md#migration-checklist-from-bolt-to-local)

---

## Feedback & Notes

These research documents provide comprehensive coverage of Bolt and related AI development tools. They include:

- **Technical depth** for architecture understanding
- **Practical code** for implementation
- **Quick references** for fast lookups
- **Comparison data** for tool evaluation
- **Detection logic** for project identification
- **Migration guides** for tool switching

Use the navigation links and table of contents to find the specific information you need.

