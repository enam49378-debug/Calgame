/* Habilidad: Vuelo Rasante  ·  personaje: sekza  ·  movimiento: sekFlight
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Vuelo Rasante (despierta): sale como flecha persiguiendo al rival y lanza a todos los que cruza
CF.mover('sekFlight', function (f, o) {
    javiSpeak(f, 'fly');
    const tg = findTarget(f, 26), hitSet = new Set(), dir = fwd(f.yaw).clone(); let gh = 0;
    startAction(f, {
      name: 'sekFlight', bbClip: 'despertar_vuelo', dur: 1.4, noControl: true, armor: true, aim: true, speedMul: 0,
      start: () => { f.vel.set(0, 7, 0); f.onGround = false; sfx('whoosh', f.pos); ghost(f, o.color, .5, .3); },
      tick: (a, t, dt) => {
        if (t < .2) { f.vel.x = f.vel.z = 0; f.vel.y = 7; return; }
        if (tg && tg.alive && t < .95) dir.copy(chestOf(tg).sub(chestOf(f)).normalize());
        const V = 27; f.vel.set(dir.x * V, dir.y * V * .8 + 1.5, dir.z * V); f.yaw = Math.atan2(dir.x, dir.z);
        gh += dt; if (gh > .05) { gh = 0; ghost(f, o.color, .4, .25); emit(f.pos.x, f.pos.y + 1, f.pos.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), o.color, .2, .3, 0, 0); }
        for (const g of enemiesOf(f)) if (!hitSet.has(g) && chestOf(g).distanceTo(chestOf(f)) < 1.9) {
          hitSet.add(g); applyHit(f, g, { dmg: o.dmg || 6, stun: .7, kb: 9, up: 7, dir: new V3(dir.x, 0, dir.z), color: o.color, guardBreak: true, hitstop: .06, shake: .3 });
          impactStar(chestOf(g), o.color, 2, .22); sfx('heavy', g.pos, .6);
        }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  });
