// Escena del selector de personajes
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearSelector = function crearSelector(D) {
  'use strict';
  const { $, AWAKE_DUR, Animator, CHARS, G, POSE, Parts, STAT_NAMES, TAU, V3, WEAPONS, ZZZ_U, addEyes, bbSet, buildFighterModel, buildTrack, charSkin, copyCanvas, disposeModel, eyeGlow, glowMat, headPortrait, javiBBTrack, jlLocomotion, pixTex, rand, ringAt, setSpear, setupFace, sfx, stancePose, startTwirl, twirlAngle, updateFace } = D;

// ================= Escena del selector =================
const SH = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(36, innerWidth / innerHeight, .1, 100), fig: null, t: 0, kf: null, kfT: 0, drop: 0, landed: true, flourT: 7, camZ: 9, bg: document.createElement('canvas') };
{
  const s = SH.scene; s.background = new THREE.Color(0x07080d); s.fog = new THREE.Fog(0x07080d, 9, 22);
  SH.hemi = new THREE.HemisphereLight(0xbfc8ff, 0x101018, .55); s.add(SH.hemi);
  const key = new THREE.DirectionalLight(0xffffff, .95); key.position.set(2.5, 5, 5); key.castShadow = true; SH.key = key;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4, bottom: -2, far: 20 }); s.add(key);
  SH.rim = new THREE.DirectionalLight(0xff4d4d, .8); SH.rim.position.set(-3, 3, -4); s.add(SH.rim);
  SH.rim2 = new THREE.PointLight(0xff4d4d, .55, 6); SH.rim2.position.set(0, .3, 1.2); s.add(SH.rim2);
  SH.coolRim = new THREE.DirectionalLight(0x64d8ff, 0); SH.coolRim.position.set(3.4, 2.8, -3.5); s.add(SH.coolRim);
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.65, .2, 6), new THREE.MeshLambertMaterial({ color: 0x17181f }));
  plat.position.y = 0; plat.receiveShadow = true; s.add(plat);
  SH.ring = new THREE.Mesh(new THREE.RingGeometry(1.52, 1.74, 32), glowMat('#ff4d4d', 1.0)); SH.ring.rotation.x = -Math.PI / 2; SH.ring.position.y = .12; s.add(SH.ring);
  // Anillo de energía exterior pulsante en el selector
  SH.ring2 = new THREE.Mesh(new THREE.RingGeometry(1.82, 1.94, 32), glowMat('#4fc3ff', .7)); SH.ring2.rotation.x = -Math.PI / 2; SH.ring2.position.y = .08; s.add(SH.ring2);
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 64;
  { const gg = glowC.getContext('2d'), gr = gg.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64); }
  SH.floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 7.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowC), color: 0xff4d4d, transparent: true, opacity: .38, depthWrite: false, blending: THREE.AdditiveBlending }));
  SH.floorGlow.rotation.x = -Math.PI / 2; SH.floorGlow.position.y = -.08; SH.floorGlow.visible = false; s.add(SH.floorGlow);
  SH.floorMat = new THREE.MeshPhongMaterial({
    map: pixTex(32, 32, g => { g.fillStyle = '#0c0d14'; g.fillRect(0, 0, 32, 32); g.fillStyle = '#171927'; g.fillRect(0, 0, 32, 1); g.fillRect(0, 0, 1, 32); }),
    shininess: 0, specular: 0x000000
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), SH.floorMat);
  floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping; floor.material.map.repeat.set(20, 20);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.1; floor.receiveShadow = true; s.add(floor);
  SH.bg.width = 1024; SH.bg.height = 512;
  SH.bgTex = new THREE.CanvasTexture(SH.bg); SH.bgTex.wrapS = THREE.RepeatWrapping;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: SH.bgTex, fog: false }));
  back.position.set(1, 3.6, -5); s.add(back);
  SH.parts = new Parts(s, 500);
}
function syncStudioBeta(ch) {
  const beta = typeof ZZZ_U !== 'undefined' && ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
  if (SH.hemi) SH.hemi.intensity = beta ? .42 : .55;
  if (SH.rim) SH.rim.intensity = beta ? 1.05 : .8;
  if (SH.rim2) SH.rim2.intensity = beta ? .85 : .55;
  if (SH.coolRim) SH.coolRim.intensity = beta ? .72 : 0;
  if (SH.floorMat) {
    SH.floorMat.shininess = beta ? 92 : 0;
    if (beta) SH.floorMat.specular.setHex(0x283962); else SH.floorMat.specular.setHex(0x000000);
  }
  if (SH.floorGlow) {
    SH.floorGlow.visible = beta;
    if (ch && ch.color) SH.floorGlow.material.color.set(ch.color);
  }
  if (ch) drawBackdrop(ch);
}
function drawBackdrop(ch) {
  const g = SH.bg.getContext('2d'), w = 1024, h = 512, beta = typeof ZZZ_U !== 'undefined' && ZZZ_U.beta.value > .5 && ZZZ_U.on.value > .5;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, beta ? '#0e1120' : '#0c0d16'); gr.addColorStop(1, '#05060a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (beta) {
    const rg = g.createRadialGradient(w * .52, h * .54, 18, w * .52, h * .54, 340);
    rg.addColorStop(0, ch.color); rg.addColorStop(.55, ch.color); rg.addColorStop(1, 'rgba(5,6,10,0)');
    g.save(); g.globalAlpha = .22; g.fillStyle = rg; g.fillRect(0, 0, w, h); g.restore();
  }
  g.save(); g.globalAlpha = beta ? .20 : .16; g.fillStyle = ch.color;
  for (let x = -h; x < w + h; x += 90) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 36, h); g.lineTo(x + 36 + h * .6, 0); g.lineTo(x + h * .6, 0); g.closePath(); g.fill(); }
  g.restore();
  g.save(); g.translate(w * .5, h * .62); g.rotate(-.08);
  g.font = '260px Anton, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = beta ? .95 : .9; g.lineWidth = beta ? 5 : 4; g.strokeStyle = ch.color; g.strokeText(ch.name.toUpperCase(), 0, 0);
  g.globalAlpha = beta ? .12 : .08; g.fillStyle = ch.color; g.fillText(ch.name.toUpperCase(), 0, 0);
  g.restore();
  g.globalAlpha = beta ? .15 : .1; g.fillStyle = '#ffffff'; g.font = '700 22px "Chakra Petch", sans-serif';
  const lineTxt = beta ? ('AGENT PROFILE // ' + ch.role + ' // ' + ch.title.toUpperCase() + ' // ') : ('CALFIGHT // ' + ch.role + ' // ' + ch.title.toUpperCase() + ' // ');
  for (let y = 40; y < h; y += 70) g.fillText(lineTxt, (y * 3) % 200 - 200, y);
  g.globalAlpha = beta ? .34 : .25; g.fillStyle = ch.color;
  for (let i = 0; i < 14; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(w - 40 - i * 18, 30 + j * 18, Math.max(.5, 6 - i * .45), 0, TAU); g.fill(); }
  g.globalAlpha = 1; SH.bgTex.needsUpdate = true;
}
function showSelect(id, quiet) {
  const ch = CHARS[id]; if (!quiet) { try { localStorage.setItem('bsb_lastchar', id); } catch (e) { } }
  if (SH.fig) disposeModel(SH.fig.model);
  const skin = G.customSkin || charSkin(id), faceC = copyCanvas(skin);
  const model = buildFighterModel(ch, faceC, !!G.customSkin, G.customSkin ? G.customSlim : !!ch.slim, SH.scene);
  SH.fig = { model, anim: new Animator(model), ch, alive: true };
  if (!model.jlRig) setupFace(SH.fig, faceC, !G.customSkin);
  if (WEAPONS[ch.weapon]) { SH.fig.spear = WEAPONS[ch.weapon](); model.mats.push(SH.fig.spear.material); setSpear(SH.fig, false); }
  if (ch.eyeLaser) addEyes(model, ch.color);
  model.root.position.set(0, 4, 0); model.root.rotation.y = .35;
  SH.drop = 0; SH.landed = false; SH.kf = null; SH.track = null; SH.camZ = quiet ? 5 : 8; SH.flourT = rand(6, 8);
  SH.rim.color.set(ch.color); SH.rim2.color.set(ch.color); SH.ring.material.color.set(ch.color); if(SH.ring2) SH.ring2.material.color.set(ch.color);
  syncStudioBeta(ch);
  const menu = $('menu'); menu.style.setProperty('--c', ch.color);
  $('crole').textContent = ch.role; $('cname').textContent = ch.name.toUpperCase(); $('cname').classList.toggle('long', ch.name.length > 9); $('ctitle').textContent = ch.title.toUpperCase(); $('cdesc').textContent = ch.desc;
  const st = $('cstats'); st.innerHTML = '';
  ch.stats.forEach((v, i) => {
    const l = document.createElement('span'); l.textContent = STAT_NAMES[i];
    const seg = document.createElement('div'); seg.className = 'seg';
    for (let k = 0; k < 5; k++) { const e = document.createElement('i'); seg.appendChild(e); setTimeout(() => { if (k < v) e.classList.add('on'); }, 80 + k * 60 + i * 40); }
    st.append(l, seg);
  });
  const ul = $('cskills'); ul.innerHTML = '';
  const li = (key, s, u) => { const e = document.createElement('li'); if (u) e.className = 'u'; const b = document.createElement('b'); b.textContent = key; const n = document.createElement('strong'); n.textContent = s.n; const d = document.createElement('span'); d.textContent = s.d; e.append(b, n, d); ul.appendChild(e); };
  ch.skills.forEach((s, i) => li(i + 1, s));
  li('G', ch.awk ? { n: 'Despertar: ' + ch.ult.n, d: `Durante ${AWAKE_DUR} s tus habilidades cambian por: ${ch.awk.map(s => s.n).join(', ')}.` } : ch.ult, true);
  const ci = $('cinfo'); ci.classList.remove('swap'); void ci.offsetWidth; ci.classList.add('swap');
  document.querySelectorAll('.rc').forEach(b => b.classList.toggle('sel', b.dataset.id === id));
  headPortrait(skin, $('skinprev'));
  if (!quiet) { sfx('select'); sfx('whoosh'); }
  D.netMenuPresence();
}
function updateShow(dt) {
  SH.t += dt; const f = SH.fig; if (!f) return;
  const ch = f.ch;
  if (D.ED.on) { D.edShowFrame(f, dt); return; }
  if (!SH.landed) {
    SH.drop += dt; const k = Math.min(1, SH.drop / .3);
    f.model.root.position.y = 4 - 3.9 * k * k;
    f.anim.update(dt, POSE.fall, 300, .7);
    if (k >= 1) {
      SH.landed = true; SH.kf = ch.intro; SH.kfT = -.14; SH.track = null; f.anim.v.by -= 40;
      SH.parts.burst(new V3(0, .2, 0), 40, ch.color, 7, .12, .6, .4, 2); SH.parts.burst(new V3(0, .2, 0), 20, '#ffffff', 6, .08, .4, .4, 2);
      ringAt(new V3(0, .05, 0), ch.color, 3.2, .5, 'flat', 0, SH.scene); ringAt(new V3(0, .05, 0), '#ffffff', 2.2, .35, 'flat', 0, SH.scene);
      sfx('drop');
    }
  } else {
    let pose = null, k = 550, useTrack = false;
    if (SH.kf) {
      SH.kfT += dt;
      if (SH.kfT < 0) pose = POSE.land;
      else {
        if (!SH.track) SH.track = buildTrack(SH.kf, Object.assign({}, f.anim.x), SH.kfT);
        useTrack = true;
        if (f.spear && !f.spearOut && SH.kfT >= (ch.introDraw || 0)) { setSpear(f, true); startTwirl(f, 2, .5); sfx('draw'); ringAt(new V3(0, 1.2, 0), ch.color, 1.6, .3, 'face', .35, SH.scene); }
        if (SH.kfT > SH.kf[SH.kf.length - 1][0] + .7) { SH.kf = null; SH.track = null; useTrack = false; }
      }
    }
    if (!SH.kf) {
      pose = stancePose(ch, SH.t, 0, f.spearOut); k = 180;
      SH.flourT -= dt; if (SH.flourT <= 0) { SH.flourT = rand(7, 10); SH.kf = ch.flourish ? ch.flourish.anim : ch.intro; SH.kfT = 0; SH.track = null; if (ch.flourish && ch.flourish.twirl) startTwirl(f, ch.flourish.twirl[0], ch.flourish.twirl[1]); }
    }
    const shD = bbSet(ch.id), shName = shD && (SH.kf ? (SH.kf === ch.intro ? 'entrada_menu' : 'lucimiento') : ('idle'));
    if(shD && shD[shName] && SH.kfT>=0) {
      f.anim.bbR6=true;f.anim.play(javiBBTrack(shName, ch.id),SH.kf?SH.kfT:SH.t%shD[shName].length,dt,true);
    } else {f.anim.bbR6=false;if (useTrack && SH.track) f.anim.play(SH.track, SH.kfT, dt); else f.anim.update(dt, pose, k, .62);}
  }
  if (!SH.kf && SH.landed) jlLocomotion(f, dt, 0, true);
  f.model.root.rotation.y = .35 + Math.sin(SH.t * .45) * .12;
  if (f.model.gripRot) f.model.gripRot.rotation.x = f.anim.x.sx + twirlAngle(f, dt);
  if (SH.landed && !SH.kf && f.spearOut && Math.random() < dt * .25) startTwirl(f, 1, .4);
  eyeGlow(f.model, !!(SH.kf && SH.kfT > .1 && SH.kfT < .7), SH.t);
  f.action = SH.kf ? { name: 'flourish', t: SH.kfT } : null; updateFace(f, dt);
  if (Math.random() < dt * 40) { const a = rand(0, TAU), r = rand(.3, 1.6); SH.parts.emit(Math.cos(a) * r, .15, Math.sin(a) * r, 0, rand(.8, 2), 0, Math.random() < .3 ? '#ffffff' : ch.color, rand(.04, .09), rand(1, 2), -.02, .3); }
  SH.parts.update(dt);
  SH.bgTex.offset.x += dt * .012;
  SH.ring.rotation.z += dt * .4; if(SH.ring2) SH.ring2.rotation.z -= dt * .25;
  if (SH.floorGlow && SH.floorGlow.visible) {
    const gp = 1 + Math.sin(SH.t * 2.4) * .05;
    SH.floorGlow.scale.set(gp, gp, 1);
    SH.floorGlow.material.opacity = .36 + Math.sin(SH.t * 2.4) * .08;
  }
  const keyWant = SH.faceZoom ? .5 : (ZZZ_U.beta.value > .5 ? 1.08 : .95);
  SH.key.intensity += (keyWant - SH.key.intensity) * Math.min(1, dt * 4);   // de cerca la cara se quema con la luz principal
  SH.camZ += ((SH.faceZoom ? 3.1 : 5.5) - SH.camZ) * Math.min(1, dt * 3.5);
  const ox = SH.faceZoom ? (innerWidth > 820 ? .7 : 0) : (innerWidth > 820 ? 1.0 : 0);
  SH.cam.position.set(ox + Math.sin(SH.t * .3) * .15, SH.faceZoom ? 1.78 : 1.4, SH.camZ);
  SH.cam.lookAt(ox, SH.faceZoom ? 1.72 : 1.05, 0);
}

  return { SH, drawBackdrop, showSelect, syncStudioBeta, updateShow };
};
