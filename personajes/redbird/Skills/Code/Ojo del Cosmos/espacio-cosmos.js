/* Escena del espacio de "Ojo del Cosmos" (personaje: redbird)
   Construye la Tierra, las estrellas y la explosión del planeta en un grupo de three.js lejos de la ciudad.
   Se usa desde rbCosmos.js:  const E = rbCosmosEspacio(origen);  E.update(s, dt);  E.dispose();
   Este archivo se carga antes que rbCosmos.js (orden alfabético), así que lo que declara aquí lo ve el otro. */
const rbCosmosEspacio = function (O) {
  const R = 45, g = new THREE.Group();
  g.position.copy(O);
  const mats = [], geos = [], texs = [];
  const track = (m) => { mats.push(m); return m; };
  const trackG = (x) => { geos.push(x); return x; };

  // ---- estrellas
  const N = 1100, sp = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = rand(0, TAU), b = Math.acos(rand(-1, 1)), r = rand(260, 340);
    sp[i * 3] = Math.sin(b) * Math.cos(a) * r; sp[i * 3 + 1] = Math.cos(b) * r; sp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
  }
  const sg = trackG(new THREE.BufferGeometry()); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  g.add(new THREE.Points(sg, track(new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: true, transparent: true, opacity: .95, depthWrite: false, fog: false }))));

  // ---- textura de la Tierra (océano, continentes, casquetes)
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const grad = c.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, '#2a6fd6'); grad.addColorStop(.5, '#1c56b5'); grad.addColorStop(1, '#2a6fd6');
  c.fillStyle = grad; c.fillRect(0, 0, 1024, 512);
  const land = ['#3d8b3b', '#4f9d44', '#8c7b46', '#2f7a36', '#6b9a3f'];
  for (let i = 0; i < 46; i++) {
    const cx = rand(0, 1024), cy = rand(60, 450), n = 6 + Math.floor(rand(0, 8)); c.fillStyle = land[Math.floor(rand(0, land.length))];
    for (let j = 0; j < n; j++) { c.beginPath(); c.arc(cx + rand(-70, 70), cy + rand(-34, 34), rand(14, 52), 0, TAU); c.fill(); }
  }
  c.fillStyle = '#f3f8ff'; c.fillRect(0, 0, 1024, 24); c.fillRect(0, 488, 1024, 24);
  const earthTex = new THREE.CanvasTexture(cv); texs.push(earthTex);
  const cv2 = document.createElement('canvas'); cv2.width = 1024; cv2.height = 512; const c2 = cv2.getContext('2d');
  for (let i = 0; i < 150; i++) {
    const x = rand(0, 1024), y = rand(30, 480), r = rand(18, 70), gr = c2.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.62)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = gr; c2.beginPath(); c2.ellipse(x, y, r * 1.5, r * .7, 0, 0, TAU); c2.fill();
  }
  const cloudTex = new THREE.CanvasTexture(cv2); texs.push(cloudTex);
  const earth = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 64, 44)), track(new THREE.MeshLambertMaterial({ map: earthTex, emissive: 0x000000 })));
  const clouds = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.014, 64, 44)), track(new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, depthWrite: false })));
  const halo = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.09, 48, 32)), track(new THREE.MeshBasicMaterial({ color: 0x6fb2ff, transparent: true, opacity: .2, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  g.add(earth, clouds, halo);
  const sunL = new THREE.DirectionalLight(0xfff2dc, 1.15); sunL.position.set(170, 70, 130); g.add(sunL, sunL.target);
  const amb = new THREE.AmbientLight(0x3a4f7a, .32); g.add(amb);

  // ---- grietas rojas que se van abriendo
  const pts = [];
  for (let i = 0; i < 70; i++) {
    let p = new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), prev = p.clone().multiplyScalar(R * 1.004);
    for (let j = 0; j < 9; j++) {
      p = p.clone().add(new V3(rand(-.16, .16), rand(-.16, .16), rand(-.16, .16))).normalize();
      const q = p.clone().multiplyScalar(R * 1.004); pts.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q;
    }
  }
  const lg = trackG(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3)); lg.setDrawRange(0, 0);
  const cracks = new THREE.LineSegments(lg, track(new THREE.LineBasicMaterial({ color: 0xff4a1f, transparent: true, opacity: 1, fog: false })));
  g.add(cracks);
  const total = pts.length / 3;

  // ---- núcleo, rayo, onda de choque y pedazos
  const core = new THREE.Mesh(trackG(new THREE.SphereGeometry(1, 24, 18)), track(new THREE.MeshBasicMaterial({ color: 0xffe0c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  g.add(core);
  const cylG = trackG(new THREE.CylinderGeometry(1, 1, 1, 30, 1, true)); cylG.rotateX(Math.PI / 2); cylG.translate(0, 0, .5);
  const dir = new V3(-.6, .42, .68).normalize();
  const beam = new THREE.Group(), bOut = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xff2a1f, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  const bIn = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  beam.add(bOut, bIn); beam.visible = false; g.add(beam); beam.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir);
  const ring = new THREE.Mesh(trackG(new THREE.RingGeometry(.92, 1, 72)), track(new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  g.add(ring);
  const frags = [], fcols = [0x2a62c0, 0x3f8a3a, 0x7a6a3c, 0xeef4ff, 0x264f9c], fgeo = trackG(new THREE.BoxGeometry(1, 1, 1)), fmats = fcols.map(col => track(new THREE.MeshLambertMaterial({ color: col, emissive: 0x3a0800 })));
  for (let i = 0; i < 170; i++) {
    const d = new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize(), m = new THREE.Mesh(fgeo, fmats[i % fmats.length]), s = rand(1.6, 6.5);
    m.position.copy(d).multiplyScalar(R * rand(.2, 1)); m.scale.set(s, s * rand(.5, 1), s * rand(.6, 1)); m.visible = false;
    m.userData = { v: d.clone().multiplyScalar(rand(14, 62)).add(new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6))), r: new V3(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4)) };
    frags.push(m); g.add(m);
  }
  scene.add(g);

  let boomed = false, boomT = 0;
  const api = {
    group: g, origin: O, dir, boomed: () => boomed,
    // s = segundos desde que empieza la escena del espacio
    update(s, dt, camPos) {
      earth.rotation.y += dt * .05; clouds.rotation.y += dt * .07;
      if (!boomed) {
        const k = clamp((s - .35) / 1.7, 0, 1);
        lg.setDrawRange(0, Math.floor(total * k / 2) * 2);
        cracks.material.opacity = .55 + .45 * Math.abs(Math.sin(s * 14));
        const glow = k * k; earth.material.emissive.setRGB(.5 * glow, .1 * glow, .02 * glow);
        core.material.opacity = k * .55; core.scale.setScalar(R * .05 + R * .5 * k * k);
        if (s > 2.2) {
          boomed = true; boomT = s; earth.visible = false; clouds.visible = false; halo.visible = false; cracks.visible = false;
          frags.forEach(m => { m.visible = true; }); beam.visible = true; core.material.opacity = 1;
        }
        return;
      }
      const b = s - boomT;
      core.scale.setScalar(R * (.55 + b * .5)); core.material.opacity = Math.max(0, 1 - b * .22);
      const w = 5 + Math.min(b, 1.2) * 7 + Math.sin(s * 40) * .8;
      bOut.scale.set(w * 1.8, w * 1.8, 700); bIn.scale.set(w * .6, w * .6, 700);
      beam.rotateZ(dt * 4);
      for (const m of frags) { const u = m.userData; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt; m.rotation.z += u.r.z * dt; u.v.multiplyScalar(1 - dt * .12); }
      const rs = 1 + b * 120; ring.scale.setScalar(rs); ring.material.opacity = Math.max(0, .9 - b * .45);
      if (camPos) ring.lookAt(camPos);
    },
    dispose() {
      scene.remove(g);
      mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose());
    },
  };
  return api;
};
