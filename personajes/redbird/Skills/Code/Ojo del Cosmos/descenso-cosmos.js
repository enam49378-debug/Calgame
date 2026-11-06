/* Descenso de "Ojo del Cosmos" (personaje: redbird): al entrar en la atmósfera la cámara baja a toda velocidad
   atravesando nubes y pájaros hasta llegar a Redbird. Esto crea esas nubes y pájaros en el mundo real.
   Uso desde rbCosmos.js:  const D = rbCosmosDescenso(posRedbird);  D.update(dt);  D.dispose(); */
const rbCosmosDescenso = function (P) {
  const g = new THREE.Group(), mats = [], geos = [], texs = [];
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
  scene.add(g);
  let T = 0;
  return {
    update(dt) {
      T += dt;
      for (const b of birds) { const u = b.userData; b.position.addScaledVector(u.v, dt); const f = Math.sin(T * 18 + u.ph) * .7; u.l.rotation.z = f; u.r.rotation.z = -f; }
    },
    dispose() { scene.remove(g); mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose()); },
  };
};
