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
const B_ST = ['sleep', 'intro', 'fight', 'dead'], GATE_X = ABY.x - 82, BOSS_HP = 1500;
const CH_MULT = { ukyo: 1.1, redbird: 1.25, capitan: 1.15 };     // lo mismo que el juego: algunos peleadores hacen más daño al Kraken
const angD = (a, b) => Math.abs(((a - b) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
const TAU = Math.PI * 2;
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

// ---- el Kraken: 8 tentáculos con vida, fases, 10 ataques con aviso, gran golpe cada 4 ataques que lo deja cansado (misma lógica que js/abismo.js)
function newBoss() {
  return { st: 'sleep', hp: BOSS_HP, mh: BOSS_HP, yaw: 0, phase2: false, vuln: 0, exposed: 0, stagger: 0, tired: 0, count: 0, last: '', cd: 3.2, wind: null, atk: null, t: 0, idle: 0,
    arms: Array.from({ length: 8 }, (_, k) => ({ ang: k / 8 * TAU, hp: 60, max: 60, sev: false, regrow: 0, busy: false })), zones: [], ink: new Map(), events: [], evSeq: 0, hitT: new Map() };
}

function create(opts) {
  // opts: players() -> [{ id, x, y, z, alive, ab, st }], damage(id, { dm, dx, dz, kb }), log(msg)
  const log = opts.log || (() => { });
  let seed = (Math.random() * 2 ** 31) | 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = (a, b) => a + rnd() * (b - a);
  const S = { boss: newBoss(), mobs: new Map(), nextId: 0, groups: null, key: { st: 'none', holder: '', x: 0, z: 0 }, door: false, bolts: [], ev: { on: false, until: 0, cleared: false }, evTimer: FIRST_EVENT_S, empty: 0, evSeq: 0, events: [], rate: new Map(), t: 0 };

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
  function resetRun() { S.boss = newBoss(); S.mobs.clear(); S.groups = null; S.bolts = []; S.key = { st: 'none', holder: '', x: 0, z: 0 }; S.door = false; }
  function startEvent(now) { if (S.ev.on) return false; S.ev = { on: true, until: now + EVENT_MS, cleared: false }; S.evTimer = R(300, 540); log('evento del Kraken: empieza'); return true; }
  function kill(m, by) {
    if (m.dead) return; m.dead = .001; m.hp = 0;
    if (m.cap) { S.key = { st: 'ground', holder: '', x: m.x, z: m.z }; log('el capitán cayó: suelta la llave'); }
  }
  const hurt = (p, dm, dx, dz, kb) => opts.damage(p.id, { dm: Math.round(dm * 10) / 10, dx: Math.round(dx * 100) / 100, dz: Math.round(dz * 100) / 100, kb });
  const visual = (m, tgt) => { S.events.push({ s: ++S.evSeq, i: m.id, p: tgt.id, t: S.t }); if (S.events.length > 24) S.events.shift(); };

  // ===== Kraken =====
  const armAng = a => a.ang - S.boss.yaw;                       // ángulo (en el suelo) donde está cada tentáculo, según hacia dónde mira el Kraken
  const aliveArms = () => S.boss.arms.filter(a => !a.sev);
  const bossEvent = e => { const B = S.boss; B.events.push(Object.assign({ s: ++B.evSeq, t: S.t }, e)); if (B.events.length > 16) B.events.shift(); };
  function nearestArm(ang, avoidBusy) { let best = null, bd = 9; for (const a of S.boss.arms) { if (a.sev || (avoidBusy && a.busy)) continue; const d = angD(armAng(a), ang); if (d < bd) { bd = d; best = a; } } return best ? { a: best, d: bd } : null; }
  function wakeBoss() {
    const B = S.boss; Object.assign(B, newBoss()); B.st = 'intro'; B.cd = 3.2; log('el Kraken despierta');
  }
  function severArm(a) {
    const B = S.boss; a.sev = true; a.regrow = 25; a.busy = false; B.wind = null; if (B.atk) { if (B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.cd = 2.4; }
    B.stagger = 2.6; B.vuln = Math.max(B.vuln, 3.8); B.hp = Math.max(1, B.hp - 35); if (!aliveArms().length) B.exposed = 9; log('tentáculo cortado');
  }
  // un jugador golpea al Kraken: el servidor elige el tentáculo más cercano al jugador y ajusta el daño al cuerpo
  function bossHit(p, msg, now) {
    const B = S.boss; if (!p || !p.ab || !p.alive || B.st !== 'fight') return;
    const r = B.hitT.get(p.id) || []; const rr = r.filter(t => now - t < 1000); if (rr.length >= 14) { B.hitT.set(p.id, rr); return; } rr.push(now); B.hitT.set(p.id, rr);
    if (Math.hypot(p.x - ABY.x, p.z - ABY.z) > 85) return;
    const dm = num(msg.dm, 0, 60), raw = num(msg.raw, 0, 60, dm); if (!dm && !raw) return;
    const ang = Math.atan2(p.z - ABY.z, p.x - ABY.x), near = nearestArm(ang, false);
    if (near && near.d < 1.5) { near.a.hp -= raw * (near.d < .9 ? 1.6 : .8); if (near.a.hp <= 0) severArm(near.a); }
    const n = aliveArms().length, mult = (B.vuln > 0 || B.exposed > 0 ? 2.2 : n >= 4 ? .45 : n > 0 ? .8 : 1.8) * (CH_MULT[p.ch] || 1);
    B.hp -= dm * mult;
    if (B.hp <= 0) { B.hp = 0; B.st = 'dead'; B.atk = null; B.wind = null; S.ev.cleared = true; log(`${p.id} derrotó al Kraken`); }
  }
  const ATK_POOL = () => { const B = S.boss, arms = aliveArms().length; return ['slam', 'ink', 'suction', 'whip', 'rocks', 'shock', 'grab'].concat(arms >= 3 ? ['sweep'] : []).concat(arms >= 4 ? ['spin'] : []).concat(B.phase2 ? ['beam', 'slam', 'rocks', 'spin', 'shock', 'grab'] : []).filter(n => n !== B.last); };
  const near2d = (p, x, z) => Math.hypot(p.x - x, p.z - z);
  const rx = v => Math.round(v * 10) / 10;
  function makeAtk(name, sig, ps) {
    const B = S.boss, ph2 = B.phase2, hit = (p, dm, dx, dz, kb) => hurt(p, dm, dx, dz, kb);
    switch (name) {
      case 'slam': {
        const arms = aliveArms(); if (!arms.length) return null;
        const n = Math.min(arms.length, 1 + Math.floor(arms.length / 3) + (ph2 ? 2 : 0) + (sig ? 2 : 0)), hits = [];
        for (let i = 0; i < n; i++) {
          const p = ps.length ? ps[i % ps.length] : null; let x = p ? p.x + R(-3, 3) : ABY.x + R(-14, 14), z = p ? p.z + R(-3, 3) : ABY.z + R(-14, 14);
          const dx = x - ABY.x, dz = z - ABY.z, d = Math.hypot(dx, dz); if (d > 34) { x = ABY.x + dx / d * 34; z = ABY.z + dz / d * 34; }
          const nr = nearestArm(Math.atan2(z - ABY.z, x - ABY.x), true); if (!nr) continue; nr.a.busy = true; hits.push({ x, z, at: .85 + i * .5, done: false, arm: B.arms.indexOf(nr.a) });
        }
        if (!hits.length) return null;
        return { name, sig, dur: .85 + hits.length * .5 + 1.3, t: 0, pp: { h: hits.map(h => [rx(h.x), rx(h.z), h.arm]) },
          upd(dt) { for (const h of hits) if (!h.done && this.t >= h.at) { h.done = true; for (const p of ps) { const dx = p.x - h.x, dz = p.z - h.z, d = Math.hypot(dx, dz); if (d < 6.6 && p.y < ABY.y + 3.4) hit(p, 20, dx / (d || 1), dz / (d || 1), 10); } } },
          cleanup() { for (const h of hits) B.arms[h.arm].busy = false; } };
      }
      case 'sweep': {
        const p0 = ps[0], dirn = rnd() < .5 ? 1 : -1, a0 = p0 ? Math.atan2(p0.z - ABY.z, p0.x - ABY.x) - 1.2 * dirn : R(0, 6.28), done = new Set();
        return { name, sig, dur: 1.2 + 2.7, t: 0, pp: { a: rx(a0 * 100) / 100, d: dirn },
          upd() { if (this.t < 1.2) return; const sp = ph2 ? 2.7 : 2.2, a = a0 + dirn * (this.t - 1.2) * sp, cx = Math.cos(a), cz = Math.sin(a);
            for (const p of ps) { if (done.has(p.id)) continue; const dx = p.x - ABY.x, dz = p.z - ABY.z, along = dx * cx + dz * cz, off = Math.abs(-dx * cz + dz * cx); if (along > 3 && along < ABY.R && off < 2.4 && p.y < ABY.y + 2.0) { done.add(p.id); hit(p, 16, -cz * dirn, cx * dirn, 9); } } },
          cleanup() { if (B.st === 'fight') B.vuln = Math.max(B.vuln, 2.2); } };
      }
      case 'whip': {
        const p0 = ps[0], a0 = p0 ? Math.atan2(p0.z - ABY.z, p0.x - ABY.x) : R(0, 6.28), half = .95; let fired = false;
        return { name, sig, dur: 2.8, t: 0, pp: { a: Math.round(a0 * 100) / 100 },
          upd() { if (!fired && this.t >= 1.4) { fired = true; for (const p of ps) { const dx = p.x - ABY.x, dz = p.z - ABY.z, d = Math.hypot(dx, dz); if (d < 54 && d > 3 && angD(Math.atan2(dz, dx), a0) < half && p.y < ABY.y + 2.4) hit(p, 22, dx / (d || 1), dz / (d || 1), 12); } } }, cleanup() { } };
      }
      case 'rocks': {
        const n = ph2 ? 12 : 8, rocks = [];
        for (let i = 0; i < n; i++) { const p = ps.length && i % 2 === 0 ? ps[i % ps.length] : null, a = R(0, 6.28), d = R(4, 46); rocks.push({ x: p ? p.x + R(-4, 4) : ABY.x + Math.cos(a) * d, z: p ? p.z + R(-4, 4) : ABY.z + Math.sin(a) * d, at: .8 + i * .28, done: false }); }
        return { name, sig, dur: .8 + n * .28 + 1, t: 0, pp: { r: rocks.map(r => [rx(r.x), rx(r.z)]) },
          upd() { for (const r of rocks) if (!r.done && this.t >= r.at) { r.done = true; for (const p of ps) { const dx = p.x - r.x, dz = p.z - r.z, d = Math.hypot(dx, dz); if (d < 3.2 && p.y < ABY.y + 2.5) hit(p, 15, dx / (d || 1), dz / (d || 1), 8); } } }, cleanup() { } };
      }
      case 'ink': {
        const n = ph2 ? 5 : 4, zs = [];
        for (let i = 0; i < n; i++) { const p = ps.length ? ps[i % ps.length] : null, a = R(0, 6.28), d = R(0, 7); zs.push({ x: (p ? p.x : ABY.x + R(-25, 25)) + Math.cos(a) * d, z: (p ? p.z : ABY.z + R(-25, 25)) + Math.sin(a) * d, t: 0, life: 7 }); }
        B.zones.push(...zs);
        return { name, sig, dur: 1.8, t: 0, pp: { z: zs.map(z => [rx(z.x), rx(z.z)]) }, upd() { }, cleanup() { } };
      }
      case 'suction': {
        let blast = false;
        return { name, sig, dur: 3.6, t: 0, pp: {},
          upd() { if (!blast && this.t >= 2.8) { blast = true; for (const p of ps) { const dx = p.x - ABY.x, dz = p.z - ABY.z, d = Math.hypot(dx, dz); if (d < 9.5 && p.y < ABY.y + 5) hit(p, 26, dx / (d || 1), dz / (d || 1), 15); } } },
          cleanup() { if (B.st === 'fight') B.vuln = Math.max(B.vuln, 3.2); } };
      }
      case 'beam': {
        const p0 = ps[0]; if (!p0) return null; let tx = p0.x, tz = p0.z, tk = 0;
        return { name, sig, dur: 3.2, t: 0, pp: { p: p0.id },
          upd(dt) { if (this.t < 1.3) { const q = ps.find(p => p.id === p0.id) || p0; tx += (q.x - tx) * Math.min(1, dt * 3); tz += (q.z - tz) * Math.min(1, dt * 3); }
            if (this.t > 1.3 && this.t < 2.6) { tk -= dt; if (tk <= 0) { tk = .22; for (const p of ps) if (Math.hypot(p.x - tx, p.z - tz) < 2.4) hit(p, 9, 0, 0, 3); } } }, cleanup() { } };
      }
      case 'shock': {
        const rings = [0, 1, 2].map(i => ({ start: 1.1 + i * .75, r: 0, hit: new Set() }));
        return { name, sig, dur: 1.1 + 3 * .75 + 3.0, t: 0, pp: {},
          upd(dt) { for (const rg of rings) { if (this.t < rg.start) continue; rg.r += dt * 27; for (const p of ps) { if (rg.hit.has(p.id)) continue; const d = Math.hypot(p.x - ABY.x, p.z - ABY.z); if (Math.abs(d - rg.r) < 2 && p.y < ABY.y + 1.6) { rg.hit.add(p.id); hit(p, 19, (p.x - ABY.x) / (d || 1), (p.z - ABY.z) / (d || 1), 12); } } } },
          cleanup() { if (B.st === 'fight') B.vuln = Math.max(B.vuln, 1.6); } };
      }
      case 'spin': {
        const p0 = ps[0], a0 = p0 ? Math.atan2(p0.z - ABY.z, p0.x - ABY.x) : R(0, 6.28), dirn = rnd() < .5 ? 1 : -1, cool = new Map();
        return { name, sig, dur: 1.4 + 3.6, t: 0, pp: { a: Math.round(a0 * 100) / 100, d: dirn },
          upd() { if (this.t < 1.4) return; const a = a0 + (this.t - 1.4) * (ph2 ? 1.9 : 1.55) * dirn;
            for (let i = 0; i < 3; i++) { const aa = a + i * TAU / 3, cx = Math.cos(aa), cz = Math.sin(aa);
              for (const p of ps) { const dx = p.x - ABY.x, dz = p.z - ABY.z, along = dx * cx + dz * cz, off = Math.abs(-dx * cz + dz * cx), k = p.id + ':' + i; if (along > 4 && along < ABY.R && off < 1.9 && p.y < ABY.y + 1.8 && S.t - (cool.get(k) || -9) > .6) { cool.set(k, S.t); hit(p, 15, -cz * dirn, cx * dirn, 11); } } } },
          cleanup() { if (B.st === 'fight') B.vuln = Math.max(B.vuln, 2.4); } };
      }
      case 'grab': {
        const arms = aliveArms(); if (!ps.length || !arms.length) return null;
        const sorted = [...ps].sort((a, b) => near2d(a, ABY.x, ABY.z) - near2d(b, ABY.x, ABY.z)), p = sorted[ps.length > 1 ? 1 : 0] || sorted[0];
        const nr = nearestArm(Math.atan2(p.z - ABY.z, p.x - ABY.x), true); if (!nr) return null; const arm = nr.a; arm.busy = true;
        let held = false, done = false, ht = 0; const tx = p.x, tz = p.z;
        return { name, sig, dur: 4.2, t: 0, pp: { p: p.id, a: B.arms.indexOf(arm) },
          upd(dt) {
            if (done) return;
            if (!held) { if (this.t > 1.55 && this.t < 1.7) { const q = ps.find(x => x.id === p.id); if (q && q.alive && Math.hypot(q.x - tx, q.z - tz) < 3.6) { held = true; ht = 0; } else done = true; } }
            else { ht += dt; const q = ps.find(x => x.id === p.id); if (!q || arm.sev) { held = false; done = true; return; } if (ht > 1.6) { held = false; done = true; hit(q, 32, 0, 0, 6); } }
          }, cleanup() { arm.busy = false; } };
      }
    }
    return null;
  }
  function beginAttack(ps) {
    const B = S.boss; B.count++; const sig = B.count % 4 === 0 && aliveArms().length > 0; let name = 'slam';
    if (!sig) { const pool = ATK_POOL(); name = pool[(rnd() * pool.length) | 0]; }
    B.last = name; const A = makeAtk(name, sig, ps); if (!A) { B.cd = 1; return; }
    const wd = sig ? 1.7 : B.phase2 ? .65 : .95; B.wind = { t: 0, dur: wd, sig, name, A };
    bossEvent({ n: name, g: sig ? 1 : 0, wd, pp: A.pp });
  }
  function bossTick(dt, ps, inside) {
    const B = S.boss;
    if (B.st === 'sleep') { if (locked() && ps.some(p => p.x > GATE_X)) wakeBoss(); return; }
    if (!inside) { B.idle += dt; if (B.idle > 4 && B.st !== 'dead') { S.boss = newBoss(); log('el Kraken vuelve a dormir'); return; } } else B.idle = 0;
    if (!locked() && B.st !== 'dead') { S.boss = newBoss(); return; }
    const tgt = ps.slice().sort((a, b) => near2d(a, ABY.x, ABY.z) - near2d(b, ABY.x, ABY.z))[0];
    if (tgt && B.st !== 'dead') { const ya = Math.atan2(tgt.x - ABY.x, tgt.z - ABY.z), d = ((ya - B.yaw + Math.PI * 3) % TAU) - Math.PI; B.yaw += d * Math.min(1, dt * (B.stagger > 0 ? .3 : B.wind ? .5 : .9)); }
    for (const a of B.arms) if (a.sev) { a.regrow -= dt; if (a.regrow <= 0) { a.sev = false; a.hp = a.max; } }
    B.vuln = Math.max(0, B.vuln - dt); B.exposed = Math.max(0, B.exposed - dt); B.stagger = Math.max(0, B.stagger - dt); B.tired = Math.max(0, B.tired - dt);
    // tinta en el suelo: quema poco a poco (se manda a agrupado cada ~0.3 s)
    for (let i = B.zones.length - 1; i >= 0; i--) { const z = B.zones[i]; z.t += dt; if (z.t > .9) for (const p of ps) if (Math.hypot(p.x - z.x, p.z - z.z) < 5.5 && p.y < ABY.y + 1.2) B.ink.set(p.id, (B.ink.get(p.id) || 0) + 3.5 * dt); if (z.t >= z.life) B.zones.splice(i, 1); }
    for (const [id, acc] of [...B.ink]) if (acc >= 1.05) { const p = ps.find(q => q.id === id); if (p) hurt(p, acc, 0, 0, 0); B.ink.set(id, 0); }
    if (B.st === 'intro') { B.t += dt; if (B.t > 3.4) B.st = 'fight'; }
    else if (B.st === 'fight') {
      if (!B.phase2 && B.hp < B.mh * .5) { B.phase2 = true; bossEvent({ ph: 2 }); }
      if (B.atk) {
        B.atk.t += dt; B.atk.upd(dt, ps);
        if (B.atk.t >= B.atk.dur) { const sig = B.atk.sig; if (B.atk.cleanup) B.atk.cleanup(); B.atk = null; B.cd = B.phase2 ? R(.9, 1.7) : R(1.7, 2.6); if (sig) { B.stagger = 6.5; B.vuln = Math.max(B.vuln, 6.5); B.tired = 6.5; B.cd = 1.5; } }
      } else if (B.wind) {
        const w = B.wind; w.t += dt; if (w.t >= w.dur) { B.wind = null; B.atk = w.A; }
      } else if (ps.length && B.stagger <= 0) { B.cd -= dt; if (B.cd <= 0) beginAttack(ps); }
    }
  }

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
    bossTick(dt, ps, ins.length > 0);
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
    S.events = S.events.filter(e => S.t - e.t < 3); S.boss.events = S.boss.events.filter(e => S.t - e.t < 3);
  }

  // un jugador le pegó a un monstruo (abh): se valida y se resta la vida aquí
  function hit(p, msg, now) {
    if (!p || !p.ab || !p.alive || p.st !== 'play') return;
    if (+msg.i === 0) return bossHit(p, msg, now);
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
      k: [['none', 'ground', 'held', 'used'].indexOf(S.key.st), S.key.holder, Math.round(S.key.x * 10) / 10, Math.round(S.key.z * 10) / 10], d: S.door ? 1 : 0, g: gm, e: S.events.map(({ t, ...e }) => e),
      b: [B_ST.indexOf(S.boss.st), Math.round(S.boss.hp), S.boss.arms.reduce((q, a, i) => q | (a.sev ? 1 << i : 0), 0), S.boss.phase2 ? 1 : 0, S.boss.vuln > 0 || S.boss.exposed > 0 ? 1 : 0, S.boss.tired > 0 ? 1 : 0, Math.round(S.boss.yaw * 100) / 100],
      bh: S.boss.arms.map(a => Math.round(a.hp)), be: S.boss.events.map(({ t, ...e }) => e), c: S.ev.cleared ? 1 : 0 };
  }
  const eventState = now => ({ t: 'abe', on: S.ev.on ? 1 : 0, rem: S.ev.on ? Math.max(0, Math.round((S.ev.until - now) / 1000)) : 0, cl: S.ev.cleared ? 1 : 0 });
  return { tick, hit, cleared, snapshot, boss: () => S.boss, eventState, startEvent, state: S, locked };
}
module.exports = { create, MOB_T, KINDS };
