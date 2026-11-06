/* Coreografía (cinemática) · personaje: titan · habilidad: (sin habilidad asignada) · id: titanArm
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// brazo de piedra: lo trae de lejos, lo estrella a un lado, al otro, y lo revolea por encima del hombro
CF.coreografia('titanArm', function () {
  return {
    dur: 3.1, pull: 1,
    att: [[.1, 'throw'], [.5, 'grab'], [.75, 'sweep_w'], [1.0, 'sweep'], [1.3, 'sweep_w'], [1.55, 'sweep'], [1.9, 'lift'], [2.2, 'throw'], [2.9, 'heavy']],
    vic: [[.1, 'hurtFwd'], [.5, 'vLifted'], [.75, 'vFloat'], [1.0, 'downB'], [1.3, 'vFloat'], [1.55, 'downB'], [1.9, 'vUpside'], [2.2, 'vLaunch']],
    apos: [[0, 0, 0, 0, 0], [.75, 0, 0, 0, 0], [1.0, 0, 0, 0, -.8], [1.3, 0, 0, 0, 0], [1.55, 0, 0, 0, .8], [1.9, 0, 0, 0, 0], [2.2, 0, 0, 0, -3.14]],
    vpos: [[.5, 0, .9, 1.2, 0], [.75, -1.4, 2.0, .9, 0], [1.0, -1.9, .1, .6, 0], [1.3, 0, 2.6, 1.0, 0], [1.55, 1.9, .1, .6, 0], [1.9, 0, 3.0, .2, 3.14], [2.2, 0, 1.0, -1.6, 3.14]],
    ev: [
      { t: .05, text: '¡VENÍ ACÁ!', who: 'att', fx: 'impact' },
      { t: .5, hit: 2, fx: 'impact', sfx: 'grab' },
      { t: 1.0, hit: 3, fx: 'boom', at: 'ground', r: 2, imp: 1 },
      { t: 1.02, fx: 'crack', at: 'ground', r: 3 },
      { t: 1.55, hit: 3, fx: 'boom', at: 'ground', r: 2 },
      { t: 1.57, fx: 'crack', at: 'ground', r: 3 },
      { t: 2.2, rel: { dmg: 7, kb: 24, up: 12, rag: 2.2 }, fx: 'impact', big: 1, slow: .3 },
    ],
    shots: [[0, 'follow'], [.5, 'two'], [.95, 'ground', { s: -1 }], [1.3, 'top'], [1.55, 'ground'], [1.9, 'lowA'], [2.25, 'wide']],
  };
});
