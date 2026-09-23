/**
 * ExportPanel — exports ONLY the wallpaper artwork (no phone frame, guides, UI or
 * shadows) at the panel's native resolution, or 2x. Uses the same draw routine as
 * the preview, straight from the original full-resolution image.
 */
(function (FW) {
  const { h, icon, Segmented } = FW.ui

  FW.ExportPanel = function ExportPanel(store) {
    const opts = { format: 'png', scale: 1 }
    const S = FW.DEVICE.screens

    const format = Segmented({
      label: 'Export format',
      options: Object.entries(FW.FORMATS).map(([value, f]) => ({ value, label: f.label, title: f.hint })),
      value: opts.format,
      onChange: (v) => {
        opts.format = v
        format.set(v)
        refresh()
      },
    })
    const size = Segmented({
      label: 'Export size',
      options: [
        { value: '1', label: 'Native', title: 'Exactly the panel resolution' },
        { value: '2', label: '2×', title: 'Double resolution (renders at a larger size for extra headroom)' },
      ],
      value: '1',
      onChange: (v) => {
        opts.scale = Number(v)
        size.set(v)
        refresh()
      },
    })

    const status = h('p', { class: 'export-status', role: 'status', 'aria-live': 'polite' })

    function button(label, sub, onClick) {
      const sp = h('span', { class: 'btn-sub' }, sub)
      const b = h('button', { type: 'button', class: 'btn btn-export', onClick }, icon('download', 16), h('span', { class: 'btn-main' }, label), sp)
      return { el: b, sp }
    }

    async function run(fn, doneMsg) {
      status.className = 'export-status'
      status.textContent = 'Rendering…'
      try {
        await fn()
        status.textContent = doneMsg
      } catch (e) {
        status.className = 'export-status err'
        status.textContent = (e && e.message) || 'Export failed.'
      }
    }
    const one = (id) => async () => {
      const w = store.state.wallpapers[id]
      const blob = await FW.exportWallpaperBlob(S[id], w.asset, w.transform, opts)
      FW.downloadBlob(blob, FW.exportFileName(S[id], opts))
    }
    const both = async () => {
      const files = []
      for (const id of FW.SCREEN_IDS) {
        const w = store.state.wallpapers[id]
        files.push({ name: FW.exportFileName(S[id], opts), blob: await FW.exportWallpaperBlob(S[id], w.asset, w.transform, opts) })
      }
      FW.downloadBlob(await FW.makeZip(files), 'foldpaper-fold8-wallpapers.zip')
    }

    const bCover = button('Cover wallpaper', '', () => run(one('cover'), 'Cover wallpaper exported.'))
    const bInner = button('Inner wallpaper', '', () => run(one('inner'), 'Inner wallpaper exported.'))
    const bBoth = button('Both as ZIP', '', () => run(both, 'ZIP exported.'))
    bBoth.el.classList.add('btn-primary')

    const el = h(
      'div',
      { class: 'export-panel' },
      h('div', { class: 'export-opts' },
        h('div', {}, h('span', { class: 'field-label' }, 'Format'), format.el),
        h('div', {}, h('span', { class: 'field-label' }, 'Size'), size.el)),
      h('div', { class: 'export-actions' }, bCover.el, bInner.el, bBoth.el),
      status,
      h('p', { class: 'note' }, 'Exports contain only the artwork — no phone frame, guides, shadows or UI. Everything is rendered in your browser; nothing is uploaded.'),
    )

    function refresh() {
      const has = { cover: store.hasAsset('cover'), inner: store.hasAsset('inner') }
      const dim = (id) => {
        const { w, h: hh } = FW.exportSize(S[id], opts)
        return `${w} × ${hh}`
      }
      bCover.sp.textContent = has.cover ? dim('cover') : 'Add an image first'
      bInner.sp.textContent = has.inner ? dim('inner') : 'Add an image first'
      bBoth.sp.textContent = has.cover && has.inner ? 'Cover + inner' : 'Needs both images'
      bCover.el.disabled = !has.cover
      bInner.el.disabled = !has.inner
      bBoth.el.disabled = !(has.cover && has.inner)
    }
    refresh()
    return { el, update: refresh, focusFirst: () => (bBoth.el.disabled ? format.el.querySelector('[tabindex="0"]') : bBoth.el).focus() }
  }
})((window.FW = window.FW || {}))
