/** DeviceInfo — small spec panel, rendered entirely from FW.DEVICE. */
(function (FW) {
  const { h } = FW.ui

  FW.DeviceInfo = function DeviceInfo() {
    const d = FW.DEVICE
    const screenBlock = (s) =>
      h(
        'div',
        { class: 'info-block' },
        h('h3', {}, s.label),
        h(
          'dl',
          {},
          h('div', {}, h('dt', {}, 'Display'), h('dd', {}, `${s.diagonalIn}″ ${s.panel}`)),
          h('div', {}, h('dt', {}, 'Aspect ratio'), h('dd', {}, `${s.aspect} (${(s.px.w / s.px.h).toFixed(3)}:1)`)),
          h('div', {}, h('dt', {}, 'Recommended'), h('dd', {}, `${s.px.w} × ${s.px.h} px`)),
          h('div', {}, h('dt', {}, 'Density'), h('dd', {}, `~${s.ppi} ppi`)),
        ),
      )

    return {
      el: h(
        'section',
        { class: 'card info', 'aria-labelledby': 'h-info' },
        h('header', { class: 'card-head' }, h('div', {}, h('h2', { id: 'h-info' }, d.name), h('p', { class: 'muted' }, 'Device information'))),
        h('div', { class: 'info-grid' }, screenBlock(d.screens.cover), screenBlock(d.screens.inner)),
        h(
          'dl',
          { class: 'info-body' },
          h('div', {}, h('dt', {}, 'Unfolded'), h('dd', {}, `${d.body.openWidthMm} × ${d.body.heightMm} × ${d.body.openThicknessMm} mm`)),
          h('div', {}, h('dt', {}, 'Folded'), h('dd', {}, `${d.body.closedWidthMm} × ${d.body.heightMm} × ${d.body.closedThicknessMm} mm`)),
        ),
        h('p', { class: 'note' }, 'Resolutions and body size are from Samsung’s published specs. Camera position and system-UI zones are estimates for the mockup and guides.'),
      ),
    }
  }
})((window.FW = window.FW || {}))
