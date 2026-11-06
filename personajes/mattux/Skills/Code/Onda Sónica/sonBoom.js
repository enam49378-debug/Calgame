/* Habilidad: Onda Sónica  ·  personaje: mattux  ·  movimiento: sonBoom
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBoom', function (f, o) {
    startAction(f, {
      name: 'sonboom', dur: .6, aim: true, speedMul: .3, anim: [[0, 'windup', 500], [.18, 'mega', 1300]],
      steps: [{ at: .2, fn: () => {
        for (const off of [-.24, 0, .24]) spawnProj(f, f.yaw + off, { color: o.color, speed: 34, size: .6, long: 2.8, range: 26, dmg: o.dmg || 6, kb: 8, up: 3, stun: .45 });
        sfx('zap', f.pos, .8); ringAt(front(f, 1.2, 1.2), o.color, 2.4, .3); burst(front(f, 1.4, 1.2), 14, '#ffffff', 8, .14, .3, 0);
      } }],
    });
  });
