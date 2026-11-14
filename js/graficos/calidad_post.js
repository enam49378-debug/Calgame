// ====================================================================
// CALIDAD GRÁFICA, POSPROCESADO, PANELES CÓMIC Y LÍNEAS DE VELOCIDAD
// ====================================================================
// Gestiona el EffectComposer (`UnrealBloomPass`, aberración cromática,
// gradación Zenless Urbano / clásica, `nitidez`, `estiloVisual`), presets y
// auto-escalado de FPS (`GFX`, `GFX_CFG`, `GFX_LIMIT`), `renderView`,
// `renderPanels`, `drawLines`, contador `FPS` (F2) y `updateGodRays`.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearCalidadYPost = function crearCalidadYPost(dep) {
  const {
    WEAK_PC, LOW_PC, renderer, scene, camera, sun, ZZZ_U, OUTLINE_MAT,
    V3, TAU, rand, clamp, fwd, rightOf, $
  } = dep;

  // ================= Líneas de velocidad =================
  const LC = $('lines'), LG = LC.getContext('2d');
  function sizeLines() { LC.width = innerWidth; LC.height = innerHeight; }
  sizeLines();
  let linesDrawn = false;
  // render con brillo (bloom) y los impact frames
  const _v2s = new THREE.Vector2();
  // nitidez de la imagen: en la consola (F12)  nitidez(0.9)  la sube, nitidez(0)  la quita (ahora 0.9; se guarda en tu navegador)
  window.nitidez = v => { if (!gradePass) return 'sin post-proceso'; const q = Math.max(0, Math.min(2, +v || 0)); gradePass.uniforms.uSharp.value = q; try { localStorage.setItem('bsb_sharp', String(q)); } catch (e) { } return q; };
  let composer = null, renderPass = null, bloomPass = null, caPass = null, gradePass = null;
  function initPostProcessing(){if(composer)return;
  try {
    if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
      composer = new THREE.EffectComposer(renderer);
      renderPass = new THREE.RenderPass(scene, camera);
      bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(Math.min(512, Math.floor(innerWidth / 2)), Math.min(512, Math.floor(innerHeight / 2))), .14, .20, .94);
      composer.addPass(renderPass); composer.addPass(bloomPass);
      if (THREE.ShaderPass) {
        caPass = new THREE.ShaderPass({
          uniforms: { tDiffuse: { value: null }, amt: { value: 0 } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D tDiffuse; uniform float amt; varying vec2 vUv;
            void main(){
              vec2 d = vUv - .5; float r = length(d);
              vec3 c = vec3(0.);
              for (int i = 0; i < 6; i++) { float k = 1. - float(i) * amt * .007; vec2 uv = .5 + d * k;
                c.r += texture2D(tDiffuse, uv + d * amt * .016).r; c.g += texture2D(tDiffuse, uv).g; c.b += texture2D(tDiffuse, uv - d * amt * .016).b; }
              c /= 6.;
              c *= 1. - amt * .55 * smoothstep(.25, .75, r);
              gl_FragColor = vec4(c, 1.);
            }`,
        });
        caPass.enabled = false; composer.addPass(caPass);
        // gradación final: estilo Zenless Urbano (sombras índigo, vibrancia anime, S-curve, viñeta e impact frame gráfico)
        gradePass = new THREE.ShaderPass({
          uniforms: {
            tDiffuse: { value: null },
            uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
            uSharp: { value: (() => { try { const v = parseFloat(localStorage.getItem('bsb_sharp')); return v >= 0 && v <= 2 ? v : 0.9; } catch (e) { return 0.9; } })() },
            uZzz: ZZZ_U.on,
            uImpact: ZZZ_U.impact,
            uImpactCol: ZZZ_U.impactCol,
            uNight: ZZZ_U.night,
          },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uTexel; uniform float uSharp, uZzz, uImpact, uNight; uniform vec3 uImpactCol; varying vec2 vUv;
            void main(){
              vec3 c = texture2D(tDiffuse, vUv).rgb;
              vec3 nb = texture2D(tDiffuse, vUv + vec2(uTexel.x, 0.)).rgb + texture2D(tDiffuse, vUv - vec2(uTexel.x, 0.)).rgb + texture2D(tDiffuse, vUv + vec2(0., uTexel.y)).rgb + texture2D(tDiffuse, vUv - vec2(0., uTexel.y)).rgb;
              c = clamp(c + (c - nb * .25) * uSharp, 0., 1.);
              float l = dot(c, vec3(.299, .587, .114));
              if (uZzz > .5) {
                // Zenless Urbano: sombras índigo sutiles, luces limpias y vibrancia selectiva sin azular el asfalto
                c = mix(c * vec3(.93, .95, 1.06), c * vec3(1.05, 1.02, .95), smoothstep(.20, .80, l));
                c = clamp(c, 0., 1.);
                c = mix(c, c * c * (3.0 - 2.0 * c), .18);
                float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b)), sat = mx - mn;
                float vib = 1.10 + (1.0 - smoothstep(.15, .75, sat)) * .16;
                float g = dot(c, vec3(.299, .587, .114));
                c = max(vec3(0.), mix(vec3(g), c, vib));
                if (uImpact > .01) {
                  float impK = smoothstep(.32, .85, uImpact);
                  float ink = step(.46, dot(c, vec3(.299, .587, .114)));
                  vec3 cut = mix(vec3(.04, .05, .10), mix(vec3(.98), uImpactCol * 1.15, .45), 1.0 - ink);
                  c = mix(c, cut, impK * .82);
                  c += uImpactCol * (uImpact * (1.0 - impK) * .30);
                }
              } else {
                c = mix(c * vec3(.92, .96, 1.08), c * vec3(1.05, 1.02, .96), smoothstep(.22, .82, l));
                c = clamp(c, 0., 1.);
                c = mix(c, c * c * (3.0 - 2.0 * c), 0.12);
                float g = dot(c, vec3(.299, .587, .114));
                c = mix(vec3(g), c, 1.12);
              }
              vec2 d = (vUv - .5) * vec2(1.12, 1.);
              c *= 1. - smoothstep(.42, .98, length(d)) * (uZzz > .5 ? .22 + uNight * .06 : .18);
              gl_FragColor = vec4(clamp(c, 0., 1.), 1.);
            }`,
        });
        composer.addPass(gradePass);
      }
    }
  } catch (e) { composer = null; }
  dep.onPasses({ composer, renderPass, bloomPass, caPass, gradePass });
  }
  // ================= Calidad gráfica adaptable =================
  // 0 Alta (bloom, sombras 2048, contornos) · 1 Media (sin bloom, sombras 1024) · 2 Baja (sin sombras ni contornos) · 3 Mínima (resolución reducida)
  // ================= Sistema Gráfico y Opciones Completas =================
  const GFX_LIMIT = { fps: 200, minDt: 1000 / 200, lastFrame: 0 };
  const GFX_CFG = {
    preset: "auto",
    style: "zenless",
    fpsLimit: 200,
    shadows: "soft",
    bloom: "anime",
    scale: 1.0,
    outlines: true,
    speedlines: true,
    godrays: true,
    auras: true,
    dust: true,
    contactShadows: true
  };
  const GFX = { level: 0, auto: true, post: true, names: ['Alta', 'Media', 'Baja', 'Mínima', 'Ultra baja'], acc: 0, frames: 0, bad: 0, good: 0, best: 0, cool: 6, soft: false, fps: 60 };
  window.estiloVisual = modo => {
    if (modo !== 'zenless' && modo !== 'classic') return 'usa estiloVisual("zenless") o estiloVisual("classic")';
    GFX_CFG.style = modo;
    gfxApply(true);
    return modo;
  };

  function gfxSyncUI() {
    const beta = ZZZ_U.beta.value > 0.5;
    document.querySelectorAll('.gfxsel').forEach(el => { el.value = GFX_CFG.preset; });
    const st = $('gfx-style'); if (st) st.value = GFX_CFG.style || 'zenless';
    const fl = $('gfx-fps-limit'); if (fl) fl.value = String(GFX_CFG.fpsLimit);
    const sh = $('gfx-shadows');
    if (sh) {
      const oU = sh.querySelector('option[value="ultra"]'), oS = sh.querySelector('option[value="soft"]'), oH = sh.querySelector('option[value="hard"]');
      if (oU) { oU.hidden = !beta; oU.disabled = !beta; oU.textContent = 'Ultra (Suaves 2048)'; }
      if (oS) oS.textContent = beta ? 'Altas (Suaves HD)' : 'Altas (Suaves PCF)';
      if (oH) oH.textContent = beta ? 'Medias (Rápidas 1024)' : 'Medias (Rápidas)';
      sh.value = (!beta && GFX_CFG.shadows === 'ultra') ? 'soft' : GFX_CFG.shadows;
    }
    const bl = $('gfx-bloom'); if (bl) bl.value = GFX_CFG.bloom;
    const sc = $('gfx-scale'); if (sc) sc.value = String(GFX_CFG.scale);
    const ol = $('gfx-outlines'); if (ol) ol.checked = !!GFX_CFG.outlines;
    const sl = $('gfx-speedlines'); if (sl) sl.checked = !!GFX_CFG.speedlines;
    const gr = $('gfx-godrays'); if (gr) gr.checked = !!GFX_CFG.godrays;
    const au = $('gfx-auras'); if (au) au.checked = !!GFX_CFG.auras;
    const du = $('gfx-dust'); if (du) du.checked = !!GFX_CFG.dust;
    const cs = $('gfx-cshadows'); if (cs) cs.checked = !!GFX_CFG.contactShadows;
  }

  function gfxSave() {
    try {
      localStorage.setItem('bsb_gfx_cfg_v2', JSON.stringify(GFX_CFG));
      localStorage.setItem('bsb_gfx_v3', JSON.stringify({ level: GFX.level, auto: GFX.auto, best: GFX.best }));
    } catch (e) {}
  }

  const SHADOW_PROFILES_BETA = {
    ultra: { type: THREE.PCFSoftShadowMap, size: 2048, span: 48, near: 2, far: 185, bias: -0.00028, normalBias: 0.016 },
    soft:  { type: THREE.PCFSoftShadowMap, size: 1024, span: 38, near: 2, far: 165, bias: -0.00032, normalBias: 0.018 },
    hard:  { type: THREE.PCFShadowMap,     size: 1024, span: 42, near: 2, far: 165, bias: -0.00045, normalBias: 0.025 },
  };
  const SHADOW_PROFILES_PUBLIC = {
    soft:  { type: THREE.PCFSoftShadowMap, size: 1024, span: 78, near: 0.5, far: 260, bias: -0.0005, normalBias: 0.025 },
    hard:  { type: THREE.PCFShadowMap,     size: 1024, span: 78, near: 0.5, far: 260, bias: -0.0005, normalBias: 0.025 },
  };

  function gfxApply(save = true) {
    const WX = dep.getWX();
    const beta = ZZZ_U.beta.value > 0.5;
    const zzz = GFX_CFG.style !== 'classic';
    ZZZ_U.on.value = zzz ? 1 : 0;
    OUTLINE_MAT.color.setHex(zzz ? 0x0c0e1c : 0x080912);
    GFX_LIMIT.fps = Number(GFX_CFG.fpsLimit) || 0;
    // Si es 0 (ilimitado) o 200 FPS (pantallas de 200 Hz), minDt=0 para permitir rendimiento nativo a 200 Hz sin saltos
    GFX_LIMIT.minDt = (GFX_LIMIT.fps > 0 && GFX_LIMIT.fps < 200) ? (1000 / GFX_LIMIT.fps) : 0;
    const effShadows = (!beta && GFX_CFG.shadows === 'ultra') ? 'soft' : GFX_CFG.shadows;
    const wantShadows = effShadows !== 'off';
    const wasOn = renderer.shadowMap.enabled;
    const wasType = renderer.shadowMap.type;
    renderer.shadowMap.enabled = wantShadows;
    sun.castShadow = wantShadows;
    if (wantShadows) {
      const table = beta ? SHADOW_PROFILES_BETA : SHADOW_PROFILES_PUBLIC;
      const prof = table[effShadows] || table.soft;
      const maxTex = (renderer.capabilities && renderer.capabilities.maxTextureSize) || 2048;
      const mapDim = Math.min(prof.size, maxTex);
      renderer.shadowMap.type = prof.type;
      sun.shadow.mapSize.set(mapDim, mapDim);
      Object.assign(sun.shadow.camera, {
        left: -prof.span, right: prof.span, top: prof.span, bottom: -prof.span, near: prof.near, far: prof.far
      });
      sun.shadow.camera.updateProjectionMatrix();
      sun.shadow.bias = prof.bias;
      sun.shadow.normalBias = prof.normalBias;
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
      renderer.shadowMap.needsUpdate = true;
    } else {
      if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    }
    if (dep.syncShadowReceivers) dep.syncShadowReceivers(beta);
    if (wasOn !== wantShadows || (wantShadows && wasType !== renderer.shadowMap.type)) {
      scene.traverse(o => { if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach(x => { x.needsUpdate = true; }); } });
    }
    const wantPost = GFX_CFG.bloom !== 'off';
    if (wantPost) initPostProcessing();
    GFX.post = wantPost && !!composer;
    if (bloomPass) {
      bloomPass.enabled = wantPost;
      if (GFX_CFG.bloom === 'anime') {
        bloomPass.strength = zzz ? 0.24 : 0.14;
        bloomPass.radius = zzz ? 0.34 : 0.20;
        bloomPass.threshold = zzz ? 0.80 : 0.94;
      } else if (GFX_CFG.bloom === 'subtle') {
        bloomPass.strength = zzz ? 0.11 : 0.08;
        bloomPass.radius = zzz ? 0.20 : 0.16;
        bloomPass.threshold = zzz ? 0.89 : 0.97;
      }
    }
    if (gradePass) gradePass.enabled = wantPost;
    if (typeof WX !== 'undefined' && WX.sky && dep.updateCityWeather) dep.updateCityWeather(0, true);
    const basePr = Math.min(devicePixelRatio || 1, (WEAK_PC || LOW_PC) ? 1.0 : (GFX.level >= 1 ? 1.25 : 1.5));
    const pr = Math.max(0.5, Math.min(2.0, basePr * (Number(GFX_CFG.scale) || 1.0)));
    renderer.setPixelRatio(pr);
    renderer.setSize(innerWidth, innerHeight);
    if (composer) {
      composer.setPixelRatio && composer.setPixelRatio(pr);
      composer.setSize(GFX.post ? innerWidth : 16, GFX.post ? innerHeight : 16);
    }
    OUTLINE_MAT.visible = !!GFX_CFG.outlines;
    dep.onPerf([1, .8, .55, .35, .2][GFX.level] || 1, [1, 1, .8, .55, .3][GFX.level] || 1);
    performanceDecorations();
    gfxSyncUI();
    if (save) gfxSave();
  }

  function gfxApplyPreset(level, isAuto = false, save = true) {
    level = clamp(level | 0, 0, 4);
    GFX.level = level;
    GFX.auto = !!isAuto;
    GFX_CFG.preset = isAuto ? 'auto' : String(level);
    if (level === 0) {
      GFX_CFG.fpsLimit = 200;
      GFX_CFG.shadows = 'soft';
      GFX_CFG.bloom = 'anime';
      GFX_CFG.scale = 1.0;
      GFX_CFG.outlines = true;
      GFX_CFG.speedlines = true;
      GFX_CFG.godrays = true;
      GFX_CFG.auras = true;
      GFX_CFG.dust = true;
      GFX_CFG.contactShadows = true;
    } else if (level === 1) {
      GFX_CFG.fpsLimit = 200;
      GFX_CFG.shadows = 'hard';
      GFX_CFG.bloom = 'subtle';
      GFX_CFG.scale = 1.0;
      GFX_CFG.outlines = true;
      GFX_CFG.speedlines = true;
      GFX_CFG.godrays = true;
      GFX_CFG.auras = true;
      GFX_CFG.dust = true;
      GFX_CFG.contactShadows = true;
    } else if (level === 2) {
      GFX_CFG.fpsLimit = 200;
      GFX_CFG.shadows = 'off';
      GFX_CFG.bloom = 'off';
      GFX_CFG.scale = 1.0;
      GFX_CFG.outlines = false;
      GFX_CFG.speedlines = true;
      GFX_CFG.godrays = false;
      GFX_CFG.auras = true;
      GFX_CFG.dust = true;
      GFX_CFG.contactShadows = true;
    } else if (level === 3) {
      GFX_CFG.fpsLimit = 0;
      GFX_CFG.shadows = 'off';
      GFX_CFG.bloom = 'off';
      GFX_CFG.scale = 0.85;
      GFX_CFG.outlines = false;
      GFX_CFG.speedlines = false;
      GFX_CFG.godrays = false;
      GFX_CFG.auras = false;
      GFX_CFG.dust = false;
      GFX_CFG.contactShadows = false;
    } else {
      GFX_CFG.fpsLimit = 60;
      GFX_CFG.shadows = 'off';
      GFX_CFG.bloom = 'off';
      GFX_CFG.scale = 0.75;
      GFX_CFG.outlines = false;
      GFX_CFG.speedlines = false;
      GFX_CFG.godrays = false;
      GFX_CFG.auras = false;
      GFX_CFG.dust = false;
      GFX_CFG.contactShadows = false;
    }
    gfxApply(save);
  }

  function gfxSet(level, auto, save = true) {
    gfxApplyPreset(level, auto, save);
  }

  const gfxAutoLevel = () => GFX.soft ? 4 : dep.getTOUCH().enabled ? 3 : WEAK_PC ? 3 : (LOW_PC || GFX.integrated) ? 2 : 0;

  function gfxInit() {
    let savedCfg = null, savedV3 = null;
    try { savedCfg = JSON.parse(localStorage.getItem('bsb_gfx_cfg_v2') || 'null'); } catch (e) {}
    try { savedV3 = JSON.parse(localStorage.getItem('bsb_gfx_v3') || 'null'); } catch (e) {}
    try {
      const gl = renderer.getContext(), ext = gl && gl.getExtension('WEBGL_debug_renderer_info'), name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
      GFX.soft = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(name);
      GFX.integrated = /intel.*(hd|uhd|iris)|radeon.*graphics|vega|mali|adreno|powervr|apple gpu|angle.*intel/i.test(name);
      GFX.gpu = name;
    } catch (e) {}
    if (savedCfg && typeof savedCfg === 'object') {
      if (savedCfg.preset === 'auto') gfxApplyPreset(gfxAutoLevel(), true, false);
      else if (savedCfg.preset !== 'custom' && savedCfg.preset != null) gfxApplyPreset(+savedCfg.preset, false, false);
      else GFX.auto = false;
      Object.assign(GFX_CFG, savedCfg);
      gfxApply(false);
    } else if (savedV3 && savedV3.auto === false && typeof savedV3.level === 'number') {
      gfxApplyPreset(savedV3.level, false, false);
    } else {
      gfxApplyPreset(gfxAutoLevel(), true, false);
    }
    document.querySelectorAll('.gfxsel').forEach(el => el.addEventListener('change', () => {
      if (el.value === 'auto') gfxApplyPreset(gfxAutoLevel(), true);
      else if (el.value === 'custom') { GFX.auto = false; GFX_CFG.preset = 'custom'; gfxApply(true); }
      else gfxApplyPreset(+el.value, false);
      GFX.bad = 0; GFX.cool = 6;
    }));
    const gst = $('gfx-style');
    if (gst) gst.addEventListener('change', () => {
      GFX_CFG.style = gst.value === 'classic' ? 'classic' : 'zenless'; gfxApply(true);
    });
    const fl = $('gfx-fps-limit');
    if (fl) fl.addEventListener('change', () => {
      GFX_CFG.fpsLimit = Number(fl.value) || 0; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const sh = $('gfx-shadows');
    if (sh) sh.addEventListener('change', () => {
      GFX_CFG.shadows = (ZZZ_U.beta.value <= 0.5 && sh.value === 'ultra') ? 'soft' : sh.value;
      GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const bl = $('gfx-bloom');
    if (bl) bl.addEventListener('change', () => {
      GFX_CFG.bloom = bl.value; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const sc = $('gfx-scale');
    if (sc) sc.addEventListener('change', () => {
      GFX_CFG.scale = Number(sc.value) || 1.0; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const ol = $('gfx-outlines');
    if (ol) ol.addEventListener('change', () => {
      GFX_CFG.outlines = ol.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const sl = $('gfx-speedlines');
    if (sl) sl.addEventListener('change', () => {
      GFX_CFG.speedlines = sl.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const gr = $('gfx-godrays');
    if (gr) gr.addEventListener('change', () => {
      GFX_CFG.godrays = gr.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const au = $('gfx-auras');
    if (au) au.addEventListener('change', () => {
      GFX_CFG.auras = au.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const du = $('gfx-dust');
    if (du) du.addEventListener('change', () => {
      GFX_CFG.dust = du.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const cs = $('gfx-cshadows');
    if (cs) cs.addEventListener('change', () => {
      GFX_CFG.contactShadows = cs.checked; GFX_CFG.preset = 'custom'; GFX.auto = false; gfxApply(true);
    });
    const resetBtn = $('gfx-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      GFX_CFG.style = 'zenless';
      gfxApplyPreset(0, false, true);
    });
  }
  // llamado cada cuadro con el tiempo real: si durante 3 s seguidos va por debajo de ~42 FPS, baja un nivel
  // Auto reduce calidad después de varias mediciones malas; nunca cambia la física ni la frecuencia de red.
  function gfxWatch(rawDt){
    const G = dep.getG();
    if(document.hidden||rawDt<=0||rawDt>.5||!['play','title','menu'].includes(G.state)||G.paused||G.cine||G.viewer||dep.roomInputBlocked()){GFX.acc=GFX.frames=GFX.bad=0;return;}
    GFX.acc+=rawDt;GFX.frames++;GFX.cool=Math.max(0,GFX.cool-rawDt);if(GFX.acc<1)return;
    const elapsed=GFX.acc;GFX.fps=GFX.frames/elapsed;GFX.acc=GFX.frames=0;
    if(!GFX.auto||GFX_CFG.preset!=='auto')return;
    const weight=GFX.fps<25?elapsed*2:GFX.fps<42?elapsed:0;
    GFX.bad=weight>0?GFX.bad+weight:Math.max(0,GFX.bad-elapsed*2);
    if(GFX.bad>=2.2&&GFX.cool===0&&GFX.level<4){const next=Math.min(4,GFX.level+(GFX.fps<22?2:1));GFX.best=Math.max(GFX.best,next);gfxSet(next,true,false);GFX.bad=0;GFX.cool=6;}
  }
  const PERF_FRAME={sea:0,far:0,plate:0,frame:0};
  function performanceDecorations(){
    const CITY = dep.getCITY();
    document.body.classList.toggle('lite-profiles',GFX.level>=2);
    const gMul = [1, 0.6, 0.25, 0, 0][GFX.level] ?? 0;
    if (CITY.grassMesh) { CITY.grassMesh.visible = gMul > 0; CITY.grassMesh.count = Math.floor((CITY.grassMax || 0) * gMul); }
    if (CITY.flowerMesh) { CITY.flowerMesh.visible = gMul > 0; CITY.flowerMesh.count = Math.floor((CITY.flowerMax || 0) * gMul); }
  }

  const _shSave = { n: 0, s: 0, kd: new V3(), rc: new THREE.Color(), rw: new THREE.Color() };
  function renderView(sc, cm) {
    const reportFrameError = dep.getReportFrameError();
    const SH = dep.getSH && dep.getSH();
    const inStudio = !!(SH && sc === SH.scene && ZZZ_U.beta.value > 0.5);
    if (inStudio) {
      _shSave.n = ZZZ_U.night.value;
      _shSave.s = ZZZ_U.sunset.value;
      _shSave.kd.copy(ZZZ_U.keyDir.value);
      _shSave.rc.copy(ZZZ_U.rimCol.value);
      _shSave.rw.copy(ZZZ_U.rimWarm.value);
      ZZZ_U.night.value = 0.16;
      ZZZ_U.sunset.value = 0.0;
      if (SH.key) ZZZ_U.keyDir.value.copy(SH.key.position).normalize();
      if (SH.rim) ZZZ_U.rimCol.value.copy(SH.rim.color);
      ZZZ_U.rimWarm.value.setHex(0xffeed4);
    }
    try {
      if (!composer || !GFX.post) { renderer.render(sc, cm); return; }
      const target = renderer.getRenderTarget(), autoClear = renderer.autoClear, alpha = renderer.getClearAlpha(), color = renderer.getClearColor(new THREE.Color());
      let completed = false;
      try {
        if (gradePass && gradePass.uniforms) {
          const u = gradePass.uniforms, db = renderer.getDrawingBufferSize(_v2s);
          if (u.uTexel?.value?.set) u.uTexel.value.set(1 / Math.max(1, db.x), 1 / Math.max(1, db.y));
          if (u.uZzz) u.uZzz.value = ZZZ_U.on.value;
          if (u.uImpact) u.uImpact.value = ZZZ_U.impact.value;
          if (u.uImpactCol?.value?.copy) u.uImpactCol.value.copy(ZZZ_U.impactCol.value);
          if (u.uNight) u.uNight.value = ZZZ_U.night.value;
        }
        renderPass.scene = sc; renderPass.camera = cm; composer.render(); completed = true;
      } catch (error) { reportFrameError('imagen:shaders', error); GFX.post = false; }
      finally { renderer.setRenderTarget(target); renderer.autoClear = autoClear; renderer.setClearColor(color, alpha); }
      if (!completed) renderer.render(sc, cm);
    } finally {
      if (inStudio) {
        ZZZ_U.night.value = _shSave.n;
        ZZZ_U.sunset.value = _shSave.s;
        ZZZ_U.keyDir.value.copy(_shSave.kd);
        ZZZ_U.rimCol.value.copy(_shSave.rc);
        ZZZ_U.rimWarm.value.copy(_shSave.rw);
      }
    }
  }
  // paneles de cómic: tres cámaras a la vez (cara, cuerpo entero, detalle del arma/visor/mano)
  const PCAMS = [0, 1, 2].map(() => new THREE.PerspectiveCamera(35, 1, .05, 200));
  const PANEL_CUTS = [0, .36, .68, 1];
  function renderPanels(c) {
    const STAGE = dep.getSTAGE(), SHOTS = dep.getSHOTS(), PX = dep.PX;
    const f = c.f, P = f.pos, F = fwd(f.yaw), R = rightOf(f.yaw), k = clamp((c.t - SHOTS[0]) / (SHOTS[1] - SHOTS[0]), 0, 1), W = innerWidth, H = innerHeight, sc = STAGE.on ? STAGE.scene : scene;
    const detail = f.spear ? f.spear.localToWorld(new V3(0, 0, 8 * PX)) : f.model.eyes ? f.model.eyes.getWorldPosition(new V3()) : f.model.armR.localToWorld(new V3(0, -10 * PX, 0));
    const hc = f.model.head.localToWorld(new V3(0, 4 * PX, 0)), cc = f.model.torso.localToWorld(new V3(0, 6 * PX, 0));
    const set = [
      cm => { cm.fov = 34; cm.position.set(hc.x + F.x * (1.75 - k * .3) + R.x * .35, hc.y + .08, hc.z + F.z * (1.75 - k * .3) + R.z * .35); cm.lookAt(hc); cm.rotateZ(.06); },
      cm => { const D = fwd(f.yaw - .75 - k * .25); cm.fov = 50; cm.position.set(P.x + D.x * 4.2, P.y + .2, P.z + D.z * 4.2); cm.lookAt(cc); cm.rotateZ(-.1); },
      cm => { const D = fwd(f.yaw + .9); cm.fov = 30; cm.position.set(detail.x + D.x * (1.0 - k * .25), detail.y + .15, detail.z + D.z * (1.0 - k * .25)); cm.lookAt(detail); cm.rotateZ(.12); },
    ];
    renderer.setScissorTest(true);
    try { for (let i = 0; i < 3; i++) {
      const x0 = PANEL_CUTS[i] * W, w = (PANEL_CUTS[i + 1] - PANEL_CUTS[i]) * W, cm = PCAMS[i];
      cm.up.set(0, 1, 0); set[i](cm); cm.aspect = w / H; cm.updateProjectionMatrix();
      renderer.setViewport(x0, 0, w, H); renderer.setScissor(x0, 0, w, H); renderer.render(sc, cm);
    }
    } finally { renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H); }
  }
  function drawPanelBorders() {
    const w = LC.width, h = LC.height, sl = h * .06;
    for (let i = 1; i < 3; i++) {
      const x = PANEL_CUTS[i] * w;
      LG.fillStyle = '#000'; LG.beginPath(); LG.moveTo(x - 10 + sl, 0); LG.lineTo(x + 10 + sl, 0); LG.lineTo(x + 10 - sl, h); LG.lineTo(x - 10 - sl, h); LG.closePath(); LG.fill();
      LG.strokeStyle = '#fff'; LG.lineWidth = 3; LG.beginPath(); LG.moveTo(x - 13 + sl, 0); LG.lineTo(x - 13 - sl, h); LG.moveTo(x + 13 + sl, 0); LG.lineTo(x + 13 - sl, h); LG.stroke();
    }
    linesDrawn = true;
  }
  function renderMain() {
    const G = dep.getG(), STAGE = dep.getSTAGE();
    if (G.cine && G.cine.shot === 1) { renderPanels(G.cine); return; }
    renderView(STAGE.on ? STAGE.scene : scene, camera);
  }

  function drawLines(dt) {
    const G = dep.getG(), IMPACT = dep.getIMPACT();
    if (typeof GFX_CFG !== 'undefined' && !GFX_CFG.speedlines && !G.cine) {
      if (linesDrawn) { LG.clearRect(0, 0, LC.width, LC.height); linesDrawn = false; }
      return;
    }
    if (IMPACT.t > 0 && performance.now() >= IMPACT.until) IMPACT.t = 0;
    if (IMPACT.t > 0) {
      const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
      LG.clearRect(0, 0, w, h); linesDrawn = true; LG.fillStyle = IMPACT.col; LG.globalAlpha = .92;
      for (let i = 0; i < 34; i++) {
        const a = rand(0, TAU), da = rand(.015, .05), r0 = R * rand(.28, .55);
        LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        LG.lineTo(cx + Math.cos(a - da) * R * 1.15, cy + Math.sin(a - da) * R * 1.15); LG.lineTo(cx + Math.cos(a + da) * R * 1.15, cy + Math.sin(a + da) * R * 1.15);
        LG.closePath(); LG.fill();
      }
      LG.globalAlpha = 1; return;
    }
    const p = G.player;
    const inComboFinisher = p && p.action && (p.action.name?.includes('combo') && (p.combo >= 3 || p.action.name?.includes('combo_4')));
    const inHeavy = p && p.action && (p.action.ragdoll || (p.action.kb && p.action.kb > 10) || p.action.dash);
    const inFastSpeed = p && Math.hypot(p.vel.x, p.vel.z) > 13;
    const want = G.cine ? 1 : (G.state === 'play' && p && (p.dashT > 0 || p.dashAnimT > 0 || inComboFinisher || inHeavy || inFastSpeed)) ? .65 : (p && p.awak > 0 ? .16 : 0);
    G.linesI += (want - G.linesI) * Math.min(1, dt * 10);
    if (G.linesI < .03) { if (linesDrawn) { LG.clearRect(0, 0, LC.width, LC.height); linesDrawn = false; } return; }
    const w = LC.width, h = LC.height, cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2, I = G.linesI;
    LG.clearRect(0, 0, w, h); linesDrawn = true;
    const col = G.cine ? G.cine.f.ch.color : (p && p.ch ? p.ch.color : '#ffffff');
    for (let i = 0; i < 80 * I; i++) {
      const a = rand(0, TAU), r0 = R * rand(.36, .68), r1 = R * 1.08;
      LG.strokeStyle = i % 3 ? `rgba(255,255,255,${.45 * I})` : col; LG.globalAlpha = i % 3 ? 1 : .65 * I;
      LG.lineWidth = rand(1.5, 4.5);
      LG.beginPath(); LG.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); LG.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); LG.stroke();
    }
    LG.globalAlpha = 1;
  }

  const FPS = { el: null, n: 0, t: 0, on: false, ms: 0, worst: 0 };
  try { FPS.on = localStorage.getItem('bsb_fps') === '1'; } catch (e) { FPS.on = false; }
  addEventListener('keydown', e => { if (e.code === 'F2') { e.preventDefault(); FPS.on = !FPS.on; try { localStorage.setItem('bsb_fps', FPS.on ? '1' : '0'); } catch (x) { } if ($('opt-fps')) $('opt-fps').checked = FPS.on; if (FPS.el) FPS.el.style.display = FPS.on ? 'block' : 'none'; } });
  function fpsTick(raw) {
    if (!FPS.on && !FPS.el) return;
    if (!FPS.el) { FPS.el = document.createElement('div'); FPS.el.style.cssText = 'position:fixed;top:6px;right:8px;z-index:99;pointer-events:none;font:700 12px/1.2 "Chakra Petch",monospace;color:#d7ff2f;text-shadow:0 1px 3px #000;background:#0008;padding:3px 7px;border-radius:5px;letter-spacing:.5px'; document.body.appendChild(FPS.el); }
    FPS.el.style.display = FPS.on ? 'block' : 'none'; FPS.n++; FPS.t += raw; FPS.ms = Math.max(FPS.ms, raw * 1000);
    if (FPS.t >= .4) {
      const fps = FPS.n / FPS.t;
      const frameMs = (1000 / Math.max(1, fps)).toFixed(1);
      FPS.el.style.color = fps >= 180 ? '#3ee07a' : fps >= 120 ? '#4fc3ff' : fps >= 50 ? '#d7ff2f' : fps >= 30 ? '#ffd23f' : '#ff4757';
      FPS.el.textContent = Math.round(fps) + ' FPS · ' + frameMs + ' ms · pico ' + Math.round(FPS.ms) + ' ms';
      FPS.n = 0; FPS.t = 0; FPS.ms = 0;
    }
  }

  // ====================================================================
  // RESPLANDOR SOLAR SUAVE EN EL CIELO (sin líneas radiales sobre árboles)
  // ====================================================================
  const _grFwd = new THREE.Vector3(), _grSun = new THREE.Vector3(), _grProj = new THREE.Vector3();
  function updateGodRays() {
    const G = dep.getG(), WX = dep.getWX();
    const gr = $('game-godrays');
    if (!gr) return;
    const sunHidden = ZZZ_U.beta.value > 0.5
      ? ((typeof WX !== 'undefined' && WX.sunVis != null) ? (WX.sunVis < 0.05) : (sun.position.y <= 6))
      : (sun.position.y <= 6);
    if (!GFX_CFG.godrays || G.state !== 'play' || (G.cine && G.cine.shot === 1) || (typeof WX !== 'undefined' && WX.cloud > 0.65) || sunHidden) {
      gr.style.opacity = '0';
      return;
    }
    _grFwd.set(0, 0, -1).applyQuaternion(camera.quaternion);
    _grSun.copy(sun.position).sub(sun.target.position).normalize();
    const dot = _grFwd.dot(_grSun);
    if (dot > 0.05) {
      const sv = _grProj.copy(_grSun).multiplyScalar(150).project(camera);
      const sx = clamp((sv.x * 0.5 + 0.5) * 100, 10, 90);
      const sy = clamp((-sv.y * 0.5 + 0.5) * 100, -25, 12);
      gr.style.setProperty('--sx', sx.toFixed(1) + '%');
      gr.style.setProperty('--sy', sy.toFixed(1) + '%');
      const alpha = clamp((dot - 0.05) / 0.85, 0, 1) * 0.42;
      gr.style.opacity = alpha.toFixed(2);
    } else {
      gr.style.opacity = '0';
    }
  }

  return {
    LC, LG, sizeLines,
    get linesDrawn() { return linesDrawn; },
    set linesDrawn(v) { linesDrawn = v; },
    _v2s, initPostProcessing, GFX_LIMIT, GFX_CFG, GFX,
    gfxSyncUI, gfxSave, gfxApply, gfxApplyPreset, gfxSet, gfxAutoLevel,
    gfxInit, gfxWatch, PERF_FRAME, performanceDecorations,
    renderView, PCAMS, PANEL_CUTS, renderPanels, drawPanelBorders,
    renderMain, drawLines, FPS, fpsTick, updateGodRays
  };
};
