/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Duelo de lanza que se desata cuando alguien golpea a Javi durante su guardia. Dura ~9 s y pasa por:
   choque de la lanza (parry) -> desvío con giro -> estocada que el rival frena con las MANOS -> forcejeo deslizándose ->
   el rival desvía la lanza y empuja -> Javi salta hacia atrás -> barrido bajo, el rival salta por encima -> choque de lado ->
   patada que lo hace resbalar cubriéndose -> carrera, salto y golpe desde arriba (el rival lo frena con las manos) ->
   giro que arranca la lanza y estocada final que lo lanza.
   att = poses de Javi, vic = poses del rival, apos/vpos = posiciones [t, x(derecha), y(altura), z(adelante), giro], ev = eventos, shots = cámara. */
CF.coreografia('javiParry', function () {
  const P = (n, o) => Object.assign({}, POSE[n], o || {});
  // ---- poses de Javi
  const GUARD = P('counter', { by: -2, ix: .1, ty: -.25, llx: -.5, lrx: .45 });
  const CLASH = P('counter', { by: -2.6, ix: .16, tx: .1, ty: -.32, alx: -1.6, arx: -1.7 });
  const PUSH = P('lancerAlt', { ix: .3, by: -3, tx: .2 }), PUSH2 = P('lancerAlt', { ix: .36, by: -3.5, tx: .25, ty: .1 });
  const LOW_SWEEP = P('sweep', { by: -4, ix: .35 });
  // ---- poses del rival
  const GRAB = P('vGGrab'), GRAB2 = P('vJPierced'), COVER = P('block', { by: -1.5, ix: .1 });
  const att = [
    [0, GUARD], [.14, CLASH], [.46, CLASH], [.52, P('sweep_w')], [.72, P('sweep')], [.96, P('lancerAlt')], [1.3, P('thrust')], [1.52, PUSH],
    [2.2, PUSH2], [2.9, PUSH], [3.12, P('sweep', { ix: .2 })], [3.42, P('hurtA')], [3.62, P('hurtFwd')], [3.8, P('jVault')], [4.05, P('land')],
    [4.3, P('sweep_w', { by: -3 })], [4.55, LOW_SWEEP], [4.8, P('lancerRest')], [4.98, P('counter', { by: -2, ty: .3 })], [5.2, P('kick_w')], [5.36, P('kick')],
    [5.6, P('jSprint')], [5.85, P('jSprint', { ix: .5 })], [6.1, P('jVault')], [6.3, P('overhead')], [6.5, P('plunge')], [6.9, P('plunge', { by: -3 })],
    [7.2, P('sweep_w', { ty: .5 })], [7.45, P('lancerAlt', { by: -3 })], [7.8, P('thrust', { ix: .35 })], [8.15, P('lancer')], [8.6, P('javiHero')],
  ];
  // el rival: golpe, retroceso, atrapa la lanza con las dos manos, tiembla mientras empuja, desvía y empuja, salta, patada, cubre, atrapa de nuevo
  const vic = [[0, P('jabR')], [.14, P('jabR')], [.46, P('hurtA')], [.76, P('vStagger')], [1.06, P('vJReady')], [1.4, P('vJReady')], [1.52, GRAB]];
  for (let t = 1.64; t < 2.95; t += .12) vic.push([+t.toFixed(2), Math.round((t - 1.64) / .12) % 2 ? GRAB2 : GRAB]);
  vic.push([3.0, P('jabR', { ty: .5 })], [3.28, P('jabR', { ty: .4 })], [3.55, P('vJReady')], [3.95, P('vJReady', { ix: .2 })], [4.3, P('jump')], [4.55, P('jump', { ix: .3 })], [4.85, P('land')],
    [4.96, P('jabL')], [5.2, P('vShock1')], [5.38, P('hurtFwd')], [5.6, COVER], [6.1, COVER], [6.42, P('vGGrab', { alx: -2.6, arx: -2.7 })]);
  for (let t = 6.55; t < 7.4; t += .1) vic.push([+t.toFixed(2), Math.round((t - 6.55) / .1) % 2 ? P('hurtA', { by: -4.5, ix: .45, alx: -2.6, arx: -2.7 }) : P('vGGrab', { by: -4, alx: -2.6, arx: -2.7 })]);
  vic.push([7.55, P('vJPierced')], [7.8, P('vJPierced')]);
  return {
    dur: 9, catch: 3, reach: 'counter', trails: [[.5, .8], [1.25, 1.55], [4.3, 4.65], [7.5, 7.9]],
    att,
    vic,
    apos: [[0, 0, 0, 0, 0], [.5, 0, 0, -.15, 0], [.96, 0, 0, .1, 0], [1.3, 0, 0, .65, 0], [2.2, 0, 0, 1.05, 0], [2.95, 0, 0, 1.35, 0], [3.15, 0, 0, 1.2, 0], [3.45, 0, 0, .75, 0],
      [3.78, 0, .75, .15, 0], [4.05, 0, 0, -.2, 0], [4.45, 0, 0, -.2, 0], [4.9, 0, 0, -.2, 1.57], [5.35, 0, 0, -.2, 1.57], [5.65, .5, 0, -.2, 1.57], [6.1, 2.3, .8, -.2, 1.57], [6.42, 3.5, 0, -.2, 1.57],
      [7.0, 3.55, 0, -.2, 1.57], [7.5, 3.5, 0, -.2, 1.57 + Math.PI * 2], [7.85, 3.9, 0, -.2, 1.57 + Math.PI * 2], [9, 3.9, 0, -.2, 1.57 + Math.PI * 2]],
    vpos: [[0, 0, 0, 1.35, 0], [.46, 0, 0, 1.6, 0], [.76, 0, 0, 2.1, 0], [1.06, 0, 0, 2, 0], [1.5, 0, 0, 2.05, 0], [1.7, .1, 0, 2.35, 0], [2.9, .45, 0, 3.2, 0], [3, .4, 0, 3.1, .45],
      [3.3, .3, 0, 2.1, .2], [3.55, .3, 0, 2.4, 0], [3.95, 0, 0, 1.5, 0], [4.3, .3, .25, 1.3, 0], [4.55, .9, 1, .9, .8], [4.85, 1.7, 0, .4, 1.57], [5.2, 1.75, 0, .4, 1.57], [5.4, 1.9, 0, .4, 1.57],
      [6, 4.2, 0, .4, 1.57], [6.45, 4.3, 0, .4, 1.57], [7.3, 4.3, 0, .4, 1.57], [7.85, 4.45, 0, .4, 1.57], [9, 4.45, 0, .4, 1.57]],
    ev: [
      { t: .14, fx: 'impact', at: 'att', big: 1, imp: 1, sfx: 'block', shake: .6, text: '¡PARRY!', who: 'att', slow: .25 },
      { t: .14, fx: 'ring', at: 'att', r: 3.4, face: 1 },
      { t: .56, fx: 'slash', sfx: 'swing', tilt: .3 },
      { t: .74, hit: 2.5, fx: 'impact', sfx: 'hit', shake: .3 },
      { t: .98, fx: 'charge', at: 'att' },
      { t: 1.32, fx: 'line', sfx: 'swing' },
      { t: 1.52, hit: 2, fx: 'impact', big: 1, imp: 1, sfx: 'block', shake: .5, text: '¡LA ATRAPA CON LAS MANOS!', who: 'vic', slow: .2 },
      { t: 1.55, fx: 'ring', at: 'vic', r: 3 },
      { t: 1.9, fx: 'ring', at: 'ground', r: 1.8, shake: .15 }, { t: 2.2, fx: 'line', sfx: 'swing', shake: .2 }, { t: 2.45, fx: 'ring', at: 'ground', r: 2, shake: .2 },
      { t: 2.7, fx: 'impact', at: 'vic', sfx: 'block', shake: .3 }, { t: 2.9, fx: 'charge', at: 'att', text: '¡NO PASARÁS!', who: 'att' },
      { t: 3.28, fx: 'impact', at: 'att', big: 1, imp: 1, sfx: 'heavy', shake: .7, text: '¡EMPUJÓN!', who: 'vic' },
      { t: 3.78, fx: 'ghost' }, { t: 3.8, fx: 'ring', at: 'ground', r: 2.4 },
      { t: 4.3, fx: 'slash', tilt: .1, sfx: 'swing' }, { t: 4.5, fx: 'line', sfx: 'swing' }, { t: 4.55, fx: 'ghost' },
      { t: 4.98, fx: 'impact', at: 'att', big: 1, imp: 1, sfx: 'block', shake: .6, text: '¡Y OTRA VEZ!', who: 'att' },
      { t: 5.36, hit: 3.5, fx: 'impact', big: 1, imp: 1, sfx: 'heavy', shake: .6, text: '¡FUERA!', who: 'att' },
      { t: 5.5, fx: 'ring', at: 'ground', r: 2.2 }, { t: 5.7, fx: 'ring', at: 'ground', r: 2.4 }, { t: 5.9, fx: 'ring', at: 'ground', r: 2.6 },
      { t: 6.1, fx: 'ghost' },
      { t: 6.5, hit: 4, fx: 'boom', big: 1, r: 2.2, imp: 1, shake: .9, text: '¡LO FRENA OTRA VEZ!', who: 'vic' }, { t: 6.52, fx: 'crack', at: 'ground', r: 5 },
      { t: 6.9, fx: 'impact', at: 'vic', sfx: 'block', shake: .4 }, { t: 7.1, fx: 'impact', at: 'vic', sfx: 'block', shake: .4 },
      { t: 7.2, fx: 'charge', at: 'att', slow: .15, text: '¡GIRA LA LANZA!', who: 'att' },
      { t: 7.82, fx: 'stab', sfx: 'slash' },
      { t: 7.85, rel: { dmg: 24, kb: 22, up: 7, rag: 2.4 }, slow: .35, fx: 'boom', big: 1, r: 3.6, imp: 1, shake: 1 },
    ],
    shots: [[0, 'cl', { s: 1, d: 3.6, fov: 50 }], [.46, 'faceA', { s: -1, fov: 42 }], [.9, 'two', { fov: 48 }], [1.3, 'tip', { d: 2.4, fov: 40 }], [1.9, 'faceV', { s: 1, fov: 40 }],
      [2.45, 'cl', { s: -1, d: 3.4, fov: 46, roll: -.05 }], [3.0, 'ground', { fov: 56 }], [3.45, 'otsV', { fov: 48 }], [3.9, 'lowA', { fov: 56 }],
      [4.3, 'pass', { d: 4.5, fov: 50 }], [4.75, 'orbit', { r: 4.2, spd: 1.3, h: .3, fov: 50 }], [5.2, 'clv', { s: -1, d: 3.6, fov: 48 }], [5.6, 'follow', { d: 3.8, fov: 56 }],
      [6.1, 'up', { d: 3.2, fov: 62 }], [6.4, 'cl', { s: 1, d: 4.6, fov: 50, roll: .06 }], [6.9, 'faceA', { s: 1, fov: 40 }], [7.5, 'lowV', { fov: 54 }],
      [7.85, 'clv', { s: -1, d: 4, fov: 48, roll: -.06 }], [8.4, 'hero', { s: -1 }]],
  };
});
