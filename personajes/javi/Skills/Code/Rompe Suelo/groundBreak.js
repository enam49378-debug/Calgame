/* Habilidad: Rompe Suelo  ·  personaje: javi  ·  movimiento: groundBreak
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('groundBreak', function (f, o) {
    startAction(f, {
      name: 'gbreak', dur: 1.05, aim: true, speedMul: .25, anim: [[0, 'lift', 700], [.4, 'plunge', 1800]],
      start: () => { f.vel.y = 15; sfx('dash', f.pos); },
      steps: [
        { at: .36, fn: () => { f.vel.y = -34; sfx('swing', f.pos); } },
        { at: .62, fn: () => {
          const c = new V3(f.pos.x, f.pos.y + .5, f.pos.z); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ff2a3c', 9, .6); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffffff', 6, .45); burst(c, 40, '#ffd9a0', 11, .22, .6, .6); burst(c, 18, '#ff2a3c', 9, .16, .5, 0);
          impactStar(c, '#ffffff', 3.6, .35); sfx('break', f.pos); G.hitstop = Math.max(G.hitstop, .12);
          hitArea(f, c, 6.5, { dmg: 17, kb: 18, up: 9, ragdoll: 1.4, color: '#ff2a3c', guardBreak: true, set: new Set(), shake: 1 }); worldDamage(c, 8, 2.2, 34, 2.2);
        } },
      ],
    });
  });
