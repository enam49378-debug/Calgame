/* Habilidad: Viento Cortante  ·  personaje: sekza  ·  movimiento: sekBoomerang
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Viento Cortante: una hoz de viento sale en curva, llega lejos y vuelve jalando a los que cruza
CF.mover('sekBoomerang', function (f, o) {
    startAction(f, {
      name: 'sekBoomerang', bbClip: 'habilidad_1_viento', dur: .5, speedMul: .3, aim: true,
      steps: [{ at: .16, fn: () => {
        const F = fwd(f.yaw), R = rightOf(f.yaw), side = Math.random() < .5 ? 1 : -1, col = o.color, T = 1.5, tg0 = findTarget(f, 18), R0 = tg0 ? clamp(dist2d(f, tg0) + 1.5, 7, 16) : (o.range || 11), out = new Set(), back = new Set();
        const g1 = new THREE.RingGeometry(.5, 1, 20, 1, -1.2, 2.4), g2 = new THREE.RingGeometry(.78, 1, 20, 1, -1.2, 2.4), m1 = glowMat(col, .75), m2 = glowMat('#ffffff', .95);
        const grp = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; grp.add(a, b); grp.scale.setScalar(1.7); scene.add(grp);
        sfx('whoosh', f.pos); let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const u = Math.min(1, t / T);
          const fw = R0 * (1 - Math.cos(TAU * u)) / 2, la = side * 2.4 * Math.sin(TAU * u);
          grp.position.set(f.pos.x + F.x * fw + R.x * la, f.pos.y + 1.2, f.pos.z + F.z * fw + R.z * la); grp.rotation.y += .55;
          emit(grp.position.x, grp.position.y, grp.position.z, rand(-1, 1), rand(0, 1), rand(-1, 1), col, .16, .22, 0, 0);
          for (const g of enemiesOf(f)) {
            if (chestOf(g).distanceTo(grp.position) > 2.0) continue;
            if (u < .5 && !out.has(g)) { out.add(g); applyHit(f, g, { dmg: o.dmg || 4, stun: .35, kb: 3, up: 2, dir: F, color: col, hitstop: .04, shake: .15 }); }
            else if (u >= .5 && !back.has(g)) { back.add(g); applyHit(f, g, { dmg: o.dmg || 4, stun: .5, kb: 8, up: 1, dir: new V3(f.pos.x - g.pos.x, 0, f.pos.z - g.pos.z), color: col, hitstop: .04, shake: .15 }); }
          }
          if (u < 1 && G.state === 'play') later(0, tick);
          else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });
