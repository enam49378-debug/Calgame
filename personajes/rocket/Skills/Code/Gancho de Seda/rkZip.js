/* Habilidad: Gancho de Seda  ·  personaje: rocket  ·  movimiento: rkZip
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Gancho de Seda: se engancha al rival con un hilo y se deja arrastrar de cara hasta él
CF.mover('rkZip', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = new V3();
    const setD = () => { if (tg && tg.alive) dest.set(tg.pos.x, tg.pos.y, tg.pos.z); else dest.set(f.pos.x + F.x * 12, f.pos.y, f.pos.z + F.z * 12); };
    setD(); let landed = false;
    startAction(f, {
      name: 'rkZip', bbClip: 'habilidad_2_gancho', dur: .9, noControl: true, armor: true, aim: true,
      start: () => {
        sfx('zap', f.pos);
        const tg2 = new THREE.BoxGeometry(.05, .05, 1), m = glowMat('#ffffff', .9), line = new THREE.Mesh(tg2, m);
        addFx(line, .6, (l, k) => { const a = front(f, .3, 1.2), b = new V3(dest.x, dest.y + 1.2, dest.z), len = a.distanceTo(b) || .1; l.position.copy(a).lerp(b, .5); l.scale.set(1, 1, len); l.lookAt(b); m.opacity = .9 * (1 - k * k); }, () => { tg2.dispose(); m.dispose(); });
      },
      tick: (a, t, dt) => {
        if (landed) return;
        setD(); f.yaw = Math.atan2(dest.x - f.pos.x, dest.z - f.pos.z);
        if (t < .18) { f.vel.x = f.vel.z = 0; return; }
        const to = new V3(dest.x - f.pos.x, 0, dest.z - f.pos.z), d = to.length();
        if (d > 2) { to.normalize(); f.vel.x = to.x * 34; f.vel.z = to.z * 34; if (f.onGround) f.vel.y = 3; if (Math.random() < .6) ghost(f, o.color, .35, .2); }
        else {
          landed = true; f.vel.x *= .1; f.vel.z *= .1; a.t = Math.max(a.t, .56);
          arcSlash(f, o.color, { tilt: -.4, r: 1.8, len: 2.4, w: .6 });
          hitArea(f, front(f, 1.2, 1.1), 1.7, { dmg: o.dmg || 7, stun: .7, kb: 6, up: 9, color: o.color, guardBreak: true, hitstop: .08, shake: .35 }); sfx('heavy', f.pos, .6);
        }
      },
    });
  });
