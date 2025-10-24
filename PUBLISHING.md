# Publishing Instructions for figma-docker-init

This document provides comprehensive instructions for publishing the `figma-docker-init` CLI tool to npm using automated semantic-release.

## 🔧 Prerequisites

Before publishing, ensure you have:

1. **Node.js** >= 20.8.1 installed
2. **npm account** with publishing permissions
3. **Git** repository set up with proper remotes
4. **Two-factor authentication** enabled on npm account
5. **GitHub repository** with Actions enabled
6. **NPM_TOKEN** and **GITHUB_TOKEN** configured in repository secrets

## 🤖 Automated Publishing with Semantic Release

This project uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and publishing. The release process is fully automated through GitHub Actions.

### How It Works

- **Conventional Commits**: Follow [conventional commit](https://conventionalcommits.org/) format for commit messages
- **Automatic Versioning**: Versions are determined based on commit types (fix:, feat:, BREAKING CHANGE)
- **Automated Publishing**: Releases are published to npm and GitHub automatically
- **Changelog Generation**: CHANGELOG.md is updated automatically

### Commit Message Format

```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: resolve issue with template validation"

# Minor release (1.0.0 -> 1.1.0)
git commit -m "feat: add new docker template option"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat!: breaking change in CLI interface

BREAKING CHANGE: CLI argument structure has changed"
```

### Release Branches

- `main`: Production releases
- `beta`: Pre-releases with `-beta.x` suffix
- `alpha`: Pre-releases with `-alpha.x` suffix

### Plugins Used

- `@semantic-release/commit-analyzer`: Analyzes commits to determine release type
- `@semantic-release/release-notes-generator`: Generates release notes
- `@semantic-release/changelog`: Updates CHANGELOG.md
- `@semantic-release/npm`: Publishes to npm registry
- `@semantic-release/github`: Creates GitHub releases
- `@semantic-release/git`: Commits version changes back to repository

### GitHub Actions Secrets Setup

Configure the following secrets in your GitHub repository settings:

1. **NPM_TOKEN**: Your npm authentication token
   - Generate at: https://www.npmjs.com/settings/tokens
   - Token type: Automation (recommended) or Classic

2. **GITHUB_TOKEN**: Automatically provided by GitHub Actions (no setup required)

### Manual Publishing (Fallback)

⚠️ **Manual publishing is now deprecated.** Use semantic-release for automated publishing. Manual steps are provided below for emergency situations only.

## 📋 Pre-publishing Checklist

### 1. Version Management
```bash
# Check current version
npm version

# Update version (choose one)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

### 2. Quality Assurance
```bash
# Test CLI functionality
node figma-docker-init.js --help
node figma-docker-init.js --version
node figma-docker-init.js --list

# Validate package contents
npm pack --dry-run

# Check for security vulnerabilities
npm audit
```

### 3. Repository Setup
```bash
# Update repository URLs in package.json (replace with your actual repository)
# "url": "https://github.com/your-username/figma-docker-init.git"

# Commit all changes
git add .
git commit -m "feat: prepare for npm publishing v1.0.0"

# Tag the release
git tag v1.0.0
git push origin main --tags
```

## 🚀 Publishing Process

### Step 1: Login to npm
```bash
npm login
# Follow prompts to enter your npm credentials
```

### Step 2: Test Publishing (Dry Run)
```bash
# This shows what would be published without actually publishing
npm publish --dry-run
```

### Step 3: Publish to npm
```bash
# Publish the package
npm publish

# For scoped packages (if using organization)
npm publish --access public
```

### Step 4: Verify Publication
```bash
# Check if package is available
npm view figma-docker-init

# Test global installation
npm install -g figma-docker-init
figma-docker-init --version
```

## 🔄 Update Process

For subsequent updates:

1. **Make changes** to the codebase
2. **Test thoroughly** in development
3. **Update version** using `npm version`
4. **Update CHANGELOG.md** with new features/fixes
5. **Commit and tag** the release
6. **Publish** using `npm publish`

### Version Strategy
- **Patch** (1.0.x): Bug fixes, security patches
- **Minor** (1.x.0): New features, template additions
- **Major** (x.0.0): Breaking changes, API modifications

## 📦 Package Configuration

### Current Package Metadata
```json
{
  "name": "figma-docker-init",
  "version": "1.0.0",
  "description": "Quick-start Docker setup for Figma-exported React/Vite/TypeScript projects",
  "keywords": [
    "figma", "docker", "react", "vite", "typescript",
    "quick-start", "template", "cli", "containerization",
    "devops", "frontend", "development"
  ],
  "preferGlobal": true
}
```

### Files Included in Package
- `figma-docker-init.js` - Main CLI script
- `package.json` - Package configuration
- `README.md` - Documentation
- `LICENSE` - MIT license
- `templates/` - All template directories and files

## 🔐 Security Best Practices

### Before Publishing
- [ ] Remove any sensitive information or credentials
- [ ] Ensure no `.env` files are included
- [ ] Verify `.gitignore` excludes sensitive files
- [ ] Check that only intended files are in npm package
- [ ] Run security audit: `npm audit`

### Access Control
```bash
# Check who has access to publish
npm owner ls figma-docker-init

# Add collaborator (if needed)
npm owner add <username> figma-docker-init

# Remove access (if needed)
npm owner rm <username> figma-docker-init
```

## 📊 Post-Publishing Tasks

### 1. Update Documentation
- [ ] Update GitHub repository description
- [ ] Add npm badge to README.md
- [ ] Create GitHub release notes
- [ ] Update any external documentation

### 2. Monitor Package
```bash
# Check download statistics
npm view figma-docker-init

# Monitor for issues
# Check GitHub issues and npm for user feedback
```

### 3. Community Engagement
- [ ] Announce on relevant communities
- [ ] Respond to GitHub issues
- [ ] Update documentation based on user feedback

## 🛠️ Troubleshooting

### Common Publishing Issues

**Authentication Error:**
```bash
npm login
# Ensure 2FA is properly configured
```

**Version Conflict:**
```bash
# If version already exists
npm version patch
npm publish
```

**Package Name Taken:**
```bash
# Check availability
npm view <package-name>
# Consider scoped package: @your-username/figma-docker-init
```

**Permission Denied:**
```bash
# Check ownership
npm owner ls figma-docker-init
# Contact npm support if needed
```

## 📋 Release Checklist

### Automated Release Process
With semantic-release, the following happens automatically on pushes to main:

1. **Analysis**: Commits are analyzed for release type
2. **Version Bump**: Version is incremented based on commit types
3. **Changelog**: CHANGELOG.md is updated with release notes
4. **Build**: Package is built and tested
5. **Publish**: Package published to npm
6. **GitHub Release**: Release created with assets
7. **Git Commit**: Version changes committed back to repository

### Manual Verification (After Automated Release)
- [ ] Package visible on npm registry
- [ ] GitHub release created with proper notes
- [ ] CHANGELOG.md updated correctly
- [ ] Version tags created in repository
- [ ] Installation test successful: `npm install -g figma-docker-init`
- [ ] CLI functionality verified: `figma-docker-init --version`

### Troubleshooting Automated Releases

**Release not triggered:**
- Ensure commits follow conventional commit format
- Check that CI pipeline passes completely
- Verify repository secrets are configured

**Publishing failed:**
- Check NPM_TOKEN validity
- Verify npm account has publishing permissions
- Review GitHub Actions logs for specific errors

## 🔗 Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
- [Package.json Documentation](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)

## 📞 Support

For publishing support:
- npm Support: [https://npmjs.com/support](https://npmjs.com/support)
- GitHub Issues: [https://github.com/your-username/figma-docker-init/issues](https://github.com/your-username/figma-docker-init/issues)

---

**Remember**: Once published to npm, versions cannot be unpublished after 24 hours. Always test thoroughly before publishing!