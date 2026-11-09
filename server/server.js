// Servidor local de Blockstrike Battlegrounds: sirve el juego y reenvía la partida entre jugadores por WebSocket.
// Sin dependencias: solo Node.js. Uso:  node server/server.js   (o doble clic en Iniciar_Servidor.bat)
// Variables opcionales: PORT=8080
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');

const atmosphere = require('./ambiente.js');
// el árbitro del combate (js/arbitro.js): valida golpes, vida, muertes y reglas; el servidor deja de ser un simple repetidor
const Arbitro = require('../js/arbitro.js');
// los monstruos, la llave y el evento del Kraken del abismo los lleva el servidor (server/abismo-sim.js)
const AbismoSim = require('./abismo-sim.js');
const ROOT = path.resolve(process.env.BLOCKSTRIKE_ROOT || path.join(__dirname, '..')), PORT = +process.env.PORT || 8080, STALE_MS = 20000, MAX_MSG = 1 << 20;
const MAX_ROOMS = +process.env.MAX_ROOMS || 64, MAX_PLAYERS = +process.env.MAX_PLAYERS || 24, MAX_PUBLIC = +process.env.MAX_PUBLIC || 40, PUBLIC_PER_IP = 3;   // límites para que no se sature el servidor
const RATE = { perSec: 160, burst: 320, floodKick: 1500 };                                       // mensajes por segundo de un cliente (el juego manda ~30)
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.bbmodel': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// salas: nombre -> { clients: Map(id -> cliente), states: Map(id -> { d, owner }), skins: Map(id -> string) }
const rooms = new Map();
// Cada sala nace PÚBLICA o PRIVADA y no cambia. Privada: manda quien entró primero (reglas, dummies, clima). Pública: nadie manda, ni quien la creó;
// el servidor es el único que la lleva (como en Among Us: el creador solo la abre). La lista de públicas la da el servidor (/bs-rooms).
function getRoom(name, mode, ip) {
  let r = rooms.get(name);
  if (!r) { r = { mode: mode === 'public' ? 'public' : 'private', creatorIp: ip || '', creatorName: '', creatorId: '', clients: new Map(), states: new Map(), skins: new Map(), profiles: new Map(), environment: atmosphere.create(atmosphere.hash(name+Date.now())), envAt: Date.now(), arb: Arbitro.create({ log: m => console.log(`[árbitro:${name}] ${m}`) }), abAt: Date.now(), abT: 0, abEv: '' };
    r.ab = AbismoSim.create({ log: m => console.log(`[abismo:${name}] ${m}`), damage: (id, d) => { sendTo(r.clients.get(id), Object.assign({ t: 'abd' }, d)); r.arb.authorize(id, d.dm, Date.now()); } });
    rooms.set(name, r); }
  return r;
}
function lanIps() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) out.push(n.address);
  return out;
}

// Dirección pública (túnel de playit.gg, Cloudflare, tu IP...): se escribe en publico.txt, junto a Iniciar_Servidor.bat.
// Se lee cada vez, así que se puede cambiar con el servidor encendido. Sirve para que el link de invitación del juego funcione fuera de tu red.
function publicUrl() {
  try {
    let t = fs.readFileSync(path.join(ROOT, 'publico.txt'), 'utf8').split(/\r?\n/).map(l => l.trim()).find(l => l && !l.startsWith('#')) || '';
    if (!t) return '';
    if (!/^https?:\/\//i.test(t)) t = 'http://' + t;
    return t.replace(/\/+$/, '');
  } catch (e) { return ''; }
}

// ---------- HTTP: juego + estado del servidor ----------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname);
  if (p === '/bs-rooms') {   // lista de salas públicas (solo las del servidor)
    const list = [...rooms.entries()].filter(([, r]) => r.mode === 'public' && r.clients.size).map(([code, r]) => ({ code, n: r.clients.size, max: MAX_PLAYERS, host: r.creatorName || 'Jugador' })).sort((a, b) => b.n - a.n).slice(0, 60);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(list)); return;
  }
  if (p === '/bs-join') {   // ¿puedo entrar? (el juego lo pregunta antes de abrir la conexión para poder decir el motivo)
    const room = (url.searchParams.get('room') || '').slice(0, 40), why = joinProblem(room, url.searchParams.get('pub') === '1', req.socket.remoteAddress || '', '');
    const r = rooms.get(room); res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify({ ok: !why, why: why || '', mode: r ? r.mode : '' })); return;
  }
  if (p === '/bs-server') {
    const players = [...rooms.values()].reduce((a, r) => a + r.clients.size, 0);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, name: 'blockstrike-server', port: PORT, ips: lanIps(), publicUrl: publicUrl(), atmosphere: 3, rooms: rooms.size, players, arbiter: 1, publicRooms: true }));
    return;
  }
  let file = path.join(ROOT, p === '/' ? (fs.existsSync(path.join(ROOT,'index.html')) ? 'index.html' : 'blockstrike.html') : p);
  // nada fuera de la carpeta del juego, ni archivos ocultos (.git...), ni el código del servidor
  if (!file.startsWith(ROOT) || /(^|[\\/])\./.test(path.relative(ROOT, file)) || /^server([\\/]|$)/i.test(path.relative(ROOT, file))) { res.writeHead(403); res.end('403'); return; }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) file = path.join(file, 'index.html');
    fs.readFile(file, (e2, buf) => {
      if (e2) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  });
});

// ---------- WebSocket mínimo (RFC 6455): solo texto, ping/pong y cierre ----------
function frame(opcode, payload) {
  const len = payload.length;
  let head;
  if (len < 126) head = Buffer.from([0x80 | opcode, len]);
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([head, payload]);
}
function sendTo(c, obj) {
  if (!c || c.dead) return;
  try { c.socket.write(frame(1, Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)))); } catch (e) { drop(c); }
}
// mensajes del árbitro para clientes concretos: [{ to, msg }]
function dispatch(room, outs) { if (outs) for (const o of outs) sendTo(room.clients.get(o.to), o.msg); }
const hostOf = room => room.mode === 'private' ? (room.clients.keys().next().value || '') : '';   // en una sala pública no hay anfitrión
const isHostId = (room, id) => !!id && hostOf(room) === id;
const publicByIp = ip => [...rooms.values()].filter(r => r.mode === 'public' && r.creatorIp === ip).length;
// ¿puede esta conexión entrar a esta sala con esta intención?  devuelve null si sí, o el motivo
function joinProblem(name, wantPub, ip, id) {
  const r = rooms.get(name);
  if (!r) { if (rooms.size >= MAX_ROOMS) return 'full'; if (wantPub && ([...rooms.values()].filter(q => q.mode === 'public').length >= MAX_PUBLIC || publicByIp(ip) >= PUBLIC_PER_IP)) return 'too_many_public'; return null; }
  if (wantPub && r.mode === 'private') return 'mode_private';        // por la puerta de las públicas no se entra a una privada
  if (r.clients.size >= MAX_PLAYERS && !r.clients.has(id)) return 'full';
  return null;
}
function broadcast(room, obj, exceptId) {
  const s = JSON.stringify(obj);
  for (const [id, c] of room.clients) if (id !== exceptId) sendTo(c, s);
}
function drop(c) {
  if (c.dead) return; c.dead = true;
  try { c.socket.destroy(); } catch (e) { }
  const room = rooms.get(c.roomName); if (!room) return;
  const wasHost = isHostId(room, c.id);
  if (room.clients.get(c.id) === c) room.clients.delete(c.id);
  // se borran el jugador y las entidades que publicó (dummies del anfitrión)
  for (const [id, st] of [...room.states]) if (id === c.id || st.owner === c.id) { room.states.delete(id); broadcast(room, { t: 'x', id }); }
  room.profiles.delete(c.id); room.arb.leave(c.id);
  if (wasHost) { const nh = hostOf(room); if (nh) { sendTo(room.clients.get(nh), { t: 'au', host: 1 }); sendEnvironment(room); } }   // la sala privada pasa al siguiente jugador
  if (room.skins.has(c.id)) { room.skins.delete(c.id); }
  if (!room.clients.size) rooms.delete(c.roomName);
  console.log(`[-] ${c.id} salió de "${c.roomName}" (${room.clients.size} en la sala)`);
}

function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (!m || typeof m !== 'object') return;
  const room = rooms.get(c.roomName); if (!room) return;
  const now = Date.now(); c.last = now;
  // límite de mensajes por segundo (cubo con fichas): el que inunda el servidor pierde mensajes y, si insiste, la conexión
  c.tok = Math.min(RATE.burst, (c.tok == null ? RATE.burst : c.tok) + (now - (c.tokT || now)) / 1000 * RATE.perSec); c.tokT = now;
  if (c.tok < 1) { if (++c.over > RATE.floodKick) { console.log(`[!] ${c.id} inundaba el servidor`); drop(c); } return; } c.tok--; if (c.over > 0 && c.tok > RATE.burst / 2) c.over = 0;
  switch (m.t) {
    case 'wx':
      // Solo el anfitrión configura el ambiente; la hora, los rayos y sus víctimas los calcula este servidor.
      if(isHostId(room, c.id) && atmosphere.command(room.environment,m.d))sendEnvironment(room);   // en las públicas nadie cambia el clima
      break;
    case 'p': {   // el estado del jugador pasa por el árbitro: lo que se reenvía ya está validado, y vida/muertes/bajas son las del servidor
      const r = m.d && typeof m.d === 'object' ? room.arb.presence(c.id, m.d, now, isHostId(room, c.id)) : null; if (!r) break;
      if (!room.creatorName && room.creatorId === c.id && r.d.nm) room.creatorName = String(r.d.nm).slice(0, 16);
      room.states.set(c.id, { d: r.d, owner: c.id }); broadcast(room, { t: 'p', id: c.id, d: r.d }, c.id); dispatch(room, r.out); break; }
    case 'pa': if (isHostId(room, c.id) && typeof m.id === 'string' && m.id.length < 80 && /^[A-Za-z0-9_:.-]+$/.test(m.id) && m.d && typeof m.d === 'object') {   // dummies del anfitrión
      if ([...room.states.values()].filter(q => q.owner === c.id).length > 12 && !room.states.has(m.id)) break;
      const d = room.arb.dummy(c.id, m.id, m.d, now); if (!d) break;
      room.states.set(m.id, { d, owner: c.id }); broadcast(room, { t: 'p', id: m.id, d }, c.id); } break;
    case 'xa': if (typeof m.id === 'string' && room.states.get(m.id) && room.states.get(m.id).owner === c.id) { room.states.delete(m.id); room.arb.leave(m.id); broadcast(room, { t: 'x', id: m.id }); } break;
    case 'sk': if (typeof m.d === 'string' && m.d.length < 24000) { room.skins.set(c.id, m.d); broadcast(room, { t: 'sk', id: c.id, d: m.d }, c.id); } else { room.skins.delete(c.id); broadcast(room, { t: 'sk', id: c.id, d: '' }, c.id); } break;
    case 'pf': if (m.d && typeof m.d === 'object' && m.d.v === 1 && JSON.stringify(m.d).length <= 80000) { room.profiles.set(c.id, m.d); broadcast(room, { t: 'pf', id: c.id, d: m.d }, c.id); } break;
    case 'pi': sendTo(c, { t: 'po', ts: m.ts }); break;
    // abismo: golpe a un monstruo (lo valida y lo aplica el servidor), el Kraken vencido y el evento pedido por el anfitrión de una sala privada
    case 'abh': room.ab.hit(room.arb.get(c.id), m, now); break;
    case 'abclear': room.ab.cleared(room.arb.get(c.id)); break;
    case 'abev': if (isHostId(room, c.id)) room.ab.startEvent(now); break;
    // señales para que dos jugadores abran un canal directo (WebRTC): se reenvían tal cual al destinatario
    case 'sig': if (typeof m.to === 'string' && m.d && typeof m.d === 'object') sendTo(room.clients.get(m.to), { t: 'sig', from: c.id, d: m.d }); break;
  }
}

function readFrames(c) {
  for (;;) {
    const b = c.buf; if (b.length < 2) return;
    const fin = !!(b[0] & 0x80), op = b[0] & 0x0f, masked = !!(b[1] & 0x80); let len = b[1] & 0x7f, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > MAX_MSG) { drop(c); return; }
    const need = off + (masked ? 4 : 0) + len; if (b.length < need) return;
    let payload = b.subarray(off + (masked ? 4 : 0), need);
    if (masked) { const k = b.subarray(off, off + 4); payload = Buffer.from(payload); for (let i = 0; i < payload.length; i++) payload[i] ^= k[i & 3]; }
    c.buf = b.subarray(need);
    if (op === 8) { try { c.socket.write(frame(8, Buffer.alloc(0))); } catch (e) { } drop(c); return; }
    if (op === 9) { try { c.socket.write(frame(10, payload)); } catch (e) { } continue; }
    if (op === 10) continue;
    if (op === 1 || op === 0) {
      c.frag = op === 1 ? [payload] : (c.frag || []).concat([payload]);
      if (fin) { const t = Buffer.concat(c.frag).toString('utf8'); c.frag = null; onMessage(c, t); }
    }
  }
}

server.on('upgrade', (req, socket) => {
  const url = new URL(req.url, 'http://x');
  const key = req.headers['sec-websocket-key'];
  if (url.pathname !== '/ws' || !key) { socket.destroy(); return; }
  const roomName = (url.searchParams.get('room') || 'amigos').replace(/[\u0000-\u001f<>]/g, '').slice(0, 40) || 'amigos', ask = (url.searchParams.get('id') || '').slice(0, 40);
  const id = /^[A-Za-z0-9_-]{1,40}$/.test(ask) ? ask : 'u' + crypto.randomBytes(4).toString('hex');
  const ip = socket.remoteAddress || '';
  // salas y jugadores limitados; y nadie puede echar a otro jugador conectándose con su id (solo se reemplaza una conexión de la misma dirección)
  const existing = rooms.get(roomName), wantPub = url.searchParams.get('pub') === '1';
  if (joinProblem(roomName, wantPub, ip, id)) { socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n'); socket.destroy(); return; }
  { const o = existing && existing.clients.get(id); if (o && !o.dead && o.ip !== ip && Date.now() - o.last < 6000) { socket.write('HTTP/1.1 409 Conflict\r\n\r\n'); socket.destroy(); return; } }
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + crypto.createHash('sha1').update(key + GUID).digest('base64') + '\r\n\r\n');
  socket.setNoDelay(true);
  const room = getRoom(roomName, wantPub ? 'public' : 'private', ip), old = room.clients.get(id);
  if (!room.clients.size) room.creatorId = id;
  if (old) drop(old);
  const c = { id, roomName, ip, socket, buf: Buffer.alloc(0), last: Date.now(), dead: false, frag: null, tok: RATE.burst, tokT: Date.now(), over: 0 };
  getRoom(roomName).clients.set(id, c);
  // al entrar recibe el estado y la skin de todos los que ya están
  for (const [sid, st] of room.states) if (sid !== id) sendTo(c, { t: 'p', id: sid, d: st.d });
  for (const [sid, d] of room.profiles) if (sid !== id) sendTo(c, { t: 'pf', id: sid, d });
  for (const [sid, d] of room.skins) if (sid !== id) sendTo(c, { t: 'sk', id: sid, d });
  sendTo(c,{t:'wx',d:atmosphere.snapshot(room.environment),host:hostOf(room)});
  sendTo(c, { t: 'au', hello: 1, pub: room.mode === 'public', host: isHostId(room, id) ? 1 : 0, sim: 1 });
  sendTo(c, room.ab.eventState(Date.now()));   // avisa al juego de que este servidor es el árbitro de la sala
  console.log(`[+] ${id} entró a "${roomName}" (${getRoom(roomName).clients.size} en la sala)`);
  socket.on('data', d => { c.buf = c.buf.length ? Buffer.concat([c.buf, d]) : d; readFrames(c); });
  socket.on('close', () => drop(c));
  socket.on('error', () => drop(c));
});

// El reloj y los sucesos ambientales continúan aunque salga el anfitrión o haya pestañas minimizadas.
function sendEnvironment(room){broadcast(room,{t:'wx',d:atmosphere.snapshot(room.environment),host:hostOf(room)});}
setInterval(()=>{
  const now=Date.now();
  for(const room of rooms.values()){
    const dt=Math.min(30,Math.max(0,(now-room.envAt)/1000));room.envAt=now;
    const players=[];
    for(const [id,{d}]of room.states)if(d.st==='play'&&[d.x,d.y,d.z].every(Number.isFinite))players.push({id,x:d.x,y:d.y,z:d.z,alive:!!d.al,safe:!!d.wxSafe});
    atmosphere.advance(room.environment,dt,players,true);sendEnvironment(room);
  }
},100);

// el abismo: 20 veces por segundo se mueven los monstruos; 10 veces por segundo se manda lo que ven los que están dentro; el evento, cada segundo
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) {
    const dt = Math.min(.2, Math.max(0, (now - room.abAt) / 1000)); room.abAt = now;
    const all = room.arb.list().filter(p => room.clients.has(p.id)).map(p => ({ id: p.id, x: p.x, y: p.y, z: p.z, alive: p.alive, ab: p.ab, st: p.st }));
    try { room.ab.tick(dt, now, all); } catch (e) { console.error('[abismo] error', e); continue; }
    room.abT++;
    if (room.abT % 2 === 0) { const snap = JSON.stringify(room.ab.snapshot()); for (const p of all) if (p.ab) sendTo(room.clients.get(p.id), snap); }
    const ev = room.ab.eventState(now), es = JSON.stringify(ev); if (es !== room.abEv || room.abT % 20 === 0) { room.abEv = es; broadcast(room, ev); }
  }
}, 50);

// el árbitro revisa cada 250 ms los golpes válidos que alguien no reflejó (daño ignorado) y manda las correcciones
setInterval(() => { const now = Date.now(); for (const room of rooms.values()) dispatch(room, room.arb.tick(now)); }, 250);

// quita a quien dejó de responder (cierre de pestaña sin avisar, corte de wifi)
setInterval(() => {
  const now = Date.now();
  for (const room of rooms.values()) for (const c of [...room.clients.values()]) if (now - c.last > STALE_MS) { console.log(`[!] ${c.id} sin respuesta`); drop(c); }
}, 5000);

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\nEl puerto ${PORT} ya está en uso. Cierra el otro servidor o inicia con otro puerto:  set PORT=8090 && node server/server.js\n`);
  else console.error(e);
  process.exit(1);
});
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n  Blockstrike Battlegrounds · servidor local');
  console.log('  ─────────────────────────────────────────');
  console.log(`  En esta PC:        http://localhost:${PORT}/`);
  const ips = lanIps();
  if (ips.length) for (const ip of ips) console.log(`  Tus amigos (misma red / wifi):  http://${ip}:${PORT}/`);
  else console.log('  (no se encontró una red local: tus amigos no podrán entrar por wifi)');
  const pub = publicUrl();
  if (pub) console.log(`  Amigos por internet:           ${pub}/   (de publico.txt)`);
  else console.log('  Amigos por internet: aún no configurado (mira LEEME_SERVIDOR.txt, sección playit.gg)');
  console.log('\n  Abre el juego desde esos links, elige un código de sala y toca Entrar.');
  console.log('  Ctrl+C para cerrar.\n');
});
