/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebSandwich
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebSandwich', function () {
  return {
  dur: 3.2, catch: 2, dest: 1.1, attClip: 'cine_sandwich', vicClip: 'cine_vic_sandwich',
  att: [[.1, 'aCatch'], [3.0, 'idle']], vic: [[.1, 'vConfused'], [3.0, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [.45, 0, 0, 1.5, 0], [.62, 0, 0, 2.7, 0, 'o'], [.82, 0, 0, 2.7, 0], [.95, 0, 0, 1.5, 0, 'o'], [1.3, 0, 0, 1.5, 0], [1.47, 0, 0, 2.7, 0, 'o'], [1.67, 0, 0, 2.7, 0], [1.8, 0, 0, 1.5, 0, 'o'], [2.15, 0, 0, 1.5, 0], [2.35, 0, 0, 2.4, 0, 'o'], [2.5, 0, .6, 2.2, 0]],
  ev: [
    { t: .2, text: '¡Sándwich!', who: 'att' }, { t: .3, vg: 'behindV', fx: 'ring', at: 'vic', r: 2.5, face: 1, sfx: 'tp' },
    { t: .5, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: .85, vg: 'butt', hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 1.35, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 1.7, vg: 'butt', hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 2.2, hit: 3, fx: 'impact', big: 1, hs: .07 },
    { t: 2.4, text: '¡CLAP!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
    { t: 2.55, rel: { dmg: 11, kb: 6, up: 12, rag: 1.8 }, fx: 'boom', at: 'vic', r: 3.2, big: 1, slow: .3 },
    { t: 2.57, fx: 'flash', op: .55 }, { t: 2.7, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.3, 'wide'], [.5, 'ots', { s: 1, fov: 44 }], [1.0, 'otsV', { fov: 44 }], [1.4, 'ots', { s: -1, fov: 44 }], [1.85, 'lowA'], [2.3, 'faceV', { fov: 34 }], [2.55, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});
