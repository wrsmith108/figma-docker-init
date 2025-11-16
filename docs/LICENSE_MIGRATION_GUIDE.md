# License Migration Guide: MIT → Apache 2.0

## Why Apache 2.0?

Apache 2.0 provides the same permissiveness as MIT with added benefits:
- ✅ Explicit patent grant (protects users and contributors)
- ✅ Prevents patent trolling of your algorithms
- ✅ More corporate-friendly (Google, Facebook standard)
- ✅ Still OSI-approved open source

## Migration Steps

### 1. Legal Verification
- [ ] Verify you own copyright (no significant external contributors yet)
- [ ] Check if any contributors need to agree (if CLA not in place)
- [ ] Consult legal counsel if uncertain

### 2. Update LICENSE File

Replace `/LICENSE` with Apache 2.0 text:

```
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION
[Full Apache 2.0 text from: https://www.apache.org/licenses/LICENSE-2.0.txt]
```

### 3. Create NOTICE File

Create `/NOTICE`:

```
vibe-to-docker
Copyright 2025 [Your Legal Entity Name]

This product includes software developed at
[Your Organization] (https://github.com/wrsmith108/vibe-to-docker).

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
```

### 4. Update package.json

```json
{
  "license": "Apache-2.0"
}
```

### 5. Update README.md

Replace MIT badge with Apache 2.0:

```markdown
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
```

Update license section:

```markdown
## License

Apache License 2.0 - see [LICENSE](LICENSE) file for details.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### 6. Add License Headers to Source Files (Optional)

For each `.js` file, add header:

```javascript
/**
 * Copyright 2025 [Your Legal Entity]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

### 7. Update CONTRIBUTING.md

```markdown
## License

By contributing to vibe-to-docker, you agree that your contributions
will be licensed under the Apache License 2.0.

You confirm that:
- You have the right to submit the contribution
- You grant the project a perpetual, worldwide, non-exclusive, royalty-free,
  irrevocable copyright license and patent license
```

### 8. Announce the Change

**CHANGELOG.md**:

```markdown
# [4.0.0] - 2025-XX-XX

## BREAKING CHANGES

### License Change: MIT → Apache 2.0

- **Previous**: MIT License
- **New**: Apache License 2.0
- **Why**: Added explicit patent grant to protect contributors and users
- **Impact**: Fully backward compatible for users (Apache 2.0 is permissive)
- **Action Required**: None for existing users

Apache 2.0 provides the same freedoms as MIT with additional patent protection.
All existing code remains open source under a permissive license.

See LICENSE file for full text.
```

**GitHub Release Notes**:

```markdown
## License Change Notice

vibe-to-docker v4.0.0 changes license from MIT to Apache 2.0.

**What this means for users**:
- ✅ Same permissive open source license
- ✅ Commercial use still allowed
- ✅ Modification and distribution still allowed
- ✅ **NEW**: Explicit patent grant protects you from patent claims

**Why Apache 2.0?**
- Protects AI detection algorithms from patent trolling
- Standard for enterprise software (used by Google, Facebook, Apache Foundation)
- Better legal clarity for corporate users

**Action required**: None. Existing users can continue as before.
```

### 9. Version Bump

Since this is a license change:

```bash
# Bump to v4.0.0 (major version)
npm version major

git commit -m "chore(license): migrate from MIT to Apache 2.0

BREAKING CHANGE: License changed from MIT to Apache 2.0

- Add explicit patent grant
- Update LICENSE file with Apache 2.0 text
- Create NOTICE file
- Update README and package.json
- Fully backward compatible for users"
```

### 10. Notify Stakeholders

- [ ] Post to GitHub Discussions
- [ ] Update NPM package description
- [ ] Notify major users/contributors
- [ ] Update website/documentation

## FAQ

**Q: Can existing users continue using old MIT-licensed versions?**
A: Yes. v3.x.x remains MIT-licensed forever. v4.0.0+ is Apache 2.0.

**Q: Can I still use vibe-to-docker commercially?**
A: Yes. Apache 2.0 is as permissive as MIT for commercial use.

**Q: Do I need to update my existing projects?**
A: No. Existing installations under MIT remain valid.

**Q: What about dependencies?**
A: All dev dependencies are MIT/Apache 2.0 compatible. No issues.

**Q: Can I still fork and modify?**
A: Yes. Apache 2.0 allows modification and redistribution.

## Rollback Plan

If community backlash occurs:

1. Revert LICENSE to MIT
2. Release v4.0.1 with MIT license restored
3. Announce rollback decision
4. Consider dual licensing instead

## Timeline

- **Week 1**: Prepare license files, update documentation
- **Week 2**: Community feedback period (GitHub Discussions)
- **Week 3**: Finalize changes, commit to main
- **Week 4**: Release v4.0.0 with Apache 2.0

## Resources

- Apache 2.0 Full Text: https://www.apache.org/licenses/LICENSE-2.0
- Apache NOTICE Template: https://www.apache.org/dev/licensing-howto.html
- License Compatibility: https://www.apache.org/legal/resolved.html
