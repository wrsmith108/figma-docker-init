#!/bin/bash
# Archive v3.x versions and mark as legacy
# Run this script to deprecate old versions and create archive materials

set -e  # Exit on error

echo "🗄️  vibe-to-docker v3.x Archival Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: NPM Deprecation
echo "📦 Step 1/5: Deprecating npm versions..."
echo ""

# Deprecate all versions < 4.0.0
echo "Deprecating v1.x, v2.x, and v3.x versions..."
npm deprecate vibe-to-docker@"<4.0.0" "⚠️ This version is deprecated. Please upgrade to v4.x for universal vibe-coding support (Figma, Lovable, Bolt, V0). Migration guide: https://github.com/wrsmith108/vibe-to-docker/blob/pack-master/docs/MIGRATION_V3_TO_V4.md"

echo "✅ npm deprecation complete"
echo ""

# Step 2: Add dist-tag
echo "🏷️  Step 2/5: Adding dist-tags..."
echo ""

# Tag latest stable v3.x as legacy
echo "Tagging v3.4.1 as 'legacy'..."
npm dist-tag add vibe-to-docker@3.4.1 legacy

# Ensure v4.2.0 is tagged as latest
echo "Tagging v4.2.0 as 'latest'..."
npm dist-tag add vibe-to-docker@4.2.0 latest

echo "✅ dist-tags configured"
echo ""

# Step 3: Create Archive Branch
echo "🌿 Step 3/5: Creating archive branch..."
echo ""

# Create archive branch from last v3.x commit
echo "Creating archive/v3-figma-only branch from commit ffe77be..."
git checkout ffe77be
git checkout -b archive/v3-figma-only

# Add archive README
cat > ARCHIVE_README.md << 'EOF'
# Archive: vibe-to-docker v3.x (Figma-only)

This branch contains the **Figma-specific version** (v1.0.0 - v3.4.1) before migration to universal vibe-coding support.

**Status**: ⚠️ **DEPRECATED** - No longer maintained
**Replacement**: See [pack-master branch](https://github.com/wrsmith108/vibe-to-docker/tree/pack-master) for universal support (Figma, Lovable, Bolt, V0)

## Last Stable Version
- **Version**: v3.4.1
- **npm**: `npm install vibe-to-docker@3.4.1`
- **Features**: Figma Make + React/Vite/TypeScript only
- **Released**: November 2025

## Why Deprecated?

v3.x was limited to **Figma Make** projects only. v4.x provides:
- ✅ Universal support: Figma, Lovable, Bolt, V0
- ✅ Production-grade security (SLSA Level 2)
- ✅ Automated setup (Docker + npm install + audit)
- ✅ 40% faster detection
- ✅ Apache 2.0 license with patent protection

## Migration Guide
📖 [MIGRATION_V3_TO_V4.md](https://github.com/wrsmith108/vibe-to-docker/blob/pack-master/docs/MIGRATION_V3_TO_V4.md)

## Version History

### v3.4.x - Final Figma-only releases
- v3.4.1 (Nov 2025) - Last stable release
- v3.4.0 (Nov 2025) - Tool-specific automations

### v3.3.x - Production improvements
- v3.3.2 (Nov 2025) - QA validation
- v3.3.1 (Nov 2025) - Security fixes
- v3.3.0 (Nov 2025) - Performance optimization

### v3.2.x - Feature expansion
- v3.2.0 (Nov 2025) - Enhanced templates

### v3.1.x - Security hardening
- v3.1.1 (Nov 2025) - Dependency updates
- v3.1.0 (Nov 2025) - Security headers

### v3.0.x - Initial stable release
- v3.0.4 - v3.0.0 (Nov 2025) - Figma Make support

### v2.x - Beta releases
- v2.0.1, v2.0.0 (Oct 2025) - Beta testing

### v1.x - Alpha releases
- v1.0.2, v1.0.0 (Oct 2025) - Initial development

## Installing Legacy Version

```bash
# Global installation
npm install -g vibe-to-docker@3.4.1

# One-time use
npx vibe-to-docker@3.4.1 init
```

⚠️ **Not recommended** - v3.x receives no security updates or bug fixes.

## Support

v3.x is **unsupported**. For issues:
- Upgrade to v4.x (recommended)
- File an issue (low priority, may not be fixed)

## License

v3.x is licensed under MIT License. v4.x uses Apache 2.0.
EOF

git add ARCHIVE_README.md
git commit -m "docs: create archive branch for v3.x (Figma-only versions)"
git push -u origin archive/v3-figma-only

echo "✅ Archive branch created"
echo ""

# Return to pack-master
git checkout pack-master

# Step 4: Create GitHub Release
echo "🎉 Step 4/5: Creating GitHub release for v3.4.1..."
echo ""

gh release create v3.4.1 \
  --title "v3.4.1 (Legacy - Figma Only)" \
  --notes "⚠️ **DEPRECATED: This is the last Figma-only release before universal vibe-coding support.**

## Status
- **Deprecated**: November 2025
- **Reason**: Superseded by v4.x with universal tool support
- **Maintenance**: No longer maintained

## Upgrade to v4.x

v4.x provides universal support for:
- ✅ **Figma Make** (same features as v3.x)
- ✅ **Lovable** (Supabase + React + Vite)
- ✅ **Bolt** (Remix + TypeScript)
- ✅ **V0** (Next.js 14 + shadcn/ui)

Plus:
- 🔒 Production-grade security (SLSA Level 2)
- ⚡ 40% faster detection
- 🚀 Automated setup (Docker + npm install + audit)
- 📜 Apache 2.0 license with patent protection

## Installation (Not Recommended)

\`\`\`bash
npm install -g vibe-to-docker@3.4.1
\`\`\`

## Migration Guide
📖 [Migrate to v4.x](https://github.com/wrsmith108/vibe-to-docker/blob/pack-master/docs/MIGRATION_V3_TO_V4.md)

## Archive
🗄️ Source code: [archive/v3-figma-only branch](https://github.com/wrsmith108/vibe-to-docker/tree/archive/v3-figma-only)

---
**Use v4.x instead**: \`npm install -g vibe-to-docker\`"

echo "✅ GitHub release created"
echo ""

# Step 5: Update Main README
echo "📝 Step 5/5: Updating README.md..."
echo ""

# Add version section to README (manual step - show instructions)
cat << 'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Manual Step: Update README.md

Add this section after the badges (around line 10):

## 📦 Version Information

### Current Version: v4.x (Universal Vibe-Coding)
- ✅ **Supported**: Figma, Lovable, Bolt, V0
- ✅ **Maintained**: Active development
- ✅ **License**: Apache 2.0
- 📦 **Install**: `npm install -g vibe-to-docker`

### Legacy Version: v3.x (Figma Only)
- ⚠️ **Deprecated**: No longer maintained (November 2025)
- ⚠️ **Limited**: Figma Make projects only
- 📦 **Install**: `npm install -g vibe-to-docker@3.4.1` (not recommended)
- 📖 **Migration**: See [Migration Guide](docs/MIGRATION_V3_TO_V4.md)
- 🗄️ **Archive**: [v3.x source code](https://github.com/wrsmith108/vibe-to-docker/tree/archive/v3-figma-only)

**Recommendation**: Use v4.x for all new and existing projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo ""
echo "✅ Archival process complete!"
echo ""
echo "Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ npm: All versions <4.0.0 deprecated"
echo "✅ npm: v3.4.1 tagged as 'legacy'"
echo "✅ npm: v4.2.0 tagged as 'latest'"
echo "✅ git: archive/v3-figma-only branch created"
echo "✅ GitHub: v3.4.1 release with deprecation notice"
echo "⚠️  Manual: Update README.md with version section (see above)"
echo ""
echo "Users installing vibe-to-docker will:"
echo "  - Get v4.2.0 by default (npm install vibe-to-docker)"
echo "  - See deprecation warning for v3.x (npm install vibe-to-docker@3.4.1)"
echo "  - Can access legacy via: npm install vibe-to-docker@legacy"
echo ""
