# Test Fixtures for Phase 2

This directory contains test fixtures for the Phase 2 template system testing.

## Contents

### template-fixtures.js

Comprehensive test data including:

- **Sample Detections**: Detection results for all 4 tool types (Lovable, Bolt, V0, Figma Make)
  - Minimal configurations
  - Full-featured configurations
  - Confidence scores and evidence

- **Sample Package.json Files**: Realistic package.json files for each tool type

- **Sample Configuration Files**:
  - Vite configs
  - TypeScript configs
  - Next.js configs

- **Expected Outputs**:
  - Dockerfiles
  - docker-compose.yml files
  - .env.example files

- **Template Fragments**:
  - Framework fragments (React, Next.js, Vue, Svelte)
  - Database fragments (PostgreSQL, MySQL, MongoDB)
  - Backend fragments (Supabase, Firebase, Node.js)

## Usage

```javascript
import {
  sampleDetections,
  samplePackageJsons,
  expectedDockerfiles,
  createMockProjectStructure
} from './fixtures/template-fixtures.js';

// Use sample detection
const detection = sampleDetections.lovable.full;
await composer.generate(detection);

// Create mock project
await createMockProjectStructure(fs, tempDir, 'lovable');
```

## Tool Types

### 1. Lovable
- React + Vite + TypeScript
- Supabase backend
- shadcn/ui components
- Tailwind CSS

### 2. Bolt
- React + Vite
- StackBlitz WebContainer
- Minimal configuration

### 3. V0
- Next.js 14+
- Radix UI components
- Tailwind CSS
- TypeScript

### 4. Figma Make
- React + Vite + TypeScript
- Standard Figma export structure
- Minimal dependencies

## Fixture Quality

All fixtures are:
- Based on real-world projects
- Include realistic dependency versions
- Cover common and edge-case scenarios
- Validated for correctness

## Maintenance

When adding new fixtures:
1. Follow existing naming conventions
2. Include both minimal and full variants
3. Add documentation in this README
4. Update related tests to use new fixtures
