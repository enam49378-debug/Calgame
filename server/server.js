// Servidor local de Blockstrike Battlegrounds: sirve el juego y reenvía la partida entre jugadores por WebSocket.
// Sin dependencias: solo Node.js. Uso:  node server/server.js   (o doble clic en Iniciar_Servidor.bat)
// Variables opcionales: PORT=8080
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');

const ROOT = path.resolve(__dirname, '..'), PORT = +process.env.PORT || 8080, STALE_MS = 20000, MAX_MSG = 1 << 20;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.bbmodel': 'application/json', '.txt': 'text/plain; charset=utf-8' };
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// salas: nombre -> { clients: Map(id -> cliente), states: Map(id -> { d, owner }), skins: Map(id -> string) }
const rooms = new Map();
function getRoom(name) {
  let r = rooms.get(name);
  if (!r) { r = { clients: new Map(), states: new Map(), skins: new Map() }; rooms.set(name, r); }
  return r;
}
function lanIps() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const n of list || []) if (n.family === 'IPv4' && !n.internal) out.push(n.address);
  return out;
}

// ---------- HTTP: juego + estado del servidor ----------
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), p = decodeURIComponent(url.pathname);
  if (p === '/bs-server') {
    const players = [...rooms.values()].reduce((a, r) => a + r.clients.size, 0);
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, name: 'blockstrike-server', port: PORT, ips: lanIps(), rooms: rooms.size, players }));
    return;
  }
  let file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('403'); return; }
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
function broadcast(room, obj, exceptId) {
  const s = JSON.stringify(obj);
  for (const [id, c] of room.clients) if (id !== exceptId) sendTo(c, s);
}
function drop(c) {
  if (c.dead) return; c.dead = true;
  try { c.socket.destroy(); } catch (e) { }
  const room = rooms.get(c.roomName); if (!room) return;
  if (room.clients.get(c.id) === c) room.clients.delete(c.id);
  // se borran el jugador y las entidades que publicó (dummies del anfitrión)
  for (const [id, st] of [...room.states]) if (id === c.id || st.owner === c.id) { room.states.delete(id); broadcast(room, { t: 'x', id }); }
  if (room.skins.has(c.id)) { room.skins.delete(c.id); }
  if (!room.clients.size) rooms.delete(c.roomName);
  console.log(`[-] ${c.id} salió de "${c.roomName}" (${room.clients.size} en la sala)`);
}

function onMessage(c, text) {
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (!m || typeof m !== 'object') return;
  const room = rooms.get(c.roomName); if (!room) return;
  c.last = Date.now();
  switch (m.t) {
    case 'p': if (m.d && typeof m.d === 'object') { room.states.set(c.id, { d: m.d, owner: c.id }); broadcast(room, { t: 'p', id: c.id, d: m.d }, c.id); } break;
    case 'pa': if (typeof m.id === 'string' && m.id.length < 80 && m.d && typeof m.d === 'object') { room.states.set(m.id, { d: m.d, owner: c.id }); broadcast(room, { t: 'p', id: m.id, d: m.d }, c.id); } break;
    case 'xa': if (typeof m.id === 'string' && room.states.get(m.id) && room.states.get(m.id).owner === c.id) { room.states.delete(m.id); broadcast(room, { t: 'x', id: m.id }); } break;
    case 'sk': if (typeof m.d === 'string' && m.d.length < 24000) { room.skins.set(c.id, m.d); broadcast(room, { t: 'sk', id: c.id, d: m.d }, c.id); } else { room.skins.delete(c.id); broadcast(room, { t: 'sk', id: c.id, d: '' }, c.id); } break;
    case 'pi': sendTo(c, { t: 'po', ts: m.ts }); break;
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
  const roomName = (url.searchParams.get('room') || 'amigos').slice(0, 40), id = (url.searchParams.get('id') || '').slice(0, 40) || 'u' + crypto.randomBytes(4).toString('hex');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + crypto.createHash('sha1').update(key + GUID).digest('base64') + '\r\n\r\n');
  socket.setNoDelay(true);
  const room = getRoom(roomName), old = room.clients.get(id);
  if (old) drop(old);
  const c = { id, roomName, socket, buf: Buffer.alloc(0), last: Date.now(), dead: false, frag: null };
  getRoom(roomName).clients.set(id, c);
  // al entrar recibe el estado y la skin de todos los que ya están
  for (const [sid, st] of room.states) if (sid !== id) sendTo(c, { t: 'p', id: sid, d: st.d });
  for (const [sid, d] of room.skins) if (sid !== id) sendTo(c, { t: 'sk', id: sid, d });
  console.log(`[+] ${id} entró a "${roomName}" (${getRoom(roomName).clients.size} en la sala)`);
  socket.on('data', d => { c.buf = c.buf.length ? Buffer.concat([c.buf, d]) : d; readFrames(c); });
  socket.on('close', () => drop(c));
  socket.on('error', () => drop(c));
});

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
  console.log('\n  Abre el juego desde esos links, elige un código de sala y toca Entrar.');
  console.log('  Para jugar por internet hay que abrir el puerto ' + PORT + ' en el router o usar un túnel (ver LEEME_SERVIDOR.txt).');
  console.log('  Ctrl+C para cerrar.\n');
});
