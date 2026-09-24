/**
 * ScreenView — one on-screen copy of a display: the wallpaper canvas, the camera
 * cut-out, the fold crease (inner only) and the guide overlay. Everything inside is
 * positioned in percentages, so the same element works at any size and inside the
 * 3D phone, the flat "Screens" mode and the split comparison.
 */
(function (FW) {
  const { h } = FW.ui

  /**
   * @param {object} store
   * @param {'cover'|'inner'} id
   * @param {{hardware?: boolean}} opts  hardware: draw the camera punch-hole and crease
   */
  FW.ScreenView = function ScreenView(store, id, { hardware = true } = {}) {
    const s = FW.DEVICE.screens[id]
    const canvas = h('canvas', { class: 'screen-canvas' })
    const ctx = canvas.getContext('2d')

    const el = h('div', {
      class: 'screen',
      dataset: { screen: id },
      role: 'img',
      'aria-label': `${s.title} preview`,
      // Elliptical percentage radii give a true circular corner at any size.
      style: { borderRadius: `${(s.cornerRadiusPx / s.px.w) * 100}% / ${(s.cornerRadiusPx / s.px.h) * 100}%` },
    })
    el.append(canvas)

    if (hardware && s.creasePx) {
      // Book hinges run vertically (a crease bar across the width); flip hinges run
      // horizontally (a bar across the height).
      const horiz = FW.DEVICE.body.foldAxis === 'flip'
      el.append(
        h('div', {
          class: horiz ? 'crease crease-h' : 'crease',
          style: horiz ? { height: `${(s.creasePx / s.px.h) * 100}%` } : { width: `${(s.creasePx / s.px.w) * 100}%` },
        }),
      )
    }
    el.append(FW.GuideOverlay(id))
    if (hardware) {
      const d = s.camera.diameterPx
      el.append(
        h('div', {
          class: 'punch',
          style: {
            width: `${(d / s.px.w) * 100}%`,
            left: `${s.camera.x * 100}%`,
            top: `${((s.camera.y) / s.px.h) * 100}%`,
          },
        }),
      )
    }

    const view = {
      id,
      el,
      pxW: 480,
      /** Set the backing-store width (height follows the panel's aspect ratio). */
      setWidth(pxW) {
        pxW = Math.max(128, Math.min(s.px.w, Math.round(pxW)))
        if (pxW === view.pxW) return
        view.pxW = pxW
        view.draw()
      },
      draw() {
        const pxH = Math.round((view.pxW * s.px.h) / s.px.w)
        if (canvas.width !== view.pxW || canvas.height !== pxH) {
          canvas.width = view.pxW
          canvas.height = pxH
        }
        // Skip work for views that aren't visible (hidden preview modes).
        if (el.offsetParent === null) return
        ctx.drawImage(FW.renderer.master(id, view.pxW), 0, 0)
        const eff = store.effective(id)
        el.classList.toggle('editable', !!(eff && !eff.demo))
      },
    }
    FW.renderer.register(view)
    view.draw()
    return view
  }
})((window.FW = window.FW || {}))
