/* Coreografía (cinemática) · personaje: volt · habilidad: (sin habilidad asignada) · id: voltOverload
   Línea de tiempo de la escena: att = pose del atacante, vic = pose de la víctima, ev = eventos (golpes, efectos), shots = cámara.
   Puedes usar cualquier función del juego (applyHit, sfx, ...) dentro de los eventos. */
// lo sube con la mano cargada, lo usa de pararrayos y lo descarga contra el piso con un trueno
CF.coreografia('voltOverload', function () {
  return {
    dur: 3.2,
    att: [[.1, 'palm'], [.5, 'castUp'], [1.2, 'castUp'], [1.5, 'charge'], [1.9, 'point'], [2.2, 'slamDown'], [2.7, 'land'], [3.1, 'idle']],
    vic: [[.1, 'vShock1'], [.3, 'vShock2'], [.5, 'vShock1'], [.7, 'vShock2'], [.9, 'vShock1'], [1.1, 'vShock2'], [1.3, 'vFloat'], [1.6, 'vShock1'], [1.9, 'vShock2'], [2.2, 'vBack'], [2.4, 'downB']],
    apos: [[0, 0, 0, 0, 0], [1.5, 0, 0, 0, 0], [1.9, 0, 1.2, .6, 0], [2.2, 0, 0, .9, 0]],
    vpos: [[0, 0, 0, 1.1, 0], [.5, 0, 1.4, 1.2, 0], [1.2, 0, 4.2, 1.4, 0], [1.9, 0, 4.4, 1.5, 0], [2.2, 0, 0, 1.6, 0, 'i']],
    ev: [
      { t: .1, fx: 'elec', hit: 2 }, { t: .4, fx: 'elec', hit: 1 }, { t: .7, fx: 'elec', hit: 1 }, { t: 1.0, fx: 'elec', hit: 1 }, { t: 1.3, fx: 'elec', hit: 1 },
      { t: 1.5, fx: 'charge', at: 'att', sfx: 'ult', text: '¡SOBRECARGA!', who: 'att' },
      { t: 1.9, fx: 'lightning', hit: 2, imp: 1 },
      { t: 2.2, rel: { dmg: 9, kb: 2, up: -8, rag: 2.2 }, fx: 'lightning', slow: .3 },
      { t: 2.25, fx: 'boom', at: 'ground', r: 3.2 },
      { t: 2.27, fx: 'crack', at: 'ground' },
    ],
    shots: [[0, 'otsV'], [.45, 'up'], [1.25, 'wide'], [1.5, 'faceA'], [1.9, 'top'], [2.25, 'ground'], [2.7, 'hero']],
  };
});
