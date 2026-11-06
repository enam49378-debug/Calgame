/* Habilidad: Parry  ·  personaje: sebolla  ·  movimiento: sebParry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Parry: ventana corta, el contraataque lo hace applyHit con sebCounter
CF.mover('sebParry', function (f, o) {
    startAction(f, {
      name: 'sebParry', dur: .75, noControl: true, speedMul: 0, sebParry: true, aim: true, anim: [[0, 'block', 400]],
      start: () => { popText(chestOf(f), '¡Parry!', '#ffd91a', 18); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd91a', 2, .3); verityGo(f, () => front(f, .9, 1.6), .55, 1, 'angry'); },
      tick: (a, t) => { a.sebParry = t < .5; },
    });
  });
