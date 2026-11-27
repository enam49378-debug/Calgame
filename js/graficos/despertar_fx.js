// Alas de Sekza, patas de Rocket y Verity
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearDespertarFx = function crearDespertarFx(D) {
  'use strict';
  const { PX, TAU, V3, addFx, burst, camera, clamp, emit, fighterToonMaterial, fwd, glowMat, groundAt, impactStar, popText, rand, rightOf, scene, slashLine } = D;

// ===== Alas del despertar (Sekza): plumas de voxel que se abren al despertar y aletean =====
function addWings(model, col) {
  const mat = c => { const m = fighterToonMaterial(null, 'opaque', THREE.DoubleSide, { color: c, spec: 0.72 }); model.mats.push(m); return m; };
  const C = [mat('#4a2f1b'), mat('#7a4f26'), mat('#d9a441'), mat('#fff0c4')], root = new THREE.Group(), sides = [];
  root.position.set(0, 9 * PX, -2.7 * PX); model.torso.add(root);
  for (const sign of [1, -1]) {
    const g = new THREE.Group(); g.position.x = sign * 1.6 * PX; root.add(g);
    for (let i = 0; i < 7; i++) {
      const L = 9 + i * 3.2, a = (88 - i * 15) * Math.PI / 180, piv = new THREE.Group(); piv.rotation.z = sign > 0 ? a : Math.PI - a; g.add(piv);
      const cut = [0, .4, .75, 1];
      for (let k = 0; k < 3; k++) {
        const len = (cut[k + 1] - cut[k]) * L, b = new THREE.Mesh(new THREE.BoxGeometry(len * PX, 3.6 * PX, 1 * PX), C[k + (k === 2 && i > 3 ? 1 : 0)]);
        b.position.x = (cut[k] + (cut[k + 1] - cut[k]) / 2) * L * PX; piv.add(b);
      }
    }
    sides.push({ g, sign });
  }
  root.visible = false; model.wings = { root, sides, k: 0 };
}
function updateBBWings(f, m, dt, T) {   // alas de Sekza hechas en Blockbench (modelos/sekza/alas_sekza.bbmodel)
  let b = m.bbw; if (!b) { const inst = CF_BBM.make('sekza_alas', 1 / 16); if (!inst) return false; const g = new THREE.Group(); inst.root.rotation.y = Math.PI; inst.root.position.y = -12 * PX; g.add(inst.root); g.visible = false; m.torso.add(g); b = m.bbw = { g, inst, k: 0, t: 0 }; }
  if (m.wings) m.wings.root.visible = false;
  b.k = clamp(b.k + (f.alive && (f.awak > 0 || f.rFlightT > 0) ? 1 : -1) * dt * 3.5, 0, 1); b.g.visible = b.k > .01; if (!b.g.visible) return true;
  const e = b.k * b.k * (3 - 2 * b.k), air = !f.onGround || f.rFlightT > 0, sp = Math.hypot(f.vel.x, f.vel.z); b.g.scale.setScalar(.2 + .8 * e); b.t += dt;
  const vy = f.vel.y, an = !air ? (sp > 1 ? 'walk' : 'idle') : vy > 2.5 ? 'flyup' : vy < -9 ? 'dive' : vy < -2.5 ? (f.rFlightT > 0 ? 'flydown' : 'soar') : (sp > 4 ? 'fly' : 'flap'); b.inst.update(b.inst.anims[an] ? an : 'fly', b.t, dt); return true;
}
function updateWings(f, m, dt, T) {
  if (f && f.ch && f.ch.wings && window.CF_BBM && CF_BBM.has('sekza_alas') && updateBBWings(f, m, dt, T)) return;
  const w = m.wings; if (!w) return;
  w.k = clamp(w.k + (f.alive && (f.awak > 0 || f.rFlightT>0) ? 1 : -1) * dt * 3.5, 0, 1);
  w.root.visible = w.k > .01; if (!w.root.visible) return;
  const e = w.k * w.k * (3 - 2 * w.k), air = !f.onGround, flap = Math.sin(T * (air ? 15 : 5)) * (air ? 1 : .35);
  for (const s of w.sides) { s.g.scale.setScalar(.15 + .85 * e); s.g.rotation.y = s.sign * (.38 + .25 * flap + (1 - e) * .9); }
}
// ===== Patas de araña del despertar (Rocket): ocho patas con cinemática inversa que la llevan en vez de sus piernas =====
const _sv1 = new V3(), _sv2 = new V3(), _sv3 = new V3();
function addSpiderLegs(model, col) {
  const mat = c => { const m = fighterToonMaterial(null, 'opaque', THREE.FrontSide, { color: c, spec: 0.85 }); model.mats.push(m); return m; };
  const M = [mat('#16161d'), mat('#2d2d3b'), mat(col), mat('#e9e2d2')], root = new THREE.Group(), L1 = 14, L2 = 20, legs = [], ang = [.55, 1.0, 1.7, 2.35];
  root.position.set(0, 9 * PX, -2.6 * PX); model.torso.add(root);
  for (const side of [1, -1]) for (let i = 0; i < 4; i++) {
    const g = new THREE.Group(), s1 = new THREE.Group(), s2 = new THREE.Group();
    g.position.x = side * 2 * PX; g.rotation.y = side > 0 ? ang[i] - Math.PI / 2 : -(ang[i] + Math.PI / 2); root.add(g); g.add(s1); s1.add(s2); s2.position.x = L1 * PX;
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(L1 * PX, 1.9 * PX, 1.9 * PX), M[0]); b1.position.x = L1 / 2 * PX; s1.add(b1);
    const jn = new THREE.Mesh(new THREE.BoxGeometry(2.8 * PX, 2.8 * PX, 2.8 * PX), M[2]); jn.position.x = L1 * PX; s1.add(jn);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(L2 * PX, 1.4 * PX, 1.4 * PX), M[1]); b2.position.x = L2 / 2 * PX; s2.add(b2);
    const tp = new THREE.Mesh(new THREE.BoxGeometry(2.2 * PX, 1.3 * PX, 1.3 * PX), M[3]); tp.position.x = L2 * PX; s2.add(tp);
    legs.push({ g, s1, s2, side, i });
  }
  root.visible = false; model.legs = { root, legs, k: 0, L1: L1 * PX, L2: L2 * PX };
}
function updateSpiderLegs(f, m, dt, T) {
  const sp = m.legs; if (!sp) return;
  sp.k = clamp(sp.k + (f.alive && f.awak > 0 ? 1 : -1) * dt * 2.2, 0, 1);
  sp.root.visible = sp.k > .01; if (!sp.root.visible) return;
  const e = sp.k * sp.k * (3 - 2 * sp.k); sp.root.scale.setScalar(.2 + .8 * e);
  m.root.updateMatrixWorld(true);
  const rp = sp.root.getWorldPosition(_sv1), speed = Math.hypot(f.vel.x, f.vel.z), amp = clamp(speed / 6, 0, 1), stab = f.action && f.action.name === 'rkLegStabs';
  const gy = f.onGround ? f.pos.y : rp.y - (sp.L1 + sp.L2) * .55, L1 = sp.L1, L2 = sp.L2;
  for (const l of sp.legs) {
    l.g.updateWorldMatrix(true, false);
    const dir = _sv2.set(1, 0, 0).transformDirection(l.g.matrixWorld); dir.y = 0; dir.normalize();
    const ph = (f.walk || 0) + ((l.i + (l.side > 0 ? 0 : 1)) % 2) * Math.PI;
    let X = (16 + l.i * .6) * PX + Math.sin(ph) * 3.4 * PX * amp, lift = Math.max(0, Math.cos(ph)) * 5 * PX * amp;
    if (stab) { const sg = Math.max(0, Math.sin(f.action.t * 20 + l.i * 1.7 + (l.side > 0 ? 0 : 2))); X += sg * 12 * PX; lift += sg * 8 * PX; }
    if (!f.onGround) lift += 3 * PX;
    _sv3.copy(rp).addScaledVector(dir, X); _sv3.y = gy + lift;
    const q = l.g.worldToLocal(_sv3), d = clamp(Math.hypot(q.x, q.y), .001, (L1 + L2) * .999), a = Math.atan2(q.y, q.x);
    l.s1.rotation.z = a + Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    l.s2.rotation.z = -(Math.PI - Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1)));
  }
}
function updateSwordFire(f, m, dt, T) {
  const w = f.spear; if (!w || !f.ch.fireSword) return;
  const on = f.alive && (f.awak > 0 || f.fireT > 0) && f.spearOut, em = w.material.emissive;
  if (on) {
    em.set('#ff5a1a').multiplyScalar(.55 + .2 * Math.sin(T * 18));
    if (Math.random() < Math.min(1, dt * 60)) {
      m.root.updateMatrixWorld(true);
      for (let k = 0; k < 2; k++) { const q = w.localToWorld(new V3(0, (Math.random() - .5) * 2 * PX, (4 + Math.random() * 22) * PX)); emit(q.x, q.y, q.z, rand(-.6, .6), rand(1, 3), rand(-.6, .6), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', rand(.1, .2), .4, -.2, 1); }
    }
  } else if (w.__fire) em.setRGB(0, 0, 0);
  w.__fire = on;
}
// charco de fuego en el piso: quema a quien lo pise
function firePatch(f, pos, r, dur, col) {
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 28), glowMat('#ff5a1a', .35)); disc.rotation.x = -Math.PI / 2; disc.position.set(pos.x, groundAt(pos.x, pos.z) + .07, pos.z);
  addFx(disc, dur, (o, k) => { o.material.opacity = (.22 + .12 * Math.sin(k * 80)) * (k > .8 ? (1 - k) / .2 : 1); });
  let t = 0, acc = 0;
  const nd = D.ndt(); const tick = () => { const dt = nd();
    t += dt; acc += dt;
    if (Math.random() < dt * 20) { const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * r; emit(pos.x + Math.cos(a) * rr, disc.position.y + .1, pos.z + Math.sin(a) * rr, rand(-.3, .3), rand(2, 5), rand(-.3, .3), Math.random() < .5 ? '#ff7a1a' : '#ffd54f', rand(.15, .3), .5, -.2, 1); }
    if (acc >= .5) { acc = 0; for (const g of D.enemiesOf(f)) if (g.alive && Math.hypot(g.pos.x - pos.x, g.pos.z - pos.z) < r && g.pos.y - pos.y < 2) { D.applyHit(f, g, { dmg: 1.6, stun: .1, kb: 0, color: col, hitstop: 0, shake: .05, noCounter: true }); D.poisonOn(g, f, { dps: 2.2, dur: 2.4, col: '#ff7a1a', label: 'ARDE' }); } }
    if (t < dur && D.G.state === 'play') D.later(0, tick);
  };
  D.later(0, tick);
}
// ===== Verity: la esfera amarilla sonriente (de un "mod" de terror analógico de Minecraft) que acompaña a Seb0lla al despertar =====
const VERITY_KINDS = { verity: { col: '#ffd91a', ink: '#1b1306' }, love: { col: '#ff7ab8', ink: '#3a0a22' }, anti: { col: '#1a1a22', ink: '#f4f4f4' } };
const _vh = new V3();
// caras de Verity dibujadas a mano (personajes/sebolla/verity_caras.png, 7x5): la carita va girando por la esfera
const VERITY_SHEET = { img: new Image(), ready: false }; VERITY_SHEET.img.onload = () => { VERITY_SHEET.ready = true; }; VERITY_SHEET.img.src = 'personajes/sebolla/verity_caras.png';
const VERITY_FACE_CELL = { happy: 13, open: 28, angry: 8 };
function verityIdleFace() { return VERITY_SHEET.ready ? 'c' + ((D.G.time * 7) | 0) % 35 : 'happy'; }
function drawVerityFace(g, kind, st) {
  if (kind === 'verity' && VERITY_SHEET.ready) { const i = st[0] === 'c' ? +st.slice(1) : (VERITY_FACE_CELL[st] ?? 13); g.clearRect(0, 0, 128, 128); g.save(); g.beginPath(); g.arc(64, 64, 64, 0, TAU); g.clip(); g.drawImage(VERITY_SHEET.img, (i % 7) * 128, (i / 7 | 0) * 128, 128, 128, 0, 0, 128, 128); g.restore(); return; }
  const K = VERITY_KINDS[kind] || VERITY_KINDS.verity;
  g.clearRect(0, 0, 128, 128); g.fillStyle = K.ink; g.strokeStyle = K.ink; g.lineWidth = 8; g.lineCap = 'round';
  const e = (x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); };
  if (kind === 'love') { g.font = '44px sans-serif'; g.textAlign = 'center'; g.fillText('♥', 40, 66); g.fillText('♥', 88, 66); }
  else if (st === 'angry') { e(40, 56, 9, 7); e(88, 56, 9, 7); g.beginPath(); g.moveTo(22, 36); g.lineTo(54, 48); g.moveTo(106, 36); g.lineTo(74, 48); g.stroke(); }
  else { e(40, 52, 9, st === 'open' ? 17 : 13); e(88, 52, 9, st === 'open' ? 17 : 13); }
  if (st === 'open') { g.beginPath(); g.ellipse(64, 84, 32, 24, 0, 0, Math.PI); g.fill(); }
  else if (st === 'angry') { g.beginPath(); g.arc(64, 112, 30, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
  else { g.beginPath(); g.arc(64, 68, 38, Math.PI * .12, Math.PI * .88); g.stroke(); }      // sonrisa enorme
}
function makeVerity(kind = 'verity') {
  const K = VERITY_KINDS[kind] || VERITY_KINDS.verity, g = new THREE.Group(), geos = [], mats = [];
  const sg = new THREE.SphereGeometry(.6, 20, 14), sm = new THREE.MeshBasicMaterial({ color: K.col }), sph = new THREE.Mesh(sg, sm);
  const og = new THREE.SphereGeometry(.6, 20, 14), om = new THREE.MeshBasicMaterial({ color: 0x0b0b14, side: THREE.BackSide }), out = new THREE.Mesh(og, om); out.scale.setScalar(1.09);
  const glowG = new THREE.SphereGeometry(.85, 14, 10), glowM = glowMat(K.col, .16), glow = new THREE.Mesh(glowG, glowM);
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const ctx = cv.getContext('2d'); drawVerityFace(ctx, kind, 'happy');
  const tex = new THREE.CanvasTexture(cv), fg = new THREE.CircleGeometry(.5, 24), fm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), face = new THREE.Mesh(fg, fm);
  g.add(out, sph, glow, face); geos.push(sg, og, glowG, fg); mats.push(sm, om, glowM, fm);
  if (kind === 'love') for (const sx of [-1, 1]) { const cg = new THREE.ConeGeometry(.2, .42, 8), cm = new THREE.MeshBasicMaterial({ color: '#e0189a' }), c = new THREE.Mesh(cg, cm); c.position.set(sx * .22, .68, 0); c.rotation.z = -sx * 1.2; g.add(c); geos.push(cg); mats.push(cm); }   // el moño de Lovity
  return { g, face, tex, ctx, kind, st: 'happy', geos, mats, sphMat: sm, col: K.col };
}
function verityFace(v, st) { if (v.st === st) return; v.st = st; drawVerityFace(v.ctx, v.kind, st); v.tex.needsUpdate = true; }
function verityBillboard(v) { v.face.position.copy(camera.position).sub(v.g.position).normalize().multiplyScalar(.7); v.face.lookAt(camera.position); }
function disposeVerity(v) { scene.remove(v.g); v.geos.forEach(x => x.dispose()); v.mats.forEach(x => x.dispose()); v.tex.dispose(); }
// manda a Verity a un punto durante un rato (las habilidades la usan): posFn devuelve el punto, sc su tamaño y face su cara
function verityGo(f, posFn, dur, sc = 1, face = 'happy') { if (f.verity) f.verity.ov = { pos: posFn, until: D.G.time + dur, sc, face }; }
function updateVerity(f, m, dt, T) {
  if (!f.ch.verity) return;
  if (f.mount && f.verity) { f.verity.g.visible = false; return; }
  const on = f.alive, awake = f.awak > 0; let v = f.verity;
  if (!v) { if (!on) return; v = f.verity = Object.assign(makeVerity('verity'), { pos: new V3(f.pos.x, f.pos.y + 2.4, f.pos.z), k: 0, cd: 1.2, ov: null, sc: 1, glitch: 0, angryT: 0 }); scene.add(v.g); }
  v.k = clamp(v.k + (on ? 1 : -1) * dt * 2.2, 0, 1);
  if (!on && v.k <= 0) { disposeVerity(v); f.verity = null; return; }
  const e = v.k * v.k * (3 - 2 * v.k);
  v.aw = (v.aw || 0) + ((awake ? 1 : 0) - (v.aw || 0)) * (1 - Math.exp(-dt * 3));
  if (v.ov && D.G.time > v.ov.until) v.ov = null;
  const R = rightOf(f.yaw), F = fwd(f.yaw);
  const tgt = v.ov ? v.ov.pos() : _vh.set(f.pos.x - R.x * 1.4 - F.x * .2, f.pos.y + 2.5 + Math.sin(T * 2.4) * .22, f.pos.z - R.z * 1.4 - F.z * .2);
  v.pos.lerp(tgt, 1 - Math.exp(-dt * (v.ov ? 9 : 5)));
  v.sc += ((v.ov ? v.ov.sc : 1) - v.sc) * (1 - Math.exp(-dt * 6));
  v.g.position.copy(v.pos); v.g.scale.setScalar(Math.max(.01, (.2 + .8 * e) * v.sc * (.6 + .4 * v.aw) * (1 + .04 * Math.sin(T * 3)))); v.g.visible = v.k > .02;
  verityBillboard(v);
  v.angryT -= dt; v.glitch -= dt; if (v.glitch <= 0 && Math.random() < dt * .3) v.glitch = .14;      // de vez en cuando se "corrompe" un instante
  v.face.scale.set(1, v.glitch > 0 ? 1.45 : 1, 1); v.sphMat.color.set(v.glitch > 0 ? '#ffffff' : v.col);
  verityFace(v, v.angryT > 0 ? 'angry' : v.ov && v.ov.face ? v.ov.face : v.kind === 'verity' ? verityIdleFace() : 'happy');
  // ataque automático: dispara una bola a quien tenga cerca
  if (on && awake && !v.ov && f.ragdoll <= 0 && f.stun <= 0 && !f.choreTrack && !f.grabbed) {
    v.cd -= dt;
    if (v.cd <= 0) {
      let best = null, bd = 22; for (const g of D.enemiesOf(f)) { const d = D.chestOf(g).distanceTo(v.pos); if (d < bd) { bd = d; best = g; } }
      if (best) {
        v.cd = 1.5; v.angryT = .3; const c = D.chestOf(best);
        D.spawnProj(f, Math.atan2(c.x - v.pos.x, c.z - v.pos.z), { from: v.pos.clone(), color: '#ffd91a', speed: 38, size: .32, long: 1.6, homing: 3, range: 26, dmg: 3.5, stun: .3, kb: 3 });
        D.sfx('zap', v.pos, .5); burst(v.pos, 6, '#ffd91a', 5, .14, .25, 0);
        if (Math.random() < .25) popText(new V3(v.pos.x, v.pos.y + .9, v.pos.z), ['¡Lo sé!', '¡Te veo!', '¡Hola!'][Math.random() * 3 | 0], '#ffd91a', 15);
      } else v.cd = .25;
    }
  }
}
// escenas: Verity actúa en la cinemática del Abrazo
function verityScene(st, kind) {
  const f = st.f, tg = st.tg; if (!f.verity) return;
  const at = (x, y, z) => () => D.L2W(st.origin, st.yaw, x, y, z);
  if (kind === 'behind') verityGo(f, at(0, 2.6, 4.4), 1.2, 2.2, 'happy');
  else if (kind === 'stare') verityGo(f, at(0, 2.4, 3.6), 1.0, 3.0, 'open');
  else if (kind === 'fire') {
    f.verity.angryT = .6; verityGo(f, at(0, 2.4, 3.6), .5, 3.0, 'angry'); const a = f.verity.pos.clone(), b = D.chestOf(tg).clone();
    slashLine(a, b, '#ffd91a', .5, 1.0); slashLine(a, b, '#ffffff', .4, .4); impactStar(b, '#ffd91a', 3, .3); D.sfx('ult', b);
  } else if (kind === 'left') verityGo(f, at(-2.8, 1.9, 1.5), .6, 1.3, 'angry');
  else if (kind === 'right') verityGo(f, at(2.8, 1.9, 1.5), .6, 1.3, 'angry');
  else if (kind === 'top') verityGo(f, at(0, 7, 1.5), 1.2, 2.4, 'open');
  else if (kind === 'behindV') verityGo(f, at(0, 1.8, 3.4), 1.4, 1.4, 'happy');
  else if (kind === 'punch') { f.verity.angryT = .5; verityGo(f, at(0, 1.7, 1.7), .35, 1.4, 'angry'); }
  else if (kind === 'butt') { f.verity.angryT = .5; verityGo(f, at(0, 1.7, 2.4), .3, 1.5, 'angry'); }
  else if (kind === 'slam') { f.verity.angryT = .8; verityGo(f, at(0, 2.6, 1.7), .5, 3.4, 'angry'); }
  else if (kind === 'leave') f.verity.ov = null;
}
function webWrap(tg, dur, cocoon) {
  const g = new THREE.IcosahedronGeometry(cocoon ? 1.15 : .95, 1), m = new THREE.MeshBasicMaterial({ color: '#f2f2f8', wireframe: true, transparent: true, opacity: .9 });
  const g2 = new THREE.IcosahedronGeometry(cocoon ? 1.1 : .9, 0), m2 = new THREE.MeshBasicMaterial({ color: '#d8d8e4', transparent: true, opacity: cocoon ? .55 : .25, depthWrite: false });
  const mesh = new THREE.Mesh(g, m); mesh.add(new THREE.Mesh(g2, m2)); mesh.scale.set(1, cocoon ? 1.6 : 1.3, 1);
  addFx(mesh, dur, (o, k) => { o.position.copy(tg.choreTrack ? D.poseChest(tg) : D.chestOf(tg)); m.opacity = k > .85 ? .9 * (1 - (k - .85) / .15) : .9; }, () => { g.dispose(); m.dispose(); g2.dispose(); m2.dispose(); });
}
function buildWebDisc(R, nr, ns, op) {
  const grp = new THREE.Group(), geos = [], mat = glowMat('#ffffff', op);
  for (let i = 1; i <= nr; i++) { const g = new THREE.RingGeometry(R * i / nr - .06, R * i / nr, 40); geos.push(g); const m = new THREE.Mesh(g, mat); m.rotation.x = -Math.PI / 2; grp.add(m); }
  for (let i = 0; i < ns; i++) { const g = new THREE.BoxGeometry(R * 2, .02, .06); geos.push(g); const m = new THREE.Mesh(g, mat); m.rotation.y = i * Math.PI / ns; grp.add(m); }
  return { grp, mat, dispose: () => { geos.forEach(g => g.dispose()); mat.dispose(); } };
}

  return { VERITY_KINDS, _sv1, _sv2, _sv3, _vh, addSpiderLegs, addWings, buildWebDisc, disposeVerity, drawVerityFace, firePatch, makeVerity, updateSpiderLegs, updateSwordFire, updateVerity, updateWings, verityBillboard, verityFace, verityGo, verityScene, webWrap };
};
