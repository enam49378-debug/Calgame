/* Habilidad: Picada de Halcón  ·  personaje: sekza  ·  movimiento: sekDive
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Picada de Halcón: sube con las alas, marca el piso y cae como flecha con un impacto que lanza
CF.mover('sekDive', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), dest = new V3(), dir = new V3();
    const setDest = () => { if (tg && tg.alive) dest.set(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z); else dest.set(f.pos.x + F.x * 10, groundAt(f.pos.x + F.x * 10, f.pos.z + F.z * 10), f.pos.z + F.z * 10); clampArena(dest, 1.5); };
    setDest(); let dove = false, hit = false, gh = 0;
    startAction(f, {
      name: 'sekDive', bbClip: 'habilidad_2_picada', dur: 1.6, noControl: true, armor: true, aim: true,
      start: () => { f.vel.set(0, 17, 0); f.onGround = false; f.iframes = Math.max(f.iframes, .7); sfx('jump', f.pos); ringAt(new V3(f.pos.x, f.pos.y + .05, f.pos.z), o.color, 3, .4); burst(new V3(f.pos.x, f.pos.y + .3, f.pos.z), 14, o.color, 6, .2, .4, 1); warnCircle(dest, 2.8, o.color, .6); },
      tick: (a, t, dt) => {
        if (!dove) {
          setDest(); f.yaw = Math.atan2(dest.x - f.pos.x, dest.z - f.pos.z); f.vel.x *= .9; f.vel.z *= .9;
          if (t >= .5) { dove = true; dir.set(dest.x - f.pos.x, dest.y + .8 - f.pos.y, dest.z - f.pos.z).normalize(); f.vel.set(dir.x * 30, dir.y * 30, dir.z * 30); sfx('dash', f.pos); }
          return;
        }
        f.vel.x = dir.x * 30; f.vel.z = dir.z * 30; gh += dt; if (gh > .05) { gh = 0; ghost(f, o.color, .45, .25); }
        if (!hit) for (const g of enemiesOf(f)) if (chestOf(g).distanceTo(chestOf(f)) < 1.6) { hit = true; applyHit(f, g, { dmg: 4, stun: .5, kb: 3, dir: new V3(dir.x, 0, dir.z), color: o.color, guardBreak: true, hitstop: .05, shake: .2 }); break; }
        if (f.onGround && t > .6) {
          explode(f, new V3(f.pos.x, f.pos.y + .8, f.pos.z), 3, { dmg: o.dmg || 9, kb: 8, up: 11, ragdoll: .9, color: o.color, guardBreak: true, hitstop: .1, shake: .5 });
          f.vel.x = f.vel.z = 0; a.t = Math.max(a.t, 1.0); dove = false; a.tick = null;
        }
      },
    });
  });
