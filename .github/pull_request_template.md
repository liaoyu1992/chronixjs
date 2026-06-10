## Summary

<!-- 1–3 bullets: what changed and why -->

## Type

- [ ] bug fix
- [ ] feature
- [ ] refactor (no behavior change)
- [ ] docs
- [ ] tooling / CI

## Quality check

- [ ] Core typecheck + test + build passes
- [ ] Relevant adapter typecheck + test passes
- [ ] Demo typecheck passes
- [ ] `pnpm ci-check` passes

## Parity check (gantt PRs only)

- [ ] No regression against golden suite (`pnpm --filter @chronixjs/golden-runner verify`)
- [ ] New behaviors covered by a new golden
- [ ] N/A — does not touch gantt rendering / interaction

## Changeset

- [ ] Added (`pnpm changeset`)
- [ ] N/A — tooling / docs / internal only
