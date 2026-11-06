/* Coreografía (cinemática) · personaje: rocket · habilidad: Capullo Mortal · id: rkCocoon
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// Capullo Mortal: lo envuelve en seda, lo alza, lo hace girar sobre su cabeza y lo estrella contra el piso
CF.coreografia('rkCocoon', function () {
  return {
    dur: 3.4, catch: 2, attClip: 'cine_capullo', vicClip: 'cine_vic_capullo',
    att: [[.1, 'aCatch'], [3.2, 'ninja']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
    apos: [[0, 0, 0, 0, 0]],
    vpos: [[0, 0, 0, 1.5, 0], [.5, 0, 0, 1.5, 0], [.9, 0, .8, 1.5, .4], [1.4, 0, 3.4, 1.5, 2.4], [1.9, 0, 4.4, 1.5, 5.4], [2.1, 0, 4.2, 1.5, 6.3], [2.3, 0, .4, 1.7, 6.3, 'i']],
    ev: [
      { t: .1, text: '¡Quietito!', who: 'att' },
      { t: .45, cocoon: 1.9, fx: 'line', at: 'vic', sfx: 'zap' },
      { t: .5, hit: 2, fx: 'impact' },
      { t: .75, fx: 'line', at: 'vic' },
      { t: 1.0, fx: 'ring', at: 'vic', r: 2, face: 1 },
      { t: 1.4, fx: 'charge', at: 'att' },
      { t: 1.9, text: '¡A dormir!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
      { t: 2.28, rel: { dmg: 11, kb: 5, up: 0, rag: 1.8 }, fx: 'boom', at: 'ground', r: 3.4, big: 1, slow: .25 },
      { t: 2.3, fx: 'crack', at: 'ground' },
    ],
    shots: [[0, 'two', { fov: 50 }], [.5, 'lowA'], [1.2, 'up'], [1.8, 'orbit', { r: 5, spd: 2.4, h: 1 }], [2.15, 'top'], [2.3, 'ground'], [2.8, 'hero']],
  };
});
