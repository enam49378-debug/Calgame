/* Coreografía (cinemática) · personaje: titan · habilidad: (sin habilidad asignada) · id: titanCrush
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// lo levanta por encima de la cabeza, salta altísimo y cae con un piledriver que hace temblar el mapa
CF.coreografia('titanCrush', function () {
  return {
    dur: 3.4,
    att: [[.1, 'grab'], [.4, 'lift'], [.8, 'suplex'], [1.2, 'jump'], [1.7, 'suplex'], [2.0, 'slamDown'], [2.4, 'stomp'], [3.0, 'heavy']],
    vic: [[.1, 'hurtA'], [.4, 'vLifted'], [.8, 'vUpside'], [1.7, 'vUpside'], [2.0, 'vUpside'], [2.2, 'downB']],
    apos: [[0, 0, 0, 0, 0], [.8, 0, 0, 0, 0], [1.2, 0, 1.2, 0, 0], [1.6, 0, 7, .3, 1.57, 's'], [1.75, 0, 7.2, .3, 3.14], [2.0, 0, 0, .3, 6.28, 'i'], [3.4, 0, 0, .3, 6.28]],
    vpos: [[0, 0, 0, 1.1, 0], [.4, 0, 1.3, .9, 0], [.8, 0, 3.1, .3, 0], [1.2, 0, 4.3, .3, 0], [1.6, 0, 10.1, .5, 1.57, 's'], [1.75, 0, 10.3, .5, 3.14], [2.0, 0, 1.7, .6, 6.28, 'i'], [2.2, 0, 0, .8, 6.28]],
    ev: [
      { t: .1, hit: 2, fx: 'impact', sfx: 'grab' },
      { t: .8, text: '¡ARRIBA!', who: 'att', fx: 'ring', at: 'att', r: 2 },
      { t: 1.2, fx: 'boom', at: 'ground', r: 2 },
      { t: 1.65, slow: .3, fx: 'lines' },
      { t: 2.0, rel: { dmg: 16, kb: 4, up: 6, rag: 2.6 }, fx: 'boom', at: 'ground', r: 4.5, big: 1 },
      { t: 2.02, fx: 'crack', at: 'ground', r: 7 },
      { t: 2.05, fx: 'flash', op: .6 },
      { t: 2.4, fx: 'boom', at: 'ground', r: 2.5 },
    ],
    shots: [[0, 'two'], [.4, 'lowA'], [1.1, 'up', { s: -1 }], [1.55, 'top'], [1.95, 'wide'], [2.05, 'ground'], [2.6, 'hero']],
  };
});
