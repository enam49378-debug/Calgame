/* Habilidad: Corte Solar  ·  personaje: ukyo  ·  movimiento: ukSun
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Corte Solar (despierta): un arco de fuego enorme que atraviesa a todos
CF.mover('ukSun', function (f, o) {
    startAction(f, {
      name: 'ukSun', bbClip: 'despertar_corte', dur: .7, speedMul: .15, aim: true, armor: true,
      steps: [{ at: .3, fn: () => {
        const F = fwd(f.yaw), hit = new Set(), g1 = new THREE.RingGeometry(1.3, 1.9, 28, 1, -1.2, 2.4), g2 = new THREE.RingGeometry(1.65, 1.9, 28, 1, -1.2, 2.4), m1 = glowMat('#ff6a1a', .8), m2 = glowMat('#fff3c4', .95);
        const grp = new THREE.Group(), a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.z = b.rotation.z = Math.PI / 2; grp.add(a, b); grp.rotation.y = f.yaw; grp.position.copy(front(f, 1.2, 1.6)); scene.add(grp);
        sfx('fire', f.pos); arcSlash(f, '#ff7a1a', { tilt: 1.4, r: 2.2, w: .8, len: 2.6, dur: .3 }); let t = 0;
        const nd = ndt(); const tick = () => { const dt = nd();
          t += dt; const sc = 1 + t * 1.2; grp.position.addScaledVector(F, 30 * dt); grp.scale.set(sc, sc, sc);
          for (let k = 0; k < 3; k++) { const an = rand(-1.2, 1.2) + Math.PI / 2, q = grp.localToWorld(new V3(Math.cos(an) * 1.7, Math.sin(an) * 1.7, 0)); emit(q.x, q.y, q.z, rand(-1, 1), rand(0, 2), rand(-1, 1), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', .3, .4, 0, 1); }
          for (const g of enemiesOf(f)) if (!hit.has(g) && g.alive && chestOf(g).distanceTo(grp.position) < 2.4 * sc) {
            hit.add(g); applyHit(f, g, { dmg: o.dmg || 8, kb: 8, up: 10, ragdoll: .8, dir: F, color: '#ff7a1a', hitstop: .08, shake: .4, guardBreak: true }); impactStar(chestOf(g), '#ff7a1a', 2.2, .25);
          }
          if (t < .75 && G.state === 'play') later(0, tick); else { scene.remove(grp); g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); }
        };
        tick();
      } }],
    });
  });
