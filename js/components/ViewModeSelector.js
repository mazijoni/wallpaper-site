/** ViewModeSelector — Phone / Screens / Split comparison. Plus the CLOSED / OPEN fold toggle. */
(function (FW) {
  const { Segmented } = FW.ui

  FW.ViewModeSelector = function ViewModeSelector(store) {
    const seg = Segmented({
      label: 'Preview mode',
      className: 'seg-view',
      options: [
        { value: 'phone', label: 'Phone', icon: 'phone', title: 'Realistic Fold8 mockup (key 1)' },
        { value: 'screens', label: 'Screens', icon: 'screens', title: 'Cover and inner displays as flat canvases (key 2)' },
        { value: 'split', label: 'Split', icon: 'split', title: 'Closed and open side by side (key 3)' },
      ],
      value: store.state.view,
      onChange: (v) => store.setView(v),
    })
    return { el: seg.el, update: () => seg.set(store.state.view) }
  }

  FW.FoldToggle = function FoldToggle(store) {
    const seg = Segmented({
      label: 'Phone state',
      className: 'seg-fold',
      options: [
        { value: 'closed', label: 'CLOSED', title: 'Show the cover screen (key F toggles)' },
        { value: 'open', label: 'OPEN', title: 'Show the inner screen (key F toggles)' },
      ],
      value: store.state.fold,
      onChange: (v) => store.setFold(v),
    })
    function update() {
      seg.set(store.state.fold)
      const phone = store.state.view === 'phone'
      seg.el.classList.toggle('is-off', !phone)
      seg.el.title = phone ? '' : 'Closed / open applies to Phone mode'
      seg.el.querySelectorAll('button').forEach((b) => (b.disabled = !phone))
    }
    update()
    return { el: seg.el, update }
  }
})((window.FW = window.FW || {}))
