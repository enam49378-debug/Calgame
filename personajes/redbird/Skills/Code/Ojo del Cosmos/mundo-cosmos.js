/* "Ojo del Cosmos" · lo que le pasa al MUNDO (lo ven todos los jugadores, no solo Redbird):
     - el cielo se vuelve rojo (G.apoc, lo lee el clima en game.js) y vuelve poco a poco a la normalidad;
     - toda la partida tiembla mientras el cosmos responde;
     - caen escombros y meteoritos ardiendo alrededor de la cámara (polvo, brasas, grietas y ondas al chocar);
     - el rayo reacciona al agua: sobre el mar levanta una franja de espuma, géiseres, vapor y ondas.
   Uso desde rbCosmos.js:  const M = rbCosmosMundo();  M.setApoc(1);  M.update(dt, { center, rain, quake });
                           M.water(origen, direccion, largo, ancho, potenciado, dt);  M.hideFoam();  M.dispose(); */
const rbCosmosMundo = function () {
  const Q = rbCalidad();
  const g = new THREE.Group(), mats = [], geos = [], rocks = []; scene.add(g);
  const boxG = new THREE.BoxGeometry(1, 1, 1); geos.push(boxG);
  const rockMats = [0x5e5046, 0x7a6a5c, 0x463b34].map(c => { const m = new THREE.MeshLambertMaterial({ color: c }); mats.push(m); return m; });
  const hotMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a, fog: false }); mats.push(hotMat);
  const wet = (x, z) => z > SHORE(x) + .2 && z < 290 && Math.abs(x) < 190;   // ¿es mar?
  let apoc = 0, apocT = 0, acc = 0, hornT = 0, geyT = 0, sndT = 0, foam = null, MAX = Q.n(64, 12);

  // ---- escombros
  const spawn = (c) => {
    if (rocks.length >= MAX) return;
    const a = rand(0, TAU), r = rand(4, 38), hot = Math.random() < .45, sc = rand(.5, 1.7);
    const m = new THREE.Mesh(boxG, hot ? hotMat : rockMats[Math.floor(Math.random() * 3)]);
    m.position.set(c.x + Math.cos(a) * r, c.y + rand(38, 64), c.z + Math.sin(a) * r); m.scale.set(sc, sc * rand(.6, 1.2), sc * rand(.7, 1.1));
    m.rotation.set(rand(0, TAU), rand(0, TAU), rand(0, TAU)); g.add(m);
    rocks.push({ m, v: new V3(rand(-6, 6), -rand(26, 44), rand(-6, 6)), spin: new V3(rand(-4, 4), rand(-4, 4), rand(-4, 4)), hot, sc, big: sc > .95 });
  };
  const impact = (r) => {
    const p = r.m.position, w = wet(p.x, p.z), y = w ? SEA_Y + .05 : groundAt(p.x, p.z, p.y), P = new V3(p.x, y, p.z), d = camera.position.distanceTo(P), near = clamp(1 - d / 34, 0, 1);
    if (w) { burst(P, 16, '#dff4ff', 9, .26, .8, 1.3, 7); ringAt(P, '#ffffff', 2.6 + r.sc * 2, .55); }
    else {
      burst(new V3(P.x, P.y + .2, P.z), r.big ? 22 : 12, '#7a6a52', 8, .24, .7, 1.1, 5);
      if (r.hot) { burst(P, 14, '#ff9a3a', 9, .14, .5, .8, 4); ringAt(P, '#ff7a1a', 2 + r.sc * 2, .45); }
      if (r.big && Math.random() < .5) crackDecal(P, rand(1.2, 2.4));
    }
    if (near > 0) { G.shake = Math.max(G.shake, (r.big ? .3 : .12) * near); if (sndT <= 0 && Math.random() < .6) { sfx(r.big ? 'heavy' : 'hit', P, .4); sndT = .12; } }
    g.remove(r.m);
  };

  return {
    setApoc(v) { apocT = v; },
    // o = { center: V3 (alrededor de qué caen), rain: escombros por segundo, quake: temblor general (0..1) }
    update(dt, o) {
      o = o || {}; apoc += (apocT - apoc) * (1 - Math.exp(-dt * 1.4)); G.apoc = apoc; sndT -= dt;
      if (o.quake) G.shake = Math.max(G.shake, o.quake * (.8 + .2 * Math.sin(performance.now() * .02)));
      if (o.rain && o.center) { acc += o.rain * Q.q * dt; while (acc >= 1) { acc -= 1; spawn(o.center); } }
      for (let i = rocks.length - 1; i >= 0; i--) {
        const r = rocks[i], p = r.m.position; p.addScaledVector(r.v, dt); r.m.rotation.x += r.spin.x * dt; r.m.rotation.y += r.spin.y * dt; r.m.rotation.z += r.spin.z * dt;
        if (r.hot) emit(p.x, p.y, p.z, rand(-1, 1), rand(0, 1.5), rand(-1, 1), Math.random() < .5 ? '#ff8a3a' : '#ffd27a', .14, .4, 0, 0);
        const gy = wet(p.x, p.z) ? SEA_Y : groundAt(p.x, p.z, p.y);
        if (p.y <= gy + r.sc * .5) { impact(r); rocks.splice(i, 1); }
      }
    },
    // el rayo sobre el agua: franja de espuma que cubre el tramo del rayo que pasa por el mar, géiseres, vapor y ondas
    water(org, F2, len, w, powered, dt) {
      let d0 = -1, d1 = -1;
      for (let d = 0; d <= len; d += 2) { const x = org.x + F2.x * d, z = org.z + F2.z * d; if (wet(x, z)) { if (d0 < 0) d0 = d; d1 = d; } }
      if (d0 < 0) { if (foam) foam.visible = false; return; }
      if (!foam) { const m = glowMat('#cfeeff', .5); mats.push(m); m.side = THREE.DoubleSide; const pg = new THREE.PlaneGeometry(1, 1); geos.push(pg); foam = new THREE.Mesh(pg, m); foam.rotation.order = 'YXZ'; g.add(foam); }
      const L = d1 - d0 + 2, mid = d0 + L / 2, pulse = 1 + Math.sin(performance.now() * .02) * .1;
      foam.visible = true; foam.position.set(org.x + F2.x * mid, SEA_Y + .07, org.z + F2.z * mid); foam.rotation.set(-Math.PI / 2, Math.atan2(F2.x, F2.z), 0); foam.scale.set(w * 1.7 * pulse, L, 1); foam.material.opacity = .42 + Math.sin(performance.now() * .015) * .1;
      geyT -= dt;
      if (geyT <= 0) {
        geyT = (powered ? .07 : .12) / Math.max(.35, Q.q);
        for (let k = 0; k < (powered ? 3 : 2); k++) {
          const dd = rand(d0, d1), lat = rand(-w * .7, w * .7), x = org.x + F2.x * dd + F2.z * lat, z = org.z + F2.z * dd - F2.x * lat; if (!wet(x, z)) continue;
          const P = new V3(x, SEA_Y + .08, z);
          burst(P, powered ? 18 : 10, '#dff4ff', powered ? 11 : 8, .26, .9, 1.4, 8);
          for (let i = 0; i < 3; i++) emit(x + rand(-.5, .5), SEA_Y + .2, z + rand(-.5, .5), rand(-1, 1), rand(5, 12), rand(-1, 1), '#ffffff', .42, 1.1, -.4, 0);   // vapor
          if (Math.random() < (powered ? .5 : .32)) {   // columna de agua que sube y cae
            const h = rand(7, powered ? 18 : 12), rr = rand(.7, 1.5), cm = new THREE.Mesh(new THREE.CylinderGeometry(rr * .7, rr, 1, 12, 1, true), glowMat('#e8f8ff', .55)); cm.position.set(x, SEA_Y, z);
            addFx(cm, .7, (m, kk) => { const up = Math.sin(Math.min(1, kk * 1.25) * Math.PI * .5); m.scale.set(1 + kk * .8, h * up, 1 + kk * .8); m.position.y = SEA_Y + h * up / 2; m.material.opacity = (1 - kk) * .6; });
            ringAt(P, '#ffffff', 4 + Math.random() * 3, .6);
          }
        }
        if (sndT <= 0 && Math.random() < .5) { sfx('whoosh', new V3(org.x + F2.x * mid, SEA_Y, org.z + F2.z * mid), .5); sndT = .35; }
      }
    },
    hideFoam() { if (foam) foam.visible = false; },
    dispose() {
      scene.remove(g); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose());
      const back = () => { G.apoc = (G.apoc || 0) * .965; if (G.apoc > .01) requestAnimationFrame(back); else G.apoc = 0; }; back();   // el cielo rojo se apaga poco a poco
    },
  };
};
