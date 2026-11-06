/* Habilidad: Pisco Sour  ·  personaje: randi  ·  movimiento: randiPisco
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiPisco', function (f, o) {
    startAction(f, {
      name: 'randiPisco', dur: .85, speedMul: .3, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡Un pisco sour!', '#ffe9a0', 22),
      steps: [{ at: .5, fn: () => {
        f.pisco = o.dur || 7; f.hp = Math.min(f.maxHp, f.hp + 6);
        burst(chestOf(f), 34, '#ffe9a0', 9, .2, .6, .4); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 3, .5);
        popText(chestOf(f), '¡CHISPEADO!', '#ffd23f', 26); sfx('dash', f.pos);
      } }],
    });
  });
