// ====================================================================
// ESCENARIO DE ULTI (DOMINIO VISUAL) Y GRADACIÓN DE CINEMÁTICA
// ====================================================================
// Espacio estilizado tipo ZZZ al que viajan las cinemáticas de ulti (`STAGE`)
// y oscurecimiento dramático del mundo (`cineGrade`).
window.CF_GRAFICOS = window.CF_GRAFICOS || {};

window.CF_GRAFICOS.crearEscenarioUlti = function crearEscenarioUlti(dep) {
  const {
    scene, sun, HEMI, CINE_RIM, CINE_KEY, BLOCK_TEX,
    rand, TAU, ZZZ_U
  } = dep;

  const STAGE = { scene: new THREE.Scene(), root: new THREE.Group(), themes: {}, on: false, t: 0, ready: false };
  function initStage() {
    if (STAGE.ready) return; STAGE.ready = true;
    const S = STAGE.scene, R = STAGE.root; S.add(R);
    S.background = new THREE.Color(0x05060a); S.fog = new THREE.Fog(0x05060a, 12, 40);
    STAGE.hemi = new THREE.HemisphereLight(0xffffff, 0x101018, .45); S.add(STAGE.hemi);
    STAGE.rim = new THREE.PointLight(0xffffff, 3, 10); STAGE.key = new THREE.PointLight(0xffffff, .8, 8);
    STAGE.fill = new THREE.PointLight(0xd8ecff, 0, 9); R.add(STAGE.rim, STAGE.key, STAGE.fill);
    // fondo con degradé del color del personaje
    const bc = document.createElement('canvas'); bc.width = 8; bc.height = 256; const bg = bc.getContext('2d', { willReadFrequently: true });
    const gr = bg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#000'); gr.addColorStop(.45, '#fff'); gr.addColorStop(.62, '#555'); gr.addColorStop(1, '#000'); bg.fillStyle = gr; bg.fillRect(0, 0, 8, 256);
    STAGE.skyMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), side: THREE.BackSide, fog: false, depthWrite: false });
    R.add(new THREE.Mesh(new THREE.SphereGeometry(60, 24, 12), STAGE.skyMat));
    // remolino de energía (cilindro con rayas que giran)
    const sc = document.createElement('canvas'); sc.width = 256; sc.height = 64; const sg = sc.getContext('2d', { willReadFrequently: true });
    for (let i = 0; i < 18; i++) { sg.fillStyle = `rgba(255,255,255,${rand(.15, .6)})`; const x = rand(0, 256), w = rand(3, 14); sg.beginPath(); sg.moveTo(x, 0); sg.lineTo(x + w, 0); sg.lineTo(x + w - 40, 64); sg.lineTo(x - 40, 64); sg.fill(); }
    STAGE.swirlTex = new THREE.CanvasTexture(sc); STAGE.swirlTex.wrapS = STAGE.swirlTex.wrapT = THREE.RepeatWrapping; STAGE.swirlTex.repeat.set(3, 2);
    STAGE.swirlMat = new THREE.MeshBasicMaterial({ map: STAGE.swirlTex, transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false, fog: false });
    const sw = new THREE.Mesh(new THREE.CylinderGeometry(7, 4.5, 26, 40, 1, true), STAGE.swirlMat); sw.position.y = 6; R.add(sw);
    // piso oscuro brillante con anillos
    STAGE.floorMat = new THREE.MeshPhongMaterial({ color: 0x0b0c12, shininess: 90, specular: 0x444466 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 48), STAGE.floorMat);
    floor.rotation.x = -Math.PI / 2; R.add(floor);
    STAGE.rings = [2.2, 3.4, 5].map((r, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(r - .05, r, 64), dep.glowMat('#ffffff', .8)); m.rotation.x = -Math.PI / 2; m.position.y = .02 + i * .01; R.add(m); return m; });
    STAGE.halos = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * .7, .03, 6, 64), dep.glowMat('#ffffff', .8)); m.position.y = 1.2; R.add(m); return m; });
    // bloques de Minecraft flotando en órbita
    STAGE.blocks = [];
    const bk = Object.keys(BLOCK_TEX);
    for (let i = 0; i < 34; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.55, .55, .55), new THREE.MeshLambertMaterial({ map: BLOCK_TEX[bk[i % bk.length]] }));
      m.userData = { r: rand(3.5, 9), a: rand(0, TAU), y: rand(-.5, 6), s: rand(.15, .5) * (Math.random() < .5 ? 1 : -1), spin: rand(.5, 2) };
      R.add(m); STAGE.blocks.push(m);
    }
    // temas de cada personaje
    const jv = new THREE.Group();
    for (let i = 0; i < 14; i++) { const s = dep.buildSpear(1.6), a = i / 14 * TAU; s.position.set(Math.cos(a) * 6, 2 + Math.sin(i * 1.7) * 1.4, Math.sin(a) * 6); s.lookAt(0, 1.2, 0); s.userData.a = a; jv.add(s); }
    STAGE.themes.javi = jv;
    const gt = new THREE.Group();
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.2 + i * .9, .04, 6, 6), dep.glowMat('#3ddc84', .6)); m.rotation.x = Math.PI / 2; m.position.y = .4 + i * .9; gt.add(m); }
    STAGE.themes.gato = gt;
    const rb = new THREE.Group();
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, 30), dep.glowMat('#ff2d55', .8)); m.position.set(rand(-8, 8), rand(.5, 7), rand(-8, 8)); m.rotation.y = rand(0, TAU); rb.add(m); }
    STAGE.themes.redbird = rb;
    for (const k in STAGE.themes) { STAGE.themes[k].visible = false; R.add(STAGE.themes[k]); }
    STAGE.parts = new dep.Parts(S, 500);
  }
  function stageEnter(f) {
    initStage();
    const col = new THREE.Color(f.ch.color);
    const beta = !!(ZZZ_U && ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5);
    if (beta) {
      STAGE.scene.background.copy(col).multiplyScalar(.045);
      STAGE.scene.fog.color.copy(STAGE.scene.background);
      STAGE.hemi.intensity = .34;
      STAGE.rim.intensity = 3.8;
      STAGE.key.intensity = 1.05;
      if (STAGE.fill) { STAGE.fill.color.copy(col).lerp(new THREE.Color(0xbce8ff), .75); STAGE.fill.intensity = .85; }
      if (STAGE.floorMat) { STAGE.floorMat.specular.copy(col).multiplyScalar(.65); STAGE.floorMat.shininess = 120; }
    } else {
      STAGE.scene.background.setHex(0x05060a);
      STAGE.scene.fog.color.setHex(0x05060a);
      STAGE.hemi.intensity = .45;
      STAGE.rim.intensity = 3;
      STAGE.key.intensity = .8;
      if (STAGE.fill) STAGE.fill.intensity = 0;
      if (STAGE.floorMat) { STAGE.floorMat.specular.setHex(0x444466); STAGE.floorMat.shininess = 90; }
    }
    STAGE.skyMat.color.copy(col).multiplyScalar(beta ? .62 : .55); STAGE.swirlMat.color.copy(col); STAGE.rim.color.copy(col);
    STAGE.rings.concat(STAGE.halos).forEach((m, i) => m.material.color.set(i % 2 ? '#ffffff' : f.ch.color));
    STAGE.root.position.set(f.pos.x, f.pos.y, f.pos.z); STAGE.root.rotation.y = f.yaw;
    const CHARS = dep.getCHARS(), id = Object.keys(CHARS).find(k => CHARS[k] === f.ch);
    for (const k in STAGE.themes) STAGE.themes[k].visible = k === id;
    STAGE.scene.add(f.model.root); STAGE.on = true; STAGE.f = f; STAGE.t = 0;
  }
  function stageExit() {
    if (!STAGE.on) return;
    const f = STAGE.f; scene.add(f.model.root); STAGE.on = false; STAGE.f = null; STAGE.parts.clear();
  }
  function updateStage(dt) {
    STAGE.t += dt; const T = STAGE.t, f = STAGE.f;
    const beta = !!(ZZZ_U && ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5);
    STAGE.swirlTex.offset.x -= dt * (beta ? 1.15 : .9); STAGE.swirlTex.offset.y += dt * .4;
    STAGE.halos.forEach((m, i) => { m.rotation.x = Math.PI / 2 + Math.sin(T * 1.3 + i) * .5; m.rotation.y = T * (1 + i * .5); });
    STAGE.rings.forEach((m, i) => { const k = (T * .8 + i * .33) % 1, s = 1 + k * (beta ? .42 : .35); m.scale.set(s, s, s); m.material.opacity = beta ? .95 * (1 - k * k) : (.9 - k * .7); });
    for (const b of STAGE.blocks) { const u = b.userData; u.a += u.s * dt; b.position.set(Math.cos(u.a) * u.r, u.y + Math.sin(T + u.r) * .3, Math.sin(u.a) * u.r); b.rotation.x += u.spin * dt; b.rotation.y += u.spin * dt * .7; }
    const jv = STAGE.themes.javi; if (jv.visible) jv.children.forEach((s, i) => { const a = s.userData.a + T * .4, r = 6.5 - Math.min(1.3, T * .7); s.position.set(Math.cos(a) * r, 2 + Math.sin(i * 1.7 + T * 2) * 1.2, Math.sin(a) * r); s.lookAt(0, 1.2, 0); });
    const gt = STAGE.themes.gato; if (gt.visible) gt.children.forEach((m, i) => { m.rotation.z = T * (i % 2 ? 1.5 : -1.5); m.scale.setScalar(1 + Math.sin(T * 4 + i) * .08); });
    const rb = STAGE.themes.redbird; if (rb.visible) rb.children.forEach((m, i) => { m.rotation.y += dt * (i % 2 ? .8 : -.8); m.material.opacity = .4 + .4 * Math.abs(Math.sin(T * 9 + i)); });
    if (f) {
      STAGE.rim.position.set(0, 2.4, -1.6); STAGE.key.position.set(0, 1.6, 2.2);
      if (STAGE.fill) STAGE.fill.position.set(1.8, 1.35, 1.4);
      const a = rand(0, TAU), r = rand(1.2, 3);
      STAGE.parts.emit(f.pos.x + Math.cos(a) * r, f.pos.y + rand(0, .4), f.pos.z + Math.sin(a) * r, 0, rand(2, 6), 0, Math.random() < .3 ? '#ffffff' : f.ch.color, rand(.04, .09), rand(.6, 1.2), -.15, .5);
    }
    STAGE.parts.update(dt);
  }
  function cineGrade(on, f) {
    const G = dep.getG(); if (on && !G.grade) {
      const beta = !!(ZZZ_U && ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5);
      G.grade = { bg: scene.background, fog: scene.fog, hemi: HEMI.intensity, sun: sun.intensity };
      const dark = new THREE.Color(f.ch.color).multiplyScalar(beta ? .055 : .1);
      scene.background = dark; scene.fog = new THREE.Fog(dark, 6, 30);
      HEMI.intensity = beta ? .20 : .3; sun.intensity = beta ? .24 : .3; dep.getSkyObjs().forEach(o => { o.visible = false; });
      CINE_RIM.color.set(f.ch.color); CINE_RIM.intensity = beta ? 3.4 : 2.6; CINE_KEY.intensity = beta ? .72 : .6;
    } else if (!on && G.grade) {
      scene.background = G.grade.bg; scene.fog = G.grade.fog; HEMI.intensity = G.grade.hemi; sun.intensity = G.grade.sun;
      dep.getSkyObjs().forEach(o => { o.visible = true; }); CINE_RIM.intensity = 0; CINE_KEY.intensity = 0; G.grade = null;
    }
  }

  return { STAGE, initStage, stageEnter, stageExit, updateStage, cineGrade };
};
