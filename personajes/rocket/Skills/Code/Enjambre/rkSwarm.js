/* Habilidad: Enjambre  ·  personaje: rocket  ·  movimiento: rkSwarm
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Enjambre (despierta): arañitas que persiguen al rival y lo muerden
CF.mover('rkSwarm', function (f, o) {
    const col = o.color, N = o.n || 6;
    startAction(f, {
      name: 'rkSwarm', bbClip: 'despertar_enjambre', dur: .6, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        const kids = [], dark = () => new THREE.MeshBasicMaterial({ color: '#15151c' });
        for (let i = 0; i < N; i++) {
          const an = i / N * TAU, mesh = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .6), dark());
          mesh.add(body);
          for (const sx of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, .1), new THREE.MeshBasicMaterial({ color: col })); eye.position.set(sx * .12, .1, .3); mesh.add(eye);
            for (let k = 0; k < 3; k++) { const lg = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .04), dark()); lg.position.set(sx * .35, -.05, -.2 + k * .2); lg.rotation.z = sx * -.5; mesh.add(lg); }
          }
          mesh.position.set(f.pos.x + Math.cos(an) * 1.2, f.pos.y + 1.2, f.pos.z + Math.sin(an) * 1.2); scene.add(mesh);
          kids.push({ mesh, vel: new V3(Math.cos(an) * 6, 5, Math.sin(an) * 6), bites: 0, bt: 0, t: 0, dead: false });
        }
        burst(chestOf(f), 24, col, 7, .16, .5, 0); sfx('tp', f.pos);
        const rm = k => { k.dead = true; scene.remove(k.mesh); k.mesh.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); };
        const nd = ndt(); const loop = () => { const dt = nd();
          for (const k of kids) {
            if (k.dead) continue; k.t += dt;
            let best = null, bd = 1e9; for (const g of enemiesOf(f)) { const d = chestOf(g).distanceTo(k.mesh.position); if (g.alive && d < bd) { bd = d; best = g; } }
            if (!best || k.t > 6 || k.bites >= 3) { burst(k.mesh.position, 6, col, 4, .1, .25, 0); rm(k); continue; }
            const to = chestOf(best).sub(k.mesh.position), d = to.length() || .01; to.multiplyScalar(1 / d);
            k.vel.lerp(to.multiplyScalar(12), Math.min(1, dt * 4)); k.mesh.position.addScaledVector(k.vel, dt);
            const gy = groundAt(k.mesh.position.x, k.mesh.position.z) + .3; if (d > 1.4 && k.mesh.position.y < gy) { k.mesh.position.y = gy; k.vel.y = Math.max(k.vel.y, 0); }
            k.mesh.lookAt(k.mesh.position.clone().add(k.vel));
            if (d < 1.3) { k.bt -= dt; if (k.bt <= 0) { k.bt = .3; k.bites++; applyHit(f, best, { dmg: o.dmg || 1.8, stun: .25, kb: 0, color: col, hitstop: .02, shake: .05, noCounter: true }); burst(chestOf(best), 5, col, 4, .1, .2, 0); sfx('hit', best.pos, .4); } }
          }
          if (kids.some(k => !k.dead) && G.state === 'play') later(0, loop); else kids.forEach(k => { if (!k.dead) rm(k); });
        };
        loop();
      } }],
    });
  });
