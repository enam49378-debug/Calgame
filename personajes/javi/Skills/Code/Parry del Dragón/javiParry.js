/* Habilidad: Parry del Dragón  ·  personaje: javi  ·  movimiento: javiParry   (habilidad 1 del despertar)
   Javi hace girar la lanza y la cruza delante del cuerpo en diagonal, a dos manos, bien agachado, y espera el golpe.
   Si alguien lo golpea durante la ventana, el golpe se anula y se desata el duelo de lanza (coreografía javiParry):
   el rival intenta frenar la punta con las manos, forcejean deslizándose, giran, saltan, patada y remate final.
   Si nadie lo golpea, solo pierde la guardia y vuelve a la normalidad.
   Los números (ventana, daño, recarga) están en personaje.js; la escena está en Skills/Animation/Parry del Dragón. */
CF.mover('javiParry', function (f, o) {
  const WINDOW = o.window || 1.6;
  // U(pose, up): ángulo real de la lanza (rad, + = punta arriba) compensando la inclinación del cuerpo y del brazo
  const U = (p, up) => Object.assign({}, p, { sx: -up - ((p.ix || 0) + (p.tx || 0) + (p.arx || 0)) });
  const base = { ix: .12, by: -3.2, tx: .1, ty: .5, hy: -.45, llx: -.6, lrx: .5, llz: .15, lrz: -.15 };
  const GUARD = U(Object.assign({}, base, { arx: -1.6, arz: -.3, sy: .8, sz: .3 }), .85);                       // lanza cruzada en diagonal, a dos manos
  const SINK = U(Object.assign({}, base, { by: -4.2, ix: .2, ty: .7, tx: .18, arx: -1.6, arz: -.3, sy: .8, sz: .3, llx: -.75, lrx: .65, llz: .22, lrz: -.22 }), .9);
  if (f.spear && !f.spearOut) setSpear(f, true);
  startTwirl(f, 2, .4);   // la lanza gira antes de cruzarse
  startAction(f, {
    name: 'javiParry', dur: WINDOW, counter: true, speedMul: 0, noControl: true,
    anim: [[0, 'twirlPose', 300], [.36, GUARD, 1100], [.55, SINK, 500], [.95, GUARD, 400], [1.25, SINK, 500]],
    grips: [{ arm: 'armL', z: 7, t0: .3 }],
    start: () => { ringAt(chestOf(f), o.color, 2.4, .45, 'face', f.yaw); sfx('block', f.pos); popText(chestOf(f), '¡GUARDIA!', o.color, 20); },
    tick: (a, t) => {
      if (Math.floor(t * 8) !== Math.floor((t - .016) * 8)) emit(f.pos.x + rand(-.5, .5), f.pos.y + rand(.6, 1.6), f.pos.z + rand(-.5, .5), 0, rand(.5, 2), 0, o.color, .1, .3, -.1, 1);
      if (t > .36 && Math.floor(t * 4) !== Math.floor((t - .016) * 4)) ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), o.color, 1.4, .5, 'flat', f.yaw);   // pulso de energía en el piso mientras espera
    },
    // el golpe se anula y empieza el duelo (a quien lo golpeó lo sujeta la escena)
    onCounter: (t, att) => {
      if (!att.alive || att.cineLock || att.grabbed) { counterHit(t, att); return; }
      f.yaw = yawTo(f, att); f.iframes = Math.max(f.iframes, 2);
      runChore(f, att, CHORE.javiParry);
    },
  });
});
