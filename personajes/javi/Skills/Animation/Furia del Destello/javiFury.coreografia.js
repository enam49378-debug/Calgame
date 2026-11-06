/* Coreografía (cinemática) · personaje: javi · habilidad: Furia del Destello · id: javiFury
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// FURIA DEL DESTELLO (sin lanza, despierto) · lo agarra, diez puñetazos seguidos, un gancho que lo sube y un Destello Negro que lo manda lejos.
CF.coreografia('javiFury', function () {
  return {
    dur: 3.3, catch: 2.2, reach: 'jabR_w', trails: [[1.5, 1.75], [2.25, 2.5]],
    att: [[0, 'jabR_w'], [0.2, 'jabR'], [0.32, 'jabL'], [0.44, 'jabR'], [0.56, 'jabL'], [0.6799999999999999, 'jabR'], [0.8, 'jabL'], [0.9199999999999999, 'jabR'], [1.04, 'jabL'], [1.16, 'jabR'], [1.28, 'jabL'], [1.42, 'upper_w'], [1.58, 'upper'], [1.9, 'windup'], [2.28, 'mega'], [2.7, 'mega'], [3.1, 'ninja']],
    vic: [[0, 'vJReady'], [0.2, 'vJPierced'], [0.32, 'vJShudder'], [0.44, 'vJPierced'], [0.56, 'vJShudder'], [0.6799999999999999, 'vJPierced'], [0.8, 'vJShudder'], [0.9199999999999999, 'vJPierced'], [1.04, 'vJShudder'], [1.16, 'vJPierced'], [1.28, 'vJShudder'], [1.42, 'vJPierced'], [1.6, 'vJLaunch'], [1.9, 'vJHangLag'], [2.3, 'vJHangLag'], [2.45, 'vJLaunch'], [3.1, 'vJFloat']],
    apos: [[0, 0, 0, 0, 0], [.2, 0, 0, .1, 0], [1.4, 0, 0, .1, 0], [1.6, 0, 0, .35, 0], [2.3, 0, 0, .35, 0], [2.6, 0, 0, .1, 0], [3.3, 0, 0, .1, 0]],
    vpos: [[0, 0, 0, 1.6, 0], [.2, 0, 0, 1.45, 0], [1.4, 0, .02, 1.45, 0], [1.6, 0, 1.6, 1.5, 0, 'o'], [1.9, 0, 2.3, 1.5, 0], [2.3, 0, 2.4, 1.5, 0], [2.32, 0, 2.4, 1.6, 0], [3.3, 0, 2.4, 1.6, 0]],
    ev: [
      { t: 0.20, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.32, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.44, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.56, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.68, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.80, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 0.92, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.04, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.16, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.28, hit: 1.6, fx: 'line', sfx: 'swing', shake: .12, hs: .03 },
      { t: 1.58, hit: 4, fx: 'impact', imp: 1, hs: .1, shake: .4 },
      { t: 1.6, fx: 'ring', at: 'vic', r: 2.4 },
      { t: 1.9, fx: 'charge', at: 'att', text: '¡DESTELLO NEGRO!', who: 'att', slow: .3 },
      { t: 2.28, fx: 'boom', at: 'vic', big: 1, r: 4, imp: 1, hs: .2, shake: 1 },
      { t: 2.3, fx: 'crack', at: 'ground', r: 6 },
      { t: 2.32, rel: { dmg: 22, kb: 22, up: 7, rag: 2.4 }, slow: .3 },
    ],
    shots: [[0, 'two', { s: 1, fov: 46 }], [.2, 'cl', { s: -1, d: 4, fov: 52 }], [.7, 'cl', { s: 1, d: 3.6, fov: 56, roll: .05 }], [1.4, 'faceA', { s: -1, fov: 42 }], [1.9, 'cl', { s: 1, d: 4.4, fov: 52, roll: -.05 }], [2.28, 'clv', { s: -1, d: 4, fov: 48, roll: .07 }], [2.8, 'hero', { s: -1 }]],
  };
});
