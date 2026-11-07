/* Habilidad: Parry del Dragón  ·  personaje: javi  ·  movimiento: javiParry   (habilidad 1 del despertar)
   Javi cruza la lanza delante del cuerpo y espera el golpe. Si alguien lo golpea durante la ventana, el golpe se anula
   y se desata el duelo de lanza (coreografía javiParry): el rival intenta frenar la punta con las manos, forcejean
   deslizándose, giran, saltan, patada y remate final. Si nadie lo golpea, solo pierde la guardia y vuelve a la normalidad.
   Los números (ventana, daño, recarga) están en personaje.js; la escena está en Skills/Animation/Parry del Dragón. */
CF.mover('javiParry', function (f, o) {
  const WINDOW = o.window || 1.6;
  const STANCE = Object.assign({}, POSE.counter, { by: -2, ix: .1, ty: -.25, llx: -.5, lrx: .45 });
  if (f.spear && !f.spearOut) setSpear(f, true);
  startAction(f, {
    name: 'javiParry', dur: WINDOW, counter: true, speedMul: 0, noControl: true, anim: [[0, STANCE, 700]],
    start: () => { ringAt(chestOf(f), o.color, 2.2, .4, 'face', f.yaw); sfx('block', f.pos); popText(chestOf(f), '¡GUARDIA!', o.color, 20); },
    tick: (a, t) => { if (Math.floor(t * 8) !== Math.floor((t - .016) * 8)) emit(f.pos.x + rand(-.5, .5), f.pos.y + rand(.6, 1.6), f.pos.z + rand(-.5, .5), 0, rand(.5, 2), 0, o.color, .1, .3, -.1, 1); },
    // el golpe se anula y empieza el duelo (a quien lo golpeó lo sujeta la escena)
    onCounter: (t, att) => {
      if (!att.alive || att.cineLock || att.grabbed) { counterHit(t, att); return; }
      f.yaw = yawTo(f, att); f.iframes = Math.max(f.iframes, 2);
      runChore(f, att, CHORE.javiParry);
    },
  });
});
