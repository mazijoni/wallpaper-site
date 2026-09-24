/**
 * Single source of truth for every supported foldable. Each device fully describes its
 * own hardware, so a new phone is just a new entry in FW.DEVICE_OPTIONS.
 *
 * body.foldAxis says which way the hinge runs:
 *   'book' (default) — a vertical hinge; the phone opens like a book (Fold, Open, Pixel Fold).
 *     Width changes between open/closed; height is constant. Provide openWidthMm/closedWidthMm
 *     and a single heightMm.
 *   'flip' — a horizontal hinge; the phone opens like a clamshell (Flip, Razr).
 *     Height changes between open/closed; width is constant. Provide openHeightMm/closedHeightMm
 *     and a single widthMm.
 *
 * Values marked "approx." are not published by the manufacturer (punch-hole position,
 * status/nav bar sizes, system-UI zones); they are estimates for the mockup and guides.
 */
(function (FW) {
  // ---- Book-fold devices (vertical hinge, opens sideways) -----------------------------
  const bookBody = (openWidthMm, closedWidthMm, heightMm, openThicknessMm, closedThicknessMm, cornerRadiusMm) => ({
    foldAxis: 'book',
    openWidthMm,
    closedWidthMm,
    openHeightMm: heightMm,
    closedHeightMm: heightMm,
    openThicknessMm,
    closedThicknessMm,
    cornerRadiusMm,
  })

  const screen = (w, h, ppi, label, title, location, diagonalIn, panel, camera, extra = {}) => ({
    id: label.toLowerCase(),
    label,
    title,
    location,
    diagonalIn,
    panel,
    px: { w, h },
    ppi,
    aspect: `${Math.min(w, h)}:${Math.max(w, h)}`,
    cornerRadiusPx: 0,
    camera,
    statusBarPx: 96, // approx.
    navBarPx: 120, // approx.
    systemZones: [
      // approx. fractions of the display height
      { id: 'clock', label: 'Lock-screen clock & widgets', top: 0.08, bottom: 0.34 },
      { id: 'dock', label: 'Home dock', top: 0.84, bottom: 0.93 },
    ],
    ...extra,
  })

  // Book cover screens are narrow, so the punch-hole sits centred; inner screens put it
  // in the corner near one hinge side, the common foldable layout.
  const bookCover = (w, h, ppi, diagonalIn, panel, extra) =>
    screen(w, h, ppi, 'Cover', 'Cover Wallpaper', 'Outside display · seen when closed', diagonalIn, panel, { x: 0.5, y: 66, diameterPx: 46 }, extra)
  const bookInner = (w, h, ppi, diagonalIn, panel, extra) =>
    screen(w, h, ppi, 'Inner', 'Inner Wallpaper', 'Main display · seen when unfolded', diagonalIn, panel, { x: 0.955, y: 66, diameterPx: 46 }, extra)

  const makeDevice = (name, maker, body, cover, inner) => ({ name, maker, body, screens: { cover, inner } })

  const fold8 = makeDevice(
    'Galaxy Z Fold8',
    'Samsung',
    // Sources (Sept 2026): Samsung, GSMArena and Engadget spec sheets. Square corners (radius 0).
    bookBody(161.4, 81.9, 123.9, 4.5, 9.7, 0),
    bookCover(1248, 1972, 428, 5.5, 'FHD+ AMOLED', { cornerRadiusPx: 0, aspect: '10:16' }),
    bookInner(2448, 1848, 404, 7.6, 'QXGA+ Dynamic AMOLED 2X', { cornerRadiusPx: 0, creasePx: 96, aspect: '4:3' }),
  )

  const pixelFold = makeDevice(
    'Pixel 9 Pro Fold',
    'Google',
    bookBody(155.2, 77.1, 150.2, 5.1, 10.5, 3.5),
    bookCover(1080, 2424, 422, 6.3, 'Actua OLED'),
    bookInner(2076, 2152, 374, 8.0, 'Super Actua Flex OLED', { creasePx: 84 }),
  )

  const oneplusOpen = makeDevice(
    'OnePlus Open',
    'OnePlus',
    bookBody(153.4, 73.3, 143.1, 5.9, 11.9, 2.5),
    bookCover(1140, 2120, 431, 6.31, 'Super Fluid AMOLED'),
    bookInner(2440, 2268, 426, 7.82, 'Flexi-fluid AMOLED', { creasePx: 84 }),
  )

  // ---- Flip devices (horizontal hinge, opens like a clamshell) ------------------------
  const flipBody = (widthMm, openHeightMm, closedHeightMm, openThicknessMm, closedThicknessMm, cornerRadiusMm) => ({
    foldAxis: 'flip',
    openWidthMm: widthMm,
    closedWidthMm: widthMm,
    openHeightMm,
    closedHeightMm,
    openThicknessMm,
    closedThicknessMm,
    cornerRadiusMm,
  })

  // Flip cover screens are big enough for a centred punch-hole; the inner screen is a
  // normal tall display with the camera centred at the top, like a regular phone.
  const flipCover = (w, h, ppi, diagonalIn, panel, extra) =>
    screen(w, h, ppi, 'Cover', 'Cover Wallpaper', 'Outside display · seen when closed', diagonalIn, panel, { x: 0.5, y: 48, diameterPx: 40 }, extra)
  const flipInner = (w, h, ppi, diagonalIn, panel, extra) =>
    screen(w, h, ppi, 'Inner', 'Inner Wallpaper', 'Main display · seen when unfolded', diagonalIn, panel, { x: 0.5, y: 60, diameterPx: 46 }, extra)

  const zFlip7 = makeDevice(
    'Galaxy Z Flip7',
    'Samsung',
    // Sources: Samsung spec sheet, GSMArena. Folded 85.5 x 75.2 x 13.7 mm, unfolded 166.7 x 75.2 x 6.5 mm.
    // Corner radius is approx. (not published).
    flipBody(75.2, 166.7, 85.5, 6.5, 13.7, 9),
    flipCover(948, 1048, 345, 4.1, 'Super AMOLED (FlexWindow)'),
    flipInner(1080, 2520, 398, 6.9, 'Dynamic AMOLED 2X', { creasePx: 80 }),
  )

  const razrUltra = makeDevice(
    'Razr Ultra (2025)',
    'Motorola',
    // Sources: Motorola spec sheet, PhoneArena. Folded 88.1 x 74.0 x 15.7 mm, unfolded 171.5 x 74.0 x 7.2 mm.
    // Corner radius is approx. (not published).
    flipBody(74.0, 171.5, 88.1, 7.2, 15.7, 10),
    flipCover(1080, 1272, 417, 4.0, 'pOLED'),
    flipInner(1224, 2912, 451, 7.0, 'pOLED', { creasePx: 80 }),
  )

  FW.DEVICE_OPTIONS = [
    { value: 'fold8', label: 'Samsung Galaxy Z Fold8', device: fold8 },
    { value: 'pixel-fold', label: 'Google Pixel 9 Pro Fold', device: pixelFold },
    { value: 'oneplus-open', label: 'OnePlus Open', device: oneplusOpen },
    { value: 'z-flip7', label: 'Samsung Galaxy Z Flip7', device: zFlip7 },
    { value: 'razr-ultra', label: 'Motorola Razr Ultra', device: razrUltra },
  ]

  const requested = new URLSearchParams(window.location.search).get('device')
  const selected = FW.DEVICE_OPTIONS.find((option) => option.value === requested) || FW.DEVICE_OPTIONS[0]
  FW.DEVICE = selected.device
  FW.DEVICE_KEY = selected.value
  FW.SCREEN_IDS = ['cover', 'inner']
})((window.FW = window.FW || {}))
