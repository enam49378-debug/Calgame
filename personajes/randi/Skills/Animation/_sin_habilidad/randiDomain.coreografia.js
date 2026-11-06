/* Coreografía (cinemática) · personaje: randi · habilidad: (sin habilidad asignada) · id: randiDomain
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
CF.coreografia('randiDomain', function () {
  return {
  dur: 7.0, catch: 2, attClip: 'cine_dominio', vicClip: 'cine_vic_dominio',
  att: [[.1, 'idle'], [6.8, 'idle']], vic: [[.1, 'vConfused'], [6.8, 'vConfused']],
  apos: [[0, 0, 0, 0, 0]],
  vpos: [[0, 0, 0, 3.2, 0]],
  ev: [
    { t: .05, text: 'Expansión de dominio…', who: 'att', fx: 'ring', at: 'att', r: 3 },
    { t: .2, dom: 'open' },
    { t: 1.7, text: '¿Dónde estoy…?', who: 'vic' },
    { t: 3.2, text: '¡Perú Eterno!', who: 'att', fx: 'ring', at: 'att', r: 3.5 },
    { t: 6.35, dom: 'close', fx: 'boom', at: 'att', r: 3, big: 1 },
    { t: 6.4, fx: 'flash', op: .6 },
  ],
  shots: [[0, 'two', { fov: 50 }], [.9, 'lowA'], [1.9, 'faceV', { fov: 34 }], [3.0, 'up', { fov: 56 }], [4.2, 'wide'], [5.2, 'otsV', { fov: 44 }], [6.0, 'hero', { s: -1 }], [6.5, 'wide']],
};
});
