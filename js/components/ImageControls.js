/** ImageControls — Zoom, Position X/Y, Rotate, Fit/Fill, Reset for ONE screen's wallpaper. */
(function (FW) {
  const { h, icon, Slider, Segmented } = FW.ui

  FW.ImageControls = function ImageControls(store, id) {
    const s = FW.DEVICE.screens[id]
    const patch = (p) => store.patchTransform(id, p)

    const zmin = FW.ZOOM_MIN * 100
    const zmax = FW.ZOOM_MAX * 100
    const span = Math.log(zmax / zmin)

    const zoom = Slider({
      label: 'Zoom',
      min: zmin,
      max: zmax,
      step: 1,
      unit: '%',
      defaultValue: 100,
      toPos: (v) => (1000 * Math.log(v / zmin)) / span, // logarithmic: fine control near 100%
      fromPos: (p) => zmin * Math.exp((p / 1000) * span),
      onInput: (v) => patch({ zoom: v / 100 }),
    })
    const posX = Slider({ label: 'Position X', min: -100, max: 100, step: 0.5, unit: '%', decimals: 1, defaultValue: 0, onInput: (v) => patch({ x: v }) })
    const posY = Slider({ label: 'Position Y', min: -100, max: 100, step: 0.5, unit: '%', decimals: 1, defaultValue: 0, onInput: (v) => patch({ y: v }) })
    const rotate = Slider({ label: 'Rotate', min: -180, max: 180, step: 0.5, unit: '°', decimals: 1, defaultValue: 0, onInput: (v) => patch({ rotate: v }) })

    const fit = Segmented({
      label: `${s.label} image fit`,
      options: [
        { value: 'fill', label: 'Fill', title: 'Cover the whole display (crops the edges)' },
        { value: 'fit', label: 'Fit', title: 'Show the whole image (may leave bars)' },
      ],
      value: 'fill',
      onChange: (v) => patch({ fit: v }),
    })
    const bg = h('input', {
      type: 'color',
      class: 'color',
      value: '#000000',
      'aria-label': 'Background colour',
      onInput: (e) => patch({ background: e.target.value }),
    })
    const bgWrap = h('label', { class: 'bg-field' }, h('span', {}, 'Background'), bg)

    const note = h('p', { class: 'note', 'aria-live': 'polite' })
    const reset = h('button', { type: 'button', class: 'btn btn-sm', onClick: () => store.resetTransform(id) }, icon('reset', 14), 'Reset')

    const el = h(
      'div',
      { class: 'controls' },
      h('div', { class: 'fit-row' }, h('span', { class: 'field-label' }, 'Image fit'), fit.el, bgWrap),
      zoom.el,
      posX.el,
      posY.el,
      rotate.el,
      h('div', { class: 'controls-foot' }, note, reset),
    )

    function update() {
      const w = store.state.wallpapers[id]
      const t = w.transform
      const off = !w.asset
      el.classList.toggle('is-disabled', off)
      zoom.set(t.zoom * 100, off)
      posX.set(t.x, off)
      posY.set(t.y, off)
      rotate.set(t.rotate, off)
      fit.set(t.fit)
      fit.el.querySelectorAll('button').forEach((b) => (b.disabled = off))
      reset.disabled = off
      bg.disabled = off
      bg.value = t.background
      bgWrap.hidden = t.fit !== 'fit'
      if (!w.asset) {
        note.textContent = 'Add an image to adjust it. You can also drag it directly in the preview.'
        note.className = 'note'
        return
      }
      const scale = FW.effectiveScale(s.px.w, s.px.h, w.asset, t)
      if (scale > 1.05) {
        note.textContent = `Upscaled ${scale.toFixed(1)}× to fill the display — it may look soft. Use a larger source if you can.`
        note.className = 'note warn'
      } else {
        note.textContent = 'Tip: drag the image in the preview to reposition it.'
        note.className = 'note'
      }
    }
    update()
    return { el, update }
  }
})((window.FW = window.FW || {}))
