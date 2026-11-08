/* ===== EL ABISMO: torbellino en el mar profundo → cascada → cueva con el jefe KRAKEN =====
   - En el mar PROFUNDO (muy lejos de la costa) hay un TORBELLINO gigante: un hueco que absorbe poco a poco a quien nada cerca.
     Al llegar al centro caes como por una cascada hasta la cueva del abismo (muy por debajo del mar).
   - En la cueva vive el KRAKEN, un calamar gigante: es un JEFE FINAL con 5 ataques. Se le pega con las habilidades del personaje
     (las cinemáticas de agarre no funcionan con él: le hacen daño directo).
   - Al derrotarlo se consiguen EMOTES y COSMÉTICOS exclusivos (js/emotes.js y js/cosmetics.js).
   - El jefe es una instancia por jugador (cada uno pelea con su propio Kraken, como una mazmorra).
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE;
    const VX = 70, VZ = 420, VR = 42;                       // torbellino: centro y radio de captura
    const lm = c => new T.MeshLambertMaterial({ color: c }), bmat = (c, op, add) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending, side: T.DoubleSide });
    const mkbox = (par, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); if (rx || ry || rz) q.rotation.set(rx, ry, rz); par.add(q); return q; };
    const rnd = (() => { let q = 424242; return () => (q = (q * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const AB = { vortex: null, root: null, built: false, disc: null, rings: [], funnel: null, pillar: null, kelp: [], fall: null, fallTex: null, exit: null, boss: null, clearedAt: -999, lights: [] };
    const EXIT = () => ({ x: ABY.x + 56, z: ABY.z });
    const ENTRY = () => ({ x: ABY.x - 52, z: ABY.z });

    // ---------------------------------------------------------------- el torbellino del mar profundo
    function buildVortex() {
      if (AB.vortex || !SEA.root) return;
      const g = new T.Group(); g.position.set(VX, SEA_Y + .06, VZ); SEA.root.add(g); AB.vortex = g;
      const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d');
      const gr = c.createRadialGradient(256, 256, 0, 256, 256, 256); gr.addColorStop(0, 'rgba(0,0,6,1)'); gr.addColorStop(.2, 'rgba(1,8,22,.97)'); gr.addColorStop(.55, 'rgba(8,34,72,.6)'); gr.addColorStop(1, 'rgba(8,34,72,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 512, 512);
      for (let arm = 0; arm < 5; arm++) { for (let s = 0; s < 120; s++) { const a = s / 120 * 7.5, r = 18 + a * 28, ang = a + arm * Math.PI * 2 / 5, al = (1 - s / 120) * .6; c.fillStyle = 'rgba(200,238,255,' + al.toFixed(2) + ')'; c.beginPath(); c.arc(256 + Math.cos(ang) * r, 256 + Math.sin(ang) * r, 2 + (1 - s / 120) * 6, 0, 7); c.fill(); } }
      const tex = new T.CanvasTexture(cv);
      const disc = new T.Mesh(new T.CircleGeometry(VR + 8, 72), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.renderOrder = -3; g.add(disc); AB.disc = disc;
      const hole = new T.Mesh(new T.CircleGeometry(6.5, 40), new T.MeshBasicMaterial({ color: 0x000004, transparent: true, opacity: .96, depthWrite: false })); hole.rotation.x = -Math.PI / 2; hole.position.y = .02; hole.renderOrder = -2; g.add(hole);
      for (let i = 0; i < 3; i++) { const r = new T.Mesh(new T.RingGeometry(10 + i * 11, 11.5 + i * 11, 64), bmat(0xdff6ff, .22 - i * .05, true)); r.rotation.x = -Math.PI / 2; r.position.y = .04 + i * .01; r.renderOrder = -2; g.add(r); AB.rings.push(r); }
      const fc = document.createElement('canvas'); fc.width = 64; fc.height = 256; const f2 = fc.getContext('2d');
      for (let i = 0; i < 28; i++) { f2.fillStyle = 'rgba(150,220,255,' + (.15 + rnd() * .5).toFixed(2) + ')'; f2.fillRect(rnd() * 64, 0, 2 + rnd() * 5, 256); }
      const ftex = new T.CanvasTexture(fc); ftex.wrapS = ftex.wrapT = T.RepeatWrapping; ftex.repeat.set(6, 3);
      const fun = new T.Mesh(new T.CylinderGeometry(VR, 3, 40, 48, 1, true), new T.MeshBasicMaterial({ map: ftex, transparent: true, opacity: .5, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending })); fun.position.y = -20; g.add(fun); AB.funnel = fun; AB.funnelTex = ftex;
      const pil = new T.Mesh(new T.CylinderGeometry(3.4, 3.4, 90, 20, 1, true), bmat(0x7df9ff, .14, true)); pil.position.y = 45; g.add(pil); AB.pillar = pil;   // columna de luz: se ve desde lejos
      const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128; const l2 = lc.getContext('2d'); l2.font = 'bold 76px system-ui,Arial'; l2.textAlign = 'center'; l2.fillStyle = '#bff6ff'; l2.shadowColor = '#00e5ff'; l2.shadowBlur = 24; l2.fillText('EL ABISMO', 256, 90);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(lc), transparent: true, depthWrite: false, fog: false })); sp.scale.set(26, 6.5, 1); sp.position.y = 24; g.add(sp);
    }


    // ---------------------------------------------------------------- el mar nuevo (lejos de la costa): rocas, corales luminosos y algas gigantes para que no se vea vacío
    function buildFarSea() {
      if (AB.far || !SEA.root) return; AB.far = true;
      const N = 360, Q = new T.Quaternion(), E = new T.Euler(), M = new T.Matrix4(), P = new V3(), S = new V3(), col = new T.Color();
      const im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshLambertMaterial({ color: 0xffffff }), N);
      const glow = new T.InstancedMesh(new T.ConeGeometry(.5, 1, 5), new T.MeshBasicMaterial({ color: 0xffffff }), 150);
      for (let i = 0; i < N; i++) {
        const x = (rnd() - .5) * 690, zz = SHORE(x) + 150 + rnd() * 330; if (zz > 535 || Math.hypot(x - VX, zz - VZ) < VR + 6) { S.set(0, 0, 0); M.compose(P.set(0, -50, 0), Q, S); im.setMatrixAt(i, M); continue; }
        const y = seaFloor(x, zz), big = rnd() < .18, w = big ? 3 + rnd() * 7 : .8 + rnd() * 2.4, h = big ? 3 + rnd() * 9 : .6 + rnd() * 2;
        P.set(x, y + h / 2 - .2, zz); E.set((rnd() - .5) * .3, rnd() * 3, (rnd() - .5) * .3); Q.setFromEuler(E); S.set(w, h, w * (.7 + rnd() * .6)); M.compose(P, Q, S); im.setMatrixAt(i, M); im.setColorAt(i, col.set(rnd() < .3 ? '#2c4258' : rnd() < .6 ? '#1d2f42' : '#243b30'));
      }
      im.instanceColor.needsUpdate = true; SEA.root.add(im);
      for (let i = 0; i < 150; i++) {
        const x = (rnd() - .5) * 690, zz = SHORE(x) + 150 + rnd() * 330; if (zz > 535 || Math.hypot(x - VX, zz - VZ) < VR + 6) { S.set(0, 0, 0); M.compose(P.set(0, -50, 0), Q, S); glow.setMatrixAt(i, M); continue; }
        const y = seaFloor(x, zz), h = 1.4 + rnd() * 4.5; P.set(x, y + h / 2, zz); E.set((rnd() - .5) * .4, rnd() * 3, (rnd() - .5) * .4); Q.setFromEuler(E); S.set(.8 + rnd() * 1.2, h, .8 + rnd() * 1.2); M.compose(P, Q, S); glow.setMatrixAt(i, M); glow.setColorAt(i, col.set(['#39e6ff', '#ff4fd8', '#9d6bff', '#7dffb0'][i % 4]));
      }
      glow.instanceColor.needsUpdate = true; SEA.root.add(glow);
    }

    // ---------------------------------------------------------------- la cueva del abismo
    function buildAbyss() {
      if (AB.built) return; AB.built = true;
      const r = new T.Group(); r.position.set(ABY.x, ABY.y, ABY.z); r.visible = false; scene.add(r); AB.root = r;
      const fl = new T.Mesh(new T.CircleGeometry(ABY.R + 10, 72), new T.MeshBasicMaterial({ color: 0x0d2438 })); fl.rotation.x = -Math.PI / 2; r.add(fl);
      // losetas y rocas sueltas del suelo (instanciadas)
      const N = 260, im = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), N), M = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), P = new V3(), S = new V3(), col = new T.Color();
      for (let i = 0; i < N; i++) { const a = rnd() * 6.283, d = Math.sqrt(rnd()) * ABY.R, w = .8 + rnd() * 3.2, h = .12 + rnd() * (i % 9 ? .5 : 1.8); P.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); E.set(0, rnd() * 3, 0); Q.setFromEuler(E); S.set(w, h, w * (.6 + rnd() * .8)); M.compose(P, Q, S); im.setMatrixAt(i, M); im.setColorAt(i, col.set(rnd() < .15 ? '#1f5272' : rnd() < .5 ? '#16304a' : '#0f2338')); }
      im.instanceColor.needsUpdate = true; r.add(im);
      // pared de la cueva y techo (el "agua" vista desde abajo)
      const wall = new T.Mesh(new T.CylinderGeometry(ABY.R + 12, ABY.R + 12, 110, 56, 1, true), new T.MeshBasicMaterial({ color: 0x03101c, side: T.BackSide })); wall.position.y = 55; r.add(wall);
      for (let i = 0; i < 46; i++) { const a = rnd() * 6.283; mkbox(r, .5, 6 + rnd() * 26, .3, bmat(rnd() < .5 ? 0x2ee6ff : 0x9d6bff, .5, true), Math.cos(a) * (ABY.R + 11.6), 4 + rnd() * 70, Math.sin(a) * (ABY.R + 11.6), 0, -a + Math.PI / 2, 0); }   // venas luminosas
      const ceil = new T.Mesh(new T.CircleGeometry(ABY.R + 12, 56), new T.MeshBasicMaterial({ color: 0x0c5a7a, transparent: true, opacity: .55, side: T.DoubleSide })); ceil.rotation.x = Math.PI / 2; ceil.position.y = 100; r.add(ceil);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; const sh = new T.Mesh(new T.CylinderGeometry(3, 9, 100, 12, 1, true), bmat(0x6fd8ff, .05, true)); sh.position.set(Math.cos(a) * 36, 50, Math.sin(a) * 36); r.add(sh); }   // rayos de luz desde la superficie
      // columnas ruinosas, cristales, algas gigantes, restos de barco
      const stone = lm('#26405a'), stone2 = lm('#1b3047');
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283 + rnd() * .3, d = 40 + rnd() * 26, h = 7 + rnd() * 12, x = Math.cos(a) * d, z = Math.sin(a) * d; mkbox(r, 3.2, h, 3.2, i % 2 ? stone : stone2, x, h / 2, z); mkbox(r, 4, .8, 4, stone, x, h + .2, z, .1, rnd() * 3, .08); if (rnd() < .5) mkbox(r, 1.6, 4 + rnd() * 3, 1.6, stone2, x + 2 + rnd() * 3, 1.5, z + rnd() * 3, .2, 1, .6); }
      const crys = [bmat(0x39e6ff, .9, true), bmat(0xff4fd8, .9, true), bmat(0x9d6bff, .9, true)];
      for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, d = 10 + rnd() * (ABY.R - 12), c = new T.Mesh(new T.ConeGeometry(.5 + rnd() * .9, 2 + rnd() * 5, 5), crys[i % 3]); c.position.set(Math.cos(a) * d, 1.2 + rnd() * 2, Math.sin(a) * d); c.rotation.set((rnd() - .5) * .6, rnd() * 3, (rnd() - .5) * .6); r.add(c); }
      const kelpM = lm('#0e6b5c'); for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, d = 24 + rnd() * 44, h = 7 + rnd() * 10, k = mkbox(r, .5, h, .3, kelpM, Math.cos(a) * d, h / 2, Math.sin(a) * d); AB.kelp.push([k, rnd() * 6]); }
      { const wood = lm('#3a2a1c'), wood2 = lm('#2a1d12'); const w = new T.Group(); w.position.set(-38, 0, -46); w.rotation.set(0, .6, .22); r.add(w); mkbox(w, 5, 3, 18, wood, 0, 1.6, 0); mkbox(w, 4.4, 2, 8, wood2, 0, 3.4, -3); mkbox(w, .6, 14, .6, wood2, 0, 9, 2, .3); mkbox(w, 6, .4, 2.6, lm('#4a4538'), 0, 12, 2.6, .3); }
      // runas en el suelo alrededor del jefe
      for (let i = 0; i < 3; i++) { const rr = new T.Mesh(new T.RingGeometry(11 + i * 14, 11.6 + i * 14, 64), bmat(i % 2 ? 0xff4fd8 : 0x39e6ff, .45, true)); rr.rotation.x = -Math.PI / 2; rr.position.y = .06; r.add(rr); }
      // cascada de entrada: columna de agua que cae desde el techo hasta el suelo
      const wc = document.createElement('canvas'); wc.width = 64; wc.height = 256; const w2 = wc.getContext('2d');
      for (let i = 0; i < 40; i++) { w2.fillStyle = 'rgba(190,240,255,' + (.2 + rnd() * .6).toFixed(2) + ')'; w2.fillRect(rnd() * 64, 0, 2 + rnd() * 6, 256); }
      const wt = new T.CanvasTexture(wc); wt.wrapS = wt.wrapT = T.RepeatWrapping; wt.repeat.set(3, 4); AB.fallTex = wt;
      const e = ENTRY(), fall = new T.Mesh(new T.CylinderGeometry(5.6, 5.6, 100, 28, 1, true), new T.MeshBasicMaterial({ map: wt, transparent: true, opacity: .55, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })); fall.position.set(e.x - ABY.x, 50, e.z - ABY.z); r.add(fall); AB.fall = fall;
      const foam = new T.Mesh(new T.RingGeometry(4, 10, 40), bmat(0xdff6ff, .35, true)); foam.rotation.x = -Math.PI / 2; foam.position.set(e.x - ABY.x, .1, e.z - ABY.z); r.add(foam);
      // portal de salida (sube a la superficie)
      const x = EXIT(), pg = new T.Group(); pg.position.set(x.x - ABY.x, 0, x.z - ABY.z); r.add(pg); AB.exit = pg;
      const ring = new T.Mesh(new T.TorusGeometry(3.6, .35, 10, 40), bmat(0xfff2a8, .95, true)); ring.position.y = 4.4; pg.add(ring); const disc = new T.Mesh(new T.CircleGeometry(3.3, 32), bmat(0xbff6ff, .3, true)); disc.position.y = 4.4; pg.add(disc); pg.userData.disc = disc;
      const beam = new T.Mesh(new T.CylinderGeometry(2.4, 2.4, 100, 16, 1, true), bmat(0xfff2a8, .12, true)); beam.position.y = 50; pg.add(beam);
      const lc = document.createElement('canvas'); lc.width = 512; lc.height = 128; const l2 = lc.getContext('2d'); l2.font = 'bold 70px system-ui,Arial'; l2.textAlign = 'center'; l2.fillStyle = '#fff2a8'; l2.shadowColor = '#ffd54f'; l2.shadowBlur = 22; l2.fillText('SUPERFICIE', 256, 88);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(lc), transparent: true, depthWrite: false, fog: false })); sp.scale.set(18, 4.5, 1); sp.position.y = 10; pg.add(sp);
      // luces del abismo (3, fijas)
      for (const [lx, ly, lz, c, it] of [[0, 20, 0, 0x39e6ff, 1.5], [-42, 12, 0, 0x2de0c0, 1.1], [44, 12, 4, 0x9d6bff, 1.2]]) { const pl = new T.PointLight(c, it, 95, 1.6); pl.position.set(lx, ly, lz); r.add(pl); AB.lights.push(pl); }
    }

    // ---------------------------------------------------------------- entrar y salir
    function enterAbyss(f) {
      if (f.abyss) return; buildAbyss();
      f.abyss = true; f.air = 20; f.swim = false; f.hp = Math.min(f.maxHp, f.hp + 10);
      const e = ENTRY(); f.pos.set(e.x + rand(-2, 2), ABY.y + 82, e.z + rand(-2, 2)); f.vel.set(0, -28, 0); f.onGround = false; f.iframes = Math.max(f.iframes, 1.6);
      if (f.isPlayer) { screenFlash(.9); showBanner('¡EL ABISMO!', '#7df9ff', 'Caes por la cascada…'); G.shake = Math.max(G.shake, 1); sfx('rush', null, 1); }
      burst(new V3(VX, SEA_Y + .3, VZ), 50, '#dff6ff', 14, .3, .9, -.4); ringAt(new V3(VX, SEA_Y + .1, VZ), '#7df9ff', 14, .7);
      if (f.isPlayer) spawnBoss();
    }
    function leaveAbyss(f) {
      if (!f.abyss) return; f.abyss = false;
      const a = rand(0, 6.283); f.pos.set(VX + Math.cos(a) * (VR + 10), SEA_Y + .4, VZ + Math.sin(a) * (VR + 10)); f.vel.set(Math.cos(a) * 6, 15, Math.sin(a) * 6); f.onGround = false; f.iframes = Math.max(f.iframes, 1.2);
      if (f.isPlayer) { screenFlash(.7); showBanner('SUPERFICIE', '#fff2a8', 'Saliste del abismo'); sfx('rush', null, .8); }
      burst(f.pos.clone(), 40, '#dff6ff', 12, .25, .8, -.3);
      if (!G.fighters.some(g => g.abyss && !g.isBoss && !g.remote)) despawnBoss();
    }

    // ---------------------------------------------------------------- el KRAKEN (jefe)
    const B = { f: null, g: null, tent: [], zones: [], tele: [], atk: null, cd: 3, t: 0, state: 'none', phase2: false, bar: null, last: '', slamT: [], eyes: [], mats: [], slow: 0, deadT: 0 };
    function buildSquid() {
      const em = (c) => { const m = lm(c); m.emissive = new T.Color(0x2a0c18); return m; }, g = new T.Group(), skin = em('#a8445a'), skin2 = em('#d9788c'), dark = em('#6a2338'), eyeM = new T.MeshBasicMaterial({ color: 0xfff2a8 }), pupM = new T.MeshBasicMaterial({ color: 0x0a0408 });
      B.mats = [skin, skin2, dark];
      let y = 6; for (let i = 0; i < 7; i++) { const w = 8 - i * .95; mkbox(g, w, 2.4, w * .9, i % 2 ? skin : skin2, 0, y + 1.2, 0); y += 2.3; }        // manto alto
      mkbox(g, 15, .4, 3.4, skin2, 0, 19.6, 0, 0, 0, 0); mkbox(g, 3.4, .4, 15, skin2, 0, 19.6, 0);                                         // aletas
      mkbox(g, 9.5, 4.2, 9.5, dark, 0, 4.4, 0);                                                                                              // cabeza
      B.eyes = [];
      for (const s of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(1.25, 14, 10), eyeM); e.position.set(s * 3.2, 5.6, 4.5); g.add(e); mkbox(g, .5, 1.8, .5, pupM, s * 3.2, 5.6, 5.65); B.eyes.push(e); }
      mkbox(g, 2.6, 1.6, 2.6, lm('#2a0f18'), 0, 2.2, 4.6);                                                                                    // pico
      B.tent = [];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2, root = new T.Group(); root.position.set(Math.cos(a) * 3.6, 3.2, Math.sin(a) * 3.6); root.rotation.y = Math.PI / 2 - a; g.add(root);
        let par = root; const segs = [];
        for (let i = 0; i < 7; i++) { const s = new T.Group(); s.position.z = i ? 2.7 : 0; par.add(s); mkbox(s, 1.5 - i * .15, 1.4 - i * .12, 3, i % 2 ? skin : skin2, 0, 0, 1.35); segs.push(s); par = s; }
        B.tent.push({ segs, ph: k * .8, base: -0.34 });
      }
      return g;
    }
    function spawnBoss() {
      if (B.f && G.fighters.includes(B.f)) return;
      if (B.g || B.f) despawnBoss();   // restos de una partida anterior
      buildAbyss(); if (G.time - AB.clearedAt < 90) return;
      const ch = Object.assign({}, DUMMY_CH, { name: 'Kraken', hp: 1500, color: '#ff5577' });
      const f = new Fighter({ name: 'KRAKEN', ch, lvlVar: 0 });
      f.isBoss = true; f.abyss = true; f.maxHp = f.hp = ch.hp; f.hitR = 5.4; f.hitH = 10; f.ai = null; f.alive = true; f.iframes = 0;
      f.pos.set(ABY.x, ABY.y, ABY.z); f.home = f.pos.clone(); f.model.root.visible = false;
      if (f.plate) { f.plate.remove(); f.plate = null; }
      G.fighters.push(f); B.f = f;
      B.g = buildSquid(); B.g.position.set(ABY.x, ABY.y - 14, ABY.z); scene.add(B.g);   // sube desde el suelo al despertar
      B.state = 'intro'; B.t = 0; B.cd = 3.5; B.atk = null; B.phase2 = false; B.zones = []; B.tele = []; B.last = '';
      mkBar();
      showBanner('¡EL KRAKEN DESPIERTA!', '#ff5577', 'Jefe final del abismo'); G.shake = Math.max(G.shake, 1.3); sfx('boom', B.g.position, 1);
    }
    function despawnBoss() {
      if (B.f) { const i = G.fighters.indexOf(B.f); if (i >= 0) { G.fighters.splice(i, 1); } try { B.f.dispose(); } catch (e) { } B.f = null; }
      if (B.g) { scene.remove(B.g); B.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); B.g = null; }
      for (const z of B.zones) scene.remove(z.m); for (const z of B.tele) scene.remove(z.m); B.zones = []; B.tele = []; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.state = 'none';
      if (B.bar) B.bar.classList.remove('on');
    }
    const css = document.createElement('style');
    css.textContent = '#bossbar{position:fixed;top:64px;left:50%;transform:translateX(-50%);width:min(640px,86vw);z-index:70;display:none;pointer-events:none;color:#fff;font-family:var(--body,system-ui,sans-serif);text-align:center}#bossbar.on{display:block}#bossbar b{display:block;letter-spacing:.18em;font-size:15px;text-shadow:0 2px 6px #000;margin-bottom:4px}#bossbar .bb{height:16px;border:2px solid #fff;border-radius:9px;background:rgba(10,0,10,.7);overflow:hidden}#bossbar .bb i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#ff2d55,#ff8fb0);transition:width .15s}#bossbar small{display:block;opacity:.85;margin-top:3px;font-size:12px;text-shadow:0 1px 4px #000}';
    document.head.appendChild(css);
    function mkBar() { if (!B.bar) { B.bar = document.createElement('div'); B.bar.id = 'bossbar'; B.bar.innerHTML = '<b>KRAKEN DEL ABISMO</b><div class="bb"><i></i></div><small></small>'; document.body.appendChild(B.bar); } B.bar.classList.add('on'); }
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
      const ring = new T.Mesh(new T.RingGeometry(r - .3, r, 40), new T.MeshBasicMaterial({ color: col || 0xff2d2d, transparent: true, opacity: .9, depthWrite: false, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = .02; m.add(ring); ring.rotation.set(0, 0, 0);
      const t = { m, life, t: 0, r }; B.tele.push(t); return t;
    };
    // --- ataques
    function atkSlam() {   // aplastamientos: tentáculos que salen del suelo donde estás
      const targets = abyssPlayers(), n = B.phase2 ? 5 : 3, hits = [];
      for (let i = 0; i < n; i++) { const p = targets.length ? targets[i % targets.length] : null; const x = p ? p.pos.x + rand(-5, 5) : ABY.x + rand(-20, 20), z = p ? p.pos.z + rand(-5, 5) : ABY.z + rand(-20, 20); const d = Math.hypot(x - ABY.x, z - ABY.z), k = d > ABY.R - 4 ? (ABY.R - 4) / d : 1; hits.push({ x: ABY.x + (x - ABY.x) * k, z: ABY.z + (z - ABY.z) * k, at: .9 + i * .45, done: false, tele: null, col: null }); }
      for (const h of hits) h.tele = telegraph(h.x, h.z, 5.2, 1.4);
      return { name: 'slam', t: 0, dur: .9 + n * .45 + 1.2, hits,
        upd(dt) {
          for (const h of this.hits) {
            if (h.done || this.t < h.at) { if (h.tele) h.tele.m.material.opacity = .22 + Math.sin(this.t * 14) * .08; continue; }
            h.done = true; if (h.tele) h.tele.life = .05;
            const c = new T.Mesh(new T.BoxGeometry(2.2, 17, 2.2), lm('#c2566e')); c.position.set(h.x, ABY.y - 6, h.z); scene.add(c); h.col = c; h.ct = 0;
            for (const p of abyssPlayers()) { const dx = p.pos.x - h.x, dz = p.pos.z - h.z, d = Math.hypot(dx, dz); if (d < 5.2 && p.pos.y < ABY.y + 3.4) hurt(p, 20, dx / (d || 1), dz / (d || 1), 10); }
            burst(new V3(h.x, ABY.y + .4, h.z), 34, '#6f8aa8', 11, .3, .9, 1); ringAt(new V3(h.x, ABY.y + .2, h.z), '#ff8fb0', 7, .5); G.shake = Math.max(G.shake, .6); sfx('crash', new V3(h.x, ABY.y, h.z), .8);
          }
          for (const h of this.hits) if (h.col) { h.ct += dt; const u = h.ct / 1.1; h.col.position.y = ABY.y + (u < .15 ? -6 + (u / .15) * 14 : u < .6 ? 8 : 8 - ((u - .6) / .4) * 16); if (u >= 1) { scene.remove(h.col); h.col = null; } }
        },
        cleanup() { for (const h of this.hits) if (h.col) scene.remove(h.col); } };
    }
    function atkSweep() {   // barrido: un tentáculo gigante gira por el suelo; hay que saltarlo
      const bar = new T.Mesh(new T.BoxGeometry(ABY.R - 4, 1.5, 1.6), lm('#c2566e')); bar.geometry.translate((ABY.R - 4) / 2, 0, 0); bar.position.set(ABY.x, ABY.y + .9, ABY.z); scene.add(bar);
      const p0 = abyssPlayers()[0], a0 = p0 ? Math.atan2(p0.pos.z - ABY.z, p0.pos.x - ABY.x) - 1.2 * (Math.random() < .5 ? 1 : -1) : rand(0, 6.28), dirn = Math.random() < .5 ? 1 : -1;
      const warn = new T.Mesh(new T.BoxGeometry(ABY.R - 4, .05, 1.4), new T.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: .5, depthWrite: false })); warn.geometry.translate((ABY.R - 4) / 2, 0, 0); warn.position.set(ABY.x, ABY.y + .12, ABY.z); warn.rotation.y = -a0; scene.add(warn);
      return { name: 'sweep', t: 0, dur: 1.2 + 2.6, bar, warn, a0, dirn, hit: new Set(),
        upd(dt) {
          if (this.t < 1.2) { this.bar.visible = false; this.warn.material.opacity = .25 + Math.sin(this.t * 16) * .15; return; }
          this.warn.visible = false; this.bar.visible = true; const sp = (B.phase2 ? 2.7 : 2.2), a = this.a0 + this.dirn * (this.t - 1.2) * sp; this.bar.rotation.y = -a;
          const cx = Math.cos(a), cz = Math.sin(a);
          for (const p of abyssPlayers()) { if (this.hit.has(p)) continue; const dx = p.pos.x - ABY.x, dz = p.pos.z - ABY.z, along = dx * cx + dz * cz, off = Math.abs(-dx * cz + dz * cx); if (along > 3 && along < ABY.R && off < 1.7 && p.pos.y < ABY.y + 1.7) { this.hit.add(p); hurt(p, 16, -cz * this.dirn, cx * this.dirn, 9); } }
          if (Math.random() < dt * 20) emit(ABY.x + cx * rand(4, 60), ABY.y + .6, ABY.z + cz * rand(4, 60), 0, 1.5, 0, '#a9c4d8', .22, .5, 1, 2);
        },
        cleanup() { scene.remove(this.bar); scene.remove(this.warn); } };
    }
    function atkInk() {   // tinta: charcos oscuros que queman y frenan
      const targets = abyssPlayers(), n = B.phase2 ? 5 : 4, zones = [];
      for (let i = 0; i < n; i++) { const p = targets.length ? targets[i % targets.length] : null, a = rand(0, 6.28), d = rand(0, 7); const x = (p ? p.pos.x : ABY.x + rand(-25, 25)) + Math.cos(a) * d, z = (p ? p.pos.z : ABY.z + rand(-25, 25)) + Math.sin(a) * d;
        const m = new T.Mesh(new T.CircleGeometry(5.5, 36), new T.MeshBasicMaterial({ color: 0x120820, transparent: true, opacity: .1, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, ABY.y + .12, z); scene.add(m); zones.push({ x, z, m, life: 7, t: 0 }); }
      B.zones.push(...zones);
      sfx('whoom', B.g.position, .9);
      return { name: 'ink', t: 0, dur: 1.8, upd() { } };
    }
    function atkSuction() {   // succión: te arrastra al centro y explota
      const rings = []; for (let i = 0; i < 3; i++) { const m = new T.Mesh(new T.RingGeometry(9, 9.5, 48), new T.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(ABY.x, ABY.y + .2, ABY.z); scene.add(m); rings.push(m); }
      sfx('rush', B.g.position, 1);
      return { name: 'suction', t: 0, dur: 3.6, rings, blast: false,
        upd(dt) {
          const pull = this.t < 2.6;
          this.rings.forEach((m, i) => { const u = ((this.t * .9 + i / 3) % 1); m.scale.setScalar(pull ? 7 - u * 6.5 : .1); m.material.opacity = pull ? .8 * (1 - u) : 0; });
          if (pull) { for (const p of abyssPlayers()) { const dx = ABY.x - p.pos.x, dz = ABY.z - p.pos.z, d = Math.hypot(dx, dz) || 1; if (d > 3) { p.vel.x += dx / d * 24 * dt * (p.onGround ? 1 : .6); p.vel.z += dz / d * 24 * dt * (p.onGround ? 1 : .6); } } if (Math.random() < dt * 30) { const a = rand(0, 6.28), r = rand(12, 36); emit(ABY.x + Math.cos(a) * r, ABY.y + rand(.5, 3), ABY.z + Math.sin(a) * r, -Math.cos(a) * 10, 0, -Math.sin(a) * 10, '#ff8fb0', .2, .9, 0, 0); } }
          if (!this.blast && this.t >= 2.8) { this.blast = true; ringAt(new V3(ABY.x, ABY.y + .3, ABY.z), '#ff2d55', 20, .7); burst(new V3(ABY.x, ABY.y + 2, ABY.z), 60, '#ff8fb0', 18, .35, 1, .4); G.shake = Math.max(G.shake, 1.2); sfx('crash', B.g.position, 1);
            for (const p of abyssPlayers()) { const dx = p.pos.x - ABY.x, dz = p.pos.z - ABY.z, d = Math.hypot(dx, dz); if (d < 9.5 && p.pos.y < ABY.y + 5) hurt(p, 26, dx / (d || 1), dz / (d || 1), 15); } }
        },
        cleanup() { for (const m of this.rings) scene.remove(m); } };
    }
    function atkBeam() {   // fase 2: rayos de los ojos
      const p0 = abyssPlayers()[0]; if (!p0) return null;
      const lines = [0, 1].map(i => { const m = new T.Mesh(new T.BoxGeometry(.25, .25, 1), new T.MeshBasicMaterial({ color: 0xff2d2d, transparent: true, opacity: .4, depthWrite: false, blending: T.AdditiveBlending })); scene.add(m); return m; });
      sfx('beam', B.g.position, 1);
      return { name: 'beam', t: 0, dur: 3.2, lines, tx: p0.pos.x, tz: p0.pos.z, tk: 0,
        upd(dt) {
          const fire = this.t > 1.3 && this.t < 2.6, g = B.g;
          if (this.t < 1.3) { const p = abyssPlayers()[0]; if (p) { this.tx += (p.pos.x - this.tx) * Math.min(1, dt * 3); this.tz += (p.pos.z - this.tz) * Math.min(1, dt * 3); } }
          this.lines.forEach((m, i) => { const s = i ? 1 : -1, ex = g.position.x + Math.sin(g.rotation.y) * 4.5 + Math.cos(g.rotation.y) * 3.2 * s, ey = g.position.y + 5.6, ez = g.position.z + Math.cos(g.rotation.y) * 4.5 - Math.sin(g.rotation.y) * 3.2 * s;
            const to = new V3(this.tx, ABY.y + 1, this.tz), from = new V3(ex, ey, ez), d = from.distanceTo(to); m.position.copy(from).lerp(to, .5); m.scale.set(fire ? 3.2 : 1, fire ? 3.2 : 1, d); m.lookAt(to); m.material.opacity = fire ? .95 : .35 + Math.sin(this.t * 20) * .15; m.material.color.set(fire ? 0xffffff : 0xff2d2d); });
          if (fire) { this.tk -= dt; if (this.tk <= 0) { this.tk = .22; for (const p of abyssPlayers()) { const d = Math.hypot(p.pos.x - this.tx, p.pos.z - this.tz); if (d < 2.4) hurt(p, 9, 0, 0, 3); } burst(new V3(this.tx, ABY.y + .5, this.tz), 10, '#ff8fb0', 8, .22, .5, .8); } }
        },
        cleanup() { for (const m of this.lines) scene.remove(m); } };
    }
    function pickAttack() {
      const pool = ['slam', 'sweep', 'ink', 'suction'].concat(B.phase2 ? ['beam', 'slam'] : []).filter(n => n !== B.last);
      const name = pool[Math.random() * pool.length | 0]; B.last = name;
      const a = name === 'slam' ? atkSlam() : name === 'sweep' ? atkSweep() : name === 'ink' ? atkInk() : name === 'suction' ? atkSuction() : atkBeam();
      if (a) { const label = { slam: '¡APLASTAMIENTO!', sweep: '¡SALTA!', ink: '¡TINTA!', suction: '¡SUCCIÓN!', beam: '¡RAYOS!' }[a.name]; popText(B.g.position.clone().add(new V3(0, 14, 0)), label, '#ff8fb0', 26); }
      return a;
    }
    function bossHit(att, o) {   // cada golpe que recibe: destello y chispas
      if (!B.g) return; B.hitT = .12; if (Math.random() < .5) burst(new V3(att.pos.x, att.pos.y + 1.5, att.pos.z).lerp(B.g.position, .15), 6, '#ffd0dc', 6, .16, .4, .5);
    }
    function bossDown(f, killer) {
      if (B.state === 'dead') return; B.state = 'dead'; B.deadT = 0; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = null;
      for (const z of B.zones) scene.remove(z.m); B.zones = []; for (const z of B.tele) scene.remove(z.m); B.tele = [];
      AB.clearedAt = G.time; screenFlash(.9); G.slowT = Math.max(G.slowT, 1.2); G.shake = Math.max(G.shake, 2);
      showBanner('¡KRAKEN DERROTADO!', '#ffd54f', 'El abismo queda en calma'); sfx('boom', B.g.position, 1);
      for (let i = 0; i < 8; i++) later(i * .25, () => { if (B.g) { burst(B.g.position.clone().add(new V3(rand(-4, 4), rand(2, 16), rand(-4, 4))), 40, i % 2 ? '#ffd54f' : '#ff8fb0', 16, .35, 1.1, .2); ringAt(B.g.position.clone().add(new V3(0, rand(1, 8), 0)), '#ffd54f', 12, .6); } });
      // premios para los jugadores que estaban en el abismo
      const prize = []; if (window.CF_EMOTES && CF_EMOTES.grantBoss) prize.push(...CF_EMOTES.grantBoss()); if (window.CF_COS && CF_COS.grantBoss) prize.push(...CF_COS.grantBoss());
      later(2.2, () => { if (prize.length) { showBanner('¡RECOMPENSAS!', '#ffd54f', prize.join(' · ')); for (const p of prize) addFeedText('🎁 ' + p, '#ffd54f'); } else addFeedText('El Kraken no soltó nada nuevo esta vez', '#9aa0b8'); });
      later(6, () => { despawnBoss(); });
    }
    function bossUpdate(dt, t) {
      const f = B.f; if (!f || !B.g) return; const g = B.g;
      // el jefe no se mueve ni se empuja
      f.pos.set(ABY.x, ABY.y, ABY.z); f.vel.set(0, 0, 0); f.stun = 0; f.ragdoll = 0; f.hurtT = 0; f.grabbed = false; f.cineLock = null; f.frozen = 0; f.blocking = false; f.iframes = 0;
      const ps = abyssPlayers(), tgt = ps.sort((a, b) => dist2d(a, f) - dist2d(b, f))[0];
      if (tgt) { const ya = Math.atan2(tgt.pos.x - ABY.x, tgt.pos.z - ABY.z); let d = ((ya - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI; g.rotation.y += d * Math.min(1, dt * 1.6); }
      // temblor y respiración de los tentáculos
      const rage = B.phase2 ? 1.6 : 1;
      B.tent.forEach(tn => tn.segs.forEach((s, i) => { s.rotation.x = tn.base + Math.sin(t * 1.6 * rage + tn.ph + i * .5) * .12 * (i + 1) * .5; s.rotation.y = Math.sin(t * 1.1 * rage + tn.ph * 1.3 + i * .4) * .09 * (i + 1) * .5; }));
      B.eyes.forEach(e => { e.material.color.set(B.phase2 ? 0xff3b30 : 0xfff2a8); e.scale.setScalar(1 + Math.sin(t * 5) * .05); });
      // destello al recibir un golpe
      B.hitT = Math.max(0, (B.hitT || 0) - dt); for (const m of B.mats) m.emissive.setRGB(B.hitT > 0 ? .6 : .17, B.hitT > 0 ? .35 : .05, B.hitT > 0 ? .35 : .1);
      if (B.state === 'intro') { B.t += dt; g.position.y = ABY.y - 14 + Math.min(1, B.t / 3.2) * 14; if (Math.random() < dt * 20) emit(ABY.x + rand(-8, 8), ABY.y + .5, ABY.z + rand(-8, 8), rand(-3, 3), rand(2, 6), rand(-3, 3), '#8aa4b8', .3, .9, 1, 2); if (B.t > 3.4) B.state = 'fight'; }
      else if (B.state === 'fight') {
        if (!B.phase2 && f.hp < f.maxHp * .5) { B.phase2 = true; showBanner('¡EL KRAKEN SE ENFURECE!', '#ff3b30', 'Ahora dispara rayos'); camPunch(1, 1); G.shake = Math.max(G.shake, 1.6); screenFlash(.5); sfx('boom', g.position, 1); }
        if (B.atk) { B.atk.t += dt; B.atk.upd(dt); if (B.atk.t >= B.atk.dur) { if (B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.cd = B.phase2 ? rand(1.0, 1.8) : rand(1.8, 2.8); } }
        else if (ps.length) { B.cd -= dt; if (B.cd <= 0) B.atk = pickAttack(); }
      }
      // charcos de tinta (queman y frenan) y marcas rojas
      const inked = new Set();   // varios charcos juntos no suman: se cobra una sola vez por cuadro
      for (let i = B.zones.length - 1; i >= 0; i--) { const z = B.zones[i]; z.t += dt; z.m.material.opacity = Math.min(.8, z.t * 1.2) * (z.t > z.life - 1 ? Math.max(0, z.life - z.t) : 1);
        if (z.t > .9) for (const p of ps) { const d = Math.hypot(p.pos.x - z.x, p.pos.z - z.z); if (d < 5.5 && p.pos.y < ABY.y + 1.2) inked.add(p); }
        if (z.t >= z.life) { scene.remove(z.m); B.zones.splice(i, 1); } }
      for (const p of inked) { if (p.iframes > 0) continue; p.hp -= 3.5 * dt; p.vel.x *= Math.exp(-3 * dt); p.vel.z *= Math.exp(-3 * dt); p.flashT = Math.max(p.flashT || 0, .05); if (p.hp <= 0 && p.alive) kill(p, null); }
      for (let i = B.tele.length - 1; i >= 0; i--) { const z = B.tele[i]; z.t += dt; if (z.t >= z.life) { scene.remove(z.m); B.tele.splice(i, 1); } }
      // barra de vida
      if (B.bar) { B.bar.querySelector('i').style.width = Math.max(0, f.hp / f.maxHp * 100).toFixed(1) + '%'; B.bar.querySelector('small').textContent = B.state === 'intro' ? 'Despertando…' : B.phase2 ? 'ENFURECIDO · usa tus habilidades' : 'Usa tus habilidades · salta los barridos'; }
      if (B.state === 'dead') { B.deadT += dt; g.position.y -= dt * 2.5; g.rotation.z = Math.sin(B.deadT * 30) * .02 * Math.max(0, 1 - B.deadT / 4); }
      if (!ps.length && B.state !== 'dead') { B.idle = (B.idle || 0) + dt; if (B.idle > 4) { B.idle = 0; despawnBoss(); } } else B.idle = 0;
    }

    // ---------------------------------------------------------------- bucle (lo llama updateSea cada cuadro)
    let lastF = 0;
    function update(dt, t, cp) {
      if (!AB.vortex) buildVortex();
      if (!AB.far) buildFarSea();
      const near = cp.z > 300;
      if (AB.vortex) {
        AB.vortex.visible = near || cp.y > 20;
        if (AB.vortex.visible) {
          AB.disc.rotation.z -= dt * .55; AB.rings.forEach((r, i) => { r.rotation.z += dt * (.3 + i * .15) * (i % 2 ? -1 : 1); r.material.opacity = (.22 - i * .05) * (1 + (SEA.ev && SEA.ev.squid > 0 ? 1.4 : 0)); });
          if (AB.funnelTex) AB.funnelTex.offset.y -= dt * .9;
          AB.pillar.material.opacity = (.14 + Math.sin(t * 2) * .03) * (SEA.ev && SEA.ev.squid > 0 ? 2.4 : 1);
          if (Math.hypot(cp.x - VX, cp.z - VZ) < 150 && Math.random() < dt * 14) { const a = rand(0, 6.28), r = rand(9, VR); emit(VX + Math.cos(a) * r, SEA_Y + .15, VZ + Math.sin(a) * r, -Math.sin(a) * 5 - Math.cos(a) * 2, .6, Math.cos(a) * 5 - Math.sin(a) * 2, '#e8f8ff', .16, 1.3, 0, 1); }
        }
      }
      // el torbellino absorbe a quien nada cerca (poco a poco: se puede nadar para escapar de lejos)
      for (const f of G.fighters) {
        if (f.remote || f.isBoss || f.abyss || !f.alive || f.cineLock) continue;
        const dx = f.pos.x - VX, dz = f.pos.z - VZ, d = Math.hypot(dx, dz); if (d > VR || f.pos.y > SEA_Y + 2.2) continue;
        const s = 1 - d / VR, tang = 6 * s + 1, inw = 12 * s + 2, ux = dx / (d || 1), uz = dz / (d || 1);   // en el borde se puede escapar nadando; más adentro ya no
        f.vel.x += (-ux * inw - uz * tang) * dt * 1.3 * 1.6; f.vel.z += (-uz * inw + ux * tang) * dt * 1.3 * 1.6;
        if (f.isPlayer && !f.vortexMsg && d < VR * .8) { f.vortexMsg = true; showBanner('¡EL TORBELLINO!', '#7df9ff', 'Te arrastra hacia el abismo'); }
        if (d < 4.6 && f.pos.y < SEA_Y + 1.6) enterAbyss(f);
      }
      if (AB.root) {
        AB.root.visible = cp.z > 560;
        if (AB.root.visible) {
          if (AB.fallTex) AB.fallTex.offset.y += dt * 1.4;
          AB.kelp.forEach(([k, ph]) => { k.rotation.z = Math.sin(t * .8 + ph) * .12; });
          if (AB.exit) { AB.exit.rotation.y += dt * .8; AB.exit.userData.disc.material.opacity = .25 + Math.sin(t * 3) * .1; }
          for (const f of G.fighters) {
            if (!f.abyss || f.isBoss || f.remote) continue;
            const x = EXIT(), d = Math.hypot(f.pos.x - x.x, f.pos.z - x.z);
            if (f.isPlayer && f.alive && d < 3.4 && f.pos.y < ABY.y + 7) { if (B.state === 'fight' || B.state === 'intro') { if (!f.exitMsg || G.time - f.exitMsg > 4) { f.exitMsg = G.time; popText(chestOf(f), 'Derrota al Kraken para subir… o huye del abismo', '#fff2a8', 16); } } else leaveAbyss(f); }
            if (f.onGround && f.fellIn !== 1 && f.pos.y < ABY.y + 1) { f.fellIn = 1; burst(f.pos.clone(), 40, '#dff6ff', 12, .3, .9, 1); ringAt(new V3(f.pos.x, ABY.y + .2, f.pos.z), '#7df9ff', 8, .6); if (f.isPlayer) { G.shake = Math.max(G.shake, .8); sfx('crash', f.pos, .8); } }
          }
          // el que muere o sale de la cueva deja de estar en el abismo
        }
      }
      for (const f of G.fighters) if (f.abyss && !f.isBoss && (f.pos.z < ABY.z - 130 || (!f.alive && f.deathT > 1.2))) { f.abyss = false; f.fellIn = 0; f.exitMsg = 0; if (!G.fighters.some(g => g.abyss && !g.isBoss && !g.remote)) despawnBoss(); }
      if (B.f) bossUpdate(dt, t);
    }

    window.CF_ABISMO = { update, bossHit, bossDown, enter: enterAbyss, leave: leaveAbyss, get boss() { return B.f; }, get mesh() { return B.g; }, VORTEX: { x: VX, z: VZ, r: VR },
      // para pruebas / admin: baja directo al abismo
      tp(f) { buildVortex(); enterAbyss(f || G.player); },
      force(n) { if (!B.f || B.state !== 'fight') return false; if (B.atk && B.atk.cleanup) B.atk.cleanup(); B.atk = ({ slam: atkSlam, sweep: atkSweep, ink: atkInk, suction: atkSuction, beam: atkBeam }[n] || atkSlam)(); return !!B.atk; } };
  }
});
