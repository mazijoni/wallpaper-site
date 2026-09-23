/** Tiny DOM helpers and reusable form controls (segmented control, slider, switch). */
(function (FW) {
  /** h('div', {class:'x', onClick: fn}, child, ...) */
  function h(tag, props, ...children) {
    const el = document.createElement(tag)
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue
      if (k === 'class') el.className = v
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
      else if (k === 'dataset') Object.assign(el.dataset, v)
      else if (k === 'html') el.innerHTML = v
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v)
      else if (k in el && typeof v !== 'string') el[k] = v
      else el.setAttribute(k, v === true ? '' : v)
    }
    append(el, children)
    return el
  }

  function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue
      el.append(c.nodeType ? c : document.createTextNode(String(c)))
    }
    return el
  }

  const ICONS = {
    upload: '<path d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"/>',
    replace: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>',
    trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 12h10l1-12M9 7V4h6v3"/>',
    reset: '<path d="M4 4v6h6M4.6 15a8 8 0 1 0 1.5-8.3L4 10"/>',
    download: '<path d="M12 4v12m0 0 5-5m-5 5-5-5M5 20h14"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    screens: '<rect x="2.5" y="6" width="12" height="12" rx="2"/><rect x="16.5" y="4" width="5" height="16" rx="1.6"/>',
    split: '<rect x="3" y="5" width="8" height="14" rx="2"/><rect x="13" y="5" width="8" height="14" rx="2"/>',
    fold: '<path d="M12 4v16M5 7l7 3-7 3zM19 7l-7 3 7 3z" stroke-linejoin="round"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  }

  function icon(name, size = 16) {
    return h('span', {
      class: 'icon',
      'aria-hidden': 'true',
      html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`,
    })
  }

  /** Radio-group style segmented control with arrow-key navigation. */
  function Segmented({ label, options, value, onChange, className = '' }) {
    const el = h('div', { class: 'seg ' + className, role: 'radiogroup', 'aria-label': label })
    const btns = options.map((o) =>
      h(
        'button',
        {
          type: 'button',
          role: 'radio',
          class: 'seg-btn',
          dataset: { value: o.value },
          title: o.title || null,
          onClick: () => onChange(o.value),
          onKeydown: (e) => {
            const i = options.findIndex((x) => x.value === o.value)
            let n = null
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % options.length
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + options.length) % options.length
            if (n == null) return
            e.preventDefault()
            onChange(options[n].value)
            btns[n].focus()
          },
        },
        o.icon ? icon(o.icon, 15) : null,
        h('span', { class: 'seg-label' }, o.label),
      ),
    )
    el.append(...btns)
    function set(v) {
      btns.forEach((b, i) => {
        const on = options[i].value === v
        b.setAttribute('aria-checked', String(on))
        b.tabIndex = on ? 0 : -1
      })
    }
    set(value)
    return { el, set }
  }

  let uid = 0

  /**
   * Range slider paired with a numeric field. `toPos` / `fromPos` let a slider use a
   * non-linear scale (zoom is logarithmic). Double-click the slider to reset.
   */
  function Slider({ label, min, max, step = 1, unit = '', decimals = 0, defaultValue, toPos, fromPos, onInput }) {
    const id = 'sl-' + ++uid
    const pos = toPos || ((v) => v)
    const val = fromPos || ((p) => p)
    const range = h('input', {
      type: 'range',
      id,
      class: 'range',
      min: pos(min),
      max: pos(max),
      step: toPos ? 'any' : step,
      'aria-label': label,
      title: 'Double-click to reset',
    })
    const num = h('input', { type: 'number', class: 'num', min, max, step, 'aria-label': label + ' value' })
    const clampV = (v) => Math.min(max, Math.max(min, v))

    range.addEventListener('input', () => onInput(clampV(val(parseFloat(range.value)))))
    range.addEventListener('dblclick', () => onInput(defaultValue))
    if (toPos) {
      // With a continuous scale, arrow keys need a sensible increment.
      range.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
        e.preventDefault()
        const dir = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 1
        const cur = parseFloat(num.value) || defaultValue
        onInput(clampV(cur + dir * step * (e.shiftKey ? 10 : 1)))
      })
    }
    num.addEventListener('change', () => {
      const v = parseFloat(num.value)
      if (!Number.isNaN(v)) onInput(clampV(v))
    })

    const el = h(
      'div',
      { class: 'slider' },
      h('label', { class: 'slider-label', for: id }, label),
      h('div', { class: 'slider-row' }, range, h('span', { class: 'num-wrap' }, num, unit ? h('span', { class: 'unit' }, unit) : null)),
    )
    function set(v, disabled) {
      range.value = pos(v)
      if (document.activeElement !== num) num.value = v.toFixed(decimals)
      range.disabled = num.disabled = !!disabled
    }
    return { el, set }
  }

  /** Accessible on/off switch. */
  function Switch({ label, checked, onChange, hint }) {
    const btn = h(
      'button',
      {
        type: 'button',
        role: 'switch',
        class: 'switch',
        'aria-checked': String(!!checked),
        title: hint || null,
        onClick: () => onChange(btn.getAttribute('aria-checked') !== 'true'),
      },
      h('span', { class: 'switch-track', 'aria-hidden': 'true' }, h('span', { class: 'switch-thumb' })),
      h('span', { class: 'switch-label' }, label),
    )
    return { el: btn, set: (v) => btn.setAttribute('aria-checked', String(!!v)) }
  }

  FW.ui = { h, icon, Segmented, Slider, Switch }
})((window.FW = window.FW || {}))
