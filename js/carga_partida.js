/* ===== PANTALLA DE CARGA ENTRE EL INICIO Y EL SELECTOR =====
   Al salir del inicio se muestra una pantalla de carga (mismo estilo que la primera). Mientras tanto:
     1) se libera lo del inicio (personaje del titulo, musica y ambiente ya se apagan en titleFinish) y la memoria de dibujo que sobro,
     2) se precargan las imagenes del selector (retratos, iconos) y se compilan los materiales del escenario del selector,
     3) recien ahi se muestra el selector con su animacion de entrada.
   game.js llama a CF_CARGA.run(listo) desde titleFinish. Este archivo se ejecuta dentro de game.js. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    const TIPS = [
      'Presiona <b>SHIFT</b> durante el combate para fijar la camara en tu rival.',
      'La <b>ulti</b> se carga pegando y recibiendo golpes: cuando brilla, ya la puedes usar.',
      'Cada peleador tiene <b>3 habilidades</b> y una <b>ulti</b>: miralas en la pestaña Habilidades del selector.',
      'Con <b>M</b> apagas o prendes la musica en cualquier momento.',
      'Esquivar en el momento justo te deja contraatacar antes que el rival se recupere.'
    ];
    const css = document.createElement('style');
    css.textContent = '#ld2{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;font-family:"Chakra Petch",system-ui,sans-serif;color:#fff6ea;'
      + 'background:radial-gradient(ellipse at 50% 70%,rgba(255,154,98,.35),transparent 60%),linear-gradient(180deg,#120a2e 0%,#3a1458 45%,#7a2a6a 100%);opacity:0;transition:opacity .45s ease;pointer-events:none}'
      + '#ld2.on{opacity:1;pointer-events:auto}#ld2.out{opacity:0;transition:opacity .6s ease}'
      + '#ld2 .ld-shell{transform:translate3d(0,14px,0);transition:transform .6s cubic-bezier(.2,.9,.3,1)}#ld2.on .ld-shell{transform:none}'
      + '#ld2 .ld-logo img{width:min(220px,56vw)}'
      + '#ld2 #ld2-fill{height:100%;width:0;background:repeating-linear-gradient(90deg,#ffd166 0 14px,#ff7a59 14px 28px);box-shadow:0 0 14px #ffb066;transition:width .35s ease;position:relative;z-index:1}'
      + '#ld2 .ld-bar::before{display:none}';
    document.head.appendChild(css);
    const el = document.createElement('div'); el.id = 'ld2'; el.setAttribute('role', 'progressbar'); el.setAttribute('aria-label', 'Preparando la pelea');
    el.innerHTML = '<div class="ld-shell"><div class="ld-logo"><img src="assets/calfight_logo.png" alt=""></div><div class="ld-tag">PREPARANDO LA PELEA</div>'
      + '<div class="ld-bar"><div id="ld2-fill"></div></div><div class="ld-meta"><span id="ld2-st">Guardando la ciudad...</span><span id="ld2-pct">0%</span></div>'
      + '<div class="ld-tip"><small>CONSEJO</small><p id="ld2-tip"></p></div></div>';
    document.body.appendChild(el);
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    const set = (p, txt) => { el.querySelector('#ld2-fill').style.width = p + '%'; el.querySelector('#ld2-pct').textContent = Math.round(p) + '%'; if (txt) el.querySelector('#ld2-st').textContent = txt; };
    let busy = false;
    async function run(listo) {
      if (busy) { listo(); return; } busy = true;
      const t0 = performance.now();
      el.querySelector('#ld2-tip').innerHTML = TIPS[Math.random() * TIPS.length | 0];
      set(0, 'Guardando la ciudad...'); el.classList.remove('out'); el.classList.add('on'); await frame(); await frame();
      try {
        // 1) liberar memoria de dibujo que dejo el inicio
        set(20, 'Liberando memoria del inicio...');
        try { renderer.renderLists.dispose(); } catch (e) { }
        await wait(120);
        // 2) imagenes del selector
        set(40, 'Cargando retratos de los peleadores...');
        const menu = document.getElementById('menu');
        const imgs = menu ? [...menu.querySelectorAll('img')].filter(i => i.src) : [];
        let done = 0;
        await Promise.race([Promise.all(imgs.map(i => (i.decode ? i.decode() : Promise.resolve()).catch(() => { }).then(() => { done++; set(40 + 35 * done / Math.max(1, imgs.length)); }))), wait(4000)]);
        // 3) compilar materiales del escenario del selector (evita tirones al girar el personaje)
        set(80, 'Preparando el escenario...'); await frame();
        try { if (SH && SH.scene && SH.cam) renderer.compile(SH.scene, SH.cam); } catch (e) { }
        set(100, 'Listo'); await frame();
      } catch (e) { }
      const rest = 1200 - (performance.now() - t0); if (rest > 0) await wait(rest);   // que se lea el consejo un momento
      el.classList.add('out'); el.classList.remove('on');
      try { listo(); } catch (e) { }
      setTimeout(() => { el.classList.remove('out'); busy = false; }, 650);
    }
    window.CF_CARGA = { run };
  }
});
