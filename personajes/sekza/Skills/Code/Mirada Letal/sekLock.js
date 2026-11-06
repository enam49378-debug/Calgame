/* Habilidad: Mirada Letal  ·  personaje: sekza  ·  movimiento: sekLock
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// Mirada Letal (despierta): fija a todos los rivales y los castiga con luz del cielo
CF.mover('sekLock', function (f, o) {
    const tgs = enemiesOf(f).filter(g => g.alive && dist2d(f, g) < (o.range || 30)); if (!tgs.length) return false;
    const col = o.color;
    startAction(f, {
      name: 'sekLock', bbClip: 'despertar_mirada', dur: 2.2, speedMul: .15, aim: true, eyes: true, armor: true,
      steps: [
        { at: .35, fn: () => {
          sfx('zap', f.pos);
          for (const tg of tgs) {
            const grp = new THREE.Group(), rg = new THREE.RingGeometry(.86, 1, 40), cg = new THREE.BoxGeometry(2.4, .05, .12), cg2 = new THREE.BoxGeometry(.12, .05, 2.4), m = glowMat(col, .9), m2 = glowMat('#ffffff', .9);
            const ring = new THREE.Mesh(rg, m); ring.rotation.x = -Math.PI / 2; grp.add(ring, new THREE.Mesh(cg, m2), new THREE.Mesh(cg2, m2));
            addFx(grp, .95, (g, k) => { g.position.set(tg.pos.x, groundAt(tg.pos.x, tg.pos.z) + .15, tg.pos.z); g.rotation.y += .12; const sc = 2.6 - 1.5 * easeOut(k); g.scale.set(sc, 1, sc); m.opacity = .5 + .5 * Math.abs(Math.sin(k * 22)); }, () => { rg.dispose(); cg.dispose(); cg2.dispose(); m.dispose(); m2.dispose(); });
          }
        } },
        { at: 1.3, fn: () => {
          for (const tg of tgs) {
            if (!tg.alive) continue;
            const c = chestOf(tg).clone(), top = new V3(c.x, c.y + 16, c.z);
            laserLeg(top, c, col, .5, .4); laserLeg(top, c, '#ffffff', .2, .35); impactStar(c, '#ffffff', 2.2, .25);
            explode(f, c, 2.2, { dmg: o.dmg || 9, stun: .8, kb: 4, up: 8, color: col, guardBreak: true, hitstop: .1, shake: .4 });
          }
          screenFlash(.25); sfx('ult', f.pos, .7);
        } },
      ],
    });
  });
