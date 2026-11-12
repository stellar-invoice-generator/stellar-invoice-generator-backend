## Summary of Changes
Provide a brief summary of the changes made and the problem being solved.

## Related Issue
Closes # (issue number)

## Type of Change
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Refactor / Performance enhancement
- [ ] Documentation update
- [ ] Test coverage addition

## Quality & Security Checklist
- [ ] Code follows project style guidelines and passes `pnpm run lint`
- [ ] TypeScript compiles cleanly with zero errors (`pnpm run typecheck`)
- [ ] All new and existing unit/integration tests pass (`pnpm run test`)
- [ ] Non-custodial guarantee preserved: No private keys or custodial operations introduced
- [ ] Money calculations strictly use `Decimal` / string representations (zero floating-point arithmetic)
- [ ] Database transactions used for all multi-step payment matching and status updates
- [ ] No secrets or sensitive configuration committed

## How Has This Been Tested?
Describe the tests you ran to verify your changes, including test inputs and expected outputs.

