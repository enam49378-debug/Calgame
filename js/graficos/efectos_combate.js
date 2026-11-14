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
      f.obj.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m)materials.add(m);});
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
  function glowMat(col, op = 1) { return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, blending: ADD, side: THREE.DoubleSide }); }
  function ringAt(p, col, maxR, dur = .45, mode = 'flat', yaw = 0, sc = scene) {
    const m = new THREE.Mesh(new THREE.RingGeometry(.78, 1, 40), glowMat(col));
    m.position.copy(p); if (mode === 'flat') { m.rotation.x = -Math.PI / 2; m.position.y += .08; } else m.rotation.y = yaw;
    addFx(m, dur, (m, k) => { const s = .2 + maxR * easeOut(k); m.scale.set(s, s, s); m.material.opacity = 1 - k; }, null, sc);
  }
  function sphereFlash(p, col, r, dur = .35) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), glowMat(col, .7));
    m.position.copy(p);
    addFx(m, dur, (m, k) => { const s = r * easeOut(k) + .1; m.scale.set(s, s, s); m.material.opacity = .7 * (1 - k); });
  }
  function slashLine(a, b, col, dur = .35, thick = .12, sc = scene) {
    const len = a.distanceTo(b) || .1;
    const m = new THREE.Mesh(new THREE.BoxGeometry(thick, thick, len), glowMat(col));
    m.position.copy(a).lerp(b, .5); m.lookAt(b);
    addFx(m, dur, (m, k) => { m.material.opacity = 1 - k; m.scale.set(1 + k * 3, 1 - k * .6, 1); }, null, sc);
  }
  const STAR_GEO = (() => { const s = new THREE.Shape(); s.moveTo(-1, 0); s.lineTo(0, .07); s.lineTo(1, 0); s.lineTo(0, -.07); s.closePath(); return new THREE.ShapeGeometry(s); })();
  function impactStar(p, col, size = 1.6, dur = .2, sc = scene) {
    const grp = new THREE.Group(), mat = glowMat(col), mw = glowMat('#ffffff'), zzz = ZZZ_U.on.value > .5;
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(STAR_GEO, i % 2 ? mat : mw); m.rotation.z = i * Math.PI / 4 + rand(-.2, .2); m.scale.set(i % 2 ? (zzz ? 1.2 : 1) : .65, zzz && i % 2 === 0 ? 1.4 : 1, 1); grp.add(m); }
    let mr = null, rg = null;
    if (zzz) { rg = new THREE.RingGeometry(.34, .48, 24); mr = glowMat(col, .95); grp.add(new THREE.Mesh(rg, mr)); }
    grp.position.copy(p);
    addFx(grp, dur, (g, k) => { const s = size * (k < .22 ? k / .22 : 1 + (k - .22) * .35); g.scale.set(s, s * (1 - k * .45), s); mat.opacity = mw.opacity = 1 - k * k; if (mr) mr.opacity = (1 - k) * .9; g.lookAt(camera.position); }, () => { mat.dispose(); mw.dispose(); if (mr) mr.dispose(); if (rg) rg.dispose(); }, sc);
  }
  function arcSlash(f, col, o = {}) {
    const r = o.r || 1.5, w = o.w || .5, len = o.len || 2.2, dir = o.dir || 1;
    const grp = new THREE.Group(); grp.position.set(f.pos.x, f.pos.y + (o.y || 1.15), f.pos.z); grp.rotation.y = f.yaw;
    const tilt = new THREE.Group(); tilt.rotation.z = o.tilt || 0; grp.add(tilt);
    const sw = new THREE.Group(); tilt.add(sw);
    const g1 = new THREE.RingGeometry(r - w, r, 28, 1, -Math.PI / 2 - len / 2, len), g2 = new THREE.RingGeometry(r - w * .28, r, 28, 1, -Math.PI / 2 - len / 2, len);
    const m1 = glowMat(col, .85), m2 = glowMat('#ffffff', .9);
    const a = new THREE.Mesh(g1, m1), b = new THREE.Mesh(g2, m2); a.rotation.x = b.rotation.x = -Math.PI / 2; sw.add(a, b);
    addFx(grp, o.dur || .22, (g, k) => { sw.rotation.y = dir * (1 - easeOut(Math.min(1, k * 2.2))) * -.9; const s = 1 + k * .18; sw.scale.set(s, s, s); m1.opacity = .85 * (1 - k * k); m2.opacity = .9 * (1 - k); }, () => { g1.dispose(); g2.dispose(); m1.dispose(); m2.dispose(); });
  }
  function ghost(f, col, op = .42, life = .3) {
    const g = f.model.root.clone(true), mat = glowMat(col, op);
    g.traverse(o => { if (o.isMesh) { if (o.material === f.model.mats[1] || o.material === OUTLINE_MAT || o.userData.fx) o.visible = false; else { o.material = mat; o.castShadow = false; } } });
    addFx(g, life, (m, k) => { mat.opacity = op * (1 - k); }, () => mat.dispose());
  }
  function warnCircle(p, r, col, dur) {
    const grp = new THREE.Group(); grp.position.set(p.x, p.y + .06, p.z);
    const cg = new THREE.CircleGeometry(r, 40), rg = new THREE.RingGeometry(r - .12, r, 48), cm = glowMat(col, .2), rm = glowMat(col, .9);
    const c = new THREE.Mesh(cg, cm), ri = new THREE.Mesh(rg, rm); c.rotation.x = ri.rotation.x = -Math.PI / 2; grp.add(c, ri);
    addFx(grp, dur, (g, k) => { cm.opacity = .12 + .2 * Math.abs(Math.sin(k * 18)); const s = .3 + .7 * easeOut(Math.min(1, k * 3)); c.scale.set(s, s, s); }, () => { cg.dispose(); rg.dispose(); cm.dispose(); rm.dispose(); });
  }
  function fireColumn(p, r, col, h = 8) {
    const g = new THREE.CylinderGeometry(r * .8, r, h, 20, 1, true), m = glowMat(col, .6), mesh = new THREE.Mesh(g, m);
    mesh.position.set(p.x, p.y + h / 2, p.z);
    addFx(mesh, .5, (o, k) => { o.scale.set(1 - k * .6, .3 + easeOut(k) * .7, 1 - k * .6); m.opacity = .6 * (1 - k); });
    for (let i = 0; i < 60; i++) { const a = rand(0, TAU), rr = rand(0, r); emit(p.x + Math.cos(a) * rr, p.y + .2, p.z + Math.sin(a) * rr, rand(-2, 2), rand(12, 28), rand(-2, 2), ['#ff6d00', '#ffab00', '#ffe082', '#ffffff'][i % 4], rand(.2, .45), rand(.4, .8), .4, 2); }
  }
  function iceSpikes(p, r, col, n = 9) {
    const cg = new THREE.ConeGeometry(.28, 1.8, 4);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), rr = rand(0, r), m = new THREE.Mesh(cg, glowMat(i % 3 ? col : '#ffffff', .8));
      m.position.set(p.x + Math.cos(a) * rr, p.y, p.z + Math.sin(a) * rr); m.rotation.set(rand(-.4, .4), rand(0, TAU), rand(-.4, .4));
      const hh = rand(.7, 1.5);
      addFx(m, rand(.8, 1.2), (o, k) => { const s = k < .15 ? k / .15 : 1; o.scale.set(s, s * hh, s); o.position.y = p.y + .8 * hh * s; o.material.opacity = k > .7 ? .8 * (1 - (k - .7) / .3) : .8; }, () => o_dispose(m));
    }
    const o_dispose = m => m.material.dispose();
    dep.later(1.3, () => cg.dispose());
    burst(new V3(p.x, p.y + .5, p.z), 26, '#dff6ff', 8, .2, .6, .6, 3);
  }
  function iceBlock(f, dur) {
    const g = new THREE.BoxGeometry(1.25, 2.3, 1.25), m = new THREE.MeshBasicMaterial({ color: '#bfe3ff', transparent: true, opacity: .45, depthWrite: false }), mesh = new THREE.Mesh(g, m);
    addFx(mesh, dur, (o, k) => { o.position.set(f.pos.x, f.pos.y + 1.1, f.pos.z); m.opacity = k > .85 ? .45 * (1 - (k - .85) / .15) : .45; if (!f.alive || f.frozen <= 0) o.visible = false; });
  }
  // Impacto anime / Zenless Wipeout: destello breve y corte de contraste en el posprocesado
  const IMPACT = { t: 0, dur: .11, col: '#ffffff', cd: 0, until: 0 };
  function impactFrame(col, dur = .11) {
    if (IMPACT.cd > 0 || dep.getFxMute()) return;
    const duration = clamp(Number.isFinite(dur) ? dur : .11, .04, .12);
    IMPACT.t = duration; IMPACT.dur = duration; IMPACT.col = col || '#ffffff'; IMPACT.cd = .45; IMPACT.until = performance.now() + duration * 1000;
    if (ZZZ_U.on.value > .5) { ZZZ_U.impact.value = 1; ZZZ_U.impactCol.value.set(IMPACT.col); }
    document.body.classList.add('impact-active');
    setTimeout(() => document.body.classList.remove('impact-active'), duration * 1000);
    const GFX = dep.getGFX(), gradePass = dep.getGradePass();
    const el = $('impact-flash'), useShader = GFX.post && ZZZ_U.on.value > .5 && gradePass && gradePass.enabled;
    for (const animation of el.getAnimations()) animation.cancel();
    el.animate([
      { opacity: useShader ? .22 : .88, background: '#ffffff', filter: useShader ? 'none' : 'invert(1) contrast(1.8)' },
      { opacity: useShader ? .12 : .55, background: IMPACT.col, filter: useShader ? 'none' : 'invert(0.6)', offset: .35 },
      { opacity: useShader ? .04 : .2, background: IMPACT.col, filter: 'none', offset: .7 },
      { opacity: 0, background: IMPACT.col, filter: 'none' }
    ], { duration: duration * 1000, easing: 'ease-out' });
  }
  // chispas: rayas finas que salen disparadas del punto de impacto
  const SPARK_GEO = new THREE.BoxGeometry(1, 1, 1);
  function sparkLines(p, col, n = 6, len = 1.6, sc = scene) {
    for (let i = 0; i < n; i++) {
      const mat = glowMat(i % 2 ? col : '#ffffff', 1), m = new THREE.Mesh(SPARK_GEO, mat), d = new V3(rand(-1, 1), rand(-.4, 1), rand(-1, 1)).normalize();
      m.position.copy(p); m.lookAt(p.clone().add(d)); const L = len * rand(.6, 1.3), w = rand(.03, .07);
      addFx(m, rand(.12, .2), (o, k) => { const e = easeOut(k); o.scale.set(w * (1 - k), w * (1 - k), L * (.3 + e)); o.position.copy(p).addScaledVector(d, L * (.2 + e * .7)); mat.opacity = 1 - k; }, () => mat.dispose(), sc);
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
  function crackDecal(p, r) {
    const mat = new THREE.MeshBasicMaterial({ map: CRACK_TEX, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), mat);
    m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, TAU); m.position.set(p.x, p.y + .03, p.z);
    addFx(m, 3, (o, k) => { mat.opacity = k < .75 ? 1 : 1 - (k - .75) / .25; });
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
  function updateAura(f, dt, T) {
    const on = f.alive && f.awak > 0;
    if (!f.aura) {
      if (!on) return;
      const mat = new THREE.MeshBasicMaterial({ map: AURA_TEX, color: f.ch.color, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const g = new THREE.Group(), geo = new THREE.PlaneGeometry(1.5, 2.9);
      for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(geo, mat); p.rotation.y = i * Math.PI / 3; p.position.y = 1.3; p.userData.fx = true; g.add(p); }
      g.userData.fx = true; f.model.root.add(g); f.aura = g; f.auraMat = mat;
    }
    f.aura.visible = on; if (!on) return;
    f.aura.rotation.y += dt * 2.5;
    const s = 1 + Math.sin(T * 13 + f.seed) * .12; f.aura.scale.set(1 + Math.sin(T * 9) * .06, s, 1 + Math.sin(T * 9) * .06);
    f.auraMat.opacity = .38 + Math.sin(T * 17 + f.seed) * .12;
    AURA_TEX.offset.x = T * .35;
  }
  function lightColumn(p, col, h = 14) {
    const geo = new THREE.CylinderGeometry(.9, 1.6, h, 20, 1, true), mat = glowMat(col, .7), m = new THREE.Mesh(geo, mat);
    m.position.set(p.x, p.y + h / 2, p.z);
    addFx(m, .7, (o, k) => { o.scale.set(1 + k * 1.5, .4 + easeOut(k) * .6, 1 + k * 1.5); mat.opacity = .7 * (1 - k); });
    ringAt(new V3(p.x, p.y, p.z), col, 7, .6); ringAt(new V3(p.x, p.y, p.z), '#ffffff', 4.5, .4);
    burst(new V3(p.x, p.y + .3, p.z), 30, '#d8d0c0', 9, .25, .7, 1, 4);
  }
  // copias translúcidas alrededor del personaje (para las cinemáticas de elGatopro300)
  function copiesAround(f, n = 4, r = 1.8, life = 1, sc = scene) {
    for (let i = 0; i < n; i++) {
      const g = f.model.root.clone(true), mat = glowMat(f.ch.color, .35), a = f.yaw + i / n * TAU + .4;
      g.traverse(o => { if (o.isMesh) { if (o.material === f.model.mats[1] || o.material === OUTLINE_MAT || o.userData.fx) o.visible = false; else { o.material = mat; o.castShadow = false; } } });
      g.position.set(f.pos.x + Math.sin(a) * r, f.pos.y, f.pos.z + Math.cos(a) * r); g.rotation.y = a + Math.PI;
      addFx(g, life, (o, k) => { mat.opacity = .35 * Math.sin(k * Math.PI); o.position.y = f.pos.y + Math.sin(k * 6 + i) * .1; }, () => mat.dispose(), sc);
    }
  }
  function screenFlash(op = .7) { if (dep.getFxMute()) return; const f = $('flash'); f.style.transition = 'none'; f.style.opacity = 0; try { f.animate([{ opacity: op }, { opacity: 0 }], { duration: 450, easing: 'ease-out' }); } catch (e) { } }
  function shakeFrom(p, amt) { const G = dep.getG(), d = camera.position.distanceTo(p); G.shake = Math.max(G.shake, amt * clamp(1 - d / 40, 0, 1)); }

  // ================= Números de daño =================
  const DN = [], _v = new V3();
  function toScreen(v, cam = camera) { _v.copy(v).project(cam); if (_v.z > 1 || _v.z < -1) return null; return { x: (_v.x * .5 + .5) * innerWidth, y: (-_v.y * .5 + .5) * innerHeight }; }
  function popText(p, text, col, size = 22) {
    const el = document.createElement('div'); el.className = 'dn'; el.textContent = text; el.style.color = col; el.style.fontSize = size + 'px';
    $('nums').appendChild(el); DN.push({ el, p: p.clone().add(new V3(rand(-.4, .4), .9, rand(-.4, .4))), t: 0, rot: rand(-6, 6) });
  }
  function comicPop(p, text, burstClass = 'burst-gold', size = 32, rot = 0) {
    if (dep.getFxMute()) return;
    const el = document.createElement('div');
    el.className = 'comic-onom ' + burstClass;
    el.textContent = text;
    el.style.fontSize = size + 'px';
    $('nums').appendChild(el);
    DN.push({ el, isComic: true, p: p.clone().add(new V3(rand(-.3, .3), 1.2, rand(-.3, .3))), t: 0, rot: rot || rand(-14, 14), dur: 0.85 });
  }
  function updateNums(dt) {
    for (let i = DN.length - 1; i >= 0; i--) {
      const d = DN[i]; d.t += dt; d.p.y += dt * (d.isComic ? 1.2 : 1.6);
      const maxT = d.dur || 0.9;
      if (d.t > maxT) { d.el.remove(); DN.splice(i, 1); continue; }
      const s = toScreen(d.p);
      if (!s) { d.el.style.opacity = 0; continue; }
      if (d.isComic) {
        const progress = d.t / maxT;
        const scale = d.t < 0.08 ? (0.2 + (d.t / 0.08) * 1.25) : d.t < 0.22 ? (1.45 - ((d.t - 0.08) / 0.14) * 0.45) : (1.0 - progress * 0.15);
        d.el.style.opacity = progress > 0.65 ? (1 - (progress - 0.65) / 0.35) : 1;
        d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${d.rot}deg) scale(${scale})`;
      } else {
        d.el.style.opacity = 1 - Math.max(0, d.t - .5) / .4;
        d.el.style.transform = `translate(${s.x}px,${s.y}px) translate(-50%,-50%) rotate(${d.rot || 0}deg) scale(${1 + Math.max(0, .15 - d.t) * 4})`;
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
      f.contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), CONTACT_SHADOW_MAT.clone());
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
    const F = fwd(f.yaw);
    const gy = dep.groundAt(f.pos.x, f.pos.z, f.pos.y + 0.2);
    for (let i = 0; i < 4; i++) {
      emit(
        f.pos.x - F.x * rand(0.3, 0.8) + rand(-0.3, 0.3),
        gy + rand(0.05, 0.25),
        f.pos.z - F.z * rand(0.3, 0.8) + rand(-0.3, 0.3),
        -F.x * rand(2, 5), rand(0.3, 1.2), -F.z * rand(2, 5),
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
