# V0 Quick Reference Guide

## What is V0?

Vercel's **V0** is an AI tool that generates React components and pages from natural language descriptions. It produces clean, production-ready code using Next.js, React, Tailwind CSS, and shadcn/ui.

---

## Detection at a Glance

### 🎯 The Quickest Way to Detect V0

```bash
# Check for components.json (strongest indicator)
test -f components.json && echo "✓ Likely V0" || echo "✗ Not V0"

# Check for shadcn/ui components
test -d components/ui && echo "✓ Likely V0" || echo "✗ Not V0"

# Run the automated detector
node v0-detector.js /path/to/project
```

### Essential V0 Indicators

| Indicator | Confidence | Check |
|-----------|-----------|-------|
| **components.json** | 🔴 VERY HIGH | `ls components.json` |
| **components/ui/** directory | 🔴 VERY HIGH | `ls components/ui/` |
| **"use client" directives** | 🟠 HIGH | `grep -r "use client"` |
| **Lucide React imports** | 🟠 HIGH | `grep -r "lucide-react"` |
| **@radix-ui dependencies** | 🟠 HIGH | `grep @radix-ui package.json` |
| **Next.js App Router** | 🟡 MEDIUM | `ls app/` |
| **Tailwind CSS** | 🟡 MEDIUM | `grep tailwindcss package.json` |
| **kebab-case components** | 🟡 MEDIUM | `ls components/` |

---

## Project Structure Template

```
my-v0-project/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── api/                     # API routes
│
├── components/
│   ├── ui/                      # shadcn/ui components (from CLI)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── custom/                  # V0-generated custom components
│       └── header.tsx
│
├── lib/
│   └── utils.ts                 # Utility functions
│
├── components.json              # ⭐ shadcn/ui config
├── tailwind.config.ts           # ⭐ Tailwind configuration
├── tsconfig.json                # TypeScript config (with @/* paths)
├── next.config.js               # Next.js config
└── package.json
```

---

## Key Dependencies

### Core (Must Have)

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "tailwindcss": "^3.0.0"
}
```

### Strong V0 Indicators (4+ of these)

```json
{
  "@radix-ui/react-dialog": "^1.1.0",
  "@radix-ui/react-dropdown-menu": "^2.0.0",
  "@radix-ui/react-select": "^2.0.0",
  "lucide-react": "^0.294.0",
  "tailwindcss-animate": "^1.0.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

---

## Code Pattern Signatures

### Pattern 1: Client Component with Hooks

```typescript
"use client"  // ← Always first line

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"  // ← Lucide import

export function ComponentName() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex gap-4 p-6 rounded-lg">  {/* ← Tailwind only */}
      <Button onClick={() => setIsOpen(!isOpen)}>
        Toggle <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  )
}
```

### Pattern 2: Form Submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field1, field2 }),
    })
    // Handle response
  } catch (err) {
    // Handle error
  }
}
```

### Pattern 3: Data Fetching in useEffect

```typescript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await fetch("/api/data")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

---

## Configuration Files

### components.json (⭐ Most Important)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

### tsconfig.json (Path Aliases)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss"
import animate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // CSS variables
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
}

export default config
```

---

## Common V0 Component Library

V0 frequently generates these components from shadcn/ui:

| Component | Import | Purpose |
|-----------|--------|---------|
| Button | `@/components/ui/button` | Interactive button |
| Card | `@/components/ui/card` | Container with styling |
| Input | `@/components/ui/input` | Form input field |
| Label | `@/components/ui/label` | Form label |
| Table | `@/components/ui/table` | Data table |
| Dialog | `@/components/ui/dialog` | Modal dialog |
| Dropdown | `@/components/ui/dropdown-menu` | Dropdown menu |
| Select | `@/components/ui/select` | Select dropdown |
| Tabs | `@/components/ui/tabs` | Tabbed interface |
| Toast | `@/components/ui/toast` | Notification |

Plus **Lucide React icons**: `ChevronDown`, `Menu`, `X`, `Search`, `Home`, etc.

---

## Using the V0 Detector Script

### Setup

```bash
# Make executable
chmod +x v0-detector.js

# Or run with node directly
node v0-detector.js /path/to/project
```

### Example Output

```
╔════════════════════════════════════════════════════════╗
║          V0 PROJECT DETECTION RESULTS                  ║
╚════════════════════════════════════════════════════════╝

Project Root: /home/user/my-project
Detection Status: ✓ V0 Project
Confidence Score: 85.3%

Detected Indicators:
─────────────────────────────────────────────────────────

STRONG INDICATORS (Definitive V0 markers):
  ✓ Next.js v15.0.0 detected
  ✓ 7 shadcn/ui dependencies detected
  ✓ shadcn/ui components directory found with 12 components
  ✓ components.json found (shadcn/ui CLI configuration)

MEDIUM INDICATORS (Supporting V0 evidence):
  ○ Tailwind CSS v3.4.0 detected
  ○ clsx + tailwind-merge utility pattern detected
  ○ kebab-case component naming pattern detected (8 files)
  ○ Path aliases (@/) configured in tsconfig.json

Score Breakdown:
─────────────────────────────────────────────────────────
  Strong Indicators:  4
  Medium Indicators:  4
  Weak Indicators:    1

Interpretation:
─────────────────────────────────────────────────────────
✓ VERY LIKELY a V0-generated project
```

---

## Detection Confidence Levels

| Confidence | Interpretation | V0 Status |
|-----------|-----------------|-----------|
| **90-100%** | Multiple strong indicators + supporting evidence | ✓ Definite V0 |
| **70-90%** | Several strong indicators present | ✓ Very Likely V0 |
| **50-70%** | Some V0 patterns, could be manual Next.js + shadcn | ◆ Possibly V0 |
| **30-50%** | Minimal V0 indicators detected | ◇ Some similarity |
| **Below 30%** | No V0 indicators found | ✗ Not V0 |

---

## Red Flags for V0 Projects

### Security Issues Often Found

- Hardcoded API keys in environment variables
- Missing input validation on server
- Improper authentication setup
- Exposed secrets in generated code
- Missing CSRF protection
- No rate limiting on API routes

### Common Limitations

- Limited backend implementation
- No database schema generation
- Simple state management only (hooks, not Redux/Zustand)
- Minimal testing
- Basic error handling
- No accessibility optimization

---

## Working with V0 Code

### ✓ Do's

- Review all generated code before deployment
- Add comprehensive tests
- Implement proper authentication
- Validate inputs on server-side
- Use environment variables for secrets
- Monitor dependencies for updates
- Test security vulnerabilities

### ✗ Don'ts

- Deploy V0 code directly to production without review
- Hardcode secrets or API keys
- Skip testing and security validation
- Use default/weak authentication
- Trust V0 error handling completely
- Ignore accessibility requirements
- Update major versions without testing

---

## Tools & Commands

### Quick Check Commands

```bash
# Check for components.json
ls components.json 2>/dev/null && echo "✓ components.json found"

# Check for shadcn/ui directory
ls -la components/ui/ 2>/dev/null | head -5

# Count @radix-ui packages
grep -o "@radix-ui[^\"]*" package.json | sort | uniq

# Find "use client" directives
grep -r "\"use client\"" components/ | wc -l

# Find Lucide imports
grep -r "lucide-react" components/ | wc -l

# Count kebab-case component files
ls components/ | grep -E "^[a-z][a-z0-9]*(-[a-z0-9]+)*\.tsx$" | wc -l
```

### Run Detection

```bash
# Automated detection
node v0-detector.js .

# Or with custom path
node v0-detector.js /full/path/to/project
```

### Verify Configuration

```bash
# Pretty print components.json
cat components.json | jq .

# Check tsconfig paths
cat tsconfig.json | jq '.compilerOptions.paths'

# View tailwind config theme
cat tailwind.config.ts | grep -A 20 "extend:"
```

---

## Common V0 Generated Components

### Login Form

```typescript
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function LoginForm() {
  const [email, setEmail] = useState("")
  // ... form logic
}
```

### Navigation Header

```typescript
"use client"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  // ... nav logic
}
```

### Data Table

```typescript
"use client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function DataTable({ data }) {
  return (
    <Table>
      {/* Table implementation */}
    </Table>
  )
}
```

---

## Resources

### Official Documentation
- **V0**: https://v0.app/
- **shadcn/ui**: https://ui.shadcn.com/
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

### Community
- **V0 GitHub Topics**: https://github.com/topics/v0-dev
- **shadcn/ui Registry**: https://ui.shadcn.com/docs/registry

---

## Summary

**V0 projects are easily identifiable by:**

1. ✓ **components.json** - shadcn/ui configuration
2. ✓ **components/ui/** - Generated component library
3. ✓ **"use client"** - React Server Components
4. ✓ **Lucide React** - Icon library choice
5. ✓ **@radix-ui/** - Underlying primitives
6. ✓ **Tailwind CSS** - Styling approach

**Detection confidence increases with each indicator present. Use the automated detector script for comprehensive analysis.**

---

**Quick Decision Tree:**

```
Do you see components.json?
  ├─ YES → 90%+ V0 Project
  └─ NO  → Check components/ui/ directory
            ├─ YES → 70%+ V0 Project
            └─ NO  → Check for "use client" + lucide-react
                      ├─ YES → 50%+ V0-inspired
                      └─ NO  → Probably not V0
```

