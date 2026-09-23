/**
 * Draws wallpapers into "master" canvases (one per screen and resolution, cached
 * until that wallpaper changes) and blits them into every on-screen view of that
 * screen. The inner display appears in several places at once while the phone is
 * folding (each half carries its slice), so rendering once and copying keeps
 * dragging smooth.
 */
(function (FW) {
  const views = new Set()
  const masters = new Map() // "cover@640" -> { ver, canvas }
  let store = null
  let queued = new Set()
  let raf = 0

  function master(id, pxW) {
    const screen = FW.DEVICE.screens[id]
    const pxH = Math.round((pxW * screen.px.h) / screen.px.w)
    const key = id + '@' + pxW
    const ver = store.state.version[id]
    let m = masters.get(key)
    if (m && m.ver === ver) return m.canvas
    if (!m) {
      m = { ver: -1, canvas: document.createElement('canvas') }
      m.canvas.width = pxW
      m.canvas.height = pxH
      masters.set(key, m)
    }
    const ctx = m.canvas.getContext('2d')
    const eff = store.effective(id)
    if (eff) FW.drawWallpaper(ctx, pxW, pxH, eff.asset, eff.transform)
    else FW.drawPlaceholder(ctx, pxW, pxH, `No ${screen.label.toLowerCase()} wallpaper`)
    m.ver = ver
    return m.canvas
  }

  function flush() {
    raf = 0
    const ids = queued
    queued = new Set()
    views.forEach((v) => ids.has(v.id) && v.draw())
    // Drop stale masters (old resolutions) so memory doesn't grow while resizing.
    masters.forEach((m, key) => {
      if (m.ver !== store.state.version[key.split('@')[0]]) masters.delete(key)
    })
  }

  function schedule(id) {
    queued.add(id)
    if (!raf) raf = requestAnimationFrame(flush)
  }

  FW.renderer = {
    init(s) {
      store = s
      store.subscribe((_, keys) => {
        if (keys.has('cover')) schedule('cover')
        if (keys.has('inner')) schedule('inner')
      })
    },
    master,
    register: (v) => views.add(v),
    unregister: (v) => views.delete(v),
    schedule,
  }
})((window.FW = window.FW || {}))
