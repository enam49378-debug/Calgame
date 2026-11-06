/* Habilidad: Ráfaga de Puños  ·  personaje: javi  ·  movimiento: fistFlurry
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('fistFlurry', function (f, o) {
    const an = [[0, 'jabR_w', 800]], steps = [], held = new Set();
    for (let i = 0; i < 9; i++) {
      an.push([.1 + i * .1, i % 2 ? 'jabL' : 'jabR', 1500]);
      steps.push({ at: .16 + i * .1, fn: () => { const p = front(f, 1.4 + rand(-.2, .2), 1.2 + rand(-.3, .3)), hs = new Set();
        if (hitArea(f, p, i === 0 ? 1.8 : 1.5, { dmg: 2.1, kb: 0, stun: .5, color: o.color, set: hs, hitstop: .02 })) { for (const g of hs) held.add(g); impactStar(p, i % 2 ? '#ffffff' : o.color, 1.1, .12); } sfx('swing', f.pos, .35); burst(p, 3, '#ffffff', 5, .1, .2, 0); } });
    }
    an.push([1.08, 'upper_w', 800], [1.16, 'upper', 1500]);
    steps.push({ at: 1.2, fn: () => { const p = front(f, 1.4, 1.3); hitArea(f, p, 1.4, { dmg: 7, kb: 2, up: 13, ragdoll: .9, color: o.color, set: new Set(), hitstop: .1, shake: .5 }); impactStar(p, '#ffffff', 2.2, .25); ringAt(p, o.color, 3, .3); worldDamage(p, 3, 1, 10, .7); } });
    startAction(f, { name: 'flurry', dur: 1.55, aim: true, speedMul: .3, anim: an, steps, onEnd: () => held.clear(),
      tick: (a, t, dt) => {   // el rival queda agarrado delante hasta el gancho final: no se suelta ni sale despedido
        if (t > 1.2) return; const c = front(f, 1.35, 0), k = Math.min(1, dt * 16);
        for (const g of held) { if (!g.alive || g.ragdoll > 0) { held.delete(g); continue; } g.vel.x = g.vel.z = 0; g.vel.y = Math.max(g.vel.y, 0); g.stun = Math.max(g.stun, .3); g.pos.x += (c.x - g.pos.x) * k; g.pos.z += (c.z - g.pos.z) * k; }
      } });
  });
