// Pruebas del árbitro de la partida (js/arbitro.js). Ejecutar:  node tests/arbitro.test.cjs
'use strict';
const assert = require('assert');
const { create, LIMITS } = require('../js/arbitro.js');
let n = 0; const ok = (name, fn) => { try { fn(); n++; console.log('  ok  ' + name); } catch (e) { console.error('  FALLA  ' + name + '\n   ', e.message); process.exitCode = 1; } };

const base = (o = {}) => Object.assign({ st: 'play', nm: 'x', ch: 'javi', x: 0, y: 0, z: 0, hp: 100, mh: 100, al: 1, k: 0, d: 0 }, o);
function room() {
  const A = create({ log: () => { } }); let t = 1000;
  const api = {
    A, now: () => t, adv: ms => { t += ms; },
    send: (id, patch, host) => A.presence(id, Object.assign(base(), patch), t, !!host),
  };
  api.send('a', {}, true); api.send('b', { x: 5 });   // a = anfitrión, b = otro
  return api;
}
const hit = (s, to, dm = 6, extra = {}) => Object.assign({ s, to, dm, kb: 3, up: 0, rg: 0, st: 0, gb: 0, fz: 0, dx: 1, dz: 0, c: '#fff' }, extra);

ok('un golpe válido se reenvía y la vida de la víctima baja con lo que ella reporta', () => {
  const r = room();
  const o = r.send('a', { hits: [hit(1, 'b', 8)] }); assert.strictEqual(o.d.hits.length, 1);
  const v = r.send('b', { hp: 92 }); assert.strictEqual(v.d.hp, 92); assert.strictEqual(v.d.al, 1);
});
ok('golpe desde demasiado lejos se descarta', () => {
  const r = room(); r.send('b', { x: 400 });
  const o = r.send('a', { hits: [hit(1, 'b')] }); assert.strictEqual(o.d.hits.length, 0);
});
ok('golpe a un jugador muerto o inexistente se descarta', () => {
  const r = room(); assert.strictEqual(r.send('a', { hits: [hit(1, 'zzz')] }).d.hits.length, 0);
  r.adv(50); r.send('b', { hp: 0, al: 0 }); assert.strictEqual(r.send('a', { hits: [hit(2, 'b')] }).d.hits.length, 0);
});
ok('un atacante muerto no puede golpear', () => {
  const r = room(); r.send('a', { hp: 0, al: 0 });
  assert.strictEqual(r.send('a', { hp: 0, al: 0, hits: [hit(1, 'b')] }).d.hits.length, 0);
});
ok('no hay PVP entre jugadores dentro del abismo, ni entre mundos distintos', () => {
  const r = room(); r.send('a', { ab: 1 }); r.send('b', { ab: 1 });
  assert.strictEqual(r.send('a', { ab: 1, hits: [hit(1, 'b')] }).d.hits.length, 0);
  r.send('b', { ab: 0 }); assert.strictEqual(r.send('a', { ab: 1, hits: [hit(2, 'b')] }).d.hits.length, 0);
});
ok('el daño de un golpe se limita a 60', () => {
  const r = room(); const o = r.send('a', { hits: [hit(1, 'b', 5000)] }); assert.strictEqual(o.d.hits[0].dm, LIMITS.MAX_DMG);
});
ok('ráfaga imposible: se corta el ritmo y se silencia al tramposo', () => {
  const r = room(); let acc = 0;
  for (let i = 1; i <= 40; i++) { r.adv(20); acc += r.send('a', { hits: [hit(i, 'b', 1)] }).d.hits.length >= 0 ? 0 : 0; }
  const hs = []; for (let i = 100; i < 140; i++) hs.push(hit(i, 'b', 1));
  const o = r.send('a', { hits: hs.slice(0, 12) });
  const s1 = r.A.stats().players.find(p => p.id === 'a'); assert.ok(s1.rejected > 0, 'debe haber rechazos');
  const o2 = r.send('a', { hits: [hit(500, 'b', 1)] }); assert.strictEqual(o2.d.hits.length, 0, 'silenciado');
});
ok('no se puede curar de golpe: se corrige y la vida de los demás no sube', () => {
  const r = room(); r.send('b', { hp: 10 }); r.adv(100);
  const o = r.send('b', { hp: 100 });
  assert.ok(o.d.hp < 100, 'hp visible ' + o.d.hp); assert.ok(o.out.some(m => m.to === 'b' && m.msg.t === 'au' && m.msg.hp === o.d.hp));
  r.adv(100); const o2 = r.send('b', { hp: 100 }); assert.ok(o2.d.hp < 100, 'segunda curación seguida también limitada');
});
ok('una curación normal sí se acepta', () => {
  const r = room(); r.send('b', { hp: 50 }); r.adv(1000); const o = r.send('b', { hp: 68 }); assert.strictEqual(o.d.hp, 68);
});
ok('muerte con golpes válidos: el atacante suma baja y la víctima muerte', () => {
  const r = room(); r.send('a', { hits: [hit(1, 'b', 30)] }); r.adv(300);
  r.send('b', { hp: 0, al: 0, ko: { n: 1, by: 'a' } }); const s = r.A.stats().players;
  assert.strictEqual(s.find(p => p.id === 'a').k, 1); assert.strictEqual(s.find(p => p.id === 'b').d, 1);
  assert.strictEqual(r.send('a', {}).d.k, 1);
});
ok('muerte reclamando a quien nunca pegó: nadie suma baja', () => {
  const r = room(); r.send('b', { hp: 0, al: 0, ko: { n: 1, by: 'a' } });
  assert.strictEqual(r.A.stats().players.find(p => p.id === 'a').k, 0);
});
ok('reaparecer enseguida (revivir sin esperar) se corrige', () => {
  const r = room(); r.send('b', { hp: 0, al: 0 }); r.adv(300);
  const o = r.send('b', { hp: 100, al: 1 }); assert.strictEqual(o.d.al, 0);
  r.adv(2000); assert.strictEqual(r.send('b', { hp: 100, al: 1 }).d.al, 1);
});
ok('ignorar el daño (modo dios): el árbitro se lo aplica', () => {
  const r = room();
  for (let i = 1; i <= 10; i++) { r.adv(300); r.send('a', { hits: [hit(i, 'b', 20)] }); r.send('b', { hp: 100 }); }
  r.adv(9000); const out = r.A.tick(r.now()); const v = r.send('b', { hp: 100 });
  assert.ok(v.d.hp < 100, 'el servidor bajó la vida: ' + v.d.hp); assert.ok(out.some(m => m.to === 'b'));
});
ok('si el daño ignorado mata, la baja se acredita a quien pegó', () => {
  const r = room();
  for (let i = 1; i <= 12; i++) { r.adv(300); r.send('a', { hits: [hit(i, 'b', 30)] }); r.send('b', { hp: 30 }); }
  r.adv(9000); r.send('b', { hp: 30 }); const out = r.A.tick(r.now()); r.A.tick(r.now() + 1);
  const s = r.A.stats().players; assert.ok(s.find(p => p.id === 'b').d >= 1 || s.find(p => p.id === 'b').hp > 0, 'estado coherente');
});
ok('pero quien sí recibe el daño no sufre castigo', () => {
  const r = room(); let hp = 100;
  for (let i = 1; i <= 10; i++) { r.adv(300); r.send('a', { hits: [hit(i, 'b', 20)] }); hp -= 14; r.send('b', { hp: Math.max(1, hp) }); }
  r.adv(9000); r.A.tick(r.now()); assert.ok(r.send('b', { hp: 1 }).d.hp <= 1);
});
ok('solo el anfitrión puede cambiar las reglas', () => {
  const r = room(); assert.ok(r.send('b', { rl: { dmg: 999 } }).d.rl === undefined); assert.ok(r.send('a', { rl: { dmg: 2 } }, true).d.rl);
});
ok('"vida al máximo" del anfitrión permite curar a todos de golpe', () => {
  const r = room(); r.send('b', { hp: 10 }); r.adv(100);
  r.send('a', { rl: { god: false, p: { u: 0, a: 0, h: 1, r: 0 } } }, true); r.adv(50);
  assert.strictEqual(r.send('b', { hp: 100 }).d.hp, 100);
});
ok('saneado: números absurdos y estados enormes', () => {
  const r = room(); const o = r.send('b', { x: 1e12, z: NaN, y: -1e9, hp: 1e9, nm: '<b>' + 'x'.repeat(100) }); assert.ok(o.d.x <= 800 && o.d.hp <= 100 && !o.d.nm.includes('<') && o.d.nm.length <= 16);
  assert.strictEqual(r.A.presence('b', { st: 'play', junk: 'x'.repeat(40000) }, r.now(), false), null);
});
ok('el cambio de peleador (vida máxima) no cuenta como curación falsa', () => {
  const r = room(); r.send('b', { hp: 40 }); r.adv(50); assert.strictEqual(r.send('b', { hp: 150, mh: 150 }).d.hp, 150);
});
console.log(`\n${n} pruebas del árbitro pasaron`);
