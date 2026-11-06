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
