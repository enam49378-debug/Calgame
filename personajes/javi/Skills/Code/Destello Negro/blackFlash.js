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
