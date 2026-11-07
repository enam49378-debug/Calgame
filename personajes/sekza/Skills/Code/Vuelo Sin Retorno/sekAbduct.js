/* Habilidad: Vuelo Sin Retorno  ·  personaje: sekza  ·  movimiento: sekAbduct   (habilidad 3 del despertar)
   Sekza da un dash intentando agarrar a alguien. Si no atrapa a nadie, solo falla (se frena, tropieza y la habilidad se recarga rápido).
   Si agarra a alguien arranca la cinemática sekPlane (Skills/Animation/Vuelo Sin Retorno): lo gira, lo lanza al cielo, lo golpea con pajarones,
   lo mete a un avión, lo persigue por el pasillo y lo estrella contra el suelo.
   Los números (alcance, recarga) están en personaje.js. */
CF.mover('sekAbduct', function (f, o) {
  javiSpeak(f, 'fly');
  const RANGE = o.range || 15, SPEED = 36;
  let grabbed = false;
  const tg0 = findTarget(f, RANGE);
  startAction(f, {
    name: 'sekAbduct', bbClip: 'despertar_vuelo', dur: .95, noControl: true, armor: true, aim: true, speedMul: 0, eyes: true,
    start: () => { sfx('whoosh', f.pos); popText(chestOf(f), '¡VEN AQUÍ!', o.color, 22); ghost(f, o.color, .4, .25); },
    tick: (a, t, dt) => {
      if (grabbed) return;
      if (t < .12) { f.vel.x = f.vel.z = 0; return; }                          // se agacha un instante
      if (t > .66) { f.vel.x *= .86; f.vel.z *= .86; return; }                   // si no agarró a nadie, se frena y tropieza
      // sigue al más cercano (o al que eligió al empezar) mientras dura el dash
      let tg = tg0 && tg0.alive && !tg0.cineLock ? tg0 : null, bd = 1e9;
      if (!tg) for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (g.alive && !g.cineLock && d < bd && d < RANGE) { bd = d; tg = g; } }
      const dir = tg ? new V3(tg.pos.x - f.pos.x, 0, tg.pos.z - f.pos.z).normalize() : fwd(f.yaw).clone();
      if (tg) f.yaw = Math.atan2(dir.x, dir.z);
      f.vel.x = dir.x * SPEED; f.vel.z = dir.z * SPEED; f.vel.y = Math.max(f.vel.y, 0);
      emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
      if (Math.floor(t * 30) !== Math.floor((t - dt) * 30)) ghost(f, o.color, .3, .2);
      for (const g of enemiesOf(f)) {
        if (!g.alive || g.cineLock || g.grabbed || g.ragdoll > 0 || dist2d(f, g) > 1.9 || Math.abs(g.pos.y - f.pos.y) > 2.2) continue;
        grabbed = true; f.vel.x = f.vel.z = 0;
        if (!f.remote) later(.01, () => { if (f.alive && g.alive) runChore(f, g, CHORE.sekPlane); });   // en los demás clientes la escena llega por su propio aviso
        break;
      }
    },
    onEnd: () => {
      f.vel.x *= .2; f.vel.z *= .2;
      if (!grabbed) { popText(chestOf(f), '¡Falló!', '#aab', 18); sfx('miss', f.pos, .5); if (typeof o.slot === 'number') f.cd[o.slot] = Math.min(f.cd[o.slot], 4); }
    },
  });
});
