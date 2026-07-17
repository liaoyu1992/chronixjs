---
"@chronixjs/table": patch
"@chronixjs/table-vue3": patch
"@chronixjs/table-vue2": patch
"@chronixjs/table-react": patch
---

Redesign the row-drag grip handle: replace the ≡ glyph with a 6-dot
SVG, centre it, and add hover affordance + tooltip.

1. **Grip icon**: `buildRowDragGripCell` in all three adapters now
   renders an inline 6-dot SVG grip (`viewBox="0 0 10 16"`,
   `fill: currentColor`) wrapped in a
   `.cx-table-row-drag-cell__grip` span instead of the font-dependent
   `≡` text node. The glyph was thin, inconsistent across fonts, and
   visually off-centre.

2. **Centring**: `.cx-table-cell` already sets
   `display:flex; align-items:center`, so only `justify-content:center`
   was added on `.cx-table-row-drag-cell`. The SVG is now pixel-centred
   on both axes (verified: x offset 0px).

3. **Hover affordance + cursor**:
   - `cursor: grab` on draggable cells (`grabbing` during an active
     drag via `.cx-table-row--moving > ...`).
   - Hover tint: cell bg `#f8fafc` -> `#eef2f7`; icon colour
     `#94a3b8` -> `#475569` (80ms transition).
   - To let the `:hover` background rule actually apply, the rail
     background was moved out of the adapter's inline `style` (which
     had higher specificity than the hover rule) into the
     `.cx-table-row-drag-cell` CSS rule. The inline style now only
     carries `position/width/height/z-index`.

4. **Tooltip + a11y**: draggable cells now set
   `title`/`aria-label="拖拽以调整行顺序"`; inactive (pinned or
   `draggable:false`) cells render neither the grip nor the label.

New theme tokens (all with fallbacks): `--cx-table-row-drag-rail-bg`,
`--cx-table-row-drag-handle-color`,
`--cx-table-row-drag-handle-hover-color`,
`--cx-table-row-drag-cell-hover-bg`.