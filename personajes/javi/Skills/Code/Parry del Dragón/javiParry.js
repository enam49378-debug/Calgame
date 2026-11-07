/* Habilidad: Parry del Dragón · personaje: javi · ranura: awk 1 · id: javiParry
   Pose de guardia diagonal a dos manos inspirada en el modelo de Blockbench, con movimiento vivo,
   respiración marcial, giro de entrada y destellos de energía mientras espera el golpe. */
CF.habilidad('javiParry', function () {
  // arx + sx = 0 apunta la lanza recto al frente (+Z); up > 0 la inclina hacia arriba (+Y)
  const U = (o, up = 0) => (o.sx = -(o.arx || 0) - up, o);

  // 1) Anticipación: recoge la lanza al costado derecho flexionando rodillas
  const WIND = U({
    ix: -.10, tx: -.08, ty: -.58, tz: -.06, hx: .06, hy: .52, by: -2.4, bz: -1.1,
    arx: -.42, arz: .48, ary: .22, sy: -.45, sz: -.20,
    alx: -.88, alz: .36, aly: -.18,
    llx: -.42, lrx: .46, llz: .14, lrz: -.14,
    tpx: -.6, tpz: -.8, arpx: -1.4, arpy: .4, arpz: -1.2, alpx: 1.1, alpz: .6,
    llpz: .8, lrpz: -.8, tscx: 1.04, tscy: .96
  }, .18);

  // 2) Latigazo diagonal: cruza la lanza frente al pecho con smear de velocidad
  const SNAP = U({
    ix: .18, tx: .16, ty: .36, tz: .05, hx: -.10, hy: -.32, by: -4.2, bz: .9,
    arx: -.96, arz: .12, ary: -.26, sy: 1.12, sz: .34, spx: 1.2, spy: .6, spz: 1.8,
    alx: -1.36, alz: -.48, aly: .38,
    llx: -.78, lrx: .66, llz: .18, lrz: -.18,
    tpx: .5, tpz: .9, arpx: -.9, arpy: -.5, arpz: 1.8, ars: 1.14,
    alpx: 1.2, alpy: -.2, alpz: 2.0, als: 1.08,
    llpx: .6, llpz: 1.8, lrpx: -.6, lrpz: -1.8, tscx: 1.08, tscy: .92
  }, .52);

  // 3) Pose principal de Parry (Blockbench mejorada): lanza cruzada en diagonal de abajo-derecha
  //    a arriba-izquierda (~24° arriba), mano derecha abajo, mano izquierda sujetando cerca del collar dorado,
  //    pierna izquierda adelantada y rodillas flexionadas con peso atlético.
  const GUARD = U({
    ix: .13, tx: .11, ty: .26, tz: .04, hx: -.08, hy: -.24, by: -3.3, bz: .5,
    arx: -.84, arz: .16, ary: -.20, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.66, lrx: .56, llz: .15, lrz: -.15,
    tpx: .3, tpz: .5, arpx: -.7, arpy: -.4, arpz: 1.4,
    alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .46);

  // 4) Oscilaciones vivas durante la ventana de parry (evita quedarse congelado)
  const COIL = U({
    ix: .16, tx: .14, ty: .32, tz: .06, hx: -.11, hy: -.30, by: -3.9, bz: .8,
    arx: -.90, arz: .14, ary: -.24, sy: 1.08, sz: .32, spx: 1.1, spy: .6, spz: 1.7,
    alx: -1.34, alz: -.45, aly: .36,
    llx: -.74, lrx: .62, llz: .17, lrz: -.17,
    tpx: .4, tpz: .7, arpx: -.8, arpy: -.5, arpz: 1.6,
    alpx: 1.0, alpy: -.2, alpz: 1.9,
    llpx: .6, llpz: 1.7, lrpx: -.6, lrpz: -1.7, tscx: 1.05, tscy: .95
  }, .52);

  const SWAY = U({
    ix: .10, tx: .08, ty: .18, tz: .02, hx: -.05, hy: -.16, by: -2.8, bz: .2,
    arx: -.78, arz: .18, ary: -.16, sy: .98, sz: .24, spx: .9, spy: .4, spz: 1.3,
    alx: -1.22, alz: -.38, aly: .30,
    llx: -.58, lrx: .50, llz: .14, lrz: -.14,
    tpx: .1, tpz: .3, arpx: -.6, arpy: -.3, arpz: 1.2,
    alpx: .8, alpy: 0, alpz: 1.5,
    llpx: .4, llpz: 1.3, lrpx: -.4, lrpz: -1.3, tscx: .99, tscy: 1.02
  }, .40);

  const SINK = U({
    ix: .17, tx: .15, ty: .30, tz: .05, hx: -.10, hy: -.28, by: -4.1, bz: .7,
    arx: -.88, arz: .15, ary: -.22, sy: 1.06, sz: .30, spx: 1.1, spy: .5, spz: 1.6,
    alx: -1.32, alz: -.44, aly: .35,
    llx: -.72, lrx: .60, llz: .16, lrz: -.16,
    tpx: .4, tpz: .6, arpx: -.8, arpy: -.4, arpz: 1.5,
    alpx: 1.0, alpy: -.1, alpz: 1.8,
    llpx: .5, llpz: 1.6, lrpx: -.5, lrpz: -1.6, tscx: 1.06, tscy: .94
  }, .50);

  // 5) Salida suave si nadie golpea
  const OPEN = U({
    ix: .05, tx: .06, ty: -.18, hx: -.02, hy: .16, by: -1.6, bz: 0,
    arx: -.62, arz: .28, ary: -.10, sy: .25, sz: 0,
    alx: -.75, alz: .22, aly: .12,
    llx: -.36, lrx: .32, llz: .10, lrz: -.10
  }, .22);

  return function (f) {
    prepWeapon(f);
    sfx('draw', f.pos);
    startTwirl(f, 2, .22);
    f.counter = 1.55;
    const sparkTip = () => {
      if (!f.spear || !f.spearOut) return;
      const tip = anchorPoint(f, 'tip'), mid = f.spear.localToWorld(new V3(0, 0, 12 * PX));
      burst(tip, 5, '#4fc3f7', 2.8, .09, .26, -.2);
      burst(mid, 3, '#ffd54f', 2.0, .07, .22, -.15);
    };
    startAction(f, {
      name: 'javiParry', dur: 1.8, speedMul: .22, eyes: true, counter: true, noControl: true,
      // La mano izquierda agarra el asta justo detrás del collar dorado (z=11) como en Blockbench
      grips: [{ arm: 'armL', z: 11, t0: .16 }],
      anim: [
        [0, WIND, 1100],
        [.13, SNAP, 1400],
        [.24, GUARD, 950],
        [.52, COIL, 520],
        [.82, SWAY, 520],
        [1.12, SINK, 520],
        [1.40, GUARD, 560],
        [1.58, OPEN, 650],
      ],
      steps: [
        {
          at: .13, fn: () => {
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
        sfx('block', clash, 1.0);
        sfx('counter', f.pos);
        popText(chestOf(f), '¡PARRY DEL DRAGÓN!', '#4fc3f7', 24);
        if (!att.alive || att.cineLock || att.grabbed) return counterHit(f, att);
        f.yaw = yawTo(f, att); f.iframes = Math.max(f.iframes, 2.5);
        runChore(f, att, CHORE.javiParry);   // arranca el duelo (coreografía javiParry)
      },
    });
  };
});
