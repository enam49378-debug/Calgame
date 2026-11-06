/* Coreografía (cinemática) · personaje: gato · habilidad: Truco Final · id: gatoTrick
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// reverencia burlona, lo levanta con el cetro, lo da vuelta en el aire y una copia lo remata desde abajo
CF.coreografia('gatoTrick', function () {
  return {
    dur: 3.4, attClip: 'cine_truco', vicClip: 'cine_vic_truco',
    att: [[.15, 'bow'], [.6, 'bow'], [.9, 'magicPalm'], [1.3, 'castUp'], [1.75, 'scepterW'], [2.05, 'point'], [2.4, 'scepterSmash'], [2.8, 'aTaunt'], [3.3, 'gatoHero']],
    vic: [[.2, 'vConfused'], [.9, 'vFloat'], [1.3, 'vUpside'], [1.75, 'vUpside'], [2.4, 'vLaunch'], [2.8, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.6, 0, 0, -.3, 0], [.9, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.3, 0], [.6, 0, 0, 1.5, 0], [1.3, 0, 2.2, 1.8, 3.14], [1.75, 0, 2.6, 1.9, 6.28], [2.05, 0, 2.4, 1.9, 6.6], [2.45, 0, 4.2, 2.5, 6.6], [2.8, 0, 5.5, 3.2, 7]],
    ev: [
      { t: .2, text: '¿Una reverencia?', who: 'att' },
      { t: .9, fx: 'magic', hit: 2 },
      { t: 1.35, fx: 'ring', r: 2.5, hit: 2 },
      { t: 1.75, fx: 'magic' },
      { t: 2.05, fx: 'clone', a: 1.57 },
      { t: 2.3, fx: 'copies' },
      { t: 2.45, rel: { dmg: 10, kb: 6, up: 14, rag: 2.4 }, fx: 'xcut', slow: .35 },
      { t: 2.5, fx: 'flash', op: .4 },
      { t: 2.8, text: 'Todo era un truco.', who: 'att' },
      { t: .15, fx: 'ring', at: 'att', r: 2, face: 1 },
      { t: 1.15, fx: 'charge', at: 'vic', sfx: 'tp' },
      { t: 1.5, twirl: [1, .6] },
      { t: 1.7, fx: 'line', at: 'vic' },
      { t: 2.25, fx: 'charge', at: 'att' },
      { t: 2.6, fx: 'ring', at: 'ground', r: 3, big: 1 },
    ],
    shots: [[0, 'hero', { s: -1, fov: 50 }], [.55, 'faceA', { fov: 38 }], [.95, 'lowV', { fov: 54 }], [1.45, 'orbit', { r: 4.2, h: 1.5, spd: -2.2, fov: 50 }], [2.0, 'faceV', { fov: 38 }], [2.28, 'up', { fov: 56 }], [2.5, 'wide'], [2.8, 'faceA', { s: -1, fov: 36 }], [3.2, 'hero']],
  };
});
