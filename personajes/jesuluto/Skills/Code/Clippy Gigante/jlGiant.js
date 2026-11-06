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
