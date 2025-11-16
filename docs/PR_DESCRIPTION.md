# v4.0.0: Apache 2.0 License Migration

## 🎯 Overview

This PR migrates vibe-to-docker from **MIT License** to **Apache License 2.0** with updated copyright holder to **Smith Horn Group Ltd.**

This is a **BREAKING CHANGE** (major version bump to v4.0.0) due to the license change, though it remains fully backward compatible for all users.

---

## 🔐 Why Apache 2.0?

Apache 2.0 provides the **same permissive freedoms as MIT** with critical additions:

### Patent Protection Benefits

✅ **Explicit Patent Grant** (Section 3): Users and contributors receive irrevocable patent license
✅ **Protects AI Detection Algorithms** from patent trolling:
- Parallel AI tool detection with confidence scoring
- Fragment-based Docker template composition
- Cross-platform project isolation architecture

✅ **Industry Standard**: Used by Google, Facebook, Apache Foundation
✅ **Contributor Protection**: All contributors grant patent licenses, protecting the ecosystem
✅ **Enterprise-Friendly**: Better legal clarity for corporate adoption

---

## 📋 Changes Made

### License Files
- ✅ `LICENSE` - Replaced with full Apache License 2.0 text
- ✅ `NOTICE` - New file listing copyright and patent-protected algorithms

### Package Configuration
- ✅ `package.json` - v4.0.0, Apache-2.0, Smith Horn Group Ltd.
- ✅ Added `NOTICE` to published files list

### Documentation
- ✅ `README.md` - Updated license badge and full Apache 2.0 notice
- ✅ `CONTRIBUTING.md` - Added explicit patent grant terms for contributors
- ✅ `CHANGELOG.md` - Comprehensive v4.0.0 breaking change documentation

### Source Code Headers
- ✅ `src/detectors/detector-chain.js` - Apache 2.0 header + patent notice
- ✅ `src/lib/template-composer.js` - Apache 2.0 header + patent notice
- ✅ `vibe-to-docker.js` - Apache 2.0 header in main CLI

### Git Operations
- ✅ Git tag `v4.0.0` created with license migration description
- ✅ Conventional commit format with breaking change notice

---

## 👥 What This Means for Users

### ✅ Still Fully Open Source
- OSI-approved license (same as MIT)
- Same permissive freedoms
- Commercial use still allowed
- No code changes required

### ✅ Backward Compatible
- v3.x.x and earlier: MIT License (remains MIT forever)
- v4.0.0 and later: Apache 2.0 License
- Both licenses allow commercial use and redistribution

### ✅ Enhanced Protection
- Explicit patent grants protect users from patent claims
- Contributors can't later claim patent infringement
- Protects the novel AI detection algorithms

---

## 🔍 Files Changed

**License & Legal** (3 files):
- `LICENSE` - Apache 2.0 full text (201 lines)
- `NOTICE` - Copyright and patent notice (28 lines)
- `CHANGELOG.md` - v4.0.0 breaking change docs

**Configuration** (1 file):
- `package.json` - Version, license, author updated

**Documentation** (2 files):
- `README.md` - License badge and section
- `CONTRIBUTING.md` - Patent grant terms

**Source Code** (3 files):
- `vibe-to-docker.js` - Main CLI header
- `src/detectors/detector-chain.js` - Detection algorithm header
- `src/lib/template-composer.js` - Template composition header

**Total**: 9 files modified/added

---

## 🧪 Testing

- ✅ `npm publish --dry-run` successful
- ✅ Package size: 113.8 kB (100 files)
- ✅ All required files included (LICENSE, NOTICE, source)
- ✅ Git tag v4.0.0 created
- ✅ Conventional commit format validated

---

## 📦 Next Steps After Merge

1. **NPM Publish**:
   ```bash
   npm login
   npm publish
   npm view vibe-to-docker@4.0.0
   ```

2. **GitHub Release**:
   - Create release from v4.0.0 tag
   - Copy CHANGELOG content
   - Attach .tgz package

3. **Announcements**:
   - GitHub Discussions post
   - Update documentation site

---

## 🎓 Legal Review

This migration was prepared following the LICENSE_MIGRATION_GUIDE.md:
- ✅ All source files have proper headers
- ✅ NOTICE file includes patent-protected algorithms
- ✅ Contributor terms updated with patent grant
- ✅ README clearly states license terms
- ✅ CHANGELOG documents breaking change

---

## ⚠️ Breaking Change Notice

**Version**: 3.3.1 → 4.0.0
**License**: MIT → Apache 2.0
**Copyright**: Figma Docker Init Team → Smith Horn Group Ltd.

Users on v3.x can continue using MIT-licensed versions. Upgrading to v4.0.0 means accepting Apache 2.0 terms.

---

## 📚 References

- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- Migration Guide: `docs/LICENSE_MIGRATION_GUIDE.md`
- Licensing Report: `docs/LICENSING_REPORT.md`
- Why Apache vs MIT: Protection for AI detection algorithms

---

**Ready for review and merge to pack-master** ✅
