/* Habilidad: Formatear C:  ·  personaje: jesuluto  ·  movimiento: jlFormat
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlFormat', function (f, o) {
    const R = o.r || 6.2; let pct = 0;
    startAction(f, {
      name: 'jlFormat', dur: 1.9, speedMul: .12, armor: true, anim: [[0, 'charge', 500], [.5, 'vpose', 800]],
      start: () => { jlScreen(f, 'load', 2.0); popText(chestOf(f), 'Formateando C:\\ …', '#7ad7ff', 22); warnCircle(new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z), R, '#0078d7', 1.7); sfx('zap', f.pos); },
      tick: (a, t) => {
        const k = clamp(t / 1.65, 0, 1), np = Math.floor(k * 10) * 10;
        if (np !== pct) { pct = np; popText(new V3(f.pos.x, f.pos.y + 2.4, f.pos.z), pct + ' %', '#7ad7ff', 16); sfx('select', f.pos, .5); }
        if (Math.random() < .5) { const an = rand(0, TAU), rr = R * rand(.3, 1); emit(f.pos.x + Math.cos(an) * rr, f.pos.y + .2, f.pos.z + Math.sin(an) * rr, 0, rand(1, 3), 0, '#3aa0ff', .14, .5, 0, 1); }
      },
      steps: [{ at: 1.65, fn: () => {
        const c = new V3(f.pos.x, f.pos.y + 1, f.pos.z); popText(chestOf(f), '¡100 %!', '#ffffff', 26);
        explode(f, c, R, { dmg: o.dmg || 11, kb: 12, up: 7, ragdoll: .9, stun: .8, color: '#0078d7', guardBreak: true, hitstop: .1, shake: .5 }); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', R * 1.4, .5);
        burst(c, 40, '#3aa0ff', 11, .22, .6, .3); sfx('boom', f.pos);
      } }],
    });
  });
