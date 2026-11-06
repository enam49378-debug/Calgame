/* Habilidad: Bombardeo Orbital  ·  personaje: redbird  ·  movimiento: rbSatellite
   Código y lógica de esta habilidad. Los números (daño, recarga, alcance) están en personaje.js.
   Puedes usar cualquier función del juego (startAction, applyHit, hitArea, ...) como si estuvieras dentro de js/game.js. */
// 3 · marcar y confirmar: la marca persigue al rival con retraso y crece; el segundo toque llama al satélite
CF.mover('rbSatellite', function (f, o) {
    const COL = '#ff2d55', F = fwd(f.yaw), tg0 = findTarget(f, 28);
    const pos = clampArena(tg0 ? tg0.pos.clone() : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12)); pos.y = groundAt(pos.x, pos.z);
    startAction(f, { name: 'rbMark', dur: .5, bbClip: 'despertar_marcar', speedMul: .3, aim: true, eyes: true });
    const grp = new THREE.Group(), rg = new THREE.RingGeometry(.86, 1, 48), ring = new THREE.Mesh(rg, glowMat(COL, .9)), cg = new THREE.CircleGeometry(1, 40), disc = new THREE.Mesh(cg, glowMat(COL, .18)),
      pg = new THREE.CylinderGeometry(.12, .12, 40, 8), pil = new THREE.Mesh(pg, glowMat('#ffffff', .45));
    ring.rotation.x = disc.rotation.x = -Math.PI / 2; pil.position.y = 20; grp.add(ring, disc, pil);
    const mk = { dead: false }; sfx('zap', pos); ringAt(pos, COL, 3, .4);
    addFx(grp, 8, g => { if (mk.dead) g.visible = false; }, () => { rg.dispose(); ring.material.dispose(); cg.dispose(); disc.material.dispose(); pg.dispose(); pil.material.dispose(); });
    const at = o.at || rand(1.2, 2.6);
    seqStart(f, {
      slot: o.slot, lock: false, tg: tg0, fired: false, autoOnly: true,
      auto: (s, k) => k === 'tap' && s.t > at,
      onCancel: () => { mk.dead = true; },
      step(f, s, i) {
        if (s.tg && s.tg.alive) { pos.x += (s.tg.pos.x - pos.x) * Math.min(1, 2.2 * i.dt); pos.z += (s.tg.pos.z - pos.z) * Math.min(1, 2.2 * i.dt); pos.y = groundAt(pos.x, pos.z); }
        const pw = clamp(s.t / 2.5, 0, 1), R = 3 + 2.2 * pw, pul = 1 + Math.sin(s.t * 12) * .05;
        grp.position.set(pos.x, pos.y + .1, pos.z); ring.scale.set(R * pul, R * pul, 1); disc.scale.set(R, R, 1); pil.scale.set(.5 + pw, 1, .5 + pw);
        s.hud = { txt: `SATÉLITE ENLAZADO  ·  poder ${Math.round(pw * 100)}%`, pct: pw, col: pw >= 1 ? '#ffffff' : COL };
        if (s.t > 4.5 || (i.down && s.t > .45)) {
          const P = pos.clone(), dmg = 7 + 6 * pw;
          mk.dead = true; seqEnd(f);
          startAction(f, { name: 'rbCall', dur: .75, bbClip: 'despertar_llamar', speedMul: .2, aim: true, eyes: true });
          warnCircle(P, R, COL, .8);
          later(.85, () => {
            lightColumn(P, '#ffffff', 34); lightColumn(P, COL, 30);
            explode(f, new V3(P.x, P.y + .8, P.z), R, { dmg, kb: 4, up: 16, ragdoll: 1.2, color: COL, guardBreak: true, hitstop: .1, shake: .5 }); sfx('ult', P);
            for (let w = 1; w <= 2; w++) later(.28 * w, () => {
              const rr = R * (.55 + .45 * w);
              for (let n = 0; n < 6; n++) {
                const an = n / 6 * TAU + w * .5, q = new V3(P.x + Math.cos(an) * rr, 0, P.z + Math.sin(an) * rr); clampArena(q, 1); q.y = groundAt(q.x, q.z);
                lightColumn(q, COL, 14);
                explode(f, new V3(q.x, q.y + .8, q.z), 1.7, { dmg: 3.5, stun: .5, kb: 5, up: 5, color: COL, hitstop: .03, shake: .2 });
              }
            });
          });
        }
      },
    });
  });
