/* Habilidad: Spin Dash  ·  personaje: mattux  ·  movimiento: sonSpin
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonSpin', function (f, o) {
    const sup = !!o.sup, T = sup ? .38 : .5, D = sup ? .8 : .58; let hitT = 0, set = new Set();
    startAction(f, {
      name: 'sonspin', dur: T + D + .25, aim: true, noControl: true, lockYaw: true, speedMul: 0, anim: [[0, 'ball', 500]], spinX: 14,
      start: () => { sfx('dash', f.pos, .6); popText(chestOf(f), sup ? '¡SÚPER SPIN DASH!' : '¡SPIN DASH!', o.color, 22); },
      tick: (a, t, dt) => {
        const F = fwd(f.yaw);
        if (t < T) {   // carga: gira cada vez más rápido y levanta polvo
          a.spinX = 12 + t / T * 40; f.vel.x *= .8; f.vel.z *= .8;
          if (Math.random() < .7) emit(f.pos.x - F.x * .4 + rand(-.3, .3), f.pos.y + .15, f.pos.z - F.z * .4 + rand(-.3, .3), -F.x * rand(2, 5), rand(.5, 2), -F.z * rand(2, 5), '#e8d9b0', .16, .35, .2, 2);
        } else if (t < T + D) {
          if (!a.go) { a.go = true; a.ghost = true; sfx('swing', f.pos, .8); G.fovKick = Math.max(G.fovKick, 6); ringAt(new V3(f.pos.x, f.pos.y + .8, f.pos.z), o.color, 3, .3); }
          a.spinX = 46; f.vel.x = F.x * (sup ? 38 : 27); f.vel.z = F.z * (sup ? 38 : 27);
          emit(f.pos.x, f.pos.y + rand(.3, 1.3), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), Math.random() < .5 ? o.color : '#ffffff', .22, .35, 0, 3);
          hitT -= dt; if (hitT <= 0) { hitT = sup ? .17 : .26; set = new Set(); }
          if (hitArea(f, front(f, .5, .9), 1.4, { dmg: o.dmg || 7, kb: 7, up: 5, ragdoll: .55, color: o.color, set, hitstop: .03, shake: .25 })) { impactStar(front(f, .6, .9), '#ffffff', 1.6, .15); worldDamage(front(f, 1.2, .8), 2.6, .8, o.dmg || 7, .8); }
        } else if (a.go && !a.end) { a.end = true; a.ghost = false; a.spinX = 0; f.vel.x *= .2; f.vel.z *= .2; a.anim = [[t, 'idle', 500]]; }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });
