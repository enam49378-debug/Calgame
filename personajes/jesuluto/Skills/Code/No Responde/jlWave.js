/* Habilidad: No Responde  ·  personaje: jesuluto  ·  movimiento: jlWave
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// «No responde»: una barra de progreso gigante avanza y deja congelado (y sin guardia) a quien toca
CF.mover('jlWave', function (f, o) {
    startAction(f, {
      name: 'jlWave', dur: .85, speedMul: .15, aim: true, anim: [[0, 'castUp', 600], [.3, 'point', 500]],
      start: () => { jlScreen(f, 'load', 2.4); popText(chestOf(f), 'Instalando actualización…', '#7ad7ff', 20); },
      steps: [{ at: .35, fn: () => {
        const yaw = f.yaw, dir = new V3(Math.sin(yaw), 0, Math.cos(yaw)), geo = new THREE.BoxGeometry(7.4, .75, .4), mat = new THREE.MeshBasicMaterial({ map: jlBarTex(), transparent: true, opacity: .96 }), mesh = new THREE.Mesh(geo, mat), hit = new Set(), nd = ndt(); let life = 0;
        mesh.position.copy(front(f, 1.6, 1.2)); mesh.rotation.y = yaw; scene.add(mesh); sfx('beam', f.pos, .8);
        const end = () => { scene.remove(mesh); geo.dispose(); mat.dispose(); };
        const tick = () => {
          const dt = nd(); life += dt; mesh.position.addScaledVector(dir, 26 * dt); mesh.scale.y = 1 + Math.sin(life * 22) * .06;
          emit(mesh.position.x + rand(-3.5, 3.5) * Math.cos(yaw), mesh.position.y + rand(-.3, .6), mesh.position.z - rand(-3.5, 3.5) * Math.sin(yaw), 0, rand(.5, 2), 0, '#7ad7ff', .14, .35, 0, 1);
          for (const g of enemiesOf(f)) {
            if (hit.has(g)) continue; const q = chestOf(g).sub(mesh.position), along = q.dot(dir), side = Math.abs(q.x * dir.z - q.z * dir.x);
            if (Math.abs(along) < 1.3 && side < 3.9) { hit.add(g); applyHit(f, g, { dmg: o.dmg || 7, stun: 1.6, freeze: 1.6, kb: 3, color: '#0078d7', guardBreak: true, hitstop: .08, shake: .3 }); popText(chestOf(g), 'No responde', '#ffffff', 20); burst(chestOf(g), 16, '#7ad7ff', 8, .16, .4, 0); sfx('ice', g.pos); }
          }
          if (life > 1.05 || groundAt(mesh.position.x, mesh.position.z) > 1.6) { end(); return; }
          if (G.state === 'play') later(0, tick); else end();
        };
        later(0, tick);
      } }],
    });
  });
