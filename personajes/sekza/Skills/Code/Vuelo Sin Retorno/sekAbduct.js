/* Habilidad: Vuelo Sin Retorno  ·  personaje: sekza  ·  movimiento: sekAbduct   (habilidad 3 del despertar)
   Sekza se agacha y da un dash intentando agarrar a alguien. Las dos animaciones (hechas en BBS) son IGUALES hasta el tick 19 (0.95 s):
   en ese tick se decide: si la víctima está al alcance se agarra y arranca la cinemática sekPlane (Skills/Animation/Vuelo Sin Retorno: agarrar_sekza /
   agarrar_victima, que continúan desde el tick 19-20); si no, sigue la animación de fallo "sin_agarrar" (voltereta y aterrizaje agachado)
   y la habilidad se recarga rápido.
   Para llegar a ese punto con cualquier distancia, la parte del dash antes del tick 19 se estira/acorta: Sekza queda a ~1.8 m de la víctima (como en la película).
   El recorrido sale de la animación (tools/bbs_a_clip.py imprime "RECORRIDO"). Los números (alcance, recarga) están en personaje.js. */
CF.mover('sekAbduct', function (f, o) {
  javiSpeak(f, 'fly');
  const RANGE = o.range || 9, CLIP = 1.75, T_DECIDE = .95, GAP = 1.78;   // T_DECIDE = tick 19; GAP = a qué distancia de la víctima queda Sekza en ese tick (película)
  // metros hacia adelante según la animación de BBS: [segundos, distancia acumulada]
  const PATH = [[0, 0], [.6, 0], [.793, 1.084], [.843, 1.312], [.9, 1.599], [.95, 1.847], [1.05, 2.944], [1.1, 3.64], [1.15, 4.532], [1.25, 6.094], [1.4, 7.163], [CLIP, 7.163]];
  const speedAt = t => { for (let i = 0; i < PATH.length - 1; i++) if (t >= PATH[i][0] && t < PATH[i + 1][0]) return (PATH[i + 1][1] - PATH[i][1]) / (PATH[i + 1][0] - PATH[i][0]); return 0; };
  let grabbed = false, decided = false, scaled = false, scale = 1;
  const tg0 = findTarget(f, RANGE);
  startAction(f, {
    name: 'sekAbduct', bbClip: 'sin_agarrar', dur: CLIP, noControl: true, armor: true, aim: true, speedMul: 0, eyes: true,
    start: () => { sfx('whoosh', f.pos, .6); popText(chestOf(f), '¡VEN AQUÍ!', o.color, 22); },
    tick: (a, t, dt) => {
      if (grabbed) return;
      const pick = () => {   // el rival vivo más cercano (el que se apuntó al empezar, si sigue ahí)
        let tg = tg0 && tg0.alive && !tg0.cineLock ? tg0 : null, bd = 1e9;
        if (!tg) for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (g.alive && !g.cineLock && !g.grabbed && d < bd && d < RANGE + 4) { bd = d; tg = g; } }
        return tg;
      };
      // el dash arranca en t = .6: de ahí al tick 19 se ajusta su largo para quedar a ~1.8 m del rival, sea cual sea la distancia
      if (t < .6) { f.vel.x = f.vel.z = 0; const tg = pick(); if (tg) f.yaw = yawTo(f, tg); return; }   // agachado, apuntando al rival
      if (!scaled) { scaled = true; const tg = pick(); scale = tg ? clamp((dist2d(f, tg) - GAP - .29) / PATH[5][1], .4, 4.6) : 1; }
      const v = speedAt(t) * (t < T_DECIDE ? scale : 1);
      if (v <= 0) { f.vel.x = f.vel.z = 0; return; }
      const tg = t < T_DECIDE ? pick() : null;
      if (tg) f.yaw = Math.atan2(tg.pos.x - f.pos.x, tg.pos.z - f.pos.z);   // gira hacia el rival mientras avanza; después del tick 19 sigue recto
      const dir = fwd(f.yaw);
      f.vel.x = dir.x * v; f.vel.z = dir.z * v; f.vel.y = Math.max(f.vel.y, 0);
      if (t >= .79 && t < 1.4) {
        emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
        if (Math.floor(t * 30) !== Math.floor((t - dt) * 30)) ghost(f, o.color, .3, .2);
      }
      // TICK 19: aquí se decide. Si hay alguien al alcance, se agarra y la película sigue desde el tick 20; si no, sigue la animación de fallo.
      if (!decided && t >= T_DECIDE) {
        decided = true;
        for (const g of enemiesOf(f)) {
          if (!g.alive || g.cineLock || g.grabbed || g.ragdoll > 0 || dist2d(f, g) > GAP + 1.0 || Math.abs(g.pos.y - f.pos.y) > 2.2) continue;
          grabbed = true; f.vel.x = f.vel.z = 0;
          if (!f.remote) later(.01, () => { if (f.alive && g.alive) runChore(f, g, CHORE.sekPlane); });   // en los demás clientes la escena llega por su propio aviso
          break;
        }
      }
    },
    onEnd: () => {
      f.vel.x *= .2; f.vel.z *= .2;
      if (!grabbed) { popText(chestOf(f), '¡Falló!', '#aab', 18); sfx('miss', f.pos, .5); if (typeof o.slot === 'number') f.cd[o.slot] = Math.min(f.cd[o.slot], 4); }
    },
  });
});
