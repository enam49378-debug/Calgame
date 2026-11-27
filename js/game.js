// protección: si otra página mete el juego en un marco (para robarle clics o copiarlo), se sale al sitio real; el marco de la guía es del mismo origen y se permite
try { if (window.top !== window.self) { void window.parent.location.origin; } } catch (e) { try { window.top.location = window.self.location; } catch (x) { document.documentElement.innerHTML = ''; } }
(() => {
'use strict';
const V3 = THREE.Vector3;
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
window.V3 = V3; window.rand = rand; window.clamp = clamp;
const fwd = yaw => new V3(Math.sin(yaw), 0, Math.cos(yaw));
const rightOf = yaw => new V3(-Math.cos(yaw), 0, Math.sin(yaw));
const wrapA = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const angLerp = (a, b, t) => a + wrapA(b - a) * t;
const yawTo = (a, b) => Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z);
const dist2d = (a, b) => Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z);
const easeOut = k => 1 - (1 - k) * (1 - k);
const $ = id => document.getElementById(id);
const IS_GUIDE = /[?&]guia=1/.test(location.search); let GUIDE_OFF = false;
if (IS_GUIDE) document.body.classList.add('guide-frame');
function shade(hex, f) { const c = new THREE.Color(hex); c.lerp(new THREE.Color(f > 0 ? 0xffffff : 0x000000), Math.abs(f)); return '#' + c.getHexString(); }
const _c = new THREE.Color();

// ====================================================================
// PANTALLA DE CARGA ANIME DINÁMICA (Web & Desktop)
// ====================================================================
const LOADER = {
  el: null,
  bar: null,
  pct: null,
  status: null,
  tip: null,
  tips: [
    'Presiona SHIFT durante el combate para activar Shift Lock y fijar la cámara en tu rival.',
    'Bloquea con F justo al recibir el ataque para ejecutar un Bloqueo Perfecto.',
    'Alcanzar el 100% de la barra de Ulti desata el Despertar con nuevas habilidades y velocidad.',
    'Esquiva con Dash (tecla Q o doble toque) para cancelar ataques y castigar a tu oponente.',
    'El botón H en partida abre el Panel para cambiar la hora, el clima y entrenar con Dummies.',
    'Puedes personalizar y desbloquear hasta 200 FPS en el menú de Ajustes Gráficos.'
  ],
  tipIdx: 0,
  tipTimer: null,
  progress: 15,
  done: false,
  init() {
    this.el = $('loading-screen');
    this.bar = $('loading-bar-fill');
    this.pct = $('loading-pct');
    this.status = $('loading-status');
    this.tip = $('loading-tip');
    if (this.tipTimer) clearInterval(this.tipTimer);
    this.tipTimer = setInterval(() => this.nextTip(), 2500);
    // Timeout de seguridad: nunca dejar la pantalla bloqueada
    setTimeout(() => this.finish(), 6500);
  },
  setProgress(val, text) {
    this.progress = Math.max(this.progress, Math.min(100, val));
    if (this.bar) this.bar.style.width = this.progress.toFixed(0) + '%';
    if (this.pct) this.pct.textContent = this.progress.toFixed(0) + '%';
    if (text && this.status) this.status.textContent = text;
    if (this.el) this.el.setAttribute('aria-valuenow', this.progress.toFixed(0));
  },
  nextTip() {
    if (!this.tip) return;
    this.tipIdx = (this.tipIdx + 1) % this.tips.length;
    this.tip.innerHTML = this.tips[this.tipIdx].replace(/(SHIFT|Shift Lock|F|Bloqueo Perfecto|Ulti|Despertar|Dash|tecla Q|H|Dummies|200 FPS|Ajustes Gráficos)/g, '<b>$1</b>');
  },
  finish() {
    if (this.done) return;
    this.done = true;
    window.__loaderReady = true;
    this.setProgress(100, '¡BIENVENIDO A CALFIGHT!');
    if (this.tipTimer) clearInterval(this.tipTimer);
    if (window.__artBootTimer) clearInterval(window.__artBootTimer);

    setTimeout(() => {
      // 1. Destello suave anime
      const fl = $('loading-flash');
      if (fl) {
        fl.style.opacity = '0.90';
        fl.style.transition = 'opacity 0.4s ease';
      }

      // 2. Transición cinematográfica directa al MENÚ PRINCIPAL 3D (Escena de inicio: Personaje, Ciudad, Sol y Mar)
      setTimeout(() => {
        // El Menú Principal es la escena 3D inicial (titleStart) con el personaje contemplando la ciudad, Cambiar Escena, Ajustes y Jugar
        if (typeof titleStart === 'function') {
          titleStart(true);
        }
        $('menu').classList.add('hidden');
        $('title').classList.remove('hidden', 'leaving');
        G.state = 'title';

        // 3. Desvanecer la pantalla de carga con zoom y desenfoque
        if (this.el) {
          this.el.classList.add('loader-done');
        }

        // 4. Disolver el destello suavemente
        setTimeout(() => {
          if (fl) {
            fl.style.transition = 'opacity 0.7s ease';
            fl.style.opacity = '0';
          }
          setTimeout(() => {
            if (this.el) this.el.style.display = 'none';
            if (fl) fl.style.display = 'none';
          }, 750);
        }, 150);
      }, 350);
    }, 450);
  }
};
LOADER.init();

// ================= Renderer y escenas =================
// Motor 3D, iluminación base, cielo y shaders (ver js/graficos/motor_escena.js)
let PERF_FX = 1, PERF_DEST = 1;   // multiplicadores de partículas y de destrucción según la calidad
const motorEscena = CF_GRAFICOS.crearMotorEscena({
  $, clamp, V3, _c,
  onContextLost: () => { if (typeof GFX !== 'undefined') { GFX.post = false; if (GFX.level < 3 && typeof gfxSet === 'function') gfxSet(3, GFX.auto, false); } },
  onContextRestored: () => { try { if (typeof gfxApply === 'function') gfxApply(false); } catch (e) {} }
});
const {
  WEAK_PC, LOW_PC, renderer, TONOS, scene, SKY, camera, sun, HEMI,
  ANIME_SKY_TEX, skyGeo, skyMat, skyDome, updateSunShadowFocus,
  noiseRect, pixTex, BLOCK_TEX, CITY_GRAD, CITY_CUT, CUT_GLSL,
  HOLE_U, ZZZ_U, cityAnimeMaterial
} = motorEscena;
const skyFollow = () => motorEscena.skyFollow(G.apoc || 0, (typeof WX !== 'undefined' && WX.night) || 0);

// ================= Mundo: Ciudad Aurora =================
// Calles de 8 m, plaza abierta y manzanas bajas; la distribución es fija en todas las partidas.
const B = 1.1, ARENA = 118, COL = [], CLOUDS = [], ELEVATORS = [];
window.COL = COL; window.CLOUDS = CLOUDS;
// Cuadrícula espacial hash para colisiones COL (evita recorrer todo COL por fotograma)
const COL_GRID = { cell: 10, map: new Map(), large: [], dirty: true, n: -1, qId: 0, res: [], segRes: [], physRes: [] };
function colMarkDirty() { COL_GRID.dirty = true; }
window.colMarkDirty = colMarkDirty;
function _colEnsure() {
  if (!COL_GRID.dirty && COL_GRID.n === COL.length) return;
  const Gc = COL_GRID, cell = Gc.cell;
  Gc.map.clear();
  Gc.large.length = 0;
  for (let i = 0; i < COL.length; i++) {
    const c = COL[i];
    if (!c) continue;
    const hx = Math.max(0, c.hx || 0), hz = Math.max(0, c.hz || 0);
    if (hx > 18 || hz > 18) { Gc.large.push(c); continue; }
    const x0 = Math.floor((c.x - hx) / cell), x1 = Math.floor((c.x + hx) / cell);
    const z0 = Math.floor((c.z - hz) / cell), z1 = Math.floor((c.z + hz) / cell);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cz = z0; cz <= z1; cz++) {
        const key = (cx + 2048) * 4096 + (cz + 2048);
        let arr = Gc.map.get(key);
        if (!arr) { arr = []; Gc.map.set(key, arr); }
        arr.push(c);
      }
    }
  }
  Gc.dirty = false;
  Gc.n = COL.length;
}
function colQueryAABB(minX, maxX, minZ, maxZ, out = COL_GRID.res) {
  _colEnsure();
  const Gc = COL_GRID, cell = Gc.cell, qId = ++Gc.qId;
  out.length = 0;
  for (let i = 0; i < Gc.large.length; i++) {
    const c = Gc.large[i];
    c._qId = qId;
    out.push(c);
  }
  const x0 = Math.floor(minX / cell), x1 = Math.floor(maxX / cell);
  const z0 = Math.floor(minZ / cell), z1 = Math.floor(maxZ / cell);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cz = z0; cz <= z1; cz++) {
      const arr = Gc.map.get((cx + 2048) * 4096 + (cz + 2048));
      if (!arr) continue;
      for (let k = 0; k < arr.length; k++) {
        const c = arr[k];
        if (c._qId !== qId) { c._qId = qId; out.push(c); }
      }
    }
  }
  return out;
}
function colQuery(x, z, r = 0.5, out = COL_GRID.res) {
  return colQueryAABB(x - r, x + r, z - r, z + r, out);
}
window.colQuery = colQuery;
window.colQueryAABB = colQueryAABB;
// Ver las cajas de colisión de la ciudad: abre la consola del navegador (F12) y escribe  mostrarColisiones()   (otra vez para ocultarlas)
window.mostrarColisiones = () => { if (window._colVis) { scene.remove(window._colVis); window._colVis = null; return 'ocultas'; } const pts = [], p = (x, y, z) => pts.push(x, y, z);
  for (const c of COL) { const y0 = c.y0 || 0, y1 = c.h || 1, x0 = c.x - c.hx, x1 = c.x + c.hx, z0 = c.z - c.hz, z1 = c.z + c.hz; for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]], [[x0, z1], [x0, z0]]]) { p(a[0], y0, a[1]); p(b[0], y0, b[1]); p(a[0], y1, a[1]); p(b[0], y1, b[1]); p(a[0], y0, a[1]); p(a[0], y1, a[1]); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x00ff66, depthTest: false })); l.renderOrder = 999; l.frustumCulled = false; scene.add(l); window._colVis = l; return COL.length + ' cajas'; };
const CITY = { name: 'Ciudad Aurora', buildings: [], skyline: [], parks: [], interiors: [], lamps: [], windowMaterials: [], wetMaterials: [], lampMaterials: [], signMaterials: [], bbEmissiveMaterials: [], propsCull: [], core: 62, bounds: 116 };
function addPropCull(mesh, x, y, z, radius, rangeMul = 1, canShadow = false) {
  if (!mesh) return mesh;
  mesh.userData.propCull = { center: new THREE.Vector3(x, y, z), radius, rangeMul, canShadow };
  CITY.propsCull.push(mesh);
  return mesh;
}
// Costa: el mar queda al sur (z grande). SHORE(x) es la z de la orilla en cada x; inSea() dice si un punto ya es mar.
const SHORE = x => 96 + 3.5 * Math.sin(x * .045) + 2 * Math.sin(x * .11 + 1);
const inSea = (x, z) => z > SHORE(x) - 1.2;
// Mundo ampliado y mapas independientes (vista privada CF_BETA). Cada mapa tiene su propio rectángulo jugable (b), su minimapa (mm) y sus cosas;
// al cambiar de mapa (js/mapas.js) lo del otro desaparece. Sin la vista privada solo existe el mapa A con el círculo de siempre.
const worldBig = () => !!(window.CF_BETA && window.CF_BETA.on);
const MAPS = {
  A: { id: 'A', name: 'Ciudad Aurora', short: 'CIUDAD AURORA', sub: 'Ciudad, mar y abismo', col: '#5ec8ff', circle: true, b: { x0: -118, x1: 118, z0: -132, zs: 545 }, mm: { cx: 0, cz: 16, half: 145 }, hour: 11 },
  J: { id: 'J', name: 'Selva Esmeralda', short: 'SELVA ESMERALDA', sub: 'Pirámide, ríos y ruinas', col: '#3ddc84', b: { x0: 66, x1: 326, z0: -132, zs: 126 }, mm: { cx: 196, cz: -3, half: 150 }, hour: 12.5 },
  B: { id: 'B', name: 'Valle Sakura', short: 'VALLE SAKURA', sub: 'Aldeas, castillo, ríos y cerezos', col: '#f7a1c4', b: { x0: -338, x1: -60, z0: -132, zs: 126 }, mm: { cx: -199, cz: -3, half: 150 }, hour: 17.4 }
};
const MAPCUR = { id: 'A' };
const TRAVEL = { on: false, freeze: false, lock: false };
const mapNow = () => MAPS[worldBig() ? MAPCUR.id : 'A'];
const outLand = (x, z, m = 1) => { if (!worldBig() || mapNow().circle) return Math.hypot(x, z) > ARENA + m; const b = mapNow().b; return x < b.x0 - m || x > b.x1 + m || z < b.z0 - m; };
// Agua tierra adentro (ríos, lagos): rectángulos {x0,x1,z0,z1,d}. Se nada igual que en el mar. LAKES.on lo enciende la vista privada.
const LAKES = [];
function lakeAt(x, z) { if (!LAKES.on) return null; for (let i = 0; i < LAKES.length; i++) { const l = LAKES[i]; if (l.map !== MAPCUR.id) continue; if (x > l.x0 && x < l.x1 && z > l.z0 && z < l.z1) return l; } return null; }
function lakeFloor(l, x, z) {   // orilla en pendiente; donde un tramo toca otro tramo (o el mar) no hay orilla
  let m = 9;
  if (!lakeAt(l.x0 - .5, z)) m = Math.min(m, x - l.x0); if (!lakeAt(l.x1 + .5, z)) m = Math.min(m, l.x1 - x);
  if (!lakeAt(x, l.z0 - .5)) m = Math.min(m, z - l.z0); if (!lakeAt(x, l.z1 + .5) && l.z1 < SHORE(x)) m = Math.min(m, l.z1 - z);
  return -Math.min(l.d, .35 + m * 1.7);
}
const wetAt = (x, z) => z > SHORE(x) + .2 || !!lakeAt(x, z);
let _navC = null, _navN = -1;
function navCols() { if (_navN !== COL.length) { _navN = COL.length; _navC = COL.filter(c => Math.hypot(c.x, c.z) < CITY.bounds + c.hx + c.hz + 2); } return _navC; }   // la navegación de los bots solo mira lo que cae dentro de la ciudad
const SUN_DIR = new THREE.Vector3(0, 1, 0);
const BEACH = { t: 0, boats: [], gulls: [], sea: { uTime: { value: 0 }, uSky: { value: new THREE.Color(0xb4dcf6) }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color(0xfff0c8) }, uSunK: { value: 1 } } };
// Plan de la ciudad: [x, z, ancho, fondo, alto, color, etiqueta, acento, interior]. Lo usan el dibujo de los edificios y el clima (refugio de los rayos).
const CITY_PLAN = [
  [-12.5,-12.5,10,10,7.6,'#f0bf7b','CAFÉ LUNA','#487e88',{kind:'cafe',base:4.3}],
  [12.5,-12.5,10,10,6.4,'#e49aab','ARCADE','#9c5969',{kind:'arcade',base:4.3}],
  [-12.5,12.5,10,10,6.6,'#77beaa','MERCADO','#536b7e',{kind:'market',base:4.3}],
  [14,14,7,7,8.1,'#e9cd83','AURORA','#8d735c'],
  [-30,-13,9,12,6.4,'#b9a0db','LIBROS','#7d6b94',{kind:'library',base:4.4}],
  [30,13,9,12,6.4,'#eda777','RAMEN','#a35d4b',{kind:'ramen',base:4.2}],
  [-13,29,8,6,6.5,'#88b8dc',null,'#536b7e'],
  [13,-29,8,6,6.3,'#dda19b',null,'#8b5b55'],
  [-13,-29,7,6,8.8,'#deca8b','ESTACIÓN','#577d7d'],
  [13,29,12,9,5.8,'#a9cd86','TALLER','#677d61',{kind:'workshop',base:4.3}],
  [-29,13,6,7,6.5,'#87c8d0',null,'#527d8f'],
  [29,-13,6,7,7.5,'#dcc080',null,'#8b7861'],
  // barrio ampliado
  [-35,-36,9,9,12.5,'#88b8dc',null,'#536b7e'],[36,-37,9,9,10,'#e49aab',null,'#8b5b55'],[36,36,9,9,14,'#deca8b',null,'#577d7d'],[-36,36,9,9,9.5,'#a9cd86',null,'#677d61'],
  [-14,-54,9,10,11,'#dcc080',null,'#8b7861'],[14,-54,9,10,15,'#b9a0db',null,'#7d6b94'],[-14,54,9,10,13,'#eda777',null,'#a35d4b'],[14,54,9,10,8.5,'#87c8d0',null,'#527d8f'],
  [54,-14,10,9,12,'#f0bf7b',null,'#487e88'],[54,14,10,9,9,'#77beaa',null,'#536b7e'],[-54,-14,10,9,16,'#e9cd83',null,'#8d735c'],[-54,14,10,9,10.5,'#88b8dc',null,'#536b7e'],
  [55,0,12,18,7.5,'#dda19b','GIMNASIO','#8b5b55'],[-56,0,10,16,6,'#deca8b','MUSEO','#577d7d'],
  [-31,-51,9,8,9,'#a9cd86',null,'#677d61'],[31,-51,9,8,12,'#87c8d0',null,'#527d8f'],[-31,51,9,8,10.5,'#dcc080',null,'#8b7861'],[31,51,9,8,7.5,'#b9a0db',null,'#7d6b94'],
  [-51,-31,8,9,13,'#eda777',null,'#a35d4b'],[51,-31,8,9,8,'#f0bf7b',null,'#487e88'],[-51,31,8,9,11,'#e49aab',null,'#8b5b55'],[51,31,8,9,14,'#77beaa',null,'#536b7e'],
  [0,55,20,12,8.5,'#e9cd83','CENTRO COMERCIAL','#8d735c',{kind:'mall',base:6,door:3.6}],
  [0,-54,16,14,46,'#a6b8c4','TORRE AURORA','#2a3b4a',{kind:'lobby',base:6.5,door:3.2}],
].map(([x,z,w,d,h,color,label,accent,acc]) => ({x,z,w,d,h,color,label,accent,acc,accessible:!!acc}));
// Edificios sin interior: modelos de Blockbench (carpeta ciudad/). Tamaño tomado de cada modelo.
const CITY_MODEL_DIMS = {"apartamentos_ladrillo": [9.0, 9.0, 12.1], "apartamentos_menta": [9.0, 9.0, 12.1], "apartamentos_cielo": [9.0, 9.0, 12.1], "oficinas_gris": [10.0, 9.0, 15.0], "oficinas_azules": [10.0, 9.0, 15.0], "casa_tienda_durazno": [8.0, 7.0, 6.3], "casa_tienda_rosa": [8.0, 7.0, 6.3], "tienda_amarilla": [8.0, 6.0, 6.3], "tienda_lila": [8.0, 6.0, 6.3], "torre_residencial_salvia": [9.0, 9.0, 17.4], "torre_residencial_naranja": [9.0, 9.0, 17.4], "artdeco_crema": [9.0, 8.0, 22.7], "hotel_rosa": [8.0, 9.0, 12.3], "gimnasio": [12.0, 18.0, 7.5], "museo": [10.0, 16.0, 6.0], "cafe": [13, 13, 8.0], "arcade": [13, 13, 7.2], "mercado": [13, 13, 7.2], "biblioteca": [16, 14, 8.4], "ramen": [16, 14, 7.5], "taller": [14, 14, 7.0], "centro_comercial": [28, 13, 9.5], "torre_aurora": [22, 14, 46.0]};
{const A = {"3": "tienda_amarilla", "6": "casa_tienda_durazno", "7": "tienda_lila", "8": "tienda_lila", "10": "tienda_amarilla", "11": "casa_tienda_durazno", "12": "apartamentos_menta", "13": "hotel_rosa", "14": "oficinas_gris", "15": "casa_tienda_rosa", "16": "apartamentos_ladrillo", "17": "torre_residencial_salvia", "18": "hotel_rosa", "19": "casa_tienda_durazno", "20": "oficinas_gris", "21": "apartamentos_cielo", "22": "artdeco_crema", "23": "apartamentos_menta", "24": "gimnasio", "25": "museo", "26": "casa_tienda_rosa", "27": "apartamentos_cielo", "28": "tienda_lila", "29": "casa_tienda_durazno", "30": "oficinas_azules", "31": "tienda_amarilla", "32": "hotel_rosa", "33": "torre_residencial_naranja"}, M = {"20": [54, -16], "21": [54, 16], "22": [-54, -16], "23": [-54, 16]};
  for (const i in A) { const b = CITY_PLAN[i], dm = CITY_MODEL_DIMS[A[i]]; b.model = A[i]; b.w = dm[0]; b.d = dm[1]; b.h = dm[2]; if (M[i]) { b.x = M[i][0]; b.z = M[i][1]; } } }
{const I = {"0": {"m": "cafe", "x": -12, "z": -12, "k": "cafe", "base": 4.5, "door": 3.2}, "1": {"m": "arcade", "x": 12, "z": -12, "k": "arcade", "base": 4.5, "door": 3.2}, "2": {"m": "mercado", "x": -12, "z": 12, "k": "market", "base": 4.5, "door": 3.2}, "4": {"m": "biblioteca", "x": -33, "z": -12, "k": "library", "base": 5.1, "door": 3.2}, "5": {"m": "ramen", "x": 33, "z": 12, "k": "ramen", "base": 4.5, "door": 3.2}, "9": {"m": "taller", "x": 12, "z": 33, "k": "workshop", "base": 4.7, "door": 3.2}, "34": {"m": "centro_comercial", "x": 0, "z": 53.5, "k": "mall", "base": 5.7, "door": 3.2}, "35": {"m": "torre_aurora", "x": 0, "z": -54, "k": "lobby", "base": 6.2, "door": 3.2}}, M2 = {"16": [-19, -53], "17": [19, -53], "18": [-21, 52], "19": [21, 52]};
  for (const i in I) { const b = CITY_PLAN[i], q = I[i], dm = CITY_MODEL_DIMS[q.m]; b.model = q.m; b.x = q.x; b.z = q.z; b.w = dm[0]; b.d = dm[1]; b.h = dm[2]; b.acc = { kind: q.k, base: q.base, door: q.door }; b.accessible = true; }
  for (const i in M2) { CITY_PLAN[i].x = M2[i][0]; CITY_PLAN[i].z = M2[i][1]; } }
// Arreglo de choques: con el tamaño real de sus modelos, las oficinas grises se metían en el gimnasio y el art déco en el museo
for (const [m, x, z, nz] of [['oficinas_gris', 54, -16, -18.4], ['artdeco_crema', -54, -16, -18]]) { const b = CITY_PLAN.find(q => q.model === m && Math.abs(q.x - x) < .6 && Math.abs(q.z - z) < .6); if (b) b.z = nz; }
CITY_PLAN.push({x:78,z:-30,w:26,d:22,h:10,color:'#c5a578',label:'CASINO AURORA',accent:'#684061',acc:{kind:'casino',base:6.2,door:4.4},accessible:true});

// ===== Ediciones del mapa (las hace el editor de mapa en modo desarrollador y quedan en config/mapa.json) =====
const MAP_ITEMS = [];
const MAPED = (() => {
  const E = { v: 1, mv: {}, del: [], add: [] }, num = (v, d = 0) => (Number.isFinite(+v) && Math.abs(+v) < 600 ? +v : d);
  try {
    let txt = null, dev = /^(localhost|127\.|\[::1\])/.test(location.hostname);
    try { const d = JSON.parse(localStorage.getItem('bsb_dev') || 'null'); if (d && Date.now() - d.t < 30 * 864e5) dev = true; } catch (e) { }
    if (dev) { try { txt = localStorage.getItem('bsb_mapedit'); } catch (e) { } }
    if (!txt && dev) { const x = new XMLHttpRequest(); x.open('GET', 'config/mapa.json?v=' + Date.now(), false); x.send(); if (x.status === 200) txt = x.responseText; }
    const j = txt && JSON.parse(txt);
    if (j && j.v === 1) {
      for (const k in (j.mv || {})) if (typeof k === 'string' && k.length < 120) E.mv[k] = { x: num(j.mv[k].x), z: num(j.mv[k].z), ry: num(j.mv[k].ry) };
      for (const k of (j.del || [])) if (typeof k === 'string' && k.length < 120) E.del.push(k);
      for (const a of (j.add || [])) if (a && typeof a.id === 'string' && typeof a.from === 'string' && (a.kind === 'b' || a.kind === 'p')) E.add.push({ id: a.id.slice(0, 40), kind: a.kind, model: String(a.model || '').replace(/[^a-z0-9_]/g, '').slice(0, 40), from: a.from.slice(0, 120), x: num(a.x), z: num(a.z), ry: num(a.ry) });
    }
  } catch (e) { }
  return E;
})();
{
  const B = CITY_PLAN.slice();
  for (const b of B) { b.k = 'b:' + (b.model || b.label || 'blq') + '@' + b.x + ',' + b.z; MAP_ITEMS.push({ key: b.k, kind: 'b', model: b.model || 'edificio', label: b.label || '', ox: b.x, oz: b.z, ory: 0, x: b.x, z: b.z, ry: 0, w: b.w, d: b.d, h: b.h, color: b.color, plan: b }); }
  CITY_PLAN.length = 0;
  for (const it of MAP_ITEMS) {
    if (MAPED.del.includes(it.key) && it.label !== 'TORRE AURORA') { it.del = true; continue; }
    const m = MAPED.mv[it.key]; if (m) { it.plan.x = it.x = m.x; it.plan.z = it.z = m.z; }
    CITY_PLAN.push(it.plan);
  }
  for (const a of MAPED.add) if (a.kind === 'b') {
    const f = MAP_ITEMS.find(q => q.key === a.from && q.kind === 'b'); if (!f) continue;
    const plan = Object.assign({}, f.plan, { x: a.x, z: a.z, label: null, acc: undefined, accessible: false, k: a.id });   // la copia no tiene interior
    CITY_PLAN.push(plan); MAP_ITEMS.push({ key: a.id, kind: 'b', model: f.model, label: '', ox: a.x, oz: a.z, ory: 0, x: a.x, z: a.z, ry: 0, w: f.w, d: f.d, h: f.h, color: f.color, plan, added: true, from: a.from });
  }
}
// Puntos de aparición de los mapas ampliados (vista privada). Los de la Selva se suman a los de la ciudad.
const JUNGLE_SPAWNS = [[112,-3],[128,12],[135,-18],[152,12],[160,-12],[178,-28],[188,10],[175,58],[185,28],[240,35],[255,52],[245,76],[275,12],[300,20],[270,-30],[250,-62],[190,-60],[150,-45],[118,-50],[120,40]].map(([x,z],i) => ({ id: 100 + i, x, z, yaw: Math.atan2(104 - x, 20 - z) }));
const JAPAN_SPAWNS = [[-88,2],[-76,0],[-88,-10],[-110,-4],[-125,-6],[-140,10],[-165,-14],[-195,-12],[-188,-20],[-198,-45],[-130,50],[-135,38],[-210,10],[-225,5],[-255,0],[-240,-20],[-232,-40],[-255,-100],[-190,-100]].map(([x,z],i) => ({ id: 200 + i, x, z, yaw: Math.atan2(-199 - x, -3 - z) }));
const SPAWN_POINTS = [
  [0,-33], [33,0], [0,33], [-33,0], [-22,-29], [22,29], [-29,22], [29,-22],
  [-22,10], [22,-10], [-22,-3], [22,3], [0,-9], [9,0], [0,9], [-9,0],
  [0,-44], [0,44], [44,0], [-44,0], [20,-44], [-20,-44], [20,44], [-20,44], [44,20], [44,-20], [-44,20], [-44,-20], [34,-44], [-34,44], [44,34], [-44,-34], [-45,76], [45,76], [0,70], [-72,76], [72,76], [0,-88], [88,0], [-88,0], [62,-62], [-62,-62], [62,62], [-62,56]
].map(([x,z],i) => ({ id: i + 1, x, z, yaw: Math.atan2(-x,-z) }));
function cityGrassAt(x,z) {
  if(z>66)return false;   // paseo marítimo, playa y mar
  if(CITY.noGrass&&CITY.noGrass.some(r=>x>r[0]&&x<r[1]&&z>r[2]&&z<r[3]))return false;   // caminos y plazas de los lugares nuevos
  return Math.hypot(x,z) > CITY.core || CITY.parks.some(p => Math.abs(x-p.x)<p.w/2-.4 && Math.abs(z-p.z)<p.d/2-.4);
}
{
  const plaster=pixTex(32,32,g=>{noiseRect(g,0,0,32,32,'#eeeeea',7);g.fillStyle='rgba(80,85,90,.035)';for(let y=7;y<32;y+=8)g.fillRect(0,y,32,1);});
  const asphalt=pixTex(64,64,g=>{noiseRect(g,0,0,64,64,'#d0d4d5',17);g.fillStyle='rgba(65,72,80,.16)';g.fillRect(4,18,20,1);g.fillRect(24,18,1,15);g.fillRect(24,33,13,1);});
  const facadeColors=['#f0bf7b','#e49aab','#77beaa','#e9cd83','#b9a0db','#eda777','#88b8dc','#dda19b','#deca8b','#a9cd86','#87c8d0','#dcc080'];
  const batches = new Map(), matrix = new THREE.Matrix4(), rotation = new THREE.Quaternion(), xyz = new V3(), size = new V3();
  // Vista privada (CF_BETA): lo que se construye con BETA_ON = true va en lotes aparte y solo lo ve el Owner hasta su lanzamiento (CITY.betaApply)
  let BETA_ON = false, MAPTAG = 'A', PUBOWN = 'A'; const betaCols = [], betaObjs = [], betaMeshes = [], pubCols = [], pubMeshes = [], pubObjs = [];   // MAPTAG: a qué mapa pertenece lo que se construye ('B' = Valle Sakura)   // BETA_ON = -1: solo para el público (lo que la novedad sustituye)
  const box = (x,y,z,w,h,d,color,tex=null,tower=null) => {
    const key = color + ':' + (tex || '') + ':' + Math.floor(x / 44) + ',' + Math.floor(z / 44) + (BETA_ON ? (BETA_ON < 0 ? ':pub' : ':beta') : '') + (MAPTAG !== 'A' ? ':m' + MAPTAG : '') + (BETA_ON < 0 ? PUBOWN : '');   // un lote por color y por zona de 44 m
    if (!batches.has(key)) batches.set(key, { color, tex, items: [], beta: BETA_ON > 0, pub: BETA_ON < 0, map: MAPTAG, own: PUBOWN });
    batches.get(key).items.push([x,y,z,w,h,d,tower]);
  };
  const solid = (x,z,w,d,h,y0=0,ceiling=false) => { const c = {x,z,hx:w/2,hz:d/2,h,y0,ceiling,map:MAPTAG,bm:BETA_ON?1:0,own:PUBOWN}; if (BETA_ON) (BETA_ON < 0 ? pubCols : betaCols).push(c); else COL.push(c); };
  const flat = (x,z,w,d,color,y=.013) => box(x,y,z,w,.018,d,color);
  const grass = BLOCK_TEX.grass.clone(); grass.needsUpdate = true;
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(420/B,280/B);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420,280),new THREE.MeshLambertMaterial({map:grass}));   // el césped llega hasta la playa (z=70): ya no tapa el mar
  ground.rotation.x=-Math.PI/2; ground.position.y=-.15; ground.position.z=-70; ground.receiveShadow=true; ground.frustumCulled=false; scene.add(ground); CITY.ground=ground;
  // Mundo ampliado: el suelo pasa a ser una rejilla de 3 m que deja huecos donde hay ríos y lagos, con un tinte suave por bioma
  CITY.bigGround=on=>{
    const id=MAPCUR.id;
    if(!CITY.groundGeoPub)CITY.groundGeoPub=ground.geometry;
    CITY.gBig=CITY.gBig||{};CITY.lakeW=CITY.lakeW||{};
    if(on&&id!=='A'&&!CITY.gBig[id]){
      const P=[],U=[],C=[],I=[];let n=0;
      const tint=(x,z)=>{const n=Math.sin(x*.045+1.3)*Math.sin(z*.05+.7)*.5+Math.sin(x*.12+z*.09)*.25+Math.sin(x*.31-z*.27)*.1,v=1+n*.2,b=id==='J'?[.72,.92,.7]:[1,.97,.94];return [clamp(b[0]*v*(1-n*.05),0,1.2),clamp(b[1]*v,0,1.2),clamp(b[2]*v*(1+n*.06),0,1.2)];};
      for(let x=-339;x<339;x+=3)for(let z=-168;z<69;z+=3){
        if(LAKES.some(l=>l.map===id&&x+1.5>l.x0&&x+1.5<l.x1&&z+1.5>l.z0&&z+1.5<l.z1))continue;
        for(const [dx,dz] of [[0,0],[3,0],[0,3],[3,3]]){const X=x+dx,Z=z+dz;P.push(X,-(Z+70),0);U.push((X+210)/420,(Z+210)/280);const t=tint(X,Z);C.push(t[0],t[1],t[2]);}
        I.push(n,n+2,n+1,n+1,n+2,n+3);n+=4;}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();CITY.gBig[id]=g;
      const WP=[],WI=[];let k=0;
      for(const l of LAKES){if(l.map!==id)continue;const z1=Math.min(l.z1,67);if(z1<=l.z0)continue;WP.push(l.x0,SEA_Y,l.z0,l.x1,SEA_Y,l.z0,l.x0,SEA_Y,z1,l.x1,SEA_Y,z1);WI.push(k,k+2,k+1,k+1,k+2,k+3);k+=4;}
      const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(WP,3));wg.setAttribute('uv',new THREE.Float32BufferAttribute(WP.filter((_,i)=>i%3!==1).map(v=>v/8),2));wg.setIndex(WI);wg.computeVertexNormals();
      const wm=new THREE.Mesh(wg,new THREE.MeshPhongMaterial({color:0x2f9bd1,transparent:true,opacity:.8,shininess:90,specular:0x9fd8ff,side:THREE.DoubleSide}));wm.frustumCulled=false;wm.renderOrder=-4;wm.visible=false;scene.add(wm);CITY.lakeW[id]=wm;
    }
    const big=!!on&&id!=='A';ground.geometry=big?CITY.gBig[id]:CITY.groundGeoPub;ground.material.vertexColors=big;ground.material.needsUpdate=true;
    for(const k in CITY.lakeW)CITY.lakeW[k].visible=!!on&&k===id;
  };
  const paving = pixTex(32,32,g=>{
    noiseRect(g,0,0,32,32,'#8c999f',8); g.fillStyle='#919da5';
    for(let i=0;i<32;i+=8){g.fillRect(i,0,1,32);g.fillRect(0,i,32,1);}
  });
  paving.wrapS=paving.wrapT=THREE.RepeatWrapping; paving.repeat.set(24,24);
  const town = new THREE.Mesh(new THREE.CircleGeometry(CITY.core+.5,160),new THREE.MeshPhongMaterial({map:paving,shininess:8,specular:0x17232b}));
  cityAnimeMaterial(town.material);CITY.wetMaterials.push(town.material);
  town.rotation.x=-Math.PI/2; town.position.y=-.005; town.receiveShadow=true; scene.add(town); addPropCull(town,0,0,0,CITY.core+1,1.35);
  // Avenidas principales y cuatro calles laterales, con las esquinas despejadas.
  flat(0,0,8,2*CITY.core,'#46515d'); flat(0,0,2*CITY.core,8,'#46515d');
  for(const a of [-22,22,-44,44]){const L=2*Math.floor(Math.sqrt(CITY.core*CITY.core-a*a)-1.5);flat(a,0,5,L,'#56616a');flat(0,a,L,5,'#56616a');}
  flat(0,0,21,21,'#958e7c',.028);
  for(const a of [-10.6,10.6]){flat(a,0,.18,21.4,'#80929c',.041);flat(0,a,21.4,.18,'#80929c',.041);}
  for(let a=-59;a<=59;a+=4){
    if(Math.abs(a)>13){flat(0,a,.12,1.8,'#f6daa0',.04);flat(a,0,1.8,.12,'#f6daa0',.04);}
  }
  for(const a of [-13,13,-27,27]) for(let b=-2.7;b<=2.8;b+=.9){
    flat(b,a,.48,2.1,'#eee9db',.045);flat(a,b,2.1,.48,'#eee9db',.045);
  }
  // Emblema de la plaza, totalmente transitable.
  const seal = new THREE.Mesh(new THREE.RingGeometry(2.2,2.35,4),new THREE.MeshLambertMaterial({color:0x598c9a,side:THREE.DoubleSide}));
  seal.rotation.x=-Math.PI/2;seal.rotation.z=Math.PI/4;seal.position.y=.052;seal.receiveShadow=ZZZ_U.beta.value>0.5;scene.add(seal);CITY.seal=seal; addPropCull(seal,0,.05,0,2.5,.75);
  flat(0,0,.25,2.3,'#598c9a',.054);flat(0,0,2.3,.25,'#598c9a',.054);
  function sign(text,x,y,z,w,ry,color='#24546a'){
    const texture=pixTex(256,64,g=>{
      g.fillStyle=color;g.fillRect(0,0,256,64);g.strokeStyle='#eae7cf';g.lineWidth=4;g.strokeRect(5,5,246,54);
      g.fillStyle='#fff8df';g.textAlign='center';g.textBaseline='middle';g.font='bold 28px sans-serif';g.fillText(text,128,34,230);
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshLambertMaterial({map:texture,side:THREE.DoubleSide}));
    cityAnimeMaterial(mesh.material);mesh.material.emissiveMap=texture;CITY.signMaterials.push(mesh.material);
    mesh.position.set(x,y,z);mesh.rotation.y=ry;scene.add(mesh); addPropCull(mesh,x,y,z,Math.max(1,w*.65),.75);
  }
  // Interiores: amplios, con piso, paredes, techo, luces y muebles propios de cada local. Todo en lotes instanciados (casi gratis de dibujar).
  const lampBox=(px,py,pz,w,d,col='#fff6d0')=>box(px,py,pz,w,.08,d,col,'lamp');   // lámparas: material que brilla solo
  function interior(kind,x,z,w,d,base,face,accent,wall){
    const iw=w-2*wall,id=d-2*wall,U=u=>x+u,V=v=>z+v,hu=iw/2-.05,hv=id/2-.05;
    const pal={cafe:['#f3e3c3','#c9a16a','#fbf1d8','#5a3b2a'],arcade:['#25304f','#1d2340','#2a3358','#e572b6'],market:['#eef3ee','#e6e8dc','#fbfdf6','#3a8f74'],
      library:['#e7d6b4','#7b5a3d','#f3e7cc','#8e3a3f'],ramen:['#ecd9b6','#a47c50','#f6ead0','#c9382c'],workshop:['#d9dcdc','#8f949a','#e8eaea','#e8b923'],
      casino:['#ddcdb8','#642f4e','#efe6d4','#c7a65a'],mall:['#f4f0e6','#dedacf','#fafafa','#d39b3e'],lobby:['#efe9dc','#262a33','#f7f3ea','#c9a24a']}[kind];
    const [wallC,floorC,ceilC,trim]=pal;
    // paredes interiores, zócalo y techo (la caja exterior sigue siendo del color de la fachada)
    for(const sd of [-1,1]){box(x+sd*(w/2-wall-.03),base/2,z,.06,base-.1,id,wallC);box(x+sd*(w/2-wall-.07),.12,z,.12,.24,id,trim);box(x+sd*(w/2-wall-.07),base-.16,z,.12,.12,id,trim);}
    for(const end of [-1,1]){
      const ez=z+end*(d/2-wall-.03),span=(iw-2.8)/2;
      for(const sd of [-1,1]){box(x+sd*(1.4+span/2),base/2,ez,span,base-.1,.06,wallC);box(x+sd*(1.4+span/2),.12,ez-end*.04,span,.24,.12,trim);}
    }
    box(x,base-.05,z,iw,.1,id,ceilC);
    for(let u=-hu+1.2;u<hu;u+=3)box(x+u,base-.14,z,.16,.16,id,trim);                     // vigas
    const ceilingLights=(cols=['#fff0b1'])=>{let k=0;for(let u=-hu+1.6;u<hu-.5;u+=3.2)for(let v=-hv+1.6;v<hv-.5;v+=3.2)lampBox(U(u),base-.11,V(v),1.1,.8,cols[k++%cols.length]);};
    const plant=(u,v,s=1)=>{box(U(u),.28*s,V(v),.55*s,.56*s,.55*s,'#b5694c');box(U(u),.92*s,V(v),.9*s,.85*s,.9*s,'#4f9a5f','leaves');box(U(u),1.5*s,V(v),.55*s,.6*s,.55*s,'#66b46f','leaves');solid(U(u),V(v),.55*s,.55*s,.7*s);};
    const table=(u,v,col='#b9926a',s=1)=>{box(U(u),.78,V(v),1.0*s,.07,1.0*s,col);box(U(u),.38,V(v),.14,.76,.14,'#4c3f36');box(U(u),.04,V(v),.6*s,.07,.6*s,'#4c3f36');solid(U(u),V(v),1.0*s,1.0*s,.82);};
    const chair=(u,v,dir,col='#8a5a44')=>{box(U(u),.46,V(v),.46,.07,.46,col);box(U(u),.23,V(v),.4,.46,.4,'#4c3f36');box(U(u)+(dir==='x+'?.22:dir==='x-'?-.22:0),.85,V(v)+(dir==='z+'?.22:dir==='z-'?-.22:0),dir[0]==='x'?.06:.46,.74,dir[0]==='z'?.06:.46,col);};
    const poster=(u,v,ry,col,w2=1.2,h2=1.6,y=2.0)=>{
      const onX=Math.abs(ry)>.1;box(U(u),y,V(v),onX?.05:w2,h2,onX?w2:.05,'#f5f0e1');box(U(u)+(onX?(u>0?-.03:.03):0),y,V(v)+(onX?0:(v>0?-.03:.03)),onX?.04:w2-.2,h2-.2,onX?w2-.2:.04,col);
    };
    const floorFlat=(w2,d2,col,off=0,ox=0,oz=0)=>flat(U(ox),V(oz),w2,d2,col,.039+off);
    const tag=(text,u,y,v,ry,col)=>sign(text,U(u),y,V(v),2.2,ry,col);
    ceilingLights();
    if(kind==='casino'){
      const fp=[],fc=[],floorColor=new THREE.Color();
      for(let u=-iw/2;u<iw/2-.01;u+=1)for(let v=-id/2;v<id/2-.01;v+=1){
        const u1=Math.min(iw/2,u+1),v1=Math.min(id/2,v+1),edge=Math.abs(u+.5)>iw/2-1||Math.abs(v+.5)>id/2-1;
        floorColor.set(edge?'#c9a85b':Math.abs(u+.5)<1.8?'#92516b':'#642f4e');
        for(const [a,b]of [[u,v],[u,v1],[u1,v],[u1,v],[u,v1],[u1,v1]]){fp.push(U(a),.065,V(b));fc.push(floorColor.r,floorColor.g,floorColor.b);}
      }
      const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));fg.computeVertexNormals();
      const carpet=new THREE.Mesh(fg,cityAnimeMaterial(new THREE.MeshLambertMaterial({vertexColors:true})));carpet.receiveShadow=true;scene.add(carpet);addPropCull(carpet,x,.07,z,Math.hypot(iw,id)*.55,.75);
      // Recepción, sala central de mesas y zona de bar al fondo: no es un pasillo de lado a lado.
      box(U(-8),.6,V(8),3.5,1.2,1.3,'#302b3c');box(U(-8),1.24,V(8),3.7,.12,1.5,'#d5b779');solid(U(-8),V(8),3.5,1.3,1.3);tag('RECEPCIÓN',-8,2.2,8,0,'#5e344d');
      for(const [u,v]of [[-5,3.1],[5,3.1],[-5,-1.5],[5,-1.5]]){
        box(U(u),.79,V(v),3.3,.18,2,'#bc9a58');box(U(u),.9,V(v),3.06,.055,1.76,'#25655e');box(U(u),.4,V(v),.55,.8,.55,'#362b39');solid(U(u),V(v),3.3,2,.92);
        for(const sd of [-1,1])for(const dx of [-1,1])chair(u+dx,v+sd*1.5,sd>0?'z-':'z+','#863b59');
        for(let k=0;k<3;k++){box(U(u-.5+k*.28),.946,V(v),.19,.012,.29,'#eee7d4');for(let h=0;h<3;h++)box(U(u+.65),.96+h*.045,V(v-.35+k*.19),.13,.04,.13,['#c15164','#dcc36c','#70b1b3'][k]);}
      }
      for(let v=-7;v<6;v+=2.1){const u=hu-1.05;box(U(u),.9,V(v),1,1.8,1.1,'#2b344c');solid(U(u),V(v),1,1.1,1.9);box(U(u),1.72,V(v-.53),.82,1,.08,'#d6aa58');box(U(u),1.72,V(v-.59),.66,.78,.045,'#386a83');for(let k=0;k<3;k++)box(U(u-.2+k*.2),1.7,V(v-.62),.15,.28,.04,['#ec668e','#f4ce6c','#78d8c5'][k]);box(U(u),1.1,V(v-.66),.8,.12,.22,'#d6aa58');}
      box(U(0),.6,V(-6.7),7.5,1.2,1.25,'#342c3d');box(U(0),1.25,V(-6.7),7.8,.12,1.5,'#d8c5a6');solid(U(0),V(-6.7),7.5,1.25,1.33);
      for(let u=-3;u<=3;u+=1.2){chair(u,-5.1,'z-','#8b3d60');for(let k=0;k<3;k++)box(U(u),1.46+k*.07,V(-7.05),.12,.13,.12,['#75b7bc','#e1b16c','#c36c8a'][k]);}
      box(U(0),2.3,V(-hv+.35),7,.13,.4,'#c6a25d');for(let u=-3;u<3.1;u+=.4)box(U(u),2.65,V(-hv+.38),.2,.55,.2,['#72a68f','#a582b8','#d4a868'][Math.abs(Math.round(u*10))%3]);
      tag('BAR AURORA',0,3.4,-hv+.42,0,'#5b354e');
      // Salón de descanso separado por un biombo bajo, con espacio para circular alrededor.
      for(const [u,v,sg]of [[8,-7,1],[8,-3,-1]]){box(U(u),.45,V(v),3.2,.9,1.1,'#573e72');box(U(u),.92,V(v+sg*.46),3.2,.85,.22,'#573e72');solid(U(u),V(v),3.2,1.1,1.2);}
      table(8,-5,'#cbb078',1.6);box(U(4.9),1,V(-7),.2,2,3.2,'#c3a45f');solid(U(4.9),V(-7),.2,3.2,2);tag('SALÓN',8,3.2,-hv+.4,0,'#4f3f64');
      table(-8,-6.3,'#c5a45e',2.5);
      const wheelTex=pixTex(128,128,g=>{g.fillStyle='#d8bb75';g.fillRect(0,0,128,128);for(let k=0;k<24;k++){g.beginPath();g.moveTo(64,64);g.arc(64,64,58,k/24*TAU,(k+1)/24*TAU);g.closePath();g.fillStyle=k%2?'#b14c60':'#27384a';g.fill();}g.fillStyle='#d8bb75';g.beginPath();g.arc(64,64,21,0,TAU);g.fill();});
      const wheel=new THREE.Mesh(new THREE.CircleGeometry(.95,32),new THREE.MeshLambertMaterial({map:wheelTex}));wheel.rotation.x=-Math.PI/2;wheel.position.set(U(-8),.85,V(-6.3));scene.add(wheel);addPropCull(wheel,U(-8),.85,V(-6.3),1.2,.6);
      for(const u of [-5,0,5]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.8,.035,5,24),new THREE.MeshLambertMaterial({color:0xd8bb75}));ring.rotation.x=Math.PI/2;ring.position.set(U(u),base-1.15,V(0));scene.add(ring);addPropCull(ring,U(u),base-1.15,V(0),1.0,.6);for(let k=0;k<6;k++){const a=k/6*TAU;lampBox(U(u)+Math.cos(a)*.7,base-1.05,V(Math.sin(a)*.7),.18,.18,'#ffe8ba');}box(U(u),base-.55,V(0),.04,1.1,.04,'#bfa259');}
      for(const [u,v]of [[-hu+1,-hv+1],[-hu+1,hv-1],[hu-1,hv-1]])plant(u,v,1.45);
    }else if(kind==='cafe'){

      // piso de tablones, alfombra y mostrador con taburetes
      for(let v=-hv;v<hv;v+=.55)floorFlat(iw-.2,.5,(Math.round((v+hv)/.55)%2)?'#c79a64':'#bd8f5a',0,0,v+.27);
      floorFlat(4.2,5.2,'#a8564a',.003,-2.6,-.4);floorFlat(3.6,4.6,'#f1dcc4',.006,-2.6,-.4);
      box(U(3.9),.55,V(-.4),.9,1.1,7,'#6b4630');box(U(3.9),1.13,V(-.4),1.05,.1,7.1,'#e9d9b8');solid(U(3.9),V(-.4),.9,7,1.15);
      box(U(3.9),.6,V(3.5),.9,1.2,1.2,'#6b4630');solid(U(3.9),V(3.5),.9,1.2,1.2);
      for(let v=-3.2;v<3;v+=1.1){box(U(2.85),.58,V(v),.42,.07,.42,'#c9382c');box(U(2.85),.28,V(v),.1,.56,.1,'#443');}
      box(U(4.4),1.65,V(-1.5),.5,1.6,5.2,'#5a3b2a');for(let yy=1.1;yy<2.4;yy+=.5)for(let v=-3.8;v<.9;v+=.38)box(U(4.28),yy,V(v),.22,.22,.22,['#e9e3d6','#c9382c','#3e8f8b','#e8b923'][Math.round((v+yy)*5)%4]);
      box(U(3.9),1.4,V(-3.1),.6,.5,.6,'#b6bcc0');box(U(3.9),1.7,V(-3.1),.45,.2,.45,'#c9382c');                   // máquina de café
      box(U(3.9),1.38,V(1.8),.7,.55,1.8,'#9fd6e6');box(U(3.9),1.12,V(1.8),.74,.07,1.84,'#d9c9a6');         // vitrina de pasteles
      for(let v=1.1;v<2.6;v+=.45)box(U(3.9),1.28,V(v),.3,.18,.3,['#e49aab','#f0bf7b','#b78bd6'][Math.round(v*3)%3]);
      for(const [u,v] of [[-3.5,-3.6],[-3.5,-1.2],[-3.5,1.2],[-3.5,3.6]]){table(u,v);chair(u+1,v,'x-');chair(u-1,v,'x+');box(U(u),.9,V(v),.18,.14,.18,'#f1f1f1');}
      for(const [u,v] of [[-1.0,-3.9],[-1.0,3.9]]){}
      for(const v of [-3.8,0,3.8]){box(U(-1.6),base-.9,V(v),.04,1.5,.04,'#333');box(U(-1.6),base-1.7,V(v),.55,.4,.55,'#f4b24a');}   // lámparas colgantes
      box(U(-4.2),.4,V(.1),.7,.8,2.8,'#7a8aa8');box(U(-4.5),.95,V(.1),.2,.8,2.8,'#7a8aa8');solid(U(-4.3),V(.1),.9,2.8,.9);
      plant(-4.2,-4.2,1.3);plant(-4.2,4.2,1.3);plant(1.2,-4.3);plant(1.2,4.3);
      tag('MENÚ · CAFÉ LUNA',4.55,2.5,-.4,-Math.PI/2,'#3e2a1f');poster(-4.55,-2.4,Math.PI/2,'#77b0c9');poster(-4.55,2.4,Math.PI/2,'#e49aab');
    }else if(kind==='arcade'){
      floorFlat(iw-.2,id-.2,'#202844');
      for(let v=-hv+.6;v<hv;v+=1.5){floorFlat(iw-.4,.07,'#e572b6',.004,0,v);}
      for(let u=-hu+.8;u<hu;u+=2.6)floorFlat(.07,id-.4,'#75d9cd',.004,u,0);
      floorFlat(2.4,2.4,'#e8b923',.006,-2.6,2.6);floorFlat(2.4,2.4,'#e572b6',.006,2.6,2.6);
      for(const sd of [-1,1])for(let v=-3.75;v<=3.8;v+=1.5){
        const cx=U(sd*4.05),cz=V(v),scr=[ '#e572b6','#75d9cd','#e8b923','#7a5cff','#58d68d'][Math.round(v*2+sd*3+10)%5];
        box(cx,.82,cz,.75,1.64,.95,'#384c78');solid(cx,cz,.75,.95,1.7);box(cx-sd*.2,1.24,cz,.34,.6,.78,scr);box(cx-sd*.4,.98,cz,.18,.14,.7,'#efbd57');box(cx,1.78,cz,.8,.18,1.0,'#2b3a5e');
        lampBox(cx-sd*.05,1.88,cz,.5,.7,scr);
      }
      box(U(-2.6),.55,V(-2.0),1.5,.2,2.9,'#6b4630');box(U(-2.6),.9,V(-2.0),1.2,.12,2.6,'#2f8f5a');for(const [pu,pv] of [[-.6,-1.2],[.6,-1.2],[-.6,1.2],[.6,1.2]])box(U(-2.6+pu),.3,V(-2+pv),.14,.6,.14,'#4c3f36');solid(U(-2.6),V(-2),1.5,2.9,1.0);
      box(U(-2.6),.96,V(-2.4),.2,.2,.2,'#fff');box(U(-2.6),.96,V(-1.9),.2,.2,.2,'#c9382c');
      box(U(2.6),.55,V(-2.0),1.3,1.0,2.5,'#2f6aa8');box(U(2.6),1.07,V(-2.0),1.15,.1,2.35,'#e8eef2');lampBox(U(2.6),1.14,V(-2),.8,1.8,'#9fe9ff');solid(U(2.6),V(-2),1.3,2.5,1.1);   // aerohockey
      for(const sd of [-1,1]){const cx=U(sd*2.6),cz=V(2.6);box(cx,1.2,cz,1.1,2.4,1.1,'#d94f9f');box(cx,1.55,cz,.9,1.2,.9,'#9fd6e6');solid(cx,cz,1.1,1.1,2.4);
        for(let k=0;k<7;k++)box(cx+((k%3)-1)*.25,1.0+(k>3?.3:0),cz+(((k*5)%3)-1)*.25,.2,.2,.2,['#e8b923','#58d68d','#7a5cff','#ff7a7a'][k%4]);lampBox(cx,2.5,cz,.9,.9,'#ffd1ec');}
      for(const [u,v,c] of [[-3.4,.2,'#e8b923'],[3.4,.4,'#58d68d'],[-3.2,-4.0,'#7a5cff'],[3.2,-4.2,'#e572b6']])box(U(u),.28,V(v),.9,.56,.9,c);
      for(const sd of [-1,1]){box(U(sd*(w/2-wall-.1)),base-.35,z,.1,.14,id-.4,sd<0?'#e572b6':'#75d9cd');box(U(sd*(w/2-wall-.1)),2.6,z,.1,.1,id-.4,sd<0?'#75d9cd':'#e572b6');}
      tag('ARCADE · INSERTA MONEDA',0,3.3,-hv-.05,0,'#6a2f6e');
    }else if(kind==='market'){
      floorFlat(iw-.2,id-.2,'#f1ece0');
      for(let u=-hu;u<hu;u+=1)for(let v=-hv;v<hv;v+=1)if((Math.round(u+hu)+Math.round(v+hv))%2===0)floorFlat(1,1,'#d9d2c1',.003,u+.5,v+.5);
      const cols=['#e04b4b','#f0b429','#4caf50','#4fc3f7','#b388ff','#ff8a65'];
      for(const sd of [-1,1]){
        const cx=U(sd*3.1);box(cx,.95,V(-.5),.9,1.9,5.6,'#eef0ee');solid(cx,V(-.5),.9,5.6,1.95);box(cx,1.95,V(-.5),.95,.08,5.65,'#3a8f74');
        for(let yy=.35;yy<1.8;yy+=.55)for(const f of [-1,1])for(let v=-3.1;v<2.1;v+=.34)box(cx+f*.3,yy,V(v),.26,.38,.28,cols[Math.abs(Math.round(v*3+yy*5+f*2))%6]);
      }
      for(const sd of [-1,1]){const rx=sd<0?-3:1.8;box(U(rx+1.2),1.15,V(-hv+.4),2.6,2.3,.7,'#d7ecf3');solid(U(rx+1.2),V(-hv+.4),2.6,.7,2.3);for(let yy=.4;yy<2;yy+=.5)for(let u=0;u<2.3;u+=.32)box(U(rx+.1+u),yy,V(-hv+.7),.24,.34,.1,cols[Math.round(u*4+yy*3)%6]);lampBox(U(rx+1.2),2.35,V(-hv+.4),2.4,.5,'#d9f6ff');}
      for(const sd of [-1,1]){const cx=U(sd*3.4),cz=V(3.6);box(cx,.5,cz,2.4,1.0,.9,'#4d5c66');box(cx,1.03,cz,2.5,.08,.95,'#d8dfe3');box(cx+sd*.6,1.25,cz,.5,.4,.4,'#2d3a42');solid(cx,cz,2.4,.9,1.1);box(cx-sd*.2,1.1,cz,1.2,.06,.6,'#222');}
      for(const [u,v] of [[-4.3,3.0],[4.3,3.0]])for(let k=0;k<3;k++)box(U(u),.18+k*.2,V(v),.5,.18,.4,['#e04b4b','#4fc3f7','#f0b429'][k]);
      for(const [u,v,c] of [[-4.3,-2.2,'#e04b4b'],[-4.3,-.6,'#f0b429'],[4.3,-2.2,'#4caf50'],[4.3,-.6,'#ff8a65']]){box(U(u),.3,V(v),.8,.6,1.2,'#9a6b3d');for(let k=0;k<6;k++)box(U(u)+((k%3)-1)*.22,.68,V(v)+((k>2?1:-1))*.3,.2,.2,.2,c);solid(U(u),V(v),.8,1.2,.6);}
      for(const sd of [-1,1]){box(U(sd*(w/2-wall-.1)),2.4,V(1.5),.05,.5,2.2,'#e04b4b');}
      tag('MERCADO · FRESCO',0,3.4,hv+.05,Math.PI,'#2f7a5f');plant(-4.2,4.3,1.3);plant(4.2,4.3,1.3);
    }else if(kind==='library'){
      floorFlat(iw-.2,id-.2,'#7a5638');for(let v=-hv;v<hv;v+=.7)floorFlat(iw-.2,.04,'#6c4a30',.002,0,v+.35);
      floorFlat(3.4,6.0,'#8e3a3f',.003,-.4,3.3);floorFlat(2.8,5.4,'#c9a24a',.006,-.4,3.3);
      const bc=['#c9382c','#2f6aa8','#e8b923','#3a8f74','#7a4fb3','#e8e0cf','#d9783a'];
      for(const sd of [-1,1]){const cx=U(sd*3.85);box(cx,1.85,V(0),.6,3.7,id-.6,'#5a3b2a');solid(cx,V(0),.6,id-.6,3.7);
        for(let yy=.35;yy<3.5;yy+=.52)for(let v=-hv+.6;v<hv-.6;v+=.2)box(cx-sd*.2,yy,V(v),.2,.4,.14,bc[Math.abs(Math.round(v*5+yy*4+sd))%7]);}
      for(const sd of [-1,1]){const cx=U(sd*2.35);box(cx,1.1,V(-2.0),.6,2.2,4.4,'#6b4630');solid(cx,V(-2),.6,4.4,2.2);
        for(let yy=.35;yy<2.1;yy+=.52)for(const f of [-1,1])for(let v=-4;v<.2;v+=.2)box(cx+f*.2,yy,V(v),.16,.4,.14,bc[Math.abs(Math.round(v*5+yy*3+f*3))%7]);}
      for(const sd of [-1,1]){table(sd*2.6,3.2,'#9a7650',1.2);chair(sd*2.6-1,3.2,'x+','#8e3a3f');chair(sd*2.6+1,3.2,'x-','#8e3a3f');chair(sd*2.6,2.1,'z+','#8e3a3f');box(U(sd*2.6),1.0,V(3.2),.3,.3,.3,'#e8b923');lampBox(U(sd*2.6),1.18,V(3.2),.34,.1,'#fff3c4');}
      box(U(-3.4),.45,V(5.0),1.5,.9,.9,'#b0563f');box(U(-3.4),.95,V(5.3),1.5,.8,.2,'#b0563f');solid(U(-3.4),V(5),1.5,.9,.9);          // sillón
      box(U(3.2),.55,V(-5.0),2.6,1.1,.9,'#6b4630');box(U(3.2),1.13,V(-5),2.7,.08,1.0,'#d9c9a6');solid(U(3.2),V(-5),2.6,.9,1.1);box(U(3.2),1.4,V(-5),.5,.4,.4,'#2d3a42');   // mostrador
      box(U(-3.55),1.9,V(-2),.06,3.6,.06,'#bba37a');box(U(-3.4),.4,V(-2),.5,.06,.5,'#bba37a');                                         // escalera
      lampBox(U(0),base-.12,V(-4.6),2.5,.5,'#ffe9a8');
      box(U(0),2.4,V(-hv-.02),3.4,1.7,.05,'#f5f0e1');box(U(0),2.4,V(-hv+.03),3.0,1.4,.04,'#9fd6e6');tag('BIBLIOTECA',0,3.5,hv+.05,Math.PI,'#5a3b4a');
      plant(-4.2,-5.2,1.3);plant(4.2,5.3,1.3);
    }else if(kind==='ramen'){
      floorFlat(iw-.2,id-.2,'#a47c50');for(let v=-hv;v<hv;v+=.6)floorFlat(iw-.2,.04,'#97703f',.002,0,v+.3);
      floorFlat(1.0,id-.3,'#b73a2c',.004,0,0);
      box(U(-3.0),.12,V(-2.2),2.8,.24,5.6,'#d8c08c');                                                         // tatami elevado
      for(const v of [-3.7,-2.2,-.7]){box(U(-3.0),.52,V(v),1.2,.08,.9,'#5a3b2a');box(U(-3.0),.28,V(v),.16,.5,.16,'#3b2a22');solid(U(-3),V(v),1.2,.9,.55);box(U(-3.9),.31,V(v),.6,.12,.6,'#c9382c');box(U(-2.1),.31,V(v),.6,.12,.6,'#c9382c');for(const k of [-.25,.25])box(U(-3.0+k),.62,V(v),.3,.1,.3,'#f1ede0');}
      box(U(2.7),.6,V(-.5),.9,1.2,8.2,'#6b4630');box(U(2.7),1.24,V(-.5),1.0,.1,8.3,'#e9d9b8');solid(U(2.7),V(-.5),.9,8.2,1.25);
      for(let v=-4.1;v<3.2;v+=1.0){box(U(1.85),.6,V(v),.4,.06,.4,'#c9382c');box(U(1.85),.3,V(v),.1,.6,.1,'#333');box(U(2.7),1.34,V(v),.34,.14,.34,'#f1ede0');box(U(2.7),1.42,V(v),.3,.06,.3,'#e8b923');}
      box(U(4.2),1.0,V(-.5),.5,2.0,8.6,'#8f949a');solid(U(4.2),V(-.5),.5,8.6,2.0);for(const v of [-3.5,-.8,1.8]){box(U(3.9),1.2,V(v),.5,.5,.5,'#4b5560');box(U(3.9),1.55,V(v),.55,.1,.55,'#cfd5da');}
      for(const v of [-4.5,-1.5,1.5,4.5]){box(U(-1.5),base-.7,V(v),.04,.9,.04,'#333');box(U(-1.5),base-1.3,V(v),.5,.55,.5,'#e04a3a');lampBox(U(-1.5),base-1.3,V(v),.42,.45,'#ff9a6a');}
      for(const end of [-1,1])for(let u=-1.3;u<=1.3;u+=.26)box(U(u),2.55,V(end*(hv-.05)),.2,.7,.05,['#c9382c','#f1ede0','#2f4f8f'][Math.round(u*4+5)%3]);   // noren
      tag('RAMEN · ICHIBAN',-3.4,3.3,hv+.05,Math.PI,'#8a2b22');poster(-4.5,-2.2,Math.PI/2,'#c9382c',1.6,1.2,2.1);
    }else if(kind==='workshop'){
      floorFlat(iw-.2,id-.2,'#8b9095');for(let v=-hv+.5;v<hv;v+=1.4)floorFlat(iw-.5,.1,'#e8b923',.004,0,v);floorFlat(2.4,id-.4,'#7b8086',.004,0,0);
      for(const sd of [-1,1]){const cx=U(sd*2.9);
        box(cx,.5,V(-.3),1.9,.5,4.1,sd<0?'#c9382c':'#2f6aa8');box(cx,.95,V(-.3),1.55,.5,2.2,sd<0?'#c9382c':'#2f6aa8');box(cx,1.0,V(-.3),1.5,.28,1.9,'#9fd6e6');solid(cx,V(-.3),1.9,4.1,1.3);
        for(const [dx,dz] of [[-.85,-1.4],[.85,-1.4],[-.85,1.2],[.85,1.2]])box(cx+dx,.3,V(-.3+dz),.18,.6,.6,'#222');
        for(const dz of [-1.5,1.4]){box(cx+sd*1.2,.9,V(-.3+dz),.18,1.8,.18,'#e8b923');}box(cx+sd*1.2,1.8,V(-.3),.18,.14,3.0,'#e8b923');}
      for(const sd of [-1,1]){const cx=U(sd*(hu-.4));box(cx,.5,V(-1.5),.7,1.0,4,'#6b6f75');box(cx,1.04,V(-1.5),.8,.08,4.1,'#b9bec3');solid(cx,V(-1.5),.7,4,1.05);
        box(cx-sd*.25,1.8,V(-1.5),.08,1.3,3.8,'#7b6a4f');for(let v=-3.2;v<.2;v+=.4)box(cx-sd*.31,1.8+((Math.round(v*3))%2)*.3,V(v),.06,.5,.12,['#e8b923','#c9382c','#4fc3f7','#999'][Math.abs(Math.round(v*5))%4]);}
      for(let k=0;k<4;k++)box(U(-5.1),.2+k*.34,V(3.4),.9,.3,.9,'#222');for(const [u,v] of [[5.0,3.4],[5.0,2.5],[4.2,3.7]]){box(U(u),.55,V(v),.6,1.1,.6,'#2f6aa8');box(U(u),1.12,V(v),.62,.06,.62,'#223');solid(U(u),V(v),.6,.6,1.1);}
      box(U(-3.2),.4,V(3.5),1.2,.8,.8,'#c9382c');box(U(-3.2),.85,V(3.5),1.0,.1,.7,'#b0201a');
      for(const u of [-3,0,3])for(const v of [-2.8,2.8])lampBox(U(u),base-.14,V(v),1.6,.5,'#eaf6ff');
      tag('TALLER · REPARACIONES',0,3.4,hv+.05,Math.PI,'#3a4a2e');
    }else if(kind==='mall'){
      for(let u=-hu;u<hu;u+=1.6)for(let v=-hv;v<hv;v+=1.6)floorFlat(1.58,1.58,(Math.round(u/1.6+v/1.6)%2)?'#e9e5da':'#d6d2c6',.003,u+.8,v+.8);
      floorFlat(2.0,id-.4,'#c9a24a',.006,0,0);floorFlat(iw-.5,2.0,'#c9a24a',.006,0,0);
      box(U(0),.25,V(0),4.6,.5,4.6,'#7a8f9a');box(U(0),.52,V(0),4.1,.1,4.1,'#64c3d5');box(U(0),1.1,V(0),.7,1.2,.7,'#b4c8c9');box(U(0),1.78,V(0),1.5,.2,1.5,'#86bfc9');box(U(0),2.1,V(0),.35,.5,.35,'#b4c8c9');solid(U(0),V(0),4.6,4.6,1.5);   // fuente central
      for(const sd of [-1,1]){const cx=U(sd*(hu-.4));box(cx,1.6,V(0),.5,3.2,id-.4,'#cfd2d6');solid(cx,V(0),.5,id-.4,3.2);
        const colr=['#e49aab','#77beaa','#f0bf7b','#88b8dc','#b9a0db'];
        for(let k=0;k<5;k++){const v=-hv+1.4+k*2.2;box(cx-sd*.3,1.35,V(v),.06,2.3,1.8,'#9fd6e6');box(cx-sd*.3,3.0,V(v),.4,.5,2.0,colr[k]);box(cx-sd*.5,.35,V(v),.5,.7,1.5,'#f5f0e1');lampBox(cx-sd*.3,3.15,V(v),.3,1.6,'#fff7d6');}}
      for(const [u,v] of [[-4.2,-2.6],[4.2,-2.6],[-4.2,2.6],[4.2,2.6]]){box(U(u),.5,V(v),1.3,1.0,1.3,'#d39b3e');box(U(u),1.25,V(v),1.1,.5,1.1,'#c9382c');box(U(u),2.1,V(v),1.4,.12,1.4,'#fff0b1');solid(U(u),V(v),1.3,1.3,1.0);}
      for(const [u,v] of [[-2.7,-2.7],[2.7,2.7],[-2.7,2.7],[2.7,-2.7]]){box(U(u),.3,V(v),1.8,.5,.6,'#967852');box(U(u),.7,V(v+(v>0?.25:-.25)),1.8,.6,.1,'#967852');solid(U(u),V(v),1.8,.6,.7);}
      for(const [u,v] of [[-hu+1.2,-hv+1.2],[hu-1.2,-hv+1.2],[-hu+1.2,hv-1.2],[hu-1.2,hv-1.2]]){box(U(u),.5,V(v),.9,1.0,.9,'#8b6b4f');box(U(u),1.8,V(v),.18,1.9,.18,'#6b4a2f');for(let k=0;k<5;k++)box(U(u)+Math.cos(k*1.26)*.6,3.0-(k%2)*.3,V(v)+Math.sin(k*1.26)*.6,1.1,.16,.36,'#3f9a5a','leaves');solid(U(u),V(v),.9,.9,1.2);}
      for(let u=-hu+2;u<hu-1;u+=4)lampBox(U(u),base-.16,V(0),2.2,3.2,'#fffbe8');
      tag('CENTRO COMERCIAL AURORA',0,base-1.0,-hv-.05,0,'#3a5a7a');
    }else if(kind==='lobby'){
      for(let u=-hu;u<hu;u+=2)for(let v=-hv;v<hv;v+=2)floorFlat(1.98,1.98,(Math.round(u/2+v/2)%2)?'#2a2f3a':'#e9e6df',.003,u+1,v+1);
      floorFlat(.2,id-.4,'#c9a24a',.006,0,0);floorFlat(iw-.5,.2,'#c9a24a',.006,0,0);floorFlat(5.6,5.6,'#7a2f3a',.008,0,.6);floorFlat(5.0,5.0,'#c9a24a',.01,0,.6);floorFlat(4.6,4.6,'#7a2f3a',.012,0,.6);
      box(U(0),.55,V(-hv+1.3),7.0,1.1,1.1,'#2a2f3a');box(U(0),1.15,V(-hv+1.3),7.2,.12,1.3,'#e9e6df');box(U(0),1.55,V(-hv+1.0),6.4,.7,.1,'#c9a24a');solid(U(0),V(-hv+1.3),7.0,1.1,1.2);
      box(U(-2),1.25,V(-hv+1.2),.5,.35,.4,'#cfd5da');box(U(2),1.25,V(-hv+1.2),.5,.35,.4,'#cfd5da');
      for(const [u,v] of [[-hu+1.2,-hv+4],[hu-1.2,-hv+4],[-hu+1.2,hv-4],[hu-1.2,hv-4]]){box(U(u),base/2,V(v),1.1,base,1.1,'#f2efe8');box(U(u),.3,V(v),1.4,.6,1.4,'#c9a24a');box(U(u),base-.3,V(v),1.4,.6,1.4,'#c9a24a');solid(U(u),V(v),1.1,1.1,base);}
      for(const sd of [-1,1]){const cx=U(sd*4.6);box(cx,.45,V(2.6),1.0,.9,3.6,'#3b3f4a');box(cx+sd*.5,.95,V(2.6),.2,.8,3.6,'#3b3f4a');solid(cx,V(2.6),1.0,3.6,.9);box(U(sd*4.6),.35,V(-.6),.9,.4,.9,'#c9a24a');box(U(sd*4.6),.92,V(-.6),.9,.5,.9,'#8f949a');
        plant(sd*5.6,-1.8,1.5);plant(sd*5.6,hv-1.2,1.5);}
      for(let k=0;k<12;k++){const an=k/12*TAU;box(U(0)+Math.cos(an)*1.1,base-1.7+Math.sin(k*2)*.2,V(.6)+Math.sin(an)*1.1,.2,.6,.2,'#fff3c4');}box(U(0),base-.9,V(.6),.12,1.2,.12,'#c9a24a');box(U(0),base-1.4,V(.6),1.0,.16,1.0,'#fff0b1');
      for(const sd of [-1,1]){box(U(sd*2.4),2.0,V(-hv+.1),2.0,4.0,.12,'#8f949a');box(U(sd*2.4),2.0,V(-hv+.2),.06,4.0,.06,'#262a33');lampBox(U(sd*2.4),4.25,V(-hv+.12),1.8,.15,'#ff7a3a');}
      tag('AURORA TOWER',0,base-1.2,hv+.05,Math.PI,'#1b2330');tag('RECEPCIÓN',0,2.6,-hv+.3,0,'#7a5a24');tag('ASCENSOR ▲',3.5,4.5,-hv+.12,0,'#2a2f3a');
    }
  }
  function building(x,z,w,d,h,color,label,accent,acc){
    const face = z < 0 ? 1 : -1, front=z+face*d/2;
    const bm=CITY_PLAN.find(q=>q.x===x&&q.z===z&&q.model);
    if(bm&&acc){
      const wall=.4,DHm=3.0,door=acc.door||3.2,base=acc.base,n0=COL.length;
      CITY.buildings.push({x,z,w,d,h,label,accessible:true,base,model:bm.model});
      for(const side of [-1,1]){
        solid(x+side*(w/2-wall/2),z,wall,d,base);
        for(const end of [-1,1]){const closed=acc.kind==='casino'&&end===-face,span=closed?w/2:(w-door)/2,cx=closed?x+side*w/4:x+side*(door/2+span/2),cz=z+end*(d/2-wall/2);solid(cx,cz,span,wall,base);}
      }
      for(const end of [-1,1])solid(x,z+end*(d/2-wall/2),door,wall,base,DHm,true);
      solid(x,z,w,d,h+.22,base,true);
      for(let i=n0;i<COL.length;i++)COL[i].nocam=true;
      CITY.interiors.push({x,z,w,d,h:base,label});
      if(label)sign(label,x,3.775,front+face*.3,4.4,face>0?0:Math.PI,accent);
      return;
    }
    if(bm&&!acc){
      CITY.buildings.push({x,z,w,d,h,label,accessible:false,base:3.15,model:bm.model});solid(x,z,w,d,h+.22);COL[COL.length-1].nocam=true;
      const SG={tienda:[3.65,.22,2.0],gimnasio:[4.35,.2,4.4],museo:[4.17,.16,2.2]},sg=bm.model==='gimnasio'?SG.gimnasio:bm.model==='museo'?SG.museo:SG.tienda;
      if(label)sign(label,x,sg[0],front+face*sg[1],sg[2],face>0?0:Math.PI,accent);
      return;
    }
    const accessible=!!acc,base=acc?acc.base:3.15,wall=.32,door=acc&&acc.door||2.8,DH=2.9;
    CITY.buildings.push({x,z,w,d,h,label,accessible,base});
    if(!accessible){solid(x,z,w,d,h+.22);box(x,h/2,z,w,h,d,color);box(x,.22,z,w+.08,.44,d+.08,'#677681');}
    else{
      // Fachadas partidas: huecos reales delante y detrás, no una caja invisible en la puerta.
      for(const side of [-1,1]){
        box(x+side*(w/2-wall/2),base/2,z,wall,base,d,color);solid(x+side*(w/2-wall/2),z,wall,d,base);
        for(const end of [-1,1]){
          const closed=acc.kind==='casino'&&end===-face,span=closed?w/2:(w-door)/2,cx=closed?x+side*w/4:x+side*(door/2+span/2),cz=z+end*(d/2-wall/2);
          box(cx,base/2,cz,span,base,wall,color);solid(cx,cz,span,wall,base);
        }
      }
      for(const end of [-1,1]){box(x,(base+DH)/2,z+end*(d/2-wall/2),door,base-DH,wall,color);solid(x,z+end*(d/2-wall/2),door,wall,base,DH,true);}
      box(x,(base+h)/2,z,w,h-base,d,color);solid(x,z,w,d,h+.22,base,true);
      CITY.interiors.push({x,z,w,d,h:base,label});
      interior(acc.kind,x,z,w,d,base,face,accent,wall);
    }
    box(x,h-.28,z,w+.28,.26,d+.28,'#e6dfcc');box(x,h+.05,z,w+.3,.25,d+.3,accent);
    // Azotea con pretil bajo y equipo de aire; no se añaden colisiones invisibles sobre ella.
    for(const sx of [-1,1])box(x+sx*(w/2-.12),h+.32,z,.16,.42,d,accent);
    for(const sz of [-1,1])box(x,h+.32,z+sz*(d/2-.12),w,.42,.16,accent);
    box(x+w*.25,h+.42,z,.9,.55,.85,'#89969c');
    if(!accessible){box(x,1.15,front+face*.035,1.1,2.2,.08,'#263e50');box(x+.34,1.05,front+face*.09,.08,.13,.06,'#f7cc74');}
    for(let yy=1.6;yy<h-1;yy+=2.15) for(let xx=-w/2+1.05;xx<w/2-.5;xx+=1.65){
      if(yy<base-.4&&accessible&&Math.abs(xx)<door/2+.4)continue;
      if(yy<2.5&&Math.abs(xx)<.9)continue;
      box(x+xx,yy,front+face*.045,1.02,1.25,.09,'#e5e2d5');
      box(x+xx,yy+.02,front+face*.14,.82,1.02,.06,'#77b3c6');
      box(x+xx,yy,front+face*.22,.055,1.03,.045,'#e5e2d5');
      box(x+xx,yy-.68,front+face*.12,1.18,.12,.28,accent);
    }
    for(const side of [-1,1])for(let yy=1.7;yy<h-1;yy+=2.15)for(let zz=-d/2+1;zz<d/2-.4;zz+=1.8){
      box(x+side*(w/2+.05),yy,z+zz,.09,1.18,1.03,'#e3e2d7');
      box(x+side*(w/2+.135),yy,z+zz,.055,.95,.82,'#7fb5c5');
    }
    if(label){
      sign(label,x,DH+(acc?0.15:-0.15),front+face*.36,Math.min(w-.5,5),face>0?0:Math.PI,accent);
      box(x,DH-.63,front+face*.55,w-.35,.15,1.2,accent);
      for(let xx=-w/2+.3;xx<w/2-.2;xx+=.65)box(x+xx,DH-.72,front+face*.96,.32,.22,.25,'#f1e4bd');
    }
    // Molduras, bajantes, balcones y azoteas: siluetas con más profundidad, sin cerrar las calles.
    for(const side of [-1,1]){
      box(x+side*(w/2-.18),h/2,front+face*.08,.18,h,.16,'#dcd6c2');
      box(x+side*(w/2-.42),h/2,front+face*.17,.07,h,.09,'#657a80');
    }
    if(!accessible){box(x,2.1,front+face*.07,w,.13,.18,'#dcd6c2');box(x,.65,front+face*.085,w,.11,.14,'#899a9e');box(x,1.55,front+face*.095,.66,.75,.04,'#7fb5c5');box(x,1.45,front+face*.12,.05,1.1,.04,'#dcd6c2');}
    for(let yy=3.35;yy<h-.8;yy+=2.15)box(x,yy,front+face*.04,w,.09,.13,'#c1bda9');
    if(CITY.buildings.length%3===1&&h>6){
      const yy=3.35,bx=x+w*.2;
      box(bx,yy,front+face*.5,2.3,.14,1.05,'#697c85');
      box(bx,yy+.82,front+face*.98,2.3,.07,.07,'#435766');
      for(const dx of [-1.05,-.52,0,.52,1.05])box(bx+dx,yy+.42,front+face*.98,.045,.8,.045,'#435766');
      for(const dx of [-.85,.85]){
        box(bx+dx,yy+.22,front+face*.8,.5,.35,.3,'#a36d58');
        box(bx+dx,yy+.47,front+face*.8,.6,.23,.4,'#6e9d65','leaves');
      }
    }
    const acx=x-w/2-.23,acz=z+d*.2;
    box(acx,2.9,acz,.4,.85,1.05,'#a4afb1');
    for(let yy=2.6;yy<3.25;yy+=.14)box(acx-.22,yy,acz,.02,.035,.85,'#586e7a');
    box(x-w*.28,h+.65,z+d*.2,.65,1,.65,'#a0a8a5');
    box(x-w*.28,h+1.2,z+d*.2,.85,.13,.85,'#5c707b');
    if(CITY.buildings.length%2===0){
      box(x+w*.22,h+1.25,z-d*.15,.06,2.5,.06,'#52636f');
      box(x+w*.22,h+1.8,z-d*.15,1.4,.04,.04,'#52636f');
    }
  }
  for(const b of CITY_PLAN)building(b.x,b.z,b.w,b.d,b.h,b.color,b.label,b.accent,b.acc);

  // Cargador de modelos de Blockbench (.bbmodel, formato libre): cubos con UV por cara, grupos anidados con rotación. 1 bloque (16 px) = 1 metro.
  const BB_FACES={
    south:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]], north:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],
    east:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]], west:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],
    up:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]], down:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
  };
  function bbGeometry(data, textures){
    const RW=data.resolution.width,RH=data.resolution.height,pos=[],uvs=[],idx=[],cubes=[],els=new Map(data.elements.map(e=>[e.uuid,e]));
    const groups=[], materials=[], slots=new Map();
    const T=(o)=>new THREE.Matrix4().makeTranslation(o[0],o[1],o[2]),R=(r)=>new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(r[0]*Math.PI/180,r[1]*Math.PI/180,r[2]*Math.PI/180,'ZYX'));
    const xf=(node)=>{const o=node.origin||[0,0,0],r=node.rotation||[0,0,0];return T(o).multiply(R(r)).multiply(T([-o[0],-o[1],-o[2]]));};
    const v=new V3();
    const emit=(el,mat)=>{
      if(el.type&&el.type!=='cube')return;
      const m=mat.clone();if(el.rotation)m.multiply(xf(el));
      const f=el.from,t=el.to,i0=idx.length,fcs=[];let mnx=1e9,mny=1e9,mnz=1e9,mxx=-1e9,mxy=-1e9,mxz=-1e9,uvr=null;
      for(const cx of [f[0],t[0]])for(const cy of [f[1],t[1]])for(const cz of [f[2],t[2]]){v.set(cx,cy,cz).applyMatrix4(m).multiplyScalar(1/16);mnx=Math.min(mnx,v.x);mny=Math.min(mny,v.y);mnz=Math.min(mnz,v.z);mxx=Math.max(mxx,v.x);mxy=Math.max(mxy,v.y);mxz=Math.max(mxz,v.z);}
      for(const [name,face] of Object.entries(el.faces||{})){
        if(!face.uv||face.texture==null||!BB_FACES[name])continue;
        const texId=CF_TEXTURES.textureIndex(data.textures,face.texture), tex=textures[texId];
        if(!tex)continue;
        const [w,h]=CF_TEXTURES.uvSize(data,tex.spec);
        const alpha=CF_TEXTURES.mode(tex.map.image,tex.spec,face.uv,w,h), slot=texId+':'+alpha;
        if(!slots.has(slot)){slots.set(slot,materials.length);materials.push(tex.material(alpha));}
        const mi=slots.get(slot), group=groups[groups.length-1];
        if(group?.materialIndex===mi)group.count+=6;else groups.push({start:idx.length,count:6,materialIndex:mi});
        const base=pos.length/3,[u1,v1,u2,v2]=face.uv,uv4=[[u1,v2],[u2,v2],[u2,v1],[u1,v1]];
        BB_FACES[name].forEach((c,i)=>{
          v.set(c[0]?t[0]:f[0],c[1]?t[1]:f[1],c[2]?t[2]:f[2]).applyMatrix4(m).multiplyScalar(1/16);
          const [u,vt]=uv4[i];
          pos.push(v.x,v.y,v.z);uvs.push(u/w,1-vt/h);
        });
        idx.push(base,base+1,base+2,base,base+2,base+3);if(!uvr)uvr=[u1,v1,u2,v2];fcs.push([name,u1,v1,u2,v2,mi,w,h]);
      }
      if(idx.length>i0)cubes.push({a:[mnx,mny,mnz,mxx,mxy,mxz],i0,n:idx.length-i0,uv:uvr,fc:fcs});
    };
    const cols=[],isCol=n=>/^(colisi|collision|hitbox)/i.test(n.name||'');   // grupo de colisiones del modelo: colision, colisiones, collision, hitbox
    // Blockbench reciente guarda el nombre, el origen y la rotación de cada grupo en la lista "groups" y el outliner solo trae su uuid: se juntan los dos
    const GR=new Map((data.groups||[]).filter(g=>g&&typeof g==='object'&&g.uuid).map(g=>[g.uuid,g]));
    const gm=n=>{const g=GR.get(n.uuid);return g?Object.assign({},g,n,{name:n.name||g.name,origin:n.origin||g.origin,rotation:n.rotation||g.rotation}):n;};
    const walk=(nodes,mat,col)=>{for(const n0 of nodes){
      const n=typeof n0==='string'?n0:gm(n0);
      if(typeof n==='string'){const e=els.get(n);if(!e){const g=GR.get(n);if(g&&g.children)walk(g.children,mat.clone().multiply(xf(g)),col||isCol(g));continue;}if(col){if(e.from&&e.to){   // la caja de colisión sigue la posición y rotación de sus grupos (y la suya)
        const m=mat.clone();if(e.rotation)m.multiply(xf(e));const a=[1e9,1e9,1e9],b=[-1e9,-1e9,-1e9];
        for(const cx of [e.from[0],e.to[0]])for(const cy of [e.from[1],e.to[1]])for(const cz of [e.from[2],e.to[2]]){v.set(cx,cy,cz).applyMatrix4(m).multiplyScalar(1/16);a[0]=Math.min(a[0],v.x);a[1]=Math.min(a[1],v.y);a[2]=Math.min(a[2],v.z);b[0]=Math.max(b[0],v.x);b[1]=Math.max(b[1],v.y);b[2]=Math.max(b[2],v.z);}
        cols.push([a[0],a[1],a[2],b[0],b[1],b[2]]);}}else emit(e,mat);}
      else walk(n.children||[],mat.clone().multiply(xf(n)),col||isCol(n));
    }};
    walk(data.outliner||[],new THREE.Matrix4(),false);
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    g.setIndex(idx);g.computeVertexNormals();g.userData.cols=cols;g.userData.cubes=cubes;g.userData.RW=RW;g.userData.RH=RH;
    if(materials.length>1)g.groups=groups;
    return {geo:g,mat:materials.length===1?materials[0]:materials};
  }
  const bbCache=new Map(),bbMats=new Map();
  const bbSource=(spec,i)=>spec?.source||(spec?.atlas&&window.BB_ATLASES?.[spec.atlas])||(i===0?window.BB_ATLAS:null);
  function bbMaterial(src,spec,emSrc,atlas){
    if(!bbMats.has(src))bbMats.set(src,new Map());
    const cache=bbMats.get(src),key=JSON.stringify([spec.cf_quality,spec.cf_anisotropy,emSrc,atlas]);
    if(!cache.has(key))cache.set(key,Promise.all([CF_TEXTURES.load(src),emSrc?CF_TEXTURES.load(emSrc).catch(()=>null):null]).then(([img,emImg])=>{
      const map=CF_TEXTURES.configure(new THREE.Texture(img),spec,renderer.capabilities,'nitida');
      let emission=null;
      if(emImg||(atlas&&img.height>img.width*2.5)){
        const cv=document.createElement('canvas');cv.width=img.width;cv.height=img.height;const ctx=cv.getContext('2d');
        ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);
        if(emImg)ctx.drawImage(emImg,0,0,cv.width,cv.height);
        else {const ey=img.width/8*20;ctx.drawImage(img,0,ey,img.width,img.height-ey,0,ey,img.width,img.height-ey);}
        emission=CF_TEXTURES.configure(new THREE.CanvasTexture(cv),spec,renderer.capabilities,'nitida');
      }
      const variants=new Map();
      return {map, material(alpha){
        if(!variants.has(alpha)){const m=cityAnimeMaterial(new THREE.MeshToonMaterial({map,gradientMap:CITY_GRAD,emissive:emission?0xffffff:0,emissiveMap:emission,...CF_TEXTURES.alphaOptions(alpha)}),{cut:true});if(emission)CITY.bbEmissiveMaterials.push(m);variants.set(alpha,m);}
        return variants.get(alpha);
      }};
    }));
    return cache.get(key);
  }
  async function bbTexturedGeometry(data){
    const used=new Set();
    for(const e of data.elements)for(const f of Object.values(e.faces||{}))if(f.texture!=null)used.add(CF_TEXTURES.textureIndex(data.textures,f.texture));
    const textures=await Promise.all(data.textures.map(async (spec,i)=>{
      const src=used.has(i)&&bbSource(spec,i);
      if(!src)return null;
      const emSrc=i===0&&!used.has(1)?bbSource(data.textures[1],1):null;
      const shared=await bbMaterial(src,spec,emSrc,i===0);
      return {...shared,spec};
    }));
    return bbGeometry(data,textures);
  }
  function loadBBModel(name){
    // Con servidor se lee el .bbmodel directo (los cambios hechos en Blockbench se ven al recargar); sin servidor (file://) se usa la copia ciudad/<nombre>.js
    const script=src=>new Promise((ok,fail)=>{const t=document.createElement('script');t.src=src;t.onload=ok;t.onerror=fail;document.head.appendChild(t);});
    const viaScript=()=>Promise.all([window.BB_ATLAS?0:script('ciudad/atlas.js'),window.BB_MODELS?.[name]?0:script('ciudad/'+name+'.js')]).then(()=>window.BB_MODELS[name]);
    // En tu equipo (servidor local) se lee el .bbmodel directo para ver al recargar lo que cambies en Blockbench; en internet se usan las copias .js (mucho más ligeras)
    const dev=/^(localhost|127\.|192\.168\.|10\.|\[::1\])/.test(location.hostname);
    if(!bbCache.has(name))bbCache.set(name,(dev?fetch('ciudad/'+name+'.bbmodel',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.json();}):Promise.reject()).catch(viaScript)
      .then(bbTexturedGeometry));
    return bbCache.get(name);
  }
  // Los modelos entran al cargarse; si faltan (por ejemplo al abrir el archivo sin servidor) queda una caja de color.
  flat(78,-30,31,27,'#899b9b',.014);flat(78,-15,29,7,'#687c87',.016);flat(70,-7,5,18,'#586d7b',.019);
  const bbLoads=[];
  const bbLodEntries=[];
  for(const b of CITY_PLAN)if(b.model){
    const face=b.z<0?1:-1;
    bbLoads.push(loadBBModel(b.model).then(({geo,mat})=>{
      const mesh=new THREE.Mesh(geo,mat);mesh.position.set(b.x,0,b.z);mesh.rotation.y=face>0?0:Math.PI;mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.model=b.model;mesh.userData.isBuilding=true;mesh.updateMatrix();mesh.matrixAutoUpdate=false;scene.add(mesh);(window.BBM||(window.BBM=[])).push(mesh);bbRegister(mesh,geo);
      if(!b.accessible){
        const lodIdx=bbLodEntries.length;
        const entry={mesh,x:b.x,y:(b.h||6)*0.5,z:b.z,w:b.w||8,h:b.h||6,d:b.d||8,color:b.color||'#b9b19c',lod:false};
        bbLodEntries.push(entry);
        mesh.userData.lodIdx=lodIdx;
        mesh.userData.lodEntry=entry;
      }
      const itB = MAP_ITEMS.find(q => q.plan === b || (q.kind === 'b' && Math.abs(q.x - b.x) < 0.2 && Math.abs(q.z - b.z) < 0.2));
      if (itB) { itB.mesh = mesh; mesh.userData.mapItem = itB; }
      for(const [x0,y0,z0,x1,y1,z1] of geo.userData.cols||[]){const lx=(x0+x1)/2,lz=(z0+z1)/2;COL.push({x:b.x+face*lx,z:b.z+face*lz,hx:(x1-x0)/2,hz:(z1-z0)/2,h:y1,y0:y0<.05?0:y0,ceiling:false,nocam:true});}
    }).catch(()=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.w,b.h,b.d),new THREE.MeshLambertMaterial({color:b.color}));mesh.position.set(b.x,b.h/2,b.z);scene.add(mesh);addPropCull(mesh,b.x,b.h/2,b.z,Math.hypot(b.w,b.h,b.d)*.5+1,1.1);
    }));
  }
  Promise.all(bbLoads).then(()=>{
    if(bbLodEntries.length>0&&!CITY.bldgLod){
      const lodGeo=new THREE.BoxGeometry(1,1,1);
      const lodMat=cityAnimeMaterial(new THREE.MeshLambertMaterial({color:0xffffff}));
      const lodIm=new THREE.InstancedMesh(lodGeo,lodMat,bbLodEntries.length);
      lodIm.castShadow=false;lodIm.receiveShadow=true;lodIm.frustumCulled=false;
      const m4=new THREE.Matrix4(),q0=new THREE.Quaternion(),ps=new V3(),sc=new V3(0,0,0),col=new THREE.Color();
      for(let i=0;i<bbLodEntries.length;i++){
        const e=bbLodEntries[i];
        ps.set(e.x,e.y,e.z);m4.compose(ps,q0,sc);lodIm.setMatrixAt(i,m4);
        lodIm.setColorAt(i,col.set(e.color));
      }
      lodIm.instanceMatrix.needsUpdate=true;
      if(lodIm.instanceColor)lodIm.instanceColor.needsUpdate=true;
      scene.add(lodIm);
      CITY.bldgLod={mesh:lodIm,entries:bbLodEntries,m4,q0,ps,sc};
    }
    CITY.modelsReady=true;colMarkDirty();if(typeof CULL!=='undefined')CULL.dirty=true;if(typeof rebuildCityNav==='function')rebuildCityNav();
  });
  // Torre Aurora: el edificio más alto, con ascensor en el vestíbulo que lleva a la azotea y un pararrayos
  {
    const T=CITY_PLAN.find(b=>b.label==='TORRE AURORA'),face=T.z<0?1:-1,rx=T.x,rz=T.z;
    const gx=rx,gz=rz-face*(T.d/2-1.35),qx=rx,qz=rz-face*(T.d/2-2.6),roofY=T.h+.25;
    const doorMat=new THREE.MeshLambertMaterial({color:0xb6bfc4,emissive:0x1b2024});
    const mkStation=(px,pz,dz,y0)=>{
      const st={px,pz,dx:px,dz,y0,open:0,target:0,panels:[],col:{x:px,z:dz,hx:1.4,hz:.15,h:y0+3.3,y0:y0||0,ceiling:false,nocam:true}};
      for(const sg of [-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(1.4,3.3,.12),doorMat);m.position.set(px+sg*.7,y0+1.65,dz);m.castShadow=true;scene.add(m);st.panels.push(m);addPropCull(m,px+sg*.7,y0+1.65,dz,2.4,.75,true);}
      COL.push(st.col);return st;
    };
    ELEVATORS.push({x:gx,z:gz,roofY,arrUp:{x:qx,z:qz},downX:qx,downZ:qz,arrDown:{x:gx,z:gz},ride:null,
      st:[mkStation(gx,gz,rz-face*(T.d/2-3.2),0),mkStation(qx,qz,rz-face*(T.d/2-4.3),roofY)]});
    sign('▲ AZOTEA',rx,4.6,rz-face*3.6,2.2,face>0?0:Math.PI,'#1b2330');
    flat(rx,rz-face*(T.d/2-1.35),2.2,2.2,'#7ad7ff',.058);flat(rx,rz-face*(T.d/2-1.35),1.6,1.6,'#e9fbff',.07);        // plataforma del ascensor (planta baja)
    box(rx,T.h+.38,rz-face*(T.d/2-2.6),2.2,.14,2.2,'#7ad7ff');box(rx,T.h+.47,rz-face*(T.d/2-2.6),1.6,.06,1.6,'#e9fbff');// plataforma de bajada (azotea)
    sign('▼ BAJAR',rx,T.h+3.33,rz-face*(T.d/2-4.5),1.6,face>0?0:Math.PI,'#1b2330');   // la caseta de la azotea queda justo encima de la cabina del vestíbulo: el ascensor sube en vertical
  }
  // Reloj de la estación, una referencia visible para orientarse.
  box(-13,7.5,-29,2.2,2.4,2.2,'#deca8b');solid(-13,-29,2.2,2.2,8.7);
  box(-13,8.8,-29,2.65,.3,2.65,'#577d7d');
  const dial=pixTex(64,64,g=>{g.fillStyle='#eee9d8';g.fillRect(0,0,64,64);g.strokeStyle='#344e60';g.lineWidth=4;g.strokeRect(2,2,60,60);g.translate(32,32);for(let i=0;i<12;i++){g.rotate(TAU/12);g.fillStyle='#344e60';g.fillRect(-1,-26,2,5);}g.fillRect(-2,-19,4,21);g.fillRect(0,-2,16,4);});
  const clock=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.7),new THREE.MeshLambertMaterial({map:dial}));clock.position.set(-13,7.5,-27.88);scene.add(clock);addPropCull(clock,-13,7.5,-27.88,1.5,.75);
  function tree(x,z){
    if(CITY_PLAN.some(b=>Math.abs(x-b.x)<b.w/2+1&&Math.abs(z-b.z)<b.d/2+1))return;
    box(x,1.15,z,.5,2.3,.5,'#81654a','log');solid(x,z,.5,.5,2.4);
    box(x,3,z,2.7,1.7,2.7,'#5a9766','leaves');box(x+.22,4,z-.14,2,1.1,2,'#69a66d','leaves');
  }
  function planter(x,z,w=2,d=2){
    box(x,.3,z,w,.6,d,'#849391');box(x,.62,z,w-.22,.08,d-.22,'#5a7552');solid(x,z,w,d,.65);
    box(x,.9,z,w-.35,.55,d-.35,'#75a36a','leaves');
  }
  for(const [x,z] of [[-29,-25],[29,25],[-25,29],[25,-29]]){
    CITY.parks.push({x,z,w:7,d:6});flat(x,z,7,6,'#80a574',.03);tree(x,z);
    for(const s of [-1,1])box(x+s*3.5,.12,z,.16,.24,6,'#d4ceb6');
  }
  // Pequeña fuente en una esquina de la plaza, dejando el centro libre.
  const FX=7.2,FZ=7.2;CITY.fountain={x:FX,z:FZ};   // antes en (-6,-6): quedaba dentro de la esquina del café
  box(FX,.22,FZ,2.8,.44,2.8,'#859eaa');box(FX,.46,FZ,2.45,.1,2.45,'#64c3d5');
  box(FX,.8,FZ,.6,1,.6,'#b4c8c9');box(FX,1.25,FZ,1.25,.18,1.25,'#86bfc9');solid(FX,FZ,2.8,2.8,1.34);
  for(const [x,z] of [[-3.2,-2],[3.2,2],[19.8,7]])planter(x,z,1.6,1.6);
  function bench(x,z,turn=false){
    const w=turn?.65:2.4,d=turn?2.4:.65;
    box(x,.52,z,w,.14,d,'#967852','plank');box(x,.25,z,w*.8,.5,d*.65,'#52616b');
    box(x+(turn?.32:0),.95,z+(turn?0:.32),turn?.12:2.4,.65,turn?2.4:.12,'#967852','plank');solid(x,z,w,d,1.2);
  }
  bench(8.6,4.9);bench(-8,2,true);bench(-19,16,true);bench(19,-16,true);
  for(const [x,z] of [[-5,-18],[5,18],[-18,4.2],[18,-4.2],[-5,30],[5,-30],[-30,-3.4],[30,3.4]]){   // las del eje este-oeste van al borde de la avenida: antes tocaban los toldos de los locales
    CITY.lamps.push({x,z});
    box(x,1.9,z,.16,3.8,.16,'#435766');box(x,3.85,z,.55,.16,.55,'#435766');
    box(x,3.62,z,.38,.34,.38,'#fff0b1');solid(x,z,.22,.22,4);
  }
  // Puntos de reaparición señalizados, al ras del suelo: no bloquean los combates.
  for(const p of SPAWN_POINTS){
    flat(p.x,p.z,2.5,2.5,'#527e85',.054);flat(p.x,p.z,2.12,2.12,'#91d4cd',.067);
    flat(p.x,p.z,1.78,1.78,'#527e85',.08);flat(p.x,p.z,.18,1.1,'#defff0',.094);flat(p.x,p.z,1.1,.18,'#defff0',.094);
  }
  // Borde bajo legible (no en el mar) y barrio de fondo lejano, fuera del área jugable. En el mundo ampliado (vista privada) no están: ahí hay biomas.
  BETA_ON=-1;
  for(let i=0;i<230;i++){
    const a=i/230*TAU,x=Math.cos(a)*(ARENA+2.4),z=Math.sin(a)*(ARENA+2.4);if(z>64)continue;
    box(x,.42,z,1.6,.84,1.6,'#96a8a6');if(i%8===0)box(x,.97,z,1.8,.26,1.8,'#d5d9c8');
  }
  for(let i=0;i<64;i++){
    const a=i/64*TAU,r=136+(i%4)*10,h=10+(i*7%30),x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.sin(a)>.3)continue;
    const tower={x,z,w:8,d:7,h,parts:[]};CITY.skyline.push(tower);
    const piece=(x,y,z,w,h,d,color)=>box(x,y,z,w,h,d,color,null,tower);
    piece(x,h/2,z,8,h,7,['#8ea6b6','#a5b5bf','#9aaeb5'][i%3]);piece(x,h+.12,z,8.4,.25,7.4,'#b5c4ca');
    for(let yy=2;yy<h-1;yy+=2.5)for(const xx of [-2.5,0,2.5])for(const side of [-1,1]){
      piece(x+xx,yy,z+side*3.52,1.15,1.25,.06,'#aac5d1');
      piece(x+side*4.02,yy,z+xx,.06,1.25,1.15,'#aac5d1');
    }
  }
  BETA_ON=false;
  const GARDEN={x:-90,z:28,r:14};
  const CLAROS=[[-116,-70,-27,44,'B'],[77,101,-12,14,'J'],[-15,15,-108,-77,'A'],[100,116,-3,5,'J']];   // [x0,x1,z0,z1] Barrio Sakura, Campamento y Lago: ahí el bosque solo lo ve el público
  // ===== Costa: paseo marítimo, playa, mar, bosque y adornos (todo determinista: igual para todos los jugadores) =====
  const rnd=(()=>{let q=20261031;return()=>(q=(q*1664525+1013904223)>>>0)/4294967296;})();
  flat(0,66,240,6,'#56616a');for(let x=-114;x<=114;x+=6)flat(x,66,2.4,.12,'#f6daa0',.04);
  flat(0,70.8,240,2.6,'#9aa6ab',.022);flat(0,62.9,240,1.8,'#9aa6ab',.022);
  flat(0,66.5,8,9,'#46515d',.02);
  flat(0,76,6,12,'#a98255',.03);for(let zz=70.6;zz<82;zz+=.8)flat(0,zz,6,.06,'#7e5c38',.032);
  for(let x=-96;x<=96;x+=16){
    if(Math.abs(x)<6||Math.abs(x-64)<4)continue;   // la farola de x=64 caía justo encima de la plataforma de entrada del vóley
    CITY.lamps.push({x,z:70.2});
    box(x,1.9,70.2,.16,3.8,.16,'#435766');box(x,3.85,70.2,.55,.16,.55,'#435766');box(x,3.62,70.2,.38,.34,.38,'#fff0b1');solid(x,70.2,.22,.22,4);
  }
  // arena, arena mojada, fondo marino y el mar con olas
  const sandTex=pixTex(32,32,g=>{noiseRect(g,0,0,32,32,'#d6bd84',9);g.fillStyle='rgba(180,150,90,.18)';for(let i=0;i<22;i++)g.fillRect((i*7)%32,(i*13)%32,2,1);});
  sandTex.wrapS=sandTex.wrapT=THREE.RepeatWrapping;
  const wetTex=pixTex(32,32,g=>{noiseRect(g,0,0,32,32,'#bfa271',8);});wetTex.wrapS=wetTex.wrapT=THREE.RepeatWrapping;
  const strip=(x0,x1,step,zN,zS,y,mat,uv,pub)=>{
    const pos=[],uvs=[],idx=[];let k=0;
    for(let x=x0;x<=x1;x+=step){pos.push(x,y,zN(x),x,y,zS(x));uvs.push(x/uv,zN(x)/uv,x/uv,zS(x)/uv);if(k>0){const q=(k-1)*2;idx.push(q,q+1,q+2,q+1,q+3,q+2);}k++;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,mat);m.receiveShadow=true;m.userData.mapAll=true;scene.add(m);if(pub)pubObjs.push(m);else addPropCull(m,(x0+x1)/2,y,83,(x1-x0)/2+8,1.35);return m;
  };
  {const sandM=cityAnimeMaterial(new THREE.MeshLambertMaterial({map:sandTex})),wetM=cityAnimeMaterial(new THREE.MeshLambertMaterial({map:wetTex}));
    // la playa llega a los lados del mundo; en las dos desembocaduras de los ríos (vista privada) la arena solo la ve el público
    for(const [a,b,pub] of [[-339,-183,0],[-183,-171,1],[-171,207,0],[207,219,1],[219,339,0]]){
      strip(a,b,3,()=>67.4,x=>SHORE(x),-.004,sandM,4,pub);strip(a,b,3,x=>SHORE(x)-3,x=>SHORE(x),-.003,wetM,4,pub);}}
  {
    const sea=new THREE.MeshPhongMaterial({color:0xffffff,shininess:70,specular:0x667b8e,transparent:true});
    sea.onBeforeCompile=sh=>{
      sh.uniforms.uTime=BEACH.sea.uTime; sh.uniforms.uSky=BEACH.sea.uSky; sh.uniforms.uSunV=BEACH.sea.uSunV; sh.uniforms.uSunC=BEACH.sea.uSunC; sh.uniforms.uSunK=BEACH.sea.uSunK;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <project_vertex>','#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform float uTime;uniform vec3 uSky,uSunV,uSunC;uniform float uSunK;')
        .replace('#include <color_fragment>',`#include <color_fragment>
          float shoreZ=96.+3.5*sin(vWP.x*.045)+2.*sin(vWP.x*.11+1.);float dd=vWP.z-shoreZ;
          float w1=sin(dd*.55-uTime*1.3+sin(vWP.x*.07)*1.5)*.5+.5,w2=sin(dd*1.3-uTime*2.1+vWP.x*.12)*.5+.5;
          vec3 wc=mix(vec3(.34,.86,.82),vec3(.13,.6,.8),smoothstep(0.,10.,dd));
          wc=mix(wc,vec3(.04,.28,.58),smoothstep(8.,48.,dd));
          wc=mix(wc,vec3(.004,.022,.072),smoothstep(30.,95.,dd));wc=mix(wc,vec3(.0015,.006,.02),smoothstep(95.,150.,dd));
          wc+=vec3(.09)*w1*(1.-smoothstep(0.,45.,dd))+vec3(.045)*w2*(1.-smoothstep(25.,110.,dd));
          float spk=fract(sin(dot(floor(vWP.xz*3.),vec2(12.9898,78.233)))*43758.5453);
          float f1=(1.-smoothstep(0.,1.2,abs(dd-(1.4+1.2*sin(uTime*.8+vWP.x*.08)))))*step(0.,dd);
          float f2=(1.-smoothstep(0.,.8,abs(dd-(4.2+1.4*sin(uTime*.6+vWP.x*.05+2.)))))*step(0.,dd)*.55;
          float foam=clamp(f1+f2,0.,1.)*(.55+.45*spk);
          vec3 seaN=normalize(vNormal);float glint=pow(max(0.,dot(reflect(-normalize(vViewPosition),seaN),uSunV)),50.);
          float sparkle=step(0.82,glint)*spk*uSunK;
          diffuseColor.rgb=mix(wc,vec3(1.),foam*.88)+uSunC*sparkle*1.2;
          diffuseColor.a=mix(.55,.995,smoothstep(0.,25.,dd));`)
        .replace('#include <fog_fragment>',`{
          vec3 vd=normalize(vViewPosition);
          vec3 seaNorm=normalize(vNormal);
          vec2 wg=vec2(cos(vWP.x*.9+uTime*1.7)*.9+cos((vWP.x+vWP.z)*.35-uTime*1.1)*.6,-sin(vWP.z*.8+uTime*1.3)*.8+cos((vWP.z-vWP.x)*.5+uTime*.9)*.5);
          seaNorm=normalize(seaNorm+(viewMatrix*vec4(wg.x,0.,wg.y,0.)).xyz*.1);
          float fr=pow(1.-clamp(dot(vd,seaNorm),0.,1.),3.);
          gl_FragColor.rgb=mix(gl_FragColor.rgb,uSky,fr*.55);
          vec3 rv=reflect(-vd,seaNorm);
          float gl=pow(max(dot(rv,uSunV),0.),90.);
          gl_FragColor.rgb+=uSunC*(gl*.9+pow(max(dot(rv,uSunV),0.),12.)*.12)*uSunK;
        }
        #include <fog_fragment>`);
    };
    sea.customProgramCacheKey=()=>'aurora-sea-v3';
    sea.side=THREE.DoubleSide;const water=new THREE.Mesh(new THREE.PlaneGeometry(1200,700),sea);water.frustumCulled=false;water.renderOrder=-4;water.rotation.x=-Math.PI/2;water.position.set(0,-.04,67+350);scene.add(water);BEACH.water=water;
  }
  // el mar ya se puede nadar: sin muro. La cubierta del muelle es suelo propio (sobre el agua)
  solid(0,112,7.5,68.7,.06);solid(0,140.9,15,10.2,.06);   // el muelle se agrandó (x1.6 de ancho, x1.7 de largo)
  // bosque alrededor de la ciudad
  for(let gx=-112;gx<=112;gx+=8)for(let gz=-112;gz<=60;gz+=8){
    const x=gx+(rnd()-.5)*6,z=gz+(rnd()-.5)*6,r=Math.hypot(x,z);
    if(r<70||r>ARENA-6||z>60||rnd()<.2)continue;
    if(SPAWN_POINTS.some(q=>Math.hypot(q.x-x,q.z-z)<4.5))continue;
    const claro=CLAROS.find(c=>x>c[0]&&x<c[1]&&z>c[2]&&z<c[3]);   // en los claros el árbol es "de la ciudad": se ve en el público y en el mapa Ciudad salvo en el claro propio (se piden los mismos números al azar)
    if(claro){BETA_ON=-1;PUBOWN=claro[4];}
    tree(x,z);
    if(rnd()<.4)box(x+1.6,.35,z+.8,1.1,.7,1.1,'#5f9a55','leaves');
    if(rnd()<.15)box(x-1.5,.3,z-1,1.2,.6,1,'#8c9195');
    BETA_ON=false;PUBOWN='A';
  }
  // adornos de la costa (modelos de Blockbench en ciudad/)
  const PR=[];
  const addP=(m,x,z,ry=0,o={})=>{
    if(SPAWN_POINTS.some(q=>Math.hypot(q.x-x,q.z-z)<3.4))return;
    const k='p:'+m+'@'+x.toFixed(1)+','+z.toFixed(1), it={key:k,kind:'p',model:m,label:'',ox:x,oz:z,ory:ry,x,z,ry,added:false};MAP_ITEMS.push(it);
    if(MAPED.del.includes(k)){it.del=true;return;}
    const e=MAPED.mv[k];if(e){x=it.x=e.x;z=it.z=e.z;ry=it.ry=e.ry;}
    PR.push(Object.assign({m,x,z,ry},o));};
  addP('muelle',0,78,0);
  // huellas de los adornos fijos [x, z, medio ancho, medio largo]: las palmeras no se plantan encima ni con la copa tapándolos
  const FOOT=[[-22,78.5,5.2,3.8],[25,79.5,5.2,3.8],[64,83,4.8,8.8],[64,70.6,2.4,2.4],[64,95.4,2.4,2.4],[0,112,8.6,36],[-46,88,2.4,3.8],[50,89,2.4,3.8],
    [-72,74.8,1.8,1.8],[-68.4,74.8,1.8,1.8],[-64.8,74.8,1.8,1.8],[-61.2,74.8,1.8,1.8],
    [-70,80,2.4,3.8],[-58,84,2.4,3.8],[-34,86,2.4,3.8],[-10,83,2.4,3.8],[12,87,2.4,3.8],[40,85,2.4,3.8],[50,79,2.4,3.8],[78,85,2.4,3.8],
    [-52,SHORE(-52)-6,1.4,1.4],[-12,SHORE(-12)-6,1.4,1.4],[34,SHORE(34)-6,1.4,1.4],[72,SHORE(72)-6,1.4,1.4]];
  const nearProp=(x,z,m)=>FOOT.some(([cx,cz,hw,hd])=>Math.abs(x-cx)<hw+m&&Math.abs(z-cz)<hd+m);
  for(let x=-96;x<=96;x+=10){const ry=rnd()*TAU;if(Math.abs(x)<7||nearProp(x,73.4,4.6))continue;addP('palmera',x,73.4,ry);}
  for(let i=0;i<16;i++){const x=-80+rnd()*160,z=77+rnd()*10,ry=rnd()*TAU;if(Math.abs(x)<9||z>SHORE(x)-8||nearProp(x,z,4.6))continue;addP('palmera',x,z,ry);}
  [[-70,80],[-58,84],[-34,86],[-10,83],[12,87],[40,85],[50,79],[78,85]].forEach(([x,z],i)=>addP(['sombrilla_roja','sombrilla_azul','sombrilla_amarilla','sombrilla_verde'][i%4],x,z,(rnd()-.5)*.6));
  addP('torre_salvavidas',-46,88,0);addP('torre_salvavidas',50,89,0);
  addP('chiringuito',-22,78.5,0);addP('chiringuito',25,79.5,0);
  addP('voley',64,83,0);
  [-52,-12,34,72].forEach(x=>addP('castillo',x,SHORE(x)-6,rnd()*TAU));   // el de x=76 chocaba con la sombrilla y las rocas
  [-72,-68.4,-64.8,-61.2].forEach((x,i)=>addP(i%2?'caseta_azul':'caseta_roja',x,74.8,0));
  addP('barca_roja',-34,SHORE(-34)+9,.4,{y:-.12,bob:1});addP('barca_azul',22,SHORE(22)+13,-.5,{y:-.12,bob:1});addP('velero',-17,SHORE(-17)+19,.2,{y:-.1,bob:1});addP('barca_roja',46,SHORE(46)+8,1.2,{y:-.12,bob:1});
  addP('rocas_a',-78,SHORE(-78)-2,.5);addP('rocas_b',73.5,SHORE(73.5)+1.6,2.1);addP('faro',86,SHORE(86)-5,0);
  for(const a of MAPED.add)if(a.kind==='p'&&a.model){MAP_ITEMS.push({key:a.id,kind:'p',model:a.model,label:'',ox:a.x,oz:a.z,ory:a.ry,x:a.x,z:a.z,ry:a.ry,added:true,from:a.from});PR.push({m:a.model,x:a.x,z:a.z,ry:a.ry});}
  const SMALL_BB_PROPS=new Set(['sombrilla_roja','sombrilla_azul','sombrilla_amarilla','sombrilla_verde','caseta_azul','caseta_roja','castillo','rocas_a','rocas_b']);
  for(const pr of PR)bbLoads.push(loadBBModel(pr.m).then(({geo,mat})=>{
    const pGeo = new THREE.BufferGeometry();
    pGeo.attributes = geo.attributes;
    pGeo.groups = geo.groups;
    if (geo.index) pGeo.setIndex(geo.index.clone());
    pGeo.boundingBox = geo.boundingBox;
    pGeo.boundingSphere = geo.boundingSphere;
    pGeo.userData = Object.assign({}, geo.userData);
    const isSmall=SMALL_BB_PROPS.has(pr.m);
    const mesh=new THREE.Mesh(pGeo,mat);mesh.position.set(pr.x,pr.y||0,pr.z);mesh.rotation.y=pr.ry;if(pr.m==='muelle')mesh.scale.set(1.6,1,1.7);mesh.castShadow=!isSmall;mesh.receiveShadow=true;
    mesh.userData.model = pr.m;
    mesh.userData.isProp = true;
    if(isSmall)mesh.userData.smallProp=true;
    mesh.updateMatrix();
    if(!pr.bob) mesh.matrixAutoUpdate=false;
    scene.add(mesh);
    (window.BBM||(window.BBM=[])).push(mesh);
    bbRegister(mesh,pGeo);
    const itP = MAP_ITEMS.find(q => q.kind === 'p' && q.model === pr.m && Math.abs(q.x - pr.x) < 0.2 && Math.abs(q.z - pr.z) < 0.2 && !q.mesh);
    if (itP) { itP.mesh = mesh; mesh.userData.mapItem = itP; }
    if(pr.bob)BEACH.boats.push({mesh,model:pr.m,y0:pr.y,ph:rnd()*6});
    const c=Math.cos(pr.ry),sn=Math.sin(pr.ry),SX=mesh.scale.x,SY=mesh.scale.y,SZ=mesh.scale.z;   // las colisiones siguen el tamaño con el que se dibuja el modelo (el muelle se agranda)
    for(const [x0,y0,z0,x1,y1,z1] of geo.userData.cols||[]){const lx=(x0+x1)/2*SX,lz=(z0+z1)/2*SZ,hx=(x1-x0)/2*SX,hz=(z1-z0)/2*SZ;
      COL.push({x:pr.x+lx*c+lz*sn,z:pr.z-lx*sn+lz*c,hx:Math.abs(c)*hx+Math.abs(sn)*hz,hz:Math.abs(sn)*hx+Math.abs(c)*hz,h:y1*SY,y0:y0<.05?0:y0*SY,ceiling:false,nocam:true,prop:mesh});}
  }).catch(()=>{}));
  Promise.all(bbLoads).then(()=>{colMarkDirty();if(typeof CULL!=='undefined')CULL.dirty=true;if(typeof rebuildCityNav==='function')rebuildCityNav();});
  // plataformas de entrada al minijuego de vóley playa (una por equipo)
  for(const t of ['N','S']){
    const z=83+(t==='N'?-12.4:12.4),sz=z+(t==='N'?-2.1:2.1);
    flat(64,z,3.4,3.4,'#1d5f7a',.05);flat(64,z,2.9,2.9,'#7ad7ff',.058);flat(64,z,2,2,'#1d5f7a',.066);flat(64,z,.16,1.5,'#ffffff',.074);flat(64,z,1.5,.16,'#ffffff',.074);
    box(62.3,1.5,sz,.14,3,.14,'#435766');box(65.7,1.5,sz,.14,3,.14,'#435766');
    sign(t==='N'?'VÓLEY PLAYA · NORTE':'VÓLEY PLAYA · SUR',64,2.75,sz,3.3,t==='N'?0:Math.PI,'#1d6f8a');
  }
  // gaviotas
  {
    const wm=new THREE.MeshLambertMaterial({color:0xf5f5f0}),tm=new THREE.MeshLambertMaterial({color:0x4a4f55}),bm=new THREE.MeshLambertMaterial({color:0xf0a830});
    for(let i=0;i<8;i++){
      const g=new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(.22,.2,.7),wm));const head=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.2),wm);head.position.set(0,.05,.42);g.add(head);
      const beak=new THREE.Mesh(new THREE.BoxGeometry(.05,.05,.14),bm);beak.position.set(0,.03,.58);g.add(beak);
      const mk=sg=>{const w=new THREE.Group();const a=new THREE.Mesh(new THREE.BoxGeometry(.8,.04,.3),wm);a.position.x=sg*.4;const tip=new THREE.Mesh(new THREE.BoxGeometry(.25,.045,.28),tm);tip.position.x=sg*.9;w.add(a,tip);w.position.set(sg*.1,.05,0);g.add(w);return w;};
      const wl=mk(-1),wr=mk(1);scene.add(g);
      BEACH.gulls.push({g,wl,wr,cx:-70+i*20,cz:98+(i%3)*8,r:9+rnd()*16,sp:.22+rnd()*.2,ph:rnd()*6,h:10+rnd()*9});
    }
  }
  // ===== Lugares con encanto (vista privada CF_BETA hasta su lanzamiento): jardín de cerezos, farolillos, gato de la suerte, arco del muelle =====
  BETA_ON=true;MAPTAG='B';
  {
    const bsign=(text,x,y,z,w,ry,color)=>{
      const texture=pixTex(256,64,g=>{g.fillStyle=color;g.fillRect(0,0,256,64);g.strokeStyle='#eae7cf';g.lineWidth=4;g.strokeRect(5,5,246,54);g.fillStyle='#fff8df';g.textAlign='center';g.textBaseline='middle';g.font='bold 26px sans-serif';g.fillText(text,128,34,232);});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshLambertMaterial({map:texture}));cityAnimeMaterial(mesh.material);mesh.material.emissiveMap=texture;CITY.signMaterials.push(mesh.material);
      mesh.position.set(x,y,z);mesh.rotation.y=ry;mesh.visible=false;mesh.userData.map=MAPTAG;scene.add(mesh);betaObjs.push(mesh);
    };
    let lq=77123;const lr=()=>(lq=(lq*1664525+1013904223)>>>0)/4294967296;   // azar propio: no toca el del resto del mapa
    // --- Jardín de los Cerezos (claro del bosque, al oeste)
    const JX=GARDEN.x,JZ=GARDEN.z;
    flat(JX,JZ,24,22,'#93c47d',.018);
    for(let i=0;i<7;i++)flat(JX+13.6+i*1.5,JZ+(i%2?.35:-.35),1,1,'#d9cdb0',.03);                       // piedras del sendero hacia la ciudad
    for(const sz of [-2.3,2.3]){box(JX+11.5,2.3,JZ+sz,.45,4.6,.45,'#c8473f');solid(JX+11.5,JZ+sz,.45,.45,4.6);}   // torii de la entrada
    box(JX+11.5,4.45,JZ,.5,.38,6.2,'#c8473f');box(JX+11.5,4.95,JZ,.7,.3,7.4,'#2a2f3a');box(JX+11.5,3.75,JZ,.34,.28,5.2,'#c8473f');
    flat(JX-1,JZ+1,10,7,'#3b86ad',.035);flat(JX-1,JZ+1,8.4,5.4,'#5fb8d6',.045);flat(JX-3,JZ-.2,1.6,.5,'#e8f7ff',.055);flat(JX+1.2,JZ+2.4,1.1,.4,'#e8f7ff',.055);   // estanque
    for(const [dx,dz] of [[-4.2,2.6],[2.2,-.8],[-2,3],[.6,2.9],[-3.6,-.9]]){flat(JX-1+dx,JZ+1+dz,.8,.8,'#4f9a5b',.06);if(lr()<.6)box(JX-1+dx,.12,JZ+1+dz,.22,.14,.22,'#f3a2cb');}   // nenúfares
    for(let i=0;i<14;i++){const a=i/14*TAU;box(JX-1+Math.cos(a)*5.4,.16,JZ+1+Math.sin(a)*3.9,.7+lr()*.5,.32,.6+lr()*.4,i%3?'#8c9195':'#a3a8ab');}   // piedras de la orilla
    [.25,.5,.7,.8,.7,.5,.25].forEach((h,i)=>{const x=JX-5.8+i*1.6,z=JZ+1;                          // puente rojo: se cruza caminando (escalones bajos)
      box(x,h-.06,z,1.6,.12,1.9,'#c8473f');solid(x,z,1.6,1.9,h);
      for(const sg of [-1,1]){box(x,h+.55,z+sg*.9,1.6,.09,.09,'#8f2f2a');if(i%2===0)box(x,h+.3,z+sg*.9,.12,.6,.12,'#8f2f2a');}});
    for(const [dx,dz] of [[-9,-7],[-10,4.5],[4,-8],[8,6.5],[-3,8.5],[9,-4.5]]){const x=JX+dx,z=JZ+dz;   // cerezos
      box(x,1.3,z,.5,2.6,.5,'#6b4a3a','log');solid(x,z,.5,.5,2.7);
      box(x,3.4,z,3.1,1.6,3.1,'#f7b6cf');box(x+.25,4.45,z-.15,2.1,1,2.1,'#fbd0e0');box(x-.9,2.75,z+.8,1.3,.7,1.3,'#f39dbd');
      for(let k=0;k<7;k++)flat(x+(lr()-.5)*5,z+(lr()-.5)*5,.16,.16,k%2?'#f7b6cf':'#fbd0e0',.05);}        // pétalos caídos
    for(const [dx,dz] of [[9,3.4],[-6.5,-4.6],[2.6,5.6]]){const x=JX+dx,z=JZ+dz;                          // farolillos de piedra (se encienden de noche)
      box(x,.4,z,.42,.8,.42,'#8c9195');box(x,1,z,.6,.42,.6,'#fff0b1');box(x,1.3,z,.82,.14,.82,'#6f777c');box(x,1.45,z,.3,.16,.3,'#6f777c');solid(x,z,.6,.6,1.5);}
    bench(JX+5.2,JZ-3.2);bench(JX-7.4,JZ+1,true);
    bsign('JARDÍN DE LOS CEREZOS',JX+11.85,3.05,JZ,3.6,Math.PI/2,'#7a2f3a');
    CITY.noGrass=[[-93.2,-82.8,-4.7,4.7],[-89.8,-86.2,-18,17.4],[-83,-58,-1.7,1.7],[-105.7,-96.3,8.3,15.7],[-96,-93,-2.4,.4],[-96.2,-85.8,23.3,32.7],[-93.7,-82.3,-25,-16],[-104,-95,-5.5,3.5],
      [81.3,96.7,-5.7,7.7],[61.8,81.4,-1.3,1.3],[-1.3,1.3,-85.2,-62.8],[-4.7,4.7,-90.8,-84.4],[-12.2,12.2,-104.7,-91.3]];
    // --- Barrio Sakura: el jardín crece hasta ser un barrio entero (plaza, pagoda, santuario, calle de casitas, túnel de torii, jardín zen, bambú)
    {
      const DX=-88,DZ=0,RED='#c8473f',TILE='#2a2f3a',WOOD='#5a3d2e',CREAM='#efe6d0',STONE='#8c9195',PAVE='#d9cdb0',PAVE2='#c9bd9c',GOLD='#e9c24a';
      const sakura=(x,z)=>{box(x,1.3,z,.5,2.6,.5,'#6b4a3a','log');solid(x,z,.5,.5,2.7);
        box(x,3.4,z,3.1,1.6,3.1,'#f7b6cf');box(x+.25,4.45,z-.15,2.1,1,2.1,'#fbd0e0');box(x-.9,2.75,z+.8,1.3,.7,1.3,'#f39dbd');
        for(let k=0;k<6;k++)flat(x+(lr()-.5)*5,z+(lr()-.5)*5,.16,.16,k%2?'#f7b6cf':'#fbd0e0',.05);};
      const toro=(x,z)=>{box(x,.4,z,.42,.8,.42,STONE);box(x,1,z,.6,.42,.6,'#fff0b1');box(x,1.3,z,.82,.14,.82,'#6f777c');box(x,1.45,z,.3,.16,.3,'#6f777c');solid(x,z,.6,.6,1.5);};
      const torii=(x,z,alongX,w,h,col)=>{   // alongX: se cruza caminando a lo largo de X
        for(const sg of [-1,1]){const px=alongX?x:x+sg*w/2,pz=alongX?z+sg*w/2:z;box(px,h/2,pz,.4,h,.4,col);solid(px,pz,.4,.4,h);box(px,.15,pz,.62,.3,.62,TILE);}
        box(x,h+.1,z,alongX?.45:w+1.6,.34,alongX?w+1.6:.45,col);box(x,h+.42,z,alongX?.62:w+2.4,.26,alongX?w+2.4:.62,TILE);box(x,h-.7,z,alongX?.3:w+.6,.24,alongX?w+.6:.3,col);};
      const casa=(x,z,w,d,f,noren)=>{   // f: hacia dónde mira la fachada (+1 = +Z)
        box(x,.15,z,w+.6,.3,d+.6,'#a3a8ab');box(x,1.75,z,w,2.9,d,CREAM);solid(x,z,w,d,4.6);
        for(const sx of [-1,1])for(const sz of [-1,1])box(x+sx*(w/2-.1),1.75,z+sz*(d/2-.1),.28,2.95,.28,WOOD);
        box(x,3.1,z,w+.1,.2,d+.1,WOOD);box(x,3.45,z,w+1.6,.3,d+1.6,TILE);box(x,3.85,z,w+.5,.5,d*.7,TILE);box(x,4.35,z,w+.2,.5,d*.36,TILE);box(x,4.68,z,w+.5,.16,.3,'#4a5563');
        const fz=z+f*(d/2+.03);
        box(x,1.1,fz,1.5,2.2,.06,'#3a2a22');box(x,1.95,fz+f*.05,1.7,.75,.05,noren);box(x,1.95,fz+f*.08,.5,.3,.03,'#fff8df');
        for(const sx of [-1,1]){const wx=x+sx*(w/2-1);box(wx,1.7,fz,1.1,1.1,.05,'#f6f0dc');for(let k=-1;k<=1;k++)box(wx+k*.28,1.7,fz+f*.03,.05,1.1,.04,WOOD);box(wx,1.7,fz+f*.03,1.1,.05,.04,WOOD);}
        box(x+w/2-.2,2.5,fz+f*.35,.36,.56,.36,'#e2504a');box(x+w/2-.2,2.84,fz+f*.35,.24,.08,.24,TILE);
      };
      // caminos y plaza (la plaza rodea el punto de aparición del oeste)
      flat(DX,DZ,10,9,PAVE,.02);flat(DX,DZ,8.6,7.6,PAVE2,.026);flat(DX,DZ,7.4,6.4,PAVE,.03);
      flat(DX,DZ-11,3.2,13,PAVE,.02);flat(DX,DZ+10.8,3,12.6,PAVE,.02);flat(-77.25,DZ,11.5,3,PAVE,.02);flat(-94.1,DZ-1,2.2,2.4,PAVE,.02);
      for(let i=0;i<8;i++)flat(-70.4+i*1.5,DZ+(i%2?.4:-.4),1.05,1.05,PAVE,.03);                                   // losas hacia la ciudad
      for(let zz=-17;zz<=-5;zz+=1.6)flat(DX,zz,3.2,.06,PAVE2,.026);for(let zz=5;zz<=17;zz+=1.6)flat(DX,zz,3,.06,PAVE2,.026);
      // gran torii de entrada y cartel
      torii(-71.4,DZ,true,6.2,6.4,RED);bsign('BARRIO SAKURA',-70.95,5.15,DZ,4.8,Math.PI/2,'#7a2f3a');
      sakura(-68.6,DZ-4.6);sakura(-68.6,DZ+4.6);toro(-70.2,DZ-2.6);toro(-70.2,DZ+2.6);
      // calle de casitas con farolillos colgados
      casa(-80,-5.6,5,4.6,1,'#2f5d8a');casa(-75,-5.6,4,4.6,1,'#7a2f3a');casa(-80,5.6,5,4.6,-1,'#3f7a4f');casa(-75,5.6,4,4.6,-1,'#b8902c');
      for(const lx of [-81.5,-77.5,-73.6]){box(lx,3.95,DZ,.05,.05,6.4,TILE);for(let i=-1;i<=1;i++){box(lx,3.6-(i===0?.14:0),DZ+i*1.7,.4,.5,.4,i?'#e2504a':'#fff0b1');box(lx,3.3-(i===0?.14:0),DZ+i*1.7,.18,.08,.18,GOLD);}}
      // túnel de torii entre la plaza y el jardín
      for(let i=0;i<6;i++)torii(DX,6.4+i*2,false,3.5,3.7,i%2?'#d9603f':RED);
      // santuario al fondo del camino norte
      {const sx=DX,sz=DZ-21;
        box(sx,.3,sz,11,.6,7.5,'#a3a8ab');solid(sx,sz,11,7.5,.6);box(sx,.15,sz+4.15,4,.3,.8,'#a3a8ab');solid(sx,sz+4.15,4,.8,.3);
        box(sx,2.3,sz-1,8,3.4,4,CREAM);solid(sx,sz-1,8,4,6.5);
        for(const k of [-3.9,-1.3,1.3,3.9]){box(sx+k,2.3,sz+2.4,.36,3.4,.36,RED);solid(sx+k,sz+2.4,.36,.36,4);}
        box(sx,4.15,sz+.2,10.6,.3,7.4,RED);box(sx,4.5,sz+.2,12,.34,8.6,TILE);box(sx,5,sz+.2,9.6,.6,6,TILE);box(sx,5.6,sz+.2,7.6,.6,3.4,TILE);box(sx,6.05,sz+.2,8.2,.2,.4,GOLD);
        box(sx,1.6,sz+1.03,2,2,.06,'#3a2a22');for(const k of [-2.6,2.6])box(sx+k,2.4,sz+1.03,1.4,1.2,.05,'#f6f0dc');
        box(sx,1,sz+2.2,1.5,.8,.8,WOOD);box(sx,1.42,sz+2.2,1.3,.06,.6,'#22272e');solid(sx,sz+2.2,1.5,.8,1.4);
        box(sx,3.1,sz+2.7,.1,1.7,.1,'#e9dfc0');box(sx,3.9,sz+2.7,.42,.42,.42,GOLD);
        for(const k of [-1,1]){box(sx+k*3.3,.5,sz+5.7,1,1,.8,STONE);box(sx+k*3.3,1.3,sz+5.6,.7,.7,.8,'#a3a8ab');box(sx+k*3.3,1.8,sz+5.85,.6,.5,.5,'#a3a8ab');solid(sx+k*3.3,sz+5.7,1,.8,2);}
        bsign('SANTUARIO DEL ZORRO',sx,3.55,sz+2.62,3.4,0,'#7a2f3a');}
      for(const zz of [-7,-10.5,-14])for(const sg of [-1,1])toro(DX+sg*2.4,zz);
      // pagoda de cinco pisos: se ve desde toda la ciudad
      {const px=DX-11.5,pz=DZ-1;
        box(px,.25,pz,8.6,.5,8.6,'#a3a8ab');solid(px,pz,8.6,8.6,.5);box(px+4.7,.12,pz,.8,.25,2.4,'#a3a8ab');solid(px+4.7,pz,.8,2.4,.25);
        let y=.5;for(let i=0;i<5;i++){const w=5.4-i*.7,h=i?2.2:3;
          box(px,y+h/2,pz,w,h,w,i%2?'#f6efdc':CREAM);for(const sx of [-1,1])for(const sz of [-1,1])box(px+sx*(w/2-.08),y+h/2,pz+sz*(w/2-.08),.26,h,.26,RED);
          box(px,y+h-.25,pz,w+.12,.18,w+.12,RED);if(i)for(const sx of [-1,1])box(px+sx*(w/2+.02),y+1,pz,.05,.9,1.1,'#3a2a22');
          y+=h;box(px,y+.15,pz,w+2.6,.3,w+2.6,TILE);box(px,y+.42,pz,w+1.5,.26,w+1.5,'#39424e');
          for(const sx of [-1,1])for(const sz of [-1,1])box(px+sx*(w/2+1.3),y+.36,pz+sz*(w/2+1.3),.3,.24,.3,GOLD);
          y+=.55;}
        box(px,y+1.5,pz,.22,3,.22,GOLD);for(let k=0;k<4;k++)box(px,y+.5+k*.6,pz,.74-k*.13,.12,.74-k*.13,GOLD);
        solid(px,pz,5.4,5.4,y);box(px+2.73,1.6,pz,.06,2.2,1.5,'#3a2a22');toro(px+4.9,pz-2.6);toro(px+4.9,pz+2.6);}
      // jardín zen (arena rastrillada y rocas)
      {const zx=-101,zz=12;flat(zx,zz,9,7,'#e8dfc4',.03);
        for(let k=-3;k<=3;k++)flat(zx,zz+k*.9,8.4,.07,'#d2c7a6',.036);
        for(const [w,d,ox,oz] of [[9.3,.3,0,-3.5],[9.3,.3,0,3.5],[.3,7,-4.5,0],[.3,7,4.5,0]])box(zx+ox,.1,zz+oz,w,.2,d,WOOD);
        for(const [ox,oz,w,h] of [[-2.2,-1,1.3,1],[1.8,1.2,1,.7],[2.6,.7,.6,.45],[-.4,1.9,.7,.5]]){flat(zx+ox,zz+oz,w+1,w+1,'#d2c7a6',.04);box(zx+ox,h/2,zz+oz,w,h,w*.85,STONE);solid(zx+ox,zz+oz,w,w*.85,h);}
        bench(zx+6,zz,true);toro(zx+5.6,zz-4.2);}
      // bosque de bambú
      for(let i=0;i<22;i++){const x=-99.4+(lr()-.5)*9,z=-13.6+(lr()-.5)*7.6,h=5+lr()*2.8;
        box(x,h/2,z,.2,h,.2,i%3?'#7fb069':'#93c47d');solid(x,z,.22,.22,h);box(x,h*.45,z,.26,.06,.26,'#5f8f4f');box(x,h+.1,z,1.2,.5,1.2,'#5f9a55','leaves');box(x+.3,h-.7,z-.2,.8,.35,.8,'#69a66d','leaves');}
      // campana, puesto de comida, carpas koi y cerezos
      {const bx=-77,bz=-14.5;box(bx,.2,bz,3.2,.4,3.2,'#a3a8ab');solid(bx,bz,3.2,3.2,.4);
        for(const sx of [-1,1])for(const sz of [-1,1]){box(bx+sx*1.1,2,bz+sz*1.1,.28,3.2,.28,WOOD);solid(bx+sx*1.1,bz+sz*1.1,.28,.28,3.6);}
        box(bx,3.7,bz,3.9,.26,3.9,TILE);box(bx,4.05,bz,2.6,.44,2.6,TILE);box(bx,4.4,bz,1.2,.3,1.2,TILE);box(bx,3.3,bz,2.4,.14,.14,WOOD);
        box(bx,2.5,bz,.95,1.2,.95,'#b08d57');box(bx,1.86,bz,1.08,.12,1.08,'#8a6a3a');box(bx,3.16,bz,.3,.16,.3,'#8a6a3a');box(bx+1.25,2.5,bz,1.5,.16,.16,'#81654a','log');solid(bx,bz,.95,.95,3.2,1.8);}
      {const yx=-94.6,yz=7.6;box(yx,.5,yz,2.8,1,.9,'#967852','plank');solid(yx,yz,2.8,.9,1.05);box(yx,1.03,yz,3,.07,1.1,WOOD);
        for(const sx of [-1,1])for(const sz of [-1,1])box(yx+sx*1.4,1.3,yz+sz*.7,.1,2.6,.1,WOOD);
        for(let k=0;k<6;k++)box(yx-1.5+k*.6+.3,2.66,yz,.6,.12,2,k%2?'#f6f0dc':'#d8433b');
        for(const sx of [-1,1]){box(yx+sx*1.2,2.2,yz-.95,.3,.44,.3,'#e2504a');box(yx+sx*1.2,1.96,yz-.95,.14,.06,.14,GOLD);}
        box(yx-.6,1.2,yz,.4,.28,.4,'#22272e');box(yx+.5,1.16,yz,.5,.2,.4,'#f6f0dc');box(yx,.3,yz-1.3,1.8,.6,.4,'#81654a','log');solid(yx,yz-1.3,1.8,.4,.6);}
      {const kx=-92.3,kz=-3.9;box(kx,3.6,kz,.16,7.2,.16,'#b6bfc4');solid(kx,kz,.2,.2,7.2);box(kx,7.3,kz,.34,.2,.34,GOLD);
        ['#2f5d8a','#d8433b','#f39dbd'].forEach((c,k)=>{box(kx+1,6.5-k*.95,kz,1.6,.42,.3,c);box(kx+1.95,6.5-k*.95,kz,.3,.6,.3,c);box(kx+.36,6.56-k*.95,kz+.16,.12,.12,.04,'#fff8df');});}
      for(const [x,z] of [[-84,-11.8],[-92.6,-9.6],[-92.3,13],[-83.8,12.4],[-96,5.4],[-82.4,-16.4]])sakura(x,z);
      bench(DX+3.9,DZ-3.3);bench(DX-3.9,DZ+3.3);

      // =====================================================================================================================
      // BIOMAS DEL MUNDO AMPLIADO (vista privada): Valle Sakura al oeste y Selva Esmeralda al este, con ríos y lagos nadables
      // =====================================================================================================================
      const PLANK='#967852',ROCK='#7d8a80',ROCK2='#6f7c73',WATERFALL='#bfe8f5',DIRT='#b9a27a',MMR=Object.assign([],{push(...a){for(const m of a){m.map=MAPTAG;Array.prototype.push.call(this,m);}return this.length;}});
      const lake=(x0,x1,z0,z1,d)=>{LAKES.push({x0,x1,z0,z1,d,map:x1<-60?'B':'J'});const zc=Math.min(z1,SHORE((x0+x1)/2)+8);box((x0+x1)/2,-d-1.5,(z0+zc)/2,x1-x0+2,3,zc-z0+2,'#5f8fa3');};
      const inW=(x,z,m=0)=>LAKES.some(l=>x>l.x0-m&&x<l.x1+m&&z>l.z0-m&&z<l.z1+m);
      const used=[],claim=(x,z,hw,hd)=>used.push([x,z,hw,hd]);
      const free=(x,z,r)=>!inW(x,z,r)&&!used.some(u=>Math.abs(x-u[0])<u[2]+r&&Math.abs(z-u[1])<u[3]+r);
      const scatter=(n,x0,x1,z0,z1,r,fn)=>{for(let i=0;i<n;i++){const x=x0+lr()*(x1-x0),z=z0+lr()*(z1-z0);if(free(x,z,r)){fn(x,z);claim(x,z,r*.55,r*.55);}}};
      const road=(x0,z0,x1,z1,w,col)=>{const ax=Math.abs(x1-x0)>Math.abs(z1-z0),cx=(x0+x1)/2,cz=(z0+z1)/2,W=ax?Math.abs(x1-x0)+w:w,D=ax?w:Math.abs(z1-z0)+w;
        const a0=ax?Math.min(x0,x1):Math.min(z0,z1),a1=ax?Math.max(x0,x1):Math.max(z0,z1);
        for(let a=a0;a<a1;a+=6){const b=Math.min(a+6,a1),m=(a+b)/2,px=ax?m:cx,pz=ax?cz:m;if(inW(px,pz,-.5))continue;flat(px,pz,ax?b-a+.02:w,ax?w:b-a+.02,col,.022);}
        claim(cx,cz,W/2+.4,D/2+.4);MMR.push([cx,cz,W,D]);};
      const mesa=(x,z,w,d,n,c1,c2)=>{for(let i=0;i<n;i++){const g=(n-1-i)*2.4,h=(i+1)*.5;box(x,h/2,z,w+g,h,d+g,i%2?c1:c2);solid(x,z,w+g,d+g,h);}claim(x,z,(w+(n-1)*2.4)/2+1,(d+(n-1)*2.4)/2+1);};
      const mount0=(x,z,w,h,c=ROCK)=>{for(let i=0;i<4;i++){const k=1-i*.22;box(x+(lr()-.5)*w*.1,h*(i+.5)/4,z+(lr()-.5)*w*.1,w*k,h/4+.04,w*k,i===3&&h>22?'#f1f5f7':(i%2?c:ROCK2));}solid(x,z,w,w,h);claim(x,z,w/2,w/2);};
      const mount=(x,z,w,h,c=ROCK)=>{const s0=lq,p0=MAPTAG,tg=[];if(x>=-125&&x<=125)tg.push('A');if(x>=55)tg.push('J');if(x<=-55)tg.push('B');for(const t of tg){lq=s0;MAPTAG=t;mount0(x,z,w,h,c);}MAPTAG=p0;};   // en la franja intermedia hay una copia por mapa
      const deck=(x,z,w,d,h=.5,post=1)=>{box(x,h-.08,z,w,.16,d,PLANK,'plank');solid(x,z,w,d,h,.12);if(post)for(const sx of [-1,1])for(const sz of [-1,1])box(x+sx*(w/2-.3),h/2-1.6,z+sz*(d/2-.3),.26,h+3.2,.26,WOOD);claim(x,z,w/2,d/2);};
      const bridge=(x,z,len,alongX,w=3.2,col=RED)=>{const n=Math.max(5,Math.round(len/1.5)+2),L=n*1.5;
        for(let i=0;i<n;i++){const t=(i+.5)/n,h=.25+1*Math.sin(Math.PI*t),o=-L/2+(i+.5)*1.5,bx=alongX?x+o:x,bz=alongX?z:z+o;
          box(bx,h-.07,bz,alongX?1.52:w,.14,alongX?w:1.52,col);solid(bx,bz,alongX?1.5:w,alongX?w:1.5,h,(i===0||i===n-1)?0:.12);
          for(const sg of [-1,1]){const rx=alongX?bx:bx+sg*(w/2-.08),rz=alongX?bz+sg*(w/2-.08):bz;box(rx,h+.62,rz,alongX?1.52:.1,.1,alongX?.1:1.52,'#8f2f2a');if(i%2===0)box(rx,h+.32,rz,.14,.62,.14,'#8f2f2a');}}
        claim(x,z,alongX?L/2:w/2,alongX?w/2:L/2);MMR.push([x,z,alongX?L:w,alongX?w:L]);};
      const shore=()=>{for(const l of LAKES){const pts=[];for(let x=l.x0;x<=l.x1;x+=2.4){pts.push([x,l.z0-.7],[x,l.z1+.7]);}for(let z=l.z0;z<=l.z1;z+=2.4){pts.push([l.x0-.7,z],[l.x1+.7,z]);}
        for(const [x,z] of pts){if(z>64||inW(x,z,-.1)||!free(x,z,.2))continue;const r=lr();if(r<.3)box(x,.18,z,.7+lr()*.6,.36,.6+lr()*.5,r<.15?STONE:'#a3a8ab');else if(r<.42)for(let k=0;k<3;k++)box(x+(lr()-.5)*.8,.55,z+(lr()-.5)*.8,.09,1.1+lr()*.5,.09,k%2?'#7fb069':'#b08d57');}}};
      const puesto=(x,z,c)=>{box(x,.5,z,2.6,1,.9,PLANK,'plank');solid(x,z,2.6,.9,1.05);for(const sx of [-1,1])for(const sz of [-1,1])box(x+sx*1.3,1.3,z+sz*.65,.1,2.6,.1,WOOD);
        for(let k=0;k<5;k++)box(x-1.2+k*.6,2.66,z,.6,.12,1.9,k%2?'#f6f0dc':c);box(x-.5,1.2,z,.4,.3,.4,'#e2504a');box(x+.5,1.16,z,.5,.2,.4,'#ffd35c');claim(x,z,1.6,1.2);};

      // ---------- agua ----------
      lake(-216,-207,-129,-39,2.6);lake(-216,-168,-39,-30,2.6);lake(-177,-168,-30,24,2.6);lake(-207,-150,24,51,4);lake(-183,-171,51,102,2.6);lake(-306,-294,-114,-105,.8);   // Río Koi, Lago del Espejo y aguas termales
      lake(225,234,-126,-33,2.8);lake(198,261,-33,12,3.6);lake(207,219,12,102,2.8);lake(291,306,36,51,6);                                                              // Río Jade, Laguna de las Cabañas y cenote
      claim(DX-4,DZ+10,24,36);claim(89,1,12,10);   // el barrio y el campamento ya existen

      // ---------- montañas del borde y cascadas ----------
      for(let x=-330;x<=330;x+=19){if((x>-236&&x<-188)||(x>198&&x<262))continue;mount(x+(lr()-.5)*6,-150+lr()*6,22+lr()*9,13+lr()*24);}
      for(let z=-128;z<=58;z+=20){mount(-341-lr()*3,z+(lr()-.5)*6,22+lr()*6,11+lr()*18);mount(341+lr()*3,z+(lr()-.5)*6,22+lr()*6,11+lr()*18);}
      MAPTAG='B';{const cx=-211.5;box(cx,7,-141,44,14,20,ROCK);box(cx-9,9.5,-143,18,19,16,ROCK2);box(cx+11,8.5,-144,16,17,14,ROCK2);box(cx,16.5,-146,22,5,10,'#f1f5f7');solid(cx,-141,44,20,14);claim(cx,-141,22,10);
        box(cx,7,-130.8,7.4,14,.5,WATERFALL);box(cx-1.4,7,-130.6,1.2,14,.3,'#e9fbff');box(cx+2,7,-130.6,.8,14,.3,'#e9fbff');for(let k=0;k<7;k++)box(cx-3.4+k*1.1,.2,-129.6-(k%2)*.5,1,.5,1,'#e9fbff');
        box(cx,36,-196,90,72,60,'#8a96a3');box(cx,58,-196,62,30,44,'#a9b4bf');box(cx,76,-196,36,14,28,'#f1f5f7');}   // monte nevado al fondo
      MAPTAG='J';{const cx=229.5;box(cx,8,-139,58,16,26,ROCK);box(cx-14,11,-142,22,22,18,ROCK2);box(cx+15,10,-143,20,20,16,ROCK2);box(cx,16.3,-139,58,.6,26,'#3a8f4a');solid(cx,-139,58,26,16);claim(cx,-139,29,13);
        box(cx,8,-125.8,8.6,16,.5,WATERFALL);box(cx-2,8,-125.6,1.3,16,.3,'#e9fbff');box(cx+2.6,8,-125.6,.9,16,.3,'#e9fbff');for(let k=0;k<8;k++)box(cx-3.9+k*1.1,.2,-124.6-(k%2)*.5,1,.5,1,'#e9fbff');}

      // ====================== VALLE SAKURA (oeste) ======================
      MAPTAG='B';
      // caminos
      road(-93,-7.5,-166,-7.5,2.8,PAVE);road(-179,-7.5,-232,-7.5,2.8,PAVE);road(-232,-7.5,-232,-63,2.8,PAVE);road(-232,-63,-241,-63,2.8,PAVE);
      road(-190,-7.5,-190,-27,2.4,PAVE);road(-190,-42,-190,-90,2.4,PAVE);road(-190,-90,-204,-90,2.4,PAVE);road(-219,-90,-234,-90,2.4,PAVE);road(-234,-90,-234,-101,2.4,PAVE);road(-234,-101,-292,-101,2.4,PAVE);
      road(-140,-7.5,-140,60,2.4,PAVE);road(-126,60,-169,60,2.6,DIRT);road(-185,60,-300,60,2.6,DIRT);road(-240,60,-240,66,2.6,DIRT);road(-232,-7.5,-232,3,2.4,DIRT);road(-283,25,-262,25,2.2,PAVE);road(-262,3,-262,25,2.2,DIRT);road(-232,3,-262,3,2.2,DIRT);
      bridge(-172.5,-7.5,10,true);bridge(-190,-34.5,10,false);bridge(-211.5,-90,10,true);bridge(-177,60,13,true,3.4,'#b0463c');
      for(let x=-100;x>-232;x-=11){if(inW(x,-9.6,2))continue;toro(x,-9.6);}
      // Aldea del Río
      {const nor=['#2f5d8a','#7a2f3a','#3f7a4f','#b8902c','#5a3f7a'];let k=0;
        for(const hx of [-158,-150.5,-126.5,-119]){casa(hx,-13.6,5,4.6,1,nor[k++%5]);claim(hx,-13.6,3.4,3.2);casa(hx,-1.4,5,4.6,-1,nor[k++%5]);claim(hx,-1.4,3.4,3.2);}
        casa(-133,-13.6,5,4.6,1,nor[2]);claim(-133,-13.6,3.4,3.2);
        for(const lx of [-154.2,-122.8]){box(lx,3.95,-7.5,.05,.05,7.6,TILE);for(let i=-1;i<=1;i++){box(lx,3.6-(i===0?.14:0),-7.5+i*1.9,.4,.5,.4,i?'#e2504a':'#fff0b1');box(lx,3.3-(i===0?.14:0),-7.5+i*1.9,.18,.08,.18,GOLD);}}
        puesto(-146,-1.6,'#d8433b');puesto(-133.5,-2,'#2f5d8a');puesto(-146,14,'#3f7a4f');
        torii(-112.5,-7.5,true,5.4,5.6,RED);bsign('VALLE SAKURA',-112.05,4.5,-7.5,4.4,Math.PI/2,'#7a2f3a');claim(-112.5,-7.5,1,4);
        box(-136.6,.5,-1,1.6,1,1.6,STONE);box(-136.6,1.05,-1,1.2,.1,1.2,'#5fb8d6');for(const sg of [-1,1])box(-136.6+sg*.7,1.6,-1,.14,1.2,.14,WOOD);box(-136.6,2.3,-1,2,.16,1.4,TILE);solid(-136.6,-1,1.6,1.6,1.1);claim(-136.6,-1,1.2,1.2);}   // pozo
      // Lago del Espejo: casa de té sobre pilotes y zorro guardián
      {deck(-201.5,38,14,2.2);deck(-189,38,12,10);
        const tx=-189,tz=38.6;box(tx,2,tz,6.4,3,5,CREAM);solid(tx,tz,6.4,5,4.6,.5);for(const sx of [-1,1])for(const sz of [-1,1])box(tx+sx*3.1,2,tz+sz*2.4,.26,3,.26,WOOD);
        box(tx,3.7,tz,8.4,.3,7,TILE);box(tx,4.1,tz,6.6,.5,4.6,TILE);box(tx,4.6,tz,6.2,.5,2.2,TILE);box(tx,1.6,tz-2.53,1.5,2.2,.06,'#3a2a22');box(tx,2.45,tz-2.6,1.7,.7,.05,'#3f7a4f');
        for(const sx of [-1,1]){box(tx+sx*4.6,2.3,tz-4.2,.34,.52,.34,'#e2504a');box(tx+sx*4.6,1.2,tz-4.2,.1,2.4,.1,WOOD);}
        bsign('CASA DE TÉ DEL LAGO',-209.6,2.6,38,3.6,-Math.PI/2,'#3f5a3a');box(-209.6,1.1,38.9,.18,2.2,.18,WOOD);
        for(let i=0;i<14;i++){const x=-204+lr()*50,z=27+lr()*21;if(Math.abs(x+189)<8&&Math.abs(z-38)<7)continue;box(x,.1,z,.42,.3,.42,i%3?'#fff0b1':'#f3a2cb');box(x,.0,z,.6,.06,.6,PLANK);}   // farolillos flotantes
        for(let i=0;i<12;i++){const x=-204+lr()*50,z=27+lr()*21;flat(x,z,.9,.9,'#4f9a5b',.0);}
        const fx=-144.5,fz=40,W='#f6f3ec';box(fx,.4,fz,5,.8,5,STONE);solid(fx,fz,5,5,.8);claim(fx,fz,3,3);
        box(fx,2.5,fz,2.6,3.4,2.8,W);box(fx-.3,5,fz,2.2,1.9,2.2,W);box(fx-1.5,4.7,fz,.9,.7,.9,W);box(fx-2,4.75,fz,.3,.3,.3,'#22272e');for(const sz of [-1,1]){box(fx-.1,6.3,fz+sz*.7,.5,.9,.5,W);box(fx-.1,6.5,fz+sz*.7,.2,.5,.3,'#f3a2cb');box(fx-1.4,5.4,fz+sz*.6,.1,.16,.2,'#22272e');}
        box(fx-.4,3.9,fz,2.8,.4,3,'#d8433b');box(fx-1.5,3.5,fz,.3,.5,.5,GOLD);box(fx+1.9,1.7,fz,1.4,1.4,1.4,W);box(fx+2.7,3,fz,1.2,1.8,1.2,W);box(fx+2.9,4.3,fz,1,1,1,'#d8433b');solid(fx,fz,3,3,6,.8);
        bsign('KITSUNE GUARDIÁN',fx-2.56,1.35,fz,2.6,-Math.PI/2,'#7a2f3a');bench(-144.5,34.6);}
      // Arrozales y granja
      {for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=-252+i*11,z=12+j*13;flat(x,z,10,12,'#7fc8d8',.03);for(let a=-4;a<=4;a+=1.3)for(let b=-5;b<=5;b+=1.5)box(x+a,.16,z+b,.1,.3,.1,(i+j)%2?'#93c47d':'#a9cd86');
          box(x,.1,z-6.25,10.6,.2,.5,'#8a6a3a');box(x-5.25,.1,z,.5,.2,12.6,'#8a6a3a');}
        box(-225.3,.1,25,.5,.2,39,'#8a6a3a');box(-241,.1,44.75,32,.2,.5,'#8a6a3a');claim(-241,25,17.5,20.5);MMR.push([-241,25,33,39,'#7fc8d8']);
        casa(-270,28,6,5,-1,'#b8902c');claim(-270,28,4,4);box(-256.5,1.2,3,.14,2.4,.14,WOOD);box(-256.5,1.9,3,1.6,.14,.14,WOOD);box(-256.5,2.6,3,.6,.6,.6,'#e9dfc0');box(-256.5,3,3,1.1,.12,1.1,'#b8902c');box(-256.5,1.5,3,.7,.9,.3,'#3f7a4f');
        for(let k=0;k<3;k++){box(-264.5+k*.1,.5+k*1,36,1.6-k*.3,1,1.6-k*.3,'#e9c24a');}solid(-264.5,36,1.6,1.6,2);}
      // Castillo del Dragón Blanco sobre su colina
      {const CX=-273,CZ=-63,T2='#3b5560',WH='#f4f1e8';mesa(CX,CZ,46,46,8,'#79b560','#6fae5a');
        for(let i=0;i<8;i++)flat(CX+23+(7-i)*1.2+.6,CZ,1.24,4,PAVE,(i+1)*.5+.013);
        const wall=(x,z,w,d)=>{box(x,5.3,z,w,2.6,d,WH);box(x,6.75,z,w+.5,.3,d+.5,T2);box(x,4.3,z,w+.2,.6,d+.2,STONE);solid(x,z,w,d,6.9,4);};
        wall(CX,CZ-22,45,1);wall(CX,CZ+22,45,1);wall(CX-22,CZ,1,45);wall(CX+22,CZ-13,1,19);wall(CX+22,CZ+13,1,19);
        box(CX+22,7.6,CZ,2.4,.5,9,T2);box(CX+22,8.1,CZ,1.6,.5,7,T2);for(const sg of [-1,1])box(CX+22,5.5,CZ+sg*3.5,1.4,3.8,.8,WOOD);
        for(const sx of [-1,1])for(const sz of [-1,1]){const x=CX+sx*21,z=CZ+sz*21;box(x,6.5,z,5,5,5,WH);box(x,9.2,z,6.6,.4,6.6,T2);box(x,9.7,z,4.4,.6,4.4,T2);box(x,10.2,z,2,.4,2,T2);box(x,5.2,z+sz*-2.52,1,1,.06,'#22272e');solid(x,z,5,5,9.4,4);}
        const bx=CX-4;box(bx,4.75,CZ,22,1.5,20,STONE);box(bx,6.25,CZ,19,1.5,17,'#a3a8ab');solid(bx,CZ,22,20,5.5,4);solid(bx,CZ,19,17,7,4);
        for(let i=0;i<6;i++){const h=4.5+i*.5;box(bx+15.5-i,h/2+2,CZ,1,h-4,4,'#a3a8ab');solid(bx+15.5-i,CZ,1,4,h,4);}
        let y=7;for(let i=0;i<5;i++){const w=14-i*2.3,d=12-i*2,h=i?3.2:4;
          box(bx,y+h/2,CZ,w,h,d,WH);box(bx,y+h-.3,CZ,w+.14,.22,d+.14,'#22272e');
          for(let k=-1;k<=1;k++){box(bx+k*w*.28,y+h*.55,CZ+d/2+.02,1,1.1,.06,'#22272e');box(bx+k*w*.28,y+h*.55,CZ-d/2-.02,1,1.1,.06,'#22272e');box(bx+w/2+.02,y+h*.55,CZ+k*d*.28,.06,1.1,1,'#22272e');}
          y+=h;box(bx,y+.18,CZ,w+3.4,.36,d+3.4,T2);box(bx,y+.5,CZ,w+1.8,.3,d+1.8,'#4a6875');box(bx,y+.85,CZ,w+2.6,.4,d*.3,T2);y+=.7;}
        for(const sg of [-1,1]){box(bx+sg*1.6,y+.6,CZ,.5,1,.5,GOLD);box(bx+sg*1.6,y+1.2,CZ,.3,.5,.9,GOLD);}
        solid(bx,CZ,14,12,y,7);box(bx+7.03,8.3,CZ,.06,2.4,1.8,'#3a2a22');
        for(const [ox,oz] of [[14,-14],[14,14],[-17,15],[-17,-15],[4,16],[4,-16]])sakura(CX+ox,CZ+oz);
        bsign('CASTILLO DEL DRAGÓN BLANCO',CX+22.6,8.9,CZ,6.4,Math.PI/2,'#22272e');toro(CX+25.5,CZ-3.4);toro(CX+25.5,CZ+3.4);MMR.push([CX,CZ,46,46,'#e9e4d2']);MMR.push([bx,CZ,14,12,'#3b5560']);}
      // Aguas termales
      {const ox=-300,oz=-109.5;for(let i=0;i<22;i++){const a=i/22*TAU;box(ox+Math.cos(a)*7.4,.35,oz+Math.sin(a)*5.9,1.1+lr()*.8,.7+lr()*.5,1+lr()*.7,i%2?STONE:'#6f777c');}
        for(let i=0;i<9;i++)box(ox+(lr()-.5)*10,1+lr()*1.6,oz+(lr()-.5)*7,.5+lr()*.5,.3,.5+lr()*.5,'#f4f8fa');
        casa(-300,-96.8,7,5,-1,'#2f5d8a');claim(-300,-104,10,12);bsign('AGUAS TERMALES',-294.4,3.2,-99.5,3.4,Math.PI,'#1d5f7a');toro(-291.6,-105);toro(-308.4,-105);bench(-290,-110,true);}
      // Bosque de bambú con un santuario escondido
      {road(-305,25,-283,25,2.2,PAVE);torii(-296,25,true,3.4,3.7,RED);box(-309,.3,25,5,.6,5,'#a3a8ab');solid(-309,25,5,5,.6);box(-309.6,1.7,25,2.6,2.2,2.6,WOOD);box(-309.6,3,25,3.8,.3,3.8,TILE);box(-309.6,3.4,25,2.4,.5,2.4,TILE);box(-308.25,1.6,25,.06,1.2,1,'#f6f0dc');solid(-309.6,25,2.6,2.6,3.6,.6);toro(-305.6,22.6);toro(-305.6,27.4);claim(-309,25,3.4,3.4);
        scatter(190,-325,-281,-8,58,.7,(x,z)=>{const h=5+lr()*3.4;box(x,h/2,z,.2,h,.2,lr()<.6?'#7fb069':'#93c47d');solid(x,z,.22,.22,h);box(x,h+.1,z,1.2,.5,1.2,'#5f9a55','leaves');box(x+.3,h-.8,z-.2,.8,.35,.8,'#69a66d','leaves');});MMR.push([-303,25,44,66,'#4d8f52']);}
      // Gran torii en el mar con pasarela
      {const tx=-240,zs=SHORE(tx)+13;for(let z=SHORE(tx)-5;z<zs-1;z+=1.5){box(tx,.38,z,2.4,.14,1.52,PLANK,'plank');solid(tx,z,2.4,1.5,.45,z>SHORE(tx)?.12:0);if((z|0)%3===0)for(const sg of [-1,1])box(tx+sg*1.1,-1,z,.2,3,.2,WOOD);}
        box(tx,.38,zs+.6,6,.14,4,PLANK,'plank');solid(tx,zs+.6,6,4,.45,.12);
        for(const sg of [-1,1]){box(tx+sg*5.5,3.5,zs+6,.9,13,.9,RED);solid(tx+sg*5.5,zs+6,.9,.9,10,-6);box(tx+sg*5.5,-.5,zs+6,1.4,2,1.4,TILE);}
        box(tx,10.3,zs+6,14.6,.8,1,RED);box(tx,11,zs+6,16.4,.6,1.4,TILE);box(tx,8.4,zs+6,12.4,.5,.6,RED);box(tx,9.35,zs+6,1.4,1.3,.3,GOLD);toro(tx-1.9,zs+1.6);toro(tx+1.9,zs+1.6);MMR.push([tx,zs+6,14,2,'#c8473f']);}
      // cerezos, flores y rocas por todo el valle
      // =====================================================================================================================
      // MÁS VIDA: vegetación, colinas, estanques y rincones para que ningún mapa se sienta vacío
      // =====================================================================================================================
      for(const q of JUNGLE_SPAWNS.concat(JAPAN_SPAWNS))claim(q.x,q.z,3.2,3.2);   // que nada nuevo caiga encima de un punto de aparición
      const pick3=a=>a[lr()*a.length|0];
      const hill=(x,z,w,d,n,c1,c2)=>{if(!free(x,z,Math.max(w,d)/2+n*1.3+1))return;mesa(x,z,w,d,n,c1,c2);};
      const bush=(x,z,cols)=>{box(x,.4,z,1.1+lr()*.9,.8,.9+lr()*.8,pick3(cols),'leaves');};
      const rock=(x,z)=>{const w=.8+lr()*1.7;box(x,w*.3,z,w,w*.6,w*.8,lr()<.5?STONE:ROCK2);solid(x,z,w,w*.8,w*.6);};
      const logs=(x,z)=>{const a=lr()<.5,w=a?2.6:.6,d=a?.6:2.6;box(x,.3,z,w,.6,d,'#6b4a3a','log');solid(x,z,w,d,.6);if(lr()<.5)box(x+(a?.6:0),.68,z+(a?0:.6),.5,.16,.5,'#d8433b');};
      const pond=(x0,x1,z0,z1,d)=>{lake(x0,x1,z0,z1,d);claim((x0+x1)/2,(z0+z1)/2,(x1-x0)/2+1,(z1-z0)/2+1);
        for(let x=x0;x<=x1;x+=2.2)for(const zz of [z0-.8,z1+.8]){if(lr()<.5)box(x,.16,zz,.7+lr()*.6,.32,.6+lr()*.5,lr()<.5?STONE:'#a3a8ab');else if(lr()<.4)for(let k=0;k<3;k++)box(x+(lr()-.5)*.8,.55,zz+(lr()-.5)*.8,.09,1.1+lr()*.5,.09,k%2?'#7fb069':'#b08d57');}
        for(let z=z0;z<=z1;z+=2.2)for(const xx of [x0-.8,x1+.8])if(lr()<.5)box(xx,.16,z,.7+lr()*.6,.32,.6+lr()*.5,lr()<.5?STONE:'#a3a8ab');};

      // ---------- rincones grandes ----------
      MAPTAG='B';
      const hallTop=(x,z,y)=>{box(x,y+1.6,z,6,3.2,5,CREAM);solid(x,z,6,5,y+3.2,y);for(const sx of [-1,1])box(x+sx*2.7,y+1.6,z+2.55,.4,3.2,.2,RED);
        box(x,y+3.4,z,8.4,.35,7.4,TILE);box(x,y+3.9,z,6.2,.5,5,TILE);box(x,y+4.4,z,3.6,.5,2.6,TILE);box(x,y+4.78,z,4.2,.14,.4,GOLD);box(x,y+1,z+2.53,1.4,2,.06,'#3a2a22');
        for(const sx of [-1,1]){box(x+sx*4.4,y+.5,z+3.4,.7,1,.7,STONE);box(x+sx*4.4,y+1.2,z+3.4,.5,.5,.5,'#fff0b1');}};
      const templeHill=(x,z)=>{hill(x,z,12,12,8,'#8fcf6a','#7bc05c');hallTop(x,z,4);for(let i=0;i<5;i++)torii(x,z+17+i*3.4,false,3.6,3.8,i%2?'#d9603f':RED);flat(x,z+23,3,18,PAVE,.02);
        for(const [ox,oz] of [[-9,10],[9,10],[-8,-9],[8,-9]])sakura(x+ox*1.3,z+oz*1.3);claim(x,z+8,16,28);MMR.push([x,z+8,28,36,'#c9bd9c']);};
      const bmarket=(x,z)=>{const cs=['#d8433b','#2f5d8a','#3f7a4f','#e9c24a','#7a2f3a'];for(let i=0;i<4;i++)for(const sz of [-1,1])puesto(x+i*4.4,z+sz*3.3,pick3(cs));
        for(let k=0;k<10;k++){const cx=x+lr()*14,cz=z+(lr()-.5)*3.4;box(cx,.4,cz,.8,.8,.8,'#a57f27');solid(cx,cz,.8,.8,.8);}
        box(x+6.6,4.2,z,14,.05,.05,'#2a3b4a');for(let i=0;i<7;i++){box(x+i*2.2,3.85,z,.4,.5,.4,i%2?'#fff0b1':'#e2504a');}flat(x+6.6,z,15,9,DIRT,.02);claim(x+6.6,z,9,6.5);MMR.push([x+6.6,z,15,9,'#b9a27a']);};
      const teaGarden=(x,z)=>{casa(x,z,6,5,1,'#7a2f3a');flat(x,z+7,10,8,'#e8dfc4',.03);for(let k=-3;k<=3;k++)flat(x,z+7+k*.9,9.4,.07,'#d2c7a6',.036);
        for(const [ox,oz,w,h] of [[-2,6,1.2,.9],[2.2,8,1,.7]]){box(x+ox,h/2,z+oz,w,h,w*.85,STONE);solid(x+ox,z+oz,w,w*.85,h);}bench(x+6,z+7,true);sakura(x-6,z+3);sakura(x+7,z-3);toro(x-4,z+11);toro(x+4,z+11);claim(x,z+5,9,9);};
      const placeN=(n,x0,x1,z0,z1,ok,fn)=>{for(let t=0;t<600&&n>0;t++){const x=x0+lr()*(x1-x0),z=z0+lr()*(z1-z0);if(ok(x,z)){fn(x,z);n--;}}};   // coloca n rincones donde de verdad haya sitio
      placeN(2,-322,-125,-124,40,(x,z)=>free(x,z,18)&&free(x,z+24,6),templeHill);
      placeN(2,-322,-125,-124,50,(x,z)=>free(x+6.6,z,10),bmarket);
      placeN(3,-322,-125,-124,50,(x,z)=>free(x,z+5,10),teaGarden);
      scatter(300,-326,-118,-128,63,2.4,(x,z)=>flat(x,z,2+lr()*3.2,2+lr()*3.2,pick3(['#7fb86a','#9acb7a','#6aa85c','#b9a27a','#a8cf86']),.017));

      shore();
      scatter(170,-326,-118,-128,63,3.2,(x,z)=>sakura(x,z));
      scatter(260,-326,-116,-128,64,.5,(x,z)=>{const r=lr();if(r<.5)box(x,.16,z,.16,.32,.16,['#f3a2cb','#fbd0e0','#e9fbff','#ffd35c'][(r*40|0)%4]);else if(r<.8)box(x,.3,z,1+lr()*.6,.6,1+lr()*.6,'#f7b6cf');else box(x,.25,z,.9+lr()*.7,.5,.8+lr()*.6,STONE);});

      // ====================== SELVA ESMERALDA (este) ======================
      MAPTAG='J';
      const jtree=(x,z,s)=>{const h=4+s*3+lr()*2,t=.5+s*.4,c=['#2f7a3f','#3a8f4a','#27693a'];box(x,h/2,z,t,h,t,'#5d4634','log');solid(x,z,t,t,h);
        box(x,h+.6,z,3.4+s*2.5,1.6+s*.5,3.4+s*2.5,c[0],'leaves');box(x+.5,h+1.9+s*.3,z-.3,2.2+s*1.6,1.2,2.2+s*1.6,c[1],'leaves');box(x-1.1-s*.6,h-.5,z+.9,1.8+s,1,1.8+s,c[2],'leaves');
        if(lr()<.6)box(x+t/2+.06,h*.55,z,.08,h*.75,.3,'#3f8f3a');if(s>1){box(x-t/2-.06,h*.6,z+.2,.08,h*.6,.3,'#3f8f3a');for(const sg of [-1,1])box(x+sg*(t/2+.5),.5,z,1,1-.0,.5,'#5d4634','log');}};
      const hut=(x,z,y)=>{box(x,y+1.3,z,4,2.6,3.4,'#c9a66b');for(let k=-1;k<=1;k++)box(x+k*1.3,y+1.3,z+1.72,.1,2.6,.06,'#a3824f');box(x,y+2.75,z,5.2,.3,4.6,'#b8902c');box(x,y+3.15,z,4,.5,3.4,'#a57f27');box(x,y+3.6,z,2.4,.4,2,'#b8902c');box(x,y+1,z+1.73,1.1,2,.06,'#3a2a22');solid(x,z,4,3.4,y+3.8,y);};
      // sendero desde el campamento y poblado sobre la laguna
      road(97,1,196,1,2.4,DIRT);road(264,-4,300,-4,2.4,DIRT);road(266,-4,266,-52,2.4,DIRT);road(224,14,224,62,2.2,DIRT);road(226,40,298,40,2.2,DIRT);road(203,40,150,40,2.2,DIRT);road(165,40,165,36,2.2,DIRT);road(140,1,140,-60,2.2,DIRT);road(219,62,300,62,2.4,DIRT);road(285,62,285,66,2.4,DIRT);
      torii(120,1,true,4.6,4.6,'#6b4a3a');bsign('SELVA ESMERALDA',119.5,3.8,1,4.2,-Math.PI/2,'#27693a');claim(120,1,1,3.5);
      {deck(203,1,12,2.2);deck(213,-4,10,12);deck(222.5,-9,9,2.2);deck(231,-15,10,10);deck(239.5,-9,7,2.2);deck(247,-4,10,10);deck(256.5,-4,11,2.2);deck(230,-1,24,2.2);
        hut(213,-6.2,.5);hut(231,-17.4,.5);hut(247,-6,.5);
        for(const [x,z] of [[208.4,1.4],[217.6,1.4],[226.4,-10.4],[235.6,-10.4],[242.4,.6],[251.6,.6]]){box(x,1.4,z,.12,1.9,.12,WOOD);box(x,2.5,z,.36,.44,.36,'#fff0b1');box(x,2.76,z,.5,.1,.5,'#5d4634');}
        box(219,.3,-25,1.4,.3,3.2,'#8a6a3a');box(219,.48,-25,1.1,.1,2.8,PLANK,'plank');box(250,.3,8,1.4,.3,3.2,'#b0463c');box(250,.48,8,1.1,.1,2.8,PLANK,'plank');
        for(let i=0;i<16;i++){const x=200+lr()*59,z=-31+lr()*41;if(!used.some(u=>Math.abs(x-u[0])<u[2]+.6&&Math.abs(z-u[1])<u[3]+.6)){flat(x,z,1,1,'#4f9a5b',.0);if(lr()<.5)box(x,.1,z,.26,.16,.26,'#f3a2cb');}}
        bsign('POBLADO DE LA LAGUNA',196.4,2.6,2.6,3.6,-Math.PI/2,'#27693a');box(196.4,1.1,2.6,.18,2.2,.18,WOOD);MMR.push([230,-8,58,26,'#967852']);}
      bridge(213,40,13,true,2.6,PLANK);bridge(229.5,-70,10,true,2.6,PLANK);road(236,-70,264,-70,2.2,DIRT);road(223,-70,140,-70,2.2,DIRT);
      // Pirámide del Jaguar: se sube por los escalones hasta el templo de la cima
      {const PX=286,PZ=-74,n=16;for(let i=0;i<n;i++){const w=9+2.2*(n-1-i),h=(i+1)*.5;box(PX,h/2,PZ,w,h,w,i%2?'#9a9d8f':'#8d9084');solid(PX,PZ,w,w,h);
          for(const [ax,az] of [[1,0],[-1,0],[0,1],[0,-1]])flat(PX+ax*(w/2-.55),PZ+az*(w/2-.55),ax?1.1:3.4,ax?3.4:1.1,'#c9c4a8',h+.013);
          for(let k=0;k<3;k++){const a=lr()*4|0,o=(lr()-.5)*(w-4),e=w/2-.5;if(Math.abs(o)<2.4)continue;box(PX+(a===0?e:a===1?-e:o),h+.06,PZ+(a===2?e:a===3?-e:o),.9,.12,.9,'#3a8f4a');}}
        claim(PX,PZ,22,22);const y=8;for(const sx of [-1,1])for(const sz of [-1,1]){box(PX+sx*2.8,y+1.6,PZ+sz*2.8,.8,3.2,.8,'#8d9084');solid(PX+sx*2.8,PZ+sz*2.8,.8,.8,y+3.2,y);}
        box(PX,y+3.5,PZ,7.6,.6,7.6,'#9a9d8f');box(PX,y+4.1,PZ,5.6,.6,5.6,'#8d9084');box(PX,y+4.7,PZ,3,.6,3,'#9a9d8f');
        box(PX,y+.3,PZ,2,.6,2,'#6f7c73');box(PX,y+1.3,PZ,1.2,1.4,1,GOLD);box(PX,y+2.3,PZ,1.4,.8,1.2,GOLD);for(const sg of [-1,1]){box(PX+sg*.5,y+2.9,PZ,.3,.4,.3,GOLD);box(PX+sg*.3,y+2.4,PZ+.61,.2,.2,.04,'#2f7a3f');}solid(PX,PZ,2,2,y+2.7,y);
        for(const sg of [-1,1]){box(PX+sg*3.4,y+.5,PZ+3.4,.8,1,.8,'#6f7c73');box(PX+sg*3.4,y+1.2,PZ+3.4,.5,.5,.5,'#fff0b1');box(PX+sg*3.4,y+1.55,PZ+3.4,.3,.3,.3,'#ff9a3c');}
        bsign('PIRÁMIDE DEL JAGUAR',264.9,2.6,-56,3.6,Math.PI,'#6b4a3a');box(264.9,1.1,-55.9,.18,2.2,.18,WOOD);MMR.push([PX,PZ,42,42,'#9a9d8f']);MMR.push([PX,PZ,9,9,'#e9c24a']);
        for(const [ox,oz,hh] of [[-26,14,3.4],[-27.5,8,2],[-25,-22,4.2],[26,20,2.6],[24,-25,3.8]]){box(PX+ox,hh/2,PZ+oz,1.1,hh,1.1,'#9a9d8f');box(PX+ox,hh+.15,PZ+oz,1.5,.3,1.5,'#8d9084');solid(PX+ox,PZ+oz,1.1,1.1,hh);claim(PX+ox,PZ+oz,1,1);}}
      // Ruinas y cabeza de piedra gigante
      {const rx=140,rz=-74;flat(rx,rz,22,16,'#a7aa9a',.02);claim(rx,rz,12,9);for(let i=0;i<12;i++){const x=rx-9+(i%6)*3.6,z=rz+(i<6?-6:6),hh=1+lr()*4;box(x,hh/2,z,1,hh,1,'#9a9d8f');if(hh>3.6)box(x,hh+.2,z,1.5,.4,1.5,'#8d9084');solid(x,z,1,1,hh);if(lr()<.5)box(x+.5,hh*.5,z,.1,hh*.8,.4,'#3a8f4a');}
        box(rx-9+1.8,5.2,rz-6,5,.6,1.3,'#8d9084');box(rx,2.6,rz,4,5.2,3.6,'#8d9084');box(rx,5.6,rz,4.6,.9,4,'#9a9d8f');box(rx,2.2,rz+1.9,1.2,2,.5,'#9a9d8f');for(const sg of [-1,1]){box(rx+sg*1,3.9,rz+1.82,.9,.5,.1,'#22272e');box(rx+sg*2.2,2.8,rz,.5,2,1.2,'#8d9084');}box(rx,1,rz+1.85,2,.3,.1,'#22272e');box(rx+1.2,5.9,rz+.6,2,.5,1.6,'#3a8f4a');solid(rx,rz,4,3.6,6);
        bsign('RUINAS OLVIDADAS',rx,2.4,rz+8.4,3.4,0,'#6b4a3a');box(rx,1.1,rz+8.3,.18,2.2,.18,WOOD);MMR.push([rx,rz,22,16,'#a7aa9a']);}
      // Casa del árbol: escalera de caracol alrededor del tronco gigante
      {const tx=165,tz=30;box(tx,7,tz,2.6,14,2.6,'#5d4634','log');solid(tx,tz,2.6,2.6,14);claim(tx-3,tz,9,6);
        box(tx,15,tz,12,2.6,12,'#2f7a3f','leaves');box(tx+1,17,tz-1,8,2,8,'#3a8f4a','leaves');box(tx-3,13.4,tz+2,6,1.4,6,'#27693a','leaves');
        const ring=[[2.1,-2.1],[2.1,0],[2.1,2.1],[0,2.1],[-2.1,2.1],[-2.1,0],[-2.1,-2.1],[0,-2.1]];
        for(let i=0;i<14;i++){const o=ring[(i+3)%8],h=.45*(i+1);box(tx+o[0],h-.07,tz+o[1],2.1,.14,2.1,PLANK,'plank');solid(tx+o[0],tz+o[1],2.1,2.1,h,Math.max(0,h-.35));}
        const py=6.75;box(tx-6.6,py-.1,tz,7,.2,7,PLANK,'plank');solid(tx-6.6,tz,7,7,py,py-.36);hut(tx-7.4,tz-.6,py);for(const sx of [-1,1])for(const sz of [-1,1])box(tx-6.6+sx*3.3,py/2,tz+sz*3.3,.3,py,.3,'#5d4634','log');
        for(const sz of [-1,1])box(tx-6.6,py+.9,tz+sz*3.4,7,.1,.1,'#5d4634');box(tx-10,py+.9,tz,.1,.1,7,'#5d4634');bsign('CASA DEL ÁRBOL',tx+1.2,2.4,tz+6.4,3,0,'#27693a');box(tx+1.2,1.1,tz+6.3,.18,2.2,.18,WOOD);}
      // Cenote: pozo natural profundo de agua azul
      {const cx=298.5,cz=43.5;for(let i=0;i<26;i++){const a=i/26*TAU;box(cx+Math.cos(a)*10.6,.5,cz+Math.sin(a)*10.4,1.6+lr(),1+lr()*.8,1.5+lr(),i%2?ROCK:ROCK2);}
        for(let i=0;i<8;i++){const a=i/8*TAU+.3;box(cx+Math.cos(a)*9.4,.9,cz+Math.sin(a)*9.2,.1,2.4,.3,'#3f8f3a');}
        box(cx-8.6,.25,cz,2.6,.14,1.6,PLANK,'plank');claim(cx,cz,12,12);bsign('CENOTE AZUL',cx-11.6,2.4,cz+3,2.8,-Math.PI/2,'#1d5f7a');box(cx-11.6,1.1,cz+3,.18,2.2,.18,WOOD);}
      // Muelle largo de pescadores (costa este)
      {const mx=285;for(let z=67;z<SHORE(mx)+26;z+=1.5){box(mx,.42,z,3,.14,1.52,PLANK,'plank');solid(mx,z,3,1.5,.5,z>SHORE(mx)?.12:0);if((z|0)%4===0)for(const sg of [-1,1])box(mx+sg*1.4,-1.4,z,.22,4,.22,WOOD);}
        const ze=SHORE(mx)+27;box(mx,.42,ze+2,9,.14,6,PLANK,'plank');solid(mx,ze+2,9,6,.5,.12);hut(mx+2,ze+2.4,.5);box(mx-3,1,ze+.6,.12,1.2,.12,WOOD);box(mx-3,1.7,ze+1.6,.06,.06,2.2,WOOD);MMR.push([mx,(67+ze)/2,3,ze-67,'#967852']);}
      // tótems, árboles gigantes, selva densa, helechos y flores
      for(const [x,z] of [[124,5.4],[196,5],[262,-8.5],[226,36]]){for(let k=0;k<4;k++)box(x,.5+k,z,1,1,1,['#b0463c','#e9c24a','#2f7a8a','#5d4634'][k]);box(x,4.3,z,2.2,.5,.5,'#e9c24a');for(let k=0;k<4;k++)for(const sg of [-1,1])box(x+sg*.26,.6+k,z+.51,.2,.2,.04,'#22272e');solid(x,z,1,1,4.5);claim(x,z,1,1);}
      MAPTAG='J';
      const sunTemple=(x,z)=>{mesa(x,z,10,10,5,'#c9c4a8','#b8b296');const y=2.5;
        for(const sx of [-1,1])for(const sz of [-1,1]){box(x+sx*3.6,y+2,z+sz*3.6,.9,4,.9,'#b8b296');solid(x+sx*3.6,z+sz*3.6,.9,.9,y+4,y);}
        box(x,y+4.3,z,9,.5,9,'#c9c4a8');box(x,y+4.8,z,6,.4,6,'#b8b296');box(x,y+.5,z,1.8,1,1.8,'#8d9084');solid(x,z,1.8,1.8,y+1,y);box(x,y+1.2,z,1,.4,1,'#6f7c73');box(x,y+1.6,z,.5,.5,.5,'#ff9a3c');box(x,y+2,z,.3,.5,.3,'#fff0b1');
        box(x,y+3.2,z-4.3,2.4,2.4,.3,GOLD);box(x,y+3.2,z-4.1,1.6,1.6,.3,'#ffe27a');
        for(let i=0;i<6;i++)for(const sx of [-1,1]){const cz=z+13+i*3.6,h=3+(i%2)*.8;box(x+sx*3.2,h/2,cz,.9,h,.9,'#b8b296');solid(x+sx*3.2,cz,.9,.9,h);if(lr()<.5)box(x+sx*3.2+.5,h/2,cz,.08,h*.8,.4,'#3a8f4a');}
        flat(x,z+22,3.6,21,'#cfc9ae',.02);for(let i=0;i<10;i++)flat(x,z+14+i*2,2.4,.1,'#b8b296',.026);claim(x,z+10,12,26);MMR.push([x,z+10,20,40,'#b8b296']);};
      const jmarket=(x,z)=>{const cs=['#d8433b','#3f7a4f','#e9c24a','#2f7a8a','#b98cff'];for(let i=0;i<4;i++)for(const sz of [-1,1])puesto(x+i*4.4,z+sz*3.3,pick3(cs));
        for(let k=0;k<12;k++){const cx=x+lr()*14,cz=z+(lr()-.5)*3.4;if(lr()<.5){box(cx,.4,cz,.8,.8,.8,'#a57f27');solid(cx,cz,.8,.8,.8);}else{box(cx,.5,cz,.7,1,.7,'#8a5a2a');solid(cx,cz,.7,.7,1);}}
        box(x+6.6,4.2,z,14,.05,.05,'#2a3b4a');for(let i=0;i<7;i++)box(x+i*2.2,3.85,z,.4,.5,.4,i%2?'#fff0b1':'#e2504a');flat(x+6.6,z,15,9,DIRT,.02);claim(x+6.6,z,9,6.5);MMR.push([x+6.6,z,15,9,'#b9a27a']);};
      const mirador=(x,z)=>{hill(x,z,6,6,8,'#4f9a4a','#448f45');hut(x,z,4);box(x+2.6,4.6,z+2.6,.12,1.4,.12,WOOD);box(x+2.6,5.4,z+2.6,.5,.5,.5,'#ff9a3c');claim(x,z,12,12);};
      const cabanas=(x,z)=>{for(let k=0;k<4;k++){const a=k/4*TAU+.4;deck(x+Math.cos(a)*8,z+Math.sin(a)*8,6,5,.5);hut(x+Math.cos(a)*8,z+Math.sin(a)*8,.5);}
        for(let i=0;i<8;i++){const a=i/8*TAU;box(x+Math.cos(a)*1.1,.14,z+Math.sin(a)*1.1,.4,.28,.4,i%2?'#8c9195':'#a3a8ab');}box(x,.2,z,1,.2,.2,'#6b4a3a','log');box(x,.2,z,.2,.2,1,'#6b4a3a','log');box(x,.6,z,.4,.6,.4,'#ff9a3c');box(x,1,z,.25,.4,.25,'#fff0b1');solid(x,z,2,2,.5);
        for(let k=0;k<4;k++){const a=k/4*TAU+.4+.78;logs(x+Math.cos(a)*3.2,z+Math.sin(a)*3.2);}claim(x,z,12,12);};
      placeN(2,125,305,-118,40,(x,z)=>free(x,z,14)&&free(x,z+20,6),sunTemple);
      placeN(2,125,305,-118,50,(x,z)=>free(x+6.6,z,10),jmarket);
      placeN(2,125,320,-118,50,(x,z)=>free(x,z,10),mirador);
      placeN(2,125,310,-118,50,(x,z)=>free(x,z,13),cabanas);
      scatter(300,120,325,-126,64,2.4,(x,z)=>flat(x,z,2+lr()*3.2,2+lr()*3.2,pick3(['#3a8f4a','#2f7a3f','#4f8a45','#6b8f4a','#8a7a4a']),.017));
      shore();
      scatter(34,122,324,-122,62,5.5,(x,z)=>jtree(x,z,3));
      scatter(230,120,325,-124,63,2.6,(x,z)=>jtree(x,z,lr()<.3?1:0));
      scatter(420,118,326,-126,64,.5,(x,z)=>{const r=lr();if(r<.45){box(x,.3,z,1.1+lr()*.8,.6,1.1+lr()*.8,r<.2?'#2f7a3f':'#3a8f4a','leaves');}else if(r<.75)box(x,.2,z,.18,.4,.18,['#e2504a','#ff9a3c','#b98cff','#ffd35c'][(r*40|0)%4]);else if(r<.9){box(x,.3,z,.2,.6,.2,'#e9dfc0');box(x,.7,z,.7,.3,.7,'#d8433b');}else box(x,.3,z,1+lr()*.8,.6,.9+lr()*.6,ROCK);});

      // ---------- Valle Sakura: más árboles de varias especies, flores, rocas y rincones ----------
      MAPTAG='B';
      const pine=(x,z)=>{const h=5+lr()*3;box(x,h*.4,z,.45,h*.8,.45,'#5b4332','log');solid(x,z,.45,.45,h*.8);for(let i=0;i<4;i++){const w=3.4-i*.7;box(x,h*.45+i*1.15+.6,z,w,.9,w,i%2?'#2f6b45':'#2a5f3c','leaves');}};
      const maple=(x,z)=>{const cs=['#d9532e','#e8782f','#c43b30'];box(x,1.1,z,.45,2.2,.45,'#6b4a3a','log');solid(x,z,.45,.45,2.3);box(x,3.2,z,3.2,1.5,3.2,pick3(cs),'leaves');box(x+.3,4.2,z-.2,2.2,1,2.2,pick3(cs),'leaves');};
      const ginkgo=(x,z)=>{box(x,1.3,z,.5,2.6,.5,'#6b4a3a','log');solid(x,z,.5,.5,2.7);box(x,3.4,z,2.8,1.6,2.8,'#f2c94c','leaves');box(x,4.5,z,1.8,1,1.8,'#f7dd7a','leaves');};
      const hydr=(x,z)=>{box(x,.35,z,1.1,.7,1.1,'#4f8a4a','leaves');box(x,.78,z,.9,.3,.9,pick3(['#7aa8ff','#c79bff','#ff9ec8','#9fe0ff']));};
      const SB=['#5f9a55','#4f8a4a','#6fb060'];
      const shrine=(x,z,ry)=>{   // pequeño santuario de camino: torii, linternas y capilla
        torii(x,z,ry,3.4,3.8,RED);toro(x+(ry?0:-2.6),z+(ry?-2.6:0));toro(x+(ry?0:2.6),z+(ry?2.6:0));
        const cx=x+(ry?4.2:0),cz=z+(ry?0:4.2);box(cx,.3,cz,3,.6,3,'#a3a8ab');solid(cx,cz,3,3,.6);box(cx,1.5,cz,1.9,1.8,1.7,CREAM);box(cx,2.8,cz,3,.3,2.8,TILE);box(cx,3.15,cz,2,.4,1.6,TILE);solid(cx,cz,1.9,1.7,3.4,.6);claim(x,z,6,6);};
      pond(-262,-246,-30,-18,1.6);pond(-152,-139,-62,-49,1.6);pond(-205,-193,-78,-68,1.4);
      scatter(14,-325,-120,-125,62,8,(x,z)=>shrine(x,z,lr()<.5));
      scatter(16,-252,-150,-126,-78,6.5,(x,z)=>{const nor=['#2f5d8a','#7a2f3a','#3f7a4f','#b8902c','#5a3f7a'];casa(x,z,5,4.6,lr()<.5?1:-1,pick3(nor));});   // granjas sueltas
      scatter(40,-326,-122,-126,62,10,(x,z)=>hill(x,z,6+lr()*8,6+lr()*8,3+(lr()*4|0),'#8fcf6a','#7bc05c'));
      scatter(240,-326,-118,-128,63,3.2,(x,z)=>sakura(x,z));
      scatter(130,-326,-118,-128,63,3,(x,z)=>pine(x,z));
      scatter(90,-326,-118,-128,63,3,(x,z)=>maple(x,z));
      scatter(46,-326,-118,-128,63,3,(x,z)=>ginkgo(x,z));
      for(let i=0;i<46;i++)scatter(1,-325,-118,-126,62,3,(x,z)=>{for(let k=0;k<8;k++){const h=5+lr()*3,xx=x+(lr()-.5)*2.6,zz=z+(lr()-.5)*2.6;box(xx,h/2,zz,.2,h,.2,lr()<.6?'#7fb069':'#93c47d');solid(xx,zz,.22,.22,h);box(xx,h+.1,zz,1.2,.5,1.2,'#5f9a55','leaves');}});   // matas de bambú
      scatter(520,-326,-118,-128,63,1.6,(x,z)=>bush(x,z,SB));
      scatter(220,-326,-118,-128,63,1.6,(x,z)=>hydr(x,z));
      scatter(900,-326,-118,-128,63,.5,(x,z)=>{const r=lr();box(x,.14,z,.14,.28,.14,pick3(['#f3a2cb','#fbd0e0','#e9fbff','#ffd35c','#c79bff']));if(r<.5)box(x+.3,.12,z+.2,.14,.24,.14,pick3(['#f3a2cb','#fff0b1']));});
      scatter(130,-326,-118,-128,63,1.8,(x,z)=>rock(x,z));
      scatter(34,-326,-118,-128,63,2.4,(x,z)=>logs(x,z));
      scatter(60,-326,-118,-128,63,1.6,(x,z)=>{toro(x,z);});   // linternas de piedra sueltas por el valle

      // ---------- Selva Esmeralda: selva más densa, plantas grandes, hongos, troncos y colinas ----------
      MAPTAG='J';
      pond(160,176,-60,-48,1.6);pond(250,263,22,34,1.8);pond(300,314,-20,-8,1.6);
      const giant=(x,z)=>{jtree(x,z,3);for(let k=0;k<5;k++){const a=lr()*TAU,l=3+lr()*6;box(x+Math.cos(a)*1.8,9-l/2,z+Math.sin(a)*1.8,.08,l,.08,'#2f7a3f');}};   // árbol gigante con lianas
      const banana=(x,z)=>{box(x,1.2,z,.18,2.4,.18,'#6b8f3a');box(x,2.5,z,2.6,.08,.7,'#3a8f3a','leaves');box(x,2.4,z,.7,.08,2.6,'#3a8f3a','leaves');box(x+.5,2.1,z+.5,1.6,.08,.6,'#2f7a3f','leaves');if(lr()<.5)box(x,2.1,z,.35,.5,.35,'#e9c24a');};
      const palm=(x,z)=>{const h=5+lr()*3;for(let i=0;i<5;i++)box(x+i*.05,i*h/5+h/10,z,.5-i*.05,h/5+.05,.5-i*.05,'#8a6a45','log');solid(x,z,.45,.45,h);box(x,h+.2,z,3.6,.12,.8,'#2f8f45','leaves');box(x,h+.2,z,.8,.12,3.6,'#2f8f45','leaves');box(x,h+.45,z,2.2,.12,.6,'#3aa050','leaves');};
      const fern=(x,z)=>{box(x,.3,z,1.2+lr()*.9,.6,1.2+lr()*.9,pick3(['#2f8f45','#3a9f50','#27793a']),'leaves');box(x,.7,z,.5,.5,.5,'#3a9f50','leaves');};
      const shroom=(x,z)=>{const n=2+(lr()*3|0),c=pick3(['#d8433b','#e9c24a','#b98cff','#f6f0dc']);for(let k=0;k<n;k++){const xx=x+(lr()-.5)*1.1,zz=z+(lr()-.5)*1.1,h=.25+lr()*.4;box(xx,h/2,zz,.12,h,.12,'#e9dfc0');box(xx,h+.08,zz,.42,.16,.42,c);}};
      const orchid=(x,z)=>{box(x,.45,z,.08,.9,.08,'#3a8f4a');box(x,.95,z,.4,.28,.4,pick3(['#ff6aa8','#b98cff','#ff9a3c','#ffd35c']));};
      scatter(36,120,325,-126,62,10,(x,z)=>hill(x,z,6+lr()*8,6+lr()*8,3+(lr()*4|0),'#4f9a4a','#448f45'));
      scatter(70,120,325,-124,63,5.5,(x,z)=>giant(x,z));
      scatter(260,120,325,-124,63,2.8,(x,z)=>jtree(x,z,lr()<.3?1:0));
      scatter(120,120,325,-124,63,2.6,(x,z)=>palm(x,z));
      scatter(90,120,325,-124,63,2.2,(x,z)=>banana(x,z));
      scatter(620,120,325,-126,64,1.4,(x,z)=>fern(x,z));
      scatter(260,120,325,-126,64,1.6,(x,z)=>bush(x,z,['#2f7a3f','#3a8f4a','#27693a']));
      scatter(100,120,325,-126,64,1.2,(x,z)=>shroom(x,z));
      scatter(240,120,325,-126,64,.7,(x,z)=>orchid(x,z));
      scatter(140,120,325,-126,64,1.8,(x,z)=>rock(x,z));
      scatter(40,120,325,-126,64,2.4,(x,z)=>logs(x,z));
      // muros de montañas en los lados que cierran cada mapa
      for(let z=-136;z<=70;z+=21){const q=lq;MAPTAG='B';lq=q;mount0(-48+(lr()-.5)*4,z,24+lr()*8,12+lr()*18);MAPTAG='J';lq=q+1;mount0(58+(lr()-.5)*4,z,24+lr()*8,12+lr()*18);}
      MAPTAG='J';
      // minimapa del mundo ampliado
      CITY.mmExtra=(g,r)=>{const id=MAPCUR.id;g.fillStyle=id==='J'?'#2f5a38':'#4f7a52';r(id==='J'?196:-199,-33,id==='J'?260:280,200);
        for(const m of MMR){if(m.map!==id)continue;g.fillStyle=m[4]||(m[2]*m[3]>300?'#d9cdb0':'#c9bd9c');r(m[0],m[1],m[2],m[3]);}
        g.fillStyle='#3b9ecb';for(const l of LAKES)if(l.map===id)r((l.x0+l.x1)/2,(l.z0+Math.min(l.z1,96))/2,l.x1-l.x0,Math.min(l.z1,96)-l.z0);};
    }
    // --- Campamento del Bosque (claro del este): hoguera, tiendas y troncos para sentarse
    MAPTAG='J';
    {
      const CX=91,CZ=2.6,DIRT='#b9a27a';
      flat(89,1,15,13,DIRT,.016);flat(70.5,0,17,2.2,DIRT,.016);
      for(let i=0;i<8;i++){const a=i/8*TAU;box(CX+Math.cos(a)*.85,.14,CZ+Math.sin(a)*.85,.42,.28,.42,i%2?'#8c9195':'#a3a8ab');}
      box(CX,.2,CZ,1.1,.2,.22,'#6b4a3a','log');box(CX,.2,CZ,.22,.2,1.1,'#6b4a3a','log');box(CX,.55,CZ,.5,.6,.5,'#ff9a3c');box(CX,.95,CZ,.3,.5,.3,'#fff0b1');box(CX+.12,.4,CZ-.1,.7,.3,.7,'#e2504a');solid(CX,CZ,1.9,1.9,.5);
      CITY.campfire={x:CX,z:CZ};
      for(const [ox,oz,t] of [[0,2.6,0],[0,-2.6,0],[2.6,0,1]]){const w=t?.55:2.2,d=t?2.2:.55;box(CX+ox,.28,CZ+oz,w,.56,d,'#81654a','log');solid(CX+ox,CZ+oz,w,d,.56);}
      const tent=(x,z,c,c2)=>{for(let i=0;i<5;i++)box(x,.25+i*.5,z,3-i*.62,.5,3.4,i%2?c2:c);box(x,.9,z+1.72,1,1.5,.05,'#22272e');solid(x,z,3,3.4,2.5);};
      tent(95.5,-4.4,'#d8433b','#b0463c');tent(84.6,7.2,'#3f7a4f','#356a44');
      box(86.2,1.5,-3.6,.16,3,.16,'#5a3d2e');box(86.2,3.1,-3.6,.42,.5,.42,'#fff0b1');box(86.2,3.42,-3.6,.56,.12,.56,'#2a2f3a');solid(86.2,-3.6,.2,.2,3.4);
      box(96.6,.4,5.2,.9,.8,.9,'#967852','plank');box(96.4,1.1,5.3,.7,.6,.7,'#967852','plank');box(95.5,.3,5.6,.8,.6,.8,'#81654a','log');solid(96.3,5.3,1.9,1.1,1.4);
      box(80.6,1.1,-2,.18,2.2,.18,'#5a3d2e');solid(80.6,-2,.2,.2,2.4);bsign('CAMPAMENTO DEL BOSQUE',80.5,2.5,-2,3.4,-Math.PI/2,'#3f5a3a');
      for(let i=0;i<14;i++){const x=62.5+lr()*16,z=(lr()<.5?-1:1)*(1.5+lr()*.8);box(x,.16,z,.16,.32,.16,['#f3a2cb','#ffd35c','#e9fbff'][i%3]);}
    }
    // --- Lago Aurora (claro del norte): lago con embarcadero, bote y mirador
    MAPTAG='A';
    {
      const LX=0,LZ=-98,DIRT='#b9a27a';
      flat(0,-74,2.2,22,DIRT,.016);flat(0,-87.6,9,6,DIRT,.016);
      flat(LX,LZ,24,13,'#3b86ad',.035);flat(LX,LZ,22,11.2,'#5fb8d6',.045);for(const [ox,oz,w] of [[-6,-2,2.2],[5,1.6,1.6],[-1,3,1.2],[8,-3.4,1.8]])flat(LX+ox,LZ+oz,w,.5,'#e8f7ff',.055);
      for(let i=0;i<26;i++){const a=i/26*TAU;box(LX+Math.cos(a)*12.3,.16,LZ+Math.sin(a)*6.9,.8+lr()*.6,.32,.7+lr()*.5,i%3?'#8c9195':'#a3a8ab');}
      for(const [ox,oz] of [[-7,2.4],[-4.4,-3.2],[6.6,-1.4],[3,3.4],[9,2.2],[-9,-1.2]]){flat(LX+ox,LZ+oz,.9,.9,'#4f9a5b',.06);if(lr()<.6)box(LX+ox,.12,LZ+oz,.24,.14,.24,'#f3a2cb');}
      for(let zz=-91.6;zz>=-97.2;zz-=.8){box(0,.22,zz,2.2,.1,.74,'#967852','plank');}solid(0,-94.4,2.2,6.4,.27);for(const sg of [-1,1])for(const zz of [-92,-97])box(sg*1.1,.4,zz,.2,.9,.2,'#5a3d2e');
      box(3.4,.22,-96.4,1.3,.3,2.8,'#b0463c');box(3.4,.4,-96.4,1,.1,2.4,'#967852','plank');box(3.4,.5,-96.4,1.2,.08,.3,'#5a3d2e');
      for(const [ox,oz] of [[-10.6,4.6],[10.4,4.8],[-11.6,-4],[11.2,-4.4]])for(let k=0;k<4;k++)box(LX+ox+(lr()-.5)*1.2,.6,LZ+oz+(lr()-.5)*1.2,.1,1.2+lr()*.5,.1,k%2?'#7fb069':'#b08d57');
      {const gx=8.6,gz=-86.6;box(gx,.2,gz,4.6,.4,4.6,'#a3a8ab');solid(gx,gz,4.6,4.6,.4);
        for(const sx of [-1,1])for(const sz of [-1,1]){box(gx+sx*1.9,2,gz+sz*1.9,.26,3.2,.26,'#f6f3ec');solid(gx+sx*1.9,gz+sz*1.9,.26,.26,3.6);}
        box(gx,3.7,gz,5.4,.26,5.4,'#577d7d');box(gx,4.05,gz,3.8,.44,3.8,'#577d7d');box(gx,4.45,gz,2,.36,2,'#577d7d');box(gx,4.8,gz,.4,.4,.4,'#e9c24a');
        box(gx+1.9,.95,gz,.14,.12,3.6,'#f6f3ec');box(gx,.95,gz-1.9,3.6,.12,.14,'#f6f3ec');box(gx,.72,gz+.2,1.8,.14,.6,'#967852','plank');solid(gx,gz+.2,1.8,.6,.8,.4);}
      box(-3.2,1.1,-84.4,.18,2.2,.18,'#5a3d2e');solid(-3.2,-84.4,.2,.2,2.4);bsign('LAGO AURORA',-3.2,2.5,-84.3,3,0,'#1d5f7a');
      bench(-6.4,-89.4);box(-8.6,1.5,-88,.16,3,.16,'#435766');box(-8.6,3.1,-88,.42,.5,.42,'#fff0b1');solid(-8.6,-88,.2,.2,3.4);
      for(let i=0;i<14;i++){const z=-63.5-lr()*19,x=(lr()<.5?-1:1)*(1.5+lr()*.8);box(x,.16,z,.16,.32,.16,['#f3a2cb','#ffd35c','#e9fbff'][i%3]);}
    }
    // --- Farolillos colgados sobre las cuatro entradas de la plaza (solo adorno: quedan por encima de las cabezas)
    for(const [ax,az,alongX] of [[0,-11.4,1],[0,11.4,1],[-11.4,0,0],[11.4,0,0]]){
      box(ax,5.3,az,alongX?10.8:.05,.05,alongX?.05:10.8,'#2a3b4a');
      for(let i=-2;i<=2;i++){const x=ax+(alongX?i*2.1:0),z=az+(alongX?0:i*2.1),y=5.3-.42-Math.abs(i)*-.06-(i===0?.16:0);
        box(x,y,z,.44,.52,.44,i%2?'#fff0b1':'#e2504a');box(x,y+.3,z,.3,.08,.3,'#2a3b4a');box(x,y-.3,z,.2,.08,.2,'#e9c24a');}
    }
    // --- Gato de la suerte gigante en la azotea del ramen (se ve desde lejos)
    {const rb=CITY_PLAN.find(q=>q.model==='ramen');
      if(rb){const fc=rb.z<0?1:-1,cx=rb.x-4.6,cz=rb.z+fc*(rb.d/2-1.9),y0=rb.h+.15,W='#f6f3ec';
        box(cx,y0+.1,cz,2.5,.2,2.2,'#b0463c');box(cx,y0+1.2,cz,1.8,2,1.5,W);box(cx,y0+2.95,cz,1.95,1.5,1.55,W);
        for(const sg of [-1,1]){box(cx+sg*.66,y0+3.9,cz,.5,.5,.4,W);box(cx+sg*.66,y0+3.86,cz+fc*.16,.26,.3,.1,'#f3a2cb');box(cx+sg*.44,y0+3.1,cz+fc*.79,.22,.3,.06,'#22272e');box(cx+sg*.72,y0+2.72,cz+fc*.79,.3,.05,.05,'#22272e');}
        box(cx,y0+2.82,cz+fc*.8,.2,.14,.06,'#f3a2cb');box(cx,y0+2.18,cz,2,.22,1.62,'#d8433b');box(cx,y0+2.02,cz+fc*.82,.32,.32,.14,'#e9c24a');
        box(cx+1.14,y0+2.9,cz+fc*.2,.5,1.6,.6,W);box(cx+1.14,y0+3.78,cz+fc*.35,.56,.4,.7,W);box(cx-.5,y0+1.05,cz+fc*.82,.95,1.2,.12,'#e9c24a');box(cx-.5,y0+1.05,cz+fc*.9,.5,.7,.04,'#b8902c');
        box(cx-.3,y0+.7,cz-fc*.95,.3,.9,.3,W);box(cx+.5,y0+.35,cz+fc*.8,.6,.5,.4,W);}}
    // --- Arco del muelle, en el paseo marítimo
    for(const sg of [-1,1]){box(sg*3.7,2.5,71.7,.55,5,.55,'#b0463c');solid(sg*3.7,71.7,.55,.55,5);box(sg*3.7,.2,71.7,.9,.4,.9,'#7e2f29');}
    box(0,5.05,71.7,8.9,.5,.7,'#b0463c');box(0,5.6,71.7,10.2,.32,.95,'#7e2f29');box(0,4.3,71.7,7,.16,.3,'#b0463c');
    bsign('MUELLE · PLAYA DE SEKZA',0,4.72,71.3,5.6,Math.PI,'#1d5f7a');bsign('CIUDAD AURORA',0,4.72,72.1,5.6,0,'#7a2f3a');
    for(const sg of [-1,1]){box(sg*3.7,5.95,71.7,.4,.5,.4,'#fff0b1');box(sg*3.7,6.25,71.7,.56,.12,.56,'#7e2f29');}
    // --- Ascensor de la Torre Aurora: cartel fuera de la entrada y haz de luz sobre la caseta de la azotea, para encontrarlo
    {const T=CITY_PLAN.find(b=>b.label==='TORRE AURORA');
      if(T){const fc=T.z<0?1:-1;bsign('ASCENSOR A LA AZOTEA',T.x,6.9,T.z+fc*(T.d/2+.95),6.4,fc>0?0:Math.PI,'#1b2330');
        const beam=new THREE.Mesh(new THREE.BoxGeometry(.7,18,.7),new THREE.MeshBasicMaterial({color:0x7ad7ff,transparent:true,opacity:.2,depthWrite:false,fog:false}));
        beam.position.set(T.x,T.h+3.9+9,T.z-fc*(T.d/2-2.6));beam.visible=false;beam.userData.map=MAPTAG;scene.add(beam);betaObjs.push(beam);}}
  }
  BETA_ON=false;MAPTAG='A';
  // Contornos de arquitectura: líneas sobrias que acentúan la silueta del barrio.
  const edgePositions=[];
  for(const b of CITY.buildings){
    if(b.model)continue;
    const y0=b.accessible?b.base:0,y1=b.h+.18,x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;
    const corners=[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    for(const [a,c]of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])edgePositions.push(...corners[a],...corners[c]);
  }
  const edges=new THREE.BufferGeometry();edges.setAttribute('position',new THREE.Float32BufferAttribute(edgePositions,3));
  CITY.edges=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:0x27394e,transparent:true,opacity:.52}));
  CITY.edges.frustumCulled=false;scene.add(CITY.edges);
  // Murales pixelados originales en las fachadas laterales.
  for(const [i,b]of CITY.buildings.entries())if((i===3||i===6)&&!b.model){
    const tex=pixTex(64,48,g=>{
      g.fillStyle=i===3?'#306f8a':'#805b9a';g.fillRect(0,0,64,48);
      g.fillStyle='#ecc868';g.fillRect(8,8,14,14);g.fillStyle='#91d4d0';
      for(let k=0;k<5;k++)g.fillRect(k*15-4,40-k*5,18,30);
      g.fillStyle='#e9d9bc';g.fillRect(42,9,12,3);g.fillRect(39,12,18,3);g.fillRect(45,6,6,3);
    });
    const mural=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),cityAnimeMaterial(new THREE.MeshLambertMaterial({map:tex})));
    mural.position.set(b.x+b.w/2+.2,1.7,b.z);mural.rotation.y=Math.PI/2;scene.add(mural);addPropCull(mural,b.x+b.w/2+.2,1.7,b.z,2.5,.75);
  }
  // Flores y bancos bajos en los parques, fuera de las entradas y reapariciones.
  for(const p of CITY.parks){
    for(let i=0;i<7;i++){
      const a=i/7*TAU,x=p.x+Math.cos(a)*2.15,z=p.z+Math.sin(a)*1.8;
      box(x,.17,z,.06,.34,.06,'#449774');box(x,.39,z,.24,.17,.24,i%2?'#f3a2cb':'#f1ce71');
    }
  }

  for(const batch of batches.values()){
    const road=['#46515d','#56616a','#958e7c'].includes(batch.color),facade=facadeColors.includes(batch.color);
    const texture=batch.tex?BLOCK_TEX[batch.tex]:road?asphalt:facade?plaster:null;
    const matOpts={color:batch.color,shininess:road?8:12,specular:0x15202a,bumpScale:facade?.025:.018,emissive:batch.tex==='lamp'?batch.color:0x000000};
    if(texture) matOpts.map=texture;
    const bump=facade?plaster:road?asphalt:null; if(bump) matOpts.bumpMap=bump;
    const mat=new THREE.MeshPhongMaterial(matOpts);
    if(road)CITY.wetMaterials.push(mat);
    if(['#77b3c6','#7fb5c5','#aac5d1'].includes(batch.color))CITY.windowMaterials.push(mat);
    if(batch.color==='#fff0b1')CITY.lampMaterials.push(mat);
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),mat,batch.items.length);
    batch.items.forEach((p,i)=>{matrix.compose(xyz.set(p[0],p[1],p[2]),rotation,size.set(p[3],p[4],p[5]));mesh.setMatrixAt(i,matrix);const tower=p.pop();if(tower)tower.parts.push({mesh,index:i});if(!road&&!batch.beta&&!batch.pub&&p[4]>.15&&p[4]<70&&Math.max(p[3],p[5])<45&&p[3]*p[4]*p[5]<=7000)(window.DESTR||(window.DESTR=[])).push({m:mesh,i,p,col:batch.color,isBuilding:true});});
    cityAnimeMaterial(mat);mesh.castShadow=true;mesh.receiveShadow=true;mesh.updateMatrix();mesh.matrixAutoUpdate=false;mesh.frustumCulled=false;scene.add(mesh);
    if(batch.beta){mesh.userData.betaN=batch.items.length;mesh.count=0;betaMeshes.push(mesh);}
    if(batch.pub){mesh.userData.betaN=batch.items.length;mesh.userData.own=batch.own;pubMeshes.push(mesh);}
    mesh.userData.map=batch.map;
    {let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,z0=1e9,z1=-1e9;for(const p of batch.items){x0=Math.min(x0,p[0]-p[3]/2);x1=Math.max(x1,p[0]+p[3]/2);y0=Math.min(y0,p[1]-p[4]/2);y1=Math.max(y1,p[1]+p[4]/2);z0=Math.min(z0,p[2]-p[5]/2);z1=Math.max(z1,p[2]+p[5]/2);}
    mesh.userData.cull=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(y0+y1)/2,(z0+z1)/2),Math.hypot(x1-x0,y1-y0,z1-z0)/2);(CITY.cull||(CITY.cull=[])).push(mesh);}
  }
  CITY.betaApply=on=>{
    const id=MAPCUR.id;
    for(const m of betaMeshes)m.count=(on&&m.userData.map===id)?m.userData.betaN:0;
    for(const m of pubMeshes)m.count=(!on||(id==='A'&&m.userData.own!=='A'))?m.userData.betaN:0;
    for(const o of betaObjs)o.visible=!!on&&o.userData.map===id;
    for(const o of pubObjs)o.visible=!on;
    LAKES.on=!!on;if(CITY.bigGround)CITY.bigGround(!!on);
    // lo del otro mapa sale de las colisiones: las de la ciudad (sin etiqueta) se guardan mientras se está en el Valle
    const baseOff=!!on&&id!=='A';
    if(baseOff&&!CITY.colStash){CITY.colStash=COL.filter(c=>!c.bm&&c.map!=='B');const st=new Set(CITY.colStash);let j=0;for(let i=0;i<COL.length;i++)if(!st.has(COL[i]))COL[j++]=COL[i];COL.length=j;}
    else if(!baseOff&&CITY.colStash){for(const c of CITY.colStash)COL.push(c);CITY.colStash=null;}
    for(const [list,want] of [[betaCols,c=>!!on&&c.map===id],[pubCols,c=>!on||(id==='A'&&c.own!=='A')]])for(const c of list){const i=COL.indexOf(c),w=want(c);if(w&&i<0)COL.push(c);else if(!w&&i>=0)COL.splice(i,1);}
    colMarkDirty();if(CITY.modelsReady&&typeof rebuildCityNav==='function')rebuildCityNav();CULL.dirty=true;};
  // NUBES: racimos de bloques (base plana y varios bultos encima), mas altas y mas lejos; el color lo pone el clima (blanco de dia, rosado al atardecer, azul oscuro de noche, gris con tormenta)
  const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,fog:false}),cloudBase=new THREE.MeshBasicMaterial({color:0xdfe6f0,transparent:true,opacity:.9,fog:false});
  CITY.cloudMat=cloudMat;CITY.cloudBase=cloudBase;
  for(let i=0;i<30;i++){
    const g=new THREE.Group(),w=16+(i%5)*4,d=9+(i%3)*3,seed=i*7.13;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w,2.2,d),cloudBase));
    for(let k=0;k<3+(i%3);k++){
      const bw=w*(.28+((seed+k*3.7)%1)*.22),bd=d*(.4+((seed+k*5.1)%1)*.3),bh=2+((seed+k*2.3)%1)*2.6;
      const top=new THREE.Mesh(new THREE.BoxGeometry(bw,bh,bd),cloudMat);
      top.position.set((((seed+k*1.9)%1)-.5)*w*.7,1.0+bh/2,(((seed+k*4.3)%1)-.5)*d*.5);g.add(top);
    }
    const a=i*2.4+(i%2)*.7,r=60+((i*37)%190);
    g.position.set(Math.cos(a)*r,52+(i%5)*4.5,Math.sin(a)*r);g.rotation.y=(i%4)*.4;scene.add(g);CLOUDS.push(g);
  }
  const sunQ=new THREE.Mesh(new THREE.PlaneGeometry(16,16),new THREE.MeshBasicMaterial({color:0xfff6c4,fog:false}));
  sunQ.position.set(120,140,70);sunQ.lookAt(0,0,0);scene.add(sunQ);CITY.sunDisc=sunQ;
}

// Vegetación de las zonas verdes
{
  const tufts = [], flowers = [];
  for (let i = 0; i < 9000; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * (ARENA - 1), x = Math.cos(a) * r, z = Math.sin(a) * r; if (!cityGrassAt(x,z) || COL.some(c => Math.abs(x - c.x) < c.hx + .3 && Math.abs(z - c.z) < c.hz + .3)) continue; (Math.random() < .1 ? flowers : tufts).push([x, z]); }
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new V3(), Pp = new V3(), E = new THREE.Euler();
  const tm = new THREE.InstancedMesh(new THREE.BoxGeometry(.045, 1, .045), new THREE.MeshLambertMaterial({ color: 0xffffff }), tufts.length);
  tm.frustumCulled = false; tm.matrixAutoUpdate = false;
  tufts.forEach(([x, z], i) => { const h = rand(.1, .28); E.set(rand(-.3, .3), rand(0, TAU), rand(-.3, .3)); Q.setFromEuler(E); M.compose(Pp.set(x, h / 2, z), Q, S.set(1, h, 1)); tm.setMatrixAt(i, M); tm.setColorAt(i, _c.setHSL(rand(.24, .32), rand(.4, .6), rand(.32, .46))); });
  scene.add(tm); CITY.grassMesh = tm; CITY.grassMax = tufts.length;
  const fm = new THREE.InstancedMesh(new THREE.BoxGeometry(.14, .14, .14), new THREE.MeshLambertMaterial({ color: 0xffffff }), flowers.length * 2);
  fm.frustumCulled = false; fm.matrixAutoUpdate = false;
  flowers.forEach(([x, z], i) => {
    const h = rand(.25, .4), col = ['#ff4d6d', '#ffd54f', '#ffffff', '#b388ff', '#4fc3f7'][i % 5];
    M.compose(Pp.set(x, h / 2, z), Q.identity(), S.set(.35, h / .14, .35)); fm.setMatrixAt(i * 2, M); fm.setColorAt(i * 2, _c.set('#3e8f2c'));
    M.compose(Pp.set(x, h + .05, z), Q.setFromEuler(E.set(0, rand(0, TAU), 0)), S.set(1, 1, 1)); fm.setMatrixAt(i * 2 + 1, M); fm.setColorAt(i * 2 + 1, _c.set(col));
  });
  scene.add(fm); CITY.flowerMesh = fm; CITY.flowerMax = flowers.length * 2;
}
// ===== Atmósfera y clima de Ciudad Aurora: vive en js/clima/atmosfera.js =====
const { CINE_KEY, CINE_RIM, ROOM_ATMOSPHERE, SKY_OBJS, WORLD, WX, WX_PRESETS, WX_ROOM, adoptAtmosphere, advanceAtmosphere, atmosphereCommand, atmosphereLeader, atmospherePayload, atmospherePlayers, buildLightningVisual, canEditAtmosphere, cityWeatherAudio, cityWeatherNow, initWeatherControls, lightningDamage, saveCityWeather, setCityTime, setCityWeather, syncWeatherControls, updateAtmosphereStrikes, updateCityWeather, weatherEntityId, wxLite, wxRandom, wxRandomValue } = CF_CLIMA.crearAtmosfera({ $, ARENA, CITY, CITY_PLAN, COL, HEMI, MAPCUR, SKY, SPAWN_POINTS, SUN_DIR, TAU, V3, ZZZ_U, _c, camera, clamp, colQuery, mapNow, pixTex, scene, sun, updateSunShadowFocus, worldBig, get STAGE() { return STAGE; }, get burst() { return burst; }, get popText() { return popText; }, get G() { return G; }, get chestOf() { return chestOf; }, get soundChannel() { return soundChannel; }, get AC() { return AC; }, get master() { return master; }, get NB() { return NB; }, get nz() { return nz; }, get SND() { return SND; }, get playSnd() { return playSnd; }, get endAction() { return endAction; }, get kill() { return kill; }, get GFX() { return GFX; }, get NET() { return NET; }, get togglePanel() { return togglePanel; } });
// ===== Escenario de la ulti: un espacio estilizado al que viaja el personaje (como en ZZZ) =====
const SHOTS = [.5, 1.0, 1.6];
// Escenario estilizado de ulti y gradación cinemática (ver js/graficos/escenario_ulti.js)
const { STAGE, initStage, stageEnter, stageExit, updateStage, cineGrade } = CF_GRAFICOS.crearEscenarioUlti({
  scene, sun, HEMI, CINE_RIM, CINE_KEY, BLOCK_TEX, rand, TAU, ZZZ_U,
  glowMat: (...a) => glowMat(...a),
  buildSpear: (...a) => buildSpear(...a),
  get Parts() { return Parts; },
  getCHARS: () => CHARS,
  getSkyObjs: () => SKY_OBJS,
  getG: () => G
});
const SEA_Y = -.04;
// profundidad del fondo: baja suave desde la orilla hasta unos -9 m, y cae más profundo en alta mar
function seaFloor(x, z) {
  const d = Math.max(0, z - SHORE(x)), k = 1 - Math.exp(-d / 24);
  const deepDrop = Math.max(0, d - 55) * 0.085;
  return -(.09 + 9.2 * k + deepDrop) + Math.sin(x * .13 + z * .09) * .45 * k + Math.sin(x * .31 - z * .23) * .18 * k;
}
let GUIDE_Y=0;
window.groundAt = groundAt;
const ABY = { x: 0, z: 720, y: -90, R: 72 };   // el abismo: cueva bajo el torbellino del mar profundo (ver js/abismo.js)
const ABY_COR = { hw: 11 };   // medio ancho del pasillo
const ABY_WP = [[-300, 118], [-300, 40], [-262, -34], [-192, -52], [-152, -6], [-144, 50], [-118, 40], [-100, 0], [-78, 0]];   // puntos del camino (relativos al centro de la sala)
const ABY_PTS = (() => { const c = new THREE.CatmullRomCurve3(ABY_WP.map(q => new THREE.Vector3(ABY.x + q[0], 0, ABY.z + q[1])), false, 'centripetal'); return c.getSpacedPoints(260).map(v => [v.x, v.z]); })();
function abyPath(x, z) {   // punto mas cercano del camino: { d: distancia, x, z, i: indice (con decimales) }
  let bd = 1e9, bx = 0, bz = 0, bi = 0;
  for (let i = 0; i < ABY_PTS.length - 1; i++) { const a = ABY_PTS[i], b = ABY_PTS[i + 1], dx = b[0] - a[0], dz = b[1] - a[1]; let u = ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz || 1); u = u < 0 ? 0 : u > 1 ? 1 : u; const px = a[0] + dx * u, pz = a[1] + dz * u, d = Math.hypot(x - px, z - pz); if (d < bd) { bd = d; bx = px; bz = pz; bi = i + u; } }
  return { d: bd, x: bx, z: bz, i: bi };
}
const abyNearPath = (x, z) => x > ABY.x - 335 && x < ABY.x - 55 && z > ABY.z - 85 && z < ABY.z + 150;
const ABY_FLOOR = (x, z) => (Math.hypot(x - ABY.x, z - ABY.z) < ABY.R + 8 || (abyNearPath(x, z) && abyPath(x, z).d < ABY_COR.hw + 1.5)) ? ABY.y : -400;
function abyssClamp(v) {
  const dx = v.x - ABY.x, dz = v.z - ABY.z, d = Math.hypot(dx, dz); if (d <= ABY.R) return v;
  const lim = ABY_COR.hw - 1.2; if (abyNearPath(v.x, v.z)) { const p = abyPath(v.x, v.z); if (p.d <= lim) return v; if (p.d - lim < d - ABY.R) { const k = lim / p.d; v.x = p.x + (v.x - p.x) * k; v.z = p.z + (v.z - p.z) * k; return v; } }
  v.x = ABY.x + dx / d * ABY.R; v.z = ABY.z + dz / d * ABY.R; return v;
}
function groundAt(x,z,footY=0){if(GUIDE_Y&&x>-40&&x<40&&z>-40&&z<40)return GUIDE_Y;if(z>600)return ABY_FLOOR(x,z);let g=(z>SHORE(x)+.2&&z<560&&Math.abs(x)<360)?seaFloor(x,z):0;if(LAKES.on){const lk=lakeAt(x,z);if(lk)g=Math.min(g,lakeFloor(lk,x,z));}const cols=colQuery(x,z,0.26);for(let i=0;i<cols.length;i++){const c=cols[i];if((!c.y0||footY>=c.y0-.15)&&Math.abs(x-c.x)<c.hx+.25&&Math.abs(z-c.z)<c.hz+.25)g=Math.max(g,c.h);}return g;}

// ================= Partículas (bloquecitos) =================
// Materiales toon, outlines y modelos de peleadores (ver js/graficos/materiales_peleador.js)
const matPeleador = CF_GRAFICOS.crearMaterialesPeleador({ V3, noiseRect, shade, ZZZ_U });
const {
  faceRects, makeSkinCanvas, normalizeSkin, detectSlim, headPortrait,
  PX, TOON_GRAD, OUTLINE_MAT, addOutlineOffset, boxUV, fighterToonMaterial, buildModel, disposeModel,
  JESULUTO_BBS, JL_CUBE_FACES, jlTextureFilter, jlCubeGeometry, buildJesulutoModel, buildFighterModel
} = matPeleador;
// Partículas, combate 3D, impact frames, sombras de contacto y auras (ver js/graficos/efectos_combate.js)
const {
  Parts, PS, emit, burst,
  FX, removeFx, addFx, updateFx, ADD, glowMat,
  ringAt, sphereFlash, slashLine, STAR_GEO, impactStar, arcSlash,
  ghost, warnCircle, fireColumn, iceSpikes, iceBlock,
  IMPACT, impactFrame, SPARK_GEO, sparkLines, CRACK_TEX, crackDecal,
  AURA_TEX, updateAura, lightColumn, copiesAround, screenFlash, shakeFrom,
  DN, toScreen, popText, comicPop, updateNums,
  CONTACT_SHADOW_TEX, CONTACT_SHADOW_MAT, updateContactShadow,
  AURA_GEO, updateAwakeningAura, animeDustRing, animeDashSmoke
} = CF_GRAFICOS.crearEfectosCombate({
  scene, camera, ZZZ_U, OUTLINE_MAT,
  V3, TAU, rand, clamp, fwd, easeOut, $, _c,
  getG: () => G,
  getGFX: () => GFX,
  getGFX_CFG: () => GFX_CFG,
  getGradePass: () => gradePass,
  getPerfFx: () => PERF_FX,
  getFxMute: () => FX_MUTE,
  groundAt: (...a) => groundAt(...a),
  later: (...a) => later(...a),
  sfx: (...a) => sfx(...a),
  camPunch: (...a) => camPunch(...a),
  frameTask: (...a) => frameTask(...a)
});
function jlResetBbsExtras(rig) {
  for (const name of rig.animatedExtras) {
    const g = rig.groups[name];
    g.position.copy(rig.rest[name]);
    g.rotation.set(0,0,0);
    g.scale.setScalar(1);
  }
}
const jlPosePosition = new V3(), jlPoseScale = new V3(), jlPoseRotation = new THREE.Quaternion(), jlPoseEuler = new THREE.Euler();
function jlBlendClip(rig, clip, phase, weight) {
  for (const [name, rows] of Object.entries(clip)) {
    const t = phase * (rows.length - 1), i = Math.floor(t);
    const a = rows[i], b = rows[Math.min(i + 1, rows.length - 1)], u = t - i;
    const value = k => a[k] + (b[k] - a[k]) * u;
    const g = rig.groups[name], bind = rig.rest[name];
    jlPosePosition.set(bind.x - value(0)*PX, bind.y + value(1)*PX, bind.z - value(2)*PX);
    // El giro de cámara del rodaje deriva 7°; el ciclo del juego conserva el mismo rumbo al volver a empezar.
    const drift = name === 'film_root' ? (rows[rows.length - 1][4] - rows[0][4]) * phase : 0;
    jlPoseEuler.set(-value(3), value(4) - drift, -value(5), 'ZYX');
    g.position.lerp(jlPosePosition, weight);
    g.quaternion.slerp(jlPoseRotation.setFromEuler(jlPoseEuler), weight);
    g.scale.lerp(jlPoseScale.set(value(6), value(7), value(8)), weight);
  }
}
function jlLocomotion(f, dt, speed, preview = false) {
  const rig = f.model.jlRig;
  if (!rig) return;
  let target = '';
  if (preview || (f.alive && f.onGround && !f.action && !f.choreTrack && !f.forcePose && !f.grabbed &&
      !(f.stun > 0 || f.ragdoll > 0 || f.hurtT > 0 || f.landT > 0 || f.getupT > 0 || f.frozen > 0 || f.dashT > 0) && !f.blocking && !f.swim)) {
    if (preview || speed < .65) target = 'idle';
    else if (Math.abs(wrapA(Math.atan2(f.vel.x, f.vel.z) - f.yaw)) <= Math.PI / 4) target = 'walk';
  }
  const state = f.jlLocomotion || (f.jlLocomotion = {idle:0, walk:0, idlePhase:0, walkPhase:0});
  for (const name of ['idle','walk']) {
    if (target === name) {
      const phase = name + 'Phase';
      state[phase] = (state[phase] + dt * (name === 'idle' ? 1 / 7.65 : speed / 7.2)) % 1;
    }
    state[name] = clamp(state[name] + dt * (target === name ? 7 : -10), 0, 1);
    if (state[name] > 0) jlBlendClip(rig, JESULUTO_BBS[name], state[name + 'Phase'], state[name]);
    else state[name + 'Phase'] = 0;
  }
}

// ===== Efectos de Jesuluto (pantalla, Windows, Clippy, BSOD): vive en js/graficos/jesuluto_fx.js =====
const { JL_CSS, JL_QUOTES, JL_TEX, JL_WIN_GEO, _jv, addScreen, clippyAssist, disposeClippy, drawClippy, jlAwaken, jlBarTex, jlDialogTex, jlDrawScreen, jlErrorCascade, jlFallWindow, jlGlitch, jlLaunchWindow, jlScreen, jlUpdateScreen, jlWinMat, makeClippy, updateJesuluto } = CF_GRAFICOS.crearJesulutoFx({ PX, TAU, V3, burst, camera, emit, fwd, groundAt, popText, rand, rightOf, scene, get G() { return G; }, get enemiesOf() { return enemiesOf; }, get chestOf() { return chestOf; }, get front() { return front; }, get involvesPlayerNear() { return involvesPlayerNear; }, get CLIPPY_VOICES() { return CLIPPY_VOICES; }, get CHARACTER_VOICE_DURATION() { return CHARACTER_VOICE_DURATION; }, get clippySpeak() { return clippySpeak; }, get sfx() { return sfx; }, get later() { return later; }, get trackSkillObj() { return trackSkillObj; }, get applyHit() { return applyHit; }, get explode() { return explode; }, get spawnProj() { return spawnProj; }, get ndt() { return ndt; } });
// ===== ElRandi: palomas, invocación de Capitán Perú (patada y cambio de control) y adaptación tipo Mahoraga =====
const PIG_MATS = {};
function jlPigeon(f, i, o) {
  const mat = c => PIG_MATS[c] || (PIG_MATS[c] = new THREE.MeshLambertMaterial({ color: c })), g = new THREE.Group();
  const part = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); m.position.set(x, y, z); g.add(m); return m; };
  part(.34, .24, .55, '#98a2ad', 0, 0, 0); part(.2, .2, .2, '#7f8a96', 0, .1, .34); part(.06, .05, .12, '#f0a830', 0, .08, .46); part(.24, .1, .2, '#6f56a6', 0, .12, .18);
  const wing = sg => { const w = new THREE.Group(), a = new THREE.Mesh(new THREE.BoxGeometry(.55, .05, .32), mat('#b4bcc6')); a.position.x = sg * .28; w.add(a); w.position.set(sg * .15, .08, 0); g.add(w); return w; };
  const wl = wing(-1), wr = wing(1);
  const a0 = rand(0, TAU), pos = new V3(f.pos.x + Math.cos(a0) * 1.1, f.pos.y + 1.8 + rand(0, .8), f.pos.z + Math.sin(a0) * 1.1); g.position.copy(pos); scene.add(g);
  const nd = ndt(); let life = 0, dir = fwd(f.yaw), done = false, untrack = () => {}; dir = new V3(dir.x, .15, dir.z).normalize();
  const end = () => { if (done) return; done = true; untrack(); g.traverse(q => { if (q.isMesh && q.geometry) q.geometry.dispose(); }); scene.remove(g); };
  untrack = trackSkillObj(f, 3.5, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); life += dt;
    let best = null, bd = 1e9; for (const t of enemiesOf(f)) { const d = chestOf(t).distanceTo(pos); if (d < 22 && d < bd) { bd = d; best = t; } }
    if (best) dir.lerp(chestOf(best).sub(pos).normalize(), Math.min(1, (life < .2 ? 2 : o.fast ? 14 : 9) * dt)).normalize();
    pos.addScaledVector(dir, (o.fast ? 25 : 17) * dt); pos.y += Math.sin(life * 14 + i) * .02; g.position.copy(pos); g.lookAt(pos.clone().add(dir)); const fl = Math.sin(life * 40) * .7; wl.rotation.z = fl; wr.rotation.z = -fl;
    if (best && chestOf(best).distanceTo(pos) < 1) {
      if (applyHit(f, best, { dmg: o.dmg || 2.8, stun: .3, kb: 3, up: 1, color: '#cfd6df' }) && o.marks) addPico(f, best, o.marks); burst(pos.clone(), 10, '#e8ecf0', 5, .12, .4, 0); popText(chestOf(best), ['¡Plaf!', '¡Currrr!', '¡Picotazo!'][i % 3], '#e8ecf0', 16); sfx('hit', pos, .5); end(); return;
    }
    if (life > 2.6 || groundAt(pos.x, pos.z) > pos.y) { burst(pos.clone(), 5, '#e8ecf0', 4, .1, .3, 0); end(); return; }
    if (G.state === 'play') later(0, tick); else end();
  };
  later(0, tick);
}
// --- cambia el personaje de un peleador sin crear otro (la invocación: ElRandi <-> Capitán Perú)
function morphFighter(f, key) {
  const ch = CHARS[key]; if (!ch) return;
  const skin = ch.skinCanvas || makeSkinCanvas(Object.assign({}, ch.skin)), faceC = copyCanvas(skin);
  if (f.wheel) { scene.remove(f.wheel.mesh); f.wheel.mesh.geometry.dispose(); f.wheel.mat.dispose(); f.wheel.tex.dispose(); f.wheel = null; }
  try { disposeModel(f.model); } catch (e) { }
  f.model = buildModel(faceC, !!ch.slim, scene); f.ch = ch; f.skin = skin; setupFace(f, faceC, true); f.anim = new Animator(f.model);
  f.model.root.visible = true; if (f.plate) f.plate.querySelector('span').style.color = ch.color;
  if (f.isPlayer) { buildSkillBar(f); $('hud').style.setProperty('--c', ch.color); headPortrait(f.skin, $('hface')); }
}
function adaptMul(t, att) {
  if (!t.ch.adapt) return 1;
  const key = att.peer || att.name, A = t.adapt || (t.adapt = {}), e = A[key] || (A[key] = { hits: 0, lvl: 0 });
  e.hits++;
  if (t.capDef > 0) { t.capDef = 0; e.lvl = Math.min(3, e.lvl + 1); t.hp = Math.min(t.maxHp, t.hp + 15); popText(chestOf(t), '¡ADAPTADO! +15', '#ffd23f', 24); t.wheelPulse = 1; sfx('counter', t.pos); }
  else if (e.hits % 4 === 0 && e.lvl < 3) { e.lvl++; popText(chestOf(t), 'Adaptación ' + e.lvl, '#ffd23f', 18); t.wheelPulse = 1; }
  t.adaptLvl = Math.max(t.adaptLvl || 0, e.lvl);
  return 1 - [0, .25, .45, .6][e.lvl];
}
function capHud(f) {
  let h = document.getElementById('caphud');
  if (!h) { h = document.createElement('div'); h.id = 'caphud'; h.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:31;pointer-events:none;text-align:center;font:700 18px "Chakra Petch",sans-serif;color:#fff;text-shadow:0 2px 6px #000a;display:none'; h.innerHTML = '<div id="caphudt"></div><div style="width:260px;height:10px;background:#0008;border:2px solid #ffd23f;margin:4px auto 0"><i id="caphudb" style="display:block;height:100%;background:linear-gradient(90deg,#d6222c,#ffd23f)"></i></div>'; document.body.appendChild(h); }
  const on = f && f.isPlayer && f.capRandi && f.capT > 0; h.style.display = on ? 'block' : 'none';
  if (on) { document.getElementById('caphudt').textContent = 'CAPITÁN PERÚ · ' + f.capT.toFixed(1) + ' s'; document.getElementById('caphudb').style.width = Math.min(100, f.capT / 45 * 100) + '%'; }
}
function updateCapitan(f, m, dt, T) {
  if (f.isPlayer) capHud(f);
  if (!f.ch.adapt) { if (f.wheel) { scene.remove(f.wheel.mesh); f.wheel.mesh.geometry.dispose(); f.wheel.mat.dispose(); f.wheel.tex.dispose(); f.wheel = null; } return; }
  let w = f.wheel;
  if (!w) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.translate(64, 64); g.strokeStyle = '#ffd23f'; g.fillStyle = '#ffd23f'; g.lineWidth = 7;
    g.beginPath(); g.arc(0, 0, 44, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
    for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.fillRect(-4, -62, 8, 20); g.fillRect(-3, -40, 6, 30); }
    const tex = new THREE.CanvasTexture(cv), mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), mat);
    scene.add(mesh); w = f.wheel = { mesh, mat, tex, a: 0 };
  }
  w.mesh.visible = f.alive; w.a += dt * (1.2 + (f.adaptLvl || 0) * 1.6 + (f.capDef > 0 ? 5 : 0) + (f.wheelPulse || 0) * 8); f.wheelPulse = Math.max(0, (f.wheelPulse || 0) - dt * 2);
  w.mesh.position.set(f.pos.x, f.pos.y + 3.05, f.pos.z); w.mesh.quaternion.copy(camera.quaternion); w.mesh.rotateZ(w.a); const sc = 1 + (f.wheelPulse || 0) * .5 + (f.capDef > 0 ? .15 : 0); w.mesh.scale.setScalar(sc);
  w.mat.color.setHex(f.capDef > 0 ? 0xffffff : 0xffe58a);
}
// Capitán Perú cae (se acabó su tiempo o lo derrotaron): ElRandi vuelve un instante y cae con él, así que reapareces con todo reiniciado
const capEnd = f => {
  const rs = f.capRandi; if (!rs) return;
  if (f.domeBreak) f.domeBreak();
  burst(chestOf(f), 44, '#e63946', 12, .26, .8, .3); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#e63946', 6, .6); popText(chestOf(f), 'Capitán Perú cae…', '#ffb3b8', 24); sfx('ko', f.pos);
  morphFighter(f, rs.key); f.maxHp = rs.maxHp; f.cd = [0, 0, 0, 0]; f.awak = 0; f.capT = 0; f.capRandi = null; f.adapt = null; f.adaptLvl = 0; f.capDef = 0;
  if (f.isPlayer) showBanner('CAPITÁN PERÚ CAE', '#d6222c', 'ElRandi cae con él: reapareces');
  kill(f, f);
};
// Picoteado: marca de las palomas (hasta ×3, 7 s). Cada marca sube un 12 % el daño de las habilidades de ElRandi; los cuyes la gastan.
function addPico(att, t, n) {
  if (!t || !t.alive) return;
  const q = t.pico && t.pico.t > 0 ? t.pico : (t.pico = { n: 0, t: 0 });
  q.n = Math.min(3, q.n + n); q.t = 7;
  popText(chestOf(t), 'PICOTEADO ×' + q.n, '#e6ecf2', 15 + q.n * 2); burst(chestOf(t), 8, '#e8ecf0', 5, .12, .4, .2);
}
const picoMul = (t, att, o) => att.ch && att.ch.id === 'randi' && !(o && o.noPico) && t.pico && t.pico.t > 0 ? 1 + .12 * t.pico.n : 1;
const dxz = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// línea dorada en el suelo (se queda hasta que se enciende)
function randiGlyph(p, dur) {
  const g = new THREE.CircleGeometry(.5, 14), m = glowMat('#ffd23f', .8), d = new THREE.Mesh(g, m);
  d.rotation.x = -Math.PI / 2; d.position.set(p.x, p.y + .06, p.z);
  addFx(d, Math.max(.3, dur), (o, k) => { m.opacity = .85 * (1 - k * .5) * (.7 + .3 * Math.sin(k * 40)); o.scale.setScalar(1 + k * .3); }, () => { g.dispose(); m.dispose(); });
}
function randiCuy(f, off, o) {
  const g = new THREE.Group(), mt = c => new THREE.MeshLambertMaterial({ color: c }), bx = (w, h, d, c, x, y, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt(c)); q.position.set(x, y, z); g.add(q); return q; };
  bx(.3, .26, .5, '#b98552', 0, .2, 0); bx(.22, .22, .22, '#c8955f', 0, .24, .3); bx(.07, .1, .05, '#e8b4a0', -.1, .4, .26); bx(.07, .1, .05, '#e8b4a0', .1, .4, .26); bx(.1, .06, .06, '#3a2418', 0, .22, .42);
  const dir0 = fwd(f.yaw), c0 = Math.cos(off), s0 = Math.sin(off), dir = new V3(dir0.x * c0 - dir0.z * s0, 0, dir0.x * s0 + dir0.z * c0).normalize();
  const pos = new V3(f.pos.x + dir.x * 1, 0, f.pos.z + dir.z * 1); pos.y = groundAt(pos.x, pos.z); scene.add(g);
  const nd = ndt(); let life = 0, done = false, untrack = () => {};
  const end = () => { if (done) return; done = true; untrack(); g.traverse(q => { if (q.isMesh) { q.geometry.dispose(); q.material.dispose(); } }); scene.remove(g); };
  untrack = trackSkillObj(f, 3.0, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); life += dt; let best = null, bd = 14;
    for (const t of enemiesOf(f)) { const d = dxz(t.pos, pos); if (d < bd) { bd = d; best = t; } }
    if (best) { const want = new V3(best.pos.x - pos.x, 0, best.pos.z - pos.z).normalize(); dir.lerp(want, Math.min(1, 3.2 * dt)).normalize(); }
    pos.x += dir.x * 10 * dt; pos.z += dir.z * 10 * dt; const gy = groundAt(pos.x, pos.z); pos.y = gy + Math.abs(Math.sin(life * 15)) * .35;
    g.position.copy(pos); g.rotation.y = Math.atan2(dir.x, dir.z);
    if (Math.random() < dt * 25) emit(pos.x, gy + .1, pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#c8955f', .1, .3, 0, 1);
    if ((best && bd < 1.4 && Math.abs(best.pos.y - gy) < 2.2) || life > 1.8) {
      const c = new V3(pos.x, gy + .5, pos.z);
      for (const t of enemiesOf(f)) if (t.pico && t.pico.t > 0 && dxz(t.pos, c) < 2.8) {
        const n = t.pico.n; applyHit(f, t, { dmg: 2.8 * n, stun: .2, color: '#e6ecf2', noPico: true }); t.pico = null; popText(chestOf(t), '¡CUY-BOOM! ×' + n, '#ffd23f', 22);
      }
      explode(f, c, 2.5, { dmg: o.dmg || 4.2, kb: 4, up: 5, stun: .35, color: '#d9a05b', hitstop: .05, shake: .2 });
      burst(c, 16, '#c8955f', 8, .18, .5, .3); burst(c, 8, '#ffd23f', 6, .14, .4, .3); sfx('hit', c, .7); end(); return;
    }
    if (G.state === 'play') later(0, tick); else end();
  };
  later(0, tick);
}
function randiCondorFly(f, dest, o) {
  const g = new THREE.Group(), mt = c => new THREE.MeshLambertMaterial({ color: c }), bx = (w, h, d, c, x, y, z, par) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt(c)); q.position.set(x, y, z); (par || g).add(q); return q; };
  bx(.8, .55, 1.7, '#2a2430', 0, 0, 0); bx(.7, .3, .45, '#f2f0ee', 0, .12, .8); bx(.4, .4, .42, '#a33a3a', 0, .22, 1.15); bx(.1, .1, .22, '#f0a830', 0, .15, 1.45); bx(.45, .2, .5, '#2a2430', 0, 0, -1.0);
  const wing = sg => { const w = new THREE.Group(); bx(2.4, .08, 1.2, '#1f1a24', sg * 1.2, 0, 0, w); bx(1.2, .09, .5, '#f2f0ee', sg * 2.0, .02, -.1, w); w.position.set(sg * .4, .15, 0); g.add(w); return w; };
  const wl = wing(-1), wr = wing(1);
  const F = fwd(f.yaw), land = new V3(dest.x, dest.y + 1.4, dest.z), start = new V3(dest.x - F.x * 18, dest.y + 24, dest.z - F.z * 18);
  g.position.copy(start); warnCircle(dest, 2.8, '#ffd23f', 1.1); sfx('whoosh', dest);
  const nd = ndt(); let t = 0, phase = 0, victims = [], tt = 0, done = false, untrack = () => {};
  const end = () => { if (done) return; done = true; untrack(); g.traverse(q => { if (q.isMesh) { q.geometry.dispose(); q.material.dispose(); } }); scene.remove(g); };
  scene.add(g);
  untrack = trackSkillObj(f, 4.5, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); t += dt; const fl = Math.sin(t * 18) * .6; wl.rotation.z = fl; wr.rotation.z = -fl;
    if (phase === 0) {
      const u = Math.min(1, t / 1.0); g.position.lerpVectors(start, land, u * u); g.lookAt(land);
      if (Math.random() < .6) emit(g.position.x, g.position.y, g.position.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), '#e8ecf0', .12, .4, 0, 1);
      if (u >= 1) {
        phase = 1; tt = 0; sfx('heavy', land); burst(land, 20, '#e8ecf0', 9, .2, .5, .4); ringAt(new V3(dest.x, dest.y + .1, dest.z), '#ffd23f', 4, .4);
        for (const q of enemiesOf(f)) if (dxz(q.pos, dest) < 2.8 && Math.abs(q.pos.y - dest.y) < 2.6 && applyHit(f, q, { dmg: o.dmg || 9, kb: 0, up: 14, ragdoll: 2, rag: 1.2, guardBreak: true, color: '#ffd23f', hitstop: .08, shake: .4 })) { victims.push(q); popText(chestOf(q), '¡GARRAS!', '#ffd23f', 24); }
      }
    } else if (phase === 1) {
      tt += dt; g.position.y += 9 * dt; g.lookAt(g.position.x + F.x, g.position.y + 4, g.position.z + F.z);
      if (tt > .75) {
        phase = 2; tt = 0;
        for (const q of victims) if (q.alive && !q.remote && q.pos.y > 1.2) { q.vel.set(0, -36, 0); popText(chestOf(q), '¡Suelta!', '#e8ecf0', 20); }
      }
    } else {
      tt += dt; g.position.y += 16 * dt; g.position.x += F.x * 8 * dt; g.position.z += F.z * 8 * dt;
      if (victims.length && tt > .12) {
        for (const q of victims) if (q.alive && !q.remote && q.onGround) { q.hp -= 5 * DMG_GLOBAL; q.flashT = .12; ringAt(new V3(q.pos.x, q.pos.y + .1, q.pos.z), '#e8ecf0', 3, .4); burst(new V3(q.pos.x, q.pos.y + .3, q.pos.z), 18, '#e8ecf0', 9, .2, .5, .5); sfx('heavy', q.pos); if (q.hp <= 0) kill(q, f); }
        victims = [];
      }
      if (tt > 1.0) { end(); return; }
    }
    if (G.state === 'play') later(0, tick); else end();
  };
  later(0, tick);
}
function randiDog(f, side, T) {
  const g = new THREE.Group(), mt = c => new THREE.MeshLambertMaterial({ color: c }), bx = (w, h, d, c, x, y, z) => { const q = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt(c)); q.position.set(x, y, z); g.add(q); return q; };
  const skin = side < 0 ? '#9a8c92' : '#8a7f86';
  bx(.42, .4, 1.0, skin, 0, .62, 0); bx(.38, .36, .42, skin, 0, .8, .62); bx(.18, .14, .22, '#6c5a60', 0, .74, .9); bx(.1, .34, .1, '#b58f95', -.14, 1.1, .56); bx(.1, .34, .1, '#b58f95', .14, 1.1, .56); bx(.09, .09, .35, skin, 0, .78, -.62);
  const legs = []; for (const [x, z] of [[-.15, .35], [.15, .35], [-.15, -.35], [.15, -.35]]) legs.push(bx(.11, .46, .11, skin, x, .22, z));
  const pos = new V3(f.pos.x + side * 1.4, f.pos.y, f.pos.z), nd = ndt(); scene.add(g); burst(new V3(pos.x, pos.y + .6, pos.z), 12, '#c9b0b8', 6, .14, .4, .3);
  let life = 0, bite = .4, done = false, untrack = () => {}; const dir = fwd(f.yaw).clone();
  const end = () => { if (done) return; done = true; untrack(); burst(new V3(pos.x, pos.y + .6, pos.z), 14, '#c9b0b8', 6, .14, .4, .3); g.traverse(q => { if (q.isMesh) { q.geometry.dispose(); q.material.dispose(); } }); scene.remove(g); };
  untrack = trackSkillObj(f, (T || 7) + 1.5, end);
  const tick = () => {
    if (done) return;
    const dt = nd(); life += dt; bite -= dt; let best = null, bd = 40;
    for (const t of enemiesOf(f)) { const d = dxz(t.pos, pos); if (d < bd) { bd = d; best = t; } }
    const goal = best || f, off = best ? rightOf(Math.atan2(best.pos.x - pos.x, best.pos.z - pos.z)).clone().multiplyScalar(side * 1.3 * Math.min(1, bd / 5)) : new V3(side * 1.6, 0, 0);
    const want = new V3(goal.pos.x + off.x - pos.x, 0, goal.pos.z + off.z - pos.z), dd = want.length();
    if (dd > .6) { want.normalize(); dir.lerp(want, Math.min(1, 9 * dt)).normalize(); const sp = best ? (dd > 2 ? 12.5 : 6) : Math.min(12, dd * 4); pos.x += dir.x * sp * dt; pos.z += dir.z * sp * dt; }
    pos.y = groundAt(pos.x, pos.z); g.position.copy(pos); g.rotation.y = Math.atan2(dir.x, dir.z);
    const sw = Math.sin(life * 22) * .7; legs[0].rotation.x = sw; legs[1].rotation.x = -sw; legs[2].rotation.x = -sw; legs[3].rotation.x = sw;
    if (best && bite <= 0 && bd < 1.8 && Math.abs(best.pos.y - pos.y) < 2.2) {
      bite = .9; g.position.y += .25;
      if (hitArea(f, new V3(best.pos.x, best.pos.y + .8, best.pos.z), 1.1, { dmg: 2.2, stun: .25, kb: 3, up: 2, color: '#e6b8b8', hitstop: .03 })) { popText(chestOf(best), '¡Grrr!', '#e6b8b8', 16); sfx('hit', pos, .6); }
    }
    if (life > T || !f.alive || G.state !== 'play') { end(); return; }
    later(0, tick);
  };
  later(0, tick);
}
function randiTinku(f) {
  const c = f.pos.clone(), R = 7.5, T = 6.5, trapped = [f, ...enemiesOf(f).filter(t => !t.remote && dist2d(t, f) < R + 3)];
  f.tinku = T; sfx('break', c); ringAt(new V3(c.x, c.y + .1, c.z), '#ffd23f', R, .7); ringAt(new V3(c.x, c.y + .1, c.z), '#ff7a1a', R * .6, .5); G.shake = Math.max(G.shake, .4);
  const grp = new THREE.Group(), geo = new THREE.BoxGeometry(.8, 1.8, .8), mat = new THREE.MeshLambertMaterial({ color: '#8a7a63' }), N = 28, rocks = [];
  for (let i = 0; i < N; i++) { const a = i / N * TAU, r = new THREE.Mesh(geo, mat); r.position.set(Math.cos(a) * R, .9, Math.sin(a) * R); r.rotation.y = rand(0, TAU); r.scale.y = .01; r.userData.h = rand(.7, 1.15); grp.add(r); rocks.push(r); }
  grp.position.set(c.x, c.y, c.z);
  addFx(grp, T, (g, k) => { const u = k < .08 ? k / .08 : k > .9 ? (1 - k) / .1 : 1; for (const r of rocks) { r.scale.y = Math.max(.01, u * r.userData.h); r.position.y = .9 * r.scale.y; } }, () => { geo.dispose(); mat.dispose(); });
  const nd = ndt(); let t = 0;
  const tick = () => {
    t += nd();
    for (const q of trapped) {
      if (!q.alive || q.remote) continue;
      const dx = q.pos.x - c.x, dz = q.pos.z - c.z, d = Math.hypot(dx, dz);
      if (d > R - .7) { const k = (R - .7) / d; q.pos.x = c.x + dx * k; q.pos.z = c.z + dz * k; q.vel.x *= .2; q.vel.z *= .2; }
    }
    if (Math.random() < .5) { const a = rand(0, TAU); emit(c.x + Math.cos(a) * R, c.y + .2, c.z + Math.sin(a) * R, 0, rand(2, 5), 0, '#ffd23f', .14, .6, -.1, 1); }
    if (t < T && f.alive && G.state === 'play') later(0, tick); else f.tinku = 0;
  };
  later(0, tick);
}
// ====================================================================
// CONEXIÓN MODULAR: FÍSICA (physics.js) Y DAÑO ESTRUCTURAL (destruction.js)
// El código de la física y el daño a estructuras se encuentra completamente
// separado en js/physics.js y js/destruction.js para máxima limpieza y rendimiento.
// ====================================================================
function spawnDebris(x, y, z, sx, sy, sz, col, vx, vy, vz) {
  return window.PHYSICS ? window.PHYSICS.spawnDebris(x, y, z, sx, sy, sz, col, vx, vy, vz) : undefined;
}
function destUpdate(dt) {
  return window.PHYSICS ? window.PHYSICS.destUpdate(dt) : undefined;
}
function worldDamage(c, r, power, dmg, dest, dir) {
  return window.DESTRUCTION ? window.DESTRUCTION.worldDamage(c, r, power, dmg, dest, dir) : undefined;
}
function worldBreak(c, r, maxVol, carve, dir) {
  return window.DESTRUCTION ? window.DESTRUCTION.worldBreak(c, r, maxVol, carve, dir) : 0;
}
function colCarve(c, r) {
  return window.DESTRUCTION ? window.DESTRUCTION.colCarve(c, r) : undefined;
}
function scarDecal(p, r, n) {
  return window.DESTRUCTION ? window.DESTRUCTION.scarDecal(p, r, n) : undefined;
}
function bbRegister(mesh, geo) {
  return window.DESTRUCTION ? window.DESTRUCTION.bbRegister(mesh, geo) : undefined;
}
function destRestore(all, comp) {
  return window.DESTRUCTION ? window.DESTRUCTION.destRestore(all, comp) : undefined;
}
function destHide(d) {
  return window.DESTRUCTION ? window.DESTRUCTION.destHide(d) : undefined;
}
function holesUpdate() {
  return window.DESTRUCTION ? window.DESTRUCTION.holesUpdate() : undefined;
}
function bbHole(c, r) {
  return window.DESTRUCTION ? window.DESTRUCTION.bbHole(c, r) : undefined;
}
function applyNetDest(e) {
  return window.DESTRUCTION ? window.DESTRUCTION.applyNetDest(e) : undefined;
}

// ===== Expansión de dominio de ElRandi (cinemática 3D): llevan a la víctima y a ElRandi a un lugar oscuro, aparecen los animales del Perú, se juntan, sale la bandera y el domo se rompe como cristal =====
const bxg = parts => { const g = new THREE.Group(); for (const [w, h, d, c, x, y, z] of parts) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x, y, z); g.add(m); } return g; };
const DOM_ANIMALS = [
  () => bxg([[.9, 1, 1.8, '#efe3c8', 0, 1.5, 0], [.35, 1.3, .35, '#efe3c8', 0, 2.5, .8], [.45, .5, .7, '#efe3c8', 0, 3.3, 1], [.12, .3, .12, '#efe3c8', -.15, 3.65, .85], [.12, .3, .12, '#efe3c8', .15, 3.65, .85], [.25, 1.1, .25, '#d8c9a6', -.3, .55, .6], [.25, 1.1, .25, '#d8c9a6', .3, .55, .6], [.25, 1.1, .25, '#d8c9a6', -.3, .55, -.6], [.25, 1.1, .25, '#d8c9a6', .3, .55, -.6], [.2, .3, .4, '#d8c9a6', 0, 1.9, -1]]),
  () => bxg([[.9, .7, 2, '#25202c', 0, 1.2, 0], [.8, .35, .5, '#f2f0ee', 0, 1.4, .9], [.5, .5, .5, '#b33a3a', 0, 1.55, 1.3], [.12, .12, .28, '#f0a830', 0, 1.45, 1.65], [3.4, .1, 1.4, '#1f1a24', -2.2, 1.3, 0], [3.4, .1, 1.4, '#1f1a24', 2.2, 1.3, 0], [1.5, .11, .6, '#f2f0ee', -3.6, 1.32, -.1], [1.5, .11, .6, '#f2f0ee', 3.6, 1.32, -.1]]),
  () => bxg([[1.4, 1.1, 2.2, '#b98552', 0, .8, 0], [1, .9, .9, '#c8955f', 0, 1, 1.3], [.2, .35, .12, '#e8b4a0', -.3, 1.6, 1.2], [.2, .35, .12, '#e8b4a0', .3, 1.6, 1.2], [.4, .25, .2, '#3a2418', 0, .9, 1.8], [.8, .8, .8, '#f2e6d6', 0, 1, -.3]]),
  () => bxg([[.8, .8, 2, '#9a8c92', 0, 1.5, 0], [.7, .7, .8, '#9a8c92', 0, 1.8, 1.3], [.3, .25, .4, '#6c5a60', 0, 1.65, 1.8], [.2, .7, .2, '#b58f95', -.25, 2.4, 1.15], [.2, .7, .2, '#b58f95', .25, 2.4, 1.15], [.2, 1.2, .2, '#9a8c92', -.25, .6, .7], [.2, 1.2, .2, '#9a8c92', .25, .6, .7], [.2, 1.2, .2, '#9a8c92', -.25, .6, -.7], [.2, 1.2, .2, '#9a8c92', .25, .6, -.7], [.15, .15, .8, '#9a8c92', 0, 1.7, -1.3]]),
  () => bxg([[.9, .9, 2.4, '#e0a830', 0, 1.3, 0], [.8, .8, .8, '#e0a830', 0, 1.6, 1.5], [.2, .2, .2, '#e0a830', -.3, 2.1, 1.5], [.2, .2, .2, '#e0a830', .3, 2.1, 1.5], [.25, 1, .25, '#d09a28', -.3, .5, .8], [.25, 1, .25, '#d09a28', .3, .5, .8], [.25, 1, .25, '#d09a28', -.3, .5, -.8], [.25, 1, .25, '#d09a28', .3, .5, -.8], [.2, .2, 1.4, '#e0a830', 0, 1.5, -1.9], [.2, .2, .2, '#1a1208', -.3, 1.8, .3], [.2, .2, .2, '#1a1208', .3, 1.6, -.4], [.2, .2, .2, '#1a1208', 0, 1.8, -.7]]),
  () => bxg([[.8, .8, 1.4, '#ff8fb1', 0, 2.2, 0], [.2, 1.8, .2, '#ff8fb1', 0, 3.1, .7], [.4, .35, .6, '#ff6f9a', 0, 4.1, .9], [.15, .15, .3, '#222222', 0, 4, 1.3], [.1, 2, .1, '#ff7da4', -.2, 1, 0], [.1, 2, .1, '#ff7da4', .2, 1, 0], [.3, .12, .5, '#ff7da4', -.2, .05, .2], [.3, .12, .5, '#ff7da4', .2, .05, .2]]),
  () => bxg([[1.1, 1.7, .8, '#1c2230', 0, 1.3, 0], [.8, 1.3, .1, '#f4f4f4', 0, 1.2, .42], [.7, .7, .7, '#1c2230', 0, 2.5, .1], [.2, .12, .3, '#f0a830', 0, 2.45, .6], [.15, 1, .6, '#1c2230', -.65, 1.4, 0], [.15, 1, .6, '#1c2230', .65, 1.4, 0], [.3, .1, .5, '#f0a830', -.25, .05, .2], [.3, .1, .5, '#f0a830', .25, .05, .2]]),
  () => bxg([[.9, 1.2, .7, '#5a3a22', 0, 1.6, 0], [.7, .7, .7, '#5a3a22', 0, 2.6, .1], [.5, .4, .3, '#d9b48c', 0, 2.5, .5], [.2, 1.1, .2, '#5a3a22', -.65, 1.5, 0], [.2, 1.1, .2, '#5a3a22', .65, 1.5, 0], [.25, .9, .25, '#5a3a22', -.25, .45, 0], [.25, .9, .25, '#5a3a22', .25, .45, 0], [.15, .15, 1.4, '#5a3a22', 0, 1.1, -.9]]),
];
function domFloorTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d', { willReadFrequently: true }); g.translate(256, 256); g.lineCap = 'round'; g.shadowColor = '#d6222c'; g.shadowBlur = 16;
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.stroke();
  g.strokeStyle = '#d6222c'; g.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * 36, Math.sin(a) * 36); g.lineTo(Math.cos(a) * 170, Math.sin(a) * 170); g.stroke(); }
  return new THREE.CanvasTexture(c);
}
function domFlagTex() {
  const c = document.createElement('canvas'); c.width = 384; c.height = 256; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#d91023'; g.fillRect(0, 0, 128, 256); g.fillRect(256, 0, 128, 256); g.fillStyle = '#ffffff'; g.fillRect(128, 0, 128, 256);
  g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(192, 128, 34, 0, TAU); g.fill(); g.fillStyle = '#e9c13a'; g.beginPath(); g.arc(192, 128, 16, 0, TAU); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(3, 3, 378, 250);
  return new THREE.CanvasTexture(c);
}
const DOM_SHARD_GEO = new THREE.CircleGeometry(1, 3);
const _domM4 = new THREE.Matrix4(), _domE = new THREE.Euler(), _domQ = new THREE.Quaternion(), _domP = new THREE.Vector3(), _domS = new THREE.Vector3(), _domC = new THREE.Color();
function domShatter(c, R) {
  sfx('break', c); sfx('heavy', c); G.shake = Math.max(G.shake, .8); ringAt(new V3(c.x, c.y + .1, c.z), '#cfd8ff', R, .7); burst(new V3(c.x, c.y + 1, c.z), 40, '#cfd8ff', 12, .25, .8, .5);
  const N = 90;
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const im = new THREE.InstancedMesh(DOM_SHARD_GEO, mat, N);
  im.frustumCulled = false;
  const shards = new Array(N);
  for (let i = 0; i < N; i++) {
    const a = rand(0, TAU), el = rand(.04, 1.35), ce = Math.cos(el);
    const dx = Math.cos(a) * ce, dy = Math.sin(el), dz = Math.sin(a) * ce;
    const sh = { x0: c.x + dx * R, y0: c.y + dy * R, z0: c.z + dz * R, dx, dy, dz, sp: rand(2, 7), sc: rand(.5, 1.5), rx: rand(0, TAU), ry: rand(0, TAU), rz: rand(0, TAU), sx: rand(-6, 6), sy: rand(-6, 6) };
    shards[i] = sh;
    im.setColorAt(i, _domC.set(i % 3 ? '#cfd8ff' : '#0b0b14'));
  }
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  addFx(im, 1.7, (o, k) => {
    const tt = k * 1.7;
    for (let i = 0; i < N; i++) {
      const sh = shards[i];
      sh.rx += sh.sx * .016; sh.ry += sh.sy * .016;
      _domE.set(sh.rx, sh.ry, sh.rz); _domQ.setFromEuler(_domE);
      _domP.set(sh.x0 + sh.dx * sh.sp * tt, Math.max(c.y + .05, sh.y0 + sh.dy * sh.sp * tt - 9 * tt * tt), sh.z0 + sh.dz * sh.sp * tt);
      _domS.setScalar(sh.sc);
      _domM4.compose(_domP, _domQ, _domS);
      o.setMatrixAt(i, _domM4);
    }
    o.instanceMatrix.needsUpdate = true;
    mat.opacity = 1 - k * k;
  }, () => { mat.dispose(); });
}
let DOMX = null;
function randiDomainFx(st, kind) {
  if (kind === 'close') { if (!DOMX) return; const x = DOMX; DOMX = null; x.g.visible = false; domShatter(x.c, 15); cineGrade(false); screenFlash(.7); return; }
  const f = st.f, tg = st.tg, F = fwd(st.yaw), C = new V3(st.origin.x + F.x * 1.6, st.origin.y, st.origin.z + F.z * 1.6), T = st.D.dur - st.t, g = new THREE.Group(), geos = [], mats = [];
  g.position.copy(C); cineGrade(true, f); sfx('ult', C);
  const mk = (geo, mat) => { geos.push(geo); mats.push(mat); return new THREE.Mesh(geo, mat); };
  const dome = mk(new THREE.SphereGeometry(17, 32, 20), new THREE.MeshBasicMaterial({ color: 0x020206, side: THREE.BackSide, fog: false })); g.add(dome);
  const ftex = domFloorTex(), disc = mk(new THREE.CircleGeometry(12, 48), new THREE.MeshBasicMaterial({ map: ftex, transparent: true, depthWrite: false, opacity: 0 })); disc.rotation.x = -Math.PI / 2; disc.position.y = .07; g.add(disc); mats.push(ftex);
  const N = 300, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const a = rand(0, TAU), z = rand(-.2, 1), q = Math.sqrt(1 - z * z); pos[i * 3] = Math.cos(a) * q * 16.2; pos[i * 3 + 1] = z * 16.2; pos[i * 3 + 2] = Math.sin(a) * q * 16.2; }
  const stG = new THREE.BufferGeometry(); stG.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const stM = new THREE.PointsMaterial({ color: 0xffffff, size: .3, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }); geos.push(stG); mats.push(stM); g.add(new THREE.Points(stG, stM));
  const animals = DOM_ANIMALS.map(fn => { const a = fn(); a.visible = false; g.add(a); return a; });
  const ftx = domFlagTex(), flagM = new THREE.MeshBasicMaterial({ map: ftx, side: THREE.DoubleSide, transparent: true, fog: false }), flag = mk(new THREE.PlaneGeometry(6, 4), flagM); flag.position.y = 7; flag.visible = false; g.add(flag); mats.push(ftx);
  const glow = mk(new THREE.CircleGeometry(5.2, 28), new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: .35, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); glow.position.y = 7; glow.visible = false; g.add(glow);
  const ob = u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  DOMX = { g, c: C };
  addFx(g, T + .4, (o, k) => {
    const t = k * (T + .4), pr = clamp(t / Math.max(1, T - 1.2), 0, 1), Rr = 11 - 5.8 * pr * pr * (3 - 2 * pr);
    disc.scale.setScalar(Rr / 8); disc.material.opacity = clamp(t / .8, 0, 1); stM.opacity = .5 + .5 * Math.sin(t * 6);
    animals.forEach((a, i) => { const u = clamp((t - (.6 + i * .45)) / .5, 0, 1), ang = i / 8 * TAU; a.visible = u > 0; a.position.set(Math.cos(ang) * Rr, Math.sin(t * 2 + i) * .18, Math.sin(ang) * Rr); a.rotation.y = Math.atan2(-a.position.x, -a.position.z); a.scale.setScalar(Math.max(.01, ob(u))); });
    const uf = clamp((t - 4) / .7, 0, 1); flag.visible = glow.visible = uf > 0; flag.scale.setScalar(Math.max(.01, ob(uf)) * (1 + .03 * Math.sin(t * 5))); glow.scale.setScalar(Math.max(.01, uf) * (1 + .1 * Math.sin(t * 4))); flag.quaternion.copy(camera.quaternion); glow.quaternion.copy(camera.quaternion);
    for (const q of G.fighters) { if (q === f || q === tg || q.remote || !q.alive) continue; const dx = q.pos.x - C.x, dz = q.pos.z - C.z, d = Math.hypot(dx, dz) || .01; if (d < 18) { q.frozen = Math.max(q.frozen, .3); if (d < 15.8) { const kk = 15.8 / d; q.pos.x = C.x + dx * kk; q.pos.z = C.z + dz * kk; } } }
  }, () => { geos.forEach(x => x.dispose()); mats.forEach(x => x.dispose()); if (DOMX && DOMX.g === g) { DOMX = null; cineGrade(false); } });
}
// Capitán Perú aparece detrás de ElRandi, le pega la patada y pasamos a controlarlo
function makeGiantVerity() {
  const g = new THREE.Group(), geos = [], mats = [];
  const box = (w, h, d, c, x, y, z, par, emis) => { const ge = new THREE.BoxGeometry(w, h, d), ma = emis ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshLambertMaterial({ color: c }); geos.push(ge); mats.push(ma); const m = new THREE.Mesh(ge, ma); m.position.set(x, y, z); m.castShadow = true; (par || g).add(m); return m; };
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const l = new THREE.Group(); l.position.set(sx * .85, 3.6, 0); box(.95, 3.6, .95, '#14131a', 0, -1.8, 0, l); box(1.15, .5, 1.7, '#0c0b10', 0, -3.65, .35, l); box(.97, .2, .97, '#ffd91a', 0, -.9, 0, l, 1); g.add(l); legs.push(l);
    const a = new THREE.Group(); a.position.set(sx * 1.85, 6.0, 0); box(.75, 3.9, .75, '#14131a', 0, -1.95, 0, a); box(.95, .95, .95, '#ffd91a', 0, -4.1, 0, a, 1); g.add(a); arms.push(a);
  }
  box(3.0, 2.9, 1.6, '#14131a', 0, 5.0, 0); box(.18, 2.6, .06, '#ffd91a', -.7, 5.0, .82, null, 1); box(.18, 2.6, .06, '#ffd91a', .7, 5.0, .82, null, 1); box(3.2, .4, 1.8, '#0c0b10', 0, 3.7, 0);
  const head = makeVerity('verity'); head.g.scale.setScalar(.02); verityFace(head, 'open'); scene.add(head.g);
  return { g, legs, arms, head, geos, mats };
}
// Remove an interrupted mount immediately; it must not outlive its fighter.
function disposeMount(f) {
  const M = f.mount; if (!M) return; f.mount = null;
  scene.remove(M.g); M.geos.forEach(g => g.dispose()); M.mats.forEach(m => m.dispose()); disposeVerity(M.head);
}
function mountStomp(f, M) {
  const F = fwd(M.yaw), c = new V3(M.pos.x + F.x * .8, 1, M.pos.z + F.z * .8);
  hitArea(f, c, 5.2, { dmg: 7.5, kb: 9, up: 8, ragdoll: .6, rag: 1.2, stun: .3, color: '#ffd91a', hitstop: .04 });
  shakeFrom(c, .35); ringAt(new V3(c.x, .15, c.z), '#ffd91a', 5, .3); burst(new V3(c.x, .3, c.z), 8, '#6b5a3e', 7, .25, .6, 1.2, 4); sfx('heavy', c, .8);
  worldDamage(new V3(c.x, 1.2, c.z), 4.4, 1, 10, 1.4);
}
function mountPose(M) {
  const sw = Math.sin(M.ph) * .75 * M.mv, bob = Math.abs(Math.sin(M.ph)) * .3 * M.mv;
  M.legs[0].rotation.x = sw; M.legs[1].rotation.x = -sw; M.arms[0].rotation.x = -sw * .8 - .15; M.arms[1].rotation.x = sw * .8 - .15;
  M.g.position.set(M.pos.x, M.pos.y + bob, M.pos.z); M.g.rotation.y = M.yaw;
  M.head.g.position.set(M.pos.x, M.pos.y + 7.7 * M.g.scale.y + bob, M.pos.z); verityBillboard(M.head);
}
function mountEnd(f) {
  const M = f.mount; if (!M) return; f.mount = null;
  const F = fwd(M.yaw), gy = groundAt(M.pos.x + F.x * 1.4, M.pos.z + F.z * 1.4);
  f.pos.set(M.pos.x + F.x * 1.4, gy, M.pos.z + F.z * 1.4); f.vel.set(0, -2, 0); f.onGround = false; f.iframes = Math.max(f.iframes, .7); if (f.action) endAction(f);
  ringAt(new V3(M.pos.x, .1, M.pos.z), '#ffd91a', 7, .6); burst(new V3(M.pos.x, 3, M.pos.z), 30, '#ffd91a', 9, .25, .7, .4); sfx('boom', M.pos); popText(chestOf(f), '¡Gracias, Verity!', '#ffd91a', 22);
  addFx(M.g, .6, (o, k) => { const sc = Math.max(.01, 1 - k); o.scale.set(sc, sc, sc); M.head.g.scale.setScalar(Math.max(.01, 2.3 * sc)); M.head.g.position.set(M.pos.x, M.pos.y + 7.7 * sc, M.pos.z); verityBillboard(M.head); },
    () => { M.geos.forEach(x => x.dispose()); M.mats.forEach(x => x.dispose()); disposeVerity(M.head); });
}
function mountUpdate(f, c, dt) {
  const M = f.mount; if (!M) return; M.t += dt;
  if (!f.alive || G.state !== 'play') { mountEnd(f); return; }
  const ob = u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); };
  if (M.phase === 'morph') {
    const u = clamp(M.t / 1.5, 0, 1), e = Math.max(.02, ob(u)); M.g.scale.set(e, e, e); M.head.g.scale.setScalar(Math.max(.02, 2.3 * e)); M.mv = 0; mountPose(M);
    if (Math.random() < .6) emit(M.pos.x + rand(-2, 2), .2, M.pos.z + rand(-2, 2), rand(-2, 2), rand(2, 7), rand(-2, 2), Math.random() < .5 ? '#ffd91a' : '#6b5a3e', .2, .7, .6, 2);
    if (M.t > .3 && M.t < .35) screenFlash(.3);
    if (u >= 1) { M.phase = 'climb'; M.t = 0; M.from = f.pos.clone(); M.g.scale.set(1, 1, 1); M.head.g.scale.setScalar(2.3); popText(new V3(M.pos.x, 10.5, M.pos.z), '¡¿Humanoide?!', '#ffd91a', 24); }
    return;
  }
  if (M.phase === 'climb') {
    const u = clamp(M.t / 1.0, 0, 1), e = u * u * (3 - 2 * u), seat = new V3(M.pos.x, 9.05, M.pos.z);
    f.pos.lerpVectors(M.from, seat, e); f.pos.y += Math.sin(Math.PI * u) * 5; f.vel.set(0, 0, 0); f.onGround = true; M.mv = 0; mountPose(M); f.yaw = M.yaw;
    if (u >= 1) { M.phase = 'ride'; M.t = 0; if (f.action && f.action.name === 'sebMount') endAction(f); G.shake = Math.max(G.shake, .6); sfx('heavy', M.pos); ringAt(new V3(M.pos.x, .1, M.pos.z), '#ffd91a', 8, .5); popText(chestOf(f), '¡Arre, Verity!', '#ffd91a', 26); }
    return;
  }
  // cabalgando: Seb0lla conduce a Verity con el teclado
  M.chargeCd -= dt;
  const moving = c.mx || c.mz;
  if (moving && M.charge <= 0) M.yaw = angLerp(M.yaw, Math.atan2(c.mx, c.mz), Math.min(1, 3.2 * dt));
  if (c.dash && M.chargeCd <= 0 && M.charge <= 0) { M.charge = .9; M.chargeCd = 3.2; popText(chestOf(f), '¡EMBESTIDA!', '#ffd91a', 26); sfx('dash', M.pos); G.shake = Math.max(G.shake, .5); }
  let sp = 0;
  if (M.charge > 0) { M.charge -= dt; sp = 26; } else if (moving) sp = 9.5;
  M.mv += ((sp > 0 ? Math.min(1.6, sp / 9.5) : 0) - M.mv) * Math.min(1, 6 * dt);
  const F = fwd(M.yaw);
  M.pos.x += F.x * sp * dt; M.pos.z += F.z * sp * dt; clampArena(M.pos, 2); const gy = groundAt(M.pos.x, M.pos.z); M.pos.y += ((gy < 1.5 ? gy : 0) - M.pos.y) * Math.min(1, 10 * dt);
  M.ph += (sp * .45 + .6) * dt;
  const sg = Math.sign(Math.sin(M.ph)); if (sg !== M.sign && sp > 2) { M.sign = sg; mountStomp(f, M); }
  if (M.charge > 0) { M.chT -= dt; if (M.chT <= 0) { M.chT = .16; hitArea(f, new V3(M.pos.x + F.x * 3, 1.2, M.pos.z + F.z * 3), 6, { dmg: 12, kb: 14, up: 10, ragdoll: 1.1, rag: 1.6, stun: .4, color: '#ffd91a', guardBreak: true, hitstop: .06, shake: .4 }); } }
  if (sp > 3) { M.wdT -= dt; if (M.wdT <= 0) { M.wdT = .32; worldDamage(new V3(M.pos.x + F.x * 3.2, 3.4, M.pos.z + F.z * 3.2), 3.8, 1, 16, 1.3); } }
  if (sp > 3 && Math.random() < .5) emit(M.pos.x + rand(-1.5, 1.5), .2, M.pos.z + rand(-1.5, 1.5), rand(-2, 2), rand(1, 4), rand(-2, 2), '#6b5a3e', .2, .5, .6, 2);
  mountPose(M);
  f.pos.set(M.pos.x, M.pos.y + 9.05 + Math.abs(Math.sin(M.ph)) * .3 * M.mv, M.pos.z); f.vel.set(0, 0, 0); f.onGround = true; f.yaw = M.yaw;
  if (M.t >= M.dur) mountEnd(f);
}
function sebRemoteCtl(f, c, dt) {
  const R = f.sebRem; R.t += dt; let mx = c.mx, mz = c.mz, vy = c.jump ? 1 : c.down ? -1 : 0;
  if (!f.isPlayer) { const t = f.ai && f.ai.target; if (t && t.alive) { const dx = t.pos.x - R.pos.x, dz = t.pos.z - R.pos.z, d = Math.hypot(dx, dz) || 1; mx = dx / d; mz = dz / d; vy = (t.pos.y + 1.2 - R.pos.y) > .5 ? 1 : -1; } }
  R.pos.x += mx * 16 * dt; R.pos.z += mz * 16 * dt; const gy = groundAt(R.pos.x, R.pos.z); R.pos.y = clamp(R.pos.y + vy * 8 * dt, gy + .7, gy + 7);
  const dx = R.pos.x - f.pos.x, dz = R.pos.z - f.pos.z, dd = Math.hypot(dx, dz); if (dd > 22) { R.pos.x = f.pos.x + dx / dd * 22; R.pos.z = f.pos.z + dz / dd * 22; }
  for (const t of enemiesOf(f)) if (chestOf(t).distanceTo(R.pos) < 1.9 && G.time - (R.hit.get(t) || -9) > .5) { R.hit.set(t, G.time); if (applyHit(f, t, { dmg: R.dmg, kb: 6, up: 4, stun: .25, color: '#ffd91a', hitstop: .04 }) && f.verity) f.verity.angryT = .4; }
  emit(R.pos.x, R.pos.y, R.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ffd91a', .12, .3, 0, 1);
  if (R.t >= R.dur && f.action && f.action.name === 'sebRemote') endAction(f);
}
// Parry de Seb0lla: Verity aparece frente al atacante
function sebCounter(t, att) {
  endAction(t); t.iframes = Math.max(t.iframes, .6); t.hp = Math.min(t.maxHp, t.hp + 6);
  popText(chestOf(t), '¡TE VI VENIR!', '#ffd91a', 26); sfx('counter', t.pos); impactFrame('#ffd91a', .1); if (t.isPlayer || att.isPlayer) G.slowT = .3;
  verityGo(t, () => front(att, 1.6, 1.8), .8, 2, 'open'); ringAt(new V3(att.pos.x, att.pos.y + .1, att.pos.z), '#ffd91a', 3, .4);
  startAction(t, { name: 'sebCounter', dur: .55, noControl: true, speedMul: 0, anim: [[0, 'mega', 600]],
    steps: [{ at: .12, fn: () => applyHit(t, att, { dmg: 8, stun: 1.2, kb: 12, up: 6, color: '#ffd91a', noCounter: true, guardBreak: true, hitstop: .15, shake: .6 }) }] });
}
function sebWallRelease(f) {
  if (!(f.sebAbs > 0) && !(f.sebShield > 0)) return; const ab = f.sebAbs || 0; f.sebShield = 0; f.sebAbs = 0; f.sebShieldT = 0;
  explode(f, chestOf(f), 4.6, { dmg: 3 + ab * .6, kb: 12 + ab * .25, up: 7, ragdoll: .8, color: '#ffd91a', guardBreak: true, hitstop: .08, shake: .4 });
  popText(chestOf(f), '¡Risa!', '#ffd91a', 24);
}
function randiSummon(f, tg) {
  const D = CHORE.randiDomain;
  if (tg && tg.alive) { runChore(f, tg, D); later(D.dur + .12, () => randiRelease(f)); }
  else { f.iframes = Math.max(f.iframes, 1); later(.3, () => randiRelease(f)); }
}
function randiRelease(f) {
  if (G.state !== 'play' || !f.alive) return;
  const F = fwd(f.yaw), P = new V3(f.pos.x - F.x * 3.4, f.pos.y, f.pos.z - F.z * 3.4); clampArena(P, 2);
  f.iframes = Math.max(f.iframes, 3);
  startAction(f, { name: 'randiSummon', dur: 2.2, noControl: true, armor: true, speedMul: 0, aim: false, anim: [[0, 'castUp', 600], [.7, 'vpose', 1200]] });
  popText(chestOf(f), 'Gran General del Perú…', '#ffb3b8', 22);
  const ring = new THREE.Mesh(new THREE.CircleGeometry(3.6, 36), new THREE.MeshBasicMaterial({ color: 0x0a0a10, transparent: true, opacity: .75, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(P.x, groundAt(P.x, P.z) + .06, P.z);
  addFx(ring, 2.0, (o, k) => { o.scale.setScalar(Math.min(1, k * 6)); o.material.opacity = .75 * (k > .8 ? (1 - k) / .2 : 1); });
  let cap = null;
  later(.1, () => {
    if (G.state !== 'play') return;
    cap = new Fighter({ name: 'Capitán Perú', ch: CHARS.capitan, lvlVar: 0 }); cap.dummy = 'cap'; cap.iframes = 1e9; cap.flourT = 1e9; cap.ai.P = aiParams(1);
    cap.pos.set(P.x, groundAt(P.x, P.z), P.z); cap.yaw = cap.prevYaw = Math.atan2(f.pos.x - P.x, f.pos.z - P.z); G.fighters.push(cap);
    lightColumn(P, '#e63946', 18); ringAt(new V3(P.x, P.y + .1, P.z), '#ffffff', 6, .6); burst(new V3(P.x, P.y + 1, P.z), 40, '#e63946', 10, .22, .7, .3); shakeFrom(P, .5); sfx('boom', P);
    popText(new V3(P.x, P.y + 2.6, P.z), '¡CAPITÁN PERÚ!', '#ffffff', 30);
  });
  later(.65, () => {
    if (!cap || G.state !== 'play') return;
    startAction(cap, { name: 'capKick', dur: .7, speedMul: 0, anim: [[0, 'kickRush', 600], [.15, 'kick', 700]] });
    later(.18, () => {
      if (!cap) return;
      const d = new V3(f.pos.x - cap.pos.x, 0, f.pos.z - cap.pos.z).normalize(); burst(chestOf(f), 24, '#e63946', 10, .22, .5, .4); impactStar(chestOf(f), '#ffffff', 3, .3); shakeFrom(f.pos, .6); sfx('heavy', f.pos);
      popText(chestOf(cap), '¡Patada Peruana!', '#ffffff', 26);
      if (!f.remote) { f.vel.set(d.x * 17, 8, d.z * 17); f.onGround = false; f.ragdoll = Math.max(f.ragdoll, .9); f.ragPow = 1.6; }
    });
  });
  later(1.55, () => {
    if (G.state !== 'play') return;
    const at = cap ? cap.pos.clone() : P.clone();
    if (cap) { cap.dispose(); const k = G.fighters.indexOf(cap); if (k >= 0) G.fighters.splice(k, 1); cap = null; }
    if (f.remote || !f.alive) return;
    const key = Object.keys(CHARS).find(k => CHARS[k] === f.ch);
    f.capRandi = { key, hp: f.hp, maxHp: f.maxHp, cd: f.cd.slice() };
    morphFighter(f, 'capitan'); f.maxHp = CHARS.capitan.hp; f.hp = f.maxHp; f.cd = [0, 0, 0, 0]; f.capT = 22; f.adapt = {}; f.adaptLvl = 0; f.capDef = 0;
    if (f.action) endAction(f); f.pos.set(at.x, groundAt(at.x, at.z), at.z); f.vel.set(0, 0, 0); f.ragdoll = 0; f.stun = 0; f.iframes = Math.max(f.iframes, .8);
    lightColumn(f.pos, '#e63946', 16); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#e63946', 7, .6); burst(chestOf(f), 40, '#ffffff', 11, .24, .7, .3); sfx('ult', f.pos);
    if (f.isPlayer) showBanner('CAPITÁN PERÚ', '#e63946', 'Golpear y matar suma tiempo · se adapta a los golpes · si se acaba, cae y ElRandi con él');
  });
}
// ===== Alas de Sekza, patas de Rocket y Verity: vive en js/graficos/despertar_fx.js =====
const { VERITY_KINDS, _sv1, _sv2, _sv3, _vh, addSpiderLegs, addWings, buildWebDisc, disposeVerity, drawVerityFace, firePatch, makeVerity, updateSpiderLegs, updateSwordFire, updateVerity, updateWings, verityBillboard, verityFace, verityGo, verityScene, webWrap } = CF_GRAFICOS.crearDespertarFx({ PX, TAU, V3, addFx, burst, camera, clamp, emit, fighterToonMaterial, fwd, glowMat, groundAt, impactStar, popText, rand, rightOf, scene, slashLine, get G() { return G; }, get enemiesOf() { return enemiesOf; }, get chestOf() { return chestOf; }, get sfx() { return sfx; }, get later() { return later; }, get applyHit() { return applyHit; }, get L2W() { return L2W; }, get poseChest() { return poseChest; }, get spawnProj() { return spawnProj; }, get ndt() { return ndt; }, get poisonOn() { return poisonOn; } });
// ===== Expresiones faciales y caras: vive en js/graficos/expresiones.js =====
const { BBS_EYES, FACE_ART, FACE_DEFAULTS, FACE_FALLBACK, FACE_FPS, FACE_IMG_CACHE, FACE_INFO_CACHE, FACE_LIB, FACE_POOL, FACE_STATES, FACE_VER, analyzeFace, bbsEyeSample, bbsEyesAttach, bbsEyesUpdate, copyCanvas, drawFace, drawFaceArt, ensureNormal, ensureNormalAll, faceAnimTick, faceCharId, faceEyeCells, faceImageTex, faceState, feFaceInfo, feGifFrames, hex2, loadFaceLib, makeNormal, paintFacePreset, refreshFaces, saveFaceLib, setFaceDecal, setupFace, updateFace, updateFaceAnims } = CF_GRAFICOS.crearExpresiones({ $, PX, camera, dist2d, fighterToonMaterial, rand, wrapA, yawTo, get feFaceBase() { return feFaceBase; }, get feRender() { return feRender; }, get CHARS() { return CHARS; }, get charSkin() { return charSkin; }, get G() { return G; }, get enemiesOf() { return enemiesOf; }, get SH() { return SH; } });
// ===== Editor de expresiones (modo desarrollador): caras de cada personaje: vive en js/editores/editor_expresiones.js =====
const { FE, feChangeChar, feClose, feColor, feDownload, feDrawFace, feDrawMain, feExpr, feFaceBase, feFaceCanvas, feImgChanged, feImportPNG, feInit, feLetterFor, feLib, feMsg, feOpen, fePaintAt, feRender, feRenderImg, feSelect } = CF_EDITORES.crearEditorExpresiones({ $, FACE_ART, FACE_DEFAULTS, FACE_LIB, FACE_POOL, FACE_STATES, ensureNormalAll, faceAnimTick, faceEyeCells, faceImageTex, feFaceInfo, feGifFrames, hex2, loadFaceLib, makeNormal, refreshFaces, saveFaceLib, get CHARS() { return CHARS; }, get charSkin() { return charSkin; }, get G() { return G; }, get sfx() { return sfx; }, get SH() { return SH; }, get showSelect() { return showSelect; }, get DEV() { return DEV; }, get edOpen() { return edOpen; } });
// ===== Armas de vóxeles (lanza, cetro, espada) y ojos brillantes de los modelos: vive en js/graficos/armas.js =====
const { WEAPONS, addEyes, buildScepter, buildSpear, buildSword, buildVoxelWeapon, eyeGlow, setSpear } = CF_GRAFICOS.crearArmas({ OUTLINE_MAT, PX, _c, addOutlineOffset, fighterToonMaterial, get ownsMissingSpear() { return ownsMissingSpear; } });
// ================= Animación: poses + resortes =================
const JOINTS = ['ix', 'iy', 'iz', 'by', 'bz', 'tx', 'ty', 'tz', 'hx', 'hy', 'hz', 'alx', 'aly', 'alz', 'arx', 'ary', 'arz', 'llx', 'llz', 'lrx', 'lrz', 'sx'];
// Canales de actuación: desplazamientos en píxeles y escalas por parte.
// Permiten separar hombros/caderas, desplazar la cabeza y dibujar smears a mano.
const CINE_PARTS = { torso: 't', head: 'h', armL: 'al', armR: 'ar', legL: 'll', legR: 'lr' };
JOINTS.push('bx', ...Object.values(CINE_PARTS).flatMap(p => ['px', 'py', 'pz'].map(axis => p + axis)), 'lly', 'lry', 'als', 'ars', 'lls', 'lrs', 'tscx', 'tscy', 'tscz', 'hscx', 'hscy', 'hscz', 'bsx', 'bsy', 'bsz', 'sy', 'sz', 'spx', 'spy', 'spz', 'ssc');
const JDEF = { alz: .06, arz: -.06, als: 1, ars: 1, lls: 1, lrs: 1, tscx: 1, tscy: 1, tscz: 1, hscx: 1, hscy: 1, hscz: 1, bsx: 1, bsy: 1, bsz: 1, ssc: 1 };
function mirror(p) {
  const o = {};
  for (const k in p) {
    let nk = k, nv = p[k];
    if ((k[0] === 'a' || k[0] === 'l') && (k[1] === 'l' || k[1] === 'r') && k.length === 3) { nk = k[0] + (k[1] === 'l' ? 'r' : 'l') + k[2]; if (k[2] !== 'x' && k[2] !== 's') nv = -nv; }
    else if (/^(al|ar|ll|lr)p[xyz]$/.test(k)) { nk = k[0] + (k[1] === 'l' ? 'r' : 'l') + k.slice(2); if (k[3] === 'x') nv = -nv; }
    else if (['iy', 'iz', 'ty', 'tz', 'hy', 'hz', 'bx', 'tpx', 'hpx'].includes(k)) nv = -nv;
    o[nk] = nv;
  }
  return o;
}
const POSE = {
  idle: { ix: .04, tx: .08, ty: .3, hy: -.25, alx: -1.05, alz: -.35, aly: .2, arx: -.75, arz: .3, ary: -.2, llx: -.3, llz: .08, lrx: .25, lrz: -.1, by: -.6 },
  ninja: { ix: .25, tx: .2, ty: -.2, by: -3, alx: .6, alz: .3, arx: -1.2, arz: .5, ary: -.4, llx: -.7, lrx: .6, llz: .15, lrz: -.15, hx: -.2, hy: .2 },
  loose: { ty: .2, alx: -.3, alz: .25, arx: -.9, arz: .1, llz: .12, lrz: -.12, llx: -.15, lrx: .15, hy: -.15, by: -.4 },
  elegant: { ty: .35, hy: -.3, alx: -.2, alz: .15, arx: -1.4, arz: .35, ary: -.5, llx: -.1, lrx: .2, llz: .04, lrz: .02, by: -.2 },
  heavy: { ix: .1, tx: .15, by: -1.5, alx: -.5, alz: -.5, arx: -.5, arz: .5, llz: .25, lrz: -.25, hx: .1 },
  jump: { ix: -.05, tx: -.1, alx: -.6, alz: .9, arx: -.4, arz: -.9, llx: -1.1, lrx: -.2, hx: -.15 },
  fall: { ix: .1, alx: -2.2, alz: .5, arx: -2.0, arz: -.5, llx: -.3, lrx: .4, hx: .1 },
  land: { ix: .35, by: -3, tx: .3, alx: -.4, alz: .4, arx: -.4, arz: -.4, llx: -.6, lrx: .5, hx: -.2 },
  ironFly: { ix: 1.05, tx: .12, by: -2.5, alx: 1.25, alz: .12, arx: 1.25, arz: -.12, llx: .7, lrx: .6, llz: .05, lrz: -.05, hx: -.75 },
  ironHover: { ix: .08, tx: .05, by: -.8, alx: -.15, alz: .85, arx: -.15, arz: -.85, llx: .25, lrx: -.15, llz: .08, lrz: -.08, hx: -.1 },
  dash: { ix: .55, tx: .25, by: -1.5, alx: .9, alz: .25, arx: 1.0, arz: -.25, llx: -.9, lrx: .7, hx: -.4 },
  block: { ix: .12, tx: .15, by: -1, alx: -1.5, alz: -.8, aly: .3, arx: -1.45, arz: .8, ary: -.3, llx: -.35, lrx: .3, llz: .1, lrz: -.1, hx: .25 },
  hurtA: { ix: -.3, tx: -.35, ty: .35, hx: -.55, hy: .3, alx: -.9, alz: .9, arx: .5, arz: -.5, llx: .3, lrx: -.4 },
  hurtB: { ix: -.25, tx: -.25, ty: -.4, hx: -.4, hy: -.35, alx: .5, alz: .6, arx: -1, arz: -.9, llx: -.4, lrx: .3 },
  down: { ix: -1.5, alx: -2.8, alz: .5, arx: -2.6, arz: -.5, llx: .25, lrx: -.2, hx: -.2 },
  getup1: { ix: .2, by: -6, tx: .6, alx: -1.0, arx: .6, llx: -1.4, lrx: -.8, hx: -.3 },
  jabR_w: { ty: -.35, tx: -.05, arx: -.4, arz: .2, alx: -1.2, alz: -.3, llx: -.3, lrx: .3, hy: .2, by: -1 },
  jabR: { ty: .65, tx: .15, ix: .1, bz: 2, arx: -1.62, arz: .15, ary: -.1, alx: -.8, alz: -.5, llx: -.45, lrx: .45, hy: -.5, by: -1.5 },
  hook_w: { ty: -.6, arx: -.5, arz: .9, alx: -1.2, alz: -.3, by: -1, hy: .4, llx: -.3, lrx: .3 },
  hook: { ty: 1.0, tx: .2, ix: .12, bz: 1.5, arx: -1.5, arz: -.7, alx: -.5, alz: -.3, llx: -.6, lrx: .5, hy: -.7, by: -1.5 },
  kick_w: { ty: -.5, ix: -.1, lrx: .5, arx: .3, alx: -1.2, llx: -.1, by: -1 },
  kick: { ty: -.6, ix: -.25, iz: .15, lrx: -1.75, lrz: .25, llx: .3, arx: .6, arz: -.6, alx: -1.0, alz: .4, hy: .5 },
  upper_w: { by: -3.5, ix: .3, tx: .3, arx: .4, arz: .3, alx: -1.1, llx: -.6, lrx: .4 },
  upper: { by: 1.5, ix: -.25, tx: -.3, ty: .4, arx: -3.0, arz: .2, alx: -.2, alz: .3, llx: .2, lrx: -.6, hx: -.4 },
  cast: { ix: .05, tx: .1, ty: .1, alx: -1.55, alz: -.25, arx: -1.55, arz: .25, llx: -.5, lrx: .4, by: -1.5 },
  castUp: { ix: -.15, tx: -.2, alx: -3.0, alz: .25, arx: -3.0, arz: -.25, hx: -.5, llz: .2, lrz: -.2 },
  charge: { ix: .2, tx: .3, by: -2.5, alx: -.6, alz: -.6, aly: .8, arx: -.6, arz: .6, ary: -.8, llz: .25, lrz: -.25, llx: -.2, lrx: .2, hx: .3 },
  stomp: { ix: .3, tx: .4, by: -3, alx: -.3, alz: .8, arx: -.3, arz: -.8, llz: .3, lrz: -.3, llx: -.3, lrx: .3 },
  slamUp: { ix: -.3, tx: -.3, alx: -3, arx: -3, llx: -1.2, lrx: -.6 },
  slamDown: { ix: .6, tx: .5, by: -2, alx: -1.2, arx: -1.2, llx: -.8, lrx: .4 },
  slashW: { ty: -.8, tx: .1, arx: -.6, arz: 1.2, ary: .6, alx: -.4, alz: -.4, llx: -.5, lrx: .4, by: -2, hy: .6 },
  slash: { ty: 1.0, tx: .35, ix: .25, arx: -1.5, arz: -.3, ary: -.6, alx: .3, alz: .4, llx: -.9, lrx: .7, by: -3, hy: -.7 },
  run: { ix: .6, tx: .25, by: -1, arx: -1.65, alx: .9, alz: .3, llx: -.9, lrx: .7, hx: -.5 },
  shoulder: { ix: .55, ty: -.7, tx: .2, by: -1.5, alx: -.2, alz: -.4, arx: -.9, arz: .9, llx: -.9, lrx: .6 },
  kickRush: { ix: -.35, iz: .2, by: 1, alx: -1.2, alz: .6, arx: .4, arz: -.6, llx: .3, lrx: -1.6, ty: -.4 },
  windup: { ty: -.9, tx: -.1, ix: -.1, by: -2, arx: .9, arz: .4, alx: -1.3, alz: -.4, llx: -.5, lrx: .4, hy: .7 },
  ball: { by: -7, tx: .95, hx: .55, alx: -2.5, arx: -2.5, alz: .5, arz: -.5, llx: -2.3, lrx: -2.3, llz: .1, lrz: -.1 },
  mega: { ty: 1.1, tx: .3, ix: .2, bz: 3, by: -2.5, arx: -1.6, arz: .1, alx: .6, alz: .4, llx: -.9, lrx: .9, hy: -.9 },
  throwW: { ty: -.6, arx: -2.6, arz: .3, alx: -1.0, llx: -.3, lrx: .3, hy: .5 },
  throw: { ty: .8, tx: .2, arx: -1.7, arz: -.3, ary: -.5, alx: .4, alz: .3, llx: -.5, lrx: .4, hy: -.6 },
  palm: { ix: .1, tx: .15, by: -2.5, alx: -1.6, alz: -.1, arx: -1.6, arz: .1, aly: .5, ary: -.5, llx: -.7, lrx: .6 },
  counter: { ix: .1, ty: .5, tx: .1, by: -2, alx: -1.2, alz: -.9, arx: -.3, arz: .2, llx: -.6, lrx: .5, hy: -.5 },
  grab: { ix: .35, tx: .3, by: -1.5, alx: -1.5, alz: -.2, arx: -1.5, arz: .2, llx: -.7, lrx: .5 },
  lift: { ix: -.2, tx: -.3, by: -1, alx: -3, alz: .15, arx: -3, arz: -.15, llz: .2, lrz: -.2, hx: -.4 },
  suplex: { ix: -.9, tx: -.4, by: -3, alx: -3.1, arx: -3.1, llx: -.3, lrx: -.3 },
  vpose: { tx: -.1, by: -.5, alx: -.2, alz: 2.4, arx: -.2, arz: -2.4, llz: .2, lrz: -.2, hx: -.3 },
  signs: { by: -1, alx: -1.4, alz: -.6, aly: .4, arx: -1.4, arz: .6, ary: -.4, hx: .3, llx: -.2, lrx: .2 },
  point: { ty: .4, arx: -1.57, arz: 0, alx: .2, alz: .2, hy: -.4, llx: -.2, lrx: .2 },
  cross: { ty: .1, alx: -1.2, alz: -1.0, arx: -1.25, arz: 1.0, llz: .1, lrz: -.1, hx: .1 },
};
POSE.jabL_w = mirror(POSE.jabR_w); POSE.jabL = mirror(POSE.jabR);
// reacciones a golpes según la dirección
Object.assign(POSE, {
  hurtFwd: { ix: .35, tx: .45, hx: .45, alx: .3, alz: .6, arx: .35, arz: -.6, llx: -.35, lrx: .4, by: -1 },
  hurtSideL: { iz: .25, ty: -.5, tz: .2, hy: -.5, hz: .3, alx: -.4, alz: 1.0, arx: .3, arz: -.2, llz: .2, lrz: .1 },
  hurtSideR: { iz: -.25, ty: .5, tz: -.2, hy: .5, hz: -.3, arx: -.4, arz: -1.0, alx: .3, alz: .2, lrz: -.2, llz: -.1 },
});
// poses de coreografía: reacciones del que recibe (v...) y del que ataca (a...)
Object.assign(POSE, {
  vGut: { ix: .5, tx: .65, by: -2.5, hx: .35, alx: -.7, alz: -.45, arx: -.7, arz: .45, llx: -.35, lrx: .25 },
  vBack: { ix: -.6, tx: -.55, hx: -.75, alx: -.9, alz: 1.25, arx: -.9, arz: -1.25, llx: .45, lrx: -.25 },
  vLifted: { ix: -.12, tx: -.2, hx: -.55, alx: -1.3, alz: -.35, arx: -1.35, arz: .35, llx: .3, lrx: -.15, llz: .08, lrz: -.05 },
  vKick1: { ix: -.15, tx: -.2, hx: -.5, alx: -1.3, alz: -.35, arx: -1.3, arz: .35, llx: -1.1, lrx: .5 },
  vKick2: { ix: -.1, tx: -.2, hx: -.45, alx: -1.35, alz: -.3, arx: -1.4, arz: .3, llx: .5, lrx: -1.1 },
  vDangle: { ix: -1.45, hx: -.85, alx: -.25, alz: .75, arx: -.15, arz: -.7, llx: .35, lrx: .55, llz: .1, lrz: -.1 },
  vLaunch: { ix: -.35, tx: -.3, hx: -.6, alx: -2.5, alz: .9, arx: -2.6, arz: -.9, llx: .45, lrx: -.4 },
  vStagger: { ty: .6, tx: .2, hx: .4, hy: .6, alx: .4, alz: .8, arx: -.6, arz: -.6, llx: -.45, lrx: .35, by: -1 },
  vFloat: { ix: -.2, hx: -.35, alx: -.4, alz: 1.1, arx: -.4, arz: -1.1, llx: .25, lrx: -.25, llz: .15, lrz: -.15 },
  vFlip: { ix: 2.9, tx: -.3, hx: -.5, alx: -2.4, alz: .7, arx: -2.4, arz: -.7, llx: .3, lrx: -.3 },
  vFlip2: { ix: 4.4, hx: -.4, alx: -2.6, alz: .5, arx: -2.6, arz: -.5 },
  vConfused: { ty: .3, hx: .1, hy: .5, hz: .35, alx: -.3, alz: .5, arx: -1.6, arz: .2, ary: -.6, llz: .1, lrz: -.1 },
  vShock1: { ix: -.15, tx: -.25, hx: -.6, hz: .25, alx: -.4, alz: 1.4, arx: -.2, arz: -1.1, llx: .4, lrx: -.3, llz: .25, lrz: -.2 },
  vShock2: { ix: .1, tx: .2, hx: .2, hz: -.3, alx: -.2, alz: 1.0, arx: -.5, arz: -1.5, llx: -.3, lrx: .45, llz: .15, lrz: -.3 },
  vFrozenStand: { tx: -.05, hx: -.15, alx: -.6, alz: .5, arx: -.7, arz: -.4, llx: -.2, lrx: .15 },
  vUpside: { ix: 3.14, hx: .2, alx: -.3, alz: .6, arx: -.3, arz: -.6, llx: .15, lrx: -.15, llz: .2, lrz: -.2 },
  vSpinA: { ix: -.4, iz: .6, hx: -.5, alx: -2, alz: 1.2, arx: -.6, arz: -1.4, llx: .5, lrx: -.6 },
  aCollar: { ty: .3, tx: .1, by: -1, arx: -2.1, arz: .25, ary: -.2, sx: -1, alx: -.6, alz: -.4, llx: -.4, lrx: .35, hx: -.15 },
  aUpside: { ix: 3.0, tx: .2, alx: .3, alz: .6, arx: .3, arz: -.6, llx: -.6, lrx: .3, hx: .3 },
  aTaunt: { ty: -.2, hy: .3, hz: -.15, alx: -.2, alz: .35, arx: -1.9, arz: .5, ary: .6, llx: -.1, lrx: .1 },
  aCatch: { ix: .2, tx: .25, by: -1.5, alx: -1.7, alz: -.15, arx: -1.7, arz: .15, llx: -.6, lrx: .5 },
});
// poses de lanza para las coreografías de Javicubito (arx + sx = 0 → la lanza apunta recto al frente; más sx = más abajo)
Object.assign(POSE, {
  jDraw: { ix: -.05, ty: -.55, tx: .05, by: -1.5, hy: .35, arx: -.9, sx: 1.55, arz: .2, alx: -.9, alz: .2, llx: -.5, lrx: .4 },
  jStab: { ix: .12, tx: .1, ty: .3, by: -1.6, hy: -.25, arx: -1.5, sx: 1.65, arz: -.05, alx: -1.35, alz: -.3, llx: -.85, lrx: .55 },
  jLift: { ix: -.15, tx: -.15, by: -2.2, hx: -.5, arx: -2.6, sx: 1.55, alx: -2.5, alz: -.25, llx: -.5, lrx: .45, llz: .15, lrz: -.15 },
  jSlam: { ix: .25, tx: .35, by: -3, hx: .25, arx: -1.8, sx: 1.6, alx: -1.2, alz: -.2, llx: -1.1, lrx: .75 },
  jSpin: { iz: .15, ty: -.9, tx: .1, by: -1.5, arx: -1.6, sx: 1.6, arz: .6, alx: -.4, alz: .9, llx: -.5, lrx: .5 },
  jSwing: { ty: 1.0, tx: .2, by: -2, arx: -1.7, sx: 1.0, arz: -.7, alx: .2, alz: .6, llx: -.6, lrx: .5 },
});
POSE.downB = { ix: 1.45, ty: .3, alx: -2.6, alz: .7, arx: -2.9, arz: -.4, llx: -.3, lrx: .15, llz: .15, lrz: -.1, hx: .3, hy: .4 };
POSE.idleM = mirror(POSE.idle);
// poses de lanza: sx gira la lanza en la mano (arx + sx = 0 apunta al frente)
Object.assign(POSE, {
  lancer: { ty: .25, tx: .05, by: -1, arx: -.35, arz: .12, sx: -1.25, alx: -.6, alz: -.25, llx: -.35, lrx: .3, llz: .1, lrz: -.1, hy: -.2 },
  lancerRest: { ty: .1, alx: -.15, alz: .18, arx: -.1, arz: -.12, llz: .08, lrz: -.08, by: -.3, hy: -.1 },
  reach: { ty: -.3, tx: -.05, by: -.5, arx: -2.9, arz: .45, ary: .5, alx: -.3, alz: .1, hy: .35 },
  thrust_w: { ty: -.45, tx: -.05, bz: -2, by: -2, arx: -.75, sx: .75, arz: .1, alx: -1.0, alz: -.3, llx: -.5, lrx: .5, hy: .25 },
  thrust: { ty: .35, tx: .2, ix: .12, bz: 3, by: -2.5, arx: -1.55, sx: 1.55, arz: .08, alx: -.3, alz: .35, llx: -.95, lrx: .75, hy: -.3 },
  sweep_w: { ty: -.9, by: -1.5, arx: -.35, arz: -1.3, sx: .35, alx: -.8, alz: -.2, llx: -.4, lrx: .4, hy: .5 },
  sweep: { ty: 1.1, tx: .2, by: -2, arx: -1.2, arz: -1.2, sx: 1.0, alx: .3, alz: .3, llx: -.7, lrx: .6, hy: -.6 },
  overhead: { ix: -.15, tx: -.25, ty: -.2, by: -.5, arx: -2.9, sx: 2.6, alx: -2.6, alz: .2, llx: -.3, lrx: .2, hx: -.3 },
  plunge: { ix: .35, tx: .45, by: -3.5, arx: -1.2, sx: 2.4, alx: -1.0, alz: -.3, llx: -.85, lrx: .6, hx: .3 },
  upthrust: { ix: -.2, tx: -.2, by: 1, ty: .2, arx: -2.7, sx: 1.3, alx: -.2, alz: .3, llx: .2, lrx: -.6, hx: -.5 },
  lance: { ix: .45, tx: .2, by: -2, arx: -.9, sx: .9, arz: .15, alx: .6, alz: .2, llx: -1, lrx: .8, hx: -.4 },
  spinPose: { tx: .1, by: -2, arx: -1.5, sx: 1.5, arz: -.25, alx: -.6, alz: .9, llz: .22, lrz: -.22, llx: -.2, lrx: .2 },
  spearThrowW: { ty: -.7, by: -1.5, arx: -2.8, sx: 2.55, arz: .1, alx: -1.3, alz: -.2, llx: -.5, lrx: .5, hy: .5 },
  spearThrow: { ty: .8, tx: .25, by: -2.5, arx: -1.5, sx: 1.5, alx: .5, alz: .3, llx: -.8, lrx: .6, hy: -.6 },
});
POSE.block.sx = 1.2;
POSE.visorTouch = { ty: .15, by: -1, arx: -2.35, arz: .55, ary: .2, alx: -.3, alz: .2, hx: -.05, llx: -.3, lrx: .25 };
POSE.lookDown = { hx: .9, tx: .4, by: -3, arx: -2.35, arz: .55, llx: -.3, lrx: .3 };
// poses de los personajes propios: recuperaciones, giros, golpes de cetro, patadas y poses de héroe
Object.assign(POSE, {
  thrustRec: { ty: .15, tx: .08, by: -1.6, arx: -1.05, sx: 1.05, arz: .1, alx: -.7, alz: -.2, llx: -.6, lrx: .5, hy: -.15 },
  sweepRec: { ty: .5, by: -1.4, arx: -.9, arz: -.6, sx: .8, alx: -.2, alz: .2, llx: -.5, lrx: .45, hy: -.3 },
  twirlPose: { ty: .2, by: -.8, arx: -1.2, arz: .3, sx: 1.2, alx: -.5, alz: -.3, llx: -.25, lrx: .25, hy: -.3 },
  lancerAlt: { ty: -.35, tx: .1, by: -2.2, arx: -.6, sx: .6, arz: -.2, alx: -1.2, alz: -.5, llx: -.7, lrx: .6, llz: .12, lrz: -.12, hy: .3 },
  scepterW: { ty: -.8, by: -1, arx: -2.4, arz: .5, sx: 2.0, alx: -.6, alz: -.3, llx: -.4, lrx: .35, hy: .4 },
  scepterSmash: { ty: .6, tx: .35, ix: .15, by: -2.5, arx: -1.0, sx: 2.2, alx: .3, alz: .4, llx: -.8, lrx: .6, hy: -.4 },
  magicPalm: { ty: -.5, tx: .1, by: -1.5, alx: -1.6, alz: -.2, aly: .4, arx: -.25, sx: -1.25, arz: .1, llx: -.55, lrx: .45, hy: .45 },
  kickHigh: { ty: -.7, ix: -.35, iz: .2, by: 1, lrx: -2.2, lrz: .3, llx: .3, arx: .5, arz: -.7, alx: -1.1, alz: .5, hy: .6 },
  redStance: { ty: .3, tx: .05, by: -1.2, arx: -1.1, arz: .3, alx: -.9, alz: -.3, llx: -.4, lrx: .35, llz: .1, lrz: -.1, hy: -.25 },
  javiHero: { ty: .5, tx: .1, by: -2.5, arx: -.75, sx: .4, arz: -.2, alx: -1.0, alz: -.6, llx: -.9, lrx: .7, llz: .15, lrz: -.15, hy: -.5 },
  gatoHero: { ty: .3, by: -.5, arx: -2.6, arz: .2, sx: 1.0, alx: -.4, alz: .6, hx: -.25, hy: -.3, llx: -.1, lrx: .2 },
  redHero: { ty: .2, by: -1.5, arx: -2.35, arz: .55, ary: .2, alx: -1.5, alz: -.2, hx: -.1, hy: -.2, llx: -.5, lrx: .4 },
  bow: { ix: .25, tx: .35, hx: .3, by: -.5, arx: -.4, arz: .2, sx: -1, alx: -.2, alz: .3 },
});
function stancePose(ch, T, seed, out) {
  const b = POSE[out === false && POSE[ch.stance + 'Rest'] ? ch.stance + 'Rest' : ch.stance] || POSE.idle, s = Math.sin(T * 2.6 + seed);
  const o = Object.assign({}, b);
  o.by = (b.by || 0) + s * .45; o.tx = (b.tx || 0) + s * .03; o.alx = (b.alx || 0) + s * .05; o.arx = (b.arx || 0) - s * .05; o.hx = (b.hx || 0) - s * .03;
  return o;
}
function runPose(f, sp) {
  const amt = Math.min(1, sp / 8.5), s = Math.sin(f.walk), c = Math.cos(f.walk);
  return { ix: .06 + .22 * amt, tx: .1 * amt, ty: s * .22 * amt, iz: clamp(-f.yawVel * .06, -.35, .35), by: -Math.abs(c) * 1.8 * amt + .3, hx: -.12 * amt, hy: -s * .15 * amt,
    arx: s * 1.15 * amt - .15, alx: -s * 1.15 * amt - .15, arz: -.12, alz: .12, ary: -.2, aly: .2, llx: s * 1.2 * amt, lrx: -s * 1.2 * amt };
}
function barragePose(T) { const s = Math.sin(T * 44); return { ix: .1, tx: .15, ty: s * .35, by: -2, bz: s, arx: -1.55 + s * .35, alx: -1.55 - s * .35, arz: .12, alz: -.12, llx: -.5, lrx: .4 }; }
function dizzyPose(T) { return { ix: Math.sin(T * 5) * .12, iz: Math.cos(T * 4) * .1, hx: .3, hz: Math.sin(T * 6) * .3, alx: .2, alz: .4, arx: .3, arz: -.4, by: -1 }; }

// Desgloses de Javi: cadera primero, siluetas asimétricas y recuperación con peso.
Object.assign(POSE, {
  jCoil: { ix: -.12, tx: .08, ty: -.72, by: -3.1, bz: -1.4, hy: .6, arx: -.85, ary: .12, arz: .25, sx: 1.25, alx: -1.1, alz: -.38, llx: -.8, lrx: .55, llz: .15, lrz: -.13 },
  jDrive: { ix: .23, tx: .18, ty: .38, by: -2.6, bz: 2.1, hx: -.12, hy: -.32, arx: -1.58, sx: 1.45, arz: -.07, alx: -.65, alz: -.48, llx: -1.1, lrx: .7, llz: .12, lrz: -.08 },
  jRecoil: { ix: .05, tx: .02, ty: .18, by: -2, bz: .7, hx: -.08, hy: -.2, arx: -1.35, sx: 1.48, arz: -.06, alx: -1.15, alz: -.22, llx: -.7, lrx: .5 },
  jBrace: { ix: .16, tx: .2, ty: -.25, by: -3.8, hx: -.28, arx: -1.7, sx: 1.45, alx: -1.8, alz: -.2, llx: -.85, lrx: .55, llz: .18, lrz: -.18 },
  jLiftArc: { ix: -.18, tx: -.2, ty: -.15, by: -.7, hx: -.42, hy: .12, arx: -2.8, sx: 1.45, alx: -2.5, alz: -.22, llx: -.25, lrx: .35, llz: .14, lrz: -.12 },
  jPivot: { ix: -.12, iz: -.15, tx: -.1, ty: -.45, by: -1.5, hx: -.3, hy: .4, arx: -2.65, sx: 1.48, arz: -.12, alx: -2.3, alz: -.35, llx: -.6, lrx: .25, llz: .2, lrz: -.1 },
  jOver: { ix: -.22, tx: -.26, ty: -.38, by: -.4, hx: -.35, hy: .3, arx: -3.05, sx: 2.45, alx: -2.7, alz: -.18, llx: -.45, lrx: .18 },
  jImpact: { ix: .42, tx: .4, ty: .15, by: -4.8, bz: 1.6, hx: .1, hy: -.12, arx: -1.55, sx: 2.35, alx: -1.4, alz: -.3, llx: -1.15, lrx: .8, llz: .2, lrz: -.14 },
  jSettle: { ix: .25, tx: .2, ty: .2, by: -3.2, hx: -.08, hy: -.2, arx: -1.25, sx: 1.85, alx: -.8, alz: -.32, llx: -.9, lrx: .65, llz: .15, lrz: -.1 },
  jSprint: { ix: .45, iz: -.16, tx: .18, ty: -.3, by: -2.4, hx: -.35, hy: .2, arx: -.9, sx: 1.1, arz: .16, alx: .8, alz: .5, llx: -1.2, lrx: .85 },
  jBank: { ix: .24, iz: -.38, tx: .1, ty: -.65, by: -2.7, hx: -.2, hy: .5, arx: -1.45, sx: 1.5, arz: .45, alx: -.35, alz: .95, llx: -.8, lrx: .4, llz: .22, lrz: -.12 },
  jRise: { ix: -.2, tx: -.18, ty: -.22, by: .2, hx: -.4, hy: .15, arx: -2.8, sx: 1.6, alx: -1.8, alz: -.5, llx: -1.2, lrx: .65, llz: .12, lrz: -.2 },
  jHang: { ix: -.12, iz: .12, tx: -.1, ty: -.4, by: .1, hx: .18, hy: .35, arx: -2.9, sx: 2.3, alx: -2.4, alz: -.35, llx: -1.3, lrx: -.45, llz: .2, lrz: -.15 },
  jDive: { ix: .3, tx: .25, ty: .1, by: -1.6, hx: .12, arx: -1.3, sx: 2.8, alx: -1.6, alz: -.25, llx: -.5, lrx: .85, llz: .12, lrz: -.08 },
  jVaultApex: { ix: -.6, iz: .4, tx: -.15, ty: -.3, hx: .2, hy: .25, arx: -2.7, sx: 1.8, alx: -.7, alz: 1.1, llx: -1.6, lrx: -.7, llz: .15, lrz: -.18 },
  jVault: { ix: -.35, iz: .15, tx: -.1, ty: -.2, hx: -.2, arx: -2.6, sx: 1.7, alx: -1.2, alz: .9, llx: -1.4, lrx: -.5 },
  jUncoil: { ix: .12, tx: .22, ty: .7, by: -2.5, hx: -.1, hy: -.55, arx: -1.75, sx: 1.25, arz: -.6, alx: .3, alz: .7, llx: -.85, lrx: .65 },
  jFollow: { ix: .1, tx: .1, ty: .95, by: -1.6, hx: -.1, hy: -.7, arx: -1.5, sx: 1.15, arz: -.8, alx: .5, alz: .5, llx: -.65, lrx: .45 },
  vDrag: { ix: .35, tx: .38, ty: -.22, by: -1.8, hx: .2, hy: .18, alx: .6, alz: .65, arx: .35, arz: -.7, llx: -.65, lrx: .8 },
  vArc: { ix: -1.1, tx: -.2, iz: .2, hx: -.65, hz: .15, alx: -.6, alz: .9, arx: -.15, arz: -.8, llx: .7, lrx: .25, llz: .18, lrz: -.08 },
  vFold: { ix: .58, tx: .55, by: -3.2, hx: .4, hy: -.12, alx: -.75, alz: -.3, arx: -.9, arz: .35, llx: -.55, lrx: .45 },
});

POSE.jHeroBreath = Object.assign({}, POSE.javiHero, { tx: .075, by: -2.25, hy: -.45, alx: -.94 });

// Deformación anime de Javi. Los miembros pueden salirse de la silueta del torso;
// el desplazamiento viaja con la pose y vuelve suavemente a su unión en reposo.
const JAVI_ACTING = {
  jCoil: { bx: -1.2, bz: -2.2, by: -3.8, ty: -.86, tx: .14, tpx: -.8, tpy: -.6, tpz: -1.3, hpx: .9, hpy: .4, hpz: .8, arpx: -1.8, arpy: .6, arpz: -2.6, alpx: 1.5, alpy: .4, alpz: 1.5, llpx: 1.3, llpy: -.5, llpz: -1.8, lrpx: -1.1, lrpy: -.5, lrpz: 2.2, tscx: 1.04, tscy: .96 },
  jDraw: { arpx: -1.6, arpy: .5, arpz: -1.6, alpx: 1.3, alpz: .8, tpx: -.5, tpz: -.7, hpx: .7, llpz: -1.5, lrpz: 1.5 },
  jDrive: { ix: .3, tx: .24, ty: .5, sx: 1.08, bx: .6, bz: 3.3, by: -3, tpx: .8, tpz: 1.4, hpx: -.8, hpy: .7, hx: -.22, arpx: -2.4, arpy: .8, arpz: 4.8, ars: 1.14, alpx: 2, alpy: .5, alpz: -2.8, als: .96, llpx: 1.6, llpy: -.7, llpz: 2.8, lrpx: -1.4, lrpy: -.6, lrpz: -3, lls: 1.1, lrs: .96, tscx: .96, tscy: 1.05 },
  jRecoil: { tpx: .3, tpz: .7, hpx: -.4, hpy: .3, arpx: -1.3, arpz: 1.8, alpx: 1, alpz: -.8, llpz: 1.4, lrpz: -1.2, ars: 1.04 },
  jBrace: { by: -4.2, tpy: -.7, tpz: .5, hpy: .5, hpz: -.6, arpx: -1.2, arpz: .5, alpx: 1.2, alpz: .7, llpx: 1.5, llpz: .9, lrpx: -1.5, lrpz: -.9, tscx: 1.08, tscy: .91 },
  jLift: { arpx: -1.5, arpy: 1.2, arpz: .5, alpx: 1.3, alpy: 1, alpz: .7, hpy: .5, llpx: .9, lrpx: -.9, tscy: 1.04 },
  jLiftArc: { bx: -.8, by: -.1, ix: -.23, tx: -.24, tpx: -.6, tpy: .6, hpz: -.6, hpy: .7, arpx: -1.7, arpy: 1.9, arpz: 1.6, alpx: 1.6, alpy: 1.6, alpz: 1.9, ars: 1.08, als: 1.04, llpx: 1.2, llpy: -.6, llpz: -.8, lrpx: -1.1, lrpy: -.5, lrpz: 1.3, tscx: .97, tscy: 1.08 },
  jPivot: { bx: 1.1, iz: -.23, ty: -.65, tpx: -1.1, tpz: -.6, hpx: 1.3, hpy: .5, arpx: -2.2, arpy: 1.5, arpz: 1.1, alpx: 1.8, alpy: 1.1, alpz: -.8, llpx: 1.8, llpy: -.4, llpz: 1.6, lrpx: -1.3, lrpy: .9, lrpz: -1.8 },
  jOver: { tpy: .8, tpz: -.6, hpy: .6, hpz: .9, arpx: -1.5, arpy: 2.4, arpz: -1, alpx: 1.6, alpy: 2, alpz: -1.1, ars: 1.08, als: 1.06, llpx: 1, llpy: -.8, lrpx: -1, lrpy: -.8, tscy: 1.08 },
  jImpact: { ix: .48, tx: .45, by: -5.1, tpy: -1, tpz: 1.8, hpy: .9, hpz: -1, arpx: -2, arpy: -.3, arpz: 3.5, ars: 1.1, alpx: 1.8, alpy: -.4, alpz: 2.8, als: 1.06, llpx: 2, llpy: -.4, llpz: 2.1, lrpx: -1.8, lrpy: -.4, lrpz: -2.1, tscx: 1.13, tscy: .86, tscz: 1.06 },
  jSettle: { tpy: -.4, tpz: .7, hpy: .4, arpx: -1.1, arpz: 1.4, alpx: .9, alpz: .8, llpx: 1, llpz: 1, lrpx: -.9, lrpz: -.9, tscx: 1.04, tscy: .96 },
  jSprint: { ix: .58, ty: -.4, bx: -.8, bz: 1.8, tpx: -.7, tpz: 1.3, hpx: .8, hpz: -1.1, arpx: -2.1, arpy: .5, arpz: -2.3, alpx: 2.3, alpy: .6, alpz: -3.2, als: 1.08, llpx: 1.7, llpy: -.8, llpz: 3.8, lrpx: -1.5, lrpy: .7, lrpz: -3.7, lls: 1.13, lrs: .9, tscx: .95, tscy: 1.06 },
  jBank: { iz: -.52, bx: 1.7, tpx: -1.8, tpz: .5, hpx: 1.9, hpy: .6, arpx: -2.6, arpy: .8, arpz: .5, alpx: 2.8, alpy: 1, alpz: -1, llpx: 2, llpy: -.6, llpz: 2.1, lrpx: -1.5, lrpy: 1.3, lrpz: -2.6, lls: 1.1, lrs: .92 },
  jRise: { ix: -.28, tpy: .8, tpz: -.8, hpy: .6, arpx: -1.6, arpy: 1.9, arpz: 1.4, alpx: 2.2, alpy: 1, alpz: -1.7, llpx: 1.8, llpy: .5, llpz: 2.8, lrpx: -1.7, lrpy: -.8, lrpz: -2.6, lrs: 1.1, tscx: .96, tscy: 1.1 },
  jHang: { ix: -.23, iz: .24, ty: -.55, tpy: .9, tpx: -.7, hpx: .8, hpy: .7, hpz: 1.1, arpx: -2.5, arpy: 2, arpz: -1.2, alpx: 2.5, alpy: 1.7, alpz: -.9, llpx: 2.1, llpy: 1.5, llpz: 2.8, lrpx: -2, lrpy: 1, lrpz: -1.8, lls: .9, lrs: .94, tscy: 1.05 },
  jDive: { ix: .4, tpy: -.5, tpz: 1.4, hpy: .8, hpz: -1, arpx: -1.8, arpy: -.2, arpz: 2.8, alpx: 1.6, alpy: -.2, alpz: 2, ars: 1.13, als: 1.08, llpx: 1.6, llpy: -.8, llpz: -1.2, lrpx: -1.8, lrpy: -.7, lrpz: -3, lls: 1.08, lrs: 1.12, tscx: .96, tscy: 1.1 },
  jVault: { bx: -.8, tpx: -.6, tpy: .4, hpx: .7, hpy: .6, arpx: -2, arpy: 1.6, arpz: -1.2, alpx: 2.6, alpy: .8, alpz: -2.4, llpx: 1.6, llpy: 1.1, llpz: 2, lrpx: -1.8, lrpy: .6, lrpz: -1.8, lls: .93, lrs: .96 },
  jVaultApex: { iz: .55, tpx: -1.1, tpy: .6, hpx: 1.3, hpy: .7, arpx: -2.8, arpy: 1.8, arpz: -.9, alpx: 3.3, alpy: .6, alpz: -3, llpx: 2.3, llpy: 1.8, llpz: 2.7, lrpx: -2.2, lrpy: .7, lrpz: -2.4, lls: .88, lrs: 1.06, tscx: .96, tscy: 1.07 },
  jUncoil: { ty: .9, bx: -.5, tpx: .8, tpz: 1.1, hpx: -.9, hpy: .6, arpx: -2.7, arpy: .7, arpz: 3.1, alpx: 2.6, alpy: .6, alpz: -3.2, ars: 1.15, als: 1.06, llpx: 1.7, llpy: -.5, llpz: 2.5, lrpx: -1.6, lrpy: -.5, lrpz: -2.4, tscx: .95, tscy: 1.07 },
  jFollow: { tpx: .5, tpz: .7, hpx: -.7, hpy: .4, arpx: -1.9, arpz: 2, alpx: 1.7, alpz: -2, llpx: 1, llpz: 1.5, lrpx: -.9, lrpz: -1.4, ars: 1.05 },
  javiHero: { tpx: -.3, hpx: .4, hpy: .3, arpx: -.7, arpz: .5, alpx: .8, alpz: -.4, llpx: .5, llpz: .6, lrpx: -.5, lrpz: -.6 },
  vFold: { ix: .28, tx: .43, by: -1.6, tpy: -.8, tpz: 1.6, hpy: .6, hpz: 2.4, alpx: 1.9, alpy: .8, alpz: 1.8, arpx: -1.8, arpy: .6, arpz: 1.9, llpx: .9, llpy: -.6, lrpx: -.9, lrpy: -.6, tscx: 1.12, tscy: .86, hscy: .96 },
  vArc: { tpy: .5, hpy: .8, hpz: -1.6, alpx: 2.6, alpy: .8, alpz: -1.8, arpx: -2.4, arpy: .7, arpz: -1.4, llpx: 1.6, llpy: -.8, llpz: -1.1, lrpx: -1.7, lrpy: -.6, lrpz: 1.8, tscy: 1.09 },
  vDrag: { tpz: 1, hpz: -.8, hpy: .4, alpx: 1.8, alpz: -1.5, arpx: -1.6, arpz: -1.2, llpx: 1, llpy: -.7, llpz: 2, lrpx: -1.2, lrpy: -.5, lrpz: -2 },
};
for (const [name, acting] of Object.entries(JAVI_ACTING)) Object.assign(POSE[name], acting);
POSE.jSmear = Object.assign({}, POSE.jDrive, { ix: .38, bz: 4.5, arpx: -3.2, arpz: 7.2, ars: 1.38, alpz: -4.2, als: 1.12, llpz: 4, lrpz: -4.2, lls: 1.2, lrs: 1.12, tscx: .87, tscy: 1.17, hscx: .96, hscy: 1.04 });
POSE.jDownSmear = Object.assign({}, POSE.jDive, { ix: .48, arpz: 4.5, arpy: -1.3, ars: 1.34, alpy: -1.1, als: 1.25, llpy: -1.8, lrpy: -1.8, lls: 1.2, lrs: 1.24, tscx: .9, tscy: 1.17 });
POSE.jSweepSmear = Object.assign({}, POSE.jUncoil, { ty: 1.1, arpx: -4.1, arpz: 4.7, ars: 1.35, alpx: 3.4, alpz: -4.7, tpx: 1.8, tscx: .91, tscy: 1.12 });
POSE.jHeroBreath = Object.assign({}, POSE.javiHero, { tx: .075, by: -2.25, hy: -.45, alx: -.94 });

// Reacciones específicas de la víctima en las cinemáticas de Javi.
Object.assign(POSE, {
  // La víctima actúa por fases: reflejo inicial, peso suspendido, arrastre de
  // extremidades, recogida antes del suelo, compresión y rebote.
  vJReady: { ix: .04, tx: .07, by: -.7, hx: -.08, alx: -.9, alz: -.4, arx: -1.05, arz: .36, llx: -.25, lrx: .2, llpx: .4, lrpx: -.4, hpy: .2 },
  vJPierced: { ix: .13, tx: .28, by: -.8, hx: .28, alx: -1.35, alz: -.32, arx: -1.45, arz: .3, llx: -.45, lrx: .35, tpy: -.3, tpz: .9, hpy: .5, hpz: 1.1, alpx: 1.4, alpy: .8, alpz: 1.8, arpx: -1.3, arpy: .6, arpz: 1.6, llpx: .7, llpz: .9, lrpx: -.7, lrpz: -1.3, tscx: 1.06, tscy: .93 },
  vJShudder: { ix: .06, tx: .18, by: -.5, hx: -.12, hz: .06, alx: -1.15, alz: -.25, arx: -1.4, arz: .3, llx: -.3, lrx: .2, tpz: .5, hpy: .7, hpz: -.5, alpx: 1.1, alpz: 1.5, arpx: -1.2, arpz: 1.7, llpy: -.3, lrpy: -.4, tscy: .98 },
  vJHang: { ix: -.12, tx: -.09, hx: -.36, hy: .06, alx: -.95, alz: .46, arx: -1.2, arz: -.28, llx: .22, lrx: -.18, llz: .1, lrz: -.08, tpy: .3, hpz: -.8, hpy: .8, alpx: 1.6, alpy: -.3, alpz: .8, arpx: -1.4, arpy: .2, arpz: 1.2, llpx: 1, llpy: -1.5, llpz: -.9, lrpx: -.9, lrpy: -1.2, lrpz: .8, tscy: 1.06, lls: 1.04, lrs: 1.03 },
  vJHangLag: { ix: -.18, tx: -.12, hx: -.45, hz: -.08, alx: -.55, alz: .8, arx: -.8, arz: -.55, llx: .5, lrx: -.32, llz: .14, lrz: -.13, tpy: .4, hpy: 1, hpz: -1.2, alpx: 2.2, alpy: -.6, alpz: -.5, arpx: -1.8, arpy: -.3, arpz: .2, llpx: 1.4, llpy: -1.7, llpz: -1.5, lrpx: -1.2, lrpy: -.8, lrpz: 1.3, tscy: 1.08, lls: 1.07 },
  vJFoldFall: { ix: .8, tx: .19, hx: .35, alx: -1.6, alz: .5, arx: -1.8, arz: -.4, llx: -1, lrx: -.65, tpy: -.2, tpz: 1.1, hpy: .6, hpz: .8, alpx: 2, alpy: .6, alpz: 2.2, arpx: -1.9, arpy: .4, arpz: 2.1, llpx: 1.5, llpy: 1, llpz: 1.8, lrpx: -1.4, lrpy: .5, lrpz: -.8, tscx: 1.05, tscy: .92, lls: .93, lrs: .95 },
  vJGroundPre: { ix: 1.3, tx: .05, hx: -.1, alx: -2.35, alz: .5, arx: -2.5, arz: -.45, llx: -.3, lrx: .15, llz: .2, lrz: -.16, alpx: 2.2, alpz: 1, arpx: -2.1, arpz: .8, hpy: .5, llpx: 1.2, lrpx: -1.1, tscy: 1.02 },
  vJGroundHit: { ix: 1.5, tx: .03, hx: -.12, hy: .2, alx: -2.6, alz: .62, arx: -2.8, arz: -.55, llx: -.2, lrx: .18, llz: .25, lrz: -.22, tpy: -.4, hpy: .7, hpz: -.3, alpx: 3, alpy: .4, alpz: 1.5, arpx: -2.8, arpy: .3, arpz: 1.4, llpx: 1.9, llpy: -.3, lrpx: -1.7, lrpy: -.2, tscx: 1.16, tscy: .82, tscz: 1.06, hscy: .94 },
  vJGroundRebound: { ix: 1.38, tx: -.06, hx: -.18, hy: .2, alx: -2.4, alz: .52, arx: -2.7, arz: -.45, llx: -.35, lrx: .26, llz: .2, lrz: -.2, tpy: .2, hpy: .7, alpx: 2.3, alpy: .5, arpx: -2.1, arpy: .5, llpx: 1.4, lrpx: -1.3, tscx: 1.04, tscy: 1.04 },
  vJSideL: { ix: -.08, iz: .28, tx: -.12, ty: -.3, tz: .16, hx: -.28, hy: -.35, hz: .22, alx: -.45, alz: .92, arx: -.6, arz: -.24, llx: .15, lrx: -.35, llz: .2, lrz: .08, tpx: 1, hpx: .9, hpy: .5, alpx: 2.7, alpy: .4, alpz: -.9, arpx: -1.4, arpy: .6, arpz: .9, llpx: 1.4, llpy: -.6, llpz: -1, lrpx: -.7, lrpy: .4, lrpz: 1.5, tscx: .95, tscy: 1.06 },
  vJAfterL: { ix: .02, iz: .16, tx: .08, ty: -.18, hx: -.1, hy: -.22, hz: .1, alx: -.7, alz: .7, arx: -.9, arz: -.3, llx: -.1, lrx: -.22, hpx: .6, hpy: .4, alpx: 1.9, alpz: -.3, arpx: -1.1, arpz: .5, llpx: .9, llpz: -.6, lrpx: -.6, lrpz: .8 },
  vJLaunch: { ix: -.3, tx: -.2, hx: -.5, hy: .05, alx: -1.75, alz: .85, arx: -1.9, arz: -.7, llx: .45, lrx: -.35, tpy: .6, hpy: .9, hpz: -1.2, alpx: 2.5, alpy: .8, alpz: -1.4, arpx: -2.3, arpy: .6, arpz: -1.1, llpx: 1.3, llpy: -1.2, llpz: -2, lrpx: -1.1, lrpy: -.6, lrpz: 1.6, tscx: .96, tscy: 1.1, lls: 1.08, lrs: 1.05 },
  vJFloat: { ix: -.15, iz: .1, tx: -.06, hx: -.2, hz: -.06, alx: -.7, alz: .95, arx: -.9, arz: -.8, llx: -.28, lrx: .24, tpy: .3, hpy: .5, alpx: 2.2, alpz: .2, arpx: -2, arpz: .5, llpx: 1.4, llpy: .5, llpz: 1.3, lrpx: -1.3, lrpy: -.5, lrpz: -.9, tscy: 1.03 },
  vJDiveCatch: { ix: .42, tx: .24, hx: .25, alx: -1.2, alz: .5, arx: -1.3, arz: -.45, llx: -.6, lrx: .3, tpy: -.3, hpz: 1.2, hpy: .7, alpx: 2, alpy: .7, alpz: 1.9, arpx: -1.8, arpy: .4, arpz: 1.7, llpx: 1.2, llpy: .4, lrpx: -1.1, lrpy: -.3, tscx: 1.09, tscy: .9 },
  vJChainPull: { ix: .25, tx: .21, by: -.6, hx: -.2, alx: .25, alz: .65, arx: .4, arz: -.55, llx: -.45, lrx: .6, tpz: 1, hpz: -1, hpy: .5, alpx: 2, alpy: .2, alpz: -2, arpx: -1.8, arpy: .4, arpz: -1.8, llpx: 1.1, llpy: -.7, llpz: 2, lrpx: -.9, lrpy: -.4, lrpz: -2.1, tscx: .96, tscy: 1.07, als: 1.06, ars: 1.04 },
  vJLookBack: { ix: .04, tx: .08, ty: .16, hx: -.2, hy: -.72, hz: -.1, alx: -.8, alz: -.3, arx: -1.1, arz: .35, llx: -.3, lrx: .2, hpx: -.6, hpy: .4, alpx: 1, arpx: -.9, llpx: .5, lrpx: -.5 },
});
POSE.vJSideR = mirror(POSE.vJSideL); POSE.vJAfterR = mirror(POSE.vJAfterL);

// Derribo y remate: la mano izquierda conduce la cabeza, el pie derecho fija el
// pecho y la derecha lleva la estaca. Poses específicas para ambos intérpretes.
Object.assign(POSE, {
  jGReach: { ix: .13, tx: .12, ty: .08, by: -1.5, alx: -2.1, alz: -.12, arx: -.55, arz: -.15, sx: -.8, llx: -.45, lrx: .35, alpx: .5, alpy: .4, alpz: 2.3, als: 1.08, arpx: -.8, arpz: -.8, hpy: .3, hy: -.08, llpz: 1, lrpz: -1 },
  jGClutch: { ix: .18, tx: .15, ty: .07, by: -2, alx: -2.2, alz: -.1, arx: -.5, arz: -.12, sx: -.85, llx: -.62, lrx: .45, alpx: .7, alpy: 2.4, alpz: 2.6, als: 1.08, arpx: -.9, arpz: -1, hpy: .4, hx: .12, llpz: 1.3, lrpz: -1.3 },
  jGDrag: { ix: .34, tx: .25, ty: .05, by: -3.2, alx: -1.15, alz: -.08, arx: -.45, arz: -.15, sx: -.9, llx: -.7, lrx: .52, alpx: .5, alpy: -.4, alpz: 2.8, als: 1.1, arpx: -1, arpz: -1.2, hpy: .4, hx: .3, tpz: .6, tscx: 1.05, tscy: .95, llpx: .8, lrpx: -.8 },
  jGThrow: { ix: .48, tx: .3, ty: .03, by: -3.9, alx: -.8, alz: -.05, arx: -.55, arz: -.12, sx: -.8, llx: -.85, lrx: .6, alpx: .7, alpy: -1, alpz: 3.7, als: 1.16, arpx: -.9, arpz: -.6, hx: .33, hpy: .6, tpz: .9, tscx: 1.08, tscy: .92, llpz: 1.2, lrpz: -1.4 },
  jGFollow: { ix: .3, tx: .2, ty: .03, by: -2.6, alx: -.35, alz: .3, arx: -.7, arz: -.1, sx: -.7, llx: -.6, lrx: .45, alpx: 1.1, alpz: 1.5, arpx: -.8, hx: .38, hpy: .4, llpz: .8, lrpz: -.7 },
  jGStep: { ix: .07, tx: .1, ty: .02, by: -.6, alx: -.4, alz: .35, arx: -1.2, arz: -.1, sx: .3, llx: .08, lrx: -1.15, lrz: -.1, alpx: 1.1, arpx: -1, arpz: .8, lrpx: -.4, lrpy: 1.2, lrpz: 2.2, lrs: .94, hx: .28, hpy: .3 },
  jGPin: { ix: .08, tx: .11, ty: .02, by: -1, alx: -.4, alz: .36, arx: -1.75, arz: -.08, sx: 1.1, llx: .1, lrx: -.93, lrz: -.08, alpx: 1.2, alpz: -.5, arpx: -1.1, arpy: .4, arpz: 1.8, lrpx: -.5, lrpy: .2, lrpz: 2.3, hx: .32, hpy: .3, llpz: -.7, tscy: .98 },
  jGRaise: { ix: .02, tx: .04, ty: -.03, by: -.4, alx: -.35, alz: .4, arx: -2.25, arz: -.05, sx: 2.8, llx: .08, lrx: -.91, lrz: -.08, alpx: 1.2, arpx: 1.5, arpy: 3, arpz: 7.5, ars: 1.04, lrpx: -.5, lrpz: 2.3, hx: .2, hpy: .4, tpy: .3, tscy: 1.04 },
  jGPoise: { ix: .04, tx: .04, ty: -.02, by: -.5, alx: -.3, alz: .45, arx: -2.25, arz: -.04, sx: 2.9, llx: .1, lrx: -.91, lrz: -.08, alpx: 1.4, arpx: 1.5, arpy: 3, arpz: 8, lrpx: -.5, lrpz: 2.3, hx: .28, hpy: .4, tscy: 1.03 },
  jGDrive: { ix: .08, tx: .08, ty: .01, by: -.8, alx: -.7, alz: .4, arx: -1.55, arz: -.04, sx: 3, llx: .14, lrx: -.95, lrz: -.08, alpx: 1.4, alpz: -.7, arpx: 2, arpy: 2, arpz: 7.5, ars: 1.12, lrpx: -.5, lrpz: 2.3, hx: .38, hpy: .6, tpz: .7, tscx: 1.06, tscy: .94 },
  jGHold: { ix: .06, tx: .06, ty: .01, by: -.7, alx: -.6, alz: .35, arx: -1.6, arz: -.04, sx: 3, llx: .12, lrx: -.94, lrz: -.08, alpx: 1.2, arpx: 2, arpy: 2, arpz: 6.5, lrpx: -.5, lrpz: 2.3, hx: .34, hpy: .4, tscy: .98 },
  jGWithdraw: { ix: .05, tx: .05, ty: .02, by: -.8, alx: -.35, alz: .35, arx: -2.6, arz: -.06, sx: 2.4, llx: .05, lrx: -.8, alpx: 1, arpx: -.9, arpy: .8, arpz: 2.3, lrpx: -.4, lrpy: .4, lrpz: 1.7, hx: .28, hpy: .3 },
  jGRecover: { ix: .04, tx: .05, ty: .09, by: -.8, alx: -.3, alz: .25, arx: -1.1, arz: -.1, sx: 1.15, llx: -.3, lrx: .25, arpx: -.6, arpz: .5, llpz: .5, lrpz: -.5, hx: .1 },
  vGGrab: { ix: -.08, tx: -.08, by: -.8, hx: -.3, hy: .1, alx: -1.5, alz: -.15, arx: -1.8, arz: .18, llx: -.2, lrx: .25, hpy: .8, hpz: -.5, alpx: 1.2, alpy: 1, alpz: 2, arpx: -1, arpy: 1.2, arpz: 1.8, llpx: .7, lrpx: -.6, tscy: 1.04 },
  vGOffBalance: { ix: -.45, tx: -.12, hx: -.4, hy: .1, alx: -1.4, alz: .25, arx: -1.7, arz: -.18, llx: -.85, lrx: .6, hpy: .7, hpz: -.8, alpx: 1.8, alpy: .8, alpz: 1.4, arpx: -1.5, arpy: .6, arpz: 1.3, llpx: 1.2, llpy: .5, llpz: 1.8, lrpx: -1, lrpy: -.4, lrpz: -1.5, tscy: 1.06 },
  vGFall: { ix: -1.03, tx: -.08, hx: -.2, alx: -1.1, alz: .75, arx: -1.4, arz: -.65, llx: -.95, lrx: -.45, llz: .2, lrz: -.2, hpy: .5, alpx: 2.6, alpy: .5, alpz: -.7, arpx: -2.3, arpy: .3, arpz: -.6, llpx: 1.8, llpy: .8, lrpx: -1.6, lrpy: .5, tscx: 1.04, tscy: .96, lls: .94, lrs: .96 },
  vGBackHit: { ix: -1.5, tx: .02, hx: .05, hy: .12, alx: -.6, alz: 1.1, arx: -.8, arz: -.95, llx: -.45, lrx: -.25, llz: .2, lrz: -.2, hpy: .5, alpx: 2.7, alpy: .3, arpx: -2.5, arpy: .2, llpx: 1.7, lrpx: -1.5, tscx: 1.12, tscy: .85, hscy: .96 },
  vGBackRebound: { ix: -1.38, tx: -.07, hx: .1, hy: .12, alx: -.8, alz: .95, arx: -.95, arz: -.8, llx: -.7, lrx: -.4, llz: .16, lrz: -.15, hpy: .6, alpx: 2.2, alpy: .5, arpx: -2, arpy: .4, llpx: 1.5, llpy: .4, lrpx: -1.3, lrpy: .2, tscy: 1.03 },
  vGOnBack: { ix: -1.5, tx: .02, hx: .08, hy: .1, alx: -.55, alz: .9, arx: -.7, arz: -.8, llx: -.3, lrx: -.15, llz: .15, lrz: -.13, hpy: .35, alpx: 1.8, arpx: -1.7, llpx: 1.2, lrpx: -1.1 },
  vGPressed: { ix: -1.5, tx: .12, hx: .22, hy: .08, alx: -1.05, alz: .65, arx: -1.2, arz: -.6, llx: -.62, lrx: -.35, llz: .2, lrz: -.18, tpy: -.4, tpz: .5, hpy: .5, hpz: .8, alpx: 2.1, alpy: .4, alpz: 1.1, arpx: -1.9, arpy: .3, arpz: 1, llpx: 1.6, llpy: .3, lrpx: -1.4, lrpy: .2, tscx: 1.08, tscy: .9 },
  vGStruggle: { ix: -1.49, tx: .07, hx: .18, hy: -.1, alx: -1.3, alz: .45, arx: -1.1, arz: -.55, llx: -.48, lrx: -.7, llz: .2, lrz: -.2, hpy: .5, hpz: .6, alpx: 2, alpy: .5, alpz: 1.4, arpx: -1.9, arpy: .4, arpz: 1.2, llpx: 1.4, llpy: .2, lrpx: -1.3, lrpy: .5, tscx: 1.04, tscy: .95 },
  vGFlinch: { ix: -1.52, tx: .07, hx: .02, hy: .04, alx: -.55, alz: 1.04, arx: -.65, arz: -.95, llx: -.54, lrx: -.4, llz: .23, lrz: -.2, hpy: .2, alpx: 2.9, alpy: .3, arpx: -2.7, arpy: .2, llpx: 1.8, lrpx: -1.6, tscx: 1.1, tscy: .88, hscy: .97 },
  vGStill: { ix: -1.5, tx: .01, hx: .04, hy: .08, alx: -.35, alz: .95, arx: -.5, arz: -.85, llx: -.25, lrx: -.1, llz: .17, lrz: -.15, hpy: .25, alpx: 1.9, arpx: -1.8, llpx: 1.3, lrpx: -1.2 },
});
POSE.jGDriveSmear = Object.assign({}, POSE.jGDrive, { ars: 1.26, arpz: 8.2, tscx: .96, tscy: 1.08 });

// Clips de animación Blockbench cargados desde js/animations.js
const JAVI_BB_DATA = window.JAVI_BB_DATA;
const RED_BB_DATA = window.RED_BB_DATA;
const GATO_BB_DATA = window.GATO_BB_DATA;
const SEK_BB_DATA = window.SEK_BB_DATA;
const RKT_BB_DATA = window.RKT_BB_DATA;
const UKY_BB_DATA = window.UKY_BB_DATA;
const SEB_BB_DATA = window.SEB_BB_DATA;
const RANDI_BB_DATA = window.RANDI_BB_DATA;
const JAVI_BB_CACHE = {};
// cada peleador con clips de Blockbench tiene su juego de datos (la clave es el id del personaje)
const bbSet = key => key === 'javi' ? JAVI_BB_DATA : key === 'redbird' ? RED_BB_DATA : key === 'gato' ? GATO_BB_DATA : key === 'sekza' ? SEK_BB_DATA : key === 'rocket' ? RKT_BB_DATA : key === 'ukyo' ? UKY_BB_DATA : key === 'sebolla' ? SEB_BB_DATA : key === 'randi' ? RANDI_BB_DATA : null;
function javiBBTrack(name, key = 'javi') {
  const D = bbSet(key), clip = D && D[name]; if(!clip)return null;
  const ck = key + ':' + name;
  if(!JAVI_BB_CACHE[ck]) {
    const track=clip.samples.map(row=>({t:row[0],p:Object.fromEntries(clip.channels.map((k,i)=>[k,row[i+1]]))}));
    track.cinematic=true;track.contacts=clip.contacts||[];track.loopLen=clip.loop?clip.length:0;JAVI_BB_CACHE[ck]=track;
  }
  return JAVI_BB_CACHE[ck];
}
// qué clip corresponde a cada acción (el nombre de la acción lo pone el movimiento en el código del combate)
const BB_ACTIONS = {
  javi: { lunge: 'habilidad_1_embestida', sthrow: 'habilidad_2_lanza_leal', whirl: 'habilidad_3_torbellino', slam: 'habilidad_4_picado_del_dragón', rain: 'ulti_lluvia_de_lanzas', orbit: 'lanzas_orbitales', draw: 'sacar_lanza', stow: 'guardar_lanza', flourish: 'lucimiento', awaken: 'despertar_accion', chorereach: 'alcance_cinematico', chorethrow: 'lanzamiento_cadena' },
  randi: { randiPaloma: 'habilidad_1_paloma', randiCuyes: 'habilidad_2_cuyes', randiNazca: 'habilidad_3_nazca', randiPisco: 'habilidad_4_pisco', randiCondor: 'despertar_condor', randiPerros: 'despertar_perros', randiTinku: 'despertar_tinku', randiSummon: 'despertar_patada', awaken: 'despertar_accion', flourish: 'lucimiento' },
  sebolla: { sebBrawlA: 'habilidad_1_paliza', sebBallA: 'habilidad_2_pelota', sebSandA: 'habilidad_3_sandwich', sebParry: 'habilidad_4_parry', sebCounter: 'habilidad_4_parry_contra', sebMount: 'despertar_montura', sebBuffer: 'despertar_buffering', sebGlitch: 'despertar_glitch', sebSee: 'despertar_observado', awaken: 'despertar_accion', flourish: 'lucimiento' },
  ukyo: { ukSweep: 'habilidad_1_barrido', ukLunge: 'habilidad_2_estocada', ukKnives: 'habilidad_3_cuchillas', ukFireball: 'habilidad_4_bola', ukSun: 'despertar_corte', ukPhoenix: 'despertar_fenix', ukRing: 'despertar_anillo', awaken: 'despertar_accion', draw: 'sacar_espada', stow: 'guardar_espada', flourish: 'lucimiento' },
  rocket: { rkWeb: 'habilidad_1_tela', rkZip: 'habilidad_2_gancho', rkBite: 'habilidad_3_picadura', rkTraps: 'habilidad_4_trampas', rkLegStabs: 'despertar_patas', rkWebField: 'despertar_red', rkSwarm: 'despertar_enjambre', awaken: 'despertar_accion', flourish: 'lucimiento' },
  sekza: { sekBoomerang: 'habilidad_1_viento', sekDive: 'habilidad_2_picada', sekParry: 'habilidad_3_parry', counterHit: 'habilidad_3_parry_contra', sekUpdraft: 'habilidad_4_corriente', sekRain: 'despertar_lluvia', sekFlight: 'despertar_vuelo', sekLock: 'despertar_mirada', awaken: 'despertar_accion', flourish: 'lucimiento' },
  gato: { illusion: 'habilidad_1_ilusiones', blink: 'habilidad_3_enganio', zone: 'despertar_espejismo', awaken: 'despertar_accion', flourish: 'lucimiento' },
  redbird: { beam: 'habilidad_1_rayo', beamSweep: 'habilidad_3_barrido', bolts: 'habilidad_2_rafaga', optojump: 'habilidad_4_impulso', flourish: 'lucimiento' },
};
function javiBBSelection(f, a, speed) {
  const key = f.ch.id, D = bbSet(key); if (!D) return null;
  if (f.choreTrack || f.forcePose || f.frozen > 0 || f.grabbed || a?.unarmed) return null;
  const pick = (...names) => names.find(n => D[n]) || null, mk = (n, time) => n ? { name: n, time } : null;
  if (!f.alive || f.ragdoll > 0) return f.onGround ? mk(pick('en_el_piso'), .35) : null;
  if (f.mount && f.mount.phase === 'ride' && D.despertar_montura_cabalgar) return { name: 'despertar_montura_cabalgar', time: G.time % D.despertar_montura_cabalgar.length };
  if (f.hurtT > 0) {
    const hp = f.hurtPose, name = pick(hp === 'hurtFwd' ? 'golpeado_frente' : hp === 'hurtSideL' ? 'golpeado_izq' : hp === 'hurtSideR' ? 'golpeado_der' : hp === 'hurtB' ? 'golpeado_b' : 'golpeado_a', 'golpeado_a');
    return mk(name, clamp(.24 - f.hurtT, 0, .35));
  }
  if (f.stun > 0) {
    const gb = G.time - (f.gbT || -9);
    return gb < 1.1 && D.guardia_rota ? { name: 'guardia_rota', time: gb } : mk(pick('mareado'), G.time % 1.6);
  }
  if (a) {
    const map = BB_ACTIONS[key] || {}, an = key === 'redbird' && a.name === 'beam' && a.noControl ? 'beamSweep' : a.name, name = a.bbClip || map[an];
    return name && D[name] ? { name, time: a.t } : null;
  }
  if(key==='sekza'&&f.rFlightT>0&&D.despertar_vuelo)return {name:'despertar_vuelo',time:.65+Math.sin(G.time*3)*.055};
  if (f.catchT > 0 && D.atrapar_lanza) return { name: 'atrapar_lanza', time: clamp(.4 - f.catchT, 0, .4) };
  if (f.victory && D.victoria) return { name: 'victoria', time: G.time % 1.8 };
  if (f.getupT > 0 && D.levantarse) return { name: 'levantarse', time: clamp(.55 - f.getupT, 0, .55) };
  if (f.blocking && D.bloqueo) return f.blockHitT > 0 && D.bloqueo_golpe ? { name: 'bloqueo_golpe', time: clamp(.3 - f.blockHitT, 0, .3) } : { name: 'bloqueo', time: .35 };
  if ((f.dashT > 0 || (f.dashAnimT || 0) > (speed > 4.5 ? .08 : 0)) && D.esquive) {
    const dn = pick(f.dashDir === 'back' ? 'esquive_atras' : f.dashDir === 'left' ? 'esquive_izq' : f.dashDir === 'right' ? 'esquive_der' : 'esquive', 'esquive');
    const dur = f.dashAnimDur || D[dn].length || .35;
    return { name: dn, time: clamp(dur - (f.dashAnimT != null ? f.dashAnimT : f.dashT), 0, D[dn].length) };
  }
  if (!f.onGround) { const keepJump = D.salto && D.salto.fullJump && f.bbState === 'state:salto' && (f.bbStateTime || 0) < D.salto.length; const name = pick(f.vel.y > 2 || keepJump ? 'salto' : 'caida'); return mk(name, Math.min(name && D[name] ? D[name].length - 1e-4 : .35, (f.bbStateTime || 0))); }
  if (f.landT > 0) { const hard = f.landHard && D.aterrizaje_duro; return hard ? { name: 'aterrizaje_duro', time: clamp(.5 - f.landT, 0, .5) } : mk(pick('aterrizaje'), clamp(.35 - f.landT, 0, .35)); }
  const armed = !f.spear || f.spearOut;
  if (f.idleVar && speed <= 1.5 && G.time < f.idleVar.until && D[f.idleVar.name]) return { name: f.idleVar.name, time: Math.min(D[f.idleVar.name].length - 1e-4, G.time - f.idleVar.t0) };   // variante de idle sincronizada con su voz
  if (speed > 1.5) {
    // dirección del movimiento respecto a hacia dónde mira: adelante, atrás o de costado
    const rel = wrapA(Math.atan2(f.vel.x, f.vel.z) - f.yaw), ar = Math.abs(rel), run = speed >= 4.8, base = run ? 'correr' : 'caminar';
    if (f.awak > 0 && D[base + '_despierto']) { const wn = base + '_despierto'; return { name: wn, time: (f.walk / TAU % 1) * D[wn].length }; }
    let name = base;
    if (ar > 2.36) name += '_atras'; else if (ar > .79) name += rel > 0 ? '_izq' : '_der'; else if (!armed) name += '_sin_arma';
    if (!D[name]) name = base;
    return D[name] ? { name, time: (f.walk / TAU % 1) * D[name].length } : null;
  }
  if (armed) {
    if (f.awak > 0 && D.idle_despierto) return { name: 'idle_despierto', time: G.time % 1.8 };
    if (D.idle_combate && enemiesOf(f).some(g => dist2d(f, g) < 9)) return { name: 'idle_combate', time: G.time % D.idle_combate.length };
    return mk(pick('idle'), G.time % D.idle.length);
  }
  return mk(pick('idle_sin_arma', 'idle'), G.time % (D.idle ? D.idle.length : 2.4));   // sin la lanza en la mano: la misma idle (la lanza queda en la espalda)
}
// al ir de espaldas o de costado las piernas casi no se movían: se toma el paso de caminar/correr hacia delante (al revés si va de espaldas)
function bbSample(clip, ch, t) {
  const i = clip.channels.indexOf(ch); if (i < 0) return 0; const rows = clip.samples, L = clip.length; t = ((t % L) + L) % L;
  let lo = 0, hi = rows.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (rows[m][0] <= t) lo = m; else hi = m; }
  const a = rows[lo], b = rows[hi], u = b[0] === a[0] ? 0 : (t - a[0]) / (b[0] - a[0]); return a[i + 1] + (b[i + 1] - a[i + 1]) * u;
}
function javiGait(f, key, gm) {
  const D = bbSet(key), fw = D && D[gm[1]]; if (!fw) return;
  const ph = (f.walk / TAU) % 1, back = gm[2] === '_atras', k = back ? 1 : .85, t = (back ? 1 - ph : ph) * fw.length, x = f.anim.x;
  const ll = bbSample(fw, 'llx', t), lr = bbSample(fw, 'lrx', t), amp = back ? 1 : k;
  x.llx = ll * amp; x.lrx = lr * amp;
  if (!back) { const side = gm[2] === '_izq' ? 1 : -1; x.llz += side * .05; x.lrz += side * .05; }
  if (!x.alx || Math.abs(x.alx) < .3) { x.alx = -lr * .4; if (!(f.spear && f.spearOut)) x.arx = -ll * .4; }   // los brazos acompañan al paso
}
function playJaviBB(f, selection, dt) {
  const key = f.ch.id, clip = bbSet(key)[selection.name], track = javiBBTrack(selection.name, key);if(!clip||!track)return false;
  const sk=(f.action?f.action.name:'state')+':'+selection.name;
  if(f.bbState!==sk) {f.bbState=sk;f.bbStateTime=0;f.bbFrom={...f.anim.x};}
  f.bbStateTime=(f.bbStateTime||0)+dt;
  const time=clip.loop?selection.time%clip.length:Math.min(clip.length,selection.time);
  f.anim.bbR6=true;f.anim.play(track,time,dt,true);
  if(clip.eyes){f.eyeAnim=bbsEyeSample(clip.eyes,time);f.eyeAnimT=G.time;}
  // Short entry blend stops snapshots when state changes; attack contact times
  // remain exact because the blend is over before the first hit at 70 ms.
  const u=clamp(f.bbStateTime/(f.action?.07:.2),0,1),w=u*u*(3-2*u);   // entre estados (andar, idle, salto...) la mezcla es larga: sin cortes; al empezar un golpe es corta para no mover el contacto
  if(w<1&&f.bbFrom)for(const j of JOINTS)f.anim.x[j]=jv(f.bbFrom,j)+(f.anim.x[j]-jv(f.bbFrom,j))*w;
  if(f.action&&f.action.name==='whirl')f.anim.x.iy=0;
  const gm=/^(caminar|correr)(_atras|_izq|_der)$/.exec(selection.name);
  if(gm&&!f.action&&!clip.customGait)javiGait(f,key,gm);
  f.anim.apply();return true;
}

// Hermite: Catmull-Rom para combate; tangentes monótonas para cine.
// Las anticipaciones y los rebotes se dibujan con poses, sin deslizamientos involuntarios.
const TENS = .55;
const DRAG = { hx: 20, hy: 20, hz: 18, aly: 24, ary: 24, alz: 26, arz: 26, llz: 30, lrz: 30 };
const jv = (p, j) => p[j] != null ? p[j] : (JDEF[j] || 0);
function buildTrack(list, from, t0) {
  const keys = [{ t: t0, p: from }]; let last = t0;
  for (const kf of list) {
    let t = kf[0]; const p = typeof kf[1] === 'string' ? POSE[kf[1]] : kf[1];
    if (t <= last + .015) t = last + (keys.length === 1 ? .04 : .025);
    keys.push({ t, p: p || {}, n: typeof kf[1] === 'string' ? kf[1] : '', tr: typeof kf[2] === 'number' && kf[2] < 2 ? kf[2] : null }); last = t;
  }
  return keys;
}
function cineSlope(t0, t1, t2, v0, v1, v2) {
  const h0 = t1 - t0, h1 = t2 - t1;
  if (h0 <= 0 || h1 <= 0) return 0;
  const d0 = (v1 - v0) / h0, d1 = (v2 - v1) / h1;
  if (d0 * d1 <= 0) return 0;
  const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
  return (w0 + w1) / (w0 / d0 + w1 / d1);
}
function buildCineTrack(list, from, events) {
  const track = buildTrack(list, from, 0);
  track.cinematic = true;
  track.contacts = events.filter(e => e.hit || e.rel).map(e => e.t);
  return track;
}
function sampleTrack(keys, t, out, tens = TENS) {
  const n = keys.length;
  if (t >= keys[n - 1].t) { const p = keys[n - 1].p; for (const j of JOINTS) out[j] = jv(p, j); return out; }
  let i = 0; while (i < n - 2 && t >= keys[i + 1].t) i++;
  const L = keys.loopLen || 0;
  // en los bucles las tangentes del empalme miran al otro extremo del ciclo (sin frenazo al repetir)
  const k0 = i === 0 && L ? { t: keys[n - 2].t - L, p: keys[n - 2].p } : keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1];
  const k3 = i + 2 >= n && L ? { t: keys[1].t + L, p: keys[1].p } : keys[Math.min(n - 1, i + 2)];
  const h = k2.t - k1.t, s = clamp((t - k1.t) / h, 0, 1), s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  for (const j of JOINTS) {
    const p1 = jv(k1.p, j), p2 = jv(k2.p, j);
    const m1 = i === 0 && !L ? 0 : keys.cinematic ? cineSlope(k0.t, k1.t, k2.t, jv(k0.p, j), p1, p2) * h : (p2 - jv(k0.p, j)) / (k2.t - k0.t) * h * tens;
    const m2 = i + 2 >= n && !L ? 0 : keys.cinematic ? cineSlope(k1.t, k2.t, k3.t, p1, p2, jv(k3.p, j)) * h : (jv(k3.p, j) - p1) / (k3.t - k1.t) * h * tens;
    out[j] = h00 * p1 + h10 * m1 + h01 * p2 + h11 * m2;
  }
  return out;
}
class Animator {
  constructor(model) { this.m = model; this.x = {}; this.v = {}; this.o = {}; this.follow = {}; this.reset(); }
  // reproduce una pista Hermite; deja la velocidad para que el resorte siga sin saltos al terminar
  play(keys, t, dt, fluid) {
    const x = this.x, v = this.v; sampleTrack(keys, t, this.o, fluid ? 1 : TENS);
    if (fluid) {
      // Retraso por tiempo de pista: mismo gesto a 30, 60 o 144 Hz y al buscar.
      // En los contactos se alinea todo el cuerpo con el golpe y la lanza.
      let distance = Math.min(t - keys[0].t, Math.abs(keys[keys.length - 1].t - t));
      for (const ct of keys.contacts || []) distance = Math.min(distance, Math.abs(t - ct));
      const u = clamp(distance / .10, 0, 1), overlap = u * u * (3 - 2 * u);
      sampleTrack(keys, Math.max(keys[0].t, t - .032 * overlap), this.follow, 1);
    }
    for (const j of JOINTS) {
      const lag = DRAG[j];
      const nv = fluid ? (lag ? this.follow[j] : this.o[j]) : lag && dt > 0 ? x[j] + (this.o[j] - x[j]) * (1 - Math.exp(-dt * lag)) : this.o[j];
      v[j] = dt > 0 ? (nv - x[j]) / dt * .5 : 0; x[j] = nv;
    }
    this.apply();
  }
  reset() { this.bbR6=false; for (const j of JOINTS) { this.x[j] = JDEF[j] || 0; this.v[j] = 0; } }
  update(dt, pose, k = 300, zeta = .7, spinX = 0) {
    const x = this.x, v = this.v, steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps, c = 2 * zeta * Math.sqrt(k);
    if (spinX) { x.ix += spinX * dt; v.ix = 0; } else x.ix = wrapA(x.ix);
    for (let s = 0; s < steps; s++) for (const j of JOINTS) {
      if (spinX && j === 'ix') continue;
      const t = pose && pose[j] != null ? pose[j] : (JDEF[j] || 0);
      v[j] += (k * (t - x[j]) - c * v[j]) * h; x[j] += v[j] * h;
    }
    this.apply();
  }
  apply() {
    const m = this.m, x = this.x;
    if (m.jlRig) jlResetBbsExtras(m.jlRig);
    m.inner.rotation.set(x.ix, x.iy, x.iz);
    const lie = this.bbR6 ? 0 : Math.min(1, Math.abs(Math.sin(x.ix)));
    m.inner.position.y = (16 + x.by) * PX * (1 - lie * .78);
    m.inner.position.x = x.bx * PX;
    m.inner.position.z = x.bz * PX;
    for (const [part, prefix] of Object.entries(CINE_PARTS)) {
      m[part].position.copy(m.bind[part]);
      m[part].position.x += x[prefix + 'px'] * PX;
      m[part].position.y += x[prefix + 'py'] * PX;
      m[part].position.z += x[prefix + 'pz'] * PX;
    }
    m.torso.scale.set(x.tscx, x.tscy, x.tscz);
    m.head.scale.set(x.hscx, x.hscy, x.hscz);
    m.torso.rotation.set(x.tx, x.ty, x.tz);
    m.head.rotation.set(x.hx, x.hy, x.hz);
    m.armL.rotation.set(x.alx, x.aly, x.alz); m.armR.rotation.set(x.arx, x.ary, x.arz);
    m.legL.rotation.set(x.llx, x.lly || 0, x.llz); m.legR.rotation.set(x.lrx, x.lry || 0, x.lrz);
    if (m.gripRot) { m.gripRot.rotation.set(x.sx, x.sy || 0, x.sz || 0); m.gripRot.position.set((x.spx || 0) * PX, (x.spy || 0) * PX, (x.spz || 0) * PX); }   // el arma también se anima: giro, posición y tamaño
    // smear: los miembros que se mueven rápido se estiran (como los cuadros de smear del anime)
    const v = this.v, sm = j => this.bbR6 ? 1 : 1 + Math.min(.32, Math.abs(v[j]) / 48);
    m.armR.scale.y = sm('arx') * x.ars; m.armL.scale.y = sm('alx') * x.als;
    m.legR.scale.y = sm('lrx') * x.lrs; m.legL.scale.y = sm('llx') * x.lls;
    if (m.gripRot) { const ws = x.ssc == null ? 1 : x.ssc; m.gripRot.scale.set(ws, ws, (this.bbR6 ? 1 : 1 + Math.min(.45, Math.abs(v.sx) / 45)) * ws); }
    // aplastar y estirar el cuerpo según qué tan agachado está y qué tan rápido sube o baja
    const sq = this.bbR6 ? 0 : clamp(-x.by / 40 - v.by / 900, -.07, .11);
    m.inner.scale.set((1 + sq * .6) * (x.bsx ?? 1), (1 - sq) * (x.bsy ?? 1), (1 + sq * .6) * (x.bsz ?? 1));
  }
}

// ================= Peleadores =================
// combos con anticipación → golpe (resorte duro, se pasa un poco) → recuperación
// Los personajes viven en personajes/<id>/personaje.js (se cargan antes que este archivo, ver personajes/_lista.js)
const CHARS = {};
for (const id of (window.CF_ORDEN || [])) { const P = window.CF_PERSONAJES[id]; if (P) CHARS[id] = P; }
// ===== Despertar: al usar la ulti, las 4 habilidades cambian por estas durante AWAKE_DUR segundos =====
const AWAKE_DUR = 30;
const ULT_GAIN = .5;   // la barra de la ulti se carga a la mitad de velocidad (cuesta el doble conseguirla)
const AWK = {};   // se arma con la propiedad awk de cada personajes/<id>/personaje.js
for (const id in CHARS) if (CHARS[id].awk) AWK[id] = CHARS[id].awk;
for (const id in AWK) if (CHARS[id]) CHARS[id].awk = AWK[id];
const skillsOf = f => (f.ch === CHARS.javi && (f.spearLost || f._fistKit)) ? (f.awak > 0 ? f.ch.awkFist : f.ch.fist) : (f.awak > 0 && f.ch.awk) ? f.ch.awk : f.ch.skills;
// por ahora el elenco es de tres: los demás peleadores quedan fuera del juego
// Kaiza, Nyx, Volt, Brasa, Yuki y Titán están guardados en personajes/_sin_usar/ (no se cargan; ver el LEEME de esa carpeta)
for (const id in CHARS) CHARS[id].id = id;
const CHAR_IDS = Object.keys(CHARS).filter(k => !CHARS[k].hidden);   // los personajes ocultos (invocaciones) no salen en el menú
// muñeco de entrenamiento (no aparece en el selector)
// Equilibrio: todos pegan algo menos (DMG_GLOBAL) y cada personaje ajusta su fuerza (dmgMul) para que ninguno domine
const DMG_GLOBAL = .85;
// (los multiplicadores de daño dmgMul y la vida viven en personajes/<id>/personaje.js)
const DUMMY_CH = {
  name: 'Dummy', title: 'Entrenamiento', role: 'DUMMY', color: '#c8a165', hp: 100, spd: .7, ai: 'melee', stance: 'idle', stats: [3, 1, 1, 1, 1],
  skin: { skin: '#d9b77a', hair: '#b8935a', eye: '#3a2a1a', shirt: '#8d6e63', pants: '#5d4037', shoes: '#3e2723', sleeve: 12, belt: '#c62828' },
  skills: [], ult: { n: '—', d: '', k: 'serious', o: {}, r: [0, 0] }, intro: [], cine: [],
};
const STAT_NAMES = ['VIDA', 'DAÑO', 'VELOCIDAD', 'ALCANCE', 'DIFICULTAD'];
const SKIN_CACHE = {};
const charSkin = id => SKIN_CACHE[id] || (SKIN_CACHE[id] = CHARS[id].skinCanvas || makeSkinCanvas(CHARS[id].skin));
function loadCharSkins() {
  const ids = Object.keys(CHARS).filter(id => CHARS[id].skinData);
  let loaded = 0;
  LOADER.setProgress(30, 'Cargando modelos y skins de peleadores...');
  return Promise.all(ids.map(id => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = normalizeSkin(img);
      if (c) { CHARS[id].skinCanvas = c; CHARS[id].slim = detectSlim(c); }
      loaded++;
      LOADER.setProgress(30 + (loaded / Math.max(1, ids.length)) * 48, 'Cargando peleador ' + loaded + '/' + ids.length + '...');
      res();
    };
    img.onerror = () => {
      loaded++;
      LOADER.setProgress(30 + (loaded / Math.max(1, ids.length)) * 48, 'Cargando peleador ' + loaded + '/' + ids.length + '...');
      res();
    };
    img.src = CHARS[id].skinData;
  })));
}
const LVL_NAMES = ['', 'Novato', 'Novato', 'Aprendiz', 'Aprendiz', 'Peleador', 'Peleador', 'Veterano', 'Veterano', 'Maestro', 'Leyenda'];
function aiParams(l) {
  const t = (clamp(l, 1, 10) - 1) / 9, L = (a, b) => a + (b - a) * t;
  return { think: L(.95, .16), block: L(.04, .75), skill: L(.22, .9), dmg: L(.5, 1.12), react: L(.5, .07), follow: L(0, .9), dodge: L(0, .6), m1acc: L(.5, 1), drop: L(.8, 0), focus: L(0, 3) };
}
const BOT_NAMES = ['Bloque_Furioso', 'xX_Creeper_Xx', 'PicoDiamante', 'NoobMaster', 'Aldeano_99', 'Endergirl', 'TNT_Andante', 'Golem_Feroz', 'RedstoneKid', 'LadrilloLoco', 'Zombi_Pro', 'Esqueleto_OP'];
const SHIRTS = ['#2e7d32', '#1565c0', '#6a1b9a', '#ef6c00', '#37474f', '#ad1457', '#00838f', '#5d4037'];

const G = {
  state: 'menu', matchGen: 0, fighters: [], player: null, time: 0, hitstop: 0, slowT: 0, shake: 0, fovKick: 0,
  combo: 0, comboT: 0, comboDmg: 0, lastHitDmg: 0, paused: false, over: false, goal: 10, bots: 5, baseLvl: 5, botLvl: 5, auto: true, balT: 12, winPK: 0, winPD: 0,
  mp: false, mode: 'bots',
  charId: 'javi', customSkin: null, customSlim: false, pname: 'Jugador', cine: null, linesI: 0,
};
function recordPlayerComboHit(dmg) {
  const d = Math.max(1, Math.round(dmg));
  if (G.comboT <= 0) { G.combo = 0; G.comboDmg = 0; }
  G.combo++; G.comboDmg = (G.comboDmg || 0) + d; G.lastHitDmg = d; G.comboT = 2.2;
  const c = $('combo'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
}

class Fighter {
  constructor(o) {
    this.name = o.name; this.ch = o.ch || CHARS[o.char]; this.isPlayer = !!o.isPlayer; this.seed = rand(0, 10);
    this.remote = !!o.remote; this.peer = o.peer || null;
    const skin = o.skin || this.ch.skinCanvas || makeSkinCanvas(Object.assign({}, this.ch.skin, o.skinOv || {}));
    this.skin = skin;
    const faceC = copyCanvas(skin);
    this.model = buildFighterModel(this.ch, faceC, !!o.skin, o.skin ? !!o.slim : !!this.ch.slim, scene);
    if (!this.model.jlRig) setupFace(this, faceC, !o.skin);
    this.anim = new Animator(this.model);
    if (WEAPONS[this.ch.weapon]) { this.spear = WEAPONS[this.ch.weapon](); this.model.mats.push(this.spear.material); }
    if (this.ch.eyeLaser) addEyes(this.model, this.ch.color);
    if (this.ch.wings) addWings(this.model, this.ch.color);
    if (this.ch.legs) addSpiderLegs(this.model, this.ch.color);
    if (this.ch.screenHead) addScreen(this.model);
    this.pos = new V3(); this.vel = new V3(); this.yaw = 0; this.prevYaw = 0; this.yawVel = 0; this.walk = 0;
    this.maxHp = this.ch.hp; this.kills = 0; this.deaths = 0;
    this.ai = (this.isPlayer || this.remote) ? null : { var: o.lvlVar || 0, P: aiParams(G.botLvl), target: null, retarget: 0, think: rand(0, .5), strafe: 1, strafeT: 0, blockT: 0, jumpT: rand(1, 4), flee: 0, seen: null, react: null, reactT: 0, m1hold: 0, dodgeDir: 0 };
    this.reset();
    if (!this.isPlayer) {
      const p = document.createElement('div'); p.className = 'plate';
      const s = document.createElement('span'); s.textContent = this.name; s.style.color = this.ch.color;
      const i = document.createElement('i'); const b = document.createElement('b'); i.appendChild(b);
      p.append(s, i); $('plates').appendChild(p); this.plate = p; this.plateBar = b;
    }
  }
  reset() {
    releaseOwnerSpear(this);
    resetCharacterVoice(this);
    disposeMount(this);
    Object.assign(this, { hp: this.maxHp, ult: 0, awak: 0, seq: null, poison: null, fireT: 0, stun: 0, ragdoll: 0, iframes: 0, action: null, blocking: false, comboIdx: 0, comboTimer: 0, m1cd: 0, dashCd: 0, dashT: 0, airDash: true, alive: true, respawnT: 0, deathT: 0, cd: [0, 0, 0, 0], rFlightT:0,rFlightCD:0,rGullCD:0,rTapUntil:0,rFlightAltitude:0, onGround: true, hurtT: 0, hurtPose: 'hurtA', getupT: 0, landT: 0, flashT: 0, frozen: 0, grabbed: false, ghostT: 0, spearThrown: false, spearLost: null, atkT: 0, flourT: rand(3, 6), twirl: null, twA: 0, catchT: 0, blockHitT: 0, victory: false, landHard: false, gbT: -9 });
    this.vel.set(0, 0, 0); this.model.root.visible = true; this.anim.reset();
    if (this.spear) { setSpear(this, false); this.spear.visible = true; }
  }
  dispose() { this._disposed = true; clearSkillObjs(this); stopCharacterVoice(this); releaseOwnerSpear(this); disposeMount(this); endAction(this); if (this.verity) { disposeVerity(this.verity); this.verity = null; } if (this.clippy) { disposeClippy(this.clippy); this.clippy = null; } if (this.wheel) { scene.remove(this.wheel.mesh); this.wheel.mesh.geometry.dispose(); this.wheel.mat.dispose(); this.wheel.tex.dispose(); this.wheel = null; } if (this.auraMat) this.auraMat.dispose(); disposeModel(this.model); if (this.plate) this.plate.remove(); }
}
const enemiesOf = f => G.fighters.filter(g => g !== f && g.alive && !g.otherMap && (!f.otherMap) && (g.isBoss ? !!f.abyss : f.isBoss ? !!g.abyss : (!!f.abyss === !!g.abyss) && !(f.abyss && g.abyss)));   // en el abismo los jugadores son aliados: sin PVP   // el abismo y el mar son mundos aparte
const chestOf = f => new V3(f.pos.x, f.pos.y + 1.1, f.pos.z);
function front(f, d, h = 1) { const F = fwd(f.yaw); return new V3(f.pos.x + F.x * d, f.pos.y + h, f.pos.z + F.z * d); }
const involvesPlayerNear = f => G.player && G.player.alive && f.pos.distanceTo(G.player.pos) < 25;

// Diagnóstico de cuadros y recuperación WebGL (efectos gráficos en js/graficos/efectos_combate.js)
// Frame errors are local diagnostics; a failed cosmetic task must not block the next image.
const FRAME_HEALTH={build:'2026-11-01-frame-recovery',errors:[],contextLost:false,rendered:0};
function reportFrameError(stage,error){
  const message=String(error?.message||error),key=stage+':'+message;
  let record=FRAME_HEALTH.errors.find(r=>r.key===key);
  if(record){record.count++;return;}
  record={key,stage,message,stack:String(error?.stack||'').slice(0,2500),count:1,time:Math.round(G.time*100)/100,character:G.player?.ch.id||null};
  FRAME_HEALTH.errors.push(record);if(FRAME_HEALTH.errors.length>12)FRAME_HEALTH.errors.shift();
  console.error('[Blockstrike] '+stage,error);
  try{localStorage.setItem('bsb_runtime_errors_v1',JSON.stringify({build:FRAME_HEALTH.build,errors:FRAME_HEALTH.errors}));}catch(_){}
}
function frameTask(stage,fn,recover){
  try{fn();return true;}catch(error){reportFrameError(stage,error);if(recover)try{recover();}catch(e){reportFrameError(stage+':recuperacion',e);}return false;}
}
function cancelFailedAction(f){
  try{endAction(f);}finally{f.vel.x=f.vel.z=0;f.forcePose=null;if(f.ai){f.ai.target=null;f.ai.retarget=0;}}
}
function drawFrameSafely(){
  if(FRAME_HEALTH.contextLost||renderer.getContext().isContextLost())return;
  if(typeof ME !== 'undefined' && ME.open && ME.mode === '3d'){
    renderView(scene, camera);
    FRAME_HEALTH.rendered++;
    return;
  }
  if(frameTask('imagen',()=>{if(G.state==='menu')renderView(SH.scene,SH.cam);else renderMain();})){FRAME_HEALTH.rendered++;return;}
  // A failed postprocess/panel must not leave rendering redirected to an offscreen buffer.
  frameTask('imagen:directa',()=>{
    GFX.post=false;renderer.setRenderTarget(null);renderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.autoClear=true;
    scene.overrideMaterial=null;renderer.render(G.state==='menu'?SH.scene:STAGE.on?STAGE.scene:scene,G.state==='menu'?SH.cam:camera);FRAME_HEALTH.rendered++;
  });
}
function graphicsRecoveryStatus(show){
  let el=$('graphics-recovery');
  if(show&&!el){el=document.createElement('div');el.id='graphics-recovery';el.textContent='Recuperando imagen…';el.style.cssText='position:fixed;left:50%;top:20%;transform:translateX(-50%);z-index:100;background:#111d;color:#fff;padding:12px 20px;pointer-events:none;font-weight:700';document.body.appendChild(el);}
  if(el)el.hidden=!show;
}
renderer.domElement.addEventListener('webglcontextlost',event=>{
  event.preventDefault();FRAME_HEALTH.contextLost=true;graphicsRecoveryStatus(true);reportFrameError('grafica:contexto',new Error('Se perdio el contexto WebGL'));
});
renderer.domElement.addEventListener('webglcontextrestored',()=>{
  FRAME_HEALTH.contextLost=false;
  frameTask('grafica:restaurar',()=>{renderer.resetState?.();renderer.setRenderTarget(null);if(composer)composer.reset();});graphicsRecoveryStatus(false);
  // tras perder la GPU todo hay que subirlo otra vez: si no, skins y mar quedaban negros o rotos hasta recargar
  setTimeout(()=>frameTask('grafica:recargar',()=>{
    const seen=new Set();
    scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms){m.needsUpdate=true;for(const k in m){const t=m[k];if(t&&t.isTexture&&!seen.has(t)){seen.add(t);t.needsUpdate=true;}}}});
    GFX.post=GFX.level===0&&!!composer;gfxSet(GFX.level,GFX.auto,false);
  }),400);
});
window.getBlockstrikeDiagnostics=()=>({build:FRAME_HEALTH.build,contextLost:FRAME_HEALTH.contextLost,rendered:FRAME_HEALTH.rendered,errors:FRAME_HEALTH.errors});


// ================= Audio sintetizado =================
// Preferencias locales: el volumen nunca se transmite a los demás jugadores de la sala.
const AUDIO_LEVELS={general:100,ambient:100,game:100,music:100,voices:100};
try{
  const saved=JSON.parse(localStorage.getItem('bsb_audio_levels_v1')||'null');
  if(saved)for(const key of Object.keys(AUDIO_LEVELS))if(typeof saved[key]==='number'&&Number.isFinite(saved[key]))AUDIO_LEVELS[key]=Math.round(clamp(saved[key],0,100));
}catch(e){}
let gameAudioBus=null,ambientAudioBus=null,voicesAudioBus=null;
const HTML_AUDIO_LEVELS=new Set(), ACTIVE_DIALOGUE=new Set();
// Original voice recordings, one channel per fighter, with priority and cooldowns.
/* VOCES_BEGIN */
const VOICE_PACKS={"javi":{"activate":["activar_ulti"],"kill":["baja_1","baja_2"],"near":["casi_baja_1","casi_baja_2"],"hurt":["dano_1","dano_2"],"death":["muerte_1","muerte_2","muerte_3","muerte_4"],"idle":["reposo_1","reposo_2","reposo_3"],"ready":["ulti_lista_1","ulti_lista_2"]},"randi":{"activate":["activar_ulti_1","activar_ulti_2","activar_ulti_3","activar_ulti_4"],"kill":["baja_1","baja_2","baja_3"],"near":["casi_baja_1","casi_baja_2","casi_baja_3"],"cerca_gato":["cerca_gato_1"],"cerca_jesuluto":["cerca_jesuluto_1"],"cerca_mattux":["cerca_mattux_1"],"cerca_redbird":["cerca_redbird_1"],"cerca_rocket_ulti":["cerca_rocket_ulti_1"],"cerca_sebolla":["cerca_sebolla_1"],"cerca_sekza":["cerca_sekza_1","cerca_sekza_2"],"hab_cuyes":["hab_cuyes_1"],"hab_paloma":["hab_paloma_1"],"hab_pisco":["hab_pisco_1"],"death":["muerte_1","muerte_2","muerte_3"],"reac_torbellino":["reac_torbellino_1"],"idle":["reposo_1","reposo_2","reposo_3","reposo_4","reposo_5","reposo_6"],"ready":["ulti_lista_1","ulti_lista_2"]},"redbird":{"skill":["habilidad_ulti_1"]},"rocket":{"activate":["activar_ulti_1"],"kill":["baja_1"],"near":["casi_baja_1"],"death":["muerte_1"],"idle":["reposo_1"],"ready":["ulti_lista_1"]},"sebolla":{"activate":["activar_ulti_1","activar_ulti_2","activar_ulti_3"],"kill":["baja_1","baja_2","baja_3","baja_4","baja_5","baja_6","baja_7","baja_8"],"near":["casi_baja_1","casi_baja_2","casi_baja_3","casi_baja_4","casi_baja_5","casi_baja_6","casi_baja_7"],"menu":["menu_1","menu_2","menu_3","menu_4"],"death":["muerte_1","muerte_2","muerte_3","muerte_4","muerte_5","muerte_6","muerte_7","muerte_8"],"idle":["reposo_1","reposo_2","reposo_3","reposo_4","reposo_5","reposo_6"],"ready":["ulti_lista_1"]},"sekza":{"activate":["activar_ulti_1"],"kill":["baja_1"],"near":["casi_baja_1","casi_baja_2"],"hurt":["dano_1","dano_2","dano_3","dano_4","dano_5"],"hit":["golpe_1","golpe_2","golpe_3","golpe_4","golpe_5","golpe_6","golpe_7"],"menu":["menu_1","menu_2","menu_3"],"death":["muerte_1","muerte_2","muerte_3"],"idle":["reposo_1"],"ready":["ulti_lista_1"]},"ukyo":{"activate":["activar_ulti_1"],"kill":["baja_1"],"near":["casi_baja_1"],"death":["muerte_1"],"idle":["reposo_1"],"ready":["ulti_lista_1"]}};
const VOICE_DUR={"javi/activar_ulti":3.408,"javi/baja_1":1.8,"javi/baja_2":2.352,"javi/casi_baja_1":1.224,"javi/casi_baja_2":1.248,"javi/dano_1":1.464,"javi/dano_2":1.008,"javi/muerte_1":2.136,"javi/muerte_2":1.44,"javi/muerte_3":1.752,"javi/muerte_4":2.472,"javi/reposo_1":2.952,"javi/reposo_2":1.8,"javi/reposo_3":2.232,"javi/ulti_lista_1":2.472,"javi/ulti_lista_2":1.224,"randi/activar_ulti_1":3.696,"randi/activar_ulti_2":3.288,"randi/activar_ulti_3":3.312,"randi/activar_ulti_4":4.632,"randi/baja_1":1.752,"randi/baja_2":2.352,"randi/baja_3":2.328,"randi/casi_baja_1":2.352,"randi/casi_baja_2":3.312,"randi/casi_baja_3":2.352,"randi/cerca_gato_1":5.616,"randi/cerca_jesuluto_1":7.591,"randi/cerca_mattux_1":3.888,"randi/cerca_redbird_1":3.888,"randi/cerca_rocket_ulti_1":3.12,"randi/cerca_sebolla_1":3.888,"randi/cerca_sekza_1":3.888,"randi/cerca_sekza_2":3.312,"randi/hab_cuyes_1":4.464,"randi/hab_paloma_1":4.272,"randi/hab_pisco_1":3.312,"randi/muerte_1":2.328,"randi/muerte_2":2.328,"randi/muerte_3":1.56,"randi/reac_torbellino_1":3.888,"randi/reposo_1":3.864,"randi/reposo_2":5.04,"randi/reposo_3":4.056,"randi/reposo_4":3.288,"randi/reposo_5":7.944,"randi/reposo_6":2.736,"randi/ulti_lista_1":2.328,"randi/ulti_lista_2":2.544,"redbird/habilidad_ulti_1":4.471,"rocket/activar_ulti_1":3.648,"rocket/baja_1":2.429,"rocket/casi_baja_1":2.22,"rocket/muerte_1":1.944,"rocket/reposo_1":2.168,"rocket/ulti_lista_1":2.429,"sebolla/activar_ulti_1":4.32,"sebolla/activar_ulti_2":4.464,"sebolla/activar_ulti_3":4.584,"sebolla/baja_1":2.52,"sebolla/baja_2":1.704,"sebolla/baja_3":3.36,"sebolla/baja_4":2.952,"sebolla/baja_5":2.664,"sebolla/baja_6":2.4,"sebolla/baja_7":4.032,"sebolla/baja_8":2.664,"sebolla/casi_baja_1":3.031,"sebolla/casi_baja_2":3.031,"sebolla/casi_baja_3":3.031,"sebolla/casi_baja_4":2.999,"sebolla/casi_baja_5":2.52,"sebolla/casi_baja_6":3.072,"sebolla/casi_baja_7":2.952,"sebolla/menu_1":4.46,"sebolla/menu_2":3.542,"sebolla/menu_3":3.542,"sebolla/menu_4":4.198,"sebolla/muerte_1":1.704,"sebolla/muerte_2":2.112,"sebolla/muerte_3":2.52,"sebolla/muerte_4":2.112,"sebolla/muerte_5":2.112,"sebolla/muerte_6":1.992,"sebolla/muerte_7":2.256,"sebolla/muerte_8":1.992,"sebolla/reposo_1":4.722,"sebolla/reposo_2":4.722,"sebolla/reposo_3":4.923,"sebolla/reposo_4":2.918,"sebolla/reposo_5":1.718,"sebolla/reposo_6":5.13,"sebolla/ulti_lista_1":3.072,"sekza/activar_ulti_1":4.946,"sekza/baja_1":1.184,"sekza/casi_baja_1":2.856,"sekza/casi_baja_2":2.856,"sekza/dano_1":1.022,"sekza/dano_2":1.022,"sekza/dano_3":0.754,"sekza/dano_4":0.754,"sekza/dano_5":0.511,"sekza/golpe_1":0.841,"sekza/golpe_2":0.53,"sekza/golpe_3":0.53,"sekza/golpe_4":0.719,"sekza/golpe_5":0.841,"sekza/golpe_6":0.448,"sekza/golpe_7":0.519,"sekza/menu_1":1.638,"sekza/menu_2":3.466,"sekza/menu_3":2.277,"sekza/muerte_1":1.617,"sekza/muerte_2":2.184,"sekza/muerte_3":2.698,"sekza/reposo_1":2.09,"sekza/ulti_lista_1":3.622,"ukyo/activar_ulti_1":2.242,"ukyo/baja_1":0.68,"ukyo/casi_baja_1":1.687,"ukyo/muerte_1":4.969,"ukyo/reposo_1":1.911,"ukyo/ulti_lista_1":1.162};
/* VOCES_END */

// ===== Audio configurable: lo que el editor de audio (modo desarrollador) guarda en config/audio.json y vale para todos =====
const AUDIO_CFG = (() => {
  const E = { v: 1, voices: {}, clip: {}, dur: {}, evp: {}, sfx: {}, music: {}, amb: {}, up: {} };
  try {
    let txt = null, dev = /^(localhost|127\.|\[::1\])/.test(location.hostname);
    try { const d = JSON.parse(localStorage.getItem('bsb_dev') || 'null'); if (d && Date.now() - d.t < 30 * 864e5) dev = true; } catch (e) { }
    if (dev) { try { txt = localStorage.getItem('bsb_audiocfg'); } catch (e) { } }
    if (!txt && dev) { const x = new XMLHttpRequest(); x.open('GET', 'config/audio.json?v=' + Date.now(), false); x.send(); if (x.status === 200) txt = x.responseText; }
    const j = txt && JSON.parse(txt);
    if (j && j.v === 1) {
      const num = (v, a, b, d) => (Number.isFinite(+v) && v !== null && v !== '' ? Math.min(b, Math.max(a, +v)) : d), path = s => typeof s === 'string' && /^[a-z0-9_\-\/\.]{1,120}$/i.test(s) && !s.includes('..') && /^(sonidos|musica)\//.test(s);
      for (const ch in (j.voices || {})) if (/^[a-z0-9_]{1,24}$/.test(ch) && j.voices[ch] && typeof j.voices[ch] === 'object') {
        const o = {}; for (const ev in j.voices[ch]) if (/^[a-z0-9_]{1,48}$/.test(ev) && Array.isArray(j.voices[ch][ev])) o[ev] = j.voices[ch][ev].filter(c => typeof c === 'string' && /^[a-z0-9_\-]{1,50}$/.test(c)); E.voices[ch] = o;
      }
      for (const k in (j.clip || {})) if (/^[a-z0-9_]{1,24}\/[a-z0-9_\-]{1,50}$/.test(k)) { const c = j.clip[k] || {}; E.clip[k] = {}; if (c.vol != null) E.clip[k].vol = num(c.vol, 0, 2, 1); if (c.chance != null) E.clip[k].chance = num(c.chance, 0, 1, 1); if (c.cd != null) E.clip[k].cd = num(c.cd, 0, 120, 0); }
      for (const k in (j.dur || {})) if (/^[a-z0-9_]{1,24}\/[a-z0-9_\-]{1,50}$/.test(k)) E.dur[k] = num(j.dur[k], .05, 120, 2);
      for (const k in (j.evp || {})) if (/^[a-z0-9_]{1,48}$/.test(k)) { const c = j.evp[k] || {}; E.evp[k] = {}; if (c.priority != null) E.evp[k].priority = num(c.priority, 0, 9, 1); if (c.cd != null) E.evp[k].cd = num(c.cd, 0, 300, 0); }
      for (const grp of ['sfx', 'music', 'amb']) for (const k in (j[grp] || {})) if (/^[a-z0-9_]{1,40}$/.test(k)) { const c = j[grp][k] || {}, o = {}; if (path(c.file)) o.file = c.file; if (c.vol != null) o.vol = num(c.vol, 0, 2, 1); if (grp === 'sfx') { if (c.chance != null) o.chance = num(c.chance, 0, 1, 1); if (c.cd != null) o.cd = num(c.cd, 0, 60, 0); if (c.off) o.off = true; } E[grp][k] = o; }
      for (const k in (j.up || {})) if (/^[a-z0-9_]{1,24}\/[a-z0-9_\-]{1,50}$/.test(k)) E.up[k] = 1;
    }
  } catch (e) { }
  return E;
})();
for (const ch in AUDIO_CFG.voices) { const pk = VOICE_PACKS[ch] || (VOICE_PACKS[ch] = {}); for (const ev in AUDIO_CFG.voices[ch]) { if (AUDIO_CFG.voices[ch][ev].length) pk[ev] = AUDIO_CFG.voices[ch][ev]; else delete pk[ev]; } }
Object.assign(VOICE_DUR, AUDIO_CFG.dur);
const musFile = (id, d) => (AUDIO_CFG.music[id] && AUDIO_CFG.music[id].file) || d;
// Los sonidos de cada personaje viven en su carpeta: personajes/<id>/Sound (voces generales), Ataques basicos/Sound (golpes) y Skills/Ulti/Sound (ulti)
const CHAR_SOUND_DIR = { clippy: 'jesuluto/Sound/clippy' };   // voces de Clippy: dentro de la carpeta de Jesuluto
function charSoundDirs(char) {
  if (CHAR_SOUND_DIR[char]) return ['personajes/' + CHAR_SOUND_DIR[char]];
  return ['personajes/' + char + '/Sound', 'personajes/' + char + '/Ataques basicos/Sound', 'personajes/' + char + '/Skills/Ulti/Sound'];
}
function charSoundRel(char, file) {   // file = nombre sin .mp3 (p. ej. 'baja_1')
  const d = charSoundDirs(char);
  return d.length === 1 ? d[0] + '/' + file + '.mp3' : (/^(activar_ulti|ulti_lista|habilidad_ulti)/.test(file) ? d[2] : /^golpe/.test(file) ? d[1] : d[0]) + '/' + file + '.mp3';
}
const ultMusicRel = id => 'personajes/' + id + '/Skills/Ulti/Sound/ulti.mp3';
function voiceRel(key) {   // 'javi/baja_1' -> ruta real; el resto ('city', 'ambiente/x') sigue en sonidos/
  const i = key.indexOf('/'), c = i > 0 ? key.slice(0, i) : '';
  return c && (CHARS[c] || CHAR_SOUND_DIR[c]) ? charSoundRel(c, key.slice(i + 1)) : 'sonidos/' + key + '.mp3';
}
const sndUrl = n => (AUDIO_CFG.amb[n] && AUDIO_CFG.amb[n].file) || voiceRel(n);
// evento -> prioridad y enfriamiento (los archivos se llaman <evento>_<n>.mp3 dentro de personajes/<personaje>/Sound (o Skills/Ulti/Sound, Ataques basicos/Sound); lo arma tools/voces.py)
const VOICE_EVENTS={death:{priority:5,cd:0},ready:{priority:3,cd:0},near:{priority:2,cd:8},kill:{priority:3,cd:3},idle:{priority:0,cd:20},activate:{priority:4,cd:0},hurt:{priority:1,cd:2.8},skill:{priority:4,cd:0},hit:{priority:1,cd:2.2},gulls:{priority:3,cd:2},fly:{priority:2,cd:5},menu:{priority:5,cd:0}};
// eventos con nombre propio: cerca_<personaje>[_ulti] (frase al estar cerca de alguien), hab_<habilidad> (al usarla), reac_<algo> (reacciones)
const voiceEv=e=>{const b=VOICE_EVENTS[e]||(e.startsWith('cerca_')?{priority:2,cd:45}:e.startsWith('hab_')?{priority:3,cd:0}:e.startsWith('reac_')?{priority:3,cd:8}:e.startsWith('ev_')?{priority:1,cd:0}:null);return b&&AUDIO_CFG.evp[e]?Object.assign({},b,AUDIO_CFG.evp[e]):b;};
const SKILL_VOICE={randiCuyes:'cuyes',randiPaloma:'paloma',randiPisco:'pisco'};
const VOICE_DEFS=Object.fromEntries(Object.entries(VOICE_PACKS).map(([id,evs])=>[id,Object.fromEntries(Object.entries(evs).filter(([e])=>voiceEv(e)).map(([e,l])=>[e,{clips:l.map(n=>id+'/'+n),priority:voiceEv(e).priority,cd:voiceEv(e).cd}]))]));
const JAVI_VOICES=VOICE_DEFS.javi||{};
const CLIPPY_VOICES={
  '¡Hola! Soy Clippy':{clip:'clippy/hola',priority:1},
  '¿Necesitas ayuda?':{clip:'clippy/ayuda',priority:0},
  '¡Parece que estás peleando!':{clip:'clippy/peleando',priority:0},
  '¿Quieres que lo haga por ti?':{clip:'clippy/por_ti',priority:0},
  'Parece que vas perdiendo…':{clip:'clippy/perdiendo',priority:0},
  '¿Guardo los cambios?':{clip:'clippy/guardar',priority:0},
  '¡Parece que estás atacando!':{clip:'clippy/atacando',priority:2},
  '¡PANTALLA AZUL!':{clip:'clippy/pantalla_azul',priority:4},
  '¡Parece que vas a perder!':{clip:'clippy/vas_a_perder',priority:3}
};
const CLIPPY_VOICE_FILES=Object.values(CLIPPY_VOICES).map(v=>v.clip);
const JAVI_VOICE_FILES=Object.values(VOICE_DEFS).flatMap(d=>Object.values(d).flatMap(v=>v.clips)),JAVI_VOICE_KEYS=new Set(JAVI_VOICE_FILES);
const CHARACTER_VOICE_FILES=[...JAVI_VOICE_FILES,...CLIPPY_VOICE_FILES],CHARACTER_VOICE_KEYS=new Set(CHARACTER_VOICE_FILES);
const CHARACTER_VOICE_META=Object.fromEntries([
  ...Object.entries(VOICE_DEFS).flatMap(([id,evs])=>Object.values(evs).flatMap(d=>d.clips.map(key=>[key,{character:id,priority:d.priority}]))),
  ...Object.entries(CLIPPY_VOICES).map(([text,d])=>[d.clip,{character:'jesuluto',priority:d.priority,text}])
]);
const CHARACTER_VOICE_DURATION={"javi/muerte_1":2.136,"javi/muerte_2":1.44,"javi/muerte_3":1.752,"javi/muerte_4":2.472,"javi/ulti_lista_1":2.472,"javi/ulti_lista_2":1.224,"javi/casi_baja_1":1.224,"javi/casi_baja_2":1.248,"javi/baja_1":1.8,"javi/baja_2":2.352,"javi/reposo_1":2.952,"javi/reposo_2":1.8,"javi/reposo_3":2.232,"javi/activar_ulti":3.408,"javi/dano_1":1.464,"javi/dano_2":1.008,"clippy/hola":1.697875,"clippy/ayuda":1.645625,"clippy/peleando":2.559938,"clippy/por_ti":1.593375,"clippy/perdiendo":1.959125,"clippy/guardar":1.541125,"clippy/atacando":1.8285,"clippy/pantalla_azul":1.541125,"clippy/vas_a_perder":1.697875};
Object.assign(CHARACTER_VOICE_DURATION,VOICE_DUR);
let characterVoiceSequence=0;
function characterVoiceVolume(f,key){return 1.1*(f.isPlayer?1:clamp(1-camera.position.distanceTo(f.pos)/40,0,1))*((key&&AUDIO_CFG.clip[key]&&AUDIO_CFG.clip[key].vol)??1);}
function characterVoiceState(f){return f.voicePlayback||(f.voicePlayback={audio:null,cooldowns:{},lastChoice:{},ready:false,pendingReady:0,idleAfter:G.time+rand(12,20),cine:false,clippyNextAt:0});}
function stopCharacterVoice(f){
  const s=f.voicePlayback,h=s?.audio;if(!h)return;s.audio=null;
  if(h.source){try{h.source.stop();}catch(_){}h.source.disconnect();h.gain.disconnect();h.pan?.disconnect();}
  if(h.htmlRecord)releaseHtmlAudio(h.htmlRecord);
  ACTIVE_DIALOGUE.delete(h);
}
function resetCharacterVoice(f){
  if(!f.voicePlayback&&!VOICE_DEFS[f.ch.id]&&f.ch.id!=='jesuluto')return;
  const choices=f.voicePlayback?.lastChoice||{};stopCharacterVoice(f);f.voicePlayback=null;
  if(VOICE_DEFS[f.ch.id]||f.ch.id==='jesuluto')characterVoiceState(f).lastChoice=choices;
  f.characterVoiceCue=null;
}
function playCharacterClip(f,key,priority){
  if(!AC||AC.state==='closed'||G.state!=='play'||!CHARACTER_VOICE_KEYS.has(key)||CHARACTER_VOICE_META[key].character!==f.ch.id)return null;
  const s=characterVoiceState(f);stopCharacterVoice(f);
  const duration=SND.buf[key]?.duration||CHARACTER_VOICE_DURATION[key]||3,h={key,priority,until:performance.now()+duration*1000};
  const volume=characterVoiceVolume(f,key);
  h.level=volume;
  s.audio=h;
  {const mv=new RegExp('^'+f.ch.id+'\\/reposo_(\\d+)$').exec(key),vn=mv&&'idle_voz_'+mv[1],vd=vn&&(bbSet(f.ch.id)||{})[vn];f.idleVar=vd?{name:vn,t0:G.time,until:G.time+Math.max(duration+.15,vd.length)}:null;}
  const finish=()=>{
    if(h.source){h.source.disconnect();h.gain.disconnect();h.pan?.disconnect();}
    if(h.htmlRecord)releaseHtmlAudio(h.htmlRecord);
    ACTIVE_DIALOGUE.delete(h);
    if(s.audio===h)s.audio=null;
  };
  try{
    if(SND.buf[key]){
      h.source=AC.createBufferSource();h.source.buffer=SND.buf[key];h.gain=AC.createGain();h.gain.gain.value=volume;
      h.source.connect(h.gain);h.pan=connectSpatial(h.gain,'voices',f.isPlayer?null:f.pos);h.source.onended=finish;h.source.start();
    }else{
      lazyLoadVoice(key);
      h.el=new Audio(voiceRel(key));h.htmlRecord=trackHtmlAudio(h.el,volume*.5,'voices');h.el.addEventListener('ended',finish,{once:true});h.el.addEventListener('error',finish,{once:true});playTrackedAudio(h.htmlRecord).then(ok=>{if(!ok)finish();});
    }
  }catch(error){finish();reportFrameError('voz:javi',error);return null;}
  ACTIVE_DIALOGUE.add(h);
  return h;
}
function javiSpeak(f,event){
  const def=VOICE_DEFS[f?.ch.id]?.[event];
  if(!f||f.remote||!def||!AC||G.state!=='play'||G.viewer||(!f.alive&&event!=='death'))return false;
  const s=characterVoiceState(f),now=performance.now();
  if(s.audio&&s.audio.until<=now)stopCharacterVoice(f);
  if((s.cooldowns[event]??-Infinity)>G.time)return false;
  if(s.audio&&s.audio.priority>=def.priority){if(event==='ready')s.pendingReady=now+6000;return false;}
  const choices=def.clips.filter(k=>k!==s.lastChoice[event]),key=choices[Math.floor(Math.random()*choices.length)]||def.clips[0];
  const cp=AUDIO_CFG.clip[key];if(cp){if(cp.chance!=null&&Math.random()>cp.chance)return false;if(cp.cd&&((s.clipCd||{})[key]||0)>G.time)return false;(s.clipCd||(s.clipCd={}))[key]=G.time+(cp.cd||0);}
  if(!playCharacterClip(f,key,def.priority))return false;
  s.lastChoice[event]=key;s.cooldowns[event]=G.time+def.cd;s.idleAfter=G.time+rand(20,32);
  if(event==='activate'||event==='death')s.pendingReady=0;
  f.characterVoiceCue={s:++characterVoiceSequence,k:key,at:Math.round(now)};NET.sendT=0;return true;
}
function javiActivateVoice(f,cinematic=false){
  if(!VOICE_DEFS[f.ch.id]||f.remote)return;
  const s=characterVoiceState(f);s.pendingReady=0;
  if(cinematic){s.cine=true;javiSpeak(f,'activate');}
  else if(s.cine)s.cine=false;else javiSpeak(f,'activate');
}
function updateCharacterVoices(){
  for(const f of G.fighters){
    const s=f.voicePlayback;
    if(s?.audio){
      const h=s.audio;if(h.until<=performance.now())stopCharacterVoice(f);
      else{
        h.level=characterVoiceVolume(f,h.key);
        if(h.gain)h.gain.gain.setTargetAtTime(h.level,AC.currentTime,.08);
        if(h.pan)h.pan.pan.setTargetAtTime(spatialPan(f.pos),AC.currentTime,.08);
        if(h.htmlRecord){h.htmlRecord.base=h.level*.5;refreshHtmlAudio(h.htmlRecord);}
      }
    }
    if(!VOICE_DEFS[f.ch.id]||f.remote||!f.alive||G.viewer||(G.paused&&!G.mp))continue;
    const state=characterVoiceState(f),full=f.ult>=100&&f.awak<=0;
    if(f.hp<f.maxHp*.25){if(!state.lowHp){state.lowHp=true;javiSpeak(f,'ev_low_hp');}}else if(f.hp>=f.maxHp*.4)state.lowHp=false;
    if(!full){state.ready=false;state.pendingReady=0;}
    else if(!state.ready){state.ready=true;if(!javiSpeak(f,'ready'))state.pendingReady=performance.now()+6000;}
    if(state.pendingReady&&full&&!state.audio){if(state.pendingReady>performance.now())javiSpeak(f,'ready');state.pendingReady=0;}
    // frase al estar cerca de otro personaje (con versión especial si ese personaje está despierto)
    if(G.time>=(state.nearAt||0)){state.nearAt=G.time+1.2;const defs=VOICE_DEFS[f.ch.id];
      if(G.time>(state.nearGlobal||8))for(const g of G.fighters){if(g===f||!g.alive||dist2d(f,g)>10)continue;const id=g.ch.id,ev=g.awak>0&&defs['cerca_'+id+'_ulti']?'cerca_'+id+'_ulti':defs['cerca_'+id]?'cerca_'+id:null;if(ev&&javiSpeak(f,ev)){state.nearGlobal=G.time+20;break;}}}
    const busy=G.cine||f.action||f.stun>0||f.ragdoll>0||f.grabbed||Math.hypot(f.vel.x,f.vel.z)>.5||G.time-(f.lastHurtT??-99)<6||G.time-(f.lastAtkT??-99)<6;
    if(busy)state.idleAfter=Math.max(state.idleAfter,G.time+12);
    else if(G.time>=state.idleAfter)javiSpeak(f,'idle');
  }
}
let MENU_VOICE=null;
function stopMenuVoice(){
  if(!MENU_VOICE)return;
  MENU_VOICE.stop();
  MENU_VOICE=null;
}
function menuVoice(id){
  stopMenuVoice();
  const d=VOICE_DEFS[id]?.menu;
  if(!d||!AC)return;
  const key=d.clips[Math.random()*d.clips.length|0];
  if(SND.buf[key]&&AC.state==='running'){
    const source=playBufferSound(SND.buf[key],.95,'voices');
    if(source)MENU_VOICE={stop:()=>{try{source.stop();}catch(e){}}};
  }else{
    const record=trackHtmlAudio(new Audio(sndUrl(key)),.475,'voices','menu');
    MENU_VOICE={stop:()=>releaseHtmlAudio(record)};
    playTrackedAudio(record);
  }
}
function characterVoicePresence(f){return f.characterVoiceCue&&performance.now()-f.characterVoiceCue.at<6000?f.characterVoiceCue:null;}
function receiveCharacterVoice(f,pr){
  const cue=pr.vc,meta=cue&&CHARACTER_VOICE_META[cue.k];
  if(!meta||meta.character!==f.ch.id||!Number.isSafeInteger(cue.s)||cue.s<=0||cue.s<=(f.characterVoiceSeen||0)||!Number.isFinite(cue.at)||!Number.isFinite(pr.ts))return;
  f.characterVoiceSeen=cue.s;
  const age=pr.ts-cue.at;if(age<-.1||age>2000)return;
  playCharacterClip(f,cue.k,meta.priority);
  if(meta.text){if(f.clippy)f.clippy.say(meta.text,true);else f.pendingClippyVoice={text:meta.text,until:performance.now()+2000};}
}
function clippySpeak(f,text){
  if(f?.ch.id!=='jesuluto'||f.remote||!f.alive||G.state!=='play'||G.viewer)return false;
  const def=CLIPPY_VOICES[text];if(!def)return true;
  const s=characterVoiceState(f),now=performance.now();if(s.audio&&s.audio.until<=now)stopCharacterVoice(f);
  if(s.audio&&s.audio.priority>=def.priority)return false;
  if((s.cooldowns[def.clip]||0)>now||(def.priority<=1&&s.clippyNextAt>now))return false;
  const duration=SND.buf[def.clip]?.duration||CHARACTER_VOICE_DURATION[def.clip];
  if(AC)playCharacterClip(f,def.clip,def.priority);
  s.cooldowns[def.clip]=now+(def.priority>1?4500:(duration+4)*1000);s.clippyNextAt=now+(duration+2)*1000;
  f.characterVoiceCue={s:++characterVoiceSequence,k:def.clip,at:Math.round(now)};NET.sendT=0;return true;
}

const GAME_RECORDINGS=new Set([...CHARACTER_VOICE_FILES,'randi_waaa','randi_voz1','randi_voz2','vhit','vland','whistle','applause','elev_ride','door_close','door_open']);
function soundCategory(name){return CHARACTER_VOICE_KEYS.has(name)||name==='randi_waaa'||name==='randi_voz1'||name==='randi_voz2'?'voices':GAME_RECORDINGS.has(name)?'game':'ambient';}
function soundChannel(category='game'){return (category==='ambient'?ambientAudioBus:category==='voices'?voicesAudioBus:gameAudioBus)||master;}
function syncAudioControls(){
  $('music-toggle').textContent=MUS.on?'Música activada':'Música desactivada';
  $('music-toggle').setAttribute('aria-pressed',String(MUS.on));
  for(const key of Object.keys(AUDIO_LEVELS)){
    $('volume-'+key).value=AUDIO_LEVELS[key];$('volume-'+key+'-value').textContent=AUDIO_LEVELS[key]+'%';
    $('volume-'+key).setAttribute('aria-valuetext',AUDIO_LEVELS[key]+'%');
  }
}
function refreshHtmlAudio(record){
  for(const r of record?[record]:HTML_AUDIO_LEVELS){
    const enabled=(!r.scene||r.scene===G.state) && (r.category!=='ambient'||WX.sound) && (r.category!=='music'||MUS.on);
    const volume=enabled?clamp(r.base*AUDIO_LEVELS.general/100*AUDIO_LEVELS[r.category]/100,0,1):0;
    if(Math.abs(r.el.volume-volume)>.0001)r.el.volume=volume;
  }
}
function releaseHtmlAudio(record, pause=true){
  if(!HTML_AUDIO_LEVELS.delete(record))return;
  if(pause)record.el.pause();
  record.el.removeEventListener('ended',record.release);
  record.el.removeEventListener('error',record.release);
}
function trackHtmlAudio(el,base,category,scene=category==='ambient'?'play':''){
  const record={el,base,category,scene,starting:false};
  record.release=()=>releaseHtmlAudio(record,false);
  HTML_AUDIO_LEVELS.add(record);
  el.addEventListener('ended',record.release);
  el.addEventListener('error',record.release);
  refreshHtmlAudio(record);
  return record;
}
async function playTrackedAudio(record,retry=false){
  if(!HTML_AUDIO_LEVELS.has(record)||record.starting)return false;
  record.starting=true;
  try{await record.el.play();return HTML_AUDIO_LEVELS.has(record);}
  catch(error){
    if(!retry||!['NotAllowedError','AbortError'].includes(error.name))releaseHtmlAudio(record);
    return false;
  }finally{record.starting=false;}
}
function playHtmlEffect(url,gain,category,scene=G.state){
  const record=trackHtmlAudio(new Audio(url),gain,category,scene);
  playTrackedAudio(record);
}
function applyAudioLevels(){
  if(AC&&master){
    const t=AC.currentTime;
    master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(.5*AUDIO_LEVELS.general/100,t,.025);
    for(const [node,key]of [[ambientAudioBus,'ambient'],[gameAudioBus,'game'],[voicesAudioBus,'voices']])if(node){node.gain.cancelScheduledValues(t);node.gain.setTargetAtTime(AUDIO_LEVELS[key]/100,t,.025);}
  }
  refreshHtmlAudio();
}
function setAudioLevel(key,value){
  if(!Object.prototype.hasOwnProperty.call(AUDIO_LEVELS,key)||!Number.isFinite(+value))return;
  AUDIO_LEVELS[key]=Math.round(clamp(+value,0,100));
  saveAudioLevels();
}
function saveAudioLevels(){
  try{localStorage.setItem('bsb_audio_levels_v1',JSON.stringify(AUDIO_LEVELS));}catch(e){}
  syncAudioControls();applyAudioLevels();
}
function setPauseView(view,focus=true){
  const options=view==='options';
  $('pause-home').classList.toggle('hidden',options);$('pause-settings').classList.toggle('hidden',!options);
  $('pause').dataset.view=options?'options':'home';$('pause').setAttribute('aria-labelledby',options?'pause-options-title':'pause-title');
  $('pause').querySelector('.obox').scrollTop=0;
  if(options){syncAudioControls();if(typeof gfxSyncUI==='function')gfxSyncUI();if(typeof bindsSyncUI==='function')bindsSyncUI();if(typeof hudSyncUI==='function')hudSyncUI();}
  if(focus&&G.paused)(options?$('volume-general'):$('pause-options')).focus({preventScroll:true});
}
let SETTINGS_EXT=false;
function openSettings(){SETTINGS_EXT=true;$('pause').classList.add('ext');$('pause').classList.remove('hidden');setPauseView('options',false);}
function closeSettings(){SETTINGS_EXT=false;$('pause').classList.add('hidden');$('pause').classList.remove('ext');setPauseView('home',false);}
function initPauseAudioControls(){
  syncAudioControls();$('tset').addEventListener('click',e=>{e.stopPropagation();openSettings();});$('setbtn').addEventListener('click',openSettings);
  addEventListener('keydown',e=>{if(SETTINGS_EXT&&e.code==='Escape'){e.preventDefault();e.stopPropagation();closeSettings();}},true);$('pause-options').addEventListener('click',()=>setPauseView('options'));
  $('pause-back').addEventListener('click',()=>{if(SETTINGS_EXT)closeSettings();else setPauseView('home');});
  for(const el of document.querySelectorAll('[data-volume]'))el.addEventListener('input',()=>setAudioLevel(el.dataset.volume,el.value));
  $('music-toggle').addEventListener('click',toggleMusic);
  $('audio-reset').addEventListener('click',()=>{
    for(const key of Object.keys(AUDIO_LEVELS))AUDIO_LEVELS[key]=100;
    saveAudioLevels();
  });
}

let AC = null, master = null, NB = null, uwFilter = null, audioCompressor = null;
function resumeAudioContext(){if(AC&&AC.state==='suspended'){AC.resume().catch(()=>{});}}
window.addEventListener('pointerdown',resumeAudioContext,{passive:true});
window.addEventListener('keydown',resumeAudioContext,{passive:true});
window.addEventListener('touchstart',resumeAudioContext,{passive:true});
function initAudio() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = .5*AUDIO_LEVELS.general/100; uwFilter = AC.createBiquadFilter(); uwFilter.type = 'lowpass'; uwFilter.frequency.value = 22000; master.connect(uwFilter);
      audioCompressor = AC.createDynamicsCompressor();
      audioCompressor.threshold.value = -12;
      audioCompressor.knee.value = 10;
      audioCompressor.ratio.value = 5;
      audioCompressor.attack.value = .004;
      audioCompressor.release.value = .16;
      uwFilter.connect(audioCompressor);
      audioCompressor.connect(AC.destination);
      gameAudioBus=AC.createGain();gameAudioBus.gain.value=AUDIO_LEVELS.game/100;gameAudioBus.connect(master);
      ambientAudioBus=AC.createGain();ambientAudioBus.gain.value=AUDIO_LEVELS.ambient/100;ambientAudioBus.connect(master);
      voicesAudioBus=AC.createGain();voicesAudioBus.gain.value=AUDIO_LEVELS.voices/100;voicesAudioBus.connect(master);
      NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NB.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { AC = null; }
  }
  if (AC && (AC.state === 'suspended' || AC.state === 'interrupted')) {
    const resumeOnGesture = () => { if (AC && AC.state === 'suspended') AC.resume().catch(()=>{}); };
    ['pointerdown','keydown','touchstart'].forEach(ev => window.addEventListener(ev, resumeOnGesture, { once: true, passive: true }));
  }
  if (AC) loadSounds();
}
function spatialPan(pos){
  const dx=pos.x-camera.position.x, dy=pos.y-camera.position.y, dz=pos.z-camera.position.z;
  const right=camera.matrixWorld.elements;
  return clamp((dx*right[0]+dy*right[1]+dz*right[2])/Math.max(5,Math.hypot(dx,dy,dz)),-.78,.78);
}
function connectSpatial(node,category,pos){
  const bus=soundChannel(category);
  if(!pos||!AC.createStereoPanner){node.connect(bus);return null;}
  const pan=AC.createStereoPanner();pan.pan.value=spatialPan(pos);node.connect(pan);pan.connect(bus);
  return pan;
}
function connectOneShot(source,gain,category,pos,filter){
  const pan=connectSpatial(gain,category,pos);
  source.addEventListener('ended',()=>{
    source.disconnect();filter?.disconnect();gain.disconnect();pan?.disconnect();
  },{once:true});
}
function playBufferSound(buffer,volume,category,pos){
  if(!AC||AC.state!=='running'||volume<=0)return null;
  const source=AC.createBufferSource(),gain=AC.createGain();
  source.buffer=buffer;gain.gain.value=volume;
  source.connect(gain);connectOneShot(source,gain,category,pos);
  if(category==='voices'){
    const voice={level:volume,until:performance.now()+buffer.duration*1000};
    ACTIVE_DIALOGUE.add(voice);
    source.addEventListener('ended',()=>ACTIVE_DIALOGUE.delete(voice),{once:true});
  }
  source.start();return source;
}
function nz(t, dur, freq, q, gain, type = 'lowpass', category = 'game', pos = null) {
  const s = AC.createBufferSource(); s.buffer = NB;
  const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = AC.createGain();
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(Math.max(.001,gain),t+.005);
  g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); connectOneShot(s,g,category,pos,f);
  s.start(t, Math.random() * .05); s.stop(t + dur + .02);
}
function tone(t, dur, f0, f1, type, gain, pos = null) {
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(Math.max(.001,gain),t+.004);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);connectOneShot(o,g,'game',pos);o.start(t);o.stop(t+dur+.02);
}
const UI_SFX = new Set(['select', 'drop', 'whoosh', 'draw']);
let SFX_RAW = false, SFX_FORCE = false; const SFX_CD = {}, SFXF = {};
function sfxFile(url, volume, pos) {
  if (SFXF[url]?.buf) {playBufferSound(SFXF[url].buf,volume,'game',pos);return;}
  if (!SFXF[url] && location.protocol!=='file:') {
    SFXF[url]={};
    fetch(url).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();})
      .then(bytes=>AC.decodeAudioData(bytes)).then(buf=>{SFXF[url].buf=buf;}).catch(()=>{});
  }
  playHtmlEffect(url,volume*.5,'game');
}
window.sfx = sfx;
function sfx(k, pos, mul = 1, { range = 45, title = false } = {}) {
  if (!AC || AC.state!=='running' || AUDIO_LEVELS.general===0 || AUDIO_LEVELS.game===0 || (G.state !== 'play' && !(title && G.state === 'title') && !UI_SFX.has(k) && !SFX_FORCE)) return;
  let v = (pos ? clamp(1 - camera.position.distanceTo(pos) / range, 0, 1) : 1) * mul;
  const so = !SFX_RAW && AUDIO_CFG.sfx[k];
  if (so) {   // lo que se cambió en el editor de audio
    if (so.off) return; if (so.chance != null && Math.random() > so.chance) return;
    if (so.cd) { const n = performance.now(); if (n < (SFX_CD[k] || 0)) return; SFX_CD[k] = n + so.cd * 1000; }
    v *= so.vol != null ? so.vol : 1; if (so.file && v >= .03) { sfxFile(so.file,v,pos); return; }
  }
  if (v < .03) return;
  const t = AC.currentTime;
  switch (k) {
    case 'swing': nz(t, .12, 2400, 1, .22 * v, 'bandpass', 'game', pos); break;
    case 'hit': nz(t, .09, 1800, .8, .5 * v, 'lowpass', 'game', pos); tone(t, .1, 180, 60, 'sine', .5 * v, pos); break;
    case 'heavy': nz(t, .25, 900, .7, .65 * v, 'lowpass', 'game', pos); tone(t, .25, 120, 35, 'sine', .73 * v, pos); break;
    case 'boom': nz(t, .8, 450, .5, .76 * v, 'lowpass', 'game', pos); tone(t, .7, 90, 25, 'sine', .78 * v, pos); break;
    case 'block': tone(t, .12, 900, 700, 'square', .12 * v, pos); nz(t, .05, 4000, 1, .2 * v, 'highpass', 'game', pos); break;
    case 'break': tone(t, .3, 520, 120, 'sawtooth', .25 * v, pos); nz(t, .3, 2000, 1, .4 * v, 'lowpass', 'game', pos); break;
    case 'dash': nz(t, .2, 1200, 2, .35 * v, 'bandpass', 'game', pos); break;
    case 'tp': tone(t, .18, 300, 1400, 'sine', .3 * v, pos); break;
    case 'zap': tone(t, .15, 1200, 300, 'sawtooth', .18 * v, pos); break;
    case 'beam': nz(t, .9, 1400, 3, .4 * v, 'bandpass', 'game', pos); tone(t, .9, 220, 110, 'sawtooth', .14 * v, pos); break;
    case 'slash': nz(t, .15, 5000, 1.5, .35 * v, 'highpass', 'game', pos); tone(t, .12, 1800, 600, 'triangle', .12 * v, pos); break;
    case 'ult': tone(t, .7, 220, 880, 'sawtooth', .16 * v, pos); tone(t, .7, 330, 1320, 'square', .07 * v, pos); nz(t, .6, 3000, 1, .2 * v, 'highpass', 'game', pos); break;
    case 'ko': tone(t, .5, 600, 90, 'square', .2 * v, pos); break;
    case 'jump': tone(t, .08, 200, 420, 'sine', .1 * v, pos); break;
    case 'fire': nz(t, .5, 700, .6, .6 * v, 'lowpass', 'game', pos); nz(t, .3, 3000, 1, .2 * v, 'highpass', 'game', pos); break;
    case 'ice': tone(t, .25, 2400, 1800, 'triangle', .15 * v, pos); nz(t, .3, 6000, 2, .3 * v, 'highpass', 'game', pos); break;
    case 'grab': tone(t, .15, 140, 90, 'square', .25 * v, pos); nz(t, .1, 600, 1, .4 * v, 'lowpass', 'game', pos); break;
    case 'counter': tone(t, .2, 1500, 3000, 'triangle', .25 * v, pos); tone(t, .2, 750, 1500, 'sine', .2 * v, pos); break;
    case 'select': tone(t, .09, 660, 990, 'square', .08 * v, pos); nz(t, .1, 3000, 1, .1 * v, 'highpass', 'game', pos); break;
    case 'whoosh': nz(t, .3, 1500, 1.2, .3 * v, 'bandpass', 'game', pos); break;
    case 'draw': nz(t, .18, 6000, 2, .25 * v, 'highpass', 'game', pos); tone(t, .15, 1400, 2400, 'triangle', .08 * v, pos); break;
    case 'drop': nz(t, .35, 300, .7, .6 * v, 'lowpass', 'game', pos); tone(t, .3, 110, 40, 'sine', .7 * v, pos); break;
    case 'ding': tone(t, .8, 1175, 1175, 'sine', .22 * v, pos); tone(t + .28, .9, 880, 880, 'sine', .2 * v, pos); break;
    case 'slide': nz(t, .5, 900, 1.2, .2 * v, 'bandpass', 'game', pos); tone(t, .45, 150, 105, 'sine', .14 * v, pos); break;
    // sonidos de las escenas de Sekza (cielo, avion, caida)
    case 'wind': nz(t, 1.3, 700, .8, .32 * v, 'bandpass', 'game', pos); nz(t + .08, 1.1, 1900, 1.5, .13 * v, 'bandpass', 'game', pos); break;
    case 'screech': tone(t, .35, 2200, 3500, 'sawtooth', .13 * v, pos); tone(t + .05, .3, 1800, 2900, 'square', .06 * v, pos); tone(t + .2, .28, 2700, 1500, 'sawtooth', .1 * v, pos); nz(t, .3, 5200, 2, .1 * v, 'highpass', 'game', pos); break;
    case 'engine': nz(t, 1.7, 170, .7, .55 * v, 'lowpass', 'game', pos); tone(t, 1.7, 72, 54, 'sawtooth', .2 * v, pos); tone(t, 1.7, 144, 108, 'square', .06 * v, pos); break;
    case 'clank': tone(t, .25, 1400, 900, 'square', .13 * v, pos); tone(t, .35, 520, 330, 'triangle', .2 * v, pos); nz(t, .08, 5200, 1.2, .3 * v, 'highpass', 'game', pos); break;
    case 'rush': nz(t, 1.5, 430, .6, .55 * v, 'lowpass', 'game', pos); nz(t, 1.3, 2500, 1.3, .2 * v, 'bandpass', 'game', pos); break;
    case 'crash': nz(t, 1.2, 380, .5, .95 * v, 'lowpass', 'game', pos); tone(t, .95, 85, 22, 'sine', .95 * v, pos); nz(t + .06, .6, 3500, 1, .3 * v, 'highpass', 'game', pos); nz(t + .25, .7, 900, .8, .3 * v, 'lowpass', 'game', pos); break;
    case 'whoom': nz(t, .55, 320, .8, .5 * v, 'lowpass', 'game', pos); tone(t, .5, 190, 60, 'sawtooth', .17 * v, pos); break;
    case 'step': nz(t, .07, 900, 1, .3 * v, 'lowpass', 'game', pos); tone(t, .08, 110, 70, 'sine', .3 * v, pos); break;
  }
}

// ===== Música y ambiente sonoro: vive en js/ui/musica_ambiente.js =====
const { AMB, AMB_KIND, AMB_LAYERS, MUS, MUSIC_TRIM, SND, SND_LIST, ULT_MUS, dialogueAudible, fadeAudioTrack, initAmbience, lazyLoadVoice, loadSounds, makeMusicTrack, musicKick, musicNextFight, musicPlay, musicTrim, playSnd, preloadSounds, toggleMusic, ultMusic, ultMusicPreload, updateAmbience, updateBeach, updateMusic } = CF_UI.crearMusicaAmbiente({ ACTIVE_DIALOGUE, AUDIO_CFG, AUDIO_LEVELS, BEACH, CHARACTER_VOICE_FILES, CHARS, CITY, G, HTML_AUDIO_LEVELS, SHORE, STAGE, SUN_DIR, WX, _c, camera, clamp, initAudio, musFile, playBufferSound, playHtmlEffect, playTrackedAudio, refreshHtmlAudio, releaseHtmlAudio, sndUrl, soundCategory, soundChannel, stopMenuVoice, syncAudioControls, trackHtmlAudio, ultMusicRel, get AC() { return AC; }, get master() { return master; }, get CULL() { return CULL; }, get SEA() { return SEA; }, get addFeedText() { return addFeedText; }, get TITLE() { return TITLE; } });
// ================= Timers en tiempo de juego =================
const TIMERS = [];
const later = (s, fn) => TIMERS.push({ t: s, fn });
const SKILL_OBJS = [];
function trackSkillObj(owner, maxLife, disposeFn) {
  const e = { owner: owner || null, age: 0, maxLife: maxLife || 15, gen: G.matchGen, dispose: disposeFn, done: false };
  SKILL_OBJS.push(e);
  return () => {
    if (e.done) return;
    e.done = true;
    const i = SKILL_OBJS.indexOf(e);
    if (i >= 0) SKILL_OBJS.splice(i, 1);
  };
}
function clearSkillObjs(owner = null) {
  for (let i = SKILL_OBJS.length - 1; i >= 0; i--) {
    const e = SKILL_OBJS[i];
    if (owner && e.owner !== owner) continue;
    SKILL_OBJS.splice(i, 1);
    if (e.done) continue;
    e.done = true;
    try { e.dispose(); } catch (err) {}
  }
}
function updateSkillObjs(dt) {
  for (let i = SKILL_OBJS.length - 1; i >= 0; i--) {
    const e = SKILL_OBJS[i];
    if (e.done) { SKILL_OBJS.splice(i, 1); continue; }
    e.age += dt;
    const deadOwner = e.owner && (!G.fighters.includes(e.owner) || e.owner._disposed);
    if (G.matchGen !== e.gen || G.state !== 'play' || deadOwner || (e.maxLife > 0 && e.age > e.maxLife)) {
      SKILL_OBJS.splice(i, 1);
      e.done = true;
      try { e.dispose(); } catch (err) {}
    }
  }
}

// ================= Combate =================
function startAction(f, a) {
  if (f.action) endAction(f);
  a.t = 0; a.steps = a.steps || []; f.action = a; f.blocking = false;
  if (a.swing == null) a.swing = (a.name === 'm1' || a.name === 'counterHit' || (a.steps && a.steps.length > 0 && (a.dur || 1) < 1.4));
  // A stationary cast owns movement; discard running/dash inertia before its own start/tick.
  if (a.noControl && a.speedMul === 0) { f.vel.x = f.vel.z = 0; f.dashT = 0; f.dashAnimT = 0; }
  if (a.aim) f.yaw = aimYawFor(f);
  if (a.start) a.start(a);
}
function endAction(f) { const a = f.action; if (!a) return; f.action = null; if (a.onEnd) a.onEnd(a); }
function updateAction(f, dt) {
  const a = f.action; if (!a) return;
  a.t += dt;
  for (const s of a.steps) if (!s.done && a.t >= s.at) { s.done = true; s.fn(a); if (f.action !== a) return; }
  if (a.tick) a.tick(a, a.t, dt);
  if (f.action === a && a.t >= a.dur) endAction(f);
}
function counterHit(t, att) {
  endAction(t); t.iframes = .6;
  const back = fwd(att.yaw);
  ghost(t, t.ch.color, .6, .35);
  t.pos.set(att.pos.x - back.x * 1.4, att.pos.y, att.pos.z - back.z * 1.4); t.yaw = yawTo(t, att);
  popText(chestOf(t), '¡CONTRA!', '#ffffff', 26); comicPop(chestOf(t), '¡PARRY!', 'burst-cyan', 36, rand(-12, 12)); sfx('counter', t.pos);
  if (att.isPlayer || t.isPlayer) G.slowT = .35;
  startAction(t, { name: 'counterHit', dur: .45, anim: [[0, 'mega', 1100]], steps: [{ at: .05, fn: () => { arcSlash(t, t.ch.color, { tilt: .3, r: 1.8, w: .7, len: 2.6 }); applyHit(t, att, { dmg: 13, kb: 18, up: 9, ragdoll: 1.2, guardBreak: true, noCounter: true, hitstop: .12, shake: .6 }); } }] });
}
function netHit(att, t, o) {
  let dir = o.dir ? o.dir.clone() : new V3(t.pos.x - att.pos.x, 0, t.pos.z - att.pos.z);
  dir.y = 0; if (dir.lengthSq() < 1e-4) dir = fwd(att.yaw); dir.normalize();
  const dmg = o.dmg * (att.awak > 0 ? 1.15 : 1) * (att.ch.dmgMul || 1) * DMG_GLOBAL * (att.isPlayer ? G.rules.dmg : 1), col = o.color || att.ch.color, heavy = (o.ragdoll || 0) > 0 || o.dmg >= 8;
  const nhit = { s: 0, t: performance.now(), to: t.peer, dm: Math.round(dmg * 10) / 10, kb: o.kb || 0, up: o.up || 0, rg: o.ragdoll || 0, st: o.stun || 0, gb: o.guardBreak ? 1 : 0, fz: o.freeze || 0, dx: r2(dir.x), dz: r2(dir.z), c: col, sf: o.spearFinish || null };
  if (att.roomBot) { nhit.s = ++att.netSeq; att.netHits.push(nhit); while (att.netHits.length > 10) att.netHits.shift(); }   // bot de la sala: el golpe sale con el id del bot
  else { nhit.s = ++NET.hitSeq; NET.hitsOut.push(nhit); while (NET.hitsOut.length > 10) NET.hitsOut.shift(); }
  att.ult = Math.min(100, att.ult + dmg * ULT_GAIN); t.flashT = .12;
  if(t.hp>dmg&&t.hp<t.maxHp*.22&&!t.net?.wxSafe)javiSpeak(att,'near');
  const chest = chestOf(t);
  burst(chest, heavy ? 18 : 8, col, heavy ? 10 : 6, heavy ? .2 : .14, .4, .5);
  impactStar(chest, heavy ? col : '#ffffff', heavy ? 2.2 : 1.2, heavy ? .26 : .16);
  sparkLines(chest, col, heavy ? 9 : 4, heavy ? 2.2 : 1.2);
  if (att.isPlayer && ((o.ragdoll || 0) >= 1 || o.dmg >= 11)) impactFrame(col);
  sfx(o.sound || (heavy ? 'heavy' : 'hit'), t.pos);
  if (att.isPlayer) {
    G.hitstop = Math.max(G.hitstop, heavy ? .06 : .03); G.shake = Math.max(G.shake, heavy ? .3 : .1);
    popText(chest, Math.max(1, Math.round(dmg)), heavy ? '#d7ff2f' : '#ffffff', heavy ? 30 : 22);
    recordPlayerComboHit(dmg);
    const charId = (att.ch && att.ch.id) || '';
    if (o.guardBreak) {
      comicPop(chest, '¡CRACK!', 'burst-gold', 34, rand(-12, 12));
    } else if (o.spearFinish || (o.ragdoll || 0) >= 1 || o.dmg >= 11 || G.combo === 4) {
      let onom = '¡BAM!', bClass = 'burst-gold';
      if (charId === 'javi' || att.spear) { onom = pick(['¡ESTOCADA!', '¡ZAS!', '¡CLASH!', '¡PUNZÓN!']); bClass = 'burst-cyan'; }
      else if (charId === 'sekza') { onom = pick(['¡GARRASO!', '¡SLASH!', '¡ZAS!', '¡PICADA!']); bClass = 'burst-orange'; }
      else if (charId === 'randi') { onom = pick(['¡PALOMAZO!', '¡DOGOOON!', '¡PUM!', '¡BAM!']); bClass = 'burst-red'; }
      else { onom = pick(['¡BAM!', '¡WHAM!', '¡KRAK!', '¡POW!', '¡BOOM!']); }
      comicPop(chest, onom, bClass, 34, rand(-15, 15));
    } else if (heavy) {
      comicPop(chest, pick(['¡POW!', '¡ZAS!', '¡SMACK!', '¡WHAM!']), 'burst-white', 26, rand(-10, 10));
    } else if (G.combo >= 2 && Math.random() < 0.5) {
      comicPop(chest, pick(['¡TAK!', '¡HIT!', '¡POP!']), 'burst-white', 20, rand(-8, 8));
    }
  }
}
let FX_MUTE = false;
function applyHit(att, t, o) {   // si el golpe ocurre en OTRO mundo (abismo vs superficie) no hay marcos de impacto, temblor ni cámara lenta para mí
  const me = G.player;
  if (!me || (!!att.abyss === !!me.abyss && !!t.abyss === !!me.abyss)) return applyHit0(att, t, o);
  const hs = G.hitstop, sh = G.shake, sl = G.slowT; FX_MUTE = true; let r; try { r = applyHit0(att, t, o); } finally { FX_MUTE = false; } G.hitstop = hs; G.shake = sh; G.slowT = sl; return r;
}
function applyHit0(att, t, o) {
  if (t === att || (att.remote && !o.fromNet)) return false;
  if (att.abyss && t.abyss && !att.isBoss && !t.isBoss) return false;   // sin PVP dentro del abismo
  if (t.isBoss) o = Object.assign({}, o, { kb: 0, up: 0, ragdoll: 0, stun: 0, guardBreak: false, noCounter: true, pull: 0 });   // el Kraken no se empuja ni se aturde
  if (t.isBoss && att.isPlayer && window.CF_ABISMO) o = CF_ABISMO.bossHit(att, o, t) || o;   // el jefe decide cuanto daño recibe (tentaculos, expuesto)
  if (t.remote) { if (!t.alive || t.ragdoll > 0) return false; netHit(att, t, o); return true; }
  // en ragdoll en el suelo no recibe dano (wake up), pero en el aire si se permite juggle combo
  if (!t.alive || t.iframes > 0) return false;
  if (t.ragdoll > 0) {
    const tGround = groundAt(t.pos.x, t.pos.z);
    const isAirborne = !t.onGround && (t.pos.y > tGround + 0.45);
    if (!isAirborne && !o.otg) return false;
    t.ragdoll = Math.min(t.ragdoll, 0.45);
  }
  // durante un agarre con cinematica solo le pega el que lo agarro
  if (t.cineLock && t.cineLock !== att) return false;
  if (t.action && t.action.sebParry && !o.noCounter && att.alive) { sebCounter(t, att); return 'countered'; }
  if (t.action && t.action.counter && !o.noCounter && att.alive) { if (t.action.onCounter) t.action.onCounter(t, att); else counterHit(t, att); return 'countered'; }   // onCounter: la habilidad decide qué pasa al recibir el golpe (p. ej. el parry de Javi)
  let dir = o.dir ? o.dir.clone() : new V3(t.pos.x - att.pos.x, 0, t.pos.z - att.pos.z);
  dir.y = 0; if (dir.lengthSq() < 1e-4) dir = fwd(att.yaw); dir.normalize();
  // Sistema de Choque de Ataques (Attack Clash) estilo anime
  const attAct = att.action, tgtAct = t.action;
  const isClashable = !o.noCounter && !o.guardBreak && !o.fromNet && !att.clashT && !t.clashT;
  if (isClashable && tgtAct && tgtAct.swing && !tgtAct.idle && t.alive && !t.ragdoll && !t.blocking) {
    let tFwd = fwd(t.yaw);
    let toAtt = new V3(att.pos.x - t.pos.x, 0, att.pos.z - t.pos.z);
    toAtt.normalize();
    if (tFwd.dot(toAtt) > 0.35) {
      att.clashT = G.time + 0.45; t.clashT = G.time + 0.45;
      const clashPos = chestOf(att).clone().add(chestOf(t)).multiplyScalar(0.5);
      burst(clashPos, 24, '#ffffff', 10, .14, .45);
      burst(clashPos, 20, '#ffd91a', 12, .2, .55);
      ringAt(clashPos, '#ffd91a', 2.8, .28);
      sparkLines(clashPos, '#ffffff', 10, 2.5);
      impactStar(clashPos, '#ffe853', 2.4, .25);
      comicPop(clashPos, '¡CLASH!', 'burst-cyan', 38, rand(-6, 6));
      sfx('block', clashPos, 1.0);
      sfx('heavy', clashPos, 0.8);
      G.hitstop = Math.max(G.hitstop, 0.12);
      G.shake = Math.max(G.shake, 0.28);
      att.vel.x = -toAtt.x * 5.2; att.vel.z = -toAtt.z * 5.2;
      t.vel.x = toAtt.x * 5.2; t.vel.z = toAtt.z * 5.2;
      att.anim.v.by -= 18; t.anim.v.by -= 18;
      return 'clash';
    }
  }
  const chest = t.choreTrack ? poseChest(t) : chestOf(t), involved = att.isPlayer || t.isPlayer, col = o.color || att.ch.color;
  let kb = o.kb || 0, up = o.up || 0, ragdoll = o.ragdoll || 0, stun = o.stun || 0;
  if (t.blocking) {
    const tf = fwd(t.yaw);
    if (-(tf.x * dir.x + tf.z * dir.z) > .2) {
      if (o.guardBreak) {
        t.blocking = false; if (t.ai) t.ai.blockT = 0;
        t.gbT = G.time; popText(chest, '¡GUARDIA ROTA!', '#ffd54f', 20); sfx('break', t.pos); burst(chest, 16, '#ffd54f', 8, .18, .4);
        impactStar(chest, '#ffd54f', 2.2, .3);
        stun = Math.max(stun, 1.1);
      } else if (G.time - (t.blockT0 == null ? -9 : t.blockT0) <= PERFECT_BLOCK && G.time - (t.blockRelT == null ? -9 : t.blockRelT) > .5) {
        // BLOQUEO PERFECTO: bloquear justo antes del golpe no recibe nada, castiga al que pego y el siguiente golpe basico sera un BLACK FLASH
        t.critT = 4; t.blockHitT = .3; t.vel.x += dir.x * 1.5; t.vel.z += dir.z * 1.5;
        if (att.alive && !att.remote && !att.isBoss && !att.cineLock && !att.grabbed) { if (att.action) endAction(att); att.stun = Math.max(att.stun, .5); }
        popText(chest, 'BLOQUEO PERFECTO', '#7df9ff', 22); sfx('counter', t.pos); impactStar(chest, '#7df9ff', 2, .25); burst(chest, 14, '#7df9ff', 7, .16, .35); ringAt(new V3(t.pos.x, t.pos.y + .1, t.pos.z), '#7df9ff', 2.2, .35);
        if (involved) { G.slowT = Math.max(G.slowT, .15); impactFrame('#7df9ff', .08); }
        return 'blocked';
      } else {
        t.hp -= o.dmg * .12; t.vel.x += dir.x * 3; t.vel.z += dir.z * 3;
        t.ult = Math.min(100, t.ult + o.dmg * .5 * ULT_GAIN); att.ult = Math.min(100, att.ult + o.dmg * .2 * ULT_GAIN);
        t.blockHitT = .3; burst(chest, 6, '#9fd3ff', 5, .12, .25); sfx('block', t.pos); javiSpeak(t, 'ev_block_hit'); impactStar(front(t, .5, 1.2), '#9fd3ff', .9, .15);
        if (involved) popText(chest, 'BLOQUEO', '#9fd3ff', 15);
        if (t.hp <= 0) kill(t, att);
        return 'blocked';
      }
    }
  }
  let dmg = (o.fromNet ? o.dmg : o.dmg * (att.awak > 0 ? 1.15 : 1) * (att.isPlayer || !att.ai ? 1 : att.ai.P.dmg) * (att.ch.dmgMul || 1) * DMG_GLOBAL * (att.isPlayer ? G.rules.dmg : 1)) * adaptMul(t, att) * picoMul(t, att, o) * (att.pisco > 0 ? 1.2 : 1) * (att.tinku > 0 ? 1.2 : 1) * (t.seen > 0 && t.seenBy === att ? 1.3 : 1);
  if (G.rules.god && t.isPlayer) dmg = 0;
  if (att.sebBomb && !t.sebBomb && t !== att && dmg > 0) { t.sebBomb = att.sebBomb; att.sebBomb = null; t.sebBomb.t = Math.max(t.sebBomb.t, 1.8); popText(chestOf(t), '¡CONTAGIO!', '#ffd91a', 22); burst(chestOf(t), 10, '#ffd91a', 6, .18, .4, .2); }
  if (t.sebShield > 0 && dmg > 0) {   // Muro de Risa: absorbe el daño y el empuje
    const ab = Math.min(t.sebShield, dmg); t.sebShield -= ab; t.sebAbs += ab; dmg -= ab; kb = up = ragdoll = stun = 0;
    burst(chestOf(t), 6, '#ffd91a', 5, .12, .3, 0); popText(chestOf(t), 'ABSORBIDO', '#ffd91a', 14); sfx('block', t.pos, .6);
    if (t.sebShield <= 0) sebWallRelease(t);
  }
  t.hp -= dmg;
  if (dmg > 0 && !t.remote) javiSpeak(att, 'hit');
  if (t.ch === CHARS.javi && t.hp > 0 && t.spearOut && !t.spearLost && !t.remote && dmg > 0 && ((o.guardBreak && t.gbT === G.time && Math.random() < .5) || (dmg >= 14 && Math.random() < .35) || ((o.ragdoll || 0) >= 1.4 && dmg >= 9 && Math.random() < .25))) loseSpear(t);
  if(dmg>0){if(t.hp>0)javiSpeak(t,'hurt');if(t.hp>0&&t.hp<t.maxHp*.22)javiSpeak(att,'near');javiSpeak(att,'ev_hit_land');}
  if (att.clippy && t !== att && !o.noAssist && dmg >= .4) clippyAssist(att, t);
  if (att.ch && att.ch.id === 'randi' && t !== att && t.hp > 0 && t.hp < t.maxHp * .22 && G.time - (att.voiceT || -9) > 7) { att.voiceT = G.time; playSnd('randi_voz1', 1.5, att.pos); }   // a punto de matar
  if (att.pisco > 0 && t !== att && dmg >= .4) att.hp = Math.min(att.maxHp, att.hp + dmg * .3);   // el pisco sour cura un poco con cada golpe
  if (att.capRandi && t !== att && dmg >= .4) att.capT = Math.min(45, att.capT + .7);   // cada golpe de Capitán Perú le suma tiempo
  if (dmg >= .5 && t !== att && (att.fireT > 0 || (att.awak > 0 && att.ch.fireSword))) poisonOn(t, att, { dps: att.fireT > 0 ? 2.4 : 1.6, dur: 3.2, col: '#ff7a1a', label: 'ARDE' });   // Espada de Fénix y despertar de ItzUkyo: quema
  att.ult = Math.min(100, att.ult + dmg * 1.1 * ULT_GAIN); t.ult = Math.min(100, t.ult + dmg * .6 * ULT_GAIN);
  if (G.rules.ultHit && att.isPlayer && att.awak <= 0) att.ult = 100;   // regla: la ulti se carga con un solo golpe
  att.lastAtkT = G.time;
  t.flashT = .12; t.lastHurtT = G.time;
  const armored = t.action && t.action.armor;
  // acumulación: muchos golpes seguidos tiran al rival en ragdoll (los golpes chicos de ráfagas y rayos cuentan menos)
  if (!armored && !ragdoll && !t.choreTrack) {
    if (G.time - (t.hitT || -9) > 1.6) t.hitCount = 0;
    t.hitT = G.time; t.hitCount = (t.hitCount || 0) + (o.dmg >= 3 ? 1 : .35);
    if (t.hitCount >= 8) { ragdoll = 1.1; kb = Math.max(kb, 9); up = Math.max(up, 6); popText(chest, '¡RAGDOLL!', '#ffffff', 18); }
  }
  if (ragdoll) t.hitCount = 0;
  // potencia de ragdoll (rag): cuánto lo manda para atrás y para arriba. Sin valor explícito crece con el daño del golpe.
  if (ragdoll) {
    const rg = (o.rag != null ? o.rag : clamp(1 + ((o.dmg || 0) - 10) * .04, 1, 1.6)) * G.rules.rag;
    if (o.kb !== 0) kb = Math.max(kb, 7 * rg); kb *= rg; up = Math.max(up, 4) * Math.min(rg, 1.5);
    ragdoll *= .85 + .15 * rg; t.ragPow = rg;
  }
  if (!armored) {
    if (t.action) endAction(t);
    t.blocking = false; t.dashT = 0; t.dashAnimT = 0;
    t.stun = Math.max(t.stun, stun);
    t.vel.x = dir.x * kb; t.vel.z = dir.z * kb;
    if (up) { t.vel.y = up; t.onGround = false; } else if (!t.onGround) t.vel.y = Math.max(t.vel.y, 1.8);
    if (ragdoll) { startRagdoll(t, ragdoll); t.stun = 0; if (o.noRC) t.rcBlockT = G.time + ragdoll + .5; }   // noRC: golpe de caida que impide el ragdoll cancel
    else {
      // reacción según de dónde viene el golpe: de frente se va para atrás, por la espalda se dobla hacia adelante, de costado se tuerce
      const tf = fwd(t.yaw), fr = tf.x * dir.x + tf.z * dir.z, sd = rightOf(t.yaw).x * dir.x + rightOf(t.yaw).z * dir.z;
      t.hurtT = .24;
      if (fr > .45) { t.hurtPose = 'hurtFwd'; t.anim.v.tx += 7; }
      else if (Math.abs(sd) > .7) { t.hurtPose = sd > 0 ? 'hurtSideL' : 'hurtSideR'; t.anim.v.ty += sd * 8; }
      else { t.hurtPose = t.hurtPose === 'hurtA' ? 'hurtB' : 'hurtA'; t.anim.v.tx -= 7; }
    }
    if (o.freeze) freeze(t, o.freeze);
  }
  const heavy = ragdoll > 0 || o.dmg >= 8, betaVfx = ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
  burst(chest, heavy ? 22 : 9, col, heavy ? 11 : 6, heavy ? .22 : .14, heavy ? .5 : .3, .5);
  burst(chest, heavy ? 10 : 4, '#ffffff', heavy ? 9 : 5, .1, .25, .3);
  ringAt(chest, '#ffffff', heavy ? 2.8 : 1.6, heavy ? .28 : .18, 'face', Math.atan2(dir.x, dir.z));
  if (heavy && t.onGround) animeDustRing(t.pos, 10, 2.0);
  impactStar(chest.clone().addScaledVector(dir, -.3), heavy ? col : '#ffffff', heavy ? 2.4 : 1.2, heavy ? .26 : .16);
  if (heavy) ringAt(chest, col, 2.4, .35, 'face', Math.atan2(dir.x, dir.z));
  sparkLines(chest, col, betaVfx ? (heavy ? 11 : 5) : (heavy ? 9 : 4), betaVfx ? (heavy ? 2.4 : 1.35) : (heavy ? 2.2 : 1.2), scene, betaVfx ? dir : null);
  if (betaVfx && (heavy || o.spearFinish || G.combo === 4)) {
    const side = new V3(-dir.z, rand(-.55, .55), dir.x).normalize().multiplyScalar(heavy ? 1.55 : 1.05);
    slashLine(chest.clone().sub(side), chest.clone().add(side), col, .20, heavy ? .13 : .09);
    slashLine(chest.clone().sub(side), chest.clone().add(side), '#ffffff', .14, .045);
  }
  if (involved && (ragdoll >= 1 || o.dmg >= 11 || o.impact)) impactFrame(col);
  sfx(o.sound || (heavy ? 'heavy' : 'hit'), t.pos);
  if (involved) {
    G.hitstop = Math.max(G.hitstop, o.hitstop != null ? o.hitstop : (heavy ? .08 : .035));
    if (betaVfx && !t.cineLock && G.hitstop > 0) G.hitVictim = t;
    if (heavy && !t.cineLock) camPunch(ragdoll >= 1 ? .6 : .3, Math.random() < .5 ? 1 : -1);
    else if (betaVfx && !t.cineLock && (o.spearFinish || G.combo === 4)) camPunch(.22, Math.random() < .5 ? 1 : -1);
    G.shake = Math.max(G.shake, o.shake || (heavy ? .35 : .12));
    if (heavy) G.fovKick = Math.max(G.fovKick, 4);
    popText(chest, Math.max(1, Math.round(dmg)), t.isPlayer ? '#ff6b6b' : (heavy ? '#d7ff2f' : '#ffffff'), heavy ? 30 : 22);
    // Onomatopeyas de acción estilo cómic / anime
    const charId = (att.ch && att.ch.id) || '';
    if (o.guardBreak) {
      comicPop(chest, '¡CRACK!', 'burst-gold', 34, rand(-12, 12));
    } else if (o.spearFinish || ragdoll >= 1 || o.dmg >= 11 || G.combo === 4) {
      let onom = '¡BAM!', bClass = 'burst-gold';
      if (charId === 'javi' || att.spear) { onom = pick(['¡ESTOCADA!', '¡ZAS!', '¡CLASH!', '¡PUNZÓN!']); bClass = 'burst-cyan'; }
      else if (charId === 'sekza') { onom = pick(['¡GARRASO!', '¡SLASH!', '¡ZAS!', '¡PICADA!']); bClass = 'burst-orange'; }
      else if (charId === 'randi') { onom = pick(['¡PALOMAZO!', '¡DOGOOON!', '¡PUM!', '¡BAM!']); bClass = 'burst-red'; }
      else { onom = pick(['¡BAM!', '¡WHAM!', '¡KRAK!', '¡POW!', '¡BOOM!']); }
      comicPop(chest, onom, bClass, 34, rand(-15, 15));
    } else if (heavy) {
      comicPop(chest, pick(['¡POW!', '¡ZAS!', '¡SMACK!', '¡WHAM!']), 'burst-white', 26, rand(-10, 10));
    } else if (G.combo >= 2 && Math.random() < 0.5) {
      comicPop(chest, pick(['¡TAK!', '¡HIT!', '¡POP!']), 'burst-white', 20, rand(-8, 8));
    }
  }
  if (att.isPlayer) recordPlayerComboHit(dmg);
  if (t.isPlayer) { try { $('dmgv').animate([{ opacity: .8 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' }); } catch (e) { } G.combo = 0; G.comboDmg = 0; G.lastHitDmg = 0; }
  if (t.hp <= 0) kill(t, att);
  return true;
}
// ragdoll flojo: el cuerpo gira según el golpe y los miembros reciben empujones al azar
function startRagdoll(t, dur) {
  if (t.ragdoll <= 0) { t.rdPose = Math.random() < .55 ? 0 : 1; t.rdDir = Math.random() < .8 ? 1 : -1; }
  t.ragdoll = Math.max(t.ragdoll, dur);
  for (const j of ['alx', 'arx', 'alz', 'arz', 'llx', 'lrx', 'llz', 'lrz', 'hx', 'hy', 'tx', 'ty']) t.anim.v[j] += rand(-46, 46);
}
function hitArea(att, c, r, o) {
  let n = 0;
  for (const g of enemiesOf(att)) {
    if (o.set && o.set.has(g)) continue;
    const dx = g.pos.x - c.x, dz = g.pos.z - c.z, dy = g.pos.y + 1 - c.y;
    if (dx * dx + dz * dz < (r + .55 + (g.hitR || 0)) ** 2 && Math.abs(dy) < r + 1.4 + (g.hitH || 0)) { if (applyHit(att, g, o)) { n++; if (o.set) o.set.add(g); } }
  }
  if (o.dmg >= 2.5 || o.dest || o.ragdoll) {
    const atDir = o.dir ? o.dir : (att.yaw != null ? fwd(att.yaw) : null);
    worldDamage(c, Math.max(1.2, r * 1.05), 0.9, o.dmg || 5, o.dest != null ? o.dest : att.destPow, atDir);
  }
  return n;
}
function explode(att, c, r, o) {
  for (const g of enemiesOf(att)) {
    if (chestOf(g).distanceTo(c) < r + .5) applyHit(att, g, Object.assign({}, o, { dir: new V3(g.pos.x - c.x, 0, g.pos.z - c.z) }));
  }
  const col = o.color || att.ch.color, gp = new V3(c.x, Math.max(0, c.y - 1), c.z);
  ringAt(gp, col, r * 1.3, .5); ringAt(gp, '#ffffff', r, .35);
  sphereFlash(c, col, r * .8);
  burst(c, 40, col, 14, .25, .6, .6); burst(c, 18, '#ffffff', 10, .15, .4, .4);
  burst(new V3(c.x, .2, c.z), 20, '#6b5a3e', 9, .25, .8, 1.2, 6);
  sfx('boom', c); shakeFrom(c, .55);
  const gy = groundAt(c.x, c.z);
  if (r >= 3.5 && c.y < gy + 1.8) crackDecal(new V3(c.x, gy, c.z), Math.min(9, r * .85));
  worldDamage(c, r, 1, o.dmg || 8, o.dest != null ? o.dest : att.destPow);
}
function segDist(p, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z, L = abx * abx + abz * abz || 1;
  const t = clamp(((p.x - a.x) * abx + (p.z - a.z) * abz) / L, 0, 1);
  return Math.hypot(a.x + abx * t - p.x, a.z + abz * t - p.z);
}
function freeze(g, dur) { g.frozen = dur; iceBlock(g, dur); }
function kill(v, k) {
  if (!v.alive) return;
  if (v.isBoss) { v.alive = false; v.hp = 0; if (window.CF_ABISMO) CF_ABISMO.bossDown(v, k); return; }
  if (v.capRandi) { capEnd(v); return; }   // Capitán Perú cae y ElRandi con él
  if (k && k !== v && k.ch && (k.ch.id === 'randi' || k.capRandi) && G.time - (k.voiceT || -9) > 3) { k.voiceT = G.time; playSnd('randi_voz2', 1.5, k.pos); }   // mató a alguien
  if (k && k !== v && k.capRandi) k.capT = Math.min(45, k.capT + 10);   // matar le suma tiempo a Capitán Perú
  v.alive = false; v.hp = 0; v.respawnT = v.dummy ? 2 : v.roomBot ? 3 : 4; v.deathT = 0; v.blocking = false; v.frozen = 0; v.grabbed = false;
  endAction(v); v.ragdoll = 3; v.deaths++;
  if (v.isPlayer && typeof SESSION_STATS !== 'undefined') SESSION_STATS.deaths = v.deaths;
  javiSpeak(v,'death');if(k&&k!==v)javiSpeak(k,'kill');
  sfx('ko', v.pos);
  if (v.dummy || v.roomBot) { if (k && k.isPlayer) popText(chestOf(v), 'K.O.', '#d7ff2f', 26); return; }   // dummies y bots de sala: sin bajas ni mensaje de baja
  if (k && k !== v) {
    k.kills++;
    if (k.isPlayer) { statsKill(); if (typeof SESSION_STATS !== 'undefined') SESSION_STATS.kills = k.kills; }
    k.ult = Math.min(100, k.ult + 20 * ULT_GAIN); k.hp = Math.min(k.maxHp, k.hp + 15);
  }
  addFeed(k, v);
  if (G.state === 'play') { if (k && k.isPlayer) G.winPK++; if (v.isPlayer) G.winPD++; }
  if (v.isPlayer) { $('death').classList.remove('hidden'); $('deathby').textContent = k && k !== v ? `Te noqueó ${k.name}` : 'Te noqueaste solo'; G.combo = 0; }
  if (k && k.isPlayer) { showBanner('K.O.', '#d7ff2f', `${v.name} fuera`); G.slowT = .5; G.fovKick = 8; }
  if (v.isPlayer && G.mp) NET.ko = { n: v.deaths, by: k && k.remote ? k.peer : '' };
  if (G.state === 'play' && !G.mp && k && k.kills >= G.goal) later(1.2, () => endMatch(k));
}
function spawnsNow() { return !worldBig() ? SPAWN_POINTS : MAPCUR.id === 'B' ? JAPAN_SPAWNS : MAPCUR.id === 'J' ? JUNGLE_SPAWNS : SPAWN_POINTS; }
// Cambia el mapa activo: lo del otro mapa se oculta (visual y colisiones), el minimapa, el clima y el suelo siguen al nuevo
function setMapNow(id) {
  if (!MAPS[id]) return;
  MAPCUR.id = worldBig() ? id : 'A';
  if (CITY.betaApply) CITY.betaApply(worldBig());
  mmApply(); CULL.dirty = true;
  for (const f of G.fighters) if (f.ai) { f.ai.cityPath = null; f.ai.cityThink = 0; }
}
function respawn(f) {
  f.reset(); f.iframes = 2;
  if (f.abyss && window.CF_ABISMO && CF_ABISMO.locked()) { CF_ABISMO.respawnIn(f); if (f.isPlayer) $('death').classList.add('hidden'); return; }
  if (f.home) { f.pos.copy(f.home); f.onGround = true; f.iframes = .5; burst(chestOf(f), 20, f.ch.color, 6, .2, .6, -.2); return; }
  let best = null, score = -Infinity;
  const SP = spawnsNow();
  for (const p of SP) {
    if (groundAt(p.x,p.z) > .1) continue;
    let distance = 80;
    for (const g of G.fighters) if (g !== f && g.alive && !g.dummy) distance = Math.min(distance, Math.hypot(g.pos.x-p.x,g.pos.z-p.z));
    const value = distance + (p.id !== f.spawnId ? .8 : -3) + Math.random() * .3;
    if (value > score) { score = value; best = p; }
  }
  best = best || SP[0];
  f.spawnId = best.id; f.pos.set(best.x,0,best.z); f.onGround = true;
  f.yaw = best.yaw; f.prevYaw = f.yaw;
  if (f.ai) { f.ai.cityPath=null; f.ai.cityThink=0; }
  burst(new V3(best.x,1,best.z),20,f.ch.color,6,.2,.6,-.2);
  if (f.isPlayer) { $('death').classList.add('hidden'); cam.yaw = f.yaw; }
  javiSpeak(f, 'ev_spawn');
}

// ================= Apuntado =================
const cam = { yaw: 0, pitch: .32, dist: 6.5, focus: new V3(0, 2, 0), fov: 70, shoulder: .85 };
function softLock(f, range, minCos) {
  const F = fwd(cam.yaw); let best = null, bs = 1e9;
  for (const g of enemiesOf(f)) {
    const dx = g.pos.x - f.pos.x, dz = g.pos.z - f.pos.z, d = Math.hypot(dx, dz) || .01;
    if (d > range) continue;
    const c = (dx * F.x + dz * F.z) / d; if (c < minCos) continue;
    const s = d * (2 - c); if (s < bs) { bs = s; best = g; }
  }
  return best;
}
function aimYawFor(f) {
  if (f.isPlayer) { const t = softLock(f, 7, .45); return t ? yawTo(f, t) : cam.yaw; }
  if (!f.ai) return f.yaw;
  return f.ai.target && f.ai.target.alive ? yawTo(f, f.ai.target) : f.yaw;
}
function findTarget(f, range) {
  if (f.isPlayer) return softLock(f, range, .55);
  if (!f.ai) {
    let best = null, bd = range; const F = fwd(f.yaw);
    for (const g of enemiesOf(f)) { const dx = g.pos.x - f.pos.x, dz = g.pos.z - f.pos.z, d = Math.hypot(dx, dz) || .01; if (d < bd && (dx * F.x + dz * F.z) / d > .3) { bd = d; best = g; } }
    return best;
  }
  const t = f.ai.target; return t && t.alive && dist2d(f, t) < range ? t : null;
}

// ================= Movimientos =================
function fistFx(f, col) {
  const p = front(f, 1.3, 1.15 + rand(-.25, .25)), F = fwd(f.yaw);
  for (let i = 0; i < 3; i++) emit(p.x + rand(-.3, .3), p.y + rand(-.2, .2), p.z + rand(-.3, .3), F.x * 6 + rand(-2, 2), rand(-1, 2), F.z * 6 + rand(-2, 2), i ? col : '#ffffff', rand(.12, .22), .18, 0, 3);
}
const M1 = [
  { anim: [[0, 'jabR_w', 800], [.05, 'jabR', 1100]], arc: { tilt: .25, dir: 1 } },
  { anim: [[0, 'jabL_w', 800], [.05, 'jabL', 1100]], arc: { tilt: -.25, dir: -1 } },
  { anim: [[0, 'hook_w', 800], [.06, 'hook', 1100]], arc: { tilt: .08, dir: 1, len: 2.9, r: 1.75, w: .6 } },
];
// giro del arma en la mano (vueltas completas con aceleración suave), puramente visual
function twirlAngle(o, dt) {
  const w = o.twirl; if (!w) return 0;
  w.t += dt; const k = Math.min(1, w.t / w.dur);
  if (k >= 1) { o.twirl = null; return 0; }
  return w.turns * TAU * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
}
const startTwirl = (o, turns, dur) => { if (o.spear) o.twirl = { t: 0, dur, turns }; };
function startFlourish(f) {
  const fl = f.ch.flourish;
  if (ownsMissingSpear(f) || fl.needWeapon && !f.spearOut) return;
  startAction(f, {
    name: 'flourish', soft: true, speedMul: 1, dur: fl.dur, anim: fl.anim, eyes: !!fl.eyes,
    start: () => { if (fl.twirl) startTwirl(f, fl.twirl[0], fl.twirl[1]); },
    steps: fl.magic ? [{ at: fl.magic, fn: () => { const p = front(f, .6, 1.3); burst(p, 14, f.ch.color, 3, .12, .5, -.3); burst(p, 6, '#ffd54f', 2, .08, .4, -.3); } }] : [],
  });
}
function doM1(f, upVariant, slamArg) {
  if (f.action && f.action.soft) endAction(f);
  if (f.m1cd > 0 || f.action || f.mount) return;
  if (f.spear && !f.spearOut && !f.remote && !ownsMissingSpear(f)) { drawSpear(f); return; }
  if (f.comboTimer <= 0) f.comboIdx = 0;
  const i = f.comboIdx, fin = i === 3;
  // Tras tres golpes, el cuarto puede cambiar (como en los battlegrounds de Roblox):
  //   UPPERCUT: con salto sostenido y subiendo (o en el suelo): puño hacia arriba que levanta al rival, y tu subes con el.
  //   DOWNSLAM: en el aire, cayendo (o con C): patada hacia abajo que ignora el bloqueo y clava al rival en el suelo en ragdoll.
  let slam = false;
  if (fin) {
    if (slamArg === undefined) { slam = !f.onGround && (f.vel.y <= 1 || !!f.ctlDown); if (!slam && upVariant && !f.onGround && f.vel.y <= 1) upVariant = false; }
    else slam = !!slamArg;
    if (slam) upVariant = false;
  }
  f.comboIdx = fin ? 0 : i + 1; f.comboTimer = 1.5; f.m1cd = (fin ? 1.0 : .27) * (f.ch.m1speed || 1); f.atkT = 0;   // ritmo del combo; tras el cuarto golpe hay mas recuperacion (un dash la acorta)
  if ((f.isPlayer || f.roomBot) && G.mp) netAct({ k: 'm', i, u: upVariant ? 1 : 0, s: slam ? 1 : 0 }, f);
  sfx('swing', f.pos, .6); javiSpeak(f, 'ev_m1_' + (i + 1));
  const unarmed = ownsMissingSpear(f), set = unarmed ? null : f.ch.m1set;
  const SLAM_DEF = { anim: [[0, 'slamUp', 800], [.07, 'slamDown', 1300]], arc: { tilt: -1.3, r: 1.7, w: .7, len: 2.5, dir: -1 }, reach: 1.0, r: 1.5 };
  const def = slam ? SLAM_DEF : (set && set[fin ? (upVariant ? 4 : 3) : i]) || (fin ? (upVariant ? { anim: [[0, 'upper_w', 800], [.08, 'upper', 1100]], arc: { tilt: 1.57, r: 1.6, len: 2.4 } } : { anim: [[0, 'kick_w', 800], [.08, 'kick', 1100]], arc: { tilt: -.45, r: 1.95, w: .75, len: 2.8, dir: -1 } }) : M1[i]);   // si el personaje no define ese golpe (p. ej. el uppercut), usa el generico
  startAction(f, {
    name: 'm1', unarmed, bbClip: slam ? undefined : fin ? (upVariant ? 'combo_4_arriba' : 'combo_4') : 'combo_'+(i+1), dur: fin ? .4 : .26, aim: true, speedMul: .35, anim: def.anim, spin: def.spin, eyes: !!def.eyeStab,
    tick: (a) => { if (!slam && !f.onGround && !f.remote && f.vel.y < 1.5 && a.t < .3) f.vel.y = Math.max(f.vel.y, -.8); },   // golpe en el aire: cae muy despacio mientras pega
    steps: [{
      at: fin ? .09 : .07, fn: () => {
        const F = fwd(f.yaw), lg = def.lunge || 3; if (f.onGround) { f.vel.x += F.x * lg; f.vel.z += F.z * lg; } else if (!slam && !f.remote) { f.vel.x += F.x * lg * .6; f.vel.z += F.z * lg * .6; }
        if (slam && !f.remote) { f.vel.y = -26; f.vel.x += F.x * 5; f.vel.z += F.z * 5; }   // downslam: se lanza hacia abajo
        if (upVariant && !f.remote) { f.vel.y = Math.max(f.vel.y, 7); f.onGround = false; }   // uppercut: sube junto con el rival
        if (def.stab) stabFx(f, f.ch.color); else if (!def.palm) arcSlash(f, f.ch.color, def.arc);
        if (def.palm) { const p = front(f, 1.3, 1.25); sphereFlash(p, f.ch.color, 1.1, .25); burst(p, 14, f.ch.color, 7, .14, .3, 0); impactStar(p, '#ffd54f', 1.3, .18); }
        if (def.magic) { const p = front(f, 2.0, 1.2); burst(p, 8, f.ch.color, 4, .12, .3, -.2); burst(p, 4, '#ffd54f', 3, .08, .25, -.2); }
        if (def.eyeStab) { const a = front(f, .35, 1.72), b = front(f, 3.4, 1.4); slashLine(a, b, f.ch.color, .2, .16); slashLine(a, b, '#ffffff', .14, .06); sfx('zap', f.pos, .5); }
        if (def.twirl) startTwirl(f, 1, .32);
        if (!unarmed && bbSet(f.ch.id)) javiStrikeFx(f, fin, i);
        let o = slam ? { dmg: 6.5, kb: 1.5, up: -22, ragdoll: .9, stun: 0, guardBreak: true, noRC: true, color: f.ch.color, hitstop: .1, shake: .35, sound: 'heavy' }
          : fin
          ? { dmg: 6, kb: upVariant ? 2 : 17, up: upVariant ? 15 : 6, ragdoll: upVariant ? 0 : 1.0, stun: upVariant ? .9 : 0 }
          : { dmg: 3.5, stun: .45, kb: 1.4 };
        const bf = f.critT > 0;   // tras un bloqueo perfecto, el siguiente golpe basico que conecta es un BLACK FLASH: mas dano, rompe la guardia y tira al rival
        if (bf) o = Object.assign({}, o, { dmg: o.dmg * 2.4, guardBreak: true, ragdoll: Math.max(o.ragdoll || 0, 1.0), kb: Math.max(o.kb || 0, 13), up: Math.max(o.up || 0, 6), stun: 0, hitstop: .16, shake: .7, color: '#ff2a2a', sound: 'heavy' });
        const n = hitArea(f, front(f, def.reach || 1.25, slam ? .3 : 1.1), def.r || 1.25, o);
        if (slam && n) { const gp0 = new V3(f.pos.x + F.x * 1.2, groundAt(f.pos.x + F.x * 1.2, f.pos.z + F.z * 1.2), f.pos.z + F.z * 1.2); ringAt(gp0, '#ffffff', 3.2, .4); burst(new V3(gp0.x, gp0.y + .3, gp0.z), 18, '#d8d0c0', 7, .2, .5, .3); popText(chestOf(f), 'DOWNSLAM', f.ch.color, 20); sfx('boom', gp0, .5); }
        if (fin && !n) f.m1cd += .3;   // fallar el cuarto golpe se paga con mas recuperacion
        if (bf && n) { f.critT = 0; blackFlashFx(f, front(f, def.reach || 1.25, 1.2)); }
        if (fin) worldDamage(front(f, 1.8, 1.1), 3.1, 1, 6, .9);
        f.destPow = .5;
        if (n && !f.onGround) f.vel.y = Math.max(f.vel.y, 2.4);
        if (!f.spear || unarmed) fistFx(f, f.ch.color);
      }
    }],
  });
}
// Efectos anime de Javi: imágenes residuales en los golpes, polvo en cada pisada y estela al esquivar.
function javiStrikeFx(f, fin, i) {
  const col = f.ch.color, F = fwd(f.yaw), c = chestOf(f);
  ghost(f, col, fin ? .5 : .32, fin ? .28 : .17);
  for (let k = 0; k < (fin ? 7 : 3); k++) {
    const a = rand(-.5, .5), d = fwd(f.yaw + a), y = rand(.4, 1.6);
    slashLine(new V3(f.pos.x - F.x * .4 + d.x * .6, f.pos.y + y, f.pos.z - F.z * .4 + d.z * .6), new V3(f.pos.x + d.x * (2.2 + rand(0, 1.2)), f.pos.y + y + rand(-.2, .2), f.pos.z + d.z * (2.2 + rand(0, 1.2))), k % 2 ? '#ffffff' : col, .16, .035);
  }
  if (fin) { impactStar(front(f, 1.7, 1.1), '#ffffff', 1.8, .22); G.linesI = Math.max(G.linesI, .5); }
}
function javiMotionFx(f, dt, sp) {
  if (f.onGround && sp > 5 && !f.action && f.ragdoll <= 0) {
    const ph = Math.floor(f.walk / Math.PI);
    if (f.stepPh !== ph) { f.stepPh = ph; const B = fwd(f.yaw), p = new V3(f.pos.x - B.x * .3, f.pos.y + .08, f.pos.z - B.z * .3); burst(p, 4, '#d8d0c0', 2.4, .13, .35, .25, .8); }
  }
  f.catchT -= dt; f.blockHitT -= dt;
}
function stabFx(f, col) {
  f.model.root.updateMatrixWorld(true);
  const a = f.spear && f.spearOut ? f.spear.localToWorld(new V3(0, 0, 7 * PX)) : front(f, .7, 1.2);
  const b = f.spear && f.spearOut ? anchorPoint(f, 'tip') : front(f, 3.0, 1.2);
  slashLine(a, b, col, .18, .14); slashLine(a, b, '#ffffff', .12, .06);
  ringAt(b, col, .9, .2, 'face', f.yaw);
}
function drawSpear(f) {
  if (ownsMissingSpear(f)) { missingSpearHint(f); return; }
  f.atkT = 0;
  startAction(f, { name: 'draw', dur: .34, speedMul: .8, anim: [[0, 'reach', 1100], [.13, 'twirlPose', 900], [.26, 'thrust_w', 700]], steps: [{ at: .11, fn: () => { setSpear(f, true); startTwirl(f, 1, .3); sfx('draw', f.pos); arcSlash(f, f.ch.color, { tilt: -1.3, r: 1.7, len: 2.6, dir: -1, dur: .25 }); } }] });
}
function prepWeapon(f) {
  if (ownsMissingSpear(f)) return;
  if (f.action && f.action.soft) endAction(f);
  f.atkT = 0;
  if (f.spear && !f.spearOut && !f.remote) { setSpear(f, true); f.anim.v.arx -= 20; sfx('draw', f.pos); arcSlash(f, f.ch.color, { tilt: -1.2, r: 1.6, len: 2.2, dir: -1, dur: .2 }); }
}
function spawnSpearProj(f, o) {
  const F = fwd(f.yaw), mesh = buildSpear(1.25);
  const p = { owner: f, pos: front(f, .8, 1.35), vel: F.multiplyScalar(38), speed: 38, life: 24 / 38, age: 0, o, mesh, size: .5, loyal: true, phase: 'out', spearId: spearActorId(f)+':'+(++JAVI_SPEARS.sequence), finisherEligible: f.ch===CHARS.javi && f.awak<=0 && !f.remote, set: new Set() };
  mesh.position.copy(p.pos); scene.add(mesh); PROJ.push(p);
}
// ===== Coreografías cinemáticas (agarres estilo TSB) =====
// Cada coreografía describe, con pocas claves unidas por curvas Hermite:
//  att/vic: poses del atacante y del que recibe · apos/vpos: [t, x, y, z, giro] en el marco del atacante
//  (x derecha, y arriba, z adelante; 'c' al final = corte instantáneo) · ev: golpes, efectos, cámara lenta
//  shots: [t, tipo de plano, opciones] para el director de cámara.
const L2W = (o, yaw, x, y, z) => { const F = fwd(yaw), R = rightOf(yaw); return new V3(o.x + R.x * x + F.x * z, o.y + y, o.z + R.z * x + F.z * z); };
function hermArr(keys, t) {
  const n = keys.length, get = k => [k[1], k[2], k[3], k[4] || 0];
  if (t <= keys[0][0]) return get(keys[0]); if (t >= keys[n - 1][0]) return get(keys[n - 1]);
  let i = 0; while (i < n - 2 && t >= keys[i + 1][0]) i++;
  const k1 = keys[i], k2 = keys[i + 1];
  if (k2[5] === 'c') return get(k1);
  if (k2[5] === 'i' || k2[5] === 'o') {
    // anime: sale disparado y frena al llegar (ease-out), en vez de moverse a velocidad constante
    const u = (t - k1[0]) / (k2[0] - k1[0]), w = k2[5] === 'i' ? u * u * u : 1 - Math.pow(1 - u, 3), a1 = get(k1), a2 = get(k2);  // 'i' = cae acelerando, 'o' = frena al llegar
    return a1.map((v, j) => v + (a2[j] - v) * w);
  }
  const k0 = i > 0 && k1[5] !== 'c' ? keys[i - 1] : k1, k3 = i + 2 < n && keys[i + 2][5] !== 'c' ? keys[i + 2] : k2;
  const h = k2[0] - k1[0], s = (t - k1[0]) / h, s2 = s * s, s3 = s2 * s;
  const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  const a0 = get(k0), a1 = get(k1), a2 = get(k2), a3 = get(k3);
  return a1.map((v, j) => {
    const m1 = k0 === k1 ? 0 : cineSlope(k0[0], k1[0], k2[0], a0[j], a1[j], a2[j]) * h;
    const m2 = k3 === k2 ? 0 : cineSlope(k1[0], k2[0], k3[0], a1[j], a2[j], a3[j]) * h;
    return h00 * v + h10 * m1 + h01 * a2[j] + h11 * m2;
  });
}
function choreBegin(f, tg, D) {
  const st = { f, tg, D, t: 0, origin: new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z), yaw: f.yaw, fired: new Set(), released: false, done: false, shot: -1 };
  st.vpos = D.vpos;
  if (D.pull) {
    const dx = tg.pos.x - f.pos.x, dz = tg.pos.z - f.pos.z, F = fwd(f.yaw), R = rightOf(f.yaw);
    st.vpos = [[0, dx * R.x + dz * R.z, tg.pos.y - st.origin.y, dx * F.x + dz * F.z, 0]].concat(D.vpos.filter(k => k[0] > 0));
  }
  st.apos = D.apos || [[0, 0, 0, 0, 0]];
  if (f.spear && !f.spearOut) setSpear(f, true);
  f.choreGripQuat = null;
  if (D.stake && f.spear) { st.spearScale = f.spear.scale.z; f.choreStake = true; f.spear.scale.z = D.stake.scale; }
  f.choreTrack = D.bbPreview ? javiBBTrack(D.bbPreview, D.bbKey || 'javi') : D.attClip ? javiBBTrack(D.attClip, f.ch.id) : buildCineTrack(D.att, Object.assign({}, f.anim.x), D.ev); f.choreTime = 0; f.choreEyes = false;
  f.choreFrom = D.attClip ? Object.assign({}, f.anim.x) : null;
  // D.attClipEnd / D.vicClipEnd: el clip de BBS solo cubre el principio de la escena; desde ese segundo siguen las poses de D.att / D.vic
  f.choreTrack2 = D.attClip && D.attClipEnd ? buildCineTrack(D.att, Object.assign({}, f.anim.x), D.ev) : null; f.choreSwapT = f.choreTrack2 ? D.attClipEnd : null;
  f.iframes = Math.max(f.iframes, D.dur + .3);
  if (tg.remote) { if (tg.action) endAction(tg); tg.sceneLock = st; tg.choreTrack = D.vicClip ? javiBBTrack(D.vicClip, f.ch.id) : buildCineTrack(D.vic, Object.assign({}, tg.anim.x), D.ev); tg.choreTime = 0; tg.choreFrom = D.vicClip ? Object.assign({}, tg.anim.x) : null; tg.choreTrack2 = D.vicClip && D.vicClipEnd ? buildCineTrack(D.vic, Object.assign({}, tg.anim.x), D.ev) : null; tg.choreSwapT = tg.choreTrack2 ? D.vicClipEnd : null; }
  if (!tg.remote) { endAction(tg); tg.blocking = false; tg.cineLock = f; tg.grabbed = true; tg.stun = 9; tg.choreTrack = D.vicClip ? javiBBTrack(D.vicClip, f.ch.id) : buildCineTrack(D.vic, Object.assign({}, tg.anim.x), D.ev); tg.choreTime = 0; tg.choreFrom = D.vicClip ? Object.assign({}, tg.anim.x) : null; tg.choreTrack2 = D.vicClip && D.vicClipEnd ? buildCineTrack(D.vic, Object.assign({}, tg.anim.x), D.ev) : null; tg.choreSwapT = tg.choreTrack2 ? D.vicClipEnd : null; }
  if (f.isPlayer || tg.isPlayer) G.chore = st;
  if (D.trails && f.spear) cineRibbon(st);
  // D.props = [st => ({ tick(t, dt, st), on(nombre, e, st), dispose() })]: objetos 3D propios de la escena (un avion, nubes...). Se crean aqui y se quitan en choreEnd.
  st.props = []; for (const mk of D.props || []) { try { const p = mk(st); if (p) st.props.push(p); } catch (e) { console.warn('chore prop', e); } }
  IMPACT.cd = 0; impactFrame(f.ch.color, .07); sfx('grab', f.pos); sfx('counter', f.pos, .5);
  return st;
}
function choreRelease(st) {
  if (st.released) return; st.released = true;
  const tg = st.tg; tg.choreTrack2 = null; tg.choreSwapT = null;
  if (tg.remote) { tg.sceneLock = null; tg.choreTrack = null; } else { tg.cineLock = null; tg.grabbed = false; tg.choreTrack = null; tg.stun = 0; }
}
function choreEnd(st) {
  for (const p of st.props || []) { try { if (p.dispose) p.dispose(); } catch (e) { } } st.props = [];
  choreRelease(st); st.f.choreTrack = null; st.f.choreTrack2 = null; st.f.choreSwapT = null; st.f.choreEyes = false;
  st.f.choreGripQuat = null; st.f.choreStake = false;
  if (st.spearScale != null && st.f.spear) st.f.spear.scale.z = st.spearScale;
  if (st.f.model.gripRot) st.f.model.gripRot.rotation.set(st.f.anim.x.sx, st.f.anim.x.sy || 0, st.f.anim.x.sz || 0);
  if (!st.tg.remote && st.tg.alive) st.tg.stun = Math.min(st.tg.stun, .3);
  if (G.chore === st) { G.chore = null; document.body.classList.remove('duel'); }
}
function syncChorePose(f, dt, st, victim = false) {
  if (!f.choreTrack) return;
  f.choreGripQuat = null;
  const clipOn = f.choreSwapT == null || f.choreTime < f.choreSwapT;   // mientras dura el clip de BBS (despues, poses)
  f.anim.bbR6=!!(st && (st.D.bbPreview || (clipOn && (victim ? st.D.vicClip && st.D.vicR6 : st.D.attClip))));
  const previous = st && st.D.r6 ? Object.assign({},f.anim.x) : null;
  f.anim.play(clipOn ? f.choreTrack : f.choreTrack2, f.choreTime, dt, true); f.choreFrame = G.time;
  if (previous) {
    r6Acting(f, st, victim);
    for(const joint of JOINTS) f.anim.v[joint]=dt>0 ? (f.anim.x[joint]-previous[joint])/dt*.5 : 0;
    f.anim.apply();
    // Inclinarse al correr no equivale a tumbarse: conservamos la altura de la
    // cadera del atacante y dejamos la compresión de suelo solo para la víctima.
    if (!victim) f.model.inner.position.y=(16+f.anim.x.by)*PX;
  }
  if (f.choreFrom && f.choreTime < .14) { const u = clamp(f.choreTime / .14, 0, 1), w = u * u * (3 - 2 * u); for (const j of JOINTS) f.anim.x[j] = jv(f.choreFrom, j) + (f.anim.x[j] - jv(f.choreFrom, j)) * w; f.anim.apply(); }
  if (f.model.gripRot) { f.twA = twirlAngle(f, dt); f.model.gripRot.rotation.set(f.anim.x.sx + f.twA, f.anim.x.sy || 0, f.anim.x.sz || 0); }
  f.model.root.position.copy(f.pos); f.model.root.rotation.y = f.yaw;
  f.model.root.updateMatrixWorld(true);
}
// Una cinta por escena, geometría reutilizada y un historial de 120 ms.
function cineRibbon(st) {
  const count = 20, vertices = new Float32Array(count * 6), colors = new Float32Array(count * 6);
  const geo = new THREE.BufferGeometry(), col = new THREE.Color(st.f.ch.color), indices = [];
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < count - 1; i++) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  geo.setIndex(indices); geo.setDrawRange(0, 0);
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.Mesh(geo, mat), history = []; mesh.frustumCulled = false;
  let lastT = -1;
  addFx(mesh, st.D.dur + .3, () => {
    const t = st.t, active = !st.done && st.f.choreTrack && st.D.trails.some(w => t >= w[0] && t <= w[1]);
    if (!active) { history.length = 0; geo.setDrawRange(0, 0); return; }
    if (t <= lastT) return; lastT = t;
    const tip = anchorPoint(st.f, 'tip'), base = st.f.spear.localToWorld(new V3(0, 0, 9 * PX));
    if (history.length && tip.distanceTo(history[history.length - 1].tip) > 4.5) history.length = 0;
    history.push({ t, tip, base });
    while (history.length > count || (history.length && t - history[0].t > .12)) history.shift();
    history.forEach((p, i) => {
      vertices.set(p.base.toArray(), i * 6); vertices.set(p.tip.toArray(), i * 6 + 3);
      const fade = Math.max(0, 1 - (t - p.t) / .12);
      colors.set([col.r * fade * .45, col.g * fade * .45, col.b * fade * .45, fade, fade, fade], i * 6);
    });
    geo.attributes.position.needsUpdate = geo.attributes.color.needsUpdate = true;
    geo.setDrawRange(0, Math.max(0, history.length - 1) * 6);
  });
}
// Cinemática R6: cada miembro sigue siendo una sola pieza. Se orienta hacia su
// contacto y solo admite una extensión o desplazamiento pequeño del hombro.
function solveR6Contact(f, partName, target, weight = 1) {
  const part = f.model[partName], parent = part.parent;
  const arm = partName.startsWith('arm'), length = (arm ? 10 : 12) * PX;
  const goal = parent.worldToLocal(target.clone()), delta = goal.clone().sub(part.position);
  const reach = length * 1.16, shift = Math.max(0, delta.length() - reach);
  if (shift > 0) part.position.addScaledVector(delta.clone().normalize(), Math.min(arm ? .12 : .07, shift) * weight);
  delta.copy(goal).sub(part.position);
  if (delta.lengthSq() < 1e-8) return;
  const q = new THREE.Quaternion().setFromUnitVectors(new V3(0,-1,0), delta.clone().normalize());
  part.quaternion.slerp(q, weight);
  const stretch = clamp(delta.length() / length, arm ? .9 : .86, 1.16);
  part.scale.set(1, part.scale.y + (stretch - part.scale.y) * weight, 1);
  part.updateWorldMatrix(false, true);
}
function r6FacingAt(st, t) {
  const A = st.D.anime, finish = st.yaw + A.groundYaw;
  const smooth = u => { u = clamp(u,0,1); return u*u*(3-2*u); };
  const turn = (a,b,u) => a + wrapA(b-a)*smooth(u);
  const heading = at => {
    const a = hermArr(st.apos, at-.012), b = hermArr(st.apos, at+.012);
    const delta = L2W(new V3(), st.yaw, b[0]-a[0],0,b[2]-a[2]);
    return delta.lengthSq() > 1e-7 ? st.yaw + wrapA(Math.atan2(delta.x,delta.z)-st.yaw) : finish;
  };
  const a = hermArr(st.apos,.5), v = hermArr(st.vpos,.7);
  const throwDir = L2W(new V3(),st.yaw,v[0]-a[0],0,v[2]-a[2]);
  const look = st.yaw + wrapA(Math.atan2(throwDir.x,throwDir.z)-st.yaw);
  const pivot = A.pin-.29;
  if(t<.27)return st.yaw;
  if(t<.6)return turn(st.yaw,look,(t-.27)/.33);
  if(t<.79)return turn(look,heading(.83),(t-.6)/.19);
  if(t<pivot)return heading(t);
  if(t<A.pin)return turn(heading(pivot),finish,(t-pivot)/(A.pin-pivot));
  return finish;
}
function r6RootAt(st, t) {
  const p = hermArr(st.apos, t);
  return { pos: L2W(st.origin, st.yaw, p[0],p[1],p[2]), yaw: st.D.anime ? r6FacingAt(st,t) : st.yaw+p[3] };
}
function r6GaitPath(st) {
  if (st.gaitPath) return st.gaitPath;
  const [start,end] = st.D.anime.run, samples = []; let distance = 0, previous = null;
  for (let i=0;i<=120;i++) {
    const t=start+(end-start)*i/120, p=hermArr(st.apos,t);
    const pos=L2W(st.origin,st.yaw,p[0],0,p[2]);
    if(previous) distance+=pos.distanceTo(previous); samples.push({t,distance,pos}); previous=pos;
  }
  return (st.gaitPath=samples);
}
function r6TravelAt(st,t) {
  const path=r6GaitPath(st), A=st.D.anime, u=clamp((t-A.run[0])/(A.run[1]-A.run[0]),0,1)*(path.length-1);
  const i=Math.min(path.length-2,Math.floor(u)); return path[i].distance+(path[i+1].distance-path[i].distance)*(u-i);
}
function r6PlantAt(st,distance) {
  const path=r6GaitPath(st); let i=0;
  while(i<path.length-2 && path[i+1].distance<distance)i++;
  const a=path[i],b=path[i+1],u=clamp((distance-a.distance)/Math.max(.00001,b.distance-a.distance),0,1);
  return r6RootAt(st,a.t+(b.t-a.t)*u);
}
function r6Stride(st) { return clamp(2.8/st.D.anime.cycles,1.4,1.8); }
function r6Acting(f, st, victim) {
  const A = st.D.anime; if (!A || !f.choreTrack) return;
  const t = st.t, x = f.anim.x;
  // Deformación acotada: como máximo 1.5 píxeles por parte y escalas discretas.
  for (const prefix of Object.values(CINE_PARTS)) for (const axis of ['px','py','pz']) x[prefix+axis] = clamp(x[prefix+axis], -1.5, 1.5);
  for (const key of ['als','ars','lls','lrs']) x[key] = clamp(x[key], .96, 1.08);
  for (const key of ['tscx','tscy','tscz','hscx','hscy','hscz']) x[key] = clamp(x[key], .96, 1.04);
  if (!victim) {
    const [a,b] = A.run, w = contactWeight(t,a,b,.09,.1);
    if (w) {
      const phase = r6TravelAt(st,t) / r6Stride(st) * TAU, s = Math.sin(phase), c = Math.cos(phase);
      x.llx += (s*.95-x.llx)*w; x.lrx += (-s*.95-x.lrx)*w;
      x.alx += (.45-c*.65-x.alx)*w; x.arx += (-.6+c*.3-x.arx)*w;
      x.ty += s*.065*w; x.hy -= s*.045*w; x.by -= Math.abs(c)*.35*w;
      const before=r6RootAt(st,t-.015).pos, after=r6RootAt(st,t+.015).pos;
      const speed=before.distanceTo(after)/.03;
      x.ix += clamp(speed*.012,.02,.1)*w; x.hx -= .055*w;
    }
    const settle = Math.max(0,t-A.pin);
    if (settle < .32 && t >= A.pin) { const p = Math.sin(settle*24)*Math.exp(-settle*11); x.by -= p*.45; x.tx += p*.025; }
    // Tensión concentrada antes del golpe; el descenso dura entre 45 y 70 ms.
    const u = clamp((t-A.charge[0]) / Math.max(.1,A.charge[1]-A.charge[0]),0,1);
    if (t>=A.charge[0] && t<A.strike) { x.tx += Math.sin(t*9)*.012*u; x.hx += Math.sin(t*7+.8)*.009*u; x.by += Math.sin(t*6)*.12; }
    const hitAge=t-A.strike;
    if(hitAge>=0 && hitAge<.34) { const p=Math.sin(hitAge*29)*Math.exp(-hitAge*13); x.tx+=p*.035; x.by-=p*.5; }
  } else {
    const landAge=t-.98;
    if(landAge>=0 && landAge<.55) { const p=Math.sin(landAge*23)*Math.exp(-landAge*9); x.hx-=p*.055; x.alx+=p*.1; x.arx-=p*.08; x.llx-=p*.08; }
    if(t>A.pin && t<A.strike) { const w=Math.sin(Math.min(1,(t-A.pin)/.2)*Math.PI/2); x.hx+=Math.sin((t-A.pin)*7)*.025*w; x.alx+=Math.sin(t*6)*.04*w; x.arx-=Math.sin(t*6+.7)*.035*w; }
  }
  f.anim.apply();
}
function r6RunningFeet(st, t) {
  const A=st.D.anime, [start,end]=A.run, w=contactWeight(t,start,end,.09,.1); if(!w)return;
  const stride=r6Stride(st), travel=r6TravelAt(st,t);
  for(const [name,offset,side] of [['legL',0,-1],['legR',.5,1]]) {
    const phase=travel/stride+offset, cycle=Math.floor(phase), u=phase-cycle;
    const distance=(cycle-offset)*stride;
    const root=r6PlantAt(st,distance), next=r6PlantAt(st,distance+stride);
    const plant=root.pos.clone().addScaledVector(rightOf(root.yaw),side*.13).addScaledVector(fwd(root.yaw),.33);
    const dest=next.pos.clone().addScaledVector(rightOf(next.yaw),side*.13).addScaledVector(fwd(next.yaw),.33);
    const swing=clamp((u-.43)/.57,0,1), ease=swing*swing*(3-2*swing);
    const target=plant.lerp(dest,ease);
    target.y=groundAt(target.x,target.z)+.055+Math.sin(swing*Math.PI)*.065;
    solveR6Contact(st.f,name,target,w);
  }
}
function r6Stake(st, t, weight) {
  const {f,tg,D}=st, A=D.anime, grip=f.model.gripRot, arm=f.model.armR;
  const head=tg.model.head.localToWorld(new V3(0,4*PX,3*PX));
  const clearance=hermArr(D.stake.clearance,t)[1];
  const tension=contactWeight(t,A.charge[0],A.charge[1],.15,.035);
  const target=head.clone().add(new V3(Math.sin(t*67)*.006*tension,clearance+Math.sin(t*79)*.008*tension,Math.sin(t*61+.7)*.004*tension));
  const direction=new V3(...D.stake.vector).applyAxisAngle(new V3(0,1,0),st.yaw+(A.groundYaw||0)).normalize();
  const basePos=arm.position.clone();
  let goal=target.clone().addScaledVector(direction,-26*PX*f.spear.scale.z);
  for(let i=0;i<3;i++) {
    arm.position.copy(basePos); solveR6Contact(f,'armR',goal,weight);
    const origin=grip.getWorldPosition(new V3()), parent=grip.parent;
    const local=parent.worldToLocal(origin.clone().add(direction)).sub(parent.worldToLocal(origin.clone())).normalize();
    grip.quaternion.setFromUnitVectors(new V3(0,0,1),local); grip.scale.z=1;
    f.model.root.updateMatrixWorld(true);
    const tip=f.spear.localToWorld(new V3(0,0,26*PX)); goal.add(target.clone().sub(tip));
  }
  const otherHand=f.spear.localToWorld(new V3(0,0,-3*PX));
  solveR6Contact(f,'armL',otherHand,weight);
  if(!f.choreGripQuat)f.choreGripQuat=new THREE.Quaternion();
  f.choreGripQuat.copy(grip.quaternion); f.model.root.updateMatrixWorld(true);
}

function contactWeight(t, start, end, enter = .12, exit = .12) {
  if (t < start || t > end) return 0;
  const a = clamp((t - start) / enter, 0, 1), b = clamp((end - t) / exit, 0, 1);
  return a * a * (3 - 2 * a) * b * b * (3 - 2 * b);
}
function poseChest(f) {
  f.model.root.updateMatrixWorld(true);
  return f.model.torso.localToWorld(new V3(0, 6 * PX, 0));
}
function moveContactPart(part, source, target, weight, limit = .8) {
  const parent = part.parent;
  const delta = parent.worldToLocal(target.clone()).sub(parent.worldToLocal(source.clone()));
  if (delta.length() > limit) delta.setLength(limit);
  part.position.addScaledVector(delta, weight);
  part.updateWorldMatrix(false, true);
}
function choreContacts(st, t) {
  const { f, tg, D } = st;
  if (D.r6) {
    r6RunningFeet(st, t);
    const A = D.anime, support = contactWeight(t, A.pin - .08, A.release, .16, .2);
    if (support) { const root = r6RootAt(st, A.pin), target = root.pos.addScaledVector(rightOf(root.yaw), -.14).addScaledVector(fwd(root.yaw), -.2); target.y = groundAt(target.x,target.z)+.015; solveR6Contact(f,'legL',target,support); }
  }
  for (const b of D.bindings || []) {
    const w = contactWeight(t, b.start, b.end, b.enter, b.exit); if (!w) continue;
    const part = f.model[b.part], target = tg.model[b.target].localToWorld(new V3(...b.to).multiplyScalar(PX));
    const source = part.localToWorld(new V3(...b.from).multiplyScalar(PX));
    if (D.r6) solveR6Contact(f, b.part, target, w);
    else moveContactPart(part, source, target, w, b.limit || .8);
  }
  const stake = D.stake; if (!stake || !f.spear) return;
  const w = contactWeight(t, stake.start, stake.end, .18, .18); if (!w) return;
  if (D.r6) { r6Stake(st, t, w); return; }
  const grip = f.model.gripRot, base = grip.getWorldPosition(new V3());
  const down = grip.parent.worldToLocal(base.clone().add(new V3(0, -1, 0))).sub(grip.parent.worldToLocal(base.clone())).normalize();
  grip.quaternion.slerp(new THREE.Quaternion().setFromUnitVectors(new V3(0, 0, 1), down), w);
  grip.scale.z = 1; f.model.root.updateMatrixWorld(true);
  const target = tg.model.head.localToWorld(new V3(0, 4 * PX, 3 * PX));
  target.y += hermArr(stake.clearance, t)[1];
  const tip = f.spear.localToWorld(new V3(0, 0, 26 * PX));
  moveContactPart(f.model.armR, tip, target, w, 1.25);
  if (!f.choreGripQuat) f.choreGripQuat = new THREE.Quaternion();
  f.choreGripQuat.copy(grip.quaternion);
  f.model.root.updateMatrixWorld(true);
}
function choreTick(st, dt) {
  const { f, tg, D } = st; st.t += dt; const t = st.t;
  if (!f.alive) { st.done = true; return; }
  const ap = hermArr(st.apos, t), root = D.r6 ? r6RootAt(st,t) : null;
  f.prevYaw = f.yaw;
  f.pos.copy(root ? root.pos : L2W(st.origin, st.yaw, ap[0], ap[1], ap[2]));
  f.yaw = root ? root.yaw : st.yaw + ap[3]; f.yawVel = dt>0 ? wrapA(f.yaw-f.prevYaw)/dt : 0;
  f.vel.set(0, 0, 0); f.choreTime = D.bbPreview && bbSet(D.bbKey || 'javi')[D.bbPreview].loop ? t % bbSet(D.bbKey || 'javi')[D.bbPreview].length : t;
  if (D.stake && f.spear) {
    const u = clamp((t - D.stake.end) / Math.max(.1, D.dur - D.stake.end), 0, 1);
    f.spear.scale.z = D.stake.scale + (st.spearScale - D.stake.scale) * u * u * (3 - 2 * u);
  }
  syncChorePose(f, dt, st);
  for (const p of st.props || []) { try { if (p.tick) p.tick(t, dt, st); } catch (e) { } }
  if (!st.released && tg.alive) {
    const vp = hermArr(st.vpos, t);
    tg.pos.copy(L2W(st.origin, st.yaw, vp[0], vp[1], vp[2])); tg.yaw = st.yaw + Math.PI + vp[3]; tg.vel.set(0, 0, 0); tg.choreTime = t; tg.stun = Math.max(tg.stun, .5);
    syncChorePose(tg, dt, st, true);
    choreAnchor(st, t); choreLock(st, t);
    tg.model.root.position.copy(tg.pos); tg.model.root.updateMatrixWorld(true);
    choreContacts(st, t); choreHolds(st, t);
  }
  D.ev.forEach((e, i) => { if (!st.fired.has(i) && t >= e.t) { st.fired.add(i); choreEvent(st, e); } });
  if (t >= D.dur) st.done = true;
}
// anclaje: durante [t0, t1] el pecho de la víctima queda pegado a la punta de la lanza ('tip') o a la mano ('hand'),
// así la lanza la atraviesa de verdad y el agarre toca el cuello, sin importar la pose
function anchorPoint(f, kind) {
  f.model.root.updateMatrixWorld(true);
  if (kind === 'tip' && f.spear) return f.spear.localToWorld(new V3(0, 0, (f.choreStake ? 26 : 20) * PX));
  return f.model.armR.localToWorld(new V3(0, -11 * PX, 0));
}
function choreAnchor(st, t) {
  const { f, tg, D } = st; if (!D.anchor) return;
  for (const [t0, t1, kind, dy, fadeOut] of D.anchor) {
    if (t < t0 || t > t1) continue;
    const w0 = clamp((t - t0) / .12, 0, 1), exit = fadeOut ? clamp((t1 - t) / fadeOut, 0, 1) : 1;
    const w = w0 * w0 * (3 - 2 * w0) * exit * exit * (3 - 2 * exit);
    tg.model.root.updateMatrixWorld(true);
    const off = tg.model.torso.localToWorld(new V3(0, (kind === 'hand' ? 11 : 6) * PX, 0)).sub(tg.model.root.position);
    const goal = anchorPoint(f, kind).sub(off); goal.y += dy || 0;
    tg.pos.lerp(goal, w); tg.pos.y = Math.max(groundAt(tg.pos.x, tg.pos.z), tg.pos.y);
  }
}
// bloqueo cuerpo a cuerpo con la lanza: durante [t0, t1] el torso de la víctima queda a `d` de la PUNTA de la lanza, medido a lo largo
// del eje de la lanza (d>0 = más allá de la punta), con `side` de desvío lateral. Así, si Javi empuja, la víctima retrocede arrastrada
// por la lanza, y si la gira, la víctima gira con ella (la reacción sale de la lanza, no de dos recorridos pegados por separado).
// {t0,t1,d,side,fade,y}: y=true también sigue la altura.
function choreLock(st, t) {
  const { f, tg, D } = st; if (!D.lock || !f.spear || !f.spearOut) return;
  for (const L of D.lock) {
    if (t < L.t0 || t > L.t1) continue;
    const fade = L.fade || .15, a = clamp((t - L.t0) / fade, 0, 1), b = clamp((L.t1 - t) / fade, 0, 1), w = a * a * (3 - 2 * a) * b * b * (3 - 2 * b);
    f.model.root.updateMatrixWorld(true); tg.model.root.updateMatrixWorld(true);
    const tip = f.spear.localToWorld(new V3(0, 0, 26 * PX)), tail = f.spear.localToWorld(new V3(0, 0, -11 * PX));
    const ax = tip.clone().sub(tail); ax.y = 0; if (ax.lengthSq() < .04) ax.copy(fwd(f.yaw)); ax.normalize();
    const off = tg.model.torso.localToWorld(new V3(0, 6 * PX, 0)).sub(tg.model.root.position);
    const goal = tip.clone().addScaledVector(ax, L.d || 0).addScaledVector(new V3(ax.z, 0, -ax.x), L.side || 0).sub(off);
    tg.pos.x += (goal.x - tg.pos.x) * w; tg.pos.z += (goal.z - tg.pos.z) * w;
    if (L.y) tg.pos.y += (Math.max(groundAt(goal.x, goal.z), goal.y) - tg.pos.y) * w;
  }
}
// manos sobre la lanza: durante [t0, t1] el brazo `arm` de `who` ('att' o 'vic') va a un punto de la lanza (z en píxeles a lo largo del asta;
// la punta está en 26 y el agarre del atacante en 0). Es lo que hace que la víctima ATRAPE la lanza con las manos de verdad.
function choreHolds(st, t) {
  const { f, tg, D } = st; if (!D.holds || !f.spear || !f.spearOut) return;
  for (const H of D.holds) {
    if (t < H.t0 || t > H.t1) continue;
    const fade = H.fade || .1, a = clamp((t - H.t0) / fade, 0, 1), b = clamp((H.t1 - t) / fade, 0, 1), w = a * a * (3 - 2 * a) * b * b * (3 - 2 * b);
    f.model.root.updateMatrixWorld(true); tg.model.root.updateMatrixWorld(true);
    const who = H.who === 'att' ? f : tg, target = f.spear.localToWorld(new V3(H.x || 0, H.y || 0, H.z * PX));
    solveR6Contact(who, H.arm, target, w);
  }
}
function choreEvent(st, e) {
  const { f, tg } = st, col = f.ch.color, at = e.at || 'vic';
  const P = at === 'head' ? headPos(tg) : at === 'att' ? poseChest(f) : at === 'ground' ? new V3(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z) : at === 'groundA' ? new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z) : at === 'eyes' ? front(f, .35, 1.72) : poseChest(tg);
  if (e.fx) choreFx(e.fx, st, P, col, e);
  if (e.prop) for (const p of st.props || []) { try { if (p.on) p.on(e.prop, e, st); } catch (er) { } }
  if (e.hit) { applyHit(f, tg, { dmg: e.hit, stun: 9, kb: 0, color: col, guardBreak: true, hitstop: e.hs || (e.hit >= 3 ? .09 : .06), shake: e.shake || .3, noCounter: true }); if (G.chore === st) { camPunch(e.hit >= 3 ? .7 : .45, Math.random() < .5 ? 1 : -1); G.hitstop = Math.max(G.hitstop, e.hs || (e.hit >= 3 ? .09 : .06)); } }
  if (e.rel) {
    choreRelease(st); IMPACT.cd = 0; impactFrame(col, .11);
    applyHit(f, tg, { dmg: e.rel.dmg, kb: e.rel.kb || 0, up: e.rel.up || 0, ragdoll: e.rel.rag || 1.8, guardBreak: true, color: col, hitstop: .2, shake: 1, dir: fwd(f.yaw), noCounter: true });
    if (G.chore === st) { camPunch(1.2, 1); G.hitstop = Math.max(G.hitstop, .2); G.linesI = 1; }
  }
  if (e.letGo) {
    choreRelease(st);
    if (!tg.remote && tg.alive) { tg.ragdoll = Math.max(tg.ragdoll, e.letGo); tg.rdPose = 0; tg.rdDir = 1; tg.vel.set(0, 0, 0); tg.hurtT = 0; }
  }
  if (e.dom) randiDomainFx(st, e.dom);
  if (e.vg) verityScene(st, e.vg);
  if (e.cocoon) webWrap(tg, e.cocoon, true);
  if (e.slow) G.slowT = Math.max(G.slowT, e.slow);
  if (e.imp) { IMPACT.cd = 0; impactFrame(col, .09); if (G.chore === st) camPunch(.6, -1); }
  if (e.shake && !e.hit) G.shake = Math.max(G.shake, e.shake);
  if (e.sfx) sfx(e.sfx, f.pos);
  if (e.text) popText(chestOf(e.who === 'att' ? f : tg).add(new V3(0, .6, 0)), e.text, e.who === 'att' ? col : '#ffffff', 22);
  if (e.twirl) startTwirl(f, e.twirl[0], e.twirl[1]);
  if (e.eyes != null) f.choreEyes = !!e.eyes;
  if (e.freeze && !tg.remote) freeze(tg, e.freeze);
}
// pajaron: cuerpo con pecho claro, cuello, cabeza con ojo, cresta y pico de dos piezas, cola en abanico y dos alas de tres plumas que aletean (cada tramo con su retraso);
// cruza de un lado a otro de la victima en .6 s, chilla al llegar, suelta plumas al chocar y deja una estela de viento
function birdFx(P, ang, sc, col) {
  const g = new THREE.Group(), mat = new THREE.MeshToonMaterial({ color: col, gradientMap: TOON_GRAD }), dark = new THREE.MeshToonMaterial({ color: 0x3a3f4a, gradientMap: TOON_GRAD }), beak = new THREE.MeshToonMaterial({ color: 0xffb020, gradientMap: TOON_GRAD }),
    belly = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: TOON_GRAD }), eye = new THREE.MeshBasicMaterial({ color: 0x111418 }), glint = new THREE.MeshBasicMaterial({ color: 0xffffff }), mats = [mat, dark, beak, belly, eye, glint];
  const bx = (w, h, d, m, x, y, z, par) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); (par || g).add(b); return b; };
  bx(.7, .6, 1.4, mat, 0, 0, -.1); bx(.55, .34, 1.1, belly, 0, -.22, .05); bx(.45, .42, .6, mat, 0, .18, .75);      // cuerpo, pecho, cuello
  bx(.56, .5, .56, mat, 0, .42, 1.1);                                                                                // cabeza
  bx(.34, .08, .34, dark, 0, .74, 1.0); bx(.22, .08, .3, dark, 0, .68, .8);                                           // cresta
  bx(.2, .12, .3, beak, 0, .38, 1.5); bx(.16, .08, .26, beak, 0, .28, 1.46);                                          // pico de dos piezas
  for (const sd of [-1, 1]) { bx(.08, .1, .1, eye, sd * .29, .5, 1.22); bx(.04, .04, .04, glint, sd * .3, .54, 1.25); }
  for (let i = -1; i <= 1; i++) { const f = bx(.22, .08, .9, i ? mat : dark, i * .22, .02, -1.25); f.rotation.y = i * .22; }   // cola en abanico
  const wings = [-1, 1].map(sd => {
    const p = new THREE.Group(); p.position.set(sd * .35, .15, 0); g.add(p);
    const segs = [];
    let parent = p, x = 0;
    for (let i = 0; i < 3; i++) { const s = new THREE.Group(); s.position.x = sd * x; parent.add(s); const len = [1.1, .95, .8][i]; bx(len, .08, 1.15 - i * .22, i === 2 ? dark : mat, sd * len / 2, 0, -i * .08, s); parent = s; x = len; segs.push(s); }
    return [p, sd, segs];
  });
  g.scale.setScalar(sc); const dir = new V3(Math.sin(ang), .12, Math.cos(ang)), A = P.clone().addScaledVector(dir, -sc * 4.4), B = P.clone().addScaledVector(dir, sc * 4.4);
  g.rotation.y = ang; let cried = false, shed = false;
  // estela de viento: dos lineas largas detras del ave
  const trailMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55, depthWrite: false }), trails = [-1, 1].map(sd => { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 3.2), trailMat); m.position.set(sd * 2.3, .1, -3); g.add(m); return m; });
  addFx(g, .6, (m, k) => {
    m.position.lerpVectors(A, B, k); const ph = k * 44;
    for (const [p, sd, segs] of wings) { p.rotation.z = sd * Math.sin(ph) * .85; segs.forEach((s, i) => { s.rotation.z = sd * Math.sin(ph - .55 * (i + 1)) * (.35 + i * .12); }); }
    trailMat.opacity = .55 * Math.min(1, k * 6) * (1 - k * .6); for (const t of trails) t.scale.z = .6 + k * 1.6;
    if (!cried && k > .05) { cried = true; sfx('screech', P, .9); }
    if (!shed && k > .47) { shed = true; burst(P, 26, '#ffffff', 6, .16, 1.3, .9); burst(P, 10, '#ffe9b0', 4, .12, 1.1, .8); sfx('whoom', P, .7); }
  }, () => { scene.remove(g); g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); mats.forEach(x => x.dispose()); trailMat.dispose(); });
}
function choreFx(name, st, P, col, e) {
  const { f, tg } = st, big = !!e.big, G0 = new V3(P.x, groundAt(P.x, P.z), P.z);
  switch (name) {
    case 'impact': impactStar(P, big ? col : '#ffffff', big ? 2.6 : 1.4, big ? .3 : .16); sparkLines(P, col, big ? 10 : 5, big ? 2.4 : 1.3); burst(P, big ? 30 : 12, col, big ? 12 : 7, .16, .45, .5); sfx(big ? 'heavy' : 'hit', P); break;
    case 'stab': stabFx(f, col); impactStar(P, '#ffffff', 1.4, .16); sfx('slash', P); break;
    case 'slash': arcSlash(f, col, { tilt: e.tilt != null ? e.tilt : rand(-.8, .8), r: e.r || 1.8, len: e.len || 2.6, w: .55, dur: .22 }); sfx('swing', f.pos); break;
    case 'line': { const a = rand(0, TAU), d = new V3(Math.cos(a), rand(-.5, .5), Math.sin(a)).normalize().multiplyScalar(1.9); slashLine(P.clone().sub(d), P.clone().add(d), col, .35, .13); slashLine(P.clone().sub(d), P.clone().add(d), '#ffffff', .25, .05); sfx('slash', P); break; }
    case 'xcut': for (let i = 0; i < 6; i++) { const a = rand(0, TAU), d = new V3(Math.cos(a), rand(-.8, .8), Math.sin(a)).normalize().multiplyScalar(2.1); slashLine(P.clone().sub(d), P.clone().add(d), i % 2 ? col : '#ffffff', .5, .14); } sparkLines(P, col, 10, 2.2); sfx('slash', P); sfx('heavy', P); break;
    case 'ghost': ghost(f, col, .6, .35); break;
    case 'copies': copiesAround(tg, 4, 1.7, .9); break;
    case 'clone': { const a = (e.a || 0) + st.yaw, s = new V3(Math.sin(a) * 2.6, 0, Math.cos(a) * 2.6), from = P.clone().add(s), to = P.clone().sub(s); copyAt(f, new V3(from.x, tg.pos.y, from.z), a + Math.PI, .3); copyAt(f, new V3(to.x, tg.pos.y, to.z), a + Math.PI, .4); slashLine(from, to, col, .4, .15); slashLine(from, to, '#ffffff', .28, .05); sfx('slash', P); break; }
    case 'ring': ringAt(P, col, e.r || 3, .4, e.face ? 'face' : 'flat', f.yaw); break;
    case 'boom': { const r = e.r || 2.5; sphereFlash(P, col, r, .4); ringAt(G0, col, r * 1.6, .5); ringAt(P, '#ffffff', r, .35, 'face', f.yaw); burst(P, 40, col, 13, .22, .6, .6); burst(new V3(G0.x, G0.y + .3, G0.z), 24, '#6b5a3e', 10, .25, .8, 1.2, 6); sfx('boom', P); G.shake = Math.max(G.shake, .8); break; }
    case 'crack': crackDecal(G0, e.r || 4.5); worldDamage(G0, e.r || 4.5, 1, 11, st.D.dest != null ? st.D.dest : 1); break;
    case 'fire': fireColumn(G0, e.r || 1.4, col, e.h || 5); sfx('fire', P); break;
    case 'ice': iceSpikes(G0, e.r || 2, col, 10); sfx('ice', P); break;
    case 'elec': for (let i = 0; i < 4; i++) { const a = P.clone().add(new V3(rand(-1.2, 1.2), rand(-1.2, 1.2), rand(-1.2, 1.2))); slashLine(P, a, i % 2 ? '#fff59d' : col, .14, .06); } burst(P, 8, '#fff59d', 6, .1, .2, 0); sfx('zap', P, .6); break;
    case 'lightning': { const top = P.clone().add(new V3(rand(-.5, .5), 18, rand(-.5, .5))); slashLine(top, P, col, .55, 1.1); slashLine(top, P, '#ffffff', .4, .45); screenFlash(.45); sparkLines(P, col, 12, 2.6); sfx('boom', P); break; }
    case 'beam': { const E = front(f, .35, 1.72), end = P.clone().add(fwd(f.yaw).multiplyScalar(e.len || 6)); slashLine(E, end, col, .5, big ? 1.1 : .4); slashLine(E, end, '#ffffff', .4, big ? .45 : .16); ringAt(E, col, 1.6, .3, 'face', f.yaw); sfx('beam', P); break; }
    case 'charge': for (let i = 0; i < 14; i++) { const a = rand(0, TAU), r = rand(.8, 1.6); emit(P.x + Math.cos(a) * r, P.y + rand(-1, 1), P.z + Math.sin(a) * r, -Math.cos(a) * 5, rand(-1, 1), -Math.sin(a) * 5, i % 3 ? col : '#ffffff', .1, .25, 0, 0); } break;
    case 'magic': burst(P, 24, col, 7, .14, .5, -.3); burst(P, 10, '#ffd54f', 5, .1, .4, -.3); ringAt(P, col, 2, .35, 'face', f.yaw); sfx('tp', P); break;
    case 'shatter': burst(P, 50, '#dff6ff', 12, .25, .8, .8); burst(P, 20, col, 9, .2, .6, .6); sparkLines(P, '#ffffff', 10, 2.4); sfx('break', P); break;
    case 'dust': { const n = e.n || 10; burst(new V3(P.x, P.y + .12, P.z), n, '#9c8c6a', e.v || 5, .22, .6, .9, 3); burst(new V3(P.x, P.y + .1, P.z), Math.ceil(n / 2), '#d8ccb0', (e.v || 5) * .6, .3, .7, .4, 2); break; }
    case 'clang': sparkLines(P, '#ffe9a8', e.n || 8, e.len || 1.7); burst(P, 14, '#fff2c0', 8, .1, .3, 0); impactStar(P, '#ffffff', e.sz || 1.1, .1); sfx('block', P); break;
    case 'bird': birdFx(P, (e.a || 0) + st.yaw, e.sc || 4.5, e.col || '#fff6e0'); sfx('whoosh', P, .8); break;
    // nubes que se abren de golpe / plumas / onda de choque / escombros (escenas de Sekza)
    case 'puff': burst(P, e.n || 40, '#ffffff', e.v || 7, e.sz || .55, 1.1, -.05); burst(P, Math.round((e.n || 40) / 2), '#dbe9ff', (e.v || 7) * .6, (e.sz || .55) * 1.3, 1.4, -.05); sfx('wind', P, .5); break;
    case 'feathers': burst(P, e.n || 24, '#ffffff', 6, .16, 1.4, 1.1); burst(P, 10, '#ffe9b0', 4, .12, 1.1, .9); break;
    case 'shock': { const r = e.r || 3; sphereFlash(P, '#ffffff', r * .8, .28); ringAt(P, col, r * 1.8, .5, 'flat'); ringAt(P, '#ffffff', r, .4, 'face', f.yaw); burst(P, 18, '#ffffff', 11, .14, .5, 0); sfx(e.sfx || 'whoom', P, .8); break; }
    case 'debris': burst(G0, e.n || 40, '#7a7f87', e.v || 12, .3, 1.4, 1.5); burst(new V3(G0.x, G0.y + .3, G0.z), Math.round((e.n || 40) / 2), '#cfc4a8', (e.v || 12) * .7, .45, 1.1, .8); break;
    case 'flash': screenFlash(e.op || .5); break;
    case 'lines': G.linesI = 1; break;
    case 'screenbreak': screenBreak(e.life || 2.6); camPunch(1.6, -1); break;
  }
}
// Pantalla rota: telaraña de grietas y esquirlas de vidrio dibujadas encima del juego (rompe la cuarta pared). Se desvanece sola.
function screenBreak(life) {
  try {
    const W = innerWidth, H = innerHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;transition:opacity .9s ease-out;opacity:1';
    const c = cv.getContext('2d'), cx = W * (.46 + Math.random() * .08), cy = H * (.44 + Math.random() * .1), R = Math.hypot(W, H);
    // vidrio dañado alrededor del golpe
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * .45); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.25, 'rgba(210,235,255,.1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const n = 15 + (Math.random() * 5 | 0), ends = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + (Math.random() - .5) * .3; let x = cx, y = cy, len = R * (.3 + Math.random() * .5), cur = a; const seg = 9 + (Math.random() * 6 | 0), pts = [[x, y]];
      for (let s = 0; s < seg; s++) { const l = len / seg * (.6 + Math.random() * .8); cur += (Math.random() - .5) * .16; x += Math.cos(cur) * l; y += Math.sin(cur) * l; pts.push([x, y]); if (s > 1 && Math.random() < .3) ends.push([x, y, cur + (Math.random() < .5 ? 1 : -1) * (.5 + Math.random() * .5), len * .16]); }
      c.beginPath(); pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 4.5; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.6; c.stroke();
    }
    for (const b of ends) { c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + Math.cos(b[2]) * b[3], b[1] + Math.sin(b[2]) * b[3]); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.2; c.stroke(); }
    // anillos irregulares (las grietas concéntricas del vidrio)
    for (let r = 1; r <= 5; r++) { const rad = R * .025 * r * r * .8 + 20; c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = rad * (.85 + Math.random() * .3); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.1; c.stroke(); }
    // esquirlas triangulares claras
    for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 1.6) * R * .5, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, s = 8 + Math.random() * 38, r = Math.random() * 6.28; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(r) * s, y + Math.sin(r) * s); c.lineTo(x + Math.cos(r + 2.1) * s * .7, y + Math.sin(r + 2.1) * s * .7); c.closePath(); c.fillStyle = 'rgba(' + (200 + Math.random() * 55 | 0) + ',235,255,' + (.08 + Math.random() * .2) + ')'; c.fill(); }
    // punto de impacto
    const h = c.createRadialGradient(cx, cy, 0, cx, cy, 70); h.addColorStop(0, 'rgba(255,255,255,.95)'); h.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = h; c.beginPath(); c.arc(cx, cy, 70, 0, 6.3); c.fill();
    document.body.appendChild(cv);
    setTimeout(() => { cv.style.opacity = '0'; }, Math.max(200, (life - .9) * 1000)); setTimeout(() => cv.remove(), life * 1000 + 300);
  } catch (e) { }
}
// director de cámara: cada plano se arma con ejes fijos (los de la escena, no los que cambian cuando se cruzan),
// se mueve suave dentro del plano, corta seco entre planos y se aleja solo si alguno de los dos queda fuera de cuadro.
const headPos = f => f.model && f.model.head ? (f.model.head.updateWorldMatrix(true, false), f.model.head.localToWorld(new V3(0, 4 * PX, 0))) : chestOf(f).add(new V3(0, .55, 0));
const CHK_CAM = new THREE.PerspectiveCamera(50, 1, .05, 300);
// efectos de cámara anime: zoom de golpe, giro de impacto y aberración cromática con desenfoque radial
const CAMFX = { zoom: 0, roll: 0, rollV: 0, ca: 0 };
function camPunch(str, dirSign = 1) { CAMFX.zoom = Math.max(CAMFX.zoom, str); CAMFX.ca = Math.max(CAMFX.ca, str); CAMFX.rollV += .9 * str * dirSign; }
function updateCamFx(dt) {
  CAMFX.zoom *= Math.exp(-dt * 7); CAMFX.ca *= Math.exp(-dt * 5);
  CAMFX.rollV += (-CAMFX.roll * 260 - CAMFX.rollV * 16) * dt; CAMFX.roll += CAMFX.rollV * dt;
  if (caPass) { caPass.enabled = CAMFX.ca > .01 && GFX.level < 3 && GFX.post !== false; caPass.uniforms.amt.value = Math.min(1, CAMFX.ca); }   // en graficos minimos no hay aberracion cromatica
}
function choreShots(D) {
  // planos de menos de .4 s no se llegan a leer: se juntan con el anterior
  if (D._shots) return D._shots;
  const out = [];
  D.shots.forEach((sh, i) => { const t1 = D.shots[i + 1] ? D.shots[i + 1][0] : D.dur + .5; if (out.length && t1 - sh[0] < .2) return; out.push(sh); });
  return (D._shots = out);
}
function cineFramePoints(f) {
  const m = f.model; m.root.updateMatrixWorld(true);
  const points = [m.head.localToWorld(new V3(0, 8.5 * PX, 0)),
    m.legL.localToWorld(new V3(0, -12.5 * PX, 0)), m.legR.localToWorld(new V3(0, -12.5 * PX, 0)),
    m.armL.localToWorld(new V3(0, -10.5 * PX, 0)), m.armR.localToWorld(new V3(0, -10.5 * PX, 0)), chestOf(f)];
  if (f.spear && f.spearOut) points.push(anchorPoint(f, 'tip'));
  return points;
}
function fitBoth(pos, look, fov, pts) {
  // aleja la cámara (sobre su propio eje) hasta que todos los puntos entren en el 78% del cuadro
  const back = pos.clone().sub(look); let d = back.length(); if (d < 1e-3) return pos; back.normalize();
  if (back.y < .05) { back.y = .05; back.normalize(); }  // alejarse nunca la mete bajo el piso
  CHK_CAM.fov = fov; CHK_CAM.aspect = camera.aspect; CHK_CAM.updateProjectionMatrix();
  const bottom = G.viewer ? clamp(1 - 2 * ($('viewer').getBoundingClientRect().top - 24) / innerHeight, -.7, -.15) : -.74;
  for (let it = 0; it < 12; it++) {
    CHK_CAM.position.copy(look).addScaledVector(back, d); CHK_CAM.lookAt(look); CHK_CAM.updateMatrixWorld();
    let ok = true;
    for (const q of pts) { const v = q.clone().project(CHK_CAM); if (v.z > 1 || Math.abs(v.x) > .88 || v.y > .84 || v.y < bottom) { ok = false; break; } }
    if (ok) break; d *= 1.18;
  }
  return look.clone().addScaledVector(back, d);
}
// la cámara de las escenas no atraviesa jardineras, paredes ni el piso: si algo tapa el rayo mira->cámara, se acerca justo antes de eso
function camClear(look, pos) {
  const d = pos.clone().sub(look), L = d.length(); if (L < .6) return pos;
  const n = Math.ceil(L / .2), p = new V3();
  for (let i = 1; i <= n; i++) {
    p.copy(look).addScaledVector(d, i / n);
    const g = groundAt(p.x, p.z, p.y);
    if (g > .06 && p.y < g + .06) { const u = Math.max(.35 / L, (i - 2.5) / n); return look.clone().addScaledVector(d, u); }
  }
  return pos;
}
function choreCam(st, dt) {
  const D = st.D, t = st.t, S = choreShots(D); let si = 0; for (let i = 0; i < S.length; i++) if (t >= S[i][0]) si = i;
  const sh = S[si], op = sh[2] || {}, t1 = S[si + 1] ? S[si + 1][0] : D.dur + .5, k = clamp((t - sh[0]) / Math.max(.05, t1 - sh[0]), 0, 1);
  const cut = si !== st.shot;
  if (cut) { st.shot = si; if (si > 0) { G.linesI = Math.max(G.linesI, .25); CAMFX.ca = Math.max(CAMFX.ca, .16); } }
  const f = st.f, tg = st.tg, A = poseChest(f), V = poseChest(tg), mid = A.clone().lerp(V, .5), s = op.s || 1, gy = st.origin.y;
  // ejes de la escena: adelante del atacante al empezar (estables aunque se crucen o teletransporten)
  const dir = fwd(st.yaw), perp = rightOf(st.yaw);
  let pos, look, fov = op.fov, roll = op.roll || 0, fit = true;
  switch (sh[1]) {
    // planos cerrados para los ataques: 'cl' = los dos de cerca, 'clv' = sigue a la víctima, 'tip' = macro de la punta de la lanza
    case 'cl': pos = mid.clone().addScaledVector(perp, (op.d || 3.8) * s).add(new V3(0, .55, 0)); look = mid.clone().add(new V3(0, .1, 0)); fov = fov || 44; roll = roll || .04 * s; fit = false; break;
    // 'pass': cámara de costado respecto de la trayectoria del atacante (h = giro de su pasada) para ver el rayo cruzar el cuadro
    case 'pass': { const hd = rightOf(st.yaw + (op.h || 0)); pos = V.clone().addScaledVector(hd, (op.d || 5) * s).add(new V3(0, .6, 0)); look = V.clone().add(new V3(0, .2, 0)); fov = fov || 50; roll = roll || .05 * s; fit = false; break; }
    case 'clv': pos = V.clone().addScaledVector(perp, (op.d || 3.2) * s).addScaledVector(dir, .6 * s).add(new V3(0, .35, 0)); look = V.clone().add(new V3(0, .1, 0)); fov = fov || 46; roll = roll || -.04 * s; fit = false; break;
    case 'tip': { const T = f.spear && f.spearOut ? anchorPoint(f, 'tip') : A; look = T.clone().lerp(V, .5); pos = look.clone().addScaledVector(perp, (op.d || 2.2) * s).addScaledVector(dir, -.5).add(new V3(0, .25, 0)); fov = fov || 40; roll = roll || .05 * s; fit = false; break; }
    case 'two': pos = mid.clone().addScaledVector(perp, ((op.d || 4.6) - k * .8) * s).add(new V3(0, .5, 0)); look = mid; fov = fov || 46; roll = roll || .05 * s; break;
    case 'ots': pos = A.clone().addScaledVector(dir, -2.8 - k * .3).addScaledVector(perp, 1.3 * s).add(new V3(0, 1, 0)); look = V; fov = fov || 46 - k * 5; break;
    case 'otsV': pos = V.clone().addScaledVector(dir, 2.7 + k * .3).addScaledVector(perp, -1.2 * s).add(new V3(0, .8, 0)); look = A; fov = fov || 46; break;
    case 'lowV': pos = V.clone().addScaledVector(dir, 2.2).addScaledVector(perp, (op.d || 2.2) * s); pos.y = gy + .35; look = mid.clone().lerp(V, .5).add(new V3(0, .3, 0)); fov = fov || 54; roll = roll || -.1 * s; break;
    case 'lowA': pos = A.clone().addScaledVector(dir, 2.4).addScaledVector(perp, -2 * s); pos.y = gy + .3; look = mid.clone().lerp(A, .5).add(new V3(0, .4, 0)); fov = fov || 54; roll = roll || .1 * s; break;
    // primer plano de la cara (apunta a la cabeza real), de tres cuartos y con el otro asomando en cuadro
    case 'faceV': { const hv = headPos(tg), d = fwd(tg.yaw).multiplyScalar(.55).addScaledVector(rightOf(tg.yaw), .84 * s).normalize(); pos = hv.clone().addScaledVector(d, 2.8 - k * .35).add(new V3(0, .2, 0)); look = hv.clone().add(new V3(0, -.25, 0)); fov = fov || 40; fit = false; break; }
    case 'faceA': { const ha = headPos(f), d = fwd(f.yaw).multiplyScalar(.55).addScaledVector(rightOf(f.yaw), .84 * s).normalize(); pos = ha.clone().addScaledVector(d, 2.8 - k * .4).add(new V3(0, .2, 0)); look = ha.clone().add(new V3(0, -.25, 0)); fov = fov || 40; fit = false; break; }
    case 'orbit': { const a0 = Math.atan2(perp.x * s, perp.z * s) + (op.a || 0), ang = a0 + k * clamp(op.spd || 1.2, -1.6, 1.6), r = op.r || 5.5; pos = mid.clone().add(new V3(Math.sin(ang) * r, 1.1 + (op.h || 0), Math.cos(ang) * r)); look = mid; fov = fov || 52; break; }
    case 'top': pos = mid.clone().add(new V3(0, 7 - k, 0)).addScaledVector(perp, 2.2).addScaledVector(dir, -1); look = mid; fov = fov || 52; break;
    case 'ground': pos = V.clone().addScaledVector(perp, (op.d || 4.2) * s).addScaledVector(dir, 1); pos.y = gy + .25; look = mid.clone().lerp(V, .6); fov = fov || 58; roll = roll || .07 * s; break;
    case 'follow': pos = A.clone().addScaledVector(dir, -(op.d || 3.6)).add(new V3(0, 2, 0)).addScaledVector(perp, 1 * s); look = mid.clone().lerp(V, .5); fov = fov || 56; break;
    case 'hero': { pos = A.clone().addScaledVector(fwd(f.yaw), 3.6 - k * .5).addScaledVector(rightOf(f.yaw), 1.4 * s); pos.y = gy + .5; look = A.clone().add(new V3(0, .35, 0)); fov = fov || 44; roll = roll || .06 * s; fit = false; break; }
    // 'rig': plano dirigido a mano, con movimiento de cámara de verdad (dolly, grúa, órbita, rack de enfoque).
    //   at/at1 = a qué mira al empezar / al terminar el plano ('A' Javi, 'V' víctima, 'mid', 'tip' punta de la lanza, 'hands' contacto lanza-víctima,
    //            'headA', 'headV', 'ground' el piso entre ambos); ly = altura extra de la mira.
    //   a0/a1 = ángulo en grados alrededor de ese punto (0 = detrás de Javi mirando hacia la víctima, 90 = a su derecha, 180 = desde la víctima);
    //   r0/r1 = distancia; h0/h1 = altura de la cámara sobre el punto de mira; fov0/fov1, roll0/roll1 (grados); ease: 'io' (def.), 'o', 'i', 'l'; lag = suavidad.
    case 'rig': {
      const e0 = clamp(k, 0, 1), e = op.ease === 'l' ? e0 : op.ease === 'o' ? 1 - Math.pow(1 - e0, 3) : op.ease === 'i' ? e0 * e0 * e0 : e0 * e0 * (3 - 2 * e0);
      const tipP = f.spear && f.spearOut ? anchorPoint(f, 'tip') : A, tgt = n => n === 'A' ? A : n === 'V' ? V : n === 'tip' ? tipP : n === 'hands' ? tipP.clone().lerp(V, .35) : n === 'headA' ? headPos(f) : n === 'headV' ? headPos(tg) : n === 'ground' ? new V3(mid.x, gy, mid.z) : mid;
      const T0 = tgt(op.at || 'mid'), T1 = op.at1 ? tgt(op.at1) : T0, mix = (a, b, d) => a == null ? d : b == null ? a : a + (b - a) * e;
      look = T0.clone().lerp(T1, e); look.y += mix(op.ly, op.ly1, 0);
      const ang = mix(op.a0, op.a1, 90) * Math.PI / 180 * s, r = mix(op.r0, op.r1, 4), hh = mix(op.h0, op.h1, .3);
      pos = look.clone().addScaledVector(dir, -Math.cos(ang) * r).addScaledVector(perp, Math.sin(ang) * r); pos.y = look.y + hh;
      fov = mix(op.fov0, op.fov1, op.fov || 44); roll = mix(op.roll0, op.roll1, 0) * Math.PI / 180 * s; fit = false; break;
    }
    // 'bb': cámara de una película de BBS ya convertida (tools/bbs_escena.py). op.keys = [[t, x derecha, y arriba, z adelante (del origen de la escena), giro (grados, + = a la derecha),
    //   inclinación (grados, + = mira hacia abajo), roll, fov], ...]: se interpola entre cuadros y no se suaviza ni se corre por obstáculos (es la cámara que dibujó el animador)
    case 'bb': {
      const K = op.keys; let i = 0; while (i < K.length - 2 && t >= K[i + 1][0]) i++;
      const a = K[i], b = K[Math.min(i + 1, K.length - 1)], u = b[0] > a[0] ? clamp((t - a[0]) / (b[0] - a[0]), 0, 1) : 0, L = j => a[j] + (b[j] - a[j]) * u;
      const yw = L(4) * Math.PI / 180, pt = L(5) * Math.PI / 180, cp = Math.cos(pt);
      pos = st.origin.clone().addScaledVector(perp, L(1)).addScaledVector(dir, L(3)); pos.y += L(2);
      look = pos.clone().addScaledVector(dir, Math.cos(yw) * cp).addScaledVector(perp, Math.sin(yw) * cp); look.y -= Math.sin(pt);
      camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); camera.rotateZ((op.rs || 1) * L(6) * Math.PI / 180 + CAMFX.roll);
      st.cp = pos.clone(); st.cl = look.clone(); st.roll = 0;
      if (G.shake > 0) { const q = G.shake * .22; camera.position.x += rand(-q, q); camera.position.y += rand(-q, q); G.shake = Math.max(0, G.shake - dt * 2.4); }
      cam.fov = L(7); camera.fov = cam.fov * (1 - CAMFX.zoom * .16); camera.updateProjectionMatrix();
      return;
    }
    case 'wide': pos = mid.clone().addScaledVector(perp, 9 * s).add(new V3(0, 3.2, 0)); look = mid; fov = fov || 48; break;
    case 'up': pos = V.clone().addScaledVector(perp, (op.d || 3.4) * s).addScaledVector(dir, 1.6); pos.y = gy + .2; look = mid.clone().lerp(V, .45).add(new V3(0, .5, 0)); fov = fov || 64; break;
    default: pos = mid.clone().addScaledVector(perp, 5).add(new V3(0, 1.2, 0)); look = mid; fov = 50;
  }
  if (op.fit === false) fit = false;
  // En el visor reservamos el área inferior para los controles de reproducción.
  if (G.viewer && fit) look = look.clone().add(new V3(0, -.5, 0));
  if (fit) pos = fitBoth(pos, look, fov, cineFramePoints(f).concat(cineFramePoints(tg)));
  pos.y = Math.max(gy + .15, pos.y); pos = camClear(look, pos);
  // suave dentro del plano, corte seco al cambiar
  if (cut || !st.cp) { st.cp = pos.clone(); st.cl = look.clone(); st.roll = roll; }
  else { const a = 1 - Math.exp(-dt * (op.lag || 9)); st.cp.lerp(pos, a); st.cl.lerp(look, 1 - Math.exp(-dt * (op.lag ? op.lag * 1.5 : 14))); st.roll += (roll - st.roll) * a; }
  camera.position.copy(st.cp); camera.up.set(0, 1, 0); camera.lookAt(st.cl); camera.rotateZ(st.roll + CAMFX.roll);
  if (G.shake > 0) { const q = G.shake * .22; camera.position.x += rand(-q, q); camera.position.y += rand(-q, q); G.shake = Math.max(0, G.shake - dt * 2.4); }
  const want = fov * (1 - CAMFX.zoom * .16);
  cam.fov = cut ? want : cam.fov + (want - cam.fov) * Math.min(1, dt * 16); camera.fov = cam.fov; camera.updateProjectionMatrix();
}
function runChore(f, tg, D) {
  if (tg && tg.isBoss) {   // las cinematicas de agarre no sirven contra el Kraken: la habilidad le pega fuerte
    if (f.action) endAction(f);
    applyHit(f, tg, { dmg: 16, kb: 0, noCounter: true, color: f.ch.color, hitstop: .08 }); impactStar(chestOf(tg).add(new V3(rand(-3, 3), 3, rand(-3, 3))), f.ch.color, 2.4, .25); camPunch(.7, 1);
    return;
  }
  if (f.action) endAction(f);
  // multijugador: se avisa a los demás clientes qué escena es y a quién se agarró, así la ven todos sin depender de que su juego "atrape" por su cuenta
  if (f.isPlayer && G.mp && !G.viewer) {
    const id = Object.keys(CHORE).find(k => CHORE[k] === D), vid = tg.remote ? tg.peer : tg.isPlayer ? NET.myPeer : (tg.netId || null);
    if (id && vid) netAct({ k: 'c', d: id, v: vid });
  }
  let st = null;
  startAction(f, {
    name: 'chore', dur: D.dur + .05, noControl: true, armor: true,
    start: () => { st = choreBegin(f, tg, D); },
    tick: (a, t, dt) => { choreTick(st, dt); a.eyes = !!f.choreEyes; if (st.done) a.t = a.dur; },
    onEnd: () => { if (st) choreEnd(st); },
  });
}

// ===== Las coreografías (cada una es una escena distinta, nada se reutiliza) =====
const CHORE = {
  // ---------- JAVICUBITO ----------

  // ---------- ELGATOPRO300 ----------

  // ---------- REDBIRD ----------

  // ---------- SEKZA ----------

  // ---------- ROCKET ----------

  // ---------- ITZUKYO ----------

  // ---------- SEB0LLA ----------

  // ---------- KAIZA ----------

  // ---------- NYX ----------

  // ---------- VOLT ----------

  // ---------- BRASA ----------

  // ---------- YUKI ----------

  // ---------- TITÁN ----------
};

// Seis direcciones de escena. Comparten el rig R6 y los contactos, pero cada
// versión tiene una trayectoria, preparación, cadencia y golpe distintos.
const IMPALE_VARIANTS = [
  { id: 'javiImpale', name: '01 · Relámpago lateral', side: 1, distance: 2.65, pin: 1.48, charge: 1.94, strike: 2.58, snap: .055, hold: .56, steps: 1.7, style: 'direct', desc: 'Derribo a la derecha, sprint recto y remate explosivo con preparación corta.' },
  { id: 'javiImpale2', name: '02 · Guillotina', side: -1, distance: 2.4, pin: 1.64, charge: 2.14, strike: 3.15, snap: .065, hold: .62, steps: 1.8, style: 'heavy', desc: 'Derribo a la izquierda, pasos pesados y carga alta que termina con todo el peso del cuerpo.' },
  { id: 'javiImpale3', name: '03 · Eclipse', side: 1, distance: 2.9, pin: 1.83, charge: 2.23, strike: 3.02, snap: .06, hold: .58, steps: 2.1, style: 'arc', desc: 'Persecución en curva, lanza recogida a un costado y estocada diagonal con ambas manos.' },
  { id: 'javiImpale4', name: '04 · Quiebre', side: -1, distance: 2.05, pin: 1.42, charge: 1.87, strike: 3.06, snap: .045, hold: .54, steps: 1.5, style: 'feint', desc: 'Carrera corta, amago que se frena en el aire, nueva tensión y un segundo descenso fulminante.' },
  { id: 'javiImpale5', name: '05 · Martillo celeste', side: 1, distance: 3, pin: 1.77, charge: 2.21, strike: 3.03, snap: .07, hold: .65, steps: 2, style: 'hop', desc: 'Sprint con un salto corto para fijar el torso, recogida de hombros y remate de martillo.' },
  { id: 'javiImpale6', name: '06 · Silencio e impacto', side: -1, distance: 3.1, pin: 1.98, charge: 2.37, strike: 3.69, snap: .045, hold: .68, steps: 2.5, style: 'tension', desc: 'Derribo con deslizamiento, persecución larga, pausa tensa y golpe casi instantáneo.' },
];
function createR6Impale(o) {
  const S = o.side, X = S * o.distance, P = o.pin, C = o.charge, H = o.strike;
  const release = H + o.hold + .45, dur = release + .48;
  const groundYaw = S * (o.style === 'arc' ? 1.2 : o.style === 'heavy' ? .85 : 1.05);
  const rotateGround = (x,z) => [x*Math.cos(groundYaw)-z*Math.sin(groundYaw),x*Math.sin(groundYaw)+z*Math.cos(groundYaw)];
  const pinOffset = rotateGround(.2,-.58), chargeOffset = rotateGround(.2,-.41), exitOffset = rotateGround(.12,-.91);
  const make = (p, extra) => Object.assign({}, POSE[p], extra);
  const toss = make('jGThrow', { ty: -.4 * S, tz: -.09 * S, alz: -.32 * S });
  const sprint = make('jGRecover', { ix: .32, tx: .1, ty: -.13 * S, alx: .65, arx: -.7, arz: -.1, sx: -.7, hx: -.2 });
  const wind = make('jGRaise', { ix: -.07, tx: -.08, by: .1, arx: -2.5, alx: -2.3, hy: -.05, arpy: 1.2, arpz: 1.2, alpy: 1.2, alpz: 1.2 });
  const brace = make('jGPin', { tx: .12, by: -1.5, hx: .25 });
  const strike = make('jGDrive', { ix: .21, tx: .18, by: -2.2, arx: -1.7, alx: -1.6, ars: 1.05, als: 1.05 });
  if (o.style === 'heavy' || o.style === 'hop') Object.assign(wind, { ix: -.14, tx: -.12, by: .5, hx: .05 });
  if (o.style === 'arc') Object.assign(wind, { ty: -.4, tz: -.1, arx: -2, alx: -1.9 });
  if (o.style === 'tension') Object.assign(wind, { ix: -.035, tx: -.025, hx: .3, by: -.3 });
  const sideFall = make('vGFall', { ix: -.6, iz: .8 * S, ty: .18 * S, alz: 1.1, arz: -1, llx: -.65, lrx: .5 });
  const sideHit = make('vGBackHit', { ix: -1.25, iz: .5 * S, hx: .12, hy: -.1 * S });
  const sideRest = make('vGOnBack', { ix: -1.4, iz: .26 * S, hx: .1, hy: -.12 * S });
  const pressed = make('vGPressed', { ix: -1.4, iz: .23 * S, hy: -.08 * S });
  const att = [[.18, 'jGReach'], [.34, 'jGClutch'], [.48, make('jGDrag', { ty: -.22 * S })], [.6, toss], [.76, sprint], [P - .2, sprint], [P, brace], [C, wind], [H - o.snap - .11, wind], [H - o.snap, make('jGPoise', { ty: wind.ty || 0, arpy: 1.2, arpz: 1.2 })], [H, strike], [H + .11, 'jGHold'], [H + o.hold, 'jGHold'], [release - .12, 'jGWithdraw'], [dur - .1, 'jGRecover']];
  if (o.style === 'feint') att.splice(att.findIndex(k => k[0] >= H - o.snap - .11), 0, [C + .38, make('jGDrive', { ix: .14, by: -1.2 })], [C + .57, wind]);
  const apos = [[0, 0, 0, 0, 0], [.34, 0, 0, .5, 0], [.58, .15 * S, 0, .52, .35 * S], [.74, .35 * S, 0, .58, 1.35 * S], [P - .35, X * .7, 0, .75, 1.2 * S], [P - .21, X + pinOffset[0]-.1*S, o.style === 'hop' ? .32 : 0, 1.63+pinOffset[1]-.1, groundYaw], [P, X+pinOffset[0], 0, 1.63+pinOffset[1], groundYaw], [C, X+chargeOffset[0], 0, 1.63+chargeOffset[1], groundYaw], [release-.12, X+chargeOffset[0], 0, 1.63+chargeOffset[1], groundYaw], [dur, X+exitOffset[0], 0, 1.63+exitOffset[1], groundYaw]];
  if (o.style === 'arc') { apos[4] = [P - .48, X * .52, 0, -.25, 1.7 * S]; apos.splice(5, 0, [P - .3, X * .95, 0, .05, .9 * S]); }
  const vpos = [[0, 0, 0, 1.4, 0], [.34, 0, 0, 1.4, 0], [.48, .12 * S, .1, 1.42, -.12 * S], [.63, X*.27, .48, 1.48, groundYaw*.65], [.81, X*.75, .34, 1.55, groundYaw*1.25], [.98, X*.94, .08, 1.62, groundYaw], [1.1, X, .12, 1.63, groundYaw*.97], [1.24, X, .08, 1.63, groundYaw], [dur, X, .08, 1.63, groundYaw]];
  if (o.style === 'tension') { vpos[5][1] = X * .85; vpos[6][1] = X * .95; vpos[7][1] = X; }
  const clearance = [[C - .16, 0, .15, 0, 0], [C + .2, 0, .59, 0, 0], [H - o.snap - .08, 0, .64, 0, 0], [H - o.snap, 0, .68, 0, 0], [H, 0, -.035, 0, 0, 'i'], [H + .12, 0, -.055, 0, 0], [H + o.hold, 0, -.055, 0, 0], [release - .12, 0, .5, 0, 0]];
  if (o.style === 'feint') clearance.splice(2, 0, [C + .38, 0, .18, 0, 0, 'i'], [C + .57, 0, .66, 0, 0]);
  // cámara por beats: agarre de la cabeza → derribo (sigue a la víctima) → persecución → pie sobre el torso → alza la estaca
  // (cara) → macro de la punta justo antes del golpe → impacto → plano héroe
  const shots = [[0, 'cl', { s: -S, d: 4.4, fov: 46, roll: .015 * S }], [.5, 'clv', { s: S, d: 4.2, fov: 48 }], [.82, 'cl', { s: -S, d: 5.6, fov: 50 }],
    [P - .12, 'clv', { s: S, d: 3.8, fov: 46 }], [C + .04, 'faceA', { s: S, fov: 42 }], [H - o.snap - .08, 'tip', { s: S, d: 3.6, fov: 44 }],
    [H + .04, 'clv', { s: -S, d: 4, fov: 48, roll: .05 * S }], [release, 'hero', { s: -S, roll: .015 * S }]];
  if (o.style === 'tension') shots.splice(shots.length - 3, 0, [H - .68, 'clv', { s: S, d: 3.4, fov: 42 }]);
  return {
    dur, catch: 2, reach: 'jGReach', r6: true, variantName: o.name, description: o.desc,
    att: att.sort((a,b) => a[0]-b[0]),
    vic: [[.18, 'vJReady'], [.34, make('vGGrab', { ix: .1, tx: .1 })], [.49, 'vGOffBalance'], [.65, sideFall], [.98, sideHit], [1.1, 'vGBackRebound'], [1.24, sideRest], [P, pressed], [C + .15, make('vGStruggle', { ix: -1.4, iz: .24 * S })], [H - .1, pressed], [H, make('vGFlinch', { ix: -1.42, iz: .22 * S })], [H + .14, make('vGStill', { ix: -1.4, iz: .23 * S })], [dur, sideRest]],
    apos, vpos,
    bindings: [
      { start: .2, end: .59, enter: .1, exit: .065, part: 'armL', from: [0,-10,0], target: 'head', to: [-3,5,1] },
      { start: P - .11, end: release - .14, enter: .14, exit: .17, part: 'legR', from: [0,-12,0], target: 'torso', to: [0,6,2.2] },
    ],
    stake: { scale: .65, start: C - .16, end: release - .12, vector: [o.style === 'arc' ? .23 : .04 * S, -.86, .51], twoHands: true, clearance },
    anime: { run: [.72, P - .08], cycles: o.steps, charge: [C + .18, H - o.snap], strike: H, snap: o.snap, pin: P, release, side: S, groundYaw, style: o.style },
    trails: [[H - o.snap - .015, H + .09], [release - .3, release - .08]],
    ev: [{t:.34,hit:2,sfx:'grab',hs:.035,shake:.08,at:'head'}, {t:.58,sfx:'swing'}, {t:.98,hit:4,fx:'impact',at:'ground',imp:1,hs:.065,shake:.3}, {t:.99,fx:'ring',at:'ground',r:1.7}, {t:P,hit:2,sfx:'heavy',hs:.035,shake:.12}, {t:C+.12,fx:'charge',at:'att'}, {t:H-o.snap,sfx:'swing'}, {t:H,hit:9,fx:'stab',at:'head',imp:1,hs:o.style==='tension'?.22:.14,shake:o.style==='heavy'?.9:.6,slow:.14}, {t:H+.015,fx:'ring',at:'head',r:o.style==='heavy'?2.1:1.4,face:1}, {t:release-.26,sfx:'draw'}, {t:release,letGo:1.8}],
    shots,
  };
}
for (const variant of IMPALE_VARIANTS) CHORE[variant.id] = createR6Impale(variant);


// ===== Ataques del despertar =====
// estilos del agarre con cinemática: pose al levantar, golpes, preparación, remate y efectos
const STY = {
  punch: { lift: 'lift', hit: [['jabR_w', 'jabR'], ['jabL_w', 'jabL']], wind: 'windup', fin: 'mega' },
  spear: { lift: 'upthrust', hit: [['thrust_w', 'thrust'], ['sweep_w', 'sweep']], wind: 'overhead', fin: 'plunge' },
  magic: { lift: 'castUp', hit: [['signs', 'magicPalm'], ['twirlPose', 'magicPalm']], wind: 'scepterW', fin: 'scepterSmash' },
  eyes: { lift: 'grab', hit: [['visorTouch', 'visorTouch'], ['redStance', 'jabR']], wind: 'charge', fin: 'redHero' },
  shadow: { lift: 'lift', hit: [['slashW', 'slash'], ['hook_w', 'hook']], wind: 'slashW', fin: 'slash' },
  elec: { lift: 'grab', hit: [['charge', 'palm'], ['cast', 'palm']], wind: 'castUp', fin: 'palm' },
  fire: { lift: 'lift', hit: [['kick_w', 'kick'], ['jabR_w', 'jabR']], wind: 'charge', fin: 'kick' },
  ice: { lift: 'castUp', hit: [['palm', 'cast'], ['signs', 'palm']], wind: 'signs', fin: 'palm' },
  titan: { lift: 'lift', hit: [['lift', 'suplex'], ['stomp', 'lift']], wind: 'lift', fin: 'suplex' },
};
function styleFx(style, f, tg, col, big) {
  const c = chestOf(tg);
  impactStar(c, big ? col : '#ffffff', big ? 3 : 1.4, big ? .3 : .16); sparkLines(c, col, big ? 12 : 5, big ? 2.6 : 1.4);
  burst(c, big ? 40 : 12, col, big ? 13 : 7, big ? .22 : .14, .5, .5);
  if (style === 'spear') stabFx(f, col);
  if (style === 'eyes') { const e = front(f, .35, 1.72); slashLine(e, c, col, .25, big ? .5 : .2); slashLine(e, c, '#ffffff', .18, big ? .2 : .08); }
  if (style === 'magic' && big) copiesAround(tg, 4, 1.6, .7);
  if (style === 'elec') for (let i = 0; i < 3; i++) { const a = c.clone().add(new V3(rand(-1, 1), rand(-1, 1), rand(-1, 1))); slashLine(c, a, '#fff59d', .15, .06); }
  if (style === 'fire') fireColumn(new V3(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z), big ? 2 : .8, col, big ? 6 : 2.5);
  if (style === 'ice') iceSpikes(new V3(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z), big ? 2.4 : 1, col, big ? 10 : 3);
  if (style === 'shadow') slashLine(c.clone().add(new V3(-1.2, 1.2, 0)), c.clone().add(new V3(1.2, -1.2, 0)), col, .3, .12);
  if (big) { sphereFlash(c, col, 2.4, .4); ringAt(c, '#ffffff', 4, .45, 'face', f.yaw); if (style === 'titan' || style === 'punch') crackDecal(new V3(tg.pos.x, groundAt(tg.pos.x, tg.pos.z), tg.pos.z), 4); }
}
// campos de daño en el piso
const ZONES = [];
function makeZone(f, o) {
  const p = new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z), r = o.r || 6, dur = o.dur || 5, col = o.color;
  const grp = new THREE.Group(); grp.position.set(p.x, p.y + .05, p.z);
  const dg = new THREE.CircleGeometry(r, 48), rg = new THREE.RingGeometry(r - .18, r, 64), dm = glowMat(col, .16), rm = glowMat(col, .9);
  const disc = new THREE.Mesh(dg, dm), ring = new THREE.Mesh(rg, rm); disc.rotation.x = ring.rotation.x = -Math.PI / 2; grp.add(disc, ring);
  const extra = [];
  if (o.fx === 'laser') for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(r * 2, .05, .05), glowMat(col, .85)); m.position.y = .5 + i * .45; m.rotation.y = i * Math.PI / 4; grp.add(m); extra.push(m); }
  addFx(grp, dur, (g, k) => {
    dm.opacity = .1 + .08 * Math.sin(k * 40); ring.rotation.z = k * 6;
    extra.forEach((m, i) => { m.rotation.y += .04 * (i % 2 ? 1 : -1); });
    const s = k < .08 ? k / .08 : 1; g.scale.set(s, 1, s);
  }, () => { dg.dispose(); rg.dispose(); dm.dispose(); rm.dispose(); extra.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); });
  ZONES.push({ f, p, r, t: 0, dur, acc: 0, o });
  ringAt(p, col, r * 1.2, .5); ringAt(p, '#ffffff', r * .8, .35); shakeFrom(p, .4); sfx('boom', p, .7);
}
const ZONE_PART = { magic: ['#3ddc84', '#ffd54f'], laser: ['#ff2d55', '#ffffff'], shadow: ['#4a148c', '#d65cff'], elec: ['#fff59d', '#33e1ff'], fire: ['#ff6d00', '#ffd54f'], ice: ['#ffffff', '#bfe3ff'], wind: ['#ffffff', '#ff8a80'], earth: ['#6b5a3e', '#a1887f'] };
function updateZones(dt) {
  for (let i = ZONES.length - 1; i >= 0; i--) {
    const z = ZONES[i]; z.t += dt; z.acc += dt;
    const pc = ZONE_PART[z.o.fx] || [z.o.color, '#ffffff'];
    if (Math.random() < dt * 30) { const a = rand(0, TAU), rr = Math.sqrt(Math.random()) * z.r; emit(z.p.x + Math.cos(a) * rr, z.p.y + .1, z.p.z + Math.sin(a) * rr, 0, rand(2, 6), 0, pc[Math.random() < .5 ? 0 : 1], rand(.08, .18), rand(.4, .9), -.1, 1); }
    if (z.acc >= .4) {
      z.acc -= .4;
      for (const g of enemiesOf(z.f)) if (Math.hypot(g.pos.x - z.p.x, g.pos.z - z.p.z) < z.r && g.pos.y - z.p.y < 3)
        applyHit(z.f, g, { dmg: z.o.dmg || 2.5, stun: z.o.stun || .35, kb: z.o.kb || 0, up: z.o.up || 0, color: z.o.color, hitstop: 0, shake: .05, freeze: z.o.freeze, dir: new V3(g.pos.x - z.p.x, 0, g.pos.z - z.p.z) });
    }
    if (z.t >= z.dur || !G.fighters.includes(z.f)) ZONES.splice(i, 1);
  }
}
// copia translúcida en un punto (para los cortes de las copias)
function copyAt(f, pos, yaw, life = .35) {
  const g = f.model.root.clone(true), mat = glowMat(f.ch.color, .5);
  g.traverse(o => { if (o.isMesh) { if (o.material === f.model.mats[1] || o.material === OUTLINE_MAT || o.userData.fx) o.visible = false; else { o.material = mat; o.castShadow = false; } } });
  g.position.copy(pos); g.rotation.y = yaw;
  addFx(g, life, (o, k) => { mat.opacity = .5 * (1 - k); }, () => mat.dispose());
}
function pullHit(f, g, o) {
  slashLine(chestOf(f), chestOf(g), o.color, .4, .1); slashLine(chestOf(f), chestOf(g), '#ffffff', .25, .04);
  applyHit(f, g, { dmg: 4, stun: 1, kb: -Math.min(26, dist2d(f, g) * 3.2), up: 3, color: o.color, guardBreak: true, hitstop: .05 });
  sfx('grab', f.pos);
  later(.32, () => {
    if (!f.alive || !g.alive || dist2d(f, g) > 4.5) return;
    if (f.action) endAction(f);
    f.yaw = yawTo(f, g);
    startAction(f, { name: 'pullfin', dur: .4, armor: true, anim: [[0, 'upper_w', 900], [.06, 'upper', 1300]], steps: [{ at: .07, fn: () => { arcSlash(f, o.color, { tilt: 1.57, r: 1.8, len: 2.4 }); hitArea(f, front(f, 1.3, 1.1), 1.7, { dmg: o.dmg || 11, kb: 4, up: 16, ragdoll: 1.2, color: o.color, guardBreak: true, hitstop: .1, shake: .5 }); } }] });
  });
}
// Ilusión: copia verde translúcida del peleador que corre al rival más cercano y explota (o queda quieta como señuelo)
function decoy(f, o, from, opts) {
  const g = f.model.root.clone(true), mat = glowMat(o.color, .5), pos = from.clone();
  g.traverse(m => { if (m.isMesh) { if (m.material === f.model.mats[1] || m.material === OUTLINE_MAT || m.userData.fx) m.visible = false; else { m.material = mat; m.castShadow = false; } } });
  g.position.copy(pos);
  const life = opts.life || 2.6, speed = opts.speed || 11;
  let lastK = 0, boomed = false;
  const boom = () => {
    if (boomed) return; boomed = true;
    const c = new V3(pos.x, pos.y + 1, pos.z);
    explode(f, c, opts.r || 2.6, { dmg: opts.dmg || 7, kb: 12, up: 8, ragdoll: .9, guardBreak: true, color: o.color });
    burst(c, 24, '#ffd54f', 7, .18, .5, -.2);
  };
  addFx(g, life, (obj, k) => {
    const dt = (k - lastK) * life; lastK = k;
    if (boomed) { obj.visible = false; return; }
    if (opts.static) { if (k * life > (opts.fuse || .7)) boom(); }
    else {
      let best = null, bd = 1e9;
      for (const e of enemiesOf(f)) { const d = Math.hypot(e.pos.x - pos.x, e.pos.z - pos.z); if (d < bd) { bd = d; best = e; } }
      if (best && bd < 24) {
        const dx = best.pos.x - pos.x, dz = best.pos.z - pos.z, d = Math.hypot(dx, dz) || 1;
        pos.x += dx / d * speed * dt; pos.z += dz / d * speed * dt; obj.rotation.y = Math.atan2(dx, dz);
        if (d < 1.3) boom();
      }
      obj.position.set(pos.x, pos.y + Math.abs(Math.sin(k * life * 14)) * .15, pos.z);
      if (Math.random() < .3) emit(pos.x, pos.y + rand(.2, 1.8), pos.z, 0, rand(.5, 2), 0, o.color, .1, .4, -.1, 1);
    }
    mat.opacity = .5 * (.8 + .2 * Math.sin(k * life * 30));
    if (k > .96) boom();
  }, () => mat.dispose());
}
function fallingSpear(f, p, delay, scale, o, big) {
  warnCircle(p, big ? 5 : 1.6, o.color, delay + .3);
  later(delay, () => {
    const m = buildSpear(scale), H = 14, tipOff = 26 * PX * scale, total = big ? 1.6 : 1.0;
    m.rotation.x = Math.PI / 2;
    addFx(m, total, (s, k) => {
      const tt = k * total, kf = Math.min(1, tt / .3);
      s.position.set(p.x, p.y + tipOff - .5 * scale + H * (1 - kf * kf), p.z);
      if (tt > total - .25) { const sc = Math.max(.01, (total - tt) / .25); s.scale.set(sc, sc, sc); }
    }, () => { m.geometry.dispose(); m.material.dispose(); });
    later(.3, () => {
      if (big) {
        explode(f, new V3(p.x, p.y + .8, p.z), 5, { dmg: 18, kb: 16, up: 14, ragdoll: 1.8, guardBreak: true, color: o.color });
        ringAt(p, '#ffffff', 9, .6); burst(new V3(p.x, p.y + .3, p.z), 60, '#6b5a3e', 14, .3, 1, 1.4, 8);
        if (involvesPlayerNear(f)) screenFlash(.5);
        shakeFrom(p, 1.1);
      } else explode(f, new V3(p.x, p.y + .6, p.z), 1.7, { dmg: 5, kb: 4, up: 6, stun: .5, color: o.color });
    });
  });
}
const MOVES = {
  barrage(f, o) {
    const hits = o.hits || 10, dur = o.dur || 1; let n = 0;
    startAction(f, {
      name: 'barrage', dur, procedural: 'barrage', speedMul: .25, aim: true,
      tick: (a, t) => {
        const want = Math.min(hits, Math.floor(t / dur * hits) + 1);
        while (n < want) {
          n++; const last = n === hits;
          hitArea(f, front(f, 1.4, 1.1), 1.5, last
            ? { dmg: 5, kb: 15, up: 6, ragdoll: .9, color: o.color, hitstop: .07, shake: .3 }
            : { dmg: o.dmg || 1.6, stun: .4, kb: 1.2, color: o.color, hitstop: 0, shake: .06 });
          fistFx(f, o.color); fistFx(f, o.color);
          if (n % 3 === 0 || last) arcSlash(f, o.color, { tilt: rand(-1, 1), r: rand(1.2, 1.6), w: .3, len: 1.6, dur: .14, dir: n % 2 ? 1 : -1 });
          if (last) a.anim = [[t, 'mega', 1100]], a.procedural = null;
          if (n % 2) sfx('swing', f.pos, .4);
        }
      },
    });
  },
  rush(f, o) {
    let hit = false;
    startAction(f, {
      name: 'rush', dur: .55, anim: [[0, o.pose || 'run', 800]], aim: true, noControl: true, lockYaw: true, ghost: true,
      start: () => sfx('dash', f.pos),
      tick: (a, t) => {
        if (hit) return;
        const F = fwd(f.yaw); f.vel.x = F.x * 27; f.vel.z = F.z * 27;
        emit(f.pos.x, f.pos.y + rand(.3, 1.6), f.pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), o.color, .2, .3, 0, 3);
        const n = hitArea(f, front(f, .9, 1.1), 1.15, { dmg: o.dmg || 9, kb: o.kb != null ? o.kb : 3, up: o.up != null ? o.up : 17, ragdoll: o.ragdoll || 1.3, color: o.color, guardBreak: true, hitstop: .1, shake: .45 });
        if (n) {
          hit = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1;
          if (o.fin === 'upper') { f.vel.y = 7; a.anim = [[t, 'upper', 1100]]; arcSlash(f, o.color, { tilt: 1.57, r: 1.6, len: 2.4 }); }
          else { a.anim = [[t, o.hitPose || 'mega', 1100]]; arcSlash(f, o.color, { tilt: .3, r: 1.8, len: 2.4, w: .7 }); }
          a.t = Math.max(a.t, a.dur - .3);
        }
      },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  },
  slam(f, o) {
    let phase = 0;
    startAction(f, {
      name: 'slam', dur: 1.6, anim: [[0, o.upPose || 'slamUp', 500]], noControl: true, aim: true,
      start: () => { const F = fwd(f.yaw), fw = o.fwd != null ? o.fwd : 7; f.vel.set(F.x * fw, o.jump || 14, F.z * fw); f.onGround = false; sfx('jump', f.pos, 2); },
      tick: (a, t) => {
        if (phase === 0 && o.track) { const tg = findTarget(f, 14); if (tg) { f.vel.x = (tg.pos.x - f.pos.x) * 2.4; f.vel.z = (tg.pos.z - f.pos.z) * 2.4; f.yaw = yawTo(f, tg); } }
        if (phase === 0 && t > .38) { phase = 1; f.vel.y = -38; f.vel.x *= .3; f.vel.z *= .3; a.anim = [[t, o.downPose || 'slamDown', 900]]; a.ghost = true; }
        if (phase === 1 && f.onGround) {
          phase = 2; a.ghost = false; f.vel.set(0, 0, 0); a.anim = [[t, o.landPose || 'stomp', 1000]];
          explode(f, new V3(f.pos.x, f.pos.y + .6, f.pos.z), o.radius || 5, { dmg: o.dmg || 11, kb: 15, up: 9, ragdoll: 1.1, guardBreak: true, noRC: true, color: o.color });
          burst(new V3(f.pos.x, .3, f.pos.z), 40, '#5d9e3a', 12, .3, 1, 1.4, 8);
          a.t = Math.max(a.t, a.dur - .3);
        }
      },
    });
  },
  wave(f, o) {
    startAction(f, {
      name: 'wave', dur: .65, anim: [[0, 'charge', 600], [.25, 'palm', 1000]], speedMul: 0,
      tick: (a, t) => { if (t < .25) { const p = chestOf(f), an = rand(0, TAU); emit(p.x + Math.cos(an) * 2, p.y + rand(-1, 1), p.z + Math.sin(an) * 2, -Math.cos(an) * 8, 0, -Math.sin(an) * 8, o.color, .15, .25, 0, 0); } },
      steps: [{ at: .25, fn: () => explode(f, chestOf(f), o.radius || 5, { dmg: o.dmg || 8, kb: o.kb != null ? o.kb : 18, up: o.up != null ? o.up : 9, ragdoll: o.ragdoll != null ? o.ragdoll : 1.1, stun: o.stun || 0, guardBreak: true, color: o.color }) }],
    });
  },
  shoot(f, o) {
    const thr = o.anim === 'throw';
    startAction(f, {
      name: 'shoot', bbClip: o.bbClip, dur: .45, anim: thr ? [[0, 'throwW', 700], [.12, 'throw', 1100]] : [[0, 'charge', 600], [.13, 'palm', 1000]], speedMul: .3, aim: true,
      steps: [{ at: .14, fn: () => { const n = o.count || 1; for (let i = 0; i < n; i++) spawnProj(f, f.yaw + (i - (n - 1) / 2) * (o.spread || .18), o); sfx(o.explode ? 'fire' : 'zap', f.pos, .7); } }],
    });
  },
  blink(f, o) {
    const tgt = findTarget(f, 22); if (!tgt) return false;
    startAction(f, {
      name: 'blink', bbClip: o.bbClip, dur: .55, anim: [[0, 'windup', 900]], noControl: true,
      start: () => {
        if (o.decoy) decoy(f, o, f.pos.clone(), { static: true, fuse: .7, dmg: 6, r: 2.4, life: .8 });
        const from = chestOf(f); ghost(f, o.color, .6, .4); burst(from, 18, o.color, 6, .2, .4, -.2);
        const back = fwd(tgt.yaw);
        f.pos.set(tgt.pos.x - back.x * 1.5, tgt.pos.y, tgt.pos.z - back.z * 1.5); f.vel.set(0, 0, 0);
        f.yaw = yawTo(f, tgt); slashLine(from, chestOf(f), o.color, .3, .08);
        burst(chestOf(f), 18, o.color, 6, .2, .4, -.2); sfx('tp', f.pos);
      },
      steps: [{ at: .16, fn: (a) => { a.anim = [[a.t, 'mega', 1100]]; if (tgt.alive) f.yaw = yawTo(f, tgt); arcSlash(f, o.color, { tilt: .3, r: 1.7, w: .65, len: 2.5 }); hitArea(f, front(f, 1.2, 1.1), 1.4, { dmg: o.dmg || 8, kb: o.kb || 0, up: o.up || 0, ragdoll: o.ragdoll || 0, stun: o.stun || 0, color: o.color, guardBreak: true, hitstop: .08, shake: .35 }); } }],
    });
  },
  slash(f, o) {
    let start;
    startAction(f, {
      name: 'slash', dur: .55, anim: [[0, 'slashW', 900]], noControl: true, aim: true, ghost: true,
      start: () => { start = f.pos.clone(); const F = fwd(f.yaw); f.vel.x = F.x * 55; f.vel.z = F.z * 55; f.iframes = Math.max(f.iframes, .2); sfx('slash', f.pos); },
      steps: [{
        at: .16, fn: (a) => {
          a.anim = [[a.t, 'slash', 1100]]; a.ghost = false; f.vel.x *= .05; f.vel.z *= .05;
          const end = f.pos.clone(), up = new V3(0, 1.1, 0);
          slashLine(start.clone().add(up), end.clone().add(up), o.color, .7, .16);
          arcSlash(f, o.color, { tilt: -.2, r: 1.9, w: .5, len: 3, dir: 1 });
          const marked = enemiesOf(f).filter(g => segDist(g.pos, start, end) < 1.4 && Math.abs(g.pos.y - start.y) < 2.5);
          marked.forEach(g => applyHit(f, g, { dmg: 2, stun: .9, kb: 0, color: o.color, hitstop: 0 }));
          later(.4, () => {
            marked.forEach(g => { if (g.alive) { applyHit(f, g, { dmg: o.dmg || 10, kb: 6, up: 9, ragdoll: 1, color: o.color, guardBreak: true, sound: 'slash' }); const c = chestOf(g); slashLine(c.clone().add(new V3(-1.2, 1.2, 0)), c.clone().add(new V3(1.2, -1.2, 0)), '#ffffff', .3, .1); } });
          });
        }
      }],
    });
  },
      randiNazca(f, o) {
    const pts = []; let stopped = false, last = null;
    startAction(f, {
      name: 'randiNazca', dur: 1.4, noControl: true, lockYaw: true, aim: true, ghost: true, anim: [[0, 'run', 800]],
      start: () => { sfx('dash', f.pos); popText(chestOf(f), '¡Línea de Nazca!', '#ffd23f', 22); pts.push(f.pos.clone()); last = pts[0]; },
      tick: (a, t) => {
        if (t < .42) {
          const F = fwd(f.yaw); f.vel.x = F.x * 22; f.vel.z = F.z * 22;
          emit(f.pos.x, f.pos.y + .2, f.pos.z, rand(-1, 1), rand(1, 3), rand(-1, 1), '#ffd23f', .18, .5, 0, 2);
          if (dxz(last, f.pos) > .8) { last = f.pos.clone(); pts.push(last); randiGlyph(last, 1.45 - t); }
        } else if (!stopped) { stopped = true; a.ghost = false; f.vel.x *= .1; f.vel.z *= .1; pts.push(f.pos.clone()); randiGlyph(f.pos, 1.0); }
      },
      steps: [{ at: .95, fn: () => {
        sfx('fire', f.pos);
        for (const q of pts) { burst(new V3(q.x, q.y + .2, q.z), 7, '#ffd23f', 7, .15, .5, .4); }
        ringAt(new V3(pts[pts.length - 1].x, pts[pts.length - 1].y + .1, pts[pts.length - 1].z), '#ffd23f', 4, .5);
        for (const t of enemiesOf(f)) {
          let d = 1e9; for (const q of pts) d = Math.min(d, dxz(q, t.pos));
          if (d < 1.9 && Math.abs(t.pos.y - pts[0].y) < 3) applyHit(f, t, { dmg: o.dmg || 10, kb: 3, up: 15, ragdoll: 1, rag: 1.5, color: '#ffd23f', hitstop: .08, shake: .35 });
        }
      } }],
    });
  },
                  // ---------- Seb0lla: habilidades originales (memes de Minecraft y Verity) ----------
  // Paquete Misterioso: se lanza en arco, tiembla un instante y se abre de sorpresa
  sebPackage(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw);
    startAction(f, {
      name: 'sebPackage', bbClip: 'habilidad_1_paquete', dur: .6, speedMul: .25, aim: true,
      steps: [{ at: .25, fn: () => {
        const dest = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 11, 0, f.pos.z + F.z * 11), 1.5); dest.y = groundAt(dest.x, dest.z);
        const start = front(f, .8, 2.0), T = .8, grp = new THREE.Group(), bg = new THREE.BoxGeometry(.8, .8, .8), bm = new THREE.MeshBasicMaterial({ color: '#b08040' }), rg = new THREE.BoxGeometry(.84, .16, .84), rm = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        const r1 = new THREE.Mesh(rg, rm), r2 = new THREE.Mesh(rg, rm); r2.rotation.y = Math.PI / 2; grp.add(new THREE.Mesh(bg, bm), r1, r2); grp.position.copy(start); scene.add(grp);
        sfx('swing', f.pos); warnCircle(dest, 3.6, o.color, T + .8); let t = 0, landed = false, wait = 0, closed = false, untrack = () => {};
        const done = () => { if (closed) return; closed = true; untrack(); scene.remove(grp); bg.dispose(); bm.dispose(); rg.dispose(); rm.dispose(); };
        untrack = trackSkillObj(f, 3.0, done);
        const nd = ndt(); const tick = () => { if (closed) return; const dt = nd();
          t += dt;
          if (!landed) {
            const u = Math.min(1, t / T); grp.position.set(start.x + (dest.x - start.x) * u, start.y + (dest.y + .4 - start.y) * u + 4.5 * Math.sin(Math.PI * u), start.z + (dest.z - start.z) * u); grp.rotation.x += .25; grp.rotation.z += .17;
            if (u >= 1) { landed = true; grp.rotation.set(0, 0, 0); sfx('hit', dest, .6); burst(new V3(dest.x, dest.y + .3, dest.z), 8, '#d8d0c0', 3, .2, .4, .5); }
          } else {
            wait += dt; grp.position.y = dest.y + .4 + Math.abs(Math.sin(wait * 30)) * .08 * wait; grp.rotation.y = Math.sin(wait * 40) * .25;
            if (wait >= .8) {
              const c = new V3(dest.x, dest.y + .6, dest.z); explode(f, c, 3.6, { dmg: o.dmg || 8, stun: 1.0, kb: 8, up: 9, ragdoll: .5, color: o.color, hitstop: .08, shake: .4 });
              popText(c, '¡SORPRESA!', '#ffd91a', 24); burst(c, 30, '#ffd91a', 9, .22, .6, .5); done(); return;
            }
          }
          if (G.state === 'play') later(0, tick); else done();
        };
        tick();
      } }],
    });
  },
  // Perla de Ender: se teletransporta a donde cae
  sebPearl(f, o) {
    const tg = findTarget(f, 24), F = fwd(f.yaw);
    startAction(f, {
      name: 'sebPearl', bbClip: 'habilidad_2_perla', dur: .45, speedMul: .3, aim: true,
      steps: [{ at: .18, fn: () => {
        const dest = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12);
        if (tg) { const back = new V3(f.pos.x - dest.x, 0, f.pos.z - dest.z).normalize(); dest.addScaledVector(back, 2); }
        clampArena(dest, 1.5); dest.y = groundAt(dest.x, dest.z);
        const start = front(f, .8, 1.6), T = .55, bg = new THREE.SphereGeometry(.24, 10, 8), bm = glowMat('#2fe0b0', .95), ball = new THREE.Mesh(bg, bm); ball.position.copy(start); scene.add(ball); sfx('tp', f.pos); let t = 0, closed = false, untrack = () => {};
        const done = () => { if (closed) return; closed = true; untrack(); scene.remove(ball); bg.dispose(); bm.dispose(); };
        untrack = trackSkillObj(f, 2.0, done);
        const nd = ndt(); const tick = () => { if (closed) return; const dt = nd();
          t += dt; const u = Math.min(1, t / T);
          ball.position.set(start.x + (dest.x - start.x) * u, start.y + (dest.y + .5 - start.y) * u + 3 * Math.sin(Math.PI * u), start.z + (dest.z - start.z) * u);
          emit(ball.position.x, ball.position.y, ball.position.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), '#b57aff', .14, .3, 0, 0);
          if (u < 1 && G.state === 'play') { later(0, tick); return; }
          done();
          if (G.state !== 'play') return;
          ghost(f, '#b57aff', .6, .4); burst(chestOf(f), 22, '#b57aff', 6, .2, .5, -.2);
          if (!f.remote) { f.pos.set(dest.x, dest.y, dest.z); f.vel.set(0, 0, 0); }
          ringAt(new V3(dest.x, dest.y + .1, dest.z), '#b57aff', 3, .4); sfx('tp', dest);
          explode(f, new V3(dest.x, dest.y + .8, dest.z), 2.4, { dmg: o.dmg || 5, stun: .6, kb: 5, up: 4, color: '#b57aff', hitstop: .06, shake: .25 });
        };
        tick();
      } }],
    });
  },
  // Creeper: "ssssss" mientras carga (no lo pueden interrumpir) y explota
  sebCreeper(f, o) {
    const R = o.r || 5.5;
    startAction(f, {
      name: 'sebCreeper', bbClip: 'habilidad_3_creeper', dur: 1.0, speedMul: .1, armor: true, aim: true,
      start: () => { popText(chestOf(f), 'Ssssss…', '#7dff6a', 22); sfx('zap', f.pos); warnCircle(new V3(f.pos.x, groundAt(f.pos.x, f.pos.z), f.pos.z), R, '#7dff6a', .95); },
      tick: (a, t) => { f.flashT = Math.floor(t * 10) % 2 === 0 ? .08 : 0; if (Math.random() < .5) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(.5, 1.8), f.pos.z + rand(-.4, .4), 0, rand(1, 3), 0, '#7dff6a', .16, .4, 0, 1); },
      steps: [{ at: .9, fn: () => {
        const c = new V3(f.pos.x, f.pos.y + 1, f.pos.z); popText(chestOf(f), '¡BOOM!', '#ffb03a', 28);
        explode(f, c, R, { dmg: o.dmg || 12, kb: 12, up: 9, ragdoll: 1, color: '#ffb03a', guardBreak: true, hitstop: .12, shake: .6 }); burst(c, 40, '#7dff6a', 10, .25, .7, .3);
      } }],
    });
  },
  // Yunque: la marca sigue al rival un momento y cae un yunque
  sebAnvil(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), P = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8), 1.5);
    startAction(f, {
      name: 'sebAnvil', bbClip: 'habilidad_4_yunque', dur: .7, speedMul: .2, aim: true,
      steps: [{ at: .3, fn: () => {
        const bg = new THREE.BoxGeometry(1.3, .5, .9), tg2 = new THREE.BoxGeometry(.8, .45, .6), bm = new THREE.MeshBasicMaterial({ color: '#4a505c' }), an = new THREE.Group(), b = new THREE.Mesh(bg, bm), t2 = new THREE.Mesh(tg2, bm); t2.position.y = .45; an.add(b, t2); scene.add(an);
        sfx('whoosh', P); let t = 0, warned = false, closed = false, untrack = () => {}; const R = 2.6;
        const done = () => { if (closed) return; closed = true; untrack(); scene.remove(an); bg.dispose(); tg2.dispose(); bm.dispose(); };
        untrack = trackSkillObj(f, 2.5, done);
        const nd = ndt(); const tick = () => { if (closed) return; const dt = nd();
          t += dt;
          if (t < .6 && tg && tg.alive) { P.x += (tg.pos.x - P.x) * .08; P.z += (tg.pos.z - P.z) * .08; }
          P.y = groundAt(P.x, P.z);
          if (!warned) { warned = true; warnCircle(P, R, '#cfd3da', .9); }
          const u = clamp((t - .6) / .35, 0, 1); an.position.set(P.x, P.y + .3 + 16 * (1 - u * u), P.z);
          if (t >= .95) {
            const c = new V3(P.x, P.y + .8, P.z); explode(f, c, R, { dmg: o.dmg || 11, kb: 2, up: 3, ragdoll: 1.2, color: '#cfd3da', guardBreak: true, hitstop: .12, shake: .6 }); crackDecal(new V3(P.x, P.y, P.z), 3); sfx('heavy', c); popText(c, '¡CLONC!', '#ffffff', 24);
            later(.6, done); return;
          }
          if (G.state === 'play') later(0, tick); else done();
        };
        tick();
      } }],
    });
  },
  // Rayo de Verity (despierta): Verity se pone delante, se enfada y dispara
  sebBeam(f, o) {
    verityGo(f, () => front(f, 3.4, 2.4), 2.1, 1.5, 'angry');
    MOVES.beam(f, { eyes: false, len: 30, width: 1.1, dur: 1.2, dmg: o.dmg || 3, charge: .7, push: 8, gb: true, color: '#ffd91a', fromFn: () => (f.verity ? f.verity.pos.clone() : front(f, 3.4, 2.4)), bbClip: 'despertar_rayo' });
  },
  // Variantes (despierta): Lovity lo cura y Antiverity dispara sombras
  sebVariants(f, o) {
    startAction(f, {
      name: 'sebVariants', bbClip: 'despertar_variantes', dur: .9, speedMul: .15, aim: true,
      steps: [{ at: .38, fn: () => {
        const dur = o.dur || 9, ents = ['love', 'anti'].map((k, i) => { const v = makeVerity(k); v.g.scale.setScalar(.01); v.pos = new V3(f.pos.x, f.pos.y + 2, f.pos.z); scene.add(v.g); return { v, kind: k, ang: i * Math.PI, cd: .8 + i * .4 }; });
        sfx('tp', f.pos); burst(chestOf(f), 20, '#ff7ab8', 6, .2, .5, .3); popText(chestOf(f), '¡Mis amigas!', '#ff7ab8', 20); let t = 0, closed = false, untrack = () => {};
        const stop = () => { if (closed) return; closed = true; untrack(); ents.forEach(e => disposeVerity(e.v)); };
        untrack = trackSkillObj(f, dur + 1.0, stop);
        const nd = ndt(); const loop = () => { if (closed) return; const dt = nd();
          t += dt;
          for (const e of ents) {
            e.ang += dt * 2.2; const tx = f.pos.x + Math.cos(e.ang) * 2.3, tz = f.pos.z + Math.sin(e.ang) * 2.3, ty = f.pos.y + 2 + .4 * Math.sin(t * 3 + e.ang);
            e.v.pos.lerp(new V3(tx, ty, tz), Math.min(1, dt * 8)); e.v.g.position.copy(e.v.pos); e.v.g.scale.setScalar(Math.max(.01, Math.min(1, t * 3) * .55 * (t > dur - 1 ? Math.max(0, dur - t) : 1))); verityBillboard(e.v);
            e.cd -= dt;
            if (e.cd <= 0 && f.alive) {
              if (e.kind === 'love') { e.cd = 1; if (f.hp < f.maxHp) { f.hp = Math.min(f.maxHp, f.hp + 1.5); burst(chestOf(f), 5, '#ff7ab8', 3, .14, .4, 1); } }
              else {
                let best = null, bd = 20; for (const g of enemiesOf(f)) { const d = chestOf(g).distanceTo(e.v.pos); if (d < bd) { bd = d; best = g; } }
                if (best) { e.cd = 1.1; const c = chestOf(best); spawnProj(f, Math.atan2(c.x - e.v.pos.x, c.z - e.v.pos.z), { from: e.v.pos.clone(), color: '#7a5cff', speed: 34, size: .28, long: 1.4, homing: 3.5, range: 24, dmg: 3, stun: .35, kb: 2 }); sfx('zap', e.v.pos, .4); } else e.cd = .3;
              }
            }
          }
          if (t < dur && f.alive && G.state === 'play') later(0, loop); else stop();
        };
        loop();
      } }],
    });
  },
  // Eclipse (despierta): Verity se hace enorme sobre el rival y cae de golpe
  sebEclipse(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), C = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8), 2), R = o.r || 6.5; C.y = groundAt(C.x, C.z);
    startAction(f, {
      name: 'sebEclipse', bbClip: 'despertar_eclipse', dur: 2.2, speedMul: .15, aim: true, armor: true,
      steps: [
        { at: .4, fn: () => { verityGo(f, () => new V3(C.x, C.y + 9, C.z), 1.4, 3.4, 'open'); warnCircle(C, R, '#ffd91a', 1.45); sfx('whoosh', C); popText(chestOf(f), '¡Eclipse!', '#ffd91a', 24); screenFlash(.2); } },
        { at: 1.75, fn: () => verityGo(f, () => new V3(C.x, C.y + 1.4, C.z), .35, 3.4, 'angry') },
        { at: 1.9, fn: () => { explode(f, new V3(C.x, C.y + 1, C.z), R, { dmg: o.dmg || 14, kb: 10, up: 12, ragdoll: 1.2, color: '#ffd91a', guardBreak: true, hitstop: .12, shake: .6 }); lightColumn(C, '#ffd91a', 24); screenFlash(.5); sfx('boom', C); } },
      ],
    });
  },
      // ---------- Seb0lla v3 ----------
  // Control Remoto: manejas a Verity con el teclado mientras Seb0lla se queda quieto
  sebRemote(f, o) {
    const dur = o.dur || 3.4;
    startAction(f, {
      name: 'sebRemote', dur: dur + .5, noControl: true, speedMul: 0, anim: [[0, 'point', 500]],
      start: () => {
        popText(chestOf(f), '¡Control remoto!', '#ffd91a', 20); sfx('tp', f.pos);
        const P = front(f, 1.5, 2.2); f.sebRem = { pos: P.clone(), t: 0, dur, hit: new Map(), dmg: o.dmg || 3.5 };
        verityGo(f, () => (f.sebRem ? f.sebRem.pos : front(f, .4, 2.6)), dur + .3, 1.1, 'open');
      },
      onEnd: () => { f.sebRem = null; if (f.verity) f.verity.ov = null; },
    });
  },
  // Ruleta de Verity: apuesta con resultado al azar
  sebRoulette(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), C = tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 6, f.pos.y, f.pos.z + F.z * 6);
    startAction(f, {
      name: 'sebRoulette', dur: 1.5, noControl: true, speedMul: 0, aim: true, anim: [[0, 'castUp', 500]],
      start: () => {
        popText(chestOf(f), '¡Gira, Verity!', '#ffd91a', 20); sfx('whoosh', f.pos);
        const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g2 = cv.getContext('2d'), cols = ['#ff4d4d', '#4dd2ff', '#ffd91a', '#7dff6a', '#b06bff'];
        for (let i = 0; i < 5; i++) { g2.fillStyle = cols[i]; g2.beginPath(); g2.moveTo(64, 64); g2.arc(64, 64, 62, i / 5 * TAU, (i + 1) / 5 * TAU); g2.fill(); }
        g2.strokeStyle = '#fff'; g2.lineWidth = 5; g2.beginPath(); g2.arc(64, 64, 61, 0, TAU); g2.stroke(); g2.fillStyle = '#1b1306'; g2.beginPath(); g2.arc(64, 64, 9, 0, TAU); g2.fill();
        const tex = new THREE.CanvasTexture(cv), ge = new THREE.CircleGeometry(1.2, 20), ma = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), wh = new THREE.Mesh(ge, ma);
        addFx(wh, 1.2, (ob, k) => { ob.position.set(f.pos.x, f.pos.y + 3.6, f.pos.z); ob.quaternion.copy(camera.quaternion); ob.rotateZ(-(1 - Math.pow(1 - k, 3)) * 22); const sc = k < .15 ? k / .15 : k > .85 ? 1 + (k - .85) * 2 : 1; ob.scale.setScalar(Math.max(.01, sc)); ma.opacity = k > .9 ? (1 - k) / .1 : 1; }, () => { ge.dispose(); ma.dispose(); tex.dispose(); });
      },
      steps: [{ at: 1.2, fn: () => {
        const r = Math.random() * 100;
        if (r < 28) { popText(chestOf(f), '¡BOOM!', '#ff4d4d', 28); explode(f, new V3(C.x, groundAt(C.x, C.z) + 1, C.z), 4.2, { dmg: o.dmg || 11, kb: 10, up: 11, ragdoll: 1, color: '#ff4d4d', guardBreak: true, hitstop: .1, shake: .5 }); }
        else if (r < 50) { popText(chestOf(f), '¡CURA!', '#4dd2ff', 28); f.hp = Math.min(f.maxHp, f.hp + 26); burst(chestOf(f), 24, '#4dd2ff', 6, .2, .6, .4); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#4dd2ff', 3, .5); }
        else if (r < 72) { popText(chestOf(f), '¡TURBO!', '#ffd91a', 28); f.turbo = 6; burst(chestOf(f), 24, '#ffd91a', 8, .2, .6, .4); }
        else if (r < 92) { popText(chestOf(f), '¡ESCUDO!', '#7dff6a', 28); f.sebShield = 20; f.sebShieldT = 5; f.sebAbs = 0; burst(chestOf(f), 24, '#7dff6a', 6, .2, .6, .4); }
        else { popText(chestOf(f), 'Nada…', '#b06bff', 24); burst(chestOf(f), 8, '#b06bff', 4, .15, .5, .3); }
        sfx('tp', f.pos);
      } }],
    });
  },
  // Cuenta Regresiva: calcomanía-bomba que se contagia
  sebBomb(f, o) {
    const tg = findTarget(f, 22); if (!tg) return false;
    startAction(f, {
      name: 'sebBomb', dur: .8, speedMul: .2, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Pégate, Verity!', '#ffd91a', 20),
      steps: [
        { at: .2, fn: () => { verityGo(f, () => chestOf(tg).add(new V3(0, .8, 0)), .55, .9, 'angry'); slashLine(chestOf(f), chestOf(tg), '#ffd91a', .3, .12); sfx('whoosh', f.pos); } },
        { at: .55, fn: () => { if (tg.alive) { tg.sebBomb = { t: 3.4, by: f, dmg: o.dmg || 12 }; popText(chestOf(tg), '¡3!', '#ffd91a', 30); burst(chestOf(tg), 14, '#ffd91a', 6, .18, .4, .2); sfx('hit', tg.pos); } } },
      ],
    });
  },
  // Buffering: círculo de carga sobre todos los rivales
  sebBuffer(f, o) {
    startAction(f, {
      name: 'sebBuffer', dur: 1.0, noControl: true, speedMul: 0, armor: true, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), 'Cargando…', '#ffd91a', 22),
      steps: [{ at: .4, fn: () => {
        const dur = o.dur || 3.5; verityGo(f, () => new V3(f.pos.x, f.pos.y + 6, f.pos.z), 1.2, 2.2, 'open'); screenFlash(.2); sfx('ult', f.pos);
        for (const g of enemiesOf(f)) { if (Math.hypot(g.pos.x - f.pos.x, g.pos.z - f.pos.z) > 32) continue; g.buf = dur; popText(chestOf(g), '⌛', '#ffd91a', 24); ringAt(new V3(g.pos.x, g.pos.y + .1, g.pos.z), '#ffd91a', 2.5, .6); }
      } }],
    });
  },
  // ---------- Seb0lla y Verity ----------
  // Verity Rebotona: pelota que rebota por el piso y las paredes y vuelve
  sebBounce(f, o) {
    startAction(f, {
      name: 'sebBounce', dur: .6, speedMul: .25, aim: true, anim: [[0, 'throw', 500]],
      start: () => popText(chestOf(f), '¡Verity, rebota!', '#ffd91a', 20),
      steps: [{ at: .2, fn: () => {
        const F = fwd(f.yaw), pos = front(f, .8, 1.6), vel = new V3(F.x * 21, 5, F.z * 21), hit = new Map(), nd = ndt(); let bounces = 0, life = 0, back = false, done = false;
        verityGo(f, () => pos, 7, .9, 'open'); sfx('whoosh', pos);
        const end = () => { if (done) return; done = true; if (f.verity) f.verity.ov = null; };
        const tick = () => {
          const dt = nd(); life += dt;
          if (!back) {
            vel.y -= 24 * dt; pos.addScaledVector(vel, dt);
            const gy = groundAt(pos.x, pos.z) + .5;
            if (pos.y < gy) {
              pos.y = gy; vel.y = Math.abs(vel.y) * .88 + 3; bounces++;
              ringAt(new V3(pos.x, gy - .4, pos.z), '#ffd91a', 2.4, .3); burst(pos, 8, '#ffd91a', 5, .14, .3, .2); sfx('hit', pos, .5);
              hitArea(f, pos, 2.1, { dmg: o.dmg || 4, kb: 5, up: 7, stun: .3, color: '#ffd91a', hitstop: .03 });
            }
            if (groundAt(pos.x + vel.x * dt * 3, pos.z + vel.z * dt * 3) > pos.y + .1) { vel.x *= -.9; vel.z *= -.9; }
            for (const t of enemiesOf(f)) if (chestOf(t).distanceTo(pos) < 1.4 && G.time - (hit.get(t) || -9) > .45) { hit.set(t, G.time); if (applyHit(f, t, { dmg: o.dmg || 4, kb: 7, up: 6, stun: .3, color: '#ffd91a', hitstop: .04 }) && f.verity) f.verity.angryT = .4; }
            if (bounces >= 5 || life > 2.8) back = true;
          } else {
            const d = chestOf(f).sub(pos); if (d.length() < 1.3) { end(); return; } pos.addScaledVector(d.normalize(), 28 * dt);
          }
          emit(pos.x, pos.y, pos.z, rand(-1, 1), rand(0, 1), rand(-1, 1), '#ffd91a', .12, .3, 0, 1);
          if (f.alive && G.state === 'play' && life < 6) later(0, tick); else end();
        };
        tick();
      } }],
    });
  },
  // Sonrisa Eterna: pozo de gravedad con Verity gigante que sonríe y luego parpadea
  sebStare(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), C = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 8, 0, f.pos.z + F.z * 8), 2), R = o.r || 5; C.y = groundAt(C.x, C.z);
    startAction(f, {
      name: 'sebStare', dur: .9, speedMul: .2, aim: true, anim: [[0, 'point', 500]],
      start: () => popText(chestOf(f), '¡Sonríe!', '#ffd91a', 22),
      steps: [{ at: .35, fn: () => {
        verityGo(f, () => new V3(C.x, C.y + 3.4, C.z), 2.9, 2.6, 'happy'); warnCircle(C, R, '#ffd91a', 2.6); sfx('whoosh', C);
        const nd = ndt(); let t = 0, blinked = false;
        const tick = () => {
          const dt = nd(); t += dt;
          for (const g of enemiesOf(f)) {
            if (g.remote || g.ragdoll > 0 || g.cineLock) continue;
            const dx = C.x - g.pos.x, dz = C.z - g.pos.z, d = Math.hypot(dx, dz);
            if (d < R && d > .7) { const st = Math.min(d - .6, 6 * dt); g.pos.x += dx / d * st; g.pos.z += dz / d * st; }
          }
          if (Math.random() < .5) { const a = rand(0, TAU), r = rand(R * .5, R); emit(C.x + Math.cos(a) * r, C.y + .3, C.z + Math.sin(a) * r, -Math.cos(a) * 5, rand(0, 2), -Math.sin(a) * 5, '#ffd91a', .14, .4, 0, 1); }
          if (t > 2.1 && !blinked) { blinked = true; verityGo(f, () => new V3(C.x, C.y + 1.8, C.z), .7, 3, 'angry'); popText(new V3(C.x, C.y + 3, C.z), '*parpadea*', '#ffd91a', 20); }
          if (t >= 2.5) { explode(f, new V3(C.x, C.y + 1, C.z), R, { dmg: o.dmg || 10, kb: 9, up: 12, ragdoll: 1.2, color: '#ffd91a', guardBreak: true, hitstop: .1, shake: .5 }); lightColumn(C, '#ffd91a', 18); return; }
          if (f.alive && G.state === 'play') later(0, tick);
        };
        tick();
      } }],
    });
  },
  // ¡Cámbiame, Verity!: Verity vuela y Seb0lla se cambia de lugar con ella (o con el rival que esté ahí)
  sebSwap(f, o) {
    const tg = findTarget(f, 26), F = fwd(f.yaw), dest = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 12, 0, f.pos.z + F.z * 12), 1.5); dest.y = groundAt(dest.x, dest.z);
    const from = f.pos.clone();
    startAction(f, {
      name: 'sebSwap', dur: .75, speedMul: .2, aim: true, anim: [[0, 'point', 500]],
      start: () => popText(chestOf(f), '¡Cámbiame, Verity!', '#ffd91a', 20),
      steps: [
        { at: .15, fn: () => { verityGo(f, () => new V3(dest.x, dest.y + 1.6, dest.z), .55, 1.1, 'angry'); ringAt(new V3(dest.x, dest.y + .1, dest.z), '#ffd91a', 3, .4); slashLine(chestOf(f), new V3(dest.x, dest.y + 1.6, dest.z), '#ffd91a', .3, .15); sfx('whoosh', dest); } },
        { at: .45, fn: () => {
          const sw = enemiesOf(f).find(g => !g.remote && g.alive && Math.hypot(g.pos.x - dest.x, g.pos.z - dest.z) < 2.7);
          burst(chestOf(f), 22, '#ffd91a', 7, .2, .5, .2); ringAt(new V3(from.x, from.y + .1, from.z), '#ffd91a', 2.5, .4);
          f.pos.set(dest.x, dest.y, dest.z); f.vel.set(0, 0, 0); burst(chestOf(f), 22, '#ffffff', 7, .2, .5, .2); sfx('tp', f.pos);
          if (sw) { sw.pos.set(from.x, from.y, from.z); sw.vel.set(0, 0, 0); applyHit(f, sw, { dmg: o.dmg || 6, stun: .9, kb: 0, up: 4, color: '#ffd91a', guardBreak: true, hitstop: .08 }); popText(chestOf(sw), '¡CAMBIADO!', '#ffd91a', 22); }
          else explode(f, new V3(dest.x, dest.y + 1, dest.z), 3.2, { dmg: o.dmg || 6, stun: .8, kb: 6, up: 6, color: '#ffd91a' });
          verityGo(f, () => front(f, .4, 2.6), .6, 1, 'happy');
        } },
      ],
    });
  },
  // Muro de Risa: escudo que absorbe y devuelve en una onda
  sebWall(f, o) {
    startAction(f, {
      name: 'sebWall', dur: .75, speedMul: .3, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡Muro de risa!', '#ffd91a', 20),
      steps: [{ at: .3, fn: () => {
        const dur = o.dur || 4; f.sebShield = o.hp || 28; f.sebShieldT = dur; f.sebAbs = 0; sfx('tp', f.pos);
        verityGo(f, () => { const a = G.time * 5; return new V3(f.pos.x + Math.cos(a) * 1.7, f.pos.y + 1.4 + Math.sin(a * 1.3) * .3, f.pos.z + Math.sin(a) * 1.7); }, dur, 1.1, 'happy');
        const g = new THREE.SphereGeometry(1.7, 18, 12), mt = glowMat('#ffd91a', .22), sh = new THREE.Mesh(g, mt);
        addFx(sh, dur + .1, (o2, k) => { o2.position.set(f.pos.x, f.pos.y + 1.1, f.pos.z); mt.opacity = f.sebShield > 0 ? .12 + .14 * Math.sin(k * 60) * .5 + .1 * (f.sebShield / (o.hp || 28)) : 0; }, () => { g.dispose(); mt.dispose(); });
      } }],
    });
  },
  // Mirada Fija (despierta): paraliza al rival con la mirada y lo fulmina
  sebGaze(f, o) {
    const tg = findTarget(f, 24); if (!tg) return false;
    startAction(f, {
      name: 'sebGaze', dur: 2.4, speedMul: .1, aim: true, armor: true, anim: [[0, 'point', 500]],
      start: () => popText(chestOf(f), '¡Mírame!', '#ffd91a', 22),
      steps: [
        { at: .3, fn: () => {
          const dir = new V3(f.pos.x - tg.pos.x, 0, f.pos.z - tg.pos.z).normalize();
          verityGo(f, () => new V3(tg.pos.x + dir.x * 2.8, tg.pos.y + 2.2, tg.pos.z + dir.z * 2.8), 1.9, 1.8, 'open');
          if (!tg.remote) { tg.stun = Math.max(tg.stun, 1.55); tg.vel.set(0, 0, 0); }
          popText(chestOf(tg), '¡TE VEO!', '#ffd91a', 24); warnCircle(tg.pos, 2.2, '#ffd91a', 1.4); sfx('whoosh', tg.pos);
        } },
        { at: 1.7, fn: () => {
          const vp = f.verity ? f.verity.pos.clone() : front(f, 3, 2.4), c = chestOf(tg);
          if (f.verity) f.verity.angryT = .6; slashLine(vp, c, '#ffd91a', .5, 1.1); slashLine(vp, c, '#ffffff', .4, .45); sfx('beam', c); screenFlash(.35);
          applyHit(f, tg, { dmg: o.dmg || 14, kb: 10, up: 10, ragdoll: 1.2, guardBreak: true, color: '#ffd91a', hitstop: .12, shake: .6 });
          lightColumn(new V3(tg.pos.x, tg.pos.y, tg.pos.z), '#ffd91a', 16);
        } },
      ],
    });
  },
  // Coro de Veritys (despierta): seis mini Veritys que disparan
  sebChoir(f, o) {
    startAction(f, {
      name: 'sebChoir', dur: 1.0, speedMul: .15, aim: true,
      steps: [{ at: .4, fn: () => {
        const dur = o.dur || 8, ents = [];
        for (let i = 0; i < 6; i++) { const v = makeVerity('verity'); v.g.scale.setScalar(.01); v.pos = new V3(f.pos.x, f.pos.y + 2, f.pos.z); scene.add(v.g); ents.push({ v, ang: i / 6 * TAU, cd: .5 + i * .18 }); }
        sfx('tp', f.pos); burst(chestOf(f), 24, '#ffd91a', 7, .2, .5, .3); popText(chestOf(f), '¡Coro!', '#ffd91a', 22); let t = 0, done = false, untrack = () => {};
        const nd = ndt(), stop = () => { if (done) return; done = true; untrack(); ents.forEach(e => disposeVerity(e.v)); };
        untrack = trackSkillObj(f, dur + 2, stop);
        const tick = () => {
          if (done) return;
          const dt = nd(); t += dt;
          for (const e of ents) {
            e.ang += dt * 1.9; const R = 2.9, tx = f.pos.x + Math.cos(e.ang) * R, tz = f.pos.z + Math.sin(e.ang) * R, ty = f.pos.y + 1.9 + .5 * Math.sin(t * 3 + e.ang * 2);
            e.v.pos.lerp(new V3(tx, ty, tz), Math.min(1, dt * 8)); e.v.g.position.copy(e.v.pos); e.v.g.scale.setScalar(Math.max(.01, Math.min(1, t * 3) * .4 * (t > dur - 1 ? Math.max(0, dur - t) : 1))); verityBillboard(e.v);
            e.cd -= dt;
            if (e.cd <= 0 && f.alive) {
              let best = null, bd = 22; for (const g of enemiesOf(f)) { const d = chestOf(g).distanceTo(e.v.pos); if (d < bd) { bd = d; best = g; } }
              if (best) { e.cd = 1.4; const c = chestOf(best); verityFace(e.v, 'angry'); spawnProj(f, Math.atan2(c.x - e.v.pos.x, c.z - e.v.pos.z), { from: e.v.pos.clone(), color: '#ffd91a', speed: 36, size: .26, long: 1.3, homing: 3.2, range: 26, dmg: 1.8, stun: .25, kb: 2 }); sfx('zap', e.v.pos, .35); } else e.cd = .3;
            } else if (e.cd < .9) verityFace(e.v, 'happy');
          }
          if (t < dur && f.alive && !f._disposed && G.state === 'play') later(0, tick); else stop();
        };
        tick();
      } }],
    });
  },
  // Error Analógico (despierta): zona de VHS dañado que teletransporta a saltos
  sebGlitch(f, o) {
    const tg = findTarget(f, 22), F = fwd(f.yaw), C = clampArena(tg ? tg.pos.clone() : new V3(f.pos.x + F.x * 9, 0, f.pos.z + F.z * 9), 2), R = o.r || 5.5; C.y = groundAt(C.x, C.z);
    startAction(f, {
      name: 'sebGlitch', dur: 1.0, speedMul: .15, aim: true, armor: true,
      start: () => popText(chestOf(f), '¡Error!', '#7af7ff', 22),
      steps: [{ at: .35, fn: () => {
        verityGo(f, () => new V3(C.x, C.y + 4, C.z), 4.6, 1.6, 'angry'); warnCircle(C, R, '#7af7ff', 1); sfx('zap', C);
        const nd = ndt(); let t = 0, acc = 0, ring = 0;
        const tick = () => {
          const dt = nd(); t += dt; acc += dt; ring += dt;
          for (let i = 0; i < 4; i++) { const a = rand(0, TAU), r = rand(0, R); emit(C.x + Math.cos(a) * r, C.y + rand(.2, 3), C.z + Math.sin(a) * r, 0, rand(0, 2), 0, ['#7af7ff', '#ff3df0', '#ffffff'][Math.random() * 3 | 0], rand(.2, .5), .25, 0, 1); }
          if (ring > .9) { ring = 0; warnCircle(C, R, '#7af7ff', .9); }
          if (acc >= .5) {
            acc = 0;
            for (const g of enemiesOf(f)) {
              if (Math.hypot(g.pos.x - C.x, g.pos.z - C.z) > R || !g.alive) continue;
              applyHit(f, g, { dmg: o.dmg || 1.8, stun: .25, kb: 0, up: 0, color: '#7af7ff', hitstop: .02, noPico: true });
              if (!g.remote && g.ragdoll <= 0) { const a = rand(0, TAU), d = rand(1.5, 3), nx = g.pos.x + Math.cos(a) * d, nz = g.pos.z + Math.sin(a) * d; if (Math.hypot(nx - C.x, nz - C.z) < R + 1 && groundAt(nx, nz) <= g.pos.y + .2) { burst(chestOf(g), 8, '#ff3df0', 6, .2, .3, 0); g.pos.x = nx; g.pos.z = nz; burst(chestOf(g), 8, '#7af7ff', 6, .2, .3, 0); } }
            }
          }
          if (t < 4.5 && f.alive && G.state === 'play') later(0, tick);
        };
        tick();
      } }],
    });
  },
  // Todo lo Ve (despierta): marca a todos los rivales
  sebSee(f, o) {
    startAction(f, {
      name: 'sebSee', dur: 1.1, speedMul: .15, armor: true, anim: [[0, 'castUp', 500]],
      start: () => popText(chestOf(f), '¡Todo lo ve!', '#ffd91a', 24),
      steps: [{ at: .4, fn: () => {
        const dur = o.dur || 7; verityGo(f, () => new V3(f.pos.x, f.pos.y + 8, f.pos.z), dur * .6, 3.2, 'open'); screenFlash(.3); sfx('ult', f.pos);
        for (const g of enemiesOf(f)) { g.seen = dur; g.seenBy = f; popText(chestOf(g), 'OBSERVADO', '#ffd91a', 16); burst(chestOf(g), 10, '#ffd91a', 5, .16, .4, 0); }
      } }],
    });
  },
  beam(f, o) {
    const len = o.len || 22, w = o.width || .9, dur = o.dur || 1, charge = o.charge || .4;
    let grp = null, acc = 0, base = null;
    startAction(f, {
      name: 'beam', bbClip: o.bbClip, dur: charge + dur, anim: o.eyes ? [[0, 'visorTouch', 700]] : [[0, 'charge', 500], [charge, 'cast', 900]], speedMul: 0, aim: true, eyes: !!o.eyes, noControl: !!o.sweep,
      tick: (a, t, dt) => {
        if (o.sweep && t >= charge) { if (base === null) base = f.yaw; f.yaw = base - o.sweep / 2 + o.sweep * clamp((t - charge) / dur, 0, 1); }
        const origin = o.fromFn ? o.fromFn() : o.eyes ? front(f, .35, 1.72) : front(f, .7, 1.15);
        if (t < charge) { const an = rand(0, TAU); emit(origin.x + Math.cos(an), origin.y + rand(-1, 1), origin.z + Math.sin(an), -Math.cos(an) * 6, rand(-2, 2), -Math.sin(an) * 6, o.color, .14, .18, 0, 0); return; }
        if (!grp) {
          grp = new THREE.Group();
          const outer = new THREE.Mesh(new THREE.BoxGeometry(w * 2, w * 2, len), glowMat(o.color, .55));
          const core = new THREE.Mesh(new THREE.BoxGeometry(w * .9, w * .9, len), new THREE.MeshBasicMaterial({ color: 0xffffff }));
          outer.position.z = core.position.z = len / 2; grp.add(outer, core); scene.add(grp); sfx('beam', f.pos);
          ringAt(origin, o.color, 2.5, .4, 'face', f.yaw);
        }
        grp.position.copy(origin); grp.rotation.y = f.yaw;
        const pul = 1 + Math.sin(t * 50) * .12; grp.children[0].scale.set(pul, pul, 1);
        const F = fwd(f.yaw), end = origin.clone().addScaledVector(F, len);
        emit(end.x, end.y, end.z, rand(-6, 6), rand(0, 6), rand(-6, 6), o.color, .25, .3, .5);
        if (involvesPlayerNear(f)) G.shake = Math.max(G.shake, .12);
        acc += dt;
        while (acc >= .1) {
          acc -= .1;
          for (const g of enemiesOf(f)) {
            const c = chestOf(g);
            if (segDist(c, origin, end) < w + .5 && Math.abs(c.y - origin.y) < w + 1.1 && (c.x - origin.x) * F.x + (c.z - origin.z) * F.z > -.5)
              applyHit(f, g, { dmg: o.dmg || 2.2, stun: .35, kb: o.push || 6, up: 1, dir: F, guardBreak: !!o.gb, color: o.color, hitstop: 0, shake: .15 });
          }
        }
      },
      onEnd: () => { if (grp) { scene.remove(grp); grp.children.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); } },
    });
  },
  pillar(f, o) {
    const tgt = findTarget(f, 18), F = fwd(f.yaw);
    const p = tgt ? new V3(tgt.pos.x, 0, tgt.pos.z) : new V3(f.pos.x + F.x * 6, 0, f.pos.z + F.z * 6);
    p.y = groundAt(p.x, p.z);
    const r = o.radius || 2.8, del = o.delay || .5;
    warnCircle(p, r, o.color, del);
    startAction(f, { name: 'pillar', dur: .55, aim: true, speedMul: .2, anim: [[0, 'charge', 600], [.18, 'stomp', 1000]], steps: [{ at: .18, fn: () => { burst(new V3(f.pos.x, .2, f.pos.z), 10, '#6b5a3e', 6, .2, .4, 1, 3); shakeFrom(f.pos, .2); } }] });
    later(del, () => {
      if (o.freeze) {
        for (const g of enemiesOf(f)) if (Math.hypot(g.pos.x - p.x, g.pos.z - p.z) < r + .4 && g.pos.y - p.y < 3) applyHit(f, g, { dmg: o.dmg, stun: o.freeze, kb: 0, color: o.color, guardBreak: true, hitstop: .06, freeze: o.freeze });
        iceSpikes(p, r, o.color); ringAt(p, o.color, r * 1.3, .45); sfx('ice', p);
      } else {
        explode(f, new V3(p.x, p.y + .8, p.z), r, { dmg: o.dmg, kb: 3, up: o.up || 18, ragdoll: o.ragdoll || 1.3, color: o.color, guardBreak: true });
        fireColumn(p, r, o.color); sfx('fire', p);
      }
    });
  },
  flameline(f, o) {
    startAction(f, {
      name: 'flameline', dur: .7, aim: true, speedMul: 0, anim: [[0, 'kick_w', 700], [.12, 'stomp', 1000]],
      steps: [{
        at: .12, fn: () => {
          const F = fwd(f.yaw), base = f.pos.clone(), hitOnce = new Set();
          for (let i = 0; i < 6; i++) later(i * .07, () => {
            const p = new V3(base.x + F.x * (1.6 + i * 1.7), groundAt(base.x, base.z) + .8, base.z + F.z * (1.6 + i * 1.7));
            if (Math.hypot(p.x, p.z) > ARENA) return;
            const last = i === 5;
            for (const g of enemiesOf(f)) {
              if (hitOnce.has(g) && !last) continue;
              if (chestOf(g).distanceTo(p) < 1.9) { applyHit(f, g, last ? { dmg: 6, kb: 12, up: 10, ragdoll: 1, color: o.color } : { dmg: 3, stun: .6, kb: 3, up: 3, color: o.color, dir: F }); hitOnce.add(g); }
            }
            fireColumn(new V3(p.x, p.y - .8, p.z), .9, o.color, 3.5); sfx('fire', p, .5);
          });
        }
      }],
    });
  },
  grab(f, o) {
    let tgt = null, phase = 0, pt = 0;
    startAction(f, {
      name: 'grab', dur: 1.4, anim: [[0, 'grab', 800]], noControl: true, aim: true,
      start: () => { const F = fwd(f.yaw); f.vel.x = F.x * 15; f.vel.z = F.z * 15; sfx('dash', f.pos); },
      tick: (a, t, dt) => {
        if (phase === 0) {
          if (t > .3) { f.vel.x *= .1; f.vel.z *= .1; a.t = Math.max(a.t, a.dur - .2); phase = 9; return; }
          const c = front(f, 1.0, 1.1);
          for (const g of enemiesOf(f)) {
            if (g.iframes > 0 || chestOf(g).distanceTo(c) > 1.35) continue;
            if (g.action && g.action.counter) { applyHit(f, g, { dmg: 0 }); return; }
            tgt = g; phase = 1; pt = 0; f.vel.set(0, 0, 0); endAction(g); g.blocking = false; g.stun = 2; g.grabbed = true;
            a.armor = true; a.anim = [[t, 'lift', 600]]; sfx('grab', f.pos); popText(chestOf(g), '¡AGARRE!', '#ffd166', 20);
            break;
          }
        } else if (phase === 1) {
          pt += dt; const F = fwd(f.yaw), k = Math.min(1, pt / .4);
          tgt.pos.set(f.pos.x + F.x * (.9 - k * .9), f.pos.y + 1 + k * 1.6, f.pos.z + F.z * (.9 - k * .9)); tgt.vel.set(0, 0, 0); tgt.stun = Math.max(tgt.stun, .5);
          if (pt > .45) { phase = 2; pt = 0; a.anim = [[t, 'suplex', 1000]]; }
        } else if (phase === 2) {
          pt += dt; const F = fwd(f.yaw), k = Math.min(1, pt / .15);
          tgt.pos.set(f.pos.x - F.x * k * 1.6, f.pos.y + 2.6 - k * 2.6, f.pos.z - F.z * k * 1.6); tgt.vel.set(0, 0, 0);
          if (k >= 1) {
            phase = 3; tgt.grabbed = false; tgt.stun = 0;
            applyHit(f, tgt, { dmg: o.dmg || 15, kb: 6, up: 7, ragdoll: 1.4, guardBreak: true, dir: F.clone().negate(), hitstop: .14, shake: .7, noCounter: true });
            const gp = new V3(tgt.pos.x, 0, tgt.pos.z); ringAt(gp, o.color, 4, .5); burst(gp, 30, '#6b5a3e', 10, .3, .8, 1.2, 6); sfx('boom', gp);
            a.t = Math.max(a.t, a.dur - .35);
          }
        }
      },
      onEnd: () => { if (tgt && phase < 3) { tgt.grabbed = false; tgt.stun = Math.min(tgt.stun, .3); } },
    });
  },
  counter(f, o) {
    startAction(f, { name: 'counter', dur: .9, counter: true, anim: [[0, 'counter', 700]], speedMul: 0, start: () => { ringAt(chestOf(f), '#ffffff', 1.6, .35, 'face', f.yaw); sfx('block', f.pos); } });
  },
  // coreografía cinemática: agarra (o atrae con una cadena) y reproduce la escena de los dos
  chore(f, o) {
    const chosen = o.id === 'javiImpale' && !G.viewer ? (G.impaleVariant || o.id) : o.id;
    const D = CHORE[chosen]; if (!D) return false;
    if(D.bbPreview && G.viewer) {runChore(f,VW.vic,D);return;}
    if (D.pull) {
      startAction(f, {
        name: 'chorethrow', dur: .5, aim: true, speedMul: .2, anim: [[0, 'throwW', 800], [.14, 'throw', 1200]],
        steps: [{ at: .15, fn: () => { spawnProj(f, f.yaw, { color: f.ch.color, speed: 46, size: .32, long: 2.2, homing: 3, range: 22, onHit: g => { if (!f.alive || !g.alive || g.ragdoll > 0 || g.cineLock) return; slashLine(chestOf(f), chestOf(g), f.ch.color, .4, .1); runChore(f, g, D); } }); sfx('zap', f.pos); } }],
      });
      return;
    }
    startAction(f, {
      name: 'chorereach', dur: .36, noControl: true, aim: true, armor: true, anim: [[0, D.reach || 'aCatch', 1000]],
      start: () => { const F = fwd(f.yaw); f.vel.x = F.x * 17; f.vel.z = F.z * 17; sfx('dash', f.pos); ghost(f, f.ch.color, .4, .25); },
      tick: () => { const c = front(f, 1, 1.1); for (const g of enemiesOf(f)) { if (g.iframes > 0 || g.ragdoll > 0 || g.cineLock || chestOf(g).distanceTo(c) > (D.catch || 1.7)) continue; runChore(f, g, D); return; } },
      onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
    });
  },
  // armas/orbes que giran alrededor y salen disparadas solas hacia el rival más cercano
  orbitals(f, o) {
    startAction(f, { name: 'orbit', dur: .45, speedMul: .4, anim: [[0, 'castUp', 800], [.2, 'cast', 900]] });
    const n = o.n || 4, items = [], grp = new THREE.Group(), dur = o.dur || 7;
    for (let i = 0; i < n; i++) { const m = o.kind === 'spear' ? buildSpear(.9) : new THREE.Mesh(new THREE.OctahedronGeometry(o.kind === 'kunai' ? .16 : .24, 0), glowMat(o.kind === 'shard' ? '#e8f4ff' : o.color, .95)); items.push(m); grp.add(m); }
    let lastK = 0, age = 0, acc = 0, fired = 0;
    sfx('tp', f.pos);
    addFx(grp, dur, (g, k) => {
      const dt = (k - lastK) * dur; lastK = k; age += dt;
      if (!f.alive || fired >= n || !G.fighters.includes(f)) { g.visible = false; return; }
      g.position.set(f.pos.x, f.pos.y + 1.4, f.pos.z);
      items.forEach((m, i) => { if (!m.visible) return; const a = age * 2.6 + i / n * TAU; m.position.set(Math.cos(a) * 1.5, Math.sin(age * 3 + i) * .25, Math.sin(a) * 1.5); if (o.kind === 'spear') m.lookAt(g.position.x + m.position.x * 3, g.position.y, g.position.z + m.position.z * 3); else { m.rotation.y += dt * 6; m.rotation.x += dt * 4; } });
      acc += dt;
      if (acc >= (o.rate || .55)) {
        acc = 0; let tg = null, bd = o.range || 14;
        for (const e of enemiesOf(f)) { const d = dist2d(f, e); if (d < bd && e.ragdoll <= 0) { bd = d; tg = e; } }
        if (tg) { const m = items.find(x => x.visible); m.visible = false; fired++; const from = m.getWorldPosition(new V3()); spawnProj(f, Math.atan2(tg.pos.x - from.x, tg.pos.z - from.z), Object.assign({ color: o.color }, o.proj, { from })); sfx('zap', from, .5); }
      }
    }, () => { items.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); });
  },
  // atraviesa varias veces al rival (o lo hacen sus copias) y en el último lo lanza
  dashCombo(f, o) {
    const tg = findTarget(f, o.range || 16); if (!tg) return false;
    const n = o.n || 3; let i = 0;
    startAction(f, {
      name: 'dashcombo', dur: n * .2 + .35, armor: true, noControl: true, anim: [[0, 'slashW', 900]],
      start: () => { f.iframes = Math.max(f.iframes, n * .2 + .4); sfx('dash', f.pos); },
      tick: (a, t) => {
        const want = Math.min(n, Math.floor(t / .2) + 1);
        while (i < want) {
          i++; const last = i === n;
          if (!tg.alive) { a.t = a.dur; return; }
          const ang = yawTo(f, tg) + (o.zig ? (i % 2 ? 1 : -1) * .9 : rand(-.4, .4)), from = o.clones ? chestOf(tg).add(fwd(ang + Math.PI).multiplyScalar(2.6)) : chestOf(f);
          const dest = new V3(tg.pos.x + Math.sin(ang) * 2.6, tg.pos.y, tg.pos.z + Math.cos(ang) * 2.6);
          if (o.clones) { copyAt(f, new V3(from.x, tg.pos.y, from.z), ang, .3); copyAt(f, dest, ang + Math.PI, .4); }
          else { ghost(f, o.color, .55, .3); f.pos.copy(dest); f.yaw = yawTo(f, tg); }
          slashLine(from, new V3(dest.x, dest.y + 1.1, dest.z), o.color, .45, .16); slashLine(from, new V3(dest.x, dest.y + 1.1, dest.z), '#ffffff', .3, .06);
          a.anim = [[t, i % 2 ? 'slash' : mirror(POSE.slash), 1300]];
          applyHit(f, tg, last ? { dmg: o.dmg2 || 10, kb: 14, up: 12, ragdoll: 1.3, guardBreak: true, color: o.color, hitstop: .1, shake: .5 } : { dmg: o.dmg || 4, stun: .7, kb: 0, guardBreak: true, color: o.color, hitstop: .04 });
          sfx('slash', f.pos);
        }
      },
    });
  },
  // cadena que atrapa al rival, lo trae y lo remata hacia arriba
  pullStrike(f, o) {
    startAction(f, {
      name: 'pull', dur: .5, aim: true, speedMul: .2, anim: [[0, 'throwW', 800], [.14, 'throw', 1200]],
      steps: [{ at: .15, fn: () => { spawnProj(f, f.yaw, { color: o.color, speed: 46, size: .32, long: 2.2, homing: 3, range: 22, onHit: g => pullHit(f, g, o) }); sfx('zap', f.pos); } }],
    });
  },
  // campo en el piso que daña y aturde a quien esté adentro
  zone(f, o) {
    startAction(f, { name: 'zone', dur: .55, speedMul: 0, anim: [[0, 'charge', 600], [.25, 'stomp', 1000]], steps: [{ at: .25, fn: () => makeZone(f, o) }] });
  },
  // lo lanza al aire, salta, lo sigue con golpes y lo estrella contra el piso
  airCombo(f, o) {
    const tg = findTarget(f, 3.3); if (!tg) return false;
    let ok = false, landed = false;
    const hold = () => { if (!ok || !tg.alive) return false; if (!tg.remote) tg.vel.y = 2; const F = fwd(f.yaw); f.pos.lerp(new V3(tg.pos.x - F.x * 1.2, Math.max(0, tg.pos.y - .2), tg.pos.z - F.z * 1.2), .6); f.vel.y = 1; return true; };
    startAction(f, {
      name: 'aircombo', dur: 1.55, armor: true, noControl: true, aim: true, anim: [[0, 'upper_w', 900], [.08, 'upper', 1300]],
      steps: [
        { at: .09, fn: () => { arcSlash(f, o.color, { tilt: 1.57, r: 1.7, len: 2.4 }); ok = applyHit(f, tg, { dmg: 5, kb: 1, up: 15, stun: 1.8, color: o.color, guardBreak: true, hitstop: .06 }) === true; } },
        { at: .28, fn: (a) => { if (!ok) { a.t = a.dur; return; } f.vel.set(0, 15.5, 0); f.onGround = false; a.anim = [[a.t, 'jump', 800]]; ghost(f, o.color); } },
        ...[.55, .7, .85].map((at, k) => ({ at, fn: (a) => { if (!hold()) return; a.anim = [[a.t, k % 2 ? 'kick' : (k ? 'jabL' : 'jabR'), 1300]]; arcSlash(f, o.color, { tilt: rand(-.8, .8), r: 1.6, len: 2.2 }); applyHit(f, tg, { dmg: 4, stun: 1.2, kb: 0, color: o.color, guardBreak: true, hitstop: .05 }); if (o.eyes) { const e = front(f, .35, 1.72); slashLine(e, chestOf(tg), o.color, .15, .1); } } })),
        { at: 1.0, fn: (a) => { if (!hold()) return; a.anim = [[a.t, 'slamDown', 1300]]; arcSlash(f, o.color, { tilt: -1.57, r: 2, len: 2.6, w: .7 }); if (o.eyes) { const e = front(f, .35, 1.72); slashLine(e, chestOf(tg), o.color, .3, .4); } applyHit(f, tg, { dmg: o.dmg || 11, kb: 3, up: -24, ragdoll: 1.4, color: o.color, guardBreak: true, hitstop: .12, shake: .7 }); f.vel.y = -30; } },
      ],
      tick: (a, t) => { if (ok && t > 1.02 && !landed && f.onGround) { landed = true; const gp = new V3(f.pos.x, f.pos.y, f.pos.z); ringAt(gp, o.color, 5, .5); burst(new V3(gp.x, gp.y + .3, gp.z), 30, '#6b5a3e', 10, .25, .8, 1.2, 6); crackDecal(gp, 3.5); sfx('boom', gp); shakeFrom(gp, .6); } },
    });
  },
  // agarre con cinemática estilo battlegrounds: los dos quedan en una animación juntos y la cámara los sigue
  cineGrab(f, o) {
    let tg = null, phase = 0, nh = 0, t0 = 0;
    const S = STY[o.style] || STY.punch;
    const release = () => { if (tg && !tg.remote) { tg.cineLock = null; tg.grabbed = false; tg.forcePose = null; } };
    startAction(f, {
      name: 'cinegrab', dur: 2.6, noControl: true, aim: true, armor: true, anim: [[0, 'grab', 900]],
      start: () => { const F = fwd(f.yaw); f.vel.x = F.x * 16; f.vel.z = F.z * 16; sfx('dash', f.pos); },
      tick: (a, t) => {
        const F = fwd(f.yaw);
        if (phase === 0) {
          if (t > .3) { f.vel.x *= .1; f.vel.z *= .1; a.t = a.dur; return; }
          const c = front(f, 1, 1.1);
          for (const g of enemiesOf(f)) { if (g.iframes > 0 || g.ragdoll > 0 || chestOf(g).distanceTo(c) > 1.5) continue; tg = g; break; }
          if (!tg) return;
          phase = 1; t0 = t; f.vel.set(0, 0, 0); a.invuln = true; f.iframes = Math.max(f.iframes, 2.4);
          if (!tg.remote) { endAction(tg); tg.blocking = false; tg.cineLock = f; tg.stun = 3; tg.grabbed = true; }
          if ((f.isPlayer || tg.isPlayer) && !CFG_CINE.off) { G.duel = { f, tg, t0: G.time }; IMPACT.cd = 0; impactFrame(o.color, .08); }
          popText(chestOf(tg), '¡AGARRE!', '#ffffff', 24); sfx('grab', f.pos); sfx('counter', f.pos, .6);
          a.anim = [[t, 'grab', 1100]];
        }
        if (phase < 1) return;
        const k = t - t0;
        if (phase < 4 && tg.alive && !tg.remote) {
          const off = k < .35 ? [1.0, 0] : k < 1.5 ? [1.0, 1.3] : [1.2, 1.15];
          tg.pos.set(f.pos.x + F.x * off[0], f.pos.y + off[1], f.pos.z + F.z * off[0]); tg.vel.set(0, 0, 0); tg.yaw = f.yaw + Math.PI;
          tg.forcePose = k < .35 ? 'hurtA' : (nh % 2 ? 'hurtB' : 'hurtA'); tg.stun = Math.max(tg.stun, .5);
        }
        if (phase === 1 && k >= .35) { phase = 2; a.anim = [[t, S.lift, 900]]; }
        if (phase === 2 && nh < 4 && k >= .55 + nh * .22) {
          const h = S.hit[nh % S.hit.length]; nh++;
          a.anim = [[t, h[0], 900], [t + .05, h[1], 1400]];
          styleFx(o.style, f, tg, o.color, false);
          applyHit(f, tg, { dmg: 3.5, stun: 3, kb: 0, color: o.color, guardBreak: true, hitstop: .05, shake: .3 });
          if (tg.anim) tg.anim.v.tx -= 10;
        }
        if (phase === 2 && k >= 1.45) { phase = 3; a.anim = [[t, S.wind, 900]]; sfx('ult', f.pos, .5); }
        if (phase === 3 && k >= 1.75) {
          phase = 4; release(); a.anim = [[t, S.fin, 1400]];
          styleFx(o.style, f, tg, o.color, true);
          applyHit(f, tg, { dmg: o.dmg || 15, kb: 26, up: 12, ragdoll: 2, guardBreak: true, color: o.color, hitstop: .16, shake: 1, impact: true, dir: F });
          sfx('boom', f.pos); a.t = Math.max(a.t, a.dur - .5);
        }
      },
      onEnd: () => { release(); if (tg && phase < 4 && !tg.remote) tg.stun = Math.min(tg.stun, .3); if (G.duel && G.duel.f === f) G.duel.end = G.time + (phase >= 4 ? .7 : 0); },
    });
  },
  illusion(f, o) {
    const n = o.count || 2;
    startAction(f, {
      name: 'illusion', bbClip: o.bbClip, dur: o.army ? 1.0 : .5, armor: !!o.army, speedMul: .3, aim: true,
      anim: o.army ? [[0, 'signs', 600], [.3, 'castUp', 800]] : [[0, 'signs', 700], [.2, 'point', 900]],
      steps: [{ at: o.army ? .3 : .2, fn: () => {
        for (let i = 0; i < n; i++) {
          const off = o.army ? fwd(f.yaw + i / n * TAU).multiplyScalar(2.6) : rightOf(f.yaw).multiplyScalar((i - (n - 1) / 2) * 1.6);
          const p = f.pos.clone().add(off); p.y = groundAt(p.x, p.z);
          decoy(f, o, p, { dmg: o.dmg || 7, life: o.life || 2.6, speed: o.speed || 11 });
        }
        burst(chestOf(f), o.army ? 50 : 20, o.color, o.army ? 10 : 6, .2, .6, -.2);
        if (o.army) { ringAt(new V3(f.pos.x, f.pos.y, f.pos.z), o.color, 6, .6); if (involvesPlayerNear(f)) screenFlash(.3); }
        sfx('tp', f.pos);
      } }],
    });
  },
                  fistRain(f, o) {
    const steps = [], an = [[0, 'windup', 700]];
    for (let i = 0; i < 22; i++) {
      an.push([.3 + i * .085, i % 2 ? 'jabL' : 'jabR', 1600]);
      steps.push({ at: .32 + i * .085, fn: () => { const p = front(f, 1.7 + rand(-.3, .3), 1.2 + rand(-.5, .5)); f.vel.x += fwd(f.yaw).x * 1.5; f.vel.z += fwd(f.yaw).z * 1.5;
        if (hitArea(f, p, 2.3, { dmg: 1.9, kb: .5, stun: .3, color: '#ff2a3c', set: new Set(), hitstop: .015 })) impactStar(p, i % 3 ? '#ffffff' : '#ff2a3c', 1.2, .12);
        burst(p, 3, i % 2 ? '#ff2a3c' : '#ffffff', 5, .1, .2, 0); if (i % 3 === 0) { sfx('swing', f.pos, .35); ghost(f, '#ff2a3c', .25, .1); } } });
    }
    an.push([2.2, 'mega', 1500]);
    steps.push({ at: 2.28, fn: () => bfStrike(f, o, new Set(), true, 26, true) });
    startAction(f, { name: 'fistrain', dur: 2.7, aim: true, noControl: true, speedMul: 0, anim: an, steps });
  },
                  serious(f, o) {
    startAction(f, {
      name: 'serious', dur: 1.5, anim: [[0, 'windup', 500], [.65, 'mega', 1200]], speedMul: 0, aim: true, armor: true,
      tick: (a, t) => { if (t < .65) { const p = front(f, -.3, 1.3), an = rand(0, TAU); emit(p.x + Math.cos(an) * 1.5, p.y + rand(-1, 1), p.z + Math.sin(an) * 1.5, -Math.cos(an) * 5, rand(-1, 1), -Math.sin(an) * 5, Math.random() < .5 ? o.color : '#ffffff', .18, .3, 0, 0); } },
      steps: [{
        at: .65, fn: () => {
          f.yaw = aimYawFor(f); const F = fwd(f.yaw);
          for (const g of enemiesOf(f)) {
            const dx = g.pos.x - f.pos.x, dz = g.pos.z - f.pos.z, d = Math.hypot(dx, dz) || .01;
            if (d < 17 && ((dx * F.x + dz * F.z) / d > .72 || d < 2.4)) applyHit(f, g, { dmg: 30, kb: 42, up: 15, ragdoll: 2.4, guardBreak: true, hitstop: .18, shake: 1.1, sound: 'boom', dir: F, color: o.color });
          }
          for (let k = 0; k < 170; k++) {
            const sp = rand(18, 48), v = fwd(f.yaw + rand(-.45, .45));
            emit(f.pos.x + F.x * 1.5, f.pos.y + 1.2 + rand(-.6, .6), f.pos.z + F.z * 1.5, v.x * sp, rand(-3, 6), v.z * sp, Math.random() < .5 ? o.color : '#ffffff', rand(.2, .6), rand(.4, .9), 0, 1.5);
          }
          for (let k = 0; k < 5; k++) later(k * .06, () => ringAt(front(f, 2 + k * 3, 1.2), k % 2 ? '#ffffff' : o.color, 2 + k * .9, .5, 'face', f.yaw));
          arcSlash(f, o.color, { tilt: .2, r: 2.6, w: 1.2, len: 2.8, dur: .35 });
          if (involvesPlayerNear(f)) screenFlash(.6);
          shakeFrom(f.pos, 1.2); sfx('boom', f.pos); sfx('heavy', f.pos);
        }
      }],
    });
  },
  cuts(f, o) {
    const ts = enemiesOf(f).filter(g => dist2d(f, g) < 20).sort((a, b) => dist2d(f, a) - dist2d(f, b)).slice(0, 5);
    if (!ts.length) return false;
    const marked = []; let idx = 0; const per = .24;
    startAction(f, {
      name: 'cuts', dur: per * ts.length + .45, anim: [[0, 'slash', 900]], noControl: true, armor: true,
      start: () => { f.iframes = per * ts.length + .7; },
      tick: (a, t) => {
        const want = Math.min(ts.length, Math.floor(t / per) + 1);
        while (idx < want) {
          const g = ts[idx++]; if (!g.alive) continue;
          ghost(f, o.color, .55, .35);
          const from = chestOf(f), off = fwd(rand(0, TAU));
          f.pos.set(g.pos.x + off.x * 1.4, g.pos.y, g.pos.z + off.z * 1.4); f.vel.set(0, 0, 0); f.yaw = yawTo(f, g);
          a.anim = [[t, idx % 2 ? 'slash' : mirror(POSE.slash), 1200]];
          slashLine(from, chestOf(f), o.color, .5, .14); sfx('slash', f.pos);
          arcSlash(f, o.color, { tilt: idx % 2 ? .6 : -.6, r: 1.6, len: 2.6, dir: idx % 2 ? 1 : -1 });
          applyHit(f, g, { dmg: 6, stun: 1.8, kb: 0, color: o.color, guardBreak: true, hitstop: .05 });
          marked.push(g);
        }
      },
      onEnd: () => later(.35, () => {
        for (const g of marked) if (g.alive) {
          applyHit(f, g, { dmg: 11, kb: 10, up: 12, ragdoll: 1.4, guardBreak: true, color: o.color, hitstop: .1, shake: .6 });
          const c = chestOf(g); slashLine(c.clone().add(new V3(-1.4, 1.4, 0)), c.clone().add(new V3(1.4, -1.4, 0)), '#ffffff', .45, .14); slashLine(c.clone().add(new V3(1.4, 1.4, 0)), c.clone().add(new V3(-1.4, -1.4, 0)), o.color, .45, .14);
        }
        sfx('boom', f.pos);
      }),
    });
  },
  nova(f, o) {
    const R = [5, 8, 12];
    startAction(f, {
      name: 'nova', dur: 1.5, armor: true, noControl: true, anim: [[0, 'charge', 500], [.35, 'castUp', 700], [.55, 'vpose', 900]],
      start: () => { f.vel.set(0, 9, 0); f.onGround = false; },
      tick: (a, t) => { if (t > .3 && t < 1.3) f.vel.set(0, 0, 0); const p = chestOf(f), an = rand(0, TAU); emit(p.x + Math.cos(an) * 1.2, p.y + rand(-1, 1), p.z + Math.sin(an) * 1.2, 0, rand(2, 6), 0, Math.random() < .5 ? '#ffab00' : o.color, .2, .4, -.2, 1); },
      steps: [.55, .8, 1.08].map((at, i) => ({ at, fn: () => {
        explode(f, chestOf(f), R[i], { dmg: [9, 9, 14][i], kb: [10, 14, 24][i], up: [6, 8, 14][i], ragdoll: [.8, 1, 1.8][i], color: i === 2 ? '#ffffff' : o.color, guardBreak: true });
        sphereFlash(chestOf(f), o.color, R[i] * .9, .5);
        if (i === 2 && involvesPlayerNear(f)) screenFlash(.5);
      } })),
    });
  },
  iceage(f, o) {
    startAction(f, {
      name: 'iceage', dur: 2.0, armor: true, speedMul: 0, anim: [[0, 'signs', 500], [.35, 'palm', 1000], [1.55, 'castUp', 800]],
      steps: [
        { at: .35, fn: (a) => {
          a.frozen = enemiesOf(f).filter(g => dist2d(f, g) < 16);
          for (const g of a.frozen) applyHit(f, g, { dmg: 6, stun: 2.2, kb: 0, color: o.color, guardBreak: true, hitstop: .05, freeze: 1.9 });
          const gp = new V3(f.pos.x, f.pos.y, f.pos.z);
          ringAt(gp, o.color, 16, .8); ringAt(gp, '#ffffff', 12, .6); iceSpikes(gp, 12, o.color, 24); sfx('ice', f.pos);
          if (involvesPlayerNear(f)) screenFlash(.35);
        } },
        { at: 1.55, fn: (a) => {
          for (const g of a.frozen || []) if (g.alive) { g.frozen = 0; applyHit(f, g, { dmg: 20, kb: 8, up: 14, ragdoll: 1.6, guardBreak: true, color: '#ffffff', hitstop: .12, shake: .8 }); burst(chestOf(g), 30, '#dff6ff', 10, .25, .7); }
          sfx('break', f.pos);
        } },
      ],
    });
  },
  meteor(f, o) {
    let phase = 0;
    startAction(f, {
      name: 'meteor', dur: 2.4, armor: true, noControl: true, aim: true, anim: [[0, 'stomp', 800], [.15, 'slamUp', 600]],
      start: () => { f.vel.set(0, 26, 0); f.onGround = false; f.iframes = 1.2; sfx('jump', f.pos, 3); },
      tick: (a, t) => {
        if (phase === 0) {
          const tg = findTarget(f, 30);
          if (tg && t < .7) { f.vel.x = (tg.pos.x - f.pos.x) * 1.6; f.vel.z = (tg.pos.z - f.pos.z) * 1.6; }
          if (t > .75) { phase = 1; f.vel.set(0, -55, 0); a.anim = [[t, 'slamDown', 1000]]; a.ghost = true; }
        } else if (phase === 1) {
          emit(f.pos.x + rand(-.5, .5), f.pos.y + rand(0, 2), f.pos.z + rand(-.5, .5), 0, rand(4, 10), 0, Math.random() < .5 ? o.color : '#ff7043', .35, .4, 0, 1);
          if (f.onGround) {
            phase = 2; a.ghost = false; a.anim = [[t, 'stomp', 1100]];
            explode(f, new V3(f.pos.x, f.pos.y + .6, f.pos.z), 9, { dmg: 26, kb: 22, up: 14, ragdoll: 2, guardBreak: true, color: o.color });
            const gp = new V3(f.pos.x, .3, f.pos.z); burst(gp, 80, '#6b5a3e', 18, .35, 1.2, 1.4, 10); ringAt(gp, '#ffffff', 13, .7);
            if (involvesPlayerNear(f)) screenFlash(.5);
            shakeFrom(f.pos, 1.3); a.t = Math.max(a.t, a.dur - .4);
          }
        }
      },
    });
  },
};

// ================= Proyectiles =================
const PROJ = [];
// Eliminatoria de la Lanza Leal: la muerte confirma el impacto y el dueño recupera su única lanza.
const JAVI_SPEARS={drops:new Map(),settled:new Set(),sequence:0,actorSequence:0,bodyLife:15,pickupRange:1.8};
const SPEAR_BODY_PARTS=['root','inner','torso','head','armL','armR','legL','legR'];
function spearActorId(f){return f.netId||f.peer||(f.isPlayer&&G.mp?(NET.named?.myId||NET.myPeer):null)||(f._spearActorId||=( 'local-'+(++JAVI_SPEARS.actorSequence)));}
function spearActor(id){return G.fighters.find(f=>spearActorId(f)===id);}
// ===== Destello Negro, lanzas de Javi y proyectiles: vive en js/combate/destello_negro.js =====
const { bfFx, bfInput, bfStrike, clearSpearDrops, confirmSpearFinisher, copySpearBody, createSpearBlood, createSpearDrop, loseSpear, loyalSpearHit, missingSpearHint, ownsMissingSpear, recoverJaviSpear, releaseOwnerSpear, removeSpearDrop, restoreSpearBodyPose, retireLoyalSpear, serializeLostSpear, spawnProj, spearBodyPose, spearDropPoint, spearReceiptList, spearVector, synchronizeSpearDrops, updLoyal, updateProj, updateSpearBlood, updateSpearDrops, validSpearRecord } = CF_COMBATE.crearDestelloNegro({ $, ABY, ARENA, Animator, CHARS, DUMMY_CH, G, JAVI_SPEARS, PROJ, PX, ROOM_ATMOSPHERE, SPEAR_BODY_PARTS, TAU, V3, applyHit, applyNetDest, buildModel, buildSpear, burst, camera, chestOf, copyCanvas, disposeModel, emit, enemiesOf, explode, front, fwd, ghost, groundAt, hitArea, impactStar, makeSkinCanvas, outLand, popText, rand, ringAt, scene, setSpear, sfx, slashLine, spearActor, spearActorId, sphereFlash, worldDamage, wxRandom, get pressed() { return pressed; }, get mouse() { return mouse; }, get NET() { return NET; }, get r2() { return r2; } });
// ================= Habilidades, ulti y cinemática =================
// Destrucción de edificios por habilidad (0 = nada, 1 = normal, 2 = devastador). Cualquier habilidad puede fijar el suyo con `dest:`.
const DEST_DEFAULT = {
  sonSpin: .8, sonHoming: .5, sonBoom: .6, sonCyclone: .3, sonBoost: 1.1, sonBlast: 2,
  fistDiv: .8, blackFlash: 1.4, manjiKick: .9, fistFlurry: .7, bf3: 1.6, groundBreak: 2.2, shoulderDash: 1.2, fistRain: 1.4,
  serious: 0, chore: 1.2, zone: .5, shoot: .3, orbitals: .3, slam: 1.5, beam: .9, rush: .8, airCombo: .6, dashCombo: .6, pillar: 1.3, blink: 0, wave: 1.3, illusion: 0, barrage: .5,
  slash: .7, lunge: .5, spearThrow: .6, whirl: .6, spearRain: 1.1, eyeBolts: .5, optoJump: .5, sekBoomerang: .4, sekDive: 1, sekParry: 0, sekUpdraft: .6, rkWeb: 0, rkZip: .2, rkBite: .3, rkTraps: .3,
  ukSweep: .6, ukLunge: .5, ukKnives: .3, ukFireball: 1, sebPackage: .5, sebPearl: .4, sebCreeper: 1.8, sebAnvil: 1.4, randiPaloma: .2, randiCuyes: .7, randiNazca: 1, randiLlamas: 1.2, randiPisco: 0, capAdapt: 0,
  jlError: .3, jlClippy: .2, jlUndo: 0, jlFormat: .4, cuts: .5, flameline: .9, nova: 1.5, iceage: 1, grab: 0, counter: 0, meteor: 2, rbOverload: 1.2, rbMirrors: .2, rbSatellite: 1, rbChain: .4,
  sekRain: 1, sekFlight: .5, sekLock: .3, rkLegStabs: .4, rkWebField: 0, rkSwarm: .2, ukSun: 1.5, ukPhoenix: 1.4, ukRing: 1.2, sebBeam: 1.2, sebVariants: .6, sebEclipse: 1.8,
  sebBrawlA: .6, sebBallA: 1, sebSandA: .8, sebRemote: .3, sebRoulette: .8, sebBomb: 1, sebParry: 0, sebMount: 1.6, sebBuffer: 0, sebBounce: .5, sebStare: 1, sebSwap: .6, sebWall: 1, sebGaze: 1.4, sebChoir: .3, sebGlitch: .4, sebSee: 0,
  randiMahoraga: 0, randiCondor: 1.2, randiPerros: .3, randiTinku: 0, jlRain: .8, jlGiant: 1.6, jlWave: 1.2, pullStrike: .6, m: 0, c: 0,
};
// Sonidos propios de cada habilidad: archivos en personajes/<id>/Skills/Sound/<Habilidad>/ (la lista la arma tools/actualizar_personajes.py en CF_SONIDOS_HAB).
//   lanzar*.mp3  suena al usar la habilidad (efecto)     voz*.mp3  frase del personaje al usarla (voces)
const skillFolderName = n => n.replace(/[\\/:*?"<>|]/g, '').trim().replace(/\.+$/, '') || 'sin nombre';
function skillSound(f, s) {
  const M = window.CF_SONIDOS_HAB && window.CF_SONIDOS_HAB[f.ch.id]; if (!M || !s || !s.n) return;
  if (!(f.isPlayer || involvesPlayerNear(f))) return;
  const base = skillFolderName(s.n), alt = f.awak > 0 ? [base + ' (despierto)', base] : [base, base + ' (despierto)'];
  const fold = alt.find(n => M[n]); if (!fold) return;
  const files = M[fold], root = 'personajes/' + f.ch.id + '/Skills/Sound/' + fold + '/', pickOf = re => { const l = files.filter(x => re.test(x)); return l.length ? l[Math.floor(Math.random() * l.length)] : null; };
  const cast = pickOf(/^lanzar/i), voice = pickOf(/^voz/i);
  if (cast) playHtmlEffect(encodeURI(root + cast), .7, 'game');
  if (voice) playHtmlEffect(encodeURI(root + voice), .85, 'voices');
}
function useSkill(f, i) {
  const s = skillsOf(f)[i]; if (!s || f.cd[i] > 0) return;
  if (f.mount || f.sebRem) return;
  prepWeapon(f);
  f.destPow = s.dest != null ? s.dest : (DEST_DEFAULT[s.k] != null ? DEST_DEFAULT[s.k] : .6);   // cuánto rompe esta habilidad en los edificios
  const ok = MOVES[s.k](f, Object.assign({ color: f.ch.color, slot: i }, s.o));
  if (ok !== false) { try { skillSound(f, s); } catch (e) { } }   // sonidos propios de la habilidad (personajes/<id>/Skills/Sound/<Habilidad>/)
  if (ok !== false) { javiSpeak(f, 'hab_' + (SKILL_VOICE[s.k] || s.k.toLowerCase())); javiSpeak(f, 'ev_skill_' + (i + 1)); }   // voz propia de esa habilidad (si el personaje la tiene)
  if (ok !== false && (f.isPlayer || f.roomBot) && G.mp && s.k !== 'chore') netAct({ k: 's', i, w: f.awak > 0 ? 1 : 0, x: ownsMissingSpear(f) ? 1 : 0 }, f);   // las coreografías mandan su propio aviso ('c') al agarrar
  f.cd[i] = ok === false ? .4 : s.cd;
  if (ok !== false && f.isPlayer) { const el = $('skills').children[i]; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  if (ok === false && f.isPlayer) popText(chestOf(f), 'Sin objetivo', '#aab', 15);
}
function useUlt(f) {
  if (f.ch.noUlt) return;
  if (f.ult < 100) return;
  prepWeapon(f);
  if (f.awak > 0) return;
  f.ult = 0; if (f.isPlayer) { statsUlt(f); ultMusic(f.ch.id); }
  if (f.isPlayer && !ownsMissingSpear(f) && !CFG_CINE.off) { startCine(f); return; }   // sin lanza no hay cinemática: despierta directo
  runUlt(f);
  if (involvesPlayerNear(f)) miniCut(f);
}
// el despertar no es un ataque: termina la animación y las habilidades cambian por un tiempo
function runUlt(f) {
  javiActivateVoice(f);
  if ((f.isPlayer || f.roomBot) && G.mp) netAct({ k: 'u' }, f);
  f.awak = AWAKE_DUR; f.ult = 0; f.cd = [0, 0, 0, 0]; f.iframes = Math.max(f.iframes, .6);
  if (f.hp < f.maxHp) { f.hp = f.maxHp; popText(chestOf(f), '¡VIDA AL MÁXIMO!', '#7dff6a', 22); burst(chestOf(f), 24, '#7dff6a', 6, .2, .6, .4); }   // despertar: se cura del todo
  comicPop(chestOf(f), '¡DESPERTAR!', 'burst-purple', 38, -6); G.linesI = 1;
  startAction(f, { name: 'awaken', dur: .7, armor: true, speedMul: 0, anim: [[0, 'charge', 500], [.25, 'vpose', 800]] });
  if (f.isPlayer) showBanner('DESPERTAR', f.ch.color, f.ch.ult.n.toUpperCase());
  lightColumn(f.pos, f.ch.color);
  burst(chestOf(f), 40, f.ch.color, 10, .25, .7, -.3);
  ringAt(new V3(f.pos.x, f.pos.y, f.pos.z), f.ch.color, 6, .6);
  sfx('ult', f.pos);
  jlAwaken(f);
}
function startCine(f) {
  javiActivateVoice(f,true);
  G.cine = { f, t: 0, dur: 2.6, shot: 0, drawn: !!f.spearOut };
  cineGrade(true, f);
  const tt = $('cinetitle'); tt.style.setProperty('--cc', f.ch.color); tt.classList.remove('show');
  $('ctwho').textContent = `${f.ch.name.toUpperCase()} · ${f.ch.title.toUpperCase()}`; $('ctult').textContent = f.ch.ult.n.toUpperCase();
  f.vel.x = f.vel.z = 0; if (f.action) endAction(f); f.blocking = false;
  document.body.classList.add('cine');
  const ci = $('cutin'); ci.style.setProperty('--cc', f.ch.color);
  headPortrait(f.skin, $('cutface'));
  $('cutwho').textContent = `${f.name.toUpperCase()} · ${f.ch.name.toUpperCase()}`;
  $('cutult').textContent = f.ch.ult.n.toUpperCase();
  ci.classList.add('hidden'); ci.classList.remove('show');
  sfx('ult', f.pos); sfx('whoosh');
}
function updateCine(dt) {
  const c = G.cine, f = c.f; c.t += dt;
  if (!c.track) c.track = buildCineTrack(f.ch.cine, Object.assign({}, f.anim.x), (f.ch.cineContacts || []).map(t => ({ t, hit: 1 })));
  if (f.spear && !c.drawn && c.t >= .22) { c.drawn = true; setSpear(f, true); sfx('draw', f.pos, .6); }
  const cineBB = bbSet(f.ch.id);
  if (f.ch.wings) updateWings({ alive: true, awak: c.t > 1.2 ? 1 : 0, onGround: true }, f.model, dt, c.t);
  if (f.ch.legs) updateSpiderLegs(Object.assign(Object.create(f), { alive: true, awak: c.t > 1.25 ? 1 : 0, onGround: true }), f.model, dt, c.t);
  if(cineBB && cineBB.cinematica_ulti) {f.anim.bbR6=true;f.anim.play(javiBBTrack('cinematica_ulti', f.ch.id),c.t,dt,true);} else {f.anim.bbR6=false;f.anim.play(c.track,c.t,dt,true);}
  f.model.root.position.copy(f.pos); f.model.root.rotation.y = f.yaw;
  if (f.ch.cineTwirl) for (const tw of f.ch.cineTwirl) if (c.t >= tw[0] && c.t - dt < tw[0]) startTwirl(f, tw[1], tw[2]);
  if (f.model.gripRot) f.model.gripRot.rotation.x = f.anim.x.sx + twirlAngle(f, dt);
  if (f.ch === CHARS.javi) javiCineFx(c, f, dt);
  eyeGlow(f.model, f.ch.cineEyes != null && c.t >= f.ch.cineEyes, c.t);
  updateAura(f, dt, c.t);
  // luces de la cinemática: contorno de color detrás y relleno suave delante
  const Fy = fwd(f.yaw);
  CINE_RIM.position.set(f.pos.x - Fy.x * 1.6, f.pos.y + 2.2, f.pos.z - Fy.z * 1.6);
  CINE_KEY.position.set(f.pos.x + Fy.x * 2.2, f.pos.y + 1.6, f.pos.z + Fy.z * 2.2);
  // cortes: barrido → paneles de cómic → zoom de choque con banner → plano de héroe con título
  const shot = c.t < SHOTS[0] ? 0 : c.t < SHOTS[1] ? 1 : c.t < SHOTS[2] ? 2 : 3;
  if (shot !== c.shot) {
    c.shot = shot; screenFlash(shot === 1 ? .85 : shot === 3 ? .55 : .25); sfx('whoosh'); G.linesI = 1;
    const ci = $('cutin');
    if (shot === 1) { stageEnter(f); G.shake = .25; sfx('ult', f.pos, .6); if (f.ch === CHARS.gato) copiesAround(f, 5, 2.1, 1.6, STAGE.scene); }
    if (shot === 2) { ci.classList.remove('hidden', 'show'); void ci.offsetWidth; ci.classList.add('show'); ringAt(chestOf(f), '#ffffff', 3, .35, 'face', f.yaw, STAGE.scene); }
    if (shot === 3) {
      ci.classList.add('hidden'); const tt = $('cinetitle'); tt.classList.remove('show'); void tt.offsetWidth; tt.classList.add('show');
      sfx('heavy'); STAGE.parts.burst(chestOf(f), 40, f.ch.color, 9, .1, .7, -.2); ringAt(new V3(f.pos.x, f.pos.y + .05, f.pos.z), f.ch.color, 6, .6, 'flat', 0, STAGE.scene); G.shake = .5;
      if (f.spear) { const tip = f.spear.localToWorld(new V3(0, 0, 24 * PX)); impactStar(tip, '#ffffff', 1.6, .35, STAGE.scene); }
      if (f.model.eyes) { const e = f.model.eyes.getWorldPosition(new V3()); impactStar(e, f.ch.color, 2.4, .4, STAGE.scene); sparkLines(e, f.ch.color, 8, 1.4, STAGE.scene); }
    }
  }
  if (shot >= 1 && Math.random() < dt * 25) { const p = chestOf(f), a = rand(0, TAU); STAGE.parts.emit(p.x + Math.cos(a) * 2.5, p.y + rand(-1, 1.5), p.z + Math.sin(a) * 2.5, -Math.cos(a) * 6, rand(-1, 1), -Math.sin(a) * 6, f.ch.color, .06, .35, 0, 0); }
  if (STAGE.on) updateStage(dt);
  const p = chestOf(f), an = rand(0, TAU);
  emit(p.x + Math.cos(an) * rand(1.4, 2.3), p.y + rand(-1.2, 1.2), p.z + Math.sin(an) * rand(1.4, 2.3), 0, rand(2, 5), 0, Math.random() < .4 ? '#ffffff' : f.ch.color, rand(.05, .1), .5, -.1, 1);
  f.model.mats.forEach(m => m.emissive.set(f.ch.color).multiplyScalar(.25 + .15 * Math.sin(c.t * 20)));
  PS.update(dt); updateFx(dt);
  if (c.t >= c.dur) {
    G.cine = null; document.body.classList.remove('cine');
    $('cutin').classList.add('hidden'); $('cinetitle').classList.remove('show');
    stageExit(); cineGrade(false, f);
    // vuelta al combate de golpe: impact frame + onda
    IMPACT.cd = 0; impactFrame(f.ch.color, .1); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), f.ch.color, 9, .5); G.shake = Math.max(G.shake, .6);
    f.model.mats.forEach(m => m.emissive.setRGB(0, 0, 0));
    runUlt(f); G.slowT = .25; G.fovKick = 10;
  }
}
// Efectos de la cinemática de Javi, sincronizados con su animación: destello al sacar la lanza,
// columna de luz al cielo en la estocada (1.19), rayo al frente al apuntar (1.92) y carga antes del salto.
function javiCineFx(c, f, dt) {
  const at = T => c.t >= T && c.t - dt < T, sc = STAGE.on ? STAGE.scene : scene, col = f.ch.color, Fy = fwd(f.yaw);
  if (at(.22)) { const p = chestOf(f); ringAt(p, '#ffffff', 2, .3, 'face', f.yaw, sc); sparkLines(p, col, 8, 1.8, sc); }
  if (at(1.19)) {
    const tip = anchorPoint(f, 'tip'), top = tip.clone().add(new V3(0, 14, 0));
    slashLine(tip, top, col, .7, .45, sc); slashLine(tip, top, '#ffffff', .5, .16, sc);
    impactStar(tip, '#ffffff', 2.6, .45, sc); sparkLines(tip, col, 12, 2.4, sc);
    ringAt(new V3(f.pos.x, f.pos.y + .06, f.pos.z), col, 5, .6, 'flat', 0, sc); STAGE.on && STAGE.parts.burst(tip, 30, col, 10, .14, .7, -.2);
    screenFlash(.5); G.shake = Math.max(G.shake, .55); sfx('boom', f.pos, .8);
  }
  if (at(1.92)) {
    const tip = anchorPoint(f, 'tip'), far = tip.clone().addScaledVector(Fy, 16);
    slashLine(tip, far, col, .55, .38, sc); slashLine(tip, far, '#ffffff', .4, .14, sc);
    impactStar(tip, '#ffffff', 2.2, .4, sc); sparkLines(tip, col, 10, 2.2, sc); ringAt(tip, col, 2.2, .4, 'face', f.yaw, sc);
    G.shake = Math.max(G.shake, .4); sfx('slash', f.pos);
  }
  if (c.t > 2.3 && c.t < 2.58 && STAGE.on && Math.random() < dt * 60) { const p = chestOf(f), a = rand(0, TAU); STAGE.parts.emit(p.x + Math.cos(a) * 1.6, p.y + rand(-1, 1), p.z + Math.sin(a) * 1.6, -Math.cos(a) * 7, rand(-1, 2), -Math.sin(a) * 7, Math.random() < .4 ? '#ffffff' : col, .09, .28, 0, 0); }
}
function miniCut(f) {
  const e = document.createElement('div'); e.className = 'mc'; e.style.setProperty('--cc', f.ch.color);
  const cv = headPortrait(f.skin); const tx = document.createElement('div'); const s = document.createElement('small'); s.textContent = f.name; const b = document.createElement('b'); b.textContent = f.ch.ult.n;
  tx.append(s, b); e.append(cv, tx); $('minicut').appendChild(e); setTimeout(() => e.remove(), 1900);
}

// ================= Control =================
const keys = {}, pressed = new Set(), mouse = { left: false, right: false };
// Especial de R: movilidad breve. La orden de gaviotas es una variante exclusiva de la playa.
const SEKZA_R={duration:3.5,flightCooldown:8,gullCooldown:14,doubleTap:.28,range:32,flocks:[]};
function onSekzaBeach(f){return f.pos.z>=68&&f.pos.z<=SHORE(f.pos.x)+2&&Math.abs(f.pos.x)<110&&!inSea(f.pos.x,f.pos.z);}
function canSekzaSpecial(f){return f&&(f.ch===CHARS.sekza||f.ch.canFly)&&!(f.isPlayer&&(G.panelOpen||G.paused||G.over))&&f.alive&&f.stun<=0&&f.ragdoll<=0&&f.frozen<=0&&!f.grabbed&&!f.cineLock&&!f.choreTrack&&!(f.action&&f.action.noControl)&&!(typeof VB!=='undefined'&&VB.on&&(f===G.player||f===VB.bot));}
function sekzaSpecialKey(f){
  if(!canSekzaSpecial(f))return false;
  const now=G.time;
  if(f.ch===CHARS.sekza&&onSekzaBeach(f)){
    if(f.rTapUntil>now){f.rTapUntil=0;return summonSekzaGulls(f);}
    f.rTapUntil=now+SEKZA_R.doubleTap;return true;
  }
  if(f.rFlightT>0){stopSekzaFlight(f);return true;}
  return startSekzaFlight(f);
}
function startSekzaFlight(f,remote=false){
  if(!remote&&(!canSekzaSpecial(f)||f.rFlightCD>0))return false;
  f.rFlightT=f.ch.canFly?5:SEKZA_R.duration;f.rFlightCD=SEKZA_R.flightCooldown;f.rFlightAltitude=Math.max(f.pos.y+.9,groundAt(f.pos.x,f.pos.z,f.pos.y)+2.7);
  f.onGround=false;f.vel.y=Math.max(f.vel.y,4.5);f.blocking=false;
  if(!remote)javiSpeak(f,'fly');
  if(!remote){ringAt(new V3(f.pos.x,f.pos.y+.15,f.pos.z),'#b9eff2',1.6,.3);sfx('whoosh',f.pos,.55);if(f.isPlayer&&G.mp)netAct({k:'r',mode:'flight'});}
  return true;
}
function stopSekzaFlight(f){f.rFlightT=0;f.rTapUntil=0;f.vel.y=Math.min(f.vel.y,1);}
function sekzaFlightControl(f,c,dt){
  if(!(f.rFlightT>0))return;
  if(!canSekzaSpecial(f)){stopSekzaFlight(f);return;}
  f.onGround=false;
  if(c.jump||c.down)f.rFlightAltitude+=((c.jump?1:0)-(c.down?1:0))*4.2*dt;
  f.rFlightAltitude=clamp(f.rFlightAltitude,groundAt(f.pos.x,f.pos.z,f.pos.y)+.5,70);
  const want=clamp((f.rFlightAltitude-f.pos.y)*5,-4.5,5.5);f.vel.y+=(want-f.vel.y)*Math.min(1,dt*12);
  if(c.mx||c.mz){f.vel.x+=(c.mx*11.5-f.vel.x)*Math.min(1,dt*8);f.vel.z+=(c.mz*11.5-f.vel.z)*Math.min(1,dt*8);}
}
function gullTargetId(f){return f.netId||f.peer||(f.isPlayer?(NET.named?.myId||NET.myPeer||'solo-player'):'solo-'+G.fighters.indexOf(f));}
function gullTargetById(id){return G.fighters.find(f=>gullTargetId(f)===id);}
function sekzaGullTargets(f){return enemiesOf(f).filter(g=>g!==f&&g.alive&&!g.grabbed&&!g.cineLock&&dist2d(f,g)<SEKZA_R.range&&Math.abs(g.pos.y-f.pos.y)<14&&g.pos.z>64).sort((a,b)=>dist2d(f,a)-dist2d(f,b)).slice(0,3);}
function summonSekzaGulls(f,remote=false,packet=null){
  if(!remote&&(!canSekzaSpecial(f)||!onSekzaBeach(f)||f.rGullCD>0))return false;
  const targets=packet?packet.ids.map(gullTargetById).filter(g=>g&&g!==f&&g.alive):sekzaGullTargets(f);
  if(!targets.length){if(f.isPlayer&&!remote)popText(chestOf(f),'No hay rivales cerca','#d9e7ed',16);return false;}
  const origin=packet?new V3(...packet.from):f.pos.clone(),seed=packet?.seed??((f.seed*997+G.time*1000)>>>0),rng=wxRandom(seed);
  f.rGullCD=SEKZA_R.gullCooldown;
  const template=BEACH.gulls[0];if(!template)return false;
  if(!remote)javiSpeak(f,'gulls');
  for(let i=0;i<6;i++){
    const root=template.g.clone(true),angle=rng()*TAU,start=origin.clone().add(new V3(Math.cos(angle)*(6+i),8+i*.6,Math.sin(angle)*(6+i)));
    root.position.copy(start);scene.add(root);
    SEKZA_R.flocks.push({root,wl:root.children[root.children.length-2],wr:root.children[root.children.length-1],owner:f,target:targets[i%targets.length],start,returnTo:origin.clone().add(new V3(Math.cos(angle)*14,13,Math.sin(angle)*14)),time:-i*.075,hit:false,remote});
  }
  if(!remote&&f.isPlayer&&G.mp)netAct({k:'r',mode:'gulls',ids:targets.map(gullTargetId),from:origin.toArray().map(r2),seed});
  if(!remote)sfx('whoosh',f.pos,.45);
  return true;
}
function updateSekzaSpecials(dt){
  for(const f of G.fighters){
    if(f.remote)continue;
    f.rFlightCD=Math.max(0,(f.rFlightCD||0)-dt);f.rGullCD=Math.max(0,(f.rGullCD||0)-dt);
    if(f.rTapUntil>0&&G.time>=f.rTapUntil){f.rTapUntil=0;startSekzaFlight(f);}
    if(f.rFlightT>0){f.rFlightT=Math.max(0,f.rFlightT-dt);if(!canSekzaSpecial(f)||!f.rFlightT)stopSekzaFlight(f);
      if(f.ch.canFly&&f.rFlightT>0){const sp=Math.hypot(f.vel.x,f.vel.z);for(let i=0;i<2;i++)emit(f.pos.x+rand(-.25,.25),f.pos.y+.1,f.pos.z+rand(-.25,.25),rand(-.4,.4),rand(-7,-3),rand(-.4,.4),Math.random()<.5?'#7df9ff':'#ffffff',.24,.28,0,1);if(sp>2&&Math.random()<.7){const R=rightOf(f.yaw);emit(f.pos.x+R.x*.5,f.pos.y+1.1,f.pos.z+R.z*.5,rand(-.3,.3),rand(-.5,.5),rand(-.3,.3),'#7df9ff',.16,.2,0,1);emit(f.pos.x-R.x*.5,f.pos.y+1.1,f.pos.z-R.z*.5,rand(-.3,.3),rand(-.5,.5),rand(-.3,.3),'#7df9ff',.16,.2,0,1);}}}
  }
  for(let i=SEKZA_R.flocks.length-1;i>=0;i--){
    const g=SEKZA_R.flocks[i];g.time+=dt;const t=g.time;
    if(t<0){g.root.visible=false;continue;}g.root.visible=true;
    if(!G.fighters.includes(g.owner)||!g.owner.alive||t>2.15){scene.remove(g.root);SEKZA_R.flocks.splice(i,1);continue;}
    const target=g.target;
    if(!G.fighters.includes(target)||!target.alive||target===g.owner){g.hit=true;}
    const end=chestOf(target),p=new V3();
    if(t<.95){
      const u=clamp(t/.95,0,1),v=1-u,mid=g.start.clone().lerp(end,.6);mid.y=Math.max(mid.y,end.y+4);
      p.copy(g.start).multiplyScalar(v*v).addScaledVector(mid,2*u*v).addScaledVector(end,u*u);
    }else{const u=clamp((t-.95)/1.2,0,1);p.copy(end).lerp(g.returnTo,u);p.y+=Math.sin(u*Math.PI)*3;}
    const d=p.clone().sub(g.root.position);if(d.lengthSq()>.0001)g.root.rotation.y=Math.atan2(d.x,d.z);g.root.position.copy(p);
    const flap=Math.sin(t*23)*.65;g.wl.rotation.z=flap;g.wr.rotation.z=-flap;
    if(!g.hit&&t>=.93){
      g.hit=true;
      // El dueño aplica el golpe una vez; el resto reproduce el vuelo y recibe el daño por la red existente.
      if(!g.remote&&target!==g.owner&&target.alive&&!target.cineLock&&p.distanceTo(chestOf(target))<1.8)applyHit(g.owner,target,{dmg:3,stun:.12,kb:1.2,up:.4,dir:new V3(d.x,0,d.z).normalize(),color:'#e9e7cf',noCounter:true,hitstop:0,sound:'hit'});
    }
  }
}
function clearSekzaFlocks(){for(const g of SEKZA_R.flocks)scene.remove(g.root);SEKZA_R.flocks.length=0;}
function updateSekzaSpecialHud(f){
  const el=$('sekza-special');const fl=f.ch===CHARS.sekza||f.ch.canFly;el.classList.toggle('hidden',!fl||G.viewer||G.cine!=null);
  if(!fl)return;
  const flight=f.rFlightT>0?'Volando · '+f.rFlightT.toFixed(1)+' s':f.rFlightCD>0?'Vuelo · '+Math.ceil(f.rFlightCD)+' s':'Vuelo breve · listo';
  const gull=f.rGullCD>0?'Gaviotas · '+Math.ceil(f.rGullCD)+' s':onSekzaBeach(f)?'Gaviotas · listas':'Gaviotas · solo en la playa';
  el.firstElementChild.textContent='R  '+flight;el.lastElementChild.textContent=f.ch===CHARS.sekza?'R ×2  '+gull:'';
}

const BINDS_DEF = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD',
  jump: 'Space', dash: 'KeyQ', block: 'KeyF',
  skill1: 'Digit1', skill2: 'Digit2', skill3: 'Digit3', skill4: 'Digit4',
  ult: 'KeyG', shiftLock: 'ShiftLeft', board: 'Tab', guide: 'KeyK', emote: 'KeyB'
};
const BINDS_LABELS = [
  ['forward', 'Mover adelante'], ['back', 'Mover atrás'],
  ['left', 'Mover a la izquierda'], ['right', 'Mover a la derecha'],
  ['jump', 'Saltar / Subir'], ['dash', 'Esquivar (Dash)'], ['block', 'Bloquear'],
  ['skill1', 'Habilidad 1'], ['skill2', 'Habilidad 2'],
  ['skill3', 'Habilidad 3'], ['skill4', 'Habilidad 4'],
  ['ult', 'Despertar (Ulti)'], ['shiftLock', 'Shift Lock (Fijar cámara)'],
  ['board', 'Tabla de jugadores (mantener)'], ['guide', 'Guía de combate'], ['emote', 'Emotes (mantener)']
];
const BINDS = Object.assign({}, BINDS_DEF);
try {
  const sb = JSON.parse(localStorage.getItem('bsb_binds_v1') || 'null');
  if (sb && typeof sb === 'object') for (const k of Object.keys(BINDS_DEF)) if (typeof sb[k] === 'string' && sb[k]) BINDS[k] = sb[k];
  if (sb && sb.guide === 'KeyB' && !sb.emote) BINDS.guide = 'KeyK';   // la B ahora abre los emotes: la guia se mueve a K
} catch (e) {}
function bindKeyLabel(code) {
  if (!code) return '—';
  if (code.startsWith('Key')) return code.slice(3).toUpperCase();
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'NUM ' + code.slice(6);
  const map = { Space: 'ESPACIO', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT DER', ControlLeft: 'CTRL', ControlRight: 'CTRL DER', AltLeft: 'ALT', AltRight: 'ALT DER', Tab: 'TAB', Enter: 'ENTER', Backspace: 'BORRAR', CapsLock: 'MAYÚS', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Backquote: 'º', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Semicolon: 'Ñ', Quote: '´', Comma: ',', Period: '.', Slash: '-' };
  return map[code] || code.toUpperCase();
}
function isBindShift(code) {
  return code === BINDS.shiftLock || (BINDS.shiftLock === 'ShiftLeft' && code === 'ShiftRight');
}

function playerCtl() {
  if (TRAVEL.lock) return { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false };   // portales: sin control
  if (G.viewer) return { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false };
  if (G.paused || roomInputBlocked()) return { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false };
  const c = { mx: 0, mz: 0, jump: !!keys[BINDS.jump], dash: pressed.has(BINDS.dash), m1: mouse.left, block: !!keys[BINDS.block], skill: -1, ult: pressed.has(BINDS.ult), down: !!keys.KeyC, up: !!keys[BINDS.jump] };
  const ix = (keys[BINDS.right] ? 1 : 0) - (keys[BINDS.left] ? 1 : 0) + (touchActive() ? TOUCH.x : 0), iz = (keys[BINDS.forward] ? 1 : 0) - (keys[BINDS.back] ? 1 : 0) + (touchActive() ? TOUCH.y : 0);
  if (ix || iz) { const d = fwd(cam.yaw).multiplyScalar(iz).add(rightOf(cam.yaw).multiplyScalar(ix)).normalize(); c.mx = d.x; c.mz = d.z; }
  const skBinds = [BINDS.skill1, BINDS.skill2, BINDS.skill3, BINDS.skill4];
  for (let i = 0; i < 4; i++) if (pressed.has(skBinds[i])) c.skill = i;
  return c;
}
function pickTarget(f) {
  let best = null, bs = 1e9;
  for (const g of enemiesOf(f)) { const s = dist2d(f, g) - (g.isPlayer ? f.ai.P.focus : 0) + Math.random() * 5; if (s < bs) { bs = s; best = g; } }
  return best;
}
const inRange = (r, d) => d >= r[0] && d <= r[1];
// Segmento contra las colisiones del mapa. También sirve para acercar la cámara a una pared.
const _sg={enter:0,exit:1};
function _slab(a0,d,lo,hi){
  const q=_sg;if(Math.abs(d)<1e-8){if(a0<lo||a0>hi){q.exit=-1;return false;}return true;}
  const t0=(lo-a0)/d,t1=(hi-a0)/d;
  if(t0<t1){if(t0>q.enter)q.enter=t0;if(t1<q.exit)q.exit=t1;}else{if(t1>q.enter)q.enter=t1;if(t0<q.exit)q.exit=t0;}
  return q.enter<=q.exit;
}
function citySegment(a,b,pad=.65,cameraTest=false){
  let nearest=1;
  const sx0=Math.min(a.x,b.x),sx1=Math.max(a.x,b.x),sz0=Math.min(a.z,b.z),sz1=Math.max(a.z,b.z);
  const cols=colQueryAABB(sx0-pad,sx1+pad,sz0-pad,sz1+pad,COL_GRID.segRes);
  for(let i=0;i<cols.length;i++){
    const c=cols[i];
    if(!cameraTest&&c.y0>1.9)continue;
    if(cameraTest&&(c.nocam||(c.hx<.6&&c.hz<.6)))continue;   // edificios (se ven a través) y postes finos: no acercan la cámara
    if(c.x+c.hx+pad<sx0||c.x-c.hx-pad>sx1||c.z+c.hz+pad<sz0||c.z-c.hz-pad>sz1)continue;
    _sg.enter=0;_sg.exit=1;
    if(_slab(a.x,b.x-a.x,c.x-c.hx-pad,c.x+c.hx+pad)&&_slab(a.z,b.z-a.z,c.z-c.hz-pad,c.z+c.hz+pad)&&(!cameraTest||_slab(a.y,b.y-a.y,(c.y0||0)-pad,c.h+pad))){
      if(_sg.exit>=0&&_sg.enter<=_sg.exit&&_sg.enter<nearest)nearest=Math.max(0,_sg.enter);
    }
  }
  return nearest;
}
// Cuadrícula fija; los bots rodean las manzanas en vez de empujar sus fachadas.
const CITY_NAV=(()=>{
  const n=157,step=1.5,origin=-117,free=new Uint8Array(n*n);
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    const wx=origin+x*step,wz=origin+z*step;
    free[z*n+x]=Math.hypot(wx,wz)<CITY.bounds && (!inSea(wx,wz)||Math.abs(wx)<4.6) && !navCols().some(c=>(!c.y0||c.y0<1.9)&&Math.abs(wx-c.x)<c.hx+.65&&Math.abs(wz-c.z)<c.hz+.65)?1:0;
  }
  return {n,step,origin,free};
})();
// Los muebles de los interiores llegan con los modelos (después de crear la cuadrícula): se vuelve a calcular qué celdas están libres.
function rebuildCityNav(){
  const {n,step,origin,free}=CITY_NAV;
  for(let z=0;z<n;z++)for(let x=0;x<n;x++){
    const wx=origin+x*step,wz=origin+z*step;
    free[z*n+x]=Math.hypot(wx,wz)<CITY.bounds && (!inSea(wx,wz)||Math.abs(wx)<4.6) && !navCols().some(c=>(!c.y0||c.y0<1.9)&&Math.abs(wx-c.x)<c.hx+.65&&Math.abs(wz-c.z)<c.hz+.65)?1:0;
  }
}
const NAVBUF={c:new Float32Array(157*157),p:new Int32Array(157*157),k:new Uint8Array(157*157)},NAV_DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
function cityRoute(from,to){
  const {n,step,origin,free}=CITY_NAV,total=n*n;
  const nearest=p=>{
    const cx=clamp(Math.round((p.x-origin)/step),0,n-1),cz=clamp(Math.round((p.z-origin)/step),0,n-1);
    for(let r=0;r<8;r++){
      let best=-1,bd=Infinity;
      for(let z=Math.max(0,cz-r);z<=Math.min(n-1,cz+r);z++)for(let x=Math.max(0,cx-r);x<=Math.min(n-1,cx+r);x++){
        const id=z*n+x,d=(origin+x*step-p.x)**2+(origin+z*step-p.z)**2;
        if(free[id]&&d<bd){best=id;bd=d;}
      }
      if(best>=0)return best;
    }
    return -1;
  };
  const start=nearest(from),end=nearest(to);if(start<0||end<0)return [];
  const costs=NAVBUF.c.fill(Infinity),prev=NAVBUF.p.fill(-1),closed=NAVBUF.k.fill(0);
  costs[start]=0;const ex=end%n,ez=Math.floor(end/n),heuristic=i=>Math.hypot(i%n-ex,Math.floor(i/n)-ez);
  // montículo binario por f = coste + heurística (la cuadrícula ahora es mucho más grande)
  const heap=[[heuristic(start),start]];
  const push=e=>{let i=heap.push(e)-1;while(i>0){const q=(i-1)>>1;if(heap[q][0]<=e[0])break;heap[i]=heap[q];i=q;}heap[i]=e;};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;for(;;){let c=i*2+1;if(c>=heap.length)break;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};
  while(heap.length){
    const id=pop()[1];if(id===end)break;if(closed[id])continue;closed[id]=1;
    const x=id%n,z=Math.floor(id/n);
    for(const [dx,dz] of NAV_DIRS){
      const xx=x+dx,zz=z+dz;if(xx<0||zz<0||xx>=n||zz>=n)continue;
      const next=zz*n+xx;if(!free[next]||closed[next]||(dx&&dz&&(!free[z*n+xx]||!free[zz*n+x])))continue;
      const cost=costs[id]+Math.hypot(dx,dz);if(cost>=costs[next])continue;
      costs[next]=cost;prev[next]=id;push([cost+heuristic(next),next]);
    }
  }
  if(start!==end&&prev[end]<0)return [];
  const path=[];for(let id=end;id!==start;id=prev[id])path.push(new V3(origin+(id%n)*step,0,origin+Math.floor(id/n)*step));
  return path.reverse();
}
function citySteer(f,target,c,dt){
  const ai=f.ai;if(!ai||f.action&&f.action.noControl||f.grabbed)return;
  if(worldBig()&&MAPCUR.id!=='A'&&(Math.abs(f.pos.x)>112||Math.abs(f.pos.z)>112||Math.abs(target.pos.x)>112||Math.abs(target.pos.z)>112)){ai.cityPath=null;return;}   // los biomas no tienen cuadrícula de rutas: se va recto
  if(citySegment(f.pos,target.pos)>.999){ai.cityPath=null;return;}
  ai.cityThink=(ai.cityThink||0)-dt;
  if(!ai.cityPath||ai.cityThink<=0){const T=target.pos;if(!ai.cityPath||!ai.cityTo||ai.cityPath.length<2||Math.hypot(T.x-ai.cityTo.x,T.z-ai.cityTo.z)>2.5||(ai.cityN=(ai.cityN||0)+1)%4===0){ai.cityPath=cityRoute(f.pos,T);ai.cityTo={x:T.x,z:T.z};}ai.cityThink=.9;}
  const path=ai.cityPath;if(!path.length)return;
  while(path.length>1&&f.pos.distanceToSquared(path[0])<1.7)path.shift();
  // Se omiten esquinas solo cuando el segmento está libre para todo el cuerpo.
  for(let i=Math.min(path.length-1,7);i>0;i--)if(citySegment(f.pos,path[i])>.999){path.splice(0,i);break;}
  const p=path[0],dx=p.x-f.pos.x,dz=p.z-f.pos.z,d=Math.hypot(dx,dz)||1;c.mx=dx/d;c.mz=dz/d;
}

function aiCtl(f, dt) {
  const c = { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false };
  if (G.rules.botsOff) return c;   // regla: bots quietos
  const ai = f.ai, P = ai.P;
  if(ownsMissingSpear(f)){
    const pos=spearDropPoint(f.spearLost),dx=pos.x-f.pos.x,dz=pos.z-f.pos.z,d=Math.hypot(dx,dz)||1;
    c.mx=dx/d;c.mz=dz/d;citySteer(f,{pos},c,dt);return c;
  }
  ai.retarget -= dt;
  if (ai.retarget <= 0 || !ai.target || !ai.target.alive) { ai.retarget = rand(2.5, 5); ai.target = pickTarget(f); }
  const t = ai.target; if (!t) return c;
  const dx = t.pos.x - f.pos.x, dz = t.pos.z - f.pos.z, d = Math.hypot(dx, dz) || .01, nx = dx / d, nz = dz / d;
  if (f.ragdoll > 0 && f.onGround && (f.rcCd || 0) <= 0 && Math.random() < P.dodge * dt * 2.5) { c.dash = true; const sg = Math.random() < .5 ? 1 : -1; if (Math.random() < .5) { c.mx = -nx; c.mz = -nz; } else { c.mx = -nz * sg; c.mz = nx * sg; } return c; }   // los bots tambien hacen ragdoll cancel
  const style = f.ch.ai, pref = style === 'ranged' ? 8 : style === 'mid' ? 5 : 1.9;
  ai.strafeT -= dt; if (ai.strafeT <= 0) { ai.strafeT = rand(1, 2.5); ai.strafe = Math.random() < .5 ? 1 : -1; }
  // reacciones a ataques del rival
  if (t.action && t.action !== ai.seen && d < 6) {
    ai.seen = t.action;
    ai.react = Math.random() < P.block ? (f.dashCd <= 0 && Math.random() < P.dodge ? 'dodge' : 'block') : null;
    ai.reactT = P.react * rand(.7, 1.3);
  }
  if (ai.react) { ai.reactT -= dt; if (ai.reactT <= 0) { if (ai.react === 'block') ai.blockT = rand(.35, .8); else { c.dash = true; ai.dodgeDir = Math.random() < .5 ? 1 : -1; } ai.react = null; } }
  // esquivar proyectiles
  if (f.dashCd <= 0 && P.dodge > 0) for (const p of PROJ) {
    if (p.owner === f) continue;
    const rx = f.pos.x - p.pos.x, rz = f.pos.z - p.pos.z, rd = Math.hypot(rx, rz) || .01;
    if (rd < 7 && (rx * p.vel.x + rz * p.vel.z) / (rd * p.speed) > .85 && Math.random() < P.dodge * dt * 6) { c.dash = true; ai.dodgeDir = Math.random() < .5 ? 1 : -1; break; }
  }
  let dirSign = 1;
  if (ai.flee > 0) { ai.flee -= dt; dirSign = -1; }
  else if (style !== 'melee' && d < pref - 2.5 && f.cd.some(x => x <= 0)) dirSign = -.8;
  if (dirSign < 0 || d > pref + .3) {
    const sw = d < 10 ? .55 : .15, sx = -nz * ai.strafe * sw, sz = nx * ai.strafe * sw;
    const mx = nx * dirSign + sx, mz = nz * dirSign + sz, l = Math.hypot(mx, mz) || 1; c.mx = mx / l; c.mz = mz / l;
  } else if (style !== 'melee') { c.mx = -nz * ai.strafe; c.mz = nx * ai.strafe; }
  else if (d < 1.1) { c.mx = -nx; c.mz = -nz; }
  // combo cuerpo a cuerpo
  const F = fwd(f.yaw), facing = nx * F.x + nz * F.z > .55;
  if (d < 2.7 && Math.abs(t.pos.y - f.pos.y) < 2.2 && dirSign > 0 && facing) {
    if (ai.m1hold > 0) { ai.m1hold -= dt; c.m1 = true; }
    else if (Math.random() < P.m1acc * dt * 7) ai.m1hold = rand(.5, 1.3);
    c.up = Math.random() < .35 * P.follow;
  } else ai.m1hold = 0;
  if (Math.random() < P.drop * dt) ai.m1hold = 0;
  if (ai.blockT > 0) { ai.blockT -= dt; c.block = true; c.m1 = false; c.mx *= .3; c.mz *= .3; }
  if (c.dash && ai.dodgeDir) { c.mx = -nz * ai.dodgeDir; c.mz = nx * ai.dodgeDir; ai.dodgeDir = 0; }
  // habilidades
  ai.think -= dt;
  if (ai.think <= 0) {
    ai.think = P.think * rand(.7, 1.3);
    if (f.ult >= 100 && f.awak <= 0 && d < 16 && Math.random() < .75) c.ult = true;
    else {
      const opts = [];
      skillsOf(f).forEach((s, i) => {
        if (f.cd[i] > 0 || !inRange(s.r, d)) return;
        const tags = s.tags || '';
        let w = 1;
        if (tags.includes('counter')) w = (t.action || t.comboTimer > .6) && d < 3.5 ? 4 : 0;
        if (t.blocking && tags.includes('gb')) w += 3;
        if ((t.ragdoll > 0 || t.pos.y > 1.6) && tags.includes('gap')) w += Math.round(3 * P.follow);
        if (t.stun > .4 && tags.includes('close')) w += Math.round(2 * P.follow);
        for (let k = 0; k < w; k++) opts.push(i);
      });
      if (opts.length && Math.random() < P.skill) c.skill = opts[Math.random() * opts.length | 0];
    }
    if (d > 11 && f.dashCd <= 0 && style === 'melee' && Math.random() < .35) c.dash = true;
    if (f.hp < f.maxHp * .28 && t.hp > f.hp + 25 && Math.random() < .12) ai.flee = rand(1.2, 2.2);
  }
  ai.jumpT -= dt; if (ai.jumpT <= 0) { ai.jumpT = rand(2, 6); if (d < 7) c.jump = Math.random() < .5; }
  if (dirSign > 0 && d > 3) citySteer(f,t,c,dt);
  return c;
}
// ===== Habilidades con secuencia de teclas y control: vive en js/combate/secuencias.js =====
const { PERFECT_BLOCK, applyCtl, blackFlashFx, clampArena, dashEnd, laserLeg, seqCancel, seqEnd, seqHud, seqStart, seqTick } = CF_COMBATE.crearSecuencias({ $, ARENA, G, TAU, V3, addFx, aimYawFor, angLerp, animeDashSmoke, applyHit, bbSet, burst, cam, chestOf, clamp, dist2d, doM1, endAction, enemiesOf, fwd, ghost, glowMat, impactFrame, javiSpeak, keys, later, mapNow, mountUpdate, popText, rand, ringAt, sebRemoteCtl, sekzaFlightControl, sfx, slashLine, sphereFlash, useSkill, useUlt, worldBig, wrapA, yawTo });
// ================= Física, tiempos y animación =================
function splashFx(f) {
  const p = new V3(f.pos.x, SEA_Y + .05, f.pos.z); burst(p, 18, '#bfe8ff', 6, .16, .6, .8, 3); ringAt(p, '#ffffff', 2.2, .5); sfx('whoosh', f.pos, .6);
}
const UW = { k: 0, bub: 0 };
function updateUnderwater(dt) {
  const cp = camera.position, p = G.player;
  const under = G.state === 'play' && !G.cine && !(p && p.abyss) && cp.y < SEA_Y - .02 && (cp.z > SHORE(cp.x) - 1 || !!lakeAt(cp.x, cp.z));
  UW.k += ((under ? 1 : 0) - UW.k) * Math.min(1, dt * 9);
  $('uw').style.opacity = UW.k.toFixed(3);
  if (UW.k > .01) {
    const depth = clamp((SEA_Y - cp.y) / 9, 0, 1), deepOut = clamp((cp.z - SHORE(cp.x) - 60) / 55, 0, 1);   // mar profundo: oscuro de verdad
    const ab = !!(p && p.abyss);   // en el abismo: agua oscura pero con luz suficiente para ver al jefe
    const c = ab ? new THREE.Color(0x06263a) : new THREE.Color(0x22808c).lerp(new THREE.Color(0x061f36), depth).lerp(new THREE.Color(0x01040b), deepOut * 0.97);
    scene.fog.color.lerp(c, UW.k); scene.background.lerp(c, UW.k);
    scene.fog.near = scene.fog.near * (1 - UW.k) + .6 * UW.k;
    scene.fog.far = scene.fog.far * (1 - UW.k) + (ab ? 120 : Math.max(9, (46 - depth * 18) * (1 - deepOut * 0.72))) * UW.k;
    if (deepOut > .3 && Math.random() < dt * (10 + (SEA.ev && SEA.ev.glow > 0 ? 30 : 0))) emit(cp.x + rand(-7, 7), cp.y + rand(-4, 3), cp.z + rand(-7, 7), rand(-.2, .2), rand(.05, .3), rand(-.2, .2), '#7df9ff', .09, 2.2, 0, 1);   // plancton luminoso
    UW.bub -= dt; if (UW.bub <= 0 && under) { UW.bub = .12; emit(cp.x + rand(-5, 5), cp.y + rand(-3, 2), cp.z + rand(-5, 5), 0, rand(.6, 1.4), 0, '#cfeeff', .07, 3, -.3, 1); }
  }
  if (uwFilter && AC) uwFilter.frequency.setTargetAtTime(under ? 650 : 22000, AC.currentTime, .06);
  const bar = $('airbar'), show = p && p.alive && G.state === 'play' && p.air != null && p.air < 19.8;
  bar.classList.toggle('hidden', !show); if (show) { bar.firstElementChild; bar.querySelector('i').style.width = (p.air / 20 * 100).toFixed(0) + '%'; bar.classList.toggle('low', p.air < 6); }
}
const CULL = {
  fr: new THREE.Frustum(), m: new THREE.Matrix4(), sp: new THREE.Sphere(), dirty: true, range: 210,
  groundBox: new THREE.Box3(new THREE.Vector3(-345, -2, -210), new THREE.Vector3(345, 1, 72)),
  waterBox: new THREE.Box3(new THREE.Vector3(-420, -4, 65), new THREE.Vector3(420, 4, 580)),
  seaBox: new THREE.Box3(new THREE.Vector3(-230, -22, 64), new THREE.Vector3(230, 34, 340)),
  cityArenaBox: new THREE.Box3(new THREE.Vector3(-120, -2, -120), new THREE.Vector3(120, 6, 68)),
  cityEdgesBox: new THREE.Box3(new THREE.Vector3(-120, -2, -120), new THREE.Vector3(120, 56, 68)),
  last: { x: 1e9, y: 1e9, z: 1e9, qx: 0, qy: 0, qz: 0, qw: 1, sx: 1e9, sz: 1e9, lvl: -1, sh: '', beta: -1, bbmN: -1, me: false, lod: false, outZ: -1 }
};
// no se dibuja lo que queda fuera de distancia o fuera de la cámara (frustum + zona + LOD instanciado + dirty-check)
function cityCull() { cityCull0(); if (CULL.fresh) { CULL.fresh = false; mapGate(); } }
// En el Valle Sakura todo lo de la ciudad, el mar profundo y el abismo desaparece (se vuelve a ver al regresar al otro mapa)
function mapGate() {
  if (!worldBig() || MAPCUR.id === 'A') return;
  const id = MAPCUR.id, b = MAPS[id].b;
  if (CITY.cull) for (const m of CITY.cull) if (m.userData.map !== id) m.visible = false;
  if (CITY.bldgLod) CITY.bldgLod.mesh.visible = false;
  if (window.BBM) for (const m of window.BBM) if (m && (!m.userData.isProp || m.position.x < b.x0 - 6 || m.position.x > b.x1 + 6)) m.visible = false;
  if (CITY.propsCull) for (const m of CITY.propsCull) if (!m.userData.mapAll) { const cx = m.userData.propCull.center.x; if (cx < b.x0 - 6 || cx > b.x1 + 6) m.visible = false; }
  for (const o of [CITY.edges, CITY.grassMesh, CITY.flowerMesh, MALL_BB.root, SEA.root]) if (o) o.visible = false;
}
function cityCull0() {
  if (!CITY.cull) return;
  const cp = camera.position, cq = camera.quaternion;
  const outZone = (cp.z > 560 || cp.y < -45 || cp.y > 480) ? 1 : 0;
  const meOpen = !!(typeof ME !== 'undefined' && ME.open);
  const beta = ZZZ_U.beta.value > 0.5;
  const shMode = GFX_CFG.shadows;
  const bbmN = window.BBM ? window.BBM.length : 0;
  const hasLod = !!CITY.bldgLod;
  const shTx = sun.target.position.x, shTz = sun.target.position.z;
  const L = CULL.last;
  if (!CULL.dirty && L.outZ === outZone && L.lvl === GFX.level && L.sh === shMode && L.beta === (beta ? 1 : 0) && L.bbmN === bbmN && L.me === meOpen && L.lod === hasLod) {
    const dpSq = (cp.x - L.x) ** 2 + (cp.y - L.y) ** 2 + (cp.z - L.z) ** 2;
    const dq = Math.abs(cq.x - L.qx) + Math.abs(cq.y - L.qy) + Math.abs(cq.z - L.qz) + Math.abs(cq.w - L.qw);
    const dsSq = (shTx - L.sx) ** 2 + (shTz - L.sz) ** 2;
    if (dpSq < 0.015 && dq < 0.0025 && dsSq < 0.09) return;
  }
  CULL.dirty = false; CULL.fresh = true;
  L.x = cp.x; L.y = cp.y; L.z = cp.z;
  L.qx = cq.x; L.qy = cq.y; L.qz = cq.z; L.qw = cq.w;
  L.sx = shTx; L.sz = shTz;
  L.lvl = GFX.level; L.sh = shMode; L.beta = beta ? 1 : 0; L.bbmN = bbmN; L.me = meOpen; L.lod = hasLod; L.outZ = outZone;

  camera.updateMatrixWorld(); CULL.m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); CULL.fr.setFromProjectionMatrix(CULL.m);
  const range = [210, 165, 130, 100, 78][GFX.level] || 130;
  CULL.range = range;
  const lod = CITY.bldgLod;

  if (outZone) {
    for (const mesh of CITY.cull) mesh.visible = false;
    if (lod) lod.mesh.visible = false;
    if (window.BBM) for (let i = 0; i < window.BBM.length; i++) if (window.BBM[i]) window.BBM[i].visible = false;
    if (CITY.propsCull) for (const m of CITY.propsCull) m.visible = false;
    if (CITY.ground) CITY.ground.visible = false;
    if (CITY.edges) CITY.edges.visible = false;
    if (CITY.grassMesh) CITY.grassMesh.visible = false;
    if (CITY.flowerMesh) CITY.flowerMesh.visible = false;
    if (BEACH.water) BEACH.water.visible = false;
    if (SEA.root) SEA.root.visible = false;
    if (MALL_BB.root) MALL_BB.root.visible = false;
    if (CITY.sunDisc) CITY.sunDisc.visible = false;
    for (const g of BEACH.gulls) g.g.visible = false;
    for (const c of CLOUDS) c.visible = false;
    return;
  }

  const nearKeep = shMode === 'off' ? 4 : 10;
  for (const mesh of CITY.cull) {
    const c = mesh.userData.cull; CULL.sp.center.copy(c.center); CULL.sp.radius = c.radius + 14;
    const dSq = cp.distanceToSquared(c.center);
    mesh.visible = dSq < (c.radius + range) ** 2 && (CULL.fr.intersectsSphere(CULL.sp) || dSq < (c.radius + nearKeep) ** 2);
  }
  if (lod) lod.mesh.visible = !meOpen;
  let lodDirty = false;
  if (window.BBM && !meOpen) {
    const propShDistSq = beta
      ? (shMode === 'off' ? 0 : (shMode === 'ultra' ? 54 * 54 : (shMode === 'hard' ? 40 * 40 : 48 * 48)))
      : (GFX.level === 0 ? 75 * 75 : (GFX.level === 1 ? 48 * 48 : 0));
    const smallShDistSq = (beta && shMode === 'ultra') ? 28 * 28 : 0;
    const bldgShDistSq = beta
      ? (shMode === 'off' ? 0 : (shMode === 'ultra' ? 54 * 54 : (shMode === 'hard' ? 36 * 36 : 42 * 42)))
      : propShDistSq;
    const propRangeSq = (range * 0.72) ** 2;
    const smallPropRangeSq = Math.min(propRangeSq, ([105, 82, 62, 48, 36][GFX.level] || 62) ** 2);
    const bldgRangeSq = (range + 18) ** 2;
    const bldgLodSq = ([110, 86, 66, 50, 38][GFX.level] || 66) ** 2;
    for (let i = 0; i < window.BBM.length; i++) {
      const m = window.BBM[i];
      if (!m || (m.userData.mapItem && m.userData.mapItem.del)) continue;
      if (!m.userData.cullSp && m.geometry) {
        if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
        if (m.geometry.boundingSphere) {
          m.updateMatrixWorld();
          m.userData.cullSp = m.geometry.boundingSphere.clone().applyMatrix4(m.matrixWorld);
        }
      }
      const dx = cp.x - m.position.x, dz = cp.z - m.position.z, dSq = dx * dx + dz * dz;
      const isProp = !!m.userData.isProp;
      const isSmallProp = isProp && !!m.userData.smallProp;
      const maxSq = isSmallProp ? smallPropRangeSq : (isProp ? propRangeSq : bldgRangeSq);
      let vis = dSq < maxSq;
      if (vis && m.userData.cullSp) {
        if (m.matrixAutoUpdate) CULL.sp.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
        else CULL.sp.copy(m.userData.cullSp);
        const rawR = CULL.sp.radius;
        CULL.sp.radius = rawR + 10;
        vis = CULL.fr.intersectsSphere(CULL.sp) || dSq < (rawR + 6) ** 2;
      }
      const lodIdx = m.userData.lodIdx;
      const lodEntry = m.userData.lodEntry;
      if (lod && lodEntry && lodIdx >= 0) {
        const wantLod = vis && dSq > bldgLodSq;
        if (wantLod !== lodEntry.lod) {
          lodEntry.lod = wantLod;
          lod.ps.set(lodEntry.x, lodEntry.y, lodEntry.z);
          if (wantLod) lod.sc.set(lodEntry.w, lodEntry.h, lodEntry.d);
          else lod.sc.set(0, 0, 0);
          lod.m4.compose(lod.ps, lod.q0, lod.sc);
          lod.mesh.setMatrixAt(lodIdx, lod.m4);
          lodDirty = true;
        }
        if (wantLod) {
          m.visible = false;
          m.castShadow = false;
          continue;
        }
      }
      m.visible = vis;
      const sdx = shTx - m.position.x, sdz = shTz - m.position.z;
      const shSq = isSmallProp ? smallShDistSq : (isProp ? propShDistSq : bldgShDistSq);
      m.castShadow = vis && shSq > 0 && (beta ? (sdx * sdx + sdz * sdz) : dSq) < shSq;
    }
    if (lod && lodDirty) lod.mesh.instanceMatrix.needsUpdate = true;
  } else {
    if (window.BBM) for (let i = 0; i < window.BBM.length; i++) { const m = window.BBM[i]; if (m && !(m.userData.mapItem && m.userData.mapItem.del)) m.visible = true; }
    if (lod) {
      for (let i = 0; i < lod.entries.length; i++) {
        const e = lod.entries[i];
        if (e.lod) {
          e.lod = false;
          lod.ps.set(e.x, e.y, e.z); lod.sc.set(0, 0, 0);
          lod.m4.compose(lod.ps, lod.q0, lod.sc);
          lod.mesh.setMatrixAt(i, lod.m4);
          lodDirty = true;
        }
      }
      if (lodDirty) lod.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  if (CITY.propsCull) {
    for (let i = 0; i < CITY.propsCull.length; i++) {
      const m = CITY.propsCull[i], c = m.userData.propCull;
      const dSq = cp.distanceToSquared(c.center);
      CULL.sp.center.copy(c.center); CULL.sp.radius = c.radius + 8;
      m.visible = dSq < (c.radius + range * c.rangeMul) ** 2 && (CULL.fr.intersectsSphere(CULL.sp) || dSq < (c.radius + 6) ** 2);
    }
  }
  if (CITY.ground) CITY.ground.visible = CULL.fr.intersectsBox(CULL.groundBox);
  if (CITY.edges) CITY.edges.visible = cp.z < 120 + range && CULL.fr.intersectsBox(CULL.cityEdgesBox);
  const inGrassBox = cp.z < 68 + range * 0.7 && CULL.fr.intersectsBox(CULL.cityArenaBox);
  if (CITY.grassMesh) CITY.grassMesh.visible = (CITY.grassMesh.count || 0) > 0 && inGrassBox;
  if (CITY.flowerMesh) CITY.flowerMesh.visible = (CITY.flowerMesh.count || 0) > 0 && inGrassBox;
  if (BEACH.water) BEACH.water.visible = CULL.fr.intersectsBox(CULL.waterBox);
  if (SEA.root) SEA.root.visible = (cp.z > 10 || cp.y > 8) && cp.z < 350 + range && CULL.fr.intersectsBox(CULL.seaBox);
  if (MALL_BB.root) {
    CULL.sp.center.set(0, 9.5, 53.5); CULL.sp.radius = 13;
    const bbDSq = cp.distanceToSquared(CULL.sp.center);
    MALL_BB.root.visible = bbDSq < (13 + range * 0.85) ** 2 && (CULL.fr.intersectsSphere(CULL.sp) || bbDSq < 361);
  }
  if (CITY.sunDisc) {
    CULL.sp.center.copy(CITY.sunDisc.position); CULL.sp.radius = 18;
    CITY.sunDisc.visible = CULL.fr.intersectsSphere(CULL.sp);
  }
}
// ---- fondo marino, corales, algas, naufragios, islas, barcos, delfines, tiburones y evento de ballena saltando
const SEA = { root: null, kelp: null, kelpD: [], fish: null, fishD: [], sharks: [], boats: [], dolphins: [], whale: null, beacon: null, sharksOn: true, whaleAuto: true, whaleTimer: 11, t: 0 };
try {
  SEA.sharksOn = localStorage.getItem('bsb_sea_sharks') !== '0';
  SEA.whaleAuto = localStorage.getItem('bsb_sea_whale') !== '0';
} catch (e) {}

function buildSharkMesh() {
  const g = new THREE.Group();
  const box = (w, h, d, col, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col }));
    m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx, ry, rz); g.add(m); return m;
  };
  // Torso y vientre blanco
  box(0.86, 0.56, 2.35, '#415466', 0, 0.08, 0.1);
  box(0.78, 0.24, 2.15, '#e3edf5', 0, -0.18, 0.12);
  // Hocico afilado y mandíbula con dientes
  box(0.68, 0.36, 0.95, '#415466', 0, 0.12, 1.55, 0.08, 0, 0);
  box(0.56, 0.16, 0.72, '#d9e6f0', 0, -0.16, 1.38, -0.18, 0, 0);
  box(0.50, 0.08, 0.56, '#ffffff', 0, -0.05, 1.44);
  // Ojos oscuros
  box(0.1, 0.1, 0.14, '#0c1017', 0.36, 0.18, 1.42);
  box(0.1, 0.1, 0.14, '#0c1017', -0.36, 0.18, 1.42);
  // Aleta dorsal alta (sobresale del agua)
  box(0.14, 1.05, 0.68, '#324354', 0, 0.74, 0.05, -0.28, 0, 0);
  box(0.12, 0.52, 0.36, '#293847', 0, 1.02, -0.12, -0.35, 0, 0);
  // Aletas pectorales
  box(0.95, 0.1, 0.54, '#3a4c5e', 0.68, -0.1, 0.45, 0, -0.25, -0.22);
  box(0.95, 0.1, 0.54, '#3a4c5e', -0.68, -0.1, 0.45, 0, 0.25, 0.22);
  // Cola articulada
  const tail = new THREE.Group(); tail.position.set(0, 0.06, -1.05); g.add(tail);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 1.15), new THREE.MeshLambertMaterial({ color: '#415466' }));
  t1.position.set(0, 0, -0.48); tail.add(t1);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.15, 0.48), new THREE.MeshLambertMaterial({ color: '#324354' }));
  t2.position.set(0, 0.18, -1.08); t2.rotation.x = 0.32; tail.add(t2);
  g.userData.tail = tail;
  return g;
}

function buildWhaleMesh() {
  const g = new THREE.Group();
  const box = (w, h, d, col, x, y, z, rx = 0, ry = 0, rz = 0, parent = g) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: col }));
    m.position.set(x, y, z); if (rx || ry || rz) m.rotation.set(rx, ry, rz); parent.add(m); return m;
  };
  // Cuerpo masivo de ballena jorobada (~14 bloques de largo)
  box(3.8, 2.7, 7.6, '#1f3144', 0, 0.35, 0.4);
  box(3.3, 1.35, 7.2, '#dde8f2', 0, -1.05, 0.5);
  // Pliegues ventrales
  for (let i = -2; i <= 2; i++) box(0.22, 0.16, 6.2, '#b3c7d9', i * 0.62, -1.68, 0.7);
  // Cabeza y mandíbula
  box(3.4, 1.9, 3.6, '#24384d', 0, 0.45, 5.2, 0.08, 0, 0);
  box(3.1, 1.1, 3.3, '#e6eff7', 0, -0.65, 5.0, -0.06, 0, 0);
  // Ojos
  box(0.24, 0.24, 0.32, '#0a0e14', 1.72, 0.32, 4.1);
  box(0.24, 0.24, 0.32, '#0a0e14', -1.72, 0.32, 4.1);
  // Joroba dorsal
  box(0.45, 0.95, 1.3, '#182636', 0, 1.85, -1.8, -0.35, 0, 0);
  // Aletas pectorales gigantes articuladas
  const finL = new THREE.Group(); finL.position.set(1.85, -0.35, 2.0); g.add(finL);
  box(4.6, 0.26, 1.35, '#24384d', 2.1, 0, -0.2, 0, -0.22, -0.18, finL);
  box(4.4, 0.14, 0.55, '#e8f1f8', 2.1, -0.08, 0.32, 0, -0.22, -0.18, finL);
  const finR = new THREE.Group(); finR.position.set(-1.85, -0.35, 2.0); g.add(finR);
  box(4.6, 0.26, 1.35, '#24384d', -2.1, 0, -0.2, 0, 0.22, 0.18, finR);
  box(4.4, 0.14, 0.55, '#e8f1f8', -2.1, -0.08, 0.32, 0, 0.22, 0.18, finR);
  // Pedúnculo caudal y gran aleta de cola (fluke)
  const tail = new THREE.Group(); tail.position.set(0, 0.15, -3.3); g.add(tail);
  box(2.1, 1.65, 3.8, '#1f3144', 0, 0, -1.7, -0.06, 0, 0, tail);
  box(1.2, 0.95, 2.4, '#182636', 0, -0.1, -4.1, -0.1, 0, 0, tail);
  box(5.6, 0.24, 1.65, '#182636', 0, -0.15, -5.3, 0, 0, 0, tail);
  box(5.2, 0.12, 0.55, '#dde8f2', 0, -0.22, -5.75, 0, 0, 0, tail);
  g.userData.finL = finL; g.userData.finR = finR; g.userData.tail = tail;
  return g;
}

function triggerWhaleEvent(forceNearPlayer = false) {
  if (!SEA.whale) return;
  const w = SEA.whale;
  const refX = (forceNearPlayer && G.player) ? G.player.pos.x : camera.position.x;
  const refZ = (forceNearPlayer && G.player) ? G.player.pos.z : camera.position.z;
  const x0 = clamp(refX + rand(-28, 28), -95, 95);
  const z0 = clamp(Math.max(SHORE(x0) + 34, refZ + 28), SHORE(x0) + 30, 185);
  const yaw = rand(-0.65, 0.65) + (Math.random() < 0.5 ? Math.PI * 0.45 : -Math.PI * 0.45);
  Object.assign(w, { active: true, t: 0, dur: 4.1, x0, z0, yaw, splashed: false, spouted: false });
  w.mesh.visible = true;
  w.mesh.position.set(x0, SEA_Y - 7, z0);
  w.mesh.rotation.set(0.95, yaw, 0);
  ringAt(new V3(x0, SEA_Y + 0.06, z0), '#8fe8ff', 9.5, 0.9);
  ringAt(new V3(x0, SEA_Y + 0.08, z0), '#ffffff', 6.0, 0.7);
  if (G.state === 'play') addFeedText('🐋 ¡Una ballena gigante está saltando en el mar!', '#7ad7ff');
}

function buildSeaWorld() {
  const rnd = (() => { let q = 77031; return () => (q = (q * 1664525 + 1013904223) >>> 0) / 4294967296; })();
  const root = new THREE.Group(); SEA.root = root; scene.add(root);
  // fondo con vértices de color según la profundidad
  const seg = [150, 130], geo = new THREE.PlaneGeometry(700, 470, seg[0], seg[1]); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c0 = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = 80 + pos.getZ(i) + 235; pos.setZ(i, z);
    const d = Math.max(0, z - SHORE(x)), under = z > SHORE(x) - 2; pos.setY(i, under ? seaFloor(x, Math.max(z, SHORE(x))) : -.5);
    const k = clamp(d / 70, 0, 1);
    c0.set('#e6d6a4').lerp(new THREE.Color('#8fb0a4'), clamp(d / 30, 0, 1)).lerp(new THREE.Color('#224457'), k * k);
    if (d > 30) c0.lerp(new THREE.Color('#020914'), clamp((d - 30) / 60, 0, 1));
    if (d > 95) c0.lerp(new THREE.Color('#00040a'), clamp((d - 95) / 45, 0, 1));
    c0.multiplyScalar(.9 + .1 * Math.sin(x * .7) * Math.cos(z * .6)); col[i * 3] = c0.r; col[i * 3 + 1] = c0.g; col[i * 3 + 2] = c0.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.computeVertexNormals();
  const bed = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })); bed.position.x = 0; root.add(bed);
  // instancias de cubos de colores: corales, rocas, naufragios, conchas, islas y faro
  const items = [], E = new THREE.Euler(), Q = new THREE.Quaternion(), M = new THREE.Matrix4(), P = new V3(), Sc = new V3();
  const B = (x, y, z, w, h, d, color, ry = 0, rx = 0, rz = 0) => items.push([x, y, z, w, h, d, color, ry, rx, rz]);
  const fl = (x, z) => seaFloor(x, z);
  const pick = a => a[(rnd() * a.length) | 0];
  const CORAL = ['#ff5f8a', '#ff9a3c', '#c46bff', '#ffd23f', '#4fd0c9', '#ff7a5c', '#7ee081'];
  for (let n = 0; n < 150; n++) {   // corales: ramas y cerebros
    const x = (rnd() - .5) * 300, z = SHORE(x) + 8 + rnd() * 140; if (z > 255) continue; const y = fl(x, z), c = pick(CORAL), kind = rnd();
    if (kind < .45) { for (let b = 0; b < 3 + rnd() * 5; b++) { const bx = x + (rnd() - .5) * 1.6, bz = z + (rnd() - .5) * 1.6, h = .5 + rnd() * 1.6; B(bx, fl(bx, bz) + h / 2, bz, .22, h, .22, c, rnd() * 3, (rnd() - .5) * .4, (rnd() - .5) * .4); if (h > 1) B(bx + .18, fl(bx, bz) + h * .7, bz, .5, .16, .16, c, rnd() * 3); } }
    else if (kind < .75) { const r = .5 + rnd() * .9; B(x, y + r * .45, z, r * 2, r * .9, r * 2, c, rnd() * 3); B(x, y + r * .95, z, r * 1.4, r * .5, r * 1.4, c, rnd() * 3); }
    else { for (let b = 0; b < 4; b++) { const a = b / 4 * 6.28, bx = x + Math.cos(a) * .5, bz = z + Math.sin(a) * .5; B(bx, fl(bx, bz) + .55, bz, .5, 1.1 + rnd() * .5, .12, c, a, 0, (rnd() - .5) * .3); } }
  }
  for (let n = 0; n < 90; n++) {   // rocas
    const x = (rnd() - .5) * 320, z = SHORE(x) + 6 + rnd() * 160; if (z > 255) continue; const r = .6 + rnd() * 2.2, g = 100 + (rnd() * 50 | 0), cc = 'rgb(' + g + ',' + (g + 8) + ',' + (g + 14) + ')';
    B(x, fl(x, z) + r * .4, z, r * 1.6, r * .9, r * 1.3, cc, rnd() * 3, (rnd() - .5) * .3, (rnd() - .5) * .3); if (r > 1.4) B(x + r * .5, fl(x, z) + r * .9, z, r, r * .7, r, cc, rnd() * 3);
  }
  for (let n = 0; n < 160; n++) { const x = (rnd() - .5) * 300, z = SHORE(x) + 3 + rnd() * 150; if (z > 255) continue; const y = fl(x, z); if (rnd() < .5) { for (let a = 0; a < 5; a++) B(x + Math.cos(a * 1.25) * .26, y + .04, z + Math.sin(a * 1.25) * .26, .38, .06, .1, '#ff8a3c', a * 1.25); } else B(x, y + .06, z, .26, .12, .2, '#f6e9d0', rnd() * 3); }
  // naufragios
  function wreck(x, z, ry, sc, tilt) {
    const y = fl(x, z), c = (o, ...r) => o;
    const L = (u, v, w, h, d, col, rr = 0, rx = 0, rz = 0) => { const co = Math.cos(ry), si = Math.sin(ry); B(x + (u * co + w * 0 + v * 0) * 0 + u * co - 0 * si, y + h / 2 + (u * 0), z + u * si, 0, 0, 0, col); items.pop(); };
    const place = (u, vy, w, h, d, col, extraRy = 0, rx = 0, rz = 0) => { const co = Math.cos(ry), si = Math.sin(ry), px = x + (u * si + w * co) * sc, pz = z + (u * co - w * si) * sc; B(px, y + vy * sc, pz, (Math.abs(w) > 0 && false ? 0 : 1) * 0 + 1, 1, 1, col); items.pop(); items.push([px, y + vy * sc, pz, 0, 0, 0, col, ry + extraRy, rx + tilt * 0, rz + tilt]); return items[items.length - 1]; };
    const W = '#6b4a2e', D = '#4d331f', G = '#8a6a43';
    const add = (u, vy, w, sx, sy, sz, col, eRy = 0, rx = 0, rz = 0) => { const it = place(u, vy, w, 0, 0, col, eRy, rx, rz); it[3] = sx * sc; it[4] = sy * sc; it[5] = sz * sc; };
    add(0, .25, 0, .9, .5, 15, D);                                 // quilla
    for (let i = -6; i <= 6; i++) { if (rnd() < .22) continue; add(i * 1.1, 1.6, 1.9, .22, 2.8, .26, W, 0, 0, -.5); add(i * 1.1, 1.6, -1.9, .22, 2.8, .26, W, 0, 0, .5); }   // costillas (algunas rotas)
    for (let i = -6; i <= 6; i++) { if (rnd() < .35) continue; add(i * 1.1, .55, 0, 3.0, .12, .95, G); }   // tablones de la cubierta que quedan
    add(1.5, 3.4, .4, .32, 6.2, .32, D, 0, .25, .12);                // mástil roto
    add(-3.5, 2.0, -.3, .26, 4.6, .26, D, 0, -.5, .2); add(1.5, 5.6, .9, 3.4, .14, .14, W, 0, 0, .2);
    add(5.5, 1.1, 1.2, .7, .7, .7, '#3a3d44'); add(5.9, 1.1, -1.2, .7, .7, .7, '#3a3d44');   // cañones
    add(-1.5, .75, .4, 1.2, .7, .8, '#9b6a2a'); add(-1.5, 1.14, .4, 1.25, .12, .85, '#e6b73c');   // cofre con tapa dorada
    for (let i = 0; i < 9; i++) add(-1.5 + (rnd() - .5) * 2.6, .15, .4 + (rnd() - .5) * 2.4, .3, .06, .3, '#ffd23f');   // monedas
    add(-6.8, .5, -1.4, .15, 1.5, .15, '#555a60', 0, 0, .8); add(-6.8, .2, -1.4, 1.1, .12, .15, '#555a60');   // ancla
  }
  wreck(-58, SHORE(-58) + 44, .5, 1, .1); wreck(46, SHORE(46) + 70, 2.4, 1.15, -.18); wreck(-12, SHORE(-12) + 118, 1.2, 1.7, .22); wreck(98, SHORE(98) + 38, 4, .8, .06); wreck(-110, SHORE(-110) + 96, 3.3, 1.3, -.12);
  // arco de roca y círculo de piedras antiguas
  for (let i = -3; i <= 3; i++) { const x = 20 + i * 2.2, z = SHORE(x) + 56, h = 6 - Math.abs(i) * 1.1; B(x, fl(x, z) + h / 2, z, 2.2, h, 2.4, '#7d848c', 0, 0, i * .03); }
  for (let a = 0; a < 8; a++) { const x = 112 + Math.cos(a * .785) * 6, z = SHORE(112) + 80 + Math.sin(a * .785) * 6; B(x, fl(x, z) + 1.2, z, .9, 2.4 + (a % 3) * .5, .9, '#8c8f86'); }

  // === NUEVO CONTENIDO MARINO: Isla del Faro (-82, 152) ===
  {
    const lx = -82, lz = 152, topY = SEA_Y + 2.0;
    B(lx, topY - 4.5, lz, 15, 9, 15, '#565e68');
    B(lx, topY - 0.5, lz, 12.5, 1.4, 12.5, '#6c7580');
    COL.push({ x: lx, z: lz, hx: 6.2, hz: 6.2, y0: -6, h: topY + 0.2 });
    // Torre del faro a franjas rojas y blancas
    for (let s = 0; s < 6; s++) {
      const w = 3.6 - s * 0.28, sy = topY + 0.2 + s * 2.1;
      B(lx, sy + 1.05, lz, w, 2.1, w, s % 2 === 0 ? '#f4f6fa' : '#d83b3b');
    }
    const lanY = topY + 0.2 + 6 * 2.1;
    B(lx, lanY + 0.2, lz, 2.8, 0.4, 2.8, '#282d38');
    B(lx, lanY + 1.1, lz, 1.9, 1.4, 1.9, '#ffe875');
    B(lx, lanY + 2.1, lz, 2.4, 0.6, 2.4, '#d83b3b');
    COL.push({ x: lx, z: lz, hx: 1.7, hz: 1.7, y0: topY, h: lanY + 2.4 });
    // Haz de luz giratorio del faro
    const beamGrp = new THREE.Group(); beamGrp.position.set(lx, lanY + 1.1, lz);
    const beamGeo = new THREE.ConeGeometry(4.2, 26, 16, 1, true); beamGeo.rotateX(Math.PI / 2); beamGeo.translate(0, 0, 13);
    const beamMat = new THREE.MeshBasicMaterial({ color: '#ffe885', transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    beamGrp.add(new THREE.Mesh(beamGeo, beamMat)); root.add(beamGrp); SEA.beacon = beamGrp;
  }

  // === NUEVO CONTENIDO MARINO: Isla Tropical del Tesoro (78, 144) ===
  {
    const ix = 78, iz = 144, iy = SEA_Y + 1.25;
    B(ix, iy - 4.0, iz, 17, 8, 17, '#c7b079');
    B(ix, iy - 0.2, iz, 13.5, 1.0, 13.5, '#e8d59e');
    COL.push({ x: ix, z: iz, hx: 6.7, hz: 6.7, y0: -6, h: iy + 0.3 });
    // Muelle de madera
    B(ix - 8.2, SEA_Y + 0.65, iz, 4.5, 0.28, 2.4, '#7c5633');
    B(ix - 9.8, SEA_Y - 0.6, iz - 0.9, 0.3, 2.6, 0.3, '#523820');
    B(ix - 9.8, SEA_Y - 0.6, iz + 0.9, 0.3, 2.6, 0.3, '#523820');
    // Palmera curva y cofre del tesoro brillante
    for (let s = 0; s < 6; s++) B(ix + 1.8 + s * 0.25, iy + 0.7 + s * 0.95, iz - 1.2, 0.65 - s * 0.04, 1.05, 0.65 - s * 0.04, '#7d5634', 0, 0, -s * 0.06);
    const tx = ix + 3.2, ty = iy + 6.4, tz = iz - 1.2;
    for (let a = 0; a < 6; a++) { const ang = a * Math.PI / 3; B(tx + Math.cos(ang) * 1.9, ty - 0.15, tz + Math.sin(ang) * 1.9, 0.85, 0.24, 2.8, '#3ca34b', ang, 0.28, 0); }
    B(ix - 1.4, iy + 0.65, iz + 1.2, 1.4, 0.85, 0.95, '#8c5828');
    B(ix - 1.4, iy + 1.15, iz + 1.2, 1.46, 0.22, 1.0, '#ffd23f');
  }

  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), items.length); inst.frustumCulled = false;
  const cc = new THREE.Color();
  items.forEach((it, i) => { E.set(it[8], it[7], it[9], 'YXZ'); Q.setFromEuler(E); M.compose(P.set(it[0], it[1], it[2]), Q, Sc.set(it[3], it[4], it[5])); inst.setMatrixAt(i, M); inst.setColorAt(i, cc.set(it[6])); });
  inst.instanceColor.needsUpdate = true; root.add(inst);
  // algas que se mecen
  const KN = 260, kg = new THREE.BoxGeometry(1, 1, 1); kg.translate(0, .5, 0);
  SEA.kelp = new THREE.InstancedMesh(kg, new THREE.MeshLambertMaterial({ color: 0xffffff }), KN); SEA.kelp.frustumCulled = false;
  for (let n = 0; n < KN; n++) { const cx = (rnd() - .5) * 300, cz = SHORE(cx) + 10 + rnd() * 150; const z = Math.min(cz, 250); SEA.kelpD.push({ x: cx, z, y: fl(cx, z) - .1, h: 2.2 + rnd() * 6, w: .16 + rnd() * .12, ph: rnd() * 6 }); SEA.kelp.setColorAt(n, cc.setHSL(.27 + rnd() * .1, .6, .28 + rnd() * .14)); }
  SEA.kelp.instanceColor.needsUpdate = true; root.add(SEA.kelp);
  // peces en cardúmenes
  const FN = 130, fgm = new THREE.BoxGeometry(1, 1, 1); SEA.fish = new THREE.InstancedMesh(fgm, new THREE.MeshLambertMaterial({ color: 0xffffff }), FN); SEA.fish.frustumCulled = false;
  const schools = []; for (let n = 0; n < 9; n++) { const x = (rnd() - .5) * 240, z = SHORE(x) + 20 + rnd() * 140; schools.push({ x, z, y: fl(x, z) + 2 + rnd() * 3.5, r: 3 + rnd() * 5, sp: .25 + rnd() * .3, c: pick(['#ffb347', '#59c3ff', '#ff6f91', '#f9f871', '#9be564']) }); }
  for (let n = 0; n < FN; n++) { const sc = schools[n % schools.length]; SEA.fishD.push({ s: sc, a: rnd() * 6.28, o: rnd() * 1.4 - .7, dy: (rnd() - .5) * 1.6, sz: .3 + rnd() * .22 }); SEA.fish.setColorAt(n, cc.set(sc.c).offsetHSL(0, 0, (rnd() - .5) * .1)); }
  SEA.fish.instanceColor.needsUpdate = true; root.add(SEA.fish);
  // boyas en el borde del mar (dentro de SEA.root para heredar culling del mar)
  for (let x = -160; x <= 160; x += 20) { const bz = 258; const b = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.1, .7), new THREE.MeshLambertMaterial({ color: (x / 20) % 2 ? 0xe84a4a : 0xffffff })); b.position.set(x, SEA_Y + .2, bz); b.userData.buoy = x; root.add(b); (SEA.buoys || (SEA.buoys = [])).push(b); }

  // === Veleros / Botes flotantes donde se puede subir a pelear ===
  const boatSpecs = [
    { x: -30, z: 118, col: '#ff5f5f', ry: 0.35 },
    { x: 34, z: 124, col: '#4fc3ff', ry: -0.45 },
    { x: 2, z: 162, col: '#ffd23f', ry: 1.1 }
  ];
  for (const bs of boatSpecs) {
    const bg = new THREE.Group(); bg.position.set(bs.x, SEA_Y, bs.z); bg.rotation.y = bs.ry;
    const addB = (w, h, d, c, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); bg.add(m); };
    addB(3.8, 0.75, 7.2, '#6e4726', 0, 0.1, 0);
    addB(3.2, 0.25, 6.4, '#a67b4b', 0, 0.52, 0);
    addB(0.28, 6.2, 0.28, '#4d3219', 0, 3.5, 0.3);
    addB(0.18, 4.2, 3.6, bs.col, 0, 3.8, -0.8);
    addB(0.22, 3.5, 2.2, '#f5f7fa', 0, 3.5, 1.8);
    root.add(bg);
    SEA.boats.push({ mesh: bg, x: bs.x, z: bs.z, ry: bs.ry, ph: rnd() * 6.28 });
    COL.push({ x: bs.x, z: bs.z, hx: 2.2, hz: 3.4, y0: SEA_Y - 1.2, h: SEA_Y + 0.68 });
  }

  // === Tiburones 3D patrullando el mar profundo ===
  const sharkCenters = [   // solo en el mar profundo (a mas de ~95 m de la orilla); los 3 ultimos aparecen en el evento "Frenesi de tiburones"
    { cx: -58, cz: 200, rx: 28, rz: 16, sp: 0.38 },
    { cx: -15, cz: 206, rx: 25, rz: 14, sp: -0.42 },
    { cx: 25, cz: 212, rx: 26, rz: 15, sp: 0.40 },
    { cx: 65, cz: 218, rx: 26, rz: 15, sp: -0.37 },
    { cx: -30, cz: 232, rx: 34, rz: 18, sp: 0.34 },
    { cx: 35, cz: 238, rx: 32, rz: 18, sp: -0.35 },
    { cx: -70, cz: 215, rx: 24, rz: 14, sp: 0.45, extra: true },
    { cx: 5, cz: 226, rx: 26, rz: 14, sp: -0.5, extra: true },
    { cx: 70, cz: 228, rx: 24, rz: 14, sp: 0.48, extra: true }
  ];
  sharkCenters.forEach((sc, idx) => {
    const mesh = buildSharkMesh();
    root.add(mesh);
    SEA.sharks.push({ mesh, cx: sc.cx, cz: sc.cz, rx: sc.rx, rz: sc.rz, sp: sc.sp, a: idx * 1.1, x: sc.cx, z: sc.cz, yaw: 0, ph: idx * 1.7, biteCd: 0, lungeT: 0, extra: !!sc.extra });
  });

  // === Delfines saltando en arcos ===
  for (let i = 0; i < 4; i++) {
    const dg = new THREE.Group();
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.42, 1.65), new THREE.MeshLambertMaterial({ color: '#5b8fb8' }));
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.48, 0.42), new THREE.MeshLambertMaterial({ color: '#467499' })); b2.position.set(0, 0.34, -0.1); b2.rotation.x = -0.3;
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.36), new THREE.MeshLambertMaterial({ color: '#467499' })); b3.position.set(0, 0, -0.85);
    dg.add(b1, b2, b3); root.add(dg);
    SEA.dolphins.push({ mesh: dg, cx: -65 + i * 44, cz: 128 + (i % 2) * 24, ph: i * 1.55 });
  }

  // === Ballena Jorobada Gigante (Evento de Salto) ===
  const whaleMesh = buildWhaleMesh();
  whaleMesh.visible = false;
  root.add(whaleMesh);
  SEA.whale = { mesh: whaleMesh, active: false, t: 0, dur: 4.1, x0: 0, z0: 140, yaw: 0, splashed: false, spouted: false };
  buildSeaLife(root, rnd);
}

// ===== Vida marina y eventos del mar: vive en js/mundo/vida_marina.js =====
const { SEA_EVENTS, buildSeaLife, krakenBlocked, seaEventsUi, triggerSeaEvent, updateSea } = CF_MUNDO.crearVidaMarina({ $, G, MAPCUR, SEA, SEA_Y, SHORE, TAU, V3, angLerp, burst, camera, chestOf, emit, involvesPlayerNear, kill, popText, rand, ringAt, seaFloor, sfx, shakeFrom, triggerWhaleEvent, worldBig, get addFeedText() { return addFeedText; }, get GFX() { return GFX; }, get PERF_FRAME() { return PERF_FRAME; }, get amCoord() { return amCoord; }, get NETPUB() { return NETPUB; } });
// ===== Cartel publicitario del centro comercial: vive en js/mundo/cartel_mall.js =====
const { MALL_BB, initMallBillboard, updateMallBillboard } = CF_MUNDO.crearCartelMall({ COL, camera, scene });
function seaBounds(v) {   // el mar y la costa: caja ancha en vez del círculo de la ciudad
  if (v.z <= 66 || Math.abs(v.x) > 355) return false;
  const b = (worldBig() && !mapNow().circle) ? mapNow().b : { x0: -348, x1: 348, zs: 545 };
  v.x = clamp(v.x, b.x0, b.x1); v.z = Math.min(v.z, b.zs); return true;   // el mar es mucho mas grande
}
function physics(f, dt) {
  if (f.mount && (f.mount.phase === 'climb' || f.mount.phase === 'ride')) { f.vel.set(0, 0, 0); f.onGround = true; return; }
  // La pista dirige el cuerpo durante la toma; la gravedad vuelve al soltarlo.
  if (f.choreTrack) { f.onGround = f.pos.y <= groundAt(f.pos.x, f.pos.z) + .02; return; }
  const a = f.action;
  if (f.frozen > 0) { f.vel.x = f.vel.z = 0; }
  { // ¿está en aguas hondas? (no sobre el muelle ni en la orilla)
    const gz = f.onBoat != null ? f.onBoat : groundAt(f.pos.x, f.pos.z, f.pos.y), was = !!f.swim;   // a bordo del barco: la cubierta cuenta como suelo (no se nada)
    f.swim = !f.abyss && f.alive && wetAt(f.pos.x, f.pos.z) && gz < SEA_Y - .9 && f.pos.y < SEA_Y + .3;
    f.wade = !f.swim && !f.abyss && (f.pos.z > SHORE(f.pos.x) || !!lakeAt(f.pos.x, f.pos.z)) && gz < SEA_Y - .3 && f.pos.y < SEA_Y + .3;
    if (f.swim !== was && f.alive) { splashFx(f); if (f.isPlayer && f.swim && !G.swimHint) { G.swimHint = true; showBanner('NADANDO', '#7ad7ff', 'Mira abajo y avanza para bucear · Espacio sube · C baja'); } }
    if (f.swim) {
      const surf = SEA_Y - 1.2, up = f.ctlJump, dn = f.ctlDown;
      const hsp = Math.hypot(f.vel.x, f.vel.z), look = f.isPlayer && hsp > 1 ? -Math.sin(cam.pitch) * hsp * 1.15 : 0;   // mirar abajo y avanzar = bucear; mirar arriba = subir
      let tv = up ? 3.4 : dn ? -3.6 : hsp > 1 ? look : (surf - f.pos.y) * .7;
      if (f.pos.y > surf && tv > 0 && !up) tv = 0;
      f.vel.y += (tv - f.vel.y) * Math.min(1, dt * 5); f.vel.x *= Math.exp(-1.6 * dt); f.vel.z *= Math.exp(-1.6 * dt);
      if (f.pos.y > surf + .35 && f.vel.y > 0 && !up) f.vel.y *= .4;
    }
    // aire: 20 s bajo el agua; sin aire, daño
    f.air = f.air == null ? 20 : f.air;
    if (!f.abyss && f.alive && f.pos.y + 1.7 < SEA_Y - .05 && wetAt(f.pos.x, f.pos.z)) {
      f.air -= dt;
      if (f.air <= 0) { f.air = 0; f.airT = (f.airT || 0) + dt; if (f.airT > 1) { f.airT = 0; f.hp -= 4; popText(chestOf(f), '¡SIN AIRE!', '#7ad7ff', 18); if (f.hp <= 0 && f.alive) kill(f, f); } }
    } else f.air = Math.min(20, f.air + dt * 9);
    if (f.swim && f.alive && Math.random() < dt * (Math.hypot(f.vel.x, f.vel.z) > 1 ? 7 : 2.5) && f.pos.y + 1.2 < SEA_Y) emit(f.pos.x + rand(-.2, .2), f.pos.y + 1.4, f.pos.z + rand(-.2, .2), rand(-.3, .3), rand(.8, 1.6), rand(-.3, .3), '#cfeeff', .1, 1.4, -.5, 1);
  }
  if(!(f.rFlightT>0&&canSekzaSpecial(f))&&!f.swim)f.vel.y -= 32 * G.rules.grav * dt;
  const free = f.dashT > 0 || (a && a.noControl);
  if (!free && (f.stun > 0 || f.ragdoll > 0 || !f.alive)) { const fr = f.onGround ? Math.exp(-(f.ragdoll > 0 ? 2.3 : 5) * dt) : Math.exp(-.5 * dt); f.vel.x *= fr; f.vel.z *= fr; }
  f.pos.addScaledVector(f.vel, dt);
  if (f.clashT && G.time > f.clashT) f.clashT = 0;
  // Colision de cuerpo a cuerpo entre luchadores (capsula fisica para que no se traspasen)
  if (f.alive && !f.swim) {
    for (const g of G.fighters) {
      if (g === f || !g.alive || g.swim) continue;
      if ((f.cineLock && f.cineLock !== g) || (g.cineLock && g.cineLock !== f)) continue;
      const fdy = Math.abs(f.pos.y - g.pos.y);
      if (fdy > 1.85) continue;
      let cdx = f.pos.x - g.pos.x, cdz = f.pos.z - g.pos.z;
      let cdist = Math.hypot(cdx, cdz);
      const minD = 0.82;
      if (cdist < minD) {
        if (cdist < 1e-4) { cdx = Math.cos(f.yaw || 0); cdz = Math.sin(f.yaw || 0); cdist = 1; }
        const overlap = minD - cdist;
        const nx = cdx / cdist, nz = cdz / cdist;
        let fWeight = 0.5, gWeight = 0.5;
        if (f.ragdoll > 0 && g.ragdoll <= 0) { fWeight = 0.82; gWeight = 0.18; }
        else if (g.ragdoll > 0 && f.ragdoll <= 0) { fWeight = 0.18; gWeight = 0.82; }
        else if (f.dashT > 0) { fWeight = 0.25; gWeight = 0.75; }
        else if (g.dashT > 0) { fWeight = 0.75; gWeight = 0.25; }
        f.pos.x += nx * overlap * fWeight; f.pos.z += nz * overlap * fWeight;
        g.pos.x -= nx * overlap * gWeight; g.pos.z -= nz * overlap * gWeight;
        const rvx = f.vel.x - g.vel.x, rvz = f.vel.z - g.vel.z;
        const rvn = rvx * nx + rvz * nz;
        if (rvn < 0) {
          f.vel.x -= nx * rvn * 0.4 * fWeight; f.vel.z -= nz * rvn * 0.4 * fWeight;
          g.vel.x += nx * rvn * 0.4 * gWeight; g.vel.z += nz * rvn * 0.4 * gWeight;
        }
      }
    }
  }
  const physCols = colQuery(f.pos.x, f.pos.z, 1.5, COL_GRID.physRes);
  for (let ci = 0; ci < physCols.length; ci++) {
    const c = physCols[ci];
    if (c.rubble) continue; // Los monticulos de escombros son terreno caminable en groundAt, no paredes
    if(c.y0&&f.pos.y+1.85<c.y0)continue;
    if(c.ceiling&&f.pos.y<c.y0&&Math.abs(f.pos.x-c.x)<c.hx+.3&&Math.abs(f.pos.z-c.z)<c.hz+.3){
      if(f.vel.y>0&&f.pos.y+1.85>=c.y0){f.pos.y=c.y0-1.85;f.vel.y=0;}continue;
    }
    if (f.pos.y >= c.h - .1) continue;
    const cx = clamp(f.pos.x, c.x - c.hx, c.x + c.hx), cz = clamp(f.pos.z, c.z - c.hz, c.z + c.hz);
    let dx = f.pos.x - cx, dz = f.pos.z - cz; const d = Math.hypot(dx, dz);
    if (d < .45) {
      if (c.h - f.pos.y > 0 && c.h - f.pos.y <= .62 && f.vel.y <= 6 && f.alive && !(f.ragdoll > 0)) { f.pos.y = c.h; if (f.vel.y < 0) f.vel.y = 0; f.onGround = true; continue; }   // sube al borde de lo bajo (cajas, muros, bordillos)
      if (d < 1e-4) {   // el centro quedó dentro de la caja: se sale por la cara mas cercana (antes era hacia el lado opuesto, lejos)
        const l1 = f.pos.x - (c.x - c.hx), r1 = (c.x + c.hx) - f.pos.x, l2 = f.pos.z - (c.z - c.hz), r2 = (c.z + c.hz) - f.pos.z, mn = Math.min(l1, r1, l2, r2);
        if (mn === l1) f.pos.x = c.x - c.hx - .46; else if (mn === r1) f.pos.x = c.x + c.hx + .46; else if (mn === l2) f.pos.z = c.z - c.hz - .46; else f.pos.z = c.z + c.hz + .46;
      }
      else {
        f.pos.x = cx + dx / d * .45; f.pos.z = cz + dz / d * .45;
        const vn = (f.vel.x * dx + f.vel.z * dz) / d;
        if (vn < 0) {
          const b = f.ragdoll > 0 ? 1.7 : 1; f.vel.x -= vn * b * dx / d; f.vel.z -= vn * b * dz / d;
          if (f.ragdoll > 0 && vn < -5.5) {
            const pow = (f.ragPow || 1) * Math.min(2.5, -vn / 7);
            burst(chestOf(f), 20, '#ffffff', 9, .22, .6);
            burst(chestOf(f), 18, '#8a8a8a', 8, .28, .7);
            ringAt(chestOf(f), '#ffffff', 2.6, .24);
            shakeFrom(f.pos, Math.min(.6, -vn * .06));
            sfx('heavy', f.pos, 0.9);
            const spPos = _platePos.set(cx, clamp(f.pos.y + .9, .4, c.h - .4), cz);
            const spNrm = _ragNrm.set(dx / d, 0, dz / d);
            scarDecal(spPos, 2.2 * pow, spNrm);
            worldDamage(chestOf(f), 2.2 * pow, 1.3, 18, 1.2, spNrm);
            colCarve(chestOf(f), 2.0);
            comicPop(chestOf(f), pick(['¡CRASH!', '¡BAM!', '¡WHAM!', '¡KRAK!']), 'burst-red', 34, rand(-12, 12));
            f.vel.x = (dx / d) * Math.min(14, -vn * 0.58);
            f.vel.z = (dz / d) * Math.min(14, -vn * 0.58);
            f.vel.y = Math.max(f.vel.y, 4.2 + Math.min(4, -vn * 0.25));
            f.onGround = false;
            for (let si = 0; si < 8; si++) {
              spawnDebris(cx + (dx / d) * .3, f.pos.y + rand(.4, 1.5), cz + (dz / d) * .3, rand(.3, .6), rand(.3, .6), rand(.3, .6), '#9a9488', (dx / d) * rand(5, 12) + rand(-3, 3), rand(2, 8), (dz / d) * rand(5, 12) + rand(-3, 3));
            }
          }
        }
      }
    }
  }
  const r = Math.hypot(f.pos.x, f.pos.z);
  if (f.abyss) abyssClamp(f.pos);
  else if (seaBounds(f.pos)) { /* zona del mar */ }
  else if (worldBig() && !mapNow().circle) {   // mapas ampliados: límite rectangular del mapa actual
    const b = mapNow().b;
    if (f.pos.x < b.x0) { f.pos.x = b.x0; f.vel.x = Math.max(0, f.vel.x); } else if (f.pos.x > b.x1) { f.pos.x = b.x1; f.vel.x = Math.min(0, f.vel.x); }
    if (f.pos.z < b.z0) { f.pos.z = b.z0; f.vel.z = Math.max(0, f.vel.z); }
  }
  else if (r > ARENA - .5) {
    const nx = f.pos.x / r, nz = f.pos.z / r; f.pos.x = nx * (ARENA - .5); f.pos.z = nz * (ARENA - .5);
    const vn = f.vel.x * nx + f.vel.z * nz;
    if (vn > 0) {
      const b = f.ragdoll > 0 ? 1.7 : 1; f.vel.x -= vn * b * nx; f.vel.z -= vn * b * nz;
      if (f.ragdoll > 0 && vn > 6) {
        burst(chestOf(f), 18, '#8b8b8b', 8, .25, .6);
        ringAt(chestOf(f), '#ff3b30', 2.8, .28);
        shakeFrom(f.pos, .4);
        sfx('heavy', f.pos, .7);
        worldDamage(chestOf(f), 1.8 * (f.ragPow || 1), .9);
        f.vel.x = -nx * Math.min(12, vn * 0.55);
        f.vel.z = -nz * Math.min(12, vn * 0.55);
        f.vel.y = Math.max(f.vel.y, 4.0);
      }
    }
  }
  let gy = groundAt(f.pos.x, f.pos.z,f.pos.y+Math.max(0,-f.vel.y*dt)+.15); if (f.onBoat != null && f.pos.y <= f.onBoat + .6) gy = Math.max(gy, f.onBoat);
  if (f.pos.y <= gy) {
    const vy = f.vel.y;
    f.pos.y = gy;
    if (f.ragdoll > 0 && vy < -6) {
      const pow = (f.ragPow || 1) * Math.min(2.5, -vy / 8);
      f.vel.y *= -(.34 + .08 * pow);
      f.onGround = false;
      ringAt(new V3(f.pos.x, gy + .06, f.pos.z), '#e8dfcb', 2.4, .28);
      shakeFrom(f.pos, Math.min(.55, -vy * .04));
      sfx('heavy', f.pos, .8);
      crackDecal(new V3(f.pos.x, gy + .02, f.pos.z), Math.min(4.5, 1.6 * pow));
      burst(new V3(f.pos.x, gy + .2, f.pos.z), 16, '#6b5a3e', 8, .22, .6, 1.2, 4);
      burst(new V3(f.pos.x, gy + .2, f.pos.z), 10, '#ffffff', 6, .14, .4, .6, 2);
      if (vy < -9) {
        worldDamage(new V3(f.pos.x, gy + .25, f.pos.z), 2.2 * pow, 1.1, 16, 1.2);
        for (let si = 0; si < 6; si++) {
          spawnDebris(f.pos.x + rand(-.4, .4), gy + .3, f.pos.z + rand(-.4, .4), rand(.25, .5), rand(.25, .5), rand(.25, .5), '#82786b', rand(-5, 5), rand(4, 9), rand(-5, 5));
        }
      }
      for (const j of ['alx', 'arx', 'llx', 'lrx', 'hx', 'tx']) f.anim.v[j] += rand(-28, 28);
    }
    else {
      if (!f.onGround && f.alive && vy < -5 && f.ragdoll <= 0) {
        animeDustRing(f.pos, 12, clamp(-vy * .18, 1.2, 3.0));
        f.landHard = !!bbSet(f.ch.id) && vy < -16;
        f.landT = f.landHard ? .5 : .14;
        javiSpeak(f, 'ev_land');
        f.anim.v.by -= 25;
        if (vy < -14) {
          burst(new V3(f.pos.x, gy + .1, f.pos.z), 8, '#d8d0c0', 4, .15, .4);
          crackDecal(new V3(f.pos.x, gy + .02, f.pos.z), 2.0);
        }
        if (f.ch === CHARS.javi) {
          ringAt(new V3(f.pos.x, gy + .05, f.pos.z), '#e6dfcf', 1 + Math.min(1.4, -vy / 20), .3);
          burst(new V3(f.pos.x, gy + .15, f.pos.z), 10, '#d8d0c0', 4, .16, .4, .3, 1);
        }
      }
      f.vel.y = 0; f.onGround = true; f.airDash = true;
    }
  } else f.onGround = f.pos.y - gy < .02;
}
function updateElevatorDoors(dt) {
  for (const e of ELEVATORS) {
    if (!e.st) continue;
    for (const s of e.st) {
      let near = false;
      for (const g of G.fighters) if (g.alive && Math.abs(g.pos.y - s.y0) < 2.8 && Math.hypot(g.pos.x - s.px, g.pos.z - s.pz) < 4.8 && !(e.ride && e.ride.who === g && e.ride.stage !== 'arrive')) near = true;
      const r = e.ride;
      if (r && r.from === s && (r.stage === 'enter' || r.stage === 'moving')) near = false;
      if (r && r.to === s) near = r.stage === 'arrive' && r.t > .35;
      s.target = near ? 1 : 0;
      if (s.lastT !== s.target) { if (s.lastT !== undefined) playSnd(s.target ? 'door_open' : 'door_close', .9, new V3(s.px, s.y0 + 1, s.pz)); s.lastT = s.target; }
      s.open += clamp(s.target - s.open, -dt * 1.3, dt * 1.3);
      const sc = Math.max(.07, 1 - s.open * .93), w = 1.4 * sc;
      s.panels[0].scale.x = s.panels[1].scale.x = sc; s.panels[0].position.x = s.dx - (1.4 - w / 2); s.panels[1].position.x = s.dx + (1.4 - w / 2);
      s.col.hx = s.open > .6 ? .01 : 1.4;
    }
  }
}
function updateElevator(f, dt) {
  if (f.isPlayer) updateElevatorDoors(dt);
  if (!f.alive) { for (const e of ELEVATORS) if (e.ride && e.ride.who === f) e.ride = null; f.elevT = 0; return; }
  for (const e of ELEVATORS) {
    const r = e.ride, pads = e.st ? e.st : [];
    if (r && r.who === f) {
      r.t += dt; const pad = r.stage === 'arrive' || r.stage === 'done' ? r.to : r.from, y = pad.y0;
      f.pos.set(pad.px, y, pad.pz); f.vel.set(0, 0, 0); f.onGround = true;
      if (r.stage === 'enter') { if (r.from.open < .05) { r.stage = 'moving'; r.t = 0; playSnd('elev_ride', .55, f.pos); if (f.isPlayer) showBanner(r.up ? 'SUBIENDO' : 'BAJANDO', '#7ad7ff', 'Ascensor'); } }
      else if (r.stage === 'moving') {
        if (Math.random() < dt * 25) emit(f.pos.x + rand(-.8, .8), f.pos.y + .1, f.pos.z + rand(-.8, .8), 0, rand(1, 3), 0, '#7ad7ff', .12, .5, -.1, 1);
        if (r.t > 3) { r.stage = 'arrive'; r.t = 0; f.pos.set(r.to.px, r.to.y0, r.to.pz); playSnd('chime', .7, f.pos); }
      } else if (r.stage === 'arrive') {
        if (r.to.open > .92) { if (f.isPlayer) showBanner(r.up ? 'AZOTEA' : 'PLANTA BAJA', '#7ad7ff', r.up ? 'Cuidado con los rayos en tormenta' : 'Ascensor'); f.elevLock = e; e.ride = null; }
      }
      return;
    }
    if (r) continue;
    for (const [i, s] of pads.entries()) {
      const on = Math.abs(f.pos.y - s.y0) < 1.3 && Math.hypot(f.pos.x - s.px, f.pos.z - s.pz) < .9;
      if (!on) continue;
      if (f.elevLock === e) break;
      f.elevT = (f.elevT || 0) + dt;
      if (s.open > .9 && f.elevT > .5 && !f.action && !(f.ragdoll > 0) && !(f.stun > 0)) {
        f.elevT = 0; e.ride = { who: f, from: s, to: pads[1 - i], stage: 'enter', t: 0, up: i === 0 };
      }
      return;
    }
    if (f.elevLock === e && !pads.some(s => Math.hypot(f.pos.x - s.px, f.pos.z - s.pz) < 1.9 && Math.abs(f.pos.y - s.y0) < 2)) f.elevLock = null;
  }
  f.elevT = 0;
}
function ndt() { let l = G.time; return () => { const d = clamp(G.time - l, 0, .05); l = G.time; return d; }; }
function poisonOn(g, att, o) {
  const col = o.col || '#7dff6a', fresh = !g.poison || g.poison.col !== col;
  g.poison = { t: o.dur || 4.5, dps: o.dps || 2.4, att, acc: 0, col }; if (fresh) popText(chestOf(g), o.label || 'VENENO', col, 18);   // también sirve para quemaduras
}
function tickTimers(f, dt) {
  if (f.capDef > 0) f.capDef -= dt;
  if (f.capT > 0 && f.capRandi) { f.capT -= dt; if (f.capT <= 0) capEnd(f); }
  if (f.poison && f.alive) {
    const q = f.poison; q.t -= dt; q.acc += dt;
    if (Math.random() < dt * 14) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(.3, 1.8), f.pos.z + rand(-.4, .4), 0, rand(1, 3), 0, q.col, .14, .5, -.1, 1);
    if (q.acc >= .5) { q.acc -= .5; const d = q.dps * .5; f.hp -= d; popText(chestOf(f), '' + (Math.round(d * 10) / 10), q.col, 14); f.flashT = Math.max(f.flashT, .05); if (f.hp <= 0 && f.alive) kill(f, q.att); }
    if (q.t <= 0) f.poison = null;
  } else if (f.poison) f.poison = null;
  f.fireT = Math.max(0, (f.fireT || 0) - dt);
  if (f.pisco > 0) { f.pisco -= dt; if (Math.random() < dt * 20) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(.2, 1.8), f.pos.z + rand(-.4, .4), 0, rand(1, 3), 0, '#ffe9a0', .12, .5, -.1, 1); }
  if (f.tinku > 0) f.tinku -= dt;
  if (f.turbo > 0) f.turbo -= dt;
  if (f.ch.id === 'randi' && f.alive && G.state === 'play') {   // ElRandi suelta su "waaa" al azar, nunca en combate
    f.waaT = (f.waaT == null ? rand(5, 12) : f.waaT) - dt;
    if (f.waaT <= 0) {
      const busy = G.time - (f.lastHurtT || -99) < 5 || G.time - (f.lastAtkT || -99) < 5 || f.action || f.stun > 0 || f.ragdoll > 0 || f.choreTrack;
      if (busy) f.waaT = rand(2, 5); else { const b = SND.buf.randi_waaa; playSnd('randi_waaa', 1.6, f.pos); f.waaT = (b ? b.duration : 20) + rand(8, 22); }
    }
  }
  if (f.sebBomb) {
    const b = f.sebBomb, pv = Math.ceil(b.t); b.t -= dt; const cu = Math.ceil(b.t);
    if (cu !== pv && b.t > 0) { popText(chestOf(f), '¡' + cu + '!', '#ffd91a', 26 + (3 - cu) * 5); sfx('hit', f.pos, .5); }
    if (Math.random() < dt * 12) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(.4, 2), f.pos.z + rand(-.4, .4), 0, rand(1, 3), 0, '#ffd91a', .14, .4, 0, 1);
    if (b.t <= 0) {
      f.sebBomb = null; const by = b.by; explode(by, chestOf(f), 4.2, { dmg: b.dmg, kb: 11, up: 12, ragdoll: 1, color: '#ffd91a', guardBreak: true, hitstop: .1, shake: .5 });
      if (f === by && f.alive) { f.hp -= 8; popText(chestOf(f), '¡AUCH!', '#ffd91a', 22); if (f.hp <= 0) kill(f, f); }
    }
  }
  if (f.buf > 0) {
    f.buf -= dt; for (let i = 0; i < 4; i++) if (f.cd[i] > 0) f.cd[i] += dt * .6;
    if (Math.random() < dt * 18) { const a = rand(0, TAU); emit(f.pos.x + Math.cos(a) * .6, f.pos.y + 2.5, f.pos.z + Math.sin(a) * .6, 0, .5, 0, '#ffd91a', .1, .4, 0, 1); }
  }
  if (f.sebShieldT > 0) { f.sebShieldT -= dt; if (f.sebShieldT <= 0 && f.sebShield > 0) sebWallRelease(f); }
  if (f.seen > 0) { f.seen -= dt; if (Math.random() < dt * 9) emit(f.pos.x + rand(-.3, .3), f.pos.y + 2.4, f.pos.z + rand(-.3, .3), 0, rand(1, 2), 0, '#ffd91a', .16, .5, 0, 1); }
  if (f.pico) { f.pico.t -= dt; if (f.pico.t <= 0 || !f.alive) f.pico = null; else if (Math.random() < dt * 6) emit(f.pos.x + rand(-.4, .4), f.pos.y + rand(1.7, 2.3), f.pos.z + rand(-.4, .4), 0, rand(.5, 1.5), 0, '#e8ecf0', .1, .6, 0, 1); }
  if (f.isPlayer && ELEVATORS.length) updateElevator(f, dt);
  const wasRag = f.ragdoll > 0;
  f.stun = Math.max(0, f.stun - dt);
  f.ragdoll = Math.max(0, f.ragdoll - (f.onGround ? dt : dt * .5));
  if (wasRag && f.ragdoll <= 0 && f.alive) { f.iframes = Math.max(f.iframes, .45); f.getupT = .38; }
  f.iframes = Math.max(0, f.iframes - dt);
  f.hurtT -= dt; f.getupT -= dt; f.landT -= dt; f.flashT -= dt; f.frozen = Math.max(0, f.frozen - dt);
  f.m1cd -= dt; f.comboTimer -= dt; f.dashCd -= dt; { const wd = f.dashT > 0; f.dashT -= dt; if (wd && f.dashT <= 0) { f.dashRecT = .14; dashEnd(f); } }   // al terminar el dash queda un momento de recuperacion: ahi no se puede pegar con M1, pero una habilidad lo cancela
  if (f.critT > 0) { f.critT -= dt; if (Math.random() < dt * 22) emit(f.pos.x + rand(-.5, .5), f.pos.y + rand(.2, 2), f.pos.z + rand(-.5, .5), 0, rand(1, 3), 0, Math.random() < .5 ? '#ff2a2a' : '#222222', .12, .5, 0, 1); }   // listo para el Black Flash
  f.m1BufT = Math.max(0, (f.m1BufT || 0) - dt); f.jumpBufT = Math.max(0, (f.jumpBufT || 0) - dt); f.jumpFat = Math.max(0, (f.jumpFat || 0) - dt * 1.2); f.dashRecT = Math.max(0, (f.dashRecT || 0) - dt); f.rcCd = Math.max(0, (f.rcCd || 0) - dt); f.dashAnimT = Math.max(0, (f.dashAnimT || 0) - dt);
  for (let i = 0; i < 4; i++) f.cd[i] = Math.max(0, f.cd[i] - dt);
  if (f.isPlayer) { if (G.rules.noCd) f.cd[0] = f.cd[1] = f.cd[2] = f.cd[3] = 0; if (G.rules.god && f.alive) f.hp = f.maxHp; }
  if (f.awak > 0) {
    if (!(G.rules.ultInf && f.isPlayer)) f.awak -= dt; f.ult = 0;   // regla: ulti infinita
    if (f.awak <= 0) { f.cd = [0, 0, 0, 0]; javiSpeak(f, 'ev_awake_end'); if (f.isPlayer) showBanner('DESPERTAR TERMINADO', '#9ba1ba', 'Cargá la barra de nuevo'); }
    if (Math.random() < dt * 30) emit(f.pos.x + rand(-.5, .5), f.pos.y + rand(0, 2), f.pos.z + rand(-.5, .5), 0, rand(2, 4), 0, Math.random() < .3 ? '#ffffff' : f.ch.color, rand(.1, .2), .5, -.1, 1);
  }
  if (f.alive && (f.dashT > 0 || (f.action && f.action.ghost))) { f.ghostT -= dt; if (f.ghostT <= 0) { f.ghostT = .035; ghost(f, f.ch.color); } }
  if (f.spear) {
    f.atkT += dt;
    if (f.spearOut && f.atkT > 9 && !f.action && f.alive && f.ragdoll <= 0 && f.stun <= 0 && !f.blocking && !f.spearThrown && f.onGround) {
      f.atkT = 0;
      startAction(f, { name: 'stow', soft: true, dur: bbSet(f.ch.id) && bbSet(f.ch.id).guardar_lanza ? bbSet(f.ch.id).guardar_lanza.length : .5, speedMul: .85, anim: [[0, 'twirlPose', 800], [.12, 'reach', 900]], steps: [{ at: bbSet(f.ch.id) && bbSet(f.ch.id).guardar_lanza ? 27 / 20 : .3, fn: () => { setSpear(f, false); sfx('draw', f.pos, .5); } }] });
    }
  }
  // los dummies recuperan toda la vida si pasan 3 segundos sin recibir golpes
  if (f.dummy && f.alive && G.time - (f.lastHurtT || 0) > 3) f.hp = f.maxHp;
  // regeneración pasiva para todos: tras 5 s sin recibir daño recupera 2,2 de vida por segundo, pero solo hasta 45 de vida (no se cura entero)
  if (!f.dummy && !f.isBoss && f.alive && !G.over) { if (f.hp < (f._hp0 == null ? f.hp : f._hp0) - .01) f._rgT = 5; if (f._rgT > 0) f._rgT -= dt; else if (f.hp < Math.min(45, f.maxHp)) f.hp = Math.min(45, f.maxHp, f.hp + 2.2 * dt); f._hp0 = f.hp; }
  // pose de lucimiento cuando está quieto un rato
  if (f.ch.flourish && f.alive && !f.action && f.onGround && !f.blocking && f.stun <= 0 && f.ragdoll <= 0 && Math.hypot(f.vel.x, f.vel.z) < 1) {
    f.flourT -= dt; if (f.flourT <= 0) { f.flourT = rand(5, 9); startFlourish(f); }
  } else f.flourT = Math.max(f.flourT, 2.5);
  const dy = wrapA(f.yaw - f.prevYaw); f.yawVel = f.yawVel * .8 + (dy / Math.max(dt, 1e-3)) * .2; f.prevYaw = f.yaw;
  if (!f.alive) {
    f.deathT += dt;
    if (f.deathT > 1.1 && f.model.root.visible) { f.model.root.visible = false; burst(chestOf(f), 30, '#dddddd', 5, .3, .8, -.2); burst(chestOf(f), 14, f.ch.color, 5, .25, .6, -.2); }
    f.respawnT -= dt; if (f.respawnT <= 0 && !G.over && !f.isBoss) respawn(f);
  }
}
function animate(f, dt) {
  const a = f.action, T = G.time, sp = Math.hypot(f.vel.x, f.vel.z);
  f.walk += dt * sp * 1.4;
  let pose, k = 300, z = .72, spin = 0, keyed = null;
  if (!f.alive || f.ragdoll > 0) {
    // resortes blandos y poco amortiguados: los miembros quedan sueltos y se bambolean
    const hs = Math.hypot(f.vel.x, f.vel.z);
    pose = f.rdPose === 1 ? POSE.downB : POSE.down; k = f.onGround ? 70 : 16; z = f.onGround ? .42 : .22;
    if (!f.onGround) spin = -clamp(3 + hs * .45, 3, 13) * (f.rdDir || 1);
  }
  else if (f.choreTrack) { keyed = f.choreTrack; pose = keyed[keyed.length - 1].p; }
  else if (f.frozen > 0) { pose = null; }
  else if (f.forcePose) { pose = POSE[f.forcePose]; k = 1000; z = .4; }
  else if (f.hurtT > 0) { pose = POSE[f.hurtPose]; k = 900; z = .45; }
  else if (f.grabbed) { pose = POSE.hurtA; k = 400; }
  else if (f.ch.canFly && f.rFlightT > 0 && !a) { pose = sp > 2.5 ? POSE.ironFly : POSE.ironHover; k = 500; z = .5; }   // vuelo de la armadura
  else if (f.swim && f.stun <= 0 && !a) {   // nadando: crol al avanzar, patadas flotando al estar quieto
    const ph = T * 6.5 + f.seed, mv = sp > 1.2;
    pose = mv ? { ix: 1.25, tx: -.15, hx: -.85, alx: -2.45 + Math.sin(ph) * 1.0, arx: -2.45 + Math.sin(ph + Math.PI) * 1.0, alz: .1, arz: -.1, llx: Math.sin(ph * 2) * .4, lrx: -Math.sin(ph * 2) * .4, by: -2 }
              : { ix: 0, tx: .05, hx: -.1, alx: -.4 + Math.sin(ph * .5) * .3, arx: -.4 - Math.sin(ph * .5) * .3, alz: -.8, arz: .8, llx: Math.sin(ph) * .5, lrx: -Math.sin(ph) * .5, by: -1 + Math.sin(T * 2) * .5 };
    if (f.vel.y < -1.5 && !mv) pose = Object.assign({}, pose, { ix: .5, hx: .3 }); k = 140; z = .7;
  }
  else if (f.stun > 0) { pose = dizzyPose(T); k = 220; z = .6; }
  else if (a) {
    if (a.procedural === 'barrage') { pose = barragePose(T); k = 1400; z = .5; }
    else if (a.anim) {
      if (a.trackSrc !== a.anim) { a.track = buildTrack(a.anim, Object.assign({}, f.anim.x), a.t); a.trackSrc = a.anim; }
      keyed = a.track; pose = a.track[a.track.length - 1].p;
    }
  }
  else if (f.getupT > 0) { pose = f.getupT > .18 ? POSE.getup1 : POSE.land; k = 600; }
  else if (f.blocking) { pose = POSE.block; k = 700; z = .6; }
  else if (f.dashT > 0) { pose = POSE.dash; k = 800; z = .6; }
  else if (!f.onGround) { pose = f.vel.y > 2 ? POSE.jump : POSE.fall; k = 260; }
  else if (f.landT > 0) { pose = POSE.land; k = 800; z = .55; }
  else if (sp > 1.5) { pose = runPose(f, sp); if (f.spearOut) { pose.arx = -.45 + Math.sin(f.walk) * .2; pose.sx = .3; pose.arz = .1; } k = 320; z = .75; }
  else { pose = stancePose(f.ch, T, f.seed, f.spearOut); k = 180; z = .8; }
  // inclinación por aceleración: se inclina al arrancar/frenar y se ladea al doblar (peso)
  if (dt > 0) {
    const F = fwd(f.yaw), R = rightOf(f.yaw), ax = (f.vel.x - (f.pvx || 0)) / dt, az = (f.vel.z - (f.pvz || 0)) / dt;
    f.pvx = f.vel.x; f.pvz = f.vel.z;
    f.leanF = (f.leanF || 0) + (clamp((ax * F.x + az * F.z) * .012, -.3, .3) - (f.leanF || 0)) * Math.min(1, dt * 6);
    f.leanR = (f.leanR || 0) + (clamp((ax * R.x + az * R.z) * .01, -.25, .25) - (f.leanR || 0)) * Math.min(1, dt * 6);
    if (pose && !keyed && f.onGround && f.ragdoll <= 0 && !a) pose = Object.assign({}, pose, { ix: (pose.ix || 0) + f.leanF, iz: (pose.iz || 0) - f.leanR * .8, tx: (pose.tx || 0) + f.leanF * .4 });
  }
  // la cabeza mira al rival más cercano (vida extra sin tocar el cuerpo)
  if (!keyed && pose && f.alive && f.ragdoll <= 0 && f.stun <= 0 && f.hurtT <= 0 && !(a && a.spin)) {
    const tg = f.isPlayer ? softLock(f, 12, -.2) : (f.ai && f.ai.target && f.ai.target.alive ? f.ai.target : null);
    if (tg && dist2d(f, tg) < 14) {
      const rel = clamp(wrapA(yawTo(f, tg) - f.yaw) - (f.anim.x.ty || 0), -.75, .75);
      pose = Object.assign({}, pose, { hy: (pose.hy || 0) * .4 + rel * .75 });
    }
  }
  const emoteClip = !!(a && a.emoteClip && window.CF_EMOTES);   // emotes de animacion (js/emotes.js)
  const bbSelection=emoteClip ? null : javiBBSelection(f,a,sp);
  const bbPlayed=emoteClip ? CF_EMOTES.playClip(f,a,dt) : bbSelection ? playJaviBB(f,bbSelection,dt) : false;
  if (!bbPlayed && !f.choreTrack) f.anim.bbR6=false;
  if (!bbPlayed && (f.frozen <= 0 || f.choreTrack)) { if (keyed) { if (!f.choreTrack || f.choreFrame !== G.time) f.anim.play(keyed, f.choreTrack ? f.choreTime : a.t, dt, !!f.choreTrack); } else f.anim.update(dt, pose, k, z, spin); }
  if (a && a.spinX && !bbPlayed) { a.spinA = (a.spinA || 0) + a.spinX * dt; f.anim.x.ix = a.spinA; f.anim.apply(); }   // gira como una bola
  const m = f.model;
  if (!(f.frozen > 0) || f.choreTrack) jlLocomotion(f, dt, sp);
  if (m.gripRot) {
    if (!f.choreTrack || f.choreFrame !== G.time) f.twA = twirlAngle(f, dt);
    if (f.choreTrack && f.choreGripQuat) m.gripRot.quaternion.copy(f.choreGripQuat);
    else m.gripRot.rotation.set(f.anim.x.sx + f.twA, f.anim.x.sy || 0, f.anim.x.sz || 0);
  }
  m.root.position.copy(f.pos); m.root.rotation.y = f.yaw + (a && a.spin ? a.t * a.spin : 0);
  // a.grips: [{arm:'armL', z:7, t0:.3}] = esa mano agarra el asta de la lanza (IK) mientras dure la acción; z = píxeles a lo largo del asta
  if (a && a.grips && f.spear && f.spearOut) { m.root.updateMatrixWorld(true); for (const g of a.grips) { const w = clamp((a.t - (g.t0 || 0)) / .15, 0, 1); if (w > 0) solveR6Contact(f, g.arm, f.spear.localToWorld(new V3(0, 0, g.z * PX)), w * w * (3 - 2 * w)); } }
  eyeGlow(m, !!(a && a.eyes) || f.awak > 0, T); updateWings(f, m, dt, T); updateSpiderLegs(f, m, dt, T);
  if (bbSet(f.ch.id) && f.alive) javiMotionFx(f, dt, sp);
  updateAura(f, dt, T);
  updateFace(f, dt);
  if (f.alive) m.root.visible = !f.cineHide && !(G.viewer && CHORE[VW.id].bbPreview && f===VW.vic) && !(f.iframes > .5 && f.ragdoll <= 0 && !f.action && f.dashT <= 0 && Math.floor(G.time * 20) % 2 === 0);
  const fl = Math.max(0, f.flashT) / .12, aw = f.awak > 0 ? .12 + .08 * Math.sin(T * 8) : 0;
  if (fl > 0) m.mats.forEach(x => x.emissive.setRGB(fl * .9, fl * .9, fl * .9));
  else if (aw > 0) m.mats.forEach(x => x.emissive.set(f.ch.color).multiplyScalar(aw));
  else m.mats.forEach(x => x.emissive.setRGB(0, 0, 0));
  updateSwordFire(f, m, dt, T);   // después del destello de golpe: si no, este lo pisa
  updateVerity(f, m, dt, T);
  updateJesuluto(f, m, dt, T);
  updateCapitan(f, m, dt, T);
  if (CF_A.CAPUCHA) CF_A.CAPUCHA.update(f, m, dt, T);   // capucha de Javi (js/capucha.js)
}

// ================= HUD =================
function buildSkillBar(f) {
  const ch = f.ch, list = skillsOf(f), el = $('skills'); el.innerHTML = ''; G.hudSet = list;
  el.classList.toggle('awk', f.awak > 0);
  const skKeys = [BINDS.skill1, BINDS.skill2, BINDS.skill3, BINDS.skill4];
  list.forEach((s, i) => {
    const d = document.createElement('div'); d.className = 'slot';
    d.innerHTML = `<div class="cd"></div><span class="key">${bindKeyLabel(skKeys[i] || ('Digit' + (i + 1)))}</span><span class="sn"></span><span class="ct"></span>`;
    d.querySelector('.sn').textContent = s.n; el.appendChild(d);
  });
  const u = document.createElement('div'); u.className = 'slot ult';
  u.innerHTML = `<div class="cd"></div><span class="key">${bindKeyLabel(BINDS.ult || 'KeyG')}</span><span class="sn"></span><span class="ct"></span>`;
  u.querySelector('.sn').textContent = f.awak > 0 ? 'Despertar activo' : 'Despertar'; el.appendChild(u);
}
function showBanner(text, col, sub) {
  const b = $('banner'); b.textContent = text; b.style.color = col;
  if (sub) { const s = document.createElement('small'); s.textContent = sub; b.appendChild(s); }
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
}
function addFeed(k, v) {
  const e = document.createElement('div'); e.className = 'fe';
  const a = document.createElement('span'), m = document.createElement('em'), b = document.createElement('span');
  a.textContent = k && k !== v ? k.name : '—'; a.style.color = k ? k.ch.color : '#aaa';
  m.textContent = 'K.O.'; b.textContent = v.name; b.style.color = v.ch.color;
  e.append(a, m, b); pushFeed(e);
}
function addFeedText(t, col) { const e = document.createElement('div'); e.className = 'fe'; e.textContent = t; e.style.color = col; pushFeed(e); }
function pushFeed(e) { const f = $('feed'); f.prepend(e); while (f.children.length > 6) f.lastChild.remove(); setTimeout(() => e.remove(), 5000); }
// ping de cada jugador: el mío medido contra el relay, el de los amigos viene en su presencia
function pingOf(f) {
  if (!G.mp) return null;
  if (f.isPlayer) return NET.named && NET.named.isHost ? 0 : NET.named ? +NET.named.ping || null : null;
  if (f.remote && f.net) return +f.net.pg || null;
  return null;
}
function pingCell(f) {
  const td = document.createElement('td'); td.className = 'n ping';
  if (!G.mp) { td.innerHTML = '<span class="pg-bot">' + (f.isPlayer ? 'LOCAL' : 'BOT') + '</span>'; return td; }
  if (!f.isPlayer && !f.remote) { td.innerHTML = '<span class="pg-bot">BOT</span>'; return td; }
  const ms = pingOf(f), q = ms == null ? 0 : ms <= 90 ? 4 : ms <= 160 ? 3 : ms <= 260 ? 2 : 1;
  const col = ['#6b7280', '#ff4d4d', '#ffb020', '#c6f33a', '#3ee07a'][q];
  td.title = ms == null ? 'Midiendo…' : ms + ' ms';
  td.innerHTML = '<span class="pg" style="--pc:' + col + '">' + [1, 2, 3, 4].map(i => '<i class="' + (i <= q ? 'on' : '') + '" style="height:' + (i * 25) + '%"></i>').join('') + '</span><small>' + (ms == null ? '…' : f.isPlayer && NET.named && NET.named.isHost ? 'anfitrión' : ms + ' ms') + '</small>';
  return td;
}
// Perfil público de sala: las imágenes viajan al cambiar, nunca con cada cuadro de combate.
const ROOM_UI = { open: false, profile: null, signature: '', next: 0, focus: null };
const PROFILE_MAX = 80000, PROFILE_IMAGE_MAX = 42000;
const profileName = n => typeof n === 'string' ? n.replace(/[<>&\u0000-\u001f]/g, '').slice(0, 32) : '';
function cleanPublicProfile(p) {
  if (!p || typeof p !== 'object' || p.v !== 1) return null;
  const num = (n, max) => Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  let b = { k: 'pre:sunset' };
  if (p.b && typeof p.b.k === 'string') {
    if (p.b.k.startsWith('pre:') && BANNERS.some(([id]) => p.b.k === 'pre:' + id) || p.b.k.startsWith('char:') && CHAR_IDS.includes(p.b.k.slice(5))) b = { k: p.b.k };
    else if (p.b.k === 'img' && typeof p.b.d === 'string' && p.b.d.length <= PROFILE_IMAGE_MAX && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.b.d)) b = { k: 'img', d: p.b.d };
  }
  const a = typeof p.a === 'string' && (p.a.length <= 512 && /^https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_./=\-?&%]+$/.test(p.a) || p.a.length <= 14000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(p.a)) ? p.a : '';
  return { v: 1, uid: validAccountId(p.uid) ? p.uid : '', n: profileName(p.n), a, b, acct: p.acct === true, g: num(p.g, 1e7), m: num(p.m, 1e8), f: CHAR_IDS.includes(p.f) ? p.f : '', ...cleanCosmetics(p) };
}
function localPublicProfile() {
  let g = 0, m = 0, f = '', best = 0;
  for (const [id, c] of Object.entries(ST.d?.c || {})) { g += +c[0] || 0; if (CHAR_IDS.includes(id) && c[0] > best) { best = c[0]; f = id; } }
  for (const day of Object.values(ST.d?.dy || {})) m += +day[2] || 0;
  const p = cleanPublicProfile({ v: 1, uid: ACCT.user?.uid || '', ...cosmeticsGet(), n: ACCT.user?.displayName || $('pname-in').value || 'Jugador', a: avatarGet() || ACCT.user?.photoURL, b: bannerGet(), acct: !!ACCT.user, g, m, f });
  p.b = bannerGet();
  try { const t = ACCT.user?.metadata?.creationTime; if (t) { const d = new Date(t); if (!isNaN(d)) p.fx = { ...(p.fx || { deco: 'none', fx: 'none', nf: 'normal', c2: '' }), since: d.toISOString().slice(0, 10) }; } } catch (e) { }
  return p;
}
let publicBannerSource = '', publicBannerData = '', profileShareTicket = 0;
async function netShareProfile() {
  const room = NET.named; if (!room) return;
  const ticket = ++profileShareTicket, p = localPublicProfile(), original = bannerGet();
  if (original.k === 'img') {
    if (original.d !== publicBannerSource) {
      const data = await new Promise(resolve => {
        const img = new Image(); img.onload = () => {
          try {
            const c = document.createElement('canvas'); c.width = 600; c.height = 172;
            const g = c.getContext('2d', { willReadFrequently: true }), s = Math.max(c.width / img.width, c.height / img.height);
            g.drawImage(img, (c.width - img.width * s) / 2, (c.height - img.height * s) / 2, img.width * s, img.height * s);
            let d = ''; for (const q of [.75, .55, .35, .2]) { d = c.toDataURL('image/jpeg', q); if (d.length <= PROFILE_IMAGE_MAX) break; }
            resolve(d.length <= PROFILE_IMAGE_MAX ? d : '');
          } catch (e) { resolve(''); }
        }; img.onerror = () => resolve(''); img.src = original.d;
      });
      if (ticket !== profileShareTicket || room !== NET.named) return;
      publicBannerSource = original.d; publicBannerData = data;
    }
    p.b = publicBannerData ? { k: 'img', d: publicBannerData } : { k: 'pre:sunset' };
  }
  if (ticket !== profileShareTicket || room !== NET.named) return;
  await socialPublishSession(); if (room !== NET.named || ticket !== profileShareTicket) return;
  if (room.setProfile) room.setProfile(p);
  else { const small = { ...p, b: p.b.k === 'img' ? { k: 'pre:sunset' } : p.b }; room.presence({ pf: small }).catch(() => {}); }
  ROOM_UI.signature = ''; if (ROOM_UI.open) refreshRoomBoard();
}
// Solo se conservan campos públicos conocidos. El ID enlaza cuentas; no se envían correo ni credenciales.
function receivePublicProfile(R, id, raw, notify) {
  if (!id || typeof id !== 'string' || id.length > 80) return;
  let p; try { if (typeof raw === 'string') { if (raw.length > PROFILE_MAX) return; raw = JSON.parse(raw); } p = cleanPublicProfile(raw); } catch (e) { return; }
  if (!p) return;
  if (!R.profiles) R.profiles = new Map();
  if (!R.profiles.has(id) && R.profiles.size >= 128) {
    const old = [...R.profiles.keys()].find(k => k !== R.myId && !R.states?.has(k));
    if (old) R.profiles.delete(old); else return;
  }
  if (JSON.stringify(R.profiles.get(id)) === JSON.stringify(p)) return;
  R.profiles.set(id, p); notify(); ROOM_UI.signature = '';
}
const roomBotKeys = new WeakMap(); let roomBotSequence = 0;
function roomEntries() {
  const entries = G.fighters.filter(f => !f.dummy).map(f => { if (!roomBotKeys.has(f)) roomBotKeys.set(f, 'bot-' + (++roomBotSequence)); return { key: f.isPlayer ? 'self' : f.peer || roomBotKeys.get(f), f, me: !!f.isPlayer, bot: !f.isPlayer && !f.remote, pr: f.net || {} }; });
  if (G.mp && NET.named) for (const pe of NET.named.peers()) {
    if (pe.sameTab || entries.some(e => e.key === pe.peer) || pe.presence?.ch === 'dummy' || !pe.presence?.nm) continue;
    const pr = pe.presence;
    entries.push({ key: pe.peer, me: false, bot: false, pr, f: { name: profileName(pr.nm).slice(0, 16), ch: CHARS[pr.ch] || CHARS.javi, kills: +pr.k || 0, deaths: +pr.d || 0, remote: true, peer: pe.peer, net: pr } });
  }
  return entries.sort((a, b) => b.f.kills - a.f.kills || a.f.deaths - b.f.deaths || a.key.localeCompare(b.key));
}
function rawEntryProfile(e) {
  if (e.me) return localPublicProfile();
  const base = cleanPublicProfile(NET.named?.profiles?.get(e.key) || e.pr.pf) || { v: 1, uid: '', n: e.f.name, a: '', b: { k: 'char:' + e.f.ch.id }, acct: false, g: 0, m: 0, f: '' };
  if (!base.uid && validAccountId(e.pr?.uid)) { base.uid = e.pr.uid; base.acct = true; }
  return base;
}
function entryProfile(e) { const p=rawEntryProfile(e),uid=socialEntryUid(e);return !e.me&&uid&&SOC.profiles.has(uid)?{...p,...SOC.profiles.get(uid)}:p; }
function profileAvatar(img, p, e) {
  img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = p.a || 'assets/calfight_icon.png';
  img.onerror = () => { img.onerror = null; img.src = 'assets/calfight_icon.png'; };
  if (!p.a && e.bot) { try { img.src = headPortrait(e.f.skin).toDataURL(); img.classList.add('pixel'); } catch (err) {} }
}
function profileButton(e) {
  const p = entryProfile(e), bt = document.createElement('button'); bt.type = 'button'; bt.className = 'room-player'; bt.dataset.player = e.key;
  bt.setAttribute('aria-label', 'Ver perfil de ' + e.f.name);
  bt.innerHTML = '<span class="rp-banner"></span><img class="rp-avatar" alt=""><span class="rp-text"><b></b><small></small></span><span class="rp-arrow" aria-hidden="true">↗</span>';
  bt.querySelector('.rp-banner').style.backgroundImage = `url("${bannerURL(p.b)}")`;
  profileAvatar(bt.querySelector('img'), p, e); bt.querySelector('b').textContent = e.f.name;
  bt.querySelector('small').textContent = e.bot ? 'BOT · VER FICHA' : (e.me ? 'VOS · ' : '') + (p.acct ? p.n || 'VER PERFIL' : 'INVITADO');
  socialDecorateIdentity(bt,e); bt.addEventListener('click', () => playerProfileOpen(e.key, bt)); return bt;
}
function scoreTable() {
  const wrap = document.createElement('div'); wrap.className = 'room-table';
  const cap = document.createElement('div'); cap.className = 'bd-cap'; cap.textContent = G.mp ? 'Sala: ' + (NET.code || '').slice(3) : 'Primero en ' + G.goal + ' K.O. · ' + CITY.name; wrap.appendChild(cap);
  const tb = document.createElement('table');
  tb.innerHTML = '<thead><tr><th>Jugador</th><th>Peleador</th><th class="n">K.O.</th><th class="n">Muertes</th><th class="n">Ping</th></tr></thead>';
  const body = document.createElement('tbody');
  for (const e of roomEntries()) {
    const f = e.f, tr = document.createElement('tr'); tr.dataset.player = e.key; if (e.me) tr.className = 'me';
    const identity = document.createElement('td'); identity.className = 'room-identity'; identity.appendChild(profileButton(e)); tr.appendChild(identity);
    [f.ch.name, f.kills, f.deaths].forEach((v, i) => { const td = document.createElement('td'); td.textContent = v; if (i > 0) td.className = 'n'; else td.style.color = f.ch.color; tr.appendChild(td); });
    tr.appendChild(pingCell(f)); body.appendChild(tr);
  }
  tb.appendChild(body); wrap.appendChild(tb); return wrap;
}
function roomInputBlocked() { return ROOM_UI.open || !!ROOM_UI.profile || SOC.open || !!($('acctdlg') && !$('acctdlg').classList.contains('hidden')); }
function roomClearInput() { for (const k in keys) keys[k] = false; pressed.clear(); mouse.left = mouse.right = false; slTap = false; }
function setRoomBoard(on, resume = true) {
  ROOM_UI.open = on; $('board').classList.toggle('hidden', !on); document.body.classList.toggle('room-browsing', on || !!ROOM_UI.profile);
  roomClearInput();
  if (on) { ROOM_UI.signature = ''; refreshRoomBoard(); unlock(); $('board-close').focus({ preventScroll: true }); }
  else { if (ROOM_UI.profile) playerProfileClose(false); if (resume && G.state === 'play' && !G.over && !G.paused) requestLock(); }
}
function refreshRoomBoard() {
  if (!ROOM_UI.open) return;
  const entries = roomEntries(), signature = JSON.stringify(entries.map(e => [e.key, e.f.name, e.f.ch.id, entryProfile(e)]));
  const board = $('board');
  if (signature !== ROOM_UI.signature) {
    const old = document.activeElement?.dataset.player, scroll = board.scrollTop;
    ROOM_UI.signature = signature;
    board.innerHTML = '<div class="room-heading"><div><b>JUGADORES</b><small>Elegí una tarjeta para ver su perfil</small></div><button type="button" id="board-close">Volver · Tab / Esc</button></div>';
    board.appendChild(scoreTable()); board.scrollTop = scroll;
    $('board-close').addEventListener('click', () => setRoomBoard(false));
    if (old) [...board.querySelectorAll('button[data-player]')].find(b => b.dataset.player === old)?.focus({ preventScroll: true });
  }
  // Actualizamos cifras sin reemplazar los botones debajo del cursor.
  for (const tr of board.querySelectorAll('tbody tr')) {
    const e = entries.find(e => e.key === tr.dataset.player); if (!e) continue;
    tr.children[2].textContent = e.f.kills; tr.children[3].textContent = e.f.deaths; tr.lastChild.replaceWith(pingCell(e.f));
  }
}
function profileCardContent(nameId = '') {
  return `<div class="public-banner"></div>
    <div class="public-head"><img alt=""><div class="public-status-slot"></div>
      <div class="public-identity"><h2${nameId ? ` id="${nameId}"` : ''}></h2><span class="public-role"></span><p></p></div>
    </div>
    <div class="public-badges"></div><div class="public-actions"></div>
    <section class="profile-extras"></section><div class="public-stats"></div><div class="public-career"></div>`;
}
function profileCardStats(card, items) {
  const stats = card.querySelector('.public-stats');
  stats.replaceChildren();
  for (const [value, label] of items) {
    const item = document.createElement('div');
    const number = document.createElement('b');
    const caption = document.createElement('small');
    number.textContent = value;
    caption.textContent = label;
    item.append(number, caption);
    stats.appendChild(item);
  }
}
function profileCareerStats(p) {
  return [[p.g, 'Partidas'], [(p.m / 60).toFixed(1) + ' h', 'Tiempo de juego'], [CHARS[p.f]?.name || '—', 'Peleador favorito']];
}
function playerProfileBuild() {
  if ($('playerdlg')) return;
  const d = document.createElement('div'); d.id = 'playerdlg'; d.className = 'hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'public-name');
  d.innerHTML = `<div class="public-card profile-showcase"><button type="button" class="public-close" aria-label="Cerrar perfil">✕</button>${profileCardContent('public-name')}<button type="button" class="public-back"></button></div>`;
  document.body.appendChild(d); d.querySelector('.public-close').onclick = () => playerProfileClose(); d.querySelector('.public-back').onclick = () => playerProfileClose(); d.onclick = e => { if (e.target === d) playerProfileClose(); };
}
function playerProfileOpen(key, focus) {
  const e = roomEntries().find(e => e.key === key) || (SOC.viewEntry?.key===key?SOC.viewEntry:null); if (!e) return;
  playerProfileBuild(); ROOM_UI.profile = key; ROOM_UI.focus = focus; roomClearInput();
  const d = $('playerdlg'), p = entryProfile(e); d.classList.remove('hidden'); document.body.classList.add('room-browsing'); unlock();
  d.querySelector('.public-banner').style.backgroundImage = `url("${bannerURL(p.b)}")`; profileAvatar(d.querySelector('img'), p, e);
  $('public-name').textContent = p.n || e.f.name;
  d.querySelector('.public-identity p').textContent = e.me ? 'Vos' : p.n && p.n !== e.f.name ? e.f.name : '';
  const fromFriends = SOC.viewEntry?.key === key;
  d.querySelector('.public-badges').textContent = fromFriends ? 'PERFIL DE JUGADOR' :
    [e.bot ? 'Bot de entrenamiento' : p.acct ? 'Cuenta de jugador' : 'Invitado', !e.me && !e.bot && e.pr.st === 'menu' ? 'En el menú' : 'En la arena'].join(' · ');
  profileCardStats(d, fromFriends ? profileCareerStats(p) : [[e.f.kills, 'K.O. en la partida'], [e.f.deaths, 'Muertes'], [e.f.ch.name, 'Peleador']]);
  d.querySelector('.public-career').textContent = fromFriends ? '' : e.bot ? 'Rival controlado por el juego.' :
    `${p.g} partidas · ${(p.m / 60).toFixed(1)} h jugadas${p.f ? ' · Favorito: ' + CHARS[p.f].name : ''}`;
  decorateProfile(d.querySelector('.public-card'),p);socialCheckEntry(e);socialProfileActions(e);const roleArea=d.querySelector('.public-role');roleArea.replaceChildren();const role=roleOfEntry(e);if(role)roleArea.appendChild(roleBadge(role));
  d.querySelector('.public-back').textContent = fromFriends ? '← Volver a amigos' : ROOM_UI.open ? '← Volver a jugadores' : 'Cerrar perfil';
  d.querySelector('.public-card').scrollTop = 0;
  d.querySelector('.public-close').focus({ preventScroll: true });
}
function playerProfileClose(restore = true) {
  const returnToFriends = restore && ROOM_UI.profile && ROOM_UI.profile === SOC.viewEntry?.key;
  ROOM_UI.profile = null; $('playerdlg')?.classList.add('hidden'); document.body.classList.toggle('room-browsing', ROOM_UI.open); roomClearInput();
  if (restore) { const f = ROOM_UI.focus; if (f?.isConnected) f.focus({ preventScroll: true }); else if (ROOM_UI.open) $('board-close')?.focus({ preventScroll: true }); }
  ROOM_UI.focus = null;
  if (returnToFriends) socialOpen();
}
// Tab (o tecla configurada) mantiene abierta la tabla mientras se sostiene presionada.
addEventListener('keydown', e => {
  if (G.state !== 'play' || G.viewer) return;
  if (SOC.open || ($('acctdlg') && !$('acctdlg').classList.contains('hidden'))) return;
  if (ROOM_UI.profile) {
    if (e.code === 'Escape') { e.preventDefault(); playerProfileClose(); }
    if (e.code === 'Tab') { const buttons = [...$('playerdlg').querySelectorAll('button:not(:disabled)')], index = buttons.indexOf(document.activeElement); e.preventDefault(); buttons[(index + (e.shiftKey ? buttons.length - 1 : 1)) % buttons.length].focus(); }
    e.stopImmediatePropagation(); return;
  }
  const boardKey = BINDS.board || 'Tab';
  if (e.code === boardKey && (!G.paused && !G.panelOpen && !G.over || ROOM_UI.open)) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (!ROOM_UI.open) setRoomBoard(true);
    return;
  }
  if (ROOM_UI.open) {
    if (e.code === 'Escape') { e.preventDefault(); setRoomBoard(false); }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { const buttons = [...$('board').querySelectorAll('button')], index = buttons.indexOf(document.activeElement); e.preventDefault(); buttons[(index + (e.code === 'ArrowUp' ? buttons.length - 1 : 1)) % buttons.length].focus(); }
    e.stopImmediatePropagation();
  }
}, true);
addEventListener('keyup', e => {
  const boardKey = BINDS.board || 'Tab';
  if (e.code === boardKey && ROOM_UI.open && !ROOM_UI.profile) {
    e.preventDefault();
    setRoomBoard(false);
  }
}, true);

const _platePos = new V3(), _ragNrm = new V3(), _plateScr = { x: 0, y: 0 };
const _hudCache = {
  hpW: '', hpBg: '', hpTxt: '', ultW: '', ultFull: null, ultTxt: '',
  aiTxt: '', aiHid: null, panHid: null, wxPe: null,
  cds: ['', '', '', ''], ultCd: '', ultTxtCd: '', ultRdy: null,
  comboN: -1, comboLbl: '', comboTot: '', comboLast: '', comboLastDisp: null, comboOp: -1, deathTxt: ''
};
function updateHUD(dt) {
  for (const f of G.fighters) {
    if (!f.plate) continue;
    const h = f._hud || (f._hud = { vis: null, tf: '', w: '', bg: '', awk: null });
    const vis = !G.cine && f.alive && f.model.root.visible && camera.position.distanceToSquared(f.pos) < 2025;
    let s = null;
    if (vis) {
      _platePos.set(f.pos.x, f.pos.y + 2.55, f.pos.z);
      s = toScreen(_platePos, camera, _plateScr);
    }
    if (!s) {
      if (h.vis !== false) { h.vis = false; f.plate.style.display = 'none'; }
      continue;
    }
    if (h.vis !== true) { h.vis = true; f.plate.style.display = ''; }
    const tf = `translate(${Math.round(s.x)}px,${Math.round(s.y)}px) translate(-50%,-100%)`;
    if (tf !== h.tf) { h.tf = tf; f.plate.style.transform = tf; }
    const pw = Math.max(0, Math.round(f.hp / f.maxHp * 1000) * 0.1) + '%';
    if (pw !== h.w) { h.w = pw; f.plateBar.style.width = pw; }
    const pbg = f.hp < f.maxHp * .3 ? 'var(--hp-low)' : 'var(--hp)';
    if (pbg !== h.bg) { h.bg = pbg; f.plateBar.style.background = pbg; }
    const isAwk = f.awak > 0;
    if (isAwk !== h.awk) { h.awk = isAwk; f.plate.classList.toggle('awk', isAwk); }
  }
  updateNums(dt);
  touchUpdate(); const p = G.player; if (G.state !== 'play' || !p) return;
  const hc = _hudCache;
  const hpW = (Math.max(0, p.hp) / p.maxHp * 100).toFixed(2) + '%';
  if (hpW !== hc.hpW) { hc.hpW = hpW; $('hpbar').style.width = hpW; }
  const hpBg = p.hp < p.maxHp * .3 ? 'var(--hp-low)' : 'var(--hp)';
  if (hpBg !== hc.hpBg) { hc.hpBg = hpBg; $('hpbar').style.background = hpBg; }
  const hpTxt = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  if (hpTxt !== hc.hpTxt) { hc.hpTxt = hpTxt; $('hptxt').textContent = hpTxt; }
  const ultW = (p.awak > 0 ? p.awak / AWAKE_DUR * 100 : p.ult).toFixed(2) + '%';
  if (ultW !== hc.ultW) { hc.ultW = ultW; $('ultbar').style.width = ultW; }
  const ultFull = p.ult >= 100;
  if (ultFull !== hc.ultFull) { hc.ultFull = ultFull; $('ultwrap').classList.toggle('full', ultFull); }
  const ultTxt = p.awak > 0 ? `DESPERTAR ${Math.ceil(p.awak)}s` : ultFull ? `¡${bindKeyLabel(BINDS.ult || 'KeyG')} PARA DESPERTAR!` : `${Math.floor(p.ult)}%`;
  if (ultTxt !== hc.ultTxt) { hc.ultTxt = ultTxt; $('ulttxt').textContent = ultTxt; }
  const aiTxt = G.mp ? `${NET.code.slice(3)} · ${NET.proxies.size + 1} jugando${NET.named && NET.named.isHost ? ' · anfitrión' : ''}` : (Math.round(G.botLvl * 10) / 10) + (G.auto ? ' ⇅' : '');
  if (aiTxt !== hc.aiTxt) { hc.aiTxt = aiTxt; $('ailvl').textContent = aiTxt; }
  const aiHid = !!G.mp;
  if (aiHid !== hc.aiHid) { hc.aiHid = aiHid; $('ailchip').classList.toggle('hidden', aiHid); }
  const panOk = panelAllowed(), panHid = !panOk;
  if (panHid !== hc.panHid) { hc.panHid = panHid; $('panelbtn').classList.toggle('hidden', panHid); }
  const wxPe = panOk ? '' : 'none';
  if (wxPe !== hc.wxPe) { hc.wxPe = wxPe; $('weatherbtn').style.pointerEvents = wxPe; }
  const slots = $('skills').children;
  const list = skillsOf(p); if (G.hudSet !== list) { G.hudSet && (hc.cds.fill('')); buildSkillBar(p); }
  for (let i = 0; i < list.length; i++) {
    const s = list[i], el = slots[i]; if (!el) continue;
    const ch = (Math.min(1, p.cd[i] / s.cd) * 100).toFixed(1) + '%';
    const ct = p.cd[i] > 0 ? String(Math.ceil(p.cd[i])) : '';
    if (ch !== hc.cds[i]) { hc.cds[i] = ch; el.firstChild.style.height = ch; }
    if (el.lastChild.textContent !== ct) el.lastChild.textContent = ct;
  }
  const us = slots[4];
  if (us) {
    const uCd = (p.awak > 0 ? (1 - p.awak / AWAKE_DUR) * 100 : 100 - p.ult).toFixed(1) + '%';
    const uTxtCd = p.awak > 0 ? String(Math.ceil(p.awak)) : '';
    const uRdy = p.ult >= 100 && p.awak <= 0;
    if (uCd !== hc.ultCd) { hc.ultCd = uCd; us.firstChild.style.height = uCd; }
    if (uTxtCd !== hc.ultTxtCd) { hc.ultTxtCd = uTxtCd; us.lastChild.textContent = uTxtCd; }
    if (uRdy !== hc.ultRdy) { hc.ultRdy = uRdy; us.classList.toggle('ready', uRdy); }
  }
  updateSekzaSpecialHud(p);
  G.comboT -= dt; if (G.comboT <= 0) { G.combo = 0; G.comboDmg = 0; G.lastHitDmg = 0; }
  if (G.combo !== hc.comboN) { hc.comboN = G.combo; $('combon').textContent = G.combo; }
  const clbl = $('combolbl');
  if (clbl) { const cl = G.combo === 1 ? 'GOLPE' : 'GOLPES'; if (cl !== hc.comboLbl) { hc.comboLbl = cl; clbl.textContent = cl; } }
  const ctot = $('combodmg-total');
  if (ctot) { const ctt = `${Math.round(G.comboDmg || 0)} DAÑO`; if (ctt !== hc.comboTot) { hc.comboTot = ctt; ctot.textContent = ctt; } }
  const clast = $('combodmg-last');
  if (clast) {
    const showLast = G.combo > 1 && !!G.lastHitDmg;
    const clt = showLast ? `+${Math.round(G.lastHitDmg)}` : '';
    const cld = showLast ? '' : 'none';
    if (clt !== hc.comboLast) { hc.comboLast = clt; clast.textContent = clt; }
    if (cld !== hc.comboLastDisp) { hc.comboLastDisp = cld; clast.style.display = cld; }
  }
  const cOp = G.combo >= 1 ? 1 : 0;
  if (cOp !== hc.comboOp) { hc.comboOp = cOp; $('combo').style.opacity = cOp; }
  if (!p.alive) {
    const dTxt = `Reaparecés en ${Math.max(0, Math.ceil(p.respawnT))}`;
    if (dTxt !== hc.deathTxt) { hc.deathTxt = dTxt; $('deatht').textContent = dTxt; }
  }
  const board = $('board');
  if (ROOM_UI.open && performance.now() >= ROOM_UI.next) { ROOM_UI.next = performance.now() + 250; refreshRoomBoard(); }
}

// Calidad gráfica, posprocesado, paneles cómic, speedlines, FPS y rayos solares (ver js/graficos/calidad_post.js)
let composer = null, renderPass = null, bloomPass = null, caPass = null, gradePass = null;
const gfxPost = CF_GRAFICOS.crearCalidadYPost({
  WEAK_PC, LOW_PC, renderer, scene, camera, sun, ZZZ_U, OUTLINE_MAT,
  V3, TAU, rand, clamp, fwd, rightOf, $, PX,
  getG: () => G,
  getSH: () => SH,
  getSTAGE: () => STAGE,
  getSHOTS: () => SHOTS,
  getCITY: () => CITY,
  getWX: () => WX,
  getIMPACT: () => IMPACT,
  getTOUCH: () => TOUCH,
  roomInputBlocked: () => roomInputBlocked(),
  updateCityWeather: (...a) => updateCityWeather(...a),
  getReportFrameError: () => reportFrameError,
  syncShadowReceivers: beta => { if (CITY.seal) CITY.seal.receiveShadow = !!beta; },
  onPasses: p => { ({ composer, renderPass, bloomPass, caPass, gradePass } = p); },
  onPerf: (fx, dest) => { PERF_FX = fx; PERF_DEST = dest; }
});
const {
  LC, LG, sizeLines, _v2s, initPostProcessing, GFX_LIMIT, GFX_CFG, GFX,
  gfxSyncUI, gfxSave, gfxApply, gfxApplyPreset, gfxSet, gfxAutoLevel,
  gfxInit, gfxWatch, PERF_FRAME, performanceDecorations,
  PCAMS, PANEL_CUTS, drawPanelBorders,
  FPS, fpsTick, updateGodRays
} = gfxPost;
let { renderView, renderPanels, renderMain, drawLines } = gfxPost;

// Cámara con guion (la usan las cinemáticas de personajes, p. ej. "Ojo del Cosmos"): G.camScript = { fn(dt) -> true si mueve la cámara, cleanup() }
function endCamScript() { const s = G.camScript; G.camScript = null; if (s && s.cleanup) { try { s.cleanup(); } catch (e) { } } }
const _camHead = new V3(), _camTarget = new V3();
G.headCam = (() => { try { return localStorage.getItem('bsb_headcam') !== '0'; } catch (e) { return true; } })();
window.camaraCabeza = v => { G.headCam = !!v; try { localStorage.setItem('bsb_headcam', v ? '1' : '0'); } catch (e) { } return 'camara que sigue la cabeza: ' + (v ? 'si' : 'no'); };   // en la consola: camaraCabeza(false) la quita
function updateCamera(dt) {
  const wasHeadK = cam.headK || 0; cam.headK = 0;   // en cinematicas y escenas la camara NO sigue la cabeza; al volver al juego se recupera suave
  if (G.camScript && !CFG_CINE.off) { let ok = false; try { ok = G.camScript.fn(dt); } catch (e) { endCamScript(); } if (ok) return; if (G.camScript) endCamScript(); }
  if (G.cine) {
    const c = G.cine, f = c.f, F = fwd(f.yaw), Rr = rightOf(f.yaw);
    // cuatro tomas: barrido bajo → primer plano de la cara → zoom de choque → plano de héroe
    const P = f.pos, t = c.t, ez = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
    let px, py, pz, lx, ly, lz, roll;
    const [S0, S1, S2] = SHOTS;
    if (t < S0) {
      const k = ez(t / S0), ang = f.yaw + Math.PI * .85 - k * 1.7, d = 4.4 - k * 1.3;
      px = P.x + Math.sin(ang) * d; py = P.y + .3 + k * .5; pz = P.z + Math.cos(ang) * d;
      lx = P.x; ly = P.y + 1.15; lz = P.z; cam.fov = 58; roll = .2 * (1 - k) + .05;
    } else if (t < S1) {
      const k = (t - S0) / (S1 - S0), d = 1.4 - k * .3;
      px = P.x + F.x * d + Rr.x * .2; py = P.y + 1.63; pz = P.z + F.z * d + Rr.z * .2;
      lx = P.x; ly = P.y + 1.6; lz = P.z; cam.fov = 34 - k * 4; roll = -.09 + k * .05;
    } else if (t < S2) {
      const k = ez((t - S1) / (S2 - S1)), ang = f.yaw - .55 + k * .35, d = 9 - k * 5.6;
      px = P.x + Math.sin(ang) * d; py = P.y + 1 + (1 - k) * 1.6; pz = P.z + Math.cos(ang) * d;
      lx = P.x; ly = P.y + 1.1; lz = P.z; cam.fov = 76 - k * 22; roll = -.14 * k;
    } else {
      const k = (t - S2) / Math.max(.1, c.dur - S2), ang = f.yaw + .7 + k * .6, d = 3.4 + k * .9;
      px = P.x + Math.sin(ang) * d; py = P.y + .22; pz = P.z + Math.cos(ang) * d;
      lx = P.x; ly = P.y + 1.35; lz = P.z; cam.fov = 50 + k * 5; roll = .1;
    }
    camera.position.set(px, Math.max(.15, py), pz); camera.up.set(0, 1, 0);
    camera.lookAt(lx, ly, lz); camera.rotateZ(roll);
    if (G.shake > 0) { const s = G.shake * .2; camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); G.shake = Math.max(0, G.shake - dt * 2.2); }
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    return;
  }
  const p = G.player;
  // sala de cinemáticas: cámara libre, o un plano lateral de los dos mientras no corre la escena
  if (G.viewer && VW.att && VW.vic && (VW.free || !G.chore)) {
    const mid = chestOf(VW.att).lerp(chestOf(VW.vic), .5), yaw = VW.free ? VW.yaw : 1.75, pitch = VW.free ? VW.pitch : .22, dist = VW.free ? VW.dist : 7.5, cp = Math.cos(pitch);
    VW.focus = VW.focus ? VW.focus.lerp(mid, Math.min(1, dt * 6)) : mid;
    camera.position.set(VW.focus.x + Math.sin(yaw) * cp * dist, VW.focus.y + Math.sin(pitch) * dist, VW.focus.z + Math.cos(yaw) * cp * dist);
    camera.position.y = Math.max(.3, camera.position.y); camera.up.set(0, 1, 0); camera.lookAt(VW.focus);
    cam.fov += (50 - cam.fov) * Math.min(1, dt * 8); camera.fov = cam.fov; camera.updateProjectionMatrix(); return;
  }
  if (G.chore && (!CFG_CINE.off || G.viewer)) {
    document.body.classList.add('duel'); choreCam(G.chore, dt);
    cam.focus.copy(p.pos).add(new V3(0, 1.7, 0)); return;
  }
  // cámara del agarre con cinemática: plano de los dos → sobre el hombro → plano bajo → sigue al que sale volando
  const D = G.duel;
  if (D && ((D.end && G.time > D.end) || !G.fighters.includes(D.f) || !G.fighters.includes(D.tg) || !D.f.alive)) { G.duel = null; document.body.classList.remove('duel'); }
  else if (D) {
    document.body.classList.add('duel');
    const f = D.f, tg = D.tg, k = G.time - D.t0, F = fwd(f.yaw), Rr = rightOf(f.yaw);
    const mid = f.pos.clone().lerp(tg.pos, .5); let pos, look, fov, roll = 0;
    if (k < .35) { pos = mid.clone().addScaledVector(Rr, 4.4).add(new V3(0, 1.4, 0)); look = mid.clone().add(new V3(0, 1.2, 0)); fov = 50; roll = .05; }
    else if (k < 1.45) { const s = (k - .35) / 1.1; pos = f.pos.clone().addScaledVector(F, -3.6).addScaledVector(Rr, 1.9 + s * .5).add(new V3(0, 2.5, 0)); look = mid.clone().add(new V3(0, 1.5, 0)); fov = 52 - s * 6; roll = -.06; }
    else if (k < 1.75) { const s = (k - 1.45) / .3, A = fwd(f.yaw + .7); pos = mid.clone().addScaledVector(A, 4.4 - s * .8).add(new V3(0, .3, 0)); look = mid.clone().add(new V3(0, 1.5, 0)); fov = 58; roll = .1; }
    else { pos = f.pos.clone().addScaledVector(F, -3.2).addScaledVector(Rr, 1.4).add(new V3(0, 2.2, 0)); look = chestOf(tg); fov = 62; roll = 0; }
    camera.position.copy(pos); camera.up.set(0, 1, 0); camera.lookAt(look); camera.rotateZ(roll);
    if (G.shake > 0) { const s = G.shake * .25; camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); G.shake = Math.max(0, G.shake - dt * 2.2); }
    cam.fov += (fov - cam.fov) * Math.min(1, dt * 12); camera.fov = cam.fov; camera.updateProjectionMatrix();
    cam.focus.copy(p.pos).add(new V3(0, 1.7, 0));
    return;
  }
  { // la camara sigue la cabeza del jugador (tambien en sus animaciones: agacharse, saltos, golpes), con limites para que no se agite
    let fx = p.pos.x, fy = p.pos.y + 1.7, fz = p.pos.z;
    if (G.headCam && p.model && p.model.head) {
      const hk = cam.headK = Math.min(1, wasHeadK + dt * 3);
      p.model.head.getWorldPosition(_camHead);
      const hx = clamp(_camHead.x - p.pos.x, -1.4, 1.4), hy = clamp(_camHead.y + .25 - p.pos.y, .4, 2.9), hz = clamp(_camHead.z - p.pos.z, -1.4, 1.4);
      fx += hx * hk; fz += hz * hk; fy += (hy - 1.7) * hk;
    }
    cam.focus.lerp(_camTarget.set(fx, fy, fz), Math.min(1, dt * 14));
  }
  const cp = Math.cos(cam.pitch), R = rightOf(cam.yaw);
  const dir = new V3(Math.sin(cam.yaw) * cp, -Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  const inside=CITY.interiors.find(b=>Math.abs(p.pos.x-b.x)<b.w/2-.2&&Math.abs(p.pos.z-b.z)<b.d/2-.2&&p.pos.y<b.h-1.6);
  cam.roomDist=(cam.roomDist||cam.dist)+((inside?Math.min(4.3,cam.dist):cam.dist)-(cam.roomDist||cam.dist))*Math.min(1,dt*9);
  cam.shoulder += ((inside?.55:G.shiftLock?1.35:.85)-(cam.shoulder||.85))*Math.min(1,dt*8);
  const pos = cam.focus.clone().addScaledVector(dir, -cam.roomDist).addScaledVector(R, cam.shoulder);
  pos.y = Math.max(p.abyss ? ABY.y + .5 : p.swim ? -8.5 : .4, pos.y);   // en el abismo la camara baja hasta el suelo de la cueva
  const wallT=citySegment(cam.focus,pos,.23,true);
  if(wallT<1)pos.copy(cam.focus).lerp(pos,Math.max(0,wallT-.04));
  camera.position.copy(pos);
  camera.lookAt(pos.x + dir.x, pos.y + dir.y, pos.z + dir.z);
  const veryClose=pos.distanceTo(new V3(p.pos.x,p.pos.y+1.5,p.pos.z))<1.15;
  if(veryClose){p._cameraHidden=true;p.model.root.visible=false;}else if(p._cameraHidden){p._cameraHidden=false;p.model.root.visible=true;}
  CITY_CUT.cam.value.copy(pos); CITY_CUT.pl.value.set(p.pos.x, p.pos.y + 1.4, p.pos.z); CITY_CUT.on.value = G.state === 'play' && p.alive ? 1 : 0;
  const want = 70 + (p.awak > 0 ? 4 : 0) + G.fovKick;
  G.fovKick = Math.max(0, G.fovKick - dt * 18);
  cam.fov += (want * (1 - CAMFX.zoom * .1) - cam.fov) * Math.min(1, dt * 10);
  if (G.shake > 0) {
    const s = G.shake * .35;
    camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); camera.position.z += rand(-s, s);
    G.shake = Math.max(0, G.shake - dt * 2.2);
  }
  if (Math.abs(camera.fov - cam.fov) > .01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
}

// ===== Escena del selector de personajes: vive en js/ui/selector.js =====
const { SH, drawBackdrop, showSelect, syncStudioBeta, updateShow } = CF_UI.crearSelector({ $, AWAKE_DUR, Animator, CHARS, G, POSE, Parts, STAT_NAMES, TAU, V3, WEAPONS, ZZZ_U, addEyes, bbSet, buildFighterModel, buildTrack, charSkin, copyCanvas, disposeModel, eyeGlow, glowMat, headPortrait, javiBBTrack, jlLocomotion, pixTex, rand, ringAt, setSpear, setupFace, sfx, stancePose, startTwirl, twirlAngle, updateFace, get netMenuPresence() { return netMenuPresence; }, get ED() { return ED; }, get edShowFrame() { return edShowFrame; } });
// ================= Partida =================
function clearFighters() {
  G.matchGen++;
  if (G.chore) { try { choreEnd(G.chore); } catch (e) {} }
  clearSkillObjs();
  setRoomBoard(false, false);
  clearSekzaFlocks();
  clearSpearDrops();
  seqHud(null);
  G.fighters.forEach(f => f.dispose()); G.fighters = []; G.player = null;
  PROJ.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); PROJ.length = 0;
  for (const fx of FX) { fx.sc.remove(fx.obj); if (fx.dispose) fx.dispose(); else { fx.obj.geometry?.dispose(); fx.obj.material?.dispose(); } } FX.length = 0;
  TIMERS.length = 0; DN.forEach(d => d.el.remove()); DN.length = 0; $('feed').innerHTML = ''; $('minicut').innerHTML = '';
  PS.clear(); NET.proxies.clear(); ZONES.length = 0; G.duel = null; G.chore = null; document.body.classList.remove('duel');
}
function applyAiLevels() { for (const f of G.fighters) if (f.ai) f.ai.P = aiParams(G.botLvl + f.ai.var); }
function spawnBots(n) {
  const names = [...BOT_NAMES].sort(() => Math.random() - .5);
  for (let i = 0; i < n; i++) {
    const ch = CHAR_IDS[Math.random() * CHAR_IDS.length | 0];
    const ov = {};
    if (Math.random() < .6) ov.shirt = SHIRTS[Math.random() * SHIRTS.length | 0];
    if (Math.random() < .4) ov.hair = ['#3b2414', '#1a1a1a', '#c8a15a', '#7b4b2a', '#e0e0e0'][Math.random() * 5 | 0];
    const f = new Fighter({ name: names[i % names.length], char: ch, skinOv: ov, lvlVar: rand(-.8, .8) });
    G.fighters.push(f); respawn(f); f.iframes = 0;
  }
  applyAiLevels();
}
const SESSION_STATS = { kills: 0, deaths: 0 };
function syncFriendsBtnPlace() {
  const fb = $('friendsbtn'), bk = $('bookbtn');
  if (!fb) return;
  if (G.state === 'play' && bk && bk.parentNode) {
    if (fb.parentNode !== bk.parentNode) bk.after(fb);
  } else if (fb.parentNode !== document.body) {
    document.body.appendChild(fb);
  }
}

// ===== Intro de entrada al mundo/partida: vive en js/combate/intro_entrada.js =====
const { INTRO, INTROS, introStart, introTick, introStop, introActive } = CF_COMBATE.crearIntroEntrada({ V3, clamp, fwd, rightOf, scene, camera, groundAt, buildSpear, setSpear, burst, sfx, bbSet, javiBBTrack, buildTrack, G, cam, endCamScript });

async function startMatch() {
  initAudio(); requestLock();
  if (G.mode === 'mp' && !NET.named && !(await joinRoom())) { unlock(); openTab('cfg'); return; }
  G.mp = G.mode === 'mp' || !!NET.named;
  NET.ko = null; NET.act = null; NET.acts = []; NET.hitsOut = [];
  if (MAPCUR.id !== 'A') setMapNow('A'); if (CF_A.MAPAS) CF_A.MAPAS.reset();
  stageExit(); clearFighters(); destRestore(true); rulesStart(); G.state = 'play'; G.over = false; G.paused = false; G.combo = 0; G.comboDmg = 0; G.lastHitDmg = 0; G.cine = null; endCamScript(); cineGrade(false); document.body.classList.remove('cine'); document.body.classList.add('has-match'); syncFriendsBtnPlace();
  G.bots = +$('nbots').value; G.goal = +$('goalsel').value;
  G.baseLvl = +$('lvl').value; G.botLvl = G.baseLvl; G.auto = $('auto').checked; G.balT = 12; G.winPK = 0; G.winPD = 0;
  G.pname = ($('pname-in').value || 'Jugador').trim().slice(0, 16) || 'Jugador';
  const p = new Fighter({ name: G.pname, char: G.charId, isPlayer: true, skin: G.customSkin || null, slim: G.customSkin ? G.customSlim : false });
  p.kills = SESSION_STATS.kills || 0;
  p.deaths = SESSION_STATS.deaths || 0;
  G.fighters.push(p); G.player = p; respawn(p);
  if (!G.mp) spawnBots(G.bots);
  buildSkillBar(p);
  $('pname').textContent = p.name.toUpperCase(); const sm = document.createElement('small'); sm.textContent = `${p.ch.name} · ${p.ch.title}`; $('pname').appendChild(sm);
  $('hud').style.setProperty('--c', p.ch.color); headPortrait(p.skin, $('hface'));
  $('hud').classList.remove('hidden'); $('menu').classList.add('hidden'); $('over').classList.add('hidden'); $('pause').classList.add('hidden'); $('death').classList.add('hidden');
  $('ailbl').textContent = G.mp ? 'Sala' : 'IA nivel';
  showBanner('¡A PELEAR!', '#d7ff2f', G.mp ? CITY.name + ' · Sala con amigos' : `${CITY.name} · Primero en ${G.goal} K.O.`);
  statsMatch(G.charId, G.mp); ultMusicPreload(p.ch.id);
  introStart(p);
  if (G.mp) { netSendPlay(); ROOM_UI.signature = ''; }
}
function toMenu() {
  introStop();
  socialSaveProfile(); if(SOC.open)socialClose();
  G.viewer = null; VW.on = false; $('viewer').classList.add('hidden'); document.body.classList.remove('duel', 'has-match');
  unlock(); stageExit(); clearDummies(); togglePanel(false);
  if (G.player) {
    SESSION_STATS.kills = G.player.kills;
    SESSION_STATS.deaths = G.player.deaths;
  }
  const wasMp = G.mp || !!NET.named;
  clearFighters();
  G.state = 'menu';
  G.mp = wasMp;
  G.over = false; G.paused = false; G.cine = null; endCamScript(); cineGrade(false); document.body.classList.remove('cine'); syncFriendsBtnPlace();
  $('hud').classList.add('hidden'); $('menu').classList.remove('hidden'); $('over').classList.add('hidden'); $('pause').classList.add('hidden');
  showSelect(G.charId);
}
function endMatch(w) {
  if (G.over) return;
  introStop();
  setRoomBoard(false, false); G.over = true; unlock(); w.victory = true; G.winner = w; statsEnd(!!w.isPlayer); javiSpeak(w, 'ev_victory'); for (const q of G.fighters) if (q !== w && q.isPlayer) javiSpeak(q, 'ev_defeat');
  $('overtitle').textContent = w.isPlayer ? '¡GANASTE!' : `GANÓ ${w.name.toUpperCase()}`;
  $('overtitle').style.color = w.isPlayer ? 'var(--hot)' : w.ch.color;
  const t = $('overtable'); t.innerHTML = ''; t.appendChild(scoreTable());
  $('over').classList.remove('hidden'); $('death').classList.add('hidden');
}
function autoBalance(dt) {
  if (!G.auto || G.state !== 'play' || G.mp) return;
  G.balT -= dt; if (G.balT > 0) return;
  G.balT = 12;
  const diff = G.winPK - G.winPD;
  let delta = 0;
  if (diff >= 2) delta = .5 * Math.min(2, diff - 1);
  else if (diff <= -2) delta = -.5 * Math.min(2, -diff - 1);
  G.winPK = G.winPD = 0;
  if (!delta) return;
  const nl = clamp(G.botLvl + delta, Math.max(1, G.baseLvl - 3), Math.min(10, G.baseLvl + 3));
  if (nl === G.botLvl) return;
  G.botLvl = nl; applyAiLevels();
  addFeedText(delta > 0 ? `Los bots suben a nivel ${nl}` : `Los bots bajan a nivel ${nl}`, delta > 0 ? '#ff8a80' : '#9fd3ff');
}

// ================= Input =================
const canvas = renderer.domElement;
let locked = false, lockFailed = false;
// Captura del mouse robusta: movimiento sin aceleración del sistema y reintentos (el navegador rechaza el bloqueo si se pide justo después de soltarlo)
function requestLock(tries = 0) {
  if (TOUCH.enabled || roomInputBlocked() || !G.shiftLock) return;   // sin Shift Lock el cursor es libre
  if (document.pointerLockElement === canvas) return;
  const retry = () => { if (tries < 8 && G.state === 'play' && !G.paused && !G.over && !roomInputBlocked()) setTimeout(() => requestLock(tries + 1), 180 + tries * 120); else lockFailed = true; };
  try {
    let r; try { r = canvas.requestPointerLock({ unadjustedMovement: true }); } catch (e) { r = canvas.requestPointerLock(); }
    if (r && r.catch) r.catch(() => { try { const r2 = canvas.requestPointerLock(); if (r2 && r2.catch) r2.catch(retry); } catch (e) { retry(); } });
  } catch (e) { retry(); }
}
function unlock() { if (document.pointerLockElement) document.exitPointerLock(); }
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas; if (locked && roomInputBlocked()) { unlock(); return; } if (locked) lockFailed = false;
  if (!locked && G.shiftLock && G.state === 'play' && !G.over && !G.panelOpen && !roomInputBlocked() && !window.__emoteWheelOpen && !window.__uiOpen) setPause(true);
});
document.addEventListener('pointerlockerror', () => { lockFailed = true; });
function setPause(on) {
  const opening=on&&!G.paused;
  G.paused = on; $('pause').classList.toggle('hidden', !on);
  if(on&&document.pointerLockElement===canvas)unlock();
  if (on) { $('plvl').value = Math.round(G.botLvl); $('plvl-o').textContent = `${Math.round(G.botLvl)} · ${LVL_NAMES[Math.round(G.botLvl)]}`; $('pauto').checked = G.auto; }
  if(opening){setPauseView('home',false);syncAudioControls();$('resume').focus({preventScroll:true});}
  for (const k in keys) keys[k] = false; mouse.left = mouse.right = false;
}
addEventListener('keydown', e => {
  if (roomInputBlocked() && !ROOM_UI.open && !ROOM_UI.profile) return;
  const tag = e.target.tagName;
  if(G.paused&&$('pause').contains(e.target)&&(tag==='INPUT'||tag==='SELECT')&&e.code!=='Escape')return;
  if ((tag === 'INPUT' || tag === 'SELECT') && (G.state === 'menu' || G.panelOpen || e.target.type === 'text')) return;
  if (G.state === 'menu') {
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const i = CHAR_IDS.indexOf(G.charId), n = CHAR_IDS.length; G.charId = CHAR_IDS[(i + (e.code === 'ArrowRight' ? 1 : n - 1)) % n]; showSelect(G.charId); e.preventDefault(); }
    if (e.code === 'Enter' && e.target.tagName !== 'BUTTON') startMatch();
    return;
  }
  if ([BINDS.jump, BINDS.board, BINDS.dash, BINDS.block, BINDS.ult, 'Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (G.viewer) { if (e.code === 'Escape') closeViewer(); else if (e.code === 'Space') { vTogglePlay(); e.preventDefault(); } return; }
  if(!G.over&&e.code==='Escape'&&!locked){e.preventDefault();if(G.panelOpen)togglePanel(false);else if(G.paused){if($('pause').dataset.view==='options')setPauseView('home');else{setPause(false);requestLock();}}else setPause(true);return;}
  if (!G.over && e.code === 'KeyP') { setPause(!G.paused); if (!G.paused) requestLock(); return; }
  if (isBindShift(e.code)) { if (!e.repeat) { slTap = true; } } else slTap = false;
  if(e.code==='KeyR'&&!e.repeat&&!G.panelOpen&&!G.paused&&!G.over){if(G.player?.ch===CHARS.sekza||G.player?.ch.canFly){e.preventDefault();sekzaSpecialKey(G.player);}return;}
  if (e.code === 'KeyH' && !e.repeat && !G.paused && !G.over) { togglePanel(); return; }
  if (!keys[e.code]) pressed.add(e.code);
  keys[e.code] = true;
});
let slTap = false;
function toggleShiftLock() { G.shiftLock = !G.shiftLock; $('slchip').classList.toggle('hidden', !G.shiftLock); try { localStorage.setItem('bsb_sl', G.shiftLock ? '1' : '0'); } catch (err) { }
  if (G.shiftLock) { lockFailed = false; requestLock(); } else unlock(); }   // encendido: captura el mouse · apagado: lo suelta y se pueden tocar los botones
addEventListener('keyup', e => {
  keys[e.code] = false;
  if (isBindShift(e.code) && slTap) { slTap = false; if (G.state === 'play' && !G.paused && !G.over && !G.panelOpen && !G.viewer) toggleShiftLock(); }
});
addEventListener('keydown', e => { if (e.code === 'F3') { G.netDbg = !G.netDbg; e.preventDefault(); } });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.left = mouse.right = false; slTap = false; if (ROOM_UI.open && !ROOM_UI.profile) setRoomBoard(false, false); });
// Cursor propio: flecha de píxeles en los menús; durante el combate no se muestra el del sistema (la mira es el centro) y un aviso pide hacer clic si se perdió la captura
{
  const arrow = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 12 12' shape-rendering='crispEdges'><path d='M1 1h2v1h1v1h1v1h1v1h1v1h1v1H6v1h1v2H6V9H5V8H4v1H3V8H2V3H1z' fill='#fff' stroke='#10131c' stroke-width='1'/></svg>`;
  const hand = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 12 12' shape-rendering='crispEdges'><path d='M4 1h2v4h1V4h1v1h1V4h1v4H9v2H5V9H4V7H3V6h1z' fill='#fff' stroke='#10131c' stroke-width='1'/></svg>`;
  const st = document.createElement('style');
  st.textContent = `html,body{cursor:url("data:image/svg+xml;utf8,${encodeURIComponent(arrow)}") 2 2,default}
button,select,summary,label,input[type=range],input[type=checkbox],.card,[role=button]{cursor:url("data:image/svg+xml;utf8,${encodeURIComponent(hand)}") 8 2,pointer}
body.inplay,body.inplay *{cursor:none!important}
#lockhint{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:35;background:rgba(10,14,24,.82);border:2px solid #7ad7ff;color:#fff;padding:7px 16px;border-radius:6px;font:700 15px "Chakra Petch",sans-serif;display:none;pointer-events:none}`;
  document.head.appendChild(st);
  const hint = document.createElement('div'); hint.id = 'lockhint'; hint.textContent = 'Haz clic en el juego para recuperar el control del mouse'; document.body.appendChild(hint);
  setInterval(() => {
    const play = G.state === 'play' && !G.paused && !G.over && !G.viewer && !roomInputBlocked() && !TOUCH.enabled;
    document.body.classList.toggle('inplay', play && locked);
    hint.style.display = play && !locked && G.shiftLock ? 'block' : 'none';
  }, 200);
}
// Controles táctiles: cada dedo tiene su propio identificador, por lo que se puede mover, mirar y atacar a la vez.
const TOUCH = { enabled: matchMedia('(pointer: coarse)').matches, moveId: null, lookId: null, x: 0, y: 0, lx: 0, ly: 0, held: new Map() };
function touchActive(){return TOUCH.enabled&&G.state==='play'&&!G.paused&&!G.over&&!G.viewer&&!G.cine&&!G.panelOpen&&!roomInputBlocked();}
function touchReset(){TOUCH.moveId=TOUCH.lookId=null;TOUCH.x=TOUCH.y=0;for(const [id,key] of TOUCH.held){if(key==='attack')mouse.left=false;else if(key==='block')mouse.right=false;else if(key==='jump')keys.Space=false;if(key==='down')keys.KeyC=false;}TOUCH.held.clear();pressed.clear();document.querySelectorAll('.touch-held').forEach(b=>b.classList.remove('touch-held'));const stick=$('touch-stick');if(stick)stick.style.transform='translate(-50%,-50%)';}
function touchUpdate(){const on=touchActive();if(!on&&touchEdit)touchEditMode(false);const sh=TOUCH.shiftButton;if(sh){const active=!!G.shiftLock;sh.classList.toggle("on",active);if(sh.getAttribute("aria-pressed")!==String(active))sh.setAttribute("aria-pressed",String(active));}document.body.classList.toggle('touch-play',on);if(!on&&(TOUCH.moveId!==null||TOUCH.lookId!==null||TOUCH.held.size))touchReset();const r=$('touch-special');if(r)r.hidden=!G.player||G.player.ch!==CHARS.sekza;const down=$('touch-down');if(down)down.hidden=!G.player||G.player.ch!==CHARS.sekza||G.player.rFlightT<=0;}
function touchInit(){
 if(!TOUCH.enabled)return;
 const ui=document.createElement('div');ui.id='touch-controls';ui.innerHTML='<div id="touch-joystick" aria-label="Mover personaje"><span id="touch-stick"></span></div><div class="touch-actions"><button type="button" data-touch="attack" class="touch-attack">GOLPE</button><button type="button" data-touch="block">BLOQUEAR</button><button type="button" data-touch="jump">SALTAR</button><button type="button" data-touch="dash">ESQUIVAR</button><button type="button" data-touch="special" id="touch-special">R · VUELO / ×2 GAVIOTAS</button><button type="button" data-touch="down" id="touch-down" hidden>BAJAR</button></div><div class="touch-top"><button type="button" data-touch="friends">Amigos</button><button type="button" data-touch="board">Jugadores</button><button type="button" data-touch="pause">Pausa</button></div><div class="touch-hint">Arrastrá el lado derecho para mirar</div>';document.body.appendChild(ui);
 const joy=$('touch-joystick');function move(e){const r=joy.getBoundingClientRect(),radius=r.width*.38,dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy),scale=len>radius?radius/len:1;TOUCH.x=dx*scale/radius;TOUCH.y=-dy*scale/radius;$('touch-stick').style.transform=`translate(calc(-50% + ${dx*scale}px),calc(-50% + ${dy*scale}px))`;}
 joy.addEventListener('pointerdown',e=>{if(!touchActive()||TOUCH.moveId!==null)return;e.preventDefault();e.stopPropagation();TOUCH.moveId=e.pointerId;joy.setPointerCapture(e.pointerId);move(e);});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===TOUCH.moveId){e.preventDefault();move(e);}});
 const endMove=e=>{if(e.pointerId===TOUCH.moveId){TOUCH.moveId=null;TOUCH.x=TOUCH.y=0;$('touch-stick').style.transform='translate(-50%,-50%)';}};joy.addEventListener('pointerup',endMove);joy.addEventListener('pointercancel',endMove);joy.addEventListener('lostpointercapture',endMove);
 ui.addEventListener('pointerdown',e=>{const b=e.target.closest('button[data-touch]');if(!b||!touchActive())return;e.preventDefault();e.stopPropagation();initAudio();const key=b.dataset.touch;if(key==='pause'){touchReset();setPause(true);return;}if(key==='board'){touchReset();setRoomBoard(true);return;}if(key==='friends'){touchReset();socialOpen();return;}if(key==='special'){sekzaSpecialKey(G.player);return;}if(key==='dash'){pressed.add('KeyQ');return;}if(key==='attack')mouse.left=true;if(key==='block')mouse.right=true;if(key==='jump')keys.Space=true;if(key==='down')keys.KeyC=true;TOUCH.held.set(e.pointerId,key);b.classList.add('touch-held');b.setPointerCapture(e.pointerId);});
 const release=e=>{const key=TOUCH.held.get(e.pointerId);if(!key)return;TOUCH.held.delete(e.pointerId);if(![...TOUCH.held.values()].includes(key)){if(key==='attack')mouse.left=false;if(key==='block')mouse.right=false;if(key==='jump')keys.Space=false;if(key==='down')keys.KeyC=false;}e.target.closest('button')?.classList.remove('touch-held');};ui.addEventListener('pointerup',release);ui.addEventListener('pointercancel',release);ui.addEventListener('lostpointercapture',release);
 // La zona libre de la pantalla mueve la cámara, incluso cuando hay capas del HUD encima.
 const cameraTarget=t=>t instanceof Element&&!t.closest('#touch-controls button,#touch-joystick,#skills,button,input,select,textarea,a,[role="button"],[role="dialog"],#book,#board,#panel,#uidlg');
 addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||!touchActive()||touchEdit||TOUCH.lookId!==null||!cameraTarget(e.target))return;e.preventDefault();TOUCH.lookId=e.pointerId;TOUCH.lx=e.clientX;TOUCH.ly=e.clientY;}, {capture:true,passive:false});
 addEventListener('pointermove',e=>{if(e.pointerId!==TOUCH.lookId||!touchActive()||touchEdit)return;e.preventDefault();cam.yaw-=(e.clientX-TOUCH.lx)*.006;cam.pitch=clamp(cam.pitch+(e.clientY-TOUCH.ly)*.006,-.35,1.2);TOUCH.lx=e.clientX;TOUCH.ly=e.clientY;}, {capture:true,passive:false});
 const endLook=e=>{if(e.pointerId===TOUCH.lookId)TOUCH.lookId=null;};addEventListener('pointerup',endLook,true);addEventListener('pointercancel',endLook,true);
 document.addEventListener('touchmove',e=>{if(touchActive()&&!touchEdit&&cameraTarget(e.target))e.preventDefault();},{capture:true,passive:false});
 $('skills').addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||!touchActive())return;const slot=e.target.closest('.slot');if(!slot)return;const i=[...$('skills').children].indexOf(slot);if(i<0)return;e.preventDefault();e.stopPropagation();initAudio();pressed.add(i===4?'KeyG':'Digit'+(i+1));});
 addEventListener('blur',touchReset);addEventListener('visibilitychange',()=>{if(document.hidden)touchReset();});
}
touchInit();
// Cada posición guardada se expresa como proporción de la pantalla, para mantenerla al cambiar de tamaño.
const TOUCH_LAYOUT_KEY='cf_touch_layout_v1';
let touchEdit=false,touchDrag=null,touchPositions={};
try{const p=JSON.parse(localStorage.getItem(TOUCH_LAYOUT_KEY)||'{}');if(p&&typeof p==='object'&&!Array.isArray(p))touchPositions=p;}catch(e){}
function touchItem(id){return id==='joystick'?$('touch-joystick'):document.querySelector('#touch-controls [data-touch="'+id+'"]');}
function touchApplyLayout(){for(const [id,p] of Object.entries(touchPositions)){if(!['joystick','attack','block','jump','dash','shift','special','down'].includes(id)||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const el=touchItem(id);if(!el)continue;el.style.position='fixed';const hw=(el.offsetWidth||54)/2,hh=(el.offsetHeight||54)/2;el.style.left=clamp(p.x*innerWidth,hw+4,innerWidth-hw-4)+'px';el.style.top=clamp(p.y*innerHeight,hh+4,innerHeight-hh-4)+'px';el.style.right='auto';el.style.bottom='auto';el.style.transform='translate(-50%,-50%)';}}
function touchEditMode(on){touchReset();touchEdit=on;touchDrag=null;const ui=$('touch-controls');ui.classList.toggle('touch-editing',on);ui.querySelector('[data-touch=edit]').textContent=on?'Listo':'Ajustar';}
function touchLayoutSetup(){
 const ui=$('touch-controls'),actions=ui.querySelector('.touch-actions'),top=ui.querySelector('.touch-top');
 const shift=document.createElement('button');shift.type='button';shift.dataset.touch='shift';shift.setAttribute('aria-label','Bloqueo de cámara');shift.innerHTML='<span class="ti">⌖</span><span>FIJAR</span>';TOUCH.shiftButton=shift;shift.classList.toggle('on',!!G.shiftLock);shift.setAttribute('aria-pressed',String(!!G.shiftLock));actions.appendChild(shift);
 for(const [id,icon,label] of [['attack','✊','GOLPE'],['block','⬡','BLOQUEO'],['jump','↑','SALTO'],['dash','➜','ESQUIVA'],['special','✦','R'],['down','↓','BAJAR']]){const el=touchItem(id);el.innerHTML='';const i=document.createElement('span'),t=document.createElement('span');i.className='ti';i.textContent=icon;t.textContent=label;el.append(i,t);if(id==='special')el.setAttribute('aria-label','Especial de Sekza: vuelo; doble toque en la playa para gaviotas');}
 for(const [id,text] of [['edit','Ajustar'],['reset','Restablecer']]){const b=document.createElement('button');b.type='button';b.dataset.touch=id;b.textContent=text;top.prepend(b);}
 const info=document.createElement('div');info.className='touch-edit-label';info.textContent='Arrastrá los controles. Tocá Listo al terminar.';ui.appendChild(info);touchApplyLayout();
 ui.addEventListener('pointerdown',e=>{
  const b=e.target.closest('button[data-touch]');const k=b?.dataset.touch;
  if(k==='edit'){e.preventDefault();e.stopImmediatePropagation();touchEditMode(!touchEdit);return;}
  if(k==='reset'&&touchEdit){e.preventDefault();e.stopImmediatePropagation();touchPositions={};try{localStorage.removeItem(TOUCH_LAYOUT_KEY);}catch(err){}for(const id of ['joystick','attack','block','jump','dash','shift','special','down']){const el=touchItem(id);if(el)for(const prop of ['position','left','top','right','bottom','transform'])el.style.removeProperty(prop);}return;}
  if(k==='shift'&&!touchEdit){if(!touchActive())return;e.preventDefault();e.stopImmediatePropagation();toggleShiftLock();b.classList.toggle('on',G.shiftLock);b.setAttribute('aria-pressed',String(!!G.shiftLock));return;}
  if(!touchEdit)return;
  const el=e.target.closest('#touch-joystick, .touch-actions button');if(!el||el.hidden)return;
  e.preventDefault();e.stopImmediatePropagation();const rect=el.getBoundingClientRect();touchDrag={id:el.id==='touch-joystick'?'joystick':el.dataset.touch,pointer:e.pointerId,dx:e.clientX-(rect.left+rect.width/2),dy:e.clientY-(rect.top+rect.height/2)};el.setPointerCapture(e.pointerId);
 },true);
 ui.addEventListener('pointermove',e=>{if(!touchDrag||e.pointerId!==touchDrag.pointer)return;e.preventDefault();e.stopImmediatePropagation();touchPositions[touchDrag.id]={x:clamp((e.clientX-touchDrag.dx)/innerWidth,.04,.96),y:clamp((e.clientY-touchDrag.dy)/innerHeight,.05,.95)};touchApplyLayout();},true);
 const end=e=>{if(!touchDrag||e.pointerId!==touchDrag.pointer)return;e.preventDefault();e.stopImmediatePropagation();touchDrag=null;try{localStorage.setItem(TOUCH_LAYOUT_KEY,JSON.stringify(touchPositions));}catch(err){}};ui.addEventListener('pointerup',end,true);ui.addEventListener('pointercancel',end,true);ui.addEventListener('lostpointercapture',end,true);
 addEventListener('resize',()=>{if(touchEdit)touchEditMode(false);touchApplyLayout();});
}
if(TOUCH.enabled){
 touchLayoutSetup();
 const fullscreenHelp=()=>uiAlert('Tu navegador no permite activar pantalla completa aquí. En iPhone, abrí el juego en Safari y elegí Compartir → Agregar a Inicio → Abrir como app web.');
 const toggleFullscreen=()=>{try{const active=document.fullscreenElement||document.webkitFullscreenElement;const fn=active?(document.exitFullscreen||document.webkitExitFullscreen):(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);if(!fn){fullscreenHelp();return;}const result=fn.call(active?document:document.documentElement);if(result&&result.catch)result.catch(fullscreenHelp);}catch(e){fullscreenHelp();}};
 for(const id of ['title-fullscreen','pause-fullscreen'])$(id).addEventListener('click',toggleFullscreen);
 if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>touchApplyLayout());
}


addEventListener('pointerdown', () => initAudio(), { once: true });
canvas.addEventListener('mousedown', e => {
  if (G.viewer) { VW.drag = true; return; }
  if (TOUCH.enabled || G.state !== 'play' || G.paused || G.over || roomInputBlocked()) return;
  initAudio();
  if (!locked && G.shiftLock && !window.__emoteWheelOpen && !window.__uiOpen) { lockFailed = false; requestLock(); }
  slTap = false;
  if (e.button === 0) mouse.left = true; if (e.button === 2) mouse.right = true;
});
addEventListener('mouseup', e => { if (e.button === 0) mouse.left = false; if (e.button === 2) mouse.right = false; });
addEventListener('contextmenu', e => { if (G.state === 'play') e.preventDefault(); });
addEventListener('mousemove', e => {
  if (G.state !== 'play' || G.paused || G.cine || roomInputBlocked() || window.__emoteWheelOpen) return;   // con la rueda de emotes abierta el mouse no gira la camara
  if (locked || (lockFailed && (mouse.left || mouse.right)) || (!G.shiftLock && !TOUCH.enabled && mouse.right)) {   // cursor libre: la camara gira manteniendo el click derecho
    cam.yaw -= e.movementX * .0026;
    cam.pitch = clamp(cam.pitch + e.movementY * .0022, -.35, 1.2);
  }
});
addEventListener('mouseup', () => { VW.drag = false; });
addEventListener('mousemove', e => { if (!G.viewer || !VW.drag) return; VW.yaw -= e.movementX * .006; VW.pitch = clamp(VW.pitch + e.movementY * .005, -.2, 1.35); if (!VW.free) vSetFree(true); });
canvas.addEventListener('wheel', e => { if (G.viewer) { VW.dist = clamp(VW.dist + Math.sign(e.deltaY) * .6, 2.5, 16); return; } cam.dist = clamp(cam.dist + Math.sign(e.deltaY) * .6, 3.5, 12); }, { passive: true });
addEventListener('resize', () => {
  camera.aspect = SH.cam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); SH.cam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); if (composer) composer.setSize(GFX.post?innerWidth:16, GFX.post?innerHeight:16); sizeLines();
});

// ================= Sala de cinemáticas: ver cada coreografía con el atacante y la víctima =================
const sebFlurry = (t0, t1, step, dmg) => { const out = []; for (let t = t0, i = 0; t <= t1 + 1e-6; t += step, i++) out.push({ t: +t.toFixed(3), hit: dmg, fx: i % 2 ? 'line' : 'impact', hs: .03, shake: .15, sfx: i % 3 ? 'hit' : 'heavy' }); return out; };
/* CF_API_BEGIN  (todo lo que pueden usar los archivos de personajes/<id>/.../Code y las coreografias; si creas una funcion nueva en este archivo y la quieres usar desde alli, anade su nombre a esta lista) */
const CF_A = (() => {
  const api = {
    get CFG_CINE() { return CFG_CINE; },
    get V3() { return V3; },
    get TAU() { return TAU; },
    get rand() { return rand; },
    get pick() { return pick; },
    get clamp() { return clamp; },
    get fwd() { return fwd; },
    get rightOf() { return rightOf; },
    get wrapA() { return wrapA; },
    get angLerp() { return angLerp; },
    get yawTo() { return yawTo; },
    get dist2d() { return dist2d; },
    get easeOut() { return easeOut; },
    get $() { return $; },
    get IS_GUIDE() { return IS_GUIDE; },
    get GUIDE_OFF() { return GUIDE_OFF; }, set GUIDE_OFF(v) { GUIDE_OFF = v; },
    shade,
    get _c() { return _c; },
    get LOADER() { return LOADER; },
    get WEAK_PC() { return WEAK_PC; },
    get LOW_PC() { return LOW_PC; },
    get PERF_FX() { return PERF_FX; }, set PERF_FX(v) { PERF_FX = v; },
    get PERF_DEST() { return PERF_DEST; }, set PERF_DEST(v) { PERF_DEST = v; },
    get renderer() { return renderer; },
    get scene() { return scene; },
    get SKY() { return SKY; },
    get camera() { return camera; },
    get sun() { return sun; },
    get ANIME_SKY_TEX() { return ANIME_SKY_TEX; },
    get skyGeo() { return skyGeo; },
    get skyMat() { return skyMat; },
    get skyDome() { return skyDome; },
    noiseRect,
    pixTex,
    get BLOCK_TEX() { return BLOCK_TEX; },
    get CITY_GRAD() { return CITY_GRAD; },
    get CITY_CUT() { return CITY_CUT; },
    get CUT_GLSL() { return CUT_GLSL; },
    get HOLE_U() { return HOLE_U; },
    cityAnimeMaterial,
    get B() { return B; },
    get ARENA() { return ARENA; },
    get COL() { return COL; },
    get CLOUDS() { return CLOUDS; },
    get ELEVATORS() { return ELEVATORS; },
    get CITY() { return CITY; },
    get SHORE() { return SHORE; },
    get inSea() { return inSea; },
    get SUN_DIR() { return SUN_DIR; },
    get BEACH() { return BEACH; },
    get CITY_PLAN() { return CITY_PLAN; },
    get CITY_MODEL_DIMS() { return CITY_MODEL_DIMS; },
    get MAP_ITEMS() { return MAP_ITEMS; },
    get MAPED() { return MAPED; },
    get SPAWN_POINTS() { return SPAWN_POINTS; },
    get MAPS() { return MAPS; }, get MAPCUR() { return MAPCUR; }, get TRAVEL() { return TRAVEL; }, get LAKES() { return LAKES; },
    mapNow, setMapNow, spawnsNow, worldBig, outLand, get mmApply() { return mmApply; }, endAction, addOutlineOffset, fighterToonMaterial, amCoord, get buildVoxelWeapon() { return buildVoxelWeapon; },
    cityGrassAt,
    get ROOM_ATMOSPHERE() { return ROOM_ATMOSPHERE; },
    get WX() { return WX; },
    get wxRandom() { return wxRandom; },
    get wxRandomValue() { return wxRandomValue; },
    get WX_ROOM() { return WX_ROOM; },
    get atmosphereLeader() { return atmosphereLeader; },
    get canEditAtmosphere() { return canEditAtmosphere; },
    get atmosphereCommand() { return atmosphereCommand; },
    get atmospherePayload() { return atmospherePayload; },
    get weatherEntityId() { return weatherEntityId; },
    get atmospherePlayers() { return atmospherePlayers; },
    get adoptAtmosphere() { return adoptAtmosphere; },
    get advanceAtmosphere() { return advanceAtmosphere; },
    get lightningDamage() { return lightningDamage; },
    get buildLightningVisual() { return buildLightningVisual; },
    get updateAtmosphereStrikes() { return updateAtmosphereStrikes; },
    get WX_PRESETS() { return WX_PRESETS; },
    get cityWeatherNow() { return cityWeatherNow; },
    get wxLite() { return wxLite; },
    get saveCityWeather() { return saveCityWeather; },
    get setCityTime() { return setCityTime; },
    get setCityWeather() { return setCityWeather; },
    get cityWeatherAudio() { return cityWeatherAudio; },
    get syncWeatherControls() { return syncWeatherControls; },
    get updateCityWeather() { return updateCityWeather; },
    get initWeatherControls() { return initWeatherControls; },
    get WORLD() { return WORLD; },
    get SKY_OBJS() { return SKY_OBJS; },
    get HEMI() { return HEMI; },
    get CINE_RIM() { return CINE_RIM; },
    get CINE_KEY() { return CINE_KEY; },
    get SHOTS() { return SHOTS; },
    get STAGE() { return STAGE; },
    get initStage() { return initStage; },
    get stageEnter() { return stageEnter; },
    get stageExit() { return stageExit; },
    get updateStage() { return updateStage; },
    get cineGrade() { return cineGrade; },
    get SEA_Y() { return SEA_Y; },
    seaFloor,
    get GUIDE_Y() { return GUIDE_Y; }, set GUIDE_Y(v) { GUIDE_Y = v; },
    groundAt,
    get Parts() { return Parts; },
    get PS() { return PS; },
    get emit() { return emit; },
    get burst() { return burst; },
    get faceRects() { return faceRects; },
    makeSkinCanvas,
    normalizeSkin,
    detectSlim,
    headPortrait,
    get PX() { return PX; },
    get TOON_GRAD() { return TOON_GRAD; },
    get OUTLINE_MAT() { return OUTLINE_MAT; },
    boxUV,
    buildModel,
    disposeModel,
    get JESULUTO_BBS() { return JESULUTO_BBS; },
    get JL_CUBE_FACES() { return JL_CUBE_FACES; },
    get jlEyesTexture() { return matPeleador.jlEyesTexture; }, set jlEyesTexture(v) { matPeleador.jlEyesTexture = v; },
    jlTextureFilter,
    jlCubeGeometry,
    buildJesulutoModel,
    buildFighterModel,
    jlResetBbsExtras,
    get jlPosePosition() { return jlPosePosition; },
    get jlPoseScale() { return jlPoseScale; },
    get jlPoseRotation() { return jlPoseRotation; },
    get jlPoseEuler() { return jlPoseEuler; },
    jlBlendClip,
    jlLocomotion,
    get JL_TEX() { return JL_TEX; },
    get jlDialogTex() { return jlDialogTex; },
    get JL_WIN_GEO() { return JL_WIN_GEO; },
    get jlWinMat() { return jlWinMat; },
    get jlBarTex() { return jlBarTex; },
    get jlLaunchWindow() { return jlLaunchWindow; },
    get jlFallWindow() { return jlFallWindow; },
    get jlDrawScreen() { return jlDrawScreen; },
    get addScreen() { return addScreen; },
    get jlScreen() { return jlScreen; },
    get jlUpdateScreen() { return jlUpdateScreen; },
    get drawClippy() { return drawClippy; },
    get makeClippy() { return makeClippy; },
    get disposeClippy() { return disposeClippy; },
    get JL_QUOTES() { return JL_QUOTES; },
    get _jv() { return _jv; },
    get updateJesuluto() { return updateJesuluto; },
    get clippyAssist() { return clippyAssist; },
    get jlGlitch() { return jlGlitch; },
    get JL_CSS() { return JL_CSS; },
    get jlErrorCascade() { return jlErrorCascade; },
    get jlAwaken() { return jlAwaken; },
    get PIG_MATS() { return PIG_MATS; },
    jlPigeon,
    morphFighter,
    adaptMul,
    capHud,
    updateCapitan,
    get capEnd() { return capEnd; },
    addPico,
    get picoMul() { return picoMul; },
    get dxz() { return dxz; },
    randiGlyph,
    randiCuy,
    randiCondorFly,
    randiDog,
    randiTinku,
    spawnDebris,
    destUpdate,
    worldDamage,
    worldBreak,
    colCarve,
    scarDecal,
    bbRegister,
    destRestore,
    destHide,
    holesUpdate,
    bbHole,
    applyNetDest,
    get bxg() { return bxg; },
    get DOM_ANIMALS() { return DOM_ANIMALS; },
    domFloorTex,
    domFlagTex,
    domShatter,
    get DOMX() { return DOMX; }, set DOMX(v) { DOMX = v; },
    randiDomainFx,
    makeGiantVerity,
    disposeMount,
    mountStomp,
    mountPose,
    mountEnd,
    mountUpdate,
    sebRemoteCtl,
    sebCounter,
    sebWallRelease,
    randiSummon,
    randiRelease,
    get addWings() { return addWings; },
    get updateWings() { return updateWings; },
    get _sv1() { return _sv1; },
    get _sv2() { return _sv2; },
    get _sv3() { return _sv3; },
    get addSpiderLegs() { return addSpiderLegs; },
    get updateSpiderLegs() { return updateSpiderLegs; },
    get updateSwordFire() { return updateSwordFire; },
    get firePatch() { return firePatch; },
    get VERITY_KINDS() { return VERITY_KINDS; },
    get _vh() { return _vh; },
    get drawVerityFace() { return drawVerityFace; },
    get makeVerity() { return makeVerity; },
    get verityFace() { return verityFace; },
    get verityBillboard() { return verityBillboard; },
    get disposeVerity() { return disposeVerity; },
    get verityGo() { return verityGo; },
    get updateVerity() { return updateVerity; },
    get verityScene() { return verityScene; },
    get webWrap() { return webWrap; },
    get buildWebDisc() { return buildWebDisc; },
    get copyCanvas() { return copyCanvas; },
    get analyzeFace() { return analyzeFace; },
    get setupFace() { return setupFace; },
    get drawFace() { return drawFace; },
    get FACE_STATES() { return FACE_STATES; },
    get FACE_FALLBACK() { return FACE_FALLBACK; },
    get FACE_LIB() { return FACE_LIB; },
    get loadFaceLib() { return loadFaceLib; },
    get refreshFaces() { return refreshFaces; },
    get saveFaceLib() { return saveFaceLib; },
    get faceCharId() { return faceCharId; },
    get faceEyeCells() { return faceEyeCells; },
    get paintFacePreset() { return paintFacePreset; },
    get faceState() { return faceState; },
    get FACE_VER() { return FACE_VER; },
    get FACE_DEFAULTS() { return FACE_DEFAULTS; },
    get BBS_EYES() { return BBS_EYES; },
    get bbsEyesAttach() { return bbsEyesAttach; },
    get bbsEyeSample() { return bbsEyeSample; },
    get bbsEyesUpdate() { return bbsEyesUpdate; },
    get updateFace() { return updateFace; },
    get FACE_POOL() { return FACE_POOL; },
    get FACE_ART() { return FACE_ART; },
    get FACE_IMG_CACHE() { return FACE_IMG_CACHE; },
    get FACE_INFO_CACHE() { return FACE_INFO_CACHE; },
    get hex2() { return hex2; },
    get feFaceInfo() { return feFaceInfo; },
    get makeNormal() { return makeNormal; },
    get ensureNormal() { return ensureNormal; },
    get ensureNormalAll() { return ensureNormalAll; },
    get drawFaceArt() { return drawFaceArt; },
    get FACE_FPS() { return FACE_FPS; },
    get faceImageTex() { return faceImageTex; },
    get faceAnimTick() { return faceAnimTick; },
    get updateFaceAnims() { return updateFaceAnims; },
    get feGifFrames() { return feGifFrames; },
    get setFaceDecal() { return setFaceDecal; },
    get FE() { return FE; },
    get feLib() { return feLib; },
    get feExpr() { return feExpr; },
    get feFaceBase() { return feFaceBase; },
    get feColor() { return feColor; },
    get feDrawFace() { return feDrawFace; },
    get feDrawMain() { return feDrawMain; },
    get feRender() { return feRender; },
    get feRenderImg() { return feRenderImg; },
    get feImgChanged() { return feImgChanged; },
    get feFaceCanvas() { return feFaceCanvas; },
    get feDownload() { return feDownload; },
    get feLetterFor() { return feLetterFor; },
    get feImportPNG() { return feImportPNG; },
    get feMsg() { return feMsg; },
    get feSelect() { return feSelect; },
    get fePaintAt() { return fePaintAt; },
    get feOpen() { return feOpen; },
    get feClose() { return feClose; },
    get feChangeChar() { return feChangeChar; },
    get feInit() { return feInit; },
    get addEyes() { return addEyes; },
    get eyeGlow() { return eyeGlow; },
    get buildSpear() { return buildSpear; },
    get buildScepter() { return buildScepter; },
    get buildSword() { return buildSword; },
    get WEAPONS() { return WEAPONS; },
    get setSpear() { return setSpear; },
    get JOINTS() { return JOINTS; },
    get CINE_PARTS() { return CINE_PARTS; },
    get JDEF() { return JDEF; },
    mirror,
    get POSE() { return POSE; },
    stancePose,
    runPose,
    barragePose,
    dizzyPose,
    get JAVI_ACTING() { return JAVI_ACTING; },
    get JAVI_BB_DATA() { return JAVI_BB_DATA; },
    get RED_BB_DATA() { return RED_BB_DATA; },
    get GATO_BB_DATA() { return GATO_BB_DATA; },
    get SEK_BB_DATA() { return SEK_BB_DATA; },
    get RKT_BB_DATA() { return RKT_BB_DATA; },
    get UKY_BB_DATA() { return UKY_BB_DATA; },
    get SEB_BB_DATA() { return SEB_BB_DATA; },
    get RANDI_BB_DATA() { return RANDI_BB_DATA; },
    get JAVI_BB_CACHE() { return JAVI_BB_CACHE; },
    get bbSet() { return bbSet; },
    javiBBTrack,
    get BB_ACTIONS() { return BB_ACTIONS; },
    javiBBSelection,
    bbSample,
    javiGait,
    playJaviBB,
    get TENS() { return TENS; },
    get DRAG() { return DRAG; },
    get jv() { return jv; },
    buildTrack,
    cineSlope,
    buildCineTrack,
    sampleTrack,
    get Animator() { return Animator; },
    get CHARS() { return CHARS; },
    get AWAKE_DUR() { return AWAKE_DUR; },
    get ULT_GAIN() { return ULT_GAIN; },
    get AWK() { return AWK; },
    get skillsOf() { return skillsOf; },
    get CHAR_IDS() { return CHAR_IDS; },
    get DMG_GLOBAL() { return DMG_GLOBAL; },
    get DUMMY_CH() { return DUMMY_CH; },
    get STAT_NAMES() { return STAT_NAMES; },
    get SKIN_CACHE() { return SKIN_CACHE; },
    get charSkin() { return charSkin; },
    loadCharSkins,
    get LVL_NAMES() { return LVL_NAMES; },
    aiParams,
    get BOT_NAMES() { return BOT_NAMES; },
    get SHIRTS() { return SHIRTS; },
    get G() { return G; },
    get Fighter() { return Fighter; },
    get enemiesOf() { return enemiesOf; },
    get chestOf() { return chestOf; },
    front,
    get involvesPlayerNear() { return involvesPlayerNear; },
    get FX() { return FX; },
    get FRAME_HEALTH() { return FRAME_HEALTH; },
    reportFrameError,
    frameTask,
    cancelFailedAction,
    removeFx,
    drawFrameSafely,
    graphicsRecoveryStatus,
    addFx,
    trackSkillObj,
    clearSkillObjs,
    updateFx,
    get ADD() { return ADD; },
    glowMat,
    ringAt,
    sphereFlash,
    slashLine,
    get STAR_GEO() { return STAR_GEO; },
    impactStar,
    arcSlash,
    ghost,
    warnCircle,
    fireColumn,
    iceSpikes,
    iceBlock,
    get IMPACT() { return IMPACT; },
    impactFrame,
    get SPARK_GEO() { return SPARK_GEO; },
    sparkLines,
    get CRACK_TEX() { return CRACK_TEX; },
    crackDecal,
    get AURA_TEX() { return AURA_TEX; },
    updateAura,
    lightColumn,
    copiesAround,
    screenFlash,
    shakeFrom,
    get DN() { return DN; },
    toScreen,
    popText,
    comicPop,
    updateNums,
    get AUDIO_LEVELS() { return AUDIO_LEVELS; },
    get gameAudioBus() { return gameAudioBus; }, set gameAudioBus(v) { gameAudioBus = v; },
    get ambientAudioBus() { return ambientAudioBus; }, set ambientAudioBus(v) { ambientAudioBus = v; },
    get voicesAudioBus() { return voicesAudioBus; }, set voicesAudioBus(v) { voicesAudioBus = v; },
    get HTML_AUDIO_LEVELS() { return HTML_AUDIO_LEVELS; },
    get ACTIVE_DIALOGUE() { return ACTIVE_DIALOGUE; },
    get VOICE_PACKS() { return VOICE_PACKS; },
    get VOICE_DUR() { return VOICE_DUR; },
    get AUDIO_CFG() { return AUDIO_CFG; },
    get musFile() { return musFile; },
    get CHAR_SOUND_DIR() { return CHAR_SOUND_DIR; },
    charSoundDirs,
    charSoundRel,
    get ultMusicRel() { return ultMusicRel; },
    voiceRel,
    get sndUrl() { return sndUrl; },
    get VOICE_EVENTS() { return VOICE_EVENTS; },
    get voiceEv() { return voiceEv; },
    get SKILL_VOICE() { return SKILL_VOICE; },
    get VOICE_DEFS() { return VOICE_DEFS; },
    get JAVI_VOICES() { return JAVI_VOICES; },
    get CLIPPY_VOICES() { return CLIPPY_VOICES; },
    get CLIPPY_VOICE_FILES() { return CLIPPY_VOICE_FILES; },
    get JAVI_VOICE_FILES() { return JAVI_VOICE_FILES; },
    get JAVI_VOICE_KEYS() { return JAVI_VOICE_KEYS; },
    get CHARACTER_VOICE_FILES() { return CHARACTER_VOICE_FILES; },
    get CHARACTER_VOICE_KEYS() { return CHARACTER_VOICE_KEYS; },
    get CHARACTER_VOICE_META() { return CHARACTER_VOICE_META; },
    get CHARACTER_VOICE_DURATION() { return CHARACTER_VOICE_DURATION; },
    get characterVoiceSequence() { return characterVoiceSequence; }, set characterVoiceSequence(v) { characterVoiceSequence = v; },
    characterVoiceVolume,
    characterVoiceState,
    stopCharacterVoice,
    resetCharacterVoice,
    playCharacterClip,
    javiSpeak,
    javiActivateVoice,
    updateCharacterVoices,
    get MENU_VOICE() { return MENU_VOICE; }, set MENU_VOICE(v) { MENU_VOICE = v; },
    stopMenuVoice,
    menuVoice,
    characterVoicePresence,
    receiveCharacterVoice,
    clippySpeak,
    get GAME_RECORDINGS() { return GAME_RECORDINGS; },
    soundCategory,
    soundChannel,
    syncAudioControls,
    refreshHtmlAudio,
    releaseHtmlAudio,
    trackHtmlAudio,
    playTrackedAudio,
    playHtmlEffect,
    applyAudioLevels,
    setAudioLevel,
    saveAudioLevels,
    setPauseView,
    get SETTINGS_EXT() { return SETTINGS_EXT; }, set SETTINGS_EXT(v) { SETTINGS_EXT = v; },
    openSettings,
    closeSettings,
    initPauseAudioControls,
    get AC() { return AC; }, set AC(v) { AC = v; },
    get master() { return master; }, set master(v) { master = v; },
    get NB() { return NB; }, set NB(v) { NB = v; },
    get uwFilter() { return uwFilter; }, set uwFilter(v) { uwFilter = v; },
    get audioCompressor() { return audioCompressor; }, set audioCompressor(v) { audioCompressor = v; },
    resumeAudioContext,
    initAudio,
    spatialPan,
    connectSpatial,
    connectOneShot,
    playBufferSound,
    nz,
    tone,
    get UI_SFX() { return UI_SFX; },
    get SFX_RAW() { return SFX_RAW; }, set SFX_RAW(v) { SFX_RAW = v; },
    get SFX_FORCE() { return SFX_FORCE; }, set SFX_FORCE(v) { SFX_FORCE = v; },
    get SFX_CD() { return SFX_CD; },
    get SFXF() { return SFXF; },
    sfxFile,
    sfx,
    get MUS() { return MUS; },
    get MUSIC_TRIM() { return MUSIC_TRIM; },
    get musicTrim() { return musicTrim; },
    get makeMusicTrack() { return makeMusicTrack; },
    get musicPlay() { return musicPlay; },
    get musicNextFight() { return musicNextFight; },
    get fadeAudioTrack() { return fadeAudioTrack; },
    get dialogueAudible() { return dialogueAudible; },
    get updateMusic() { return updateMusic; },
    get ULT_MUS() { return ULT_MUS; },
    get ultMusicPreload() { return ultMusicPreload; },
    get ultMusic() { return ultMusic; },
    get musicKick() { return musicKick; },
    get toggleMusic() { return toggleMusic; },
    get SND_LIST() { return SND_LIST; },
    get SND() { return SND; },
    get preloadSounds() { return preloadSounds; },
    get loadSounds() { return loadSounds; },
    get playSnd() { return playSnd; },
    get AMB() { return AMB; },
    get AMB_KIND() { return AMB_KIND; },
    get AMB_LAYERS() { return AMB_LAYERS; },
    get initAmbience() { return initAmbience; },
    get updateBeach() { return updateBeach; },
    get updateAmbience() { return updateAmbience; },
    get TIMERS() { return TIMERS; },
    get later() { return later; },
    startAction,
    updateAction,
    counterHit,
    netHit,
    applyHit,
    startRagdoll,
    hitArea,
    explode,
    segDist,
    freeze,
    kill,
    respawn,
    get cam() { return cam; },
    softLock,
    aimYawFor,
    findTarget,
    fistFx,
    get M1() { return M1; },
    twirlAngle,
    get startTwirl() { return startTwirl; },
    startFlourish,
    doM1,
    javiStrikeFx,
    javiMotionFx,
    stabFx,
    drawSpear,
    prepWeapon,
    spawnSpearProj,
    get L2W() { return L2W; },
    hermArr,
    choreBegin,
    choreRelease,
    choreEnd,
    syncChorePose,
    cineRibbon,
    solveR6Contact,
    r6FacingAt,
    r6RootAt,
    r6GaitPath,
    r6TravelAt,
    r6PlantAt,
    r6Stride,
    r6Acting,
    r6RunningFeet,
    r6Stake,
    contactWeight,
    poseChest,
    moveContactPart,
    choreContacts,
    choreTick,
    anchorPoint,
    choreAnchor,
    choreEvent,
    choreFx,
    get headPos() { return headPos; },
    get CHK_CAM() { return CHK_CAM; },
    get CAMFX() { return CAMFX; },
    camPunch,
    updateCamFx,
    choreShots,
    cineFramePoints,
    fitBoth,
    choreCam,
    runChore,
    get CHORE() { return CHORE; },
    get IMPALE_VARIANTS() { return IMPALE_VARIANTS; },
    createR6Impale,
    get STY() { return STY; },
    styleFx,
    get ZONES() { return ZONES; },
    makeZone,
    get ZONE_PART() { return ZONE_PART; },
    updateZones,
    copyAt,
    pullHit,
    decoy,
    fallingSpear,
    get MOVES() { return MOVES; },
    get PROJ() { return PROJ; },
    get JAVI_SPEARS() { return JAVI_SPEARS; },
    get SPEAR_BODY_PARTS() { return SPEAR_BODY_PARTS; },
    spearActorId,
    spearActor,
    get bfInput() { return bfInput; },
    get bfFx() { return bfFx; },
    get bfStrike() { return bfStrike; },
    get loseSpear() { return loseSpear; },
    get ownsMissingSpear() { return ownsMissingSpear; },
    get spearVector() { return spearVector; },
    get validSpearRecord() { return validSpearRecord; },
    get copySpearBody() { return copySpearBody; },
    get spearBodyPose() { return spearBodyPose; },
    get restoreSpearBodyPose() { return restoreSpearBodyPose; },
    get spearDropPoint() { return spearDropPoint; },
    get retireLoyalSpear() { return retireLoyalSpear; },
    get removeSpearDrop() { return removeSpearDrop; },
    get releaseOwnerSpear() { return releaseOwnerSpear; },
    get createSpearBlood() { return createSpearBlood; },
    get updateSpearBlood() { return updateSpearBlood; },
    get createSpearDrop() { return createSpearDrop; },
    get confirmSpearFinisher() { return confirmSpearFinisher; },
    get loyalSpearHit() { return loyalSpearHit; },
    get recoverJaviSpear() { return recoverJaviSpear; },
    get serializeLostSpear() { return serializeLostSpear; },
    get spearReceiptList() { return spearReceiptList; },
    get synchronizeSpearDrops() { return synchronizeSpearDrops; },
    get updateSpearDrops() { return updateSpearDrops; },
    get clearSpearDrops() { return clearSpearDrops; },
    get missingSpearHint() { return missingSpearHint; },
    get spawnProj() { return spawnProj; },
    get updateProj() { return updateProj; },
    get updLoyal() { return updLoyal; },
    get DEST_DEFAULT() { return DEST_DEFAULT; },
    get skillFolderName() { return skillFolderName; },
    skillSound,
    useSkill,
    useUlt,
    runUlt,
    startCine,
    updateCine,
    javiCineFx,
    miniCut,
    get keys() { return keys; },
    get TITLE() { return TITLE; },
    get ABY() { return ABY; },
    get ABY_COR() { return ABY_COR; },
    get ABY_PTS() { return ABY_PTS; },
    get applyHit() { return applyHit; },
    get ABY_WP() { return ABY_WP; },
    abyPath,
    get triggerSeaEvent() { return triggerSeaEvent; },
    get SEA_EVENTS() { return SEA_EVENTS; },
    get krakenBlocked() { return krakenBlocked; },
    get SOC() { return SOC; },
    get ACCT() { return ACCT; },
    get DEV() { return DEV; },
    get socialLoad() { return socialLoad; },
    get acctLoad() { return acctLoad; },
    abyssClamp,
    get BINDS() { return BINDS; },
    bindKeyLabel,
    get pressed() { return pressed; },
    get mouse() { return mouse; },
    get SEKZA_R() { return SEKZA_R; },
    onSekzaBeach,
    canSekzaSpecial,
    sekzaSpecialKey,
    startSekzaFlight,
    stopSekzaFlight,
    sekzaFlightControl,
    gullTargetId,
    gullTargetById,
    sekzaGullTargets,
    summonSekzaGulls,
    updateSekzaSpecials,
    clearSekzaFlocks,
    updateSekzaSpecialHud,
    playerCtl,
    pickTarget,
    get inRange() { return inRange; },
    get _sg() { return _sg; },
    _slab,
    citySegment,
    get CITY_NAV() { return CITY_NAV; },
    rebuildCityNav,
    get NAVBUF() { return NAVBUF; },
    get NAV_DIRS() { return NAV_DIRS; },
    cityRoute,
    citySteer,
    aiCtl,
    get seqHud() { return seqHud; },
    get seqEnd() { return seqEnd; },
    get seqCancel() { return seqCancel; },
    get seqStart() { return seqStart; },
    get seqTick() { return seqTick; },
    get laserLeg() { return laserLeg; },
    get clampArena() { return clampArena; },
    get applyCtl() { return applyCtl; },
    splashFx,
    get UW() { return UW; },
    updateUnderwater,
    get CULL() { return CULL; },
    cityCull,
    get SEA() { return SEA; },
    buildSeaWorld,
    get updateSea() { return updateSea; },
    seaBounds,
    physics,
    updateElevatorDoors,
    updateElevator,
    ndt,
    poisonOn,
    tickTimers,
    animate,
    buildSkillBar,
    showBanner,
    addFeed,
    addFeedText,
    pushFeed,
    pingOf,
    pingCell,
    get ROOM_UI() { return ROOM_UI; },
    get PROFILE_MAX() { return PROFILE_MAX; },
    get PROFILE_IMAGE_MAX() { return PROFILE_IMAGE_MAX; },
    get profileName() { return profileName; },
    cleanPublicProfile,
    localPublicProfile,
    get publicBannerSource() { return publicBannerSource; }, set publicBannerSource(v) { publicBannerSource = v; },
    get publicBannerData() { return publicBannerData; }, set publicBannerData(v) { publicBannerData = v; },
    get profileShareTicket() { return profileShareTicket; }, set profileShareTicket(v) { profileShareTicket = v; },
    netShareProfile,
    receivePublicProfile,
    get roomBotKeys() { return roomBotKeys; },
    get roomBotSequence() { return roomBotSequence; }, set roomBotSequence(v) { roomBotSequence = v; },
    roomEntries,
    rawEntryProfile,
    entryProfile,
    profileAvatar,
    profileButton,
    scoreTable,
    roomInputBlocked,
    roomClearInput,
    setRoomBoard,
    refreshRoomBoard,
    profileCardContent,
    profileCardStats,
    profileCareerStats,
    playerProfileBuild,
    playerProfileOpen,
    playerProfileClose,
    updateHUD,
    get LC() { return LC; },
    get LG() { return LG; },
    sizeLines,
    get linesDrawn() { return gfxPost.linesDrawn; }, set linesDrawn(v) { gfxPost.linesDrawn = v; },
    get composer() { return composer; }, set composer(v) { composer = v; },
    get renderPass() { return renderPass; }, set renderPass(v) { renderPass = v; },
    get bloomPass() { return bloomPass; }, set bloomPass(v) { bloomPass = v; },
    get caPass() { return caPass; }, set caPass(v) { caPass = v; },
    get gradePass() { return gradePass; }, set gradePass(v) { gradePass = v; },
    initPostProcessing,
    get GFX_LIMIT() { return GFX_LIMIT; },
    get GFX_CFG() { return GFX_CFG; },
    get GFX() { return GFX; },
    gfxSyncUI,
    gfxSave,
    gfxApply,
    gfxApplyPreset,
    gfxSet,
    get gfxAutoLevel() { return gfxAutoLevel; },
    gfxInit,
    gfxWatch,
    get PERF_FRAME() { return PERF_FRAME; },
    performanceDecorations,
    renderView,
    get PCAMS() { return PCAMS; },
    get PANEL_CUTS() { return PANEL_CUTS; },
    renderPanels,
    drawPanelBorders,
    renderMain,
    drawLines,
    get CONTACT_SHADOW_TEX() { return CONTACT_SHADOW_TEX; },
    get CONTACT_SHADOW_MAT() { return CONTACT_SHADOW_MAT; },
    updateContactShadow,
    get AURA_GEO() { return AURA_GEO; },
    updateAwakeningAura,
    animeDustRing,
    animeDashSmoke,
    updateCamera,
    get SH() { return SH; },
    get drawBackdrop() { return drawBackdrop; },
    get showSelect() { return showSelect; },
    get updateShow() { return updateShow; },
    clearFighters,
    applyAiLevels,
    spawnBots,
    startMatch,
    toMenu,
    endMatch,
    autoBalance,
    get canvas() { return canvas; },
    get locked() { return locked; }, set locked(v) { locked = v; },
    get lockFailed() { return lockFailed; }, set lockFailed(v) { lockFailed = v; },
    requestLock,
    unlock,
    setPause,
    get slTap() { return slTap; }, set slTap(v) { slTap = v; },
    toggleShiftLock,
    get TOUCH() { return TOUCH; },
    touchActive,
    touchReset,
    touchUpdate,
    touchInit,
    get TOUCH_LAYOUT_KEY() { return TOUCH_LAYOUT_KEY; },
    get touchEdit() { return touchEdit; }, set touchEdit(v) { touchEdit = v; },
    get touchDrag() { return touchDrag; }, set touchDrag(v) { touchDrag = v; },
    get touchPositions() { return touchPositions; }, set touchPositions(v) { touchPositions = v; },
    touchItem,
    touchApplyLayout,
    touchEditMode,
    touchLayoutSetup,
    get sebFlurry() { return sebFlurry; },
    get VW() { return VW; },
    get CHORE_OWNER() { return CHORE_OWNER; },
    get CHORE_NAME() { return CHORE_NAME; },
    get SHOT_ES() { return SHOT_ES; },
    get openViewer() { return openViewer; },
    get closeViewer() { return closeViewer; },
    get vLoad() { return vLoad; },
    get vReset() { return vReset; },
    get vRestart() { return vRestart; },
    get vTick() { return vTick; },
    get vInfo() { return vInfo; },
    get vSeek() { return vSeek; },
    get vSetPlay() { return vSetPlay; },
    get vTogglePlay() { return vTogglePlay; },
    get vSetFree() { return vSetFree; },
    get NET() { return NET; },
    get r2() { return r2; },
    get _tp() { return _tp; },
    netAct,
    netInit,
    get RELAYS() { return RELAYS; },
    get ST_BASE() { return ST_BASE; },
    get ST_OWNER_H() { return ST_OWNER_H; },
    get ST() { return ST; },
    get stDay() { return stDay; },
    stLoad,
    stSave,
    stDy,
    stC,
    get stCount() { return stCount; },
    stClients,
    stPub,
    stPush,
    stForget,
    statsMatch,
    statsEnd,
    statsKill,
    statsUlt,
    get OW() { return OW; },
    stHash,
    get PROP_DIMS() { return PROP_DIMS; },
    get ME() { return ME; },
    get meSnap() { return meSnap; },
    get meRestore() { return meRestore; },
    get mePush() { return mePush; },
    get meUndo() { return meUndo; },
    get meRedo() { return meRedo; },
    get meInitMeshes() { return meInitMeshes; },
    get meBuildGizmo() { return meBuildGizmo; },
    get meUpdateGizmo() { return meUpdateGizmo; },
    get meUpdateCam() { return meUpdateCam; },
    get meFocus() { return meFocus; },
    get meRect() { return meRect; },
    get meHit() { return meHit; },
    get meW2S() { return meW2S; },
    get meS2W() { return meS2W; },
    get meDraw() { return meDraw; },
    get meList() { return meList; },
    get meProps() { return meProps; },
    get meSelect() { return meSelect; },
    get meDelete() { return meDelete; },
    get meDup() { return meDup; },
    get meRotate() { return meRotate; },
    get meMsg() { return meMsg; },
    get meExportJSON() { return meExportJSON; },
    get meSrv() { return meSrv; },
    get meSave() { return meSave; },
    get meReset() { return meReset; },
    get meBuild() { return meBuild; },
    get meFit() { return meFit; },
    get meOpen() { return meOpen; },
    get meClose() { return meClose; },
    get uiDialog() { return uiDialog; },
    get uiPrompt() { return uiPrompt; },
    get uiConfirm() { return uiConfirm; },
    get uiAlert() { return uiAlert; },
    get SFX_NAMES() { return SFX_NAMES; },
    get AE_ACTIONS() { return AE_ACTIONS; },
    get AE_LABEL() { return AE_LABEL; },
    get aeLabel() { return aeLabel; },
    get AE() { return AE; },
    get aeDef() { return aeDef; },
    get aeClone() { return aeClone; },
    get aeSrv() { return aeSrv; },
    get aeEvents() { return aeEvents; },
    get aeClips() { return aeClips; },
    get aeActionsOf() { return aeActionsOf; },
    get aeItems() { return aeItems; },
    get aeStop() { return aeStop; },
    get aePlay() { return aePlay; },
    get aeMsg() { return aeMsg; },
    get aeRender() { return aeRender; },
    get aeLs() { return aeLs; },
    get aeSlider() { return aeSlider; },
    get aeDetail() { return aeDetail; },
    get aeDecodeDur() { return aeDecodeDur; },
    get aeUpload() { return aeUpload; },
    get aeSave() { return aeSave; },
    get aeBuild() { return aeBuild; },
    get aeOpen() { return aeOpen; },
    get aeClose() { return aeClose; },
    get DEV() { return DEV; },
    devHash,
    devApply,
    devUnlock,
    devLock,
    ownerOpen,
    ownerClose,
    ownerConnect,
    ownerUI,
    ownerRender,
    get ACCT() { return ACCT; },
    get ACCT_ERR() { return ACCT_ERR; },
    get acctMsg() { return acctMsg; },
    get acctErr() { return acctErr; },
    get acctRefreshVerified() { return acctRefreshVerified; },
    get acctSha() { return acctSha; },
    get acctChanged() { return acctChanged; },
    get PROFILE_THEMES() { return PROFILE_THEMES; },
    get PROFILE_AURAS() { return PROFILE_AURAS; },
    get PROFILE_STICKERS() { return PROFILE_STICKERS; },
    get PROFILE_FRAMES() { return PROFILE_FRAMES; },
    get PROFILE_EFFECTS() { return PROFILE_EFFECTS; },
    get cleanProfileDecor() { return cleanProfileDecor; },
    get PROFILE_MAP_BANNERS() { return PROFILE_MAP_BANNERS; },
    get profileText() { return profileText; },
    get compactProfileImage() { return compactProfileImage; },
    get cleanCosmetics() { return cleanCosmetics; },
    get cosmeticKey() { return cosmeticKey; },
    get cosmeticsGet() { return cosmeticsGet; },
    get avatarGet() { return avatarGet; },
    get cosmeticSave() { return cosmeticSave; },
    get stickerNode() { return stickerNode; },
    get bannerDecals() { return bannerDecals; },
    get enableDecalDrag() { return enableDecalDrag; },
    get decorateProfile() { return decorateProfile; },
    get drawMapBanner() { return drawMapBanner; },
    get uploadProfileAvatar() { return uploadProfileAvatar; },
    get acctCustomize() { return acctCustomize; },
    get BANNERS() { return BANNERS; },
    get BN_CACHE() { return BN_CACHE; },
    get bannerDraw() { return bannerDraw; },
    get bannerKey() { return bannerKey; },
    get bannerGet() { return bannerGet; },
    get bannerSet() { return bannerSet; },
    get bannerURL() { return bannerURL; },
    get acctPaint() { return acctPaint; },
    get acctGate() { return acctGate; },
    get acctBannerPick() { return acctBannerPick; },
    get acctBuild() { return acctBuild; },
    get acctClose() { return acctClose; },
    get acctOpen() { return acctOpen; },
    get acctRender() { return acctRender; },
    get SOC() { return SOC; },
    get validAccountId() { return validAccountId; },
    get socialStamp() { return socialStamp; },
    get socialPair() { return socialPair; },
    get socialWait() { return socialWait; },
    get socialError() { return socialError; },
    get socialReset() { return socialReset; },
    get socialAuthChanged() { return socialAuthChanged; },
    get socialSaveProfile() { return socialSaveProfile; },
    get socialPublishSession() { return socialPublishSession; },
    get socialWatchRole() { return socialWatchRole; },
    get socialCheckEntry() { return socialCheckEntry; },
    get socialGetProfile() { return socialGetProfile; },
    get socialEntryUid() { return socialEntryUid; },
    get roleOfEntry() { return roleOfEntry; },
    get roleBadge() { return roleBadge; },
    get socialDecorateIdentity() { return socialDecorateIdentity; },
    get socialRefreshVisible() { return socialRefreshVisible; },
    get socialSetRole() { return socialSetRole; },
    get socialProfileActions() { return socialProfileActions; },
    get socialRequire() { return socialRequire; },
    get socialRequest() { return socialRequest; },
    get socialLinkAction() { return socialLinkAction; },
    get socialBlock() { return socialBlock; },
    get dmDrafts() { return dmDrafts; },
    get dmDraftKey() { return dmDraftKey; },
    get dmSaveDraft() { return dmSaveDraft; },
    get dmCount() { return dmCount; },
    get socialChatStop() { return socialChatStop; },
    get socialChat() { return socialChat; },
    get socialSend() { return socialSend; },
    get socialBuild() { return socialBuild; },
    get socialBadge() { return socialBadge; },
    get socialStatus() { return socialStatus; },
    get socialOpen() { return socialOpen; },
    get socialClose() { return socialClose; },
    get socialRender() { return socialRender; },
    get socialRenderMessages() { return socialRenderMessages; },
    get socialViewAccount() { return socialViewAccount; },
    get socialTick() { return socialTick; },
    get friendsButton() { return friendsButton; },
    get ownerHash() { return ownerHash; },
    isOwnerBetaAllowed,
    getOwnerBeta,
    setOwnerBeta,
    syncOwnerBeta,
    get HUMAN_ID() { return HUMAN_ID; },
    get RTC_CFG() { return RTC_CFG; },
    rtcMesh,
    acceptState,
    sendPresence,
    relayRoom,
    localRoom,
    netSkin,
    netShareSkin,
    inviteLink,
    cleanCode,
    get joinP() { return joinP; }, set joinP(v) { joinP = v; },
    get joinCode() { return joinCode; }, set joinCode(v) { joinCode = v; },
    joinRoom,
    get NET_ERR() { return NET_ERR; },
    doJoin,
    renderNetStatus,
    renderLobby,
    netMenuPresence,
    netSendPlay,
    presenceOf,
    sanePr,
    cheatOf,
    cheatStrike,
    applyNetHit,
    replayAct,
    removeProxy,
    get NET_OLD() { return NET_OLD; },
    netInterp,
    proxyUpdate,
    get _dbgT() { return _dbgT; }, set _dbgT(v) { _dbgT = v; },
    netDebug,
    netTick,
    get RULES_DEF() { return RULES_DEF; },
    rulesClean,
    rulesSave,
    rulesStart,
    rulesPulse,
    rulesApply,
    netRulesSync,
    rulesHostPulse,
    rulesUISync,
    rulesUI,
    get DUMMY_NAMES() { return DUMMY_NAMES; },
    get dummies() { return dummies; },
    amHost,
    get panelAllowed() { return panelAllowed; },
    canUsePanel,
    spawnDummy,
    clearDummies,
    dummyCtl,
    togglePanel,
    get ED() { return ED; },
    get ED_BONES() { return ED_BONES; },
    get ED_KIND() { return ED_KIND; },
    get ED_ROT() { return ED_ROT; },
    get edBoneOf() { return edBoneOf; },
    get edKindOf() { return edKindOf; },
    get edAxis() { return edAxis; },
    get edDef() { return edDef; },
    get edDeg() { return edDeg; },
    get edShow() { return edShow; },
    get edUnshow() { return edUnshow; },
    get edBack() { return edBack; },
    get edElastic() { return edElastic; },
    get edBounceOut() { return edBounceOut; },
    get ED_EASE() { return ED_EASE; },
    get ED_EASE_ES() { return ED_EASE_ES; },
    get edEase() { return edEase; },
    get edBezier() { return edBezier; },
    get edDR() { return edDR; },
    get edNoise() { return edNoise; },
    get ED_FN() { return ED_FN; },
    get ED_CACHE() { return ED_CACHE; },
    get edCompile() { return edCompile; },
    get edRun() { return edRun; },
    get edKeyVal() { return edKeyVal; },
    get edEvalChan() { return edEvalChan; },
    get edFromGame() { return edFromGame; },
    get edCompileClip() { return edCompileClip; },
    get edSnap() { return edSnap; },
    get edPush() { return edPush; },
    get edPoint() { return edPoint; },
    get edRestoreSnap() { return edRestoreSnap; },
    get edUndo() { return edUndo; },
    get edRedo() { return edRedo; },
    get edMsg() { return edMsg; },
    get edLoadSaved() { return edLoadSaved; },
    get edSaveGame() { return edSaveGame; },
    get edStore() { return edStore; },
    get edDup() { return edDup; },
    get edDelClip() { return edDelClip; },
    get edRefOptions() { return edRefOptions; },
    get edRefSet() { return edRefSet; },
    get edRefFile() { return edRefFile; },
    get edRefUse() { return edRefUse; },
    get edRefStart() { return edRefStart; },
    get edRefStop() { return edRefStop; },
    get edRestore() { return edRestore; },
    get edExport() { return edExport; },
    get edImportFile() { return edImportFile; },
    get ED_SETS() { return ED_SETS; },
    get edPair() { return edPair; },
    get edLoadObj() { return edLoadObj; },
    get edOpenClip() { return edOpenClip; },
    get edSetTarget() { return edSetTarget; },
    get edMakeVic() { return edMakeVic; },
    get edLen() { return edLen; },
    get edVicDispose() { return edVicDispose; },
    get edVicBuild() { return edVicBuild; },
    get ED_ZERO() { return ED_ZERO; },
    get ED_DEFPATH() { return ED_DEFPATH; },
    get edPath() { return edPath; },
    get edRebuild() { return edRebuild; },
    get edOpen() { return edOpen; },
    get edComicInit() { return edComicInit; },
    get edClose() { return edClose; },
    get edBuild() { return edBuild; },
    get edKey() { return edKey; },
    get edTree() { return edTree; },
    get edTimeSnap() { return edTimeSnap; },
    get edKeysOf() { return edKeysOf; },
    get edSetKey() { return edSetKey; },
    get edAddKeys() { return edAddKeys; },
    get edRebuildPartial() { return edRebuildPartial; },
    get edDelSel() { return edDelSel; },
    get edCopy() { return edCopy; },
    get edPaste() { return edPaste; },
    get ED_INTERPS() { return ED_INTERPS; },
    get edProps() { return edProps; },
    get edBindProps() { return edBindProps; },
    get ED_LW() { return ED_LW; },
    get ED_ROW() { return ED_ROW; },
    get edBindTimeline() { return edBindTimeline; },
    get edSelAll() { return edSelAll; },
    get edDraw() { return edDraw; },
    get edLoop() { return edLoop; },
    get edShowFrame() { return edShowFrame; },
    bustPortrait,
    get CHAR_RANK() { return CHAR_RANK; },
    renderRoster,
    setCustomSkin,
    openTab,
    get PUB() { return PUB; },
    get NETPUB() { return NETPUB; },
    pubWatch,
    pubRender,
    pubStop,
    pubStart,
    get TM() { return TM; },
    get tmMsg() { return tmMsg; },
    tmView,
    tmOpen,
    tmClose,
    tmGo,
    tmEnter,
    get tmJoin() { return tmJoin; },
    tmWire,
    get inRoomNow() { return inRoomNow; },
    leaveAsk,
    leaveDo,
    setMode,
    get lvlLabel() { return lvlLabel; },
    saveCfg,
    get TITLE() { return TITLE; },
    titleAudio,
    titleStart,
    titleBuild,
    titleFinish,
    titleLeave,
    sekzaTarget,
    startTitleTowerFall,
    poseTitleTower,
    updateTitleTowerFall,
    get bez() { return bez; },
    titleSky,
    sekzaBoom,
    titleSekzaStart,
    get cmSpawn() { return cmSpawn; },
    get cmReset() { return cmReset; },
    get EZ() { return EZ; },
    get cmKeys() { return cmKeys; },
    get cmRun() { return cmRun; },
    get cmWalk2() { return cmWalk2; },
    get cmSneak() { return cmSneak; },
    get cmPlace() { return cmPlace; },
    get CM_W() { return CM_W; },
    get CM_E() { return CM_E; },
    get smoothK() { return smoothK; },
    get cmVisible() { return cmVisible; },
    get cmOff() { return cmOff; },
    get cmGo() { return cmGo; },
    get legT() { return legT; },
    get cmStage() { return cmStage; },
    get TITLE_LIFT() { return TITLE_LIFT; },
    get TITLE_THROW() { return TITLE_THROW; },
    get startTitleRepair() { return startTitleRepair; },
    get finishTitleRepair() { return finishTitleRepair; },
    get updateTitleRepair() { return updateTitleRepair; },
    get titleRepairCamera() { return titleRepairCamera; },
    get CAMEOS() { return CAMEOS; },
    get ghostTrail() { return ghostTrail; },
    get CAMEO_IDS() { return CAMEO_IDS; },
    get titleCameo() { return titleCameo; },
    get cameoEnd() { return cameoEnd; },
    get titleSekzaEnd() { return titleSekzaEnd; },
    get bangSprite() { return bangSprite; },
    get outBack() { return outBack; },
    titleUpdate,
    step,
    get last() { return last; }, set last(v) { last = v; },
    get VBC() { return VBC; },
    get VB() { return VB; },
    get VB_PADS() { return VB_PADS; },
    get VB_NEUTRAL() { return VB_NEUTRAL; },
    get vbOther() { return vbOther; },
    get vbInit() { return vbInit; },
    get vbHud() { return vbHud; },
    get vbBox() { return vbBox; },
    get vbNames() { return vbNames; },
    get vbScoreHud() { return vbScoreHud; },
    get vbSpot() { return vbSpot; },
    get vbPlace() { return vbPlace; },
    get vbServe() { return vbServe; },
    get vbStart() { return vbStart; },
    get vbSpawnBot() { return vbSpawnBot; },
    get vbEnd() { return vbEnd; },
    get vbHitBall() { return vbHitBall; },
    get vbPointFx() { return vbPointFx; },
    get vbPoint() { return vbPoint; },
    get vbOver() { return vbOver; },
    get vbPin() { return vbPin; },
    get vbSim() { return vbSim; },
    get vbGuest() { return vbGuest; },
    get vbPub() { return vbPub; },
    get vbPubHit() { return vbPubHit; },
    get vbPlayerCtl() { return vbPlayerCtl; },
    get vbPredict() { return vbPredict; },
    get vbBotCtl() { return vbBotCtl; },
    get vbLobby() { return vbLobby; },
    get updateVolley() { return updateVolley; },
    get MM() { return MM; },
    get mmX() { return mmX; },
    get mmZ() { return mmZ; },
    get mmBackground() { return mmBackground; },
    get mmDraw() { return mmDraw; },
    get CB() { return CB; },
    get GS() { return GS; },
    get NEUTRAL() { return NEUTRAL; },
    get when() { return when; },
    get CB_BASIC() { return CB_BASIC; },
    get SK_REST() { return SK_REST; },
    get SK_TIPS() { return SK_TIPS; },
    get SK_TAG() { return SK_TAG; },
    get SK_ULT_TAGS() { return SK_ULT_TAGS; },
    get n1() { return n1; },
    get skFacts() { return skFacts; },
    get curChar() { return curChar; },
    get guideNums() { return guideNums; },
    get GS_Y() { return GS_Y; },
    get guideStage() { return guideStage; },
    get guideEnter() { return guideEnter; },
    get guideWipe() { return guideWipe; },
    get guideBuild() { return guideBuild; },
    get guideNet() { return guideNet; },
    get guideCam() { return guideCam; },
    get guideTick() { return guideTick; },
    get guideLeave() { return guideLeave; },
    get guideBlit() { return guideBlit; },
    get guidePost() { return guidePost; },
    get guideFrame() { return guideFrame; },
    get guideFit() { return guideFit; },
    get SKB() { return SKB; },
    get skGroups() { return skGroups; },
    get skEntry() { return skEntry; },
    get skRender() { return skRender; },
    get skSelect() { return skSelect; },
    get skPickChar() { return skPickChar; },
    get skGrid() { return skGrid; },
    get cbSelect() { return cbSelect; },
    get bookBasic() { return bookBasic; },
    get bookTab() { return bookTab; },
    get bookOpen() { return bookOpen; },
    get bookClose() { return bookClose; },
    get FPS() { return FPS; },
    fpsTick,
    updateGodRays,
    loop,
    guideSpec,
  };
  return new Proxy(api, { has: (t, k) => typeof k === 'string' && k in t, get: (t, k) => k === Symbol.unscopables ? undefined : t[k], set: (t, k, v) => { t[k] = v; return true; } });
})();
for (const fn of (window.CF_COREOGRAFIAS || [])) fn(CF_A);   // js/habilidades.js se carga antes y deja aqui sus funciones; la lista no queda global
delete window.CF_COREOGRAFIAS;
/* CF_API_END */
// ===== Sala de cinemáticas: vive en js/ui/visor_cinematicas.js =====
const { CHORE_NAME, CHORE_OWNER, SHOT_ES, VW, closeViewer, openViewer, vInfo, vLoad, vReset, vRestart, vSeek, vSetFree, vSetPlay, vTick, vTogglePlay } = CF_UI.crearVisorCinematicas({ $, AWK, CAMFX, CHARS, CHAR_IDS, CHORE, DN, FX, Fighter, G, GATO_BB_DATA, IMPACT, IMPALE_VARIANTS, JAVI_BB_DATA, JOINTS, MOVES, PROJ, PS, RANDI_BB_DATA, RED_BB_DATA, RKT_BB_DATA, SEB_BB_DATA, SEK_BB_DATA, TIMERS, UKY_BB_DATA, ZONES, cam, choreEnd, choreShots, cineGrade, clearFighters, clearSkillObjs, endAction, endCamScript, groundAt, initAudio, jv, runChore, scene, sfx, stageExit, stancePose, toMenu, updateCamera, get DEV() { return DEV; }, get clearDummies() { return clearDummies; }, get step() { return step; } });

loadFaceLib(); feInit();

// ================= Multijugador con amigos (sala en tiempo real) =================
// Cada jugador simula solo a su personaje y publica su estado en su "presence";
// los golpes viajan dentro de ese estado y cada víctima se aplica el daño a sí misma.
const GAME_VERSION = '1.14.0';   // numero de version del juego (ver CHANGELOG.md): se manda en la presencia para avisar si dos jugadores tienen versiones distintas
window.CF_VERSION = GAME_VERSION;
// SERVIDOR GLOBAL: si la pagina esta en un sitio y el servidor de salas en otro (por ejemplo la pagina en Vercel y el servidor en Oracle),
// la direccion del servidor sale de config/servidor.js (window.CF_SERVIDOR) o de ?srv=https://... en el link. En localhost se usa el servidor local salvo que pongas ?srv=.
const SRV_BASE = (() => {
  try {
    const q = new URLSearchParams(location.search).get('srv'), local = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
    let u = (q || (local ? '' : window.CF_SERVIDOR) || '').trim().replace(/\/+$/, '');
    if (!/^https?:\/\/[A-Za-z0-9.\-]+(:\d+)?$/.test(u)) return '';
    return u === location.origin ? '' : u;
  } catch (e) { return ''; }
})();
const SRV_WS = SRV_BASE ? SRV_BASE.replace(/^http/, 'ws') : '';
const NET = { room: null, named: null, code: '', ready: false, skins: {}, known: new Set(), joinT: 0, dummySeq: 0, botSeq: 0, cfg: null, botHost: false, roomOpts: null, myPeer: null, proxies: new Map(), hitSeq: 0, hitsOut: [], actSeq: 0, act: null, ko: null, lastHit: {}, lastAct: {}, lastKo: {}, sendT: 0 };
const r2 = v => Math.round(v * 100) / 100;
const _tp = new V3();
// cada acción (habilidad, golpe básico, ulti...) lleva un número de secuencia y una clave de sesión. Se reenvían las de los últimos 1.6 s en cada paquete:
// si un paquete se pierde o dos acciones caen en el mismo instante, el otro jugador igual las recibe (antes solo viajaba la última)
NET.sess = Math.random().toString(36).slice(2, 8); NET.acts = [];
function netAct(a, f) {
  if (G.guide) return;
  if (f && f.roomBot) { const B = f.netActO || (f.netActO = { seq: 0, act: null, acts: [] }); a.s = ++B.seq; a.ss = NET.sess + f.netId; a.t = Date.now(); B.act = a; B.acts.push(a); if (B.acts.length > 10) B.acts.shift(); return; }   // acción de un bot: viaja con el bot
  a.s = ++NET.actSeq; a.ss = NET.sess; a.t = Date.now(); NET.act = a; NET.acts.push(a); if (NET.acts.length > 10) NET.acts.shift(); }
async function netInit() {
  // en claude.ai: sala del artifact; en cualquier otra web: conexión directa entre navegadores (PeerJS)
  try { if (window.claude && window.claude.use) NET.room = await window.claude.use('room'); } catch (e) { NET.room = null; }
  // si el juego se abrió desde el servidor local (server/server.js) se juega por él: más rápido y sin depender de internet
  if (!window.claude && /^https?:$/.test(location.protocol)) {   // si esta dirección responde /bs-server es un servidor del juego (local o público)
    try {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 1500), r = await fetch(SRV_BASE + '/bs-server', { cache: 'no-store', signal: ctl.signal }); clearTimeout(to);
      const j = r.ok && /json/.test(r.headers.get('content-type') || '') ? await r.json() : null;
      if (j && j.ok && j.name === 'blockstrike-server') { NET.local = true; NET.environmentServer=+j.atmosphere>=3; NET.room = 'relay'; NET.publicUrl = j.publicUrl || ''; NET.lanBase = j.ips && j.ips.length ? 'http://' + j.ips[0] + ':' + j.port : ''; }
    } catch (e) { }
  }
  if (!NET.room && !window.claude && window.mqtt) NET.room = 'relay';
  NET.ready = true; renderNetStatus();
  if (G.mode === 'mp' && NET.room && !NET.named && /^#sala-/.test(location.hash)) joinRoom();
}
// Sala por servidor intermedio público (MQTT sobre WebSocket): funciona detrás de cualquier router, sin anfitrión.
// Tiene la misma forma que la sala de claude.ai: peers(), presence(), onPeers(), leave().
// medido desde una conexión real: HiveMQ 0 % de pérdida (236 ms); EMQX perdía el 57 % de los paquetes, por eso va de respaldo
const RELAYS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'];
// ===== Estadísticas anónimas para el dueño del juego =====
// Cada navegador guarda un resumen propio (código al azar, sin nombre ni IP) como mensaje retenido en los relays MQTT
// y avisa cada 30 s que está conectado. El panel del dueño se suscribe a todos y los suma. Sin servidor propio:
// si un relay borra lo retenido, se vuelve a llenar con los que entren después.
const ST_BASE = 'calfight/st1/', ST_OWNER_H = '';
const ST = { id: '', d: null, on: true, owner: false, cl: [], push: 0 };
const stDay = () => Math.floor(Date.now() / 864e5);
function stLoad() {
  let o = null; try { o = JSON.parse(localStorage.getItem('bsb_st') || 'null'); ST.owner = localStorage.getItem('bsb_owner') === '1'; ST.on = localStorage.getItem('bsb_st_off') !== '1'; } catch (e) { }
  ST.id = o && /^s[a-z0-9]{8,}$/.test(o.id) ? o.id : 's' + Math.random().toString(36).slice(2, 12);
  ST.d = o && o.d && o.d.v === 1 ? o.d : { v: 1, f: stDay(), l: 0, s: 0, w: 0, dy: {}, c: {}, mo: [0, 0] };
}
function stSave() { try { localStorage.setItem('bsb_st', JSON.stringify({ id: ST.id, d: ST.d })); } catch (e) { } }
function stDy() {
  const t = stDay(), dy = ST.d.dy; if (!dy[t]) dy[t] = [0, 0, 0];
  for (const k in dy) if (+k < t - 120) delete dy[k];
  return dy[t];
}
function stC(id) { if (!CHARS[id]) return null; return ST.d.c[id] || (ST.d.c[id] = [0, 0, 0, 0, 0]); }   // elegido, ganadas, K.O., ultis, minutos
const stCount = () => ST.on && !ST.owner && !G.guide && !IS_GUIDE && !/[?&]nostats/.test(location.search);
function stClients(will) {
  if (ST.cl.length || !window.mqtt) return ST.cl;
  RELAYS.forEach((url, i) => {
    try {
      const o = { clientId: 'cfs_' + ST.id + '_' + i + '_' + Math.random().toString(36).slice(2, 6), clean: true, keepalive: 30, reconnectPeriod: 6000, connectTimeout: 8000 };
      if (will) o.will = { topic: ST_BASE + 'on/' + ST.id, payload: '', qos: 0, retain: true };   // al cerrar la pestaña se borra el "en línea"
      const c = mqtt.connect(url, o); c.on('error', () => { }); ST.cl.push(c);
    } catch (e) { }
  });
  return ST.cl;
}
function stPub(t, v) { for (const c of stClients(true)) { try { c.publish(ST_BASE + t + '/' + ST.id, v, { qos: 0, retain: true }); } catch (e) { } } }
function stPush(full) {
  if (!stCount()) return;
  ST.d.l = Date.now();
  stPub('on', JSON.stringify({ c: CHARS[G.charId] ? G.charId : '', s: G.state === 'play' ? 1 : 0, m: G.mp ? 1 : 0, t: Date.now() }));
  if (full !== false) stPub('u', JSON.stringify(ST.d));
}
function stForget() { stPub('u', ''); stPub('on', ''); }
function statsMatch(id, mp) { if (!stCount()) return; stDy()[1]++; const c = stC(id); if (c) c[0]++; ST.d.mo[mp ? 1 : 0]++; stSave(); stPush(); }
function statsEnd(won) { if (!stCount() || !G.player) return; if (won) { ST.d.w++; const c = stC(G.player.ch.id); if (c) c[1]++; } stSave(); stPush(); }
function statsKill() { if (!stCount() || !G.player) return; const c = stC(G.player.ch.id); if (c) c[2]++; }
function statsUlt(f) { if (!stCount()) return; const c = stC(f.ch.id); if (c) c[3]++; }
stLoad();
if (stCount()) { ST.d.s++; stDy()[0]++; stSave(); setTimeout(() => stPush(), 4000); }
setInterval(() => {
  if (!stCount()) return;
  if (G.state === 'play' && !G.paused && !G.viewer && !G.guide && !document.hidden) { stDy()[2] += .5; const c = G.player && stC(G.player.ch.id); if (c) c[4] += .5; stSave(); }
  if (document.hidden) return;
  stPush(++ST.push % 4 === 0);   // "en línea" cada 30 s, el resumen cada 2 min
}, 30000);
addEventListener('visibilitychange', () => { if (document.hidden && stCount()) { stSave(); stPush(); } });

// ---- panel del dueño ----
const OW = { u: new Map(), on: new Map(), cl: [], el: null, tm: 0 };
async function stHash(k) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(k)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
// ===== Editor de mapa (modo desarrollador): mover, rotar, duplicar y borrar modelos: vive en js/editores/editor_mapa.js =====
const { ME, PROP_DIMS, meBuild, meBuildGizmo, meClose, meDelete, meDraw, meDup, meExportJSON, meFit, meFocus, meHit, meInitMeshes, meList, meMsg, meOpen, meProps, mePush, meRect, meRedo, meReset, meRestore, meRotate, meS2W, meSave, meSelect, meSnap, meSrv, meUndo, meUpdateCam, meUpdateGizmo, meW2S } = CF_EDITORES.crearEditorMapa({ $, CITY, G, MAP_ITEMS, SHORE, TAU, camera, clamp, scene, sfx, get uiConfirm() { return uiConfirm; }, get DEV() { return DEV; } });
// ===== Ventanitas propias (alert / confirm / prompt): algunos navegadores no las tienen: vive en js/ui/ventanitas.js =====
const { uiAlert, uiConfirm, uiDialog, uiPrompt } = CF_UI.crearVentanitas({ $ });
// ===== Editor de audio (modo desarrollador): sonidos, música, ambiente y voces: vive en js/editores/editor_audio.js =====
const { AE, AE_ACTIONS, AE_LABEL, SFX_NAMES, aeActionsOf, aeBuild, aeClips, aeClone, aeClose, aeDecodeDur, aeDef, aeDetail, aeEvents, aeItems, aeLabel, aeLs, aeMsg, aeOpen, aePlay, aeRender, aeSave, aeSlider, aeSrv, aeStop, aeUpload } = CF_EDITORES.crearEditorAudio({ $, AUDIO_CFG, CHARACTER_VOICE_KEYS, CHARS, CHAR_IDS, SND_LIST, VOICE_PACKS, charSkin, charSoundDirs, charSoundRel, headPortrait, initAudio, sfx, uiAlert, uiConfirm, ultMusicRel, voiceRel, get SFX_RAW() { return SFX_RAW; }, set SFX_RAW(v) { SFX_RAW = v; }, get SFX_FORCE() { return SFX_FORCE; }, set SFX_FORCE(v) { SFX_FORCE = v; }, get DEV() { return DEV; } });
// ===== Modo desarrollador: lo ve y lo usa solo el dueño =====
// Se activa en tu PC (localhost) o con la clave del dueño (guardada como PBKDF2 con sal; la clave en sí no está en el juego).
// Ojo: esto es una puerta en tu navegador, no seguridad de servidor: las herramientas solo cambian tu copia y lo que publicás lo decidís vos.
const DEV = { on: false, p: { salt: 'e1223a6e5d5ce1833853cbce67103fe2', iter: 150000, hash: '21dda3739d45c30713ac3333f8a0a349d17115890e2d965a0f95c7a5d28e7e28' } };
const IS_LOCAL_HOST = /^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === 'file:';
let OWNER_BETA_PREF = true, OWNER_AUTHED = false;
// LANZAMIENTO: con true, todo lo que estaba en la vista privada (CF_BETA) lo ve TODO el mundo. Para volver a ocultarlo a los jugadores, ponla en false.
const BETA_LANZADA = true;
const _betaSubs = new Set();
function devHasLocalToken() {
  try { const d = JSON.parse(localStorage.getItem('bsb_dev') || 'null'); return !!(d && d.h === DEV.p.hash.slice(0, 16) && Date.now() - d.t < 30 * 864e5); } catch (e) { return false; }
}
function isOwnerBetaAllowed() {
  return !!(IS_LOCAL_HOST || DEV.on || OWNER_AUTHED);
}
function getOwnerBeta() {
  return typeof ZZZ_U !== 'undefined' && ZZZ_U.beta.value > 0.5;
}
function syncOwnerBeta(forceApply = false) {
  const want = (BETA_LANZADA || (isOwnerBetaAllowed() && OWNER_BETA_PREF)) ? 1 : 0;
  const prev = typeof ZZZ_U !== 'undefined' ? ZZZ_U.beta.value : want;
  if (typeof ZZZ_U !== 'undefined') ZZZ_U.beta.value = want;
  if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('cf-beta', want > 0.5);
  if (want !== prev || forceApply) {
    try { if (typeof syncStudioBeta === 'function') syncStudioBeta(typeof SH !== 'undefined' && SH.fig ? SH.fig.ch : null); } catch (e) {}
    try { if (typeof gfxApply === 'function') gfxApply(false); } catch (e) {}
    for (const fn of _betaSubs) { try { fn(want > 0.5); } catch (e) {} }
  } else {
    try { if (typeof gfxSyncUI === 'function') gfxSyncUI(); } catch (e) {}
  }
}
function setOwnerBeta(v) {
  if (!isOwnerBetaAllowed()) { OWNER_BETA_PREF = false; syncOwnerBeta(); return false; }
  OWNER_BETA_PREF = !!v;
  syncOwnerBeta(true);
  return getOwnerBeta();
}
window.CF_BETA = Object.freeze({
  get on() { return getOwnerBeta(); },
  isAllowed: isOwnerBetaAllowed,
  set: setOwnerBeta,
  subscribe(fn) {
    if (typeof fn !== 'function') return () => {};
    _betaSubs.add(fn);
    return () => _betaSubs.delete(fn);
  }
});
if (CITY.betaApply) { CF_BETA.subscribe(CITY.betaApply); CITY.betaApply(CF_BETA.on); }   // lugares nuevos del mapa: solo en la vista privada
async function devHash(k) {
  const enc = new TextEncoder(), key = await crypto.subtle.importKey('raw', enc.encode(k), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(DEV.p.salt), iterations: DEV.p.iter }, key, 256);
  return [...new Uint8Array(bits)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function devApply() { document.body.classList.toggle('dev', DEV.on); syncOwnerBeta(); }
{
  DEV.on = IS_LOCAL_HOST || devHasLocalToken(); devApply();
}
async function devUnlock() {
  if (DEV.on) return true;
  let t = { n: 0, until: 0 }; try { t = JSON.parse(localStorage.getItem('bsb_dev_try') || 'null') || t; } catch (e) { }
  if (t.until > Date.now()) { await uiAlert('Demasiados intentos. Probá en ' + Math.ceil((t.until - Date.now()) / 60000) + ' min.'); return false; }
  const k = await uiPrompt('Clave del dueño de CalFight (modo desarrollador):', true, 'MODO DESARROLLADOR'); if (!k) return false;
  let h = ''; try { h = await devHash(k.trim()); } catch (e) { await uiAlert('Abrí el juego por https para usar el modo desarrollador.'); return false; }
  if (h !== DEV.p.hash) { t.n++; if (t.n >= 5) { t.until = Date.now() + 15 * 60000; t.n = 0; } try { localStorage.setItem('bsb_dev_try', JSON.stringify(t)); } catch (e) { } await uiAlert('Clave incorrecta.'); return false; }
  try { localStorage.removeItem('bsb_dev_try'); localStorage.setItem('bsb_dev', JSON.stringify({ h: DEV.p.hash.slice(0, 16), t: Date.now() })); } catch (e) { }
  DEV.on = true; devApply(); stForget(); ST.owner = true; try { localStorage.setItem('bsb_owner', '1'); } catch (e) { }   // este aparato ya no cuenta como jugador
  return true;
}
function devLock() { DEV.on = false; try { localStorage.removeItem('bsb_dev'); localStorage.removeItem('bsb_owner'); } catch (e) { } ST.owner = false; devApply(); }
async function ownerOpen() {
  if (!(await devUnlock())) return;
  ownerUI(); OW.el.classList.remove('hidden'); ownerConnect(); ownerRender(); clearInterval(OW.tm); OW.tm = setInterval(ownerRender, 2000);
}
function ownerClose() { if (OW.el) OW.el.classList.add('hidden'); clearInterval(OW.tm); }
function ownerConnect() {
  if (OW.cl.length || !window.mqtt) return;
  RELAYS.forEach((url, i) => {
    try {
      const c = mqtt.connect(url, { clientId: 'cfo_' + Math.random().toString(36).slice(2, 10) + '_' + i, clean: true, keepalive: 30, reconnectPeriod: 4000, connectTimeout: 8000 });
      c.on('connect', () => c.subscribe(ST_BASE + '#', { qos: 0 }));
      c.on('error', () => { });
      c.on('message', (topic, buf) => {
        const m = /^calfight\/st1\/(u|on)\/(s[a-z0-9]{8,14})$/.exec(topic); if (!m || buf.length > 20000) return;
        const map = m[1] === 'u' ? OW.u : OW.on, id = m[2];
        if (!buf.length) { map.delete(id); return; }
        let o; try { o = JSON.parse(buf.toString()); } catch (e) { return; }
        if (!o || typeof o !== 'object') return;
        if (m[1] === 'u') { if (o.v !== 1 || typeof o.dy !== 'object' || typeof o.c !== 'object') return; const old = map.get(id); if (old && (+old.l || 0) > (+o.l || 0)) return; }
        map.set(id, o);
      });
      OW.cl.push(c);
    } catch (e) { }
  });
}
function ownerUI() {
  if (OW.el) return;
  const st = document.createElement('style');
  st.textContent = `#owner{position:fixed;inset:0;z-index:9999;background:rgba(7,9,16,.97);color:#e8ecf4;overflow:auto;font:14px/1.4 system-ui,sans-serif;padding:18px max(16px,calc(50% - 560px))}
#owner.hidden{display:none}#owner h2{margin:0;font-size:22px;letter-spacing:.06em}#owner h3{margin:22px 0 8px;font-size:13px;letter-spacing:.12em;color:#9aa6bd}
#owner .ow-top{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}#owner .ow-top button{background:#1c2234;color:#e8ecf4;border:1px solid #333c55;border-radius:8px;padding:7px 14px;cursor:pointer;font:inherit}
#owner .ow-kpis{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}#owner .ow-k{background:#121726;border:1px solid #232b40;border-radius:10px;padding:10px 12px}
#owner .ow-k b{display:block;font-size:26px;font-variant-numeric:tabular-nums}#owner .ow-k span{color:#9aa6bd;font-size:12px}#owner .ow-k.live b{color:#5dff9a}
#owner .ow-row{display:grid;grid-template-columns:150px 1fr 230px;gap:10px;align-items:center;margin:4px 0}#owner .ow-bar{height:16px;background:#151b2b;border-radius:4px;overflow:hidden}
#owner .ow-bar i{display:block;height:100%;border-radius:4px}#owner .ow-row small{color:#9aa6bd;font-variant-numeric:tabular-nums}#owner .ow-chips{display:flex;flex-wrap:wrap;gap:6px}
#owner .ow-chips span{background:#121726;border:1px solid #232b40;border-radius:20px;padding:3px 10px}#owner .ow-note{color:#7d889e;font-size:12px;margin-top:22px}
@media (max-width:640px){#owner .ow-row{grid-template-columns:90px 1fr;}#owner .ow-row small{grid-column:1/-1}}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'owner'; el.className = 'hidden';
  el.innerHTML = '<div class="ow-top"><h2>PANEL DEL DUEÑO · CALFIGHT</h2><div><button type="button" id="ow-x">Cerrar</button></div></div><div id="ow-body"></div>';
  document.body.appendChild(el); OW.el = el;
  $('ow-x').addEventListener('click', ownerClose);
}
function ownerRender() {
  if (!OW.el || OW.el.classList.contains('hidden')) return;
  const now = Date.now(), T = stDay(), n = v => +v || 0, fmt = v => Math.round(v).toLocaleString('es');
  const live = [...OW.on.values()].filter(o => now - n(o.t) < 75000);
  const users = [...OW.u.values()];
  const days = u => Object.keys(u.dy).map(Number).filter(Number.isFinite);
  const activeIn = (a, b) => users.filter(u => days(u).some(d => d >= a && d <= b)).length;
  let ses = 0, mat = 0, min = 0, wins = 0, mo = [0, 0], ret = 0, wkSum = 0, first = T;
  const ch = {};
  for (const u of users) {
    ses += n(u.s); wins += n(u.w); if (Array.isArray(u.mo)) { mo[0] += n(u.mo[0]); mo[1] += n(u.mo[1]); }
    const ds = days(u); if (ds.length > 1) ret++;
    wkSum += new Set(ds.map(d => Math.floor((T - d) / 7))).size; first = Math.min(first, n(u.f) || T);
    for (const d of ds) { const r = u.dy[d]; if (Array.isArray(r)) { mat += n(r[1]); min += n(r[2]); } }
    for (const id in u.c) { if (!CHARS[id] || !Array.isArray(u.c[id])) continue; const a = ch[id] || (ch[id] = [0, 0, 0, 0, 0, 0]); for (let i = 0; i < 5; i++) a[i] += n(u.c[id][i]); if (n(u.c[id][0]) > 0) a[5]++; }
  }
  const K = (v, l, c) => `<div class="ow-k${c ? ' ' + c : ''}"><b>${v}</b><span>${l}</span></div>`;
  let h = '<h3>AHORA MISMO</h3><div class="ow-kpis">' + K(live.length, 'conectados ahora', 'live') + K(live.filter(o => o.s === 1).length, 'en una pelea') + K(live.filter(o => o.s !== 1).length, 'en el menú') + K(live.filter(o => o.s === 1 && o.m === 1).length, 'peleando online') + '</div>';
  const lc = {}; for (const o of live) if (CHARS[o.c]) lc[o.c] = (lc[o.c] || 0) + 1;
  if (Object.keys(lc).length) h += '<div class="ow-chips" style="margin-top:8px">' + Object.entries(lc).sort((a, b) => b[1] - a[1]).map(([id, c]) => `<span style="border-color:${CHARS[id].color}">${CHARS[id].name} × ${c}</span>`).join('') + '</div>';
  const weeks = Math.max(1, Math.ceil((T - first + 1) / 7));
  h += '<h3>RESUMEN</h3><div class="ow-kpis">' + K(fmt(users.length), 'jugadores distintos') + K(activeIn(T, T), 'activos hoy') + K(activeIn(T - 6, T), 'activos en 7 días') + K(activeIn(T - 29, T), 'activos en 30 días')
    + K(fmt(ses), 'veces que abrieron el juego') + K(fmt(mat), 'partidas jugadas') + K((min / 60).toFixed(1) + ' h', 'tiempo peleando') + K(users.length ? Math.round(min / users.length) + ' min' : '—', 'por jugador')
    + K(weeks, weeks === 1 ? 'semana con datos' : 'semanas con datos') + K(users.length ? (wkSum / users.length).toFixed(1) : '—', 'semanas jugadas (promedio)') + K(users.length ? Math.round(ret / users.length * 100) + '%' : '—', 'volvieron otro día')
    + K(mo[0] + mo[1] ? Math.round(mo[1] / (mo[0] + mo[1]) * 100) + '%' : '—', 'partidas online (resto con bots)') + '</div>';
  // semanas
  h += '<h3>POR SEMANA</h3>';
  const wk = [];
  for (let w = 11; w >= 0; w--) {
    const a = T - 6 - w * 7, b = T - w * 7; let pl = 0, m = 0, mn = 0, nu = 0;
    for (const u of users) { let any = false; for (const d of days(u)) if (d >= a && d <= b) { any = true; const r = u.dy[d]; if (Array.isArray(r)) { m += n(r[1]); mn += n(r[2]); } } if (any) pl++; const f = n(u.f); if (f >= a && f <= b) nu++; }
    wk.push({ a, pl, m, mn, nu });
  }
  const wmax = Math.max(1, ...wk.map(x => x.pl));
  const dl = d => { const t = new Date(d * 864e5); return t.getUTCDate() + '/' + (t.getUTCMonth() + 1); };
  for (const x of wk) h += `<div class="ow-row"><span>${x.a + 6 === T ? 'Esta semana' : 'Semana del ' + dl(x.a)}</span><div class="ow-bar"><i style="width:${x.pl / wmax * 100}%;background:#5d8bff"></i></div><small>${x.pl} jugadores · ${x.nu} nuevos · ${x.m} partidas · ${(x.mn / 60).toFixed(1)} h</small></div>`;
  // personajes
  const rows = Object.entries(ch).sort((a, b) => b[1][0] - a[1][0]), picks = rows.reduce((t, r) => t + r[1][0], 0), pmax = Math.max(1, ...rows.map(r => r[1][0]));
  h += '<h3>PERSONAJES MÁS USADOS</h3>';
  if (!rows.length) h += '<div class="ow-note">Todavía no hay partidas registradas.</div>';
  for (const [id, a] of rows) h += `<div class="ow-row"><span style="color:${CHARS[id].color}">${CHARS[id].name}</span><div class="ow-bar"><i style="width:${a[0] / pmax * 100}%;background:${CHARS[id].color}"></i></div><small>${a[0]} partidas (${picks ? Math.round(a[0] / picks * 100) : 0}%) · ${a[5]} jugadores · ${a[0] ? Math.round(a[1] / a[0] * 100) : 0}% victorias · ${a[2]} K.O. · ${a[3]} ultis · ${(a[4] / 60).toFixed(1)} h</small></div>`;
  h += `<div class="ow-note">Datos anónimos: cada navegador es un código al azar (sin nombre ni IP). Se guardan como mensajes retenidos en los relays públicos de MQTT, que no garantizan guardarlos para siempre; este aparato quedó marcado como del dueño y no se cuenta. Relays conectados: ${OW.cl.filter(c => c.connected).length}/${OW.cl.length} · resúmenes recibidos: ${users.length}.</div>`;
  $('ow-body').innerHTML = h;
}

// ===== Cuentas Firebase y sistema social: vive en js/red/cuentas_social.js =====
const { ACCT, ACCT_ERR, BANNERS, BN_CACHE, PROFILE_AURAS, PROFILE_EFFECTS, PROFILE_FRAMES, PROFILE_MAP_BANNERS, PROFILE_STICKERS, PROFILE_THEMES, SOC, acctBannerPick, acctBuild, acctChanged, acctClose, acctCustomize, acctErr, acctGate, acctLoad, acctMsg, acctOpen, acctPaint, acctRefreshVerified, acctRender, acctSha, avatarGet, bannerDecals, bannerDraw, bannerGet, bannerKey, bannerSet, bannerURL, cleanCosmetics, cleanProfileDecor, compactProfileImage, cosmeticKey, cosmeticSave, cosmeticsGet, decorateProfile, dmCount, dmDraftKey, dmDrafts, dmSaveDraft, drawMapBanner, enableDecalDrag, friendsButton, profileText, roleBadge, roleOfEntry, socialAuthChanged, socialBadge, socialBlock, socialBuild, socialChat, socialChatStop, socialCheckEntry, socialClose, socialDecorateIdentity, socialEntryUid, socialError, socialGetProfile, socialLinkAction, socialLoad, socialOpen, socialPair, socialProfileActions, socialPublishSession, socialRefreshVisible, socialRender, socialRenderMessages, socialRequest, socialRequire, socialReset, socialSaveProfile, socialSend, socialSetRole, socialStamp, socialStatus, socialTick, socialViewAccount, socialWait, socialWatchRole, stickerNode, uploadProfileAvatar, validAccountId } = CF_RED.crearCuentasSocial({ $, CHARS, CHAR_IDS, DEV, FX, G, GFX, IS_GUIDE, IS_LOCAL_HOST, NET, PROFILE_IMAGE_MAX, PROJ, ROOM_UI, ST, charSkin, clamp, cleanPublicProfile, devApply, devHasLocalToken, entryProfile, headPortrait, localPublicProfile, netShareProfile, ownerOpen, playerProfileOpen, profileCardContent, profileCardStats, profileCareerStats, rawEntryProfile, refreshRoomBoard, requestLock, roomClearInput, roomEntries, setRoomBoard, sfx, stForget, syncFriendsBtnPlace, syncOwnerBeta, uiAlert, uiDialog, unlock, get OWNER_AUTHED() { return OWNER_AUTHED; }, set OWNER_AUTHED(v) { OWNER_AUTHED = v; }, get netMenuPresence() { return netMenuPresence; }, get tmClose() { return tmClose; } });
$('devoff').addEventListener('click', () => { sfx('select'); if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) uiAlert('En localhost el modo desarrollador siempre está activo. Para verlo como jugador abrí la página por la web publicada.'); else devLock(); });
const ownerHash = () => { if (/^#(dueno|due%C3%B1o|dueño|owner)$/i.test(location.hash)) { history.replaceState(null, '', location.pathname + location.search); ownerOpen(); } };
addEventListener('hashchange', ownerHash); setTimeout(ownerHash, 600);
{ const o = $('st-opt'); if (o) { o.checked = ST.on; o.addEventListener('change', () => { ST.on = o.checked; try { localStorage.setItem('bsb_st_off', ST.on ? '0' : '1'); } catch (e) { } if (!ST.on) stForget(); else stPush(); }); } }
// ===== Canal directo entre jugadores (WebRTC) =====
// El relay público solo se usa para presentarse y como respaldo. Si los dos navegadores logran conectarse directo, el estado del juego
// viaja por un canal sin orden ni reintentos (como UDP): sin pasar por el servidor del relay, que suele estar en otro continente.
const HUMAN_ID = /^u[a-z0-9]{3,}$/;
const RTC_CFG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }] };
function rtcMesh(R, myId, sigSend, onData) {
  const M = new Map(), cool = new Map(), early = new Map(); let closed = false;   // early: candidatos que llegan antes que la oferta (los relays no garantizan el orden entre sí)
  const noRTC = !!R.noMesh || typeof RTCPeerConnection === 'undefined' || /[?&]rtc=off/.test(location.search);   // con servidor árbitro no hay canales directos: todo pasa por él
  function kill(e, fail) {
    if (M.get(e.id) === e) M.delete(e.id);
    try { e.pc.close(); } catch (x) { }
    e.open = false; e.dead = true;
    const c = cool.get(e.id) || { fails: 0 }; if (fail) c.fails++; c.until = Date.now() + Math.min(30000, 2500 * (1 + c.fails * c.fails)); cool.set(e.id, c);
  }
  function start(id, initiator) {
    const e = { id, pc: new RTCPeerConnection(RTC_CFG), dc: null, open: false, t0: Date.now(), cand: [], remote: false, init: initiator, dead: false };
    M.set(id, e);
    e.pc.onicecandidate = ev => { if (ev.candidate) sigSend(id, { k: 'c', c: ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate }); };
    e.pc.onconnectionstatechange = () => {
      const st = e.pc.connectionState;
      if (st === 'failed' || st === 'closed') kill(e, st === 'failed');
      else if (st === 'disconnected') setTimeout(() => { if (M.get(id) === e && e.pc.connectionState === 'disconnected') kill(e, true); }, 4000);
    };
    const wire = ch => {
      e.dc = ch;
      ch.onopen = () => { e.open = true; const c = cool.get(id); if (c) c.fails = 0; };
      ch.onclose = () => { e.open = false; };
      ch.onmessage = ev => { try { const m = JSON.parse(ev.data); if (m && m.t === 'p') onData(id, m.d); } catch (x) { } };
    };
    if (initiator) {
      wire(e.pc.createDataChannel('g', { ordered: false, maxRetransmits: 0 }));
      e.pc.createOffer().then(o => e.pc.setLocalDescription(o)).then(() => sigSend(id, { k: 'o', s: e.pc.localDescription.sdp })).catch(() => kill(e, true));
    } else e.pc.ondatachannel = ev => wire(ev.channel);
    return e;
  }
  function flush(e) { for (const c of e.cand.splice(0)) e.pc.addIceCandidate(c).catch(() => { }); }
  return {
    // se llama cada vez que se ve a otro jugador: arranca la conexión directa (el de id menor inicia)
    ensure(id) {
      if (noRTC || closed || !HUMAN_ID.test(id)) return;
      const e = M.get(id);
      if (e) { if (!e.open && Date.now() - e.t0 > 10000) kill(e, true); return; }
      const c = cool.get(id); if (c && Date.now() < c.until) return;
      if (M.size >= 7) return;
      if (myId < id) start(id, true);   // el otro lado espera nuestra oferta; si no llega, se reintenta con espera creciente
    },
    signal(m) {
      if (noRTC || closed || !m || !HUMAN_ID.test(m.f || '')) return;
      const id = m.f; let e = M.get(id);
      if (m.k === 'o' && typeof m.s === 'string') {
        if (e) kill(e);
        e = start(id, false);
        const pre = early.get(id); if (pre) { e.cand.push(...pre.list); early.delete(id); }
        e.pc.setRemoteDescription({ type: 'offer', sdp: m.s }).then(() => { e.remote = true; flush(e); return e.pc.createAnswer(); })
          .then(a => e.pc.setLocalDescription(a)).then(() => sigSend(id, { k: 'a', s: e.pc.localDescription.sdp })).catch(() => kill(e, true));
      } else if (m.k === 'a' && e && e.init && !e.remote && typeof m.s === 'string') {
        e.pc.setRemoteDescription({ type: 'answer', sdp: m.s }).then(() => { e.remote = true; flush(e); }).catch(() => kill(e, true));
      } else if (m.k === 'c' && m.c) {
        if (e) { if (e.remote) e.pc.addIceCandidate(m.c).catch(() => { }); else e.cand.push(m.c); }
        else { const pe = early.get(id) || { list: [], t: Date.now() }; if (pe.list.length < 40) pe.list.push(m.c); early.set(id, pe); for (const [k, v] of early) if (Date.now() - v.t > 20000) early.delete(k); }
      }
    },
    send(str) { let n = 0; for (const e of M.values()) if (e.open && e.dc && e.dc.readyState === 'open' && e.dc.bufferedAmount < 65536) { try { e.dc.send(str); n++; } catch (x) { } } return n; },
    info(id) {
      if (noRTC) return 'apagado';
      const e = M.get(id); if (!e) { const c = cool.get(id); return c && Date.now() < c.until ? 'reintenta en ' + Math.ceil((c.until - Date.now()) / 1000) + 's' : 'sin intento'; }
      return e.open ? 'abierto' : (e.pc.iceConnectionState || 'nuevo') + (e.remote ? '' : ' (esperando respuesta)') + ' ' + Math.round((Date.now() - e.t0) / 1000) + 's';
    },
    isOpen(id) { const e = M.get(id); return !!(e && e.open && e.dc && e.dc.readyState === 'open'); },
    drop(id) { const e = M.get(id); if (e) kill(e); cool.delete(id); },
    closeAll() { closed = true; for (const e of [...M.values()]) kill(e); },
  };
}
// acepta un estado de otro jugador venga por donde venga (relay o canal directo): ignora los más viejos que el que ya tenemos
function acceptState(R, id, d, notify, mesh, src) {
  if (!d || typeof d !== 'object') return;
  const prev = R.states.get(id);
  if (prev && isFinite(prev.ts) && isFinite(d.ts) && d.ts <= prev.ts && prev.ts - d.ts < 5000) { if (d.ts === prev.ts) R.seen.set(id, Date.now()); return; }   // más viejo o repetido (llega por dos caminos)
  R.states.set(id, d); R.seen.set(id, Date.now()); R.cnt[src] = (R.cnt[src] || 0) + 1;
  if (!prev || prev.st !== d.st || prev.nm !== d.nm || prev.ch !== d.ch) notify();
  mesh.ensure(id);
}
// tu estado: por el canal directo a quien esté conectado; por el relay solo a quien aún no (y un latido de vez en cuando)
function sendPresence(R, mesh, mqttPub) {
  const now = Date.now(), direct = mesh.send(JSON.stringify({ t: 'p', d: R.my }));
  let need = now - (R.lastMqtt || 0) > 900;
  if (!need) for (const [id] of R.states) if (HUMAN_ID.test(id) && now - (R.seen.get(id) || 0) < 8000 && !mesh.isOpen(id)) { need = true; break; }
  if (need || !direct) { mqttPub(); R.lastMqtt = now; R.cnt.sent = (R.cnt.sent || 0) + 1; }
}
function relayRoom(code, onStatus = () => { }) {
  // Se conecta a TODOS los relays a la vez: se publica en todos y se escucha en todos (los duplicados se descartan por hora del emisor).
  // Así nadie queda en un relay distinto al de sus amigos, y si uno pierde paquetes o se cae, el otro cubre.
  return new Promise((resolve, reject) => {
    const base = 'blockstrike/v2/' + code + '/', STALE = 8000;
    const myId = 'u' + Math.random().toString(36).slice(2, 10);
    const R = { name: 'bs-' + code, my: {}, myId, isHost: false, states: new Map(), seen: new Map(), skins: new Map(), profiles: new Map(), cbs: [], ping: 0, pings: {}, mySkin: null, closed: false, lastSend: 0, timer: 0, clients: [], relay: 0 };
    let settled = false, sigN = 0; const sigSeen = new Set();
    const done = (ok, v) => { if (settled) return; settled = true; ok ? resolve(v) : reject(v); };
    const notify = () => R.cbs.forEach(f => { try { f(); } catch (e) { } });
    const pub = (t, payload, opts) => { for (const c of R.clients) { try { if (c.connected) c.publish(base + t, payload, opts || { qos: 0 }); } catch (e) { } } };
    R.cnt = {}; const mesh = rtcMesh(R, myId, (to, o) => pub('sig/' + to, JSON.stringify(Object.assign({ f: myId, i: myId + '.' + (++sigN) }, o)), { qos: 1 }), (id, d) => acceptState(R, id, d, notify, mesh, 'rtc'));
    R.rtcOpen = id => mesh.isOpen(id); R.rtcInfo = id => mesh.info(id);
    R.peers = () => {
      const now = Date.now(), a = [{ peer: myId, sameTab: true, isMe: true, presence: R.my }];
      for (const [id, d] of R.states) if (now - (R.seen.get(id) || 0) < STALE) a.push({ peer: id, sameTab: false, isMe: false, presence: d });
      return a;
    };
    R.onPeers = fn => { R.cbs.push(fn); return () => { R.cbs = R.cbs.filter(x => x !== fn); }; };
    let lastKey = '';
    R.presence = patch => {
      for (const k in patch) { if (patch[k] === null) delete R.my[k]; else R.my[k] = patch[k]; }
      R.lastSend = Date.now(); sendPresence(R, mesh, () => pub('p/' + myId, JSON.stringify(R.my)));
      const key = R.my.st + '|' + R.my.nm + '|' + R.my.ch; if (key !== lastKey) { lastKey = key; notify(); }
      return Promise.resolve();
    };
    R.setSkin = d => { R.mySkin = d; pub('sk/' + myId, d || '', { qos: 0, retain: true }); };
    R.setProfile = d => { R.myProfile = cleanPublicProfile(d); if (!R.myProfile) return; R.profiles.set(myId, R.myProfile); pub('pf/' + myId, JSON.stringify(R.myProfile), { qos: 0, retain: true }); R.profileAt = Date.now(); notify(); };
    // entidades extra del anfitrión (dummies): se publican como si fueran otros jugadores
    R.pubAs = (id, obj) => pub('p/' + id, JSON.stringify(obj));
    R.dropAs = id => pub('x/' + id, '1');
    const forget = id => { mesh.drop(id); R.profiles.delete(id); if (!R.states.has(id)) return; R.states.delete(id); R.seen.delete(id); notify(); };
    R.leave = () => {
      R.closed = true; clearInterval(R.timer); mesh.closeAll();
      pub('x/' + myId, '1'); pub('pf/' + myId, '', { qos: 0, retain: true }); if (R.mySkin) pub('sk/' + myId, '', { qos: 0, retain: true });
      for (const c of R.clients) { try { c.end(false); } catch (e) { } }
      return Promise.resolve();
    };
    onStatus('Conectando al servidor…');
    let failed = 0;
    const failTo = setTimeout(() => { if (!settled) { for (const c of R.clients) { try { c.end(true); } catch (e) { } } done(false, { code: 'server' }); } }, 10000);
    const handle = (ci, topic, buf) => {
      if (R.closed || topic.indexOf(base) !== 0) return;
      const [kind, id] = topic.slice(base.length).split('/');
      if (!id) return;
      const s = buf.toString();
      if (kind === 'pg') { if (id === myId) { R.pings[ci] = Math.max(0, Date.now() - (+s || 0)); R.ping = Math.min(...Object.values(R.pings)); } return; }
      if (kind === 'sig') {
        if (id !== myId) return;
        let m; try { m = JSON.parse(s); } catch (e) { return; }
        if (m && m.i) { if (sigSeen.has(m.i)) return; sigSeen.add(m.i); if (sigSeen.size > 400) sigSeen.clear(); }   // la misma señal llega por cada relay
        mesh.signal(m); return;
      }
      if (id === myId || id.indexOf(myId + '-') === 0) return;
      if (kind === 'p') {
        let d; try { d = JSON.parse(s); } catch (e) { return; }
        acceptState(R, id, d, notify, mesh, 'relay');
      } else if (kind === 'x') {
        forget(id); pub('pf/' + id, '', { qos: 0, retain: true });
        if (R.skins.get(id)) pub('sk/' + id, '', { qos: 0, retain: true });
      } else if (kind === 'pf') { if (!s) R.profiles.delete(id); else receivePublicProfile(R, id, s, notify);
      } else if (kind === 'sk') {
        const d = s && s.length < 24000 ? s : null;
        R.skins.set(id, d); if (R.onSkin) R.onSkin(id, d);
      }
    };
    RELAYS.forEach((url, ci) => {
      let client;
      try { client = mqtt.connect(url, { clientId: 'bs_' + myId + '_' + ci, clean: true, keepalive: 15, reconnectPeriod: 2000, connectTimeout: 8000, will: { topic: base + 'x/' + myId, payload: '1', qos: 0, retain: false } }); }
      catch (e) { if (++failed >= RELAYS.length) { clearTimeout(failTo); done(false, { code: 'server' }); } return; }
      R.clients.push(client);
      client.on('connect', () => {
        client.subscribe(base + '#', { qos: 0 }, err => {
          if (err) { if (++failed >= RELAYS.length && !settled) { clearTimeout(failTo); done(false, { code: 'server' }); } return; }
          R.relay++;
          if (R.myProfile) client.publish(base + 'pf/' + myId, JSON.stringify(R.myProfile), { qos: 0, retain: true });
          if (R.mySkin) client.publish(base + 'sk/' + myId, R.mySkin || '', { qos: 0, retain: true });
          if (Object.keys(R.my).length) client.publish(base + 'p/' + myId, JSON.stringify(R.my), { qos: 0 });
          if (!settled) { clearTimeout(failTo); done(true, R); }
        });
      });
      client.on('close', () => { if (R.relay > 0 && client.__up) { R.relay--; client.__up = false; } });
      client.on('connect', () => { client.__up = true; });
      client.on('error', () => { });
      client.on('message', (topic, buf) => handle(ci, topic, buf));
    });
    // latido: reenvía el estado si estuvo quieto, mide el ping y borra a quien dejó de responder
    R.timer = setInterval(() => {
      if (R.closed || !settled) return;
      const now = Date.now();
      if (now - R.lastSend > 1500 && Object.keys(R.my).length) R.presence({});
      if (R.myProfile && now - (R.profileAt || 0) > 15000) { pub('pf/' + myId, JSON.stringify(R.myProfile), { qos: 0, retain: true }); R.profileAt = now; }
      pub('pg/' + myId, String(now));
      for (const id of [...R.states.keys()]) if (now - (R.seen.get(id) || 0) > STALE) forget(id);
    }, 2000);
  });
}
// Sala por el servidor local: WebSocket a /ws del mismo servidor que sirve el juego. Misma forma que relayRoom().
function localRoom(code, onStatus = () => { }) {
  return new Promise((resolve, reject) => {
    const myId = 'u' + Math.random().toString(36).slice(2, 10), STALE = 8000;
    const R = { name: 'bs-' + code, my: {}, myId, isHost: false, states: new Map(), seen: new Map(), skins: new Map(), profiles: new Map(), cbs: [], ping: 0, mySkin: null, closed: false, lastSend: 0, timer: 0, ws: null, local: true, noMesh: true };
    let settled = false, opened = false;
    const done = (ok, v) => { if (settled) return; settled = true; ok ? resolve(v) : reject(v); };
    const notify = () => R.cbs.forEach(f => { try { f(); } catch (e) { } });
    const send = o => { try { if (R.ws && R.ws.readyState === 1) R.ws.send(JSON.stringify(o)); } catch (e) { } };
    R.cnt = {}; const mesh = rtcMesh(R, myId, (to, o) => send({ t: 'sig', to, d: o }), (id, d) => acceptState(R, id, d, notify, mesh, 'rtc'));
    R.rtcOpen = id => mesh.isOpen(id); R.rtcInfo = id => mesh.info(id);
    R.peers = () => {
      const now = Date.now(), a = [{ peer: myId, sameTab: true, isMe: true, presence: R.my }];
      for (const [id, d] of R.states) if (now - (R.seen.get(id) || 0) < STALE) a.push({ peer: id, sameTab: false, isMe: false, presence: d });
      return a;
    };
    R.onPeers = fn => { R.cbs.push(fn); return () => { R.cbs = R.cbs.filter(x => x !== fn); }; };
    let lastKey = '';
    R.presence = patch => {
      for (const k in patch) { if (patch[k] === null) delete R.my[k]; else R.my[k] = patch[k]; }
      R.lastSend = Date.now(); sendPresence(R, mesh, () => send({ t: 'p', d: R.my }));
      const key = R.my.st + '|' + R.my.nm + '|' + R.my.ch; if (key !== lastKey) { lastKey = key; notify(); }
      return Promise.resolve();
    };
    R.setProfile = d => { R.myProfile = cleanPublicProfile(d); if (!R.myProfile) return; R.profiles.set(myId, R.myProfile); send({ t: 'pf', d: R.myProfile }); R.profileAt = Date.now(); notify(); };
    R.weatherCommand = d => send({t:'wx',d});
    R.sendRaw = send;   // mensajes sueltos para el servidor (golpes a monstruos del abismo, etc.)
    R.setSkin = d => { R.mySkin = d; send({ t: 'sk', d: d || '' }); };
    R.pubAs = (id, obj) => send({ t: 'pa', id, d: obj });
    R.dropAs = id => send({ t: 'xa', id });
    const forget = id => { mesh.drop(id); R.profiles.delete(id); if (!R.states.has(id)) return; R.states.delete(id); R.seen.delete(id); notify(); };
    R.leave = () => { R.closed = true; clearInterval(R.timer); mesh.closeAll(); try { R.ws.close(); } catch (e) { } return Promise.resolve(); };
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    function connect() {
      const ws = R.ws = new WebSocket(`${SRV_BASE ? SRV_WS : proto + '//' + location.host}/ws?room=${encodeURIComponent(code)}&id=${myId}${NET.public ? '&pub=1' : ''}${NET.roomOpts ? '&bots=' + NET.roomOpts.bots + '&max=' + NET.roomOpts.max : ''}`);
      const failTo = setTimeout(() => { if (!opened) { try { ws.close(); } catch (e) { } } }, 5000);
      ws.onopen = () => { opened = true; clearTimeout(failTo); if (R.down) { R.down = false; R.retry = 0; addFeedText('Conexión recuperada', '#7dff9a'); } if (R.mySkin) R.setSkin(R.mySkin); if (R.myProfile) R.setProfile(R.myProfile); if (Object.keys(R.my).length) R.presence({}); done(true, R); };
      ws.onerror = () => { };
      ws.onclose = () => {
        clearTimeout(failTo);
        if (R.closed) return;
        if (!opened) { if ((R.tries = (R.tries || 0) + 1) < 3) { setTimeout(() => { if (!R.closed) connect(); }, 700 * R.tries); return; } done(false, { code: 'server' }); return; }   // el primer intento puede fallar por un tropiezo de la red: se reintenta dos veces antes de rendirse
        if (!R.down) { R.down = true; addFeedText('Conexión perdida: reconectando…', '#ffb020'); }
        R.retry = Math.min(6000, Math.max(800, (R.retry || 500) * 1.5)); setTimeout(() => { if (!R.closed) connect(); }, R.retry);   // se cortó: reconecta solo (con espera creciente)
      };
      ws.onmessage = ev => {
        let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
        if (!m || typeof m !== 'object') return;
        const id = m.id;
        if(m.t==='wx'&&m.d){R.environment=m.d;R.environmentHost=m.host;}
        else if (m.t === 'p' && id && m.d && typeof m.d === 'object') acceptState(R, id, m.d, notify, mesh, 'relay');
        else if (m.t === 'sig' && m.from && m.d) mesh.signal(Object.assign({ f: m.from }, m.d));
        else if (m.t === 'x' && id) { forget(id); R.skins.delete(id); }
        else if (m.t === 'sk' && id) { const d = m.d && m.d.length < 24000 ? m.d : null; R.skins.set(id, d); if (R.onSkin) R.onSkin(id, d); }
        else if (m.t === 'pf' && id) receivePublicProfile(R, id, m.d, notify);
        else if (m.t === 'po') R.ping = Math.max(0, Date.now() - (+m.ts || 0));
        else if (m.t === 'au') netAuth(m);
        else if (m.t === 'cfg') NET.cfg = { bots: !!m.bots, max: +m.max || 0 };   // opciones de la sala (con bots, máximo de gente)
        else if ((m.t === 'ab' || m.t === 'abd' || m.t === 'abe') && window.CF_ABISMO && CF_ABISMO.srvMsg) CF_ABISMO.srvMsg(m);
      };
    }
    onStatus('Conectando al servidor…');
    // el servidor decide si se puede entrar (sala llena, o una privada por la puerta de las públicas) y dice el motivo
    fetch(`${SRV_BASE}/bs-join?room=${encodeURIComponent(code)}&pub=${NET.public ? 1 : 0}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null).then(j => {
      if (j && j.ok === false) { done(false, { code: j.why || 'server' }); return; }
      connect();
    });
    R.timer = setInterval(() => {
      if (R.closed) return;
      const now = Date.now();
      if (now - R.lastSend > 1500 && Object.keys(R.my).length) R.presence({});
      if (R.myProfile && now - (R.profileAt || 0) > 15000) { send({ t: 'pf', d: R.myProfile }); R.profileAt = now; }
      send({ t: 'pi', ts: now });
      for (const id of [...R.states.keys()]) if (now - (R.seen.get(id) || 0) > STALE) forget(id);
    }, 1000);
  });
}
// skins personalizadas compartidas (solo en la sala directa: la de claude.ai tiene un límite de 4 KB por jugador)
function netSkin(id, d) {
  if (!d || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(d)) { if (NET.skins[id]) { delete NET.skins[id]; removeProxy(id); } return; }
  const img = new Image();
  img.onload = () => { const c = normalizeSkin(img); if (!c) return; NET.skins[id] = { c, slim: detectSlim(c) }; removeProxy(id); };
  img.src = d;
}
function netShareSkin() {
  if (!NET.named || !NET.named.setSkin) return;
  let d = null;
  try { if (G.customSkin) d = G.customSkin.toDataURL('image/png'); } catch (e) { }
  NET.named.setSkin(d);
}
function inviteLink() { const base = NET.local && NET.publicUrl ? NET.publicUrl : NET.local && NET.lanBase && /^(localhost|127\.|\[::1\])/.test(location.hostname) ? NET.lanBase : location.origin; return base + location.pathname + '#sala-' + cleanCode($('roomcode').value); }
function cleanCode(s) { s = String(s || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 40); return s || 'amigos'; }
// una sola conexión a la vez: tocar Entrar o PELEAR mientras conecta espera a la misma
let joinP = null, joinCode = '';
function joinRoom() {
  if (!NET.room) { renderNetStatus(); return Promise.resolve(false); }
  const code = 'bs-' + cleanCode($('roomcode').value);
  if (NET.named && NET.named.name === code) return Promise.resolve(true);
  if (joinP && joinCode === code) return joinP;
  joinCode = code;
  const p = doJoin(code).finally(() => { if (joinP === p) joinP = null; });
  joinP = p;
  return p;
}
const NET_ERR = {
  server: 'No se pudo llegar al servidor de conexión. Revisá tu internet y tocá Entrar de nuevo.',
  mode_private: 'Esa sala es privada: para entrar necesitas su código o su link.',
  full: 'La sala está llena. Prueba con otra.',
  too_many_public: 'Hay demasiadas salas públicas abiertas ahora mismo (o ya tienes varias). Prueba más tarde.',
  no_host: 'No se pudo conectar con el anfitrión de la sala. Puede que su red bloquee la conexión (wifi de colegio o trabajo). Tocá Entrar de nuevo o que otro abra la sala.',
};
async function doJoin(code) {
  const st = t => { if (joinCode === code) { const s = $('netstat'); s.classList.remove('ok'); s.textContent = t; } };
  try {
    if (NET.named) { const old = NET.named; NET.named = null; try { await old.leave(); } catch (e) { } }
    NET.authOn = false; NET.srvHost = null; NET.authLog = ''; NET.cfg = null; NET.botHost = false; if (window.CF_ABISMO && CF_ABISMO.setSim) CF_ABISMO.setSim(false);
    st('Conectando al servidor…');
    const room = NET.room === 'relay' ? (NET.local ? await localRoom(code.slice(3), st) : await relayRoom(code.slice(3), st)) : await NET.room.join(code);
    if (joinCode !== code) { try { room.leave(); } catch (e) { } return false; }
    NET.named = room; NET.code = code; NET.joinT = Date.now();
    SESSION_STATS.kills = 0; SESSION_STATS.deaths = 0;
    NET.named.onPeers(() => renderLobby(), () => { NET.named = null; renderNetStatus(); });
    if (NET.room === 'relay') {
      NET.named.onSkin = netSkin;
      for (const [id, d] of NET.named.skins) netSkin(id, d);
      netShareSkin();
    }
    netMenuPresence(); netShareProfile(); socialSaveProfile(); renderLobby();
    return true;
  } catch (e) {
    if (joinCode !== code) return false;
    NET.named = null;
    const c = (e && (e.code || e.type)) || 'error';
    st(NET_ERR[c] || `No se pudo entrar a la sala (${c}). Tocá Entrar de nuevo en unos segundos.`);
    return false;
  }
}
function renderNetStatus() {
  const s = $('netstat'); s.classList.remove('ok');
  const p2p = NET.room === 'relay';
  $('inviterow').classList.toggle('hidden', !p2p);
  if (p2p) $('invitelink').value = inviteLink();
  if (!NET.ready) s.textContent = 'Buscando conexión…';
  else if (!NET.room) s.textContent = 'El modo amigos no está disponible acá. Abrí el juego desde su página web o desde claude.ai con la sesión iniciada.';
  else if (NET.named) {
    const n = NET.named.peers().length;
    s.textContent = `${p2p && NET.named.isHost ? 'Sos el anfitrión de' : 'Estás en'} la sala "${NET.code.slice(3)}" · ${n} ${n === 1 ? 'conectado' : 'conectados'}. ${p2p ? 'Mandales el link de abajo a tus amigos y tocá PELEAR.' : 'Tocá PELEAR para entrar a la arena.'}`;
    s.classList.add('ok');
  }
  else s.textContent = p2p ? 'Tocá Entrar para abrir la sala y mandales el link de abajo a tus amigos.' : 'Elegí un código y tocá Entrar. Tus amigos tienen que poner el mismo código.';
}
function renderLobby() {
  renderNetStatus();
  const ul = $('mplist'); ul.innerHTML = '';
  if (!NET.named) return;
  for (const pe of NET.named.peers()) {
    const pr = pe.presence || {}, ch = CHARS[pr.ch];
    const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('small');
    a.textContent = String(pr.nm || 'Conectando…').slice(0, 16) + (pe.sameTab ? ' (vos)' : '');
    if (ch) a.style.color = ch.color;
    b.textContent = (ch ? ch.name + ' · ' : '') + (pr.st === 'play' ? 'peleando' : 'en el menú');
    li.append(a, b); ul.appendChild(li);
  }
}
function netMenuPresence() {
  if (typeof NET === 'undefined' || !NET.named || G.state === 'play') return;
  NET.named.presence({ v: 1, st: 'menu', nm: ($('pname-in').value || 'Jugador').trim().slice(0, 16), ch: G.charId, jt: NET.joinT, uid: ACCT.user?.uid || undefined }).catch(() => { });
}
function netSendPlay() {
  if (!NET.named || !G.player) return;
  const p = G.player, now = performance.now();
  NET.hitsOut = NET.hitsOut.filter(h => now - h.t < 2500);
  NET.named.presence(Object.assign(presenceOf(p, faceCharId(p.ch) || G.charId), { wx: atmospherePayload(), rl: amHost() ? G.rules : undefined, jt: NET.joinT, rc: NET.rcOut || undefined, ...(CF_A.MAPAS ? CF_A.MAPAS.netOut() : {}), k: p.kills, d: p.deaths, act: NET.act, acts: (NET.acts = NET.acts.filter(a => Date.now() - a.t < 1600)).map(({ t, ...r }) => r), hits: NET.hitsOut.map(({ t, ...h }) => h), ko: NET.ko, vb: vbPub(), vh: vbPubHit(), abx: window.CF_ABISMO && CF_ABISMO.netOut ? CF_ABISMO.netOut() : undefined })).catch(() => { });
  NET.botFlip = !NET.botFlip;
  if (NET.named.pubAs) for (const d of dummies().concat(roomBots())) if (d.netId) {
    if (d.roomBot && !NET.authOn && NET.botFlip) continue;   // sin servidor propio los bots se publican a la mitad de frecuencia
    if (d.roomBot) d.netHits = d.netHits.filter(h => now - h.t < 2500);
    const BA = d.roomBot && d.netActO ? d.netActO : null;
    NET.named.pubAs(d.netId, Object.assign(presenceOf(d, d.roomBot ? d.ch.id : 'dummy'), { k: 0, d: 0, act: BA ? BA.act : (d.netAct || null), acts: BA ? (BA.acts = BA.acts.filter(a => Date.now() - a.t < 1600)).map(({ t, ...r }) => r) : undefined, hits: d.roomBot ? d.netHits.map(({ t, ...h }) => h) : [], bot: d.roomBot ? 1 : 0 }));
  }
}
function presenceOf(f, ch) {
  return {
    v: 1, gv: GAME_VERSION, em: f.isPlayer && f.action && f.action.isEmote ? f.action.emote : undefined, mp: MAPCUR.id, tr: CF_A.MAPAS && CF_A.MAPAS.inTunnel() ? 1 : 0, cos: f.isPlayer && window.CF_COS ? CF_COS.equippedIds() : undefined, ts: Math.round(performance.now()), st: 'play', nm: f.name, ch, uid: f.isPlayer && ACCT.user?.uid ? ACCT.user.uid : undefined, x: r2(f.pos.x), y: r2(f.pos.y), z: r2(f.pos.z), yw: r2(f.yaw), ry: r2(wrapA(f.model.root.rotation.y)),
    j: JOINTS.map(k => r2(f.anim.x[k])), hp: Math.max(0, Math.round(f.hp)), mh: f.maxHp, al: f.alive ? 1 : 0, aw: f.awak > 0 ? 1 : 0,
    dx: f.isPlayer && NET.destOut ? NET.destOut.filter(e => G.time - e.t < 2.5) : undefined, vc: characterVoicePresence(f), jf: spearReceiptList(f), sd: serializeLostSpear(f), sr: f.spearRecoveryUntil>G.time ? f.spearRecovery : null,
    wxSafe: f.iframes>0||!!f.cineLock||!!f.choreTrack?1:0, ab: f.abyss ? 1 : 0, rft:r2(f.rFlightT||0), sp: f.spearOut ? 1 : 0, sv: f.spearThrown ? 0 : 1, tw: r2(f.twA || 0), rg: f.ragdoll > 0 ? 1 : 0, bl: f.blocking ? 1 : 0, pg: f.isPlayer && NET.named ? (NET.named.isHost ? 1 : Math.round(+NET.named.ping || 0)) : undefined,
  };
}
// antitrampas: sin servidor no se puede impedir que alguien mande datos falsos, pero cada cliente se defiende de lo imposible:
// golpes desde muy lejos, ráfagas de golpes o daño que ninguna habilidad puede hacer y teletransportes. Quien insiste queda ignorado un rato.
// el abismo esta lejos del mapa (cueva bajo el mar): sus coordenadas tambien son validas
const NET_ZMAX = Math.max(420, ...ABY_PTS.map(q => q[1]), ABY.z + ABY.R) + 60, NET_YMIN = Math.min(-60, ABY.y - 40);
function sanePr(pr) {   // lo que manda otro jugador nunca se usa tal cual: números dentro de rango y nombres limpios
  const c = (v, a, b, d = 0) => { v = +v; return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  if (pr.x != null) { pr.x = c(pr.x, -420, 420); pr.z = c(pr.z, -420, NET_ZMAX); pr.y = c(pr.y, NET_YMIN, 500); }
  pr.ab = pr.ab ? 1 : 0;
  pr.hp = c(pr.hp, 0, 600); pr.mh = c(pr.mh, 1, 600, 100); pr.k = c(pr.k, 0, 9999); pr.d = c(pr.d, 0, 9999);
  if (typeof pr.nm === 'string') pr.nm = pr.nm.replace(/[<>&\u0000-\u001f]/g, '').slice(0, 16);
  if (pr.uid != null && !validAccountId(pr.uid)) delete pr.uid;
  if (pr.jt != null) { const j = +pr.jt; pr.jt = Number.isFinite(j) && j > Date.now() - 864e5 && j < Date.now() + 120000 ? j : Date.now(); }
  return pr;
}
function cheatOf(px) { return px.cheat || (px.cheat = { hit: [], dmg: [], tp: [], mute: 0, lx: null, lz: null, lt: 0 }); }
function cheatStrike(px, why) {
  const ck = cheatOf(px), now = performance.now(); ck.tp = ck.tp.filter(t => now - t < 15000); ck.tp.push(now);
  if (ck.tp.length >= 4 && ck.mute < now) { ck.mute = now + 20000; ck.tp.length = 0; try { addFeedText(`⚠ ${px.name}: ${why} (ignorado 20 s)`, '#ffb020'); } catch (e) { } }
}
// El servidor es el árbitro de la sala (js/arbitro.js): decide qué golpes valen, la vida real, las muertes y las bajas.
// Aquí el juego acepta sus correcciones. Una vida más baja que la tuya se aplica siempre; la tuya nunca se sube desde fuera.
function netAuth(m) {
  if (m.bh !== undefined && m.hello === undefined && m.host === undefined) { NET.botHost = !!m.bh; return; }   // solo aviso de quién simula los bots
  if (m.hello || m.host !== undefined) {
    NET.authOn = true; if (m.hello) { NET.authLog = 'activo'; if (typeof m.pub === 'boolean') NET.public = m.pub; if (window.CF_ABISMO && CF_ABISMO.setSim) CF_ABISMO.setSim(!!m.sim); }
    if (m.bh !== undefined) NET.botHost = !!m.bh;
    if (m.host !== undefined) { NET.srvHost = !!m.host; if (m.hello === undefined && m.host) addFeedText('Ahora eres el anfitrión de la sala', '#d7ff2f'); }
    if (m.hello) return;
  }
  NET.authOn = true; NET.authAt = performance.now();
  const p = G.player; if (!p || G.state !== 'play' || G.over) return;
  if (Number.isFinite(+m.k)) p.kills = +m.k;
  if (Number.isFinite(+m.d)) p.deaths = +m.d;
  if (m.al === 0 && p.alive && Number.isFinite(+m.hp)) { p.hp = 0; kill(p, null); NET.authLog = 'el servidor te dio por vencido'; return; }
  if (Number.isFinite(+m.hp) && p.alive && +m.hp < p.hp - .4) {
    p.hp = Math.max(0, +m.hp); p.flashT = Math.max(p.flashT || 0, .12); NET.authLog = m.why || 'vida corregida';
    if (m.why) addFeedText('Servidor: ' + m.why, '#ffb020');
    if (p.hp <= 0) kill(p, null);
  }
}
function applyNetHit(px, h, p = G.player) {
  if (!p || !p.alive || VB.on || px.otherMap) return;
  { const ck = cheatOf(px), now = performance.now();
    if (ck.mute > now || !px.alive) return;
    if (px.pos.distanceTo(p.pos) > 70) { cheatStrike(px, 'golpes desde muy lejos'); return; }
    ck.hit = ck.hit.filter(t => now - t < 1000); ck.dmg = ck.dmg.filter(e => now - e.t < 2000);
    const d0 = clamp(+h.dm || 0, 0, 60);
    if (ck.hit.length >= 14) { cheatStrike(px, 'demasiados golpes por segundo'); return; }
    if (ck.dmg.reduce((a, e) => a + e.d, 0) + d0 > 150) { cheatStrike(px, 'daño imposible'); return; }
    ck.hit.push(now); ck.dmg.push({ t: now, d: d0 }); }
  const dmg=clamp(+h.dm||0,0,60),shot=px.ch===CHARS.javi&&dmg>0&&dmg<=16&&h.sf&&typeof h.sf.id==='string'&&h.sf.id.length<=100&&h.sf.id.startsWith(spearActorId(px)+':')&&spearVector(h.sf.dir)?h.sf:null;
  const lethal=shot&&p.hp<=dmg;
  const hit=applyHit(px, p, {
    fromNet: true, dmg, kb: lethal?3.2:clamp(+h.kb || 0, -30, 50), up: lethal?1.2:clamp(+h.up || 0, 0, 30), ragdoll: clamp(+h.rg || 0, 0, 3),
    stun: clamp(+h.st || 0, 0, 3), guardBreak: !!h.gb, freeze: clamp(+h.fz || 0, 0, 2.5), dir: new V3(+h.dx || 0, 0, +h.dz || 0),
    color: typeof h.c === 'string' && /^#[0-9a-f]{6}$/i.test(h.c) ? h.c : px.ch.color,
  });
  if(shot&&hit===true&&!p.alive)confirmSpearFinisher(px,p,shot);
}

function replayAct(px, a) {
  if (!px.alive || !a) return;
  if (a.k === 'abh') { if (window.CF_ABISMO && CF_ABISMO.netHit) CF_ABISMO.netHit(px, a); return; }
  if(a.k==='r'){
    if(px.ch!==CHARS.sekza)return;
    if(a.mode==='flight')startSekzaFlight(px,true);
    else if(a.mode==='gulls'&&Array.isArray(a.ids)&&a.ids.length<=3&&a.ids.every(x=>typeof x==='string'&&x.length<80)&&Array.isArray(a.from)&&a.from.length===3&&a.from.every(x=>Number.isFinite(x)&&Math.abs(x)<160)&&Number.isFinite(a.seed))summonSekzaGulls(px,true,a);
    return;
  }
  try {
    NETREP.on = true;   // lo que rompe un jugador remoto llega en sus propios paquetes de destrucción
    if (px.action) endAction(px);
    if (a.k === 'e') { if (window.CF_EMOTES) CF_EMOTES.play(px, a.i | 0, true); }
    else if (a.k === 'm') { px.comboIdx = clamp(a.i | 0, 0, 3); px.comboTimer = 1; px.m1cd = 0; doM1(px, !!a.u, !!a.s); }
    else if (a.k === 's') { const i = clamp(a.i | 0, 0, 3); px.cd[i] = 0; px.awak = a.w ? Math.max(px.awak, 1) : 0; px._fistKit = a.x ? 1 : 0; try { useSkill(px, i); } finally { px._fistKit = 0; } }   // x: usa el kit de puños (Javi sin lanza)
    else if (a.k === 'u') { px.ult = 100; runUlt(px); if (involvesPlayerNear(px)) miniCut(px); }
    else if (a.k === 'c') {
      const D = CHORE[a.d], vid = a.v, victim = vid === NET.myPeer ? G.player : NET.proxies.get(vid) || dummies().find(d => d.netId === vid);
      if (D && victim && victim.alive && victim !== px && !victim.cineLock && !px.cineLock && !(G.chore && (G.chore.f === victim || G.chore.tg === victim))) runChore(px, victim, D);
    }
  } catch (e) { console.warn("replayAct", a && a.k, e); } finally { NETREP.on = false; }
}
function removeProxy(peer) {
  const px = NET.proxies.get(peer); if (!px) return;
  px.dispose(); const k = G.fighters.indexOf(px); if (k >= 0) G.fighters.splice(k, 1); NET.proxies.delete(peer);
}
// instantáneas de un jugador remoto: guarda los paquetes con la hora del emisor y devuelve el estado interpolado para dibujar
const NET_OLD = /[?&]net=old/.test(location.search);   // ?net=old: suavizado simple de la versión anterior (para comparar)
function netInterp(px, pr, nowMs) {
  const B = px.netBuf || (px.netBuf = []);
  if (px.netSeen !== pr) {
    px.netSeen = pr; px.netCnt = (px.netCnt || 0) + 1;
    const ts = isFinite(+pr.ts) ? +pr.ts : nowMs, last = B[B.length - 1];
    if (last && ts < last.ts - 2000) { B.length = 0; px.netOff = null; }          // el emisor recargó la página
    const lst = B[B.length - 1];
    if (!lst || ts > lst.ts) {
      const smp = nowMs - ts;
      if (px.netOff == null) px.netOff = smp; else if (smp < px.netOff) px.netOff = smp; else px.netOff += (smp - px.netOff) * .003;
      if (lst) { const iv = ts - lst.ts, jit = Math.abs((nowMs - lst.rx) - iv); px.netIv = px.netIv == null ? iv : px.netIv * .9 + iv * .1; px.netJit = (px.netJit || 0) * .9 + jit * .1; }
      B.push({ ts, rx: nowMs, x: +pr.x || 0, y: +pr.y || 0, z: +pr.z || 0, yw: +pr.yw || 0, ry: isFinite(+pr.ry) ? +pr.ry : (+pr.yw || 0), j: Array.isArray(pr.j) ? pr.j.map(Number) : null });
      while (B.length > 40 || (B.length > 2 && B[0].ts < ts - 1500)) B.shift();
    }
  }
  const n = B.length; if (!n) return { x: +pr.x || 0, y: +pr.y || 0, z: +pr.z || 0, yw: +pr.yw || 0, ry: +pr.ry || 0, j: null };
  const delay = clamp((px.netIv || 50) * 1.8 + (px.netJit || 0) * 2.2, NET.local ? 50 : 90, 300), rt = nowMs - px.netOff - delay;
  let a = B[0], b = null;
  for (let i = 0; i < n; i++) { if (B[i].ts <= rt) a = B[i]; else { b = B[i]; break; } }
  if (!b) {   // se quedó sin paquetes nuevos: sigue un instante con la última velocidad y se queda quieto
    const p0 = n > 1 ? B[n - 2] : a, dtS = Math.max(.02, (a.ts - p0.ts) / 1000), ex = Math.min(.15, Math.max(0, (rt - a.ts) / 1000));
    let vx = (a.x - p0.x) / dtS, vz = (a.z - p0.z) / dtS; if (Math.hypot(vx, vz) > 14) { vx = 0; vz = 0; }
    return { x: a.x + vx * ex, y: a.y, z: a.z + vz * ex, yw: a.yw, ry: a.ry, j: a.j };
  }
  let u = clamp((rt - a.ts) / Math.max(1, b.ts - a.ts), 0, 1);
  if (Math.hypot(b.x - a.x, b.z - a.z) > 8) u = u < .5 ? 0 : 1;   // teletransporte real (Engaño, Gancho…): no se arrastra por el medio
  const L = (p, q) => p + (q - p) * u;
  let j = a.j; if (a.j && b.j && a.j.length === b.j.length) j = a.j.map((v, i) => L(v, b.j[i]));
  return { x: L(a.x, b.x), y: L(a.y, b.y), z: L(a.z, b.z), yw: angLerp(a.yw, b.yw, u), ry: angLerp(a.ry, b.ry, u), j };
}
function proxyUpdate(px, dt) {
  const pr = px.net; if (!pr) return;
  const was = px.alive;
  px.alive = !!pr.al; px.hp = +pr.hp || 0; px.maxHp = +pr.mh || 100; px.kills = +pr.k || 0; px.deaths = +pr.d || 0; px.awak = pr.aw ? 1 : 0;
  if (pr.rg) { if (!px.rgT0) px.rgT0 = performance.now(); } else px.rgT0 = 0;
  px.ragdoll = pr.rg && performance.now() - px.rgT0 < 3200 ? 1 : 0; px.blocking = !!pr.bl;   // un ragdoll no dura mas de ~3 s: si el emisor se quedo congelado, no es inmune
  if (window.CF_COS) CF_COS.remote(px, pr.cos);
  if (was && !px.alive) burst(chestOf(px), 30, '#dddddd', 5, .3, .8, -.2);
  // interpolación de instantáneas, como en un servidor normal: se guardan los últimos paquetes y cada jugador remoto se dibuja
  // ~100 ms en el pasado, entre dos paquetes reales, así los tirones de la red no se ven como saltos
  const ab = !!pr.ab, abChanged = ab !== !!px.abyss; px.abyss = ab;
  if (abChanged) { px.netBuf = null; px.netOff = null; px.swim = false; }   // entra o sale del abismo: sin mezclar posiciones de los dos mundos
  const nowMs = performance.now(), st = NET_OLD ? null : netInterp(px, pr, nowMs);
  { const ck = cheatOf(px), nx = +pr.x || 0, nz = +pr.z || 0;
    if (!abChanged && ck.ab === ab && ck.lx != null && px.alive && !px.sceneLock && nowMs - ck.lt < 600 && Math.hypot(nx - ck.lx, nz - ck.lz) > 46) cheatStrike(px, 'teletransporte');
    ck.lx = nx; ck.lz = nz; ck.lt = nowMs; ck.ab = ab; }
  if (px.sceneLock) { px.flashT -= dt; return; }   // una escena lo está moviendo
  if (NET_OLD) {
    _tp.set(+pr.x || 0, +pr.y || 0, +pr.z || 0);
    if (px.pos.distanceTo(_tp) > 6) px.pos.copy(_tp); else px.pos.lerp(_tp, Math.min(1, dt * 14));
    px.yaw = angLerp(px.yaw, +pr.yw || 0, Math.min(1, dt * 14));
    if (Array.isArray(pr.j)) JOINTS.forEach((k, i) => { const v = +pr.j[i]; if (isFinite(v)) px.anim.x[k] += (v - px.anim.x[k]) * Math.min(1, dt * 18); });
  } else {
    px.pos.set(st.x, st.y, st.z);
    px.yaw = st.yw;
    if (st.j) JOINTS.forEach((k, i) => { const v = st.j[i]; if (isFinite(v)) px.anim.x[k] = v; });
  }
  px.anim.apply();
  const m = px.model;
  if (m.gripRot && isFinite(+pr.tw)) m.gripRot.rotation.x += +pr.tw;
  m.root.position.copy(px.pos);
  m.root.rotation.y = st ? st.ry : (isFinite(+pr.ry) ? angLerp(m.root.rotation.y, +pr.ry, Math.min(1, dt * 14)) : px.yaw);
  m.root.visible = px.alive && !px.otherMap;
  if (px.spear) { const out = !!pr.sp; if (out !== px.spearOut) setSpear(px, out); px.spear.visible = !!pr.sv && !ownsMissingSpear(px); }
  px.flashT -= dt;
  px.rFlightT=clamp(+pr.rft||0,0,6);
  const fl = Math.max(0, px.flashT) / .12;
  m.mats.forEach(x => { if (fl > 0) x.emissive.setRGB(fl * .9, fl * .9, fl * .9); else if (px.awak) x.emissive.set(px.ch.color).multiplyScalar(.15); else x.emissive.setRGB(0, 0, 0); });
  if (px.action) updateAction(px, dt);
  eyeGlow(m, !!(px.action && px.action.eyes) || px.awak > 0, performance.now() / 1000); updateWings(px, m, .016, performance.now() / 1000); updateSpiderLegs(px, m, .016, performance.now() / 1000); updateSwordFire(px, m, .016, performance.now() / 1000); updateVerity(px, m, .016, performance.now() / 1000); updateJesuluto(px, m, .016, performance.now() / 1000); updateCapitan(px, m, .016, performance.now() / 1000);
  updateAura(px, dt, performance.now() / 1000);
  updateFace(px, dt);
}
let _dbgT = 0;
function netDebug(dt) {
  let el = document.getElementById('netdbg');
  if (!G.netDbg) { if (el) el.style.display = 'none'; return; }
  if (!el) { el = document.createElement('pre'); el.id = 'netdbg'; el.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:60;margin:0;padding:8px 10px;background:rgba(0,0,0,.72);color:#9dff9d;font:11px/1.35 ui-monospace,Consolas,monospace;border-radius:6px;pointer-events:none;max-width:60vw;white-space:pre'; document.body.appendChild(el); }
  el.style.display = 'block'; G.fpsEst = G.fpsEst ? G.fpsEst * .95 + (1 / Math.max(dt, .001)) * .05 : 60; _dbgT -= dt; if (_dbgT > 0) return; _dbgT = .5;
  const L = [`RED (F3 oculta)  modo: ${NET_OLD ? 'viejo' : 'interpolación'}${NET.local ? ' · servidor local' : ''}  ping: ${NET.named && NET.named.ping != null ? Math.round(NET.named.ping) + ' ms' : '?'}  fps: ${Math.round(GFX.fps)}  calidad: ${GFX.names[GFX.level]}${GFX.auto ? ' (auto)' : ''} · resolución x${renderer.getPixelRatio()}${GFX.soft ? ' · SIN ACELERACIÓN GRÁFICA' : ''}`];
  for (const px of NET.proxies.values()) {
    const now = performance.now(), dtc = px.dbgT ? (now - px.dbgT) / 1000 : 0, rate = dtc > 0 ? ((px.netCnt || 0) - (px.dbgN || 0)) / dtc : 0; px.dbgT = now; px.dbgN = px.netCnt || 0;
    L.push(`${(px.name || '?').slice(0, 12).padEnd(12)} ${rate.toFixed(0).padStart(2)} paq/s  ${NET.named && NET.named.rtcOpen && NET.named.rtcOpen(px.peer) ? 'DIRECTO' : 'relay (' + (NET.named && NET.named.rtcInfo ? NET.named.rtcInfo(px.peer) : '?') + ')'}  intervalo ${Math.round(px.netIv || 0)} ms  jitter ${Math.round(px.netJit || 0)} ms  búfer ${px.netBuf ? px.netBuf.length : 0}  retraso ${Math.round(clamp((px.netIv || 50) * 2 + (px.netJit || 0) * 2, NET.local ? 60 : 90, 300))} ms`);
  }
  L.push(`árbitro: ${NET.authOn ? 'SERVIDOR (valida golpes, vida, muertes y bajas)' + (NET.authLog ? ' · último aviso: ' + NET.authLog : '') : 'ninguno (sin servidor: cada jugador se cree a sí mismo)'}`);
  if (L.length === 2) L.push('(sin otros jugadores)');
  el.textContent = L.join('\n');
}
function netTick(dt) {
  netRulesSync();
  if (NET.named && !NET.authOn) {   // sin servidor propio (conexión por relés): las opciones de la sala las manda quien la creó dentro de su presencia
    let best = null; for (const pe of NET.named.peers()) { const rc = pe.presence && pe.presence.rc, jt = pe.presence && +pe.presence.jt; if (rc && typeof rc === 'object' && (!best || jt < best.jt)) best = { jt, rc }; }
    NET.cfg = best ? { bots: !!best.rc.b, max: clamp(+best.rc.m || 10, 2, 10) } : null;
  }
  roomBotsSync(dt);
  netDebug(dt);
  if (!NET.named) return;
  const peers = NET.named.peers(), seen = new Set();
  const me = peers.find(pe => pe.sameTab); if (me) NET.myPeer = me.peer;
  for (const pe of peers) {
    if (pe.sameTab) continue;
    const pr = sanePr(pe.presence || {});
    const chDef = pr.ch === 'dummy' ? DUMMY_CH : (CHARS[pr.ch] || CHARS.javi);
    if (pr.st !== 'play' || !chDef || typeof pr.x !== 'number') continue;
    seen.add(pe.peer);
    let px = NET.proxies.get(pe.peer);
    if (px && px.ch !== chDef) { removeProxy(pe.peer); px = null; }
    if (!px) {
      const sk = NET.skins[pe.peer];
      px = new Fighter({ name: String(pr.nm || 'Amigo').slice(0, 16), ch: chDef, remote: true, peer: pe.peer, skin: sk ? sk.c : null, slim: sk ? sk.slim : false });
      px.pos.set(+pr.x || 0, +pr.y || 0, +pr.z || 0); NET.proxies.set(pe.peer, px); G.fighters.push(px);
      NET.lastHit[pe.peer] = Math.max(0, ...(Array.isArray(pr.hits) ? pr.hits.map(h => +h.s || 0) : [0]));
      NET.lastAct[pe.peer] = pr.act ? pr.act.s : 0;
      px.actSeen = new Set((Array.isArray(pr.acts) ? pr.acts : []).concat(pr.act ? [pr.act] : []).map(a => (a.ss || '') + ':' + a.s));   // lo que ya venia en curso al entrar no se repite
      NET.lastKo[pe.peer] = pr.ko ? pr.ko.n : 0;
      px.characterVoiceSeen=pr.vc?.k!=="clippy/hola"&&Number.isSafeInteger(pr.vc?.s)?pr.vc.s:0;
      if (!NET.known.has(pe.peer)) { NET.known.add(pe.peer); if (!/-b\d+$/.test(pe.peer)) addFeedText(`${px.name} entró a la arena`, px.ch.color); }
    }
    px.net = pr;
    if (!px.verWarned && !/-b\d+$/.test(pe.peer)) {   // otro jugador con otra version (o con cache vieja): se avisa una vez, es la causa mas comun de modelos o habilidades que no se ven
      if (pr.gv !== GAME_VERSION) { px.verWarned = true; addFeedText(`${px.name} tiene ${pr.gv ? 'la versión ' + String(pr.gv).slice(0, 12) : 'una versión antigua'} (tú ${GAME_VERSION}): recarguen con Ctrl+F5`, '#ffb020'); }
      else if (pr.ch !== 'dummy' && !CHARS[pr.ch]) { px.verWarned = true; addFeedText(`${px.name} usa un personaje que tu versión no tiene: recarga con Ctrl+F5`, '#ffb020'); }
    }
    if (window.CF_EMOTES) {   // respaldo del emote: si el aviso de la accion se perdio por la red, el estado de presencia lo reproduce igual
      if (Number.isInteger(pr.em)) { if (px._emLast !== pr.em) { px._emLast = pr.em; if (!px.action && px.alive) CF_EMOTES.play(px, pr.em, true); } } else px._emLast = null;
    }
    { const pm = ['A', 'J', 'B'].includes(pr.mp) ? pr.mp : 'A'; if (px.mapId !== pm) { px.mapId = pm; px.cheat = null; px.netBuf = null; px.netOff = null; }   // cambió de mapa: se reinician sus datos de red (no es un teletransporte)
      px.otherMap = pm !== MAPCUR.id || !!pr.tr; }
    if (pr.abx && window.CF_ABISMO && CF_ABISMO.netIn) { px.abyss = !!pr.ab; CF_ABISMO.netIn(px, pr.abx); }
    receiveCharacterVoice(px,pr);
    synchronizeSpearDrops(px,pr);
    if (Array.isArray(pr.hits)) {
      // golpes dirigidos a mí o a uno de mis dummies
      const mineD = {}; for (const d of dummies().concat(roomBots())) if (d.netId) mineD[d.netId] = d;
      const mine = pr.hits.filter(h => h && (h.to === NET.myPeer || mineD[h.to]) && +h.s > (NET.lastHit[pe.peer] || 0)).sort((a, b) => a.s - b.s);
      for (const h of mine) { NET.lastHit[pe.peer] = +h.s; applyNetHit(px, h, h.to === NET.myPeer ? G.player : mineD[h.to]); }
    }
    { const list = Array.isArray(pr.acts) ? pr.acts : (pr.act ? [pr.act] : []), seenA = px.actSeen || (px.actSeen = new Set());
      for (const a of list.slice().sort((x, y) => (x.s || 0) - (y.s || 0))) {
        const key = (a.ss || '') + ':' + a.s; if (seenA.has(key)) continue;
        seenA.add(key); if (seenA.size > 80) seenA.delete(seenA.values().next().value);
        NET.lastAct[pe.peer] = a.s; { const dl = clamp(((px.netIv || 40) * 1.8 + (px.netJit || 0) * 2.2) / 1000, .05, .16), pxx = px, aa = a; later(dl, () => { if (!pxx._disposed && NET.proxies.get(pxx.peer) === pxx) replayAct(pxx, aa); }); }   // los ataques de otros se ven con el mismo retraso que su cuerpo (antes salian adelantados)
      } }
    if (pr.ko && pr.ko.n !== NET.lastKo[pe.peer]) {
      NET.lastKo[pe.peer] = pr.ko.n;
      const killer = pr.ko.by && pr.ko.by === NET.myPeer ? G.player : NET.proxies.get(pr.ko.by) || null;
      addFeed(killer, px);
      if (killer && killer === G.player) { javiSpeak(killer,'kill'); if (NETPUB() && window.CF_EMOTES) CF_EMOTES.onPublicKill(px); if (!NET.authOn) G.player.kills++;   // con servidor árbitro la cuenta de bajas la manda él (netAuth)   // solo kills a jugadores reales en salas PUBLICAS desbloquean emotes
 G.player.ult = Math.min(100, G.player.ult + 20 * ULT_GAIN); showBanner('K.O.', '#d7ff2f', `${px.name} fuera`); G.slowT = .3; sfx('ko', px.pos); }
    }
  }
  if (CF_A.MAPAS) CF_A.MAPAS.netIn(peers);
  for (const peer of [...NET.proxies.keys()]) if (!seen.has(peer)) { const px = NET.proxies.get(peer); if (!/-b\d+$/.test(peer)) addFeedText(`${px.name} salió`, '#9aa0b8'); NET.known.delete(peer); removeProxy(peer); }
  for (const px of NET.proxies.values()) proxyUpdate(px, dt);
  NET.sendT -= dt;
  if (NET.sendT <= 0) { NET.sendT = NET_OLD && NET.room === 'relay' ? 1 / 15 : 1 / (NET.local ? 30 : 25); netSendPlay(); }
}

// ================= Reglas de la partida (panel del anfitrión) =================
// Las fija el anfitrión (o tú solo, contra bots) y viajan en su presencia: todos los jugadores de la sala las aplican.
const RULES_DEF = { noCd: false, ultHit: false, ultInf: false, god: false, botsOff: false, dmg: 1, spd: 1, grav: 1, dest: 1, rag: 1, p: { u: 0, a: 0, h: 0, r: 0 } };
G.rules = JSON.parse(JSON.stringify(RULES_DEF)); G.rulesSeen = null;
function rulesClean(r) {
  const o = JSON.parse(JSON.stringify(RULES_DEF)); if (!r || typeof r !== 'object') return o;
  for (const k of ['noCd', 'ultHit', 'ultInf', 'god', 'botsOff']) o[k] = !!r[k];
  o.dmg = clamp(+r.dmg || 1, 1, 999); o.spd = clamp(+r.spd || 1, 1, 3); o.grav = clamp(+r.grav || 1, .1, 1.5); o.dest = clamp(r.dest == null ? 1 : +r.dest, 0, 3); o.rag = clamp(+r.rag || 1, .5, 4);
  const q = r.p || {}; for (const k of ['u', 'a', 'h', 'r']) o.p[k] = clamp(q[k] | 0, 0, 1e9);
  return o;
}
function rulesSave() { try { localStorage.setItem('bsb_rules', JSON.stringify(G.rules)); } catch (e) { } }
function rulesStart() {
  let saved = null; if (!G.mp) { try { saved = JSON.parse(localStorage.getItem('bsb_rules') || 'null'); } catch (e) { } }
  G.rules = rulesClean(saved); G.rulesSeen = Object.assign({}, G.rules.p); rulesUISync();
}
// acciones de un solo uso (botones): cada cliente las ejecuta en su propio jugador
function rulesPulse(k) {
  const pl = G.player; if (!pl || !pl.alive || G.state !== 'play') return;
  if (k === 'u') { pl.ult = 100; popText(chestOf(pl), '¡ULTI LISTA!', '#d7ff2f', 24); sfx('tp', pl.pos); }
  else if (k === 'a') { if (pl.awak <= 0 && !pl.capRandi && !pl.mount) { pl.ult = 100; runUlt(pl); } }
  else if (k === 'h') { for (const g of G.fighters) if (!g.remote && g.alive && !g.dummy) { g.hp = g.maxHp; burst(chestOf(g), 12, '#7dff6a', 5, .16, .5, .3); } popText(chestOf(pl), '¡VIDA AL MÁXIMO!', '#7dff6a', 22); }
  else if (k === 'r') { destRestore(true); popText(chestOf(pl), 'Escenario reparado', '#9fd3ff', 18); }
}
function rulesApply(r) {
  const n = rulesClean(r);
  if (G.rulesSeen) for (const k of ['u', 'a', 'h', 'r']) if (n.p[k] > (G.rulesSeen[k] || 0)) rulesPulse(k);
  G.rulesSeen = Object.assign({}, n.p); G.rules = n; rulesUISync();
}
function netRulesSync() {
  if (!G.mp || !NET.named || amHost() || NET.public) return;   // en salas públicas nadie cambia reglas
  let best = null, bj = Infinity; for (const pe of NET.named.peers()) { const pr = pe.presence; if (!pr || !pr.rl) continue; const jt = +pr.jt || Infinity; if (jt <= bj) { bj = jt; best = pr.rl; } }
  if (best) { const sig = JSON.stringify(best); if (sig !== G.rulesSig) { G.rulesSig = sig; rulesApply(best); } }
}
function rulesHostPulse(k) { G.rules.p[k]++; G.rulesSeen[k] = G.rules.p[k]; rulesPulse(k); rulesSave(); }
(function rulesBuild() {
  const box = document.querySelector('#dpanel .obox'); if (!box) return;
  const st = document.createElement('style');
  st.textContent = '#rules-controls{align-self:stretch;text-align:left;border-top:1px solid var(--line);padding-top:14px;display:grid;gap:10px}#rules-controls h3{font-family:var(--display);font-size:23px;letter-spacing:.06em;margin:0}'
    + '#rules-controls button,#rules-controls select{font:inherit;border:1px solid #446271;border-radius:3px;background:#172637;color:#eff5f7;padding:8px 10px;cursor:pointer}#rules-controls button:hover:not(:disabled){background:#29445b;border-color:#a2e8ec}'
    + '#rules-controls .rl-check{display:flex;align-items:center;gap:8px;font-size:14px}#rules-controls .rl-check small{margin-left:auto;color:var(--muted);font-size:12px;text-align:right}#rules-controls input[type=checkbox]{accent-color:#d7ff2f;width:16px;height:16px}'
    + '#rules-controls .rl-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}#rules-controls .rl-grid label{display:grid;gap:5px;font-size:13px;color:#b7c8d5}#rules-controls .rl-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}#rules-controls p{font-size:12px;line-height:1.5;color:var(--muted);margin:0}#rules-controls :disabled{opacity:.45;cursor:not-allowed}';
  document.head.appendChild(st);
  const chk = (id, t, sm) => '<label class="rl-check"><input type="checkbox" id="rl-' + id + '"> ' + t + (sm ? ' <small>' + sm + '</small>' : '') + '</label>';
  const sel = (id, t, o) => '<label>' + t + '<select id="rl-' + id + '">' + o.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select></label>';
  const sec = document.createElement('section'); sec.id = 'rules-controls'; sec.setAttribute('aria-labelledby', 'rl-title');
  sec.innerHTML = '<h3 id="rl-title">REGLAS DE LA SALA</h3><p id="rl-msg">Solo el anfitrión las cambia; se aplican a todos los jugadores de la sala.</p>'
    + chk('noCd', 'Sin enfriamientos', 'las habilidades siempre listas') + chk('ultHit', 'Ulti con un solo golpe', 'un golpe llena la barra') + chk('ultInf', 'Ulti infinita', 'el despertar nunca se acaba')
    + chk('god', 'Vida infinita', 'no pierdes vida') + chk('botsOff', 'Bots quietos', 'no atacan ni se mueven')
    + '<div class="rl-grid">' + sel('dmg', 'Daño que haces', [[1, 'Normal'], [2, '×2'], [5, '×5'], [20, '×20'], [999, 'Mata de un golpe']]) + sel('spd', 'Velocidad', [[1, 'Normal'], [1.5, '×1.5'], [2, '×2'], [3, '×3']])
    + sel('grav', 'Gravedad', [[1, 'Normal'], [.5, 'Baja'], [.25, 'Muy baja']]) + sel('dest', 'Destrucción', [[0, 'Apagada'], [1, 'Normal'], [2, 'Fuerte'], [3, 'Total']]) + sel('rag', 'Fuerza del ragdoll', [[1, 'Normal'], [1.5, 'Más'], [2.5, 'Mucha'], [4, 'Extrema']]) + '</div>'
    + '<div class="rl-btns"><button type="button" id="rl-u">Dar ulti</button><button type="button" id="rl-a">Despertar ya</button><button type="button" id="rl-h">Curar a todos</button><button type="button" id="rl-r">Reparar el escenario</button></div>'
    + '<button type="button" id="rl-reset">Restablecer reglas</button>';
  const bt = box.querySelector('.btns'); if (bt) bt.after(sec); else box.appendChild(sec);
  const hostOk = () => canUsePanel();
  for (const id of ['noCd', 'ultHit', 'ultInf', 'god', 'botsOff']) $('rl-' + id).addEventListener('change', e => { if (!hostOk()) return rulesUISync(); G.rules[id] = e.target.checked; rulesSave(); });
  for (const id of ['dmg', 'spd', 'grav', 'dest', 'rag']) $('rl-' + id).addEventListener('change', e => { if (!hostOk()) return rulesUISync(); G.rules[id] = rulesClean(Object.assign({}, G.rules, { [id]: +e.target.value }))[id]; rulesSave(); rulesUISync(); });
  for (const k of ['u', 'a', 'h', 'r']) $('rl-' + k).addEventListener('click', () => { if (hostOk()) rulesHostPulse(k); });
  $('rl-reset').addEventListener('click', () => { if (!hostOk()) return; const p0 = G.rules.p; G.rules = rulesClean(null); G.rules.p = p0; rulesSave(); rulesUISync(); });
})();
function rulesUISync() {
  if (!$('rl-noCd')) return; const R = G.rules;
  for (const id of ['noCd', 'ultHit', 'ultInf', 'god', 'botsOff']) $('rl-' + id).checked = !!R[id];
  for (const id of ['dmg', 'spd', 'grav', 'dest', 'rag']) $('rl-' + id).value = String(R[id]);
}
function rulesUI(ok) {
  if (!$('rl-noCd')) return; rulesUISync();
  $('rules-controls').querySelectorAll('input,select,button').forEach(b => { b.disabled = !ok; });
  $('rl-msg').textContent = ok ? 'Se aplican a todos los jugadores de la sala y se guardan para tus partidas contra bots.' : 'Solo el anfitrión de la sala (el que entró primero) puede cambiar las reglas. Las que ves son las suyas.';
}
// ================= Dummies de entrenamiento y panel del anfitrión =================
// En la sala con amigos solo el anfitrión (el que entró primero) los crea; los demás los ven y les pegan.
const DUMMY_NAMES = { idle: 'Dummy quieto', attack: 'Dummy que pega', block: 'Dummy que bloquea' };
const dummies = () => G.fighters.filter(f => f.dummy);
// ===== Bots de sala: la sala se llena con bots hasta 10 y cada jugador que entra se lleva el lugar de un bot. Los simula quien lleva más tiempo dentro
// (el servidor lo avisa) y viajan como cualquier otro jugador. No suman ni dan bajas. =====
const roomBots = () => G.fighters.filter(f => f.roomBot);
function dropRoomBot(b) { if (b.netId && NET.named && NET.named.dropAs) NET.named.dropAs(b.netId); try { ringAt(new V3(b.pos.x, b.pos.y, b.pos.z), b.ch.color, 2.4, .4); } catch (e) { } b.dispose(); const i = G.fighters.indexOf(b); if (i >= 0) G.fighters.splice(i, 1); }
function spawnRoomBot() {
  const ch = CHAR_IDS[Math.random() * CHAR_IDS.length | 0], ov = {};
  if (Math.random() < .6) ov.shirt = SHIRTS[Math.random() * SHIRTS.length | 0];
  const usados = new Set(roomBots().map(b => b.name)), libres = BOT_NAMES.map(n => ('BOT ' + n).slice(0, 16)).filter(n => !usados.has(n)), nombre = libres.length ? libres[Math.random() * libres.length | 0] : 'BOT ' + (NET.botSeq + 1);   // cada bot con un nombre distinto
  const f = new Fighter({ name: nombre, char: ch, skinOv: ov, lvlVar: rand(-.8, .8) });
  f.roomBot = true; f.netId = NET.named.myId + '-b' + (++NET.botSeq); f.netHits = []; f.netSeq = 0;
  G.fighters.push(f); respawn(f); f.iframes = 0; applyAiLevels();
}
let roomBotT = 0;
function roomBotsSync(dt) {
  const on = G.mp && NET.named && NET.cfg && NET.cfg.bots && amCoord() && NET.named.pubAs && NET.named.dropAs && G.state === 'play' && G.player;
  if (!on) { for (const b of roomBots()) dropRoomBot(b); return; }
  roomBotT -= dt; if (roomBotT > 0) return; roomBotT = 1;
  const humans = 1 + [...NET.proxies.keys()].filter(id => !/-[db]\d+$/.test(id)).length, want = clamp((NET.cfg.max || 10) - humans, 0, 9), have = roomBots();
  for (let i = have.length; i < want; i++) spawnRoomBot();
  for (let i = have.length - 1; i >= want; i--) dropRoomBot(have[i]);
}
// coordinador de la sala: simula los bots, lleva el reloj de mapas y los eventos (con servidor lo elige él; sin servidor, el que lleva más tiempo dentro)
function amCoord() { if (!G.mp || !NET.named) return false; if (NET.authOn) return !!NET.botHost; return NET.room === 'relay' && amHost(); }
function amHost() {
  if (!G.mp) return true;
  if (NET.authOn && NET.srvHost != null) return NET.srvHost && !NET.public;   // con servidor él decide: en las públicas nadie es anfitrión
  if (!NET.named || NET.room !== 'relay') return false;
  let min = NET.joinT;
  for (const pe of NET.named.peers()) { const jt = pe.presence && +pe.presence.jt; if (jt && jt < min) min = jt; }
  return min === NET.joinT;
}
// el panel (dummies, reglas, clima) es libre jugando solo, solo del anfitrión en salas privadas y nunca existe en las públicas
const panelAllowed = () => !G.mp || (!NET.public && amHost());
function canUsePanel() { return G.state === 'play' && G.player && panelAllowed(); }
function spawnDummy(kind) {
  const p = G.player; if (!p || dummies().length >= 8) return;
  const n = dummies().length, F = fwd(cam.yaw), R = rightOf(cam.yaw), off = (n % 4 - 1.5) * 2.2;
  const pos = new V3(p.pos.x + F.x * 5 + R.x * off, 0, p.pos.z + F.z * 5 + R.z * off);
  const r = Math.hypot(pos.x, pos.z); if (r > ARENA - 2) pos.multiplyScalar((ARENA - 2) / r);
  pos.y = groundAt(pos.x, pos.z);
  const d = new Fighter({ name: DUMMY_NAMES[kind], ch: DUMMY_CH, lvlVar: 0 });
  d.dummy = kind; d.home = pos.clone(); d.pos.copy(pos); d.yaw = Math.atan2(p.pos.x - pos.x, p.pos.z - pos.z); d.prevYaw = d.yaw; d.iframes = 0;
  d.ai.P = aiParams(4); d.flourT = 1e9;
  if (G.mp && NET.named && NET.named.pubAs) d.netId = NET.named.myId + '-d' + (++NET.dummySeq);
  G.fighters.push(d);
  burst(chestOf(d), 24, DUMMY_CH.color, 6, .2, .6, -.2); ringAt(new V3(pos.x, pos.y, pos.z), DUMMY_CH.color, 2.4, .4);
}
function clearDummies() {
  for (const d of dummies()) { if (d.netId && NET.named && NET.named.dropAs) NET.named.dropAs(d.netId); d.dispose(); G.fighters.splice(G.fighters.indexOf(d), 1); }
}
function dummyCtl(f, dt) {
  const c = { mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false };
  let t = null, bd = 1e9; for (const g of enemiesOf(f)) { if (g.dummy) continue; const d = dist2d(f, g); if (d < bd) { bd = d; t = g; } }
  f.ai.target = t && bd < 14 ? t : null;
  if (f.dummy === 'block') c.block = true;
  if (f.dummy === 'attack' && f.ai.target) {
    const dx = t.pos.x - f.pos.x, dz = t.pos.z - f.pos.z;
    if (bd > 2.2) { c.mx = dx / bd; c.mz = dz / bd; } else if (bd < 2.7) c.m1 = true;
  }
  // el quieto y el que bloquea vuelven despacio a su lugar si los empujaron
  if (f.dummy !== 'attack' && f.home) { const hx = f.home.x - f.pos.x, hz = f.home.z - f.pos.z, hd = Math.hypot(hx, hz); if (hd > .6 && f.ragdoll <= 0) { c.mx = hx / hd * .5; c.mz = hz / hd * .5; } }
  return c;
}
function togglePanel(force) {
  const open = force != null ? force : $('dpanel').classList.contains('hidden');
  if (open) {
    if (G.state !== 'play' || !panelAllowed()) return;
    G.panelOpen = true; unlock();
    const ok = canUsePanel(); rulesUI(ok);
    $('dpanel').querySelectorAll('[data-dummy],#dclear').forEach(b => { b.disabled = !ok; b.style.opacity = ok ? 1 : .4; });
    $('dpmsg').textContent = ok ? 'Dummies de entrenamiento: aparecen adelante tuyo. Si les ganás, reaparecen en el mismo lugar.'
      : (G.mp && NET.room !== 'relay') ? 'En esta versión la sala no puede compartir dummies. Usá la versión de GitHub para crearlos con amigos.'
      : 'Solo el anfitrión de la sala (el que entró primero) puede crear dummies.';
    $('dpanel').classList.remove('hidden');
  } else { $('dpanel').classList.add('hidden'); G.panelOpen = false; if (G.state === 'play' && !G.over) requestLock(); }
}
$('dpanel').querySelectorAll('[data-dummy]').forEach(b => b.addEventListener('click', () => { if (canUsePanel()) spawnDummy(b.dataset.dummy); }));
$('dclear').addEventListener('click', () => { if (canUsePanel()) clearDummies(); });
$('dclose').addEventListener('click', () => togglePanel(false));
$('panelbtn').addEventListener('click', () => togglePanel(true));

// ===== Editor de animaciones (modo desarrollador, estilo Blockbench): claves, interpolaciones, fórmulas y curvas: vive en js/editores/editor_animaciones.js =====
const { ED, ED_BONES, ED_CACHE, ED_DEFPATH, ED_EASE, ED_EASE_ES, ED_FN, ED_INTERPS, ED_KIND, ED_LW, ED_ROT, ED_ROW, ED_SETS, ED_ZERO, edAddKeys, edAxis, edBack, edBezier, edBindProps, edBindTimeline, edBoneOf, edBounceOut, edBuild, edClose, edComicInit, edCompile, edCompileClip, edCopy, edDR, edDef, edDeg, edDelClip, edDelSel, edDraw, edDup, edEase, edElastic, edEvalChan, edExport, edFromGame, edImportFile, edKey, edKeyVal, edKeysOf, edKindOf, edLen, edLoadObj, edLoadSaved, edLoop, edMakeVic, edMsg, edNoise, edOpen, edOpenClip, edPair, edPaste, edPath, edPoint, edProps, edPush, edRebuild, edRebuildPartial, edRedo, edRefFile, edRefOptions, edRefSet, edRefStart, edRefStop, edRefUse, edRestore, edRestoreSnap, edRun, edSaveGame, edSelAll, edSetKey, edSetTarget, edShow, edShowFrame, edSnap, edStore, edTimeSnap, edTree, edUndo, edUnshow, edVicBuild, edVicDispose } = CF_EDITORES.crearEditorAnimaciones({ $, Animator, CHARACTER_VOICE_FILES, CHARACTER_VOICE_META, CHARS, CHAR_IDS, DEV, G, JAVI_BB_CACHE, JDEF, JOINTS, L2W, SH, SND, SND_LIST, V3, VOICE_PACKS, bbSet, buildModel, charSkin, clamp, copyCanvas, disposeModel, hermArr, initAudio, setSpear, showSelect, voiceRel, get AC() { return AC; } });
// ===== Selector de personajes (estilo Zenless Zone Zero): tarjetas inclinadas, pastillas Base / Habilidades / Skin y botón vertical =====
(function selStyle() { const st = document.createElement('style'); st.id = 'selstyle'; st.textContent = `
#menu{grid-template-columns:minmax(260px,1fr) minmax(340px,470px) 76px;grid-template-rows:auto minmax(0,1fr);gap:10px 18px;padding-right:0}
#menu::before{content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 55% 75% at 40% 52%,rgba(0,0,0,0) 0,rgba(0,0,0,.4) 62%,rgba(0,0,0,.86) 100%),repeating-linear-gradient(118deg,rgba(255,255,255,.04) 0 2px,transparent 2px 28px),linear-gradient(90deg,rgba(0,0,0,.78),rgba(0,0,0,0) 46%)}
.mtop{padding-right:max(18px,env(safe-area-inset-right,0px))}
#tab-sel{grid-column:1;grid-row:2;align-self:stretch;justify-content:flex-start;background:none;clip-path:none;padding:2px 0 14px 6px;gap:12px;max-width:540px;overflow:visible}
.selmodes{display:flex;flex-direction:column;gap:11px;align-items:flex-start;margin:4vh 0 auto}
.selmodes button{font:italic 700 clamp(18px,2.2vw,26px)/1 var(--display);letter-spacing:.03em;color:#fff;background:#08080a;border:2px solid #34343c;border-radius:30px;padding:10px 40px 10px 24px;min-width:200px;text-align:left;transform:skewX(-8deg);transition:.14s;box-shadow:0 0 0 2px #000}
.selmodes button:hover{border-color:#fff;transform:skewX(-8deg) translateX(6px)}
.selmodes button.on{background:#ffd400;color:#000;border-color:#ffd400}
#cinfo{margin-top:auto}
#tab-sel[data-mode=base] #cskills{display:none}
#tab-sel[data-mode=skills] #cstats,#tab-sel[data-mode=skills] #cdesc{display:none}
#tab-sel #cskills{max-height:34vh;overflow:auto;padding-right:6px}
#tab-sel #cstats,#tab-sel #cskills{background:rgba(0,0,0,.55);padding:10px 12px;border-left:3px solid var(--c)}
#roster{grid-column:2;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;align-content:start;overflow-y:auto;overflow-x:hidden;padding:10px 18px 34px 12px;min-width:0;max-height:100%;scrollbar-width:thin}
#roster .rc{position:relative;width:auto;height:clamp(104px,16vh,142px);padding:0;border:3px solid #000;background:linear-gradient(160deg,var(--rcc),#0a0b12 78%);overflow:hidden;clip-path:none;border-radius:7px;display:block;transform:skewX(-8deg);transition:transform .15s,box-shadow .15s,filter .15s;filter:brightness(.78) saturate(.9)}
#roster .rc:nth-child(even){margin-top:26px}
#roster .rc canvas{position:absolute;left:-12%;top:0;width:124%;height:100%;border:0;background:none;object-fit:cover;object-position:50% 12%;image-rendering:pixelated;transform:skewX(8deg)}
#roster .rc .rk{position:absolute;left:5px;bottom:4px;width:34px;height:34px;display:grid;place-items:center;background:#ffd400;color:#000;font:900 17px/1 var(--display);font-style:italic;clip-path:polygon(50% 0,63% 17%,83% 11%,81% 33%,100% 42%,83% 58%,91% 80%,68% 76%,50% 100%,32% 76%,9% 80%,17% 58%,0 42%,19% 33%,17% 11%,37% 17%);transform:skewX(8deg);z-index:2}
#roster .rc .rn{position:absolute;left:40px;right:30px;bottom:5px;font:italic 700 15px/1 var(--display);letter-spacing:.04em;color:#fff;text-shadow:2px 2px 0 #000,0 0 6px #000;transform:skewX(8deg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:none;z-index:2}
#roster .rc .re{position:absolute;right:6px;bottom:6px;width:18px;height:18px;border:2px solid #000;border-radius:50%;box-shadow:0 0 8px var(--rcc);z-index:2}
#roster .rc::after{content:'';position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,0));pointer-events:none}
#roster .rc:hover{filter:brightness(1.05);transform:skewX(-8deg) translateY(-3px)}
#roster .rc.sel{border-color:#ffd400;filter:none;transform:skewX(-8deg) scale(1.05);box-shadow:0 0 0 2px #000,0 0 22px rgba(255,212,0,.55);z-index:3}
#play{grid-column:3;grid-row:2;align-self:stretch;writing-mode:vertical-rl;text-orientation:mixed;font:italic 700 clamp(30px,4vh,44px)/1 var(--display);letter-spacing:.14em;padding:24px 14px;margin:6px 0 14px;background:linear-gradient(90deg,#d8d8de,#9a9aa4);color:#0a0a0c;clip-path:polygon(0 8%,100% 0,100% 100%,0 92%);border-radius:0;transition:filter .12s,transform .12s}
#play:hover{background:#ffd400;filter:none}
#menu[data-tab=cfg] #roster{display:none}
#menu[data-tab=cfg] #tab-cfg{grid-column:1/3;justify-self:center;width:min(520px,100%)}
@media(max-width:900px){
#menu{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(140px,1fr) auto auto;padding-right:max(18px,env(safe-area-inset-right,0px));gap:8px}
#tab-sel{grid-column:1;grid-row:2;max-width:none;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin}
.selmodes{flex-direction:row;flex-wrap:wrap;margin:0}.selmodes button{min-width:0;padding:8px 22px 8px 16px;font-size:clamp(14px,3.4vw,20px)}
#roster{grid-column:1;grid-row:3;max-height:34vh;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));padding:6px 10px 14px 6px}#roster .rc:nth-child(even){margin-top:0}#roster .rc{height:clamp(76px,12vh,110px)}
#play{grid-column:1;grid-row:4;writing-mode:horizontal-tb;clip-path:none;padding:12px 24px;margin:0 0 4px;letter-spacing:.08em;font-size:clamp(24px,5vw,34px)}}
`; document.head.appendChild(st); })();
function bustPortrait(skin) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 12; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
  g.drawImage(skin, 20, 20, 8, 4, 4, 8, 8, 4); g.drawImage(skin, 44, 20, 4, 4, 0, 8, 4, 4); g.drawImage(skin, 36, Math.min(52, skin.height - 12), 4, 4, 12, 8, 4, 4);
  g.drawImage(skin, 8, 8, 8, 8, 4, 0, 8, 8); g.drawImage(skin, 40, 8, 8, 8, 4, 0, 8, 8); c.classList.add('px'); return c;
}
// Categoría de cada peleador (como el rango S o A de los agentes de Zenless Zone Zero). Cambia aquí o con `rank: 'S'` en el personaje.
const CHAR_RANK = { mattux: 'S', javi: 'S', sebolla: 'S', randi: 'S', jesuluto: 'S', sekza: 'S', redbird: 'A', gato: 'A', rocket: 'A', ukyo: 'A' };
function renderRoster() {
  const r = $('roster'); r.innerHTML = '';
  for (const id of CHAR_IDS) {
    const ch = CHARS[id], rank = ch.rank || CHAR_RANK[id] || 'A';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'rc'; b.dataset.id = id; b.style.setProperty('--rcc', ch.color);
    b.setAttribute('aria-label', `${ch.name}, ${ch.title}`);
    let cv; try { cv = bustPortrait(charSkin(id)); } catch (e) { cv = headPortrait(charSkin(id)); }
    const rk = document.createElement('i'); rk.className = 'rk'; rk.textContent = rank; const nm = document.createElement('span'); nm.className = 'rn'; nm.textContent = ch.name.toUpperCase(); const lv = document.createElement('b'); lv.className = 'rl'; lv.textContent = 'Lv. 60'; const el = document.createElement('em'); el.className = 're'; el.style.background = ch.color; b.classList.add('rank' + rank); b.style.setProperty('--i', CHAR_IDS.indexOf(id));
    b.append(cv, rk, nm, lv, el);
    b.addEventListener('click', () => { initAudio(); if (G.charId !== id) { G.charId = id; showSelect(id); menuVoice(id); } });
    r.appendChild(b);
  }
}

(function selAnim() {
  const st = document.createElement('style'); st.id = 'selanim'; st.textContent = `
#roster .rc .rk{left:5px;bottom:4px;width:38px;height:38px;font-size:21px;background:linear-gradient(160deg,#ffd45a,#ff8a1f);box-shadow:0 0 10px rgba(255,160,40,.7);text-shadow:1px 1px 0 rgba(255,255,255,.35)}
#roster .rc.rankA .rk{background:linear-gradient(160deg,#d9a8ff,#8a4dff);box-shadow:0 0 10px rgba(160,100,255,.7);color:#1b0b33}
#roster .rc .rn{left:46px;right:68px;font-size:13px}
#roster .rc .rl{position:absolute;right:30px;bottom:6px;font:italic 700 13px/1 var(--display);color:#fff;text-shadow:2px 2px 0 #000;transform:skewX(8deg);z-index:2;letter-spacing:.02em}
#roster .rc .re{right:6px;bottom:6px;width:19px;height:19px}
#roster .rc{animation:rcIn .55s cubic-bezier(.2,.9,.3,1) backwards;animation-delay:calc(var(--i,0) * 55ms + .1s)}
@keyframes rcIn{from{opacity:0;transform:translateX(80px) skewX(-8deg) scale(.9)}}
#roster .rc.sel{animation:selGlow 3s ease-in-out infinite}
@keyframes selGlow{0%,100%{box-shadow:0 0 0 2px #000,0 0 16px rgba(255,212,0,.45)}50%{box-shadow:0 0 0 2px #000,0 0 30px rgba(255,212,0,.9)}}
#roster .rc.sel::before{content:'';position:absolute;top:-10%;bottom:-10%;width:34%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.42),transparent);transform:skewX(-14deg);animation:rcShine 4.2s ease-in-out infinite;z-index:3;pointer-events:none}
@keyframes rcShine{0%,55%{left:-60%}100%{left:130%}}
#roster .rc:active{transform:skewX(-8deg) scale(.96)}
.selmodes button{animation:pillIn .5s cubic-bezier(.2,.9,.3,1) backwards}
.selmodes button:nth-child(2){animation-delay:.08s}.selmodes button:nth-child(3){animation-delay:.16s}
@keyframes pillIn{from{opacity:0;transform:skewX(-8deg) translateX(-70px)}}
.selmodes button.on{animation:pillIn .5s cubic-bezier(.2,.9,.3,1) backwards,pillPulse 3.4s ease-in-out infinite .6s}
@keyframes pillPulse{0%,100%{box-shadow:0 0 0 2px #000,0 0 0 rgba(255,212,0,0)}50%{box-shadow:0 0 0 2px #000,0 0 18px rgba(255,212,0,.6)}}
#play{animation:playIn .6s cubic-bezier(.2,.9,.3,1) .35s backwards,playPulse 3.2s ease-in-out infinite 1s}
@keyframes playIn{from{opacity:0;transform:translateX(90px)}}
@keyframes playPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18) drop-shadow(0 0 10px rgba(255,255,255,.35))}}
#play:hover{animation:none;background:#ffd400;transform:translateX(-6px)}
.mtop{animation:topIn .5s ease backwards}@keyframes topIn{from{opacity:0;transform:translateY(-24px)}}
#cinfo.swap #cname{animation:nameIn .5s cubic-bezier(.2,.9,.3,1) backwards}
@keyframes nameIn{from{opacity:0;transform:translateX(-60px) skewX(10deg)}}
#cinfo.swap #crole,#cinfo.swap #ctitle,#cinfo.swap #cdesc{animation:fadeUp .5s ease .12s backwards}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}}
#tab-sel[data-mode=base] #cstats,#tab-sel[data-mode=skills] #cskills{animation:fadeUp .4s ease backwards}
#cskills li{animation:liIn .4s ease backwards}#cskills li:nth-child(2){animation-delay:.05s}#cskills li:nth-child(3){animation-delay:.1s}#cskills li:nth-child(4){animation-delay:.15s}#cskills li:nth-child(5){animation-delay:.2s}
@keyframes liIn{from{opacity:0;transform:translateX(-30px)}}
#menu::after{content:'';position:fixed;inset:-60px;z-index:-1;pointer-events:none;background:repeating-linear-gradient(118deg,rgba(255,255,255,.035) 0 3px,transparent 3px 60px);animation:bgDrift 22s linear infinite}
@keyframes bgDrift{to{transform:translate(-68px,28px)}}
#menu::before{animation:vigPulse 6s ease-in-out infinite}@keyframes vigPulse{50%{opacity:.82}}
#menu[data-tab=cfg] #tab-cfg{animation:fadeUp .4s ease backwards}
@media(prefers-reduced-motion:reduce){#roster .rc,.selmodes button,#play,.mtop,#menu::after,#menu::before,#roster .rc.sel::before{animation:none!important}}`; document.head.appendChild(st);
})();
(function selModes() {
  const nav = document.createElement('nav'); nav.className = 'selmodes'; nav.innerHTML = '<button type="button" data-m="base" class="on">Base</button><button type="button" data-m="skills">Habilidades</button><button type="button" data-m="skin">Skin</button>';
  const sec = $('tab-sel'); sec.prepend(nav); sec.dataset.mode = 'base';
  nav.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    sfx('select'); if (b.dataset.m === 'skin') { openTab('cfg'); return; }
    sec.dataset.mode = b.dataset.m; nav.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('menu').dataset.tab = 'sel';
})();

// ================= Menú =================
function setCustomSkin(c, msg) {
  G.customSkin = c; G.customSlim = c ? detectSlim(c) : false;
  $('skinreset').classList.toggle('hidden', !c);
  $('skinmsg').textContent = msg;
  if (G.state === 'menu') showSelect(G.charId, true);
  netShareSkin();
}
function openTab(name) {
  document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === name));
  $('tab-sel').classList.toggle('hidden', name !== 'sel'); $('tab-cfg').classList.toggle('hidden', name !== 'cfg'); $('menu').dataset.tab = name;
}
document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => { openTab(b.dataset.tab); sfx('select'); }));
document.querySelectorAll('#modesel button').forEach(b => b.addEventListener('click', () => {
  G.mode = b.dataset.mode;
  document.querySelectorAll('#modesel button').forEach(x => x.classList.toggle('on', x === b));
  $('mpbox').classList.toggle('hidden', G.mode !== 'mp'); $('botopts').classList.toggle('hidden', G.mode === 'mp');
  if (G.mode === 'mp') { renderLobby(); if (NET.room && !NET.named) joinRoom(); }
  sfx('select');
}));
$('joinbtn').addEventListener('click', () => { initAudio(); joinRoom(); });
$('roomcode').addEventListener('input', () => { if (NET.room === 'relay') $('invitelink').value = inviteLink(); });
$('copylink').addEventListener('click', () => {
  const inp = $('invitelink'), b = $('copylink');
  const ok = () => { b.textContent = '¡Copiado!'; setTimeout(() => { b.textContent = 'Copiar link'; }, 1500); };
  try { navigator.clipboard.writeText(inp.value).then(ok, () => { inp.select(); }); } catch (e) { inp.select(); }
});
// ===== Menú principal =====
const PUB = { base: 'calfight/pub1/', rooms: new Map(), watch: [], host: [], topic: '', pt: 0, rt: 0 };
const NETPUB = () => !!(NET.public && NET.named);
function pubWatch(on) {
  if (!on) { PUB.watch.forEach(c => { try { c.end(true); } catch (e) { } }); PUB.watch = []; clearInterval(PUB.rt); PUB.srvOn = false; return; }
  if (NET.local) {   // con servidor: él lleva la lista de salas públicas (siguen aunque quien las abrió se vaya)
    if (PUB.srvOn) return; PUB.srvOn = true; clearInterval(PUB.rt);
    const tick = async () => { try { const a = await (await fetch(SRV_BASE + '/bs-rooms', { cache: 'no-store' })).json(); PUB.rooms.clear(); for (const o of a) if (/^[a-z0-9][a-z0-9_.-]{0,39}$/.test(o.code)) PUB.rooms.set(o.code, { code: o.code, host: String(o.host || 'Jugador').replace(/[<>&]/g, '').slice(0, 16), n: clamp(+o.n || 1, 1, 99), at: Date.now() }); pubRender(); } catch (e) { } };
    tick(); PUB.rt = setInterval(tick, 2000); return;
  }
  if (PUB.watch.length || !window.mqtt) return; PUB.rooms.clear();
  RELAYS.forEach((url, i) => {
    try {
      const c = mqtt.connect(url, { clientId: 'cfd_' + Math.random().toString(36).slice(2, 10) + '_' + i, clean: true, keepalive: 30, reconnectPeriod: 4000, connectTimeout: 8000 });
      c.on('error', () => { }); c.on('connect', () => c.subscribe(PUB.base + '#', { qos: 0 }));
      c.on('message', (topic, buf) => {
        const code = topic.slice(PUB.base.length); if (!/^[a-z0-9][a-z0-9_.-]{0,39}$/.test(code) || buf.length > 600) return;
        if (!buf.length) { PUB.rooms.delete(code); pubRender(); return; }
        let o; try { o = JSON.parse(buf.toString()); } catch (e) { return; }
        if (!o || o.v !== 1 || Math.abs(Date.now() - (+o.t || 0)) > 60000) { PUB.rooms.delete(code); return; }   // mensaje viejo que quedó retenido
        PUB.rooms.set(code, { code, host: String(o.h || '').replace(/[<>&]/g, '').slice(0, 16) || 'Jugador', n: clamp(+o.n || 1, 1, 99), at: Date.now() }); pubRender();
      });
      PUB.watch.push(c);
    } catch (e) { }
  });
  PUB.rt = setInterval(pubRender, 1500);
}
function pubRender() {
  const ul = $('tm-list'); if (!ul || $('tm-public-v').classList.contains('hidden')) return;
  const now = Date.now(), rows = [...PUB.rooms.values()].filter(r => now - r.at < 25000).sort((a, b) => b.n - a.n);
  ul.innerHTML = '';
  if (!rows.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = window.mqtt || NET.local ? 'No hay salas públicas ahora mismo. ¡Creá una!' : 'No se pudo conectar para buscar salas.'; ul.appendChild(li); return; }
  for (const r of rows) {
    const li = document.createElement('li'), d = document.createElement('div'), b = document.createElement('b'), sm = document.createElement('small'), n = document.createElement('span'), go = document.createElement('button');
    b.textContent = 'Sala de ' + r.host; sm.textContent = r.code; d.append(b, sm); n.className = 'n'; n.textContent = r.n + (r.n === 1 ? ' jugador' : ' jugadores');
    go.type = 'button'; go.className = 'tm-go'; go.textContent = 'ENTRAR'; go.addEventListener('click', () => tmJoin(r.code, go)); li.append(d, n, go); ul.appendChild(li);
  }
}
// la sala propia aparece en la lista mientras estés adentro; al salir (o cerrar la pestaña) desaparece
function pubStop() {
  clearInterval(PUB.pt); const t = PUB.topic; PUB.topic = '';
  for (const c of PUB.host) { try { if (t) c.publish(t, '', { qos: 0, retain: true }); setTimeout(() => { try { c.end(true); } catch (e) { } }, 400); } catch (e) { } }
  PUB.host = [];
}
function pubStart() {
  pubStop(); if (NET.local) return;   // con servidor no hace falta: el servidor ya la lista
  const code = NET.code && NET.code.slice(3); if (!code || !window.mqtt) return;
  const topic = PUB.base + code; PUB.topic = topic;
  const put = () => {
    if (!NET.named || NET.code !== 'bs-' + code || !NET.public) { pubStop(); return; }
    const body = JSON.stringify({ v: 1, h: ($('pname-in').value || 'Jugador').trim().slice(0, 16), n: NET.named.peers().length, t: Date.now() });
    PUB.host.forEach(c => { try { c.publish(topic, body, { qos: 0, retain: true }); } catch (e) { } });
  };
  RELAYS.forEach((url, i) => {
    try {
      const c = mqtt.connect(url, { clientId: 'cfp_' + Math.random().toString(36).slice(2, 10) + '_' + i, clean: true, keepalive: 20, reconnectPeriod: 4000, connectTimeout: 8000, will: { topic, payload: '', qos: 0, retain: true } });
      c.on('error', () => { }); c.on('connect', put); PUB.host.push(c);
    } catch (e) { }
  });
  PUB.pt = setInterval(put, 6000);
}
addEventListener('pagehide', () => { try { pubStop(); } catch (e) { } });
const TM = { vis: 'private', busy: false, bots: true, found: null };
const tmMsg = (t, ok) => { const m = $('tm-msg'); m.textContent = t || ''; m.classList.toggle('ok', !!ok); };
function tmView(v) {
  for (const id of ['home', 'solo-v', 'create-v', 'public-v', 'join-v']) $('tm-' + (id === 'home' ? 'home' : id)).classList.toggle('hidden', id !== (v === 'home' ? 'home' : v));
  $('tm-title').textContent = { home: 'JUGAR', 'solo-v': 'JUGAR SOLO', 'create-v': 'CREAR SALA', 'public-v': 'SALAS PÚBLICAS', 'join-v': 'ENTRAR CON CÓDIGO' }[v]; tmMsg('');
  if (v === 'join-v') { TM.found = null; $('tm-jcard').classList.add('hidden'); $('tm-jgo').classList.add('hidden'); $('tm-jcode').value = ''; setTimeout(() => $('tm-jcode').focus({ preventScroll: true }), 30); }
  if (v === 'solo-v') {
    $('tm-nbots').value = $('nbots').value; $('tm-lvl').value = $('lvl').value; $('tm-goal').value = $('goalsel').value; $('tm-auto').checked = $('auto').checked;
    $('tm-nbots-o').textContent = $('tm-nbots').value; $('tm-lvl-o').textContent = $('tm-lvl').value;
  }
  if (v === 'create-v') { $('tm-code').value = cleanCode($('roomcode').value) === 'amigos' ? 'amigos-' + Math.random().toString(36).slice(2, 6) : cleanCode($('roomcode').value); }
  if (v === 'public-v') { pubWatch(true); pubRender(); } else pubWatch(false);
}
function tmOpen() { initAudio(); $('tmodal').classList.remove('hidden'); TM.busy = false; tmView('home'); try { sfx('select'); } catch (e) { } setTimeout(() => $('tm-solo').focus({ preventScroll: true }), 30); }
function tmClose() { $('tmodal').classList.add('hidden'); pubWatch(false); }
function tmGo() { tmClose(); titleLeave(); }
async function tmEnter(code, pub, btn, creator = true) {
  if (TM.busy) return; if (!(await acctGate(pub))) return; TM.busy = true; if (btn) btn.disabled = true; tmMsg('Conectando a la sala…', true);
  $('roomcode').value = code; setMode('mp'); NET.public = pub;
  NET.roomOpts = creator && window.CF_BETA && window.CF_BETA.on ? { bots: TM.bots ? 1 : 0, max: 10 } : null;
  NET.rcOut = NET.roomOpts && !NET.local ? { b: NET.roomOpts.bots, m: NET.roomOpts.max } : null;   // sin servidor: las opciones viajan en la presencia del creador   // al crear una sala: con o sin bots, máximo 10
  let ok = false; try { ok = await joinRoom(); } catch (e) { }
  TM.busy = false; if (btn) btn.disabled = false;
  if (!ok) { NET.public = false; tmMsg($('netstat').textContent || 'No se pudo entrar a la sala. Probá de nuevo en unos segundos.'); return; }
  if (pub && creator) pubStart(); tmGo();
}
const tmJoin = (code, btn) => tmEnter(code, true, btn, false);
// SALA GLOBAL: un boton que te mete en una partida en linea con lugar libre. Son copias de la misma sala (global-1, global-2...) con hasta 10 jugadores cada una:
// entra a la que ya tiene mas gente y todavia no esta llena; si todas estan llenas (o no hay ninguna) abre la siguiente. Siempre con bots que rellenan los lugares.
async function tmGlobal(btn) {
  let list = []; try { const r = await fetch(SRV_BASE + '/bs-rooms', { cache: 'no-store' }); if (r.ok) list = await r.json(); } catch (e) { }
  if (!Array.isArray(list)) list = [];
  const open = list.filter(o => o && /^global-\d+$/.test(o.code) && (+o.n || 0) < (+o.max || 10)).sort((a, b) => (b.n || 0) - (a.n || 0))[0];
  let code = open ? open.code : '';
  if (!code) { const used = new Set(list.map(o => o && o.code)); let i = 1; while (used.has('global-' + i) && i < 99) i++; code = 'global-' + i; }
  TM.bots = true;
  return tmEnter(code, true, btn, !open);
}
// entrar con código: primero se pregunta al servidor quién creó la sala y cuánta gente hay (como en Among Us), y después se entra
async function tmFind() {
  const code = cleanCode($('tm-jcode').value), card = $('tm-jcard'), go = $('tm-jgo'); $('tm-jcode').value = code; go.classList.add('hidden'); TM.found = null;
  if (!code) { tmMsg('Escribe el código de la sala.'); return; }
  const row = (a, b) => { const d = document.createElement('div'); d.className = 'it'; const x = document.createElement('span'), y = document.createElement('b'); x.textContent = a; y.textContent = b; d.append(x, y); return d; };
  card.innerHTML = ''; card.classList.remove('hidden', 'no'); tmMsg('Buscando la sala…', true);
  if (!NET.local) {   // sin servidor propio no se puede mirar la sala antes de entrar
    const h = document.createElement('h3'); h.textContent = 'Sala «' + code + '»'; card.append(h, row('Información', 'solo disponible con el servidor')); TM.found = { code, pub: false }; go.classList.remove('hidden'); tmMsg(''); return;
  }
  let j = null; try { j = await (await fetch(SRV_BASE + '/bs-info?room=' + encodeURIComponent(code), { cache: 'no-store' })).json(); } catch (e) { }
  if (!j) { card.classList.add('hidden'); tmMsg('No se pudo preguntar al servidor. Prueba de nuevo.'); return; }
  tmMsg('');
  if (!j.exists) { card.classList.add('no'); const h = document.createElement('h3'); h.textContent = 'No existe esa sala'; card.append(h, row('Código', code), row('Consejo', 'revisa el código o pide el link a quien la creó')); return; }
  const h = document.createElement('h3'), sm = document.createElement('small'); sm.textContent = j.mode === 'public' ? 'SALA PÚBLICA' : 'SALA PRIVADA'; h.append(sm, 'Sala de ' + String(j.host || 'Jugador').replace(/[<>&]/g, '').slice(0, 16));
  card.append(h, row('Código', code), row('Jugadores', j.n + ' / ' + j.max), row('Bots', j.bots ? 'sí (' + j.nbots + ' ahora)' : 'no'), row('Estado', j.full ? 'llena' : 'con lugar libre'));
  if (!j.full) { TM.found = { code, pub: j.mode === 'public' }; go.classList.remove('hidden'); } else tmMsg('La sala está llena.');
}
function tmWire() {
  $('tplay').addEventListener('click', e => { e.stopImmediatePropagation(); e.stopPropagation(); if (TITLE.on && TITLE.lt == null) tmOpen(); }, true);
  $('tm-x').addEventListener('click', tmClose);
  $('tm-solo').addEventListener('click', () => tmView('solo-v')); $('tm-pub').addEventListener('click', () => tmView('public-v')); $('tm-new').addEventListener('click', () => tmView('create-v')); $('tm-global').addEventListener('click', () => tmGlobal($('tm-global')));
  document.querySelectorAll('[data-tmback]').forEach(b => b.addEventListener('click', () => tmView('home')));
  $('tm-nbots').addEventListener('input', () => { $('tm-nbots-o').textContent = $('tm-nbots').value; }); $('tm-lvl').addEventListener('input', () => { $('tm-lvl-o').textContent = $('tm-lvl').value; });
  $('tm-solo-go').addEventListener('click', () => {
    $('nbots').value = $('tm-nbots').value; $('nbots').dispatchEvent(new Event('input')); $('lvl').value = $('tm-lvl').value; $('lvl').dispatchEvent(new Event('input'));
    $('goalsel').value = $('tm-goal').value; $('auto').checked = $('tm-auto').checked; $('auto').dispatchEvent(new Event('change')); try { saveCfg(); } catch (e) { }
    setMode('bots'); NET.public = false; tmGo();
  });
  document.querySelectorAll('#tm-vis button').forEach(b => b.addEventListener('click', () => { TM.vis = b.dataset.vis; document.querySelectorAll('#tm-vis button').forEach(x => x.classList.toggle('on', x === b)); }));
  $('tm-join').addEventListener('click', () => tmView('join-v')); $('tm-jfind').addEventListener('click', tmFind);
  $('tm-jcode').addEventListener('keydown', e => { if (e.key === 'Enter') { if (TM.found && !$('tm-jgo').classList.contains('hidden')) $('tm-jgo').click(); else tmFind(); } });
  $('tm-jcode').addEventListener('input', () => { TM.found = null; $('tm-jgo').classList.add('hidden'); });
  $('tm-jgo').addEventListener('click', () => { if (TM.found) tmEnter(TM.found.code, TM.found.pub, $('tm-jgo'), false); });
  document.querySelectorAll('#tm-bots button').forEach(b => b.addEventListener('click', () => { TM.bots = b.dataset.bots === '1'; document.querySelectorAll('#tm-bots button').forEach(x => x.classList.toggle('on', x === b)); }));
  $('tm-create-go').addEventListener('click', () => { const code = cleanCode($('tm-code').value); $('tm-code').value = code; tmEnter(code, TM.vis === 'public', $('tm-create-go')); });
  $('tm-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('tm-create-go').click(); });
  addEventListener('keydown', e => { if (e.code === 'Escape' && !$('tmodal').classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); if (!$('tm-home').classList.contains('hidden')) tmClose(); else tmView('home'); } }, true);
}
// selector de peleador: flecha para abandonar la sala (o volver al menú principal) con confirmación
const inRoomNow = () => !!(NET.named && G.mode === 'mp');
function leaveAsk() {
  $('ld-title').textContent = inRoomNow() ? '¿ABANDONAR LA SALA?' : '¿VOLVER AL MENÚ?';
  $('ld-text').textContent = inRoomNow() ? '¿Estás seguro de que quieres abandonar esta sala? Volverás al menú principal.' : '¿Estás seguro de que quieres volver al menú principal?';
  $('ld-yes').textContent = inRoomNow() ? 'Abandonar' : 'Volver'; $('leavedlg').classList.remove('hidden'); $('ld-no').focus({ preventScroll: true });
}
async function leaveDo() {
  $('leavedlg').classList.add('hidden'); pubStop(); NET.public = false;
  if (NET.named) { const old = NET.named; NET.named = null; try { await old.leave(); } catch (e) { } }
  joinCode = ''; setMode('bots'); try { renderNetStatus(); } catch (e) { }
  togglePanel(false); $('menu').classList.add('hidden'); titleStart(true);
}
$('menuback').addEventListener('click', () => { try { sfx('select'); } catch (e) { } leaveAsk(); });
$('ld-no').addEventListener('click', () => $('leavedlg').classList.add('hidden')); $('ld-yes').addEventListener('click', leaveDo);
addEventListener('keydown', e => { if (e.code === 'Escape' && !$('leavedlg').classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); $('leavedlg').classList.add('hidden'); } }, true);
$('invbtn').addEventListener('click', () => {
  const b = $('invbtn'), link = inviteLink(), ok = () => { b.textContent = '¡LINK COPIADO!'; setTimeout(() => { b.textContent = 'INVITAR ▸'; }, 1600); };
  try { navigator.clipboard.writeText(link).then(ok, () => { uiDialog({ title: 'LINK DE INVITACIÓN', msg: link, cancel: false }); }); } catch (e) { uiDialog({ title: 'LINK DE INVITACIÓN', msg: link, cancel: false }); }
});
setInterval(() => { $('invbtn').classList.toggle('hidden', !(G.state === 'menu' && NET.named && NET.room === 'relay')); }, 800);
// nombre, skin y teclas pasan al panel del peleador (la pestaña Partida ya no se usa)
{
  const sel = $('tab-sel'), nm = $('pname-in').closest('.field'), sk = $('skinbtn').closest('.field'), ky = document.querySelector('#tab-cfg .keys');
  const wrap = document.createElement('div'); wrap.id = 'profilebox'; wrap.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:14px'; wrap.append(nm, sk); if (ky) wrap.append(ky); sel.appendChild(wrap);
}
function setMode(mode) { const b = document.querySelector(`#modesel button[data-mode="${mode}"]`); if (b) b.click(); }
// link de invitación: #sala-codigo abre directo el modo amigos en esa sala
{
  const m = /^#sala-([a-z0-9][a-z0-9_.-]{0,39})$/.exec(location.hash);
  $('roomcode').value = m ? m[1] : 'amigos-' + Math.random().toString(36).slice(2, 6);
  if (m) { openTab('cfg'); setTimeout(() => setMode('mp'), 0); }
}
// al cerrar la pestaña, avisar a la sala para que nadie quede como fantasma
addEventListener('pagehide', () => { if (NET.named && NET.room === 'relay') NET.named.leave(); });
// si el juego ya estaba abierto y se pega otro link de invitación, cambiar a esa sala
addEventListener('hashchange', () => {
  const m = /^#sala-([a-z0-9][a-z0-9_.-]{0,39})$/.exec(location.hash);
  if (!m || cleanCode($('roomcode').value) === m[1]) return;
  $('roomcode').value = m[1];
  if (G.state === 'play') toMenu();
  openTab('cfg'); setMode('mp');
  if (NET.room) joinRoom();
});
$('skinbtn').addEventListener('click', () => $('skinfile').click());
$('skinreset').addEventListener('click', () => { setCustomSkin(null, 'Skin quitada. Se usa la del peleador.'); try { localStorage.removeItem('bsb_skin'); } catch (e) { } });
$('skinfile').addEventListener('change', e => {
  const file = e.target.files && e.target.files[0]; if (!file) return;
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const c = normalizeSkin(img); URL.revokeObjectURL(url);
    if (!c) { $('skinmsg').textContent = 'Ese PNG no es una skin: tiene que medir 64×64 o 64×32.'; return; }
    setCustomSkin(c, `Skin cargada${detectSlim(c) ? ' (brazos finos)' : ''}. Se usa con el peleador elegido.`);
    try { localStorage.setItem('bsb_skin', c.toDataURL()); } catch (err) { }
  };
  img.onerror = () => { URL.revokeObjectURL(url); $('skinmsg').textContent = 'No se pudo leer la imagen. Probá con otro PNG.'; };
  img.src = url; e.target.value = '';
});
const lvlLabel = v => `${v} · ${LVL_NAMES[v]}`;
$('nbots').addEventListener('input', e => { $('nbots-o').textContent = e.target.value; });
$('lvl').addEventListener('input', e => { $('lvl-o').textContent = lvlLabel(+e.target.value); });
$('plvl').addEventListener('input', e => { const v = +e.target.value; $('plvl-o').textContent = lvlLabel(v); G.baseLvl = v; G.botLvl = v; $('lvl').value = v; $('lvl-o').textContent = lvlLabel(v); applyAiLevels(); });
$('pauto').addEventListener('change', e => { G.auto = e.target.checked; $('auto').checked = G.auto; });
$('play').addEventListener('click', startMatch);
$('resume').addEventListener('click', () => { setPause(false); requestLock(); });
$('tomenu').addEventListener('click', toMenu);
$('tomenu2').addEventListener('click', toMenu);
$('again').addEventListener('click', startMatch);
try {
  G.shiftLock = localStorage.getItem('bsb_sl') === '1'; $('slchip').classList.toggle('hidden', !G.shiftLock);
  const n = localStorage.getItem('bsb_name'); if (n) $('pname-in').value = n;
  const s = JSON.parse(localStorage.getItem('bsb_cfg') || 'null');
  const lc = localStorage.getItem('bsb_lastchar'); if (CHARS[lc]) G.charId = lc;
  if (s) { $('nbots').value = s.n; $('lvl').value = s.l; $('auto').checked = s.a; $('nbots-o').textContent = s.n; $('lvl-o').textContent = lvlLabel(+s.l); if (CHARS[s.c]) G.charId = s.c; }
} catch (e) { }
['nbots', 'lvl', 'auto'].forEach(id => $(id).addEventListener('change', saveCfg));
function saveCfg() { try { localStorage.setItem('bsb_cfg', JSON.stringify({ n: $('nbots').value, l: $('lvl').value, a: $('auto').checked, c: G.charId })); } catch (e) { } }
$('play').addEventListener('click', saveCfg);
$('pname-in').addEventListener('change', e => { try { localStorage.setItem('bsb_name', e.target.value); } catch (err) { } netMenuPresence(); netShareProfile(); });
if (matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches) $('touchnote').classList.remove('hidden');

// ================= Pantalla de inicio =================
// El último peleador que usaste, de espaldas, en una de dos escenas con el atardecer (apoyado en la barandilla del muelle o sentado en la arena).
// Cámara fija con un leve temblor. Al pulsar algo: el personaje nota que estamos detrás, gira, la cámara se cae, todo negro y el menú cae poco a poco.
const TITLE = { on: false, t: 0, idx: 0, fig: null, lt: null, prev: null, base: null, baseIdx: -1, mus: null, amb: [], gullT: 4, wreck: null };
// lista de la pantalla de inicio: se turnan las canciones (el disco muestra cuál suena)
const TITLE_SONGS=['musica/calfight_arcade.mp3','musica/calfight_nocturno.mp3','musica/green_room.mp3','musica/calfight_intro.mp3'];
function titleSong(i){
  TITLE.si=((i%TITLE_SONGS.length)+TITLE_SONGS.length)%TITLE_SONGS.length;
  if(TITLE.mus)releaseHtmlAudio(TITLE.mus);
  const tr=TITLE.mus=makeMusicTrack(musFile('intro'+(TITLE.si?TITLE.si+1:''),TITLE_SONGS[TITLE.si]),'intro',false);
  tr.el.addEventListener('ended',()=>{if(TITLE.mus===tr&&TITLE.on)titleSong(TITLE.si+1);},{once:true});
}
function titleAudio(on){
  if(on){
    let startSong=0;
    try{startSong=(parseInt(localStorage.getItem('bsb_title_song')||'-1')+1)%TITLE_SONGS.length;localStorage.setItem('bsb_title_song',String(startSong));}catch(e){}
    titleSong(startSong);
    for(const [name,volume] of [['waves',.24],['breeze',.12]]){
      const el=new Audio(sndUrl(name));el.loop=true;
      const record=trackHtmlAudio(el,volume*(AUDIO_CFG.amb[name]?.vol??1),'ambient','title');
      TITLE.amb.push(record);playTrackedAudio(record,true);
    }
    return;
  }
  const tracks=[TITLE.mus,...TITLE.amb].filter(Boolean);
  TITLE.mus=null;TITLE.amb=[];
  for(const record of tracks)record.scene='';
  let frames=0;
  const fade=setInterval(()=>{
    for(const record of tracks)fadeAudioTrack(record,0,.05,.2,.13);
    if(++frames>=12){clearInterval(fade);for(const record of tracks)releaseHtmlAudio(record);}
  },50);
}
function titleStart(force) {
  if (TITLE.on || (!force && /[#?](sala|room|j=|join)|notitle/i.test(location.hash + location.search))) return;
  if (!CHARS[G.charId]) G.charId = 'javi';
  let idx = 0; try { idx = (parseInt(localStorage.getItem('bsb_title_idx') || '-1') + 1) % 2; localStorage.setItem('bsb_title_idx', String(idx)); } catch (e) { }
  TITLE.idx = idx; TITLE.on = true; TITLE.t = 0; TITLE.lt = null; TITLE.nextSek = 7; TITLE.nextCm = 6; TITLE.boomShake = 0; G.state = 'title';
  $('menu').classList.add('hidden'); $('title').classList.remove('hidden', 'leaving'); renderer.setSize(innerWidth, innerHeight); if (composer) { composer.setPixelRatio && composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(GFX.post?innerWidth:16, GFX.post?innerHeight:16); }
   $('tchar').textContent = CHARS[G.charId].name.toUpperCase() + ' · ' + CHARS[G.charId].title.toUpperCase();
  TITLE.prev = { hour: WX.hour, cycle: WX.cycle, mode: WX.mode }; if (bloomPass) { TITLE.bloom = bloomPass.enabled; bloomPass.enabled = false; }   // sin bloom en el inicio: difuminaba las siluetas
  WX.mode = 'clear'; WX.hour = (window.CF_BETA && window.CF_BETA.on) ? 17.35 : 17.8; WX.cycle = false; updateCityWeather(0, true);   // atardecer despejado (más dorado en la vista privada)
  TITLE.graded = false; titleBuild(); titleAudio(true); titleGrade(true);
  const fl = $('tfall'); fl.className = 'black'; void fl.offsetWidth; setTimeout(() => { fl.className = 'fade'; }, 150);   // sale del negro
}
// Color e iluminación del inicio (vista privada): más saturación, luz cálida de contraluz, luz fría de relleno y gradación naranja/azul
function titleGrade(on) {
  const beta = !!(window.CF_BETA && window.CF_BETA.on), g = $('tgrade');
  if (on && beta) {
    renderer.domElement.style.filter = 'saturate(1.38) contrast(1.1) brightness(1.1)';
    if (!TITLE.rim) { TITLE.rim = new THREE.PointLight(0xffa862, 3.4, 36, 1.5); TITLE.fill = new THREE.PointLight(0xa8ccff, 1.25, 18, 1.7); TITLE.top = new THREE.PointLight(0xffe2b0, 1.1, 22, 1.8); }
    scene.add(TITLE.rim, TITLE.fill, TITLE.top);
    if (!g) { const d = document.createElement('div'); d.id = 'tgrade'; $('title').insertBefore(d, $('title').firstChild); } else g.style.display = 'block';
  } else {
    renderer.domElement.style.filter = '';
    if (TITLE.rim) scene.remove(TITLE.rim, TITLE.fill, TITLE.top);
    if (g) g.style.display = 'none';
  }
}
function titleBuild() {
  if (TITLE.fig) { scene.remove(TITLE.fig.model.root); disposeModel(TITLE.fig.model); TITLE.fig = null; }
  const id = G.charId, ch = CHARS[id], skin = G.customSkin || charSkin(id), faceC = copyCanvas(skin);
  const model = buildFighterModel(ch, faceC, !!G.customSkin, G.customSkin ? G.customSlim : !!ch.slim, scene);
  model.root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });   // sin sombras propias: con el sol bajo se veían manchas
  const fig = { model, anim: new Animator(model), ch, alive: true, hp: 1, maxHp: 1, blinkT: rand(1, 3) }; fig.anim.bbR6 = true;
  if (!model.jlRig) setupFace(fig, faceC, !G.customSkin);
  if (WEAPONS[ch.weapon]) { fig.spear = WEAPONS[ch.weapon](); model.mats.push(fig.spear.material); setSpear(fig, false); }   // el arma, guardada en la espalda
  TITLE.fig = fig; for (const j of JOINTS) fig.anim.x[j] = JDEF[j] || 0; TITLE.baseIdx = -1;
}
function titleFinish() {
  if (!TITLE.on) return; TITLE.on = false; titleGrade(false); if (bloomPass && TITLE.bloom != null) bloomPass.enabled = TITLE.bloom;
  WX.mode = TITLE.prev.mode; WX.hour = TITLE.prev.hour; WX.cycle = TITLE.prev.cycle; updateCityWeather(0, true);
  if (TITLE.fig) { scene.remove(TITLE.fig.model.root); disposeModel(TITLE.fig.model); TITLE.fig = null; }
  if (TITLE.bang) { scene.remove(TITLE.bang); TITLE.bang = null; } $('tspeed').style.opacity = 0; titleSekzaEnd(); cameoEnd();
  finishTitleRepair();
  titleAudio(false);
  $('title').classList.add('hidden'); G.state = 'menu'; initAudio();
  camera.fov = 70; camera.up.set(0, 1, 0); camera.rotation.z = 0; camera.updateProjectionMatrix(); gfxSet(GFX.level, GFX.auto, false);
  // entre el inicio y el selector hay una pantalla de carga (js/carga_partida.js) que libera lo del inicio y precarga el selector
  const enter = () => {
    $('menu').classList.remove('hidden'); showSelect(G.charId);
    const mn = $('menu'); mn.classList.add('menufall'); const fl = $('tfall'); fl.className = 'black'; void fl.offsetWidth; fl.className = 'fade'; setTimeout(() => { fl.className = ''; }, 3200);
    setTimeout(() => { if (G.state === 'menu') menuVoice(G.charId); }, 1500); setTimeout(() => mn.classList.remove('menufall'), 3800);
  };
  if (window.CF_CARGA) CF_CARGA.run(enter); else enter();
}
function titleLeave() {
  if (!TITLE.on || TITLE.lt != null) return; TITLE.lt = 0; $('title').classList.add('leaving'); initAudio();
}
// Sekza volando con una bandada de gaviotas: entra desde detrás de la cámara, se distrae, se desvía y se estrella contra un edificio alto (cada ~50 s)
function sekzaTarget(cp) {
  camera.updateMatrixWorld();
  let best = null, bestScore = -Infinity;
  for (const b of CITY.skyline) {
    if (b.h < 11) continue;
    const dx = cp.x - b.x, dz = cp.z - b.z;
    const p = new V3(b.x, b.h * .72, b.z);
    if (Math.abs(dx) / b.w > Math.abs(dz) / b.d) p.x += Math.sign(dx) * (b.w / 2 + .04);
    else p.z += Math.sign(dz) * (b.d / 2 + .04);
    const v = p.clone().project(camera), dist = p.distanceTo(cp);
    if (v.z < -1 || v.z > 1 || Math.abs(v.x) > .95 || v.y > .9 || v.y < -.5 || dist > 220) continue;
    const score = b.h - Math.abs(v.x) * 16 - dist * .05;
    if (score > bestScore) { bestScore = score; best = { b, p, screenX: v.x }; }
  }
  return best;
}
function startTitleTowerFall(target) {
  const { b, screenX } = target;
  // Se vence hacia el centro de la toma, girando sobre el borde de su base.
  const dir = new V3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize().multiplyScalar(screenX > 0 ? -1 : 1);
  const edge = (b.w * Math.abs(dir.x) + b.d * Math.abs(dir.z)) / 2;
  const pivot = new V3(b.x, 0, b.z).addScaledVector(dir, edge);
  const groups = new Map();
  for (const { mesh, index } of b.parts) {
    if (!groups.has(mesh)) groups.set(mesh, []);
    const rest = new THREE.Matrix4();
    mesh.getMatrixAt(index, rest);
    groups.get(mesh).push({ index, rest });
  }
  return { b, groups, dir, pivot, axis: new V3(dir.z, 0, -dir.x), transform: new THREE.Matrix4(), matrix: new THREE.Matrix4(), offset: new V3(), landed: false };
}
function poseTitleTower(fall, angle, lift = 0, slide = 0) {
  const { axis, pivot, dir, transform, offset, matrix, groups } = fall;
  transform.makeRotationAxis(axis, angle);
  offset.copy(pivot).applyMatrix4(transform).negate().add(pivot).addScaledVector(dir, slide);
  offset.y += lift;
  transform.setPosition(offset);
  for (const [mesh, parts] of groups) {
    for (const { index, rest } of parts) mesh.setMatrixAt(index, matrix.multiplyMatrices(transform, rest));
    mesh.instanceMatrix.needsUpdate = true;
  }
}
function updateTitleTowerFall(fall, t) {
  if (fall.landed) return;
  const k = clamp((t - .5) / 1.6, 0, 1);
  const wobble = Math.sin(t * 20) * Math.exp(-t * 6) * .075;
  poseTitleTower(fall, (Math.PI / 2) * k ** 2 + wobble * (1 - k));
  if (k < 1) return;
  fall.landed = true;
  fall.repairAt = TITLE.t + 10;
  const { b, pivot, dir } = fall;
  const impact = pivot.clone().addScaledVector(dir, b.h * .8).setY(.4);
  for (const span of [.2, .48, .76, .98]) {
    const p = pivot.clone().addScaledVector(dir, b.h * span).setY(1.4);
    for (let i = 0; i < 14; i++) {
      emit(p.x + rand(-2, 2), p.y, p.z + rand(-2, 2), rand(-5, 5), rand(4, 10), rand(-5, 5), '#d7b8a0', rand(1.4, 2.8), rand(1.3, 2.4), -.06, 1);
    }
    burst(p, 10, '#9c8884', 13, .7, 1.3, .6, 3.5);
  }
  TITLE.boomShake = .7;
  sfx('boom', impact, 1.1, { range: 260, title: true });
}
const bez = (p0, p1, p2, k) => p0.clone().multiplyScalar((1 - k) * (1 - k)).addScaledVector(p1, 2 * (1 - k) * k).addScaledVector(p2, k * k);
function titleSky(dt, t, cp, yaw) {
  const K = TITLE.sek;
  if (!K) {
    if (!TITLE.wreck && TITLE.cm?.id !== 'gatoBoat' && TITLE.lt == null && t >= TITLE.nextSek && BEACH.gulls[0] && CHARS.sekza) titleSekzaStart(cp, yaw);
    return;
  }
  K.t += dt; const T = K.t, m = K.model, x = K.anim.x;
  const T1 = 8.5, T2 = T1 + 1.2, T3 = T2 + 1.7;   // vuelo tranquilo dando vueltas a la vista · se distrae · picada descontrolada hasta el choque
  let pos, roll = 0, flail = 0;
  if (T < T1) { const u = T / T1, e = 1 - (1 - u) * (1 - u); pos = K.curve.getPoint(e); pos.y += Math.sin(T * 1.6) * .6; K.tan = K.curve.getTangent(e); }   // paseo tranquilo con una voltereta de lucimiento
  else if (T < T2) { const u = (T - T1) / (T2 - T1); pos = K.mid.clone().addScaledVector(K.dir0, u * 6); pos.y += Math.sin(u * 3) * .3; roll = Math.sin(u * 9) * .25 * u; }
  else if (!K.boom && T < T3) { const k = (T - T2) / (T3 - T2), e = k * k * (.4 + .6 * k); pos = bez(K.mid.clone().addScaledVector(K.dir0, 6), K.ctrl, K.tgt, e); roll = k * 9; flail = 1; }
  else pos = K.tgt.clone();
  // orientación según hacia dónde se mueve
  { let want = K.yaw; if (T < T1 && K.tan) want = Math.atan2(K.tan.x, K.tan.z); else if (K.prev && pos.distanceToSquared(K.prev) > 1e-4) { const d = pos.clone().sub(K.prev); want = Math.atan2(d.x, d.z); }
    if (want != null) { const prevY = K.yaw == null ? want : K.yaw; K.yaw = K.yaw == null ? want : angLerp(K.yaw, want, Math.min(1, dt * 4)); K.bank = (K.bank || 0) + (clamp(wrapA(K.yaw - prevY) / Math.max(dt, 1e-3) * -.35, -.6, .6) - (K.bank || 0)) * Math.min(1, dt * 3); } }
  K.prev = pos.clone();
  if (!K.boom) {
    m.root.position.set(pos.x, pos.y + Math.sin(T * 21) * .18 * (1 - flail), pos.z); m.root.rotation.y = K.yaw || 0; m.root.rotation.z = (K.bank || 0) + Math.sin(T * 1.3) * .08 + roll;
    if (T < T1) Object.assign(x, { ix: 1.4 + Math.sin(T * 21) * .05, tx: -.2, hx: -.8, hy: 0, alx: -2.6 + Math.sin(T * 21) * .25, arx: -2.6 + Math.sin(T * 21) * .25, alz: .3, arz: -.3, llx: .35 + Math.sin(T * 6) * .25, lrx: .25 - Math.sin(T * 6) * .25, by: -1 });
    else if (T < T2) Object.assign(x, { ix: 1.1, hx: -.5, hy: 1.2 * EZ.back(clamp((T - T1) / .3, 0, 1)), alx: -1.4, arx: -1.4, alz: .9, arz: -.9, llx: .3, lrx: .3 });   // mira a las gaviotas... y se olvida del camino
    else Object.assign(x, { ix: 1.3, hx: -1.2, hy: 0, alx: -2.9 + Math.sin(T * 30) * .9, arx: -2.9 - Math.sin(T * 30) * .9, alz: .8 + Math.sin(T * 26) * .5, arz: -.8 - Math.sin(T * 26) * .5, llx: Math.sin(T * 28) * .9, lrx: -Math.sin(T * 28) * .9 });   // agita todo: ¡se va a chocar!
    K.anim.apply(); updateWings({ alive: true, awak: 1, rFlightT: 1, onGround: false }, m, dt, T * (flail ? 2.5 : 1.4));
    if (T > T2 - .1 && !K.bang) { K.bang = bangSprite(); scene.add(K.bang); }
    if (K.bang) { const hp = m.head.localToWorld(new V3(0, 14 * PX, 0)), k = clamp((T - T2 + .1) / .2, 0, 1); K.bang.position.copy(hp); K.bang.scale.setScalar(1.6 * outBack(k)); K.bang.visible = T < T3 - .2; }
    if (!K.boom && T >= T3 && K.crash) sekzaBoom(K);
    if (!K.crash && T >= T3) m.root.visible = false;   // sin edificio a la vista: se pierde en el horizonte
  } else {
    // después del choque: humo, plumas y Sekza cae girando desde la fachada
    const u = T - K.boomT;
    updateTitleTowerFall(K.fall, u);
    if (u < 4 && Math.random() < .8) emit(K.tgt.x + rand(-1, 1), K.tgt.y + rand(-.5, 1), K.tgt.z + rand(-1, 1), rand(-.4, .4), rand(1, 2.4), rand(-.4, .4), Math.random() < .5 ? '#3a3540' : '#6b6470', rand(.35, .7), rand(2, 3.5), -.25, .8);
    if (u > .3 && u < 3.5 && Math.random() < .5) emit(K.tgt.x + rand(-3, 3), K.tgt.y + rand(-1, 2), K.tgt.z + rand(-3, 3), rand(-.5, .5), rand(-.3, .2), rand(-.5, .5), '#ffffff', .12, rand(3, 5), .08, 1.5);
    if (u > .7 && u < 3.6) { const k = u - .7; m.root.visible = true; m.root.position.set(K.tgt.x + K.out.x * k * 2.5, K.tgt.y + 2 * k - 4.9 * k * k, K.tgt.z + K.out.z * k * 2.5); m.root.rotation.x = k * 9; m.root.rotation.z = k * 6;
      Object.assign(x, { ix: 0, hx: .4, alx: -2.9 + Math.sin(k * 20) * .6, arx: -2.9 - Math.sin(k * 20) * .6, alz: -.9, arz: .9, llx: Math.sin(k * 18) * .8, lrx: -Math.sin(k * 18) * .8 }); K.anim.apply(); }
    else m.root.visible = false;
  }
  K.gulls.forEach((g, i) => {
    if (K.boom) { const v = K.gv[i], u = T - K.boomT; g.position.addScaledVector(v, dt); v.y -= dt * 1.5; g.rotation.y = Math.atan2(v.x, v.z); g.rotation.z = Math.sin(T * 14 + i) * .5; g.visible = u < 4; return; }
    const a = T * (.9 + i * .07) + i * 1.1, r = 3.2 + (i % 3) * 1.6, fwdv = new V3(Math.sin(K.yaw || 0), 0, Math.cos(K.yaw || 0)), lag = T > T2 ? 3 + i : 2 + i * .7;
    g.position.set(pos.x + Math.cos(a) * r - fwdv.x * lag, pos.y + Math.sin(a * 1.3) * 1.6 + 1, pos.z + Math.sin(a) * r - fwdv.z * lag); g.rotation.y = (K.yaw || 0) + Math.sin(a) * .4; g.rotation.z = Math.sin(T * 9 + i) * .35; g.scale.setScalar(1.3);
  });
  if (T > K.dur) titleSekzaEnd();
}
function sekzaBoom(K) {
  K.boom = true; K.boomT = K.t; K.model.root.visible = false; if (K.bang) { scene.remove(K.bang); K.bang = null; }
  K.fall = TITLE.wreck = startTitleTowerFall(K.target);
  const c = K.tgt; K.out = c.clone().sub(K.mid).setY(0).normalize().multiplyScalar(-1);
  sphereFlash(c, '#ffb347', 6, .55); sphereFlash(c, '#ffffff', 3.2, .3); ringAt(c, '#ff7a3a', 9, .6); ringAt(c, '#ffffff', 6, .45); impactStar(c, '#fff3c0', 6, .45);
  burst(c, 60, '#ff7a3a', 14, .35, .8, .4); burst(c, 40, '#ffd23f', 11, .28, .7, .3); burst(c, 30, '#8a8a8a', 9, .4, 1.4, 1.2); burst(c, 20, '#b9a07a', 7, .3, 1.6, 1.6);
  K.gv = K.gulls.map(() => new V3(rand(-1, 1), rand(.4, 1.2), rand(-1, 1)).normalize().multiplyScalar(rand(9, 16)));
  TITLE.boomShake = 1; sfx('break', c, 1.2, { range: 260, title: true });
  // ¡KABOOM! en pantalla, estilo cómic
  const v = c.clone().project(camera), d = document.createElement('div'); d.className = 'tboom'; d.textContent = '¡KABOOM!'; d.style.left = ((v.x * .5 + .5) * 100).toFixed(1) + '%'; d.style.top = ((-v.y * .5 + .5) * 100).toFixed(1) + '%'; $('title').appendChild(d); setTimeout(() => d.remove(), 1700);
}
function titleSekzaStart(cp, yaw) {
  const F = fwd(yaw), R = rightOf(yaw), c = CHARS.sekza, skin = charSkin('sekza'), faceC = copyCanvas(skin), model = buildModel(faceC, !!c.slim, scene);
  if (!model.wings) addWings(model, c.color);
  model.root.traverse(o => { if (o.isMesh) { o.receiveShadow = false; o.castShadow = false; } });
  const a = cp.clone().addScaledVector(F, -8).addScaledVector(R, -6); a.y += 7;   // empieza detrás de la cámara
  // recorrido tranquilo y a la vista: entra por la izquierda, cruza a la derecha y vuelve al centro antes de distraerse
  const p1 = cp.clone().addScaledVector(F, 16).addScaledVector(R, -4); p1.y += 8;
  const p2 = cp.clone().addScaledVector(F, 30).addScaledVector(R, 4); p2.y += 11;
  const mid = cp.clone().addScaledVector(F, 46).addScaledVector(R, -2); mid.y += 13;
  const curve = new THREE.CatmullRomCurve3([a, p1, p2, mid], false, 'centripetal');
  const tg = sekzaTarget(cp), tgt = tg ? tg.p : cp.clone().addScaledVector(F, 150).addScaledVector(R, 34).add(new V3(0, 30, 0));
  const dir0 = curve.getTangent(1).normalize(), ctrl = mid.clone().addScaledVector(dir0, 18).add(new V3(0, 4, 0)).lerp(tgt, .25);
  const gulls = []; for (let i = 0; i < 6; i++) { const g = BEACH.gulls[0].g.clone(true); scene.add(g); gulls.push(g); }
  TITLE.sek = { t: 0, dur: tg ? 15 : 11.5, a, mid, curve, dir0, ctrl, tgt, target: tg, crash: !!tg, model, anim: new Animator(model), gulls }; TITLE.sek.anim.bbR6 = true; for (const j of JOINTS) TITLE.sek.anim.x[j] = JDEF[j] || 0;
  playHtmlEffect(charSoundRel('sekza','vuelo_1'),.35,'voices');
}
// ===== Cameos de personajes en la playa: vive en js/mundo/cameos_playa.js =====
const { CAMEOS, CAMEO_IDS, CM_E, CM_W, EZ, TITLE_LIFT, TITLE_THROW, bangSprite, cameoEnd, cmGo, cmKeys, cmOff, cmPlace, cmReset, cmRun, cmSneak, cmSpawn, cmStage, cmVisible, cmWalk2, finishTitleRepair, ghostTrail, legT, outBack, smoothK, startTitleRepair, titleBoatCamera, titleCameo, titleRepairCamera, titleSekzaEnd, updateTitleRepair } = CF_MUNDO.crearCameosPlaya({ $, Animator, BEACH, CHARS, CITY, DOM_ANIMALS, G, JDEF, JOINTS, PX, SEA_Y, SHORE, TITLE, V3, WEAPONS, angLerp, buildModel, burst, camera, charSkin, clamp, copyCanvas, disposeModel, emit, fwd, ghost, groundAt, poseTitleTower, rand, ringAt, scene, setSpear, sfx, slashLine, splashFx });
function titleUpdate(dt) {
  if (!TITLE.on || !TITLE.fig) return;
  if (!TITLE.graded && window.CF_BETA && window.CF_BETA.on) { TITLE.graded = true; titleGrade(true); }   // la vista privada puede confirmarse un momento después de abrir el inicio
  TITLE.t += dt; const t = TITLE.t, f = TITLE.fig, x = f.anim.x, m = f.model, sd = CITY.sunDisc.position, br = Math.sin(t * 1.5), L = TITLE.lt;
  if (L != null) TITLE.lt += dt;
  let px, pz, back, side, ch0, lh0, fov;
  const pier = TITLE.idx === 0;
  // pose base de cada escena (todos los canales vuelven a su valor en cada cuadro: nada se acumula)
  const BASE = pier
    ? { tx: .5, hx: -.32, alx: -1.18, arx: -1.22, alz: .02, arz: -.02, llx: .1, lrx: -.06, llz: .03, lrz: -.03, by: -.4 }
    : { tx: -.1, hx: -.18, alx: -.95, arx: -.75, alz: -.08, arz: .06, llx: -1.5, lrx: -1.42, llz: .12, lrz: -.1, by: -10 };
  if (pier) { px = -1.55; pz = 108.4; back = 4.6; side = 1.4; ch0 = 1.6; lh0 = 2.1; fov = 46; }
  else { px = -10; pz = 91.5; back = 4.8; side = 1.5; ch0 = .85; lh0 = 1.35; fov = 44; }
  const gy = groundAt(px, pz, 4), yaw = Math.atan2(sd.x - px, sd.z - pz);
  const P = d => Object.assign({}, BASE, d);
  // gestos de cada escena: [duración, poses clave [t, cambio sobre la base, curva]]
  const ACTS = pier ? {
    stretch: [2.0, [[0, {}], [.25, { tx: .66, by: -1.0, sy: .95 }, 'out'], [.55, { tx: -.08, by: .5, alx: -2.75, arx: -2.75, alz: -.9, arz: .9, hx: -.5, llx: 0, lrx: 0, sy: 1.06 }, 'back'], [1.4, { tx: -.08, by: .5, alx: -2.75, arx: -2.75, alz: -.9, arz: .9, hx: -.5, llx: 0, lrx: 0 }, 'hold'], [2.0, {}, 'io']]],
    lookBack: [1.8, [[0, {}], [.3, { hy: 1.2, ty: .3, hx: -.12 }, 'back'], [1.2, { hy: 1.2, ty: .3, hx: -.12 }, 'hold'], [1.8, {}, 'io']]],
    drum: [1.6, [[0, {}], [.15, { alx: -1.48 }, 'snap'], [.3, { arx: -1.52 }, 'snap'], [.45, { alx: -1.48 }, 'snap'], [.6, { arx: -1.52 }, 'snap'], [.75, { alx: -1.48 }, 'snap'], [.9, { arx: -1.52, hy: -.3 }, 'snap'], [1.6, {}, 'io']]],
    rest: [2.4, [[0, {}], [.55, { hx: .35, tx: .64, by: -.8, sy: .97 }, 'io'], [1.7, { hx: .35, tx: .64, by: -.8, sy: .97 }, 'hold'], [2.4, {}, 'io']]],
    shift: [1.4, [[0, {}], [.3, { llx: .5, lrx: -.32, iz: .05, hy: .25 }, 'back'], [1.0, { llx: .5, lrx: -.32, iz: .05, hy: .25 }, 'hold'], [1.4, {}, 'io']]],
  } : {
    leanBack: [2.2, [[0, {}], [.45, { tx: -.48, alx: .85, arx: .85, alz: .15, arz: -.15, hx: -.38, by: -10.4 }, 'back'], [1.6, { tx: -.48, alx: .85, arx: .85, alz: .15, arz: -.15, hx: -.38, by: -10.4 }, 'hold'], [2.2, {}, 'io']]],
    stretch: [2.0, [[0, {}], [.25, { by: -10.5, tx: .12, sy: .95 }, 'out'], [.55, { alx: -2.75, arx: -2.75, alz: -.9, arz: .9, tx: -.2, hx: -.5, sy: 1.06 }, 'back'], [1.4, { alx: -2.75, arx: -2.75, alz: -.9, arz: .9, tx: -.2, hx: -.5 }, 'hold'], [2.0, {}, 'io']]],
    kick: [1.6, [[0, {}], [.2, { llx: -1.25, hy: .2 }, 'snap'], [.4, { lrx: -1.2, llx: -1.55 }, 'snap'], [.6, { llx: -1.25, lrx: -1.5 }, 'snap'], [.8, { lrx: -1.2, llx: -1.55 }, 'snap'], [1.6, {}, 'io']]],
    look: [1.7, [[0, {}], [.3, { hy: -.9, ty: -.25 }, 'back'], [.75, { hy: -.9, ty: -.25 }, 'hold'], [1.05, { hy: .9, ty: .25 }, 'back'], [1.4, { hy: .9, ty: .25 }, 'hold'], [1.7, {}, 'io']]],
    doodle: [2.4, [[0, {}], [.4, { arx: -.35, arz: .25, tx: .15, hx: .25, hy: .3 }, 'back'], [2.0, { arx: -.35, arz: .25, tx: .15, hx: .25, hy: .3 }, 'hold'], [2.4, {}, 'io']]],
    sigh: [1.5, [[0, {}], [.55, { by: -9.3, alz: -.25, arz: .25, hx: -.25, sy: 1.03 }, 'io'], [1.5, {}, 'io']]],
  };
  let actSy = 0;
  if (L == null && !TITLE.act && t > (TITLE.nextAct == null ? 3 : TITLE.nextAct)) { const names = Object.keys(ACTS).filter(n => n !== TITLE.lastAct), nm = names[(Math.random() * names.length) | 0]; TITLE.act = { nm, t0: t, pier }; TITLE.lastAct = nm; }
  if (TITLE.act && (TITLE.act.pier !== pier || !ACTS[TITLE.act.nm])) TITLE.act = null;   // cambió de escena
  if (L == null && TITLE.act) {
    const A = TITLE.act, [d, keys] = ACTS[A.nm], u = t - A.t0;
    if (u >= d) { TITLE.act = null; TITLE.nextAct = t + rand(2.5, 5); cmKeys(x, [[0, BASE]], 0); }
    else { const sy = cmKeys(x, keys.map(k => [k[0], P(k[1]), k[2]]), u); actSy = sy - 1; if (A.nm === 'doodle' && u > .4 && u < 2.0) { x.arz += Math.sin(u * 9) * .18; x.arx += Math.cos(u * 9) * .12; } }
  } else cmKeys(x, [[0, BASE]], 0);
  // respiración y vida mínima (se suma una sola vez por cuadro sobre la pose limpia)
  x.tx += br * .014; x.by += Math.sin(t * 1.5) * .05; x.hy += Math.sin(t * .31) * .05; x.hx += Math.sin(t * .4) * .025;
  // ---- salida estilo anime: susto (agacha y levanta la cabeza + "!") -> giro rápido con rebote -> zoom -> la cámara se cae -> negro
  let turn = 0, sx = 1, sy = 1, bang = 0, lines = 0, zoom = 0, shake = 0;
  if (L != null) {
    const a = clamp(L / .14, 0, 1), k = clamp((L - .14) / .2, 0, 1);
    if (L < .14) { const q = Math.sin(a * 1.57); x.by -= 1.4 * q; x.hx -= .3 * q; x.tx = (x.tx || 0) - .1 * q; sx = 1 + .05 * q; sy = 1 - .07 * q; }
    else { turn = outBack(k); const st = Math.sin(clamp(k, 0, 1) * 3.14); sy = 1 + .1 * st; sx = 1 - .05 * st; x.hy = -Math.sin(clamp(k * 1.7, 0, 1) * 1.57) * 1.1 * (1 - clamp((k - .5) * 2, 0, 1)); x.hx *= .4; if (TITLE.idx === 0) x.tx *= 1 - clamp(k * 1.4, 0, 1) * .9; }
    bang = L < .62 ? outBack((L - .02) / .16) * (L > .5 ? clamp((.62 - L) / .12, 0, 1) : 1) : 0;
    lines = L > .14 && L < .5 ? (L < .2 ? 1 : clamp(1 - (L - .2) / .3, 0, 1)) : 0; zoom = clamp((L - .17) / .1, 0, 1) * (L > .4 ? clamp(1 - (L - .4) / .1, 0, 1) : 1); shake = L > .14 && L < .42 ? 1 : 0;
  }
  m.root.position.set(px, gy + .02, pz); m.root.rotation.y = yaw + turn * Math.PI; m.root.scale.set(sx * (1 - actSy * .5), sy * (1 + actSy), sx * (1 - actSy * .5));
  f.anim.apply(); f.blinkT -= dt; if (f.blinkT < -.13) f.blinkT = rand(2, 4.5); try { updateFace(f, dt); } catch (e) { }
  if (!TITLE.bang) { TITLE.bang = bangSprite(); scene.add(TITLE.bang); }
  const hp = m.head.localToWorld(new V3(0, 13 * PX, 0)); TITLE.bang.position.set(hp.x, hp.y + .15, hp.z); TITLE.bang.scale.setScalar(.9 * Math.max(.001, bang)); TITLE.bang.visible = bang > .01;
  $('tspeed').style.opacity = lines;
  // cámara fija (se calcula una vez) con un temblor muy leve
  if (TITLE.baseIdx !== TITLE.idx) {
    const F = fwd(yaw), Rv = rightOf(yaw), a10 = .17;
    TITLE.base = { cam: new V3(px - F.x * back + Rv.x * side, gy + ch0, pz - F.z * back + Rv.z * side), fov, gy };
    const c = TITLE.base.cam; TITLE.base.look = new V3(c.x + (F.x * Math.cos(a10) - Rv.x * Math.sin(a10)) * 20, gy + lh0, c.z + (F.z * Math.cos(a10) - Rv.z * Math.sin(a10)) * 20); TITLE.baseIdx = TITLE.idx;
  }
  const nh = i => { const q = Math.sin(i * 127.1 + 311.7) * 43758.5453; return q - Math.floor(q); }, sn = v => { const i = Math.floor(v), f = v - i, u = f * f * (3 - 2 * f); return nh(i) * (1 - u) + nh(i + 1) * u - .5; };
  const B = TITLE.base;
  const cam = B.cam.clone(), look = B.look.clone(); let roll = sn(t * .55 + 50) * .006;
  { const ci = clamp(t / 5, 0, 1), ce = 1 - ci * ci * (3 - 2 * ci), dv = look.clone().sub(cam).setY(0).normalize(); cam.addScaledVector(dv, -ce * 2.2); cam.y += ce * .6; look.y += ce * .15; }   // travelling y grúa de entrada; luego la cámara queda fija
  updateTitleRepair(dt);
  const cameoFov = titleRepairCamera(cam, look) ?? titleBoatCamera(cam, look);
  if (TITLE.boomShake > 0) { cam.x += sn(t * 28 + 3) * .2 * TITLE.boomShake; cam.y += sn(t * 31 + 9) * .16 * TITLE.boomShake; roll += sn(t * 25) * .02 * TITLE.boomShake; TITLE.boomShake = Math.max(0, TITLE.boomShake - dt * 1.3); }
  cam.x += (sn(t * .7) + .5 * sn(t * 1.9 + 10)) * .05 + shake * sn(t * 24) * .12; cam.y += (sn(t * .8 + 20) + .5 * sn(t * 2.3 + 30)) * .04 + Math.sin(t * 1.25) * .008 + shake * sn(t * 21 + 7) * .1; look.y += sn(t * .6 + 40) * .09; look.x += sn(t * .5 + 60) * .09; look.z += sn(t * .45 + 80) * .09;
  if (L != null && L > .4) {   // la cámara se cae cuando el personaje termina de girar
    const fl = L - .4, drop = .5 * 9.8 * fl * fl * 2.4; cam.y = Math.max(B.gy + .06, cam.y - drop); roll += fl * 3.4; look.y -= fl * 5 * (1 + fl * 2);
    if (!TITLE.thud && cam.y <= B.gy + .09) { TITLE.thud = true; sfx('break', cam, 1); $('tfall').classList.add('black'); }
  }
  camera.position.copy(cam); camera.up.set(0, 1, 0); camera.lookAt(look); camera.rotateZ(roll); camera.fov = (cameoFov ?? B.fov) - 9 * zoom; camera.updateProjectionMatrix();
  // ---- Sekza cruza el cielo con las gaviotas y se va hacia el sol
  titleSky(dt, t, camera.position, yaw);
  if (!TITLE.wreck?.repair) titleCameo(dt, t);
  // ---- polvo flotando en la luz, rayos, destello de lente y grano
  if (Math.random() < dt * 14) { const F2 = fwd(yaw), R2 = rightOf(yaw), d = rand(3, 20), sd2 = rand(-9, 9); emit(camera.position.x + F2.x * d + R2.x * sd2, camera.position.y + rand(-1, 2.8), camera.position.z + F2.z * d + R2.z * sd2, rand(-.06, .06), rand(.03, .18), rand(-.06, .06), Math.random() < .3 ? '#ffffff' : '#ffd9a0', rand(.025, .06), rand(5, 9), 0, .5); }
  { const v = CITY.sunDisc.position.clone().project(camera), vis = cameoFov == null && v.z < 1 && Math.abs(v.x) < 1.6 && Math.abs(v.y) < 1.6, sx = (v.x * .5 + .5) * 100, sy = (-v.y * .5 + .5) * 100;
    const ry = $('trays'); ry.style.setProperty('--sx', sx.toFixed(1) + '%'); ry.style.setProperty('--sy', sy.toFixed(1) + '%'); ry.style.opacity = vis ? .55 : 0;
    const fls = document.querySelectorAll('.tfl'), mx = 50 - sx, my = 50 - sy;
    fls.forEach((el, i) => { const k = [.35, .7, 1.15, 1.5][i]; el.style.left = (sx + mx * k).toFixed(1) + '%'; el.style.top = (sy + my * k).toFixed(1) + '%'; el.style.opacity = vis && !TITLE.lt ? .85 : 0; }); }
  if(TITLE.mus)fadeAudioTrack(TITLE.mus,MUS.vol*TITLE.mus.trim*MUS.duck*(SETTINGS_EXT?.65:1),dt);
  TITLE.gullT-=dt;
  if(TITLE.gullT<=0&&AC){
    TITLE.gullT=rand(7,14);
    if(WX.sound)playHtmlEffect(sndUrl(Math.random()<.5?'gull1':'gull2'),.22,'ambient','title');
  }
  if (TITLE.rim && TITLE.rim.parent) { const sdv = CITY.sunDisc.position, d = new V3(sdv.x - px, 0, sdv.z - pz).normalize(); TITLE.rim.position.set(px + d.x * 3.6, gy + 2.4, pz + d.z * 3.6); TITLE.fill.position.set(camera.position.x, camera.position.y + .5, camera.position.z); TITLE.top.position.set(px, gy + 6, pz - d.z * 2); }
  if (L != null && L > .95) { TITLE.thud = false; titleFinish(); }
}
$('tplay').addEventListener('click', e => { e.stopPropagation(); titleLeave(); });
tmWire();
$('tscene').addEventListener('click', e => { e.stopPropagation(); if (TITLE.lt != null) return; TITLE.idx = 1 - TITLE.idx; try { localStorage.setItem('bsb_title_idx', String(TITLE.idx)); } catch (x) { } });
loadCharSkins().then(() => {
  LOADER.setProgress(92, 'Generando entorno y shaders cel-shaded...');
  ensureNormalAll();
  renderRoster();
  showSelect(G.charId, true);
  titleStart();
  setTimeout(() => LOADER.finish(), 250);
});
if (!IS_GUIDE) netInit();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (SH.fig) drawBackdrop(SH.fig.ch); });
try {
  const d = localStorage.getItem('bsb_skin');
  if (d) { const img = new Image(); img.onload = () => { const c = normalizeSkin(img); if (c) setCustomSkin(c, 'Usando tu skin guardada.'); }; img.src = d; }
} catch (e) { }

// ================= Bucle principal =================
function step(dt) {
  frameTask('escenario',()=>{destRestore();destUpdate(dt);holesUpdate();});
  G.time += dt;
  for(let i=TIMERS.length-1;i>=0;i--){const tm=TIMERS[i];if(!tm)continue;tm.t-=dt;if(tm.t<=0){TIMERS.splice(i,1);frameTask('evento',()=>tm.fn());}}
  frameTask('intro',()=>introTick(dt));
  for (const f of G.fighters) {
    if (f.remote) continue;
    if(f.alive)frameTask('accion:'+f.ch.id,()=>{const c=f.guideCtl?f.guideCtl(f,dt):f.isPlayer?(introActive()?VB_NEUTRAL():VB.on?vbPlayerCtl(f,playerCtl()):playerCtl()):f.vbBot?vbBotCtl(f,dt):f.isBoss?VB_NEUTRAL():f.dummy?dummyCtl(f,dt):VB.on?VB_NEUTRAL():aiCtl(f,dt);applyCtl(f,c,dt);updateAction(f,dt);},()=>cancelFailedAction(f));
    if (G.cine) break;
  }
  for(const f of G.fighters){
    updateContactShadow(f);
    updateAwakeningAura(f, dt);
    if(f.remote)continue;frameTask('fisica:'+f.ch.id,()=>physics(f,dt));frameTask('tiempos:'+f.ch.id,()=>tickTimers(f,dt));frameTask('pose:'+f.ch.id,()=>animate(f,dt),()=>{cancelFailedAction(f);f.anim.reset();f.model.root.position.copy(f.pos);});}
  const F = G.fighters;
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
    const a = F[i], b = F[j]; if (a.remote || b.remote || !a.alive || !b.alive || a.grabbed || b.grabbed || Math.abs(a.pos.y - b.pos.y) > 1.8) continue;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d < .8 && d > 1e-4) { const push = (.8 - d) / 2; a.pos.x -= dx / d * push; a.pos.z -= dz / d * push; b.pos.x += dx / d * push; b.pos.z += dz / d * push; }
  }
  frameTask('proyectiles',()=>updateProj(dt));frameTask('zonas',()=>updateZones(dt));updateFx(dt);updateSkillObjs(dt);frameTask('particulas',()=>PS.update(dt));
  updateSekzaSpecials(dt);
  updateSpearDrops(dt);
  autoBalance(dt);
  pressed.clear();
}
let last = performance.now();
// ===== Minijuego: vóley playa: vive en js/modos/voley.js =====
const { VB, VBC, VB_NEUTRAL, VB_PADS, updateVolley, vbBotCtl, vbBox, vbEnd, vbGuest, vbHitBall, vbHud, vbInit, vbLobby, vbNames, vbOther, vbOver, vbPin, vbPlace, vbPlayerCtl, vbPoint, vbPointFx, vbPredict, vbPub, vbPubHit, vbScoreHud, vbServe, vbSim, vbSpawnBot, vbSpot, vbStart } = CF_MODOS.crearVoley({ CITY_GRAD, DUMMY_CH, Fighter, G, NET, V3, aiParams, burst, cam, chestOf, clamp, endAction, fwd, groundAt, playSnd, r2, ringAt, scene, shakeFrom, showBanner });
// ===== Opciones por categorías (Sonido · Gráficos · Controles · Pantalla · Misceláneos) =====
let showSettingsCat = () => {};
{
  const tabs = document.querySelectorAll('#pause-settings .set-tabs button');
  showSettingsCat = cat => {
    tabs.forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
    document.querySelectorAll('#pause-settings section[data-cat]').forEach(sec => sec.classList.toggle('hidden', sec.dataset.cat !== cat));
    try { localStorage.setItem('bsb_setcat', cat); } catch (e) { }
  };
  tabs.forEach(b => b.addEventListener('click', () => showSettingsCat(b.dataset.cat)));
  let c0 = 'snd'; try { c0 = localStorage.getItem('bsb_setcat') || 'snd'; } catch (e) { }
  showSettingsCat(['snd', 'gfx', 'ctl', 'hud', 'misc'].includes(c0) ? c0 : 'snd');
}

// ===== Controles personalizables + Visibilidad HUD + Eventos Marinos =====
let BIND_WAIT = null;
function saveBinds() {
  try { localStorage.setItem('bsb_binds_v1', JSON.stringify(BINDS)); } catch (e) { }
  bindsSyncUI();
}
function bindsSyncUI() {
  const list = $('binds-list');
  if (list) {
    list.innerHTML = '';
    for (const k of Object.keys(BINDS_DEF)) {
      const row = document.createElement('div');
      row.className = 'bind-row';
      const lbl = document.createElement('span');
      lbl.textContent = (BINDS_LABELS.find(x => x[0] === k) || [])[1] || k;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bind-btn' + (BIND_WAIT === k ? ' wait' : '');
      btn.textContent = BIND_WAIT === k ? 'Presiona tecla…' : bindKeyLabel(BINDS[k]);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        BIND_WAIT = BIND_WAIT === k ? null : k;
        bindsSyncUI();
      });
      row.append(lbl, btn);
      list.appendChild(row);
    }
  }
  if ($('bookkbd')) $('bookkbd').textContent = bindKeyLabel(BINDS.guide);
  document.querySelectorAll('[data-bind-lbl]').forEach(el => {
    const id = el.dataset.bindLbl;
    if (id === 'move') el.textContent = `${bindKeyLabel(BINDS.fwd)} ${bindKeyLabel(BINDS.left)} ${bindKeyLabel(BINDS.back)} ${bindKeyLabel(BINDS.right)}`;
    else if (id === 'skills') el.textContent = `${bindKeyLabel(BINDS.s1)} ${bindKeyLabel(BINDS.s2)} ${bindKeyLabel(BINDS.s3)} ${bindKeyLabel(BINDS.s4)}`;
    else if (BINDS[id]) el.textContent = bindKeyLabel(BINDS[id]);
  });
  if (G.player) buildSkillBar(G.player);
}
addEventListener('keydown', e => {
  if (!BIND_WAIT) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (e.code !== 'Escape') BINDS[BIND_WAIT] = e.code;
  BIND_WAIT = null;
  saveBinds();
}, true);
if ($('binds-reset')) $('binds-reset').addEventListener('click', () => { BIND_WAIT = null; Object.assign(BINDS, BINDS_DEF); saveBinds(); });
if ($('cfg-open-binds')) $('cfg-open-binds').addEventListener('click', () => { openSettings(); showSettingsCat('ctl'); bindsSyncUI(); });

const HUD_CFG = { all: false, vitals: true, skills: true, combo: true, nums: true, feed: true, topl: true, plates: true };
try {
  const savedHud = JSON.parse(localStorage.getItem('bsb_hud_cfg_v1') || 'null');
  if (savedHud && typeof savedHud === 'object') Object.assign(HUD_CFG, savedHud);
} catch (e) { }
function applyHudCfg() {
  document.body.classList.toggle('hide-hud-all', !!HUD_CFG.all);
  document.body.classList.toggle('hide-hud-vitals', !HUD_CFG.vitals);
  document.body.classList.toggle('hide-hud-skills', !HUD_CFG.skills);
  document.body.classList.toggle('hide-hud-combo', !HUD_CFG.combo);
  document.body.classList.toggle('hide-hud-nums', !HUD_CFG.nums);
  document.body.classList.toggle('hide-hud-feed', !HUD_CFG.feed);
  document.body.classList.toggle('hide-hud-topl', !HUD_CFG.topl);
  document.body.classList.toggle('hide-hud-plates', !HUD_CFG.plates);
  try { localStorage.setItem('bsb_hud_cfg_v1', JSON.stringify(HUD_CFG)); } catch (e) { }
}
function hudSyncUI() {
  const bindChk = (id, key) => {
    const el = $(id); if (!el) return;
    el.checked = !!HUD_CFG[key];
    if (!el._boundHud) {
      el._boundHud = true;
      el.addEventListener('change', () => { HUD_CFG[key] = el.checked; applyHudCfg(); });
    }
  };
  bindChk('hud-hide-all', 'all');
  bindChk('hud-vitals', 'vitals');
  bindChk('hud-skills', 'skills');
  bindChk('hud-combo', 'combo');
  bindChk('hud-nums', 'nums');
  bindChk('hud-feed', 'feed');
  bindChk('hud-topl', 'topl');
  bindChk('hud-plates', 'plates');
  const sh = $('opt-sharks');
  if (sh) {
    sh.checked = SEA.sharksOn !== false;
    if (!sh._bound) { sh._bound = true; sh.addEventListener('change', () => { SEA.sharksOn = sh.checked; try { localStorage.setItem('bsb_sea_sharks', sh.checked ? '1' : '0'); } catch (e) { } }); }
  }
  seaEventsUi();
  const wh = $('opt-whale');
  if (wh) {
    wh.checked = SEA.whaleAuto !== false;
    if (!wh._bound) { wh._bound = true; wh.addEventListener('change', () => { SEA.whaleAuto = wh.checked; try { localStorage.setItem('bsb_sea_whale', wh.checked ? '1' : '0'); } catch (e) { } }); }
  }
  const mz = $('mm-zoom'), mzv = $('mm-zoom-o');
  if (mz) {
    mz.value = MM.zoom;
    if (mzv) mzv.textContent = MM.zoom.toFixed(1) + '×';
  }
}
applyHudCfg();
bindsSyncUI();

if ($('btn-whale-now')) $('btn-whale-now').addEventListener('click', () => {
  triggerWhaleEvent(true);
  if (G.paused) setPause(false);
});

// ===== Minimapa: la ciudad desde arriba con zoom centrado en el jugador: vive en js/ui/minimapa.js =====
const { CFG_CINE, MM, mmApply, mmBackground, mmDraw, mmX, mmZ } = CF_UI.crearMinimapa({ $, CITY, FPS, G, HUD_CFG, MAPCUR, SEA, SHORE, STAGE, TAU, cam, cineGrade, clamp, endCamScript, fwd, hudSyncUI, mapNow, worldBig });
hudSyncUI();   // necesita MM: va después de crear el minimapa
// ===== Libro: guía de combate con el motor REAL del juego =====
// La vista previa no imita nada: mete a tu personaje y a un dummy en la plaza de la ciudad y apreta los mismos botones que apretarías vos
// (golpe, bloqueo, esquiva, habilidades, G...) con el motor de la pelea: mismas animaciones, efectos, sonidos, cámara y cinemáticas.
// La pelea de fondo queda congelada (sus peleadores se esconden y se vuelven a poner al cerrar). En partidas online no se puede congelar nada, por eso ahí solo hay texto.
const CB = { open: false, mode: 'basic', idx: 0, E: null };
const GS = { on: false, real: null, att: null, vic: null, t: 0, E: null, fired: null, pulse: { skill: null, ult: false }, numsHome: null };
const NEUTRAL = () => ({ mx: 0, mz: 0, jump: false, dash: false, m1: false, block: false, skill: -1, ult: false, up: false });
const when = (t, a, b) => t >= a && t < b;
const CB_BASIC = [
  { id: 'move', n: 'Moverse', keys: ['W', 'A', 'S', 'D'], d: 'Caminá y corré por la ciudad. La cámara se mueve con el mouse y el personaje va hacia donde apuntás.',
    tips: ['Correr en diagonal no es más rápido: elegí bien el camino.', 'En el mar nadás; con <b>Espacio</b> subís y con <b>Shift</b> bajás.'], len: 5, solo: true,
    ctl(t, c) { c.mx = when(t, .3, 2) ? 1 : when(t, 2.2, 3.9) ? -1 : 0; } },
  { id: 'jump', n: 'Saltar', keys: ['Espacio'], d: 'Salto alto para esquivar golpes bajos, subir a techos y perseguir a los que lanzás por el aire.',
    tips: ['Algunos personajes pueden esquivar en el aire una vez.', 'Durante un ataque no podés saltar: terminá el golpe primero.'], len: 4.2, solo: true,
    ctl(t, c) { c.jump = when(t, .5, .62) || when(t, 2.2, 2.32); } },
  { id: 'm1', n: 'Combo de golpes', keys: ['Clic', '×4'], d: 'Hacé clic seguido para encadenar cuatro golpes. Los tres primeros son rápidos y el cuarto es un remate que empuja lejos al rival.',
    tips: ['Si dejás de pegar más de <b>1 segundo</b>, el combo vuelve a empezar.', 'Después del remate hay una pausa corta antes de volver a pegar.', 'Cada golpe carga tu barra de despertar.'], len: 5, gap: 1.7,
    ctl(t, c) { c.m1 = when(t, .6, 2.6); } },
  { id: 'launch', n: 'Remate al aire', keys: ['Espacio', '+', '4º golpe'], d: 'Mantené Espacio mientras hacés el cuarto golpe: en vez de empujar, el remate lanza al rival hacia arriba.',
    tips: ['Saltá justo después para seguir el combo en el aire.', 'Sirve para sacar al rival de una pelea entre varios.'], len: 5.2, gap: 1.7,
    ctl(t, c) { c.m1 = when(t, .6, 2.8); c.up = t > .5; } },
  { id: 'block', n: 'Bloquear', keys: ['F', '(mantener)'], d: 'Mientras mantenés F te cubrís: los golpes de frente casi no te hacen daño (solo el 12 %) y además cargás algo de despertar.',
    tips: ['Solo cubre <b>de frente</b>: por la espalda te pegan normal.', 'Bloqueando no podés atacar ni saltar.', 'Las habilidades fuertes rompen la guardia (mirá la siguiente).'], len: 5.5, gap: 1.8,
    ctl(t, c) { c.block = t > .2; },
    ev: [[.9, P => { P.vic.dummy = 'attack'; }]] },
  { id: 'guard', n: 'Romper guardia', keys: ['Habilidades'], d: 'Algunos ataques fuertes rompen el bloqueo: el que se estaba cubriendo queda mareado más de un segundo y no puede hacer nada.',
    tips: ['Si ves que el rival prepara un ataque grande, <b>esquivá</b> en vez de bloquear.', 'En la lista de habilidades, las que rompen guardia lo dicen en su descripción.'], len: 4.6, gap: 1.8,
    ctl(t, c) { c.block = t > .1 && t < 1.2; },
    ev: [[1.0, P => { const dir = fwd(P.vic.yaw); applyHit(P.vic, P.att, { dmg: 8, stun: 1.2, kb: 12, up: 6, color: '#ffd91a', noCounter: true, guardBreak: true, hitstop: .15, shake: .6, dir }); }]] },
  { id: 'dash', n: 'Esquivar', keys: ['Q'], d: 'Un impulso rápido hacia donde te movés (o hacia adelante si estás quieto). Durante el primer instante sos intocable.',
    tips: ['Se recarga en <b>1,4 segundos</b>: no la gastes sin motivo.', 'En el aire se puede usar una vez por salto.', 'Esquivar cancela el bloqueo.'], len: 5, solo: true,
    ctl(t, c) { c.dash = when(t, .6, .7) || when(t, 2.4, 2.5); c.mx = when(t, .6, .7) ? 1 : when(t, 2.4, 2.5) ? -1 : 0; } },
  { id: 'skills', n: 'Habilidades', keys: ['1', '2', '3', '4'], d: 'Cada personaje tiene cuatro habilidades propias. Abajo a la derecha ves cuánto les falta para recargarse.',
    tips: ['Mezclalas con el combo: un golpe, una habilidad y otro golpe.', 'En la pestaña Habilidades ves la ficha completa de cada una.'], len: 6, gap: 3.2,
    ctl(t, c, P) { if (when(t, .5, .6)) c.skill = 0; if (when(t, 2.6, 2.7)) c.skill = 1; } },
  { id: 'awake', n: 'Despertar (ulti)', keys: ['G'], d: 'Cuando la barra celeste llega al 100 % apretá G: tu personaje despierta, hace su ulti y por un rato sus habilidades cambian por otras más fuertes.',
    tips: ['La barra se carga pegando, recibiendo golpes y bloqueando.', 'Cada K.O. te da un <b>20 %</b> de golpe.', 'Cada personaje tiene su propia música de ulti.'], len: 11, gap: 6, ult: true,
    ctl(t, c, P) { c.ult = when(t, .5, .6); } },
  { id: 'lock', n: 'Shift lock', keys: ['Shift'], d: 'Tocá Shift para fijar la cámara detrás del personaje: siempre mira hacia donde apuntás, aunque camines de costado o para atrás.',
    tips: ['Ideal para apuntar habilidades y lanzar la lanza.', 'Volvé a tocar Shift para soltarla.'], len: 5, gap: 4, lock: true,
    ctl(t, c) { c.mx = when(t, .4, 1.9) ? 1 : when(t, 2, 3.5) ? -1 : 0; c.mz = when(t, 3.6, 4.5) ? -.6 : 0; } },
];
// ===== Libro de habilidades: vive en js/ui/libro_habilidades.js =====
const { GS_Y, SKB, SK_REST, SK_TAG, SK_TIPS, SK_ULT_TAGS, bookBasic, bookClose, bookOpen, bookTab, cbSelect, curChar, guideBlit, guideBuild, guideCam, guideEnter, guideFit, guideFrame, guideLeave, guideNet, guideNums, guidePost, guideStage, guideTick, guideWipe, n1, skEntry, skFacts, skGrid, skGroups, skPickChar, skRender, skSelect } = CF_UI.crearLibroHabilidades({ $, BINDS, CAMFX, CB, CB_BASIC, CHARS, CHAR_IDS, CHORE, DN, DUMMY_CH, FX, Fighter, G, GFX, GS, IMPACT, IS_GUIDE, NEUTRAL, PROJ, PS, TIMERS, ZONES, aiParams, cam, camera, charSkin, choreEnd, cineGrade, clamp, clearSkillObjs, destRestore, endCamScript, headPortrait, keys, mouse, netTick, renderer, requestLock, runUlt, scene, seqHud, unlock, vReset, get GUIDE_Y() { return GUIDE_Y; }, set GUIDE_Y(v) { GUIDE_Y = v; }, get BIND_WAIT() { return BIND_WAIT; } });
function loop(now){
  requestAnimationFrame(loop);
  if(IS_GUIDE&&GUIDE_OFF){last=Number.isFinite(now)?now:performance.now();return;}
  if (typeof GFX_LIMIT !== 'undefined') {
    /* Limitador parejo: mide cada cuanto refresca el monitor (60, 144, 200 Hz...) y dibuja siempre cada N refrescos.
       Antes saltaba 3,3,4,3,3,4 refrescos (cuadros desiguales = "saltitos") cuando el limite no dividia justo la frecuencia. */
    const tNow = Number.isFinite(now) ? now : performance.now(), gap = tNow - (GFX_LIMIT.rafLast || tNow); GFX_LIMIT.rafLast = tNow;
    if (gap > 2 && gap < 50) GFX_LIMIT.hz = GFX_LIMIT.hz ? GFX_LIMIT.hz + (gap - GFX_LIMIT.hz) * .05 : gap;
    if (GFX_LIMIT.minDt > 0 && GFX_LIMIT.hz) {
      const every = Math.max(1, Math.round(GFX_LIMIT.minDt / GFX_LIMIT.hz));
      GFX_LIMIT.skip = (GFX_LIMIT.skip || 0) + 1; if (GFX_LIMIT.skip < every) return; GFX_LIMIT.skip = 0;
    }
  }
  try{
  const rawDt=Number.isFinite(now)&&Number.isFinite(last)?Math.max(0,(now-last)/1000):0,rdt=Math.min(.05,rawDt);last=Number.isFinite(now)?now:performance.now();
  frameTask('contador',()=>{gfxWatch(rawDt);fpsTick(rawDt);});
  frameTask('caras',()=>updateFaceAnims(now/1000));
  {
    const cp = camera.position, outCloud = cp.z > 560 || cp.y < -45 || cp.y > 480, cloudRangeSq = (CULL.range * 1.45 + 65) ** 2;
    for (const c of CLOUDS) {
      c.position.x += rdt * (1.2 + (WX.wind || 0) * 5); if (c.position.x > 270) c.position.x = -270;
      if (outCloud) { c.visible = false; continue; }
      CULL.sp.center.copy(c.position); CULL.sp.radius = 18;
      c.visible = cp.distanceToSquared(c.position) < cloudRangeSq && CULL.fr.intersectsSphere(CULL.sp);
    }
  }
  IMPACT.cd-=rdt;if(IMPACT.t>0)IMPACT.t-=rdt;
  ZZZ_U.impact.value=IMPACT.t>0&&IMPACT.dur>0?clamp(IMPACT.t/IMPACT.dur,0,1):0;
  if(typeof ME !== 'undefined' && ME.open){
    frameTask('culling',()=>cityCull());
    frameTask('ambiente',()=>updateAmbience(rdt));
    frameTask('clima',()=>updateCityWeather(0));
    frameTask('playa',()=>updateBeach(rdt));
    frameTask('mar',()=>updateSea(rdt));
    frameTask('editor3d',()=>meUpdateCam(rdt));
    frameTask('cielo',skyFollow);
    updateFx(rdt);
    drawFrameSafely();
    return;
  }
  if(G.state==='title'){
    frameTask('culling',()=>cityCull());
    frameTask('ambiente',()=>updateAmbience(rdt));
    frameTask('musica',()=>updateMusic(rdt));frameTask('clima',()=>updateCityWeather(rdt));frameTask('playa',()=>updateBeach(rdt));frameTask('titulo',()=>titleUpdate(rdt));frameTask('cielo',skyFollow);updateFx(rdt);return;
  }
  if(G.state==='menu'){
    frameTask('culling',()=>cityCull());
    frameTask('ambiente',()=>updateAmbience(rdt));
    frameTask('musica',()=>updateMusic(rdt));frameTask('clima',()=>updateCityWeather(0));frameTask('selector',()=>updateShow(rdt));frameTask('cielo',skyFollow);updateFx(rdt);
    frameTask('lineas',()=>drawLines(rdt));return;
  }
  if(GS.on)frameTask('guia',()=>guideTick(rdt));
  if(G.cine&&!G.paused)frameTask('cinematica',()=>updateCine(rdt));
  else{
    let dt=rdt*(G.slowT>0?.3:1);if(G.slowT>0)G.slowT-=rdt;
    if((G.paused&&!G.mp)||G.over||TRAVEL.freeze)dt=0;if(G.viewer)dt*=VW.play?VW.speed:0;
    if(G.hitstop>0){G.hitstop-=rdt*(G.viewer?(VW.play?VW.speed:0):1);dt=0;}
    if(dt>0)frameTask('simulacion',()=>step(dt),()=>pressed.clear());
    if(G.viewer)frameTask('visor',()=>vTick(dt));else if(G.paused)pressed.clear();
  }
  if(CF_A.MAPAS)frameTask('mapas',()=>CF_A.MAPAS.tick(rdt));
  if(G.mp)frameTask('red',()=>guideNet(rdt));
  if(G.over&&G.winner&&G.winner.victory&&G.fighters.includes(G.winner))frameTask('victoria',()=>animate(G.winner,rdt));
  frameTask('camara:efectos',()=>updateCamFx(rdt));frameTask('camara',()=>{updateCamera(rdt);if(GS.on)guideCam(rdt);});if(TRAVEL.on&&CF_A.MAPAS)frameTask('mapas:camara',()=>CF_A.MAPAS.cam(rdt));frameTask('cielo',skyFollow);frameTask('rayos_sol',()=>updateGodRays());
  frameTask('clima',()=>updateCityWeather(G.paused&&!G.mp?0:rdt));frameTask('ambiente',()=>updateAmbience(rdt));frameTask('musica',()=>updateMusic(rawDt>.5?.05:rdt));
  frameTask('culling',()=>cityCull());frameTask('playa',()=>updateBeach(rdt));frameTask('mar',()=>updateSea(rdt));frameTask('cartel_mall',()=>updateMallBillboard(rdt));frameTask('bajoagua',()=>updateUnderwater(rdt));frameTask('voley',()=>updateVolley(rdt),()=>{if(VB.on)vbEnd('error');});
  if(G.hitstop>0&&G.chore&&G.chore.tg.model){const m=G.chore.tg.model.root;m.position.copy(G.chore.tg.pos);const pulse=Math.min(1,G.hitstop/.06);m.position.x+=Math.sin(now*.14)*.035*pulse;m.position.y+=Math.sin(now*.18)*.018*pulse;}
  else if(G.hitstop>0&&ZZZ_U.beta.value>.5&&G.hitVictim&&G.hitVictim.model&&G.hitVictim.alive){const m=G.hitVictim.model.root;m.position.copy(G.hitVictim.pos);const pulse=Math.min(1,G.hitstop/.06);m.position.x+=Math.sin(now*.16)*.042*pulse;m.position.y+=Math.sin(now*.21)*.02*pulse;}
  else if(G.hitstop<=0&&G.hitVictim){if(G.hitVictim.model)G.hitVictim.model.root.position.copy(G.hitVictim.pos);G.hitVictim=null;}
  frameTask('voces',()=>updateCharacterVoices());
  frameTask('interfaz',()=>updateHUD(rdt));frameTask('lineas',()=>drawLines(rdt));
  if(G.cine&&G.cine.shot===1)frameTask('paneles',()=>drawPanelBorders());
  }catch(error){reportFrameError('cuadro',error);}
  finally{drawFrameSafely();if(GS.on)guideBlit();}
}

LOADER.setProgress(22, 'Iniciando ciudad y motores...');
buildSeaWorld();
initMallBillboard();
LOADER.setProgress(28, 'Generando texturas anime...');
initWeatherControls();
initPauseAudioControls();
gfxInit();
syncOwnerBeta();
requestAnimationFrame(loop);
function guideSpec(sp) {
  if (sp.k === 'b') return Object.assign({}, CB_BASIC.find(x => x.id === sp.id), { ch: sp.ch });
  if (sp.k === 's') { const ch = CHARS[sp.ch], set = skGroups(ch).find(g => g[1] === sp.grp)[2]; return skEntry(ch, set[sp.i], sp.grp, sp.i); }
  return { ch: sp.ch, solo: true, len: 1e9 };
}
if (IS_GUIDE) {
  addEventListener('message', e => {
    if (e.origin !== location.origin) return; const m = e.data || {};
    if (m.t === 'off') { GUIDE_OFF = true; return; }
    if (m.t === 'on') { GUIDE_OFF = false; try { if (AC && AC.state === 'suspended') AC.resume(); } catch (x) { } return; }
    if (m.t === 'entry' && GS.on) { GUIDE_OFF = false; try { if (AC && AC.state === 'suspended') AC.resume(); } catch (x) { } guideBuild(guideSpec(m.spec)); }
  });
  (async () => {
    try {
      await new Promise(r => setTimeout(r, 2200)); MUS.on = false; G.charId = 'javi'; $('nbots').value = 1;
      await startMatch(); WX.hour = 12; WX.cycle = false; guideEnter();
      parent.postMessage({ guideReady: 1 }, location.origin);
    } catch (e) { parent.postMessage({ guideError: String(e) }, location.origin); }
  })();
}
// con la pestaña minimizada el navegador frena los cuadros: seguimos atendiendo la sala para no desaparecer para los demás
let bgLast = performance.now();
setInterval(() => {
  const nowT = performance.now();
  if (!(G.mp && G.state === 'play' && nowT - last > 250)) { bgLast = nowT; return; }
  // pestana minimizada u oculta: el navegador frena los cuadros. Antes solo seguia la red y el jugador quedaba CONGELADO (con su invulnerabilidad y su ragdoll)
  // y nadie podia pegarle. Ahora tambien se simula lo que pasa, en pasos pequenos, para que siga recibiendo golpes, pueda morir y sus tiempos corran.
  const el = Math.min(3, Math.max(0, (nowT - Math.max(last, bgLast)) / 1000)); bgLast = nowT;
  if (el > 0 && !G.over && !TRAVEL.freeze) { const n = Math.min(30, Math.max(1, Math.round(el / .1))), dt = el / n; for (let i = 0; i < n; i++) frameTask('simulacion:segundo-plano', () => step(dt)); }
  frameTask('red:segundo-plano', () => guideNet(Math.max(.05, el)));
}, 200);
for (const fn of (window.CF_HABILIDADES || [])) fn(CF_A);   // codigo de las habilidades (js/habilidades.js)
delete window.CF_HABILIDADES;
// el juego vive dentro de una función: desde la consola (o una extensión) no se puede tocar G, los peleadores ni las funciones para hacer trampa.
// solo en tu equipo (localhost) queda una puerta para probar: __ev('código')
if (/^(localhost|127\.|\[::1\])/.test(location.hostname)) window.__ev = s => eval(s);
})();