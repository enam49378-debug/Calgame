/* ===== CONSOLA DEL OWNER (F2) =====
   Panel profesional para el dueño del juego (cuenta owner verificada, o cualquiera que juegue desde localhost). Funciona en TODOS los modos:
   solo, bots, salas privadas y públicas. Tiene botones y una consola con comandos ( /ayuda ).
   Ojo: los eventos del mar y el abismo son locales (los ves tú); en salas con más gente el resto de jugadores tiene sus propios eventos.
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const isOwner = () => !!((SOC && SOC.owner) || /^(localhost|127\.|\[::1\])/.test(location.hostname));
    const EV = { cardumen: 'school', tiburones: 'frenzy', marea: 'glow', kraken: 'squid', calamar: 'squid' };
    const css = document.createElement('style');
    css.textContent = '#ownp{position:fixed;top:60px;right:12px;width:min(380px,94vw);max-height:calc(100vh - 80px);z-index:120;display:none;flex-direction:column;background:rgba(10,14,26,.94);border:1px solid rgba(125,249,255,.35);border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.6);color:#dfe8ff;font:13px system-ui,Arial;backdrop-filter:blur(8px)}#ownp.on{display:flex}'
      + '#ownp header{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}#ownp header b{letter-spacing:.14em;font-size:12px;color:#7df9ff;flex:1}#ownp header small{opacity:.6}#ownp .x{background:none;border:0;color:#fff;font-size:18px;cursor:pointer}'
      + '#ownp nav{display:flex;gap:4px;padding:8px 10px 0}#ownp nav button{flex:1;background:rgba(255,255,255,.06);border:0;color:#cfd8f5;padding:7px 4px;border-radius:8px 8px 0 0;cursor:pointer;font-weight:600;font-size:12px}#ownp nav button.on{background:rgba(125,249,255,.18);color:#fff}'
      + '#ownp .pg{display:none;padding:12px;overflow:auto;gap:8px;flex-wrap:wrap}#ownp .pg.on{display:flex}#ownp h4{width:100%;margin:6px 0 0;font-size:11px;letter-spacing:.12em;color:#8fa2d0;text-transform:uppercase}'
      + '#ownp .b{flex:1 1 calc(50% - 8px);min-width:120px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#fff;padding:8px 10px;border-radius:9px;cursor:pointer;text-align:left;font-size:12.5px}#ownp .b:hover{background:rgba(125,249,255,.2)}#ownp .b.r{border-color:rgba(255,120,150,.5)}'
      + '#ownp .st{width:100%;font-size:12px;opacity:.85;line-height:1.5;background:rgba(255,255,255,.04);padding:8px 10px;border-radius:9px}#ownp .con{width:100%;height:210px;overflow:auto;background:#05070f;border-radius:9px;padding:8px;font:12px ui-monospace,Consolas,monospace;white-space:pre-wrap;color:#a8ffb8}#ownp .con i{color:#8fa2d0;font-style:normal}'
      + '#ownp input{width:100%;background:#0b1020;border:1px solid rgba(125,249,255,.35);border-radius:9px;color:#fff;padding:9px 10px;font:13px ui-monospace,Consolas,monospace;outline:none}#ownbtn{position:fixed;left:10px;bottom:10px;z-index:119;display:none;background:rgba(10,14,26,.85);border:1px solid rgba(125,249,255,.4);color:#7df9ff;border-radius:10px;padding:6px 10px;font:700 12px system-ui,Arial;cursor:pointer}body.has-match #ownbtn.ok{display:block}';
    document.head.appendChild(css);
    const P = document.createElement('div'); P.id = 'ownp';
    P.innerHTML = '<header><b>CONSOLA DEL OWNER</b><small>F2</small><button class="x" type="button">X</button></header><nav><button data-p="ev" class="on">Eventos</button><button data-p="ab">Abismo</button><button data-p="yo">Jugador</button><button data-p="co">Consola</button></nav>'
      + '<div class="pg on" data-p="ev"><div class="st" id="own-st"></div><h4>Lanzar evento</h4><button class="b" data-c="/evento cardumen">Cardumen gigante</button><button class="b" data-c="/evento tiburones">Frenesí de tiburones</button><button class="b" data-c="/evento marea">Marea luminosa</button><button class="b r" data-c="/evento kraken">Calamar gigante (Kraken)</button><h4>Control</h4><button class="b" data-c="/parar todos">⏹ Parar eventos</button><button class="b" data-c="/siguiente 5">Próximo evento en 5 s</button><button class="b" data-c="/barco">Llamar al barco</button><button class="b" data-c="/zarpar">Zarpar ya</button></div>'
      + '<div class="pg" data-p="ab"><div class="st" id="own-ab"></div><h4>Viajar</h4><button class="b" data-c="/tp abismo">Entrar al abismo</button><button class="b" data-c="/tp porton">Al portón enorme</button><button class="b" data-c="/tp muelle">Muelle</button><button class="b" data-c="/tp tablon">Tablón de eventos</button><button class="b" data-c="/tp ranking">Ranking</button><button class="b" data-c="/tp ciudad">Ciudad</button><h4>Abismo</h4><button class="b" data-c="/llave">Darme la llave</button><button class="b" data-c="/abrir">Abrir el portón</button><button class="b" data-c="/limpiar">Eliminar enemigos</button><button class="b r" data-c="/matar kraken">Matar al Kraken</button><button class="b" data-c="/reiniciar">Reiniciar abismo</button></div>'
      + '<div class="pg" data-p="yo"><h4>Jugador</h4><button class="b" data-c="/vida">Curarme</button><button class="b" data-c="/ulti">Ulti al 100 %</button><button class="b" data-c="/dios">Invulnerable (on/off)</button><div class="st">Eres owner: tienes todos los emotes y cosméticos desbloqueados sin hacer nada.</div></div>'
      + '<div class="pg" data-p="co"><div class="con" id="own-log"></div><input id="own-in" placeholder="/ayuda  ·  /evento kraken  ·  /tp abismo" autocomplete="off" spellcheck="false"></div>';
    document.body.appendChild(P);
    const B = document.createElement('button'); B.id = 'ownbtn'; B.type = 'button'; B.textContent = 'OWNER · F2'; document.body.appendChild(B);
    const logEl = P.querySelector('#own-log'), inEl = P.querySelector('#own-in');
    const log = (t, k) => { const d = document.createElement('div'); d.innerHTML = (k === 'in' ? '<i>&gt; </i>' : '') + String(t).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])); logEl.appendChild(d); logEl.scrollTop = 1e9; };
    const fmt = s => { s = Math.max(0, Math.ceil(s)); return (s / 60 | 0) + ':' + String(s % 60).padStart(2, '0'); };
    let god = false;
    function launch(k) {   // el owner puede lanzar cualquier evento aunque el truco "bloquear Kraken" esté activo
      const prev = SEA.noKraken; SEA.noKraken = false; let ok = false; try { ok = triggerSeaEvent(k); } finally { SEA.noKraken = prev; } return ok;
    }
    const me = () => G.player;
    const CMD = {
      ayuda() { return 'Comandos: /evento <cardumen|tiburones|marea|kraken> · /parar [todos] · /siguiente <seg> · /barco · /zarpar · /tp <abismo|porton|muelle|tablon|ranking|ciudad> · /llave · /abrir · /limpiar · /reiniciar · /matar kraken · /vida · /ulti · /dios · /estado'; },
      evento(a) { const k = EV[(a[0] || '').toLowerCase()]; if (!k) return 'Eventos: cardumen, tiburones, marea, kraken'; return launch(k) ? 'Evento «' + SEA_EVENTS[k].n + '» lanzado' : 'Ese evento ya está en curso (o el mar aún no cargó: acércate a la costa)'; },
      parar(a) { const k = EV[(a[0] || '').toLowerCase()]; if (k) { SEA.ev[k] = 0; return 'Evento detenido'; } for (const q in SEA.ev) SEA.ev[q] = 0; return 'Todos los eventos detenidos'; },
      siguiente(a) { SEA.evTimer = Math.max(1, +a[0] || 5); return 'Próximo evento en ' + SEA.evTimer + ' s'; },
      barco() { if (!window.CF_MUELLE) return 'No hay muelle'; if (CF_MUELLE.state !== 'off') return 'El barco ya está en marcha (' + CF_MUELLE.state + ')'; CF_MUELLE.arrive(); return 'Barco llamado'; },
      zarpar() { if (window.CF_MUELLE) CF_MUELLE.skip(1); return 'El barco zarpa enseguida (si hay alguien a bordo)'; },
      tp(a) { const p = me(); if (!p) return ''; const w = (a[0] || '').toLowerCase(), set = (x, z) => { p.pos.set(x, .2, z); p.vel.set(0, 0, 0); return 'Teletransportado'; };
        if (w === 'abismo') { CF_ABISMO.tpStart(p); return 'Dentro del abismo'; } if (w === 'porton' || w === 'portón') { CF_ABISMO.tpDoor(p); return 'Frente al portón'; }
        if (p.abyss) return 'Estás en el abismo: usa /tp abismo o el portón';
        if (w === 'muelle') return set(0, 122); if (w === 'tablon' || w === 'tablón') return set(8.4, 76); if (w === 'ranking') { const s = window.CF_RANK && CF_RANK.spot; return s ? set(s.x, s.z + 5) : 'El ranking aún no existe'; } if (w === 'ciudad') return set(0, 0); return 'Destinos: abismo, porton, muelle, tablon, ranking, ciudad'; },
      llave() { if (!window.CF_ABISMO) return ''; CF_ABISMO.giveKey(me()); return 'Llave entregada'; },
      abrir() { CF_ABISMO.openDoor(); return 'Portón abierto'; },
      limpiar() { CF_ABISMO.clearMobs(); return 'Enemigos eliminados'; },
      reiniciar() { CF_ABISMO.resetRun(); return 'Abismo reiniciado'; },
      matar(a) { if ((a[0] || '') !== 'kraken') return 'Uso: /matar kraken'; if (CF_ABISMO.state !== 'fight') return 'El Kraken no está peleando'; CF_ABISMO.killBoss(); return 'Kraken eliminado'; },
      vida() { const p = me(); if (!p) return ''; p.hp = p.maxHp; return 'Vida al máximo'; },
      ulti() { const p = me(); if (!p) return ''; p.ult = 100; return 'Ulti lista'; },
      dios() { god = !god; return god ? 'Invulnerable: ON' : 'Invulnerable: OFF'; },
      estado() { return 'Modo: ' + (G.mp ? (NETPUB() ? 'sala pública' : 'sala privada') : 'solo/bots') + ' · eventos: ' + Object.keys(SEA.ev).map(k => k + '=' + Math.ceil(SEA.ev[k])).join(' ') + ' · próximo en ' + fmt(SEA.evTimer) + ' · barco: ' + (window.CF_MUELLE ? CF_MUELLE.state : '-'); },
    };
    function run(line) {
      line = String(line || '').trim(); if (!line) return; log(line, 'in'); const parts = line.replace(/^\//, '').split(/\s+/), c = parts.shift().toLowerCase(); const fn = CMD[c];
      try { log(fn ? (fn(parts) || '') : 'Comando desconocido. Escribe /ayuda'); } catch (e) { log('Error: ' + (e && e.message)); }
    }
    P.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) { run(b.dataset.c); refresh(); return; } const n = e.target.closest('nav button'); if (n) { P.querySelectorAll('nav button,.pg').forEach(x => x.classList.toggle('on', x.dataset.p === n.dataset.p)); if (n.dataset.p === 'co') setTimeout(() => inEl.focus(), 30); } if (e.target.closest('.x')) toggle(false); });
    inEl.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { run(inEl.value); inEl.value = ''; } if (e.key === 'Escape') inEl.blur(); });
    inEl.addEventListener('keyup', e => e.stopPropagation());
    function toggle(v) { if (!isOwner()) return; const on = v == null ? !P.classList.contains('on') : v; P.classList.toggle('on', on); window.__uiOpen = on; if (on) { refresh(); if (document.pointerLockElement) document.exitPointerLock(); } }
    function refresh() {
      const st = P.querySelector('#own-st'), ab = P.querySelector('#own-ab'); if (!st) return;
      st.innerHTML = 'Modo: <b>' + (G.mp ? (NETPUB() ? 'sala pública' : 'sala privada') : 'solo / bots') + '</b><br>' + Object.keys(SEA_EVENTS).map(k => SEA_EVENTS[k].ico + ' ' + SEA_EVENTS[k].n + ': <b>' + (SEA.ev[k] > 0 ? fmt(SEA.ev[k]) : '—') + '</b>').join(' · ') + '<br>Próximo evento: <b>' + (SEA.eventsAuto === false ? 'desactivados' : fmt(SEA.evTimer)) + '</b> · Barco: <b>' + (window.CF_MUELLE ? CF_MUELLE.state : '-') + '</b>';
      ab.innerHTML = 'Kraken: <b>' + (window.CF_ABISMO ? CF_ABISMO.state : '-') + '</b> · enemigos: <b>' + (window.CF_ABISMO ? CF_ABISMO.mobCount : 0) + '</b> · llave: <b>' + (window.CF_ABISMO ? CF_ABISMO.key : '-') + '</b> · portón: <b>' + (window.CF_ABISMO ? (CF_ABISMO.door ? 'abierto' : 'cerrado') : '-') + '</b>';
    }
    addEventListener('keydown', e => { if (e.code === 'F2' && !e.repeat && isOwner()) { e.preventDefault(); toggle(); } }, true);
    B.addEventListener('click', () => toggle());
    setInterval(() => { B.classList.toggle('ok', isOwner() && G.state === 'play'); if (P.classList.contains('on')) refresh(); if (god && G.player) { G.player.hp = G.player.maxHp; G.player.iframes = Math.max(G.player.iframes, .3); } }, 400);
    log('Consola lista. Escribe /ayuda');
    window.CF_OWNER = { run, toggle, isOwner };
  }
});
