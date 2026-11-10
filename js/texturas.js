/* Muestreo y transparencia de imágenes 3D, independientes de la resolución de pantalla. */
window.CF_TEXTURES = (() => {
  const T = THREE;
  const images = new Map();
  const alphaData = new WeakMap();
  const profiles = new Set(['pixel', 'nitida', 'suave']);
  const modes = new Set(['opaque', 'cutout', 'blend']);
  const powerOfTwo = n => n > 0 && (n & (n - 1)) === 0;

  function load(src) {
    if (!images.has(src)) {
      const pending = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }).catch(error => { images.delete(src); throw error; });
      images.set(src, pending);
    }
    return images.get(src);
  }

  function configure(texture, spec, capabilities, fallback = 'pixel') {
    const quality = profiles.has(spec?.cf_quality) ? spec.cf_quality : fallback;
    const img = texture.image;
    const mip = quality !== 'pixel' && !!img && (capabilities?.isWebGL2 || (powerOfTwo(img.width) && powerOfTwo(img.height)));
    texture.magFilter = quality === 'suave' ? T.LinearFilter : T.NearestFilter;
    texture.minFilter = mip ? (quality === 'suave' ? T.LinearMipmapLinearFilter : T.NearestMipmapLinearFilter) : texture.magFilter;
    texture.generateMipmaps = mip;
    texture.anisotropy = mip ? Math.max(1, Math.min(8, capabilities?.getMaxAnisotropy?.() || 1, Number(spec?.cf_anisotropy) || 8)) : 1;
    (texture.userData ||= {}).quality = quality;
    texture.needsUpdate = true;
    return texture;
  }

  function inspect(img) {
    if (alphaData.has(img)) return alphaData.get(img);
    const width = img.width, height = img.height;
    const scan = { width, height, mode: 'opaque', data: null, regions: new Map() };
    try {
      const cv = document.createElement('canvas');
      cv.width = width; cv.height = height;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const rgba = ctx.getImageData(0, 0, width, height).data;
      for (let i = 3; i < rgba.length; i += 4) {
        if (rgba[i] === 255) continue;
        scan.mode = 'cutout';
        if (rgba[i] > 0) { scan.mode = 'blend'; break; }
      }
      // Solo los atlas con alfa intermedio necesitan distinguir cada región.
      if (scan.mode === 'blend') {
        scan.data = new Uint8Array(width * height);
        for (let i = 0; i < scan.data.length; i++) scan.data[i] = rgba[i * 4 + 3];
      }
      cv.width = cv.height = 1;
    } catch (e) { scan.mode = 'cutout'; }
    alphaData.set(img, scan);
    return scan;
  }

  function mode(img, spec, uv, width = img.width, height = img.height) {
    if (modes.has(spec?.cf_alpha)) return spec.cf_alpha;
    const scan = inspect(img);
    if (!uv || !scan.data) return scan.mode;
    const [u0, v0, u1, v1] = uv;
    const x0 = Math.min(scan.width - 1, Math.max(0, Math.floor(Math.min(u0, u1) * scan.width / width)));
    const y0 = Math.min(scan.height - 1, Math.max(0, Math.floor(Math.min(v0, v1) * scan.height / height)));
    const x1 = Math.min(scan.width, Math.max(x0 + 1, Math.ceil(Math.max(u0, u1) * scan.width / width)));
    const y1 = Math.min(scan.height, Math.max(y0 + 1, Math.ceil(Math.max(v0, v1) * scan.height / height)));
    const key = `${x0},${y0},${x1},${y1}`;
    if (scan.regions.has(key)) return scan.regions.get(key);
    let result = 'opaque';
    outer: for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const a = scan.data[y * scan.width + x];
      if (a === 255) continue;
      result = 'cutout';
      if (a > 0) { result = 'blend'; break outer; }
    }
    scan.regions.set(key, result);
    return result;
  }

  function alphaOptions(mode) {
    return { transparent: mode === 'blend', depthWrite: mode !== 'blend', alphaTest: mode === 'opaque' ? 0 : mode === 'cutout' ? .5 : 1 / 255 };
  }

  function uvSize(data, texture) {
    return [Number(texture.uv_width) || data.resolution.width, Number(texture.uv_height) || data.resolution.height];
  }

  function textureIndex(textures, ref) {
    const index = Number(ref);
    if (Number.isInteger(index) && index >= 0 && index < textures.length) return index;
    return textures.findIndex(texture => texture.id === ref || texture.uuid === ref);
  }

  return { load, configure, mode, alphaOptions, uvSize, textureIndex };
})();
