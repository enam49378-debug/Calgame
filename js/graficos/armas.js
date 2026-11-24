// Armas de vóxeles (lanza, cetro, espada) y ojos brillantes de los modelos
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearArmas = function crearArmas(D) {
  'use strict';
  const { OUTLINE_MAT, PX, _c, addOutlineOffset, fighterToonMaterial } = D;

function addEyes(model, col) {
  const e = new THREE.Mesh(new THREE.BoxGeometry(6.4 * PX, 1.3 * PX, .6 * PX), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending }));
  e.position.set(0, 3.5 * PX, 4.45 * PX); model.head.add(e); model.eyes = e;
}
function eyeGlow(m, on, T) {
  if (!m.eyes) return;
  m.eyes.material.opacity = on ? .85 + .15 * Math.sin(T * 60) : .4;
  m.eyes.scale.set(on ? 1.15 : 1, on ? 1.6 : 1, 1);
}
// Arma hecha de vóxeles (1 vóxel = 1 píxel), apunta a +z, agarre en z=0
const _wepGeoCache = new Map();
function buildVoxelWeapon(vox, scale = 1, outlineScale = 0.14) {
  const mat = fighterToonMaterial(null, 'opaque', THREE.FrontSide, { color: 0xffffff, spec: 1.0 });
  const key = scale + ':' + outlineScale;
  let pair = _wepGeoCache.get(key);
  if (!pair) {
    pair = {
      geo: new THREE.BoxGeometry(PX * scale, PX * scale, PX * scale),
      olGeo: addOutlineOffset(new THREE.BoxGeometry(PX * scale, PX * scale, PX * scale), outlineScale * PX * scale),
    };
    _wepGeoCache.set(key, pair);
  }
  const m = new THREE.InstancedMesh(pair.geo, mat, vox.length), M = new THREE.Matrix4();
  const olM = new THREE.InstancedMesh(pair.olGeo, OUTLINE_MAT, vox.length);
  vox.forEach(([y, z, c], i) => { M.makeTranslation(0, y * PX * scale, z * PX * scale); m.setMatrixAt(i, M); m.setColorAt(i, _c.set(c)); olM.setMatrixAt(i, M); });
  m.castShadow = true; m.frustumCulled = false; olM.castShadow = false; olM.receiveShadow = false; olM.frustumCulled = false; m.add(olM);
  return m;
}
// Lanza de Minecraft hecha de vóxeles
function buildSpear(scale = 1) {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -11; z <= 16; z++) P(0, z, z === -11 ? '#c9a94a' : (z >= -3 && z <= 2) ? '#3b2a1a' : (z % 2 ? '#7a5230' : '#8f6339'));
  [[1, 16], [-1, 16], [1, 17], [-1, 17], [0, 17]].forEach(([y, z]) => P(y, z, '#c9a94a'));
  [1, 2, 2, 2, 1, 1, 0, 0].forEach((w, i) => { for (let y = -w; y <= w; y++) P(y, 18 + i, w && Math.abs(y) === w ? '#2bb3a8' : y === 0 ? '#9ff7ef' : '#4ee6d6'); });
  P(0, 26, '#e0fffb');
  return buildVoxelWeapon(vox, scale);
}
// Cetro dorado con gema y cuernos, mismo agarre que la lanza
function buildScepter() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -10; z <= 15; z++) P(0, z, (z >= -2 && z <= 2) ? '#1e6b3a' : (z % 2 ? '#d4a017' : '#b8860b'));
  P(0, -11, '#3ddc84');
  [[1, 15], [-1, 15], [1, 16], [-1, 16]].forEach(([y, z]) => P(y, z, '#d4a017'));
  [[0, 17, '#4fc3f7'], [0, 18, '#b3e5fc'], [0, 19, '#4fc3f7'], [1, 17, '#0288d1'], [-1, 17, '#0288d1'], [1, 18, '#4fc3f7'], [-1, 18, '#4fc3f7']].forEach(([y, z, c]) => P(y, z, c));
  [[2, 17], [3, 18], [3, 19], [3, 20], [2, 21], [-2, 17], [-3, 18], [-3, 19], [-3, 20], [-2, 21]].forEach(([y, z]) => P(y, z, Math.abs(y) === 3 ? '#ffd54f' : '#d4a017'));
  P(0, 20, '#d4a017'); P(0, 21, '#ffd54f'); P(0, 22, '#fff3c4');
  return buildVoxelWeapon(vox, 1);
}
// Espada de ItzUkyo: empuñadura azul oscuro con trama roja, guardia y pomo dorados, hoja larga de acero
function buildSword() {
  const vox = [], P = (y, z, c) => vox.push([y, z, c]);
  for (let z = -4; z <= 2; z++) P(0, z, z % 2 ? '#ba1f2f' : '#16142b');
  [[0, -5], [1, -5], [-1, -5]].forEach(([y, z]) => P(y, z, '#bd8e20'));
  for (let y = -3; y <= 3; y++) P(y, 3, '#bd8e20');
  P(2, 4, '#bd8e20'); P(-2, 4, '#bd8e20');
  for (let z = 4; z <= 25; z++) { P(0, z, '#dfe8f2'); P(1, z, '#f7fbff'); P(-1, z, '#8f9db0'); }
  P(0, 26, '#ffffff'); P(1, 26, '#f7fbff');
  return buildVoxelWeapon(vox, 1);
}
const WEAPONS = { spear: buildSpear, scepter: buildScepter, sword: buildSword };
function setSpear(o, out) {
  if (out && D.ownsMissingSpear(o)) return;
  const s = o.spear; if (!s) return;
  (out ? o.model.gripRot : o.model.backHold).add(s);
  s.position.set(0, 0, out ? 0 : -7 * PX); o.spearOut = out;
}

  return { WEAPONS, addEyes, buildScepter, buildSpear, buildSword, buildVoxelWeapon, eyeGlow, setSpear };
};
