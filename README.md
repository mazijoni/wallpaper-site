# FoldWall Studio

Design **two separate wallpapers** for the Samsung Galaxy Z Fold8 — one for the cover screen, one for the inner screen — and preview them on a 3D phone that folds and unfolds.

Plain HTML, CSS and JavaScript. **No build step, no dependencies, no backend, no account.** Images are decoded, positioned and exported in the browser and never uploaded.

## Run it

- Double-click `index.html`, **or**
- serve the folder with any static host (`npx serve`, `python -m http.server`, GitHub Pages, Netlify, …).

## Features

- Independent **Cover** and **Inner** wallpapers (upload, drag & drop, replace, remove).
- Zoom, Position X/Y, Rotate, Fit/Fill, Reset — or drag the image directly in the preview.
- **Phone** (3D fold animation), **Screens** (flat side-by-side, same pixel scale) and **Split** (closed vs open) preview modes.
- **Show Guides**: screen edge, rounded corners, camera cut-out, status bar, gesture area, lock-screen/dock zones and the fold crease. Guides are preview-only and can never be exported.
- **Export** the artwork only (no frame, guides, shadows or UI) as PNG / JPG / WebP at native or 2× size; both screens as a ZIP.
- Keyboard: `F` fold · `G` guides · `1` `2` `3` view modes; with the preview focused, arrows nudge the image and `+` / `-` zoom.

## Device data

Everything about the phone lives in one object: [js/config.js](js/config.js) (`FW.DEVICE`). The 3D model in [js/geometry.js](js/geometry.js) is derived from it, so updating a number there updates the mockup, the guides, the info panel and the export sizes.

Published specs used (Galaxy Z Fold8): unfolded 161.4 × 123.9 × 4.5 mm, folded 81.9 × 123.9 × 9.7 mm; cover 5.5″ 1248 × 1972 (10:16); inner 7.6″ 2448 × 1848 (4:3).
Not published by Samsung, so approximate and marked `approx.` in the config: corner radii, punch-hole positions, status/nav bar heights and system-UI zones.

## Layout

```
index.html
css/styles.css
js/config.js        device configuration (single source of truth)
js/geometry.js      mm-based 3D model derived from the config
js/render.js        image placement maths + the one draw routine used by preview AND export
js/store.js         app state (cover / inner stored independently)
js/renderer.js      cached canvas rendering shared by all on-screen copies
js/zip.js           tiny ZIP writer (no library)
js/demo.js          built-in black-and-white eye/face example
js/components/      DevicePreview, PhoneModel, ScreenView, GuideOverlay, ImageUploader,
                    ImageControls, CoverEditor/InnerEditor (ScreenEditor), ExportPanel,
                    ViewModeSelector (+ FoldToggle), DeviceInfo, EmptyState
```

Scripts are plain `<script>` tags sharing one `window.FW` namespace, so the site works straight from disk as well as from a server.
