/* Coreografía (cinemática) · personaje: sebolla · habilidad: Dúo Dinámico · id: sebDuo
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebDuo', function () {
  return {
  dur: 4.2, catch: 2, dest: 1.5, attClip: 'cine_duo', vicClip: 'cine_vic_duo',
  att: [[.1, 'aCatch'], [4.0, 'idle']], vic: [[.1, 'vConfused'], [4.0, 'vBack']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 1.6, 0], [.5, 0, 0, 1.6, 0], [2.3, 0, 1.3, 1.7, 0], [2.8, 0, 2.2, 1.8, 0], [3.05, 0, .2, 1.8, 0, 'i'], [3.2, 0, 0, 1.8, 0]],
  ev: [
    { t: .35, text: '¡ORA ORA ORA ORA!', who: 'att' }, ...sebFlurry(.55, 2.23, .17, 1.3),
    { t: 2.4, vg: 'top', text: '¡Verity, remata!', who: 'att', fx: 'ring', at: 'vic', r: 3, face: 1 },
    { t: 2.9, vg: 'slam', text: '¡PUÑO GIGANTE!', who: 'att' },
    { t: 3.05, fx: 'crack', at: 'ground', r: 6.5 },
    { t: 3.08, rel: { dmg: 12, kb: 4, up: 6, rag: 2.2 }, fx: 'boom', at: 'vic', r: 5, big: 1, slow: .35 },
    { t: 3.1, fx: 'flash', op: .6 }, { t: 3.4, vg: 'leave' },
  ],
  shots: [[0, 'two', { fov: 50 }], [.5, 'ots', { s: 1, fov: 42 }], [.85, 'faceV', { fov: 32 }], [1.2, 'otsV', { fov: 42 }], [1.55, 'lowA', { fov: 50 }], [1.9, 'ots', { s: -1, fov: 42 }], [2.4, 'top'], [2.9, 'ground'], [3.1, 'wide'], [3.7, 'hero', { s: -1 }]],
};
});
