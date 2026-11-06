/* Coreografía (cinemática) · personaje: javi · habilidad: Embestida Relámpago · id: javiDash
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// EMBESTIDA RELÁMPAGO · tres pasadas que atraviesan al rival (estocada, tajo y ascenso), pausa en el aire con la lanza
// hacia abajo y una picada que lo clava en el piso. Todo ocurre pegado al rival: cada pasada tiene su propia cámara.
CF.coreografia('javiDash', function () {
  return {
    dur: 3.5, catch: 2.2, reach: 'jCoil', attClip: 'cine_embestida', vicClip: 'cine_vic_embestida', trails: [[.3, .56], [.62, .88], [1.0, 1.3], [1.9, 2.27]],
    vic: [[0, 'vJReady'], [.3, 'vJReady'], [.4, 'vJPierced'], [.5, 'vJSideL'], [.6, 'vJAfterL'], [.7, 'vJPierced'], [.8, 'vJSideR'], [.9, 'vJAfterR'], [1.0, 'vJShudder'], [1.11, 'vJPierced'], [1.28, 'vJLaunch'], [1.5, 'vJHangLag'], [1.7, 'vJFloat'], [1.95, 'vJDiveCatch'], [2.1, 'vJFoldFall'], [2.2, 'vJGroundPre'], [2.26, 'vJGroundHit'], [2.3, 'vJGroundRebound'], [3.4, 'vJGroundRebound']],
    apos: [[0, 0, 0, 0, 0], [.12, 0, 0, -.25, 0], [.26, 0, 0, -.25, 0],
      [.3, -2, 0, .2, -.927, 'c'], [.46, 2, 0, 3.2, -.927, 'o'], [.56, 2.5, 0, 3.6, -.927, 'o'],
      [.62, 2.2, 0, .5, 1.069, 'c'], [.78, -2.2, 0, 2.9, 1.069, 'o'], [.88, -2.7, 0, 3.3, 1.069, 'o'],
      [.94, -1.2, 0, .5, -.785, 'c'], [1.02, -1.2, 0, .5, -.785], [1.11, 0, 1.7, 1.7, -.785], [1.2, 1.2, 3.4, 2.9, -.785],
      [1.5, .3, 5, 1.2, 0], [1.62, 0, 5.4, .9, 0], [1.95, 0, 5.4, .9, 0], [2.25, 0, 0, 1, 0, 'i'], [2.45, 0, 0, 1, 0], [3.5, 0, 0, 1, 0]],
    vpos: [[0, 0, 0, 1.7, 0], [.3, 0, 0, 1.7, 0], [.34, 0, 0, 1.7, 0], [.5, .12, .05, 1.74, .45], [.62, 0, 0, 1.7, .25], [.66, 0, 0, 1.7, .25], [.8, -.12, .05, 1.74, -.45], [.94, 0, 0, 1.7, 0],
      [1.11, 0, .05, 1.7, 0], [1.25, 0, 1.4, 1.7, .3], [1.5, 0, 3.2, 1.7, .8], [1.62, 0, 3.8, 1.7, 1], [1.97, 0, 3.8, 1.7, 1.6], [2.25, 0, 0, 1.7, 1.6, 'i'], [3.5, 0, 0, 1.7, 1.6]],
    anchor: [[1.97, 2.25, 'tip', 0, .1]],
    ev: [
      { t: .26, fx: 'lines', sfx: 'dash' },
      { t: .3, fx: 'ghost' },
      { t: .34, hit: 3, fx: 'line', imp: 1, sfx: 'slash' },
      { t: .62, fx: 'ghost', sfx: 'dash' },
      { t: .66, hit: 3, fx: 'line', sfx: 'slash' },
      { t: .94, fx: 'ghost' },
      { t: 1.11, hit: 3, fx: 'xcut', slow: .2, imp: 1, sfx: 'heavy' },
      { t: 1.14, fx: 'ring', at: 'vic', r: 2.8 },
      { t: 1.62, fx: 'charge', at: 'att', text: '¡DESDE ARRIBA!', who: 'att', slow: .3 },
      { t: 1.93, fx: 'lines', sfx: 'swing' },
      { t: 2.2, fx: 'stab', hit: 2 },
      { t: 2.25, fx: 'boom', at: 'ground', big: 1, r: 3.4, imp: 1 },
      { t: 2.26, fx: 'crack', at: 'ground', r: 5.5 },
      { t: 2.27, rel: { dmg: 7, kb: 2, up: 3, rag: 2 }, slow: .3 },
    ],
    shots: [[0, 'faceA', { s: 1, fov: 34 }], [.26, 'pass', { h: -.927, s: 1, d: 5.2, fov: 50 }], [.6, 'pass', { h: 1.069, s: -1, d: 5, fov: 50, roll: .06 }], [.92, 'cl', { s: 1, d: 4.6, fov: 54 }], [1.3, 'cl', { s: -1, d: 5.4, fov: 54 }],
      [1.62, 'faceA', { s: -1, fov: 40 }], [1.93, 'cl', { s: 1, d: 4.4, fov: 52, roll: -.05 }], [2.24, 'clv', { s: -1, d: 4, fov: 48, roll: .07 }], [2.75, 'hero', { s: -1 }]],
  };
});
