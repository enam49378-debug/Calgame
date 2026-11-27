// Mejoras arquitectónicas de Ciudad Aurora + Props Urbanos con Física 3D Interactiva.
// Se carga como módulo-fábrica desde js/game.js: CF_MUNDO.crearCiudadPro(D)
window.CF_MUNDO = window.CF_MUNDO || {};

window.CF_MUNDO.crearCiudadPro = function crearCiudadPro(D) {
  'use strict';
  const {
    V3, TAU, rand, clamp, scene, camera, CITY, CITY_PLAN, groundAt, pixTex,
    cityAnimeMaterial, addPropCull, emit, burst, sfx, G
  } = D;

  const PROPS = [];
  const GEYSERS = [];
  const SPINNERS = [];      // aspas de aire acondicionado en azoteas
  const BLINKERS = [];      // luces rojas de antenas en torres altas
  const TRAFFIC = [];       // semáforos con ciclo verde/amarillo/rojo
  const FOUNTAIN_FX = { t: 0 };

  const _tmpV = new V3();
  const _grav = -28;

  // Materiales reutilizados (bajo costo de draw calls / memoria)
  const matCache = new Map();
  function getMat(col, opts) {
    const key = col + '|' + (opts ? JSON.stringify(opts) : '');
    if (matCache.has(key)) return matCache.get(key);
    const m = new THREE.MeshLambertMaterial(Object.assign({ color: col }, opts || {}));
    if (!opts || !opts.noAnime) cityAnimeMaterial(m);
    matCache.set(key, m);
    return m;
  }

  function makeBox(parent, w, h, d, col, x, y, z, opts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), getMat(col, opts));
    mesh.position.set(x, y, z);
    mesh.castShadow = !!(opts && opts.shadow);
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function insideAnyBuilding(x, z, pad = 0.85) {
    for (const b of CITY_PLAN) {
      if (Math.abs(x - b.x) < b.w * 0.5 + pad && Math.abs(z - b.z) < b.d * 0.5 + pad) return b;
    }
    return null;
  }

  // =========================================================================
  // 1. MEJORAS ARQUITECTÓNICAS EN EDIFICIOS (azoteas, neones, máquinas, luces)
  // =========================================================================
  function makeNeonSign(text, bg, fg, accent, x, y, z, ry, w = 1.1, h = 3.2) {
    const tex = pixTex(96, 256, g => {
      g.fillStyle = bg; g.fillRect(0, 0, 96, 256);
      g.strokeStyle = accent; g.lineWidth = 8; g.strokeRect(4, 4, 88, 248);
      g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(12, 12, 72, 232);
      g.fillStyle = fg;
      g.font = 'bold 30px sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const chars = text.replace(/\s+/g, '').slice(0, 7).split('');
      const step = 216 / Math.max(1, chars.length);
      chars.forEach((ch, i) => g.fillText(ch, 48, 22 + step * (i + 0.5)));
    });
    const mat = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.45, side: THREE.DoubleSide });
    cityAnimeMaterial(mat);
    CITY.signMaterials.push(mat);

    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.16), mat);
    grp.add(panel);
    // Soportes metálicos al muro
    makeBox(grp, 0.35, 0.1, 0.12, '#354350', -w * 0.5 - 0.15, h * 0.35, 0);
    makeBox(grp, 0.35, 0.1, 0.12, '#354350', -w * 0.5 - 0.15, -h * 0.35, 0);
    grp.updateMatrixWorld(true);
    scene.add(grp);
    addPropCull(grp, x, y, z, h * 0.8 + 1, 1.05);
  }

  function addRoofAC(x, y, z, ry) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    makeBox(grp, 1.35, 0.85, 0.72, '#cfd6dc', 0, 0.425, 0);
    makeBox(grp, 1.42, 0.08, 0.78, '#9aa6b2', 0, 0.86, 0);
    makeBox(grp, 0.58, 0.58, 0.08, '#28323c', -0.22, 0.43, 0.35);
    // Aspa del ventilador que gira lentamente
    const fan = new THREE.Group();
    fan.position.set(-0.22, 0.43, 0.40);
    makeBox(fan, 0.46, 0.1, 0.03, '#6e7e8c', 0, 0, 0);
    makeBox(fan, 0.1, 0.46, 0.03, '#6e7e8c', 0, 0, 0);
    grp.add(fan);
    SPINNERS.push(fan);
    scene.add(grp);
    addPropCull(grp, x, y + 0.5, z, 2.2, 0.85);
  }

  function addWaterTank(x, y, z) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    // 4 patas metálicas
    for (const sx of [-0.65, 0.65]) for (const sz of [-0.65, 0.65]) {
      makeBox(grp, 0.12, 1.1, 0.12, '#495866', sx, 0.55, sz);
    }
    makeBox(grp, 1.5, 0.12, 1.5, '#596a78', 0, 1.1, 0);
    // Tanque cilíndrico (octogonal estilo voxel/anime)
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 1.75, 10), getMat('#c7d1d8'));
    cyl.position.y = 2.0;
    grp.add(cyl);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.84, 0.55, 10), getMat('#5a7585'));
    roof.position.y = 3.12;
    grp.add(roof);
    scene.add(grp);
    addPropCull(grp, x, y + 1.8, z, 3.2, 1.0);
  }

  function addRoofAntenna(x, y, z, height = 4.2) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    makeBox(grp, 0.55, 0.3, 0.55, '#465460', 0, 0.15, 0);
    makeBox(grp, 0.1, height, 0.1, '#8b9aa6', 0, height * 0.5, 0);
    makeBox(grp, 1.1, 0.07, 0.07, '#9aa8b3', 0, height * 0.68, 0);
    makeBox(grp, 0.7, 0.07, 0.07, '#9aa8b3', 0, height * 0.84, 0);
    const bulbMat = new THREE.MeshLambertMaterial({ color: '#ff3b4e', emissive: '#ff2038', emissiveIntensity: 1.4 });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), bulbMat);
    bulb.position.y = height + 0.12;
    grp.add(bulb);
    BLINKERS.push({ mat: bulbMat, phase: (x * 0.37 + z * 0.19) % TAU });
    scene.add(grp);
    addPropCull(grp, x, y + height * 0.5, z, height + 1, 1.4);
  }

  function addVendingMachine(x, y, z, ry, bodyCol, glowCol) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    makeBox(grp, 1.05, 1.95, 0.72, bodyCol, 0, 0.975, 0, { shadow: true });
    // Vitrina iluminada con botellitas de colores
    const tex = pixTex(48, 64, g => {
      g.fillStyle = '#e8f9ff'; g.fillRect(0, 0, 48, 64);
      const cols = ['#ff5c77', '#ffd166', '#4cc9f0', '#7ae582', '#ff9f1c', '#b388ff'];
      for (let row = 0; row < 3; row++) {
        g.fillStyle = '#293545'; g.fillRect(2, 17 + row * 19, 44, 3);
        for (let c = 0; c < 6; c++) {
          g.fillStyle = cols[(row * 3 + c) % cols.length];
          g.fillRect(4 + c * 7, 5 + row * 19, 5, 12);
        }
      }
    });
    const vitMat = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color(glowCol), emissiveIntensity: 0.55 });
    cityAnimeMaterial(vitMat);
    CITY.signMaterials.push(vitMat);
    const vit = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 1.05), vitMat);
    vit.position.set(0, 1.28, 0.368);
    grp.add(vit);
    // Ranura de retiro
    makeBox(grp, 0.72, 0.32, 0.06, '#1f2833', 0, 0.38, 0.35);
    scene.add(grp);
    addPropCull(grp, x, y + 1, z, 2.2, 0.85);
  }

  function addTrafficLight(x, z, ry) {
    const grp = new THREE.Group();
    grp.position.set(x, 0, z);
    grp.rotation.y = ry;
    makeBox(grp, 0.18, 4.7, 0.18, '#3a4956', 0, 2.35, 0, { shadow: true });
    makeBox(grp, 0.34, 0.24, 0.34, '#2a3642', 0, 0.12, 0);
    // Brazo horizontal hacia la calle
    makeBox(grp, 1.55, 0.14, 0.14, '#3a4956', 0.72, 4.45, 0);
    // Caja del semáforo
    makeBox(grp, 0.42, 1.12, 0.32, '#1f2832', 1.35, 4.25, 0);
    const mkLamp = (dy, col) => {
      const m = new THREE.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.1 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.08), m);
      mesh.position.set(1.35, 4.25 + dy, 0.15);
      grp.add(mesh);
      return m;
    };
    const r = mkLamp(0.32, '#ff384c');
    const y = mkLamp(0.0, '#ffd147');
    const g = mkLamp(-0.32, '#3df58b');
    TRAFFIC.push({ r, y, g, axis: Math.abs(Math.sin(ry)) > 0.5 ? 1 : 0 });
    scene.add(grp);
    addPropCull(grp, x, 2.5, z, 3.2, 0.95);
  }

  function addStringLights(ax, ay, az, bx, by, bz, count = 8, colors = ['#ffe79e', '#ffb685', '#9ee6ff', '#ff9ec4']) {
    const grp = new THREE.Group();
    const a = new V3(ax, ay, az), b = new V3(bx, by, bz);
    const dist = a.distanceTo(b);
    // Cable ligeramente combado en segmentos
    for (let i = 0; i < count; i++) {
      const t0 = i / count, t1 = (i + 1) / count, tm = (t0 + t1) * 0.5;
      const p0 = new V3().lerpVectors(a, b, t0); p0.y -= Math.sin(t0 * Math.PI) * 0.55;
      const p1 = new V3().lerpVectors(a, b, t1); p1.y -= Math.sin(t1 * Math.PI) * 0.55;
      const pm = new V3().lerpVectors(a, b, tm); pm.y -= Math.sin(tm * Math.PI) * 0.55;
      const segLen = p0.distanceTo(p1);
      const wire = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, segLen), getMat('#2c3642'));
      wire.position.copy(pm);
      wire.lookAt(p1);
      grp.add(wire);

      if (i > 0) {
        const c = colors[i % colors.length];
        const lMat = new THREE.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.7 });
        CITY.lampMaterials.push(lMat);
        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), lMat);
        bulb.position.copy(p0);
        bulb.position.y -= 0.14;
        grp.add(bulb);
      }
    }
    scene.add(grp);
    addPropCull(grp, (ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5, dist * 0.6 + 2, 0.9);
  }

  function decorateArchitecture() {
    // 1. Azoteas y detalles en cada edificio de CITY_PLAN
    const neonSpec = {
      'CAFÉ LUNA':   ['CAFÉ',    '#1c2c38', '#ffe9a8', '#52d1dc'],
      'ARCADE':      ['ARCADE',  '#261233', '#ff70d9', '#4de8ff'],
      'MERCADO':     ['MARKET',  '#14332a', '#baffc9', '#4fe3a5'],
      'RAMEN':       ['RAMEN',   '#381414', '#ffe0a3', '#ff5b45'],
      'LIBROS':      ['LIBROS',  '#241d38', '#e8d7ff', '#a882ff'],
      'TALLER':      ['TALLER',  '#1f2b1e', '#d9ff8f', '#89e048'],
      'GIMNASIO':    ['GYM',     '#361920', '#ffd1dc', '#ff647f'],
      'MUSEO':       ['MUSEO',   '#222c38', '#fff0c2', '#e0b85c'],
      'CASINO AURORA': ['CASINO', '#2c112e', '#ffe478', '#ff5cc8']
    };

    CITY_PLAN.forEach((b, idx) => {
      if (!b || !b.h) return;
      const face = b.z < 0 ? 1 : -1;
      const topY = b.h + 0.04;

      // Los .bbmodel ya traen sus azoteas rediseñadas (pérgolas, cúpulas, tanques, AC);
      // aquí solo ponemos balizas parpadeantes en torres altas y neones verticales laterales.
      if (b.label === 'TORRE AURORA') {
        addRoofAntenna(b.x - b.w * 0.36, b.h + 0.2, b.z - b.d * 0.34, 6.2);
        addRoofAntenna(b.x + b.w * 0.36, b.h + 0.2, b.z - b.d * 0.34, 6.2);
      } else if (b.h >= 16) {
        addRoofAntenna(b.x + (idx % 2 === 0 ? 1 : -1) * Math.max(1.0, b.w * 0.25), topY, b.z - face * Math.max(1.0, b.d * 0.25), 3.8);
      }

      // Carteles neón verticales en locales con nombre
      const ns = b.label && neonSpec[b.label];
      if (ns) {
        const sx = b.x + (b.x <= 0 ? 1 : -1) * (b.w * 0.5 + 0.65);
        const sz = b.z + face * (b.d * 0.34);
        const sy = Math.min(b.h - 1.4, 4.6);
        makeNeonSign(ns[0], ns[1], ns[2], ns[3], sx, sy, sz, face > 0 ? 0 : Math.PI, 0.95, 2.9);
      }
    });

    // 2. Semáforos animados en las 4 esquinas del cruce central
    addTrafficLight(-4.6, -5.2, 0);
    addTrafficLight(4.6, 5.2, Math.PI);
    addTrafficLight(5.2, -4.6, -Math.PI / 2);
    addTrafficLight(-5.2, 4.6, Math.PI / 2);

    // 3. Guirnaldas de luces cálidas cruzando las calles de la plaza central (altas: y=6.3m)
    addStringLights(-5.5, 6.2, -9.5, 5.5, 6.2, -9.5, 8);
    addStringLights(-5.5, 6.2, 9.5, 5.5, 6.2, 9.5, 8);
    addStringLights(-9.5, 6.1, -5.5, -9.5, 6.1, 5.5, 7);
    addStringLights(9.5, 6.1, -5.5, 9.5, 6.1, 5.5, 7);

    // 4. Máquinas expendedoras iluminadas en veredas seguras (pegadas a paredes)
    const vendSpots = [
      [-5.1, -13.5, Math.PI / 2, '#d94854', '#b8f2ff'],     // costado Café Luna
      [5.1, -13.5, -Math.PI / 2, '#3b82d6', '#ffd6f5'],     // costado Arcade
      [-5.1, 13.5, Math.PI / 2, '#3ba87a', '#d4ffea'],      // costado Mercado
      [24.5, 13.2, -Math.PI / 2, '#e07a3d', '#fff0c2'],     // cerca de Ramen
      [14.2, 53.5, Math.PI, '#4f6fd6', '#cceeff']           // costado Centro Comercial
    ];
    for (const [vx, vz, ry, col, glow] of vendSpots) {
      if (!insideAnyBuilding(vx, vz, 0.35)) addVendingMachine(vx, groundAt(vx, vz), vz, ry, col, glow);
    }
  }

  // =========================================================================
  // 2. PROPS URBANOS CON FÍSICA 3D INTERACTIVA
  // =========================================================================
  function buildPropMesh(kind) {
    const g = new THREE.Group();
    if (kind === 'hydrant') {
      // Hidrante rojo detallado
      makeBox(g, 0.44, 0.12, 0.44, '#8c1d24', 0, 0.06, 0, { shadow: true });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.62, 8), getMat('#d92632'));
      body.position.y = 0.41; body.castShadow = true; g.add(body);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.16, 8), getMat('#b81d27'));
      cap.position.y = 0.78; g.add(cap);
      makeBox(g, 0.1, 0.1, 0.1, '#d8dde2', 0, 0.89, 0);
      makeBox(g, 0.52, 0.14, 0.14, '#c4212c', 0, 0.54, 0);
      makeBox(g, 0.58, 0.1, 0.1, '#d8dde2', 0, 0.54, 0);
    } else if (kind === 'cone') {
      // Cono de tránsito naranja con franja blanca reflectante
      makeBox(g, 0.46, 0.07, 0.46, '#2b333c', 0, 0.035, 0, { shadow: true });
      const c1 = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.62, 8), getMat('#ff6b1a'));
      c1.position.y = 0.38; c1.castShadow = true; g.add(c1);
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.125, 0.14, 8), getMat('#f4f7fa'));
      stripe.position.y = 0.44; g.add(stripe);
    } else if (kind === 'trash') {
      // Tacho de basura metálico con tapa
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.23, 0.78, 8), getMat('#566775'));
      bin.position.y = 0.39; bin.castShadow = true; g.add(bin);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.09, 8), getMat('#7b8d9c'));
      rim.position.y = 0.79; g.add(rim);
      makeBox(g, 0.22, 0.07, 0.08, '#93a6b5', 0, 0.86, 0);
    } else if (kind === 'crate') {
      // Cajón de madera reforzado
      makeBox(g, 0.74, 0.68, 0.74, '#b8834a', 0, 0.34, 0, { shadow: true });
      makeBox(g, 0.78, 0.1, 0.78, '#8c5d30', 0, 0.64, 0);
      makeBox(g, 0.78, 0.1, 0.78, '#8c5d30', 0, 0.06, 0);
      makeBox(g, 0.1, 0.66, 0.78, '#8c5d30', 0.34, 0.34, 0);
      makeBox(g, 0.1, 0.66, 0.78, '#8c5d30', -0.34, 0.34, 0);
    } else if (kind === 'pot') {
      // Maceta de terracota con arbusto con flores
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.21, 0.46, 8), getMat('#c76b46'));
      p.position.y = 0.23; p.castShadow = true; g.add(p);
      makeBox(g, 0.56, 0.44, 0.56, '#5ea368', 0, 0.64, 0);
      makeBox(g, 0.14, 0.14, 0.14, '#ff8fb8', 0.16, 0.84, 0.12);
      makeBox(g, 0.14, 0.14, 0.14, '#ffe066', -0.14, 0.86, -0.10);
    } else {
      // Silla / banquito de café
      makeBox(g, 0.54, 0.08, 0.54, '#c78c52', 0, 0.50, 0, { shadow: true });
      for (const sx of [-0.21, 0.21]) for (const sz of [-0.21, 0.21]) {
        makeBox(g, 0.06, 0.50, 0.06, '#394652', sx, 0.25, sz);
      }
      makeBox(g, 0.54, 0.42, 0.07, '#c78c52', 0, 0.74, -0.24);
    }
    return g;
  }

  const PROP_META = {
    hydrant:    { r: 0.42, mass: 1.45, bounce: 0.38, col: '#ff5252', sound: 'metal' },
    cone:       { r: 0.36, mass: 0.42, bounce: 0.52, col: '#ff8a3d', sound: 'hit' },
    trash:      { r: 0.44, mass: 0.85, bounce: 0.46, col: '#b0bec5', sound: 'metal' },
    crate:      { r: 0.54, mass: 1.05, bounce: 0.32, col: '#d49a5a', sound: 'wood' },
    pot:        { r: 0.42, mass: 0.90, bounce: 0.28, col: '#e07a52', sound: 'hit' },
    cafe_chair: { r: 0.44, mass: 0.62, bounce: 0.44, col: '#d69d63', sound: 'wood' }
  };

  function spawnProp(kind, x, z, ry = 0) {
    if (insideAnyBuilding(x, z, 0.55)) return null;
    const y0 = groundAt(x, z);
    const mesh = buildPropMesh(kind);
    mesh.position.set(x, y0, z);
    mesh.rotation.y = ry;
    scene.add(mesh);
    addPropCull(mesh, x, y0 + 0.5, z, 1.5, 0.85);
    const meta = PROP_META[kind] || PROP_META.crate;
    const p = {
      kind, mesh,
      homeX: x, homeY: y0, homeZ: z, homeRy: ry,
      pos: new V3(x, y0, z),
      vel: new V3(),
      ang: new V3(),
      r: meta.r, mass: meta.mass, bounce: meta.bounce, col: meta.col,
      sleeping: true,
      displaced: false,
      restoreT: 0,
      geyserSpawned: false,
      respawnAnim: 1
    };
    PROPS.push(p);
    return p;
  }

  function spawnAllProps() {
    // Hidrantes en esquinas clave de las avenidas
    const hydrants = [
      [-5.3, -5.6], [5.3, 5.6], [-5.3, 18.8], [5.3, -18.8],
      [-19.2, -4.8], [19.2, 4.8], [-5.2, 34.5], [5.2, -34.5]
    ];
    hydrants.forEach(([x, z], i) => spawnProp('hydrant', x, z, (i % 4) * Math.PI * 0.5));

    // Tachos de basura junto a veredas y plazas
    const trashes = [
      [-6.0, -7.8], [6.0, -7.8], [-6.0, 7.8], [6.0, 7.8],
      [-18.8, 5.4], [18.8, -5.4], [-4.8, 28.2], [4.8, -28.2],
      [-14.5, 45.2], [14.5, 45.2]
    ];
    trashes.forEach(([x, z]) => spawnProp('trash', x, z));

    // Conos de tránsito cerca del Taller y avenidas
    const cones = [
      [4.9, 25.0], [5.8, 26.2], [6.6, 25.4],
      [-4.9, -24.5], [-5.7, -25.8],
      [21.5, 4.9], [22.8, 4.9], [-21.5, -4.9]
    ];
    cones.forEach(([x, z]) => spawnProp('cone', x, z));

    // Cajas de madera frente al Mercado y Taller
    const crates = [
      [-17.2, 5.2], [-18.0, 5.2], [-17.6, 4.4],
      [19.6, 28.5], [20.4, 28.5], [20.0, 27.7]
    ];
    crates.forEach(([x, z], i) => spawnProp('crate', x, z, (i % 3) * 0.25));

    // Sillitas de terraza cerca del Café Luna y Ramen
    const chairs = [
      [-9.2, -4.6, 0.3], [-10.4, -4.6, -0.2], [-14.2, -4.6, 0.15],
      [28.2, 4.6, 2.9], [29.5, 4.6, 3.2]
    ];
    chairs.forEach(([x, z, ry]) => spawnProp('cafe_chair', x, z, ry));

    // Macetas con flores en entradas y esquinas de la plaza
    const pots = [
      [-6.8, -4.8], [6.8, -4.8], [-6.8, 4.8], [6.8, 4.8],
      [-24.2, -4.8], [24.2, 4.8]
    ];
    pots.forEach(([x, z]) => spawnProp('pot', x, z));
  }

  function kickProp(p, ix, iy, iz, spin = 7) {
    if (!p) return;
    const invM = 1 / p.mass;
    p.vel.x += ix * invM;
    p.vel.y += iy * invM;
    p.vel.z += iz * invM;
    p.ang.set((rand(-1, 1)) * spin, (rand(-1, 1)) * spin, (rand(-1, 1)) * spin);
    p.sleeping = false;
    p.displaced = true;
    p.restoreT = 22;
    if (p.kind === 'hydrant' && !p.geyserSpawned) {
      p.geyserSpawned = true;
      GEYSERS.push({ x: p.homeX, y: p.homeY, z: p.homeZ, t: 7.5, emitT: 0 });
      burst(new V3(p.homeX, p.homeY + 0.5, p.homeZ), 16, '#8ee8ff', 7, 0.2, 0.65, 0.5);
      sfx('splash', new V3(p.homeX, p.homeY, p.homeZ), 0.7);
    } else if (p.kind === 'crate' || p.kind === 'pot' || p.kind === 'trash') {
      const spd = p.vel.length();
      if (spd > 7) burst(p.pos.clone().add(new V3(0, 0.4, 0)), 7, p.col, 5, 0.16, 0.45, 0.2);
    }
  }

  function cityPropsImpulse(center, radius, power = 14) {
    if (!center || !PROPS.length) return;
    const r = Math.max(2.2, radius + 1.4);
    const r2 = r * r;
    for (let i = 0; i < PROPS.length; i++) {
      const p = PROPS[i];
      const dx = p.pos.x - center.x, dz = p.pos.z - center.z;
      const d2 = dx * dx + dz * dz;
      if (d2 > r2) continue;
      const d = Math.max(0.25, Math.sqrt(d2));
      const falloff = 1 - d / r;
      const push = (4.5 + power * 0.85) * (0.45 + falloff * 0.95);
      const up = (5.5 + power * 0.45) * (0.5 + falloff * 0.8);
      kickProp(p, (dx / d) * push, up, (dz / d) * push, 10 + power * 0.4);
    }
  }

  function updateCityPro(dt) {
    if (!dt || dt <= 0) return;
    const t = G.time || 0;

    // 1. Aspas de aire acondicionado girando
    for (let i = 0; i < SPINNERS.length; i++) {
      SPINNERS[i].rotation.z += dt * (4.2 + (i % 3) * 0.9);
    }

    // 2. Luces rojas parpadeantes en antenas de torres altas
    for (let i = 0; i < BLINKERS.length; i++) {
      const b = BLINKERS[i];
      const on = Math.sin(t * 2.8 + b.phase) > 0.35;
      b.mat.emissiveIntensity = on ? 1.8 : 0.08;
    }

    // 3. Ciclo de semáforos (cada 14 segundos)
    const cyc = t % 14;
    for (let i = 0; i < TRAFFIC.length; i++) {
      const tf = TRAFFIC[i];
      const local = tf.axis === 0 ? cyc : (cyc + 7) % 14;
      const isG = local < 5.2, isY = local >= 5.2 && local < 6.8, isR = local >= 6.8;
      tf.g.emissiveIntensity = isG ? 1.5 : 0.06;
      tf.y.emissiveIntensity = isY ? 1.5 : 0.06;
      tf.r.emissiveIntensity = isR ? 1.5 : 0.06;
    }

    // 4. Chorro de agua en la fuente central
    if (CITY.fountain && G.state === 'play') {
      FOUNTAIN_FX.t -= dt;
      if (FOUNTAIN_FX.t <= 0) {
        FOUNTAIN_FX.t = 0.09;
        const fx = CITY.fountain.x, fz = CITY.fountain.z;
        emit(
          new V3(fx + rand(-0.12, 0.12), 1.38, fz + rand(-0.12, 0.12)),
          new V3(rand(-1.1, 1.1), rand(3.1, 4.4), rand(-1.1, 1.1)),
          '#b8f4ff', rand(0.11, 0.18), rand(0.45, 0.72), 10
        );
      }
    }

    // 5. Géiseres de hidrantes rotos (chorro de agua + empuje vertical divertido)
    for (let i = GEYSERS.length - 1; i >= 0; i--) {
      const g = GEYSERS[i];
      g.t -= dt;
      g.emitT -= dt;
      if (g.emitT <= 0) {
        g.emitT = 0.045;
        for (let k = 0; k < 2; k++) {
          emit(
            new V3(g.x + rand(-0.14, 0.14), g.y + 0.15, g.z + rand(-0.14, 0.14)),
            new V3(rand(-1.3, 1.3), rand(7.5, 11.2), rand(-1.3, 1.3)),
            k === 0 ? '#8be8ff' : '#e8fbff', rand(0.16, 0.28), rand(0.5, 0.85), 14
          );
        }
      }
      // Impulso suave si un peleador pasa justo encima del géiser
      for (const f of G.fighters) {
        if (!f || !f.alive || f.remote) continue;
        const dx = f.pos.x - g.x, dz = f.pos.z - g.z;
        if (dx * dx + dz * dz < 1.15 && f.pos.y < g.y + 4.8) {
          f.vel.y = Math.max(f.vel.y, 11.5);
          f.onGround = false;
        }
      }
      if (g.t <= 0) GEYSERS.splice(i, 1);
    }

    // 6. Interacción de peleadores corriendo/dash contra los props físicos
    const F = G.fighters;
    for (let i = 0; i < PROPS.length; i++) {
      const p = PROPS[i];

      // Animación suave de reaparición al restaurarse
      if (p.respawnAnim < 1) {
        p.respawnAnim = Math.min(1, p.respawnAnim + dt * 3.5);
        const s = 0.01 + p.respawnAnim * 0.99;
        p.mesh.scale.set(s, s, s);
      }

      // Colisión rápida con peleadores cercanos
      for (let j = 0; j < F.length; j++) {
        const f = F[j];
        if (!f || !f.alive || Math.abs(f.pos.y - p.pos.y) > 1.8) continue;
        const dx = p.pos.x - f.pos.x, dz = p.pos.z - f.pos.z;
        const minR = p.r + 0.58;
        const d2 = dx * dx + dz * dz;
        if (d2 < minR * minR && d2 > 1e-5) {
          const sp = Math.hypot(f.vel.x, f.vel.z);
          if (sp > 2.2 || f.dashT > 0 || f.action) {
            const d = Math.sqrt(d2);
            const boost = f.dashT > 0 ? 15 : Math.max(5.5, sp * 1.15);
            kickProp(p, (dx / d) * boost + f.vel.x * 0.35, 3.2 + Math.min(5, boost * 0.35), (dz / d) * boost + f.vel.z * 0.35, 9);
          }
        }
      }

      // Auto-restauración tras 22s desplazado
      if (p.displaced) {
        p.restoreT -= dt;
        if (p.restoreT <= 0) {
          p.pos.set(p.homeX, p.homeY, p.homeZ);
          p.vel.set(0, 0, 0);
          p.ang.set(0, 0, 0);
          p.mesh.position.copy(p.pos);
          p.mesh.rotation.set(0, p.homeRy, 0);
          p.sleeping = true;
          p.displaced = false;
          p.geyserSpawned = false;
          p.respawnAnim = 0.05;
          p.mesh.scale.set(0.05, 0.05, 0.05);
          continue;
        }
      }

      if (p.sleeping) continue;

      // Integración física 3D (gravedad + rebote suelo + rebote edificios + fricción)
      p.vel.y += _grav * dt;
      p.pos.addScaledVector(p.vel, dt);

      const gy = groundAt(p.pos.x, p.pos.z);
      if (p.pos.y <= gy) {
        p.pos.y = gy;
        if (p.vel.y < -3.2) {
          p.vel.y = -p.vel.y * p.bounce;
          p.vel.x *= 0.78;
          p.vel.z *= 0.78;
          p.ang.multiplyScalar(0.75);
        } else {
          p.vel.y = 0;
          const drag = Math.max(0, 1 - dt * 5.2);
          p.vel.x *= drag;
          p.vel.z *= drag;
          p.ang.multiplyScalar(Math.max(0, 1 - dt * 6));
        }
      }

      // Rebote simple contra paredes de edificios
      const hitB = insideAnyBuilding(p.pos.x, p.pos.z, p.r * 0.5);
      if (hitB) {
        const dx = p.pos.x - hitB.x, dz = p.pos.z - hitB.z;
        const ox = hitB.w * 0.5 + p.r * 0.6 - Math.abs(dx);
        const oz = hitB.d * 0.5 + p.r * 0.6 - Math.abs(dz);
        if (ox < oz) {
          p.pos.x += (dx >= 0 ? ox : -ox);
          p.vel.x = -p.vel.x * 0.55;
        } else {
          p.pos.z += (dz >= 0 ? oz : -oz);
          p.vel.z = -p.vel.z * 0.55;
        }
      }

      p.mesh.position.copy(p.pos);
      p.mesh.rotation.x += p.ang.x * dt;
      p.mesh.rotation.y += p.ang.y * dt;
      p.mesh.rotation.z += p.ang.z * dt;

      if (p.pos.y <= gy + 0.01 && p.vel.lengthSq() < 0.08 && p.ang.lengthSq() < 0.12) {
        p.vel.set(0, 0, 0);
        p.ang.set(0, 0, 0);
        p.sleeping = true;
      }
    }
  }

  function initCiudadPro() {
    decorateArchitecture();
    spawnAllProps();
  }

  return { CITY_PROPS: PROPS, initCiudadPro, updateCityPro, cityPropsImpulse };
};
