// ====================================================================
// CALFIGHT - SISTEMA DE FÍSICA (PHYSICS ENGINE)
// Maneja: cinemática de escombros, rebotes 3D en piso y muros, apilado de
// montículos (rubble stacking), colisiones entre luchadores y wall-splats.
// ====================================================================

(function(window) {
  'use strict';

  // Vector auxiliar reutilizable
  const _v3 = () => (window.V3 ? new window.V3() : new THREE.Vector3());
  const _dm = new THREE.Matrix4(), _dq = new THREE.Quaternion(), _dv = new THREE.Vector3(), _ds = new THREE.Vector3(), _de = new THREE.Euler();
  let DEST_GEO = null;

  // Colección de partículas físicas de escombros
  const DEB = { m: null, a: [], max: 1200 };

  // Spawnea un bloque de escombro con masa y física 3D propia
  function spawnDebris(x, y, z, sx, sy, sz, col, vx, vy, vz) {
    const scene = window.scene;
    if (!scene) return;
    if (!DEB.m) {
      DEST_GEO = DEST_GEO || new THREE.BoxGeometry(1, 1, 1);
      DEB.m = new THREE.InstancedMesh(DEST_GEO, new THREE.MeshLambertMaterial({ color: 0xffffff }), DEB.max);
      DEB.m.count = 0;
      DEB.m.visible = false;
      DEB.m.frustumCulled = false;
      DEB.m.castShadow = false;
      DEB.m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(DEB.max * 3), 3);
      scene.add(DEB.m);
    }
    if (DEB.a.length >= DEB.max) return;
    const rnd = window.rand || ((a, b) => a + Math.random() * (b - a));
    const TAU = Math.PI * 2;
    DEB.a.push({
      x, y, z,
      sx, sy, sz,
      vx, vy, vz,
      rx: rnd(0, TAU), ry: rnd(0, TAU),
      wx: rnd(-10, 10), wy: rnd(-10, 10),
      life: rnd(6, 10),
      c: new THREE.Color(col || '#b9b19c')
    });
  }

  // Actualiza la simulación física de los escombros en cada frame
  function destUpdate(dt) {
    if (!DEB.m) return;
    const A = DEB.a;
    const groundAt = window.groundAt || ((x, z) => 0);
    const COL = window.COL || [];
    const G = window.G;
    const rnd = window.rand || ((a, b) => a + Math.random() * (b - a));

    for (let i = A.length - 1; i >= 0; i--) {
      const d = A[i];
      d.life -= dt;
      if (d.life <= 0) {
        A[i] = A[A.length - 1];
        A.pop();
        continue;
      }

      // Gravedad e integración de velocidad
      d.vy -= 26 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.rx += d.wx * dt;
      d.ry += d.wy * dt;

      const gy = groundAt(d.x, d.z);
      const h = Math.min(d.sx, d.sy, d.sz) / 2;

      // Apilado tridimensional dinámico (los escombros forman montículos sobre otros escombros)
      let floorY = gy + h;
      if (d.y - h < gy + 0.4 && Math.abs(d.vx) < 0.8 && Math.abs(d.vz) < 0.8) {
        const checkLimit = Math.min(25, A.length);
        for (let si = 0; si < checkLimit; si++) {
          const o = A[si];
          if (o === d || o.y < gy) continue;
          const ox = d.x - o.x, oz = d.z - o.z;
          if (ox * ox + oz * oz < 0.16 && o.y >= floorY - 0.05 && o.y < gy + 0.75) {
            floorY = Math.max(floorY, o.y + Math.min(d.sy, o.sy) * 0.9);
            break;
          }
        }
      }

      // Rebote contra el suelo o montículo
      if (d.y - h < floorY) {
        d.y = floorY + h;
        if (d.vy < -2) {
          d.vy *= -0.36;
          d.vx *= 0.65;
          d.vz *= 0.65;
          d.wx *= 0.65;
          d.wy *= 0.65;
        } else {
          d.vy = 0;
          d.vx *= 0.82;
          d.vz *= 0.82;
          d.wx *= 0.75;
          d.wy *= 0.75;
        }
      }

      // Rebote físico contra muros en COL
      if (Math.abs(d.vx) > 1.8 || Math.abs(d.vz) > 1.8) {
        for (let ci = 0; ci < COL.length; ci++) {
          const c = COL[ci];
          if (!c || c.ceiling || c.rubble || d.y < (c.y0 || 0) || d.y > c.h) continue;
          if (Math.abs(d.x - c.x) < c.hx + 0.22 && Math.abs(d.z - c.z) < c.hz + 0.22) {
            const ox = (c.hx + 0.22) - Math.abs(d.x - c.x);
            const oz = (c.hz + 0.22) - Math.abs(d.z - c.z);
            if (ox < oz) {
              d.vx = -d.vx * 0.52;
              d.x += Math.sign(d.x - c.x) * (ox + 0.04);
            } else {
              d.vz = -d.vz * 0.52;
              d.z += Math.sign(d.z - c.z) * (oz + 0.04);
            }
            d.wx = rnd(-8, 8);
            d.wy = rnd(-8, 8);
            break;
          }
        }
      }

      // Colisión cinética contra luchadores (si el escombro vuela muy rápido)
      const debSpeed = Math.hypot(d.vx, d.vy, d.vz);
      if (debSpeed > 8.5 && G && G.fighters) {
        for (let fi = 0; fi < G.fighters.length; fi++) {
          const f = G.fighters[fi];
          if (!f || !f.alive || !f.pos) continue;
          const fDist = Math.hypot(d.x - f.pos.x, d.z - f.pos.z);
          if (fDist < 0.65 && d.y >= f.pos.y && d.y <= f.pos.y + 1.8) {
            if (typeof f.damage === 'function' && (!f.lastDebHit || G.time - f.lastDebHit > 0.4)) {
              f.lastDebHit = G.time;
              f.damage(Math.round(debSpeed * 0.4), f.pos, null, null, null, null, true);
              if (window.sfx) window.sfx('ding', f.pos, 0.5);
              if (window.burst) window.burst(new THREE.Vector3(d.x, d.y, d.z), 4, '#fff', 3, 0.1, 0.25);
            }
            d.vx *= -0.3;
            d.vy = Math.max(d.vy * 0.5, 2.5);
            d.vz *= -0.3;
            break;
          }
        }
      }

      // Interacción con pies de los luchadores: correr sobre escombros los patea
      if (G && G.fighters) {
        for (let fi = 0; fi < G.fighters.length; fi++) {
          const f = G.fighters[fi];
          if (!f || !f.alive || !f.pos) continue;
          const fdx = d.x - f.pos.x, fdz = d.z - f.pos.z;
          const fDist = Math.hypot(fdx, fdz);
          if (fDist < 0.85 && Math.abs(d.y - f.pos.y) < 0.7) {
            const fsp = Math.hypot(f.vel ? f.vel.x : 0, f.vel ? f.vel.z : 0);
            if (fsp > 1.8) {
              const push = 2.4 + Math.min(fsp * 0.6, 6.0);
              d.vx += (fdx / (fDist || 1)) * push + (f.vel ? f.vel.x * 0.4 : 0);
              d.vz += (fdz / (fDist || 1)) * push + (f.vel ? f.vel.z * 0.4 : 0);
              if (d.y - (gy + h) < 0.35) {
                d.vy = Math.max(d.vy, 3.0 + Math.min(fsp * 0.35, 5.0));
              }
              d.wx = rnd(-14, 14);
              d.wy = rnd(-14, 14);
            }
          }
        }
      }
    }

    // Actualiza matrices de InstancedMesh
    const M = DEB.m;
    M.count = A.length;
    for (let i = 0; i < A.length; i++) {
      const d = A[i], k = d.life < 0.6 ? Math.max(0.01, d.life / 0.6) : 1;
      _de.set(d.rx, d.ry, 0);
      _dq.setFromEuler(_de);
      _dm.compose(_dv.set(d.x, d.y, d.z), _dq, _ds.set(d.sx * k, d.sy * k, d.sz * k));
      M.setMatrixAt(i, _dm);
      M.setColorAt(i, d.c);
    }
    M.visible = A.length > 0;
    M.instanceMatrix.needsUpdate = true;
    if (M.instanceColor) M.instanceColor.needsUpdate = true;
  }

  // Resolución de colisión física entre dos luchadores (evita que se traspasen)
  function resolveFighterCollisions(f1, f2) {
    if (!f1 || !f2 || !f1.alive || !f2.alive || !f1.pos || !f2.pos) return;
    const dy = Math.abs(f1.pos.y - f2.pos.y);
    if (dy > 1.8) return;
    const dx = f1.pos.x - f2.pos.x, dz = f1.pos.z - f2.pos.z;
    const dist = Math.hypot(dx, dz);
    const minDist = 0.88;
    if (dist < minDist && dist > 0.001) {
      const overlap = (minDist - dist) * 0.5;
      const nx = dx / dist, nz = dz / dist;
      f1.pos.x += nx * overlap;
      f1.pos.z += nz * overlap;
      f2.pos.x -= nx * overlap;
      f2.pos.z -= nz * overlap;
      if (f1.vel && f2.vel) {
        const rvx = f1.vel.x - f2.vel.x, rvz = f1.vel.z - f2.vel.z;
        const velAlongNormal = rvx * nx + rvz * nz;
        if (velAlongNormal < 0) {
          f1.vel.x -= nx * velAlongNormal * 0.4;
          f1.vel.z -= nz * velAlongNormal * 0.4;
          f2.vel.x += nx * velAlongNormal * 0.4;
          f2.vel.z += nz * velAlongNormal * 0.4;
        }
      }
    }
  }

  // Detección de impacto contra muros (Wall-Splat estilo anime)
  function checkWallSplat(f, b, speed, normal) {
    if (!f || !b || speed < 5.5) return;
    const pos = f.pos.clone().add(new THREE.Vector3(0, 1.0, 0));
    if (window.comicPop) window.comicPop(pos, '¡SLAM!', 'burst-orange', 38);
    if (window.sfx) { window.sfx('heavy', pos, 0.95); window.sfx('break', pos, 0.85); }
    if (window.shakeFrom) window.shakeFrom(pos, 0.4);
    if (window.ringAt) window.ringAt(pos, '#ff2a3c', 2.8, 0.3);
    if (window.burst) window.burst(pos, 16, '#ffe066', 7, 0.16, 0.45);
    if (window.DESTRUCTION && typeof window.DESTRUCTION.worldDamage === 'function') {
      window.DESTRUCTION.worldDamage(pos, 2.2, 1.2, 18, 1.2, normal);
    }
    f.vel.x *= -0.35;
    f.vel.z *= -0.35;
    f.vel.y = Math.max(f.vel.y, 4.0);
    if (f.state) f.state.stun = Math.max(f.state.stun || 0, 0.65);
  }

  // Exportar API del módulo de física
  const PHYSICS = {
    DEB,
    spawnDebris,
    destUpdate,
    resolveFighterCollisions,
    checkWallSplat
  };

  window.PHYSICS = PHYSICS;
  window.spawnDebris = spawnDebris;
  window.destUpdate = destUpdate;

})(window);
