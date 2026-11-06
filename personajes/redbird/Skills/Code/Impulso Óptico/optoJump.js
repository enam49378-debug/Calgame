/* Habilidad: Impulso Óptico  ·  personaje: redbird  ·  movimiento: optoJump
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('optoJump', function (f, o) {
    startAction(f, {
      name: 'optojump', dur: .7, eyes: true, noControl: true, anim: [[0, 'lookDown', 800], [.18, 'jump', 500]],
      steps: [{ at: .15, fn: () => {
        const p = new V3(f.pos.x, f.pos.y + .3, f.pos.z), F = fwd(f.yaw);
        slashLine(new V3(f.pos.x + F.x * .3, f.pos.y + 1.72, f.pos.z + F.z * .3), p, o.color, .25, .3);
        explode(f, p, 3.5, { dmg: 7, kb: 14, up: 10, ragdoll: .9, guardBreak: true, color: o.color });
        f.vel.set(F.x * 6, 17, F.z * 6); f.onGround = false; f.iframes = Math.max(f.iframes, .3);
      } }],
    });
  });
