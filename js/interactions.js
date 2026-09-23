/** Drag-to-reposition directly on any [data-screen] element inside `root`. */
(function (FW) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

  FW.attachPan = function attachPan(root, store, isBlocked = () => false) {
    let drag = null

    root.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const screenEl = e.target.closest && e.target.closest('[data-screen]')
      if (!screenEl || !root.contains(screenEl)) return
      const id = screenEl.dataset.screen
      store.setActive(id)
      if (!store.hasAsset(id) || isBlocked()) return
      const rect = screenEl.getBoundingClientRect()
      const t = store.state.wallpapers[id].transform
      drag = { id, x: e.clientX, y: e.clientY, ox: t.x, oy: t.y, w: rect.width, h: rect.height, pid: e.pointerId }
      root.setPointerCapture(e.pointerId)
      root.classList.add('is-panning')
      e.preventDefault()
    })

    root.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.pid) return
      store.patchTransform(drag.id, {
        x: clamp(drag.ox + ((e.clientX - drag.x) / drag.w) * 100, -100, 100),
        y: clamp(drag.oy + ((e.clientY - drag.y) / drag.h) * 100, -100, 100),
      })
    })

    const end = (e) => {
      if (!drag || e.pointerId !== drag.pid) return
      drag = null
      root.classList.remove('is-panning')
    }
    root.addEventListener('pointerup', end)
    root.addEventListener('pointercancel', end)
  }
})((window.FW = window.FW || {}))
