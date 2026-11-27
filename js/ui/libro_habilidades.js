// Libro de habilidades
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearLibroHabilidades = function crearLibroHabilidades(D) {
  'use strict';
  const { $, BINDS, CAMFX, CB, CB_BASIC, CHARS, CHAR_IDS, CHORE, DN, DUMMY_CH, FX, Fighter, G, GFX, GS, IMPACT, IS_GUIDE, NEUTRAL, PROJ, PS, TIMERS, ZONES, aiParams, cam, camera, charSkin, choreEnd, cineGrade, clamp, clearSkillObjs, destRestore, endCamScript, headPortrait, keys, mouse, netTick, renderer, requestLock, runUlt, scene, seqHud, unlock, vReset } = D;

const SK_REST = {};   // se llena abajo con los textos de cada habilidad

// ===== Libro · Habilidades: elegís un personaje y ves cada habilidad en detalle con su vista previa =====
// consejos de uso escritos a mano (personaje.grupo+número: S habilidades, A despertar, F sin lanza, AF sin lanza en despertar, U ulti)
const SK_TIPS = {};   // se arma con los 'consejos' de cada personajes/<id>/personaje.js
for (const id in CHARS) { const c = CHARS[id].consejos; if (c) for (const k in c) SK_TIPS[id + '.' + k] = c[k]; }
const SK_TAG = { gap: 'Acercamiento', proj: 'A distancia', aoe: 'En área', close: 'Cuerpo a cuerpo', gb: 'Rompe guardia', counter: 'Contraataque', buff: 'Mejora' };
const SK_ULT_TAGS = { spearRain: 'aoe gb', beam: 'proj gb', illusion: 'proj aoe' };
const n1 = v => (Math.round(v * 10) / 10).toString().replace('.', ',');
function skFacts(s, grp, D) {
  const o = s.o || {}, p = o.proj || {}, F = [];
  if (grp !== 'U') F.push(['Recarga', n1(s.cd) + ' s']);
  if (s.r && s.r[1]) F.push(['Alcance', s.r[0] > 0 ? `${n1(s.r[0])} a ${n1(s.r[1])} bloques` : `hasta ${n1(s.r[1])} bloques`]);
  const cnt = o.count > 1 ? o.count : o.n > 1 ? o.n : 0;
  if (o.dmg) F.push(['Daño', cnt ? `${n1(o.dmg)} × ${cnt}` : o.dmg2 ? `${n1(o.dmg)} + ${n1(o.dmg2)}` : n1(o.dmg)]);
  else if (p.dmg) F.push(['Daño', cnt ? `${n1(p.dmg)} × ${cnt}` : n1(p.dmg)]);
  if (D) { const tot = D.ev.reduce((t, e) => t + (e.hit || 0) + (e.rel ? e.rel.dmg || 0 : 0), 0); if (tot) F.push(['Daño total', n1(tot)]); F.push(['Duración', n1(D.dur) + ' s (sos invulnerable)']); }
  if (o.dps) F.push(['Veneno', `${n1(o.dps)} por segundo, ${n1(o.dur)} s`]);
  else if (o.dur && !D) F.push(['Duración', n1(o.dur) + ' s']);
  if (o.root) F.push(['Inmoviliza', n1(o.root) + ' s']);
  const stun = o.stun || p.stun; if (stun) F.push(['Aturde', n1(stun) + ' s']);
  if (o.radius || (o.r && typeof o.r === 'number')) F.push(['Radio', n1(o.radius || o.r) + ' bloques']);
  if (o.homing || p.homing) F.push(['Persigue', 'Sí, busca al rival solo']);
  if (o.hold) F.push(['Carga', n1(o.hold) + ' s antes de disparar']);
  if (o.delay) F.push(['Retraso', n1(o.delay) + ' s']);
  return F;
}

// ---------------------------------------------------------------- motor: sandbox con peleadores reales
const curChar = () => (GS.real ? GS.real.P : G.player) ? (GS.real ? GS.real.P : G.player).ch.id : G.charId;
function guideNums(on) {
  const n = $('nums');
  if (on) { if (!GS.numsHome) { GS.numsHome = { p: n.parentNode, s: n.nextSibling }; $('bk-win').appendChild(n); } }
  else if (GS.numsHome) { GS.numsHome.p.insertBefore(n, GS.numsHome.s); GS.numsHome = null; }
}
const GS_Y = 300;
function guideStage(on) {
  if (on && !GS.stage) {
    const cv = document.createElement('canvas'); cv.width = 8; cv.height = 256; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#0a0e1c'); gr.addColorStop(.55, '#1d2b4d'); gr.addColorStop(.8, '#3a4f7e'); gr.addColorStop(1, '#8aa0c8'); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
    const gc = document.createElement('canvas'); gc.width = gc.height = 256; const q = gc.getContext('2d', { willReadFrequently: true }); q.fillStyle = '#242c40'; q.fillRect(0, 0, 256, 256);
    q.strokeStyle = '#33405e'; q.lineWidth = 3; for (let i = 0; i <= 256; i += 64) { q.beginPath(); q.moveTo(i, 0); q.lineTo(i, 256); q.moveTo(0, i); q.lineTo(256, i); q.stroke(); }
    const ft = new THREE.CanvasTexture(gc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(10, 10);
    const grp = new THREE.Group(); grp.position.set(0, GS_Y, 0);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(36, 36, 80, 48, 1, true), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), side: THREE.BackSide, fog: false, depthWrite: false })); wall.position.y = 36;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(36, 48), new THREE.MeshLambertMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; floor.position.y = .02; floor.receiveShadow = true;
    grp.add(wall, floor); scene.add(grp);
    const light = new THREE.HemisphereLight(0xffffff, 0x556070, .9); light.position.set(0, GS_Y + 20, 0); scene.add(light);
    D.GUIDE_Y = GS_Y;
    GS.stage = { grp, light, mats: [wall.material.map, ft, wall.material, floor.material], geos: [wall.geometry, floor.geometry] };
  } else if (!on && GS.stage) {
    const st = GS.stage; scene.remove(st.grp); scene.remove(st.light); D.GUIDE_Y = 0;
    st.geos.forEach(x => x.dispose()); st.mats.forEach(x => x.dispose()); GS.stage = null;
  }
}
function guideEnter() {
  if (GS.on) return true;
  if (G.state !== 'play' || G.viewer || !G.player) return false;
  const R = GS.real = { F: G.fighters, P: G.player, goal: G.goal, auto: G.auto, paused: G.paused, yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, sl: G.shiftLock };
  for (const f of R.F) { try { f.model.root.visible = false; if (f.plate) f.plate.style.display = 'none'; } catch (e) { } }
  G.fighters = []; G.goal = 99999; G.auto = false; G.paused = false; GS.on = true; G.guide = true;
  guideStage(true); guideNums(true); return true;
}
// deja la escena sin nada de la vista previa (peleadores, proyectiles, efectos, números, cinemática)
function guideWipe() {
  G.matchGen++;
  if (G.chore) { try { choreEnd(G.chore); } catch (e) {} }
  clearSkillObjs();
  for (const f of [GS.att, GS.vic]) if (f) { try { f.dispose(); } catch (e) { } }
  GS.att = GS.vic = null; G.fighters = []; G.player = null;
  PROJ.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); PROJ.length = 0;
  TIMERS.length = 0; for (const d of DN) d.el.remove(); DN.length = 0; PS.clear(); ZONES.length = 0;
  for (const fx of FX) { fx.sc.remove(fx.obj); if (fx.dispose) fx.dispose(); else { fx.obj.geometry.dispose(); fx.obj.material.dispose(); } } FX.length = 0;
  G.chore = null; G.cine = null; endCamScript(); G.hitstop = 0; G.slowT = 0; G.shake = 0; G.linesI = 0; IMPACT.t = 0; CAMFX.zoom = CAMFX.roll = CAMFX.rollV = CAMFX.ca = 0;
  try { cineGrade(false); } catch (e) { } document.body.classList.remove('cine', 'duel'); seqHud(null);
}
function guideBuild(E) {
  guideWipe(); try { destRestore(true); } catch (e) { }
  const id = E.ch || curChar(), rp = GS.real && GS.real.P, own = rp && rp.ch.id === id && G.customSkin;
  const att = new Fighter({ name: 'Vos', char: id, isPlayer: true, skin: own ? G.customSkin : null, slim: own ? G.customSlim : false });
  const vic = new Fighter({ name: 'Dummy', ch: DUMMY_CH, lvlVar: 0 });
  const gap = E.solo ? 0 : Math.min(6.5, E.gap || 2.2);
  vic.dummy = E.vic || 'idle'; vic.ai.P = aiParams(4); vic.flourT = att.flourT = 1e9;
  G.fighters.push(att, vic); G.player = att; GS.att = att; GS.vic = vic;
  // de costado (cámara mirando +z, el rival a la derecha): se ven los dos y no se tapan; con shift lock el rival va adelante
  const side = !E.lock; cam.yaw = side ? Math.PI / 2 : 0; cam.pitch = .3; GS.cm = null; cam.dist = side ? clamp(6.5 + gap * .55, 6.5, 12.5) : 6.5;
  vReset(att, 0, 0, side ? Math.PI / 2 : 0); vReset(vic, E.solo ? 0 : side ? gap : 0, E.solo ? -30 : side ? 0 : gap, side ? -Math.PI / 2 : Math.PI);
  att.awak = vic.awak = 0; att.maxHp = att.hp = vic.maxHp = vic.hp = 99999; att.cd = [0, 0, 0, 0]; att.ult = (E.ult || E.grp === 'U') ? 100 : 0;
  vic.home = vic.pos.clone(); att.guideCtl = () => { const c = NEUTRAL(); if (GS.E && GS.E.ctl) GS.E.ctl(GS.t, c, GS); if (GS.pulse.skill != null) { c.skill = GS.pulse.skill; GS.pulse.skill = null; } if (GS.pulse.ult) { c.ult = true; GS.pulse.ult = false; } return c; };
  if (E.fist) att._fistKit = 1;
  G.shiftLock = !!E.lock; $('slchip').classList.toggle('hidden', !G.shiftLock);
  GS.E = E; GS.t = 0; GS.fired = new Set(); GS.cast = false; GS.pulse = { skill: null, ult: false };
  if (E.setup) E.setup(GS);
}
// online: la red se atiende con el estado real (amigos, tu posición, golpes que te llegan) y la pelea real queda congelada e invulnerable
function guideNet(dt) {
  if (!GS.on) { netTick(dt); return; }
  const sf = G.fighters, sp = G.player, R = GS.real;
  G.fighters = R.F; G.player = R.P; if (!G.mp) R.P.iframes = Math.max(R.P.iframes, 1);   // en linea NO hay inmunidad con la guia abierta
  try { netTick(dt); } finally {
    G.fighters = sf; G.player = sp;
    for (const f of R.F) { try { f.model.root.visible = false; if (f.plate) f.plate.style.display = 'none'; } catch (e) { } }
  }
}
// cámara de la vista previa: de costado, siguiendo a los dos (las cinemáticas y el shift lock usan la cámara normal del juego)
function guideCam(dt) {
  const E = GS.E, a = GS.att, v = GS.vic; if (!a || !E || E.lock || G.cine || G.chore) return;
  const two = !E.solo, mx = two ? (a.pos.x + v.pos.x) / 2 : a.pos.x, mz = two ? (a.pos.z + v.pos.z) / 2 : a.pos.z, my = a.pos.y + (two ? (v.pos.y - a.pos.y) / 2 : 0);
  const gap = two ? Math.hypot(a.pos.x - v.pos.x, a.pos.z - v.pos.z) : 0, k = Math.min(1, dt * 5);
  const tgt = { x: mx, y: my, z: mz, d: Math.max(5.2, 4 + gap * 1.05) };
  const c = GS.cm || (GS.cm = Object.assign({}, tgt)); for (const q of ['x', 'y', 'z', 'd']) c[q] += (tgt[q] - c[q]) * k;
  const d = c.d / Math.min(1, camera.aspect * 1.05), sh = G.shake * .25;
  camera.position.set(c.x + (Math.random() - .5) * sh, c.y + 1.7 + d * .1 + (Math.random() - .5) * sh, c.z - d);
  camera.lookAt(c.x, c.y + 1.0, c.z);
}
function guideTick(dt) {
  const E = GS.E; if (!GS.on || !E || !GS.att) return;
  GS.t += dt;
  if (GS.t > E.len) { guideBuild(E); return; }
  if (E.ev) E.ev.forEach((e, i) => { if (!GS.fired.has(i) && GS.t >= e[0]) { GS.fired.add(i); e[1](GS); } });
  if (E.tick) E.tick(GS);
}
function guideLeave() {
  if (!GS.on) return;
  guideWipe(); const R = GS.real;
  G.fighters = R.F; G.player = R.P; G.goal = R.goal; G.auto = R.auto; G.paused = R.paused; G.guide = false; GS.on = false; GS.E = null;
  cam.yaw = R.yaw; cam.pitch = R.pitch; cam.dist = R.dist; G.shiftLock = R.sl; $('slchip').classList.toggle('hidden', !G.shiftLock);
  for (const f of R.F) { try { f.model.root.visible = true; } catch (e) { } }
  guideStage(false); guideNums(false); try { destRestore(true); } catch (e) { } GS.real = null;
}
// copia el cuadro que acaba de dibujar el juego (con su cámara, brillo y cinemática) a la caja de la guía
function guideBlit() {
  if (!CB.open) return;
  const box = $('bk-prev'), cv = $('bk-cv'), w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
  const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d'); g.drawImage(renderer.domElement, 0, 0, W, H);
  $('bk-win').style.transform = `scale(${w / innerWidth})`;
}
function guidePost(spec) {
  CB.spec = spec; const fr = $('bk-fr');
  if (CB.ready && fr && fr.contentWindow) fr.contentWindow.postMessage({ t: 'entry', spec }, location.origin);
}
function guideFrame() {
  const box = $('bk-prev'), note = $('bk-note'); let fr = $('bk-fr');
  if (!fr) {
    CB.ready = false; note.classList.remove('hidden'); note.textContent = 'Preparando la vista previa…';
    fr = document.createElement('iframe'); fr.id = 'bk-fr'; fr.allow = 'autoplay'; fr.title = 'Vista previa';
    fr.src = location.href.split('#')[0].split('?')[0] + '?guia=1&nostats&q=' + GFX.level + '#notitle'; box.insertBefore(fr, box.firstChild);
    clearTimeout(CB.fail); CB.fail = setTimeout(() => { if (!CB.ready) note.textContent = 'No se pudo cargar la vista previa. Cerrá la guía y volvé a abrirla.'; }, 25000);
  } else if (fr.contentWindow) { fr.contentWindow.postMessage({ t: 'on' }, location.origin); if (CB.spec) fr.contentWindow.postMessage({ t: 'entry', spec: CB.spec }, location.origin); }
}
addEventListener('message', e => {
  if (e.origin !== location.origin || IS_GUIDE) return; const m = e.data || {};
  if (m.guideReady) { CB.ready = true; $('bk-note').classList.add('hidden'); const fr = $('bk-fr'); if (CB.spec && fr && fr.contentWindow) fr.contentWindow.postMessage({ t: 'entry', spec: CB.spec }, location.origin); }
  else if (m.guideError) $('bk-note').textContent = 'No se pudo preparar la vista previa.';
});
function guideFit() { const b = $('bk-prev'); b.style.aspectRatio = innerWidth + ' / ' + innerHeight; const w = $('bk-win'); w.style.width = innerWidth + 'px'; w.style.height = innerHeight + 'px'; }
addEventListener('resize', () => { if (CB.open) guideFit(); });

// ---------------------------------------------------------------- habilidades: cada una se lanza de verdad
const SKB = { ch: null, list: [], idx: 0 };
function skGroups(ch) {
  const G0 = [['Habilidades', 'S', ch.skills, 'Se usan con 1, 2, 3 y 4']];
  if (ch.ult && ch.ult.n && ch.ult.n !== '—') G0.push(['Despertar', 'U', [Object.assign({ tags: SK_ULT_TAGS[ch.ult.k] || 'buff', cd: 0 }, ch.ult)], 'Con la barra al 100 %, tecla G']);
  if (ch.awk) G0.push(['Con el despertar', 'A', ch.awk, 'Reemplazan a las normales mientras dure el despertar']);
  if (ch.fist) G0.push(['Sin lanza', 'F', ch.fist, 'Cuando la lanza quedó clavada o la perdiste']);
  if (ch.awkFist) G0.push(['Sin lanza + despertar', 'AF', ch.awkFist, 'Despierto y a puño limpio']);
  return G0;
}
function skEntry(ch, s, grp, i) {
  const tags = (s.tags || '').split(/\s+/).filter(Boolean), r = s.r || [0, 6], D = s.k === 'chore' ? CHORE[s.o.id] : null, o = s.o || {};
  const gap = r[0] >= 2 ? clamp((r[0] + r[1]) / 2, 3, 6.5) : r[1] <= 6 ? 2.2 : clamp(r[1] / 2.5, 3, 6);
  const awake = grp === 'A' || grp === 'AF', long = Math.max(o.dur || 0, grp === 'U' ? 8 : 0);
  const E = { ch: ch.id, s, grp, tags, gap, fist: grp === 'F' || grp === 'AF', vic: tags.includes('gb') ? 'block' : 'idle', ev: [], len: Math.min(20, Math.max(7, (D ? D.dur + 3.5 : 0), long + 3.5) + (awake ? 2.4 : 0) + (grp === 'U' ? 3 : 0)) };
  if (grp === 'U') { E.ult = true; E.ev.push([.5, P => { P.pulse.ult = true; }]); return E; }
  if (tags.includes('counter')) E.ev.push([.7, P => { P.vic.dummy = 'attack'; }]);
  const cast = P => { P.att.cd = [0, 0, 0, 0]; P.pulse.skill = i; P.cast = true; };
  if (awake) {
    // primero el despertar de verdad (animación, luz y curación); recién cuando termina se usa la habilidad
    E.ev.push([.3, P => runUlt(P.att)]);
    E.tick = P => { if (!P.cast && P.t > 1.2 && P.att.awak > 0 && !P.att.action) cast(P); };
  } else E.ev.push([.6, cast]);
  return E;
}
function skRender() {
  const ch = SKB.ch; if (!ch) return;
  $('bk-chname').innerHTML = `<i style="background:${ch.color}"></i>${ch.name} <small>${ch.title} · ${ch.role}</small>`;
  const list = $('bk-list'); list.innerHTML = ''; SKB.list = [];
  for (const [title, grp, set, sub] of skGroups(ch)) {
    const h = document.createElement('li'); h.className = 'bk-grp'; h.innerHTML = `<b>${title}</b><small>${sub}</small>`; list.appendChild(h);
    set.forEach((s, i) => {
      const idx = SKB.list.length; SKB.list.push({ s, grp, i });
      const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      b.innerHTML = `<span>${s.n}</span><kbd>${grp === 'U' ? 'G' : i + 1}</kbd>`; b.addEventListener('click', () => skSelect(idx));
      li.appendChild(b); list.appendChild(li);
    });
  }
}
function skSelect(idx) {
  const it = SKB.list[idx]; if (!it) return; SKB.idx = idx;
  const ch = SKB.ch, { s, grp, i } = it, E = skEntry(ch, s, grp, i), D = s.k === 'chore' ? CHORE[s.o.id] : null;
  [...$('bk-list').querySelectorAll('button')].forEach((b, j) => { b.classList.toggle('on', j === idx); if (j === idx) b.scrollIntoView({ block: 'nearest' }); });
  const tags = E.tags.map(t => SK_TAG[t]).filter(Boolean); if (D) tags.push('Cinemática');
  const key = grp === 'U' ? 'G' : String(i + 1), wh = grp === 'A' || grp === 'AF' ? ' <span>durante el despertar</span>' : grp === 'F' ? ' <span>sin lanza</span>' : '';
  const tip = SK_TIPS[ch.id + '.' + grp + (grp === 'U' ? '' : i + 1)];
  $('bk-info').innerHTML = `<h3>${s.n}</h3><div class="bk-keys"><kbd>${key}</kbd>${wh}</div>`
    + (tags.length ? `<div class="bk-tags">${tags.map(t => `<span>${t}</span>`).join('')}</div>` : '')
    + `<p>${s.d}</p>`
    + `<dl class="bk-facts">${skFacts(s, grp, D).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`
    + (tip ? `<div class="bk-tip"><b>Cómo usarla</b>${tip}</div>` : '');
  guidePost({ k: 's', ch: ch.id, grp, i });
}
function skPickChar(id) {
  SKB.ch = CHARS[id]; CB.mode = 'skills';
  $('bk-grid').classList.add('hidden'); $('bk-sub').classList.remove('hidden'); $('bk-body').classList.remove('hidden');
  skRender(); skSelect(0);
}
function skGrid() {
  CB.mode = 'grid';
  $('bk-body').classList.add('hidden'); $('bk-sub').classList.add('hidden');
  const g = $('bk-grid'); g.classList.remove('hidden');
  guidePost({ k: 'i', ch: curChar() });
  if (!g.children.length) for (const id of CHAR_IDS) {
    const ch = CHARS[id], b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--cc', ch.color);
    const cv = document.createElement('canvas'); cv.className = 'px'; headPortrait(charSkin(id), cv);
    b.appendChild(cv); b.insertAdjacentHTML('beforeend', `<b>${ch.name}</b><small>${ch.role}</small>`);
    b.addEventListener('click', () => skPickChar(id)); g.appendChild(b);
  }
}

// ---------------------------------------------------------------- libro
function cbSelect(i) {
  CB.idx = (i + CB_BASIC.length) % CB_BASIC.length; const E0 = CB_BASIC[CB.idx];
  document.querySelectorAll('#bk-list button').forEach((b, j) => { b.classList.toggle('on', j === CB.idx); if (j === CB.idx) { b.setAttribute('aria-current', 'true'); b.scrollIntoView({ block: 'nearest' }); } else b.removeAttribute('aria-current'); });
  $('bk-info').innerHTML = `<h3>${E0.n}</h3><div class="bk-keys">${E0.keys.map(k => /^[+×(]/.test(k) || k === 'Habilidades' ? `<span>${k}</span>` : `<kbd>${k}</kbd>`).join('')}</div><p>${E0.d}</p><ul>${E0.tips.map(t => `<li>${t}</li>`).join('')}</ul>`;
  guidePost({ k: 'b', id: E0.id, ch: curChar() });
}
function bookBasic() {
  CB.mode = 'basic';
  $('bk-grid').classList.add('hidden'); $('bk-sub').classList.add('hidden'); $('bk-body').classList.remove('hidden');
  const list = $('bk-list'); list.innerHTML = '';
  CB_BASIC.forEach((E, i) => { const li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<span>${E.n}</span><kbd>${E.keys[0]}</kbd>`; b.addEventListener('click', () => cbSelect(i)); li.appendChild(b); list.appendChild(li); });
  cbSelect(CB.idx);
}
function bookTab(tab) {
  document.querySelectorAll('#book .bk-tabs button').forEach(b => b.classList.toggle('on', b.dataset.bk === tab));
  if (tab === 'skills') { if (SKB.ch && CB.mode === 'skills') return; skGrid(); } else bookBasic();
}
function bookOpen() {
  if (CB.open) return;
  CB.open = true; $('book').classList.remove('hidden'); document.body.classList.add('guide-on');
  if (G.state === 'play') { G.panelOpen = true; unlock(); }
  for (const k in keys) keys[k] = false; mouse.left = mouse.right = false;
  // la partida sigue detrás: con bots se pausa como cualquier menú; online sigue corriendo y te pueden pegar
  if (G.state === 'play' && !G.mp && !G.paused) { G.paused = true; CB.paused = true; }
  guideFit(); guideFrame();
  if (CB.mode === 'skills' && SKB.ch) skPickChar(SKB.ch.id); else if (CB.mode === 'grid') skGrid(); else bookBasic();
  $('book-x').focus({ preventScroll: true });
}
function bookClose() {
  if (!CB.open) return;
  CB.open = false; $('book').classList.add('hidden'); document.body.classList.remove('guide-on');
  const fr = $('bk-fr'); if (fr && fr.contentWindow) fr.contentWindow.postMessage({ t: 'off' }, location.origin);
  if (CB.paused) { G.paused = false; CB.paused = false; }
  if (G.state === 'play') { G.panelOpen = false; if (!G.over) requestLock(); }
}
$('bookbtn').addEventListener('click', e => { e.stopPropagation(); bookOpen(); });
$('book-x').addEventListener('click', bookClose);
$('bk-back').addEventListener('click', () => { SKB.ch = null; skGrid(); });
document.querySelectorAll('#book .bk-tabs button').forEach(b => b.addEventListener('click', () => bookTab(b.dataset.bk)));
$('book').addEventListener('click', e => { if (e.target === $('book')) bookClose(); });
addEventListener('keydown', e => {
  if (D.BIND_WAIT) return;
  const gKey = BINDS.guide || 'KeyK';
  if (CB.open) {
    const sel = d => CB.mode === 'skills' ? skSelect(clamp((SKB.idx || 0) + d, 0, SKB.list.length - 1)) : CB.mode === 'basic' ? cbSelect(CB.idx + d) : null;
    if (e.code === 'Escape') { if (CB.mode === 'skills') { SKB.ch = null; skGrid(); } else bookClose(); }
    else if (e.code === gKey) bookClose();
    else if (e.code === 'Backspace' && CB.mode === 'skills') { SKB.ch = null; skGrid(); }
    else if (e.code === 'ArrowDown' || e.code === 'ArrowRight') sel(1);
    else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') sel(-1);
    e.preventDefault(); e.stopImmediatePropagation(); return;
  }
  if (e.code === gKey && !e.repeat && G.state === 'play' && !G.paused && !G.over && !G.viewer && !G.panelOpen && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); e.stopImmediatePropagation(); bookOpen(); }
}, true);

  return { GS_Y, SKB, SK_REST, SK_TAG, SK_TIPS, SK_ULT_TAGS, bookBasic, bookClose, bookOpen, bookTab, cbSelect, curChar, guideBlit, guideBuild, guideCam, guideEnter, guideFit, guideFrame, guideLeave, guideNet, guideNums, guidePost, guideStage, guideTick, guideWipe, n1, skEntry, skFacts, skGrid, skGroups, skPickChar, skRender, skSelect };
};
