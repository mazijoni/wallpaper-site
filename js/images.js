/** Client-side image loading. Nothing here ever touches the network. */
(function (FW) {
  FW.ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
  const MAX_BYTES = 60 * 1024 * 1024
  let counter = 0

  function decode(url) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('That file could not be read as an image.'))
      img.src = url
    })
  }

  function toAsset(name, image, url) {
    return { id: 'wp-' + ++counter, name, image, width: image.naturalWidth, height: image.naturalHeight, url }
  }

  /** Decode a user file in the browser. Rejects with a human-readable message. */
  FW.loadWallpaperFile = async function (file) {
    if (!FW.ACCEPTED_TYPES.includes(file.type)) {
      throw new Error('Unsupported file type. Please use a PNG, JPG or WebP image.')
    }
    if (file.size > MAX_BYTES) throw new Error('That image is larger than 60 MB. Please use a smaller file.')
    const url = URL.createObjectURL(file)
    try {
      return toAsset(file.name, await decode(url), url)
    } catch (e) {
      URL.revokeObjectURL(url)
      throw e
    }
  }

  /** Turn an SVG string (the built-in example artwork) into an asset. */
  FW.loadSvgAsset = async function (svg, name) {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    return toAsset(name, await decode(url), url)
  }
})((window.FW = window.FW || {}))
