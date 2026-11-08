/* Habilidad: Ojo del Cosmos  ·  personaje: redbird  ·  movimiento: rbCosmos   (habilidad 4 del despertar)
   Escena 1: cámara fija a ras del suelo, no se ve nada. Escena 2: la MISMA cámara; entran los pies de Redbird caminando de lado.
   Luego la cámara sube a su cara, él se desploma de rodillas y grita, y dispara un rayo muy ancho (cámara libre).
   Si el rayo mata a "need" rivales o más, la escena sigue: plano lateral del rayo más fuerte -> el espacio: se rompe un trozo
   de la Tierra por donde sale el rayo -> la cámara se lanza al planeta, atraviesa nubes y pájaros y baja sola hasta Redbird.
   Los números (daño, rivales necesarios) están en personaje.js. El espacio está en espacio-cosmos.js y el descenso en descenso-cosmos.js. */
CF.mover('rbCosmos', function (f, o) {
  const NEED_BASE = o.need || 2, me = !!f.isPlayer && !f.remote, isP = me && !CFG_CINE.off, BEAM_DMG = o.dmg || 8.5, LEN = 160;
  const foes = enemiesOf(f).filter(g => g.alive);
  if (!foes.length) return false;
  const NEED = Math.min(NEED_BASE, foes.length);

  // ---- dirección del rayo: la que más rivales tiene dentro (o el más cercano)
  let best = foes[0], bs = -1e9;
  for (const g of foes) {
    const F0 = fwd(yawTo(f, g)); let n = 0;
    for (const h of foes) { const c = chestOf(h), dx = c.x - f.pos.x, dz = c.z - f.pos.z; if (dx * F0.x + dz * F0.z > 0 && Math.abs(dx * F0.z - dz * F0.x) < 5) n++; }
    const sc = n * 100 - dist2d(f, g); if (sc > bs) { bs = sc; best = g; }
  }
  const Y = me ? cam.yaw : f.remote ? f.yaw : yawTo(f, best), F = fwd(Y), Rr = rightOf(Y);   // el jugador dispara hacia donde apunta; los bots, hacia donde hay más rivales
  // posición donde se queda Redbird (E), cámara baja delante de él (C0) y punto por donde entra caminando (S0, a la izquierda de la cámara)
  const R0 = f.pos.clone();
  for (let i = 0; i < 12 && Math.hypot(R0.x + F.x * 2, R0.z + F.z * 2) > ARENA - 2; i++) R0.addScaledVector(F, -.5);
  const gy = R0.y, E = R0.clone().addScaledVector(F, 2), C0 = E.clone().addScaledVector(F, 3.6), S0 = E.clone().addScaledVector(Rr, 5.2);

  // ---- tiempos (segundos desde que empieza la habilidad)
  const T_SHOW = .8, T_WALK_END = 3.6, T_TURN = .5, T_CAM_UP = 3.8, T_FACE = 5.0, T_COLLAPSE = 5.6, T_KNEEL = 6.4, T_FIRE = 7.6;
  const BEAM_EVAL = 2.5, POWER_DUR = 2.7, SPACE_DUR = 6.4, DESC_DUR = 3.4;

  // ---- poses estilo cartoon/anime: anticipación (se encoge), caída exagerada con rebote, grito con brazos abiertos y temblor
  const PRE = { by: -3, ix: .3, tx: .35, hx: .35, llx: .35, lrx: .35, alx: -.5, arx: -.5, alz: .3, arz: -.3 };
  const DROP = { by: -11.5, ix: .05, tx: .1, hx: .1, llx: 1.25, lrx: 1.25, llz: .2, lrz: -.2, alx: -.1, arx: -.1, alz: .5, arz: -.5 };
  const KNEEL_A = { by: -8, ix: .1, tx: .15, hx: -.05, llx: .95, lrx: .95, llz: .1, lrz: -.1, alx: -.3, arx: -.3, alz: .4, arz: -.4 };
  const SCR_A = { by: -10.5, ix: -.08, tx: -.45, hx: -1.15, llx: 1.3, lrx: 1.3, llz: .18, lrz: -.18, alx: -.15, arx: -.15, alz: .85, arz: -.85 };
  const SCR_B = Object.assign({}, SCR_A, { tx: -.38, hx: -1.05, alz: .95, arz: -.95, by: -10.2 });
  const FIRE_A = Object.assign({}, SCR_A, { tx: -.55, hx: -1.25, alz: 1, arz: -1, alx: -.35, arx: -.35, ix: -.12 });
  const FIRE_B = Object.assign({}, FIRE_A, { tx: -.5, hx: -1.15, alz: 1.1, arz: -1.1, by: -10.1 });
  const POW_A = Object.assign({}, FIRE_A, { tx: -.65, hx: -1.3, alz: 1.3, arz: -1.3, alx: -.6, arx: -.6, by: -11 });
  const POW_B = Object.assign({}, POW_A, { tx: -.6, hx: -1.2, alz: 1.45, arz: -1.45 });
  const eyes = () => front(f, .35, 1.72 - 10.5 * PX);

  // ---- estado
  const did = {}; let fireT = 0, k0 = 0, success = false, beamG = null, space = null, spaceT0 = 0, desc = null, descT0 = 0, graded = false, acc = 0, powered = false, finished = false;
  let mundo = null, camFar0 = null, bloomKick = 0, cameos = null, alive0 = [], skyBeam = null, A = null, mine = null, tension = null, rumble = null, beamHum = null, beamHum2 = null, ambience = null; const nextAt = {};
  const tremble = (a, t, A1, A2, per) => { const ph = Math.floor(t / per) % 2; if (a._ph !== ph) { a._ph = ph; a.anim = [[t + .04, ph ? A1 : A2, 700]]; } };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3), ease2 = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }, lerpV = (a, b, k) => a.clone().lerp(b, clamp(k, 0, 1));

  // ---- velo de nubes (para esconder el corte entre escenas)
  let fx = document.getElementById('cosmosfx');
  if (!fx) {
    fx = document.createElement('div'); fx.id = 'cosmosfx'; fx.style.cssText = 'position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;background-size:cover;background-position:center;';
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rand(0, 512), y = rand(0, 512), r = rand(40, 130), gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    fx.style.backgroundImage = 'url(' + cv.toDataURL() + ')'; fx.style.backgroundColor = 'rgba(190,220,255,0)'; document.body.appendChild(fx);
  }
  const setFx = (clouds, white, sc) => { fx.style.opacity = clouds; fx.style.transform = 'scale(' + sc + ')'; fx.style.backgroundColor = 'rgba(' + Math.round(190 + 65 * white) + ',' + Math.round(220 + 35 * white) + ',255,' + white + ')'; };
  const fadeFx = (from) => { let k = 0, lt = performance.now(); const back = (now) => { k += .04 * Math.min(15, (now - lt) / (1000 / 60)); lt = now; setFx(clamp(from - k, 0, 1), clamp(from - k * 1.3, 0, 1), 2.6 + k * 1.2); if (k < from) requestAnimationFrame(back); else setFx(0, 0, 1); }; setFx(from, from, 2.6); requestAnimationFrame(back); };

  // ---- barras de cine animadas: entran al empezar, cambian de grosor con cada plano y salen al terminar
  const bars = document.querySelectorAll('#lb i'); let barT = 0, barC = 0;
  const setBars = (vh) => { barT = vh; };   // grosor al que tienden las barras (en vh)
  const stepBars = (dt) => {   // se acercan al objetivo con una curva suave (sin escalones) a cada cuadro
    barC += (barT - barC) * (1 - Math.exp(-Math.min(dt, .1) * 5.2));
    bars.forEach(b => { b.style.transition = 'none'; b.style.height = barC.toFixed(2) + 'vh'; });
  };
  const barsOut = () => { bars.forEach(b => { b.style.transition = 'height .9s cubic-bezier(.4,0,.2,1)'; b.style.height = '0vh'; }); setTimeout(() => bars.forEach(b => { b.style.transition = ''; b.style.height = ''; }), 1000); };

  // ---- rayo del mundo (se crea al disparar)
  const makeBeam = () => {
    beamG = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, LEN), glowMat('#ff2d55', .55)), core = new THREE.Mesh(new THREE.BoxGeometry(1, 1, LEN), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    outer.position.z = core.position.z = LEN / 2; beamG.add(outer, core); scene.add(beamG);
  };
  const killSky = () => { if (skyBeam) { scene.remove(skyBeam); skyBeam.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); skyBeam = null; } };
  const killBeam = () => { if (mundo) mundo.hideFoam(); if (beamG) { scene.remove(beamG); beamG.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); beamG = null; } };

  // ---- efecto de cine: desenfoque (de zoom y de bordes), viñeta, grano y menos color; solo mientras dura la escena
  let cos = null, bloom0 = null, fxPulse = 0;
  const fxT = { blur: 0, edge: .25, vig: .28, desat: .05, grade: .25 }, fxC = { blur: 0, edge: 0, vig: 0, desat: 0, grade: 0 };
  const QL = rbCalidad();   // graficos del jugador: en 'Minima' o peor (o sin post-proceso) no se usa el pase de cine, solo barras y vineta CSS
  if (composer && THREE.ShaderPass && QL.level < 3 && QL.post) {
    try {
      cos = new THREE.ShaderPass({
        uniforms: { tDiffuse: { value: null }, amt: { value: 0 }, edge: { value: 0 }, vig: { value: 0 }, grain: { value: .04 }, desat: { value: 0 }, grade: { value: 0 }, time: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform sampler2D tDiffuse; uniform float amt, edge, vig, grain, desat, grade, time; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main(){
            vec2 d = vUv - .5; float r = length(d), b = amt + edge * smoothstep(.22, .85, r);
            vec3 c = vec3(0.);
            for (int i = 0; i < 9; i++) { float k = float(i) / 8.; c += texture2D(tDiffuse, vUv - d * b * k * .16).rgb; }
            c /= 9.;
            float l = dot(c, vec3(.299, .587, .114)); c = mix(c, vec3(l), desat);
            c = mix(c * mix(vec3(1.), vec3(.86, 1., 1.2), grade), c * mix(vec3(1.), vec3(1.14, 1., .86), grade), smoothstep(.25, .8, l));
            c *= 1. - smoothstep(.3, .95, r) * vig;
            c += (h(vUv * 800. + time) - .5) * grain;
            gl_FragColor = vec4(c, 1.);
          }`,
      });
      composer.addPass(cos);
    } catch (e) { cos = null; }
  }
  const fxTo = (blur, edge, vig, desat, grade) => { fxT.blur = blur; fxT.edge = edge; fxT.vig = vig; fxT.desat = desat; fxT.grade = grade == null ? .25 : grade; };
  const applyFx = (dt) => {
    const k = Math.min(1, dt * 7);
    for (const n in fxT) fxC[n] += (fxT[n] - fxC[n]) * k;
    if (cos) { const u = cos.uniforms; u.amt.value = fxC.blur + fxPulse * 1.1; u.edge.value = fxC.edge; u.vig.value = fxC.vig; u.desat.value = fxC.desat; u.grade.value = fxC.grade; u.time.value = (performance.now() % 100000) / 1000; }
  };
  // brillo naranja al entrar en la atmósfera
  let glow = document.getElementById('cosmosglow');
  if (!glow) { glow = document.createElement('div'); glow.id = 'cosmosglow'; glow.style.cssText = 'position:fixed;inset:0;z-index:54;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center, rgba(255,210,150,0) 25%, rgba(255,140,60,.55) 62%, rgba(255,70,20,.9) 100%);'; document.body.appendChild(glow); }

  // ---- cámara: pulso de cámara en mano, mezcla suave entre planos (con desenfoque de barrido) y temblor
  let lastShot = null, blend = null;
  const setCam = (pos, look, fov, roll, shot, bd, hand) => {
    hand = hand == null ? 1 : hand;
    const tn = performance.now() / 1000;
    if (shot !== lastShot) {
      blend = (lastShot !== null && bd) ? { t0: tn, dur: bd, p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov } : null;
      lastShot = shot;
    }
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll);
    camera.rotateX((Math.sin(tn * 1.3) * .0045 + Math.sin(tn * 3.1) * .0018) * hand); camera.rotateY((Math.sin(tn * 1.7 + 1) * .0045 + Math.sin(tn * 2.9) * .0016) * hand); camera.rotateZ(Math.sin(tn * .9 + 2) * .003 * hand);
    camera.position.x += Math.sin(tn * 1.9) * .012 * hand; camera.position.y += Math.sin(tn * 2.3 + 1) * .012 * hand;
    if (G.shake > 0) { const sh = G.shake * .2; camera.position.x += rand(-sh, sh); camera.position.y += rand(-sh, sh); G.shake = Math.max(0, G.shake - .016 * 2.2); }
    let fv = fov; fxPulse = 0;
    if (blend) {
      const k = ease((tn - blend.t0) / blend.dur);
      camera.position.lerpVectors(blend.p, camera.position, k); camera.quaternion.copy(blend.q.clone().slerp(camera.quaternion, k)); fv = blend.fov + (fov - blend.fov) * k;
      fxPulse = (1 - k) * (1 - k); if (k >= 1) blend = null;
    }
    cam.fov = fv; camera.fov = fv; camera.updateProjectionMatrix();
  };
  // pose que tendría la cámara normal del juego (para que el descenso termine justo ahí y se quede sola)
  const normalPose = () => {
    const saved = G.camScript; G.camScript = null;
    try { updateCamera(.016); } catch (e) { }
    G.camScript = saved;
    return { pos: camera.position.clone(), quat: camera.quaternion.clone(), fov: camera.fov };
  };

  const cleanup = () => {
    if (finished) return; finished = true;
    killBeam(); if (mundo) { try { mundo.dispose(); } catch (e) { } mundo = null; } if (space) { try { space.dispose(); } catch (e) { } space = null; } if (desc) { try { desc.dispose(); } catch (e) { } desc = null; }
    if (graded) { cineGrade(false); graded = false; }
    rbCosmosSnd.stopAll(); setFx(0, 0, 1); glow.style.opacity = 0; if (isP) barsOut(); document.body.classList.remove('cine'); killSky();
    if (cos && composer) { const i = composer.passes.indexOf(cos); if (i >= 0) composer.passes.splice(i, 1); cos = null; }
    if (bloom0 != null && bloomPass) bloomPass.strength = bloom0;
    if (camFar0 != null) { camera.far = camFar0; camera.updateProjectionMatrix(); camFar0 = null; }
    f.cineHide = false; f.iframes = Math.min(f.iframes, .6);
    if (mine && G.camScript === mine) G.camScript = null;
  };

  const camFn = (dt) => {
    if (finished || f.action !== A) { cleanup(); return false; }
    const t = A.t, gl = gy + .16; glow.style.opacity = 0;
    let bv = 15;
    if (t < T_CAM_UP) bv = 15; else if (t < T_FACE) bv = 14; else if (t < T_COLLAPSE) bv = 18; else if (t < T_KNEEL) bv = 11; else if (t < T_FIRE) bv = 13;
    else if (!powered && !space && !desc) bv = 9; else if (powered && !space && !desc) bv = 12;
    else if (space) { const sp = t - spaceT0; bv = sp < 2.2 ? 14 : sp < 4 ? 17 : sp < 5.2 ? 12 : 8; } else if (desc) bv = 5 * (1 - clamp((t - descT0) / DESC_DUR, 0, 1));
    setBars(bv);
    if (t < T_CAM_UP) {   // escenas 1 y 2: cámara fija a ras del suelo (la misma): primero no se ve nada, luego entran los pies
      fxTo(0, .3, .32, .05); setCam(new V3(C0.x, gl, C0.z), new V3(E.x, gy + .13, E.z), 18, 0, 'low', 0, .5);
    } else if (t < T_FACE) {   // sube hacia la cara
      const k = ease((t - T_CAM_UP) / (T_FACE - T_CAM_UP)), face = new V3(E.x + F.x * 2.7 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.7 + Rr.z * .35);
      fxTo(0, .35, .34, .05); setCam(lerpV(new V3(C0.x, gl, C0.z), face, k), lerpV(new V3(E.x, gy + .13, E.z), new V3(E.x, gy + 1.6, E.z), k), 18 + 10 * k, -.05 * k, 'rise', 0, .9);
    } else if (t < T_COLLAPSE) {   // primer plano de la cara, cada vez más tenso
      const k = (t - T_FACE) / (T_COLLAPSE - T_FACE), face = new V3(E.x + F.x * (2.7 - k * .5) + Rr.x * .35, gy + 1.62, E.z + F.z * (2.7 - k * .5) + Rr.z * .35);
      G.shake = Math.max(G.shake, .03 + k * .12); fxTo(k * .25, .45, .4, .05); setCam(face, new V3(E.x, gy + 1.6, E.z), 28 - 4 * k, -.05, 'rise', 0, 1.2 + k);
    } else if (t < T_KNEEL) {   // se desploma: la cámara se aleja y baja
      const k = ease((t - T_COLLAPSE) / (T_KNEEL - T_COLLAPSE)), from = new V3(E.x + F.x * 2.2 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.2 + Rr.z * .35), to = new V3(E.x + F.x * 4.2 + Rr.x, gy + .55, E.z + F.z * 4.2 + Rr.z);
      fxTo((1 - k) * .5, .4, .36, .05); setCam(lerpV(from, to, k), new V3(E.x, gy + 1.6 - .6 * k, E.z), 26 + 22 * k, .06 * k, 'rise', 0, 2);
    } else if (t < T_FIRE) {   // de rodillas, cargando
      const k = (t - T_KNEEL) / (T_FIRE - T_KNEEL);
      G.shake = Math.max(G.shake, .05 + k * .2); fxTo(0, .35, .34, .05);
      setCam(new V3(E.x + F.x * (4.2 - k) + Rr.x * (1 - .35 * k), gy + .55 - .1 * k, E.z + F.z * (4.2 - k) + Rr.z * (1 - .35 * k)), new V3(E.x, gy + .95, E.z), 48 - 8 * k, .06, 'rise', 0, 1.6 + k);
    } else if (!powered && !space && !desc) {   // cámara libre: solo se ve el rayo
      const s = t - fireT; fxTo(0, .3, .3, .02);
      setCam(new V3(E.x - F.x * (6.5 + s * .5) + Rr.x * 1.8, gy + 2.3 + s * .25, E.z - F.z * (6.5 + s * .5) + Rr.z * 1.8), new V3(E.x + F.x * (18 + s * 2), gy + 1.3, E.z + F.z * (18 + s * 2)), 64 + Math.sin(s * .1) * 2, .04, 'free', .55, 2);
      G.shake = Math.max(G.shake, .22);
    } else if (powered && !space && !desc) {   // costado izquierdo de Redbird: el rayo se hace más fuerte
      const s = t - (fireT + BEAM_EVAL), k = clamp(s / POWER_DUR, 0, 1); fxTo(0, .35, .32, .03);
      setCam(new V3(E.x - Rr.x * (6.2 - k * .8) - F.x * (3.2 - k * 1.2), gy + 3 + k * .3, E.z - Rr.z * (6.2 - k * .8) - F.z * (3.2 - k * 1.2)), new V3(E.x + F.x * (2.2 + k * 2), gy + 1.1, E.z + F.z * (2.2 + k * 2)), 52 - 6 * k, -.05 * k, 'power', .6, 1.8);
      G.shake = Math.max(G.shake, .25 + k * .25);
    } else if (space) {   // espacio: oscuro y apagado; se rompe un trozo de la Tierra y la cámara se lanza al planeta
      const s = t - spaceT0, O = space.origin, d = space.dir, R = space.radius;
      space.update(s, dt, camera.position);
      if (space.maquinaCue() !== (did.maqCue || 0)) { did.maqCue = space.maquinaCue(); rbCosmosSnd.whoosh(.9, 1500, 220, .5); sfx('tp', f.pos, .6); }   // pasa la Maquina del Tiempo
      bloomKick *= Math.exp(-dt * 2.2); if (bloomPass && bloom0 != null) bloomPass.strength = bloom0 * 2.4 + bloomKick;
      if (s < 2.2) {
        const a = .5 + s * .12, dist = 170 - s * 22, e = ease(s / 2.2); fxTo(.0, .55, .45, .22, .85); G.shake = Math.max(G.shake, .02 + e * .08);
        setCam(new V3(O.x + Math.cos(a) * dist, O.y + 28 - e * 10, O.z + Math.sin(a) * dist), O, 42 - e * 4, 0, 'sp1', 0, 1.1);
      } else if (s < 4) {   // corte anime: el rayo sale del agujero
        if (!did.boom) { did.boom = true; impactFrame('#ffffff', .14); screenFlash(1); G.shake = 1.6; sfx('boom', f.pos); sfx('beam', f.pos); G.linesI = 1; rbCosmosSnd.planetBoom(); bloomKick = 1.4; if (beamHum) beamHum.set(1, 70, .05); }
        const k = (s - 2.2) / 1.8, hole = new V3(O.x + d.x * R, O.y + d.y * R, O.z + d.z * R);
        fxTo(Math.max(0, 1 - (s - 2.2) * 1.6), .5, .42, .15, .85);
        setCam(new V3(hole.x - 55 + k * 12, hole.y - 8, hole.z + 62 - k * 8), new V3(hole.x + d.x * 22, hole.y + d.y * 22, hole.z + d.z * 22), 62 - k * 6, .12 - k * .1, 'sp2', 0, 2.2);
        G.shake = Math.max(G.shake, .7 * (1 - k));
      } else if (s < 5.2) {   // plano abierto: el planeta con su agujero y los pedazos
        const k = (s - 4) / 1.2; fxTo(0, .6, .45, .22, .85); G.shake = Math.max(G.shake, .08);
        setCam(new V3(O.x + 215 - k * 30, O.y + 55 - k * 15, O.z + 115), new V3(O.x + d.x * 20, O.y + d.y * 20, O.z + d.z * 20), 50 + k * 4, 0, 'sp3', .5, 1.2);
      } else {   // la cámara se lanza al planeta a toda velocidad y entra en la atmósfera
        const k = clamp((s - 5.2) / (SPACE_DUR - 5.2), 0, 1), e = k * k * k, from = new V3(O.x + 185, O.y + 40, O.z + 115);
        const side = new V3(d.z, 0, -d.x).normalize(), tgt = new V3(O.x + side.x * R * 1.04, O.y + 8, O.z + side.z * R * 1.04);
        fxTo(.2 + k * 1.5, .6, .35, .2 * (1 - k), .85 - .5 * k); G.shake = Math.max(G.shake, .1 + k * .6);
        setCam(lerpV(from, tgt, e), O, 54 + 36 * e, k * .4, 'sp4', .5, 1.5);
        G.linesI = 1; const cl = clamp((k - .55) / .45, 0, 1); setFx(cl, clamp((k - .85) / .15, 0, 1), 1 + cl * 1.4); glow.style.opacity = clamp((k - .35) / .45, 0, 1) * (1 - clamp((k - .85) / .15, 0, 1)) * .9;
      }
    } else if (desc) {   // descenso: nubes y pájaros pasando a toda velocidad hasta quedar en la cámara normal
      const u = clamp((t - descT0) / DESC_DUR, 0, 1), P = f.pos, np = normalPose();
      desc.update(dt); G.linesI = 1; fxTo((1 - u) * .8, .3 * (1 - u) + .12, .3, 0, .35); G.shake = Math.max(G.shake, .35 * (1 - u));
      const start = new V3(P.x + 22, P.y + 235, P.z - 28), e = ease2(u) * .35 + u * u * .65;
      const pos = lerpV(start, np.pos, e), tn = performance.now() / 1000, hand = (1 - u) * 1.6;
      if (!cameos) {   // dos visitantes: Sekza siempre (se ve bien) y un avión (o, muy rara vez, un platillo)
        const other = Math.random() < .12 ? 'ufo' : 'jet', sekFirst = Math.random() < .5;
        cameos = [{ u: .14 + Math.random() * .08, kind: sekFirst ? 'sekza' : other, side: Math.random() < .5 ? 1 : -1, done: false }, { u: .34 + Math.random() * .1, kind: sekFirst ? other : 'sekza', side: Math.random() < .5 ? 1 : -1, done: false }];
      }
      for (const c9 of cameos) if (!c9.done && u >= c9.u) {
        c9.done = true; desc.spawn(c9.kind, pos, new V3(P.x, P.y + 1.3, P.z), c9.side);
        if (c9.kind === 'jet') rbCosmosSnd.jet(); else if (c9.kind === 'ufo') rbCosmosSnd.ufo(); else playHtmlEffect(charSoundRel('sekza', 'vuelo_1'), .7, 'voices');
      }
      camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(P.x, P.y + 1.3, P.z); camera.rotateZ((1 - u) * (1 - u) * .25);
      camera.rotateX(Math.sin(tn * 1.3) * .0045 * hand); camera.rotateY(Math.sin(tn * 1.7 + 1) * .0045 * hand);
      const w = ease2(clamp((u - .55) / .45, 0, 1)); if (w > 0) camera.quaternion.slerp(np.quat, w);
      lastShot = 'desc'; blend = null;
      const fov = 80 + (np.fov - 80) * ease2(u); cam.fov = fov; camera.fov = fov; camera.updateProjectionMatrix();
    }
    stepBars(dt); applyFx(dt);
    return true;
  };

  startAction(f, {
    name: 'rbCosmos', dur: 200, noControl: true, speedMul: 0, lockYaw: true, armor: true, eyes: true, bbClip: isP ? 'caminar' : 'idle',
    start: (a) => {
      A = a; f.yaw = Y; f.iframes = Math.max(f.iframes, 60); f.vel.set(0, 0, 0);
      if (isP) {
        f.cineHide = true; if (!f.remote) f.pos.set(S0.x, S0.y, S0.z);
        document.body.classList.add('cine'); bars.forEach(b => { b.style.transition = 'none'; b.style.height = '0vh'; }); barC = 0; setBars(15);
        mine = { fn: camFn, cleanup }; G.camScript = mine;
      }
      popText(chestOf(f), '¡OJO DEL COSMOS!', '#ff2d55', 26); sfx('ult', f.pos);
      if (me) { tension = rbCosmosSnd.hum('sine', 52, .4); if (tension) tension.set(.25, 52, .5); rumble = rbCosmosSnd.loopNoise('lowpass', 90, .7, .5); if (rumble) rumble.set(.2, 90, .6); }
    },
    tick: (a, t, dt) => {
      // nada ni nadie puede moverlo, aturdirlo ni agarrarlo durante la escena
      f.iframes = Math.max(f.iframes, 1); f.stun = 0; f.frozen = 0; f.ragdoll = 0; f.grabbed = false; f.cineLock = null; f.hurtT = 0; f.vel.x = f.vel.z = 0;
      const walking = t >= T_SHOW && t < T_WALK_END;
      if (!f.remote) {   // el jugador entra de lado (cámara baja); los demás ven cómo da dos pasos al frente
        if (isP && t < T_SHOW) f.pos.set(S0.x, S0.y, S0.z);
        else if (t < T_WALK_END) { const k = isP ? (t - T_SHOW) / (T_WALK_END - T_SHOW) : clamp((t - T_SHOW) / (T_WALK_END - T_SHOW), 0, 1), P0 = isP ? S0 : R0; if (isP || t >= T_SHOW) f.pos.set(P0.x + (E.x - P0.x) * k, P0.y, P0.z + (E.z - P0.z) * k); }
        else f.pos.set(E.x, E.y, E.z);
      }
      // ---- sonido de tensión que va subiendo hasta el disparo
      if (!did.fire) { const k = clamp(t / T_FIRE, 0, 1); if (tension) tension.set(.25 + .75 * k, 52 + 46 * k, .25); if (rumble) rumble.set(.2 + .8 * k, 90 + 160 * k, .3); }
      // ---- caminata (para todos: animación de caminar mientras avanza, quieto el resto)
      if (isP) f.cineHide = t < T_SHOW;
      if (walking && a.bbClip !== 'caminar') a.bbClip = 'caminar';
      if (t >= T_WALK_END && t < T_COLLAPSE && a.bbClip !== 'idle') a.bbClip = 'idle';
      if (t < T_SHOW && a.bbClip !== (isP ? 'caminar' : 'idle')) a.bbClip = isP ? 'caminar' : 'idle';
      if (me) {
        if (walking && t >= (nextAt.step || 0)) { rbCosmosSnd.step(); nextAt.step = t + .6; }
        if (t >= T_FACE && t < T_COLLAPSE && t >= (nextAt.heart || 0)) { rbCosmosSnd.heart(); nextAt.heart = t + .85 - .35 * (t - T_FACE) / (T_COLLAPSE - T_FACE); }
      }
      if (!did.fire) f.yaw = isP && t < T_WALK_END + T_TURN ? Y + (Math.PI / 2) * (1 - clamp((t - T_WALK_END) / T_TURN, 0, 1)) : Y;
      // ---- caída de rodillas: se encoge (anticipación), se desploma de golpe y rebota
      if (!did.collapse && t >= T_COLLAPSE) {
        did.collapse = true; a.bbClip = null; a.anim = [[t + .16, PRE, 700], [t + .38, DROP, 700], [t + .62, KNEEL_A, 700]]; f.cineHide = false;
        later(.2, () => {
          sfx('heavy', f.pos); if (me) rbCosmosSnd.thud(); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff2d55', 4.5, .5); G.shake = Math.max(G.shake, me ? .9 : .35 * clamp(1 - camera.position.distanceTo(f.pos) / 30, 0, 1));
          burst(new V3(f.pos.x, f.pos.y + .2, f.pos.z), 28, '#6b5a3e', 9, .22, .6, 1, 4); if (isP) { impactFrame('#ffffff', .07); CAMFX.ca = Math.max(CAMFX.ca, .6); }
        });
      }
      if (!did.scream && t >= T_KNEEL) {
        did.scream = true; a.anim = [[t + .1, SCR_A, 700]]; popText(chestOf(f), '¡AAAAH!', '#ffffff', 30); if (isP) G.linesI = 1; javiSpeak(f, 'skill');
        if (me) { rbCosmosSnd.riser(T_FIRE - T_KNEEL, 160, 2600, .55); rbCosmosSnd.choir([130.8, 196, 261.6, 311.1], T_FIRE - T_KNEEL + .8, .55); }
      }
      if (t >= T_KNEEL + .3 && t < T_FIRE) {   // el visor se carga y todo el cuerpo tiembla
        tremble(a, t, SCR_A, SCR_B, .06);
        const k = (t - T_KNEEL) / (T_FIRE - T_KNEEL), org = eyes();
        for (let i = 0; i < 4; i++) { const an = rand(0, TAU), rr = 1 + k * 1.8; emit(org.x + Math.cos(an) * rr, org.y + rand(-.7, .7), org.z + Math.sin(an) * rr, -Math.cos(an) * 10, rand(-1, 1), -Math.sin(an) * 10, k > .6 ? '#ffffff' : '#ff2d55', .12 + k * .1, .22, 0, 0); }
        if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) ringAt(org, '#ff2d55', 2 + k * 2, .35, 'face', f.yaw);
        if (me && t >= (nextAt.crack || 0)) { rbCosmosSnd.crackle(); nextAt.crack = t + .08 + Math.random() * .12; }
      }
      // ---- disparo
      if (!did.fire && t >= T_FIRE) {
        did.fire = true; fireT = t; k0 = f.kills; alive0 = enemiesOf(f).filter(g => g.alive); a.anim = [[t + .1, FIRE_A, 700]]; makeBeam(); mundo = rbCosmosMundo();
        sfx('beam', f.pos); sfx('boom', f.pos); screenFlash(me ? .7 : .3); G.shake = Math.max(G.shake, me ? 1 : .4 * clamp(1 - camera.position.distanceTo(f.pos) / 40, 0, 1)); G.fovKick = Math.max(G.fovKick, isP ? 8 : 3);
        ringAt(eyes(), '#ffffff', 5, .45, 'face', f.yaw);
        if (me) { rbCosmosSnd.boom(1); rbCosmosSnd.sting(.7); } if (isP) { impactFrame('#ff2d55', .08); CAMFX.ca = 1; }
        if (tension) tension.set(0, 52, .2); if (rumble) rumble.set(.4, 70, .2);
        if (me) { beamHum = rbCosmosSnd.hum('sawtooth', 92, .38); beamHum2 = rbCosmosSnd.hum('square', 184, .12); } if (beamHum) beamHum.set(1, 92, .15); if (beamHum2) beamHum2.set(1, 184, .15);
      }
      // el rayo sigue visible para todos mientras dura la escena (el jugador lo deja atrás cuando pasa al espacio, los demás lo ven crecer)
      if (did.fire && beamG && !did.desc) {
        const s = t - fireT, grow = Math.min(1, s / .3);
        tremble(a, t, powered ? POW_A : FIRE_A, powered ? POW_B : FIRE_B, powered ? .045 : .05);
        // el rayo barre un poco a los lados: pega a casi todos, no a todos
        const off = powered ? 0 : Math.sin(s * 1.6) * .3; f.yaw = Y + off;
        const F2 = fwd(f.yaw), org = eyes(), w = (powered ? 5.2 + Math.min(1.2, (t - fireT - BEAM_EVAL) * .4) : 6.2) * grow, pul = 1 + Math.sin(t * 50) * .08;
        beamG.position.copy(org); beamG.rotation.y = f.yaw;
        const ow = (powered ? w * .72 : w * 1.05) * pul; beamG.children[0].scale.set(ow, ow, 1); beamG.children[1].scale.set(w * .38, w * .38, 1);
        if (powered) beamG.children[0].material.color.set('#ff3a2a');
        if (me) { if (beamHum) beamHum.set(did.space ? 0 : powered ? 1.5 : 1, powered ? 130 : 92, .3); if (beamHum2) beamHum2.set(did.space ? 0 : powered ? 1.6 : 1, powered ? 260 : 184, .3); }
        const end = org.clone().addScaledVector(F2, LEN);
        if (mundo) mundo.water(org, F2, LEN, w, powered, dt);   // reacción del rayo al mar
        for (let i = 0; i < 4; i++) { const q = org.clone().addScaledVector(F2, rand(2, LEN * .5)); emit(q.x + rand(-w, w) * .6, q.y + rand(-1, 1), q.z, rand(-5, 5), rand(0, 5), rand(-5, 5), powered ? '#ffffff' : '#ff2d55', .24, .35, .3); }
        emit(end.x, end.y, end.z, rand(-8, 8), rand(0, 8), rand(-8, 8), '#ff7a1a', .3, .4, .5);
        if (involvesPlayerNear(f) && !isP) G.shake = Math.max(G.shake, powered ? .3 : .18);
        if (me && !isP) G.shake = Math.max(G.shake, powered ? .4 : .25); else if (isP && !did.space) G.shake = Math.max(G.shake, powered ? .4 : .25);
        {
          acc += dt;
          while (acc >= .1) {
            acc -= .1;
            for (const g of enemiesOf(f)) {
              const c = chestOf(g);
              if (segDist(c, org, end) < w * 1.1 + .9 && Math.abs(c.y - org.y) < w + 2.2 && (c.x - org.x) * F2.x + (c.z - org.z) * F2.z > -.5)
                applyHit(f, g, { dmg: BEAM_DMG * (powered ? 1.5 : 1), stun: .4, kb: 7, up: 1, dir: F2, guardBreak: true, color: powered ? '#ffffff' : '#ff2d55', hitstop: 0, shake: .2 });
            }
          }
        }
      }
      // ---- ¿alcanzó? (si no, termina; si sí, sigue la escena). Se cuentan los rivales que estaban vivos al disparar y ya no lo están
      if (did.fire && !did.eval && t >= fireT + BEAM_EVAL) {
        did.eval = true; const killed = Math.max(f.kills - k0, alive0.filter(g => !g.alive).length); success = killed >= NEED;
        if (success) { powered = true; popText(chestOf(f), '¡EL COSMOS RESPONDE!', '#ffffff', 28); sfx('ult', f.pos); screenFlash(me ? .9 : .4); if (isP) { impactFrame('#ff2d55', .1); G.linesI = 1; CAMFX.ca = 1; } if (me) { rbCosmosSnd.riser(1.2, 200, 3000, .6); rbCosmosSnd.sting(.9); rbCosmosSnd.choir([174.6, 261.6, 349.2, 440], 3.4, .5); } f.yaw = Y; }
        else popText(chestOf(f), 'Rayo ' + killed + '/' + NEED, '#aab', 18);
      }
      if (did.eval && !success && t >= fireT + BEAM_EVAL + 1) { killBeam(); rbCosmosSnd.stopAll(); endAction(f); return; }
      // ---- espacio (el jugador lo ve; los demás ven una columna de energía al cielo, rayos y ondas de choque)
      if (success && !did.space && t >= fireT + BEAM_EVAL + POWER_DUR) {
        did.space = true; if (rumble) rumble.set(0, 60, .1); if (mundo) mundo.setApoc(1);   // el cielo se pone rojo para todos
        if (isP) {
          spaceT0 = t; cineGrade(true, f); graded = true; scene.fog = null; scene.background = new THREE.Color(0x01020a); if (bloomPass) { if (bloom0 == null) bloom0 = bloomPass.strength; bloomPass.strength = bloom0 * 2.4; }
          camFar0 = camera.far; camera.far = 1600; camera.updateProjectionMatrix(); space = rbCosmosEspacio(new V3(f.pos.x, 2600, f.pos.z)); screenFlash(1); sfx('whoosh'); rbCosmosSnd.whoosh(.8, 4000, 300, .6);
          if (beamHum) beamHum.set(0, 60, .05); if (beamHum2) beamHum2.set(0, 60, .05);
          ambience = rbCosmosSnd.loopNoise('lowpass', 140, .6, .6); if (ambience) ambience.set(1, 140, .6);
        } else {
          spaceT0 = t;
          skyBeam = new THREE.Group();   // columna de energía hacia el cielo
          const o1 = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.6, 340, 20, 1, true), glowMat('#ff2d55', .5)), o2 = new THREE.Mesh(new THREE.CylinderGeometry(.55, .9, 340, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9, side: THREE.DoubleSide }));
          o1.position.y = o2.position.y = 170; skyBeam.add(o1, o2); skyBeam.position.set(E.x, E.y, E.z); scene.add(skyBeam); sfx('ult', f.pos);
        }
      }
      if (did.space && !did.desc && !isP) {
        const s = t - spaceT0, near = clamp(1 - camera.position.distanceTo(f.pos) / 45, 0, 1);
        if (skyBeam) { const pul = 1 + Math.sin(t * 38) * .12; skyBeam.children[0].scale.set(pul, 1, pul); skyBeam.children[1].scale.set(1 + Math.sin(t * 27) * .15, 1, 1 + Math.sin(t * 27) * .15); }
        G.shake = Math.max(G.shake, .22 * near);
        if (t >= (nextAt.ring || 0)) { ringAt(new V3(E.x, E.y + .1, E.z), '#ff2d55', 6 + Math.random() * 3, .6); nextAt.ring = t + .32; }
        if (t >= (nextAt.bolt || 0)) { const a1 = rand(0, TAU), r1 = rand(2, 9); slashLine(new V3(E.x + Math.cos(a1) * r1 * .3, E.y + 60, E.z + Math.sin(a1) * r1 * .3), new V3(E.x + Math.cos(a1) * r1, E.y + .3, E.z + Math.sin(a1) * r1), '#ffffff', .35, .1); burst(new V3(E.x + Math.cos(a1) * r1, E.y + .3, E.z + Math.sin(a1) * r1), 10, '#ffd0a0', 7, .16, .3, .2); nextAt.bolt = t + .25 + Math.random() * .3; }
        for (let i = 0; i < 3; i++) { const an = rand(0, TAU), rr = rand(1, 3.5); emit(E.x + Math.cos(an) * rr, E.y + .2, E.z + Math.sin(an) * rr, -Math.sin(an) * 4, rand(8, 22), Math.cos(an) * 4, i ? '#ff7a3a' : '#ffffff', .2, 1.2, -.2, 0); }
        if (!did.boom2 && s >= 2.2) { did.boom2 = true; ringAt(new V3(E.x, E.y + .1, E.z), '#ffffff', 22, .9); sfx('boom', f.pos); screenFlash(.5 * near); G.shake = Math.max(G.shake, .8 * near); }
      }
      if (space) {   // sonidos del espacio: crujidos de la grieta, y luego el viento de la caída
        const s = t - spaceT0;
        if (s < 2.2 && t >= (nextAt.crack || 0)) { rbCosmosSnd.crackle(); nextAt.crack = t + .12 + Math.random() * .2; }
        if (s >= 5.2) { const k = clamp((s - 5.2) / (SPACE_DUR - 5.2), 0, 1); if (!did.dive) { did.dive = true; rbCosmosSnd.whoosh(1.3, 300, 3200, .8); rbCosmosSnd.reentry(1.2); CAMFX.ca = 1; } if (ambience) ambience.set(1 + k * 2.2, 140 + k * 1800, .15); }
      }
      // ---- el mundo reacciona (todos lo ven): temblor general, cielo rojo y lluvia de escombros mientras el cosmos responde
      if (mundo) { const live = did.space && !did.end; mundo.update(dt, { center: isP ? f.pos : camera.position, rain: live ? (did.desc ? 16 : 11) : 0, quake: live ? (did.desc ? .22 : (t - spaceT0 < 2.4 ? .5 : .32)) : 0 }); }
      // ---- descenso entre nubes y pájaros hasta Redbird (los demás lo ven levantarse y la columna desaparecer)
      if (success && did.space && !did.desc && t >= spaceT0 + SPACE_DUR) {
        did.desc = true; killBeam(); killSky(); if (mundo) mundo.setApoc(.55);
        if (space) { space.dispose(); space = null; }
        if (graded) { cineGrade(false); graded = false; }
        if (bloom0 != null && bloomPass) bloomPass.strength = bloom0;
        if (camFar0 != null) { camera.far = camFar0; camera.updateProjectionMatrix(); camFar0 = null; }
        a.bbClip = 'idle_combate'; a.anim = null; descT0 = t;
        if (isP) { desc = rbCosmosDescenso(f.pos); fadeFx(1); if (ambience) ambience.set(1.2, 1500, .3); }
        if (me) { rbCosmosSnd.whoosh(2.6, 3200, 380, .8); rbCosmosSnd.sting(.6); }
        else { ringAt(new V3(E.x, E.y + .1, E.z), '#ffffff', 16, .8); screenFlash(.35 * clamp(1 - camera.position.distanceTo(f.pos) / 45, 0, 1)); }
        screenFlash(isP ? .9 : 0); sfx('whoosh');
      }
      if (desc) {
        const u = clamp((t - descT0) / DESC_DUR, 0, 1);
        if (ambience) ambience.set(1.2 * (1 - u), 1500 - 1100 * u, .25);
        if (t >= (nextAt.bird || 0)) { rbCosmosSnd.chirp(); nextAt.bird = t + .18 + Math.random() * .35; }
      }
      if (success && did.desc && !did.end && t >= descT0 + DESC_DUR) {
        did.end = true; if (mundo) mundo.setApoc(0);
        screenFlash(me ? .8 : .3); G.shake = Math.max(G.shake, me ? 1 : .5 * clamp(1 - camera.position.distanceTo(f.pos) / 40, 0, 1)); sfx('boom', f.pos);
        if (me) { rbCosmosSnd.boom(.9); rbCosmosSnd.choir([130.8, 196, 261.6, 392], 3.6, .5); }
        rbCosmosSnd.stopAll();
        for (const g of enemiesOf(f)) applyHit(f, g, { dmg: 16, kb: 24, up: 12, ragdoll: 1.6, guardBreak: true, color: '#ff3b30', hitstop: .1, shake: .8 });
        ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffffff', 14, .7);
        endAction(f);
      }
    },
    onEnd: () => { cleanup(); f.cd[o.slot] = Math.max(f.cd[o.slot], 1); },
  });
});
