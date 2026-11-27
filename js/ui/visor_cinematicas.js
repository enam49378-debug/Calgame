// Sala de cinemáticas
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_UI = window.CF_UI || {};

window.CF_UI.crearVisorCinematicas = function crearVisorCinematicas(D) {
  'use strict';
  const { $, AWK, CAMFX, CHARS, CHAR_IDS, CHORE, DN, FX, Fighter, G, GATO_BB_DATA, IMPACT, IMPALE_VARIANTS, JAVI_BB_DATA, JOINTS, MOVES, PROJ, PS, RANDI_BB_DATA, RED_BB_DATA, RKT_BB_DATA, SEB_BB_DATA, SEK_BB_DATA, TIMERS, UKY_BB_DATA, ZONES, cam, choreEnd, choreShots, cineGrade, clearFighters, clearSkillObjs, endAction, endCamScript, groundAt, initAudio, jv, runChore, scene, sfx, stageExit, stancePose, toMenu, updateCamera } = D;

const VW = { on: false, id: null, att: null, vic: null, play: true, speed: 1, free: false, yaw: .8, pitch: .25, dist: 7, drag: false, age: 0, seen: false, wait: 0, focus: null, started: false };
for (const [bk, bset] of [['javi', JAVI_BB_DATA], ['redbird', RED_BB_DATA], ['gato', GATO_BB_DATA], ['sekza', SEK_BB_DATA], ['rocket', RKT_BB_DATA], ['ukyo', UKY_BB_DATA], ['sebolla', SEB_BB_DATA], ['randi', RANDI_BB_DATA]]) for (const [name, clip] of Object.entries(bset)) {
  const id = 'bb_' + bk + '_' + name;
  CHORE[id] = { dur: clip.loop ? clip.length * 3 : Math.max(.7, clip.length + .15), catch: 2, bbPreview: name, bbKey: bk, description: 'Animación de Blockbench · ' + name.replace(/_/g, ' '), att: [], vic: [], apos: [[0, 0, 0, 0, 0]], vpos: [[0, 0, 0, 3, 0]], ev: [], shots: [[0, 'hero', { s: -1, fov: 48, roll: .01 }]] };
}
const CHORE_OWNER = {}, CHORE_NAME = {};
for (const c in AWK) for (const s of AWK[c]) if (s.k === 'chore') { CHORE_OWNER[s.o.id] = c; CHORE_NAME[s.o.id] = s.n; }
for (const variant of IMPALE_VARIANTS) { CHORE_OWNER[variant.id] = 'javi'; CHORE_NAME[variant.id] = variant.name; }
CHORE_OWNER.javiFury = 'javi'; CHORE_NAME.javiFury = 'Furia del Destello';
CHORE_OWNER.sekPlane = 'sekza'; CHORE_NAME.sekPlane = 'Vuelo Sin Retorno';
CHORE_OWNER.randiDomain = 'randi'; CHORE_NAME.randiDomain = 'Expansión de dominio';
for (const [id, nm] of [['sebBrawl', 'Paliza de Verity'], ['sebPinball', 'Pelota de Verity'], ['sebSandwich', 'Sándwich'], ['sebDuo', 'Dúo Dinámico'], ['sebPoint', 'Rayo a Quemarropa'], ['sebMarathon', 'Maratón de Verity']]) { CHORE_OWNER[id] = 'sebolla'; CHORE_NAME[id] = nm; }
for (const [bk, bset] of [['javi', JAVI_BB_DATA], ['redbird', RED_BB_DATA], ['gato', GATO_BB_DATA], ['sekza', SEK_BB_DATA], ['rocket', RKT_BB_DATA], ['ukyo', UKY_BB_DATA], ['sebolla', SEB_BB_DATA], ['randi', RANDI_BB_DATA]]) for (const name of Object.keys(bset)) { CHORE_OWNER['bb_' + bk + '_' + name] = bk; CHORE_NAME['bb_' + bk + '_' + name] = 'Blockbench · ' + name.replace(/_/g, ' '); }
try { const saved = localStorage.getItem('bsb_impale'); if (IMPALE_VARIANTS.some(v => v.id === saved)) G.impaleVariant = saved; } catch (e) {}
const SHOT_ES = { two: 'Plano de los dos', ots: 'Sobre el hombro', otsV: 'Contraplano', lowV: 'Contrapicado (víctima)', lowA: 'Contrapicado (atacante)', faceV: 'Primer plano víctima', faceA: 'Primer plano atacante', orbit: 'Órbita', top: 'Cenital', ground: 'A ras del piso', follow: 'Persecución', hero: 'Plano héroe', wide: 'General', up: 'Desde abajo' };
function openViewer() {
  if (!D.DEV.on) return;
  initAudio(); stageExit(); D.clearDummies(); clearFighters();
  G.state = 'play'; G.mp = false; G.over = false; G.paused = false; G.cine = null; endCamScript(); cineGrade(false); document.body.classList.remove('cine');
  G.viewer = VW; VW.on = true;
  $('menu').classList.add('hidden'); $('hud').classList.add('hidden'); $('viewer').classList.remove('hidden');
  const sel = $('vsel'); sel.innerHTML = '';
  for (const c of CHAR_IDS) {
    const ids = Object.keys(CHORE).filter(id => CHORE_OWNER[id] === c).sort((a,b) => Number(!!CHORE[b].r6)-Number(!!CHORE[a].r6)); if (!ids.length) continue;
    const g = document.createElement('optgroup'); g.label = CHARS[c].name;
    for (const id of ids) { const o = document.createElement('option'); o.value = id; o.textContent = CHORE_NAME[id] || id; g.appendChild(o); }
    sel.appendChild(g);
  }
  const first = Object.keys(CHORE).find(id => CHORE_OWNER[id] === G.charId) || Object.keys(CHORE)[0];
  sel.value = first; vLoad(first); vSetPlay(true);
}
function closeViewer() { toMenu(); }
function vLoad(id) {
  clearFighters(); VW.id = id; $('vsel').value = id;
  const owner = CHORE_OWNER[id] || 'javi';
  const a = new Fighter({ name: CHARS[owner].name, char: owner, isPlayer: true });
  // la víctima: tu peleador elegido (con tu skin si subiste una)
  const vc = G.charId !== owner ? G.charId : (owner === 'redbird' ? 'gato' : 'redbird');
  const v = new Fighter({ name: 'Víctima', char: vc, skin: G.customSkin || null, slim: G.customSkin ? G.customSlim : false });
  if(CHORE[id].bbPreview && v.plate) v.plate.style.display='none';
  v.dummy = 'idle'; a.flourT = v.flourT = 1e9;
  G.fighters.push(a, v); G.player = a; VW.att = a; VW.vic = v;
  vRestart();
}
function vReset(f, x, z, yaw) {
  endAction(f); f.pos.set(x, groundAt(x, z), z); f.vel.set(0, 0, 0); f.yaw = f.prevYaw = yaw;
  f.alive = true; f.hp = f.maxHp || 100; f.ragdoll = f.stun = f.frozen = f.iframes = f.hurtT = f.getupT = f.landT = f.dashT = f.dashAnimT = f.dashRecT = 0; f.critT = 0; f.dashHit = false; f.dashCarry = null; f.dashDir = 'front';
  f.cineLock = null; f.grabbed = false; f.choreTrack = null; f.forcePose = null; f.blocking = false; f.awak = 30;
  f.hitCount = 0; f.hitT = -9; f.flashT = 0; f.choreFrame = -1; f.choreGripQuat = null; f.bbState = null; f.bbStateTime=0; f.bbFrom=null; f.twirl = null; f.twA = 0; f.walk = 0; f.rdPose = 0; f.rdDir = 1; f.onGround = true; f.airDash = true; f.pvx = f.pvz = f.leanF = f.leanR = 0;
  f.anim.reset(); const pose = stancePose(f.ch, 0, f.seed, true);
  for (const joint of JOINTS) f.anim.x[joint] = jv(pose, joint);
  f.anim.apply(); f.model.root.position.copy(f.pos); f.model.root.rotation.set(0, yaw, 0); f.model.root.updateMatrixWorld(true);
  if (f.model) f.model.root.visible = true;
}
function vRestart() {
  G.matchGen++;
  if (G.chore) { try { choreEnd(G.chore); } catch (e) {} }
  clearSkillObjs();
  const D = CHORE[VW.id], a = VW.att, v = VW.vic;
  if (a.action) endAction(a); if (v.action) endAction(v);
  G.chore = null; G.hitstop = 0; G.slowT = 0; G.shake = 0; G.linesI = 0; IMPACT.t = 0; PS.clear(); ZONES.length = 0;
  TIMERS.length = 0; for (const d of DN) d.el.remove(); DN.length = 0;
  for (const fx of FX) { fx.sc.remove(fx.obj); if (fx.dispose) fx.dispose(); else { fx.obj.geometry.dispose(); fx.obj.material.dispose(); } } FX.length = 0;
  CAMFX.zoom = CAMFX.roll = CAMFX.rollV = CAMFX.ca = 0;
  PROJ.forEach(p => { scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mesh.material.dispose(); }); PROJ.length = 0;
  cam.yaw = 0;   // el atacante apunta con la cámara: si venías de una partida, el lanzamiento de la cadena salía hacia otro lado
  vReset(a, 0, 0, 0); vReset(v, 0, D.pull ? 9 : 2.6, Math.PI);
  VW.age = 0; VW.seen = false; VW.wait = 0; VW.started = false; VW.focus = null;
  if (document.activeElement !== $('vtime')) $('vtime').value = 0;
  document.body.classList.remove('duel');
}
function vTick(dt) {
  const D = CHORE[VW.id]; if (!D) return;
  VW.age += dt;
  if (!VW.started && VW.age > .5) { VW.started = true; MOVES.chore(VW.att, { id: VW.id }); }
  if (G.chore) VW.seen = true;
  if ((VW.seen && !G.chore) || VW.age > D.dur + 4) { VW.wait += dt; if (VW.wait > 1.6) vRestart(); }
  vInfo();
}
function vInfo() {
  const st = G.chore, D = CHORE[VW.id];
  $('vdesc').textContent = D.description || '';
  $('vuse').hidden = !D.r6;
  const selected = (G.impaleVariant || 'javiImpale') === VW.id;
  $('vuse').textContent = selected ? 'Elegida para combate ✓' : 'Usar en combate';
  $('vuse').classList.toggle('on', selected);
  const name = f => {
    if (!f.choreTrack) return f.ragdoll > 0 ? 'ragdoll' : f.action ? f.action.name : 'quieto';
    let n = ''; for (const k of f.choreTrack) if (k.t <= f.choreTime && k.n) n = k.n; return n || '-';
  };
  $('vt').textContent = st ? `${st.t.toFixed(2)} / ${D.dur.toFixed(2)} s` : '-';
  if (D.anime && st) {
    const t = st.t, A = D.anime;
    const stage = t < .34 ? ['Alcance', 'Guardia'] : t < .59 ? ['Tirón lateral', 'Pierde el equilibrio'] : t < .98 ? ['Salida en carrera', 'Caída de lado'] : t < A.pin ? ['Carrera', 'En el suelo'] : t < A.charge[0] ? ['Apoyo del pie', 'Inmovilizada'] : t < A.strike ? ['Carga a dos manos', 'Bajo presión'] : t < A.strike + .4 ? ['Remate', 'Impacto'] : ['Recuperación', 'En el suelo'];
    $('vatt').textContent = stage[0]; $('vvic').textContent = stage[1];
  } else { $('vatt').textContent = name(VW.att); $('vvic').textContent = name(VW.vic); }
  $('vshot').textContent = VW.free ? 'Cámara libre' : st ? (SHOT_ES[(choreShots(D)[Math.max(0, st.shot)] || [])[1]] || '-') : '-';
  if (st && document.activeElement !== $('vtime')) $('vtime').value = Math.round(st.t / D.dur * 1000);
}
// saltar a un momento: se vuelve a simular desde el principio hasta ahí y queda en pausa
function vSeek(frac) {
  const D = CHORE[VW.id]; vRestart(); VW.started = true; MOVES.chore(VW.att, { id: VW.id });
  const target = frac * D.dur;
  for (let i = 0; i < 900; i++) {
    if (G.chore && G.chore.t >= target) break;
    D.step(1 / 120); G.hitstop = 0;
    if (G.chore) VW.seen = true; else if (VW.seen) break;
  }
  G.hitstop = 0; updateCamera(1 / 60); vSetPlay(false); vInfo();
}
function vSetPlay(on) { VW.play = on; $('vplay').textContent = on ? 'Pausa' : 'Reproducir'; $('vplay').classList.toggle('on', !on); }
function vTogglePlay() { vSetPlay(!VW.play); }
function vSetFree(on) { VW.free = on; VW.focus = null; $('vcam').textContent = on ? 'Cámara: libre' : 'Cámara: cine'; $('vcam').classList.toggle('on', on); if (on) document.body.classList.remove('duel'); }
$('viewbtn').addEventListener('click', () => { sfx('select'); openViewer(); });
$('vsel').addEventListener('change', e => { vLoad(e.target.value); vSetPlay(true); });
$('vplay').addEventListener('click', vTogglePlay);
$('vuse').addEventListener('click', () => {
  if (!CHORE[VW.id].r6) return;
  G.impaleVariant = VW.id;
  try { localStorage.setItem('bsb_impale', VW.id); } catch (e) {}
  vInfo();
});
$('vrestart').addEventListener('click', () => { vRestart(); vSetPlay(true); });
$('vframe').addEventListener('click', () => {
  vSetPlay(false); G.hitstop = 0;
  if (!VW.started) { VW.started = true; runChore(VW.att, VW.vic, CHORE[VW.id]); }
  D.step(1 / 60); if (G.chore) VW.seen = true; updateCamera(1 / 60); vInfo();
});
$('vslow').addEventListener('click', () => {
  VW.speed = VW.speed === 1 ? .5 : VW.speed === .5 ? .25 : 1;
  $('vslow').textContent = `Velocidad ${VW.speed === 1 ? '1' : VW.speed === .5 ? '½' : '¼'}×`; $('vslow').classList.toggle('on', VW.speed < 1);
});
$('vcam').addEventListener('click', () => vSetFree(!VW.free));
$('vexit').addEventListener('click', closeViewer);
$('vtime').addEventListener('input', e => vSeek(+e.target.value / 1000));

  return { CHORE_NAME, CHORE_OWNER, SHOT_ES, VW, closeViewer, openViewer, vInfo, vLoad, vReset, vRestart, vSeek, vSetFree, vSetPlay, vTick, vTogglePlay };
};
