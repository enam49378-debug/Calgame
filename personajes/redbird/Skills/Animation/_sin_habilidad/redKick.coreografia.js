/* Coreografía (cinemática) · personaje: redbird · habilidad: (sin habilidad asignada) · id: redKick
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// patada al cielo, lo sigue en el aire a patadas, se da vuelta encima de él y lo baja con un rayo de los ojos
CF.coreografia('redKick', function () {
  return {
    dur: 3.0,
    att: [[.05, 'kick_w'], [.18, 'kickHigh'], [.45, 'jump'], [.7, 'kick'], [.9, 'kickHigh'], [1.1, 'kick'], [1.4, 'aUpside'], [1.7, 'aUpside'], [2.0, 'fall'], [2.35, 'land'], [2.8, 'redStance']],
    vic: [[.18, 'vKick1'], [.45, 'vLaunch'], [.7, 'vKick2'], [.9, 'vKick1'], [1.1, 'vSpinA'], [1.55, 'vFloat'], [1.8, 'vBack'], [2.2, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .3, 0], [.7, 0, 3.0, .8, 0], [1.1, 0, 4.4, .9, 0], [1.4, 0, 6.6, 1.3, 0], [1.75, 0, 6.4, 1.3, 0], [2.3, 0, 0, .3, 0, 'i']],
    vpos: [[0, 0, 0, 1.1, 0], [.18, 0, .5, 1.3, 0], [.7, 0, 3.6, 1.9, 0], [1.1, 0, 4.8, 2.0, 1], [1.4, 0, 5.2, 2.1, 3], [1.75, 0, 5.0, 2.0, 3.14], [2.1, 0, 0, 2.1, 3.14, 'i']],
    ev: [
      { t: .18, hit: 3, fx: 'impact', imp: 1 },
      { t: .7, hit: 2, fx: 'slash', tilt: 1.2 },
      { t: .9, hit: 2, fx: 'slash', tilt: -1 },
      { t: 1.1, hit: 2, fx: 'impact' },
      { t: 1.45, eyes: 1, fx: 'charge', at: 'eyes', slow: .25 },
      { t: 1.75, rel: { dmg: 8, kb: 0, up: -26, rag: 2 }, fx: 'beam', big: 1, len: 4 },
      { t: 2.1, fx: 'boom', at: 'ground', r: 2.8, big: 1 },
      { t: 2.12, fx: 'crack', at: 'ground', eyes: 0 },
    ],
    shots: [[0, 'lowA', { s: -1 }], [.4, 'up'], [.8, 'orbit', { r: 4.5, spd: 2.8, h: 1 }], [1.35, 'faceA', { s: -1 }], [1.75, 'top'], [2.1, 'ground'], [2.5, 'hero']],
  };
});
