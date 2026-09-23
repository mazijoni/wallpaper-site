/**
 * Default wallpapers shown on the phone until the user adds their own (and loaded by
 * "Try this example"): the Maze mark on the cover screen, the full Maze_Development
 * logo on the inner screen — a close-up outside, the bigger picture inside.
 *
 * The files live in img/, so swapping the artwork is just replacing those images.
 */
(function (FW) {
  const paper = '#0d0b09'
  FW.demo = {
    sources: { cover: 'img/logo_2.png', inner: 'img/logo_3.png' },
    /** Placement used for the defaults (logos are shown whole, on the site's paper colour). */
    transforms: {
      cover: { ...FW.DEFAULT_TRANSFORM, fit: 'fit', zoom: 0.72, background: paper },
      inner: { ...FW.DEFAULT_TRANSFORM, fit: 'fit', zoom: 0.82, background: paper },
    },
    /** Fresh, independent assets (so removing one never affects the others). */
    async build() {
      const [cover, inner] = await Promise.all([
        FW.loadUrlAsset(FW.demo.sources.cover, 'logo_2.png'),
        FW.loadUrlAsset(FW.demo.sources.inner, 'logo_3.png'),
      ])
      return { cover, inner }
    },
  }
})((window.FW = window.FW || {}))
