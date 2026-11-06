/* Coreografía (cinemática) · personaje: kaiza · habilidad: (sin habilidad asignada) · id: kaizaSerious
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// "en serio": se cruje los nudillos, ráfaga de puños que lo deja temblando y un único puñetazo serio
CF.coreografia('kaizaSerious', function () {
  return {
    dur: 3.4,
    att: [[.1, 'jabR'], [.25, 'jabL'], [.4, 'jabR'], [.55, 'jabL'], [.7, 'hook'], [.85, 'upper_w'], [1.0, 'upper'], [1.5, 'windup'], [2.1, 'windup'], [2.3, 'mega'], [2.9, 'mega'], [3.3, 'loose']],
    vic: [[.1, 'hurtA'], [.25, 'hurtB'], [.4, 'hurtA'], [.55, 'hurtB'], [.7, 'hurtSideR'], [1.0, 'vLaunch'], [1.5, 'vFloat'], [2.1, 'vFloat'], [2.3, 'vGut'], [2.6, 'vBack']],
    apos: [[0, 0, 0, 0, 0], [.7, 0, 0, .4, 0], [1.5, 0, 0, .5, 0], [2.1, 0, 0, .3, 0], [2.3, 0, 0, 1.1, 0]],
    vpos: [[0, 0, 0, 1.2, 0], [.7, 0, 0, 1.7, -.3], [1.0, 0, 1.2, 1.8, 0], [1.5, 0, 1.5, 1.9, 0], [2.1, 0, 1.3, 1.9, 0], [2.3, 0, 1.1, 2.0, 0]],
    ev: [
      { t: .1, hit: 1.5, fx: 'impact' }, { t: .25, hit: 1.5, fx: 'impact' }, { t: .4, hit: 1.5, fx: 'impact' }, { t: .55, hit: 1.5, fx: 'impact' },
      { t: .7, hit: 2, fx: 'impact', imp: 1 },
      { t: 1.0, hit: 2, fx: 'ring', r: 2 },
      { t: 1.55, text: 'Puño serio.', who: 'att', fx: 'charge', at: 'att', sfx: 'ult', slow: .3 },
      { t: 2.3, rel: { dmg: 13, kb: 40, up: 5, rag: 2.6 }, fx: 'boom', r: 3.5 },
      { t: 2.32, fx: 'flash', op: .7 },
      { t: 2.34, fx: 'lines' },
    ],
    shots: [[0, 'two'], [.45, 'otsV'], [.95, 'up'], [1.5, 'faceA'], [2.25, 'faceV', { fov: 34 }], [2.4, 'follow'], [2.8, 'wide']],
  };
});
