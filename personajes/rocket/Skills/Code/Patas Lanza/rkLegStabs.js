/* Habilidad: Patas Lanza  ·  personaje: rocket  ·  movimiento: rkLegStabs
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Patas Lanza (despierta): las patas de araña clavan cinco estocadas al frente; la última lanza
CF.mover('rkLegStabs', function (f, o) {
    const col = o.color; let n = 0;
    startAction(f, {
      name: 'rkLegStabs', bbClip: 'despertar_patas', dur: 1.2, speedMul: .15, aim: true, armor: true,
      tick: (a, t) => {
        const want = t < .25 ? 0 : Math.min(5, Math.floor((t - .25) / .15) + 1);
        while (n < want) {
          n++; const last = n === 5, F = fwd(f.yaw + [-.5, .5, -.25, .25, 0][n - 1]), a0 = front(f, -.2, 1.5), b0 = new V3(f.pos.x + F.x * 6, f.pos.y + .5, f.pos.z + F.z * 6);
          slashLine(a0, b0, '#111118', .22, .35); slashLine(a0, b0, col, .18, .14); impactStar(b0, col, 1.6, .2); sfx('slash', f.pos, .7);
          for (const g of enemiesOf(f)) if (segDist(chestOf(g), a0, b0) < 1.1)
            applyHit(f, g, last ? { dmg: o.dmg2 || 8, kb: 14, up: 9, ragdoll: 1, guardBreak: true, color: col, hitstop: .1, shake: .4, dir: F } : { dmg: o.dmg || 3, stun: .45, kb: 2, dir: F, color: col, hitstop: .04, shake: .15 });
        }
      },
    });
  });
