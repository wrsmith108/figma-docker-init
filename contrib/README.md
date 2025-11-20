# Contrib Directory

This directory contains standalone, reusable packages that can be:
1. **Integrated into other projects** - Copy and use independently
2. **Contributed upstream** - Submit as PRs to parent projects
3. **Distributed via npm** - Published as separate packages

---

## Packages

### agentdb-retrieval-tracking/

**Status**: Production-ready ✅
**Version**: 1.0.0
**Purpose**: Automatic retrieval tracking and analytics for AgentDB

**Problem Solved**: Teams store knowledge in AgentDB but never retrieve it, wasting 60-90 min/week re-solving known problems.

**Quick Start**:
```bash
cd contrib/agentdb-retrieval-tracking
./bin/agentdb-retrieve-tracked.sh "query" 5
./bin/weekly-retrieval-report.sh
```

**Integration**:
```bash
# Copy to your project
cp -r contrib/agentdb-retrieval-tracking/bin/* scripts/

# Add npm scripts
npm pkg set scripts.agentdb:report="bash scripts/weekly-retrieval-report.sh"
npm pkg set scripts.agentdb:retrieve="bash scripts/agentdb-retrieve-tracked.sh"
```

**Upstream Target**: [AgentDB](https://github.com/ruvnet/agentdb)

**Documentation**:
- [README.md](./agentdb-retrieval-tracking/README.md) - Quick start
- [CONTRIBUTING.md](./agentdb-retrieval-tracking/CONTRIBUTING.md) - Upstream contribution guide
- [docs/INTEGRATION.md](./agentdb-retrieval-tracking/docs/INTEGRATION.md) - Integration patterns

**Files**:
- `bin/` - Executable scripts
- `docs/` - Integration and analysis docs
- `examples/` - Hook and error handler examples
- `package.json` - NPM metadata
- `LICENSE` - MIT license

---

## Contributing New Packages

### Package Structure

```
contrib/
└── package-name/
    ├── README.md           # Quick start and overview
    ├── CONTRIBUTING.md     # Upstream contribution guide
    ├── CHANGELOG.md        # Version history
    ├── LICENSE             # License file
    ├── package.json        # NPM metadata
    ├── bin/                # Executable scripts
    ├── docs/               # Documentation
    └── examples/           # Usage examples
```

### Requirements

1. **Standalone** - No hard dependencies on parent project
2. **Portable** - Works in any project with minimal setup
3. **Documented** - Clear README with quick start
4. **Licensed** - Appropriate open-source license
5. **Tested** - Examples demonstrate working integration

### Naming Convention

- Use kebab-case: `package-name`
- Descriptive: `tool-purpose` (e.g., `agentdb-retrieval-tracking`)
- Prefix with parent tool if applicable

### Documentation Requirements

Each package must include:
- **README.md** - Problem, solution, quick start, use cases
- **CONTRIBUTING.md** - Guidelines for upstream contribution
- **CHANGELOG.md** - Version history following Keep a Changelog
- **LICENSE** - Open-source license (MIT recommended)

---

## Using Contrib Packages

### Option 1: Copy Scripts

```bash
# Copy executable scripts
cp contrib/package-name/bin/* scripts/

# Make executable
chmod +x scripts/*

# Use directly
./scripts/tool-name.sh
```

### Option 2: Symlink

```bash
# Link entire package
ln -s ../contrib/package-name package-name

# Use via symlink
./package-name/bin/tool.sh
```

### Option 3: NPM Install (if published)

```bash
npm install package-name

# Use via npx
npx package-name
```

---

## Upstream Contribution Workflow

### 1. Develop in Contrib

```bash
# Create package directory
mkdir -p contrib/package-name/{bin,docs,examples}

# Develop and test locally
./contrib/package-name/bin/tool.sh
```

### 2. Document for Contribution

```bash
# Create CONTRIBUTING.md with:
# - Upstream integration points
# - Code style guidelines
# - Test requirements
# - PR submission process
```

### 3. Prepare PR

```bash
# Fork upstream repository
git clone https://github.com/upstream/repo.git

# Create feature branch
git checkout -b feature/package-name

# Integrate package
cp -r contrib/package-name/* upstream-location/

# Commit and push
git commit -m "feat: add package-name"
git push origin feature/package-name
```

### 4. Submit PR

- Use package's CONTRIBUTING.md guidelines
- Reference problem/solution in PR description
- Include real-world validation
- Add comprehensive tests

---

## Package Versioning

Follow [Semantic Versioning](https://semver.org/):

- **Major (1.0.0)**: Breaking changes
- **Minor (0.1.0)**: New features, backward compatible
- **Patch (0.0.1)**: Bug fixes, backward compatible

Update `CHANGELOG.md` with each version.

---

## License

Each package should include its own LICENSE file. Default: MIT License (same as parent project).

---

## Questions?

- **Parent Project**: See main [README.md](../README.md)
- **Package Issues**: File in parent project issues
- **Upstream PRs**: Follow package's CONTRIBUTING.md

---

**Maintained by**: Vibe to Docker Team
**Last Updated**: November 20, 2025
