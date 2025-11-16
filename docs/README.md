# Documentation

Welcome to vibe-to-docker documentation! This guide will help you get started with containerizing your AI-generated projects.

## 📚 Quick Start

### For Users
- **[CLI User Guide](guides/CLI_USER_GUIDE.md)** - Complete CLI reference and usage
- **[Migration Guide](guides/MIGRATION_GUIDE.md)** - Migrating existing projects

### Platform-Specific Guides
- **[Figma Make Guide](guides/FIGMA_MAKE_GUIDE.md)** - Using with Figma Make projects
- **[Bolt Guide](guides/BOLT_GUIDE.md)** - Using with Bolt.new projects
- **[Lovable Guide](guides/LOVABLE_GUIDE.md)** - Using with Lovable (GPT Engineer) projects
- **[V0 Guide](guides/V0_GUIDE.md)** - Using with Vercel V0 projects

## 🏗️ Architecture

- **[System Architecture](architecture/SYSTEM_ARCHITECTURE.md)** - Overall system design
- **[Architecture Summary](architecture/ARCHITECTURE_SUMMARY.md)** - Key architectural decisions
- **[CLI Architecture](architecture/PHASE_3_CLI_ARCHITECTURE.md)** - CLI design and implementation
- **[Phase 1 Architecture](architecture/phase1-architecture.md)** - Initial detection system

## 🔧 Technical Details

### API Documentation
- **[API Reference](api/API.md)** - Complete API documentation

### Template System
- **[Template Architecture](templates/TEMPLATE_ARCHITECTURE.md)** - Template system design
- **[Template Diagrams](templates/TEMPLATE_ARCHITECTURE_DIAGRAMS.md)** - Visual architecture diagrams
- **[Fragment System Overview](fragments/FRAGMENT_SYSTEM_OVERVIEW.md)** - How fragments work
- **[Fragment Usage Guide](fragments/FRAGMENT_USAGE.md)** - Using template fragments
- **[Fragment Implementation](fragments/IMPLEMENTATION_SUMMARY.md)** - Implementation details

## 🔒 Security

**vibe-to-docker** implements comprehensive security best practices:

- 🔒 **Image Pinning**: Base images and packages pinned with SHA256 digests
- 🛡️ **Security Options**: Runtime hardening with `no-new-privileges`, read-only filesystem
- ⚡ **Resource Limits**: CPU and memory constraints prevent resource exhaustion
- 🏥 **Health Monitoring**: Aligned health checks between Dockerfile and docker-compose.yml
- 📦 **Minimal Attack Surface**: Multi-stage builds and pinned packages
- 👤 **Non-Root User**: Applications run as non-privileged user (UID 1001)
- 🚫 **Build Security**: .dockerignore prevents sensitive file leakage

**Security Documentation:**
- **[Docker Security Best Practices](DOCKER_SECURITY.md)** - Comprehensive security guide
- **[Secure Environment Configuration](../src/templates/base/.env.example)** - Environment setup

## 📖 Additional Resources

### Research & Best Practices
- **[Docker Best Practices](research/DOCKER_BEST_PRACTICES.md)** - Docker optimization techniques
- **[Research Index](research/README.md)** - Platform research and investigations

### Publishing & Deployment
- **[NPM Publishing Guide](guides/NPM_PUBLISH_INSTRUCTIONS.md)** - Publishing to NPM
- **[Publishing Documentation](guides/PUBLISHING.md)** - General publishing workflow

### Internal Documentation
- **[Internal Docs](internal/)** - Agent system and detector chain documentation

---

## 🤝 Contributing

For contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md) in the root directory.

## 📝 License

Apache License 2.0 - see [LICENSE](../LICENSE) for details.

---

**Development documentation, QA reports, and internal planning documents are maintained separately for project maintainers.**
