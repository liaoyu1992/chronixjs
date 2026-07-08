#!/usr/bin/env bash
# Format-on-edit: run Prettier on the file just written/edited.
# Receives Qoder hook JSON on stdin; cwd is the project root.
f=$(node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);process.stdout.write(j.tool_response?.filePath||j.tool_input?.file_path||'')})")
[ -n "$f" ] && pnpm exec prettier --write "$f" 2>/dev/null || true
