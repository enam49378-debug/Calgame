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
    const BERTH = { x: 0, z: 158.4 }, HX = 7.4, HZ = 2.9, DECK = .35;
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
    function buildPier() {
      const g = new T.Group(); scene.add(g); M.pier = g;
      const pc = woodTex(256, 256, '#8c6a42', 32), tex = new T.CanvasTexture(pc); tex.wrapS = tex.wrapT = T.RepeatWrapping;
      const deckM = new T.MeshLambertMaterial({ map: tex }), dark = lm('#4d3622'), rope = lm('#cdb88a');
      const deck = (x, z, w, d) => { const t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(w / 4, d / 4); const m = new T.Mesh(new T.BoxGeometry(w, .26, d), new T.MeshLambertMaterial({ map: t2 })); m.position.set(x, -.07, z); m.receiveShadow = true; g.add(m); COL.push({ x, z, hx: w / 2, hz: d / 2, h: .06, y0: 0, ceiling: false }); };
      deck(0, 132.8, 4.7, 29.8);                // alargue del muelle (de z=118 a z=147.7)
      deck(0, 151, 24, 8);                      // cabecera en T
      for (const px of [-2.2, 2.2]) for (let z = 120; z <= 146; z += 6) mkbox(g, .5, 5, .5, dark, px, -2.4, z);
      for (const px of [-11, -4, 4, 11]) for (const pz of [148, 154]) mkbox(g, .6, 5.5, .6, dark, px, -2.6, pz);
      for (const sd of [-1, 1]) { for (let z = 119; z <= 146; z += 3.4) mkbox(g, .16, 1.05, .16, dark, sd * 2.3, .6, z); mkbox(g, .1, .1, 28.5, rope, sd * 2.3, 1.05, 133); mkbox(g, .1, .1, 28.5, rope, sd * 2.3, .6, 133); }
      for (const sd of [-1, 1]) { for (let x = 2.4; x <= 11.6; x += 3.1) mkbox(g, .16, 1.05, .16, dark, sd * x, .6, 147.2); mkbox(g, 9.4, .1, .1, rope, sd * 7, 1.05, 147.2); }
      for (let x = -11.5; x <= 11.5; x += 3.8) mkbox(g, .16, 1.05, .16, dark, x, .6, 155.1);
      mkbox(g, 23.5, .1, .1, rope, 0, 1.05, 155.1);
      for (const [x, z] of [[-2.1, 124], [2.1, 137], [-2.1, 142], [-9, 151.4], [9, 151.4], [-4, 153.2], [4, 153.2]]) {   // farolas
        mkbox(g, .22, 4.4, .22, dark, x, 2.1, z); const lamp = new T.Mesh(new T.SphereGeometry(.34, 10, 8), bm(0xffe8a0, .95, true)); lamp.position.set(x, 4.5, z); g.add(lamp); const hl = new T.Mesh(new T.SphereGeometry(.9, 10, 8), bm(0xffd070, .18, true)); hl.position.copy(lamp.position); g.add(hl);
      }
      const crate = lm('#9a7a4a'), band = lm('#5c4328');
      for (const [x, z, s, ry] of [[-9.6, 149, 1.2, .3], [-8.2, 149.4, 1, 1.1], [-9, 149.2, .9, .2], [9.4, 152.4, 1.3, .6], [10.8, 151, 1, 0]]) { const c = mkbox(g, s, s, s, crate, x, s / 2 + .06, z, 0, ry, 0); mkbox(g, s + .04, .12, s + .04, band, x, s / 2 + .06, z, 0, ry, 0); }
      for (const [x, z] of [[8.4, 149.2], [-10.4, 152.6], [2.2, 126]]) { const b = new T.Mesh(new T.CylinderGeometry(.5, .5, 1.1, 12), lm('#5a3d24')); b.position.set(x, .62, z); g.add(b); const r2 = new T.Mesh(new T.TorusGeometry(.5, .05, 6, 14), lm('#2b2b2b')); r2.rotation.x = Math.PI / 2; r2.position.set(x, .62, z); g.add(r2); }
      for (const x of [-10, 10]) { const bl = new T.Mesh(new T.CylinderGeometry(.22, .3, .6, 10), lm('#2d3640')); bl.position.set(x, .35, 154.2); g.add(bl); }
      const nm = label('MUELLE DEL ABISMO', 768, 128, 'bold 74px system-ui,Arial', '#ffe9b0', '#ff9a4a'); nm.scale.set(15, 2.5, 1); nm.position.set(0, 7.2, 147.3); g.add(nm);
    }

    // ---------------------------------------------------------------- el tablón de eventos (madera + papeles)
    const EV_ROWS = [['school', '🐟', 'Cardumen gigante'], ['frenzy', '🦈', 'Frenesí de tiburones'], ['glow', '✨', 'Marea luminosa'], ['squid', '🦑', 'Calamar gigante']];
    function buildBoard() {
      const g = new T.Group(); g.position.set(8.4, 0, 81.6); g.rotation.y = Math.PI; scene.add(g); M.board = g;   // mira hacia la ciudad
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
      cells.push({ ico: '⛵', n: 'Barco al abismo', on: bs === 'dock' || bs === 'sail' || bs === 'arrive', txt: bs === 'dock' ? 'Zarpa en ' + fmt(M.wait) : bs === 'arrive' ? 'Llegando…' : bs === 'sail' || bs === 'sink' ? 'En ruta' : sq ? 'Ya se fue' : 'Llega con el Calamar' });
      const noK = SEA.noKraken && !(typeof NETPUB === 'function' && NETPUB());
      cells.push({ ico: '⏳', n: 'Próximo evento', on: false, txt: SEA.eventsAuto === false ? 'Desactivados' : fmt(SEA.evTimer), hi: true });
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
    function buildBoat() {
      const g = new T.Group(); g.visible = false; scene.add(g); M.boat = g;
      const hull = lm('#b0603a'), hull2 = lm('#6a4428'), deck = lm('#d2aa72'), white = lm('#e8e2d2'), red = lm('#b3261e');
      mkbox(g, 15, 1.7, 5.4, hull, 0, -.5, 0); mkbox(g, 15.2, .35, 5.6, red, 0, -.05, 0); mkbox(g, 14.6, .12, 5.0, deck, 0, .29, 0);
      const bow = new T.Mesh(new T.ConeGeometry(2.7, 4.4, 4), hull); bow.rotation.set(0, Math.PI / 4, -Math.PI / 2); bow.scale.set(1, 1, .72); bow.position.set(9.6, -.5, 0); g.add(bow);
      const bow2 = new T.Mesh(new T.ConeGeometry(2.7, 4.4, 4), deck); bow2.rotation.set(0, Math.PI / 4, -Math.PI / 2); bow2.scale.set(.96, 1, .7); bow2.position.set(9.6, .35, 0); bow2.scale.y = .02; g.add(bow2);
      for (const sd of [-1, 1]) { mkbox(g, 14.6, .12, .14, hull2, -.2, 1.2, sd * 2.7); mkbox(g, 14.6, .12, .14, hull2, -.2, .75, sd * 2.7); for (let x = -7; x <= 7; x += 2.3) mkbox(g, .14, 1, .14, hull2, x, .8, sd * 2.7); }
      mkbox(g, 3.8, 2.8, 3.8, white, -4.4, 1.75, 0); mkbox(g, 4.2, .35, 4.2, red, -4.4, 3.3, 0);
      for (const sd of [-1, 1]) mkbox(g, 1.4, .8, .1, bm(0xffe8a0, .95, true), -4.4, 1.9, sd * 1.95);
      mkbox(g, .1, .8, 1.4, bm(0xffe8a0, .95, true), -2.52, 1.9, 0);
      mkbox(g, .35, 10, .35, hull2, 1.6, 5.2, 0); mkbox(g, .22, .22, 5, hull2, 1.6, 8.6, 0);
      const sail = new T.Mesh(new T.PlaneGeometry(4.4, 6.2), new T.MeshLambertMaterial({ color: 0xece4cf, side: T.DoubleSide })); sail.rotation.y = Math.PI / 2; sail.position.set(1.6, 5.4, 0); g.add(sail); M.sail = sail;
      const lan = new T.Mesh(new T.SphereGeometry(.3, 10, 8), bm(0xff9a4a, .95, true)); lan.position.set(8.4, 1.6, 0); g.add(lan);
      const nm = label('SS. CALAMAR', 512, 96, 'bold 56px system-ui,Arial', '#fff', '#000'); nm.scale.set(6, 1.1, 1); nm.position.set(-4.4, 4.9, 0); g.add(nm);
      const lc = document.createElement('canvas'); lc.width = 640; lc.height = 110; M.lc = lc; M.lg = lc.getContext('2d'); M.lt = new T.CanvasTexture(lc);
      const sp = new T.Sprite(new T.SpriteMaterial({ map: M.lt, transparent: true, depthWrite: false, fog: false })); sp.scale.set(12.5, 2.15, 1); sp.position.set(0, 11.5, 0); g.add(sp); M.sprite = sp;
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
    const humans = () => G.fighters.filter(f => f.isPlayer && !f.remote && f.alive && !f.abyss);

    function arrive() {
      if (!M.boat) buildBoat(); M.state = 'arrive'; M.t = 0; M.wait = 150; M.aboard.clear(); M.used = true; M.msgAt = 99;
      M.pos.set(-95, SEA_Y, 250); M.yaw = Math.atan2(158 - 250, 95 - -95) * -1; M.roll = M.pitch = 0; M.boat.visible = true; place();
      addFeedText('⛵ ¡Llega un barco al muelle! Súbete antes de que zarpe', '#ffd54f'); showBanner('⛵ BARCO EN CAMINO', '#ffd54f', 'Llegará al muelle y esperará unos minutos'); sfx('whoosh', null, .5);
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
      sfx('rush', null, 1); G.shake = Math.max(G.shake, .6);
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
      M.t += dt;
      if (M.state !== 'sink') { M.pos.y = SEA_Y + Math.sin(t * 1.5) * .07; M.roll = Math.sin(t * 1.1) * .018; M.pitch = Math.cos(t * 1.3) * .012; }
      if (M.state === 'arrive') {
        const d = sail(dt, BERTH.x, BERTH.z, 9, 1.4); const near = Math.min(1, d / 22); if (d < 24) { M.yaw += (0 - M.yaw) * Math.min(1, dt * 2.2 * (1 - near)); }
        if (d < .35) { M.state = 'dock'; M.pos.x = BERTH.x; M.pos.z = BERTH.z; M.yaw = 0; sfx('rush', M.pos, .5); showBanner('⛵ EL BARCO ESTÁ EN EL MUELLE', '#ffd54f', 'Sube a bordo · zarpa en ' + fmt(M.wait)); }
      } else if (M.state === 'dock') {
        M.wait -= dt; const hs = humans(), on = hs.filter(f => M.aboard.has(f));
        if (on.length && hs.length === on.length && M.wait > 10 && M.t > 25) { M.wait = 10; addFeedText('⛵ Todos a bordo: el barco zarpa en 10 s', '#ffd54f'); }
        for (const k of [60, 30, 10]) if (M.wait < k && M.msgAt > k && G.player && !G.player.abyss) { addFeedText('⛵ El barco zarpa en ' + k + ' s' + (on.length ? '' : ' · ¡súbete!'), '#ffd54f'); sfx('whoosh', M.pos, .4); }
        M.msgAt = M.wait;
        if (!ev && M.wait > 8) M.wait = 8;
        if (M.wait <= 0) { if (M.aboard.size) { M.state = 'sail'; M.t = 0; addFeedText('⛵ ¡El barco zarpa hacia el mar profundo!', '#ffd54f'); showBanner('⛵ ¡ZARPAMOS!', '#7df9ff', 'El mar está inquieto…'); sfx('rush', M.pos, .9); } else { M.state = 'leave'; addFeedText('⛵ El barco se fue sin pasajeros', '#9aa0b8'); } }
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
          else if (Math.abs(lx) > HX + .6 || Math.abs(lz) > HZ + .6) { M.aboard.delete(f); continue; }
          o.lx = lx; o.lz = lz; const w = toWorld(lx, lz); f.pos.x = w.x; f.pos.z = w.z;
          if (st === 'sink') { const c = M.boat; const p = c.localToWorld(new V3(lx, DECK, lz)); f.pos.set(p.x, p.y, p.z); f.vel.set(0, 0, 0); f.onGround = true; }
          else { const dy = M.pos.y + DECK; if (f.vel.y <= .2 && f.pos.y <= dy + .12) { f.pos.y = dy; f.vel.y = Math.min(0, f.vel.y); f.onGround = true; } }
        } else if (st === 'dock' || st === 'arrive') {   // ¿se acaba de subir?
          const { lx, lz } = toLocal(f.pos.x, f.pos.z, M.pos && { x: M.pos.x, z: M.pos.z, yaw: M.yaw });
          if (Math.abs(lx) < HX && Math.abs(lz) < HZ && f.pos.y < M.pos.y + 1.6 && f.pos.y > -2.2) { M.aboard.set(f, { lx, lz }); if (f.isPlayer) { popText(chestOf(f), '⛵ A bordo', '#ffd54f', 16); sfx('whoosh', f.pos, .4); } }
        }
      }
      place();
      if (M.sprite) { const nA = M.aboard.size; const txt = st === 'dock' ? 'ZARPA EN ' + fmt(M.wait) + ' · A BORDO: ' + nA : st === 'sail' ? 'RUMBO AL MAR PROFUNDO' : st === 'sink' ? '¡LA CORRIENTE!' : st === 'arrive' ? 'LLEGANDO…' : 'SE VA…'; paintBoatLabel(txt, st === 'sink' ? '#ff8fb0' : '#ffd54f'); M.sprite.visible = st !== 'sink' || M.sinkT < 5; }
      if (M.sail) M.sail.rotation.z = Math.sin(t * 1.3) * .03;
    }

    function update(dt, t, cp) {
      if (!M.built) { if (G.state !== 'play') return; M.built = true; try { buildPier(); buildBoard(); } catch (e) { console.error(e); } }
      boatUpdate(dt, t);
      M.signT -= dt; if (M.signT <= 0 && M.bg) { M.signT = 1; if (Math.hypot(cp.x - 8, cp.z - 82) < 140) paintBoard(); }
    }
    window.CF_MUELLE = { update, arrive, get state() { return M.state; }, get boat() { return M.boat; }, get aboard() { return M.aboard.size; }, skip(s) { M.wait = Math.min(M.wait, s || 3); }, paint: paintBoard };
  }
});
