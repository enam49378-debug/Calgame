/* Habilidad: Verity Gigante  ·  personaje: sebolla  ·  movimiento: sebMount
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Verity Gigante: transformación, subida y montura
CF.mover('sebMount', function (f, o) {
    if (f.mount) return false;
    startAction(f, {
      name: 'sebMount', dur: 2.6, noControl: true, armor: true, speedMul: 0, aim: true, anim: [[0, 'castUp', 500]],
      start: () => {
        const F = fwd(f.yaw), M = f.mount = Object.assign(makeGiantVerity(), { phase: 'morph', t: 0, dur: o.dur || 12, pos: clampArena(new V3(f.pos.x + F.x * 5, 0, f.pos.z + F.z * 5), 3), yaw: f.yaw, ph: 0, mv: 0, sign: 1, charge: 0, chargeCd: 0, wdT: 0, chT: 0, from: null });
        M.pos.y = 0; M.g.scale.set(.02, .02, .02); scene.add(M.g); f.iframes = Math.max(f.iframes, 3);
        popText(chestOf(f), '¡Verity, ven!', '#ffd91a', 24); sfx('ult', M.pos); ringAt(new V3(M.pos.x, .1, M.pos.z), '#ffd91a', 6, .8); G.shake = Math.max(G.shake, .4);
      },
    });
  });
