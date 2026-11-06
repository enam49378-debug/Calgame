/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebHug
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Abrazo de Verity: la presenta, aparece detrás del rival, lo mira fijo con su sonrisa enorme y lo lanza de un rayo
CF.coreografia('sebHug', function () {
  return {
    dur: 3.2, catch: 2, attClip: 'cine_abrazo', vicClip: 'cine_vic_abrazo',
    att: [[.1, 'aCatch'], [3.0, 'idle']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
    apos: [[0, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.7, 0], [1.9, 0, 0, 1.7, 0], [2.1, 0, .8, 1.9, 0], [2.4, 0, 3.0, 3.0, 0], [2.8, 0, 0, 3.4, 0, 'i'], [3.2, 0, 0, 3.4, 0]],
    ev: [
      { t: .2, text: '¿Conoces a Verity?', who: 'att' },
      { t: .5, vg: 'behind', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
      { t: .9, fx: 'charge', at: 'vic' },
      { t: 1.2, vg: 'stare', text: 'Ella lo sabe todo.', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 1.8, vg: 'fire', hit: 3, fx: 'impact', imp: 1 },
      { t: 2.1, rel: { dmg: 15, kb: 12, up: 8, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
      { t: 2.12, fx: 'flash', op: .5 },
      { t: 2.6, vg: 'leave' },
    ],
    shots: [[0, 'two', { fov: 50 }], [.45, 'lowA'], [.9, 'up', { fov: 54 }], [1.25, 'faceV', { fov: 34 }], [1.8, 'otsV', { fov: 44 }], [2.1, 'wide'], [2.7, 'hero', { s: -1 }]],
  };
});
