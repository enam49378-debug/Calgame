// Vida marina y eventos del mar
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_MUNDO = window.CF_MUNDO || {};

window.CF_MUNDO.crearVidaMarina = function crearVidaMarina(D) {
  'use strict';
  const { $, G, MAPCUR, SEA, SEA_Y, SHORE, TAU, V3, angLerp, burst, camera, chestOf, emit, involvesPlayerNear, kill, popText, rand, ringAt, seaFloor, sfx, shakeFrom, triggerWhaleEvent, worldBig } = D;

// ====== Vida marina nueva: mantarrayas, tortugas, medusas luminosas, peces abisales, calamar gigante y cardumen; y los eventos del mar ======
SEA.ev = { school: 0, frenzy: 0, glow: 0, squid: 0 }; SEA.evTimer = 240; SEA.eventsAuto = true;   // aparecen cada varios minutos
try { SEA.eventsAuto = localStorage.getItem('bsb_sea_events') !== '0'; } catch (e) { }
const SEA_EVENTS = {
  school: { n: 'Cardumen gigante', ico: '🐟', msg: '¡Un cardumen gigante cruza el mar hacia la costa!', col: '#7ad7ff', dur: 26 },
  frenzy: { n: 'Frenesí de tiburones', ico: '🦈', msg: '¡Frenesí de tiburones! Salieron más tiburones en aguas profundas.', col: '#ff6b6b', dur: 28 },
  glow: { n: 'Marea luminosa', ico: '✨', msg: '¡Marea luminosa! Las aguas profundas brillan.', col: '#7df9ff', dur: 30 },
  squid: { n: 'Calamar gigante', ico: '🦑', msg: '¡El Kraken despertó en el abismo! Nada hasta el torbellino del mar profundo y derrótalo.', col: '#ff8fb0', dur: 420 },
};
SEA.noKraken = false; try { SEA.noKraken = localStorage.getItem('bsb_no_kraken') === '1'; } catch (e) { }
const krakenBlocked = () => SEA.noKraken && !(typeof D.NETPUB === 'function' && D.NETPUB());   // el truco solo vale en privadas y bots
function triggerSeaEvent(name) {
  const e = SEA_EVENTS[name]; if (!e || !SEA.life) return false;
  if (SEA.ev[name] > 0) return false;
  if (name === 'squid' && window.CF_ABISMO && CF_ABISMO.sim && !SEA.srvAnnounce) { CF_ABISMO.requestEvent(); return false; }   // con servidor, el evento lo pide y lo lleva el servidor
  if (name === 'squid' && krakenBlocked() && !SEA.srvAnnounce) { if (G.state === 'play') D.addFeedText('🦑 El evento del Kraken está desactivado (Panel H)', '#9aa0b8'); return false; }
  SEA.ev[name] = e.dur;
  if (name === 'school') SEA.life.school.t = 0;
  if (name === 'squid') SEA.life.squid.t = 0;
  if (G.state === 'play') { D.addFeedText(e.ico + ' ' + e.msg, e.col); sfx('whoosh', camera.position, .5); }
  return true;
}
function buildSeaLife(root, rnd) {
  const L = SEA.life = { mantas: [], turtles: [], jelly: [], angler: [], squid: null, school: null };
  const lm = c => new THREE.MeshLambertMaterial({ color: c }), gm = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
  const bx = (par, w, h, d, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); q.position.set(x, y, z); if (rx || ry || rz) q.rotation.set(rx, ry, rz); par.add(q); return q; };
  // mantarrayas: cuerpo plano en rombo, alas que ondulan, cola larga y cuernos
  const manta = () => {
    const g = new THREE.Group(), top = lm('#2e4660'), belly = lm('#e9f1f6'), dk = lm('#18222f');
    bx(g, 1.5, .26, 2.0, top, 0, 0, 0); bx(g, 1.1, .12, 1.7, belly, 0, -.13, .05); bx(g, .5, .22, .5, top, -.45, 0, 1.2); bx(g, .5, .22, .5, top, .45, 0, 1.2);   // cabeza con los "cuernos"
    bx(g, .12, .12, 3.4, dk, 0, 0, -2.6);
    const wl = new THREE.Group(), wr = new THREE.Group(); wl.position.set(.7, 0, 0); wr.position.set(-.7, 0, 0); g.add(wl, wr);
    bx(wl, 1.9, .1, 1.7, top, .95, 0, -.1); bx(wl, 1.0, .08, 1.0, top, 2.2, 0, -.3); bx(wl, 1.8, .05, 1.4, belly, .95, -.07, -.1);
    bx(wr, 1.9, .1, 1.7, top, -.95, 0, -.1); bx(wr, 1.0, .08, 1.0, top, -2.2, 0, -.3); bx(wr, 1.8, .05, 1.4, belly, -.95, -.07, -.1);
    g.userData = { wl, wr }; return g;
  };
  for (let i = 0; i < 3; i++) { const m = manta(); root.add(m); L.mantas.push({ m, cx: -55 + i * 52, cz: 150 + (i % 2) * 22, rx: 26 + i * 4, rz: 15, sp: (i % 2 ? -1 : 1) * (.13 + i * .02), a: i * 2.1, y: -4.2 - i * .9 }); }
  // tortugas marinas: caparazon con dibujo, cabeza y cuatro aletas que reman
  const turtle = () => {
    const g = new THREE.Group(), sh = lm('#4c8a4a'), sh2 = lm('#6fb35e'), sk = lm('#8fb46a'), dk = lm('#2f5a35');
    bx(g, 1.1, .34, 1.4, sh, 0, 0, 0); bx(g, .8, .14, 1.0, sh2, 0, .22, 0); bx(g, .3, .12, .5, dk, 0, .3, .1); bx(g, .4, .3, .5, sk, 0, .02, .95); bx(g, .08, .08, .08, lm('#101010'), .14, .1, 1.2); bx(g, .08, .08, .08, lm('#101010'), -.14, .1, 1.2);
    bx(g, .12, .12, .5, sk, 0, -.02, -.85);
    const fl = [], mk = (x, z, s) => { const p = new THREE.Group(); p.position.set(x, -.05, z); g.add(p); bx(p, s * .9, .08, .5, sk, s * .45, 0, 0); fl.push([p, s]); };
    mk(.55, .5, 1); mk(-.55, .5, -1); mk(.5, -.45, 1); mk(-.5, -.45, -1);
    g.userData = { fl }; return g;
  };
  for (let i = 0; i < 4; i++) { const t = turtle(); root.add(t); L.turtles.push({ m: t, cx: -75 + i * 50, cz: 128 + (i % 2) * 14, rx: 18, rz: 10, sp: (i % 2 ? -1 : 1) * .1, a: i * 1.6, y: -2.2 - (i % 2) * .8 }); }
  // medusas: campana luminosa que late, con tentaculos; viven en lo profundo (se ven de noche y bajo el agua)
  const JC = ['#7df9ff', '#ff7de9', '#9d7dff', '#7dffb0'];
  for (let i = 0; i < 18; i++) {
    const col = JC[i % JC.length], g = new THREE.Group(), bell = new THREE.Mesh(new THREE.SphereGeometry(.55, 12, 7, 0, Math.PI * 2, 0, Math.PI / 2), gm(col, .55)); g.add(bell);
    const core = new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), gm('#ffffff', .6)); core.position.y = .12; g.add(core);
    const tm = gm(col, .4); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; bx(g, .04, .9 + (k % 3) * .25, .04, tm, Math.cos(a) * .28, -.5 - (k % 3) * .1, Math.sin(a) * .28); }
    root.add(g);
    const x = (rnd() - .5) * 280, dd = 62 + rnd() * 92; L.jelly.push({ g, bell, mats: [bell.material, core.material, tm], x, z: SHORE(x) + dd, y: -3.5 - rnd() * 8, ph: rnd() * 6.28, sp: .15 + rnd() * .2, s: .8 + rnd() * 1.4 });
  }
  // peces abisales (pez rape): cuerpo oscuro, boca con dientes y una linterna que cuelga delante
  for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(), dk = lm('#171d29'), mouth = lm('#0c0f16'), tooth = lm('#f2f2e8');
    bx(g, 1.2, 1.0, 1.5, dk, 0, 0, 0); bx(g, 1.0, .35, .9, mouth, 0, -.35, .7); for (let k = -2; k <= 2; k++) bx(g, .08, .26, .08, tooth, k * .18, -.22, 1.15); bx(g, .5, .1, .7, dk, 0, .05, -1.1);
    bx(g, .08, .8, .08, dk, 0, .75, .5, .5); const lure = new THREE.Mesh(new THREE.SphereGeometry(.17, 8, 6), gm('#ffe45e', .95)); lure.position.set(0, 1.15, .85); g.add(lure);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), gm('#ffd23f', .22)); halo.position.copy(lure.position); g.add(halo);
    root.add(g); const x = -90 + i * 55 + rnd() * 20; L.angler.push({ g, lure, halo, cx: x, cz: SHORE(x) + 108 + rnd() * 30, r: 7 + rnd() * 5, a: rnd() * 6.28, sp: (rnd() < .5 ? -1 : 1) * (.18 + rnd() * .1), ph: rnd() * 6.28 });
  }
  // calamar gigante (solo en su evento): manto, aletas, ojos que brillan y ocho tentaculos mas dos largos
  { const g = new THREE.Group(), sk = lm('#a8445a'), sk2 = lm('#d9788c'), eye = gm('#fff2a8', .95);
    bx(g, 1.6, 1.5, 5.2, sk, 0, 0, -2.6, 0, 0, 0); bx(g, 3.2, .16, 2.0, sk2, 0, 0, -4.9); bx(g, 1.3, 1.2, 1.4, sk, 0, 0, .3);
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), eye); e.position.set(s * .78, .1, .45); g.add(e); }
    const tent = []; for (let k = 0; k < 8; k++) { const p = new THREE.Group(); p.position.set((k % 4 - 1.5) * .3, (k < 4 ? .25 : -.25), 1.0); g.add(p); bx(p, .18, .18, 4.2, sk2, 0, 0, 2.1); tent.push(p); }
    for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * .2, 0, 1.0); g.add(p); bx(p, .12, .12, 7, sk, 0, 0, 3.5); bx(p, .5, .1, 1.4, sk2, 0, 0, 7); tent.push(p); }
    g.scale.setScalar(2.4); g.visible = false; root.add(g); L.squid = { g, tent, t: 0 }; }
  // cardumen gigante (evento): una bola de peces que gira y avanza hacia la costa
  { const N = 150, im = new THREE.InstancedMesh(new THREE.BoxGeometry(.55, .22, .14), new THREE.MeshLambertMaterial({ color: 0xffffff }), N); im.frustumCulled = false; im.visible = false;
    const col = new THREE.Color(); for (let i = 0; i < N; i++) im.setColorAt(i, col.set(i % 3 ? '#cfe8ff' : '#ffd27a')); im.instanceColor.needsUpdate = true;
    root.add(im); L.school = { im, N, t: 0, d: [] }; for (let i = 0; i < N; i++) L.school.d.push({ a: rnd() * 6.28, r: rnd() * 5, y: (rnd() - .5) * 4, o: rnd() * 6.28 }); }
}
const _sl = { M: new THREE.Matrix4(), Q: new THREE.Quaternion(), E: new THREE.Euler(), P: new THREE.Vector3(), S: new THREE.Vector3(1, 1, 1) };
function updateSeaLife(dt, t, cp) {
  const L = SEA.life; if (!L) return;
  // temporizador de eventos y cuenta atras de los activos
  for (const k in SEA.ev) if (SEA.ev[k] > 0) SEA.ev[k] = Math.max(0, SEA.ev[k] - dt);
  if (SEA.eventsAuto && G.state === 'play' && !(worldBig() && MAPCUR.id !== 'A') && (!G.mp || D.amCoord())) { SEA.evTimer -= dt; if (SEA.evTimer <= 0) { SEA.evTimer = rand(300, 540); const free = Object.keys(SEA_EVENTS).filter(k => !(SEA.ev[k] > 0) && !(k === 'squid' && (krakenBlocked() || (window.CF_ABISMO && CF_ABISMO.sim)))); if (free.length) triggerSeaEvent(free[Math.random() * free.length | 0]); } }
  const glow = SEA.ev.glow > 0 ? 1 + .8 * Math.min(1, SEA.ev.glow / 4, (SEA_EVENTS.glow.dur - SEA.ev.glow) / 3 + .2) : 1;
  const near = (x, z, R) => (x - cp.x) * (x - cp.x) + (z - cp.z) * (z - cp.z) < R * R;
  for (const a of L.mantas) {
    a.a += a.sp * dt; const x = a.cx + Math.cos(a.a) * a.rx, z = a.cz + Math.sin(a.a) * a.rz, vx = -Math.sin(a.a) * a.rx * a.sp, vz = Math.cos(a.a) * a.rz * a.sp;
    a.m.position.set(x, SEA_Y + a.y + Math.sin(t * .6 + a.a) * .4, z); a.m.rotation.set(Math.sin(t * .9 + a.a) * .05, Math.atan2(vx, vz), Math.sin(t * 1.4 + a.a) * .08);
    const fl = Math.sin(t * 2.2 + a.a * 3) * .38; a.m.userData.wl.rotation.z = fl; a.m.userData.wr.rotation.z = -fl;
  }
  for (const a of L.turtles) {
    a.a += a.sp * dt; const x = a.cx + Math.cos(a.a) * a.rx, z = a.cz + Math.sin(a.a) * a.rz, vx = -Math.sin(a.a) * a.rx * a.sp, vz = Math.cos(a.a) * a.rz * a.sp;
    a.m.position.set(x, SEA_Y + a.y + Math.sin(t * .8 + a.a * 2) * .25, z); a.m.rotation.set(Math.sin(t * 1.1 + a.a) * .06, Math.atan2(vx, vz), 0);
    const rw = Math.sin(t * 2.4 + a.a * 5); a.m.userData.fl.forEach(([p, s], i) => { p.rotation.z = s * rw * (i < 2 ? .6 : .35) * (i % 2 ? -1 : 1); p.rotation.y = s * rw * .2; });
  }
  for (const j of L.jelly) {
    const pulse = Math.sin(t * 2.2 + j.ph); j.g.position.set(j.x + Math.sin(t * j.sp + j.ph) * 3, SEA_Y + j.y + Math.sin(t * .5 + j.ph) * 1.2 + pulse * .15, j.z + Math.cos(t * j.sp * .8 + j.ph) * 3);
    j.g.scale.set(j.s * (1 + pulse * .1), j.s * (1 - pulse * .14), j.s * (1 + pulse * .1)); j.g.rotation.y = t * .15 + j.ph;
    const o = glow * (.85 + .15 * Math.sin(t * 3 + j.ph)); j.mats[0].opacity = Math.min(.95, .55 * o); j.mats[1].opacity = Math.min(1, .6 * o); j.mats[2].opacity = Math.min(.8, .4 * o);
    if (glow > 1.2 && Math.random() < dt * 2 && near(j.g.position.x, j.g.position.z, 60)) emit(j.g.position.x + rand(-.5, .5), j.g.position.y, j.g.position.z + rand(-.5, .5), rand(-.3, .3), rand(.1, .5), rand(-.3, .3), '#9ffcff', .1, 1.6, 0, 1);
  }
  for (const a of L.angler) {
    a.a += a.sp * dt; const x = a.cx + Math.cos(a.a) * a.r, z = a.cz + Math.sin(a.a) * a.r, vx = -Math.sin(a.a) * a.sp, vz = Math.cos(a.a) * a.sp;
    const fy = seaFloor(x, z) + 2.3 + Math.sin(t * .7 + a.ph) * .4; a.g.position.set(x, fy, z); a.g.rotation.y = Math.atan2(vx, vz);
    const fl = (.8 + .2 * Math.sin(t * 5 + a.ph) * Math.sin(t * 1.3 + a.ph)) * (glow > 1 ? 1.15 : 1); a.lure.material.opacity = Math.min(1, .95 * fl); a.halo.material.opacity = .22 * fl * glow; a.halo.scale.setScalar(1 + (glow - 1) * .8);
  }
  // calamar gigante
  const sq = L.squid;
  if (sq) {
    const on = SEA.ev.squid > 0; sq.g.visible = on;
    if (on) {
      sq.t += dt; const u = sq.t / SEA_EVENTS.squid.dur, x = -150 + u * 300, z = SHORE(x) + 112 + Math.sin(u * 6) * 14;
      sq.g.position.set(x, SEA_Y - 8 + Math.sin(t * .7) * 1.2, z); sq.g.rotation.set(Math.sin(t * .6) * .06, Math.PI / 2 + Math.cos(u * 6) * .25, 0);
      sq.tent.forEach((p, i) => { p.rotation.x = Math.sin(t * 1.6 + i) * .18; p.rotation.y = Math.cos(t * 1.2 + i * .7) * .2; });
      if (Math.random() < dt * 4 && near(x, z, 60)) emit(x + rand(-2, 2), sq.g.position.y + rand(-1, 1), z + rand(-2, 2), 0, .5, 0, '#ffcad8', .12, 1.5, 0, 1);
    }
  }
  // cardumen gigante: bola de peces que gira y se acerca a la costa
  const sc = L.school;
  if (sc) {
    const on = SEA.ev.school > 0; sc.im.visible = on;
    if (on) {
      sc.t += dt; const u = Math.min(1, sc.t / SEA_EVENTS.school.dur), cx = -60 + Math.sin(u * 3) * 40 + u * 100, cz = SHORE(cx) + 130 - u * 100, cy = SEA_Y - 3.5 - Math.sin(u * 3.14) * 1.5;
      for (let i = 0; i < sc.N; i++) {
        const d = sc.d[i], a = d.a + t * (1.1 + (i % 5) * .08), r = 2.5 + d.r + Math.sin(t * .8 + d.o) * 1.5;
        _sl.P.set(cx + Math.cos(a) * r, cy + d.y + Math.sin(t + d.o) * .5, cz + Math.sin(a) * r); _sl.E.set(0, -a, 0); _sl.Q.setFromEuler(_sl.E); _sl.M.compose(_sl.P, _sl.Q, _sl.S); sc.im.setMatrixAt(i, _sl.M);
      }
      sc.im.instanceMatrix.needsUpdate = true;
    }
  }
}
function seaEventsUi() {
  const ev = $('opt-sea-events');
  if (ev) { ev.checked = SEA.eventsAuto !== false; return; }
  const host = $('btn-whale-now'); if (!host) return;
  const row = host.parentNode;
  for (const k in SEA_EVENTS) { const e = SEA_EVENTS[k], b = document.createElement('button'); b.type = 'button'; b.textContent = e.ico + ' Evento marino: ' + e.n; b.addEventListener('click', () => { if (!triggerSeaEvent(k)) D.addFeedText('Ese evento ya está en curso', '#9aa0b8'); }); row.appendChild(b); }
  const lk = document.createElement('label'); lk.className = 'chk'; lk.innerHTML = '<input id="opt-no-kraken" type="checkbox"><span>Bloquear el evento del Kraken<small>Truco: el Kraken nunca despierta en salas privadas ni contra bots. En salas públicas no tiene efecto.</small></span>';
  row.parentNode.insertBefore(lk, row.nextSibling);
  { const c2 = lk.querySelector('input'); c2.checked = !!SEA.noKraken; c2.addEventListener('change', () => { SEA.noKraken = c2.checked; try { localStorage.setItem('bsb_no_kraken', c2.checked ? '1' : '0'); } catch (e) { } if (c2.checked && SEA.ev.squid > 0) SEA.ev.squid = 0; }); }
  const lab = document.createElement('label'); lab.className = 'chk'; lab.innerHTML = '<input id="opt-sea-events" type="checkbox" checked><span>Eventos del mar<small>Cardumen gigante, frenesí de tiburones, marea luminosa y calamar gigante aparecen solos de vez en cuando.</small></span>';
  row.parentNode.insertBefore(lab, row.nextSibling);
  const c = lab.querySelector('input'); c.checked = SEA.eventsAuto !== false; c.addEventListener('change', () => { SEA.eventsAuto = c.checked; try { localStorage.setItem('bsb_sea_events', c.checked ? '1' : '0'); } catch (e) { } });
}

function updateSea(dt) {
  if (!SEA.root || !SEA.root.visible) return; SEA.t += dt; const t = SEA.t, cp = camera.position;
  if (cp.z < 10 && cp.y < 8) return;
  if (SEA.beacon) SEA.beacon.rotation.y = t * 0.85;
  // Botes mecidos por las olas
  for (const b of SEA.boats) {
    b.mesh.position.y = SEA_Y + Math.sin(t * 1.6 + b.ph) * 0.12;
    b.mesh.rotation.z = Math.sin(t * 1.2 + b.ph) * 0.05;
    b.mesh.rotation.x = Math.cos(t * 1.4 + b.ph) * 0.04;
  }
  updateSeaLife(dt, t, cp);
  if (window.CF_ABISMO) CF_ABISMO.update(dt, t, cp);
  // Delfines saltando
  for (const d of SEA.dolphins) {
    const cyc = (t * 0.55 + d.ph) % 4.5;
    if (cyc < 1.6) {
      const p = cyc / 1.6, arc = Math.sin(p * Math.PI);
      d.mesh.visible = true;
      d.mesh.position.set(d.cx + (p - 0.5) * 9, SEA_Y - 0.6 + arc * 3.8, d.cz + Math.sin(d.ph) * 4);
      d.mesh.rotation.set(-(p - 0.5) * 1.7, Math.PI * 0.5, 0);
    } else d.mesh.visible = false;
  }
  // Tiburones patrullando las profundidades y acechando a nadadores alejados
  for (const sh of SEA.sharks) {
    const frenzy = SEA.ev && SEA.ev.frenzy > 0, deepMin = SHORE(sh.x) + (frenzy ? 70 : 90);   // en frenesi suben un poco hacia la costa
    sh.mesh.visible = !!SEA.sharksOn && (!sh.extra || frenzy);
    if (!SEA.sharksOn || (sh.extra && !frenzy)) continue;
    if (sh.biteCd > 0) sh.biteCd = Math.max(0, sh.biteCd - dt);
    if (sh.lungeT > 0) sh.lungeT = Math.max(0, sh.lungeT - dt);
    let target = null, bestD = frenzy ? 40 : 26;
    if (G.state === 'play') {
      for (const f of G.fighters) {
        if (!f.alive || !f.swim || f.pos.z < SHORE(f.pos.x) + (frenzy ? 62 : 80)) continue;   // solo atacan a quien nada en aguas profundas
        const dist = Math.hypot(f.pos.x - sh.x, f.pos.z - sh.z);
        if (dist < bestD) { bestD = dist; target = f; }
      }
    }
    let nx, nz;
    if (target && sh.biteCd <= 1.2) {
      const dx = target.pos.x - sh.x, dz = target.pos.z - sh.z, len = Math.hypot(dx, dz) || 1;
      const spd = frenzy ? 9.2 : 6.6;
      nx = sh.x + (dx / len) * spd * dt;
      nz = Math.max(deepMin, sh.z + (dz / len) * spd * dt);
      sh.yaw = angLerp(sh.yaw, Math.atan2(dx, dz), Math.min(1, dt * 7));
      if (len < 2.15 && sh.biteCd <= 0) {
        sh.biteCd = 3.6; sh.lungeT = 0.45;
        const chest = chestOf(target);
        burst(chest, 20, '#8fe8ff', 9, 0.18, 0.45, 0.4);
        burst(chest, 12, '#ff5252', 7, 0.15, 0.35, 0.3);
        ringAt(new V3(target.pos.x, SEA_Y + 0.08, target.pos.z), '#ffffff', 3.4, 0.35);
        sfx('heavy', target.pos);
        if (target.isPlayer || involvesPlayerNear(target)) popText(chest, '¡MORDIDA DE TIBURÓN!', '#ff5252', 22);
        if (!target.remote && (!G.rules?.god || !target.isPlayer)) {
          target.hp -= frenzy ? 8 : 6; target.flashT = 0.16; target.vel.y = 8.2; target.onGround = false;
          target.vel.x += (dx / len) * 7; target.vel.z += (dz / len) * 7;
          if (target.hp <= 0) kill(target, null);
        }
      }
    } else {
      sh.a += sh.sp * dt;
      nx = sh.cx + Math.cos(sh.a) * sh.rx;
      nz = Math.max(deepMin + 4, sh.cz + Math.sin(sh.a) * sh.rz);
      const vx = nx - sh.x, vz = nz - sh.z;
      if (vx * vx + vz * vz > 1e-5) sh.yaw = angLerp(sh.yaw, Math.atan2(vx, vz), Math.min(1, dt * 6));
    }
    sh.x = nx; sh.z = nz;
    const lungeY = sh.lungeT > 0 ? Math.sin((sh.lungeT / 0.45) * Math.PI) * 1.15 : 0;
    sh.mesh.position.set(sh.x, SEA_Y - (frenzy ? 0.12 : 0.32) + Math.sin(t * 3.2 + sh.ph) * 0.06 + lungeY, sh.z);   // en frenesi la aleta asoma
    sh.mesh.rotation.set(sh.lungeT > 0 ? -0.38 : 0, sh.yaw, Math.sin(t * 4 + sh.ph) * 0.04);
    if (sh.mesh.userData.tail) sh.mesh.userData.tail.rotation.y = Math.sin(t * (target ? 12 : 6.5) + sh.ph) * 0.38;
    if (Math.random() < dt * (target ? 14 : 5)) emit(sh.x - Math.sin(sh.yaw) * 0.6, SEA_Y + 0.06, sh.z - Math.cos(sh.yaw) * 0.6, rand(-0.8, 0.8), rand(0.6, 1.8), rand(-0.8, 0.8), '#e6f9ff', rand(0.08, 0.16), rand(0.25, 0.45), 0.2);
  }
  // Evento de Ballena Saltando
  if (SEA.whale) {
    const w = SEA.whale;
    if (!w.active && SEA.whaleAuto) {
      SEA.whaleTimer -= dt;
      if (SEA.whaleTimer <= 0) {
        SEA.whaleTimer = rand(28, 44);
        triggerWhaleEvent(false);
      }
    }
    if (w.active) {
      w.t += dt;
      const fx = Math.sin(w.yaw), fz = Math.cos(w.yaw);
      if (w.t < 0.75) {
        // Fase de aviso y chorro de vapor antes de emerger
        w.mesh.position.set(w.x0, SEA_Y - 7.5 + (w.t / 0.75) * 3.5, w.z0);
        if (!w.spouted && w.t > 0.15) {
          w.spouted = true;
          sfx('whoosh', new V3(w.x0, SEA_Y, w.z0));
          for (let i = 0; i < 28; i++) emit(w.x0 + rand(-0.8, 0.8), SEA_Y + 0.2, w.z0 + rand(-0.8, 0.8), rand(-2.2, 2.2), rand(7, 15), rand(-2.2, 2.2), i % 2 ? '#ffffff' : '#9be8ff', rand(0.18, 0.35), rand(0.5, 0.95), 0.35);
        }
      } else if (w.t <= 3.35) {
        // Salto parabólico monumental fuera del agua
        const p = (w.t - 0.75) / 2.6;
        const arc = Math.sin(p * Math.PI);
        const wx = w.x0 + fx * p * 17;
        const wz = w.z0 + fz * p * 17;
        const wy = SEA_Y - 2.5 + arc * 15.2;
        w.mesh.position.set(wx, wy, wz);
        const pitch = (1 - p * 2) * 1.05;
        const roll = Math.sin(p * Math.PI) * 0.32;
        w.mesh.rotation.set(-pitch, w.yaw, roll);
        if (w.mesh.userData.finL) w.mesh.userData.finL.rotation.z = -0.25 - Math.sin(p * Math.PI) * 0.45;
        if (w.mesh.userData.finR) w.mesh.userData.finR.rotation.z = 0.25 + Math.sin(p * Math.PI) * 0.45;
        if (w.mesh.userData.tail) w.mesh.userData.tail.rotation.x = Math.sin(w.t * 5.5) * 0.28;
        if (Math.random() < dt * 35) emit(wx + rand(-1.8, 1.8), wy - 0.5, wz + rand(-1.8, 1.8), rand(-2, 2), rand(1, 4), rand(-2, 2), '#e8fbff', rand(0.14, 0.28), rand(0.4, 0.75), 0.5);
        if (p >= 0.86 && !w.splashed) {
          w.splashed = true;
          const spPos = new V3(wx, SEA_Y + 0.1, wz);
          ringAt(spPos, '#ffffff', 18, 0.95);
          ringAt(spPos, '#6be2ff', 13, 0.75);
          ringAt(spPos, '#ffffff', 8.5, 0.55);
          for (let i = 0; i < 55; i++) {
            const a = rand(0, TAU), sp = rand(3, 14);
            emit(wx + Math.cos(a) * rand(0.5, 3.5), SEA_Y + 0.25, wz + Math.sin(a) * rand(0.5, 3.5), Math.cos(a) * sp, rand(6, 17), Math.sin(a) * sp, i % 3 ? '#ffffff' : '#8ce7ff', rand(0.22, 0.46), rand(0.55, 1.1), 0.55);
          }
          sfx('slam', spPos); sfx('drop', spPos);
          shakeFrom(spPos, 0.6);
          for (const f of G.fighters) {
            if (!f.alive || !f.swim) continue;
            const d = Math.hypot(f.pos.x - wx, f.pos.z - wz);
            if (d < 22 && d > 0.1) {
              const push = (1 - d / 22) * 11;
              f.vel.x += ((f.pos.x - wx) / d) * push;
              f.vel.z += ((f.pos.z - wz) / d) * push;
              f.vel.y = Math.max(f.vel.y, 5.5 + push * 0.4);
            }
          }
        }
      } else if (w.t < w.dur) {
        const k = (w.t - 3.35) / (w.dur - 3.35);
        w.mesh.position.y = SEA_Y - 2.5 - k * 8.0;
      } else {
        w.active = false;
        w.mesh.visible = false;
      }
    }
  }
  D.PERF_FRAME.sea += dt; if (D.GFX.level >= 2 && D.PERF_FRAME.sea < (D.GFX.level >= 3 ? .1 : .05)) return; D.PERF_FRAME.sea = 0;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new V3(), S = new V3();
  SEA.kelpD.forEach((k, i) => { const dx = k.x - cp.x, dz = k.z - cp.z; if (dx * dx + dz * dz > 6400) { if (!k.hid) { S.set(0, 0, 0); M.compose(P.set(k.x, k.y, k.z), Q.identity(), S); SEA.kelp.setMatrixAt(i, M); k.hid = true; SEA.kelpDirty = true; } return; } k.hid = false; E.set(Math.sin(t * 1.3 + k.ph) * .13, 0, Math.cos(t * 1.1 + k.ph * 1.7) * .13); Q.setFromEuler(E); M.compose(P.set(k.x, k.y, k.z), Q, S.set(k.w, k.h, k.w)); SEA.kelp.setMatrixAt(i, M); });
  SEA.kelp.instanceMatrix.needsUpdate = true;
  SEA.fishD.forEach((f, i) => { const s = f.s, a = f.a + t * s.sp, r = s.r + f.o; const x = s.x + Math.cos(a) * r, z = s.z + Math.sin(a) * r, y = s.y + f.dy + Math.sin(t * 2 + i) * .15; E.set(0, -a, 0); Q.setFromEuler(E); M.compose(P.set(x, y, z), Q, S.set(.14, f.sz * .75, f.sz * 1.6)); SEA.fish.setMatrixAt(i, M); });
  SEA.fish.instanceMatrix.needsUpdate = true;
  if (SEA.buoys) for (const b of SEA.buoys) { b.position.y = SEA_Y + .2 + Math.sin(t * 1.2 + b.userData.buoy) * .08; b.rotation.z = Math.sin(t + b.userData.buoy) * .08; }
}

  return { SEA_EVENTS, buildSeaLife, krakenBlocked, seaEventsUi, triggerSeaEvent, updateSea };
};
