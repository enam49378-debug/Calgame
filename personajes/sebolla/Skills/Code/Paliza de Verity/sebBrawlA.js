/* Habilidad: Paliza de Verity  ·  personaje: sebolla  ·  movimiento: sebBrawlA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebBrawlA', function (f, o) {
    startAction(f, {
      name: 'sebBrawlA', dur: 1.5, noControl: true, aim: true, armor: true, speedMul: 0, ghost: true, anim: [[0, 'run', 600]],
      start: () => { popText(chestOf(f), '¡Verity, mira esto!', '#ffd91a', 20); sfx('dash', f.pos); },
      tick: (a, t) => {
        // Only the opening rush and the short approach to a living target move the fighter.
        f.vel.x = f.vel.z = 0;
        // elige a quien ir: el mas cercano (de preferencia al frente) hasta 11 m, y se lanza hacia el aunque este lejos
        if (!a.tg || !a.tg.alive) { let bs = 1e9; a.tg = null; for (const g of enemiesOf(f)) { const d = dist2d(f, g), F0 = fwd(f.yaw), c = ((g.pos.x - f.pos.x) * F0.x + (g.pos.z - f.pos.z) * F0.z) / (d || 1); const sc = d - (c > .2 ? 3 : 0); if (d < 11 && sc < bs) { bs = sc; a.tg = g; } } }
        if (t < .5 && !a.stopped && (a.tg ? dist2d(f, a.tg) < 1.5 : enemiesOf(f).some(g => dist2d(f, g) < 1.7))) a.stopped = true;
        a.ghost = t < .5 && !a.stopped;
        if (a.ghost) {
          if (a.tg) f.yaw = yawTo(f, a.tg);
          const F = fwd(f.yaw); f.vel.x = F.x * 24; f.vel.z = F.z * 24;
          emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ffd91a', .2, .3, 0, 3);
        } else if (t >= .5 && t < 1.3) {
          let n = null, bd = 7;
          for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (d < bd) { bd = d; n = g; } }
          if (n) {
            const dx = n.pos.x - f.pos.x, dz = n.pos.z - f.pos.z; f.yaw = Math.atan2(dx, dz);
            if (bd > 1.3) { f.vel.x = dx / bd * 14; f.vel.z = dz / bd * 14; }
          }
        }
      },
      onEnd: () => { f.vel.x = f.vel.z = 0; if (f.verity) f.verity.ov = null; },
      steps: [
        ...[.4, .52, .64, .76, .88].map(at => ({ at, fn: () => { hitArea(f, front(f, 1.5, 1.1), 2.2, { dmg: 1.7, stun: .45, kb: .5, color: '#ffd91a', hitstop: .03, shake: .12 }); fistFx(f, '#ffd91a'); sfx('hit', f.pos, .6); } })),
        { at: 1.0, fn: () => { verityGo(f, () => front(f, 1.7, 1.7), .35, 1.4, 'angry'); const c = front(f, 1.7, 1.1); if (hitArea(f, c, 2.4, { dmg: 3, stun: .5, kb: 1, color: '#ffd91a', hitstop: .06, shake: .25 })) { popText(c, '¡CABEZAZO!', '#ffd91a', 20); impactStar(c, '#ffd91a', 2, .2); } } },
        { at: 1.2, fn: () => { verityGo(f, null, 0); if (f.verity) f.verity.ov = null; const c = front(f, 1.5, 1.1); if (hitArea(f, c, 2.5, { dmg: 6, kb: 2, up: 14, ragdoll: 1.2, rag: 1.5, color: '#ffd91a', guardBreak: true, hitstop: .1, shake: .45 })) { ringAt(c, '#ffd91a', 2.6, .35); burst(c, 18, '#ffd91a', 9, .2, .5, .3); } sfx('heavy', f.pos); } },
      ],
    });
  });
