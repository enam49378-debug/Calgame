/* Habilidad: Barrido  ·  personaje: ukyo  ·  movimiento: ukSweep
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Barrido: una onda baja que viaja por el piso y hace caer a todos los que toca
CF.mover('ukSweep', function (f, o) {
    startAction(f, {
      name: 'ukSweep', bbClip: 'habilidad_1_barrido', dur: .6, speedMul: .25, aim: true,
      steps: [{ at: .2, fn: () => {
        const F = fwd(f.yaw), Rr = rightOf(f.yaw), col = o.color, L = o.range || 11, T = .55, hit = new Set(), org = new V3(f.pos.x, f.pos.y, f.pos.z);
        const g1 = new THREE.RingGeometry(.85, 1.35, 24, 1, -1.25, 2.5), g2 = new THREE.RingGeometry(1.15, 1.35, 24, 1, -1.25, 2.5), m1 = glowMat(col, .7), m2 = glowMat('#ffffff', .9);
        const grp = new THREE.Group(), arc = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; arc.add(a, b); grp.add(arc); grp.rotation.y = f.yaw - Math.PI / 2; scene.add(grp);
        arcSlash(f, col, { tilt: .05, r: 2.2, w: .7, len: 3.4, dur: .3, y: .5 }); sfx('swing', f.pos);
        let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const u = Math.min(1, t / T), sc = 1.2 + 1.4 * u;
          const x = org.x + F.x * (1.2 + L * u), z = org.z + F.z * (1.2 + L * u); grp.position.set(x, groundAt(x, z) + .3, z); arc.scale.set(sc, sc, sc);
          emit(x + rand(-1, 1), grp.position.y, z + rand(-1, 1), rand(-1, 1), rand(.5, 2), rand(-1, 1), '#d8d0c0', .18, .3, 0, 0);
          for (const g of enemiesOf(f)) {
            if (hit.has(g)) continue;
            if (Math.hypot(g.pos.x - x, g.pos.z - z) < 1.6 + sc && g.pos.y - org.y < 1.8) {
              hit.add(g); const side = Math.sign((g.pos.x - x) * Rr.x + (g.pos.z - z) * Rr.z) || 1;
              applyHit(f, g, { dmg: o.dmg || 6, kb: 6, up: 4, ragdoll: .7, dir: new V3(F.x * .5 + Rr.x * side, 0, F.z * .5 + Rr.z * side), color: col, hitstop: .06, shake: .3 });
            }
          }
          if (u < 1 && G.state === 'play') later(0, tick); else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });
