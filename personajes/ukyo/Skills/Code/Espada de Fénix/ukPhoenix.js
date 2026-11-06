/* Habilidad: Espada de Fénix  ·  personaje: ukyo  ·  movimiento: ukPhoenix
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Espada de Fénix (despierta): se enciende la espada: más velocidad y cada golpe quema
CF.mover('ukPhoenix', function (f, o) {
    startAction(f, {
      name: 'ukPhoenix', bbClip: 'despertar_fenix', dur: .7, speedMul: .1, aim: true, armor: true,
      steps: [{ at: .3, fn: () => {
        f.fireT = o.dur || 10; burst(chestOf(f), 40, '#ff7a1a', 9, .25, .7, -.2); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff7a1a', 5, .6); lightColumn(f.pos, '#ff7a1a', 12); sfx('ult', f.pos, .7);
        if (f.isPlayer) showBanner('ESPADA DE FÉNIX', '#ff7a1a', `${Math.round(f.fireT)} s de fuego`);
      } }],
    });
  });
