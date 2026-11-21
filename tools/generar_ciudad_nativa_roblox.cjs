'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'roblox_ciudad');

// Escala de conversion: personaje CalFight ~1.9u vs Roblox R6 ~5.04 studs
const SCALE = 2.65;

const MAT = {
  Plastic: 256,
  Wood: 512,
  Slate: 800,
  Concrete: 816,
  Metal: 1088,
  Grass: 1280,
  Sand: 1296,
  Fabric: 1312,
  Glass: 1568,
  Brick: 848,
  WoodPlanks: 528,
  SmoothPlastic: 272,
  Neon: 288,
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function xmlEsc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function hexToRgb01(hex) {
  let c = String(hex || '#cccccc').trim();
  if (c.startsWith('#')) c = c.slice(1);
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const n = parseInt(c, 16);
  if (!Number.isFinite(n)) return [0.8, 0.8, 0.8];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function loadThree() {
  const code = fs.readFileSync(path.join(ROOT, 'lib', 'three.min.js'), 'utf8');
  const sb = {
    console, Math, Object, Array, Number, String, Boolean,
    Float32Array, Uint16Array, Uint32Array, Int32Array, Map, Set, WeakMap, Error,
    self: null, window: null,
    document: { createElement: () => ({ getContext: () => null }), createElementNS: () => ({}) },
    performance: { now: () => 0 },
  };
  sb.self = sb;
  sb.window = sb;
  vm.runInNewContext(code, sb, { filename: 'three.min.js' });
  return sb.THREE;
}

const THREE = loadThree();

// ============================================================
// 1. Extraccion completa procedural + layout desde js/game.js
// ============================================================
async function runProceduralCityExtraction() {
  const gameLines = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8').split(/\r?\n/);
  // Tomamos de la linea 196 a la 1006 (toda la ciudad publica antes de BETA_ON = true)
  const slice = gameLines.slice(195, 1006).join('\n');

  const COL = [];
  const CLOUDS = [];
  const ELEVATORS = [];
  const MAP_ITEMS = [];
  const SIGNS = [];

  class MockDummyMesh {
    constructor(geo, mat) {
      this.geometry = geo; this.material = mat;
      this.position = new THREE.Vector3(); this.rotation = new THREE.Euler();
      this.scale = new THREE.Vector3(1, 1, 1); this.userData = {}; this.children = []; this.visible = true;
    }
    add(...args) { this.children.push(...args); }
    updateMatrix() {}
  }
  class MockGroup {
    constructor() {
      this.position = new THREE.Vector3(); this.rotation = new THREE.Euler();
      this.scale = new THREE.Vector3(1, 1, 1); this.userData = {}; this.children = []; this.visible = true;
    }
    add(...args) { this.children.push(...args); }
  }

  const MockTHREE = Object.assign({}, THREE, {
    Mesh: MockDummyMesh,
    Group: MockGroup,
    Texture: class MockTexture {
      constructor() { this.image = { width: 64, height: 64 }; this.repeat = new THREE.Vector2(1, 1); }
      clone() { return new MockTexture(); }
    },
    MeshLambertMaterial: class { constructor(o) { Object.assign(this, o); } },
    MeshPhongMaterial: class { constructor(o) { Object.assign(this, o); } },
    MeshToonMaterial: class { constructor(o) { Object.assign(this, o); } },
    RingGeometry: class { constructor(iR, oR, seg) { this.type = 'RingGeometry'; this.params = { iR, oR, seg }; } },
    CircleGeometry: class { constructor(r, seg) { this.type = 'CircleGeometry'; this.params = { r, seg }; } },
    TorusGeometry: class { constructor(r, t) { this.type = 'TorusGeometry'; this.params = { r, t }; } },
    PlaneGeometry: class { constructor(w, h) { this.type = 'PlaneGeometry'; this.params = { w, h }; } },
    BoxGeometry: class { constructor(w, h, d) { this.type = 'BoxGeometry'; this.params = { w, h, d }; } },
  });

  function makeDummyCtx() {
    return {
      fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, textAlign: 'center',
      textBaseline: 'middle', font: '12px sans-serif',
      fillRect() {}, strokeRect() {}, fillText() {}, translate() {}, rotate() {},
      beginPath() {}, moveTo() {}, arc() {}, closePath() {}, fill() {},
    };
  }

  const sandbox = {
    console, Math, Object, Array, Number, String, Boolean, Promise, Set, Map, JSON, Date,
    THREE: MockTHREE,
    V3: THREE.Vector3,
    PI: Math.PI,
    TAU: Math.PI * 2,
    B: 1.1,
    ARENA: 118,
    SEA_Y: -0.04,
    COL,
    CLOUDS,
    ELEVATORS,
    MAP_ITEMS,
    COL_GRID: { cell: 10, map: new Map(), large: [], dirty: true, n: -1, qId: 0, res: [], segRes: [], _q: [] },
    colMarkDirty: () => {},
    rebuildCityNav: () => {},
    worldBig: () => false,
    num: v => Number(v) || 0,
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    pixTex(w, h, fn) { if (fn) try { fn(makeDummyCtx()); } catch (_) {} return new MockTHREE.Texture(); },
    noiseRect() {},
    cityAnimeMaterial: m => m,
    bbRegister: () => {},
    BLOCK_TEX: { grass: new MockTHREE.Texture() },
    CITY_GRAD: new MockTHREE.Texture(),
    BEACH: {
      t: 0, boats: [], gulls: [],
      sea: { uTime: { value: 0 }, uSky: { value: new THREE.Color(0x88ccff) }, uSunV: { value: new THREE.Vector3(0, 1, 0) }, uSunC: { value: new THREE.Color(0xffffff) }, uSunK: { value: 1 } },
      water: null,
    },
    ZZZ_U: {
      beta: { value: 0 }, on: { value: 0 }, night: { value: 0 }, sunset: { value: 0 }, wet: { value: 0 },
      sunDir: { value: new THREE.Vector3() }, rimCol: { value: new THREE.Color() }, rimWarm: { value: new THREE.Color() },
    },
    CF_TEXTURES: {
      textureIndex: () => 0,
      uvSize: (d, t) => [64, 64],
      mode: () => 'opaque',
      alphaOptions: () => ({}),
    },
    location: { hostname: 'localhost' },
    localStorage: { getItem: () => null },
    XMLHttpRequest: class { open() {} send() { this.status = 404; this.responseText = ''; } },
    fetch: () => Promise.reject(new Error('offline')),
    scene: { add() {} },
    window: null,
    document: { createElement: () => ({}), head: { appendChild: () => {} } },
    __SIGNS__: SIGNS,
  };
  sandbox.window = sandbox;

  // Desactivamos el branch bm de building() para que js/game.js genere TODAS las fachadas e interiores procedurales completos,
  // pero conservando b.model en CITY_PLAN para identificar cada tipo de edificio en Roblox!
  let code = slice
    .replace(
      "function sign(text,x,y,z,w,ry,color='#24546a'){",
      "function sign(text,x,y,z,w,ry,color='#24546a'){ window.__SIGNS__.push({text,x,y,z,w,ry,color});"
    )
    .replace(
      'const bm=CITY_PLAN.find(q=>q.x===x&&q.z===z&&q.model);',
      'const bm=null;'
    )
    .replace(
      'for(const b of CITY_PLAN)if(b.model){',
      'for(const b of []){'
    );

  // Almacenamos qué edificio está generando cada llamada a building() para etiquetar y optimizar piezas en edificios altos
  code = code.replace(
    'for(const b of CITY_PLAN)building(b.x,b.z,b.w,b.d,b.h,b.color,b.label,b.accent,b.acc);',
    `for(const b of CITY_PLAN){
      window.__CUR_BLDG__ = b;
      building(b.x,b.z,b.w,b.d,b.h,b.color,b.label,b.accent,b.acc);
    }
    window.__CUR_BLDG__ = null;`
  ).replace(
    "batches.get(key).items.push([x,y,z,w,h,d,tower]);",
    "batches.get(key).items.push([x,y,z,w,h,d,tower,window.__CUR_BLDG__ ? window.__CUR_BLDG__.k : null]);"
  );

  code += `
    ;window.__EXPORT__ = {
      CITY,
      CITY_PLAN,
      SPAWN_POINTS,
      COL,
      ELEVATORS,
      batches,
      PR: typeof PR !== 'undefined' ? PR : [],
      SHORE,
    };
  }
  `;

  vm.runInNewContext(code, sandbox, { filename: 'game_city_procedural.js' });
  return { exp: sandbox.__EXPORT__, SIGNS };
}

// ============================================================
// 2. Utilidades XML RBXMX (Matrices CFrame exactas en 3D)
// ============================================================
class RbxmxWriter {
  constructor() {
    this.nextId = 1;
  }
  ref() {
    return `RBX${String(this.nextId++).padStart(7, '0')}`;
  }
  // Construye matriz 3x3 desde Euler XYZ o Quaternion de Three.js
  matFromEuler(rx = 0, ry = 0, rz = 0) {
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    const e = m.elements;
    // Column-major en Three.js -> Row-major para Roblox R00..R22
    return [
      +e[0].toFixed(6), +e[4].toFixed(6), +e[8].toFixed(6),
      +e[1].toFixed(6), +e[5].toFixed(6), +e[9].toFixed(6),
      +e[2].toFixed(6), +e[6].toFixed(6), +e[10].toFixed(6),
    ];
  }
  cfXml(x, y, z, rot) {
    const r = rot || [1, 0, 0, 0, 1, 0, 0, 0, 1];
    return `<CoordinateFrame name="CFrame">
        <X>${x.toFixed(4)}</X><Y>${y.toFixed(4)}</Y><Z>${z.toFixed(4)}</Z>
        <R00>${r[0]}</R00><R01>${r[1]}</R01><R02>${r[2]}</R02>
        <R10>${r[3]}</R10><R11>${r[4]}</R11><R12>${r[5]}</R12>
        <R20>${r[6]}</R20><R21>${r[7]}</R21><R22>${r[8]}</R22>
      </CoordinateFrame>`;
  }
  color3Xml(hex) {
    const [r, g, b] = hexToRgb01(hex);
    return `<Color3 name="Color">
        <R>${r.toFixed(4)}</R><G>${g.toFixed(4)}</G><B>${b.toFixed(4)}</B>
      </Color3>`;
  }
  partXml(opts, childrenXml = '', customRef = null) {
    const {
      className = 'Part', // Part o WedgePart
      name = 'Part',
      x = 0, y = 0, z = 0,
      sx = 1, sy = 1, sz = 1,
      rx = 0, ry = 0, rz = 0,
      rotMatrix = null,
      color = '#cccccc',
      material = MAT.SmoothPlastic,
      transparency = 0,
      reflectance = 0,
      anchored = true,
      canCollide = true,
      canQuery = true,
      canTouch = true,
      castShadow = true,
      shape = 1, // 1=Block, 2=Cylinder (solo Part)
    } = opts;
    const rot = rotMatrix || ((rx || ry || rz) ? this.matFromEuler(rx, ry, rz) : null);
    const shapeXml = className === 'Part' ? `<token name="shape">${shape}</token>` : '';
    return `<Item class="${className}" referent="${customRef || this.ref()}">
      <Properties>
        <string name="Name">${xmlEsc(name)}</string>
        <bool name="Anchored">${anchored}</bool>
        <bool name="CanCollide">${canCollide}</bool>
        <bool name="CanQuery">${canQuery}</bool>
        <bool name="CanTouch">${canTouch}</bool>
        <bool name="CastShadow">${castShadow}</bool>
        ${this.color3Xml(color)}
        ${this.cfXml(x, y, z, rot)}
        <token name="Material">${material}</token>
        <float name="Transparency">${transparency}</float>
        <float name="Reflectance">${reflectance}</float>
        <Vector3 name="size"><X>${Math.max(0.05, sx).toFixed(4)}</X><Y>${Math.max(0.05, sy).toFixed(4)}</Y><Z>${Math.max(0.05, sz).toFixed(4)}</Z></Vector3>
        ${shapeXml}
        <token name="TopSurface">0</token>
        <token name="BottomSurface">0</token>
      </Properties>${childrenXml}
    </Item>`;
  }
  spawnLocationXml(opts) {
    const { name, x, y, z, yaw, color = '#91d4cd' } = opts;
    return `<Item class="SpawnLocation" referent="${this.ref()}">
      <Properties>
        <string name="Name">${xmlEsc(name)}</string>
        <bool name="Anchored">true</bool>
        <bool name="CanCollide">false</bool>
        <bool name="CanQuery">false</bool>
        <bool name="CanTouch">true</bool>
        <bool name="CastShadow">false</bool>
        <int name="Duration">0</int>
        <bool name="Enabled">true</bool>
        <bool name="Neutral">true</bool>
        <float name="Transparency">1</float>
        ${this.color3Xml(color)}
        ${this.cfXml(x, y, z, this.matFromEuler(0, yaw, 0))}
        <Vector3 name="size"><X>5.0000</X><Y>0.5000</Y><Z>5.0000</Z></Vector3>
        <token name="TopSurface">0</token>
        <token name="BottomSurface">0</token>
      </Properties>
    </Item>`;
  }
  pointLightXml(color = '#fff0b1', range = 36, brightness = 1.6) {
    const [r, g, b] = hexToRgb01(color);
    return `<Item class="PointLight" referent="${this.ref()}">
      <Properties>
        <string name="Name">Light</string>
        <Color3 name="Color"><R>${r.toFixed(4)}</R><G>${g.toFixed(4)}</G><B>${b.toFixed(4)}</B></Color3>
        <float name="Range">${range}</float>
        <float name="Brightness">${brightness}</float>
        <bool name="Shadows">false</bool>
      </Properties>
    </Item>`;
  }
  surfaceGuiSignXml(text, bgColor, faceToken = 5) {
    const [r, g, b] = hexToRgb01(bgColor);
    const [tr, tg, tb] = hexToRgb01('#fff8df');
    const [br, bg2, bb] = hexToRgb01('#eae7cf');
    return `<Item class="SurfaceGui" referent="${this.ref()}">
      <Properties>
        <string name="Name">SignGui_${faceToken}</string>
        <token name="Face">${faceToken}</token>
        <Vector2 name="CanvasSize"><X>512</X><Y>128</Y></Vector2>
        <token name="SizingMode">1</token>
        <float name="LightInfluence">0.15</float>
      </Properties>
      <Item class="Frame" referent="${this.ref()}">
        <Properties>
          <string name="Name">Frame</string>
          <UDim2 name="Size"><XS>1</XS><XO>0</XO><YS>1</YS><YO>0</YO></UDim2>
          <Color3 name="BackgroundColor3"><R>${r.toFixed(4)}</R><G>${g.toFixed(4)}</G><B>${b.toFixed(4)}</B></Color3>
          <Color3 name="BorderColor3"><R>${br.toFixed(4)}</R><G>${bg2.toFixed(4)}</G><B>${bb.toFixed(4)}</B></Color3>
          <int name="BorderSizePixel">6</int>
        </Properties>
        <Item class="TextLabel" referent="${this.ref()}">
          <Properties>
            <string name="Name">Label</string>
            <UDim2 name="Size"><XS>0.92</XS><XO>0</XO><YS>0.82</YS><YO>0</YO></UDim2>
            <UDim2 name="Position"><XS>0.04</XS><XO>0</XO><YS>0.09</YS><YO>0</YO></UDim2>
            <float name="BackgroundTransparency">1</float>
            <string name="Text">${xmlEsc(text)}</string>
            <Color3 name="TextColor3"><R>${tr.toFixed(4)}</R><G>${tg.toFixed(4)}</G><B>${tb.toFixed(4)}</B></Color3>
            <bool name="TextScaled">true</bool>
            <token name="Font">4</token>
          </Properties>
        </Item>
      </Item>
    </Item>`;
  }
  folderXml(name, children) {
    return `<Item class="Folder" referent="${this.ref()}">
      <Properties><string name="Name">${xmlEsc(name)}</string></Properties>
      ${children.join('\n')}
    </Item>`;
  }
  modelXml(name, children, primaryPartRef = null) {
    const extra = primaryPartRef ? `<Ref name="PrimaryPart">${primaryPartRef}</Ref>` : '';
    return `<Item class="Model" referent="${this.ref()}">
      <Properties><string name="Name">${xmlEsc(name)}</string>${extra}</Properties>
      ${children.join('\n')}
    </Item>`;
  }
  wrapDocument(items) {
    return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  ${items.join('\n')}
</roblox>\n`;
  }
}

// ============================================================
// 3. Constructores nativos de modelos de la Costa/Playa en Roblox
// ============================================================
function buildCoastalPropModel(rx, pr, idx) {
  const parts = [];
  const basePos = new THREE.Vector3(pr.x * SCALE, (pr.y || 0) * SCALE, pr.z * SCALE);
  const yaw = pr.ry || 0;
  const baseQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0, 'YXZ'));

  // Helper: añade un Part/WedgePart relativo al centro (x,z) y suelo y=0 de este prop
  const add = (lx, ly, lz, sx, sy, sz, color, opts = {}) => {
    const lrx = opts.rx || 0, lry = opts.ry || 0, lrz = opts.rz || 0;
    const lp = new THREE.Vector3(lx * SCALE, ly * SCALE, lz * SCALE).applyQuaternion(baseQuat).add(basePos);
    const lq = new THREE.Quaternion().setFromEuler(new THREE.Euler(lrx, lry, lrz, 'YXZ'));
    const wq = baseQuat.clone().multiply(lq);
    const wm = new THREE.Matrix4().makeRotationFromQuaternion(wq);
    const e = wm.elements;
    const rotMatrix = [
      +e[0].toFixed(6), +e[4].toFixed(6), +e[8].toFixed(6),
      +e[1].toFixed(6), +e[5].toFixed(6), +e[9].toFixed(6),
      +e[2].toFixed(6), +e[6].toFixed(6), +e[10].toFixed(6),
    ];
    parts.push(rx.partXml({
      className: opts.wedge ? 'WedgePart' : 'Part',
      name: opts.name || 'Part',
      x: lp.x, y: lp.y, z: lp.z,
      sx: sx * SCALE, sy: sy * SCALE, sz: sz * SCALE,
      rotMatrix,
      color,
      material: opts.material || MAT.SmoothPlastic,
      transparency: opts.transparency || 0,
      reflectance: opts.reflectance || 0,
      canCollide: opts.canCollide !== undefined ? opts.canCollide : true,
      castShadow: opts.castShadow !== undefined ? opts.castShadow : true,
      shape: opts.shape || 1,
    }, opts.children || ''));
  };

  const m = pr.m;

  if (m === 'muelle') {
    // Muelle exacto: tramo principal z=0..64.8 relative a z=78 (-> world z=78..142.8), ancho 7.5u, plataforma T al final
    // En CalFight muelle esta en z=78, largo total ~68u hacia +Z
    add(0, 0.14, 34, 7.5, 0.28, 68.5, '#a67b4d', { material: MAT.WoodPlanks, name: 'TableroMuelle' });
    add(0, 0.14, 63, 15.0, 0.28, 10.2, '#9a7043', { material: MAT.WoodPlanks, name: 'PlataformaFinalMuelle' });
    // Tablas transversales decorativas (franjas ligeramente mas oscuras cada 3u sin saturar)
    for (let pz = 2; pz <= 66; pz += 3.2) {
      add(0, 0.29, pz, 7.6, 0.04, 0.22, '#6f4e2d', { material: MAT.WoodPlanks, canCollide: false });
    }
    // Pilotes sumergidos hasta fondo marino
    for (let pz = 4; pz <= 58; pz += 9) {
      for (const px of [-3.35, 3.35]) {
        add(px, -0.5, pz, 0.48, 3.4, 0.48, '#5a3d24', { material: MAT.Wood });
      }
    }
    for (const px of [-7.0, -3.5, 3.5, 7.0]) {
      add(px, -0.5, 67.5, 0.52, 3.4, 0.52, '#5a3d24', { material: MAT.Wood });
      add(px, -0.5, 58.5, 0.52, 3.4, 0.52, '#5a3d24', { material: MAT.Wood });
    }
    // Barandillas laterales + farolas en el muelle
    for (const px of [-3.55, 3.55]) {
      add(px, 1.05, 29, 0.16, 0.14, 58, '#805a37', { material: MAT.Wood });
      for (let pz = 3; pz <= 57; pz += 6) {
        add(px, 0.65, pz, 0.22, 1.1, 0.22, '#5a3d24', { material: MAT.Wood });
      }
    }
    for (const [lx, lz] of [[-3.5, 14], [3.5, 30], [-3.5, 46], [6.8, 67.4], [-6.8, 67.4]]) {
      add(lx, 1.9, lz, 0.18, 3.6, 0.18, '#384652', { material: MAT.Metal });
      add(lx, 3.7, lz, 0.46, 0.42, 0.46, '#fff0b1', {
        material: MAT.Neon,
        canCollide: false,
        children: rx.pointLightXml('#fff0b1', 34, 1.3),
      });
    }
  } else if (m === 'palmera') {
    // Tronco curvo de 4 segmentos + corona de 6 frondas
    const segs = [
      [0, 0.9, 0, 0.52, 1.85, 0.08],
      [0.14, 2.55, 0, 0.45, 1.75, 0.16],
      [0.42, 4.1, 0, 0.38, 1.7, 0.22],
      [0.78, 5.55, 0, 0.32, 1.6, 0.15],
    ];
    for (const [tx, ty, tz, w, h, tilt] of segs) {
      add(tx, ty, tz, w, h, w, '#7e5c3e', { material: MAT.Wood, rz: -tilt, name: 'TroncoPalmera' });
    }
    const topX = 0.92, topY = 6.35;
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2);
      add(topX + Math.cos(a) * 0.35, topY - 0.3, Math.sin(a) * 0.35, 0.38, 0.38, 0.38, '#5a412a', { canCollide: false });
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      add(
        topX + Math.cos(a) * 1.65,
        topY + 0.05,
        Math.sin(a) * 1.65,
        0.95, 0.18, 3.2,
        k % 2 ? '#4d9b52' : '#5cae5b',
        { material: MAT.Grass, ry: -a + Math.PI / 2, rx: 0.28, canCollide: false }
      );
    }
  } else if (m.startsWith('sombrilla_')) {
    const colMap = {
      sombrilla_roja: '#e04a4a',
      sombrilla_azul: '#3b82d6',
      sombrilla_amarilla: '#f0c436',
      sombrilla_verde: '#48a860',
    };
    const col = colMap[m] || '#e04a4a';
    add(0, 1.3, 0, 0.12, 2.6, 0.12, '#dcd5c3', { material: MAT.Metal });
    add(0, 2.55, 0, 2.9, 0.22, 2.9, col, { canCollide: false });
    add(0, 2.74, 0, 1.85, 0.2, 1.85, '#fbf7ea', { canCollide: false });
    add(0, 2.9, 0, 0.8, 0.18, 0.8, col, { canCollide: false });
    // Tumbona / toalla debajo
    add(0.9, 0.06, 0.3, 1.15, 0.08, 2.25, '#fbf7ea', { material: MAT.Fabric, canCollide: false });
    add(0.9, 0.18, -0.4, 1.0, 0.14, 1.5, col, { material: MAT.Fabric, canCollide: false });
  } else if (m === 'torre_salvavidas') {
    // 4 pilares, plataforma elevada, cabina blanca/roja y techo inclinado
    for (const px of [-1.25, 1.25]) for (const pz of [-1.25, 1.25]) {
      add(px, 1.35, pz, 0.24, 2.7, 0.24, '#8f6942', { material: MAT.Wood });
    }
    add(0, 2.65, 0, 3.2, 0.24, 3.5, '#b68957', { material: MAT.WoodPlanks });
    // Cabina trasera
    add(0, 3.7, -0.5, 2.6, 1.9, 1.9, '#f3efe6', { material: MAT.WoodPlanks });
    add(0, 3.85, -0.45, 2.2, 0.85, 2.02, '#82c5da', { material: MAT.Glass, canCollide: false });
    // Techo rojo y blanco
    add(0, 4.82, -0.35, 3.2, 0.28, 2.8, '#d9453c');
    // Escalera delantera
    add(-0.55, 1.4, 1.65, 0.14, 2.9, 0.14, '#705032', { rx: -0.22, material: MAT.Wood });
    add(0.55, 1.4, 1.65, 0.14, 2.9, 0.14, '#705032', { rx: -0.22, material: MAT.Wood });
    for (let h = 0.5; h <= 2.3; h += 0.45) {
      add(0, h, 1.65 - (h - 1.4) * 0.22, 1.1, 0.1, 0.12, '#8f6942', { material: MAT.Wood });
    }
    // Salvavidas rojo
    add(1.38, 3.5, -0.4, 0.14, 0.65, 0.65, '#e6493e', { canCollide: false });
  } else if (m === 'chiringuito') {
    // Puesto de playa tropical con barra, taburetes, techo de paja y cartel
    add(0, 0.18, 0, 6.2, 0.36, 4.6, '#9c7448', { material: MAT.WoodPlanks });
    add(0, 1.65, -1.75, 5.8, 2.6, 0.8, '#7a5534', { material: MAT.WoodPlanks });
    add(0, 0.85, 1.65, 5.6, 1.1, 0.85, '#6b472b', { material: MAT.WoodPlanks });
    add(0, 1.44, 1.65, 5.9, 0.14, 1.1, '#ecdab8', { material: MAT.WoodPlanks });
    for (const px of [-2.75, 2.75]) {
      add(px, 1.85, 1.75, 0.24, 3.2, 0.24, '#5a3a22', { material: MAT.Wood });
    }
    for (let sx = -1.8; sx <= 1.81; sx += 1.2) {
      add(sx, 0.45, 2.55, 0.16, 0.6, 0.16, '#4a3222');
      add(sx, 0.78, 2.55, 0.5, 0.12, 0.5, '#3fa5b0');
    }
    // Techo inclinado de paja/madera
    add(0, 3.45, 0.1, 6.9, 0.45, 5.6, '#d9b56c', { rx: 0.12, material: MAT.Grass });
    add(0, 3.9, 0.0, 4.2, 0.35, 3.4, '#c79f55', { material: MAT.Grass });
    // Botellas / refrescos sobre la barra
    for (let k = -2; k <= 2; k++) {
      add(k * 0.9, 1.68, 1.6, 0.2, 0.35, 0.2, ['#ff6b6b', '#4ecdc4', '#ffe66d', '#54a0ff', '#ff9f43'][k + 2], { canCollide: false });
    }
    // Cartel del chiringuito
    add(0, 3.3, 2.65, 3.8, 0.85, 0.18, '#2d5c6e', {
      canCollide: false,
      children: rx.surfaceGuiSignXml('CHIRINGUITO', '#2d5c6e', 5) + rx.surfaceGuiSignXml('CHIRINGUITO', '#2d5c6e', 2),
    });
  } else if (m === 'voley') {
    // Lineas de cancha 8x16 sobre arena + postes + red + balon
    add(0, 0.05, 0, 8.2, 0.08, 0.18, '#ffffff', { canCollide: false });
    add(0, 0.05, -8.5, 8.2, 0.08, 0.18, '#ffffff', { canCollide: false });
    add(0, 0.05, 8.5, 8.2, 0.08, 0.18, '#ffffff', { canCollide: false });
    add(-4.0, 0.05, 0, 0.18, 0.08, 17.2, '#ffffff', { canCollide: false });
    add(4.0, 0.05, 0, 0.18, 0.08, 17.2, '#ffffff', { canCollide: false });
    for (const px of [-4.45, 4.45]) {
      add(px, 1.4, 0, 0.2, 2.8, 0.2, '#3d4f5e', { material: MAT.Metal });
    }
    add(0, 2.45, 0, 8.9, 0.12, 0.08, '#ffffff');
    add(0, 1.85, 0, 8.9, 1.1, 0.06, '#e6eef2', { transparency: 0.45, material: MAT.Fabric });
    add(0.4, 0.25, 2.1, 0.42, 0.42, 0.42, '#fff9e6', { canCollide: false });
  } else if (m === 'faro') {
    // Base rocosa, torre blanca/roja escalonada, balcon, linterna luminosa
    add(0, 0.8, 0, 6.2, 1.6, 6.2, '#737c82', { material: MAT.Slate });
    const tiers = [
      [1.6, 4.4, 3.0, '#f4efe4'],
      [4.6, 3.9, 3.0, '#d84238'],
      [7.6, 3.4, 3.0, '#f4efe4'],
      [10.4, 3.0, 2.6, '#d84238'],
    ];
    for (const [cy, dia, h, col] of tiers) {
      add(0, cy + 0.8, 0, h, dia, dia, col, { shape: 2, rz: Math.PI / 2, material: MAT.Concrete });
    }
    add(0, 12.6, 0, 0.35, 3.8, 3.8, '#26323d', { shape: 2, rz: Math.PI / 2, material: MAT.Metal });
    add(0, 13.7, 0, 1.8, 2.3, 2.3, '#88d8f0', { shape: 2, rz: Math.PI / 2, material: MAT.Glass, transparency: 0.35 });
    add(0, 13.7, 0, 1.4, 1.4, 1.4, '#fff29c', {
      material: MAT.Neon,
      canCollide: false,
      children: rx.pointLightXml('#fff29c', 60, 2.2),
    });
    add(0, 14.62, 0, 0.7, 2.9, 2.9, '#c9382c', { shape: 2, rz: Math.PI / 2, material: MAT.Metal });
  } else if (m === 'castillo') {
    add(0, 0.35, 0, 1.8, 0.7, 1.8, '#e3c888', { material: MAT.Sand });
    for (const sx of [-0.75, 0.75]) for (const sz of [-0.75, 0.75]) {
      add(sx, 0.55, sz, 0.5, 1.1, 0.5, '#ecd59a', { material: MAT.Sand });
    }
    add(0, 0.9, 0, 0.85, 0.65, 0.85, '#ecd59a', { material: MAT.Sand });
    add(0, 1.45, 0, 0.08, 0.55, 0.08, '#5a3d24', { canCollide: false });
    add(0.18, 1.62, 0, 0.34, 0.22, 0.06, '#e04a4a', { canCollide: false });
  } else if (m === 'caseta_azul' || m === 'caseta_roja') {
    const c = m === 'caseta_azul' ? '#3d82cc' : '#dc4c42';
    add(0, 1.25, 0, 2.2, 2.5, 2.2, '#f5f1e4', { material: MAT.WoodPlanks });
    for (const sx of [-0.65, 0.65]) add(sx, 1.25, 0.02, 0.55, 2.52, 2.24, c, { material: MAT.WoodPlanks });
    add(0, 2.68, 0, 2.6, 0.35, 2.5, c);
    add(0, 1.05, 1.12, 1.05, 2.05, 0.08, '#303b45', { canCollide: false });
  } else if (m === 'barca_roja' || m === 'barca_azul') {
    const c = m === 'barca_roja' ? '#cf433a' : '#2d76b8';
    add(0, 0.32, 0, 1.7, 0.55, 3.4, c, { material: MAT.WoodPlanks });
    add(0, 0.36, 2.15, 1.7, 0.55, 0.95, c, { wedge: true, ry: Math.PI, material: MAT.WoodPlanks });
    add(0, 0.62, 0, 1.4, 0.1, 2.6, '#b88c58', { material: MAT.WoodPlanks });
    add(0, 0.72, -0.5, 1.5, 0.14, 0.45, '#d4b07d', { material: MAT.WoodPlanks });
    add(0, 0.72, 0.6, 1.5, 0.14, 0.45, '#d4b07d', { material: MAT.WoodPlanks });
  } else if (m === 'velero') {
    add(0, 0.42, 0, 2.1, 0.85, 4.6, '#f2efe6', { material: MAT.WoodPlanks });
    add(0, 0.45, 2.9, 2.1, 0.85, 1.3, '#f2efe6', { wedge: true, ry: Math.PI, material: MAT.WoodPlanks });
    add(0, 0.92, 0, 1.7, 0.15, 3.8, '#b88c58', { material: MAT.WoodPlanks });
    add(0, 3.6, 0.2, 0.18, 5.6, 0.18, '#5a3d24', { material: MAT.Wood });
    // Vela triangular blanca, foque rojo y baupres conectado al mastil
    add(0, 3.7, -1.0, 0.12, 4.5, 2.3, '#fffdf7', { wedge: true, material: MAT.Fabric, canCollide: false });
    add(0, 3.05, 0.72, 0.1, 3.4, 1.5, '#d8453c', { wedge: true, ry: Math.PI, material: MAT.Fabric, canCollide: false });
    add(0, 0.9, 1.35, 0.12, 0.12, 2.2, '#5a3d24', { rx: -0.18, material: MAT.Wood, name: 'Baupres' });
  } else if (m === 'rocas_a' || m === 'rocas_b') {
    const rocks = m === 'rocas_a'
      ? [[0, 0.6, 0, 2.6, 1.4, 2.3, 0.3], [-1.3, 0.4, 0.8, 1.6, 0.95, 1.5, 1.1], [1.2, 0.5, -0.6, 1.8, 1.1, 1.6, -0.5]]
      : [[0, 0.7, 0, 2.9, 1.5, 2.5, -0.4], [1.4, 0.45, 0.9, 1.7, 1.0, 1.5, 0.7], [-1.1, 0.35, -0.8, 1.4, 0.85, 1.3, 0.2]];
    rocks.forEach(([rx2, ry2, rz2, sw, sh, sd, ang], k) => {
      add(rx2, ry2, rz2, sw, sh, sd, k % 2 ? '#78828a' : '#656e75', { ry: ang, material: MAT.Slate });
    });
  }

  return rx.modelXml(`Prop_${idx}_${m}`, parts);
}

// ============================================================
// 4. Ensamblado del archivo unico CalFight_Ciudad_Roblox.rbxmx
// ============================================================
function buildNativeRbxmx({ exp, SIGNS }) {
  const rx = new RbxmxWriter();

  const sueloParts = [];
  const plazaParts = [];
  const callesParts = [];
  const edificiosMap = new Map(); // b.k -> { meta, parts: [] }
  const parquesParts = [];
  const skylineParts = [];
  const letrerosParts = [];
  const playaParts = [];
  const ascensoresParts = [];
  const treeModels = [];
  const coastalModels = [];

  for (const b of exp.CITY_PLAN) {
    edificiosMap.set(b.k, { plan: b, parts: [] });
  }

  // 4A. Suelo base verde (recortado en z=67.4 para la playa)
  {
    const x0 = -210, x1 = 210, z0 = -210, z1 = 67.4;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const w = x1 - x0, d = z1 - z0;
    const thick = 2.0;
    sueloParts.push(rx.partXml({
      name: 'MainPart',
      x: cx * SCALE,
      y: -thick / 2 - 0.02,
      z: cz * SCALE,
      sx: w * SCALE,
      sy: thick,
      sz: d * SCALE,
      color: '#6ca85e',
      material: MAT.Grass,
      canCollide: true,
    }));
  }

  // 4B. Plaza circular central
  {
    const radius = (exp.CITY.core + 0.5) * SCALE;
    const thick = 0.28;
    plazaParts.push(rx.partXml({
      name: 'PlazaCircular',
      x: 0,
      y: -thick / 2 + 0.02,
      z: 0,
      sx: thick,
      sy: radius * 2,
      sz: radius * 2,
      rotMatrix: [0, -1, 0, 1, 0, 0, 0, 0, 1],
      color: '#8c999f',
      material: MAT.Concrete,
      shape: 2,
    }));
    plazaParts.push(rx.partXml({
      name: 'PlazaEmblemaRombo',
      x: 0,
      y: 0.052 * SCALE + 0.09,
      z: 0,
      sx: 3.3 * SCALE,
      sy: 0.08,
      sz: 3.3 * SCALE,
      ry: Math.PI / 4,
      color: '#598c9a',
      material: MAT.SmoothPlastic,
      canCollide: false,
    }));
  }

  // 4C. Separar arboles, horizonte lejano (optimizado) y bloques procedurales de edificios/calles/interiores/parques
  const allBatches = [...exp.batches.values()].filter(b => !b.beta);
  const treeLogs = [];
  const treeCanopies = [];
  const skySeen = new Set();
  const lampCenters = new Set(exp.CITY.lamps.map(l => `${l.x.toFixed(2)},${l.z.toFixed(2)}`));
  const glassColors = new Set(['#77b3c6', '#7fb5c5', '#9fd6e6', '#aac5d1', '#82c5da']);

  let seq = 0;
  for (const b of allBatches) {
    for (const item of b.items) {
      const [x, y, z, w, h, d, tower, bldgKey] = item;

      // Arboles
      if (b.tex === 'log' && Math.abs(h - 2.3) < 0.05 && Math.abs(w - 0.5) < 0.05) {
        treeLogs.push({ x, y, z, w, h, d, color: b.color });
        continue;
      }
      if (b.tex === 'leaves' && ((Math.abs(w - 2.7) < 0.05 && Math.abs(y - 3) < 0.05) || (Math.abs(w - 2) < 0.05 && Math.abs(y - 4) < 0.05))) {
        treeCanopies.push({ x, y, z, w, h, d, color: b.color });
        continue;
      }

      // Horizonte lejano (tower): simplificado de ~80 piezas por torre a 4 piezas limpias (cuerpo + azotea + 2 bandas de cristal)
      if (tower) {
        if (!skySeen.has(tower)) {
          skySeen.add(tower);
          const th = tower.h;
          skylineParts.push(rx.partXml({
            name: `SkylineTower_${skySeen.size}`,
            x: tower.x * SCALE,
            y: (th * 0.5) * SCALE,
            z: tower.z * SCALE,
            sx: tower.w * SCALE,
            sy: th * SCALE,
            sz: tower.d * SCALE,
            color: b.color === '#aac5d1' ? '#95abb8' : b.color,
            material: MAT.Concrete,
            canCollide: false,
            castShadow: false,
          }));
          skylineParts.push(rx.partXml({
            name: `SkylineRoof_${skySeen.size}`,
            x: tower.x * SCALE,
            y: (th + 0.14) * SCALE,
            z: tower.z * SCALE,
            sx: (tower.w + 0.4) * SCALE,
            sy: 0.3 * SCALE,
            sz: (tower.d + 0.4) * SCALE,
            color: '#b5c4ca',
            material: MAT.SmoothPlastic,
            canCollide: false,
            castShadow: false,
          }));
          skylineParts.push(rx.partXml({
            name: `SkylineGlass_${skySeen.size}`,
            x: tower.x * SCALE,
            y: (th * 0.52) * SCALE,
            z: tower.z * SCALE,
            sx: (tower.w + 0.12) * SCALE,
            sy: (th * 0.72) * SCALE,
            sz: (tower.d - 1.5) * SCALE,
            color: '#aac5d1',
            material: MAT.Glass,
            reflectance: 0.15,
            canCollide: false,
            castShadow: false,
          }));
        }
        continue;
      }

      seq++;
      const isFlatFloor = h <= 0.05 && y <= 0.15;
      let sy = h * SCALE;
      let wy = y * SCALE;
      if (isFlatFloor) {
        const topY = 0.04 + y * 5.0;
        sy = 0.22;
        wy = topY - sy * 0.5;
      }

      const colStr = typeof b.color === 'number'
        ? '#' + b.color.toString(16).padStart(6, '0')
        : String(b.color || '#d0d0d0');
      const lc = colStr.toLowerCase();
      let mat = MAT.SmoothPlastic;
      let transparency = 0;
      let reflectance = 0;
      let extraChild = '';

      if (b.tex === 'lamp') {
        mat = MAT.Neon;
      } else if (b.tex === 'leaves') {
        mat = MAT.Grass;
      } else if (b.tex === 'log') {
        mat = MAT.Wood;
      } else if (b.tex === 'plank') {
        mat = MAT.WoodPlanks;
      } else if (glassColors.has(lc)) {
        mat = MAT.Glass;
        transparency = lc === '#9fd6e6' ? 0.25 : 0.12;
        reflectance = 0.22;
      } else if (isFlatFloor) {
        mat = MAT.Concrete;
      } else if (bldgKey && edificiosMap.get(bldgKey)?.plan?.model?.includes('ladrillo') && Math.abs(h) > 1.5) {
        mat = MAT.Brick;
      }

      const isStreetLampBulb = Math.abs(w - 0.38) < 0.02 && Math.abs(h - 0.34) < 0.02 && lampCenters.has(`${x.toFixed(2)},${z.toFixed(2)}`);
      if (isStreetLampBulb) {
        mat = MAT.Neon;
        extraChild = rx.pointLightXml('#fff0b1', 34, 1.35);
      }

      // En edificios altos (>16u) evitamos miles de micro-molduras redundantes si es solo decoracion de ventana del bucle superior?
      // Mantenerlos intactos garantiza fidelidad; comprobaremos el total de piezas al final!
      const canCollide = !isFlatFloor && b.tex !== 'lamp' && !isStreetLampBulb && !(h < 0.3 && w < 0.3 && d < 0.3);

      const pXml = rx.partXml({
        name: isStreetLampBulb ? `FarolaLuz_${seq}` : `Pieza_${seq}`,
        x: x * SCALE,
        y: wy,
        z: z * SCALE,
        sx: w * SCALE,
        sy,
        sz: d * SCALE,
        color: colStr,
        material: mat,
        transparency,
        reflectance,
        canCollide,
        castShadow: !isFlatFloor,
      }, extraChild);

      if (bldgKey && edificiosMap.has(bldgKey)) {
        edificiosMap.get(bldgKey).parts.push(pXml);
      } else if (isFlatFloor) {
        callesParts.push(pXml);
      } else {
        parquesParts.push(pXml);
      }
    }
  }

  // Emparejar arboles -> Model con TreeRoot (compatible con bat.rbxl DestroyAmbient)
  const usedCanopy = new Set();
  treeLogs.forEach((log, idx) => {
    const trunkRef = rx.ref();
    const trunkXml = rx.partXml({
      name: 'TreeRoot',
      x: log.x * SCALE,
      y: log.y * SCALE,
      z: log.z * SCALE,
      sx: log.w * SCALE,
      sy: log.h * SCALE,
      sz: log.d * SCALE,
      color: log.color,
      material: MAT.Wood,
      canCollide: true,
    }, '', trunkRef);
    const children = [trunkXml];
    for (let i = 0; i < treeCanopies.length; i++) {
      if (usedCanopy.has(i)) continue;
      const c = treeCanopies[i];
      if (Math.abs(c.x - log.x) < 0.5 && Math.abs(c.z - log.z) < 0.5) {
        usedCanopy.add(i);
        children.push(rx.partXml({
          name: 'Leaves',
          x: c.x * SCALE,
          y: c.y * SCALE,
          z: c.z * SCALE,
          sx: c.w * SCALE,
          sy: c.h * SCALE,
          sz: c.d * SCALE,
          color: c.color,
          material: MAT.Grass,
          canCollide: false,
        }));
      }
    }
    treeModels.push(rx.modelXml(`Tree_${idx + 1}`, children, trunkRef));
  });

  // 4D. Alfombra del Casino Aurora + Letreros del Casino + Torres/Locales
  const casEntry = [...edificiosMap.values()].find(v => v.plan.label === 'CASINO AURORA');
  if (casEntry) {
    const cas = casEntry.plan;
    const wall = 0.32, iw = cas.w - 2 * wall, id = cas.d - 2 * wall;
    casEntry.parts.push(rx.partXml({
      name: 'CasinoAlfombraBorde',
      x: cas.x * SCALE, y: 0.07 * SCALE, z: cas.z * SCALE,
      sx: iw * SCALE, sy: 0.14, sz: id * SCALE,
      color: '#c9a85b', material: MAT.Fabric, canCollide: false,
    }));
    casEntry.parts.push(rx.partXml({
      name: 'CasinoAlfombraBurdeo',
      x: cas.x * SCALE, y: 0.075 * SCALE + 0.03, z: cas.z * SCALE,
      sx: (iw - 2) * SCALE, sy: 0.14, sz: (id - 2) * SCALE,
      color: '#642f4e', material: MAT.Fabric, canCollide: false,
    }));
    casEntry.parts.push(rx.partXml({
      name: 'CasinoAlfombraPasillo',
      x: cas.x * SCALE, y: 0.08 * SCALE + 0.06, z: cas.z * SCALE,
      sx: 3.6 * SCALE, sy: 0.14, sz: (id - 2) * SCALE,
      color: '#92516b', material: MAT.Fabric, canCollide: false,
    }));
  }

  // Detalle extra nativo en Torre Aurora (franjas cian luminosas verticales para que destaque en el skyline!)
  const torreEntry = [...edificiosMap.values()].find(v => v.plan.label === 'TORRE AURORA');
  if (torreEntry) {
    const T = torreEntry.plan;
    const f = T.z < 0 ? 1 : -1;
    for (const sx of [-T.w * 0.42, T.w * 0.42]) {
      torreEntry.parts.push(rx.partXml({
        name: 'TorreAuroraNeonStrip',
        x: (T.x + sx) * SCALE,
        y: (T.h * 0.55) * SCALE,
        z: (T.z + f * (T.d / 2 + 0.18)) * SCALE,
        sx: 0.35 * SCALE,
        sy: (T.h * 0.8) * SCALE,
        sz: 0.25 * SCALE,
        color: '#7ad7ff',
        material: MAT.Neon,
        canCollide: false,
      }));
    }
    // Antena / aguja en la azotea
    torreEntry.parts.push(rx.partXml({
      name: 'TorreAuroraAntena',
      x: T.x * SCALE,
      y: (T.h + 4.5) * SCALE,
      z: T.z * SCALE,
      sx: 0.45 * SCALE,
      sy: 9 * SCALE,
      sz: 0.45 * SCALE,
      color: '#d8e2e8',
      material: MAT.Metal,
      canCollide: false,
    }));
    torreEntry.parts.push(rx.partXml({
      name: 'TorreAuroraBaliza',
      x: T.x * SCALE,
      y: (T.h + 9.2) * SCALE,
      z: T.z * SCALE,
      sx: 0.7 * SCALE,
      sy: 0.7 * SCALE,
      sz: 0.7 * SCALE,
      color: '#7ad7ff',
      material: MAT.Neon,
      canCollide: false,
      children: rx.pointLightXml('#7ad7ff', 45, 1.5),
    }));
  }

  const edificioModels = [];
  let eSeq = 0;
  for (const { plan, parts } of edificiosMap.values()) {
    eSeq++;
    const label = (plan.label || plan.model || `Edificio_${eSeq}`).replace(/[^a-zA-Z0-9_ ]/g, '');
    edificioModels.push(rx.modelXml(`Edificio_${eSeq}_${label}`, parts));
  }

  // 4E. Reloj de la estacion y Carteles (`sign(...)`)
  letrerosParts.push(rx.partXml({
    name: 'RelojEstacion',
    x: -13 * SCALE, y: 7.5 * SCALE, z: -27.82 * SCALE,
    sx: 1.7 * SCALE, sy: 1.7 * SCALE, sz: 0.18,
    color: '#eee9d8', material: MAT.SmoothPlastic, canCollide: false,
  }, rx.surfaceGuiSignXml('12:00 · AURORA', '#344e60', 2) + rx.surfaceGuiSignXml('12:00 · AURORA', '#344e60', 5)));

  SIGNS.forEach((s, i) => {
    const sw = s.w * SCALE, sh = (s.w / 4) * SCALE;
    const children = rx.surfaceGuiSignXml(s.text, s.color, 5) + rx.surfaceGuiSignXml(s.text, s.color, 2);
    letrerosParts.push(rx.partXml({
      name: `Letrero_${i + 1}_${s.text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24)}`,
      x: s.x * SCALE, y: s.y * SCALE, z: s.z * SCALE,
      sx: sw, sy: sh, sz: 0.24,
      ry: s.ry,
      color: s.color, material: MAT.SmoothPlastic, canCollide: false, castShadow: false,
    }, children));
  });

  // 4F. Playa (arena seca + arena mojada curva) y Mar
  {
    const step = 4;
    for (let x0 = -136; x0 < 136; x0 += step) {
      const xm = x0 + step * 0.5;
      const zShore = exp.SHORE(xm);
      const dryN = 67.4;
      const dryLen = Math.max(2, zShore - dryN);
      playaParts.push(rx.partXml({
        name: `Arena_${x0}`,
        x: xm * SCALE, y: -0.25, z: ((dryN + zShore) * 0.5) * SCALE,
        sx: (step + 0.35) * SCALE, sy: 0.5, sz: dryLen * SCALE,
        color: '#e8d29a', material: MAT.Sand, canCollide: true, castShadow: false,
      }));
      const wetN = zShore - 3.0;
      playaParts.push(rx.partXml({
        name: `ArenaMojada_${x0}`,
        x: xm * SCALE, y: -0.275, z: ((wetN + zShore) * 0.5) * SCALE,
        sx: (step + 0.35) * SCALE, sy: 0.5, sz: 3.1 * SCALE,
        color: '#bfa271', material: MAT.Sand, canCollide: true, castShadow: false,
      }));
    }
    playaParts.push(rx.partXml({
      name: 'MarSuperficie',
      x: 0, y: -0.04 * SCALE - 0.15, z: (67 + 350) * SCALE,
      sx: 1200 * SCALE, sy: 0.3, sz: 700 * SCALE,
      color: '#2590c2', material: MAT.Glass, transparency: 0.35, canCollide: false, castShadow: false,
    }));
    playaParts.push(rx.partXml({
      name: 'FondoMarino',
      x: 0, y: -1.45 * SCALE - 0.5, z: (67 + 350) * SCALE,
      sx: 1200 * SCALE, sy: 1.0, sz: 700 * SCALE,
      color: '#5a7f8a', material: MAT.Sand, canCollide: true, castShadow: false,
    }));
  }

  // 4G. Todos los adornos nativos de la costa (`exp.PR`)
  exp.PR.forEach((pr, i) => {
    coastalModels.push(buildCoastalPropModel(rx, pr, i + 1));
  });

  // 4H. Ascensor de Torre Aurora
  if (exp.ELEVATORS.length > 0) {
    const el = exp.ELEVATORS[0];
    const ex = Number.isFinite(el.x) ? el.x * SCALE : 0;
    const ez = Number.isFinite(el.z) ? el.z * SCALE : -151.5;
    const dx = Number.isFinite(el.downX) ? el.downX * SCALE : 0;
    const dz = Number.isFinite(el.downZ) ? el.downZ * SCALE : -149.7;
    const roofY = Number.isFinite(el.roofY) ? el.roofY * SCALE : 122.385;
    ascensoresParts.push(rx.partXml({
      name: 'TorreAurora_Subir',
      x: ex, y: 0.52, z: -151.5,
      sx: 2.2 * SCALE, sy: 0.5, sz: 2.2 * SCALE,
      color: '#7ad7ff', material: MAT.Neon, transparency: 0.25, canCollide: false, castShadow: false,
    }));
    ascensoresParts.push(rx.partXml({
      name: 'TorreAurora_Bajar',
      x: dx, y: roofY + 0.25, z: -149.7,
      sx: 2.2 * SCALE, sy: 0.5, sz: 2.2 * SCALE,
      color: '#7ad7ff', material: MAT.Neon, transparency: 0.25, canCollide: false, castShadow: false,
    }));
  }

  // 4I. 44 SpawnLocations
  const spawnItems = exp.SPAWN_POINTS.map(sp => rx.spawnLocationXml({
    name: `Spawn${sp.id}`,
    x: sp.x * SCALE,
    y: 0.35,
    z: sp.z * SCALE,
    yaw: sp.yaw,
  }));

  const mapFolder = rx.folderXml('Map', [
    rx.folderXml('Suelo', sueloParts),
    rx.folderXml('Plaza', plazaParts),
    rx.folderXml('Avenidas_y_Calles', callesParts),
    rx.folderXml('Edificios', edificioModels),
    rx.folderXml('Parques_y_Mobiliario', parquesParts),
    rx.folderXml('Horizonte', skylineParts),
    rx.folderXml('Letreros', letrerosParts),
    rx.folderXml('Trees', treeModels),
    rx.folderXml('Playa_y_Mar', playaParts),
    rx.folderXml('Costa_Props', coastalModels),
    rx.folderXml('Ascensores', ascensoresParts),
  ]);

  const spawnsFolder = rx.folderXml('Spawns', spawnItems);
  const rootFolder = rx.folderXml('CalFight_Ciudad_Import', [mapFolder, spawnsFolder]);

  return {
    xml: rx.wrapDocument([rootFolder]),
    counts: {
      suelo: sueloParts.length,
      plaza: plazaParts.length,
      calles: callesParts.length,
      edificios: edificioModels.length,
      parques: parquesParts.length,
      horizonte: skylineParts.length,
      letreros: letrerosParts.length,
      trees: treeModels.length,
      playa: playaParts.length,
      costaProps: coastalModels.length,
      ascensores: ascensoresParts.length,
      spawns: spawnItems.length,
    },
  };
}

// ============================================================
// 5. Instalador 1-clic en Luau (sin .obj ni Asset Manager!)
// ============================================================
function buildAscensorLuau() {
  return `-- ==============================================================================
-- AscensorTorreAurora — Script de Servidor (ServerScriptService)
-- Activa las plataformas cian de Torre Aurora para subir a la azotea y bajar.
-- ==============================================================================

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local mapFolder = Workspace:FindFirstChild("Map")
local folder = mapFolder and mapFolder:FindFirstChild("Ascensores")
if not folder then
\twarn("[AscensorTorreAurora] No se encontro Workspace.Map.Ascensores")
\treturn
end

local padSubir = folder:FindFirstChild("TorreAurora_Subir")
local padBajar = folder:FindFirstChild("TorreAurora_Bajar")
if not (padSubir and padBajar) then
\twarn("[AscensorTorreAurora] Faltan TorreAurora_Subir o TorreAurora_Bajar")
\treturn
end

local cooldown = {}

local function connectPad(srcPad, dstPad)
\tsrcPad.Touched:Connect(function(hit)
\t\tlocal char = hit.Parent
\t\tif not char then return end
\t\tlocal hum = char:FindFirstChildOfClass("Humanoid")
\t\tlocal root = char:FindFirstChild("HumanoidRootPart")
\t\tif not (hum and root and hum.Health > 0) then return end

\t\tlocal plr = Players:GetPlayerFromCharacter(char)
\t\tlocal key = plr or char
\t\tlocal now = os.clock()
\t\tif cooldown[key] and now - cooldown[key] < 2.2 then return end
\t\tcooldown[key] = now

\t\troot.CFrame = dstPad.CFrame + Vector3.new(0, 4.5, 0)
\tend)
end

connectPad(padSubir, padBajar)
connectPad(padBajar, padSubir)
print("[CalFight] Ascensor de Torre Aurora activo.")
`;
}

function buildInstallerLuau() {
  const ascSrc = buildAscensorLuau().replace(/\]\]/g, '] ]');
  return `-- ==============================================================================
-- Instalar_Ciudad_Roblox.luau — Script de Command Bar (1 solo paso, SIN .obj)
-- Borra el mapa viejo de Battlegrounds en Workspace.Map, mueve toda Ciudad Aurora
-- (100% piezas nativas de Roblox) a Workspace.Map, reemplaza los Spawns en
-- Workspace.Miscellaneous.Spawns e instala el ascensor de Torre Aurora.
-- ==============================================================================

local ServerScriptService = game:GetService("ServerScriptService")
local Workspace = game:GetService("Workspace")
local ChangeHistoryService = game:GetService("ChangeHistoryService")

local importRoot = Workspace:FindFirstChild("CalFight_Ciudad_Import")
assert(importRoot, "No se encontro Workspace.CalFight_Ciudad_Import. Haz clic derecho en Workspace -> Insert from File... -> CalFight_Ciudad_Roblox.rbxmx primero.")

ChangeHistoryService:SetWaypoint("CalFight_Antes_CambiarMapa")

local mapFolder = Workspace:FindFirstChild("Map")
if not mapFolder then
\tmapFolder = Instance.new("Folder")
\tmapFolder.Name = "Map"
\tmapFolder.Parent = Workspace
end

-- 1. Borrar el mapa anterior del Battlegrounds conservando Throwables y Emote Anims
local keepInMap = { Throwables = true, ["Emote Anims"] = true }
local removed = 0
for _, child in ipairs(mapFolder:GetChildren()) do
\tif not keepInMap[child.Name] then
\t\tchild:Destroy()
\t\tremoved += 1
\tend
end

-- 2. Mover todas las carpetas de CalFight dentro de Workspace.Map
local srcMap = importRoot:FindFirstChild("Map")
local movedFolders = 0
if srcMap then
\tfor _, sub in ipairs(srcMap:GetChildren()) do
\t\tsub.Parent = mapFolder
\t\tmovedFolders += 1
\tend
end

-- 3. Reemplazar los spawns en Workspace.Miscellaneous.Spawns
local srcSpawns = importRoot:FindFirstChild("Spawns")
local spawnCount = 0
if srcSpawns then
\tlocal misc = Workspace:FindFirstChild("Miscellaneous")
\tlocal dstSpawns = misc and misc:FindFirstChild("Spawns")
\tif dstSpawns then
\t\tdstSpawns:ClearAllChildren()
\t\tfor _, sp in ipairs(srcSpawns:GetChildren()) do
\t\t\tsp.Parent = dstSpawns
\t\t\tspawnCount += 1
\t\tend
\t\tsrcSpawns:Destroy()
\telse
\t\tspawnCount = #srcSpawns:GetChildren()
\t\tsrcSpawns.Parent = Workspace
\tend
end

importRoot:Destroy()

-- 4. Instalar o actualizar AscensorTorreAurora en ServerScriptService
local elev = ServerScriptService:FindFirstChild("AscensorTorreAurora")
if elev then elev:Destroy() end
local scr = Instance.new("Script")
scr.Name = "AscensorTorreAurora"
local okSrc = pcall(function()
\tscr.Source = [[${ascSrc}]]
end)
scr.Parent = ServerScriptService

ChangeHistoryService:SetWaypoint("CalFight_MapaInstalado")
print(string.format("[CalFight] LISTO! Borrados %d objetos del mapa anterior | Movidas %d carpetas a Workspace.Map | %d Spawns instalados | Ascensor=%s", removed, movedFolders, spawnCount, tostring(okSrc)))
`;
}

function buildReadmeNative(counts) {
  return `# CalFight -> Roblox Studio (100% Construido en Roblox, sin Blockbench ni .obj)

Todo el mapa de **Ciudad Aurora** está construido directamente con **piezas nativas de Roblox** (\`Part\`, \`WedgePart\`, \`SurfaceGui\`, \`PointLight\`, \`SpawnLocation\` y \`Model\`), listo para meter en tu proyecto \`bat.rbxl\` **sin importar ni un solo \`.obj\`**.

---

## Qué incluye \`CalFight_Ciudad_Roblox.rbxmx\`
- **${counts.edificios} Edificios completos** dentro de \`Map/Edificios\`:
  - Fachadas con ventanas (\`Glass\`), marcos, molduras, toldos, balcones, unidades de aire y azoteas.
  - **8 locales accesibles con puertas abiertas e interiores amueblados**: \`CAFÉ LUNA\`, \`ARCADE\`, \`MERCADO\`, \`LIBROS\` (Biblioteca), \`RAMEN\`, \`TALLER\`, \`CENTRO COMERCIAL\` y \`TORRE AURORA\` (vestíbulo de mármol + ascensor), más **\`CASINO AURORA\`** (alfombra, recepción, mesas de juego, ruleta y bar).
- **${counts.letreros} Carteles** con \`SurfaceGui\` legible y **Reloj de la Estación**.
- **${counts.calles} tramos de avenidas, calles, plaza y pasos de cebra** + Plaza circular central.
- **${counts.trees} Árboles destructibles** en \`Map/Trees\` (\`Model\` con \`TreeRoot\`, compatibles con el script \`DestroyAmbient\` de \`bat.rbxl\`).
- **${counts.parques} piezas de parques y mobiliario** (fuente, bancos, jardineras, farolas con \`PointLight\`, borde de la arena) y \`${counts.horizonte}\` siluetas ligeras en \`Map/Horizonte\`.
- **${counts.playa} piezas de Playa y Mar** + **${counts.costaProps} modelos nativos en la costa** (\`muelle\` caminable con farolas, \`palmeras\`, \`sombrillas\`, \`torres de salvavidas\`, \`chiringuitos\`, \`cancha de vóley playa\`, \`faro\` iluminado, \`barcas\`, \`velero\`, \`casetas\`, \`castillos de arena\` y \`rocas\`).
- **${counts.spawns} \`SpawnLocation\`** (\`Spawn1..Spawn44\`) + plataformas de ascensor de Torre Aurora (\`Map/Ascensores\`).

---

## Instalación en \`bat.rbxl\` (2 pasos)

1. **Insertar el mapa en Studio**:
   - Abre \`bat.rbxl\` en **Roblox Studio**.
   - En **Explorer**, haz clic derecho sobre **\`Workspace\`** → **Insert from File...** y selecciona:
     \`f:\\blockstrike\\roblox_ciudad\\CalFight_Ciudad_Roblox.rbxmx\`

2. **Reemplazar el mapa de Battlegrounds automáticamente**:
   - Abre **View → Command Bar**.
   - Abre **[Instalar_Ciudad_Roblox.luau](file:///f:/blockstrike/roblox_ciudad/Instalar_Ciudad_Roblox.luau)**, copia todo, pégalo en la **Command Bar** y pulsa **Enter**.
   - En segundos borra el mapa anterior de Battlegrounds (conservando \`Throwables\` y \`Emote Anims\`), mete Ciudad Aurora dentro de \`Workspace.Map\`, reemplaza \`Spawn1..Spawn2\` por los 44 spawns de CalFight e instala el script \`AscensorTorreAurora\` en \`ServerScriptService\`.

¡Listo! Dale a **Play (F5)** para probarlo.
`;
}

// ============================================================
// Ejecucion principal
// ============================================================
async function main() {
  ensureDir(OUT_DIR);

  // Limpiar artefactos obsoletos del metodo anterior (.obj/.mtl/.png/.rbxmx antiguo) dentro de roblox_ciudad/
  const oldObjDir = path.join(OUT_DIR, 'modelos_obj');
  if (fs.existsSync(oldObjDir)) fs.rmSync(oldObjDir, { recursive: true, force: true });
  for (const oldFile of ['CalFight_Ciudad_Base.rbxmx', 'ColocarEdificios.luau', 'AscensorTorreAurora.luau']) {
    const p = path.join(OUT_DIR, oldFile);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  console.log('1/3 Extrayendo ciudad procedural + interiores + costa desde js/game.js...');
  const { exp, SIGNS } = await runProceduralCityExtraction();

  console.log('2/3 Generando CalFight_Ciudad_Roblox.rbxmx (100% piezas nativas de Roblox)...');
  const { xml, counts } = buildNativeRbxmx({ exp, SIGNS });
  fs.writeFileSync(path.join(OUT_DIR, 'CalFight_Ciudad_Roblox.rbxmx'), xml, 'utf8');

  console.log('3/3 Escribiendo Instalar_Ciudad_Roblox.luau y LEEME_ROBLOX.md...');
  fs.writeFileSync(path.join(OUT_DIR, 'Instalar_Ciudad_Roblox.luau'), buildInstallerLuau(), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'LEEME_ROBLOX.md'), buildReadmeNative(counts), 'utf8');

  console.log('\nExportacion 100% Roblox-nativa completada en:', OUT_DIR);
  console.log('Conteos:', counts);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
