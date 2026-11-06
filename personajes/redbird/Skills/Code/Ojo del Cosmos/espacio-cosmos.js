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
    uniforms: { map: { value: earthTex }, lights: { value: lightsTex }, L: { value: sunDir.clone() }, emi: { value: 0 }, time: { value: 0 } }, vertexShader: VERT,
    fragmentShader: `uniform sampler2D map, lights; uniform vec3 L; uniform float emi, time; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW), base = texture2D(map, vUv).rgb;
        float d = dot(N, normalize(L));
        float band = smoothstep(-.06, .06, d) * .5 + smoothstep(.22, .34, d) * .5;
        vec3 col = mix(base * vec3(.10, .15, .34), base * .92, band);
        col += vec3(1., .55, .25) * smoothstep(-.12, 0., d) * (1. - smoothstep(0., .16, d)) * .28;
        float ocean = step(.2, base.b - base.r) * step(base.g, base.b + .05);
        vec3 H = normalize(normalize(L) + V); float spec = pow(max(dot(N, H), 0.), 120.) * (.55 + .45 * sin(vUv.x * 620. + time * 2.1) * sin(vUv.y * 380. - time * 1.7));
        col += vec3(1.) * step(.55, spec) * ocean * .65;
        float rim = pow(1. - max(dot(N, V), 0.), 3.);
        col += vec3(.35, .7, 1.) * rim * .6 * clamp(d * 2. + .5, 0., 1.);
        col += texture2D(lights, vUv).rgb * (1. - smoothstep(-.14, .06, d)) * 1.25;
        col += vec3(1., .3, .06) * emi;
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const cloudMat = track(new THREE.ShaderMaterial({
    uniforms: { map: { value: cloudTex }, L: { value: sunDir.clone() }, off: { value: 0 }, mul: { value: 1 } }, vertexShader: VERT, transparent: true, depthWrite: false,
    fragmentShader: `uniform sampler2D map; uniform vec3 L; uniform float off, mul; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec4 t = texture2D(map, vUv + vec2(off, 0.)); vec3 N = normalize(vN); float d = dot(N, normalize(L));
        float band = smoothstep(-.05, .1, d) * .6 + smoothstep(.25, .4, d) * .4;
        vec3 col = mix(t.rgb * vec3(.18, .22, .4), t.rgb, band);
        gl_FragColor = vec4(col, t.a * .78 * mul);
      }`,
  }));
  const cloudMat2 = track(cloudMat.clone()); cloudMat2.uniforms = { map: { value: cloudTex }, L: { value: sunDir.clone() }, off: { value: .37 }, mul: { value: .5 } };
  const earth = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48)), earthMat);
  const clouds = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48)), cloudMat);
  // versiones con el casquete roto (falta un trozo de planeta donde sale el rayo)
  const earthB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R, 72, 48, 0, TAU, CAP, Math.PI - CAP)), earthMat);
  const cloudsB = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.016, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat);
  const clouds2 = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.03, 72, 48)), cloudMat2);
  const clouds2B = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.03, 72, 48, 0, TAU, CAP, Math.PI - CAP)), cloudMat2);
  earthB.visible = cloudsB.visible = clouds2B.visible = false;
  // contorno oscuro (estilo anime) y atmósfera brillante en el borde
  const outline = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.02, 56, 36)), track(new THREE.MeshBasicMaterial({ color: 0x07163a, side: THREE.BackSide, fog: false })));
  const atmoMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() } }, vertexShader: VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    fragmentShader: `uniform vec3 L; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
        float rim = pow(1. - abs(dot(N, V)), 3.2), sun = clamp(dot(N, normalize(L)) * .8 + .5, 0., 1.);
        vec3 col = mix(vec3(.18, .45, 1.), vec3(.65, .92, 1.), rim) * rim * 1.7 * (.3 + .7 * sun);
        float term = clamp(1. - abs(dot(N, normalize(L))) * 3.2, 0., 1.); col = mix(col, vec3(1., .5, .22) * rim * 1.5, term * .6);
        gl_FragColor = vec4(col, 1.);
      }`,
  }));
  const halo = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.12, 56, 36)), atmoMat);
  // magma que se ve por el agujero, y borde incandescente
  const magma = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * .96, 40, 28)), track(new THREE.MeshBasicMaterial({ color: 0xff4a12, fog: false })));
  const rimR = R * Math.sin(CAP), rim = new THREE.Mesh(trackG(new THREE.TorusGeometry(rimR, 1.1, 8, 64)), track(new THREE.MeshBasicMaterial({ color: 0xff7a22, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })));
  rim.rotation.x = Math.PI / 2; rim.position.y = R * Math.cos(CAP); rim.visible = false;
  pivot.add(earth, clouds, clouds2, earthB, cloudsB, clouds2B, magma, rim); magma.visible = false;
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
  // ---- el vecindario: Luna, Marte, Venus, Júpiter y Saturno (más lejos cuanto más grandes se ven) y satélites en órbita
  const ptex = (draw) => { const c9 = document.createElement('canvas'); c9.width = 512; c9.height = 256; const x = c9.getContext('2d'); draw(x); const t = new THREE.CanvasTexture(c9); texs.push(t); return t; };
  const planet = (r, pos, tex, tilt) => { const m = new THREE.Mesh(trackG(new THREE.SphereGeometry(r, 44, 30)), track(new THREE.MeshLambertMaterial({ map: tex, emissive: 0x060606 }))); m.position.copy(pos); m.rotation.z = tilt || 0; g.add(m); return m; };
  const moonTex = ptex(x => {
    x.fillStyle = '#9b9ba2'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 120; i++) { const cx = rand(0, 512), cy = rand(10, 246), r = rand(3, 24), gr = x.createRadialGradient(cx, cy, r * .15, cx, cy, r); gr.addColorStop(0, 'rgba(70,70,78,.7)'); gr.addColorStop(.85, 'rgba(110,110,118,.5)'); gr.addColorStop(1, 'rgba(210,210,220,.35)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
    for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(60,60,70,.28)'; x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(20, 60), rand(10, 30), 0, 0, TAU); x.fill(); }
  });
  const marsTex = ptex(x => {
    x.fillStyle = '#b6552f'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 70; i++) { x.fillStyle = i % 2 ? 'rgba(110,40,22,.45)' : 'rgba(225,140,95,.35)'; x.beginPath(); x.ellipse(rand(0, 512), rand(20, 236), rand(14, 70), rand(8, 30), rand(0, 3), 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.9)'; x.fillRect(0, 0, 512, 12); x.fillRect(0, 246, 512, 10);
  });
  const jupTex = ptex(x => {
    const cols = ['#d8b58c', '#b98456', '#ead6b2', '#a76b40', '#cfa070', '#efe0c4']; let y0 = 0;
    while (y0 < 256) { const h = rand(10, 26); x.fillStyle = cols[Math.floor(rand(0, cols.length))]; x.fillRect(0, y0, 512, h + 1); y0 += h; }
    for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.ellipse(rand(0, 512), rand(0, 256), rand(30, 120), rand(1, 4), 0, 0, TAU); x.fill(); }
    x.fillStyle = 'rgba(190,70,40,.85)'; x.beginPath(); x.ellipse(340, 160, 26, 14, 0, 0, TAU); x.fill();
  });
  const venTex = ptex(x => { x.fillStyle = '#e9d7a2'; x.fillRect(0, 0, 512, 256); for (let i = 0; i < 80; i++) { x.fillStyle = i % 2 ? 'rgba(255,250,225,.25)' : 'rgba(200,170,110,.22)'; x.beginPath(); x.ellipse(rand(0, 512), rand(0, 256), rand(40, 130), rand(3, 12), rand(-.3, .3), 0, TAU); x.fill(); } });
  const satTex = ptex(x => { const cols = ['#dcc48a', '#c9ad70', '#e8d6a6', '#b89a5e']; let y0 = 0; while (y0 < 256) { const h = rand(8, 20); x.fillStyle = cols[Math.floor(rand(0, cols.length))]; x.fillRect(0, y0, 512, h + 1); y0 += h; } });
  const moon = planet(20, new V3(-55, 15, -151), moonTex), mars = planet(9, new V3(-205, 38, -35), marsTex), venus = planet(13, new V3(-130, 75, -340), venTex, .1), jup = planet(75, new V3(-330, -30, -330), jupTex, .05), sat = planet(48, new V3(-470, 90, 20), satTex, .35);
  const rv = document.createElement('canvas'); rv.width = 512; rv.height = 8; const rx = rv.getContext('2d');
  for (let i = 0; i < 512; i++) { const k = i / 512, a = (k > .08 && k < .93) ? (.35 + .55 * Math.abs(Math.sin(k * 38))) * (k > .45 && k < .52 ? .1 : 1) : 0; rx.fillStyle = 'rgba(225,205,160,' + a + ')'; rx.fillRect(i, 0, 1, 8); }
  const ringTex = new THREE.CanvasTexture(rv); texs.push(ringTex);
  const rg = trackG(new THREE.RingGeometry(1.3, 2.3, 96)), rp = rg.attributes.position, ruv = rg.attributes.uv;
  for (let i = 0; i < rp.count; i++) { const rr = Math.hypot(rp.getX(i), rp.getY(i)); ruv.setXY(i, (rr - 1.3) / 1.0, .5); }
  const ring2 = new THREE.Mesh(rg, track(new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false })));
  ring2.scale.setScalar(48); ring2.rotation.x = Math.PI / 2 - .45; sat.add(ring2); ring2.position.set(0, 0, 0);
  // satélites: una estación grande y varios pequeños con luces parpadeantes
  const sats = [], panelM = track(new THREE.MeshLambertMaterial({ color: 0x2a4f9a, emissive: 0x0a1a3a })), hullM = track(new THREE.MeshLambertMaterial({ color: 0xcfd3d8, emissive: 0x111111 })), boxG = trackG(new THREE.BoxGeometry(1, 1, 1));
  const mkSat = (scale, rad, incl, yaw0, speed, phase, big) => {
    const sg = new THREE.Group(), body = new THREE.Mesh(boxG, hullM); body.scale.set(big ? 3.4 : 1.6, big ? 1.3 : 1, big ? 1.3 : 1); sg.add(body);
    for (const sd of [-1, 1]) { const pn = new THREE.Mesh(boxG, panelM); pn.scale.set(big ? 5.5 : 2.6, .08, big ? 2.4 : 1.4); pn.position.set(sd * (big ? 5 : 2.4), 0, 0); sg.add(pn); if (big) { const pn2 = new THREE.Mesh(boxG, panelM); pn2.scale.set(5.5, .08, 2.4); pn2.position.set(sd * 5, 0, 3.2); sg.add(pn2); } }
    const an = new THREE.Mesh(boxG, hullM); an.scale.set(.1, .1, big ? 3 : 1.6); an.position.set(0, .6, big ? 2 : 1); sg.add(an);
    const light = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glareTex, color: big ? 0xff4040 : 0x40ff90, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))); light.scale.setScalar(big ? 7 : 4); light.position.y = .7; sg.add(light);
    sg.scale.setScalar(scale); g.add(sg); sats.push({ sg, rad, incl, yaw0, speed, phase, light });
  };
  mkSat(2.4, R * 1.3, .5, .3, .35, 0, true); mkSat(1.2, R * 1.22, 1.15, 2.1, -.5, 1.6); mkSat(1.1, R * 1.4, .2, 4, .28, 3.2); mkSat(1, R * 1.18, 1.4, 5.5, .6, 4.5); mkSat(1.1, R * 1.5, .85, 1.2, -.22, 5.4);
  // polvo cósmico: da profundidad cuando la cámara se mueve
  const DN = 320, dPos = new Float32Array(DN * 3), dVel = new Float32Array(DN * 3);
  for (let i = 0; i < DN; i++) { dPos[i * 3] = rand(-170, 170); dPos[i * 3 + 1] = rand(-90, 90); dPos[i * 3 + 2] = rand(-170, 170); dVel[i * 3] = rand(-1.2, 1.2); dVel[i * 3 + 1] = rand(-.6, .6); dVel[i * 3 + 2] = rand(-1.2, 1.2); }
  const dG = trackG(new THREE.BufferGeometry()); dG.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  g.add(new THREE.Points(dG, track(new THREE.PointsMaterial({ color: 0xbcc8e0, size: .9, transparent: true, opacity: .4, depthWrite: false, sizeAttenuation: true, fog: false }))));
  // auroras en los polos (se apagan al agrietarse el planeta)
  const auroraMat = track(new THREE.ShaderMaterial({
    uniforms: { L: { value: sunDir.clone() }, time: { value: 0 }, fade: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vLN; varying vec3 vN; varying vec3 vW; void main(){ vLN = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 L; uniform float time, fade; varying vec3 vLN; varying vec3 vN; varying vec3 vW;
      void main(){
        float lat = abs(vLN.y), band = smoothstep(.66, .8, lat) * (1. - smoothstep(.88, .97, lat));
        float ang = atan(vLN.x, vLN.z), cur = .5 + .5 * sin(ang * 9. + time * .9 + sin(ang * 4. - time * .5) * 2.) * sin(ang * 17. - time * 1.3 + lat * 25.);
        float night = 1. - smoothstep(-.12, .22, dot(normalize(vN), normalize(L)));
        float view = pow(clamp(1. - abs(dot(normalize(vN), normalize(cameraPosition - vW))), 0., 1.), .6);
        vec3 col = mix(vec3(.15, 1., .5), vec3(.55, .3, 1.), smoothstep(.2, .9, cur + (lat - .75) * 2.));
        gl_FragColor = vec4(col * band * cur * night * view * 1.6 * fade, 1.);
      }`,
  }));
  const aurora = new THREE.Mesh(trackG(new THREE.SphereGeometry(R * 1.04, 64, 40)), auroraMat); pivot.add(aurora);
  // destello alargado (anamórfico) del sol y del cráter
  const av = document.createElement('canvas'); av.width = 512; av.height = 64; const ax = av.getContext('2d'), ag = ax.createRadialGradient(256, 32, 0, 256, 32, 256); ag.addColorStop(0, 'rgba(255,255,255,1)'); ag.addColorStop(.12, 'rgba(255,230,190,.7)'); ag.addColorStop(1, 'rgba(255,200,150,0)');
  ax.save(); ax.translate(256, 32); ax.scale(1, .075); ax.translate(-256, -32); ax.fillStyle = ag; ax.fillRect(0, -200, 512, 500); ax.restore();
  const streakTex = new THREE.CanvasTexture(av); texs.push(streakTex);
  const streakMat = (c, o) => track(new THREE.SpriteMaterial({ map: streakTex, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  const sunStreak = new THREE.Sprite(streakMat(0xffe2b8, .55)); sunStreak.position.copy(sunDir).multiplyScalar(300); sunStreak.scale.set(520, 40, 1); g.add(sunStreak);
  const craterStreak = new THREE.Sprite(streakMat(0xff8a4a, 0)); craterStreak.position.copy(dir).multiplyScalar(R * 1.02); craterStreak.scale.set(R * 7, R * .55, 1); g.add(craterStreak);
  scene.add(g);

  let boomed = false, boomT = 0;
  const api = {
    group: g, origin: O, dir, radius: R, boomed: () => boomed,
    // s = segundos desde que empieza la escena del espacio
    update(s, dt, camPos) {
      earth.rotation.y += dt * .05; clouds.rotation.y += dt * .068; earthB.rotation.y = earth.rotation.y; cloudsB.rotation.y = clouds.rotation.y;
      clouds2.rotation.y -= dt * .03; clouds2B.rotation.y = clouds2.rotation.y; earthMat.uniforms.time.value = s; auroraMat.uniforms.time.value = s;
      moon.rotation.y += dt * .03; mars.rotation.y += dt * .05; jup.rotation.y += dt * .08; venus.rotation.y -= dt * .02; sat.rotation.y += dt * .06;
      for (const q of sats) { const a = q.phase + s * q.speed; q.sg.position.set(Math.cos(a) * q.rad, 0, Math.sin(a) * q.rad).applyAxisAngle(new V3(1, 0, 0), q.incl).applyAxisAngle(new V3(0, 1, 0), q.yaw0); q.sg.rotation.y += dt * .4; q.light.material.opacity = Math.sin(s * 3.2 + q.phase * 2) > .72 ? .95 : .08; }
      for (let i = 0; i < DN; i++) { dPos[i * 3] += dVel[i * 3] * dt; dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt; dPos[i * 3 + 2] += dVel[i * 3 + 2] * dt; for (let a = 0; a < 3; a++) { const lim = a === 1 ? 90 : 170; if (dPos[i * 3 + a] > lim) dPos[i * 3 + a] = -lim; else if (dPos[i * 3 + a] < -lim) dPos[i * 3 + a] = lim; } }
      dG.attributes.position.needsUpdate = true;
      sky.rotation.y += dt * .004;
      if (!boomed) {
        const k = clamp((s - .35) / 1.7, 0, 1);
        lg.setDrawRange(0, Math.floor(total * k / 2) * 2);
        cracks.material.opacity = .55 + .45 * Math.abs(Math.sin(s * 14));
        craterGlow.material.opacity = k * .6 * (.8 + .2 * Math.sin(s * 20)); craterGlow.scale.setScalar(R * (.4 + k * .7));
        earthMat.uniforms.emi.value = .32 * k * k * (.8 + .2 * Math.sin(s * 22)); auroraMat.uniforms.fade.value = 1 - k;
        if (s > 2.2) {
          boomed = true; boomT = s; earth.visible = false; clouds.visible = false; clouds2.visible = false; earthB.visible = cloudsB.visible = clouds2B.visible = true; magma.visible = true; rim.visible = true; cracks.visible = false;
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
      craterStreak.material.opacity = Math.max(0, .9 - b * .35) * (.85 + .15 * Math.sin(s * 30)); auroraMat.uniforms.fade.value = 0;
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
