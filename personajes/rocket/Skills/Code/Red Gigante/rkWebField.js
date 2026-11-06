/* Habilidad: Red Gigante  ·  personaje: rocket  ·  movimiento: rkWebField
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Red Gigante (despierta): una telaraña enorme que arrastra a todos al centro y los hiere
CF.mover('rkWebField', function (f, o) {
    const tg = findTarget(f, 16), F = fwd(f.yaw), R = o.r || 7, C = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 6, 0, f.pos.z + F.z * 6), 2); C.y = groundAt(C.x, C.z);
    startAction(f, {
      name: 'rkWebField', bbClip: 'despertar_red', dur: .7, speedMul: .2, aim: true,
      steps: [{ at: .3, fn: () => {
        const wd = buildWebDisc(R, 5, 12, .55), life = 3.6; wd.grp.position.set(C.x, C.y + .08, C.z);
        addFx(wd.grp, life, (g, k) => { const sc = Math.min(1, k * 14); g.scale.set(sc, 1, sc); wd.mat.opacity = (k > .85 ? (1 - k) / .15 : 1) * (.45 + .15 * Math.sin(k * 60)); }, wd.dispose);
        sfx('zap', C); ringAt(C, '#ffffff', R, .5);
        let t = 0, acc = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; acc += dt;
          for (const g of enemiesOf(f)) {
            const dx = C.x - g.pos.x, dz = C.z - g.pos.z, d = Math.hypot(dx, dz);
            if (d < R && g.pos.y - C.y < 2.5 && g.alive) {
              if (!g.remote) { g.vel.x += dx / (d || 1) * 2.1 * (dt / .05); g.vel.z += dz / (d || 1) * 2.1 * (dt / .05); }
              if (acc >= .6) applyHit(f, g, { dmg: o.dmg || 1.1, stun: 0, kb: 0, color: '#ffffff', hitstop: 0, shake: .05, noCounter: true });
            }
          }
          if (acc >= .6) acc = 0;
          if (t < life && G.state === 'play') later(0, tick);
        };
        later(0, tick);
      } }],
    });
  });
