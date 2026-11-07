/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Duelo de lanza continuo estilo anime, verificado cuadro a cuadro con el banco visual (harness.js):
   1) Choque del Parry: el brazo derecho de la víctima golpea contra la lanza diagonal de Javi; Javi absorbe y desvía.
   2) Giro 360° + estocada al pecho: la víctima atrapa y frena el asta con AMBAS MANOS a la altura del pecho mientras
      Javi avanza dando 5 zancadas reales y la víctima resbala hacia atrás entre chispas y polvo.
   3) Desvío al límite, patada giratoria en salto de la víctima, bloqueo deslizante de Javi y voltereta atrás (backflip).
   4) Sprint de la víctima, barrido bajo de 360° de Javi a la altura de las espinillas y salto acrobático por encima.
   5) Intercambio veloz de cortes contra los brazos en guardia de la víctima y giro látigo que rompe su guardia.
   6) Salto mortal del Dragón cayendo desde el aire; la víctima frena la lanza SOBRE SU CABEZA con ambas manos cayendo
      de rodillas mientras el suelo se agrieta, Javi gira la lanza como taladro y conecta la estocada final explosiva. */
CF.coreografia('javiParry', function () {
  const TAU = Math.PI * 2;
  const base = {
    ix: 0, iy: 0, iz: 0, tx: 0, ty: 0, tz: 0, hx: 0, hy: 0, hz: 0,
    bx: 0, by: -1.4, bz: 0,
    alx: -.85, aly: .15, alz: -.25,
    arx: -.85, ary: -.15, arz: .18,
    llx: -.32, lly: 0, llz: .10, lrx: .28, lry: 0, lrz: -.10,
    sx: .85, sy: 0, sz: 0, spx: 0, spy: 0, spz: 0, ssc: 1,
    tpx: 0, tpy: 0, tpz: 0, hpx: 0, hpy: 0, hpz: 0,
    alpx: 0, alpy: 0, alpz: 0, arpx: 0, arpy: 0, arpz: 0,
    llpx: 0, llpy: 0, llpz: 0, lrpx: 0, lrpy: 0, lrpz: 0,
    als: 1, ars: 1, lls: 1, lrs: 1, tscx: 1, tscy: 1, tscz: 1, hscx: 1, hscy: 1, hscz: 1,
  };
  const P = o => Object.assign({}, base, o);
  // Compensa la inclinación del cuerpo (ix + tx) y del brazo (arx) para que `up` sea el ángulo real
  // respecto al horizonte del mundo (up=0 mantiene la lanza horizontal a la altura del pecho).
  // Si se pasa `side`, también compensa el giro del torso (ty + ary) para apuntar al frente + `side`.
  const U = (o, up = 0, side = null) => {
    const r = P(o);
    r.sx = -(r.ix || 0) - (r.tx || 0) - (r.arx || 0) - up;
    if (side !== null) r.sy = -(r.ty || 0) - (r.ary || 0) + side;
    return r;
  };
  // Mantiene la continuidad de ix tras una voltereta completa (-TAU) sin alterar sx
  const F = (o, turns = -1) => Object.assign({}, o, { ix: (o.ix || 0) + turns * TAU });

  // ==================== ACTO I: CHOQUE DEL PARRY Y DESVÍO (0.00 - 0.95s) ====================
  const A_GUARD_0 = U({
    ix: .11, tx: .09, ty: .24, tz: .03, hx: -.08, hy: -.22, by: -3.2, bz: .4,
    arx: -.82, arz: .16, ary: -.18, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.64, lrx: .54, llz: .15, lrz: -.15,
    tpx: .3, tpz: .4, arpx: -.7, arpy: -.2, arpz: 1.4, alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .32);

  // Impacto: el brazo de la víctima choca contra el centro del asta diagonal; Javi flexiona absorbiendo fuerza
  const A_PARRY_SHOCK = U({
    ix: .16, tx: .14, ty: .32, tz: .06, hx: -.12, hy: -.28, by: -4.2, bz: -.4,
    arx: -.94, arz: .20, ary: -.24, sy: 1.08, sz: .34, spx: 1.1, spy: .7, spz: 1.7,
    alx: -1.38, alz: -.48, aly: .38,
    llx: -.82, lrx: .68, llz: .18, lrz: -.18,
    tpx: .5, tpz: -.3, arpx: -.9, arpy: -.2, arpz: 1.6, alpx: 1.1, alpy: 0, alpz: 1.9,
    llpx: .6, llpz: 1.9, lrpx: -.6, lrpz: -1.9, tscx: 1.08, tscy: .92
  }, .38);

  // Javi palanquea la lanza hacia arriba y a la derecha, abriendo la guardia de la víctima
  const A_DEFLECT_UP = U({
    ix: -.06, tx: -.10, ty: -.52, tz: -.08, hx: .06, hy: .44, by: -1.8, bz: 1.0,
    arx: -1.85, arz: .52, ary: .28, sy: -.58, sz: -.40, spx: -.5, spy: 1.0, spz: 1.8,
    alx: -1.68, alz: -.18, aly: .22,
    llx: -.50, lrx: .60, llz: .16, lrz: -.16,
    tpx: -.6, tpy: .4, tpz: .9, arpx: -1.5, arpy: 1.2, arpz: 2.2, ars: 1.12,
    alpx: 1.2, alpy: .9, alpz: 1.6, als: 1.06, tscx: .96, tscy: 1.06
  }, .68);

  // Giro de 360° preparando la estocada
  const A_SPIN_1 = U({
    ix: .12, tx: .10, ty: -.64, tz: -.10, hx: -.08, hy: .52, by: -2.9, bz: .3,
    arx: -1.18, arz: .62, ary: .32, sy: -.65, sz: -.24,
    alx: -.72, alz: .54, aly: -.18,
    llx: .42, lrx: -.64, llz: .16, lrz: -.16,
    llpz: -1.5, lrpz: 1.6, tscx: 1.03, tscy: .97
  }, .18);

  const A_SPIN_2 = U({
    ix: .16, tx: .12, ty: -.38, tz: .08, hx: -.10, hy: .28, by: -3.4, bz: -.3,
    arx: -.82, arz: .36, ary: .16, sy: -.22, sz: .12,
    alx: -1.12, alz: -.30, aly: .24,
    llx: -.68, lrx: .52, llz: .16, lrz: -.16,
    llpz: 1.5, lrpz: -1.4, tscx: 1.05, tscy: .95
  }, .10);

  // Carga la lanza en la cadera derecha apuntando directo al pecho de la víctima
  const A_COIL_THRUST = U({
    ix: .18, tx: .14, ty: -.72, tz: -.06, hx: -.14, hy: .64, by: -3.8, bz: -1.2,
    arx: -.72, arz: .32, ary: .20, sz: -.15, spx: -.6, spy: .2, spz: -1.0,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.86, lrx: .70, llz: .18, lrz: -.18,
    tpx: -.7, tpz: -1.0, arpx: -1.5, arpy: .2, arpz: -1.8, alpx: 1.2, alpz: 1.5,
    llpx: .7, llpz: 2.0, lrpx: -.7, lrpz: -2.0, tscx: 1.07, tscy: .93
  }, .04, 0);

  const V_ATTACK_IN = P({
    ix: .20, tx: .18, ty: .64, hx: -.10, hy: -.46, by: -2.0, bz: 1.4,
    arx: -1.54, arz: -.14, ary: -.18, alx: -.68, alz: -.38,
    llx: -.74, lrx: .60, llz: .14, lrz: -.14,
    arpx: -1.2, arpy: .4, arpz: 2.6, ars: 1.12, llpz: 1.6, lrpz: -1.5
  });

  const V_CLASH_PARRY = P({
    ix: .14, tx: .14, ty: .42, tz: -.06, hx: .10, hy: -.28, by: -2.5, bz: .5,
    arx: -1.48, arz: .10, ary: -.12, alx: -.88, alz: .34,
    llx: -.60, lrx: .48, llz: .16, lrz: -.16,
    arpx: -.9, arpy: .5, arpz: 2.0, tscx: 1.06, tscy: .94
  });

  const V_DEFLECTED_1 = P({
    ix: -.24, tx: -.22, ty: -.58, tz: .16, hx: -.32, hy: .48, hz: .14, by: -1.2, bz: -.9,
    arx: -2.25, arz: -.82, ary: .30, alx: -.52, alz: .72,
    llx: .28, lrx: -.50, llz: .18, lrz: -.16,
    tpx: .6, tpz: -.8, arpx: -1.8, arpy: 1.2, arpz: -.6, llpz: -1.1, lrpz: 1.3, tscx: .96, tscy: 1.06
  });

  const V_DEFLECTED_2 = P({
    ix: -.08, tx: -.08, ty: -.22, tz: .06, hx: -.10, hy: .18, by: -1.8, bz: -.3,
    arx: -1.18, arz: -.42, alx: -.92, alz: .38,
    llx: -.42, lrx: .36, llz: .15, lrz: -.15,
    llpz: 1.0, lrpz: -1.0
  });

  // ==================== ACTO II: ESTOCADA Y FRENADA CON LAS MANOS (0.95 - 2.65s) ====================
  // Javi avanza dando 5 zancadas potentes con la lanza inclinada hacia arriba (.24) para que toda la hoja
  // cristalina sobresalga junto al hombro de la víctima mientras esta frena el asta con ambas manos (como el boceto)
  const makeDriveStep = (step, side, smear = 0) => U({
    ix: .20 + smear * .04, tx: .16, ty: .28 + side * .10, tz: side * .05,
    hx: -.16, hy: -.24 - side * .08, by: -2.8 - Math.abs(side) * .5, bz: 1.4 + smear * .8,
    arx: -1.48, arz: -.05, ary: -.06, sz: step * .28, spx: 0, spy: .3, spz: .6 + smear * .5,
    alx: -1.42, alz: -.24, aly: .20,
    llx: side > 0 ? -.92 : .58, lrx: side > 0 ? .70 : -.88, llz: .16, lrz: -.16,
    tpx: .4, tpz: .8, arpx: -1.2, arpy: .4, arpz: 1.4 + smear * .6, ars: 1.08 + smear * .10,
    alpx: 1.0, alpy: .4, alpz: 1.4, als: 1.05,
    llpx: .6, llpz: side > 0 ? 2.2 : -1.8, lrpx: -.6, lrpz: side > 0 ? -2.0 : 2.0,
    tscx: .96, tscy: 1.05
  }, .24, .06 + side * .02);

  // La víctima sujeta el asta frente a su pecho con ambas manos mientras sus pies resbalan hacia atrás
  const makeBrakeStruggle = (step, side) => P({
    ix: .12 + side * .04, tx: .14 + Math.abs(side) * .04, ty: side * .12, tz: -side * .06,
    hx: .18 - side * .05, hy: -side * .10, hz: side * .06,
    by: -2.6 - (step % 2) * .6, bz: -.4,
    arx: -1.48 + side * .06, arz: .18, ary: -.20,
    alx: -1.44 - side * .06, alz: -.18, aly: .20,
    llx: side > 0 ? -.78 : .44, lrx: side > 0 ? .50 : -.76, llz: .18, lrz: -.18,
    tpy: -.2, tpz: -.3, hpy: .3, hpz: .5,
    arpx: -.9, arpy: .5, arpz: 1.6, ars: 1.06,
    alpx: .9, alpy: .5, alpz: 1.8, als: 1.06,
    llpx: .7, llpz: side > 0 ? 1.9 : -1.5, lrpx: -.7, lrpz: side > 0 ? -1.6 : 1.8,
    tscx: 1.06, tscy: .94
  });

  // ==================== ACTO III: DESVÍO, PATADA, RESBALÓN Y BACKFLIP (2.65 - 4.10s) ====================
  const A_WRENCHED = U({
    ix: .10, tx: .08, ty: -.48, tz: -.10, hx: .06, hy: .36, by: -2.2, bz: .2,
    arx: -1.28, arz: .56, ary: .24, sy: -.72, sz: -.30,
    alx: -.82, alz: .44, aly: -.14,
    llx: -.50, lrx: .44, llz: .16, lrz: -.16
  }, .24);

  const V_WRENCH_OUT = P({
    ix: .10, tx: .14, ty: .72, tz: .10, hx: -.12, hy: -.48, by: -2.2, bz: .9,
    arx: -1.40, arz: -.64, ary: -.30, alx: -1.26, alz: -.70, aly: -.24,
    llx: -.64, lrx: .52, llz: .18, lrz: -.18,
    arpx: -1.4, arpz: 1.8, alpx: 1.4, alpz: 1.8, tscx: 1.05, tscy: .95
  });

  const V_KICK_WIND = P({
    ix: -.12, tx: -.10, ty: -.64, hx: -.08, hy: .50, by: -1.5,
    arx: -.62, arz: .44, alx: -1.12, alz: -.34,
    llx: -.40, lrx: .60, llz: .14, lrz: -.14
  });

  const V_SPIN_KICK = P({
    ix: -.32, iz: .22, tx: -.18, ty: -.68, hx: -.16, hy: .58, by: .6, bz: 1.2,
    arx: .48, arz: -.62, alx: -1.14, alz: .50,
    llx: .32, lrx: -1.96, lrz: .28, llz: .16,
    lrpx: -.7, lrpy: 1.0, lrpz: 2.2, lrs: 1.14, tscx: .96, tscy: 1.06
  });

  const V_KICK_LAND = P({
    ix: .14, tx: .12, ty: .24, hx: -.08, hy: -.18, by: -2.4, bz: .3,
    arx: -.84, arz: .30, alx: -1.00, alz: -.28,
    llx: -.60, lrx: .48, llz: .16, lrz: -.16
  });

  // Javi bloquea la patada con la lanza en diagonal alta y resbala hacia atrás
  const A_BLOCK_KICK = U({
    ix: .16, tx: .14, ty: .22, tz: .06, hx: .08, hy: -.18, by: -3.4, bz: -.6,
    arx: -1.42, arz: .28, ary: -.24, sy: 1.12, sz: .38, spx: 1.1, spy: .7, spz: 1.6,
    alx: -1.48, alz: -.42, aly: .34,
    llx: -.78, lrx: .64, llz: .18, lrz: -.18,
    tpx: .4, tpz: -.6, arpx: -.8, arpy: .5, arpz: 1.6, alpx: 1.0, alpy: .4, alpz: 1.8,
    llpx: .6, llpz: 1.8, lrpx: -.6, lrpz: -1.8, tscx: 1.08, tscy: .92
  }, .42);

  const A_SKID_BACK = U({
    ix: .22, tx: .18, ty: -.18, tz: -.05, hx: -.14, hy: .16, by: -4.2, bz: -.9,
    arx: -1.08, arz: .38, ary: -.16, sy: .88, sz: .22, spx: .8, spy: .4, spz: 1.3,
    alx: -1.20, alz: -.34, aly: .26,
    llx: -.96, lrx: .78, llz: .20, lrz: -.20,
    llpx: .7, llpz: 2.2, lrpx: -.7, lrpz: -2.2, tscx: 1.10, tscy: .90
  }, .30);

  // Backflip acrobático manteniendo la lanza cruzada junto al cuerpo
  const A_FLIP_1 = P({
    ix: -1.45, tx: -.24, ty: -.10, hx: -.38, by: 0,
    arx: -1.45, arz: .34, sx: 1.10, sy: .72, alx: -1.65, alz: -.34,
    llx: -1.32, lrx: -.42, llz: .14, lrz: -.14, tscy: 1.06
  });

  const A_FLIP_2 = P({
    ix: -3.14, tx: -.32, ty: 0, hx: -.42, by: 0,
    arx: -1.55, arz: .28, sx: 1.20, sy: .65, alx: -1.75, alz: -.28,
    llx: -1.68, lrx: -1.58, llz: .16, lrz: -.16, tscx: 1.05, tscy: .95
  });

  const A_FLIP_3 = P({
    ix: -4.75, tx: -.16, ty: .10, hx: -.20, by: -.6,
    arx: -1.25, arz: .30, sx: 1.05, sy: .68, alx: -1.40, alz: -.28,
    llx: -.92, lrx: .32, llz: .16, lrz: -.16
  });

  // Aterrizaje limpio de pantera mirando al frente (sin doblar la espalda contra el piso)
  const A_FLIP_LAND = F(U({
    ix: .16, tx: .14, ty: -.42, hx: -.14, hy: .36, by: -3.9, bz: .4,
    arx: -.82, arz: .44, ary: .18, sy: -.62, sz: -.18,
    alx: -.96, alz: .38,
    llx: -.94, lrx: .76, llz: .20, lrz: -.20,
    llpx: .7, llpz: 2.0, lrpx: -.7, lrpz: -2.0, tscx: 1.08, tscy: .92
  }, .18), -1);

  // ==================== ACTO IV: SPRINT, BARRIDO 360° Y SALTO ACROBÁTICO (4.10 - 5.30s) ====================
  const makeRunPose = (side) => P({
    ix: .36, tx: .18, ty: side * .32, tz: -side * .06, hx: -.24, hy: -side * .22,
    by: -1.6, bz: 1.0,
    arx: side > 0 ? .82 : -1.28, arz: .22,
    alx: side > 0 ? -1.28 : .82, alz: -.22,
    llx: side > 0 ? -1.06 : .82, lrx: side > 0 ? .82 : -1.06, llz: .12, lrz: -.12,
    llpz: side > 0 ? 2.2 : -2.0, lrpz: side > 0 ? -2.0 : 2.2, tscx: .97, tscy: 1.04
  });

  // Barrido bajo de 360° manteniendo la lanza horizontal a la altura de las espinillas
  const A_SWEEP_1 = F(U({
    ix: .20, iz: .14, tx: .16, ty: -.72, hx: -.16, hy: .56, by: -4.6, bz: 1.0,
    arx: -1.42, arz: .22, ary: .24, sz: -.22, spx: -1.2, spy: -.1, spz: 2.0,
    alx: .38, alz: -.58,
    llx: -1.04, lrx: .82, llz: .22, lrz: -.20,
    arpx: -1.8, arpz: 2.4, ars: 1.16, tscx: .94, tscy: 1.08
  }, .14, -.28), -1);

  const A_SWEEP_2 = F(U({
    ix: .18, iz: -.14, tx: .14, ty: .82, hx: -.14, hy: -.64, by: -4.2, bz: .8,
    arx: -1.46, arz: -.24, ary: -.28, sz: .24, spx: 1.2, spy: -.1, spz: 2.0,
    alx: .48, alz: .62,
    llx: .72, lrx: -.96, llz: .22, lrz: -.22,
    arpx: -2.0, arpz: 2.4, ars: 1.16, tscx: .95, tscy: 1.06
  }, .14, .28), -1);

  const A_SWEEP_REC = F(U({
    ix: .12, tx: .10, ty: -.32, hx: -.08, hy: .24, by: -2.6, bz: .4,
    arx: -1.06, arz: .20, sz: -.18,
    alx: -.86, alz: -.28,
    llx: -.64, lrx: .54, llz: .16, lrz: -.16
  }, .18, -.12), -1);

  const V_VAULT_UP = P({
    ix: -.36, iz: .24, tx: -.16, ty: -.42, hx: .18, hy: .32, by: .4,
    arx: -2.05, arz: .58, alx: -1.85, alz: -.58,
    llx: -1.52, lrx: -1.28, llz: .18, lrz: -.18,
    llpy: 1.1, lrpy: .9, tscx: .96, tscy: 1.06
  });

  const V_VAULT_APEX = P({
    ix: .42, iz: -.26, tx: .22, ty: .44, hx: .28, hy: -.32, by: -.4,
    arx: -2.30, arz: .34, alx: -2.15, alz: -.34,
    llx: -1.64, lrx: -1.48, llz: .20, lrz: -.20,
    llpy: 1.3, lrpy: 1.3, tscx: 1.04, tscy: .96
  });

  const V_DROP_SMASH = P({
    ix: .36, tx: .30, ty: .56, hx: .18, hy: -.38, by: -2.2, bz: 1.4,
    arx: -1.62, arz: -.18, alx: -.72, alz: .44,
    llx: -.84, lrx: .68, llz: .16, lrz: -.16,
    arpx: -1.4, arpy: -.2, arpz: 2.6, ars: 1.14
  });

  // ==================== ACTO V: INTERCAMBIO DE CORTES Y RUPTURA DE GUARDIA (5.30 - 6.60s) ====================
  const A_PARRY_SPIN = F(U({
    ix: .12, iz: .14, tx: .10, ty: .48, hx: -.08, hy: -.38, by: -2.4, bz: .4,
    arx: -1.52, arz: -.24, ary: -.18, sz: .24, spx: .6, spy: .4, spz: 1.6,
    alx: -1.36, alz: -.30,
    llx: -.68, lrx: .58, llz: .16, lrz: -.16, ars: 1.12
  }, .14, .18), -1);

  const A_COMBO_1 = F(U({
    ix: .16, tx: .14, ty: -.58, hx: -.12, hy: .44, by: -2.8, bz: 1.2,
    arx: -1.48, arz: .24, ary: .20, sz: -.28, spx: -.8, spy: .3, spz: 2.0,
    alx: .28, alz: -.52,
    llx: -.84, lrx: .68, llz: .18, lrz: -.18,
    arpx: -1.6, arpz: 2.4, ars: 1.16
  }, .10, -.16), -1);

  const A_COMBO_2 = F(U({
    ix: .14, tx: .12, ty: .58, hx: -.12, hy: -.44, by: -2.2, bz: 1.0,
    arx: -1.54, arz: -.26, ary: -.20, sz: .28, spx: .8, spy: .4, spz: 1.8,
    alx: -1.42, alz: -.24,
    llx: .56, lrx: -.78, llz: .18, lrz: -.18,
    arpx: -1.4, arpy: .5, arpz: 2.2, ars: 1.14
  }, .12, .16), -1);

  const A_COMBO_3 = F(U({
    ix: .20, tx: .16, ty: .48, hx: -.14, hy: -.38, by: -3.0, bz: 1.6,
    arx: -1.52, arz: -.16, ary: -.12, sz: .18, spx: .6, spy: .2, spz: 2.2,
    alx: .42, alz: .52,
    llx: -.96, lrx: .78, llz: .18, lrz: -.18,
    arpx: -1.8, arpz: 2.8, ars: 1.20, tscx: .94, tscy: 1.07
  }, .08, 0), -1);

  const V_COVER_1 = P({
    ix: .14, tx: .16, ty: -.14, tz: .06, hx: .20, hy: .12, by: -2.6, bz: -.5,
    arx: -1.52, arz: .82, ary: -.30, alx: -1.48, alz: -.82, aly: .30,
    llx: -.64, lrx: .52, llz: .18, lrz: -.18,
    arpx: -.7, arpy: .5, arpz: 1.6, alpx: .7, alpy: .5, alpz: 1.6,
    llpz: 1.5, lrpz: -1.5, tscx: 1.05, tscy: .95
  });

  const V_COVER_2 = P({
    ix: .18, tx: .20, ty: .14, tz: -.06, hx: .24, hy: -.12, by: -3.0, bz: -.8,
    arx: -1.56, arz: .86, ary: -.34, alx: -1.52, alz: -.86, aly: .34,
    llx: .48, lrx: -.68, llz: .18, lrz: -.18,
    arpx: -.8, arpy: .6, arpz: 1.7, alpx: .8, alpy: .6, alpz: 1.7,
    llpz: -1.5, lrpz: 1.6, tscx: 1.07, tscy: .93
  });

  const V_GUARD_BROKEN = P({
    ix: -.28, tx: -.26, ty: .24, tz: -.12, hx: -.40, hy: -.20, by: -1.6, bz: -1.0,
    arx: -.64, arz: -1.22, alx: -.58, alz: 1.22,
    llx: -.48, lrx: .58, llz: .20, lrz: -.20,
    arpx: -1.8, alpx: 1.8, tscx: .95, tscy: 1.06
  });

  // ==================== ACTO VI: SALTO MORTAL DEL DRAGÓN, BLOQUEO DE RODILLAS Y REMATE (6.60 - 8.80s) ====================
  const A_LEAP_START = F(U({
    ix: -.24, tx: -.18, ty: -.28, hx: -.32, hy: .20, by: .4, bz: .8,
    arx: -2.45, arz: .20, sy: .22, alx: -2.15, alz: -.28,
    llx: -1.20, lrx: .52, llz: .14, lrz: -.14, tscy: 1.07
  }, .42), -1);

  const A_SOMERSAULT_1 = P({
    ix: -4.25, tx: .28, ty: -.10, hx: .24, by: 0,
    arx: -1.85, arz: .18, sx: 1.45, sy: .25, alx: -1.95, alz: -.22,
    llx: -1.58, lrx: -1.44, llz: .16, lrz: -.16, tscx: 1.05, tscy: .95
  });

  const A_SOMERSAULT_2 = P({
    ix: -1.85, tx: -.20, ty: .06, hx: -.28, by: .2,
    arx: -2.25, arz: .14, sx: 1.75, sy: .15, alx: -2.15, alz: -.20,
    llx: -1.18, lrx: -.44, llz: .16, lrz: -.16, tscy: 1.07
  });

  // Javi cae presionando la lanza a dos manos a la altura de la cabeza de la víctima (up=-.16)
  const A_DIVE_SLAM = U({
    ix: .18, tx: .14, ty: .16, hx: .14, hy: -.12, by: -2.2, bz: .8,
    arx: -1.68, arz: .10, ary: -.10, sz: .18, spx: .4, spy: .6, spz: 1.2,
    alx: -1.62, alz: -.28, aly: .24,
    llx: -.84, lrx: .70, llz: .18, lrz: -.18,
    arpx: -1.1, arpy: 1.2, arpz: 1.8, ars: 1.12, alpx: 1.1, alpy: 1.0, alpz: 1.8, als: 1.08,
    tscx: 1.06, tscy: .94
  }, -.16, .14);

  const makeDivePress = (side) => U({
    ix: .20 + side * .03, tx: .16, ty: .18 + side * .06, hx: .16, hy: -.14,
    by: -2.6 - Math.abs(side) * .3, bz: 1.0,
    arx: -1.72 + side * .04, arz: .12, sz: side * .20, spx: .4, spy: .6, spz: 1.3,
    alx: -1.66, alz: -.30, aly: .26,
    llx: -.88, lrx: .74, llz: .18, lrz: -.18,
    arpx: -1.2, arpy: 1.2, arpz: 2.0, ars: 1.12, alpx: 1.2, alpy: 1.0, alpz: 2.0,
    tscx: 1.08, tscy: .92
  }, -.18, .14 + side * .04);

  // La víctima cae de rodillas con el torso erguido y ambos brazos alzados frenando el asta sobre su cabeza
  const makeKneelBlock = (side) => P({
    ix: -.08 + side * .03, tx: -.10, ty: side * .08, tz: -side * .05,
    hx: -.36, hy: -side * .06, hz: side * .05,
    by: -4.6 - Math.abs(side) * .3, bz: -.2,
    arx: -2.48 + side * .05, arz: .22, ary: -.18,
    alx: -2.44 - side * .05, alz: -.22, aly: .18,
    llx: -1.14, lrx: 1.08, llz: .20, lrz: -.20,
    arpx: -.9, arpy: 1.4, arpz: 1.0, ars: 1.08,
    alpx: .9, alpy: 1.4, alpz: 1.0, als: 1.08,
    llpx: .7, llpy: -.6, llpz: 1.5, lrpx: -.7, lrpy: -.6, lrpz: -1.6,
    tscx: 1.10, tscy: .90
  });

  // Giro taladro y estocada final horizontal al pecho
  const A_FINAL_COIL = U({
    ix: .10, tx: .08, ty: -.78, hx: -.08, hy: .68, by: -3.4, bz: -1.6,
    arx: -.68, arz: .32, ary: .20, sz: -.20, spx: -.6, spy: .2, spz: -1.2,
    alx: -1.24, alz: -.40, aly: .30,
    llx: -.84, lrx: .68, llz: .18, lrz: -.18,
    tpx: -.8, tpz: -1.4, arpx: -1.8, arpy: .4, arpz: -2.2, alpx: 1.4, alpz: 1.6,
    llpx: .7, llpz: 2.0, lrpx: -.7, lrpz: -2.0, tscx: 1.07, tscy: .93
  }, .04, 0);

  const A_FINAL_SMEAR = U({
    ix: .24, tx: .20, ty: .46, hx: -.18, hy: -.38, by: -2.8, bz: 2.8,
    arx: -1.54, arz: -.06, ary: -.08, sz: 0, spx: 0, spy: .3, spz: 2.6,
    alx: .52, alz: .48,
    llx: -1.14, lrx: .88, llz: .18, lrz: -.18,
    tpx: .8, tpz: 1.6, arpx: -2.2, arpy: .6, arpz: 4.6, ars: 1.28,
    alpx: 1.8, alpz: -2.8, als: 1.10,
    llpx: 1.1, llpz: 3.0, lrpx: -1.1, lrpz: -3.2, lls: 1.14, lrs: 1.08,
    tscx: .90, tscy: 1.12
  }, .04, 0);

  const A_FINAL_HOLD = U({
    ix: .18, tx: .14, ty: .36, hx: -.12, hy: -.28, by: -2.4, bz: 1.6,
    arx: -1.50, arz: -.05, sz: 0, spx: 0, spy: .3, spz: 1.8,
    alx: .38, alz: .42,
    llx: -.94, lrx: .74, llz: .16, lrz: -.16,
    arpx: -1.4, arpy: .5, arpz: 2.8, ars: 1.10, llpz: 2.0, lrpz: -2.0
  }, .06, 0);

  return {
    dur: 8.8,
    trails: [
      [.18, .54], [.96, 1.35], [2.85, 3.35], [3.52, 4.08],
      [4.52, 5.15], [5.40, 6.32], [6.68, 7.35], [7.88, 8.45],
    ],
    // Durante la frenada de lanza (1.06-2.54s), la punta cristalina sobresale junto al hombro de la víctima (d=-.68, side=.26)
    // mientras las dos manos de la víctima sujetan el asta de madera en z=13.5 y z=9.5
    lock: [
      { t0: 1.06, t1: 2.54, d: -.68, side: .26, y: 0, fade: .10 },
    ],
    // Agarres IK sobre el asta de la lanza:
    // - Choque del parry (0.05-0.42s): brazo derecho de la víctima contra el asta (z=15).
    // - Frenada con las manos al pecho (1.06-2.54s): ambas manos de la víctima en z=13.5 y z=9.5 (detrás de la hoja).
    // - Intercambio de guardia (5.44-6.08s): brazos cruzados de la víctima paran la hoja (z=19 y z=15).
    // - Frenada de rodillas sobre la cabeza (7.16-7.86s): ambas manos de la víctima en z=19 y z=14.
    holds: [
      { t0: 0, t1: .46, who: 'att', arm: 'armL', z: 11, fade: .08 },
      { t0: .05, t1: .40, who: 'vic', arm: 'armR', z: 15, fade: .06 },
      { t0: .94, t1: 2.54, who: 'att', arm: 'armL', z: 4.5, fade: .10 },
      { t0: 1.06, t1: 2.54, who: 'vic', arm: 'armL', z: 13.5, fade: .08 },
      { t0: 1.06, t1: 2.54, who: 'vic', arm: 'armR', z: 9.5, fade: .08 },
      { t0: 3.12, t1: 3.54, who: 'att', arm: 'armL', z: 13, fade: .08 },
      { t0: 5.44, t1: 6.08, who: 'vic', arm: 'armL', z: 19, fade: .08 },
      { t0: 5.44, t1: 6.08, who: 'vic', arm: 'armR', z: 15, fade: .08 },
      { t0: 6.72, t1: 7.86, who: 'att', arm: 'armL', z: 11, fade: .10 },
      { t0: 7.16, t1: 7.86, who: 'vic', arm: 'armL', z: 19, fade: .08 },
      { t0: 7.16, t1: 7.86, who: 'vic', arm: 'armR', z: 14, fade: .08 },
    ],
    att: [
      // Acto I: Parry diagonal, absorción, desvío hacia arriba y giro 360° de carga
      [0, A_GUARD_0],
      [.12, A_PARRY_SHOCK],
      [.34, A_DEFLECT_UP],
      [.54, A_SPIN_1],
      [.72, A_SPIN_2],
      [.92, A_COIL_THRUST],
      // Acto II: Estocada horizontal al pecho y avance dando 5 zancadas mientras la víctima frena la lanza
      [1.08, makeDriveStep(0, 1, 1)],
      [1.32, makeDriveStep(1, -1, 0)],
      [1.58, makeDriveStep(2, 1, .3)],
      [1.84, makeDriveStep(3, -1, 0)],
      [2.12, makeDriveStep(4, 1, .4)],
      [2.38, makeDriveStep(5, -1, .2)],
      // Acto III: Desvío, bloqueo de patada, resbalón y backflip aéreo
      [2.64, A_WRENCHED],
      [3.16, A_BLOCK_KICK],
      [3.46, A_SKID_BACK],
      [3.62, A_FLIP_1],
      [3.78, A_FLIP_2],
      [3.94, A_FLIP_3],
      [4.10, A_FLIP_LAND],
      // Acto IV: Barrido bajo de 360°
      [4.42, F(A_COIL_THRUST, -1)],
      [4.66, A_SWEEP_1],
      [4.92, A_SWEEP_2],
      [5.20, A_SWEEP_REC],
      // Acto V: Desvío y ráfaga de 3 cortes de lanza frente a la víctima hasta romper su guardia
      [5.44, A_PARRY_SPIN],
      [5.70, A_COMBO_1],
      [5.98, A_COMBO_2],
      [6.28, A_COMBO_3],
      // Acto VI: Salto mortal hacia adelante, presión sobre la guardia de rodillas y remate final
      [6.66, A_LEAP_START],
      [6.86, A_SOMERSAULT_1],
      [7.04, A_SOMERSAULT_2],
      [7.22, A_DIVE_SLAM],
      [7.44, makeDivePress(1)],
      [7.64, makeDivePress(-1)],
      [7.84, makeDivePress(1)],
      [8.02, A_FINAL_COIL],
      [8.18, A_FINAL_SMEAR],
      [8.42, A_FINAL_HOLD],
      [8.75, 'javiHero'],
    ],
    vic: [
      // Acto I
      [0, V_ATTACK_IN],
      [.12, V_CLASH_PARRY],
      [.36, V_DEFLECTED_1],
      [.66, V_DEFLECTED_2],
      [.94, 'vJReady'],
      // Acto II: Atrapa la lanza a la altura del pecho con ambas manos resbalando hacia atrás
      [1.08, makeBrakeStruggle(0, 1)],
      [1.32, makeBrakeStruggle(1, -1)],
      [1.58, makeBrakeStruggle(2, 1)],
      [1.84, makeBrakeStruggle(3, -1)],
      [2.12, makeBrakeStruggle(4, 1)],
      [2.38, makeBrakeStruggle(5, -1)],
      // Acto III: Desvía la lanza y lanza patada giratoria en salto
      [2.64, V_WRENCH_OUT],
      [2.86, V_KICK_WIND],
      [3.16, V_SPIN_KICK],
      [3.48, V_KICK_LAND],
      // Acto IV: Corre hacia Javi y salta alto por encima del barrido
      [3.78, makeRunPose(1)],
      [4.04, makeRunPose(-1)],
      [4.28, makeRunPose(1)],
      [4.50, makeRunPose(-1)],
      [4.68, V_VAULT_UP],
      [4.92, V_VAULT_APEX],
      [5.18, V_DROP_SMASH],
      // Acto V: Se cubre con ambos brazos cruzados ante el combo hasta que se rompe su guardia
      [5.44, V_DEFLECTED_1],
      [5.70, V_COVER_1],
      [5.98, V_COVER_2],
      [6.28, V_GUARD_BROKEN],
      [6.66, V_DEFLECTED_2],
      [7.04, 'vJReady'],
      // Acto VI: Frena la lanza sobre su cabeza cayendo de rodillas y recibe la estocada final
      [7.22, makeKneelBlock(1)],
      [7.44, makeKneelBlock(-1)],
      [7.64, makeKneelBlock(1)],
      [7.84, makeKneelBlock(-1)],
      [8.04, V_GUARD_BROKEN],
      [8.18, 'vJPierced'],
      [8.42, 'vJLaunch'],
      [8.75, 'vJFloat'],
    ],
    apos: [
      [0, 0, 0, 0, 0],
      [.12, 0, 0, -.20, .05],
      [.34, 0, 0, .06, -.16],
      [.54, -.10, 0, -.05, -1.65],
      [.72, 0, 0, -.15, -3.95],
      [.92, .06, 0, -.22, -TAU],
      // Acto II: Javi avanza empujando en línea recta (x=0)
      [1.08, 0, 0, .42, -TAU],
      [1.45, 0, 0, .98, -TAU],
      [1.85, 0, 0, 1.56, -TAU],
      [2.25, 0, 0, 2.12, -TAU],
      [2.52, 0, 0, 2.42, -TAU],
      [2.85, 0, 0, 2.25, -TAU],
      // Acto III: Bloquea la patada, resbala hacia atrás y ejecuta el backflip aéreo
      [3.16, 0, 0, 2.08, -TAU],
      [3.48, 0, 0, .82, -TAU],
      [3.64, 0, .85, .32, -TAU],
      [3.80, 0, 1.42, -.15, -TAU],
      [3.96, 0, .75, -.52, -TAU],
      [4.10, 0, 0, -.72, -TAU],
      // Acto IV: Barrido bajo de 360° manteniendo distancia limpia respecto al salto de la víctima
      [4.42, 0, 0, -.58, -TAU],
      [4.62, .14, 0, -.32, -TAU - 1.57],
      [4.80, 0, 0, -.22, -TAU - 3.14],
      [4.98, -.14, 0, -.18, -TAU - 4.71],
      [5.18, 0, 0, -.12, -2 * TAU],
      // Acto V: Mira de frente a la víctima durante los 2 primeros cortes y gira 360° rápido en el 3º
      [5.44, -.24, 0, .05, -2 * TAU],
      [5.70, -.08, 0, .48, -2 * TAU],
      [5.98, .08, 0, .88, -2 * TAU],
      [6.12, 0, 0, 1.18, -2 * TAU - 3.14],
      [6.28, 0, 0, 1.45, -3 * TAU],
      // Acto VI: Salto mortal del Dragón cayendo a distancia limpia (z=1.65 vs víctima en z=3.10)
      [6.66, 0, .35, 1.55, -3 * TAU],
      [6.86, 0, 1.85, 1.62, -3 * TAU],
      [7.04, 0, 2.42, 1.65, -3 * TAU],
      [7.22, 0, .45, 1.65, -3 * TAU],
      [7.84, 0, .38, 1.65, -3 * TAU],
      // Retroceso corto para cargar el taladro y estocada relámpago final
      [8.02, 0, 0, 1.05, -3 * TAU],
      [8.18, 0, 0, 2.15, -3 * TAU],
      [8.80, 0, 0, 2.15, -3 * TAU],
    ],
    vpos: [
      [0, 0, 0, 1.42, 0],
      [.12, 0, 0, 1.24, 0],
      [.36, .12, 0, 1.68, -.14],
      [.68, .06, 0, 1.82, -.06],
      [.94, 0, 0, 1.80, 0],
      // Acto II: Sincronizado con `lock` (x=0, retrocediendo de z=2.15 a z=4.15)
      [1.08, 0, 0, 2.15, 0],
      [2.52, 0, 0, 4.15, 0],
      [2.68, -.14, 0, 3.92, .18],
      // Acto III: Giro 360° para la patada circular en salto
      [2.88, -.06, .15, 3.65, 1.85],
      [3.04, 0, .58, 3.38, 3.95],
      [3.16, 0, .44, 3.18, TAU],
      [3.48, 0, 0, 3.28, TAU],
      // Acto IV: Sprint hacia Javi y salto por encima del barrido aterrizando en z=1.55 (sin encimarse con Javi en z=-0.12)
      [3.78, 0, 0, 2.68, TAU],
      [4.04, 0, 0, 1.98, TAU],
      [4.28, 0, 0, 1.38, TAU],
      [4.50, 0, 0, 1.02, TAU],
      [4.68, .10, 1.25, .88, TAU],
      [4.92, 0, 1.65, 1.15, TAU],
      [5.18, -.06, .42, 1.45, TAU],
      [5.44, -.12, 0, 1.68, TAU],
      // Acto V: Retrocede cubriéndose a distancia de lanza (~1.65m de Javi)
      [5.70, 0, 0, 2.12, TAU],
      [5.98, 0, 0, 2.58, TAU],
      [6.28, 0, 0, 3.08, TAU],
      [6.66, 0, 0, 3.10, TAU],
      // Acto VI: Frena la lanza de rodillas en z=3.10 y sale disparada al final
      [7.22, 0, -.18, 3.10, TAU],
      [7.84, 0, -.22, 3.10, TAU],
      [8.04, 0, 0, 3.12, TAU],
      [8.18, 0, .35, 3.35, TAU],
      [8.80, 0, .55, 3.65, TAU],
    ],
    ev: [
      // Acto I
      { t: .10, hit: 2, fx: 'spark', at: 'tip', sfx: 'clang', imp: 1, hs: .08, shake: .55, text: '¡PARRY!', who: 'att' },
      { t: .12, fx: 'ring', at: 'tip', r: 2.6, face: 1 },
      { t: .34, fx: 'arc', tilt: .58, r: 2.1, len: 2.9, dir: -1, col: '#4fc3f7', sfx: 'swing', shake: .25 },
      { t: .54, twirl: [1, .34], sfx: 'draw' },
      { t: .88, fx: 'charge', at: 'att', sfx: 'zap' },

      // Acto II
      { t: 1.08, hit: 3, fx: 'stab', at: 'vic', imp: 1, hs: .09, shake: .65, text: '¡FRENA LA LANZA!', who: 'vic' },
      { t: 1.10, fx: 'ring', at: 'tip', r: 2.8, face: 1 },
      { t: 1.28, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .22 },
      { t: 1.32, fx: 'dust', at: 'vic' },
      { t: 1.52, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .24 },
      { t: 1.58, fx: 'dust', at: 'vic' },
      { t: 1.78, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'zap', shake: .25 },
      { t: 1.84, fx: 'dust', at: 'vic' },
      { t: 2.04, hit: 1.2, fx: 'spark', at: 'tip', sfx: 'clang', shake: .28 },
      { t: 2.12, fx: 'dust', at: 'vic' },
      { t: 2.30, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'clang', shake: .32 },
      { t: 2.38, fx: 'dust', at: 'vic' },

      // Acto III
      { t: 2.62, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35, text: '¡FUERA!', who: 'vic' },
      { t: 2.95, sfx: 'swing' },
      { t: 3.16, fx: 'spark', at: 'att', sfx: 'clang', imp: 1, hs: .07, shake: .55 },
      { t: 3.18, fx: 'ring', at: 'att', r: 2.5, face: 1 },
      { t: 3.30, fx: 'dust', at: 'att' },
      { t: 3.44, fx: 'dust', at: 'att' },
      { t: 3.56, twirl: [1, .45], sfx: 'dash' },
      { t: 4.10, fx: 'dust', at: 'att', sfx: 'heavy', shake: .22 },

      // Acto IV
      { t: 4.62, fx: 'arc', tilt: .06, r: 2.6, len: 3.8, dir: 1, col: '#4fc3f7', sfx: 'swing', shake: .35 },
      { t: 4.68, fx: 'ring', at: 'ground', r: 3.4 },
      { t: 4.72, sfx: 'dash' },
      { t: 4.90, fx: 'arc', tilt: -.06, r: 2.5, len: 3.6, dir: 1, col: '#ffd54f', sfx: 'swing' },

      // Acto V
      { t: 5.44, fx: 'spark', at: 'tip', sfx: 'clang', hs: .05, shake: .4 },
      { t: 5.70, hit: 2, fx: 'arc', tilt: .35, r: 2.2, len: 3.0, dir: 1, col: '#4fc3f7', sfx: 'clang', shake: .3 },
      { t: 5.72, fx: 'dust', at: 'vic' },
      { t: 5.98, hit: 2, fx: 'arc', tilt: -.48, r: 2.2, len: 3.0, dir: -1, col: '#ffd54f', sfx: 'clang', shake: .35 },
      { t: 6.00, fx: 'dust', at: 'vic' },
      { t: 6.10, twirl: [1, .24] },
      { t: 6.28, hit: 4, fx: 'impact', at: 'vic', imp: 1, hs: .09, shake: .65, text: '¡GUARDIA ROTA!', who: 'att' },
      { t: 6.30, fx: 'ring', at: 'vic', r: 3.2, face: 1 },

      // Acto VI
      { t: 6.66, fx: 'dust', at: 'att', sfx: 'dash' },
      { t: 6.86, twirl: [1, .32], fx: 'charge', at: 'att' },
      { t: 7.22, hit: 4, fx: 'boom', at: 'vic', r: 2.8, imp: 1, hs: .11, shake: .85 },
      { t: 7.24, fx: 'crack', at: 'ground', r: 4.5 },
      { t: 7.25, fx: 'ring', at: 'ground', r: 4.2 },
      { t: 7.44, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'zap', shake: .3 },
      { t: 7.64, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35 },
      { t: 7.86, twirl: [2, .16], fx: 'charge', at: 'att', text: '¡LANZA DEL DRAGÓN!', who: 'att', slow: .24 },
      { t: 8.18, fx: 'stab', at: 'vic', imp: 1, hs: .18, shake: 1.1 },
      { t: 8.19, fx: 'boom', at: 'vic', big: 1, r: 4.4 },
      { t: 8.20, fx: 'ring', at: 'vic', r: 3.8, face: 1 },
      { t: 8.21, fx: 'crack', at: 'ground', r: 5.5 },
      { t: 8.22, rel: { dmg: 18, kb: 28, up: 9, rag: 2.5 }, slow: .28 },
    ],
    // Planos del lado despejado (s: 1) dirigidos para encuadrar de cerca cada choque sin recortar cabezas ni alejarse al cielo
    shots: [
      [0, 'cl', { s: 1, d: 3.1, fov: 44, roll: -.05 }],
      [.34, 'two', { s: 1, fov: 48, roll: .04 }],
      [.92, 'faceA', { s: 1, fov: 40, roll: -.04 }],
      [1.08, 'cl', { s: 1, d: 3.2, fov: 44, roll: .05 }],
      [1.75, 'rig', { s: 1, at: 'mid', a0: 76, a1: 104, r0: 3.1, r1: 2.9, h0: .16, h1: .22, fov0: 42, fov1: 45, roll0: -4, roll1: 4, ease: 'io' }],
      [2.62, 'two', { s: 1, fov: 48, roll: -.05 }],
      [3.16, 'cl', { s: 1, d: 3.4, fov: 48, roll: .06 }],
      [3.54, 'two', { s: 1, d: 4.4, fov: 50, roll: -.04 }],
      [4.45, 'two', { s: 1, fov: 52, roll: -.04 }],
      [5.40, 'cl', { s: 1, d: 3.4, fov: 46, roll: .05 }],
      [6.15, 'cl', { s: 1, d: 3.3, fov: 46, roll: -.06 }],
      [6.66, 'two', { s: 1, d: 4.5, fov: 52 }],
      [7.18, 'cl', { s: 1, d: 3.8, fov: 50, roll: .05 }],
      [7.86, 'faceA', { s: 1, fov: 38, roll: -.05 }],
      [8.16, 'clv', { s: 1, d: 3.6, fov: 48, roll: .08 }],
      [8.45, 'hero', { s: 1 }],
    ],
  };
});
