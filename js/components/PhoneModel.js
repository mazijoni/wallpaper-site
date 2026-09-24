/**
 * PhoneModel — a foldable phone built from real 3D CSS transforms. Works for both
 * hinge orientations (see geometry.js):
 *
 *   book: fixed BASE (right) ── hinge spine ── LEAD (left) half, swings sideways
 *   flip: fixed BASE (bottom) ── hinge spine ── LEAD (top) half, swings down
 *
 * Folding rotates the lead half around the hinge axis. The inner display is one
 * continuous surface carried by both halves (and the hinge) while open; once folded,
 * the back of the lead half — the COVER display — faces you. Dimensions come from
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

  // ---- Axis plumbing --------------------------------------------------------------
  // 'book' arranges halves left/right (span = width, rotates around Y). 'flip' stacks
  // them top/bottom (span = height, rotates around X). Everything below that differs
  // by orientation reduces to these few mappings.
  const BOOK = geo.axis !== 'flip'
  const spanProp = BOOK ? 'width' : 'height'
  const crossProp = BOOK ? 'height' : 'width'
  const offsetProp = BOOK ? 'left' : 'top' // where boxes sit along the span axis
  const crossOffsetProp = BOOK ? 'top' : 'left' // the (fixed, always 0) cross-axis offset
  const spanStartProp = BOOK ? 'left' : 'top' // same as offsetProp; named for clarity below
  const spanEndProp = BOOK ? 'right' : 'bottom'
  const rotateFn = BOOK ? 'rotateY' : 'rotateX'
  const shiftFn = BOOK ? 'translateX' : 'translateY'
  // The real-world right edge (side keys) is always screen-X regardless of axis.
  const worldRightMm = BOOK ? geo.openSpan : geo.cross
  const worldOpenWMm = BOOK ? geo.openSpan : geo.cross
  const worldOpenHMm = BOOK ? geo.cross : geo.openSpan

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
    const CROSS = px(geo.cross)
    const R = px(geo.radius)
    const RG = Math.max(0, R - px(RIM)) // glass corner radius (never negative)

    // Corner-radius shorthands (CSS order: TL TR BR BL). "lead" rounds the corners on
    // the lead half's own outer edge; "base" rounds the base half's outer edge. A box's
    // back face — once folded, it swings to occupy the base half's footprint — always
    // uses the base pattern.
    const leadCorners = (v) => (BOOK ? `${v} 0 0 ${v}` : `${v} ${v} 0 0`)
    const baseCorners = (v) => (BOOK ? `0 ${v} ${v} 0` : `0 0 ${v} ${v}`)

    /** kind: 'lead' (moving) | 'base' (fixed) | 'hinge'. originMm: this box's span-axis start, in the open body. */
    function buildBox(kind, originMm) {
      const spanMm = kind === 'hinge' ? geo.hinge : geo.half
      const spanPx = px(spanMm)
      const box = h('div', { class: `box box-${kind}`, style: { [spanProp]: spanPx + 'px', [crossProp]: CROSS + 'px', [crossOffsetProp]: '0' } })
      // The box's own literal CSS width/height (spanPx/CROSS mapped by axis) — used below
      // for the side faces, which don't care which axis is which, only actual box shape.
      const boxW = BOOK ? spanPx : CROSS
      const boxH = BOOK ? CROSS : spanPx

      const outer = kind === 'hinge' ? '0' : kind === 'lead' ? leadCorners(`${R}px`) : baseCorners(`${R}px`)
      const rim = px(RIM)
      // Front glass inset (T R B L): 0 on the edge(s) touching a neighbour (the display
      // is continuous there), rim everywhere else — including both cross edges.
      const val = (edge) => {
        if (kind === 'hinge') return BOOK ? (edge === 'L' || edge === 'R' ? '0' : `${rim}px`) : edge === 'T' || edge === 'B' ? '0' : `${rim}px`
        const seam = kind === 'lead' ? (BOOK ? 'R' : 'B') : BOOK ? 'L' : 'T'
        return edge === seam ? '0' : `${rim}px`
      }
      const inset = `${val('T')} ${val('R')} ${val('B')} ${val('L')}`
      const glassRadius = kind === 'hinge' ? '0' : kind === 'lead' ? leadCorners(`${RG}px`) : baseCorners(`${RG}px`)

      // Front face: frame + black glass + a slice of the continuous inner display.
      const front = h('div', { class: 'face front', style: { borderRadius: outer } })
      const glass = h('div', { class: 'glass', style: { inset, borderRadius: glassRadius } })
      const innerView = mkView('inner')
      // Front faces overlap their neighbours by 1px. The slices show identical pixels, so
      // this hides the sub-pixel hairline that anti-aliasing would otherwise draw at the hinge.
      const OVERLAP = 1
      if (kind === 'lead') front.style[spanEndProp] = -OVERLAP + 'px'
      else front.style[spanStartProp] = -OVERLAP + 'px'
      if (kind === 'hinge') front.style[spanEndProp] = -OVERLAP + 'px'
      const shift = kind === 'lead' ? 0 : OVERLAP
      const spanBezel = BOOK ? geo.inner.bezelX : geo.inner.bezelY
      const crossBezel = BOOK ? geo.inner.bezelY : geo.inner.bezelX
      Object.assign(innerView.el.style, {
        [offsetProp]: px(spanBezel - originMm) + shift + 'px',
        [crossOffsetProp]: px(crossBezel) + 'px',
        width: px(geo.inner.wMm) + 'px',
        height: px(geo.inner.hMm) + 'px',
      })
      front.append(glass, innerView.el, h('div', { class: 'shade' }))
      if (kind === 'hinge') front.classList.add('fade-out-when-closed')

      // Back face: rotated to face away; mirrored corner radii so they land on the outside edge.
      const back = h('div', {
        class: 'face back',
        style: {
          borderRadius: kind === 'hinge' ? '0' : baseCorners(`${R}px`),
          transform: `translateZ(${-T}px) ${rotateFn}(180deg)`,
        },
      })
      if (kind === 'lead') {
        // The cover display lives on the back of the swinging half. Its glass runs
        // flush to the half's own outer edge, with a rim on the other three sides.
        const outerEdge = BOOK ? 'L' : 'T'
        const gv = (edge) => (edge === outerEdge ? '0' : `${rim}px`)
        const backGlass = h('div', {
          class: 'glass',
          style: { inset: `${gv('T')} ${gv('R')} ${gv('B')} ${gv('L')}`, borderRadius: baseCorners(`${RG}px`) },
        })
        const coverView = mkView('cover')
        Object.assign(coverView.el.style, {
          [offsetProp]: px(BOOK ? geo.cover.bezelX : geo.cover.bezelY) + 'px',
          [crossOffsetProp]: px(BOOK ? geo.cover.bezelY : geo.cover.bezelX) + 'px',
          width: px(geo.cover.wMm) + 'px',
          height: px(geo.cover.hMm) + 'px',
        })
        back.append(backGlass, coverView.el, h('div', { class: 'shade' }))
      }

      // Thin metal sides give the slab real thickness while it swings. sideL/R and
      // sideT/B are always the same 4 possible faces of a box; which pair is the
      // "exposed, kind-specific" edge vs. "always present on every box" swaps by axis.
      const side = (cls, style) => h('div', { class: 'face side ' + cls, style })
      const sideL = side('side-l', { width: T + 'px', height: boxH - 2 * R + 'px', top: R + 'px', left: 0, transformOrigin: 'left center', transform: `translateZ(${-T}px) rotateY(-90deg)` })
      const sideR = side('side-r', { width: T + 'px', height: boxH - 2 * R + 'px', top: R + 'px', left: boxW - T + 'px', transformOrigin: 'right center', transform: `translateZ(${-T}px) rotateY(90deg)` })
      const sideT = side('side-t', { height: T + 'px', width: boxW + 'px', top: 0, left: 0, transformOrigin: 'center top', transform: `translateZ(${-T}px) rotateX(90deg)` })
      const sideB = side('side-b', { height: T + 'px', width: boxW + 'px', bottom: 0, left: 0, transformOrigin: 'center bottom', transform: `translateZ(${-T}px) rotateX(-90deg)` })
      // Edges that touch a neighbouring box are omitted: they'd only show as seams.
      const alwaysBoth = BOOK ? [sideT, sideB] : [sideL, sideR]
      const exposed = BOOK ? (kind === 'base' ? sideR : sideL) : kind === 'base' ? sideB : sideT
      if (kind === 'hinge') exposed.classList.add('hinge-edge')
      const sides = [exposed, ...alwaysBoth]
      box.append(...sides, back, front)
      return box
    }

    const hingeBox = buildBox('hinge', geo.half)
    hingeBox.style[offsetProp] = px(geo.half) + 'px'

    const baseBox = buildBox('base', geo.half + geo.hinge)
    baseBox.style[offsetProp] = px(geo.half + geo.hinge) + 'px'

    const leadBox = buildBox('lead', 0)
    leadBox.style[offsetProp] = -px(geo.half + geo.hinge / 2) + 'px' // relative to the pivot

    const pivot = h('div', { class: 'pivot', style: { [crossOffsetProp]: '0' } }, leadBox)
    pivot.style[offsetProp] = px(geo.openSpan / 2) + 'px'

    // Side keys (power / volume) on the phone's real-world right edge, regardless of axis.
    const key = (posMm, lenMm) =>
      h('div', {
        class: 'key',
        style: { left: px(worldRightMm) - 1 + 'px', top: px(posMm) + 'px', height: px(lenMm) + 'px', transform: `translateZ(${-T / 2}px)` },
      })
    const scene = h(
      'div',
      {
        class: 'phone-scene',
        style: {
          width: px(worldOpenWMm) + 'px',
          height: px(worldOpenHMm) + 'px',
          marginLeft: -px(worldOpenWMm) / 2 + 'px',
          marginTop: -px(worldOpenHMm) / 2 + 'px',
        },
      },
      hingeBox,
      baseBox,
      pivot,
      key(26, 15),
      key(46, 10),
    )

    const shadow = h('div', { class: 'phone-shadow' })
    const root = h('div', { class: 'phone-root', dataset: { fold, axis: geo.axis } }, shadow, scene)

    // ---- Sizing --------------------------------------------------------------
    let kOpen = 0.5
    let kClosed = 0.5
    let p = fold === 'closed' ? 1 : 0

    function apply() {
      const k = lerp(kOpen, kClosed, p)
      const tilt = 11 * Math.sin(Math.PI * p) // gentle camera yaw mid-fold
      scene.style.transform = `${shiftFn}(${(geo.closedShift * U * k * p).toFixed(2)}px) rotateY(${tilt.toFixed(2)}deg) scale(${k.toFixed(4)})`
      const pz = px(geo.pivotZ)
      pivot.style.transform = `translateZ(${pz}px) ${rotateFn}(${(p * 180).toFixed(2)}deg) translateZ(${-pz}px)`
      root.style.setProperty('--fold', p.toFixed(4))
      root.style.setProperty('--shade', (0.42 * Math.sin(Math.PI * p)).toFixed(3))
      // Ground shadow follows the phone's current on-screen footprint.
      const spanNow = lerp(geo.openSpan, geo.closedSpan, p)
      const onScreenW = (BOOK ? spanNow : geo.cross) * U * k
      const onScreenH = (BOOK ? geo.cross : spanNow) * U * k
      shadow.style.width = onScreenW * 1.02 + 'px'
      shadow.style.marginTop = onScreenH / 2 + 6 + 'px'
    }

    function resize() {
      const w = root.clientWidth
      const hh = root.clientHeight
      if (!w || !hh) return
      const pad = 1.1 // breathing room for the swing + shadow
      const fit = (spanMm) => {
        const onW = BOOK ? spanMm : geo.cross
        const onH = BOOK ? geo.cross : spanMm
        return Math.min(w / (px(onW) * pad), hh / (px(onH) * pad * 1.06))
      }
      kOpen = fit(geo.openSpan)
      // sameScale: draw the closed phone at the open phone's scale (true relative size).
      kClosed = sameScale ? kOpen : fit(geo.closedSpan)
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
