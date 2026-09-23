/**
 * DevicePreview — the big preview. Three modes share the same wallpaper state:
 *   phone   realistic 3D Fold8 that unfolds between CLOSED and OPEN
 *   screens cover + inner displays as flat canvases, side by side (same pixel scale)
 *   split   a closed and an open phone next to each other
 */
(function (FW) {
  const { h } = FW.ui
  const S = FW.DEVICE.screens

  FW.DevicePreview = function DevicePreview(store) {
    const phone = FW.PhoneModel(store, { fold: store.state.fold, animated: true })
    const phonePane = h('div', { class: 'pane pane-phone' }, phone.el)
    const root = h('div', { class: 'preview', dataset: { view: store.state.view } }, phonePane)

    // ---- Split comparison (built on first use) ---------------------------------
    let splitPane = null
    function buildSplit() {
      const closed = FW.PhoneModel(store, { fold: 'closed', animated: false, sameScale: true })
      const open = FW.PhoneModel(store, { fold: 'open', animated: false })
      const fig = (model, title, sub) =>
        h('figure', { class: 'split-fig' }, h('div', { class: 'split-stage' }, model.el), h('figcaption', {}, h('b', {}, title), ' ', sub))
      splitPane = h(
        'div',
        { class: 'pane pane-split', hidden: true },
        fig(closed, 'CLOSED', `${S.cover.label} · ${S.cover.px.w} × ${S.cover.px.h}`),
        fig(open, 'OPEN', `${S.inner.label} · ${S.inner.px.w} × ${S.inner.px.h}`),
      )
      root.append(splitPane)
    }

    // ---- Flat screens (built on first use) ------------------------------------
    let screensPane = null
    function buildScreens() {
      const views = FW.SCREEN_IDS.map((id) => FW.ScreenView(store, id, { hardware: false }))
      const figs = views.map((v, i) => {
        const s = S[FW.SCREEN_IDS[i]]
        return h(
          'figure',
          { class: 'flat-fig' },
          h('div', { class: 'flat' }, v.el),
          h('figcaption', {}, h('b', {}, s.label.toUpperCase()), ' ', `${s.px.w} × ${s.px.h}`),
        )
      })
      screensPane = h('div', { class: 'pane pane-screens', hidden: true }, ...figs)
      root.append(screensPane)
      FW.attachPan(screensPane, store)

      const GAP = 28
      const CAPTION = 44
      const layout = () => {
        const W = screensPane.clientWidth - 24 // minus padding
        const H = screensPane.clientHeight - 24
        if (!W || !H) return
        const c = S.cover.px
        const n = S.inner.px
        // Side by side when there is room, stacked on tall/narrow (phone) viewports.
        const kRow = Math.min((W - GAP) / (c.w + n.w), (H - CAPTION) / Math.max(c.h, n.h))
        const kCol = Math.min(W / Math.max(c.w, n.w), (H - GAP - 2 * CAPTION) / (c.h + n.h))
        const column = kCol > kRow
        screensPane.classList.toggle('is-column', column)
        const k = Math.max(0.03, column ? kCol : kRow)
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        views.forEach((v, i) => {
          const s = S[FW.SCREEN_IDS[i]]
          const flat = figs[i].querySelector('.flat')
          flat.style.width = s.px.w * k + 'px'
          flat.style.height = s.px.h * k + 'px'
          v.setWidth(Math.ceil((s.px.w * k * dpr) / 64) * 64)
          v.draw()
        })
      }
      new ResizeObserver(layout).observe(screensPane)
    }

    function update(keys) {
      const view = store.state.view
      root.dataset.view = view
      if (keys.has('view')) {
        if (view === 'split' && !splitPane) buildSplit()
        if (view === 'screens' && !screensPane) buildScreens()
        phonePane.hidden = view !== 'phone'
        if (splitPane) splitPane.hidden = view !== 'split'
        if (screensPane) screensPane.hidden = view !== 'screens'
        // Views that were hidden while wallpapers changed need a repaint.
        FW.renderer.schedule('cover')
        FW.renderer.schedule('inner')
      }
      if (keys.has('fold')) phone.setFold(store.state.fold)
    }

    return { el: root, update }
  }
})((window.FW = window.FW || {}))
