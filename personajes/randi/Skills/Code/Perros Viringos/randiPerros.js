/* Habilidad: Perros Viringos  ·  personaje: randi  ·  movimiento: randiPerros
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPerros', function (f, o) {
    startAction(f, {
      name: 'randiPerros', dur: .85, speedMul: .25, aim: true, anim: [[0, 'point', 500]],
      start: () => popText(chestOf(f), '¡Perros viringos!', '#e6b8b8', 22),
      steps: [{ at: .35, fn: () => { randiDog(f, -1, 9); randiDog(f, 1, 9); sfx('whoosh', f.pos); } }],
    });
  });
