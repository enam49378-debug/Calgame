/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Duelo de lanza que se desata cuando alguien golpea a Javi durante su guardia. Dura ~10 s, en actos:
     I   PARRY      el golpe choca contra la lanza cruzada, Javi lo barre hacia arriba y el rival se tambalea
     II  ESTOCADA   Javi gira, se agacha y lanza; el rival ATRAPA la lanza con las dos manos (manos pegadas al asta por IK)
     III FORCEJEO   Javi empuja y el rival resbala hacia atrás arrastrado por la lanza (el cuerpo del rival sale de la punta)
     IV  CONTRA     el rival desvía el asta con un giro, Javi pierde el equilibrio y recibe una palma que lo manda resbalando
     V   BARRIDO    voltereta hacia atrás, barrido bajo con giro completo; el rival salta por encima
     VI  GUARDIA    patada del rival contra la guardia de Javi, que gira y lo corta
     VII ENCIMA     Javi salta y baja la lanza; el rival la frena arrodillado con las manos, el piso se agrieta
     VIII REMATE    giro de lanza, la estocada se cuela entre los brazos del rival y lo lanza
   att = poses de Javi, vic = poses del rival, apos/vpos = [t, x(derecha), y(altura), z(adelante), giro],
   lock = el cuerpo del rival cuelga de la punta de la lanza, holds = manos sobre la lanza, ev = eventos, shots = cámara. */
CF.coreografia('javiParry', function () {
  const P = (n, o) => Object.assign({}, POSE[n], o || {});
  const S = 1;   // sentido de los giros (+1 / -1)
  // U(pose, up): fija el ángulo REAL de la lanza (rad, + = punta hacia arriba) compensando la inclinación del cuerpo (ix+tx) y del brazo (arx)
  const U = (o, up) => Object.assign({}, o, { sx: -up - ((o.ix || 0) + (o.tx || 0) + (o.arx || 0)) });
  // ================= JAVI =================
  const base = { ix: .12, by: -3, tx: .1, ty: .5, hy: -.45, llx: -.6, lrx: .5, llz: .15, lrz: -.15 };
  const G_GUARD = U(Object.assign({}, base, { by: -3.2, arx: -1.6, arz: -.3, sx: .3, sy: .8, sz: .3 }), 0.85);       // lanza cruzada en diagonal, a dos manos
  const G_SINK = U(Object.assign({}, G_GUARD, { by: -4.2, ix: .2, ty: .7, tx: .18, llx: -.75, lrx: .65, llz: .22, lrz: -.22 }), 0.9);
  const SWAT = U(Object.assign({}, base, { by: -2.4, ix: .02, ty: -.7, tx: .0, hy: .35, arx: -2.0, arz: -.2, sx: .55, sy: -.7, sz: -.2, llx: -.5, lrx: .55 }), 1.05);
  const SWAT2 = U(Object.assign({}, SWAT, { ty: -.85, arx: -2.15, by: -2.8 }), 1.25);
  const STEP = U(Object.assign({}, base, { ty: .3, by: -3, arx: -1.2, sx: 1.2, sy: .1 }), 0.1);
  const COIL = U(Object.assign({}, base, { by: -3.8, ix: .25, tx: .2, ty: 1.0, hy: -.6, bz: -2, arx: -.9, sx: .9, sy: .0, llx: -.9, lrx: .7, llz: .2, lrz: -.2 }), 0.1);
  const THRUST = U(Object.assign({}, base, { by: -2.3, ix: .2, tx: .15, ty: .2, bz: 3, arx: -1.55, sy: 0, hy: -.25, llx: -1.0, lrx: .8 }), .02);
  const PUSH = U(Object.assign({}, THRUST, { by: -2.6, ix: .24, tx: .2, bz: 2.8, llx: -.9, lrx: .75 }), .02);
  const PUSH2 = U(Object.assign({}, PUSH, { by: -2.9, ix: .3, tx: .25, ty: .3, bz: 2.4 }), .06);
  const OVER = U(Object.assign({}, PUSH2, { by: -2.2, ix: .5, tx: .4, ty: -.2, sy: .6, hy: -.1 }), -.2);             // se pasa de largo: pierde el equilibrio
  const HIT_B = P('hurtFwd', { by: -2.5, ix: -.25 });                                                       // recibe la palma
  const SKID = U(Object.assign({}, base, { by: -4.2, ix: -.1, tx: -.05, ty: -.5, arx: -1.3, sx: 1.3, sy: .3, llx: -.9, lrx: .8, llz: .3, lrz: -.3 }), 0.3);
  const FLIP = i => Object.assign({}, base, { by: -1, ix: i, tx: 0, ty: 0, arx: -1.1, sx: .6, llx: -1.3, lrx: -1.2, llz: .25, lrz: -.25 });
  const LAND = U(Object.assign({}, base, { by: -5.2, ix: .3, tx: .25, ty: .2, arx: -.5, sx: 1.5, sy: .1, llx: -1.2, lrx: .9 }), -0.3);
  const SWEEP = U(Object.assign({}, base, { by: -5.4, ix: .45, tx: .35, ty: 1.2, arx: -1.35, sx: 1.55, sy: 0, arz: -.9, llx: -1.1, lrx: .9, llz: .5, lrz: -.5 }), -0.12);
  const SWEEP2 = U(Object.assign({}, SWEEP, { ty: -.8, arz: -.2 }), -0.12);
  const BLOCKB = U(Object.assign({}, base, { by: -3.6, ix: .1, ty: 0, tx: .05, arx: -1.5, sx: 1.5, sy: 1.57, arz: -.1, hy: .3, llx: -.7, lrx: .6 }), 0);   // asta horizontal, de través
  const SPIN_CUT = U(Object.assign({}, base, { by: -3.4, ix: .2, tx: .2, ty: -1.0, arx: -1.5, sx: 1.55, sy: -.4, hy: .5, llx: -.8, lrx: .7 }), 0.05);
  const LEAP = U(Object.assign({}, base, { by: -1.5, ix: -.1, tx: -.1, ty: .3, arx: -2.6, sx: 2.3, sy: 0, llx: -1.2, lrx: -.5, llz: .3, lrz: -.3 }), 1.4);
  const DIVE = U(Object.assign({}, base, { by: -2.8, ix: .55, tx: .5, ty: 0, arx: -1.9, sx: 2.4, sy: 0, llx: -.9, lrx: .7 }), -0.9);
  const PRESS = U(Object.assign({}, base, { by: -5, ix: .5, tx: .55, ty: .1, arx: -1.5, sx: 2.1, sy: 0, llx: -1.0, lrx: .9, llz: .3, lrz: -.3 }), -0.75);
  const PRESS2 = U(Object.assign({}, PRESS, { by: -5.6, ix: .6, tx: .62 }), -0.8);
  const WIND = U(Object.assign({}, base, { by: -3.6, ix: -.05, tx: .05, ty: .8, arx: -.6, sx: .6, sy: -.2, hy: -.3, llx: -.9, lrx: .7 }), 0.3);
  const FINAL = U(Object.assign({}, base, { by: -3.2, ix: .38, tx: .35, ty: .1, bz: 4.2, arx: -1.55, sx: 1.55, sy: 0, hy: -.15, llx: -1.15, lrx: .9, llz: .25, lrz: -.25 }), 0.02);
  // ================= RIVAL =================
  const V_HOOK = P('jabR', { ty: -.5, ix: .12 });
  const V_RECOIL = P('hurtA', { ix: -.2, tx: -.3, ty: .6, hy: .5 });
  const V_RECOIL2 = P('hurtA', { ix: -.1, tx: -.2, ty: .5, hy: .3, by: -2 });
  const V_READY = P('vJReady');
  const V_WIDE = { ix: .2, tx: .25, by: -3, hx: .1, alx: -1.2, alz: .9, arx: -1.2, arz: -.9, llx: -.7, lrx: .6, llz: .22, lrz: -.22 };   // brazos abiertos para atrapar
  const V_CATCH = { ix: .1, tx: .2, by: -2.4, hx: .2, alx: -1.45, arx: -1.45, llx: -.85, lrx: .75, llz: .25, lrz: -.25 };
  const V_STRAIN = { ix: .02, tx: .12, by: -3.2, hx: .3, alx: -1.45, arx: -1.45, llx: -1.0, lrx: .9, llz: .32, lrz: -.32 };
  const V_STRAIN2 = Object.assign({}, V_STRAIN, { by: -3.6, ix: -.06, tx: .06, hx: .4 });
  const V_TWIST = { ix: .1, tx: .1, ty: -.9, by: -3.2, hy: .5, alx: -1.2, arx: -1.6, llx: -.6, lrx: .6, llz: .3, lrz: -.3 };
  const V_PALM = P('jabR', { ty: -1.0, ix: .25, tx: .3, by: -3 });
  const V_SPRINT = P('jSprint');
  const V_TUCK = { ix: .6, tx: .5, by: -1, alx: -.8, alz: .5, arx: -.8, arz: -.5, llx: -1.5, lrx: -1.4, hx: .3 };
  const V_COVER = P('block', { by: -2.4, ix: .15 });
  const V_KICK_W = P('kick_w'), V_KICK = P('kick');
  const V_OVER = { ix: .2, tx: .1, by: -3.6, hx: -.35, alx: -2.8, arx: -2.8, llx: -.9, lrx: .8, llz: .3, lrz: -.3 };
  const V_KNEEL = { ix: .3, tx: .35, by: -7, hx: -.3, alx: -2.8, arx: -2.8, llx: -1.55, lrx: -1.2, llz: .2, lrz: -.2 };
  const V_FAIL = { ix: .3, tx: .3, by: -6, hx: -.1, alx: -2.4, arx: -2.5, llx: -1.4, lrx: -1.2 };
  const V_PIERCE = P('vJPierced');
  // ---- tras la voltereta Javi queda con -2π de giro del cuerpo (ix): así la rotación es continua y no se "desenrolla"
  const W = -6.283, Z = o => Object.assign({}, o, { ix: (o.ix || 0) + W });
  const att = [
    [0, G_GUARD], [.1, G_SINK], [.15, SWAT], [.32, SWAT2], [.6, SWAT],
    [.8, STEP], [1.0, COIL], [1.2, THRUST],
    [1.55, PUSH], [1.9, PUSH2], [2.3, PUSH], [2.7, PUSH2], [3.0, OVER], [3.25, OVER],
    [3.4, HIT_B], [3.7, SKID], [4.05, SKID],
    [4.15, FLIP(-.5)], [4.4, FLIP(-2.9)], [4.65, FLIP(-5.2)], [4.85, Z(LAND)], [5.0, Z(LAND)],
    [5.1, Z(SWEEP)], [5.3, Z(SWEEP2)], [5.55, Z(SWEEP)],
    [5.85, Z(BLOCKB)], [6.05, Z(BLOCKB)], [6.3, Z(SPIN_CUT)],
    [6.55, Z(LEAP)], [6.8, Z(DIVE)], [7.05, Z(PRESS)], [7.5, Z(PRESS2)], [7.9, Z(PRESS2)],
    [8.1, Z(WIND)], [8.35, Z(FINAL)], [8.6, Z(FINAL)], [9.1, Z(P('lancer'))], [10, Z(P('javiHero'))],
  ];
  const vic = [
    [0, V_HOOK], [.14, V_HOOK], [.28, V_RECOIL], [.6, V_RECOIL2],
    [.85, V_READY], [1.1, V_WIDE], [1.28, V_CATCH],
    [1.55, V_CATCH], [1.9, V_STRAIN], [2.3, V_STRAIN2], [2.7, V_STRAIN], [3.0, V_TWIST], [3.3, V_PALM], [3.55, V_PALM],
    [3.9, V_READY], [4.3, V_READY], [4.5, V_SPRINT], [4.8, V_SPRINT], [5.0, V_TUCK], [5.2, V_TUCK], [5.4, P('land')],
    [5.5, V_KICK_W], [5.65, V_KICK], [5.85, V_COVER], [6.2, V_COVER], [6.4, V_READY],
    [6.65, V_OVER], [7.0, V_OVER], [7.3, V_KNEEL], [7.9, V_KNEEL], [8.15, V_FAIL], [8.35, V_FAIL], [8.55, V_PIERCE], [9, V_PIERCE],
  ];
  const Y = 9.425 * S;   // 3π: de espaldas a donde empezó
  return {
    dur: 10, catch: 3, reach: 'counter',
    trails: [[.15, .5], [1.0, 1.4], [5.1, 5.6], [5.9, 6.4], [6.5, 7.0], [8.2, 8.6]],
    att, vic,
    apos: [[0, 0, 0, 0, 0], [.15, 0, 0, -.2, 0], [.5, 0, 0, -.1, 0], [.9, 0, 0, .1, .15 * S], [1.2, 0, 0, .45, 0], [1.5, 0, 0, .9, 0], [3.0, 0, 0, 1.65, 0], [3.25, 0, 0, 1.85, 0],
      [3.4, 0, 0, 1.75, 0], [3.9, 0, 0, .4, 0], [4.1, 0, 0, .4, 0], [4.2, 0, 0, .3, 0], [4.45, 0, .9, -.6, 0], [4.85, 0, 0, -1.6, 0], [5.0, 0, 0, -1.6, 0],
      [5.55, 0, 0, -1.6, -6.283 * S], [5.85, 0, 0, -1.6, -Y], [6.1, 0, 0, -1.7, -Y], [6.4, 0, 0, -1.9, -Y], [6.55, 0, .2, -2.2, -Y], [6.8, 0, 1.1, -2.7, -Y],
      [7.05, 0, 0, -3.3, -Y], [7.9, 0, 0, -3.4, -Y], [8.2, 0, 0, -3.3, -Y], [8.5, 0, 0, -3.9, -Y], [10, 0, 0, -4.4, -Y]],
    vpos: [[0, 0, 0, 1.35, 0], [.15, 0, 0, 1.4, 0], [.5, .1, 0, 2.1, .3], [.9, 0, 0, 2.0, 0], [1.25, 0, 0, 2.05, 0], [1.3, 0, 0, 2.1, 0], [3.0, -.3, 0, 3.8, 0],
      [3.15, .3, 0, 3.5, -.3], [3.3, .9, 0, 2.9, -.5], [3.5, .7, 0, 2.3, -.3], [3.8, .5, 0, 1.8, 0], [4.3, .5, 0, 1.7, 0],
      [4.6, .4, 0, .7, 0], [4.85, .2, .3, -.1, 0], [5.05, .1, 1.3, -1.6, 1.57], [5.35, .1, 0, -3.0, 3.14], [5.6, .1, 0, -2.8, 3.14],
      [5.75, .1, 0, -3.5, 3.14], [6.1, .1, 0, -4.3, 3.14], [6.6, .1, 0, -4.6, 3.14], [7.9, .1, 0, -4.6, 3.14], [8.35, .1, 0, -4.7, 3.14], [10, .1, 0, -7, 3.14]],
    lock: [{ t0: 1.28, t1: 3.05, d: .38, fade: .08 }, { t0: 7.0, t1: 8.1, d: -.05, fade: .12 }],
    holds: [
      { t0: 0, t1: 3.3, who: 'att', arm: 'armL', z: 7, fade: .08 },
      { t0: 1.3, t1: 3.05, who: 'vic', arm: 'armL', z: 21, fade: .06 }, { t0: 1.3, t1: 3.05, who: 'vic', arm: 'armR', z: 14, fade: .06 },
      { t0: 3.4, t1: 4.1, who: 'att', arm: 'armL', z: 7, fade: .1 },
      { t0: 5.0, t1: 6.5, who: 'att', arm: 'armL', z: 7, fade: .1 },
      { t0: 6.7, t1: 8.1, who: 'att', arm: 'armL', z: 6, fade: .1 },
      { t0: 7.0, t1: 8.1, who: 'vic', arm: 'armL', z: 16, fade: .08 }, { t0: 7.0, t1: 8.1, who: 'vic', arm: 'armR', z: 9, fade: .08 },
      { t0: 8.3, t1: 9.0, who: 'att', arm: 'armL', z: 7, fade: .1 },
    ],
    ev: [
      { t: .14, fx: 'clang', at: 'att', sz: 1.6, imp: 1, shake: .6, text: '¡PARRY!', who: 'att', slow: .25 }, { t: .14, fx: 'ring', at: 'att', r: 3.4, face: 1 },
      { t: .2, fx: 'slash', sfx: 'swing', tilt: -.5 },
      { t: .95, fx: 'charge', at: 'att' }, { t: 1.2, fx: 'line', sfx: 'swing' },
      { t: 1.3, hit: 2, fx: 'clang', at: 'vic', sz: 1.5, imp: 1, shake: .5, text: '¡LA ATRAPA CON LAS MANOS!', who: 'vic', slow: .2 }, { t: 1.32, fx: 'ring', at: 'vic', r: 3 },
      { t: 1.7, fx: 'dust', at: 'ground' }, { t: 2.0, fx: 'dust', at: 'ground' }, { t: 2.3, fx: 'dust', at: 'ground' }, { t: 2.6, fx: 'dust', at: 'ground' },
      { t: 1.9, fx: 'clang', at: 'vic', n: 5, sz: .7 }, { t: 2.5, fx: 'clang', at: 'vic', n: 5, sz: .7 }, { t: 2.9, fx: 'charge', at: 'att', text: '¡NO PASARÁS!', who: 'att' },
      { t: 3.32, hit: 3, fx: 'impact', at: 'att', big: 1, imp: 1, sfx: 'heavy', shake: .7, text: '¡EMPUJÓN!', who: 'vic' },
      { t: 3.5, fx: 'dust', at: 'groundA', n: 14 }, { t: 3.7, fx: 'dust', at: 'groundA' }, { t: 3.9, fx: 'dust', at: 'groundA' },
      { t: 4.3, fx: 'ghost' }, { t: 4.86, fx: 'ring', at: 'groundA', r: 2.4 }, { t: 4.88, fx: 'dust', at: 'groundA', n: 16 },
      { t: 5.15, fx: 'slash', tilt: 0, sfx: 'swing', len: 3.6 }, { t: 5.3, fx: 'line', sfx: 'swing' }, { t: 5.5, fx: 'slash', tilt: .1, sfx: 'swing', len: 3.6 },
      { t: 5.05, fx: 'impact', at: 'vic', sfx: 'swing', text: '¡LO ESQUIVA!', who: 'vic' },
      { t: 5.55, fx: 'ring', at: 'groundA', r: 2.2, shake: .2 },
      { t: 5.65, fx: 'clang', at: 'att', sz: 1.6, imp: 1, shake: .6, text: '¡LA DETIENE!', who: 'att' },
      { t: 5.75, fx: 'dust', at: 'ground', n: 16 }, { t: 5.95, fx: 'dust', at: 'ground' }, { t: 6.15, fx: 'dust', at: 'ground' },
      { t: 6.3, fx: 'slash', tilt: -.2, sfx: 'swing', len: 3.4 }, { t: 6.55, fx: 'ghost' },
      { t: 6.9, fx: 'line', sfx: 'swing' },
      { t: 7.05, hit: 4, fx: 'boom', at: 'vic', big: 1, r: 2.2, imp: 1, shake: .9, text: '¡NO LA SUELTA!', who: 'vic' }, { t: 7.07, fx: 'crack', at: 'ground', r: 5 },
      { t: 7.4, fx: 'clang', at: 'vic', n: 6 }, { t: 7.7, fx: 'clang', at: 'vic', n: 6 }, { t: 7.7, fx: 'ring', at: 'ground', r: 2 },
      { t: 8.1, fx: 'charge', at: 'att', slow: .15, text: '¡GIRA LA LANZA!', who: 'att' },
      { t: 8.6, fx: 'stab', sfx: 'slash' },
      { t: 8.65, rel: { dmg: 24, kb: 22, up: 7, rag: 2.4 }, slow: .35, fx: 'boom', big: 1, r: 3.6, imp: 1, shake: 1 },
    ],
    // rig: a = grados alrededor del punto de mira (0 = detrás de Javi mirando a la víctima, 90 = a su derecha, 180 = desde la víctima); desde el acto V la pelea va hacia -z, por eso allí el ángulo suma 180
    shots: [
      [0, 'rig', { at: 'A', a0: 140, a1: 122, r0: 4.0, r1: 3.1, h0: .1, h1: .2, ly: .2, fov0: 48, fov1: 42, roll0: 4, ease: 'o' }],
      [.14, 'rig', { at: 'hands', a0: 85, a1: 100, r0: 1.8, r1: 2.4, h0: .1, fov: 36, roll0: -5, ease: 'o' }],
      [.5, 'rig', { at: 'A', at1: 'mid', a0: 120, a1: 80, r0: 3.4, r1: 3.8, h0: .5, fov: 46 }],
      [1.0, 'rig', { at: 'A', a0: 20, a1: 60, r0: 2.9, r1: 3.7, h0: -.1, h1: .2, ly: .3, fov: 44, roll0: 5 }],
      [1.28, 'rig', { at: 'hands', a0: 90, a1: 70, r0: 2.5, r1: 2.9, h0: .1, fov: 38, roll0: -4 }],
      [1.7, 'rig', { at: 'hands', at1: 'V', a0: 70, a1: 150, r0: 3.4, r1: 3.4, h0: .15, fov: 44, ease: 'l' }],
      [2.25, 'faceV', { s: 1, fov: 38 }], [2.6, 'faceA', { s: -1, fov: 38 }],
      [2.9, 'rig', { at: 'ground', a0: 80, a1: 95, r0: 3.4, h0: -.4, fov: 52, roll0: 5 }],
      [3.2, 'rig', { at: 'mid', a0: 100, a1: 80, r0: 3.8, r1: 3.8, h0: .15, fov: 42, roll0: -6 }],
      [3.55, 'rig', { at: 'A', a0: 95, a1: 125, r0: 4.8, r1: 5.4, h0: .3, fov: 46, ease: 'l' }],
      [4.15, 'rig', { at: 'A', a0: 80, a1: 100, r0: 4.2, r1: 3.4, h0: .2, h1: .6, fov: 48 }],
      [4.75, 'rig', { at: 'groundA', ly: .5, a0: 25, a1: 40, r0: 3.8, r1: 3.2, h0: .1, fov: 46 }],
      [5.05, 'rig', { at: 'mid', a0: 30, a1: 150, r0: 4.8, h0: .3, fov0: 50, fov1: 46, ease: 'l' }],
      [5.55, 'rig', { at: 'A', at1: 'V', a0: 255, a1: 270, r0: 3.2, h0: .1, fov: 42, roll0: -5 }],
      [6.15, 'rig', { at: 'A', a0: 330, a1: 310, r0: 3, h0: .3, fov: 46 }],
      [6.5, 'rig', { at: 'A', at1: 'V', a0: 260, a1: 275, r0: 4.6, h0: .1, h1: .2, fov: 52, roll0: 6 }],
      [7.02, 'rig', { at: 'V', a0: 285, a1: 250, r0: 3.6, r1: 2.9, h0: .35, h1: .25, fov: 42, roll0: 4 }],
      [7.6, 'faceV', { s: -1, fov: 36 }],
      [8.05, 'rig', { at: 'A', a0: 205, a1: 200, r0: 2.2, r1: 1.7, h0: -.1, fov: 36, roll0: -4 }],
      [8.5, 'rig', { at: 'mid', a0: 270, a1: 265, r0: 3.6, r1: 3.0, h0: .1, fov: 40, roll0: 4 }],
      [8.8, 'hero', { s: -1 }],
    ],
  };
});
