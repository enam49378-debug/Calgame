/* Habilidad: Ojo del Cosmos  ·  personaje: redbird  ·  movimiento: rbCosmos   (habilidad 4 del despertar)
   Escena 1: cámara fija a ras del suelo, no se ve nada. Escena 2: la MISMA cámara; entran los pies de Redbird caminando de lado.
   Luego la cámara sube a su cara, él se desploma de rodillas y grita, y dispara un rayo muy ancho (cámara libre).
   Si el rayo mata a "need" rivales o más, la escena sigue: plano lateral del rayo más fuerte -> el espacio: se rompe un trozo
   de la Tierra por donde sale el rayo -> la cámara se lanza al planeta, atraviesa nubes y pájaros y baja sola hasta Redbird.
   Los números (daño, rivales necesarios) están en personaje.js. El espacio está en espacio-cosmos.js y el descenso en descenso-cosmos.js. */
CF.mover('rbCosmos', function (f, o) {
  const NEED_BASE = o.need || 2, isP = !!f.isPlayer && !f.remote, BEAM_DMG = o.dmg || 8.5, LEN = 95;
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
  const Y = yawTo(f, best), F = fwd(Y), Rr = rightOf(Y);
  // posición donde se queda Redbird (E), cámara baja delante de él (C0) y punto por donde entra caminando (S0, a la izquierda de la cámara)
  const R0 = f.pos.clone();
  for (let i = 0; i < 12 && Math.hypot(R0.x + F.x * 2, R0.z + F.z * 2) > ARENA - 2; i++) R0.addScaledVector(F, -.5);
  const gy = R0.y, E = R0.clone().addScaledVector(F, 2), C0 = E.clone().addScaledVector(F, 3.6), S0 = E.clone().addScaledVector(Rr, 5.2);

  // ---- tiempos (segundos desde que empieza la habilidad)
  const T_SHOW = 1, T_WALK_END = 4.2, T_TURN = .6, T_CAM_UP = 4.4, T_FACE = 5.8, T_COLLAPSE = 6.4, T_KNEEL = 7.2, T_FIRE = 8.6;
  const BEAM_EVAL = 2.8, POWER_DUR = 3, SPACE_DUR = 6.6, DESC_DUR = 3.6;

  // ---- poses (de rodillas: cuerpo bajo, piernas hacia atrás, torso y cabeza hacia atrás)
  const KNEEL_A = { by: -8, ix: .12, tx: .2, hx: -.1, llx: .9, lrx: .9, llz: .1, lrz: -.1, alx: -.35, arx: -.35, alz: .35, arz: -.35 };
  const SCREAM = { by: -10.5, ix: -.06, tx: -.4, hx: -1, llx: 1.3, lrx: 1.3, llz: .18, lrz: -.18, alx: -.2, arx: -.2, alz: .6, arz: -.6 };
  const FIRE_P = Object.assign({}, SCREAM, { hx: -1.15, tx: -.5, alz: .75, arz: -.75 });
  const eyes = () => front(f, .35, 1.72 - 10.5 * PX);

  // ---- estado
  const did = {}; let fireT = 0, k0 = 0, success = false, beamG = null, space = null, spaceT0 = 0, desc = null, descT0 = 0, graded = false, acc = 0, powered = false, finished = false;
  let A = null, mine = null;
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
  const fadeFx = (from) => { let k = 0; const back = () => { k += .04; setFx(clamp(from - k, 0, 1), clamp(from - k * 1.3, 0, 1), 2.6 + k * 1.2); if (k < from) requestAnimationFrame(back); else setFx(0, 0, 1); }; setFx(from, from, 2.6); requestAnimationFrame(back); };

  // ---- rayo del mundo (se crea al disparar)
  const makeBeam = () => {
    beamG = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.BoxGeometry(1, 1, LEN), glowMat('#ff2d55', .55)), core = new THREE.Mesh(new THREE.BoxGeometry(1, 1, LEN), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    outer.position.z = core.position.z = LEN / 2; beamG.add(outer, core); scene.add(beamG);
  };
  const killBeam = () => { if (beamG) { scene.remove(beamG); beamG.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); beamG = null; } };

  // ---- cámara
  const setCam = (pos, look, fov, roll) => {
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); if (roll) camera.rotateZ(roll);
    if (G.shake > 0) { const s = G.shake * .2; camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); G.shake = Math.max(0, G.shake - .016 * 2.2); }
    cam.fov = fov; camera.fov = fov; camera.updateProjectionMatrix();
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
    killBeam(); if (space) { try { space.dispose(); } catch (e) { } space = null; } if (desc) { try { desc.dispose(); } catch (e) { } desc = null; }
    if (graded) { cineGrade(false); graded = false; }
    setFx(0, 0, 1); document.body.classList.remove('cine');
    f.cineHide = false; f.iframes = Math.min(f.iframes, .6);
    if (mine && G.camScript === mine) G.camScript = null;
  };

  const camFn = (dt) => {
    if (finished || f.action !== A) { cleanup(); return false; }
    const t = A.t, gl = gy + .16;
    if (t < T_CAM_UP) {   // escenas 1 y 2: cámara fija a ras del suelo (la misma): primero no se ve nada, luego entran los pies
      setCam(new V3(C0.x, gl, C0.z), new V3(E.x, gy + .13, E.z), 18, 0);
    } else if (t < T_FACE) {   // sube hacia la cara
      const k = ease((t - T_CAM_UP) / (T_FACE - T_CAM_UP)), face = new V3(E.x + F.x * 2.7 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.7 + Rr.z * .35);
      setCam(lerpV(new V3(C0.x, gl, C0.z), face, k), lerpV(new V3(E.x, gy + .13, E.z), new V3(E.x, gy + 1.6, E.z), k), 18 + 10 * k, -.05 * k);
    } else if (t < T_COLLAPSE) {   // primer plano de la cara, cada vez más tenso
      const k = (t - T_FACE) / (T_COLLAPSE - T_FACE), face = new V3(E.x + F.x * (2.7 - k * .5) + Rr.x * .35, gy + 1.62, E.z + F.z * (2.7 - k * .5) + Rr.z * .35);
      G.shake = Math.max(G.shake, .03 + k * .12); setCam(face, new V3(E.x, gy + 1.6, E.z), 28 - 4 * k, -.05);
    } else if (t < T_KNEEL) {   // se desploma: la cámara se aleja y baja
      const k = ease((t - T_COLLAPSE) / (T_KNEEL - T_COLLAPSE)), from = new V3(E.x + F.x * 2.2 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.2 + Rr.z * .35), to = new V3(E.x + F.x * 4.2 + Rr.x, gy + .55, E.z + F.z * 4.2 + Rr.z);
      setCam(lerpV(from, to, k), new V3(E.x, gy + 1.6 - .6 * k, E.z), 26 + 22 * k, .06 * k);
    } else if (t < T_FIRE) {   // de rodillas, cargando
      const k = (t - T_KNEEL) / (T_FIRE - T_KNEEL);
      G.shake = Math.max(G.shake, .05 + k * .2);
      setCam(new V3(E.x + F.x * (4.2 - k) + Rr.x * (1 - .35 * k), gy + .55 - .1 * k, E.z + F.z * (4.2 - k) + Rr.z * (1 - .35 * k)), new V3(E.x, gy + .95, E.z), 48 - 8 * k, .06);
    } else if (!powered && !space && !desc) {   // cámara libre: solo se ve el rayo
      const s = t - fireT;
      setCam(new V3(E.x - F.x * (6.5 + s * .5) + Rr.x * 1.8, gy + 2.3 + s * .25, E.z - F.z * (6.5 + s * .5) + Rr.z * 1.8), new V3(E.x + F.x * (18 + s * 2), gy + 1.3, E.z + F.z * (18 + s * 2)), 64 + Math.sin(s * .1) * 2, .04);
      G.shake = Math.max(G.shake, .22);
    } else if (powered && !space && !desc) {   // costado izquierdo de Redbird: el rayo se hace más fuerte
      const s = t - (fireT + BEAM_EVAL), k = clamp(s / POWER_DUR, 0, 1);
      setCam(new V3(E.x - Rr.x * (6.2 - k * .8) - F.x * (3.2 - k * 1.2), gy + 3 + k * .3, E.z - Rr.z * (6.2 - k * .8) - F.z * (3.2 - k * 1.2)), new V3(E.x + F.x * (2.2 + k * 2), gy + 1.1, E.z + F.z * (2.2 + k * 2)), 52 - 6 * k, -.05 * k);
      G.shake = Math.max(G.shake, .25 + k * .25);
    } else if (space) {   // espacio: se rompe un trozo de la Tierra y la cámara se lanza al planeta
      const s = t - spaceT0, O = space.origin, d = space.dir, R = space.radius;
      space.update(s, dt, camera.position);
      if (s < 2.2) {
        const a = .5 + s * .12, dist = 170 - s * 22, e = ease(s / 2.2);
        setCam(new V3(O.x + Math.cos(a) * dist, O.y + 28 - e * 10, O.z + Math.sin(a) * dist), O, 42 - e * 4, 0);
      } else if (s < 4) {   // corte anime: el rayo sale del agujero
        if (!did.boom) { did.boom = true; impactFrame('#ffffff', .14); screenFlash(1); G.shake = 1.4; sfx('boom', f.pos); sfx('beam', f.pos); G.linesI = 1; }
        const k = (s - 2.2) / 1.8, hole = new V3(O.x + d.x * R, O.y + d.y * R, O.z + d.z * R);
        setCam(new V3(hole.x - 55 + k * 12, hole.y - 8, hole.z + 62 - k * 8), new V3(hole.x + d.x * 22, hole.y + d.y * 22, hole.z + d.z * 22), 62 - k * 6, .12 - k * .1);
        G.shake = Math.max(G.shake, .6 * (1 - k));
      } else if (s < 5.2) {   // plano abierto: el planeta con su agujero y los pedazos
        const k = (s - 4) / 1.2;
        setCam(new V3(O.x + 215 - k * 30, O.y + 55 - k * 15, O.z + 115), new V3(O.x + d.x * 20, O.y + d.y * 20, O.z + d.z * 20), 50 + k * 4, 0);
      } else {   // la cámara se lanza al planeta a toda velocidad y entra en la atmósfera
        const k = clamp((s - 5.2) / (SPACE_DUR - 5.2), 0, 1), e = k * k * k, from = new V3(O.x + 185, O.y + 40, O.z + 115);
        const side = new V3(d.z, 0, -d.x).normalize(), tgt = new V3(O.x + side.x * R * 1.04, O.y + 8, O.z + side.z * R * 1.04);
        setCam(lerpV(from, tgt, e), O, 54 + 36 * e, k * .4);
        G.linesI = 1; const cl = clamp((k - .55) / .45, 0, 1); setFx(cl, clamp((k - .85) / .15, 0, 1), 1 + cl * 1.4);
      }
    } else if (desc) {   // descenso: nubes y pájaros pasando a toda velocidad hasta quedar en la cámara normal
      const u = clamp((t - descT0) / DESC_DUR, 0, 1), P = f.pos, np = normalPose();
      desc.update(dt); G.linesI = 1;
      const start = new V3(P.x + 22, P.y + 235, P.z - 28), e = ease2(u) * .35 + u * u * .65;
      const pos = lerpV(start, np.pos, e);
      camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(P.x, P.y + 1.3, P.z);
      const w = ease2(clamp((u - .55) / .45, 0, 1)); if (w > 0) camera.quaternion.slerp(np.quat, w);
      const fov = 80 + (np.fov - 80) * ease2(u); cam.fov = fov; camera.fov = fov; camera.updateProjectionMatrix();
    }
    return true;
  };

  startAction(f, {
    name: 'rbCosmos', dur: 200, noControl: true, speedMul: 0, lockYaw: true, armor: true, eyes: true, bbClip: isP ? 'caminar' : 'idle',
    start: (a) => {
      A = a; f.yaw = Y; f.iframes = Math.max(f.iframes, 60); f.vel.set(0, 0, 0);
      if (isP) {
        f.cineHide = true; if (!f.remote) f.pos.set(S0.x, S0.y, S0.z);
        document.body.classList.add('cine');
        mine = { fn: camFn, cleanup }; G.camScript = mine;
      } else { a.t = T_COLLAPSE - .2; if (!f.remote) f.pos.set(E.x, E.y, E.z); }
      popText(chestOf(f), '¡OJO DEL COSMOS!', '#ff2d55', 26); sfx('ult', f.pos);
    },
    tick: (a, t, dt) => {
      f.iframes = Math.max(f.iframes, 1);
      // ---- escena 2: entra caminando de lado (solo se ven los pies), se detiene y se gira hacia la cámara
      if (isP) {
        if (t < T_SHOW) { f.cineHide = true; if (!f.remote) f.pos.set(S0.x, S0.y, S0.z); }
        else if (t < T_WALK_END) { f.cineHide = false; const k = (t - T_SHOW) / (T_WALK_END - T_SHOW); if (!f.remote) f.pos.set(S0.x + (E.x - S0.x) * k, S0.y, S0.z + (E.z - S0.z) * k); }
        else if (t < T_COLLAPSE + .6 && !f.remote) f.pos.set(E.x, E.y, E.z);
        if (t >= T_SHOW && t < T_WALK_END && a.bbClip !== 'caminar') a.bbClip = 'caminar';
        if (t >= T_WALK_END && t < T_COLLAPSE && a.bbClip !== 'idle') a.bbClip = 'idle';
      }
      if (!did.fire) f.yaw = isP && t < T_WALK_END + T_TURN ? Y + (Math.PI / 2) * (1 - clamp((t - T_WALK_END) / T_TURN, 0, 1)) : Y;
      // ---- caída de rodillas
      if (!did.collapse && t >= T_COLLAPSE) {
        did.collapse = true; a.bbClip = null; a.anim = [[t + .5, KNEEL_A, 700]]; f.cineHide = false;
        sfx('heavy', f.pos); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff2d55', 4, .5); G.shake = Math.max(G.shake, .5);
        burst(new V3(f.pos.x, f.pos.y + .2, f.pos.z), 22, '#6b5a3e', 8, .2, .6, 1, 4);
      }
      if (!did.scream && t >= T_KNEEL) { did.scream = true; a.anim = [[t + .35, SCREAM, 700]]; popText(chestOf(f), '¡AAAAH!', '#ffffff', 30); }
      if (t >= T_KNEEL && t < T_FIRE) {   // el visor se carga
        const k = (t - T_KNEEL) / (T_FIRE - T_KNEEL), org = eyes();
        for (let i = 0; i < 3; i++) { const an = rand(0, TAU), rr = 1 + k * 1.6; emit(org.x + Math.cos(an) * rr, org.y + rand(-.7, .7), org.z + Math.sin(an) * rr, -Math.cos(an) * 9, rand(-1, 1), -Math.sin(an) * 9, k > .6 ? '#ffffff' : '#ff2d55', .12 + k * .1, .22, 0, 0); }
        if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) ringAt(org, '#ff2d55', 2 + k * 2, .35, 'face', f.yaw);
      }
      // ---- disparo
      if (!did.fire && t >= T_FIRE) {
        did.fire = true; fireT = t; k0 = f.kills; a.anim = [[t + .15, FIRE_P, 700]]; makeBeam();
        sfx('beam', f.pos); sfx('boom', f.pos); screenFlash(.7); G.shake = Math.max(G.shake, .8); G.fovKick = Math.max(G.fovKick, 8);
        ringAt(eyes(), '#ffffff', 5, .45, 'face', f.yaw);
      }
      if (did.fire && beamG && !space && !desc) {
        const s = t - fireT, grow = Math.min(1, s / .3);
        // el rayo barre un poco a los lados: pega a casi todos, no a todos
        const off = powered ? 0 : Math.sin(s * 1.6) * .3; f.yaw = Y + off;
        const F2 = fwd(f.yaw), org = eyes(), w = (powered ? 3.8 + Math.min(1, (t - fireT - BEAM_EVAL) * .4) : 4.2) * grow, pul = 1 + Math.sin(t * 50) * .08;
        beamG.position.copy(org); beamG.rotation.y = f.yaw;
        const ow = (powered ? w * .85 : w * 1.15) * pul; beamG.children[0].scale.set(ow, ow, 1); beamG.children[1].scale.set(w * .38, w * .38, 1);
        if (powered) beamG.children[0].material.color.set('#ff3a2a');
        const end = org.clone().addScaledVector(F2, LEN);
        for (let i = 0; i < 4; i++) { const q = org.clone().addScaledVector(F2, rand(2, LEN * .5)); emit(q.x + rand(-w, w) * .6, q.y + rand(-1, 1), q.z, rand(-5, 5), rand(0, 5), rand(-5, 5), powered ? '#ffffff' : '#ff2d55', .24, .35, .3); }
        emit(end.x, end.y, end.z, rand(-8, 8), rand(0, 8), rand(-8, 8), '#ff7a1a', .3, .4, .5);
        if (involvesPlayerNear(f)) G.shake = Math.max(G.shake, powered ? .4 : .25);
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
      // ---- ¿alcanzó? (si no, termina; si sí, sigue la escena)
      if (did.fire && !did.eval && t >= fireT + BEAM_EVAL) {
        did.eval = true; const killed = f.kills - k0; success = killed >= NEED;
        if (success) { powered = true; popText(chestOf(f), '¡EL COSMOS RESPONDE!', '#ffffff', 28); sfx('ult', f.pos); screenFlash(.9); impactFrame('#ff2d55', .1); G.linesI = 1; f.yaw = Y; }
        else popText(chestOf(f), 'Rayo ' + killed + '/' + NEED, '#aab', 18);
      }
      if (did.eval && !success && t >= fireT + BEAM_EVAL + 1) { killBeam(); endAction(f); return; }
      // ---- espacio
      if (success && !did.space && t >= fireT + BEAM_EVAL + POWER_DUR) {
        did.space = true; killBeam();
        if (isP) {
          spaceT0 = t; cineGrade(true, f); graded = true; scene.fog = null; scene.background = new THREE.Color(0x000004);
          space = rbCosmosEspacio(new V3(f.pos.x, 2600, f.pos.z)); screenFlash(1); sfx('whoosh');
        } else spaceT0 = t;
      }
      // ---- descenso entre nubes y pájaros hasta Redbird
      if (success && did.space && !did.desc && t >= spaceT0 + SPACE_DUR) {
        did.desc = true;
        if (space) { space.dispose(); space = null; }
        if (graded) { cineGrade(false); graded = false; }
        a.bbClip = 'idle_combate'; a.anim = null; descT0 = t;
        if (isP) { desc = rbCosmosDescenso(f.pos); fadeFx(1); }
        screenFlash(.9); sfx('whoosh');
      }
      if (success && did.desc && !did.end && t >= descT0 + DESC_DUR) {
        did.end = true;
        screenFlash(.8); G.shake = 1; sfx('boom', f.pos);
        for (const g of enemiesOf(f)) applyHit(f, g, { dmg: 16, kb: 24, up: 12, ragdoll: 1.6, guardBreak: true, color: '#ff3b30', hitstop: .1, shake: .8 });
        ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffffff', 14, .7);
        endAction(f);
      }
    },
    onEnd: () => { cleanup(); f.cd[o.slot] = Math.max(f.cd[o.slot], 1); },
  });
});
