/* Habilidad: Ojo del Cosmos  ·  personaje: redbird  ·  movimiento: rbCosmos   (habilidad 4 del despertar)
   Cinemática: cámara a ras del suelo -> Redbird camina hacia ella -> primer plano de la cara -> se desploma de rodillas
   y grita -> dispara un rayo gigante (cámara libre). Si el rayo mata a "need" rivales o más, la escena sigue:
   plano lateral del rayo creciendo -> espacio: la Tierra se rompe por el rayo (escena anime) -> nubes -> vuelve el juego.
   Los números (daño, recarga, rivales necesarios) están en personaje.js. La escena del espacio está en espacio-cosmos.js. */
CF.mover('rbCosmos', function (f, o) {
  const NEED_BASE = o.need || 3, isP = !!f.isPlayer && !f.remote, BEAM_DMG = o.dmg || 8.5, LEN = 95;
  const foes = enemiesOf(f).filter(g => g.alive);
  if (!foes.length) return false;
  const NEED = Math.min(NEED_BASE, foes.length);

  // ---- dirección del rayo: la que más rivales tiene dentro (o el más cercano)
  let best = foes[0], bs = -1e9;
  for (const g of foes) {
    const F0 = fwd(yawTo(f, g)); let n = 0;
    for (const h of foes) { const c = chestOf(h), dx = c.x - f.pos.x, dz = c.z - f.pos.z; if (dx * F0.x + dz * F0.z > 0 && Math.abs(dx * F0.z - dz * F0.x) < 3.2) n++; }
    const sc = n * 100 - dist2d(f, g); if (sc > bs) { bs = sc; best = g; }
  }
  const Y = yawTo(f, best), F = fwd(Y), Rr = rightOf(Y);
  const R0 = f.pos.clone();
  for (let i = 0; i < 12 && Math.hypot(R0.x + F.x * 3.8, R0.z + F.z * 3.8) > ARENA - 2; i++) R0.addScaledVector(F, -.5);   // que no se salga de la arena
  const gy = R0.y, S0 = R0.clone().addScaledVector(F, -4), E = R0.clone().addScaledVector(F, 3.8), C0 = R0.clone().addScaledVector(F, 8);

  // ---- tiempos (segundos desde que empieza la habilidad)
  const T_SHOW = .9, T_WALK_END = 3.4, T_CAM_UP = 3.0, T_FACE = 4.4, T_COLLAPSE = 5.0, T_KNEEL = 5.8, T_FIRE = 7.2;
  const BEAM_EVAL = 2.8, POWER_DUR = 3.0, SPACE_DUR = 7.4;

  // ---- poses (de rodillas: cuerpo bajo, piernas hacia atrás, torso y cabeza hacia atrás)
  const KNEEL_A = { by: -8, ix: .12, tx: .2, hx: -.1, llx: .9, lrx: .9, llz: .1, lrz: -.1, alx: -.35, arx: -.35, alz: .35, arz: -.35 };
  const SCREAM = { by: -10.5, ix: -.06, tx: -.4, hx: -1, llx: 1.3, lrx: 1.3, llz: .18, lrz: -.18, alx: -.2, arx: -.2, alz: .6, arz: -.6 };
  const FIRE_P = Object.assign({}, SCREAM, { hx: -1.15, tx: -.5, alz: .75, arz: -.75 });
  const eyes = () => front(f, .35, 1.72 - 10.5 * PX);

  // ---- estado
  const did = {}; let fireT = 0, k0 = 0, success = false, beamG = null, space = null, spaceT0 = 0, graded = false, acc = 0, powered = false, finished = false;
  let A = null, mine = null;
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3), lerpV = (a, b, k) => a.clone().lerp(b, clamp(k, 0, 1));

  // ---- velo de nubes para la transición
  let fx = document.getElementById('cosmosfx');
  if (!fx) {
    fx = document.createElement('div'); fx.id = 'cosmosfx'; fx.style.cssText = 'position:fixed;inset:0;z-index:55;pointer-events:none;opacity:0;background-size:cover;background-position:center;';
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512; const c = cv.getContext('2d');
    for (let i = 0; i < 90; i++) { const x = rand(0, 512), y = rand(0, 512), r = rand(40, 130), gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    fx.style.backgroundImage = 'url(' + cv.toDataURL() + ')'; fx.style.backgroundColor = 'rgba(190,220,255,0)'; document.body.appendChild(fx);
  }
  const setFx = (clouds, white, sc) => { fx.style.opacity = clouds; fx.style.transform = 'scale(' + sc + ')'; fx.style.backgroundColor = 'rgba(' + Math.round(190 + 65 * white) + ',' + Math.round(220 + 35 * white) + ',255,' + white + ')'; };

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

  const cleanup = () => {
    if (finished) return; finished = true;
    killBeam(); if (space) { try { space.dispose(); } catch (e) { } space = null; }
    if (graded) { cineGrade(false); graded = false; }
    setFx(0, 0, 1); document.body.classList.remove('cine');
    f.cineHide = false; f.iframes = Math.min(f.iframes, .6);
    if (mine && G.camScript === mine) G.camScript = null;
  };

  const camFn = (dt) => {
    if (finished || f.action !== A) { cleanup(); return false; }
    const t = A.t, g0 = gy + .12;
    if (t < T_CAM_UP) {   // a ras del suelo mirando hacia donde vendrá Redbird: al principio no se ve nada
      setCam(new V3(C0.x, g0, C0.z), new V3(C0.x - F.x * 10, gy + .7, C0.z - F.z * 10), 38, 0);
    } else if (t < T_FACE) {   // sube hacia la cara
      const k = ease((t - T_CAM_UP) / (T_FACE - T_CAM_UP)), face = new V3(E.x + F.x * 2.7 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.7 + Rr.z * .35);
      setCam(lerpV(new V3(C0.x, g0, C0.z), face, k), lerpV(new V3(E.x, gy + .9, E.z), new V3(E.x, gy + 1.6, E.z), k), 38 - 8 * k, -.05 * k);
    } else if (t < T_COLLAPSE) {   // primer plano de la cara, cada vez más tenso
      const k = (t - T_FACE) / (T_COLLAPSE - T_FACE), face = new V3(E.x + F.x * (2.7 - k * .5) + Rr.x * .35, gy + 1.62, E.z + F.z * (2.7 - k * .5) + Rr.z * .35);
      G.shake = Math.max(G.shake, .03 + k * .12); setCam(face, new V3(E.x, gy + 1.6, E.z), 30 - 4 * k, -.05);
    } else if (t < T_KNEEL) {   // se desploma: la cámara se aleja y baja
      const k = ease((t - T_COLLAPSE) / (T_KNEEL - T_COLLAPSE)), from = new V3(E.x + F.x * 2.2 + Rr.x * .35, gy + 1.62, E.z + F.z * 2.2 + Rr.z * .35), to = new V3(E.x + F.x * 4.2 + Rr.x, gy + .55, E.z + F.z * 4.2 + Rr.z);
      setCam(lerpV(from, to, k), new V3(E.x, gy + 1.6 - .6 * k, E.z), 26 + 22 * k, .06 * k);
    } else if (t < T_FIRE) {   // de rodillas, cargando
      const k = (t - T_KNEEL) / (T_FIRE - T_KNEEL);
      G.shake = Math.max(G.shake, .05 + k * .2);
      setCam(new V3(E.x + F.x * (4.2 - k) + Rr.x * (1 - .35 * k), gy + .55 - .1 * k, E.z + F.z * (4.2 - k) + Rr.z * (1 - .35 * k)), new V3(E.x, gy + .95, E.z), 48 - 8 * k, .06);
    } else if (!powered && !space) {   // cámara libre: solo se ve el rayo
      const s = t - fireT, ang = s * .1;
      setCam(new V3(E.x - F.x * (6.5 + s * .5) + Rr.x * 1.8, gy + 2.3 + s * .25, E.z - F.z * (6.5 + s * .5) + Rr.z * 1.8), new V3(E.x + F.x * (18 + s * 2), gy + 1.3, E.z + F.z * (18 + s * 2)), 62 + Math.sin(ang) * 2, .04);
      G.shake = Math.max(G.shake, .22);
    } else if (powered && !space) {   // costado izquierdo de Redbird: el rayo se hace más fuerte
      const s = t - (fireT + BEAM_EVAL), k = clamp(s / POWER_DUR, 0, 1);
      setCam(new V3(E.x - Rr.x * (6.2 - k * .8) - F.x * (3.2 - k * 1.2), gy + 3.0 + k * .3, E.z - Rr.z * (6.2 - k * .8) - F.z * (3.2 - k * 1.2)), new V3(E.x + F.x * (2.2 + k * 2), gy + 1.1, E.z + F.z * (2.2 + k * 2)), 52 - 6 * k, -.05 * k);
      G.shake = Math.max(G.shake, .25 + k * .25);
    } else if (space) {   // espacio: la Tierra se rompe
      const s = t - spaceT0, O = space.origin, d = space.dir;
      space.update(s, dt, camera.position);
      if (s < 2.2) {
        const a = .5 + s * .12, dist = 170 - s * 22, e = ease(s / 2.2);
        setCam(new V3(O.x + Math.cos(a) * dist, O.y + 28 - e * 10, O.z + Math.sin(a) * dist), O, 42 - e * 4, 0);
      } else if (s < 4.2) {   // corte anime: el rayo sale del planeta
        if (!did.boom) { did.boom = true; impactFrame('#ffffff', .14); screenFlash(1); G.shake = 1.4; sfx('boom', f.pos); sfx('beam', f.pos); G.linesI = 1; }
        const k = (s - 2.2) / 2;
        setCam(new V3(O.x - 85 + k * 14, O.y - 14, O.z + 90 - k * 10), new V3(O.x + d.x * 30, O.y + d.y * 30, O.z + d.z * 30), 62 - k * 6, .12 - k * .1);
        G.shake = Math.max(G.shake, .6 * (1 - k));
      } else if (s < 5.8) {   // plano abierto con los pedazos flotando
        const k = (s - 4.2) / 1.6;
        setCam(new V3(O.x + 210 - k * 40, O.y + 55 - k * 20, O.z + 110), new V3(O.x + d.x * 40, O.y + d.y * 40, O.z + d.z * 40), 50 + k * 4, 0);
      } else {   // la cámara se lanza al planeta entre nubes
        const k = clamp((s - 5.8) / (SPACE_DUR - 5.8), 0, 1), e = k * k, from = new V3(O.x + 170, O.y + 35, O.z + 110);
        setCam(lerpV(from, O, e * .97), O, 54 + 28 * e, k * .3);
        const cl = clamp((k - .25) / .5, 0, 1); setFx(cl, clamp((k - .72) / .28, 0, 1), 1 + cl * 1.6);
      }
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
      f.iframes = Math.max(f.iframes, 1); f.yaw = Y;
      // ---- llegada caminando
      if (isP && !f.remote) {
        if (t < T_SHOW) { f.pos.set(S0.x, S0.y, S0.z); f.cineHide = true; }
        else if (t < T_WALK_END) { f.cineHide = false; const k = (t - T_SHOW) / (T_WALK_END - T_SHOW); f.pos.set(S0.x + (E.x - S0.x) * k, S0.y, S0.z + (E.z - S0.z) * k); }
        else if (t < T_COLLAPSE + .6) { f.pos.set(E.x, E.y, E.z); }
        if (t >= T_SHOW && t < T_WALK_END && a.bbClip !== 'caminar') a.bbClip = 'caminar';
        if (t >= T_WALK_END && t < T_COLLAPSE && a.bbClip !== 'idle') a.bbClip = 'idle';
      } else if (isP) { f.cineHide = t < T_SHOW; }
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
      if (did.fire && beamG && !space) {
        const s = t - fireT, org = eyes(), grow = powered ? 1 : Math.min(1, s / .35), w = (powered ? 2.7 + Math.min(.9, (t - fireT - BEAM_EVAL) * .4) : 2.1) * grow, pul = 1 + Math.sin(t * 50) * .1;
        beamG.position.copy(org); beamG.rotation.y = f.yaw;
        const ow = (powered ? w * 1.05 : w * 2) * pul; beamG.children[0].scale.set(ow, ow, 1); beamG.children[1].scale.set(powered ? w * .4 : w * .55, powered ? w * .4 : w * .55, 1);
        if (powered) { beamG.children[0].material.color.set('#ff3a2a'); }
        const end = org.clone().addScaledVector(F, LEN);
        for (let i = 0; i < 3; i++) { const q = org.clone().addScaledVector(F, rand(2, LEN * .5)); emit(q.x, q.y + rand(-1, 1), q.z, rand(-5, 5), rand(0, 5), rand(-5, 5), powered ? '#ffffff' : '#ff2d55', .22, .35, .3); }
        emit(end.x, end.y, end.z, rand(-8, 8), rand(0, 8), rand(-8, 8), '#ff7a1a', .3, .4, .5);
        if (involvesPlayerNear(f)) G.shake = Math.max(G.shake, powered ? .4 : .25);
        acc += dt;
        while (acc >= .1) {
          acc -= .1;
          for (const g of enemiesOf(f)) {
            const c = chestOf(g);
            if (segDist(c, org, end) < w + .9 && Math.abs(c.y - org.y) < w + 2.2 && (c.x - org.x) * F.x + (c.z - org.z) * F.z > -.5)
              applyHit(f, g, { dmg: BEAM_DMG * (powered ? 1.5 : 1), stun: .4, kb: 7, up: 1, dir: F, guardBreak: true, color: powered ? '#ffffff' : '#ff2d55', hitstop: 0, shake: .2 });
          }
        }
      }
      // ---- ¿alcanzó? (si no, termina; si sí, sigue la escena)
      if (did.fire && !did.eval && t >= fireT + BEAM_EVAL) {
        did.eval = true; const killed = f.kills - k0; success = killed >= NEED;
        if (success) {
          powered = true; popText(chestOf(f), '¡EL COSMOS RESPONDE!', '#ffffff', 28); sfx('ult', f.pos); screenFlash(.9); impactFrame('#ff2d55', .1); G.linesI = 1;
          if (!isP) { /* los bots no ven la escena: solo el golpe final */ }
        } else popText(chestOf(f), 'Rayo ' + killed + '/' + NEED, '#aab', 18);
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
      if (success && did.space && !did.end && t >= spaceT0 + SPACE_DUR) {
        did.end = true;
        if (space) { space.dispose(); space = null; }
        if (graded) { cineGrade(false); graded = false; }
        // vuelta al juego: velo de nubes que se disuelve
        let k = 0; const back = () => { k += .03; setFx(clamp(1 - k, 0, 1), clamp(1 - k * 1.4, 0, 1), 2.6 + k * 1.4); if (k < 1) requestAnimationFrame(back); else setFx(0, 0, 1); };
        setFx(1, 1, 2.6); requestAnimationFrame(back);
        screenFlash(.8); G.shake = 1; sfx('boom', f.pos);
        for (const g of enemiesOf(f)) applyHit(f, g, { dmg: 16, kb: 24, up: 12, ragdoll: 1.6, guardBreak: true, color: '#ff3b30', hitstop: .1, shake: .8 });
        ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffffff', 14, .7);
        endAction(f);
      }
    },
    onEnd: () => { cleanup(); f.cd[o.slot] = Math.max(f.cd[o.slot], 1); },
  });
});
