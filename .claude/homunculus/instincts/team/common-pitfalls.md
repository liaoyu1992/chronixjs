---
id: common-pitfalls
trigger: '通用踩坑经验，适用于所有成员'
confidence: 0.80
domain: workflow
source: team-consensus
deprecated: false
created_at: '2026-06-12'
---

## 团队踩坑经验

### 1. 使用 CLI 工具前先检查

在使用 CLI 工具前，先用 `which <tool>` 或 `<tool> --version` 检查工具是否已安装且版本正确，避免因工具缺失导致任务中断。

### 2. Edit 文件前先 Read

在 Edit 文件前，先用 Read 工具读取该文件的当前内容，特别是当文件较长或最近有其他改动时。不跳过读取直接编辑，以避免基于过时内容产生错误的修改。

### 3. Windows 路径注意

- 使用正斜杠 `/` 而非反斜杠 `\` 作为路径分隔符
- Git Bash 中 `rm -rf` 对 `C:\` 等系统目录同样有效，需格外小心
