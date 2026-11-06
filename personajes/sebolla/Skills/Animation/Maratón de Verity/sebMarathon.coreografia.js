/* Coreografía (cinemática) · personaje: sebolla · habilidad: Maratón de Verity · id: sebMarathon
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('sebMarathon', function () {
  return {
  dur: 3.4, catch: 2, dest: 1, attClip: 'cine_maraton', vicClip: 'cine_vic_maraton',
  att: [[.1, 'aCatch'], [3.2, 'idle']], vic: [[.1, 'vConfused'], [3.2, 'vBack']],
  apos: [[0, 0, 0, 0, 0], [.35, 1.9, 0, 1.6, -1.57, 'o'], [.65, -1.9, 0, 1.6, 1.57, 'o'], [.95, 0, 0, 3.5, 3.14, 'o'], [1.25, 1.4, 0, 3.0, -2.36, 'o'], [1.55, -1.4, 0, .3, .82, 'o'], [1.85, 1.9, 0, 1.6, -1.57, 'o'], [2.15, -1.9, 0, 1.6, 1.57, 'o'], [2.5, 0, 0, 0, 0, 'o'], [2.9, 0, 0, .6, 0]],
  vpos: [[0, 0, 0, 1.6, 0]],
  ev: [
    { t: .2, text: '¡Demasiado lento!', who: 'att' },
    ...[.45, .75, 1.05, 1.35, 1.65, 1.95, 2.25].map((t, i) => ({ t, hit: 1.9, fx: i % 2 ? 'xcut' : 'impact', hs: .04, shake: .2, sfx: 'hit' })),
    ...[.35, .65, .95, 1.25, 1.55, 1.85, 2.15, 2.5].map(t => ({ t, fx: 'ghost', sfx: 'dash' })),
    { t: 2.55, text: '¡Y esto es por Verity!', who: 'att' },
    { t: 2.75, rel: { dmg: 10, kb: 12, up: 10, rag: 1.8 }, fx: 'boom', at: 'vic', r: 3, big: 1, slow: .3 },
    { t: 2.77, fx: 'flash', op: .5 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.35, 'orbit', { r: 5, spd: 1.2 }], [1.2, 'wide'], [1.6, 'orbit', { r: 4.5, spd: -1.4 }], [2.3, 'lowA'], [2.55, 'wide'], [2.9, 'hero', { s: -1 }]],
};
});
