---
name: playwright-browser-path
description: Playwright Chromium 已安装在本地，不要重复执行 npx playwright install
metadata:
  type: project
created: '2026-08-03'
updated: '2026-08-03'
---

Playwright Chromium 浏览器已安装在 `C:\Users\liaoyu\playwright-browsers`，环境变量 `PLAYWRIGHT_BROWSERS_PATH` 已设置。

**禁止**在新会话或脚本中执行 `npx playwright install chromium`。直接使用 Playwright API（`chromium.launch()`）即可，它会自动通过环境变量找到已安装的浏览器。

golden-runner（`tooling/golden-runner`）依赖此浏览器执行 Playwright 测试，无需额外安装步骤。
