/* ===== personajes/frann/habilidades.js =====
   Habilidades de SoyFrann (hacker). Los números están en personaje.js.
   Cada habilidad es un "truco" con su propia mecánica y animación (nada es una copia de las genéricas):
     frannLag       Lag Switch     salta adelante y, tras un momento, el "rollback" lo devuelve a su sitio (los dos puntos explotan)
     frannDdos      DDoS           fija una mira en el rival; tras el bloqueo, una oleada de paquetes converge sobre el punto y lo deja fuera de línea
     frannVirus     Virus          infecta al rival; cada pocos segundos salta a los rivales que estén cerca
     frannFirewall  Firewall       cuatro paneles orbitan a su alrededor; lo que toca se quema y al final salen despedidos
     frannAimbot    Aimbot         marca al rival y lo "clava" con una descarga que viene desde todos lados
     frannWallhack  Wallhack       cajas ESP sobre todos los rivales (se ven por las paredes), corre más y se recargan sus habilidades
     frannNoclip    Noclip         se vuelve intangible, atraviesa lo que se cruce y reaparece con un choque
     frannBan       Ban Hammer     un martillo gigante cae sobre la zona marcada y deja a todos baneados (aturdidos)
     frannUlt       Cliente Hack
   Multijugador: los efectos se repiten en los demás navegadores; el daño lo calcula quien lanza la habilidad; los movimientos propios solo los aplica su dueño. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const GREEN = '#32ff7e', RED = '#ff3b3b';
    const bx = (w, h, d, col, op) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op != null ? op : 1 }));
    const free = g => g.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); });
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
    const flat = (r0, r1, col, op) => { const m = new THREE.Mesh(new THREE.RingGeometry(r0, r1, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false })); return m; };

    // ---------- 1. Lag Switch (rollback) ----------
    MOVES.frannLag = function (f, o) {
      const F = fwd(f.yaw), from = gp(f.pos.x, f.pos.z); let dest = null;
      for (let d = o.dist || 11; d >= 3; d -= 1.5) { const x = f.pos.x + F.x * d, z = f.pos.z + F.z * d; if (!outLand(x, z)) { dest = gp(x, z); break; } }
      if (!dest) dest = from;
      const mark = bx(1.2, 3, 1.2, GREEN, .35); mark.position.set(from.x, from.y + 1.5, from.z); scene.add(mark);
      startAction(f, { name: 'frannLag', dur: 1.0, aim: false, noControl: true, speedMul: 0, anim: [[0, 'windup', 800], [.22, 'palm', 900]],
        steps: [{ at: .22, fn: () => {
          ghost(f, GREEN, .6, .4); burst(chestOf(f), 22, GREEN, 8, .2, .5, 0); sfx('zap', f.pos, .8); popText(chestOf(f), 'LAG', GREEN, 24);
          if (!f.remote) { f.pos.set(dest.x, dest.y, dest.z); f.vel.set(0, 0, 0); }
          explode(f, new V3(dest.x, dest.y + 1, dest.z), 2.6, { dmg: (o.dmg || 5), kb: 6, up: 8, color: GREEN, hitstop: .05, shake: .3 });
          ringAt(dest, GREEN, 4, .4); burst(new V3(dest.x, dest.y + 1, dest.z), 20, '#ffffff', 8, .18, .5, 0);
        } }] });
      let snapped = false;
      loop(f, 2.6, (dt, t) => {
        mark.scale.set(1 + Math.sin(t * 30) * .15, 1, 1 + Math.cos(t * 26) * .15); mark.material.opacity = .25 + .2 * Math.sin(t * 24);   // glitch del punto de origen
        emit(from.x + rand(-.6, .6), from.y + rand(0, 3), from.z + rand(-.6, .6), 0, rand(1, 3), 0, GREEN, .14, .35, 0, 1);
        if (t > 1.6 && !snapped) {   // rollback: vuelve al punto de origen y los dos lados explotan
          snapped = true;
          if (f.alive && !f.remote) { const cur = f.pos.clone(); ghost(f, GREEN, .6, .4); f.pos.set(from.x, from.y, from.z); f.vel.set(0, 0, 0); explode(f, new V3(cur.x, cur.y + 1, cur.z), 3, { dmg: 5, kb: 9, up: 9, color: GREEN, hitstop: .05 }); ringAt(gp(cur.x, cur.z), GREEN, 5, .4); }
          explode(f, new V3(from.x, from.y + 1, from.z), 3.2, { dmg: o.dmg ? o.dmg + 2 : 7, kb: 10, up: 10, ragdoll: .8, color: GREEN, hitstop: .08, shake: .4 });
          ringAt(from, GREEN, 6, .5); burst(new V3(from.x, from.y + 1.5, from.z), 28, GREEN, 10, .22, .6, .2); sfx('boom', from, .6); popText(new V3(from.x, from.y + 2.5, from.z), 'ROLLBACK', GREEN, 22);
          return true;
        }
        return false;
      }, () => { scene.remove(mark); free(mark); });
    };

    // ---------- 2. DDoS ----------
    MOVES.frannDdos = function (f, o) {
      const tg = nearest(f, o.range || 22), F = fwd(f.yaw), c = tg ? gp(tg.pos.x, tg.pos.z) : gp(f.pos.x + F.x * 10, f.pos.z + F.z * 10);
      const ret = flat(1.2, 1.5, RED, .9), dot = flat(0, .35, RED, .9); ret.rotation.x = dot.rotation.x = -Math.PI / 2; scene.add(ret); scene.add(dot);
      startAction(f, { name: 'frannDdos', dur: 1.4, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 700], [.35, 'palm', 1000]] });
      popText(chestOf(f), 'DDoS', GREEN, 22); sfx('zap', f.pos, .6);
      let fired = false;
      loop(f, 3.4, (dt, t) => {
        if (!fired) {
          if (tg && tg.alive) { c.x += (tg.pos.x - c.x) * Math.min(1, dt * 4); c.z += (tg.pos.z - c.z) * Math.min(1, dt * 4); c.y = groundAt(c.x, c.z); }   // la mira persigue al rival, pero con retraso
          const k = Math.min(1, t / 1.0), r = 4.2 - 2.8 * k; ret.geometry.dispose(); ret.geometry = new THREE.RingGeometry(r, r + .3, 40);
          ret.position.set(c.x, c.y + .1, c.z); dot.position.set(c.x, c.y + .1, c.z); ret.rotation.z += dt * 3;
          if (t > 1.0) {   // bloqueo: la oleada de paquetes sale desde un anillo y converge
            fired = true; popText(new V3(c.x, c.y + 2, c.z), 'LOCK', RED, 20); sfx('whoosh', c, .8);
            for (let i = 0; i < 12; i++) later(i * .05, () => {
              const a = i / 12 * TAU, R = 8, from = new V3(c.x + Math.cos(a) * R, c.y + 1.1, c.z + Math.sin(a) * R);
              spawnProj(f, Math.atan2(c.x - from.x, c.z - from.z), { from, color: i % 2 ? GREEN : '#ffffff', size: .35, speed: 24, range: 10, dmg: (o.dmg || 11) * .12, stun: .15, kb: 0 });
            });
          }
        } else if (t > 1.9 && !dot._boom) {
          dot._boom = true; explode(f, new V3(c.x, c.y + .8, c.z), 2.8, { dmg: (o.dmg || 11) * .6, stun: o.stun || 1.2, kb: 3, up: 4, color: GREEN, hitstop: .08, shake: .4 });
          for (let i = 0; i < 3; i++) later(i * .06, () => ringAt(c, i ? '#ffffff' : GREEN, 3 + i * 2, .4)); burst(new V3(c.x, c.y + 1, c.z), 30, GREEN, 9, .2, .6, .2); popText(new V3(c.x, c.y + 2.4, c.z), 'TIMEOUT', GREEN, 24);
          ret.visible = dot.visible = false; return true;
        }
        return false;
      }, () => { scene.remove(ret); scene.remove(dot); free(ret); free(dot); });
    };

    // ---------- 3. Virus (se contagia) ----------
    const infected = new Set();
    function infect(f, g, gen, o) {
      if (!g.alive || infected.has(g)) return; infected.add(g); popText(chestOf(g), 'VIRUS', '#7dff2a', 18);
      let tick = .7;
      loop(f, (o.ticks || 6) * .8 + 1, (dt, t) => {
        if (!g.alive) return true; const c = chestOf(g);
        emit(c.x + rand(-.4, .4), c.y + rand(-.6, .8), c.z + rand(-.4, .4), rand(-1, 1), rand(1, 3), rand(-1, 1), '#7dff2a', .16, .4, 0, 2);
        if (t > tick) {
          tick += .8; applyHit(f, g, { dmg: o.dmg || 3, stun: 0, kb: 0, color: '#7dff2a', hitstop: 0 });
          if (gen > 0) for (const h of foes(f, g.pos, 7)) if (h !== g && !infected.has(h)) {   // salta al rival que tenga cerca
            const d = chestOf(h).sub(c); for (let i = 0; i < 10; i++) emit(c.x + d.x * i / 10, c.y + d.y * i / 10, c.z + d.z * i / 10, 0, 0, 0, '#7dff2a', .3, .4, 0, 1);
            sfx('zap', h.pos, .4); infect(f, h, gen - 1, o); break;
          }
        }
        return false;
      }, () => infected.delete(g));
    }
    MOVES.frannVirus = function (f, o) {
      startAction(f, { name: 'frannVirus', dur: .6, aim: true, noControl: true, speedMul: 0, anim: [[0, 'throwW', 700], [.14, 'throw', 1100]],
        steps: [{ at: .16, fn: () => {
          spawnProj(f, f.yaw, { color: '#7dff2a', size: .6, speed: 28, range: o.range || 24, homing: 5, onHit: g => { applyHit(f, g, { dmg: 2, stun: .25, kb: 1, color: '#7dff2a', hitstop: 0 }); infect(f, g, 2, o); } });
          sfx('whoosh', f.pos, .6);
        } }] });
    };

    // ---------- 4. Firewall (paneles orbitando) ----------
    MOVES.frannFirewall = function (f, o) {
      const panels = [], T = o.time || 4.5, hurt = new Map();
      for (let i = 0; i < 4; i++) { const g = new THREE.Group(); for (let a = -1; a <= 1; a++) for (let b = 0; b < 3; b++) { const m = bx(.7, .7, .2, (a + b) % 2 ? GREEN : '#0f7a3c', .8); m.position.set(a * .72, .45 + b * .72, 0); g.add(m); } scene.add(g); panels.push(g); }
      startAction(f, { name: 'frannFirewall', dur: .7, aim: false, noControl: true, speedMul: .3, anim: [[0, 'charge', 500], [.3, 'castUp', 700]] });
      popText(chestOf(f), 'FIREWALL', GREEN, 22); sfx('ult', f.pos, .5); ringAt(gp(f.pos.x, f.pos.z), GREEN, 5, .5);
      let ang = 0;
      loop(f, T, (dt, t) => {
        ang += dt * (3 + t * .6); const R = Math.min(3.8, t * 8 + .5), base = gp(f.pos.x, f.pos.z);
        panels.forEach((g, i) => {
          const a = ang + i * Math.PI / 2, x = f.pos.x + Math.cos(a) * R, z = f.pos.z + Math.sin(a) * R;
          g.position.set(x, groundAt(x, z), z); g.rotation.y = -a; g.children.forEach((m, k) => m.material.opacity = .6 + .25 * Math.sin(t * 9 + k));
          for (const e of foes(f, g.position, 1.7)) { if ((hurt.get(e) || 0) > t) continue; hurt.set(e, t + .8); const dx = e.pos.x - f.pos.x, dz = e.pos.z - f.pos.z, d = Math.hypot(dx, dz) || 1; applyHit(f, e, { dmg: o.dmg || 6, stun: .3, kb: 10, up: 4, dir: new V3(dx / d, 0, dz / d), color: GREEN, hitstop: .04 }); burst(new V3(g.position.x, g.position.y + 1.2, g.position.z), 10, GREEN, 6, .16, .4, 0); }
        });
        return false;
      }, () => { for (const g of panels) { if (f.alive || true) { const p = g.position.clone(); p.y += 1; explode(f, p, 2.4, { dmg: 4, kb: 8, up: 6, color: GREEN, hitstop: 0 }); burst(p, 14, GREEN, 8, .2, .5, 0); } scene.remove(g); free(g); } });
    };

    // ---------- Despierto: Aimbot (descarga desde todos lados) ----------
    MOVES.frannAimbot = function (f, o) {
      const tg = nearest(f, o.range || 30); const ret = flat(.9, 1.1, RED, .95); scene.add(ret);
      startAction(f, { name: 'frannAimbot', dur: 1.9, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 700], [.4, 'palm', 1000]] });
      popText(chestOf(f), 'AIMBOT', RED, 22); sfx('zap', f.pos, .6);
      let fired = false;
      loop(f, 3, (dt, t) => {
        if (!tg || !tg.alive) return true; const c = chestOf(tg); ret.position.copy(c); ret.lookAt(camera.position); ret.rotation.z += dt * 5;
        if (!fired) {
          const k = Math.min(1, t / 1.1); ret.geometry.dispose(); ret.geometry = new THREE.RingGeometry(2.2 - 1.6 * k, 2.35 - 1.6 * k, 32);
          if (t > 1.1) {
            fired = true; popText(new V3(c.x, c.y + 1.2, c.z), 'LOCK', RED, 20); sfx('whoosh', c, .8);
            for (let i = 0; i < (o.n || 7); i++) later(i * .06, () => {
              if (!tg.alive) return; const cc = chestOf(tg), a = i / 7 * TAU, from = new V3(cc.x + Math.cos(a) * 9, cc.y + rand(-.5, 2), cc.z + Math.sin(a) * 9);
              spawnProj(f, Math.atan2(cc.x - from.x, cc.z - from.z), { from, color: i % 2 ? RED : '#ffffff', size: .32, speed: 44, range: 14, homing: 30, dmg: o.dmg || 5, stun: .2, kb: 2 });
            });
          }
        } else if (t > 1.9) {
          explode(f, c, 1.8, { dmg: 8, stun: .5, kb: 5, up: 6, color: RED, hitstop: .08, shake: .35 }); popText(new V3(c.x, c.y + 1.2, c.z), 'HEADSHOT', RED, 26); burst(c, 24, RED, 9, .2, .5, 0); ringAt(gp(c.x, c.z), RED, 4, .4);
          return true;
        }
        return false;
      }, () => { scene.remove(ret); free(ret); });
    };

    // ---------- Despierto: Wallhack (ESP) ----------
    function esp(f, T, col) {
      const boxes = new Map();
      loop(f, T, (dt, t) => {
        for (const g of enemiesOf(f)) {
          let b = boxes.get(g);
          if (!b) { const m = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.3, 2.4, 1.3)), new THREE.LineBasicMaterial({ color: col, depthTest: false, transparent: true })); m.renderOrder = 999; scene.add(m); boxes.set(g, b = m); }
          b.visible = g.alive && dist2d(f, g) < 60; b.position.set(g.pos.x, g.pos.y + 1.2, g.pos.z); b.material.opacity = .65 + .35 * Math.sin(t * 8);
        }
        return false;
      }, () => { for (const b of boxes.values()) { scene.remove(b); free(b); } });
    }
    MOVES.frannWallhack = function (f, o) {
      startAction(f, { name: 'frannWallhack', dur: .7, aim: false, noControl: true, speedMul: 0, anim: [[0, 'charge', 500], [.3, 'castUp', 700]] });
      const T = o.time || 7; if (!f.remote) { f.turbo = Math.max(f.turbo || 0, T); for (let i = 0; i < 4; i++) if (f.cd[i] > 0) f.cd[i] *= .4; }
      esp(f, T, RED);
      for (const g of enemiesOf(f)) if (g.alive && dist2d(f, g) < 45) { ringAt(gp(g.pos.x, g.pos.z), RED, 2.2, .8); popText(chestOf(g), 'MARCADO', RED, 16); }
      ringAt(gp(f.pos.x, f.pos.z), GREEN, 5, .6); popText(chestOf(f), 'WALLHACK', GREEN, 24); sfx('ult', f.pos, .5);
    };

    // ---------- Despierto: Noclip ----------
    MOVES.frannNoclip = function (f, o) {
      const hit = new Set(); let ended = false, gh = 0;
      startAction(f, { name: 'frannNoclip', dur: 1.0, aim: true, noControl: true, speedMul: 0, ghost: true, anim: [[0, 'windup', 700], [.15, 'ninja', 1000]],
        start: () => { f.iframes = Math.max(f.iframes, 1.0); popText(chestOf(f), 'NOCLIP', GREEN, 24); sfx('zap', f.pos, .8); },
        tick: (a, t) => {
          if (t < .18 || ended) { if (t >= .18) return; f.vel.x = f.vel.z = 0; return; }
          if (t < .62) {
            const F = fwd(f.yaw); f.vel.x = F.x * (o.speed || 34); f.vel.z = F.z * (o.speed || 34); f.vel.y = 0;
            gh -= .016; if (gh <= 0) { gh = .045; ghost(f, GREEN, .5, .3); }
            emit(f.pos.x, f.pos.y + rand(.2, 2), f.pos.z, rand(-2, 2), rand(-2, 2), rand(-2, 2), Math.random() < .5 ? GREEN : '#ffffff', .2, .3, 0, 3);
            for (const g of foes(f, f.pos, 2)) if (!hit.has(g)) { hit.add(g); applyHit(f, g, { dmg: o.dmg || 9, stun: .4, kb: 4, up: 8, color: GREEN, hitstop: .05, shake: .3 }); popText(chestOf(g), 'GLITCH', GREEN, 16); }
          } else if (!ended) {   // reaparece con un choque de datos
            ended = true; f.vel.x *= .1; f.vel.z *= .1; const p = gp(f.pos.x, f.pos.z);
            explode(f, new V3(p.x, p.y + 1, p.z), 3, { dmg: 4, kb: 8, up: 6, color: GREEN, hitstop: .05 }); ringAt(p, GREEN, 5, .4); burst(new V3(p.x, p.y + 1.2, p.z), 26, '#ffffff', 9, .2, .5, .1); a.anim = [[a.t, 'land', 800]];
          }
        } });
    };

    // ---------- Despierto: Ban Hammer ----------
    MOVES.frannBan = function (f, o) {
      const tg = nearest(f, 24), F = fwd(f.yaw), c = tg ? gp(tg.pos.x, tg.pos.z) : gp(f.pos.x + F.x * 9, f.pos.z + F.z * 9), R = o.radius || 4.5;
      const h = new THREE.Group(), head = bx(4, 2, 2, '#5b6068'); h.add(head); const band = bx(4.2, .5, 2.2, RED); band.position.y = .6; h.add(band); const hd = bx(.6, 5, .6, '#6b4a2b'); hd.position.y = -3; h.add(hd);
      h.position.set(c.x, c.y + 30, c.z); h.rotation.y = f.yaw; scene.add(h);
      startAction(f, { name: 'frannBan', dur: 1.8, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 600], [.35, 'slamUp', 1000], [1.1, 'mega', 1200]] });
      warnCircle(c, R + .5, RED, 1.35); popText(chestOf(f), 'BAN HAMMER', RED, 24); sfx('ult', f.pos, .5);
      let fell = false, t0 = 0;
      loop(f, 3.2, (dt, t) => {
        if (!fell) { h.position.y = c.y + 30 - Math.min(1, Math.max(0, (t - .2) / 1.0)) * 4; h.rotation.y += dt * 1.5; if (t > 1.3) { fell = true; t0 = t; } }
        else {
          const k = Math.min(1, (t - t0) / .16); h.position.y = c.y + 26 + (1 - k) * 0 - k * (26 - 1.2);
          if (k >= 1 && !h._hit) {
            h._hit = true; const victims = foes(f, c, R);
            explode(f, new V3(c.x, c.y + .8, c.z), R, { dmg: o.dmg || 24, stun: 1.5, kb: 10, up: 10, ragdoll: 1.2, guardBreak: true, noRC: true, color: RED, hitstop: .15, shake: .7 });
            for (const v of victims) popText(chestOf(v), 'BANEADO', RED, 22); for (let i = 0; i < 3; i++) later(i * .07, () => ringAt(c, i ? '#ffffff' : RED, 4 + i * 3, .45));
            burst(new V3(c.x, c.y + 1, c.z), 44, '#8b929e', 12, .3, .7, .4); shakeFrom(c, .7); sfx('boom', c, .9); t0 = t;
          }
          if (h._hit && t - t0 > .9) return true;
        }
        return false;
      }, () => { scene.remove(h); free(h); });
    };

    // ---------- Ulti: Cliente Hack ----------
    MOVES.frannUlt = function (f, o) {
      startAction(f, { name: 'frannUlt', dur: 3.0, aim: true, noControl: true, speedMul: 0, anim: [[0, 'charge', 500], [.9, 'castUp', 1200]],
        steps: [{ at: .9, fn: () => { ringAt(gp(f.pos.x, f.pos.z), GREEN, 6, .6); lightColumn(f.pos, GREEN, 14); sfx('ult', f.pos); if (f.isPlayer) showBanner('CLIENTE HACK', GREEN, 'Todos los rivales marcados'); } }] });
      esp(f, 4, RED);
      for (let i = 0; i < (o.n || 10); i++) later(1.0 + i * .17, () => {
        if (!f.alive) return; const es = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < 36); if (!es.length) return;
        const tg = es[i % es.length], a = Math.random() * TAU, from = new V3(tg.pos.x + Math.cos(a) * 9, tg.pos.y + rand(3, 7), tg.pos.z + Math.sin(a) * 9), to = chestOf(tg);
        spawnProj(f, Math.atan2(to.x - from.x, to.z - from.z), { from, color: i % 2 ? GREEN : RED, size: .4, speed: 40, range: 20, homing: 10, dmg: o.dmg || 6, stun: .3, kb: 3 });
        ringAt(gp(tg.pos.x, tg.pos.z), GREEN, 2, .35);
      });
    };
  }
});
