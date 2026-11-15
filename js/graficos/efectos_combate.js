// ====================================================================
// SISTEMA DE PARTÍCULAS Y EFECTOS VISUALES DE COMBATE 3D / ANIME
// ====================================================================
// Incluye partículas instanciadas (`Parts`, `PS`), ciclo de vida de efectos
// (`FX`, `addFx`, `updateFx`, `removeFx`), destellos, cortes, chispas, grietas,
// `impactFrame`, números de daño / onomatopeyas cómic, sombras de contacto,
// auras de despertar y polvo de movimiento.
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearEfectosCombate = function crearEfectosCombate(dep) {
  const {
    scene, camera, ZZZ_U, OUTLINE_MAT,
    V3, TAU, rand, clamp, fwd, easeOut, $, _c
  } = dep;

  class Parts {
    constructor(sc, max) {
      this.max = max; this.next = 0;
      this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), max);
      this.mesh.frustumCulled = false;this.mesh.visible=false;sc.add(this.mesh);
      const F = () => new Float32Array(max);
      Object.assign(this, { x: F(), y: F(), z: F(), vx: F(), vy: F(), vz: F(), L: F().fill(-1), LM: F(), size: F(), g: F(), drag: F(), rot: F(), cr:F(), cg:F(), cb:F() });
      this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.p = new V3(); this.s = new V3();
      const z = new THREE.Matrix4().makeScale(0, 0, 0);
      for (let i = 0; i < max; i++) { this.mesh.setMatrixAt(i, z); this.mesh.setColorAt(i, _c.set(0xffffff)); }this.mesh.count=0;
    }
    emit(x, y, z, vx, vy, vz, col, size, life, grav = 1, drag = 2) {
      const PERF_FX = dep.getPerfFx(); if (PERF_FX < 1 && Math.random() > PERF_FX) return;
      const i = this.next; this.next = (this.next + 1) % this.max;
      this.x[i] = x; this.y[i] = y; this.z[i] = z; this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
      this.L[i] = life; this.LM[i] = life; this.size[i] = size; this.g[i] = grav; this.drag[i] = drag; this.rot[i] = Math.random() * 6;
      _c.set(col);this.cr[i]=_c.r;this.cg[i]=_c.g;this.cb[i]=_c.b;
    }
    burst(p, n, col, speed, size, life, grav = 1, up = 0) {
      const PERF_FX = dep.getPerfFx(); if (PERF_FX < 1) n = Math.max(1, Math.round(n * PERF_FX * 1.4));   // emit descarta el resto al azar
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU), b = rand(-1, 1), r = Math.sqrt(1 - b * b), s = speed * rand(.3, 1);
        this.emit(p.x, p.y, p.z, Math.cos(a) * r * s, b * s + up, Math.sin(a) * r * s, col, size * rand(.6, 1.2), life * rand(.6, 1.2), grav);
      }
    }
    update(dt) {
      const { m, q, e, p, s } = this; let draw=0;
      for (let i = 0; i < this.max; i++) {
        let L = this.L[i]; if (L === -1) continue;
        L -= dt;
        if (L <= 0) { this.L[i] = -1; continue; }
        this.L[i] = L;
        const dr = Math.exp(-this.drag[i] * dt);
        this.vy[i] -= this.g[i] * 22 * dt; this.vx[i] *= dr; this.vy[i] *= dr; this.vz[i] *= dr;
        this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt; this.z[i] += this.vz[i] * dt;
        if (this.y[i] < .05) { this.y[i] = .05; this.vy[i] *= -.3; this.vx[i] *= .7; this.vz[i] *= .7; }
        this.rot[i] += dt * 4;
        const sc = this.size[i] * Math.sqrt(L / this.LM[i]);
        e.set(this.rot[i], this.rot[i] * 1.3, 0); q.setFromEuler(e);
        m.compose(p.set(this.x[i], this.y[i], this.z[i]), q, s.set(sc, sc, sc)); this.mesh.setMatrixAt(draw,m);this.mesh.setColorAt(draw,_c.setRGB(this.cr[i],this.cg[i],this.cb[i]));draw++;
      }
      this.mesh.count=draw;this.mesh.visible=draw>0;if(draw){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor.needsUpdate=true;}
    }
    clear() { this.mesh.count=0;this.mesh.visible=false;const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < this.max; i++) { this.L[i] = -1; this.mesh.setMatrixAt(i, z); } this.mesh.instanceMatrix.needsUpdate = true; }
  }
  const PS = new Parts(scene, 2400);
  const emit = (...a) => PS.emit(...a);
  const burst = (...a) => PS.burst(...a);
  window.burst = burst; window.emit = emit;

  // ================= Efectos =================
  const FX = [];

  function removeFx(f){
    const index=FX.indexOf(f);if(index>=0)FX.splice(index,1);
    // Remove before disposal: a broken disposer cannot be retried forever every frame.
    f.sc.remove(f.obj);
    dep.frameTask('efecto:limpieza',()=>{
      if(f.dispose){f.dispose();return;}
      const geometries=new Set(),materials=new Set();
      f.obj.traverse(o=>{if(o.geometry&&!(o.geometry.userData&&o.geometry.userData.shared))geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m&&!(m.userData&&m.userData.pooled))materials.add(m);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    });
  }

  function addFx(obj, dur, upd, dispose, sc = scene) {
    const f={obj,t:0,dur,upd,dispose,sc};sc.add(obj);FX.push(f);
    dep.frameTask('efecto:inicio',()=>upd(obj,0),()=>removeFx(f));
  }
  function updateFx(dt) {
    for(let i=FX.length-1;i>=0;i--){
      const f=FX[i];if(!f)continue;f.t+=dt;const k=f.t/f.dur;
      if(k>=1||!Number.isFinite(k)){removeFx(f);continue;}
      dep.frameTask('efecto:animacion',()=>f.upd(f.obj,k),()=>removeFx(f));
    }
  }

  const ADD = THREE.AdditiveBlending;
  const markShared = g => { g.userData.shared = true; return g; };
  const RING_UNIT_GEO = markShared(new THREE.RingGeometry(.78, 1, 40));
  const RING_TIGHT_GEO = markShared(new THREE.RingGeometry(.89, 1, 32));
  const RING_STAR_GEO = markShared(new THREE.RingGeometry(.34, .48, 24));
  const BOX_UNIT_GEO = markShared(new THREE.BoxGeometry(1, 1, 1));
  const ICO_UNIT_GEO = markShared(new THREE.IcosahedronGeometry(1, 1));
  const PLANE_UNIT_GEO = markShared(new THREE.PlaneGeometry(1, 1));
  const CIRCLE_UNIT_GEO = markShared(new THREE.CircleGeometry(1, 36));
  const WARN_RING_GEO = markShared(new THREE.RingGeometry(.92, 1, 40));
  const CYL_UNIT_GEO = markShared(new THREE.CylinderGeometry(.85, 1, 1, 18, 1, true));
  const CONE_UNIT_GEO = markShared(new THREE.ConeGeometry(.28, 1.8, 4));
  const CONTACT_SHADOW_GEO = markShared(new THREE.PlaneGeometry(1.8, 1.8));
  const ARC_GEO_CACHE = new Map();
  function getArcGeo(inR, outR, segs, start, len) {
    const q = v => Math.round(v * 100);
    const key = `${q(inR)}:${q(outR)}:${segs}:${q(start)}:${q(len)}`;
    let g = ARC_GEO_CACHE.get(key);
    if (!g) {
      if (ARC_GEO_CACHE.size >= 64) ARC_GEO_CACHE.clear();
      g = markShared(new THREE.RingGeometry(inR, outR, segs, 1, start, len));
      ARC_GEO_CACHE.set(key, g);
    }
    return g;
  }

  const GLOW_MAT_POOL = [], INK_MAT_POOL = [], CRACK_MAT_POOL = [];
  function acquireMat(pool, makeFn, col, op) {
    const m = pool.length ? pool.pop() : makeFn();
    m.userData.pooled = true;
    m.color.set(col);
    m.opacity = op;
    return m;
  }
  function releaseMat(pool, m, limit = 128) {
    if (!m) return;
    if (pool.length < limit) pool.push(m);
    else m.dispose();
  }
  const makeGlowMat = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false, blending: ADD, side: THREE.DoubleSide });
  const makeInkMat = () => new THREE.MeshBasicMaterial({ color: 0x080a14, transparent: true, opacity: .78, depthWrite: false, side: THREE.DoubleSide });
  function glowMat(col, op = 1) { return acquireMat(GLOW_MAT_POOL, makeGlowMat, col, op); }
  function inkMat(col = '#080a14', op = .78) { return acquireMat(INK_MAT_POOL, makeInkMat, col, op); }
  function freeGlowMat(m) { releaseMat(GLOW_MAT_POOL, m, 128); }
  function freeInkMat(m) { releaseMat(INK_MAT_POOL, m, 48); }

  const SPARK_MESH_POOL = [], SLASH_MESH_POOL = [], SPHERE_MESH_POOL = [];
  function acquireUnitMesh(pool, geo, col, op) {
    let m;
    if (pool.length) {
      m = pool.pop();
      m.visible = true;
      m.material.color.set(col);
      m.material.opacity = op;
      m.scale.set(1, 1, 1);
      m.rotation.set(0, 0, 0);
    } else {
      m = new THREE.Mesh(geo, makeGlowMat());
      m.material.userData.pooled = true;
      m.material.color.set(col);
      m.material.opacity = op;
    }
    return m;
  }
  function releaseUnitMesh(pool, m, limit = 160) {
    if (!m) return;
    m.visible = false;
    if (pool.length < limit) pool.push(m);
    else m.material.dispose();
  }

  function ringAt(p, col, maxR, dur = .45, mode = 'flat', yaw = 0, sc = scene) {
    const beta = ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
    if (beta) {
      const grp = new THREE.Group();
      const mOut = glowMat(col, .95), mIn = glowMat('#ffffff', .88);
      const rOut = new THREE.Mesh(RING_UNIT_GEO, mOut), rIn = new THREE.Mesh(RING_TIGHT_GEO, mIn);
      rIn.scale.setScalar(.72); grp.add(rOut, rIn);
      grp.position.copy(p); if (mode === 'flat') { grp.rotation.x = -Math.PI / 2; grp.position.y += .08; } else grp.rotation.y = yaw;
      addFx(grp, dur, (g, k) => {
        const s = .22 + maxR * easeOut(k);
        g.scale.set(s, s, s);
        rIn.scale.setScalar(.68 + k * .26);
        mOut.opacity = .95 * (1 - k * k);
        mIn.opacity = .88 * (1 - Math.min(1, k * 1.25));
      }, () => { freeGlowMat(mOut); freeGlowMat(mIn); }, sc);
      return;
    }
    const mat = glowMat(col);
    const m = new THREE.Mesh(RING_UNIT_GEO, mat);
    m.position.copy(p); if (mode === 'flat') { m.rotation.x = -Math.PI / 2; m.position.y += .08; } else m.rotation.y = yaw;
    addFx(m, dur, (o, k) => { const s = .2 + maxR * easeOut(k); o.scale.set(s, s, s); mat.opacity = 1 - k; }, () => freeGlowMat(mat), sc);
  }
  function sphereFlash(p, col, r, dur = .35) {
    const m = acquireUnitMesh(SPHERE_MESH_POOL, ICO_UNIT_GEO, col, .7);
    m.position.copy(p);
    addFx(m, dur, (m, k) => { const s = r * easeOut(k) + .1; m.scale.set(s, s, s); m.material.opacity = .7 * (1 - k); }, () => releaseUnitMesh(SPHERE_MESH_POOL, m, 48));
  }
  function slashLine(a, b, col, dur = .35, thick = .12, sc = scene) {
    const len = a.distanceTo(b) || .1;
    const m = acquireUnitMesh(SLASH_MESH_POOL, BOX_UNIT_GEO, col, 1);
    m.position.copy(a).lerp(b, .5); m.lookAt(b);
    m.scale.set(thick, thick, len);
    addFx(m, dur, (m, k) => { m.material.opacity = 1 - k; m.scale.set(thick * (1 + k * 3), thick * (1 - k * .6), len); }, () => releaseUnitMesh(SLASH_MESH_POOL, m, 64), sc);
  }
  const STAR_GEO = markShared((() => { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(0, .07); s.lineTo(1, 0); s.lineTo(0, -.07); s.closePath(); return new THREE.ShapeGeometry(s); })());
  const STAR_DIAMOND_GEO = markShared((() => { const s = new THREE.Shape(); s.moveTo(0, .42); s.lineTo(.42, 0); s.lineTo(0, -.42); s.lineTo(-.42, 0); s.closePath(); return new THREE.ShapeGeometry(s); })());
  function impactStar(p, col, size = 1.6, dur = .2, sc = scene) {
    const grp = new THREE.Group(), mat = glowMat(col), mw = glowMat('#ffffff'), zzz = ZZZ_U.on.value > .5, beta = zzz && ZZZ_U.beta.value > .5;
    if (beta) {
      const spin0 = rand(-.45, .45);
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(STAR_GEO, i % 2 ? mat : mw);
        m.rotation.z = spin0 + i * Math.PI / 4 + rand(-.12, .12);
        m.scale.set(i % 2 ? 1.45 : .88, i % 2 ? 1.05 : 1.55, 1);
        grp.add(m);
      }
      const core = new THREE.Mesh(STAR_DIAMOND_GEO, mw); core.rotation.z = spin0; grp.add(core);
      const mrOut = glowMat(col, .95), mrIn = glowMat('#ffffff', .9);
      const ringOut = new THREE.Mesh(RING_TIGHT_GEO, mrOut), ringIn = new THREE.Mesh(RING_TIGHT_GEO, mrIn);
      grp.add(ringOut, ringIn);
      grp.position.copy(p);
      addFx(grp, dur, (g, k) => {
        const pop = k < .18 ? (k / .18) * 1.18 : 1.18 - ((k - .18) / .82) * .12;
        const s = size * pop;
        g.scale.set(s, s * (1 - k * .32), s);
        const rO = .38 + k * 1.05, rI = .24 + k * .65;
        ringOut.scale.set(rO, rO, 1); ringIn.scale.set(rI, rI, 1);
        mat.opacity = 1 - k * k;
        mw.opacity = 1 - Math.min(1, k * 1.15);
        mrOut.opacity = (1 - k) * .92;
        mrIn.opacity = (1 - Math.min(1, k * 1.35)) * .9;
        g.lookAt(camera.position);
      }, () => { freeGlowMat(mat); freeGlowMat(mw); freeGlowMat(mrOut); freeGlowMat(mrIn); }, sc);
      return;
    }
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(STAR_GEO, i % 2 ? mat : mw); m.rotation.z = i * Math.PI / 4 + rand(-.2, .2); m.scale.set(i % 2 ? (zzz ? 1.2 : 1) : .65, zzz && i % 2 === 0 ? 1.4 : 1, 1); grp.add(m); }
    let mr = null;
    if (zzz) { mr = glowMat(col, .95); grp.add(new THREE.Mesh(RING_STAR_GEO, mr)); }
    grp.position.copy(p);
    addFx(grp, dur, (g, k) => { const s = size * (k < .22 ? k / .22 : 1 + (k - .22) * .35); g.scale.set(s, s * (1 - k * .45), s); mat.opacity = mw.opacity = 1 - k * k; if (mr) mr.opacity = (1 - k) * .9; g.lookAt(camera.position); }, () => { freeGlowMat(mat); freeGlowMat(mw); if (mr) freeGlowMat(mr); }, sc);
  }
  function arcSlash(f, col, o = {}) {
    const r = o.r || 1.5, w = o.w || .5, len = o.len || 2.2, dir = o.dir || 1;
    const grp = new THREE.Group(); grp.position.set(f.pos.x, f.pos.y + (o.y || 1.15), f.pos.z); grp.rotation.y = f.yaw;
    const tilt = new THREE.Group(); tilt.rotation.z = o.tilt || 0; grp.add(tilt);
    const sw = new THREE.Group(); tilt.add(sw);
    const beta = ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
    if (beta) {
      const g1 = getArcGeo(r - w * 1.1, r, 32, -Math.PI / 2 - len / 2, len);
      const g2 = getArcGeo(r - w * .24, r * 1.01, 32, -Math.PI / 2 - len / 2, len);
      const gInk = getArcGeo(Math.max(.18, r - w * 1.32), r - w * .85, 28, -Math.PI / 2 - len * .42, len * .84);
      const m1 = glowMat(col, .90), m2 = glowMat('#ffffff', .98), mInk = inkMat('#080a14', .76);
      const a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2), c = new THREE.Mesh(gInk, mInk);
      a.rotation.x = b.rotation.x = c.rotation.x = -Math.PI / 2; c.position.y = -.01; sw.add(c, a, b);
      addFx(grp, o.dur || .22, (g, k) => {
        const snap = 1 - Math.pow(1 - Math.min(1, k * 2.55), 3);
        sw.rotation.y = dir * (1 - snap) * -1.02;
        const s = (k < .18 ? .82 + (k / .18) * .26 : 1.08 + (k - .18) * .18);
        sw.scale.set(s, s, s);
        m1.opacity = .90 * (1 - k * k);
        m2.opacity = .98 * (1 - Math.min(1, k * 1.15));
        mInk.opacity = .76 * (1 - k);
      }, () => { freeGlowMat(m1); freeGlowMat(m2); freeInkMat(mInk); });
      return;
    }
    const g1 = getArcGeo(r - w, r, 28, -Math.PI / 2 - len / 2, len), g2 = getArcGeo(r - w * .28, r, 28, -Math.PI / 2 - len / 2, len);
    const m1 = glowMat(col, .85), m2 = glowMat('#ffffff', .9);
    const a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; sw.add(a, b);
    addFx(grp, o.dur || .22, (g, k) => { sw.rotation.y = dir * (1 - easeOut(Math.min(1, k * 2.2))) * -.9; const s = 1 + k * .18; sw.scale.set(s, s, s); m1.opacity = .85 * (1 - k * k); m2.opacity = .9 * (1 - k); }, () => { freeGlowMat(m1); freeGlowMat(m2); });
  }
  function ghost(f, col, op = .42, life = .3) {
    const g = f.model.root.clone(true), mat = glowMat(col, op);
    g.traverse(o => { if (o.isMesh) { if (o.material === f.model.mats[1] || o.material === OUTLINE_MAT || o.userData.fx) o.visible = false; else { o.material = mat; o.castShadow = false; } } });
    addFx(g, life, (m, k) => { mat.opacity = op * (1 - k); }, () => freeGlowMat(mat));
  }
  function warnCircle(p, r, col, dur) {
    const grp = new THREE.Group(); grp.position.set(p.x, p.y + .06, p.z); grp.scale.set(r, 1, r);
    const cm = glowMat(col, .2), rm = glowMat(col, .9);
    const c = new THREE.Mesh(CIRCLE_UNIT_GEO, cm), ri = new THREE.Mesh(WARN_RING_GEO, rm); c.rotation.x = ri.rotation.x = -Math.PI / 2; grp.add(c, ri);
    addFx(grp, dur, (g, k) => { cm.opacity = .12 + .2 * Math.abs(Math.sin(k * 18)); const s = .3 + .7 * easeOut(Math.min(1, k * 3)); c.scale.set(s, s, s); }, () => { freeGlowMat(cm); freeGlowMat(rm); });
  }
  function fireColumn(p, r, col, h = 8) {
    const m = glowMat(col, .6), mesh = new THREE.Mesh(CYL_UNIT_GEO, m);
    mesh.position.set(p.x, p.y + h / 2, p.z);
    addFx(mesh, .5, (o, k) => { const rw = r * (1 - k * .6); o.scale.set(rw, h * (.3 + easeOut(k) * .7), rw); m.opacity = .6 * (1 - k); }, () => freeGlowMat(m));
    for (let i = 0; i < 60; i++) { const a = rand(0, TAU), rr = rand(0, r); emit(p.x + Math.cos(a) * rr, p.y + .2, p.z + Math.sin(a) * rr, rand(-2, 2), rand(12, 28), rand(-2, 2), ['#ff6d00', '#ffab00', '#ffe082', '#ffffff'][i % 4], rand(.2, .45), rand(.4, .8), .4, 2); }
  }
  function iceSpikes(p, r, col, n = 9) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), rr = rand(0, r), mat = glowMat(i % 3 ? col : '#ffffff', .8), m = new THREE.Mesh(CONE_UNIT_GEO, mat);
      m.position.set(p.x + Math.cos(a) * rr, p.y, p.z + Math.sin(a) * rr); m.rotation.set(rand(-.4, .4), rand(0, TAU), rand(-.4, .4));
      const hh = rand(.7, 1.5);
      addFx(m, rand(.8, 1.2), (o, k) => { const s = k < .15 ? k / .15 : 1; o.scale.set(s, s * hh, s); o.position.y = p.y + .8 * hh * s; mat.opacity = k > .7 ? .8 * (1 - (k - .7) / .3) : .8; }, () => freeGlowMat(mat));
    }
    burst(_tmpBurst.set(p.x, p.y + .5, p.z), 26, '#dff6ff', 8, .2, .6, .6, 3);
  }
  function iceBlock(f, dur) {
    const m = acquireMat(INK_MAT_POOL, makeInkMat, '#bfe3ff', .45), mesh = new THREE.Mesh(BOX_UNIT_GEO, m);
    mesh.scale.set(1.25, 2.3, 1.25);
    addFx(mesh, dur, (o, k) => { o.position.set(f.pos.x, f.pos.y + 1.1, f.pos.z); m.opacity = k > .85 ? .45 * (1 - (k - .85) / .15) : .45; if (!f.alive || f.frozen <= 0) o.visible = false; }, () => freeInkMat(m));
  }
  // Impacto anime / Zenless Wipeout: destello breve y corte de contraste en el posprocesado
  const IMPACT = { t: 0, dur: .11, col: '#ffffff', cd: 0, until: 0 };
  function impactFrame(col, dur = .11) {
    if (IMPACT.cd > 0 || dep.getFxMute()) return;
    const beta = ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
    const duration = clamp(Number.isFinite(dur) ? dur : (beta ? .12 : .11), .04, beta ? .13 : .12);
    IMPACT.t = duration; IMPACT.dur = duration; IMPACT.col = col || '#ffffff'; IMPACT.cd = .45; IMPACT.until = performance.now() + duration * 1000;
    if (ZZZ_U.on.value > .5) { ZZZ_U.impact.value = 1; ZZZ_U.impactCol.value.set(IMPACT.col); }
    if (beta && dep.camPunch) dep.camPunch(.52, Math.random() < .5 ? 1 : -1);
    document.body.classList.add('impact-active');
    setTimeout(() => document.body.classList.remove('impact-active'), duration * 1000);
    const GFX = dep.getGFX(), gradePass = dep.getGradePass();
    const el = $('impact-flash'), useShader = GFX.post && ZZZ_U.on.value > .5 && gradePass && gradePass.enabled;
    for (const animation of el.getAnimations()) animation.cancel();
    el.animate([
      { opacity: useShader ? (beta ? .16 : .22) : .88, background: '#ffffff', filter: useShader ? 'none' : 'invert(1) contrast(1.8)' },
      { opacity: useShader ? (beta ? .09 : .12) : .55, background: IMPACT.col, filter: useShader ? 'none' : 'invert(0.6)', offset: .35 },
      { opacity: useShader ? .04 : .2, background: IMPACT.col, filter: 'none', offset: .7 },
      { opacity: 0, background: IMPACT.col, filter: 'none' }
    ], { duration: duration * 1000, easing: 'ease-out' });
  }
  // chispas: rayas finas que salen disparadas del punto de impacto
  const SPARK_GEO = BOX_UNIT_GEO, _sparkLook = new V3(), _sparkDir = new V3(), _tmpBurst = new V3();
  function sparkLines(p, col, n = 6, len = 1.6, sc = scene, dir = null) {
    const beta = ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
    for (let i = 0; i < n; i++) {
      const m = acquireUnitMesh(SPARK_MESH_POOL, SPARK_GEO, i % 2 ? col : '#ffffff', 1), mat = m.material;
      _sparkDir.set(rand(-1, 1), rand(-.35, 1), rand(-1, 1));
      if (beta && dir && (i % 2 === 0)) _sparkDir.addScaledVector(dir, 1.35);
      if (_sparkDir.lengthSq() < 1e-4) _sparkDir.set(0, 1, 0);
      _sparkDir.normalize();
      const dx = _sparkDir.x, dy = _sparkDir.y, dz = _sparkDir.z;
      m.position.copy(p); m.lookAt(_sparkLook.set(p.x + dx, p.y + dy, p.z + dz));
      const L = len * (beta ? rand(.75, 1.45) : rand(.6, 1.3)), w = beta ? rand(.028, .065) : rand(.03, .07);
      const sdur = beta ? rand(.14, .23) : rand(.12, .2);
      addFx(m, sdur, (o, k) => {
        const e = easeOut(k);
        const wNow = beta ? w * (1 - k * .82) : w * (1 - k);
        o.scale.set(wNow, wNow, L * (beta ? (.36 + e * .92) : (.3 + e)));
        const push = L * (beta ? (.24 + e * .85) : (.2 + e * .7));
        o.position.set(p.x + dx * push, p.y + dy * push, p.z + dz * push);
        mat.opacity = beta ? (1 - k * k) : (1 - k);
      }, () => releaseUnitMesh(SPARK_MESH_POOL, m, 160), sc);
    }
  }
  // grietas en el piso para golpes grandes
  const CRACK_TEX = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d', { willReadFrequently: true });
    g.strokeStyle = 'rgba(20,14,8,.9)'; g.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      let a = i / 11 * TAU + rand(-.2, .2), r = 6, x = 64, y = 64; g.lineWidth = 4;
      g.beginPath(); g.moveTo(x, y);
      while (r < 60) { r += rand(6, 12); a += rand(-.35, .35); x = 64 + Math.cos(a) * r; y = 64 + Math.sin(a) * r; g.lineTo(x, y); g.lineWidth = Math.max(1, g.lineWidth - .4); }
      g.stroke();
    }
    const gr = g.createRadialGradient(64, 64, 2, 64, 64, 30); gr.addColorStop(0, 'rgba(25,18,10,.75)'); gr.addColorStop(1, 'rgba(25,18,10,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); return t;
  })();
  const makeCrackMat = () => new THREE.MeshBasicMaterial({ map: CRACK_TEX, transparent: true, opacity: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  function crackDecal(p, r) {
    const mat = acquireMat(CRACK_MAT_POOL, makeCrackMat, '#ffffff', 1), m = new THREE.Mesh(PLANE_UNIT_GEO, mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, TAU); m.position.set(p.x, p.y + .03, p.z); m.scale.set(r * 2, r * 2, 1);
    addFx(m, 3, (o, k) => { mat.opacity = k < .75 ? 1 : 1 - (k - .75) / .25; }, () => releaseMat(CRACK_MAT_POOL, mat, 32));
  }
  // aura de despertar estilo battlegrounds: llamas verticales del color del personaje
  const AURA_TEX = (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d', { willReadFrequently: true });
    for (let x = 0; x < 64; x++) {
      const h = 40 + Math.sin(x * .45) * 18 + Math.sin(x * 1.3) * 10 + Math.random() * 18;
      const gr = g.createLinearGradient(0, 128, 0, 128 - h * 1.4); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.5, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(x, 0, 1, 128);
    }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t;
  })();
  const AURA_PLANE_GEO = markShared(new THREE.PlaneGeometry(1.5, 2.9));
  function updateAura(f, dt, T) {
    const on = f.alive && f.awak > 0;
    if (!f.aura) {
      if (!on) return;
      const mat = new THREE.MeshBasicMaterial({ map: AURA_TEX, color: f.ch.color, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const g = new THREE.Group();
      for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(AURA_PLANE_GEO, mat); p.rotation.y = i * Math.PI / 3; p.position.y = 1.3; p.userData.fx = true; g.add(p); }
      g.userData.fx = true; f.model.root.add(g); f.aura = g; f.auraMat = mat;
    }
    f.aura.visible = on; if (!on) return;
    f.aura.rotation.y += dt * 2.5;
    const s = 1 + Math.sin(T * 13 + f.seed) * .12; f.aura.scale.set(1 + Math.sin(T * 9) * .06, s, 1 + Math.sin(T * 9) * .06);
    f.auraMat.opacity = .38 + Math.sin(T * 17 + f.seed) * .12;
    AURA_TEX.offset.x = T * .35;
  }
  function lightColumn(p, col, h = 14) {
    const mat = glowMat(col, .7), m = new THREE.Mesh(CYL_UNIT_GEO, mat);
    m.position.set(p.x, p.y + h / 2, p.z);
    addFx(m, .7, (o, k) => { const w = 1.6 * (1 + k * 1.5); o.scale.set(w, h * (.4 + easeOut(k) * .6), w); mat.opacity = .7 * (1 - k); }, () => freeGlowMat(mat));
    ringAt(_tmpBurst.set(p.x, p.y, p.z), col, 7, .6); ringAt(_tmpBurst, '#ffffff', 4.5, .4);
    burst(_tmpBurst.set(p.x, p.y + .3, p.z), 30, '#d8d0c0', 9, .25, .7, 1, 4);
  }
  // copias translúcidas alrededor del personaje (para las cinemáticas de elGatopro300)
  function copiesAround(f, n = 4, r = 1.8, life = 1, sc = scene) {
    for (let i = 0; i < n; i++) {
      const g = f.model.root.clone(true), mat = glowMat(f.ch.color, .35), a = f.yaw + i / n * TAU + .4;
      g.traverse(o => { if (o.isMesh) { if (o.material === f.model.mats[1] || o.material === OUTLINE_MAT || o.userData.fx) o.visible = false; else { o.material = mat; o.castShadow = false; } } });
      g.position.set(f.pos.x + Math.sin(a) * r, f.pos.y, f.pos.z + Math.cos(a) * r); g.rotation.y = a + Math.PI;
      addFx(g, life, (o, k) => { mat.opacity = .35 * Math.sin(k * Math.PI); o.position.y = f.pos.y + Math.sin(k * 6 + i) * .1; }, () => freeGlowMat(mat), sc);
    }
  }
  function screenFlash(op = .7) { if (dep.getFxMute()) return; const f = $('flash'); f.style.transition = 'none'; f.style.opacity = 0; try { f.animate([{ opacity: op }, { opacity: 0 }], { duration: 450, easing: 'ease-out' }); } catch (e) { } }
  function shakeFrom(p, amt) { const G = dep.getG(), d = camera.position.distanceTo(p); G.shake = Math.max(G.shake, amt * clamp(1 - d / 40, 0, 1)); }

  // ================= Números de daño (con pool DOM) =================
  const DN = [], DN_POOL = [], _v = new V3(), _scrOut = { x: 0, y: 0 }, _dnProj = new V3();
  function toScreen(v, cam = camera, out = null) {
    _v.copy(v).project(cam);
    if (_v.z > 1 || _v.z < -1) return null;
    const target = out || { x: 0, y: 0 };
    target.x = (_v.x * .5 + .5) * innerWidth;
    target.y = (-_v.y * .5 + .5) * innerHeight;
    return target;
  }
  function acquireNumNode(cls) {
    let el = DN_POOL.pop();
    if (!el) {
      el = document.createElement('div');
      $('nums').appendChild(el);
    }
    el.className = cls;
    el.style.display = '';
    return el;
  }
  function releaseNumNode(el) {
    el.style.display = 'none';
    if (DN_POOL.length < 64) DN_POOL.push(el);
    else el.remove();
  }
  function popText(p, text, col, size = 22) {
    const el = acquireNumNode('dn');
    el.textContent = text;
    el.style.color = col;
    el.style.fontSize = size + 'px';
    DN.push({ el, px: p.x + rand(-.4, .4), py: p.y + .9, pz: p.z + rand(-.4, .4), t: 0, rot: rand(-6, 6) });
  }
  function comicPop(p, text, burstClass = 'burst-gold', size = 32, rot = 0) {
    if (dep.getFxMute()) return;
    const el = acquireNumNode('comic-onom ' + burstClass);
    el.style.color = '';
    el.textContent = text;
    el.style.fontSize = size + 'px';
    DN.push({ el, isComic: true, px: p.x + rand(-.3, .3), py: p.y + 1.2, pz: p.z + rand(-.3, .3), t: 0, rot: rot || rand(-14, 14), dur: 0.85 });
  }
  function updateNums(dt) {
    for (let i = DN.length - 1; i >= 0; i--) {
      const d = DN[i]; d.t += dt; d.py += dt * (d.isComic ? 1.2 : 1.6);
      const maxT = d.dur || 0.9;
      if (d.t > maxT) { releaseNumNode(d.el); DN.splice(i, 1); continue; }
      const s = toScreen(_dnProj.set(d.px, d.py, d.pz), camera, _scrOut);
      if (!s) { d.el.style.opacity = 0; continue; }
      if (d.isComic) {
        const progress = d.t / maxT;
        const scale = d.t < 0.08 ? (0.2 + (d.t / 0.08) * 1.25) : d.t < 0.22 ? (1.45 - ((d.t - 0.08) / 0.14) * 0.45) : (1.0 - progress * 0.15);
        d.el.style.opacity = progress > 0.65 ? (1 - (progress - 0.65) / 0.35) : 1;
        d.el.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-50%) rotate(${d.rot}deg) scale(${scale.toFixed(3)})`;
      } else {
        d.el.style.opacity = 1 - Math.max(0, d.t - .5) / .4;
        d.el.style.transform = `translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-50%) rotate(${d.rot || 0}deg) scale(${(1 + Math.max(0, .15 - d.t) * 4).toFixed(3)})`;
      }
    }
  }

  // ====================================================================
  // MOTOR GRÁFICO ANIME: SISTEMAS DE EFECTOS AVANZADOS
  // ====================================================================

  // 1. Textura y material de sombra de contacto suave (Ground Ambient Occlusion)
  const CONTACT_SHADOW_TEX = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d', { willReadFrequently: true });
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.00, 'rgba(0, 0, 0, 0.90)'); // Centro negro profundo nítido
    grad.addColorStop(0.40, 'rgba(4, 6, 14, 0.70)');
    grad.addColorStop(0.75, 'rgba(10, 12, 22, 0.25)');
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.magFilter = t.minFilter = THREE.LinearFilter;
    return t;
  })();
  const CONTACT_SHADOW_MAT = new THREE.MeshBasicMaterial({
    map: CONTACT_SHADOW_TEX,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -2.0
  });

  function updateContactShadow(f) {
    if (!f || !f.pos) return;
    if (!f.contactShadow) {
      f.contactShadow = new THREE.Mesh(CONTACT_SHADOW_GEO, CONTACT_SHADOW_MAT.clone());
      f.contactShadow.rotation.x = -Math.PI / 2;
      scene.add(f.contactShadow);
    }
    const GFX_CFG = dep.getGFX_CFG(), G = dep.getG();
    if (!f.alive || !GFX_CFG.contactShadows || (G.state !== 'play' && G.state !== 'menu')) {
      f.contactShadow.visible = false;
      return;
    }
    const gy = dep.groundAt(f.pos.x, f.pos.z, f.pos.y + 0.1);
    const distY = Math.max(0, f.pos.y - gy);
    if (distY > 12) {
      f.contactShadow.visible = false;
      return;
    }
    const beta = ZZZ_U.beta.value > 0.5;
    const realShadows = beta && GFX_CFG.shadows && GFX_CFG.shadows !== 'off';
    f.contactShadow.visible = true;
    f.contactShadow.position.set(f.pos.x, gy + 0.045, f.pos.z);
    const scale = realShadows ? clamp(1.08 + distY * 0.14, 0.72, 2.0) : clamp(1.5 + distY * 0.18, 0.9, 2.8);
    f.contactShadow.scale.set(scale, scale, 1);
    f.contactShadow.material.opacity = realShadows ? clamp(0.62 - distY * 0.08, 0, 0.62) : clamp(0.88 - distY * 0.09, 0, 0.88);
  }

  // 2. Sistema de Auras de Despertar (Awakening Energy Flame Spires)
  const AURA_GEO = new THREE.CylinderGeometry(0.85, 1.3, 2.5, 12, 1, true);
  function updateAwakeningAura(f, dt) {
    if (!f || !f.pos || !f.model) return;
    const GFX_CFG = dep.getGFX_CFG(), G = dep.getG();
    const active = f.alive && f.awak > 0 && GFX_CFG.auras && G.state === 'play';
    if (!f.awakAura && active) {
      const col = f.ch.color || '#4fc3ff';
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(AURA_GEO, mat);
      mesh.position.y = 1.2;
      f.model.root.add(mesh);
      f.awakAura = { mesh, mat, col };
      // Explosión de activación anime
      ringAt(f.pos, col, 4.8, 0.55);
      sphereFlash(f.pos, col, 2.4, 0.4);
      if (f.isPlayer) { dep.camPunch(0.4, 1); G.shake = Math.max(G.shake, 0.35); }
      dep.sfx('boom', f.pos);
    }
    if (f.awakAura) {
      if (!active) {
        if (f.awakAura.mesh.parent) f.awakAura.mesh.parent.remove(f.awakAura.mesh);
        f.awakAura.mat.dispose();
        f.awakAura = null;
        if (f.model && f.model.mats) f.model.mats.forEach(m => m.emissive && m.emissive.setRGB(0, 0, 0));
        return;
      }
      const au = f.awakAura;
      const t = G.time;
      au.mesh.rotation.y += dt * 5.5;
      const pulse = 1.0 + Math.sin(t * 14) * 0.12;
      au.mesh.scale.set(pulse, 1.0 + Math.cos(t * 10) * 0.1, pulse);
      au.mat.opacity = 0.38 + Math.sin(t * 12) * 0.15;
      // Resplandor cel-shaded en los materiales del personaje
      if (f.model.mats) {
        const emPow = 0.35 + 0.18 * Math.sin(t * 9);
        f.model.mats.forEach(m => { if (m.emissive) m.emissive.set(au.col).multiplyScalar(emPow); });
      }
      // Chispas de energía ascendentes
      if (Math.random() < dt * 26) {
        const a = rand(0, TAU), r = rand(0.3, 0.9);
        emit(
          f.pos.x + Math.cos(a) * r,
          f.pos.y + rand(0.1, 1.8),
          f.pos.z + Math.sin(a) * r,
          rand(-0.2, 0.2), rand(3, 6), rand(-0.2, 0.2),
          Math.random() < 0.4 ? '#ffffff' : au.col,
          rand(0.08, 0.18), 0.45, -0.05, 1
        );
      }
    }
  }

  // 3. Sistema de Polvo y Viento Anime (Anime Dust Puffs)
  function animeDustRing(p, count = 10, maxR = 2.2, col = '#e4d8c5') {
    if (!dep.getGFX_CFG().dust) return;
    const gy = dep.groundAt(p.x, p.z, p.y + 0.2);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rand(-0.2, 0.2);
      const spd = rand(3.5, 7.5);
      const vx = Math.cos(a) * spd, vz = Math.sin(a) * spd;
      emit(
        p.x + Math.cos(a) * 0.4, gy + rand(0.05, 0.2), p.z + Math.sin(a) * 0.4,
        vx, rand(0.4, 1.8), vz,
        col, rand(0.12, 0.28), rand(0.3, 0.55), -0.6, 1
      );
    }
  }
  function animeDashSmoke(f) {
    if (!dep.getGFX_CFG().dust || !f || !f.pos) return;
    const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
    const gy = dep.groundAt(f.pos.x, f.pos.z, f.pos.y + 0.2);
    for (let i = 0; i < 4; i++) {
      emit(
        f.pos.x - fx * rand(0.3, 0.8) + rand(-0.3, 0.3),
        gy + rand(0.05, 0.25),
        f.pos.z - fz * rand(0.3, 0.8) + rand(-0.3, 0.3),
        -fx * rand(2, 5), rand(0.3, 1.2), -fz * rand(2, 5),
        '#e0d8cc', rand(0.15, 0.3), rand(0.3, 0.5), -0.5, 1
      );
    }
  }

  return {
    Parts, PS, emit, burst,
    FX, removeFx, addFx, updateFx, ADD, glowMat,
    ringAt, sphereFlash, slashLine, STAR_GEO, impactStar, arcSlash,
    ghost, warnCircle, fireColumn, iceSpikes, iceBlock,
    IMPACT, impactFrame, SPARK_GEO, sparkLines, CRACK_TEX, crackDecal,
    AURA_TEX, updateAura, lightColumn, copiesAround, screenFlash, shakeFrom,
    DN, toScreen, popText, comicPop, updateNums,
    CONTACT_SHADOW_TEX, CONTACT_SHADOW_MAT, updateContactShadow,
    AURA_GEO, updateAwakeningAura, animeDustRing, animeDashSmoke
  };
};
