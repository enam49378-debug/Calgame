/* Coreografía (cinemática) · personaje: brasa · habilidad: (sin habilidad asignada) · id: brasaVolcano
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// patada que lo dobla, lo hace girar con patadas de fuego en espiral y abre un volcán bajo sus pies
CF.coreografia('brasaVolcano', function () {
  return {
    dur: 3.3,
    att: [[.08, 'kick_w'], [.2, 'kick'], [.5, 'kickHigh'], [.8, 'kick'], [1.1, 'kickHigh'], [1.4, 'spinPose'], [1.7, 'stomp'], [2.3, 'charge'], [2.55, 'castUp'], [3.2, 'idle']],
    vic: [[.2, 'vGut'], [.5, 'vKick1'], [.8, 'vSpinA'], [1.1, 'vKick2'], [1.4, 'vFlip'], [1.7, 'vStagger'], [2.3, 'vStagger'], [2.55, 'vLaunch'], [3, 'vFloat']],
    apos: [[0, 0, 0, 0, 0], [.5, 0, .4, .3, 1], [.8, 0, .8, .2, 3.4], [1.1, 0, .6, .3, 5.6], [1.4, 0, 0, .2, 6.28], [3.3, 0, 0, -.6, 6.28]],
    vpos: [[0, 0, 0, 1.1, 0], [.2, 0, 0, 1.6, 0], [.5, .4, .7, 1.7, .6], [.8, 0, 1.1, 1.8, 2], [1.1, -.4, 1.3, 1.7, 3.5], [1.4, 0, 1.4, 1.9, 6.28], [1.7, 0, 0, 2.2, 6.28], [2.3, 0, 0, 2.2, 6.28], [2.55, 0, 3, 2.3, 6.28], [3.3, 0, 7, 2.5, 6.28]],
    ev: [
      { t: .2, hit: 2, fx: 'impact', imp: 1 },
      { t: .5, hit: 2, fx: 'fire', at: 'vic', r: .8, h: 2 },
      { t: .8, hit: 2, fx: 'slash', tilt: .4 },
      { t: 1.1, hit: 2, fx: 'fire', at: 'vic', r: .8, h: 2 },
      { t: 1.4, fx: 'ring', at: 'att', r: 2.5 },
      { t: 1.7, fx: 'crack', at: 'ground', r: 3, sfx: 'heavy' },
      { t: 2.0, fx: 'fire', at: 'ground', r: .6, h: 1 },
      { t: 2.3, text: '¡ERUPCIÓN!', who: 'att', slow: .25 },
      { t: 2.55, rel: { dmg: 10, kb: 2, up: 20, rag: 2.4 }, fx: 'fire', at: 'ground', r: 2, h: 10 },
      { t: 2.6, fx: 'boom', at: 'ground', r: 2.6 },
    ],
    shots: [[0, 'two'], [.45, 'orbit', { r: 4.2, spd: 3 }], [1.45, 'lowA'], [1.75, 'ground'], [2.3, 'faceV'], [2.55, 'up'], [3.0, 'wide']],
  };
});
