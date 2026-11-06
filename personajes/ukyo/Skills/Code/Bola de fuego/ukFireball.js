/* Habilidad: Bola de fuego  ·  personaje: ukyo  ·  movimiento: ukFireball
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Bola de fuego: explota al chocar y deja un charco ardiendo
CF.mover('ukFireball', function (f, o) {
    startAction(f, {
      name: 'ukFireball', bbClip: 'habilidad_4_bola', dur: .6, speedMul: .25, aim: true,
      steps: [{ at: .25, fn: () => {
        const F = fwd(f.yaw), col = o.color, ball = new THREE.Mesh(new THREE.IcosahedronGeometry(.55, 1), glowMat('#ff8a1a', .9));
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 0), new THREE.MeshBasicMaterial({ color: '#fff3c4' })); ball.add(core); ball.position.copy(front(f, 1, 1.3)); scene.add(ball);
        const vel = F.clone().multiplyScalar(24); let life = 0; sfx('fire', f.pos);
        const finish = pos => {
          explode(f, pos, 3.2, { dmg: o.dmg || 9, kb: 8, up: 8, ragdoll: .7, color: col, hitstop: .08, shake: .4 });
          const gp = new V3(pos.x, groundAt(pos.x, pos.z), pos.z); fireColumn(gp, 2, '#ff7a1a', 5); firePatch(f, gp, 3, 3.5, col);
          scene.remove(ball); ball.geometry.dispose(); ball.material.dispose(); core.geometry.dispose(); core.material.dispose();
        };
        const nd = ndt(); const tick = () => { const dt = nd();
          life += dt; ball.position.addScaledVector(vel, dt); ball.scale.setScalar(1 + .15 * Math.sin(life * 40)); ball.rotation.x += .3;
          emit(ball.position.x, ball.position.y, ball.position.z, rand(-1, 1), rand(0, 2), rand(-1, 1), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', .3, .35, 0, 1);
          let hit = life > 1.2 || groundAt(ball.position.x, ball.position.z) > ball.position.y - .2 || ball.position.y < .2 || Math.hypot(ball.position.x, ball.position.z) > ARENA + 1;
          if (!hit) for (const g of enemiesOf(f)) if (g.alive && chestOf(g).distanceTo(ball.position) < 1.2) { hit = true; break; }
          if (hit) finish(ball.position.clone()); else if (G.state === 'play') later(0, tick); else { scene.remove(ball); }
        };
        tick();
      } }],
    });
  });
