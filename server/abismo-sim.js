// ===== EL ABISMO EN EL SERVIDOR: monstruos, capitán, llave, portón y evento del Kraken =====
// Antes los monstruos los calculaba un jugador (el "dueño") y los demás los copiaban. Ahora los lleva el servidor, que es de todos y de nadie:
//   · decide dónde están los monstruos, a quién persiguen, cuándo atacan y cuánta vida tienen
//   · cuando un monstruo le pega a un jugador, el servidor se lo dice a ESE jugador (abd) y lo anota en el árbitro
//   · los golpes de cualquier jugador a un monstruo llegan al servidor (abh), que los valida y resta la vida
//   · la llave del capitán, el portón y el evento del Kraken (cuándo empieza, cuánto dura, si ya lo vencieron) también son del servidor
// Misma lógica que js/abismo.js (misma ruta, mismos números); el juego solo dibuja lo que el servidor manda.
// El Kraken en sí (sus tentáculos y ataques) sigue calculándolo el jugador dueño del abismo; el servidor solo sabe si lo vencieron.
'use strict';
const RUTA = require('./abismo_ruta.json');
const ABY = RUTA.aby, HW = RUTA.hw, PTS = RUTA.pts;
const DOOR = { x: ABY.x - 88, z: ABY.z };
const KINDS = ['crab', 'jelly', 'angler', 'drowned', 'squidling', 'captain'];
const MOB_T = {
  crab: { hp: 40, spd: 5.4, dmg: 9, r: 1.5, rng: 2.8, cd: 1.7, wind: .45, aggro: 24 },
  jelly: { hp: 26, spd: 3.1, dmg: 8, r: 1.6, rng: 5.2, cd: 2.7, wind: .85, aggro: 20 },
  angler: { hp: 48, spd: 6.2, dmg: 13, r: 1.7, rng: 4.2, cd: 2.5, wind: .55, aggro: 28 },
  drowned: { hp: 66, spd: 3.7, dmg: 14, r: 1.1, rng: 2.6, cd: 1.9, wind: .6, aggro: 24 },
  squidling: { hp: 32, spd: 4.2, dmg: 7, r: 1.2, rng: 18, cd: 2.3, wind: .6, aggro: 30, ranged: 1 },
  captain: { hp: 380, spd: 3.5, dmg: 22, r: 2.0, rng: 4.2, cd: 2.1, wind: .85, aggro: 34 },
};
const EVENT_MS = 420000, EVENT_KEEP_MS = 25000, FIRST_EVENT_S = 150;

// ---- ruta del abismo (misma que el juego)
const CUM = [0]; for (let i = 1; i < PTS.length; i++) CUM.push(CUM[i - 1] + Math.hypot(PTS[i][0] - PTS[i - 1][0], PTS[i][1] - PTS[i - 1][1]));
const LEN = CUM[CUM.length - 1];
function abyPath(x, z) {
  let bd = 1e9, bx = 0, bz = 0, bi = 0;
  for (let i = 0; i < PTS.length - 1; i++) { const a = PTS[i], b = PTS[i + 1], dx = b[0] - a[0], dz = b[1] - a[1]; let u = ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1); u = u < 0 ? 0 : u > 1 ? 1 : u; const px = a[0] + dx * u, pz = a[1] + dz * u, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; bx = px; bz = pz; bi = i + u; } }
  return { d: bd, x: bx, z: bz, i: bi };
}
const nearPath = (x, z) => x > ABY.x - 335 && x < ABY.x - 55 && z > ABY.z - 85 && z < ABY.z + 150;
function clampPos(v) {   // los monstruos no salen del pasillo ni de la sala
  const dx = v.x - ABY.x, dz = v.z - ABY.z, d = Math.hypot(dx, dz); if (d <= ABY.R) return v;
  const lim = HW - 1.2; if (nearPath(v.x, v.z)) { const p = abyPath(v.x, v.z); if (p.d <= lim) return v; if (p.d - lim < d - ABY.R) { const k = lim / p.d; v.x = p.x + (v.x - p.x) * k; v.z = p.z + (v.z - p.z) * k; return v; } }
  v.x = ABY.x + dx / d * ABY.R; v.z = ABY.z + dz / d * ABY.R; return v;
}
function pathAt(sd) {
  sd = Math.max(0, Math.min(LEN, sd)); let i = 1; while (i < CUM.length - 1 && CUM[i] < sd) i++;
  const a = PTS[i - 1], b = PTS[i], u = (sd - CUM[i - 1]) / ((CUM[i] - CUM[i - 1]) || 1); let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, tx, tz, nx: -tz, nz: tx };
}
function sdOf(x, z) { const p = abyPath(x, z), i = Math.min(CUM.length - 2, Math.floor(p.i)); return CUM[i] + (p.i - i) * (CUM[i + 1] - CUM[i]); }

const num = (v, a, b, d = 0) => { v = +v; return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

function create(opts) {
  // opts: players() -> [{ id, x, y, z, alive, ab, st }], damage(id, { dm, dx, dz, kb }), log(msg)
  const log = opts.log || (() => { });
  let seed = (Math.random() * 2 ** 31) | 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const S = { mobs: new Map(), nextId: 0, groups: null, key: { st: 'none', holder: '', x: 0, z: 0 }, door: false, bolts: [], ev: { on: false, until: 0, cleared: false }, evTimer: FIRST_EVENT_S, empty: 0, evSeq: 0, events: [], rate: new Map(), t: 0 };

  function planGroups() {
    const g = [], pools = [['crab', 'crab', 'jelly'], ['jelly', 'crab', 'angler'], ['drowned', 'crab', 'jelly', 'squidling'], ['angler', 'drowned', 'squidling'], ['drowned', 'drowned', 'angler', 'squidling', 'jelly'], ['squidling', 'angler', 'drowned', 'drowned']];
    for (let i = 0; i < 12; i++) { const z = .09 + i * .072, pool = pools[Math.min(pools.length - 1, i * pools.length / 12 | 0)], n = 2 + (i / 4 | 0), kinds = []; for (let j = 0; j < n; j++) kinds.push(pool[(rnd() * pool.length) | 0]); g.push({ sd: LEN * z, kinds, spawned: false }); }
    g.push({ sd: LEN * .58, kinds: ['captain', 'drowned', 'drowned'], spawned: false, cap: true }); g.sort((a, b) => a.sd - b.sd); return g;
  }
  function spawn(kind, x, z) {
    const T = MOB_T[kind], m = { id: ++S.nextId, k: kind, T, x, z, hx: x, hz: z, yaw: R(0, 6), hp: T.hp, mh: T.hp, wind: 0, cd: R(.6, 1.6), stun: 0, stunImm: 0, lunge: 0, lx: 0, lz: 0, hitDone: false, aggro: false, dot: null, slow: 0, slowK: 1, conf: 0, kx: 0, kz: 0, cap: kind === 'captain', alt: false, spawn: kind === 'captain' ? 1.6 : .9, dead: 0, ph: R(0, 6) };
    clampPos(m); m.hx = m.x; m.hz = m.z; S.mobs.set(m.id, m); return m;
  }
  const inside = ps => ps.filter(p => p.ab);
  const targets = ps => ps.filter(p => p.ab && p.alive && p.st === 'play');
  const locked = () => S.ev.on && !S.ev.cleared;
  function resetRun() { S.mobs.clear(); S.groups = null; S.bolts = []; S.key = { st: 'none', holder: '', x: 0, z: 0 }; S.door = false; }
  function startEvent(now) { if (S.ev.on) return false; S.ev = { on: true, until: now + EVENT_MS, cleared: false }; S.evTimer = R(300, 540); log('evento del Kraken: empieza'); return true; }
  function kill(m, by) {
    if (m.dead) return; m.dead = .001; m.hp = 0;
    if (m.cap) { S.key = { st: 'ground', holder: '', x: m.x, z: m.z }; log('el capitán cayó: suelta la llave'); }
  }
  const hurt = (p, dm, dx, dz, kb) => opts.damage(p.id, { dm: Math.round(dm * 10) / 10, dx: Math.round(dx * 100) / 100, dz: Math.round(dz * 100) / 100, kb });
  const visual = (m, tgt) => { S.events.push({ s: ++S.evSeq, i: m.id, p: tgt.id, t: S.t }); if (S.events.length > 24) S.events.shift(); };

  function attack(m, tgt, ps) {
    const T = m.T, dx = tgt.x - m.x, dz = tgt.z - m.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; visual(m, tgt);
    if (m.k === 'jelly') { for (const p of ps) if (d2(p, m) < T.rng + .8) hurt(p, T.dmg, ux, uz, 3); }
    else if (m.k === 'angler') { m.lunge = .4; m.lx = ux; m.lz = uz; m.hitDone = false; }
    else if (m.k === 'squidling') S.bolts.push({ x: m.x, z: m.z, vx: ux * 15, vz: uz * 15, t: 0, dm: T.dmg });
    else if (m.k === 'captain' && m.alt) { for (const p of ps) if (d2(p, m) < 6.2 + 1) hurt(p, T.dmg * 1.1, ux, uz, 9); }
    else if (d < T.rng + 1.4) hurt(tgt, T.dmg, ux, uz, m.cap ? 7 : 5);
    if (m.cap) m.alt = !m.alt;
  }

  function tick(dt, now, all) {
    S.t += dt;
    const ins = inside(all), ps = targets(all), playing = all.some(p => p.st === 'play');
    // evento del Kraken: empieza solo cada varios minutos (mientras haya gente jugando) y no termina mientras alguien siga dentro sin vencerlo
    if (playing && !S.ev.on) { S.evTimer -= dt; if (S.evTimer <= 0) startEvent(now); }
    if (S.ev.on) {
      if (ins.length && !S.ev.cleared && S.ev.until - now < EVENT_KEEP_MS) S.ev.until = now + EVENT_KEEP_MS;
      if (now >= S.ev.until) { S.ev = { on: false, until: 0, cleared: false }; resetRun(); log('evento del Kraken: termina'); }
    }
    if (!ins.length) { S.empty += dt; if (S.empty > 15 && (S.mobs.size || S.groups || S.key.st !== 'none')) resetRun(); } else S.empty = 0;
    const lk = locked();
    if (lk && !S.groups && ins.length) S.groups = planGroups();
    if (S.groups && lk) for (const gr of S.groups) {
      if (gr.spawned) continue;
      if (ps.some(p => { const q = sdOf(p.x, p.z); return q > gr.sd - 55 && q < gr.sd + 12 && abyPath(p.x, p.z).d < 40; })) {
        gr.spawned = true; const q = pathAt(gr.sd);
        gr.kinds.forEach(k => { const u = (rnd() - .5) * 10, v = (rnd() - .5) * 12; spawn(k, q.x + q.tx * u + q.nx * v, q.z + q.tz * u + q.nz * v); });
      }
    }
    if (!lk) for (const m of S.mobs.values()) if (!m.dead) { m.hp = 0; m.dead = .001; }
    // monstruos
    for (const m of [...S.mobs.values()]) {
      const T = m.T;
      if (m.dead) { m.dead += dt; if (m.dead > (m.cap ? 1.4 : .75)) S.mobs.delete(m.id); continue; }
      if (m.spawn > 0) { m.spawn -= dt; continue; }
      if (m.stunImm > 0) m.stunImm -= dt;
      if (m.dot) { m.dot.t -= dt; m.hp -= m.dot.dps * dt; if (m.hp <= 0) { kill(m); continue; } if (m.dot.t <= 0) m.dot = null; }
      if (m.slow > 0) m.slow -= dt; if (m.conf > 0) m.conf -= dt;
      let tg = null, bd = 1e9; for (const p of ps) { const d = d2(p, m); if (d < bd) { bd = d; tg = p; } }
      let mx = 0, mz = 0; const sp = T.spd * (m.slow > 0 ? m.slowK : 1) * (m.dot && m.k === 'crab' ? 1.5 : 1);
      if (tg && bd < T.aggro) m.aggro = true; else if (!tg || bd > T.aggro * 2.2) m.aggro = false;
      if (m.stun > 0) { m.stun -= dt; m.wind = 0; m.lunge = 0; }
      else if (m.conf > 0) { const a = S.t * 3 + m.ph; mx = Math.cos(a) * sp; mz = Math.sin(a * 1.3) * sp; m.yaw = Math.atan2(mx, mz); }
      else if (m.lunge > 0) { m.lunge -= dt; mx = m.lx * 17; mz = m.lz * 17; if (!m.hitDone && tg && d2(tg, m) < 2.6) { m.hitDone = true; hurt(tg, T.dmg, m.lx, m.lz, 8); } }
      else if (m.wind > 0) { m.wind -= dt; if (tg) m.yaw = Math.atan2(tg.x - m.x, tg.z - m.z); if (m.wind <= 0 && tg) attack(m, tg, ps); }
      else if (m.aggro && tg) {
        const dx = tg.x - m.x, dz = tg.z - m.z, dd = Math.hypot(dx, dz) || 1; m.yaw = Math.atan2(dx, dz);
        const want = T.ranged ? 12 : T.rng * .75;
        if (dd > want) { mx = dx / dd * sp; mz = dz / dd * sp; } else if (T.ranged && dd < 8) { mx = -dx / dd * sp * .7; mz = -dz / dd * sp * .7; }
        m.cd -= dt; if (m.cd <= 0 && dd < (T.ranged ? T.rng : T.rng + .6)) { m.wind = T.wind; m.cd = T.cd * R(.85, 1.25); }
      } else { const a = S.t * .4 + m.ph; mx = (m.hx + Math.cos(a) * 3 - m.x) * .5; mz = (m.hz + Math.sin(a * 1.3) * 3 - m.z) * .5; m.yaw = Math.atan2(mx, mz) || m.yaw; }
      m.x += (mx + m.kx) * dt; m.z += (mz + m.kz) * dt; const k = Math.exp(-6 * dt); m.kx *= k; m.kz *= k; clampPos(m);
    }
    // proyectiles de los calamarines
    for (let i = S.bolts.length - 1; i >= 0; i--) {
      const b = S.bolts[i]; b.t += dt; b.x += b.vx * dt; b.z += b.vz * dt; let hit = false;
      for (const p of ps) if (Math.hypot(p.x - b.x, p.z - b.z) < 1.3 && p.y < ABY.y + 3.4) { hurt(p, b.dm, Math.sign(b.vx), Math.sign(b.vz), 3); hit = true; break; }
      if (hit || b.t > 2.4) S.bolts.splice(i, 1);
    }
    // llave y portón
    const K = S.key;
    if (K.st === 'ground') { for (const p of ps) if (Math.hypot(p.x - K.x, p.z - K.z) < 2.8) { K.st = 'held'; K.holder = p.id; log(`${p.id} recogió la llave`); break; } }
    else if (K.st === 'held') {
      const h = ps.find(p => p.id === K.holder);
      if (!h) { const last = all.find(p => p.id === K.holder); if (last) { K.x = last.x; K.z = last.z; } K.st = 'ground'; K.holder = ''; }
      else { K.x = h.x; K.z = h.z; if (!S.door && Math.hypot(h.x - DOOR.x, h.z - DOOR.z) < 9) { S.door = true; K.st = 'used'; log('el portón se abre'); } }
    }
    S.events = S.events.filter(e => S.t - e.t < 3);
  }

  // un jugador le pegó a un monstruo (abh): se valida y se resta la vida aquí
  function hit(p, msg, now) {
    if (!p || !p.ab || !p.alive || p.st !== 'play') return;
    const r = S.rate.get(p.id) || []; const rr = r.filter(t => now - t < 1000); if (rr.length >= 14) { S.rate.set(p.id, rr); return; } rr.push(now); S.rate.set(p.id, rr);
    const m = S.mobs.get(+msg.i); if (!m || m.dead || m.spawn > 0) return;
    if (d2(p, m) > 45) return;     // demasiado lejos para pegarle
    const dm = num(msg.dm, 0, 60); if (!dm) return;
    m.hp -= dm; m.aggro = true;
    const big = dm > m.T.hp * .06;
    if (!(m.stunImm > 0) && (!m.cap || big)) { m.stun = Math.max(m.stun, m.cap ? .3 : .5); m.wind = 0; m.lunge = 0; m.stunImm = m.cap ? 1.6 : 1.0; }
    const fx = msg.fx && typeof msg.fx === 'object' ? msg.fx : {}; let kicked = false;
    if (Array.isArray(fx.dot)) m.dot = { dps: num(fx.dot[0], 0, 8), t: num(fx.dot[1], 0, 8) };
    if (Array.isArray(fx.slow)) { m.slowK = num(fx.slow[0], .3, 1, 1); m.slow = num(fx.slow[1], 0, 4); }
    if (fx.stun) { m.stun = Math.max(m.stun, num(fx.stun, 0, 1.2)); m.wind = 0; }
    if (fx.conf) { m.conf = num(fx.conf, 0, 3); m.wind = 0; }
    if (Array.isArray(fx.kb)) { const kx = num(fx.kb[0], -14, 14), kz = num(fx.kb[1], -14, 14); if (kx || kz) { m.kx = kx; m.kz = kz; kicked = true; } }
    if (!kicked && !m.cap) { const dx = m.x - p.x, dz = m.z - p.z, d = Math.hypot(dx, dz) || 1; m.kx = dx / d * 4; m.kz = dz / d * 4; }
    if (m.hp <= 0) kill(m, p.id);
  }
  function cleared(p) { if (p && p.ab && S.ev.on && !S.ev.cleared) { S.ev.cleared = true; log(`${p.id} venció al Kraken`); } }

  // lo que se manda a los jugadores que están dentro del abismo (misma forma que el estado del dueño en el juego)
  function snapshot() {
    let gm = 0; if (S.groups) S.groups.forEach((g, i) => { if (g.spawned && i < 30) gm |= 1 << i; });
    return { t: 'ab', v: 1,
      m: [...S.mobs.values()].filter(m => !m.dead).slice(0, 40).map(m => [m.id, KINDS.indexOf(m.k), Math.round(m.x * 10) / 10, Math.round(m.z * 10) / 10, Math.round(m.yaw * 10) / 10, Math.round(m.hp), (m.wind > 0 ? 1 : 0) | (m.stun > 0 ? 2 : 0) | (m.cap ? 4 : 0)]),
      k: [['none', 'ground', 'held', 'used'].indexOf(S.key.st), S.key.holder, Math.round(S.key.x * 10) / 10, Math.round(S.key.z * 10) / 10], d: S.door ? 1 : 0, g: gm, e: S.events.map(({ t, ...e }) => e) };
  }
  const eventState = now => ({ t: 'abe', on: S.ev.on ? 1 : 0, rem: S.ev.on ? Math.max(0, Math.round((S.ev.until - now) / 1000)) : 0, cl: S.ev.cleared ? 1 : 0 });
  return { tick, hit, cleared, snapshot, eventState, startEvent, state: S, locked };
}
module.exports = { create, MOB_T, KINDS };
