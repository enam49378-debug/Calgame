/* Descenso de "Ojo del Cosmos" (personaje: redbird): al entrar en la atmósfera la cámara baja a toda velocidad
   atravesando nubes y pájaros hasta llegar a Redbird. Esto crea esas nubes y pájaros en el mundo real, y los visitantes
   que cruzan de repente: un avión a reacción, Sekza volando o (muy rara vez) un platillo.
   Uso desde rbCosmos.js:  const D = rbCosmosDescenso(posRedbird);  D.update(dt);  D.spawn('jet'|'sekza'|'ufo', camPos, mirarA, lado);  D.dispose(); */
const rbCosmosDescenso = function (P) {
  const g = new THREE.Group(), mats = [], geos = [], texs = [];
  const M = (o) => { const m = new THREE.MeshLambertMaterial(o); mats.push(m); return m; };
  const B = (w, h, d, mat) => { const ge = new THREE.BoxGeometry(w, h, d); geos.push(ge); return new THREE.Mesh(ge, mat); };
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const c = cv.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = rand(60, 196), y = rand(80, 176), r = rand(40, 90), gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.6, 'rgba(240,248,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }
  const tex = new THREE.CanvasTexture(cv); texs.push(tex);
  // nubes: sprites que siempre miran a la cámara; la cámara baja entre ellas
  for (let i = 0; i < 70; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: rand(.5, .95), depthWrite: false, fog: false }); mats.push(m);
    const sp = new THREE.Sprite(m), s = rand(60, 150); sp.scale.set(s, s * .65, 1);
    sp.position.set(P.x + rand(-80, 80), rand(15, 235), P.z + rand(-80, 80)); g.add(sp);
  }
  // pájaros: dos alas en V que aletean y cruzan rápido
  const wingG = new THREE.PlaneGeometry(2.6, .9); geos.push(wingG);
  const wingM = new THREE.MeshBasicMaterial({ color: 0x1d2433, side: THREE.DoubleSide }); mats.push(wingM);
  const birds = [];
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Group(), l = new THREE.Mesh(wingG, wingM), r = new THREE.Mesh(wingG, wingM); l.position.x = -1.3; r.position.x = 1.3; b.add(l, r);
    const sc = rand(1.2, 2.6); b.scale.set(sc, sc, sc);
    b.position.set(P.x + rand(-45, 45), rand(25, 220), P.z + rand(-45, 45));
    const an = rand(0, TAU), sp = rand(55, 110); b.userData = { v: new V3(Math.cos(an) * sp, rand(-6, 6), Math.sin(an) * sp), ph: rand(0, TAU), l, r };
    b.rotation.y = Math.atan2(b.userData.v.x, b.userData.v.z) + Math.PI / 2; g.add(b); birds.push(b);
  }

  // ---- visitantes que cruzan (cada uno apunta hacia donde va con +Z)
  const guests = [];
  const dot = (col, sc) => { const m = new THREE.SpriteMaterial({ color: col, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); mats.push(m); const sp = new THREE.Sprite(m); sp.scale.setScalar(sc); return sp; };
  const makeJet = () => {
    const j = new THREE.Group(), white = M({ color: 0xe9edf2 }), gray = M({ color: 0x8a93a0 }), red = M({ color: 0xc0262d });
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(.85, .6, 10, 12), white); geos.push(fus.geometry); fus.rotation.x = Math.PI / 2; j.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.6, 12), gray); geos.push(nose.geometry); nose.rotation.x = Math.PI / 2; nose.position.z = 6.3; j.add(nose);
    for (const sd of [-1, 1]) {
      const w = B(6.4, .2, 3, white); w.position.set(sd * 3.6, -.2, .4); w.rotation.y = sd * -.35; j.add(w);
      const st = B(2.6, .15, 1.4, white); st.position.set(sd * 1.7, 0, -4.4); j.add(st);
      const en = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 2.2, 10), gray); geos.push(en.geometry); en.rotation.x = Math.PI / 2; en.position.set(sd * 2.4, -.8, .2); j.add(en);
      const nl = dot(sd < 0 ? 0xff3030 : 0x30ff60, 2.4); nl.position.set(sd * 6.6, -.2, -.6); j.add(nl);
    }
    const fin = B(.2, 2.6, 2, red); fin.position.set(0, 1.7, -4.4); j.add(fin);
    const stripe = B(1.75, .35, 8.4, red); stripe.position.set(0, .1, -.4); j.add(stripe);
    const strobe = dot(0xffffff, 3.2); strobe.position.set(0, 1, -4.8); j.add(strobe); j.userData.strobe = strobe;
    j.scale.setScalar(1.5); return j;
  };
  const makeSekza = () => {
    const s = new THREE.Group(), skin = M({ color: 0xfcd39d }), hair = M({ color: 0x111010 }), shirt = M({ color: 0x6d2225 }), pants = M({ color: 0x3d6676 });
    const torso = B(.8, .4, 1.2, shirt); s.add(torso);
    const head = B(.6, .6, .6, skin); head.position.set(0, 0, 1.05); s.add(head);
    const hr = B(.64, .2, .64, hair); hr.position.set(0, .26, 1.05); s.add(hr);
    for (const sd of [-1, 1]) { const arm = B(.28, .28, 1.1, skin); arm.position.set(sd * .55, 0, .95); s.add(arm); const leg = B(.3, .3, 1.15, pants); leg.position.set(sd * .22, 0, -1.15); s.add(leg); }
    const wingM = new THREE.MeshBasicMaterial({ color: 0xffb020, side: THREE.DoubleSide }); mats.push(wingM); const wingG2 = new THREE.PlaneGeometry(3.2, 1.2); geos.push(wingG2);
    const wings = [];
    for (const sd of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(sd * .35, .1, -.1); const w = new THREE.Mesh(wingG2, wingM); w.rotation.x = Math.PI / 2; w.position.x = sd * 1.6; piv.add(w); s.add(piv); wings.push([piv, sd]); }
    s.userData.wings = wings; s.scale.setScalar(2.2); return s;
  };
  const makeUfo = () => {
    const u = new THREE.Group(), met = M({ color: 0x9aa4b2 }), dome = M({ color: 0x8fe8ff, emissive: 0x1a6070 });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.2, .9, 24), met); geos.push(disc.geometry); u.add(disc);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.1, 18, 10, 0, TAU, 0, Math.PI / 2), dome); geos.push(top.geometry); top.position.y = .45; u.add(top);
    const lights = []; for (let i = 0; i < 8; i++) { const l = dot([0xff4040, 0x40ff80, 0x4080ff, 0xffe040][i % 4], 2); const a = i / 8 * TAU; l.position.set(Math.cos(a) * 4.6, -.1, Math.sin(a) * 4.6); u.add(l); lights.push(l); }
    u.userData.lights = lights; u.scale.setScalar(1.3); return u;
  };
  scene.add(g);
  let T = 0;
  return {
    update(dt) {
      T += dt;
      for (const b of birds) { const u = b.userData; b.position.addScaledVector(u.v, dt); const f = Math.sin(T * 18 + u.ph) * .7; u.l.rotation.z = f; u.r.rotation.z = -f; }
      for (let i = guests.length - 1; i >= 0; i--) {
        const q = guests[i], o = q.obj; q.life -= dt; o.position.addScaledVector(q.vel, dt);
        if (q.kind === 'jet') { o.userData.strobe.material.opacity = Math.sin(T * 14) > .6 ? 1 : .1; const back = o.position.clone().addScaledVector(q.vel.clone().normalize(), -9); emit(back.x, back.y, back.z, rand(-1, 1), rand(-.5, .5), rand(-1, 1), '#ffffff', .6, .9, 0, 1); }
        else if (q.kind === 'sekza') { const f = Math.sin(T * 16) * .8; for (const [piv, sd] of o.userData.wings) piv.rotation.z = sd * f; o.position.y += Math.sin(T * 6) * .02; const back = o.position.clone().addScaledVector(q.vel.clone().normalize(), -3); emit(back.x, back.y, back.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), '#ffd27a', .3, .5, 0, 1); }
        else { o.rotation.y += dt * 2; o.userData.lights.forEach((l, k) => { l.material.opacity = Math.sin(T * 9 + k) > 0 ? 1 : .15; }); o.position.y += Math.sin(T * 5) * .05; }
        if (q.life <= 0) { g.remove(o); guests.splice(i, 1); }
      }
    },
    // tipo: 'jet' | 'sekza' | 'ufo'; cam = posición de la cámara, mirar = hacia dónde mira, lado = +1/-1 (de dónde entra)
    spawn(kind, cam, mirar, lado) {
      const o = kind === 'jet' ? makeJet() : kind === 'sekza' ? makeSekza() : makeUfo(), fw = mirar.clone().sub(cam).normalize(), rt = new V3().crossVectors(fw, new V3(0, 1, 0)).normalize();
      const speed = kind === 'jet' ? 150 : kind === 'sekza' ? 100 : 70, dist = kind === 'jet' ? 52 : kind === 'sekza' ? 34 : 46;
      o.position.copy(cam).addScaledVector(fw, dist).addScaledVector(rt, -lado * 62).add(new V3(0, rand(-4, 9), 0));
      const vel = rt.clone().multiplyScalar(lado * speed); if (kind !== 'ufo') o.quaternion.setFromUnitVectors(new V3(0, 0, 1), vel.clone().normalize());
      if (kind === 'sekza') o.rotation.x += 0;
      g.add(o); guests.push({ obj: o, kind, vel, life: 62 * 2 / speed + .4 });
    },
    dispose() { scene.remove(g); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose()); },
  };
};
