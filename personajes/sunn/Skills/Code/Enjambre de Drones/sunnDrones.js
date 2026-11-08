/* Habilidad: Enjambre de Drones  ·  personaje: sunn  ·  movimiento: sunnDrones
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnDrones', function (f, o) {
  const N = o.n || 10, drones = [], g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0x9d6bff }), core = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 4; i++) { const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.BoxGeometry(.32, .12, .32), mat), new THREE.Mesh(new THREE.BoxGeometry(.14, .16, .14), core)); g.add(d); drones.push(d); }
  scene.add(g); let t = 0; const life = .4 + N * .45 + .6, iv = setInterval(() => { t += .016; if (!f.alive || t > life || G.state !== 'play') { clearInterval(iv); scene.remove(g); return; } drones.forEach((d, i) => { const a = t * 3 + i * Math.PI / 2; d.position.set(f.pos.x + Math.cos(a) * 1.8, f.pos.y + 2.5 + Math.sin(t * 5 + i) * .2, f.pos.z + Math.sin(a) * 1.8); d.rotation.y = a * 2; }); }, 16);
  startAction(f, { name: 'sunnDrones', dur: .55, aim: true, speedMul: .5, anim: [[0, 'castUp', 800]] }); sfx('whoosh', f.pos, .5);
  for (let i = 0; i < N; i++) later(.4 + i * .45, () => {
    if (!f.alive) return; const tg = findTarget(f, 32); if (!tg) return; const d = drones[i % 4], from = d.position.clone(), q = chestOf(tg);
    spawnProj(f, Math.atan2(q.x - from.x, q.z - from.z), { from, color: '#9d6bff', speed: 50, size: .24, long: 1.8, homing: 3.2, range: 34, dmg: o.dmg || 3.4, stun: .25, kb: 2, up: .5 }); sfx('zap', from, .4); burst(from, 4, '#9d6bff', 4, .12, .2, 0);
  });
});
