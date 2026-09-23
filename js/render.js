/**
 * Image placement maths, the one canvas drawing routine (used by BOTH the live
 * preview and the exporter, so what you see is what you export), and export helpers.
 */
(function (FW) {
  FW.DEFAULT_TRANSFORM = Object.freeze({
    zoom: 1, // multiplier on top of the Fit/Fill base scale
    x: 0, // % of display width
    y: 0, // % of display height
    rotate: 0, // degrees
    fit: 'fill', // 'fill' | 'fit'
    background: '#000000',
  })
  FW.ZOOM_MIN = 0.25
  FW.ZOOM_MAX = 5

  const rad = (deg) => (deg * Math.PI) / 180

  /**
   * Scale that makes an iw x ih image cover ('fill') or sit inside ('fit') a w x h
   * display once rotated by `rotate` degrees. Correct for any rotation angle.
   */
  function baseScale(w, h, iw, ih, rotate, fit) {
    const c = Math.abs(Math.cos(rad(rotate)))
    const s = Math.abs(Math.sin(rad(rotate)))
    if (fit === 'fill') {
      // Seen from the image's own frame, the display rectangle must lie inside the image.
      const hx = (c * w) / 2 + (s * h) / 2
      const hy = (s * w) / 2 + (c * h) / 2
      return Math.max(hx / (iw / 2), hy / (ih / 2))
    }
    // The rotated image's bounding box must lie inside the display.
    const bx = (c * iw) / 2 + (s * ih) / 2
    const by = (s * iw) / 2 + (c * ih) / 2
    return Math.min(w / 2 / bx, h / 2 / by)
  }

  /** Total scale from source pixels to display pixels (> 1 means the image is upscaled). */
  function effectiveScale(dw, dh, asset, t) {
    return baseScale(dw, dh, asset.width, asset.height, t.rotate, t.fit) * t.zoom
  }

  function drawWallpaper(ctx, w, h, asset, t) {
    ctx.save()
    ctx.fillStyle = t.background
    ctx.fillRect(0, 0, w, h)
    if (asset) {
      const s = effectiveScale(w, h, asset, t)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.translate(w / 2 + (t.x / 100) * w, h / 2 + (t.y / 100) * h)
      ctx.rotate(rad(t.rotate))
      ctx.scale(s, s)
      ctx.drawImage(asset.image, -asset.width / 2, -asset.height / 2, asset.width, asset.height)
    }
    ctx.restore()
  }

  /** Neutral stand-in for a screen that has no wallpaper yet. */
  function drawPlaceholder(ctx, w, h, label) {
    ctx.save()
    ctx.fillStyle = '#161310'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const cy = h / 2
    const unit = Math.min(w, h)
    const r = unit * 0.15
    ctx.strokeStyle = 'rgba(236,232,223,0.2)'
    ctx.lineWidth = Math.max(2, unit * 0.006)
    ctx.setLineDash([unit * 0.02, unit * 0.02])
    ctx.beginPath()
    ctx.roundRect(cx - r, cy - r * 1.3, r * 2, r * 2, r * 0.3)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(236,232,223,0.5)'
    ctx.font = `500 ${unit * 0.04}px system-ui, "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(label, cx, cy + r * 1.15)
    ctx.restore()
  }

  // ---- Export ---------------------------------------------------------------

  const FORMATS = {
    png: { mime: 'image/png', ext: 'png', label: 'PNG', hint: 'Lossless' },
    jpg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', hint: 'Smaller', quality: 0.95 },
    webp: { mime: 'image/webp', ext: 'webp', label: 'WebP', hint: 'Smaller', quality: 0.95 },
  }

  function exportSize(screen, opts) {
    return { w: screen.px.w * opts.scale, h: screen.px.h * opts.scale }
  }

  function exportFileName(screen, opts) {
    const { w, h } = exportSize(screen, opts)
    return `foldpaper-${screen.id}-${w}x${h}.${FORMATS[opts.format].ext}`
  }

  /** Renders ONLY the artwork (no frame, guides, shadows or UI) and encodes it. */
  function exportWallpaperBlob(screen, asset, t, opts) {
    const { w, h } = exportSize(screen, opts)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return Promise.reject(new Error('Canvas is not available in this browser.'))
    drawWallpaper(ctx, w, h, asset, t)
    const info = FORMATS[opts.format]
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('This browser could not encode that format.'))),
          info.mime,
          info.quality,
        )
      } catch (e) {
        // Images loaded from file:// (the built-in defaults) taint the canvas.
        reject(
          e && e.name === 'SecurityError'
            ? new Error('The browser blocks exporting images loaded from local files. Open the site over http(s), or use your own uploads.')
            : e,
        )
      }
    })
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  Object.assign(FW, {
    baseScale,
    effectiveScale,
    drawWallpaper,
    drawPlaceholder,
    FORMATS,
    exportSize,
    exportFileName,
    exportWallpaperBlob,
    downloadBlob,
  })
})((window.FW = window.FW || {}))
