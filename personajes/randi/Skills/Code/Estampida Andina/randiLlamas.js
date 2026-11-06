/* Habilidad: Estampida Andina  ·  personaje: randi  ·  movimiento: randiLlamas
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('randiLlamas', function (f, o) {
    const F = fwd(f.yaw), R = rightOf(f.yaw), llamas = [], pick = [0, 2, 3];
    const clear = () => { for (const L of llamas) if (L.g.parent) L.g.parent.remove(L.g); llamas.length = 0; };
    startAction(f, {
      name: 'randiLlamas', dur: 2.3, aim: true, speedMul: .3, anim: [[0, 'windup', 700], [.3, 'mega', 1500]],
      start: () => { popText(chestOf(f), '¡ESTAMPIDA ANDINA!', '#ffd23f', 24); sfx('dash', f.pos); },
      steps: [{ at: .35, fn: () => {
        sfx('fire', f.pos, .6); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd23f', 4, .5);
        for (let i = 0; i < 5; i++) {
          const off = (i - 2) * 1.9, g = DOM_ANIMALS[pick[i % 3]](); g.scale.setScalar(.8);
          const p = new V3(f.pos.x + F.x * 1.5 + R.x * off, f.pos.y + 1, f.pos.z + F.z * 1.5 + R.z * off);
          g.position.set(p.x, groundAt(p.x, p.z), p.z); g.rotation.y = Math.atan2(F.x, F.z); scene.add(g); llamas.push({ g, p, set: new Set(), ph: rand(0, 6), k: 0 });
          burst(p, 8, '#e8d9b0', 5, .14, .4, .3);
        }
      } }],
      tick: (a, t, dt) => {
        for (const L of llamas) {
          L.p.x += F.x * 21 * dt; L.p.z += F.z * 21 * dt; L.ph += dt * 15; L.k += dt;
          L.g.position.set(L.p.x, groundAt(L.p.x, L.p.z) + Math.abs(Math.sin(L.ph)) * .28, L.p.z);
          if (Math.random() < .5) emit(L.p.x + rand(-.5, .5), L.g.position.y + .1, L.p.z + rand(-.5, .5), rand(-1, 1), rand(.5, 2), rand(-1, 1), '#d8d0c0', .18, .4, .2, 2);
          if (hitArea(f, L.p, 1.5, { dmg: o.dmg || 6, kb: 9, up: 8, ragdoll: .8, stun: .4, color: '#ffd23f', set: L.set, hitstop: .04, shake: .3 })) { impactStar(L.p, '#ffd23f', 1.8, .2); }
          if (L.k > .22) { L.k = 0; worldDamage(L.p, 2.6, .8, 9, 1); }
        }
        if (t > 1.9 && llamas.length) clear();
      },
      onEnd: clear,
    });
  });
