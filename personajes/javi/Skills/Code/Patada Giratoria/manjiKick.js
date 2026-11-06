/* Habilidad: Patada Giratoria  ·  personaje: javi  ·  movimiento: manjiKick
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('manjiKick', function (f, o) {
    const F = () => fwd(f.yaw), kick = (dmg, kb, up, rag, fin) => () => {
      f.vel.x += F().x * (fin ? 4 : 2); f.vel.z += F().z * (fin ? 4 : 2); const p = front(f, 1.5, 1.0);
      slashLine(front(f, .3, .5), front(f, 2.6, 1.3), '#ffffff', .16, .16); sfx('swing', f.pos, .7);
      if (hitArea(f, p, fin ? 1.5 : 1.3, { dmg, kb, up, ragdoll: rag, stun: fin ? 0 : .5, color: o.color, set: new Set(), hitstop: fin ? .12 : .04, shake: fin ? .6 : .2 })) { impactStar(p, '#ffffff', fin ? 2.4 : 1.4, .2); burst(p, fin ? 20 : 8, o.color, 8, .14, .3, 0); }
      if (fin) { ghost(f, o.color, .5, .3); worldDamage(p, 3.4, 1.1, 14, .9); }
    };
    startAction(f, {
      name: 'manji', dur: 1.05, aim: true, speedMul: .35, anim: [[0, 'kick_w', 800], [.1, 'kick', 1500], [.3, 'kick_w', 700], [.36, 'kick', 1500], [.58, 'spinPose', 900], [.66, 'kick', 1700]],
      steps: [{ at: .14, fn: kick(4, 3, 0, 0) }, { at: .4, fn: kick(4, 3, 0, 0) }, { at: .72, fn: kick(9, 21, 6, 1.2, true) }],
    });
  });
