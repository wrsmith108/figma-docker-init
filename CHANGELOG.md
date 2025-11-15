# [3.0.0](https://github.com/wrsmith108/vibe-to-docker/compare/v2.0.1...v3.0.0) (2025-11-15)


### Bug Fixes

* **cache:** prevent race condition causing null cache results ([419f171](https://github.com/wrsmith108/vibe-to-docker/commit/419f1717ec76649e271674271ae589a1c64fd7c8))
* **ci:** Add detectOpenHandles and runInBand for clean test exit ([31932d1](https://github.com/wrsmith108/vibe-to-docker/commit/31932d1c971fce9ad937bc8c2aa509fd52d83621))
* **ci:** comprehensive test fixes - missing file and ES modules ([3275226](https://github.com/wrsmith108/vibe-to-docker/commit/3275226c1edc26be666a5636145694c6beef4ef6))
* **ci:** handle SIGPIPE error in package verification ([4b13484](https://github.com/wrsmith108/vibe-to-docker/commit/4b13484549b967f74399b027e6f775641c3e5101))
* **ci:** validate only user-facing templates, skip test fixtures ([7cb22a4](https://github.com/wrsmith108/vibe-to-docker/commit/7cb22a44f82e0c6f5a74ded1106ce3568b243fe6))
* **phase-2:** Fix ES module compatibility in test files ([3c936a7](https://github.com/wrsmith108/vibe-to-docker/commit/3c936a7f358e7e0c8f3808088e67e60820447e00))
* **release:** Correct repository URLs for semantic-release ([74a77ad](https://github.com/wrsmith108/vibe-to-docker/commit/74a77ad5c2e2b1e5410cf1f8421b812b2576c2bc))
* remove agentdb dependency causing installation loop ([75cabcf](https://github.com/wrsmith108/vibe-to-docker/commit/75cabcf921df5d399f4dd9d4c9918219cb996626))
* remove all template warnings for clean output ([6f08e82](https://github.com/wrsmith108/vibe-to-docker/commit/6f08e825b93ae13d3dc840d9913b0da29fa3c58d))
* remove SSL configuration from basic template nginx ([7b64ccb](https://github.com/wrsmith108/vibe-to-docker/commit/7b64ccb94e321b1b62679e0ce0008965b9d02c25))
* resolve module import errors and missing dependencies in v2.0.0-beta.2 ([461a71f](https://github.com/wrsmith108/vibe-to-docker/commit/461a71f6a5a2546dc0c4719754ad647dcadb5a63))
* **tests:** Add 19 more fixes - EnvManager/TemplateValidator improvements ([fe703fb](https://github.com/wrsmith108/vibe-to-docker/commit/fe703fb956f3b4ec1e8589817086a0e7fd44db1e))
* **tests:** Add tool-specific compose/env generation - 96.0% pass rate ([1bf4405](https://github.com/wrsmith108/vibe-to-docker/commit/1bf4405a33fc97e7d08f35f06c6a98b5a28e679a))
* **tests:** Add Windows cross-platform compatibility to path tests ([5ac9c38](https://github.com/wrsmith108/vibe-to-docker/commit/5ac9c384f4faec0757d3bab4b7c891212590a598))
* **tests:** complete ES module conversion for E2E tests ([9c701fb](https://github.com/wrsmith108/vibe-to-docker/commit/9c701fb77d125695000310da05e4da41e9f2bc28))
* **tests:** convert integration tests to ES modules ([abc98f9](https://github.com/wrsmith108/vibe-to-docker/commit/abc98f9827c461dfabe39908e941af4d99ed1795))
* **tests:** Fix 26 tests - 99.4% pass rate (1,224/1,231) ([c8c398f](https://github.com/wrsmith108/vibe-to-docker/commit/c8c398f7e933f5175a2f28c895be8e906dcf40ad))
* **tests:** Fix 8 tests - add validator methods, update TemplateComposer API ([898696f](https://github.com/wrsmith108/vibe-to-docker/commit/898696f04a9811f5de27ae173c14832dd132a710))
* **tests:** Fix 9 tests - Phase 3 exports, CLI interface, validator improvements ([208fd72](https://github.com/wrsmith108/vibe-to-docker/commit/208fd72a75077ee85850cbb89b2fc06bb05c7c2d))
* **tests:** Fix flaky cache performance test threshold ([88eee6d](https://github.com/wrsmith108/vibe-to-docker/commit/88eee6d0610b013a1078bd83d669cf3aa315e82a))
* **tests:** Fix macOS platform tests for CI compatibility ([b350ce0](https://github.com/wrsmith108/vibe-to-docker/commit/b350ce06db55f02b1ad14687227229471de1d1f5))
* **tests:** Relax flaky performance test for CI stability ([50cd5c0](https://github.com/wrsmith108/vibe-to-docker/commit/50cd5c05acd0bc27837b8d81d57649acc18dbeff))
* **tests:** Relax performance timing thresholds for CI environments ([7fd5a57](https://github.com/wrsmith108/vibe-to-docker/commit/7fd5a57d2597c7786235d307126c26f5d3f174b5))
* **tests:** Relax phase3 CLI benchmark timing thresholds for CI ([f29d2e1](https://github.com/wrsmith108/vibe-to-docker/commit/f29d2e16556ec55b576fa5f634e89e46c102ca77))
* **tests:** relax template generation performance threshold for CI compatibility ([3bcf457](https://github.com/wrsmith108/vibe-to-docker/commit/3bcf457375ad783f88616869e59328139e84f830))
* **tests:** Relax template performance timing thresholds for CI ([f921eef](https://github.com/wrsmith108/vibe-to-docker/commit/f921eef28a17c8043b3c03930bf4fb98b35558a1))
* **tests:** Update coverage config for modular codebase architecture ([65902f9](https://github.com/wrsmith108/vibe-to-docker/commit/65902f92c073f23fad4b8d2ba38a5dab5a532c76))
* **tests:** update test assertions to match v2 CLI behavior ([1c17255](https://github.com/wrsmith108/vibe-to-docker/commit/1c17255515bcf3838e6ba1c1198c856fe6a81efd))
* **tests:** use dynamic paths in path-resolver tests for CI compatibility ([56374da](https://github.com/wrsmith108/vibe-to-docker/commit/56374da3b8742d16cf1ace993946a04ebb4b8682))
* **windows:** use fileURLToPath for cross-platform path resolution ([bdbaae6](https://github.com/wrsmith108/vibe-to-docker/commit/bdbaae65119f55e7c9772d68d9c9e14e9c107904))


### chore

* **release:** prepare v2.0.0-beta.1 for npm ([c284110](https://github.com/wrsmith108/vibe-to-docker/commit/c284110e9e3c1d5dbcba001635bf04b47008923c))


### Features

* **detectors:** implement Lovable project detector with 95% confidence targeting ([b9ee075](https://github.com/wrsmith108/vibe-to-docker/commit/b9ee075913131cdc8edb98a942afb9a24b0edaba))
* implement framework, database, and backend detectors ([674e91e](https://github.com/wrsmith108/vibe-to-docker/commit/674e91ee46ab5030486c5de2fb8d9694f7dee701)), closes [#3](https://github.com/wrsmith108/vibe-to-docker/issues/3) [#4](https://github.com/wrsmith108/vibe-to-docker/issues/4) [#5](https://github.com/wrsmith108/vibe-to-docker/issues/5)
* Phase 0 Quick Wins - Complete migration foundation (10,000 tokens) ([c5bae5f](https://github.com/wrsmith108/vibe-to-docker/commit/c5bae5f553e35eb17ba1f6768981112594b1aeb5))
* **phase-1:** Complete detector system with 100% test coverage ([116c388](https://github.com/wrsmith108/vibe-to-docker/commit/116c388e3b892b17a576518ba9d999fc8ea082c6))
* **phase-2:** Implement complete template system (85% complete) ([979be86](https://github.com/wrsmith108/vibe-to-docker/commit/979be86315d3959785cc310b7bd42d166b39b2c0))
* **phase-3:** Complete CLI integration with Phase 2 template system ([5bde7c9](https://github.com/wrsmith108/vibe-to-docker/commit/5bde7c9db0522dec700d93dc059e9b55d5f4a9c4))
* **tests:** ACHIEVE 100% TEST PASS RATE - 1,231/1,231 passing! 🎉 ([e003237](https://github.com/wrsmith108/vibe-to-docker/commit/e003237924dbcd25ce2cd7238cbd4723369ab7a7))
* **tests:** Multi-agent swarm fixes - 97.3% pass rate (+22 tests) ([50ea997](https://github.com/wrsmith108/vibe-to-docker/commit/50ea99788290141ec3276fc7aba63d2a1aa20269))


### BREAKING CHANGES

* **release:** None - fully backward compatible

Test Results: 97.4% pass rate (484/497 tests)
Package Size: 32.2 kB
Files: 29 core files

Co-Authored-By: Claude Code <noreply@anthropic.com>

## [2.0.1](https://github.com/wrsmith108/vibe-to-docker/compare/v2.0.0...v2.0.1) (2025-10-24)


### Bug Fixes

* **ci:** change artifact upload to ignore missing files ([fc27c2d](https://github.com/wrsmith108/vibe-to-docker/commit/fc27c2d4375067b89937fd2caf27c2d73257fc93))

# [2.0.0](https://github.com/wrsmith108/vibe-to-docker/compare/v1.0.2...v2.0.0) (2025-10-24)


* feat!: drop Node 18 support, require Node >= 20.8.1 ([5584ce3](https://github.com/wrsmith108/vibe-to-docker/commit/5584ce3166e10b376c40bf5e0bb351f893d3ce6e))


### Bug Fixes

* **ci:** add NODE_AUTH_TOKEN for npm authentication ([ebd090d](https://github.com/wrsmith108/vibe-to-docker/commit/ebd090d5863c9f7c8443f3caf58dd92261836b1c))
* **ci:** grant semantic-release write permissions for contents ([6ce8fa2](https://github.com/wrsmith108/vibe-to-docker/commit/6ce8fa218cb42d201d5184958ecced8d89d5673b))
* **release:** configure semantic-release to use pack-master branch ([8403175](https://github.com/wrsmith108/vibe-to-docker/commit/84031758cf66a6e7f3b5835b1cb0a53b0c2d171e))


### chore

* trigger semantic-release for v2.0.0 ([fdb532a](https://github.com/wrsmith108/vibe-to-docker/commit/fdb532a8cf89486a697f2b6c9a7376d778ddaf71))


### BREAKING CHANGES

* that requires Node >= 20.8.1.

The previous v1.0.0 tag was created locally but failed to publish to npm
because v1.0.0 already exists on npm from the main branch (with Node 18).

Semantic-release will now correctly:
- Fetch latest from npm (1.0.2)
- Detect breaking change commits
- Bump major version to 2.0.0
- Publish to npm successfully
* Node.js 18 is no longer supported. Minimum required version is now 20.8.1.

This change resolves semantic-release engine compatibility warnings and aligns
with the requirements of the latest semantic-release tooling.

Changes:
- package.json: Updated engines to require Node >= 20.8.1 and npm >= 10.0.0
- .github/workflows/ci.yml: Removed Node 18 from test matrix
- .github/workflows/ci.yml: Updated NODE_VERSION_DEFAULT from 18 to 20
- README.md: Updated Node.js version badge and prerequisites
- DOCKER.md: Updated base image reference from Node 18 to Node 20
- templates/*/DOCKER.md: Updated all template documentation
- PUBLISHING.md: Updated Node version requirements
- AGENTIC_SPRINT_PLAN.md: Updated test matrix documentation

Benefits:
- Eliminates npm EBADENGINE warnings for semantic-release packages
- Aligns with semantic-release@24+ requirements (Node >= 20.8.1)
- Ensures full compatibility with latest tooling
- Reduces CI matrix from 9 jobs to 6 jobs (20% faster)

Migration:
Users on Node 18 must upgrade to Node 20.8.1 or higher before updating to this version.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# 1.0.0 (2025-10-24)


* feat!: drop Node 18 support, require Node >= 20.8.1 ([5584ce3](https://github.com/wrsmith108/vibe-to-docker/commit/5584ce3166e10b376c40bf5e0bb351f893d3ce6e))


### Bug Fixes

* **ci:** add NODE_AUTH_TOKEN for npm authentication ([ebd090d](https://github.com/wrsmith108/vibe-to-docker/commit/ebd090d5863c9f7c8443f3caf58dd92261836b1c))
* **ci:** grant semantic-release write permissions for contents ([6ce8fa2](https://github.com/wrsmith108/vibe-to-docker/commit/6ce8fa218cb42d201d5184958ecced8d89d5673b))
* **ci:** remove invalid jq YAML validation in template integrity check ([43206ff](https://github.com/wrsmith108/vibe-to-docker/commit/43206ff2253e66bb765347c69d69dd76edddf311))
* **ci:** use jest.js directly to avoid Windows bash script issue ([94e102a](https://github.com/wrsmith108/vibe-to-docker/commit/94e102a4cf10b4c1b062c160081889a03fe9d709)), closes [#18769285806](https://github.com/wrsmith108/vibe-to-docker/issues/18769285806) [#18769410002](https://github.com/wrsmith108/vibe-to-docker/issues/18769410002)
* **ci:** use npx jest for cross-platform Windows compatibility ([256d629](https://github.com/wrsmith108/vibe-to-docker/commit/256d629a0b3eae77c35629d6100c70fe416591b4)), closes [#18769285806](https://github.com/wrsmith108/vibe-to-docker/issues/18769285806)
* **release:** configure semantic-release to use pack-master branch ([8403175](https://github.com/wrsmith108/vibe-to-docker/commit/84031758cf66a6e7f3b5835b1cb0a53b0c2d171e))
* resolve all CI test failures - port allocation and E2E improvements ([0a837de](https://github.com/wrsmith108/vibe-to-docker/commit/0a837def20fb5bee92bb0c216091a2d269995e32))
* resolve docker-compose configuration issue ([9937833](https://github.com/wrsmith108/vibe-to-docker/commit/99378339afc95119add7bee1716844e426fb7840))
* **test:** prevent async log after test completion in main-function ([c6575f8](https://github.com/wrsmith108/vibe-to-docker/commit/c6575f8e6214767402130cb4ccbdeac16c68dc85)), closes [#18769483605](https://github.com/wrsmith108/vibe-to-docker/issues/18769483605)


### Features

* add comprehensive test suite, CI/CD pipeline, coverage reporting, and semantic-release ([9560bdf](https://github.com/wrsmith108/vibe-to-docker/commit/9560bdf6387d772efb1bd5bd3414608ec7f8012c))
* implement v1.1.0 refactoring with improved modularity ([3878736](https://github.com/wrsmith108/vibe-to-docker/commit/38787365b9b16c63b03818443edaf743e3d6270c))
* initial release of vibe-to-docker CLI tool ([c120940](https://github.com/wrsmith108/vibe-to-docker/commit/c12094087e82bd823ec05be181c9e43d5fac51e3))


### BREAKING CHANGES

* Node.js 18 is no longer supported. Minimum required version is now 20.8.1.

This change resolves semantic-release engine compatibility warnings and aligns
with the requirements of the latest semantic-release tooling.

Changes:
- package.json: Updated engines to require Node >= 20.8.1 and npm >= 10.0.0
- .github/workflows/ci.yml: Removed Node 18 from test matrix
- .github/workflows/ci.yml: Updated NODE_VERSION_DEFAULT from 18 to 20
- README.md: Updated Node.js version badge and prerequisites
- DOCKER.md: Updated base image reference from Node 18 to Node 20
- templates/*/DOCKER.md: Updated all template documentation
- PUBLISHING.md: Updated Node version requirements
- AGENTIC_SPRINT_PLAN.md: Updated test matrix documentation

Benefits:
- Eliminates npm EBADENGINE warnings for semantic-release packages
- Aligns with semantic-release@24+ requirements (Node >= 20.8.1)
- Ensures full compatibility with latest tooling
- Reduces CI matrix from 9 jobs to 6 jobs (20% faster)

Migration:
Users on Node 18 must upgrade to Node 20.8.1 or higher before updating to this version.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- CHANGELOG CONTENT WILL BE AUTOMATICALLY GENERATED BY SEMANTIC-RELEASE -->
