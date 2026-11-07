/* Habilidad: Parry del Dragón · personaje: javi · ranura: awk 1 · id: javiParry
   Pose de guardia diagonal a dos manos inspirada en el modelo de Blockbench, con movimiento vivo,
   respiración marcial, giro de entrada y destellos de energía mientras espera el golpe. */
CF.habilidad('javiParry', function () {
  // Compensamos ix + tx + arx para que `up` sea la inclinación real de la lanza respecto al horizonte
  const U = (o, up = 0) => (o.sx = -(o.ix || 0) - (o.tx || 0) - (o.arx || 0) - up, o);

  // 1) Anticipación: recoge la lanza en diagonal baja flexionando rodillas
  const WIND = U({
    ix: .06, tx: .06, ty: -.42, tz: -.05, hx: -.04, hy: .38, by: -2.4, bz: -.8,
    arx: -.68, arz: .32, ary: -.12, sy: .72, sz: .18, spx: .6, spy: .3, spz: 1.0,
    alx: -1.08, alz: -.28, aly: .24,
    llx: -.46, lrx: .44, llz: .14, lrz: -.14,
    tpx: -.4, tpz: -.5, arpx: -.9, arpy: -.2, arpz: .8, alpx: .8, alpz: 1.2,
    llpz: 1.0, lrpz: -1.0, tscx: 1.04, tscy: .96
  }, .22);

  // 2) Latigazo diagonal: cruza la lanza frente al pecho con smear de velocidad
  const SNAP = U({
    ix: .16, tx: .14, ty: .34, tz: .05, hx: -.12, hy: -.30, by: -4.2, bz: .8,
    arx: -.92, arz: .14, ary: -.24, sy: 1.10, sz: .34, spx: 1.2, spy: .6, spz: 1.8,
    alx: -1.36, alz: -.48, aly: .38,
    llx: -.78, lrx: .66, llz: .18, lrz: -.18,
    tpx: .5, tpz: .8, arpx: -.8, arpy: -.4, arpz: 1.6, ars: 1.12,
    alpx: 1.1, alpy: -.2, alpz: 1.9, als: 1.06,
    llpx: .6, llpz: 1.8, lrpx: -.6, lrpz: -1.8, tscx: 1.07, tscy: .93
  }, .36);

  // 3) Pose principal de Parry (Blockbench mejorada): lanza cruzada en diagonal de abajo-derecha
  //    a arriba-izquierda (~22° arriba), mano derecha abajo, mano izquierda sujetando detrás del collar dorado
  const GUARD = U({
    ix: .11, tx: .09, ty: .24, tz: .03, hx: -.08, hy: -.22, by: -3.2, bz: .4,
    arx: -.82, arz: .16, ary: -.18, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.64, lrx: .54, llz: .15, lrz: -.15,
    tpx: .3, tpz: .4, arpx: -.7, arpy: -.3, arpz: 1.4,
    alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .30);

  // 4) Oscilaciones vivas durante la ventana de parry (cambio de peso, torsión y altura de lanza)
  const COIL = U({
    ix: .16, tx: .14, ty: .36, tz: .06, hx: -.14, hy: -.34, by: -4.1, bz: .8,
    arx: -.90, arz: .12, ary: -.24, sy: 1.12, sz: .34, spx: 1.1, spy: .6, spz: 1.7,
    alx: -1.36, alz: -.46, aly: .38,
    llx: -.76, lrx: .64, llz: .17, lrz: -.17,
    tpx: .5, tpz: .7, arpx: -.8, arpy: -.4, arpz: 1.6,
    alpx: 1.0, alpy: -.2, alpz: 1.9,
    llpx: .6, llpz: 1.8, lrpx: -.6, lrpz: -1.8, tscx: 1.06, tscy: .94
  }, .38);

  const SWAY = U({
    ix: .07, tx: .06, ty: .12, tz: -.02, hx: -.04, hy: -.10, by: -2.5, bz: 0,
    arx: -.74, arz: .20, ary: -.12, sy: .94, sz: .22, spx: .8, spy: .4, spz: 1.3,
    alx: -1.18, alz: -.36, aly: .28,
    llx: -.52, lrx: .46, llz: .14, lrz: -.14,
    tpx: 0, tpz: .2, arpx: -.5, arpy: -.2, arpz: 1.2,
    alpx: .7, alpy: 0, alpz: 1.5,
    llpx: .4, llpz: 1.2, lrpx: -.4, lrpz: -1.2, tscx: .98, tscy: 1.03
  }, .22);

  const SINK = U({
    ix: .15, tx: .13, ty: .30, tz: .05, hx: -.11, hy: -.28, by: -3.9, bz: .7,
    arx: -.88, arz: .14, ary: -.22, sy: 1.08, sz: .30, spx: 1.1, spy: .5, spz: 1.6,
    alx: -1.32, alz: -.44, aly: .36,
    llx: -.72, lrx: .60, llz: .16, lrz: -.16,
    tpx: .4, tpz: .6, arpx: -.8, arpy: -.4, arpz: 1.5,
    alpx: 1.0, alpy: -.1, alpz: 1.8,
    llpx: .5, llpz: 1.6, lrpx: -.5, lrpz: -1.6, tscx: 1.05, tscy: .95
  }, .35);

  // 5) Salida suave manteniendo la lanza en diagonal
  const OPEN = U({
    ix: .06, tx: .06, ty: .10, hx: -.04, hy: -.08, by: -1.8, bz: .1,
    arx: -.68, arz: .22, ary: -.12, sy: .76, sz: .16, spx: .6, spy: .3, spz: 1.0,
    alx: -.96, alz: -.26, aly: .20,
    llx: -.42, lrx: .36, llz: .12, lrz: -.12
  }, .18);

  return function (f) {
    prepWeapon(f);
    sfx('draw', f.pos);
    startTwirl(f, 1, .10);
    f.counter = 1.55;
    for (const k in WIND) if (f.anim && f.anim.x && k in f.anim.x) f.anim.x[k] = WIND[k] * .65;
    const sparkTip = () => {
      if (!f.spear || !f.spearOut) return;
      const tip = anchorPoint(f, 'tip'), mid = f.spear.localToWorld(new V3(0, 0, 12 * PX));
      burst(tip, 5, '#4fc3f7', 2.8, .09, .26, -.2);
      burst(mid, 3, '#ffd54f', 2.0, .07, .22, -.15);
    };
    startAction(f, {
      name: 'javiParry', dur: 1.8, speedMul: .22, eyes: true,
      grips: [{ arm: 'armL', z: 11, t0: 0 }],
      anim: [
        [0, WIND, 2200],
        [.10, SNAP, 1500],
        [.20, GUARD, 1000],
        [.50, COIL, 560],
        [.80, SWAY, 560],
        [1.10, SINK, 560],
        [1.38, GUARD, 580],
        [1.60, OPEN, 650],
      ],
      steps: [
        {
          at: .12, fn: () => {
            arcSlash(f, '#4fc3f7', { tilt: .42, r: 1.85, len: 2.7, dir: 1, w: .62, dur: .22 });
            ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#4fc3f7', 2.4, .28);
            burst(front(f, 1.0, 1.25), 12, '#ffd54f', 4.5, .11, .32, 0);
            sfx('swing', f.pos, .75);
          }
        },
        { at: .35, fn: sparkTip },
        { at: .68, fn: sparkTip },
        { at: 1.02, fn: sparkTip },
        { at: 1.32, fn: sparkTip },
      ],
      onCounter: (f, att) => {
        const clash = front(f, 1.05, 1.28);
        impactFrame(.08);
        G.shake = Math.max(G.shake, .65);
        sphereFlash(clash, '#ffffff', 1.7, .18);
        impactStar(clash, '#ffd54f', 2.5, .24);
        ringAt(clash, '#4fc3f7', 3.2, .28, 'face', f.yaw);
        ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd54f', 3.4, .32);
        burst(clash, 24, '#ffd54f', 9, .15, .38, .1);
        burst(clash, 18, '#4fc3f7', 8, .14, .36, 0);
        sfx('clang', clash, 1.0);
        sfx('counter', f.pos);
        popText(chestOf(f), '¡PARRY DEL DRAGÓN!', '#4fc3f7', 24);
        startChoreo(f, att, 'javiParry');
      },
    });
  };
});
