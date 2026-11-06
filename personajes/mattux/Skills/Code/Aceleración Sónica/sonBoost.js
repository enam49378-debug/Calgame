/* Habilidad: Aceleración Sónica  ·  personaje: mattux  ·  movimiento: sonBoost
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBoost', function (f, o) {
    const set = new Set();
    startAction(f, {
      name: 'sonboost', dur: 1.05, aim: true, noControl: true, lockYaw: true, ghost: true, speedMul: 0, anim: [[0, 'charge', 400], [.15, 'dash', 1100]],
      start: () => { sfx('dash', f.pos, 1); popText(chestOf(f), '¡ACELERACIÓN SÓNICA!', '#ffd23f', 22); G.fovKick = Math.max(G.fovKick, 9); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (t > .15 && t < .75) {
          f.vel.x = F.x * 46; f.vel.z = F.z * 46; emit(f.pos.x, f.pos.y + rand(.2, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), Math.random() < .5 ? '#ffd23f' : '#ffffff', .28, .4, 0, 3);
          if (hitArea(f, front(f, .8, 1), 1.5, { dmg: o.dmg || 10, kb: 11, up: 5, ragdoll: .8, color: '#ffd23f', set, hitstop: .06, shake: .4, guardBreak: true })) worldDamage(front(f, 1.4, 1), 3, 1, o.dmg || 10, 1.1);
        } else if (t >= .75 && !a.fin) {
          a.fin = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1; const c = new V3(f.pos.x, f.pos.y + .6, f.pos.z);
          ringAt(new V3(c.x, c.y - .4, c.z), '#ffd23f', 6, .5); impactStar(c, '#ffffff', 2.6, .3); sfx('break', f.pos, .8);
          hitArea(f, c, 4.2, { dmg: 6, kb: 9, up: 6, ragdoll: .9, color: '#ffd23f', set: new Set(), shake: .5 }); a.anim = [[t, 'mega', 900]];
        }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });
