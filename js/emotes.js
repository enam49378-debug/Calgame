/* ===== SISTEMA DE EMOTES =====
   - Mantener la tecla de emotes (por defecto T, se cambia en Opciones > Controles) abre la RUEDA de 12 slots; mover el mouse hacia un slot y soltar la tecla lo ejecuta.
     En celular hay un botón 😀 que abre la rueda para tocar el emote.
   - Cada slot es editable: Menú o Pausa > "😀 EMOTES" abre el editor (elegís un slot y tocás el emote que quieras ponerle).
   - Los emotes se desbloquean con KILLS como en TSB. Solo cuentan las kills de SALAS PÚBLICAS contra otros jugadores:
     no cuentan las salas privadas, jugar solo, ni los bots / dummies (game.js solo llama a onPublicKill en ese caso).
   - Los demás jugadores ven tu emote (se manda como una acción de red {k:'e', i}).
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const KEY_KILLS = 'bsb_emote_kills', KEY_SLOTS = 'bsb_emote_slots_v1', NSLOTS = 12;
    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

    // ---------------------------------------------------------------- catálogo de emotes
    // seq: [[segundo, pose], ...] (poses con los mismos canales que POSE: ix cuerpo, tx torso, hx/hy cabeza, alx/arx brazos, llx/lrx piernas, by altura...)
    const keys = (dur, step, fn) => { const out = []; for (let t = step, i = 0; t < dur; t += step, i++) out.push([+t.toFixed(3), fn(i)]); return out; };
    const REST = { ix: .04, tx: .08, ty: .3, hy: -.25, alx: -1.05, alz: -.35, aly: .2, arx: -.75, arz: .3, ary: -.2, llx: -.3, llz: .08, lrx: .25, lrz: -.1, by: -.6 };
    const EM = [
      { id: 0, n: 'Saludo', ico: '👋', k: 0, dur: 2.6, seq: [[.25, { hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: -.5, llx: -.1, lrx: .1, by: -.6 }], ...keys(2.3, .28, i => ({ hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: i % 2 ? -.95 : -.15, llx: -.1, lrx: .1, by: -.6 })), [2.6, REST]] },
      { id: 1, n: 'Baile', ico: '🕺', k: 0, dur: 3.4, seq: keys(3.4, .4, i => { const s = i % 2 ? 1 : -1; return { ix: .08, tx: .1 * s, ty: .55 * s, hy: -.3 * s, hx: .1, by: i % 2 ? -3 : -1.2, alx: s > 0 ? -2.7 : -.5, alz: .4, arx: s > 0 ? -.5 : -2.7, arz: -.4, llx: s > 0 ? -.5 : .1, lrx: s > 0 ? .1 : -.5, llz: .2 * s, lrz: .2 * s }; }).concat([[3.4, REST]]) },
      { id: 2, n: 'Risa', ico: '😆', k: 0, dur: 2.4, seq: keys(2.2, .14, i => ({ ix: -.18, tx: -.28, hx: -.55, by: i % 2 ? -2.4 : -1, alx: -1.0, alz: -.5, arx: -1.0, arz: .5, llx: -.15, lrx: .15 })).concat([[2.4, REST]]) },
      { id: 3, n: 'Flexión de poder', ico: '💪', k: 3, dur: 2.8, seq: [[.35, { by: -2, tx: -.15, alx: -.9, alz: 1.1, arx: -.9, arz: -1.1, llz: .3, lrz: -.3 }], ...keys(2.5, .3, i => ({ by: i % 2 ? -3 : -2, tx: -.15, ix: .05, alx: -.9, alz: 1.1, arx: -.9, arz: -1.1, llz: .3, lrz: -.3, hx: .05 })), [2.8, REST]] },
      { id: 4, n: 'Reverencia', ico: '🙇', k: 5, dur: 2.4, seq: [[.55, { ix: 1.15, tx: .5, hx: .25, by: -3, alx: .3, alz: .2, arx: .3, arz: -.2, llx: -.2, lrx: -.2 }], [1.7, { ix: 1.15, tx: .5, hx: .25, by: -3, alx: .3, alz: .2, arx: .3, arz: -.2, llx: -.2, lrx: -.2 }], [2.4, REST]] },
      { id: 5, n: 'Meditar', ico: '🧘', k: 8, dur: 3.8, seq: [[.7, { by: -9, ix: .1, tx: .05, hx: .05, alx: -.9, alz: .95, arx: -.9, arz: -.95, llx: -1.5, lrx: -1.5, llz: .55, lrz: -.55 }], ...keys(3.4, .8, i => ({ by: i % 2 ? -9.6 : -9, ix: .1, tx: .05, hx: .05, alx: -.9, alz: .95, arx: -.9, arz: -.95, llx: -1.5, lrx: -1.5, llz: .55, lrz: -.55 })), [3.8, REST]], fx: 'aura' },
      { id: 6, n: 'Karate', ico: '🥋', k: 12, dur: 3.2, seq: keys(3.0, .3, i => ({ by: -4, ix: .1, tx: .15, ty: i % 2 ? .5 : -.5, hy: i % 2 ? -.4 : .4, alx: i % 2 ? -1.57 : -.9, alz: .1, arx: i % 2 ? -.9 : -1.57, arz: -.1, llx: -.7, lrx: .5, llz: .35, lrz: -.35 })).concat([[3.2, REST]]) },
      { id: 7, n: 'Sentadillas', ico: '🏋️', k: 16, dur: 3.2, seq: keys(3.0, .4, i => i % 2 ? { by: -1, llx: -.2, lrx: -.2, alx: -1.5, arx: -1.5, alz: .1, arz: -.1 } : { by: -8, tx: .35, ix: .1, hx: -.3, llx: -1.5, lrx: -1.5, llz: .3, lrz: -.3, alx: -1.55, arx: -1.55, alz: .1, arz: -.1 }).concat([[3.2, REST]]) },
      { id: 8, n: 'Breakdance', ico: '🌀', k: 22, dur: 3.4, spin: 6, seq: keys(3.2, .3, i => ({ by: -9, ix: .9, tx: .3, hx: -.5, llx: i % 2 ? -1.4 : 1.0, lrx: i % 2 ? 1.0 : -1.4, llz: .8, lrz: -.8, alx: -.4, alz: 1.2, arx: -.4, arz: -1.2 })).concat([[3.4, REST]]) },
      { id: 9, n: 'Facepalm', ico: '🤦', k: 28, dur: 2.6, seq: [[.35, { ix: .08, tx: .1, hx: .55, by: -1, arx: -2.5, arz: -.1, alx: -.5, alz: .2, llx: -.1, lrx: .1 }], ...keys(2.2, .26, i => ({ ix: .08, tx: .1, hx: .55, hy: i % 2 ? .35 : -.35, by: -1, arx: -2.5, arz: -.1, alx: -.5, alz: .2, llx: -.1, lrx: .1 })), [2.6, REST]] },
      { id: 10, n: 'Victoria', ico: '✌️', k: 35, dur: 3.0, seq: keys(2.8, .3, i => ({ by: i % 2 ? -.5 : -3, hx: -.2, alx: -2.95, alz: .5, arx: -2.95, arz: -.5, llx: i % 2 ? -.1 : -.5, lrx: i % 2 ? -.1 : -.5 })).concat([[3.0, REST]]), fx: 'confetti' },
      { id: 11, n: 'Moonwalk', ico: '🎤', k: 45, dur: 3.0, moon: true, seq: keys(2.8, .22, i => ({ ix: -.05, tx: -.1, by: -1, alx: i % 2 ? -.6 : -1.2, arx: i % 2 ? -1.2 : -.6, alz: .3, arz: -.3, llx: i % 2 ? .35 : -.35, lrx: i % 2 ? -.35 : .35 })).concat([[3.0, REST]]) },
      { id: 12, n: 'Llorar', ico: '😭', k: 60, dur: 3.0, seq: [[.3, { ix: .15, tx: .3, hx: .8, by: -2, alx: -2.35, alz: .35, arx: -2.35, arz: -.35, llx: -.2, lrx: .1 }], ...keys(2.7, .12, i => ({ ix: .15, tx: i % 2 ? .36 : .26, hx: .8, by: i % 2 ? -2.5 : -1.7, alx: -2.35, alz: .35, arx: -2.35, arz: -.35, llx: -.2, lrx: .1 })), [3.0, REST]] },
      { id: 13, n: 'Pose final', ico: '🔥', k: 80, dur: 3.4, seq: [[.3, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [3.0, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2.4, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [3.4, REST]], fx: 'fire' },
      { id: 14, n: 'Leyenda', ico: '👑', k: 120, dur: 3.6, seq: [[.4, { ix: -.05, tx: -.1, hx: -.28, by: -1, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.1, lrx: .15 }], [3.2, { ix: -.05, tx: -.1, hx: -.28, by: -1.4, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.1, lrx: .15 }], [3.6, REST]], fx: 'gold' },
    ];
    const byId = id => EM.find(e => e.id === id);

    // ---------------------------------------------------------------- estado (kills públicas y slots)
    let kills = Math.max(0, rd(KEY_KILLS, 0) | 0), slots = rd(KEY_SLOTS, null);
    const unlocked = e => !!e && kills >= e.k;
    const defaultSlots = () => { const s = new Array(NSLOTS).fill(null); EM.filter(unlocked).slice(0, NSLOTS).forEach((e, i) => { s[i] = e.id; }); return s; };
    if (!Array.isArray(slots) || slots.length !== NSLOTS) slots = defaultSlots();
    slots = slots.map(v => (typeof v === 'number' && byId(v) ? v : null));
    const saveSlots = () => wr(KEY_SLOTS, slots);

    // ---------------------------------------------------------------- reproducir un emote
    function play(f, id, fromNet) {
      const e = byId(id); if (!e || !f || !f.alive || f.ragdoll > 0) return false;
      if (!fromNet && !unlocked(e)) { popText(chestOf(f), '🔒 ' + e.k + ' kills públicas', '#ff8a80', 18); return false; }
      if (f.action && !f.action.isEmote) return false;            // no corta un ataque
      const dur = e.dur;
      startAction(f, {
        name: 'emote', emote: id, isEmote: true, dur, anim: e.seq, speedMul: 0, spin: e.spin || 0, eyes: false,
        tick: (a, t, dt) => {
          const busy = f.stun > 0 || f.hurtT > 0 || f.ragdoll > 0 || f.frozen > 0 || f.grabbed || !f.alive;
          let move = false;
          if (f.isPlayer && !f.remote) { const c = playerCtl(); move = !!(c.mx || c.mz || c.jump || c.dash || c.m1 || c.block || c.skill >= 0 || c.ult); }
          else if (f.remote) move = Math.hypot(f.vel.x, f.vel.z) > 2.2;
          if ((busy || move) && t > .15) { endAction(f); return; }
          if (e.moon) { const F = fwd(f.yaw); f.vel.x = -F.x * 1.7; f.vel.z = -F.z * 1.7; }
          const fx = e.fx;
          if (fx && Math.floor(t * 3) !== Math.floor((t - dt) * 3)) {
            const P = chestOf(f);
            if (fx === 'gold') { burst(P, 6, '#ffd54f', 4, .1, .8, -.2); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#ffd54f', 1.8, .7); }
            else if (fx === 'fire') { burst(P, 8, '#ff6a3c', 5, .14, .7, -.3); burst(P, 4, '#ffd23f', 4, .1, .6, -.3); }
            else if (fx === 'aura') { ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#9be8ff', 1.5, .9); }
            else if (fx === 'confetti') { for (const c of ['#ff5f8a', '#ffd23f', '#4fd0c9', '#c46bff']) burst(new V3(P.x, P.y + .8, P.z), 5, c, 4, .1, 1.1, .6); }
          }
        },
        onEnd: () => { f.vel.x *= .2; f.vel.z *= .2; },
      });
      if (!f.action || !f.action.isEmote) return false;
      popText(chestOf(f).add(new V3(0, .7, 0)), e.ico + ' ' + e.n, f.ch.color, 20);
      sfx('select', f.pos, .6);
      if (!fromNet && f.isPlayer && G.mp && !G.viewer) netAct({ k: 'e', i: id });
      return true;
    }

    // ---------------------------------------------------------------- kills públicas
    function onPublicKill(victim) {
      if (!victim || victim.dummy || victim.ai || !victim.remote) return;        // solo contra otros jugadores reales
      const before = kills; kills++; wr(KEY_KILLS, kills);
      for (const e of EM) if (before < e.k && kills >= e.k) {
        const free = slots.indexOf(null); if (!slots.includes(e.id) && free >= 0) { slots[free] = e.id; saveSlots(); }
        showBanner('¡EMOTE DESBLOQUEADO!', '#ffd54f', e.ico + ' ' + e.n);
        addFeedText('🎉 Desbloqueaste el emote «' + e.n + '» (' + e.k + ' kills públicas)', '#ffd54f');
      }
      refreshEditor();
    }

    // ---------------------------------------------------------------- interfaz (estilos propios, sin tocar style.css)
    const css = document.createElement('style');
    css.textContent = `
#emw{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(8,10,20,.15),rgba(8,10,20,.62));font-family:var(--body,system-ui,sans-serif);user-select:none;-webkit-user-select:none}
#emw.on{display:flex}
#emw .ring{position:relative;width:440px;height:440px}
#emw .sl{position:absolute;width:84px;height:84px;margin:-42px 0 0 -42px;border-radius:50%;border:2px solid rgba(255,255,255,.28);background:rgba(18,22,40,.82);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;line-height:1;transition:transform .08s,border-color .08s,background .08s;cursor:pointer;padding:0}
#emw .sl small{font-size:10px;margin-top:3px;max-width:76px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.85}
#emw .sl.empty{opacity:.4;font-size:22px}
#emw .sl.hot{transform:scale(1.18);border-color:#ffd54f;background:rgba(60,48,10,.92);box-shadow:0 0 22px rgba(255,213,79,.6)}
#emw .mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:150px;text-align:center;color:#fff;pointer-events:none}
#emw .mid b{display:block;font-size:18px;letter-spacing:.04em}
#emw .mid span{font-size:12px;opacity:.8}
#emw .hint{position:absolute;bottom:24px;left:0;right:0;text-align:center;color:#fff;opacity:.75;font-size:13px}
#emw .dot{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#ffd54f;box-shadow:0 0 10px #ffd54f;pointer-events:none}
#emtouch{position:fixed;right:14px;bottom:210px;z-index:60;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(18,22,40,.7);font-size:26px;display:none;align-items:center;justify-content:center;padding:0;color:#fff}
body.touchmode #emtouch,#emtouch.show{display:flex}
#emed{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;background:rgba(6,8,16,.82);font-family:var(--body,system-ui,sans-serif);color:#fff}
#emed.on{display:flex}
#emed .box{width:min(940px,96vw);max-height:92vh;overflow:auto;background:#12162a;border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:18px 20px;display:grid;grid-template-columns:330px 1fr;gap:18px}
@media(max-width:780px){#emed .box{grid-template-columns:1fr}}
#emed h2{margin:0 0 4px;letter-spacing:.06em;font-size:20px}
#emed .sub{opacity:.75;font-size:13px;margin-bottom:10px}
#emed .rg{position:relative;width:300px;height:300px;margin:6px auto}
#emed .rg .sl{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:2px solid rgba(255,255,255,.25);background:#1b2140;color:#fff;font-size:22px;cursor:pointer;padding:0}
#emed .rg .sl.sel{border-color:#ffd54f;box-shadow:0 0 14px rgba(255,213,79,.7);background:#3a3010}
#emed .rg .sl.empty{opacity:.45;font-size:16px}
#emed .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;align-content:start}
#emed .card{border:1px solid rgba(255,255,255,.18);border-radius:12px;background:#1b2140;padding:10px 8px;text-align:center;cursor:pointer;color:#fff;font-size:13px}
#emed .card .ic{font-size:28px;display:block}
#emed .card.lock{opacity:.5;cursor:not-allowed}
#emed .card.used{outline:2px solid #4fd0c9}
#emed .card small{display:block;opacity:.8;margin-top:3px;font-size:11px}
#emed .foot{grid-column:1/-1;display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}
#emed button.b{border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer;background:#2a3158;color:#fff}
#emed button.b.go{background:#ffd54f;color:#201800}
#emmenu{margin-left:8px}`;
    document.head.appendChild(css);

    const W = document.createElement('div'); W.id = 'emw'; W.setAttribute('aria-hidden', 'true');
    W.innerHTML = '<div class="ring"><div class="mid"><b></b><span></span></div></div><div class="hint"></div>';
    document.body.appendChild(W);
    const ring = W.querySelector('.ring'), midB = W.querySelector('.mid b'), midS = W.querySelector('.mid span'), hint = W.querySelector('.hint');
    const dot = document.createElement('div'); dot.className = 'dot'; ring.appendChild(dot);
    const slotBtns = [];
    const place = (i, R) => { const a = -Math.PI / 2 + i / NSLOTS * Math.PI * 2; return [Math.cos(a) * R, Math.sin(a) * R]; };
    for (let i = 0; i < NSLOTS; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sl'; const [x, y] = place(i, 175);
      b.style.left = 220 + x + 'px'; b.style.top = 220 + y + 'px'; b.dataset.i = i;
      b.addEventListener('click', ev => { ev.stopPropagation(); if (W.classList.contains('tap')) pickSlot(i); });
      ring.appendChild(b); slotBtns.push(b);
    }
    function paintWheel() {
      slotBtns.forEach((b, i) => {
        const e = byId(slots[i]);
        b.className = 'sl' + (e ? '' : ' empty') + (i === hot ? ' hot' : '');
        b.innerHTML = e ? e.ico + '<small>' + e.n + '</small>' : '＋';
      });
      const e = hot >= 0 ? byId(slots[hot]) : null;
      midB.textContent = e ? e.n : '';
      midS.textContent = e ? '' : (hot >= 0 ? 'Slot vacío (edítalo en EMOTES)' : 'Elegí un emote');
      dot.style.left = 220 + px + 'px'; dot.style.top = 220 + py + 'px';
    }
    let open = false, hot = -1, px = 0, py = 0, tapMode = false;
    function setHot() {
      const r = Math.hypot(px, py);
      if (r < 46) { hot = -1; return; }
      let a = Math.atan2(py, px) + Math.PI / 2; if (a < 0) a += Math.PI * 2;
      hot = Math.round(a / (Math.PI * 2) * NSLOTS) % NSLOTS;
    }
    function canOpen() {
      const p = G.player; return G.state === 'play' && !G.paused && !G.over && !G.viewer && !G.panelOpen && !G.cine && p && p.alive && !roomInputBlocked() && (!p.action || p.action.isEmote);
    }
    function openWheel(tap) {
      if (open || !canOpen()) return;
      open = true; tapMode = !!tap; hot = -1; px = py = 0; window.__emoteWheelOpen = true;
      W.classList.add('on'); W.classList.toggle('tap', tapMode); W.setAttribute('aria-hidden', 'false');
      hint.textContent = tapMode ? 'Tocá un emote · tocá afuera para cerrar' : 'Mové el mouse hacia un emote y soltá ' + bindKeyLabel(BINDS.emote || 'KeyT') + ' · Esc cancela';
      paintWheel(); sfx('select', null, .5);
    }
    function closeWheel(run) {
      if (!open) return; open = false; window.__emoteWheelOpen = false; W.classList.remove('on', 'tap'); W.setAttribute('aria-hidden', 'true');
      if (run && hot >= 0 && slots[hot] != null && G.player) play(G.player, slots[hot]);
    }
    function pickSlot(i) { hot = i; closeWheel(true); }
    W.addEventListener('click', () => { if (open && tapMode) closeWheel(false); });
    addEventListener('mousemove', e => {
      if (!open || tapMode) return;
      if (document.pointerLockElement) { px += e.movementX * .9; py += e.movementY * .9; }
      else { const r = ring.getBoundingClientRect(); px = e.clientX - (r.left + r.width / 2); py = e.clientY - (r.top + r.height / 2); }
      const m = Math.hypot(px, py), cap = 215; if (m > cap) { px *= cap / m; py *= cap / m; }
      const old = hot; setHot(); paintWheel(); if (old !== hot && hot >= 0) sfx('select', null, .25);
    });
    addEventListener('keydown', e => {
      if (e.code === (BINDS.emote || 'KeyT') && !e.repeat) {
        const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
        if (EDIT.on) return; if (canOpen()) { e.preventDefault(); openWheel(false); }
      } else if (open && e.code === 'Escape') { closeWheel(false); }
    });
    addEventListener('keyup', e => { if (open && !tapMode && e.code === (BINDS.emote || 'KeyT')) closeWheel(true); });
    addEventListener('blur', () => { if (open && !tapMode) closeWheel(false); });
    // si se pausa o termina la partida con la rueda abierta, se cierra
    setInterval(() => { if (open && !canOpen()) closeWheel(false); }, 250);

    // botón para celular
    const tb = document.createElement('button'); tb.id = 'emtouch'; tb.type = 'button'; tb.textContent = '😀'; tb.setAttribute('aria-label', 'Emotes');
    tb.addEventListener('click', () => { if (open) closeWheel(false); else openWheel(true); });
    document.body.appendChild(tb);
    setInterval(() => { tb.classList.toggle('show', !!(touchActive && touchActive()) && G.state === 'play' && !G.paused && !G.over); }, 700);

    // ---------------------------------------------------------------- editor de slots
    const EDIT = { on: false, sel: 0 };
    const ED = document.createElement('div'); ED.id = 'emed'; ED.setAttribute('role', 'dialog'); ED.setAttribute('aria-modal', 'true');
    ED.innerHTML = '<div class="box"><div><h2>😀 EMOTES</h2><div class="sub" id="emsub"></div><div class="rg" id="emrg"></div><div class="sub" id="emhelp" style="text-align:center"></div></div><div class="grid" id="emgrid"></div><div class="foot"><span class="sub" id="emprog"></span><span><button class="b" id="emreset" type="button">Restablecer</button> <button class="b go" id="emclose" type="button">Listo</button></span></div></div>';
    document.body.appendChild(ED);
    const rg = ED.querySelector('#emrg'), grid = ED.querySelector('#emgrid');
    function refreshEditor() {
      if (!EDIT.on) return;
      ED.querySelector('#emsub').textContent = 'Los emotes se desbloquean con kills en salas públicas contra otros jugadores (no cuentan los bots ni las salas privadas). Mantené ' + bindKeyLabel(BINDS.emote || 'KeyT') + ' en partida para abrir la rueda.';
      ED.querySelector('#emhelp').textContent = 'Elegí un slot y tocá el emote que quieras ponerle.';
      rg.innerHTML = '';
      for (let i = 0; i < NSLOTS; i++) {
        const b = document.createElement('button'); b.type = 'button'; const e = byId(slots[i]); const [x, y] = place(i, 118);
        b.className = 'sl' + (i === EDIT.sel ? ' sel' : '') + (e ? '' : ' empty'); b.style.left = 150 + x + 'px'; b.style.top = 150 + y + 'px'; b.textContent = e ? e.ico : '＋'; b.title = e ? e.n : 'Slot vacío';
        b.addEventListener('click', () => { EDIT.sel = i; refreshEditor(); }); rg.appendChild(b);
      }
      const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'b'; clr.textContent = 'Vaciar'; clr.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:6px 10px;font-size:12px';
      clr.addEventListener('click', () => { slots[EDIT.sel] = null; saveSlots(); refreshEditor(); }); rg.appendChild(clr);
      grid.innerHTML = '';
      for (const e of EM) {
        const c = document.createElement('button'); c.type = 'button'; const ok = unlocked(e);
        c.className = 'card' + (ok ? '' : ' lock') + (slots.includes(e.id) ? ' used' : '');
        c.innerHTML = '<span class="ic">' + (ok ? e.ico : '🔒') + '</span><b>' + e.n + '</b><small>' + (ok ? (slots.includes(e.id) ? 'En la rueda' : 'Desbloqueado') : e.k + ' kills públicas') + '</small>';
        c.addEventListener('click', () => {
          if (!ok) { ED.querySelector('#emhelp').textContent = '🔒 Te faltan ' + (e.k - kills) + ' kills públicas para «' + e.n + '».'; return; }
          const old = slots.indexOf(e.id); if (old >= 0) slots[old] = slots[EDIT.sel];   // si ya estaba en otro slot, se intercambian
          slots[EDIT.sel] = e.id; saveSlots(); refreshEditor();
        });
        grid.appendChild(c);
      }
      const next = EM.filter(e => e.k > kills).sort((a, b) => a.k - b.k)[0];
      ED.querySelector('#emprog').textContent = 'Kills públicas: ' + kills + (next ? ' · próximo: «' + next.n + '» a las ' + next.k : ' · ¡tenés todos los emotes!');
    }
    function openEditor() { EDIT.on = true; EDIT.sel = Math.max(0, slots.indexOf(null)); ED.classList.add('on'); refreshEditor(); ED.querySelector('#emclose').focus(); }
    function closeEditor() { EDIT.on = false; ED.classList.remove('on'); }
    ED.querySelector('#emclose').addEventListener('click', closeEditor);
    ED.addEventListener('click', e => { if (e.target === ED) closeEditor(); });
    ED.querySelector('#emreset').addEventListener('click', () => { slots = defaultSlots(); saveSlots(); refreshEditor(); });
    addEventListener('keydown', e => { if (EDIT.on && e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeEditor(); } }, true);

    // botones en el menú principal y en la pausa
    function inject() {
      const mk = cls => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = '😀 EMOTES'; b.addEventListener('click', ev => { ev.stopPropagation(); openEditor(); }); return b; };
      const set = document.getElementById('setbtn');
      if (set && !document.getElementById('emmenu')) { const b = mk(set.className || ''); b.id = 'emmenu'; set.parentNode.insertBefore(b, set); }
      const tm = document.getElementById('tomenu');
      if (tm && !document.getElementById('empause')) { const b = mk('big alt'); b.id = 'empause'; b.textContent = '😀 Emotes'; tm.parentNode.insertBefore(b, tm); }
    }
    inject(); setTimeout(inject, 600);

    window.CF_EMOTES = { play: (f, i, net) => play(f, i, !!net), onPublicKill, open: openEditor, get kills() { return kills; }, list: () => EM.map(e => ({ id: e.id, n: e.n, k: e.k })) };
  }
});
