/* Coreografía (cinemática) · personaje: sebolla · habilidad: (sin habilidad asignada) · id: sebBrawl
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebBrawl', function () {
  return {
  dur: 3.4, catch: 2, dest: .8, attClip: 'cine_paliza', vicClip: 'cine_vic_paliza',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.5, 0], [2.2, 0, 0, 1.5, 0], [2.32, 0, .9, 1.7, 0]],
  ev: [
    { t: .2, text: '¡Verity, mira esto!', who: 'att' }, ...sebFlurry(.45, 1.55, .22, 1.7),
    { t: 1.6, vg: 'left', text: '¡Ahora tú!', who: 'att' },
    { t: 1.9, vg: 'punch', hit: 3, fx: 'boom', at: 'vic', r: 2, shake: .4, hs: .08 },
    { t: 2.2, vg: 'leave', text: '¡Y arriba!', who: 'att' },
    { t: 2.35, rel: { dmg: 9, kb: 8, up: 14, rag: 1.6 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.37, fx: 'flash', op: .5 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.45, 'ots', { s: 1, fov: 44 }], [.9, 'faceV', { fov: 34 }], [1.3, 'lowA'], [1.6, 'wide'], [2.0, 'otsV', { fov: 44 }], [2.35, 'wide'], [2.8, 'hero', { s: -1 }]],
};
});
