/* Habilidad: Ataque Teledirigido  ·  personaje: mattux  ·  movimiento: sonHoming
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonHoming', function (f, o) {
    const hit = new Set(); let tg = null, bounced = 0, st = 'jump', tt = 0;
    const next = (rng) => { let b = null, bd = rng; for (const g of enemiesOf(f)) { if (!g.alive || hit.has(g)) continue; const d = dist2d(f, g); if (d < bd) { bd = d; b = g; } } return b; };
    startAction(f, {
      name: 'sonhome', dur: 2.3, aim: true, noControl: true, speedMul: 0, anim: [[0, 'ball', 400]], spinX: 30,
      start: () => { tg = findTarget(f, 18) || next(18); sfx('jump', f.pos, 1.2); popText(chestOf(f), '¡ATAQUE TELEDIRIGIDO!', o.color, 20); f.vel.y = 9; f.onGround = false; },
      tick: (a, t, dt) => {
        tt += dt; a.spinX = 34; if (st === 'jump' && tt > .18) st = 'fly';
        if (st === 'fly') {
          if (!tg || !tg.alive) { tg = next(10); if (!tg) { if (bounced > 0 || tt > .9) { st = 'end'; } else { const F = fwd(f.yaw); f.vel.x = F.x * 16; f.vel.z = F.z * 16; if (tt > .7) st = 'end'; } return; } }
          const c = chestOf(tg), to = c.clone().sub(new V3(f.pos.x, f.pos.y + .9, f.pos.z)), d = to.length();
          if (d > .01) { to.normalize(); f.vel.x = to.x * 36; f.vel.z = to.z * 36; f.vel.y = to.y * 36; f.yaw = Math.atan2(to.x, to.z); }
          a.ghost = true; emit(f.pos.x, f.pos.y + .9, f.pos.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), o.color, .2, .3, 0, 3);
          if (d < 1.5) {
            hit.add(tg); const last = bounced >= 2; applyHit(f, tg, { dmg: (o.dmg || 6.5) + (last ? 3 : 0), kb: last ? 13 : 3, up: last ? 7 : 4, ragdoll: last ? 1 : .35, color: o.color, hitstop: .06, shake: .3, guardBreak: true });
            impactStar(c, '#ffffff', 2.2, .22); ringAt(c, o.color, 3, .3); sfx('heavy', f.pos, .7); worldDamage(c, 2.2, .8, o.dmg || 7, .5);
            f.vel.y = 12; f.vel.x = -(to.x) * 7; f.vel.z = -(to.z) * 7; bounced++; tt = 0; st = bounced >= 3 ? 'end' : 'bounce'; tg = null;
          }
        } else if (st === 'bounce') { if (tt > .22) { tg = next(10); st = tg ? 'fly' : 'end'; } }
        else if (st === 'end' && !a.fin) { a.fin = true; a.ghost = false; a.spinX = 0; a.anim = [[t, 'jump', 600]]; a.t = Math.max(a.t, a.dur - .35); }
      },
      onEnd: () => { f.vel.x *= .3; f.vel.z *= .3; },
    });
  });
