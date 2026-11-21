'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'roblox_ciudad');
const OBJ_DIR = path.join(OUT_DIR, 'modelos_obj');

// Escala de conversion: personaje CalFight ~1.9u vs Roblox R6 ~5.04 studs
const SCALE = 2.65;
const MAX_QUADS_PER_OBJ = 8000; // 8,000 quads = 16,000 triangulos (limite Roblox MeshPart = 20,000)

// Enumeraciones oficiales de Material en Roblox RBXMX
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

function rgbLuma(rgb) {
  return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
}

function loadThree() {
  const code = fs.readFileSync(path.join(ROOT, 'lib', 'three.min.js'), 'utf8');
  const sb = {
    console,
    Math,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Float32Array,
    Uint16Array,
    Uint32Array,
    Int32Array,
    Map,
    Set,
    WeakMap,
    Error,
    self: null,
    window: null,
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
// 1. Extraccion exacta de la ciudad publica desde js/game.js
// ============================================================
async function runGameCityExtraction() {
  const gameLines = fs.readFileSync(path.join(ROOT, 'js', 'game.js'), 'utf8').split(/\r?\n/);
  // Tomamos desde line 196 (const CITY = ...) hasta line 1006 (justo antes de BETA_ON=true;MAPTAG='B';)
  const slice = gameLines.slice(195, 1006).join('\n');

  const COL = [];
  const CLOUDS = [];
  const ELEVATORS = [];
  const MAP_ITEMS = [];
  const TREES = [];
  const SIGNS = [];
  const STRIPS = [];
  const EXTRA_MESHES = [];
  const pendingLoads = [];
  const modelCache = new Map();

  function loadBBJson(name) {
    if (!modelCache.has(name)) {
      const p = path.join(ROOT, 'ciudad', name + '.bbmodel');
      modelCache.set(name, JSON.parse(fs.readFileSync(p, 'utf8')));
    }
    return modelCache.get(name);
  }

  class MockDummyMesh {
    constructor(geo, mat) {
      this.geometry = geo;
      this.material = mat;
      this.position = new THREE.Vector3();
      this.rotation = new THREE.Euler();
      this.scale = new THREE.Vector3(1, 1, 1);
      this.userData = {};
      this.children = [];
      this.visible = true;
    }
    add(...args) { this.children.push(...args); }
    updateMatrix() {}
  }

  class MockGroup {
    constructor() {
      this.position = new THREE.Vector3();
      this.rotation = new THREE.Euler();
      this.scale = new THREE.Vector3(1, 1, 1);
      this.userData = {};
      this.children = [];
      this.visible = true;
    }
    add(...args) { this.children.push(...args); }
  }

  // Sobreescribimos THREE.Mesh y THREE.Group en el sandbox para capturar ground/town/seal/water/carpet/strips/gulls
  const MockTHREE = Object.assign({}, THREE, {
    Mesh: MockDummyMesh,
    Group: MockGroup,
    Texture: class MockTexture {
      constructor() {
        this.image = { width: 64, height: 64 };
        this.repeat = new THREE.Vector2(1, 1);
      }
      clone() { return new MockTexture(); }
    },
    MeshLambertMaterial: class { constructor(o) { Object.assign(this, o); } },
    MeshPhongMaterial: class { constructor(o) { Object.assign(this, o); } },
    MeshToonMaterial: class { constructor(o) { Object.assign(this, o); } },
    RingGeometry: class { constructor(iR, oR, seg) { this.type = 'RingGeometry'; this.params = { iR, oR, seg }; } },
    CircleGeometry: class { constructor(r, seg) { this.type = 'CircleGeometry'; this.params = { r, seg }; } },
    PlaneGeometry: class { constructor(w, h) { this.type = 'PlaneGeometry'; this.params = { w, h }; } },
    BoxGeometry: class { constructor(w, h, d) { this.type = 'BoxGeometry'; this.params = { w, h, d }; } },
  });

  const scene = {
    add(obj) {
      EXTRA_MESHES.push(obj);
    },
  };

  function makeDummyCtx() {
    return {
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      textAlign: 'center',
      textBaseline: 'middle',
      font: '12px sans-serif',
      fillRect() {},
      strokeRect() {},
      fillText() {},
      translate() {},
      rotate() {},
    };
  }

  const sandbox = {
    console,
    Math,
    Object,
    Array,
    Number,
    String,
    Boolean,
    Promise,
    Set,
    Map,
    JSON,
    Date,
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
    pixTex(w, h, fn) {
      if (fn) try { fn(makeDummyCtx()); } catch (_) {}
      return new MockTHREE.Texture();
    },
    noiseRect() {},
    cityAnimeMaterial: m => m,
    bbRegister: () => {},
    BLOCK_TEX: { grass: new MockTHREE.Texture() },
    CITY_GRAD: new MockTHREE.Texture(),
    BEACH: {
      t: 0,
      boats: [],
      gulls: [],
      sea: {
        uTime: { value: 0 },
        uSky: { value: new THREE.Color(0x88ccff) },
        uSunV: { value: new THREE.Vector3(0, 1, 0) },
        uSunC: { value: new THREE.Color(0xffffff) },
        uSunK: { value: 1 },
      },
      water: null,
    },
    ZZZ_U: {
      beta: { value: 0 },
      on: { value: 0 },
      night: { value: 0 },
      sunset: { value: 0 },
      wet: { value: 0 },
      sunDir: { value: new THREE.Vector3() },
      rimCol: { value: new THREE.Color() },
      rimWarm: { value: new THREE.Color() },
    },
    CF_TEXTURES: {
      textureIndex(textures, ref) {
        const index = Number(ref);
        if (Number.isInteger(index) && index >= 0 && index < textures.length) return index;
        return textures.findIndex(t => t.id === ref || t.uuid === ref);
      },
      uvSize(data, texture) {
        return [
          Number(texture && texture.uv_width) || data.resolution.width,
          Number(texture && texture.uv_height) || data.resolution.height,
        ];
      },
      mode() { return 'opaque'; },
      alphaOptions() { return {}; },
    },
    location: { hostname: 'localhost' },
    localStorage: { getItem: () => null },
    XMLHttpRequest: class {
      open() {}
      send() {
        const p = path.join(ROOT, 'config', 'mapa.json');
        if (fs.existsSync(p)) {
          this.status = 200;
          this.responseText = fs.readFileSync(p, 'utf8');
        } else {
          this.status = 404;
          this.responseText = '';
        }
      }
    },
    fetch(url) {
      const clean = String(url).split('?')[0];
      const full = path.join(ROOT, clean);
      if (fs.existsSync(full)) {
        const jsonData = JSON.parse(fs.readFileSync(full, 'utf8'));
        return Promise.resolve({ ok: true, json: () => Promise.resolve(jsonData) });
      }
      return Promise.reject(new Error('Not found: ' + full));
    },
    scene,
    window: null,
    document: { createElement: () => ({}), head: { appendChild: () => {} } },
  };
  sandbox.window = sandbox;

  // Agregamos un pequeño epilogo dentro del mismo scope del bloque para capturar batches, sign, PR y TREE_LOGS
  const instrumented = slice + `
    ;window.__EXPORT__ = {
      CITY,
      CITY_PLAN,
      CITY_MODEL_DIMS,
      SPAWN_POINTS,
      COL,
      ELEVATORS,
      BEACH,
      batches,
      pubCols,
      PR: typeof PR !== 'undefined' ? PR : [],
      bbLoads: typeof bbLoads !== 'undefined' ? bbLoads : [],
      SHORE,
    };
  }
  `;

  // Inyectamos captura limpia de llamadas sign(...) para guardar texto, posicion, ancho, rotacion y color
  const withSignHook = instrumented.replace(
    'function sign(text,x,y,z,w,ry,color=\'#24546a\'){',
    'function sign(text,x,y,z,w,ry,color=\'#24546a\'){ window.__SIGNS__.push({text,x,y,z,w,ry,color});'
  );
  sandbox.__SIGNS__ = SIGNS;

  // Stub ligero de bbTexturedGeometry que no intenta decodificar canvas pero si llama bbGeometry con textures mockeadas
  const withBBHook = withSignHook.replace(
    /async function bbTexturedGeometry\(data\)\{[\s\S]*?return bbGeometry\(data,textures\);\s*\}/,
    `async function bbTexturedGeometry(data){
      const textures = (data.textures || []).map((spec, i) => ({
        spec,
        map: { image: { width: 64, height: 64 } },
        material: () => ({})
      }));
      return bbGeometry(data, textures);
    }`
  );

  vm.runInNewContext(withBBHook, sandbox, { filename: 'game_city_slice.js' });
  const exp = sandbox.__EXPORT__;
  await Promise.all(exp.bbLoads || []);

  return {
    exp,
    SIGNS,
    EXTRA_MESHES,
    loadBBJson,
  };
}

// ============================================================
// 2. Exportador Blockbench .bbmodel -> OBJ + MTL + PNG deduplicado
// ============================================================
function exportAllBBModels(modelNames) {
  ensureDir(OBJ_DIR);

  const BB_FACES = {
    south: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    north: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
    east: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
    west: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
    up: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
    down: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
  };
  const FACE_NORMALS = {
    south: [0, 0, 1],
    north: [0, 0, -1],
    east: [1, 0, 0],
    west: [-1, 0, 0],
    up: [0, 1, 0],
    down: [0, -1, 0],
  };

  const texHashToFile = new Map();
  const modelExportMeta = {};
  const stats = { models: 0, objFiles: 0, totalTris: 0, pngFiles: 0, splitModels: [] };

  const T = o => new THREE.Matrix4().makeTranslation(o[0], o[1], o[2]);
  const R = r => new THREE.Matrix4().makeRotationFromEuler(
    new THREE.Euler(r[0] * Math.PI / 180, r[1] * Math.PI / 180, r[2] * Math.PI / 180, 'ZYX')
  );
  const xf = node => {
    const o = node.origin || [0, 0, 0];
    const r = node.rotation || [0, 0, 0];
    return T(o).multiply(R(r)).multiply(T([-o[0], -o[1], -o[2]]));
  };

  const isCol = n => /^(colisi|collision|hitbox)/i.test((n && n.name) || '');
  const texIndex = (textures, ref) => {
    const idx = Number(ref);
    if (Number.isInteger(idx) && idx >= 0 && idx < textures.length) return idx;
    return textures.findIndex(t => t.id === ref || t.uuid === ref);
  };

  for (const name of modelNames) {
    const bbPath = path.join(ROOT, 'ciudad', name + '.bbmodel');
    if (!fs.existsSync(bbPath)) {
      throw new Error('Falta .bbmodel: ' + bbPath);
    }
    const data = JSON.parse(fs.readFileSync(bbPath, 'utf8'));
    const els = new Map((data.elements || []).map(e => [e.uuid, e]));
    const GR = new Map((data.groups || []).filter(g => g && typeof g === 'object' && g.uuid).map(g => [g.uuid, g]));
    const gm = n => {
      const g = GR.get(n.uuid);
      return g ? Object.assign({}, g, n, { name: n.name || g.name, origin: n.origin || g.origin, rotation: n.rotation || g.rotation }) : n;
    };

    const quads = []; // { verts: [[x,y,z]x4], uvs: [[u,v]x4], nrm: [nx,ny,nz], texId }
    const v = new THREE.Vector3();
    const nv = new THREE.Vector3();
    const nMat = new THREE.Matrix3();
    const unitToStuds = SCALE / 16;

    const emit = (el, mat) => {
      if (el.type && el.type !== 'cube') return;
      if (el.visibility === false) return;
      const m = mat.clone();
      if (el.rotation) m.multiply(xf(el));
      nMat.getNormalMatrix(m);
      const f = el.from;
      const t = el.to;
      // Si un cubo tuviera un eje invertido (from > to), ajustamos el orden de winding por paridad
      const negAxes = (t[0] < f[0] ? 1 : 0) + (t[1] < f[1] ? 1 : 0) + (t[2] < f[2] ? 1 : 0);
      const flipWinding = (negAxes % 2) === 1;

      for (const [fname, face] of Object.entries(el.faces || {})) {
        if (!face.uv || face.texture == null || !BB_FACES[fname]) continue;
        const tId = texIndex(data.textures || [], face.texture);
        if (tId < 0 || !data.textures[tId]) continue;
        const texSpec = data.textures[tId];
        const w = Number(texSpec.uv_width) || data.resolution.width;
        const h = Number(texSpec.uv_height) || data.resolution.height;
        const [u1, v1, u2, v2] = face.uv;
        const uv4 = [[u1, v2], [u2, v2], [u2, v1], [u1, v1]];

        const verts = [];
        const uvs = [];
        BB_FACES[fname].forEach((c, i) => {
          v.set(c[0] ? t[0] : f[0], c[1] ? t[1] : f[1], c[2] ? t[2] : f[2])
            .applyMatrix4(m)
            .multiplyScalar(unitToStuds);
          verts.push([v.x, v.y, v.z]);
          const [u, vt] = uv4[i];
          uvs.push([u / w, 1 - vt / h]);
        });
        const fn = FACE_NORMALS[fname];
        nv.set(fn[0], fn[1], fn[2]).applyMatrix3(nMat).normalize();

        if (flipWinding) {
          verts.reverse();
          uvs.reverse();
          nv.negate();
        }
        quads.push({ verts, uvs, nrm: [nv.x, nv.y, nv.z], texId: tId });
      }
    };

    const walk = (nodes, mat, col) => {
      for (const n0 of nodes) {
        const n = typeof n0 === 'string' ? n0 : gm(n0);
        if (typeof n === 'string') {
          const e = els.get(n);
          if (!e) {
            const g = GR.get(n);
            if (g && g.children) walk(g.children, mat.clone().multiply(xf(g)), col || isCol(g));
            continue;
          }
          if (!col) emit(e, mat);
        } else {
          if (n.visibility === false) continue;
          walk(n.children || [], mat.clone().multiply(xf(n)), col || isCol(n));
        }
      }
    };
    walk(data.outliner || [], new THREE.Matrix4(), false);

    // Extraer texturas realmente usadas en las caras de este modelo (deduplicadas por SHA-256)
    const usedTexIds = [...new Set(quads.map(q => q.texId))];
    const mtlMaterials = new Map();
    for (const tid of usedTexIds) {
      const texSpec = data.textures[tid];
      const src = texSpec.source || '';
      const b64 = src.includes(',') ? src.split(',')[1] : src;
      const buf = Buffer.from(b64, 'base64');
      const h8 = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
      const baseTex = path.basename(texSpec.name || 'atlas.png', '.png').replace(/[^a-zA-Z0-9_-]/g, '_');
      const outPngName = `${baseTex}_${h8}.png`;
      if (!texHashToFile.has(h8)) {
        fs.writeFileSync(path.join(OBJ_DIR, outPngName), buf);
        texHashToFile.set(h8, outPngName);
        stats.pngFiles++;
      }
      mtlMaterials.set(tid, { matName: `mat_${tid}`, pngFile: texHashToFile.get(h8) });
    }

    // Escribir .mtl unico para el modelo (o sus partes)
    const mtlName = `${name}.mtl`;
    let mtlTxt = `# Material exportado desde CalFight Blockbench (${name}.bbmodel)\n`;
    for (const { matName, pngFile } of mtlMaterials.values()) {
      mtlTxt += `newmtl ${matName}\n`;
      mtlTxt += `Ka 1.000 1.000 1.000\n`;
      mtlTxt += `Kd 1.000 1.000 1.000\n`;
      mtlTxt += `Ks 0.000 0.000 0.000\n`;
      mtlTxt += `d 1.0\n`;
      mtlTxt += `illum 1\n`;
      mtlTxt += `map_Kd ${pngFile}\n\n`;
    }
    fs.writeFileSync(path.join(OBJ_DIR, mtlName), mtlTxt, 'utf8');

    // Dividir en chunks <= MAX_QUADS_PER_OBJ si supera ~16,000 tris
    const numChunks = Math.max(1, Math.ceil(quads.length / MAX_QUADS_PER_OBJ));
    if (numChunks > 1) stats.splitModels.push({ name, quads: quads.length, parts: numChunks });

    const partsMeta = [];
    let fullMin = [Infinity, Infinity, Infinity];
    let fullMax = [-Infinity, -Infinity, -Infinity];

    for (let c = 0; c < numChunks; c++) {
      const start = c * MAX_QUADS_PER_OBJ;
      const end = Math.min(quads.length, (c + 1) * MAX_QUADS_PER_OBJ);
      const chunk = quads.slice(start, end);
      const partStem = numChunks === 1 ? name : `${name}_p${c + 1}`;
      const objFile = `${partStem}.obj`;

      const lines = [
        `# CalFight Ciudad Aurora -> Roblox Studio (${partStem})`,
        `# Escala: 1 CalFight unit = ${SCALE} Roblox studs (vertice ya escalado en studs)`,
        `mtllib ${mtlName}`,
        `o ${partStem}`,
      ];

      let min = [Infinity, Infinity, Infinity];
      let max = [-Infinity, -Infinity, -Infinity];
      let vIdx = 1;
      let vtIdx = 1;
      let vnIdx = 1;
      let curMat = -1;

      for (const q of chunk) {
        if (q.texId !== curMat) {
          curMat = q.texId;
          lines.push(`usemtl mat_${curMat}`);
        }
        for (const p of q.verts) {
          min[0] = Math.min(min[0], p[0]); min[1] = Math.min(min[1], p[1]); min[2] = Math.min(min[2], p[2]);
          max[0] = Math.max(max[0], p[0]); max[1] = Math.max(max[1], p[1]); max[2] = Math.max(max[2], p[2]);
          fullMin[0] = Math.min(fullMin[0], p[0]); fullMin[1] = Math.min(fullMin[1], p[1]); fullMin[2] = Math.min(fullMin[2], p[2]);
          fullMax[0] = Math.max(fullMax[0], p[0]); fullMax[1] = Math.max(fullMax[1], p[1]); fullMax[2] = Math.max(fullMax[2], p[2]);
          lines.push(`v ${p[0].toFixed(5)} ${p[1].toFixed(5)} ${p[2].toFixed(5)}`);
        }
        for (const t of q.uvs) {
          lines.push(`vt ${t[0].toFixed(6)} ${t[1].toFixed(6)}`);
        }
        lines.push(`vn ${q.nrm[0].toFixed(5)} ${q.nrm[1].toFixed(5)} ${q.nrm[2].toFixed(5)}`);

        const a = vIdx, b = vIdx + 1, d = vIdx + 2, e = vIdx + 3;
        const ta = vtIdx, tb = vtIdx + 1, tc = vtIdx + 2, td = vtIdx + 3;
        lines.push(`f ${a}/${ta}/${vnIdx} ${b}/${tb}/${vnIdx} ${d}/${tc}/${vnIdx}`);
        lines.push(`f ${a}/${ta}/${vnIdx} ${d}/${tc}/${vnIdx} ${e}/${td}/${vnIdx}`);

        vIdx += 4;
        vtIdx += 4;
        vnIdx += 1;
      }

      fs.writeFileSync(path.join(OBJ_DIR, objFile), lines.join('\n') + '\n', 'utf8');
      stats.objFiles++;
      stats.totalTris += chunk.length * 2;

      const size = [
        +(max[0] - min[0]).toFixed(4),
        +(max[1] - min[1]).toFixed(4),
        +(max[2] - min[2]).toFixed(4),
      ];
      const center = [
        +((min[0] + max[0]) * 0.5).toFixed(4),
        +((min[1] + max[1]) * 0.5).toFixed(4),
        +((min[2] + max[2]) * 0.5).toFixed(4),
      ];
      partsMeta.push({ partStem, tris: chunk.length * 2, size, center });
    }

    const totalSize = [
      +(fullMax[0] - fullMin[0]).toFixed(4),
      +(fullMax[1] - fullMin[1]).toFixed(4),
      +(fullMax[2] - fullMin[2]).toFixed(4),
    ];
    modelExportMeta[name] = {
      name,
      totalTris: quads.length * 2,
      totalSize,
      parts: partsMeta,
    };
    stats.models++;
  }

  return { modelExportMeta, stats };
}

// ============================================================
// 3. Generador RBXMX XML v4 para Roblox Studio
// ============================================================
class RbxmxWriter {
  constructor() {
    this.nextId = 1;
  }
  ref() {
    return `RBX${String(this.nextId++).padStart(7, '0')}`;
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
  rotY(yaw) {
    const c = +Math.cos(yaw).toFixed(6);
    const s = +Math.sin(yaw).toFixed(6);
    // Right-handed Y rotation: x' = c*x + s*z, z' = -s*x + c*z
    return [c, 0, s, 0, 1, 0, -s, 0, c];
  }
  color3Xml(hex) {
    const [r, g, b] = hexToRgb01(hex);
    return `<Color3 name="Color">
        <R>${r.toFixed(4)}</R><G>${g.toFixed(4)}</G><B>${b.toFixed(4)}</B>
      </Color3>`;
  }
  partXml(opts, childrenXml = '') {
    const {
      name = 'Part',
      x = 0, y = 0, z = 0,
      sx = 1, sy = 1, sz = 1,
      yaw = 0,
      rotMatrix = null,
      color = '#cccccc',
      material = MAT.SmoothPlastic,
      transparency = 0,
      anchored = true,
      canCollide = true,
      canQuery = true,
      canTouch = true,
      castShadow = true,
      shape = 1, // 1=Block, 2=Cylinder
    } = opts;
    const rot = rotMatrix || (yaw ? this.rotY(yaw) : null);
    return `<Item class="Part" referent="${this.ref()}">
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
        <Vector3 name="size"><X>${Math.max(0.05, sx).toFixed(4)}</X><Y>${Math.max(0.05, sy).toFixed(4)}</Y><Z>${Math.max(0.05, sz).toFixed(4)}</Z></Vector3>
        <token name="shape">${shape}</token>
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
        ${this.cfXml(x, y, z, this.rotY(yaw))}
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
    // NormalId tokens: Front=5, Back=2
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

// Clasificacion de batches y construccion de la escena RBXMX
function buildRbxmx({ exp, SIGNS, modelExportMeta }) {
  const rx = new RbxmxWriter();

  const sueloParts = [];
  const plazaParts = [];
  const callesParts = [];
  const interioresParts = [];
  const parquesParts = [];
  const letrerosParts = [];
  const playaParts = [];
  const ascensoresParts = [];
  const colisionesParts = [];
  const guiasParts = [];
  const treeModels = [];

  // 3A. Suelo base verde de la ciudad (z <= 67.4 para no tapar arena ni mar)
  // En Three.js ground es 420x280 centrado en z=-70 => x[-210..210], z[-210..70]
  // Aqui recortamos el sur a z=67.4 exactamente como la playa strip(zN=67.4)
  {
    const x0 = -210, x1 = 210, z0 = -210, z1 = 67.4;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const w = x1 - x0, d = z1 - z0;
    const thick = 2.0; // studs debajo de y=0
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

  // 3B. Plaza circular central (Cylinder rotado 90 deg en Z porque el eje de Cylinder en Roblox es X)
  {
    const radius = (exp.CITY.core + 0.5) * SCALE;
    const thick = 0.28;
    plazaParts.push(rx.partXml({
      name: 'PlazaCircular',
      x: 0,
      y: -thick / 2 + 0.02, // superficie superior en +0.02 studs sobre MainPart (-0.02) -> sin z-fighting
      z: 0,
      sx: thick,
      sy: radius * 2,
      sz: radius * 2,
      rotMatrix: [0, -1, 0, 1, 0, 0, 0, 0, 1],
      color: '#8c999f',
      material: MAT.Concrete,
      shape: 2,
    }));
    // Emblema rombo central
    plazaParts.push(rx.partXml({
      name: 'PlazaEmblemaRombo',
      x: 0,
      y: 0.052 * SCALE + 0.09,
      z: 0,
      sx: 3.3 * SCALE,
      sy: 0.08,
      sz: 3.3 * SCALE,
      yaw: Math.PI / 4,
      color: '#598c9a',
      material: MAT.SmoothPlastic,
      canCollide: false,
    }));
  }

  // 3C. Extraer arboles (log + 2 canopy blocks) y clasificar el resto de boxes
  const allBatches = [...exp.batches.values()].filter(b => !b.beta); // public + pub (-1)
  const treeCanopies = [];
  const treeLogs = [];
  const otherBoxes = [];

  for (const b of allBatches) {
    for (const item of b.items) {
      const [x, y, z, w, h, d, tower] = item;
      if (b.tex === 'log' && Math.abs(h - 2.3) < 0.05 && Math.abs(w - 0.5) < 0.05) {
        treeLogs.push({ x, y, z, w, h, d, color: b.color });
      } else if (b.tex === 'leaves' && ((Math.abs(w - 2.7) < 0.05 && Math.abs(y - 3) < 0.05) || (Math.abs(w - 2) < 0.05 && Math.abs(y - 4) < 0.05))) {
        treeCanopies.push({ x, y, z, w, h, d, color: b.color });
      } else {
        otherBoxes.push({ x, y, z, w, h, d, color: b.color, tex: b.tex, tower });
      }
    }
  }

  // Emparejar logs con sus copas y construir Models compatibles con bat.rbxl DestroyAmbient (`TreeRoot`)
  const usedCanopy = new Set();
  const treeCenters = [];
  treeLogs.forEach((log, idx) => {
    const trunkRef = rx.ref();
    // Generamos manualmente TreeRoot para tener el referent en PrimaryPart
    const trunkXml = `<Item class="Part" referent="${trunkRef}">
      <Properties>
        <string name="Name">TreeRoot</string>
        <bool name="Anchored">true</bool>
        <bool name="CanCollide">true</bool>
        <bool name="CanQuery">true</bool>
        <bool name="CanTouch">true</bool>
        <bool name="CastShadow">true</bool>
        ${rx.color3Xml(log.color)}
        ${rx.cfXml(log.x * SCALE, log.y * SCALE, log.z * SCALE, null)}
        <token name="Material">${MAT.Wood}</token>
        <float name="Transparency">0</float>
        <Vector3 name="size"><X>${(log.w * SCALE).toFixed(4)}</X><Y>${(log.h * SCALE).toFixed(4)}</Y><Z>${(log.d * SCALE).toFixed(4)}</Z></Vector3>
        <token name="shape">1</token>
        <token name="TopSurface">0</token>
        <token name="BottomSurface">0</token>
      </Properties>
    </Item>`;
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
    treeCenters.push({ x: log.x, z: log.z });
  });

  // Hojas huerfanas (si existieran) pasan a parques
  for (let i = 0; i < treeCanopies.length; i++) {
    if (!usedCanopy.has(i)) otherBoxes.push(Object.assign({}, treeCanopies[i], { tex: 'leaves' }));
  }

  // Mapa rapido de edificios accesibles + Casino para clasificar muebles interiores
  const interiorRects = exp.CITY.interiors.map(q => ({
    x0: q.x - q.w / 2 - 0.5,
    x1: q.x + q.w / 2 + 0.5,
    z0: q.z - q.d / 2 - 0.5,
    z1: q.z + q.d / 2 + 0.5,
    h: q.h,
  }));
  const isInsideInterior = (x, y, z) =>
    interiorRects.some(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1 && y < r.h + 1);

  const lampCenters = new Set(exp.CITY.lamps.map(l => `${l.x.toFixed(2)},${l.z.toFixed(2)}`));

  let partSeq = 0;
  for (const bx of otherBoxes) {
    partSeq++;
    const { x, y, z, w, h, d, color, tex, tower } = bx;
    const isFlatFloor = h <= 0.05 && y <= 0.15;
    let sy = h * SCALE;
    let wy = y * SCALE;

    // Evitar Z-fighting en capas delgadas del suelo: espesor minimo 0.16 studs con cara superior en (y+h/2)*SCALE + micro-offset por capa
    if (isFlatFloor) {
      const topY = (y + h * 0.5) * SCALE + 0.03;
      sy = 0.22;
      wy = topY - sy * 0.5;
    }

    let mat = MAT.SmoothPlastic;
    let extraChild = '';
    if (tex === 'lamp') {
      mat = MAT.Neon;
    } else if (tex === 'leaves') {
      mat = MAT.Grass;
    } else if (tex === 'log') {
      mat = MAT.Wood;
    } else if (tex === 'plank') {
      mat = MAT.WoodPlanks;
    } else if (isFlatFloor) {
      mat = MAT.Concrete;
    }

    // Bombillas de farolas: brillan y llevan PointLight real
    const isStreetLampBulb = Math.abs(w - 0.38) < 0.02 && Math.abs(h - 0.34) < 0.02 && lampCenters.has(`${x.toFixed(2)},${z.toFixed(2)}`);
    if (isStreetLampBulb) {
      mat = MAT.Neon;
      extraChild = rx.pointLightXml('#fff0b1', 34, 1.35);
    }

    const canCollide = !isFlatFloor && tex !== 'lamp' && !tower && !(isStreetLampBulb);
    const pXml = rx.partXml({
      name: tower ? `Skyline_${partSeq}` : isStreetLampBulb ? `FarolaLuz_${partSeq}` : `Bloque_${partSeq}`,
      x: x * SCALE,
      y: wy,
      z: z * SCALE,
      sx: w * SCALE,
      sy,
      sz: d * SCALE,
      color,
      material: mat,
      canCollide,
      castShadow: !isFlatFloor && !tower,
    }, extraChild);

    if (isInsideInterior(x, y, z) || tex === 'lamp') {
      interioresParts.push(pXml);
    } else if (isFlatFloor) {
      callesParts.push(pXml);
    } else {
      parquesParts.push(pXml);
    }
  }

  // 3D. Alfombra cuadriculada del Casino Aurora (en Three.js era un BufferGeometry con vertexColors)
  {
    const cas = exp.CITY_PLAN.find(b => b.label === 'CASINO AURORA');
    if (cas) {
      const wall = 0.32;
      const iw = cas.w - 2 * wall;
      const id = cas.d - 2 * wall;
      // Dos rectángulos superpuestos limpios que reproducen el borde dorado + pasillo central + alfombra burdeo
      interioresParts.push(rx.partXml({
        name: 'CasinoAlfombraBorde',
        x: cas.x * SCALE,
        y: 0.07 * SCALE,
        z: cas.z * SCALE,
        sx: iw * SCALE,
        sy: 0.14,
        sz: id * SCALE,
        color: '#c9a85b',
        material: MAT.Fabric,
        canCollide: false,
      }));
      interioresParts.push(rx.partXml({
        name: 'CasinoAlfombraBurdeo',
        x: cas.x * SCALE,
        y: 0.075 * SCALE + 0.03,
        z: cas.z * SCALE,
        sx: (iw - 2) * SCALE,
        sy: 0.14,
        sz: (id - 2) * SCALE,
        color: '#642f4e',
        material: MAT.Fabric,
        canCollide: false,
      }));
      interioresParts.push(rx.partXml({
        name: 'CasinoAlfombraPasillo',
        x: cas.x * SCALE,
        y: 0.08 * SCALE + 0.06,
        z: cas.z * SCALE,
        sx: 3.6 * SCALE,
        sy: 0.14,
        sz: (id - 2) * SCALE,
        color: '#92516b',
        material: MAT.Fabric,
        canCollide: false,
      }));
    }
  }

  // 3E. Reloj de la estacion (esfera con SurfaceGui)
  letrerosParts.push(rx.partXml({
    name: 'RelojEstacion',
    x: -13 * SCALE,
    y: 7.5 * SCALE,
    z: -27.86 * SCALE,
    sx: 1.7 * SCALE,
    sy: 1.7 * SCALE,
    sz: 0.18,
    color: '#eee9d8',
    material: MAT.SmoothPlastic,
    canCollide: false,
  }, rx.surfaceGuiSignXml('12:00 · AURORA', '#344e60', 5)));

  // 3F. Letreros 3D (`sign(...)`) con SurfaceGui Front + Back
  SIGNS.forEach((s, i) => {
    const sw = s.w * SCALE;
    const sh = (s.w / 4) * SCALE;
    const children = rx.surfaceGuiSignXml(s.text, s.color, 5) + rx.surfaceGuiSignXml(s.text, s.color, 2);
    letrerosParts.push(rx.partXml({
      name: `Letrero_${i + 1}_${s.text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24)}`,
      x: s.x * SCALE,
      y: s.y * SCALE,
      z: s.z * SCALE,
      sx: sw,
      sy: sh,
      sz: 0.24,
      yaw: s.ry,
      color: s.color,
      material: MAT.SmoothPlastic,
      canCollide: false,
      castShadow: false,
    }, children));
  });

  // 3G. Playa (arena seca + arena mojada siguiendo SHORE(x)) y Mar
  {
    const step = 4;
    for (let x0 = -136; x0 < 136; x0 += step) {
      const xm = x0 + step * 0.5;
      const zShore = exp.SHORE(xm);
      const dryN = 67.4;
      const dryS = zShore;
      const dryLen = Math.max(2, dryS - dryN);
      playaParts.push(rx.partXml({
        name: `Arena_${x0}`,
        x: xm * SCALE,
        y: -0.25,
        z: ((dryN + dryS) * 0.5) * SCALE,
        sx: (step + 0.35) * SCALE,
        sy: 0.5,
        sz: dryLen * SCALE,
        color: '#e8d29a',
        material: MAT.Sand,
        canCollide: true,
        castShadow: false,
      }));
      // Franja de arena mojada ligeramente mas elevada (superficie +0.04 studs sobre arena)
      const wetN = zShore - 3.0;
      playaParts.push(rx.partXml({
        name: `ArenaMojada_${x0}`,
        x: xm * SCALE,
        y: -0.20,
        z: ((wetN + zShore) * 0.5) * SCALE,
        sx: (step + 0.35) * SCALE,
        sy: 0.5,
        sz: 3.1 * SCALE,
        color: '#bfa271',
        material: MAT.Sand,
        canCollide: true,
        castShadow: false,
      }));
    }

    // Superficie del mar (translucida) y fondo marino (evita caer al vacio)
    playaParts.push(rx.partXml({
      name: 'MarSuperficie',
      x: 0,
      y: -0.04 * SCALE - 0.15,
      z: (67 + 350) * SCALE,
      sx: 1200 * SCALE,
      sy: 0.3,
      sz: 700 * SCALE,
      color: '#2590c2',
      material: MAT.Glass,
      transparency: 0.35,
      canCollide: false,
      castShadow: false,
    }));
    playaParts.push(rx.partXml({
      name: 'FondoMarino',
      x: 0,
      y: -1.45 * SCALE - 0.5,
      z: (67 + 350) * SCALE,
      sx: 1200 * SCALE,
      sy: 1.0,
      sz: 700 * SCALE,
      color: '#5a7f8a',
      material: MAT.Sand,
      transparency: 0,
      canCollide: true,
      castShadow: false,
    }));
  }

  // 3H. Ascensor de Torre Aurora
  if (exp.ELEVATORS.length > 0) {
    const el = exp.ELEVATORS[0];
    const stDown = el.st[0];
    const stUp = el.st[1];
    ascensoresParts.push(rx.partXml({
      name: 'TorreAurora_Subir',
      x: stDown.x * SCALE,
      y: 0.25,
      z: stDown.z * SCALE,
      sx: 2.2 * SCALE,
      sy: 0.5,
      sz: 2.2 * SCALE,
      color: '#7ad7ff',
      material: MAT.Neon,
      transparency: 0.25,
      canCollide: false,
      castShadow: false,
    }));
    ascensoresParts.push(rx.partXml({
      name: 'TorreAurora_Bajar',
      x: stUp.x * SCALE,
      y: el.roofY * SCALE + 0.25,
      z: stUp.z * SCALE,
      sx: 2.2 * SCALE,
      sy: 0.5,
      sz: 2.2 * SCALE,
      color: '#7ad7ff',
      material: MAT.Neon,
      transparency: 0.25,
      canCollide: false,
      castShadow: false,
    }));
  }

  // 3I. Todas las cajas de colision (solid() + Blockbench cols + muelle), filtrando solo arboles ya cubiertos por TreeRoot
  let colIdx = 0;
  for (const c of exp.COL) {
    // Si coincide con un tronco de arbol de TreeRoot (0.25 half-extent y y0=0), ya colisiona TreeRoot
    const isTreeCol = Math.abs(c.hx - 0.25) < 0.02 && Math.abs(c.hz - 0.25) < 0.02 && !c.y0 &&
      treeCenters.some(t => Math.abs(t.x - c.x) < 0.1 && Math.abs(t.z - c.z) < 0.1);
    if (isTreeCol) continue;

    const y0 = Number(c.y0) || 0;
    const y1 = Number(c.h) || 1;
    if (y1 <= y0 || c.hx <= 0.01 || c.hz <= 0.01) continue;
    colIdx++;
    colisionesParts.push(rx.partXml({
      name: `Col_${colIdx}`,
      x: c.x * SCALE,
      y: ((y0 + y1) * 0.5) * SCALE,
      z: c.z * SCALE,
      sx: c.hx * 2 * SCALE,
      sy: (y1 - y0) * SCALE,
      sz: c.hz * 2 * SCALE,
      color: '#00ff66',
      material: MAT.SmoothPlastic,
      transparency: 1,
      canCollide: true,
      castShadow: false,
    }));
  }

  // 3J. Guias visuales temporales de edificios/props Blockbench (reemplazadas al ejecutar ColocarEdificios.luau)
  exp.CITY_PLAN.forEach((b, i) => {
    if (!b.model) return;
    guiasParts.push(rx.partXml({
      name: `Guia_${b.model}_${i + 1}`,
      x: b.x * SCALE,
      y: (b.h * 0.5) * SCALE,
      z: b.z * SCALE,
      sx: b.w * SCALE,
      sy: b.h * SCALE,
      sz: b.d * SCALE,
      yaw: b.z < 0 ? 0 : Math.PI,
      color: b.color || '#cccccc',
      material: MAT.SmoothPlastic,
      transparency: 0.45,
      canCollide: false,
      castShadow: false,
    }));
  });
  exp.PR.forEach((pr, i) => {
    const meta = modelExportMeta[pr.m];
    const sy = meta ? meta.totalSize[1] : 4;
    const sx = (meta ? meta.totalSize[0] : 3) * (pr.m === 'muelle' ? 1.6 : 1);
    const sz = (meta ? meta.totalSize[2] : 3) * (pr.m === 'muelle' ? 1.7 : 1);
    guiasParts.push(rx.partXml({
      name: `GuiaProp_${pr.m}_${i + 1}`,
      x: pr.x * SCALE,
      y: (pr.y || 0) * SCALE + sy * 0.5,
      z: pr.z * SCALE,
      sx: Math.max(1, sx),
      sy: Math.max(1, sy),
      sz: Math.max(1, sz),
      yaw: pr.ry || 0,
      color: '#ffd166',
      material: MAT.SmoothPlastic,
      transparency: 0.45,
      canCollide: false,
      castShadow: false,
    }));
  });

  // 3K. SpawnLocations (`Spawns` folder, 44 spawns de Ciudad Aurora)
  const spawnItems = exp.SPAWN_POINTS.map(sp => rx.spawnLocationXml({
    name: `Spawn${sp.id}`,
    x: sp.x * SCALE,
    y: 0.35,
    z: sp.z * SCALE,
    yaw: sp.yaw,
  }));

  // Ensamblar arbol completo Compatible con bat.rbxl
  const mapFolder = rx.folderXml('Map', [
    rx.folderXml('Suelo', sueloParts),
    rx.folderXml('Plaza', plazaParts),
    rx.folderXml('Avenidas_y_Calles', callesParts),
    rx.folderXml('Interiores_Muebles', interioresParts),
    rx.folderXml('Parques_y_Mobiliario', parquesParts),
    rx.folderXml('Letreros', letrerosParts),
    rx.folderXml('Trees', treeModels),
    rx.folderXml('Playa_y_Mar', playaParts),
    rx.folderXml('Ascensores', ascensoresParts),
    rx.folderXml('Edificios_Colisiones', colisionesParts),
    rx.folderXml('Edificios_Guias', guiasParts),
    rx.folderXml('Edificios_3D', []),
    rx.folderXml('Props_3D', []),
  ]);

  const spawnsFolder = rx.folderXml('Spawns', spawnItems);
  const rootFolder = rx.folderXml('CalFight_Ciudad_Import', [mapFolder, spawnsFolder]);

  return {
    xml: rx.wrapDocument([rootFolder]),
    counts: {
      suelo: sueloParts.length,
      plaza: plazaParts.length,
      calles: callesParts.length,
      interiores: interioresParts.length,
      parques: parquesParts.length,
      letreros: letrerosParts.length,
      trees: treeModels.length,
      playa: playaParts.length,
      ascensores: ascensoresParts.length,
      colisiones: colisionesParts.length,
      guias: guiasParts.length,
      spawns: spawnItems.length,
    },
  };
}

// ============================================================
// 4. Generadores de scripts Luau y guia LEEME_ROBLOX.md
// ============================================================
function buildColocarEdificiosLuau({ exp, modelExportMeta }) {
  const bCount = exp.CITY_PLAN.filter(b => b.model).length;
  const pCount = exp.PR.length;
  const lines = [];
  lines.push('-- ==============================================================================');
  lines.push('-- ColocarEdificios.luau — Instalador automatico en Command Bar (Roblox Studio)');
  lines.push(`-- Borra el mapa viejo del Battlegrounds, instala el mapa base de CalFight,`);
  lines.push(`-- reemplaza los spawns, instala el ascensor y coloca ${bCount} edificios + ${pCount} props.`);
  lines.push('--');
  lines.push('-- USO:');
  lines.push('--   1. Inserta CalFight_Ciudad_Base.rbxmx en Workspace.');
  lines.push('--   2. Crea la carpeta ReplicatedStorage.CiudadModelos e importa ahi los .obj');
  lines.push('--      de roblox_ciudad/modelos_obj/ (Import 3D).');
  lines.push('--   3. Pega TODO este script en View -> Command Bar en Roblox Studio y pulsa Enter.');
  lines.push('-- ==============================================================================');
  lines.push('');
  lines.push('local ReplicatedStorage = game:GetService("ReplicatedStorage")');
  lines.push('local ServerScriptService = game:GetService("ServerScriptService")');
  lines.push('local Workspace = game:GetService("Workspace")');
  lines.push('local ChangeHistoryService = game:GetService("ChangeHistoryService")');
  lines.push('');
  lines.push(`local SCALE = ${SCALE}`);
  lines.push('');
  lines.push('ChangeHistoryService:SetWaypoint("CalFight_Antes_Instalar")');
  lines.push('');
  lines.push('local importRoot = Workspace:FindFirstChild("CalFight_Ciudad_Import")');
  lines.push('local mapFolder = Workspace:FindFirstChild("Map")');
  lines.push('if not mapFolder then');
  lines.push('\tmapFolder = Instance.new("Folder")');
  lines.push('\tmapFolder.Name = "Map"');
  lines.push('\tmapFolder.Parent = Workspace');
  lines.push('end');
  lines.push('');
  lines.push('-- Si existe CalFight_Ciudad_Import, borramos el mapa viejo de Battlegrounds y movemos CalFight dentro de Workspace.Map');
  lines.push('if importRoot then');
  lines.push('\tlocal keepInMap = { Throwables = true, ["Emote Anims"] = true }');
  lines.push('\tlocal removedOld = 0');
  lines.push('\tfor _, child in ipairs(mapFolder:GetChildren()) do');
  lines.push('\t\tif not keepInMap[child.Name] then');
  lines.push('\t\t\tchild:Destroy()');
  lines.push('\t\t\tremovedOld += 1');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('\tlocal srcMap = importRoot:FindFirstChild("Map")');
  lines.push('\tif srcMap then');
  lines.push('\t\tfor _, sub in ipairs(srcMap:GetChildren()) do');
  lines.push('\t\t\tsub.Parent = mapFolder');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('\t-- Reemplazar spawns en Workspace.Miscellaneous.Spawns (si existe) o Workspace.Spawns');
  lines.push('\tlocal srcSpawns = importRoot:FindFirstChild("Spawns")');
  lines.push('\tif srcSpawns then');
  lines.push('\t\tlocal misc = Workspace:FindFirstChild("Miscellaneous")');
  lines.push('\t\tlocal dstSpawns = misc and misc:FindFirstChild("Spawns")');
  lines.push('\t\tif dstSpawns then');
  lines.push('\t\t\tdstSpawns:ClearAllChildren()');
  lines.push('\t\t\tfor _, sp in ipairs(srcSpawns:GetChildren()) do sp.Parent = dstSpawns end');
  lines.push('\t\t\tsrcSpawns:Destroy()');
  lines.push('\t\telse');
  lines.push('\t\t\tsrcSpawns.Parent = Workspace');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('\timportRoot:Destroy()');
  lines.push('\tprint(string.format("[CalFight] Mapa viejo borrado (%d elementos) y mapa base + 44 spawns de CalFight instalados!", removedOld))');
  lines.push('end');
  lines.push('');
  lines.push('-- Instalar automaticamente el Script del ascensor de Torre Aurora');
  lines.push('local existingElev = ServerScriptService:FindFirstChild("AscensorTorreAurora")');
  lines.push('if not existingElev then');
  lines.push('\tlocal scr = Instance.new("Script")');
  lines.push('\tscr.Name = "AscensorTorreAurora"');
  lines.push('\tlocal okSrc = pcall(function()');
  lines.push('\t\tscr.Source = [[' + buildAscensorLuau().replace(/\]\]/g, '] ]') + ']]');
  lines.push('\tend)');
  lines.push('\tscr.Parent = ServerScriptService');
  lines.push('\tif okSrc then print("[CalFight] Script AscensorTorreAurora instalado en ServerScriptService.") end');
  lines.push('end');
  lines.push('');
  lines.push('local modelsSrc = ReplicatedStorage:FindFirstChild("CiudadModelos") or Workspace:FindFirstChild("CiudadModelos")');
  lines.push('if not modelsSrc then');
  lines.push('\tmodelsSrc = Instance.new("Folder")');
  lines.push('\tmodelsSrc.Name = "CiudadModelos"');
  lines.push('\tmodelsSrc.Parent = ReplicatedStorage');
  lines.push('\twarn("[CalFight] Se creo ReplicatedStorage.CiudadModelos vacia. Importa ahi los .obj de modelos_obj/ y vuelve a ejecutar este script.")');
  lines.push('\tChangeHistoryService:SetWaypoint("CalFight_Base_Instalada")');
  lines.push('\treturn');
  lines.push('end');
  lines.push('');
  lines.push('local outEdificios = mapFolder:FindFirstChild("Edificios_3D") or Instance.new("Folder")');
  lines.push('outEdificios.Name = "Edificios_3D"');
  lines.push('outEdificios.Parent = mapFolder');
  lines.push('');
  lines.push('local outProps = mapFolder:FindFirstChild("Props_3D") or Instance.new("Folder")');
  lines.push('outProps.Name = "Props_3D"');
  lines.push('outProps.Parent = mapFolder');
  lines.push('');
  lines.push('local MODEL_PARTS = {');
  for (const [mName, meta] of Object.entries(modelExportMeta)) {
    lines.push(`\t["${mName}"] = {`);
    for (const p of meta.parts) {
      lines.push(`\t\t{ stem = "${p.partStem}", size = Vector3.new(${p.size.join(', ')}), center = Vector3.new(${p.center.join(', ')}) },`);
    }
    lines.push(`\t},`);
  }
  lines.push('}');
  lines.push('');
  lines.push('local BUILDINGS = {');
  exp.CITY_PLAN.forEach((b, i) => {
    if (!b.model) return;
    const yaw = b.z < 0 ? 0 : Math.PI;
    const hasCols = true; // Todos los edificios tienen colisiones en Edificios_Colisiones
    lines.push(`\t{ idx = ${i + 1}, model = "${b.model}", label = ${JSON.stringify(b.label || b.model)}, x = ${b.x}, y = 0, z = ${b.z}, ry = ${yaw.toFixed(6)}, scale = Vector3.new(1, 1, 1), hasCol = ${hasCols} },`);
  });
  lines.push('}');
  lines.push('');
  lines.push('local PROPS = {');
  exp.PR.forEach((pr, i) => {
    const sx = pr.m === 'muelle' ? 1.6 : 1;
    const sz = pr.m === 'muelle' ? 1.7 : 1;
    const smallNoCol = ['sombrilla_roja', 'sombrilla_azul', 'sombrilla_amarilla', 'sombrilla_verde', 'castillo'].includes(pr.m);
    lines.push(`\t{ idx = ${i + 1}, model = "${pr.m}", x = ${pr.x.toFixed(4)}, y = ${(pr.y || 0).toFixed(4)}, z = ${pr.z.toFixed(4)}, ry = ${(pr.ry || 0).toFixed(6)}, scale = Vector3.new(${sx}, 1, ${sz}), forceNoCol = ${smallNoCol} },`);
  });
  lines.push('}');
  lines.push('');
  lines.push('local function normalizeKey(s)');
  lines.push('\treturn (string.lower(s)):gsub("%.obj$", ""):gsub("%s+", "")');
  lines.push('end');
  lines.push('');
  lines.push('-- Construye indice por nombre de cualquier Model/MeshPart dentro de CiudadModelos');
  lines.push('local lookup = {}');
  lines.push('for _, child in ipairs(modelsSrc:GetChildren()) do');
  lines.push('\tlookup[normalizeKey(child.Name)] = child');
  lines.push('\t-- Si Import 3D agrupo multiples .obj bajo un Model general, indexamos sus MeshParts hijos tambien');
  lines.push('\tif child:IsA("Model") then');
  lines.push('\t\tfor _, desc in ipairs(child:GetDescendants()) do');
  lines.push('\t\t\tif desc:IsA("MeshPart") then');
  lines.push('\t\t\t\tlocal k = normalizeKey(desc.Name)');
  lines.push('\t\t\t\tif not lookup[k] then lookup[k] = desc end');
  lines.push('\t\t\tend');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('end');
  lines.push('');
  lines.push('local function cloneAndPrepare(stem, expectedSize, scaleVec, canCollide)');
  lines.push('\tlocal src = lookup[normalizeKey(stem)]');
  lines.push('\tif not src then return nil end');
  lines.push('\tlocal inst = src:Clone()');
  lines.push('\t-- Calcular BoundingBox actual para auto-ajustar unidad de importacion (Stud vs Metro vs Cm)');
  lines.push('\tlocal actualSize');
  lines.push('\tif inst:IsA("BasePart") then');
  lines.push('\t\tactualSize = inst.Size');
  lines.push('\telseif inst:IsA("Model") then');
  lines.push('\t\tlocal _, sz = inst:GetBoundingBox()');
  lines.push('\t\tactualSize = sz');
  lines.push('\telse');
  lines.push('\t\tinst:Destroy()');
  lines.push('\t\treturn nil');
  lines.push('\tend');
  lines.push('\tlocal maxExp = math.max(expectedSize.X, expectedSize.Y, expectedSize.Z, 0.01)');
  lines.push('\tlocal maxAct = math.max(actualSize.X, actualSize.Y, actualSize.Z, 0.0001)');
  lines.push('\tlocal ratio = maxExp / maxAct');
  lines.push('\tlocal needUnitFix = math.abs(ratio - 1) > 0.03');
  lines.push('');
  lines.push('\tlocal function applyPartProps(p)');
  lines.push('\t\tp.Anchored = true');
  lines.push('\t\tp.CanCollide = canCollide');
  lines.push('\t\tif needUnitFix then');
  lines.push('\t\t\tp.Size = Vector3.new(p.Size.X * ratio * scaleVec.X, p.Size.Y * ratio * scaleVec.Y, p.Size.Z * ratio * scaleVec.Z)');
  lines.push('\t\telse');
  lines.push('\t\t\tp.Size = Vector3.new(p.Size.X * scaleVec.X, p.Size.Y * scaleVec.Y, p.Size.Z * scaleVec.Z)');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('');
  lines.push('\tif inst:IsA("BasePart") then');
  lines.push('\t\tapplyPartProps(inst)');
  lines.push('\telse');
  lines.push('\t\t-- Si es un Model con sub-mallas, primero ajustamos escala proporcional manteniendo posiciones relativas');
  lines.push('\t\tif needUnitFix then');
  lines.push('\t\t\tinst:ScaleTo(inst:GetScale() * ratio)');
  lines.push('\t\tend');
  lines.push('\t\tlocal piv = inst:GetPivot()');
  lines.push('\t\tfor _, d in ipairs(inst:GetDescendants()) do');
  lines.push('\t\t\tif d:IsA("BasePart") then');
  lines.push('\t\t\t\td.Anchored = true');
  lines.push('\t\t\t\td.CanCollide = canCollide');
  lines.push('\t\t\t\tif scaleVec ~= Vector3.new(1, 1, 1) then');
  lines.push('\t\t\t\t\tlocal rel = piv:PointToObjectSpace(d.Position)');
  lines.push('\t\t\t\t\tlocal rotOnly = d.CFrame - d.Position');
  lines.push('\t\t\t\t\td.Size = Vector3.new(d.Size.X * scaleVec.X, d.Size.Y * scaleVec.Y, d.Size.Z * scaleVec.Z)');
  lines.push('\t\t\t\t\td.CFrame = piv * CFrame.new(rel.X * scaleVec.X, rel.Y * scaleVec.Y, rel.Z * scaleVec.Z) * (piv - piv.Position):Inverse() * rotOnly');
  lines.push('\t\t\t\tend');
  lines.push('\t\t\tend');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('\treturn inst');
  lines.push('end');
  lines.push('');
  lines.push('local function placeItem(entry, destFolder, prefix)');
  lines.push('\tlocal partsDef = MODEL_PARTS[entry.model]');
  lines.push('\tif not partsDef then return false, "sin metadata" end');
  lines.push('');
  lines.push('\tlocal baseCF = CFrame.new(entry.x * SCALE, entry.y * SCALE, entry.z * SCALE) * CFrame.Angles(0, entry.ry, 0)');
  lines.push('\tlocal mdl = Instance.new("Model")');
  lines.push('\tmdl.Name = string.format("%s_%d_%s", prefix, entry.idx, entry.label or entry.model)');
  lines.push('');
  lines.push('\tlocal canCol = not (entry.hasCol or entry.forceNoCol)');
  lines.push('\tlocal placedAny = false');
  lines.push('\tlocal missingStems = {}');
  lines.push('');
  lines.push('\tfor _, pDef in ipairs(partsDef) do');
  lines.push('\t\tlocal inst = cloneAndPrepare(pDef.stem, pDef.size, entry.scale, canCol)');
  lines.push('\t\tif inst then');
  lines.push('\t\t\tlocal offset = Vector3.new(pDef.center.X * entry.scale.X, pDef.center.Y * entry.scale.Y, pDef.center.Z * entry.scale.Z)');
  lines.push('\t\t\tlocal targetCF = baseCF * CFrame.new(offset)');
  lines.push('\t\t\tif inst:IsA("BasePart") then');
  lines.push('\t\t\t\tinst.CFrame = targetCF');
  lines.push('\t\t\telse');
  lines.push('\t\t\t\t-- Centrar la BoundingBox del Model importado sobre targetCF');
  lines.push('\t\t\t\tlocal bbCF, _ = inst:GetBoundingBox()');
  lines.push('\t\t\t\tlocal delta = inst:GetPivot():ToObjectSpace(bbCF)');
  lines.push('\t\t\t\tinst:PivotTo(targetCF * delta:Inverse())');
  lines.push('\t\t\tend');
  lines.push('\t\t\tinst.Parent = mdl');
  lines.push('\t\t\tplacedAny = true');
  lines.push('\t\telse');
  lines.push('\t\t\ttable.insert(missingStems, pDef.stem)');
  lines.push('\t\tend');
  lines.push('\tend');
  lines.push('');
  lines.push('\tif placedAny then');
  lines.push('\t\tmdl.Parent = destFolder');
  lines.push('\t\treturn true, (#missingStems > 0 and table.concat(missingStems, ",") or nil)');
  lines.push('\telse');
  lines.push('\t\tmdl:Destroy()');
  lines.push('\t\treturn false, table.concat(missingStems, ",")');
  lines.push('\tend');
  lines.push('end');
  lines.push('');
  lines.push('ChangeHistoryService:SetWaypoint("CalFight_Antes_ColocarEdificios")');
  lines.push('outEdificios:ClearAllChildren()');
  lines.push('outProps:ClearAllChildren()');
  lines.push('');
  lines.push('local okB, okP, missing = 0, 0, {}');
  lines.push('local guiasFolder = mapFolder:FindFirstChild("Edificios_Guias")');
  lines.push('');
  lines.push('for _, b in ipairs(BUILDINGS) do');
  lines.push('\tlocal ok, miss = placeItem(b, outEdificios, "Edificio")');
  lines.push('\tif ok then');
  lines.push('\t\tokB += 1');
  lines.push('\t\tif guiasFolder then');
  lines.push('\t\t\tlocal g = guiasFolder:FindFirstChild("Guia_" .. b.model .. "_" .. b.idx)');
  lines.push('\t\t\tif g then g:Destroy() end');
  lines.push('\t\tend');
  lines.push('\telseif miss then');
  lines.push('\t\tmissing[miss] = true');
  lines.push('\tend');
  lines.push('end');
  lines.push('');
  lines.push('for _, pr in ipairs(PROPS) do');
  lines.push('\tlocal ok, miss = placeItem(pr, outProps, "Prop")');
  lines.push('\tif ok then');
  lines.push('\t\tokP += 1');
  lines.push('\t\tif guiasFolder then');
  lines.push('\t\t\tlocal g = guiasFolder:FindFirstChild("GuiaProp_" .. pr.model .. "_" .. pr.idx)');
  lines.push('\t\t\tif g then g:Destroy() end');
  lines.push('\t\tend');
  lines.push('\telseif miss then');
  lines.push('\t\tmissing[miss] = true');
  lines.push('\tend');
  lines.push('end');
  lines.push('');
  lines.push('local missList = {}');
  lines.push('for k in pairs(missing) do table.insert(missList, k) end');
  lines.push('table.sort(missList)');
  lines.push('');
  lines.push('ChangeHistoryService:SetWaypoint("CalFight_Despues_ColocarEdificios")');
  lines.push('print(string.format("[CalFight] Edificios colocados: %d/%d | Props costa colocados: %d/%d", okB, #BUILDINGS, okP, #PROPS))');
  lines.push('if #missList > 0 then');
  lines.push('\twarn("[CalFight] Faltan los siguientes .obj en CiudadModelos: " .. table.concat(missList, ", "))');
  lines.push('else');
  lines.push('\tprint("[CalFight] TODOS los modelos 3D fueron colocados correctamente!")');
  lines.push('\tif guiasFolder and #guiasFolder:GetChildren() == 0 then guiasFolder:Destroy() end');
  lines.push('end');
  lines.push('');

  return lines.join('\n');
}

function buildAscensorLuau() {
  return `-- ==============================================================================
-- AscensorTorreAurora.luau — Script de Servidor (ServerScriptService)
-- Activa las plataformas cian de Torre Aurora para subir a la azotea y bajar.
-- ==============================================================================

local Workspace = game:GetService("Workspace")
local Players = game:GetService("Players")

local function findAscensores()
\tlocal imp = Workspace:FindFirstChild("CalFight_Ciudad_Import")
\tlocal m = (imp and imp:FindFirstChild("Map")) or Workspace:FindFirstChild("Map")
\treturn m and m:FindFirstChild("Ascensores")
end

local folder = findAscensores()
if not folder then
\twarn("[AscensorTorreAurora] No se encontro la carpeta Map.Ascensores")
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

\t\t-- Teletransporta un paso delante/encima de la plataforma destino
\t\troot.CFrame = dstPad.CFrame + Vector3.new(0, 4.5, 0)
\tend)
end

connectPad(padSubir, padBajar)
connectPad(padBajar, padSubir)
print("[CalFight] Ascensor de Torre Aurora activo.")
`;
}

function buildReadme({ counts, stats, modelNames, bCount, pCount }) {
  return `# CalFight -> Roblox Studio (Ciudad Aurora)

Este paquete exporta el **mapa completo de Ciudad Aurora** (calles, plaza, parques, arboles destructibles, farolas, mobiliario, interiores de los 9 locales accesibles, carteleria, 44 puntos de aparicion, paseo maritimo, playa curva, muelle, mar, colisiones exactas y los ${stats.models} modelos 3D de Blockbench) listo para integrar en tu proyecto Battlegrounds (\`bat.rbxl\`).

---

## Archivos generados

- \`CalFight_Ciudad_Base.rbxmx\`: Estructura completa de la ciudad para Roblox Studio:
  - \`Map/Suelo\` (${counts.suelo} base verde), \`Map/Plaza\` (${counts.plaza} piezas), \`Map/Avenidas_y_Calles\` (${counts.calles} piezas), \`Map/Interiores_Muebles\` (${counts.interiores} piezas), \`Map/Parques_y_Mobiliario\` (${counts.parques} piezas), \`Map/Letreros\` (${counts.letreros} carteles con \`SurfaceGui\`), \`Map/Trees\` (${counts.trees} \`Model\` con \`TreeRoot\` compatibles con \`DestroyAmbient\` de \`bat.rbxl\`), \`Map/Playa_y_Mar\` (${counts.playa} tramos de arena curva, arena mojada, mar y fondo marino), \`Map/Ascensores\` (${counts.ascensores} plataformas), \`Map/Edificios_Colisiones\` (${counts.colisiones} colisionadores invisibles exactos incluyendo puertas abiertas y cubierta del muelle), \`Map/Edificios_Guias\` (${counts.guias} guias temporales).
  - \`Spawns\` (${counts.spawns} \`SpawnLocation\`, de \`Spawn1\` a \`Spawn44\`).
- \`modelos_obj/\`: ${stats.objFiles} archivos \`.obj\` + \`.mtl\` + ${stats.pngFiles} texturas \`.png\` deduplicadas (${stats.totalTris.toLocaleString('es-ES')} triangulos totales).
  - Nota: Los edificios grandes que superan el limite de 20,000 triangulos por malla de Roblox (\`torre_aurora\`, \`torre_residencial_naranja\`, \`torre_residencial_salvia\`) fueron divididos automaticamente en partes \`_p1.obj\`, \`_p2.obj\`, etc. compartiendo exactamente el mismo origen.
- \`ColocarEdificios.luau\`: Script para la **Command Bar** de Roblox Studio que coloca y alinea automaticamente todos los edificios y adornos de la costa.
- \`AscensorTorreAurora.luau\`: \`Script\` opcional para \`ServerScriptService\` que activa las plataformas de teletransporte planta baja <-> azotea de **Torre Aurora**.

---

## Paso a paso para meterlo en \`bat.rbxl\` (Roblox Studio)

### Paso 1: Abrir \`bat.rbxl\` e insertar el mapa de CalFight
1. Abre tu lugar \`bat.rbxl\` en **Roblox Studio**.
2. En el panel **Explorer**, haz clic derecho sobre \`Workspace\` -> **Insert from File...** y elige:
   \`f:\\blockstrike\\roblox_ciudad\\CalFight_Ciudad_Base.rbxmx\`
   *(No borres nada manualmente: el script del Paso 3 se encarga de borrar el mapa viejo de Battlegrounds y ordenar todo por ti).*

### Paso 2: Importar los modelos 3D (\`.obj\`)
1. En el panel **Explorer**, crea una carpeta \`Folder\` dentro de **\`ReplicatedStorage\`** llamada exactamente:
   **\`CiudadModelos\`**
2. En **Home / View -> Asset Manager** (o **File -> Import 3D**), importa los archivos \`.obj\` de \`f:\\blockstrike\\roblox_ciudad\\modelos_obj\\\` (${stats.objFiles} archivos) y metelos dentro de \`ReplicatedStorage.CiudadModelos\`.
   - \`Scale Unit\`: **\`Stud\`** (aunque el script auto-corrige si quedara en otra unidad).
   - \`Anchored\`: activado.
   - Puedes importarlos en 2 o 3 tandas conservando sus nombres (\`cafe\`, \`torre_aurora_p1\`, \`torre_aurora_p2\`, \`muelle\`, \`palmera\`, etc.).

### Paso 3: Instalacion automatica en 1 clic
1. Abre **View -> Command Bar**.
2. Abre \`ColocarEdificios.luau\`, copia TODO, pegalo en la **Command Bar** y pulsa **Enter**.
3. En un segundo el script hara **todo automaticamente**:
   - Borra el mapa viejo dentro de \`Workspace.Map\` (conservando \`Throwables\` y \`Emote Anims\`).
   - Instala calles, plaza, playa, mar, 221 arboles destructibles (\`Trees\`), interiores, letreros y 513 colisiones dentro de \`Workspace.Map\`.
   - Borra \`Spawn1\`/\`Spawn2\` y coloca los **44 spawns** de CalFight en \`Workspace.Miscellaneous.Spawns\`.
   - Crea \`ServerScriptService.AscensorTorreAurora\` para el ascensor de Torre Aurora.
   - Coloca los **${bCount} edificios** y **${pCount} adornos de costa** en su lugar exacto.
4. En **Output** saldra: \`[CalFight] Edificios colocados: ${bCount}/${bCount} | Props costa colocados: ${pCount}/${pCount}\`. Dale a **Play (F5)**!

---

## Modelos Blockbench exportados (${modelNames.length})
${modelNames.map(n => `- \`${n}\``).join('\n')}
`;
}

// ============================================================
// Ejecucion principal
// ============================================================
async function main() {
  ensureDir(OUT_DIR);
  ensureDir(OBJ_DIR);

  console.log('1/4 Ejecutando generador de ciudad desde js/game.js...');
  const { exp, SIGNS } = await runGameCityExtraction();

  const usedModels = new Set();
  for (const b of exp.CITY_PLAN) if (b.model) usedModels.add(b.model);
  for (const p of exp.PR) if (p.m) usedModels.add(p.m);
  const modelNames = [...usedModels].sort();

  console.log(`2/4 Exportando ${modelNames.length} modelos .bbmodel -> .obj/.mtl/.png (escala ${SCALE} studs)...`);
  const { modelExportMeta, stats } = exportAllBBModels(modelNames);

  console.log('3/4 Construyendo CalFight_Ciudad_Base.rbxmx...');
  const { xml, counts } = buildRbxmx({ exp, SIGNS, modelExportMeta });
  fs.writeFileSync(path.join(OUT_DIR, 'CalFight_Ciudad_Base.rbxmx'), xml, 'utf8');

  console.log('4/4 Escribiendo scripts Luau y guia...');
  const bCount = exp.CITY_PLAN.filter(b => b.model).length;
  const pCount = exp.PR.length;
  fs.writeFileSync(path.join(OUT_DIR, 'ColocarEdificios.luau'), buildColocarEdificiosLuau({ exp, modelExportMeta }), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'AscensorTorreAurora.luau'), buildAscensorLuau(), 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'LEEME_ROBLOX.md'), buildReadme({ counts, stats, modelNames, bCount, pCount }), 'utf8');

  console.log('\nExportacion completada en:', OUT_DIR);
  console.log('Modelos:', stats.models, '| OBJ:', stats.objFiles, '| PNGs unicas:', stats.pngFiles, '| Triangulos:', stats.totalTris);
  if (stats.splitModels.length > 0) {
    console.log('Divididos (<=16k tris/parte):', stats.splitModels.map(s => `${s.name}(${s.parts})`).join(', '));
  }
  console.log('RBXMX elementos:', counts);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
