/* Habilidad: Armadura Reforzada  ·  personaje: sunn  ·  movimiento: sunnShield
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js. */
CF.mover('sunnShield', function (f, o) {
  startAction(f, { name: 'sunnShield', dur: .9, aim: false, speedMul: .4, anim: [[0, 'charge', 500], [.4, 'castUp', 700]] });
  f.hp = Math.min(f.maxHp, f.hp + (o.heal || 18)); f.iframes = Math.max(f.iframes, o.time || 2.5);
  ringAt(new V3(f.pos.x, f.pos.y + .3, f.pos.z), '#7df9ff', 3, .6); lightColumn(f.pos, '#7df9ff', 8); popText(chestOf(f), 'ARMADURA REFORZADA', '#7df9ff', 22); sfx('ult', f.pos, .6);
  for (let i = 0; i < 12; i++) later(i * .2, () => { if (f.alive && f.iframes > 0) burst(chestOf(f), 5, '#7df9ff', 4, .3, .4, .2); });
});
