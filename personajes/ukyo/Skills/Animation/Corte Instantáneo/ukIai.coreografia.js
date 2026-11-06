/* Coreografía (cinemática) · personaje: ukyo · habilidad: Corte Instantáneo · id: ukIai
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Corte Instantáneo: la mano en la empuñadura, un destello, ya está detrás del rival envainando... y recién entonces los cortes lo alcanzan
CF.coreografia('ukIai', function () {
  return {
    dur: 3.0, catch: 2, attClip: 'cine_iai', vicClip: 'cine_vic_iai',
    att: [[.1, 'aCatch'], [2.8, 'idle']], vic: [[.1, 'vConfused'], [2.8, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.6, 0, 0, -.3, 0], [.78, 0, 0, -.3, 0], [.9, 0, 0, 3.6, 0, 'o'], [1.0, 0, 0, 3.6, 3.14], [3.0, 0, 0, 3.6, 3.14]],
    vpos: [[0, 0, 0, 1.8, 0], [1.9, 0, 0, 1.8, 0], [2.1, 0, 1.2, 2.2, 0], [2.4, 0, 3.0, 2.8, 0], [2.7, 0, 0, 3.0, 0, 'i'], [3.0, 0, 0, 3.0, 0]],
    ev: [
      { t: .2, fx: 'charge', at: 'att', text: '...', who: 'att' },
      { t: .6, fx: 'charge', at: 'att' },
      { t: .85, fx: 'ghost', sfx: 'dash', slow: .3 },
      { t: .9, fx: 'xcut', at: 'vic', imp: 1, sfx: 'slash' },
      { t: .95, fx: 'ring', at: 'vic', r: 2.5, face: 1 },
      { t: 1.9, sfx: 'draw', text: 'Ya estás cortado.', who: 'att' },
      { t: 2.0, hit: 3, fx: 'xcut', imp: 1, slow: .25 },
      { t: 2.1, rel: { dmg: 16, kb: 10, up: 8, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
      { t: 2.12, fx: 'flash', op: .5 },
    ],
    shots: [[0, 'two', { fov: 50 }], [.5, 'lowA'], [.85, 'wide'], [.95, 'ots', { s: -1, fov: 44 }], [1.4, 'faceA', { s: -1, fov: 36 }], [1.95, 'faceV', { fov: 36 }], [2.1, 'wide'], [2.6, 'hero', { s: -1 }]],
  };
});
