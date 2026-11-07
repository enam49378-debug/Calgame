/* Habilidad: Sándwich  ·  personaje: sebolla  ·  movimiento: sebSandA
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sebSandA', function (f, o) {
    let tg = null;
    const dirTo = () => new V3(tg.pos.x - f.pos.x, 0, tg.pos.z - f.pos.z).normalize();
    const push = (d, k) => { if (tg && !tg.remote) { tg.pos.x += d.x * k; tg.pos.z += d.z * k; } };
    const behind = () => { const d = dirTo(); return new V3(tg.pos.x + d.x * 2.2, tg.pos.y + 1.7, tg.pos.z + d.z * 2.2); };
    const front2 = () => { const d = dirTo(); return new V3(tg.pos.x - d.x * 1.0, tg.pos.y + 1.7, tg.pos.z - d.z * 1.0); };
    startAction(f, {
      name: 'sebSandA', dur: 1.8, noControl: true, aim: true, armor: true, speedMul: 0,
      start: () => popText(chestOf(f), '¡Sándwich!', '#ffd91a', 22),
      // se acerca al rival (hasta 9 m) mientras Verity se coloca detras de el
      tick: (a, t) => {
        if (t < .4) {
          if (!a.tg || !a.tg.alive) { let bd = 9; a.tg = null; for (const g of enemiesOf(f)) { const d = dist2d(f, g); if (d < bd) { bd = d; a.tg = g; } } }
          if (a.tg && dist2d(f, a.tg) > 2) { f.yaw = yawTo(f, a.tg); const F = fwd(f.yaw); f.vel.x = F.x * 20; f.vel.z = F.z * 20; a.ghost = true; } else a.ghost = false;
        } else a.ghost = false;
      },
      steps: [
        { at: .1, fn: () => { const c = front(f, 1.6, 1.0); tg = (f.action && f.action.tg && f.action.tg.alive ? f.action.tg : null) || enemiesOf(f).filter(g => chestOf(g).distanceTo(c) < 9).sort((p, q) => chestOf(p).distanceTo(c) - chestOf(q).distanceTo(c))[0] || null; if (tg) { verityGo(f, behind, .9, 1.4, 'happy'); ringAt(new V3(tg.pos.x, tg.pos.y + .1, tg.pos.z), '#ffd91a', 2.5, .4); sfx('tp', tg.pos); } } },
        ...[.4, 1.15].map(at => ({ at, fn: () => { if (!tg || !tg.alive) return; const d = dirTo(); if (applyHit(f, tg, { dmg: 3, stun: .65, kb: 0, color: '#ffd91a', hitstop: .06, shake: .2 })) { push(d, 1.2); fistFx(f, '#ffd91a'); impactStar(chestOf(tg), '#ffffff', 1.8, .2); } } })),
        ...[.8, 1.45].map(at => ({ at, fn: () => { if (!tg || !tg.alive) return; const d = dirTo(); verityGo(f, front2, .35, 1.5, 'angry'); if (applyHit(f, tg, { dmg: 3, stun: .65, kb: 0, color: '#ffd91a', hitstop: .06, shake: .2 })) { push(d, -1.2); impactStar(chestOf(tg), '#ffd91a', 1.8, .2); } } })),
        { at: 1.65, fn: () => { if (!tg || !tg.alive) return; verityGo(f, () => front(f, 1.2, 1.7), .3, 1.5, 'angry'); const c = chestOf(tg); explode(f, c, 3.2, { dmg: 6, kb: 6, up: 10, ragdoll: .9, color: '#ffd91a', guardBreak: true, hitstop: .09, shake: .45 }); popText(c, '¡CLAP!', '#ffd91a', 24); } },
      ],
      onEnd: () => { if (f.verity) f.verity.ov = null; },
    });
  });
