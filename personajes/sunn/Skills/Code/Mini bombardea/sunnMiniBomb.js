/* Habilidad: Mini bombardea  ·  personaje: sunn  ·  movimiento: sunnMiniBomb
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnMiniBomb', function (f, o) {
  const tg = findTarget(f, 24), F = fwd(f.yaw), p = tg ? new V3(tg.pos.x, 0, tg.pos.z) : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9); p.y = groundAt(p.x, p.z);
  startAction(f, { name: 'sunnMiniBomb', dur: .45, aim: true, speedMul: .6, anim: [[0, 'castUp', 800]] });
  warnCircle(p, 3.4, '#ff8fb0', 1.25); popText(chestOf(f), '¡Mini, bombardea!', '#ff8fb0', 20);
  if (window.CF_MINI) CF_MINI.cmd(f, 'bomb', p, 2.1);
  [1.25, 1.5, 1.75].forEach((t, i) => later(t, () => { if (!f.alive) return; const q = new V3(p.x + rand(-1.6, 1.6) * (i ? 1 : 0), p.y + .6, p.z + rand(-1.6, 1.6) * (i ? 1 : 0)); explode(f, q, 2.7, { dmg: o.dmg || 5.5, kb: 4, up: 7, ragdoll: .6, color: '#ff8fb0' }); ringAt(q, '#ff8fb0', 3, .4); burst(q, 18, '#ffd0e0', 8, .25, .5, .6); sfx('crash', q, .5); }));
});
