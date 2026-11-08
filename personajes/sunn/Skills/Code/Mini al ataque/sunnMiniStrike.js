/* Habilidad: Mini al ataque  ·  personaje: sunn  ·  movimiento: sunnMiniStrike
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnMiniStrike', function (f, o) {
  const tg = findTarget(f, o.range || 24);
  startAction(f, { name: 'sunnMiniStrike', dur: .45, aim: true, speedMul: .6, anim: [[0, 'castUp', 800]] });
  if (!tg) { popText(chestOf(f), 'Mini: ¿a quién?', '#ff8fb0', 18); return; }
  popText(chestOf(f), '¡Mini, ataca!', '#ff8fb0', 20);
  if (window.CF_MINI) CF_MINI.cmd(f, 'strike', tg, 2.3);
  for (let i = 0; i < 6; i++) later(.5 + i * .22, () => { if (!f.alive || !tg.alive) return; const mp = window.CF_MINI && CF_MINI.pos(f); if (mp && Math.hypot(mp.x - tg.pos.x, mp.z - tg.pos.z) > 4) return; applyHit(f, tg, { dmg: o.dmg || 2.8, stun: .2, kb: 1.2, up: 0, color: '#ff8fb0', noAssist: true, hitstop: .02 }); burst(chestOf(tg), 5, '#ff8fb0', 5, .14, .25, 0); sfx('hit', tg.pos, .4); });
  later(1.95, () => { if (!f.alive || !tg.alive) return; applyHit(f, tg, { dmg: o.dmg2 || 6, stun: .5, kb: 8, up: 11, ragdoll: .9, color: '#ffd54f', guardBreak: true }); ringAt(chestOf(tg), '#ffd54f', 2.4, .35); popText(chestOf(tg), '¡PATADA DE MINI!', '#ffd54f', 22); shakeFrom(tg.pos, .3); });
});
