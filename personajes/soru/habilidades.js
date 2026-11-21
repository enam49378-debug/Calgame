/* ===== personajes/soru/habilidades.js =====
   Habilidades de Soru San (jugador técnico de Minecraft vanilla). Los números (daño, recarga, alcance) están en personaje.js.
   Cada habilidad tiene su propia mecánica y animación por fases (no son copias de las genéricas):
     soruMace      Mazazo en Picada   carga de viento -> vuelo -> picada; el daño crece con la altura alcanzada
     soruRedstone  Circuito Redstone  dibuja un circuito en el suelo; tras un retraso la señal lo recorre, se detiene en el repetidor y explota en la lámpara
     soruElytra    Vuelo de Cohetes   tres impulsos de cohete que giran hacia el rival; cada uno deja una estrella de fuegos artificiales
     soruTotem     Tótem Señuelo      planta un tótem: cura a Soru en su zona y al final revienta y aturde a los rivales cercanos
     soruWind      Carga de Viento    explosión que lanza a todos y deja una corriente de aire que sigue levantando
     soruTntRain   Lluvia de TNT      cada bloque que explota adelanta la mecha de los que están cerca (reacción en cadena)
     soruBeacon    Faro de Poder      faro plantado: dentro de su rayo Soru se cura, corre más y recarga habilidades; los rivales se queman
     soruUlt       Tormenta de Cohetes
   Multijugador: la animación y los efectos se repiten en los demás navegadores; el daño lo calcula quien lanza la habilidad. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    // ---------- la maza de Minecraft (en la espalda y en la mano): mango oscuro, cabeza de hierro con púas y vetas de viento ----------
    WEAPONS.mace = function buildMace() {
      const vox = [], P = (y, z, c) => vox.push([y, z, c]);
      for (let z = -5; z <= 8; z++) { P(0, z, z % 3 ? '#3a3d44' : '#2b2d33'); P(1, z, '#4a4e57'); }
      for (let y = -1; y <= 1; y++) P(y, 3, '#7a4a2b');
      for (let z = 9; z <= 14; z++) for (let y = -3; y <= 3; y++) { const e = Math.abs(y) === 3 || z === 9 || z === 14; P(y, z, e ? '#30343b' : ((y + z) % 2 ? '#5d636d' : '#4a4f58')); }
      for (const [y, z] of [[-4, 11], [-4, 12], [4, 11], [4, 12], [-1, 15], [0, 15], [1, 15], [0, 16], [-3, 8], [3, 8]]) P(y, z, '#8b929e');
      for (const z of [10, 13]) { P(-3, z, '#8fd8ff'); P(3, z, '#8fd8ff'); }
      return buildVoxelWeapon(vox, 1);
    };

    // ---------- utilidades locales ----------
    const bx = (w, h, d, col, op) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op != null ? op : 1 }));
    const free = g => g.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
    // repite fn cada cuadro hasta que devuelva true o se acabe el tiempo; onEnd siempre se ejecuta una vez (también si termina la partida)
    function loop(f, maxT, fn, onEnd) {
      let t = 0, done = false, untrack = () => { };
      const stop = () => { if (done) return; done = true; untrack(); if (onEnd) onEnd(); };
      untrack = trackSkillObj(f, maxT + 1, stop);
      const nd = ndt(), tick = () => {
        if (done) return; const dt = nd(); t += dt; let r = false;
        try { r = fn(dt, t); } catch (e) { console.error(e); r = true; }
        if (r || t >= maxT || G.state !== 'play') stop(); else later(0, tick);
      };
      tick(); return stop;
    }
    const foes = (f, c, r) => enemiesOf(f).filter(g => g.alive && Math.hypot(g.pos.x - c.x, g.pos.z - c.z) < r);
    const gp = (x, z) => new V3(x, groundAt(x, z), z);
    const nearest = (f, range) => { let b = null, bd = range; for (const g of enemiesOf(f)) { if (!g.alive) continue; const d = dist2d(f, g); if (d < bd) { bd = d; b = g; } } return b; };

    // ---------- 1. Mazazo en Picada ----------
    MOVES.soruMace = function (f, o) {
      let phase = 0, maxY = f.pos.y, y0 = f.pos.y, tgt = null, h0 = 0;
      startAction(f, { name: 'soruMace', dur: 4, aim: true, noControl: true, speedMul: 0, anim: [[0, 'land', 700]],
        tick: (a, t) => {
          if (phase === 0 && t > .3) {   // la carga de viento bajo los pies lo lanza al cielo
            phase = 1; tgt = nearest(f, 40); f.vel.y = o.jump || 16; f.onGround = false; y0 = f.pos.y;
            a.anim = [[a.t, 'slamUp', 1100]];
            const p = gp(f.pos.x, f.pos.z); ringAt(p, '#bfe8ff', 5, .5); burst(chestOf(f), 28, '#e6f6ff', 9, .22, .6, .3); sfx('whoosh', f.pos, .9); popText(chestOf(f), 'CARGA DE VIENTO', '#bfe8ff', 22);
            hitArea(f, new V3(p.x, p.y + .5, p.z), 3, { dmg: 3, kb: 8, up: 12, color: '#bfe8ff', hitstop: 0 });
          }
          if (phase === 1) {
            maxY = Math.max(maxY, f.pos.y);
            if (tgt && tgt.alive) { f.yaw = angLerp(f.yaw, yawTo(f, tgt), .15); const F = fwd(f.yaw), d = Math.min(dist2d(f, tgt), 12); f.vel.x = F.x * d * .9; f.vel.z = F.z * d * .9; }
            if (f.vel.y <= 1.5) { phase = 2; h0 = a.t; a.anim = [[a.t, 'ironHover', 1000]]; }   // en lo más alto se queda un instante preparando el golpe
          }
          if (phase === 2) {
            f.vel.y = .5; f.yaw += .5;
            emit(f.pos.x, f.pos.y + 1, f.pos.z, rand(-3, 3), rand(-3, 0), rand(-3, 3), '#bfe8ff', .18, .35, 0, 2);
            if (a.t - h0 > .28) { phase = 3; a.anim = [[a.t, 'fall', 1300]]; const H = maxY - y0; warnCircle(tgt && tgt.alive ? gp(tgt.pos.x, tgt.pos.z) : gp(f.pos.x, f.pos.z), 3 + H * .15, '#ff5a5a', .5); sfx('whoosh', f.pos, .7); }
          }
          if (phase === 3) {
            f.vel.y = -42; if (tgt && tgt.alive) { const dx = tgt.pos.x - f.pos.x, dz = tgt.pos.z - f.pos.z, d = Math.hypot(dx, dz) || 1; f.vel.x = dx / d * Math.min(d * 3, 16); f.vel.z = dz / d * Math.min(d * 3, 16); } else f.vel.x = f.vel.z = 0;
            emit(f.pos.x, f.pos.y + 1.5, f.pos.z, rand(-1, 1), 6, rand(-1, 1), '#ffffff', .22, .3, 0, 2);
            if (f.onGround || f.pos.y <= groundAt(f.pos.x, f.pos.z) + .05) {
              phase = 4; const H = Math.max(0, maxY - y0), c = gp(f.pos.x, f.pos.z), k = Math.min(1.9, 1 + H * .045);   // densidad: más altura, más daño y más radio
              explode(f, new V3(c.x, c.y + .5, c.z), (o.radius || 4) * Math.min(1.5, 1 + H * .03), { dmg: (o.dmg || 15) * k, kb: 16 + H, up: 8 + H * .3, ragdoll: 1.1, guardBreak: true, noRC: true, color: '#e23b3b', hitstop: .12, shake: .6 });
              for (let i = 0; i < 3; i++) later(i * .08, () => ringAt(c, i ? '#bfe8ff' : '#ff5a5a', 4 + i * 3 + H * .2, .45));
              burst(new V3(c.x, c.y + .6, c.z), 40, '#8b929e', 12, .3, .7, .4); shakeFrom(c, .6); sfx('boom', c, .9);
              popText(new V3(c.x, c.y + 2.6, c.z), H > 9 ? 'DENSIDAD x' + k.toFixed(1) : 'MAZAZO', '#ffd24a', 24);
              a.anim = [[a.t, 'land', 900], [a.t + .12, 'heavy', 600]]; f.vel.set(0, 0, 0); a.t = Math.max(a.t, a.dur - .4);
            }
          }
        },
        onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; } });
    };

    // ---------- 2. Circuito de Redstone ----------
    MOVES.soruRedstone = function (f, o) {
      const F = fwd(f.yaw), L = o.len || 14, N = 22, base = front(f, 1.6, 0), pts = [], dust = [], root = new THREE.Group();
      scene.add(root);
      for (let i = 0; i < N; i++) { const d = 1.4 + i * (L - 1.4) / (N - 1); pts.push(gp(base.x + F.x * d, base.z + F.z * d)); }
      const rep = Math.floor(N * .5);
      for (let i = 0; i < N; i++) {
        const isRep = i === rep, m = isRep ? bx(1.3, .22, 1.3, '#9aa0a8') : bx(.5, .08, .9, '#4a0a0a');
        m.position.set(pts[i].x, pts[i].y + (isRep ? .12 : .06), pts[i].z); m.rotation.y = Math.atan2(F.x, F.z); m.scale.setScalar(.01); root.add(m); dust.push(m);
        if (isRep) { const t = bx(.2, .3, .2, '#ff2a2a'); t.position.set(0, .26, .3); m.add(t); }
      }
      const lamp = bx(1.6, 1.2, 1.6, '#6b5a2a'); lamp.position.set(pts[N - 1].x, pts[N - 1].y + .6, pts[N - 1].z); lamp.scale.setScalar(.01); root.add(lamp);
      startAction(f, { name: 'soruRedstone', dur: .95, aim: true, noControl: true, speedMul: 0, anim: [[0, 'land', 700], [.25, 'throw', 900], [.6, 'palm', 900]] });
      sfx('whoosh', f.pos, .6); popText(chestOf(f), 'REDSTONE', '#ff4040', 20);
      let sig = -1, wait = 0, lit = 0, held = false;
      loop(f, 6, (dt, t) => {
        for (let i = 0; i < N; i++) { const k = Math.min(1, Math.max(0, (t * 1.6 - i * .045)) * 3); dust[i].scale.setScalar(Math.max(.01, k)); }
        lamp.scale.setScalar(Math.min(1, t * 2));
        if (t < 1.0) return false;   // el circuito se ve armado un momento: da tiempo a esquivar
        if (sig < 0) { sig = 0; popText(new V3(pts[0].x, pts[0].y + 1.5, pts[0].z), 'señal', '#ff4040', 16); sfx('zap', pts[0], .7); }
        if (wait > 0) { wait -= dt; if (wait <= 0) sig = rep + 1; emit(pts[rep].x, pts[rep].y + .5, pts[rep].z, rand(-1, 1), 3, rand(-1, 1), '#ff4040', .15, .3, 0, 2); return false; }   // el repetidor retiene la señal
        const prev = Math.floor(sig); sig += 26 * dt / ((L - 1.4) / (N - 1));
        for (let i = Math.max(0, prev); i < Math.min(N, Math.floor(sig) + 1); i++) {
          dust[i].material.color.set('#ff2a2a'); const p = pts[i];
          emit(p.x, p.y + .3, p.z, rand(-1, 1), rand(1, 4), rand(-1, 1), '#ff5a3a', .2, .3, 0, 3);
          for (const g of foes(f, p, 1.7)) applyHit(f, g, { dmg: (o.dmg || 9) * .35, stun: .2, kb: 3, up: 5, color: '#ff4040', hitstop: 0 });
          if (i === rep && !held) { held = true; wait = .35; sig = rep; return false; }
        }
        if (sig >= N - 1 && !lit) {
          lit = 1; lamp.material.color.set('#ffe38a'); const c = pts[N - 1];
          explode(f, new V3(c.x, c.y + .8, c.z), 3.6, { dmg: o.dmg || 9, kb: 8, up: 18, ragdoll: 1.1, guardBreak: true, color: '#ffe38a', hitstop: .08, shake: .45 });   // el pistón lo lanza por los aires
          ringAt(c, '#ffe38a', 7, .5); burst(new V3(c.x, c.y + 1, c.z), 30, '#ffe38a', 10, .25, .6, .3); sfx('boom', c, .8); shakeFrom(c, .4);
          return false;
        }
        return lit && t > 3.2;
      }, () => { scene.remove(root); free(root); });
    };

    // ---------- 3. Vuelo de Cohetes ----------
    MOVES.soruElytra = function (f, o) {
      let boosts = 0, nextB = .38, hit = false; const tgt = nearest(f, 40);
      const cols = ['#ff5a5a', '#ffd54f', '#7df9ff', '#9dff7a', '#ff9ef2'];
      startAction(f, { name: 'soruElytra', dur: 1.9, aim: true, noControl: true, speedMul: 0, anim: [[0, 'jump', 700]],
        start: () => { const F = fwd(f.yaw); f.vel.set(F.x * 5, 17, F.z * 5); f.onGround = false; sfx('jump', f.pos, 1.4); ringAt(gp(f.pos.x, f.pos.z), '#ffffff', 3, .35); popText(chestOf(f), 'ÉLITROS', '#ffb347', 20); },
        tick: (a, t) => {
          if (hit) return;
          if (tgt && tgt.alive) f.yaw = angLerp(f.yaw, yawTo(f, tgt), boosts ? .12 : .05);
          if (t > .3 && boosts === 0) a.anim = [[a.t, 'ironFly', 1100]];   // abre los élitros
          if (t >= nextB && boosts < 3) {   // cada cohete le da un impulso hacia donde mira
            boosts++; nextB += .42; const F = fwd(f.yaw), c = chestOf(f), col = cols[boosts % cols.length];
            f.vel.x = F.x * 30; f.vel.z = F.z * 30; f.vel.y = Math.max(f.vel.y * .5, tgt && tgt.alive ? (tgt.pos.y + .5 - f.pos.y) * 1.2 : 1);
            popText(c, String(boosts), col, 18); sfx('fire', f.pos, .5);
            const star = c.clone(); later(.55, () => { explode(f, star, 2.4, { dmg: (o.dmg || 8) * .5, kb: 5, up: 8, color: col, hitstop: 0 }); burst(star, 26, col, 10, .2, .7, 0); ringAt(star, col, 3, .4); sfx('boom', star, .4); });
          }
          if (boosts) { const F = fwd(f.yaw); emit(f.pos.x - F.x * .6, f.pos.y + 1.1, f.pos.z - F.z * .6, -F.x * 5 + rand(-1, 1), rand(-1, 1), -F.z * 5 + rand(-1, 1), '#ffb347', .24, .4, 0, 2); }
          if (boosts && t > .6) for (const g of foes(f, f.pos, 1.8)) if (Math.abs(g.pos.y - f.pos.y) < 2.5) {   // choca con alguien: cierra con una explosión de fuegos
            hit = true; const c = chestOf(f); explode(f, c, 3.4, { dmg: (o.dmg || 8) * 1.6, kb: 12, up: 12, ragdoll: 1.1, guardBreak: true, color: '#ffb347', hitstop: .1, shake: .5 });
            for (let i = 0; i < 4; i++) burst(c, 20, cols[i], 10, .22, .7, .2); ringAt(c, '#ffffff', 5, .4); f.vel.set(0, 5, 0); a.anim = [[a.t, 'fall', 900]]; a.t = Math.max(a.t, a.dur - .5); break;
          }
          if (a.t > a.dur - .5 && !hit) a.anim = [[a.t, 'fall', 900]];
        } });
    };

    // ---------- 4. Tótem Señuelo ----------
    MOVES.soruTotem = function (f, o) {
      const c = gp(f.pos.x, f.pos.z), g = new THREE.Group(); g.add(bx(.9, 1.3, .3, '#e7b93a'));
      const face = bx(.6, .5, .32, '#37c26b'); face.position.y = .25; g.add(face);
      for (const x of [-.15, .15]) { const e = bx(.12, .12, .34, '#1f2a22'); e.position.set(x, .3, 0); g.add(e); } const mo = bx(.3, .1, .34, '#1f2a22'); mo.position.y = .08; g.add(mo);
      g.position.set(c.x, c.y, c.z); g.scale.setScalar(.01); scene.add(g);
      startAction(f, { name: 'soruTotem', dur: .8, aim: false, noControl: true, speedMul: 0, anim: [[0, 'land', 600], [.3, 'castUp', 700]] });
      popText(chestOf(f), 'TÓTEM', '#ffd24a', 24); ringAt(c, '#ffd24a', 3.5, .5); sfx('ult', c, .5);
      const R = 7, life = (o.time || 2) + 1.3; let pulse = 1.0, popped = false, ring = 0;
      loop(f, life + .5, (dt, t) => {
        g.scale.setScalar(Math.min(1, t * 3)); g.position.y = c.y + .65 + Math.sin(t * 3) * .12 + Math.min(t, 1) * .4; g.rotation.y += dt * (2 + t * 2);
        if (t > ring) { ring += .5; ringAt(c, '#ffd24a', R * .7, .35); }
        const near = f.alive && Math.hypot(f.pos.x - c.x, f.pos.z - c.z) < R;
        if (t > pulse) { pulse += 1.1; if (near) { f.hp = Math.min(f.maxHp, f.hp + 4); popText(chestOf(f), '+4', '#7dff9a', 14); } burst(new V3(c.x, c.y + 1.2, c.z), 8, '#ffd24a', 5, .14, .4, .3); }
        if (t > life && !popped) {   // el tótem se rompe: si Soru sigue cerca se salva; los rivales cercanos quedan aturdidos
          popped = true; const p = new V3(c.x, c.y + 1.2, c.z);
          if (near) { f.hp = Math.min(f.maxHp, f.hp + (o.heal || 26)); f.iframes = Math.max(f.iframes, .9); popText(chestOf(f), 'INMORTAL', '#ffd24a', 26); lightColumn(f.pos, '#37c26b', 9); }
          explode(f, p, 5.5, { dmg: 7, kb: 12, up: 7, stun: 1, color: '#ffd24a', hitstop: .06, shake: .4 });
          burst(p, 50, '#ffd24a', 12, .28, .8, .2); burst(p, 30, '#37c26b', 10, .24, .7, .2); ringAt(c, '#ffd24a', 8, .6); sfx('boom', p, .7);
          return true;
        }
        return false;
      }, () => { scene.remove(g); free(g); });
    };

    // ---------- Despierto: Carga de Viento (con corriente que sigue levantando) ----------
    MOVES.soruWind = function (f, o) {
      startAction(f, { name: 'soruWind', dur: .8, aim: false, noControl: true, speedMul: 0, anim: [[0, 'land', 500], [.2, 'castUp', 700]],
        steps: [{ at: .2, fn: () => {
          const c = gp(f.pos.x, f.pos.z);
          explode(f, new V3(c.x, c.y + .6, c.z), o.radius || 5.5, { dmg: o.dmg || 8, kb: o.kb || 22, up: o.up || 14, ragdoll: 1.3, color: '#bfe8ff', hitstop: .08, shake: .4 });
          if (!f.remote) { f.vel.y = 12; f.onGround = false; }
          for (let i = 0; i < 3; i++) later(i * .07, () => ringAt(c, '#bfe8ff', 4 + i * 2.5, .5)); sfx('whoosh', c, .9);
          const col = new THREE.Group(); for (let i = 0; i < 4; i++) col.add(bx(.1, 5, .1, '#e6f6ff', .5)); col.position.set(c.x, c.y + 2.5, c.z); scene.add(col);
          let tick = .6;
          loop(f, 3.2, (dt, t) => {
            col.children.forEach((r, i) => { const a = t * 6 + i * 1.57; r.position.set(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4); r.rotation.y = a; });
            emit(c.x + rand(-2.5, 2.5), c.y + .2, c.z + rand(-2.5, 2.5), 0, rand(6, 11), 0, '#e6f6ff', .16, .6, 0, 2);
            if (t > tick) { tick += .6; for (const g of foes(f, c, 4)) applyHit(f, g, { dmg: 1.2, stun: .1, kb: 0, up: 9, color: '#bfe8ff', hitstop: 0 }); }   // corriente ascendente
            return false;
          }, () => { scene.remove(col); free(col); });
        } }] });
    };

    // ---------- Despierto: Lluvia de TNT con reacción en cadena ----------
    MOVES.soruTntRain = function (f, o) {
      const tg = nearest(f, 30), F = fwd(f.yaw), c = tg ? gp(tg.pos.x, tg.pos.z) : gp(f.pos.x + F.x * 12, f.pos.z + F.z * 12);
      startAction(f, { name: 'soruTntRain', dur: 1.1, aim: true, noControl: true, speedMul: 0, anim: [[0, 'land', 500], [.25, 'castUp', 900]] });
      warnCircle(c, 8.5, '#ff3b30', 1.2); popText(chestOf(f), 'LLUVIA DE TNT', '#ff7a1a', 24); sfx('whoosh', f.pos, .6);
      const list = [], n = o.n || 9;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 7, p = gp(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r), m = bx(.9, .9, .9, '#d8332a');
        m.position.set(p.x, p.y + 22, p.z); m.visible = false; scene.add(m); list.push({ p, m, fall: 1.0 + i * .2, fuse: -1, boom: false });
      }
      const detonate = q => {
        if (q.boom) return; q.boom = true; q.m.visible = false; const p = q.p;
        explode(f, new V3(p.x, p.y + .7, p.z), 3, { dmg: o.dmg || 9, kb: 7, up: 11, ragdoll: .8, color: '#ff7a1a', guardBreak: true });
        fireColumn(p, 2.4, '#ff7a1a'); ringAt(p, '#ffd54f', 5, .4); burst(new V3(p.x, p.y + 1, p.z), 14, '#ff7a1a', 8, .22, .5, .3); sfx('boom', p, .6); shakeFrom(p, .3);
        for (const q2 of list) if (!q2.boom && q2.fuse !== 0 && Math.hypot(q2.p.x - p.x, q2.p.z - p.z) < 5) q2.fuse = q2.fuse < 0 ? .25 : Math.min(q2.fuse, .25);   // la explosión enciende a los vecinos
      };
      loop(f, 1.1 + n * .2 + 2.4, (dt, t) => {
        let alive = 0;
        for (const q of list) {
          if (q.boom) continue; alive++;
          if (t > q.fall || q.fuse >= 0) {
            q.m.visible = true;
            if (q.fuse < 0) { const k = Math.min(1, (t - q.fall) / .45); q.m.position.y = q.p.y + .45 + (1 - k) * (1 - k) * 22; q.m.rotation.y += dt * 4; if (k >= 1) q.fuse = .6; }
            else { q.fuse -= dt; q.m.position.y = Math.min(q.m.position.y, q.p.y + .45); q.m.material.color.set(Math.sin(t * 38) > 0 ? '#ffffff' : '#d8332a'); q.m.scale.setScalar(1 + .1 * Math.sin(t * 40)); if (q.fuse <= 0) { q.fuse = 0; detonate(q); } }
          }
        }
        return alive === 0;
      }, () => { for (const q of list) { scene.remove(q.m); free(q.m); } });
    };

    // ---------- Despierto: Faro de Poder ----------
    MOVES.soruBeacon = function (f, o) {
      const c = gp(f.pos.x, f.pos.z), g = new THREE.Group(), R = 6;
      for (let i = 0; i < 3; i++) { const s = bx(3.2 - i, .5, 3.2 - i, i === 2 ? '#7df9ff' : '#2b3340'); s.position.y = .25 + i * .5; g.add(s); }
      const beam = bx(.7, 60, .7, '#7df9ff', .55); beam.position.y = 31; g.add(beam); g.position.set(c.x, c.y, c.z); g.scale.set(1, .01, 1); scene.add(g);
      startAction(f, { name: 'soruBeacon', dur: .85, aim: false, noControl: true, speedMul: 0, anim: [[0, 'land', 500], [.3, 'castUp', 700]] });
      popText(chestOf(f), 'FARO DE PODER', '#7df9ff', 24); ringAt(c, '#7df9ff', R, .7); sfx('ult', c, .6);
      let tick = 1, burn = .8, ring = 0; const T = o.time || 8;
      loop(f, T, (dt, t) => {
        g.scale.set(1, Math.min(1, t * 3), 1); beam.material.opacity = .45 + .15 * Math.sin(t * 9); beam.scale.x = beam.scale.z = 1 + .1 * Math.sin(t * 12);
        if (t > ring) { ring += .6; ringAt(c, '#7df9ff', R * .8, .4); }
        const inside = f.alive && Math.hypot(f.pos.x - c.x, f.pos.z - c.z) < R;
        if (inside && !f.remote) { f.turbo = Math.max(f.turbo || 0, .4); for (let i = 0; i < 4; i++) if (f.cd[i] > 0) f.cd[i] = Math.max(0, f.cd[i] - dt * 1.2); }   // dentro del rayo: más rápido y habilidades que se recargan antes
        if (t > tick) { tick += 1; if (inside) f.hp = Math.min(f.maxHp, f.hp + (o.heal || 14) / T); }
        if (t > burn) { burn += .8; for (const e of foes(f, c, R)) applyHit(f, e, { dmg: 1.8, stun: 0, kb: 0, color: '#7df9ff', hitstop: 0 }); }
        return false;
      }, () => { scene.remove(g); free(g); });
    };

    // ---------- Ulti: Tormenta de Cohetes ----------
    MOVES.soruUlt = function (f, o) {
      startAction(f, { name: 'soruUlt', dur: 3.3, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 500], [.8, 'ironHover', 1100]],
        tick: (a, t) => { if (t > .7 && t < 3 && !f.remote) { f.vel.y = Math.max(f.vel.y, t < 1.4 ? 9 : 0); f.yaw += .02; } },   // sube con los élitros y se queda en el aire
        steps: [{ at: .8, fn: () => { ringAt(gp(f.pos.x, f.pos.z), '#ff7a1a', 6, .6); lightColumn(f.pos, '#ff7a1a', 14); sfx('ult', f.pos); if (f.isPlayer) showBanner('TORMENTA DE COHETES', '#ff7a1a', 'Cohetes y TNT sobre todos los rivales'); } }] });
      const cols = ['#ff5a5a', '#ffd54f', '#7df9ff', '#9dff7a', '#ff9ef2'];
      for (let i = 0; i < (o.n || 11); i++) later(1.0 + i * .17, () => {
        if (!f.alive) return; const es = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < 36), tg = es.length ? es[i % es.length] : null, a = Math.random() * TAU, r = tg ? rand(0, 2.2) : rand(4, 14);
        const p = gp((tg ? tg.pos.x : f.pos.x) + Math.cos(a) * r, (tg ? tg.pos.z : f.pos.z) + Math.sin(a) * r), col = cols[i % cols.length]; warnCircle(p, 2.5, col, .55);
        const from = chestOf(f); for (let k = 0; k < 6; k++) emit(from.x + (p.x - from.x) * k / 6, from.y + (p.y + 12 - from.y) * k / 6 + (6 - k) * .6, from.z + (p.z - from.z) * k / 6, 0, 0, 0, col, .28, .35, 0, 1);
        later(.55, () => { explode(f, new V3(p.x, p.y + .6, p.z), 2.7, { dmg: o.dmg || 6.5, kb: 4, up: 10, ragdoll: .8, color: col, guardBreak: true }); fireColumn(p, 2.2, col); burst(new V3(p.x, p.y + 1.5, p.z), 22, col, 9, .22, .6, .2); ringAt(p, col, 4, .35); sfx('boom', p, .6); shakeFrom(p, .3); });
      });
    };
  }
});
