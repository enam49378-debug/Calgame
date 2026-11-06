/* Habilidad: Lluvia de Plumas  ·  personaje: sekza  ·  movimiento: sekRain
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Lluvia de Plumas (despierta): se eleva y llueven plumas sobre la zona del rival
CF.mover('sekRain', function (f, o) {
    const tg0 = findTarget(f, 22), F = fwd(f.yaw), col = o.color; let acc = 0;
    const C = () => (tg0 && tg0.alive ? tg0.pos : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9));
    const drop = () => {
      const c = C(), an = rand(0, TAU), rr = Math.sqrt(Math.random()) * 6.5, q = clampArena(new V3(c.x + Math.cos(an) * rr, 0, c.z + Math.sin(an) * rr), 1); q.y = groundAt(q.x, q.z);
      slashLine(new V3(q.x + rand(-.6, .6), q.y + 13, q.z + rand(-.6, .6)), new V3(q.x, q.y + .5, q.z), col, .3, .13); ringAt(q, col, 1.3, .3);
      later(.28, () => {
        for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - q.x, g.pos.z - q.z) < 1.9 && g.pos.y - q.y < 2.6) applyHit(f, g, { dmg: o.dmg || 3.2, stun: .45, kb: 3, up: 4, color: col, hitstop: .03, shake: .12 });
        burst(new V3(q.x, q.y + .5, q.z), 8, col, 6, .16, .3, .8); burst(new V3(q.x, q.y + .5, q.z), 4, '#ffffff', 5, .12, .25, .8);
      });
    };
    startAction(f, {
      name: 'sekRain', bbClip: 'despertar_lluvia', dur: 2.1, noControl: true, armor: true, aim: true,
      start: () => { f.vel.set(0, 10, 0); f.onGround = false; sfx('whoosh', f.pos); ringAt(new V3(f.pos.x, f.pos.y + .05, f.pos.z), col, 4, .5); },
      tick: (a, t, dt) => {
        if (t < 1.85) { const hy = groundAt(f.pos.x, f.pos.z) + 3.4; f.vel.y = t < .3 ? 10 : clamp((hy - f.pos.y) * 7, -6, 9); f.vel.x *= .9; f.vel.z *= .9; }
        if (t > .45 && t < 1.8) { acc += dt; while (acc >= .09) { acc -= .09; drop(); } }
      },
    });
  });
