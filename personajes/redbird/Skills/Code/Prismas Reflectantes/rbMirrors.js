/* Habilidad: Prismas Reflectantes  ·  personaje: redbird  ·  movimiento: rbMirrors
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 2 · tocar hasta 3 veces: prismas alrededor del rival y el rayo rebota por todos
CF.mover('rbMirrors', function (f, o) {
    const COL = ['#ff2d55', '#ff7a1a', '#ffe14d', '#ffffff'], mirrors = [];
    const killMirrors = () => mirrors.forEach(m => { m.dead = true; m.grp.visible = false; });
    const place = s => {
      const tg = findTarget(f, 28), n = mirrors.length, c = tg ? tg.pos.clone() : front(f, 9, 0);
      const th = Math.atan2(c.x - f.pos.x, c.z - f.pos.z) + [2.1, -2.1, 0][n];
      const pos = clampArena(new V3(c.x + Math.sin(th) * 5.5, 0, c.z + Math.cos(th) * 5.5)); pos.y = groundAt(pos.x, pos.z) + 1.8;
      const grp = new THREE.Group(), a = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glowMat(COL[0], .55)), b = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), glowMat('#ffffff', .9));
      a.scale.set(.7, 1.5, .18); b.scale.set(.4, 1.1, .1); grp.add(a, b); grp.position.copy(pos);
      const m = { grp, pos, dead: false }; mirrors.push(m);
      addFx(grp, 9, (g, k) => { if (!m.dead) g.rotation.y += .06; }, () => { a.geometry.dispose(); a.material.dispose(); b.geometry.dispose(); b.material.dispose(); });
      ringAt(new V3(pos.x, pos.y - 1.7, pos.z), COL[0], 2.4, .5); sphereFlash(pos, COL[0], 1.4, .3); sfx('zap', pos);
      startAction(f, { name: 'rbMirror', dur: .3, bbClip: 'despertar_espejo', speedMul: .5, aim: true, eyes: true });
      s.last = s.t;
    };
    const shoot = s => {
      seqEnd(f);
      const tg = findTarget(f, 34), pts = [front(f, .35, 1.72), ...mirrors.map(m => m.pos.clone())];
      startAction(f, { name: 'rbMirrorFire', dur: 1, bbClip: 'despertar_rebote', speedMul: 0, aim: true, noControl: true, eyes: true });
      const legs = pts.length;
      for (let n = 0; n < legs; n++) later(.12 + n * .14, () => {
        const a = pts[n], last = n === legs - 1, col = COL[Math.min(n, 3)];
        let b;
        if (last) { b = tg && tg.alive ? chestOf(tg).clone() : pts[n].clone().addScaledVector(pts[n].clone().sub(pts[Math.max(0, n - 1)]).normalize(), 14); }
        else b = pts[n + 1];
        laserLeg(a, b, col, .22 + n * .05, .28); sphereFlash(b, col, .9 + n * .25, .25); sfx('beam', a, .6);
        const F = b.clone().sub(a).setY(0).normalize();
        if (last && tg && tg.alive) explode(f, b, 2.8, { dmg: 8, kb: 12, up: 8, ragdoll: .9, color: col, guardBreak: true, hitstop: .08, shake: .35 });
        else for (const g of enemiesOf(f)) if (segDist(chestOf(g), a, b) < .9 + n * .15) applyHit(f, g, { dmg: [2.6, 4, 5.5, 8][Math.min(n, 3)], stun: .4, kb: 3, up: 1, dir: F, color: col, hitstop: .03, shake: .2 });
      });
      later(.12 + legs * .14 + .35, killMirrors);
    };
    const seq = seqStart(f, {
      slot: o.slot, lock: true, last: 0, autoOnly: true,
      auto: (s, k) => k === 'tap' && mirrors.length < 3 && s.t - s.last > .4,
      onCancel: killMirrors,
      step(f, s, i) {
        if (s.firing) return;
        if (i.down && mirrors.length < 3) { place(s); if (mirrors.length >= 3) { s.firing = true; later(.35, () => shoot(s)); } }
        else if (s.t - s.last > 3) { s.firing = true; shoot(s); return; }
        s.hud = { txt: `PRISMAS ${mirrors.length}/3`, pct: 1 - (s.t - s.last) / 3, col: COL[Math.min(mirrors.length, 3)] };
      },
    });
    place(seq);
  });
