/* ===== EL MUELLE GRANDE: ampliación del muelle, tablón de eventos y el BARCO del Kraken =====
   - El muelle se alarga y tiene una cabecera en T, con farolas, cajas, barriles y barandas.
   - Junto a la entrada del muelle hay un TABLÓN DE MADERA con papeles: el estado de cada evento del mar (activo + cuenta atrás) y cuánto falta para el próximo.
   - Cuando empieza el evento del Calamar gigante llega un BARCO al muelle y espera unos minutos. Quien se sube va a bordo; al zarpar el barco avanza despacio
     hacia el torbellino, pero la corriente lo atrapa (un accidente, no una misión): cinemática de la absorción y todos los pasajeros caen al abismo.
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE;
    const lm = c => new T.MeshLambertMaterial({ color: c }), bm = (c, op, add) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending, side: T.DoubleSide });
    const mkbox = (par, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const q = new T.Mesh(new T.BoxGeometry(w, h, d), m); q.position.set(x, y, z); if (rx || ry || rz) q.rotation.set(rx, ry, rz); par.add(q); return q; };
    const rnd = (() => { let q = 777; return () => (q = (q * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const VXC = 70, VZC = 420, VRC = 44;                       // el torbellino (igual que en abismo.js)
    const BERTH = { x: 0, z: 150.2 }, HX = 7.4, HZ = 2.9, DECK = .35;
    const fmt = s => { s = Math.max(0, Math.ceil(s)); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };
    const M = { built: false, board: null, bg: null, bt: null, boat: null, sprite: null, state: 'off', t: 0, wait: 0, used: false, prevSquid: 0, pos: new V3(), yaw: 0, roll: 0, pitch: 0, aboard: new Map(), signT: 0, sinkT: 0, sinkAng: 0, sinkR: 0, msgAt: 99, spriteTxt: '' };

    function woodTex(w, h, base, lines) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(' + (rnd() < .5 ? '40,25,10' : '200,160,100') + ',' + (.05 + rnd() * .09).toFixed(2) + ')'; g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 120, 1 + rnd() * 2); }
      g.strokeStyle = 'rgba(30,18,6,.55)'; g.lineWidth = 3; for (let y = lines; y < h; y += lines) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      return c;
    }
    function label(txt, w, h, font, col, glow) {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.font = font; g.textAlign = 'center'; g.fillStyle = col; if (glow) { g.shadowColor = glow; g.shadowBlur = 18; } g.fillText(txt, w / 2, h * .72);
      return new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, fog: false }));
    }

    // ---------------------------------------------------------------- el muelle ampliado
    function buildPier() {   // el muelle es el modelo original (agrandado en game.js): aquí solo se le ponen farolas, cajas y el letrero
      const g = new T.Group(); scene.add(g); M.pier = g;
      const dark = lm('#4d3622');
      for (const [x, z] of [[-3.9, 92], [3.9, 100], [-3.9, 108], [3.9, 116], [-3.9, 124], [3.9, 132], [-7.7, 138], [7.7, 138], [-7.7, 146.6], [7.7, 146.6], [0, 147.2]]) {
        mkbox(g, .22, 4.4, .22, dark, x, 2.1, z); const lamp = new T.Mesh(new T.SphereGeometry(.34, 10, 8), bm(0xffe8a0, .95, true)); lamp.position.set(x, 4.5, z); g.add(lamp); const hl = new T.Mesh(new T.SphereGeometry(.9, 10, 8), bm(0xffd070, .18, true)); hl.position.copy(lamp.position); g.add(hl);
      }
      for (const [x, z] of [[-6.4, 143.4], [6.2, 144.2], [-5.4, 144.6]]) { const s2 = 1 + rnd() * .3; mkbox(g, s2, s2, s2, lm('#9a7a4a'), x, s2 / 2 + .06, z, 0, rnd() * 3, 0); }
      for (const [x, z] of [[6.6, 142.8], [-6.8, 141.6]]) { const b2 = new T.Mesh(new T.CylinderGeometry(.5, .5, 1.1, 12), lm('#5a3d24')); b2.position.set(x, .62, z); g.add(b2); }
      for (const x of [-7, 7]) { const bl = new T.Mesh(new T.CylinderGeometry(.22, .3, .6, 10), lm('#2d3640')); bl.position.set(x, .35, 145.4); g.add(bl); }
      const nm = label('MUELLE DEL ABISMO', 768, 128, 'bold 74px system-ui,Arial', '#ffe9b0', '#ff9a4a'); nm.scale.set(13, 2.2, 1); nm.position.set(0, 7.4, 126); g.add(nm);
    }

    // ---------------------------------------------------------------- el tablón de eventos (madera + papeles)
    const EV_ROWS = [['school', '', 'Cardumen gigante'], ['frenzy', '', 'Frenesí de tiburones'], ['glow', '', 'Marea luminosa'], ['squid', '', 'Calamar gigante']];
    function buildBoard() {
      const g = new T.Group(); g.position.set(8.4, 0, 81.6); g.rotation.y = Math.PI; g.scale.setScalar(.6); scene.add(g); M.board = g;   // mira hacia la ciudad
      const wood = lm('#5a3d24'), c = document.createElement('canvas'); c.width = 1024; c.height = 700; M.bg = c.getContext('2d'); M.bt = new T.CanvasTexture(c); M.bt.anisotropy = 4;
      for (const px of [-3.4, 3.4]) mkbox(g, .45, 5.2, .45, wood, px, 2.6, 0);
      mkbox(g, 7.9, 5, .3, lm('#7a5a38'), 0, 3.6, 0); mkbox(g, 8.5, .35, 1.3, lm('#3d2918'), 0, 6.4, -.2, -.12, 0, 0);
      const pl = new T.Mesh(new T.PlaneGeometry(7.5, 4.65), new T.MeshBasicMaterial({ map: M.bt })); pl.position.set(0, 3.6, .17); g.add(pl);
      paintBoard();
    }
    function paper(g, x, y, w, h, rot, col) {
      g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 5; g.fillStyle = col || '#efe5c8'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowBlur = 0; g.shadowOffsetY = 0;
      g.fillStyle = 'rgba(255,230,120,.7)'; g.fillRect(-w / 2 - 6, -h / 2 - 4, 46, 16); g.fillRect(w / 2 - 40, -h / 2 - 4, 46, 16); g.restore();
    }
    function paintBoard() {
      const g = M.bg, W = 1024, H = 700; g.drawImage(woodTex(1024, 700, '#7a5a38', 88), 0, 0);
      g.fillStyle = '#2b1a0a'; g.font = 'bold 54px system-ui,Arial'; g.textAlign = 'center'; g.fillText('TABLÓN DE EVENTOS', W / 2, 66); g.fillRect(150, 80, W - 300, 5);
      const rowH = 176, y0 = 106, colW = 470;
      const cells = EV_ROWS.map(([k, ico, n]) => { const left = SEA.ev[k] || 0; return { ico, n, on: left > 0, txt: left > 0 ? '¡ACTIVO! ' + fmt(left) : 'En espera' }; });
      const sq = SEA.ev.squid > 0, bs = M.state;
      cells.push({ ico: '', n: 'Barco al abismo', on: bs === 'dock' || bs === 'sail' || bs === 'arrive', txt: bs === 'dock' ? 'Zarpa en ' + fmt(M.wait) : bs === 'arrive' ? 'Llegando…' : bs === 'sail' || bs === 'sink' ? 'En ruta' : sq ? 'Ya se fue' : 'Llega con el Calamar' });
      const noK = SEA.noKraken && !(typeof NETPUB === 'function' && NETPUB());
      cells.push({ ico: '', n: 'Próximo evento', on: false, txt: SEA.eventsAuto === false ? 'Desactivados' : fmt(SEA.evTimer), hi: true });
      cells.forEach((c, i) => {
        const x = 30 + (i % 2) * (colW + 24), y = y0 + (i / 2 | 0) * rowH, w = colW, h = rowH - 20;
        paper(g, x, y, w, h, ((i * 37) % 7 - 3) * .006, c.hi ? '#fbeab0' : '#efe5c8');
        g.textAlign = 'left'; g.fillStyle = '#1d140a'; g.font = '62px system-ui,Arial'; g.fillText(c.ico, x + 18, y + 84);
        g.font = 'bold 33px system-ui,Arial'; g.fillText(c.n, x + 96, y + 62);
        g.font = 'bold 36px system-ui,Arial'; g.fillStyle = c.on ? '#b3261e' : (c.hi ? '#3a5f1d' : '#5b5240'); g.fillText(c.txt, x + 96, y + 112);
        if (c.on) { g.fillStyle = '#b3261e'; g.beginPath(); g.arc(x + w - 34, y + 36, 11, 0, 7); g.fill(); }
      });
      if (noK) { g.font = '24px system-ui,Arial'; g.fillStyle = 'rgba(255,230,200,.8)'; g.textAlign = 'center'; g.fillText('El evento del Kraken está desactivado en esta partida', W / 2, H - 14); }
      M.bt.needsUpdate = true;
    }

    // ---------------------------------------------------------------- el barco
    function hullShape(len, wid, bow) {
      const sh = new T.Shape(), l = len / 2, w = wid / 2;
      sh.moveTo(-l, -w); sh.lineTo(l - bow, -w); sh.bezierCurveTo(l - bow * .5, -w, l - bow * .12, -w * .5, l, 0); sh.bezierCurveTo(l - bow * .12, w * .5, l - bow * .5, w, l - bow, w); sh.lineTo(-l, w); sh.lineTo(-l, -w); return sh;
    }
    // ---- texturas procedurales: madera podrida con algas, tela rota, óxido, pintura descascarada
    function texCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t; }
    function woodTexture(base, slime, planks) {
      return texCanvas(512, 512, (g, w, h) => {
        g.fillStyle = base; g.fillRect(0, 0, w, h); const ph = h / planks;
        for (let p = 0; p < planks; p++) { const tone = (rnd() - .5) * 26; g.fillStyle = 'rgba(' + (tone > 0 ? '255,235,200' : '0,0,0') + ',' + (Math.abs(tone) / 160).toFixed(2) + ')'; g.fillRect(0, p * ph, w, ph);
          for (let i = 0; i < 26; i++) { g.strokeStyle = 'rgba(20,10,4,' + (.1 + rnd() * .22).toFixed(2) + ')'; g.lineWidth = .6 + rnd() * 1.4; g.beginPath(); const y = p * ph + rnd() * ph; g.moveTo(rnd() * 60, y); g.bezierCurveTo(w * .3, y + (rnd() - .5) * 6, w * .6, y + (rnd() - .5) * 6, w, y + (rnd() - .5) * 4); g.stroke(); }
          g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, p * ph); g.lineTo(w, p * ph); g.stroke();
          for (let n = 0; n < 4; n++) { g.fillStyle = 'rgba(30,26,24,.85)'; g.beginPath(); g.arc(20 + rnd() * (w - 40), p * ph + 5 + rnd() * (ph - 10), 2.2, 0, 7); g.fill(); } }
        for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(8,16,10,' + (.08 + rnd() * .2).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 6 + rnd() * 30, 0, 7); g.fill(); }
        if (slime) for (let i = 0; i < 90; i++) { const yy = h * (.45 + rnd() * .55); g.fillStyle = 'rgba(' + (20 + rnd() * 30 | 0) + ',' + (70 + rnd() * 60 | 0) + ',' + (40 + rnd() * 30 | 0) + ',' + (.18 + rnd() * .3).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, yy, 5 + rnd() * 24, 0, 7); g.fill(); }
        for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(190,200,190,' + (.1 + rnd() * .25).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.5 + rnd() * 3, 0, 7); g.fill(); }
      });
    }
    function sailTexture() {
      return texCanvas(256, 256, (g, w, h) => {
        g.fillStyle = '#b9b19a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(' + (60 + rnd() * 50 | 0) + ',' + (50 + rnd() * 40 | 0) + ',30,' + (.08 + rnd() * .2).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 6 + rnd() * 34, 0, 7); g.fill(); }
        g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 1.5; for (let y = 0; y < h; y += 18) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.fillStyle = 'rgba(120,20,20,.55)'; g.fillRect(0, h * .3, w, 20);
        g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 16; i++) { g.beginPath(); const x = rnd() * w, y = rnd() * h, r = 4 + rnd() * 22; g.moveTo(x, y); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.283; g.lineTo(x + Math.cos(a) * r * (.5 + rnd()), y + Math.sin(a) * r * (.5 + rnd())); } g.fill(); }
        for (let x = 0; x < w; x += 8) { g.fillRect(x, h - rnd() * 34, 6, 40); } g.globalCompositeOperation = 'source-over';
      });
    }
    function rustTexture() { return texCanvas(128, 128, (g, w, h) => { g.fillStyle = '#4a2c20'; g.fillRect(0, 0, w, h); for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(' + (110 + rnd() * 70 | 0) + ',' + (50 + rnd() * 30 | 0) + ',20,' + (.1 + rnd() * .3).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 2 + rnd() * 12, 0, 7); g.fill(); } }); }
    function paintTexture() { return texCanvas(256, 256, (g, w, h) => { g.fillStyle = '#9aa294'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(' + (rnd() < .5 ? '60,70,56' : '190,196,180') + ',' + (.08 + rnd() * .25).toFixed(2) + ')'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 3 + rnd() * 20, 0, 7); g.fill(); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(70,40,24,.5)'; g.beginPath(); g.arc(rnd() * w, rnd() * h, 2 + rnd() * 9, 0, 7); g.fill(); } g.strokeStyle = 'rgba(20,24,20,.5)'; g.lineWidth = 2; for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }); }
    function netTexture() { return texCanvas(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(70,60,40,.95)'; g.lineWidth = 3; for (let i = -h; i < w + h; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } }); }
    const std = (map, rough, metal, col) => new T.MeshStandardMaterial({ map: map || null, color: col || 0xffffff, roughness: rough, metalness: metal || 0 });
    function layer(g, len, wid, bow, y0, h, mat, bevel) {
      const geo = new T.ExtrudeGeometry(hullShape(len, wid, bow), { depth: h, bevelEnabled: !!bevel, bevelThickness: .12, bevelSize: .12, bevelSegments: 2, curveSegments: 14 }); geo.rotateX(-Math.PI / 2);
      const m = new T.Mesh(geo, mat); m.position.y = y0; g.add(m); return m;
    }
    function buildBoat() {   // el barco es un modelo de Blockbench (modelos/abismo/barco.bbmodel); si no carga se usa la versión hecha por código
      const inst = window.CF_BBM && CF_BBM.make('barco', .1); if (!inst) return buildBoatProc();
      const g = new T.Group(); g.visible = false; scene.add(g); M.boat = g; M.bb = inst; inst.root.position.set(-.9, DECK - .64, 0); g.add(inst.root);
      M.light = new T.PointLight(0x66ffb0, 1.0, 26, 1.6); M.light.position.set(0, 3.5, 0); g.add(M.light);
      M.mist = []; for (let i = 0; i < 9; i++) { const q = glowSprite(0x8fb0a8, 8 + rnd() * 6, .6); q.material.opacity = .16; q.position.set((rnd() - .5) * 15, .6 + rnd() * 1.5, (rnd() - .5) * 6); g.add(q); M.mist.push(q); q.userData.ph = rnd() * 6; }
      const wake = new T.Mesh(new T.RingGeometry(2.6, 6.6, 28), bm(0xcfe8e4, .3, true)); wake.rotation.x = -Math.PI / 2; wake.scale.set(2.1, 1, .8); wake.position.set(0, -.18, 0); g.add(wake); M.wake = wake;
      const lc = document.createElement('canvas'); lc.width = 640; lc.height = 110; M.lc = lc; M.lg = lc.getContext('2d'); M.lt = new T.CanvasTexture(lc);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: M.lt, transparent: true, depthWrite: false, fog: false })); sp.scale.set(12.5, 2.15, 1); sp.position.set(0, 13.4, 0); g.add(sp); M.sprite = sp; M.flag = null; M.sail = null; M.sailBase = null; M.lamps = null; M.fig = null;
    }
    function buildBoatProc() {
      const g = new T.Group(); g.visible = false; scene.add(g); M.boat = g; M.bb = null;
      const wd = woodTexture('#4a3626', true, 9), wd2 = woodTexture('#5a4430', false, 7), deckT = woodTexture('#6a5238', false, 11); wd.repeat.set(.18, 1); wd2.repeat.set(1, 1); deckT.repeat.set(.12, .12);
      const hullM = std(wd, .96), deckM = std(deckT, .97), wood = std(wd2, .95), rust = std(rustTexture(), .78, .5), paint = std(paintTexture(), .9), dark = std(null, .9, .2, 0x1a1c20), rope = std(null, 1, 0, 0x8a7a52);
      const sailM = new T.MeshStandardMaterial({ map: sailTexture(), transparent: true, alphaTest: .5, side: T.DoubleSide, roughness: 1 });
      const glowG = new T.MeshBasicMaterial({ color: 0x66ffb0, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false });
      layer(g, 13.4, 3.4, 4.4, -1.9, .95, hullM, true); layer(g, 15.2, 5.0, 4.8, -.95, 1.0, hullM, true); layer(g, 15.6, 5.3, 5.0, .02, .2, wood, true); layer(g, 14.6, 4.7, 4.5, .2, .13, deckM, false);
      // casco: tablones, bandas de hierro, hierros oxidados y mella
      for (const sd of [-1, 1]) { for (let i = 0; i < 6; i++) mkbox(g, .16, 1.5, .2, rust, -6.4 + i * 2.5, -.4, sd * 2.62); mkbox(g, 14.2, .13, .1, rust, -.4, -.05, sd * 2.66); mkbox(g, 13, .1, .09, rust, -.3, -.7, sd * 2.58); }
      // borda con tablas rotas y cuerdas
      for (const sd of [-1, 1]) { let x = -7; while (x < 3.8) { const len = 1.2 + rnd() * 1.6, hh = .5 + rnd() * .35; if (rnd() < .78) mkbox(g, len, hh, .13, wood, x + len / 2, .62 + hh / 2, sd * 2.4, 0, 0, (rnd() - .5) * .08); x += len + (rnd() < .3 ? .6 : .06); } for (let x2 = -6.6; x2 <= 3.8; x2 += 2.1) mkbox(g, .16, 1.15, .16, wood, x2, .9, sd * 2.4, 0, 0, (rnd() - .5) * .12); }
      mkbox(g, .15, .15, 3.4, wood, 4.2, 1.1, 1.8, 0, .5, 0); mkbox(g, .15, .15, 3.4, wood, 4.2, 1.1, -1.8, 0, -.5, 0);
      // cabina: pintura descascarada, ventanas rotas con luz verdosa, puerta torcida
      mkbox(g, 4.2, 2.6, 3.6, paint, -4.6, 1.65, 0); mkbox(g, 4.6, .3, 4.0, wood, -4.6, 3.1, 0); mkbox(g, 3.2, 1.5, 2.8, paint, -4.6, 3.95, 0); mkbox(g, 3.6, .25, 3.2, wood, -4.6, 4.8, 0, 0, 0, .04);
      for (const sd of [-1, 1]) { for (const wx of [-5.5, -3.7]) { mkbox(g, 1.1, .8, .08, glowG, wx, 1.95, sd * 1.82); mkbox(g, 1.3, .06, .12, dark, wx, 2.38, sd * 1.83); mkbox(g, 1.3, .06, .12, dark, wx, 1.52, sd * 1.83); mkbox(g, .06, .9, .12, dark, wx, 1.95, sd * 1.83); mkbox(g, 1.1, .05, .1, dark, wx, 1.95, sd * 1.84, 0, 0, .6); } mkbox(g, 1.7, .6, .08, glowG, -4.6, 4.05, sd * 1.42); }
      mkbox(g, .08, 1.4, .9, dark, -2.46, 1.5, .3, 0, 0, .06); mkbox(g, .08, .8, 1.1, glowG, -2.46, 1.95, -.7);
      const stack = new T.Mesh(new T.CylinderGeometry(.55, .68, 2.5, 14), rust); stack.position.set(-6.2, 5.5, 0); stack.rotation.z = .06; g.add(stack); const top = new T.Mesh(new T.CylinderGeometry(.7, .62, .32, 14), dark); top.position.set(-6.25, 6.82, 0); g.add(top);
      // mástil partido, vela hecha jirones, cuerdas
      const mast = new T.Mesh(new T.CylinderGeometry(.14, .26, 9, 8), wood); mast.position.set(1.4, 4.9, 0); mast.rotation.z = -.05; g.add(mast); const broken = new T.Mesh(new T.CylinderGeometry(.04, .14, 2.2, 6), wood); broken.position.set(1.15, 9.6, 0); broken.rotation.z = -.55; g.add(broken);
      const yard = new T.Mesh(new T.CylinderGeometry(.09, .11, 6, 6), wood); yard.rotation.x = Math.PI / 2; yard.rotation.z = .04; yard.position.set(1.4, 8.2, 0); g.add(yard);
      const sail = new T.Mesh(new T.PlaneGeometry(5.4, 5.6, 14, 8), sailM); sail.rotation.y = Math.PI / 2; sail.position.set(1.5, 5.3, 0); g.add(sail); M.sail = sail; M.sailBase = sail.geometry.attributes.position.array.slice();
      const sail2 = new T.Mesh(new T.PlaneGeometry(3.2, 2.6, 8, 4), sailM); sail2.rotation.set(0, Math.PI / 2, .2); sail2.position.set(1.5, 9.2, 0); sail2.scale.set(.7, .7, 1); g.add(sail2);
      for (const sd of [-1, 1]) { const r1 = new T.Mesh(new T.CylinderGeometry(.03, .03, 9.6, 4), rope); r1.position.set(.2, 4.4, sd * 1.7); r1.rotation.set(sd * .22, 0, .72); g.add(r1); const r2 = new T.Mesh(new T.CylinderGeometry(.03, .03, 8, 4), rope); r2.position.set(3.6, 4.2, sd * 1.4); r2.rotation.set(sd * .2, 0, -.68); g.add(r2); }
      // figura de proa: calavera con cuernos y cadenas
      { const fh = new T.Group(); fh.position.set(8.2, .4, 0); g.add(fh); const sk = new T.Mesh(new T.SphereGeometry(.62, 14, 10), std(null, .7, 0, 0xd8d2bf)); sk.scale.set(1, 1.1, .95); sk.position.y = .7; fh.add(sk); const jw = mkbox(fh, .7, .3, .55, std(null, .7, 0, 0xcfc9b6), .15, .15, 0); for (const sd of [-1, 1]) { const eye = new T.Mesh(new T.SphereGeometry(.15, 8, 6), glowG); eye.position.set(.46, .78, sd * .24); fh.add(eye); const horn = new T.Mesh(new T.ConeGeometry(.12, 1.1, 6), std(null, .8, 0, 0xcfc9b6)); horn.position.set(0, 1.3, sd * .5); horn.rotation.x = sd * .6; fh.add(horn); } for (let i = 0; i < 4; i++) mkbox(fh, .08, .22, .08, std(null, .7, 0, 0xe9e4d2), .5 + i * .08, .12, -.2 + i * .13); M.fig = fh; }
      for (let i = 0; i < 7; i++) { const lk = new T.Mesh(new T.TorusGeometry(.12, .035, 5, 8), rust); lk.position.set(6.2 + i * .2, .5 - i * .28, 1.6); lk.rotation.y = i % 2 ? 1.57 : 0; g.add(lk); }
      for (let i = 0; i < 9; i++) { const lk = new T.Mesh(new T.TorusGeometry(.12, .035, 5, 8), rust); lk.position.set(-7.5, 1.4 - i * .26, -1.2 + (i % 2) * .05); lk.rotation.y = i % 2 ? 1.57 : 0; g.add(lk); }
      // red de pesca colgando, cajas manchadas, barriles, ancla y esqueleto en el timón
      const net = new T.Mesh(new T.PlaneGeometry(2.6, 1.8), new T.MeshStandardMaterial({ map: netTexture(), transparent: true, alphaTest: .4, side: T.DoubleSide, roughness: 1 })); net.position.set(-1.6, 1.3, 2.46); net.rotation.x = .1; g.add(net);
      for (const [x, z, s] of [[-1.2, 1.5, .9], [-.1, 1.9, .8], [-2.4, -1.9, 1]]) mkbox(g, s, s, s, wood, x, .8, z, 0, rnd() * 2, 0);
      for (const [x, z] of [[-1.7, -1.5], [-1.2, 1.0], [.4, -1.8]]) { const b = new T.Mesh(new T.CylinderGeometry(.38, .4, .85, 10), wood); b.position.set(x, .75, z); g.add(b); const r2 = new T.Mesh(new T.TorusGeometry(.4, .04, 5, 12), rust); r2.rotation.x = Math.PI / 2; r2.position.set(x, .95, z); g.add(r2); }
      const anc = new T.Mesh(new T.TorusGeometry(.38, .09, 6, 14, Math.PI * 1.4), rust); anc.position.set(6.6, 1.05, 0); anc.rotation.set(0, Math.PI / 2, 0); g.add(anc); mkbox(g, .13, 1.4, .13, rust, 6.6, .7, 0);
      { const sk = new T.Group(); sk.position.set(-2.8, .35, 1.0); sk.rotation.y = -.4; g.add(sk); const bone = std(null, .75, 0, 0xdcd6c2); mkbox(sk, .7, .9, .4, std(null, .95, 0, 0x2a2e2a), 0, .8, 0); const head = new T.Mesh(new T.SphereGeometry(.28, 10, 8), bone); head.position.set(0, 1.5, 0); head.rotation.z = .25; sk.add(head); for (const sd of [-1, 1]) { const e = new T.Mesh(new T.SphereGeometry(.07, 6, 5), glowG); e.position.set(.2, 1.55, sd * .1); sk.add(e); mkbox(sk, .1, .8, .1, bone, .15, .75, sd * .45, 0, 0, sd * .5); mkbox(sk, .1, .7, .1, bone, .3, .35, sd * .2, 0, 0, 1.2); } }
      // faroles fantasma, luz verde, niebla y estela
      M.lamps = []; for (const [x, y, z] of [[5.0, 1.3, 1.6], [5.0, 1.3, -1.6], [1.4, 9.0, 0], [-6.9, 2.5, 1.7], [-6.9, 2.5, -1.7]]) { const l = new T.Mesh(new T.SphereGeometry(.26, 10, 8), glowG); l.position.set(x, y, z); g.add(l); const hl = glowSprite(0x66ffb0, 3.2, 0); hl.position.set(x, y, z); g.add(hl); M.lamps.push(hl); }
      M.light = new T.PointLight(0x66ffb0, 1.0, 26, 1.6); M.light.position.set(0, 3.5, 0); g.add(M.light);
      M.mist = []; for (let i = 0; i < 9; i++) { const m = glowSprite(0x8fb0a8, 8 + rnd() * 6, .6); m.material.opacity = .16; m.position.set((rnd() - .5) * 15, .6 + rnd() * 1.5, (rnd() - .5) * 6); g.add(m); M.mist.push(m); m.userData.ph = rnd() * 6; }
      const plaque = texCanvas(512, 96, (c, w, h) => { c.clearRect(0, 0, w, h); c.font = 'bold 66px Georgia,serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(120,26,22,.9)'; c.fillText('S.S. CALAMAR', w / 2, 70); c.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { c.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 14, 2 + rnd() * 5); } });
      for (const sd of [-1, 1]) { const pl = new T.Mesh(new T.PlaneGeometry(5.6, 1.05), new T.MeshBasicMaterial({ map: plaque, transparent: true, depthWrite: false })); pl.position.set(-.8, .1, sd * 2.67); pl.rotation.y = sd > 0 ? 0 : Math.PI; g.add(pl); }
      const wake = new T.Mesh(new T.RingGeometry(2.6, 6.6, 28), bm(0xcfe8e4, .3, true)); wake.rotation.x = -Math.PI / 2; wake.scale.set(2.1, 1, .8); wake.position.set(0, -.18, 0); g.add(wake); M.wake = wake;
      const lc = document.createElement('canvas'); lc.width = 640; lc.height = 110; M.lc = lc; M.lg = lc.getContext('2d'); M.lt = new T.CanvasTexture(lc);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: M.lt, transparent: true, depthWrite: false, fog: false })); sp.scale.set(12.5, 2.15, 1); sp.position.set(0, 13.4, 0); g.add(sp); M.sprite = sp; M.flag = null;
    }
    let glowTexM = null;
    function glowSprite(col, sc, y) {
      if (!glowTexM) { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.4, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTexM = new T.CanvasTexture(c); }
      const s = new T.Sprite(new T.SpriteMaterial({ map: glowTexM, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false, opacity: .8 })); s.scale.set(sc, sc, 1); s.position.y = y; return s;
    }
    function paintBoatLabel(txt, col) {
      if (txt === M.spriteTxt) return; M.spriteTxt = txt; const g = M.lg; g.clearRect(0, 0, 640, 110); g.fillStyle = 'rgba(8,20,34,.78)'; g.fillRect(8, 10, 624, 90); g.strokeStyle = col; g.lineWidth = 4; g.strokeRect(8, 10, 624, 90);
      g.font = 'bold 42px system-ui,Arial'; g.textAlign = 'center'; g.fillStyle = col; g.fillText(txt, 320, 70); M.lt.needsUpdate = true;
    }
    function place() {   // coloca el barco con su posición / giro / balanceo
      const b = M.boat; b.position.set(M.pos.x, M.pos.y, M.pos.z); b.rotation.set(M.pitch, M.yaw, M.roll, 'YXZ');
    }
    const cs = () => Math.cos(M.yaw), sn = () => Math.sin(M.yaw);
    const toLocal = (px, pz, o) => { const dx = px - o.x, dz = pz - o.z, c = Math.cos(o.yaw), s = Math.sin(o.yaw); return { lx: dx * c - dz * s, lz: dx * s + dz * c }; };
    const toWorld = (lx, lz) => { const c = cs(), s = sn(); return { x: M.pos.x + lx * c + lz * s, z: M.pos.z - lx * s + lz * c }; };
    // el casco es sólido: desde fuera solo se sube por la pasarela (hueco de la borda del lado del muelle); a bordo las bordas contienen
    function hullBlock(f) {
      const { lx, lz } = toLocal(f.pos.x, f.pos.z, { x: M.pos.x, z: M.pos.z, yaw: M.yaw }), inRect = Math.abs(lx) < HX + .55 && Math.abs(lz) < HZ + .55;
      if (!inRect || M.aboard.has(f) || f.pos.y > M.pos.y + 1.7) return;
      if (Math.abs(lx) < 1.9 && lz < 0) return;   // la pasarela
      const dl = lx + HX + .55, dr = HX + .55 - lx, dzn = lz + HZ + .55, dzp = HZ + .55 - lz, mn = Math.min(dl, dr, dzn, dzp); let nx = lx, nz = lz;
      if (mn === dl) nx = -HX - .56; else if (mn === dr) nx = HX + .56; else if (mn === dzn) nz = -HZ - .56; else nz = HZ + .56;
      const w = toWorld(nx, nz); f.pos.x = w.x; f.pos.z = w.z; if (f.vel) { f.vel.x *= .3; f.vel.z *= .3; }
    }
    const humans = () => G.fighters.filter(f => f.isPlayer && !f.remote && f.alive && !f.abyss);

    function arrive() {
      if (!M.boat) buildBoat(); M.state = 'arrive'; M.t = 0; M.wait = 150; M.aboard.clear(); M.used = true; M.msgAt = 99;
      M.pos.set(-95, SEA_Y, 250); M.yaw = Math.atan2(158 - 250, 95 - -95) * -1; M.roll = M.pitch = 0; M.boat.visible = true; place();
      if (window.CF_SND) CF_SND.play('horn', null, .8); addFeedText('¡Llega un barco al muelle! Súbete antes de que zarpe', '#ffd54f'); showBanner('BARCO EN CAMINO', '#ffd54f', 'Llegará al muelle y esperará unos minutos'); sfx('whoosh', null, .5);
    }
    function sail(dt, tx, tz, speed, turn) {
      const dx = tx - M.pos.x, dz = tz - M.pos.z, d = Math.hypot(dx, dz) || 1; const want = Math.atan2(-dz, dx); let da = want - M.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); M.yaw += da * Math.min(1, dt * turn);
      const v = Math.min(speed, d * .6 + .8) * dt; M.pos.x += (dx / d) * v; M.pos.z += (dz / d) * v; return d;
    }
    function camScript(f) {
      let ang = Math.atan2(M.pos.z - VZC, M.pos.x - VXC) + .9, t0 = 0; const lookAt = new V3();
      G.camScript = { fn(dt) {
        t0 += dt; ang += dt * .32; const k = t0 / 11, dist = k < .55 ? 15 + k * 28 : 30 - (k - .55) * 40, h = k < .55 ? 5 + k * 20 : 16 - (k - .55) * 26;
        lookAt.set(M.pos.x, M.pos.y + 2, M.pos.z); camera.position.set(M.pos.x + Math.cos(ang) * Math.max(8, dist), M.pos.y + Math.max(2.5, h), M.pos.z + Math.sin(ang) * Math.max(8, dist)); camera.up.set(0, 1, 0); camera.lookAt(lookAt); camera.rotateZ(Math.sin(t0 * 2.4) * .03 * Math.min(1, k * 3)); return true;
      }, cleanup() { } };
    }
    function startSink() {
      M.state = 'sink'; M.sinkT = 0; const dx = M.pos.x - VXC, dz = M.pos.z - VZC; M.sinkAng = Math.atan2(dz, dx); M.sinkR = Math.hypot(dx, dz); M.sinkYaw0 = M.yaw;
      for (const [f, o] of M.aboard) { f.boatSink = true; o.lx0 = o.lx; o.lz0 = o.lz; }
      const me = G.player; if (me && M.aboard.has(me)) { camScript(me); showBanner('¡LA CORRIENTE!', '#7df9ff', 'El torbellino atrapa el barco…'); }
      sfx('rush', null, 1); G.shake = Math.max(G.shake, .6); if (window.CF_SND) { CF_SND.play('creak', null, 1); CF_SND.play('roarShort', null, .6); }
    }
    function sinkStep(dt) {
      M.sinkT += dt; const u = M.sinkT / 11, e = u * u;
      M.sinkR = Math.max(2, M.sinkR * Math.exp(-dt * (.12 + u * .55))); M.sinkAng += dt * (.35 + e * 3.4);
      M.pos.x = VXC + Math.cos(M.sinkAng) * M.sinkR; M.pos.z = VZC + Math.sin(M.sinkAng) * M.sinkR;
      M.yaw = -(M.sinkAng + Math.PI / 2) + Math.PI; const surf = -26 * Math.pow(Math.max(0, 1 - M.sinkR / 54), 2.4); M.pos.y = SEA_Y + surf * .9;
      M.roll = Math.min(.95, u * 1.3) * Math.sin(M.sinkAng * 0 + 1); M.pitch = -Math.min(.7, e * 1.2);
      G.shake = Math.max(G.shake, .25 + e * 1.2);
      if (Math.random() < dt * 40) emit(M.pos.x + rand(-5, 5), SEA_Y + .2, M.pos.z + rand(-5, 5), rand(-3, 3), rand(2, 7), rand(-3, 3), '#dff6ff', .3, 1, -.2, 1);
      if (M.sinkT > 1.5 && M.sinkT < 1.6) sfx('crash', M.pos, .8); if (M.sinkT > 6 && M.sinkT < 6.1) { showBanner('¡EL BARCO SE HUNDE!', '#ff8fb0', 'Agárrate…'); sfx('boom', M.pos, .9); }
      if (M.sinkT >= 10 && M.state === 'sink') {
        screenFlash(1); G.slowT = Math.max(G.slowT, .6);
        const list = [...M.aboard.keys()]; M.aboard.clear(); M.boat.visible = false; M.state = 'off';
        if (G.camScript) { const s = G.camScript; G.camScript = null; if (s.cleanup) s.cleanup(); }
        for (const f of list) { f.boatSink = false; f.pos.y = SEA_Y - .5; if (window.CF_ABISMO) CF_ABISMO.enter(f); }
      }
    }
    function boatUpdate(dt, t) {
      const ev = SEA.ev.squid > 0;
      if (ev && !M.prevSquid && !M.used && M.state === 'off') arrive();
      if (!ev && M.prevSquid) M.used = false;
      M.prevSquid = ev ? 1 : 0;
      if (!M.boat || M.state === 'off') return;
      const prev = { x: M.pos.x, z: M.pos.z, yaw: M.yaw };
      M.t += dt; M.snT = (M.snT || 0) - dt; if (M.snT <= 0 && M.boat.visible && window.CF_SND) { M.snT = 4 + Math.random() * 4; CF_SND.play(Math.random() < .6 ? 'creak' : 'drip', M.pos, .5, 90); }
      if (M.state !== 'sink') { M.pos.y = SEA_Y + Math.sin(t * 1.5) * .07; M.roll = Math.sin(t * 1.1) * .018 + .045; M.pitch = Math.cos(t * 1.3) * .012; }
      if (M.state === 'arrive') {
        const d = sail(dt, BERTH.x, BERTH.z, 9, 1.4); const near = Math.min(1, d / 22); if (d < 24) { M.yaw += (0 - M.yaw) * Math.min(1, dt * 2.2 * (1 - near)); }
        if (d < .35) { M.state = 'dock'; M.pos.x = BERTH.x; M.pos.z = BERTH.z; M.yaw = 0; sfx('rush', M.pos, .5); showBanner('EL BARCO ESTÁ EN EL MUELLE', '#ffd54f', 'Sube a bordo · zarpa en ' + fmt(M.wait)); }
      } else if (M.state === 'dock') {
        M.wait -= dt; const hs = humans(), on = hs.filter(f => M.aboard.has(f));
        if (on.length && hs.length === on.length && M.wait > 10 && M.t > 25) { M.wait = 10; addFeedText('Todos a bordo: el barco zarpa en 10 s', '#ffd54f'); }
        for (const k of [60, 30, 10]) if (M.wait < k && M.msgAt > k && G.player && !G.player.abyss) { addFeedText('El barco zarpa en ' + k + ' s' + (on.length ? '' : ' · ¡súbete!'), '#ffd54f'); sfx('whoosh', M.pos, .4); }
        M.msgAt = M.wait;
        if (!ev && M.wait > 8) M.wait = 8;
        if (M.wait <= 0) { if (M.aboard.size) { M.state = 'sail'; M.t = 0; addFeedText('¡El barco zarpa hacia el mar profundo!', '#ffd54f'); showBanner('¡ZARPAMOS!', '#7df9ff', 'El mar está inquieto…'); sfx('rush', M.pos, .9); if (window.CF_SND) CF_SND.play('horn', M.pos, 1, 200); } else { M.state = 'leave'; addFeedText('El barco se fue sin pasajeros', '#9aa0b8'); } }
      } else if (M.state === 'sail') {
        const d = Math.hypot(M.pos.x - VXC, M.pos.z - VZC); const ang = Math.atan2(M.pos.z - VZC, M.pos.x - VXC);
        sail(dt, VXC + Math.cos(ang) * 30, VZC + Math.sin(ang) * 30, 4.6, .8);
        M.roll += Math.sin(t * 2) * .01 * Math.min(1, (130 - Math.min(130, d)) / 80);
        if (d < VRC + 16) startSink();
      } else if (M.state === 'leave') {
        const d = sail(dt, -120, 290, 7, 1.2); if (d < 3 || M.t > 60) { M.state = 'off'; M.boat.visible = false; }
      } else if (M.state === 'sink') sinkStep(dt);
      // pasajeros
      const st = M.state, carry = st === 'dock' || st === 'sail' || st === 'sink' || st === 'arrive';
      if (carry) for (const f of new Set([...humans(), ...M.aboard.keys()])) {
        if (!f.alive || f.abyss) { M.aboard.delete(f); f.boatSink = false; continue; }
        const o = M.aboard.get(f);
        if (o) {   // ya está a bordo: lo llevamos con el barco
          let { lx, lz } = st === 'sink' ? { lx: o.lx0, lz: o.lz0 } : toLocal(f.pos.x, f.pos.z, prev);
          if (st !== 'dock') { lx = clamp(lx, -HX + .6, HX - .6); lz = clamp(lz, -HZ + .5, HZ - .5); }
          else { lx = clamp(lx, -HX + .5, HX - .5); const gap = Math.abs(lx) < 1.7; lz = clamp(lz, gap ? -HZ - 1.4 : -2.2, 2.2); }
          if (st === 'dock' && lz < -HZ - .2) { M.aboard.delete(f); continue; }
          { const CB = M.bb ? [-7.3, -3.3, 1.95, .5, [[-2.3, 1.4, .6], [-1.3, -1.6, .6], [-.3, 1.4, .6], [-4.3, -1.8, .6], [2.1, 1.6, .6], [-1.1, 1.0, .5], [-2.3, -.8, .5]]] : [-6.9, -2.4, 2.0, 1.4, [[-1.7, -1.5, .6], [-1.2, 1.0, .6], [.4, -1.8, .6], [-1.2, 1.5, .7], [-.1, 1.9, .7], [-2.4, -1.9, .75]]];
            if (lx > CB[0] && lx < CB[1] && Math.abs(lz) < CB[2]) { const dl = lx - CB[0], dr = CB[1] - lx, dz = CB[2] - Math.abs(lz), mn = Math.min(dl, dr, dz); if (mn === dr) lx = CB[1]; else if (mn === dl) lx = CB[0]; else lz = (lz < 0 ? -1 : 1) * CB[2]; }
            const mdx = lx - CB[3], md = Math.hypot(mdx, lz); if (md < .6) { const k = .6 / (md || 1); lx = CB[3] + (md ? mdx * k : .6); lz = md ? lz * k : 0; }
            for (const [cx, cz, r] of CB[4]) { const dx = lx - cx, dz2 = lz - cz, d = Math.hypot(dx, dz2); if (d < r && d > .001) { lx = cx + dx / d * r; lz = cz + dz2 / d * r; } } }
          o.lx = lx; o.lz = lz; const w = toWorld(lx, lz); f.pos.x = w.x; f.pos.z = w.z;
          if (st === 'sink') { const c = M.boat; const p = c.localToWorld(new V3(lx, DECK, lz)); f.pos.set(p.x, p.y, p.z); f.vel.set(0, 0, 0); f.onGround = true; }
          else { const dy = M.pos.y + DECK; if (f.vel.y <= .2 && f.pos.y <= dy + .12) { f.pos.y = dy; f.vel.y = Math.min(0, f.vel.y); f.onGround = true; } }
        } else if (st === 'dock' || st === 'arrive') {   // ¿se acaba de subir?
          const { lx, lz } = toLocal(f.pos.x, f.pos.z, M.pos && { x: M.pos.x, z: M.pos.z, yaw: M.yaw });
          if (Math.abs(lx) < HX && Math.abs(lz) < HZ && f.pos.y < M.pos.y + 1.6 && f.pos.y > -2.2) { M.aboard.set(f, { lx, lz }); if (f.isPlayer) { popText(chestOf(f), 'A bordo', '#ffd54f', 16); sfx('whoosh', f.pos, .4); } }
        }
      }
      if (M.bb && M.boat.visible) M.bb.update('idle', t, dt);
      if (M.boat.visible) for (const f of G.fighters) if (!f.remote && f.alive && !f.abyss) hullBlock(f);
      place();
      if (M.sprite) { const nA = M.aboard.size; const txt = st === 'dock' ? 'ZARPA EN ' + fmt(M.wait) + ' · A BORDO: ' + nA : st === 'sail' ? 'RUMBO AL MAR PROFUNDO' : st === 'sink' ? '¡LA CORRIENTE!' : st === 'arrive' ? 'LLEGANDO…' : 'SE VA…'; paintBoatLabel(txt, st === 'sink' ? '#ff8fb0' : '#ffd54f'); M.sprite.visible = st !== 'sink' || M.sinkT < 5; }
      if (M.sailBase && M.sail.visible !== false) { const pos = M.sail.geometry.attributes.position, ar = pos.array; for (let i = 0; i < pos.count; i++) { const x = M.sailBase[i * 3], y = M.sailBase[i * 3 + 1]; ar[i * 3 + 2] = Math.sin(t * 1.7 + x * 1.2 + y * .8) * .22 * (.6 + (y + 2.8) / 5.6 * .8); } pos.needsUpdate = true; }
      if (M.lamps) M.lamps.forEach((l, i) => { l.material.opacity = .55 + Math.sin(t * 3 + i * 1.7) * .25 - (Math.random() < .02 ? .3 : 0); }); if (M.light) M.light.intensity = .8 + Math.sin(t * 5) * .2; if (M.mist) M.mist.forEach(m => { m.position.x += Math.sin(t * .4 + m.userData.ph) * .004; }); if (M.fig) M.fig.rotation.z = Math.sin(t * 1.3) * .04; if (M.flag) M.flag.rotation.z = Math.sin(t * 6) * .25; if (M.wake) M.wake.material.opacity = (st === 'sail' || st === 'arrive' || st === 'leave' ? .32 : .12) + Math.sin(t * 3) * .04;
    }

    function update(dt, t, cp) {
      if (!M.built) { if (G.state !== 'play') return; M.built = true; try { buildPier(); buildBoard(); } catch (e) { console.error(e); } }
      boatUpdate(dt, t);
      M.signT -= dt; if (M.signT <= 0 && M.bg) { M.signT = 1; if (Math.hypot(cp.x - 8, cp.z - 82) < 140) paintBoard(); }
    }
    window.CF_MUELLE = { update, arrive, get state() { return M.state; }, get boat() { return M.boat; }, get aboard() { return M.aboard.size; }, skip(s) { M.wait = Math.min(M.wait, s || 3); }, paint: paintBoard };
  }
});
