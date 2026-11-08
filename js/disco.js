/* ===== DISCO DE LA MUSICA + DISCORD =====
   En el menu de inicio aparece un disco con la portada de la cancion. Al entrar o cambiar la musica se "abre" un papel junto al disco con el nombre
   de la cancion y su autor, y el disco gira. Arriba hay el logo de Discord con el enlace de la comunidad.
   Para anadir mas canciones: agrega su archivo en TRACKS (nombre del mp3 -> titulo, autor, portada). Este archivo se ejecuta dentro de game.js. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const TRACKS = { 'calfight_intro.mp3': { t: 'CalFight · Tema principal', a: 'CalFight (canción original)', cover: 'assets/calfight_logo.png', fit: '80% auto' }, 'green_room.mp3': { t: 'Welcome to the Green Room (Wii U Mix)', a: 'Toby Fox · Tai Undead', cover: 'musica/portadas/green_room.jpg' } };
    const DISCORD = 'https://discord.gg/hwU3SYxeuZ';
    const css = document.createElement('style');
    css.textContent = '#disco{position:fixed;left:22px;top:44%;z-index:60;display:none;align-items:center;pointer-events:none}#disco.on{display:flex}'
      + '#disco .dk{position:relative;width:88px;height:88px;border-radius:50%;flex:0 0 auto;background:#111 center/cover;box-shadow:0 6px 18px rgba(0,0,0,.55),0 0 0 3px #1b1b24;will-change:transform;backface-visibility:hidden}'
      + '#disco .dk::before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 5px,rgba(0,0,0,.18) 5px 6px)}'
      + '#disco .dk::after{content:"";position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px;border-radius:50%;background:#0d0d14;box-shadow:inset 0 0 0 4px #2a2a38}'
      + '#disco .pp{height:62px;max-width:0;overflow:hidden;margin-left:-14px;background:linear-gradient(180deg,#fbf3dc,#ecdfba);color:#2a2014;border-radius:0 6px 6px 0;box-shadow:0 5px 14px rgba(0,0,0,.45);transition:max-width 1.1s cubic-bezier(.22,.9,.25,1);display:flex;flex-direction:column;justify-content:center;white-space:nowrap}'
      + '#disco.open .pp{max-width:330px}#disco .pp div{padding:0 16px 0 28px}#disco .pp b{display:block;font:700 13px "Chakra Petch",system-ui,sans-serif}#disco .pp small{display:block;font:600 11px "Chakra Petch",system-ui,sans-serif;opacity:.7;margin-top:2px}'
      + '#disco.on{animation:dkIn .7s cubic-bezier(.2,1.3,.4,1) both}@keyframes dkIn{from{opacity:0;transform:translateY(24px) scale(.6)}}'
      + '#disco .pp div{opacity:0;transform:translateX(-12px);transition:opacity .45s .5s,transform .6s .5s cubic-bezier(.2,.9,.3,1)}#disco.open .pp div{opacity:1;transform:none}#disco.open .pp{transition-duration:1.3s}#disco:not(.open) .pp div{transition-delay:0s}'
      + '#dclink{position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:61;display:none;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:#5865f2;color:#fff;font:700 12px "Chakra Petch",system-ui,sans-serif;letter-spacing:.08em;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.4)}#dclink.on{display:flex}#dclink:hover{background:#6f7bff}#dclink svg{width:20px;height:20px;fill:#fff}';
    document.head.appendChild(css);
    const D = document.createElement('div'); D.id = 'disco'; D.innerHTML = '<div class="dk"></div><div class="pp"><div><b></b><small></small></div></div>'; document.body.appendChild(D);
    const L = document.createElement('a'); L.id = 'dclink'; L.href = DISCORD; L.target = '_blank'; L.rel = 'noopener noreferrer'; L.setAttribute('aria-label', 'Discord de CalFight');
    L.innerHTML = '<svg viewBox="0 0 127.14 96.36" aria-hidden="true"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0 105.89 105.89 0 0 0 19.39 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69Zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69Z"/></svg><span>DISCORD</span>';
    document.body.appendChild(L);
    let cur = '', hide = 0;
    /* El giro va por tiempo real (no por fotogramas): da igual si el jugador tiene 30 o 240 FPS, siempre tarda lo mismo en dar la vuelta.
       Cuando la musica arranca o se para, el disco acelera / frena suave como un tocadiscos. */
    const VUELTA = 30; // segundos por vuelta completa
    const dkEl = D.querySelector('.dk');
    // La vuelta la hace el compositor del navegador (como una animacion CSS): no tiembla aunque el juego este ocupado.
    const anim = dkEl.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: VUELTA * 1000, iterations: Infinity });
    let vel = 0; anim.playbackRate = 0;
    setInterval(() => {
      const target = D.classList.contains('on') && D.classList.contains('spin') ? 1 : 0;
      const nv = Math.abs(target - vel) < .02 ? target : vel + (target - vel) * .12;
      if (nv !== vel) { vel = nv; anim.updatePlaybackRate ? anim.updatePlaybackRate(vel) : (anim.playbackRate = vel); }
    }, 100);
    setInterval(() => {
      const show = G.state === 'title' || G.state === 'menu'; D.classList.toggle('on', show && !!cur); L.classList.toggle('on', show);
      const tr = (G.state === 'title' && TITLE.mus) || (MUS && MUS.track), src = tr && tr.el ? decodeURIComponent((tr.el.src || '').split('/').pop()) : '', meta = TRACKS[src];
      if (!show) { D.classList.remove('open'); return; }
      if (meta && src !== cur) { cur = src; const dk = D.querySelector('.dk'); dk.style.backgroundImage = 'url("' + meta.cover + '")'; dk.style.backgroundSize = meta.fit || 'cover'; dk.style.backgroundColor = meta.fit ? '#1a1530' : '#111'; D.querySelector('b').textContent = meta.t; D.querySelector('small').textContent = meta.a; D.classList.add('on'); D.classList.remove('open'); void D.offsetWidth; setTimeout(() => D.classList.add('open'), 250); clearTimeout(hide); hide = setTimeout(() => D.classList.remove('open'), 10000); }
      else if (!meta && cur) { cur = ''; D.classList.remove('open', 'on'); }
      D.classList.toggle('spin', !!(tr && tr.el && !tr.el.paused));
    }, 400);
  }
});
