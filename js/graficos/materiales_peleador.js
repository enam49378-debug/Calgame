// ====================================================================
// MATERIALES TOON, CONTORNOS Y MODELOS DE PELEADORES
// ====================================================================
// Texturas de skin estilo Minecraft, retratos de cabeza, shader toon con
// rim light `ZZZ_U`, outlines invertidos y constructores de rigs (`buildModel`,
// `buildJesulutoModel`, `buildFighterModel`).
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearMaterialesPeleador = function crearMaterialesPeleador(dep) {
  const { V3, noiseRect, shade, ZZZ_U } = dep;

  // ================= Skins estilo Minecraft =================
  const faceRects = (u, v, w, h, d) => ({ right: [u, v + d, d, h], front: [u + d, v + d, w, h], left: [u + d + w, v + d, d, h], back: [u + 2 * d + w, v + d, w, h], top: [u + d, v, w, d], bottom: [u + d + w, v, w, d] });
  function makeSkinCanvas(d) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d', { willReadFrequently: true });
    const N = (x, y, w, h, col, amt = 16) => noiseRect(g, x, y, w, h, col, amt);
    const P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const SIDES = ['front', 'left', 'right', 'back'];
    const H = faceRects(0, 0, 8, 8, 8);
    for (const k in H) N(...H[k], d.skin, 10);
    N(...H.top, d.hair); N(...H.back, d.hair);
    for (const k of ['front', 'left', 'right']) N(H[k][0], H[k][1], 8, 2, d.hair);
    N(H.left[0] + 4, H.left[1] + 2, 4, 4, d.hair); N(H.right[0], H.right[1] + 2, 4, 4, d.hair);
    if (d.longHair) { N(H.left[0], H.left[1] + 2, 8, 6, d.hair); N(H.right[0], H.right[1] + 2, 8, 6, d.hair); N(8, 10, 1, 6, d.hair); N(15, 10, 1, 6, d.hair); }
    const fx = 8, fy = 8, brow = shade(d.hair, -.3);
    P(fx, fy + 2, d.hair); P(fx + 7, fy + 2, d.hair); P(fx + 3, fy + 2, d.hair);
    P(fx + 1, fy + 3, brow); P(fx + 2, fy + 3, brow); P(fx + 5, fy + 3, brow); P(fx + 6, fy + 3, brow);
    P(fx + 1, fy + 4, '#ffffff'); P(fx + 2, fy + 4, d.eye); P(fx + 5, fy + 4, d.eye); P(fx + 6, fy + 4, '#ffffff');
    P(fx + 3, fy + 5, shade(d.skin, -.14)); P(fx + 4, fy + 5, shade(d.skin, -.14));
    g.fillStyle = shade(d.skin, -.4); g.fillRect(fx + 3, fy + 6, 2, 1);
    if (d.beard) { N(fx + 1, fy + 6, 6, 2, d.beard, 10); N(fx, fy + 5, 1, 3, d.beard, 10); N(fx + 7, fy + 5, 1, 3, d.beard, 10); P(fx + 3, fy + 6, shade(d.skin, -.4)); P(fx + 4, fy + 6, shade(d.skin, -.4)); }
    if (d.mask) { N(fx, fy + 5, 8, 3, d.mask, 8); N(H.left[0], H.left[1] + 5, 8, 3, d.mask, 8); N(H.right[0], H.right[1] + 5, 8, 3, d.mask, 8); }
    if (d.scar) { P(fx + 6, fy + 2, d.scar); P(fx + 6, fy + 3, d.scar); P(fx + 5, fy + 5, d.scar); }
    const O = faceRects(32, 0, 8, 8, 8);
    if (d.spiky) {
      N(...O.top, shade(d.hair, .1));
      for (const k of SIDES) { const [x, y] = O[k]; for (let i = 0; i < 8; i++) { P(x + i, y, d.hair); if (i % 2 === 0) P(x + i, y + 1, shade(d.hair, .1)); } }
      N(O.back[0], O.back[1], 8, 5, d.hair);
    }
    if (d.longHair) { N(...O.top, shade(d.hair, .06)); const [x, y] = O.back; N(x, y, 8, 8, d.hair, 12); for (const k of ['left', 'right']) { const [lx, ly] = O[k]; N(lx, ly, 8, 1, d.hair, 10); } }
    if (d.band) { for (const k of SIDES) { const [x, y] = O[k]; N(x, y + 2, 8, 1, d.band, 10); } P(O.back[0] + 3, O.back[1] + 3, d.band); P(O.back[0] + 4, O.back[1] + 4, d.band); }
    if (d.goggles) { for (const k of SIDES) { const [x, y] = O[k]; N(x, y + 2, 8, 1, '#30343b', 6); } const [x, y] = O.front; [1, 2, 5, 6].forEach(i => P(x + i, y + 2, d.goggles)); }
    if (d.crown) { for (const k of SIDES) { const [x, y] = O[k]; N(x, y, 8, 1, d.crown, 8); P(x + 1, y + 1, d.crown); P(x + 4, y + 1, d.crown); P(x + 6, y + 1, d.crown); } }
    const T = faceRects(16, 16, 8, 12, 4);
    for (const k in T) N(...T[k], d.shirt, 14);
    if (d.open) { const [x, y] = T.front; N(x + 3, y, 2, 9, d.open, 10); }
    if (d.belt) for (const k of SIDES) { const [x, y, w] = T[k]; N(x, y + 9, w, 1, d.belt, 8); }
    if (d.bolt) { const [x, y] = T.front; [[4, 1], [3, 2], [3, 3], [4, 3], [5, 3], [4, 4], [4, 5], [3, 6]].forEach(([i, j]) => P(x + i, y + j, d.bolt)); }
    if (d.flame) { const [x, y] = T.front; [[3, 6], [4, 6], [2, 5], [3, 5], [4, 5], [5, 5], [3, 4], [4, 3], [5, 4], [3, 7], [4, 7]].forEach(([i, j]) => P(x + i, y + j, j > 5 ? '#ffd54f' : d.flame)); }
    if (d.snow) { const [x, y] = T.front; [[4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [2, 4], [3, 4], [5, 4], [6, 4], [3, 3], [5, 5], [5, 3], [3, 5]].forEach(([i, j]) => P(x + i, y + j, d.snow)); }
    if (d.straps) { const [x, y] = T.front; for (let j = 0; j < 9; j++) { P(x + 1 + (j > 4 ? 1 : 0), y + j, d.straps); P(x + 6 - (j > 4 ? 1 : 0), y + j, d.straps); } }
    if (d.scarf) {
      for (const k of SIDES) { const [x, y, w] = T[k]; N(x, y, w, 2, d.scarf, 10); }
      const J = faceRects(16, 32, 8, 12, 4);
      for (const k of SIDES) { const [x, y, w] = J[k]; N(x, y, w, 2, shade(d.scarf, .08), 10); }
      N(J.back[0] + 5, J.back[1] + 2, 2, 6, d.scarf, 10);
    }
    if (d.longHair) { const J = faceRects(16, 32, 8, 12, 4); N(J.back[0], J.back[1], 8, 5, d.hair, 12); }
    const arm = (u, v) => {
      const A = faceRects(u, v, 4, 12, 4);
      for (const k in A) N(...A[k], d.skin, 10);
      for (const k of SIDES) { const [x, y] = A[k]; if (d.sleeve) N(x, y, 4, d.sleeve, d.shirt, 14); if (d.glove) N(x, y + 9, 4, 3, d.glove, 10); if (d.band2) N(x, y + 7, 4, 1, d.band2, 6); }
      N(...A.top, d.sleeve ? d.shirt : d.skin, 14); N(...A.bottom, d.glove || d.skin, 10);
    };
    arm(40, 16); arm(32, 48);
    const leg = (u, v) => {
      const L = faceRects(u, v, 4, 12, 4);
      for (const k in L) N(...L[k], d.pants, 12);
      for (const k of SIDES) { const [x, y] = L[k]; N(x, y + 10, 4, 2, d.shoes, 8); }
      N(...L.bottom, d.shoes, 8);
    };
    leg(0, 16); leg(16, 48);
    return c;
  }
  function normalizeSkin(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    if (w < 64 || (h !== w && h !== w / 2)) return null;
    const c = document.createElement('canvas'); c.width = 64; c.height = h === w ? 64 : 32;
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 64, c.height);
    return c;
  }
  function detectSlim(c) {
    if (c.height !== 64) return false;
    const d = c.getContext('2d', { willReadFrequently: true }).getImageData(54, 20, 2, 12).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return false;
    return true;
  }
  function headPortrait(skin, out) {
    const c = out || document.createElement('canvas'); c.width = 8; c.height = 8;
    const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 8, 8);
    g.drawImage(skin, 8, 8, 8, 8, 0, 0, 8, 8); g.drawImage(skin, 40, 8, 8, 8, 0, 0, 8, 8);
    c.classList.add('px'); return c;
  }

  // ================= Modelo del jugador (1px = 1/16) =================
  const PX = 1 / 16;
  // sombreado toon de 4 tonos y contorno cómic dinámico por distancia para los personajes
  const TOON_GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([55, 128, 208, 255]), 4, 1, THREE.LuminanceFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
  const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x0c0e1c, side: THREE.BackSide });
  OUTLINE_MAT.onBeforeCompile = shader => {
    shader.uniforms.uZzz = ZZZ_U.on;
    shader.uniforms.uBeta = ZZZ_U.beta;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec3 aOutlineOffset;\nuniform float uZzz;\nuniform float uBeta;')
      .replace('#include <project_vertex>', `
        vec4 olBase = vec4( transformed, 1.0 );
        #ifdef USE_INSTANCING
          olBase = instanceMatrix * olBase;
        #endif
        olBase = modelViewMatrix * olBase;
        float olDist = max(0.4, -olBase.z);
        float olBetaGain = mix(0.76, 1.38, smoothstep(1.8, 12.0, olDist)) * mix(1.0, 0.94, uZzz);
        float olGain = mix(1.42, olBetaGain, uBeta);
        transformed += aOutlineOffset * olGain;
        #include <project_vertex>
      `);
  };
  OUTLINE_MAT.customProgramCacheKey = () => 'cf-outline-zzz-v2';

  function addOutlineOffset(geo, offset) {
    const posAttr = geo.attributes.position, nrmAttr = geo.attributes.normal;
    if (!posAttr || !nrmAttr) return geo;
    const count = posAttr.count, map = new Map(), q = x => Math.round(x * 1e4);
    for (let i = 0; i < count; i++) {
      const nx = nrmAttr.getX(i), ny = nrmAttr.getY(i), nz = nrmAttr.getZ(i);
      const len = Math.hypot(nx, ny, nz) || 1;
      const ux = nx / len, uy = ny / len, uz = nz / len;
      const key = q(posAttr.getX(i)) + ',' + q(posAttr.getY(i)) + ',' + q(posAttr.getZ(i));
      let arr = map.get(key);
      if (!arr) { arr = []; map.set(key, arr); }
      let dup = false;
      for (let j = 0; j < arr.length; j += 3) {
        if (arr[j] * ux + arr[j + 1] * uy + arr[j + 2] * uz > 0.98) { dup = true; break; }
      }
      if (!dup) arr.push(ux, uy, uz);
    }
    const out = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const key = q(posAttr.getX(i)) + ',' + q(posAttr.getY(i)) + ',' + q(posAttr.getZ(i));
      const arr = map.get(key);
      let sx = 0, sy = 0, sz = 0;
      for (let j = 0; j < arr.length; j += 3) { sx += arr[j]; sy += arr[j + 1]; sz += arr[j + 2]; }
      out[i * 3] = sx * offset; out[i * 3 + 1] = sy * offset; out[i * 3 + 2] = sz * offset;
    }
    geo.setAttribute('aOutlineOffset', new THREE.BufferAttribute(out, 3));
    return geo;
  }

  function boxUV(w, h, d, u, v, th, inflate) {
    const geo = new THREE.BoxGeometry((w + inflate) * PX, (h + inflate) * PX, (d + inflate) * PX);
    const R = faceRects(u, v, w, h, d);
    const order = [R.left, R.right, R.top, R.bottom, R.front, R.back];
    const uv = geo.attributes.uv, e = 0.02;
    for (let fi = 0; fi < 6; fi++) {
      const [x0, y0, fw, fh] = order[fi];
      for (let k = 0; k < 4; k++) {
        const i = fi * 4 + k, a = uv.getX(i), b = uv.getY(i);
        uv.setXY(i, (x0 + e + a * (fw - 2 * e)) / 64, 1 - (y0 + e + (1 - b) * (fh - 2 * e)) / th);
      }
    }
    uv.needsUpdate = true;
    return geo;
  }
  function fighterToonMaterial(map, alpha = 'opaque', side = THREE.FrontSide, extra = {}) {
    const opts = typeof alpha === 'number'
      ? { gradientMap: TOON_GRAD, alphaTest: alpha, side, emissive: 0x000000 }
      : { gradientMap: TOON_GRAD, ...CF_TEXTURES.alphaOptions(alpha), side, emissive: 0x000000 };
    if (map) opts.map = map;
    if (extra.color !== undefined) opts.color = extra.color;
    if (extra.polygonOffset) {
      opts.polygonOffset = true;
      opts.polygonOffsetFactor = extra.polygonOffsetFactor ?? -2;
      opts.polygonOffsetUnits = extra.polygonOffsetUnits ?? -2;
    }
    const specLevel = extra.spec !== undefined ? extra.spec : 0.26;
    const mat = new THREE.MeshToonMaterial(opts);
    mat.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, {
        uZzz: ZZZ_U.on,
        uZzzBeta: ZZZ_U.beta,
        uZzzNight: ZZZ_U.night,
        uZzzSunset: ZZZ_U.sunset,
        uZzzRim: ZZZ_U.rimCol,
        uZzzWarm: ZZZ_U.rimWarm,
        uZzzShadow: ZZZ_U.shadowTint,
        uZzzSunDir: ZZZ_U.sunDir,
        uZzzKeyDir: ZZZ_U.keyDir,
        uZzzSpec: { value: specLevel },
      });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vZzzFN;')
        .replace('#include <project_vertex>', `
          vec3 zLocalN = objectNormal;
          #ifdef USE_INSTANCING
            zLocalN = mat3(instanceMatrix) * zLocalN;
          #endif
          vZzzFN = normalize(mat3(modelMatrix) * zLocalN);
          #include <project_vertex>
        `);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vZzzFN;
uniform float uZzz;
uniform float uZzzBeta;
uniform float uZzzNight;
uniform float uZzzSunset;
uniform vec3 uZzzRim;
uniform vec3 uZzzWarm;
uniform vec3 uZzzShadow;
uniform vec3 uZzzSunDir;
uniform vec3 uZzzKeyDir;
uniform float uZzzSpec;`)
        .replace('#include <fog_fragment>', `
          vec3 zV = normalize(vViewPosition);
          vec3 zN = normalize(vNormal);
          float zNdotV = clamp(dot(zN, zV), 0.0, 1.0);
          if (uZzz > 0.5) {
            if (uZzzBeta > 0.5) {
              vec3 zKeyV = normalize((viewMatrix * vec4(uZzzKeyDir, 0.0)).xyz);
              float zNdotL = dot(zN, zKeyV);
              float zSunFacing = clamp(zNdotL * 0.5 + 0.5, 0.0, 1.0);
              float diffLum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));

              // 1. Terminador cromático ZZZ (transición viva en el corte luz->sombra)
              float zTermBand = smoothstep(-0.20, 0.04, zNdotL) * (1.0 - smoothstep(0.05, 0.40, zNdotL));
              float zWarmth = clamp((diffuseColor.r - diffuseColor.b) * 1.4 + 0.35, 0.25, 1.0);
              vec3 zTermCol = mix(vec3(1.02, 0.52, 0.36), vec3(0.46, 0.62, 1.12), uZzzNight * 0.85);
              gl_FragColor.rgb += diffuseColor.rgb * zTermCol * zTermBand * zWarmth * smoothstep(0.04, 0.32, diffLum) * 0.28;

              // 2. Separación superior / oclusión inferior de planos
              float zTopSheen = smoothstep(0.55, 0.90, clamp(vZzzFN.y * 0.5 + 0.5, 0.0, 1.0));
              float zUnderShade = smoothstep(-0.15, -0.75, vZzzFN.y);
              gl_FragColor.rgb *= 1.0 + 0.07 * zTopSheen * zSunFacing - 0.14 * zUnderShade;

              // 3. Especular cel anime (metales/armas/visores fuertes, ropa/piel sutil)
              vec3 zH = normalize(zKeyV + zV);
              float zNdotH = max(dot(zN, zH), 0.0);
              float zSpecCore = smoothstep(0.85, 0.92, zNdotH) * smoothstep(0.0, 0.26, zNdotL);
              float zSpecBroad = smoothstep(0.58, 0.78, zNdotH) * smoothstep(0.04, 0.35, zNdotL) * 0.22;
              vec3 zSpecCol = mix(vec3(1.0, 0.96, 0.88), uZzzRim, uZzzNight * 0.65);
              gl_FragColor.rgb += zSpecCol * (zSpecCore + zSpecBroad) * uZzzSpec * (0.58 - 0.16 * uZzzNight);

              // 4. Doble rim light nítido de silueta (sin manchar caras planas)
              float zRimMask = smoothstep(0.56, 0.86, 1.0 - zNdotV);
              vec3 zRimCool = uZzzRim * (1.0 - smoothstep(0.28, 0.72, zSunFacing)) * (0.42 + uZzzNight * 0.26);
              vec3 zRimSun = mix(uZzzWarm, uZzzRim, uZzzNight * 0.45) * smoothstep(0.42, 0.88, zSunFacing) * (0.44 + uZzzSunset * 0.14);
              gl_FragColor.rgb += (zRimCool + zRimSun) * zRimMask;

              // 5. Piso de sombra índigo limpio (mantiene detalle en ropa oscura)
              vec3 zFloorTint = mix(vec3(0.32, 0.35, 0.52), uZzzShadow * 0.96, 0.68);
              gl_FragColor.rgb = max(gl_FragColor.rgb, diffuseColor.rgb * zFloorTint);
            } else {
              float zSunFacing = clamp(dot(normalize(vZzzFN), normalize(uZzzSunDir)) * 0.5 + 0.5, 0.0, 1.0);
              float zRimMask = smoothstep(0.42, 0.72, 1.0 - zNdotV);
              vec3 zRimColor = mix(uZzzRim, uZzzWarm, smoothstep(0.35, 0.85, zSunFacing));
              gl_FragColor.rgb += zRimColor * zRimMask * (0.44 + uZzzNight * 0.22);
              float zTopSheen = smoothstep(0.55, 0.85, clamp(vZzzFN.y * 0.5 + 0.5, 0.0, 1.0)) * smoothstep(0.50, 0.75, zSunFacing);
              gl_FragColor.rgb += gl_FragColor.rgb * 0.08 * zTopSheen;
              gl_FragColor.rgb = max(gl_FragColor.rgb, diffuseColor.rgb * mix(vec3(0.34, 0.36, 0.54), uZzzShadow * 0.96, 0.65));
            }
          } else {
            float chRim = pow(1.0 - zNdotV, 2.6);
            gl_FragColor.rgb += vec3(0.55, 0.78, 1.0) * chRim * 0.32;
            gl_FragColor.rgb = max(gl_FragColor.rgb, diffuseColor.rgb * vec3(0.32, 0.34, 0.48));
          }
          #include <fog_fragment>
        `);
    };
    mat.customProgramCacheKey = () => 'cf-fighter-zzz-v2-' + alpha + '-' + side + '-' + (map ? 'm' : 'c');
    return mat;
  }
  function buildModel(skin, slim, parent) {
    const tex = new THREE.CanvasTexture(skin);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const th = skin.height, legacy = th === 32, aw = slim ? 3 : 4;
    const base = fighterToonMaterial(tex, 'opaque', THREE.FrontSide, { spec: 0.22 });
    const over = fighterToonMaterial(tex, 'cutout', THREE.DoubleSide, { spec: 0.34 });
    const skinMode = CF_TEXTURES.mode(skin);
    const blend = skinMode === 'blend' ? fighterToonMaterial(tex, 'blend', THREE.FrontSide, { spec: 0.28 }) : null;
    const root = new THREE.Group(), inner = new THREE.Group(), torso = new THREE.Group();
    inner.position.y = 16 * PX; root.add(inner);
    torso.position.y = -4 * PX; inner.add(torso);
    const part = (par, w, h, d, u, v, ou, ov, offY, inflate) => {
      const geo = addOutlineOffset(boxUV(w, h, d, u, v, th, 0), (w === 8 && h === 8 ? 0.42 : 0.36) * PX);
      const m = new THREE.Mesh(geo, base); m.position.y = offY * PX; m.castShadow = true; par.add(m);
      const ol = new THREE.Mesh(geo, OUTLINE_MAT);
      m.add(ol);
      if (ou != null) {
        const semi = blend && CF_TEXTURES.mode(skin,null,[ou,ov,ou+2*w+2*d,ov+h+d]) === 'blend';
        const oGeo = boxUV(w, h, d, ou, ov, th, inflate);
        if (!semi) addOutlineOffset(oGeo, 0.30 * PX);
        const o = new THREE.Mesh(oGeo, semi ? blend : over);
        o.position.y = offY * PX;
        if (!semi) o.add(new THREE.Mesh(oGeo, OUTLINE_MAT));
        par.add(o);
      }
    };
    const pivot = (par, x, y) => { const g = new THREE.Group(); g.position.set(x * PX, y * PX, 0); par.add(g); return g; };
    part(torso, 8, 12, 4, 16, 16, legacy ? null : 16, 32, 6, 0.5);
    const head = pivot(torso, 0, 12); part(head, 8, 8, 8, 0, 0, 32, 0, 4, 1);
    const ax = 4 + aw / 2;
    const armR = pivot(torso, -ax, 10); part(armR, aw, 12, 4, 40, 16, legacy ? null : 40, 32, -4, 0.5);
    const armL = pivot(torso, ax, 10); part(armL, aw, 12, 4, legacy ? 40 : 32, legacy ? 16 : 48, legacy ? null : 48, 48, -4, 0.5);
    const legR = pivot(inner, -2, -4); part(legR, 4, 12, 4, 0, 16, legacy ? null : 0, 32, -6, 0.5);
    const legL = pivot(inner, 2, -4); part(legL, 4, 12, 4, legacy ? 0 : 16, legacy ? 16 : 48, legacy ? null : 0, 48, -6, 0.5);
    // agarre en la mano derecha y soporte en la espalda para armas
    const hand = pivot(armR, 0, -10), gripRot = new THREE.Group(); hand.add(gripRot);
    const backM = new THREE.Group(); backM.position.set(0, 6 * PX, -2.9 * PX); backM.rotation.z = .6; torso.add(backM);
    const backHold = new THREE.Group(); backHold.rotation.x = -Math.PI / 2; backM.add(backHold);
    parent.add(root);
    const bind = {};
    for (const [name, part] of Object.entries({ torso, head, armL, armR, legL, legR })) bind[name] = part.position.clone();
    return { root, inner, torso, head, armL, armR, legL, legR, gripRot, backHold, bind, tex, mats: blend ? [base, over, blend] : [base, over], parent };
  }
  function disposeModel(m) {
    m.parent.remove(m.root);
    m.root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    m.mats.forEach(x => x.dispose()); m.tex.dispose();
    if (m.eyes) m.eyes.material.dispose();
    if (m.decal) m.decal.material.dispose();
    if (m.screen) { m.screen.mat.dispose(); m.screen.tex.dispose(); }
  }
  // Datos de modelo BBS cargados desde js/animations.js
  const JESULUTO_BBS = window.JESULUTO_BBS;
  // El modelo BBS mira al norte (-Z); CalFight mira al sur (+Z).
  const JL_CUBE_FACES = {
    back: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], front: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]],
    right: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], left: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
    top: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], bottom: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
  };
  let jlEyesTexture;
  function jlTextureFilter(tex) {
    tex.magFilter = tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  }
  function jlCubeGeometry(cube, origin, size) {
    const pos = [], uv = [], indices = [];
    const margin = cube.offset || 0;
    const pivot = new V3(...cube.origin);
    const angle = new THREE.Euler(...(cube.rotate || [0,0,0]).map(v => v * Math.PI / 180), 'ZYX');
    const vertex = new V3();
    for (const [face, corners] of Object.entries(JL_CUBE_FACES)) {
      const coords = cube.uvs[face];
      if (!coords) continue;
      const [x0,y0,x1,y1] = coords, base = pos.length / 3;
      const cornersUV = [[x0,y1],[x1,y1],[x1,y0],[x0,y0]];
      for (let i = 0; i < 4; i++) {
        vertex.fromArray(corners[i].map((v, axis) => cube.from[axis] + (v ? cube.size[axis] + margin : -margin)));
        vertex.sub(pivot).applyEuler(angle).add(pivot);
        pos.push((origin[0] - vertex.x) * PX, (vertex.y - origin[1]) * PX, (origin[2] - vertex.z) * PX);
        const [u,v] = cornersUV[(i + (coords[4] || 0) / 90) % 4];
        uv.push(u / size, 1 - v / size);
      }
      indices.push(base,base+1,base+2,base,base+2,base+3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }
  function buildJesulutoModel(skin, parent) {
    const tex = jlTextureFilter(new THREE.CanvasTexture(skin));
    jlEyesTexture ||= jlTextureFilter(new THREE.TextureLoader().load(JESULUTO_BBS.eyes));
    const bodyMat = fighterToonMaterial(tex, 0.5, THREE.FrontSide, { spec: 0.26 }), eyeMat = fighterToonMaterial(jlEyesTexture, 0.5, THREE.FrontSide, { spec: 0.45 });
    const root = new THREE.Group(), filmRoot = new THREE.Group();
    root.add(filmRoot);
    const source = JESULUTO_BBS.groups, groups = {film_root:filmRoot};
    for (const name of Object.keys(source)) groups[name] = new THREE.Group();
    for (const [name, bone] of Object.entries(source)) {
      const g = groups[name];
      const parentBone = source[bone.parent];
      const o = !parentBone || (bone.eye && !parentBone.eye) ? [0,0,0] : parentBone.origin;
      g.name = name;
      g.position.set((o[0]-bone.origin[0])*PX, (bone.origin[1]-o[1])*PX, (o[2]-bone.origin[2])*PX);
      (groups[bone.parent] || filmRoot).add(g);
      for (const cube of bone.cubes || []) {
        const geo = jlCubeGeometry(cube, bone.origin, bone.eye ? 16 : 64);
        if (!bone.eye) addOutlineOffset(geo, 0.34 * PX);
        const mesh = new THREE.Mesh(geo, bone.eye ? eyeMat : bodyMat);
        mesh.castShadow = !bone.eye;
        g.add(mesh);
        if (!bone.eye) mesh.add(new THREE.Mesh(geo, OUTLINE_MAT));
      }
    }
    const parts = {torso:groups.body, head:groups.head, armL:groups.left_arm, armR:groups.right_arm, legL:groups.left_leg, legR:groups.right_leg};
    const bind = Object.fromEntries(Object.entries(parts).map(([name, g]) => [name,g.position.clone()]));
    const rest = Object.fromEntries(Object.entries(groups).map(([name, g]) => [name,g.position.clone()]));
    const animatedExtras = ['film_root','low_body','torso','eyes_anchor','eyes_pupil_l','eyes_pupil_r'];
    parent.add(root);
    return {root, inner:groups.anchor, ...parts, bind, tex, mats:[bodyMat,eyeMat], parent, jlRig:{groups, rest, animatedExtras}};
  }
  function buildFighterModel(ch, skin, custom, slim, parent) {
    return ch.screenHead && !custom ? buildJesulutoModel(skin, parent) : buildModel(skin, slim, parent);
  }

  return {
    faceRects, makeSkinCanvas, normalizeSkin, detectSlim, headPortrait,
    PX, TOON_GRAD, OUTLINE_MAT, addOutlineOffset, boxUV, fighterToonMaterial, buildModel, disposeModel,
    JESULUTO_BBS, JL_CUBE_FACES,
    get jlEyesTexture() { return jlEyesTexture; },
    set jlEyesTexture(v) { jlEyesTexture = v; },
    jlTextureFilter, jlCubeGeometry, buildJesulutoModel, buildFighterModel
  };
};
