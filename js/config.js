/**
 * Single source of truth for the Galaxy Z Fold8. Everything that describes the
 * hardware lives in this one object, so it can be corrected in one place.
 *
 * Sources (Sept 2026): Samsung, GSMArena and Engadget spec sheets for the Galaxy Z Fold8
 *  - Unfolded 161.4 x 123.9 x 4.5 mm, folded 81.9 x 123.9 x 9.7 mm
 *  - Cover: 5.5" FHD+ AMOLED, 1248 x 1972 px (10:16), ~428 ppi
 *  - Inner: 7.6" QXGA+ Dynamic AMOLED 2X, 2448 x 1848 px (4:3), ~404 ppi
 *
 * Values marked "approx." are NOT published by Samsung (punch-hole position,
 * status/nav bar sizes, system-UI zones); they are estimates for the mockup and guides.
 * The Fold8 has square corners, so the body and display radii are 0.
 */
(function (FW) {
  FW.DEVICE = {
    name: 'Galaxy Z Fold8',
    maker: 'Samsung',
    body: {
      openWidthMm: 161.4,
      closedWidthMm: 81.9,
      heightMm: 123.9,
      // Thickness of ONE half. The closed phone is two halves plus a small gap.
      openThicknessMm: 4.5,
      closedThicknessMm: 9.7,
      cornerRadiusMm: 0, // the Fold8 has square corners (set > 0 to round the mockup)
    },
    screens: {
      cover: {
        id: 'cover',
        label: 'Cover',
        title: 'Cover Wallpaper',
        location: 'Outside display · seen when closed',
        diagonalIn: 5.5,
        panel: 'FHD+ AMOLED',
        px: { w: 1248, h: 1972 },
        ppi: 428,
        aspect: '10:16',
        cornerRadiusPx: 0, // square display corners
        camera: { x: 0.5, y: 66, diameterPx: 46 }, // approx. (x = fraction of width, y = px from top)
        statusBarPx: 96, // approx.
        navBarPx: 120, // approx.
        systemZones: [
          // approx. fractions of the display height
          { id: 'clock', label: 'Lock-screen clock & widgets', top: 0.07, bottom: 0.3 },
          { id: 'dock', label: 'Home dock', top: 0.86, bottom: 0.94 },
        ],
      },
      inner: {
        id: 'inner',
        label: 'Inner',
        title: 'Inner Wallpaper',
        location: 'Main display · seen when unfolded',
        diagonalIn: 7.6,
        panel: 'QXGA+ Dynamic AMOLED 2X',
        px: { w: 2448, h: 1848 },
        ppi: 404,
        aspect: '4:3',
        cornerRadiusPx: 0, // square display corners
        camera: { x: 0.955, y: 66, diameterPx: 46 }, // approx.
        statusBarPx: 96, // approx.
        navBarPx: 120, // approx.
        systemZones: [
          { id: 'clock', label: 'Lock-screen clock & widgets', top: 0.08, bottom: 0.34 },
          { id: 'dock', label: 'Home dock', top: 0.84, bottom: 0.93 },
        ],
        creasePx: 96, // approx. visible width of the fold crease, centred
      },
    },
  }

  FW.SCREEN_IDS = ['cover', 'inner']
})((window.FW = window.FW || {}))
