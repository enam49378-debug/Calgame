/* Habilidad: Rueda de Adaptación  ·  personaje: capitan  ·  movimiento: capAdapt
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Rueda de Adaptación (como el modo defensa de Mahoraga): el próximo golpe que reciba lo cura y lo adapta a ese rival
CF.mover('capAdapt', function (f, o) {
    startAction(f, {
      name: 'capAdapt', dur: .45, speedMul: .4, anim: [[0, 'vpose', 500]],
      start: () => { f.capDef = 3.5; popText(chestOf(f), '¡Modo defensa!', '#ffd23f', 22); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 3.5, .5); sfx('tp', f.pos); f.wheelPulse = 1; },
    });
  });
