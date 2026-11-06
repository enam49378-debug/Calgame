/* Habilidad: Cuchillas arrojadizas  ·  personaje: ukyo  ·  movimiento: ukKnives
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Cuchillas arrojadizas: tres cuchillas; las que aciertan se quedan clavadas y vuelven a su mano atravesando otra vez
CF.mover('ukKnives', function (f, o) {
    startAction(f, {
      name: 'ukKnives', bbClip: 'habilidad_3_cuchillas', dur: .5, speedMul: .3, aim: true,
      steps: [{ at: .18, fn: () => {
        const col = o.color, n = o.count || 3, ks = [], T0 = 1.25; let T = 0;
        for (let i = 0; i < n; i++) {
          const F = fwd(f.yaw + (i - (n - 1) / 2) * .2), mesh = new THREE.Mesh(new THREE.BoxGeometry(.09, .05, .6), new THREE.MeshBasicMaterial({ color: '#e8f0ff' }));
          mesh.position.copy(front(f, .8, 1.3)); scene.add(mesh); ks.push({ mesh, dir: F, st: 'fly', t: 0, tg: null, off: null, back: false });
        }
        sfx('slash', f.pos);
        const rm = k => { k.st = 'dead'; scene.remove(k.mesh); k.mesh.geometry.dispose(); k.mesh.material.dispose(); };
        const nd = ndt(); const loop = () => { const dt = nd();
          T += dt;
          for (const k of ks) {
            if (k.st === 'dead') continue; const pos = k.mesh.position;
            if (k.st === 'fly') {
              k.t += dt; pos.addScaledVector(k.dir, 38 * dt); k.mesh.lookAt(pos.clone().add(k.dir));
              for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(pos) < 1.0) {
                k.st = 'stuck'; k.tg = g; k.off = pos.clone().sub(chestOf(g)); impactStar(pos, col, .9, .15);
                applyHit(f, g, { dmg: o.dmg || 3, stun: .3, kb: 1.5, dir: k.dir, color: col, hitstop: .04 }); break;
              }
              if (k.st === 'fly' && (k.t > .55 || groundAt(pos.x, pos.z) > pos.y)) { burst(pos, 5, col, 3, .1, .2, 0); rm(k); }
            } else if (k.st === 'stuck') {
              if (k.tg && k.tg.alive) pos.copy(chestOf(k.tg)).add(k.off);
              if (T >= T0) k.st = 'back';
            } else if (k.st === 'back') {
              const to = new V3(f.pos.x, f.pos.y + 1.2, f.pos.z).sub(pos), d = to.length();
              if (!k.back && k.tg && k.tg.alive) { k.back = true; slashLine(pos.clone(), chestOf(f), col, .25, .08); applyHit(f, k.tg, { dmg: (o.dmg || 3) * 1.4, stun: .4, kb: 4, up: 1, dir: new V3(f.pos.x - k.tg.pos.x, 0, f.pos.z - k.tg.pos.z), color: col, hitstop: .05 }); }
              if (d < 1) rm(k); else { to.multiplyScalar(1 / d); pos.addScaledVector(to, 42 * dt); k.mesh.lookAt(pos.clone().add(to)); }
            }
          }
          if (ks.some(k => k.st !== 'dead') && G.state === 'play' && T < 5) later(0, loop); else ks.forEach(k => { if (k.st !== 'dead') rm(k); });
        };
        loop();
      } }],
    });
  });
