/* Coreografía (cinemática) · personaje: javi · habilidad: Cadena de Lanza · id: javiChain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// CADENA DE LANZA · tironea la cadena en tensión, estoca al rival que llega volando, lo alza en la lanza,
// gira dos vueltas con él como una maza (cada vuelta más rápida) y lo lanza lejos.
CF.coreografia('javiChain', function () {
  return {
    dur: 3.2, pull: 1, attClip: 'cine_cadena', vicClip: 'cine_vic_cadena', trails: [[.5, .82], [1.3, 2.3]],
    vic: [[0, 'vJChainPull'], [.3, 'vJChainPull'], [.5, 'vJChainPull'], [.6, 'vJPierced'], [.72, 'vJShudder'], [.95, 'vJHang'], [1.3, 'vJHangLag'], [1.6, 'vJLaunch'], [2.2, 'vJLaunch'], [2.4, 'vJFloat']],
    apos: [[0, 0, 0, 0, 0], [.48, 0, 0, -.2, 0], [.62, 0, 0, .35, 0], [1.15, 0, 0, .35, 0], [1.4, 0, 0, .35, 1.3], [1.7, 0, 0, .3, 4.2], [2, 0, 0, .3, 9], [2.22, 0, 0, .3, 12.566], [3.2, 0, 0, .3, 12.566]],
    vpos: [[.5, 0, .15, 1.95, 0, 'o'], [.6, 0, .1, 1.9, 0], [3.2, 0, .1, 1.9, 0]],
    anchor: [[.62, 2.2, 'tip', 0, .12]],
    ev: [
      { t: .03, fx: 'magic', text: '¡ENGANCHADO!' },
      { t: .3, fx: 'elec' },
      { t: .62, hit: 4, fx: 'stab', imp: 1, slow: .18, sfx: 'heavy' },
      { t: .7, fx: 'ring', at: 'vic', r: 2.2 },
      { t: .95, text: '¡ARRIBA!', who: 'att', fx: 'impact' },
      { t: 1.4, fx: 'ring', at: 'att', r: 3.6 },
      { t: 1.45, hit: 1.5, sfx: 'swing', fx: 'ghost' },
      { t: 1.7, hit: 1.5, fx: 'lines', sfx: 'swing' },
      { t: 1.8, fx: 'ghost' },
      { t: 2, hit: 1.5, fx: 'lines', sfx: 'swing' },
      { t: 2.05, fx: 'ghost' },
      { t: 2.22, rel: { dmg: 9, kb: 28, up: 5, rag: 2.4 }, fx: 'slash', tilt: 0, imp: 1, slow: .3 },
      { t: 2.24, fx: 'boom', at: 'vic', r: 2.4 },
    ],
    shots: [[0, 'clv', { s: 1, d: 6, fov: 52 }], [.46, 'ots', { s: -1 }], [.56, 'tip', { s: 1, d: 4.8, fov: 46 }], [.78, 'cl', { s: 1, d: 4.8, fov: 52 }], [1.2, 'orbit', { s: 1, spd: 1.6, r: 4.8, h: .3, fov: 54, fit: false }], [2.18, 'clv', { s: -1, d: 4.6, roll: .06 }], [2.7, 'hero', { s: -1 }]],
  };
});
