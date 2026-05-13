# R2 reference rewrite — methodology

Chronix is an **R2 reference rewrite** of k-ui's gantt:

- ✅ **Allowed:** read k-ui source to understand mechanisms, algorithms, edge-case handling
- ✅ **Allowed:** implement the same algorithm (algorithms are not copyrightable)
- ✅ **Allowed:** match observable behavior 1:1 (this is the parity goal — L2)
- ❌ **Forbidden:** verbatim or near-verbatim code copy (any block ≥5 consecutive lines is a red flag)
- ❌ **Forbidden:** identifier names listed in [`BANNED_IDENTIFIERS.md`](./BANNED_IDENTIFIERS.md)
- ❌ **Forbidden:** k-ui's module decomposition mirrored as chronix module structure

## Daily workflow

1. Open `audit/journal/YYYY-MM-DD.md` (copy [`journal/TEMPLATE.md`](./journal/TEMPLATE.md))
2. Log what reference files you read and what mechanism you understood
3. Implement using **independent** module decomposition and naming
4. Run `pnpm test:golden` to confirm parity
5. Commit. Pre-commit hook runs `scripts/check-banned-names.mjs` on staged files.

## When in doubt

- If a piece of k-ui logic is "weird but necessary" (e.g. `HitDragging.requireInitial = false`),
  read it, understand _why_, then implement chronix's equivalent under chronix's naming and architecture. **Do not paraphrase line-by-line.**
- If you find yourself about to copy a function, close the k-ui file and write from your understanding, not from sight.
- If the same algorithm produces the same code structure naturally (e.g. binary search), that's fine — but variable names must be yours.

## Audit trail

The `audit/journal/` folder is the chronological proof of independence. Each daily entry should answer:

- What did I read in k-ui today?
- What mechanism did I now understand?
- What did I write in chronix as a consequence?
- Did I name anything in a way that requires justification?

This is not bureaucracy. If anyone ever questions whether chronix is derivative, this journal is the evidence.
