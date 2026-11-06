/* Coreografía (cinemática) · personaje: sekza · habilidad: Cacería · id: sekHunt
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Cacería: lo atrapa con las garras, lo sube hasta las nubes y lo suelta en picada contra el piso
CF.coreografia('sekHunt', function () {
  return {
    dur: 3.4,
    att: [[.1, 'aCollar'], [.5, 'castUp'], [.9, 'aCollar'], [1.7, 'aCollar'], [2.0, 'fall'], [2.5, 'land'], [3.2, 'ninja']],
    vic: [[.1, 'vLifted'], [.9, 'vDangle'], [1.7, 'vDangle'], [2.0, 'vBack'], [2.45, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.45, 0, 0, .2, 0], [1.1, 0, 8.4, .3, 0], [1.7, 0, 9.4, .3, 0], [2.3, 0, 0, .2, 0, 'i']],
    vpos: [[0, 0, 0, 1.1, 0], [.45, 0, .8, 1.1, 0], [1.1, 0, 8.3, 1.2, 0], [1.7, 0, 9.1, 1.25, 0], [2.3, 0, .2, 1.5, 0, 'i']],
    ev: [
      { t: .1, text: '¡A CAZAR!', who: 'att' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: .6, fx: 'ring', at: 'att', r: 4, face: 1 },
      { t: 1.0, fx: 'magic', at: 'att' },
      { t: 1.7, text: '¡ADIÓS!', who: 'att' },
      { t: 2.28, rel: { dmg: 14, kb: 6, up: 0, rag: 1.8 }, fx: 'boom', at: 'ground', r: 3.4, big: 1, slow: .25 },
      { t: 2.3, fx: 'crack', at: 'ground' },
    ],
    shots: [[0, 'two'], [.45, 'lowA'], [1.0, 'up'], [1.5, 'orbit', { r: 5, spd: 2, h: 1 }], [2.0, 'top'], [2.3, 'ground'], [2.8, 'hero']],
  };
});
