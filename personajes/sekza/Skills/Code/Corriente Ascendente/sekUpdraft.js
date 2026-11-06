/* Habilidad: Corriente Ascendente  ·  personaje: sekza  ·  movimiento: sekUpdraft
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Corriente Ascendente: columna de aire que sube a los rivales y los deja flotando indefensos
CF.mover('sekUpdraft', function (f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw), R = o.r || 3.4, P = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9);
    clampArena(P, 2); P.y = groundAt(P.x, P.z);
    startAction(f, {
      name: 'sekUpdraft', bbClip: 'habilidad_4_corriente', dur: .7, speedMul: .2, aim: true,
      steps: [{ at: .25, fn: () => {
        warnCircle(P, R, o.color, .6); sfx('whoosh', P);
        later(.6, () => {
          for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - P.x, g.pos.z - P.z) < R + .4 && g.pos.y - P.y < 3)
            applyHit(f, g, { dmg: o.dmg || 3, stun: 1.7, kb: 0, up: 19, color: o.color, guardBreak: true, hitstop: .05, shake: .25 });
          lightColumn(P, o.color, 22); ringAt(P, o.color, R * 1.4, .5); sfx('heavy', P);
          for (let n = 0; n < 14; n++) later(n * .045, () => { for (let k = 0; k < 4; k++) { const an = n * .8 + k * TAU / 4, rr = R * .8 * (1 - n / 18); emit(P.x + Math.cos(an) * rr, P.y + .2, P.z + Math.sin(an) * rr, -Math.sin(an) * 5, rand(12, 20), Math.cos(an) * 5, k % 2 ? o.color : '#ffffff', .2, .6, 0, 0); } });
        });
      } }],
    });
  });
