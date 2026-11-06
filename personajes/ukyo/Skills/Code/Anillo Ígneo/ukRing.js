/* Habilidad: Anillo Ígneo  ·  personaje: ukyo  ·  movimiento: ukRing
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Anillo Ígneo (despierta): dos olas de fuego seguidas
CF.mover('ukRing', function (f, o) {
    const col = '#ff7a1a';
    const pulse = (R, dmg, up, rag) => {
      const hit = new Set(), c = new V3(f.pos.x, f.pos.y, f.pos.z);
      ringAt(new V3(c.x, c.y + .1, c.z), col, R, .45); ringAt(new V3(c.x, c.y + .1, c.z), '#ffffff', R * .8, .3); sfx('boom', c, .7); shakeFrom(c, .4);
      for (let k = 0; k < 24; k++) { const an = k / 24 * TAU; burst(new V3(c.x + Math.cos(an) * R * .85, c.y + .3, c.z + Math.sin(an) * R * .85), 3, k % 2 ? '#ff7a1a' : '#ffd54f', 4, .2, .5, 2); }
      for (const g of enemiesOf(f)) if (!hit.has(g) && g.alive && Math.hypot(g.pos.x - c.x, g.pos.z - c.z) < R + .5 && g.pos.y - c.y < 3) {
        hit.add(g); applyHit(f, g, { dmg, kb: 10, up, ragdoll: rag, dir: new V3(g.pos.x - c.x, 0, g.pos.z - c.z), color: col, guardBreak: true, hitstop: .08, shake: .3 }); poisonOn(g, f, { dps: 2.4, dur: 3.2, col, label: 'ARDE' });
      }
    };
    startAction(f, {
      name: 'ukRing', bbClip: 'despertar_anillo', dur: .9, speedMul: 0, aim: true, armor: true,
      steps: [{ at: .3, fn: () => pulse(6.5, o.dmg || 6, 6, 0) }, { at: .65, fn: () => pulse(9, (o.dmg || 6) * 1.3, 12, .8) }],
    });
  });
