/* Habilidad: Paloma Mensajera  ·  personaje: randi  ·  movimiento: randiPaloma
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPaloma', function (f, o) {
    startAction(f, {
      name: 'randiPaloma', dur: .55, speedMul: .3, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Paloma mensajera!', '#e6ecf2', 20),
      steps: [{ at: .2, fn: () => { jlPigeon(f, 0, { dmg: o.dmg || 3.2, marks: 2, fast: true }); sfx('whoosh', f.pos); } }],
    });
  });
