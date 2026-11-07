/* Habilidad: Parry del Dragón  ·  personaje: javi  ·  movimiento: javiParry   (habilidad 1 del despertar)
   Javi hace girar la lanza con un destello y la cruza delante del cuerpo en guardia diagonal baja, con los ojos encendidos.
   Si alguien lo golpea durante la ventana, desvía el ataque con un tajo explosivo y desata el contraataque anime
   (coreografía javiParry): ráfaga relámpago de estocadas, paso fantasma a la espalda, ascenso del dragón y picado celestial.
   Los números (ventana, daño, recarga) están en personaje.js; la escena está en Skills/Animation/Parry del Dragón. */
CF.mover('javiParry', function (f, o) {
  const WINDOW = o.window || 1.6;
  // U(pose, up): ángulo real de la lanza (rad, + = punta arriba) compensando la inclinación del cuerpo y del brazo
  const U = (p, up) => Object.assign({}, p, { sx: -up - ((p.ix || 0) + (p.tx || 0) + (p.arx || 0)) });
  const base = { ix: .16, by: -3.4, tx: .12, ty: .48, hy: -.42, hx: -.08, alx: -1.35, alz: -.45, aly: .3, llx: -.68, lrx: .56, llz: .18, lrz: -.18 };
  const GUARD = U(Object.assign({}, base, { arx: -1.58, arz: -.28, sy: .78, sz: .26 }), .85);
  const SINK = U(Object.assign({}, base, { by: -4.3, ix: .22, ty: .65, tx: .18, arx: -1.62, arz: -.32, sy: .82, sz: .28, llx: -.82, lrx: .68, llz: .24, lrz: -.24 }), .92);
  if (f.spear && !f.spearOut) setSpear(f, true);
  startTwirl(f, 2, .34);
  startAction(f, {
    name: 'javiParry', dur: WINDOW, counter: true, aim: true, eyes: true, speedMul: 0, noControl: true,
    anim: [[0, 'twirlPose', 350], [.28, GUARD, 1200], [.52, SINK, 550], [.92, GUARD, 450], [1.25, SINK, 500]],
    grips: [{ arm: 'armL', z: 7, t0: .24 }],
    start: () => {
      ringAt(chestOf(f), o.color, 2.5, .42, 'face', f.yaw);
      arcSlash(f, o.color, { tilt: -.75, r: 1.7, len: 2.5, w: .45, dur: .2 });
      sfx('draw', f.pos); sfx('block', f.pos);
      popText(chestOf(f), '¡GUARDIA DRAGÓN!', o.color, 20);
    },
    tick: (a, t) => {
      if (Math.floor(t * 10) !== Math.floor((t - .016) * 10)) {
        const ang = rand(0, Math.PI * 2), r = rand(.35, .95);
        emit(f.pos.x + Math.cos(ang) * r, f.pos.y + rand(.4, 1.6), f.pos.z + Math.sin(ang) * r, -Math.cos(ang) * 1.5, rand(1.2, 3.2), -Math.sin(ang) * 1.5, Math.random() < .35 ? '#ffffff' : o.color, .11, .32, -.08, 1);
      }
      if (t > .28 && Math.floor(t * 4) !== Math.floor((t - .016) * 4)) {
        ringAt(new V3(f.pos.x, f.pos.y + .08, f.pos.z), o.color, 1.55, .45, 'flat', f.yaw);
      }
    },
    onCounter: (t, att) => {
      if (!att.alive || att.cineLock || att.grabbed) { counterHit(t, att); return; }
      f.yaw = yawTo(f, att); f.iframes = Math.max(f.iframes, 2.5);
      runChore(f, att, CHORE.javiParry);
    },
  });
});
