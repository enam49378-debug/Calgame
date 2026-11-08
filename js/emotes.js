/* ===== SISTEMA DE EMOTES =====
   - Mantener la tecla de emotes (por defecto B, se cambia en Opciones > Controles) abre la RUEDA de 12 slots; mover el mouse hacia un slot y soltar la tecla lo ejecuta.
     También hay un botón 😀 arriba (junto a Panel y Guía) que abre la rueda para tocar el emote (sirve en celular).
   - Cada slot muestra EL MODELO DEL JUGADOR haciendo ese emote (vista 3D en vivo).
   - CLIC DERECHO sobre un slot: se abre la lista de emotes (la rueda NO se cierra); tocar uno de la lista lo pone en ese slot.
   - Los emotes se desbloquean con KILLS como en TSB. Solo cuentan las kills de SALAS PÚBLICAS contra otros jugadores:
     no cuentan las salas privadas, jugar solo, ni los bots / dummies (game.js solo llama a onPublicKill en ese caso).
   - Los emotes solo existen dentro de la partida (no hay botones en el menú ni en la pausa).
   - Los demás jugadores ven tu emote (se manda como una acción de red {k:'e', i}).
   - Hay dos tipos: emotes de poses hechas a mano (abajo) y emotes de animación (js/emote_list.js + js/emote_clips.js, generados con
     tools/bbmodel_a_emotes.py desde Emotes.bbmodel; los clips se cargan solo cuando hacen falta).
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const KEY_KILLS = 'bsb_emote_kills', KEY_SLOTS = 'bsb_emote_slots_v1', NSLOTS = 12;
    const rd = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

    // ---------------------------------------------------------------- catálogo de emotes
    // seq: [[segundo, pose], ...] (poses con los mismos canales que POSE: ix cuerpo, tx torso, hx/hy cabeza, alx/arx brazos, llx/lrx piernas, by altura...)
    const kf = (dur, step, fn) => { const out = []; for (let t = step, i = 0; t < dur; t += step, i++) out.push([+t.toFixed(3), fn(i)]); return out; };
    const REST = { ix: .04, tx: .08, ty: .3, hy: -.25, alx: -1.05, alz: -.35, aly: .2, arx: -.75, arz: .3, ary: -.2, llx: -.3, llz: .08, lrx: .25, lrz: -.1, by: -.6 };
    const EM = [
      { id: 0, n: 'Saludo', ico: '👋', k: 0, dur: 2.6, seq: [[.25, { hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: -.5, llx: -.1, lrx: .1, by: -.6 }], ...kf(2.3, .28, i => ({ hy: .25, alx: -.3, alz: .3, arx: -2.55, arz: i % 2 ? -.95 : -.15, llx: -.1, lrx: .1, by: -.6 })), [2.6, REST]] },
      { id: 1, n: 'Baile', ico: '🕺', k: 0, dur: 3.4, seq: kf(3.4, .4, i => { const s = i % 2 ? 1 : -1; return { ix: .08, tx: .1 * s, ty: .55 * s, hy: -.3 * s, hx: .1, by: i % 2 ? -3 : -1.2, alx: s > 0 ? -2.7 : -.5, alz: .4, arx: s > 0 ? -.5 : -2.7, arz: -.4, llx: s > 0 ? -.5 : .1, lrx: s > 0 ? .1 : -.5, llz: .2 * s, lrz: .2 * s }; }).concat([[3.4, REST]]) },
      { id: 2, n: 'Risa', ico: '😆', k: 0, dur: 2.4, seq: kf(2.2, .14, i => ({ ix: -.18, tx: -.28, hx: -.55, by: i % 2 ? -2.4 : -1, alx: -1.0, alz: -.5, arx: -1.0, arz: .5, llx: -.15, lrx: .15 })).concat([[2.4, REST]]) },
      { id: 3, n: 'Flexión de poder', ico: '💪', k: 3, dur: 2.8, seq: [[.35, { by: -2, tx: -.15, alx: -.9, alz: 1.1, arx: -.9, arz: -1.1, llz: .3, lrz: -.3 }], ...kf(2.5, .3, i => ({ by: i % 2 ? -3 : -2, tx: -.15, ix: .05, alx: -.9, alz: 1.1, arx: -.9, arz: -1.1, llz: .3, lrz: -.3, hx: .05 })), [2.8, REST]] },
      { id: 4, n: 'Reverencia', ico: '🙇', k: 5, dur: 2.4, seq: [[.55, { ix: 1.15, tx: .5, hx: .25, by: -3, alx: .3, alz: .2, arx: .3, arz: -.2, llx: -.2, lrx: -.2 }], [1.7, { ix: 1.15, tx: .5, hx: .25, by: -3, alx: .3, alz: .2, arx: .3, arz: -.2, llx: -.2, lrx: -.2 }], [2.4, REST]] },
      { id: 5, n: 'Meditar', ico: '🧘', k: 8, dur: 3.8, seq: [[.7, { by: -9, ix: .1, tx: .05, hx: .05, alx: -.9, alz: .95, arx: -.9, arz: -.95, llx: -1.5, lrx: -1.5, llz: .55, lrz: -.55 }], ...kf(3.4, .8, i => ({ by: i % 2 ? -9.6 : -9, ix: .1, tx: .05, hx: .05, alx: -.9, alz: .95, arx: -.9, arz: -.95, llx: -1.5, lrx: -1.5, llz: .55, lrz: -.55 })), [3.8, REST]], fx: 'aura' },
      { id: 6, n: 'Karate', ico: '🥋', k: 12, dur: 3.2, seq: kf(3.0, .3, i => ({ by: -4, ix: .1, tx: .15, ty: i % 2 ? .5 : -.5, hy: i % 2 ? -.4 : .4, alx: i % 2 ? -1.57 : -.9, alz: .1, arx: i % 2 ? -.9 : -1.57, arz: -.1, llx: -.7, lrx: .5, llz: .35, lrz: -.35 })).concat([[3.2, REST]]) },
      { id: 7, n: 'Sentadillas', ico: '🏋️', k: 16, dur: 3.2, seq: kf(3.0, .4, i => i % 2 ? { by: -1, llx: -.2, lrx: -.2, alx: -1.5, arx: -1.5, alz: .1, arz: -.1 } : { by: -8, tx: .35, ix: .1, hx: -.3, llx: -1.5, lrx: -1.5, llz: .3, lrz: -.3, alx: -1.55, arx: -1.55, alz: .1, arz: -.1 }).concat([[3.2, REST]]) },
      { id: 8, n: 'Breakdance', ico: '🌀', k: 22, dur: 3.4, spin: 6, seq: kf(3.2, .3, i => ({ by: -9, ix: .9, tx: .3, hx: -.5, llx: i % 2 ? -1.4 : 1.0, lrx: i % 2 ? 1.0 : -1.4, llz: .8, lrz: -.8, alx: -.4, alz: 1.2, arx: -.4, arz: -1.2 })).concat([[3.4, REST]]) },
      { id: 9, n: 'Facepalm', ico: '🤦', k: 28, dur: 2.6, seq: [[.35, { ix: .08, tx: .1, hx: .55, by: -1, arx: -2.5, arz: -.1, alx: -.5, alz: .2, llx: -.1, lrx: .1 }], ...kf(2.2, .26, i => ({ ix: .08, tx: .1, hx: .55, hy: i % 2 ? .35 : -.35, by: -1, arx: -2.5, arz: -.1, alx: -.5, alz: .2, llx: -.1, lrx: .1 })), [2.6, REST]] },
      { id: 10, n: 'Victoria', ico: '✌️', k: 35, dur: 3.0, seq: kf(2.8, .3, i => ({ by: i % 2 ? -.5 : -3, hx: -.2, alx: -2.95, alz: .5, arx: -2.95, arz: -.5, llx: i % 2 ? -.1 : -.5, lrx: i % 2 ? -.1 : -.5 })).concat([[3.0, REST]]), fx: 'confetti' },
      { id: 11, n: 'Moonwalk', ico: '🎤', k: 45, dur: 3.0, moon: true, seq: kf(2.8, .22, i => ({ ix: -.05, tx: -.1, by: -1, alx: i % 2 ? -.6 : -1.2, arx: i % 2 ? -1.2 : -.6, alz: .3, arz: -.3, llx: i % 2 ? .35 : -.35, lrx: i % 2 ? -.35 : .35 })).concat([[3.0, REST]]) },
      { id: 12, n: 'Llorar', ico: '😭', k: 60, dur: 3.0, seq: [[.3, { ix: .15, tx: .3, hx: .8, by: -2, alx: -2.35, alz: .35, arx: -2.35, arz: -.35, llx: -.2, lrx: .1 }], ...kf(2.7, .12, i => ({ ix: .15, tx: i % 2 ? .36 : .26, hx: .8, by: i % 2 ? -2.5 : -1.7, alx: -2.35, alz: .35, arx: -2.35, arz: -.35, llx: -.2, lrx: .1 })), [3.0, REST]] },
      { id: 13, n: 'Pose final', ico: '🔥', k: 80, dur: 3.4, seq: [[.3, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [3.0, { ix: -.12, tx: -.25, hx: -.3, ty: .5, hy: -.5, by: -2.4, alx: -2.9, alz: .1, arx: .4, arz: -.9, llx: -.4, lrx: .3, llz: .3, lrz: -.1 }], [3.4, REST]], fx: 'fire' },
      { id: 14, n: 'Leyenda', ico: '👑', k: 120, dur: 3.6, seq: [[.4, { ix: -.05, tx: -.1, hx: -.28, by: -1, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.1, lrx: .15 }], [3.2, { ix: -.05, tx: -.1, hx: -.28, by: -1.4, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.1, lrx: .15 }], [3.6, REST]], fx: 'gold' },
    ];
    // emotes del JEFE (Kraken del abismo): solo se consiguen derrotándolo (ver grantBoss)
    EM.push(
      { id: 200, n: 'Furia del Kraken', ico: '🦑', k: 1e9, boss: 'Kraken', dur: 3.4, fx: 'abyss', seq: [[.3, { ix: -.15, tx: -.3, hx: -.5, alx: -2.9, alz: .9, arx: -2.9, arz: -.9, llx: -.5, lrx: .3, by: -3 }], ...kf(3.0, .18, i => ({ ix: -.15, tx: -.3, hx: -.5 + (i % 2) * .12, alx: -2.9, alz: .9 + (i % 2) * .15, arx: -2.9, arz: -.9 - (i % 2) * .15, llx: -.5, lrx: .3, by: -3 - (i % 2) * .6 })), [3.4, REST]] },
      { id: 201, n: 'Tentáculos', ico: '🐙', k: 1e9, boss: 'Kraken', dur: 3.6, fx: 'abyss', seq: kf(3.4, .22, i => ({ ix: .05, tx: .1 * Math.sin(i), ty: .5 * Math.sin(i * 1.3), hy: -.3 * Math.sin(i), by: -1.5, alx: -1.6 + Math.sin(i * 1.1) * 1.1, alz: .5 + Math.cos(i) * .4, arx: -1.6 - Math.sin(i * 1.1) * 1.1, arz: -.5 - Math.cos(i) * .4, llx: Math.sin(i) * .25, lrx: -Math.sin(i) * .25 })).concat([[3.6, REST]]) },
      { id: 202, n: 'Rey del abismo', ico: '🔱', k: 1e9, boss: 'Kraken', dur: 3.8, fx: 'abyss', seq: [[.5, { ix: -.08, tx: -.15, hx: -.3, by: -1, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.2, lrx: .25 }], [3.4, { ix: -.08, tx: -.15, hx: -.3, by: -1.4, alx: -1.4, alz: -.8, arx: -1.4, arz: .8, llx: -.2, lrx: .25 }], [3.8, REST]] },
    );
    // emotes de animación (Blockbench): nombre, icono, kills y duración salen de js/emote_list.js
    for (const e of (window.CF_EMOTE_LIST || [])) EM.push({ id: e.id, n: e.n, ico: e.ico, k: e.k, clip: e.clip, len: e.len, loop: e.loop, dur: e.loop ? e.len * Math.max(1, Math.ceil(6 / e.len)) : e.len + .25 });
    delete window.CF_EMOTE_LIST;
    const byId = id => EM.find(e => e.id === id);

    // los clips (1.4 MB) se bajan solo cuando se abre la rueda o se usa un emote de animación
    let clipsState = 0; const clipsWait = [];
    function loadClips(cb) {
      if (window.CF_EMOTE_CLIPS) { cb && cb(); return; }
      if (cb) clipsWait.push(cb);
      if (clipsState) return; clipsState = 1;
      const s = document.createElement('script'); s.src = 'js/emote_clips.js?v=1';
      s.onload = () => { clipsState = 2; while (clipsWait.length) { try { clipsWait.shift()(); } catch (e) { console.warn(e); } } };
      s.onerror = () => { clipsState = 0; clipsWait.length = 0; };
      document.head.appendChild(s);
    }
    const tracks = {};
    function clipTrack(name) {
      const clip = window.CF_EMOTE_CLIPS && window.CF_EMOTE_CLIPS[name]; if (!clip) return null;
      if (!tracks[name]) {
        const t = clip.samples.map(r => ({ t: r[0], p: Object.fromEntries(clip.channels.map((k, i) => [k, r[i + 1]])) }));
        t.cinematic = true; t.contacts = []; t.loopLen = clip.loop ? clip.length : 0; tracks[name] = t;
      }
      return tracks[name];
    }

    // ---------------------------------------------------------------- estado (kills públicas y slots)
    let kills = Math.max(0, rd(KEY_KILLS, 0) | 0), slots = rd(KEY_SLOTS, null);
    let extra = rd('bsb_emote_extra', []); if (!Array.isArray(extra)) extra = [];
    const unlocked = e => !!e && (e.boss ? extra.includes(e.id) : kills >= e.k);
    const defaultSlots = () => { const s = new Array(NSLOTS).fill(null); EM.filter(unlocked).slice(0, NSLOTS).forEach((e, i) => { s[i] = e.id; }); return s; };
    if (!Array.isArray(slots) || slots.length !== NSLOTS) slots = defaultSlots();
    slots = slots.map(v => (typeof v === 'number' && byId(v) ? v : null));
    const saveSlots = () => wr(KEY_SLOTS, slots);
    const emoteKey = () => (BINDS && BINDS.emote) || 'KeyB';

    // ---------------------------------------------------------------- reproducir un emote
    function play(f, id, fromNet) {
      const e = byId(id); if (!e || !f || !f.alive || f.ragdoll > 0) return false;
      if (!fromNet && !unlocked(e)) { popText(chestOf(f), e.boss ? '🔒 Derrota al jefe ' + e.boss : '🔒 ' + e.k + ' kills públicas', '#ff8a80', 18); return false; }
      if (f.action && !f.action.isEmote) return false;            // no corta un ataque
      if (e.clip && !window.CF_EMOTE_CLIPS) { loadClips(() => play(f, id, fromNet)); return true; }
      startAction(f, {
        name: 'emote', emote: id, isEmote: true, dur: e.dur, speedMul: 0, spin: e.spin || 0, eyes: false,
        anim: e.seq || undefined, emoteClip: e.clip || undefined,
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
            else if (fx === 'abyss') { burst(P, 7, '#39e6ff', 5, .12, .8, -.2); burst(P, 3, '#ff4fd8', 4, .1, .7, -.2); ringAt(new V3(f.pos.x, f.pos.y + .1, f.pos.z), '#39e6ff', 2.2, .8); }
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
    // lo llama animate() de game.js mientras dura un emote de animación: pone la pose del clip
    function playClip(f, a, dt) {
      const clip = window.CF_EMOTE_CLIPS && window.CF_EMOTE_CLIPS[a.emoteClip], tr = clipTrack(a.emoteClip); if (!clip || !tr) return false;
      if (!a.from) a.from = Object.assign({}, f.anim.x);
      const time = clip.loop ? a.t % clip.length : Math.min(clip.length, a.t);
      f.anim.bbR6 = true; f.anim.play(tr, time, dt, true);
      const u = clamp(a.t / .25, 0, 1), w = u * u * (3 - 2 * u);               // entrada suave desde la pose anterior
      if (w < 1) for (const j in f.anim.x) if (typeof a.from[j] === 'number') f.anim.x[j] = a.from[j] + (f.anim.x[j] - a.from[j]) * w;
      f.anim.apply(); return true;
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
      paintWheel();
    }

    // ---------------------------------------------------------------- interfaz (estilos propios, sin tocar style.css)
    const css = document.createElement('style');
    css.textContent = `
#emw{position:fixed;inset:0;z-index:80;display:none;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(8,10,20,.15),rgba(8,10,20,.62));font-family:var(--body,system-ui,sans-serif);user-select:none;-webkit-user-select:none}
#emw.on{display:flex}
#emw .ring{position:relative;width:440px;height:440px}
#emw .sl{position:absolute;width:88px;height:88px;margin:-44px 0 0 -44px;border-radius:50%;border:2px solid rgba(255,255,255,.28);background:radial-gradient(circle at 50% 35%,rgba(70,82,130,.9),rgba(14,18,36,.92));color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:30px;line-height:1;transition:transform .08s,border-color .08s,box-shadow .08s;cursor:pointer;padding:0;overflow:visible}
#emw .sl .lb{position:absolute;bottom:3px;left:50%;transform:translateX(-50%);z-index:3;font-size:10px;font-weight:700;max-width:84px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 3px #000,0 0 4px #000;pointer-events:none}
#emw .sl.empty{opacity:.45;font-size:22px}
#emw .sl.hot{transform:scale(1.18);border-color:#ffd54f;box-shadow:0 0 22px rgba(255,213,79,.6)}
#emw .sl.sel{border-color:#4fd0c9;box-shadow:0 0 18px rgba(79,208,201,.7)}
#emw canvas.pv{position:absolute;left:0;top:0;width:440px;height:440px;z-index:2;pointer-events:none}
#emw .mid{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:150px;text-align:center;color:#fff;pointer-events:none;z-index:4}
#emw .mid b{display:block;font-size:17px;letter-spacing:.04em;text-shadow:0 1px 4px #000}
#emw .mid span{font-size:12px;opacity:.85;text-shadow:0 1px 3px #000}
#emw .hint{position:absolute;bottom:22px;left:0;right:0;text-align:center;color:#fff;opacity:.8;font-size:13px;text-shadow:0 1px 3px #000}
#emw .dot{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#ffd54f;box-shadow:0 0 10px #ffd54f;pointer-events:none;z-index:5}
#emlist{position:absolute;left:calc(50% + 250px);top:50%;transform:translateY(-50%);width:310px;max-height:74vh;overflow:auto;background:#12162a;border:1px solid rgba(255,255,255,.2);border-radius:14px;padding:10px;color:#fff;display:none;z-index:6;box-shadow:0 10px 40px rgba(0,0,0,.6)}
#emlist.on{display:block}
#emlist h4{margin:0 0 8px;font-size:13px;letter-spacing:.05em;display:flex;justify-content:space-between;align-items:center;gap:8px}
#emlist .gr{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
#emlist button{border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#1b2140;color:#fff;padding:7px 6px;text-align:left;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px}
#emlist button i{font-style:normal;font-size:20px}
#emlist button small{display:block;opacity:.7;font-size:10px}
#emlist button.lock{opacity:.45;cursor:not-allowed}
#emlist button.cur{outline:2px solid #4fd0c9}
#emlist button.x{background:#3a2030;justify-content:center}
@media(max-width:900px){#emlist{left:50%;top:auto;bottom:8px;transform:translateX(-50%);width:min(94vw,420px);max-height:44vh}}
#emtouch{position:fixed;right:14px;bottom:210px;z-index:60;width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.4);background:rgba(18,22,40,.7);font-size:26px;display:none;align-items:center;justify-content:center;padding:0;color:#fff}
#emtouch.show{display:flex}`;
    document.head.appendChild(css);

    const W = document.createElement('div'); W.id = 'emw'; W.setAttribute('aria-hidden', 'true');
    W.innerHTML = '<div class="ring"><div class="mid"><b></b><span></span></div></div><div class="hint"></div><div id="emlist"></div>';
    document.body.appendChild(W);
    const ring = W.querySelector('.ring'), midB = W.querySelector('.mid b'), midS = W.querySelector('.mid span'), hint = W.querySelector('.hint'), list = W.querySelector('#emlist');
    const dot = document.createElement('div'); dot.className = 'dot'; ring.appendChild(dot);
    const slotBtns = [];
    const place = (i, R) => { const a = -Math.PI / 2 + i / NSLOTS * Math.PI * 2; return [Math.cos(a) * R, Math.sin(a) * R]; };
    let open = false, hot = -1, px = 0, py = 0, tapMode = false, selSlot = -1;
    for (let i = 0; i < NSLOTS; i++) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sl'; const [x, y] = place(i, 178);
      b.style.left = 220 + x + 'px'; b.style.top = 220 + y + 'px'; b.dataset.i = i;
      b.addEventListener('click', ev => { ev.stopPropagation(); if (tapMode) pickSlot(i); });
      b.addEventListener('contextmenu', ev => { ev.preventDefault(); ev.stopPropagation(); openList(i); });
      ring.appendChild(b); slotBtns.push(b);
    }
    W.addEventListener('contextmenu', ev => ev.preventDefault());

    // ---- vista 3D de cada slot: el modelo del jugador haciendo el emote (un segundo renderer solo para esto)
    const PV = { ok: null, rr: null, scene: null, cam: null, models: [], anims: [], cur: [], raf: 0, t0: 0, last: 0 };
    function pvInit() {
      if (PV.ok != null) return PV.ok;
      const p = G.player; if (!p || !p.model || !p.model.tex || !p.model.tex.image) return false;
      try {
        const rr = new THREE.WebGLRenderer({ alpha: true, antialias: true }); rr.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); rr.setSize(440, 440, false);
        rr.setScissorTest(true); rr.setClearColor(0x000000, 0); rr.domElement.className = 'pv'; ring.insertBefore(rr.domElement, ring.firstChild.nextSibling || null);
        const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.15)); const dl = new THREE.DirectionalLight(0xffffff, .85); dl.position.set(2, 3, 4); sc.add(dl);
        const img = p.model.tex.image, cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; cv.getContext('2d').drawImage(img, 0, 0);
        for (let i = 0; i < NSLOTS; i++) { const m = buildModel(cv, !!(p.ch && p.ch.slim), sc); m.root.rotation.y = .45; m.root.visible = false; PV.models.push(m); PV.anims.push(new Animator(m)); PV.cur.push(null); }
        PV.cam = new THREE.PerspectiveCamera(30, 1, .1, 40); PV.cam.position.set(0, 1.0, 5.4); PV.cam.lookAt(0, .92, 0);
        PV.rr = rr; PV.scene = sc; PV.ok = true;
      } catch (e) { console.warn('emotes: sin vista 3D', e); PV.ok = false; }
      return PV.ok;
    }
    function pvFrame(now) {
      PV.raf = 0; if (!open || !PV.ok) return;
      const dt = Math.min(.05, Math.max(0, (now - (PV.last || now)) / 1000)); PV.last = now; const T = (now - PV.t0) / 1000;
      const rr = PV.rr; rr.setClearColor(0x000000, 0);
      for (let i = 0; i < NSLOTS; i++) {
        const e = byId(slots[i]), m = PV.models[i], an = PV.anims[i]; for (const q of PV.models) q.root.visible = false;
        const [x, y] = place(i, 178), cx = 220 + x, cy = 220 + y, S = 92;
        rr.setViewport(cx - S / 2, 440 - (cy + S / 2), S, S); rr.setScissor(cx - S / 2, 440 - (cy + S / 2), S, S); rr.clear();
        if (!e) continue;
        const tr = e.clip ? clipTrack(e.clip) : null; if (e.clip && !tr) continue;
        if (PV.cur[i] !== e.id) { PV.cur[i] = e.id; an.reset(); if (!e.clip) PV.cur['t' + i] = buildTrack(e.seq, Object.assign({}, REST), 0); }
        const len = e.clip ? e.len : e.dur, tm = (T + i * .13) % (len + .4), t = Math.min(tm, len - 1e-3);
        if (e.clip) { an.bbR6 = true; an.play(tr, e.loop ? tm % len : t, dt, true); } else { an.bbR6 = false; an.play(PV.cur['t' + i], t, dt, false); }
        m.root.visible = true; rr.render(PV.scene, PV.cam);
      }
      PV.raf = requestAnimationFrame(pvFrame);
    }
    function pvStart() { if (PV.ok && !PV.raf) { PV.t0 = performance.now(); PV.last = 0; PV.raf = requestAnimationFrame(pvFrame); } }

    function paintWheel() {
      slotBtns.forEach((b, i) => {
        const e = byId(slots[i]);
        b.className = 'sl' + (e ? '' : ' empty') + (i === hot ? ' hot' : '') + (i === selSlot ? ' sel' : '');
        b.innerHTML = e ? (PV.ok ? '' : e.ico) + '<span class="lb">' + e.n + '</span>' : '＋';
        b.setAttribute('aria-label', e ? e.n : 'Slot vacío');
      });
      const e = hot >= 0 ? byId(slots[hot]) : null;
      midB.textContent = e ? e.n : '';
      midS.textContent = e ? 'Clic derecho: cambiar' : (hot >= 0 ? 'Vacío · clic derecho: elegir' : 'Elegí un emote');
      dot.style.left = 220 + px + 'px'; dot.style.top = 220 + py + 'px'; dot.style.display = tapMode ? 'none' : '';
    }
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
      open = true; tapMode = !!tap; hot = -1; selSlot = -1; px = py = 0; window.__emoteWheelOpen = true; closeList();
      W.classList.add('on'); W.setAttribute('aria-hidden', 'false');
      loadClips(() => { if (open) { pvInit(); paintWheel(); pvStart(); } });
      pvInit(); hintText(); paintWheel(); pvStart(); sfx('select', null, .5);
    }
    const hintText = () => { hint.textContent = tapMode ? 'Tocá un emote · clic derecho para cambiarlo · Esc cierra' : 'Mové el mouse hacia un emote y soltá ' + bindKeyLabel(emoteKey()) + ' · clic derecho: cambiar emote · Esc cancela'; };
    function closeWheel(run) {
      if (!open) return; open = false; window.__emoteWheelOpen = false; closeList(); W.classList.remove('on'); W.setAttribute('aria-hidden', 'true');
      const slot = hot; hot = -1; selSlot = -1;
      if (run && slot >= 0 && slots[slot] != null && G.player) play(G.player, slots[slot]);
    }
    function pickSlot(i) { hot = i; closeWheel(true); }

    // ---- clic derecho en un slot: lista de emotes; tocar uno lo pone en ese slot (la rueda sigue abierta)
    function openList(i) {
      if (!open || i < 0) return;
      selSlot = i; tapMode = true; hintText();
      if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) { } }   // aparece el cursor para elegir
      const cur = slots[i], sorted = EM.slice().sort((a, b) => (a.boss ? 1e8 : a.k) - (b.boss ? 1e8 : b.k) || a.id - b.id);
      list.innerHTML = '<h4><span>Slot ' + (i + 1) + ': elegí un emote</span><span style="opacity:.7">' + kills + ' kills</span></h4><div class="gr"></div>';
      const gr = list.querySelector('.gr');
      const mk = (e) => {
        const ok = unlocked(e), b = document.createElement('button'); b.type = 'button'; b.className = (ok ? '' : 'lock ') + (e.id === cur ? 'cur' : '');
        b.innerHTML = '<i>' + (ok ? e.ico : '🔒') + '</i><span>' + e.n + '<small>' + (ok ? (slots.includes(e.id) ? 'en la rueda' : 'desbloqueado') : e.boss ? 'jefe: ' + e.boss : e.k + ' kills públicas') + '</small></span>';
        b.addEventListener('click', ev => {
          ev.stopPropagation(); if (!ok) return;
          const old = slots.indexOf(e.id); if (old >= 0 && old !== i) slots[old] = slots[i];     // si ya estaba en otro slot, se intercambian
          slots[i] = e.id; saveSlots(); PV.cur[i] = null; if (old >= 0) PV.cur[old] = null; closeList(); paintWheel();
        });
        return b;
      };
      const clr = document.createElement('button'); clr.type = 'button'; clr.className = 'x'; clr.style.gridColumn = '1/-1'; clr.textContent = 'Dejar vacío';
      clr.addEventListener('click', ev => { ev.stopPropagation(); slots[i] = null; saveSlots(); PV.cur[i] = null; closeList(); paintWheel(); }); gr.appendChild(clr);
      for (const e of sorted) gr.appendChild(mk(e));
      list.classList.add('on'); list.scrollTop = 0; paintWheel();
    }
    function closeList() { selSlot = -1; list.classList.remove('on'); paintWheel(); }
    list.addEventListener('click', ev => ev.stopPropagation());
    W.addEventListener('click', () => { if (!open) return; if (list.classList.contains('on')) closeList(); else if (tapMode) closeWheel(false); });

    addEventListener('mousedown', e => {
      if (!open || e.button !== 2) return;
      e.preventDefault(); if (hot >= 0) openList(hot);          // con el mouse bloqueado: clic derecho sobre el slot marcado
    }, true);
    addEventListener('mousemove', e => {
      if (!open || tapMode) return;
      if (document.pointerLockElement) { px += e.movementX * .9; py += e.movementY * .9; }
      else { const r = ring.getBoundingClientRect(); px = e.clientX - (r.left + r.width / 2); py = e.clientY - (r.top + r.height / 2); }
      const m = Math.hypot(px, py), cap = 215; if (m > cap) { px *= cap / m; py *= cap / m; }
      const old = hot; setHot(); paintWheel(); if (old !== hot && hot >= 0) sfx('select', null, .25);
    });
    addEventListener('keydown', e => {
      if (e.code === emoteKey() && !e.repeat) {
        const t = e.target && e.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
        if (open) { e.preventDefault(); e.stopImmediatePropagation(); closeWheel(false); }
        else if (canOpen()) { e.preventDefault(); openWheel(false); }
      } else if (open && e.code === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (list.classList.contains('on')) closeList(); else closeWheel(false); }
    }, true);
    addEventListener('keyup', e => { if (open && !tapMode && e.code === emoteKey()) closeWheel(true); });
    addEventListener('blur', () => { if (open && !tapMode) closeWheel(false); });
    setInterval(() => { if (open && !canOpen()) closeWheel(false); }, 250);       // si se pausa o termina la partida con la rueda abierta, se cierra

    // ---- botón único arriba (junto a Panel y Guía) + botón flotante para celular
    function injectBtn() {
      const top = document.getElementById('topl'), book = document.getElementById('bookbtn');
      if (!top || document.getElementById('emotebtn')) return;
      const b = document.createElement('button'); b.id = 'emotebtn'; b.type = 'button'; b.className = 'chip'; b.title = 'Emotes'; b.setAttribute('aria-label', 'Emotes');
      b.style.cssText = 'pointer-events:auto;border:0;color:var(--ink);font-family:var(--body);cursor:pointer'; b.innerHTML = '😀 <b id="emotekbd">' + bindKeyLabel(emoteKey()) + '</b>';
      b.addEventListener('click', ev => { ev.stopPropagation(); if (open) closeWheel(false); else { if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (x) { } } openWheel(true); } });
      top.insertBefore(b, book ? book.nextSibling : null);
    }
    injectBtn(); setTimeout(injectBtn, 800);
    setInterval(() => { const k = document.getElementById('emotekbd'); if (k) k.textContent = bindKeyLabel(emoteKey()); }, 1500);
    const tb = document.createElement('button'); tb.id = 'emtouch'; tb.type = 'button'; tb.textContent = '😀'; tb.setAttribute('aria-label', 'Emotes');
    tb.addEventListener('click', () => { if (open) closeWheel(false); else openWheel(true); });
    document.body.appendChild(tb);
    setInterval(() => { tb.classList.toggle('show', !!(touchActive && touchActive()) && G.state === 'play' && !G.paused && !G.over); }, 700);
    setTimeout(() => { if (G.state === 'play') loadClips(); }, 6000);              // ya jugando: se bajan los clips sin molestar

    // premios al derrotar al Kraken (se llama desde js/abismo.js): 1ª vez = Furia, 2ª = Tentáculos, 3ª = Rey del abismo
    function grantBoss() {
      const n = Math.max(0, rd('bsb_boss_kills', 0) | 0), id = [200, 201, 202][n % 3], got = [];
      if (n < 3 && !extra.includes(id)) { extra.push(id); wr('bsb_emote_extra', extra); const free = slots.indexOf(null); if (free >= 0) { slots[free] = id; saveSlots(); } got.push('😀 Emote «' + byId(id).n + '»'); }
      return got;
    }
    window.CF_EMOTES = { grantBoss, play: (f, i, net) => play(f, i, !!net), playClip, onPublicKill, get kills() { return kills; }, list: () => EM.map(e => ({ id: e.id, n: e.n, k: e.k })) };
  }
});
