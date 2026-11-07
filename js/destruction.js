// ====================================================================
// CALFIGHT - SISTEMA DE DAÑO A ESTRUCTURAS Y DESTRUCCIÓN
// Maneja: rotura de props, daño localizado en paredes de edificios,
// calcomanías de grietas, perforación de colisiones (colCarve) y
// reparación temporal automática.
// ====================================================================

(function(window) {
  'use strict';

  const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _dv = new THREE.Vector3(), _ds = new THREE.Vector3(), _de = new THREE.Euler();
  let DEST_GEO = null, DEB_MAT = null;
  const DEST_OFF = [], COL_OFF = [], COL_ROOTS = new Map();

  // Textura procedural de calcomanía de grietas / quemadura
  const SCAR_TEX = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d', { willReadFrequently: true });
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 58);
    gr.addColorStop(0, 'rgba(8,6,4,.92)');
    gr.addColorStop(.55, 'rgba(18,13,8,.7)');
    gr.addColorStop(1, 'rgba(18,13,8,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(8,6,4,.95)';
    g.lineCap = 'round';
    const TAU = Math.PI * 2;
    const rnd = window.rand || ((a, b) => a + Math.random() * (b - a));
    for (let i = 0; i < 13; i++) {
      let a = i / 13 * TAU + rnd(-.2, .2), r = 10, x = 64, y = 64;
      g.lineWidth = 4.5;
      g.beginPath();
      g.moveTo(x, y);
      while (r < 62) {
        r += rnd(5, 11);
        a += rnd(-.4, .4);
        x = 64 + Math.cos(a) * r;
        y = 64 + Math.sin(a) * r;
        g.lineTo(x, y);
        g.lineWidth = Math.max(1, g.lineWidth - .45);
      }
      g.stroke();
    }
    return new THREE.CanvasTexture(c);
  })();

  let SCAR_N = 0;

  // Estampa una calcomanía de impacto y grietas sobre muros o el suelo
  function scarDecal(p, r, n) {
    if (SCAR_N > 70) return;
    SCAR_N++;
    const rnd = window.rand || ((a, b) => a + Math.random() * (b - a));
    const geo = new THREE.PlaneGeometry(r * 2, r * 2);
    const mat = new THREE.MeshBasicMaterial({
      map: SCAR_TEX,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3
    });
    const m = new THREE.Mesh(geo, mat);
    if (n) {
      m.position.copy(p).addScaledVector(n, .05);
      m.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
      m.rotateZ(rnd(0, Math.PI * 2));
    } else {
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rnd(0, Math.PI * 2);
      m.position.set(p.x, p.y + .04, p.z);
    }
    if (window.addFx) {
      window.addFx(m, 40, (o, k) => {
        mat.opacity = k < .8 ? .95 : .95 * (1 - (k - .8) / .2);
      }, () => {
        SCAR_N--;
        geo.dispose();
        mat.dispose();
      });
    }
  }

  // Registro de elementos de modelos Blockbench (.bbmodel)
  function bbRegister(mesh, geo) {
    const cubes = geo.userData.cubes;
    if (!cubes || !geo.index) return;
    mesh.updateMatrixWorld(true);
    mesh.userData.idx0 = geo.userData.idx0 || (geo.userData.idx0 = geo.index.array.slice());
    const L = window.DESTR || (window.DESTR = []);
    const M = mesh.matrixWorld;
    const v = new THREE.Vector3();
    const isBldg = !!(mesh.userData && mesh.userData.isBuilding);
    let bmnx = 1e9, bmny = 1e9, bmnz = 1e9, bmxx = -1e9, bmxy = -1e9, bmxz = -1e9;

    for (const c of cubes) {
      const a = c.a;
      let mnx = 1e9, mny = 1e9, mnz = 1e9, mxx = -1e9, mxy = -1e9, mxz = -1e9;
      for (const x of [a[0], a[3]]) {
        for (const y of [a[1], a[4]]) {
          for (const z of [a[2], a[5]]) {
            v.set(x, y, z).applyMatrix4(M);
            mnx = Math.min(mnx, v.x); mny = Math.min(mny, v.y); mnz = Math.min(mnz, v.z);
            mxx = Math.max(mxx, v.x); mxy = Math.max(mxy, v.y); mxz = Math.max(mxz, v.z);
          }
        }
      }
      const w = mxx - mnx, h = mxy - mny, d = mxz - mnz;
      const vol = w * h * d;
      if (vol > 7000 || Math.max(w, h, d) < .08 || mxy < -.6) continue;
      bmnx = Math.min(bmnx, mnx); bmny = Math.min(bmny, mny); bmnz = Math.min(bmnz, mnz);
      bmxx = Math.max(bmxx, mxx); bmxy = Math.max(bmxy, mxy); bmxz = Math.max(bmxz, mxz);

      // Para edificios: el cuerpo estructural gigante (cubo_1) y el tejado NO se rompen completos,
      // pero todas las ventanas, maceteros, marcos, puertas y adornos SÍ se registran para romperse visiblemente.
      const isCoreBody = isBldg && (Math.max(w, h, d) > 3.0 || vol > 4.0);
      L.push({
        bb: { geo, mesh, i0: c.i0, n: c.n, uv: c.uv, fc: c.fc, a: c.a },
        p: [(mnx + mxx) / 2, (mny + mxy) / 2, (mnz + mxz) / 2, Math.max(w, .06), h, Math.max(d, .06)],
        col: null,
        mat: mesh.material,
        model: mesh.userData.model || '',
        isBuilding: isBldg,
        isCoreBody
      });
    }
    if (bmnx <= bmxx) mesh.userData.wbox = [bmnx, bmny, bmnz, bmxx, bmxy, bmxz];
  }

  const BBF = {
    south: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    north: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
    east: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
    west: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]],
    up: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]],
    down: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]
  };

  function destFace(d) {
    if (d.bb.face !== undefined) return d.bb.face;
    const a = d.bb.a, dx = a[3] - a[0], dy = a[4] - a[1], dz = a[5] - a[2];
    let best = null, ba = -1;
    for (const f of d.bb.fc || []) {
      const nm = f[0], ar = (nm === 'north' || nm === 'south') ? dx * dy : (nm === 'east' || nm === 'west') ? dz * dy : dx * dz;
      if (ar > ba) { ba = ar; best = f; }
    }
    if (!best || !BBF[best[0]]) return d.bb.face = null;
    const c = BBF[best[0]], ax = (p, q) => { for (let i = 0; i < 3; i++) if (c[p][i] !== c[q][i]) return [i, c[p][i]]; return [0, 0]; };
    const [ua, u0] = ax(0, 1), [va, v0] = ax(0, 3);
    return d.bb.face = { u1: best[1], v1: best[2], u2: best[3], v2: best[4], ua, u0, va, v0 };
  }

  function destCell(d, t) {
    const F = destFace(d), map = d.mat && d.mat.map;
    if (!F || !map || !map.image) return null;
    try {
      const M = map.userData;
      if (!M.px) {
        const im = map.image, cv = document.createElement('canvas');
        cv.width = im.width; cv.height = im.height;
        const g = cv.getContext('2d');
        g.drawImage(im, 0, 0);
        M.w = cv.width; M.h = cv.height;
        M.px = g.getImageData(0, 0, cv.width, cv.height).data;
      }
      const RW = d.bb.geo.userData.RW, RH = d.bb.geo.userData.RH;
      const tu = F.u0 === 0 ? t[F.ua] : 1 - t[F.ua], tv = F.v0 === 0 ? t[F.va] : 1 - t[F.va];
      const clamp = window.clamp || ((v, min, max) => Math.max(min, Math.min(max, v)));
      const u = F.u1 + (F.u2 - F.u1) * tu, v = F.v2 + (F.v1 - F.v2) * tv;
      const x = clamp(Math.floor(u * M.w / RW), 0, M.w - 1);
      const y = clamp(Math.floor(v * M.h / RH), 0, M.h - 1);
      const i = (y * M.w + x) * 4;
      return M.px[i + 3] < 40 ? null : [M.px[i], M.px[i + 1], M.px[i + 2]];
    } catch (e) { return null; }
  }

  function destColor(d) {
    if (d.col) return d.col;
    let col = '#b9b19c';
    try {
      const map = d.mat && d.mat.map, im = map && map.image, uv = d.bb && d.bb.uv, RW = d.bb.geo.userData.RW, RH = d.bb.geo.userData.RH;
      if (im && uv) {
        const M = map.userData;
        if (!M.px) {
          const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
          const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
          M.w = cv.width; M.h = cv.height; M.px = g.getImageData(0, 0, cv.width, cv.height).data;
        }
        const clamp = window.clamp || ((v, min, max) => Math.max(min, Math.min(max, v)));
        const u = clamp(Math.floor((uv[0] + uv[2]) / 2 * M.w / RW), 0, M.w - 1);
        const v = clamp(Math.floor((uv[1] + uv[3]) / 2 * M.h / RH), 0, M.h - 1);
        const i = (v * M.w + u) * 4;
        if (M.px[i + 3] > 40) col = 'rgb(' + M.px[i] + ',' + M.px[i + 1] + ',' + M.px[i + 2] + ')';
      }
    } catch (e) { }
    return d.col = col;
  }

  function destMaterial(d) {
    const m = (d.model || '') + ' ' + (d.mat && d.mat.name || '');
    if (/madera|banco|sombrilla|puerta|mesa|chiringuito|palmera/i.test(m)) return 'wood';
    if (/castillo|arena/i.test(m)) return 'sand';
    if (/farola|valla|reja|metal/i.test(m)) return 'metal';
    if (/ventana|cristal/i.test(m)) return 'glass';
    return 'stone';
  }

  // Oculta temporalmente una pieza rota (rellena su índice en la GPU con ceros)
  function destHide(d) {
    const G = window.G || { time: 0 };
    if (d.bb) {
      d.bb.geo.index.array.fill(0, d.bb.i0, d.bb.i0 + d.bb.n);
      d.bb.geo.index.needsUpdate = true;
    } else if (d.m) {
      _dm.compose(_dv.set(d.p[0], -60, d.p[2]), _dq, _ds.set(.001, .001, .001));
      d.m.setMatrixAt(d.i, _dm);
      d.m.instanceMatrix.needsUpdate = true;
    }
    d.off = true;
    if (d.parent) {
      d.parent.back = Math.max(d.parent.back, G.time + 18);
    } else {
      d.back = G.time + 26 + Math.random() * 14;
      DEST_OFF.push(d);
    }
  }

  // Restaura con el tiempo los objetos destruidos
  function destRestore(all = false, comp = false) {
    const G = window.G || { time: 0 };
    for (let i = DEST_OFF.length - 1; i >= 0; i--) {
      const d = DEST_OFF[i];
      if (all || G.time >= d.back) {
        if (d.bb) {
          const idx0 = d.bb.mesh.userData.idx0;
          if (idx0) {
            d.bb.geo.index.array.set(idx0.subarray(d.bb.i0, d.bb.i0 + d.bb.n), d.bb.i0);
            d.bb.geo.index.needsUpdate = true;
          }
        } else if (d.m) {
          _dm.compose(_dv.set(d.p[0], d.p[1], d.p[2]), _dq, _ds.set(d.p[3], d.p[4], d.p[5]));
          d.m.setMatrixAt(d.i, _dm);
          d.m.instanceMatrix.needsUpdate = true;
        }
        if (d.rubble) {
          if (d.rubble.parent) d.rubble.parent.remove(d.rubble);
          if (d.rubble.geometry) d.rubble.geometry.dispose();
          d.rubble = null;
        }
        if (d.cells) for (const c of d.cells) c.dead = true;
        d.off = false;
        DEST_OFF.splice(i, 1);
      }
    }
    const COL = window.COL || [];
    for (let i = COL_OFF.length - 1; i >= 0; i--) {
      const e = COL_OFF[i];
      if (all || G.time >= e.back) {
        if (e.isRubble) {
          const ri = COL.indexOf(e.b);
          if (ri >= 0) COL.splice(ri, 1);
        } else {
          COL.push(e.b);
        }
        COL_OFF.splice(i, 1);
      }
    }
    for (const [root, rec] of COL_ROOTS) {
      if (all || G.time >= rec.back) {
        for (let i = COL.length - 1; i >= 0; i--) if (COL[i].root === root) COL.splice(i, 1);
        COL.push(root);
        COL_ROOTS.delete(root);
      }
    }
    if (comp && window.DESTR) window.DESTR = window.DESTR.filter(x => !x.dead);
    if (all) {
      const DEB = window.PHYSICS ? window.PHYSICS.DEB : null;
      if (DEB) { DEB.a.length = 0; if (DEB.m) DEB.m.count = 0; }
      HOLES.length = 0;
      for (let i = COL.length - 1; i >= 0; i--) if (COL[i].rubble) COL.splice(i, 1);
    }
  }

  // Talla una caja de prop en cubos sueltos (capado a 160 cubos para rendimiento fluido)
  function carveBox(d, c, r, dir) {
    const q = d.p;
    let cs = d.bb ? .45 : .6, nx, ny, nz;
    do {
      nx = Math.max(1, Math.round(q[3] / cs));
      ny = Math.max(1, Math.round(q[4] / cs));
      nz = Math.max(1, Math.round(q[5] / cs));
      cs *= 1.2;
    } while (nx * ny * nz > 160);

    const sx = q[3] / nx, sy = q[4] / ny, sz = q[5] / nz, keep = [], base = destColor(d);
    const mw = d.bb ? d.bb.mesh.matrixWorld.elements : null, flx = mw && mw[0] < 0, flz = mw && mw[10] < 0;
    const tcol = (i, j, k) => {
      if (!d.bb) return base;
      let tx = (i + .5) / nx, tz = (k + .5) / nz;
      if (flx) tx = 1 - tx; if (flz) tz = 1 - tz;
      const g = destCell(d, [tx, (j + .5) / ny, tz]);
      return g ? 'rgb(' + g[0] + ',' + g[1] + ',' + g[2] + ')' : base;
    };
    const matType = destMaterial(d);
    const dirX = dir ? dir.x * 6 : 0, dirZ = dir ? dir.z * 6 : 0;
    let sp = 0;

    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        for (let k = 0; k < nz; k++) {
          const x = q[0] - q[3] / 2 + (i + .5) * sx;
          const y = q[1] - q[4] / 2 + (j + .5) * sy;
          const z = q[2] - q[5] / 2 + (k + .5) * sz;
          const dx = x - c.x, dy = y - c.y, dz = z - c.z;
          const dd = Math.hypot(dx, dy, dz);
          if (dd < r * (.75 + .25 * Math.random())) {
            const l = Math.hypot(dx, dz) || 1;
            const vx = (dx / l) * 5 + dirX + (Math.random() - .5) * 3;
            const vy = 1.8 + Math.random() * 2.5; // Salto suave que cae al suelo
            const vz = (dz / l) * 5 + dirZ + (Math.random() - .5) * 3;
            if (window.PHYSICS && window.PHYSICS.spawnDebris) {
              window.PHYSICS.spawnDebris(x, y, z, Math.max(sx, .28) * .95, Math.max(sy, .28) * .95, Math.max(sz, .28) * .95, tcol(i, j, k), vx, vy, vz);
            }
            sp++;
          } else {
            keep.push([x, y, z, sx, sy, sz, tcol(i, j, k)]);
          }
        }
      }
    }
    destHide(d);
    if (sp > 0 && window.burst) {
      const burstCol = matType === 'wood' ? '#9e6b38' : matType === 'sand' ? '#e8d29a' : matType === 'metal' ? '#ffe066' : base;
      window.burst(c, Math.min(18, sp + 4), burstCol, 6, .16, .45);
      if (window.sfx) window.sfx(matType === 'wood' ? 'break' : matType === 'metal' ? 'ding' : 'break', c, 0.75);
    }
    if (keep.length) {
      DEST_GEO = DEST_GEO || new THREE.BoxGeometry(1, 1, 1);
      DEB_MAT = DEB_MAT || new THREE.MeshLambertMaterial({ color: 0xffffff });
      const mesh = new THREE.InstancedMesh(DEST_GEO, d.bb ? DEB_MAT : d.m.material, keep.length);
      mesh.receiveShadow = true; mesh.castShadow = false;
      if (d.bb) {
        mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(keep.length * 3), 3);
      }
      keep.forEach((p, i) => {
        _dm.compose(_dv.set(p[0], p[1], p[2]), _dq, _ds.set(p[3], p[4], p[5]));
        mesh.setMatrixAt(i, _dm);
        if (d.bb) mesh.setColorAt(i, new THREE.Color(p[6]).multiplyScalar(.94 + Math.random() * .12));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (window.scene) window.scene.add(mesh);
      d.rubble = mesh;
      d.cells = keep.map((p, i) => ({ m: mesh, i, p, col: p[6] || base, parent: d, cell: true, off: false }));
      for (const x of d.cells) window.DESTR.push(x);
    }
  }

  // Colapso estructural por gravedad (SOLO para palmeras al ser taladas; NUNCA para edificios)
  function checkStructuralCascade(affectedMeshes) {
    if (!affectedMeshes || !affectedMeshes.size) return;
    const L = window.DESTR;
    if (!L) return;
    const groundAt = window.groundAt || ((x, z) => 0);
    const COL = window.COL || [];
    const G = window.G || { time: 0 };

    for (const mesh of affectedMeshes) {
      if (!mesh) continue;
      // NUNCA colapsar edificios! Solo palmeras
      if (mesh.userData.isBuilding || !mesh.userData.isProp) continue;
      const model = (mesh.userData && mesh.userData.model) || '';
      if (!/palmera/i.test(model)) continue;

      const aliveCubes = [];
      let lowestY = 1e9, highestY = -1e9;
      for (let i = 0; i < L.length; i++) {
        const d = L[i];
        if (d.off || d.dead || !d.bb || d.bb.mesh !== mesh) continue;
        const q = d.p;
        aliveCubes.push(d);
        lowestY = Math.min(lowestY, q[1] - q[4] / 2);
        highestY = Math.max(highestY, q[1] + q[4] / 2);
      }
      const gy = groundAt(mesh.position.x, mesh.position.z);
      if (aliveCubes.length > 0 && lowestY > gy + 2.0 && highestY - lowestY > 1.0) {
        if (window.comicPop) window.comicPop(mesh.position.clone().add(new THREE.Vector3(0, Math.min(5, highestY), 0)), '¡COLLAPSE!', 'burst-orange', 36);
        if (window.sfx) { window.sfx('break', mesh.position, 1.0); window.sfx('heavy', mesh.position, 0.9); }
        if (window.shakeFrom) window.shakeFrom(mesh.position, 0.45);
        if (window.ringAt) window.ringAt(new THREE.Vector3(mesh.position.x, gy + 0.1, mesh.position.z), '#e8dfcb', 3.2, 0.35);

        for (const d of aliveCubes) {
          destHide(d);
          const q = d.p, col = destColor(d);
          for (let si = 0; si < 2; si++) {
            if (window.PHYSICS && window.PHYSICS.spawnDebris) {
              window.PHYSICS.spawnDebris(
                q[0] + (Math.random() - .5) * q[3],
                q[1] + (Math.random() - .5) * q[4],
                q[2] + (Math.random() - .5) * q[5],
                Math.max(0.32, q[3] * 0.45), Math.max(0.32, q[4] * 0.45), Math.max(0.32, q[5] * 0.45),
                col, (Math.random() - .5) * 6, 1.5 + Math.random() * 2, (Math.random() - .5) * 6
              );
            }
          }
        }
        for (let ci = COL.length - 1; ci >= 0; ci--) {
          const b = COL[ci];
          if (b && b.prop === mesh) {
            COL_OFF.push({ b, back: G.time + 26 + Math.random() * 10 });
            COL.splice(ci, 1);
          }
        }
        const rubbleCol = { x: mesh.position.x, z: mesh.position.z, hx: 2.2, hz: 2.2, h: gy + 0.75, y0: gy, rubble: true, ceiling: false, nocam: true };
        COL.push(rubbleCol);
        COL_OFF.push({ b: rubbleCol, back: G.time + 26, isRubble: true });
      }
    }
  }

  // Daño localizado en un radio r alrededor del punto c
  function worldBreak(c, r, maxVol, carve, dir) {
    const L = window.DESTR;
    if (!L) return 0;
    let n = 0, carved = 0;
    const affectedMeshes = new Set();
    const dirX = dir ? dir.x * 6 : 0, dirZ = dir ? dir.z * 6 : 0;
    const groundAt = window.groundAt || ((x, z) => 0);
    const gy = groundAt(c.x, c.z);

    let debrisSpawnedThisImpact = 0;
    const maxDebrisToSpawn = Math.min(12, Math.max(6, Math.round(r * 5)));
    let primaryColor = '#b9b19c';

    for (let k = 0; k < L.length; k++) {
      const d = L[k];
      if (d.off || d.dead) continue;
      if (d.bb && d.bb.mesh && d.bb.mesh.userData.wbox) {
        const wb = d.bb.mesh.userData.wbox;
        if (c.x + r < wb[0] || c.x - r > wb[3] || c.z + r < wb[2] || c.z - r > wb[5] || c.y + r < wb[1] || c.y - r > wb[4]) continue;
      }
      const q = d.p;
      if (Math.abs(c.x - q[0]) > r + q[3] * 0.5 || Math.abs(c.z - q[2]) > r + q[5] * 0.5) continue;

      // FILTRO DE ALTURA ESTRICTO PARA EDIFICIOS:
      // Si el elemento está en un piso superior o en el tejado, JAMÁS se toca.
      // Golpear la planta baja solo afecta la zona inmediata del golpe (<= 1.8m vertical).
      const dY = Math.abs(q[1] - c.y);
      if (d.isBuilding) {
        if (dY > Math.min(r * 0.75, 2.0) || q[1] > c.y + 1.8) continue;
      } else {
        if (dY > r * 1.1 + 0.3) continue;
      }

      const dx = Math.max(Math.abs(c.x - q[0]) - q[3] / 2, 0);
      const dy = Math.max(Math.abs(c.y - q[1]) - q[4] / 2, 0);
      const dz = Math.max(Math.abs(c.z - q[2]) - q[5] / 2, 0);
      if (dx * dx + dy * dy + dz * dz > r * r) continue;

      const vol = q[3] * q[4] * q[5];
      const maxDim = Math.max(q[3], q[4], q[5]);
      primaryColor = destColor(d) || primaryColor;

      // CASO A: Muro grande o cuerpo principal del edificio (cubo_1 o muros gigantes)
      // No se oculta el edificio completo ni se convierte en 900 cubos voxel!
      if (d.isCoreBody || maxDim > 2.0 || vol > 2.2) {
        n++;
        continue;
      }

      // CASO B: Elementos rompibles de la fachada (ventanas, marcos, maceteros, puertas, farolas, props)
      // SÍ SE ROMPEN Y DESAPARECEN (destHide) para que el modelo muestre el hueco y la rotura real!
      const small = maxDim <= 1.5;
      if (small || (!carve && vol <= maxVol)) {
        destHide(d);
        n++;
        if (d.bb && d.bb.mesh && d.bb.mesh.userData.isProp) affectedMeshes.add(d.bb.mesh);
      } else if (carve && carved < 16 && !d.isBuilding) {
        carveBox(d, c, r, dir);
        carved++;
        n++;
        if (d.bb && d.bb.mesh && d.bb.mesh.userData.isProp) affectedMeshes.add(d.bb.mesh);
      }
    }

    // DISPERSIÓN CONTROLADA DE ESCOMBROS:
    // Un solo spray limpio y contundente de 6 a 12 bloques de mampostería justo en el cráter,
    // que caen al suelo en una trayectoria realista sin salir disparados 15 metros al techo!
    if (n > 0 && window.PHYSICS && window.PHYSICS.spawnDebris) {
      for (let si = 0; si < maxDebrisToSpawn; si++) {
        const px = c.x + (Math.random() - .5) * r * 0.9;
        const py = Math.max(gy + 0.25, Math.min(c.y + r * 0.35, c.y + (Math.random() - .5) * r * 0.6));
        const pz = c.z + (Math.random() - .5) * r * 0.9;
        const l = Math.hypot(px - c.x, pz - c.z) || 1;
        const sz = 0.28 + Math.random() * Math.min(0.28, r * 0.25);
        // Salen expulsados hacia afuera de la pared y con poca altura vertical
        const vx = (px - c.x) / l * 6.5 + dirX * 0.7 + (Math.random() - .5) * 2;
        const vy = 1.4 + Math.random() * 2.2; // Salto bajo que cae rápidamente con la gravedad
        const vz = (pz - c.z) / l * 6.5 + dirZ * 0.7 + (Math.random() - .5) * 2;
        window.PHYSICS.spawnDebris(px, py, pz, sz, sz, sz, primaryColor, vx, vy, vz);
      }
      if (window.burst) window.burst(c, 10, primaryColor, 5.5, 0.15, 0.4);
      if (window.sfx) { window.sfx('break', c, 0.75); window.sfx('heavy', c, 0.7); }
    }

    checkStructuralCascade(affectedMeshes);
    return n;
  }

  // Talla física 3D en colisiones COL (permite abrir brechas en paredes para pasar)
  function colCarve(c, r) {
    const COL = window.COL || [];
    const hy = Math.max(.55, r * .85);
    for (let i = COL.length - 1; i >= 0; i--) {
      const b = COL[i];
      if (!b || b.nobreak || b.ceiling || b.rubble) continue;
      const y0 = b.y0 || 0;
      const dx = Math.max(Math.abs(c.x - b.x) - b.hx, 0);
      const dz = Math.max(Math.abs(c.z - b.z) - b.hz, 0);
      if (dx * dx + dz * dz > r * r || c.y - hy > b.h || c.y + hy < y0) continue;

      const root = b.root || b;
      const fullyEngulfed = (Math.hypot(b.hx, b.hz) <= r * 0.95 && c.y - hy <= y0 + 0.3 && c.y + hy >= b.h - 0.3);
      if (fullyEngulfed) {
        COL_OFF.push({ b, back: (window.G ? window.G.time : 0) + 26 + Math.random() * 10 });
        COL.splice(i, 1);
        continue;
      }

      const q = Math.max(.55, r * .82);
      const x0 = c.x - q, x1 = c.x + q, z0 = c.z - q, z1 = c.z + q;
      const bx0 = b.x - b.hx, bx1 = b.x + b.hx, bz0 = b.z - b.hz, bz1 = b.z + b.hz;
      const hl = Math.max(y0, c.y - hy), hh = Math.min(b.h, c.y + hy), pcs = [];
      const add = (ax0, ax1, az0, az1, yb, yt) => {
        if (ax1 - ax0 > .1 && az1 - az0 > .1 && yt - yb > .1) {
          pcs.push(Object.assign({}, b, { x: (ax0 + ax1) / 2, z: (az0 + az1) / 2, hx: (ax1 - ax0) / 2, hz: (az1 - az0) / 2, y0: yb, h: yt, root }));
        }
      };

      if (bx0 < x0) add(bx0, x0, bz0, bz1, y0, b.h);
      if (bx1 > x1) add(x1, bx1, bz0, bz1, y0, b.h);
      const mx0 = Math.max(bx0, x0), mx1 = Math.min(bx1, x1);
      if (bz0 < z0) add(mx0, mx1, bz0, z0, y0, b.h);
      if (bz1 > z1) add(mx0, mx1, z1, bz1, y0, b.h);
      const mz0 = Math.max(bz0, z0), mz1 = Math.min(bz1, z1);
      if (y0 < hl) add(mx0, mx1, mz0, mz1, y0, hl);
      if (b.h > hh) add(mx0, mx1, mz0, mz1, hh, b.h);

      if (pcs.length > 0) {
        const back = (window.G ? window.G.time : 0) + 26 + Math.random() * 10;
        COL_ROOTS.set(root, { back });
        COL.splice(i, 1, ...pcs);
      }
    }
  }

  // Huecos de corte visual en shaders de edificios Blockbench
  const HOLES = [];
  const HOLE_U = { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 0)) };

  function addHole(c, r) {
    const G = window.G || { time: 0 };
    if (HOLES.length >= 10) HOLES.shift();
    HOLES.push({ x: c.x, y: c.y, z: c.z, r, t0: G.time, back: G.time + 28 + Math.random() * 10 });
  }

  function holesUpdate() {
    const G = window.G || { time: 0 };
    for (let i = HOLES.length - 1; i >= 0; i--) {
      const h = HOLES[i];
      if (G.time > h.back + .6) HOLES.splice(i, 1);
    }
    for (let i = 0; i < 10; i++) {
      const h = HOLES[i], u = HOLE_U.value[i];
      if (!h) { u.w = 0; continue; }
      let k = Math.min(1, (G.time - h.t0) / .18);
      k = 1 - (1 - k) * (1 - k);
      if (G.time > h.back) k *= 1 - (G.time - h.back) / .6;
      u.set(h.x, h.y, h.z, h.r * Math.max(0, k));
    }
  }

  function bbAvgColor(m) {
    if (m.userData.col) return m.userData.col;
    let col = '#b9b19c';
    try {
      const im = m.material.map && m.material.map.image;
      if (im) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 4;
        const g = cv.getContext('2d'); g.drawImage(im, 0, 0, 4, 4);
        const d = g.getImageData(0, 0, 4, 4).data;
        let r = 0, gg = 0, b = 0;
        for (let i = 0; i < 64; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
        col = 'rgb(' + (r >> 4) + ',' + (gg >> 4) + ',' + (b >> 4) + ')';
      }
    } catch (e) { }
    return m.userData.col = col;
  }

  function bbHole(c, r) {
    const L = window.BBM;
    if (!L || r < 1.0) return;
    for (const m of L) {
      if (!m.userData.bb) { m.updateMatrixWorld(true); m.userData.bb = new THREE.Box3().setFromObject(m); }
      const b = m.userData.bb;
      const dx = Math.max(b.min.x - c.x, 0, c.x - b.max.x);
      const dy = Math.max(b.min.y - c.y, 0, c.y - b.max.y);
      const dz = Math.max(b.min.z - c.z, 0, c.z - b.max.z);
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      addHole(c, r);
      break;
    }
  }

  // Red / Multiplayer Sync
  const NETREP = { on: false, recv: false, last: -9 };

  function netDestSend(c, r, power, dmg, dest) {
    const G = window.G, NET = window.NET;
    if (!G || !G.mp || NETREP.recv || NETREP.on || G.viewer || G.guide) return;
    if (G.time - NETREP.last < .2 && r < 3) return;
    NETREP.last = G.time;
    const r2 = v => Math.round(v * 100) / 100;
    NET.destSeq = (NET.destSeq || 0) + 1;
    (NET.destOut || (NET.destOut = [])).push({
      s: NET.destSeq, t: G.time,
      x: r2(c.x), y: r2(c.y), z: r2(c.z),
      r: r2(r), p: r2(power),
      m: dmg == null ? null : r2(dmg),
      e: dest == null ? null : r2(dest)
    });
    while (NET.destOut.length > 8) NET.destOut.shift();
    NET.sendT = 0;
  }

  function applyNetDest(e) {
    if (!e || ![e.x, e.y, e.z, e.r, e.p].every(v => Number.isFinite(+v)) || Math.abs(e.x) > 400 || Math.abs(e.z) > 400 || Math.abs(e.y) > 60) return;
    NETREP.recv = true;
    const clamp = window.clamp || ((v, min, max) => Math.max(min, Math.min(max, v)));
    try {
      worldDamage(
        new THREE.Vector3(+e.x, +e.y, +e.z),
        clamp(+e.r, 0, 14),
        clamp(+e.p, 0, 5),
        e.m == null ? undefined : clamp(+e.m, 0, 80),
        e.e == null ? undefined : clamp(+e.e, 0, 3)
      );
    } finally {
      NETREP.recv = false;
    }
  }

  // Función principal de daño estructural en un punto del mapa
  function worldDamage(c, r, power, dmg, dest, dir) {
    if (NETREP.on) return;
    const G = window.G;
    if (!G || r < 1.0 || G.state !== 'play' || dest === 0 || (G.rules && G.rules.dest === 0) || G.guide) return;

    netDestSend(c, r, power, dmg, dest);
    const PERF_DEST = window.PERF_DEST || 1;
    const gRulesDest = G.rules && G.rules.dest != null ? G.rules.dest : 1;
    if (dmg != null) dmg *= (dest != null ? dest : 1) * gRulesDest * PERF_DEST;
    else power *= gRulesDest * PERF_DEST;
    if (dmg != null && dmg < 1.5) return;

    const rr = dmg != null ? Math.min(r * .9, .8 + dmg * .16) : r * .85 * power;
    const groundAt = window.groundAt || ((x, z) => 0);
    const gy = groundAt(c.x, c.z);

    if (c.y < gy + 2.5) {
      scarDecal(new THREE.Vector3(c.x, gy, c.z), Math.min(6.5, rr * 1.25));
    }

    // Estampado de calcomanía en muros cercanos
    const COL = window.COL || [];
    let k = 0;
    for (const b of COL) {
      if (k >= 2) break;
      if (b.ceiling || b.nocam || b.h < 2.5 || (b.y0 && c.y < b.y0 - .5) || c.y > b.h + .5) continue;
      const clamp = window.clamp || ((v, min, max) => Math.max(min, Math.min(max, v)));
      const qx = clamp(c.x, b.x - b.hx, b.x + b.hx);
      const qz = clamp(c.z, b.z - b.hz, b.z + b.hz);
      const dx = c.x - qx, dz = c.z - qz, d = Math.hypot(dx, dz);
      if (d < .05 || d > r + .6) continue;
      scarDecal(new THREE.Vector3(qx, clamp(c.y, .9, b.h - .7), qz), Math.min(3.4, r * .8), new THREE.Vector3(dx / d, 0, dz / d));
      k++;
    }

    if (r >= 1.0) {
      const big = (dmg != null ? rr >= 1.2 : r >= 2.0 && power >= .8);
      worldBreak(c, rr, (.45 + r * .35) * power, big, dir);
      colCarve(c, rr);
      if (big) bbHole(c, rr);
    }
  }

  // Exportar API del módulo de destrucción
  const DESTRUCTION = {
    worldDamage,
    worldBreak,
    carveBox,
    colCarve,
    bbRegister,
    destHide,
    destRestore,
    bbHole,
    scarDecal,
    checkStructuralCascade,
    netDestSend,
    applyNetDest,
    holesUpdate,
    HOLE_U,
    HOLES
  };

  window.DESTRUCTION = DESTRUCTION;
  window.worldDamage = worldDamage;
  window.worldBreak = worldBreak;
  window.colCarve = colCarve;
  window.scarDecal = scarDecal;
  window.bbRegister = bbRegister;
  window.destRestore = destRestore;
  window.bbHole = bbHole;
  window.holesUpdate = holesUpdate;
  window.HOLE_U = HOLE_U;
  window.NETREP = NETREP;   // game.js (replayAct) lo necesita: sin esto las habilidades de los demás jugadores nunca se reproducían en tu pantalla

})(window);
