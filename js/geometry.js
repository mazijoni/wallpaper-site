/**
 * Derives the 3D model geometry (in millimetres) from FW.DEVICE.
 *
 * Model: the body splits into a fixed BASE half, a hinge spine, and a swinging LEAD
 * half that folds 180° over the front of the base half. Two hinge orientations share
 * this same model, just rotated 90°:
 *   - 'book' (Fold-style): the hinge is a vertical line. WIDTH is the axis that
 *     changes between open/closed (the "span"); HEIGHT stays constant (the "cross").
 *   - 'flip' (clamshell-style): the hinge is a horizontal line. HEIGHT is the span,
 *     WIDTH is the cross. The lead half is the TOP (it swings down over the bottom).
 * The cover display sits on the back of the lead half, so it faces the viewer once closed.
 */
(function (FW) {
  /** Design space: 1 mm of the real phone = U CSS px inside the 3D scene. */
  FW.U = 6

  const MM_PER_IN = 25.4
  const { body, screens } = FW.DEVICE
  const axis = body.foldAxis === 'flip' ? 'flip' : 'book'
  const BOOK = axis === 'book'

  // span: the dimension that differs open vs. closed (splits into half + hinge + half).
  // cross: the dimension that stays constant across the fold.
  const openSpan = BOOK ? body.openWidthMm : body.openHeightMm
  const closedSpan = BOOK ? body.closedWidthMm : body.closedHeightMm
  const cross = BOOK ? body.openHeightMm : body.openWidthMm

  // Hinge spine width, derived from open/closed span. Some published closed-state
  // measurements come in under half the open span (rounding, or a hinge that closes
  // flush) which would make this negative — an invalid CSS dimension. Floor it to a
  // sliver instead; half is then derived from openSpan so half+hinge+half still adds
  // up exactly (closedSpan itself is still used as-is for the fold-closed scale target).
  const hinge = Math.max(openSpan * 0.01, 2 * closedSpan - openSpan)
  const half = (openSpan - hinge) / 2
  const thickness = body.openThicknessMm
  const gap = body.closedThicknessMm - 2 * thickness // air gap between halves when closed

  function display(id) {
    const s = screens[id]
    const w = (s.px.w / s.ppi) * MM_PER_IN
    const h = (s.px.h / s.ppi) * MM_PER_IN
    // spanSize: the box this display is centred within, measured along the span axis
    // (the lead half for the cover display; the full open body for the inner display).
    const spanSize = id === 'cover' ? half : openSpan
    const leadOffset = (spanSize - (BOOK ? w : h)) / 2
    const crossOffset = (cross - (BOOK ? h : w)) / 2
    return {
      wMm: w,
      hMm: h,
      // Distance from the left / top edge of that box to the display — always
      // expressed as plain (X, Y) offsets, already resolved for either axis.
      bezelX: BOOK ? leadOffset : crossOffset,
      bezelY: BOOK ? crossOffset : leadOffset,
    }
  }

  FW.geo = {
    axis,
    openSpan,
    closedSpan,
    cross,
    hinge,
    half,
    thickness,
    gap,
    radius: body.cornerRadiusMm,
    /** z of the hinge axis the lead half swings around. */
    pivotZ: gap / 2,
    /** Shift (mm, along the span axis) that re-centres the phone once folded. */
    closedShift: -half / 2,
    cover: display('cover'),
    inner: display('inner'),
  }
})((window.FW = window.FW || {}))
