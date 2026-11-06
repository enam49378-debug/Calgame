/* Coreografía (cinemática) · personaje: yuki · habilidad: (sin habilidad asignada) · id: yukiTomb
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// lo congela en una estatua, camina a su alrededor, le apoya un dedo y la estatua estalla en mil pedazos
CF.coreografia('yukiTomb', function () {
  return {
    dur: 3.4,
    att: [[.1, 'palm'], [.5, 'signs'], [.9, 'idle'], [1.6, 'idle'], [2.0, 'point'], [2.3, 'point'], [2.5, 'elegant'], [3.3, 'idle']],
    vic: [[.1, 'hurtFwd'], [.4, 'vFrozenStand'], [2.4, 'vFrozenStand'], [2.6, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [.5, 0, 0, -.3, 0], [.9, 1.6, 0, .4, -1.2], [1.4, 1.3, 0, 2.2, -2.4], [1.9, 0, 0, 2.7, -3.14], [2.4, 0, 0, 2.4, -3.14], [2.7, 0, 0, 3.2, 0]],
    vpos: [[0, 0, 0, 1.1, 0]],
    ev: [
      { t: .1, hit: 2, fx: 'ice', at: 'ground', r: 1.4 },
      { t: .4, freeze: 2.05, hit: 2, fx: 'ring', r: 2.2 },
      { t: .9, text: 'Quedate quieto.', who: 'att' },
      { t: 2.3, fx: 'ring', at: 'vic', r: 1, face: 1, sfx: 'ice' },
      { t: 2.5, rel: { dmg: 12, kb: 10, up: 8, rag: 2.2 }, fx: 'shatter', slow: .4 },
      { t: 2.52, fx: 'ice', at: 'ground', r: 2.6 },
      { t: 2.55, fx: 'flash', op: .5 },
    ],
    shots: [[0, 'two'], [.4, 'lowV'], [.9, 'orbit', { r: 4, spd: -2.2, h: .3 }], [2.0, 'faceA'], [2.4, 'faceV', { fov: 34 }], [2.6, 'wide']],
  };
});
