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
