# -*- coding: utf-8 -*-
import os
import re

def main():
    print("Upgrading Blockstrike Map Editor to a full 3D interactive Editor...")

    with open('js/game.js', 'r', encoding='utf-8') as f:
        js = f.read()

    # 1. Update loadBBModel for buildings in CITY_PLAN so each building mesh links to its MAP_ITEM
    old_b_link = "scene.add(mesh);(window.BBM||(window.BBM=[])).push(mesh);bbRegister(mesh,geo);"
    new_b_link = """scene.add(mesh);(window.BBM||(window.BBM=[])).push(mesh);bbRegister(mesh,geo);
      const itB = MAP_ITEMS.find(q => q.plan === b || (q.kind === 'b' && Math.abs(q.x - b.x) < 0.2 && Math.abs(q.z - b.z) < 0.2));
      if (itB) { itB.mesh = mesh; mesh.userData.mapItem = itB; }"""
    if old_b_link in js:
        js = js.replace(old_b_link, new_b_link, 1)
        print("1. Linked CITY_PLAN building meshes to MAP_ITEMS.")
    else:
        print("Warning: old_b_link not found!")

    # 2. Update loadBBModel for beach props in PR so each prop mesh links to its MAP_ITEM
    old_pr_link = "scene.add(mesh);\n    if(pr.bob)BEACH.boats.push({mesh,y0:pr.y,ph:rnd()*6});"
    new_pr_link = """scene.add(mesh);
    const itP = MAP_ITEMS.find(q => q.kind === 'p' && q.model === pr.m && Math.abs(q.x - pr.x) < 0.2 && Math.abs(q.z - pr.z) < 0.2 && !q.mesh);
    if (itP) { itP.mesh = mesh; mesh.userData.mapItem = itP; }
    if(pr.bob)BEACH.boats.push({mesh,y0:pr.y,ph:rnd()*6});"""
    if old_pr_link in js:
        js = js.replace(old_pr_link, new_pr_link, 1)
        print("2. Linked Beach prop meshes to MAP_ITEMS.")
    else:
        print("Warning: old_pr_link not found!")

    # 3. Update drawFrameSafely to prioritize ME.open in 3D
    old_draw_safe = """function drawFrameSafely(){
  if(FRAME_HEALTH.contextLost||renderer.getContext().isContextLost())return;
  if(frameTask('imagen',()=>{if(G.state==='menu')renderView(SH.scene,SH.cam);else renderMain();})){FRAME_HEALTH.rendered++;return;}"""

    new_draw_safe = """function drawFrameSafely(){
  if(FRAME_HEALTH.contextLost||renderer.getContext().isContextLost())return;
  if(typeof ME !== 'undefined' && ME.open && ME.mode === '3d'){
    renderView(scene, camera);
    FRAME_HEALTH.rendered++;
    return;
  }
  if(frameTask('imagen',()=>{if(G.state==='menu')renderView(SH.scene,SH.cam);else renderMain();})){FRAME_HEALTH.rendered++;return;}"""

    if old_draw_safe in js:
        js = js.replace(old_draw_safe, new_draw_safe, 1)
        print("3. Updated drawFrameSafely for 3D editor rendering.")
    else:
        print("Warning: old_draw_safe not found!")

    # 4. Update loop(now) to handle ME.open
    old_loop_open = """  if(G.state==='title'){
    frameTask('culling',()=>cityCull());"""

    new_loop_open = """  if(typeof ME !== 'undefined' && ME.open){
    frameTask('culling',()=>cityCull());
    frameTask('ambiente',()=>updateAmbience(rdt));
    frameTask('clima',()=>updateCityWeather(0));
    frameTask('playa',()=>updateBeach(rdt));
    frameTask('mar',()=>updateSea(rdt));
    frameTask('editor3d',()=>meUpdateCam(rdt));
    updateFx(rdt);
    drawFrameSafely();
    return;
  }
  if(G.state==='title'){
    frameTask('culling',()=>cityCull());"""

    if old_loop_open in js:
        js = js.replace(old_loop_open, new_loop_open, 1)
        print("4. Updated game loop to handle ME.open 3D camera and simulation.")
    else:
        print("Warning: old_loop_open not found!")

    # 5. Replace entire ME implementation (lines 11874 to 12068) with full 3D Map Editor
    start_anchor = "// ===== Editor de mapa (modo desarrollador): mover, borrar y duplicar modelos, con deshacer/rehacer ====="
    end_anchor = "$('mapedbtn').addEventListener('click', () => { sfx('select'); meOpen(); });"

    idx_start = js.find(start_anchor)
    idx_end = js.find(end_anchor)

    if idx_start == -1 or idx_end == -1:
        print(f"Error: ME bounds not found: start={idx_start}, end={idx_end}")
        return

    full_end = idx_end + len(end_anchor)
    old_me_block = js[idx_start:full_end]

    new_me_block = '''// ===== Editor de mapa (modo desarrollador): 3D interactivo con mover, rotar, duplicar y borrar modelos =====
const PROP_DIMS = { palmera: [4, 4], sombrilla_roja: [4, 5], sombrilla_azul: [4, 5], sombrilla_amarilla: [4, 5], sombrilla_verde: [4, 5], torre_salvavidas: [4.2, 7], chiringuito: [10.4, 7.6],
  barca_roja: [1.6, 5], barca_azul: [1.6, 5], velero: [2, 6.5], muelle: [9, 40, 0, 20], faro: [9, 9], rocas_a: [6, 5], rocas_b: [6, 5], castillo: [2, 2], voley: [9.2, 17.2], caseta_roja: [3.2, 3.2], caseta_azul: [3.2, 3.2] };

const ME = {
  open: false, mode: '3d', el: null, cv: null, g: null,
  cx: 0, cz: 20, sc: 4, sel: null, undo: [], redo: [],
  snap: true, showDel: false, drag: null, pan: null,
  dirty: false, filter: '', counter: 0, srv: null, msg: '',
  // 3D Editor State
  camTarget: new THREE.Vector3(0, 2, 20),
  camYaw: 0, camPitch: -0.55, camDist: 40,
  keys: {}, drag3d: null, orbiting: false, panning: false,
  lastMouse: { x: 0, y: 0 },
  raycaster: new THREE.Raycaster(), mouse2d: new THREE.Vector2(),
  groundPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
  gizmo: null, wireBox: null, groundRing: null, dirArrow: null,
  prevCam: null, meshesInit: false
};

const meSnap = () => JSON.stringify(MAP_ITEMS.filter(i => !i.virt).map(i => [i.key, i.x, i.z, i.ry, i.del ? 1 : 0, i.added ? 1 : 0, i.kind, i.model, i.label, i.from || '', i.w, i.d, i.h, i.color || '']));

function meRestore(txt) {
  const rows = JSON.parse(txt), by = new Map(MAP_ITEMS.map(i => [i.key, i])), keep = [];
  for (const [key, x, z, ry, del, added, kind, model, label, from, w, d, h, color] of rows) {
    let it = by.get(key);
    if (!it) { if (!added) continue; it = { key, kind, model, label, ox: x, oz: z, ory: 0, w, d, h, color, added: true, from, lx: 0, lz: 0, plan: null }; }
    it.x = x; it.z = z; it.ry = ry; it.del = !!del; keep.push(it);
  }
  const fixed = MAP_ITEMS.filter(i => !i.added && !keep.includes(i));
  MAP_ITEMS.length = 0; MAP_ITEMS.push(...keep, ...fixed);
  // Sincronizar todos los modelos 3D en la escena
  for (const it of MAP_ITEMS) {
    if (it.mesh) {
      it.mesh.position.x = it.x;
      it.mesh.position.z = it.z;
      if (it.ry != null) it.mesh.rotation.y = it.ry;
      it.mesh.visible = !it.del || ME.showDel;
    }
  }
  if (ME.sel && !MAP_ITEMS.includes(ME.sel)) ME.sel = null;
  meUpdateGizmo();
  if (ME.mode === '2d') meDraw();
  meList();
  meProps();
}

function mePush() { ME.undo.push(meSnap()); if (ME.undo.length > 150) ME.undo.shift(); ME.redo = []; ME.dirty = true; }
function meUndo() { if (!ME.undo.length) return; ME.redo.push(meSnap()); meRestore(ME.undo.pop()); ME.dirty = true; meMsg('Deshecho'); }
function meRedo() { if (!ME.redo.length) return; ME.undo.push(meSnap()); meRestore(ME.redo.pop()); ME.dirty = true; meMsg('Rehecho'); }

function meInitMeshes() {
  for (const it of MAP_ITEMS) {
    if (it.mesh) continue;
    // Buscar si existe un mesh en scene en las coordenadas
    scene.traverse(o => {
      if (it.mesh) return;
      if (o.isMesh && Math.abs(o.position.x - it.x) < 0.35 && Math.abs(o.position.z - it.z) < 0.35) {
        if (!o.userData.mapItem) { it.mesh = o; o.userData.mapItem = it; }
      }
    });
    // Si no tiene mesh propio (por ejemplo bloques instanciados), crear volumen proxy
    if (!it.mesh) {
      const dm = it.kind === 'p' ? (PROP_DIMS[it.model] || [3, 3]) : [it.w || 8, it.d || 8];
      const h = it.h || (it.kind === 'p' ? 5 : 10);
      const geo = new THREE.BoxGeometry(dm[0], h, dm[1]);
      const mat = new THREE.MeshLambertMaterial({ color: it.color || 0x6688aa, transparent: true, opacity: 0.22, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(it.x, h / 2, it.z);
      m.rotation.y = it.ry || 0;
      m.userData.mapItem = it;
      m.userData.isProxy = true;
      scene.add(m);
      it.mesh = m;
    }
  }
}

function meBuildGizmo() {
  if (ME.gizmo) return;
  const grp = new THREE.Group();
  grp.name = 'MapEditor3DGizmo';

  // Jaula delimitadora de alambre dorado anime
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffd400, depthTest: false, transparent: true, opacity: 0.95 });
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1)), wireMat);
  wire.renderOrder = 9999;
  grp.add(wire);
  ME.wireBox = wire;

  // Anillo celestial en el suelo
  const rGeo = new THREE.RingGeometry(1.4, 1.6, 36);
  rGeo.rotateX(-Math.PI / 2);
  const rMat = new THREE.MeshBasicMaterial({ color: 0xffd400, side: THREE.DoubleSide, depthTest: false, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(rGeo, rMat);
  ring.position.y = 0.05;
  ring.renderOrder = 9999;
  grp.add(ring);
  ME.groundRing = ring;

  // Flecha cian de orientación frontal (ángulo de giro ry)
  const shape = new THREE.Shape();
  shape.moveTo(0, 2.4);
  shape.lineTo(0.75, 1.3);
  shape.lineTo(-0.75, 1.3);
  shape.closePath();
  const aGeo = new THREE.ShapeGeometry(shape);
  aGeo.rotateX(-Math.PI / 2);
  const aMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, depthTest: false, transparent: true, opacity: 0.95 });
  const arrow = new THREE.Mesh(aGeo, aMat);
  arrow.position.y = 0.06;
  arrow.renderOrder = 9999;
  grp.add(arrow);
  ME.dirArrow = arrow;

  scene.add(grp);
  grp.visible = false;
  ME.gizmo = grp;
}

function meUpdateGizmo() {
  if (!ME.gizmo) meBuildGizmo();
  const tag = $('me-floating-tag');
  if (!ME.open || !ME.sel || (ME.sel.del && !ME.showDel)) {
    ME.gizmo.visible = false;
    if (tag) tag.classList.add('hidden');
    return;
  }
  const s = ME.sel;
  ME.gizmo.visible = (ME.mode === '3d');
  ME.gizmo.position.set(s.x, 0, s.z);
  ME.gizmo.rotation.y = s.ry || 0;

  const dm = s.kind === 'p' ? (PROP_DIMS[s.model] || [3, 3]) : [s.w || 8, s.d || 8];
  const w = dm[0], d = dm[1], h = s.h || (s.kind === 'p' ? 5 : 10);
  ME.wireBox.scale.set(w, h, d);
  ME.wireBox.position.set(0, h / 2, 0);

  const radius = Math.max(w, d) * 0.65;
  ME.groundRing.scale.set(radius, 1, radius);
  ME.dirArrow.scale.set(radius * 0.6, 1, radius * 0.6);
  ME.dirArrow.position.z = radius * 0.35;

  // Actualizar cartel flotante 3D
  if (tag && ME.mode === '3d') {
    const screenPos = new THREE.Vector3(s.x, h + 1.2, s.z).project(camera);
    if (screenPos.z < 1) {
      const rx = (screenPos.x * 0.5 + 0.5) * innerWidth;
      const ry = (-screenPos.y * 0.5 + 0.5) * innerHeight;
      tag.style.left = rx + 'px';
      tag.style.top = ry + 'px';
      tag.classList.remove('hidden');
      $('me-tag-name').textContent = s.label || s.model.replace(/_/g, ' ').toUpperCase();
      $('me-tag-coords').textContent = `X: ${s.x.toFixed(1)}  Z: ${s.z.toFixed(1)}  ·  ${Math.round(((s.ry || 0) * 180 / Math.PI) % 360)}°`;
    } else {
      tag.classList.add('hidden');
    }
  }
}

function meUpdateCam(dt) {
  if (!ME.open || ME.mode !== '3d') return;
  const speed = (ME.keys['ShiftLeft'] || ME.keys['ShiftRight'] ? 65 : 28) * dt;
  const fwd = new THREE.Vector3();
  camera.getWorldDirection(fwd);
  const fwdH = new THREE.Vector3(fwd.x, 0, fwd.z).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();

  if (ME.keys['KeyW'] || ME.keys['ArrowUp']) camera.position.addScaledVector(fwdH, speed);
  if (ME.keys['KeyS'] || ME.keys['ArrowDown']) camera.position.addScaledVector(fwdH, -speed);
  if (ME.keys['KeyA'] || ME.keys['ArrowLeft']) camera.position.addScaledVector(right, -speed);
  if (ME.keys['KeyD'] || ME.keys['ArrowRight']) camera.position.addScaledVector(right, speed);
  if (ME.keys['KeyE'] || ME.keys['Space']) camera.position.y += speed;
  if (ME.keys['KeyQ']) camera.position.y = Math.max(0.5, camera.position.y - speed);

  meUpdateGizmo();
}

function meFocus(it) {
  const target = it ? it : (ME.sel ? ME.sel : { x: 0, z: 20 });
  const tx = target.x, tz = target.z;
  ME.camTarget.set(tx, 2, tz);
  camera.position.set(tx, 20, tz + 28);
  camera.lookAt(ME.camTarget);
  ME.camYaw = Math.atan2(camera.position.x - tx, camera.position.z - tz);
  ME.camPitch = -0.55;
  meUpdateGizmo();
  meMsg('Cámara centrada en ' + (target.label || target.model?.replace(/_/g, ' ') || 'centro'));
}

const meRect = it => {
  const dm = it.kind === 'p' ? (PROP_DIMS[it.model] || [3, 3]) : [it.w, it.d], w = dm[0], d = dm[1], ox = dm[2] || 0, oz = dm[3] || 0, c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([lx, lz]) => { lx += ox; lz += oz; return [it.x + lx * c + lz * s, it.z - lx * s + lz * c]; });
};
const meHit = (it, x, z) => {
  const dm = it.kind === 'p' ? (PROP_DIMS[it.model] || [3, 3]) : [it.w, it.d], c = Math.cos(it.ry || 0), s = Math.sin(it.ry || 0), dx = x - it.x, dz = z - it.z;
  const lx = dx * c - dz * s - (dm[2] || 0), lz = dx * s + dz * c - (dm[3] || 0);
  return Math.abs(lx) <= dm[0] / 2 && Math.abs(lz) <= dm[1] / 2;
};
const meW2S = (x, z) => [(x - ME.cx) * ME.sc + ME.cv.width / 2, (z - ME.cz) * ME.sc + ME.cv.height / 2];
const meS2W = (px, pz) => [(px - ME.cv.width / 2) / ME.sc + ME.cx, (pz - ME.cv.height / 2) / ME.sc + ME.cz];

function meDraw() {
  if (!ME.open) return;
  const g = ME.g, W = ME.cv.width, H = ME.cv.height;
  g.clearRect(0, 0, W, H);
  if (ME.mode === '3d') {
    // En modo 3D el canvas es transparente para dejar ver el mundo 3D nativo
    return;
  }
  // En modo 2D dibujamos el esquema arquitectónico
  g.fillStyle = '#2a4f33'; g.fillRect(0, 0, W, H);
  g.beginPath(); const x0 = ME.cx - W / 2 / ME.sc, x1 = ME.cx + W / 2 / ME.sc;
  g.moveTo(...meW2S(x0, SHORE(x0))); for (let x = x0; x <= x1; x += 2) g.lineTo(...meW2S(x, SHORE(x))); g.lineTo(...meW2S(x1, 400)); g.lineTo(...meW2S(x0, 400)); g.closePath(); g.fillStyle = '#25638c'; g.fill();
  g.beginPath(); g.moveTo(...meW2S(x0, SHORE(x0))); for (let x = x0; x <= x1; x += 2) g.lineTo(...meW2S(x, SHORE(x))); g.strokeStyle = '#d6c28c'; g.lineWidth = 6 * Math.min(1, ME.sc / 4); g.stroke();
  g.beginPath(); g.arc(...meW2S(0, 0), CITY.core * ME.sc, 0, TAU); g.fillStyle = '#4c545e'; g.fill();
  g.strokeStyle = '#ffffff22'; g.lineWidth = 2; g.beginPath(); g.arc(...meW2S(0, 0), CITY.bounds * ME.sc, 0, TAU); g.stroke();
  g.fillStyle = '#2c3138'; const rd = (x, z, w, d) => { const [a, b] = meW2S(x - w / 2, z - d / 2); g.fillRect(a, b, w * ME.sc, d * ME.sc); };
  rd(0, 0, 8, 2 * CITY.core); rd(0, 0, 2 * CITY.core, 8); for (const a of [-22, 22, -44, 44]) { const L = 2 * Math.floor(Math.sqrt(CITY.core * CITY.core - a * a) - 1.5); rd(a, 0, 5, L); rd(0, a, L, 5); }
  g.fillStyle = '#6e9a62'; for (const pk of CITY.parks) rd(pk.x, pk.z, pk.w, pk.d);
  g.strokeStyle = '#ffffff12'; g.lineWidth = 1; const gs = ME.sc > 6 ? 5 : 10;
  for (let x = Math.ceil(x0 / gs) * gs; x <= x1; x += gs) { const [a] = meW2S(x, 0); g.beginPath(); g.moveTo(a, 0); g.lineTo(a, H); g.stroke(); }
  const z0 = ME.cz - H / 2 / ME.sc, z1 = ME.cz + H / 2 / ME.sc; for (let z = Math.ceil(z0 / gs) * gs; z <= z1; z += gs) { const [, b] = meW2S(0, z); g.beginPath(); g.moveTo(0, b); g.lineTo(W, b); g.stroke(); }
  for (const it of MAP_ITEMS) {
    if (it.del && !ME.showDel) continue;
    const poly = meRect(it), sel = it === ME.sel;
    g.beginPath(); poly.forEach(([x, z], i) => { const [a, b] = meW2S(x, z); i ? g.lineTo(a, b) : g.moveTo(a, b); }); g.closePath();
    const base = it.kind === 'b' ? (it.color || '#b0a090') : /palm/.test(it.model) ? '#2f8f4a' : /sombrilla/.test(it.model) ? '#e0a040' : /barca|velero|muelle/.test(it.model) ? '#8a6a44' : '#c9b78a';
    g.globalAlpha = it.del ? .35 : .92; g.fillStyle = base; g.fill(); g.globalAlpha = 1;
    g.lineWidth = sel ? 3 : it.added ? 2 : 1; g.strokeStyle = sel ? '#ffe600' : it.del ? '#ff4d4d' : it.added ? '#5dff9a' : '#0008'; g.stroke();
    if (it.del) { g.strokeStyle = '#ff4d4d'; g.beginPath(); const [a, b] = meW2S(poly[0][0], poly[0][1]), [c, d] = meW2S(poly[2][0], poly[2][1]); g.moveTo(a, b); g.lineTo(c, d); g.moveTo(...meW2S(poly[1][0], poly[1][1])); g.lineTo(...meW2S(poly[3][0], poly[3][1])); g.stroke(); }
    if (ME.sc >= 3.2 || sel) { const [a, b] = meW2S(it.x, it.z); g.fillStyle = '#000c'; g.font = '11px sans-serif'; g.textAlign = 'center'; const t = it.label || it.model.replace(/_/g, ' '); g.fillText(t, a, b + 4); }
  }
  g.fillStyle = '#fff9'; g.font = '11px monospace'; g.textAlign = 'left'; g.fillText(`x ${ME.cx.toFixed(0)}  z ${ME.cz.toFixed(0)}  ·  zoom ${ME.sc.toFixed(1)}`, 10, H - 10);
}

function meList() {
  const ul = $('me-list'); if (!ul) return; ul.innerHTML = '';
  const q = ME.filter.toLowerCase();
  for (const it of MAP_ITEMS) {
    const name = (it.label || it.model.replace(/_/g, ' ')) + (it.added ? ' (copia)' : '') + (it.del ? ' (borrado)' : '');
    if (q && !name.toLowerCase().includes(q)) continue;
    const li = document.createElement('li'); li.textContent = name; li.className = (it === ME.sel ? 'on ' : '') + (it.del ? 'del ' : '') + (it.added ? 'add' : '');
    li.addEventListener('click', () => { meSelect(it); meFocus(it); });
    ul.appendChild(li);
  }
}

function meProps() {
  const s = ME.sel, box = $('me-props'); if (!box) return;
  if (!s) { box.innerHTML = '<small>Hacé clic en cualquier modelo 3D del mapa o de la lista para seleccionarlo.</small>'; return; }
  box.innerHTML = `<b>${s.label || s.model.replace(/_/g, ' ')}</b><small>${s.kind === 'b' ? 'Edificio 3D' : 'Adorno de la costa'}${s.added ? ' · copia' : ''}</small>
    <label>X <input id="me-x" type="number" step="0.5" value="${s.x.toFixed(2)}"></label>
    <label>Z <input id="me-z" type="number" step="0.5" value="${s.z.toFixed(2)}"></label>
    <label>Giro <input id="me-ry" type="number" step="15" value="${Math.round((s.ry || 0) * 180 / Math.PI)}">°</label>`;
  const set = () => {
    mePush();
    s.x = +$('me-x').value || 0;
    s.z = +$('me-z').value || 0;
    if ($('me-ry')) s.ry = (+$('me-ry').value || 0) * Math.PI / 180;
    if (s.mesh) {
      s.mesh.position.x = s.x;
      s.mesh.position.z = s.z;
      if (s.ry != null) s.mesh.rotation.y = s.ry;
    }
    meUpdateGizmo();
    if (ME.mode === '2d') meDraw();
  };
  for (const id of ['me-x', 'me-z', 'me-ry']) if ($(id)) $(id).addEventListener('change', set);
}

function meSelect(it) {
  ME.sel = it;
  meUpdateGizmo();
  if (ME.mode === '2d') meDraw();
  meList();
  meProps();
}

function meDelete() {
  const s = ME.sel; if (!s) return;
  if (s.kind === 'b' && s.label === 'TORRE AURORA') { meMsg('La Torre Aurora no se puede borrar (tiene el ascensor), pero sí moverla.'); return; }
  mePush();
  if (s.added) {
    if (s.mesh) scene.remove(s.mesh);
    MAP_ITEMS.splice(MAP_ITEMS.indexOf(s), 1);
    ME.sel = null;
  } else {
    s.del = !s.del;
    if (s.mesh) s.mesh.visible = !s.del || ME.showDel;
  }
  meUpdateGizmo();
  if (ME.mode === '2d') meDraw();
  meList();
  meProps();
  meMsg(s ? (s.del ? 'Modelo borrado' : 'Modelo restaurado') : 'Eliminado');
}

function meDup() {
  const s = ME.sel; if (!s) return; mePush();
  const n = Object.assign({}, s, {
    key: 'a' + Date.now().toString(36) + (++ME.counter),
    added: true, del: false,
    from: s.added ? s.from : s.key,
    x: s.x + 3, z: s.z + 3, ox: s.x + 3, oz: s.z + 3
  });
  if (s.kind === 'b') { n.label = ''; }
  // Clonar el modelo 3D en la escena
  if (s.mesh) {
    const clone = s.mesh.clone();
    clone.position.set(n.x, s.mesh.position.y, n.z);
    clone.rotation.y = n.ry || 0;
    clone.userData.mapItem = n;
    scene.add(clone);
    n.mesh = clone;
  }
  MAP_ITEMS.push(n);
  meSelect(n);
  meFocus(n);
  meMsg('Duplicado: ' + (n.label || n.model.replace(/_/g, ' ')));
}

function meRotate(deg = 90) {
  const s = ME.sel; if (!s) return;
  mePush();
  s.ry = ((s.ry || 0) + deg * Math.PI / 180) % TAU;
  if (s.mesh) s.mesh.rotation.y = s.ry;
  meUpdateGizmo();
  meProps();
  if (ME.mode === '2d') meDraw();
  meMsg('Girado ' + deg + '°');
}

function meMsg(t) {
  ME.msg = t; const m = $('me-msg');
  if (m) { m.textContent = t; clearTimeout(ME.mt); ME.mt = setTimeout(() => { m.textContent = ''; }, 5000); }
}

function meExportJSON() {
  const E = { v: 1, mv: {}, del: [], add: [] };
  for (const it of MAP_ITEMS) {
    if (it.added) { if (!it.del) E.add.push({ id: it.key, kind: it.kind, model: it.model, from: it.from, x: +it.x.toFixed(2), z: +it.z.toFixed(2), ry: +(it.ry || 0).toFixed(3) }); continue; }
    if (it.del) { E.del.push(it.key); continue; }
    if (Math.abs(it.x - it.ox) > 1e-6 || Math.abs(it.z - it.oz) > 1e-6 || Math.abs((it.ry || 0) - (it.ory || 0)) > 1e-6) E.mv[it.key] = { x: +it.x.toFixed(2), z: +it.z.toFixed(2), ry: +(it.ry || 0).toFixed(3) };
  }
  return JSON.stringify(E, null, 1);
}

async function meSrv() { if (ME.srv != null) return ME.srv; try { const r = await fetch('/ping', { cache: 'no-store' }); ME.srv = r.ok && (await r.text()).startsWith('calfight-dev'); } catch (e) { ME.srv = false; } return ME.srv; }

async function meSave(reload) {
  const txt = meExportJSON(); try { localStorage.setItem('bsb_mapedit', txt); } catch (e) { }
  let how = 'guardado en este navegador';
  if (await meSrv()) { try { const r = await fetch('/save?p=config/mapa.json', { method: 'POST', body: txt }); if (r.ok) how = 'guardado en config/mapa.json'; } catch (e) { } }
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = 'mapa.json'; a.click(); how = 'guardado en este navegador y descargado como mapa.json (ponelo en la carpeta config/ para publicarlo)'; }
  ME.dirty = false; meMsg('Listo: ' + how + '.'); if (reload) setTimeout(() => location.reload(), 600);
}

async function meReset() {
  if (!(await uiConfirm('¿Volver el mapa a como venía de fábrica? Se borran todos los cambios del editor.', true))) return;
  try { localStorage.removeItem('bsb_mapedit'); } catch (e) { }
  (async () => { if (await meSrv()) { try { await fetch('/save?p=config/mapa.json', { method: 'POST', body: '{"v":1,"mv":{},"del":[],"add":[]}' }); } catch (e) { } } location.reload(); })();
}

function meBuild() {
  if (ME.el) return;
  const st = document.createElement('style');
  st.textContent = `#mapedit{position:fixed;inset:0;z-index:80;background:transparent;pointer-events:none;color:#e8ecf4;font:14px/1.4 system-ui,sans-serif;display:grid;grid-template-columns:minmax(0,1fr) 280px;grid-template-rows:auto minmax(0,1fr)}
#mapedit.hidden{display:none}
#mapedit .me-top{grid-column:1/-1;display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 12px;background:rgba(18,23,38,0.95);backdrop-filter:blur(10px);border-bottom:2px solid #ffb020;box-shadow:0 4px 20px rgba(0,0,0,0.5);pointer-events:auto}
#mapedit h2{margin:0 12px 0 0;font:italic 900 20px var(--display,sans-serif);color:#ffb020;letter-spacing:.04em}
#mapedit button{background:#1c2234;color:#e8ecf4;border:1px solid #333c55;border-radius:6px;padding:6px 12px;cursor:pointer;font:inherit;transition:background .2s,border-color .2s}
#mapedit button:hover:not(:disabled){background:#2a3452;border-color:#ffb020}
#mapedit button:disabled{opacity:.4;cursor:default}
#mapedit button.pri{background:#ffb020;color:#000;border-color:#ffb020;font-weight:700}
#mapedit button.pri:hover{background:#ffc44d}
#mapedit button.on{background:#3a4a7a;border-color:#5d8fff}
#mapedit .me-sp{flex:1}
#me-msg{color:#9dffb6;font-size:13px;min-width:140px;font-weight:600}
#mapedit .me-cv{position:relative;min-height:0;overflow:hidden;pointer-events:auto;cursor:crosshair}
#mapedit canvas{width:100%;height:100%;display:block;touch-action:none}
#mapedit .me-side{display:flex;flex-direction:column;min-height:0;border-left:2px solid #263050;background:rgba(15,19,32,0.94);backdrop-filter:blur(10px);box-shadow:-4px 0 20px rgba(0,0,0,0.4);pointer-events:auto}
#me-props{padding:12px 14px;border-bottom:1px solid #263050;display:grid;gap:8px;font-size:13px}
#me-props b{font-size:15px;color:#ffd400}
#me-props label{display:flex;gap:8px;align-items:center;font-weight:600}
#me-props input{width:100px;background:#05060c;border:1px solid #333c55;color:#fff;padding:5px 8px;border-radius:4px;font-family:monospace}
#me-props small{color:#8a96b0}
#me-filter{margin:8px 12px;background:#05060c;border:1px solid #333c55;color:#fff;padding:6px 10px;border-radius:4px}
#me-list{list-style:none;margin:0;padding:0 8px 10px;overflow:auto;flex:1}
#me-list li{padding:5px 10px;cursor:pointer;border-radius:4px;font-size:13px;margin-bottom:2px}
#me-list li:hover{background:#1c2234}
#me-list li.on{background:#ffb020;color:#000;font-weight:700}
#me-list li.del{color:#ff8a8a;text-decoration:line-through}
#me-list li.add{color:#5dff9a}
.me-3d-hint{position:absolute;bottom:12px;left:14px;right:14px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;padding:8px 14px;background:rgba(10,13,22,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,176,32,0.3);border-radius:8px;font-size:12px;color:#c0c9dc;pointer-events:none}
.me-3d-hint b{color:#ffd400}
#me-floating-tag{position:absolute;transform:translate(-50%,-100%);pointer-events:none;background:rgba(15,20,35,0.92);border:2px solid #ffd400;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.6);padding:4px 10px;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:90;transition:opacity .15s}
#me-floating-tag.hidden{display:none}
.me-tag-name{font:italic 900 13px var(--display,sans-serif);color:#ffd400;letter-spacing:.05em}
.me-tag-coords{font:700 11px monospace;color:#7ad7ff}`;
  document.head.appendChild(st);

  const el = document.createElement('div'); el.id = 'mapedit'; el.className = 'hidden';
  el.innerHTML = `<div class="me-top">
    <h2>EDITOR DE MAPA 3D</h2>
    <button id="me-mode" class="pri" title="Alternar entre Vista 3D y Plano 2D">🎮 VISTA 3D</button>
    <button id="me-undo" title="Deshacer (Ctrl+Z)">↶ Deshacer</button>
    <button id="me-redo" title="Rehacer (Ctrl+Y)">↷ Rehacer</button>
    <button id="me-dup" title="Duplicar (Ctrl+D)">⧉ Duplicar</button>
    <button id="me-del" title="Borrar (Supr)">🗑 Borrar</button>
    <button id="me-rot" title="Girar 90° (R)">⟳ Girar</button>
    <button id="me-snap" class="on" title="Imán a la cuadrícula (0.5m)">▦ Cuadrícula</button>
    <button id="me-showdel" title="Ver modelos borrados">👁 Borrados</button>
    <button id="me-center" title="Centrar cámara en el modelo (F)">⌖ Centrar</button>
    <span class="me-sp"></span><span id="me-msg"></span>
    <button id="me-import">Importar</button>
    <button id="me-export">Exportar</button>
    <button id="me-reset">Restablecer</button>
    <button id="me-save">Guardar</button>
    <button id="me-apply" class="pri">Guardar y probar ▸</button>
    <button id="me-close">Cerrar</button>
  </div>
  <div class="me-cv">
    <canvas id="me-cv"></canvas>
    <div id="me-floating-tag" class="hidden">
      <span id="me-tag-name" class="me-tag-name"></span>
      <span id="me-tag-coords" class="me-tag-coords"></span>
    </div>
    <div class="me-3d-hint">
      <span><b>🖱 Clic:</b> Elegir / Arrastrar en 3D</span>
      <span><b>Clic Der. / Arrastre:</b> Rotar Cámara</span>
      <span><b>Rueda:</b> Zoom</span>
      <span><b>W/A/S/D:</b> Volar (Shift: Rápido)</span>
      <span><b>R:</b> Girar 90°</span>
      <span><b>Ctrl+D:</b> Duplicar</span>
      <span><b>Supr:</b> Borrar</span>
    </div>
  </div>
  <div class="me-side">
    <div id="me-props"></div>
    <input id="me-filter" placeholder="Buscar modelo en el mapa…">
    <ul id="me-list"></ul>
  </div>`;

  document.body.appendChild(el);
  ME.el = el;
  ME.cv = $('me-cv');
  ME.g = ME.cv.getContext('2d', { willReadFrequently: true });

  // Eventos de botones
  $('me-mode').addEventListener('click', () => {
    ME.mode = ME.mode === '3d' ? '2d' : '3d';
    $('me-mode').textContent = ME.mode === '3d' ? '🎮 VISTA 3D' : '📐 PLANO 2D';
    $('me-mode').className = ME.mode === '3d' ? 'pri' : '';
    meUpdateGizmo();
    meDraw();
    meMsg(ME.mode === '3d' ? 'Modo 3D Interactivo activado' : 'Modo Plano 2D activado');
  });

  $('me-undo').addEventListener('click', meUndo);
  $('me-redo').addEventListener('click', meRedo);
  $('me-dup').addEventListener('click', meDup);
  $('me-del').addEventListener('click', meDelete);
  $('me-rot').addEventListener('click', () => meRotate(90));
  $('me-snap').addEventListener('click', e => {
    ME.snap = !ME.snap;
    e.currentTarget.classList.toggle('on', ME.snap);
    meMsg(ME.snap ? 'Imán a cuadrícula (0.5m) activado' : 'Colocación libre activada');
  });
  $('me-showdel').addEventListener('click', e => {
    ME.showDel = !ME.showDel;
    e.currentTarget.classList.toggle('on', ME.showDel);
    for (const it of MAP_ITEMS) { if (it.del && it.mesh) it.mesh.visible = ME.showDel; }
    meUpdateGizmo();
    if (ME.mode === '2d') meDraw();
  });
  $('me-center').addEventListener('click', () => meFocus(ME.sel));
  $('me-save').addEventListener('click', () => meSave(false));
  $('me-apply').addEventListener('click', () => meSave(true));
  $('me-reset').addEventListener('click', meReset);
  $('me-close').addEventListener('click', meClose);

  $('me-export').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([meExportJSON()], { type: 'application/json' }));
    a.download = 'mapa.json'; a.click();
  });
  $('me-import').addEventListener('click', () => {
    const f = document.createElement('input'); f.type = 'file'; f.accept = '.json,application/json';
    f.onchange = () => {
      const r = new FileReader();
      r.onload = () => {
        try {
          const j = JSON.parse(r.result); if (j.v !== 1) throw 0;
          localStorage.setItem('bsb_mapedit', r.result); location.reload();
        } catch (e) { meMsg('Ese archivo no es un mapa válido.'); }
      };
      if (f.files[0]) r.readAsText(f.files[0]);
    }; f.click();
  });
  $('me-filter').addEventListener('input', e => { ME.filter = e.target.value; meList(); });

  const cv = ME.cv;
  cv.addEventListener('contextmenu', e => e.preventDefault());

  // Raycaster 3D helper para clic en la escena
  function raycastItem(clientX, clientY) {
    const rect = cv.getBoundingClientRect();
    ME.mouse2d.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ME.mouse2d.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    ME.raycaster.setFromCamera(ME.mouse2d, camera);

    const candidates = [];
    for (const it of MAP_ITEMS) {
      if (it.mesh && (!it.del || ME.showDel)) candidates.push(it.mesh);
    }
    const hits = ME.raycaster.intersectObjects(candidates, true);
    if (!hits.length) return null;

    let obj = hits[0].object;
    while (obj && !obj.userData?.mapItem && obj.parent && obj.parent !== scene) {
      obj = obj.parent;
    }
    return obj?.userData?.mapItem || null;
  }

  function raycastGround(clientX, clientY) {
    const rect = cv.getBoundingClientRect();
    ME.mouse2d.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ME.mouse2d.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    ME.raycaster.setFromCamera(ME.mouse2d, camera);
    const pt = new THREE.Vector3();
    const hit = ME.raycaster.ray.intersectPlane(ME.groundPlane, pt);
    return hit ? pt : null;
  }

  // Interacción táctil / ratón en el área de vista (3D y 2D)
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId);
    ME.lastMouse = { x: e.clientX, y: e.clientY };

    if (ME.mode === '3d') {
      if (e.button === 1 || (e.button === 2 && e.shiftKey)) {
        // Paneo de cámara
        ME.panning = true; return;
      }
      if (e.button === 2 || e.altKey) {
        // Rotación de cámara libre
        ME.orbiting = true; return;
      }
      if (e.button === 0) {
        // Clic izquierdo: Seleccionar modelo 3D o arrastrar
        const hit = raycastItem(e.clientX, e.clientY);
        if (hit) {
          meSelect(hit);
          const gPt = raycastGround(e.clientX, e.clientY);
          ME.drag3d = {
            startX: hit.x, startZ: hit.z,
            hitX: gPt ? gPt.x : hit.x,
            hitZ: gPt ? gPt.z : hit.z,
            moved: false
          };
        } else {
          // Si hace clic en el suelo libre o cielo, deseleccionar y permitir rotar la cámara
          ME.sel = null;
          meUpdateGizmo();
          meProps();
          meList();
          ME.orbiting = true;
        }
      }
    } else {
      // Modo 2D original
      const rect = cv.getBoundingClientRect();
      const px = (e.clientX - rect.left) * cv.width / rect.width;
      const pz = (e.clientY - rect.top) * cv.height / rect.height;
      const [wx, wz] = meS2W(px, pz);
      if (e.button === 1 || e.button === 2 || ME.space) {
        ME.pan = { px, pz, cx: ME.cx, cz: ME.cz }; return;
      }
      let hit = null;
      for (let i = MAP_ITEMS.length - 1; i >= 0; i--) {
        const it = MAP_ITEMS[i]; if (it.del && !ME.showDel) continue;
        if (meHit(it, wx, wz)) { hit = it; break; }
      }
      if (hit) { meSelect(hit); ME.drag = { dx: hit.x - wx, dz: hit.z - wz, moved: false }; }
      else { ME.sel = null; meDraw(); meList(); meProps(); ME.pan = { px, pz, cx: ME.cx, cz: ME.cz }; }
    }
  });

  cv.addEventListener('pointermove', e => {
    const dx = e.clientX - ME.lastMouse.x;
    const dy = e.clientY - ME.lastMouse.y;
    ME.lastMouse = { x: e.clientX, y: e.clientY };

    if (ME.mode === '3d') {
      if (ME.panning) {
        // Desplazar cámara en el plano de vista
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
        const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
        camera.position.addScaledVector(right, -dx * 0.08);
        camera.position.y += dy * 0.08;
        return;
      }
      if (ME.orbiting) {
        // Rotar cámara 3D libre
        ME.camYaw -= dx * 0.0035;
        ME.camPitch = Math.max(-1.48, Math.min(1.48, ME.camPitch - dy * 0.0035));
        const cy = Math.cos(ME.camPitch), sy = Math.sin(ME.camPitch);
        const fwd = new THREE.Vector3(Math.sin(ME.camYaw) * cy, sy, -Math.cos(ME.camYaw) * cy).normalize();
        camera.lookAt(camera.position.clone().add(fwd));
        return;
      }
      if (ME.drag3d && ME.sel) {
        // Mover modelo 3D sobre el plano del suelo en tiempo real
        const gPt = raycastGround(e.clientX, e.clientY);
        if (gPt) {
          let nx = ME.drag3d.startX + (gPt.x - ME.drag3d.hitX);
          let nz = ME.drag3d.startZ + (gPt.z - ME.drag3d.hitZ);
          if (ME.snap && !e.altKey) {
            nx = Math.round(nx * 2) / 2;
            nz = Math.round(nz * 2) / 2;
          }
          if (!ME.drag3d.moved && (Math.abs(nx - ME.sel.x) > 0.01 || Math.abs(nz - ME.sel.z) > 0.01)) {
            mePush(); ME.drag3d.moved = true;
          }
          ME.sel.x = nx; ME.sel.z = nz;
          if (ME.sel.mesh) {
            ME.sel.mesh.position.x = nx;
            ME.sel.mesh.position.z = nz;
          }
          meUpdateGizmo();
          meProps();
        }
      }
    } else {
      // Modo 2D
      const rect = cv.getBoundingClientRect();
      const px = (e.clientX - rect.left) * cv.width / rect.width;
      const pz = (e.clientY - rect.top) * cv.height / rect.height;
      if (ME.pan) { ME.cx = ME.pan.cx - (px - ME.pan.px) / ME.sc; ME.cz = ME.pan.cz - (pz - ME.pan.pz) / ME.sc; meDraw(); return; }
      if (ME.drag && ME.sel) {
        const [wx, wz] = meS2W(px, pz); let x = wx + ME.drag.dx, z = wz + ME.drag.dz;
        if (!ME.drag.moved) { mePush(); ME.drag.moved = true; }
        if (ME.snap && !e.altKey) { x = Math.round(x * 2) / 2; z = Math.round(z * 2) / 2; }
        ME.sel.x = x; ME.sel.z = z;
        if (ME.sel.mesh) { ME.sel.mesh.position.x = x; ME.sel.mesh.position.z = z; }
        meDraw(); meProps();
      }
    }
  });

  const up = () => { ME.drag = null; ME.pan = null; ME.drag3d = null; ME.orbiting = false; ME.panning = false; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);

  cv.addEventListener('wheel', e => {
    e.preventDefault();
    if (ME.mode === '3d') {
      // Zoom 3D: avanzar / retroceder en la dirección de la cámara
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const delta = -Math.sign(e.deltaY) * (e.shiftKey ? 8 : 3.5);
      camera.position.addScaledVector(fwd, delta);
      meUpdateGizmo();
    } else {
      const rect = cv.getBoundingClientRect();
      const px = (e.clientX - rect.left) * cv.width / rect.width;
      const pz = (e.clientY - rect.top) * cv.height / rect.height;
      const [wx, wz] = meS2W(px, pz);
      ME.sc = clamp(ME.sc * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 1, 30);
      const [wx2, wz2] = meS2W(px, pz);
      ME.cx += wx - wx2; ME.cz += wz - wz2;
      meDraw();
    }
  }, { passive: false });

  // Teclado
  addEventListener('keyup', e => {
    if (ME.keys[e.code]) delete ME.keys[e.code];
  });

  addEventListener('keydown', e => {
    if (!ME.open) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (!typing) {
      ME.keys[e.code] = true;
      if (e.code === 'KeyF') { e.preventDefault(); meFocus(ME.sel); }
      if (e.code === 'KeyR') { e.preventDefault(); meRotate(90); }
      if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); meDelete(); }
    }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !typing) { e.preventDefault(); e.shiftKey ? meRedo() : meUndo(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY' && !typing) { e.preventDefault(); meRedo(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD' && !typing) { e.preventDefault(); meDup(); }
    else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); meSave(false); }
    else if (!typing && e.code === 'Escape') meClose();
    if (ME.open && !typing) e.stopImmediatePropagation();
  }, true);

  addEventListener('resize', () => { if (ME.open) meFit(); });
}

function meFit() {
  const r = ME.cv.parentElement.getBoundingClientRect();
  ME.cv.width = Math.max(200, Math.round(r.width));
  ME.cv.height = Math.max(200, Math.round(r.height));
  if (ME.mode === '2d') meDraw();
}

function meOpen() {
  if (!DEV.on) return;
  meBuild();
  meInitMeshes();
  meBuildGizmo();
  ME.open = true;
  ME.el.classList.remove('hidden');
  document.body.classList.add('guide-on');
  ME.undo = []; ME.redo = []; ME.dirty = false;
  ME.sel = null;

  // Guardar estado de cámara previo
  ME.prevCam = {
    pos: camera.position.clone(),
    rot: camera.rotation.clone(),
    fov: camera.fov,
    state: G.state
  };

  // Posicionar cámara del editor 3D
  meFocus(null);
  meFit();
  meList();
  meProps();
  $('me-msg').textContent = 'Editor 3D Activo · Volá con W/A/S/D o arrastrá modelos con el ratón';
}

async function meClose() {
  if (!ME.open) return;
  if (ME.dirty && !(await uiConfirm('Hay cambios sin guardar. ¿Cerrar igual?', true))) return;
  ME.open = false;
  ME.el.classList.add('hidden');
  document.body.classList.remove('guide-on');
  if (ME.gizmo) ME.gizmo.visible = false;
  const tag = $('me-floating-tag');
  if (tag) tag.classList.add('hidden');
  // Restaurar cámara
  if (ME.prevCam) {
    camera.position.copy(ME.prevCam.pos);
    camera.rotation.copy(ME.prevCam.rot);
    camera.fov = ME.prevCam.fov;
    camera.updateProjectionMatrix();
  }
}

$('mapedbtn').addEventListener('click', () => { sfx('select'); meOpen(); });'''

    js = js[:idx_start] + new_me_block + js[full_end:]
    print("5. Replaced ME block with full 3D Map Editor!")

    with open('js/game.js', 'w', encoding='utf-8') as f:
        f.write(js)

    print("SUCCESS: js/game.js fully updated with 3D Map Editor!")

if __name__ == '__main__':
    main()
