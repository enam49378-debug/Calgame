/* ===== DISEÑO DE LA PANTALLA DE INICIO (LATERAL) =====
   Panel vertical a la izquierda con la cuenta, el logo, JUGAR, AJUSTES, ESCENA y Discord; el personaje queda libre a la derecha
   y el disco de la musica abajo a la derecha. Todo entra con animaciones escalonadas y sale deslizandose al pulsar JUGAR.
   En pantallas chicas (movil) se respeta el diseño de siempre. Este archivo se ejecuta dentro de game.js. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const css = document.createElement('style');
    const E = 'cubic-bezier(.2,.95,.3,1)', B = 'cubic-bezier(.2,1.35,.4,1)';
    const TOP = 'calc(5vh + 118px + min(18vh,170px)', W = 'min(340px,30vw)';
    css.textContent = '@media (min-width:821px){'
      // panel oscuro de fondo
      + 'body.tl #title::before{content:"";position:absolute;left:0;top:0;bottom:0;width:min(440px,36vw);z-index:2;background:linear-gradient(90deg,rgba(8,10,22,.9),rgba(8,10,22,.6) 75%,transparent);pointer-events:none;animation:tlPanel 1.2s ' + E + ' both}'
      + '@keyframes tlPanel{from{transform:translateX(-100%);opacity:0}}'
      // cuenta
      + 'body.tl #acctbtn{left:2.4vw;top:5vh;width:' + W + ';animation:tlSlide .9s .3s ' + E + ' backwards;transition:transform .25s ' + E + ',box-shadow .25s,opacity .3s}'
      + '@keyframes tlSlide{from{opacity:0;transform:translateX(-70px) skewX(-4deg)}}'
      // logo con flotado suave
      + 'body.tl #title .tlogo{left:2.4vw;top:calc(5vh + 118px);bottom:auto;animation:tlLogo 1.1s .5s ' + B + ' backwards}'
      + '@keyframes tlLogo{from{opacity:0;transform:translateX(-50px) scale(.8) rotate(-5deg)}}'
      + 'body.tl #title .tlogo img{height:min(18vh,170px);animation:tlFloat 3.2s 1.6s steps(7,jump-none) infinite alternate;backface-visibility:hidden}'
      + '@keyframes tlFloat{from{transform:translateY(0)}to{transform:translateY(-6px)}}'
      + 'body.tl #title .tlogo p{animation:tlFade .8s .9s ease backwards}@keyframes tlFade{from{opacity:0;letter-spacing:.4em}}'
      // JUGAR: entrada con rebote, brillo que cruza y halo suave
      + 'body.tl #tplay{left:2.4vw;right:auto;top:' + TOP + ' + 64px);bottom:auto;width:' + W + ';text-align:center;overflow:hidden;'
      + 'animation:tlPlay 1s .8s ' + B + ' backwards;transition:transform .22s ' + E + ',box-shadow .22s,background .2s}'
      + '@keyframes tlPlay{from{opacity:0;transform:translateX(-90px) skewX(-8deg) scale(.9)}}'
      + '@keyframes tlGlow{0%,100%{box-shadow:6px 6px 0 #000}50%{box-shadow:6px 6px 0 #000,0 0 28px rgba(255,212,0,.65)}}'
      + 'body.tl #tplay::after{content:"";position:absolute;top:-20%;bottom:-20%;left:0;width:28%;will-change:transform;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);transform:translateX(-150%) skewX(-20deg);animation:tlShine 5.5s 2s ease-in-out infinite;pointer-events:none}'
      + '@keyframes tlShine{0%{transform:translateX(-150%) skewX(-20deg)}35%,100%{transform:translateX(450%) skewX(-20deg)}}'
      + 'body.tl #tplay:hover{transform:skewX(-8deg) translate(4px,-3px);box-shadow:10px 9px 0 #000;animation:none}'
      + 'body.tl #tplay:active{transform:skewX(-8deg) translate(2px,2px);box-shadow:3px 3px 0 #000}'
      // AJUSTES / ESCENA
      + 'body.tl #tset,body.tl #tscene{background:rgba(10,12,24,.72);color:#fff;border:2px solid rgba(255,255,255,.35);padding:10px 16px;font:700 12px/1 var(--display,"Chakra Petch",sans-serif);letter-spacing:.14em;backdrop-filter:blur(4px);transform:none;'
      + 'top:' + TOP + ' + 150px);bottom:auto;right:auto;width:min(166px,14.6vw);transition:background .2s,color .2s,border-color .2s,transform .25s ' + E + ',box-shadow .25s}'
      + 'body.tl #tset{left:2.4vw;animation:tlBtn .8s 1s ' + E + ' backwards}body.tl #tscene{left:calc(2.4vw + min(174px,15.4vw));animation:tlBtn .8s 1.1s ' + E + ' backwards}'
      + '@keyframes tlBtn{from{opacity:0;transform:translateY(16px)}}'
      + 'body.tl #tset:hover,body.tl #tscene:hover{background:#ffd400;color:#000;border-color:#000;transform:translateY(-3px);box-shadow:0 5px 0 #000}'
      + 'body.tl #tset:active,body.tl #tscene:active{transform:translateY(0);box-shadow:0 1px 0 #000}'
      // Discord y disco
      + 'body.tl #dclink{left:2.4vw;top:auto;bottom:5vh;transform:none;animation:tlBtn .8s 1.25s ' + E + ' backwards;transition:background .2s,transform .25s ' + B + '}body.tl #dclink:hover{transform:scale(1.08)}'
      + 'body.tl #disco{left:auto;right:3vw;top:auto;bottom:6vh;flex-direction:row-reverse}body.tl #disco .pp{margin-left:0;margin-right:-14px;border-radius:6px 0 0 6px}body.tl #disco .pp div{padding:0 28px 0 16px;transform:translateX(12px)}body.tl #disco.open .pp div{transform:none}'
      // salida al pulsar JUGAR: todo se desliza a la izquierda
      + 'body.tl #title.leaving::before{transform:translateX(-100%);opacity:0;transition:transform .5s ease-in,opacity .5s}'
      + 'body.tl #title.leaving #acctbtn,body.tl #title.leaving .tlogo,body.tl #title.leaving #tplay,body.tl #title.leaving #tset,body.tl #title.leaving #tscene{opacity:0;transform:translateX(-80px);transition:opacity .35s,transform .4s ease-in;animation:none}'
      + '}';
    document.head.appendChild(css);
    document.body.classList.add('tl');
    try { localStorage.removeItem('bsb_title_lay'); } catch (e) { }
  }
});
