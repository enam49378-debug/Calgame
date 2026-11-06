/* Coreografía (cinemática) · personaje: redbird · habilidad: (sin habilidad asignada) · id: redExec
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// lo levanta del cuello, se baja las gafas, carga los ojos a quemarropa y lo atraviesa con el láser
CF.coreografia('redExec', function () {
  return {
    dur: 3.2,
    att: [[.1, 'aCollar'], [.7, 'aCollar'], [1.0, 'visorTouch'], [1.8, 'visorTouch'], [2.0, 'aCollar'], [2.5, 'lookDown'], [3.0, 'redHero']],
    vic: [[.1, 'vLifted'], [.7, 'vDangle'], [1.5, 'vDangle'], [1.85, 'vShock1'], [2.0, 'vShock2'], [2.35, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [.7, 0, 0, .2, 0], [2.0, 0, 0, .2, 0], [2.3, 0, 0, -.4, 0]],
    vpos: [[0, 0, 0, 1.1, 0], [.4, 0, 1.0, 1.1, 0], [1.5, 0, 1.2, 1.15, 0], [2.0, 0, 1.25, 1.2, 0]],
    ev: [
      { t: .1, text: '¡TE TENGO!', who: 'att' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: 1.0, eyes: 1, fx: 'charge', at: 'eyes' },
      { t: 1.3, fx: 'charge', at: 'eyes' },
      { t: 1.6, fx: 'charge', at: 'eyes', sfx: 'ult' },
      { t: 1.85, hit: 3, fx: 'beam', len: 3, imp: 1 },
      { t: 2.0, rel: { dmg: 11, kb: 30, up: 4, rag: 2.3 }, fx: 'beam', big: 1, len: 14, slow: .3 },
      { t: 2.05, fx: 'flash', op: .55 },
      { t: 2.6, eyes: 0 },
    ],
    shots: [[0, 'two'], [.45, 'lowA'], [.95, 'otsV'], [1.55, 'faceV'], [1.85, 'ots', { fov: 40 }], [2.05, 'wide'], [2.5, 'hero']],
  };
});
