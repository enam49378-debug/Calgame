/* Habilidad: Puño Divergente  ·  personaje: javi  ·  movimiento: fistDiv
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('fistDiv', function (f, o) {
    const first = new Set(), F = () => fwd(f.yaw);
    startAction(f, {
      name: 'fistdiv', dur: .95, aim: true, speedMul: .4, anim: [[0, 'jabR_w', 700], [.15, 'jabR', 1500], [.5, 'jabR_w', 500], [.58, 'mega', 1500]],
      start: () => sfx('swing', f.pos),
      steps: [
        { at: .2, fn: () => { f.vel.x += F().x * 3; f.vel.z += F().z * 3; const p = front(f, 1.4, 1.2); hitArea(f, p, 1.3, { dmg: 6, kb: 3, stun: .7, color: o.color, set: first }); impactStar(p, '#ffffff', 1.6, .18); burst(p, 10, o.color, 6, .12, .3, 0); sfx('swing', f.pos, .6); } },
        { at: .64, fn: () => {   // el segundo impacto llega después, en el mismo punto
          for (const g of first) { if (!g.alive) continue; const c = chestOf(g); impactStar(c, '#ff4a5a', 2.6, .3); ringAt(c, '#ffffff', 3.2, .35); burst(c, 22, '#ffffff', 9, .16, .4, 0); applyHit(f, g, { dmg: 9, kb: 17, up: 5, ragdoll: 1.1, dir: F(), color: '#ff4a5a', hitstop: .1, shake: .5 }); }
          if (!first.size) impactStar(front(f, 1.6, 1.2), '#ffffff', 1.4, .2);
          worldDamage(front(f, 1.8, 1.2), 3.2, 1, 12, .8); sfx('break', f.pos, .6);
        } },
      ],
    });
  });
