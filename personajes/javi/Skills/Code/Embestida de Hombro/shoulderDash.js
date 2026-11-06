/* Habilidad: Embestida de Hombro  ·  personaje: javi  ·  movimiento: shoulderDash
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('shoulderDash', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'shdash', dur: .75, aim: true, noControl: true, lockYaw: true, ghost: true, anim: [[0, 'charge', 800], [.1, 'mega', 1100]],
      start: () => { sfx('dash', f.pos); sfx('swing', f.pos); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t < .42) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30; emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ff2a3c', .2, .3, 0, 3);
          if (hitArea(f, front(f, 1.2, 1.1), 1.4, { dmg: 8, kb: 14, up: 4, ragdoll: .9, color: '#ff2a3c', guardBreak: true, set, hitstop: .06, shake: .4 })) { impactStar(front(f, 1.2, 1.1), '#ffffff', 2, .2); worldDamage(front(f, 1.6, 1.1), 3, 1, 12, 1.2); }
        } else if (!a.stopped) { a.stopped = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1; }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });
