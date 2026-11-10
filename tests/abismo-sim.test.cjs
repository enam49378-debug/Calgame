// Pruebas del simulador del abismo del servidor (server/abismo-sim.js). Ejecutar:  node tests/abismo-sim.test.cjs
'use strict';
const assert = require('assert');
const Sim = require('../server/abismo-sim.js');
let n = 0; const ok = (name, fn) => { try { fn(); n++; console.log('  ok  ' + name); } catch (e) { console.error('  FALLA  ' + name + '\n   ', e.message); process.exitCode = 1; } };

function room() {
  const dmg = []; const sim = Sim.create({ log: () => { }, damage: (id, d) => dmg.push({ id, ...d }) });
  const players = [{ id: 'a', x: -299, y: -90, z: 835, alive: true, ab: 1, st: 'play' }, { id: 'b', x: -297, y: -90, z: 833, alive: true, ab: 1, st: 'play' }];
  let now = 1000;
  const step = (sec, cb) => { for (let i = 0; i < sec * 20; i++) { now += 50; if (cb) cb(); sim.tick(.05, now, players); } };
  return { sim, dmg, players, step, now: () => now };
}

ok('sin evento del Kraken no hay monstruos; con evento aparecen en grupos al avanzar', () => {
  const r = room(); r.step(5); assert.strictEqual(r.sim.snapshot().m.length, 0);
  assert.ok(r.sim.startEvent(r.now())); r.step(3);
  const m = r.sim.snapshot().m; assert.ok(m.length >= 2, 'grupo 1: ' + m.length); assert.ok(m.every(x => x[5] > 0));
});
ok('todos los jugadores reciben el mismo estado y se ve el evento', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3);
  const ev = r.sim.eventState(r.now()); assert.strictEqual(ev.on, 1); assert.ok(ev.rem > 400);
});
ok('un monstruo cercano ataca y el daño sale hacia el jugador que le toca', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3);
  const m = r.sim.snapshot().m[0]; r.players[0].x = m[2] + 1; r.players[0].z = m[3]; r.step(6);
  assert.ok(r.dmg.length > 0, 'hubo daño'); assert.ok(r.dmg.every(d => d.dm > 0 && ['a', 'b'].includes(d.id)));
  assert.ok(r.sim.snapshot().e.length > 0, 'evento de ataque visible para todos');
});
ok('un golpe válido baja la vida compartida; muy lejos o demasiado seguido no cuenta', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3);
  const m0 = r.sim.snapshot().m[0], id = m0[0], hp0 = m0[5];
  r.players[0].x = m0[2] + 2; r.players[0].z = m0[3];
  r.sim.hit(r.sim.state.mobs.size ? { ...r.players[0] } : null, { i: id, dm: 10 }, r.now());
  assert.strictEqual(r.sim.state.mobs.get(id).hp, hp0 - 10);
  r.players[1].x = m0[2] + 200; r.sim.hit({ ...r.players[1] }, { i: id, dm: 10 }, r.now() + 2000);
  assert.strictEqual(r.sim.state.mobs.get(id).hp, hp0 - 10, 'lejos: no cuenta');
  for (let i = 0; i < 30; i++) r.sim.hit({ ...r.players[0] }, { i: id, dm: 1 }, r.now() + 4000);
  assert.ok(r.sim.state.mobs.get(id).hp > hp0 - 10 - 20, 'ráfaga imposible limitada');
});
ok('un golpe interrumpe el ataque del monstruo', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3);
  const m = r.sim.state.mobs.values().next().value; m.spawn = 0; m.wind = .5; m.stunImm = 0; r.players[0].x = m.x + 1; r.players[0].z = m.z;
  r.sim.hit({ ...r.players[0] }, { i: m.id, dm: 8 }, r.now()); assert.strictEqual(m.wind, 0); assert.ok(m.stun > 0);
});
ok('el capitán suelta la llave, quien la lleva al portón lo abre', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(1);
  const cap = r.sim.state; const c = [...cap.mobs.values()].find(x => x.cap) || (() => { const x = [...cap.mobs.values()][0]; x.cap = true; return x; })();
  c.spawn = 0; r.sim.hit({ ...r.players[0], x: c.x + 2, z: c.z }, { i: c.id, dm: 60 }, r.now()); c.hp = 0; r.players[0].x = c.x; r.players[0].z = c.z;
  r.sim.hit({ ...r.players[0] }, { i: c.id, dm: 60 }, r.now() + 2000); r.step(1);
  assert.ok(['ground', 'held'].includes(r.sim.state.key.st), 'llave: ' + r.sim.state.key.st);
  r.players[0].x = r.sim.state.key.x; r.players[0].z = r.sim.state.key.z; r.step(1); assert.strictEqual(r.sim.state.key.st, 'held');
  r.players[0].x = -88; r.players[0].z = 720; r.step(1); assert.strictEqual(r.sim.state.door, true); assert.strictEqual(r.sim.snapshot().d, 1);
});
ok('vencer al Kraken da por superado el evento: los monstruos desaparecen', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3); assert.ok(r.sim.snapshot().m.length > 0);
  r.sim.cleared({ ...r.players[0] }); r.step(2); assert.strictEqual(r.sim.snapshot().m.length, 0); assert.strictEqual(r.sim.eventState(r.now()).cl, 1);
});
ok('el abismo vacío se reinicia', () => {
  const r = room(); r.sim.startEvent(r.now()); r.step(3); r.players.forEach(p => p.ab = 0); r.step(17);
  assert.strictEqual(r.sim.state.mobs.size, 0); assert.strictEqual(r.sim.state.groups, null);
});
// ---- el Kraken
function bossRoom() { const r = room(); r.sim.startEvent(r.now()); r.players.forEach(p => { p.x = -60; p.z = 720; p.y = -90; }); r.players[1].x = 30; return r; }
ok('el Kraken despierta al cruzar el portón y entra en combate tras la intro', () => {
  const r = bossRoom(); r.step(1); assert.strictEqual(r.sim.snapshot().b[0], 1, 'intro'); r.step(4); assert.strictEqual(r.sim.snapshot().b[0], 2, 'combate');
});
ok('cada ataque avisa antes con un evento y hace daño a quien está dentro', () => {
  const r = bossRoom(); r.step(5); const ev = [];
  r.step(30, () => { for (const e of r.sim.snapshot().be) if (!ev.find(x => x.s === e.s)) ev.push(e); });
  assert.ok(ev.length >= 3, 'ataques: ' + ev.length); assert.ok(ev.every(e => e.n && e.wd > 0), 'todos con pre-animación'); assert.ok(r.dmg.length > 0, 'daño a jugadores');
});
ok('cada 4.º ataque es el gran golpe y deja al Kraken cansado', () => {
  const r = bossRoom(); r.step(5); const ev = []; let tired = false;
  r.step(80, () => { const sn = r.sim.snapshot(); for (const e of sn.be) if (!ev.find(x => x.s === e.s)) ev.push(e); if (sn.b[5]) tired = true; });
  const sig = ev.filter(e => e.g); assert.ok(sig.length >= 1 && sig[0].n === 'slam', 'gran golpe'); assert.strictEqual(ev.indexOf(sig[0]), 3, 'es el 4.º'); assert.ok(tired, 'quedó cansado');
});
ok('golpear al Kraken corta tentáculos y baja su vida compartida', () => {
  const r = bossRoom(); r.step(5); const B = r.sim.boss(), hp0 = B.hp;
  const p = { ...r.players[0], x: -60, z: 720, ch: 'javi' };
  for (let i = 0; i < 6; i++) r.sim.hit(p, { i: 0, dm: 6, raw: 60 }, r.now() + i * 100);
  assert.ok(B.hp < hp0, 'bajó la vida'); assert.ok(B.arms.some(a => a.sev), 'cortó un tentáculo'); assert.ok(r.sim.snapshot().b[2] > 0, 'se ve en el estado');
});
ok('vencer al Kraken da la victoria a todos', () => {
  const r = bossRoom(); r.step(5); const B = r.sim.boss(); B.hp = 5; B.arms.forEach(a => { a.sev = true; });
  r.sim.hit({ ...r.players[0], ch: 'javi' }, { i: 0, dm: 50, raw: 50 }, r.now()); assert.strictEqual(r.sim.snapshot().b[0], 3); assert.strictEqual(r.sim.snapshot().c, 1);
});
console.log(`\n${n} pruebas del simulador del abismo pasaron`);
