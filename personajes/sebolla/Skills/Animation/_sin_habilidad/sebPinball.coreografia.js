/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebPinball
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebPinball', function () {
  return {
  dur: 3.4, catch: 2, dest: 1, attClip: 'cine_pelota', vicClip: 'cine_vic_pelota',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [.5, 0, 0, 1.5, 0], [.62, 0, 3.4, 1.8, 0, 'o'], [1.05, 0, 4.0, 2.0, 0], [1.32, 0, .2, 1.8, 0, 'i'], [1.65, 0, 2.4, 1.9, 0, 'o'], [1.95, 0, .4, 1.8, 0, 'i'], [2.1, 0, .9, 1.7, 0], [2.3, 0, 2.2, 2.3, 0], [2.45, 0, 2.2, 2.3, 0]],
  ev: [
    { t: .2, text: '¡Pelota!', who: 'att' },
    { t: .55, hit: 4, fx: 'impact', big: 1, sfx: 'heavy', hs: .08, shake: .35 },
    { t: 1.05, vg: 'top', text: '¡Remata, Verity!', who: 'att' },
    { t: 1.3, vg: 'punch', hit: 4, fx: 'boom', at: 'vic', r: 2.2, shake: .5, hs: .09 },
    { t: 1.34, fx: 'crack', at: 'ground', r: 3.6 },
    { t: 1.7, hit: 3, fx: 'impact', sfx: 'heavy' },
    { t: 1.8, vg: 'left' },
    { t: 2.0, vg: 'punch', hit: 3, fx: 'impact', big: 1 },
    { t: 2.28, hit: 3, fx: 'xcut', imp: 1 },
    { t: 2.45, rel: { dmg: 8, kb: 12, up: 10, rag: 2 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.47, fx: 'flash', op: .5 }, { t: 2.6, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'lowA', { fov: 52 }], [.8, 'top'], [1.25, 'ground'], [1.7, 'wide'], [2.0, 'ots', { s: -1, fov: 46 }], [2.3, 'faceV', { fov: 36 }], [2.5, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});
