/* Habilidad: Pelota de Verity  ·  personaje: sebolla  ·  movimiento: sebBallA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebBallA', function (f, o) {
    let tg = null;
    startAction(f, {
      name: 'sebBallA', dur: 1.6, noControl: true, aim: true, armor: true, speedMul: 0,
      start: () => popText(chestOf(f), '¡Pelota!', '#ffd91a', 22),
      // antes de patear se lanza hacia el rival mas cercano (hasta 9 m) para llegar a el
      tick: (a, t) => {
        if (t < .25) {
          if (!a.tg || !a.tg.alive) { let bd = 9; a.tg = null; for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (d < bd) { bd = d; a.tg = g; } } }
          if (a.tg && dist2d(f, a.tg) > 1.5) { f.yaw = yawTo(f, a.tg); const F = fwd(f.yaw); f.vel.x = F.x * 22; f.vel.z = F.z * 22; a.ghost = true; } else a.ghost = false;
        } else a.ghost = false;
      },
      steps: [
        { at: .25, fn: () => { const c = front(f, 1.5, 1.0); tg = enemiesOf(f).filter(g => chestOf(g).distanceTo(c) < 3.2).sort((p, q) => chestOf(p).distanceTo(c) - chestOf(q).distanceTo(c))[0] || null; if (hitArea(f, c, 2.5, { dmg: 4, up: 13, kb: 0, stun: 1.5, color: '#ffd91a', hitstop: .07, shake: .3 })) { impactStar(c, '#ffffff', 2.4, .25); sfx('heavy', c); } } },
        { at: .95, fn: () => { if (!tg || !tg.alive) return; verityGo(f, () => new V3(tg.pos.x, tg.pos.y + 4.5, tg.pos.z), .5, 1.7, 'angry'); popText(chestOf(f), '¡Remata, Verity!', '#ffd91a', 20); } },
        { at: 1.2, fn: () => {
          if (!tg || !tg.alive) return; verityGo(f, () => new V3(tg.pos.x, tg.pos.y + 1.8, tg.pos.z), .3, 2, 'angry');
          if (applyHit(f, tg, { dmg: 5, stun: 1, kb: 0, color: '#ffd91a', hitstop: .09, shake: .4 }) && !tg.remote) tg.vel.y = -36;
          const T = tg; later(.2, () => { if (!T.alive) return; const c = new V3(T.pos.x, T.pos.y + .8, T.pos.z); explode(f, c, 3.2, { dmg: 4, kb: 6, up: 8, ragdoll: .9, color: '#ffd91a', guardBreak: true, hitstop: .08, shake: .5 }); if (f.verity) f.verity.ov = null; });
        } },
      ],
      onEnd: () => { if (f.verity) f.verity.ov = null; },
    });
  });
