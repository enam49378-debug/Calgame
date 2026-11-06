/* Habilidad: Torbellino  ·  personaje: javi  ·  movimiento: whirl
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('whirl', function (f, o) {
    let acc = 0, n = 0; const hits = 8;
    startAction(f, {
      name: 'whirl', dur: 1.0, speedMul: .55, anim: [[0, 'spinPose', 900]], spin: f.ch===CHARS.javi ? TAU*4 : 22,
      start: () => { sfx('dash', f.pos); for (const g of G.fighters) if (g !== f && g.alive && dist2d(f, g) < 14) javiSpeak(g, 'reac_torbellino'); },   // reacción de quien lo ve venir
      tick: (a, t, dt) => {
        acc += dt;
        while (acc >= .11 && n < hits) {
          acc -= .11; n++; const last = n === hits, c = chestOf(f);
          arcSlash(f, o.color, { tilt: rand(-.12, .12), len: TAU * .85, r: 2.5, w: .35, dur: .16 });
          for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(c) < 2.8) applyHit(f, g, last ? { dmg: 9, kb: 17, up: 9, ragdoll: 1.1, color: o.color, guardBreak: true, hitstop: .08, shake: .35 } : { dmg: 2.7, stun: .45, kb: -2.5, color: o.color, hitstop: 0, shake: .05 });
          sfx('swing', f.pos, .5);
        }
      },
    });
  });
