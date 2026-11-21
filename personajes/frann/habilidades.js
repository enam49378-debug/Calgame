/* ===== personajes/frann/habilidades.js =====
   Código de las habilidades de SoyFrann (hacker). Los números están en personaje.js.
   Se ejecuta dentro de js/game.js: usa sus funciones directamente. Multijugador: se ve igual en todos los navegadores; el daño lo cuenta quien la lanza. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const GREEN = '#32ff7e';

    // ---------- DDoS: paquetes que persiguen al rival y lo dejan inmóvil ----------
    MOVES.frannDdos = function (f, o) {
      
      startAction(f, { name: 'frannDdos', dur: .6, aim: true, speedMul: .3, anim: [[0, 'charge', 600], [.13, 'palm', 1000]],
        steps: [{ at: .16, fn: () => {
          for (let i = 0; i < 3; i++) later(i * .08, () => { if (f.alive) spawnProj(f, f.yaw + (i - 1) * .12, { color: GREEN, size: .35, speed: 36, range: o.range || 20, homing: 7, dmg: (o.dmg || 11) / 3, stun: (o.stun || 1.2) / 3 + .25, kb: 1 }); });
          popText(chestOf(f), 'DDoS', GREEN, 20); sfx('zap', f.pos, .7);
        } }] });
    };

    // ---------- Virus: se pega al rival y le quita vida con el tiempo ----------
    MOVES.frannVirus = function (f, o) {
      
      startAction(f, { name: 'frannVirus', dur: .55, aim: true, speedMul: .3, anim: [[0, 'throwW', 700], [.12, 'throw', 1100]],
        steps: [{ at: .15, fn: () => {
          spawnProj(f, f.yaw, { color: '#7dff2a', size: .55, speed: 30, range: o.range || 22, homing: 5, onHit: g => {
            applyHit(f, g, { dmg: 2, stun: .2, kb: 1, color: '#7dff2a', hitstop: 0 });
            poisonOn(g, f, { dps: (o.dmg || 3) * 0.9, dur: o.ticks || 6, col: '#7dff2a', label: 'VIRUS' });
          } });
          sfx('whoosh', f.pos, .6);
        } }] });
    };

    // ---------- Firewall: muro de datos que bloquea y empuja ----------
    MOVES.frannFirewall = function (f, o) {
      const F = fwd(f.yaw), c = new V3(f.pos.x + F.x * 3.2, 0, f.pos.z + F.z * 3.2); c.y = groundAt(c.x, c.z);
      startAction(f, { name: 'frannFirewall', dur: .7, aim: false, speedMul: .2, anim: [[0, 'charge', 500], [.35, 'castUp', 700]] });
      const R = rightOf(f.yaw), mesh = new THREE.Group(), cells = [];
      for (let i = -3; i <= 3; i++) for (let j = 0; j < 3; j++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .25), new THREE.MeshBasicMaterial({ color: (i + j) % 2 ? '#32ff7e' : '#0f7a3c', transparent: true, opacity: .75 }));
        m.position.set(i * .95, .5 + j * .95, 0); mesh.add(m); cells.push(m);
      }
      mesh.position.copy(c); mesh.rotation.y = Math.atan2(F.x, F.z); scene.add(mesh);
      let done = false, untrack = () => { }, t = 0;
      const stop = () => { if (done) return; done = true; untrack(); scene.remove(mesh); for (const m of cells) { m.geometry.dispose(); m.material.dispose(); } };
      untrack = trackSkillObj(f, (o.time || 4) + 1, stop);
      ringAt(c, GREEN, 4, .5); popText(chestOf(f), 'FIREWALL', GREEN, 22); sfx('whoosh', f.pos, .6);
      const nd = ndt(), tick = () => {
        if (done) return; const dt = nd(); t += dt;
        for (let i = 0; i < cells.length; i++) cells[i].material.opacity = .55 + .25 * Math.sin(t * 8 + i);
        for (const g of enemiesOf(f)) {
          if (!g.alive) continue; const dx = g.pos.x - c.x, dz = g.pos.z - c.z, along = dx * R.x + dz * R.z, across = dx * F.x + dz * F.z;
          if (Math.abs(along) < 3.2 && Math.abs(across) < 1) {
            if (!g._fw || t - g._fw > .8) { g._fw = t; applyHit(f, g, { dmg: o.dmg || 6, stun: .3, kb: 9, up: 4, dir: new V3(F.x * Math.sign(across || 1), 0, F.z * Math.sign(across || 1)), color: GREEN, hitstop: .04 }); }
          }
        }
        if (t < (o.time || 4) && f.alive && G.state === 'play') later(0, tick); else stop();
      };
      tick();
    };

    // ---------- Despierto: Aimbot (ráfaga que gira sola) y Wallhack ----------
    MOVES.frannAimbot = function (f, o) {
      startAction(f, { name: 'frannAimbot', dur: .9, aim: true, speedMul: .3, anim: [[0, 'charge', 600], [.13, 'palm', 1000]],
        steps: [{ at: .2, fn: () => {
          popText(chestOf(f), 'AIMBOT', '#ff3b3b', 22);
          for (let i = 0; i < (o.n || 6); i++) later(i * .1, () => { if (f.alive) spawnProj(f, f.yaw + (i % 2 ? 1 : -1) * .35, { color: '#ff3b3b', size: .3, speed: 38, range: o.range || 26, homing: 14, dmg: o.dmg || 5, stun: .25, kb: 2 }); });
          sfx('zap', f.pos, .7);
        } }] });
    };
    MOVES.frannWallhack = function (f, o) {
      startAction(f, { name: 'frannWallhack', dur: .7, aim: false, speedMul: .3, anim: [[0, 'charge', 500], [.35, 'castUp', 700]] });
      f.buf = Math.max(f.buf || 0, o.time || 7); f.speedBoost = Math.max(f.speedBoost || 0, o.time || 7);
      for (const g of enemiesOf(f)) if (g.alive && dist2d(f, g) < 40) { ringAt(new V3(g.pos.x, g.pos.y + .2, g.pos.z), '#ff3b3b', 2.2, .8); lightColumn(g.pos, '#ff3b3b', 7); popText(chestOf(g), 'MARCADO', '#ff3b3b', 16); }
      ringAt(new V3(f.pos.x, f.pos.y + .3, f.pos.z), GREEN, 5, .6); popText(chestOf(f), 'WALLHACK', GREEN, 24); sfx('ult', f.pos, .5);
    };

    // ---------- Ulti: Cliente Hack ----------
    MOVES.frannUlt = function (f, o) {
      startAction(f, { name: 'frannUlt', dur: 3.0, aim: true, speedMul: 0, noControl: true, anim: [[0, 'charge', 500], [.9, 'castUp', 1200]],
        steps: [{ at: .9, fn: () => { ringAt(new V3(f.pos.x, f.pos.y + .2, f.pos.z), GREEN, 6, .6); lightColumn(f.pos, GREEN, 14); sfx('ult', f.pos); if (f.isPlayer) showBanner('CLIENTE HACK', GREEN, 'Todos los rivales marcados'); } }] });
      for (let i = 0; i < (o.n || 10); i++) later(1.0 + i * .17, () => {
        if (!f.alive) return; const es = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < 36); if (!es.length) return;
        const tg = es[i % es.length], a = Math.random() * TAU, from = new V3(tg.pos.x + Math.cos(a) * 9, tg.pos.y + rand(3, 7), tg.pos.z + Math.sin(a) * 9), to = chestOf(tg);
        const d = to.clone().sub(from), yaw = Math.atan2(d.x, d.z);
        spawnProj(f, yaw, { from, color: i % 2 ? GREEN : '#ff3b3b', size: .4, speed: 40, range: 20, homing: 10, dmg: o.dmg || 6, stun: .3, kb: 3 });
        ringAt(new V3(tg.pos.x, tg.pos.y + .2, tg.pos.z), GREEN, 2, .35);
      });
    };
  }
});
