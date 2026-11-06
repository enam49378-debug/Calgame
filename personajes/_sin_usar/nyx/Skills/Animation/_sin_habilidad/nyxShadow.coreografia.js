/* Coreografía (cinemática) · personaje: nyx · habilidad: (sin habilidad asignada) · id: nyxShadow
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// aparece detrás, cinco cortes desde la sombra, vuelve a su lugar, guarda el arma... y recién ahí cae
CF.coreografia('nyxShadow', function () {
  return {
    dur: 3.3,
    att: [[.08, 'slashW'], [.2, 'slash'], [.45, 'slash'], [.7, 'slash'], [.95, 'slash'], [1.2, 'slash'], [1.5, 'ninja'], [2.2, 'ninja'], [2.4, 'signs'], [3.2, 'ninja']],
    vic: [[.2, 'hurtSideL'], [.45, 'hurtSideR'], [.7, 'hurtFwd'], [.95, 'hurtSideL'], [1.2, 'vStagger'], [2.3, 'vStagger'], [2.5, 'vShock1'], [2.9, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, 2.4, 3.14, 'c'], [.45, 1.6, 0, 1.2, -1.57, 'c'], [.7, 0, 1.2, 1.2, 0, 'c'], [.95, -1.6, 0, 1.2, 1.57, 'c'], [1.2, 0, 0, -.2, 0, 'c'], [1.5, 0, 0, -1.6, 3.14], [3.3, 0, 0, -1.6, 3.14]],
    vpos: [[0, 0, 0, 1.2, 0], [2.3, 0, 0, 1.2, 0], [2.6, 0, 0, 1.4, 0]],
    ev: [
      { t: .2, fx: 'line', hit: 2 }, { t: .45, fx: 'line', hit: 2 }, { t: .7, fx: 'line', hit: 2 }, { t: .95, fx: 'line', hit: 2 },
      { t: 1.2, fx: 'xcut', hit: 1, imp: 1 },
      { t: 1.5, text: 'Nada personal.', who: 'att' },
      { t: 2.4, sfx: 'draw' },
      { t: 2.5, rel: { dmg: 10, kb: 2, up: 2, rag: 2.4 }, fx: 'xcut', slow: .35 },
      { t: 2.52, fx: 'flash', op: .5 },
    ],
    shots: [[0, 'two'], [.18, 'top'], [.6, 'orbit', { r: 3.6, spd: -3 }], [1.25, 'faceV'], [1.55, 'hero', { s: -1 }], [2.35, 'two', { s: -1 }], [2.6, 'faceV']],
  };
});
