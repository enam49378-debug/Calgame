/* Habilidad: Misil Estelar  ·  personaje: sunn  ·  movimiento: sunnNuke
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnNuke', function (f, o) {
  const tg = findTarget(f, 34), F = fwd(f.yaw), p = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12); p.y = groundAt(p.x, p.z);
  startAction(f, { name: 'sunnNuke', dur: 1.0, aim: true, speedMul: 0, anim: [[0, 'castUp', 1000]] });
  warnCircle(p, 7, '#ff3b30', 2.1); popText(chestOf(f), 'MISIL EN CAMINO', '#ff3b30', 24); sfx('whoosh', f.pos, .6);
  later(1.2, () => { for (let i = 0; i < 6; i++) emit(p.x + rand(-1, 1), p.y + 18 - i * 3, p.z + rand(-1, 1), 0, -30, 0, '#ffb020', .5, .4, 0, 1); });
  later(2.1, () => { if (!f.alive) return; explode(f, new V3(p.x, p.y + 1, p.z), 7, { dmg: o.dmg || 20, kb: 9, up: 20, ragdoll: 1.6, color: '#ff5a1a', guardBreak: true }); fireColumn(p, 6, '#ff5a1a'); ringAt(p, '#ffd54f', 10, .7); G.shake = Math.max(G.shake, 1); sfx('boom', p, 1); });
});
