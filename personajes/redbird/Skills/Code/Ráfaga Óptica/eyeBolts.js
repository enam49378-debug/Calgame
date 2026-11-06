/* Habilidad: Ráfaga Óptica  ·  personaje: redbird  ·  movimiento: eyeBolts
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('eyeBolts', function (f, o) {
    startAction(f, {
      name: 'bolts', dur: .5, eyes: true, aim: true, speedMul: .4, anim: [[0, 'visorTouch', 800]],
      steps: [.1, .2, .3].map(at => ({ at, fn: () => { f.yaw = aimYawFor(f); spawnProj(f, f.yaw, Object.assign({}, o, { eyes: true })); sfx('zap', f.pos, .6); } })),
    });
  });
