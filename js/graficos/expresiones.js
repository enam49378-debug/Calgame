// Expresiones faciales y caras
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearExpresiones = function crearExpresiones(D) {
  'use strict';
  const { $, PX, camera, dist2d, fighterToonMaterial, rand, wrapA, yawTo } = D;

// ===== Expresiones procedurales: el juego encuentra ojos y boca en la cara de la skin y los redibuja =====
function copyCanvas(src) { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0); return c; }
// Lee la cara combinando la capa base con la del sombrero (muchas skins dibujan ojos o anteojos ahí).
// Busca dos ojos simétricos; si no está segura, no toca los ojos (solo la boca, si la zona es piel).
function analyzeFace(base, hat) {
  const B = base.data, H = hat.data;
  const comp = (x, y) => { const i = (y * 8 + x) * 4; return H[i + 3] > 128 ? [H[i], H[i + 1], H[i + 2]] : [B[i], B[i + 1], B[i + 2]]; };
  const onHat = (x, y) => H[(y * 8 + x) * 4 + 3] > 128;
  const cnt = {}; let skinKey = null, skin = [200, 160, 130];
  for (let y = 3; y < 8; y++) for (let x = 1; x < 7; x++) { const p = comp(x, y), k = (p[0] >> 4) + '-' + (p[1] >> 4) + '-' + (p[2] >> 4); cnt[k] = (cnt[k] || 0) + 1; if (!skinKey || cnt[k] > cnt[skinKey]) { skinKey = k; skin = p; } }
  const dist = p => Math.abs(p[0] - skin[0]) + Math.abs(p[1] - skin[1]) + Math.abs(p[2] - skin[2]);
  const isSkin = (x, y) => x >= 0 && x < 8 && y >= 0 && y < 8 && dist(comp(x, y)) < 70;
  const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v | 0)).toString(16).padStart(2, '0')).join('');
  const lid = hex(skin[0] * .86, skin[1] * .84, skin[2] * .84), line = hex(skin[0] * .45, skin[1] * .38, skin[2] * .36);
  let best = null;
  for (let y = 1; y <= 6; y++) {
    const xs = []; for (let x = 1; x < 7; x++) if (dist(comp(x, y)) > 80) xs.push(x);
    if (xs.length >= 6) { const vs = y >= 3 && y <= 5 ? 5 : 3.5; if (!best || best.score < vs) best = { score: vs, row: y, L: [], R: [], visor: true }; continue; }  // un visor a la altura de los ojos gana a una franja de pelo
    const L = xs.filter(x => x < 4 && xs.includes(7 - x)), R = L.map(x => 7 - x);   // solo pares simétricos
    if (!L.length) continue;
    const bright = xs.some(x => { const p = comp(x, y); return p[0] + p[1] + p[2] > 540; }), darkp = xs.some(x => { const p = comp(x, y); return p[0] + p[1] + p[2] < 200; });
    const score = 6 + L.length * 3 + (bright ? 3 : 0) + (darkp ? 2 : 0) + (y >= 3 && y <= 5 ? 2 : 0) - (xs.length - L.length * 2) * 2;
    if (!best || score > best.score) best = { score, row: y, L, R, visor: false };
  }
  const mouthRow = best && !best.visor ? Math.min(6, best.row + 2) : 6;
  const mouthOk = isSkin(3, mouthRow) && isSkin(4, mouthRow) && !onHat(3, mouthRow) && !onHat(4, mouthRow);
  if (!best || best.score < 9) return { ok: false, visor: !!(best && best.visor), row: best ? best.row : 4, L: [], R: [], lid, line, mouthRow, mouthOk };
  const tall = best.row < 7 && best.L.concat(best.R).every(x => dist(comp(x, best.row + 1)) > 80);
  return { ok: !best.visor, visor: best.visor, row: best.row, L: best.L, R: best.R, lid, line, tall, mouthRow, mouthOk, isSkin, onHat };
}
function setupFace(f, canvas, usePreset) {
  const g = canvas.getContext('2d');
  f.faceCtx = g; f.faceOrig = g.getImageData(8, 8, 8, 8); f.hatOrig = g.getImageData(40, 8, 8, 8);
  f.faceInfo = analyzeFace(f.faceOrig, f.hatOrig);
  f.faceKey = ''; f.blinkT = rand(1, 4);
  f.facePreset = usePreset ? faceCharId(f.ch) : null;
}
function drawFace(f, eyes, mouth) {
  const g = f.faceCtx, I = f.faceInfo, y = I.row, dark = '#1d120c';
  g.putImageData(f.faceOrig, 8, 8); g.putImageData(f.hatOrig, 40, 8);
  // pinta en la capa base y, si la capa del sombrero tapa ese píxel, también ahí
  const P = (x, yy, c) => { if (x < 0 || x > 7 || yy < 0 || yy > 7) return; g.fillStyle = c; g.fillRect(8 + x, 8 + yy, 1, 1); if (I.onHat && I.onHat(x, yy)) g.fillRect(40 + x, 8 + yy, 1, 1); };
  const skinAt = (x, yy) => I.isSkin && I.isSkin(x, yy);
  if (I.ok) {
    for (const grp of [I.L, I.R]) {
      const inner = grp === I.L ? Math.max(...grp) : Math.min(...grp), outer = grp === I.L ? Math.min(...grp) : Math.max(...grp);
      const closeTo = c => { if (I.tall) { grp.forEach(x => { P(x, y, I.lid); P(x, y + 1, c); }); } else grp.forEach(x => P(x, y, c)); };
      if (eyes === 'closed') closeTo(I.line);
      else if (eyes === 'angry') { if (skinAt(outer, y - 1)) P(outer, y - 1, dark); if (skinAt(inner, y - 1)) P(inner, y - 1, dark); P(inner, y, dark); }
      else if (eyes === 'hurt') { closeTo(dark); if (skinAt(outer, y - 1)) P(outer, y - 1, dark); }
      else if (eyes === 'ko') { closeTo(dark); if (skinAt(outer, y - 1)) P(outer, y - 1, dark); if (skinAt(inner, y - 1)) P(inner, y - 1, dark); }
      else if (eyes === 'happy') { if (skinAt(outer, y - 1) && skinAt(inner, y - 1)) { grp.forEach(x => { P(x, y, I.lid); if (I.tall) P(x, y + 1, I.lid); P(x, y - 1, dark); }); } else closeTo(I.line); }
      else if (eyes === 'glow') grp.forEach(x => { P(x, y, '#ffffff'); if (I.tall) P(x, y + 1, f.ch ? f.ch.color : '#ffffff'); });
    }
  } else if (I.visor && (eyes === 'glow' || eyes === 'angry')) { for (let x = 1; x < 7; x++) P(x, y, eyes === 'glow' ? '#ffffff' : '#ff8a8a'); }
  if (mouth === 'open' && I.mouthOk) { const my = I.mouthRow; P(3, my, '#3b0d0d'); P(4, my, '#3b0d0d'); if (my < 7 && skinAt(3, my + 1)) { P(3, my + 1, '#7a2222'); P(4, my + 1, '#7a2222'); } }
  f.model.tex.needsUpdate = true;
}
// ===== Expresiones hechas a mano (editables desde el EDITOR DE EXPRESIONES) =====
// Los datos están en FACE_DEFAULTS (los genera tools/gen-faces.py). Lo que edites en el editor se guarda en el navegador.
const FACE_STATES = [
  ['blink', 'Parpadeo'], ['idle', 'Normal (sin cambios)'], ['attack', 'Atacando'], ['attackShout', 'Atacando (primeros 0,35 s; si no la elegís usa "Atacando")'], ['awaken', 'Despertar'],
  ['flourish', 'Lucimiento (si no la elegís usa "Feliz")'], ['block', 'Bloqueando'], ['hurt', 'Golpeado'], ['stun', 'Mareado o congelado'], ['grabbed', 'Agarrado'],
  ['ragdoll', 'Por los aires'], ['ko', 'K.O.'], ['happy', 'Feliz'], ['glow', 'Despierto (aura)'], ['lowhp', 'Poca vida'], ['victory', 'Victoria'],
  ['glanceL', 'Mirada a la izquierda'], ['glanceR', 'Mirada a la derecha'], ['glanceU', 'Mirada hacia arriba'], ['glanceD', 'Mirada hacia abajo'],
];
// si una situación no tiene expresión usa la "pariente" y, si tampoco, la de reposo (casi todos los ataques duran menos de 0,35 s: sin esto solo se vería "al empezar")
const FACE_FALLBACK = { attackShout: 'attack', flourish: 'happy' };
const FACE_LIB = {};
function loadFaceLib() {
  for (const id in FACE_DEFAULTS) FACE_LIB[id] = JSON.parse(JSON.stringify(FACE_DEFAULTS[id]));
  try {
    const saved = JSON.parse(localStorage.getItem('bsb_faces') || 'null');
    if (saved && saved.__v === FACE_VER) for (const id in saved) if (id !== '__v' && FACE_LIB[id] && saved[id] && Array.isArray(saved[id].exprs)) FACE_LIB[id] = saved[id];
  } catch (e) { }
}
function refreshFaces() { for (const f of D.G.fighters) f.faceKey = ''; if (D.SH.fig) D.SH.fig.faceKey = ''; }
function saveFaceLib() { try { localStorage.setItem('bsb_faces', JSON.stringify(Object.assign({ __v: FACE_VER }, FACE_LIB))); } catch (e) { } refreshFaces(); }
const faceCharId = ch => Object.keys(D.CHARS).find(k => D.CHARS[k] === ch);
// pinta una expresión hecha a mano encima de la cara original (en la capa base y, si hay sombrero opaco ahí, también en esa)
// celdas que ocupan los ojos de la skin (dos filas), para taparlos con piel cuando hay una imagen encima
function faceEyeCells(I) {
  const cols = I.ok ? I.L.concat(I.R) : (I.visor ? [1, 2, 3, 4, 5, 6] : [1, 2, 5, 6]), cells = [];
  for (const x of cols) { cells.push([x, I.row]); if (I.row < 7) cells.push([x, I.row + 1]); }
  return cells;
}
function paintFacePreset(f, id) {
  const g = f.faceCtx, lib = FACE_LIB[f.facePreset]; g.putImageData(f.faceOrig, 8, 8); g.putImageData(f.hatOrig, 40, 8);
  const nm = lib && lib.exprs.find(e => e.id === 'normal'), ex = lib && lib.exprs.find(e => e.id === id), op = lib && lib.exprs.find(e => e.id === 'open');
  // una imagen que NO tapa los ojos (lágrimas, rubor, vena...) va sobre los ojos normales ("Ojos abiertos"), no sobre la cara sin ojos
  const keepEyes = !!(ex && ex.img && ex.img.hideEyes === false && op && ex !== op && ex !== nm);
  for (const L of [nm, keepEyes ? op : null, ex !== nm ? ex : null]) {
    if (!L) continue;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const c = L.grid[y][x]; if (c === '.') continue;
      const col = c === 'G' ? (f.ch ? f.ch.color : '#ffffff') : lib.pal[c]; if (!col) continue;
      g.fillStyle = col; g.fillRect(8 + x, 8 + y, 1, 1);
      if (f.hatOrig.data[(y * 8 + x) * 4 + 3] > 128) g.fillRect(40 + x, 8 + y, 1, 1);
    }
  }
  const imgx = (ex && ex.img) || (!ex && nm && nm.img) || null;
  if (imgx && imgx.hideEyes !== false && f.faceInfo) {
    // con una imagen de ojos encima, la piel tapa los ojos de la textura: se toma el color de la piel entre los ojos
    const I = f.faceInfo, hat = x => f.hatOrig.data[(I.row * 8 + x) * 4 + 3] > 128, sd = (hat(3) ? g.getImageData(43, 8 + I.row, 1, 1) : g.getImageData(11, 8 + I.row, 1, 1)).data;
    g.fillStyle = 'rgb(' + sd[0] + ',' + sd[1] + ',' + sd[2] + ')';
    for (const [x, y] of faceEyeCells(I)) { g.fillRect(8 + x, 8 + y, 1, 1); if (f.hatOrig.data[(y * 8 + x) * 4 + 3] > 128) g.fillRect(40 + x, 8 + y, 1, 1); }
  }
  setFaceDecal(f, imgx);
  f.model.tex.needsUpdate = true;
}
// situación del juego → nombre de estado (después el editor decide qué expresión usa cada estado)
function faceState(f, dt) {
  const a = f.action;
  if (f.alive === false) return 'ko';
  if (f.hurtT > 0 || f.flashT > .04) return 'hurt';
  if (f.grabbed || f.forcePose) return 'grabbed';
  if (f.ragdoll > 0) return 'ragdoll';
  if (f.stun > 0 || f.frozen > 0) return 'stun';
  if (a && a.name === 'awaken') return 'awaken';
  if (a && a.name === 'flourish') return a.t > .55 ? 'flourish' : 'happy';
  if (a && !['stow', 'draw'].includes(a.name)) return f.awak > 0 ? 'glow' : (a.t < .35 ? 'attackShout' : 'attack');
  if (f.blocking) return 'block';
  if (f.victory) return 'victory';
  // mirada que se pasea: mira hacia el rival más cercano o, si no hay, hacia un lado, arriba o abajo
  f.glanceT = (f.glanceT == null ? rand(2, 5) : f.glanceT) - dt;
  if (f.glance) { f.glanceLeft -= dt; if (f.glanceLeft <= 0) f.glance = null; }
  else if (f.glanceT <= 0) {
    f.glanceT = rand(2.5, 6); f.glanceLeft = rand(.6, 1);
    let tg = null, bd = 14;
    if (f.pos && f.alive) for (const g of D.enemiesOf(f)) { const d = dist2d(f, g); if (d < bd) { bd = d; tg = g; } }
    f.glance = tg ? (wrapA(yawTo(f, tg) - f.yaw) > 0 ? 'glanceR' : 'glanceL') : ['glanceL', 'glanceR', 'glanceU', 'glanceD'][Math.random() * 4 | 0];
  }
  if (f.blinkT < 0) return 'blink';
  if (f.glance) return f.glance;
  if (f.awak > 0) return 'glow';
  if (f.hp < f.maxHp * .25) return 'lowhp';
  return 'idle';
}
/* FACE_DATA_BEGIN */
const FACE_VER = 6;
const FACE_DEFAULTS = {"javi":{"pal":{"S":"#f3cbba","T":"#e0a590","K":"#3c302d","W":"#dedaf3","A":"#a3c6f8","B":"#576a95","X":"#ffffff","m":"#6b1f1f","p":"#e49a8c","r":"#e8707a","b":"#7cc4ff","y":"#d7f0ff","c":"#ff4d4d","d":"#576a95","e":"#a3c6f8","f":"#a3c6f8","g":"#3c302d","h":"#3c302d","j":"#dedaf3","i":"#50372c","k":"#9f6b48","l":"#b27a54","n":"#634131","o":"#a9734e","q":"#df9d82","s":"#875d40","t":"#f0beaa","u":"#674934","v":"#b8b5d9","w":"#eeae41","x":"#f5c749","z":"#e7b631","C":"#d4823c","D":"#f2cfad","E":"#f7d9b9","F":"#ff4d4d","H":"#dedaf3"},"exprs":[{"id":"normal","label":"Normal (cara sin ojos)","grid":["iklnklli","ollkkllo","okkqqkko","stttttts","uSSSSSSu","wSSxzSSC","DxzEEzCD","DDEEEEDD"]},{"id":"open","label":"Ojos abiertos (los de siempre)","grid":["........","........","........","........",".Hh..hH.",".fd..df.","........","........"]},{"id":"blink","label":"Parpadeo","grid":["........","........","........","........",".SS..SS.",".KK..KK.","........","........"]},{"id":"ko","label":"K.O.","grid":["........","........","........",".K....K.",".SK..KS.",".KS..SK.","........","........"]},{"id":"lookL","label":"Mira a la izquierda","grid":["........","........","........","........",".Kj..KW.",".BA..BA.","........","........"]},{"id":"lookR","label":"Mira a la derecha","grid":["........","........","........","........",".WK..WK.",".AB..AB.","........","........"]},{"id":"lookU","label":"Mira arriba","grid":["........","........","........","........",".jK..Kj.",".ed..de.","........","........"]},{"id":"lookD","label":"Mira abajo","grid":["........","........","........","........",".jW..jj.",".eK..Ke.","........","........"]},{"id":"spiral","label":"Ojos de remolino","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"spiral","fit":{"s":1,"ox":0,"oy":0},"hideEyes":true}},{"id":"kawaii","label":"Ojos kawaii","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"kawaii","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"sparkle","label":"Ojos brillantes","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"sparkle","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"hearts","label":"Ojos de corazón","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"hearts","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"stars","label":"Ojos de estrella","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"stars","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"cat","label":"Ojos de gato","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"cat","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"money","label":"Ojos de dinero","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"money","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"fire","label":"Ojos de fuego","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"fire","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"rage","label":"Ojos furiosos","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"rage","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"orbit","label":"Mareado (estrellitas)","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"orbit","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"sleepy","label":"Dormido (Zzz)","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"sleepy","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"cry","label":"Llorando a mares","grid":["........","........","........","........",".Hh..hH.",".fd..df.","........","........"],"img":{"kind":"preset","id":"tears","hideEyes":false,"fit":{"s":1,"ox":0,"oy":0}}}],"use":{"blink":"blink","ko":"ko","glanceL":"lookL","glanceR":"lookR","glanceU":"lookU","glanceD":"lookD","idle":"open"}},"gato":{"pal":{"S":"#f3bdab","T":"#d99f8e","K":"#2e2728","W":"#ece6e6","A":"#958387","B":"#403334","X":"#ffffff","m":"#6b1f1f","p":"#e5a69b","r":"#e8707a","b":"#7cc4ff","y":"#d7f0ff","c":"#84292d","d":"#e5d2d2","e":"#efefef","f":"#d0b8bc","g":"#4c3b3b","h":"#362c2e","i":"#bbb0b1","j":"#fdd6c1","k":"#584643","l":"#ffffff","n":"#958387","o":"#958387","q":"#584643","s":"#2e2728","t":"#f3bdab"},"exprs":[{"id":"normal","label":"Normal (cara sin ojos)","grid":["cdeeeedc","fffddfff","fgBggBgf","BSSSBhBB","hSSSSSSh","hSSSSSSh","jjSppSjj","SSjjjjSS"]},{"id":"open","label":"Ojos abiertos (los de siempre)","grid":["........","........","........","........",".KK..KK.",".AB..Bi.",".Xk..kX.","........"]},{"id":"blink","label":"Parpadeo","grid":["........","........","........","........",".SS..SS.",".KK..KK.","........","........"]},{"id":"ko","label":"K.O.","grid":["........","........","........",".K....K.",".SK..KS.",".KS..SK.","........","........"]},{"id":"lookL","label":"Mira a la izquierda","grid":["........","........","........","........",".ss..ss.",".qo..qo.",".ql..ql.","........"]},{"id":"lookR","label":"Mira a la derecha","grid":["........","........","........","........",".ss..ss.",".oq..oq.",".lq..lq.","........"]},{"id":"lookU","label":"Mira arriba","grid":["........","........","........","........","........",".oqt.qo.",".ll..ll.","........"]},{"id":"lookD","label":"Mira abajo","grid":["........","........","........","........","........",".oo..oo.",".lq..ql.","........"]},{"id":"spiral","label":"Ojos de remolino","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"spiral","fit":{"s":1,"ox":0,"oy":0},"hideEyes":true}},{"id":"kawaii","label":"Ojos kawaii","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"kawaii","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"sparkle","label":"Ojos brillantes","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"sparkle","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"hearts","label":"Ojos de corazón","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"hearts","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"stars","label":"Ojos de estrella","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"stars","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"cat","label":"Ojos de gato","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"cat","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"money","label":"Ojos de dinero","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"money","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"fire","label":"Ojos de fuego","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"fire","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"rage","label":"Ojos furiosos","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"rage","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"orbit","label":"Mareado (estrellitas)","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"orbit","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"sleepy","label":"Dormido (Zzz)","grid":["........","........","........","........","........","........","........","........"],"img":{"kind":"preset","id":"sleepy","hideEyes":true,"fit":{"s":1,"ox":0,"oy":0}}},{"id":"cry","label":"Llorando a mares","grid":["........","........","........","........",".KK..KK.",".AB..Bi.",".Xk..kX.","........"],"img":{"kind":"preset","id":"tears","hideEyes":false,"fit":{"s":1,"ox":0,"oy":0}}}],"use":{"blink":"blink","ko":"ko","glanceL":"lookL","glanceR":"lookR","glanceU":"lookU","glanceD":"lookD","idle":"open"}}};
/* FACE_DATA_END */
/* BBS_EYES_BEGIN */
const BBS_EYES = {"tex":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABwklEQVR4AZSSzytEURTHzz33YcY0aiQLv4uGsCBlYStEskdZSmyUUpSMja3ERBa25A/wezZjrVDTMFIsbE3zhvnVzFzvXO+ON4Myp/u995zPOee+d+97CIZNdjSK5R63MNzcGGutcv7GqWCqv1PMjHSL0d4WgRPtDVmCL4kkUAP5JKfm0IVhz/GEsHLKvUUTtEBZCQdssttYo60MlGTGmCi25qZ7oMTAcjhsGuixJGicAa5fh5jHfwtKqY+4PIria1d3Mr/tj6fAtPpqF+xsrsLe1hqgajBzciFGkoFlUmxlZR7QXikzKOciJ2rWy9tgdmIRMPbqa95fHAWrSh12RrIy8ompZ9XU1sl7w8PNjScF1bo71y9IKlarlb0/XsLSgRdwxutjxYg2c7oHmNK/7sDj8WAgcFRKzYWSG+j3ZyIaupCKBE/lZ6TCSPCLL4z3ZWqZM0msUEiNDOU+MoecAzEScpMzBlzTIBw4zm0OpmE2LdzZTMYMAYy/F+h8JzdhTWTz610dIyxXaDoITISQczMEYIyB/nAuhrtcaYb59XRUKDBEjjmknl7ROpjfaVTQW1W0Df3g391GkXVk0mlr+Kf/CQAA//9hTt9DAAAABklEQVQDAGGo00upiPkUAAAAAElFTkSuQmCC","cubes":[{"n":"eye_r","f":[1.0,3.0,-3.8],"s":[2.0,2.0,1.0],"uv":{"top":[3.0,4.0,1.0,3.0],"left":[3.0,4.0,4.0,6.0],"bottom":[5.0,3.0,3.0,4.0],"back":[4.0,4.0,6.0,6.0],"front":[1.0,4.0,3.0,6.0],"right":[0.0,4.0,1.0,6.0]}},{"n":"eyebrow_er","f":[2.975,3.975,-4.05],"s":[1.0,1.0,1.0],"uv":{"top":[2.0,9.0,1.0,8.0],"left":[2.0,9.0,3.0,10.0],"bottom":[3.0,8.0,2.0,9.0],"back":[3.0,9.0,4.0,10.0],"front":[1.0,9.0,2.0,10.0],"right":[0.0,9.0,1.0,10.0]}},{"n":"eyebrow_r","f":[1.0,4.975,-4.05],"s":[2.0,1.0,1.0],"uv":{"top":[3.0,7.0,1.0,6.0],"left":[3.0,7.0,4.0,8.0],"bottom":[5.0,6.0,3.0,7.0],"back":[4.0,7.0,6.0,8.0],"front":[1.0,7.0,3.0,8.0],"right":[0.0,7.0,1.0,8.0]}},{"n":"pupil_l","f":[-2.0,3.0,-3.85],"s":[1.0,2.0,1.0],"uv":{"top":[8.0,1.0,7.0,0.0],"left":[8.0,1.0,9.0,3.0],"bottom":[9.0,0.0,8.0,1.0],"back":[9.0,1.0,10.0,3.0],"front":[7.0,1.0,8.0,3.0],"right":[6.0,1.0,7.0,3.0]}},{"n":"eyelid_rt","f":[1.0,5.0,-3.95],"s":[2.0,0.9,1.0],"uv":{"top":[3.0,11.0,1.0,10.0],"left":[3.0,11.0,4.0,12.0],"bottom":[5.0,10.0,3.0,11.0],"back":[4.0,11.0,6.0,12.0],"front":[1.0,11.0,3.0,12.0],"right":[0.0,11.0,1.0,12.0]}},{"n":"eyebrow_l","f":[-3.0,4.975,-4.05],"s":[2.0,1.0,1.0],"uv":{"top":[9.0,7.0,7.0,6.0],"left":[9.0,7.0,10.0,8.0],"bottom":[11.0,6.0,9.0,7.0],"back":[10.0,7.0,12.0,8.0],"front":[7.0,7.0,9.0,8.0],"right":[6.0,7.0,7.0,8.0]}},{"n":"eyelid_lt","f":[-3.0,5.0,-3.95],"s":[2.0,0.9,1.0],"uv":{"top":[9.0,11.0,7.0,10.0],"left":[9.0,11.0,10.0,12.0],"bottom":[11.0,10.0,9.0,11.0],"back":[10.0,11.0,12.0,12.0],"front":[7.0,11.0,9.0,12.0],"right":[6.0,11.0,7.0,12.0]}},{"n":"anchor","f":[1.0,3.0,-4.0],"s":[0.0,2.0,1.0],"uv":{"right":[1.0,14.0,2.0,16.0]}},{"n":"anchor","f":[3.0,3.0,-4.0],"s":[0.0,2.0,1.0],"uv":{"left":[0.0,14.0,1.0,16.0]}},{"n":"anchor","f":[1.0,5.0,-4.0],"s":[2.0,0.0,1.0],"uv":{"bottom":[2.0,14.0,4.0,15.0]}},{"n":"anchor","f":[1.0,3.0,-4.0],"s":[2.0,0.0,1.0],"uv":{"top":[2.0,15.0,4.0,16.0]}},{"n":"anchor","f":[-3.0,3.0,-4.0],"s":[0.0,2.0,1.0],"uv":{"right":[7.0,14.0,8.0,16.0]}},{"n":"anchor","f":[-1.0,3.0,-4.0],"s":[0.0,2.0,1.0],"uv":{"left":[6.0,14.0,7.0,16.0]}},{"n":"anchor","f":[-3.0,5.0,-4.0],"s":[2.0,0.0,1.0],"uv":{"bottom":[8.0,14.0,10.0,15.0]}},{"n":"anchor","f":[-3.0,3.0,-4.0],"s":[2.0,0.0,1.0],"uv":{"top":[8.0,15.0,10.0,16.0]}},{"n":"eye_l","f":[-3.0,3.0,-3.8],"s":[2.0,2.0,1.0],"uv":{"top":[9.0,4.0,7.0,3.0],"left":[9.0,4.0,10.0,6.0],"bottom":[11.0,3.0,9.0,4.0],"back":[10.0,4.0,12.0,6.0],"front":[7.0,4.0,9.0,6.0],"right":[6.0,4.0,7.0,6.0]}},{"n":"eyebrow_el","f":[-3.975,3.975,-4.05],"s":[1.0,1.0,1.0],"uv":{"top":[8.0,9.0,7.0,8.0],"left":[8.0,9.0,9.0,10.0],"bottom":[9.0,8.0,8.0,9.0],"back":[9.0,9.0,10.0,10.0],"front":[7.0,9.0,8.0,10.0],"right":[6.0,9.0,7.0,10.0]}},{"n":"eyelid_lb","f":[-3.0,2.1,-3.95],"s":[2.0,0.9,1.0],"uv":{"top":[9.0,13.0,7.0,12.0],"left":[9.0,13.0,10.0,14.0],"bottom":[11.0,12.0,9.0,13.0],"back":[10.0,13.0,12.0,14.0],"front":[7.0,13.0,9.0,14.0],"right":[6.0,13.0,7.0,14.0]}},{"n":"eyelid_rb","f":[1.0,2.1,-3.95],"s":[2.0,0.9,1.0],"uv":{"top":[3.0,13.0,1.0,12.0],"left":[3.0,13.0,4.0,14.0],"bottom":[5.0,12.0,3.0,13.0],"back":[4.0,13.0,6.0,14.0],"front":[1.0,13.0,3.0,14.0],"right":[0.0,13.0,1.0,14.0]}},{"n":"pupil_r","f":[1.0,3.0,-3.85],"s":[1.0,2.0,1.0],"uv":{"top":[2.0,1.0,1.0,0.0],"left":[2.0,1.0,3.0,3.0],"bottom":[3.0,0.0,2.0,1.0],"back":[3.0,1.0,4.0,3.0],"front":[1.0,1.0,2.0,3.0],"right":[0.0,1.0,1.0,3.0]}}]};
/* BBS_EYES_END */
let BBS_EYES_TEX = null;
// ojos 3D de Javi: cubos del modelo player/eyes de BBS (x y z se invierten porque BBS mira a -Z y el juego a +Z)
function bbsEyesAttach(f) {
  const m = f.model; if (!m || !m.head || f.eyes3d) return;
  if (!BBS_EYES_TEX) { BBS_EYES_TEX = new THREE.TextureLoader().load(BBS_EYES.tex); BBS_EYES_TEX.magFilter = BBS_EYES_TEX.minFilter = THREE.NearestFilter; BBS_EYES_TEX.generateMipmaps = false; }
  const mat = fighterToonMaterial(BBS_EYES_TEX, 0.5, THREE.FrontSide, { spec: 0.45, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const grp = new THREE.Group(), parts = {}, face = ['left', 'right', 'top', 'bottom', 'front', 'back'];
  for (const c of BBS_EYES.cubes) {
    const sz = c.s.map(v => Math.max(v, .02)), g = new THREE.BoxGeometry(sz[0] * PX, sz[1] * PX, sz[2] * PX), uv = g.attributes.uv;
    face.forEach((k, i) => { const r = c.uv[k] || [0, 0, 1, 1]; uv.setXY(i * 4, r[0] / 16, 1 - r[1] / 16); uv.setXY(i * 4 + 1, r[2] / 16, 1 - r[1] / 16); uv.setXY(i * 4 + 2, r[0] / 16, 1 - r[3] / 16); uv.setXY(i * 4 + 3, r[2] / 16, 1 - r[3] / 16); });
    const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 7;
    mesh.position.set(-(c.f[0] + c.s[0] / 2) * PX, (c.f[1] + c.s[1] / 2 - 1) * PX,   // -1 px: la transformación del form de los ojos en el BBS (t y = -0.0625)
      -(c.f[2] + c.s[2] / 2) * PX); mesh.userData.base = mesh.position.clone();
    grp.add(mesh); (parts[c.n] = parts[c.n] || []).push(mesh);
  }
  const hm = m.head.children.find(o => o.isMesh); if (hm) { hm.material.alphaTest = .5; hm.material.needsUpdate = true; }   // la skin tendrá agujeros donde van los ojos
  grp.visible = false; m.head.add(grp); f.eyes3d = { grp, parts };
}
// st = estado de la cara; neutral = sin expresión hecha a mano (entonces se ven los ojos 3D en vez de los píxeles)
function bbsEyeSample(eyes, t) {
  const out = {};
  for (const n in eyes) {
    const r = eyes[n]; let v;
    if (t <= r[0][0]) v = r[0]; else if (t >= r[r.length - 1][0]) v = r[r.length - 1];
    else { let i = 0; while (r[i + 1][0] < t) i++; const u = (t - r[i][0]) / (r[i + 1][0] - r[i][0]), w = u * u * (3 - 2 * u); v = [0, 1, 2, 3].map(k => r[i][k] + (r[i + 1][k] - r[i][k]) * w); }
    out[n] = [v[1], v[2], v[3]];
  }
  return out;
}
function bbsEyesUpdate(f, st, neutral) {
  const E = f.eyes3d; if (!E) return; E.grp.visible = neutral;
  if (!neutral) return;
  const ea = f.eyeAnimT != null && D.G.time - f.eyeAnimT < .12 ? f.eyeAnim : null;   // la animación en curso (guardar lanza, idle con voz...) manda sobre el parpadeo normal
  const lid = st === 'blink' ? 1 : 0, gx = st === 'glanceL' ? -.5 : st === 'glanceR' ? .5 : 0, gy = st === 'glanceU' ? .4 : st === 'glanceD' ? -.4 : 0;
  const PAR = { eyebrow_er: 'eyebrow_r', eyebrow_el: 'eyebrow_l' };
  const get = n => { const a = ea && ea[n], pa = ea && PAR[n] && ea[PAR[n]]; return [(a ? a[0] : 0) + (pa ? pa[0] : 0), (a ? a[1] : 0) + (pa ? pa[1] : 0), a ? a[2] : 1]; };
  for (const n in E.parts) E.parts[n].forEach(o => {
    let dx = 0, dy = 0, sy = 1;
    if (ea && n !== 'anchor') { const g = get(n); dx = g[0]; dy = g[1]; sy = g[2]; }
    else if (n === 'eyelid_rt' || n === 'eyelid_lt') dy = -lid; else if (n === 'eyelid_rb' || n === 'eyelid_lb') dy = lid; else if (n === 'pupil_l' || n === 'pupil_r') { dx = gx; dy = gy; }
    o.position.set(o.userData.base.x + dx * PX, o.userData.base.y + dy * PX, o.userData.base.z); o.scale.y = sy;
  });
}
// elige la expresión según lo que esté pasando: parpadeo, enojo al atacar, dolor, K.O., alegría, despertar
function updateFace(f, dt) {
  if (!f.faceCtx) return;
  f.blinkT -= dt; if (f.blinkT < -.13) f.blinkT = rand(1.8, 4.5);
  if (f.facePreset && FACE_LIB[f.facePreset]) {
    const lib = FACE_LIB[f.facePreset], st = faceState(f, dt), id = f.faceForce != null ? f.faceForce : (lib.use[st] || lib.use[FACE_FALLBACK[st]] || lib.use.idle || '');   // una situación sin expresión usa la de reposo (ojos abiertos), no la cara sin ojos
    let id2 = id;
    if (f.facePreset === 'javi' && f.model) { bbsEyesAttach(f); const neutral = f.faceForce == null && (id === lib.use.idle || ['blink', 'glanceL', 'glanceR', 'glanceU', 'glanceD'].includes(st)); bbsEyesUpdate(f, st, neutral); if (neutral) id2 = 'normal'; }
    const key = f.facePreset + ':' + id2 + ':' + (f.faceVer || 0) + ':' + (f.faceForce != null ? 'f' : ''); if (key === f.faceKey) return;
    f.faceKey = key; paintFacePreset(f, id2);
    if (f.eyes3d && f.eyes3d.grp.visible) { const g = f.faceCtx; for (const cx of [1, 2, 5, 6]) for (const ry of [4, 5]) { g.clearRect(8 + cx, 8 + ry, 1, 1); g.clearRect(40 + cx, 8 + ry, 1, 1); } f.model.tex.needsUpdate = true; }   // agujeros en la cara y el sombrero: se ven los ojos 3D que están detrás
    return;
  }
  const a = f.action, attacking = a && !['flourish', 'stow', 'draw', 'awaken'].includes(a.name);
  let eyes = 'open', mouth = 'closed';
  if (f.alive === false) { eyes = 'ko'; mouth = 'open'; }
  else if (f.ragdoll > 0 || f.forcePose || f.grabbed || f.hurtT > 0 || f.flashT > .04) { eyes = 'hurt'; mouth = 'open'; }
  else if (f.stun > 0 || f.frozen > 0) eyes = 'hurt';
  else if (attacking) { eyes = f.awak > 0 ? 'glow' : 'angry'; mouth = a.t < .35 ? 'open' : 'closed'; }
  else if (a && a.name === 'awaken') { eyes = 'glow'; mouth = 'open'; }
  else if (a && a.name === 'flourish') eyes = 'happy';
  else if (f.blocking) eyes = 'angry';
  else if (f.awak > 0) eyes = 'glow';
  if ((eyes === 'open' || eyes === 'glow') && f.blinkT < 0) eyes = 'closed';
  const key = eyes + mouth; if (key === f.faceKey) return;
  f.faceKey = key; drawFace(f, eyes, mouth);
}

// ===== Cara normal editable + imágenes de alta resolución sobre la cara =====
// La expresión "Normal" guarda la cara original de la skin como una grilla editable; todas las demás se dibujan encima de ella.
// Una expresión también puede llevar una imagen (más resolución que la textura de la skin) que se pega al frente de la cabeza,
// se centra en la fila de ojos detectada de cada skin y crece con la cabeza.
const FACE_POOL = 'cdefghijklnoqstuvwxzCDEFHIJLMNOPQRUVYZ0123456789';
const FACE_ART = [['spiral', 'Remolino'], ['hearts', 'Corazones'], ['stars', 'Estrellas'], ['sparkle', 'Ojos brillantes de anime'], ['tears', 'Lágrimas'], ['anger', 'Vena de enojo'], ['blush', 'Rubor'], ['sweat', 'Gota de sudor']];
const FACE_IMG_CACHE = new Map(), FACE_INFO_CACHE = {};
const hex2 = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
function feFaceInfo(cid) {
  if (FACE_INFO_CACHE[cid]) return FACE_INFO_CACHE[cid];
  const sk = D.charSkin(cid), t = document.createElement('canvas'); t.width = 64; t.height = 64; const g = t.getContext('2d'); g.drawImage(sk, 0, 0);
  return (FACE_INFO_CACHE[cid] = analyzeFace(g.getImageData(8, 8, 8, 8), g.getImageData(40, 8, 8, 8)));
}
// arma la expresión "Normal" con los píxeles reales de la skin predeterminada (hay que llamarla cuando ya cargaron las skins)
function makeNormal(cid) {
  const lib = FACE_LIB[cid], d = D.feFaceBase(cid).getContext('2d').getImageData(0, 0, 8, 8).data, rev = {};
  for (const k in lib.pal) rev[lib.pal[k].toLowerCase()] = k;
  const grid = [];
  for (let y = 0; y < 8; y++) {
    let row = '';
    for (let x = 0; x < 8; x++) {
      const i = (y * 8 + x) * 4, c = hex2(d[i], d[i + 1], d[i + 2]);
      let k = rev[c];
      if (!k) { k = FACE_POOL.split('').find(ch => !(ch in lib.pal)); if (!k) k = '.'; else { lib.pal[k] = c; rev[c] = k; } }
      row += k;
    }
    grid.push(row);
  }
  return { id: 'normal', label: 'Normal (cara original)', grid };
}
function ensureNormal(cid) {
  const lib = FACE_LIB[cid]; if (!lib || lib.exprs.some(e => e.id === 'normal')) return false;
  lib.exprs.unshift(makeNormal(cid)); if (!lib.use.idle) lib.use.idle = 'normal'; return true;
}
function ensureNormalAll() { let ch = false; for (const cid in FACE_LIB) ch = ensureNormal(cid) || ch; if (ch) refreshFaces(); }
// ---- imágenes de ojos ANIMADAS (pixel art en una grilla de 32×32; los ojos quedan en (7,16) y (25,16)) ----
// Cada imagen se redibuja a 12 cuadros por segundo con el tiempo t (en segundos): giran, laten, brillan y parpadean.
function drawFaceArt(g, id, col, t) {
  g.clearRect(0, 0, 64, 64);
  const P = (x, y, c, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(Math.round(x) * 2, Math.round(y) * 2, w * 2, h * 2); };
  const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * .6) P(cx + x, cy + y, c); };
  const ell = (cx, cy, rx, ry, c) => { for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) for (let x = -Math.ceil(rx); x <= Math.ceil(rx); x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) P(cx + x, cy + y, c); };
  const glint = (x, y, s, c = '#ffffff') => { P(x, y, c); if (s > 0) { P(x - 1, y, c); P(x + 1, y, c); P(x, y - 1, c); P(x, y + 1, c); } if (s > 1) { P(x - 2, y, c); P(x + 2, y, c); P(x, y - 2, c); P(x, y + 2, c); } };
  const EY = [[7, 16], [25, 16]], D = '#1b1b24';
  if (id === 'spiral') {
    EY.forEach(([cx, cy], n) => {
      disc(cx, cy, 6, D); disc(cx, cy, 5, '#ffffff');
      const dir = n ? -1 : 1, ph = t * 4 * dir;
      for (let k = 0; k < 12.4; k += .05) { const th = k * dir * 1.15 + ph, rr = .3 + k * .4; P(Math.round(cx + Math.cos(th) * rr), Math.round(cy + Math.sin(th) * rr), D); }
    });
  } else if (id === 'hearts') {
    const beat = Math.pow(Math.max(0, Math.sin(t * 7.5)), 2), sc = 1 + .16 * beat;
    EY.forEach(([cx, cy], n) => {
      for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const x = dx / (4.6 * sc), y = -dy / (4.6 * sc) + .15, v = Math.pow(x * x + y * y - 1, 3) - x * x * y * y * y; if (v <= 0) P(cx + dx, cy + dy, beat > .5 ? '#ff5c85' : '#ff3b6b'); }
      P(cx - 3, cy - 3, '#ffffff', 2, 1); P(cx - 3, cy - 2, '#ffffff');
      const a = t * 3 + n * 2; if (Math.sin(t * 5 + n) > .2) glint(cx + Math.round(Math.cos(a) * 8), cy + Math.round(Math.sin(a) * 6) - 2, 0, '#ffb3c6');
    });
  } else if (id === 'stars') {
    EY.forEach(([cx, cy], n) => {
      const a0 = t * 1.8 * (n ? -1 : 1), sc = 1 + .1 * Math.sin(t * 6), pts = [];
      for (let i = 0; i < 10; i++) { const a = a0 - Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 2.6 : 6.2) * sc; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
        let inside = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > dy) !== (yj > dy) && dx < (xj - xi) * (dy - yi) / (yj - yi) + xi) inside = !inside; }
        if (inside) P(cx + dx, cy + dy, '#ffd54f');
      }
      P(cx - 1, cy - 1, '#fff6c9', 2, 2);
      if (Math.sin(t * 7 + n * 3) > .3) glint(cx + 6 - n * 12, cy - 7, 1, '#fffbe0');
    });
  } else if (id === 'sparkle') {
    EY.forEach(([cx, cy], n) => {
      ell(cx, cy, 5.5, 7.5, D); ell(cx, cy + 1, 4, 6, col);
      P(cx - 3, cy - 5, '#ffffff', 3, 3); P(cx - 2, cy - 6, '#ffffff', 1, 1);
      const a = t * 2.4 + n; P(cx + 1 + Math.round(Math.cos(a)), cy + 2 + Math.round(Math.sin(a)), '#ffffff', 2, 2);
      if (Math.sin(t * 4 + n * 2) > .55) glint(cx + 4, cy - 6, Math.sin(t * 8) > 0 ? 2 : 1, '#ffffff');
    });
  } else if (id === 'kawaii') {
    const bt = t % 3.3, closed = bt > 3.1, gaze = Math.sin(t * .9) * 1.6;
    EY.forEach(([cx, cy], n) => {
      if (closed) { P(cx - 5, cy + 1, D, 11, 2); P(cx - 6, cy, D, 2, 1); P(cx + 5, cy, D, 2, 1); return; }
      const gx = Math.round(gaze);
      disc(cx, cy, 6, D); disc(cx + gx, cy + 1, 4, col); disc(cx + gx, cy + 1, 2, D);
      P(cx - 3 + gx, cy - 4, '#ffffff', 3, 3); P(cx + 1 + gx, cy + 1, '#ffffff', 2, 2);
      if (Math.sin(t * 5 + n * 1.7) > .5) glint(cx + 4, cy - 5, 1, '#ffffff');
    });
  } else if (id === 'cat') {
    EY.forEach(([cx, cy], n) => {
      ell(cx, cy, 7.5, 6.5, D); ell(cx, cy, 6.3, 5.3, '#e9d83a'); ell(cx, cy + 2, 5, 2.5, '#c9b82a');
      const w = 1 + Math.round(1.6 * (.5 + .5 * Math.sin(t * 2.2 + n)));
      for (let dy = -5; dy <= 5; dy++) P(cx - Math.floor(w / 2), cy + dy, D, w, 1);
      P(cx - 5, cy - 3, '#ffffff', 2, 2);
    });
  } else if (id === 'money') {
    const G = ['..#..', '.###.', '#.#.#', '#.#..', '.###.', '..#.#', '#.#.#', '.###.', '..#..'], c = Math.sin(t * 4), hue = Math.sin(t * 9) > 0 ? '#2ecc40' : '#9dff6a';
    EY.forEach(([cx, cy]) => {
      disc(cx, cy, 6, '#f8f2c8'); disc(cx, cy, 5, '#fffbe0');
      G.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch === '#') P(cx + Math.round((x - 2) * c), cy - 4 + y, hue, Math.abs(c) > .45 ? 1 : 1, 1); }));
    });
  } else if (id === 'fire') {
    EY.forEach(([cx, cy], n) => {
      for (let y = 0; y < 15; y++) {
        const k = y / 14, w = Math.max(1, 9 * (1 - k * .9) * (1 + .3 * Math.sin(t * 15 + y * .9 + n * 2))), sway = Math.sin(t * 9 + y * .5 + n) * (k * 2.4);
        const c = k < .35 ? '#ff3d00' : k < .7 ? '#ff9100' : '#ffe082';
        P(cx + sway - w / 2, cy + 7 - y, c, Math.round(w), 1);
      }
      P(cx - 1, cy + 3, '#ffffff', 2, 2);
    });
  } else if (id === 'rage') {
    EY.forEach(([cx, cy], n) => {
      const s = n ? -1 : 1, pulse = .22 + .16 * Math.sin(t * 9);
      g.globalAlpha = pulse; disc(cx, cy, 9, '#ff2a2a'); g.globalAlpha = 1;
      for (let x = -7; x <= 7; x++) { const yc = cy + Math.round(-x * .3 * s); P(cx + x, yc - 1, '#e60f0f', 1, 3); P(cx + x, yc, '#ff8c8c'); }
      for (let k = -8; k <= 7; k++) P(cx + k, cy - 6 + Math.round(k * .3 * s) + (n ? 0 : 0), D, 1, 2);
    });
  } else if (id === 'orbit') {
    EY.forEach(([cx, cy], n) => {
      for (const [dx, dy] of [[-2, -2], [2, -2], [0, 0], [-2, 2], [2, 2]]) P(cx + dx - 1, cy + dy - 1, D, 2, 2);
      for (let k = 0; k < 3; k++) { const a = t * 4.4 * (n ? -1 : 1) + k * 2.094, x = cx + Math.cos(a) * 9, y = cy - 4 + Math.sin(a) * 4; glint(x, y, 1, '#ffd54f'); }
    });
  } else if (id === 'sleepy') {
    EY.forEach(([cx, cy]) => { P(cx - 5, cy + 1, D, 11, 2); P(cx - 6, cy, D, 2, 1); P(cx + 5, cy, D, 2, 1); });
    for (let k = 0; k < 3; k++) {
      const u = ((t * .8 + k / 3) % 1), x = 24 + u * 5, y = 12 - u * 11, s = 2 + Math.floor(u * 3);
      g.globalAlpha = 1 - u * .8;
      for (let i = 0; i < s; i++) { P(x + i, y, '#ffffff'); P(x + s - 1 - i, y + i, '#ffffff'); P(x + i, y + s - 1, '#ffffff'); }
      g.globalAlpha = 1;
    }
  } else if (id === 'tears') {
    EY.forEach(([cx, cy], n) => {
      for (let y = cy + 3; y < cy + 15; y++) P(cx - 1, y, '#7cc4ff', 2, 1);
      for (let k = 0; k < 3; k++) { const y = cy + 3 + ((t * 13 + k * 4 + n * 2) % 12); P(cx - 2, y, '#bfe6ff', 4, 2); P(cx - 1, y + 2, '#7cc4ff', 2, 1); }
      P(cx - 2, cy + 14, '#7cc4ff', 4, 1);
    });
  } else if (id === 'anger') {
    const R = '#e63946', cx = 26, cy = 6, big = Math.sin(t * 10) > 0;
    for (const [dx, dy] of [[-3, -1], [-3, -2], [-2, -2], [-1, -3], [-1, -4], [2, -1], [3, -1], [3, -2], [2, 1], [3, 1], [3, 2], [-2, 1], [-3, 1], [-3, 2], [-1, 2], [-1, 3]]) P(cx + dx * (big ? 1.3 : 1), cy + dy * (big ? 1.3 : 1), R, big ? 2 : 1, big ? 2 : 1);
  } else if (id === 'blush') {
    g.globalAlpha = .65 + .35 * Math.sin(t * 5);
    EY.forEach(([cx, cy]) => { for (let i = 0; i < 3; i++) { P(cx - 4 + i * 3, cy + 5, '#ff8aa0', 2, 1); P(cx - 3 + i * 3, cy + 6, '#ff8aa0', 2, 1); } });
    g.globalAlpha = 1;
  } else if (id === 'sweat') {
    const u = (t * .7) % 1, cx = 28, cy = 5 + u * 14; g.globalAlpha = 1 - u * u;
    for (let dy = -4; dy <= 4; dy++) { const w = dy < 0 ? Math.max(0, 4 + dy) : Math.max(1, 3 - (dy > 2 ? dy - 2 : 0)); P(cx - Math.floor(w / 2), cy + dy, '#7cc4ff', Math.max(1, w), 1); }
    P(cx - 1, cy, '#ffffff', 1, 2); g.globalAlpha = 1;
  }
}
// lista de imágenes: [id, nombre, ¿tapa los ojos de la skin por defecto?]
FACE_ART.length = 0;
FACE_ART.push(['kawaii', 'Ojos kawaii (brillan y parpadean)', 1], ['sparkle', 'Ojos brillantes de anime', 1], ['spiral', 'Remolino (gira)', 1], ['hearts', 'Corazones (laten)', 1], ['stars', 'Estrellas (giran)', 1],
  ['cat', 'Ojos de gato', 1], ['money', 'Ojos de dinero', 1], ['fire', 'Ojos de fuego', 1], ['rage', 'Ojos furiosos', 1], ['orbit', 'Mareado con estrellitas', 1], ['sleepy', 'Dormido (Zzz)', 1],
  ['tears', 'Lágrimas que caen', 0], ['anger', 'Vena de enojo (late)', 0], ['blush', 'Rubor', 0], ['sweat', 'Gota de sudor', 0]);
const FACE_FPS = 12;
function faceImageTex(img, color) {
  const key = img.kind === 'frames' ? 'f:' + img.frames.length + ':' + img.frames[0].length + ':' + img.frames[0].slice(-40) : img.kind === 'data' ? 'd:' + img.src.length + ':' + img.src.slice(-48) : 'p:' + img.id + ':' + color;
  let t = FACE_IMG_CACHE.get(key); if (t) return t;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  FACE_IMG_CACHE.set(key, t);
  if (img.kind === 'data') {
    const im = new Image();
    im.onload = () => { g.clearRect(0, 0, 64, 64); g.drawImage(im, 0, 0, 64, 64); t.needsUpdate = true; refreshFaces(); if (!$('faceed').classList.contains('hidden')) D.feRender(); };
    im.src = img.src;
  } else if (img.kind === 'frames') {
    // GIF: cuadros ya reducidos a 64×64; se van pasando según su duración
    const imgs = img.frames.map(src => { const im = new Image(); im.src = src; return im; }), delays = img.delays || img.frames.map(() => 80);
    t.anim = { kind: 'frames', g, imgs, delays, total: delays.reduce((a, b) => a + b, 0) || 1, key: -1 };
    imgs[0].onload = () => { faceAnimTick(t, performance.now() / 1000, true); refreshFaces(); };
  } else {
    t.anim = { kind: 'preset', g, id: img.id, color, key: -1 };
    faceAnimTick(t, performance.now() / 1000, true);
  }
  return t;
}
// avanza la animación de una textura (devuelve true si cambió de cuadro)
function faceAnimTick(tex, now, force) {
  const a = tex.anim; if (!a) return false;
  if (a.kind === 'preset') {
    const k = Math.floor(now * FACE_FPS); if (k === a.key && !force) return false; a.key = k; drawFaceArt(a.g, a.id, a.color, k / FACE_FPS);
  } else {
    let ms = (now * 1000) % a.total, i = 0; while (i < a.delays.length - 1 && ms >= a.delays[i]) { ms -= a.delays[i]; i++; }
    if (i === a.key && !force) return false; a.key = i; const im = a.imgs[i]; if (!im || !im.complete || !im.naturalWidth) return false;
    a.g.clearRect(0, 0, 64, 64); a.g.drawImage(im, 0, 0, 64, 64);
  }
  tex.needsUpdate = true; return true;
}
// cada cuadro del juego: anima las imágenes que se están viendo (jugadores, rivales y la cabeza del menú)
function updateFaceAnims(now) {
  for (const f of D.G.fighters) { const d = f.model && f.model.decal; if (d && d.visible && d.material.map && (f.isPlayer || camera.position.distanceToSquared(f.pos)<2500)) faceAnimTick(d.material.map, now); }
  if (D.SH.fig && D.SH.fig.model.decal && D.SH.fig.model.decal.visible && D.SH.fig.model.decal.material.map) faceAnimTick(D.SH.fig.model.decal.material.map, now);
}
// GIF animado → cuadros de 64×64 (necesita ImageDecoder, que trae Chrome/Edge)
async function feGifFrames(file) {
  if (!('ImageDecoder' in window)) return null;
  const dec = new ImageDecoder({ data: await file.arrayBuffer(), type: file.type || 'image/gif' });
  await dec.tracks.ready; const n = Math.min(dec.tracks.selectedTrack.frameCount, 48), frames = [], delays = [];
  for (let i = 0; i < n; i++) {
    const { image } = await dec.decode({ frameIndex: i }), c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(image, 0, 0, 64, 64); frames.push(c.toDataURL('image/png')); delays.push(Math.max(40, Math.round((image.duration || 80000) / 1000))); image.close();
  }
  return n > 1 ? { frames, delays } : null;
}
// pega (o esconde) la imagen en el frente de la cabeza; se centra en la fila de ojos de esa skin
function setFaceDecal(f, img) {
  const m = f.model;
  if (!img) { if (m.decal) m.decal.visible = false; return; }
  if (!m.decal) {
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const d = new THREE.Mesh(new THREE.PlaneGeometry(9 * PX, 9 * PX), mat); d.renderOrder = 6; m.head.add(d); m.decal = d;
  }
  const fit = img.fit || {}, s = fit.s || 1, row = f.faceInfo ? f.faceInfo.row : 4;
  m.decal.material.map = faceImageTex(img, f.ch.color); m.decal.material.needsUpdate = true;
  m.decal.scale.set(s, s, 1); m.decal.position.set((fit.ox || 0) * PX, (8 - (row + .5) + (fit.oy || 0)) * PX, 5.2 * PX); m.decal.visible = true;
}

  return { BBS_EYES, FACE_ART, FACE_DEFAULTS, FACE_FALLBACK, FACE_FPS, FACE_IMG_CACHE, FACE_INFO_CACHE, FACE_LIB, FACE_POOL, FACE_STATES, FACE_VER, analyzeFace, bbsEyeSample, bbsEyesAttach, bbsEyesUpdate, copyCanvas, drawFace, drawFaceArt, ensureNormal, ensureNormalAll, faceAnimTick, faceCharId, faceEyeCells, faceImageTex, faceState, feFaceInfo, feGifFrames, hex2, loadFaceLib, makeNormal, paintFacePreset, refreshFaces, saveFaceLib, setFaceDecal, setupFace, updateFace, updateFaceAnims };
};
