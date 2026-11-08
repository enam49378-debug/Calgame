/* ===== EL ABISMO: torbellino en el mar profundo → cascada → cueva (y el jefe KRAKEN cuando hay evento) =====
   - En el mar PROFUNDO hay un TORBELLINO gigante (columna de luz + cartel "EL ABISMO"): absorbe a quien nada cerca. Al llegar al centro caes
     por una cascada a la cueva del abismo. Se puede entrar SIEMPRE: sin evento el abismo está en calma y el Kraken duerme.
   - Con el EVENTO "Calamar gigante" (cada varios minutos, o desde Opciones) el Kraken despierta: JEFE con sistema de combate propio:
       · 8 TENTÁCULOS con vida propia: los golpes cerca de un tentáculo lo dañan a él; al cortarlo el jefe se tambalea y queda EXPUESTO.
       · Mientras tenga tentáculos recibe poco daño del cuerpo; con todos cortados el ojo queda al descubierto (daño ×1.8).
       · Ataques: Aplastamiento (un tentáculo te golpea donde marca el círculo), Barrido, Latigazo (cono frontal), Derrumbe (rocas),
         Tinta, Succión y, enfurecido, Rayos de los ojos. Los tentáculos cortados vuelven a crecer a los 25 s.
   - Se le pega con las habilidades del personaje (las cinemáticas de agarre le hacen daño directo). Premios: emotes y cosméticos exclusivos.
   - El jefe es una instancia por jugador (cada uno pelea con su propio Kraken, como una mazmorra).
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE;
    const VX = 70, VZ = 420, VR = 44;                       // torbellino: centro y radio de captura
    const lm = c => new T.MeshLambertMaterial({ color: c }), bmat = (c, op, add) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending, side: T.DoubleSide });
    const mkbox = (par, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); if (rx || ry || rz) q.rotation.set(rx, ry, rz); par.add(q); return q; };
    const rnd = (() => { let q = 424242; return () => (q = (q * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const AB = { vortex: null, root: null, built: false, uni: null, rings: [], funnel: null, pillar: null, kelp: [], fall: null, fallTex: null, exit: null, clearedAt: -999, far: false, lights: [], sfxT: 0, cleared: false, hidden: null, ambT: 3, fallT: 0, cnt: null, cntT: 0, cntTxt: '', mobs: [], bolts: [], groups: null, pl: null, door: null, emptyT: 0, ambZ: 0 };
    const EXIT = () => ({ x: ABY.x + 58, z: ABY.z });
    const ENTRY = () => ({ x: ABY_PTS[3][0], z: ABY_PTS[3][1] });                   // la cascada del principio del camino
    const GATE_X = ABY.x - 82;                                                      // al pasarlo ya estás en la sala del Kraken
    const eventOn = () => !!(SEA.ev && SEA.ev.squid > 0);
    const locked = () => eventOn() && !AB.cleared;                                  // con el evento activo no se sale hasta vencer al Kraken

    // ---------------------------------------------------------------- el torbellino del mar profundo (agua con shader: espiral, espuma, centro oscuro)
    const NOISE = `float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y); }`;
    const VORTEX_FRAG = `varying vec2 vUv; uniform float uTime, uGlow;
      ${NOISE}
      void main(){
        float r = vUv.y, a = vUv.x * 6.2831853, w = 1. - r;
        float sw = a + 7. * pow(w, 1.6) - uTime * (.5 + w * 2.6);
        vec2 q = vec2(cos(sw), sin(sw)) * (r + .25);
        float n = noise(q * 9. + vec2(uTime * .3, 0.)) * .6 + noise(q * 22. - uTime * .2) * .4;
        float arms = .5 + .5 * sin(sw * 5. + n * 3.);
        float foam = smoothstep(.62, .96, arms * (.35 + n)) * smoothstep(.0, .5, r);
        float streak = smoothstep(.86, 1., sin(sw * 13. + r * 40. - uTime * 3.) * .5 + .5) * w * .6;
        vec3 col = mix(vec3(.05, .38, .52), vec3(.01, .1, .24), smoothstep(.0, .55, w));
        col = mix(col, vec3(.0, .006, .022), smoothstep(.5, .98, w));
        col += (foam * .75 + streak) * vec3(.78, .95, 1.) * (1. - w * .45);
        float rim = smoothstep(.88, .985, r) * (.45 + n) * (1. - smoothstep(.985, 1., r));
        col += rim * vec3(.92, 1., 1.) * .85;
        col += vec3(.1, .6, .9) * uGlow * smoothstep(.3, 1., w) * (.5 + .5 * sin(uTime * 3.));
        float spec = pow(max(0., sin(sw * 3. + n * 6.)), 24.) * (1. - w) * .5;
        col += spec * vec3(1.);
        gl_FragColor = vec4(col, (1. - smoothstep(.93, 1., r)) * .97);
      }`;
    const FUNNEL_FRAG = `varying vec2 vUv; uniform float uTime;
      ${NOISE}
      void main(){ vec2 uv = vec2(vUv.x * 14. + vUv.y * 6. - uTime * .3, vUv.y * 5. - uTime * 1.6); float n = noise(uv * vec2(2., 3.)) * .6 + noise(uv * vec2(6., 8.) + 4.) * .4; float s = smoothstep(.45, .9, n);
        gl_FragColor = vec4(vec3(.5, .85, 1.) * s + vec3(.0, .1, .2), (.1 + s * .4) * smoothstep(.0, .25, vUv.y)); }`;
    const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
    const VR_R = VR + 10, VR_D = 26, VR_P = 2.4;                                      // forma del embudo: y = -D * (1 - r/R)^P
    const surfY = d => -VR_D * Math.pow(Math.max(0, 1 - d / VR_R), VR_P);
    function buildVortex() {
      if (AB.vortex || !SEA.root) return;
      const g = new T.Group(); g.position.set(VX, SEA_Y + .07, VZ); SEA.root.add(g); AB.vortex = g;
      AB.uni = { uTime: { value: 0 }, uGlow: { value: 0 } };
      const prof = []; for (let i = 0; i <= 48; i++) { const u = i / 48; prof.push(new T.Vector2(.05 + u * (VR_R - .05), surfY(u * VR_R))); }
      const disc = new T.Mesh(new T.LatheGeometry(prof, 96), new T.ShaderMaterial({ uniforms: AB.uni, vertexShader: VERT, fragmentShader: VORTEX_FRAG, transparent: true, depthWrite: false, side: T.DoubleSide }));
      disc.renderOrder = -3; g.add(disc);
      for (let i = 0; i < 4; i++) { const r = new T.Mesh(new T.RingGeometry(1, 1.5, 72), bmat(0xdff6ff, .35, true)); r.rotation.x = -Math.PI / 2; r.position.y = .05 + i * .01; r.renderOrder = -2; g.add(r); AB.rings.push(r); }
      const pil = new T.Mesh(new T.CylinderGeometry(3.4, 3.4, 90, 20, 1, true), bmat(0x7df9ff, .12, true)); pil.position.y = 45; g.add(pil); AB.pillar = pil;
      const dk = new T.Mesh(new T.CylinderGeometry(4.5, 1.2, VR_D, 24, 1, true), new T.ShaderMaterial({ uniforms: { uTime: AB.uni.uTime }, vertexShader: VERT, fragmentShader: FUNNEL_FRAG, transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending })); dk.position.y = -VR_D / 2; g.add(dk);   // columna de agua en el centro   // columna de luz: se ve desde lejos
      const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128; const l2 = lc.getContext('2d'); l2.font = 'bold 76px system-ui,Arial'; l2.textAlign = 'center'; l2.fillStyle = '#bff6ff'; l2.shadowColor = '#00e5ff'; l2.shadowBlur = 24; l2.fillText('EL ABISMO', 256, 90);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(lc), transparent: true, depthWrite: false, fog: false })); sp.scale.set(26, 6.5, 1); sp.position.y = 26; g.add(sp);
      { const cc = document.createElement('canvas'); cc.width = 512; cc.height = 96; AB.cnt = { c: cc, g: cc.getContext('2d'), tex: new T.CanvasTexture(cc) }; const cs = new T.Sprite(new T.SpriteMaterial({ map: AB.cnt.tex, transparent: true, depthWrite: false, fog: false })); cs.scale.set(22, 4.1, 1); cs.position.y = 21; g.add(cs); }
    }

    const fmt = s => { s = Math.max(0, Math.ceil(s)); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };
    function paintCounter() {
      if (!AB.cnt) return; let txt, col;
      if (eventOn()) { txt = '🦑 KRAKEN ACTIVO · ' + fmt(SEA.ev.squid); col = '#ff8fb0'; }
      else if (SEA.noKraken && !(typeof NETPUB === 'function' && NETPUB())) { txt = 'Kraken desactivado'; col = '#9aa0b8'; }
      else if (SEA.eventsAuto === false) { txt = 'Eventos desactivados'; col = '#9aa0b8'; }
      else { txt = 'Próximo evento en ' + fmt(SEA.evTimer); col = '#bff6ff'; }
      if (txt === AB.cntTxt) return; AB.cntTxt = txt; const g = AB.cnt.g; g.clearRect(0, 0, 512, 96); g.fillStyle = 'rgba(4,16,30,.72)'; g.beginPath(); g.roundRect ? g.roundRect(6, 10, 500, 76, 18) : g.rect(6, 10, 500, 76); g.fill(); g.strokeStyle = col; g.lineWidth = 3; g.stroke();
      g.font = 'bold 38px system-ui,Arial'; g.textAlign = 'center'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 10; g.fillText(txt, 256, 62); g.shadowBlur = 0; AB.cnt.tex.needsUpdate = true;
    }

    // ---------------------------------------------------------------- el mar nuevo (lejos de la costa): rocas y corales luminosos
    function buildFarSea() {
      if (AB.far || !SEA.root) return; AB.far = true;
      const N = 360, Q = new T.Quaternion(), E = new T.Euler(), M = new T.Matrix4(), P = new V3(), S = new V3(), col = new T.Color();
      const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial({ color: 0xffffff }), N), glow = new T.InstancedMesh(new T.ConeGeometry(.5, 1, 5), new T.MeshBasicMaterial({ color: 0xffffff }), 150);
      const hide = (m, i) => { S.set(0, 0, 0); M.compose(P.set(0, -50, 0), Q, S); m.setMatrixAt(i, M); };
      for (let i = 0; i < N; i++) {
        const x = (rnd() - .5) * 690, zz = SHORE(x) + 150 + rnd() * 330; if (zz > 535 || Math.hypot(x - VX, zz - VZ) < VR + 6) { hide(im, i); continue; }
        const y = seaFloor(x, zz), big = rnd() < .18, w = big ? 3 + rnd() * 7 : .8 + rnd() * 2.4, h = big ? 3 + rnd() * 9 : .6 + rnd() * 2;
        P.set(x, y + h / 2 - .2, zz); E.set((rnd() - .5) * .3, rnd() * 3, (rnd() - .5) * .3); Q.setFromEuler(E); S.set(w, h, w * (.7 + rnd() * .6)); M.compose(P, Q, S); im.setMatrixAt(i, M); im.setColorAt(i, col.set(rnd() < .3 ? '#2c4258' : rnd() < .6 ? '#1d2f42' : '#243b30'));
      }
      im.instanceColor.needsUpdate = true; SEA.root.add(im);
      for (let i = 0; i < 150; i++) {
        const x = (rnd() - .5) * 690, zz = SHORE(x) + 150 + rnd() * 330; if (zz > 535 || Math.hypot(x - VX, zz - VZ) < VR + 6) { hide(glow, i); continue; }
        const y = seaFloor(x, zz), h = 1.4 + rnd() * 4.5; P.set(x, y + h / 2, zz); E.set((rnd() - .5) * .4, rnd() * 3, (rnd() - .5) * .4); Q.setFromEuler(E); S.set(.8 + rnd() * 1.2, h, .8 + rnd() * 1.2); M.compose(P, Q, S); glow.setMatrixAt(i, M); glow.setColorAt(i, col.set(['#39e6ff', '#ff4fd8', '#9d6bff', '#7dffb0'][i % 4]));
      }
      glow.instanceColor.needsUpdate = true; SEA.root.add(glow);
    }

    // ---------------------------------------------------------------- el KRAKEN: modelo, animación y combate
    const B = { f: null, g: null, arms: [], longs: [], fins: [], eyes: [], spots: [], mantle: null, head: null, body: null, mats: [], zones: [], tele: [], atk: null, cd: 3, t: 0, state: 'sleep', phase2: false, bar: null, last: '', hitT: 0, vuln: 0, stagger: 0, exposed: 0, deadT: 0, idle: 0, jet: 0 };
    let skinTex = null;
    function squidSkin() {
      if (skinTex) return skinTex; const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
      g.fillStyle = '#a23a56'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (40 + rnd() * 50 | 0) + ',10,' + (30 + rnd() * 40 | 0) + ',' + (.1 + rnd() * .25).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 2 + rnd() * 9, 0, 7); g.fill(); }
      for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(255,200,215,' + (.05 + rnd() * .12).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 5, 0, 7); g.fill(); }
      skinTex = new T.CanvasTexture(c); skinTex.wrapS = skinTex.wrapT = T.RepeatWrapping; return skinTex;
    }
    const cyl = (r0, r1, len, seg = 10) => { const ge = new T.CylinderGeometry(r1, r0, len, seg, 1, false); ge.rotateX(Math.PI / 2); ge.translate(0, 0, len / 2); return ge; };   // eje en +z, nace en z=0
    function buildSquid() {
      const g = new T.Group(), tex = squidSkin(), skin = new T.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD }), skinD = new T.MeshToonMaterial({ color: 0x6a2238, gradientMap: TOON_GRAD }), belly = new T.MeshToonMaterial({ color: 0xe8a6b8, gradientMap: TOON_GRAD }),
        suck = new T.MeshToonMaterial({ color: 0xfff0f4, gradientMap: TOON_GRAD }), gold = new T.MeshBasicMaterial({ color: 0xffd23f }), pup = new T.MeshBasicMaterial({ color: 0x0a0408 }), spotM = new T.MeshBasicMaterial({ color: 0x39e6ff }), beakM = new T.MeshToonMaterial({ color: 0x1c0a10, gradientMap: TOON_GRAD });
      for (const m of [skin, skinD, belly]) m.emissive = new T.Color(0x240a14);
      B.mats = [skin, skinD, belly]; B.spotM = spotM;
      const body = new T.Group(); body.position.y = 7; g.add(body); B.body = body;
      const head = new T.Mesh(new T.SphereGeometry(4.6, 28, 20), skin); head.scale.set(1, .86, 1.05); body.add(head); B.head = head;
      const mantle = new T.Mesh(new T.CylinderGeometry(.7, 3.9, 17, 24, 8), skin); mantle.position.set(0, 11.5, -.5); mantle.rotation.x = -.12; body.add(mantle); B.mantle = mantle;
      B.fins = []; for (const s of [-1, 1]) { const fin = new T.Mesh(new T.SphereGeometry(1, 16, 10), skinD); fin.scale.set(5.2, .28, 3.4); fin.position.set(s * 4.2, 17, -1.4); fin.rotation.z = s * .5; body.add(fin); B.fins.push([fin, s]); }
      B.eyes = [];
      for (const s of [-1, 1]) { const ball = new T.Mesh(new T.SphereGeometry(1.6, 18, 14), new T.MeshToonMaterial({ color: 0x2a0f18, gradientMap: TOON_GRAD })); ball.position.set(s * 4.1, .6, 2.7); body.add(ball); const iris = new T.Mesh(new T.SphereGeometry(1.32, 18, 14), gold.clone()); iris.position.set(s * 4.5, .6, 3.15); body.add(iris); B.eyes.push(iris); mkbox(body, .32, 1.7, .25, pup, s * 4.7, .6, 4.38); }
      const b1 = new T.Mesh(new T.ConeGeometry(.9, 2.2, 8), beakM); b1.position.set(0, -2.9, 3.3); b1.rotation.x = Math.PI * .8; body.add(b1);
      const b2 = new T.Mesh(new T.ConeGeometry(.7, 1.8, 8), beakM); b2.position.set(0, -3.6, 3.0); b2.rotation.x = -Math.PI * .75; body.add(b2);
      B.spots = []; for (let i = 0; i < 34; i++) { const a = rnd() * 6.283, h = 1 + rnd() * 18, r = h < 5 ? 4.3 : 3.9 - (h - 5) * .2; const s = new T.Mesh(new T.SphereGeometry(.18 + rnd() * .12, 8, 6), spotM); s.position.set(Math.cos(a) * (Math.max(.8, r) + .05), h + 3 - 7 + 7, Math.sin(a) * (Math.max(.8, r) + .05) - .5); body.add(s); B.spots.push(s); }
      B.arms = [];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, root = new T.Group(); root.position.set(Math.cos(a) * 2.7, 3.3, Math.sin(a) * 2.7); root.rotation.y = Math.PI / 2 - a; g.add(root);
        const N = 9, L = 2.2, segs = []; let par = root;
        for (let i = 0; i < N; i++) {
          const r0 = 1.0 - i * .1, r1 = Math.max(.14, 1.0 - (i + 1) * .1); const s = new T.Group(); s.position.z = i ? L : 0; par.add(s);
          s.add(new T.Mesh(cyl(r0, r1, L, 9), skin));
          if (i < 8) for (const sx of [-1, 1]) { const su = new T.Mesh(new T.SphereGeometry(Math.max(.1, r0 * .22), 7, 5), suck); su.position.set(sx * r0 * .45, -r0 * .82, L * .5); s.add(su); }
          segs.push(s); par = s;
        }
        B.arms.push({ root, segs, hp: 110, max: 110, severed: false, regrow: 0, ang: a, flash: 0, busy: false, rest: [-.25, .12, .2, .24, .22, .18, .14, .1, .06] });
      }
      B.longs = [];
      for (const s of [-1, 1]) { const root = new T.Group(); root.position.set(s * 2.2, 3.8, 2.4); g.add(root); root.visible = false; let par = root; const segs = []; for (let i = 0; i < 12; i++) { const sg = new T.Group(); sg.position.z = i ? 2.6 : 0; par.add(sg); sg.add(new T.Mesh(cyl(.62 - i * .035, .62 - (i + 1) * .035, 2.6, 8), skin)); segs.push(sg); par = sg; } const club = new T.Mesh(new T.SphereGeometry(1, 12, 8), belly); club.scale.set(1.1, .35, 1.9); club.position.z = 1.4; segs[11].add(club); B.longs.push({ root, segs, s }); }
      return g;
    }
    function ensureSquid() {
      if (B.g) return; B.g = buildSquid(); B.g.position.set(ABY.x, ABY.y - 1.5, ABY.z); B.g.rotation.y = Math.PI * .1; scene.add(B.g); B.g.visible = false; B.state = 'sleep';
    }
    // CCD plano: dobla los segmentos de un brazo para que su punta llegue a (zt, yt) en el plano vertical del brazo
    function armReach(arm, zt, yt, k) {
      const n = arm.segs.length, L = 2.2, al = arm.segs.map(s => -s.rotation.x);
      const pts = () => { const p = [[0, 0]]; let a = 0, z = 0, y = 0; for (let i = 0; i < n; i++) { a += al[i]; if (i) { z += Math.cos(a) * L; y += Math.sin(a) * L; } p.push([z, y]); } return p; };
      for (let it = 0; it < 7; it++) for (let j = n - 1; j >= 0; j--) { const p = pts(), o = p[j], e = p[n], ae = Math.atan2(e[1] - o[1], e[0] - o[0]), at = Math.atan2(yt - o[1], zt - o[0]); let d = at - ae; d = Math.max(-.55, Math.min(.55, d)); al[j] = Math.max(-.7, Math.min(.7, al[j] + d)); }
      arm.segs.forEach((s, i) => { s.rotation.x += (-al[i] - s.rotation.x) * (k || 1); });
    }
    function spawnBoss() {
      if (B.f && G.fighters.includes(B.f)) return;
      B.f = null;
      if (AB.cleared) return;
      buildAbyss(); ensureSquid();
      const ch = Object.assign({}, DUMMY_CH, { name: 'Kraken', hp: 1500, color: '#ff5577' });
      const f = new Fighter({ name: 'KRAKEN', ch, lvlVar: 0 });
      f.isBoss = true; f.abyss = true; f.maxHp = f.hp = ch.hp; f.hitR = 5.6; f.hitH = 11; f.ai = null; f.alive = true; f.iframes = 0; f.cineHide = true;   // su cuerpo de "luchador" no se ve: el que se ve es el calamar
      f.pos.set(ABY.x, ABY.y, ABY.z); f.home = f.pos.clone(); f.model.root.visible = false;
      if (f.plate) { f.plate.remove(); f.plate = null; }
      G.fighters.push(f); B.f = f;
      B.g.visible = true; B.state = 'intro'; B.t = 0; B.cd = 3.2; B.atk = null; B.phase2 = false; B.last = ''; B.vuln = B.stagger = B.exposed = 0;
      B.arms.forEach(a => { a.hp = a.max; a.severed = false; a.root.visible = true; a.root.scale.setScalar(1); a.flash = 0; a.busy = false; });
      mkBar(); showBanner('¡EL KRAKEN DESPIERTA!', '#ff5577', 'Jefe final del abismo'); G.shake = Math.max(G.shake, 1.4); sfx('boom', B.g.position, 1);
    }
    function sleepBoss(msg) {   // vuelve a dormir (se acabó el evento o nadie queda)
      if (B.f) { const i = G.fighters.indexOf(B.f); if (i >= 0) G.fighters.splice(i, 1); try { B.f.dispose(); } catch (e) { } B.f = null; }
      for (const z of B.zones) scene.remove(z.m); for (const z of B.tele) scene.remove(z.m); B.zones = []; B.tele = []; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.state = 'sleep';
      if (B.g) { B.g.position.set(ABY.x, ABY.y - 1.5, ABY.z); B.g.rotation.z = 0; B.g.visible = AB.root ? AB.root.visible : false; }
      if (B.bar) B.bar.classList.remove('on');
      if (msg && G.player && G.player.abyss) addFeedText(msg, '#9aa0b8');
    }
    const css = document.createElement('style');
    css.textContent = '#bossbar{position:fixed;top:64px;left:50%;transform:translateX(-50%);width:min(660px,88vw);z-index:70;display:none;pointer-events:none;color:#fff;font-family:var(--body,system-ui,sans-serif);text-align:center}#bossbar.on{display:block}#bossbar b{display:block;letter-spacing:.18em;font-size:15px;text-shadow:0 2px 6px #000;margin-bottom:4px}#bossbar .bb{height:16px;border:2px solid #fff;border-radius:9px;background:rgba(10,0,10,.7);overflow:hidden;position:relative}#bossbar .bb i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff2d55,#ff8fb0);transition:width .15s}#bossbar.ex .bb i{background:linear-gradient(90deg,#ffd23f,#fff2a8)}#bossbar .ar{display:flex;gap:4px;justify-content:center;margin-top:5px}#bossbar .ar u{width:34px;height:7px;border-radius:4px;background:#39e6ff;box-shadow:0 0 6px #39e6ff;text-decoration:none}#bossbar small{display:block;opacity:.9;margin-top:3px;font-size:12px;text-shadow:0 1px 4px #000}';
    document.head.appendChild(css);
    function mkBar() { if (!B.bar) { B.bar = document.createElement('div'); B.bar.id = 'bossbar'; B.bar.innerHTML = '<b>KRAKEN DEL ABISMO</b><div class="bb"><i></i></div><div class="ar"></div><small></small>'; document.body.appendChild(B.bar); } B.bar.classList.add('on'); }
    const abyssPlayers = () => G.fighters.filter(f => f.abyss && f.alive && !f.remote && !f.isBoss);
    function hurt(f, dmg, dx, dz, kb) {
      if (!f.alive || f.iframes > 0 || f.cineLock) return;
      if (f.blocking) dmg *= .35;
      f.hp -= dmg; f.flashT = .16; f.vel.x += dx * kb; f.vel.z += dz * kb; f.vel.y = Math.max(f.vel.y, kb * .45); f.onGround = false;
      sfx('heavy', f.pos, .9); popText(chestOf(f), '-' + Math.round(dmg), '#ff5577', 20);
      if (f.isPlayer) { G.shake = Math.max(G.shake, .5); camPunch(.5, 1); }
      if (f.hp <= 0) kill(f, null);
    }
    const telegraph = (x, z, r, life, col) => {
      const m = new T.Mesh(new T.CircleGeometry(r, 40), new T.MeshBasicMaterial({ color: col || 0xff2d2d, transparent: true, opacity: .3, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, ABY.y + .15, z); scene.add(m);
      const t = { m, life, t: 0, r }; B.tele.push(t); return t;
    };
    const aliveArms = () => B.arms.filter(a => !a.severed);
    const armWorld = a => { const v = new V3(); a.root.getWorldPosition(v); return v; };
    const angDiff = (a, b) => Math.abs(((a - b) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
    // --- ataques
    function atkSlam() {   // un tentáculo se levanta y golpea donde marca el círculo rojo
      const arms = aliveArms(); if (!arms.length) return null;
      const targets = abyssPlayers(), n = Math.min(arms.length, 1 + Math.floor(arms.length / 3) + (B.phase2 ? 2 : 0)), hits = [];
      for (let i = 0; i < n; i++) {
        const p = targets.length ? targets[i % targets.length] : null; let x = p ? p.pos.x + rand(-3, 3) : ABY.x + rand(-14, 14), z = p ? p.pos.z + rand(-3, 3) : ABY.z + rand(-14, 14);
        const dx = x - ABY.x, dz = z - ABY.z, d = Math.hypot(dx, dz); if (d > 21) { x = ABY.x + dx / d * 21; z = ABY.z + dz / d * 21; }
        const ang = Math.atan2(z - ABY.z, x - ABY.x); let best = null, bd = 9; for (const a of arms) { if (a.busy) continue; const wp = armWorld(a), dd = angDiff(Math.atan2(wp.z - ABY.z, wp.x - ABY.x), ang); if (dd < bd) { bd = dd; best = a; } }
        if (!best) continue; best.busy = true; hits.push({ x, z, at: .85 + i * .5, done: false, tele: telegraph(x, z, 4.6, 1.3 + i * .5), arm: best, lift: 0, hold: 0 });
      }
      if (!hits.length) return null;
      return { name: 'slam', t: 0, dur: .85 + hits.length * .5 + 1.3, hits,
        upd(dt) {
          for (const h of this.hits) {
            const a = h.arm, wp = armWorld(a);
            if (!h.done) {
              h.lift = Math.min(1, h.lift + dt / (h.at - .1)); const yaw = Math.atan2(h.x - wp.x, h.z - wp.z) - B.g.rotation.y; let d = ((yaw - a.root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; a.root.rotation.y += d * Math.min(1, dt * 7);
              a.segs.forEach((s, i) => { const up = -.5 - i * .1; s.rotation.x += ((a.rest[i] + (up - a.rest[i]) * h.lift) - s.rotation.x) * Math.min(1, dt * 8); });
              h.tele.m.material.opacity = .2 + Math.sin(this.t * 14) * .08;
            }
            if (!h.done && this.t >= h.at) {
              h.done = true; h.hold = .55; h.tele.life = .05;
              armReach(a, Math.hypot(h.x - wp.x, h.z - wp.z), ABY.y + .3 - wp.y, 1);
              for (const p of abyssPlayers()) { const dx = p.pos.x - h.x, dz = p.pos.z - h.z, d = Math.hypot(dx, dz); if (d < 4.8 && p.pos.y < ABY.y + 3.2) hurt(p, 20, dx / (d || 1), dz / (d || 1), 10); }
              burst(new V3(h.x, ABY.y + .4, h.z), 34, '#6f8aa8', 11, .3, .9, 1); ringAt(new V3(h.x, ABY.y + .2, h.z), '#ff8fb0', 7, .5); G.shake = Math.max(G.shake, .6); sfx('crash', new V3(h.x, ABY.y, h.z), .8);
            } else if (h.done && h.hold > 0) { h.hold -= dt; armReach(a, Math.hypot(h.x - wp.x, h.z - wp.z), ABY.y + .3 - wp.y, 1); }
            else if (h.done) { a.segs.forEach((s, i) => { s.rotation.x += (a.rest[i] - s.rotation.x) * Math.min(1, dt * 4); }); a.busy = false; }
          }
        },
        cleanup() { for (const h of this.hits) h.arm.busy = false; } };
    }
    function atkSweep() {   // barrido: un tentáculo gigante gira por el suelo; hay que saltarlo
      const bar = new T.Mesh(new T.CylinderGeometry(.5, 1.0, ABY.R - 4, 10), new T.MeshToonMaterial({ color: 0xc2566e, gradientMap: TOON_GRAD })); bar.geometry.rotateZ(Math.PI / 2); bar.geometry.translate((ABY.R - 4) / 2, 0, 0); bar.position.set(ABY.x, ABY.y + .9, ABY.z); scene.add(bar);
      const p0 = abyssPlayers()[0], dirn = Math.random() < .5 ? 1 : -1, a0 = p0 ? Math.atan2(p0.pos.z - ABY.z, p0.pos.x - ABY.x) - 1.2 * dirn : rand(0, 6.28);
      const warn = new T.Mesh(new T.BoxGeometry(ABY.R - 4, .05, 1.4), new T.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: .5, depthWrite: false })); warn.geometry.translate((ABY.R - 4) / 2, 0, 0); warn.position.set(ABY.x, ABY.y + .12, ABY.z); warn.rotation.y = -a0; scene.add(warn);
      return { name: 'sweep', t: 0, dur: 1.2 + 2.7, bar, warn, a0, dirn, hit: new Set(),
        upd(dt) {
          if (this.t < 1.2) { this.bar.visible = false; this.warn.material.opacity = .25 + Math.sin(this.t * 16) * .15; return; }
          this.warn.visible = false; this.bar.visible = true; const sp = (B.phase2 ? 2.7 : 2.2), a = this.a0 + this.dirn * (this.t - 1.2) * sp; this.bar.rotation.y = -a;
          const cx = Math.cos(a), cz = Math.sin(a);
          for (const p of abyssPlayers()) { if (this.hit.has(p)) continue; const dx = p.pos.x - ABY.x, dz = p.pos.z - ABY.z, along = dx * cx + dz * cz, off = Math.abs(-dx * cz + dz * cx); if (along > 3 && along < ABY.R && off < 1.7 && p.pos.y < ABY.y + 1.7) { this.hit.add(p); hurt(p, 16, -cz * this.dirn, cx * this.dirn, 9); } }
          if (Math.random() < dt * 20) emit(ABY.x + cx * rand(4, 60), ABY.y + .6, ABY.z + cz * rand(4, 60), 0, 1.5, 0, '#a9c4d8', .22, .5, 1, 2);
        },
        cleanup() { scene.remove(this.bar); scene.remove(this.warn); if (B.state === 'fight') B.vuln = Math.max(B.vuln, 2.2); } };
    }
    function atkWhip() {   // latigazo: un cono frontal enorme; se esquiva saliendo del cono (salto, dash o de costado)
      const p0 = abyssPlayers()[0]; const a0 = p0 ? Math.atan2(p0.pos.z - ABY.z, p0.pos.x - ABY.x) : rand(0, 6.28), half = .95;
      const cone = new T.Mesh(new T.CircleGeometry(36, 32, a0 - half, half * 2), new T.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: .25, depthWrite: false, side: T.DoubleSide })); cone.rotation.x = Math.PI / 2; cone.scale.set(1, -1, 1); cone.position.set(ABY.x, ABY.y + .13, ABY.z); scene.add(cone);
      B.longs.forEach(l => { l.root.visible = true; });
      return { name: 'whip', t: 0, dur: 2.8, cone, a0, half, fired: false,
        upd(dt) {
          const up = Math.min(1, this.t / 1.2); this.cone.material.opacity = .15 + Math.sin(this.t * 16) * .08 + (this.fired ? .2 : 0);
          const base = Math.PI / 2 - this.a0 - B.g.rotation.y;
          B.longs.forEach((l, k) => { const sweep = this.fired ? Math.min(1, (this.t - 1.4) / .35) : 0, ang = base + (k ? 1 : -1) * (this.half * (1 - 2 * sweep)); l.root.rotation.y = ang; l.segs.forEach((s, i) => { const raise = (this.fired ? .05 : -.6 * up) + Math.sin(this.t * 3 + i + k) * .03; s.rotation.x += (raise - s.rotation.x) * Math.min(1, dt * 9); }); });
          if (!this.fired && this.t >= 1.4) { this.fired = true; sfx('beam', B.g.position, 1); for (const p of abyssPlayers()) { const dx = p.pos.x - ABY.x, dz = p.pos.z - ABY.z, d = Math.hypot(dx, dz), da = angDiff(Math.atan2(dz, dx), this.a0); if (d < 36 && d > 3 && da < this.half && p.pos.y < ABY.y + 2.4) hurt(p, 22, dx / (d || 1), dz / (d || 1), 12); } G.shake = Math.max(G.shake, .7); ringAt(new V3(ABY.x, ABY.y + .3, ABY.z), '#ff8fb0', 36, .5); }
        },
        cleanup() { scene.remove(this.cone); B.longs.forEach(l => { l.root.visible = false; }); } };
    }
    function atkRocks() {   // derrumbe: caen rocas del techo (círculos rojos)
      const targets = abyssPlayers(), n = B.phase2 ? 12 : 8, rocks = [];
      for (let i = 0; i < n; i++) { const p = targets.length && i % 2 === 0 ? targets[i % targets.length] : null; const a = rand(0, 6.28), d = rand(4, 46); const x = p ? p.pos.x + rand(-4, 4) : ABY.x + Math.cos(a) * d, z = p ? p.pos.z + rand(-4, 4) : ABY.z + Math.sin(a) * d;
        const m = new T.Mesh(new T.DodecahedronGeometry(1.7, 0), new T.MeshLambertMaterial({ color: 0x4a5a6a })); m.position.set(x, ABY.y + 46, z); scene.add(m); rocks.push({ x, z, at: .8 + i * .28, m, tele: telegraph(x, z, 3, .9 + i * .28), done: false }); }
      return { name: 'rocks', t: 0, dur: .8 + n * .28 + 1, rocks,
        upd(dt) { for (const r of this.rocks) { if (r.done) continue; const u = Math.max(0, Math.min(1, (this.t - (r.at - .7)) / .7)); r.m.position.y = ABY.y + 46 - u * u * 45.2; r.m.rotation.x += dt * 4; r.m.rotation.z += dt * 3;
          if (this.t >= r.at) { r.done = true; scene.remove(r.m); r.tele.life = .05; for (const p of abyssPlayers()) { const dx = p.pos.x - r.x, dz = p.pos.z - r.z, d = Math.hypot(dx, dz); if (d < 3.2 && p.pos.y < ABY.y + 2.5) hurt(p, 15, dx / (d || 1), dz / (d || 1), 8); } burst(new V3(r.x, ABY.y + .4, r.z), 18, '#7f93a8', 8, .26, .8, 1); ringAt(new V3(r.x, ABY.y + .2, r.z), '#a9c4d8', 4.5, .35); sfx('heavy', new V3(r.x, ABY.y, r.z), .6); G.shake = Math.max(G.shake, .25); } } },
        cleanup() { for (const r of this.rocks) if (!r.done) scene.remove(r.m); } };
    }
    function atkInk() {   // tinta: charcos oscuros que queman y frenan
      const targets = abyssPlayers(), n = B.phase2 ? 5 : 4, zones = [];
      for (let i = 0; i < n; i++) { const p = targets.length ? targets[i % targets.length] : null, a = rand(0, 6.28), d = rand(0, 7); const x = (p ? p.pos.x : ABY.x + rand(-25, 25)) + Math.cos(a) * d, z = (p ? p.pos.z : ABY.z + rand(-25, 25)) + Math.sin(a) * d;
        const m = new T.Mesh(new T.CircleGeometry(5.5, 36), new T.MeshBasicMaterial({ color: 0x120820, transparent: true, opacity: .1, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, ABY.y + .12, z); scene.add(m); zones.push({ x, z, m, life: 7, t: 0 }); }
      B.zones.push(...zones); sfx('whoom', B.g.position, .9); B.jet = 1;
      return { name: 'ink', t: 0, dur: 1.8, upd() { } };
    }
    function atkSuction() {   // succión: te arrastra al centro y explota (después queda expuesto)
      const rings = []; for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.RingGeometry(9, 9.5, 48), new T.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(ABY.x, ABY.y + .2, ABY.z); scene.add(m); rings.push(m); }
      sfx('rush', B.g.position, 1);
      return { name: 'suction', t: 0, dur: 3.6, rings, blast: false,
        upd(dt) {
          const pull = this.t < 2.6;
          this.rings.forEach((m, i) => { const u = ((this.t * .9 + i / 3) % 1); m.scale.setScalar(pull ? 7 - u * 6.5 : .1); m.material.opacity = pull ? .8 * (1 - u) : 0; });
          B.arms.forEach(a => { if (!a.busy && !a.severed) a.segs.forEach((s, i) => { s.rotation.x += ((pull ? a.rest[i] - .35 : a.rest[i]) - s.rotation.x) * Math.min(1, dt * 3); }); });
          if (pull) { for (const p of abyssPlayers()) { const dx = ABY.x - p.pos.x, dz = ABY.z - p.pos.z, d = Math.hypot(dx, dz) || 1; if (d > 3) { p.vel.x += dx / d * 24 * dt * (p.onGround ? 1 : .6); p.vel.z += dz / d * 24 * dt * (p.onGround ? 1 : .6); } } if (Math.random() < dt * 30) { const a = rand(0, 6.28), r = rand(12, 36); emit(ABY.x + Math.cos(a) * r, ABY.y + rand(.5, 3), ABY.z + Math.sin(a) * r, -Math.cos(a) * 10, 0, -Math.sin(a) * 10, '#ff8fb0', .2, .9, 0, 0); } }
          if (!this.blast && this.t >= 2.8) { this.blast = true; ringAt(new V3(ABY.x, ABY.y + .3, ABY.z), '#ff2d55', 20, .7); burst(new V3(ABY.x, ABY.y + 2, ABY.z), 60, '#ff8fb0', 18, .35, 1, .4); G.shake = Math.max(G.shake, 1.2); sfx('crash', B.g.position, 1); B.jet = 1.4;
            for (const p of abyssPlayers()) { const dx = p.pos.x - ABY.x, dz = p.pos.z - ABY.z, d = Math.hypot(dx, dz); if (d < 9.5 && p.pos.y < ABY.y + 5) hurt(p, 26, dx / (d || 1), dz / (d || 1), 15); } }
        },
        cleanup() { for (const m of this.rings) scene.remove(m); if (B.state === 'fight') { B.vuln = Math.max(B.vuln, 3.2); popText(B.g.position.clone().add(new V3(0, 16, 0)), '¡EXPUESTO!', '#ffd23f', 26); } } };
    }
    function atkBeam() {   // fase 2: rayos de los ojos
      const p0 = abyssPlayers()[0]; if (!p0) return null;
      const lines = [0, 1].map(() => { const m = new T.Mesh(new T.BoxGeometry(.25, .25, 1), new T.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: .4, depthWrite: false, blending: T.AdditiveBlending })); scene.add(m); return m; });
      sfx('beam', B.g.position, 1);
      return { name: 'beam', t: 0, dur: 3.2, lines, tx: p0.pos.x, tz: p0.pos.z, tk: 0,
        upd(dt) {
          const fire = this.t > 1.3 && this.t < 2.6, g = B.g;
          if (this.t < 1.3) { const p = abyssPlayers()[0]; if (p) { this.tx += (p.pos.x - this.tx) * Math.min(1, dt * 3); this.tz += (p.pos.z - this.tz) * Math.min(1, dt * 3); } }
          this.lines.forEach((m, i) => { const s = i ? 1 : -1, ex = g.position.x + Math.sin(g.rotation.y) * 5 + Math.cos(g.rotation.y) * 4.1 * s, ey = g.position.y + 7.6, ez = g.position.z + Math.cos(g.rotation.y) * 5 - Math.sin(g.rotation.y) * 4.1 * s;
            const to = new V3(this.tx, ABY.y + 1, this.tz), from = new V3(ex, ey, ez), d = from.distanceTo(to); m.position.copy(from).lerp(to, .5); m.scale.set(fire ? 3.2 : 1, fire ? 3.2 : 1, d); m.lookAt(to); m.material.opacity = fire ? .95 : .35 + Math.sin(this.t * 20) * .15; m.material.color.set(fire ? 0xffffff : 0xff2d2d); });
          if (fire) { this.tk -= dt; if (this.tk <= 0) { this.tk = .22; for (const p of abyssPlayers()) { const d = Math.hypot(p.pos.x - this.tx, p.pos.z - this.tz); if (d < 2.4) hurt(p, 9, 0, 0, 3); } burst(new V3(this.tx, ABY.y + .5, this.tz), 10, '#ff8fb0', 8, .22, .5, .8); } }
        },
        cleanup() { for (const m of this.lines) scene.remove(m); } };
    }
    function pickAttack() {
      const arms = aliveArms().length, pool = ['slam', 'ink', 'suction', 'whip', 'rocks'].concat(arms >= 3 ? ['sweep'] : []).concat(B.phase2 ? ['beam', 'slam', 'rocks'] : []).filter(n => n !== B.last);
      const name = pool[Math.random() * pool.length | 0]; B.last = name;
      const a = { slam: atkSlam, sweep: atkSweep, ink: atkInk, suction: atkSuction, whip: atkWhip, rocks: atkRocks, beam: atkBeam }[name]();
      if (a) popText(B.g.position.clone().add(new V3(0, 16, 0)), { slam: '¡APLASTAMIENTO!', sweep: '¡SALTA!', ink: '¡TINTA!', suction: '¡SUCCIÓN!', beam: '¡RAYOS!', whip: '¡LATIGAZO!', rocks: '¡DERRUMBE!' }[a.name], '#ff8fb0', 26);
      return a;
    }
    // --- combate propio: tentáculos con vida, expuesto, etc.
    function severArm(a) {
      a.severed = true; a.regrow = 25; a.busy = false; const tip = new V3(); a.segs[a.segs.length - 1].getWorldPosition(tip); a.root.visible = false;
      burst(tip, 40, '#c2566e', 12, .35, 1, .6); burst(tip, 24, '#1a0a20', 9, .4, 1.2, .3); ringAt(new V3(tip.x, ABY.y + .2, tip.z), '#ff8fb0', 6, .5); sfx('crash', tip, .8); G.shake = Math.max(G.shake, 1);
      popText(B.g.position.clone().add(new V3(0, 17, 0)), '¡TENTÁCULO CORTADO!', '#ffd23f', 26);
      if (B.atk) { if (B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.cd = 2.4; }
      B.stagger = 2.6; B.vuln = Math.max(B.vuln, 3.8); if (B.f) B.f.hp = Math.max(1, B.f.hp - 35);
      if (!aliveArms().length) { B.exposed = 9; popText(B.g.position.clone().add(new V3(0, 19, 0)), '¡OJO AL DESCUBIERTO!', '#ffd23f', 28); }
    }
    function bossHit(att, o, tg) {
      if (tg && tg.mob) return o;   // los enemigos del pasillo reciben el daño tal cual   // cada golpe: elige el tentáculo más cercano, le baja vida y ajusta el daño al cuerpo
      if (!B.g || B.state === 'dead') return o;
      const dmg = o.dmg || 3, ang = Math.atan2(att.pos.z - ABY.z, att.pos.x - ABY.x); let best = null, bd = 9;
      for (const a of B.arms) { if (a.severed) continue; const wp = armWorld(a), d = angDiff(Math.atan2(wp.z - ABY.z, wp.x - ABY.x), ang); if (d < bd) { bd = d; best = a; } }
      B.hitT = .12; if (Math.random() < .5) burst(new V3(att.pos.x, att.pos.y + 1.5, att.pos.z).lerp(B.g.position, .15), 6, '#ffd0dc', 6, .16, .4, .5);
      if (best && bd < .9) { best.hp -= dmg * 1.25; best.flash = .15; if (best.hp <= 0) severArm(best); }
      const n = aliveArms().length, mult = B.vuln > 0 || B.exposed > 0 ? 2.2 : n >= 4 ? .45 : n > 0 ? .8 : 1.8;
      return Object.assign({}, o, { dmg: dmg * mult });
    }
    function bossDown(v) {
      if (v && v.mob) return;   // los enemigos pequeños los gestiona mobsUpdate
      if (B.state === 'dead') return; B.state = 'dead'; B.deadT = 0; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = null;
      for (const z of B.zones) scene.remove(z.m); B.zones = []; for (const z of B.tele) scene.remove(z.m); B.tele = [];
      AB.clearedAt = G.time; AB.cleared = true; screenFlash(.9); G.slowT = Math.max(G.slowT, 1.2); G.shake = Math.max(G.shake, 2);
      showBanner('¡KRAKEN DERROTADO!', '#ffd54f', 'Ya puedes salir por el portal de la superficie'); sfx('boom', B.g.position, 1);
      for (let i = 0; i < 8; i++) later(i * .25, () => { if (B.g) { burst(B.g.position.clone().add(new V3(rand(-4, 4), rand(2, 16), rand(-4, 4))), 40, i % 2 ? '#ffd54f' : '#ff8fb0', 16, .35, 1.1, .2); ringAt(B.g.position.clone().add(new V3(0, rand(1, 8), 0)), '#ffd54f', 12, .6); } });
      const prize = []; if (window.CF_EMOTES && CF_EMOTES.grantBoss) prize.push(...CF_EMOTES.grantBoss()); if (window.CF_COS && CF_COS.grantBoss) prize.push(...CF_COS.grantBoss());
      later(2.2, () => { if (prize.length) { showBanner('¡RECOMPENSAS!', '#ffd54f', prize.join(' · ')); for (const p of prize) addFeedText('🎁 ' + p, '#ffd54f'); } else addFeedText('El Kraken no soltó nada nuevo esta vez', '#9aa0b8'); });
      later(7, () => { sleepBoss(); if (B.g) B.g.visible = false; });
    }
    function bossUpdate(dt, t) {
      const f = B.f; if (!f || !B.g) return; const g = B.g;
      f.pos.set(ABY.x, ABY.y, ABY.z); f.vel.set(0, 0, 0); f.stun = 0; f.ragdoll = 0; f.hurtT = 0; f.grabbed = false; f.cineLock = null; f.frozen = 0; f.blocking = false; f.iframes = 0; f.model.root.visible = false;
      const ps = abyssPlayers(), tgt = ps.sort((a, b) => dist2d(a, f) - dist2d(b, f))[0];
      if (tgt && B.state !== 'dead') { const ya = Math.atan2(tgt.pos.x - ABY.x, tgt.pos.z - ABY.z); let d = ((ya - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; g.rotation.y += d * Math.min(1, dt * (B.stagger > 0 ? .4 : 1.5)); }
      const rage = B.phase2 ? 1.7 : 1, dead = B.state === 'dead';
      B.jet = Math.max(0, B.jet - dt * 1.6); const pulse = Math.sin(t * 1.5 * rage) * .035 + B.jet * .12;
      B.mantle.scale.set(1 + pulse, 1 - pulse * .8, 1 + pulse); B.head.scale.set(1 + pulse * .3, .86 - pulse * .2, 1.05);
      B.fins.forEach(([fin, s]) => { fin.rotation.z = s * (.5 + Math.sin(t * 2.4 * rage) * .22); });
      B.arms.forEach(a => {
        if (a.severed) { a.regrow -= dt; if (a.regrow <= 0) { a.severed = false; a.hp = a.max; a.root.visible = true; a.root.scale.setScalar(.2); burst(armWorld(a).add(new V3(0, 1, 0)), 14, '#ffd0dc', 6, .2, .6, -.2); } return; }
        a.root.scale.setScalar(Math.min(1, a.root.scale.x + dt * .8)); a.flash = Math.max(0, a.flash - dt);
        if (a.busy) return;
        const ph = a.ang * 1.7;
        a.segs.forEach((s, i) => { const w = dead ? 0 : 1, base = dead ? .45 + i * .03 : a.rest[i]; s.rotation.x += ((base + Math.sin(t * 1.5 * rage - i * .55 + ph) * (.04 + .022 * i) * w) - s.rotation.x) * Math.min(1, dt * (dead ? 1.5 : 6)); s.rotation.y = Math.sin(t * 1.1 * rage - i * .4 + ph * 1.3) * .07 * w; });
      });
      const ex = B.vuln > 0 || B.exposed > 0;
      B.eyes.forEach(e => { e.material.color.set(B.phase2 ? 0xff3b30 : (ex ? 0x7df9ff : 0xffd23f)); });
      B.spots.forEach((s, i) => { s.visible = !dead || Math.random() < .3; s.scale.setScalar(.7 + Math.sin(t * 2.5 + i) * .3); });
      B.spotM.color.set(B.phase2 ? 0xff5a2a : (ex ? 0xfff2a8 : 0x39e6ff));
      B.hitT = Math.max(0, B.hitT - dt); for (const m of B.mats) m.emissive.setRGB(B.hitT > 0 ? .6 : ex ? .1 : .14, B.hitT > 0 ? .35 : ex ? .3 : .04, B.hitT > 0 ? .35 : ex ? .4 : .08);
      B.vuln = Math.max(0, B.vuln - dt); B.exposed = Math.max(0, B.exposed - dt); B.stagger = Math.max(0, B.stagger - dt);
      if (B.stagger > 0) { g.rotation.z = Math.sin(t * 30) * .03 * Math.min(1, B.stagger); } else if (!dead) { g.rotation.z *= .9; }
      if (B.state === 'intro') { B.t += dt; g.position.y = ABY.y - 1.5; B.body.position.y = 7 - 9 + Math.min(1, B.t / 3.2) * 9; if (Math.random() < dt * 22) emit(ABY.x + rand(-9, 9), ABY.y + .5, ABY.z + rand(-9, 9), rand(-3, 3), rand(2, 6), rand(-3, 3), '#8aa4b8', .3, .9, 1, 2); if (B.t > 3.4) { B.state = 'fight'; B.body.position.y = 7; } }
      else if (B.state === 'fight') {
        if (!B.phase2 && f.hp < f.maxHp * .5) { B.phase2 = true; showBanner('¡EL KRAKEN SE ENFURECE!', '#ff3b30', 'Más rápido · rayos de los ojos'); camPunch(1, 1); G.shake = Math.max(G.shake, 1.6); screenFlash(.5); sfx('boom', g.position, 1); }
        if (B.atk) { B.atk.t += dt; B.atk.upd(dt); if (B.atk.t >= B.atk.dur) { if (B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.cd = B.phase2 ? rand(.9, 1.7) : rand(1.7, 2.6); } }
        else if (ps.length && B.stagger <= 0) { B.cd -= dt; if (B.cd <= 0) B.atk = pickAttack(); }
      }
      const inked = new Set();
      for (let i = B.zones.length - 1; i >= 0; i--) { const z = B.zones[i]; z.t += dt; z.m.material.opacity = Math.min(.8, z.t * 1.2) * (z.t > z.life - 1 ? Math.max(0, z.life - z.t) : 1);
        if (z.t > .9) for (const p of ps) { const d = Math.hypot(p.pos.x - z.x, p.pos.z - z.z); if (d < 5.5 && p.pos.y < ABY.y + 1.2) inked.add(p); }
        if (z.t >= z.life) { scene.remove(z.m); B.zones.splice(i, 1); } }
      for (const p of inked) { if (p.iframes > 0) continue; p.hp -= 3.5 * dt; p.vel.x *= Math.exp(-3 * dt); p.vel.z *= Math.exp(-3 * dt); p.flashT = Math.max(p.flashT || 0, .05); if (p.hp <= 0 && p.alive) kill(p, null); }
      for (let i = B.tele.length - 1; i >= 0; i--) { const z = B.tele[i]; z.t += dt; if (z.t >= z.life) { scene.remove(z.m); B.tele.splice(i, 1); } }
      if (B.bar) {
        B.bar.querySelector('i').style.width = Math.max(0, f.hp / f.maxHp * 100).toFixed(1) + '%'; B.bar.classList.toggle('ex', ex);
        const ar = B.bar.querySelector('.ar'); if (ar.children.length !== 8) ar.innerHTML = '<u></u>'.repeat(8); [...ar.children].forEach((u, i) => { const a = B.arms[i]; u.style.opacity = a.severed ? .15 : (.35 + .65 * a.hp / a.max); u.style.background = a.severed ? '#555' : (a.flash > 0 ? '#fff' : '#39e6ff'); });
        B.bar.querySelector('small').textContent = B.state === 'intro' ? 'Despertando…' : ex ? '¡EXPUESTO! daño aumentado' : B.phase2 ? 'ENFURECIDO · corta tentáculos para dañar el cuerpo' : 'Corta los tentáculos (' + aliveArms().length + '/8) · salta los barridos';
      }
      if (dead) { B.deadT += dt; g.position.y -= dt * 1.6; g.rotation.z = Math.sin(B.deadT * 20) * .015 * Math.max(0, 1 - B.deadT / 4); B.body.rotation.x = Math.min(.5, B.deadT * .2); }
      if (!ps.length && !dead) { B.idle += dt; if (B.idle > 4) { B.idle = 0; sleepBoss('El Kraken vuelve a dormir'); } } else B.idle = 0;
    }

    // ---------------------------------------------------------------- la cueva del abismo (arena)
    function floorTex() {
      const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d'); g.fillStyle = '#0a1c2c'; g.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(' + (10 + rnd() * 20 | 0) + ',' + (35 + rnd() * 40 | 0) + ',' + (60 + rnd() * 40 | 0) + ',' + (.25 + rnd() * .35).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * 1024, rnd() * 1024, 6 + rnd() * 22, 0, 7); g.fill(); }
      const cx = 512, cy = 512;
      for (const [r, col, w] of [[70, '#39e6ff', 4], [150, '#2de0c0', 3], [250, '#9d6bff', 3], [330, '#39e6ff', 2], [420, '#ff4fd8', 2]]) { g.strokeStyle = col; g.lineWidth = w; g.globalAlpha = .75; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
      for (let ring = 0; ring < 3; ring++) { const n = 12 + ring * 6, r = 110 + ring * 100; for (let i = 0; i < n; i++) { const a = i / n * 6.283; g.save(); g.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.rotate(a + 1.57); g.globalAlpha = .8; g.strokeStyle = ring % 2 ? '#ff4fd8' : '#39e6ff'; g.lineWidth = 3; g.beginPath(); g.moveTo(-10, 12); g.lineTo(0, -14); g.lineTo(10, 12); g.moveTo(-6, 2); g.lineTo(6, 2); g.stroke(); g.restore(); } }
      g.globalAlpha = 1; const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
    }
    function buildAbyss() {
      if (AB.built) return; AB.built = true;
      const r = new T.Group(); r.position.set(ABY.x, ABY.y, ABY.z); r.visible = false; scene.add(r); AB.root = r;
      const fl = new T.Mesh(new T.CircleGeometry(ABY.R + 10, 96), new T.MeshBasicMaterial({ map: floorTex() })); fl.rotation.x = -Math.PI / 2; r.add(fl);
      const N = 260, im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), N), M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), P = new V3(), S = new V3(), col = new T.Color();
      for (let i = 0; i < N; i++) { const a = rnd() * 6.283, d = 30 + Math.sqrt(rnd()) * (ABY.R - 30), w = .8 + rnd() * 3.2, h = .12 + rnd() * (i % 9 ? .5 : 1.8); P.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); E.set(0, rnd() * 3, 0); Q.setFromEuler(E); S.set(w, h, w * (.6 + rnd() * .8)); M.compose(P, Q, S); im.setMatrixAt(i, M); im.setColorAt(i, col.set(rnd() < .15 ? '#1f5272' : rnd() < .5 ? '#16304a' : '#0f2338')); }
      im.instanceColor.needsUpdate = true; r.add(im);
      const gap = .14, wall = new T.Mesh(new T.CylinderGeometry(ABY.R + 12, ABY.R + 12, 110, 56, 1, true, -Math.PI / 2 + gap, Math.PI * 2 - gap * 2), new T.MeshBasicMaterial({ color: 0x03101c, side: T.DoubleSide })); wall.position.y = 55; r.add(wall);
      for (let i = 0; i < 70; i++) { const a = rnd() * 6.283; mkbox(r, .5, 6 + rnd() * 26, .3, bmat(rnd() < .5 ? 0x2ee6ff : 0x9d6bff, .5, true), Math.cos(a) * (ABY.R + 11.6), 4 + rnd() * 70, Math.sin(a) * (ABY.R + 11.6), 0, -a + Math.PI / 2, 0); }
      const ceil = new T.Mesh(new T.CircleGeometry(ABY.R + 12, 56), new T.MeshBasicMaterial({ color: 0x0c5a7a, transparent: true, opacity: .55, side: T.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 100; r.add(ceil);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const sh = new T.Mesh(new T.CylinderGeometry(3, 9, 100, 12, 1, true), bmat(0x6fd8ff, .05, true)); sh.position.set(Math.cos(a) * 36, 50, Math.sin(a) * 36); r.add(sh); }
      const stalM = lm('#1c3a52'); for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, d = rnd() * (ABY.R + 6), h = 6 + rnd() * 26, c = new T.Mesh(new T.ConeGeometry(1 + rnd() * 2.6, h, 7), stalM); c.rotation.x = Math.PI; c.position.set(Math.cos(a) * d, 100 - h / 2 + 1, Math.sin(a) * d); r.add(c); }
      const plat = new T.Mesh(new T.CylinderGeometry(38, 40, 1.2, 48), new T.MeshBasicMaterial({ color: 0x12304a })); plat.position.y = .45; r.add(plat);
      const edge = new T.Mesh(new T.RingGeometry(37.6, 39.5, 64), bmat(0x39e6ff, .7, true)); edge.rotation.x = -Math.PI / 2; edge.position.y = 1.08; r.add(edge);
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + .78, x = Math.cos(a) * 46, z = Math.sin(a) * 46; mkbox(r, 3, 17, 3, lm('#1b3047'), x, 8.5, z, 0, a, 0); mkbox(r, 2.2, 2.2, 2.2, bmat(i % 2 ? 0xff4fd8 : 0x39e6ff, .95, true), x, 18.3, z, .7, .7, 0); const bm2 = new T.Mesh(new T.CylinderGeometry(.5, .5, 80, 8, 1, true), bmat(i % 2 ? 0xff4fd8 : 0x39e6ff, .18, true)); bm2.position.set(x, 58, z); r.add(bm2); }
      const stone = lm('#26405a'), stone2 = lm('#1b3047');
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + rnd() * .3, d = 52 + rnd() * 14, h = 7 + rnd() * 12, x = Math.cos(a) * d, z = Math.sin(a) * d; mkbox(r, 3.2, h, 3.2, i % 2 ? stone : stone2, x, h / 2, z); mkbox(r, 4, .8, 4, stone, x, h + .2, z, .1, rnd() * 3, .08); }
      const crys = [bmat(0x39e6ff, .9, true), bmat(0xff4fd8, .9, true), bmat(0x9d6bff, .9, true)];
      for (let i = 0; i < 60; i++) { const a = rnd() * 6.283, d = 12 + rnd() * (ABY.R - 14), c = new T.Mesh(new T.ConeGeometry(.5 + rnd() * .9, 2 + rnd() * 5, 5), crys[i % 3]); c.position.set(Math.cos(a) * d, 1.2 + rnd() * 2, Math.sin(a) * d); c.rotation.set((rnd() - .5) * .6, rnd() * 3, (rnd() - .5) * .6); r.add(c); }
      const kelpM = lm('#0e6b5c'); for (let i = 0; i < 60; i++) { const a = rnd() * 6.283, d = 40 + rnd() * 32, h = 7 + rnd() * 12, k = mkbox(r, .5, h, .3, kelpM, Math.cos(a) * d, h / 2, Math.sin(a) * d); AB.kelp.push([k, rnd() * 6]); }
      { const bone = lm('#d8d2c0'); const rib = new T.Group(); rib.position.set(34, 0, -52); rib.rotation.y = .5; r.add(rib); for (let i = 0; i < 9; i++) { const arc = new T.Mesh(new T.TorusGeometry(7 - Math.abs(i - 4) * .5, .55, 6, 16, Math.PI), bone); arc.position.set(0, 0, i * 2.4 - 10); arc.rotation.y = Math.PI / 2; rib.add(arc); } mkbox(rib, 1.2, 1.2, 26, bone, 0, 0, 0); }
      { const wood = lm('#3a2a1c'), wood2 = lm('#2a1d12'); const w = new T.Group(); w.position.set(-44, 0, -48); w.rotation.set(0, .6, .22); r.add(w); mkbox(w, 5, 3, 18, wood, 0, 1.6, 0); mkbox(w, 4.4, 2, 8, wood2, 0, 3.4, -3); mkbox(w, .6, 14, .6, wood2, 0, 9, 2, .3); mkbox(w, 6, .4, 2.6, lm('#4a4538'), 0, 12, 2.6, .3); }
      const wc = document.createElement('canvas'); wc.width = 64; wc.height = 256; const w2 = wc.getContext('2d');
      for (let i = 0; i < 40; i++) { w2.fillStyle = 'rgba(190,240,255,' + (.2 + rnd() * .6).toFixed(2) + ')'; w2.fillRect(rnd() * 64, 0, 2 + rnd() * 6, 256); }
      const wt = new T.CanvasTexture(wc); wt.wrapS = wt.wrapT = T.RepeatWrapping; wt.repeat.set(3, 4); AB.fallTex = wt;
      buildCorridor(r, wt);
      const x = EXIT(), pg = new T.Group(); pg.position.set(x.x - ABY.x, 0, x.z - ABY.z); r.add(pg); AB.exit = pg;
      const ring = new T.Mesh(new T.TorusGeometry(3.8, .35, 10, 40), bmat(0xfff2a8, .95, true)); ring.position.y = 4.6; pg.add(ring); const disc = new T.Mesh(new T.CircleGeometry(3.5, 32), bmat(0xbff6ff, .3, true)); disc.position.y = 4.6; pg.add(disc); pg.userData.disc = disc;
      const beam = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 100, 16, 1, true), bmat(0xfff2a8, .12, true)); beam.position.y = 50; pg.add(beam);
      const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128; const l2 = lc.getContext('2d'); l2.font = 'bold 70px system-ui,Arial'; l2.textAlign = 'center'; l2.fillStyle = '#fff2a8'; l2.shadowColor = '#ffd54f'; l2.shadowBlur = 22; l2.fillText('SUPERFICIE', 256, 88);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(lc), transparent: true, depthWrite: false, fog: false })); sp.scale.set(18, 4.5, 1); sp.position.y = 11; pg.add(sp);
      for (const [lx, ly, lz, c, it] of [[0, 22, 0, 0x39e6ff, 1.5], [-42, 12, 0, 0x2de0c0, 1.1], [44, 12, 4, 0x9d6bff, 1.2], [0, 10, 40, 0xff4fd8, .9], [0, 10, -40, 0x39e6ff, .9]]) { const pl = new T.PointLight(c, it, 95, 1.6); pl.position.set(lx, ly, lz); r.add(pl); AB.lights.push(pl); }
    }

    // ---------------------------------------------------------------- el camino (largo, con giros): cascada -> pasillo decorado -> enemigos -> portón enorme -> sala del Kraken
    function pathInfo() { if (AB.pl) return AB.pl; const P = ABY_PTS, cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); AB.pl = { cum, len: cum[cum.length - 1] }; return AB.pl; }
    function pathAt(sd) {   // distancia desde el inicio -> punto, tangente y normal (coordenadas absolutas)
      const { cum, len } = pathInfo(); sd = Math.max(0, Math.min(len, sd)); let i = 1; while (i < cum.length - 1 && cum[i] < sd) i++;
      const a = ABY_PTS[i - 1], b = ABY_PTS[i], u = (sd - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
      return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, tx, tz, nx: -tz, nz: tx, yaw: Math.atan2(-tz, tx) };
    }
    function sdOf(x, z) { const p = abyPath(x, z), { cum } = pathInfo(), i = Math.min(cum.length - 2, Math.floor(p.i)); return cum[i] + (p.i - i) * (cum[i + 1] - cum[i]); }
    function ribbon(r, off, wid, y, mat, uvs) {
      const { len } = pathInfo(), n = Math.floor(len / 2.2), pos = [], uv = [], idx = [];
      for (let i = 0; i <= n; i++) { const sd = i / n * len, q = pathAt(sd), cx = q.x - ABY.x + q.nx * off, cz = q.z - ABY.z + q.nz * off; pos.push(cx - q.nx * wid / 2, y, cz - q.nz * wid / 2, cx + q.nx * wid / 2, y, cz + q.nz * wid / 2); uv.push(sd / uvs, 0, sd / uvs, 1); if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const ge = new T.BufferGeometry(); ge.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); ge.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); ge.setIndex(idx);
      const m = new T.Mesh(ge, mat); r.add(m); return m;
    }
    function pathTex() {
      const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#0a1b2a'; g.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(' + (10 + rnd() * 25 | 0) + ',' + (40 + rnd() * 40 | 0) + ',' + (60 + rnd() * 40 | 0) + ',.35)'; g.beginPath(); g.arc(rnd() * 512, rnd() * 256, 4 + rnd() * 16, 0, 7); g.fill(); }
      g.strokeStyle = '#17405c'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, 256); g.stroke(); } g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke();
      g.strokeStyle = '#39e6ff'; g.globalAlpha = .8; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke();
      for (let i = 0; i < 4; i++) { g.save(); g.translate(64 + i * 128, 64); g.strokeStyle = i % 2 ? '#ff4fd8' : '#2de0c0'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.moveTo(-10, 8); g.lineTo(0, -12); g.lineTo(10, 8); g.stroke(); g.restore(); }
      g.globalAlpha = 1; const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
    }
    function buildCorridor(r, fallTex) {
      const { len } = pathInfo(), hw = ABY_COR.hw, rel = q => [q.x - ABY.x, q.z - ABY.z];
      const ft = pathTex(); ribbon(r, 0, hw * 2 + 2.6, .03, new T.MeshBasicMaterial({ map: ft, side: T.DoubleSide }), 14);
      for (const [sd, col] of [[-1, 0x39e6ff], [1, 0xff4fd8]]) ribbon(r, sd * (hw - .5), .5, .09, bmat(col, .9, true), 30);
      const stone = lm('#26405a'), stone2 = lm('#1b3047'), rockCols = ['#0a2233', '#0e2d44', '#08192a', '#12384f'];
      // paredes: rocas altas, una cada ~2.8 m a cada lado (se saltan donde otro tramo del camino pasa cerca)
      const walls = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), 900), Mx = new T.Matrix4(), Qn = new T.Quaternion(), Eu = new T.Euler(), Pv = new V3(), Sv = new V3(), cl = new T.Color(); let nw = 0;
      for (let sd = 0; sd < len; sd += 2.6) for (const side of [-1, 1]) {
        const q = pathAt(sd), v = side * (hw + 2.4 + rnd() * 1.2), x = q.x + q.nx * v, z = q.z + q.nz * v;
        if (abyPath(x, z).d < hw + 1.2 || Math.hypot(x - ABY.x, z - ABY.z) < ABY.R + 14 || nw >= 900) continue;
        const h = 40 + rnd() * 26; Pv.set(x - ABY.x, h / 2, z - ABY.z); Eu.set(0, q.yaw + (rnd() - .5) * .3, 0); Qn.setFromEuler(Eu); Sv.set(3.4 + rnd() * 2, h, 3.6 + rnd() * 2.4); Mx.compose(Pv, Qn, Sv); walls.setMatrixAt(nw, Mx); walls.setColorAt(nw, cl.set(rockCols[nw % 4])); nw++;
      }
      walls.count = nw; walls.instanceColor.needsUpdate = true; r.add(walls);
      // techo (desde pasada la cascada) y estalactitas
      const ceil = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0x03101c }), 160); let nc = 0;
      for (let sd = 34; sd < len; sd += 6) { const q = pathAt(sd); if (Math.hypot(q.x - ABY.x, q.z - ABY.z) < ABY.R + 6) continue; Pv.set(q.x - ABY.x, 74, q.z - ABY.z); Eu.set(0, q.yaw, 0); Qn.setFromEuler(Eu); Sv.set(8, 2, hw * 2 + 12); Mx.compose(Pv, Qn, Sv); ceil.setMatrixAt(nc++, Mx); }
      ceil.count = nc; r.add(ceil);
      for (let i = 0; i < 70; i++) { const q = pathAt(40 + rnd() * (len - 50)), v = (rnd() - .5) * hw * 1.8, h = 4 + rnd() * 13, c = new T.Mesh(new T.ConeGeometry(.8 + rnd() * 1.8, h, 6), stone2); c.rotation.x = Math.PI; c.position.set(q.x - ABY.x + q.nx * v, 74 - h / 2 + .5, q.z - ABY.z + q.nz * v); r.add(c); }
      // decoración por zonas
      const arcCols = [0x39e6ff, 0xff4fd8, 0x9d6bff, 0x2de0c0], crys = arcCols.map(c => bmat(c, .9, true)), stem = lm('#0d5a4f'), bone = lm('#d8d2c0');
      const grp = (sd, v, ry) => { const q = pathAt(sd), g = new T.Group(); g.position.set(q.x - ABY.x + q.nx * v, 0, q.z - ABY.z + q.nz * v); g.rotation.y = ry == null ? q.yaw : ry; r.add(g); return g; };
      let ai = 0;
      for (let sd = 46; sd < len - 36; sd += 24, ai++) {   // arcos con orbes
        const g = grp(sd, 0); for (const sg of [-1, 1]) { mkbox(g, 1.7, 15, 1.7, ai % 2 ? stone : stone2, 0, 7.5, sg * (hw - 1.6)); mkbox(g, 2.4, .8, 2.4, stone, 0, 15.2, sg * (hw - 1.6)); const orb = new T.Mesh(new T.SphereGeometry(.55, 10, 8), bmat(arcCols[(ai + 1) % 4], .95, true)); orb.position.set(2.2, 11.5, sg * 3.2); g.add(orb); AB.kelp.push([orb, rnd() * 6]); }
        mkbox(g, 1.6, 1.3, hw * 2 - 1, stone2, 0, 16, 0); const arc = new T.Mesh(new T.TorusGeometry(hw - 2.6, .22, 8, 32, Math.PI), bmat(arcCols[ai % 4], .9, true)); arc.rotation.y = Math.PI / 2; arc.position.set(0, .6, 0); g.add(arc);
      }
      for (let sd = 18; sd < len - 24; sd += 7 + rnd() * 6) {
        const z = sd / len, sgn = rnd() < .5 ? -1 : 1, v = sgn * (hw - 2 - rnd() * 3.5), g = grp(sd, v, rnd() * 6), k = rnd();
        if (z < .26) {   // jardín de algas y cristales
          if (k < .5) { for (let j = 0; j < 4; j++) { const h = 3 + rnd() * 6, s2 = mkbox(g, .35, h, .3, stem, rnd() * 2 - 1, h / 2, rnd() * 2 - 1); AB.kelp.push([s2, rnd() * 6]); const tip = new T.Mesh(new T.SphereGeometry(.4, 8, 6), crys[j % 4]); tip.position.set(0, h / 2 + .2, 0); s2.add(tip); } }
          else for (let j = 0; j < 4; j++) { const h = 2 + rnd() * 6, c = new T.Mesh(new T.ConeGeometry(.45 + rnd() * .8, h, 5), crys[(j + (rnd() * 4 | 0)) % 4]); c.position.set(rnd() * 2.4 - 1.2, h / 2, rnd() * 2 - 1); c.rotation.set((rnd() - .5) * .6, rnd() * 3, (rnd() - .5) * .6); g.add(c); }
        } else if (z < .52) {   // ruinas
          if (k < .4) { const h = 3 + rnd() * 8; mkbox(g, 1.6, h, 1.6, stone, 0, h / 2, 0, (rnd() - .5) * .3, 0, (rnd() - .5) * .3); mkbox(g, 2.3, .9, 2.3, stone2, 0, h + .3, 0, .1, rnd(), .08); }
          else if (k < .75) { for (let j = 0; j < 3; j++) mkbox(g, 2 + rnd() * 2, 1 + rnd(), 2 + rnd() * 2, j % 2 ? stone : stone2, rnd() * 3 - 1.5, .6 + j * .3, rnd() * 3 - 1.5, 0, rnd() * 3, 0); }
          else { const t2 = new T.Mesh(new T.TorusGeometry(2.2, .35, 8, 20), bmat(arcCols[(rnd() * 4) | 0], .55, true)); t2.rotation.x = Math.PI / 2; t2.position.y = .15; g.add(t2); }
        } else if (z < .76) {   // restos de naufragios y huesos
          if (k < .35) { for (let j = 0; j < 7; j++) { const arc = new T.Mesh(new T.TorusGeometry(3.6 - Math.abs(j - 3) * .3, .34, 6, 14, Math.PI), bone); arc.position.set(0, 0, j * 1.7 - 5); arc.rotation.y = Math.PI / 2; g.add(arc); } mkbox(g, .8, .8, 12, bone, 0, 0, 0); }
          else if (k < .7) { for (let j = 0; j < 3; j++) mkbox(g, .5, 1.6 + rnd() * 2, .5, lm('#3a2a1c'), rnd() * 4 - 2, .8, rnd() * 4 - 2, (rnd() - .5) * 1, rnd() * 3, (rnd() - .5) * 1); const an = new T.Mesh(new T.TorusGeometry(.9, .14, 6, 14, Math.PI * 1.4), lm('#3b3f46')); an.position.y = 1.2; g.add(an); }
          else { const sk = new T.Mesh(new T.SphereGeometry(.5, 8, 6), bone); sk.position.y = .5; g.add(sk); mkbox(g, .8, .3, .8, bone, 0, .2, .3); }
        } else {   // raíces del Kraken: tentáculos rosas y cristales rojos
          if (k < .55) { const tc = new T.Group(); g.add(tc); let a = 0; for (let j = 0; j < 7; j++) { a += .22; const sg2 = mkbox(tc, .9 - j * .09, 1.5, .9 - j * .09, lm('#a8486a'), 0, 0, 0); sg2.position.set(Math.sin(a) * j * .9, j * 1.1, 0); sg2.rotation.z = -a; AB.kelp.push([sg2, rnd() * 6]); } }
          else for (let j = 0; j < 4; j++) { const h = 2 + rnd() * 5, c = new T.Mesh(new T.ConeGeometry(.5 + rnd() * .8, h, 5), bmat(rnd() < .5 ? 0xff2d7a : 0xff8fb0, .9, true)); c.position.set(rnd() * 2 - 1, h / 2, rnd() * 2 - 1); c.rotation.set((rnd() - .5) * .5, rnd() * 3, (rnd() - .5) * .5); g.add(c); }
        }
      }
      for (let sd = 30; sd < len - 20; sd += 11) { const g = grp(sd, 0), rn = mkbox(g, 3.2, .05, 3.2, bmat(arcCols[(sd / 11 | 0) % 4], .35, true), 0, .06, 0); rn.rotation.y = sd; AB.kelp.push([rn, rnd() * 6]); }
      // barco naufragado grande (guiño al barco del muelle)
      { const g = grp(len * .46, hw - 5, .5), wood = lm('#3a2a1c'), wood2 = lm('#2a1d12'); g.rotation.z = .2; mkbox(g, 4, 2.4, 13, wood, 0, 1.2, 0); mkbox(g, 3.4, 1.6, 6, wood2, 0, 2.8, -2); mkbox(g, .5, 10, .5, wood2, 0, 7, 1, .35); mkbox(g, 5, .3, 2, lm('#4a4538'), 0, 9, 2.4, .35); mkbox(g, .1, 5, 3.6, new T.MeshLambertMaterial({ color: 0x8a8f9a, side: T.DoubleSide }), .1, 6, -1.2, .35); }
      { const g = grp(len * .62, -(hw - 4), 2.6); mkbox(g, 3, 1.6, 6, stone, 0, .8, 0, 0, 0, .1); mkbox(g, 2.2, 3, 1.6, stone2, 0, 2.2, -2.8, .5, 0, 0); mkbox(g, 1.7, 1.7, 1.7, stone, 0, 3.2, -4.6, .2, 0, 0); for (const ex of [-.45, .45]) mkbox(g, .35, .35, .2, bmat(0x39e6ff, 1, true), ex, 3.3, -5.45); }
      // portón enorme
      const DX = -88, door = new T.Group(); door.position.set(DX, 0, 0); r.add(door); AB.door = { g: door, open: false, k: 0, l: null, r: null, gem: null };
      const dm = lm('#1a2c42'), dm2 = lm('#22405e');
      for (const sg of [-1, 1]) { mkbox(door, 5, 52, 5, dm, 0, 26, sg * (hw + 2.6)); mkbox(door, 6.4, 2, 6.4, stone, 0, 52.5, sg * (hw + 2.6)); mkbox(door, 6.4, 2.4, 6.4, stone, 0, 1.2, sg * (hw + 2.6)); }
      mkbox(door, 5, 6, hw * 2 + 12, dm, 0, 52, 0); mkbox(door, 3.4, 3, hw * 2 + 6, dm2, 1.4, 47.5, 0);
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI, tn = new T.Mesh(new T.TorusGeometry(2.6, .34, 6, 14, Math.PI * 1.25), bmat(0xff4fd8, .9, true)); tn.position.set(2.6, 47.5, -hw + 1.5 + k * ((hw * 2 - 3) / 8)); tn.rotation.set(0, Math.PI / 2, a + k); door.add(tn); }
      for (const sg of [-1, 1]) { const leaf = new T.Group(); door.add(leaf); mkbox(leaf, 3, 44, hw - .1, dm2, 0, 22, sg * hw / 2); mkbox(leaf, 3.4, 2, hw, dm, 0, 8, sg * hw / 2); mkbox(leaf, 3.4, 2, hw, dm, 0, 22, sg * hw / 2); mkbox(leaf, 3.4, 2, hw, dm, 0, 36, sg * hw / 2); mkbox(leaf, .6, 40, .6, bmat(0xff4fd8, .85, true), 1.7, 22, sg * (hw / 2 + 2)); AB.door[sg < 0 ? 'l' : 'r'] = leaf; }
      const gem = new T.Mesh(new T.OctahedronGeometry(2.2), bmat(0xff2d55, .95, true)); gem.position.set(2.4, 26, 0); door.add(gem); AB.door.gem = gem;
      const lk = new T.Mesh(new T.TorusGeometry(3.4, .35, 8, 28), bmat(0xff8fb0, .9, true)); lk.position.set(2.2, 26, 0); lk.rotation.y = Math.PI / 2; door.add(lk);
      const gc = document.createElement('canvas'); gc.width = 768; gc.height = 128; const g2 = gc.getContext('2d'); g2.font = 'bold 82px system-ui,Arial'; g2.textAlign = 'center'; g2.fillStyle = '#ffd0dc'; g2.shadowColor = '#ff2d7a'; g2.shadowBlur = 24; g2.fillText('SALA DEL KRAKEN', 384, 94);
      const gs = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(gc), transparent: true, depthWrite: false, fog: false })); gs.scale.set(34, 5.6, 1); gs.position.set(0, 60, 0); door.add(gs);
      const kc = document.createElement('canvas'); kc.width = 512; kc.height = 96; AB.door.kc = kc; AB.door.kg = kc.getContext('2d'); AB.door.kt = new T.CanvasTexture(kc);
      const ks = new T.Sprite(new T.SpriteMaterial({ map: AB.door.kt, transparent: true, depthWrite: false, fog: false })); ks.scale.set(20, 3.75, 1); ks.position.set(-4, 34, 0); door.add(ks); AB.door.ks = ks;
      // la cascada por la que caes y el charco
      const q0 = pathAt(0), e = [q0.x - ABY.x, q0.z - ABY.z], fall = new T.Mesh(new T.CylinderGeometry(6.2, 6.2, 100, 32, 1, true), new T.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: .6, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })); fall.position.set(e[0], 50, e[1]); r.add(fall); AB.fall = fall;
      const pool = new T.Mesh(new T.CircleGeometry(11, 40), bmat(0x39b8d8, .5, false)); pool.rotation.x = -Math.PI / 2; pool.position.set(e[0], .12, e[1]); r.add(pool);
      const foam = new T.Mesh(new T.RingGeometry(4, 12, 40), bmat(0xdff6ff, .35, true)); foam.rotation.x = -Math.PI / 2; foam.position.set(e[0], .16, e[1]); r.add(foam); AB.foam = foam;
      const cap = new T.Mesh(new T.CircleGeometry(24, 28), new T.MeshBasicMaterial({ color: 0x0c5a7a, transparent: true, opacity: .5, side: T.DoubleSide })); cap.rotation.x = Math.PI / 2; cap.position.set(e[0], 100, e[1]); r.add(cap);
    }
    function paintKeyLabel(txt, col) {
      const D = AB.door; if (!D || D.kTxt === txt) return; D.kTxt = txt; const g = D.kg; g.clearRect(0, 0, 512, 96); g.fillStyle = 'rgba(8,16,28,.8)'; g.fillRect(6, 8, 500, 80); g.strokeStyle = col; g.lineWidth = 3; g.strokeRect(6, 8, 500, 80);
      g.font = 'bold 34px system-ui,Arial'; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, 256, 60); D.kt.needsUpdate = true;
    }
    const doorAbs = () => ({ x: ABY.x - 88, z: ABY.z });

    // ---------------------------------------------------------------- enemigos del pasillo (cada uno con su comportamiento) y la llave
    const mm = (c, em) => { const m = new T.MeshLambertMaterial({ color: c }); if (em) m.emissive = new T.Color(em); return m; };
    const MOB_T = {
      crab: { n: 'Cangrejo abisal', hp: 70, spd: 5.4, dmg: 9, r: 1.5, h: 1.8, rng: 2.8, cd: 1.7, wind: .45, aggro: 24 },
      jelly: { n: 'Medusa eléctrica', hp: 45, spd: 3.1, dmg: 8, r: 1.6, h: 2.6, rng: 5.2, cd: 2.7, wind: .85, aggro: 20, fly: 3.2 },
      angler: { n: 'Rape abisal', hp: 85, spd: 6.2, dmg: 13, r: 1.7, h: 2.0, rng: 4.2, cd: 2.5, wind: .55, aggro: 28, fly: 1.1 },
      drowned: { n: 'Marinero ahogado', hp: 120, spd: 3.7, dmg: 14, r: 1.1, h: 2.2, rng: 2.6, cd: 1.9, wind: .6, aggro: 24 },
      squidling: { n: 'Calamarín', hp: 55, spd: 4.2, dmg: 7, r: 1.2, h: 2.0, rng: 18, cd: 2.3, wind: .6, aggro: 30, ranged: 1, fly: .8 },
      captain: { n: 'Capitán Ahogado', hp: 640, spd: 3.5, dmg: 22, r: 2.0, h: 4.0, rng: 4.2, cd: 2.1, wind: .85, aggro: 34, big: 1, key: 1 },
    };
    const MOB_BUILD = {
      crab() { const g = new T.Group(), sh = mm('#b5402a'), sh2 = mm('#d2593a'), legs = [], claws = []; mkbox(g, 2.6, 1, 2, sh, 0, 1.1, 0); mkbox(g, 2.1, .5, 1.5, sh2, 0, 1.75, -.1);
        for (const sg of [-1, 1]) { const e = mkbox(g, .12, .55, .12, sh, sg * .55, 2.25, .75); const eye = new T.Mesh(new T.SphereGeometry(.2, 8, 6), bmat(0xffee55, 1, true)); eye.position.set(0, .35, 0); e.add(eye);
          const arm = new T.Group(); arm.position.set(sg * 1.5, 1.2, .8); g.add(arm); mkbox(arm, .5, .5, 1.3, sh, 0, 0, .6); const pa = mkbox(arm, .8, .5, .9, sh2, 0, 0, 1.5), pb = mkbox(arm, .8, .3, .9, sh2, 0, 0, 1.5); claws.push([arm, pa, pb, sg]);
          for (let i = 0; i < 3; i++) { const lg = new T.Group(); lg.position.set(sg * 1.3, 1.0, -.6 + i * .55); g.add(lg); mkbox(lg, 1.2, .2, .2, sh, sg * .6, 0, 0, 0, 0, sg * -.3); legs.push([lg, sg, i]); } }
        g.userData = { legs, claws }; return g; },
      jelly() { const g = new T.Group(), tents = []; const bell = new T.Mesh(new T.SphereGeometry(1.5, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bmat(0xff6fd8, .6, true)); bell.position.y = .6; g.add(bell);
        const core = new T.Mesh(new T.SphereGeometry(.7, 10, 8), bmat(0xffffff, .4, true)); core.position.y = .7; g.add(core); const rim = new T.Mesh(new T.TorusGeometry(1.45, .1, 6, 20), bmat(0xffa8ee, .9, true)); rim.rotation.x = Math.PI / 2; rim.position.y = .6; g.add(rim);
        for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, tg = new T.Group(); tg.position.set(Math.cos(a) * .9, .5, Math.sin(a) * .9); g.add(tg); const b = mkbox(tg, .12, 2.6, .12, bmat(0xff8fe8, .75, true), 0, -1.3, 0); tents.push([tg, i]); }
        g.userData = { tents, bell, core }; return g; },
      angler() { const g = new T.Group(), dk = mm('#2b3a5a'), lt = mm('#46608a'), teeth = []; const body = new T.Mesh(new T.SphereGeometry(1.3, 12, 10), dk); body.scale.set(1.5, 1.05, 1.15); body.position.y = 1.1; g.add(body); const belly = new T.Mesh(new T.SphereGeometry(1.0, 10, 8), lt); belly.scale.set(1.5, .7, 1); belly.position.set(0, .7, 0); g.add(belly);
        const jawU = mkbox(g, 1.9, .35, 1.6, dk, 1.7, 1.0, 0), jawL = new T.Group(); jawL.position.set(1.0, .75, 0); g.add(jawL); mkbox(jawL, 1.9, .3, 1.5, dk, .8, 0, 0); for (let i = 0; i < 6; i++) { const t2 = new T.Mesh(new T.ConeGeometry(.12, .5, 5), mm('#f2f2e6')); t2.position.set(.3 + i * .3, .3, (i % 2 ? .5 : -.5)); jawL.add(t2); t2.rotation.z = Math.PI; }
        const st = mkbox(g, .12, 1.6, .12, mm('#162038'), 1.3, 2.2, 0, 0, 0, -.5); const orb = new T.Mesh(new T.SphereGeometry(.34, 10, 8), bmat(0x7dffb0, 1, true)); orb.position.set(2.0, 2.9, 0); g.add(orb);
        for (const sg of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.28, 8, 6), mm('#ffffff')); e.position.set(1.4, 1.7, sg * .8); g.add(e); const pu = new T.Mesh(new T.SphereGeometry(.13, 6, 6), mm('#000000')); pu.position.set(1.62, 1.7, sg * .8); g.add(pu); mkbox(g, .8, .12, .9, lt, 0, 1.0, sg * 1.5, 0, sg * .3, 0); }
        mkbox(g, 1.2, 1.3, .1, lt, -2.2, 1.2, 0, 0, 0, .3); for (let i = 0; i < 4; i++) { const c = new T.Mesh(new T.ConeGeometry(.15, .7, 5), dk); c.position.set(-.8 + i * .5, 2.2, 0); g.add(c); }
        g.userData = { jaw: jawL, orb }; return g; },
      drowned(big) { const g = new T.Group(), sk = mm('#9bb7a4'), cl = mm('#3b5568'), pn = mm('#2a3a4a'), glow = bmat(0x7dffb0, 1, true), parts = {}; parts.legL = mkbox(g, .5, 1.1, .5, pn, -.28, .55, 0); parts.legR = mkbox(g, .5, 1.1, .5, pn, .28, .55, 0); mkbox(g, 1.2, 1.3, .7, cl, 0, 1.75, 0);
        parts.head = mkbox(g, .8, .8, .8, sk, 0, 2.8, 0); for (const sg of [-1, 1]) { mkbox(parts.head, .18, .14, .1, glow, sg * .2, .06, .42); parts.arm = parts.arm || []; const a = new T.Group(); a.position.set(sg * .75, 2.3, 0); g.add(a); mkbox(a, .35, 1.1, .35, sk, 0, -.5, 0); parts.arm.push(a); a.rotation.x = -1.1; }
        for (let i = 0; i < 6; i++) mkbox(parts.head, .08, .5 + rnd() * .4, .08, mm('#1d5a3c'), -.3 + i * .12, .5, -.1, (rnd() - .5) * .6, 0, (rnd() - .5) * .6); for (let i = 0; i < 5; i++) mkbox(g, .24, .24, .24, mm('#7b8a6a'), rnd() * 1 - .5, 1.3 + rnd(), .38);
        const hook = mkbox(parts.arm[1], .12, .5, .12, mm('#6a5a4a'), 0, -1.2, .1); g.userData = parts; return g; },
      squidling() { const g = new T.Group(), tn = []; const mantle = new T.Mesh(new T.ConeGeometry(.9, 2.2, 8), mm('#e0788f')); mantle.position.y = 2.2; g.add(mantle); const hd = new T.Mesh(new T.SphereGeometry(.75, 10, 8), mm('#f08aa0')); hd.position.y = 1.2; g.add(hd);
        for (const sg of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.22, 8, 6), bmat(0xffee55, 1, true)); e.position.set(sg * .45, 1.3, .5); g.add(e); } for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, tg = new T.Group(); tg.position.set(Math.cos(a) * .5, 1.0, Math.sin(a) * .5); g.add(tg); mkbox(tg, .18, 1.6, .18, mm('#d46a82'), 0, -.7, 0); tn.push([tg, i]); }
        g.userData = { tn, mantle }; return g; },
      captain() { const g = MOB_BUILD.drowned(true), hat = new T.Group(); g.userData.big = 1; const head = g.userData.head; mkbox(g, 1.6, .22, 1.6, mm('#14161c'), 0, 3.3, 0); mkbox(g, 1.0, .5, 1.0, mm('#14161c'), 0, 3.6, 0); mkbox(g, 1.62, .1, 1.62, mm('#d4a017'), 0, 3.38, 0);
        mkbox(g, 1.6, 1.6, .12, mm('#6a1e22'), 0, 1.7, -.45, .1, 0, 0); for (const sg of [-1, 1]) mkbox(g, .7, .3, .7, mm('#d4a017'), sg * .8, 2.7, 0);
        const lan = new T.Mesh(new T.SphereGeometry(.3, 10, 8), bmat(0xffb347, 1, true)); lan.position.set(1.1, 1.0, .8); g.add(lan); mkbox(g, .06, .8, .06, mm('#222'), 1.1, 1.5, .8); g.scale.setScalar(1.7); return g; },
    };
    function goldKey() {
      const g = new T.Group(), gm = bmat(0xffd54f, 1, false); const ring = new T.Mesh(new T.TorusGeometry(.5, .13, 8, 16), gm); ring.position.y = .9; g.add(ring); mkbox(g, .16, 1.6, .16, gm, 0, -.1, 0); mkbox(g, .5, .16, .16, gm, .3, -.7, 0); mkbox(g, .4, .16, .16, gm, .25, -.35, 0);
      const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(255,230,120,.9)'); gr.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false })); sp.scale.set(5, 5, 1); g.add(sp); g.scale.setScalar(1.3); return g;
    }
    const KEY = { st: 'none', holder: null, g: null, pos: new V3(), chip: null };
    function keyChip(on) { if (!KEY.chip) { KEY.chip = document.createElement('div'); KEY.chip.style.cssText = 'position:fixed;top:112px;left:50%;transform:translateX(-50%);z-index:70;background:rgba(10,16,30,.85);border:2px solid #ffd54f;color:#ffe9a0;border-radius:12px;padding:7px 16px;font:700 15px system-ui,Arial;letter-spacing:.06em;display:none;pointer-events:none;text-shadow:0 1px 4px #000'; KEY.chip.textContent = '🗝️ LLAVE DEL KRAKEN · llévala al portón enorme'; document.body.appendChild(KEY.chip); } KEY.chip.style.display = on ? 'block' : 'none'; }
    function dropKey(x, z, msg) {
      if (!KEY.g) { KEY.g = goldKey(); scene.add(KEY.g); } KEY.st = 'ground'; KEY.holder = null; KEY.pos.set(x, ABY.y + 1.6, z); KEY.g.visible = true; KEY.g.position.copy(KEY.pos);
      if (msg !== false && G.player && G.player.abyss) { showBanner('🗝️ ¡LA LLAVE!', '#ffd54f', 'Recógela y llévala al portón enorme'); addFeedText('🗝️ La llave del Kraken cayó al suelo', '#ffd54f'); }
    }
    function resetRun() {
      for (const m of AB.mobs) { scene.remove(m.g); const j = G.fighters.indexOf(m.f); if (j >= 0) G.fighters.splice(j, 1); try { m.f.dispose(); } catch (e) { } } AB.mobs = []; AB.groups = null; AB.bolts.forEach(b => scene.remove(b.m)); AB.bolts = [];
      if (KEY.g) KEY.g.visible = false; KEY.st = 'none'; KEY.holder = null; keyChip(false); if (AB.door) { AB.door.open = false; }
    }
    function spawnMob(kind, x, z) {
      const T0 = MOB_T[kind]; buildAbyss(); const ch = Object.assign({}, DUMMY_CH, { name: T0.n, hp: T0.hp, color: '#7dffb0' });
      const f = new Fighter({ name: T0.n.toUpperCase(), ch, lvlVar: 0 });
      f.isBoss = true; f.mob = kind; f.abyss = true; f.maxHp = f.hp = T0.hp; f.hitR = T0.r; f.hitH = T0.h; f.ai = null; f.alive = true; f.iframes = 0; f.cineHide = true;
      f.pos.set(x, ABY.y + (T0.fly || 0), z); f.home = f.pos.clone(); f.model.root.visible = false; G.fighters.push(f);
      const g = MOB_BUILD[kind](); g.position.copy(f.pos); scene.add(g);
      const m = { f, g, k: kind, T: T0, cd: rand(.6, 1.6), wind: 0, lastHp: T0.hp, flash: 0, dead: 0, ph: rand(0, 6), hx: x, hz: z, yaw: rand(0, 6), aggro: false, mats: [], lunge: 0, hitDone: false, step: 0 };
      g.traverse(o => { if (o.material && o.material.emissive && o.material.color) m.mats.push(o.material); }); AB.mobs.push(m); return m;
    }
    function planGroups() {
      const { len } = pathInfo(), g = [], pools = [['crab', 'crab', 'jelly'], ['jelly', 'crab', 'angler'], ['drowned', 'crab', 'jelly', 'squidling'], ['angler', 'drowned', 'squidling'], ['drowned', 'drowned', 'angler', 'squidling', 'jelly'], ['squidling', 'angler', 'drowned', 'drowned']];
      for (let i = 0; i < 12; i++) { const z = .09 + i * .072, pool = pools[Math.min(pools.length - 1, i * pools.length / 12 | 0)], n = 2 + (i / 4 | 0), kinds = []; for (let j = 0; j < n; j++) kinds.push(pool[(rnd() * pool.length) | 0]); g.push({ sd: len * z, kinds, spawned: false }); }
      g.push({ sd: len * .58, kinds: ['captain', 'drowned', 'drowned'], spawned: false, cap: true }); g.sort((a, b) => a.sd - b.sd); return g;
    }
    function mobAttack(m, tgt) {
      const f = m.f, T0 = m.T; if (!tgt || !tgt.alive) return;
      const dx = tgt.pos.x - f.pos.x, dz = tgt.pos.z - f.pos.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      if (m.k === 'jelly') { for (const p of abyssPlayers()) if (dist2d(p, f) < T0.rng + .8) hurt(p, T0.dmg, ux, uz, 3); ringAt(new V3(f.pos.x, ABY.y + .3, f.pos.z), '#7df9ff', T0.rng * 1.2, .5); burst(f.pos.clone(), 18, '#9ef2ff', 8, .2, .5, 0); sfx('beam', f.pos, .6); }
      else if (m.k === 'angler') { m.lunge = .4; m.lx = ux; m.lz = uz; m.hitDone = false; sfx('rush', f.pos, .7); }
      else if (m.k === 'squidling') { const b = new T.Mesh(new T.SphereGeometry(.4, 8, 6), bmat(0x2a1030, .95, false)); b.position.copy(f.pos); b.position.y += 1.6; scene.add(b); AB.bolts.push({ m: b, vx: ux * 15, vz: uz * 15, t: 0, dmg: T0.dmg }); sfx('whoosh', f.pos, .6); }
      else if (m.k === 'captain' && m.alt) { const R = 6.2; for (const p of abyssPlayers()) if (dist2d(p, f) < R + 1) hurt(p, T0.dmg * 1.1, ux, uz, 9); ringAt(new V3(f.pos.x, ABY.y + .3, f.pos.z), '#ffb347', R * 1.3, .6); burst(f.pos.clone(), 26, '#ffd0a0', 10, .3, .7, .4); G.shake = Math.max(G.shake, .5); sfx('crash', f.pos, .8); }
      else { if (d < T0.rng + 1.4) hurt(tgt, T0.dmg, ux, uz, m.k === 'captain' ? 7 : 5); burst(new V3(f.pos.x + ux * 1.6, f.pos.y + 1, f.pos.z + uz * 1.6), 8, '#e8f8ff', 6, .2, .4, 0); sfx('heavy', f.pos, .5); }
      if (m.k === 'captain') m.alt = !m.alt;
    }
    function mobAnimate(m, dt, t, moving) {
      const g = m.g, u = g.userData, ph = m.ph + t;
      if (m.k === 'crab') { u.legs.forEach(([lg, sg, i]) => { lg.rotation.y = moving ? Math.sin(t * 14 + i * 1.3 + (sg > 0 ? 0 : 1.6)) * .35 : 0; }); u.claws.forEach(([arm, pa, pb, sg]) => { const w = m.wind > 0 ? 1 : 0; arm.rotation.x = -.2 - w * .7 + Math.sin(t * 3 + sg) * .08; pb.position.y = .15 + (w ? Math.abs(Math.sin(t * 22)) * .25 : .05); }); g.position.y += Math.abs(Math.sin(t * 10)) * (moving ? .08 : 0); }
      else if (m.k === 'jelly') { const k = 1 + Math.sin(t * 3 + m.ph) * .08 + (m.wind > 0 ? .25 : 0); u.bell.scale.set(k, 2 - k, k); u.core.material.opacity = m.wind > 0 ? .9 : .4; u.tents.forEach(([tg, i]) => { tg.rotation.x = Math.sin(t * 2.5 + i) * .3; tg.rotation.z = Math.cos(t * 2.1 + i * 1.7) * .3; }); }
      else if (m.k === 'angler') { u.jaw.rotation.z = -(m.wind > 0 ? .75 : .1 + Math.abs(Math.sin(t * 3)) * .1); u.orb.scale.setScalar(1 + Math.sin(t * 6) * .25); }
      else if (m.k === 'drowned' || m.k === 'captain') { u.legL.rotation.x = moving ? Math.sin(t * 6) * .6 : 0; u.legR.rotation.x = moving ? -Math.sin(t * 6) * .6 : 0; u.arm.forEach((a, i) => { a.rotation.x = m.wind > 0 ? -2.6 : -1.1 + Math.sin(t * 2 + i) * .1; }); u.head.rotation.z = Math.sin(t * 1.5 + m.ph) * .1; }
      else if (m.k === 'squidling') { u.tn.forEach(([tg, i]) => { tg.rotation.x = Math.sin(t * 4 + i) * .4; tg.rotation.z = Math.cos(t * 3.4 + i * 1.3) * .4; }); u.mantle.scale.y = 1 + Math.sin(t * 3 + m.ph) * .1 + (m.wind > 0 ? .2 : 0); }
    }
    function mobsUpdate(dt, t) {
      const ps = abyssPlayers(), lk = locked();
      if (lk && !AB.groups && ps.length) AB.groups = planGroups();
      if (AB.groups) for (const gr of AB.groups) { if (gr.spawned) continue; if (ps.some(p => { const q = sdOf(p.pos.x, p.pos.z); return q > gr.sd - 55 && q < gr.sd + 12 && abyPath(p.pos.x, p.pos.z).d < 40; })) { gr.spawned = true; const q = pathAt(gr.sd); gr.kinds.forEach((k, i) => { const u = (rnd() - .5) * 10, v = (rnd() - .5) * 12; const m = spawnMob(k, q.x + q.tx * u + q.nx * v, q.z + q.tz * u + q.nz * v); abyssClamp(m.f.pos); m.f.home.copy(m.f.pos); if (k === 'captain') { m.cap = true; showBanner('⚠ CAPITÁN AHOGADO', '#ffb347', 'Él tiene la llave del portón'); } }); } }
      if (!lk && AB.mobs.length) for (const m of AB.mobs) if (!m.dead) { m.f.hp = 0; m.f.alive = false; m.dead = .001; }
      for (let i = AB.mobs.length - 1; i >= 0; i--) {
        const m = AB.mobs[i], f = m.f, T0 = m.T, g = m.g;
        f.vel.set(0, 0, 0); f.stun = 0; f.ragdoll = 0; f.hurtT = 0; f.grabbed = false; f.cineLock = null; f.frozen = 0; f.blocking = false; f.iframes = 0; f.model.root.visible = false;
        if (!f.alive && !m.dead) { m.dead = .001; if (m.cap) dropKey(f.pos.x, f.pos.z); burst(g.position.clone().add(new V3(0, 1.4, 0)), 22, '#9ef2ff', 9, .3, .8, .2); sfx('boom', f.pos, .6); }
        if (m.dead) { m.dead += dt; g.scale.setScalar(Math.max(.01, (m.cap ? 1 : 1) * (1 - m.dead * 1.5))); g.rotation.z = m.dead * 2; g.position.y -= dt * 1.4; if (m.dead > .7) { scene.remove(g); const j = G.fighters.indexOf(f); if (j >= 0) G.fighters.splice(j, 1); try { f.dispose(); } catch (e) { } AB.mobs.splice(i, 1); } continue; }
        if (f.hp < m.lastHp - .01) { m.flash = .16; m.aggro = true; } m.lastHp = f.hp; m.flash = Math.max(0, m.flash - dt);
        for (const mt of m.mats) mt.emissive.setRGB(m.flash > 0 ? .7 : 0, m.flash > 0 ? .7 : 0, m.flash > 0 ? .7 : 0);
        let tgt = null, bd = 1e9; for (const p of ps) { const d = dist2d(p, f); if (d < bd) { bd = d; tgt = p; } }
        let mx = 0, mz = 0, moving = false, sp = T0.spd;
        if (tgt && bd < T0.aggro) m.aggro = true; else if (!tgt || bd > T0.aggro * 2.2) m.aggro = false;
        if (m.lunge > 0) { m.lunge -= dt; mx = m.lx * 17; mz = m.lz * 17; moving = true; if (!m.hitDone && tgt && dist2d(tgt, f) < 2.6) { m.hitDone = true; hurt(tgt, T0.dmg, m.lx, m.lz, 8); } }
        else if (m.wind > 0) { m.wind -= dt; if (tgt) m.yaw = Math.atan2(tgt.pos.x - f.pos.x, tgt.pos.z - f.pos.z); if (m.wind <= 0) mobAttack(m, tgt); }
        else if (m.aggro && tgt) {
          const dx = tgt.pos.x - f.pos.x, dz = tgt.pos.z - f.pos.z, dd = Math.hypot(dx, dz) || 1; m.yaw = Math.atan2(dx, dz);
          const want = T0.ranged ? 12 : T0.rng * .75;
          if (dd > want) { mx = dx / dd * sp; mz = dz / dd * sp; moving = true; } else if (T0.ranged && dd < 8) { mx = -dx / dd * sp * .7; mz = -dz / dd * sp * .7; moving = true; }
          m.cd -= dt; if (m.cd <= 0 && dd < (T0.ranged ? T0.rng : T0.rng + .6)) { m.wind = T0.wind; m.cd = T0.cd * rand(.85, 1.25); if (m.k === 'jelly') ringAt(new V3(f.pos.x, ABY.y + .3, f.pos.z), '#ff8fe8', T0.rng, T0.wind); if (m.k === 'captain' && m.alt) ringAt(new V3(f.pos.x, ABY.y + .3, f.pos.z), '#ff9a4a', 6.2, T0.wind); }
        } else { const a = t * .4 + m.ph; mx = (m.hx + Math.cos(a) * 3 - f.pos.x) * .5; mz = (m.hz + Math.sin(a * 1.3) * 3 - f.pos.z) * .5; moving = Math.hypot(mx, mz) > .6; m.yaw = Math.atan2(mx, mz) || m.yaw; }
        f.pos.x += mx * dt; f.pos.z += mz * dt; abyssClamp(f.pos); f.pos.y = ABY.y + (T0.fly ? T0.fly + Math.sin(t * 2 + m.ph) * .35 : 0);
        g.position.copy(f.pos); g.rotation.set(0, m.yaw - (m.k === 'angler' ? Math.PI / 2 : 0) + (m.k === 'drowned' || m.k === 'captain' ? 0 : 0), 0); g.scale.setScalar(m.k === 'captain' ? 1 : 1);
        if (m.k === 'angler') g.rotation.y = m.yaw - Math.PI / 2;
        mobAnimate(m, dt, t, moving);
        if (m.cap && KEY.st !== 'ground' && KEY.st !== 'held' && KEY.st !== 'used') { /* el capitán lleva la llave encima */ }
      }
      for (let i = AB.bolts.length - 1; i >= 0; i--) { const b = AB.bolts[i]; b.t += dt; b.m.position.x += b.vx * dt; b.m.position.z += b.vz * dt; let hit = false; for (const p of ps) if (Math.hypot(p.pos.x - b.m.position.x, p.pos.z - b.m.position.z) < 1.3 && p.pos.y < ABY.y + 3.4) { hurt(p, b.dmg, Math.sign(b.vx), Math.sign(b.vz), 3); hit = true; break; } if (hit || b.t > 2.4) { burst(b.m.position.clone(), 8, '#4a2060', 5, .2, .5, 0); scene.remove(b.m); AB.bolts.splice(i, 1); } }
    }
    function keyUpdate(dt, t) {
      const D = AB.door; if (!D) return; const ps = abyssPlayers(), lk = locked();
      if (KEY.g) {
        if (KEY.st === 'ground') {
          KEY.g.visible = true; KEY.g.position.set(KEY.pos.x, KEY.pos.y + Math.sin(t * 2.5) * .25, KEY.pos.z); KEY.g.rotation.y += dt * 2.2; if (Math.random() < dt * 14) emit(KEY.pos.x + rand(-.6, .6), KEY.pos.y + rand(-.5, 1.5), KEY.pos.z + rand(-.6, .6), 0, rand(.6, 1.6), 0, '#ffe58a', .12, 1, 0, 1);
          for (const p of ps) if (Math.hypot(p.pos.x - KEY.pos.x, p.pos.z - KEY.pos.z) < 2.8) { KEY.st = 'held'; KEY.holder = p; if (p.isPlayer) { showBanner('🗝️ ¡TIENES LA LLAVE!', '#ffd54f', 'Llévala al portón enorme · solo un jugador la puede tener'); sfx('whoosh', null, .8); } break; }
        } else if (KEY.st === 'held') {
          const h = KEY.holder; if (!h || !h.alive || !h.abyss) { const lp = h ? h.pos : KEY.pos; dropKey(lp.x, lp.z, h && h.isPlayer ? '' : false); if (h && h.isPlayer) addFeedText('🗝️ Soltaste la llave', '#ffd54f'); }
          else { KEY.g.position.set(h.pos.x, h.pos.y + 3.3 + Math.sin(t * 3) * .15, h.pos.z); KEY.g.rotation.y += dt * 2.5; const dd = doorAbs(); if (!D.open && Math.hypot(h.pos.x - dd.x, h.pos.z - dd.z) < 9) { D.open = true; KEY.st = 'used'; KEY.g.visible = false; showBanner('¡EL PORTÓN SE ABRE!', '#ff8fb0', 'La sala del Kraken te espera'); G.shake = Math.max(G.shake, 1.2); sfx('boom', null, 1); sfx('crash', null, .8); } }
        }
      }
      keyChip(KEY.st === 'held' && KEY.holder === G.player);
      const want = D.open || !lk; D.k += ((want ? 1 : 0) - D.k) * Math.min(1, dt * 1.1); if (want && D.k > .98) D.k = 1;
      const hw = ABY_COR.hw; D.l.position.z = -D.k * (hw + 1); D.r.position.z = D.k * (hw + 1);
      D.gem.rotation.y += dt * 1.4; D.gem.material.color.set(D.k > .5 ? 0x7dffb0 : 0xff2d55); D.gem.scale.setScalar(1 + Math.sin(t * 3) * .08);
      paintKeyLabel(!lk ? 'ABIERTO' : D.open ? '¡ABIERTO!' : KEY.st === 'held' ? 'Acércate con la llave' : KEY.st === 'ground' ? 'Recoge la llave' : 'CERRADO · busca la llave', D.open || !lk ? '#7dffb0' : '#ff8fb0');
      if (D.k < .95) for (const f of G.fighters) { if (!f.abyss || f.isBoss || f.remote) continue; const dd = doorAbs(); if (f.pos.x > dd.x - 2.2 && f.pos.x < dd.x + 6 && Math.abs(f.pos.z - dd.z) < hw + 4) { f.pos.x = dd.x - 2.2; if (f.vel.x > 0) f.vel.x = 0; } }
    }

    // ---------------------------------------------------------------- al estar dentro, el resto del mundo (ciudad, mar, otros jugadores) se "descarga" para ahorrar rendimiento
    function hideWorld() {
      if (AB.hidden) return; AB.hidden = [];
      const mine = new Set(); for (const f of G.fighters) if (f.model && f.model.root && (f.isPlayer || f.isBoss || f.abyss)) mine.add(f.model.root);
      for (const o of scene.children) { if (!o.visible || o === AB.root || o === B.g || o.isLight || o.isPoints || o.isSprite || mine.has(o)) continue; if (o.position.z >= 560 && o.position.y < -20) continue; o.visible = false; AB.hidden.push(o); }
      if (SEA.root) for (const o of SEA.root.children) if (o.visible) { o.visible = false; AB.hidden.push(o); }
    }
    function showWorld() { if (!AB.hidden) return; for (const o of AB.hidden) o.visible = true; AB.hidden = null; }
    function respawnIn(f) {   // moriste con el Kraken vivo: vuelves a caer por la cascada, dentro del abismo
      const e = ENTRY(); f.abyss = true; f.air = 20; f.swim = false; f.pos.set(e.x + rand(-2, 2), ABY.y + 80, e.z + rand(-2, 2)); f.vel.set(0, -28, 0); f.onGround = false; f.iframes = Math.max(f.iframes, 2.5); f.gateMsg = false;
      if (f.isPlayer) { screenFlash(.6); showBanner('HAS CAÍDO…', '#ff8fb0', 'No puedes salir hasta vencer al Kraken'); G.shake = Math.max(G.shake, .8); sfx('rush', null, .9); }
    }

    // ---------------------------------------------------------------- entrar y salir
    function enterAbyss(f) {
      if (f.abyss) return; buildAbyss(); ensureSquid();
      f.abyss = true; f.air = 20; f.swim = false; f.hp = Math.min(f.maxHp, f.hp + 10); f.vortexSink = 0; if (f.model && f.model.root) { f.model.root.rotation.x = 0; f.model.root.rotation.z = 0; f.model.root.scale.setScalar(1); }
      const e = ENTRY(); f.pos.set(e.x + rand(-2, 2), ABY.y + 82, e.z + rand(-2, 2)); f.vel.set(0, -28, 0); f.onGround = false; f.iframes = Math.max(f.iframes, 1.6); f.gateMsg = false;
      if (f.isPlayer) { hideWorld(); screenFlash(.9); showBanner('¡EL ABISMO!', '#7df9ff', locked() ? 'Sigue el camino hasta la sala del Kraken…' : 'Todo está en calma…'); G.shake = Math.max(G.shake, 1); sfx('rush', null, 1); }
      burst(new V3(VX, SEA_Y + .3, VZ), 60, '#dff6ff', 14, .3, .9, -.4); ringAt(new V3(VX, SEA_Y + .1, VZ), '#7df9ff', 14, .7);
      B.g.visible = true;
    }
    function leaveAbyss(f) {
      if (!f.abyss) return; f.abyss = false;
      const a = rand(0, 6.283); f.pos.set(VX + Math.cos(a) * (VR + 10), SEA_Y + .4, VZ + Math.sin(a) * (VR + 10)); f.vel.set(Math.cos(a) * 6, 15, Math.sin(a) * 6); f.onGround = false; f.iframes = Math.max(f.iframes, 1.2); f.gateMsg = false; if (f.isPlayer) showWorld();
      if (f.isPlayer) { screenFlash(.7); showBanner('SUPERFICIE', '#fff2a8', 'Saliste del abismo'); sfx('rush', null, .8); }
      burst(f.pos.clone(), 40, '#dff6ff', 12, .25, .8, -.3);
      if (!G.fighters.some(g => g.abyss && !g.isBoss && !g.remote)) sleepBoss();
    }

    // ---------------------------------------------------------------- bucle (lo llama updateSea cada cuadro)
    function update(dt, t, cp) {
      if (!AB.vortex) buildVortex();
      if (!AB.far) buildFarSea();
      const near = cp.z > 300, ev = eventOn();
      if (AB.vortex) {
        AB.vortex.visible = near || cp.y > 20;
        if (AB.vortex.visible) {
          AB.uni.uTime.value = t; AB.uni.uGlow.value += ((ev ? 1.3 : .25) - AB.uni.uGlow.value) * Math.min(1, dt * 2);
          AB.rings.forEach((r, i) => { const u = ((t * .25 + i / 4) % 1), rr = VR * (1 - u * .85); r.scale.setScalar(rr); r.material.opacity = .35 * Math.sin(u * Math.PI) * (ev ? 1.6 : 1); });
          AB.pillar.material.opacity = (.12 + Math.sin(t * 2) * .03) * (ev ? 2.6 : 1);
          const dd = Math.hypot(cp.x - VX, cp.z - VZ);
          if (dd < 170 && Math.random() < dt * 40) { const a = rand(0, 6.28), r = rand(6, VR); emit(VX + Math.cos(a) * r, SEA_Y + .15, VZ + Math.sin(a) * r, -Math.sin(a) * (7 + 14 * (1 - r / VR)) - Math.cos(a) * 3, .5 + rand(0, 1.2), Math.cos(a) * (7 + 14 * (1 - r / VR)) - Math.sin(a) * 3, '#e8f8ff', .16, 1.1, 0, 1); }
          if (dd < 80 && Math.random() < dt * 8) emit(VX + rand(-5, 5), SEA_Y + rand(.5, 6), VZ + rand(-5, 5), rand(-1, 1), rand(4, 9), rand(-1, 1), '#cfeeff', .3, 1.3, -.3, 1);
          AB.sfxT -= dt; if (dd < 90 && AB.sfxT <= 0) { AB.sfxT = 2.2; sfx('rush', new V3(VX, SEA_Y, VZ), .55, { range: 130 }); if (dd < 55) sfx('whoom', new V3(VX, SEA_Y, VZ), .35, { range: 90 }); }
          AB.cntT -= dt; if (AB.cntT <= 0 && dd < 260) { AB.cntT = .5; paintCounter(); }
        }
      }
      // el torbellino absorbe a quien nada cerca: gira, se hunde y se encoge hasta caer al abismo
      const resetModel = f => { if (f.vortexSink) { f.vortexSink = 0; if (f.model && f.model.root) { f.model.root.rotation.x = f.model.root.rotation.z = 0; f.model.root.scale.setScalar(1); } } };
      for (const f of G.fighters) {
        if (f.remote || f.isBoss || f.abyss || !f.alive || f.cineLock) { if (!f.abyss) resetModel(f); continue; }
        const dx = f.pos.x - VX, dz = f.pos.z - VZ, d = Math.hypot(dx, dz);
        if (d > VR || f.pos.y > SEA_Y + 2.2) { resetModel(f); continue; }
        const s = 1 - d / VR, tang = 6 * s + 1, inw = 12 * s + 2, ux = dx / (d || 1), uz = dz / (d || 1);
        if (f.isPlayer && AB.sfxT < 1.2 && d < VR * .7 && Math.random() < dt * 3) sfx('rush', f.pos, .6);   // en el borde se puede escapar nadando; más adentro ya no
        f.vel.x += (-ux * inw - uz * tang) * dt * 1.3 * 1.6; f.vel.z += (-uz * inw + ux * tang) * dt * 1.3 * 1.6;
        if (f.isPlayer && !f.vortexMsg && d < VR * .8) { f.vortexMsg = true; showBanner('¡EL TORBELLINO!', '#7df9ff', 'Te arrastra hacia el abismo'); }
        if (d < 22) {   // animación de absorción: da vueltas, se inclina, se hunde y se hace chiquito
          f.vortexSink = Math.min(1, (f.vortexSink || 0) + dt * .5); const k = f.vortexSink, m = f.model.root;
          m.rotation.x += dt * (4 + k * 10); m.rotation.z = Math.sin(t * 6) * .5 * k; m.scale.setScalar(1 - k * .55); f.pos.y = SEA_Y + (surfY(d) + .2) * Math.min(1, k * 1.8); f.vel.y = 0;   // resbala por la pared del embudo
          if (f.isPlayer) { G.shake = Math.max(G.shake, .12 + k * .5); if (Math.random() < dt * 24) emit(f.pos.x + rand(-.6, .6), SEA_Y + .1, f.pos.z + rand(-.6, .6), -uz * 6, rand(1, 3), ux * 6, '#e8f8ff', .18, .9, 0, 1); }
        }
        if (d < 5.5 && f.pos.y < SEA_Y + 1.6) { f.pos.y = SEA_Y - .5; enterAbyss(f); }
      }
      if (AB.root) {
        AB.root.visible = cp.z > 560; if (B.g && B.state === 'sleep') B.g.visible = AB.root.visible;
        if (AB.root.visible) {
          if (AB.fallTex) AB.fallTex.offset.y += dt * 1.6;
          if (AB.foam) { AB.foam.rotation.z += dt * .6; AB.foam.material.opacity = .3 + Math.sin(t * 5) * .06; const e = ENTRY(); if (Math.random() < dt * 40) emit(e.x + rand(-6, 6), ABY.y + .4, e.z + rand(-6, 6), rand(-3, 3), rand(1, 5), rand(-3, 3), '#dff6ff', .22, 1, -.2, 1); }
          AB.kelp.forEach(([k, ph]) => { k.rotation.z = Math.sin(t * .8 + ph) * .12; });
          AB.ambT -= dt; if (AB.ambT <= 0) { const inRoom = G.player && G.player.abyss && Math.hypot(G.player.pos.x - ABY.x, G.player.pos.z - ABY.z) < ABY.R + 4; AB.ambT = inRoom ? rand(3, 5) : rand(5, 9); sfx(inRoom ? (B.state === 'fight' ? 'heavy' : 'whoom') : 'whoom', null, inRoom ? .3 : .2); if (!inRoom && Math.random() < .5) sfx('whoosh', null, .12); }
          AB.fallT -= dt; if (AB.fallT <= 0 && AB.fall) { AB.fallT = 1.8; const e = ENTRY(); sfx('rush', new V3(e.x, ABY.y + 3, e.z), .6, { range: 70 }); }
          if (AB.gate) AB.gate.material.opacity = .06 + Math.sin(t * 2) * .03 + (B.state === 'fight' ? .06 : 0);
          if (AB.exit) { AB.exit.rotation.y += dt * .8; AB.exit.visible = !locked(); AB.exit.userData.disc.material.opacity = .25 + Math.sin(t * 3) * .1; }
          if (Math.random() < dt * 14) emit(cp.x + rand(-20, 20), cp.y + rand(-4, 12), cp.z + rand(-20, 20), rand(-.3, .3), rand(.2, 1), rand(-.3, .3), Math.random() < .5 ? '#7df9ff' : '#ff8fe8', .1, 3, 0, 1);
          for (const f of G.fighters) {
            if (!f.abyss || f.isBoss || f.remote) continue;
            const x = EXIT(), d = Math.hypot(f.pos.x - x.x, f.pos.z - x.z);
            if (f.isPlayer && f.alive && d < 3.6 && f.pos.y < ABY.y + 7) { if (locked()) { if (!f.exitMsg || G.time - f.exitMsg > 4) { f.exitMsg = G.time; popText(chestOf(f), 'No puedes subir hasta vencer al Kraken…', '#fff2a8', 16); } } else leaveAbyss(f); }
            if (f.onGround && f.fellIn !== 1 && f.pos.y < ABY.y + 1) { f.fellIn = 1; burst(f.pos.clone(), 40, '#dff6ff', 12, .3, .9, 1); ringAt(new V3(f.pos.x, ABY.y + .2, f.pos.z), '#7df9ff', 8, .6); if (f.isPlayer) { G.shake = Math.max(G.shake, .8); sfx('crash', f.pos, .8); } }
          }
        }
      }
      if (SEA.life && SEA.life.squid) SEA.life.squid.g.visible = false;     // el calamar del evento vive en el abismo, no pasa por la superficie
      if (!ev) AB.cleared = false;
      const insideNow = G.fighters.some(g => g.abyss && !g.isBoss && !g.remote);
      if (insideNow) { AB.emptyT = 0; mobsUpdate(dt, t); keyUpdate(dt, t); } else { AB.emptyT += dt; if (AB.emptyT > 15 && (AB.mobs.length || AB.groups || KEY.st !== 'none')) resetRun(); else if (AB.mobs.length) mobsUpdate(dt, t); }
      if (AB.root && AB.root.visible && !AB.door.open && !locked()) { /* sin evento el portón queda abierto */ }
      for (const f of G.fighters) if (f.abyss && f.isPlayer && f.alive && !f.gateMsg && f.pos.x > GATE_X) { f.gateMsg = true; showBanner('SALA DEL KRAKEN', '#ff8fb0', ev && !AB.cleared ? 'No hay vuelta atrás…' : 'Todo está en calma'); G.shake = Math.max(G.shake, .5); sfx('whoom', null, .9); }
      if (ev && !AB.cleared && B.state === 'sleep' && G.fighters.some(g => g.abyss && !g.isBoss && !g.remote && g.alive && g.pos.x > GATE_X)) spawnBoss();   // al cruzar el portón despierta
      const meIn = !!(G.player && G.player.abyss); if (!meIn && AB.hidden) showWorld(); else if (meIn && !AB.hidden && G.state === 'play') hideWorld(); if (G.state !== 'play') showWorld();
      if (window.CF_MUELLE) CF_MUELLE.update(dt, t, cp);
      for (const f of G.fighters) if (f.abyss && !f.isBoss && (f.pos.z < ABY.z - 130 || (!f.alive && f.deathT > 1.2 && !locked()))) { f.abyss = false; f.fellIn = 0; f.exitMsg = 0; if (!G.fighters.some(g => g.abyss && !g.isBoss && !g.remote)) sleepBoss(); }
      if (B.f) bossUpdate(dt, t); else if (B.g && B.g.visible && B.state === 'sleep') sleepAnim(dt, t);
    }
    function sleepAnim(dt, t) {   // el Kraken dormido: respira lento, ojos apagados, brazos caídos
      const g = B.g; if (!g) return; B.mantle.scale.set(1 + Math.sin(t * .7) * .02, 1 - Math.sin(t * .7) * .015, 1 + Math.sin(t * .7) * .02);
      B.arms.forEach(a => { a.root.visible = true; a.root.scale.setScalar(1); a.segs.forEach((s, i) => { s.rotation.x += ((.3 + i * .02 + Math.sin(t * .6 - i * .4 + a.ang) * .03) - s.rotation.x) * Math.min(1, dt * 2); s.rotation.y = Math.sin(t * .5 - i * .3 + a.ang) * .04; }); });
      B.eyes.forEach(e => e.material.color.set(0x241008)); B.spots.forEach((s, i) => { s.visible = true; s.scale.setScalar(.5 + Math.sin(t * 1.2 + i) * .2); }); B.spotM.color.set(0x1b6f88); B.body.position.y = 7 - 5.2 + Math.sin(t * .7) * .15; B.body.rotation.x = 0;
      for (const m of B.mats) m.emissive.setRGB(.05, .02, .04);
    }

    const MUSF = { src: { pasillo: 'musica/abismo_pasillo.mp3', kraken: 'musica/abismo_kraken.mp3', calma: 'musica/abismo_calma.mp3' }, failed: new Set() };
    window.CF_MUS_SCENE = () => { const p = G.player; if (!p || !p.abyss) return null; let id = (!eventOn() || AB.cleared) ? 'calma' : (B.state === 'fight' || B.state === 'intro') ? 'kraken' : 'pasillo'; if (id === 'kraken' && MUSF.failed.has('kraken')) id = 'pasillo'; if (MUSF.failed.has(id)) return null; return { id, src: MUSF.src[id] }; };
    window.CF_MUS_FAIL = id => MUSF.failed.add(id);
    window.CF_ABISMO = {
      giveKey(f) { f = f || G.player; if (!KEY.g) { KEY.g = goldKey(); scene.add(KEY.g); } KEY.st = 'held'; KEY.holder = f; KEY.g.visible = true; },
      openDoor() { if (AB.door) AB.door.open = true; if (KEY.g) KEY.g.visible = false; KEY.st = 'used'; },
      clearMobs() { for (const m of AB.mobs) if (!m.dead) { m.f.hp = 0; m.f.alive = false; } },
      tpDoor(f) { buildVortex(); f = f || G.player; if (!f.abyss) enterAbyss(f); const d = doorAbs(); f.pos.set(d.x - 8, ABY.y + .2, d.z); f.vel.set(0, 0, 0); },
      tpStart(f) { buildVortex(); f = f || G.player; if (!f.abyss) enterAbyss(f); },
      killBoss() { if (B.f && B.state === 'fight') { B.f.hp = 0; kill(B.f, G.player); } },
      get mobCount() { return AB.mobs.length; }, get key() { return KEY.st; }, get door() { return AB.door ? AB.door.open : null; }, mobs: () => AB.mobs, resetRun, update, bossHit, bossDown, enter: enterAbyss, leave: leaveAbyss, get boss() { return B.f; }, get mesh() { return B.g; }, VORTEX: { x: VX, z: VZ, r: VR }, get state() { return B.state; }, get arms() { return B.arms; },
      tp(f) { buildVortex(); enterAbyss(f || G.player); },
      locked, respawnIn, hideWorld, showWorld, get cleared() { return AB.cleared; }, get hiddenCount() { return AB.hidden ? AB.hidden.length : 0; },
      wake() { spawnBoss(); },
      force(n) { if (!B.f || B.state !== 'fight') return false; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = ({ slam: atkSlam, sweep: atkSweep, ink: atkInk, suction: atkSuction, whip: atkWhip, rocks: atkRocks, beam: atkBeam }[n] || atkSlam)(); return !!B.atk; } };
  }
});
