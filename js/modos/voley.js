// Minijuego: vóley playa
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_MODOS = window.CF_MODOS || {};

window.CF_MODOS.crearVoley = function crearVoley(D) {
  'use strict';
  const { CITY_GRAD, DUMMY_CH, Fighter, G, NET, V3, aiParams, burst, cam, chestOf, clamp, endAction, fwd, groundAt, playSnd, r2, ringAt, scene, shakeFrom, showBanner } = D;

// Se entra pisando una de las dos plataformas de la cancha. Con otro jugador en la plataforma contraria es 1 contra 1 entre humanos
// (el que entró primero a la sala manda la física de la pelota y la publica; el otro envía sus golpes); si nadie se une, juega un bot.
const VBC = { x: 64, z: 83, hw: 4.5, hl: 8.5, net: 2.43, g: 13, r: .34, win: 7 };
const VB = { on: false, mode: '', role: '', my: '', opp: null, bot: null, padT: 0, botT: 0, ph: 0, t: 0, sc: { N: 0, S: 0 }, srv: 'N', last: '', since: 9, id: 0, seq: 0, pt: 0, ptW: '', ptWhy: '',
  vhSeq: 0, lastVh: 0, vhOut: null, ready: false, snapS: -1, botMiss: false, over: '' };
const VB_PADS = { N: { x: VBC.x, z: VBC.z - 12.4 }, S: { x: VBC.x, z: VBC.z + 12.4 } };
const VB_NEUTRAL = () => ({ mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false });
const vbOther = t => t === 'N' ? 'S' : 'N';
function vbInit() {
  if (VB.ready) return; VB.ready = true;
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const g = cv.getContext('2d');
  ['#e8453c', '#ffffff', '#2f7fd6', '#ffd23f', '#ffffff', '#3bb36b'].forEach((c, i) => { g.fillStyle = c; g.fillRect(i * 128 / 6, 0, 128 / 6 + 1, 64); });
  VB.ball = { p: new V3(), v: new V3(), mesh: new THREE.Mesh(new THREE.SphereGeometry(VBC.r, 18, 12), new THREE.MeshToonMaterial({ map: new THREE.CanvasTexture(cv), gradientMap: CITY_GRAD })) };
  VB.ball.mesh.castShadow = true; VB.ball.mesh.visible = false; scene.add(VB.ball.mesh);
  VB.shadow = new THREE.Mesh(new THREE.CircleGeometry(.4, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false }));
  VB.shadow.rotation.x = -Math.PI / 2; VB.shadow.visible = false; scene.add(VB.shadow);
  const h = document.createElement('div'); h.id = 'vbhud';
  h.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:30;pointer-events:none;text-align:center;font-family:"Chakra Petch",sans-serif;color:#fff;text-shadow:0 2px 6px #000a;display:none';
  document.body.appendChild(h); VB.hud = h;
}
function vbHud(html) {
  if (!VB.hud) return;
  if (!html) { VB.hud.style.display = 'none'; return; }
  VB.hud.style.display = 'block'; if (VB.hud._h !== html) { VB.hud.innerHTML = html; VB.hud._h = html; }
}
const vbBox = t => `<div style="display:inline-block;background:rgba(10,18,30,.74);border:2px solid #7ad7ff;padding:6px 16px;border-radius:6px;font-weight:700;font-size:18px">${t}</div>`;
function vbNames() { const me = (G.player && G.player.name) || 'Tú', op = VB.opp ? VB.opp.name : 'Bot'; return { N: VB.my === 'N' ? me : op, S: VB.my === 'S' ? me : op }; }
function vbScoreHud(extra) {
  const n = vbNames();
  return `<div style="display:inline-flex;gap:14px;align-items:center;background:rgba(10,18,30,.74);border:2px solid #7ad7ff;padding:6px 18px;border-radius:6px;font-weight:700;font-size:20px"><span style="color:#ffd23f">${n.N}</span><b style="font-size:30px">${VB.sc.N} – ${VB.sc.S}</b><span style="color:#ff9a9a">${n.S}</span></div>` +
    `<div style="margin-top:6px;font-size:17px">${extra || ''}</div>`;
}
function vbSpot(team, serving) { const d = team === 'N' ? -1 : 1; return serving ? { x: VBC.x, z: VBC.z + d * (VBC.hl + 1.3) } : { x: VBC.x, z: VBC.z + d * 5 }; }
function vbPlace() {   // mi jugador (y el bot) a su puesto de saque o de recepción
  const p = G.player, me = vbSpot(VB.my, VB.srv === VB.my);
  p.pos.set(me.x, groundAt(me.x, me.z), me.z); p.vel.set(0, 0, 0); p.yaw = p.prevYaw = VB.my === 'N' ? 0 : Math.PI; cam.yaw = p.yaw; if (p.action) endAction(p);
  if (VB.bot) { const bt = vbOther(VB.my), s = vbSpot(bt, VB.srv === bt); VB.bot.pos.set(s.x, 0, s.z); VB.bot.vel.set(0, 0, 0); VB.bot.yaw = VB.bot.prevYaw = bt === 'N' ? 0 : Math.PI; }
}
function vbServe() {   // solo manda la física: el que juega contra el bot o el anfitrión del 1 contra 1
  VB.ph = 1; VB.t = 0; VB.last = ''; VB.botMiss = Math.random() < .18; VB.ball.v.set(0, 0, 0);
  vbPlace();
}
function vbStart(team, other, role) {
  vbInit();
  Object.assign(VB, { on: true, my: team, role, opp: other || null, mode: other ? 'pvp' : 'bot', sc: { N: 0, S: 0 }, srv: Math.random() < .5 ? 'N' : 'S', ph: 0, t: 0, last: '', pt: 0, snapS: -1, lastVh: 0, vhSeq: 0, vhOut: null, over: '', since: 9 });
  VB.id = role === 'host' ? Math.floor(performance.now()) : 0;
  if (!other) vbSpawnBot(vbOther(team));
  VB.ball.mesh.visible = true; VB.shadow.visible = true;
  showBanner('VÓLEY PLAYA', '#7ad7ff', `Primero a ${VBC.win} · clic golpea · Espacio+clic remata`);
  playSnd('whistle', .7);
  if (role === 'host') vbServe();
}
function vbSpawnBot(team) {
  const d = new Fighter({ name: 'Bot Playa', ch: DUMMY_CH, lvlVar: 0 });
  d.dummy = 'vb'; d.vbBot = true; d.iframes = 1e9; d.flourT = 1e9; d.ai.P = aiParams(1);
  const s = vbSpot(team, false); d.pos.set(s.x, 0, s.z); d.home = d.pos.clone(); d.yaw = d.prevYaw = team === 'N' ? 0 : Math.PI;
  G.fighters.push(d); VB.bot = d; VB.opp = d; burst(chestOf(d), 24, DUMMY_CH.color, 6, .2, .6, -.2);
}
function vbEnd(why) {
  if (VB.bot) { try { VB.bot.dispose(); } catch (e) { } const k = G.fighters.indexOf(VB.bot); if (k >= 0) G.fighters.splice(k, 1); VB.bot = null; }
  const was = VB.on; VB.on = false; VB.opp = null; VB.padT = 0; VB.botT = 0; VB.ph = 0;
  if (VB.ball) { VB.ball.mesh.visible = false; VB.shadow.visible = false; }
  vbHud(null);
  if (was && why === 'rival') showBanner('VÓLEY TERMINADO', '#ff9a9a', 'Tu rival se fue');
}
// --- golpe (solo en quien manda la física). pos = posición del jugador; (ax,az) = hacia dónde apunta
function vbHitBall(team, pos, ax, az, jump, tol = 3.2) {
  const B = VB.ball, serve = VB.ph === 1;
  if (VB.ph !== 1 && VB.ph !== 2) return false;
  if (serve) { if (team !== VB.srv) return false; }
  else {
    if (VB.last === team) return false;
    if ((team === 'N' && B.p.z > VBC.z + .8) || (team === 'S' && B.p.z < VBC.z - .8)) return false;
    if (Math.hypot(B.p.x - pos.x, B.p.z - pos.z) > tol || B.p.y > pos.y + 4 || B.p.y < pos.y - .6) return false;
  }
  const dir = team === 'N' ? 1 : -1, spike = !serve && jump && B.p.y > 2 && pos.y > .35, g = VBC.g;
  let T = serve ? 1.75 : spike ? .72 : 1.4;
  const tz = VBC.z + dir * (serve ? 4.5 + Math.random() * 3.5 : spike ? 1.2 + Math.random() * 3.6 : 2.5 + Math.random() * 5);
  const tx = clamp(pos.x + ax * 7 + (Math.random() - .5) * 2.2, VBC.x - VBC.hw + .6, VBC.x + VBC.hw - .6);
  if (serve) B.p.y = Math.max(B.p.y, 1.5);
  let vx = 0, vy = 0, vz = 0;
  for (let k = 0; k < 9; k++) {
    vx = (tx - B.p.x) / T; vz = (tz - B.p.z) / T; vy = (VBC.r - B.p.y + .5 * g * T * T) / T;
    const tn = (VBC.z - B.p.z) / vz;
    if (tn > 0 && tn < T && B.p.y + vy * tn - .5 * g * tn * tn < VBC.net + .6) { T *= 1.13; continue; }
    break;
  }
  B.v.set(vx, vy, vz);
  VB.last = team; VB.since = 0; if (VB.ph === 1) { VB.ph = 2; VB.t = 0; }
  if (team === VB.my) VB.botMiss = Math.random() < .17;
  playSnd('vhit', spike ? 1 : .8, B.p); burst(B.p.clone(), spike ? 14 : 7, spike ? '#ffb347' : '#fff3c4', 5, .13, .3, 0);
  if (spike) { ringAt(B.p.clone(), '#ffb347', 1.6, .3); shakeFrom(B.p, .12); }
  return true;
}
function vbPointFx(w, why) {
  const n = vbNames(), nm = w === 'N' ? n.N : n.S;
  VB.msg = `PUNTO PARA <b style="color:${w === VB.my ? '#7dff9a' : '#ff9a9a'}">${nm}</b> · ${why === 'RED' ? 'tocó la red' : why === 'FUERA' ? 'fuera' : 'cayó al suelo'}`;
  playSnd('whistle', .55);
}
function vbPoint(w, why) {
  VB.sc[w]++; VB.ph = 3; VB.t = 0; VB.pt++; VB.ptW = w; VB.ptWhy = why; VB.srv = w;
  vbPointFx(w, why);
  if (VB.sc[w] >= VBC.win) { VB.ph = 4; vbOver(w); }
}
function vbOver(w) {
  VB.over = w; const won = w === VB.my, p = G.player;
  if (won) { showBanner('¡GANASTE!', '#ffd91a', `Vóley playa ${VB.sc.N} – ${VB.sc.S}`); p.hp = p.maxHp; p.ult = Math.min(100, p.ult + 50); playSnd('applause', .8); }
  else showBanner('PERDISTE', '#ff9a9a', 'Revancha: vuelve a una plataforma');
  VB.t = 0;
}
function vbPin() {   // en el saque la pelota acompaña al sacador
  const B = VB.ball, f = VB.srv === VB.my ? G.player : VB.opp;
  if (f) { B.p.set(f.pos.x + Math.sin(f.yaw) * .5, f.pos.y + 1.55, f.pos.z + Math.cos(f.yaw) * .5); B.v.set(0, 0, 0); }
}
function vbSim(dt) {   // física completa (quien manda)
  const B = VB.ball; VB.t += dt; VB.since += dt;
  if (VB.ph === 1) {
    vbPin();
    if (VB.bot && VB.srv !== VB.my && VB.t > 1.3) vbHitBall(VB.srv, VB.bot.pos, (Math.random() - .5) * .8, 0, false);
    return;
  }
  const n = 3, h = dt / n;
  for (let i = 0; i < n; i++) {
    const pz = B.p.z; B.v.y -= VBC.g * h; B.p.addScaledVector(B.v, h);
    if (VB.ph === 2 && (pz - VBC.z) * (B.p.z - VBC.z) < 0 && Math.abs(B.p.x - VBC.x) < VBC.hw + .6 && B.p.y < VBC.net + VBC.r) { vbPoint(vbOther(VB.last), 'RED'); B.v.z *= -.25; B.v.x *= .5; }
    if (B.p.y <= VBC.r) {
      B.p.y = VBC.r;
      if (VB.ph === 2) {
        const inb = Math.abs(B.p.x - VBC.x) <= VBC.hw && Math.abs(B.p.z - VBC.z) <= VBC.hl, side = B.p.z < VBC.z ? 'N' : 'S';
        vbPoint(inb ? vbOther(side) : vbOther(VB.last), inb ? 'SUELO' : 'FUERA');
      }
      B.v.y = Math.abs(B.v.y) * .45; B.v.x *= .6; B.v.z *= .6; if (B.v.y < 1) B.v.y = 0; playSnd('vland', .5, B.p);
    }
  }
  if (VB.ph === 3 && VB.t > 2) vbServe();
  if (VB.ph === 4 && VB.t > 3.5) vbEnd('fin');
}
function vbGuest(dt) {   // el que no manda: lee el estado que publica el anfitrión
  const B = VB.ball, host = VB.opp, st = host && host.net && host.net.vb;
  if (st && (VB.id === 0 || VB.id === st.id) && st.s !== VB.snapS) {
    VB.snapS = st.s; VB.id = st.id; const prevPh = VB.ph;
    VB.sc.N = st.a; VB.sc.S = st.b; VB.srv = st.sv; VB.ph = st.ph; VB.last = st.lt || '';
    const np = new V3(st.bx, st.by, st.bz);
    if (np.distanceTo(B.p) > 2 || prevPh !== VB.ph) B.p.copy(np); else B.p.lerp(np, .6);
    B.v.set(st.vx, st.vy, st.vz);
    if (VB.ph === 1 && prevPh !== 1) vbPlace();
    if (st.pt !== VB.pt) { VB.pt = st.pt; VB.ptW = st.w; vbPointFx(st.w, st.why); }
    if (VB.ph === 4 && prevPh !== 4) vbOver(st.w);
  }
  VB.t += dt;
  if (VB.ph === 1) vbPin();
  else if (VB.ph >= 2) { B.v.y -= VBC.g * dt; B.p.addScaledVector(B.v, dt); if (B.p.y < VBC.r) { B.p.y = VBC.r; B.v.y = Math.abs(B.v.y) * .45; B.v.x *= .6; B.v.z *= .6; } }
  if (VB.ph === 4 && VB.t > 3.5) vbEnd('fin');
  if (VB.ph === 0 && VB.t > 5) vbEnd('rival');
}
function vbPub() {
  if (!VB.on || VB.role !== 'host' || VB.mode !== 'pvp') return undefined;
  const B = VB.ball;
  return { id: VB.id, s: ++VB.seq, a: VB.sc.N, b: VB.sc.S, sv: VB.srv, ph: VB.ph, bx: r2(B.p.x), by: r2(B.p.y), bz: r2(B.p.z), vx: r2(B.v.x), vy: r2(B.v.y), vz: r2(B.v.z), lt: VB.last, pt: VB.pt, w: VB.ptW, why: VB.ptWhy };
}
function vbPubHit() { return VB.on && VB.role === 'guest' && VB.vhOut && performance.now() - VB.vhOut.t < 2000 ? VB.vhOut : undefined; }
function vbPlayerCtl(f, c) {
  c.skill = -1; c.ult = false;
  if (c.m1 && f.m1cd <= 0 && !f.action && !f.blocking && f.alive && VB.ph > 0) {
    const F = fwd(cam.yaw), jump = !f.onGround;
    if (VB.role === 'host') vbHitBall(VB.my, f.pos, F.x, F.z, jump);
    else { VB.vhSeq++; VB.vhOut = { n: VB.vhSeq, ax: r2(F.x), az: r2(F.z), j: jump ? 1 : 0, t: performance.now() }; }
  }
  return c;
}
function vbPredict() {   // dónde y cuándo bajará la pelota a la altura del golpe
  const B = VB.ball, g = VBC.g, disc = B.v.y * B.v.y + 2 * g * (B.p.y - 1.15), t = disc > 0 ? Math.max(0, (B.v.y + Math.sqrt(disc)) / g) : 0;
  return { t, x: B.p.x + B.v.x * t, z: B.p.z + B.v.z * t };
}
function vbBotCtl(f, dt) {
  const c = VB_NEUTRAL(); if (!VB.on || f !== VB.bot) return c;
  const team = vbOther(VB.my), B = VB.ball, sgn = team === 'N' ? -1 : 1, lo = team === 'N' ? VBC.z - 12.5 : VBC.z + 1.3, hi = team === 'N' ? VBC.z - 1.3 : VBC.z + 12.5;
  const half = z => team === 'N' ? z < VBC.z - .6 : z > VBC.z + .6;
  let tx = VBC.x, tz = VBC.z + sgn * 5, hurry = false;
  if (VB.ph === 1 && VB.srv === team) { const s = vbSpot(team, true); tx = s.x; tz = s.z; }
  else if (VB.ph === 2 && VB.last !== team) {
    const pr = vbPredict();
    if (half(pr.z) && !VB.botMiss) { tx = clamp(pr.x, VBC.x - VBC.hw - 1, VBC.x + VBC.hw + 1); tz = clamp(pr.z, lo, hi); hurry = true; }
    else tx = VBC.x + (B.p.x - VBC.x) * .5;
  }
  const dx = tx - f.pos.x, dz = tz - f.pos.z, d = Math.hypot(dx, dz);
  if (d > .3) { const k = Math.min(1, d / 1.2) * (hurry ? .68 : .55); c.mx = dx / d * k; c.mz = dz / d * k; }
  if (VB.ph === 2 && VB.last !== team && f.m1cd <= 0 && !f.action && half(B.p.z) && !VB.botMiss) {
    if (Math.hypot(B.p.x - f.pos.x, B.p.z - f.pos.z) < 2.7 && B.p.y < 3.6 && B.p.y > .35) {
      const ax = clamp((VBC.x - (G.player.pos.x - VBC.x) * .8 - f.pos.x) / 7 + (Math.random() - .5) * .6, -1, 1);
      if (vbHitBall(team, f.pos, ax, 0, B.p.y > 2.3)) { c.m1 = true; if (B.p.y > 2.3 && f.onGround) c.jump = true; }
    }
  }
  if (VB.ph === 1 && VB.srv === team && VB.t > 1.2 && !f.action) c.m1 = true;
  return c;
}
function vbLobby(p, dt) {
  const at = t => p.alive && Math.hypot(p.pos.x - VB_PADS[t].x, p.pos.z - VB_PADS[t].z) < 1.8 && p.pos.y < 2;
  const team = at('N') ? 'N' : at('S') ? 'S' : '';
  if (!team) { VB.padT = 0; VB.botT = 0; vbHud(null); return; }
  vbInit();
  VB.padT += dt;
  const oth = vbOther(team), remote = G.mp && NET.proxies ? [...NET.proxies.values()].find(px => px.alive && Math.hypot(px.pos.x - VB_PADS[oth].x, px.pos.z - VB_PADS[oth].z) < 2) : null;
  if (VB.padT < 1) { vbHud(vbBox('🏐 Vóley playa · prepárate…')); return; }
  if (remote) {
    const theirs = +(remote.net && remote.net.jt) || Infinity;
    const host = NET.joinT < theirs || (NET.joinT === theirs && String(NET.myPeer) < String(remote.peer));
    vbStart(team, remote, host ? 'host' : 'guest'); return;
  }
  VB.botT += dt;
  const left = Math.ceil(3 - VB.botT);
  vbHud(vbBox(`🏐 Vóley playa · esperando rival (otro jugador en la plataforma de enfrente)… bot en ${Math.max(0, left)}`));
  if (VB.botT >= 3) vbStart(team, null, 'host');
}
function updateVolley(dt) {
  if (G.state !== 'play' || !G.player) { if (VB.on) vbEnd('abort'); vbHud(null); return; }
  const p = G.player;
  if (!VB.on) { if (!G.paused && !G.cine) vbLobby(p, dt); return; }
  if (!p.alive || (VB.opp && !G.fighters.includes(VB.opp)) || (VB.mode === 'bot' && !VB.bot)) { vbEnd(p.alive ? 'rival' : 'abort'); return; }
  if (VB.mode === 'pvp' && VB.opp && Math.hypot(VB.opp.pos.x - VBC.x, VB.opp.pos.z - VBC.z) > 30) { vbEnd('rival'); return; }
  if (VB.role === 'host') {
    vbSim(dt);
    if (VB.mode === 'pvp') {
      const g = VB.opp.net && VB.opp.net.vh;
      if (g && g.n > VB.lastVh) { VB.lastVh = g.n; vbHitBall(vbOther(VB.my), VB.opp.pos, +g.ax || 0, +g.az || 0, !!g.j, 3.9); }
    }
  } else vbGuest(dt);
  // quedarse en la propia mitad; sin daño entre jugadores
  const lo = VB.my === 'N' ? VBC.z - 12.8 : VBC.z + .9, hi = VB.my === 'N' ? VBC.z - .9 : VBC.z + 12.8;
  p.pos.z = clamp(p.pos.z, lo, hi); p.pos.x = clamp(p.pos.x, VBC.x - 8, VBC.x + 8); p.iframes = Math.max(p.iframes, .5);
  if (VB.bot) { const bt = vbOther(VB.my), blo = bt === 'N' ? VBC.z - 12.8 : VBC.z + .9, bhi = bt === 'N' ? VBC.z - .9 : VBC.z + 12.8; VB.bot.pos.z = clamp(VB.bot.pos.z, blo, bhi); VB.bot.pos.x = clamp(VB.bot.pos.x, VBC.x - 8, VBC.x + 8); }
  // pelota y sombra
  const B = VB.ball; B.mesh.position.copy(B.p); B.mesh.rotation.x += B.v.z * dt * .5; B.mesh.rotation.z -= B.v.x * dt * .5;
  VB.shadow.position.set(B.p.x, .06, B.p.z); const sc = clamp(1 - B.p.y / 9, .35, 1); VB.shadow.scale.set(sc, sc, 1); VB.shadow.material.opacity = .15 + .25 * sc;
  // marcador
  let extra = '';
  if (VB.ph === 0) extra = 'Conectando…';
  else if (VB.ph === 1) extra = VB.srv === VB.my ? '¡Tu saque! Haz clic para sacar' : 'Saca el rival: prepárate';
  else if (VB.ph === 3 || VB.ph === 4) extra = VB.msg || '';
  else extra = 'Clic: golpear · Espacio + clic: remate';
  vbHud(vbScoreHud(extra));
}

  return { VB, VBC, VB_NEUTRAL, VB_PADS, updateVolley, vbBotCtl, vbBox, vbEnd, vbGuest, vbHitBall, vbHud, vbInit, vbLobby, vbNames, vbOther, vbOver, vbPin, vbPlace, vbPlayerCtl, vbPoint, vbPointFx, vbPredict, vbPub, vbPubHit, vbScoreHud, vbServe, vbSim, vbSpawnBot, vbSpot, vbStart };
};
