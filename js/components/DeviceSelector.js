/** DeviceSelector — chooses the foldable whose dimensions drive the preview. */
(function (FW) {
  const { h } = FW.ui

  FW.DeviceSelector = function DeviceSelector() {
    const select = h(
      'select',
      { class: 'device-select', 'aria-label': 'Foldable phone model' },
      ...FW.DEVICE_OPTIONS.map((option) => h('option', { value: option.value }, option.label)),
    )
    select.value = FW.DEVICE_KEY
    select.addEventListener('change', () => {
      const url = new URL(window.location.href)
      url.searchParams.set('device', select.value)
      window.location.assign(url)
    })
    return { el: select }
  }
})((window.FW = window.FW || {}))