// Efectos de Jesuluto (pantalla, Windows, Clippy, BSOD)
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearJesulutoFx = function crearJesulutoFx(D) {
  'use strict';
  const { PX, TAU, V3, burst, camera, emit, fwd, groundAt, popText, rand, rightOf, scene } = D;

// ===== Jesuluto: pantalla en la cabeza, ventanas de Windows, Clippy y pantalla azul =====
const JL_TEX = {};
function jlDialogTex(kind = 'error') {
  if (JL_TEX[kind]) return JL_TEX[kind];
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 88; const g = cv.getContext('2d');
  g.fillStyle = '#ece9d8'; g.fillRect(0, 0, 128, 88); g.strokeStyle = '#0a49c8'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 125, 85);
  const tb = g.createLinearGradient(0, 0, 128, 0); tb.addColorStop(0, '#0a246a'); tb.addColorStop(.5, '#2f6edb'); tb.addColorStop(1, '#5a9bff'); g.fillStyle = tb; g.fillRect(3, 3, 122, 16);
  g.fillStyle = '#fff'; g.font = 'bold 11px Tahoma,Arial,sans-serif'; g.textBaseline = 'middle'; g.fillText(kind === 'warn' ? 'Advertencia' : 'Error crítico', 8, 11);
  g.fillStyle = '#e0431e'; g.fillRect(108, 5, 15, 12); g.fillStyle = '#fff'; g.fillText('×', 112, 11);
  g.fillStyle = kind === 'warn' ? '#f2c230' : '#e03a3a'; g.beginPath(); if (kind === 'warn') { g.moveTo(22, 26); g.lineTo(36, 52); g.lineTo(8, 52); g.closePath(); } else g.arc(22, 40, 14, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText(kind === 'warn' ? '!' : '✕', 22, kind === 'warn' ? 44 : 41); g.textAlign = 'left';
  g.fillStyle = '#000'; g.font = '10px Tahoma,Arial,sans-serif'; g.fillText('Se ha producido un error', 44, 32); g.fillText('fatal en CLIPPY.EXE', 44, 44); g.fillText('Código 0x0000007B', 44, 56);
  g.fillStyle = '#d8d4c2'; g.fillRect(44, 66, 40, 15); g.strokeStyle = '#fff'; g.strokeRect(44.5, 66.5, 39, 14); g.strokeStyle = '#555'; g.beginPath(); g.moveTo(84.5, 67); g.lineTo(84.5, 81); g.lineTo(44, 81); g.stroke();
  g.fillStyle = '#000'; g.fillText('Aceptar', 50, 74);
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.LinearFilter; return (JL_TEX[kind] = t);
}
const JL_WIN_GEO = new THREE.PlaneGeometry(1.7, 1.17);
const jlWinMat = kind => new THREE.MeshBasicMaterial({ map: jlDialogTex(kind), side: THREE.DoubleSide, transparent: true, depthWrite: false });
function jlBarTex() {
  if (JL_TEX.bar) return JL_TEX.bar;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 40; const g = cv.getContext('2d');
  g.fillStyle = '#ece9d8'; g.fillRect(0, 0, 256, 40); g.strokeStyle = '#555'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 253, 37); g.fillStyle = '#0a8cff';
  for (let i = 0; i < 14; i++) g.fillRect(8 + i * 17, 9, 12, 22);
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; return (JL_TEX.bar = t);
}
function jlLaunchWindow(f, yaw, o, big) {
  const kind = big ? 'error' : Math.random() < .3 ? 'warn' : 'error', mat = jlWinMat(kind), mesh = new THREE.Mesh(JL_WIN_GEO, mat), start = D.front(f, .9, 1.7);
  mesh.position.copy(start); if (big) mesh.scale.setScalar(2.1); scene.add(mesh);
  const dir = new V3(Math.sin(yaw), 0, Math.cos(yaw)), nd = D.ndt(), spd = big ? 19 : 26; let life = 0, done = false;
  let untrack = () => {};
  const end = () => { if (done) return; done = true; untrack(); scene.remove(mesh); mat.dispose(); };
  untrack = D.trackSkillObj(f, 3.0, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); life += dt;
    let best = null, bd = 1e9; for (const g of D.enemiesOf(f)) { const to = D.chestOf(g).sub(mesh.position), d = to.length(); if (d < 18 && to.dot(dir) / d > .55 && d < bd) { bd = d; best = g; } }
    if (best) dir.lerp(D.chestOf(best).sub(mesh.position).normalize(), Math.min(1, 2.6 * dt)).normalize();
    mesh.position.addScaledVector(dir, spd * dt); mesh.lookAt(camera.position.x, mesh.position.y, camera.position.z); mesh.rotation.z = Math.sin(life * 9) * .1;
    emit(mesh.position.x, mesh.position.y, mesh.position.z, rand(-.5, .5), rand(-.5, .5), rand(-.5, .5), '#3aa0ff', big ? .22 : .1, .25, 0, 0);
    for (const g of D.enemiesOf(f)) if (D.chestOf(g).distanceTo(mesh.position) < (big ? 1.7 : 1.15)) {
      D.applyHit(f, g, big ? { dmg: (o.dmg || 4.5) * 2.1, stun: 1, kb: 11, up: 6, ragdoll: .6, guardBreak: true, color: '#0078d7', hitstop: .08, shake: .4 } : { dmg: o.dmg || 4.5, stun: .45, kb: 5, up: 1, color: '#0078d7', hitstop: .04, shake: .18 });
      popText(D.chestOf(g), big ? '¡ERROR FATAL!' : '¡Error!', big ? '#ffffff' : '#7ad7ff', big ? 24 : 18); burst(mesh.position.clone(), big ? 26 : 12, '#3aa0ff', big ? 10 : 7, .16, .35, 0); D.sfx('hit', mesh.position, .6); end(); return;
    }
    if (life > (big ? 1.3 : 1.1) || groundAt(mesh.position.x, mesh.position.z) > mesh.position.y) { burst(mesh.position.clone(), 8, '#3aa0ff', 5, .14, .3, 0); end(); return; }
    if (D.G.state === 'play') D.later(0, tick); else end();
  };
  D.later(0, tick);
}
function jlFallWindow(f, x, z, o) {
  const gy = groundAt(x, z), mat = jlWinMat(Math.random() < .3 ? 'warn' : 'error'), mesh = new THREE.Mesh(JL_WIN_GEO, mat), nd = D.ndt(); let y = gy + 16, done = false;
  mesh.position.set(x, y, z); scene.add(mesh);
  let untrack = () => {};
  const end = () => { if (done) return; done = true; untrack(); scene.remove(mesh); mat.dispose(); };
  untrack = D.trackSkillObj(f, 3.0, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); y -= 26 * dt; mesh.position.y = y; mesh.lookAt(camera.position.x, y, camera.position.z); mesh.rotation.z = Math.sin(y) * .12;
    if (y <= gy + .8) { D.explode(f, new V3(x, gy + .6, z), 2.1, { dmg: o.dmg || 3.6, stun: .45, kb: 5, up: 4, color: '#0078d7', hitstop: .03, shake: .15 }); burst(new V3(x, gy + .5, z), 10, '#3aa0ff', 6, .15, .4, .3); D.sfx('hit', new V3(x, gy, z), .4); end(); return; }
    if (D.G.state === 'play') D.later(0, tick); else end();
  };
  D.later(0, tick);
}
// --- pantalla de la cabeza (canvas 64×64)
function jlDrawScreen(sc, st) {
  const g = sc.ctx; g.clearRect(0, 0, 64, 64); g.imageSmoothingEnabled = false;
  const win = (x, y, w, h, title) => { g.fillStyle = '#ece9d8'; g.fillRect(x, y, w, h); g.fillStyle = '#0a49c8'; g.fillRect(x, y, w, 6); g.fillStyle = '#fff'; g.font = 'bold 6px Arial'; g.fillText(title, x + 2, y + 5); g.fillStyle = '#e0431e'; g.fillRect(x + w - 7, y + 1, 6, 4); };
  if (st === 'desk') {
    const sky = g.createLinearGradient(0, 0, 0, 44); sky.addColorStop(0, '#3a8ee6'); sky.addColorStop(1, '#a9d8ff'); g.fillStyle = sky; g.fillRect(0, 0, 64, 52);
    g.fillStyle = '#4e9c2c'; g.beginPath(); g.moveTo(0, 52); g.quadraticCurveTo(24, 30, 64, 44); g.lineTo(64, 52); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(10, 10, 14, 3); g.fillRect(14, 7, 10, 3); g.fillRect(40, 16, 12, 3);
    g.fillStyle = '#245edb'; g.fillRect(0, 52, 64, 12); g.fillStyle = '#3c9a3a'; g.fillRect(0, 52, 20, 12); g.fillStyle = '#fff'; g.font = 'bold 7px Arial'; g.fillText('inicio', 2, 60); g.fillStyle = '#0f3fa8'; g.fillRect(46, 54, 18, 8); g.fillStyle = '#fff'; g.font = '6px Arial'; g.fillText('12:00', 47, 60);
  } else if (st === 'error') {
    g.fillStyle = '#008080'; g.fillRect(0, 0, 64, 64); win(6, 10, 52, 40, 'Error'); g.fillStyle = '#e03a3a'; g.beginPath(); g.arc(18, 32, 7, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 10px Arial'; g.fillText('✕', 14, 36);
    g.fillStyle = '#000'; g.font = '5px Arial'; g.fillText('Error fatal', 28, 30); g.fillText('0x7B', 28, 37); g.fillStyle = '#d8d4c2'; g.fillRect(24, 42, 18, 6);
  } else if (st === 'bsod') {
    g.fillStyle = '#0078d7'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#fff'; g.font = 'bold 26px Arial'; g.fillText(':(', 6, 28); g.font = '5px Arial'; g.fillText('Tu PC tuvo un problema', 5, 38); g.fillText('y necesita reiniciarse.', 5, 45); g.fillText('JESULUTO_CLIPPY', 5, 56);
  } else if (st === 'load') {
    g.fillStyle = '#000'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#c0c0c0'; g.font = '6px monospace'; g.fillText('C:\\>format c:', 3, 10); g.fillText('Formateando...', 3, 20); g.strokeStyle = '#c0c0c0'; g.strokeRect(4.5, 32.5, 55, 9); g.fillStyle = '#0a8cff'; g.fillRect(6, 34, 36, 6);
  } else if (st === 'undo') {
    g.fillStyle = '#ece9d8'; g.fillRect(0, 0, 64, 64); win(0, 0, 64, 64, 'Deshacer'); g.fillStyle = '#0a49c8'; g.font = 'bold 22px Arial'; g.fillText('↶', 16, 42); g.font = 'bold 7px Arial'; g.fillText('Ctrl+Z', 15, 56);
  } else if (st === 'clippy') {
    g.fillStyle = '#ffffe1'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#000'; g.strokeRect(1.5, 1.5, 61, 61); g.fillStyle = '#000'; g.font = 'bold 6px Arial'; g.fillText('¿Necesitas', 7, 20); g.fillText('ayuda con', 7, 30); g.fillText('eso?', 7, 40);
    g.strokeStyle = '#8a929c'; g.lineWidth = 3; g.beginPath(); g.moveTo(46, 58); g.lineTo(46, 40); g.arc(51, 40, 5, Math.PI, 0); g.lineTo(56, 56); g.stroke(); g.lineWidth = 1;
  }
  sc.tex.needsUpdate = true; sc.drawn = st;
}
function addScreen(model) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const mat = new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(7.6 * PX, 7.6 * PX), mat); mesh.position.set(0, 4 * PX, 5.45 * PX); mesh.renderOrder = 8; model.head.add(mesh);
  model.screen = { mesh, ctx: cv.getContext('2d'), tex, mat, force: '', until: 0, drawn: '' }; mesh.visible = false;
}
function jlScreen(f, st, dur) { const sc = f.model && f.model.screen; if (sc) { sc.force = st; sc.until = D.G.time + dur; } }
function jlUpdateScreen(f, m) {
  const sc = m.screen; if (!sc) return;
  if (m.decal) m.decal.visible = false;
  const want = D.G.time < sc.until ? sc.force : f.awak > 0 ? 'bsod' : (f.alive && f.hp < f.maxHp * .3) ? 'error' : 'desk';
  sc.mesh.visible = want !== 'desk';
  if (m.jlRig) m.jlRig.groups.eyes_anchor.visible = !sc.mesh.visible;
  if (want !== 'desk' && sc.drawn !== want) jlDrawScreen(sc, want);
}
// --- Clippy: el asistente de Office, de mascota; ataca solo y obedece sus habilidades
function drawClippy(g, mood) {
  g.clearRect(0, 0, 192, 256);
  const wire = () => { g.beginPath(); g.moveTo(72, 222); g.lineTo(72, 100); g.bezierCurveTo(72, 42, 152, 42, 152, 100); g.lineTo(152, 190); g.bezierCurveTo(152, 232, 100, 232, 100, 190); g.lineTo(100, 108); g.bezierCurveTo(100, 84, 128, 84, 128, 108); g.lineTo(128, 170); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = '#2a2f3a'; g.lineWidth = 24; wire(); g.stroke();
  g.strokeStyle = '#b9c2cd'; g.lineWidth = 15; wire(); g.stroke();
  g.strokeStyle = '#f4f7fb'; g.lineWidth = 4; g.save(); g.translate(-3, -2); wire(); g.stroke(); g.restore();
  const eye = (x, y) => { g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 17, 21, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#111'; g.beginPath(); g.ellipse(x + 3, y + 3, 6, 8, 0, 0, TAU); g.fill(); };
  eye(94, 108); eye(132, 108);
  g.strokeStyle = '#111'; g.lineWidth = 5;
  g.beginPath(); if (mood === 'angry') { g.moveTo(76, 76); g.lineTo(106, 90); g.moveTo(150, 76); g.lineTo(120, 90); } else { g.moveTo(78, 82); g.quadraticCurveTo(94, 68, 108, 80); g.moveTo(118, 80); g.quadraticCurveTo(132, 68, 148, 82); } g.stroke();
}
function makeClippy(owner) {
  const g = new THREE.Group(), cv = document.createElement('canvas'); cv.width = 192; cv.height = 256; const ctx = cv.getContext('2d'); drawClippy(ctx, 'happy');
  const tex = new THREE.CanvasTexture(cv), mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), body = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.4), mat);
  const bc = document.createElement('canvas'); bc.width = 256; bc.height = 96; const bctx = bc.getContext('2d', { willReadFrequently: true }), btex = new THREE.CanvasTexture(bc);
  const bmat = new THREE.MeshBasicMaterial({ map: btex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), bub = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .9), bmat); bub.position.set(0, 1.25, 0); bub.visible = false;
  g.add(body, bub);
  return { owner, g, body, bub, ctx, tex, mat, bmat, bctx, btex, mood: 'happy', pos: new V3(), ov: null, sc: 1, cd: 1.5, say(t,fromNet=false) { if(!fromNet&&!D.clippySpeak(this.owner,t))return false;this.sayT=Math.max(2.4,D.CHARACTER_VOICE_DURATION[D.CLIPPY_VOICES[t]?.clip]||0); const c = this.bctx; c.clearRect(0, 0, 256, 96); c.fillStyle = '#ffffe1'; c.fillRect(2, 2, 252, 70); c.strokeStyle = '#000'; c.lineWidth = 3; c.strokeRect(2, 2, 252, 70); c.fillStyle = '#ffffe1'; c.beginPath(); c.moveTo(110, 70); c.lineTo(128, 94); c.lineTo(138, 70); c.fill(); c.stroke(); c.fillRect(112, 68, 24, 5); c.fillStyle = '#000'; c.font = 'bold 17px Tahoma,Arial,sans-serif'; c.textAlign = 'center'; const w = t.split(' '); let l1 = '', l2 = ''; for (const x of w) (l1.length < 17 ? l1 += (l1 ? ' ' : '') + x : l2 += (l2 ? ' ' : '') + x); c.fillText(l1, 128, l2 ? 30 : 42); if (l2) c.fillText(l2, 128, 54); this.btex.needsUpdate = true; this.bub.visible = true; }, sayT: 0 };
}
function disposeClippy(c) { scene.remove(c.g); c.body.geometry.dispose(); c.bub.geometry.dispose(); c.mat.dispose(); c.bmat.dispose(); c.tex.dispose(); c.btex.dispose(); }
const JL_QUOTES = ['¿Necesitas ayuda?', '¡Parece que estás peleando!', '¿Quieres que lo haga por ti?', 'Parece que vas perdiendo…', '¿Guardo los cambios?'];
const _jv = new V3();
function updateJesuluto(f, m, dt, T) {
  if (!f.ch.screenHead) return;
  jlUpdateScreen(f, m);
  if (!f.remote && f.alive) { f.jlHistT = (f.jlHistT || 0) - dt; if (f.jlHistT <= 0) { f.jlHistT = .1; const h = f.jlHist || (f.jlHist = []); h.push({ x: f.pos.x, y: f.pos.y, z: f.pos.z, hp: f.hp }); if (h.length > 31) h.shift(); } }
  let c = f.clippy;
  if (!c) { if (!f.alive) return; c = f.clippy = makeClippy(f); c.pos.set(f.pos.x + 1.2, f.pos.y + 2.2, f.pos.z); scene.add(c.g); if(!f.remote)c.say('¡Hola! Soy Clippy'); }
  if(f.pendingClippyVoice){if(f.pendingClippyVoice.until>performance.now())c.say(f.pendingClippyVoice.text,true);f.pendingClippyVoice=null;}
  c.g.visible = f.alive;
  if (c.ov && D.G.time > c.ov.until) c.ov = null;
  const R = rightOf(f.yaw), F = fwd(f.yaw), awk = f.awak > 0, fury = D.G.time < (f.jlFury || 0);
  const tgt = c.ov ? c.ov.pos() : _jv.set(f.pos.x + R.x * 1.35 - F.x * .2, f.pos.y + 2.35 + Math.sin(T * 2.2) * .18, f.pos.z + R.z * 1.35 - F.z * .2);
  c.pos.lerp(tgt, 1 - Math.exp(-dt * (c.ov ? 10 : 5)));
  const wantSc = c.ov ? c.ov.sc : awk ? 1.5 : fury ? 1.25 : 1; c.sc += (wantSc - c.sc) * (1 - Math.exp(-dt * 6));
  c.g.position.copy(c.pos); c.g.scale.setScalar(c.sc); c.g.quaternion.copy(camera.quaternion); c.g.rotation.z += Math.sin(T * 3) * .04;
  const mood = c.ov ? c.ov.mood || 'angry' : (fury || c.angryT > 0) ? 'angry' : 'happy';
  if (c.mood !== mood) { c.mood = mood; drawClippy(c.ctx, mood); c.tex.needsUpdate = true; }
  c.angryT = (c.angryT || 0) - dt;
  if (c.sayT > 0) { c.sayT -= dt; if (c.sayT <= 0) c.bub.visible = false; }
  else if (!f.remote && f.alive && Math.random() < dt * .06) c.say(JL_QUOTES[Math.random() * JL_QUOTES.length | 0]);
  jlGlitch(f, m, dt, T);
}
// Clippy solo ayuda: cuando Jesuluto conecta un golpe, Clippy dispara un clip al mismo rival (nunca ataca por su cuenta)
function clippyAssist(f, t) {
  const c = f.clippy; if (!c || !f.alive || c.ov || f.remote) return;
  const fury = D.G.time < (f.jlFury || 0), awk = f.awak > 0, cd = fury ? .4 : awk ? .8 : 1.6;
  if (D.G.time - (c.lastAssist || 0) < cd) return; c.lastAssist = D.G.time; c.angryT = .3;
  const q = D.chestOf(t), dmg = fury ? 2.4 : awk ? 2.1 : 1.5;
  D.spawnProj(f, Math.atan2(q.x - c.pos.x, q.z - c.pos.z), { from: c.pos.clone(), color: '#cfd6df', speed: 36, size: .22, long: 1.4, homing: 3, range: 22, onHit: g => D.applyHit(f, g, { dmg, stun: .2, kb: 2, color: '#cfd6df', noAssist: true }) });
  D.sfx('zap', c.pos, .4); burst(c.pos.clone(), 5, '#cfd6df', 4, .12, .25, 0);
  if (Math.random() < .2) c.say(JL_QUOTES[Math.random() * JL_QUOTES.length | 0]);
}
// aura glitcheada del despertar: barras de color que saltan alrededor, el cuerpo parpadea en cian/magenta y se deforma a ratos
function jlGlitch(f, m, dt, T) {
  const on = f.alive && f.awak > 0;
  if (!m.glitch) {
    if (!on) return;
    const g = new THREE.Group(), geo = new THREE.BoxGeometry(1, 1, 1), mats = [0x00ffff, 0xff00ff, 0xffffff].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false })), bars = [];
    for (let i = 0; i < 18; i++) { const b = new THREE.Mesh(geo, mats[i % 3]); g.add(b); bars.push(b); }
    g.position.y = 1.0; m.root.add(g); m.glitch = { g, bars, t: 0 };
  }
  const gl = m.glitch; gl.g.visible = on; if (!on) { m.root.scale.x = 1; return; }
  gl.t -= dt;
  if (gl.t <= 0) {
    gl.t = .06 + Math.random() * .08;
    for (const b of gl.bars) { b.visible = Math.random() < .7; b.scale.set(.2 + Math.random() * 1.0, .04 + Math.random() * .12, .1 + Math.random() * .3); b.position.set((Math.random() - .5) * 1.5, (Math.random() - .5) * 2.2, (Math.random() - .5) * .9); }
    gl.sx = Math.random() < .3 ? 1 + (Math.random() - .5) * .22 : 1;
  }
  m.root.scale.x = gl.sx || 1;
  if (Math.random() < .14) { const col = Math.random() < .5 ? 0x00ffff : 0xff00ff; for (const mt of m.mats) if (mt.emissive) mt.emissive.setHex(col).multiplyScalar(.5); }
  if (Math.random() < dt * 45) emit(f.pos.x + rand(-.6, .6), f.pos.y + rand(0, 2), f.pos.z + rand(-.6, .6), rand(-1, 1), rand(1, 3), rand(-1, 1), ['#00ffff', '#ff00ff', '#ffffff'][Math.random() * 3 | 0], .14, .35, 0, 1);
}
// cascada de ventanas de error de Windows y pantalla azul en la pantalla del jugador (efecto del despertar)
const JL_CSS = document.createElement('style');
JL_CSS.textContent = `#jlfx{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden}
.jlwin{position:absolute;width:236px;background:#ece9d8;border:2px solid #0a49c8;box-shadow:4px 4px 0 #0007;font:12px Tahoma,Arial,sans-serif;color:#000;animation:jlpop .12s ease-out}
.jlwin .t{background:linear-gradient(90deg,#0a246a,#2f6edb 55%,#5a9bff);color:#fff;font-weight:bold;padding:3px 6px;display:flex;justify-content:space-between}
.jlwin .t b{background:#e0431e;padding:0 5px;border:1px solid #fff}
.jlwin .b{display:flex;gap:10px;align-items:center;padding:12px}
.jlwin .b i{font-style:normal;background:#e03a3a;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;flex:none}
.jlwin .k{margin:0 12px 10px;text-align:center}.jlwin .k span{display:inline-block;background:#d8d4c2;border:2px outset #fff;padding:2px 18px}
#jlbsod{position:fixed;inset:0;z-index:61;background:#0078d7;color:#fff;pointer-events:none;font-family:"Segoe UI",Tahoma,Arial,sans-serif;display:none;padding:9vh 8vw;opacity:0;transition:opacity .15s}
#jlbsod .s{font-size:min(22vh,180px);line-height:1}#jlbsod p{font-size:min(4.2vh,34px);max-width:70vw;margin:18px 0}#jlbsod small{font-size:min(2.6vh,20px);opacity:.9}
@keyframes jlpop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}`;
document.head.appendChild(JL_CSS);
function jlErrorCascade(self) {
  let fx = document.getElementById('jlfx'); if (!fx) { fx = document.createElement('div'); fx.id = 'jlfx'; document.body.appendChild(fx); }
  const texts = ['Se ha producido un error fatal en CLIPPY.EXE', 'Windows no puede encontrar «Ganar.exe»', 'El sistema ha dejado de responder', '¿Guardar los cambios en «Tu vida»?', 'Memoria insuficiente (0x0000007B)', 'Actualizando… no apagues el equipo'];
  const n = self ? 18 : 6;
  for (let i = 0; i < n; i++) setTimeout(() => {
    const w = document.createElement('div'); w.className = 'jlwin'; w.style.left = Math.random() * (innerWidth - 250) + 'px'; w.style.top = Math.random() * (innerHeight - 140) + 'px';
    w.innerHTML = `<div class="t"><span>${i % 3 ? 'Error crítico' : 'Advertencia'}</span><b>×</b></div><div class="b"><i>✕</i><span>${texts[i % texts.length]}</span></div><div class="k"><span>Aceptar</span></div>`;
    fx.appendChild(w); setTimeout(() => w.remove(), 2400);
  }, i * (self ? 85 : 140));
  if (self) setTimeout(() => {
    let b = document.getElementById('jlbsod'); if (!b) { b = document.createElement('div'); b.id = 'jlbsod'; b.innerHTML = '<div class="s">:(</div><p>Tu PC tuvo un problema y necesita reiniciarse. Solo estamos recopilando información sobre el error y luego reiniciaremos por ti.</p><small>Código de detención: CLIPPY_IS_WATCHING<br>Qué falló: JESULUTO.SYS</small>'; document.body.appendChild(b); }
    b.style.display = 'block'; requestAnimationFrame(() => { b.style.opacity = '1'; }); setTimeout(() => { b.style.opacity = '0'; setTimeout(() => { b.style.display = 'none'; }, 200); }, 1000);
  }, 1500);
}
function jlAwaken(f) {
  if (!f.ch.bsod) return;
  jlScreen(f, 'bsod', 2.5); if (f.clippy) f.clippy.say('¡PANTALLA AZUL!');
  D.explode(f, D.chestOf(f), 7, { dmg: 8, kb: 12, up: 6, ragdoll: .6, color: '#0078d7', guardBreak: true, hitstop: .1, shake: .5 });
  popText(D.chestOf(f), '¡PANTALLA AZUL!', '#3aa0ff', 28);
  if (D.involvesPlayerNear(f)) jlErrorCascade(f === D.G.player);
}

  return { JL_CSS, JL_QUOTES, JL_TEX, JL_WIN_GEO, _jv, addScreen, clippyAssist, disposeClippy, drawClippy, jlAwaken, jlBarTex, jlDialogTex, jlDrawScreen, jlErrorCascade, jlFallWindow, jlGlitch, jlLaunchWindow, jlScreen, jlUpdateScreen, jlWinMat, makeClippy, updateJesuluto };
};
