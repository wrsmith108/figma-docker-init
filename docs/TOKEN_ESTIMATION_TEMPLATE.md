# Token Estimation Template

## Overview
This template provides a systematic approach to estimating token consumption for AI-assisted development tasks. Token estimates replace traditional time-based estimates (days/weeks) for more accurate planning.

## Token Estimation Categories

### 1. Code Reading & Analysis
**Base Rate**: ~2-4 tokens per line of code (LOC)
- Simple code (boilerplate, config): 2 tokens/LOC
- Medium complexity (business logic): 3 tokens/LOC
- Complex code (algorithms, async flows): 4-5 tokens/LOC

**Multipliers**:
- First-time codebase analysis: ×2
- Legacy/undocumented code: ×2.5
- Complex architecture: ×1.5

### 2. Code Writing & Generation
**Base Rate**: ~10-15 tokens per line of output code
- Boilerplate/templates: 10 tokens/LOC
- Business logic: 12 tokens/LOC
- Complex algorithms: 15-20 tokens/LOC

**Multipliers**:
- New framework/library: ×1.5
- Integration with existing code: ×1.3
- Performance optimization required: ×1.5

### 3. Test Generation
**Base Rate**: ~15-20 tokens per test assertion
- Unit tests (simple): 15 tokens/test
- Integration tests: 20 tokens/test
- E2E tests: 25 tokens/test

**Coverage Factor**: Tests needed = LOC × coverage_target × complexity
- Low complexity: 0.5 tests/LOC
- Medium complexity: 1 test/LOC
- High complexity: 2 tests/LOC

### 4. Documentation
**Base Rate**: ~5-8 tokens per line of documentation
- Inline comments: 5 tokens/line
- API documentation: 8 tokens/entry
- Tutorial content: 10 tokens/line
- Architecture docs: 12 tokens/line

### 5. Refactoring
**Base Rate**: Varies by scope
- Simple rename/reorganize: 5 tokens/LOC
- Logic refactor: 15 tokens/LOC
- Architecture refactor: 25 tokens/LOC

**File Operations**: +500 tokens per file moved/renamed

### 6. Research & Investigation
**Base Rate**: ~1,000-5,000 tokens per research topic
- Quick lookup (API docs): 1,000 tokens
- Pattern research: 2,500 tokens
- Deep investigation: 5,000 tokens
- Competitive analysis: 7,500 tokens

### 7. Review & Validation
**Base Rate**: ~3-5 tokens per line reviewed
- Code review: 3 tokens/LOC
- Security audit: 5 tokens/LOC
- Performance review: 4 tokens/LOC

## Calculation Formula

```
Total_Tokens = (Reading + Writing + Testing + Documentation + Refactoring + Research + Review) × Complexity_Multiplier × Risk_Buffer

Where:
- Complexity_Multiplier: 1.0 (simple), 1.5 (medium), 2.0 (complex), 3.0 (very complex)
- Risk_Buffer: 1.2 (20% contingency for unknowns)
```

## Estimation Template

```markdown
### Task: [Task Name]

**Scope**:
- Files to modify: X files, Y total LOC
- New files to create: Z files, W total LOC
- Tests required: N tests
- Documentation: M pages

**Token Breakdown**:

1. **Reading & Analysis**:
   - Existing code: [LOC] × [tokens/LOC] = [total] tokens
   - Research: [topics] × [tokens/topic] = [total] tokens
   - **Subtotal**: [X] tokens

2. **Writing & Generation**:
   - New code: [LOC] × [tokens/LOC] = [total] tokens
   - Modified code: [LOC] × [tokens/LOC] = [total] tokens
   - **Subtotal**: [Y] tokens

3. **Testing**:
   - Unit tests: [count] × [tokens/test] = [total] tokens
   - Integration tests: [count] × [tokens/test] = [total] tokens
   - **Subtotal**: [Z] tokens

4. **Documentation**:
   - Inline comments: [lines] × [tokens/line] = [total] tokens
   - API docs: [entries] × [tokens/entry] = [total] tokens
   - **Subtotal**: [W] tokens

5. **Review & Validation**:
   - Code review: [LOC] × [tokens/LOC] = [total] tokens
   - **Subtotal**: [V] tokens

**Base Total**: [X + Y + Z + W + V] tokens
**Complexity Multiplier**: [1.0-3.0]
**Adjusted Total**: [base × multiplier] tokens
**With Risk Buffer (20%)**: [adjusted × 1.2] tokens

**Final Estimate**: ~[final] tokens (~$[cost estimate] at avg model pricing)
```

## Example Calculation

### Task: Rename package from figma-docker-init to vibe-to-docker

**Scope**:
- Files to modify: 98 files, ~8,000 LOC total
- New files to create: 15 files, ~2,000 LOC
- Tests: 50 new tests, 500 existing tests to update
- Documentation: 10 pages

**Token Breakdown**:

1. **Reading & Analysis**:
   - Read 98 files (8,000 LOC × 3 tokens/LOC): 24,000 tokens
   - Research vibe-coding tools (4 tools × 2,500 tokens): 10,000 tokens
   - **Subtotal**: 34,000 tokens

2. **Writing & Generation**:
   - New detection modules (2,000 LOC × 12 tokens/LOC): 24,000 tokens
   - Modify existing code (8,000 LOC × 5 tokens/LOC): 40,000 tokens
   - **Subtotal**: 64,000 tokens

3. **Testing**:
   - 50 new tests × 20 tokens: 1,000 tokens
   - Update 500 tests × 10 tokens: 5,000 tokens
   - **Subtotal**: 6,000 tokens

4. **Documentation**:
   - 10 pages × 2,000 tokens/page: 20,000 tokens
   - **Subtotal**: 20,000 tokens

5. **Review & Validation**:
   - Review 10,000 LOC × 3 tokens/LOC: 30,000 tokens
   - **Subtotal**: 30,000 tokens

**Base Total**: 154,000 tokens
**Complexity Multiplier**: 1.5 (medium-high complexity)
**Adjusted Total**: 231,000 tokens
**With Risk Buffer (20%)**: 277,200 tokens

**Final Estimate**: ~280,000 tokens (~$1.40-$14.00 depending on model)

## Model Cost Reference (as of 2024)

| Model | Input Cost | Output Cost | Avg Cost/1K tokens |
|-------|-----------|-------------|-------------------|
| Claude Sonnet 4.5 | $3/1M | $15/1M | $9/1M avg |
| Claude Haiku | $0.25/1M | $1.25/1M | $0.75/1M avg |
| GPT-4 Turbo | $10/1M | $30/1M | $20/1M avg |
| DeepSeek R1 | $0.55/1M | $2.19/1M | $1.37/1M avg |
| Gemini 2.0 Flash | $0.10/1M | $0.40/1M | $0.25/1M avg |

## Best Practices

1. **Always estimate conservatively** - Add 20% risk buffer
2. **Break down large tasks** - Estimate in manageable chunks
3. **Track actual vs estimated** - Improve future estimates
4. **Consider model selection** - Use cheaper models for simple tasks
5. **Account for iterations** - Complex tasks may need multiple passes
6. **Include overhead** - Context loading, tool calls, retries

## Validation

After task completion, record actual token usage:
- **Estimated**: [X] tokens
- **Actual**: [Y] tokens
- **Variance**: [(Y-X)/X × 100]%
- **Lessons learned**: [notes for future estimates]
