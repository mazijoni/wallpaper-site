/** FoldWall Studio — composes the components and wires up keyboard shortcuts. */
(function (FW) {
  const { h, icon, Switch } = FW.ui
  const store = FW.createStore()
  FW.renderer.init(store)

  // ---- Components --------------------------------------------------------------
  const cover = FW.CoverEditor(store)
  const inner = FW.InnerEditor(store)
  const viewMode = FW.ViewModeSelector(store)
  const foldToggle = FW.FoldToggle(store)
  const preview = FW.DevicePreview(store)
  const exportPanel = FW.ExportPanel(store)
  const info = FW.DeviceInfo()
  const empty = FW.EmptyState(store, { onUpload: () => cover.uploader.browse() })
  const guides = Switch({
    label: 'Show Guides',
    checked: store.state.guides,
    hint: 'Safe-area overlays (key G). Never included in exports.',
    onChange: (v) => store.setGuides(v),
  })

  // ---- Export popover --------------------------------------------------------------
  const exportBtn = h(
    'button',
    { type: 'button', class: 'btn btn-primary btn-export-top', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': 'export-pop' },
    icon('download', 16),
    'EXPORT',
  )
  const popover = h(
    'div',
    { id: 'export-pop', class: 'popover', role: 'dialog', 'aria-label': 'Export wallpapers', hidden: true },
    h('div', { class: 'popover-head' },
      h('h2', {}, 'Export'),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close export panel', onClick: () => setPopover(false) }, icon('close', 16))),
    exportPanel.el,
  )
  function setPopover(open) {
    popover.hidden = !open
    exportBtn.setAttribute('aria-expanded', String(open))
    if (open) exportPanel.focusFirst()
    else exportBtn.focus()
  }
  exportBtn.addEventListener('click', () => setPopover(popover.hidden))
  document.addEventListener('pointerdown', (e) => {
    if (!popover.hidden && !popover.contains(e.target) && !exportBtn.contains(e.target)) {
      popover.hidden = true
      exportBtn.setAttribute('aria-expanded', 'false')
    }
  })

  // ---- Guides legend -----------------------------------------------------------------
  const C = FW.GUIDE_COLORS
  const chip = (color, text) => h('li', {}, h('span', { class: 'swatch', style: { background: color + '0.9)' } }), text)
  const legend = h(
    'ul',
    { class: 'legend', hidden: true, 'aria-label': 'Guide legend' },
    chip(C.bars, 'Status & gesture bars'),
    chip(C.zone, 'System UI zones'),
    chip(C.camera, 'Camera cut-out'),
    chip(C.corner, 'Rounded corners'),
    chip(C.fold, 'Fold crease'),
    h('li', { class: 'legend-note' }, 'Approximate · not exported'),
  )

  // ---- Layout --------------------------------------------------------------------------
  const stage = h(
    'div',
    {
      class: 'stage',
      tabIndex: 0,
      role: 'group',
      'aria-label': 'Wallpaper preview. Drag the image to reposition it. Arrow keys nudge, plus and minus zoom.',
    },
    preview.el,
  )

  const header = h(
    'header',
    { class: 'topbar' },
    h('div', { class: 'brand' },
      h('span', { class: 'logo', 'aria-hidden': 'true' }, h('i'), h('i')),
      h('span', { class: 'brand-name' }, 'FoldWall ', h('b', {}, 'Studio')),
      h('span', { class: 'device-chip' }, FW.DEVICE.name)),
    h('div', { class: 'export-anchor' }, exportBtn, popover),
  )

  const toolbar = h(
    'div',
    { class: 'toolbar' },
    viewMode.el,
    foldToggle.el,
    guides.el,
  )

  const stageCol = h(
    'section',
    { class: 'stage-col', 'aria-label': 'Preview' },
    toolbar,
    stage,
    legend,
    empty.el,
    h('p', { class: 'kbd-hint' }, 'Shortcuts: ', h('kbd', {}, 'F'), ' fold · ', h('kbd', {}, 'G'), ' guides · ', h('kbd', {}, '1'), h('kbd', {}, '2'), h('kbd', {}, '3'), ' views'),
  )

  const side = h('aside', { class: 'side', 'aria-label': 'Wallpaper editors' }, cover.el, inner.el, info.el)

  const app = h('div', { class: 'app', dataset: { guides: 'off' } }, header, h('main', { class: 'layout' }, stageCol, side))
  document.getElementById('app').replaceWith(app)

  // ---- State → UI ------------------------------------------------------------------------
  function sync(state, keys) {
    preview.update(keys)
    viewMode.update()
    foldToggle.update()
    cover.update()
    inner.update()
    exportPanel.update()
    empty.update()
    guides.set(state.guides)
    app.dataset.guides = state.guides ? 'on' : 'off'
    app.dataset.view = state.view
    legend.hidden = !state.guides
  }
  store.subscribe(sync)
  sync(store.state, new Set(['view', 'fold']))

  // ---- Keyboard ----------------------------------------------------------------------------
  const typing = (t) => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'range' && t.type !== 'checkbox')

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popover.hidden) return setPopover(false)
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return
    const k = e.key.toLowerCase()
    if (k === 'f' && store.state.view === 'phone') store.toggleFold()
    else if (k === 'g') store.setGuides(!store.state.guides)
    else if (k === '1') store.setView('phone')
    else if (k === '2') store.setView('screens')
    else if (k === '3') store.setView('split')
  })

  // Arrow keys / +/- act on the previewed screen while the preview has focus.
  stage.addEventListener('keydown', (e) => {
    const id = store.state.active
    if (!store.hasAsset(id) || e.metaKey || e.ctrlKey || e.altKey) return
    const step = e.shiftKey ? 5 : 1
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (moves[e.key]) store.nudge(id, ...moves[e.key])
    else if (e.key === '+' || e.key === '=') store.zoomBy(id, 1.05)
    else if (e.key === '-' || e.key === '_') store.zoomBy(id, 1 / 1.05)
    else return
    e.preventDefault()
  })

  // A file dropped outside a drop zone shouldn't navigate the tab away to the image.
  for (const ev of ['dragover', 'drop']) window.addEventListener(ev, (e) => e.preventDefault())

  FW.store = store // handy for debugging in the console
})((window.FW = window.FW || {}))
