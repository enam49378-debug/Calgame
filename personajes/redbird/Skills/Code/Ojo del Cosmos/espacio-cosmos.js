/* Escena del espacio de "Ojo del Cosmos" (personaje: redbird)
   La Tierra tiene estilo anime (sombreado por bandas, contorno oscuro, borde de atmósfera, océano brillante y costas turquesa)
   y el espacio es oscuro y apagado, más realista (Vía Láctea tenue, estrellas de varios colores, reflejo del sol).
   Se rompe UN trozo del planeta por donde sale el rayo. Se usa desde rbCosmos.js:
     const E = rbCosmosEspacio(origen);  E.update(s, dt, camPos);  E.dispose();
   Este archivo se carga antes que rbCosmos.js (orden alfabético), así que lo que declara aquí lo ve el otro. */
const rbCosmosEspacio = function (O) {
  const R = 45, CAP = .5, g = new THREE.Group();   // CAP = radio angular (en radianes) del trozo que se rompe
  g.position.copy(O);
  const mats = [], geos = [], texs = [];
  const track = (m) => { mats.push(m); return m; };
  const trackG = (x) => { geos.push(x); return x; };
  const dir = new V3(-.6, .42, .68).normalize();   // hacia dónde sale el rayo
  const sunDir = new V3(170, 70, 130).normalize();
  const pivot = new THREE.Group(); pivot.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir); g.add(pivot);   // el eje +Y del planeta apunta al rayo

  // ---- fondo: Vía Láctea muy tenue + estrellas de distintos colores y tamaños
  const mv = document.createElement('canvas'); mv.width = 1024; mv.height = 512; const m2 = mv.getContext('2d');
  m2.fillStyle = '#01020a'; m2.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 70; i++) {   // neblina azul-violeta a lo largo de una banda
    const x = rand(0, 1024), y = 256 + Math.sin(x / 1024 * TAU) * 95 + rand(-45, 45), r = rand(50, 140), gr = m2.createRadialGradient(x, y, 0, x, y, r);
    const a = rand(.025, .07); gr.addColorStop(0, i % 3 ? 'rgba(90,110,190,' + a + ')' : 'rgba(150,100,170,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); m2.fillStyle = gr; m2.beginPath(); m2.arc(x, y, r, 0, TAU); m2.fill();
  }
  for (let i = 0; i < 3200; i++) {   // polvo de estrellas concentrado en la banda
    const x = rand(0, 1024), y = 256 + Math.sin(x / 1024 * TAU) * 95 + (rand(-1, 1) + rand(-1, 1)) * 55;
    m2.fillStyle = 'rgba(255,255,255,' + rand(.08, .55) + ')'; m2.fillRect(x, y, rand(.5, 1.4), rand(.5, 1.4));
  }
  const mwTex = new THREE.CanvasTexture(mv); texs.push(mwTex);
  const sky = new THREE.Mesh(trackG(new THREE.SphereGeometry(330, 40, 24)), track(new THREE.MeshBasicMaterial({ map: mwTex, side: THREE.BackSide, depthWrite: false, fog: false })));
  sky.rotation.set(.5, 1.1, .3); g.add(sky);
  const N = 1500, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3), tint = [[1, 1, 1], [.75, .85, 1], [1, .88, .72], [.9, .92, 1]];
  for (let i = 0; i < N; i++) {
    const a = rand(0, TAU), b = Math.acos(rand(-1, 1)), r = rand(250, 320), t = tint[Math.floor(rand(0, tint.length))], br = Math.pow(rand(.15, 1), 1.6);
    sp[i * 3] = Math.sin(b) * Math.cos(a) * r; sp[i * 3 + 1] = Math.cos(b) * r; sp[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    sc[i * 3] = t[0] * br; sc[i * 3 + 1] = t[1] * br; sc[i * 3 + 2] = t[2] * br;
  }
  const sg = trackG(new THREE.BufferGeometry()); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  g.add(new THREE.Points(sg, track(new THREE.PointsMaterial({ size: 1.25, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, fog: false }))));
  // reflejo del sol (destello)
  const gv = document.createElement('canvas'); gv.width = gv.height = 256; const g2 = gv.getContext('2d'), gg = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
  gg.addColorStop(0, 'rgba(255,244,220,1)'); gg.addColorStop(.18, 'rgba(255,214,160,.55)'); gg.addColorStop(.5, 'rgba(255,170,110,.12)'); gg.addColorStop(1, 'rgba(255,140,90,0)'); g2.fillStyle = gg; g2.fillRect(0, 0, 256, 256);
  const glareTex = new THREE.CanvasTexture(gv); texs.push(glareTex);
  const glare = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glareTex, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  glare.position.copy(sunDir).multiplyScalar(300); glare.scale.set(150, 150, 1); g.add(glare);

  // ---- texturas de la Tierra: océano con degradado, costas turquesa, continentes, desiertos, hielo
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d');
  const grad = c.createLinearGradient(0, 0, 0, 512); grad.addColorStop(0, '#1d58b8'); grad.addColorStop(.5, '#1f6ad0'); grad.addColorStop(1, '#1d58b8');
  c.fillStyle = grad; c.fillRect(0, 0, 1024, 512);
  const land = ['#4fb04a', '#63c256', '#9ab84a', '#3a9a4a', '#7bc552'], blobs = [];
  for (let i = 0; i < 30; i++) {
    const cx = rand(0, 1024), cy = rand(70, 440), n = 6 + Math.floor(rand(0, 8)), col = land[Math.floor(rand(0, land.length))], parts = [];
    for (let j = 0; j < n; j++) parts.push([cx + rand(-70, 70), cy + rand(-34, 34), rand(14, 52)]);
    blobs.push({ col, parts });
  }
  c.shadowColor = '#6fe4ee'; c.shadowBlur = 30;   // aguas poco profundas junto a la costa
  for (const b of blobs) { c.fillStyle = b.col; for (const p of b.parts) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); } }
  c.shadowBlur = 0;
  for (const b of blobs) { c.fillStyle = b.col; for (const p of b.parts) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill(); } }
  for (let i = 0; i < 70; i++) {   // desiertos y zonas altas
    const b = blobs[Math.floor(rand(0, blobs.length))], p = b.parts[Math.floor(rand(0, b.parts.length))];
    c.fillStyle = i % 3 ? 'rgba(214,190,110,.55)' : 'rgba(40,110,60,.45)'; c.beginPath(); c.arc(p[0] + rand(-14, 14), p[1] + rand(-10, 10), rand(8, 22), 0, TAU); c.fill();
  }
  c.fillStyle = '#f6fbff'; c.shadowColor = '#ffffff'; c.shadowBlur = 14; c.fillRect(0, 0, 1024, 22); c.fillRect(0, 490, 1024, 22); c.shadowBlur = 0;
  for (let i = 0; i < 5200; i++) {   // relieve: manchas finas de vegetación y tierra
    const b = blobs[Math.floor(rand(0, blobs.length))], p = b.parts[Math.floor(rand(0, b.parts.length))], x = p[0] + rand(-p[2], p[2]), y = p[1] + rand(-p[2], p[2]);
    c.fillStyle = 'rgba(' + (30 + Math.floor(rand(0, 60))) + ',' + (70 + Math.floor(rand(0, 80))) + ',' + (30 + Math.floor(rand(0, 40))) + ',.22)'; c.fillRect(x, y, rand(1, 3), rand(1, 3));
  }
  const earthTex = new THREE.CanvasTexture(cv); texs.push(earthTex);
  const cvL = document.createElement('canvas'); cvL.width = 1024; cvL.height = 512; const cl = cvL.getContext('2d'); cl.fillStyle = '#000'; cl.fillRect(0, 0, 1024, 512);
  for (const b of blobs) for (const p of b.parts) for (let i = 0; i < 16; i++) { cl.fillStyle = 'rgba(255,' + Math.floor(170 + rand(0, 60)) + ',' + Math.floor(90 + rand(0, 50)) + ',' + rand(.5, 1) + ')'; cl.fillRect(p[0] + rand(-p[2], p[2]) * .8, p[1] + rand(-p[2], p[2]) * .6, 1.6, 1.6); }
  const lightsTex = new THREE.CanvasTexture(cvL); texs.push(lightsTex);
  const cv2 = document.createElement('canvas'); cv2.width = 1024; cv2.height = 512; const c2 = cv2.getContext('2d');
  for (let i = 0; i < 52; i++) {   // nubes esponjosas con sombra azul por debajo
    const x = rand(0, 1024), y = rand(40, 470), n = 4 + Math.floor(rand(0, 5)), parts = [];
    for (let j = 0; j < n; j++) parts.push([x + rand(-28, 28), y + rand(-8, 8), rand(7, 18)]);
    c2.fillStyle = 'rgba(150,185,235,.8)'; for (const p of parts) { c2.beginPath(); c2.arc(p[0], p[1] + 5, p[2], 0, TAU); c2.fill(); }
    c2.fillStyle = 'rgba(255,255,255,.96)'; for (const p of parts) { c2.beginPath(); c2.arc(p[0], p[1], p[2], 0, TAU); c2.fill(); }
  }
  const cloudTex = new THREE.CanvasTexture(cv2); texs.push(cloudTex);

  // ---- sombreado anime (por bandas) de la Tierra y de las nubes
  const VERT = 'varying vec2 vUv; varying vec3 vN; varying vec3 vW; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
  const earthMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: earthTex }, lights: { value: lightsTex }, L: { value: sunDir.clone() }, emi: { value: 0 } }, vertexShader: VERT,
    fragmentShader: `uniform sampler2D map, lights; uniform vec3 L; uniform float emi; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW), base = texture2D(map, vUv).rgb;
        float d = dot(N, normalize(L));
        float band = smoothstep(-.06, .06, d) * .5 + smoothstep(.22, .34, d) * .5;
        vec3 col = mix(base * vec3(.10, .15, .34), base * .92, band);
        col += vec3(1., .55, .25) * smoothstep(-.12, 0., d) * (1. - smoothstep(0., .16, d)) * .28;
        float ocean = step(.2, base.b - base.r) * step(base.g, base.b + .05);
        vec3 H = normalize(normalize(L) + V); float spec = pow(max(dot(N, H), 0.), 120.);
        col += vec3(1.) * step(.55, spec) * ocean * .65;
        float rim = pow(1. - max(dot(N, V), 0.), 3.);
        col += vec3(.35, .7, 1.) * rim * .6 * clamp(d * 2. + .5, 0., 1.);
        col += texture2D(lights, vUv).rgb * (1. - smoothstep(-.14, .06, d)) * 1.25;
        col += vec3(1., .3, .06) * emi;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const cloudMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: cloudTex }, L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec4 t = texture2D(map, vUv); vec3 N = normalize(vN); float d = dot(N, normalize(L));
        float band = smoothstep(-.05, .1, d) * .6 + smoothstep(.25, .4, d) * .4;
        vec3 col = mix(t.rgb * vec3(.18, .22, .4), t.rgb, band);
        gl_FragColor = vec4(col, t.a * .78);
      }`,
  }));
  const earth = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48)), earthMat);
  const clouds = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48)), cloudMat);
  // versiones con el casquete roto (falta un trozo de planeta donde sale el rayo)
  const earthB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48, 0, TAU, CAP, Math.PI - CAP)), earthMat);
  const cloudsB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat);
  earthB.visible = cloudsB.visible = false;
  // contorno oscuro (estilo anime) y atmósfera brillante en el borde
  const outline = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.02, 56, 36)), track(new THREE.MeshBasicMaterial({ color: 0x07163a, side: THREE.BackSide, fog: false })));
  const atmoMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float rim = pow(1. - abs(dot(N, V)), 3.2), sun = clamp(dot(N, normalize(L)) * .8 + .5, 0., 1.);
        vec3 col = mix(vec3(.18, .45, 1.), vec3(.65, .92, 1.), rim) * rim * 1.7 * (.3 + .7 * sun);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const halo = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.12, 56, 36)), atmoMat);
  // magma que se ve por el agujero, y borde incandescente
  const magma = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * .96, 40, 28)), track(new THREE.MeshBasicMaterial({ color: 0xff4a12, fog: false })));
  const rimR = R * Math.sin(CAP), rim = new THREE.Mesh(trackG(new THREE.TorusGeometry(rimR, 1.1, 8, 64)), track(new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  rim.rotation.x = Math.PI / 2; rim.position.y = R * Math.cos(CAP); rim.visible = false;
  pivot.add(earth, clouds, earthB, cloudsB, magma, rim); magma.visible = false;
  g.add(outline, halo);
  const sunL = new THREE.DirectionalLight(0xfff2dc, 1.15); sunL.position.copy(sunDir).multiplyScalar(220); g.add(sunL, sunL.target);
  g.add(new THREE.AmbientLight(0x3a4f7a, .3));

  // ---- grietas rojas alrededor del trozo que se romperá
  const pts = [];
  for (let i = 0; i < 46; i++) {
    const th = rand(.05, CAP * 1.9), ph = rand(0, TAU);
    let p = new V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).normalize(), prev = p.clone().multiplyScalar(R * 1.006);
    for (let j = 0; j < 8; j++) {
      p = p.clone().add(new V3(rand(-.14, .14), rand(-.14, .14), rand(-.14, .14))).normalize();
      const q = p.clone().multiplyScalar(R * 1.006); pts.push(prev.x, prev.y, prev.z, q.x, q.y, q.z); prev = q;
    }
  }
  const lg = trackG(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3)); lg.setDrawRange(0, 0);
  const cracks = new THREE.LineSegments(lg, track(new THREE.LineBasicMaterial({ color: 0xff5a22, transparent: true, opacity: 1, fog: false })));
  pivot.add(cracks);
  const total = pts.length / 3;

  // ---- rayo, onda de choque y pedazos
  const cylG = trackG(new THREE.CylinderGeometry(1, 1, 1, 30, 1, true)); cylG.rotateX(Math.PI / 2); cylG.translate(0, 0, .5);
  const beam = new THREE.Group(), bOut = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xff2a1f, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  const bIn = new THREE.Mesh(cylG, track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, depthWrite: false, side: THREE.DoubleSide, fog: false })));
  beam.add(bOut, bIn); beam.visible = false; beam.position.copy(dir).multiplyScalar(R * .9); beam.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir); g.add(beam);
  const ring = new THREE.Mesh(trackG(new THREE.RingGeometry(.92, 1, 72)), track(new THREE.MeshBasicMaterial({ color: 0xffd0a0, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  ring.position.copy(dir).multiplyScalar(R); g.add(ring);
  const frags = [], fcols = [0x2a62c0, 0x3f8a3a, 0x7a6a3c, 0xeef4ff, 0x264f9c], fgeo = trackG(new THREE.DodecahedronGeometry(1, 0)), fmats = fcols.map(col => track(new THREE.MeshLambertMaterial({ color: col, emissive: 0x3a0800 })));
  for (let i = 0; i < 140; i++) {
    const th = rand(0, CAP * .95), ph = rand(0, TAU), loc = new V3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyQuaternion(pivot.quaternion);
    const m = new THREE.Mesh(fgeo, fmats[i % fmats.length]), s = rand(1.8, 6.5);
    m.position.copy(loc).multiplyScalar(R * rand(.8, 1)); m.scale.set(s, s * rand(.5, 1), s * rand(.6, 1)); m.visible = false;
    m.userData = { v: loc.clone().multiplyScalar(rand(18, 60)).addScaledVector(dir, rand(10, 40)).add(new V3(rand(-6, 6), rand(-6, 6), rand(-6, 6))), r: new V3(rand(-1.4, 1.4), rand(-1.4, 1.4), rand(-1.4, 1.4)) };
    frags.push(m); g.add(m);
  }
  // ---- explosión: resplandor del cráter, bola de fuego, humo, chispas y onda de choque que recorre el planeta
  const craterPos = dir.clone().multiplyScalar(R * 1.02);
  const sprMat = (color, op, additive) => track(new THREE.SpriteMaterial({ map: glareTex, color, transparent: true, opacity: op, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false, fog: false }));
  const craterGlow = new THREE.Sprite(sprMat(0xff7a2a, 0, true)); craterGlow.position.copy(craterPos); g.add(craterGlow);
  const flashS = new THREE.Sprite(sprMat(0xffffff, 0, true)); flashS.position.copy(craterPos); g.add(flashS);
  const puffs = [];
  for (let i = 0; i < 34; i++) {
    const fire = i % 3 === 0, sp = new THREE.Sprite(sprMat(fire ? 0xffa040 : 0x3a312c, 0, fire)); sp.position.copy(craterPos); sp.visible = false;
    sp.userData = { v: dir.clone().multiplyScalar(rand(10, 34)).add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(11)), life: rand(2.2, 4.2), delay: rand(0, .5), s0: rand(6, 14), s1: rand(26, 60), fire };
    puffs.push(sp); g.add(sp);
  }
  const SN = 650, sPos = new Float32Array(SN * 3), sCol = new Float32Array(SN * 3), sVel = new Float32Array(SN * 3), sLife = new Float32Array(SN), sMax = new Float32Array(SN);
  const bu = new V3(0, 1, 0).cross(dir).normalize(), bw = dir.clone().cross(bu);
  for (let i = 0; i < SN; i++) {
    const ph = rand(0, TAU), rr = Math.pow(rand(0, 1), .6), sp = rand(40, 150), lat = rand(10, 75) * rr;
    sVel[i * 3] = dir.x * sp + (bu.x * Math.cos(ph) + bw.x * Math.sin(ph)) * lat; sVel[i * 3 + 1] = dir.y * sp + (bu.y * Math.cos(ph) + bw.y * Math.sin(ph)) * lat; sVel[i * 3 + 2] = dir.z * sp + (bu.z * Math.cos(ph) + bw.z * Math.sin(ph)) * lat;
    sPos[i * 3] = craterPos.x; sPos[i * 3 + 1] = craterPos.y; sPos[i * 3 + 2] = craterPos.z; sMax[i] = rand(1.4, 4); sLife[i] = -1;
  }
  const spG = trackG(new THREE.BufferGeometry()); spG.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); spG.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
  const sparks = new THREE.Points(spG, track(new THREE.PointsMaterial({ size: 3.4, map: glareTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false })));
  sparks.frustumCulled = false; sparks.visible = false; g.add(sparks);
  const shock = new THREE.Mesh(trackG(new THREE.RingGeometry(.9, 1, 96)), track(new THREE.MeshBasicMaterial({ color: 0xffc890, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  shock.position.copy(craterPos); shock.quaternion.setFromUnitVectors(new V3(0, 0, 1), dir); shock.visible = false; g.add(shock);
  scene.add(g);

  let boomed = false, boomT = 0;
  const api = {
    group: g, origin: O, dir, radius: R, boomed: () => boomed,
    // s = segundos desde que empieza la escena del espacio
    update(s, dt, camPos) {
      earth.rotation.y += dt * .05; clouds.rotation.y += dt * .068; earthB.rotation.y = earth.rotation.y; cloudsB.rotation.y = clouds.rotation.y;
      sky.rotation.y += dt * .004;
      if (!boomed) {
        const k = clamp((s - .35) / 1.7, 0, 1);
        lg.setDrawRange(0, Math.floor(total * k / 2) * 2);
        cracks.material.opacity = .55 + .45 * Math.abs(Math.sin(s * 14));
        craterGlow.material.opacity = k * .6 * (.8 + .2 * Math.sin(s * 20)); craterGlow.scale.setScalar(R * (.4 + k * .7));
        earthMat.uniforms.emi.value = .32 * k * k * (.8 + .2 * Math.sin(s * 22));
        if (s > 2.2) {
          boomed = true; boomT = s; earth.visible = false; clouds.visible = false; earthB.visible = cloudsB.visible = true; magma.visible = true; rim.visible = true; cracks.visible = false;
          frags.forEach(m => { m.visible = true; }); beam.visible = true; earthMat.uniforms.emi.value = .06;
          sparks.visible = true; shock.visible = true; for (let i = 0; i < SN; i++) sLife[i] = 0;
        }
        return;
      }
      const b = s - boomT;
      const w = 4.5 + Math.min(b, 1.2) * 6 + Math.sin(s * 40) * .7;
      bOut.scale.set(w * 1.8, w * 1.8, 700); bIn.scale.set(w * .6, w * .6, 700);
      beam.rotateZ(dt * 4); rim.material.opacity = .75 + .25 * Math.sin(s * 18);
      for (const m of frags) { const u = m.userData; m.position.addScaledVector(u.v, dt); m.rotation.x += u.r.x * dt; m.rotation.y += u.r.y * dt; m.rotation.z += u.r.z * dt; u.v.multiplyScalar(1 - dt * .12); }
      const rs = 1 + b * 90; ring.scale.setScalar(rs); ring.material.opacity = Math.max(0, .9 - b * .5);
      if (camPos) ring.lookAt(camPos);
      // bola de fuego y resplandor
      flashS.material.opacity = Math.max(0, 1 - b * 2.2); flashS.scale.setScalar(R * (1.2 + b * 2.4));
      craterGlow.material.opacity = Math.max(.15, .8 * Math.max(0, 1 - b * .16)) * (.88 + .12 * Math.sin(s * 17)); craterGlow.scale.setScalar(R * (1 + .1 * Math.sin(s * 9)));
      // gas y humo del cráter
      for (const sp of puffs) {
        const u = sp.userData, lt = b - u.delay; if (lt < 0) continue; const k = lt / u.life;
        if (k >= 1) { sp.visible = false; continue; } sp.visible = true; sp.position.addScaledVector(u.v, dt); u.v.multiplyScalar(1 - dt * .45);
        sp.scale.setScalar(u.s0 + (u.s1 - u.s0) * Math.sqrt(k)); sp.material.opacity = (u.fire ? .75 : .5) * (1 - k) * Math.min(1, lt * 4);
      }
      // chispas incandescentes
      for (let i = 0; i < SN; i++) {
        sLife[i] += dt; const k = sLife[i] / sMax[i];
        if (k >= 1) { sCol[i * 3] = sCol[i * 3 + 1] = sCol[i * 3 + 2] = 0; continue; }
        sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt;
        const fade = Math.pow(1 - k, 1.6); sCol[i * 3] = fade; sCol[i * 3 + 1] = fade * (.85 - .6 * k); sCol[i * 3 + 2] = fade * Math.max(0, .45 - k);
      }
      spG.attributes.position.needsUpdate = true; spG.attributes.color.needsUpdate = true;
      // onda de choque que recorre la superficie
      shock.scale.setScalar(1 + b * R * .75); shock.material.opacity = Math.max(0, .85 - b * .33);
    },
    dispose() {
      scene.remove(g);
      mats.forEach(m => m.dispose()); geos.forEach(x => x.dispose()); texs.forEach(t => t.dispose());
    },
  };
  return api;
};
