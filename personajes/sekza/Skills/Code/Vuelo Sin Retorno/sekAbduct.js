/* Habilidad: Vuelo Sin Retorno  ·  personaje: sekza  ·  movimiento: sekAbduct   (habilidad 3 del despertar)
   Sekza da un dash intentando agarrar a alguien. Si no atrapa a nadie, solo falla: se ve la animación "sin agarrar" (hecha en BBS:
   Skills/Animation/Vuelo Sin Retorno/sin_agarrar.json) con su voltereta y su aterrizaje agachado, y la habilidad se recarga rápido.
   Si agarra a alguien arranca la cinemática sekPlane (Skills/Animation/Vuelo Sin Retorno): lo gira, lo lanza al cielo, lo golpea con pajarones,
   lo mete a un avión, lo persigue por el pasillo y lo estrella contra el suelo.
   El recorrido del dash sale de la animación (tools/bbs_a_clip.py imprime "RECORRIDO"): se agacha 0.6 s, avanza ~7.2 m en 0.8 s y cae agachado.
   Los números (alcance, recarga) están en personaje.js. */
CF.mover('sekAbduct', function (f, o) {
  javiSpeak(f, 'fly');
  const RANGE = o.range || 9, CLIP = 1.75;
  // metros hacia adelante según la animación de BBS: [segundos, distancia acumulada]
  const PATH = [[0, 0], [.6, 0], [.793, 1.084], [.843, 1.312], [.9, 1.599], [.95, 1.847], [1.05, 2.944], [1.1, 3.64], [1.15, 4.532], [1.25, 6.094], [1.4, 7.163], [CLIP, 7.163]];
  const speedAt = t => { for (let i = 0; i < PATH.length - 1; i++) if (t >= PATH[i][0] && t < PATH[i + 1][0]) return (PATH[i + 1][1] - PATH[i][1]) / (PATH[i + 1][0] - PATH[i][0]); return 0; };
  let grabbed = false;
  const tg0 = findTarget(f, RANGE);
  startAction(f, {
    name: 'sekAbduct', bbClip: 'sin_agarrar', dur: CLIP, noControl: true, armor: true, aim: true, speedMul: 0, eyes: true,
    start: () => { sfx('whoosh', f.pos, .6); popText(chestOf(f), '¡VEN AQUÍ!', o.color, 22); },
    tick: (a, t, dt) => {
      if (grabbed) return;
      const v = speedAt(t);
      if (v <= 0) { f.vel.x = f.vel.z = 0; if (t < .6 && tg0 && tg0.alive) f.yaw = yawTo(f, tg0); return; }   // agachado, apuntando al rival
      // sigue al más cercano mientras avanza (gira un poco durante el dash)
      let tg = tg0 && tg0.alive && !tg0.cineLock ? tg0 : null, bd = 1e9;
      if (!tg) for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (g.alive && !g.cineLock && d < bd && d < RANGE + 4) { bd = d; tg = g; } }
      if (tg && t < 1.1) f.yaw = Math.atan2(tg.pos.x - f.pos.x, tg.pos.z - f.pos.z);
      const dir = fwd(f.yaw);
      f.vel.x = dir.x * v; f.vel.z = dir.z * v; f.vel.y = Math.max(f.vel.y, 0);
      if (t >= .79 && t < 1.4) {
        emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
        if (Math.floor(t * 30) !== Math.floor((t - dt) * 30)) ghost(f, o.color, .3, .2);
        for (const g of enemiesOf(f)) {
          if (!g.alive || g.cineLock || g.grabbed || g.ragdoll > 0 || dist2d(f, g) > 2.2 || Math.abs(g.pos.y - f.pos.y) > 2.2) continue;
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
