/* Habilidad: Salva Stark  ·  personaje: sunn  ·  movimiento: sunnMissiles
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnMissiles', function (f, o) {
  const n = o.n || 5;
  startAction(f, { name: 'sunnMissiles', dur: .35 + n * .13 + .4, aim: true, speedMul: .25, anim: [[0, 'charge', 500], [.3, 'castUp', 900]],
    steps: Array.from({ length: n }, (_, i) => ({ at: .3 + i * .13, fn: () => {
      const tg = findTarget(f, 30), F = fwd(f.yaw), R = rightOf(f.yaw), spread = (i - (n - 1) / 2) * .22, from = new V3(f.pos.x + R.x * spread * 1.6, f.pos.y + 2.3 + (i % 2) * .5, f.pos.z + R.z * spread * 1.6), q = tg ? chestOf(tg) : null;
      const yaw = (q ? Math.atan2(q.x - from.x, q.z - from.z) : f.yaw) + spread * .5;
      spawnProj(f, yaw, { from, color: '#ffb020', speed: 34, size: .34, long: 3.2, homing: 4, range: 34, explode: 2.1, dmg: o.dmg || 5, stun: .3, kb: 5, up: 6 });
      burst(from, 10, '#ffb020', 5, .2, .35, .6); sfx('fire', from, .5);
    } })) });
});
