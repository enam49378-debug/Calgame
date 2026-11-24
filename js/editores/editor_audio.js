// Editor de audio (modo desarrollador): sonidos, música, ambiente y voces
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_EDITORES = window.CF_EDITORES || {};

window.CF_EDITORES.crearEditorAudio = function crearEditorAudio(D) {
  'use strict';
  const { $, AUDIO_CFG, CHARACTER_VOICE_KEYS, CHARS, CHAR_IDS, SND_LIST, VOICE_PACKS, charSkin, charSoundDirs, charSoundRel, headPortrait, initAudio, sfx, uiAlert, uiConfirm, ultMusicRel, voiceRel } = D;

// Lo que se edita queda en config/audio.json (y los audios nuevos en sonidos/ y musica/): el juego lo lee al cargar y vale para todos los jugadores.
const SFX_NAMES = ['swing', 'hit', 'heavy', 'boom', 'block', 'break', 'dash', 'tp', 'zap', 'beam', 'slash', 'jump', 'select'];
const AE_ACTIONS = [
  ['Combate', [['ev_m1_1', 'Golpe 1 del combo'], ['ev_m1_2', 'Golpe 2 del combo'], ['ev_m1_3', 'Golpe 3 del combo'], ['ev_m1_4', 'Remate (golpe 4)'], ['ev_hit_land', 'Al conectar un golpe o habilidad'],
    ['ev_block', 'Al empezar a bloquear'], ['ev_block_hit', 'Al recibir un golpe bloqueado'], ['ev_dash', 'Al esquivar'], ['ev_jump', 'Al saltar'], ['ev_land', 'Al caer de golpe'],
    ['ev_skill_1', 'Al usar habilidad 1'], ['ev_skill_2', 'Al usar habilidad 2'], ['ev_skill_3', 'Al usar habilidad 3'], ['ev_skill_4', 'Al usar habilidad 4']]],
  ['Ulti y despertar', [['activate', 'Al activar la ulti'], ['ready', 'Cuando la ulti está lista'], ['ev_awake_end', 'Al terminar el despertar']]],
  ['Estado del personaje', [['hurt', 'Al recibir daño'], ['ev_low_hp', 'Con poca vida'], ['death', 'Al morir'], ['kill', 'Al eliminar a alguien'], ['near', 'A punto de eliminar a alguien'], ['ev_spawn', 'Al aparecer / reaparecer'], ['idle', 'Estando quieto un rato'], ['menu', 'Al elegirlo en el menú']]],
  ['Partida', [['ev_victory', 'Al ganar la partida'], ['ev_defeat', 'Al perder la partida']]],
];
const AE_LABEL = Object.fromEntries(AE_ACTIONS.flatMap(([, l]) => l));
const aeLabel = e => AE_LABEL[e] || (e.startsWith('cerca_') ? 'Al estar cerca de ' + e.slice(6).replace('_ulti', ' (despierto)') : e.startsWith('hab_') ? 'Al usar: ' + e.slice(4) : e.startsWith('reac_') ? 'Reacción: ' + e.slice(5) : e);
const AE = { open: false, el: null, tab: 'voices', char: null, sel: null, cfg: null, dirty: false, srv: null, filter: '', aud: null, ev: {}, files: {} };
const aeDef = () => ({ v: 1, voices: {}, clip: {}, dur: {}, evp: {}, sfx: {}, music: {}, amb: {}, up: {} });
const aeClone = o => JSON.parse(JSON.stringify(o));
async function aeSrv() { if (AE.srv != null) return AE.srv; try { const r = await fetch('/ping', { cache: 'no-store' }); AE.srv = r.ok && (await r.text()).startsWith('calfight-dev'); } catch (e) { AE.srv = false; } return AE.srv; }
// eventos -> clips de un personaje, tal como están ahora (lo del juego + lo que se cambió acá)
function aeEvents(ch) {
  if (AE.cfg.voices[ch]) return AE.cfg.voices[ch];
  const o = {}; for (const [e, l] of Object.entries(VOICE_PACKS[ch] || {})) o[e] = l.slice(); return (AE.cfg.voices[ch] = o);
}
function aeClips(ch) {   // todos los audios del personaje: los que tienen acción + los que hay en la carpeta
  const set = new Set(); for (const l of Object.values(aeEvents(ch))) for (const c of l) set.add(c);
  for (const f of (AE.files[ch] || [])) set.add(f.replace(/\.mp3$/, ''));
  return [...set].sort();
}
const aeActionsOf = (ch, clip) => Object.entries(aeEvents(ch)).filter(([, l]) => l.includes(clip)).map(([e]) => e);
function aeItems() {
  const t = AE.tab, q = AE.filter.toLowerCase(), out = [];
  if (t === 'sfx') for (const n of SFX_NAMES) out.push({ id: n, label: n, sub: AE.cfg.sfx[n] && AE.cfg.sfx[n].file ? 'archivo propio' : 'sintetizado', url: AE.cfg.sfx[n] && AE.cfg.sfx[n].file, kind: 'sfx' });
  else if (t === 'music') {
    const def = {
      menu2: ['Menú · Bit Rush (Arcade)', 'musica/calfight_arcade.mp3'],
      menu3: ['Menú · Nocturno Lo-Fi', 'musica/calfight_nocturno.mp3'],
      menu: ['Música del menú (clásica)', 'musica/menu.mp3'],
      fight1: ['Pelea 1', 'musica/pelea1.mp3'],
      fight2: ['Pelea 2', 'musica/pelea2.mp3'],
      fight3: ['Pelea 3', 'musica/pelea3.mp3'],
      intro: ['Pantalla de inicio', 'musica/calfight_intro.mp3']
    };
    for (const [id, [l, f]] of Object.entries(def)) out.push({ id, label: l, sub: (AE.cfg.music[id] && AE.cfg.music[id].file) || f, url: (AE.cfg.music[id] && AE.cfg.music[id].file) || f, kind: 'music', dflt: f });
    for (const id of CHAR_IDS) out.push({ id: 'ult_' + id, label: 'Ulti de ' + CHARS[id].name, sub: (AE.cfg.music['ult_' + id] && AE.cfg.music['ult_' + id].file) || ultMusicRel(id), url: (AE.cfg.music['ult_' + id] && AE.cfg.music['ult_' + id].file) || ultMusicRel(id), kind: 'music', dflt: ultMusicRel(id) });
  } else if (t === 'amb') for (const n of SND_LIST.filter(n => !CHARACTER_VOICE_KEYS.has(n) && !/^randi_/.test(n))) out.push({ id: n, label: n.replace(/_/g, ' '), sub: (AE.cfg.amb[n] && AE.cfg.amb[n].file) || 'sonidos/' + n + '.mp3', url: (AE.cfg.amb[n] && AE.cfg.amb[n].file) || 'sonidos/' + n + '.mp3', kind: 'amb', dflt: 'sonidos/' + n + '.mp3' });
  else if (t === 'voices' && AE.char) for (const c of aeClips(AE.char)) { const key = AE.char + '/' + c, acts = aeActionsOf(AE.char, c); out.push({ id: key, label: c, sub: acts.length ? acts.map(aeLabel).join(' · ') : 'sin acción asignada', url: voiceRel(key), kind: 'voice', clip: c }); }
  return out.filter(i => !q || (i.label + ' ' + i.sub).toLowerCase().includes(q));
}
function aeStop() { if (AE.aud) { try { AE.aud.pause(); } catch (e) { } AE.aud = null; } }
function aePlay(url) { aeStop(); const a = new Audio(url + (url.startsWith('blob:') ? '' : '?t=' + Date.now())); a.volume = .9; AE.aud = a; a.addEventListener('timeupdate', () => { const p = $('ae-prog'); if (p && a.duration) p.value = a.currentTime / a.duration * 100; }); a.addEventListener('ended', () => { const p = $('ae-prog'); if (p) p.value = 0; }); a.addEventListener('error', () => aeMsg('No se pudo reproducir ese archivo.')); a.play().catch(() => aeMsg('El navegador bloqueó el audio: tocá de nuevo.')); }
function aeMsg(t) { const m = $('ae-msg'); if (m) { m.textContent = t; clearTimeout(AE.mt); AE.mt = setTimeout(() => { m.textContent = ''; }, 6000); } }
function aeRender() {
  if (!AE.open) return;
  document.querySelectorAll('#audedit .ae-tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === AE.tab));
  const side = $('ae-side'), body = $('ae-body');
  if (AE.tab === 'voices' && !AE.char) {   // primero elegir personaje (aunque no tenga audios)
    side.innerHTML = '<div class="ae-h">Elegí el personaje</div><div class="ae-chars"></div>'; const box = side.querySelector('.ae-chars');
    for (const id of CHAR_IDS) { const ch = CHARS[id], n = Object.values(aeEvents(id)).flat().length; const b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--cc', ch.color); const cv = document.createElement('canvas'); cv.className = 'px'; headPortrait(charSkin(id), cv); b.appendChild(cv); b.insertAdjacentHTML('beforeend', `<b>${ch.name}</b><small>${n ? n + ' acciones con audio' : 'sin audios todavía'}</small>`); b.addEventListener('click', async () => { AE.char = id; AE.sel = null; await aeLs(id); aeRender(); }); box.appendChild(b); }
    body.innerHTML = '<div class="ae-empty">Elegí un personaje para ver y editar sus voces.</div>'; return;
  }
  const items = aeItems(); side.innerHTML = '';
  const head = document.createElement('div'); head.className = 'ae-h';
  if (AE.tab === 'voices') { head.innerHTML = `<button type="button" id="ae-back">← Personajes</button> <b>${CHARS[AE.char].name}</b>`; }
  else head.innerHTML = `<b>${{ sfx: 'Sonidos del juego (golpes, saltos…)', music: 'Música', amb: 'Sonido ambiente' }[AE.tab]}</b>`;
  side.appendChild(head);
  const fi = document.createElement('input'); fi.id = 'ae-filter'; fi.placeholder = 'Buscar…'; fi.value = AE.filter; fi.addEventListener('input', e => { AE.filter = e.target.value; const p = e.target.selectionStart; aeRender(); const n = $('ae-filter'); n.focus(); n.setSelectionRange(p, p); }); side.appendChild(fi);
  const ul = document.createElement('ul'); ul.className = 'ae-list';
  for (const it of items) { const li = document.createElement('li'); li.className = AE.sel && AE.sel.id === it.id ? 'on' : ''; li.innerHTML = `<b>${it.label}</b><small>${it.sub}</small>`; li.addEventListener('click', () => { AE.sel = it; aeStop(); aeRender(); }); ul.appendChild(li); }
  if (!items.length) ul.innerHTML = '<li class="empty">' + (AE.tab === 'voices' ? 'Este personaje todavía no tiene audios. Subí el primero con “＋ Subir audio”.' : 'Nada para mostrar.') + '</li>';
  side.appendChild(ul);
  if (AE.tab === 'voices') { const up = document.createElement('button'); up.type = 'button'; up.className = 'ae-add'; up.textContent = '＋ Subir audio'; up.addEventListener('click', () => aeUpload(null)); side.appendChild(up); const b = $('ae-back'); if (b) b.addEventListener('click', () => { AE.char = null; AE.sel = null; aeStop(); aeRender(); }); }
  else { const hint = document.createElement('div'); hint.className = 'ae-hint'; hint.textContent = AE.tab === 'sfx' ? 'Cada sonido se puede reemplazar por un archivo tuyo y ajustar su volumen y frecuencia.' : 'Elegí uno y reemplazalo por tu archivo; el volumen vale para todos.'; side.appendChild(hint); }
  aeDetail();
}
async function aeLs(ch) { AE.files[ch] = []; if (await aeSrv()) { for (const dir of charSoundDirs(ch)) { try { const r = await fetch('/ls?p=' + encodeURIComponent(dir)); const j = await r.json(); for (const f of j.files) if (/\.mp3$/.test(f.name) && !AE.files[ch].includes(f.name)) AE.files[ch].push(f.name); } catch (e) { } } } }
function aeSlider(id, label, min, max, step, val, fmt) { return `<label class="ae-sl"><span>${label} <output id="${id}-o">${fmt(val)}</output></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`; }
function aeDetail() {
  const body = $('ae-body'), it = AE.sel; if (!it) { body.innerHTML = '<div class="ae-empty">Elegí un audio de la lista.</div>'; return; }
  const cfgKey = it.kind === 'voice' ? 'clip' : it.kind, cur = (cfgKey === 'clip' ? AE.cfg.clip[it.id] : AE.cfg[cfgKey][it.id]) || {};
  const set = (k, v) => { const store = cfgKey === 'clip' ? AE.cfg.clip : AE.cfg[cfgKey]; (store[it.id] || (store[it.id] = {}))[k] = v; AE.dirty = true; };
  let h = `<h3>${it.label}</h3><div class="ae-src">${it.kind === 'sfx' && !it.url ? 'Sonido sintetizado por el juego' : it.url}</div>
    <div class="ae-player"><button type="button" id="ae-play">▶ Escuchar</button><button type="button" id="ae-stop">■</button><progress id="ae-prog" max="100" value="0"></progress></div>`;
  h += aeSlider('ae-vol', 'Volumen', 0, 200, 5, Math.round((cur.vol ?? 1) * 100), v => v + ' %');
  if (it.kind === 'sfx' || it.kind === 'voice') { h += aeSlider('ae-chance', 'Frecuencia (probabilidad de sonar)', 0, 100, 5, Math.round((cur.chance ?? 1) * 100), v => v + ' %'); h += aeSlider('ae-cd', 'Espera entre veces', 0, 60, .5, cur.cd ?? 0, v => v + ' s'); }
  if (it.kind === 'sfx') h += `<label class="ae-chk"><input type="checkbox" id="ae-off" ${cur.off ? 'checked' : ''}> Silenciar este sonido</label>`;
  h += '<div class="ae-btns">';
  h += `<button type="button" id="ae-rep">${it.kind === 'voice' ? 'Reemplazar el archivo…' : 'Usar mi propio archivo…'}</button>`;
  if (it.kind !== 'voice' && cur.file) h += '<button type="button" id="ae-orig">Volver al original</button>';
  if (it.kind === 'voice') h += `<button type="button" id="ae-delclip" class="danger">${AE.cfg.up[it.id] ? 'Borrar este audio' : 'Quitar de las acciones'}</button>`;
  h += '</div>';
  if (it.kind === 'voice') {   // lógica: en qué acciones del juego suena
    const acts = new Set(aeActionsOf(AE.char, it.clip)), extra = Object.keys(aeEvents(AE.char)).filter(e => !AE_LABEL[e]);
    h += '<div class="ae-logic"><h4>Lógica · cuándo suena este audio</h4><small>Marcá las acciones del jugador. Si marcás varias, suena en cualquiera de ellas. Varios audios en la misma acción: el juego elige uno al azar.</small>';
    for (const [g, list] of [...AE_ACTIONS, ...(extra.length ? [['Especiales de este personaje', extra.map(e => [e, aeLabel(e)])]] : [])]) {
      h += `<div class="ae-grp"><b>${g}</b>`; for (const [e, l] of list) h += `<label><input type="checkbox" data-act="${e}" ${acts.has(e) ? 'checked' : ''}> ${l}</label>`; h += '</div>';
    }
    h += '</div>';
  }
  body.innerHTML = h;
  $('ae-play').addEventListener('click', () => { if (it.kind === 'sfx' && !it.url) { D.SFX_RAW = true; D.SFX_FORCE = true; sfx(it.id); D.SFX_RAW = false; D.SFX_FORCE = false; } else aePlay(it.url); });
  $('ae-stop').addEventListener('click', aeStop);
  const bindS = (id, key, mul, fmt) => { const el = $(id); if (!el) return; el.addEventListener('input', () => { $(id + '-o').textContent = fmt(+el.value); set(key, +el.value / mul); }); };
  bindS('ae-vol', 'vol', 100, v => v + ' %'); bindS('ae-chance', 'chance', 100, v => v + ' %'); bindS('ae-cd', 'cd', 1, v => v + ' s');
  if ($('ae-off')) $('ae-off').addEventListener('change', e => set('off', e.target.checked));
  $('ae-rep').addEventListener('click', () => aeUpload(it));
  if ($('ae-orig')) $('ae-orig').addEventListener('click', () => { delete AE.cfg[cfgKey][it.id].file; AE.dirty = true; aeRender(); });
  if ($('ae-delclip')) $('ae-delclip').addEventListener('click', async () => {
    const ok = await uiConfirm(AE.cfg.up[it.id] ? '¿Borrar este audio de la carpeta del juego?' : '¿Quitar este audio de todas sus acciones? (El archivo queda en la carpeta.)', true); if (!ok) return;
    for (const e of Object.keys(aeEvents(AE.char))) aeEvents(AE.char)[e] = aeEvents(AE.char)[e].filter(c => c !== it.clip);
    if (AE.cfg.up[it.id] && await aeSrv()) { try { await fetch('/del?p=' + encodeURIComponent(voiceRel(it.id)), { method: 'DELETE' }); } catch (e) { } delete AE.cfg.up[it.id]; AE.files[AE.char] = (AE.files[AE.char] || []).filter(f => f !== it.clip + '.mp3'); }
    AE.sel = null; AE.dirty = true; aeRender();
  });
  body.querySelectorAll('[data-act]').forEach(c => c.addEventListener('change', () => {
    const ev = aeEvents(AE.char), e = c.dataset.act; ev[e] = ev[e] || [];
    if (c.checked) { if (!ev[e].includes(it.clip)) ev[e].push(it.clip); } else ev[e] = ev[e].filter(x => x !== it.clip);
    if (!ev[e].length) ev[e] = [];   // evento vacío = sin audio
    AE.dirty = true; const li = document.querySelector('#ae-side li.on small'); if (li) { const a = aeActionsOf(AE.char, it.clip); li.textContent = a.length ? a.map(aeLabel).join(' · ') : 'sin acción asignada'; }
  }));
}
async function aeDecodeDur(buf) { try { const c = new (window.AudioContext || window.webkitAudioContext)(); const d = await c.decodeAudioData(buf.slice(0)); c.close(); return d.duration; } catch (e) { return 0; } }
async function aeUpload(it) {
  if (!(await aeSrv())) { await uiAlert('Para subir o reemplazar audios abrí el editor con el servidor del modo desarrollador: doble clic en Iniciar_Editor.bat (o python tools/dev-server.py).', 'SERVIDOR LOCAL'); return; }
  const f = document.createElement('input'); f.type = 'file'; f.accept = 'audio/*,.mp3,.wav,.ogg,.m4a';
  f.onchange = async () => {
    const file = f.files[0]; if (!file) return; const buf = await file.arrayBuffer(), dur = await aeDecodeDur(buf);
    let name = file.name.replace(/\.[^.]+$/, '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'audio';
    const ext = (file.name.match(/\.[^.]+$/) || ['.mp3'])[0].toLowerCase();
    let rel;
    if (it && it.kind === 'voice') rel = voiceRel(it.id); else if (it && it.kind === 'sfx') rel = 'sonidos/general/' + it.id + '.mp3'; else if (it && it.kind === 'music') rel = it.id.startsWith('ult_') ? 'personajes/' + it.id.slice(4) + '/Skills/Ulti/Sound/ulti_propia.mp3' : 'musica/' + it.id + '_propia.mp3'; else if (it && it.kind === 'amb') rel = 'sonidos/ambiente/' + it.id + '.mp3'; else rel = charSoundRel(AE.char, name);
    if (!(it && it.kind === 'voice') && AE.tab === 'voices') { let n = 2, base = name; while ((AE.files[AE.char] || []).includes(name + '.mp3') || aeClips(AE.char).includes(name)) name = base + '_' + n++; rel = charSoundRel(AE.char, name); }
    aeMsg('Subiendo…');
    try {
      const r = await fetch('/upload?p=' + encodeURIComponent(rel.replace(/\.mp3$/, ext)), { method: 'POST', body: buf }), j = await r.json();
      if (!r.ok) { aeMsg(j.error || 'No se pudo subir.'); return; }
      rel = j.file;
      if (it && it.kind !== 'voice') { const st = AE.cfg[it.kind][it.id] || (AE.cfg[it.kind][it.id] = {}); st.file = rel; }
      else if (it && it.kind === 'voice') { AE.cfg.dur[it.id] = dur || AE.cfg.dur[it.id]; }
      else { const key = AE.char + '/' + name; AE.cfg.up[key] = 1; AE.cfg.dur[key] = dur || 2; AE.files[AE.char] = [...(AE.files[AE.char] || []), name + '.mp3']; AE.sel = { id: key, label: name, kind: 'voice', clip: name, url: rel, sub: 'sin acción asignada' }; }
      AE.dirty = true; aeMsg('Subido: ' + rel); aeRender();
    } catch (e) { aeMsg('No se pudo subir (¿está abierto el servidor?).'); }
  };
  f.click();
}
async function aeSave(reload) {
  const cfg = aeClone(AE.cfg); cfg.v = 1;
  for (const ch in cfg.voices) { for (const e in cfg.voices[ch]) if (!cfg.voices[ch][e].length) cfg.voices[ch][e] = []; }
  const txt = JSON.stringify(cfg, null, 1); try { localStorage.setItem('bsb_audiocfg', txt); } catch (e) { }
  let how = 'guardado en este navegador';
  if (await aeSrv()) { try { const r = await fetch('/save?p=config/audio.json', { method: 'POST', body: txt }); if (r.ok) how = 'guardado en config/audio.json'; } catch (e) { } }
  else { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'application/json' })); a.download = 'audio.json'; a.click(); how = 'descargado como audio.json (ponelo en la carpeta config/ para que valga para todos)'; }
  AE.dirty = false; aeMsg('Listo: ' + how + '.'); if (reload) setTimeout(() => location.reload(), 700);
}
function aeBuild() {
  if (AE.el) return;
  const st = document.createElement('style');
  st.textContent = `#audedit{position:fixed;inset:0;z-index:80;background:#0b0e16;color:#e8ecf4;font:14px/1.4 system-ui,sans-serif;display:grid;grid-template-columns:340px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}#audedit.hidden{display:none}
#audedit .ae-top{grid-column:1/-1;display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;background:#121726;border-bottom:1px solid #263050}
#audedit h2{margin:0 12px 0 0;font:italic 900 20px var(--display,sans-serif);color:#ffb020}#audedit .ae-tabs{display:flex;gap:4px}
#audedit button{background:#1c2234;color:#e8ecf4;border:1px solid #333c55;border-radius:6px;padding:7px 13px;cursor:pointer;font:inherit}#audedit button:hover{background:#2a3452}
#audedit .ae-tabs button.on{background:#ffb020;color:#000;border-color:#ffb020;font-weight:700}#audedit button.pri{background:#ffb020;color:#000;border-color:#ffb020;font-weight:700}#audedit button.danger{background:#5a2330;border-color:#8a3346}
#audedit .ae-sp{flex:1}#ae-msg{color:#9dffb6;font-size:13px}
#ae-side{display:flex;flex-direction:column;min-height:0;border-right:1px solid #263050;background:#0f1320}#ae-body{overflow:auto;padding:18px 24px;min-height:0}
#ae-side .ae-h{padding:10px 12px;border-bottom:1px solid #263050;display:flex;gap:8px;align-items:center}#ae-filter{margin:8px 10px;background:#05060c;border:1px solid #333c55;color:#fff;padding:7px 9px;border-radius:4px}
.ae-list{list-style:none;margin:0;padding:0 6px;overflow:auto;flex:1}.ae-list li{padding:7px 10px;border-radius:5px;cursor:pointer;display:flex;flex-direction:column}.ae-list li:hover{background:#1c2234}.ae-list li.on{background:#3a4a7a}.ae-list li small{color:#8a96b0;font-size:12px}.ae-list li.empty{cursor:default;color:#8a96b0}
.ae-add{margin:8px 10px 10px!important}.ae-hint{padding:8px 12px;font-size:12px;color:#8a96b0;border-top:1px solid #263050}
.ae-chars{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;overflow:auto}.ae-chars button{display:flex;flex-direction:column;align-items:center;gap:4px;border-bottom:3px solid var(--cc)!important;padding:10px 6px!important}.ae-chars canvas{width:48px;height:48px;image-rendering:pixelated}.ae-chars small{color:#8a96b0;font-size:11px;text-align:center}
.ae-empty{color:#8a96b0;padding:40px}#ae-body h3{margin:0 0 4px;font:italic 900 28px var(--display,sans-serif)}.ae-src{color:#8a96b0;font-size:12px;margin-bottom:12px;word-break:break-all}
.ae-player{display:flex;gap:8px;align-items:center;margin-bottom:16px}#ae-prog{flex:1;height:10px}
.ae-sl{display:block;margin:0 0 12px;max-width:520px}.ae-sl span{display:flex;justify-content:space-between;color:#aab4cc;font-size:13px}.ae-sl input{width:100%;accent-color:#ffb020}
.ae-chk{display:block;margin:0 0 12px}.ae-btns{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 18px}
.ae-logic{max-width:760px;border-top:1px solid #263050;padding-top:12px}.ae-logic h4{margin:0 0 4px;font-size:16px;color:#ffb020}.ae-logic>small{color:#8a96b0}
.ae-grp{margin-top:12px}.ae-grp b{display:block;color:#aab4cc;font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}.ae-grp label{display:inline-flex;gap:6px;align-items:center;margin:2px 14px 2px 0;font-size:14px;cursor:pointer}.ae-grp input{accent-color:#ffb020}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'audedit'; el.className = 'hidden';
  el.innerHTML = `<div class="ae-top"><h2>EDITOR DE AUDIO</h2><div class="ae-tabs"><button type="button" data-t="sfx">Sonidos generales</button><button type="button" data-t="music">Música</button><button type="button" data-t="amb">Sonido ambiente</button><button type="button" data-t="voices" class="on">Voces</button></div>
    <span class="ae-sp"></span><span id="ae-msg"></span><button type="button" id="ae-save">Guardar</button><button type="button" id="ae-apply" class="pri">Guardar y probar ▸</button><button type="button" id="ae-close">Cerrar</button></div>
    <div id="ae-side"></div><div id="ae-body"></div>`;
  document.body.appendChild(el); AE.el = el;
  el.querySelectorAll('.ae-tabs button').forEach(b => b.addEventListener('click', () => { AE.tab = b.dataset.t; AE.sel = null; AE.filter = ''; aeStop(); aeRender(); }));
  $('ae-save').addEventListener('click', () => aeSave(false)); $('ae-apply').addEventListener('click', () => aeSave(true)); $('ae-close').addEventListener('click', aeClose);
  addEventListener('keydown', e => { if (!AE.open) return; const dl = $('uidlg'), dlg = dl && !dl.classList.contains('hidden'); if (dlg) return; if (e.code === 'Escape' && !/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) aeClose(); e.stopImmediatePropagation(); }, true);
}
async function aeOpen() {
  if (!D.DEV.on) return; aeBuild(); AE.cfg = aeClone(AUDIO_CFG); for (const k of Object.keys(aeDef())) if (!AE.cfg[k]) AE.cfg[k] = aeDef()[k];
  AE.open = true; AE.el.classList.remove('hidden'); AE.dirty = false; AE.sel = null; AE.char = null; AE.srv = null; document.body.classList.add('guide-on'); initAudio(); aeRender(); aeSrv();
}
async function aeClose() {
  if (!AE.open) return; if (AE.dirty && !(await uiConfirm('Hay cambios sin guardar. ¿Cerrar igual?', true))) return;
  aeStop(); AE.open = false; AE.el.classList.add('hidden'); document.body.classList.remove('guide-on');
}
$('audedbtn').addEventListener('click', () => { sfx('select'); aeOpen(); });

  return { AE, AE_ACTIONS, AE_LABEL, SFX_NAMES, aeActionsOf, aeBuild, aeClips, aeClone, aeClose, aeDecodeDur, aeDef, aeDetail, aeEvents, aeItems, aeLabel, aeLs, aeMsg, aeOpen, aePlay, aeRender, aeSave, aeSlider, aeSrv, aeStop, aeUpload };
};
