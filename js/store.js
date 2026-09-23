/**
 * App state. The two wallpapers (cover / inner) are stored completely
 * independently — separate asset, separate transform, separate version counter.
 */
(function (FW) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

  FW.createStore = function () {
    const blank = () => ({ asset: null, transform: { ...FW.DEFAULT_TRANSFORM } })

    const state = {
      view: 'phone', // 'phone' | 'screens' | 'split'
      fold: 'closed', // 'closed' | 'open'
      guides: false,
      active: 'cover', // the screen the keyboard / preview edits
      wallpapers: { cover: blank(), inner: blank() },
      demo: { cover: null, inner: null }, // shown only while both slots are empty
      version: { cover: 0, inner: 0 }, // bumped whenever a screen's rendered output changes
    }

    const listeners = new Set()
    const emit = (...keys) => {
      const set = new Set(keys)
      listeners.forEach((fn) => fn(state, set))
    }
    const bump = (id) => {
      state.version[id]++
    }
    const revoke = (asset) => asset && URL.revokeObjectURL(asset.url)

    const api = {
      state,
      subscribe(fn) {
        listeners.add(fn)
        return () => listeners.delete(fn)
      },

      hasAsset: (id) => !!state.wallpapers[id].asset,
      isEmpty: () => !state.wallpapers.cover.asset && !state.wallpapers.inner.asset,

      /** What a screen should currently display: its own wallpaper, or the demo when both are empty. */
      effective(id) {
        const w = state.wallpapers[id]
        if (w.asset) return { asset: w.asset, transform: w.transform, demo: false }
        if (api.isEmpty() && state.demo[id]) {
          return { asset: state.demo[id], transform: FW.demo.transforms[id], demo: true }
        }
        return null
      },

      setView(view) {
        state.view = view
        emit('view')
      },
      setFold(fold) {
        state.fold = fold
        state.active = fold === 'closed' ? 'cover' : 'inner'
        emit('fold', 'active')
      },
      toggleFold() {
        api.setFold(state.fold === 'closed' ? 'open' : 'closed')
      },
      setGuides(on) {
        state.guides = on
        emit('guides')
      },
      setActive(id) {
        if (state.active === id) return
        state.active = id
        emit('active')
      },

      setAsset(id, asset) {
        const wasEmpty = api.isEmpty()
        revoke(state.wallpapers[id].asset)
        state.wallpapers[id] = { asset, transform: { ...FW.DEFAULT_TRANSFORM } }
        state.active = id
        bump(id)
        // The demo disappears from both screens as soon as the first image arrives.
        if (wasEmpty) bump(id === 'cover' ? 'inner' : 'cover')
        emit(id, 'active', 'assets')
        if (wasEmpty) emit(id === 'cover' ? 'inner' : 'cover')
      },
      removeAsset(id) {
        revoke(state.wallpapers[id].asset)
        state.wallpapers[id] = blank()
        bump(id)
        if (api.isEmpty()) bump(id === 'cover' ? 'inner' : 'cover')
        emit(id, 'assets')
        if (api.isEmpty()) emit(id === 'cover' ? 'inner' : 'cover')
      },
      patchTransform(id, patch) {
        const w = state.wallpapers[id]
        if (!w.asset) return
        w.transform = { ...w.transform, ...patch }
        bump(id)
        emit(id)
      },
      resetTransform(id) {
        const w = state.wallpapers[id]
        if (!w.asset) return
        w.transform = { ...FW.DEFAULT_TRANSFORM, background: w.transform.background }
        bump(id)
        emit(id)
      },
      nudge(id, dx, dy) {
        const t = state.wallpapers[id].transform
        api.patchTransform(id, { x: clamp(t.x + dx, -100, 100), y: clamp(t.y + dy, -100, 100) })
      },
      zoomBy(id, factor) {
        const t = state.wallpapers[id].transform
        api.patchTransform(id, { zoom: clamp(t.zoom * factor, FW.ZOOM_MIN, FW.ZOOM_MAX) })
      },

      /** Load the default (Maze logo) example into the two slots (as independent images). */
      async loadExample() {
        const demo = await FW.demo.build()
        api.setAsset('inner', demo.inner)
        api.setAsset('cover', demo.cover)
        // Start from the same placement the built-in defaults use.
        api.patchTransform('inner', FW.demo.transforms.inner)
        api.patchTransform('cover', FW.demo.transforms.cover)
        api.setFold(state.fold) // keep the active screen in sync with the fold state
      },
    }

    // Prepare the placeholder artwork shown in the empty state.
    FW.demo.build().then((demo) => {
      state.demo = demo
      bump('cover')
      bump('inner')
      emit('cover', 'inner', 'demo')
    })

    return api
  }
})((window.FW = window.FW || {}))
