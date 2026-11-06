/* Habilidad: Estocada  ·  personaje: ukyo  ·  movimiento: ukLunge
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Estocada: sale disparado con la punta al frente, atraviesa al primer rival, lo arrastra clavado y lo lanza al final
CF.mover('ukLunge', function (f, o) {
    const D = o.dist || 8; let carried = null, dist = 0, released = false;
    startAction(f, {
      name: 'ukLunge', bbClip: 'habilidad_2_estocada', dur: .75, noControl: true, armor: true, aim: true, ghost: true,
      tick: (a, t, dt) => {
        const F = fwd(f.yaw);
        if (t < .15) { f.vel.x = f.vel.z = 0; return; }
        if (dist < D) {
          f.vel.x = F.x * 30; f.vel.z = F.z * 30; dist += 30 * dt;
          if (!carried) {
            for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(front(f, 1.2, 1.1)) < 1.7) {
              carried = g; impactStar(chestOf(g), o.color, 2, .22); sfx('heavy', g.pos, .7);
              applyHit(f, g, { dmg: o.dmg || 7, stun: 1.4, kb: 0, color: o.color, guardBreak: true, hitstop: .08, shake: .4, noCounter: true }); break;
            }
          } else if (carried.alive && !carried.remote) { carried.pos.x = f.pos.x + F.x * 1.4; carried.pos.z = f.pos.z + F.z * 1.4; carried.vel.set(0, 0, 0); }
        } else if (!released) {
          released = true; f.vel.x *= .2; f.vel.z *= .2; a.t = Math.max(a.t, .5);
          if (carried && carried.alive) { applyHit(f, carried, { dmg: o.dmg2 || 5, kb: 14, up: 7, ragdoll: 1, dir: F, color: o.color, hitstop: .1, shake: .35 }); arcSlash(f, o.color, { tilt: 0, r: 1.8, len: 2.2, w: .5 }); }
        }
      },
    });
  });
