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
