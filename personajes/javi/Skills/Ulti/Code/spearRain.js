/* Habilidad: Lluvia de Lanzas  ·  personaje: javi  ·  movimiento: spearRain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('spearRain', function (f, o) {
    const tg = findTarget(f, 20), F = fwd(f.yaw);
    const c0 = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8);
    c0.y = groundAt(c0.x, c0.z);
    startAction(f, {
      name: 'rain', dur: 2.1, armor: true, noControl: true, aim: true, anim: [[0, 'stomp', 800], [.15, 'spearThrowW', 700], [.55, 'spearThrow', 1000], [1.1, 'spearThrowW', 800], [1.2, 'spearThrow', 1100]],
      start: () => { f.vel.set(0, 17, 0); f.onGround = false; f.iframes = 1.6; sfx('jump', f.pos, 3); },
      tick: (a, t) => { if (t > .45 && t < 1.6) f.vel.set(0, 0, 0); },
      steps: [
        { at: .55, fn: () => { for (let i = 0; i < 12; i++) { const an = rand(0, TAU), rr = rand(.5, 6.5), p = new V3(c0.x + Math.cos(an) * rr, 0, c0.z + Math.sin(an) * rr); if (Math.hypot(p.x, p.z) > ARENA) continue; p.y = groundAt(p.x, p.z); fallingSpear(f, p, .15 + i * .06, 1, o, false); } } },
        { at: 1.2, fn: () => fallingSpear(f, c0.clone(), .35, 3.4, o, true) },
      ],
    });
  });
