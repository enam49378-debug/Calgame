/* ===== DISEÑOS DE LA PANTALLA DE INICIO =====
   Tres distribuciones de los botones de la pantalla de inicio (se cambian con el botón DISEÑO, se recuerda la elegida):
     clasico  · cuenta arriba a la izquierda, botones secundarios en fila arriba a la derecha, logo abajo a la izquierda, JUGAR abajo a la derecha,
                disco abajo al centro.
     centro   · logo arriba al centro, JUGAR grande abajo al centro con AJUSTES y ESCENA a los lados, cuenta arriba a la izquierda, disco a la derecha.
     lateral  · panel vertical a la izquierda con logo, JUGAR, AJUSTES, ESCENA y Discord; el personaje queda libre a la derecha; disco abajo a la derecha.
   En pantallas chicas (móvil) se respeta el diseño de siempre. Este archivo se ejecuta dentro de game.js. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const LAYS = [['clasico', 'Clásico'], ['centro', 'Centrado'], ['lateral', 'Lateral']];
    let cur = 'clasico'; try { const v = localStorage.getItem('bsb_title_lay'); if (LAYS.some(l => l[0] === v)) cur = v; } catch (e) { }
    const css = document.createElement('style');
    const W = '@media (min-width:821px){';
    const sec = 'background:rgba(10,12,24,.72)!important;color:#fff!important;border:2px solid rgba(255,255,255,.35)!important;padding:10px 16px!important;font:700 12px/1 var(--display,"Chakra Petch",sans-serif)!important;letter-spacing:.14em!important;backdrop-filter:blur(4px);transform:none!important';
    css.textContent = W
      // comunes
      + 'body.tl #tset,body.tl #tscene,body.tl #tlay{' + sec + '}body.tl #tset:hover,body.tl #tscene:hover,body.tl #tlay:hover{background:#ffd400!important;color:#000!important;border-color:#000!important}'
      + '#tlay{position:absolute;z-index:3;cursor:pointer;display:none}body.tl #tlay{display:block}'
      // ---------------- clásico
      + 'body.tl-clasico #acctbtn{left:3vw!important;top:6vh!important}'
      + 'body.tl-clasico #tscene{top:6vh!important;right:3vw!important;bottom:auto!important}'
      + 'body.tl-clasico #tset{top:6vh!important;right:calc(3vw + 190px)!important;bottom:auto!important}'
      + 'body.tl-clasico #tlay{top:6vh;right:calc(3vw + 320px)}'
      + 'body.tl-clasico #dclink{left:auto!important;right:3vw!important;top:calc(6vh + 52px)!important;transform:none!important}'
      + 'body.tl-clasico #title .tlogo{left:4vw!important;bottom:9vh!important}'
      + 'body.tl-clasico #tplay{right:4vw!important;bottom:10vh!important}'
      + 'body.tl-clasico #disco{left:50%!important;top:auto!important;bottom:7vh;transform:translateX(-44px)}'
      // ---------------- centrado
      + 'body.tl-centro #acctbtn{left:3vw!important;top:6vh!important}'
      + 'body.tl-centro #dclink{left:auto!important;right:3vw!important;top:6vh!important;transform:none!important}'
      + 'body.tl-centro #title .tlogo{left:50%!important;bottom:auto!important;top:5vh!important;transform:translateX(-50%);text-align:center}body.tl-centro #title .tlogo img{height:min(20vh,200px)!important;margin:0 auto}'
      + 'body.tl-centro #tplay{left:50%!important;right:auto!important;bottom:9vh!important;transform:translateX(-50%)!important}'
      + 'body.tl-centro #tset{left:auto!important;right:calc(50% + 116px)!important;top:auto!important;bottom:calc(9vh + 20px)!important}'
      + 'body.tl-centro #tscene{right:auto!important;left:calc(50% + 116px)!important;top:auto!important;bottom:calc(9vh + 20px)!important}'
      + 'body.tl-centro #tlay{left:3vw;bottom:4vh}'
      + 'body.tl-centro #disco{left:auto!important;right:3vw;top:auto!important;bottom:26vh;flex-direction:row-reverse}body.tl-centro #disco .pp{margin-left:0;margin-right:-14px;border-radius:6px 0 0 6px}body.tl-centro #disco .pp div{padding:0 28px 0 16px}'
      // ---------------- lateral
      + 'body.tl-lateral #title::before{content:"";position:absolute;left:0;top:0;bottom:0;width:min(420px,34vw);z-index:2;background:linear-gradient(90deg,rgba(8,10,22,.88),rgba(8,10,22,.55) 80%,transparent);pointer-events:none}'
      + 'body.tl-lateral #acctbtn{left:2.4vw!important;top:5vh!important;width:min(340px,30vw)!important}'
      + 'body.tl-lateral #title .tlogo{left:2.4vw!important;top:calc(5vh + 118px)!important;bottom:auto!important}body.tl-lateral #title .tlogo img{height:min(18vh,170px)!important}'
      + 'body.tl-lateral #tplay{left:2.4vw!important;right:auto!important;top:calc(5vh + 118px + min(18vh,170px) + 64px)!important;bottom:auto!important;width:min(340px,30vw);text-align:center}'
      + 'body.tl-lateral #tset{left:2.4vw!important;right:auto!important;top:calc(5vh + 118px + min(18vh,170px) + 150px)!important;bottom:auto!important;width:min(166px,14.6vw)}'
      + 'body.tl-lateral #tscene{left:calc(2.4vw + min(174px,15.4vw))!important;right:auto!important;top:calc(5vh + 118px + min(18vh,170px) + 150px)!important;bottom:auto!important;width:min(166px,14.6vw)}'
      + 'body.tl-lateral #tlay{left:2.4vw;top:calc(5vh + 118px + min(18vh,170px) + 200px);width:min(340px,30vw)}'
      + 'body.tl-lateral #dclink{left:2.4vw!important;top:auto!important;bottom:5vh!important;transform:none!important}'
      + 'body.tl-lateral #disco{left:auto!important;right:3vw;top:auto!important;bottom:6vh;flex-direction:row-reverse}body.tl-lateral #disco .pp{margin-left:0;margin-right:-14px;border-radius:6px 0 0 6px}body.tl-lateral #disco .pp div{padding:0 28px 0 16px}'
      + '}';
    document.head.appendChild(css);
    const b = document.createElement('button'); b.type = 'button'; b.id = 'tlay'; b.setAttribute('aria-label', 'Cambiar diseño de la pantalla de inicio');
    function apply() {
      for (const [k] of LAYS) document.body.classList.toggle('tl-' + k, k === cur); document.body.classList.add('tl');
      b.textContent = 'DISEÑO: ' + LAYS.find(l => l[0] === cur)[1].toUpperCase();
    }
    b.addEventListener('click', e => { e.stopPropagation(); const i = LAYS.findIndex(l => l[0] === cur); cur = LAYS[(i + 1) % LAYS.length][0]; try { localStorage.setItem('bsb_title_lay', cur); } catch (x) { } apply(); });
    const mount = () => { const t = document.getElementById('title'); if (t && !b.parentNode) t.appendChild(b); };
    mount(); setTimeout(mount, 1500); apply();
    window.CF_TITULO = { set(k) { if (LAYS.some(l => l[0] === k)) { cur = k; apply(); } }, get layout() { return cur; } };
  }
});
