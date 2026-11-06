/* Habilidad: Ctrl + Z  ·  personaje: jesuluto  ·  movimiento: jlUndo
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('jlUndo', function (f, o) {
    startAction(f, {
      name: 'jlUndo', dur: .55, speedMul: 0, armor: true, anim: [[0, 'charge', 500]],
      start: () => { jlScreen(f, 'undo', 1.2); popText(chestOf(f), 'Ctrl + Z', '#7ad7ff', 26); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', 3, .4); },
      steps: [{ at: .3, fn: () => {
        const h = f.jlHist, snap = h && h[0]; if (!snap) return;
        explode(f, chestOf(f), 3.4, { dmg: 4, stun: .5, kb: 8, up: 3, color: '#0078d7', hitstop: .04, shake: .2 });   // la «copia» que deja atrás estalla
        ghost(f, '#0078d7', .6, .45);
        const heal = Math.max(10, (snap.hp - f.hp) * .6); if (!f.remote) { f.pos.set(snap.x, snap.y, snap.z); f.vel.set(0, 0, 0); f.hp = Math.min(f.maxHp, f.hp + heal); }
        f.jlHist = [];
        ghost(f, '#0078d7', .6, .45); burst(chestOf(f), 24, '#7ad7ff', 8, .18, .5, 0); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#7ad7ff', 4, .45); sfx('tp', f.pos);
        popText(chestOf(f), '+' + Math.round(heal), '#7dff6a', 22);
      } }],
    });
  });
