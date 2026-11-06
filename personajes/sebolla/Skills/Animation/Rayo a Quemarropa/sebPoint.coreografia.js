/* Coreografía (cinemática) · personaje: sebolla · habilidad: Rayo a Quemarropa · id: sebPoint
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebPoint', function () {
  return {
  dur: 3.6, catch: 2, dest: 1.3, attClip: 'cine_punto', vicClip: 'cine_vic_punto',
  att: [[.1, 'aCatch'], [3.4, 'idle']], vic: [[.1, 'vConfused'], [3.4, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.3, 0], [2.2, 0, .3, 1.3, 0], [2.45, 0, 1.0, 3.7, 0, 'o'], [2.6, 0, 1.0, 3.7, 0]],
  ev: [
    { t: .2, text: '¡Ven acá!', who: 'att' }, { t: .3, vg: 'behind', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
    { t: .8, hit: 2.2, fx: 'impact', big: 1 }, { t: 1.1, hit: 2.2, fx: 'impact', big: 1 }, { t: 1.4, hit: 2.2, fx: 'impact', big: 1 },
    { t: 1.0, vg: 'stare', text: 'Ella lo sabe todo.', who: 'att' },
    { t: 1.5, fx: 'charge', at: 'vic' }, { t: 1.8, fx: 'charge', at: 'vic' }, { t: 2.0, fx: 'charge', at: 'vic' },
    { t: 2.2, text: '¡Verity, fuego!', who: 'att' },
    { t: 2.45, vg: 'fire', fx: 'impact', imp: 1 },
    { t: 2.55, rel: { dmg: 20, kb: 14, up: 10, rag: 2.2 }, fx: 'boom', at: 'vic', r: 3.4, big: 1, slow: .3 },
    { t: 2.57, fx: 'flash', op: .6 }, { t: 3.0, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'faceV', { fov: 34 }], [.8, 'ots', { s: 1, fov: 44 }], [1.5, 'faceA', { s: -1, fov: 36 }], [2.0, 'wide'], [2.4, 'otsV', { fov: 40 }], [2.6, 'wide'], [3.1, 'hero', { s: -1 }]],
};
});
