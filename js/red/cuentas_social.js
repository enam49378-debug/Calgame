// Cuentas Firebase y sistema social
// Se separó de js/game.js. game.js crea el módulo en el mismo lugar donde estaba el código, pasándole lo que necesita.
window.CF_RED = window.CF_RED || {};

window.CF_RED.crearCuentasSocial = function crearCuentasSocial(D) {
  'use strict';
  const { $, CHARS, CHAR_IDS, DEV, FX, G, GFX, IS_GUIDE, IS_LOCAL_HOST, NET, PROFILE_IMAGE_MAX, PROJ, ROOM_UI, ST, charSkin, clamp, cleanPublicProfile, devApply, devHasLocalToken, entryProfile, headPortrait, localPublicProfile, netShareProfile, ownerOpen, playerProfileOpen, profileCardContent, profileCardStats, profileCareerStats, rawEntryProfile, refreshRoomBoard, requestLock, roomClearInput, roomEntries, setRoomBoard, sfx, stForget, syncFriendsBtnPlace, syncOwnerBeta, uiAlert, uiDialog, unlock } = D;

// ===== Cuentas (Firebase Authentication): correo y contraseña, o Google =====
// El juego se puede jugar sin cuenta. La cuenta identifica al jugador (su nombre en las salas) y reconoce al dueño. Las contraseñas las maneja Google, el juego nunca las guarda.
const ACCT = { cfg: { apiKey: 'AIzaSyBY4zI1ZpEFlNnotZ8_Yxe5hzT9Ks5jhCc', authDomain: 'calgame.firebaseapp.com', projectId: 'calgame', storageBucket: 'calgame.firebasestorage.app', messagingSenderId: '358897395123', appId: '1:358897395123:web:49d862e4e14b14cc4197c6' },
  user: null, auth: null, loading: null, mode: 'in', busy: false, ownerH: ['9d146dbc10561ea319eaa1854c3852babfd5bb58c4082f7309a6f5b9d9073146'] };
const ACCT_ERR = {
  'auth/invalid-email': 'Ese correo no es válido.', 'auth/missing-email': 'Escribí tu correo.', 'auth/missing-password': 'Escribí tu contraseña.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.', 'auth/wrong-password': 'Correo o contraseña incorrectos.',   // el mismo mensaje en los dos casos: no se puede averiguar si un correo tiene cuenta
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo: probá en “Entrar”.', 'auth/weak-password': 'La contraseña es muy débil: usá al menos 8 caracteres con letras y números.',
  'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.', 'auth/cancelled-popup-request': 'Ya hay una ventana de Google abierta.', 'auth/popup-blocked': 'El navegador bloqueó la ventana de Google: permití las ventanas emergentes de esta página.',
  'auth/unauthorized-domain': 'Esta dirección web no está autorizada en Firebase (Authentication → Configuración → Dominios autorizados).', 'auth/network-request-failed': 'No hay conexión con el servidor de cuentas.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá un rato y probá de nuevo.', 'auth/operation-not-allowed': 'Ese método de acceso no está activado en Firebase.', 'auth/user-disabled': 'Esta cuenta está desactivada.'
};
const acctMsg = (t, ok) => { const m = $('acct-msg'); if (m) { m.textContent = t || ''; m.classList.toggle('ok', !!ok); } };
const acctErr = e => (e && e.code === 'calfight/msg' ? e.message : ACCT_ERR[e && e.code]) || ('No se pudo completar (' + ((e && (e.code || e.message)) || 'error') + ').');

// ---- Protección de la cuenta (además de lo que ya hace Firebase): contraseña fuerte al crear la cuenta y freno a los intentos fallidos de entrar
const ACCT_COMMON = ['password', '12345678', '123456789', '1234567890', 'qwertyuiop', 'contraseña', 'contrasena', 'calfight', 'calgame', 'minecraft', 'iloveyou', 'abc12345', '11111111', '00000000', 'password1', 'qwerty123', 'admin123', '123123123', 'asdfghjkl', '12341234', 'letmein123', 'welcome123'];
function acctPwProblem(pw, email) {
  if (pw.length < 8) return 'La contraseña tiene que tener al menos 8 caracteres.';
  if (pw.length > 128) return 'La contraseña es demasiado larga (máximo 128).';
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Usá letras y números en la contraseña.';
  const low = pw.toLowerCase(), local = (email || '').split('@')[0].toLowerCase();
  if (/^(.)\1+$/.test(pw) || ACCT_COMMON.includes(low) || /^(01234567|abcdefgh|qwertyui|asdfghjk)/.test(low)) return 'Esa contraseña es muy fácil de adivinar: elegí otra.';
  if (local.length >= 4 && low.includes(local)) return 'La contraseña no puede contener tu correo.';
  return '';
}
const ACCT_FAIL_KEY = 'bsb_acct_fail';
function acctFailList() { try { return (JSON.parse(localStorage.getItem(ACCT_FAIL_KEY)) || []).filter(t => Number.isFinite(t) && Date.now() - t < 600000); } catch (e) { return []; } }
function acctLockLeft() { const a = acctFailList(); if (a.length < 5) return 0; return Math.max(0, Math.ceil((a[a.length - 1] + Math.min(300, 15 * 2 ** (a.length - 5)) * 1000 - Date.now()) / 1000)); }   // 5 fallos en 10 min: espera 15 s, 30 s, 60 s… hasta 5 min
function acctFailed() { try { const a = acctFailList(); a.push(Date.now()); localStorage.setItem(ACCT_FAIL_KEY, JSON.stringify(a.slice(-12))); } catch (e) { } }
const acctFailClear = () => { try { localStorage.removeItem(ACCT_FAIL_KEY); } catch (e) { } };
const acctEx = m => { const e = new Error(m); e.code = 'calfight/msg'; return e; };
function acctLoad() {
  if (IS_GUIDE) return Promise.reject(new Error('no'));
  if (ACCT.loading) return ACCT.loading;
  const add = (src, sri) => new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = src; sc.integrity = sri; sc.crossOrigin = 'anonymous'; sc.onload = ok; sc.onerror = () => no(new Error('No se pudo cargar el inicio de sesión (¿sin internet?)')); document.head.appendChild(sc); });
  ACCT.loading = add('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'sha384-AQ3POAMqIhwS81FrUH95ekxqBZHeP5tG2JfEL3+7GuTtfRLWnrRh32UxwzM+//A9')
    .then(() => add('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js', 'sha384-TnlRYaR4JYz/lpaGuaiU61PjNberSA4vjLjtF+oRC/IkohkJqnWxw5EmDSOt1vA1'))
    .then(() => { firebase.initializeApp(ACCT.cfg); ACCT.auth = firebase.auth(); ACCT.auth.languageCode = 'es'; ACCT.auth.onAuthStateChanged(u => { ACCT.user = u; acctChanged(); }); })
    .catch(e => { ACCT.loading = null; throw e; });
  return ACCT.loading;
}
// Tras verificar el correo en otra pestaña, Firebase sigue con el usuario y el token antiguos (email_verified=false)
// y las reglas rechazan perfil, banner y mensajes hasta que se refresquen. Esto los actualiza sin cerrar sesión.
async function acctRefreshVerified(manual) {
  const u = ACCT.user; if (!u || u.emailVerified || ACCT.refreshing) return false;
  ACCT.refreshing = true;
  try { await u.reload(); if (ACCT.auth?.currentUser !== u || !u.emailVerified) { if (manual) acctMsg('Todavía no aparece verificado. Abrí el enlace del correo y probá otra vez.'); return false; }
    await u.getIdToken(true); acctMsg('¡Correo verificado! Ya podés usar amigos, mensajes y tu perfil.', true); await acctChanged(); return true;
  } catch (e) { if (manual) acctMsg(acctErr(e)); return false; } finally { ACCT.refreshing = false; }
}
addEventListener('focus', () => { if (ACCT.user && !ACCT.user.emailVerified) acctRefreshVerified(false); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && ACCT.user && !ACCT.user.emailVerified) acctRefreshVerified(false); });
async function acctSha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('calfight:' + t.toLowerCase().trim())); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function acctChanged() {
  const u = ACCT.user, nm = u ? (u.displayName || (u.email || '').split('@')[0] || 'Jugador') : '';
  try { localStorage.setItem('bsb_acct', u ? '1' : '0'); } catch (e) { }
  acctPaint(); netShareProfile(); socialAuthChanged();
  if (u && (!localStorage.getItem('bsb_name') || localStorage.getItem('bsb_name') === 'Jugador')) { const inp = $('pname-in'); inp.value = nm.slice(0, 16); try { localStorage.setItem('bsb_name', inp.value); } catch (e) { } try { D.netMenuPresence(); } catch (e) { } }
  // la cuenta del dueño (correo verificado) activa el modo desarrollador sin pedir la clave
  if (u && u.emailVerified && u.email && ACCT.ownerH.length && ACCT.ownerH.includes(await acctSha(u.email)) && !DEV.on) { DEV.on = true; devApply(); stForget(); ST.owner = true; }
  else if (!u && DEV.on) { DEV.on = IS_LOCAL_HOST || devHasLocalToken(); devApply(); }
  if ($('acctdlg') && !$('acctdlg').classList.contains('hidden')) acctRender();
}

// Apariencia de perfiles, independiente de los roles concedidos por el dueño.
const PROFILE_THEMES = [['midnight','Medianoche'],['glass','Cristal'],['sakura','Sakura'],['ocean','Océano'],['ember','Ascua'],['mono','Monocromo']];
const PROFILE_AURAS = [['none','Sin aura'],['gold','Dorada'],['aurora','Aurora'],['flame','Llama'],['electric','Eléctrica'],['sakura','Sakura'],['frost','Escarcha'],['void','Vacío']];
const PROFILE_STICKERS = {cal:['','CAL'],star:['⭐','Estrella'],heart:['💜','Corazón'],bolt:['⚡','Rayo'],moon:['🌙','Luna'],crown:['👑','Corona'],sword:['⚔️','Espadas'],diamond:['💎','Diamante'],flower:['🌸','Flor'],ghost:['👻','Fantasma'],fire:['🔥','Fuego'],ice:['❄️','Hielo'],wave:['🌊','Ola'],clippy:['📎','Clippy'],javi:['🔱','Lanza'],gull:['🕊️','Gaviota'],onion:['🧅','Sebolla'],pixel:['👾','Píxel']};
const PROFILE_FRAMES = [['none','Ninguno'],['comic','Cómic Pop'],['garabatos','Garabatos'],['graffiti','Graffiti'],['ember','Forja'],['frost','Escarcha'],['neon','Circuito']];
const PROFILE_EFFECTS = [['none','Ninguno'],['comic','Líneas Cómic'],['garabatos','Garabatos'],['graffiti','Spray Graffiti'],['embers','Brasas'],['scan','Pulso digital'],['aurora','Aurora']];
// Extras tipo Discord (van en p.fx): decoracion del avatar, efecto sobre toda la ficha, estilo del nombre, segundo color y fecha de alta
const PROFILE_DECOS = [['none','Ninguna'],['comic','Comic Pop'],['garabatos','Garabatos'],['graffiti','Graffiti'],['cyber','Cyber Glitch'],['sparkles','Estrellitas'],['orbita','Órbita'],['fuego','Anillo de fuego'],['neon','Neón'],['corona','Corona'],['orejas','Orejas de gato'],['halo','Halo'],['petalos','Pétalos'],['pixel','Marco pixel']];
const PROFILE_CARDFX = [['none','Ninguno'],['comic','Comic Action'],['garabatos','Garabatos'],['graffiti','Graffiti Spray'],['estrellas','Estrellas'],['nieve','Nieve'],['petalos','Pétalos'],['burbujas','Burbujas'],['confeti','Confeti'],['pixeles','Píxeles'],['luciernagas','Luciérnagas'],['corazones','Corazones']];
const PROFILE_NAMEFX = [['normal','Normal'],['neon','Neón'],['arcoiris','Arcoíris'],['dorado','Dorado'],['glitch','Glitch']];
function cleanProfileFx(x) {
  if (!x || typeof x !== 'object') return undefined;
  const pick = (list, v, d) => list.some(([id]) => id === v) ? v : d;
  const r = { deco: pick(PROFILE_DECOS, x.deco, 'none'), fx: pick(PROFILE_CARDFX, x.fx, 'none'), nf: pick(PROFILE_NAMEFX, x.nf, 'normal'),
    c2: /^#[\da-f]{6}$/i.test(x.c2 || '') ? x.c2 : '', since: /^\d{4}-\d{2}-\d{2}$/.test(x.since || '') ? x.since : '' };
  if (r.deco === 'none' && r.fx === 'none' && r.nf === 'normal' && !r.c2 && !r.since) return undefined;
  return r;
}
function cleanProfileDecor(decor, stickers) {
  if (!decor || typeof decor !== 'object') return undefined;
  const frame = PROFILE_FRAMES.some(([id]) => id === decor.frame) ? decor.frame : 'none';
  const effect = PROFILE_EFFECTS.some(([id]) => id === decor.effect) ? decor.effect : 'none';
  const positions = [];
  if (Array.isArray(decor.positions)) {
    for (const id of stickers) {
      const point = decor.positions.slice(0, 6).find(p => p?.id === id);
      if (point && Number.isInteger(point.x) && Number.isInteger(point.y)) {
        positions.push({id, x: clamp(point.x, 0, 1000), y: clamp(point.y, 0, 1000)});
      }
    }
  }
  if (frame === 'none' && effect === 'none' && !positions.length) return undefined;
  return {frame, effect, positions};
}
const PROFILE_MAP_BANNERS = [['plaza','Plaza Aurora'],['beach','Playa de Sekza'],['casino','Noche de casino'],['rooftops','Azoteas'],['raincity','Ciudad bajo la lluvia'],['forestpath','Parque tranquilo'],['sunsetpier','Atardecer en el muelle'],['arcade','Arcade neón']];
const profileText=(s,n)=>typeof s==='string'?s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,n):'';
function compactProfileImage(src,w,h,max){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas'),g=c.getContext('2d', { willReadFrequently: true });for(const scale of [1,.8,.6]){c.width=Math.round(w*scale);c.height=Math.round(h*scale);const r=Math.max(c.width/im.width,c.height/im.height);g.drawImage(im,(c.width-im.width*r)/2,(c.height-im.height*r)/2,im.width*r,im.height*r);for(const q of [.75,.55,.35,.2]){const d=c.toDataURL('image/jpeg',q);if(d.length<=max)return resolve(d);}}resolve('');}catch(e){resolve('');}};im.onerror=()=>resolve('');im.src=src;});}
function cleanCosmetics(p={}) {
  const result = {bio:profileText(p.bio,240),pronouns:profileText(p.pronouns,32),status:profileText(p.status,80),accent:/^#[\da-f]{6}$/i.test(p.accent||'')?p.accent:'#a5a0ff',theme:PROFILE_THEMES.some(x=>x[0]===p.theme)?p.theme:'midnight',aura:PROFILE_AURAS.some(x=>x[0]===p.aura)?p.aura:'none',stickers:Array.isArray(p.stickers)?[...new Set(p.stickers.filter(x=>Object.hasOwn(PROFILE_STICKERS,x)))].slice(0,6):[]};
  const decor = cleanProfileDecor(p.decor, result.stickers);
  if (decor) result.decor = decor;
  const fx = cleanProfileFx(p.fx);
  if (fx) result.fx = fx;
  return result;
}
const cosmeticKey=()=> 'cf_profile_v2_'+(ACCT.user?.uid||'guest');
function cosmeticsGet(){try{return cleanCosmetics(JSON.parse(localStorage.getItem(cosmeticKey())||'{}'));}catch(e){return cleanCosmetics();}}
function avatarGet(){try{const a=localStorage.getItem(cosmeticKey()+'_avatar')||'';return a.length<=14000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(a)?a:'';}catch(e){return '';}}
function cosmeticSave(p){try{localStorage.setItem(cosmeticKey(),JSON.stringify(cleanCosmetics(p)));return true;}catch(e){acctMsg('No hay espacio para guardar el perfil.');return false;}}
function stickerNode(id){const el=document.createElement('span');el.className='profile-sticker';el.title=PROFILE_STICKERS[id]?.[1]||'';if(id==='cal'){const im=document.createElement('img');im.src='assets/cal-role.png';im.alt='CAL';el.appendChild(im);}else el.textContent=PROFILE_STICKERS[id]?.[0]||'';return el;}
function bannerDecals(container, cosmetics, edit) {
  const banner = container.querySelector('.public-banner, .cardp .bn');
  if (!banner) return false;
  const card = banner.parentElement;
  card.dataset.frame = cosmetics.decor?.frame || 'none';
  banner.dataset.effect = cosmetics.decor?.effect || 'none';
  let layer = banner.querySelector('.profile-decals');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'profile-decals';
    banner.append(layer);
  }
  layer.replaceChildren();
  cosmetics.stickers.forEach((id, index) => {
    const point = cosmetics.decor?.positions.find(p => p.id === id) || {x: 135 + index * 142, y: 380};
    const item = document.createElement(edit ? 'button' : 'span');
    item.className = 'profile-decal';
    const label = PROFILE_STICKERS[id][1];
    const stamp = stickerNode(id);
    item.append(stamp);
    const draw = () => {
      item.style.left = point.x / 10 + '%';
      item.style.top = point.y / 10 + '%';
    };
    draw();
    if (edit) {
      item.type = 'button';
      item.setAttribute('aria-label', 'Mover ' + label);
      item.setAttribute('aria-describedby', 'pe-decal-help');
      enableDecalDrag(item, banner, point, draw, (x, y) => edit(id, x, y));
    } else {
      item.setAttribute('role', 'img');
      item.setAttribute('aria-label', label);
      stamp.setAttribute('aria-hidden', 'true');
    }
    layer.append(item);
  });
  return true;
}
function enableDecalDrag(item, banner, point, draw, save) {
  let drag = null;
  const move = (x, y) => {
    const bounds = banner.getBoundingClientRect();
    const marginX = Math.ceil(item.offsetWidth * 500 / bounds.width);
    const marginY = Math.ceil(item.offsetHeight * 500 / bounds.height);
    point.x = clamp(Math.round(x), marginX, 1000 - marginX);
    point.y = clamp(Math.round(y), marginY, 1000 - marginY);
    draw();
    save(point.x, point.y);
  };
  item.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    const bounds = banner.getBoundingClientRect();
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, startX: point.x, startY: point.y, width: bounds.width, height: bounds.height};
    item.setPointerCapture(event.pointerId);
  });
  item.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    move(drag.startX + (event.clientX - drag.x) * 1000 / drag.width, drag.startY + (event.clientY - drag.y) * 1000 / drag.height);
  });
  item.addEventListener('lostpointercapture', () => { drag = null; });
  item.addEventListener('keydown', event => {
    const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    move(point.x + 25 * direction[0], point.y + 25 * direction[1]);
  });
}
function decorateProfile(container,p,editDecal){
  const c=cleanCosmetics(p);container.dataset.theme=c.theme;container.dataset.aura=c.aura;container.style.setProperty('--profile-accent',c.accent);
  const avatar=container.querySelector('.public-head img,.cardp .head img,.ab-av,.rp-avatar');if(avatar){avatar.dataset.aura=c.aura;avatar.classList.add('profile-avatar');}
  let area=container.querySelector('.profile-extras');if(!area){area=document.createElement('section');area.className='profile-extras';const before=container.querySelector('.public-stats,.stats');if(before)before.before(area);else container.appendChild(area);}
  area.replaceChildren();
  if(c.pronouns){const t=document.createElement('small');t.className='profile-pronouns';t.textContent=c.pronouns;area.appendChild(t);}
  const statusSlot = container.querySelector('.public-status-slot');
  if (statusSlot) statusSlot.replaceChildren();
  if (c.status) {
    const status = document.createElement('p');
    status.className = 'profile-status';
    status.textContent = c.status;
    (statusSlot || area).appendChild(status);
  }
  bannerDecals(container, c, editDecal);
  if(c.bio){const label=document.createElement('h4');label.textContent='SOBRE MÍ';const bio=document.createElement('p');bio.className='profile-bio';bio.textContent=c.bio;area.append(label,bio);}
  if(container.classList.contains('profile-showcase'))profileShowcase(container,c,p);
}
const PF_FX_COUNT = { estrellas: 16, nieve: 26, petalos: 16, burbujas: 14, confeti: 26, pixeles: 18, luciernagas: 14, corazones: 12, comic: 22, garabatos: 20, graffiti: 24 };
function profileShowcase(card, c, raw) {
  const fx = c.fx || { deco: 'none', fx: 'none', nf: 'normal', c2: '', since: '' };
  const since = fx.since || raw?.fx?.since || '';
  // degradado de dos colores (como los temas de Discord)
  if (fx.c2) { card.style.setProperty('--pf-c2', fx.c2); card.dataset.grad = '1'; } else { card.style.removeProperty('--pf-c2'); delete card.dataset.grad; }
  card.dataset.nf = fx.nf;
  // decoracion del avatar: va en la misma celda que la foto
  const head = card.querySelector('.public-head');
  if (head) { let d = head.querySelector('.pf-deco'); if (!d) { d = document.createElement('span'); d.className = 'pf-deco'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>'; head.appendChild(d); } d.dataset.deco = fx.deco; }
  // efecto sobre toda la ficha
  let layer = card.querySelector(':scope > .pf-fx');
  if (!layer) { layer = document.createElement('div'); layer.className = 'pf-fx'; layer.setAttribute('aria-hidden', 'true'); card.prepend(layer); }
  if (layer.dataset.fx !== fx.fx) {
    layer.dataset.fx = fx.fx; layer.replaceChildren();
    let seed = 7; const rn = () => (seed = seed * 16807 % 2147483647) / 2147483647;
    const cols = ['#ff6b9d', '#ffd166', '#7ee0ff', '#b39dff', '#8ef08a', '#ffffff'];
    for (let i = 0; i < (PF_FX_COUNT[fx.fx] || 0); i++) {
      const s = document.createElement('i');
      s.style.cssText = `--x:${(rn() * 100).toFixed(1)}%;--y:${(rn() * 100).toFixed(1)}%;--s:${(.7 + rn() * .8).toFixed(2)};--d:${(2.0 + rn() * 2.2).toFixed(1)}s;--l:${(-rn() * 5).toFixed(1)}s;--r:${(rn() * 360) | 0}deg;--w:${((rn() - .5) * 160) | 0}px;--h:${(-160 - rn() * 180) | 0}px;--c:${cols[i % cols.length]}`;
      layer.appendChild(s);
    }
  }
  // insignias, miembro desde y su main
  let more = card.querySelector('.pf-more');
  if (!more) { more = document.createElement('section'); more.className = 'pf-more'; const st = card.querySelector('.public-stats'); if (st) st.before(more); else card.appendChild(more); }
  more.replaceChildren();
  const g = +raw?.g || 0, h = (+raw?.m || 0) / 60, main = CHARS[raw?.f];
  const chips = [];
  chips.push(g >= 500 ? ['Leyenda', '#ffd400'] : g >= 100 ? ['Veterano', '#ff9e5e'] : g >= 10 ? ['Peleador', '#7ee0ff'] : ['Novato', '#9aa2b8']);
  if (h >= 10) chips.push(['Vive en la ciudad', '#b39dff']);
  if (raw?.acct) chips.push(['Cuenta', '#8ef08a']);
  if (main) chips.push(['Main ' + main.name, main.color || '#d7ff2f']);
  const add = (title, node) => { const t = document.createElement('h4'); t.textContent = title; more.append(t, node); };
  const row = document.createElement('div'); row.className = 'pf-chips';
  for (const [n, col] of chips) { const ch = document.createElement('span'); ch.style.setProperty('--chip', col); ch.textContent = n; row.appendChild(ch); }
  add('Insignias', row);
  if (since) { const d = new Date(since + 'T12:00:00'); const t = document.createElement('p'); t.className = 'pf-since'; t.textContent = d.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' }); add('Miembro desde', t); }
  if (main) {
    const box = document.createElement('div'); box.className = 'pf-main';
    const art = document.createElement('span'); art.className = 'pf-main-art'; try { art.style.backgroundImage = `url("${bannerURL({ k: 'char:' + raw.f })}")`; } catch (e) { }
    const tx = document.createElement('div'); const b = document.createElement('b'); b.textContent = main.name; const sm = document.createElement('small'); sm.textContent = 'Su peleador más usado · ' + g + ' peleas en total'; tx.append(b, sm);
    box.style.setProperty('--main', main.color || '#d7ff2f'); box.append(art, tx); add('Su main', box);
  }
}
function drawMapBanner(id,w,h){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d', { willReadFrequently: true });let seed=91;const rn=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const night=['casino','raincity','arcade','rooftops'].includes(id),sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,night?'#0b1030':id==='sunsetpier'?'#ff875f':'#68baee');sky.addColorStop(1,night?'#454485':id==='sunsetpier'?'#ffcf94':'#ddf4ff');g.fillStyle=sky;g.fillRect(0,0,w,h);
  if(night){g.fillStyle='#eaf5ff';for(let i=0;i<60;i++)g.fillRect(rn()*w,rn()*h*.65,1.5,1.5);g.beginPath();g.arc(w*.8,h*.2,h*.075,0,7);g.fill();}
  if(id==='beach'||id==='sunsetpier'){
    g.fillStyle=id==='sunsetpier'?'#7976bc':'#168fbe';g.fillRect(0,h*.53,w,h*.47);g.strokeStyle='#fff8';g.lineWidth=2;for(let y=h*.57;y<h;y+=h*.07){g.beginPath();for(let x=0;x<w;x+=6){const yy=y+Math.sin(x*.025+y)*3;x?g.lineTo(x,yy):g.moveTo(x,yy);}g.stroke();}
    g.fillStyle='#edd394';g.beginPath();g.moveTo(0,h*.64);g.lineTo(w*.6,h);g.lineTo(0,h);g.fill();
    for(const x of [w*.12,w*.35]){g.save();g.translate(x,h*.74);g.rotate(-.12);g.fillStyle='#684128';g.fillRect(-6,-h*.42,12,h*.48);g.fillStyle='#277c5a';for(let j=0;j<6;j++){g.save();g.translate(0,-h*.4);g.rotate(j*Math.PI/3);g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(35,-18,65,12);g.lineTo(8,8);g.fill();g.restore();}g.restore();}
    if(id==='sunsetpier'){g.fillStyle='#432d4c';g.beginPath();g.moveTo(w*.6,h);g.lineTo(w*.75,h*.6);g.lineTo(w*.9,h*.6);g.lineTo(w*.94,h);g.fill();for(let y=h*.66;y<h;y+=12){g.strokeStyle='#c78a83';g.beginPath();g.moveTo(w*.61,y);g.lineTo(w*.96,y);g.stroke();}}
  }else if(id==='forestpath'){
    g.fillStyle='#3d8758';g.fillRect(0,h*.55,w,h*.45);g.fillStyle='#e8c995';g.beginPath();g.moveTo(w*.42,h);g.lineTo(w*.54,h*.5);g.lineTo(w*.57,h*.5);g.lineTo(w*.66,h);g.fill();
    for(let i=0;i<18;i++){const x=rn()*w,y=h*.6+rn()*h*.35,s=20+rn()*35;g.fillStyle='#5b3b2d';g.fillRect(x-4,y-s,8,s);g.fillStyle=i%2?'#296647':'#3f9763';g.fillRect(x-s*.55,y-s*1.5,s*1.1,s);}
  }else{
    for(let layer=0;layer<2;layer++)for(let x=-5;x<w;x+=w/11){const bw=w/12,bh=h*(.2+rn()*.4),y=h*(layer?.88:.67);g.fillStyle=layer?(night?'#1c2243':'#bd7f8a'):(night?'#30345f':'#7797b2');g.fillRect(x,y-bh,bw,bh);g.fillStyle=night?'#ffe4a3':'#b4e9ef';for(let wx=x+6;wx<x+bw-4;wx+=12)for(let wy=y-bh+8;wy<y-5;wy+=15)if(rn()>.22)g.fillRect(wx,wy,5,7);}
    g.fillStyle='#232a3b';g.fillRect(0,h*.88,w,h*.12);g.fillStyle='#c7c6bc';for(let x=10;x<w;x+=45)g.fillRect(x,h*.94,22,2);
    if(id==='plaza'){g.fillStyle='#c6ddcc';g.fillRect(w*.32,h*.72,w*.32,h*.2);g.fillStyle='#7dd4f3';g.beginPath();g.ellipse(w*.48,h*.82,w*.085,h*.055,0,0,7);g.fill();g.strokeStyle='#d8faff';g.lineWidth=3;g.beginPath();g.moveTo(w*.48,h*.81);g.lineTo(w*.48,h*.56);g.stroke();}
    if(id==='casino'||id==='arcade'){const text=id==='casino'?'CASINO AURORA':'ARCADE';g.font=`900 ${h*.19}px sans-serif`;g.textAlign='center';g.shadowBlur=18;g.shadowColor=id==='casino'?'#ffb54f':'#ff67de';g.fillStyle=id==='casino'?'#ffe8a8':'#ff94eb';g.fillText(text,w*.5,h*.57);g.shadowBlur=0;}
    if(id==='raincity'){g.strokeStyle='#aee2ff77';g.lineWidth=1;for(let i=0;i<130;i++){const x=rn()*w,y=rn()*h;g.beginPath();g.moveTo(x,y);g.lineTo(x-5,y+20);g.stroke();}}
  }
  g.fillStyle='#08142755';g.fillRect(0,0,w,h);return c;
}
async function uploadProfileAvatar(){
  const f=document.createElement('input');f.type='file';f.accept='image/png,image/jpeg,image/webp';f.onchange=()=>{const file=f.files[0];if(!file)return;if(file.size>8*1024*1024)return acctMsg('La imagen debe pesar menos de 8 MB.');const im=new Image(),url=URL.createObjectURL(file);im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d', { willReadFrequently: true }),r=Math.max(128/im.width,128/im.height);g.fillStyle='#181b2c';g.fillRect(0,0,128,128);g.drawImage(im,(128-im.width*r)/2,(128-im.height*r)/2,im.width*r,im.height*r);let d='';for(const q of [.8,.6,.4,.2]){d=c.toDataURL('image/jpeg',q);if(d.length<=14000)break;}if(d.length>14000)return acctMsg('No se pudo ajustar esta imagen.');localStorage.setItem(cosmeticKey()+'_avatar',d);acctPaint();acctCustomize();netShareProfile();socialSaveProfile();}catch(e){acctMsg('No se pudo guardar la foto.');}finally{URL.revokeObjectURL(url);}};im.onerror=()=>{URL.revokeObjectURL(url);acctMsg('No se pudo leer esa imagen.');};im.src=url;};f.click();
}
let profileEditDraft=null;
function acctCustomize(){
  const p = profileEditDraft || (profileEditDraft = cosmeticsGet());
  p.decor ||= {frame: 'none', effect: 'none', positions: []};
  p.fx ||= {deco: 'none', fx: 'none', nf: 'normal', c2: '', since: ''};
  const body = $('acct-body');
  const profile = localPublicProfile();
  const fields = ['status', 'pronouns', 'bio', 'accent'];
  body.innerHTML = `<div class="profile-editor" data-pane="controls">
    <div class="pe-top"><div><small>VESTIDOR</small><h3>Arma tu ficha</h3></div><button type="button" id="pe-back">Volver a mi ficha</button></div>
    <div class="pe-switch" role="group" aria-label="Vista del editor">
      <button type="button" data-pe-pane="controls" aria-pressed="true">Personalizar</button>
      <button type="button" data-pe-pane="preview" aria-pressed="false">Vista previa</button>
    </div>
    <div class="pe-workspace">
      <div class="pe-controls" aria-label="Personalizar perfil">
        <fieldset data-tab="Cara"><legend>Foto, banner y aura</legend>
          <div class="pe-media pe-tiles">
            <button type="button" id="pe-photo"><img alt=""><span>Cambiar foto</span></button>
            <button type="button" id="pe-banner"><span class="pe-banner-thumb" aria-hidden="true"></span><span>Elegir banner</span></button>
          </div>
          <button type="button" id="pe-photo-reset" class="pe-subtle">Usar foto de la cuenta</button>
          <p class="pe-caption">Aura del avatar</p><div class="pe-auras"></div>
        </fieldset>
        <fieldset data-tab="Colores"><legend>Tema y color</legend>
          <div class="pe-themes"></div><div class="pe-colors"><label>Color principal<input id="pe-accent" type="color"></label><label>Segundo color<input id="pe-c2" type="color"></label></div><button type="button" id="pe-c2-off" class="pe-subtle">Sin degradado</button>
        </fieldset>
        <fieldset data-tab="Datos"><legend>Lo que dice tu ficha</legend>
          <label>Estado<input id="pe-status" maxlength="80" placeholder="Hoy toca pelear"></label>
          <label>Pronombres<input id="pe-pronouns" maxlength="32" placeholder="Opcional"></label>
          <label>Biografía<textarea id="pe-bio" maxlength="240" rows="3" placeholder="Cuenta algo de ti: tu main, tu combo favorito, de dónde juegas..."></textarea><small id="pe-count"></small></label>
        </fieldset>
        <fieldset data-tab="Avatar"><legend>Decoración del avatar</legend><div class="pe-options pe-decos"></div></fieldset>
        <fieldset data-tab="Nombre"><legend>Estilo del nombre</legend><div class="pe-options pe-names"></div></fieldset>
        <fieldset data-tab="Marco"><legend>Marco de la ficha</legend><div class="pe-options pe-frames"></div></fieldset>
        <fieldset data-tab="Efecto"><legend>Efecto de la ficha</legend><div class="pe-options pe-cardfx"></div><p class="pe-caption">Efecto del banner</p><div class="pe-options pe-effects"></div></fieldset>
        <fieldset data-tab="Pegatinas"><legend>Pegatinas <small id="pe-sticker-count"></small></legend>
          <div class="pe-stickers"></div><button type="button" id="pe-place">Ubicar en el banner ↗</button>
        </fieldset>
      </div>
      <div class="pe-stage"><p class="pe-stage-label">ASÍ TE VEN LOS DEMÁS</p>
        <p id="pe-decal-help">Arrastra tus pegatinas por el banner (o muévelas con las flechas).</p>
        <article class="pe-preview profile-showcase" aria-label="Vista previa de tu perfil">${profileCardContent()}</article>
      </div>
    </div>
    <div class="pe-footer"><button type="button" class="go" id="pe-save">GUARDAR PERFIL</button></div>
  </div>`;
  const editor = body.querySelector('.profile-editor');
  const card = editor.querySelector('.pe-preview');
  const avatar = profile.a || 'assets/calfight_icon.png';
  const banner = `url("${bannerURL(profile.b)}")`;
  card.querySelector('.public-banner').style.backgroundImage = banner;
  card.querySelector('.public-head img').src = avatar;
  card.querySelector('h2').textContent = profile.n;
  card.querySelector('.public-identity p').textContent = '';
  const role = SOC.owner ? 'owner' : SOC.roles.get(ACCT.user?.uid);
  if (role) card.querySelector('.public-role').appendChild(roleBadge(role));
  profileCardStats(card, profileCareerStats(profile));
  $('pe-photo').querySelector('img').src = avatar;
  editor.querySelector('.pe-banner-thumb').style.backgroundImage = banner;
  for (const key of fields) $('pe-' + key).value = p[key];
  const preview = () => {
    for (const key of fields) p[key] = $('pe-' + key).value;
    $('pe-count').textContent = p.bio.length + ' / 240';
    $('pe-sticker-count').textContent = p.stickers.length + ' / 6';
    decorateProfile(card, {...profile, ...p, fx: {...p.fx, since: profile.fx?.since || ''}}, (id, x, y) => {
      const position = p.decor.positions.find(point => point.id === id);
      if (position) Object.assign(position, {x, y});
      else p.decor.positions.push({id, x, y});
    });
  };
  const paneButtons = [...editor.querySelectorAll('[data-pe-pane]')];
  function showPane(pane) {
    editor.dataset.pane = pane;
    for (const item of paneButtons) item.setAttribute('aria-pressed', item.dataset.pePane === pane);
  }
  for (const button of paneButtons) button.onclick = () => showPane(button.dataset.pePane);
  $('pe-place').onclick = () => {
    showPane('preview');
    editor.querySelector('.pe-stage').scrollTop = 0;
    card.querySelector('.profile-decal')?.focus({preventScroll:true});
  };
  $('acctdlg').querySelector('.box').scrollTop = 0;
  function choices(list, selector, key, target = p) {
    const group = editor.querySelector(selector);
    const buttons = list.map(([id, name]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = name;
      button.dataset.choice = id;
      if (target === p.decor) button.dataset.decoration = key;
      button.onclick = () => { target[key] = id; showSelection(); preview(); };
      group.appendChild(button);
      return button;
    });
    function showSelection() {
      for (const button of buttons) {
        const selected = button.dataset.choice === target[key];
        button.classList.toggle('on', selected);
        button.setAttribute('aria-pressed', selected);
      }
    }
    showSelection();
  }
  // pestañas del vestidor: se ve una seccion a la vez (antes era una lista larga de cajas iguales)
  {
    const ctr = editor.querySelector('.pe-controls'), sets = [...ctr.querySelectorAll('fieldset[data-tab]')];
    const bar = document.createElement('div'); bar.className = 'pe-tabs'; bar.setAttribute('role', 'tablist');
    const pick = i => { sets.forEach((f, j) => f.hidden = j !== i); [...bar.children].forEach((t, j) => { t.setAttribute('aria-selected', j === i); t.classList.toggle('on', j === i); }); ACCT.peTab = i; ctr.scrollTop = 0; };
    sets.forEach((f, i) => { const t = document.createElement('button'); t.type = 'button'; t.setAttribute('role', 'tab'); t.textContent = f.dataset.tab; t.onclick = () => pick(i); bar.appendChild(t); });
    ctr.prepend(bar); pick(Math.min(ACCT.peTab || 0, sets.length - 1));
  }
  choices(PROFILE_THEMES, '.pe-themes', 'theme');
  choices(PROFILE_AURAS, '.pe-auras', 'aura');
  choices(PROFILE_FRAMES, '.pe-frames', 'frame', p.decor);
  choices(PROFILE_EFFECTS, '.pe-effects', 'effect', p.decor);
  choices(PROFILE_DECOS, '.pe-decos', 'deco', p.fx);
  choices(PROFILE_CARDFX, '.pe-cardfx', 'fx', p.fx);
  choices(PROFILE_NAMEFX, '.pe-names', 'nf', p.fx);
  $('pe-c2').value = p.fx.c2 || '#ff6b9d';
  $('pe-c2').oninput = () => { p.fx.c2 = $('pe-c2').value; preview(); };
  $('pe-c2-off').onclick = () => { p.fx.c2 = ''; preview(); };
  for(const[id,[_,n]]of Object.entries(PROFILE_STICKERS)){const bt=document.createElement('button');bt.type='button';bt.title=n;bt.setAttribute('aria-label',n);bt.setAttribute('aria-pressed',p.stickers.includes(id));bt.appendChild(stickerNode(id));bt.classList.toggle('on',p.stickers.includes(id));bt.onclick=()=>{if(p.stickers.includes(id)){p.stickers=p.stickers.filter(x=>x!==id);p.decor.positions=p.decor.positions.filter(point=>point.id!==id);}else if(p.stickers.length<6)p.stickers.push(id);else return acctMsg('Podés elegir hasta 6 stickers.');bt.classList.toggle('on',p.stickers.includes(id));bt.setAttribute('aria-pressed',p.stickers.includes(id));preview();};body.querySelector('.pe-stickers').appendChild(bt);}
  for(const k of ['status','pronouns','bio','accent'])$('pe-'+k).oninput=preview;
  $('pe-back').onclick=()=>{profileEditDraft=null;acctRender();};$('pe-photo').onclick=uploadProfileAvatar;$('pe-photo-reset').onclick=()=>{localStorage.removeItem(cosmeticKey()+'_avatar');acctPaint();acctCustomize();netShareProfile();socialSaveProfile();};$('pe-banner').onclick=()=>{acctBannerPick();};
  $('pe-save').onclick = async () => {
    if (!cosmeticSave(p)) return;
    acctPaint();
    netShareProfile();
    const synced = await socialSaveProfile();
    if (synced === 'basic') acctMsg('Perfil guardado. Las decoraciones se guardaron en este equipo y se comparten en las salas.', true);
    else if (synced) acctMsg('Perfil guardado y compartido.', true);
    else acctMsg('Perfil guardado en este equipo.' + (ACCT.user?.emailVerified ? ' Todavía no se pudo compartir.' : ''), true);
  };
  preview();
}


// ---- banners del perfil: dibujados por el juego, o una imagen tuya (se guarda en este navegador)
const BANNERS = [['sunset', 'Atardecer'], ['night', 'Ciudad de noche'], ['aurora', 'Aurora'], ['pixels', 'Píxeles'], ['lava', 'Lava'], ['ice', 'Hielo'], ['forest', 'Bosque'], ['sea', 'Mar'], ['candy', 'Caramelo'], ['void', 'Vacío']];
BANNERS.push(...PROFILE_MAP_BANNERS.map(([id,n])=>['map_'+id,n]));
const BN_CACHE = {};
function bannerDraw(id, w = 900, h = 256) {
  if(id.startsWith('map_'))return drawMapBanner(id.slice(4),w,h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }), L = (a, b) => { const r = g.createLinearGradient(0, 0, 0, h); r.addColorStop(0, a); r.addColorStop(1, b); return r; };
  let seed = 7; const rn = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (id.startsWith('char:')) {
    const ch = CHARS[id.slice(5)] || CHARS.javi, gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0c0e18'); gr.addColorStop(.55, ch.color); gr.addColorStop(1, '#0c0e18'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalAlpha = .12; g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) g.fillRect(rn() * w, rn() * h, 8 + rn() * 26, 8 + rn() * 26); g.globalAlpha = 1;
    const hc = document.createElement('canvas'); hc.width = hc.height = 8; try { headPortrait(charSkin(id.slice(5)), hc); g.imageSmoothingEnabled = false; g.globalAlpha = .95; g.drawImage(hc, w - h * 1.05, h * .06, h * .9, h * .9); g.globalAlpha = 1; } catch (e) { }
    return c;
  }
  if (id === 'sunset') { g.fillStyle = L('#ff9a5a', '#4a2a6e'); g.fillRect(0, 0, w, h); g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(w * .68, h * .56, h * .22, 0, 7); g.fill(); g.fillStyle = '#24437a'; g.fillRect(0, h * .6, w, h * .4); g.fillStyle = '#ffffff55'; for (let i = 0; i < 14; i++) g.fillRect(w * .5 + (rn() - .5) * w * .3, h * .62 + i * h * .03, 30 + rn() * 90, 3); }
  else if (id === 'night') { g.fillStyle = L('#080d1c', '#2a4170'); g.fillRect(0, 0, w, h); g.fillStyle = '#fff8'; for (let i = 0; i < 50; i++) g.fillRect(rn() * w, rn() * h * .5, 2, 2); for (let x = -10; x < w; x += 54) { const bh = 60 + rn() * 130; g.fillStyle = '#10182c'; g.fillRect(x, h - bh, 48, bh); g.fillStyle = '#ffd27a'; for (let y = h - bh + 8; y < h - 8; y += 16) for (let k = 0; k < 3; k++) if (rn() > .45) g.fillRect(x + 6 + k * 14, y, 8, 8); } }
  else if (id === 'aurora') { g.fillStyle = L('#050912', '#10223a'); g.fillRect(0, 0, w, h); for (const [col, off] of [['#3dff9a66', 0], ['#7a5cff55', 24], ['#35e0ff44', 48]]) { g.strokeStyle = col; g.lineWidth = 46; g.beginPath(); for (let x = 0; x <= w; x += 10) { const y = h * .45 + off + Math.sin(x * .012 + off) * 34 + Math.sin(x * .031) * 14; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } }
  else if (id === 'pixels') { for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { g.fillStyle = `hsl(${250 + rn() * 70},60%,${22 + rn() * 22}%)`; g.fillRect(x, y, 32, 32); } }
  else if (id === 'lava') { g.fillStyle = L('#160606', '#5a1405'); g.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { g.fillStyle = `hsl(${10 + rn() * 30},95%,${40 + rn() * 25}%)`; const s = 8 + rn() * 30; g.fillRect(rn() * w, h * .35 + rn() * h * .65, s, s); } }
  else if (id === 'ice') { g.fillStyle = L('#bfe9ff', '#3b78b8'); g.fillRect(0, 0, w, h); for (let i = 0; i < 22; i++) { const x = rn() * w, s = 20 + rn() * 70; g.fillStyle = '#ffffff55'; g.beginPath(); g.moveTo(x, h); g.lineTo(x + s / 2, h - s * 2); g.lineTo(x + s, h); g.fill(); } }
  else if (id === 'forest') { g.fillStyle = L('#a8e0ff', '#5aa860'); g.fillRect(0, 0, w, h); for (let x = -20; x < w; x += 46) { const th = 70 + rn() * 90; g.fillStyle = '#5a3b22'; g.fillRect(x + 16, h - th * .5, 12, th * .5); g.fillStyle = `hsl(${105 + rn() * 25},55%,${24 + rn() * 14}%)`; g.fillRect(x, h - th, 44, th * .6); } }
  else if (id === 'sea') { g.fillStyle = L('#8fd8ff', '#0d4f8c'); g.fillRect(0, 0, w, h); g.strokeStyle = '#ffffff66'; g.lineWidth = 3; for (let y = h * .3; y < h; y += 22) { g.beginPath(); for (let x = 0; x <= w; x += 8) { const yy = y + Math.sin(x * .03 + y) * 5; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } }
  else if (id === 'candy') { g.fillStyle = '#ff7ac8'; g.fillRect(0, 0, w, h); g.fillStyle = '#7af0ff'; for (let x = -h; x < w; x += 80) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 40, h); g.lineTo(x + 40 + h, 0); g.lineTo(x + h, 0); g.fill(); } }
  else { g.fillStyle = L('#07040f', '#26124a'); g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; for (let i = 0; i < 90; i++) { g.globalAlpha = .3 + rn() * .7; g.fillRect(rn() * w, rn() * h, 2, 2); } g.globalAlpha = 1; }
  return c;
}
const bannerKey = () => 'bsb_banner_' + (ACCT.user ? ACCT.user.uid : 'anon');
function bannerGet() { try { const j = JSON.parse(localStorage.getItem(bannerKey()) || 'null'); if (j && (j.k === 'img' ? /^data:image\/jpeg;base64,/.test(j.d || '') : /^(pre|char):[a-z0-9_]{1,20}$/.test(j.k))) return j; } catch (e) { } return { k: 'pre:sunset' }; }
function bannerSet(j) { try { localStorage.setItem(bannerKey(), JSON.stringify(j)); } catch (e) { acctMsg('No se pudo guardar el banner (¿poco espacio?).'); } acctPaint(); netShareProfile(); socialSaveProfile(); }
function bannerURL(j) {
  if (j.k === 'img') return j.d;
  const key = j.k + (j.k.startsWith('char:') ? '' : ''); if (!BN_CACHE[key]) BN_CACHE[key] = bannerDraw(j.k.replace(/^(pre|char):/, (m, t) => (t === 'char' ? 'char:' : ''))).toDataURL('image/jpeg', .85); return BN_CACHE[key];
}
function acctPaint() {
  const u = ACCT.user, nm = u ? (u.displayName || (u.email || '').split('@')[0] || 'Jugador') : '';
  const av = avatarGet() || (u && u.photoURL && /^https:\/\/lh3\.googleusercontent\.com\//.test(u.photoURL) ? u.photoURL : 'assets/calfight_icon.png');
  const bt = $('acctbtn'); bt.querySelector('.ab-bg').style.backgroundImage = `url("${bannerURL(bannerGet())}")`; bt.querySelector('.ab-av').src = av;
  bt.querySelector('b').textContent = u ? nm : 'INICIAR SESIÓN'; bt.querySelector('small').textContent = u ? (SOC.owner ? 'OWNER · VER CUENTA' : 'VER TU CUENTA') : 'CREÁ TU CUENTA';
  $('acctbtn2').textContent = u ? '👤 ' + nm : '👤 CUENTA';const cp=cosmeticsGet();bt.querySelector('.ab-av').dataset.aura=cp.aura;bt.querySelector('.ab-av').classList.add('profile-avatar');bt.querySelector('.account-role')?.remove();const r=SOC.owner?'owner':SOC.roles.get(u?.uid);if(r)bt.querySelector('.ab-t').appendChild(roleBadge(r));
}
async function acctGate(pub) {   // salas públicas: cuenta obligatoria; salas privadas: se recomienda; jugar solo: libre
  try { if (localStorage.getItem('bsb_acct') === '1' && !ACCT.user) await Promise.race([acctLoad().then(() => new Promise(r => setTimeout(r, 1200))), new Promise(r => setTimeout(r, 3500))]); } catch (e) { }
  if (ACCT.user) return true;
  if (pub) { const go = await uiDialog({ title: 'SALAS PÚBLICAS', msg: 'Para entrar a una sala pública necesitás una cuenta. Así cuidamos las partidas de las trampas y de quienes molestan.', ok: 'Iniciar sesión o crear cuenta', cancel: 'Ahora no' }); if (go) { D.tmClose(); acctOpen(); } return false; }
  const mk = await uiDialog({ title: 'TE RECOMENDAMOS UNA CUENTA', msg: 'Podés jugar en una sala privada sin cuenta, pero con una cuenta tu nombre queda tuyo y las salas son más seguras para todos.', ok: 'Crear cuenta', cancel: 'Seguir sin cuenta' });
  if (mk) { D.tmClose(); acctOpen(); return false; } return true;
}

function acctBannerPick() {
  const b = $('acct-body'), cur = bannerGet(); acctMsg('');
  b.innerHTML = '<div class="pad bnpick"><h3>ELEGÍ TU BANNER</h3><small>Se ve en tu tarjeta, en tu perfil y en la tabla de jugadores de la sala.</small><div class="bngrid"></div><button type="button" class="sec" id="bn-up">Subir mi propia imagen…</button><button type="button" class="sec" id="bn-back">← Volver a mi cuenta</button></div>';
  const grid = b.querySelector('.bngrid');
  const items = [...BANNERS.map(([id, n]) => ['pre:' + id, n]), ...CHAR_IDS.map(id => ['char:' + id, CHARS[id].name])];
  for (const [k, n] of items) { const bt = document.createElement('button'); bt.type = 'button'; bt.className = cur.k === k ? 'on' : ''; bt.style.backgroundImage = `url("${bannerURL({ k })}")`; bt.innerHTML = `<span>${n}</span>`; bt.addEventListener('click', () => { bannerSet({ k }); acctBannerPick(); acctMsg('Banner cambiado.', true); }); grid.appendChild(bt); }
  $('bn-back').addEventListener('click', () => profileEditDraft ? acctCustomize() : acctRender());
  $('bn-up').addEventListener('click', () => {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/png,image/jpeg,image/webp,image/gif';
    f.onchange = () => {
      const file = f.files[0]; if (!file) return; if (file.size > 8 * 1024 * 1024) return acctMsg('La imagen pesa demasiado (máximo 8 MB).');
      const img = new Image(); img.onload = () => {
        const W = 1000, H = 286, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true }), r = Math.max(W / img.width, H / img.height), w = img.width * r, h = img.height * r;
        g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); bannerSet({ k: 'img', d: c.toDataURL('image/jpeg', .82) }); URL.revokeObjectURL(img.src); acctBannerPick(); acctMsg('Banner cambiado.', true);
      }; img.onerror = () => acctMsg('No se pudo leer esa imagen.'); img.src = URL.createObjectURL(file);
    }; f.click();
  });
}
function acctBuild() {
  if ($('acctdlg')) return;
  const d = document.createElement('div'); d.id = 'acctdlg'; d.className = 'hidden'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.innerHTML = '<div class="box"><button type="button" class="x" aria-label="Cerrar">✕</button><div id="acct-body"></div><div class="msg" id="acct-msg" aria-live="polite"></div></div>'; document.body.appendChild(d);
  d.querySelector('.x').addEventListener('click', acctClose); d.addEventListener('click', e => { if (e.target === d) acctClose(); });
  addEventListener('keydown', e => { if (e.code === 'Escape' && !d.classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); acctClose(); } }, true);
}
function acctClose() { profileEditDraft=null; const wasOpen=$('acctdlg')&&!$('acctdlg').classList.contains('hidden'); $('acctdlg')?.classList.add('hidden'); if(wasOpen&&ACCT.returnFocus?.isConnected&&!SOC.open){try{ACCT.returnFocus.focus({preventScroll:true});}catch(e){}} ACCT.returnFocus=null;document.body.classList.remove('social-browsing');roomClearInput();if(G.state==='play'&&!G.paused&&!G.over&&!ROOM_UI.open&&!ROOM_UI.profile&&!SOC.open)requestLock(); }
async function acctOpen() {
  acctBuild(); if($('acctdlg').classList.contains('hidden'))ACCT.returnFocus=document.activeElement; if(ROOM_UI.open||ROOM_UI.profile)setRoomBoard(false,false);$('acctdlg').classList.remove('hidden');document.body.classList.add('social-browsing');roomClearInput();unlock();acctMsg('');
  $('acct-body').innerHTML = '<h3>CUENTA</h3><p>Cargando…</p>';
  try { await acctLoad(); acctRender(); } catch (e) { $('acct-body').innerHTML = '<h3>CUENTA</h3><p>' + (e.message || 'No se pudo cargar.') + '</p>'; }
}
function acctRender() {
  const b = $('acct-body'), u = ACCT.user;
  if (u) {
    const av = avatarGet() || (u.photoURL && /^https:\/\/lh3\.googleusercontent\.com\//.test(u.photoURL) ? u.photoURL : 'assets/calfight_icon.png');
    let games = 0, mins = 0, fav = '', favCol = '', fv = 0; try { for (const id in ST.d.c) { const c = ST.d.c[id]; games += c[0] || 0; if (CHARS[id] && c[0] > fv) { fv = c[0]; fav = CHARS[id].name; favCol = CHARS[id].color || ''; } } for (const k in ST.d.dy) mins += (ST.d.dy[k][2] || 0); } catch (e) { }
    let ficha = 0; for (const ch of (u.uid || 'x')) ficha = (ficha * 31 + ch.charCodeAt(0)) % 9973;
    const google = u.providerData[0] && u.providerData[0].providerId === 'google.com';
    // Ficha de usuario estilo Discord: unificada, compacta y sin cortes toscos
    b.innerHTML = `<div class="acct-discord-wrap"><article class="public-card profile-showcase acct-card acct-discord-card" aria-label="Tu perfil">${profileCardContent('acct-user-name')}
      <div class="acct-discord-actions">
        <button type="button" class="acct-btn-primary" id="acct-customize"><span class="btn-icon">✏️</span><span>Editar perfil</span></button>
        <button type="button" class="acct-btn-secondary" id="acct-editname-btn"><span class="btn-icon">🏷️</span><span>Cambiar nombre</span></button>
        <button type="button" class="acct-btn-danger" id="acct-out" title="Cerrar sesión"><span class="btn-icon">🚪</span><span>Salir</span></button>
      </div>
      <div class="acct-name-editor hidden" id="acct-name-box">
        <input id="acct-name" maxlength="16" autocomplete="nickname" placeholder="Tu nombre de peleador...">
        <button type="button" class="acct-btn-primary sm" id="acct-savename">Guardar</button>
        <button type="button" class="acct-btn-secondary sm" id="acct-cancelname">✕</button>
      </div>
      ${u.emailVerified ? '' : '<div class="acct-discord-notice"><span>⚠️ Correo sin verificar</span><div class="notice-btns"><button type="button" class="acct-btn-link" id="acct-verify">Reenviar enlace</button><button type="button" class="acct-btn-link" id="acct-verified">Actualizar</button></div></div>'}
      <div class="acct-discord-footer">
        <div><span class="user-id">#${String(ficha).padStart(4, '0')}</span> · <span class="user-mail">${u.email || 'Sin correo'}</span></div>
        ${google ? '' : '<button type="button" class="acct-btn-link-subtle" id="acct-chpw">Cambiar contraseña</button>'}
      </div>
    </article></div>`;
    const card = b.querySelector('.acct-card'), pub = localPublicProfile();
    const bn = card.querySelector('.public-banner'); bn.style.backgroundImage = `url("${bannerURL(bannerGet())}")`;
    const eb = document.createElement('button'); eb.type = 'button'; eb.className = 'acct-bn-edit'; eb.id = 'acct-bn'; eb.innerHTML = '📷 Cambiar banner'; bn.appendChild(eb);
    const headImg = card.querySelector('.public-head img'); headImg.src = av; headImg.alt = ''; headImg.title = 'Hacé clic para cambiar foto de perfil'; headImg.style.cursor = 'pointer'; headImg.onclick = uploadProfileAvatar;
    card.querySelector('h2').textContent = u.displayName || 'Jugador';
    card.querySelector('.public-identity p').textContent = '@' + (u.displayName || 'jugador').toLowerCase().replace(/\s+/g, '');
    const roleArea = card.querySelector('.public-role'); roleArea.replaceChildren();
    const rolesRow = document.createElement('div'); rolesRow.className = 'discord-roles-row';
    const addRole = (name, color) => { const pill = document.createElement('span'); pill.className = 'discord-role-pill'; pill.style.setProperty('--pill-color', color); const dot = document.createElement('span'); dot.className = 'pill-dot'; pill.append(dot, document.createTextNode(name)); rolesRow.appendChild(pill); };
    if (SOC.owner) addRole('Owner', '#ff4655');
    else if (SOC.roles.get(u.uid) === 'calsito') addRole('Calsito', '#ffd700');
    else if (DEV.on) addRole('Editor Local', '#00f5d4');
    if (u.emailVerified) addRole('Verificado', '#00e5ff');
    else addRole('Sin Verificar', '#faa61a');
    if (google) addRole('Google', '#4285f4');
    else addRole('Correo', '#b9bbbe');
    roleArea.appendChild(rolesRow);
    profileCardStats(card, profileCareerStats(pub));
    decorateProfile(card, pub);
    $('acct-customize').onclick = acctCustomize;
    $('acct-bn').addEventListener('click', acctBannerPick);
    const nameBox = $('acct-name-box'), nameIn = $('acct-name'); nameIn.value = (u.displayName || '').slice(0, 16);
    $('acct-editname-btn').onclick = () => { nameBox.classList.toggle('hidden'); if (!nameBox.classList.contains('hidden')) { nameIn.focus(); nameIn.select(); } };
    $('acct-cancelname').onclick = () => nameBox.classList.add('hidden');
    const saveName = async () => { const n = nameIn.value.trim().slice(0, 16); if (!n) return acctMsg('Escribí un nombre.'); try { await u.updateProfile({ displayName: n }); const inp = $('pname-in'); if (inp) inp.value = n; try { localStorage.setItem('bsb_name', n); D.netMenuPresence(); } catch (e) { } acctChanged(); acctMsg('Nombre guardado.', true); nameBox.classList.add('hidden'); } catch (e) { acctMsg(acctErr(e)); } };
    $('acct-savename').onclick = saveName;
    nameIn.onkeydown = e => { if (e.key === 'Enter') saveName(); else if (e.key === 'Escape') nameBox.classList.add('hidden'); };
    if ($('acct-verify')) $('acct-verify').addEventListener('click', async () => { try { await u.sendEmailVerification(); acctMsg('Te mandé el correo: abrilo y tocá el enlace.', true); } catch (e) { acctMsg(acctErr(e)); } });
    if ($('acct-verified')) $('acct-verified').addEventListener('click', () => acctRefreshVerified(true));
    if ($('acct-chpw')) $('acct-chpw').addEventListener('click', async () => { try { await ACCT.auth.sendPasswordResetEmail(u.email); acctMsg('Te mandé un correo a tu dirección para cambiar la contraseña.', true); } catch (e) { acctMsg(acctErr(e)); } });
    $('acct-out').addEventListener('click', async () => { try { await ACCT.auth.signOut(); acctMsg('Sesión cerrada.', true); } catch (e) { acctMsg(acctErr(e)); } });
    return;
  }
  const up = ACCT.mode === 'up';
  b.innerHTML = `<h3>${up ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}</h3><div class="tabs"><button type="button" data-m="in" class="${up ? '' : 'on'}">Entrar</button><button type="button" data-m="up" class="${up ? 'on' : ''}">Crear cuenta</button></div>
    ${up ? '<label>Tu nombre<input id="acct-nm" maxlength="16" autocomplete="nickname"></label>' : ''}
    <label>Correo<input id="acct-em" type="email" autocomplete="email" inputmode="email"></label><label>Contraseña<input id="acct-pw" type="password" maxlength="128" autocomplete="${up ? 'new-password' : 'current-password'}"></label>${up ? '<small style="opacity:.75;display:block;margin:-4px 0 6px">Mínimo 8 caracteres, con letras y números.</small>' : ''}<label style="display:flex;gap:8px;align-items:center;font-size:12px;opacity:.85"><input id="acct-rem" type="checkbox" checked> Recordarme en este equipo <small>(desmarcalo si es una PC compartida)</small></label>
    <button type="button" class="go" id="acct-go">${up ? 'CREAR CUENTA' : 'ENTRAR'}</button>
    <button type="button" class="gg" id="acct-gg"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>Continuar con Google</button>
    ${up ? '' : '<button type="button" class="lnk" id="acct-reset">Olvidé mi contraseña</button>'}`;
  b.querySelectorAll('.tabs button').forEach(x => x.addEventListener('click', () => { ACCT.mode = x.dataset.m; acctMsg(''); acctRender(); }));
  const run = async fn => { if (ACCT.busy) return; ACCT.busy = true; acctMsg('Un momento…', true); try { await fn(); acctMsg(''); } catch (e) { acctMsg(acctErr(e)); } ACCT.busy = false; };
  const em = () => ($('acct-em').value || '').trim(), pw = () => $('acct-pw').value;
  $('acct-go').addEventListener('click', () => run(async () => {
    if (!em()) { const e = new Error(); e.code = 'auth/missing-email'; throw e; } if (!pw()) { const e = new Error(); e.code = 'auth/missing-password'; throw e; }
    try { await ACCT.auth.setPersistence($('acct-rem') && !$('acct-rem').checked ? firebase.auth.Auth.Persistence.SESSION : firebase.auth.Auth.Persistence.LOCAL); } catch (e) { }   // sin "recordarme": la sesión se cierra al cerrar la pestaña
    if (up) { const prob = acctPwProblem(pw(), em()); if (prob) throw acctEx(prob); }
    else { const wait = acctLockLeft(); if (wait) throw acctEx('Demasiados intentos fallidos. Esperá ' + wait + ' s para probar de nuevo, o usá «Olvidé mi contraseña».'); }
    if (up) { const c = await ACCT.auth.createUserWithEmailAndPassword(em(), pw()), n = ($('acct-nm').value || '').trim().slice(0, 16); if (n) await c.user.updateProfile({ displayName: n }); try { await c.user.sendEmailVerification(); } catch (e) { } ACCT.user = ACCT.auth.currentUser; acctChanged(); }
    else { try { await ACCT.auth.signInWithEmailAndPassword(em(), pw()); acctFailClear(); } catch (e) { if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential'].includes(e && e.code)) acctFailed(); throw e; } }
  }));
  $('acct-gg').addEventListener('click', () => run(async () => { try { await ACCT.auth.setPersistence($('acct-rem') && !$('acct-rem').checked ? firebase.auth.Auth.Persistence.SESSION : firebase.auth.Auth.Persistence.LOCAL); } catch (e) { } await ACCT.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); }));
  if ($('acct-reset')) $('acct-reset').addEventListener('click', () => run(async () => { if (!em()) { const e = new Error(); e.code = 'auth/missing-email'; throw e; } await ACCT.auth.sendPasswordResetEmail(em()); acctMsg('Si ese correo tiene cuenta, te mandamos un enlace para cambiar la contraseña.', true); }));
  for (const id of ['acct-nm', 'acct-em', 'acct-pw']) if ($(id)) $(id).addEventListener('keydown', e => { if (e.key === 'Enter') $('acct-go').click(); });
  setTimeout(() => ($(up ? 'acct-nm' : 'acct-em')).focus(), 30);
}
// Amigos y DM usan Firebase Authentication + Firestore. Nunca se publican mensajes ni tokens en los relays de combate.
const SOC={db:null,loading:null,ready:false,owner:false,uid:'',error:'',epoch:0,off:[],links:new Map(),profiles:new Map(),roles:new Map(),verified:new Map(),watched:new Map(),checking:new Set(),open:false,thread:null,chatOff:null,messages:[],sendAt:0,sessionAt:0,profileKey:'',panelFocus:null};
const validAccountId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);
const socialStamp=()=>firebase.firestore.FieldValue.serverTimestamp();
const socialPair=(a,b)=>[a,b].sort().join('~');
function socialWait(p){return new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('No se pudo conectar con Firestore. Revisá que esté activado y sus reglas publicadas.')),14000);p.then(v=>{clearTimeout(t);resolve(v);},e=>{clearTimeout(t);reject(e);});});}
function socialError(e){const code=e?.code||'';SOC.error=/permission-denied/.test(code)?'Falta publicar las reglas de amigos en Firebase.':/unavailable|not-found|failed-precondition/.test(code)?'Amigos no está disponible. Revisá que Firestore esté activado.':code==='unauthenticated'?'Volvé a iniciar sesión.':e?.message||'No se pudo conectar. Intentá de nuevo.';socialStatus();return false;}
async function socialLoad(){
  if(SOC.db)return SOC.db;if(SOC.loading)return SOC.loading;
  SOC.loading=(async()=>{await acctLoad();if(!firebase.firestore)await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js';s.integrity='sha384-qn4Jh88HhJA8dplNQyGjOh9OGI4izVhrfj/qIFgaKcdgOE06pXqIKGlsCILZcLAC';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(Error('No se pudo descargar Amigos. Revisá tu conexión.'));document.head.appendChild(s);});
    SOC.db=firebase.firestore();return SOC.db;})().catch(e=>{SOC.loading=null;throw e;});return SOC.loading;
}
function socialReset(){SOC.epoch++;for(const off of SOC.off)off();SOC.off=[];for(const off of SOC.watched.values())off();SOC.watched.clear();SOC.checking.clear();SOC.verified.clear();SOC.roles.clear();SOC.profiles.clear();SOC.links.clear();SOC.ready=false;SOC.owner=false;D.OWNER_AUTHED=false;SOC.uid='';SOC.profileKey='';SOC.sessionAt=0;SOC.sending=false;SOC.sendAt=0;if(SOC.chatOff)SOC.chatOff();SOC.chatOff=null;SOC.thread=null;SOC.messages=[];}
async function socialAuthChanged(){
  socialReset();const u=ACCT.user,epoch=SOC.epoch;if(!u){syncOwnerBeta();socialRender();return;}
  SOC.uid=u.uid;SOC.owner=!!(u.emailVerified&&u.email&&ACCT.ownerH.includes(await acctSha(u.email)));if(epoch!==SOC.epoch)return;D.OWNER_AUTHED=SOC.owner;syncOwnerBeta();
  try{await socialLoad();if(epoch!==SOC.epoch)return;
    socialWatchRole(u.uid);
    if(!u.emailVerified){SOC.error='Verificá tu correo para usar amigos y mensajes.';netShareProfile();socialRender();return;}
    if(localStorage.getItem(cosmeticKey())===null){const saved=await socialWait(SOC.db.collection('cf_profiles').doc(u.uid).get({source:'server'}));if(epoch!==SOC.epoch)return;if(saved.exists){const p=cleanPublicProfile(saved.data());if(p){cosmeticSave(p);localStorage.setItem(bannerKey(),JSON.stringify(p.b));if(p.a.startsWith('data:'))localStorage.setItem(cosmeticKey()+'_avatar',p.a);acctPaint();}}}
    if(!await socialSaveProfile(true))throw Error(SOC.error);if(epoch!==SOC.epoch)return;
    SOC.ready=true;SOC.error='';acctPaint();
    if(SOC.owner){
      await SOC.db.collection('cf_roles').doc(u.uid).set({role:'owner',by:u.uid,updated:socialStamp()});
      SOC.off.push(SOC.db.collection('cf_roles').onSnapshot(s=>{if(epoch!==SOC.epoch)return;s.forEach(d=>{const r=d.data()?.role||'';SOC.roles.set(d.id,['owner','calsito'].includes(r)?r:'');});ROOM_UI.signature='';socialRefreshVisible();if(SOC.open)socialRender();},()=>{}));
    }
    SOC.off.push(SOC.db.collection('cf_links').where('members','array-contains',u.uid).limit(100).onSnapshot(s=>{if(epoch!==SOC.epoch)return;SOC.links.clear();s.forEach(d=>{SOC.links.set(d.id,{id:d.id,...d.data()});});if(SOC.thread&&SOC.links.get(SOC.thread)?.status!=='accepted')socialChatStop();socialRender();socialBadge();},socialError));
    await socialPublishSession();netShareProfile();socialRender();
  }catch(e){if(epoch===SOC.epoch){SOC.ready=false;socialError(e);socialRender();}}
}
async function socialSaveProfile(force=false){
  if(!ACCT.user?.emailVerified)return false;
  try{await socialLoad();const p=localPublicProfile();
    // La imagen compacta de sala también limita el documento persistente.
    if(p.b.k==='img'&&p.b.d.length>PROFILE_IMAGE_MAX){const d=await compactProfileImage(p.b.d,600,172,PROFILE_IMAGE_MAX);p.b=d?{k:'img',d}:{k:'pre:sunset'};}
    const clean=cleanPublicProfile(p);if(!clean)return false;const key=JSON.stringify(clean);if(!force&&SOC.profileKey===key)return true;
    const uid = ACCT.user.uid;
    const profileRef = SOC.db.collection('cf_profiles').doc(uid);
    const write = data => socialWait(profileRef.set({...data, uid, updated: socialStamp()}));
    try {
      await write(clean);
    } catch (error) {
      if (error.code !== 'permission-denied' || !(clean.decor || clean.fx) || ACCT.user?.uid !== uid) throw error;
      // Los servidores con las reglas anteriores aún pueden guardar el resto del perfil.
      const legacy = {...clean};
      delete legacy.decor; delete legacy.fx;
      await write(legacy);
      return ACCT.user?.uid === uid ? 'basic' : false;
    }
    if (ACCT.user?.uid !== uid) return false;
    SOC.profileKey = key;
    SOC.profiles.set(uid, clean);
    return true;
  }catch(e){return socialError(e);}
}
async function socialPublishSession(){
  if(!SOC.ready||!ACCT.user?.emailVerified||!NET.named)return;
  const peer=NET.named.myId||NET.myPeer;if(!/^u[a-z0-9]{6,16}$/.test(peer||''))return;
  if(SOC.sessionAt&&SOC.sessionPeer===peer&&Date.now()-SOC.sessionAt<90000)return;
  try{await SOC.db.collection('cf_sessions').doc(peer).set({uid:ACCT.user.uid,expires:firebase.firestore.Timestamp.fromMillis(Date.now()+240000)});SOC.sessionAt=Date.now();SOC.sessionPeer=peer;}catch(e){socialError(e);}
}
function socialWatchRole(uid){
  if(!SOC.db||!validAccountId(uid)||SOC.watched.has(uid))return;
  const epoch=SOC.epoch,off=SOC.db.collection('cf_roles').doc(uid).onSnapshot(s=>{if(epoch!==SOC.epoch)return;const r=s.exists?s.data().role:'';SOC.roles.set(uid,['owner','calsito'].includes(r)?r:'');ROOM_UI.signature='';socialRefreshVisible();if(uid===SOC.uid)acctPaint();},()=>{});
  const profileOff=SOC.db.collection('cf_profiles').doc(uid).onSnapshot(s=>{if(epoch!==SOC.epoch)return;const p=s.exists?cleanPublicProfile(s.data()):null;if(p){SOC.profiles.set(uid,p);ROOM_UI.signature='';socialRefreshVisible();}},()=>{});SOC.watched.set(uid,()=>{off();profileOff();});
}
async function socialCheckEntry(e){
  const p=rawEntryProfile(e);if(e.bot||e.me||!validAccountId(p.uid))return;
  const cached=SOC.verified.get(e.key);if(cached?.uid===p.uid&&cached.until>Date.now())return;
  if(SOC.checking.has(e.key))return;SOC.checking.add(e.key);const epoch=SOC.epoch;
  try{await socialLoad();if(epoch!==SOC.epoch)return;
    socialWatchRole(p.uid);
    const [session,prof]=await Promise.all([SOC.db.collection('cf_sessions').doc(e.key).get().catch(()=>null),socialGetProfile(p.uid).catch(()=>null)]);
    if(epoch!==SOC.epoch)return;
    const d=session?.exists?session.data():null;
    if(d&&d.uid&&d.uid!==p.uid){SOC.verified.delete(e.key);return;}
    const exp=d?.expires?.toMillis?d.expires.toMillis():0;
    const until=exp>Date.now()?Math.min(exp,Date.now()+60000):Date.now()+60000;
    if(d?.uid===p.uid||prof||SOC.owner||p.acct){SOC.verified.set(e.key,{uid:p.uid,until});ROOM_UI.signature='';socialRefreshVisible();}
  }catch(e){}finally{SOC.checking.delete(e.key);socialRefreshVisible();}
}
async function socialGetProfile(uid){if(!validAccountId(uid))return null;if(SOC.profiles.has(uid))return SOC.profiles.get(uid);await socialLoad();const d=await SOC.db.collection('cf_profiles').doc(uid).get();const p=d.exists?cleanPublicProfile(d.data()):null;if(p)SOC.profiles.set(uid,p);return p;}
function socialEntryUid(e){if(e.me)return ACCT.user?.uid||'';const p=rawEntryProfile(e),v=SOC.verified.get(e.key);if(v&&validAccountId(p.uid)&&v.uid===p.uid&&v.until>Date.now())return v.uid;return validAccountId(p.uid)&&(SOC.owner||SOC.profiles.has(p.uid)||!SOC.checking.has(e.key))?p.uid:'';}
function roleOfEntry(e){const uid=socialEntryUid(e);return e.me&&SOC.owner?'owner':uid?SOC.roles.get(uid)||'':'';}
function roleBadge(role){const el=document.createElement('span');el.className='account-role role-'+role;if(role==='calsito'){const img=document.createElement('img');img.src='assets/cal-role.png';img.alt='';el.appendChild(img);}el.appendChild(document.createTextNode(role==='owner'?'Owner':'Calsito'));return el;}
function socialDecorateIdentity(bt,e){const role=roleOfEntry(e);bt.querySelector('.account-role')?.remove();if(role)bt.querySelector('.rp-text').appendChild(roleBadge(role));const p=entryProfile(e);bt.style.setProperty('--profile-accent',p.accent||'#a5a0ff');bt.dataset.aura=p.aura||'none';bt.querySelector('.rp-avatar').dataset.aura=p.aura||'none';socialCheckEntry(e);}
function socialRefreshVisible(){
  if(ROOM_UI.open)refreshRoomBoard();
  if(ROOM_UI.profile&&$('playerdlg')&&!$('playerdlg').classList.contains('hidden')){const e=roomEntries().find(x=>x.key===ROOM_UI.profile)||SOC.viewEntry;if(e){const p=entryProfile(e);const roleArea=$('playerdlg').querySelector('.public-role');if(roleArea){roleArea.replaceChildren();const r=roleOfEntry(e);if(r)roleArea.appendChild(roleBadge(r));}socialProfileActions(e);}}
}
async function socialSetRole(uid,role){
  if(!await socialRequire())return;
  if(!SOC.owner||!validAccountId(uid)||!['none','calsito'].includes(role))return;
  const go=await uiDialog({title:role==='calsito'?'ROL CALSITO':'QUITAR ROL',msg:role==='calsito'?'Este jugador tendrá la insignia CAL y el título amarillo Calsito en sus partidas.':'Este jugador dejará de mostrar la insignia Calsito.',ok:role==='calsito'?'Dar Calsito':'Quitar Calsito',cancel:'Cancelar'});if(!go)return;
  try{await SOC.db.collection('cf_roles').doc(uid).set({role,by:SOC.uid,updated:socialStamp()});SOC.roles.set(uid,role==='none'?'':role);ROOM_UI.signature='';socialRefreshVisible();if(SOC.open)socialRender();socialStatus(role==='calsito'?'Rol Calsito entregado.':'Rol Calsito quitado.');}catch(e){socialError(e);if(!SOC.open)await uiAlert(SOC.error||'No se pudo cambiar el rol.','ERROR DE ROL');}
}
function socialProfileActions(e){
  const area=$('playerdlg')?.querySelector('.public-actions');if(!area)return;area.replaceChildren();const uid=socialEntryUid(e);
  if(e.me){const edit=document.createElement('button');edit.textContent='✎ Editar perfil';edit.onclick=()=>{setRoomBoard(false,false);acctOpen().then(()=>acctCustomize());};area.appendChild(edit);return;}
  if(e.bot)return;
  if(!uid){const note=document.createElement('small');note.textContent=rawEntryProfile(e).uid?'Comprobando cuenta…':'Invitado · sin cuenta vinculada';area.appendChild(note);return;}
  const add=(text,fn,cls='')=>{const b=document.createElement('button');b.textContent=text;b.className=cls;b.onclick=fn;area.appendChild(b);};
  const link=SOC.links.get(socialPair(SOC.uid,uid));
  if(link?.status==='accepted')add('💬 Mensaje',()=>socialOpen(uid));
  else if(link?.status==='pending')add(link.by===SOC.uid?'Solicitud enviada':'Aceptar amistad',()=>link.by!==SOC.uid&&socialLinkAction(link.id,'accepted'));
  else add('＋ Añadir amigo',()=>socialRequest(uid));
  if(SOC.owner&&uid!==SOC.uid&&SOC.roles.get(uid)!=='owner')add(SOC.roles.get(uid)==='calsito'?'Quitar Calsito':'Dar rol Calsito',()=>socialSetRole(uid,SOC.roles.get(uid)==='calsito'?'none':'calsito'),'owner-role-action');
}
async function socialRequire(){if(!ACCT.user){if(SOC.open)socialClose();await acctOpen();return false;}if(!ACCT.user.emailVerified){SOC.error='Verificá tu correo para usar amigos y mensajes.';socialRender();return false;}if(!SOC.ready)await socialAuthChanged();return SOC.ready;}
async function socialRequest(uid){
  if(!validAccountId(uid)||uid===ACCT.user?.uid)return;if(!await socialRequire())return;
  try{const target=await socialGetProfile(uid);if(!target)throw Error('No encontré ese código de amigo.');const id=socialPair(SOC.uid,uid),ref=SOC.db.collection('cf_links').doc(id),prev=SOC.links.get(id);
    if(prev?.status==='accepted')return socialOpen(uid);if(prev?.status==='pending')return;
    await ref.set({members:[SOC.uid,uid].sort(),by:SOC.uid,status:'pending',updated:socialStamp()});SOC.error='';socialStatus('Solicitud enviada.');socialRefreshVisible();
  }catch(e){socialError(e);}
}
async function socialLinkAction(id,status){if(!SOC.ready||!SOC.links.has(id))return;try{await SOC.db.collection('cf_links').doc(id).update({status,updated:socialStamp()});SOC.error='';}catch(e){socialError(e);}}
async function socialBlock(uid){if(!SOC.ready)return;const yes=await uiDialog({title:'BLOQUEAR JUGADOR',msg:'No podrá enviarte solicitudes ni mensajes. Podés desbloquearlo desde Amigos.',ok:'Bloquear',cancel:'Cancelar'});if(!yes)return;try{const b=SOC.db.batch();b.set(SOC.db.collection('cf_blocks').doc(SOC.uid).collection('users').doc(uid),{at:socialStamp()});const link=SOC.links.get(socialPair(uid,SOC.uid));if(link?.status==='accepted')b.update(SOC.db.collection('cf_links').doc(link.id),{status:'removed',updated:socialStamp()});else if(link?.status==='pending')b.update(SOC.db.collection('cf_links').doc(link.id),{status:'declined',updated:socialStamp()});await b.commit();socialChatStop();socialRender();}catch(e){socialError(e);}}
const dmDrafts=new Map();
function dmDraftKey(){return SOC.uid&&SOC.thread?SOC.uid+':'+SOC.thread:'';}
function dmSaveDraft(){const key=dmDraftKey(),input=$('dm-text');if(key&&input)dmDrafts.set(key,input.value);}
function dmCount(){const c=$('dm-count'),input=$('dm-text');if(c&&input)c.textContent=input.value.length+' / 1000';}
function socialChatStop(){dmSaveDraft();if(SOC.chatOff)SOC.chatOff();SOC.chatOff=null;SOC.thread=null;SOC.messages=[];}
async function socialChat(uid){
  if(!await socialRequire())return;const id=socialPair(SOC.uid,uid),link=SOC.links.get(id);if(link?.status!=='accepted')return;socialChatStop();SOC.thread=id;SOC.chatUid=uid;SOC.error='';SOC.messages=[];if($('dm-text'))$('dm-text').value=dmDrafts.get(dmDraftKey())||'';dmCount();socialRender();const epoch=SOC.epoch;
  SOC.chatOff=SOC.db.collection('cf_links').doc(id).collection('messages').orderBy('at','desc').limit(50).onSnapshot(s=>{if(epoch!==SOC.epoch||SOC.thread!==id)return;SOC.messages=s.docs.map(d=>({id:d.id,...d.data()})).reverse();socialRenderMessages();},e=>{socialError(e);});
}
async function socialSend(text){
  text=profileText(text,1000).trim();if(!text||!SOC.ready||!SOC.thread||SOC.sending)return false;if(Date.now()-SOC.sendAt<700){socialStatus('Esperá un instante antes de enviar otro mensaje.');return false;}
  SOC.sending=true;try{await SOC.db.collection('cf_links').doc(SOC.thread).collection('messages').add({from:SOC.uid,text,at:socialStamp()});SOC.sendAt=Date.now();SOC.error='';return true;}catch(e){return socialError(e);}finally{SOC.sending=false;}
}
function socialBuild(){
  if($('socialdlg'))return;const d=document.createElement('div');d.id='socialdlg';d.className='hidden';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','social-title');
  d.innerHTML='<div class="social-shell"><header><div><small>TU GENTE, TU PARTIDA</small><h2 id="social-title">Amigos</h2></div><button type="button" id="social-close" aria-label="Cerrar amigos">✕</button></header><p id="social-status" role="status"></p><div class="social-layout"><aside><form id="friend-form"><label for="friend-code">Añadir por código de amigo</label><div><input id="friend-code" maxlength="128" placeholder="Pegá el código"><button type="submit" aria-label="Enviar solicitud">＋</button></div></form><button type="button" id="friend-mycode">Copiar mi código</button><label class="friend-search-label" for="friend-search">BUSCAR AMIGOS</label><input id="friend-search" type="search" maxlength="40" placeholder="Buscar por nombre…" autocomplete="off"><div id="friend-list"></div><button type="button" id="friend-blocks">Bloqueados</button></aside><section class="social-chat"><div id="dm-head">Elegí un amigo para conversar</div><div id="dm-messages" role="log" aria-live="polite"></div><form id="dm-form"><textarea id="dm-text" rows="2" maxlength="1000" placeholder="Escribí un mensaje…" aria-label="Mensaje privado"></textarea><button type="submit" id="dm-send">Enviar ↗</button></form><div class="dm-footer"><small class="dm-privacy">Solo entre amigos · Enter envía en PC</small><small id="dm-count">0 / 1000</small></div></section></div></div>';
  document.body.appendChild(d);$('social-close').onclick=socialClose;d.onclick=e=>{if(e.target===d)socialClose();};$('friend-form').onsubmit=e=>{e.preventDefault();socialRequest($('friend-code').value.trim());};$('friend-mycode').onclick=async()=>{if(!await socialRequire())return;try{await navigator.clipboard.writeText(SOC.uid);socialStatus('Código copiado.');}catch(e){$('friend-code').value=SOC.uid;socialStatus('Tu código aparece en el campo de arriba.');}};
  $('friend-search').oninput=()=>socialRender();$('dm-text').oninput=()=>{dmSaveDraft();dmCount();};$('dm-form').onsubmit=async e=>{e.preventDefault();const input=$('dm-text'),v=input.value,key=dmDraftKey();if(await socialSend(v)){if(dmDrafts.get(key)===v)dmDrafts.delete(key);if(dmDraftKey()===key){if(input.value===v)input.value='';dmCount();input.focus();}}};
  $('dm-text').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!matchMedia('(pointer: coarse)').matches){e.preventDefault();$('dm-form').requestSubmit();}};
  $('friend-blocks').onclick=async()=>{if(!await socialRequire())return;try{const result=await SOC.db.collection('cf_blocks').doc(SOC.uid).collection('users').limit(100).get();const list=$('friend-list');list.replaceChildren();const h=document.createElement('h3');h.textContent='Bloqueados';list.appendChild(h);for(const doc of result.docs){const row=document.createElement('div');row.className='friend-row';const p=await socialGetProfile(doc.id);const text=document.createElement('span');text.textContent=p?.n||doc.id;const b=document.createElement('button');b.textContent='Desbloquear';b.onclick=async()=>{await doc.ref.delete();socialRender();};row.append(text,b);list.appendChild(row);}if(result.empty)list.appendChild(document.createTextNode('No tenés jugadores bloqueados.'));}catch(e){socialError(e);}};
}
function socialBadge(){const n=[...SOC.links.values()].filter(l=>l.status==='pending'&&l.by!==SOC.uid).length;const b=$('friendsbtn');if(b){b.textContent='♧ Amigos'+(n?' · '+n:'');b.setAttribute('aria-label','Amigos'+(n?', '+n+' solicitudes pendientes':''));}}
function socialStatus(text){if($('social-status'))$('social-status').textContent=text||SOC.error||(!ACCT.user?'Iniciá sesión para añadir amigos.':!SOC.ready?'Conectando con tus amigos…':'Tu código de amigo es propio de tu cuenta.');}
async function socialOpen(uid=''){
  socialBuild();const focus=document.activeElement;if(ROOM_UI.profile||ROOM_UI.open)setRoomBoard(false,false);SOC.open=true;SOC.panelFocus=focus;document.body.classList.add('social-browsing');roomClearInput();$('socialdlg').classList.remove('hidden');unlock();$('social-close').focus();socialRender();
  if(await socialRequire()){socialRender();if(uid)await socialChat(uid);}
}
function socialClose(){dmSaveDraft();SOC.open=false;$('socialdlg')?.classList.add('hidden');document.body.classList.remove('social-browsing');roomClearInput();if(SOC.panelFocus?.isConnected)SOC.panelFocus.focus({preventScroll:true});if(G.state==='play'&&!G.paused&&!G.over&&!ROOM_UI.open&&!ROOM_UI.profile)requestLock();}
let socialRenderTicket=0;
async function socialRender(){
  socialBadge();if(!SOC.open||!$('friend-list'))return;socialStatus();const ticket=++socialRenderTicket,list=$('friend-list');list.replaceChildren();
  const links=[...SOC.links.values()].filter(l=>['accepted','pending'].includes(l.status));links.sort((a,b)=>a.status.localeCompare(b.status));
  if(!links.length){const t=document.createElement('p');t.className='social-empty';t.textContent=ACCT.user?'Tu lista empieza con una solicitud. Tocá el perfil de alguien en Tab para añadirlo.':'Entrá a tu cuenta para encontrar a tus amigos.';list.appendChild(t);}
  const query=$('friend-search').value.trim().toLocaleLowerCase();
  const seenUids=new Set([SOC.uid]);
  for(const l of links){const uid=l.members.find(x=>x!==SOC.uid);seenUids.add(uid);socialWatchRole(uid);let p;try{p=await socialGetProfile(uid);}catch(e){}if(ticket!==socialRenderTicket||!SOC.open)return;if(query&&!(p?.n||'Jugador').toLocaleLowerCase().includes(query))continue;const row=document.createElement('div');row.className='friend-row'+(l.status==='pending'?' pending':'')+(SOC.thread===l.id?' active':'');const av=document.createElement('img');av.src=p?.a||'assets/calfight_icon.png';av.alt='';const info=document.createElement('button');info.className='friend-info';const b=document.createElement('b'),s=document.createElement('small');b.textContent=p?.n||'Jugador';const role=SOC.roles.get(uid);if(role)b.appendChild(roleBadge(role));s.textContent=l.status==='accepted'?'Amigo · abrir chat':l.by===SOC.uid?'Solicitud enviada':'Quiere ser tu amigo';info.append(b,s);info.onclick=()=>l.status==='accepted'?socialChat(uid):socialViewAccount(uid);row.append(av,info);
    const action=(label,fn,cls='')=>{const bt=document.createElement('button');bt.textContent=label;if(cls)bt.className=cls;bt.onclick=fn;row.appendChild(bt);};
    if(SOC.owner&&uid!==SOC.uid&&role!=='owner')action(role==='calsito'?'Quitar Calsito':'Dar Calsito',()=>socialSetRole(uid,role==='calsito'?'none':'calsito'),'owner-role-action');
    if(l.status==='pending'){if(l.by!==SOC.uid)action('Aceptar',()=>socialLinkAction(l.id,'accepted'));action(l.by===SOC.uid?'Cancelar':'Rechazar',()=>socialLinkAction(l.id,'declined'));}
    else{action('Perfil',()=>socialViewAccount(uid));action('×',async()=>{if(await uiDialog({title:'QUITAR AMIGO',msg:'Podrán volver a añadirse después.',ok:'Quitar',cancel:'Cancelar'}))socialLinkAction(l.id,'removed');});}list.appendChild(row);
  }
  if(links.length&&!list.children.length){const empty=document.createElement('p');empty.className='social-empty';empty.textContent='No encontramos amigos con ese nombre.';list.appendChild(empty);}
  if(SOC.owner&&SOC.db){
    try{
      const snap=await SOC.db.collection('cf_profiles').limit(20).get();
      if(ticket!==socialRenderTicket||!SOC.open)return;
      snap.forEach(d=>{const p=cleanPublicProfile(d.data());if(p)SOC.profiles.set(d.id,p);});
    }catch(e){}
    const extraUids=new Set([...SOC.profiles.keys(),...SOC.roles.keys()]);
    for(const e of roomEntries()){const u=socialEntryUid(e)||rawEntryProfile(e).uid;if(validAccountId(u))extraUids.add(u);}
    const others=[...extraUids].filter(u=>validAccountId(u)&&!seenUids.has(u));
    if(SOC.owner){
      const h=document.createElement('h3');h.textContent='ROL CALSITO · JUGADORES';h.style.margin='12px 0 6px';h.style.fontSize='12px';list.appendChild(h);
      const codeRow=document.createElement('div');codeRow.className='friend-row';
      const codeBtn=document.createElement('button');codeBtn.textContent='Dar/Quitar Calsito al código de arriba';codeBtn.className='owner-role-action';
      codeBtn.onclick=()=>{const c=($('friend-code')?.value||'').trim();if(!validAccountId(c)||c===SOC.uid)return socialStatus('Pegá el código del jugador arriba en "Añadir por código de amigo".');socialSetRole(c,SOC.roles.get(c)==='calsito'?'none':'calsito');};
      codeRow.appendChild(codeBtn);list.appendChild(codeRow);
      for(const uid of others){
        socialWatchRole(uid);
        const p=SOC.profiles.get(uid);
        const nm=p?.n||roomEntries().find(e=>(socialEntryUid(e)||rawEntryProfile(e).uid)===uid)?.f?.name||('Jugador '+uid.slice(0,6));
        if(query&&!nm.toLocaleLowerCase().includes(query))continue;
        const row=document.createElement('div');row.className='friend-row';
        const av=document.createElement('img');av.src=p?.a||'assets/calfight_icon.png';av.alt='';
        const info=document.createElement('button');info.className='friend-info';
        const b=document.createElement('b'),s=document.createElement('small');b.textContent=nm;
        const role=SOC.roles.get(uid);if(role)b.appendChild(roleBadge(role));
        s.textContent=role==='calsito'?'Tiene rol Calsito · ver perfil':'Cuenta registrada · ver perfil';
        info.append(b,s);info.onclick=()=>socialViewAccount(uid);row.append(av,info);
        if(role!=='owner'){const bt=document.createElement('button');bt.className='owner-role-action';bt.textContent=role==='calsito'?'Quitar Calsito':'Dar Calsito';bt.onclick=()=>socialSetRole(uid,role==='calsito'?'none':'calsito');row.appendChild(bt);}
        list.appendChild(row);
      }
    }
  }
  socialRenderMessages();
}
function socialRenderMessages(){
  if(!SOC.open||!$('dm-messages'))return;const box=$('dm-messages'),nearBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80,first=!box.children.length;box.replaceChildren();
  const friend=SOC.profiles.get(SOC.chatUid);$('dm-head').replaceChildren();$('dm-head').appendChild(document.createTextNode(SOC.thread?(friend?.n||'Amigo'):'Elegí un amigo para conversar'));
  if(SOC.thread){const profile=document.createElement('button');profile.textContent='Ver perfil';profile.onclick=()=>socialViewAccount(SOC.chatUid);const block=document.createElement('button');block.textContent='Bloquear';block.onclick=()=>socialBlock(SOC.chatUid);$('dm-head').append(profile,block);}
  $('dm-text').disabled=$('dm-send').disabled=!SOC.ready||!SOC.thread;
  let lastDay='';for(const m of SOC.messages){const date=m.at?.toDate?.(),day=date?date.toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'}):'';if(day&&day!==lastDay){const sep=document.createElement('div');sep.className='dm-day';sep.textContent=day;box.appendChild(sep);lastDay=day;}const row=document.createElement('div');row.className='dm-message'+(m.from===SOC.uid?' mine':'');const text=document.createElement('p');text.textContent=m.text;const t=document.createElement('time');t.textContent=date?date.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}):'Enviando…';row.append(text,t);box.appendChild(row);}
  if(!SOC.messages.length){const e=document.createElement('p');e.className='social-empty';e.textContent=SOC.thread?'Todavía no hay mensajes. Saludá a tu amigo.':'Las conversaciones aparecen acá.';box.appendChild(e);}if(nearBottom||first)box.scrollTop=box.scrollHeight;
}
async function socialViewAccount(uid){const p=(await socialGetProfile(uid).catch(()=>null))||{v:1,uid,n:'Jugador',a:'',b:{k:'pre:sunset'},acct:true,g:0,m:0,f:''};SOC.verified.set('account-'+uid,{uid,until:Date.now()+60000});SOC.viewEntry={key:'account-'+uid,me:uid===SOC.uid,bot:false,pr:{pf:p,uid},f:{name:p.n||'Jugador',ch:CHARS[p.f]||CHARS.javi,kills:0,deaths:0,remote:true}};socialWatchRole(uid);socialClose();playerProfileOpen(SOC.viewEntry.key,document.activeElement);}
function socialTick(){
  document.body.classList.toggle('has-match',G.state==='play');
  syncFriendsBtnPlace();
  const entries=roomEntries();for(const e of entries){socialCheckEntry(e);const f=e.f,role=roleOfEntry(e);if(e.me&&role&&!f.plate){const p=document.createElement('div');p.className='plate self-role-plate';$('plates').appendChild(p);f.plate=p;f.plateBar=document.createElement('b');}
    if(!f.plate)continue;let label=f.plate.querySelector('.role-title');if(role&&!label){label=document.createElement('strong');label.className='role-title';f.plate.prepend(label);}if(label){label.textContent=role==='owner'?'Owner':role==='calsito'?'Calsito':'';label.dataset.role=role;label.hidden=!role;}if(e.me&&f.plate.classList.contains('self-role-plate'))f.plate.style.visibility=role?'':'hidden';}
  if(SOC.ready&&NET.named)socialPublishSession();
}
addEventListener('keydown',e=>{if(!SOC.open)return;if(e.code==='Escape'){e.preventDefault();socialClose();e.stopImmediatePropagation();}else if(e.code==='Tab'){const els=[...$('socialdlg').querySelectorAll('button:not(:disabled),input,textarea:not(:disabled)')],i=els.indexOf(document.activeElement);e.preventDefault();els[(i+(e.shiftKey?els.length-1:1))%els.length]?.focus();e.stopImmediatePropagation();}},true);
const friendsButton=document.createElement('button');friendsButton.id='friendsbtn';friendsButton.type='button';friendsButton.textContent='♧ Amigos';friendsButton.onclick=()=>socialOpen();document.body.appendChild(friendsButton);
setInterval(()=>{if(!IS_GUIDE)socialTick();},1000);

$('acctbtn').addEventListener('click', e => { e.stopPropagation(); acctOpen(); }); $('acctbtn2').addEventListener('click', () => { try { sfx('select'); } catch (e) { } acctOpen(); });
try { if (!IS_GUIDE && localStorage.getItem('bsb_acct') === '1') acctLoad().catch(() => { }); } catch (e) { }   // si ya había una sesión, se restaura

addEventListener('keydown', e => { if (e.code === 'F9' && e.ctrlKey && e.shiftKey) { e.preventDefault(); ownerOpen(); } });
addEventListener('keydown', e => { if (e.code === 'F4' && DEV.on && !e.repeat) { e.preventDefault(); $('devhud').classList.toggle('off'); } });
setInterval(() => {
  const h = $('devhud'); if (!DEV.on || h.classList.contains('off')) return;
  const p = G.player;
  h.textContent = `FPS ${Math.round(GFX.fps || 0)}  ·  calidad ${GFX.names[GFX.level]}\n` + (p ? `pos ${p.pos.x.toFixed(1)}, ${p.pos.y.toFixed(1)}, ${p.pos.z.toFixed(1)}\n` : '') + `peleadores ${G.fighters.length}  proy ${PROJ.length}  fx ${FX.length}\nestado ${G.state}${G.mp ? ' · online' : ''}${G.guide ? ' · guía' : ''}`;
}, 400);
$('devstat').addEventListener('click', () => { sfx('select'); ownerOpen(); });
{
  const tg = $('devtoggle'), pop = $('devpop'), close = () => { pop.classList.add('hidden'); tg.setAttribute('aria-expanded', 'false'); };
  tg.addEventListener('click', e => { e.stopPropagation(); const open = pop.classList.contains('hidden'); pop.classList.toggle('hidden', !open); tg.setAttribute('aria-expanded', String(open)); });
  pop.addEventListener('click', close);   // al elegir una herramienta el menú se cierra
  addEventListener('click', e => { if (!pop.contains(e.target)) close(); }, true);
  addEventListener('keydown', e => { if (e.code === 'Escape' && !pop.classList.contains('hidden')) { e.preventDefault(); e.stopImmediatePropagation(); close(); } }, true);
}

  return { ACCT, ACCT_ERR, BANNERS, BN_CACHE, PROFILE_AURAS, PROFILE_EFFECTS, PROFILE_FRAMES, PROFILE_MAP_BANNERS, PROFILE_STICKERS, PROFILE_THEMES, SOC, acctBannerPick, acctBuild, acctChanged, acctClose, acctCustomize, acctErr, acctGate, acctLoad, acctMsg, acctOpen, acctPaint, acctRefreshVerified, acctRender, acctSha, avatarGet, bannerDecals, bannerDraw, bannerGet, bannerKey, bannerSet, bannerURL, cleanCosmetics, cleanProfileDecor, compactProfileImage, cosmeticKey, cosmeticSave, cosmeticsGet, decorateProfile, dmCount, dmDraftKey, dmDrafts, dmSaveDraft, drawMapBanner, enableDecalDrag, friendsButton, profileText, roleBadge, roleOfEntry, socialAuthChanged, socialBadge, socialBlock, socialBuild, socialChat, socialChatStop, socialCheckEntry, socialClose, socialDecorateIdentity, socialEntryUid, socialError, socialGetProfile, socialLinkAction, socialLoad, socialOpen, socialPair, socialProfileActions, socialPublishSession, socialRefreshVisible, socialRender, socialRenderMessages, socialRequest, socialRequire, socialReset, socialSaveProfile, socialSend, socialSetRole, socialStamp, socialStatus, socialTick, socialViewAccount, socialWait, socialWatchRole, stickerNode, uploadProfileAvatar, validAccountId };
};
