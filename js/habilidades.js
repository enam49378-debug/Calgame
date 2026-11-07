// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano
// El código de cada habilidad vive en personajes/<id>/Skills/Code/<habilidad>/*.js y Skills/Ulti/Code/*.js
// game.js ejecuta esta función con todo lo suyo a mano (sin dejarlo accesible desde la consola).
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const CF = { mover: function (nombre, fn) { MOVES[nombre] = fn; }, habilidad: function (nombre, fab) { MOVES[nombre] = fab(); } };

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

/* ===== personajes/javi/Skills/Code/Parry del Dragón/javiParry.js ===== */
/* Habilidad: Parry del Dragón · personaje: javi · ranura: awk 1 · id: javiParry
   Pose de guardia diagonal a dos manos inspirada en el modelo de Blockbench, con movimiento vivo,
   respiración marcial, giro de entrada y destellos de energía mientras espera el golpe. */
CF.habilidad('javiParry', function () {
  // arx + sx = 0 apunta la lanza recto al frente (+Z); up > 0 la inclina hacia arriba (+Y)
  const U = (o, up = 0) => (o.sx = -(o.arx || 0) - up, o);

  // 1) Anticipación: recoge la lanza al costado derecho flexionando rodillas
  const WIND = U({
    ix: -.10, tx: -.08, ty: -.58, tz: -.06, hx: .06, hy: .52, by: -2.4, bz: -1.1,
    arx: -.42, arz: .48, ary: .22, sy: -.45, sz: -.20,
    alx: -.88, alz: .36, aly: -.18,
    llx: -.42, lrx: .46, llz: .14, lrz: -.14,
    tpx: -.6, tpz: -.8, arpx: -1.4, arpy: .4, arpz: -1.2, alpx: 1.1, alpz: .6,
    llpz: .8, lrpz: -.8, tscx: 1.04, tscy: .96
  }, .18);

  // 2) Latigazo diagonal: cruza la lanza frente al pecho con smear de velocidad
  const SNAP = U({
    ix: .18, tx: .16, ty: .36, tz: .05, hx: -.10, hy: -.32, by: -4.2, bz: .9,
    arx: -.96, arz: .12, ary: -.26, sy: 1.12, sz: .34, spx: 1.2, spy: .6, spz: 1.8,
    alx: -1.36, alz: -.48, aly: .38,
    llx: -.78, lrx: .66, llz: .18, lrz: -.18,
    tpx: .5, tpz: .9, arpx: -.9, arpy: -.5, arpz: 1.8, ars: 1.14,
    alpx: 1.2, alpy: -.2, alpz: 2.0, als: 1.08,
    llpx: .6, llpz: 1.8, lrpx: -.6, lrpz: -1.8, tscx: 1.08, tscy: .92
  }, .52);

  // 3) Pose principal de Parry (Blockbench mejorada): lanza cruzada en diagonal de abajo-derecha
  //    a arriba-izquierda (~24° arriba), mano derecha abajo, mano izquierda sujetando cerca del collar dorado,
  //    pierna izquierda adelantada y rodillas flexionadas con peso atlético.
  const GUARD = U({
    ix: .13, tx: .11, ty: .26, tz: .04, hx: -.08, hy: -.24, by: -3.3, bz: .5,
    arx: -.84, arz: .16, ary: -.20, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.66, lrx: .56, llz: .15, lrz: -.15,
    tpx: .3, tpz: .5, arpx: -.7, arpy: -.4, arpz: 1.4,
    alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .46);

  // 4) Oscilaciones vivas durante la ventana de parry (evita quedarse congelado)
  const COIL = U({
    ix: .16, tx: .14, ty: .32, tz: .06, hx: -.11, hy: -.30, by: -3.9, bz: .8,
    arx: -.90, arz: .14, ary: -.24, sy: 1.08, sz: .32, spx: 1.1, spy: .6, spz: 1.7,
    alx: -1.34, alz: -.45, aly: .36,
    llx: -.74, lrx: .62, llz: .17, lrz: -.17,
    tpx: .4, tpz: .7, arpx: -.8, arpy: -.5, arpz: 1.6,
    alpx: 1.0, alpy: -.2, alpz: 1.9,
    llpx: .6, llpz: 1.7, lrpx: -.6, lrpz: -1.7, tscx: 1.05, tscy: .95
  }, .52);

  const SWAY = U({
    ix: .10, tx: .08, ty: .18, tz: .02, hx: -.05, hy: -.16, by: -2.8, bz: .2,
    arx: -.78, arz: .18, ary: -.16, sy: .98, sz: .24, spx: .9, spy: .4, spz: 1.3,
    alx: -1.22, alz: -.38, aly: .30,
    llx: -.58, lrx: .50, llz: .14, lrz: -.14,
    tpx: .1, tpz: .3, arpx: -.6, arpy: -.3, arpz: 1.2,
    alpx: .8, alpy: 0, alpz: 1.5,
    llpx: .4, llpz: 1.3, lrpx: -.4, lrpz: -1.3, tscx: .99, tscy: 1.02
  }, .40);

  const SINK = U({
    ix: .17, tx: .15, ty: .30, tz: .05, hx: -.10, hy: -.28, by: -4.1, bz: .7,
    arx: -.88, arz: .15, ary: -.22, sy: 1.06, sz: .30, spx: 1.1, spy: .5, spz: 1.6,
    alx: -1.32, alz: -.44, aly: .35,
    llx: -.72, lrx: .60, llz: .16, lrz: -.16,
    tpx: .4, tpz: .6, arpx: -.8, arpy: -.4, arpz: 1.5,
    alpx: 1.0, alpy: -.1, alpz: 1.8,
    llpx: .5, llpz: 1.6, lrpx: -.5, lrpz: -1.6, tscx: 1.06, tscy: .94
  }, .50);

  // 5) Salida suave si nadie golpea
  const OPEN = U({
    ix: .05, tx: .06, ty: -.18, hx: -.02, hy: .16, by: -1.6, bz: 0,
    arx: -.62, arz: .28, ary: -.10, sy: .25, sz: 0,
    alx: -.75, alz: .22, aly: .12,
    llx: -.36, lrx: .32, llz: .10, lrz: -.10
  }, .22);

  return function (f) {
    prepWeapon(f);
    sfx('draw', f.pos);
    startTwirl(f, 2, .22);
    f.counter = 1.55;
    const sparkTip = () => {
      if (!f.spear || !f.spearOut) return;
      const tip = anchorPoint(f, 'tip'), mid = f.spear.localToWorld(new V3(0, 0, 12 * PX));
      burst(tip, 5, '#4fc3f7', 2.8, .09, .26, -.2);
      burst(mid, 3, '#ffd54f', 2.0, .07, .22, -.15);
    };
    startAction(f, {
      name: 'javiParry', dur: 1.8, speedMul: .22, eyes: true, counter: true, noControl: true,
      // La mano izquierda agarra el asta justo detrás del collar dorado (z=11) como en Blockbench
      grips: [{ arm: 'armL', z: 11, t0: .16 }],
      anim: [
        [0, WIND, 1100],
        [.13, SNAP, 1400],
        [.24, GUARD, 950],
        [.52, COIL, 520],
        [.82, SWAY, 520],
        [1.12, SINK, 520],
        [1.40, GUARD, 560],
        [1.58, OPEN, 650],
      ],
      steps: [
        {
          at: .13, fn: () => {
            arcSlash(f, '#4fc3f7', { tilt: .42, r: 1.85, len: 2.7, dir: 1, w: .62, dur: .22 });
            ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#4fc3f7', 2.4, .28);
            burst(front(f, 1.0, 1.25), 12, '#ffd54f', 4.5, .11, .32, 0);
            sfx('swing', f.pos, .75);
          }
        },
        { at: .35, fn: sparkTip },
        { at: .68, fn: sparkTip },
        { at: 1.02, fn: sparkTip },
        { at: 1.32, fn: sparkTip },
      ],
      onCounter: (f, att) => {
        const clash = front(f, 1.05, 1.28);
        impactFrame(.08);
        G.shake = Math.max(G.shake, .65);
        sphereFlash(clash, '#ffffff', 1.7, .18);
        impactStar(clash, '#ffd54f', 2.5, .24);
        ringAt(clash, '#4fc3f7', 3.2, .28, 'face', f.yaw);
        ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd54f', 3.4, .32);
        burst(clash, 24, '#ffd54f', 9, .15, .38, .1);
        burst(clash, 18, '#4fc3f7', 8, .14, .36, 0);
        sfx('block', clash, 1.0);
        sfx('counter', f.pos);
        popText(chestOf(f), '¡PARRY DEL DRAGÓN!', '#4fc3f7', 24);
        if (!att.alive || att.cineLock || att.grabbed) return counterHit(f, att);
        f.yaw = yawTo(f, att); f.iframes = Math.max(f.iframes, 2.5);
        runChore(f, att, CHORE.javiParry);   // arranca el duelo (coreografía javiParry)
      },
    });
  };
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

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/cosmos-sonido.js ===== */
/* Sonidos de "Ojo del Cosmos" (personaje: redbird), generados con el motor de audio del juego (no hacen falta archivos).
   Capas realistas: reverb de sala grande (respuesta de impulso generada), estéreo, graves profundos, ruido filtrado con variación,
   coro vocal (formantes) y texturas que cambian con el tiempo para que no suenen planos ni repetidos.
   Uso desde rbCosmos.js:  rbCosmosSnd.thud(); rbCosmosSnd.riser(1.4); const h = rbCosmosSnd.hum('sawtooth', 90, .5); h.set(1, 120); ... rbCosmosSnd.stopAll();
   Si quieres sonidos grabados, ponlos en Skills/Sound/Ojo del Cosmos/ (lanzar_1.mp3, voz_1.mp3...): el juego los reproduce solo. */
const rbCosmosSnd = (function () {
  const ok = () => !!AC && AC.state === 'running' && AUDIO_LEVELS.general > 0 && AUDIO_LEVELS.game > 0;
  const live = new Set(); let rev = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // ---- reverb de sala grande: ruido que se apaga y se oscurece con el tiempo
  const reverb = () => {
    if (rev || !ok()) return rev;
    const len = Math.floor(AC.sampleRate * 3.6), ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += ((Math.random() * 2 - 1) - lp) * (.4 - .32 * k); d[i] = lp * Math.pow(1 - k, 2.5) * (i < 1200 ? i / 1200 : 1); } }
    const conv = AC.createConvolver(); conv.buffer = ir;
    const inG = AC.createGain(), outG = AC.createGain(); outG.gain.value = .9; inG.connect(conv); conv.connect(outG); connectSpatial(outG, 'game', null);
    rev = { in: inG, nodes: [inG, conv, outG] }; return rev;
  };
  // ---- salida: panorama estéreo + envío a la reverb
  const route = (node, pan, wet) => {
    let n = node; const extra = [];
    if (pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; node.connect(p); n = p; extra.push(p); }
    connectSpatial(n, 'game', null);
    if (wet > 0) { const r = reverb(); if (r) { const s = AC.createGain(); s.gain.value = wet; n.connect(s); s.connect(r.in); extra.push(s); } }
    return extra;
  };
  const cleanOnEnd = (src, nodes) => src.addEventListener('ended', () => { for (const n of nodes) { try { n.disconnect(); } catch (e) { } } }, { once: true });
  const env = (g, t, dur, vol, att) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + att); g.gain.exponentialRampToValueAtTime(.0002, t + dur); };

  // ---- sonidos cortos
  const toneShot = (t, dur, o) => {
    const osc = AC.createOscillator(), g = AC.createGain(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t); if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + dur);
    env(g, t, dur, o.vol, o.att || .004); osc.connect(g); const ex = route(g, o.pan || 0, o.wet || 0);
    osc.start(t); osc.stop(t + dur + .05); cleanOnEnd(osc, [osc, g, ...ex]);
  };
  const noiseShot = (t, dur, o) => {
    if (!NB) return; const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = NB; fl.type = o.type || 'lowpass'; fl.Q.value = o.q || .8; fl.frequency.setValueAtTime(o.f0, t); if (o.f1) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    env(g, t, dur, o.vol, o.att || .006); s.connect(fl); fl.connect(g); const ex = route(g, o.pan || 0, o.wet || 0);
    s.start(t, rnd(0, .5)); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, ...ex]);
  };

  // ---- sonidos continuos (se controlan con .set(volumen, frecuencia))
  const loopNoise = (type, freq, q, vol) => {
    if (!ok() || !NB) return null;
    const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    s.buffer = NB; s.loop = true; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; g.gain.value = 0;
    lfo.frequency.value = rnd(.09, .2); lg.gain.value = vol * .3; lfo.connect(lg); lg.connect(g.gain);   // el volumen respira lentamente
    s.connect(fl); fl.connect(g); route(g, 0, .25); s.start(); lfo.start(); live.add(s); live.add(lfo);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) fl.frequency.setTargetAtTime(fr, t, dt); } };
  };
  const hum = (type, f0, vol) => {
    if (!ok()) return null;
    const g = AC.createGain(), fl = AC.createBiquadFilter(), oscs = []; g.gain.value = 0; fl.type = 'lowpass'; fl.Q.value = .7; fl.frequency.value = type === 'sine' ? 520 : type === 'sawtooth' ? 1500 : 3600; fl.connect(g);
    const add = (ty, ratio, det, lv) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = ty; o.frequency.value = f0 * ratio; o.detune.value = det; og.gain.value = lv; o.connect(og); og.connect(fl); o.start(); live.add(o); oscs.push([o, ratio]); };
    if (type === 'sine') { add('sine', 1, 0, .5); add('sine', 2.005, 4, .22); add('sawtooth', 1.5, -5, .08); add('sine', .5, 0, .35); }   // zumbido grave de tensión
    else if (type === 'sawtooth') { add('sawtooth', 1, 0, .34); add('sawtooth', 1, 9, .3); add('sawtooth', .5, -5, .36); add('sine', 2, 0, .2); }   // cuerpo del rayo
    else { add('sine', 1, 0, .3); add('sine', 2.01, 5, .2); add('triangle', .5, 0, .2); }   // brillo del rayo
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = type === 'sine' ? .2 : 5.5; lg.gain.value = type === 'sine' ? 6 : 14; lfo.connect(lg); oscs.forEach(([o]) => lg.connect(o.detune)); lfo.start(); live.add(lfo);
    route(g, 0, type === 'sine' ? .35 : .22);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) oscs.forEach(([o, r]) => o.frequency.setTargetAtTime(fr * r, t, dt)); } };
  };

  const api = {
    hum, loopNoise,
    stopAll() { for (const n of live) { try { n.stop(); } catch (e) { } } live.clear(); if (rev) { const r = rev; rev = null; setTimeout(() => { for (const n of r.nodes) { try { n.disconnect(); } catch (e) { } } }, 4200); } },
    step() {   // paso sobre el pavimento: golpe grave, roce y variación de un paso a otro
      if (!ok()) return; const t = AC.currentTime, side = Math.random() < .5 ? -.18 : .18;
      toneShot(t, .15, { type: 'sine', f0: rnd(95, 125), f1: 50, vol: rnd(.22, .32), pan: side, wet: .12 });
      noiseShot(t, .09, { type: 'lowpass', f0: 420, f1: 180, vol: rnd(.2, .3), pan: side, wet: .1 });
      noiseShot(t + .012, .07, { type: 'bandpass', f0: rnd(1100, 1900), q: 1.2, vol: .08, pan: side });
    },
    heart() {   // latido profundo (lub-dub) con eco
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, .22, { type: 'sine', f0: 72, f1: 40, vol: .62, wet: .3 }); noiseShot(t, .12, { type: 'lowpass', f0: 180, vol: .25, wet: .2 });
      toneShot(t + .21, .16, { type: 'sine', f0: 64, f1: 38, vol: .42, wet: .3 });
    },
    thud() {   // caída de rodillas: golpe, roce de ropa y polvo
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, .65, { type: 'sine', f0: 92, f1: 28, vol: .9, wet: .35 }); toneShot(t, .3, { type: 'triangle', f0: 170, f1: 60, vol: .35, wet: .2 });
      noiseShot(t, .4, { type: 'lowpass', f0: 650, f1: 160, vol: .7, wet: .25 }); noiseShot(t + .04, .7, { type: 'highpass', f0: 2800, vol: .1, wet: .4 }); noiseShot(t + .08, .5, { type: 'bandpass', f0: 1500, q: .7, vol: .12, wet: .3 });
    },
    crackle() {   // chasquido de roca o cristal que se rompe
      if (!ok()) return; const t = AC.currentTime, pan = rnd(-.7, .7);
      toneShot(t, .05, { type: 'triangle', f0: rnd(1500, 3800), f1: 500, vol: rnd(.06, .14), pan, wet: .3 });
      noiseShot(t, .035, { type: 'highpass', f0: 3000, vol: .12, pan, wet: .2 });
      if (Math.random() < .35) toneShot(t + .03, .12, { type: 'sine', f0: rnd(110, 220), f1: 60, vol: .12, pan, wet: .4 });
    },
    chirp() {   // pájaro lejano: dos o tres sílabas que suben de tono, con eco
      if (!ok()) return; const t = AC.currentTime, f = rnd(2200, 3600), pan = rnd(-.8, .8), n = 2 + Math.floor(rnd(0, 2));
      for (let i = 0; i < n; i++) toneShot(t + i * rnd(.08, .11), .075, { type: 'sine', f0: f * (1 + i * .08), f1: f * (1.3 + i * .1), vol: rnd(.04, .08), pan, wet: .35 });
    },
    riser(dur, f0 = 160, f1 = 2400, vol = .5) {   // energía que se acumula: ruido que sube, dos sierras desafinadas y armónicos
      if (!ok()) return; const t = AC.currentTime;
      noiseShot(t, dur + .1, { type: 'bandpass', f0: 300, f1: 6500, q: 1.1, vol: vol * .55, att: dur * .85, wet: .3 });
      for (const det of [-7, 8]) {
        const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.detune.value = det;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.type = 'lowpass'; fl.frequency.setValueAtTime(380, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur);
        env(g, t, dur + .1, vol * .45, dur * .9); o.connect(fl); fl.connect(g); const ex = route(g, det < 0 ? -.3 : .3, .35); o.start(t); o.stop(t + dur + .15); cleanOnEnd(o, [o, fl, g, ...ex]);
      }
      for (const m of [2, 3, 4]) toneShot(t, dur + .08, { type: 'sine', f0: f0 * m, f1: f1 * m * .9, vol: vol * .1 / m * 2, att: dur * .9, wet: .4 });
    },
    whoosh(dur, f0, f1, vol = .5) {   // ráfaga de viento que pasa de un lado al otro
      if (!ok() || !NB) return; const t = AC.currentTime, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
      s.buffer = NB; s.loop = true; fl.type = 'bandpass'; fl.Q.value = .9; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .45); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(fl); fl.connect(g); let n = g; if (p) { p.pan.setValueAtTime(-.6, t); p.pan.linearRampToValueAtTime(.6, t + dur); g.connect(p); n = p; }
      connectSpatial(n, 'game', null); const r = reverb(); if (r) { const w = AC.createGain(); w.gain.value = .3; n.connect(w); w.connect(r.in); }
      s.start(t); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, p]);
      noiseShot(t, dur, { type: 'lowpass', f0: Math.min(f0, f1) * .5 + 80, f1: Math.max(f0, f1) * .3 + 80, vol: vol * .5, att: dur * .4 });
    },
    boom(vol = 1) {   // explosión grande: golpe grave, cuerpo, ruido que se apaga, restallido y eco
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, 1.8, { type: 'sine', f0: 78, f1: 22, vol, wet: .4 }); toneShot(t, .9, { type: 'triangle', f0: 150, f1: 42, vol: vol * .5, wet: .3 });
      noiseShot(t, 1.9, { type: 'lowpass', f0: 650, f1: 110, vol: vol * .9, wet: .45 }); noiseShot(t, .4, { type: 'highpass', f0: 4200, vol: vol * .35, wet: .3 });
      noiseShot(t + .12, 2, { type: 'bandpass', f0: 900, f1: 220, q: .6, vol: vol * .3, wet: .5 }); toneShot(t + .45, 1, { type: 'sine', f0: 62, f1: 26, vol: vol * .3, wet: .5 });
    },
    sting(vol = .8) {   // golpe orquestal grave (braam) con cola
      if (!ok()) return; const t = AC.currentTime;
      for (const [f, det] of [[55, -8], [55, 9], [82.4, 0], [110, -4]]) {
        const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; fl.type = 'lowpass'; fl.Q.value = 1.2;
        fl.frequency.setValueAtTime(260, t); fl.frequency.exponentialRampToValueAtTime(1700, t + .35); fl.frequency.exponentialRampToValueAtTime(220, t + 1.6);
        env(g, t, 1.7, vol * .22, .05); o.connect(fl); fl.connect(g); const ex = route(g, det * .03, .45); o.start(t); o.stop(t + 1.75); cleanOnEnd(o, [o, fl, g, ...ex]);
      }
      toneShot(t, .8, { type: 'sine', f0: 100, f1: 36, vol: vol * .6, wet: .3 }); noiseShot(t, .5, { type: 'bandpass', f0: 1600, f1: 500, vol: vol * .3, wet: .4 });
    },
    choir(notes, dur, vol = .5) {   // coro de voces "ahh" (sierras desafinadas por filtros de vocal) que sube y se apaga
      if (!ok()) return; const t = AC.currentTime;
      notes.forEach((f, i) => {
        const g = AC.createGain(), mix = AC.createGain(), pan = (i - (notes.length - 1) / 2) * .35; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol / notes.length, t + dur * .55); g.gain.exponentialRampToValueAtTime(.0002, t + dur);
        const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = rnd(4.6, 5.6); vg.gain.value = 9; vib.connect(vg);
        for (const det of [-9, 0, 9]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; vg.connect(o.detune); o.connect(mix); o.start(t); o.stop(t + dur + .1); }
        for (const [ff, q, lv] of [[720, 4, .55], [1150, 6, .42], [2650, 9, .12]]) { const b = AC.createBiquadFilter(), bg = AC.createGain(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; bg.gain.value = lv; mix.connect(b); b.connect(bg); bg.connect(g); }
        vib.start(t); vib.stop(t + dur + .1); route(g, pan, .6);
      });
    },
    planetBoom() {   // la Tierra se rompe: silencio breve, golpe enorme, rugido que se apaga, escombros y zumbido de oídos
      if (!ok()) return; const t = AC.currentTime;
      api.boom(1.35); api.sting(.9);
      noiseShot(t, 3.4, { type: 'lowpass', f0: 1900, f1: 80, vol: .8, att: .08, wet: .55 });
      toneShot(t, 3.2, { type: 'sine', f0: 56, f1: 18, vol: .8, wet: .5 });
      for (let i = 0; i < 16; i++) { const d = rnd(.2, 2.8), pan = rnd(-.8, .8); toneShot(t + d, .22, { type: 'triangle', f0: rnd(350, 1800), f1: rnd(120, 400), vol: rnd(.05, .12), pan, wet: .4 }); noiseShot(t + d, .12, { type: 'bandpass', f0: rnd(900, 3200), q: 2, vol: .1, pan, wet: .3 }); }
      toneShot(t + .6, 3.4, { type: 'sine', f0: 3100, f1: 3000, vol: .035, att: 1.2, wet: .5 });
    },
    jet() {   // avión a reacción que cruza de un lado al otro (efecto Doppler)
      if (!ok() || !NB) return; const t = AC.currentTime, dur = 2.4;
      const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
      s.buffer = NB; s.loop = true; fl.type = 'bandpass'; fl.Q.value = .9; fl.frequency.setValueAtTime(1400, t); fl.frequency.exponentialRampToValueAtTime(2600, t + dur * .45); fl.frequency.exponentialRampToValueAtTime(520, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.8, t + dur * .45); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(fl); fl.connect(g); let n = g; if (p) { p.pan.setValueAtTime(-.85, t); p.pan.linearRampToValueAtTime(.85, t + dur); g.connect(p); n = p; }
      connectSpatial(n, 'game', null); const r = reverb(); if (r) { const w = AC.createGain(); w.gain.value = .25; n.connect(w); w.connect(r.in); }
      s.start(t); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, p]);
      toneShot(t, dur, { type: 'sawtooth', f0: 120, f1: 70, vol: .12, att: dur * .4, wet: .2 });
      toneShot(t, dur, { type: 'sine', f0: 1500, f1: 850, vol: .05, att: dur * .4, wet: .3 });
    },
    ufo() {   // platillo: trino que sube y baja
      if (!ok()) return; const t = AC.currentTime;
      for (let i = 0; i < 6; i++) toneShot(t + i * .18, .22, { type: 'sine', f0: 380 + (i % 2) * 220, f1: 640 + (i % 3) * 120, vol: .09, pan: rnd(-.4, .4), wet: .45 });
    },
    reentry(dur = 1.4) {   // entrada en la atmósfera: rugido que sube de tono con chispazos
      if (!ok()) return; const t = AC.currentTime;
      noiseShot(t, dur, { type: 'bandpass', f0: 180, f1: 2600, q: .8, vol: .7, att: dur * .6, wet: .25 }); noiseShot(t, dur, { type: 'lowpass', f0: 140, f1: 320, vol: .6, att: dur * .4 });
      for (let i = 0; i < 18; i++) { const d = rnd(0, dur), pan = rnd(-.6, .6); toneShot(t + d, .05, { type: 'triangle', f0: rnd(1800, 4200), f1: 800, vol: .07, pan }); }
    },
  };
  return api;
})();

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/descenso-cosmos.js ===== */
/* Descenso de "Ojo del Cosmos" (personaje: redbird): al entrar en la atmósfera la cámara baja a toda velocidad
   atravesando nubes y pájaros hasta llegar a Redbird. Esto crea esas nubes y pájaros en el mundo real, y los visitantes
   que cruzan de repente: un avión a reacción, Sekza volando o (muy rara vez) un platillo.
   Uso desde rbCosmos.js:  const D = rbCosmosDescenso(posRedbird);  D.update(dt);  D.spawn('jet'|'sekza'|'ufo', camPos, mirarA, lado);  D.dispose(); */
const rbCosmosDescenso = function (P) {
  const g = new THREE.Group(), mats = [], geos = [], texs = [];
  const M = (o) => { const m = new THREE.MeshLambertMaterial(o); mats.push(m); return m; };
  const B = (w, h, d, mat) => { const ge = new THREE.BoxGeometry(w, h, d); geos.push(ge); return new THREE.Mesh(ge, mat); };
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

  // ---- visitantes que cruzan (cada uno apunta hacia donde va con +Z)
  const guests = [];
  const dot = (col, sc) => { const m = new THREE.SpriteMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); mats.push(m); const sp = new THREE.Sprite(m); sp.scale.setScalar(sc); return sp; };
  const makeJet = () => {
    const j = new THREE.Group(), white = M({ color: 0xe9edf2 }), gray = M({ color: 0x8a93a0 }), red = M({ color: 0xc0262d });
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(.85, .6, 10, 12), white); geos.push(fus.geometry); fus.rotation.x = Math.PI / 2; j.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.6, 12), gray); geos.push(nose.geometry); nose.rotation.x = Math.PI / 2; nose.position.z = 6.3; j.add(nose);
    for (const sd of [-1, 1]) {
      const w = B(6.4, .2, 3, white); w.position.set(sd * 3.6, -.2, .4); w.rotation.y = sd * -.35; j.add(w);
      const st = B(2.6, .15, 1.4, white); st.position.set(sd * 1.7, 0, -4.4); j.add(st);
      const en = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 2.2, 10), gray); geos.push(en.geometry); en.rotation.x = Math.PI / 2; en.position.set(sd * 2.4, -.8, .2); j.add(en);
      const nl = dot(sd < 0 ? 0xff3030 : 0x30ff60, 2.4); nl.position.set(sd * 6.6, -.2, -.6); j.add(nl);
    }
    const fin = B(.2, 2.6, 2, red); fin.position.set(0, 1.7, -4.4); j.add(fin);
    const stripe = B(1.75, .35, 8.4, red); stripe.position.set(0, .1, -.4); j.add(stripe);
    const strobe = dot(0xffffff, 3.2); strobe.position.set(0, 1, -4.8); j.add(strobe); j.userData.strobe = strobe;
    j.scale.setScalar(1.5); return j;
  };
  const makeSekza = () => {
    const s = new THREE.Group(), skin = M({ color: 0xfcd39d }), hair = M({ color: 0x111010 }), shirt = M({ color: 0x6d2225 }), pants = M({ color: 0x3d6676 });
    const torso = B(.8, .4, 1.2, shirt); s.add(torso);
    const head = B(.6, .6, .6, skin); head.position.set(0, 0, 1.05); s.add(head);
    const hr = B(.64, .2, .64, hair); hr.position.set(0, .26, 1.05); s.add(hr);
    for (const sd of [-1, 1]) { const arm = B(.28, .28, 1.1, skin); arm.position.set(sd * .55, 0, .95); s.add(arm); const leg = B(.3, .3, 1.15, pants); leg.position.set(sd * .22, 0, -1.15); s.add(leg); }
    const wingM = new THREE.MeshBasicMaterial({ color: 0xffb020, side: THREE.DoubleSide }); mats.push(wingM); const wingG2 = new THREE.PlaneGeometry(3.2, 1.2); geos.push(wingG2);
    const wings = [];
    for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sd * .35, .1, -.1); const w = new THREE.Mesh(wingG2, wingM); w.rotation.x = Math.PI / 2; w.position.x = sd * 1.6; piv.add(w); s.add(piv); wings.push([piv, sd]); }
    s.userData.wings = wings; s.scale.setScalar(4.6); return s;
  };
  const makeUfo = () => {
    const u = new THREE.Group(), met = M({ color: 0x9aa4b2 }), dome = M({ color: 0x8fe8ff, emissive: 0x1a6070 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.2, .9, 24), met); geos.push(disc.geometry); u.add(disc);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 10, 0, TAU, 0, Math.PI / 2), dome); geos.push(top.geometry); top.position.y = .45; u.add(top);
    const lights = []; for (let i = 0; i < 8; i++) { const l = dot([0xff4040, 0x40ff80, 0x4080ff, 0xffe040][i % 4], 2); const a = i / 8 * TAU; l.position.set(Math.cos(a) * 4.6, -.1, Math.sin(a) * 4.6); u.add(l); lights.push(l); }
    u.userData.lights = lights; u.scale.setScalar(1.3); return u;
  };
  scene.add(g);
  let T = 0;
  return {
    update(dt) {
      T += dt;
      for (const b of birds) { const u = b.userData; b.position.addScaledVector(u.v, dt); const f = Math.sin(T * 18 + u.ph) * .7; u.l.rotation.z = f; u.r.rotation.z = -f; }
      for (let i = guests.length - 1; i >= 0; i--) {
        const q = guests[i], o = q.obj; q.life -= dt; o.position.addScaledVector(q.vel, dt);
        if (q.kind === 'jet') { o.userData.strobe.material.opacity = Math.sin(T * 14) > .6 ? 1 : .1; const back = o.position.clone().addScaledVector(q.vel.clone().normalize(), -9); emit(back.x, back.y, back.z, rand(-1, 1), rand(-.5, .5), rand(-1, 1), '#ffffff', .6, .9, 0, 1); }
        else if (q.kind === 'sekza') { const f = Math.sin(T * 16) * .8; for (const [piv, sd] of o.userData.wings) piv.rotation.z = sd * f; o.position.y += Math.sin(T * 6) * .02; const back = o.position.clone().addScaledVector(q.vel.clone().normalize(), -3); emit(back.x, back.y, back.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), '#ffd27a', .3, .5, 0, 1); }
        else { o.rotation.y += dt * 2; o.userData.lights.forEach((l, k) => { l.material.opacity = Math.sin(T * 9 + k) > 0 ? 1 : .15; }); o.position.y += Math.sin(T * 5) * .05; }
        if (q.life <= 0) { g.remove(o); guests.splice(i, 1); }
      }
    },
    // tipo: 'jet' | 'sekza' | 'ufo'; cam = posición de la cámara, mirar = hacia dónde mira, lado = +1/-1 (de dónde entra)
    spawn(kind, cam, mirar, lado) {
      const o = kind === 'jet' ? makeJet() : kind === 'sekza' ? makeSekza() : makeUfo(), fw = mirar.clone().sub(cam).normalize(), rt = new V3().crossVectors(fw, new V3(0, 1, 0)).normalize();
      const speed = kind === 'jet' ? 150 : kind === 'sekza' ? 52 : 70, dist = kind === 'jet' ? 52 : kind === 'sekza' ? 27 : 46;
      o.position.copy(cam).addScaledVector(fw, dist).addScaledVector(rt, -lado * (kind === 'sekza' ? 52 : 62)).add(new V3(0, rand(-4, 9), 0));
      const vel = rt.clone().multiplyScalar(lado * speed); if (kind !== 'ufo') o.quaternion.setFromUnitVectors(new V3(0, 0, 1), vel.clone().normalize());
      if (kind === 'sekza') o.rotation.x += 0;
      g.add(o); guests.push({ obj: o, kind, vel, life: (kind === 'sekza' ? 52 : 62) * 2 / speed + .4 });
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
  for (let i = 0; i < 5200; i++) {   // relieve: manchas finas de vegetación y tierra
    const b = blobs[Math.floor(rand(0, blobs.length))], p = b.parts[Math.floor(rand(0, b.parts.length))], x = p[0] + rand(-p[2], p[2]), y = p[1] + rand(-p[2], p[2]);
    c.fillStyle = 'rgba(' + (30 + Math.floor(rand(0, 60))) + ',' + (70 + Math.floor(rand(0, 80))) + ',' + (30 + Math.floor(rand(0, 40))) + ',.22)'; c.fillRect(x, y, rand(1, 3), rand(1, 3));
  }
  const earthTex = new THREE.CanvasTexture(cv); texs.push(earthTex);
  const cvL = document.createElement('canvas'); cvL.width = 1024; cvL.height = 512; const cl = cvL.getContext('2d'); cl.fillStyle = '#000'; cl.fillRect(0, 0, 1024, 512);
  for (const b of blobs) for (const p of b.parts) for (let i = 0; i < 16; i++) { cl.fillStyle = 'rgba(255,' + Math.floor(170 + rand(0, 60)) + ',' + Math.floor(90 + rand(0, 50)) + ',' + rand(.5, 1) + ')'; cl.fillRect(p[0] + rand(-p[2], p[2]) * .8, p[1] + rand(-p[2], p[2]) * .6, 1.6, 1.6); }
  const lightsTex = new THREE.CanvasTexture(cvL); texs.push(lightsTex);
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
    uniforms: { map: { value: earthTex }, lights: { value: lightsTex }, L: { value: sunDir.clone() }, emi: { value: 0 }, time: { value: 0 } }, vertexShader: VERT,
    fragmentShader: `uniform sampler2D map, lights; uniform vec3 L; uniform float emi, time; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW), base = texture2D(map, vUv).rgb;
        float d = dot(N, normalize(L));
        float band = smoothstep(-.06, .06, d) * .5 + smoothstep(.22, .34, d) * .5;
        vec3 col = mix(base * vec3(.10, .15, .34), base * .92, band);
        col += vec3(1., .55, .25) * smoothstep(-.12, 0., d) * (1. - smoothstep(0., .16, d)) * .28;
        float ocean = step(.2, base.b - base.r) * step(base.g, base.b + .05);
        vec3 H = normalize(normalize(L) + V); float spec = pow(max(dot(N, H), 0.), 120.) * (.55 + .45 * sin(vUv.x * 620. + time * 2.1) * sin(vUv.y * 380. - time * 1.7));
        col += vec3(1.) * step(.55, spec) * ocean * .65;
        float rim = pow(1. - max(dot(N, V), 0.), 3.);
        col += vec3(.35, .7, 1.) * rim * .6 * clamp(d * 2. + .5, 0., 1.);
        col += texture2D(lights, vUv).rgb * (1. - smoothstep(-.14, .06, d)) * 1.25;
        col += vec3(1., .3, .06) * emi;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const cloudMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: cloudTex }, L: { value: sunDir.clone() }, off: { value: 0 }, mul: { value: 1 } }, vertexShader: VERT, transparent: true, depthWrite: false,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; uniform float off, mul; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec4 t = texture2D(map, vUv + vec2(off, 0.)); vec3 N = normalize(vN); float d = dot(N, normalize(L));
        float band = smoothstep(-.05, .1, d) * .6 + smoothstep(.25, .4, d) * .4;
        vec3 col = mix(t.rgb * vec3(.18, .22, .4), t.rgb, band);
        gl_FragColor = vec4(col, t.a * .78 * mul);
      }`,
  }));
  const cloudMat2 = track(cloudMat.clone()); cloudMat2.uniforms = { map: { value: cloudTex }, L: { value: sunDir.clone() }, off: { value: .37 }, mul: { value: .5 } };
  const earth = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48)), earthMat);
  const clouds = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48)), cloudMat);
  // versiones con el casquete roto (falta un trozo de planeta donde sale el rayo)
  const earthB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48, 0, TAU, CAP, Math.PI - CAP)), earthMat);
  const cloudsB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat);
  const clouds2 = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.03, 72, 48)), cloudMat2);
  const clouds2B = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.03, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat2);
  earthB.visible = cloudsB.visible = clouds2B.visible = false;
  // contorno oscuro (estilo anime) y atmósfera brillante en el borde
  const outline = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.02, 56, 36)), track(new THREE.MeshBasicMaterial({ color: 0x07163a, side: THREE.BackSide, fog: false })));
  const atmoMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float rim = pow(1. - abs(dot(N, V)), 3.2), sun = clamp(dot(N, normalize(L)) * .8 + .5, 0., 1.);
        vec3 col = mix(vec3(.18, .45, 1.), vec3(.65, .92, 1.), rim) * rim * 1.7 * (.3 + .7 * sun);
        float term = clamp(1. - abs(dot(N, normalize(L))) * 3.2, 0., 1.); col = mix(col, vec3(1., .5, .22) * rim * 1.5, term * .6);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const halo = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.12, 56, 36)), atmoMat);
  // magma que se ve por el agujero, y borde incandescente
  const magma = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * .96, 40, 28)), track(new THREE.MeshBasicMaterial({ color: 0xff4a12, fog: false })));
  const rimR = R * Math.sin(CAP), rim = new THREE.Mesh(trackG(new THREE.TorusGeometry(rimR, 1.1, 8, 64)), track(new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  rim.rotation.x = Math.PI / 2; rim.position.y = R * Math.cos(CAP); rim.visible = false;
  pivot.add(earth, clouds, clouds2, earthB, cloudsB, clouds2B, magma, rim); magma.visible = false;
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
  const frags = [], fcols = [0x2a62c0, 0x3f8a3a, 0x7a6a3c, 0xeef4ff, 0x264f9c], fgeo = trackG(new THREE.DodecahedronGeometry(1, 0)), fmats = fcols.map(col => track(new THREE.MeshLambertMaterial({ color: col, emissive: 0x3a0800 })));
  for (let i = 0; i < 140; i++) {
    const th = rand(0, CAP * .95), ph = rand(0, TAU), loc = new V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyQuaternion(pivot.quaternion);
    const m = new THREE.Mesh(fgeo, fmats[i % fmats.length]), s = rand(1.8, 6.5);
    m.position.copy(loc).multiplyScalar(R * rand(.8, 1)); m.scale.set(s, s * rand(.5, 1), s * rand(.6, 1)); m.visible = false;
    m.userData = { v: loc.clone().multiplyScalar(rand(18, 60)).addScaledVector(dir, rand(10, 40)).add(new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6))), r: new V3(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4)) };
    frags.push(m); g.add(m);
  }
  // ---- explosión: resplandor del cráter, bola de fuego, humo, chispas y onda de choque que recorre el planeta
  const craterPos = dir.clone().multiplyScalar(R * 1.02);
  const sprMat = (color, op, additive) => track(new THREE.SpriteMaterial({ map: glareTex, color, transparent: true, opacity: op, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, fog: false }));
  const craterGlow = new THREE.Sprite(sprMat(0xff7a2a, 0, true)); craterGlow.position.copy(craterPos); g.add(craterGlow);
  const flashS = new THREE.Sprite(sprMat(0xffffff, 0, true)); flashS.position.copy(craterPos); g.add(flashS);
  const puffs = [];
  for (let i = 0; i < 34; i++) {
    const fire = i % 3 === 0, sp = new THREE.Sprite(sprMat(fire ? 0xffa040 : 0x3a312c, 0, fire)); sp.position.copy(craterPos); sp.visible = false;
    sp.userData = { v: dir.clone().multiplyScalar(rand(10, 34)).add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(11)), life: rand(2.2, 4.2), delay: rand(0, .5), s0: rand(6, 14), s1: rand(26, 60), fire };
    puffs.push(sp); g.add(sp);
  }
  const SN = 650, sPos = new Float32Array(SN * 3), sCol = new Float32Array(SN * 3), sVel = new Float32Array(SN * 3), sLife = new Float32Array(SN), sMax = new Float32Array(SN);
  const bu = new V3(0, 1, 0).cross(dir).normalize(), bw = dir.clone().cross(bu);
  for (let i = 0; i < SN; i++) {
    const ph = rand(0, TAU), rr = Math.pow(rand(0, 1), .6), sp = rand(40, 150), lat = rand(10, 75) * rr;
    sVel[i * 3] = dir.x * sp + (bu.x * Math.cos(ph) + bw.x * Math.sin(ph)) * lat; sVel[i * 3 + 1] = dir.y * sp + (bu.y * Math.cos(ph) + bw.y * Math.sin(ph)) * lat; sVel[i * 3 + 2] = dir.z * sp + (bu.z * Math.cos(ph) + bw.z * Math.sin(ph)) * lat;
    sPos[i * 3] = craterPos.x; sPos[i * 3 + 1] = craterPos.y; sPos[i * 3 + 2] = craterPos.z; sMax[i] = rand(1.4, 4); sLife[i] = -1;
  }
  const spG = trackG(new THREE.BufferGeometry()); spG.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); spG.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const sparks = new THREE.Points(spG, track(new THREE.PointsMaterial({ size: 3.4, map: glareTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false })));
  sparks.frustumCulled = false; sparks.visible = false; g.add(sparks);
  const shock = new THREE.Mesh(trackG(new THREE.RingGeometry(.9, 1, 96)), track(new THREE.MeshBasicMaterial({ color: 0xffc890, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  shock.position.copy(craterPos); shock.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir); shock.visible = false; g.add(shock);
  // ---- el vecindario: Luna, Marte, Venus, Júpiter y Saturno (más lejos cuanto más grandes se ven) y satélites en órbita
  const ptex = (draw) => { const c9 = document.createElement('canvas'); c9.width = 512; c9.height = 256; const x = c9.getContext('2d'); draw(x); const t = new THREE.CanvasTexture(c9); texs.push(t); return t; };
  const planet = (r, pos, tex, tilt) => { const m = new THREE.Mesh(trackG(new THREE.SphereGeometry(r, 44, 30)), track(new THREE.MeshLambertMaterial({ map: tex, emissive: 0x060606 }))); m.position.copy(pos); m.rotation.z = tilt || 0; g.add(m); return m; };
  const moonTex = ptex(x => {
    x.fillStyle = '#9b9ba2'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 120; i++) { const cx = rand(0, 512), cy = rand(10, 246), r = rand(3, 24), gr = x.createRadialGradient(cx, cy, r * .15, cx, cy, r); gr.addColorStop(0, 'rgba(70,70,78,.7)'); gr.addColorStop(.85, 'rgba(110,110,118,.5)'); gr.addColorStop(1, 'rgba(210,210,220,.35)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(60,60,70,.28)'; x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(20, 60), rand(10, 30), 0, 0, TAU); x.fill(); }
  });
  const marsTex = ptex(x => {
    x.fillStyle = '#b6552f'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 70; i++) { x.fillStyle = i % 2 ? 'rgba(110,40,22,.45)' : 'rgba(225,140,95,.35)'; x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(14, 70), rand(8, 30), rand(0, 3), 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(0, 0, 512, 12); x.fillRect(0, 246, 512, 10);
  });
  const jupTex = ptex(x => {
    const cols = ['#d8b58c', '#b98456', '#ead6b2', '#a76b40', '#cfa070', '#efe0c4']; let y0 = 0;
    while (y0 < 256) { const h = rand(10, 26); x.fillStyle = cols[Math.floor(rand(0, cols.length))]; x.fillRect(0, y0, 512, h + 1); y0 += h; }
    for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(rand(0, 512), rand(0, 256), rand(30, 120), rand(1, 4), 0, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(190,70,40,.85)'; x.beginPath(); x.ellipse(340, 160, 26, 14, 0, 0, TAU); x.fill();
  });
  const venTex = ptex(x => { x.fillStyle = '#e9d7a2'; x.fillRect(0, 0, 512, 256); for (let i = 0; i < 80; i++) { x.fillStyle = i % 2 ? 'rgba(255,250,225,.25)' : 'rgba(200,170,110,.22)'; x.beginPath(); x.ellipse(rand(0, 512), rand(0, 256), rand(40, 130), rand(3, 12), rand(-.3, .3), 0, TAU); x.fill(); } });
  const satTex = ptex(x => { const cols = ['#dcc48a', '#c9ad70', '#e8d6a6', '#b89a5e']; let y0 = 0; while (y0 < 256) { const h = rand(8, 20); x.fillStyle = cols[Math.floor(rand(0, cols.length))]; x.fillRect(0, y0, 512, h + 1); y0 += h; } });
  const moon = planet(20, new V3(-55, 15, -151), moonTex), mars = planet(9, new V3(-205, 38, -35), marsTex), venus = planet(13, new V3(-130, 75, -340), venTex, .1), jup = planet(75, new V3(-330, -30, -330), jupTex, .05), sat = planet(48, new V3(-470, 90, 20), satTex, .35);
  const rv = document.createElement('canvas'); rv.width = 512; rv.height = 8; const rx = rv.getContext('2d');
  for (let i = 0; i < 512; i++) { const k = i / 512, a = (k > .08 && k < .93) ? (.35 + .55 * Math.abs(Math.sin(k * 38))) * (k > .45 && k < .52 ? .1 : 1) : 0; rx.fillStyle = 'rgba(225,205,160,' + a + ')'; rx.fillRect(i, 0, 1, 8); }
  const ringTex = new THREE.CanvasTexture(rv); texs.push(ringTex);
  const rg = trackG(new THREE.RingGeometry(1.3, 2.3, 96)), rp = rg.attributes.position, ruv = rg.attributes.uv;
  for (let i = 0; i < rp.count; i++) { const rr = Math.hypot(rp.getX(i), rp.getY(i)); ruv.setXY(i, (rr - 1.3) / 1.0, .5); }
  const ring2 = new THREE.Mesh(rg, track(new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })));
  ring2.scale.setScalar(48); ring2.rotation.x = Math.PI / 2 - .45; sat.add(ring2); ring2.position.set(0, 0, 0);
  // satélites: una estación grande y varios pequeños con luces parpadeantes
  const sats = [], panelM = track(new THREE.MeshLambertMaterial({ color: 0x2a4f9a, emissive: 0x0a1a3a })), hullM = track(new THREE.MeshLambertMaterial({ color: 0xcfd3d8, emissive: 0x111111 })), boxG = trackG(new THREE.BoxGeometry(1, 1, 1));
  const mkSat = (scale, rad, incl, yaw0, speed, phase, big) => {
    const sg = new THREE.Group(), body = new THREE.Mesh(boxG, hullM); body.scale.set(big ? 3.4 : 1.6, big ? 1.3 : 1, big ? 1.3 : 1); sg.add(body);
    for (const sd of [-1, 1]) { const pn = new THREE.Mesh(boxG, panelM); pn.scale.set(big ? 5.5 : 2.6, .08, big ? 2.4 : 1.4); pn.position.set(sd * (big ? 5 : 2.4), 0, 0); sg.add(pn); if (big) { const pn2 = new THREE.Mesh(boxG, panelM); pn2.scale.set(5.5, .08, 2.4); pn2.position.set(sd * 5, 0, 3.2); sg.add(pn2); } }
    const an = new THREE.Mesh(boxG, hullM); an.scale.set(.1, .1, big ? 3 : 1.6); an.position.set(0, .6, big ? 2 : 1); sg.add(an);
    const light = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glareTex, color: big ? 0xff4040 : 0x40ff90, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))); light.scale.setScalar(big ? 7 : 4); light.position.y = .7; sg.add(light);
    sg.scale.setScalar(scale); g.add(sg); sats.push({ sg, rad, incl, yaw0, speed, phase, light });
  };
  mkSat(2.4, R * 1.3, .5, .3, .35, 0, true); mkSat(1.2, R * 1.22, 1.15, 2.1, -.5, 1.6); mkSat(1.1, R * 1.4, .2, 4, .28, 3.2); mkSat(1, R * 1.18, 1.4, 5.5, .6, 4.5); mkSat(1.1, R * 1.5, .85, 1.2, -.22, 5.4);
  // polvo cósmico: da profundidad cuando la cámara se mueve
  const DN = 320, dPos = new Float32Array(DN * 3), dVel = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dPos[i * 3] = rand(-170, 170); dPos[i * 3 + 1] = rand(-90, 90); dPos[i * 3 + 2] = rand(-170, 170); dVel[i * 3] = rand(-1.2, 1.2); dVel[i * 3 + 1] = rand(-.6, .6); dVel[i * 3 + 2] = rand(-1.2, 1.2); }
  const dG = trackG(new THREE.BufferGeometry()); dG.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  g.add(new THREE.Points(dG, track(new THREE.PointsMaterial({ color: 0xbcc8e0, size: .9, transparent: true, opacity: .4, depthWrite: false, sizeAttenuation: true, fog: false }))));
  // auroras en los polos (se apagan al agrietarse el planeta)
  const auroraMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() }, time: { value: 0 }, fade: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vLN; varying vec3 vN; varying vec3 vW; void main(){ vLN = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 L; uniform float time, fade; varying vec3 vLN; varying vec3 vN; varying vec3 vW;
      void main(){
        float lat = abs(vLN.y), band = smoothstep(.66, .8, lat) * (1. - smoothstep(.88, .97, lat));
        float ang = atan(vLN.x, vLN.z), cur = .5 + .5 * sin(ang * 9. + time * .9 + sin(ang * 4. - time * .5) * 2.) * sin(ang * 17. - time * 1.3 + lat * 25.);
        float night = 1. - smoothstep(-.12, .22, dot(normalize(vN), normalize(L)));
        float view = pow(clamp(1. - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 0., 1.), .6);
        vec3 col = mix(vec3(.15, 1., .5), vec3(.55, .3, 1.), smoothstep(.2, .9, cur + (lat - .75) * 2.));
        gl_FragColor = vec4(col * band * cur * night * view * 1.6 * fade, 1.);
      }`,
  }));
  const aurora = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.04, 64, 40)), auroraMat); pivot.add(aurora);
  // destello alargado (anamórfico) del sol y del cráter
  const av = document.createElement('canvas'); av.width = 512; av.height = 64; const ax = av.getContext('2d'), ag = ax.createRadialGradient(256, 32, 0, 256, 32, 256); ag.addColorStop(0, 'rgba(255,255,255,1)'); ag.addColorStop(.12, 'rgba(255,230,190,.7)'); ag.addColorStop(1, 'rgba(255,200,150,0)');
  ax.save(); ax.translate(256, 32); ax.scale(1, .075); ax.translate(-256, -32); ax.fillStyle = ag; ax.fillRect(0, -200, 512, 500); ax.restore();
  const streakTex = new THREE.CanvasTexture(av); texs.push(streakTex);
  const streakMat = (c, o) => track(new THREE.SpriteMaterial({ map: streakTex, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const sunStreak = new THREE.Sprite(streakMat(0xffe2b8, .55)); sunStreak.position.copy(sunDir).multiplyScalar(300); sunStreak.scale.set(520, 40, 1); g.add(sunStreak);
  const craterStreak = new THREE.Sprite(streakMat(0xff8a4a, 0)); craterStreak.position.copy(dir).multiplyScalar(R * 1.02); craterStreak.scale.set(R * 7, R * .55, 1); g.add(craterStreak);
  scene.add(g);

  let boomed = false, boomT = 0;
  const api = {
    group: g, origin: O, dir, radius: R, boomed: () => boomed,
    // s = segundos desde que empieza la escena del espacio
    update(s, dt, camPos) {
      earth.rotation.y += dt * .05; clouds.rotation.y += dt * .068; earthB.rotation.y = earth.rotation.y; cloudsB.rotation.y = clouds.rotation.y;
      clouds2.rotation.y -= dt * .03; clouds2B.rotation.y = clouds2.rotation.y; earthMat.uniforms.time.value = s; auroraMat.uniforms.time.value = s;
      moon.rotation.y += dt * .03; mars.rotation.y += dt * .05; jup.rotation.y += dt * .08; venus.rotation.y -= dt * .02; sat.rotation.y += dt * .06;
      for (const q of sats) { const a = q.phase + s * q.speed; q.sg.position.set(Math.cos(a) * q.rad, 0, Math.sin(a) * q.rad).applyAxisAngle(new V3(1, 0, 0), q.incl).applyAxisAngle(new V3(0, 1, 0), q.yaw0); q.sg.rotation.y += dt * .4; q.light.material.opacity = Math.sin(s * 3.2 + q.phase * 2) > .72 ? .95 : .08; }
      for (let i = 0; i < DN; i++) { dPos[i * 3] += dVel[i * 3] * dt; dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt; dPos[i * 3 + 2] += dVel[i * 3 + 2] * dt; for (let a = 0; a < 3; a++) { const lim = a === 1 ? 90 : 170; if (dPos[i * 3 + a] > lim) dPos[i * 3 + a] = -lim; else if (dPos[i * 3 + a] < -lim) dPos[i * 3 + a] = lim; } }
      dG.attributes.position.needsUpdate = true;
      sky.rotation.y += dt * .004;
      if (!boomed) {
        const k = clamp((s - .35) / 1.7, 0, 1);
        lg.setDrawRange(0, Math.floor(total * k / 2) * 2);
        cracks.material.opacity = .55 + .45 * Math.abs(Math.sin(s * 14));
        craterGlow.material.opacity = k * .6 * (.8 + .2 * Math.sin(s * 20)); craterGlow.scale.setScalar(R * (.4 + k * .7));
        earthMat.uniforms.emi.value = .32 * k * k * (.8 + .2 * Math.sin(s * 22)); auroraMat.uniforms.fade.value = 1 - k;
        if (s > 2.2) {
          boomed = true; boomT = s; earth.visible = false; clouds.visible = false; clouds2.visible = false; earthB.visible = cloudsB.visible = clouds2B.visible = true; magma.visible = true; rim.visible = true; cracks.visible = false;
          frags.forEach(m => { m.visible = true; }); beam.visible = true; earthMat.uniforms.emi.value = .06;
          sparks.visible = true; shock.visible = true; for (let i = 0; i < SN; i++) sLife[i] = 0;
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
      // bola de fuego y resplandor
      flashS.material.opacity = Math.max(0, 1 - b * 2.2); flashS.scale.setScalar(R * (1.2 + b * 2.4));
      craterGlow.material.opacity = Math.max(.15, .8 * Math.max(0, 1 - b * .16)) * (.88 + .12 * Math.sin(s * 17)); craterGlow.scale.setScalar(R * (1 + .1 * Math.sin(s * 9)));
      // gas y humo del cráter
      for (const sp of puffs) {
        const u = sp.userData, lt = b - u.delay; if (lt < 0) continue; const k = lt / u.life;
        if (k >= 1) { sp.visible = false; continue; } sp.visible = true; sp.position.addScaledVector(u.v, dt); u.v.multiplyScalar(1 - dt * .45);
        sp.scale.setScalar(u.s0 + (u.s1 - u.s0) * Math.sqrt(k)); sp.material.opacity = (u.fire ? .75 : .5) * (1 - k) * Math.min(1, lt * 4);
      }
      // chispas incandescentes
      for (let i = 0; i < SN; i++) {
        sLife[i] += dt; const k = sLife[i] / sMax[i];
        if (k >= 1) { sCol[i * 3] = sCol[i * 3 + 1] = sCol[i * 3 + 2] = 0; continue; }
        sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt;
        const fade = Math.pow(1 - k, 1.6); sCol[i * 3] = fade; sCol[i * 3 + 1] = fade * (.85 - .6 * k); sCol[i * 3 + 2] = fade * Math.max(0, .45 - k);
      }
      spG.attributes.position.needsUpdate = true; spG.attributes.color.needsUpdate = true;
      craterStreak.material.opacity = Math.max(0, .9 - b * .35) * (.85 + .15 * Math.sin(s * 30)); auroraMat.uniforms.fade.value = 0;
      // onda de choque que recorre la superficie
      shock.scale.setScalar(1 + b * R * .75); shock.material.opacity = Math.max(0, .85 - b * .33);
    },
    dispose() {
      scene.remove(g);
      mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose());
    },
  };
  return api;
};

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/mundo-cosmos.js ===== */
/* "Ojo del Cosmos" · lo que le pasa al MUNDO (lo ven todos los jugadores, no solo Redbird):
     - el cielo se vuelve rojo (G.apoc, lo lee el clima en game.js) y vuelve poco a poco a la normalidad;
     - toda la partida tiembla mientras el cosmos responde;
     - caen escombros y meteoritos ardiendo alrededor de la cámara (polvo, brasas, grietas y ondas al chocar);
     - el rayo reacciona al agua: sobre el mar levanta una franja de espuma, géiseres, vapor y ondas.
   Uso desde rbCosmos.js:  const M = rbCosmosMundo();  M.setApoc(1);  M.update(dt, { center, rain, quake });
                           M.water(origen, direccion, largo, ancho, potenciado, dt);  M.hideFoam();  M.dispose(); */
const rbCosmosMundo = function () {
  const g = new THREE.Group(), mats = [], geos = [], rocks = []; scene.add(g);
  const boxG = new THREE.BoxGeometry(1, 1, 1); geos.push(boxG);
  const rockMats = [0x5e5046, 0x7a6a5c, 0x463b34].map(c => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; });
  const hotMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, fog: false }); mats.push(hotMat);
  const wet = (x, z) => z > SHORE(x) + .2 && z < 290 && Math.abs(x) < 190;   // ¿es mar?
  let apoc = 0, apocT = 0, acc = 0, hornT = 0, geyT = 0, sndT = 0, foam = null, MAX = 64;

  // ---- escombros
  const spawn = (c) => {
    if (rocks.length >= MAX) return;
    const a = rand(0, TAU), r = rand(4, 38), hot = Math.random() < .45, sc = rand(.5, 1.7);
    const m = new THREE.Mesh(boxG, hot ? hotMat : rockMats[Math.floor(Math.random() * 3)]);
    m.position.set(c.x + Math.cos(a) * r, c.y + rand(38, 64), c.z + Math.sin(a) * r); m.scale.set(sc, sc * rand(.6, 1.2), sc * rand(.7, 1.1));
    m.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU)); g.add(m);
    rocks.push({ m, v: new V3(rand(-6, 6), -rand(26, 44), rand(-6, 6)), spin: new V3(rand(-4, 4), rand(-4, 4), rand(-4, 4)), hot, sc, big: sc > .95 });
  };
  const impact = (r) => {
    const p = r.m.position, w = wet(p.x, p.z), y = w ? SEA_Y + .05 : groundAt(p.x, p.z, p.y), P = new V3(p.x, y, p.z), d = camera.position.distanceTo(P), near = clamp(1 - d / 34, 0, 1);
    if (w) { burst(P, 16, '#dff4ff', 9, .26, .8, 1.3, 7); ringAt(P, '#ffffff', 2.6 + r.sc * 2, .55); }
    else {
      burst(new V3(P.x, P.y + .2, P.z), r.big ? 22 : 12, '#7a6a52', 8, .24, .7, 1.1, 5);
      if (r.hot) { burst(P, 14, '#ff9a3a', 9, .14, .5, .8, 4); ringAt(P, '#ff7a1a', 2 + r.sc * 2, .45); }
      if (r.big && Math.random() < .5) crackDecal(P, rand(1.2, 2.4));
    }
    if (near > 0) { G.shake = Math.max(G.shake, (r.big ? .3 : .12) * near); if (sndT <= 0 && Math.random() < .6) { sfx(r.big ? 'heavy' : 'hit', P, .4); sndT = .12; } }
    g.remove(r.m);
  };

  return {
    setApoc(v) { apocT = v; },
    // o = { center: V3 (alrededor de qué caen), rain: escombros por segundo, quake: temblor general (0..1) }
    update(dt, o) {
      o = o || {}; apoc += (apocT - apoc) * (1 - Math.exp(-dt * 1.4)); G.apoc = apoc; sndT -= dt;
      if (o.quake) G.shake = Math.max(G.shake, o.quake * (.8 + .2 * Math.sin(performance.now() * .02)));
      if (o.rain && o.center) { acc += o.rain * dt; while (acc >= 1) { acc -= 1; spawn(o.center); } }
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i], p = r.m.position; p.addScaledVector(r.v, dt); r.m.rotation.x += r.spin.x * dt; r.m.rotation.y += r.spin.y * dt; r.m.rotation.z += r.spin.z * dt;
        if (r.hot) emit(p.x, p.y, p.z, rand(-1, 1), rand(0, 1.5), rand(-1, 1), Math.random() < .5 ? '#ff8a3a' : '#ffd27a', .14, .4, 0, 0);
        const gy = wet(p.x, p.z) ? SEA_Y : groundAt(p.x, p.z, p.y);
        if (p.y <= gy + r.sc * .5) { impact(r); rocks.splice(i, 1); }
      }
    },
    // el rayo sobre el agua: franja de espuma que cubre el tramo del rayo que pasa por el mar, géiseres, vapor y ondas
    water(org, F2, len, w, powered, dt) {
      let d0 = -1, d1 = -1;
      for (let d = 0; d <= len; d += 2) { const x = org.x + F2.x * d, z = org.z + F2.z * d; if (wet(x, z)) { if (d0 < 0) d0 = d; d1 = d; } }
      if (d0 < 0) { if (foam) foam.visible = false; return; }
      if (!foam) { const m = glowMat('#cfeeff', .5); mats.push(m); m.side = THREE.DoubleSide; const pg = new THREE.PlaneGeometry(1, 1); geos.push(pg); foam = new THREE.Mesh(pg, m); foam.rotation.order = 'YXZ'; g.add(foam); }
      const L = d1 - d0 + 2, mid = d0 + L / 2, pulse = 1 + Math.sin(performance.now() * .02) * .1;
      foam.visible = true; foam.position.set(org.x + F2.x * mid, SEA_Y + .07, org.z + F2.z * mid); foam.rotation.set(-Math.PI / 2, Math.atan2(F2.x, F2.z), 0); foam.scale.set(w * 1.7 * pulse, L, 1); foam.material.opacity = .42 + Math.sin(performance.now() * .015) * .1;
      geyT -= dt;
      if (geyT <= 0) {
        geyT = powered ? .07 : .12;
        for (let k = 0; k < (powered ? 3 : 2); k++) {
          const dd = rand(d0, d1), lat = rand(-w * .7, w * .7), x = org.x + F2.x * dd + F2.z * lat, z = org.z + F2.z * dd - F2.x * lat; if (!wet(x, z)) continue;
          const P = new V3(x, SEA_Y + .08, z);
          burst(P, powered ? 18 : 10, '#dff4ff', powered ? 11 : 8, .26, .9, 1.4, 8);
          for (let i = 0; i < 3; i++) emit(x + rand(-.5, .5), SEA_Y + .2, z + rand(-.5, .5), rand(-1, 1), rand(5, 12), rand(-1, 1), '#ffffff', .42, 1.1, -.4, 0);   // vapor
          if (Math.random() < (powered ? .5 : .32)) {   // columna de agua que sube y cae
            const h = rand(7, powered ? 18 : 12), rr = rand(.7, 1.5), cm = new THREE.Mesh(new THREE.CylinderGeometry(rr * .7, rr, 1, 12, 1, true), glowMat('#e8f8ff', .55)); cm.position.set(x, SEA_Y, z);
            addFx(cm, .7, (m, kk) => { const up = Math.sin(Math.min(1, kk * 1.25) * Math.PI * .5); m.scale.set(1 + kk * .8, h * up, 1 + kk * .8); m.position.y = SEA_Y + h * up / 2; m.material.opacity = (1 - kk) * .6; });
            ringAt(P, '#ffffff', 4 + Math.random() * 3, .6);
          }
        }
        if (sndT <= 0 && Math.random() < .5) { sfx('whoosh', new V3(org.x + F2.x * mid, SEA_Y, org.z + F2.z * mid), .5); sndT = .35; }
      }
    },
    hideFoam() { if (foam) foam.visible = false; },
    dispose() {
      scene.remove(g); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose());
      const back = () => { G.apoc = (G.apoc || 0) * .965; if (G.apoc > .01) requestAnimationFrame(back); else G.apoc = 0; }; back();   // el cielo rojo se apaga poco a poco
    },
  };
};

/* ===== personajes/redbird/Skills/Code/Ojo del Cosmos/rbCosmos.js ===== */
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
  const fadeFx = (from) => { let k = 0; const back = () => { k += .04; setFx(clamp(from - k, 0, 1), clamp(from - k * 1.3, 0, 1), 2.6 + k * 1.2); if (k < from) requestAnimationFrame(back); else setFx(0, 0, 1); }; setFx(from, from, 2.6); requestAnimationFrame(back); };

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
  if (composer && THREE.ShaderPass) {
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

/* ===== personajes/javi/Skills/Animation/Parry del Dragón/javiParry.coreografia.js ===== */
/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Duelo de lanza continuo estilo anime (sin pausas estáticas "pose con pose"):
   1) Choque del Parry (brazo de la víctima contra la lanza diagonal de Javi) y desvío.
   2) Giro 360° + estocada al pecho; la víctima atrapa e intenta frenar la lanza con ambas manos
      mientras Javi avanza dando zancadas y la víctima resbala hacia atrás entre chispas y polvo.
   3) Desvío al límite, patada giratoria de la víctima, bloqueo deslizante de Javi y voltereta atrás (backflip).
   4) Sprint de la víctima, barrido bajo de 360° a ras del suelo y salto acrobático por encima de la lanza.
   5) Intercambio veloz de cortes, rotación evasiva y ráfaga que obliga a la víctima a cubrirse hasta romper su guardia.
   6) Salto mortal del Dragón cayendo desde el aire; la víctima frena la lanza sobre su cabeza cayendo de rodillas
      mientras el suelo se agrieta, Javi gira la lanza como taladro y conecta la estocada final explosiva. */
CF.coreografia('javiParry', function () {
  const TAU = Math.PI * 2;
  // Base limpia para que ningún canal quede sin inicializar al interpolar
  const base = {
    ix: 0, iy: 0, iz: 0, tx: 0, ty: 0, tz: 0, hx: 0, hy: 0, hz: 0,
    bx: 0, by: -1.4, bz: 0,
    alx: -.85, aly: .15, alz: -.25,
    arx: -.85, ary: -.15, arz: .18,
    llx: -.32, lly: 0, llz: .10, lrx: .28, lry: 0, lrz: -.10,
    sx: .85, sy: 0, sz: 0, spx: 0, spy: 0, spz: 0, ssc: 1,
    tpx: 0, tpy: 0, tpz: 0, hpx: 0, hpy: 0, hpz: 0,
    alpx: 0, alpy: 0, alpz: 0, arpx: 0, arpy: 0, arpz: 0,
    llpx: 0, llpy: 0, llpz: 0, lrpx: 0, lrpy: 0, lrpz: 0,
    als: 1, ars: 1, lls: 1, lrs: 1, tscx: 1, tscy: 1, tscz: 1, hscx: 1, hscy: 1, hscz: 1,
  };
  const P = o => Object.assign({}, base, o);
  // arx + sx = 0 apunta la lanza recto al frente (+Z); up > 0 la inclina hacia arriba (+Y)
  const U = (o, up = 0) => { const r = P(o); r.sx = -r.arx - up; return r; };
  // Mantiene la continuidad de ix tras una voltereta completa (-TAU)
  const F = (o, turns = -1) => Object.assign({}, o, { ix: (o.ix || 0) + turns * TAU });

  // ==================== ACTO I: CHOQUE DEL PARRY Y DESVÍO (0.00 - 0.95s) ====================
  // Javi en la pose de guardia diagonal (Blockbench) recibiendo el golpe del brazo de la víctima
  const A_GUARD_0 = U({
    ix: .13, tx: .11, ty: .26, tz: .04, hx: -.08, hy: -.24, by: -3.3, bz: .5,
    arx: -.84, arz: .16, ary: -.20, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.66, lrx: .56, llz: .15, lrz: -.15,
    tpx: .3, tpz: .5, arpx: -.7, arpy: -.4, arpz: 1.4, alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .46);

  // Impacto: el brazo de la víctima choca contra el asta; Javi absorbe el golpe flexionando más las piernas
  const A_PARRY_SHOCK = U({
    ix: .20, tx: .18, ty: .38, tz: .08, hx: -.14, hy: -.34, by: -4.6, bz: -.6,
    arx: -.98, arz: .22, ary: -.28, sy: 1.12, sz: .38, spx: 1.2, spy: .7, spz: 1.8,
    alx: -1.42, alz: -.52, aly: .42,
    llx: -.86, lrx: .72, llz: .18, lrz: -.18,
    tpx: .6, tpz: -.5, arpx: -1.1, arpy: -.5, arpz: 1.8, alpx: 1.2, alpy: -.2, alpz: 2.1,
    llpx: .7, llpz: 2.0, lrpx: -.7, lrpz: -2.0, tscx: 1.10, tscy: .90
  }, .54);

  // Javi empuja y desvía el brazo de la víctima hacia arriba y a la derecha con un tajo diagonal
  const A_DEFLECT_UP = U({
    ix: -.08, tx: -.12, ty: -.56, tz: -.10, hx: .08, hy: .48, by: -1.8, bz: 1.2,
    arx: -1.92, arz: .58, ary: .32, sy: -.62, sz: -.45, spx: -.6, spy: 1.2, spz: 2.2,
    alx: -1.75, alz: -.18, aly: .24,
    llx: -.52, lrx: .64, llz: .16, lrz: -.16,
    tpx: -.7, tpy: .5, tpz: 1.1, arpx: -1.8, arpy: 1.4, arpz: 2.6, ars: 1.15,
    alpx: 1.4, alpy: 1.1, alpz: 1.8, als: 1.08, tscx: .96, tscy: 1.07
  }, .82);

  // Giro de 360° preparando la estocada (pasos intermedios para rotación fluida)
  const A_SPIN_1 = U({
    ix: .16, tx: .14, ty: -.78, tz: -.14, hx: -.10, hy: .62, by: -3.1, bz: .4,
    arx: -1.25, arz: .75, ary: .42, sy: -.85, sz: -.30,
    alx: -.65, alz: .62, aly: -.22,
    llx: .45, lrx: -.68, llz: .18, lrz: -.18,
    llpz: -1.6, lrpz: 1.8, tscx: 1.04, tscy: .96
  }, .25);

  const A_SPIN_2 = U({
    ix: .22, tx: .18, ty: -.42, tz: .12, hx: -.14, hy: .28, by: -3.6, bz: -.4,
    arx: -.78, arz: .42, ary: .18, sy: -.25, sz: .15,
    alx: -1.15, alz: -.32, aly: .28,
    llx: -.72, lrx: .54, llz: .16, lrz: -.16,
    llpz: 1.7, lrpz: -1.5, tscx: 1.06, tscy: .94
  }, .12);

  // Carga la lanza en la cadera derecha antes de lanzar la estocada
  const A_COIL_THRUST = U({
    ix: .24, tx: .20, ty: -.88, tz: -.08, hx: -.16, hy: .76, by: -4.2, bz: -1.6,
    arx: -.64, arz: .38, ary: .26, sy: -.12, sz: -.18, spx: -.8, spy: -.4, spz: -1.4,
    alx: -1.32, alz: -.46, aly: .38,
    llx: -.92, lrx: .74, llz: .20, lrz: -.20,
    tpx: -.9, tpz: -1.4, arpx: -1.9, arpy: -.4, arpz: -2.4, alpx: 1.4, alpz: 1.8,
    llpx: .8, llpz: 2.2, lrpx: -.8, lrpz: -2.2, tscx: 1.09, tscy: .91
  }, .04);

  // Víctima en Acto I: lanza un puñetazo derecho, choca contra la lanza de Javi y sale desviada
  const V_ATTACK_IN = P({
    ix: .24, tx: .22, ty: .72, hx: -.12, hy: -.52, by: -2.2, bz: 1.8,
    arx: -1.58, arz: -.18, ary: -.22, alx: -.62, alz: -.42,
    llx: -.78, lrx: .64, llz: .14, lrz: -.14,
    arpx: -1.4, arpy: .4, arpz: 3.2, ars: 1.14, llpz: 1.8, lrpz: -1.6
  });

  const V_CLASH_PARRY = P({
    ix: .16, tx: .18, ty: .48, tz: -.08, hx: .14, hy: -.32, by: -2.8, bz: .6,
    arx: -1.46, arz: .12, ary: -.14, alx: -.88, alz: .38,
    llx: -.64, lrx: .52, llz: .16, lrz: -.16,
    arpx: -1.1, arpy: .5, arpz: 2.4, tscx: 1.07, tscy: .93
  });

  const V_DEFLECTED_1 = P({
    ix: -.28, tx: -.26, ty: -.64, tz: .18, hx: -.38, hy: .54, hz: .16, by: -1.2, bz: -1.2,
    arx: -2.35, arz: -.88, ary: .35, alx: -.45, alz: .78,
    llx: .32, lrx: -.54, llz: .20, lrz: -.16,
    tpx: .8, tpz: -1.1, arpx: -2.2, arpy: 1.4, arpz: -.8, llpz: -1.2, lrpz: 1.4, tscx: .95, tscy: 1.07
  });

  const V_DEFLECTED_2 = P({
    ix: -.12, tx: -.10, ty: -.28, tz: .08, hx: -.14, hy: .24, by: -2.1, bz: -.5,
    arx: -1.25, arz: -.52, alx: -.92, alz: .44,
    llx: -.46, lrx: .38, llz: .16, lrz: -.16,
    llpz: 1.1, lrpz: -1.1
  });

  // ==================== ACTO II: ESTOCADA Y FRENADA CON LAS MANOS (0.95 - 2.65s) ====================
  // Helper para generar las zancadas de empuje de Javi mientras clava/empuja la lanza
  const makeDriveStep = (step, side, smear = 0) => U({
    ix: .32 + smear * .06, tx: .26, ty: .48 + side * .12, tz: side * .06,
    hx: -.20, hy: -.38 - side * .08, by: -3.4 - Math.abs(side) * .6, bz: 2.4 + smear * 1.4,
    arx: -1.56, arz: -.06, ary: -.08, sy: -.04, sz: step * .35, spx: 0, spy: .2, spz: 2.6 + smear * 1.2,
    alx: -1.48, alz: -.28, aly: .22,
    // Las piernas dan zancadas alternas reales mientras avanza empujando
    llx: side > 0 ? -.98 : .64, lrx: side > 0 ? .76 : -.92, llz: .16, lrz: -.16,
    tpx: .6, tpz: 1.4, arpx: -1.8, arpy: .5, arpz: 4.2 + smear * 2.0, ars: 1.14 + smear * .18,
    alpx: 1.2, alpy: .4, alpz: 2.4, als: 1.06,
    llpx: .7, llpz: side > 0 ? 2.4 : -2.0, lrpx: -.7, lrpz: side > 0 ? -2.2 : 2.2,
    tscx: .95, tscy: 1.07
  }, .03);

  // Helper para la víctima frenando la lanza con ambas manos mientras resbala hacia atrás
  const makeBrakeStruggle = (step, side) => P({
    ix: .26 + side * .05, tx: .34 + Math.abs(side) * .06, ty: side * .14, tz: -side * .08,
    hx: .28 - side * .06, hy: -side * .12, hz: side * .08,
    by: -3.2 - (step % 2) * .7, bz: -1.2,
    // Ambos brazos tensos al frente agarrando el asta (reforzado con IK holds)
    arx: -1.52 + side * .08, arz: .22, ary: -.24,
    alx: -1.48 - side * .08, alz: -.22, aly: .24,
    // Las piernas se afirman y retroceden intentando frenar el empuje en el suelo
    llx: side > 0 ? -.84 : .48, lrx: side > 0 ? .54 : -.82, llz: .20, lrz: -.20,
    tpy: -.4, tpz: -.8, hpy: .4, hpz: .8,
    arpx: -1.2, arpy: .4, arpz: 1.8, ars: 1.08,
    alpx: 1.2, alpy: .5, alpz: 2.0, als: 1.08,
    llpx: .8, llpz: side > 0 ? 2.1 : -1.6, lrpx: -.8, lrpz: side > 0 ? -1.7 : 2.0,
    tscx: 1.08, tscy: .92
  });

  // ==================== ACTO III: DESVÍO, PATADA, RESBALÓN Y BACKFLIP (2.65 - 4.10s) ====================
  // La víctima logra desviar la punta de la lanza hacia un lado con un grito de esfuerzo
  const A_WRENCHED = U({
    ix: .14, tx: .12, ty: -.52, tz: -.14, hx: .08, hy: .38, by: -2.4, bz: .4,
    arx: -1.32, arz: .64, ary: .28, sy: -.78, sz: -.35,
    alx: -.82, alz: .48, aly: -.16,
    llx: -.54, lrx: .48, llz: .16, lrz: -.16
  }, .28);

  const V_WRENCH_OUT = P({
    ix: .12, tx: .16, ty: .76, tz: .12, hx: -.14, hy: -.52, by: -2.4, bz: 1.2,
    arx: -1.42, arz: -.68, ary: -.34, alx: -1.28, alz: -.74, aly: -.28,
    llx: -.68, lrx: .56, llz: .18, lrz: -.18,
    arpx: -1.6, arpz: 2.2, alpx: 1.6, alpz: 2.0, tscx: 1.05, tscy: .95
  });

  // La víctima gira y lanza una patada circular alta; Javi cruza la lanza y resbala hacia atrás
  const V_KICK_WIND = P({
    ix: -.14, tx: -.12, ty: -.68, hx: -.08, hy: .54, by: -1.6,
    arx: -.65, arz: .48, alx: -1.15, alz: -.38,
    llx: -.42, lrx: .64, llz: .14, lrz: -.14
  });

  const V_SPIN_KICK = P({
    ix: -.36, iz: .24, tx: -.22, ty: -.74, hx: -.18, hy: .62, by: .8, bz: 1.4,
    arx: .52, arz: -.68, alx: -1.18, alz: .54,
    llx: .34, lrx: -2.08, lrz: .32, llz: .16,
    lrpx: -.8, lrpy: 1.2, lrpz: 2.6, lrs: 1.18, tscx: .95, tscy: 1.07
  });

  const V_KICK_LAND = P({
    ix: .18, tx: .16, ty: .28, hx: -.08, hy: -.22, by: -2.6, bz: .4,
    arx: -.88, arz: .34, alx: -1.04, alz: -.32,
    llx: -.64, lrx: .52, llz: .16, lrz: -.16
  });

  // Javi bloquea la patada cruzando la lanza y resbala hacia atrás flexionando piernas
  const A_BLOCK_KICK = U({
    ix: .22, tx: .20, ty: .18, tz: .08, hx: .12, hy: -.16, by: -3.8, bz: -.8,
    arx: -1.48, arz: .32, ary: -.28, sy: 1.18, sz: .42, spx: 1.2, spy: .8, spz: 1.8,
    alx: -1.52, alz: -.44, aly: .36,
    llx: -.82, lrx: .68, llz: .18, lrz: -.18,
    tpx: .4, tpz: -.8, arpx: -.9, arpy: .6, arpz: 1.8, alpx: 1.1, alpy: .5, alpz: 2.0,
    llpx: .6, llpz: 1.9, lrpx: -.6, lrpz: -1.9, tscx: 1.09, tscy: .91
  }, .48);

  const A_SKID_BACK = U({
    ix: .32, tx: .28, ty: -.24, tz: -.06, hx: -.18, hy: .22, by: -4.8, bz: -1.2,
    arx: -1.12, arz: .44, ary: -.18, sy: .86, sz: .24, spx: .8, spy: .4, spz: 1.4,
    alx: -1.24, alz: -.36, aly: .28,
    llx: -1.04, lrx: .84, llz: .22, lrz: -.22,
    llpx: .8, llpz: 2.4, lrpx: -.8, lrpz: -2.4, tscx: 1.12, tscy: .88
  }, .32);

  // Voltereta acrobática hacia atrás (Backflip continuo en 4 fases: ix de 0 a -TAU)
  const A_FLIP_1 = U({
    ix: -1.45, tx: -.28, ty: -.12, hx: -.42, by: 0,
    arx: -2.25, arz: .32, sy: .45, alx: -2.10, alz: -.32,
    llx: -1.35, lrx: -.45, llz: .14, lrz: -.14, tscy: 1.08
  }, .35);

  const A_FLIP_2 = U({
    ix: -3.14, tx: -.36, ty: 0, hx: -.48, by: 0,
    arx: -2.45, arz: .24, sy: .20, alx: -2.35, alz: -.24,
    llx: -1.75, lrx: -1.65, llz: .16, lrz: -.16, tscx: 1.06, tscy: .94
  }, .20);

  const A_FLIP_3 = U({
    ix: -4.75, tx: -.18, ty: .12, hx: -.24, by: -.8,
    arx: -1.65, arz: .28, sy: .55, alx: -1.55, alz: -.28,
    llx: -.95, lrx: .35, llz: .16, lrz: -.16
  }, .25);

  const A_FLIP_LAND = F(U({
    ix: .36, tx: .32, ty: -.48, hx: -.24, hy: .42, by: -5.2, bz: .6,
    arx: -.78, arz: .52, ary: .22, sy: -.55, sz: -.22,
    alx: -.92, alz: .44,
    llx: -1.12, lrx: .88, llz: .22, lrz: -.22,
    llpx: .8, llpz: 2.4, lrpx: -.8, lrpz: -2.4, tscx: 1.12, tscy: .88
  }, .12), -1);

  // ==================== ACTO IV: SPRINT, BARRIDO 360° Y SALTO ACROBÁTICO (4.10 - 5.45s) ====================
  // La víctima corre hacia Javi dando zancadas reales
  const makeRunPose = (side) => P({
    ix: .46, tx: .22, ty: side * .34, tz: -side * .08, hx: -.32, hy: -side * .24,
    by: -1.8, bz: 1.4,
    arx: side > 0 ? .88 : -1.35, arz: .24,
    alx: side > 0 ? -1.35 : .88, alz: -.24,
    llx: side > 0 ? -1.12 : .86, lrx: side > 0 ? .86 : -1.12, llz: .12, lrz: -.12,
    llpz: side > 0 ? 2.4 : -2.2, lrpz: side > 0 ? -2.2 : 2.4, tscx: .96, tscy: 1.05
  });

  // Javi gira a ras del suelo en un barrido de 360° con la lanza extendida
  const A_SWEEP_1 = F(U({
    ix: .44, iz: -.24, tx: .36, ty: .92, hx: -.28, hy: -.68, by: -5.8, bz: 1.4,
    arx: -1.48, arz: -.78, ary: -.42, sy: .85, sz: 1.15, spx: 1.6, spy: -.4, spz: 2.8,
    alx: .42, alz: .74,
    llx: -1.18, lrx: .92, llz: .26, lrz: -.22,
    arpx: -2.4, arpz: 3.4, ars: 1.24, tscx: .92, tscy: 1.10
  }, -.12), -1);

  const A_SWEEP_2 = F(U({
    ix: .38, iz: .22, tx: .30, ty: 1.12, hx: -.22, hy: -.82, by: -5.4, bz: 1.0,
    arx: -1.52, arz: -.92, ary: -.54, sy: 1.10, sz: 1.35, spx: 1.8, spy: -.2, spz: 2.6,
    alx: .58, alz: .82,
    llx: .78, lrx: -1.08, llz: .24, lrz: -.24,
    arpx: -2.6, arpz: 3.2, ars: 1.22, tscx: .94, tscy: 1.08
  }, -.08), -1);

  const A_SWEEP_REC = F(U({
    ix: .18, tx: .16, ty: .38, hx: -.10, hy: -.28, by: -3.0, bz: .5,
    arx: -1.12, arz: -.24, sy: .35, sz: .25,
    alx: -.86, alz: -.32,
    llx: -.68, lrx: .58, llz: .16, lrz: -.16
  }, .22), -1);

  // La víctima salta por encima del barrido recogiendo las piernas y girando en el aire
  const V_VAULT_UP = P({
    ix: -.42, iz: .28, tx: -.18, ty: -.48, hx: .22, hy: .36, by: .4,
    arx: -2.15, arz: .62, alx: -1.95, alz: -.62,
    llx: -1.58, lrx: -1.32, llz: .18, lrz: -.18,
    llpy: 1.2, lrpy: 1.0, tscx: .96, tscy: 1.06
  });

  const V_VAULT_APEX = P({
    ix: .54, iz: -.32, tx: .28, ty: .52, hx: .34, hy: -.38, by: -.6,
    arx: -2.45, arz: .38, alx: -2.25, alz: -.38,
    llx: -1.72, lrx: -1.54, llz: .20, lrz: -.20,
    llpy: 1.4, lrpy: 1.4, tscx: 1.05, tscy: .95
  });

  const V_DROP_SMASH = P({
    ix: .48, tx: .42, ty: .64, hx: .24, hy: -.44, by: -2.4, bz: 1.8,
    arx: -1.68, arz: -.22, alx: -.75, alz: .48,
    llx: -.92, lrx: .74, llz: .16, lrz: -.16,
    arpx: -1.6, arpy: -.4, arpz: 3.2, ars: 1.18
  });

  // ==================== ACTO V: ROTACIÓN EVASIVA Y RÁFAGA CONTRA GUARDIA (5.45 - 6.65s) ====================
  // Javi desvía el golpe descendente rotando sobre su eje y encadena 3 cortes veloces
  const A_PARRY_SPIN = F(U({
    ix: .12, iz: -.28, tx: .10, ty: -.68, hx: -.08, hy: .54, by: -2.6, bz: .6,
    arx: -1.78, arz: .54, ary: .28, sy: -.72, sz: -.42, spx: -.8, spy: 1.0, spz: 2.0,
    alx: -1.42, alz: -.34,
    llx: -.74, lrx: .62, llz: .18, lrz: -.18, ars: 1.14
  }, .64), -1);

  const A_COMBO_1 = F(U({
    ix: .26, tx: .22, ty: .86, hx: -.14, hy: -.64, by: -3.2, bz: 1.8,
    arx: -1.54, arz: -.58, ary: -.38, sy: .74, sz: .82, spx: 1.4, spy: .4, spz: 2.6,
    alx: .34, alz: .58,
    llx: -.92, lrx: .74, llz: .18, lrz: -.18,
    arpx: -2.2, arpz: 3.4, ars: 1.20
  }, .18), -1);

  const A_COMBO_2 = F(U({
    ix: -.12, tx: -.14, ty: -.74, hx: -.22, hy: .58, by: -1.8, bz: 1.4,
    arx: -2.18, arz: .62, ary: .34, sy: -.68, sz: -.54, spx: -1.2, spy: 1.2, spz: 2.4,
    alx: -1.68, alz: -.28,
    llx: .62, lrx: -.84, llz: .18, lrz: -.18,
    arpx: -1.8, arpy: 1.2, arpz: 2.8, ars: 1.18
  }, .72), -1);

  const A_COMBO_3 = F(U({
    ix: .32, tx: .28, ty: 1.04, hx: -.18, hy: -.78, by: -3.8, bz: 2.4,
    arx: -1.62, arz: -.74, ary: -.48, sy: .92, sz: 1.08, spx: 1.8, spy: .2, spz: 3.0,
    alx: .48, alz: .68,
    llx: -1.06, lrx: .86, llz: .20, lrz: -.20,
    arpx: -2.6, arpz: 4.0, ars: 1.26, tscx: .93, tscy: 1.09
  }, .08), -1);

  // La víctima se cubre cruzando ambos brazos mientras resbala hacia atrás por los impactos
  const V_COVER_1 = P({
    ix: .18, tx: .22, ty: -.16, tz: .08, hx: .28, hy: .14, by: -2.8, bz: -.8,
    arx: -1.52, arz: .88, ary: -.34, alx: -1.48, alz: -.88, aly: .34,
    llx: -.68, lrx: .54, llz: .18, lrz: -.18,
    arpx: -.8, arpy: .6, arpz: 1.8, alpx: .8, alpy: .6, alpz: 1.8,
    llpz: 1.6, lrpz: -1.6, tscx: 1.06, tscy: .94
  });

  const V_COVER_2 = P({
    ix: .24, tx: .28, ty: .18, tz: -.08, hx: .32, hy: -.16, by: -3.4, bz: -1.2,
    arx: -1.58, arz: .92, ary: -.38, alx: -1.54, alz: -.92, aly: .38,
    llx: .52, lrx: -.74, llz: .20, lrz: -.20,
    arpx: -.9, arpy: .7, arpz: 1.9, alpx: .9, alpy: .7, alpz: 1.9,
    llpz: -1.6, lrpz: 1.8, tscx: 1.08, tscy: .92
  });

  const V_GUARD_BROKEN = P({
    ix: -.34, tx: -.32, ty: .28, tz: -.14, hx: -.48, hy: -.24, by: -1.8, bz: -1.4,
    arx: -.68, arz: -1.28, alx: -.62, alz: 1.28,
    llx: -.52, lrx: .64, llz: .22, lrz: -.22,
    arpx: -2.2, alpx: 2.2, tscx: .95, tscy: 1.07
  });

  // ==================== ACTO VI: SALTO MORTAL DEL DRAGÓN, BLOQUEO DE RODILLAS Y REMATE (6.65 - 8.80s) ====================
  // Javi salta alto dando un giro mortal hacia adelante (ix pasa de -TAU a 0 suavemente)
  const A_LEAP_START = F(U({
    ix: -.28, tx: -.22, ty: -.34, hx: -.38, hy: .24, by: .4, bz: 1.2,
    arx: -2.65, arz: .22, sy: .25, alx: -2.25, alz: -.32,
    llx: -1.28, lrx: .58, llz: .14, lrz: -.14, tscy: 1.08
  }, .45), -1);

  const A_SOMERSAULT_1 = U({
    ix: -4.25, tx: .34, ty: -.12, hx: .28, by: 0,
    arx: -2.45, arz: .18, sy: .12, alx: -2.35, alz: -.24,
    llx: -1.68, lrx: -1.52, llz: .16, lrz: -.16, tscx: 1.06, tscy: .94
  }, .22);

  const A_SOMERSAULT_2 = U({
    ix: -1.85, tx: -.24, ty: .08, hx: -.32, by: .2,
    arx: -2.85, arz: .14, sy: 0, alx: -2.65, alz: -.22,
    llx: -1.24, lrx: -.48, llz: .16, lrz: -.16, tscy: 1.08
  }, .38);

  // Javi cae en picado empuñando la lanza a dos manos hacia abajo
  const A_DIVE_SLAM = U({
    ix: .46, tx: .38, ty: .18, hx: .18, hy: -.14, by: -3.2, bz: 1.8,
    arx: -1.34, arz: .08, ary: -.12, sy: .18, sz: .22, spx: .6, spy: -.4, spz: 2.4,
    alx: -1.58, alz: -.32, aly: .28,
    llx: -.92, lrx: .78, llz: .18, lrz: -.18,
    arpx: -1.6, arpy: -.4, arpz: 3.2, ars: 1.18, alpx: 1.4, alpy: -.3, alpz: 2.6, als: 1.10,
    tscx: 1.08, tscy: .92
  }, -.56);

  // Javi presiona la lanza desde arriba con vibración de fuerza
  const makeDivePress = (side) => U({
    ix: .50 + side * .04, tx: .42, ty: .22 + side * .08, hx: .22, hy: -.18,
    by: -4.0 - Math.abs(side) * .4, bz: 2.0,
    arx: -1.38 + side * .05, arz: .10, sy: .16, sz: side * .25, spx: .6, spy: -.5, spz: 2.6,
    alx: -1.62, alz: -.34, aly: .30,
    llx: -.98, lrx: .82, llz: .20, lrz: -.20,
    arpx: -1.8, arpy: -.5, arpz: 3.4, ars: 1.16, alpx: 1.5, alpy: -.4, alpz: 2.8,
    tscx: 1.10, tscy: .90
  }, -.58);

  // La víctima frena la lanza sobre su cabeza con ambas manos cayendo de rodillas
  const makeKneelBlock = (side) => P({
    ix: -.18 + side * .04, tx: -.22, ty: side * .10, tz: -side * .06,
    hx: -.44, hy: -side * .08, hz: side * .06,
    by: -5.4 - Math.abs(side) * .4, bz: -.4,
    arx: -2.58 + side * .06, arz: .24, ary: -.20,
    alx: -2.54 - side * .06, alz: -.24, aly: .20,
    llx: -1.18, lrx: 1.12, llz: .22, lrz: -.22,
    arpx: -1.2, arpy: 1.6, arpz: 1.2, ars: 1.10,
    alpx: 1.2, alpy: 1.6, alpz: 1.2, als: 1.10,
    llpx: .8, llpy: -.8, llpz: 1.6, lrpx: -.8, lrpy: -.8, lrpz: -1.8,
    tscx: 1.12, tscy: .88
  });

  // Javi salta atrás un instante, gira la lanza como taladro y lanza la estocada final explosiva
  const A_FINAL_COIL = U({
    ix: -.14, tx: -.12, ty: -.92, hx: -.08, hy: .78, by: -3.8, bz: -2.2,
    arx: -.68, arz: .36, ary: .24, sy: -.18, sz: -.24, spx: -.8, spy: -.4, spz: -1.8,
    alx: -1.28, alz: -.44, aly: .34,
    llx: -.88, lrx: .72, llz: .20, lrz: -.20,
    tpx: -1.0, tpz: -1.8, arpx: -2.2, arpy: .4, arpz: -2.8, alpx: 1.6, alpz: 1.8,
    llpx: .8, llpz: 2.2, lrpx: -.8, lrpz: -2.2, tscx: 1.08, tscy: .92
  }, .04);

  const A_FINAL_SMEAR = U({
    ix: .38, tx: .32, ty: .58, hx: -.24, hy: -.48, by: -3.2, bz: 4.4,
    arx: -1.58, arz: -.08, ary: -.12, sy: 0, sz: 0, spx: 0, spy: .2, spz: 4.2,
    alx: .58, alz: .54,
    llx: -1.24, lrx: .94, llz: .18, lrz: -.18,
    tpx: 1.0, tpz: 2.2, arpx: -3.0, arpy: .7, arpz: 6.8, ars: 1.36,
    alpx: 2.2, alpz: -3.6, als: 1.12,
    llpx: 1.4, llpz: 3.6, lrpx: -1.4, lrpz: -3.8, lls: 1.18, lrs: 1.10,
    tscx: .88, tscy: 1.16
  }, .02);

  const A_FINAL_HOLD = U({
    ix: .24, tx: .20, ty: .44, hx: -.14, hy: -.36, by: -2.8, bz: 2.4,
    arx: -1.54, arz: -.06, sy: 0, sz: 0, spx: 0, spy: .2, spz: 2.6,
    alx: .42, alz: .46,
    llx: -1.02, lrx: .78, llz: .16, lrz: -.16,
    arpx: -1.8, arpy: .5, arpz: 3.8, ars: 1.12, llpz: 2.4, lrpz: -2.4
  }, .04);

  return {
    dur: 8.8,
    trails: [
      [.18, .54], [.96, 1.35], [2.85, 3.35], [3.52, 4.08],
      [4.52, 5.15], [5.45, 6.25], [6.68, 7.35], [7.88, 8.45],
    ],
    // Durante el forcejeo (1.10-2.55s), la víctima queda anclada frente a la punta de la lanza mientras la frena con las manos
    lock: [
      { t0: 1.10, t1: 2.55, d: -.28, side: 0, y: 0, fade: .12 },
    ],
    // Agarres IK sobre el asta de la lanza (z en píxeles desde la mano derecha; punta en z=26):
    // - Javi sujeta con armL en la guardia inicial, estocada, bloqueo, salto mortal y presión.
    // - La víctima choca su brazo derecho en el parry (0.05-0.42s), frena la lanza con AMBAS MANOS en el pecho (1.08-2.56s)
    //   y vuelve a frenarla con AMBAS MANOS sobre su cabeza al caer de rodillas (7.18-7.86s).
    holds: [
      { t0: 0, t1: .46, who: 'att', arm: 'armL', z: 11, fade: .08 },
      { t0: .05, t1: .42, who: 'vic', arm: 'armR', z: 15, fade: .06 },
      { t0: .94, t1: 2.56, who: 'att', arm: 'armL', z: 10, fade: .10 },
      { t0: 1.08, t1: 2.56, who: 'vic', arm: 'armL', z: 20, fade: .08 },
      { t0: 1.08, t1: 2.56, who: 'vic', arm: 'armR', z: 15, fade: .08 },
      { t0: 3.12, t1: 3.56, who: 'att', arm: 'armL', z: 13, fade: .08 },
      { t0: 6.72, t1: 7.86, who: 'att', arm: 'armL', z: 11, fade: .10 },
      { t0: 7.18, t1: 7.86, who: 'vic', arm: 'armL', z: 19, fade: .08 },
      { t0: 7.18, t1: 7.86, who: 'vic', arm: 'armR', z: 14, fade: .08 },
    ],
    att: [
      // Acto I: Parry diagonal, absorción, desvío hacia arriba y giro 360° de carga
      [0, A_GUARD_0],
      [.12, A_PARRY_SHOCK],
      [.34, A_DEFLECT_UP],
      [.54, A_SPIN_1],
      [.72, A_SPIN_2],
      [.92, A_COIL_THRUST],
      // Acto II: Estocada y avance continuo dando 5 zancadas mientras la víctima frena la lanza
      [1.08, makeDriveStep(0, 1, 1)],
      [1.32, makeDriveStep(1, -1, 0)],
      [1.58, makeDriveStep(2, 1, .3)],
      [1.84, makeDriveStep(3, -1, 0)],
      [2.12, makeDriveStep(4, 1, .4)],
      [2.38, makeDriveStep(5, -1, .2)],
      // Acto III: La víctima desvía la lanza; Javi bloquea la patada, resbala y hace un backflip
      [2.64, A_WRENCHED],
      [3.16, A_BLOCK_KICK],
      [3.46, A_SKID_BACK],
      [3.62, A_FLIP_1],
      [3.78, A_FLIP_2],
      [3.94, A_FLIP_3],
      [4.10, A_FLIP_LAND],
      // Acto IV: Barrido bajo de 360° a ras del suelo
      [4.42, F(A_COIL_THRUST, -1)],
      [4.66, A_SWEEP_1],
      [4.92, A_SWEEP_2],
      [5.20, A_SWEEP_REC],
      // Acto V: Rotación evasiva y combo de 3 cortes que rompen la guardia
      [5.46, A_PARRY_SPIN],
      [5.72, A_COMBO_1],
      [5.98, A_COMBO_2],
      [6.26, A_COMBO_3],
      // Acto VI: Salto mortal hacia adelante, caída en picado sobre la guardia de la víctima y estocada final
      [6.66, A_LEAP_START],
      [6.86, A_SOMERSAULT_1],
      [7.04, A_SOMERSAULT_2],
      [7.22, A_DIVE_SLAM],
      [7.44, makeDivePress(1)],
      [7.64, makeDivePress(-1)],
      [7.84, makeDivePress(1)],
      [8.02, A_FINAL_COIL],
      [8.18, A_FINAL_SMEAR],
      [8.42, A_FINAL_HOLD],
      [8.75, 'javiHero'],
    ],
    vic: [
      // Acto I: Puñetazo choca contra la lanza de Javi y sale desviado
      [0, V_ATTACK_IN],
      [.12, V_CLASH_PARRY],
      [.36, V_DEFLECTED_1],
      [.66, V_DEFLECTED_2],
      [.94, 'vJReady'],
      // Acto II: Atrapa la lanza con ambas manos e intenta frenarla resbalando hacia atrás con tensión continua
      [1.08, makeBrakeStruggle(0, 1)],
      [1.32, makeBrakeStruggle(1, -1)],
      [1.58, makeBrakeStruggle(2, 1)],
      [1.84, makeBrakeStruggle(3, -1)],
      [2.12, makeBrakeStruggle(4, 1)],
      [2.38, makeBrakeStruggle(5, -1)],
      // Acto III: Desvía la lanza a un lado y lanza una patada giratoria en salto
      [2.64, V_WRENCH_OUT],
      [2.86, V_KICK_WIND],
      [3.16, V_SPIN_KICK],
      [3.48, V_KICK_LAND],
      // Acto IV: Corre hacia Javi con zancadas reales y salta por encima del barrido 360°
      [3.78, makeRunPose(1)],
      [4.04, makeRunPose(-1)],
      [4.28, makeRunPose(1)],
      [4.50, makeRunPose(-1)],
      [4.68, V_VAULT_UP],
      [4.92, V_VAULT_APEX],
      [5.18, V_DROP_SMASH],
      // Acto V: Cae golpeando, recibe el desvío y se cubre con los brazos cruzados hasta que rompen su guardia
      [5.46, V_DEFLECTED_1],
      [5.72, V_COVER_1],
      [5.98, V_COVER_2],
      [6.26, V_GUARD_BROKEN],
      [6.66, V_DEFLECTED_2],
      [7.04, 'vJReady'],
      // Acto VI: Frena la lanza sobre su cabeza cayendo de rodillas y recibe la estocada final
      [7.22, makeKneelBlock(1)],
      [7.44, makeKneelBlock(-1)],
      [7.64, makeKneelBlock(1)],
      [7.84, makeKneelBlock(-1)],
      [8.04, V_GUARD_BROKEN],
      [8.18, 'vJPierced'],
      [8.42, 'vJLaunch'],
      [8.75, 'vJFloat'],
    ],
    // Trayectoria de Javi (con pasos intermedios en todos los giros para evitar saltos bruscos de ángulo)
    apos: [
      [0, 0, 0, 0, 0],
      [.12, 0, 0, -.24, .06],
      [.34, 0, 0, .08, -.18],
      [.54, -.12, 0, -.06, -1.65],
      [.72, 0, 0, -.18, -3.95],
      [.92, .08, 0, -.26, -TAU],
      // Empuje continuo durante la frenada de lanza
      [1.08, 0, 0, .48, -TAU],
      [1.45, 0, 0, 1.05, -TAU],
      [1.85, 0, 0, 1.65, -TAU],
      [2.25, 0, 0, 2.22, -TAU],
      [2.52, 0, 0, 2.55, -TAU],
      [2.85, 0, 0, 2.35, -TAU],
      // Bloquea la patada, resbala hacia atrás y ejecuta el backflip aéreo
      [3.16, 0, 0, 2.15, -TAU],
      [3.48, 0, 0, .85, -TAU],
      [3.64, 0, .85, .35, -TAU],
      [3.80, 0, 1.42, -.15, -TAU],
      [3.96, 0, .75, -.55, -TAU],
      [4.10, 0, 0, -.78, -TAU],
      // Barrido bajo de 360° (giro completo suave de -TAU a -2*TAU)
      [4.42, 0, 0, -.65, -TAU],
      [4.62, .18, 0, -.25, -TAU - 1.57],
      [4.80, 0, 0, .08, -TAU - 3.14],
      [4.98, -.18, 0, .28, -TAU - 4.71],
      [5.18, 0, 0, .38, -2 * TAU],
      // Paso lateral con rotación evasiva (de -2*TAU a -3*TAU) y avance en combo
      [5.46, -.52, 0, .62, -2 * TAU - 1.4],
      [5.72, -.18, 0, 1.12, -2 * TAU - 3.2],
      [5.98, .16, 0, 1.58, -2 * TAU - 4.8],
      [6.26, 0, 0, 2.02, -3 * TAU],
      // Salto mortal del Dragón hacia adelante
      [6.66, 0, .35, 2.15, -3 * TAU],
      [6.86, 0, 1.85, 2.08, -3 * TAU],
      [7.04, 0, 2.45, 1.98, -3 * TAU],
      [7.22, 0, .55, 1.88, -3 * TAU],
      [7.84, 0, .42, 1.88, -3 * TAU],
      // Retroceso corto para cargar el taladro y estocada relámpago final
      [8.02, 0, 0, 1.12, -3 * TAU],
      [8.18, 0, 0, 2.35, -3 * TAU],
      [8.80, 0, 0, 2.35, -3 * TAU],
    ],
    // Trayectoria de la víctima
    vpos: [
      [0, 0, 0, 1.52, 0],
      [.12, 0, 0, 1.32, 0],
      [.36, .16, 0, 1.78, -.18],
      [.68, .08, 0, 1.92, -.08],
      [.94, 0, 0, 1.85, 0],
      // De 1.10 a 2.55s `lock` posiciona a la víctima frente a la punta; dejamos la curva sincronizada
      [1.08, 0, 0, 1.92, 0],
      [2.52, 0, 0, 3.98, 0],
      [2.68, -.18, 0, 3.85, .22],
      // Giro de 360° para la patada circular en salto
      [2.88, -.08, .15, 3.62, 1.85],
      [3.04, 0, .62, 3.35, 3.95],
      [3.16, 0, .48, 3.12, TAU],
      [3.48, 0, 0, 3.28, TAU],
      // Sprint agresivo hacia Javi
      [3.78, 0, 0, 2.65, TAU],
      [4.04, 0, 0, 1.85, TAU],
      [4.28, 0, 0, 1.12, TAU],
      [4.50, 0, 0, .55, TAU],
      // Salto acrobático por encima del barrido de Javi
      [4.68, .12, 1.15, .18, TAU],
      [4.92, 0, 1.62, .38, TAU],
      [5.18, -.08, .45, .95, TAU],
      [5.46, -.22, 0, 1.48, TAU],
      // Retrocede cubriéndose ante el combo de 3 cortes de Javi
      [5.72, 0, 0, 1.98, TAU],
      [5.98, 0, 0, 2.52, TAU],
      [6.26, 0, 0, 3.08, TAU],
      [6.66, 0, 0, 3.12, TAU],
      // Cae de rodillas frenando el salto mortal de Javi y sale disparada al final
      [7.22, 0, -.32, 3.08, TAU],
      [7.84, 0, -.38, 3.08, TAU],
      [8.04, 0, 0, 3.12, TAU],
      [8.18, 0, .35, 3.35, TAU],
      [8.80, 0, .55, 3.65, TAU],
    ],
    ev: [
      // Acto I: Choque del Parry y desvío
      { t: .10, hit: 2, fx: 'spark', at: 'tip', sfx: 'clang', imp: 1, hs: .08, shake: .55, text: '¡PARRY!', who: 'att' },
      { t: .12, fx: 'ring', at: 'tip', r: 2.6, face: 1 },
      { t: .34, fx: 'arc', tilt: .58, r: 2.1, len: 2.9, dir: -1, col: '#4fc3f7', sfx: 'swing', shake: .25 },
      { t: .54, twirl: [1, .34], sfx: 'draw' },
      { t: .88, fx: 'charge', at: 'att', sfx: 'zap' },

      // Acto II: Estocada y forcejeo con la víctima frenando la lanza con las manos
      { t: 1.08, hit: 3, fx: 'stab', at: 'vic', imp: 1, hs: .09, shake: .65, text: '¡FRENA LA LANZA!', who: 'vic' },
      { t: 1.10, fx: 'ring', at: 'tip', r: 2.8, face: 1 },
      { t: 1.28, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .22 },
      { t: 1.32, fx: 'dust', at: 'vic' },
      { t: 1.52, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .24 },
      { t: 1.58, fx: 'dust', at: 'vic' },
      { t: 1.78, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'zap', shake: .25 },
      { t: 1.84, fx: 'dust', at: 'vic' },
      { t: 2.04, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .28 },
      { t: 2.12, fx: 'dust', at: 'vic' },
      { t: 2.30, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'clang', shake: .32 },
      { t: 2.38, fx: 'dust', at: 'vic' },

      // Acto III: Desvío, patada giratoria, bloqueo deslizante y backflip
      { t: 2.62, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35, text: '¡FUERA!', who: 'vic' },
      { t: 2.95, sfx: 'swing' },
      { t: 3.16, fx: 'spark', at: 'att', sfx: 'clang', imp: 1, hs: .07, shake: .55 },
      { t: 3.18, fx: 'ring', at: 'att', r: 2.5, face: 1 },
      { t: 3.30, fx: 'dust', at: 'att' },
      { t: 3.44, fx: 'dust', at: 'att' },
      { t: 3.56, twirl: [1, .45], sfx: 'dash' },
      { t: 4.10, fx: 'dust', at: 'att', sfx: 'heavy', shake: .22 },

      // Acto IV: Barrido bajo de 360° y salto acrobático de la víctima
      { t: 4.62, fx: 'arc', tilt: .06, r: 2.6, len: 3.8, dir: 1, col: '#4fc3f7', sfx: 'swing', shake: .35 },
      { t: 4.68, fx: 'ring', at: 'ground', r: 3.4 },
      { t: 4.72, sfx: 'dash' },
      { t: 4.90, fx: 'arc', tilt: -.06, r: 2.5, len: 3.6, dir: 1, col: '#ffd54f', sfx: 'swing' },

      // Acto V: Intercambio rápido y ruptura de guardia
      { t: 5.44, fx: 'spark', at: 'tip', sfx: 'clang', hs: .05, shake: .4 },
      { t: 5.72, hit: 2, fx: 'arc', tilt: .35, r: 2.2, len: 3.0, dir: 1, col: '#4fc3f7', sfx: 'clang', shake: .3 },
      { t: 5.74, fx: 'dust', at: 'vic' },
      { t: 5.98, hit: 2, fx: 'arc', tilt: -.48, r: 2.2, len: 3.0, dir: -1, col: '#ffd54f', sfx: 'clang', shake: .35 },
      { t: 6.00, fx: 'dust', at: 'vic' },
      { t: 6.12, twirl: [1, .26] },
      { t: 6.26, hit: 4, fx: 'impact', at: 'vic', imp: 1, hs: .09, shake: .65, text: '¡GUARDIA ROTA!', who: 'att' },
      { t: 6.28, fx: 'ring', at: 'vic', r: 3.2, face: 1 },

      // Acto VI: Salto mortal del Dragón, frenada de rodillas agrietando el suelo y remate final
      { t: 6.66, fx: 'dust', at: 'att', sfx: 'dash' },
      { t: 6.86, twirl: [1, .32], fx: 'charge', at: 'att' },
      { t: 7.22, hit: 4, fx: 'boom', at: 'vic', r: 2.8, imp: 1, hs: .11, shake: .85 },
      { t: 7.24, fx: 'crack', at: 'ground', r: 4.5 },
      { t: 7.25, fx: 'ring', at: 'ground', r: 4.2 },
      { t: 7.44, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'zap', shake: .3 },
      { t: 7.64, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35 },
      { t: 7.86, twirl: [3, .30], fx: 'charge', at: 'att', text: '¡LANZA DEL DRAGÓN!', who: 'att', slow: .24 },
      { t: 8.18, fx: 'stab', at: 'vic', imp: 1, hs: .18, shake: 1.1 },
      { t: 8.19, fx: 'boom', at: 'vic', big: 1, r: 4.4 },
      { t: 8.20, fx: 'ring', at: 'vic', r: 3.8, face: 1 },
      { t: 8.21, fx: 'crack', at: 'ground', r: 5.5 },
      { t: 8.22, rel: { dmg: 18, kb: 28, up: 9, rag: 2.5 }, slow: .28 },
    ],
    shots: [
      [0, 'cl', { s: 1, d: 3.2, h: .15, fov: 44, roll: -.05 }],
      [.34, 'two', { s: -1, fov: 50, roll: .04 }],
      [.94, 'faceA', { s: 1, fov: 40, roll: -.04 }],
      [1.10, 'clv', { s: -1, d: 3.0, h: .1, fov: 46, roll: .06 }],
      [1.75, 'orbit', { r: 3.6, h: 1.25, w: 1.3, a0: .5, fov: 50 }],
      [2.62, 'two', { s: 1, fov: 54, roll: -.05 }],
      [3.16, 'cl', { s: -1, d: 3.6, fov: 50, roll: .06 }],
      [3.54, 'low', { s: 1, fov: 54 }],
      [4.45, 'ground', { s: -1, fov: 56, roll: -.04 }],
      [5.44, 'two', { s: 1, fov: 48, roll: .05 }],
      [6.18, 'clv', { s: -1, d: 3.3, fov: 46, roll: -.07 }],
      [6.66, 'low', { s: -1, fov: 56 }],
      [7.20, 'clv', { s: 1, d: 3.1, h: -.1, fov: 44, roll: .07 }],
      [7.86, 'faceA', { s: -1, fov: 38, roll: -.05 }],
      [8.16, 'clv', { s: -1, d: 3.8, fov: 48, roll: .08 }],
      [8.45, 'hero', { s: -1 }],
    ],
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
