/* Habilidad: Embestida  ·  personaje: javi  ·  movimiento: lunge
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('lunge', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'lunge', dur: .55, anim: [[0, 'lance', 900]], aim: true, noControl: true, lockYaw: true, ghost: true,
      start: () => { sfx('dash', f.pos); sfx('swing', f.pos); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t < .36) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30;
          emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
          if (hitArea(f, front(f, 1.7, 1.1), 1.2, { dmg: o.dmg || 9, kb: 22, up: 5, ragdoll: .9, dir: F, color: o.color, guardBreak: true, set, hitstop: .06, shake: .35 })) stabFx(f, '#ffffff');
        } else if (!a.stopped) { a.stopped = true; a.ghost = false; f.vel.x *= .15; f.vel.z *= .15; a.anim = [[t, 'thrust', 1100]]; stabFx(f, o.color); }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });
