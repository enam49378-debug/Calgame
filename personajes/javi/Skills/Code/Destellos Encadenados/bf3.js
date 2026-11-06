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
