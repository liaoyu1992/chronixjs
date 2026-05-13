## Summary

<!-- 1–3 bullets: what changed and why -->

## Type

- [ ] bug fix
- [ ] feature
- [ ] refactor (no behavior change)
- [ ] docs
- [ ] tooling / CI

## Parity check (gantt PRs only)

- [ ] No regression against golden suite (`pnpm --filter @chronixjs/gantt test:golden`)
- [ ] New behaviors covered by a new golden
- [ ] N/A — does not touch gantt rendering / interaction

## R2 audit

- [ ] No banned identifiers introduced (CI will check)
- [ ] No verbatim code from reference projects (>5 consecutive lines)
- [ ] If reference code was read, logged in `audit/journal/`

## Changeset

- [ ] Added (`pnpm changeset`)
- [ ] N/A — tooling / docs / internal only
