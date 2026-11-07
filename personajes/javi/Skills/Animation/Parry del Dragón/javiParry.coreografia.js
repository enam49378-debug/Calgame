/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Contraataque anime de lanza que se desata cuando alguien golpea a Javi durante su guardia (~4.5 s):
     I   PARRY DEL DRAGÓN     el golpe choca contra la lanza cruzada con chispas y cámara lenta; Javi lo desvía con un tajo diagonal ascendente que rompe la guardia del rival
     II  RÁFAGA DE COLMILLOS  Javi entra con paso relámpago y desata una lluvia de estocadas y cortes veloces que culmina en el Colmillo Dragón
     III PASO FANTASMA        cruza al rival como un rayo dejando copias cortantes, aparece a su espalda y lo eleva al cielo con el Ascenso del Dragón
     IV  PICADO CELESTIAL     salta sobre el rival suspendido, carga relámpagos girando la lanza y cae en picada estrellándolo contra el suelo
   att = poses de Javi, vic = poses del rival, apos/vpos = [t, x(derecha), y(altura), z(adelante), giro, ease],
   anchor = anclaje en la punta de la lanza, holds = mano izquierda en el asta, ev = eventos, shots = cámara. */
CF.coreografia('javiParry', function () {
  const P = (n, o) => Object.assign({}, POSE[n], o || {});
  // U(pose, up): fija el ángulo REAL de la lanza (rad, + = punta hacia arriba) compensando la inclinación del cuerpo (ix+tx) y del brazo (arx)
  const U = (o, up) => Object.assign({}, o, { sx: -up - ((o.ix || 0) + (o.tx || 0) + (o.arx || 0)) });

  // ================= POSES DE JAVI =================
  const base = { ix: .14, by: -3.2, tx: .1, ty: .48, hy: -.42, hx: -.06, alx: -1.35, alz: -.45, aly: .28, llx: -.65, lrx: .55, llz: .16, lrz: -.16 };
  const G_GUARD = U(Object.assign({}, base, { by: -3.4, arx: -1.58, arz: -.28, sy: .78, sz: .26 }), .85);
  const G_SINK = U(Object.assign({}, G_GUARD, { by: -4.4, ix: .22, ty: .68, tx: .18, llx: -.82, lrx: .68, llz: .24, lrz: -.24 }), .92);
  const PARRY_SWEEP = U(Object.assign({}, base, { by: -2.2, ix: -.06, tx: -.08, ty: -.72, hy: .45, hx: -.12, arx: -2.05, arz: -.25, sy: -.35, sz: -.12, alx: -.85, alz: .45, llx: -.52, lrx: .58 }), 1.15);
  const PARRY_HIGH = U(Object.assign({}, PARRY_SWEEP, { by: -1.8, ty: -.88, arx: -2.25, sy: -.15, sz: 0, alx: -.6, alz: .65 }), 1.35);

  // Variantes rápidas para la ráfaga de estocadas anime
  const STAB_LOW = P('jDrive', { by: -3.2, ix: .28, tx: .22, ty: .42, arx: -1.42, sx: 1.38, arz: -.12 });
  const STAB_HIGH = P('jDrive', { by: -2.1, ix: .16, tx: .12, ty: -.35, hy: .28, arx: -1.78, sx: 1.52, arz: .18, alx: -.8, alz: .4 });
  const SLASH_R = P('jUncoil', { by: -2.6, ty: .85, arx: -1.65, sx: 1.2, arz: -.55 });
  const SLASH_L = P('jCoil', { by: -2.8, ty: -.78, hy: .52, arx: -1.25, sx: 1.15, arz: .48, alx: -.5, alz: -.3 });

  // ================= POSES DEL RIVAL =================
  const V_HOOK = P('jabR', { ty: -.55, ix: .16, bz: 2.2 });
  const V_DEFLECT = P('vShock1', { ix: -.28, tx: -.32, ty: .45, hy: .4, alx: -1.6, alz: .95, arx: -2.1, arz: -.85 });
  const V_STAGGER = P('vStagger', { ix: -.18, tx: -.2, by: -1.8 });

  const att = [
    // Acto I: Parry y desvío explosivo
    [0, G_GUARD], [.11, G_SINK], [.18, PARRY_SWEEP], [.32, PARRY_HIGH],
    [.46, 'twirlPose'], [.66, 'jCoil'],
    // Acto II: Ráfaga de Colmillos (5 impactos veloces + estocada rompe-guardia)
    [.78, 'jSmear'], [.84, STAB_LOW], [.92, 'jRecoil'],
    [.98, STAB_HIGH], [1.06, 'jRecoil'],
    [1.14, 'jSweepSmear'], [1.20, SLASH_R],
    [1.30, SLASH_L], [1.38, STAB_LOW],
    [1.46, 'jCoil'], [1.58, 'jSmear'], [1.65, 'jDrive'], [1.82, 'jRecoil'],
    // Acto III: Paso Fantasma a la espalda y Ascenso del Dragón
    [1.90, 'jSprint'], [2.08, 'jBank'], [2.20, 'jCoil'],
    [2.34, 'jSweepSmear'], [2.42, 'jLiftArc'], [2.56, 'jOver'], [2.78, 'jBrace'],
    // Acto IV: Salto al cielo y Picado del Dragón Celestial
    [2.92, 'jRise'], [3.18, 'jHang'], [3.44, 'jOver'],
    [3.56, 'jDownSmear'], [3.68, 'jDive'], [3.80, 'jImpact'],
    [4.02, 'jSettle'], [4.20, 'twirlPose'], [4.38, 'javiHero'], [4.55, 'jHeroBreath'],
  ];

  const vic = [
    [0, V_HOOK], [.11, V_HOOK], [.20, V_DEFLECT], [.42, V_STAGGER], [.68, 'vJReady'],
    [.82, 'vJPierced'], [.98, 'vJSideL'], [1.16, 'vJSideR'], [1.32, 'vJShudder'], [1.46, 'vJAfterL'],
    [1.60, 'vJPierced'], [1.76, 'vJShudder'],
    [1.95, 'vJAfterR'], [2.15, 'vJLookBack'], [2.32, 'vJLookBack'],
    [2.40, 'vJPierced'], [2.52, 'vJLaunch'], [2.85, 'vJHangLag'], [3.25, 'vJFloat'],
    [3.54, 'vJDiveCatch'], [3.66, 'vJFoldFall'], [3.75, 'vJGroundPre'], [3.80, 'vJGroundHit'], [3.92, 'vJGroundRebound'], [4.55, 'vJGroundRebound'],
  ];

  const PI = 3.1416;
  return {
    dur: 4.55, catch: 3, reach: 'counter',
    trails: [[.14, .44], [.75, 1.75], [2.28, 2.65], [3.50, 3.84]],
    att, vic,
    apos: [
      [0, 0, 0, 0, 0], [.11, 0, 0, -.16, 0], [.22, 0, 0, -.04, 0], [.45, 0, 0, -.12, 0], [.68, 0, 0, -.22, 0],
      [.78, 0, 0, .32, 0, 'o'], [1.38, 0, 0, .44, 0], [1.46, 0, 0, .22, 0], [1.60, 0, 0, .86, 0, 'o'], [1.86, 0, 0, .86, 0],
      [2.06, 0, 0, 3.85, 0, 'o'], [2.18, 0, 0, 3.85, PI, 'o'], [2.32, 0, 0, 3.65, PI], [2.42, 0, .15, 3.45, PI, 'o'], [2.78, 0, 0, 3.5, PI],
      [3.18, 0, 5.1, 2.55, PI, 'o'], [3.48, 0, 5.35, 2.48, PI],
      [3.80, 0, 0, 2.25, PI, 'i'], [4.05, 0, 0, 2.25, PI], [4.55, 0, 0, 2.25, PI],
    ],
    vpos: [
      [0, 0, 0, 1.35, 0], [.11, 0, 0, 1.28, 0], [.40, .06, 0, 1.85, .16, 'o'], [.70, 0, 0, 1.85, 0],
      [.84, 0, 0, 1.88, 0], [1.00, .08, 0, 1.90, .2], [1.18, -.08, 0, 1.92, -.2], [1.46, 0, 0, 1.92, 0],
      [1.62, 0, .05, 2.42, 0, 'o'], [2.34, 0, 0, 2.42, 0],
      [2.42, 0, .2, 2.38, 0], [2.78, 0, 3.7, 2.15, .45, 'o'], [3.48, 0, 3.95, 2.1, .9],
      [3.80, 0, 0, 1.65, 1.4, 'i'], [4.55, 0, 0, 1.65, 1.4],
    ],
    anchor: [[3.55, 3.80, 'tip', 0, .06]],
    holds: [
      { t0: 0, t1: .40, who: 'att', arm: 'armL', z: 7, fade: .06 },
      { t0: .72, t1: 1.78, who: 'att', arm: 'armL', z: 6, fade: .08 },
      { t0: 2.25, t1: 2.65, who: 'att', arm: 'armL', z: 6, fade: .08 },
      { t0: 3.45, t1: 3.95, who: 'att', arm: 'armL', z: 6, fade: .08 },
    ],
    ev: [
      // Acto I: Parry Perfecto
      { t: .11, fx: 'clang', at: 'att', sz: 2.0, n: 12, len: 2.2, imp: 1, shake: .7, slow: .26, text: '¡PARRY!', who: 'att', eyes: 1 },
      { t: .11, fx: 'ring', at: 'att', r: 3.6, face: 1 },
      { t: .13, fx: 'elec', at: 'att' },
      { t: .18, hit: 2, fx: 'slash', tilt: -.65, r: 2.0, len: 3.4, sfx: 'heavy', hs: .06, shake: .4 },
      { t: .22, fx: 'dust', at: 'ground', n: 12 },
      { t: .46, twirl: [1, .22], fx: 'charge', at: 'att' },
      { t: .62, fx: 'elec', at: 'att' },

      // Acto II: Ráfaga de Colmillos
      { t: .75, fx: 'ghost', sfx: 'dash' },
      { t: .77, fx: 'lines' },
      { t: .82, hit: 1.5, fx: 'stab', sfx: 'slash', hs: .04, shake: .22 },
      { t: .98, hit: 1.5, fx: 'line', sfx: 'slash', hs: .04, shake: .22 },
      { t: 1.16, hit: 1.5, fx: 'slash', tilt: .35, len: 3.0, hs: .04, shake: .25 },
      { t: 1.32, hit: 1.5, fx: 'slash', tilt: -.45, len: 3.0, hs: .04, shake: .25 },
      { t: 1.46, fx: 'charge', at: 'att' },
      { t: 1.58, fx: 'ghost' },
      { t: 1.60, hit: 4, fx: 'xcut', imp: 1, hs: .11, shake: .65, slow: .18, text: '¡COLMILLO DRAGÓN!', who: 'att' },
      { t: 1.62, fx: 'ring', at: 'vic', r: 2.8, face: 1 },
      { t: 1.65, fx: 'dust', at: 'ground', n: 14 },

      // Acto III: Paso Fantasma y Ascenso del Dragón
      { t: 1.90, fx: 'ghost', sfx: 'dash' },
      { t: 1.92, fx: 'elec', at: 'att' },
      { t: 1.96, fx: 'clone', a: .55 },
      { t: 2.02, fx: 'clone', a: -.55 },
      { t: 2.06, fx: 'ghost' },
      { t: 2.38, hit: 4, fx: 'slash', tilt: 1.25, r: 2.2, len: 3.8, imp: 1, hs: .1, shake: .6, slow: .2, text: '¡ASCENSO!', who: 'att' },
      { t: 2.40, fx: 'impact', at: 'vic', big: 1 },
      { t: 2.42, fx: 'ring', at: 'ground', r: 2.8 },

      // Acto IV: Salto y Picado del Dragón Celestial
      { t: 2.88, fx: 'ghost', sfx: 'dash' },
      { t: 2.90, fx: 'ring', at: 'groundA', r: 2.4 },
      { t: 3.18, twirl: [2, .28], fx: 'charge', at: 'att', slow: .26, text: '¡PICADO CELESTIAL!', who: 'att' },
      { t: 3.30, fx: 'elec', at: 'att' },
      { t: 3.52, fx: 'lines', sfx: 'swing' },
      { t: 3.56, fx: 'ghost' },
      { t: 3.74, hit: 2.5, fx: 'stab', hs: .05 },
      { t: 3.80, fx: 'lightning', at: 'vic' },
      { t: 3.80, fx: 'boom', at: 'ground', big: 1, r: 4.0, imp: 1, shake: 1 },
      { t: 3.81, fx: 'crack', at: 'ground', r: 5.8 },
      { t: 3.82, fx: 'flash', op: .45 },
      { t: 3.83, rel: { dmg: 16, kb: 22, up: 7, rag: 2.4 }, slow: .35 },
      { t: 4.18, twirl: [1, .26] },
      { t: 4.45, eyes: 0 },
    ],
    shots: [
      [0, 'rig', { at: 'A', a0: 135, a1: 108, r0: 3.6, r1: 2.7, h0: .12, h1: .08, ly: .2, fov0: 48, fov1: 38, roll0: -5, ease: 'o' }],
      [.42, 'faceA', { s: 1, fov: 36 }],
      [.74, 'cl', { s: 1, d: 3.8, fov: 46, roll: .05 }],
      [1.38, 'rig', { at: 'mid', at1: 'V', a0: 55, a1: 75, r0: 3.2, r1: 2.8, h0: .05, h1: .15, fov0: 46, fov1: 40, roll0: -6, ease: 'o' }],
      [1.88, 'pass', { h: 0, s: -1, d: 4.6, fov: 50, roll: -.06 }],
      [2.20, 'rig', { at: 'V', at1: 'mid', a0: 235, a1: 260, r0: 3.4, r1: 4.4, h0: .05, h1: .4, fov0: 44, fov1: 50, roll0: 5, ease: 'o' }],
      [2.88, 'faceA', { s: -1, fov: 38 }],
      [3.48, 'cl', { s: -1, d: 4.4, fov: 52, roll: .07 }],
      [4.00, 'hero', { s: -1 }],
    ],
  };
});
