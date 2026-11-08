/* Habilidad: Ultimate  ·  personaje: sunn  ·  movimiento: sunnUlt
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnUlt', function (f, o) {
  startAction(f, { name: 'sunnUlt', dur: 3.1, aim: true, speedMul: 0, noControl: true, anim: [[0, 'charge', 500], [.9, 'castUp', 1200]],
    steps: [{ at: .9, fn: () => { ringAt(new V3(f.pos.x, f.pos.y + .2, f.pos.z), '#ffd54f', 6, .6); lightColumn(f.pos, '#ffd54f', 14); sfx('ult', f.pos); if (f.isPlayer) showBanner('PROTOCOLO CASA VACÍA', '#ffd54f', 'Sunn y Mini lo bombardean todo'); } }] });
  if (window.CF_MINI) CF_MINI.cmd(f, 'bomb', new V3(f.pos.x, f.pos.y, f.pos.z), 3.2);
  for (let i = 0; i < (o.n || 11); i++) later(1.0 + i * .17, () => {
    if (!f.alive) return; const es = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < 36), tg = es.length ? es[i % es.length] : null, a = Math.random() * TAU, r = tg ? rand(0, 2.2) : rand(4, 14);
    const p = new V3((tg ? tg.pos.x : f.pos.x) + Math.cos(a) * r, 0, (tg ? tg.pos.z : f.pos.z) + Math.sin(a) * r); p.y = groundAt(p.x, p.z); warnCircle(p, 2.5, '#ffb020', .55);
    later(.55, () => { explode(f, new V3(p.x, p.y + .6, p.z), 2.6, { dmg: o.dmg || 6.5, kb: 4, up: 10, ragdoll: .8, color: '#ffb020', guardBreak: true }); fireColumn(p, 2.2, '#ffb020'); sfx('boom', p, .6); shakeFrom(p, .3); });
  });
});
