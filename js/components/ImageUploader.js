/**
 * ImageUploader — drop zone + file picker for ONE screen. Shows the recommended
 * resolution, and once an image is loaded offers Replace / Remove. It only ever
 * writes to its own screen's slot, so the cover and inner images stay independent.
 */
(function (FW) {
  const { h, icon } = FW.ui

  FW.ImageUploader = function ImageUploader(store, id) {
    const s = FW.DEVICE.screens[id]
    const inputId = `file-${id}`

    const input = h('input', {
      type: 'file',
      id: inputId,
      class: 'sr-only',
      accept: FW.ACCEPTED_TYPES.join(','),
      tabIndex: -1,
      'aria-label': `Choose ${s.label.toLowerCase()} wallpaper file`,
    })
    const error = h('p', { class: 'field-error', role: 'alert', hidden: true })

    async function handle(file) {
      if (!file) return
      error.hidden = true
      el.classList.add('is-loading')
      try {
        store.setAsset(id, await FW.loadWallpaperFile(file))
      } catch (e) {
        error.textContent = e.message || 'Something went wrong loading that image.'
        error.hidden = false
      } finally {
        el.classList.remove('is-loading')
        input.value = '' // lets the same file be chosen again
      }
    }
    const browse = () => input.click()
    input.addEventListener('change', () => handle(input.files && input.files[0]))

    // ---- Empty state: the drop zone
    const drop = h(
      'button',
      { type: 'button', class: 'dropzone', onClick: browse },
      h('span', { class: 'dz-icon' }, icon('upload', 20)),
      h('span', { class: 'dz-title' }, 'Drop an image here or ', h('u', {}, 'browse')),
      h('span', { class: 'dz-meta' }, `PNG, JPG or WebP · ${s.px.w} × ${s.px.h} px · ${s.aspect}`),
    )

    // ---- Loaded state
    const thumb = h('img', { class: 'thumb', alt: '' })
    const name = h('div', { class: 'file-name' })
    const dims = h('div', { class: 'file-dims' })
    const loaded = h(
      'div',
      { class: 'loaded', hidden: true },
      h('div', { class: 'thumb-wrap', style: { aspectRatio: `${s.px.w} / ${s.px.h}` } }, thumb),
      h(
        'div',
        { class: 'file-info' },
        name,
        dims,
        h(
          'div',
          { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-sm', onClick: browse }, icon('replace', 14), 'Replace'),
          h(
            'button',
            { type: 'button', class: 'btn btn-sm btn-danger', onClick: () => store.removeAsset(id), 'aria-label': `Remove ${s.label.toLowerCase()} wallpaper` },
            icon('trash', 14),
            'Remove',
          ),
        ),
      ),
    )

    const el = h('div', { class: 'uploader' }, input, drop, loaded, error)

    // Drag & drop anywhere on the uploader (also replaces an existing image).
    let depth = 0
    el.addEventListener('dragenter', (e) => {
      e.preventDefault()
      depth++
      el.classList.add('is-dragover')
    })
    el.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    })
    el.addEventListener('dragleave', () => {
      if (--depth <= 0) {
        depth = 0
        el.classList.remove('is-dragover')
      }
    })
    el.addEventListener('drop', (e) => {
      e.preventDefault()
      depth = 0
      el.classList.remove('is-dragover')
      handle(e.dataTransfer.files && e.dataTransfer.files[0])
    })

    function update() {
      const a = store.state.wallpapers[id].asset
      drop.hidden = !!a
      loaded.hidden = !a
      if (a) {
        if (thumb.dataset.id !== a.id) {
          thumb.dataset.id = a.id
          thumb.src = a.url
        }
        name.textContent = a.name
        name.title = a.name
        dims.textContent = `${a.width} × ${a.height} px · original quality`
      }
    }
    update()
    return { el, update, browse }
  }
})((window.FW = window.FW || {}))
