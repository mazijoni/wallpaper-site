/**
 * Built-in black-and-white example: a close-up of an eye for the cover screen,
 * the full face that eye belongs to for the inner screen. Generated as SVG.
 */
(function (FW) {
  // Small deterministic PRNG so the artwork is identical every time.
  function rng(seed) {
    return function () {
      seed |= 0
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }
  const f = (n) => n.toFixed(1)

  const EYE_PATH = 'M-500 20 C-330 -260 260 -300 500 -20 C300 200 -290 240 -500 20 Z'

  /** Point + outward normal on a cubic Bezier (used for lashes). */
  function bez(p0, p1, p2, p3, t) {
    const u = 1 - t
    const x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]
    const y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0])
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1])
    const len = Math.hypot(dx, dy) || 1
    return { x, y, nx: dy / len, ny: -dx / len }
  }

  /** The eye, drawn in a local space ~1000 wide and centred on 0,0. `id` keeps defs unique. */
  function eye(id) {
    const r = rng(11)
    let fibers = ''
    for (let i = 0; i < 190; i++) {
      const a = (i / 190) * Math.PI * 2 + r() * 0.03
      const r0 = 74 + r() * 30
      const r1 = 150 + r() * 62
      const light = r() > 0.5
      fibers += `<line x1="${f(20 + Math.cos(a) * r0)}" y1="${f(-10 + Math.sin(a) * r0)}" x2="${f(20 + Math.cos(a) * r1)}" y2="${f(-10 + Math.sin(a) * r1)}" stroke="${light ? '#fff' : '#000'}" stroke-opacity="${f(0.16 + r() * 0.3)}" stroke-width="${f(1.5 + r() * 3)}"/>`
    }
    let veins = ''
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1
      const y0 = -40 + r() * 80
      const x0 = side * (300 + r() * 60)
      veins += `<path d="M${f(x0)} ${f(y0)} q${f(side * 60)} ${f(-20 + r() * 40)} ${f(side * (110 + r() * 60))} ${f(-30 + r() * 60)}" stroke="#000" stroke-opacity="0.22" stroke-width="2.4" fill="none"/>`
    }
    // Lashes along the upper lid.
    const P = [[-500, 20], [-330, -260], [260, -300], [500, -20]]
    let lashes = ''
    for (let i = 0; i < 70; i++) {
      const t = 0.06 + (i / 69) * 0.9
      const p = bez(P[0], P[1], P[2], P[3], t)
      const len = 46 + Math.sin(t * Math.PI) * 60 + r() * 26
      const bend = (t > 0.5 ? 1 : -1) * 22 * (0.4 + r() * 0.6)
      lashes += `<path d="M${f(p.x)} ${f(p.y)} q${f(p.nx * len * 0.5 + bend * 0.4)} ${f(p.ny * len * 0.5)} ${f(p.nx * len + bend)} ${f(p.ny * len)}" stroke="#050505" stroke-width="${f(4 + r() * 3)}" stroke-linecap="round" fill="none"/>`
    }
    return `
    <defs>
      <clipPath id="${id}-clip"><path d="${EYE_PATH}"/></clipPath>
      <radialGradient id="${id}-sclera" cx="50%" cy="50%" r="55%">
        <stop offset="0" stop-color="#f4f4f4"/><stop offset="0.55" stop-color="#d6d6d6"/><stop offset="1" stop-color="#6b6b6b"/>
      </radialGradient>
      <radialGradient id="${id}-iris" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#151515"/><stop offset="0.28" stop-color="#9a9a9a"/>
        <stop offset="0.55" stop-color="#c9c9c9"/><stop offset="0.85" stop-color="#4d4d4d"/><stop offset="1" stop-color="#0d0d0d"/>
      </radialGradient>
      <linearGradient id="${id}-lid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${id}-clip)">
      <rect x="-520" y="-320" width="1040" height="600" fill="url(#${id}-sclera)"/>
      ${veins}
      <circle cx="20" cy="-10" r="218" fill="url(#${id}-iris)"/>
      ${fibers}
      <circle cx="20" cy="-10" r="80" fill="#000"/>
      <circle cx="20" cy="-10" r="217" fill="none" stroke="#000" stroke-width="14" stroke-opacity="0.7"/>
      <ellipse cx="-38" cy="-72" rx="40" ry="32" fill="#fff" fill-opacity="0.96"/>
      <ellipse cx="72" cy="42" rx="15" ry="11" fill="#fff" fill-opacity="0.6"/>
      <rect x="-520" y="-320" width="1040" height="250" fill="url(#${id}-lid)"/>
    </g>
    ${lashes}
    <path d="${EYE_PATH}" fill="none" stroke="#000" stroke-width="11" stroke-linejoin="round"/>
    <path d="M-470 -30 C-320 -350 290 -390 480 -70" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"/>`
  }

  const GRAIN = (id) => `
    <filter id="${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>`

  function coverSvg() {
    const W = 1248
    const H = 1972
    const r = rng(5)
    let hair = ''
    for (let i = 0; i < 90; i++) {
      const x = 80 + r() * 1090
      const y = 250 + r() * 130
      hair += `<path d="M${f(x)} ${f(y)} q${f(30 + r() * 30)} ${f(-24 - r() * 12)} ${f(80 + r() * 60)} ${f(-8 - r() * 26)}" stroke="#050505" stroke-opacity="${f(0.55 + r() * 0.4)}" stroke-width="${f(4 + r() * 6)}" stroke-linecap="round" fill="none"/>`
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${GRAIN('gc')}
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2a2a"/><stop offset="0.28" stop-color="#7d7d7d"/>
      <stop offset="0.5" stop-color="#9a9a9a"/><stop offset="0.75" stop-color="#5c5c5c"/><stop offset="1" stop-color="#1c1c1c"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="50%" r="75%">
      <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.75"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#skin)"/>
  <path d="M-40 520 C300 400 900 400 1290 540" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="46" stroke-linecap="round"/>
  <path d="M-40 1490 C300 1590 900 1600 1290 1480" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="40" stroke-linecap="round"/>
  ${hair}
  <g transform="translate(624 986) scale(1.16)">${eye('ce')}</g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" filter="url(#gc)" opacity="0.14" style="mix-blend-mode:overlay"/>
</svg>`
  }

  function innerSvg() {
    const W = 2448
    const H = 1848
    const r = rng(9)
    let hair = ''
    for (let i = 0; i < 260; i++) {
      const a = Math.PI + r() * Math.PI
      const rr = 640 + r() * 90
      const x = 1224 + Math.cos(a) * rr * 0.86
      const y = 900 + Math.sin(a) * rr * 1.15
      hair += `<path d="M${f(x)} ${f(y)} q${f(-20 + r() * 40)} ${f(-50 - r() * 60)} ${f(-40 + r() * 80)} ${f(-90 - r() * 80)}" stroke="#fff" stroke-opacity="${f(0.04 + r() * 0.12)}" stroke-width="${f(2 + r() * 3)}" fill="none"/>`
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${GRAIN('gi')}
    <radialGradient id="bg" cx="50%" cy="46%" r="70%"><stop offset="0" stop-color="#242424"/><stop offset="1" stop-color="#030303"/></radialGradient>
    <radialGradient id="head" cx="42%" cy="38%" r="68%">
      <stop offset="0" stop-color="#f1f1f1"/><stop offset="0.5" stop-color="#b4b4b4"/><stop offset="0.85" stop-color="#4a4a4a"/><stop offset="1" stop-color="#181818"/>
    </radialGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0.45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.62"/>
    </linearGradient>
    <linearGradient id="neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.85"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <clipPath id="headclip"><path d="M1224 170 C1566 170 1746 500 1736 800 C1726 1130 1530 1470 1224 1596 C918 1470 722 1130 712 800 C702 500 882 170 1224 170 Z"/></clipPath>
    <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2b2b"/><stop offset="1" stop-color="#050505"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <path d="M1052 1400 C1060 1520 1050 1600 1000 1700 L1448 1700 C1398 1600 1388 1520 1396 1400 Z" fill="#8a8a8a"/>
  <path d="M1052 1400 C1060 1520 1050 1600 1000 1700 L1448 1700 C1398 1600 1388 1520 1396 1400 Z" fill="url(#neck)"/>
  <path d="M520 1848 C640 1660 900 1650 1224 1672 C1548 1650 1808 1660 1928 1848 Z" fill="url(#cloth)"/>
  <path d="M1224 170 C1566 170 1746 500 1736 800 C1726 1130 1530 1470 1224 1596 C918 1470 722 1130 712 800 C702 500 882 170 1224 170 Z" fill="url(#head)"/>
  <g clip-path="url(#headclip)">
    <path d="M700 700 C760 190 1700 190 1750 700 C1620 470 1400 380 1224 380 C1040 380 830 470 700 700 Z" fill="#050505"/>
    ${hair}
    <rect x="700" y="160" width="1100" height="1500" fill="url(#side)"/>
  </g>
  <path d="M860 610 C960 560 1090 560 1150 600" stroke="#050505" stroke-width="30" stroke-linecap="round" fill="none"/>
  <path d="M1300 600 C1360 560 1490 560 1590 610" stroke="#050505" stroke-width="30" stroke-linecap="round" fill="none"/>
  <g transform="translate(1010 742) scale(0.31)">${eye('fe')}</g>
  <g transform="translate(1438 742) scale(0.31)">${eye('fe2')}</g>
  <path d="M1224 760 C1200 900 1180 1000 1160 1090 C1190 1130 1260 1130 1290 1090" stroke="#000" stroke-opacity="0.35" stroke-width="16" stroke-linecap="round" fill="none"/>
  <ellipse cx="1180" cy="1110" rx="20" ry="11" fill="#000" fill-opacity="0.7"/><ellipse cx="1268" cy="1110" rx="20" ry="11" fill="#000" fill-opacity="0.7"/>
  <path d="M1084 1290 C1150 1262 1200 1274 1224 1282 C1250 1274 1300 1262 1370 1290 C1330 1350 1120 1350 1084 1290 Z" fill="#161616"/>
  <path d="M1090 1292 C1160 1300 1290 1300 1364 1292" stroke="#000" stroke-width="7" fill="none"/>
  <path d="M1224 1282 L1224 1300" stroke="#000" stroke-width="7"/>
  <path d="M1140 1370 C1200 1392 1260 1392 1310 1370" stroke="#000" stroke-opacity="0.3" stroke-width="18" stroke-linecap="round" fill="none"/>
  <rect width="${W}" height="${H}" filter="url(#gi)" opacity="0.13" style="mix-blend-mode:overlay"/>
</svg>`
  }

  FW.demo = {
    svg: { cover: coverSvg, inner: innerSvg },
    /** Fresh, independent assets (so removing one never affects the others). */
    async build() {
      const [cover, inner] = await Promise.all([
        FW.loadSvgAsset(coverSvg(), 'example-eye.svg'),
        FW.loadSvgAsset(innerSvg(), 'example-face.svg'),
      ])
      return { cover, inner }
    },
  }
})((window.FW = window.FW || {}))
