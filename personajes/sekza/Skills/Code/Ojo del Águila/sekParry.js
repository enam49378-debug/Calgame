/* Habilidad: Ojo del Águila  ·  personaje: sekza  ·  movimiento: sekParry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Ojo del Águila: parry. Si la golpean durante la ventana, esquiva y contraataca desde atrás (mecánica de contra)
CF.mover('sekParry', function (f, o) {
    startAction(f, { name: 'sekParry', bbClip: 'habilidad_3_parry', dur: .9, counter: true, speedMul: 0, anim: [[0, 'counter', 700]], start: () => { ringAt(chestOf(f), o.color, 1.8, .35, 'face', f.yaw); sfx('block', f.pos); } });
  });
