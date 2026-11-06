/* Habilidad: Trampas de Seda  ·  personaje: rocket  ·  movimiento: rkTraps
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Trampas de Seda: tres telarañas en el piso; quien las pise queda atrapado
CF.mover('rkTraps', function (f, o) {
    const tg = findTarget(f, 18), F = fwd(f.yaw), C = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8);
    startAction(f, {
      name: 'rkTraps', bbClip: 'habilidad_4_trampas', dur: .6, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        const traps = [];
        for (let n = 0; n < 3; n++) {
          const an = n * TAU / 3 + rand(0, .5), rr = tg ? 3.2 : 2.5, pos = clampArena(new V3(C.x + Math.cos(an) * rr, 0, C.z + Math.sin(an) * rr), 1.5); pos.y = groundAt(pos.x, pos.z);
          const wd = buildWebDisc(1.4, 3, 8, .55), tr = { pos, dead: false }; wd.grp.position.set(pos.x, pos.y + .08, pos.z);
          addFx(wd.grp, 9.5, (g, k) => { if (tr.dead) g.visible = false; else wd.mat.opacity = .4 + .2 * Math.sin(k * 90); }, wd.dispose);
          ringAt(pos, '#ffffff', 2, .3); traps.push(tr);
        }
        sfx('zap', C);
        let t = 0;
        const nd = ndt(); const chk = () => { const dt = nd();
          t += dt;
          for (const tr of traps) {
            if (tr.dead) continue;
            for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - tr.pos.x, g.pos.z - tr.pos.z) < 1.5 && g.pos.y - tr.pos.y < 1.4) {
              tr.dead = true; applyHit(f, g, { dmg: o.dmg || 4, stun: o.root || 1.9, kb: 0, color: o.color, hitstop: .05, noCounter: true }); webWrap(g, o.root || 1.9);
              burst(chestOf(g), 14, '#ffffff', 5, .14, .4, 0); sfx('zap', g.pos); popText(chestOf(g), '¡ATRAPADO!', '#f0f0f8', 18); break;
            }
          }
          if (t < 9 && G.state === 'play') later(0, chk); else traps.forEach(tr => { tr.dead = true; });
        };
        later(0, chk);
      } }],
    });
  });
