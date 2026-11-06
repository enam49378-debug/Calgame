/* Habilidad: Tinku  ·  personaje: randi  ·  movimiento: randiTinku
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiTinku', function (f, o) {
    startAction(f, {
      name: 'randiTinku', dur: 1.1, noControl: true, speedMul: 0, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡TINKU!', '#ffd23f', 28),
      steps: [{ at: .5, fn: () => randiTinku(f) }],
    });
  });
