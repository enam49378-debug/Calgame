/* Habilidad: Ciclón Sónico  ·  personaje: mattux  ·  movimiento: sonCyclone
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
CF.mover('sonCyclone', function (f, o) {
    // Ciclón Sónico: corre en círculos a velocidad de luz, arrastra a los rivales hacia dentro y los lanza por los aires.
    const C = new V3(f.pos.x, f.pos.y, f.pos.z), R = 3.6, T0 = .3, T1 = 1.7; let hitT = 0, ang0 = Math.atan2(-fwd(f.yaw).z, -fwd(f.yaw).x), tickN = 0;
    startAction(f, {
      name: 'soncyclone', dur: 2.15, aim: false, noControl: true, armor: true, ghost: true, speedMul: 0, anim: [[0, 'charge', 300], [T0, 'dash', 1400]],
      start: () => { f.iframes = Math.max(f.iframes, .35); sfx('dash', f.pos, 1); popText(chestOf(f), '¡CICLÓN SÓNICO!', o.color, 24); ringAt(new V3(C.x, C.y + .2, C.z), o.color, R * 2.2, .45); },
      tick: (a, t, dt) => {
        if (t >= T0 && t < T1) {
          const k = (t - T0) / (T1 - T0), ang = ang0 + (t - T0) * 15, rr = R * Math.min(1, (t - T0) / .25);
          if (!f.remote) { f.pos.x = C.x + Math.cos(ang) * rr; f.pos.z = C.z + Math.sin(ang) * rr; f.vel.set(0, 0, 0); }
          f.yaw = ang + Math.PI / 2;
          for (let j = 0; j < 3; j++) { const aa = ang + rand(-1, 1) * .4, h = rand(.2, 3.4) * (.5 + k * .5); emit(C.x + Math.cos(aa) * R * rand(.7, 1.05), C.y + h, C.z + Math.sin(aa) * R * rand(.7, 1.05), -Math.sin(aa) * 7, rand(1, 4), Math.cos(aa) * 7, Math.random() < .5 ? o.color : '#ffffff', .24, .4, 0, 3); }
          // el viento arrastra a los rivales hacia el centro (menos si se alejan mucho)
          for (const g of enemiesOf(f)) { if (!g.alive || g.remote) continue; const dx = C.x - g.pos.x, dz = C.z - g.pos.z, d = Math.hypot(dx, dz); if (d < 9 && d > .8) { g.pos.x += dx / d * 5.5 * dt; g.pos.z += dz / d * 5.5 * dt; } }
          hitT -= dt; if (hitT <= 0) { hitT = .24; tickN++; sfx('swing', f.pos, .45);
            hitArea(f, new V3(C.x, C.y + 1, C.z), R + 1.6, { dmg: o.dmg || 2.4, kb: 1, up: 4, stun: .35, color: o.color, set: new Set(), hitstop: .02, shake: .12, noCounter: false });
            if (tickN % 2) ringAt(new V3(C.x, C.y + .1 + (tickN % 4) * .5, C.z), o.color, R * 2, .35);
          }
        } else if (t >= T1 && !a.fin) {
          a.fin = true; a.ghost = false; f.vel.set(0, 0, 0); a.anim = [[t, 'mega', 900]];
          const c = new V3(C.x, C.y + 1, C.z); ringAt(new V3(C.x, C.y + .1, C.z), '#ffffff', R * 3.4, .5); ringAt(new V3(C.x, C.y + .1, C.z), o.color, R * 2.6, .6); impactStar(c, '#ffffff', 3, .3); sfx('break', f.pos, .9); G.hitstop = Math.max(G.hitstop, .08);
          hitArea(f, c, R + 2.2, { dmg: 6, kb: 13, up: 10, ragdoll: 1.1, color: o.color, set: new Set(), hitstop: .1, shake: .6, guardBreak: true });
        }
      },
      onEnd: () => { f.vel.x = f.vel.z = 0; },
    });
  });
