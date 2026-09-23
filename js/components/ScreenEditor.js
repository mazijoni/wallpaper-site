/**
 * CoverEditor / InnerEditor — one card per screen, bundling that screen's uploader and
 * controls. Both are the same component bound to a different screen id; they share no state.
 */
(function (FW) {
  const { h } = FW.ui

  function ScreenEditor(store, id) {
    const s = FW.DEVICE.screens[id]
    const uploader = FW.ImageUploader(store, id)
    const controls = FW.ImageControls(store, id)
    const badge = h('span', { class: 'badge', hidden: true }, 'Previewing')

    const el = h(
      'section',
      { class: 'card editor', dataset: { screen: id }, 'aria-labelledby': `h-${id}` },
      h(
        'header',
        { class: 'card-head' },
        h('div', {},
          h('h2', { id: `h-${id}` }, s.title),
          h('p', { class: 'muted' }, s.location)),
        badge,
      ),
      h(
        'dl',
        { class: 'spec-chips' },
        h('div', {}, h('dt', {}, 'Recommended'), h('dd', {}, `${s.px.w} × ${s.px.h}`)),
        h('div', {}, h('dt', {}, 'Aspect'), h('dd', {}, s.aspect)),
      ),
      uploader.el,
      controls.el,
    )

    function update() {
      uploader.update()
      controls.update()
      const on = store.state.active === id
      badge.hidden = !on
      el.classList.toggle('is-active', on)
    }
    update()
    return { el, update, uploader }
  }

  FW.CoverEditor = (store) => ScreenEditor(store, 'cover')
  FW.InnerEditor = (store) => ScreenEditor(store, 'inner')
})((window.FW = window.FW || {}))
