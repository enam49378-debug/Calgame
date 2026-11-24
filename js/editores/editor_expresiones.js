// Editor de expresiones (modo desarrollador): caras de cada personaje
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_EDITORES = window.CF_EDITORES || {};

window.CF_EDITORES.crearEditorExpresiones = function crearEditorExpresiones(D) {
  'use strict';
  const { $, FACE_ART, FACE_DEFAULTS, FACE_LIB, FACE_POOL, FACE_STATES, ensureNormalAll, faceAnimTick, faceEyeCells, faceImageTex, feFaceInfo, feGifFrames, hex2, loadFaceLib, makeNormal, refreshFaces, saveFaceLib } = D;

const FE = { cid: 'javi', id: 'blink', color: 'K', mirror: true, painting: false, erase: false };
const feLib = () => FACE_LIB[FE.cid], feExpr = () => feLib().exprs.find(e => e.id === FE.id);
function feFaceBase(cid) {
  // cara original (base + sombrero) de la skin predeterminada, para dibujar el fondo del editor
  const sk = D.charSkin(cid), t = document.createElement('canvas'); t.width = 64; t.height = 64; const g = t.getContext('2d'); g.drawImage(sk, 0, 0);
  const o = document.createElement('canvas'); o.width = o.height = 8; const og = o.getContext('2d');
  og.putImageData(g.getImageData(8, 8, 8, 8), 0, 0); const h = document.createElement('canvas'); h.width = h.height = 8; h.getContext('2d').putImageData(g.getImageData(40, 8, 8, 8), 0, 0); og.drawImage(h, 0, 0);
  return o;
}
function feColor(c) { const lib = feLib(); return c === 'G' ? D.CHARS[FE.cid].color : lib.pal[c]; }
function feDrawFace(cv, cid, ex, px, noImg) {
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, cv.width, cv.height);
  g.drawImage(feFaceBase(cid), 0, 0, 8, 8, 0, 0, 8 * px, 8 * px);
  const lib = FACE_LIB[cid], nm = lib.exprs.find(e => e.id === 'normal'), op = lib.exprs.find(e => e.id === 'open');
  const keepEyes = !!(ex && ex.img && ex.img.hideEyes === false && op && ex !== op && ex !== nm);
  for (const L of [nm, keepEyes ? op : null, ex && ex !== nm ? ex : null]) {
    if (!L) continue;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const c = L.grid[y][x]; if (c === '.') continue; const col = c === 'G' ? D.CHARS[cid].color : lib.pal[c]; if (col) { g.fillStyle = col; g.fillRect(x * px, y * px, px, px); } }
  }
  const img = ex && ex.img;
  if (img && img.hideEyes !== false) {
    const I = feFaceInfo(cid), sd = g.getImageData(Math.floor(3.5 * px), Math.floor((I.row + .5) * px), 1, 1).data;
    g.fillStyle = 'rgb(' + sd[0] + ',' + sd[1] + ',' + sd[2] + ')';
    for (const [x, y] of faceEyeCells(I)) g.fillRect(x * px, y * px, px, px);
  }
  if (img && !noImg) {
    const t = faceImageTex(img, D.CHARS[cid].color), fit = img.fit || {}, s = fit.s || 1, row = feFaceInfo(cid).row, size = 9 * px * s;
    g.drawImage(t.image, (4 + (fit.ox || 0)) * px - size / 2, (row + .5 - (fit.oy || 0)) * px - size / 2, size, size);
  }
}
function feDrawMain() {
  const ex = feExpr(), cv = $('fe-canvas'), g = cv.getContext('2d');
  feDrawFace(cv, FE.cid, ex, 40);
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 40 + .5, 0); g.lineTo(i * 40 + .5, 320); g.moveTo(0, i * 40 + .5); g.lineTo(320, i * 40 + .5); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(160.5, 0); g.lineTo(160.5, 320); g.stroke(); g.setLineDash([]);
}
function feRender() {
  const lib = feLib(), ex = feExpr();
  feDrawMain();
  // paleta
  const pal = $('fe-pal'); pal.innerHTML = '';
  const add = (c, col, title) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw' + (FE.color === c ? ' on' : ''); b.title = title; if (col) b.style.background = col; else { b.textContent = '↺'; } b.addEventListener('click', () => { FE.color = c; feRender(); }); pal.appendChild(b); };
  add('.', null, 'Original (borra y deja el píxel de la skin)');
  const names = { S: 'Piel', T: 'Sombra de párpado', K: 'Oscuro (línea, pupila)', W: 'Blanco del ojo', A: 'Iris claro', B: 'Iris oscuro', X: 'Blanco puro', G: 'Color del personaje (brillo)', m: 'Interior de la boca', p: 'Labio', r: 'Lengua', b: 'Lágrima', y: 'Sudor' };
  for (const c of ['S', 'T', 'K', 'W', 'A', 'B', 'X', 'G', 'm', 'p', 'r', 'b', 'y']) add(c, feColor(c), names[c]);
  for (const c in lib.pal) if (!names[c]) add(c, lib.pal[c], 'Color propio ' + c);
  $('fe-char').value = FE.cid;
  feRenderImg();
  // lista de expresiones con miniatura
  const list = $('fe-list'); list.innerHTML = '';
  for (const e of lib.exprs) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (e.id === FE.id ? ' on' : '');
    const c = document.createElement('canvas'); c.width = c.height = 32; feDrawFace(c, FE.cid, e, 4); const s = document.createElement('span'); s.textContent = e.label;
    b.append(c, s); b.addEventListener('click', () => { FE.id = e.id; feSelect(); }); list.appendChild(b);
  }
  // asignación de estados
  const use = $('fe-use'); use.innerHTML = '';
  for (const [st, label] of FACE_STATES) {
    const row = document.createElement('label'); const sp = document.createElement('span'); sp.textContent = label; const sel = document.createElement('select');
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = st === 'idle' ? '(cara Normal)' : '(la misma que en reposo)'; sel.appendChild(o0);
    for (const e of lib.exprs) { const o = document.createElement('option'); o.value = e.id; o.textContent = e.label; sel.appendChild(o); }
    sel.value = lib.use[st] || ''; sel.addEventListener('change', () => { lib.use[st] = sel.value; saveFaceLib(); feMsg('Guardado'); });
    row.append(sp, sel); use.appendChild(row);
  }
}
function feRenderImg() {
  const e = feExpr(), sel = $('fe-img'); if (!sel) return;
  if (!sel.options.length) {
    const o0 = document.createElement('option'); o0.value = ''; o0.textContent = '(sin imagen)'; sel.appendChild(o0);
    for (const [id, label] of FACE_ART) { const o = document.createElement('option'); o.value = 'p:' + id; o.textContent = label; sel.appendChild(o); }
    const ou = document.createElement('option'); ou.value = 'data'; ou.textContent = 'Imagen subida'; sel.appendChild(ou);
  }
  const img = e.img; sel.value = !img ? '' : (img.kind === 'data' || img.kind === 'frames') ? 'data' : 'p:' + img.id;
  $('fe-hide').checked = !img || img.hideEyes !== false; $('fe-hide').disabled = !img;
  const fit = (img && img.fit) || {}; $('fe-is').value = fit.s || 1; $('fe-ix').value = fit.ox || 0; $('fe-iy').value = fit.oy || 0;
  for (const id of ['fe-is', 'fe-ix', 'fe-iy']) $(id).disabled = !img;
}
function feImgChanged(live) {
  const e = feExpr(); if (!e.img) return; e.img.fit = { s: +$('fe-is').value, ox: +$('fe-ix').value, oy: +$('fe-iy').value };
  feRender(); if (D.SH.fig) D.SH.fig.faceVer = (D.SH.fig.faceVer || 0) + 1; if (D.SH.fig) D.SH.fig.faceKey = ''; if (!live) saveFaceLib(); else refreshFaces();
}
// PNG de la cara (sin la imagen superpuesta): original + Normal + esta expresión, ampliada con píxeles nítidos
function feFaceCanvas(cid, ex, px) { const c = document.createElement('canvas'); c.width = c.height = 8 * px; feDrawFace(c, cid, ex, px, true); return c; }
function feDownload(canvas, name) { canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png'); }
// letra de la paleta para un color (si no existe se agrega uno propio)
function feLetterFor(lib, hex) {
  hex = hex.toLowerCase(); for (const k in lib.pal) if (lib.pal[k].toLowerCase() === hex) return k;
  const k = FACE_POOL.split('').find(c => !(c in lib.pal)); if (!k) return null; lib.pal[k] = hex; return k;
}
function feImportPNG(file) {
  const rd = new FileReader();
  rd.onload = () => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0, 8, 8);
      const d = g.getImageData(0, 0, 8, 8).data, lib = feLib(), ex = feExpr(), nm = lib.exprs.find(e => e.id === 'normal'), grid = [];
      for (let y = 0; y < 8; y++) {
        let row = '';
        for (let x = 0; x < 8; x++) {
          const i = (y * 8 + x) * 4; if (d[i + 3] < 128) { row += '.'; continue; }
          const k = feLetterFor(lib, hex2(d[i], d[i + 1], d[i + 2])); row += k || '.';
          if (ex !== nm && nm && k && nm.grid[y][x] === k) row = row.slice(0, -1) + '.';   // igual que la Normal: queda como "original"
        }
        grid.push(row);
      }
      ex.grid = grid; saveFaceLib(); feSelect(); feMsg('Cara importada');
    };
    im.onerror = () => feMsg('Ese archivo no es una imagen'); im.src = rd.result;
  };
  rd.readAsDataURL(file);
}
function feMsg(t) { $('fe-msg').textContent = t; clearTimeout(feMsg.t); feMsg.t = setTimeout(() => { $('fe-msg').textContent = ''; }, 1800); }
// muestra la expresión elegida en la cabeza 3D del menú
function feSelect() { feRender(); if (D.SH.fig) { D.SH.fig.faceForce = FE.id; D.SH.fig.faceVer = (D.SH.fig.faceVer || 0) + 1; } }
function fePaintAt(ev) {
  const cv = $('fe-canvas'), r = cv.getBoundingClientRect(), x = Math.floor((ev.clientX - r.left) / r.width * 8), y = Math.floor((ev.clientY - r.top) / r.height * 8);
  if (x < 0 || x > 7 || y < 0 || y > 7) return;
  const ex = feExpr(), c = FE.erase ? '.' : FE.color, set = (xx) => { const row = ex.grid[y].split(''); row[xx] = c; ex.grid[y] = row.join(''); };
  set(x); if (FE.mirror) set(7 - x);
  feRender(); if (D.SH.fig) { D.SH.fig.faceVer = (D.SH.fig.faceVer || 0) + 1; }
}
setInterval(() => { if ($('faceed').classList.contains('hidden')) return; const ex = FACE_LIB[FE.cid] && feExpr(); if (ex && ex.img) { const t = faceImageTex(ex.img, D.CHARS[FE.cid].color); if (faceAnimTick(t, performance.now() / 1000)) feDrawMain(); } }, 80);
function feOpen() {
  if (!D.DEV.on) return;
  const first = Object.keys(FACE_LIB).includes(D.G.charId) ? D.G.charId : 'javi';
  FE.cid = first; if (!feExpr()) FE.id = feLib().exprs[0].id;
  $('faceed').classList.remove('hidden'); D.SH.faceZoom = true; feSelect();
  if (D.G.charId !== FE.cid) { D.G.charId = FE.cid; D.showSelect(FE.cid, true); setTimeout(feSelect, 50); }
}
function feClose() { $('faceed').classList.add('hidden'); D.SH.faceZoom = false; if (D.SH.fig) { D.SH.fig.faceForce = null; D.SH.fig.faceVer = (D.SH.fig.faceVer || 0) + 1; } saveFaceLib(); }
function feChangeChar(cid) { FE.cid = cid; FE.id = feLib().exprs[0].id; D.G.charId = cid; D.showSelect(cid, true); setTimeout(feSelect, 50); }
function feInit() {
  const sel = $('fe-char'); for (const cid of Object.keys(FACE_DEFAULTS)) { const o = document.createElement('option'); o.value = cid; o.textContent = D.CHARS[cid].name; sel.appendChild(o); }
  sel.addEventListener('change', () => feChangeChar(sel.value));
  const cv = $('fe-canvas');
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => { FE.painting = true; FE.erase = e.button === 2; cv.setPointerCapture(e.pointerId); fePaintAt(e); });
  cv.addEventListener('pointermove', e => { if (FE.painting) fePaintAt(e); });
  cv.addEventListener('pointerup', () => { FE.painting = false; saveFaceLib(); });
  $('fe-mirror').addEventListener('change', e => { FE.mirror = e.target.checked; });
  $('fe-pngout').addEventListener('click', () => feDownload(feFaceCanvas(FE.cid, feExpr(), 32), FE.cid + '_cara_' + FE.id + '.png'));
  $('fe-pngin').addEventListener('click', () => $('fe-pngfile').click());
  $('fe-pngfile').addEventListener('change', e => { const f = e.target.files[0]; if (f) feImportPNG(f); e.target.value = ''; });
  $('fe-img').addEventListener('change', e => {
    const v = e.target.value, ex = feExpr();
    if (v === '') delete ex.img; else if (v.startsWith('p:')) ex.img = { kind: 'preset', id: v.slice(2), hideEyes: ex.img ? ex.img.hideEyes !== false : (FACE_ART.find(a => a[0] === v.slice(2)) || [0, 0, 1])[2] === 1, fit: (ex.img && ex.img.fit) || { s: 1, ox: 0, oy: 0 } };
    else if (v === 'data' && !(ex.img && (ex.img.kind === 'data' || ex.img.kind === 'frames'))) { $('fe-imgfile').click(); feRenderImg(); return; }
    saveFaceLib(); feSelect();
  });
  $('fe-imgup').addEventListener('click', () => $('fe-imgfile').click());
  $('fe-imgfile').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return; e.target.value = '';
    if (/gif/i.test(file.type)) {
      feGifFrames(file).then(r => {
        if (!r) { feMsg('Este navegador no puede leer GIF animados (usá Chrome o Edge); se pone solo el primer cuadro'); return gifStill(file); }
        feExpr().img = { kind: 'frames', frames: r.frames, delays: r.delays, hideEyes: true, fit: { s: 1, ox: 0, oy: 0 } }; saveFaceLib(); feSelect(); feMsg('GIF puesto (' + r.frames.length + ' cuadros)');
      }).catch(() => gifStill(file)); return;
    }
    gifStill(file);
  });
  function gifStill(file) {
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {
        // se reduce a 128 px como máximo para que el guardado sea liviano; la imagen se pega con filtro de píxeles
        const k = Math.min(1, 128 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, c.width, c.height);
        feExpr().img = { kind: 'data', src: c.toDataURL('image/png'), hideEyes: true, fit: { s: 1, ox: 0, oy: 0 } }; saveFaceLib(); feSelect(); feMsg('Imagen puesta');
      };
      im.onerror = () => feMsg('Ese archivo no es una imagen'); im.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  $('fe-hide').addEventListener('change', e => { const ex = feExpr(); if (!ex.img) return; ex.img.hideEyes = e.target.checked; saveFaceLib(); feSelect(); });
  for (const id of ['fe-is', 'fe-ix', 'fe-iy']) { $(id).addEventListener('input', () => feImgChanged(true)); $(id).addEventListener('change', () => feImgChanged(false)); }
  $('fe-close').addEventListener('click', feClose);
  $('feb').addEventListener('click', () => { D.sfx('select'); feOpen(); });
  $('animedbtn').addEventListener('click', () => { D.sfx('select'); D.edOpen(); });
  $('fe-clear').addEventListener('click', () => { feExpr().grid = Array(8).fill('........'); saveFaceLib(); feSelect(); });
  $('fe-reset').addEventListener('click', () => {
    if (FE.id === 'normal') { const n = makeNormal(FE.cid), e = feExpr(); e.grid = n.grid; delete e.img; saveFaceLib(); feSelect(); feMsg('Cara original restaurada'); return; }
    const d = FACE_DEFAULTS[FE.cid].exprs.find(e => e.id === FE.id);
    if (d) { feExpr().grid = d.grid.slice(); saveFaceLib(); feSelect(); feMsg('Restaurada'); } else feMsg('Esta expresión es tuya: no hay original');
  });
  $('fe-addcolor').addEventListener('click', () => {
    const lib = feLib(), free = FACE_POOL.split('').find(c => !(c in lib.pal));
    if (!free) { feMsg('Ya no caben más colores propios'); return; }
    lib.pal[free] = $('fe-color').value; FE.color = free; saveFaceLib(); feRender();
  });
  $('fe-new').addEventListener('click', () => {
    const name = prompt('Nombre de la expresión nueva'); if (!name) return;
    const id = 'x' + Date.now().toString(36); feLib().exprs.push({ id, label: name, grid: Array(8).fill('........') }); FE.id = id; saveFaceLib(); feSelect();
  });
  $('fe-dup').addEventListener('click', () => {
    const e = feExpr(), id = 'x' + Date.now().toString(36); feLib().exprs.push({ id, label: e.label + ' (copia)', grid: e.grid.slice() }); FE.id = id; saveFaceLib(); feSelect();
  });
  $('fe-ren').addEventListener('click', () => { const e = feExpr(), n = prompt('Nuevo nombre', e.label); if (n) { e.label = n; saveFaceLib(); feRender(); } });
  $('fe-del').addEventListener('click', () => {
    const lib = feLib(); if (lib.exprs.length <= 1 || FE.id === 'normal') { feMsg('La cara Normal no se puede borrar'); return; } const e = feExpr(); if (!confirm('¿Borrar "' + e.label + '"?')) return;
    lib.exprs = lib.exprs.filter(x => x.id !== e.id); for (const k in lib.use) if (lib.use[k] === e.id) lib.use[k] = ''; FE.id = lib.exprs[0].id; saveFaceLib(); feSelect();
  });
  $('fe-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(FACE_LIB, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'expresiones.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $('fe-import').addEventListener('click', () => $('fe-file').click());
  $('fe-file').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return; const rd = new FileReader();
    rd.onload = () => { try { const d = JSON.parse(rd.result); for (const id in d) if (FACE_LIB[id] && Array.isArray(d[id].exprs)) FACE_LIB[id] = d[id]; saveFaceLib(); FE.id = feLib().exprs[0].id; feSelect(); feMsg('Importado'); } catch (err) { feMsg('Ese archivo no sirve'); } };
    rd.readAsText(file); e.target.value = '';
  });
  $('fe-resetall').addEventListener('click', () => { if (!confirm('¿Volver a las expresiones originales de todos los personajes?')) return; try { localStorage.removeItem('bsb_faces'); } catch (e) { } loadFaceLib(); ensureNormalAll(); refreshFaces(); FE.id = feLib().exprs[0].id; feSelect(); feMsg('Originales restauradas'); });
}

// visor brillante a la altura de los ojos (fila 4 de la cara)

  return { FE, feChangeChar, feClose, feColor, feDownload, feDrawFace, feDrawMain, feExpr, feFaceBase, feFaceCanvas, feImgChanged, feImportPNG, feInit, feLetterFor, feLib, feMsg, feOpen, fePaintAt, feRender, feRenderImg, feSelect };
};
