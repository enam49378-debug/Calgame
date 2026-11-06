// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano
// El código de cada habilidad vive en personajes/<id>/Skills/Code/<habilidad>/*.js y Skills/Ulti/Code/*.js
// game.js ejecuta esta función con todo lo suyo a mano (sin dejarlo accesible desde la consola).
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const CF = { mover: function (nombre, fn) { MOVES[nombre] = fn; } };

/* ===== personajes/javi/Skills/Code/Destello Negro/blackFlash.js ===== */
/* Habilidad: Destello Negro  ·  personaje: javi  ·  movimiento: blackFlash
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('blackFlash', function (f, o) {
    const open2 = t => t > T - .34 && t < T + .22 && Math.floor(t * 30) % 2 === 0, T = .75, set = new Set(), st = { aiOK: Math.random() < .5, ok: false, early: false, done: false, open: false };
    startAction(f, {
      name: 'bflash', dur: 1.3, aim: true, speedMul: .12, anim: [[0, 'windup', 800], [.45, 'windup', 300], [T - .04, 'mega', 1700]],
      start: () => sfx('zap', f.pos, .5),
      tick: (a, t) => {
        const press = bfInput(f, o.slot), F = fwd(f.yaw);
        if (t < T - .2 && Math.random() < .8) emit(f.pos.x + F.x * .8 + rand(-.4, .4), f.pos.y + 1.1 + rand(-.3, .3), f.pos.z + F.z * .8 + rand(-.4, .4), rand(-1, 1), rand(0, 1), rand(-1, 1), Math.random() < .5 ? '#14141c' : '#ff2a3c', .16, .35, 0, 3);
        if (t >= T - .34 && !st.open) { st.open = true; if (f.isPlayer) { popText(chestOf(f), '¡AHORA!', '#ffffff', 30); G.slowT = 1.1; } ringAt(front(f, 1.1, 1.3), '#ffffff', 2.8, .35); sfx('zap', f.pos, .6); }   // cámara lenta mientras dura la ventana
        if (open2(t)) ringAt(front(f, 1.1, 1.3), '#ff2a3c', 1.4 + (T - t) * 4, .12);
        if (!st.done && press) { if (t >= T - .3 && t <= T + .22) st.ok = true; else if (t < T - .3) st.early = true; }
        if (!f.isPlayer && t >= T - .05 && st.aiOK) st.ok = true;
        if (t >= T + .2 && !st.done) { st.done = true; G.slowT = 0; bfStrike(f, o, set, st.ok && !st.early, o.dmg || 26); }
      },
    });
  });

/* ===== personajes/javi/Skills/Code/Destellos Encadenados/bf3.js ===== */
/* Habilidad: Destellos Encadenados  ·  personaje: javi  ·  movimiento: bf3
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// ---- sin lanza y despierto ----
CF.mover('bf3', function (f, o) {
    const beats = [.5, 1.1, 1.7], st = beats.map(() => ({ ok: Math.random() < .45, in: false, early: false, open: false, done: false })), set = [new Set(), new Set(), new Set()];
    startAction(f, {
      name: 'bf3', dur: 2.35, aim: true, speedMul: .25,
      anim: [[0, 'windup', 800], [.34, 'mega', 1700], [.62, 'windup', 900], [.94, 'mega', 1700], [1.2, 'windup', 900], [1.54, 'mega', 1700]],
      tick: (a, t) => {
        const press = bfInput(f, o.slot);
        beats.forEach((T, i) => {
          const s = st[i]; if (s.done) return;
          if (t >= T - .16 && !s.open) { s.open = true; if (f.isPlayer) popText(chestOf(f), '¡DESTELLO!', '#ff4a5a', 26 + i * 3); ringAt(front(f, 1.1, 1.3), '#ffffff', 2.4, .2); sfx('zap', f.pos, .6); }
          const active = t >= T - .16 && t <= T + .12 && (i === 0 || st[i - 1].done);
          if (press && active) s.in = true; else if (press && t < T - .16 && t > (i ? beats[i - 1] + .1 : 0)) s.early = true;
          if (!f.isPlayer && t >= T - .05 && s.ok) s.in = true;
          if (t >= T) { s.done = true; f.vel.x += fwd(f.yaw).x * 2; f.vel.z += fwd(f.yaw).z * 2; bfStrike(f, o, set[i], true, i === 2 ? 30 : 18, i === 2); }   /* en la ulti siempre sale */
        });
      },
    });
  });

/* ===== personajes/javi/Skills/Code/Embestida/lunge.js ===== */
/* Habilidad: Embestida  ·  personaje: javi  ·  movimiento: lunge
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('lunge', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'lunge', dur: .55, anim: [[0, 'lance', 900]], aim: true, noControl: true, lockYaw: true, ghost: true,
      start: () => { sfx('dash', f.pos); sfx('swing', f.pos); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t < .36) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30;
          emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
          if (hitArea(f, front(f, 1.7, 1.1), 1.2, { dmg: o.dmg || 9, kb: 22, up: 5, ragdoll: .9, dir: F, color: o.color, guardBreak: true, set, hitstop: .06, shake: .35 })) stabFx(f, '#ffffff');
        } else if (!a.stopped) { a.stopped = true; a.ghost = false; f.vel.x *= .15; f.vel.z *= .15; a.anim = [[t, 'thrust', 1100]]; stabFx(f, o.color); }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });

/* ===== personajes/javi/Skills/Code/Embestida de Hombro/shoulderDash.js ===== */
/* Habilidad: Embestida de Hombro  ·  personaje: javi  ·  movimiento: shoulderDash
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('shoulderDash', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'shdash', dur: .75, aim: true, noControl: true, lockYaw: true, ghost: true, anim: [[0, 'charge', 800], [.1, 'mega', 1100]],
      start: () => { sfx('dash', f.pos); sfx('swing', f.pos); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t < .42) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30; emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ff2a3c', .2, .3, 0, 3);
          if (hitArea(f, front(f, 1.2, 1.1), 1.4, { dmg: 8, kb: 14, up: 4, ragdoll: .9, color: '#ff2a3c', guardBreak: true, set, hitstop: .06, shake: .4 })) { impactStar(front(f, 1.2, 1.1), '#ffffff', 2, .2); worldDamage(front(f, 1.6, 1.1), 3, 1, 12, 1.2); }
        } else if (!a.stopped) { a.stopped = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1; }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });

/* ===== personajes/javi/Skills/Code/Lanza Leal/spearThrow.js ===== */
/* Habilidad: Lanza Leal  ·  personaje: javi  ·  movimiento: spearThrow
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('spearThrow', function (f, o) {
    if (f.spearThrown) return false;
    startAction(f, {
      name: 'sthrow', dur: .5, aim: true, speedMul: .3, anim: [[0, 'spearThrowW', 800], [.16, 'spearThrow', 1100]],
      steps: [{ at: .17, fn: () => { f.spearThrown = true; if (f.spear) f.spear.visible = false; spawnSpearProj(f, o); sfx('swing', f.pos); sfx('zap', f.pos, .5); } }],
    });
  });

/* ===== personajes/javi/Skills/Code/Patada Giratoria/manjiKick.js ===== */
/* Habilidad: Patada Giratoria  ·  personaje: javi  ·  movimiento: manjiKick
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('manjiKick', function (f, o) {
    const F = () => fwd(f.yaw), kick = (dmg, kb, up, rag, fin) => () => {
      f.vel.x += F().x * (fin ? 4 : 2); f.vel.z += F().z * (fin ? 4 : 2); const p = front(f, 1.5, 1.0);
      slashLine(front(f, .3, .5), front(f, 2.6, 1.3), '#ffffff', .16, .16); sfx('swing', f.pos, .7);
      if (hitArea(f, p, fin ? 1.5 : 1.3, { dmg, kb, up, ragdoll: rag, stun: fin ? 0 : .5, color: o.color, set: new Set(), hitstop: fin ? .12 : .04, shake: fin ? .6 : .2 })) { impactStar(p, '#ffffff', fin ? 2.4 : 1.4, .2); burst(p, fin ? 20 : 8, o.color, 8, .14, .3, 0); }
      if (fin) { ghost(f, o.color, .5, .3); worldDamage(p, 3.4, 1.1, 14, .9); }
    };
    startAction(f, {
      name: 'manji', dur: 1.05, aim: true, speedMul: .35, anim: [[0, 'kick_w', 800], [.1, 'kick', 1500], [.3, 'kick_w', 700], [.36, 'kick', 1500], [.58, 'spinPose', 900], [.66, 'kick', 1700]],
      steps: [{ at: .14, fn: kick(4, 3, 0, 0) }, { at: .4, fn: kick(4, 3, 0, 0) }, { at: .72, fn: kick(9, 21, 6, 1.2, true) }],
    });
  });

/* ===== personajes/javi/Skills/Code/Puño Divergente/fistDiv.js ===== */
/* Habilidad: Puño Divergente  ·  personaje: javi  ·  movimiento: fistDiv
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('fistDiv', function (f, o) {
    const first = new Set(), F = () => fwd(f.yaw);
    startAction(f, {
      name: 'fistdiv', dur: .95, aim: true, speedMul: .4, anim: [[0, 'jabR_w', 700], [.15, 'jabR', 1500], [.5, 'jabR_w', 500], [.58, 'mega', 1500]],
      start: () => sfx('swing', f.pos),
      steps: [
        { at: .2, fn: () => { f.vel.x += F().x * 3; f.vel.z += F().z * 3; const p = front(f, 1.4, 1.2); hitArea(f, p, 1.3, { dmg: 6, kb: 3, stun: .7, color: o.color, set: first }); impactStar(p, '#ffffff', 1.6, .18); burst(p, 10, o.color, 6, .12, .3, 0); sfx('swing', f.pos, .6); } },
        { at: .64, fn: () => {   // el segundo impacto llega después, en el mismo punto
          for (const g of first) { if (!g.alive) continue; const c = chestOf(g); impactStar(c, '#ff4a5a', 2.6, .3); ringAt(c, '#ffffff', 3.2, .35); burst(c, 22, '#ffffff', 9, .16, .4, 0); applyHit(f, g, { dmg: 9, kb: 17, up: 5, ragdoll: 1.1, dir: F(), color: '#ff4a5a', hitstop: .1, shake: .5 }); }
          if (!first.size) impactStar(front(f, 1.6, 1.2), '#ffffff', 1.4, .2);
          worldDamage(front(f, 1.8, 1.2), 3.2, 1, 12, .8); sfx('break', f.pos, .6);
        } },
      ],
    });
  });

/* ===== personajes/javi/Skills/Code/Rompe Suelo/groundBreak.js ===== */
/* Habilidad: Rompe Suelo  ·  personaje: javi  ·  movimiento: groundBreak
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('groundBreak', function (f, o) {
    startAction(f, {
      name: 'gbreak', dur: 1.05, aim: true, speedMul: .25, anim: [[0, 'lift', 700], [.4, 'plunge', 1800]],
      start: () => { f.vel.y = 15; sfx('dash', f.pos); },
      steps: [
        { at: .36, fn: () => { f.vel.y = -34; sfx('swing', f.pos); } },
        { at: .62, fn: () => {
          const c = new V3(f.pos.x, f.pos.y + .5, f.pos.z); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff2a3c', 9, .6); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffffff', 6, .45); burst(c, 40, '#ffd9a0', 11, .22, .6, .6); burst(c, 18, '#ff2a3c', 9, .16, .5, 0);
          impactStar(c, '#ffffff', 3.6, .35); sfx('break', f.pos); G.hitstop = Math.max(G.hitstop, .12);
          hitArea(f, c, 6.5, { dmg: 17, kb: 18, up: 9, ragdoll: 1.4, color: '#ff2a3c', guardBreak: true, set: new Set(), shake: 1 }); worldDamage(c, 8, 2.2, 34, 2.2);
        } },
      ],
    });
  });

/* ===== personajes/javi/Skills/Code/Ráfaga de Puños/fistFlurry.js ===== */
/* Habilidad: Ráfaga de Puños  ·  personaje: javi  ·  movimiento: fistFlurry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('fistFlurry', function (f, o) {
    const an = [[0, 'jabR_w', 800]], steps = [], held = new Set();
    for (let i = 0; i < 9; i++) {
      an.push([.1 + i * .1, i % 2 ? 'jabL' : 'jabR', 1500]);
      steps.push({ at: .16 + i * .1, fn: () => { const p = front(f, 1.4 + rand(-.2, .2), 1.2 + rand(-.3, .3)), hs = new Set();
        if (hitArea(f, p, i === 0 ? 1.8 : 1.5, { dmg: 2.1, kb: 0, stun: .5, color: o.color, set: hs, hitstop: .02 })) { for (const g of hs) held.add(g); impactStar(p, i % 2 ? '#ffffff' : o.color, 1.1, .12); } sfx('swing', f.pos, .35); burst(p, 3, '#ffffff', 5, .1, .2, 0); } });
    }
    an.push([1.08, 'upper_w', 800], [1.16, 'upper', 1500]);
    steps.push({ at: 1.2, fn: () => { const p = front(f, 1.4, 1.3); hitArea(f, p, 1.4, { dmg: 7, kb: 2, up: 13, ragdoll: .9, color: o.color, set: new Set(), hitstop: .1, shake: .5 }); impactStar(p, '#ffffff', 2.2, .25); ringAt(p, o.color, 3, .3); worldDamage(p, 3, 1, 10, .7); } });
    startAction(f, { name: 'flurry', dur: 1.55, aim: true, speedMul: .3, anim: an, steps, onEnd: () => held.clear(),
      tick: (a, t, dt) => {   // el rival queda agarrado delante hasta el gancho final: no se suelta ni sale despedido
        if (t > 1.2) return; const c = front(f, 1.35, 0), k = Math.min(1, dt * 16);
        for (const g of held) { if (!g.alive || g.ragdoll > 0) { held.delete(g); continue; } g.vel.x = g.vel.z = 0; g.vel.y = Math.max(g.vel.y, 0); g.stun = Math.max(g.stun, .3); g.pos.x += (c.x - g.pos.x) * k; g.pos.z += (c.z - g.pos.z) * k; }
      } });
  });

/* ===== personajes/javi/Skills/Code/Torbellino/whirl.js ===== */
/* Habilidad: Torbellino  ·  personaje: javi  ·  movimiento: whirl
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('whirl', function (f, o) {
    let acc = 0, n = 0; const hits = 8;
    startAction(f, {
      name: 'whirl', dur: 1.0, speedMul: .55, anim: [[0, 'spinPose', 900]], spin: f.ch===CHARS.javi ? TAU*4 : 22,
      start: () => { sfx('dash', f.pos); for (const g of G.fighters) if (g !== f && g.alive && dist2d(f, g) < 14) javiSpeak(g, 'reac_torbellino'); },   // reacción de quien lo ve venir
      tick: (a, t, dt) => {
        acc += dt;
        while (acc >= .11 && n < hits) {
          acc -= .11; n++; const last = n === hits, c = chestOf(f);
          arcSlash(f, o.color, { tilt: rand(-.12, .12), len: TAU * .85, r: 2.5, w: .35, dur: .16 });
          for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(c) < 2.8) applyHit(f, g, last ? { dmg: 9, kb: 17, up: 9, ragdoll: 1.1, color: o.color, guardBreak: true, hitstop: .08, shake: .35 } : { dmg: 2.7, stun: .45, kb: -2.5, color: o.color, hitstop: 0, shake: .05 });
          sfx('swing', f.pos, .5);
        }
      },
    });
  });

/* ===== personajes/javi/Skills/Ulti/Code/spearRain.js ===== */
/* Habilidad: Lluvia de Lanzas  ·  personaje: javi  ·  movimiento: spearRain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('spearRain', function (f, o) {
    const tg = findTarget(f, 20), F = fwd(f.yaw);
    const c0 = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8);
    c0.y = groundAt(c0.x, c0.z);
    startAction(f, {
      name: 'rain', dur: 2.1, armor: true, noControl: true, aim: true, anim: [[0, 'stomp', 800], [.15, 'spearThrowW', 700], [.55, 'spearThrow', 1000], [1.1, 'spearThrowW', 800], [1.2, 'spearThrow', 1100]],
      start: () => { f.vel.set(0, 17, 0); f.onGround = false; f.iframes = 1.6; sfx('jump', f.pos, 3); },
      tick: (a, t) => { if (t > .45 && t < 1.6) f.vel.set(0, 0, 0); },
      steps: [
        { at: .55, fn: () => { for (let i = 0; i < 12; i++) { const an = rand(0, TAU), rr = rand(.5, 6.5), p = new V3(c0.x + Math.cos(an) * rr, 0, c0.z + Math.sin(an) * rr); if (Math.hypot(p.x, p.z) > ARENA) continue; p.y = groundAt(p.x, p.z); fallingSpear(f, p, .15 + i * .06, 1, o, false); } } },
        { at: 1.2, fn: () => fallingSpear(f, c0.clone(), .35, 3.4, o, true) },
      ],
    });
  });

/* ===== personajes/redbird/Skills/Code/Bombardeo Orbital/rbSatellite.js ===== */
/* Habilidad: Bombardeo Orbital  ·  personaje: redbird  ·  movimiento: rbSatellite
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 3 · marcar y confirmar: la marca persigue al rival con retraso y crece; el segundo toque llama al satélite
CF.mover('rbSatellite', function (f, o) {
    const COL = '#ff2d55', F = fwd(f.yaw), tg0 = findTarget(f, 28);
    const pos = clampArena(tg0 ? tg0.pos.clone() : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12)); pos.y = groundAt(pos.x, pos.z);
    startAction(f, { name: 'rbMark', dur: .5, bbClip: 'despertar_marcar', speedMul: .3, aim: true, eyes: true });
    const grp = new THREE.Group(), rg = new THREE.RingGeometry(.86, 1, 48), ring = new THREE.Mesh(rg, glowMat(COL, .9)), cg = new THREE.CircleGeometry(1, 40), disc = new THREE.Mesh(cg, glowMat(COL, .18)),
      pg = new THREE.CylinderGeometry(.12, .12, 40, 8), pil = new THREE.Mesh(pg, glowMat('#ffffff', .45));
    ring.rotation.x = disc.rotation.x = -Math.PI / 2; pil.position.y = 20; grp.add(ring, disc, pil);
    const mk = { dead: false }; sfx('zap', pos); ringAt(pos, COL, 3, .4);
    addFx(grp, 8, g => { if (mk.dead) g.visible = false; }, () => { rg.dispose(); ring.material.dispose(); cg.dispose(); disc.material.dispose(); pg.dispose(); pil.material.dispose(); });
    const at = o.at || rand(1.2, 2.6);
    seqStart(f, {
      slot: o.slot, lock: false, tg: tg0, fired: false, autoOnly: true,
      auto: (s, k) => k === 'tap' && s.t > at,
      onCancel: () => { mk.dead = true; },
      step(f, s, i) {
        if (s.tg && s.tg.alive) { pos.x += (s.tg.pos.x - pos.x) * Math.min(1, 2.2 * i.dt); pos.z += (s.tg.pos.z - pos.z) * Math.min(1, 2.2 * i.dt); pos.y = groundAt(pos.x, pos.z); }
        const pw = clamp(s.t / 2.5, 0, 1), R = 3 + 2.2 * pw, pul = 1 + Math.sin(s.t * 12) * .05;
        grp.position.set(pos.x, pos.y + .1, pos.z); ring.scale.set(R * pul, R * pul, 1); disc.scale.set(R, R, 1); pil.scale.set(.5 + pw, 1, .5 + pw);
        s.hud = { txt: `SATÉLITE ENLAZADO  ·  poder ${Math.round(pw * 100)}%`, pct: pw, col: pw >= 1 ? '#ffffff' : COL };
        if (s.t > 4.5 || (i.down && s.t > .45)) {
          const P = pos.clone(), dmg = 7 + 6 * pw;
          mk.dead = true; seqEnd(f);
          startAction(f, { name: 'rbCall', dur: .75, bbClip: 'despertar_llamar', speedMul: .2, aim: true, eyes: true });
          warnCircle(P, R, COL, .8);
          later(.85, () => {
            lightColumn(P, '#ffffff', 34); lightColumn(P, COL, 30);
            explode(f, new V3(P.x, P.y + .8, P.z), R, { dmg, kb: 4, up: 16, ragdoll: 1.2, color: COL, guardBreak: true, hitstop: .1, shake: .5 }); sfx('ult', P);
            for (let w = 1; w <= 2; w++) later(.28 * w, () => {
              const rr = R * (.55 + .45 * w);
              for (let n = 0; n < 6; n++) {
                const an = n / 6 * TAU + w * .5, q = new V3(P.x + Math.cos(an) * rr, 0, P.z + Math.sin(an) * rr); clampArena(q, 1); q.y = groundAt(q.x, q.z);
                lightColumn(q, COL, 14);
                explode(f, new V3(q.x, q.y + .8, q.z), 1.7, { dmg: 3.5, stun: .5, kb: 5, up: 5, color: COL, hitstop: .03, shake: .2 });
              }
            });
          });
        }
      },
    });
  });

/* ===== personajes/redbird/Skills/Code/Impulso Óptico/optoJump.js ===== */
/* Habilidad: Impulso Óptico  ·  personaje: redbird  ·  movimiento: optoJump
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('optoJump', function (f, o) {
    startAction(f, {
      name: 'optojump', dur: .7, eyes: true, noControl: true, anim: [[0, 'lookDown', 800], [.18, 'jump', 500]],
      steps: [{ at: .15, fn: () => {
        const p = new V3(f.pos.x, f.pos.y + .3, f.pos.z), F = fwd(f.yaw);
        slashLine(new V3(f.pos.x + F.x * .3, f.pos.y + 1.72, f.pos.z + F.z * .3), p, o.color, .25, .3);
        explode(f, p, 3.5, { dmg: 7, kb: 14, up: 10, ragdoll: .9, guardBreak: true, color: o.color });
        f.vel.set(F.x * 6, 17, F.z * 6); f.onGround = false; f.iframes = Math.max(f.iframes, .3);
      } }],
    });
  });

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/descenso-cosmos.js ===== */
/* Descenso de "Ojo del Cosmos" (personaje: redbird): al entrar en la atmósfera la cámara baja a toda velocidad
   atravesando nubes y pájaros hasta llegar a Redbird. Esto crea esas nubes y pájaros en el mundo real.
   Uso desde rbCosmos.js:  const D = rbCosmosDescenso(posRedbird);  D.update(dt);  D.dispose(); */
const rbCosmosDescenso = function (P) {
  const g = new THREE.Group(), mats = [], geos = [], texs = [];
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = rand(60, 196), y = rand(80, 176), r = rand(40, 90), gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.6, 'rgba(240,248,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  const tex = new THREE.CanvasTexture(cv); texs.push(tex);
  // nubes: sprites que siempre miran a la cámara; la cámara baja entre ellas
  for (let i = 0; i < 70; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: rand(.5, .95), depthWrite: false, fog: false }); mats.push(m);
    const sp = new THREE.Sprite(m), s = rand(60, 150); sp.scale.set(s, s * .65, 1);
    sp.position.set(P.x + rand(-80, 80), rand(15, 235), P.z + rand(-80, 80)); g.add(sp);
  }
  // pájaros: dos alas en V que aletean y cruzan rápido
  const wingG = new THREE.PlaneGeometry(2.6, .9); geos.push(wingG);
  const wingM = new THREE.MeshBasicMaterial({ color: 0x1d2433, side: THREE.DoubleSide }); mats.push(wingM);
  const birds = [];
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group(), l = new THREE.Mesh(wingG, wingM), r = new THREE.Mesh(wingG, wingM); l.position.x = -1.3; r.position.x = 1.3; b.add(l, r);
    const sc = rand(1.2, 2.6); b.scale.set(sc, sc, sc);
    b.position.set(P.x + rand(-45, 45), rand(25, 220), P.z + rand(-45, 45));
    const an = rand(0, TAU), sp = rand(55, 110); b.userData = { v: new V3(Math.cos(an) * sp, rand(-6, 6), Math.sin(an) * sp), ph: rand(0, TAU), l, r };
    b.rotation.y = Math.atan2(b.userData.v.x, b.userData.v.z) + Math.PI / 2; g.add(b); birds.push(b);
  }
  scene.add(g);
  let T = 0;
  return {
    update(dt) {
      T += dt;
      for (const b of birds) { const u = b.userData; b.position.addScaledVector(u.v, dt); const f = Math.sin(T * 18 + u.ph) * .7; u.l.rotation.z = f; u.r.rotation.z = -f; }
    },
    dispose() { scene.remove(g); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose()); },
  };
};

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/espacio-cosmos.js ===== */
/* Escena del espacio de "Ojo del Cosmos" (personaje: redbird)
   La Tierra tiene estilo anime (sombreado por bandas, contorno oscuro, borde de atmósfera, océano brillante y costas turquesa)
   y el espacio es oscuro y apagado, más realista (Vía Láctea tenue, estrellas de varios colores, reflejo del sol).
   Se rompe UN trozo del planeta por donde sale el rayo. Se usa desde rbCosmos.js:
     const E = rbCosmosEspacio(origen);  E.update(s, dt, camPos);  E.dispose();
   Este archivo se carga antes que rbCosmos.js (orden alfabético), así que lo que declara aquí lo ve el otro. */
const rbCosmosEspacio = function (O) {
  const R = 45, CAP = .5, g = new THREE.Group();   // CAP = radio angular (en radianes) del trozo que se rompe
  g.position.copy(O);
  const mats = [], geos = [], texs = [];
  const track = (m) => { mats.push(m); return m; };
  const trackG = (x) => { geos.push(x); return x; };
  const dir = new V3(-.6, .42, .68).normalize();   // hacia dónde sale el rayo
  const sunDir = new V3(170, 70, 130).normalize();
  const pivot = new THREE.Group(); pivot.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); g.add(pivot);   // el eje +Y del planeta apunta al rayo

  // ---- fondo: Vía Láctea muy tenue + estrellas de distintos colores y tamaños
  const mv = document.createElement('canvas'); mv.width = 1024; mv.height = 512; const m2 = mv.getContext('2d');
  m2.fillStyle = '#01020a'; m2.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 70; i++) {   // neblina azul-violeta a lo largo de una banda
    const x = rand(0, 1024), y = 256 + Math.sin(x / 1024 * TAU) * 95 + rand(-45, 45), r = rand(50, 140), gr = m2.createRadialGradient(x, y, 0, x, y, r);
    const a = rand(.025, .07); gr.addColorStop(0, i % 3 ? 'rgba(90,110,190,' + a + ')' : 'rgba(150,100,170,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); m2.fillStyle = gr; m2.beginPath(); m2.arc(x, y, r, 0, TAU); m2.fill();
  }
  for (let i = 0; i < 3200; i++) {   // polvo de estrellas concentrado en la banda
    const x = rand(0, 1024), y = 256 + Math.sin(x / 1024 * TAU) * 95 + (rand(-1, 1) + rand(-1, 1)) * 55;
    m2.fillStyle = 'rgba(255,255,255,' + rand(.08, .55) + ')'; m2.fillRect(x, y, rand(.5, 1.4), rand(.5, 1.4));
  }
  const mwTex = new THREE.CanvasTexture(mv); texs.push(mwTex);
  const sky = new THREE.Mesh(trackG(new THREE.SphereGeometry(330, 40, 24)), track(new THREE.MeshBasicMaterial({ map: mwTex, side: THREE.BackSide, depthWrite: false, fog: false })));
  sky.rotation.set(.5, 1.1, .3); g.add(sky);
  const N = 1500, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3), tint = [[1, 1, 1], [.75, .85, 1], [1, .88, .72], [.9, .92, 1]];
  for (let i = 0; i < N; i++) {
    const a = rand(0, TAU), b = Math.acos(rand(-1, 1)), r = rand(250, 320), t = tint[Math.floor(rand(0, tint.length))], br = Math.pow(rand(.15, 1), 1.6);
    sp[i * 3] = Math.sin(b) * Math.cos(a) * r; sp[i * 3 + 1] = Math.cos(b) * r; sp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    sc[i * 3] = t[0] * br; sc[i * 3 + 1] = t[1] * br; sc[i * 3 + 2] = t[2] * br;
  }
  const sg = trackG(new THREE.BufferGeometry()); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  g.add(new THREE.Points(sg, track(new THREE.PointsMaterial({ size: 1.25, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, fog: false }))));
  // reflejo del sol (destello)
  const gv = document.createElement('canvas'); gv.width = gv.height = 256; const g2 = gv.getContext('2d'), gg = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  gg.addColorStop(0, 'rgba(255,244,220,1)'); gg.addColorStop(.18, 'rgba(255,214,160,.55)'); gg.addColorStop(.5, 'rgba(255,170,110,.12)'); gg.addColorStop(1, 'rgba(255,140,90,0)'); g2.fillStyle = gg; g2.fillRect(0, 0, 256, 256);
  const glareTex = new THREE.CanvasTexture(gv); texs.push(glareTex);
  const glare = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glareTex, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  glare.position.copy(sunDir).multiplyScalar(300); glare.scale.set(150, 150, 1); g.add(glare);

  // ---- texturas de la Tierra: océano con degradado, costas turquesa, continentes, desiertos, hielo
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const grad = c.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, '#1d58b8'); grad.addColorStop(.5, '#1f6ad0'); grad.addColorStop(1, '#1d58b8');
  c.fillStyle = grad; c.fillRect(0, 0, 1024, 512);
  const land = ['#4fb04a', '#63c256', '#9ab84a', '#3a9a4a', '#7bc552'], blobs = [];
  for (let i = 0; i < 30; i++) {
    const cx = rand(0, 1024), cy = rand(70, 440), n = 6 + Math.floor(rand(0, 8)), col = land[Math.floor(rand(0, land.length))], parts = [];
    for (let j = 0; j < n; j++) parts.push([cx + rand(-70, 70), cy + rand(-34, 34), rand(14, 52)]);
    blobs.push({ col, parts });
  }
  c.shadowColor = '#6fe4ee'; c.shadowBlur = 30;   // aguas poco profundas junto a la costa
  for (const b of blobs) { c.fillStyle = b.col; for (const p of b.parts) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); } }
  c.shadowBlur = 0;
  for (const b of blobs) { c.fillStyle = b.col; for (const p of b.parts) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); } }
  for (let i = 0; i < 70; i++) {   // desiertos y zonas altas
    const b = blobs[Math.floor(rand(0, blobs.length))], p = b.parts[Math.floor(rand(0, b.parts.length))];
    c.fillStyle = i % 3 ? 'rgba(214,190,110,.55)' : 'rgba(40,110,60,.45)'; c.beginPath(); c.arc(p[0] + rand(-14, 14), p[1] + rand(-10, 10), rand(8, 22), 0, TAU); c.fill();
  }
  c.fillStyle = '#f6fbff'; c.shadowColor = '#ffffff'; c.shadowBlur = 14; c.fillRect(0, 0, 1024, 22); c.fillRect(0, 490, 1024, 22); c.shadowBlur = 0;
  const earthTex = new THREE.CanvasTexture(cv); texs.push(earthTex);
  const cv2 = document.createElement('canvas'); cv2.width = 1024; cv2.height = 512; const c2 = cv2.getContext('2d');
  for (let i = 0; i < 52; i++) {   // nubes esponjosas con sombra azul por debajo
    const x = rand(0, 1024), y = rand(40, 470), n = 4 + Math.floor(rand(0, 5)), parts = [];
    for (let j = 0; j < n; j++) parts.push([x + rand(-28, 28), y + rand(-8, 8), rand(7, 18)]);
    c2.fillStyle = 'rgba(150,185,235,.8)'; for (const p of parts) { c2.beginPath(); c2.arc(p[0], p[1] + 5, p[2], 0, TAU); c2.fill(); }
    c2.fillStyle = 'rgba(255,255,255,.96)'; for (const p of parts) { c2.beginPath(); c2.arc(p[0], p[1], p[2], 0, TAU); c2.fill(); }
  }
  const cloudTex = new THREE.CanvasTexture(cv2); texs.push(cloudTex);

  // ---- sombreado anime (por bandas) de la Tierra y de las nubes
  const VERT = 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  const earthMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: earthTex }, L: { value: sunDir.clone() }, emi: { value: 0 } }, vertexShader: VERT,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; uniform float emi; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW), base = texture2D(map, vUv).rgb;
        float d = dot(N, normalize(L));
        float band = smoothstep(-.06, .06, d) * .5 + smoothstep(.22, .34, d) * .5;
        vec3 col = mix(base * vec3(.10, .15, .34), base * .92, band);
        col += vec3(1., .55, .25) * smoothstep(-.12, 0., d) * (1. - smoothstep(0., .16, d)) * .28;
        float ocean = step(.2, base.b - base.r) * step(base.g, base.b + .05);
        vec3 H = normalize(normalize(L) + V); float spec = pow(max(dot(N, H), 0.), 120.);
        col += vec3(1.) * step(.55, spec) * ocean * .65;
        float rim = pow(1. - max(dot(N, V), 0.), 3.);
        col += vec3(.35, .7, 1.) * rim * .6 * clamp(d * 2. + .5, 0., 1.);
        col += vec3(1., .3, .06) * emi;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const cloudMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: cloudTex }, L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec4 t = texture2D(map, vUv); vec3 N = normalize(vN); float d = dot(N, normalize(L));
        float band = smoothstep(-.05, .1, d) * .6 + smoothstep(.25, .4, d) * .4;
        vec3 col = mix(t.rgb * vec3(.18, .22, .4), t.rgb, band);
        gl_FragColor = vec4(col, t.a * .78);
      }`,
  }));
  const earth = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48)), earthMat);
  const clouds = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48)), cloudMat);
  // versiones con el casquete roto (falta un trozo de planeta donde sale el rayo)
  const earthB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48, 0, TAU, CAP, Math.PI - CAP)), earthMat);
  const cloudsB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat);
  earthB.visible = cloudsB.visible = false;
  // contorno oscuro (estilo anime) y atmósfera brillante en el borde
  const outline = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.02, 56, 36)), track(new THREE.MeshBasicMaterial({ color: 0x07163a, side: THREE.BackSide, fog: false })));
  const atmoMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float rim = pow(1. - abs(dot(N, V)), 3.2), sun = clamp(dot(N, normalize(L)) * .8 + .5, 0., 1.);
        vec3 col = mix(vec3(.18, .45, 1.), vec3(.65, .92, 1.), rim) * rim * 1.7 * (.3 + .7 * sun);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const halo = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.12, 56, 36)), atmoMat);
  // magma que se ve por el agujero, y borde incandescente
  const magma = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * .96, 40, 28)), track(new THREE.MeshBasicMaterial({ color: 0xff4a12, fog: false })));
  const rimR = R * Math.sin(CAP), rim = new THREE.Mesh(trackG(new THREE.TorusGeometry(rimR, 1.1, 8, 64)), track(new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  rim.rotation.x = Math.PI / 2; rim.position.y = R * Math.cos(CAP); rim.visible = false;
  pivot.add(earth, clouds, earthB, cloudsB, magma, rim); magma.visible = false;
  g.add(outline, halo);
  const sunL = new THREE.DirectionalLight(0xfff2dc, 1.15); sunL.position.copy(sunDir).multiplyScalar(220); g.add(sunL, sunL.target);
  g.add(new THREE.AmbientLight(0x3a4f7a, .3));

  // ---- grietas rojas alrededor del trozo que se romperá
  const pts = [];
  for (let i = 0; i < 46; i++) {
    const th = rand(.05, CAP * 1.9), ph = rand(0, TAU);
    let p = new V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).normalize(), prev = p.clone().multiplyScalar(R * 1.006);
    for (let j = 0; j < 8; j++) {
      p = p.clone().add(new V3(rand(-.14, .14), rand(-.14, .14), rand(-.14, .14))).normalize();
      const q = p.clone().multiplyScalar(R * 1.006); pts.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q;
    }
  }
  const lg = trackG(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3)); lg.setDrawRange(0, 0);
  const cracks = new THREE.LineSegments(lg, track(new THREE.LineBasicMaterial({ color: 0xff5a22, transparent: true, opacity: 1, fog: false })));
  pivot.add(cracks);
  const total = pts.length / 3;

  // ---- rayo, onda de choque y pedazos
  const cylG = trackG(new THREE.CylinderGeometry(1, 1, 1, 30, 1, true)); cylG.rotateX(Math.PI / 2); cylG.translate(0, 0, .5);
  const beam = new THREE.Group(), bOut = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xff2a1f, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  const bIn = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  beam.add(bOut, bIn); beam.visible = false; beam.position.copy(dir).multiplyScalar(R * .9); beam.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir); g.add(beam);
  const ring = new THREE.Mesh(trackG(new THREE.RingGeometry(.92, 1, 72)), track(new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  ring.position.copy(dir).multiplyScalar(R); g.add(ring);
  const frags = [], fcols = [0x2a62c0, 0x3f8a3a, 0x7a6a3c, 0xeef4ff, 0x264f9c], fgeo = trackG(new THREE.BoxGeometry(1, 1, 1)), fmats = fcols.map(col => track(new THREE.MeshLambertMaterial({ color: col, emissive: 0x3a0800 })));
  for (let i = 0; i < 90; i++) {
    const th = rand(0, CAP * .95), ph = rand(0, TAU), loc = new V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyQuaternion(pivot.quaternion);
    const m = new THREE.Mesh(fgeo, fmats[i % fmats.length]), s = rand(1.8, 6.5);
    m.position.copy(loc).multiplyScalar(R * rand(.8, 1)); m.scale.set(s, s * rand(.5, 1), s * rand(.6, 1)); m.visible = false;
    m.userData = { v: loc.clone().multiplyScalar(rand(18, 60)).addScaledVector(dir, rand(10, 40)).add(new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6))), r: new V3(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4)) };
    frags.push(m); g.add(m);
  }
  scene.add(g);

  let boomed = false, boomT = 0;
  const api = {
    group: g, origin: O, dir, radius: R, boomed: () => boomed,
    // s = segundos desde que empieza la escena del espacio
    update(s, dt, camPos) {
      earth.rotation.y += dt * .05; clouds.rotation.y += dt * .068; earthB.rotation.y = earth.rotation.y; cloudsB.rotation.y = clouds.rotation.y;
      sky.rotation.y += dt * .004;
      if (!boomed) {
        const k = clamp((s - .35) / 1.7, 0, 1);
        lg.setDrawRange(0, Math.floor(total * k / 2) * 2);
        cracks.material.opacity = .55 + .45 * Math.abs(Math.sin(s * 14));
        earthMat.uniforms.emi.value = .32 * k * k * (.8 + .2 * Math.sin(s * 22));
        if (s > 2.2) {
          boomed = true; boomT = s; earth.visible = false; clouds.visible = false; earthB.visible = cloudsB.visible = true; magma.visible = true; rim.visible = true; cracks.visible = false;
          frags.forEach(m => { m.visible = true; }); beam.visible = true; earthMat.uniforms.emi.value = .06;
        }
        return;
      }
      const b = s - boomT;
      const w = 4.5 + Math.min(b, 1.2) * 6 + Math.sin(s * 40) * .7;
      bOut.scale.set(w * 1.8, w * 1.8, 700); bIn.scale.set(w * .6, w * .6, 700);
      beam.rotateZ(dt * 4); rim.material.opacity = .75 + .25 * Math.sin(s * 18);
      for (const m of frags) { const u = m.userData; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt; m.rotation.z += u.r.z * dt; u.v.multiplyScalar(1 - dt * .12); }
      const rs = 1 + b * 90; ring.scale.setScalar(rs); ring.material.opacity = Math.max(0, .9 - b * .5);
      if (camPos) ring.lookAt(camPos);
    },
    dispose() {
      scene.remove(g);
      mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose());
    },
  };
  return api;
};

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/rbCosmos.js ===== */
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

  // ---- efecto de cine: desenfoque (de zoom y de bordes), viñeta, grano y menos color; solo mientras dura la escena
  let cos = null, bloom0 = null, fxPulse = 0;
  const fxT = { blur: 0, edge: .25, vig: .28, desat: .05 }, fxC = { blur: 0, edge: 0, vig: 0, desat: 0 };
  if (composer && THREE.ShaderPass) {
    try {
      cos = new THREE.ShaderPass({
        uniforms: { tDiffuse: { value: null }, amt: { value: 0 }, edge: { value: 0 }, vig: { value: 0 }, grain: { value: .04 }, desat: { value: 0 }, time: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform sampler2D tDiffuse; uniform float amt, edge, vig, grain, desat, time; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main(){
            vec2 d = vUv - .5; float r = length(d), b = amt + edge * smoothstep(.22, .85, r);
            vec3 c = vec3(0.);
            for (int i = 0; i < 9; i++) { float k = float(i) / 8.; c += texture2D(tDiffuse, vUv - d * b * k * .16).rgb; }
            c /= 9.;
            float l = dot(c, vec3(.299, .587, .114)); c = mix(c, vec3(l), desat);
            c *= 1. - smoothstep(.3, .95, r) * vig;
            c += (h(vUv * 800. + time) - .5) * grain;
            gl_FragColor = vec4(c, 1.);
          }`,
      });
      composer.addPass(cos);
    } catch (e) { cos = null; }
  }
  const fxTo = (blur, edge, vig, desat) => { fxT.blur = blur; fxT.edge = edge; fxT.vig = vig; fxT.desat = desat; };
  const applyFx = (dt) => {
    const k = Math.min(1, dt * 7);
    for (const n in fxT) fxC[n] += (fxT[n] - fxC[n]) * k;
    if (cos) { const u = cos.uniforms; u.amt.value = fxC.blur + fxPulse * 1.1; u.edge.value = fxC.edge; u.vig.value = fxC.vig; u.desat.value = fxC.desat; u.time.value = (performance.now() % 100000) / 1000; }
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
    killBeam(); if (space) { try { space.dispose(); } catch (e) { } space = null; } if (desc) { try { desc.dispose(); } catch (e) { } desc = null; }
    if (graded) { cineGrade(false); graded = false; }
    setFx(0, 0, 1); glow.style.opacity = 0; document.body.classList.remove('cine');
    if (cos && composer) { const i = composer.passes.indexOf(cos); if (i >= 0) composer.passes.splice(i, 1); cos = null; }
    if (bloom0 != null && bloomPass) bloomPass.strength = bloom0;
    f.cineHide = false; f.iframes = Math.min(f.iframes, .6);
    if (mine && G.camScript === mine) G.camScript = null;
  };

  const camFn = (dt) => {
    if (finished || f.action !== A) { cleanup(); return false; }
    const t = A.t, gl = gy + .16; glow.style.opacity = 0;
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
      if (s < 2.2) {
        const a = .5 + s * .12, dist = 170 - s * 22, e = ease(s / 2.2); fxTo(.0, .55, .45, .22); G.shake = Math.max(G.shake, .02 + e * .08);
        setCam(new V3(O.x + Math.cos(a) * dist, O.y + 28 - e * 10, O.z + Math.sin(a) * dist), O, 42 - e * 4, 0, 'sp1', 0, 1.1);
      } else if (s < 4) {   // corte anime: el rayo sale del agujero
        if (!did.boom) { did.boom = true; impactFrame('#ffffff', .14); screenFlash(1); G.shake = 1.6; sfx('boom', f.pos); sfx('beam', f.pos); G.linesI = 1; }
        const k = (s - 2.2) / 1.8, hole = new V3(O.x + d.x * R, O.y + d.y * R, O.z + d.z * R);
        fxTo(Math.max(0, 1 - (s - 2.2) * 1.6), .5, .42, .15);
        setCam(new V3(hole.x - 55 + k * 12, hole.y - 8, hole.z + 62 - k * 8), new V3(hole.x + d.x * 22, hole.y + d.y * 22, hole.z + d.z * 22), 62 - k * 6, .12 - k * .1, 'sp2', 0, 2.2);
        G.shake = Math.max(G.shake, .7 * (1 - k));
      } else if (s < 5.2) {   // plano abierto: el planeta con su agujero y los pedazos
        const k = (s - 4) / 1.2; fxTo(0, .6, .45, .22); G.shake = Math.max(G.shake, .08);
        setCam(new V3(O.x + 215 - k * 30, O.y + 55 - k * 15, O.z + 115), new V3(O.x + d.x * 20, O.y + d.y * 20, O.z + d.z * 20), 50 + k * 4, 0, 'sp3', .5, 1.2);
      } else {   // la cámara se lanza al planeta a toda velocidad y entra en la atmósfera
        const k = clamp((s - 5.2) / (SPACE_DUR - 5.2), 0, 1), e = k * k * k, from = new V3(O.x + 185, O.y + 40, O.z + 115);
        const side = new V3(d.z, 0, -d.x).normalize(), tgt = new V3(O.x + side.x * R * 1.04, O.y + 8, O.z + side.z * R * 1.04);
        fxTo(.2 + k * 1.5, .6, .35, .2 * (1 - k)); G.shake = Math.max(G.shake, .1 + k * .6);
        setCam(lerpV(from, tgt, e), O, 54 + 36 * e, k * .4, 'sp4', .5, 1.5);
        G.linesI = 1; const cl = clamp((k - .55) / .45, 0, 1); setFx(cl, clamp((k - .85) / .15, 0, 1), 1 + cl * 1.4); glow.style.opacity = clamp((k - .35) / .45, 0, 1) * (1 - clamp((k - .85) / .15, 0, 1)) * .9;
      }
    } else if (desc) {   // descenso: nubes y pájaros pasando a toda velocidad hasta quedar en la cámara normal
      const u = clamp((t - descT0) / DESC_DUR, 0, 1), P = f.pos, np = normalPose();
      desc.update(dt); G.linesI = 1; fxTo((1 - u) * 1.4, .4 * (1 - u) + .15, .3, 0); G.shake = Math.max(G.shake, .35 * (1 - u));
      const start = new V3(P.x + 22, P.y + 235, P.z - 28), e = ease2(u) * .35 + u * u * .65;
      const pos = lerpV(start, np.pos, e), tn = performance.now() / 1000, hand = (1 - u) * 1.6;
      camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(P.x, P.y + 1.3, P.z); camera.rotateZ((1 - u) * (1 - u) * .25);
      camera.rotateX(Math.sin(tn * 1.3) * .0045 * hand); camera.rotateY(Math.sin(tn * 1.7 + 1) * .0045 * hand);
      const w = ease2(clamp((u - .55) / .45, 0, 1)); if (w > 0) camera.quaternion.slerp(np.quat, w);
      lastShot = 'desc'; blend = null;
      const fov = 80 + (np.fov - 80) * ease2(u); cam.fov = fov; camera.fov = fov; camera.updateProjectionMatrix();
    }
    applyFx(dt);
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
          spaceT0 = t; cineGrade(true, f); graded = true; scene.fog = null; scene.background = new THREE.Color(0x01020a); if (bloomPass) { if (bloom0 == null) bloom0 = bloomPass.strength; bloomPass.strength = bloom0 * 2.4; }
          space = rbCosmosEspacio(new V3(f.pos.x, 2600, f.pos.z)); screenFlash(1); sfx('whoosh');
        } else spaceT0 = t;
      }
      // ---- descenso entre nubes y pájaros hasta Redbird
      if (success && did.space && !did.desc && t >= spaceT0 + SPACE_DUR) {
        did.desc = true;
        if (space) { space.dispose(); space = null; }
        if (graded) { cineGrade(false); graded = false; }
        if (bloom0 != null && bloomPass) bloomPass.strength = bloom0;
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

/* ===== personajes/redbird/Skills/Code/Prismas Reflectantes/rbMirrors.js ===== */
/* Habilidad: Prismas Reflectantes  ·  personaje: redbird  ·  movimiento: rbMirrors
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 2 · tocar hasta 3 veces: prismas alrededor del rival y el rayo rebota por todos
CF.mover('rbMirrors', function (f, o) {
    const COL = ['#ff2d55', '#ff7a1a', '#ffe14d', '#ffffff'], mirrors = [];
    const killMirrors = () => mirrors.forEach(m => { m.dead = true; m.grp.visible = false; });
    const place = s => {
      const tg = findTarget(f, 28), n = mirrors.length, c = tg ? tg.pos.clone() : front(f, 9, 0);
      const th = Math.atan2(c.x - f.pos.x, c.z - f.pos.z) + [2.1, -2.1, 0][n];
      const pos = clampArena(new V3(c.x + Math.sin(th) * 5.5, 0, c.z + Math.cos(th) * 5.5)); pos.y = groundAt(pos.x, pos.z) + 1.8;
      const grp = new THREE.Group(), a = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glowMat(COL[0], .55)), b = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glowMat('#ffffff', .9));
      a.scale.set(.7, 1.5, .18); b.scale.set(.4, 1.1, .1); grp.add(a, b); grp.position.copy(pos);
      const m = { grp, pos, dead: false }; mirrors.push(m);
      addFx(grp, 9, (g, k) => { if (!m.dead) g.rotation.y += .06; }, () => { a.geometry.dispose(); a.material.dispose(); b.geometry.dispose(); b.material.dispose(); });
      ringAt(new V3(pos.x, pos.y - 1.7, pos.z), COL[0], 2.4, .5); sphereFlash(pos, COL[0], 1.4, .3); sfx('zap', pos);
      startAction(f, { name: 'rbMirror', dur: .3, bbClip: 'despertar_espejo', speedMul: .5, aim: true, eyes: true });
      s.last = s.t;
    };
    const shoot = s => {
      seqEnd(f);
      const tg = findTarget(f, 34), pts = [front(f, .35, 1.72), ...mirrors.map(m => m.pos.clone())];
      startAction(f, { name: 'rbMirrorFire', dur: 1, bbClip: 'despertar_rebote', speedMul: 0, aim: true, noControl: true, eyes: true });
      const legs = pts.length;
      for (let n = 0; n < legs; n++) later(.12 + n * .14, () => {
        const a = pts[n], last = n === legs - 1, col = COL[Math.min(n, 3)];
        let b;
        if (last) { b = tg && tg.alive ? chestOf(tg).clone() : pts[n].clone().addScaledVector(pts[n].clone().sub(pts[Math.max(0, n - 1)]).normalize(), 14); }
        else b = pts[n + 1];
        laserLeg(a, b, col, .22 + n * .05, .28); sphereFlash(b, col, .9 + n * .25, .25); sfx('beam', a, .6);
        const F = b.clone().sub(a).setY(0).normalize();
        if (last && tg && tg.alive) explode(f, b, 2.8, { dmg: 8, kb: 12, up: 8, ragdoll: .9, color: col, guardBreak: true, hitstop: .08, shake: .35 });
        else for (const g of enemiesOf(f)) if (segDist(chestOf(g), a, b) < .9 + n * .15) applyHit(f, g, { dmg: [2.6, 4, 5.5, 8][Math.min(n, 3)], stun: .4, kb: 3, up: 1, dir: F, color: col, hitstop: .03, shake: .2 });
      });
      later(.12 + legs * .14 + .35, killMirrors);
    };
    const seq = seqStart(f, {
      slot: o.slot, lock: true, last: 0, autoOnly: true,
      auto: (s, k) => k === 'tap' && mirrors.length < 3 && s.t - s.last > .4,
      onCancel: killMirrors,
      step(f, s, i) {
        if (s.firing) return;
        if (i.down && mirrors.length < 3) { place(s); if (mirrors.length >= 3) { s.firing = true; later(.35, () => shoot(s)); } }
        else if (s.t - s.last > 3) { s.firing = true; shoot(s); return; }
        s.hud = { txt: `PRISMAS ${mirrors.length}/3`, pct: 1 - (s.t - s.last) / 3, col: COL[Math.min(mirrors.length, 3)] };
      },
    });
    place(seq);
  });

/* ===== personajes/redbird/Skills/Code/Ráfaga Óptica/eyeBolts.js ===== */
/* Habilidad: Ráfaga Óptica  ·  personaje: redbird  ·  movimiento: eyeBolts
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('eyeBolts', function (f, o) {
    startAction(f, {
      name: 'bolts', dur: .5, eyes: true, aim: true, speedMul: .4, anim: [[0, 'visorTouch', 800]],
      steps: [.1, .2, .3].map(at => ({ at, fn: () => { f.yaw = aimYawFor(f); spawnProj(f, f.yaw, Object.assign({}, o, { eyes: true })); sfx('zap', f.pos, .6); } })),
    });
  });

/* ===== personajes/redbird/Skills/Code/Sobrecarga del Visor/rbOverload.js ===== */
/* Habilidad: Sobrecarga del Visor  ·  personaje: redbird  ·  movimiento: rbOverload
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 1 · mantener para cargar y soltar para disparar
CF.mover('rbOverload', function (f, o) {
    if (f.awak > 0) javiSpeak(f, 'skill');   // voz de la habilidad en la ulti

    const LV = [.55, 1.2, 1.9], MAXC = 2.5, COL = ['#ff2d55', '#ff7a1a', '#ffe14d', '#ffffff'], NAME = ['CARGANDO…', 'NIVEL 1', 'NIVEL 2', '¡NIVEL MÁXIMO!'];
    const lvl = t => (t >= LV[2] ? 3 : t >= LV[1] ? 2 : t >= LV[0] ? 1 : 0), hold = o.hold || rand(.8, 2.2);
    startAction(f, { name: 'rbCharge', dur: MAXC + 1, bbClip: 'despertar_carga', anim: [[0, 'visorTouch', 700]], speedMul: .12, aim: true, eyes: true });
    const fire = L => {
      seqEnd(f);
      if (L < 1) { popText(chestOf(f), 'Sin carga', '#aab', 16); endAction(f); f.cd[o.slot] = 1.5; return; }
      const P = [null, { len: 24, width: .6, dur: .7, dmg: 2.4, push: 5 }, { len: 32, width: 1, dur: 1, dmg: 3.4, push: 9 }, { len: 42, width: 1.7, dur: 1.5, dmg: 4.6, push: 15, gb: true }][L];
      MOVES.beam(f, Object.assign({ eyes: true, charge: .1, color: COL[L], bbClip: 'despertar_disparo' }, P));
      const F = fwd(f.yaw); f.vel.x -= F.x * (2 + L * 2); f.vel.z -= F.z * (2 + L * 2);
      if (f.isPlayer) { G.fovKick = Math.max(G.fovKick, 4 + L * 3); G.shake = Math.max(G.shake, .25 * L); }
    };
    seqStart(f, {
      slot: o.slot, lock: true, lv: 0, autoOnly: true,
      auto: (s, k) => k === 'held' && s.t < hold,
      onCancel: () => { if (f.action && f.action.name === 'rbCharge') endAction(f); },
      step(f, s, i) {
        const L = lvl(s.t), org = front(f, .35, 1.72);
        if (f.hurtT > 0 && s.t > .12) { popText(chestOf(f), '¡Carga interrumpida!', '#ff8899', 18); endAction(f); seqEnd(f); return; }
        if (L > s.lv) {
          s.lv = L; ringAt(org, COL[L], 2.2 + L * .5, .35, 'face', f.yaw); burst(org, 8 + L * 6, COL[L], 7, .16, .3, 0); sfx('zap', f.pos);
          if (f.isPlayer) G.shake = Math.max(G.shake, .1 * L);
        }
        const an = rand(0, TAU), rr = 1.2 + L * .35;
        emit(org.x + Math.cos(an) * rr, org.y + rand(-.8, .8), org.z + Math.sin(an) * rr, -Math.cos(an) * 8, rand(-1, 1), -Math.sin(an) * 8, COL[L], .12 + L * .03, .18, 0, 0);
        s.hud = { txt: NAME[L], pct: s.t / MAXC, col: COL[L] };
        if (s.t >= MAXC) {
          seqEnd(f); endAction(f);
          explode(f, chestOf(f), 4.5, { dmg: 6, kb: 10, up: 6, ragdoll: .6, color: COL[0] });
          f.stun = 1; popText(chestOf(f), '¡SOBRECARGA!', COL[0], 26); f.cd[o.slot] = 6;
        } else if (!i.held && s.t > .15) fire(L);
      },
    });
  });

/* ===== personajes/redbird/Skills/_sin_usar/Cadena Óptica/Code/rbChain.js ===== */
/* Habilidad: Cadena Óptica  ·  personaje: redbird  ·  movimiento: rbChain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 4 · secuencia de flechas: cada acierto lo golpea desde ese lado; con las 4 lo lanza y lo remata un rayo del cielo
CF.mover('rbChain', function (f, o) {
    const tg = findTarget(f, 14); if (!tg) return false;
    const DIRS = [{ k: ['KeyW', 'ArrowUp'], g: '↑' }, { k: ['KeyA', 'ArrowLeft'], g: '←' }, { k: ['KeyS', 'ArrowDown'], g: '↓' }, { k: ['KeyD', 'ArrowRight'], g: '→' }];
    const CLIPS = ['despertar_golpe_a', 'despertar_golpe_b', 'despertar_golpe_d', 'despertar_golpe_c'], W = [1, .9, .8, .7], COL = '#ffe14d';
    const seqK = []; for (let n = 0; n < 4; n++) { let d; do d = Math.random() * 4 | 0; while (n && d === seqK[n - 1]); seqK.push(d); }
    const camF = fwd(cam.yaw), camR = rightOf(cam.yaw);
    const around = d => { const v = [camF.clone(), camR.clone().negate(), camF.clone().negate(), camR.clone()][d]; return clampArena(new V3(tg.pos.x + v.x * 2.1, 0, tg.pos.z + v.z * 2.1)); };
    const jump = d => {
      ghost(f, COL, .5, .3); const from = chestOf(f).clone(), q = around(d);
      f.pos.set(q.x, Math.max(groundAt(q.x, q.z), tg.pos.y), q.z); f.vel.set(0, 0, 0); f.yaw = yawTo(f, tg);
      ghost(f, COL, .35, .25); slashLine(from, chestOf(f), COL, .25, .14); ringAt(f.pos, COL, 2, .3); sfx('tp', f.pos);
    };
    const end = () => seqEnd(f);
    const fail = msg => {
      end(); popText(chestOf(f), msg, '#ff8899', 22);
      startAction(f, { name: 'rbFail', dur: .35, bbClip: 'despertar_golpe_c', speedMul: 0, aim: true, noControl: true });
      applyHit(f, tg, { dmg: 3, kb: 9, up: 3, color: COL, hitstop: .05, shake: .2 });
    };
    const finale = () => {
      end(); jump(2);
      startAction(f, { name: 'rbFinal', dur: 1.3, bbClip: 'despertar_final', speedMul: 0, noControl: true, aim: true, eyes: true });
      later(.3, () => { if (!tg.alive) return; applyHit(f, tg, { dmg: 5, kb: 0, up: 15, stun: 1.6, color: COL, hitstop: .08, shake: .3 }); sfx('heavy', tg.pos); });
      later(.75, () => {
        const P = tg.pos.clone(), top = new V3(P.x, P.y + 18, P.z), mid = chestOf(tg).clone();
        laserLeg(top, mid, '#ffffff', .7, .5); lightColumn(new V3(P.x, groundAt(P.x, P.z), P.z), COL, 30); sfx('ult', P);
        explode(f, new V3(P.x, mid.y, P.z), 3.6, { dmg: 12, kb: 8, up: 4, ragdoll: 1.4, color: COL, guardBreak: true, hitstop: .14, shake: .6 });
      });
    };
    startAction(f, { name: 'rbDash', dur: 99, bbClip: 'despertar_blink', speedMul: 0, noControl: true, aim: true, eyes: true });
    jump(2);
    const acc = rand(.6, .85);
    seqStart(f, {
      slot: o.slot, lock: true, i: 0, ph: 'dash', pt: 0, react: rand(.25, .55),
      onCancel: () => { if (f.action && /^rb/.test(f.action.name)) endAction(f); },
      step(f, s, ctl) {
        f.iframes = Math.max(f.iframes, .2);
        if (!tg.alive) { end(); endAction(f); return; }
        f.yaw = yawTo(f, tg);
        const glyphs = () => seqK.map((d, n) => n < s.i ? '✔' : n === s.i ? '[' + DIRS[d].g + ']' : DIRS[d].g).join('   ');
        if (s.ph === 'dash') {
          s.hud = { txt: '¡PREPARATE!', pct: 1 - s.t / .4, col: COL };
          if (s.t >= .4) { s.ph = 'ask'; s.pt = s.t; startAction(f, { name: 'rbWait', dur: 99, bbClip: 'despertar_espera', speedMul: 0, noControl: true, aim: true, eyes: true }); }
        } else if (s.ph === 'ask') {
          const left = W[s.i] - (s.t - s.pt); let got = -1;
          if (f.isPlayer) { for (let d = 0; d < 4; d++) if (DIRS[d].k.some(k => pressed.has(k))) got = d; }
          else if (s.t - s.pt > s.react) got = Math.random() < acc ? seqK[s.i] : (seqK[s.i] + 1) % 4;
          s.hud = { txt: glyphs(), pct: left / W[s.i], col: COL };
          if (got >= 0) {
            if (got !== seqK[s.i]) { fail('¡TECLA EQUIVOCADA!'); return; }
            jump(got); s.ph = 'strike'; s.pt = s.t;
            startAction(f, { name: 'rbStrike', dur: .32, bbClip: CLIPS[got], speedMul: 0, noControl: true, aim: true });
            impactStar(chestOf(tg), COL, 1.8, .22);
            applyHit(f, tg, { dmg: [3, 4, 5, 6.5][s.i], stun: 1.1, kb: .6, up: 0, dir: fwd(f.yaw), color: COL, hitstop: .06, shake: .25 });
          } else if (left <= 0) fail('¡TARDE!');
        } else if (s.ph === 'strike') {
          s.hud = { txt: glyphs(), pct: 1, col: '#ffffff' };
          if (s.t - s.pt >= .3) {
            s.i++;
            if (s.i >= 4) finale();
            else { s.ph = 'ask'; s.pt = s.t; startAction(f, { name: 'rbWait', dur: 99, bbClip: 'despertar_espera', speedMul: 0, noControl: true, aim: true, eyes: true }); }
          }
        }
      },
    });
  });

/* ===== personajes/sekza/Skills/Code/Corriente Ascendente/sekUpdraft.js ===== */
/* Habilidad: Corriente Ascendente  ·  personaje: sekza  ·  movimiento: sekUpdraft
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Corriente Ascendente: columna de aire que sube a los rivales y los deja flotando indefensos
CF.mover('sekUpdraft', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), R = o.r || 3.4, P = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9);
    clampArena(P, 2); P.y = groundAt(P.x, P.z);
    startAction(f, {
      name: 'sekUpdraft', bbClip: 'habilidad_4_corriente', dur: .7, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        warnCircle(P, R, o.color, .6); sfx('whoosh', P);
        later(.6, () => {
          for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - P.x, g.pos.z - P.z) < R + .4 && g.pos.y - P.y < 3)
            applyHit(f, g, { dmg: o.dmg || 3, stun: 1.7, kb: 0, up: 19, color: o.color, guardBreak: true, hitstop: .05, shake: .25 });
          lightColumn(P, o.color, 22); ringAt(P, o.color, R * 1.4, .5); sfx('heavy', P);
          for (let n = 0; n < 14; n++) later(n * .045, () => { for (let k = 0; k < 4; k++) { const an = n * .8 + k * TAU / 4, rr = R * .8 * (1 - n / 18); emit(P.x + Math.cos(an) * rr, P.y + .2, P.z + Math.sin(an) * rr, -Math.sin(an) * 5, rand(12, 20), Math.cos(an) * 5, k % 2 ? o.color : '#ffffff', .2, .6, 0, 0); } });
        });
      } }],
    });
  });

/* ===== personajes/sekza/Skills/Code/Lluvia de Plumas/sekRain.js ===== */
/* Habilidad: Lluvia de Plumas  ·  personaje: sekza  ·  movimiento: sekRain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Lluvia de Plumas (despierta): se eleva y llueven plumas sobre la zona del rival
CF.mover('sekRain', function (f, o) {
    const tg0 = findTarget(f, 22), F = fwd(f.yaw), col = o.color; let acc = 0;
    const C = () => (tg0 && tg0.alive ? tg0.pos : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9));
    const drop = () => {
      const c = C(), an = rand(0, TAU), rr = Math.sqrt(Math.random()) * 6.5, q = clampArena(new V3(c.x + Math.cos(an) * rr, 0, c.z + Math.sin(an) * rr), 1); q.y = groundAt(q.x, q.z);
      slashLine(new V3(q.x + rand(-.6, .6), q.y + 13, q.z + rand(-.6, .6)), new V3(q.x, q.y + .5, q.z), col, .3, .13); ringAt(q, col, 1.3, .3);
      later(.28, () => {
        for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - q.x, g.pos.z - q.z) < 1.9 && g.pos.y - q.y < 2.6) applyHit(f, g, { dmg: o.dmg || 3.2, stun: .45, kb: 3, up: 4, color: col, hitstop: .03, shake: .12 });
        burst(new V3(q.x, q.y + .5, q.z), 8, col, 6, .16, .3, .8); burst(new V3(q.x, q.y + .5, q.z), 4, '#ffffff', 5, .12, .25, .8);
      });
    };
    startAction(f, {
      name: 'sekRain', bbClip: 'despertar_lluvia', dur: 2.1, noControl: true, armor: true, aim: true,
      start: () => { f.vel.set(0, 10, 0); f.onGround = false; sfx('whoosh', f.pos); ringAt(new V3(f.pos.x, f.pos.y + .05, f.pos.z), col, 4, .5); },
      tick: (a, t, dt) => {
        if (t < 1.85) { const hy = groundAt(f.pos.x, f.pos.z) + 3.4; f.vel.y = t < .3 ? 10 : clamp((hy - f.pos.y) * 7, -6, 9); f.vel.x *= .9; f.vel.z *= .9; }
        if (t > .45 && t < 1.8) { acc += dt; while (acc >= .09) { acc -= .09; drop(); } }
      },
    });
  });

/* ===== personajes/sekza/Skills/Code/Mirada Letal/sekLock.js ===== */
/* Habilidad: Mirada Letal  ·  personaje: sekza  ·  movimiento: sekLock
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Mirada Letal (despierta): fija a todos los rivales y los castiga con luz del cielo
CF.mover('sekLock', function (f, o) {
    const tgs = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < (o.range || 30)); if (!tgs.length) return false;
    const col = o.color;
    startAction(f, {
      name: 'sekLock', bbClip: 'despertar_mirada', dur: 2.2, speedMul: .15, aim: true, eyes: true, armor: true,
      steps: [
        { at: .35, fn: () => {
          sfx('zap', f.pos);
          for (const tg of tgs) {
            const grp = new THREE.Group(), rg = new THREE.RingGeometry(.86, 1, 40), cg = new THREE.BoxGeometry(2.4, .05, .12), cg2 = new THREE.BoxGeometry(.12, .05, 2.4), m = glowMat(col, .9), m2 = glowMat('#ffffff', .9);
            const ring = new THREE.Mesh(rg, m); ring.rotation.x = -Math.PI / 2; grp.add(ring, new THREE.Mesh(cg, m2), new THREE.Mesh(cg2, m2));
            addFx(grp, .95, (g, k) => { g.position.set(tg.pos.x, groundAt(tg.pos.x, tg.pos.z) + .15, tg.pos.z); g.rotation.y += .12; const sc = 2.6 - 1.5 * easeOut(k); g.scale.set(sc, 1, sc); m.opacity = .5 + .5 * Math.abs(Math.sin(k * 22)); }, () => { rg.dispose(); cg.dispose(); cg2.dispose(); m.dispose(); m2.dispose(); });
          }
        } },
        { at: 1.3, fn: () => {
          for (const tg of tgs) {
            if (!tg.alive) continue;
            const c = chestOf(tg).clone(), top = new V3(c.x, c.y + 16, c.z);
            laserLeg(top, c, col, .5, .4); laserLeg(top, c, '#ffffff', .2, .35); impactStar(c, '#ffffff', 2.2, .25);
            explode(f, c, 2.2, { dmg: o.dmg || 9, stun: .8, kb: 4, up: 8, color: col, guardBreak: true, hitstop: .1, shake: .4 });
          }
          screenFlash(.25); sfx('ult', f.pos, .7);
        } },
      ],
    });
  });

/* ===== personajes/sekza/Skills/Code/Ojo del Águila/sekParry.js ===== */
/* Habilidad: Ojo del Águila  ·  personaje: sekza  ·  movimiento: sekParry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Ojo del Águila: parry. Si la golpean durante la ventana, esquiva y contraataca desde atrás (mecánica de contra)
CF.mover('sekParry', function (f, o) {
    startAction(f, { name: 'sekParry', bbClip: 'habilidad_3_parry', dur: .9, counter: true, speedMul: 0, anim: [[0, 'counter', 700]], start: () => { ringAt(chestOf(f), o.color, 1.8, .35, 'face', f.yaw); sfx('block', f.pos); } });
  });

/* ===== personajes/sekza/Skills/Code/Picada de Halcón/sekDive.js ===== */
/* Habilidad: Picada de Halcón  ·  personaje: sekza  ·  movimiento: sekDive
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Picada de Halcón: sube con las alas, marca el piso y cae como flecha con un impacto que lanza
CF.mover('sekDive', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = new V3(), dir = new V3();
    const setDest = () => { if (tg && tg.alive) dest.set(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z); else dest.set(f.pos.x + F.x * 10, groundAt(f.pos.x + F.x * 10, f.pos.z + F.z * 10), f.pos.z + F.z * 10); clampArena(dest, 1.5); };
    setDest(); let dove = false, hit = false, gh = 0;
    startAction(f, {
      name: 'sekDive', bbClip: 'habilidad_2_picada', dur: 1.6, noControl: true, armor: true, aim: true,
      start: () => { f.vel.set(0, 17, 0); f.onGround = false; f.iframes = Math.max(f.iframes, .7); sfx('jump', f.pos); ringAt(new V3(f.pos.x, f.pos.y + .05, f.pos.z), o.color, 3, .4); burst(new V3(f.pos.x, f.pos.y + .3, f.pos.z), 14, o.color, 6, .2, .4, 1); warnCircle(dest, 2.8, o.color, .6); },
      tick: (a, t, dt) => {
        if (!dove) {
          setDest(); f.yaw = Math.atan2(dest.x - f.pos.x, dest.z - f.pos.z); f.vel.x *= .9; f.vel.z *= .9;
          if (t >= .5) { dove = true; dir.set(dest.x - f.pos.x, dest.y + .8 - f.pos.y, dest.z - f.pos.z).normalize(); f.vel.set(dir.x * 30, dir.y * 30, dir.z * 30); sfx('dash', f.pos); }
          return;
        }
        f.vel.x = dir.x * 30; f.vel.z = dir.z * 30; gh += dt; if (gh > .05) { gh = 0; ghost(f, o.color, .45, .25); }
        if (!hit) for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(chestOf(f)) < 1.6) { hit = true; applyHit(f, g, { dmg: 4, stun: .5, kb: 3, dir: new V3(dir.x, 0, dir.z), color: o.color, guardBreak: true, hitstop: .05, shake: .2 }); break; }
        if (f.onGround && t > .6) {
          explode(f, new V3(f.pos.x, f.pos.y + .8, f.pos.z), 3, { dmg: o.dmg || 9, kb: 8, up: 11, ragdoll: .9, color: o.color, guardBreak: true, hitstop: .1, shake: .5 });
          f.vel.x = f.vel.z = 0; a.t = Math.max(a.t, 1.0); dove = false; a.tick = null;
        }
      },
    });
  });

/* ===== personajes/sekza/Skills/Code/Viento Cortante/sekBoomerang.js ===== */
/* Habilidad: Viento Cortante  ·  personaje: sekza  ·  movimiento: sekBoomerang
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Viento Cortante: una hoz de viento sale en curva, llega lejos y vuelve jalando a los que cruza
CF.mover('sekBoomerang', function (f, o) {
    startAction(f, {
      name: 'sekBoomerang', bbClip: 'habilidad_1_viento', dur: .5, speedMul: .3, aim: true,
      steps: [{ at: .16, fn: () => {
        const F = fwd(f.yaw), R = rightOf(f.yaw), side = Math.random() < .5 ? 1 : -1, col = o.color, T = 1.5, tg0 = findTarget(f, 18), R0 = tg0 ? clamp(dist2d(f, tg0) + 1.5, 7, 16) : (o.range || 11), out = new Set(), back = new Set();
        const g1 = new THREE.RingGeometry(.5, 1, 20, 1, -1.2, 2.4), g2 = new THREE.RingGeometry(.78, 1, 20, 1, -1.2, 2.4), m1 = glowMat(col, .75), m2 = glowMat('#ffffff', .95);
        const grp = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; grp.add(a, b); grp.scale.setScalar(1.7); scene.add(grp);
        sfx('whoosh', f.pos); let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const u = Math.min(1, t / T);
          const fw = R0 * (1 - Math.cos(TAU * u)) / 2, la = side * 2.4 * Math.sin(TAU * u);
          grp.position.set(f.pos.x + F.x * fw + R.x * la, f.pos.y + 1.2, f.pos.z + F.z * fw + R.z * la); grp.rotation.y += .55;
          emit(grp.position.x, grp.position.y, grp.position.z, rand(-1, 1), rand(0, 1), rand(-1, 1), col, .16, .22, 0, 0);
          for (const g of enemiesOf(f)) {
            if (chestOf(g).distanceTo(grp.position) > 2.0) continue;
            if (u < .5 && !out.has(g)) { out.add(g); applyHit(f, g, { dmg: o.dmg || 4, stun: .35, kb: 3, up: 2, dir: F, color: col, hitstop: .04, shake: .15 }); }
            else if (u >= .5 && !back.has(g)) { back.add(g); applyHit(f, g, { dmg: o.dmg || 4, stun: .5, kb: 8, up: 1, dir: new V3(f.pos.x - g.pos.x, 0, f.pos.z - g.pos.z), color: col, hitstop: .04, shake: .15 }); }
          }
          if (u < 1 && G.state === 'play') later(0, tick);
          else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });

/* ===== personajes/sekza/Skills/Code/Vuelo Rasante/sekFlight.js ===== */
/* Habilidad: Vuelo Rasante  ·  personaje: sekza  ·  movimiento: sekFlight
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Vuelo Rasante (despierta): sale como flecha persiguiendo al rival y lanza a todos los que cruza
CF.mover('sekFlight', function (f, o) {
    javiSpeak(f, 'fly');
    const tg = findTarget(f, 26), hitSet = new Set(), dir = fwd(f.yaw).clone(); let gh = 0;
    startAction(f, {
      name: 'sekFlight', bbClip: 'despertar_vuelo', dur: 1.4, noControl: true, armor: true, aim: true, speedMul: 0,
      start: () => { f.vel.set(0, 7, 0); f.onGround = false; sfx('whoosh', f.pos); ghost(f, o.color, .5, .3); },
      tick: (a, t, dt) => {
        if (t < .2) { f.vel.x = f.vel.z = 0; f.vel.y = 7; return; }
        if (tg && tg.alive && t < .95) dir.copy(chestOf(tg).sub(chestOf(f)).normalize());
        const V = 27; f.vel.set(dir.x * V, dir.y * V * .8 + 1.5, dir.z * V); f.yaw = Math.atan2(dir.x, dir.z);
        gh += dt; if (gh > .05) { gh = 0; ghost(f, o.color, .4, .25); emit(f.pos.x, f.pos.y + 1, f.pos.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), o.color, .2, .3, 0, 0); }
        for (const g of enemiesOf(f)) if (!hitSet.has(g) && chestOf(g).distanceTo(chestOf(f)) < 1.9) {
          hitSet.add(g); applyHit(f, g, { dmg: o.dmg || 6, stun: .7, kb: 9, up: 7, dir: new V3(dir.x, 0, dir.z), color: o.color, guardBreak: true, hitstop: .06, shake: .3 });
          impactStar(chestOf(g), o.color, 2, .22); sfx('heavy', g.pos, .6);
        }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });

/* ===== personajes/rocket/Skills/Code/Enjambre/rkSwarm.js ===== */
/* Habilidad: Enjambre  ·  personaje: rocket  ·  movimiento: rkSwarm
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Enjambre (despierta): arañitas que persiguen al rival y lo muerden
CF.mover('rkSwarm', function (f, o) {
    const col = o.color, N = o.n || 6;
    startAction(f, {
      name: 'rkSwarm', bbClip: 'despertar_enjambre', dur: .6, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        const kids = [], dark = () => new THREE.MeshBasicMaterial({ color: '#15151c' });
        for (let i = 0; i < N; i++) {
          const an = i / N * TAU, mesh = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .6), dark());
          mesh.add(body);
          for (const sx of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, .1), new THREE.MeshBasicMaterial({ color: col })); eye.position.set(sx * .12, .1, .3); mesh.add(eye);
            for (let k = 0; k < 3; k++) { const lg = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .04), dark()); lg.position.set(sx * .35, -.05, -.2 + k * .2); lg.rotation.z = sx * -.5; mesh.add(lg); }
          }
          mesh.position.set(f.pos.x + Math.cos(an) * 1.2, f.pos.y + 1.2, f.pos.z + Math.sin(an) * 1.2); scene.add(mesh);
          kids.push({ mesh, vel: new V3(Math.cos(an) * 6, 5, Math.sin(an) * 6), bites: 0, bt: 0, t: 0, dead: false });
        }
        burst(chestOf(f), 24, col, 7, .16, .5, 0); sfx('tp', f.pos);
        const rm = k => { k.dead = true; scene.remove(k.mesh); k.mesh.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); };
        const nd = ndt(); const loop = () => { const dt = nd();
          for (const k of kids) {
            if (k.dead) continue; k.t += dt;
            let best = null, bd = 1e9; for (const g of enemiesOf(f)) { const d = chestOf(g).distanceTo(k.mesh.position); if (g.alive && d < bd) { bd = d; best = g; } }
            if (!best || k.t > 6 || k.bites >= 3) { burst(k.mesh.position, 6, col, 4, .1, .25, 0); rm(k); continue; }
            const to = chestOf(best).sub(k.mesh.position), d = to.length() || .01; to.multiplyScalar(1 / d);
            k.vel.lerp(to.multiplyScalar(12), Math.min(1, dt * 4)); k.mesh.position.addScaledVector(k.vel, dt);
            const gy = groundAt(k.mesh.position.x, k.mesh.position.z) + .3; if (d > 1.4 && k.mesh.position.y < gy) { k.mesh.position.y = gy; k.vel.y = Math.max(k.vel.y, 0); }
            k.mesh.lookAt(k.mesh.position.clone().add(k.vel));
            if (d < 1.3) { k.bt -= dt; if (k.bt <= 0) { k.bt = .3; k.bites++; applyHit(f, best, { dmg: o.dmg || 1.8, stun: .25, kb: 0, color: col, hitstop: .02, shake: .05, noCounter: true }); burst(chestOf(best), 5, col, 4, .1, .2, 0); sfx('hit', best.pos, .4); } }
          }
          if (kids.some(k => !k.dead) && G.state === 'play') later(0, loop); else kids.forEach(k => { if (!k.dead) rm(k); });
        };
        loop();
      } }],
    });
  });

/* ===== personajes/rocket/Skills/Code/Gancho de Seda/rkZip.js ===== */
/* Habilidad: Gancho de Seda  ·  personaje: rocket  ·  movimiento: rkZip
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Gancho de Seda: se engancha al rival con un hilo y se deja arrastrar de cara hasta él
CF.mover('rkZip', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = new V3();
    const setD = () => { if (tg && tg.alive) dest.set(tg.pos.x, tg.pos.y, tg.pos.z); else dest.set(f.pos.x + F.x * 12, f.pos.y, f.pos.z + F.z * 12); };
    setD(); let landed = false;
    startAction(f, {
      name: 'rkZip', bbClip: 'habilidad_2_gancho', dur: .9, noControl: true, armor: true, aim: true,
      start: () => {
        sfx('zap', f.pos);
        const tg2 = new THREE.BoxGeometry(.05, .05, 1), m = glowMat('#ffffff', .9), line = new THREE.Mesh(tg2, m);
        addFx(line, .6, (l, k) => { const a = front(f, .3, 1.2), b = new V3(dest.x, dest.y + 1.2, dest.z), len = a.distanceTo(b) || .1; l.position.copy(a).lerp(b, .5); l.scale.set(1, 1, len); l.lookAt(b); m.opacity = .9 * (1 - k * k); }, () => { tg2.dispose(); m.dispose(); });
      },
      tick: (a, t, dt) => {
        if (landed) return;
        setD(); f.yaw = Math.atan2(dest.x - f.pos.x, dest.z - f.pos.z);
        if (t < .18) { f.vel.x = f.vel.z = 0; return; }
        const to = new V3(dest.x - f.pos.x, 0, dest.z - f.pos.z), d = to.length();
        if (d > 2) { to.normalize(); f.vel.x = to.x * 34; f.vel.z = to.z * 34; if (f.onGround) f.vel.y = 3; if (Math.random() < .6) ghost(f, o.color, .35, .2); }
        else {
          landed = true; f.vel.x *= .1; f.vel.z *= .1; a.t = Math.max(a.t, .56);
          arcSlash(f, o.color, { tilt: -.4, r: 1.8, len: 2.4, w: .6 });
          hitArea(f, front(f, 1.2, 1.1), 1.7, { dmg: o.dmg || 7, stun: .7, kb: 6, up: 9, color: o.color, guardBreak: true, hitstop: .08, shake: .35 }); sfx('heavy', f.pos, .6);
        }
      },
    });
  });

/* ===== personajes/rocket/Skills/Code/Patas Lanza/rkLegStabs.js ===== */
/* Habilidad: Patas Lanza  ·  personaje: rocket  ·  movimiento: rkLegStabs
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Patas Lanza (despierta): las patas de araña clavan cinco estocadas al frente; la última lanza
CF.mover('rkLegStabs', function (f, o) {
    const col = o.color; let n = 0;
    startAction(f, {
      name: 'rkLegStabs', bbClip: 'despertar_patas', dur: 1.2, speedMul: .15, aim: true, armor: true,
      tick: (a, t) => {
        const want = t < .25 ? 0 : Math.min(5, Math.floor((t - .25) / .15) + 1);
        while (n < want) {
          n++; const last = n === 5, F = fwd(f.yaw + [-.5, .5, -.25, .25, 0][n - 1]), a0 = front(f, -.2, 1.5), b0 = new V3(f.pos.x + F.x * 6, f.pos.y + .5, f.pos.z + F.z * 6);
          slashLine(a0, b0, '#111118', .22, .35); slashLine(a0, b0, col, .18, .14); impactStar(b0, col, 1.6, .2); sfx('slash', f.pos, .7);
          for (const g of enemiesOf(f)) if (segDist(chestOf(g), a0, b0) < 1.1)
            applyHit(f, g, last ? { dmg: o.dmg2 || 8, kb: 14, up: 9, ragdoll: 1, guardBreak: true, color: col, hitstop: .1, shake: .4, dir: F } : { dmg: o.dmg || 3, stun: .45, kb: 2, dir: F, color: col, hitstop: .04, shake: .15 });
        }
      },
    });
  });

/* ===== personajes/rocket/Skills/Code/Picadura Venenosa/rkBite.js ===== */
/* Habilidad: Picadura Venenosa  ·  personaje: rocket  ·  movimiento: rkBite
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Picadura Venenosa: lanzada con la mandíbula abierta; el veneno quita vida durante varios segundos
CF.mover('rkBite', function (f, o) {
    startAction(f, {
      name: 'rkBite', bbClip: 'habilidad_3_picadura', dur: .55, speedMul: .2, aim: true,
      steps: [{ at: .18, fn: () => {
        const F = fwd(f.yaw), c = front(f, 1.5, 1.1); f.vel.x += F.x * 13; f.vel.z += F.z * 13; arcSlash(f, o.color, { tilt: .2, r: 1.5, len: 2, w: .5 }); sfx('slash', f.pos);
        const n = hitArea(f, c, 1.6, { dmg: o.dmg || 5, stun: .6, kb: 2, up: 1, color: o.color, hitstop: .07, shake: .25 });
        if (n) for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(c) < 2.1) poisonOn(g, f, o);
      } }],
    });
  });

/* ===== personajes/rocket/Skills/Code/Red Gigante/rkWebField.js ===== */
/* Habilidad: Red Gigante  ·  personaje: rocket  ·  movimiento: rkWebField
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Red Gigante (despierta): una telaraña enorme que arrastra a todos al centro y los hiere
CF.mover('rkWebField', function (f, o) {
    const tg = findTarget(f, 16), F = fwd(f.yaw), R = o.r || 7, C = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 6, 0, f.pos.z + F.z * 6), 2); C.y = groundAt(C.x, C.z);
    startAction(f, {
      name: 'rkWebField', bbClip: 'despertar_red', dur: .7, speedMul: .2, aim: true,
      steps: [{ at: .3, fn: () => {
        const wd = buildWebDisc(R, 5, 12, .55), life = 3.6; wd.grp.position.set(C.x, C.y + .08, C.z);
        addFx(wd.grp, life, (g, k) => { const sc = Math.min(1, k * 14); g.scale.set(sc, 1, sc); wd.mat.opacity = (k > .85 ? (1 - k) / .15 : 1) * (.45 + .15 * Math.sin(k * 60)); }, wd.dispose);
        sfx('zap', C); ringAt(C, '#ffffff', R, .5);
        let t = 0, acc = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; acc += dt;
          for (const g of enemiesOf(f)) {
            const dx = C.x - g.pos.x, dz = C.z - g.pos.z, d = Math.hypot(dx, dz);
            if (d < R && g.pos.y - C.y < 2.5 && g.alive) {
              if (!g.remote) { g.vel.x += dx / (d || 1) * 2.1 * (dt / .05); g.vel.z += dz / (d || 1) * 2.1 * (dt / .05); }
              if (acc >= .6) applyHit(f, g, { dmg: o.dmg || 1.1, stun: 0, kb: 0, color: '#ffffff', hitstop: 0, shake: .05, noCounter: true });
            }
          }
          if (acc >= .6) acc = 0;
          if (t < life && G.state === 'play') later(0, tick);
        };
        later(0, tick);
      } }],
    });
  });

/* ===== personajes/rocket/Skills/Code/Telaraña/rkWeb.js ===== */
/* Habilidad: Telaraña  ·  personaje: rocket  ·  movimiento: rkWeb
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Telaraña: un hilo que sigue al rival y lo envuelve en seda, inmóvil
CF.mover('rkWeb', function (f, o) {
    startAction(f, {
      name: 'rkWeb', bbClip: 'habilidad_1_tela', dur: .45, speedMul: .3, aim: true,
      steps: [{ at: .15, fn: () => {
        const from = front(f, .8, 1.3);
        spawnProj(f, f.yaw, { color: '#f0f0f8', speed: 40, size: .34, long: 1.6, homing: 1.6, range: 22, from,
          onHit: g => { if (applyHit(f, g, { dmg: o.dmg || 3, stun: o.root || 1.7, kb: 0, color: o.color, hitstop: .05, noCounter: true }) === true) { g.vel.x = g.vel.z = 0; webWrap(g, o.root || 1.7); popText(chestOf(g), '¡ATRAPADO!', '#f0f0f8', 18); } } });
        slashLine(from, front(f, 6, 1.3), '#ffffff', .25, .06); sfx('zap', f.pos, .7);
      } }],
    });
  });

/* ===== personajes/rocket/Skills/Code/Trampas de Seda/rkTraps.js ===== */
/* Habilidad: Trampas de Seda  ·  personaje: rocket  ·  movimiento: rkTraps
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Trampas de Seda: tres telarañas en el piso; quien las pise queda atrapado
CF.mover('rkTraps', function (f, o) {
    const tg = findTarget(f, 18), F = fwd(f.yaw), C = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8);
    startAction(f, {
      name: 'rkTraps', bbClip: 'habilidad_4_trampas', dur: .6, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        const traps = [];
        for (let n = 0; n < 3; n++) {
          const an = n * TAU / 3 + rand(0, .5), rr = tg ? 3.2 : 2.5, pos = clampArena(new V3(C.x + Math.cos(an) * rr, 0, C.z + Math.sin(an) * rr), 1.5); pos.y = groundAt(pos.x, pos.z);
          const wd = buildWebDisc(1.4, 3, 8, .55), tr = { pos, dead: false }; wd.grp.position.set(pos.x, pos.y + .08, pos.z);
          addFx(wd.grp, 9.5, (g, k) => { if (tr.dead) g.visible = false; else wd.mat.opacity = .4 + .2 * Math.sin(k * 90); }, wd.dispose);
          ringAt(pos, '#ffffff', 2, .3); traps.push(tr);
        }
        sfx('zap', C);
        let t = 0;
        const nd = ndt(); const chk = () => { const dt = nd();
          t += dt;
          for (const tr of traps) {
            if (tr.dead) continue;
            for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - tr.pos.x, g.pos.z - tr.pos.z) < 1.5 && g.pos.y - tr.pos.y < 1.4) {
              tr.dead = true; applyHit(f, g, { dmg: o.dmg || 4, stun: o.root || 1.9, kb: 0, color: o.color, hitstop: .05, noCounter: true }); webWrap(g, o.root || 1.9);
              burst(chestOf(g), 14, '#ffffff', 5, .14, .4, 0); sfx('zap', g.pos); popText(chestOf(g), '¡ATRAPADO!', '#f0f0f8', 18); break;
            }
          }
          if (t < 9 && G.state === 'play') later(0, chk); else traps.forEach(tr => { tr.dead = true; });
        };
        later(0, chk);
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Anillo Ígneo/ukRing.js ===== */
/* Habilidad: Anillo Ígneo  ·  personaje: ukyo  ·  movimiento: ukRing
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Anillo Ígneo (despierta): dos olas de fuego seguidas
CF.mover('ukRing', function (f, o) {
    const col = '#ff7a1a';
    const pulse = (R, dmg, up, rag) => {
      const hit = new Set(), c = new V3(f.pos.x, f.pos.y, f.pos.z);
      ringAt(new V3(c.x, c.y + .1, c.z), col, R, .45); ringAt(new V3(c.x, c.y + .1, c.z), '#ffffff', R * .8, .3); sfx('boom', c, .7); shakeFrom(c, .4);
      for (let k = 0; k < 24; k++) { const an = k / 24 * TAU; burst(new V3(c.x + Math.cos(an) * R * .85, c.y + .3, c.z + Math.sin(an) * R * .85), 3, k % 2 ? '#ff7a1a' : '#ffd54f', 4, .2, .5, 2); }
      for (const g of enemiesOf(f)) if (!hit.has(g) && g.alive && Math.hypot(g.pos.x - c.x, g.pos.z - c.z) < R + .5 && g.pos.y - c.y < 3) {
        hit.add(g); applyHit(f, g, { dmg, kb: 10, up, ragdoll: rag, dir: new V3(g.pos.x - c.x, 0, g.pos.z - c.z), color: col, guardBreak: true, hitstop: .08, shake: .3 }); poisonOn(g, f, { dps: 2.4, dur: 3.2, col, label: 'ARDE' });
      }
    };
    startAction(f, {
      name: 'ukRing', bbClip: 'despertar_anillo', dur: .9, speedMul: 0, aim: true, armor: true,
      steps: [{ at: .3, fn: () => pulse(6.5, o.dmg || 6, 6, 0) }, { at: .65, fn: () => pulse(9, (o.dmg || 6) * 1.3, 12, .8) }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Barrido/ukSweep.js ===== */
/* Habilidad: Barrido  ·  personaje: ukyo  ·  movimiento: ukSweep
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Barrido: una onda baja que viaja por el piso y hace caer a todos los que toca
CF.mover('ukSweep', function (f, o) {
    startAction(f, {
      name: 'ukSweep', bbClip: 'habilidad_1_barrido', dur: .6, speedMul: .25, aim: true,
      steps: [{ at: .2, fn: () => {
        const F = fwd(f.yaw), Rr = rightOf(f.yaw), col = o.color, L = o.range || 11, T = .55, hit = new Set(), org = new V3(f.pos.x, f.pos.y, f.pos.z);
        const g1 = new THREE.RingGeometry(.85, 1.35, 24, 1, -1.25, 2.5), g2 = new THREE.RingGeometry(1.15, 1.35, 24, 1, -1.25, 2.5), m1 = glowMat(col, .7), m2 = glowMat('#ffffff', .9);
        const grp = new THREE.Group(), arc = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; arc.add(a, b); grp.add(arc); grp.rotation.y = f.yaw - Math.PI / 2; scene.add(grp);
        arcSlash(f, col, { tilt: .05, r: 2.2, w: .7, len: 3.4, dur: .3, y: .5 }); sfx('swing', f.pos);
        let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const u = Math.min(1, t / T), sc = 1.2 + 1.4 * u;
          const x = org.x + F.x * (1.2 + L * u), z = org.z + F.z * (1.2 + L * u); grp.position.set(x, groundAt(x, z) + .3, z); arc.scale.set(sc, sc, sc);
          emit(x + rand(-1, 1), grp.position.y, z + rand(-1, 1), rand(-1, 1), rand(.5, 2), rand(-1, 1), '#d8d0c0', .18, .3, 0, 0);
          for (const g of enemiesOf(f)) {
            if (hit.has(g)) continue;
            if (Math.hypot(g.pos.x - x, g.pos.z - z) < 1.6 + sc && g.pos.y - org.y < 1.8) {
              hit.add(g); const side = Math.sign((g.pos.x - x) * Rr.x + (g.pos.z - z) * Rr.z) || 1;
              applyHit(f, g, { dmg: o.dmg || 6, kb: 6, up: 4, ragdoll: .7, dir: new V3(F.x * .5 + Rr.x * side, 0, F.z * .5 + Rr.z * side), color: col, hitstop: .06, shake: .3 });
            }
          }
          if (u < 1 && G.state === 'play') later(0, tick); else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Bola de fuego/ukFireball.js ===== */
/* Habilidad: Bola de fuego  ·  personaje: ukyo  ·  movimiento: ukFireball
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Bola de fuego: explota al chocar y deja un charco ardiendo
CF.mover('ukFireball', function (f, o) {
    startAction(f, {
      name: 'ukFireball', bbClip: 'habilidad_4_bola', dur: .6, speedMul: .25, aim: true,
      steps: [{ at: .25, fn: () => {
        const F = fwd(f.yaw), col = o.color, ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 1), glowMat('#ff8a1a', .9));
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 0), new THREE.MeshBasicMaterial({ color: '#fff3c4' })); ball.add(core); ball.position.copy(front(f, 1, 1.3)); scene.add(ball);
        const vel = F.clone().multiplyScalar(24); let life = 0; sfx('fire', f.pos);
        const finish = pos => {
          explode(f, pos, 3.2, { dmg: o.dmg || 9, kb: 8, up: 8, ragdoll: .7, color: col, hitstop: .08, shake: .4 });
          const gp = new V3(pos.x, groundAt(pos.x, pos.z), pos.z); fireColumn(gp, 2, '#ff7a1a', 5); firePatch(f, gp, 3, 3.5, col);
          scene.remove(ball); ball.geometry.dispose(); ball.material.dispose(); core.geometry.dispose(); core.material.dispose();
        };
        const nd = ndt(); const tick = () => { const dt = nd();
          life += dt; ball.position.addScaledVector(vel, dt); ball.scale.setScalar(1 + .15 * Math.sin(life * 40)); ball.rotation.x += .3;
          emit(ball.position.x, ball.position.y, ball.position.z, rand(-1, 1), rand(0, 2), rand(-1, 1), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', .3, .35, 0, 1);
          let hit = life > 1.2 || groundAt(ball.position.x, ball.position.z) > ball.position.y - .2 || ball.position.y < .2 || Math.hypot(ball.position.x, ball.position.z) > ARENA + 1;
          if (!hit) for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(ball.position) < 1.2) { hit = true; break; }
          if (hit) finish(ball.position.clone()); else if (G.state === 'play') later(0, tick); else { scene.remove(ball); }
        };
        tick();
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Corte Solar/ukSun.js ===== */
/* Habilidad: Corte Solar  ·  personaje: ukyo  ·  movimiento: ukSun
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Corte Solar (despierta): un arco de fuego enorme que atraviesa a todos
CF.mover('ukSun', function (f, o) {
    startAction(f, {
      name: 'ukSun', bbClip: 'despertar_corte', dur: .7, speedMul: .15, aim: true, armor: true,
      steps: [{ at: .3, fn: () => {
        const F = fwd(f.yaw), hit = new Set(), g1 = new THREE.RingGeometry(1.3, 1.9, 28, 1, -1.2, 2.4), g2 = new THREE.RingGeometry(1.65, 1.9, 28, 1, -1.2, 2.4), m1 = glowMat('#ff6a1a', .8), m2 = glowMat('#fff3c4', .95);
        const grp = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.z = b.rotation.z = Math.PI / 2; grp.add(a, b); grp.rotation.y = f.yaw; grp.position.copy(front(f, 1.2, 1.6)); scene.add(grp);
        sfx('fire', f.pos); arcSlash(f, '#ff7a1a', { tilt: 1.4, r: 2.2, w: .8, len: 2.6, dur: .3 }); let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const sc = 1 + t * 1.2; grp.position.addScaledVector(F, 30 * dt); grp.scale.set(sc, sc, sc);
          for (let k = 0; k < 3; k++) { const an = rand(-1.2, 1.2) + Math.PI / 2, q = grp.localToWorld(new V3(Math.cos(an) * 1.7, Math.sin(an) * 1.7, 0)); emit(q.x, q.y, q.z, rand(-1, 1), rand(0, 2), rand(-1, 1), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', .3, .4, 0, 1); }
          for (const g of enemiesOf(f)) if (!hit.has(g) && g.alive && chestOf(g).distanceTo(grp.position) < 2.4 * sc) {
            hit.add(g); applyHit(f, g, { dmg: o.dmg || 8, kb: 8, up: 10, ragdoll: .8, dir: F, color: '#ff7a1a', hitstop: .08, shake: .4, guardBreak: true }); impactStar(chestOf(g), '#ff7a1a', 2.2, .25);
          }
          if (t < .75 && G.state === 'play') later(0, tick); else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Cuchillas arrojadizas/ukKnives.js ===== */
/* Habilidad: Cuchillas arrojadizas  ·  personaje: ukyo  ·  movimiento: ukKnives
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Cuchillas arrojadizas: tres cuchillas; las que aciertan se quedan clavadas y vuelven a su mano atravesando otra vez
CF.mover('ukKnives', function (f, o) {
    startAction(f, {
      name: 'ukKnives', bbClip: 'habilidad_3_cuchillas', dur: .5, speedMul: .3, aim: true,
      steps: [{ at: .18, fn: () => {
        const col = o.color, n = o.count || 3, ks = [], T0 = 1.25; let T = 0;
        for (let i = 0; i < n; i++) {
          const F = fwd(f.yaw + (i - (n - 1) / 2) * .2), mesh = new THREE.Mesh(new THREE.BoxGeometry(.09, .05, .6), new THREE.MeshBasicMaterial({ color: '#e8f0ff' }));
          mesh.position.copy(front(f, .8, 1.3)); scene.add(mesh); ks.push({ mesh, dir: F, st: 'fly', t: 0, tg: null, off: null, back: false });
        }
        sfx('slash', f.pos);
        const rm = k => { k.st = 'dead'; scene.remove(k.mesh); k.mesh.geometry.dispose(); k.mesh.material.dispose(); };
        const nd = ndt(); const loop = () => { const dt = nd();
          T += dt;
          for (const k of ks) {
            if (k.st === 'dead') continue; const pos = k.mesh.position;
            if (k.st === 'fly') {
              k.t += dt; pos.addScaledVector(k.dir, 38 * dt); k.mesh.lookAt(pos.clone().add(k.dir));
              for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(pos) < 1.0) {
                k.st = 'stuck'; k.tg = g; k.off = pos.clone().sub(chestOf(g)); impactStar(pos, col, .9, .15);
                applyHit(f, g, { dmg: o.dmg || 3, stun: .3, kb: 1.5, dir: k.dir, color: col, hitstop: .04 }); break;
              }
              if (k.st === 'fly' && (k.t > .55 || groundAt(pos.x, pos.z) > pos.y)) { burst(pos, 5, col, 3, .1, .2, 0); rm(k); }
            } else if (k.st === 'stuck') {
              if (k.tg && k.tg.alive) pos.copy(chestOf(k.tg)).add(k.off);
              if (T >= T0) k.st = 'back';
            } else if (k.st === 'back') {
              const to = new V3(f.pos.x, f.pos.y + 1.2, f.pos.z).sub(pos), d = to.length();
              if (!k.back && k.tg && k.tg.alive) { k.back = true; slashLine(pos.clone(), chestOf(f), col, .25, .08); applyHit(f, k.tg, { dmg: (o.dmg || 3) * 1.4, stun: .4, kb: 4, up: 1, dir: new V3(f.pos.x - k.tg.pos.x, 0, f.pos.z - k.tg.pos.z), color: col, hitstop: .05 }); }
              if (d < 1) rm(k); else { to.multiplyScalar(1 / d); pos.addScaledVector(to, 42 * dt); k.mesh.lookAt(pos.clone().add(to)); }
            }
          }
          if (ks.some(k => k.st !== 'dead') && G.state === 'play' && T < 5) later(0, loop); else ks.forEach(k => { if (k.st !== 'dead') rm(k); });
        };
        loop();
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Espada de Fénix/ukPhoenix.js ===== */
/* Habilidad: Espada de Fénix  ·  personaje: ukyo  ·  movimiento: ukPhoenix
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Espada de Fénix (despierta): se enciende la espada: más velocidad y cada golpe quema
CF.mover('ukPhoenix', function (f, o) {
    startAction(f, {
      name: 'ukPhoenix', bbClip: 'despertar_fenix', dur: .7, speedMul: .1, aim: true, armor: true,
      steps: [{ at: .3, fn: () => {
        f.fireT = o.dur || 10; burst(chestOf(f), 40, '#ff7a1a', 9, .25, .7, -.2); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff7a1a', 5, .6); lightColumn(f.pos, '#ff7a1a', 12); sfx('ult', f.pos, .7);
        if (f.isPlayer) showBanner('ESPADA DE FÉNIX', '#ff7a1a', `${Math.round(f.fireT)} s de fuego`);
      } }],
    });
  });

/* ===== personajes/ukyo/Skills/Code/Estocada/ukLunge.js ===== */
/* Habilidad: Estocada  ·  personaje: ukyo  ·  movimiento: ukLunge
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Estocada: sale disparado con la punta al frente, atraviesa al primer rival, lo arrastra clavado y lo lanza al final
CF.mover('ukLunge', function (f, o) {
    const D = o.dist || 8; let carried = null, dist = 0, released = false;
    startAction(f, {
      name: 'ukLunge', bbClip: 'habilidad_2_estocada', dur: .75, noControl: true, armor: true, aim: true, ghost: true,
      tick: (a, t, dt) => {
        const F = fwd(f.yaw);
        if (t < .15) { f.vel.x = f.vel.z = 0; return; }
        if (dist < D) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30; dist += 30 * dt;
          if (!carried) {
            for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(front(f, 1.2, 1.1)) < 1.7) {
              carried = g; impactStar(chestOf(g), o.color, 2, .22); sfx('heavy', g.pos, .7);
              applyHit(f, g, { dmg: o.dmg || 7, stun: 1.4, kb: 0, color: o.color, guardBreak: true, hitstop: .08, shake: .4, noCounter: true }); break;
            }
          } else if (carried.alive && !carried.remote) { carried.pos.x = f.pos.x + F.x * 1.4; carried.pos.z = f.pos.z + F.z * 1.4; carried.vel.set(0, 0, 0); }
        } else if (!released) {
          released = true; f.vel.x *= .2; f.vel.z *= .2; a.t = Math.max(a.t, .5);
          if (carried && carried.alive) { applyHit(f, carried, { dmg: o.dmg2 || 5, kb: 14, up: 7, ragdoll: 1, dir: F, color: o.color, hitstop: .1, shake: .35 }); arcSlash(f, o.color, { tilt: 0, r: 1.8, len: 2.2, w: .5 }); }
        }
      },
    });
  });

/* ===== personajes/mattux/Skills/Code/Aceleración Sónica/sonBoost.js ===== */
/* Habilidad: Aceleración Sónica  ·  personaje: mattux  ·  movimiento: sonBoost
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBoost', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'sonboost', dur: 1.05, aim: true, noControl: true, lockYaw: true, ghost: true, speedMul: 0, anim: [[0, 'charge', 400], [.15, 'dash', 1100]],
      start: () => { sfx('dash', f.pos, 1); popText(chestOf(f), '¡ACELERACIÓN SÓNICA!', '#ffd23f', 22); G.fovKick = Math.max(G.fovKick, 9); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t > .15 && t < .75) {
          f.vel.x = F.x * 46; f.vel.z = F.z * 46; emit(f.pos.x, f.pos.y + rand(.2, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), Math.random() < .5 ? '#ffd23f' : '#ffffff', .28, .4, 0, 3);
          if (hitArea(f, front(f, .8, 1), 1.5, { dmg: o.dmg || 10, kb: 11, up: 5, ragdoll: .8, color: '#ffd23f', set, hitstop: .06, shake: .4, guardBreak: true })) worldDamage(front(f, 1.4, 1), 3, 1, o.dmg || 10, 1.1);
        } else if (t >= .75 && !a.fin) {
          a.fin = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1; const c = new V3(f.pos.x, f.pos.y + .6, f.pos.z);
          ringAt(new V3(c.x, c.y - .4, c.z), '#ffd23f', 6, .5); impactStar(c, '#ffffff', 2.6, .3); sfx('break', f.pos, .8);
          hitArea(f, c, 4.2, { dmg: 6, kb: 9, up: 6, ragdoll: .9, color: '#ffd23f', set: new Set(), shake: .5 }); a.anim = [[t, 'mega', 900]];
        }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });

/* ===== personajes/mattux/Skills/Code/Ataque Teledirigido/sonHoming.js ===== */
/* Habilidad: Ataque Teledirigido  ·  personaje: mattux  ·  movimiento: sonHoming
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonHoming', function (f, o) {
    const hit = new Set(); let tg = null, bounced = 0, st = 'jump', tt = 0;
    const next = (rng) => { let b = null, bd = rng; for (const g of enemiesOf(f)) { if (!g.alive || hit.has(g)) continue; const d = dist2d(f, g); if (d < bd) { bd = d; b = g; } } return b; };
    startAction(f, {
      name: 'sonhome', dur: 2.3, aim: true, noControl: true, speedMul: 0, anim: [[0, 'ball', 400]], spinX: 30,
      start: () => { tg = findTarget(f, 18) || next(18); sfx('jump', f.pos, 1.2); popText(chestOf(f), '¡ATAQUE TELEDIRIGIDO!', o.color, 20); f.vel.y = 9; f.onGround = false; },
      tick: (a, t, dt) => {
        tt += dt; a.spinX = 34; if (st === 'jump' && tt > .18) st = 'fly';
        if (st === 'fly') {
          if (!tg || !tg.alive) { tg = next(10); if (!tg) { if (bounced > 0 || tt > .9) { st = 'end'; } else { const F = fwd(f.yaw); f.vel.x = F.x * 16; f.vel.z = F.z * 16; if (tt > .7) st = 'end'; } return; } }
          const c = chestOf(tg), to = c.clone().sub(new V3(f.pos.x, f.pos.y + .9, f.pos.z)), d = to.length();
          if (d > .01) { to.normalize(); f.vel.x = to.x * 36; f.vel.z = to.z * 36; f.vel.y = to.y * 36; f.yaw = Math.atan2(to.x, to.z); }
          a.ghost = true; emit(f.pos.x, f.pos.y + .9, f.pos.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), o.color, .2, .3, 0, 3);
          if (d < 1.5) {
            hit.add(tg); const last = bounced >= 2; applyHit(f, tg, { dmg: (o.dmg || 6.5) + (last ? 3 : 0), kb: last ? 13 : 3, up: last ? 7 : 4, ragdoll: last ? 1 : .35, color: o.color, hitstop: .06, shake: .3, guardBreak: true });
            impactStar(c, '#ffffff', 2.2, .22); ringAt(c, o.color, 3, .3); sfx('heavy', f.pos, .7); worldDamage(c, 2.2, .8, o.dmg || 7, .5);
            f.vel.y = 12; f.vel.x = -(to.x) * 7; f.vel.z = -(to.z) * 7; bounced++; tt = 0; st = bounced >= 3 ? 'end' : 'bounce'; tg = null;
          }
        } else if (st === 'bounce') { if (tt > .22) { tg = next(10); st = tg ? 'fly' : 'end'; } }
        else if (st === 'end' && !a.fin) { a.fin = true; a.ghost = false; a.spinX = 0; a.anim = [[t, 'jump', 600]]; a.t = Math.max(a.t, a.dur - .35); }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });

/* ===== personajes/mattux/Skills/Code/Ciclón Sónico/sonCyclone.js ===== */
/* Habilidad: Ciclón Sónico  ·  personaje: mattux  ·  movimiento: sonCyclone
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonCyclone', function (f, o) {
    // Ciclón Sónico: corre en círculos a velocidad de luz, arrastra a los rivales hacia dentro y los lanza por los aires.
    const C = new V3(f.pos.x, f.pos.y, f.pos.z), R = 3.6, T0 = .3, T1 = 1.7; let hitT = 0, ang0 = Math.atan2(-fwd(f.yaw).z, -fwd(f.yaw).x), tickN = 0;
    startAction(f, {
      name: 'soncyclone', dur: 2.15, aim: false, noControl: true, armor: true, ghost: true, speedMul: 0, anim: [[0, 'charge', 300], [T0, 'dash', 1400]],
      start: () => { f.iframes = Math.max(f.iframes, .35); sfx('dash', f.pos, 1); popText(chestOf(f), '¡CICLÓN SÓNICO!', o.color, 24); ringAt(new V3(C.x, C.y + .2, C.z), o.color, R * 2.2, .45); },
      tick: (a, t, dt) => {
        if (t >= T0 && t < T1) {
          const k = (t - T0) / (T1 - T0), ang = ang0 + (t - T0) * 15, rr = R * Math.min(1, (t - T0) / .25);
          if (!f.remote) { f.pos.x = C.x + Math.cos(ang) * rr; f.pos.z = C.z + Math.sin(ang) * rr; f.vel.set(0, 0, 0); }
          f.yaw = ang + Math.PI / 2;
          for (let j = 0; j < 3; j++) { const aa = ang + rand(-1, 1) * .4, h = rand(.2, 3.4) * (.5 + k * .5); emit(C.x + Math.cos(aa) * R * rand(.7, 1.05), C.y + h, C.z + Math.sin(aa) * R * rand(.7, 1.05), -Math.sin(aa) * 7, rand(1, 4), Math.cos(aa) * 7, Math.random() < .5 ? o.color : '#ffffff', .24, .4, 0, 3); }
          // el viento arrastra a los rivales hacia el centro (menos si se alejan mucho)
          for (const g of enemiesOf(f)) { if (!g.alive || g.remote) continue; const dx = C.x - g.pos.x, dz = C.z - g.pos.z, d = Math.hypot(dx, dz); if (d < 9 && d > .8) { g.pos.x += dx / d * 5.5 * dt; g.pos.z += dz / d * 5.5 * dt; } }
          hitT -= dt; if (hitT <= 0) { hitT = .24; tickN++; sfx('swing', f.pos, .45);
            hitArea(f, new V3(C.x, C.y + 1, C.z), R + 1.6, { dmg: o.dmg || 2.4, kb: 1, up: 4, stun: .35, color: o.color, set: new Set(), hitstop: .02, shake: .12, noCounter: false });
            if (tickN % 2) ringAt(new V3(C.x, C.y + .1 + (tickN % 4) * .5, C.z), o.color, R * 2, .35);
          }
        } else if (t >= T1 && !a.fin) {
          a.fin = true; a.ghost = false; f.vel.set(0, 0, 0); a.anim = [[t, 'mega', 900]];
          const c = new V3(C.x, C.y + 1, C.z); ringAt(new V3(C.x, C.y + .1, C.z), '#ffffff', R * 3.4, .5); ringAt(new V3(C.x, C.y + .1, C.z), o.color, R * 2.6, .6); impactStar(c, '#ffffff', 3, .3); sfx('break', f.pos, .9); G.hitstop = Math.max(G.hitstop, .08);
          hitArea(f, c, R + 2.2, { dmg: 6, kb: 13, up: 10, ragdoll: 1.1, color: o.color, set: new Set(), hitstop: .1, shake: .6, guardBreak: true });
        }
      },
      onEnd: () => { f.vel.x = f.vel.z = 0; },
    });
  });

/* ===== personajes/mattux/Skills/Code/Explosión del Caos/sonBlast.js ===== */
/* Habilidad: Explosión del Caos  ·  personaje: mattux  ·  movimiento: sonBlast
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBlast', function (f, o) {
    startAction(f, {
      name: 'sonblast', dur: 1.7, aim: false, noControl: true, armor: true, speedMul: 0, anim: [[0, 'castUp', 500], [.4, 'lift', 900]],
      start: () => { sfx('ult', f.pos); popText(chestOf(f), '¡EXPLOSIÓN DEL CAOS!', '#ffd23f', 26); f.iframes = Math.max(f.iframes, 1.4); },
      tick: (a, t) => {
        if (t < 1.0) {
          f.vel.y = Math.max(f.vel.y, 0) + 0; if (t > .3) f.vel.y = 3;
          for (let k = 0; k < 2; k++) { const an = rand(0, TAU), r = rand(2.5, 6) * (1 - t / 1.1); emit(f.pos.x + Math.cos(an) * r, f.pos.y + rand(0, 3), f.pos.z + Math.sin(an) * r, -Math.cos(an) * 6, rand(1, 3), -Math.sin(an) * 6, Math.random() < .5 ? '#ffd23f' : '#ffffff', .22, .5, 0, 2); }
          G.shake = Math.max(G.shake, .15);
        }
      },
      steps: [{ at: 1.05, fn: () => {
        const c = new V3(f.pos.x, f.pos.y + 1, f.pos.z); sphereFlash(c, '#ffd23f', 5, .5); ringAt(new V3(c.x, c.y - .8, c.z), '#ffd23f', 11, .7); ringAt(new V3(c.x, c.y - .8, c.z), '#ffffff', 7, .5);
        burst(c, 50, '#ffd23f', 14, .25, .7, 0); burst(c, 30, '#ffffff', 10, .2, .5, 0); impactStar(c, '#ffffff', 5, .4); sfx('break', f.pos); G.hitstop = Math.max(G.hitstop, .14);
        explode(f, c, 9.5, { dmg: o.dmg || 18, kb: 20, up: 10, ragdoll: 1.6, color: '#ffd23f', guardBreak: true, shake: 1 }); worldDamage(c, 10, 2.4, 40, 2.2);
      } }],
    });
  });

/* ===== personajes/mattux/Skills/Code/Onda Sónica/sonBoom.js ===== */
/* Habilidad: Onda Sónica  ·  personaje: mattux  ·  movimiento: sonBoom
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBoom', function (f, o) {
    startAction(f, {
      name: 'sonboom', dur: .6, aim: true, speedMul: .3, anim: [[0, 'windup', 500], [.18, 'mega', 1300]],
      steps: [{ at: .2, fn: () => {
        for (const off of [-.24, 0, .24]) spawnProj(f, f.yaw + off, { color: o.color, speed: 34, size: .6, long: 2.8, range: 26, dmg: o.dmg || 6, kb: 8, up: 3, stun: .45 });
        sfx('zap', f.pos, .8); ringAt(front(f, 1.2, 1.2), o.color, 2.4, .3); burst(front(f, 1.4, 1.2), 14, '#ffffff', 8, .14, .3, 0);
      } }],
    });
  });

/* ===== personajes/mattux/Skills/Code/Spin Dash/sonSpin.js ===== */
/* Habilidad: Spin Dash  ·  personaje: mattux  ·  movimiento: sonSpin
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonSpin', function (f, o) {
    const sup = !!o.sup, T = sup ? .38 : .5, D = sup ? .8 : .58; let hitT = 0, set = new Set();
    startAction(f, {
      name: 'sonspin', dur: T + D + .25, aim: true, noControl: true, lockYaw: true, speedMul: 0, anim: [[0, 'ball', 500]], spinX: 14,
      start: () => { sfx('dash', f.pos, .6); popText(chestOf(f), sup ? '¡SÚPER SPIN DASH!' : '¡SPIN DASH!', o.color, 22); },
      tick: (a, t, dt) => {
        const F = fwd(f.yaw);
        if (t < T) {   // carga: gira cada vez más rápido y levanta polvo
          a.spinX = 12 + t / T * 40; f.vel.x *= .8; f.vel.z *= .8;
          if (Math.random() < .7) emit(f.pos.x - F.x * .4 + rand(-.3, .3), f.pos.y + .15, f.pos.z - F.z * .4 + rand(-.3, .3), -F.x * rand(2, 5), rand(.5, 2), -F.z * rand(2, 5), '#e8d9b0', .16, .35, .2, 2);
        } else if (t < T + D) {
          if (!a.go) { a.go = true; a.ghost = true; sfx('swing', f.pos, .8); G.fovKick = Math.max(G.fovKick, 6); ringAt(new V3(f.pos.x, f.pos.y + .8, f.pos.z), o.color, 3, .3); }
          a.spinX = 46; f.vel.x = F.x * (sup ? 38 : 27); f.vel.z = F.z * (sup ? 38 : 27);
          emit(f.pos.x, f.pos.y + rand(.3, 1.3), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), Math.random() < .5 ? o.color : '#ffffff', .22, .35, 0, 3);
          hitT -= dt; if (hitT <= 0) { hitT = sup ? .17 : .26; set = new Set(); }
          if (hitArea(f, front(f, .5, .9), 1.4, { dmg: o.dmg || 7, kb: 7, up: 5, ragdoll: .55, color: o.color, set, hitstop: .03, shake: .25 })) { impactStar(front(f, .6, .9), '#ffffff', 1.6, .15); worldDamage(front(f, 1.2, .8), 2.6, .8, o.dmg || 7, .8); }
        } else if (a.go && !a.end) { a.end = true; a.ghost = false; a.spinX = 0; f.vel.x *= .2; f.vel.z *= .2; a.anim = [[t, 'idle', 500]]; }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });

/* ===== personajes/sebolla/Skills/Code/Paliza de Verity/sebBrawlA.js ===== */
/* Habilidad: Paliza de Verity  ·  personaje: sebolla  ·  movimiento: sebBrawlA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebBrawlA', function (f, o) {
    startAction(f, {
      name: 'sebBrawlA', dur: 1.5, noControl: true, aim: true, armor: true, speedMul: 0, ghost: true, anim: [[0, 'run', 600]],
      start: () => { popText(chestOf(f), '¡Verity, mira esto!', '#ffd91a', 20); sfx('dash', f.pos); },
      tick: (a, t) => {
        // Only the opening rush and the short approach to a living target move the fighter.
        f.vel.x = f.vel.z = 0;
        if (t < .32 && !a.stopped && enemiesOf(f).some(g => dist2d(f, g) < 1.7)) a.stopped = true;
        a.ghost = t < .32 && !a.stopped;
        if (a.ghost) {
          const F = fwd(f.yaw); f.vel.x = F.x * 18; f.vel.z = F.z * 18;
          emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ffd91a', .2, .3, 0, 3);
        } else if (t >= .32 && t < 1.3) {
          let n = null, bd = 3.8;
          for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (d < bd) { bd = d; n = g; } }
          if (n) {
            const dx = n.pos.x - f.pos.x, dz = n.pos.z - f.pos.z; f.yaw = Math.atan2(dx, dz);
            if (bd > 1.3) { f.vel.x = dx / bd * 9; f.vel.z = dz / bd * 9; }
          }
        }
      },
      onEnd: () => { f.vel.x = f.vel.z = 0; if (f.verity) f.verity.ov = null; },
      steps: [
        ...[.4, .52, .64, .76, .88].map(at => ({ at, fn: () => { hitArea(f, front(f, 1.3, 1.1), 1.5, { dmg: 1.7, stun: .45, kb: .5, color: '#ffd91a', hitstop: .03, shake: .12 }); fistFx(f, '#ffd91a'); sfx('hit', f.pos, .6); } })),
        { at: 1.0, fn: () => { verityGo(f, () => front(f, 1.7, 1.7), .35, 1.4, 'angry'); const c = front(f, 1.5, 1.1); if (hitArea(f, c, 1.7, { dmg: 3, stun: .5, kb: 1, color: '#ffd91a', hitstop: .06, shake: .25 })) { popText(c, '¡CABEZAZO!', '#ffd91a', 20); impactStar(c, '#ffd91a', 2, .2); } } },
        { at: 1.2, fn: () => { verityGo(f, null, 0); if (f.verity) f.verity.ov = null; const c = front(f, 1.3, 1.1); if (hitArea(f, c, 1.7, { dmg: 6, kb: 2, up: 14, ragdoll: 1.2, rag: 1.5, color: '#ffd91a', guardBreak: true, hitstop: .1, shake: .45 })) { ringAt(c, '#ffd91a', 2.6, .35); burst(c, 18, '#ffd91a', 9, .2, .5, .3); } sfx('heavy', f.pos); } },
      ],
    });
  });

/* ===== personajes/sebolla/Skills/Code/Parry/sebParry.js ===== */
/* Habilidad: Parry  ·  personaje: sebolla  ·  movimiento: sebParry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Parry: ventana corta, el contraataque lo hace applyHit con sebCounter
CF.mover('sebParry', function (f, o) {
    startAction(f, {
      name: 'sebParry', dur: .75, noControl: true, speedMul: 0, sebParry: true, aim: true, anim: [[0, 'block', 400]],
      start: () => { popText(chestOf(f), '¡Parry!', '#ffd91a', 18); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd91a', 2, .3); verityGo(f, () => front(f, .9, 1.6), .55, 1, 'angry'); },
      tick: (a, t) => { a.sebParry = t < .5; },
    });
  });

/* ===== personajes/sebolla/Skills/Code/Pelota de Verity/sebBallA.js ===== */
/* Habilidad: Pelota de Verity  ·  personaje: sebolla  ·  movimiento: sebBallA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebBallA', function (f, o) {
    let tg = null;
    startAction(f, {
      name: 'sebBallA', dur: 1.6, noControl: true, aim: true, armor: true, speedMul: 0,
      start: () => popText(chestOf(f), '¡Pelota!', '#ffd91a', 22),
      steps: [
        { at: .25, fn: () => { const c = front(f, 1.3, 1.0); tg = enemiesOf(f).filter(g => chestOf(g).distanceTo(c) < 2.4)[0] || null; if (hitArea(f, c, 1.8, { dmg: 4, up: 13, kb: 0, stun: 1.5, color: '#ffd91a', hitstop: .07, shake: .3 })) { impactStar(c, '#ffffff', 2.4, .25); sfx('heavy', c); } } },
        { at: .95, fn: () => { if (!tg || !tg.alive) return; verityGo(f, () => new V3(tg.pos.x, tg.pos.y + 4.5, tg.pos.z), .5, 1.7, 'angry'); popText(chestOf(f), '¡Remata, Verity!', '#ffd91a', 20); } },
        { at: 1.2, fn: () => {
          if (!tg || !tg.alive) return; verityGo(f, () => new V3(tg.pos.x, tg.pos.y + 1.8, tg.pos.z), .3, 2, 'angry');
          if (applyHit(f, tg, { dmg: 5, stun: 1, kb: 0, color: '#ffd91a', hitstop: .09, shake: .4 }) && !tg.remote) tg.vel.y = -36;
          const T = tg; later(.2, () => { if (!T.alive) return; const c = new V3(T.pos.x, T.pos.y + .8, T.pos.z); explode(f, c, 3.2, { dmg: 4, kb: 6, up: 8, ragdoll: .9, color: '#ffd91a', guardBreak: true, hitstop: .08, shake: .5 }); if (f.verity) f.verity.ov = null; });
        } },
      ],
      onEnd: () => { if (f.verity) f.verity.ov = null; },
    });
  });

/* ===== personajes/sebolla/Skills/Code/Sándwich/sebSandA.js ===== */
/* Habilidad: Sándwich  ·  personaje: sebolla  ·  movimiento: sebSandA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebSandA', function (f, o) {
    let tg = null;
    const dirTo = () => new V3(tg.pos.x - f.pos.x, 0, tg.pos.z - f.pos.z).normalize();
    const push = (d, k) => { if (tg && !tg.remote) { tg.pos.x += d.x * k; tg.pos.z += d.z * k; } };
    const behind = () => { const d = dirTo(); return new V3(tg.pos.x + d.x * 2.2, tg.pos.y + 1.7, tg.pos.z + d.z * 2.2); };
    const front2 = () => { const d = dirTo(); return new V3(tg.pos.x - d.x * 1.0, tg.pos.y + 1.7, tg.pos.z - d.z * 1.0); };
    startAction(f, {
      name: 'sebSandA', dur: 1.8, noControl: true, aim: true, armor: true, speedMul: 0,
      start: () => popText(chestOf(f), '¡Sándwich!', '#ffd91a', 22),
      steps: [
        { at: .1, fn: () => { const c = front(f, 1.6, 1.0); tg = enemiesOf(f).filter(g => chestOf(g).distanceTo(c) < 3)[0] || null; if (tg) { verityGo(f, behind, .9, 1.4, 'happy'); ringAt(new V3(tg.pos.x, tg.pos.y + .1, tg.pos.z), '#ffd91a', 2.5, .4); sfx('tp', tg.pos); } } },
        ...[.4, 1.15].map(at => ({ at, fn: () => { if (!tg || !tg.alive) return; const d = dirTo(); if (applyHit(f, tg, { dmg: 3, stun: .65, kb: 0, color: '#ffd91a', hitstop: .06, shake: .2 })) { push(d, 1.2); fistFx(f, '#ffd91a'); impactStar(chestOf(tg), '#ffffff', 1.8, .2); } } })),
        ...[.8, 1.45].map(at => ({ at, fn: () => { if (!tg || !tg.alive) return; const d = dirTo(); verityGo(f, front2, .35, 1.5, 'angry'); if (applyHit(f, tg, { dmg: 3, stun: .65, kb: 0, color: '#ffd91a', hitstop: .06, shake: .2 })) { push(d, -1.2); impactStar(chestOf(tg), '#ffd91a', 1.8, .2); } } })),
        { at: 1.65, fn: () => { if (!tg || !tg.alive) return; verityGo(f, () => front(f, 1.2, 1.7), .3, 1.5, 'angry'); const c = chestOf(tg); explode(f, c, 3.2, { dmg: 6, kb: 6, up: 10, ragdoll: .9, color: '#ffd91a', guardBreak: true, hitstop: .09, shake: .45 }); popText(c, '¡CLAP!', '#ffd91a', 24); } },
      ],
      onEnd: () => { if (f.verity) f.verity.ov = null; },
    });
  });

/* ===== personajes/sebolla/Skills/Code/Verity Gigante/sebMount.js ===== */
/* Habilidad: Verity Gigante  ·  personaje: sebolla  ·  movimiento: sebMount
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Verity Gigante: transformación, subida y montura
CF.mover('sebMount', function (f, o) {
    if (f.mount) return false;
    startAction(f, {
      name: 'sebMount', dur: 2.6, noControl: true, armor: true, speedMul: 0, aim: true, anim: [[0, 'castUp', 500]],
      start: () => {
        const F = fwd(f.yaw), M = f.mount = Object.assign(makeGiantVerity(), { phase: 'morph', t: 0, dur: o.dur || 12, pos: clampArena(new V3(f.pos.x + F.x * 5, 0, f.pos.z + F.z * 5), 3), yaw: f.yaw, ph: 0, mv: 0, sign: 1, charge: 0, chargeCd: 0, wdT: 0, chT: 0, from: null });
        M.pos.y = 0; M.g.scale.set(.02, .02, .02); scene.add(M.g); f.iframes = Math.max(f.iframes, 3);
        popText(chestOf(f), '¡Verity, ven!', '#ffd91a', 24); sfx('ult', M.pos); ringAt(new V3(M.pos.x, .1, M.pos.z), '#ffd91a', 6, .8); G.shake = Math.max(G.shake, .4);
      },
    });
  });

/* ===== personajes/randi/Skills/Code/Capitán Perú/randiMahoraga.js ===== */
/* Habilidad: Capitán Perú  ·  personaje: randi  ·  movimiento: randiMahoraga
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// La gran invocación: solo si hay un rival cerca; gasta 12 s del despertar (en Jujutsu Shenanigans gasta el 40 % de la barra)
CF.mover('randiMahoraga', function (f, o) {
    const tg = enemiesOf(f).filter(g => dist2d(f, g) < 9).sort((a, b) => dist2d(f, a) - dist2d(f, b))[0];
    if (!tg || f.awak < 4 || f.capRandi) { if (f.isPlayer) popText(chestOf(f), f.capRandi ? 'Ya está invocado' : f.awak < 4 ? 'Poco despertar' : 'Acércate a un rival', '#ffb3b8', 18); return false; }
    if (!(G.rules.ultInf && f.isPlayer)) f.awak = Math.max(.5, f.awak - 12); randiSummon(f, tg);
  });

/* ===== personajes/randi/Skills/Code/Cuyes Bomba/randiCuyes.js ===== */
/* Habilidad: Cuyes Bomba  ·  personaje: randi  ·  movimiento: randiCuyes
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiCuyes', function (f, o) {
    startAction(f, {
      name: 'randiCuyes', dur: .7, speedMul: .3, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Cuyes!', '#d9a05b', 20),
      steps: [{ at: .3, fn: () => { for (let i = 0; i < 4; i++) randiCuy(f, (i - 1.5) * .3, o); sfx('whoosh', f.pos); } }],
    });
  });

/* ===== personajes/randi/Skills/Code/Cóndor de los Andes/randiCondor.js ===== */
/* Habilidad: Cóndor de los Andes  ·  personaje: randi  ·  movimiento: randiCondor
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiCondor', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 10, f.pos.y, f.pos.z + F.z * 10);
    clampArena(dest, 1.5);
    startAction(f, {
      name: 'randiCondor', dur: 1.0, speedMul: .25, aim: true, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡CÓNDOR!', '#ffd23f', 24),
      steps: [{ at: .3, fn: () => randiCondorFly(f, dest, o) }],
    });
  });

/* ===== personajes/randi/Skills/Code/Estampida Andina/randiLlamas.js ===== */
/* Habilidad: Estampida Andina  ·  personaje: randi  ·  movimiento: randiLlamas
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiLlamas', function (f, o) {
    const F = fwd(f.yaw), R = rightOf(f.yaw), llamas = [], pick = [0, 2, 3];
    const clear = () => { for (const L of llamas) if (L.g.parent) L.g.parent.remove(L.g); llamas.length = 0; };
    startAction(f, {
      name: 'randiLlamas', dur: 2.3, aim: true, speedMul: .3, anim: [[0, 'windup', 700], [.3, 'mega', 1500]],
      start: () => { popText(chestOf(f), '¡ESTAMPIDA ANDINA!', '#ffd23f', 24); sfx('dash', f.pos); },
      steps: [{ at: .35, fn: () => {
        sfx('fire', f.pos, .6); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 4, .5);
        for (let i = 0; i < 5; i++) {
          const off = (i - 2) * 1.9, g = DOM_ANIMALS[pick[i % 3]](); g.scale.setScalar(.8);
          const p = new V3(f.pos.x + F.x * 1.5 + R.x * off, f.pos.y + 1, f.pos.z + F.z * 1.5 + R.z * off);
          g.position.set(p.x, groundAt(p.x, p.z), p.z); g.rotation.y = Math.atan2(F.x, F.z); scene.add(g); llamas.push({ g, p, set: new Set(), ph: rand(0, 6), k: 0 });
          burst(p, 8, '#e8d9b0', 5, .14, .4, .3);
        }
      } }],
      tick: (a, t, dt) => {
        for (const L of llamas) {
          L.p.x += F.x * 21 * dt; L.p.z += F.z * 21 * dt; L.ph += dt * 15; L.k += dt;
          L.g.position.set(L.p.x, groundAt(L.p.x, L.p.z) + Math.abs(Math.sin(L.ph)) * .28, L.p.z);
          if (Math.random() < .5) emit(L.p.x + rand(-.5, .5), L.g.position.y + .1, L.p.z + rand(-.5, .5), rand(-1, 1), rand(.5, 2), rand(-1, 1), '#d8d0c0', .18, .4, .2, 2);
          if (hitArea(f, L.p, 1.5, { dmg: o.dmg || 6, kb: 9, up: 8, ragdoll: .8, stun: .4, color: '#ffd23f', set: L.set, hitstop: .04, shake: .3 })) { impactStar(L.p, '#ffd23f', 1.8, .2); }
          if (L.k > .22) { L.k = 0; worldDamage(L.p, 2.6, .8, 9, 1); }
        }
        if (t > 1.9 && llamas.length) clear();
      },
      onEnd: clear,
    });
  });

/* ===== personajes/randi/Skills/Code/Paloma Mensajera/randiPaloma.js ===== */
/* Habilidad: Paloma Mensajera  ·  personaje: randi  ·  movimiento: randiPaloma
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPaloma', function (f, o) {
    startAction(f, {
      name: 'randiPaloma', dur: .55, speedMul: .3, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Paloma mensajera!', '#e6ecf2', 20),
      steps: [{ at: .2, fn: () => { jlPigeon(f, 0, { dmg: o.dmg || 3.2, marks: 2, fast: true }); sfx('whoosh', f.pos); } }],
    });
  });

/* ===== personajes/randi/Skills/Code/Perros Viringos/randiPerros.js ===== */
/* Habilidad: Perros Viringos  ·  personaje: randi  ·  movimiento: randiPerros
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPerros', function (f, o) {
    startAction(f, {
      name: 'randiPerros', dur: .85, speedMul: .25, aim: true, anim: [[0, 'point', 500]],
      start: () => popText(chestOf(f), '¡Perros viringos!', '#e6b8b8', 22),
      steps: [{ at: .35, fn: () => { randiDog(f, -1, 9); randiDog(f, 1, 9); sfx('whoosh', f.pos); } }],
    });
  });

/* ===== personajes/randi/Skills/Code/Pisco Sour/randiPisco.js ===== */
/* Habilidad: Pisco Sour  ·  personaje: randi  ·  movimiento: randiPisco
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPisco', function (f, o) {
    startAction(f, {
      name: 'randiPisco', dur: .85, speedMul: .3, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡Un pisco sour!', '#ffe9a0', 22),
      steps: [{ at: .5, fn: () => {
        f.pisco = o.dur || 7; f.hp = Math.min(f.maxHp, f.hp + 6);
        burst(chestOf(f), 34, '#ffe9a0', 9, .2, .6, .4); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 3, .5);
        popText(chestOf(f), '¡CHISPEADO!', '#ffd23f', 26); sfx('dash', f.pos);
      } }],
    });
  });

/* ===== personajes/randi/Skills/Code/Tinku/randiTinku.js ===== */
/* Habilidad: Tinku  ·  personaje: randi  ·  movimiento: randiTinku
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiTinku', function (f, o) {
    startAction(f, {
      name: 'randiTinku', dur: 1.1, noControl: true, speedMul: 0, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡TINKU!', '#ffd23f', 28),
      steps: [{ at: .5, fn: () => randiTinku(f) }],
    });
  });

/* ===== personajes/capitan/Skills/Code/Rueda de Adaptación/capAdapt.js ===== */
/* Habilidad: Rueda de Adaptación  ·  personaje: capitan  ·  movimiento: capAdapt
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Rueda de Adaptación (como el modo defensa de Mahoraga): el próximo golpe que reciba lo cura y lo adapta a ese rival
CF.mover('capAdapt', function (f, o) {
    startAction(f, {
      name: 'capAdapt', dur: .45, speedMul: .4, anim: [[0, 'vpose', 500]],
      start: () => { f.capDef = 3.5; popText(chestOf(f), '¡Modo defensa!', '#ffd23f', 22); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 3.5, .5); sfx('tp', f.pos); f.wheelPulse = 1; },
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Clipazo/jlClippy.js ===== */
/* Habilidad: Clipazo  ·  personaje: jesuluto  ·  movimiento: jlClippy
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// «Clipazo»: Clippy sale disparado a por el rival, lo golpea y vuelve emocionado (ayuda más durante unos segundos)
CF.mover('jlClippy', function (f, o) {
    const tg = findTarget(f, 22);
    startAction(f, {
      name: 'jlClippy', dur: .9, speedMul: .3, aim: true, anim: [[0, 'castUp', 500], [.3, 'point', 500]],
      start: () => { jlScreen(f, 'clippy', 1.6); if (f.clippy) f.clippy.say('¡Parece que estás atacando!'); },
      steps: [{ at: .25, fn: () => {
        const c = f.clippy; if (!c) return; const dest = tg ? chestOf(tg) : front(f, 9, 1.4), from = c.pos.clone(), t0 = G.time;
        c.ov = { until: G.time + .95, sc: 1.9, mood: 'angry', pos: () => { const u = clamp((G.time - t0) / .35, 0, 1), bk = clamp((G.time - t0 - .5) / .4, 0, 1), e = u < 1 ? u : 1 - bk; return new V3(from.x + (dest.x - from.x) * e, from.y + (dest.y - from.y) * e + Math.sin(u * Math.PI) * .8, from.z + (dest.z - from.z) * e); } };
        f.jlFury = G.time + (o.dur || 6);
        later(.33, () => { if (G.state !== 'play') return; explode(f, dest, 2.6, { dmg: o.dmg || 8, stun: .9, kb: 9, up: 5, ragdoll: .5, color: '#cfd6df', hitstop: .07, shake: .3 }); popText(dest, '¡Clip!', '#ffffff', 24); burst(dest, 18, '#cfd6df', 9, .16, .4, 0); sfx('hit', dest); });
      } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Clippy Gigante/jlGiant.js ===== */
/* Habilidad: Clippy Gigante  ·  personaje: jesuluto  ·  movimiento: jlGiant
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlGiant', function (f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), dest = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 10, 0, f.pos.z + F.z * 10);
    clampArena(dest, 1.5); dest.y = groundAt(dest.x, dest.z);
    startAction(f, {
      name: 'jlGiant', dur: 1.3, speedMul: .15, aim: true, anim: [[0, 'point', 500]],
      start: () => { jlScreen(f, 'clippy', 1.6); if (f.clippy) f.clippy.say('¡Parece que vas a perder!'); warnCircle(dest, 5, '#0078d7', 1.0); },
      steps: [
        { at: .25, fn: () => {
          const c = f.clippy; if (!c) return; const from = c.pos.clone(), t0 = G.time;
          c.ov = { until: G.time + 1.1, sc: 3.4, mood: 'angry', pos: () => { const u = clamp((G.time - t0 - .1) / .55, 0, 1); return new V3(from.x + (dest.x - from.x) * u, from.y + (dest.y + 2.2 - from.y) * u + Math.sin(u * Math.PI) * 3, from.z + (dest.z - from.z) * u); } };
        } },
        { at: .95, fn: () => {
          const c = new V3(dest.x, dest.y + 1, dest.z); explode(f, c, 5, { dmg: o.dmg || 13, kb: 13, up: 9, ragdoll: 1.2, color: '#0078d7', guardBreak: true, hitstop: .12, shake: .6 });
          popText(c, '¡CLIC!', '#ffffff', 28); burst(c, 36, '#cfd6df', 10, .2, .6, .3); ringAt(new V3(dest.x, dest.y + .1, dest.z), '#7ad7ff', 6, .5); sfx('boom', dest);
        } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Ctrl + Z/jlUndo.js ===== */
/* Habilidad: Ctrl + Z  ·  personaje: jesuluto  ·  movimiento: jlUndo
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlUndo', function (f, o) {
    startAction(f, {
      name: 'jlUndo', dur: .55, speedMul: 0, armor: true, anim: [[0, 'charge', 500]],
      start: () => { jlScreen(f, 'undo', 1.2); popText(chestOf(f), 'Ctrl + Z', '#7ad7ff', 26); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', 3, .4); },
      steps: [{ at: .3, fn: () => {
        const h = f.jlHist, snap = h && h[0]; if (!snap) return;
        explode(f, chestOf(f), 3.4, { dmg: 4, stun: .5, kb: 8, up: 3, color: '#0078d7', hitstop: .04, shake: .2 });   // la «copia» que deja atrás estalla
        ghost(f, '#0078d7', .6, .45);
        const heal = Math.max(10, (snap.hp - f.hp) * .6); if (!f.remote) { f.pos.set(snap.x, snap.y, snap.z); f.vel.set(0, 0, 0); f.hp = Math.min(f.maxHp, f.hp + heal); }
        f.jlHist = [];
        ghost(f, '#0078d7', .6, .45); burst(chestOf(f), 24, '#7ad7ff', 8, .18, .5, 0); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', 4, .45); sfx('tp', f.pos);
        popText(chestOf(f), '+' + Math.round(heal), '#7dff6a', 22);
      } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Formatear C/jlFormat.js ===== */
/* Habilidad: Formatear C:  ·  personaje: jesuluto  ·  movimiento: jlFormat
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlFormat', function (f, o) {
    const R = o.r || 6.2; let pct = 0;
    startAction(f, {
      name: 'jlFormat', dur: 1.9, speedMul: .12, armor: true, anim: [[0, 'charge', 500], [.5, 'vpose', 800]],
      start: () => { jlScreen(f, 'load', 2.0); popText(chestOf(f), 'Formateando C:\\ …', '#7ad7ff', 22); warnCircle(new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z), R, '#0078d7', 1.7); sfx('zap', f.pos); },
      tick: (a, t) => {
        const k = clamp(t / 1.65, 0, 1), np = Math.floor(k * 10) * 10;
        if (np !== pct) { pct = np; popText(new V3(f.pos.x, f.pos.y + 2.4, f.pos.z), pct + ' %', '#7ad7ff', 16); sfx('select', f.pos, .5); }
        if (Math.random() < .5) { const an = rand(0, TAU), rr = R * rand(.3, 1); emit(f.pos.x + Math.cos(an) * rr, f.pos.y + .2, f.pos.z + Math.sin(an) * rr, 0, rand(1, 3), 0, '#3aa0ff', .14, .5, 0, 1); }
      },
      steps: [{ at: 1.65, fn: () => {
        const c = new V3(f.pos.x, f.pos.y + 1, f.pos.z); popText(chestOf(f), '¡100 %!', '#ffffff', 26);
        explode(f, c, R, { dmg: o.dmg || 11, kb: 12, up: 7, ragdoll: .9, stun: .8, color: '#0078d7', guardBreak: true, hitstop: .1, shake: .5 }); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', R * 1.4, .5);
        burst(c, 40, '#3aa0ff', 11, .22, .6, .3); sfx('boom', f.pos);
      } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Lluvia de Errores/jlRain.js ===== */
/* Habilidad: Lluvia de Errores  ·  personaje: jesuluto  ·  movimiento: jlRain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlRain', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), c0 = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9);
    clampArena(c0, 3); c0.y = groundAt(c0.x, c0.z);
    startAction(f, {
      name: 'jlRain', dur: .8, speedMul: .2, aim: true, anim: [[0, 'castUp', 700]],
      start: () => { jlScreen(f, 'error', 2.6); warnCircle(c0, 6.4, '#0078d7', 2.8); sfx('zap', f.pos); popText(chestOf(f), 'Error 0x80004005', '#7ad7ff', 20); },
      steps: [{ at: .3, fn: () => {
        let n = 0; const spawn = () => { if (n >= 16 || G.state !== 'play') return; n++; const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 6; jlFallWindow(f, c0.x + Math.cos(a) * r, c0.z + Math.sin(a) * r, o); later(.14, spawn); };
        spawn();
      } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/No Responde/jlWave.js ===== */
/* Habilidad: No Responde  ·  personaje: jesuluto  ·  movimiento: jlWave
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// «No responde»: una barra de progreso gigante avanza y deja congelado (y sin guardia) a quien toca
CF.mover('jlWave', function (f, o) {
    startAction(f, {
      name: 'jlWave', dur: .85, speedMul: .15, aim: true, anim: [[0, 'castUp', 600], [.3, 'point', 500]],
      start: () => { jlScreen(f, 'load', 2.4); popText(chestOf(f), 'Instalando actualización…', '#7ad7ff', 20); },
      steps: [{ at: .35, fn: () => {
        const yaw = f.yaw, dir = new V3(Math.sin(yaw), 0, Math.cos(yaw)), geo = new THREE.BoxGeometry(7.4, .75, .4), mat = new THREE.MeshBasicMaterial({ map: jlBarTex(), transparent: true, opacity: .96 }), mesh = new THREE.Mesh(geo, mat), hit = new Set(), nd = ndt(); let life = 0;
        mesh.position.copy(front(f, 1.6, 1.2)); mesh.rotation.y = yaw; scene.add(mesh); sfx('beam', f.pos, .8);
        const end = () => { scene.remove(mesh); geo.dispose(); mat.dispose(); };
        const tick = () => {
          const dt = nd(); life += dt; mesh.position.addScaledVector(dir, 26 * dt); mesh.scale.y = 1 + Math.sin(life * 22) * .06;
          emit(mesh.position.x + rand(-3.5, 3.5) * Math.cos(yaw), mesh.position.y + rand(-.3, .6), mesh.position.z - rand(-3.5, 3.5) * Math.sin(yaw), 0, rand(.5, 2), 0, '#7ad7ff', .14, .35, 0, 1);
          for (const g of enemiesOf(f)) {
            if (hit.has(g)) continue; const q = chestOf(g).sub(mesh.position), along = q.dot(dir), side = Math.abs(q.x * dir.z - q.z * dir.x);
            if (Math.abs(along) < 1.3 && side < 3.9) { hit.add(g); applyHit(f, g, { dmg: o.dmg || 7, stun: 1.6, freeze: 1.6, kb: 3, color: '#0078d7', guardBreak: true, hitstop: .08, shake: .3 }); popText(chestOf(g), 'No responde', '#ffffff', 20); burst(chestOf(g), 16, '#7ad7ff', 8, .16, .4, 0); sfx('ice', g.pos); }
          }
          if (life > 1.05 || groundAt(mesh.position.x, mesh.position.z) > 1.6) { end(); return; }
          if (G.state === 'play') later(0, tick); else end();
        };
        later(0, tick);
      } }],
    });
  });

/* ===== personajes/jesuluto/Skills/Code/Ventanas de Error/jlError.js ===== */
/* Habilidad: Ventanas de Error  ·  personaje: jesuluto  ·  movimiento: jlError
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlError', function (f, o) {
    startAction(f, {
      name: 'jlError', dur: .8, speedMul: .3, aim: true, anim: [[0, 'castUp', 400], [.25, 'point', 500]],
      start: () => jlScreen(f, 'error', 1.5),
      steps: [0, .13, .26, .46].map((t, i) => ({ at: .18 + t, fn: () => { sfx('zap', f.pos); jlLaunchWindow(f, f.yaw + (i === 3 ? 0 : (i - 1) * .32), o, i === 3); } })),
    });
  });

  }
});

// ---- coreografías (cinemáticas) ----
(window.CF_COREOGRAFIAS = window.CF_COREOGRAFIAS || []).push(function (A) {
  with (A) {
    const CF = { coreografia: function (id, fn) { CHORE[id] = fn(); } };

/* ===== personajes/javi/Skills/Animation/Cadena de Lanza/javiChain.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: javi · habilidad: Cadena de Lanza · id: javiChain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// CADENA DE LANZA · tironea la cadena en tensión, estoca al rival que llega volando, lo alza en la lanza,
// gira dos vueltas con él como una maza (cada vuelta más rápida) y lo lanza lejos.
CF.coreografia('javiChain', function () {
  return {
    dur: 3.2, pull: 1, attClip: 'cine_cadena', vicClip: 'cine_vic_cadena', trails: [[.5, .82], [1.3, 2.3]],
    vic: [[0, 'vJChainPull'], [.3, 'vJChainPull'], [.5, 'vJChainPull'], [.6, 'vJPierced'], [.72, 'vJShudder'], [.95, 'vJHang'], [1.3, 'vJHangLag'], [1.6, 'vJLaunch'], [2.2, 'vJLaunch'], [2.4, 'vJFloat']],
    apos: [[0, 0, 0, 0, 0], [.48, 0, 0, -.2, 0], [.62, 0, 0, .35, 0], [1.15, 0, 0, .35, 0], [1.4, 0, 0, .35, 1.3], [1.7, 0, 0, .3, 4.2], [2, 0, 0, .3, 9], [2.22, 0, 0, .3, 12.566], [3.2, 0, 0, .3, 12.566]],
    vpos: [[.5, 0, .15, 1.95, 0, 'o'], [.6, 0, .1, 1.9, 0], [3.2, 0, .1, 1.9, 0]],
    anchor: [[.62, 2.2, 'tip', 0, .12]],
    ev: [
      { t: .03, fx: 'magic', text: '¡ENGANCHADO!' },
      { t: .3, fx: 'elec' },
      { t: .62, hit: 4, fx: 'stab', imp: 1, slow: .18, sfx: 'heavy' },
      { t: .7, fx: 'ring', at: 'vic', r: 2.2 },
      { t: .95, text: '¡ARRIBA!', who: 'att', fx: 'impact' },
      { t: 1.4, fx: 'ring', at: 'att', r: 3.6 },
      { t: 1.45, hit: 1.5, sfx: 'swing', fx: 'ghost' },
      { t: 1.7, hit: 1.5, fx: 'lines', sfx: 'swing' },
      { t: 1.8, fx: 'ghost' },
      { t: 2, hit: 1.5, fx: 'lines', sfx: 'swing' },
      { t: 2.05, fx: 'ghost' },
      { t: 2.22, rel: { dmg: 9, kb: 28, up: 5, rag: 2.4 }, fx: 'slash', tilt: 0, imp: 1, slow: .3 },
      { t: 2.24, fx: 'boom', at: 'vic', r: 2.4 },
    ],
    shots: [[0, 'clv', { s: 1, d: 6, fov: 52 }], [.46, 'ots', { s: -1 }], [.56, 'tip', { s: 1, d: 4.8, fov: 46 }], [.78, 'cl', { s: 1, d: 4.8, fov: 52 }], [1.2, 'orbit', { s: 1, spd: 1.6, r: 4.8, h: .3, fov: 54, fit: false }], [2.18, 'clv', { s: -1, d: 4.6, roll: .06 }], [2.7, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/javi/Skills/Animation/Embestida Relámpago/javiDash.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: javi · habilidad: Embestida Relámpago · id: javiDash
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// EMBESTIDA RELÁMPAGO · tres pasadas que atraviesan al rival (estocada, tajo y ascenso), pausa en el aire con la lanza
// hacia abajo y una picada que lo clava en el piso. Todo ocurre pegado al rival: cada pasada tiene su propia cámara.
CF.coreografia('javiDash', function () {
  return {
    dur: 3.5, catch: 2.2, reach: 'jCoil', attClip: 'cine_embestida', vicClip: 'cine_vic_embestida', trails: [[.3, .56], [.62, .88], [1.0, 1.3], [1.9, 2.27]],
    vic: [[0, 'vJReady'], [.3, 'vJReady'], [.4, 'vJPierced'], [.5, 'vJSideL'], [.6, 'vJAfterL'], [.7, 'vJPierced'], [.8, 'vJSideR'], [.9, 'vJAfterR'], [1.0, 'vJShudder'], [1.11, 'vJPierced'], [1.28, 'vJLaunch'], [1.5, 'vJHangLag'], [1.7, 'vJFloat'], [1.95, 'vJDiveCatch'], [2.1, 'vJFoldFall'], [2.2, 'vJGroundPre'], [2.26, 'vJGroundHit'], [2.3, 'vJGroundRebound'], [3.4, 'vJGroundRebound']],
    apos: [[0, 0, 0, 0, 0], [.12, 0, 0, -.25, 0], [.26, 0, 0, -.25, 0],
      [.3, -2, 0, .2, -.927, 'c'], [.46, 2, 0, 3.2, -.927, 'o'], [.56, 2.5, 0, 3.6, -.927, 'o'],
      [.62, 2.2, 0, .5, 1.069, 'c'], [.78, -2.2, 0, 2.9, 1.069, 'o'], [.88, -2.7, 0, 3.3, 1.069, 'o'],
      [.94, -1.2, 0, .5, -.785, 'c'], [1.02, -1.2, 0, .5, -.785], [1.11, 0, 1.7, 1.7, -.785], [1.2, 1.2, 3.4, 2.9, -.785],
      [1.5, .3, 5, 1.2, 0], [1.62, 0, 5.4, .9, 0], [1.95, 0, 5.4, .9, 0], [2.25, 0, 0, 1, 0, 'i'], [2.45, 0, 0, 1, 0], [3.5, 0, 0, 1, 0]],
    vpos: [[0, 0, 0, 1.7, 0], [.3, 0, 0, 1.7, 0], [.34, 0, 0, 1.7, 0], [.5, .12, .05, 1.74, .45], [.62, 0, 0, 1.7, .25], [.66, 0, 0, 1.7, .25], [.8, -.12, .05, 1.74, -.45], [.94, 0, 0, 1.7, 0],
      [1.11, 0, .05, 1.7, 0], [1.25, 0, 1.4, 1.7, .3], [1.5, 0, 3.2, 1.7, .8], [1.62, 0, 3.8, 1.7, 1], [1.97, 0, 3.8, 1.7, 1.6], [2.25, 0, 0, 1.7, 1.6, 'i'], [3.5, 0, 0, 1.7, 1.6]],
    anchor: [[1.97, 2.25, 'tip', 0, .1]],
    ev: [
      { t: .26, fx: 'lines', sfx: 'dash' },
      { t: .3, fx: 'ghost' },
      { t: .34, hit: 3, fx: 'line', imp: 1, sfx: 'slash' },
      { t: .62, fx: 'ghost', sfx: 'dash' },
      { t: .66, hit: 3, fx: 'line', sfx: 'slash' },
      { t: .94, fx: 'ghost' },
      { t: 1.11, hit: 3, fx: 'xcut', slow: .2, imp: 1, sfx: 'heavy' },
      { t: 1.14, fx: 'ring', at: 'vic', r: 2.8 },
      { t: 1.62, fx: 'charge', at: 'att', text: '¡DESDE ARRIBA!', who: 'att', slow: .3 },
      { t: 1.93, fx: 'lines', sfx: 'swing' },
      { t: 2.2, fx: 'stab', hit: 2 },
      { t: 2.25, fx: 'boom', at: 'ground', big: 1, r: 3.4, imp: 1 },
      { t: 2.26, fx: 'crack', at: 'ground', r: 5.5 },
      { t: 2.27, rel: { dmg: 7, kb: 2, up: 3, rag: 2 }, slow: .3 },
    ],
    shots: [[0, 'faceA', { s: 1, fov: 34 }], [.26, 'pass', { h: -.927, s: 1, d: 5.2, fov: 50 }], [.6, 'pass', { h: 1.069, s: -1, d: 5, fov: 50, roll: .06 }], [.92, 'cl', { s: 1, d: 4.6, fov: 54 }], [1.3, 'cl', { s: -1, d: 5.4, fov: 54 }],
      [1.62, 'faceA', { s: -1, fov: 40 }], [1.93, 'cl', { s: 1, d: 4.4, fov: 52, roll: -.05 }], [2.24, 'clv', { s: -1, d: 4, fov: 48, roll: .07 }], [2.75, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/javi/Skills/Animation/Empalamiento/javiImpale.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: javi · habilidad: Empalamiento · id: javiImpale
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Cabeza -> derribo de espaldas -> pie sobre el torso -> estaca vertical.
CF.coreografia('javiImpale', function () {
  return {
    dur: 4.1, catch: 2, reach: 'jGReach', trails: [[2.48, 2.76], [3.16, 3.43]],
    att: [[.2, 'jGReach'], [.38, 'jGClutch'], [.56, 'jGDrag'], [.8, 'jGThrow'], [.96, 'jGFollow'], [1.13, 'jGFollow'], [1.34, 'jGStep'], [1.6, 'jGPin'], [1.82, 'jGPin'], [2.13, 'jGRaise'], [2.4, 'jGPoise'], [2.53, 'jGPoise'], [2.64, 'jGDriveSmear'], [2.7, 'jGDrive'], [2.85, 'jGHold'], [3.1, 'jGHold'], [3.32, 'jGWithdraw'], [3.57, 'jGRecover'], [4, 'javiHero']],
    vic: [[.22, 'vJReady'], [.38, 'vGGrab'], [.56, 'vGOffBalance'], [.8, 'vGFall'], [.96, 'vGBackHit'], [1.05, 'vGBackRebound'], [1.22, 'vGOnBack'], [1.6, 'vGPressed'], [1.84, 'vGStruggle'], [2.13, 'vGPressed'], [2.4, 'vGStruggle'], [2.57, 'vGPressed'], [2.7, 'vGFlinch'], [2.83, 'vGStill'], [3.1, 'vGStill'], [3.55, 'vGOnBack'], [4, 'vGStill']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .12, 0], [.38, 0, 0, .34, 0], [.8, 0, 0, .62, 0], [1.13, 0, 0, .62, 0], [1.6, 0, 0, 1.15, 0], [3.1, 0, 0, 1.15, 0], [3.57, -.08, 0, .7, 0], [4.1, -.08, 0, .7, 0]],
    vpos: [[0, 0, 0, 1.45, 0], [.38, 0, 0, 1.45, 0], [.56, 0, .1, 1.48, 0], [.8, 0, .23, 1.58, 0], [.96, 0, .08, 1.7, 0, 'i'], [1.05, 0, .14, 1.72, 0], [1.22, 0, .08, 1.72, 0], [4.1, 0, .08, 1.72, 0]],
    bindings: [
      { start: .22, end: .82, enter: .14, exit: .1, part: 'armL', from: [0, -10, 0], target: 'head', to: [-3, 5, 1], limit: .85 },
      { start: 1.4, end: 3.4, enter: .2, exit: .18, part: 'legR', from: [0, -12, 0], target: 'torso', to: [0, 6, 2.2], limit: .8 },
    ],
    stake: { scale: .58, start: 1.98, end: 3.55, clearance: [[1.98, 0, .65, 0, 0], [2.2, 0, .95, 0, 0], [2.46, 0, .95, 0, 0], [2.55, 0, .75, 0, 0], [2.7, 0, 0, 0, 0, 'i'], [2.84, 0, -.04, 0, 0], [3.1, 0, -.04, 0, 0], [3.32, 0, .65, 0, 0], [3.55, 0, .9, 0, 0]] },
    ev: [
      { t: .38, hit: 2, sfx: 'grab', hs: .045, shake: .1, at: 'head' },
      { t: .8, sfx: 'swing' },
      { t: .96, hit: 4, fx: 'impact', at: 'ground', imp: 1, hs: .08, shake: .4 },
      { t: .97, fx: 'ring', at: 'ground', r: 1.6 },
      { t: 1.6, hit: 2, sfx: 'heavy', hs: .045, shake: .15 },
      { t: 2.14, fx: 'charge', at: 'att' },
      { t: 2.7, hit: 9, fx: 'stab', at: 'head', imp: 1, slow: .18, hs: .16, shake: .6 },
      { t: 2.71, fx: 'ring', at: 'head', r: 1.15, face: 1 },
      { t: 3.2, sfx: 'draw' },
      { t: 3.58, letGo: 1.8 },
    ],
    shots: [[0, 'two', { s: -1, fov: 48, roll: .01 }], [.79, 'ground', { s: -1, fov: 52, roll: .01 }], [1.4, 'two', { s: -1, fov: 46, roll: .01 }], [2.09, 'two', { s: -1, fov: 48, roll: .01 }], [3.59, 'hero', { s: -1, roll: .01 }]],
  };
});

/* ===== personajes/javi/Skills/Animation/Furia del Destello/javiFury.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: javi · habilidad: Furia del Destello · id: javiFury
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// FURIA DEL DESTELLO (sin lanza, despierto) · lo agarra, diez puñetazos seguidos, un gancho que lo sube y un Destello Negro que lo manda lejos.
CF.coreografia('javiFury', function () {
  return {
    dur: 3.3, catch: 2.2, reach: 'jabR_w', trails: [[1.5, 1.75], [2.25, 2.5]],
    att: [[0, 'jabR_w'], [0.2, 'jabR'], [0.32, 'jabL'], [0.44, 'jabR'], [0.56, 'jabL'], [0.6799999999999999, 'jabR'], [0.8, 'jabL'], [0.9199999999999999, 'jabR'], [1.04, 'jabL'], [1.16, 'jabR'], [1.28, 'jabL'], [1.42, 'upper_w'], [1.58, 'upper'], [1.9, 'windup'], [2.28, 'mega'], [2.7, 'mega'], [3.1, 'ninja']],
    vic: [[0, 'vJReady'], [0.2, 'vJPierced'], [0.32, 'vJShudder'], [0.44, 'vJPierced'], [0.56, 'vJShudder'], [0.6799999999999999, 'vJPierced'], [0.8, 'vJShudder'], [0.9199999999999999, 'vJPierced'], [1.04, 'vJShudder'], [1.16, 'vJPierced'], [1.28, 'vJShudder'], [1.42, 'vJPierced'], [1.6, 'vJLaunch'], [1.9, 'vJHangLag'], [2.3, 'vJHangLag'], [2.45, 'vJLaunch'], [3.1, 'vJFloat']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .1, 0], [1.4, 0, 0, .1, 0], [1.6, 0, 0, .35, 0], [2.3, 0, 0, .35, 0], [2.6, 0, 0, .1, 0], [3.3, 0, 0, .1, 0]],
    vpos: [[0, 0, 0, 1.6, 0], [.2, 0, 0, 1.45, 0], [1.4, 0, .02, 1.45, 0], [1.6, 0, 1.6, 1.5, 0, 'o'], [1.9, 0, 2.3, 1.5, 0], [2.3, 0, 2.4, 1.5, 0], [2.32, 0, 2.4, 1.6, 0], [3.3, 0, 2.4, 1.6, 0]],
    ev: [
      { t: 0.20, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.32, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.44, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.56, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.68, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.80, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.92, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.04, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.16, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.28, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.58, hit: 4, fx: 'impact', imp: 1, hs: .1, shake: .4 },
      { t: 1.6, fx: 'ring', at: 'vic', r: 2.4 },
      { t: 1.9, fx: 'charge', at: 'att', text: '¡DESTELLO NEGRO!', who: 'att', slow: .3 },
      { t: 2.28, fx: 'boom', at: 'vic', big: 1, r: 4, imp: 1, hs: .2, shake: 1 },
      { t: 2.3, fx: 'crack', at: 'ground', r: 6 },
      { t: 2.32, rel: { dmg: 22, kb: 22, up: 7, rag: 2.4 }, slow: .3 },
    ],
    shots: [[0, 'two', { s: 1, fov: 46 }], [.2, 'cl', { s: -1, d: 4, fov: 52 }], [.7, 'cl', { s: 1, d: 3.6, fov: 56, roll: .05 }], [1.4, 'faceA', { s: -1, fov: 42 }], [1.9, 'cl', { s: 1, d: 4.4, fov: 52, roll: -.05 }], [2.28, 'clv', { s: -1, d: 4, fov: 48, roll: .07 }], [2.8, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/redbird/Skills/Animation/_sin_habilidad/redExec.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: redbird · habilidad: (sin habilidad asignada) · id: redExec
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// lo levanta del cuello, se baja las gafas, carga los ojos a quemarropa y lo atraviesa con el láser
CF.coreografia('redExec', function () {
  return {
    dur: 3.2,
    att: [[.1, 'aCollar'], [.7, 'aCollar'], [1.0, 'visorTouch'], [1.8, 'visorTouch'], [2.0, 'aCollar'], [2.5, 'lookDown'], [3.0, 'redHero']],
    vic: [[.1, 'vLifted'], [.7, 'vDangle'], [1.5, 'vDangle'], [1.85, 'vShock1'], [2.0, 'vShock2'], [2.35, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [.7, 0, 0, .2, 0], [2.0, 0, 0, .2, 0], [2.3, 0, 0, -.4, 0]],
    vpos: [[0, 0, 0, 1.1, 0], [.4, 0, 1.0, 1.1, 0], [1.5, 0, 1.2, 1.15, 0], [2.0, 0, 1.25, 1.2, 0]],
    ev: [
      { t: .1, text: '¡TE TENGO!', who: 'att' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: 1.0, eyes: 1, fx: 'charge', at: 'eyes' },
      { t: 1.3, fx: 'charge', at: 'eyes' },
      { t: 1.6, fx: 'charge', at: 'eyes', sfx: 'ult' },
      { t: 1.85, hit: 3, fx: 'beam', len: 3, imp: 1 },
      { t: 2.0, rel: { dmg: 11, kb: 30, up: 4, rag: 2.3 }, fx: 'beam', big: 1, len: 14, slow: .3 },
      { t: 2.05, fx: 'flash', op: .55 },
      { t: 2.6, eyes: 0 },
    ],
    shots: [[0, 'two'], [.45, 'lowA'], [.95, 'otsV'], [1.55, 'faceV'], [1.85, 'ots', { fov: 40 }], [2.05, 'wide'], [2.5, 'hero']],
  };
});

/* ===== personajes/redbird/Skills/Animation/_sin_habilidad/redKick.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: redbird · habilidad: (sin habilidad asignada) · id: redKick
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// patada al cielo, lo sigue en el aire a patadas, se da vuelta encima de él y lo baja con un rayo de los ojos
CF.coreografia('redKick', function () {
  return {
    dur: 3.0,
    att: [[.05, 'kick_w'], [.18, 'kickHigh'], [.45, 'jump'], [.7, 'kick'], [.9, 'kickHigh'], [1.1, 'kick'], [1.4, 'aUpside'], [1.7, 'aUpside'], [2.0, 'fall'], [2.35, 'land'], [2.8, 'redStance']],
    vic: [[.18, 'vKick1'], [.45, 'vLaunch'], [.7, 'vKick2'], [.9, 'vKick1'], [1.1, 'vSpinA'], [1.55, 'vFloat'], [1.8, 'vBack'], [2.2, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .3, 0], [.7, 0, 3.0, .8, 0], [1.1, 0, 4.4, .9, 0], [1.4, 0, 6.6, 1.3, 0], [1.75, 0, 6.4, 1.3, 0], [2.3, 0, 0, .3, 0, 'i']],
    vpos: [[0, 0, 0, 1.1, 0], [.18, 0, .5, 1.3, 0], [.7, 0, 3.6, 1.9, 0], [1.1, 0, 4.8, 2.0, 1], [1.4, 0, 5.2, 2.1, 3], [1.75, 0, 5.0, 2.0, 3.14], [2.1, 0, 0, 2.1, 3.14, 'i']],
    ev: [
      { t: .18, hit: 3, fx: 'impact', imp: 1 },
      { t: .7, hit: 2, fx: 'slash', tilt: 1.2 },
      { t: .9, hit: 2, fx: 'slash', tilt: -1 },
      { t: 1.1, hit: 2, fx: 'impact' },
      { t: 1.45, eyes: 1, fx: 'charge', at: 'eyes', slow: .25 },
      { t: 1.75, rel: { dmg: 8, kb: 0, up: -26, rag: 2 }, fx: 'beam', big: 1, len: 4 },
      { t: 2.1, fx: 'boom', at: 'ground', r: 2.8, big: 1 },
      { t: 2.12, fx: 'crack', at: 'ground', eyes: 0 },
    ],
    shots: [[0, 'lowA', { s: -1 }], [.4, 'up'], [.8, 'orbit', { r: 4.5, spd: 2.8, h: 1 }], [1.35, 'faceA', { s: -1 }], [1.75, 'top'], [2.1, 'ground'], [2.5, 'hero']],
  };
});

/* ===== personajes/gato/Skills/Animation/Cadena Mágica/gatoChain.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: gato · habilidad: Cadena Mágica · id: gatoChain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// hechizo que lo atrae, lo frena a un palmo, le da un golpecito en la frente y lo hace estallar
CF.coreografia('gatoChain', function () {
  return {
    dur: 2.8, pull: 1, attClip: 'cine_cadena', vicClip: 'cine_vic_cadena',
    att: [[.1, 'magicPalm'], [.55, 'magicPalm'], [.8, 'bow'], [1.2, 'bow'], [1.4, 'point'], [1.6, 'point'], [1.75, 'elegant'], [2.6, 'gatoHero']],
    vic: [[.1, 'vFloat'], [.6, 'vFrozenStand'], [1.4, 'vFrozenStand'], [1.6, 'vStagger'], [1.95, 'vShock1'], [2.1, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [1.75, 0, 0, 0, 0], [2.0, 0, 0, -.4, 3.14]],
    vpos: [[.55, 0, .6, 1.0, 0], [1.4, 0, .5, 1.0, 0], [1.6, 0, .1, 1.2, 0], [1.95, 0, 0, 1.4, 0]],
    ev: [
      { t: .05, fx: 'magic', hit: 2 },
      { t: .6, text: 'Shh...', who: 'att' },
      { t: 1.4, fx: 'ring', at: 'vic', r: 1.2, face: 1 },
      { t: 1.6, hit: 1, sfx: 'block' },
      { t: 1.75, eyes: 1 },
      { t: 1.95, fx: 'charge' },
      { t: 2.1, rel: { dmg: 9, kb: 20, up: 6, rag: 2.2 }, fx: 'boom', r: 2.2, slow: .3 },
      { t: .3, fx: 'ring', at: 'vic', r: 1.6 },
      { t: 1.2, text: 'Quietito...', who: 'att' },
      { t: 1.58, fx: 'impact', imp: 1 },
      { t: 2.0, fx: 'charge', at: 'vic' },
      { t: 2.6, text: 'Qué desastre.', who: 'att' },
    ],
    shots: [[0, 'follow'], [.6, 'two', { fov: 50 }], [1.25, 'faceV', { fov: 36 }], [1.55, 'faceA', { s: -1, fov: 34 }], [1.95, 'otsV', { fov: 44 }], [2.15, 'wide'], [2.55, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/gato/Skills/Animation/Truco Final/gatoTrick.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: gato · habilidad: Truco Final · id: gatoTrick
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// reverencia burlona, lo levanta con el cetro, lo da vuelta en el aire y una copia lo remata desde abajo
CF.coreografia('gatoTrick', function () {
  return {
    dur: 3.4, attClip: 'cine_truco', vicClip: 'cine_vic_truco',
    att: [[.15, 'bow'], [.6, 'bow'], [.9, 'magicPalm'], [1.3, 'castUp'], [1.75, 'scepterW'], [2.05, 'point'], [2.4, 'scepterSmash'], [2.8, 'aTaunt'], [3.3, 'gatoHero']],
    vic: [[.2, 'vConfused'], [.9, 'vFloat'], [1.3, 'vUpside'], [1.75, 'vUpside'], [2.4, 'vLaunch'], [2.8, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.6, 0, 0, -.3, 0], [.9, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.3, 0], [.6, 0, 0, 1.5, 0], [1.3, 0, 2.2, 1.8, 3.14], [1.75, 0, 2.6, 1.9, 6.28], [2.05, 0, 2.4, 1.9, 6.6], [2.45, 0, 4.2, 2.5, 6.6], [2.8, 0, 5.5, 3.2, 7]],
    ev: [
      { t: .2, text: '¿Una reverencia?', who: 'att' },
      { t: .9, fx: 'magic', hit: 2 },
      { t: 1.35, fx: 'ring', r: 2.5, hit: 2 },
      { t: 1.75, fx: 'magic' },
      { t: 2.05, fx: 'clone', a: 1.57 },
      { t: 2.3, fx: 'copies' },
      { t: 2.45, rel: { dmg: 10, kb: 6, up: 14, rag: 2.4 }, fx: 'xcut', slow: .35 },
      { t: 2.5, fx: 'flash', op: .4 },
      { t: 2.8, text: 'Todo era un truco.', who: 'att' },
      { t: .15, fx: 'ring', at: 'att', r: 2, face: 1 },
      { t: 1.15, fx: 'charge', at: 'vic', sfx: 'tp' },
      { t: 1.5, twirl: [1, .6] },
      { t: 1.7, fx: 'line', at: 'vic' },
      { t: 2.25, fx: 'charge', at: 'att' },
      { t: 2.6, fx: 'ring', at: 'ground', r: 3, big: 1 },
    ],
    shots: [[0, 'hero', { s: -1, fov: 50 }], [.55, 'faceA', { fov: 38 }], [.95, 'lowV', { fov: 54 }], [1.45, 'orbit', { r: 4.2, h: 1.5, spd: -2.2, fov: 50 }], [2.0, 'faceV', { fov: 38 }], [2.28, 'up', { fov: 56 }], [2.5, 'wide'], [2.8, 'faceA', { s: -1, fov: 36 }], [3.2, 'hero']],
  };
});

/* ===== personajes/gato/Skills/Animation/_sin_habilidad/gatoCopies.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: gato · habilidad: (sin habilidad asignada) · id: gatoCopies
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// cuatro copias aparecen alrededor y lo pasan de una a otra como pelota; el verdadero espera y lo remata
CF.coreografia('gatoCopies', function () {
  return {
    dur: 3.2, catch: 2, attClip: 'cine_copias', vicClip: 'cine_vic_copias',
    att: [[.1, 'cast'], [.35, 'signs'], [1.6, 'signs'], [1.9, 'scepterW'], [2.15, 'scepterSmash'], [2.6, 'aTaunt'], [3.1, 'elegant']],
    vic: [[.35, 'hurtSideL'], [.6, 'hurtSideR'], [.85, 'vGut'], [1.1, 'vSpinA'], [1.4, 'vFlip'], [1.75, 'vFloat'], [2.15, 'vLaunch'], [2.6, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.35, 0, 0, -2.2, 0, 'c'], [1.8, 0, 0, -2.2, 0], [2.0, 0, 0, .6, 0]],
    vpos: [[0, 0, 0, 1.2, 0], [.35, .8, .2, 1.4, .9], [.6, -.8, .4, 1.5, -.9], [.85, 0, .6, 2.3, 0], [1.1, 0, 1.6, 1.5, 3], [1.4, 0, 2.4, .9, 6], [1.75, 0, 1.6, 1.2, 6.28], [2.15, 0, 1.4, 1.4, 6.28], [2.6, 0, 3.4, 5, 6.28]],
    ev: [
      { t: .2, fx: 'copies', text: '¿Cuál soy yo?', who: 'att' },
      { t: .35, hit: 2, fx: 'clone', a: 0 },
      { t: .6, hit: 2, fx: 'clone', a: 1.57 },
      { t: .85, hit: 2, fx: 'clone', a: 3.14 },
      { t: 1.1, hit: 2, fx: 'clone', a: -1.57, imp: 1 },
      { t: 1.4, fx: 'magic' },
      { t: 2.15, rel: { dmg: 8, kb: 16, up: 10, rag: 2.2 }, fx: 'impact', big: 1, slow: .3 },
      { t: 2.17, fx: 'magic' },
      { t: .35, fx: 'line' },
      { t: .6, fx: 'line' },
      { t: .85, fx: 'line' },
      { t: 1.1, fx: 'line' },
      { t: 1.6, text: 'Por aquí...', who: 'att' },
      { t: 1.78, twirl: [1, .5] },
      { t: 2.0, fx: 'charge', at: 'att' },
      { t: 2.6, text: '¡Era yo!', who: 'att' },
    ],
    shots: [[0, 'two', { fov: 52 }], [.3, 'top'], [.8, 'orbit', { r: 5, spd: 3.4 }], [1.35, 'lowV', { s: -1, fov: 54 }], [1.8, 'ots', { fov: 42 }], [2.15, 'faceA', { fov: 40 }], [2.6, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/sekza/Skills/Animation/Cacería/sekHunt.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sekza · habilidad: Cacería · id: sekHunt
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Cacería: lo atrapa con las garras, lo sube hasta las nubes y lo suelta en picada contra el piso
CF.coreografia('sekHunt', function () {
  return {
    dur: 3.4,
    att: [[.1, 'aCollar'], [.5, 'castUp'], [.9, 'aCollar'], [1.7, 'aCollar'], [2.0, 'fall'], [2.5, 'land'], [3.2, 'ninja']],
    vic: [[.1, 'vLifted'], [.9, 'vDangle'], [1.7, 'vDangle'], [2.0, 'vBack'], [2.45, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.45, 0, 0, .2, 0], [1.1, 0, 8.4, .3, 0], [1.7, 0, 9.4, .3, 0], [2.3, 0, 0, .2, 0, 'i']],
    vpos: [[0, 0, 0, 1.1, 0], [.45, 0, .8, 1.1, 0], [1.1, 0, 8.3, 1.2, 0], [1.7, 0, 9.1, 1.25, 0], [2.3, 0, .2, 1.5, 0, 'i']],
    ev: [
      { t: .1, text: '¡A CAZAR!', who: 'att' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: .6, fx: 'ring', at: 'att', r: 4, face: 1 },
      { t: 1.0, fx: 'magic', at: 'att' },
      { t: 1.7, text: '¡ADIÓS!', who: 'att' },
      { t: 2.28, rel: { dmg: 14, kb: 6, up: 0, rag: 1.8 }, fx: 'boom', at: 'ground', r: 3.4, big: 1, slow: .25 },
      { t: 2.3, fx: 'crack', at: 'ground' },
    ],
    shots: [[0, 'two'], [.45, 'lowA'], [1.0, 'up'], [1.5, 'orbit', { r: 5, spd: 2, h: 1 }], [2.0, 'top'], [2.3, 'ground'], [2.8, 'hero']],
  };
});

/* ===== personajes/rocket/Skills/Animation/Capullo Mortal/rkCocoon.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: rocket · habilidad: Capullo Mortal · id: rkCocoon
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Capullo Mortal: lo envuelve en seda, lo alza, lo hace girar sobre su cabeza y lo estrella contra el piso
CF.coreografia('rkCocoon', function () {
  return {
    dur: 3.4, catch: 2, attClip: 'cine_capullo', vicClip: 'cine_vic_capullo',
    att: [[.1, 'aCatch'], [3.2, 'ninja']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
    apos: [[0, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.5, 0], [.5, 0, 0, 1.5, 0], [.9, 0, .8, 1.5, .4], [1.4, 0, 3.4, 1.5, 2.4], [1.9, 0, 4.4, 1.5, 5.4], [2.1, 0, 4.2, 1.5, 6.3], [2.3, 0, .4, 1.7, 6.3, 'i']],
    ev: [
      { t: .1, text: '¡Quietito!', who: 'att' },
      { t: .45, cocoon: 1.9, fx: 'line', at: 'vic', sfx: 'zap' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: .75, fx: 'line', at: 'vic' },
      { t: 1.0, fx: 'ring', at: 'vic', r: 2, face: 1 },
      { t: 1.4, fx: 'charge', at: 'att' },
      { t: 1.9, text: '¡A dormir!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 2.28, rel: { dmg: 11, kb: 5, up: 0, rag: 1.8 }, fx: 'boom', at: 'ground', r: 3.4, big: 1, slow: .25 },
      { t: 2.3, fx: 'crack', at: 'ground' },
    ],
    shots: [[0, 'two', { fov: 50 }], [.5, 'lowA'], [1.2, 'up'], [1.8, 'orbit', { r: 5, spd: 2.4, h: 1 }], [2.15, 'top'], [2.3, 'ground'], [2.8, 'hero']],
  };
});

/* ===== personajes/ukyo/Skills/Animation/Corte Instantáneo/ukIai.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: ukyo · habilidad: Corte Instantáneo · id: ukIai
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Corte Instantáneo: la mano en la empuñadura, un destello, ya está detrás del rival envainando... y recién entonces los cortes lo alcanzan
CF.coreografia('ukIai', function () {
  return {
    dur: 3.0, catch: 2, attClip: 'cine_iai', vicClip: 'cine_vic_iai',
    att: [[.1, 'aCatch'], [2.8, 'idle']], vic: [[.1, 'vConfused'], [2.8, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.6, 0, 0, -.3, 0], [.78, 0, 0, -.3, 0], [.9, 0, 0, 3.6, 0, 'o'], [1.0, 0, 0, 3.6, 3.14], [3.0, 0, 0, 3.6, 3.14]],
    vpos: [[0, 0, 0, 1.8, 0], [1.9, 0, 0, 1.8, 0], [2.1, 0, 1.2, 2.2, 0], [2.4, 0, 3.0, 2.8, 0], [2.7, 0, 0, 3.0, 0, 'i'], [3.0, 0, 0, 3.0, 0]],
    ev: [
      { t: .2, fx: 'charge', at: 'att', text: '...', who: 'att' },
      { t: .6, fx: 'charge', at: 'att' },
      { t: .85, fx: 'ghost', sfx: 'dash', slow: .3 },
      { t: .9, fx: 'xcut', at: 'vic', imp: 1, sfx: 'slash' },
      { t: .95, fx: 'ring', at: 'vic', r: 2.5, face: 1 },
      { t: 1.9, sfx: 'draw', text: 'Ya estás cortado.', who: 'att' },
      { t: 2.0, hit: 3, fx: 'xcut', imp: 1, slow: .25 },
      { t: 2.1, rel: { dmg: 16, kb: 10, up: 8, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
      { t: 2.12, fx: 'flash', op: .5 },
    ],
    shots: [[0, 'two', { fov: 50 }], [.5, 'lowA'], [.85, 'wide'], [.95, 'ots', { s: -1, fov: 44 }], [1.4, 'faceA', { s: -1, fov: 36 }], [1.95, 'faceV', { fov: 36 }], [2.1, 'wide'], [2.6, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/sebolla/Skills/Animation/Dúo Dinámico/sebDuo.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: Dúo Dinámico · id: sebDuo
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebDuo', function () {
  return {
  dur: 4.2, catch: 2, dest: 1.5, attClip: 'cine_duo', vicClip: 'cine_vic_duo',
  att: [[.1, 'aCatch'], [4.0, 'idle']], vic: [[.1, 'vConfused'], [4.0, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.6, 0], [.5, 0, 0, 1.6, 0], [2.3, 0, 1.3, 1.7, 0], [2.8, 0, 2.2, 1.8, 0], [3.05, 0, .2, 1.8, 0, 'i'], [3.2, 0, 0, 1.8, 0]],
  ev: [
    { t: .35, text: '¡ORA ORA ORA ORA!', who: 'att' }, ...sebFlurry(.55, 2.23, .17, 1.3),
    { t: 2.4, vg: 'top', text: '¡Verity, remata!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
    { t: 2.9, vg: 'slam', text: '¡PUÑO GIGANTE!', who: 'att' },
    { t: 3.05, fx: 'crack', at: 'ground', r: 6.5 },
    { t: 3.08, rel: { dmg: 12, kb: 4, up: 6, rag: 2.2 }, fx: 'boom', at: 'vic', r: 5, big: 1, slow: .35 },
    { t: 3.1, fx: 'flash', op: .6 }, { t: 3.4, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'ots', { s: 1, fov: 42 }], [.85, 'faceV', { fov: 32 }], [1.2, 'otsV', { fov: 42 }], [1.55, 'lowA', { fov: 50 }], [1.9, 'ots', { s: -1, fov: 42 }], [2.4, 'top'], [2.9, 'ground'], [3.1, 'wide'], [3.7, 'hero', { s: -1 }]],
};
});

/* ===== personajes/sebolla/Skills/Animation/Maratón de Verity/sebMarathon.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: Maratón de Verity · id: sebMarathon
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebMarathon', function () {
  return {
  dur: 3.4, catch: 2, dest: 1, attClip: 'cine_maraton', vicClip: 'cine_vic_maraton',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0], [.35, 1.9, 0, 1.6, -1.57, 'o'], [.65, -1.9, 0, 1.6, 1.57, 'o'], [.95, 0, 0, 3.5, 3.14, 'o'], [1.25, 1.4, 0, 3.0, -2.36, 'o'], [1.55, -1.4, 0, .3, .82, 'o'], [1.85, 1.9, 0, 1.6, -1.57, 'o'], [2.15, -1.9, 0, 1.6, 1.57, 'o'], [2.5, 0, 0, 0, 0, 'o'], [2.9, 0, 0, .6, 0]],
  vpos: [[0, 0, 0, 1.6, 0]],
  ev: [
    { t: .2, text: '¡Demasiado lento!', who: 'att' },
    ...[.45, .75, 1.05, 1.35, 1.65, 1.95, 2.25].map((t, i) => ({ t, hit: 1.9, fx: i % 2 ? 'xcut' : 'impact', hs: .04, shake: .2, sfx: 'hit' })),
    ...[.35, .65, .95, 1.25, 1.55, 1.85, 2.15, 2.5].map(t => ({ t, fx: 'ghost', sfx: 'dash' })),
    { t: 2.55, text: '¡Y esto es por Verity!', who: 'att' },
    { t: 2.75, rel: { dmg: 10, kb: 12, up: 10, rag: 1.8 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.77, fx: 'flash', op: .5 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.35, 'orbit', { r: 5, spd: 1.2 }], [1.2, 'wide'], [1.6, 'orbit', { r: 4.5, spd: -1.4 }], [2.3, 'lowA'], [2.55, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});

/* ===== personajes/sebolla/Skills/Animation/Rayo a Quemarropa/sebPoint.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: Rayo a Quemarropa · id: sebPoint
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebPoint', function () {
  return {
  dur: 3.6, catch: 2, dest: 1.3, attClip: 'cine_punto', vicClip: 'cine_vic_punto',
  att: [[.1, 'aCatch'], [3.4, 'idle']], vic: [[.1, 'vConfused'], [3.4, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.3, 0], [2.2, 0, .3, 1.3, 0], [2.45, 0, 1.0, 3.7, 0, 'o'], [2.6, 0, 1.0, 3.7, 0]],
  ev: [
    { t: .2, text: '¡Ven acá!', who: 'att' }, { t: .3, vg: 'behind', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
    { t: .8, hit: 2.2, fx: 'impact', big: 1 }, { t: 1.1, hit: 2.2, fx: 'impact', big: 1 }, { t: 1.4, hit: 2.2, fx: 'impact', big: 1 },
    { t: 1.0, vg: 'stare', text: 'Ella lo sabe todo.', who: 'att' },
    { t: 1.5, fx: 'charge', at: 'vic' }, { t: 1.8, fx: 'charge', at: 'vic' }, { t: 2.0, fx: 'charge', at: 'vic' },
    { t: 2.2, text: '¡Verity, fuego!', who: 'att' },
    { t: 2.45, vg: 'fire', fx: 'impact', imp: 1 },
    { t: 2.55, rel: { dmg: 20, kb: 14, up: 10, rag: 2.2 }, fx: 'boom', at: 'vic', r: 3.4, big: 1, slow: .3 },
    { t: 2.57, fx: 'flash', op: .6 }, { t: 3.0, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'faceV', { fov: 34 }], [.8, 'ots', { s: 1, fov: 44 }], [1.5, 'faceA', { s: -1, fov: 36 }], [2.0, 'wide'], [2.4, 'otsV', { fov: 40 }], [2.6, 'wide'], [3.1, 'hero', { s: -1 }]],
};
});

/* ===== personajes/sebolla/Skills/Animation/_sin_habilidad/sebBrawl.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebBrawl
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebBrawl', function () {
  return {
  dur: 3.4, catch: 2, dest: .8, attClip: 'cine_paliza', vicClip: 'cine_vic_paliza',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [2.2, 0, 0, 1.5, 0], [2.32, 0, .9, 1.7, 0]],
  ev: [
    { t: .2, text: '¡Verity, mira esto!', who: 'att' }, ...sebFlurry(.45, 1.55, .22, 1.7),
    { t: 1.6, vg: 'left', text: '¡Ahora tú!', who: 'att' },
    { t: 1.9, vg: 'punch', hit: 3, fx: 'boom', at: 'vic', r: 2, shake: .4, hs: .08 },
    { t: 2.2, vg: 'leave', text: '¡Y arriba!', who: 'att' },
    { t: 2.35, rel: { dmg: 9, kb: 8, up: 14, rag: 1.6 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.37, fx: 'flash', op: .5 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.45, 'ots', { s: 1, fov: 44 }], [.9, 'faceV', { fov: 34 }], [1.3, 'lowA'], [1.6, 'wide'], [2.0, 'otsV', { fov: 44 }], [2.35, 'wide'], [2.8, 'hero', { s: -1 }]],
};
});

/* ===== personajes/sebolla/Skills/Animation/_sin_habilidad/sebHug.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebHug
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Abrazo de Verity: la presenta, aparece detrás del rival, lo mira fijo con su sonrisa enorme y lo lanza de un rayo
CF.coreografia('sebHug', function () {
  return {
    dur: 3.2, catch: 2, attClip: 'cine_abrazo', vicClip: 'cine_vic_abrazo',
    att: [[.1, 'aCatch'], [3.0, 'idle']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
    apos: [[0, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.7, 0], [1.9, 0, 0, 1.7, 0], [2.1, 0, .8, 1.9, 0], [2.4, 0, 3.0, 3.0, 0], [2.8, 0, 0, 3.4, 0, 'i'], [3.2, 0, 0, 3.4, 0]],
    ev: [
      { t: .2, text: '¿Conoces a Verity?', who: 'att' },
      { t: .5, vg: 'behind', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
      { t: .9, fx: 'charge', at: 'vic' },
      { t: 1.2, vg: 'stare', text: 'Ella lo sabe todo.', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 1.8, vg: 'fire', hit: 3, fx: 'impact', imp: 1 },
      { t: 2.1, rel: { dmg: 15, kb: 12, up: 8, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
      { t: 2.12, fx: 'flash', op: .5 },
      { t: 2.6, vg: 'leave' },
    ],
    shots: [[0, 'two', { fov: 50 }], [.45, 'lowA'], [.9, 'up', { fov: 54 }], [1.25, 'faceV', { fov: 34 }], [1.8, 'otsV', { fov: 44 }], [2.1, 'wide'], [2.7, 'hero', { s: -1 }]],
  };
});

/* ===== personajes/sebolla/Skills/Animation/_sin_habilidad/sebPinball.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebPinball
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebPinball', function () {
  return {
  dur: 3.4, catch: 2, dest: 1, attClip: 'cine_pelota', vicClip: 'cine_vic_pelota',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [.5, 0, 0, 1.5, 0], [.62, 0, 3.4, 1.8, 0, 'o'], [1.05, 0, 4.0, 2.0, 0], [1.32, 0, .2, 1.8, 0, 'i'], [1.65, 0, 2.4, 1.9, 0, 'o'], [1.95, 0, .4, 1.8, 0, 'i'], [2.1, 0, .9, 1.7, 0], [2.3, 0, 2.2, 2.3, 0], [2.45, 0, 2.2, 2.3, 0]],
  ev: [
    { t: .2, text: '¡Pelota!', who: 'att' },
    { t: .55, hit: 4, fx: 'impact', big: 1, sfx: 'heavy', hs: .08, shake: .35 },
    { t: 1.05, vg: 'top', text: '¡Remata, Verity!', who: 'att' },
    { t: 1.3, vg: 'punch', hit: 4, fx: 'boom', at: 'vic', r: 2.2, shake: .5, hs: .09 },
    { t: 1.34, fx: 'crack', at: 'ground', r: 3.6 },
    { t: 1.7, hit: 3, fx: 'impact', sfx: 'heavy' },
    { t: 1.8, vg: 'left' },
    { t: 2.0, vg: 'punch', hit: 3, fx: 'impact', big: 1 },
    { t: 2.28, hit: 3, fx: 'xcut', imp: 1 },
    { t: 2.45, rel: { dmg: 8, kb: 12, up: 10, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.47, fx: 'flash', op: .5 }, { t: 2.6, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'lowA', { fov: 52 }], [.8, 'top'], [1.25, 'ground'], [1.7, 'wide'], [2.0, 'ots', { s: -1, fov: 46 }], [2.3, 'faceV', { fov: 36 }], [2.5, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});

/* ===== personajes/sebolla/Skills/Animation/_sin_habilidad/sebSandwich.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebSandwich
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebSandwich', function () {
  return {
  dur: 3.2, catch: 2, dest: 1.1, attClip: 'cine_sandwich', vicClip: 'cine_vic_sandwich',
  att: [[.1, 'aCatch'], [3.0, 'idle']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [.45, 0, 0, 1.5, 0], [.62, 0, 0, 2.7, 0, 'o'], [.82, 0, 0, 2.7, 0], [.95, 0, 0, 1.5, 0, 'o'], [1.3, 0, 0, 1.5, 0], [1.47, 0, 0, 2.7, 0, 'o'], [1.67, 0, 0, 2.7, 0], [1.8, 0, 0, 1.5, 0, 'o'], [2.15, 0, 0, 1.5, 0], [2.35, 0, 0, 2.4, 0, 'o'], [2.5, 0, .6, 2.2, 0]],
  ev: [
    { t: .2, text: '¡Sándwich!', who: 'att' }, { t: .3, vg: 'behindV', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
    { t: .5, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: .85, vg: 'butt', hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 1.35, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 1.7, vg: 'butt', hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 2.2, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 2.4, text: '¡CLAP!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
    { t: 2.55, rel: { dmg: 11, kb: 6, up: 12, rag: 1.8 }, fx: 'boom', at: 'vic', r: 3.2, big: 1, slow: .3 },
    { t: 2.57, fx: 'flash', op: .55 }, { t: 2.7, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.3, 'wide'], [.5, 'ots', { s: 1, fov: 44 }], [1.0, 'otsV', { fov: 44 }], [1.4, 'ots', { s: -1, fov: 44 }], [1.85, 'lowA'], [2.3, 'faceV', { fov: 34 }], [2.55, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});

/* ===== personajes/randi/Skills/Animation/_sin_habilidad/randiDomain.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: randi · habilidad: (sin habilidad asignada) · id: randiDomain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('randiDomain', function () {
  return {
  dur: 7.0, catch: 2, attClip: 'cine_dominio', vicClip: 'cine_vic_dominio',
  att: [[.1, 'idle'], [6.8, 'idle']], vic: [[.1, 'vConfused'], [6.8, 'vConfused']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 3.2, 0]],
  ev: [
    { t: .05, text: 'Expansión de dominio…', who: 'att', fx: 'ring', at: 'att', r: 3 },
    { t: .2, dom: 'open' },
    { t: 1.7, text: '¿Dónde estoy…?', who: 'vic' },
    { t: 3.2, text: '¡Perú Eterno!', who: 'att', fx: 'ring', at: 'att', r: 3.5 },
    { t: 6.35, dom: 'close', fx: 'boom', at: 'att', r: 3, big: 1 },
    { t: 6.4, fx: 'flash', op: .6 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.9, 'lowA'], [1.9, 'faceV', { fov: 34 }], [3.0, 'up', { fov: 56 }], [4.2, 'wide'], [5.2, 'otsV', { fov: 44 }], [6.0, 'hero', { s: -1 }], [6.5, 'wide']],
};
});

  }
});
