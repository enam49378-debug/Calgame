/* Coreografía (cinemática) · personaje: gato · habilidad: (sin habilidad asignada) · id: gatoCopies
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// cuatro copias aparecen alrededor y lo pasan de una a otra como pelota; el verdadero espera y lo remata
CF.coreografia('gatoCopies', function () {
  return {
    dur: 3.2, catch: 2, attClip: 'cine_copias', vicClip: 'cine_vic_copias',
    att: [[.1, 'cast'], [.35, 'signs'], [1.6, 'signs'], [1.9, 'scepterW'], [2.15, 'scepterSmash'], [2.6, 'aTaunt'], [3.1, 'elegant']],
    vic: [[.35, 'hurtSideL'], [.6, 'hurtSideR'], [.85, 'vGut'], [1.1, 'vSpinA'], [1.4, 'vFlip'], [1.75, 'vFloat'], [2.15, 'vLaunch'], [2.6, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.35, 0, 0, -2.2, 0, 'c'], [1.8, 0, 0, -2.2, 0], [2.0, 0, 0, .6, 0]],
    vpos: [[0, 0, 0, 1.2, 0], [.35, .8, .2, 1.4, .9], [.6, -.8, .4, 1.5, -.9], [.85, 0, .6, 2.3, 0], [1.1, 0, 1.6, 1.5, 3], [1.4, 0, 2.4, .9, 6], [1.75, 0, 1.6, 1.2, 6.28], [2.15, 0, 1.4, 1.4, 6.28], [2.6, 0, 3.4, 5, 6.28]],
    ev: [
      { t: .2, fx: 'copies', text: '¿Cuál soy yo?', who: 'att' },
      { t: .35, hit: 2, fx: 'clone', a: 0 },
      { t: .6, hit: 2, fx: 'clone', a: 1.57 },
      { t: .85, hit: 2, fx: 'clone', a: 3.14 },
      { t: 1.1, hit: 2, fx: 'clone', a: -1.57, imp: 1 },
      { t: 1.4, fx: 'magic' },
      { t: 2.15, rel: { dmg: 8, kb: 16, up: 10, rag: 2.2 }, fx: 'impact', big: 1, slow: .3 },
      { t: 2.17, fx: 'magic' },
      { t: .35, fx: 'line' },
      { t: .6, fx: 'line' },
      { t: .85, fx: 'line' },
      { t: 1.1, fx: 'line' },
      { t: 1.6, text: 'Por aquí...', who: 'att' },
      { t: 1.78, twirl: [1, .5] },
      { t: 2.0, fx: 'charge', at: 'att' },
      { t: 2.6, text: '¡Era yo!', who: 'att' },
    ],
    shots: [[0, 'two', { fov: 52 }], [.3, 'top'], [.8, 'orbit', { r: 5, spd: 3.4 }], [1.35, 'lowV', { s: -1, fov: 54 }], [1.8, 'ots', { fov: 42 }], [2.15, 'faceA', { fov: 40 }], [2.6, 'hero', { s: -1 }]],
  };
});
