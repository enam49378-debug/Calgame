/* Habilidad: Telaraña  ·  personaje: rocket  ·  movimiento: rkWeb
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Telaraña: un hilo que sigue al rival y lo envuelve en seda, inmóvil
CF.mover('rkWeb', function (f, o) {
    startAction(f, {
      name: 'rkWeb', bbClip: 'habilidad_1_tela', dur: .45, speedMul: .3, aim: true,
      steps: [{ at: .15, fn: () => {
        const from = front(f, .8, 1.3);
        spawnProj(f, f.yaw, { color: '#f0f0f8', speed: 40, size: .34, long: 1.6, homing: 1.6, range: 22, from,
          onHit: g => { if (applyHit(f, g, { dmg: o.dmg || 3, stun: o.root || 1.7, kb: 0, color: o.color, hitstop: .05, noCounter: true }) === true) { g.vel.x = g.vel.z = 0; webWrap(g, o.root || 1.7); popText(chestOf(g), '¡ATRAPADO!', '#f0f0f8', 18); } } });
        slashLine(from, front(f, 6, 1.3), '#ffffff', .25, .06); sfx('zap', f.pos, .7);
      } }],
    });
  });
