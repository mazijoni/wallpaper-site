/**
 * EmptyState — shown under the preview until a first image is added. The preview above
 * it already animates the built-in black-and-white example (eye ↔ face).
 */
(function (FW) {
  const { h, icon } = FW.ui

  FW.EmptyState = function EmptyState(store, { onUpload }) {
    const eyeImg = h('img', { alt: 'Example cover wallpaper: a black-and-white close-up of an eye', class: 'es-thumb es-cover' })
    const faceImg = h('img', { alt: 'Example inner wallpaper: the black-and-white face the eye belongs to', class: 'es-thumb es-inner' })
    const example = h('button', { type: 'button', class: 'btn btn-primary', onClick: () => store.loadExample() }, 'Try this example')
    const upload = h('button', { type: 'button', class: 'btn', onClick: onUpload }, icon('upload', 15), 'Upload your own')

    const el = h(
      'div',
      { class: 'empty', hidden: true },
      h(
        'div',
        { class: 'empty-text' },
        h('h2', {}, 'Create a wallpaper that changes when you unfold your phone.'),
        h('p', {}, 'Design two related images — a close-up on the cover screen, the bigger picture inside — and flip between CLOSED and OPEN to see them work together.'),
        h('div', { class: 'btn-row' }, example, upload),
      ),
      h(
        'div',
        { class: 'empty-demo', 'aria-hidden': 'false' },
        h('figure', {}, eyeImg, h('figcaption', {}, 'CLOSED · cover')),
        h('span', { class: 'es-arrow' }, icon('arrow', 20)),
        h('figure', {}, faceImg, h('figcaption', {}, 'OPEN · inner')),
      ),
    )

    function update() {
      const show = store.isEmpty()
      el.hidden = !show
      const d = store.state.demo
      if (show && d.cover && !eyeImg.src) {
        eyeImg.src = d.cover.url
        faceImg.src = d.inner.url
      }
    }
    update()
    return { el, update }
  }
})((window.FW = window.FW || {}))
