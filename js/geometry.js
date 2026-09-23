/**
 * Derives the 3D model geometry (in millimetres) from FW.DEVICE.
 *
 * Model: the phone has a fixed RIGHT half, a hinge spine, and a LEFT half that
 * swings over the front of the right half when folding. The cover display sits
 * on the back of that left half, so it faces the viewer once closed.
 */
(function (FW) {
  /** Design space: 1 mm of the real phone = U CSS px inside the 3D scene. */
  FW.U = 6

  const MM_PER_IN = 25.4
  const { body, screens } = FW.DEVICE

  const hinge = 2 * body.closedWidthMm - body.openWidthMm // hinge spine width (2.4 mm)
  const half = body.closedWidthMm - hinge // one half of the body (79.5 mm)
  const thickness = body.openThicknessMm
  const gap = body.closedThicknessMm - 2 * thickness // air gap between halves when closed

  function display(id) {
    const s = screens[id]
    const w = (s.px.w / s.ppi) * MM_PER_IN
    const h = (s.px.h / s.ppi) * MM_PER_IN
    return {
      wMm: w,
      hMm: h,
      // Distance from the LEFT edge of the body (open) / of the half (cover) to the display.
      bezelX: id === 'cover' ? (half - w) / 2 : (body.openWidthMm - w) / 2,
      bezelY: (body.heightMm - h) / 2,
    }
  }

  FW.geo = {
    openW: body.openWidthMm,
    closedW: body.closedWidthMm,
    height: body.heightMm,
    radius: body.cornerRadiusMm,
    hinge,
    half,
    thickness,
    gap,
    /** z of the hinge axis the left half swings around. */
    pivotZ: gap / 2,
    /** Horizontal shift (mm) that re-centres the phone once folded. */
    closedShift: -half / 2,
    cover: display('cover'),
    inner: display('inner'),
  }
})((window.FW = window.FW || {}))
