// Editor de animaciones (modo desarrollador, estilo Blockbench): claves, interpolaciones, fórmulas y curvas
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_EDITORES = window.CF_EDITORES || {};

window.CF_EDITORES.crearEditorAnimaciones = function crearEditorAnimaciones(D) {
  'use strict';
  const { $, Animator, CHARACTER_VOICE_FILES, CHARACTER_VOICE_META, CHARS, CHAR_IDS, DEV, G, JAVI_BB_CACHE, JDEF, JOINTS, L2W, SH, SND, SND_LIST, V3, VOICE_PACKS, bbSet, buildModel, charSkin, clamp, copyCanvas, disposeModel, hermArr, initAudio, setSpear, showSelect, voiceRel } = D;

const ED = { att: null, vic: null, tg: 'att', attName: null, vicName: null, vfig: null, vchar: null, vOn: true, on: false, setId: null, name: null, clip: null, time: 0, playing: false, loop: true, speed: 1, zoom: 170, scroll: -.3, vscroll: 0, sel: new Set(), rows: [], undo: [], redo: [], clip0: null, curves: false, rotY: .35, camZ: 7.4, snap: true, open: {}, selBone: 'body', selChan: null, drag: null, saved: {}, orig: {}, msgT: 0 };
const ED_BONES = [
  { id: 'body', n: 'Cuerpo', col: '#ffd23f', g: { rot: ['ix', 'iy', 'iz'], pos: ['bx', 'by', 'bz'] } },
  { id: 'torso', n: 'Torso', col: '#7dff6a', g: { rot: ['tx', 'ty', 'tz'], pos: ['tpx', 'tpy', 'tpz'], scl: ['tscx', 'tscy', 'tscz'] } },
  { id: 'head', n: 'Cabeza', col: '#4dd2ff', g: { rot: ['hx', 'hy', 'hz'], pos: ['hpx', 'hpy', 'hpz'], scl: ['hscx', 'hscy', 'hscz'] } },
  { id: 'armL', n: 'Brazo izquierdo', col: '#ff7ab8', g: { rot: ['alx', 'aly', 'alz'], pos: ['alpx', 'alpy', 'alpz'], scl: ['als'] } },
  { id: 'armR', n: 'Brazo derecho', col: '#ff9a3d', g: { rot: ['arx', 'ary', 'arz'], pos: ['arpx', 'arpy', 'arpz'], scl: ['ars'] } },
  { id: 'legL', n: 'Pierna izquierda', col: '#b06bff', g: { rot: ['llx', 'llz'], pos: ['llpx', 'llpy', 'llpz'], scl: ['lls'] } },
  { id: 'legR', n: 'Pierna derecha', col: '#6bffd9', g: { rot: ['lrx', 'lrz'], pos: ['lrpx', 'lrpy', 'lrpz'], scl: ['lrs'] } },
  { id: 'weapon', n: 'Arma', col: '#cfd6df', g: { rot: ['sx', 'sy', 'sz'], pos: ['spx', 'spy', 'spz'], scl: ['ssc'] } },
];
const ED_KIND = { rot: 'Rotación (°)', pos: 'Posición', scl: 'Escala' };
const ED_ROT = new Set(['ix', 'iy', 'iz', 'tx', 'ty', 'tz', 'hx', 'hy', 'hz', 'alx', 'aly', 'alz', 'arx', 'ary', 'arz', 'llx', 'llz', 'lrx', 'lrz', 'sx', 'sy', 'sz']);
const edBoneOf = c => ED_BONES.find(b => Object.values(b.g).some(a => a.includes(c)));
const edKindOf = c => ED_ROT.has(c) ? 'rot' : /sc[xyz]$|^(als|ars|lls|lrs|ssc)$/.test(c) ? 'scl' : 'pos';
const edAxis = c => { if (c === 'ssc') return 'TAMAÑO'; const l = c.slice(-1); return 'xyz'.includes(l) && !/^(als|ars|lls|lrs)$/.test(c) ? l.toUpperCase() : 'LARGO'; };
const edDef = c => JDEF[c] != null ? JDEF[c] : 0;
const edDeg = v => v * 180 / Math.PI;
const edShow = (c, v) => ED_ROT.has(c) ? edDeg(v) : v;
const edUnshow = (c, v) => ED_ROT.has(c) ? v * Math.PI / 180 : v;
// ----- interpolaciones
const edBack = u => 2.70158 * u * u * u - 1.70158 * u * u;
const edElastic = u => u === 0 ? 0 : u === 1 ? 1 : -Math.pow(2, 10 * u - 10) * Math.sin((u * 10 - 10.75) * (2 * Math.PI / 3));
const edBounceOut = u => { const n = 7.5625, d = 2.75; if (u < 1 / d) return n * u * u; if (u < 2 / d) return n * (u -= 1.5 / d) * u + .75; if (u < 2.5 / d) return n * (u -= 2.25 / d) * u + .9375; return n * (u -= 2.625 / d) * u + .984375; };
const ED_EASE = {
  sine: u => 1 - Math.cos(u * Math.PI / 2), quad: u => u * u, cubic: u => u * u * u, quart: u => u ** 4, quint: u => u ** 5,
  expo: u => u === 0 ? 0 : Math.pow(2, 10 * u - 10), circ: u => 1 - Math.sqrt(1 - u * u), back: edBack, elastic: edElastic, bounce: u => 1 - edBounceOut(1 - u),
};
const ED_EASE_ES = { sine: 'Seno', quad: 'Cuadrática', cubic: 'Cúbica', quart: 'Cuártica', quint: 'Quíntica', expo: 'Exponencial', circ: 'Circular', back: 'Atrás', elastic: 'Elástica', bounce: 'Rebote' };
function edEase(name, mode, u) {
  const f = ED_EASE[name]; if (!f) return u;
  if (mode === 'in') return f(u); if (mode === 'out') return 1 - f(1 - u);
  return u < .5 ? f(2 * u) / 2 : 1 - f(2 * (1 - u)) / 2;
}
function edBezier(x1, y1, x2, y2, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; let t = x;
  for (let i = 0; i < 8; i++) { const e = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d; }
  t = clamp(t, 0, 1); return ((ay * t + by) * t + cy) * t;
}
// ----- fórmulas seguras (sin eval): sin/cos/tan en grados como en Blockbench, variables time, life, length, pi
const edDR = Math.PI / 180, edNoise = x => { const i = Math.floor(x), f = x - i, h = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }, u = f * f * (3 - 2 * f); return (h(i) + (h(i + 1) - h(i)) * u) * 2 - 1; };
const ED_FN = {
  sin: a => Math.sin(a * edDR), cos: a => Math.cos(a * edDR), tan: a => Math.tan(a * edDR), asin: a => Math.asin(a) / edDR, acos: a => Math.acos(a) / edDR, atan: a => Math.atan(a) / edDR, atan2: (a, b) => Math.atan2(a, b) / edDR,
  abs: Math.abs, min: Math.min, max: Math.max, clamp: (a, lo, hi) => Math.min(hi, Math.max(lo, a)), lerp: (a, b, t) => a + (b - a) * t, floor: Math.floor, ceil: Math.ceil, round: Math.round, trunc: Math.trunc,
  sqrt: Math.sqrt, pow: Math.pow, exp: Math.exp, ln: Math.log, mod: (a, b) => a - b * Math.floor(a / b), sign: Math.sign, random: (a = 0, b = 1) => a + Math.random() * (b - a), noise: edNoise,
  saw: a => a - Math.floor(a), tri: a => Math.abs(((a % 1) + 1) % 1 * 2 - 1), step: (e, x) => x < e ? 0 : 1, smoothstep: (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }, bounce: a => edBounceOut(clamp(a, 0, 1)), hypot: Math.hypot,
};
const ED_CACHE = new Map();
function edCompile(src) {
  if (ED_CACHE.has(src)) return ED_CACHE.get(src);
  const rx = /\s*(?:(\d+\.?\d*(?:e[-+]?\d+)?|\.\d+)|([A-Za-z_][A-Za-z0-9_.]*)|(\|\||&&|==|!=|<=|>=|[-+*\/%^(),?:<>!]))/gy, tk = []; let m, pos = 0;
  while (pos < src.length && (m = rx.exec(src))) { pos = rx.lastIndex; if (m[1] != null) tk.push({ n: parseFloat(m[1]) }); else if (m[2] != null) tk.push({ id: m[2].replace(/^(math|query|variable|v|q)\./i, '').toLowerCase() }); else tk.push({ op: m[3] }); }
  if (/\S/.test(src.slice(pos))) throw new Error('Carácter no válido en la fórmula');
  let i = 0; const peek = () => tk[i], eat = o => { const t = tk[i]; if (t && t.op === o) { i++; return true; } return false; };
  const need = o => { if (!eat(o)) throw new Error('Falta "' + o + '"'); };
  const prim = () => {
    const t = tk[i++]; if (!t) throw new Error('Fórmula incompleta');
    if (t.n != null) return () => t.n;
    if (t.op === '(') { const e = tern(); need(')'); return e; }
    if (t.op === '-') { const e = unary(); return c => -e(c); }
    if (t.op === '+') return unary();
    if (t.op === '!') { const e = unary(); return c => e(c) ? 0 : 1; }
    if (t.id) {
      if (eat('(')) { const f = ED_FN[t.id]; if (!f) throw new Error('Función desconocida: ' + t.id); const a = []; if (!eat(')')) { do a.push(tern()); while (eat(',')); need(')'); } return c => f(...a.map(x => x(c))); }
      const id = t.id; return c => { switch (id) { case 'time': case 'anim_time': case 't': return c.time; case 'life': return c.length ? c.time / c.length : 0; case 'length': return c.length; case 'pi': return Math.PI; case 'kt': return c.kt || 0; default: throw new Error('Variable desconocida: ' + id); } };
    }
    throw new Error('Símbolo inesperado');
  };
  const unary = () => prim();
  const pw = () => { let a = prim(); if (eat('^')) { const b = unaryPow(); const l = a; a = c => Math.pow(l(c), b(c)); } return a; };
  const unaryPow = () => { if (eat('-')) { const e = unaryPow(); return c => -e(c); } return pw(); };
  const mul = () => { let a = pw(); for (;;) { if (eat('*')) { const b = pw(), l = a; a = c => l(c) * b(c); } else if (eat('/')) { const b = pw(), l = a; a = c => l(c) / (b(c) || 1e-9); } else if (eat('%')) { const b = pw(), l = a; a = c => ED_FN.mod(l(c), b(c)); } else return a; } };
  const add = () => { let a = mul(); for (;;) { if (eat('+')) { const b = mul(), l = a; a = c => l(c) + b(c); } else if (eat('-')) { const b = mul(), l = a; a = c => l(c) - b(c); } else return a; } };
  const cmp = () => { let a = add(); for (;;) { const o = peek() && peek().op; if (['<', '>', '<=', '>=', '==', '!='].includes(o)) { i++; const b = add(), l = a; a = c => { const x = l(c), y = b(c); return (o === '<' ? x < y : o === '>' ? x > y : o === '<=' ? x <= y : o === '>=' ? x >= y : o === '==' ? x === y : x !== y) ? 1 : 0; }; } else return a; } };
  const and = () => { let a = cmp(); while (eat('&&')) { const b = cmp(), l = a; a = c => l(c) && b(c) ? 1 : 0; } return a; };
  const or = () => { let a = and(); while (eat('||')) { const b = and(), l = a; a = c => l(c) || b(c) ? 1 : 0; } return a; };
  const tern = () => { const c0 = or(); if (eat('?')) { const a = tern(); need(':'); const b = tern(); return c => c0(c) ? a(c) : b(c); } return c0; };
  const fn = tern(); if (i < tk.length) throw new Error('Sobra "' + (tk[i].op || tk[i].id || tk[i].n) + '"');
  ED_CACHE.set(src, fn); return fn;
}
function edRun(src, ctx) { try { const v = edCompile(src)(ctx); return Number.isFinite(v) ? v : 0; } catch (e) { return 0; } }
// ----- evaluación de claves
const edKeyVal = (clip, c, k, t) => typeof k.v === 'string' ? edUnshow(c, edRun(k.v, { time: t, length: clip.length, kt: k.t })) : k.v;
function edEvalChan(clip, c, t) {
  const ks = clip.tracks[c]; if (!ks || !ks.length) return edDef(c);
  const n = ks.length; if (t <= ks[0].t) return edKeyVal(clip, c, ks[0], t); if (t >= ks[n - 1].t) return edKeyVal(clip, c, ks[n - 1], t);
  let i = 0; while (i < n - 2 && t >= ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1], u = (t - a.t) / (b.t - a.t), va = edKeyVal(clip, c, a, t), vb = edKeyVal(clip, c, b, t), mode = a.i || 'catmull';
  if (mode === 'step') return va; if (mode === 'linear') return va + (vb - va) * u;
  if (mode === 'bezier') { const q = a.b || [.25, .1, .25, 1]; return va + (vb - va) * edBezier(q[0], q[1], q[2], q[3], u); }
  if (mode.includes(':')) { const [nm, md] = mode.split(':'); return va + (vb - va) * edEase(nm, md, u); }
  const p0 = i > 0 ? edKeyVal(clip, c, ks[i - 1], t) : va, p3 = i + 2 < n ? edKeyVal(clip, c, ks[i + 2], t) : vb, h = b.t - a.t, t0 = i > 0 ? ks[i - 1].t : a.t, t3 = i + 2 < n ? ks[i + 2].t : b.t;
  const m1 = i > 0 ? (vb - p0) / (b.t - t0) * h * .5 : 0, m2 = i + 2 < n ? (p3 - va) / (t3 - a.t) * h * .5 : 0, s2 = u * u, s3 = s2 * u;
  return (2 * s3 - 3 * s2 + 1) * va + (s3 - 2 * s2 + u) * m1 + (-2 * s3 + 3 * s2) * vb + (s3 - s2) * m2;
}
// ----- clip <-> datos del juego
function edFromGame(setId, name) {
  const D = bbSet(setId)[name], clip = { name, length: D.length, loop: !!D.loop, contacts: (D.contacts || []).slice(), tracks: {} };
  D.channels.forEach((c, ci) => {
    const pts = D.samples.map(r => [r[0], r[ci + 1]]), tol = ED_ROT.has(c) ? .012 : /^(als|ars|lls|lrs|tsc|hsc)/.test(c) ? .006 : .06, keep = new Set([0, pts.length - 1]);
    const rdp = (a, b) => { let md = 0, mi = -1; for (let i = a + 1; i < b; i++) { const u = (pts[i][0] - pts[a][0]) / ((pts[b][0] - pts[a][0]) || 1), d = Math.abs(pts[i][1] - (pts[a][1] + (pts[b][1] - pts[a][1]) * u)); if (d > md) { md = d; mi = i; } } if (md > tol && mi > 0) { keep.add(mi); rdp(a, mi); rdp(mi, b); } };
    rdp(0, pts.length - 1);
    const ks = [...keep].sort((x, y) => x - y).map(i => ({ t: +pts[i][0].toFixed(4), v: +pts[i][1].toFixed(5), i: 'catmull' }));
    if (ks.length > 1 || Math.abs(ks[0].v - edDef(c)) > 1e-4) clip.tracks[c] = ks;
  });
  return clip;
}
function edCompileClip(clip) {
  const ch = Object.keys(clip.tracks).filter(c => clip.tracks[c].length).sort(), rows = [], L = Math.max(.05, clip.length), n = Math.ceil(L * 60);
  const times = new Set(); for (let i = 0; i <= n; i++) times.add(+(Math.min(L, i / 60)).toFixed(6)); times.add(+L.toFixed(6));
  for (const t of [...times].sort((a, b) => a - b)) rows.push([t, ...ch.map(c => +edEvalChan(clip, c, t).toFixed(6))]);
  return { length: +L.toFixed(4), loop: !!clip.loop, contacts: clip.contacts.slice(), channels: ch, samples: rows };
}
function edSnap() { return JSON.stringify({ a: ED.att, v: ED.vic, tg: ED.tg }); }
function edPush() { ED.undo.push(edSnap()); if (ED.undo.length > 100) ED.undo.shift(); ED.redo.length = 0; }
function edPoint() { ED.clip = ED.tg === 'vic' && ED.vic ? ED.vic : ED.att; if (ED.clip === ED.att) ED.tg = 'att'; }
function edRestoreSnap(j) { const o = JSON.parse(j); ED.att = o.a; ED.vic = o.v; ED.tg = o.tg; edPoint(); ED.sel.clear(); edRebuild(); }
function edUndo() { if (!ED.undo.length) return; ED.redo.push(edSnap()); edRestoreSnap(ED.undo.pop()); }
function edRedo() { if (!ED.redo.length) return; ED.undo.push(edSnap()); edRestoreSnap(ED.redo.pop()); }
function edMsg(t, bad) { const e = $('ae-msg'); if (!e) return; e.textContent = t; e.style.color = bad ? '#ff7a7a' : '#9fe8a8'; e.style.opacity = 1; ED.msgT = 3; }
// ----- guardado
function edLoadSaved() {
  try { ED.saved = JSON.parse(localStorage.getItem('bsb_anim_edits') || '{}') || {}; } catch (e) { ED.saved = {}; }
  for (const sid of Object.keys(ED.saved)) { const D = bbSet(sid); if (!D) continue; for (const nm of Object.keys(ED.saved[sid])) { try { D[nm] = edCompileClip(ED.saved[sid][nm]); for (const k of Object.keys(JAVI_BB_CACHE)) if (k === sid + ':' + nm) delete JAVI_BB_CACHE[k]; } catch (e) { } } }
}
function edSaveGame() {
  const D = bbSet(ED.setId); if (!D) return; const names = [];
  for (const [nm, c] of [[ED.attName, ED.att], [ED.vicName, ED.vic]]) {
    if (!nm || !c) continue; const key = ED.setId + ':' + nm; if (!ED.orig[key] && D[nm]) ED.orig[key] = D[nm];
    D[nm] = edCompileClip(c); delete JAVI_BB_CACHE[key]; (ED.saved[ED.setId] = ED.saved[ED.setId] || {})[nm] = JSON.parse(JSON.stringify(c)); names.push(nm);
  }
  try { localStorage.setItem('bsb_anim_edits', JSON.stringify(ED.saved)); edMsg('Guardado en el juego: ' + names.join(' + ')); } catch (e) { edMsg('No se pudo guardar (espacio lleno). Exporta el JSON.', true); }
}
function edStore() { try { localStorage.setItem('bsb_anim_edits', JSON.stringify(ED.saved)); } catch (e) { edMsg('No se pudo guardar (espacio lleno). Exporta el JSON.', true); } }
function edDup() {
  let nm = prompt('Nombre del clip nuevo (copia de ' + ED.attName + ')', ED.attName.replace(/_copia\d*$/, '') + '_copia'); if (!nm) return; nm = nm.trim().replace(/\s+/g, '_');
  const D = bbSet(ED.setId); if (!nm || D[nm]) return edMsg('Ya existe un clip con ese nombre', true);
  const vn = ED.vic ? (/^cine_/.test(nm) ? 'cine_vic_' + nm.slice(5) : nm + '_vic') : null; if (vn && D[vn]) return edMsg('Ya existe ' + vn, true);
  const mk = (src, name) => { const c = JSON.parse(JSON.stringify(src)); c.name = name; c.user = true; D[name] = edCompileClip(c); (ED.saved[ED.setId] = ED.saved[ED.setId] || {})[name] = c; };
  mk(ED.att, nm); if (vn) mk(ED.vic, vn); edStore(); edOpenClip(ED.setId, nm); edMsg('Duplicado como ' + nm + (vn ? ' + ' + vn : ''));
}
function edDelClip() {
  const names = [ED.att && ED.att.user ? ED.attName : null, ED.vic && ED.vic.user ? ED.vicName : null].filter(Boolean);
  if (!names.length) return edMsg('Solo puedes borrar clips que creaste tú (usa Restaurar para deshacer cambios)', true);
  if (!confirm('¿Borrar ' + names.join(' y ') + '?')) return; const D = bbSet(ED.setId);
  for (const n of names) { delete D[n]; if (ED.saved[ED.setId]) delete ED.saved[ED.setId][n]; } edStore(); edOpenClip(ED.setId, D.idle ? 'idle' : Object.keys(D)[0]); edMsg('Clip borrado');
}
// ----- audio de referencia: onda en la línea de tiempo y sonido al reproducir
function edRefOptions() {
  const sel = document.getElementById('ae-ref'); if (!sel) return;
  const voices = CHARACTER_VOICE_FILES.filter(k => CHARACTER_VOICE_META[k] && CHARACTER_VOICE_META[k].character === ED.setId), extra = ED.setId === 'randi' ? ['randi_waaa', 'randi_voz1', 'randi_voz2'] : [];
  const grp = (t, l) => l.length ? '<optgroup label="' + t + '">' + l.map(k => '<option value="' + k + '"' + (ED.ref && ED.ref.key === k ? ' selected' : '') + '>' + k + '</option>').join('') + '</optgroup>' : '';
  sel.innerHTML = '<option value="">♪ Audio de referencia: ninguno</option>' + grp('Voces de ' + ((CHARS[ED.setId] || {}).name || ''), [...voices, ...extra]) + grp('Sonidos del juego', SND_LIST.filter(k => !voices.includes(k) && !extra.includes(k)));
  if (ED.ref && ED.ref.key === '__file') sel.insertAdjacentHTML('beforeend', '<option value="__file" selected>' + ED.ref.name + '</option>');
}
async function edRefSet(key) {
  if (!key) { edRefStop(); ED.ref = null; ED_RH = 20; return; }
  initAudio(); if (!D.AC) return edMsg('El audio no está disponible', true);
  let buf = SND.buf[key]; if (!buf) { try { const ab = await (await fetch(voiceRel(key))).arrayBuffer(); buf = await new Promise((ok, no) => D.AC.decodeAudioData(ab, ok, no)); SND.buf[key] = buf; } catch (e) { return edMsg('No se pudo cargar ' + key, true); } }
  edRefUse(key, key, buf);
}
function edRefFile(file) { initAudio(); if (!D.AC) return; const r = new FileReader(); r.onload = () => D.AC.decodeAudioData(r.result, buf => { edRefUse('__file', file.name, buf); edRefOptions(); }, () => edMsg('No se pudo leer ese audio', true)); r.readAsArrayBuffer(file); }
function edRefUse(key, name, buf) {
  edRefStop(); const N = 1400, ch = buf.getChannelData(0), step = Math.max(1, Math.floor(ch.length / N)), pk = new Float32Array(N);
  for (let i = 0; i < N; i++) { let m = 0; for (let j = 0; j < step; j++) m = Math.max(m, Math.abs(ch[i * step + j] || 0)); pk[i] = m; }
  ED.ref = { key, name, buf, pk, off: 0 }; ED_RH = 58; edRefOptions(); const o = document.getElementById('ae-refoff'); if (o) o.value = 0; edMsg('Audio de referencia: ' + name + ' (' + buf.duration.toFixed(2) + ' s)');
}
function edRefStart() { if (!ED.ref || !D.AC) return; edRefStop(); const t = ED.time - ED.ref.off, src = D.AC.createBufferSource(); src.buffer = ED.ref.buf; src.connect(D.AC.destination); if (t >= 0) { if (t < ED.ref.buf.duration) src.start(0, t); else return; } else src.start(D.AC.currentTime - t); ED.refSrc = src; src.onended = () => { if (ED.refSrc === src) ED.refSrc = null; }; }
function edRefStop() { if (ED.refSrc) { try { ED.refSrc.stop(); } catch (e) { } ED.refSrc = null; } }
function edRestore() {
  const sid = ED.setId; let got = false;
  for (const nm of [ED.attName, ED.vicName]) { if (!nm) continue; if (ED.saved[sid]) delete ED.saved[sid][nm]; const o = ED.orig[sid + ':' + nm]; if (o) { bbSet(sid)[nm] = o; delete JAVI_BB_CACHE[sid + ':' + nm]; got = true; } }
  try { localStorage.setItem('bsb_anim_edits', JSON.stringify(ED.saved)); } catch (e) { }
  edOpenClip(sid, ED.name, true); edMsg(got ? 'Clips originales restaurados' : 'Cambios borrados (recarga para ver el original)');
}
function edExport() { const blob = new Blob([JSON.stringify({ v: 2, set: ED.setId, attName: ED.attName, vicName: ED.vicName, att: ED.att, vic: ED.vic }, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ED.setId + '-' + ED.attName + '.anim.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
function edImportFile(file) {
  const r = new FileReader(); r.onload = () => {
    try {
      const j = JSON.parse(r.result); edPush();
      if (j.v === 2 && j.att) { ED.att = j.att; ED.vic = j.vic || null; ED.attName = j.attName || ED.attName; ED.vicName = j.vicName || ED.vicName; ED.tg = 'att'; }
      else if (j.clip && j.clip.tracks) { ED.clip.tracks = j.clip.tracks; ED.clip.length = j.clip.length || ED.clip.length; ED.clip.loop = !!j.clip.loop; ED.clip.contacts = j.clip.contacts || []; }
      else throw 0;
      edPoint(); ED.sel.clear(); edRebuild(); edMsg('JSON importado');
    } catch (e) { edMsg('Archivo no válido', true); }
  }; r.readAsText(file);
}
// ----- abrir / cerrar
const ED_SETS = () => CHAR_IDS.filter(id => bbSet(id));
function edPair(sid, name) {
  const D = bbSet(sid), m = /^cine_vic_(.+)$/.exec(name);
  if (m) return { att: D['cine_' + m[1]] ? 'cine_' + m[1] : null, vic: name, tg: 'vic' };
  const v = /^cine_(.+)$/.test(name) ? 'cine_vic_' + name.slice(5) : null;
  return { att: name, vic: v && D[v] ? v : null, tg: 'att' };
}
function edLoadObj(sid, name) { const c = ED.saved[sid] && ED.saved[sid][name] ? JSON.parse(JSON.stringify(ED.saved[sid][name])) : edFromGame(sid, name); c.contacts = c.contacts || []; c.name = name; return c; }
function edOpenClip(sid, name, keepUndo) {
  const D = bbSet(sid); if (!D || !D[name]) return; const pr = edPair(sid, name);
  ED.setId = sid; ED.name = name; ED.attName = pr.att || (D.idle ? 'idle' : name); ED.vicName = pr.vic;
  ED.att = edLoadObj(sid, ED.attName); ED.vic = ED.vicName ? edLoadObj(sid, ED.vicName) : null; ED.tg = pr.tg; edPoint();
  if (!keepUndo) { ED.undo.length = 0; ED.redo.length = 0; } ED.sel.clear(); ED.time = 0; ED.playing = false;
  ED.open = {}; for (const c of Object.keys(ED.clip.tracks)) { const b = edBoneOf(c); if (b) ED.open[b.id] = true; }
  ED.selBone = Object.keys(ED.open)[0] || 'body'; ED.selChan = null; edRebuild(); edVicBuild();
  const mv = /^idle_voz_(\d+)$/.exec(name); if (mv && VOICE_PACKS[sid] && (VOICE_PACKS[sid].idle || []).includes('reposo_' + mv[1])) edRefSet(sid + '/reposo_' + mv[1]);
}
function edSetTarget(t) {
  if (t === 'vic' && !ED.vic) return edMsg('Este clip no tiene víctima: pulsa "Crear víctima"', true);
  ED.tg = t; edPoint(); ED.sel.clear(); ED.open = {}; for (const c of Object.keys(ED.clip.tracks)) { const b = edBoneOf(c); if (b) ED.open[b.id] = true; } ED.selChan = null; edRebuild();
}
function edMakeVic() {
  if (ED.vic) return; const D = bbSet(ED.setId), nm = /^cine_/.test(ED.attName) ? 'cine_vic_' + ED.attName.slice(5) : ED.attName + '_vic';
  if (D[nm] && ED.saved[ED.setId] && ED.saved[ED.setId][nm]) { ED.vic = edLoadObj(ED.setId, nm); } else if (D[nm]) { ED.vic = edLoadObj(ED.setId, nm); }
  else { const c = { name: nm, length: ED.att.length, loop: false, contacts: [], tracks: {}, user: true }; D[nm] = edCompileClip(c); (ED.saved[ED.setId] = ED.saved[ED.setId] || {})[nm] = c; edStore(); ED.vic = c; }
  ED.vicName = nm; edPush(); edSetTarget('vic'); edMsg('Víctima creada: ' + nm + ' (edita su pose con los deslizadores)');
}
function edLen() { return Math.max(.05, ED.att ? ED.att.length : 1, ED.vic ? ED.vic.length : 0); }
// ----- atacante y víctima juntos en la vista
function edVicDispose() { if (ED.vfig) { try { disposeModel(ED.vfig.model); } catch (e) { } ED.vfig = null; } }
function edVicBuild() {
  edVicDispose(); if (!ED.vOn || !SH.scene) return;
  const id = ED.vchar && CHARS[ED.vchar] ? ED.vchar : (CHAR_IDS.find(c => c !== ED.setId) || ED.setId); ED.vchar = id;
  const skin = charSkin(id), faceC = copyCanvas(skin), model = buildModel(faceC, !!CHARS[id].slim, SH.scene);
  ED.vfig = { model, anim: new Animator(model) }; ED.vfig.anim.bbR6 = true; const vs = document.getElementById('ae-vchar'); if (vs) vs.value = id;
}
const ED_ZERO = new V3(0, 0, 0), ED_DEFPATH = { apos: [[0, 0, 0, 0, 0]], vpos: [[0, 0, 0, 1.5, 0]] };
const edPath = (k) => { const P = ED.att && ED.att.paths && ED.att.paths[k]; return P && P.length ? P : ED_DEFPATH[k]; };
function edRebuild() {
  ED.rows = []; for (const b of ED_BONES) { if (b.id === 'weapon' && !(SH.fig && SH.fig.spear)) continue; ED.rows.push({ t: 'bone', b }); if (ED.open[b.id]) for (const k of ['rot', 'pos', 'scl']) for (const c of b.g[k] || []) ED.rows.push({ t: 'chan', b, k, c }); }
  { const ta = $('ae-tg-att'), tv = $('ae-tg-vic'); if (ta) { ta.classList.toggle('on', ED.tg === 'att'); tv.classList.toggle('on', ED.tg === 'vic'); tv.disabled = !ED.vic; $('ae-vmake').style.display = ED.vic ? 'none' : ''; const vs = $('ae-vchar'); vs.innerHTML = CHAR_IDS.map(id => '<option value="' + id + '"' + (id === ED.vchar ? ' selected' : '') + '>' + CHARS[id].name + '</option>').join(''); } }
  edRefOptions(); const ss = $('ae-set'), sc = $('ae-clip'); if (ss) { ss.innerHTML = ED_SETS().map(id => '<option value="' + id + '"' + (id === ED.setId ? ' selected' : '') + '>' + CHARS[id].name + '</option>').join(''); }
  if (sc && ED.setId) { const D = bbSet(ED.setId); sc.innerHTML = Object.keys(D).map(n => '<option' + (n === ED.name ? ' selected' : '') + '>' + n + '</option>').join(''); }
  edProps(); edTree();
}
function edOpen() {
  if (!DEV.on) return;
  if (G.state !== 'menu') return; edBuild(); edComicInit(); const id = ED_SETS().includes(G.charId) ? G.charId : ED_SETS()[0];
  ED.on = true; $('menu').style.display = 'none'; $('animed').classList.remove('hidden'); SH.landed = true; SH.kf = null; ED.camZ = Math.max(ED.camZ, 9.8);
  if (G.charId !== id) { G.charId = id; showSelect(id, true); } edOpenClip(id, bbSet(id).idle ? 'idle' : Object.keys(bbSet(id))[0]);
  requestAnimationFrame(edLoop);
}
function edComicInit() {
  const root = document.getElementById('animed'), top = root && root.querySelector('.ae-top'); if (!root || !top) return;
  let on = true; try { on = localStorage.getItem('bsb_ed_comic') !== '0'; } catch (e) { }
  root.classList.toggle('comic', on);
  if (!document.getElementById('aecomicbtn')) {
    const b = document.createElement('button'); b.type = 'button'; b.id = 'aecomicbtn'; b.title = 'Cambia entre el estilo cómic/anime y el estilo clásico'; b.textContent = 'ESTILO CÓMIC';
    b.addEventListener('click', () => { const v = !root.classList.contains('comic'); root.classList.toggle('comic', v); try { localStorage.setItem('bsb_ed_comic', v ? '1' : '0'); } catch (e) { } });
    top.appendChild(b);
  }
}
function edClose() { if (!ED.on || !$('animed')) return;   // cerrar sin haberlo abierto no debe romper nada
  ED.on = false; ED.playing = false; edRefStop(); edVicDispose(); $('animed').classList.add('hidden'); $('menu').style.display = ''; showSelect(G.charId, true); }
// ----- interfaz
function edBuild() {
  if ($('animed')) return;
  const st = document.createElement('style');
  st.textContent = `
#animed.comic{font-family:"Chakra Petch",system-ui,sans-serif;color:#fff}
#animed.comic .ae-top,#animed.comic .ae-left,#animed.comic .ae-right,#animed.comic .ae-bottom{background:#17102b;border:0;background-image:radial-gradient(rgba(255,212,0,.16) 1.4px,transparent 1.6px);background-size:9px 9px}
#animed.comic .ae-top{border-bottom:4px solid #000;box-shadow:0 4px 0 #ffd400}
#animed.comic .ae-left{border-right:4px solid #000;box-shadow:4px 0 0 #ff3d6e}
#animed.comic .ae-right{border-left:4px solid #000;box-shadow:-4px 0 0 #3fe0ff}
#animed.comic .ae-bottom{border-top:4px solid #000;box-shadow:0 -4px 0 #ffd400}
#animed.comic .ae-top b{font-style:italic;font-weight:900;color:#ffd400;text-shadow:2px 2px 0 #000;transform:skewX(-8deg);display:inline-block;font-size:20px}
#animed.comic button,#animed.comic select,#animed.comic input[type=text],#animed.comic input[type=number]{background:#fff;color:#000;border:3px solid #000;border-radius:2px;font-weight:800;box-shadow:3px 3px 0 #000;text-transform:uppercase;letter-spacing:.03em}
#animed.comic input[type=number],#animed.comic input[type=text]{text-transform:none}
#animed.comic button:hover:not(:disabled){background:#ffd400;border-color:#000;transform:translate(-1px,-1px) skewX(-4deg);box-shadow:5px 5px 0 #000}
#animed.comic button:active:not(:disabled){transform:translate(2px,2px);box-shadow:1px 1px 0 #000}
#animed.comic button.on{background:#ff3d6e;color:#fff;border-color:#000;text-shadow:1px 1px 0 #000}
#animed.comic button.warn{background:#ff5a5a;color:#fff}
#animed.comic h4{color:#ffd400;font-style:italic;font-weight:900;font-size:13px;letter-spacing:.08em;text-shadow:2px 2px 0 #000;transform:skewX(-8deg);display:inline-block;border-bottom:3px solid #ff3d6e;padding-right:12px}
#animed.comic .ae-bone{border:2px solid transparent;border-radius:2px;font-weight:700}
#animed.comic .ae-bone:hover{background:#ffd40033;border-color:#000}
#animed.comic .ae-bone.sel,#animed.comic .ae-bone.on{background:#ffd400;color:#000;border:2px solid #000;box-shadow:3px 3px 0 #000;transform:skewX(-5deg)}
#animed.comic .ae-bone small{color:#9fd8ff}
#animed.comic canvas{border:4px solid #000;box-shadow:5px 5px 0 #ff3d6e;background:#0c0820}
#animed.comic .ae-tools label{font-weight:800}
#animed.comic input[type=range]{accent-color:#ff3d6e}
#animed.comic .ae-top::after{content:'';position:absolute;left:0;right:0;bottom:-10px;height:6px;background:repeating-linear-gradient(100deg,#000 0 14px,transparent 14px 28px);opacity:.35;pointer-events:none}
#aecomicbtn{margin-left:auto}
#animed{position:fixed;inset:0;z-index:70;pointer-events:none;font:13px/1.35 "Chakra Petch",system-ui,sans-serif;color:#d6dae3}#animed.hidden{display:none}#animed *{box-sizing:border-box}
#animed .ae-top,#animed .ae-left,#animed .ae-right,#animed .ae-bottom{pointer-events:auto;background:#1a1d24;border:1px solid #2b303b}
#animed .ae-top{position:absolute;left:0;right:0;top:0;height:42px;display:flex;align-items:center;gap:8px;padding:0 10px;border-width:0 0 1px}
#animed .ae-top b{font-family:var(--display);font-size:18px;letter-spacing:.08em;color:#ffd400;margin-right:8px}
#animed button,#animed select,#animed input[type=text],#animed input[type=number]{font:inherit;color:#e6e9f0;background:#252a35;border:1px solid #394050;border-radius:4px;padding:4px 9px;min-width:0}
#animed button{cursor:pointer}#animed button:hover:not(:disabled){background:#313848;border-color:#5a6a8a}#animed button.on{background:#3e8bff;border-color:#3e8bff;color:#fff}#animed button.warn:hover{background:#6b2a2a}
#animed .sp{flex:1}#animed .ae-left{position:absolute;left:0;top:42px;bottom:310px;width:230px;overflow:auto;border-width:0 1px 0 0;padding:8px}
#animed .ae-right{position:absolute;right:0;top:42px;bottom:310px;width:300px;overflow:auto;border-width:0 0 0 1px;padding:10px;display:flex;flex-direction:column;gap:9px}
#animed h4{margin:0 0 6px;font-size:11px;letter-spacing:.14em;color:#8791a6;font-weight:700}
#animed .ae-bone{display:flex;align-items:center;gap:7px;padding:5px 6px;border-radius:4px;cursor:pointer;user-select:none}#animed .ae-bone:hover{background:#252a35}#animed .ae-bone.on{background:#2c3a55}
#animed .ae-bone i{width:10px;height:10px;border-radius:2px;display:inline-block}#animed .ae-bone small{margin-left:auto;color:#6f7a90}
#animed .ae-bottom{position:absolute;left:0;right:0;bottom:0;height:310px;display:flex;flex-direction:column;border-width:1px 0 0}
#animed .ae-tools{display:flex;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #2b303b;flex-wrap:wrap}#animed .ae-tools label{display:flex;align-items:center;gap:5px;color:#9aa4b8}
#animed .ae-tools input[type=number]{width:62px}#animed #ae-time{font-family:ui-monospace,Consolas,monospace;color:#ffd400;min-width:132px;text-align:center}
#animed #ae-wrap{flex:1;position:relative;min-height:0}#animed canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#animed .ae-view{position:absolute;left:230px;right:300px;top:42px;bottom:310px;pointer-events:auto;cursor:grab}#animed .ae-view:active{cursor:grabbing}
#animed .ae-hint{position:absolute;left:240px;top:50px;color:#8f99ae;font-size:12px;pointer-events:none;text-shadow:0 1px 3px #000}
#animed #ae-msg{position:absolute;left:50%;transform:translateX(-50%);top:52px;font-weight:700;opacity:0;transition:opacity .4s;pointer-events:none;text-shadow:0 1px 4px #000}
#animed .ae-field{display:grid;grid-template-columns:78px 1fr;gap:6px;align-items:center}#animed .ae-field input,#animed .ae-field select{width:100%}
#animed .ae-sl{display:grid;grid-template-columns:34px 1fr 74px;gap:6px;align-items:center}#animed .ae-sl input[type=range]{width:100%;accent-color:#3e8bff}
#animed .ae-card{background:#20242d;border:1px solid #2f3543;border-radius:6px;padding:9px;display:flex;flex-direction:column;gap:7px}
#animed .ae-help{font-size:11.5px;color:#9aa4b8;line-height:1.5}#animed .ae-help code{background:#14161c;padding:1px 5px;border-radius:3px;color:#ffd23f}#animed .ae-err{color:#ff7a7a;font-size:12px;min-height:16px}
#animed .ae-btns{display:flex;gap:6px;flex-wrap:wrap}#animed .ae-seg{display:inline-flex;border:1px solid #394050;border-radius:5px;overflow:hidden}#animed .ae-seg button{border:0;border-radius:0}#animed .ae-seg button.on{background:#ffd400;color:#000}#animed .ae-tag{font-weight:700;letter-spacing:.1em}`;
  document.head.appendChild(st);
  const d = document.createElement('div'); d.id = 'animed'; d.className = 'hidden';
  d.innerHTML = `<div class="ae-top"><b>EDITOR DE ANIMACIONES</b><select id="ae-set" title="Personaje"></select><select id="ae-clip" title="Animación"></select><span class="ae-seg"><button id="ae-tg-att" class="on" title="Editar la animación del atacante">Atacante</button><button id="ae-tg-vic" title="Editar la animación de la víctima">Víctima</button></span><select id="ae-vchar" title="Personaje que hace de víctima"></select><button id="ae-vtoggle" class="on" title="Mostrar u ocultar a la víctima">👁 Víctima</button><button id="ae-vmake" style="display:none" title="Crea la animación de la víctima de este clip">+ Crear víctima</button>
<button id="ae-new" title="Clip nuevo vacío">Nuevo</button><button id="ae-dup" title="Copia este clip con otro nombre para hacer una animación nueva a partir de él">Duplicar</button><button id="ae-delclip" class="warn" title="Borra este clip (solo los que creaste tú)">Borrar clip</button><button id="ae-undo" title="Deshacer (Ctrl+Z)">↶</button><button id="ae-redo" title="Rehacer (Ctrl+Y)">↷</button><span class="sp"></span>
<button id="ae-save" class="on" title="Aplica la animación al juego y la guarda en este navegador">Guardar en el juego</button><button id="ae-restore" title="Quita los cambios de este clip">Restaurar</button><button id="ae-exp">Exportar JSON</button><button id="ae-imp">Importar JSON</button><input id="ae-file" type="file" accept=".json,application/json" style="display:none"><button id="ae-close" class="warn">Cerrar ✕</button></div>
<aside class="ae-left"><h4>ESQUELETO</h4><div id="ae-tree"></div></aside>
<div class="ae-view" id="ae-view"></div><div class="ae-hint">Arrastra para girar · rueda: zoom · atacante y víctima juntos · en la línea de tiempo arrastra un recuadro para seleccionar claves</div><div id="ae-msg"></div>
<aside class="ae-right"><h4>PROPIEDADES</h4><div id="ae-props"></div></aside>
<section class="ae-bottom"><div class="ae-tools"><button id="ae-first">⏮</button><button id="ae-play">▶</button><button id="ae-last">⏭</button><button id="ae-loop" class="on" title="Repetir">⟲</button><span id="ae-time">0:00:00 / 0</span>
<label>FPS <input id="ae-fps" type="number" min="1" max="240" value="60"></label><label>Duración <input id="ae-len" type="number" min=".05" step=".05" value="1"></label><label>Vel. <input id="ae-speed" type="number" min=".05" max="4" step=".05" value="1"></label>
<button id="ae-snap" class="on" title="Ajustar al cuadro">Imán</button><button id="ae-curves" title="Alternar entre claves y curvas">Curvas</button><select id="ae-ref" title="Audio de referencia para guiarte con el tiempo"></select><button id="ae-refup" title="Subir un audio tuyo">Subir…</button><label>Desfase <input id="ae-refoff" type="number" step=".05" value="0"></label><button id="ae-reflen" title="Pone la duración del clip igual a la del audio">Ajustar</button><input id="ae-reffile" type="file" accept="audio/*" style="display:none"><span class="sp"></span>
<button id="ae-add" title="Clave en el cursor (K) para el canal o hueso elegido">◆ Clave</button><button id="ae-addxyz" title="Claves X,Y,Z del hueso en el cursor">◆ XYZ</button><button id="ae-del" title="Borrar claves (Supr)">Borrar</button><button id="ae-copy">Copiar</button><button id="ae-paste">Pegar</button></div>
<div id="ae-wrap"><canvas id="ae-cv"></canvas></div></section>`;
  document.body.appendChild(d);
  const $e = id => document.getElementById(id), on = (id, ev, fn) => $e(id).addEventListener(ev, fn);
  on('ae-close', 'click', edClose); on('ae-save', 'click', edSaveGame); on('ae-restore', 'click', edRestore); on('ae-exp', 'click', edExport); on('ae-imp', 'click', () => $e('ae-file').click()); on('ae-file', 'change', e => { if (e.target.files[0]) edImportFile(e.target.files[0]); e.target.value = ''; });
  on('ae-set', 'change', e => { const id = e.target.value; G.charId = id; showSelect(id, true); SH.landed = true; SH.kf = null; const D = bbSet(id); edOpenClip(id, D.idle ? 'idle' : Object.keys(D)[0]); });
  on('ae-clip', 'change', e => edOpenClip(ED.setId, e.target.value));
  on('ae-tg-att', 'click', () => edSetTarget('att')); on('ae-tg-vic', 'click', () => edSetTarget('vic')); on('ae-vmake', 'click', edMakeVic);
  on('ae-vtoggle', 'click', () => { ED.vOn = !ED.vOn; $e('ae-vtoggle').classList.toggle('on', ED.vOn); edVicBuild(); }); on('ae-vchar', 'change', e => { ED.vchar = e.target.value; edVicBuild(); });
  on('ae-new', 'click', () => { const nm = (prompt('Nombre del clip nuevo', 'mi_animacion') || '').trim().replace(/\s+/g, '_'); if (!nm) return; const D = bbSet(ED.setId); if (D[nm]) return edMsg('Ya existe un clip con ese nombre', true); D[nm] = { length: 1, loop: false, contacts: [], channels: [], samples: [[0], [1]] }; (ED.saved[ED.setId] = ED.saved[ED.setId] || {})[nm] = { name: nm, length: 1, loop: false, contacts: [], tracks: {}, user: true }; edStore(); edOpenClip(ED.setId, nm); edMsg('Clip creado: ' + nm); });
  on('ae-undo', 'click', edUndo); on('ae-redo', 'click', edRedo); on('ae-dup', 'click', edDup); on('ae-delclip', 'click', edDelClip);
  on('ae-ref', 'change', e => edRefSet(e.target.value)); on('ae-refup', 'click', () => $e('ae-reffile').click()); on('ae-reffile', 'change', e => { if (e.target.files[0]) edRefFile(e.target.files[0]); e.target.value = ''; });
  on('ae-refoff', 'change', e => { if (ED.ref) { ED.ref.off = +e.target.value || 0; if (ED.playing) edRefStart(); } }); on('ae-reflen', 'click', () => { if (!ED.ref) return edMsg('Primero elige un audio de referencia', true); edPush(); ED.clip.length = +(ED.ref.buf.duration + ED.ref.off + .3).toFixed(2); edProps(); edMsg('Duración ajustada al audio'); });
  on('ae-first', 'click', () => { ED.time = 0; }); on('ae-last', 'click', () => { ED.time = ED.clip.length; });
  on('ae-play', 'click', () => { ED.playing = !ED.playing; if (ED.playing && ED.time >= ED.clip.length) ED.time = 0; });
  on('ae-loop', 'click', () => { ED.loop = !ED.loop; $e('ae-loop').classList.toggle('on', ED.loop); });
  on('ae-snap', 'click', () => { ED.snap = !ED.snap; $e('ae-snap').classList.toggle('on', ED.snap); });
  on('ae-curves', 'click', () => { ED.curves = !ED.curves; $e('ae-curves').classList.toggle('on', ED.curves); });
  on('ae-speed', 'change', e => { ED.speed = clamp(+e.target.value || 1, .05, 4); });
  on('ae-len', 'change', e => { edPush(); ED.clip.length = Math.max(.05, +e.target.value || 1); edProps(); });
  on('ae-add', 'click', () => edAddKeys(false)); on('ae-addxyz', 'click', () => edAddKeys(true)); on('ae-del', 'click', edDelSel); on('ae-copy', 'click', edCopy); on('ae-paste', 'click', edPaste);
  const view = $e('ae-view'); let dr = null; view.addEventListener('pointerdown', e => { dr = { x: e.clientX, r: ED.rotY }; view.setPointerCapture(e.pointerId); }); view.addEventListener('pointermove', e => { if (dr) ED.rotY = dr.r + (e.clientX - dr.x) * .01; }); view.addEventListener('pointerup', () => { dr = null; });
  view.addEventListener('wheel', e => { e.preventDefault(); ED.camZ = clamp(ED.camZ + e.deltaY * .004, 2.2, 10); }, { passive: false });
  ED.cv = $e('ae-cv'); edBindTimeline();
  addEventListener('keydown', edKey);
}
function edKey(e) {
  if (!ED.on || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = e.code, ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k === 'KeyZ') { e.preventDefault(); e.shiftKey ? edRedo() : edUndo(); } else if (ctrl && k === 'KeyY') { e.preventDefault(); edRedo(); } else if (ctrl && k === 'KeyC') { edCopy(); } else if (ctrl && k === 'KeyV') { edPaste(); } else if (ctrl && k === 'KeyS') { e.preventDefault(); edSaveGame(); } else if (ctrl && k === 'KeyA') { e.preventDefault(); edSelAll(); }
  else if (k === 'Space') { e.preventDefault(); document.getElementById('ae-play').click(); } else if (k === 'Delete' || k === 'Backspace') { edDelSel(); } else if (k === 'KeyK') { edAddKeys(e.shiftKey); }
  else if (k === 'ArrowLeft') { ED.time = Math.max(0, ED.time - 1 / (+document.getElementById('ae-fps').value || 60)); ED.playing = false; } else if (k === 'ArrowRight') { ED.time = Math.min(ED.clip.length, ED.time + 1 / (+document.getElementById('ae-fps').value || 60)); ED.playing = false; }
  else if (k === 'Home') ED.time = 0; else if (k === 'End') ED.time = ED.clip.length; else if (k === 'Escape') edClose();
}
function edTree() {
  const t = document.getElementById('ae-tree'); if (!t) return; t.innerHTML = '';
  for (const b of ED_BONES) {
    if (b.id === 'weapon' && !(SH.fig && SH.fig.spear)) continue;
    const n = Object.values(b.g).flat().reduce((s, c) => s + ((ED.clip.tracks[c] || []).length), 0);
    const el = document.createElement('div'); el.className = 'ae-bone' + (ED.selBone === b.id ? ' on' : ''); el.innerHTML = '<i style="background:' + b.col + '"></i>' + b.n + '<small>' + (n ? n + ' claves' : '—') + '</small>';
    el.addEventListener('click', () => { ED.selBone = b.id; ED.selChan = null; ED.open[b.id] = !ED.open[b.id] || ED.selBone !== b.id ? true : false; edRebuild(); });
    t.appendChild(el);
  }
}
// ----- claves
const edTimeSnap = t => { const f = +document.getElementById('ae-fps').value || 60; return ED.snap ? Math.round(t * f) / f : t; };
function edKeysOf(c) { return ED.clip.tracks[c] || (ED.clip.tracks[c] = []); }
function edSetKey(c, t, v, interp) {
  const ks = edKeysOf(c), f = 1 / (+document.getElementById('ae-fps').value || 60);
  let k = ks.find(x => Math.abs(x.t - t) < f * .5); if (!k) { k = { t: +t.toFixed(4), v, i: interp || (ks.length ? ks[ks.length - 1].i : 'catmull') || 'catmull' }; ks.push(k); ks.sort((a, b) => a.t - b.t); } else k.v = v;
  return k;
}
function edAddKeys(xyz) {
  const t = edTimeSnap(ED.time); let chans = [];
  const row = ED.selChan ? { c: ED.selChan } : null, b = ED_BONES.find(x => x.id === ED.selBone);
  if (xyz || !row) { const kind = row ? edKindOf(row.c) : 'rot'; chans = (b.g[kind] || b.g.rot || []).slice(); } else chans = [row.c];
  edPush(); for (const c of chans) { const k = edSetKey(c, t, edEvalChan(ED.clip, c, t)); ED.sel.add(k); } edRebuildPartial();
}
function edRebuildPartial() { edTree(); edProps(); }
function edDelSel() { if (!ED.sel.size) return; edPush(); for (const c of Object.keys(ED.clip.tracks)) ED.clip.tracks[c] = ED.clip.tracks[c].filter(k => !ED.sel.has(k)); ED.sel.clear(); edRebuildPartial(); }
function edCopy() { if (!ED.sel.size) return; let t0 = 1e9; const items = []; for (const c of Object.keys(ED.clip.tracks)) for (const k of ED.clip.tracks[c]) if (ED.sel.has(k)) { items.push({ c, k: JSON.parse(JSON.stringify(k)) }); t0 = Math.min(t0, k.t); } ED.clipboard = items.map(i => ({ c: i.c, k: Object.assign(i.k, { t: i.k.t - t0 }) })); edMsg(items.length + ' claves copiadas'); }
function edPaste() { if (!ED.clipboard || !ED.clipboard.length) return; edPush(); ED.sel.clear(); const t0 = edTimeSnap(ED.time); for (const it of ED.clipboard) { const k = edSetKey(it.c, t0 + it.k.t, it.k.v, it.k.i); if (it.k.b) k.b = it.k.b.slice(); k.i = it.k.i; ED.sel.add(k); } edRebuildPartial(); }
// ----- panel de propiedades
const ED_INTERPS = () => '<option value="catmull">Suave (Catmull-Rom)</option><option value="linear">Lineal</option><option value="step">Escalón</option><option value="bezier">Bézier cúbica</option>' + Object.keys(ED_EASE).map(n => '<optgroup label="' + ED_EASE_ES[n] + '"><option value="' + n + ':in">' + ED_EASE_ES[n] + ' · entrada</option><option value="' + n + ':out">' + ED_EASE_ES[n] + ' · salida</option><option value="' + n + ':inout">' + ED_EASE_ES[n] + ' · entrada y salida</option></optgroup>').join('');
function edProps() {
  const p = document.getElementById('ae-props'); if (!p || !ED.clip) return; const clip = ED.clip, b = ED_BONES.find(x => x.id === ED.selBone), sel = [...ED.sel], k0 = sel[0];
  let h = '';
  if (k0) {
    const c0 = Object.keys(clip.tracks).find(c => clip.tracks[c].includes(k0)), many = sel.length > 1, cur = typeof k0.v === 'string' ? k0.v : String(+edShow(c0, k0.v).toFixed(4));
    h += '<div class="ae-card"><h4>KEYFRAME' + (many ? ' (' + sel.length + ')' : '') + ' · ' + (edBoneOf(c0) || {}).n + ' ' + edAxis(c0) + '</h4>' +
      '<div class="ae-field"><label>Tiempo (s)</label><input id="ae-kt" type="number" step=".01" value="' + k0.t + '"></div>' +
      '<div class="ae-field"><label>Valor / fórmula</label><input id="ae-kv" type="text" value="' + cur.replace(/"/g, '&quot;') + '" ' + (many ? 'placeholder="(varios)"' : '') + '></div><div class="ae-err" id="ae-kerr"></div>' +
      '<div class="ae-field"><label>Interpolación</label><select id="ae-ki">' + ED_INTERPS() + '</select></div>' +
      '<div class="ae-field" id="ae-kbz" style="display:none"><label>Bézier</label><input id="ae-kb" type="text" value="' + (k0.b || [.25, .1, .25, 1]).join(', ') + '"></div>' +
      '<div class="ae-btns"><button id="ae-kdup">Duplicar</button><button id="ae-kdel" class="warn">Borrar</button></div></div>';
  } else {
    h += '<div class="ae-card"><h4>' + (ED.tg === 'vic' ? 'VÍCTIMA' : 'ATACANTE') + ' · ' + clip.name + '</h4><div class="ae-field"><label>Contactos (s)</label><input id="ae-contacts" type="text" value="' + clip.contacts.join(', ') + '" placeholder="0.2, 0.55"></div><label style="display:flex;gap:7px;align-items:center"><input type="checkbox" id="ae-cloop" ' + (clip.loop ? 'checked' : '') + '> Animación en bucle</label>' +
      '<div class="ae-help">Los <b>contactos</b> son los instantes del golpe: el juego sincroniza el cuerpo con ellos.</div></div>';
  }
  h += '<div class="ae-card"><h4>POSE · ' + b.n.toUpperCase() + ' <small style="color:#6f7a90">en t=' + ED.time.toFixed(2) + ' s</small></h4>';
  for (const kind of ['rot', 'pos', 'scl']) for (const c of b.g[kind] || []) {
    const v = edShow(c, edEvalChan(clip, c, ED.time)), rg = kind === 'rot' ? 180 : kind === 'pos' ? 12 : 2, mn = kind === 'scl' ? 0 : -rg;
    h += '<div class="ae-sl"><span style="color:' + b.col + '">' + edAxis(c) + '</span><input type="range" data-c="' + c + '" min="' + mn + '" max="' + rg + '" step="' + (kind === 'rot' ? 1 : .05) + '" value="' + v.toFixed(3) + '"><input type="number" data-n="' + c + '" step="' + (kind === 'rot' ? 1 : .05) + '" value="' + (+v.toFixed(3)) + '"></div>';
  }
  h += '<div class="ae-help">Mover un deslizador crea o cambia la clave en el cursor.</div></div>';
  { const P = ED.att.paths || {}, fmt = a => JSON.stringify(a && a.length ? a : null) || '';
    h += '<div class="ae-card"><h4>TRAYECTORIAS (APOS / VPOS)</h4><div class="ae-help"><code>apos</code> mueve al atacante y <code>vpos</code> a la víctima, como en el código: <code>[tiempo, x, y, z, giro]</code> en metros (z = hacia adelante).</div>' +
      '<div class="ae-field"><label>apos</label><textarea id="ae-apos" rows="2" style="width:100%;background:#14161c;color:#e6e9f0;border:1px solid #394050;border-radius:4px">' + (P.apos ? JSON.stringify(P.apos) : '') + '</textarea></div>' +
      '<div class="ae-field"><label>vpos</label><textarea id="ae-vpos" rows="2" style="width:100%;background:#14161c;color:#e6e9f0;border:1px solid #394050;border-radius:4px">' + (P.vpos ? JSON.stringify(P.vpos) : '') + '</textarea></div><div class="ae-err" id="ae-perr"></div>' +
      '<div class="ae-btns"><button id="ae-ppos">+ Posición víctima en el cursor</button><button id="ae-pcopy">Copiar código</button></div></div>'; }
  h += '<details class="ae-card" open><summary style="cursor:pointer;color:#8791a6;font-size:11px;letter-spacing:.14em;font-weight:700">FÓRMULAS (MATEMÁTICAS)</summary><div class="ae-help">Escribe una fórmula en <b>Valor</b> y la clave se calcula en cada instante. En rotaciones, el resultado son grados.<br>' +
    'Variables: <code>time</code> <code>life</code> (0→1) <code>length</code> <code>pi</code><br>Funciones (trig. en grados): <code>sin cos tan atan2 abs min max clamp lerp floor ceil round sqrt pow mod noise saw tri step smoothstep bounce random</code><br>Operadores: <code>+ - * / % ^ ? : &lt; &gt; == &amp;&amp; ||</code><br>' +
    'Ejemplos:<br><code>sin(time*360)*20</code> balanceo de 1 Hz<br><code>abs(sin(time*180))*30</code> rebote<br><code>noise(time*4)*8</code> temblor<br><code>time&gt;0.5 ? 40 : 0</code> salto brusco</div></details>';
  p.innerHTML = h; edBindProps();
  const li = document.getElementById('ae-len'); if (li) li.value = clip.length; const ki = document.getElementById('ae-ki'); if (ki && k0) { ki.value = k0.i || 'catmull'; document.getElementById('ae-kbz').style.display = ki.value === 'bezier' ? 'grid' : 'none'; }
}
function edBindProps() {
  const g = id => document.getElementById(id), sel = [...ED.sel], clip = ED.clip;
  const kerr = g('ae-kerr');
  if (g('ae-kt')) g('ae-kt').addEventListener('change', e => { edPush(); const dt = edTimeSnap(Math.max(0, +e.target.value || 0)) - sel[0].t; for (const k of sel) k.t = Math.max(0, +(k.t + dt).toFixed(4)); for (const c of Object.keys(clip.tracks)) clip.tracks[c].sort((a, b) => a.t - b.t); edProps(); });
  if (g('ae-kv')) g('ae-kv').addEventListener('change', e => {
    const s = e.target.value.trim(); if (!s) return; const num = /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s);
    try { if (!num) edCompile(s); } catch (er) { kerr.textContent = er.message; return; } kerr.textContent = ''; edPush();
    for (const k of sel) { const c = Object.keys(clip.tracks).find(cc => clip.tracks[cc].includes(k)); k.v = num ? edUnshow(c, parseFloat(s)) : s; } edProps();
  });
  if (g('ae-ki')) g('ae-ki').addEventListener('change', e => { edPush(); for (const k of sel) { k.i = e.target.value; if (k.i === 'bezier' && !k.b) k.b = [.25, .1, .25, 1]; } g('ae-kbz').style.display = e.target.value === 'bezier' ? 'grid' : 'none'; });
  if (g('ae-kb')) g('ae-kb').addEventListener('change', e => { const a = e.target.value.split(',').map(x => parseFloat(x)); if (a.length === 4 && a.every(Number.isFinite)) { edPush(); for (const k of sel) k.b = [clamp(a[0], 0, 1), a[1], clamp(a[2], 0, 1), a[3]]; } });
  if (g('ae-kdup')) g('ae-kdup').addEventListener('click', () => { edPush(); const nk = []; for (const c of Object.keys(clip.tracks)) for (const k of clip.tracks[c].slice()) if (ED.sel.has(k)) { const d = JSON.parse(JSON.stringify(k)); d.t = +(d.t + .2).toFixed(4); clip.tracks[c].push(d); nk.push(d); clip.tracks[c].sort((a, b) => a.t - b.t); } ED.sel = new Set(nk); edProps(); });
  if (g('ae-kdel')) g('ae-kdel').addEventListener('click', edDelSel);
  const parsePath = txt => { const s2 = (txt || '').trim(); if (!s2) return null; const a = (new Function('return ' + s2.replace(/(^|[^\d])\.(\d)/g, '$10.$2')))(); if (!Array.isArray(a) || !a.length || !a.every(k => Array.isArray(k) && k.length >= 4)) throw new Error('Formato: [[t,x,y,z,giro],...]'); return a; };
  for (const k of ['apos', 'vpos']) if (g('ae-' + k)) g('ae-' + k).addEventListener('change', e => { try { const a = parsePath(e.target.value); g('ae-perr').textContent = ''; edPush(); ED.att.paths = Object.assign({}, ED.att.paths); if (a) ED.att.paths[k] = a; else delete ED.att.paths[k]; } catch (er) { g('ae-perr').textContent = er.message; } });
  if (g('ae-ppos')) g('ae-ppos').addEventListener('click', () => { edPush(); const t = +edTimeSnap(ED.time).toFixed(3), cur = hermArr(edPath('vpos'), ED.time), ks = (ED.att.paths && ED.att.paths.vpos ? ED.att.paths.vpos.slice() : edPath('vpos').map(x => x.slice())).filter(k => Math.abs(k[0] - t) > 1e-3); ks.push([t, +cur[0].toFixed(3), +cur[1].toFixed(3), +cur[2].toFixed(3), +cur[3].toFixed(3)]); ks.sort((a, b) => a[0] - b[0]); ED.att.paths = Object.assign({}, ED.att.paths, { vpos: ks }); edProps(); });
  if (g('ae-pcopy')) g('ae-pcopy').addEventListener('click', () => { const txt = 'apos: ' + JSON.stringify(edPath('apos')) + ',\nvpos: ' + JSON.stringify(edPath('vpos')) + ','; try { navigator.clipboard.writeText(txt); edMsg('Código copiado (apos y vpos)'); } catch (er) { prompt('Copia este código', txt); } });
  if (g('ae-contacts')) g('ae-contacts').addEventListener('change', e => { edPush(); clip.contacts = e.target.value.split(',').map(x => parseFloat(x)).filter(Number.isFinite); });
  if (g('ae-cloop')) g('ae-cloop').addEventListener('change', e => { edPush(); clip.loop = e.target.checked; });
  const setV = (c, val) => { const t = edTimeSnap(ED.time); if (!ED.slPush) { edPush(); ED.slPush = true; setTimeout(() => { ED.slPush = false; }, 600); } const k = edSetKey(c, t, edUnshow(c, val)); if (typeof k.v !== 'number') k.v = edUnshow(c, val); edTree(); };
  document.querySelectorAll('#ae-props input[data-c]').forEach(r => r.addEventListener('input', e => { setV(r.dataset.c, +e.target.value); const n = document.querySelector('#ae-props input[data-n="' + r.dataset.c + '"]'); if (n) n.value = e.target.value; }));
  document.querySelectorAll('#ae-props input[data-n]').forEach(r => r.addEventListener('change', e => { setV(r.dataset.n, +e.target.value || 0); const s = document.querySelector('#ae-props input[data-c="' + r.dataset.n + '"]'); if (s) s.value = e.target.value; }));
}
// ----- línea de tiempo (lienzo)
let ED_RH = 20; const ED_LW = 190, ED_ROW = 22;
function edBindTimeline() {
  const cv = ED.cv, x2t = x => (x - ED_LW) / ED.zoom + ED.scroll, t2x = t => (t - ED.scroll) * ED.zoom + ED_LW;
  const rowAt = y => Math.floor((y - ED_RH + ED.vscroll) / ED_ROW), rowKeys = r => r.t === 'chan' ? [r.c] : Object.values(r.b.g).flat();
  const hitKeys = (x, y) => {
    const r = ED.rows[rowAt(y)]; if (!r) return null; let best = null, bd = 10;
    for (const c of rowKeys(r)) for (const k of ED.clip.tracks[c] || []) { const d = Math.abs(t2x(k.t) - x); if (d < bd) { bd = d; best = k; } }
    if (!best) return null; if (r.t === 'chan') return [best];
    const out = []; for (const c of rowKeys(r)) for (const k of ED.clip.tracks[c] || []) if (Math.abs(k.t - best.t) < 5e-4) out.push(k); return out;
  };
  const inBox = b => {
    const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1), found = [];
    if (ED.curves) { for (const p of ED.curvePts || []) if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) found.push(p.k); return found; }
    for (let i = Math.max(0, rowAt(y0)); i <= Math.min(ED.rows.length - 1, rowAt(y1)); i++) for (const c of rowKeys(ED.rows[i])) for (const k of ED.clip.tracks[c] || []) { const x = t2x(k.t); if (x >= x0 && x <= x1) found.push(k); }
    return found;
  };
  const scrubTo = x => { ED.time = clamp(edTimeSnap(x2t(x)), 0, edLen()); ED.playing = false; };
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; cv.setPointerCapture(e.pointerId);
    if (y < ED_RH) { ED.drag = { m: 'scrub' }; scrubTo(x); return; }
    if (x < ED_LW) { const row = ED.rows[rowAt(y)]; if (row) { if (row.t === 'bone') { ED.selBone = row.b.id; ED.open[row.b.id] = !ED.open[row.b.id]; ED.selChan = null; } else { ED.selBone = row.b.id; ED.selChan = row.c; } edRebuild(); } return; }
    if (ED.curves) {
      const pt = (ED.curvePts || []).find(p => Math.hypot(p.x - x, p.y - y) < 10);
      if (pt) { if (!e.shiftKey && !ED.sel.has(pt.k)) ED.sel.clear(); ED.sel.add(pt.k); edPush(); ED.drag = { m: 'curve', k: pt.k, c: pt.c, x0: x, y0: y, v0: pt.k.v, t0: pt.k.t }; edProps(); return; }
      ED.drag = { m: 'box', x0: x, y0: y, x1: x, y1: y, add: e.shiftKey, moved: false, click: x }; return;
    }
    const ks = hitKeys(x, y), row = ED.rows[rowAt(y)];
    if (ks) {
      const all = ks.every(k => ED.sel.has(k)); if (!all) { if (!e.shiftKey) ED.sel.clear(); ks.forEach(k => ED.sel.add(k)); } else if (e.shiftKey) ks.forEach(k => ED.sel.delete(k));
      edPush(); ED.drag = { m: 'move', x0: x, t0: new Map([...ED.sel].map(q => [q, q.t])) }; if (row) { ED.selBone = row.b.id; if (row.t === 'chan') ED.selChan = row.c; } edProps(); return;
    }
    ED.drag = { m: 'box', x0: x, y0: y, x1: x, y1: y, add: e.shiftKey, moved: false, click: x, row };
  });
  cv.addEventListener('pointermove', e => {
    const d = ED.drag; if (!d) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (d.m === 'scrub') scrubTo(x);
    else if (d.m === 'box') { d.x1 = x; d.y1 = y; if (Math.hypot(x - d.x0, y - d.y0) > 4) d.moved = true; }
    else if (d.m === 'move') { const dt = (x - d.x0) / ED.zoom; for (const [k, t0] of d.t0) k.t = +Math.max(0, edTimeSnap(t0 + dt)).toFixed(4); for (const c of Object.keys(ED.clip.tracks)) ED.clip.tracks[c].sort((a, b) => a.t - b.t); }
    else if (d.m === 'curve') { const k = d.k; k.t = +Math.max(0, edTimeSnap(d.t0 + (x - d.x0) / ED.zoom)).toFixed(4); if (typeof d.v0 === 'number' && ED.curveScale) { k.v = d.v0 + edUnshow(d.c, -(y - d.y0) / ED.curveScale); } ED.clip.tracks[d.c].sort((a, b) => a.t - b.t); }
  });
  cv.addEventListener('pointerup', () => {
    const d = ED.drag; ED.drag = null; if (!d) return;
    if (d.m === 'box') {
      if (d.moved) { const f = inBox(d); if (!d.add) ED.sel.clear(); f.forEach(k => ED.sel.add(k)); if (f.length) { const c = Object.keys(ED.clip.tracks).find(cc => ED.clip.tracks[cc].includes(f[0])), b = c && edBoneOf(c); if (b) ED.selBone = b.id; } edProps(); edTree(); }
      else { const row = d.row; if (row) { ED.selBone = row.b.id; ED.selChan = row.t === 'chan' ? row.c : null; } if (!d.add) ED.sel.clear(); scrubTo(d.click); edProps(); edTree(); }
    } else if (d.m !== 'scrub') edProps();
  });
  cv.addEventListener('dblclick', e => {
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (y < ED_RH) return; const row = ED.rows[rowAt(y)]; if (!row) return;
    if (x < ED_LW) { ED.sel.clear(); for (const c of rowKeys(row)) for (const k of ED.clip.tracks[c] || []) ED.sel.add(k); edProps(); return; }
    if (row.t !== 'chan' || ED.curves) return; edPush(); const t = clamp(edTimeSnap(x2t(x)), 0, edLen()), k = edSetKey(row.c, t, edEvalChan(ED.clip, row.c, t)); ED.sel.clear(); ED.sel.add(k); ED.selChan = row.c; ED.selBone = row.b.id; edProps(); edTree();
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); if (e.ctrlKey) { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, t = x2t(x); ED.zoom = clamp(ED.zoom * (e.deltaY < 0 ? 1.15 : .87), 30, 1400); ED.scroll = t - (x - ED_LW) / ED.zoom; } else if (e.shiftKey) ED.scroll += e.deltaY / ED.zoom * .6; else ED.vscroll = clamp(ED.vscroll + e.deltaY * .6, 0, Math.max(0, ED.rows.length * ED_ROW - 150)); }, { passive: false });
}
function edSelAll() { ED.sel.clear(); for (const c of Object.keys(ED.clip.tracks)) for (const k of ED.clip.tracks[c]) ED.sel.add(k); edProps(); edMsg(ED.sel.size + ' claves seleccionadas'); }
function edDraw() {
  const cv = ED.cv; if (!cv || !ED.clip) return; const dpr = devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = '#14161c'; g.fillRect(0, 0, W, H);
  const t2x = t => (t - ED.scroll) * ED.zoom + ED_LW, clip = ED.clip;
  g.font = '11px ui-monospace,Consolas,monospace'; g.textBaseline = 'middle';
  // filas
  ED.rows.forEach((r, i) => {
    const y = ED_RH + i * ED_ROW - ED.vscroll; if (y + ED_ROW < ED_RH || y > H) return;
    const selRow = r.t === 'chan' ? ED.selChan === r.c : ED.selBone === r.b.id && !ED.selChan;
    g.fillStyle = selRow ? '#243049' : i % 2 ? '#171a21' : '#191c24'; g.fillRect(0, y, W, ED_ROW);
    g.fillStyle = r.b.col; if (r.t === 'bone') { g.fillRect(8, y + 7, 8, 8); g.fillStyle = '#e6e9f0'; g.font = 'bold 12px "Chakra Petch",system-ui'; g.fillText((ED.open[r.b.id] ? '▾ ' : '▸ ') + r.b.n, 22, y + 11); } else { g.font = '11px "Chakra Petch",system-ui'; g.fillStyle = '#9aa4b8'; g.fillText((r.k === 'rot' ? 'Rot ' : r.k === 'pos' ? 'Pos ' : 'Esc ') + edAxis(r.c), 30, y + 11); g.fillStyle = r.b.col; g.fillRect(20, y + 9, 4, 4); }
  });
  // fondo de la pista y reglas
  g.save(); g.beginPath(); g.rect(ED_LW, 0, W - ED_LW, H); g.clip();
  g.fillStyle = '#1b1e26'; g.fillRect(ED_LW, 0, W - ED_LW, ED_RH);
  if (ED.ref) {
    const y0 = 20, h = ED_RH - 22, mid = y0 + h / 2 + 1, dur = ED.ref.buf.duration, pk = ED.ref.pk; g.fillStyle = '#10131a'; g.fillRect(ED_LW, y0, W - ED_LW, h + 2); g.strokeStyle = '#4dd2ff'; g.lineWidth = 1;
    for (let x = ED_LW; x < W; x++) { const t = (x - ED_LW) / ED.zoom + ED.scroll - ED.ref.off; if (t < 0 || t > dur) continue; const i = Math.min(pk.length - 1, Math.floor(t / dur * pk.length)), a = Math.max(1, pk[i] * (h / 2)); g.beginPath(); g.moveTo(x + .5, mid - a); g.lineTo(x + .5, mid + a); g.stroke(); }
    g.fillStyle = '#4dd2ff'; g.font = '10px ui-monospace,Consolas,monospace'; g.fillText('♪ ' + ED.ref.name, ED_LW + 6, y0 + 8); g.fillRect(t2x(ED.ref.off + dur) - 1, y0, 2, h + 2);
  }
  g.strokeStyle = '#262b36'; g.fillStyle = '#7e889c'; g.font = '10px ui-monospace,Consolas,monospace';
  const step = ED.zoom > 900 ? .05 : ED.zoom > 450 ? .1 : ED.zoom > 220 ? .25 : ED.zoom > 100 ? .5 : 1, t0 = Math.floor(ED.scroll / step) * step;
  for (let t = t0; t2x(t) < W; t += step) { const x = t2x(t); if (x < ED_LW) continue; g.beginPath(); g.moveTo(x, ED_RH); g.lineTo(x, H); g.stroke(); g.fillText(t.toFixed(step < .1 ? 2 : 2), x + 3, 10); }
  g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(t2x(clip.length), ED_RH, W, H);
  g.strokeStyle = '#3a4560'; g.beginPath(); g.moveTo(t2x(0), ED_RH); g.lineTo(t2x(0), H); g.moveTo(t2x(clip.length), ED_RH); g.lineTo(t2x(clip.length), H); g.stroke();
  for (const c of clip.contacts) { const x = t2x(c); g.fillStyle = '#ff5a5a'; g.fillRect(x - 1, ED_RH, 2, 6); }
  // claves o curvas
  const KC = k => typeof k.v === 'string' ? '#ff8bf0' : !k.i || k.i === 'catmull' ? '#ffd23f' : k.i === 'linear' ? '#7dff6a' : k.i === 'step' ? '#ff6a6a' : k.i === 'bezier' ? '#b06bff' : '#4dd2ff';
  const drawKey = (x, y, k) => { g.save(); g.translate(x, y); const s = ED.sel.has(k); g.fillStyle = KC(k); g.strokeStyle = s ? '#fff' : '#0008'; g.lineWidth = s ? 2 : 1; g.beginPath(); if (k.i === 'step') g.rect(-4, -4, 8, 8); else { g.moveTo(0, -6); g.lineTo(5, 0); g.lineTo(0, 6); g.lineTo(-5, 0); g.closePath(); } g.fill(); g.stroke(); g.restore(); };
  if (!ED.curves) {
    ED.curvePts = null;
    ED.rows.forEach((r, i) => { const y = ED_RH + i * ED_ROW - ED.vscroll + ED_ROW / 2; if (y < ED_RH - 8 || y > H + 8) return; const cs = r.t === 'chan' ? [r.c] : Object.values(r.b.g).flat(), seen = new Set(); for (const c of cs) for (const k of clip.tracks[c] || []) { const key = r.t === 'bone' ? k.t.toFixed(3) : null; if (key) { if (seen.has(key) && !ED.sel.has(k)) continue; seen.add(key); } drawKey(t2x(k.t), y, k); } });
  } else {
    const b = ED_BONES.find(x => x.id === ED.selBone), kind = ED.selChan ? edKindOf(ED.selChan) : 'rot', cs = ED.selChan ? [ED.selChan] : (b.g[kind] || []);
    let mn = 1e9, mx = -1e9; const N = 140, tot = Math.max(.05, clip.length); for (const c of cs) for (let i = 0; i <= N; i++) { const v = edShow(c, edEvalChan(clip, c, tot * i / N)); mn = Math.min(mn, v); mx = Math.max(mx, v); } if (mn === 1e9) { mn = -1; mx = 1; } if (mx - mn < .01) { mn -= .5; mx += .5; }
    const top = ED_RH + 14, bot = H - 14, sc = (bot - top) / (mx - mn); ED.curveScale = sc; const vy = v => bot - (v - mn) * sc;
    g.strokeStyle = '#2a3040'; g.fillStyle = '#6f7a90'; for (let i = 0; i <= 4; i++) { const v = mn + (mx - mn) * i / 4, y = vy(v); g.beginPath(); g.moveTo(ED_LW, y); g.lineTo(W, y); g.stroke(); g.fillText(v.toFixed(2), ED_LW + 4, y - 6); }
    ED.curvePts = []; const cols = ['#ff6a6a', '#7dff6a', '#4dd2ff'];
    cs.forEach((c, ci) => { g.strokeStyle = cols[ci % 3]; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i <= N * 2; i++) { const t = tot * i / (N * 2), x = t2x(t), y = vy(edShow(c, edEvalChan(clip, c, t))); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1; for (const k of clip.tracks[c] || []) { const kx = t2x(k.t), ky = vy(edShow(c, edKeyVal(clip, c, k, k.t))); drawKey(kx, ky, k); ED.curvePts.push({ x: kx, y: ky, k, c }); } });
    g.fillStyle = '#9aa4b8'; g.fillText(cs.map(c => edAxis(c)).join(' · ') + ' (' + ED_KIND[kind] + ')', ED_LW + 6, H - 6);
  }
  if (ED.drag && ED.drag.m === 'box' && ED.drag.moved) { const d = ED.drag; g.fillStyle = 'rgba(62,139,255,.18)'; g.strokeStyle = '#6aa6ff'; g.lineWidth = 1; g.fillRect(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)); g.strokeRect(Math.min(d.x0, d.x1) + .5, Math.min(d.y0, d.y1) + .5, Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0)); }
  // cabezal
  const px = t2x(ED.time); g.strokeStyle = '#3e8bff'; g.lineWidth = 2; g.beginPath(); g.moveTo(px, 0); g.lineTo(px, H); g.stroke(); g.fillStyle = '#3e8bff'; g.beginPath(); g.moveTo(px - 6, 0); g.lineTo(px + 6, 0); g.lineTo(px, 11); g.closePath(); g.fill();
  g.restore(); g.strokeStyle = '#2b303b'; g.beginPath(); g.moveTo(ED_LW, 0); g.lineTo(ED_LW, H); g.stroke();
  g.fillStyle = '#1b1e26'; g.fillRect(0, 0, ED_LW, ED_RH); g.fillStyle = '#7e889c'; g.font = '10px "Chakra Petch",system-ui'; g.fillText('CANALES · ' + (ED.curves ? 'CURVAS' : 'CLAVES'), 8, 10);
}
function edLoop() {
  if (!ED.on) return; requestAnimationFrame(edLoop); edDraw();
  const fps = +document.getElementById('ae-fps').value || 60, f = Math.round(ED.time * fps), tot = Math.round(ED.clip.length * fps), m = Math.floor(ED.time / 60), s = Math.floor(ED.time % 60);
  document.getElementById('ae-time').textContent = m + ':' + String(s).padStart(2, '0') + ':' + String(f % fps).padStart(2, '0') + ' / ' + tot; document.getElementById('ae-play').textContent = ED.playing ? '❚❚' : '▶';
  const me = document.getElementById('ae-msg'); if (ED.msgT > 0) { ED.msgT -= 1 / 60; if (ED.msgT <= 0) me.style.opacity = 0; }
  if (!ED.sliderBusy && ED.playing) { document.querySelectorAll('#ae-props input[data-c]').forEach(r => { const v = edShow(r.dataset.c, edEvalChan(ED.clip, r.dataset.c, ED.time)); r.value = v.toFixed(3); const n = document.querySelector('#ae-props input[data-n="' + r.dataset.c + '"]'); if (n && document.activeElement !== n) n.value = +v.toFixed(3); }); }
}
// pose en el modelo de la vista previa (la llama updateShow)
function edShowFrame(f, dt) {
  if (ED.playing && !ED.audPlaying) edRefStart(); if (!ED.playing && ED.audPlaying) edRefStop(); ED.audPlaying = ED.playing;
  const L = edLen();
  if (ED.playing) { ED.time += dt * ED.speed; if (ED.time >= L) { if (ED.loop) { ED.time %= L; edRefStart(); } else { ED.time = L; ED.playing = false; } } }
  const t = ED.time, ap = hermArr(edPath('apos'), t), vp = hermArr(edPath('vpos'), t), A = L2W(ED_ZERO, ED.rotY, ap[0], ap[1], ap[2]), V = L2W(ED_ZERO, ED.rotY, vp[0], vp[1], vp[2]);
  for (const j of JOINTS) f.anim.x[j] = edEvalChan(ED.att, j, t);
  if (f.spear && !f.spearOut) { setSpear(f, true); f.spear.visible = true; }
  f.anim.bbR6 = true; f.anim.apply(); f.model.root.position.set(A.x, .1 + A.y, A.z); f.model.root.rotation.y = ED.rotY + ap[3];
  if (f.model.gripRot) f.model.gripRot.rotation.x = f.anim.x.sx;
  const vf = ED.vfig; if (vf) {
    for (const j of JOINTS) vf.anim.x[j] = ED.vic ? edEvalChan(ED.vic, j, t) : edDef(j);
    vf.anim.bbR6 = true; vf.anim.apply(); vf.model.root.position.set(V.x, .1 + V.y, V.z); vf.model.root.rotation.y = ED.rotY + Math.PI + vp[3]; vf.model.root.visible = true;
  }
  const mx = vf ? (A.x + V.x) / 2 : A.x, mz = vf ? (A.z + V.z) / 2 : A.z;
  SH.parts.update(dt); SH.camZ += (ED.camZ - SH.camZ) * Math.min(1, dt * 6); SH.cam.position.set(mx, 1.7, mz + SH.camZ); SH.cam.lookAt(mx, 0.85, mz);
  SH.key.intensity += (.95 - SH.key.intensity) * Math.min(1, dt * 4);
}

edLoadSaved();

  return { ED, ED_BONES, ED_CACHE, ED_DEFPATH, ED_EASE, ED_EASE_ES, ED_FN, ED_INTERPS, ED_KIND, ED_LW, ED_ROT, ED_ROW, ED_SETS, ED_ZERO, edAddKeys, edAxis, edBack, edBezier, edBindProps, edBindTimeline, edBoneOf, edBounceOut, edBuild, edClose, edComicInit, edCompile, edCompileClip, edCopy, edDR, edDef, edDeg, edDelClip, edDelSel, edDraw, edDup, edEase, edElastic, edEvalChan, edExport, edFromGame, edImportFile, edKey, edKeyVal, edKeysOf, edKindOf, edLen, edLoadObj, edLoadSaved, edLoop, edMakeVic, edMsg, edNoise, edOpen, edOpenClip, edPair, edPaste, edPath, edPoint, edProps, edPush, edRebuild, edRebuildPartial, edRedo, edRefFile, edRefOptions, edRefSet, edRefStart, edRefStop, edRefUse, edRestore, edRestoreSnap, edRun, edSaveGame, edSelAll, edSetKey, edSetTarget, edShow, edShowFrame, edSnap, edStore, edTimeSnap, edTree, edUndo, edUnshow, edVicBuild, edVicDispose };
};
