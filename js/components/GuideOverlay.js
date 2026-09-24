/**
 * GuideOverlay — semi-transparent safe-area guides drawn as SVG in the display's own
 * pixel coordinates (so every number comes straight from FW.DEVICE). It only ever
 * lives inside the preview DOM; the exporter renders the artwork alone, so guides can
 * never end up in an exported file. Visibility is driven by [data-guides] on the app root.
 */
(function (FW) {
  const NS = 'http://www.w3.org/2000/svg'

  // Colour roles (also used by the legend in the stage).
  const C = {
    bars: 'rgba(96,165,250,',
    zone: 'rgba(251,146,60,',
    camera: 'rgba(52,211,153,',
    corner: 'rgba(248,113,113,',
    fold: 'rgba(232,121,249,',
    edge: 'rgba(255,255,255,',
  }
  FW.GUIDE_COLORS = C

  FW.GuideOverlay = function GuideOverlay(id) {
    const s = FW.DEVICE.screens[id]
    const { w, h } = s.px
    const fs = Math.round(Math.min(w, h) * 0.024) // label size relative to the display
    const r = s.cornerRadiusPx
    const m = Math.round(w * 0.02) // label inset
    const creaseHoriz = !!s.creasePx && FW.DEVICE.body.foldAxis === 'flip'

    const label = (text, x, y, color, anchor = 'start') =>
      `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="${anchor}" fill="${color}0.98)" stroke="rgba(0,0,0,.55)" stroke-width="${fs * 0.22}" paint-order="stroke" font-family="system-ui, Segoe UI, sans-serif" font-weight="600">${text}</text>`

    const parts = []

    // System-UI overlap zones (lock-screen clock, dock)
    for (const z of s.systemZones) {
      const y0 = z.top * h
      const y1 = z.bottom * h
      parts.push(
        `<rect x="${m * 2}" y="${y0}" width="${w - m * 4}" height="${y1 - y0}" rx="${fs}" fill="${C.zone}0.13)" stroke="${C.zone}0.85)" stroke-width="2" stroke-dasharray="14 10" vector-effect="non-scaling-stroke"/>`,
        // On the inner screen keep the label off the fold line.
        label(z.label, s.creasePx && !creaseHoriz ? w * 0.27 : w / 2, y0 + (y1 - y0) / 2 + fs * 0.35, C.zone, 'middle'),
      )
    }

    // Status bar & navigation / gesture areas
    parts.push(
      `<rect x="0" y="0" width="${w}" height="${s.statusBarPx}" fill="${C.bars}0.22)"/>`,
      `<line x1="0" x2="${w}" y1="${s.statusBarPx}" y2="${s.statusBarPx}" stroke="${C.bars}0.9)" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
      `<rect x="0" y="${h - s.navBarPx}" width="${w}" height="${s.navBarPx}" fill="${C.bars}0.22)"/>`,
      `<line x1="0" x2="${w}" y1="${h - s.navBarPx}" y2="${h - s.navBarPx}" stroke="${C.bars}0.9)" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
      `<rect x="${w / 2 - w * 0.09}" y="${h - s.navBarPx / 2 - 5}" width="${w * 0.18}" height="10" rx="5" fill="${C.edge}0.55)"/>`,
      label('Status bar', m, s.statusBarPx / 2 + fs * 0.35, C.bars),
      label('Navigation / gesture area', m, h - s.navBarPx / 2 + fs * 0.35, C.bars),
    )

    // Rounded-corner safe area: the actual corner curve plus a dashed inset.
    // (Skipped when the display has square corners, as the Fold8's does.)
    if (r > 0) {
      const inset = Math.round(r * 0.34)
      const arc = (x0, y0, x1, y1) =>
        `<path d="M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}" fill="none" stroke="${C.corner}0.95)" stroke-width="4" vector-effect="non-scaling-stroke"/>`
      parts.push(
        `<rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" rx="${r - inset * 0.4}" fill="none" stroke="${C.corner}0.75)" stroke-width="2" stroke-dasharray="8 8" vector-effect="non-scaling-stroke"/>`,
        arc(0, r, r, 0),
        arc(w - r, 0, w, r),
        arc(w, h - r, w - r, h),
        arc(r, h, 0, h - r),
        label('Rounded corners', w - m, h - s.navBarPx / 2 + fs * 0.35, C.corner, 'end'),
      )
    }

    // Camera cut-out with a keep-clear radius
    const cx = s.camera.x * w
    const cy = s.camera.y
    const cr = s.camera.diameterPx / 2
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${cr * 2.6}" fill="${C.camera}0.16)" stroke="${C.camera}0.9)" stroke-width="2" stroke-dasharray="6 6" vector-effect="non-scaling-stroke"/>`,
      `<circle cx="${cx}" cy="${cy}" r="${cr}" fill="none" stroke="${C.camera}1)" stroke-width="3" vector-effect="non-scaling-stroke"/>`,
    )
    const camLabelRight = cx < w * 0.7
    parts.push(
      label('Camera', camLabelRight ? cx + cr * 3.1 : cx - cr * 3.1, cy + fs * 0.35, C.camera, camLabelRight ? 'start' : 'end'),
    )

    // Fold crease (inner display only). Book hinges run vertically; flip hinges run horizontally.
    if (s.creasePx) {
      if (creaseHoriz) {
        parts.push(
          `<rect x="0" y="${h / 2 - s.creasePx / 2}" width="${w}" height="${s.creasePx}" fill="${C.fold}0.14)"/>`,
          `<line x1="0" x2="${w}" y1="${h / 2}" y2="${h / 2}" stroke="${C.fold}0.95)" stroke-width="2" stroke-dasharray="16 10" vector-effect="non-scaling-stroke"/>`,
          label('Fold', w * 0.5, h / 2 - fs * 0.6, C.fold, 'middle'),
        )
      } else {
        parts.push(
          `<rect x="${w / 2 - s.creasePx / 2}" y="0" width="${s.creasePx}" height="${h}" fill="${C.fold}0.14)"/>`,
          `<line x1="${w / 2}" x2="${w / 2}" y1="0" y2="${h}" stroke="${C.fold}0.95)" stroke-width="2" stroke-dasharray="16 10" vector-effect="non-scaling-stroke"/>`,
          label('Fold', w / 2, h * 0.5, C.fold, 'middle'),
        )
      }
    }

    // Screen boundary
    parts.push(
      `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${r}" fill="none" stroke="${C.edge}0.85)" stroke-width="2" vector-effect="non-scaling-stroke"/>`,
    )

    const svg = document.createElementNS(NS, 'svg')
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    svg.setAttribute('class', 'guides')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('preserveAspectRatio', 'none')
    svg.innerHTML = parts.join('')
    return svg
  }
})((window.FW = window.FW || {}))
