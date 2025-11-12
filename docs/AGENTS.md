# Agents Configuration for Vibe-to-Docker Project

## Overview
This document defines the AI agents available for the vibe-to-docker migration project. Agents are specialized AI assistants that handle specific aspects of development, testing, and documentation.

## Active Agents

### Development Agents

#### 1. Tool Detector Agent
**Purpose**: Research and implement detection logic for vibe-coding tools
**Specializations**:
- Pattern recognition in project structures
- Package.json dependency analysis
- Config file detection
- Source tool signature identification

**Tools**: Researcher, Coder
**Token Budget**: 15,000 tokens per tool signature

#### 2. Framework Detector Agent
**Purpose**: Identify JavaScript frameworks and build tools
**Specializations**:
- React, Vue, Svelte, Next.js detection
- Vite, Webpack, Turbopack identification
- TypeScript configuration analysis
- Build script parsing

**Tools**: Researcher, Coder
**Token Budget**: 12,000 tokens per framework detector

#### 3. Database Detector Agent
**Purpose**: Identify database requirements and configurations
**Specializations**:
- Supabase, PostgreSQL, MongoDB, SQLite detection
- Connection string analysis
- Schema file discovery
- ORM/Query builder identification

**Tools**: Researcher, Coder
**Token Budget**: 10,000 tokens per database detector

#### 4. Backend Detector Agent
**Purpose**: Identify backend frameworks and API patterns
**Specializations**:
- Express, Fastify, Hono, NestJS detection
- API route discovery (Next.js, SvelteKit)
- Server directory identification
- Middleware and handler analysis

**Tools**: Researcher, Coder
**Token Budget**: 12,000 tokens per backend detector

#### 5. Template Generator Agent
**Purpose**: Create Docker templates for different project types
**Specializations**:
- Dockerfile generation
- docker-compose.yml creation
- nginx configuration
- Multi-stage builds
- Environment variable management

**Tools**: Coder, Reviewer
**Token Budget**: 20,000 tokens per template

### Testing Agents

#### 6. Test Migration Agent
**Purpose**: Update existing tests for vibe-to-docker
**Specializations**:
- Test refactoring
- Assertion updates
- Mock data generation
- Integration test creation

**Tools**: Tester, Reviewer
**Token Budget**: 15,000 tokens per test suite

#### 7. Detection Testing Agent
**Purpose**: Create tests for tool/framework detection
**Specializations**:
- Unit tests for detectors
- Mock project generation
- Edge case coverage
- False positive prevention

**Tools**: Tester, Coder
**Token Budget**: 10,000 tokens per detector test suite

### Documentation Agents

#### 8. Migration Documentation Agent
**Purpose**: Create comprehensive migration guides
**Specializations**:
- Tool-specific guides (Figma, Lovable, V0, Bolt)
- API documentation
- Example project creation
- Tutorial content

**Tools**: Researcher, Writer
**Token Budget**: 25,000 tokens per guide

#### 9. README Generator Agent
**Purpose**: Rewrite README for vibe-to-docker branding
**Specializations**:
- Marketing copy
- Feature descriptions
- Installation instructions
- Quick start guides

**Tools**: Writer, Reviewer
**Token Budget**: 15,000 tokens

### Review & Quality Agents

#### 10. Code Review Agent
**Purpose**: Review all code changes for quality and consistency
**Specializations**:
- Security review
- Performance analysis
- Best practices enforcement
- Breaking change detection

**Tools**: Reviewer, Analyst
**Token Budget**: 30,000 tokens for full codebase review

#### 11. Architecture Validator Agent
**Purpose**: Ensure architectural consistency
**Specializations**:
- Design pattern validation
- Dependency analysis
- Module cohesion review
- Scalability assessment

**Tools**: Architect, Reviewer
**Token Budget**: 20,000 tokens

## Agent Coordination

### Parallel Execution Pattern
Agents can run in parallel when working on independent components:

```javascript
// Example: Run 4 detector agents in parallel
Task("Tool Detector", "Implement Figma/Lovable/V0/Bolt detection", "researcher")
Task("Framework Detector", "Implement React/Vue/Svelte/Next detection", "researcher")
Task("Database Detector", "Implement DB detection system", "researcher")
Task("Backend Detector", "Implement backend framework detection", "researcher")
```

### Sequential Execution Pattern
Some tasks must complete before others can start:

```
Phase 1: Research (Detectors research APIs and patterns)
  ↓
Phase 2: Implementation (Detectors write code)
  ↓
Phase 3: Testing (Test agents validate detectors)
  ↓
Phase 4: Integration (Templates use detector results)
  ↓
Phase 5: Documentation (Docs explain new features)
```

## Memory Coordination with AgentDB

All agents store learnings in AgentDB for cross-session persistence:

```javascript
// Agent stores detection pattern
await agentdb.store({
  type: 'pattern',
  tool: 'lovable',
  signature: { dependencies: ['@lovable/core'], files: ['.lovable'] },
  confidence: 0.95
});

// Later agent retrieves pattern
const patterns = await agentdb.retrieve({ type: 'pattern', tool: 'lovable' });
```

## Agent Communication Protocol

Agents communicate through:
1. **AgentDB Memory**: Persistent storage of findings, patterns, decisions
2. **File System**: Shared access to docs/ for handoffs
3. **Git Commits**: Clear commit messages document progress
4. **Retros**: End-of-phase retrospectives capture learnings

## Token Budget Allocation

Total project budget: ~280,000 tokens

| Phase | Token Allocation | Key Agents |
|-------|-----------------|------------|
| Research | 45,000 | Researcher agents (4× detectors) |
| Implementation | 120,000 | Coder agents, Template generators |
| Testing | 50,000 | Tester agents, Review agents |
| Documentation | 35,000 | Documentation agents |
| Review | 30,000 | Code review, Architecture validation |

## Agent Selection Guidelines

### When to Use Specialized Agents
- **Complex logic**: Use dedicated agents for detection systems
- **Multiple frameworks**: Parallel agents for each framework
- **Independent modules**: One agent per module

### When to Use General Agents
- **Simple refactoring**: General coder agent sufficient
- **Documentation updates**: General writer agent sufficient
- **Quick fixes**: General reviewer can handle

## Success Criteria for Agents

Each agent must:
1. **Complete objectives**: Achieve all listed goals
2. **Stay within budget**: Use ≤ estimated tokens
3. **Maintain quality**: Pass all reviews
4. **Document learnings**: Update AgentDB with findings
5. **Enable next phase**: Provide clean handoff to next agents

## Agent Retro Schedule

Retrospectives occur after each phase:
- **Phase 1 Retro**: After research completion
- **Phase 2 Retro**: After implementation
- **Phase 3 Retro**: After testing
- **Phase 4 Retro**: After documentation
- **Phase 5 Retro**: Final project retrospective

Template: docs/RETROSPECTIVE_TEMPLATE.md
