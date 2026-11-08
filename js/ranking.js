/* ===== CARTELES DE KILLS MUNDIALES (en la ciudad) =====
   Dos tablas gigantes: TOP DEL MES y TOP HISTÓRICO, con los jugadores de TODO EL MUNDO (no de tu partida) que más kills tienen.
   - Cuentan solo las kills en SALAS PÚBLICAS contra otros jugadores (las mismas que desbloquean emotes y cosméticos): no cuentan salas privadas, jugar solo, bots ni dummies.
   - Los datos viven en Firestore (colecciones cf_lba = histórico, cf_lbm/<AAAAMM>/p = mensual). Cada jugador solo puede escribir SU propia fila
     y solo puede subir de a pocas kills por vez (reglas en firestore.rules): hay que publicar las reglas para que funcione.
   - Hace falta una cuenta con el correo verificado para sumar kills; ver las tablas no requiere cuenta.
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const T = THREE, MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
    const monthId = () => { const d = new Date(); return d.getUTCFullYear() * 100 + d.getUTCMonth() + 1; };
    const R = { rows: { m: null, a: null }, state: 'idle', err: '', tex: {}, ctx: {}, cv: {}, root: null, at: 0, pending: Math.max(0, rd('bsb_rank_pending', 0) | 0), flushAt: 0, lastFlush: 0, mine: { m: 0, a: 0 } };

    // ---------------------------------------------------------------- dibujo de los carteles
    function draw(which) {
      const c = R.cv[which], g = R.ctx[which], W = c.width, H = c.height, month = which === 'm';
      const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, month ? '#14204a' : '#2a1646'); grd.addColorStop(1, '#070a1a'); g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.strokeStyle = month ? '#39e6ff' : '#ffd54f'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
      g.textAlign = 'center'; g.fillStyle = '#ffffff'; g.font = 'bold 66px system-ui,Arial'; g.fillText(month ? 'TOP DEL MES' : 'TOP HISTÓRICO', W / 2, 92);
      g.font = 'bold 30px system-ui,Arial'; g.fillStyle = month ? '#7df9ff' : '#ffe08a'; g.fillText(month ? MESES[new Date().getUTCMonth()] + ' ' + new Date().getUTCFullYear() + ' · MUNDIAL' : 'DE TODOS LOS TIEMPOS · MUNDIAL', W / 2, 134);
      g.font = '22px system-ui,Arial'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('Kills en salas públicas contra otros jugadores', W / 2, 166);
      const rows = R.rows[which];
      if (!rows) { g.font = 'bold 40px system-ui,Arial'; g.fillStyle = '#fff'; g.fillText(R.state === 'error' ? 'Sin conexión con el ranking' : 'Cargando…', W / 2, H / 2 + 40); g.font = '22px system-ui,Arial'; g.fillStyle = 'rgba(255,255,255,.6)'; if (R.state === 'error') g.fillText(R.err.slice(0, 60), W / 2, H / 2 + 80); }
      else if (!rows.length) { g.font = 'bold 38px system-ui,Arial'; g.fillStyle = '#fff'; g.fillText('Aún no hay nadie: ¡sé el primero!', W / 2, H / 2 + 40); }
      else rows.slice(0, 10).forEach((r, i) => {
        const y = 222 + i * 52, col = i === 0 ? '#ffd54f' : i === 1 ? '#d9dee6' : i === 2 ? '#ff9a4a' : '#9fb4ff', me = ACCT.user && r.uid === ACCT.user.uid;
        g.fillStyle = me ? 'rgba(255,213,79,.18)' : (i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.08)'); g.fillRect(34, y - 36, W - 68, 46);
        g.textAlign = 'left'; g.font = 'bold 34px system-ui,Arial'; g.fillStyle = col; g.fillText(i < 3 ? ['', '', ''][i] : '#' + (i + 1), 52, y);
        g.font = 'bold 32px system-ui,Arial'; g.fillStyle = me ? '#fff2a8' : '#ffffff'; g.fillText(String(r.n || 'Jugador').slice(0, 16), 150, y);
        g.textAlign = 'right'; g.fillStyle = col; g.fillText(String(r.k) + ' kills', W - 54, y);
      });
      g.textAlign = 'center'; g.font = '20px system-ui,Arial'; g.fillStyle = 'rgba(255,255,255,.55)';
      g.fillText(ACCT.user ? (R.mine[which] ? 'Tus kills: ' + R.mine[which] : 'Tus kills: juega salas públicas para sumar') : 'Inicia sesión para aparecer en el ranking', W / 2, H - 26);
      R.tex[which].needsUpdate = true;
    }

    // ---------------------------------------------------------------- el cartel 3D (se pone en un lugar libre cerca del centro de la ciudad)
    function freeSpot() {   // un rincón tranquilo al norte de la ciudad (lejos del mar y del muelle), con espacio para el cartel pequeño
      const hit = (x, z) => { for (const c of COL) { if (c.rubble) continue; if (Math.abs(x - c.x) < c.hx + 1.8 && Math.abs(z - c.z) < c.hz + 1.8) return true; } return false; };
      const fits = (x, z) => {
        const yaw = Math.atan2(-x, -z) || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
        for (let u = -6.5; u <= 6.5; u += 1.6) for (let w = -1.5; w <= 3.5; w += 1.6) { const px = x + u * cs + w * sn, pz = z - u * sn + w * cs; if (hit(px, pz) || groundAt(px, pz) > .3) return false; }
        return true;
      };
      for (let r = 62; r <= 130; r += 2) for (let a = 200; a <= 340; a += 4) { const x = Math.cos(a * Math.PI / 180) * r, z = Math.sin(a * Math.PI / 180) * r; if (z < -40 && fits(x, z)) return { x, z }; }
      for (let r = 40; r <= 130; r += 2) for (let a = 0; a < 360; a += 5) { const x = Math.cos(a * Math.PI / 180) * r, z = Math.sin(a * Math.PI / 180) * r; if (z < 20 && fits(x, z)) return { x, z }; }
      return { x: 0, z: -60 };
    }
    function build() {
      if (R.root) return; const sp = freeSpot(), y0 = groundAt(sp.x, sp.z);
      const g = new T.Group(); g.position.set(sp.x, y0, sp.z); g.rotation.y = Math.atan2(-sp.x, -sp.z) || 0; g.scale.setScalar(.56); scene.add(g); R.root = g;
      const metal = new T.MeshLambertMaterial({ color: 0x1b2036 }), neon = new T.MeshBasicMaterial({ color: 0x39e6ff }), gold = new T.MeshBasicMaterial({ color: 0xffd54f });
      for (const [i, w] of [['m', -5.4], ['a', 5.4]]) {
        const c = document.createElement('canvas'); c.width = 1024; c.height = 760; R.cv[i] = c; R.ctx[i] = c.getContext('2d'); R.tex[i] = new T.CanvasTexture(c); R.tex[i].anisotropy = 4;
        const panel = new T.Mesh(new T.PlaneGeometry(9.6, 7.1), new T.MeshBasicMaterial({ map: R.tex[i] })); panel.position.set(w, 6.6, 0); g.add(panel);
        const back = new T.Mesh(new T.PlaneGeometry(9.6, 7.1), new T.MeshLambertMaterial({ color: 0x0e1224, side: T.DoubleSide })); back.position.set(w, 6.6, -.12); back.rotation.y = Math.PI; g.add(back);
        const fr = (ww, hh, x, y) => { const m = new T.Mesh(new T.BoxGeometry(ww, hh, .3), metal); m.position.set(w + x, y, -.1); g.add(m); };
        fr(10, .3, 0, 10.2); fr(10, .3, 0, 3.0); fr(.3, 7.4, -4.95, 6.6); fr(.3, 7.4, 4.95, 6.6);
        const nb = new T.Mesh(new T.BoxGeometry(10, .12, .12), i === 'm' ? neon : gold); nb.position.set(w, 10.45, 0); g.add(nb);
        for (const px of [-3.6, 3.6]) { const pole = new T.Mesh(new T.BoxGeometry(.5, 3.2, .5), metal); pole.position.set(w + px, 1.5, -.1); g.add(pole); }
      }
      const base = new T.Mesh(new T.BoxGeometry(21.4, .5, 3), metal); base.position.set(0, .25, -.1); g.add(base);
      const lc = document.createElement('canvas'); lc.width = 1024; lc.height = 160; const l2 = lc.getContext('2d'); l2.font = 'bold 78px system-ui,Arial'; l2.textAlign = 'center'; l2.fillStyle = '#fff'; l2.shadowColor = '#39e6ff'; l2.shadowBlur = 30; l2.fillText('RANKING MUNDIAL', 512, 112);
      const sp2 = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(lc), transparent: true, depthWrite: false, fog: false })); sp2.scale.set(12, 2, 1); sp2.position.set(0, 12.6, 0); g.add(sp2);
      draw('m'); draw('a');
    }

    // ---------------------------------------------------------------- datos (Firestore)
    async function refresh() {
      if (R.state === 'loading') return; R.state = 'loading';
      try {
        const db = await socialLoad(), mid = String(monthId());
        const [m, a] = await Promise.all([db.collection('cf_lbm').doc(mid).collection('p').orderBy('k', 'desc').limit(10).get(), db.collection('cf_lba').orderBy('k', 'desc').limit(10).get()]);
        const rows = s => s.docs.map(d => { const x = d.data(); return { uid: d.id, n: String(x.n || '').slice(0, 16), k: x.k | 0 }; });
        R.rows.m = rows(m); R.rows.a = rows(a); R.state = 'ok'; R.err = '';
        if (ACCT.user) { const me = ACCT.user.uid; R.mine.a = (R.rows.a.find(r => r.uid === me) || {}).k || R.mine.a; R.mine.m = (R.rows.m.find(r => r.uid === me) || {}).k || R.mine.m; }
      } catch (e) { R.state = 'error'; R.err = (e && (e.code || e.message)) || 'error'; }
      R.at = G.time; if (R.root) { draw('m'); draw('a'); }
    }

    // ---------------------------------------------------------------- sumar kills (las llama emotes.js solo en salas PÚBLICAS contra jugadores reales)
    function kill() { R.pending++; wr('bsb_rank_pending', R.pending); }
    async function flush() {
      const u = ACCT.user; if (!u || !u.emailVerified || R.pending <= 0) return;
      const now = Date.now(); if (now - R.lastFlush < 13000) return;
      const give = Math.min(R.pending, 3 + Math.floor((now - (R.lastFlush || now - 13000)) / 13000)); R.lastFlush = now;
      try {
        const db = await socialLoad(), FV = firebase.firestore.FieldValue, name = String(u.displayName || 'Jugador').replace(/[<>&]/g, '').slice(0, 16) || 'Jugador', mid = String(monthId());
        const base = { uid: u.uid, n: name, k: FV.increment(give), t: FV.serverTimestamp() };
        await Promise.all([db.collection('cf_lba').doc(u.uid).set(base, { merge: true }), db.collection('cf_lbm').doc(mid).collection('p').doc(u.uid).set(Object.assign({}, base, { m: monthId() }), { merge: true })]);
        R.pending -= give; wr('bsb_rank_pending', R.pending); R.mine.a += give; R.mine.m += give; R.at = -999;   // refresca la tabla pronto
      } catch (e) { R.lastFlush = now; /* se reintenta luego; si faltan las reglas no pasa nada */ }
    }
    setInterval(() => { try { flush(); } catch (e) { } }, 6000);

    // ---------------------------------------------------------------- bucle: crea el cartel cuando el mundo ya existe y refresca los datos cada tanto
    setInterval(() => {
      if (G.state !== 'play') return; if (!R.root) build();
      const p = G.player, near = R.root && p && Math.hypot(p.pos.x - R.root.position.x, p.pos.z - R.root.position.z) < 150;
      if (R.state !== 'loading' && (near ? G.time - R.at > 120 || R.at < 0 : G.time > 8 && R.state === 'idle' && !R.at)) refresh();
    }, 3000);

    window.CF_RANK = { kill, refresh, flush, get rows() { return R.rows; }, get spot() { return R.root && R.root.position; }, draw: () => { draw('m'); draw('a'); } };
  }
});
