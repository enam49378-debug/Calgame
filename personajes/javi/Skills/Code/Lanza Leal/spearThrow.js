/* Habilidad: Lanza Leal  ·  personaje: javi  ·  movimiento: spearThrow
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('spearThrow', function (f, o) {
    if (f.spearThrown) return false;
    startAction(f, {
      name: 'sthrow', dur: .5, aim: true, speedMul: .3, anim: [[0, 'spearThrowW', 800], [.16, 'spearThrow', 1100]],
      steps: [{ at: .17, fn: () => { f.spearThrown = true; if (f.spear) f.spear.visible = false; spawnSpearProj(f, o); sfx('swing', f.pos); sfx('zap', f.pos, .5); } }],
    });
  });
