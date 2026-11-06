/* Coreografía (cinemática) · personaje: gato · habilidad: Cadena Mágica · id: gatoChain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// hechizo que lo atrae, lo frena a un palmo, le da un golpecito en la frente y lo hace estallar
CF.coreografia('gatoChain', function () {
  return {
    dur: 2.8, pull: 1, attClip: 'cine_cadena', vicClip: 'cine_vic_cadena',
    att: [[.1, 'magicPalm'], [.55, 'magicPalm'], [.8, 'bow'], [1.2, 'bow'], [1.4, 'point'], [1.6, 'point'], [1.75, 'elegant'], [2.6, 'gatoHero']],
    vic: [[.1, 'vFloat'], [.6, 'vFrozenStand'], [1.4, 'vFrozenStand'], [1.6, 'vStagger'], [1.95, 'vShock1'], [2.1, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [1.75, 0, 0, 0, 0], [2.0, 0, 0, -.4, 3.14]],
    vpos: [[.55, 0, .6, 1.0, 0], [1.4, 0, .5, 1.0, 0], [1.6, 0, .1, 1.2, 0], [1.95, 0, 0, 1.4, 0]],
    ev: [
      { t: .05, fx: 'magic', hit: 2 },
      { t: .6, text: 'Shh...', who: 'att' },
      { t: 1.4, fx: 'ring', at: 'vic', r: 1.2, face: 1 },
      { t: 1.6, hit: 1, sfx: 'block' },
      { t: 1.75, eyes: 1 },
      { t: 1.95, fx: 'charge' },
      { t: 2.1, rel: { dmg: 9, kb: 20, up: 6, rag: 2.2 }, fx: 'boom', r: 2.2, slow: .3 },
      { t: .3, fx: 'ring', at: 'vic', r: 1.6 },
      { t: 1.2, text: 'Quietito...', who: 'att' },
      { t: 1.58, fx: 'impact', imp: 1 },
      { t: 2.0, fx: 'charge', at: 'vic' },
      { t: 2.6, text: 'Qué desastre.', who: 'att' },
    ],
    shots: [[0, 'follow'], [.6, 'two', { fov: 50 }], [1.25, 'faceV', { fov: 36 }], [1.55, 'faceA', { s: -1, fov: 34 }], [1.95, 'otsV', { fov: 44 }], [2.15, 'wide'], [2.55, 'hero', { s: -1 }]],
  };
});
