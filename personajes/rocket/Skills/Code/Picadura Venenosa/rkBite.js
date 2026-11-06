/* Habilidad: Picadura Venenosa  ·  personaje: rocket  ·  movimiento: rkBite
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Picadura Venenosa: lanzada con la mandíbula abierta; el veneno quita vida durante varios segundos
CF.mover('rkBite', function (f, o) {
    startAction(f, {
      name: 'rkBite', bbClip: 'habilidad_3_picadura', dur: .55, speedMul: .2, aim: true,
      steps: [{ at: .18, fn: () => {
        const F = fwd(f.yaw), c = front(f, 1.5, 1.1); f.vel.x += F.x * 13; f.vel.z += F.z * 13; arcSlash(f, o.color, { tilt: .2, r: 1.5, len: 2, w: .5 }); sfx('slash', f.pos);
        const n = hitArea(f, c, 1.6, { dmg: o.dmg || 5, stun: .6, kb: 2, up: 1, color: o.color, hitstop: .07, shake: .25 });
        if (n) for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(c) < 2.1) poisonOn(g, f, o);
      } }],
    });
  });
