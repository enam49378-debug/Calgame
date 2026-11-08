/* Habilidad: Repulsores Gemelos  ·  personaje: sunn  ·  movimiento: sunnTwin
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnTwin', function (f, o) {
  startAction(f, { name: 'sunnTwin', dur: .95, aim: true, speedMul: .3, anim: [[0, 'charge', 400], [.2, 'cast', 900]],
    steps: [0, 1].map(i => ({ at: .24 + i * .24, fn: () => {
      const tg = findTarget(f, 26), R = rightOf(f.yaw), side = i ? 1 : -1, from = front(f, .5, 1.35).add(new V3(R.x * side * .55, 0, R.z * side * .55)), q = tg ? chestOf(tg) : null;
      const yaw = q ? Math.atan2(q.x - from.x, q.z - from.z) : f.yaw;
      spawnProj(f, yaw, { from, color: '#7df9ff', speed: 60, size: .3, long: 2.6, homing: 1.6, range: 30, dmg: o.dmg || 5.5, stun: .4, kb: 4, up: .6 });
      ringAt(from, '#7df9ff', 1.3, .22); burst(from, 8, '#7df9ff', 6, .14, .25, 0); sfx('zap', from, .6);
    } })) });
});
