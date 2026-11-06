/* Habilidad: Cuyes Bomba  ·  personaje: randi  ·  movimiento: randiCuyes
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiCuyes', function (f, o) {
    startAction(f, {
      name: 'randiCuyes', dur: .7, speedMul: .3, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Cuyes!', '#d9a05b', 20),
      steps: [{ at: .3, fn: () => { for (let i = 0; i < 4; i++) randiCuy(f, (i - 1.5) * .3, o); sfx('whoosh', f.pos); } }],
    });
  });
