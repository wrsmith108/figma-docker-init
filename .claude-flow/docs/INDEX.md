# Internal Documentation Index

**Last Updated**: November 17, 2025
**Location**: `.claude-flow/docs/` (gitignored)
**Purpose**: Institutional knowledge for vibe-to-docker development

## Quick Navigation

### 🎯 Start Here
- **[RETROSPECTIVE_INTEGRATION_SUMMARY.md](RETROSPECTIVE_INTEGRATION_SUMMARY.md)** - Overview of retrospective integration
- **[AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md)** - Key learnings from all 17 AgentDB episodes
- **[ROADMAP.md](ROADMAP.md)** - Project roadmap and future priorities

### 📊 Retrospectives
Located in `retrospectives/`:
- **[REPLIT_FEATURE_RETROSPECTIVE.md](retrospectives/REPLIT_FEATURE_RETROSPECTIVE.md)** - v4.3.0 comprehensive analysis (26,089 lines)
- **[PHASE_0_RETROSPECTIVE.md](retrospectives/PHASE_0_RETROSPECTIVE.md)** - Early phase learnings (13,803 lines)
- **[PHASE_1_RETROSPECTIVE.md](retrospectives/PHASE_1_RETROSPECTIVE.md)** - Phase 1 analysis (25,100 lines)
- **[PHASE_2_RETROSPECTIVE.md](retrospectives/PHASE_2_RETROSPECTIVE.md)** - Phase 2 review (43,521 lines)
- **[PHASE_3_RETROSPECTIVE.md](retrospectives/PHASE_3_RETROSPECTIVE.md)** - Phase 3 completion (18,694 lines)

### 🛠️ Implementation Plans
Located in `implementations/`:
- **[COORDINATION_IMPLEMENTATION.md](implementations/COORDINATION_IMPLEMENTATION.md)** - Swarm coordination details
- **[METRICS_TRACKING.md](implementations/METRICS_TRACKING.md)** - Automated metrics collection plan

### ✅ Quality Assurance
Located in `qa/`:
- **[QA_PUBLIC_DIR_ANALYSIS.md](qa/QA_PUBLIC_DIR_ANALYSIS.md)** - Public directory validation
- **[swarm-qa-report.md](qa/swarm-qa-report.md)** - Swarm QA validation

### 🧠 Learning Systems
- **[AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md)** - Synthesized learnings (17 episodes, 0.833 avg reward)
- **[CI_CD_LEARNINGS.md](CI_CD_LEARNINGS.md)** - CI/CD failure patterns and prevention

### 🤖 Agent Configuration
- **[AGENTS.md](AGENTS.md)** - Agent definitions and patterns (14,320 lines)
- **[DETECTOR_CHAIN_SKILL.md](DETECTOR_CHAIN_SKILL.md)** - Detection chain implementation (7,581 lines)

## Key Documents by Purpose

### Planning a New Feature?
1. Read **[AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md)** - Success patterns
2. Review **[ROADMAP.md](ROADMAP.md)** - Current priorities
3. Check **[REPLIT_FEATURE_RETROSPECTIVE.md](retrospectives/REPLIT_FEATURE_RETROSPECTIVE.md)** - Template for execution

### Implementing a Feature?
1. Follow **8-Point QA Checklist** in [AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md#qa-validation-checklist-prevents-ci-failures)
2. Use **5-Agent Hierarchical Swarm** pattern
3. Reference **[COORDINATION_IMPLEMENTATION.md](implementations/COORDINATION_IMPLEMENTATION.md)**

### Debugging CI/CD Failures?
1. Check **[CI_CD_LEARNINGS.md](CI_CD_LEARNINGS.md)** - Known failure patterns
2. Review **Scope Creep Detection** in [AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md#scope-creep-in-feature-commits)
3. Apply **Prevention Strategies**

### Conducting a Retrospective?
1. Use **[REPLIT_FEATURE_RETROSPECTIVE.md](retrospectives/REPLIT_FEATURE_RETROSPECTIVE.md)** as template
2. Store learnings in **AgentDB** (`npx agentdb@latest reflexion store`)
3. Update **[AGENTDB_SYNTHESIS.md](AGENTDB_SYNTHESIS.md)**
4. Extract action items to **[ROADMAP.md](ROADMAP.md)**

## Statistics

### Documentation Volume
- **Total Lines**: 5,991+
- **Retrospectives**: 127,207 lines (5 documents)
- **Technical Docs**: 23,444 lines
- **Implementation Plans**: 2,000+ lines

### AgentDB Status
- **Episodes Stored**: 17
- **Average Reward**: 0.833 (83.3% success rate)
- **Embedding Coverage**: 100%
- **Latest Episode**: #17 - Replit Retrospective (0.95 reward)

### Coverage
- ✅ All phases documented (0-3)
- ✅ All major features retrospective'd
- ✅ CI/CD failures analyzed
- ✅ Success patterns extracted
- ✅ Anti-patterns documented

## Maintenance

### Update Frequency
- **After each feature launch**: Create retrospective
- **After CI/CD failure**: Update CI_CD_LEARNINGS.md
- **Monthly**: Review and synthesize AgentDB episodes
- **Quarterly**: Update ROADMAP.md priorities

### Contribution Guidelines
1. All docs must be in `.claude-flow/docs/` (gitignored)
2. Use markdown format
3. Include date and context
4. Store key learnings in AgentDB
5. Update this INDEX.md

## External References

### Public Documentation
(Located in `docs/` - not gitignored)
- README.md
- API.md
- CLI_USER_GUIDE.md
- Tool-specific guides (docs/guides/)

### Private Documentation
(This directory - `.claude-flow/docs/` - gitignored)
- Everything listed above

## Quick Commands

### Query AgentDB Learnings
```bash
# Search for patterns
npx agentdb@latest reflexion retrieve "hierarchical swarm" --k 10

# Get statistics
npx agentdb@latest stats

# Export all episodes
npx agentdb@latest export --output learnings.json
```

### Find Documentation
```bash
# List all internal docs
ls -la .claude-flow/docs/**/*.md

# Search for keyword
grep -r "QA checklist" .claude-flow/docs/

# Count total documentation
wc -l .claude-flow/docs/**/*.md
```

---

**Note**: This directory is gitignored - all content is internal and will not be committed to the public repository.

**Status**: ✅ Active - Updated after v4.3.1 release
