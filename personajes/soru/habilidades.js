/* ===== personajes/soru/habilidades.js =====
   Código de las habilidades de Soru San y su maza de Minecraft. Los números (daño, recarga, alcance) están en personaje.js.
   Se ejecuta dentro de js/game.js (como js/habilidades.js): usa sus funciones directamente (startAction, hitArea, explode, ...).
   Multijugador: cada habilidad se dibuja igual en todos los navegadores (los demás la ven al avisarse la acción); el daño lo cuenta quien la lanza. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const CF = { mover: (n, fn) => { MOVES[n] = fn; } };

    // ---------- la maza de Minecraft (en la espalda y en la mano): mango oscuro, cabeza de hierro con púas y un remolino de viento ----------
    WEAPONS.mace = function buildMace() {
      const vox = [], P = (y, z, c) => vox.push([y, z, c]);
      for (let z = -5; z <= 8; z++) { P(0, z, z % 3 ? '#3a3d44' : '#2b2d33'); P(1, z, '#4a4e57'); }
      for (let y = -1; y <= 1; y++) P(y, 3, '#7a4a2b');
      for (let z = 9; z <= 14; z++) for (let y = -3; y <= 3; y++) { const e = Math.abs(y) === 3 || z === 9 || z === 14; P(y, z, e ? '#30343b' : ((y + z) % 2 ? '#5d636d' : '#4a4f58')); }
      for (const [y, z] of [[-4, 11], [-4, 12], [4, 11], [4, 12], [-1, 15], [0, 15], [1, 15], [0, 16], [-3, 8], [3, 8]]) P(y, z, '#8b929e');
      for (const z of [10, 13]) { P(-3, z, '#8fd8ff'); P(3, z, '#8fd8ff'); }   // vetas de viento
      return buildVoxelWeapon(vox, 1);
    };

    // ---------- Élitros y Cohete: salta, enciende un cohete y atraviesa en vuelo a quien se cruce ----------
    CF.mover('soruElytra', function (f, o) {
      let hit = false;
      startAction(f, { name: 'soruElytra', dur: 1.05, aim: true, noControl: true, lockYaw: true, ghost: true, anim: [[0, 'jump', 500], [.3, 'slamUp', 800]],
        start: () => { const F = fwd(f.yaw); f.vel.set(F.x * 9, 14, F.z * 9); f.onGround = false; sfx('jump', f.pos, 1.6); ringAt(new V3(f.pos.x, f.pos.y + .2, f.pos.z), '#ffffff', 2.4, .35); popText(chestOf(f), '¡COHETE!', '#ffb347', 22); },
        tick: (a, t) => {
          if (t > .3 && t < .95) {
            const F = fwd(f.yaw); f.vel.x = F.x * 26; f.vel.z = F.z * 26; f.vel.y = Math.max(f.vel.y * .6, 0) + 1.6;   // planea hacia delante con el cohete
            for (let i = 0; i < 2; i++) emit(f.pos.x - F.x * .5, f.pos.y + rand(.5, 1.8), f.pos.z - F.z * .5, -F.x * 6 + rand(-1, 1), rand(-1, 1), -F.z * 6 + rand(-1, 1), Math.random() < .5 ? '#ffb347' : '#fff3c4', .22, .35, 0, 1);
            if (!hit && hitArea(f, front(f, .9, 1.1), 1.5, { dmg: o.dmg || 8, kb: 4, up: 14, ragdoll: 1.1, color: '#ffb347', guardBreak: true, hitstop: .08, shake: .35 })) { hit = true; ringAt(chestOf(f), '#ffb347', 2.6, .3); }
          }
        },
        onEnd: () => { f.vel.x *= .25; f.vel.z *= .25; } });
    });

    // ---------- Cañón de TNT: bloques de TNT que vuelan en arco, parpadean y explotan ----------
    let tntTex = null;
    function tntMaterial() {
      if (!tntTex) tntTex = pixTex(32, 32, g => { g.fillStyle = '#d8332a'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#f2ece0'; g.fillRect(0, 10, 32, 12); g.fillStyle = '#3a2a22'; g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TNT', 16, 16.5); g.fillStyle = '#a9231c'; for (let x = 3; x < 32; x += 7) g.fillRect(x, 0, 2, 10), g.fillRect(x, 22, 2, 10); });
      return new THREE.MeshLambertMaterial({ map: tntTex });
    }
    function launchTnt(f, o, off, target) {
      const F = fwd(f.yaw + off), from = front(f, .8, 1.7), g0 = 24;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(.8, .8, .8), tntMaterial()); mesh.position.copy(from); mesh.castShadow = true; scene.add(mesh);
      let dist = 12; if (target) dist = clamp(Math.hypot(target.x - from.x, target.z - from.z), 5, 26);
      const T = clamp(dist / 14, .55, 1.5), vel = new V3(F.x * dist / T, g0 * T / 2 - (from.y - groundAt(from.x, from.z)) / T, F.z * dist / T);
      let done = false, untrack = () => { }, life = 0, fuse = -1;
      const stop = () => { if (done) return; done = true; untrack(); scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); };
      untrack = trackSkillObj(f, 5, stop);
      const nd = ndt(), tick = () => {
        if (done) return; const dt = nd(); life += dt;
        if (fuse < 0) {
          vel.y -= g0 * dt; mesh.position.addScaledVector(vel, dt); mesh.rotation.x += dt * 5; mesh.rotation.z += dt * 3;
          const gy = groundAt(mesh.position.x, mesh.position.z);
          if (mesh.position.y < gy + .42) { mesh.position.y = gy + .42; fuse = .55; vel.set(0, 0, 0); mesh.rotation.set(0, mesh.rotation.y, 0); sfx('whoosh', mesh.position, .3); }
        } else {
          fuse -= dt; mesh.scale.setScalar(1 + .12 * Math.sin(life * 40)); mesh.material.emissive.setRGB(Math.sin(life * 36) > 0 ? .9 : 0, Math.sin(life * 36) > 0 ? .9 : 0, Math.sin(life * 36) > 0 ? .9 : 0);
          emit(mesh.position.x, mesh.position.y + .6, mesh.position.z, rand(-1, 1), rand(2, 4), rand(-1, 1), '#ffb347', .14, .3, 0, 1);
          if (fuse <= 0) { const p = mesh.position.clone(); explode(f, p, 3.4, { dmg: o.dmg || 8, kb: 9, up: 12, ragdoll: .9, color: '#ff7a1a', guardBreak: true, hitstop: .08, shake: .45 }); const gp = new V3(p.x, groundAt(p.x, p.z), p.z); fireColumn(gp, 2.4, '#ff7a1a', 5); ringAt(gp, '#ffd54f', 6, .5); sfx('boom', p, .8); stop(); return; }
        }
        if (G.state === 'play') later(0, tick); else stop();
      };
      tick();
    }
    CF.mover('soruTnt', function (f, o) {
      const tg = findTarget(f, 26), tp = tg ? tg.pos : null;
      startAction(f, { name: 'soruTnt', dur: .75, aim: true, speedMul: .3, anim: [[0, 'throwW', 700], [.15, 'throw', 1100]],
        steps: [{ at: .22, fn: () => { const n = o.n || 3; for (let i = 0; i < n; i++) later(i * .12, () => { if (f.alive) launchTnt(f, o, (i - (n - 1) / 2) * .18, tp); }); sfx('whoosh', f.pos, .6); } }] });
    });

    // ---------- Tótem de la Inmortalidad ----------
    CF.mover('soruTotem', function (f, o) {
      startAction(f, { name: 'soruTotem', dur: .9, aim: false, speedMul: .4, anim: [[0, 'charge', 500], [.4, 'castUp', 700]] });
      f.hp = Math.min(f.maxHp, f.hp + (o.heal || 28)); f.iframes = Math.max(f.iframes, o.time || 2);
      const g = new THREE.Group(), mk = (w, h, d, c, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, 0); g.add(m); };
      mk(.8, 1.1, .25, '#e7b93a', 0, 0); mk(.5, .45, .27, '#37c26b', 0, .22); mk(.12, .12, .28, '#1f2a22', -.14, .28); mk(.12, .12, .28, '#1f2a22', .14, .28); mk(.3, .1, .28, '#1f2a22', 0, .05);
      g.position.set(f.pos.x, f.pos.y + 2.3, f.pos.z); scene.add(g);
      let done = false, untrack = () => { }, t = 0; const stop = () => { if (done) return; done = true; untrack(); scene.remove(g); g.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); };
      untrack = trackSkillObj(f, 2, stop);
      const nd = ndt(), tick = () => { if (done) return; const dt = nd(); t += dt; g.position.set(f.pos.x, f.pos.y + 2.3 + t * .8, f.pos.z); g.rotation.y += dt * 9; g.scale.setScalar(1 + Math.sin(t * 14) * .08); if (t < 1.1 && f.alive && G.state === 'play') later(0, tick); else stop(); };
      tick();
      ringAt(new V3(f.pos.x, f.pos.y + .3, f.pos.z), '#ffd24a', 3.2, .6); lightColumn(f.pos, '#37c26b', 9); burst(chestOf(f), 36, '#ffd24a', 9, .25, .7, -.2); burst(chestOf(f), 24, '#37c26b', 8, .25, .7, -.2);
      popText(chestOf(f), '¡TÓTEM!', '#ffd24a', 26); sfx('ult', f.pos, .6);
    });

    // ---------- Despierto: Lluvia de TNT y Faro de Poder ----------
    CF.mover('soruTntRain', function (f, o) {
      const tg = findTarget(f, 28), F = fwd(f.yaw), c = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12); c.y = groundAt(c.x, c.z);
      startAction(f, { name: 'soruTntRain', dur: 1.0, aim: true, speedMul: 0, anim: [[0, 'castUp', 1000]] });
      warnCircle(c, 8, '#ff3b30', 1.3); popText(chestOf(f), '¡LLUVIA DE TNT!', '#ff7a1a', 24); sfx('whoosh', f.pos, .6);
      for (let i = 0; i < (o.n || 8); i++) later(.9 + i * .22, () => {
        if (!f.alive) return; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 7, p = new V3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r); p.y = groundAt(p.x, p.z);
        for (let k = 0; k < 4; k++) emit(p.x, p.y + 12 - k * 2.5, p.z, 0, -26, 0, '#d8332a', .45, .4, 0, 1);
        later(.45, () => { if (!f.alive) return; explode(f, new V3(p.x, p.y + .6, p.z), 3, { dmg: o.dmg || 9, kb: 7, up: 11, ragdoll: .8, color: '#ff7a1a', guardBreak: true }); fireColumn(p, 2.4, '#ff7a1a'); ringAt(p, '#ffd54f', 5, .4); sfx('boom', p, .6); shakeFrom(p, .3); });
      });
    });
    CF.mover('soruBeacon', function (f, o) {
      startAction(f, { name: 'soruBeacon', dur: .9, aim: false, speedMul: .3, anim: [[0, 'charge', 500], [.4, 'castUp', 700]] });
      f.hp = Math.min(f.maxHp, f.hp + (o.heal || 14)); f.buf = Math.max(f.buf || 0, o.time || 8);   // las habilidades se recargan más rápido
      lightColumn(f.pos, '#7df9ff', 16); ringAt(new V3(f.pos.x, f.pos.y + .3, f.pos.z), '#7df9ff', 4, .7); ringAt(new V3(f.pos.x, f.pos.y + .4, f.pos.z), '#ffffff', 2.4, .5);
      popText(chestOf(f), 'FARO DE PODER', '#7df9ff', 24); sfx('ult', f.pos, .6);
    });

    // ---------- Ulti: Tormenta de Cohetes ----------
    CF.mover('soruUlt', function (f, o) {
      startAction(f, { name: 'soruUlt', dur: 3.1, aim: true, speedMul: 0, noControl: true, anim: [[0, 'charge', 500], [.9, 'castUp', 1200]],
        steps: [{ at: .9, fn: () => { ringAt(new V3(f.pos.x, f.pos.y + .2, f.pos.z), '#ff7a1a', 6, .6); lightColumn(f.pos, '#ff7a1a', 14); sfx('ult', f.pos); if (f.isPlayer) showBanner('TORMENTA DE COHETES', '#ff7a1a', 'Cohetes y TNT sobre todos los rivales'); } }] });
      const cols = ['#ff5a5a', '#ffd54f', '#7df9ff', '#9dff7a', '#ff9ef2'];
      for (let i = 0; i < (o.n || 11); i++) later(1.0 + i * .17, () => {
        if (!f.alive) return; const es = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < 36), tg = es.length ? es[i % es.length] : null, a = Math.random() * TAU, r = tg ? rand(0, 2.2) : rand(4, 14);
        const p = new V3((tg ? tg.pos.x : f.pos.x) + Math.cos(a) * r, 0, (tg ? tg.pos.z : f.pos.z) + Math.sin(a) * r); p.y = groundAt(p.x, p.z); const col = cols[i % cols.length]; warnCircle(p, 2.5, col, .55);
        for (let k = 0; k < 5; k++) emit(p.x, p.y + 14 - k * 2.4, p.z, 0, -24, 0, col, .35, .4, 0, 1);
        later(.55, () => { explode(f, new V3(p.x, p.y + .6, p.z), 2.7, { dmg: o.dmg || 6.5, kb: 4, up: 10, ragdoll: .8, color: col, guardBreak: true }); fireColumn(p, 2.2, col); burst(new V3(p.x, p.y + 1.5, p.z), 22, col, 9, .22, .6, .2); sfx('boom', p, .6); shakeFrom(p, .3); });
      });
    });
  }
});
