/* Coreografía (cinemática) · personaje: javi · habilidad: Parry del Dragón · id: javiParry
   Duelo de lanza continuo estilo anime (sin pausas estáticas "pose con pose"):
   1) Choque del Parry (brazo de la víctima contra la lanza diagonal de Javi) y desvío.
   2) Giro 360° + estocada al pecho; la víctima atrapa e intenta frenar la lanza con ambas manos
      mientras Javi avanza dando zancadas y la víctima resbala hacia atrás entre chispas y polvo.
   3) Desvío al límite, patada giratoria de la víctima, bloqueo deslizante de Javi y voltereta atrás (backflip).
   4) Sprint de la víctima, barrido bajo de 360° a ras del suelo y salto acrobático por encima de la lanza.
   5) Intercambio veloz de cortes, rotación evasiva y ráfaga que obliga a la víctima a cubrirse hasta romper su guardia.
   6) Salto mortal del Dragón cayendo desde el aire; la víctima frena la lanza sobre su cabeza cayendo de rodillas
      mientras el suelo se agrieta, Javi gira la lanza como taladro y conecta la estocada final explosiva. */
CF.coreografia('javiParry', function () {
  const TAU = Math.PI * 2;
  // Base limpia para que ningún canal quede sin inicializar al interpolar
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
  // arx + sx = 0 apunta la lanza recto al frente (+Z); up > 0 la inclina hacia arriba (+Y)
  const U = (o, up = 0) => { const r = P(o); r.sx = -r.arx - up; return r; };
  // Mantiene la continuidad de ix tras una voltereta completa (-TAU)
  const F = (o, turns = -1) => Object.assign({}, o, { ix: (o.ix || 0) + turns * TAU });

  // ==================== ACTO I: CHOQUE DEL PARRY Y DESVÍO (0.00 - 0.95s) ====================
  // Javi en la pose de guardia diagonal (Blockbench) recibiendo el golpe del brazo de la víctima
  const A_GUARD_0 = U({
    ix: .13, tx: .11, ty: .26, tz: .04, hx: -.08, hy: -.24, by: -3.3, bz: .5,
    arx: -.84, arz: .16, ary: -.20, sy: 1.04, sz: .28, spx: 1.0, spy: .5, spz: 1.5,
    alx: -1.28, alz: -.42, aly: .34,
    llx: -.66, lrx: .56, llz: .15, lrz: -.15,
    tpx: .3, tpz: .5, arpx: -.7, arpy: -.4, arpz: 1.4, alpx: .9, alpy: -.1, alpz: 1.7,
    llpx: .5, llpz: 1.5, lrpx: -.5, lrpz: -1.5, tscx: 1.03, tscy: .97
  }, .46);

  // Impacto: el brazo de la víctima choca contra el asta; Javi absorbe el golpe flexionando más las piernas
  const A_PARRY_SHOCK = U({
    ix: .20, tx: .18, ty: .38, tz: .08, hx: -.14, hy: -.34, by: -4.6, bz: -.6,
    arx: -.98, arz: .22, ary: -.28, sy: 1.12, sz: .38, spx: 1.2, spy: .7, spz: 1.8,
    alx: -1.42, alz: -.52, aly: .42,
    llx: -.86, lrx: .72, llz: .18, lrz: -.18,
    tpx: .6, tpz: -.5, arpx: -1.1, arpy: -.5, arpz: 1.8, alpx: 1.2, alpy: -.2, alpz: 2.1,
    llpx: .7, llpz: 2.0, lrpx: -.7, lrpz: -2.0, tscx: 1.10, tscy: .90
  }, .54);

  // Javi empuja y desvía el brazo de la víctima hacia arriba y a la derecha con un tajo diagonal
  const A_DEFLECT_UP = U({
    ix: -.08, tx: -.12, ty: -.56, tz: -.10, hx: .08, hy: .48, by: -1.8, bz: 1.2,
    arx: -1.92, arz: .58, ary: .32, sy: -.62, sz: -.45, spx: -.6, spy: 1.2, spz: 2.2,
    alx: -1.75, alz: -.18, aly: .24,
    llx: -.52, lrx: .64, llz: .16, lrz: -.16,
    tpx: -.7, tpy: .5, tpz: 1.1, arpx: -1.8, arpy: 1.4, arpz: 2.6, ars: 1.15,
    alpx: 1.4, alpy: 1.1, alpz: 1.8, als: 1.08, tscx: .96, tscy: 1.07
  }, .82);

  // Giro de 360° preparando la estocada (pasos intermedios para rotación fluida)
  const A_SPIN_1 = U({
    ix: .16, tx: .14, ty: -.78, tz: -.14, hx: -.10, hy: .62, by: -3.1, bz: .4,
    arx: -1.25, arz: .75, ary: .42, sy: -.85, sz: -.30,
    alx: -.65, alz: .62, aly: -.22,
    llx: .45, lrx: -.68, llz: .18, lrz: -.18,
    llpz: -1.6, lrpz: 1.8, tscx: 1.04, tscy: .96
  }, .25);

  const A_SPIN_2 = U({
    ix: .22, tx: .18, ty: -.42, tz: .12, hx: -.14, hy: .28, by: -3.6, bz: -.4,
    arx: -.78, arz: .42, ary: .18, sy: -.25, sz: .15,
    alx: -1.15, alz: -.32, aly: .28,
    llx: -.72, lrx: .54, llz: .16, lrz: -.16,
    llpz: 1.7, lrpz: -1.5, tscx: 1.06, tscy: .94
  }, .12);

  // Carga la lanza en la cadera derecha antes de lanzar la estocada
  const A_COIL_THRUST = U({
    ix: .24, tx: .20, ty: -.88, tz: -.08, hx: -.16, hy: .76, by: -4.2, bz: -1.6,
    arx: -.64, arz: .38, ary: .26, sy: -.12, sz: -.18, spx: -.8, spy: -.4, spz: -1.4,
    alx: -1.32, alz: -.46, aly: .38,
    llx: -.92, lrx: .74, llz: .20, lrz: -.20,
    tpx: -.9, tpz: -1.4, arpx: -1.9, arpy: -.4, arpz: -2.4, alpx: 1.4, alpz: 1.8,
    llpx: .8, llpz: 2.2, lrpx: -.8, lrpz: -2.2, tscx: 1.09, tscy: .91
  }, .04);

  // Víctima en Acto I: lanza un puñetazo derecho, choca contra la lanza de Javi y sale desviada
  const V_ATTACK_IN = P({
    ix: .24, tx: .22, ty: .72, hx: -.12, hy: -.52, by: -2.2, bz: 1.8,
    arx: -1.58, arz: -.18, ary: -.22, alx: -.62, alz: -.42,
    llx: -.78, lrx: .64, llz: .14, lrz: -.14,
    arpx: -1.4, arpy: .4, arpz: 3.2, ars: 1.14, llpz: 1.8, lrpz: -1.6
  });

  const V_CLASH_PARRY = P({
    ix: .16, tx: .18, ty: .48, tz: -.08, hx: .14, hy: -.32, by: -2.8, bz: .6,
    arx: -1.46, arz: .12, ary: -.14, alx: -.88, alz: .38,
    llx: -.64, lrx: .52, llz: .16, lrz: -.16,
    arpx: -1.1, arpy: .5, arpz: 2.4, tscx: 1.07, tscy: .93
  });

  const V_DEFLECTED_1 = P({
    ix: -.28, tx: -.26, ty: -.64, tz: .18, hx: -.38, hy: .54, hz: .16, by: -1.2, bz: -1.2,
    arx: -2.35, arz: -.88, ary: .35, alx: -.45, alz: .78,
    llx: .32, lrx: -.54, llz: .20, lrz: -.16,
    tpx: .8, tpz: -1.1, arpx: -2.2, arpy: 1.4, arpz: -.8, llpz: -1.2, lrpz: 1.4, tscx: .95, tscy: 1.07
  });

  const V_DEFLECTED_2 = P({
    ix: -.12, tx: -.10, ty: -.28, tz: .08, hx: -.14, hy: .24, by: -2.1, bz: -.5,
    arx: -1.25, arz: -.52, alx: -.92, alz: .44,
    llx: -.46, lrx: .38, llz: .16, lrz: -.16,
    llpz: 1.1, lrpz: -1.1
  });

  // ==================== ACTO II: ESTOCADA Y FRENADA CON LAS MANOS (0.95 - 2.65s) ====================
  // Helper para generar las zancadas de empuje de Javi mientras clava/empuja la lanza
  const makeDriveStep = (step, side, smear = 0) => U({
    ix: .32 + smear * .06, tx: .26, ty: .48 + side * .12, tz: side * .06,
    hx: -.20, hy: -.38 - side * .08, by: -3.4 - Math.abs(side) * .6, bz: 2.4 + smear * 1.4,
    arx: -1.56, arz: -.06, ary: -.08, sy: -.04, sz: step * .35, spx: 0, spy: .2, spz: 2.6 + smear * 1.2,
    alx: -1.48, alz: -.28, aly: .22,
    // Las piernas dan zancadas alternas reales mientras avanza empujando
    llx: side > 0 ? -.98 : .64, lrx: side > 0 ? .76 : -.92, llz: .16, lrz: -.16,
    tpx: .6, tpz: 1.4, arpx: -1.8, arpy: .5, arpz: 4.2 + smear * 2.0, ars: 1.14 + smear * .18,
    alpx: 1.2, alpy: .4, alpz: 2.4, als: 1.06,
    llpx: .7, llpz: side > 0 ? 2.4 : -2.0, lrpx: -.7, lrpz: side > 0 ? -2.2 : 2.2,
    tscx: .95, tscy: 1.07
  }, .03);

  // Helper para la víctima frenando la lanza con ambas manos mientras resbala hacia atrás
  const makeBrakeStruggle = (step, side) => P({
    ix: .26 + side * .05, tx: .34 + Math.abs(side) * .06, ty: side * .14, tz: -side * .08,
    hx: .28 - side * .06, hy: -side * .12, hz: side * .08,
    by: -3.2 - (step % 2) * .7, bz: -1.2,
    // Ambos brazos tensos al frente agarrando el asta (reforzado con IK holds)
    arx: -1.52 + side * .08, arz: .22, ary: -.24,
    alx: -1.48 - side * .08, alz: -.22, aly: .24,
    // Las piernas se afirman y retroceden intentando frenar el empuje en el suelo
    llx: side > 0 ? -.84 : .48, lrx: side > 0 ? .54 : -.82, llz: .20, lrz: -.20,
    tpy: -.4, tpz: -.8, hpy: .4, hpz: .8,
    arpx: -1.2, arpy: .4, arpz: 1.8, ars: 1.08,
    alpx: 1.2, alpy: .5, alpz: 2.0, als: 1.08,
    llpx: .8, llpz: side > 0 ? 2.1 : -1.6, lrpx: -.8, lrpz: side > 0 ? -1.7 : 2.0,
    tscx: 1.08, tscy: .92
  });

  // ==================== ACTO III: DESVÍO, PATADA, RESBALÓN Y BACKFLIP (2.65 - 4.10s) ====================
  // La víctima logra desviar la punta de la lanza hacia un lado con un grito de esfuerzo
  const A_WRENCHED = U({
    ix: .14, tx: .12, ty: -.52, tz: -.14, hx: .08, hy: .38, by: -2.4, bz: .4,
    arx: -1.32, arz: .64, ary: .28, sy: -.78, sz: -.35,
    alx: -.82, alz: .48, aly: -.16,
    llx: -.54, lrx: .48, llz: .16, lrz: -.16
  }, .28);

  const V_WRENCH_OUT = P({
    ix: .12, tx: .16, ty: .76, tz: .12, hx: -.14, hy: -.52, by: -2.4, bz: 1.2,
    arx: -1.42, arz: -.68, ary: -.34, alx: -1.28, alz: -.74, aly: -.28,
    llx: -.68, lrx: .56, llz: .18, lrz: -.18,
    arpx: -1.6, arpz: 2.2, alpx: 1.6, alpz: 2.0, tscx: 1.05, tscy: .95
  });

  // La víctima gira y lanza una patada circular alta; Javi cruza la lanza y resbala hacia atrás
  const V_KICK_WIND = P({
    ix: -.14, tx: -.12, ty: -.68, hx: -.08, hy: .54, by: -1.6,
    arx: -.65, arz: .48, alx: -1.15, alz: -.38,
    llx: -.42, lrx: .64, llz: .14, lrz: -.14
  });

  const V_SPIN_KICK = P({
    ix: -.36, iz: .24, tx: -.22, ty: -.74, hx: -.18, hy: .62, by: .8, bz: 1.4,
    arx: .52, arz: -.68, alx: -1.18, alz: .54,
    llx: .34, lrx: -2.08, lrz: .32, llz: .16,
    lrpx: -.8, lrpy: 1.2, lrpz: 2.6, lrs: 1.18, tscx: .95, tscy: 1.07
  });

  const V_KICK_LAND = P({
    ix: .18, tx: .16, ty: .28, hx: -.08, hy: -.22, by: -2.6, bz: .4,
    arx: -.88, arz: .34, alx: -1.04, alz: -.32,
    llx: -.64, lrx: .52, llz: .16, lrz: -.16
  });

  // Javi bloquea la patada cruzando la lanza y resbala hacia atrás flexionando piernas
  const A_BLOCK_KICK = U({
    ix: .22, tx: .20, ty: .18, tz: .08, hx: .12, hy: -.16, by: -3.8, bz: -.8,
    arx: -1.48, arz: .32, ary: -.28, sy: 1.18, sz: .42, spx: 1.2, spy: .8, spz: 1.8,
    alx: -1.52, alz: -.44, aly: .36,
    llx: -.82, lrx: .68, llz: .18, lrz: -.18,
    tpx: .4, tpz: -.8, arpx: -.9, arpy: .6, arpz: 1.8, alpx: 1.1, alpy: .5, alpz: 2.0,
    llpx: .6, llpz: 1.9, lrpx: -.6, lrpz: -1.9, tscx: 1.09, tscy: .91
  }, .48);

  const A_SKID_BACK = U({
    ix: .32, tx: .28, ty: -.24, tz: -.06, hx: -.18, hy: .22, by: -4.8, bz: -1.2,
    arx: -1.12, arz: .44, ary: -.18, sy: .86, sz: .24, spx: .8, spy: .4, spz: 1.4,
    alx: -1.24, alz: -.36, aly: .28,
    llx: -1.04, lrx: .84, llz: .22, lrz: -.22,
    llpx: .8, llpz: 2.4, lrpx: -.8, lrpz: -2.4, tscx: 1.12, tscy: .88
  }, .32);

  // Voltereta acrobática hacia atrás (Backflip continuo en 4 fases: ix de 0 a -TAU)
  const A_FLIP_1 = U({
    ix: -1.45, tx: -.28, ty: -.12, hx: -.42, by: 0,
    arx: -2.25, arz: .32, sy: .45, alx: -2.10, alz: -.32,
    llx: -1.35, lrx: -.45, llz: .14, lrz: -.14, tscy: 1.08
  }, .35);

  const A_FLIP_2 = U({
    ix: -3.14, tx: -.36, ty: 0, hx: -.48, by: 0,
    arx: -2.45, arz: .24, sy: .20, alx: -2.35, alz: -.24,
    llx: -1.75, lrx: -1.65, llz: .16, lrz: -.16, tscx: 1.06, tscy: .94
  }, .20);

  const A_FLIP_3 = U({
    ix: -4.75, tx: -.18, ty: .12, hx: -.24, by: -.8,
    arx: -1.65, arz: .28, sy: .55, alx: -1.55, alz: -.28,
    llx: -.95, lrx: .35, llz: .16, lrz: -.16
  }, .25);

  const A_FLIP_LAND = F(U({
    ix: .36, tx: .32, ty: -.48, hx: -.24, hy: .42, by: -5.2, bz: .6,
    arx: -.78, arz: .52, ary: .22, sy: -.55, sz: -.22,
    alx: -.92, alz: .44,
    llx: -1.12, lrx: .88, llz: .22, lrz: -.22,
    llpx: .8, llpz: 2.4, lrpx: -.8, lrpz: -2.4, tscx: 1.12, tscy: .88
  }, .12), -1);

  // ==================== ACTO IV: SPRINT, BARRIDO 360° Y SALTO ACROBÁTICO (4.10 - 5.45s) ====================
  // La víctima corre hacia Javi dando zancadas reales
  const makeRunPose = (side) => P({
    ix: .46, tx: .22, ty: side * .34, tz: -side * .08, hx: -.32, hy: -side * .24,
    by: -1.8, bz: 1.4,
    arx: side > 0 ? .88 : -1.35, arz: .24,
    alx: side > 0 ? -1.35 : .88, alz: -.24,
    llx: side > 0 ? -1.12 : .86, lrx: side > 0 ? .86 : -1.12, llz: .12, lrz: -.12,
    llpz: side > 0 ? 2.4 : -2.2, lrpz: side > 0 ? -2.2 : 2.4, tscx: .96, tscy: 1.05
  });

  // Javi gira a ras del suelo en un barrido de 360° con la lanza extendida
  const A_SWEEP_1 = F(U({
    ix: .44, iz: -.24, tx: .36, ty: .92, hx: -.28, hy: -.68, by: -5.8, bz: 1.4,
    arx: -1.48, arz: -.78, ary: -.42, sy: .85, sz: 1.15, spx: 1.6, spy: -.4, spz: 2.8,
    alx: .42, alz: .74,
    llx: -1.18, lrx: .92, llz: .26, lrz: -.22,
    arpx: -2.4, arpz: 3.4, ars: 1.24, tscx: .92, tscy: 1.10
  }, -.12), -1);

  const A_SWEEP_2 = F(U({
    ix: .38, iz: .22, tx: .30, ty: 1.12, hx: -.22, hy: -.82, by: -5.4, bz: 1.0,
    arx: -1.52, arz: -.92, ary: -.54, sy: 1.10, sz: 1.35, spx: 1.8, spy: -.2, spz: 2.6,
    alx: .58, alz: .82,
    llx: .78, lrx: -1.08, llz: .24, lrz: -.24,
    arpx: -2.6, arpz: 3.2, ars: 1.22, tscx: .94, tscy: 1.08
  }, -.08), -1);

  const A_SWEEP_REC = F(U({
    ix: .18, tx: .16, ty: .38, hx: -.10, hy: -.28, by: -3.0, bz: .5,
    arx: -1.12, arz: -.24, sy: .35, sz: .25,
    alx: -.86, alz: -.32,
    llx: -.68, lrx: .58, llz: .16, lrz: -.16
  }, .22), -1);

  // La víctima salta por encima del barrido recogiendo las piernas y girando en el aire
  const V_VAULT_UP = P({
    ix: -.42, iz: .28, tx: -.18, ty: -.48, hx: .22, hy: .36, by: .4,
    arx: -2.15, arz: .62, alx: -1.95, alz: -.62,
    llx: -1.58, lrx: -1.32, llz: .18, lrz: -.18,
    llpy: 1.2, lrpy: 1.0, tscx: .96, tscy: 1.06
  });

  const V_VAULT_APEX = P({
    ix: .54, iz: -.32, tx: .28, ty: .52, hx: .34, hy: -.38, by: -.6,
    arx: -2.45, arz: .38, alx: -2.25, alz: -.38,
    llx: -1.72, lrx: -1.54, llz: .20, lrz: -.20,
    llpy: 1.4, lrpy: 1.4, tscx: 1.05, tscy: .95
  });

  const V_DROP_SMASH = P({
    ix: .48, tx: .42, ty: .64, hx: .24, hy: -.44, by: -2.4, bz: 1.8,
    arx: -1.68, arz: -.22, alx: -.75, alz: .48,
    llx: -.92, lrx: .74, llz: .16, lrz: -.16,
    arpx: -1.6, arpy: -.4, arpz: 3.2, ars: 1.18
  });

  // ==================== ACTO V: ROTACIÓN EVASIVA Y RÁFAGA CONTRA GUARDIA (5.45 - 6.65s) ====================
  // Javi desvía el golpe descendente rotando sobre su eje y encadena 3 cortes veloces
  const A_PARRY_SPIN = F(U({
    ix: .12, iz: -.28, tx: .10, ty: -.68, hx: -.08, hy: .54, by: -2.6, bz: .6,
    arx: -1.78, arz: .54, ary: .28, sy: -.72, sz: -.42, spx: -.8, spy: 1.0, spz: 2.0,
    alx: -1.42, alz: -.34,
    llx: -.74, lrx: .62, llz: .18, lrz: -.18, ars: 1.14
  }, .64), -1);

  const A_COMBO_1 = F(U({
    ix: .26, tx: .22, ty: .86, hx: -.14, hy: -.64, by: -3.2, bz: 1.8,
    arx: -1.54, arz: -.58, ary: -.38, sy: .74, sz: .82, spx: 1.4, spy: .4, spz: 2.6,
    alx: .34, alz: .58,
    llx: -.92, lrx: .74, llz: .18, lrz: -.18,
    arpx: -2.2, arpz: 3.4, ars: 1.20
  }, .18), -1);

  const A_COMBO_2 = F(U({
    ix: -.12, tx: -.14, ty: -.74, hx: -.22, hy: .58, by: -1.8, bz: 1.4,
    arx: -2.18, arz: .62, ary: .34, sy: -.68, sz: -.54, spx: -1.2, spy: 1.2, spz: 2.4,
    alx: -1.68, alz: -.28,
    llx: .62, lrx: -.84, llz: .18, lrz: -.18,
    arpx: -1.8, arpy: 1.2, arpz: 2.8, ars: 1.18
  }, .72), -1);

  const A_COMBO_3 = F(U({
    ix: .32, tx: .28, ty: 1.04, hx: -.18, hy: -.78, by: -3.8, bz: 2.4,
    arx: -1.62, arz: -.74, ary: -.48, sy: .92, sz: 1.08, spx: 1.8, spy: .2, spz: 3.0,
    alx: .48, alz: .68,
    llx: -1.06, lrx: .86, llz: .20, lrz: -.20,
    arpx: -2.6, arpz: 4.0, ars: 1.26, tscx: .93, tscy: 1.09
  }, .08), -1);

  // La víctima se cubre cruzando ambos brazos mientras resbala hacia atrás por los impactos
  const V_COVER_1 = P({
    ix: .18, tx: .22, ty: -.16, tz: .08, hx: .28, hy: .14, by: -2.8, bz: -.8,
    arx: -1.52, arz: .88, ary: -.34, alx: -1.48, alz: -.88, aly: .34,
    llx: -.68, lrx: .54, llz: .18, lrz: -.18,
    arpx: -.8, arpy: .6, arpz: 1.8, alpx: .8, alpy: .6, alpz: 1.8,
    llpz: 1.6, lrpz: -1.6, tscx: 1.06, tscy: .94
  });

  const V_COVER_2 = P({
    ix: .24, tx: .28, ty: .18, tz: -.08, hx: .32, hy: -.16, by: -3.4, bz: -1.2,
    arx: -1.58, arz: .92, ary: -.38, alx: -1.54, alz: -.92, aly: .38,
    llx: .52, lrx: -.74, llz: .20, lrz: -.20,
    arpx: -.9, arpy: .7, arpz: 1.9, alpx: .9, alpy: .7, alpz: 1.9,
    llpz: -1.6, lrpz: 1.8, tscx: 1.08, tscy: .92
  });

  const V_GUARD_BROKEN = P({
    ix: -.34, tx: -.32, ty: .28, tz: -.14, hx: -.48, hy: -.24, by: -1.8, bz: -1.4,
    arx: -.68, arz: -1.28, alx: -.62, alz: 1.28,
    llx: -.52, lrx: .64, llz: .22, lrz: -.22,
    arpx: -2.2, alpx: 2.2, tscx: .95, tscy: 1.07
  });

  // ==================== ACTO VI: SALTO MORTAL DEL DRAGÓN, BLOQUEO DE RODILLAS Y REMATE (6.65 - 8.80s) ====================
  // Javi salta alto dando un giro mortal hacia adelante (ix pasa de -TAU a 0 suavemente)
  const A_LEAP_START = F(U({
    ix: -.28, tx: -.22, ty: -.34, hx: -.38, hy: .24, by: .4, bz: 1.2,
    arx: -2.65, arz: .22, sy: .25, alx: -2.25, alz: -.32,
    llx: -1.28, lrx: .58, llz: .14, lrz: -.14, tscy: 1.08
  }, .45), -1);

  const A_SOMERSAULT_1 = U({
    ix: -4.25, tx: .34, ty: -.12, hx: .28, by: 0,
    arx: -2.45, arz: .18, sy: .12, alx: -2.35, alz: -.24,
    llx: -1.68, lrx: -1.52, llz: .16, lrz: -.16, tscx: 1.06, tscy: .94
  }, .22);

  const A_SOMERSAULT_2 = U({
    ix: -1.85, tx: -.24, ty: .08, hx: -.32, by: .2,
    arx: -2.85, arz: .14, sy: 0, alx: -2.65, alz: -.22,
    llx: -1.24, lrx: -.48, llz: .16, lrz: -.16, tscy: 1.08
  }, .38);

  // Javi cae en picado empuñando la lanza a dos manos hacia abajo
  const A_DIVE_SLAM = U({
    ix: .46, tx: .38, ty: .18, hx: .18, hy: -.14, by: -3.2, bz: 1.8,
    arx: -1.34, arz: .08, ary: -.12, sy: .18, sz: .22, spx: .6, spy: -.4, spz: 2.4,
    alx: -1.58, alz: -.32, aly: .28,
    llx: -.92, lrx: .78, llz: .18, lrz: -.18,
    arpx: -1.6, arpy: -.4, arpz: 3.2, ars: 1.18, alpx: 1.4, alpy: -.3, alpz: 2.6, als: 1.10,
    tscx: 1.08, tscy: .92
  }, -.56);

  // Javi presiona la lanza desde arriba con vibración de fuerza
  const makeDivePress = (side) => U({
    ix: .50 + side * .04, tx: .42, ty: .22 + side * .08, hx: .22, hy: -.18,
    by: -4.0 - Math.abs(side) * .4, bz: 2.0,
    arx: -1.38 + side * .05, arz: .10, sy: .16, sz: side * .25, spx: .6, spy: -.5, spz: 2.6,
    alx: -1.62, alz: -.34, aly: .30,
    llx: -.98, lrx: .82, llz: .20, lrz: -.20,
    arpx: -1.8, arpy: -.5, arpz: 3.4, ars: 1.16, alpx: 1.5, alpy: -.4, alpz: 2.8,
    tscx: 1.10, tscy: .90
  }, -.58);

  // La víctima frena la lanza sobre su cabeza con ambas manos cayendo de rodillas
  const makeKneelBlock = (side) => P({
    ix: -.18 + side * .04, tx: -.22, ty: side * .10, tz: -side * .06,
    hx: -.44, hy: -side * .08, hz: side * .06,
    by: -5.4 - Math.abs(side) * .4, bz: -.4,
    arx: -2.58 + side * .06, arz: .24, ary: -.20,
    alx: -2.54 - side * .06, alz: -.24, aly: .20,
    llx: -1.18, lrx: 1.12, llz: .22, lrz: -.22,
    arpx: -1.2, arpy: 1.6, arpz: 1.2, ars: 1.10,
    alpx: 1.2, alpy: 1.6, alpz: 1.2, als: 1.10,
    llpx: .8, llpy: -.8, llpz: 1.6, lrpx: -.8, lrpy: -.8, lrpz: -1.8,
    tscx: 1.12, tscy: .88
  });

  // Javi salta atrás un instante, gira la lanza como taladro y lanza la estocada final explosiva
  const A_FINAL_COIL = U({
    ix: -.14, tx: -.12, ty: -.92, hx: -.08, hy: .78, by: -3.8, bz: -2.2,
    arx: -.68, arz: .36, ary: .24, sy: -.18, sz: -.24, spx: -.8, spy: -.4, spz: -1.8,
    alx: -1.28, alz: -.44, aly: .34,
    llx: -.88, lrx: .72, llz: .20, lrz: -.20,
    tpx: -1.0, tpz: -1.8, arpx: -2.2, arpy: .4, arpz: -2.8, alpx: 1.6, alpz: 1.8,
    llpx: .8, llpz: 2.2, lrpx: -.8, lrpz: -2.2, tscx: 1.08, tscy: .92
  }, .04);

  const A_FINAL_SMEAR = U({
    ix: .38, tx: .32, ty: .58, hx: -.24, hy: -.48, by: -3.2, bz: 4.4,
    arx: -1.58, arz: -.08, ary: -.12, sy: 0, sz: 0, spx: 0, spy: .2, spz: 4.2,
    alx: .58, alz: .54,
    llx: -1.24, lrx: .94, llz: .18, lrz: -.18,
    tpx: 1.0, tpz: 2.2, arpx: -3.0, arpy: .7, arpz: 6.8, ars: 1.36,
    alpx: 2.2, alpz: -3.6, als: 1.12,
    llpx: 1.4, llpz: 3.6, lrpx: -1.4, lrpz: -3.8, lls: 1.18, lrs: 1.10,
    tscx: .88, tscy: 1.16
  }, .02);

  const A_FINAL_HOLD = U({
    ix: .24, tx: .20, ty: .44, hx: -.14, hy: -.36, by: -2.8, bz: 2.4,
    arx: -1.54, arz: -.06, sy: 0, sz: 0, spx: 0, spy: .2, spz: 2.6,
    alx: .42, alz: .46,
    llx: -1.02, lrx: .78, llz: .16, lrz: -.16,
    arpx: -1.8, arpy: .5, arpz: 3.8, ars: 1.12, llpz: 2.4, lrpz: -2.4
  }, .04);

  return {
    dur: 8.8,
    trails: [
      [.18, .54], [.96, 1.35], [2.85, 3.35], [3.52, 4.08],
      [4.52, 5.15], [5.45, 6.25], [6.68, 7.35], [7.88, 8.45],
    ],
    // Durante el forcejeo (1.10-2.55s), la víctima queda anclada frente a la punta de la lanza mientras la frena con las manos
    lock: [
      { t0: 1.10, t1: 2.55, d: -.28, side: 0, y: 0, fade: .12 },
    ],
    // Agarres IK sobre el asta de la lanza (z en píxeles desde la mano derecha; punta en z=26):
    // - Javi sujeta con armL en la guardia inicial, estocada, bloqueo, salto mortal y presión.
    // - La víctima choca su brazo derecho en el parry (0.05-0.42s), frena la lanza con AMBAS MANOS en el pecho (1.08-2.56s)
    //   y vuelve a frenarla con AMBAS MANOS sobre su cabeza al caer de rodillas (7.18-7.86s).
    holds: [
      { t0: 0, t1: .46, who: 'att', arm: 'armL', z: 11, fade: .08 },
      { t0: .05, t1: .42, who: 'vic', arm: 'armR', z: 15, fade: .06 },
      { t0: .94, t1: 2.56, who: 'att', arm: 'armL', z: 10, fade: .10 },
      { t0: 1.08, t1: 2.56, who: 'vic', arm: 'armL', z: 20, fade: .08 },
      { t0: 1.08, t1: 2.56, who: 'vic', arm: 'armR', z: 15, fade: .08 },
      { t0: 3.12, t1: 3.56, who: 'att', arm: 'armL', z: 13, fade: .08 },
      { t0: 6.72, t1: 7.86, who: 'att', arm: 'armL', z: 11, fade: .10 },
      { t0: 7.18, t1: 7.86, who: 'vic', arm: 'armL', z: 19, fade: .08 },
      { t0: 7.18, t1: 7.86, who: 'vic', arm: 'armR', z: 14, fade: .08 },
    ],
    att: [
      // Acto I: Parry diagonal, absorción, desvío hacia arriba y giro 360° de carga
      [0, A_GUARD_0],
      [.12, A_PARRY_SHOCK],
      [.34, A_DEFLECT_UP],
      [.54, A_SPIN_1],
      [.72, A_SPIN_2],
      [.92, A_COIL_THRUST],
      // Acto II: Estocada y avance continuo dando 5 zancadas mientras la víctima frena la lanza
      [1.08, makeDriveStep(0, 1, 1)],
      [1.32, makeDriveStep(1, -1, 0)],
      [1.58, makeDriveStep(2, 1, .3)],
      [1.84, makeDriveStep(3, -1, 0)],
      [2.12, makeDriveStep(4, 1, .4)],
      [2.38, makeDriveStep(5, -1, .2)],
      // Acto III: La víctima desvía la lanza; Javi bloquea la patada, resbala y hace un backflip
      [2.64, A_WRENCHED],
      [3.16, A_BLOCK_KICK],
      [3.46, A_SKID_BACK],
      [3.62, A_FLIP_1],
      [3.78, A_FLIP_2],
      [3.94, A_FLIP_3],
      [4.10, A_FLIP_LAND],
      // Acto IV: Barrido bajo de 360° a ras del suelo
      [4.42, F(A_COIL_THRUST, -1)],
      [4.66, A_SWEEP_1],
      [4.92, A_SWEEP_2],
      [5.20, A_SWEEP_REC],
      // Acto V: Rotación evasiva y combo de 3 cortes que rompen la guardia
      [5.46, A_PARRY_SPIN],
      [5.72, A_COMBO_1],
      [5.98, A_COMBO_2],
      [6.26, A_COMBO_3],
      // Acto VI: Salto mortal hacia adelante, caída en picado sobre la guardia de la víctima y estocada final
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
      // Acto I: Puñetazo choca contra la lanza de Javi y sale desviado
      [0, V_ATTACK_IN],
      [.12, V_CLASH_PARRY],
      [.36, V_DEFLECTED_1],
      [.66, V_DEFLECTED_2],
      [.94, 'vJReady'],
      // Acto II: Atrapa la lanza con ambas manos e intenta frenarla resbalando hacia atrás con tensión continua
      [1.08, makeBrakeStruggle(0, 1)],
      [1.32, makeBrakeStruggle(1, -1)],
      [1.58, makeBrakeStruggle(2, 1)],
      [1.84, makeBrakeStruggle(3, -1)],
      [2.12, makeBrakeStruggle(4, 1)],
      [2.38, makeBrakeStruggle(5, -1)],
      // Acto III: Desvía la lanza a un lado y lanza una patada giratoria en salto
      [2.64, V_WRENCH_OUT],
      [2.86, V_KICK_WIND],
      [3.16, V_SPIN_KICK],
      [3.48, V_KICK_LAND],
      // Acto IV: Corre hacia Javi con zancadas reales y salta por encima del barrido 360°
      [3.78, makeRunPose(1)],
      [4.04, makeRunPose(-1)],
      [4.28, makeRunPose(1)],
      [4.50, makeRunPose(-1)],
      [4.68, V_VAULT_UP],
      [4.92, V_VAULT_APEX],
      [5.18, V_DROP_SMASH],
      // Acto V: Cae golpeando, recibe el desvío y se cubre con los brazos cruzados hasta que rompen su guardia
      [5.46, V_DEFLECTED_1],
      [5.72, V_COVER_1],
      [5.98, V_COVER_2],
      [6.26, V_GUARD_BROKEN],
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
    // Trayectoria de Javi (con pasos intermedios en todos los giros para evitar saltos bruscos de ángulo)
    apos: [
      [0, 0, 0, 0, 0],
      [.12, 0, 0, -.24, .06],
      [.34, 0, 0, .08, -.18],
      [.54, -.12, 0, -.06, -1.65],
      [.72, 0, 0, -.18, -3.95],
      [.92, .08, 0, -.26, -TAU],
      // Empuje continuo durante la frenada de lanza
      [1.08, 0, 0, .48, -TAU],
      [1.45, 0, 0, 1.05, -TAU],
      [1.85, 0, 0, 1.65, -TAU],
      [2.25, 0, 0, 2.22, -TAU],
      [2.52, 0, 0, 2.55, -TAU],
      [2.85, 0, 0, 2.35, -TAU],
      // Bloquea la patada, resbala hacia atrás y ejecuta el backflip aéreo
      [3.16, 0, 0, 2.15, -TAU],
      [3.48, 0, 0, .85, -TAU],
      [3.64, 0, .85, .35, -TAU],
      [3.80, 0, 1.42, -.15, -TAU],
      [3.96, 0, .75, -.55, -TAU],
      [4.10, 0, 0, -.78, -TAU],
      // Barrido bajo de 360° (giro completo suave de -TAU a -2*TAU)
      [4.42, 0, 0, -.65, -TAU],
      [4.62, .18, 0, -.25, -TAU - 1.57],
      [4.80, 0, 0, .08, -TAU - 3.14],
      [4.98, -.18, 0, .28, -TAU - 4.71],
      [5.18, 0, 0, .38, -2 * TAU],
      // Paso lateral con rotación evasiva (de -2*TAU a -3*TAU) y avance en combo
      [5.46, -.52, 0, .62, -2 * TAU - 1.4],
      [5.72, -.18, 0, 1.12, -2 * TAU - 3.2],
      [5.98, .16, 0, 1.58, -2 * TAU - 4.8],
      [6.26, 0, 0, 2.02, -3 * TAU],
      // Salto mortal del Dragón hacia adelante
      [6.66, 0, .35, 2.15, -3 * TAU],
      [6.86, 0, 1.85, 2.08, -3 * TAU],
      [7.04, 0, 2.45, 1.98, -3 * TAU],
      [7.22, 0, .55, 1.88, -3 * TAU],
      [7.84, 0, .42, 1.88, -3 * TAU],
      // Retroceso corto para cargar el taladro y estocada relámpago final
      [8.02, 0, 0, 1.12, -3 * TAU],
      [8.18, 0, 0, 2.35, -3 * TAU],
      [8.80, 0, 0, 2.35, -3 * TAU],
    ],
    // Trayectoria de la víctima
    vpos: [
      [0, 0, 0, 1.52, 0],
      [.12, 0, 0, 1.32, 0],
      [.36, .16, 0, 1.78, -.18],
      [.68, .08, 0, 1.92, -.08],
      [.94, 0, 0, 1.85, 0],
      // De 1.10 a 2.55s `lock` posiciona a la víctima frente a la punta; dejamos la curva sincronizada
      [1.08, 0, 0, 1.92, 0],
      [2.52, 0, 0, 3.98, 0],
      [2.68, -.18, 0, 3.85, .22],
      // Giro de 360° para la patada circular en salto
      [2.88, -.08, .15, 3.62, 1.85],
      [3.04, 0, .62, 3.35, 3.95],
      [3.16, 0, .48, 3.12, TAU],
      [3.48, 0, 0, 3.28, TAU],
      // Sprint agresivo hacia Javi
      [3.78, 0, 0, 2.65, TAU],
      [4.04, 0, 0, 1.85, TAU],
      [4.28, 0, 0, 1.12, TAU],
      [4.50, 0, 0, .55, TAU],
      // Salto acrobático por encima del barrido de Javi
      [4.68, .12, 1.15, .18, TAU],
      [4.92, 0, 1.62, .38, TAU],
      [5.18, -.08, .45, .95, TAU],
      [5.46, -.22, 0, 1.48, TAU],
      // Retrocede cubriéndose ante el combo de 3 cortes de Javi
      [5.72, 0, 0, 1.98, TAU],
      [5.98, 0, 0, 2.52, TAU],
      [6.26, 0, 0, 3.08, TAU],
      [6.66, 0, 0, 3.12, TAU],
      // Cae de rodillas frenando el salto mortal de Javi y sale disparada al final
      [7.22, 0, -.32, 3.08, TAU],
      [7.84, 0, -.38, 3.08, TAU],
      [8.04, 0, 0, 3.12, TAU],
      [8.18, 0, .35, 3.35, TAU],
      [8.80, 0, .55, 3.65, TAU],
    ],
    ev: [
      // Acto I: Choque del Parry y desvío
      { t: .10, hit: 2, fx: 'spark', at: 'tip', sfx: 'clang', imp: 1, hs: .08, shake: .55, text: '¡PARRY!', who: 'att' },
      { t: .12, fx: 'ring', at: 'tip', r: 2.6, face: 1 },
      { t: .34, fx: 'arc', tilt: .58, r: 2.1, len: 2.9, dir: -1, col: '#4fc3f7', sfx: 'swing', shake: .25 },
      { t: .54, twirl: [1, .34], sfx: 'draw' },
      { t: .88, fx: 'charge', at: 'att', sfx: 'zap' },

      // Acto II: Estocada y forcejeo con la víctima frenando la lanza con las manos
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

      // Acto III: Desvío, patada giratoria, bloqueo deslizante y backflip
      { t: 2.62, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35, text: '¡FUERA!', who: 'vic' },
      { t: 2.95, sfx: 'swing' },
      { t: 3.16, fx: 'spark', at: 'att', sfx: 'clang', imp: 1, hs: .07, shake: .55 },
      { t: 3.18, fx: 'ring', at: 'att', r: 2.5, face: 1 },
      { t: 3.30, fx: 'dust', at: 'att' },
      { t: 3.44, fx: 'dust', at: 'att' },
      { t: 3.56, twirl: [1, .45], sfx: 'dash' },
      { t: 4.10, fx: 'dust', at: 'att', sfx: 'heavy', shake: .22 },

      // Acto IV: Barrido bajo de 360° y salto acrobático de la víctima
      { t: 4.62, fx: 'arc', tilt: .06, r: 2.6, len: 3.8, dir: 1, col: '#4fc3f7', sfx: 'swing', shake: .35 },
      { t: 4.68, fx: 'ring', at: 'ground', r: 3.4 },
      { t: 4.72, sfx: 'dash' },
      { t: 4.90, fx: 'arc', tilt: -.06, r: 2.5, len: 3.6, dir: 1, col: '#ffd54f', sfx: 'swing' },

      // Acto V: Intercambio rápido y ruptura de guardia
      { t: 5.44, fx: 'spark', at: 'tip', sfx: 'clang', hs: .05, shake: .4 },
      { t: 5.72, hit: 2, fx: 'arc', tilt: .35, r: 2.2, len: 3.0, dir: 1, col: '#4fc3f7', sfx: 'clang', shake: .3 },
      { t: 5.74, fx: 'dust', at: 'vic' },
      { t: 5.98, hit: 2, fx: 'arc', tilt: -.48, r: 2.2, len: 3.0, dir: -1, col: '#ffd54f', sfx: 'clang', shake: .35 },
      { t: 6.00, fx: 'dust', at: 'vic' },
      { t: 6.12, twirl: [1, .26] },
      { t: 6.26, hit: 4, fx: 'impact', at: 'vic', imp: 1, hs: .09, shake: .65, text: '¡GUARDIA ROTA!', who: 'att' },
      { t: 6.28, fx: 'ring', at: 'vic', r: 3.2, face: 1 },

      // Acto VI: Salto mortal del Dragón, frenada de rodillas agrietando el suelo y remate final
      { t: 6.66, fx: 'dust', at: 'att', sfx: 'dash' },
      { t: 6.86, twirl: [1, .32], fx: 'charge', at: 'att' },
      { t: 7.22, hit: 4, fx: 'boom', at: 'vic', r: 2.8, imp: 1, hs: .11, shake: .85 },
      { t: 7.24, fx: 'crack', at: 'ground', r: 4.5 },
      { t: 7.25, fx: 'ring', at: 'ground', r: 4.2 },
      { t: 7.44, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'zap', shake: .3 },
      { t: 7.64, hit: 1.5, fx: 'spark', at: 'tip', sfx: 'clang', shake: .35 },
      { t: 7.86, twirl: [3, .30], fx: 'charge', at: 'att', text: '¡LANZA DEL DRAGÓN!', who: 'att', slow: .24 },
      { t: 8.18, fx: 'stab', at: 'vic', imp: 1, hs: .18, shake: 1.1 },
      { t: 8.19, fx: 'boom', at: 'vic', big: 1, r: 4.4 },
      { t: 8.20, fx: 'ring', at: 'vic', r: 3.8, face: 1 },
      { t: 8.21, fx: 'crack', at: 'ground', r: 5.5 },
      { t: 8.22, rel: { dmg: 18, kb: 28, up: 9, rag: 2.5 }, slow: .28 },
    ],
    shots: [
      [0, 'cl', { s: 1, d: 3.2, h: .15, fov: 44, roll: -.05 }],
      [.34, 'two', { s: -1, fov: 50, roll: .04 }],
      [.94, 'faceA', { s: 1, fov: 40, roll: -.04 }],
      [1.10, 'clv', { s: -1, d: 3.0, h: .1, fov: 46, roll: .06 }],
      [1.75, 'orbit', { r: 3.6, h: 1.25, w: 1.3, a0: .5, fov: 50 }],
      [2.62, 'two', { s: 1, fov: 54, roll: -.05 }],
      [3.16, 'cl', { s: -1, d: 3.6, fov: 50, roll: .06 }],
      [3.54, 'low', { s: 1, fov: 54 }],
      [4.45, 'ground', { s: -1, fov: 56, roll: -.04 }],
      [5.44, 'two', { s: 1, fov: 48, roll: .05 }],
      [6.18, 'clv', { s: -1, d: 3.3, fov: 46, roll: -.07 }],
      [6.66, 'low', { s: -1, fov: 56 }],
      [7.20, 'clv', { s: 1, d: 3.1, h: -.1, fov: 44, roll: .07 }],
      [7.86, 'faceA', { s: -1, fov: 38, roll: -.05 }],
      [8.16, 'clv', { s: -1, d: 3.8, fov: 48, roll: .08 }],
      [8.45, 'hero', { s: -1 }],
    ],
  };
});
