# VRT capture lessons (chronix-side goldens)

**Audience**: anyone writing or modifying chronix Playwright VRT specs in
`tooling/golden-runner/tests/`. The rules below codify what we learned
shipping the Phase 4.4 baselines.

## Rule 1 — capture the full SVG natural width

**Goal**: the baseline PNG must contain every pixel of the rendered SVG,
regardless of viewport.

When the SVG's `width` attribute is wider than the Playwright viewport
(1440 px), naïvely capturing a wrapping pane (`overflow: auto`) clips at
the viewport's right edge. Wider views (week 8736 px, year 23725 px) end
up with all bars past viewport-right invisible in the baseline — VRT
silently passes against a buggy baseline that misses regressions on the
clipped half.

**Do**: target the SVG element itself.

```ts
const svg = page.locator('svg.cx-gantt-body'); // not a wrapping pane
await expect(svg).toHaveScreenshot('view-year.png');
```

Playwright's element-level snapshot rasterizes at the element's natural
bounding-box dimensions. Year view → 23725 × 215 PNG. PNG compression
keeps file size small (20–35 KB) even at extreme widths.

**Don't**: target `page.locator('.cx-demo-svg-frame')` or any container
that itself has `overflow: auto`. The container clips at its CSS-box
size, not the SVG's natural size.

## Rule 2 — isolate the SVG from page chrome before capture

**Goal**: the baseline PNG must contain ONLY SVG content, never neighbor
DOM (events sidebar, demo header, page padding).

Playwright's `locator.screenshot()` is a misnomer for "render the element
to a PNG". It actually captures **page pixels at the element's
bounding-box position**. When the SVG is wider than viewport, its bbox
extends past where the events sidebar sits on the page horizontally —
the sidebar's pixels (text, background) get captured into the PNG along
with the SVG.

**Do**: inject CSS right before the snapshot to hide everything except
the SVG and strip clipping wrappers.

```ts
await page.addStyleTag({
  content: `
    body { background: #ffffff !important; margin: 0 !important; }
    .cx-demo-side, .cx-demo-header { display: none !important; }
    .cx-demo-app { display: block !important; width: auto !important; }
    .cx-demo-main { padding: 0 !important; overflow: visible !important; }
    .cx-demo-svg-frame { border: 0 !important; max-height: none !important; overflow: visible !important; }
  `,
});
await settle(page);
await expect(svg).toHaveScreenshot(`chronix/${scenario.id}.png`);
```

The canonical spec is `tooling/golden-runner/tests/chronix-visual.spec.ts`
— mirror its CSS-injection block in any new VRT spec.

**Don't**: rely on the demo's normal layout to isolate the SVG. The chart
frame's `overflow: auto` only clips at render time, not at screenshot
time.

## Rule 3 — restart vite before capturing recent sample-data changes

**Goal**: the baseline reflects the latest code, not a stale HMR state.

Vite's HMR for TS modules (e.g. `sample-data.ts`) sometimes lags or
silently skips a swap if the file changed mid-page-load. Captures that
run against a not-yet-HMR'd module reflect the OLD sample-data. The
baseline ships the wrong content.

**Do**: kill the dev server and restart cleanly before any capture that
depends on freshly-edited code.

```powershell
# Windows
$pid = (netstat -ano | findstr ":8702" | findstr "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })
Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
```

```bash
# Then restart in the background and wait for it to respond:
pnpm --filter @chronixjs/example-gantt-vue3 dev &
until curl -s -o /dev/null -w "%{http_code}" http://localhost:8702/ | grep -q "200"; do sleep 0.5; done
```

**Don't**: assume the running dev server has the latest code. Browser
refresh forces a re-fetch, but Playwright's `page.goto` does that
automatically — the question is whether vite is SERVING the right code
when the request arrives.

## Rule 4 — visually verify at least one PNG after capture

**Goal**: catch leaks, missing content, or rendering bugs before
committing the baselines.

Byte-level checks (file size, PNG dimensions) tell you the capture
happened. They don't tell you the content is right.

**Do**: after `chronix-capture`, use the Read tool to view at least one
PNG (the most complex view — typically year). Confirm visually:

- Bars distributed across the full axis width (no large blank zones)
- No text from neighboring page DOM bleeding in
- Progress fill + handle + label render correctly on bars with progress
- View-toggle button reflects the active state (if the demo has one)

If anything looks wrong, fix the spec or the demo before commit. Once a
baseline ships and is later changed, VRT can no longer distinguish "the
old baseline was right; this is a regression" from "the old baseline was
wrong; this is the fix".

## Quick checklist

Before committing a new or re-captured VRT baseline:

- [ ] SVG element (not a wrapping pane) is the screenshot target
- [ ] CSS injection hides sidebar / header / non-SVG chrome
- [ ] Wrapper `overflow:auto + max-height` is stripped during capture
- [ ] body background set to opaque white
- [ ] Dev server was restarted before this capture (no stale HMR)
- [ ] At least one PNG visually inspected via the Read tool
- [ ] `pnpm --filter @chronixjs/golden-runner chronix-verify` passes against the just-captured baselines

## When to update this doc

Update this doc when:

- A new VRT capture failure mode surfaces that the rules above didn't
  catch.
- The chronix demo's DOM structure changes (e.g. Phase 4.5's wrapper
  refactor) such that the canonical class names in the CSS-injection
  block need updating.
- A new view-toggle, progress overlay, or other rendering feature is
  added — the visual-verification checklist may need expanding.

This doc lives next to the audit journal because it's a "lessons
learned" artifact, not a contract. The contract is whatever
`chronix-visual.spec.ts` actually does.
