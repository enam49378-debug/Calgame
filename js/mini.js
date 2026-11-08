/* ===== MINI, la companera de Sunn =====
   Mini usa el modelo del jugador pero mas pequena y con la cabeza grande. Sigue a Sunn, camina a su lado, se asoma curiosa
   y le ayuda: cuando hay un rival cerca dispara pequenos rayos (con el despertar de Sunn dispara mas rapido).
   Su skin vive en personajes/mini/skin.png. Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const SK = { img: null, cv: null, ready: false };
    const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); SK.cv = c; SK.ready = true; }; im.src = 'personajes/mini/skin.png';
    const SC = .56, HEAD = 1.7, LINES = ['Yo ayudo.', 'Toma esto.', 'Sunn, cuidado.', 'Lo tengo.', 'Disparo.', 'Misión cumplida.'];
    function make(owner) {
      const m = buildModel(SK.cv, false, scene); m.root.scale.setScalar(SC); m.head.scale.setScalar(HEAD);
      return { owner, m, pos: new V3(owner.pos.x - 1.1, owner.pos.y, owner.pos.z - .6), yaw: owner.yaw || 0, t: Math.random() * 6, cd: 1.5, shoot: 0, walk: 0, say: 0 };
    }
    function drop(o) { if (o.mini) { try { disposeModel(o.mini.m); } catch (e) { } o.mini = null; } }
    function tick(f, dt, T) {
      let c = f.mini;
      if (!f.alive || f.ch.id !== 'sunn' || !G.fighters.includes(f)) { if (c) { drop(f); } return; }
      if (!c) { if (!SK.ready) return; c = f.mini = make(f); }
      const R = rightOf(f.yaw), F = fwd(f.yaw), want = new V3(f.pos.x - R.x * 1.15 - F.x * .7, f.pos.y, f.pos.z - R.z * 1.15 - F.z * .7);
      const dd = Math.hypot(want.x - c.pos.x, want.z - c.pos.z); if (dd > 14) { c.pos.copy(want); }
      const k = 1 - Math.exp(-dt * (dd > 3 ? 6 : 3.2)), px = c.pos.x, pz = c.pos.z; c.pos.x += (want.x - c.pos.x) * k; c.pos.z += (want.z - c.pos.z) * k;
      const gy = groundAt(c.pos.x, c.pos.z, f.pos.y + .4); c.pos.y += (Math.max(gy, f.onGround ? gy : f.pos.y - 1.2) - c.pos.y) * (1 - Math.exp(-dt * 10));
      const sp = Math.hypot(c.pos.x - px, c.pos.z - pz) / Math.max(dt, 1e-3); c.walk += dt * Math.min(12, sp * 2.4);
      // objetivo: el rival mas cercano a la vista
      let tgt = null, bd = 22; for (const g of enemiesOf(f)) { const d = dist2d(g, c); if (d < bd) { bd = d; tgt = g; } }
      c.cd -= dt * (f.awak > 0 ? 1.8 : 1);
      if (tgt && c.cd <= 0 && !f.remote) {
        c.cd = rand(1.3, 2.1); c.shoot = .45; const q = chestOf(tgt), from = new V3(c.pos.x, c.pos.y + 1.0, c.pos.z);
        spawnProj(f, Math.atan2(q.x - from.x, q.z - from.z), { from, color: '#ff8fb0', speed: 38, size: .2, long: 1.2, homing: 3, range: 24, onHit: g => applyHit(f, g, { dmg: f.awak > 0 ? 2.6 : 1.9, stun: .2, kb: 2, color: '#ff8fb0', noAssist: true }) });
        sfx('zap', from, .35); burst(from, 5, '#ff8fb0', 4, .12, .25, 0); if (Math.random() < .3) popText(new V3(c.pos.x, c.pos.y + 1.7, c.pos.z), LINES[Math.random() * LINES.length | 0], '#ff8fb0', 14);
      }
      c.shoot = Math.max(0, c.shoot - dt);
      const face = tgt && c.shoot > 0 ? Math.atan2(tgt.pos.x - c.pos.x, tgt.pos.z - c.pos.z) : sp > .5 ? Math.atan2(c.pos.x - px, c.pos.z - pz) : f.yaw;
      let dy = face - c.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); c.yaw += dy * (1 - Math.exp(-dt * 9));
      const m = c.m, w = Math.sin(c.walk), mv = Math.min(1, sp / 3);
      m.root.position.set(c.pos.x, c.pos.y, c.pos.z); m.root.rotation.y = c.yaw;
      m.legL.rotation.x = w * .9 * mv; m.legR.rotation.x = -w * .9 * mv; m.armL.rotation.x = -w * .7 * mv + Math.sin(T * 1.7) * .05; m.armR.rotation.x = c.shoot > 0 ? -1.45 : w * .7 * mv + Math.sin(T * 1.6 + 1) * .05;
      m.armL.rotation.z = .08; m.armR.rotation.z = -.08; m.head.rotation.x = Math.sin(T * 1.3) * .06 + (c.shoot > 0 ? -.1 : 0); m.head.rotation.y = Math.sin(T * .8) * .25 * (1 - mv);
      m.torso.position.y = m.bind.torso.y + Math.abs(Math.sin(c.walk)) * .02 * mv + Math.sin(T * 2) * .006; m.root.visible = f.model.root.visible || f.alive;
    }
    let last = performance.now();
    function loop(now) {
      requestAnimationFrame(loop); const dt = Math.min(.05, (now - last) / 1000); last = now; if (G.state !== 'play') { for (const f of G.fighters) if (f.mini) drop(f); return; }
      const T = now / 1000; for (const f of G.fighters) { try { if (f.ch && f.ch.id === 'sunn') tick(f, dt, T); else if (f.mini) drop(f); } catch (e) { drop(f); } }
    }
    requestAnimationFrame(loop);
    window.CF_MINI = { get ready() { return SK.ready; } };
  }
});
