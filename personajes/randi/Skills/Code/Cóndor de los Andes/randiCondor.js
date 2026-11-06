/* Habilidad: Cóndor de los Andes  ·  personaje: randi  ·  movimiento: randiCondor
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiCondor', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 10, f.pos.y, f.pos.z + F.z * 10);
    clampArena(dest, 1.5);
    startAction(f, {
      name: 'randiCondor', dur: 1.0, speedMul: .25, aim: true, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡CÓNDOR!', '#ffd23f', 24),
      steps: [{ at: .3, fn: () => randiCondorFly(f, dest, o) }],
    });
  });
