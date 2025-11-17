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
