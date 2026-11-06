/* Habilidad: Explosión del Caos  ·  personaje: mattux  ·  movimiento: sonBlast
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonBlast', function (f, o) {
    startAction(f, {
      name: 'sonblast', dur: 1.7, aim: false, noControl: true, armor: true, speedMul: 0, anim: [[0, 'castUp', 500], [.4, 'lift', 900]],
      start: () => { sfx('ult', f.pos); popText(chestOf(f), '¡EXPLOSIÓN DEL CAOS!', '#ffd23f', 26); f.iframes = Math.max(f.iframes, 1.4); },
      tick: (a, t) => {
        if (t < 1.0) {
          f.vel.y = Math.max(f.vel.y, 0) + 0; if (t > .3) f.vel.y = 3;
          for (let k = 0; k < 2; k++) { const an = rand(0, TAU), r = rand(2.5, 6) * (1 - t / 1.1); emit(f.pos.x + Math.cos(an) * r, f.pos.y + rand(0, 3), f.pos.z + Math.sin(an) * r, -Math.cos(an) * 6, rand(1, 3), -Math.sin(an) * 6, Math.random() < .5 ? '#ffd23f' : '#ffffff', .22, .5, 0, 2); }
          G.shake = Math.max(G.shake, .15);
        }
      },
      steps: [{ at: 1.05, fn: () => {
        const c = new V3(f.pos.x, f.pos.y + 1, f.pos.z); sphereFlash(c, '#ffd23f', 5, .5); ringAt(new V3(c.x, c.y - .8, c.z), '#ffd23f', 11, .7); ringAt(new V3(c.x, c.y - .8, c.z), '#ffffff', 7, .5);
        burst(c, 50, '#ffd23f', 14, .25, .7, 0); burst(c, 30, '#ffffff', 10, .2, .5, 0); impactStar(c, '#ffffff', 5, .4); sfx('break', f.pos); G.hitstop = Math.max(G.hitstop, .14);
        explode(f, c, 9.5, { dmg: o.dmg || 18, kb: 20, up: 10, ragdoll: 1.6, color: '#ffd23f', guardBreak: true, shake: 1 }); worldDamage(c, 10, 2.4, 40, 2.2);
      } }],
    });
  });
