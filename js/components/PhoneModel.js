/**
 * PhoneModel — a Galaxy Z Fold8 built from real 3D CSS transforms.
 *
 *   fixed RIGHT half ── hinge spine ── LEFT half (swings 180° over the front)
 *
 * Folding rotates the left half around the hinge axis. The inner display is one
 * continuous surface carried by both halves (and the hinge) while open; once folded,
 * the back of the left half — the COVER display — faces you. Dimensions come from
 * FW.geo (millimetres, derived from FW.DEVICE); FW.U converts mm to design pixels.
 *
 * fold: 0 = open, 1 = closed.
 */
(function (FW) {
  const { h } = FW.ui
  const { U, geo } = FW
  const px = (mm) => mm * U
  const lerp = (a, b, t) => a + (b - a) * t
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const RIM = 0.7 // mm of visible metal frame around the glass

  /**
   * @param {object} store
   * @param {{fold?: 'closed'|'open', animated?: boolean}} opts
   */
  FW.PhoneModel = function PhoneModel(store, { fold = 'closed', animated = true, sameScale = false } = {}) {
    const views = []
    const mkView = (id) => {
      const v = FW.ScreenView(store, id, { hardware: true })
      views.push(v)
      return v
    }

    // ---- Faces & boxes -------------------------------------------------------
    const T = px(geo.thickness)
    const H = px(geo.height)
    const R = px(geo.radius)

    /** kind: 'left' (moving) | 'right' (fixed) | 'hinge'. originMm: x of this box's left edge in the open body. */
    function buildBox(kind, originMm) {
      const wMm = kind === 'hinge' ? geo.hinge : geo.half
      const W = px(wMm)
      const box = h('div', { class: `box box-${kind}`, style: { width: W + 'px', height: H + 'px' } })

      const outer = kind === 'hinge' ? '0' : kind === 'left' ? `${R}px 0 0 ${R}px` : `0 ${R}px ${R}px 0`
      const rim = px(RIM)
      // Rim only on the sides that are a real edge of the phone (not where two boxes meet).
      const inset =
        kind === 'hinge'
          ? `${rim}px 0 ${rim}px 0`
          : kind === 'left'
            ? `${rim}px 0 ${rim}px ${rim}px`
            : `${rim}px ${rim}px ${rim}px 0`
      const glassRadius =
        kind === 'hinge' ? '0' : kind === 'left' ? `${R - rim}px 0 0 ${R - rim}px` : `0 ${R - rim}px ${R - rim}px 0`

      // Front face: frame + black glass + a slice of the continuous inner display.
      const front = h('div', { class: 'face front', style: { borderRadius: outer } })
      const glass = h('div', { class: 'glass', style: { inset, borderRadius: glassRadius } })
      const innerView = mkView('inner')
      // Front faces overlap their neighbours by 1px. The slices show identical pixels, so
      // this hides the sub-pixel hairline that anti-aliasing would otherwise draw at the hinge.
      const OVERLAP = 1
      if (kind === 'left') front.style.right = -OVERLAP + 'px'
      else front.style.left = -OVERLAP + 'px'
      if (kind === 'hinge') front.style.right = -OVERLAP + 'px'
      const shift = kind === 'left' ? 0 : OVERLAP
      Object.assign(innerView.el.style, {
        left: px(geo.inner.bezelX - originMm) + shift + 'px',
        top: px(geo.inner.bezelY) + 'px',
        width: px(geo.inner.wMm) + 'px',
        height: px(geo.inner.hMm) + 'px',
      })
      front.append(glass, innerView.el, h('div', { class: 'shade' }))
      if (kind === 'hinge') front.classList.add('fade-out-when-closed')

      // Back face: rotated to face away; mirrored corner radii so they land on the outside edge.
      const back = h('div', {
        class: 'face back',
        style: {
          borderRadius: kind === 'hinge' ? '0' : kind === 'left' ? `0 ${R}px ${R}px 0` : outer,
          transform: `translateZ(${-T}px) rotateY(180deg)`,
        },
      })
      if (kind === 'left') {
        // The cover display lives on the back of the swinging half.
        const backGlass = h('div', {
          class: 'glass',
          style: { inset: `${rim}px ${rim}px ${rim}px 0`, borderRadius: `0 ${R - rim}px ${R - rim}px 0` },
        })
        const coverView = mkView('cover')
        Object.assign(coverView.el.style, {
          left: px((geo.half - geo.cover.wMm) / 2) + 'px',
          top: px(geo.cover.bezelY) + 'px',
          width: px(geo.cover.wMm) + 'px',
          height: px(geo.cover.hMm) + 'px',
        })
        back.append(backGlass, coverView.el, h('div', { class: 'shade' }))
      }

      // Thin metal sides give the slab real thickness while it swings.
      const side = (cls, style) => h('div', { class: 'face side ' + cls, style })
      // Edges that touch a neighbouring box are omitted: they'd only show as seams.
      const sideL = side('side-l', { width: T + 'px', height: H - 2 * R + 'px', top: R + 'px', left: 0, transformOrigin: 'left center', transform: `translateZ(${-T}px) rotateY(-90deg)` })
      const sideR = side('side-r', { width: T + 'px', height: H - 2 * R + 'px', top: R + 'px', left: W - T + 'px', transformOrigin: 'right center', transform: `translateZ(${-T}px) rotateY(90deg)` })
      const sideT = side('side-t', { height: T + 'px', width: W + 'px', top: 0, left: 0, transformOrigin: 'center top', transform: `translateZ(${-T}px) rotateX(90deg)` })
      const sideB = side('side-b', { height: T + 'px', width: W + 'px', bottom: 0, left: 0, transformOrigin: 'center bottom', transform: `translateZ(${-T}px) rotateX(-90deg)` })
      const sides = kind === 'left' ? [sideL, sideT, sideB] : kind === 'right' ? [sideR, sideT, sideB] : [sideL, sideT, sideB]
      box.append(...sides, back, front)
      return box
    }

    const hingeBox = buildBox('hinge', geo.half)
    hingeBox.style.left = px(geo.half) + 'px'

    const rightBox = buildBox('right', geo.half + geo.hinge)
    rightBox.style.left = px(geo.half + geo.hinge) + 'px'

    const leftBox = buildBox('left', 0)
    leftBox.style.left = -px(geo.half + geo.hinge / 2) + 'px' // relative to the pivot

    const pivot = h('div', { class: 'pivot' }, leftBox)
    pivot.style.left = px(geo.openW / 2) + 'px'

    // Side keys (power / volume) on the outer edge of the fixed half.
    const key = (topMm, hMm) =>
      h('div', {
        class: 'key',
        style: { left: px(geo.openW) - 1 + 'px', top: px(topMm) + 'px', height: px(hMm) + 'px', transform: `translateZ(${-T / 2}px)` },
      })
    const scene = h(
      'div',
      {
        class: 'phone-scene',
        style: {
          width: px(geo.openW) + 'px',
          height: H + 'px',
          marginLeft: -px(geo.openW) / 2 + 'px',
          marginTop: -H / 2 + 'px',
        },
      },
      hingeBox,
      rightBox,
      pivot,
      key(26, 15),
      key(46, 10),
    )

    const shadow = h('div', { class: 'phone-shadow' })
    const root = h('div', { class: 'phone-root', dataset: { fold } }, shadow, scene)

    // ---- Sizing --------------------------------------------------------------
    let kOpen = 0.5
    let kClosed = 0.5
    let p = fold === 'closed' ? 1 : 0

    function apply() {
      const k = lerp(kOpen, kClosed, p)
      const tilt = 11 * Math.sin(Math.PI * p) // gentle camera yaw mid-fold
      scene.style.transform = `translateX(${(geo.closedShift * U * k * p).toFixed(2)}px) rotateY(${tilt.toFixed(2)}deg) scale(${k.toFixed(4)})`
      const pz = px(geo.pivotZ)
      pivot.style.transform = `translateZ(${pz}px) rotateY(${(p * 180).toFixed(2)}deg) translateZ(${-pz}px)`
      root.style.setProperty('--fold', p.toFixed(4))
      root.style.setProperty('--shade', (0.42 * Math.sin(Math.PI * p)).toFixed(3))
      // Ground shadow follows the phone's current footprint.
      const wNow = lerp(geo.openW, geo.closedW, p) * U * k
      shadow.style.width = wNow * 1.02 + 'px'
      shadow.style.marginTop = (H * k) / 2 + 6 + 'px'
    }

    function resize() {
      const w = root.clientWidth
      const hh = root.clientHeight
      if (!w || !hh) return
      const pad = 1.1 // breathing room for the swing + shadow
      const fit = (mmW) => Math.min(w / (px(mmW) * pad), hh / (H * pad * 1.06))
      kOpen = fit(geo.openW)
      // sameScale: draw the closed phone at the open phone's scale (true relative size).
      kClosed = sameScale ? kOpen : fit(geo.closedW)
      root.style.perspective = 3400 * kOpen + 'px'
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const kMax = Math.max(kOpen, kClosed)
      for (const v of views) {
        const d = v.id === 'cover' ? geo.cover.wMm : geo.inner.wMm
        v.setWidth(Math.ceil((px(d) * kMax * dpr) / 64) * 64)
        v.draw() // also repaints views that were hidden while wallpapers changed
      }
      apply()
    }
    new ResizeObserver(resize).observe(root)

    // ---- Fold animation -------------------------------------------------------
    let raf = 0
    function setFold(next, animate = animated) {
      root.dataset.fold = next
      const to = next === 'closed' ? 1 : 0
      cancelAnimationFrame(raf)
      if (!animate || reduceMotion() || p === to) {
        p = to
        delete root.dataset.animating
        apply()
        return
      }
      const from = p
      const dur = 1000 * Math.abs(to - from) + 120
      const t0 = performance.now()
      root.dataset.animating = 'true'
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur)
        p = lerp(from, to, ease(t))
        apply()
        if (t < 1) raf = requestAnimationFrame(step)
        else delete root.dataset.animating
      }
      raf = requestAnimationFrame(step)
    }

    FW.attachPan(root, store, () => !!root.dataset.animating)
    apply()

    return { el: root, setFold, views, resize }
  }
})((window.FW = window.FW || {}))
