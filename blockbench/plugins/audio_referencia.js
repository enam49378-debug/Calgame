/* Audio de referencia — plugin de Blockbench (4.8 o superior, programa y versión web)
 *
 * Pone un audio en cada animación para guiarte con el tiempo (golpes, voces, música):
 *   - la onda de sonido se dibuja sobre la regla de la línea de tiempo y sigue el zoom y el desplazamiento;
 *   - suena al reproducir la animación (respeta la velocidad y se reinicia en cada vuelta del bucle);
 *   - opcional: suena un instante al arrastrar el cabezal (scrub).
 * El audio se guarda dentro del proyecto (.bbmodel), por animación, así que viaja con el modelo.
 *
 * Uso: menú Animación ▸ Audio de referencia ▸ Cargar…, Quitar, Desfase, Ajustar duración al audio, Silenciar, Sonar al arrastrar.
 */
(function () {
  const ID = 'audio_referencia';
  const MAX_EMBED = 6 * 1024 * 1024;
  let props = [], actions = [], handlers = [], timer = null, canvas = null, ctx = null;
  const st = { buf: null, key: '', src: null, gain: null, muted: false, scrub: true, lastTime: 0, lastDraw: '', stutterT: 0 };
  const cache = new Map();

  const A = () => (typeof Animation !== 'undefined' && Animation.selected) || null;
  const audioCtx = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  const offsetOf = a => (a && parseFloat(a.bs_audio_offset)) || 0;

  const dataUrlToBuffer = async url => { const ab = await (await fetch(url)).arrayBuffer(); return audioCtx().decodeAudioData(ab); };
  const peaksOf = buf => {
    const N = Math.min(6000, Math.ceil(buf.duration * 200)), ch = buf.getChannelData(0), step = Math.max(1, Math.floor(ch.length / N)), pk = new Float32Array(N);
    for (let i = 0; i < N; i++) { let m = 0; const o = i * step; for (let j = 0; j < step; j++) { const v = Math.abs(ch[o + j] || 0); if (v > m) m = v; } pk[i] = m; }
    return pk;
  };
  // carga el audio de la animación elegida (guardado en caché)
  const sync = async () => {
    const a = A(); const key = a && a.bs_audio_data ? a.uuid + ':' + a.bs_audio_data.length : '';
    if (key === st.key) return; st.key = key; stop();
    if (!key) { st.buf = null; return; }
    let e = cache.get(key);
    if (!e) { try { const buf = await dataUrlToBuffer(a.bs_audio_data); e = { buf, pk: peaksOf(buf) }; cache.set(key, e); } catch (err) { st.buf = null; Blockbench.showQuickMessage('No se pudo leer el audio de ' + a.name, 2500); return; } }
    if (st.key === key) st.buf = e;
    draw(true);
  };

  // ----- reproducción
  const stop = () => { if (st.src) { try { st.src.stop(); } catch (e) { } try { st.src.disconnect(); } catch (e) { } st.src = null; } };
  const play = (from, dur) => {
    stop(); if (!st.buf || st.muted) return; const c = audioCtx(); if (c.state === 'suspended') c.resume();
    const a = A(), off = offsetOf(a), t = from - off, src = c.createBufferSource(), g = c.createGain();
    src.buffer = st.buf.buf; src.playbackRate.value = Math.max(.1, (Timeline.playback_speed || 100) / 100); g.gain.value = 1; src.connect(g); g.connect(c.destination);
    if (t >= 0) { if (t >= st.buf.buf.duration) return; if (dur) { src.start(0, t, dur); g.gain.setValueAtTime(1, c.currentTime + dur - .03); g.gain.linearRampToValueAtTime(0, c.currentTime + dur); } else src.start(0, t); }
    else { if (dur) return; src.start(c.currentTime - t / src.playbackRate.value); }
    st.src = src; src.onended = () => { if (st.src === src) st.src = null; };
  };

  // ----- dibujo de la onda sobre la regla
  const mount = () => {
    const hdr = document.getElementById('timeline_header'); if (!hdr) return false;
    if (!canvas) { canvas = document.createElement('canvas'); canvas.id = 'bs_audio_wave'; canvas.style.cssText = 'position:absolute;top:0;height:100%;pointer-events:none;z-index:4'; }
    if (canvas.parentNode !== hdr) hdr.appendChild(canvas); return true;
  };
  const draw = force => {
    if (!mount()) return; const hdr = canvas.parentNode, data = Timeline.vue && Timeline.vue._data; if (!data) return;
    const headW = data.head_width || 196, W = Math.max(0, hdr.clientWidth - headW), H = hdr.clientHeight, size = data.size || 300, sc = data.scroll_left || 0, a = A();
    const sig = [W, H, size, sc, a && a.uuid, st.buf ? st.key : '', offsetOf(a), st.muted].join('|'); if (!force && sig === st.lastDraw) return; st.lastDraw = sig;
    const dpr = window.devicePixelRatio || 1; canvas.style.left = headW + 'px'; canvas.style.width = W + 'px'; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (!st.buf) return; const pk = st.buf.pk, dur = st.buf.buf.duration, off = offsetOf(a), mid = H / 2;
    g.fillStyle = st.muted ? 'rgba(140,150,170,.45)' : 'rgba(77,210,255,.6)';
    for (let x = 0; x < W; x++) {
      const t = (x + sc) / size - off; if (t < 0 || t > dur) continue;
      const i0 = Math.floor(t / dur * pk.length), i1 = Math.max(i0 + 1, Math.floor((t + 1 / size) / dur * pk.length)); let m = 0; for (let i = i0; i < i1 && i < pk.length; i++) if (pk[i] > m) m = pk[i];
      const h = Math.max(1, Math.min(1, m * 1.4) * (H - 2)); g.fillRect(x, mid - h / 2, 1, h);
    }
    const xe = (off + dur) * size - sc; g.fillStyle = 'rgba(77,210,255,.8)'; if (xe >= 0 && xe <= W) g.fillRect(xe - 1, 0, 2, H);
    g.fillStyle = '#9fe8ff'; g.font = '10px sans-serif'; g.fillText('♪ ' + (a.bs_audio_name || 'audio'), 4, 10);
  };

  // ----- acciones
  const readFile = file => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(file); });
  const pickFile = () => new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.flac'; i.onchange = () => res(i.files[0] || null); i.click(); });
  const withAnim = fn => { const a = A(); if (!a) return Blockbench.showQuickMessage('Elige una animación primero', 2000); return fn(a); };
  const edit = (a, label, fn) => { Undo.initEdit({ animations: [a] }); fn(a); Undo.finishEdit(label, { animations: [a] }); };
  const load = () => withAnim(async a => {
    const f = await pickFile(); if (!f) return; if (f.size > MAX_EMBED && !confirm('El audio pesa ' + (f.size / 1048576).toFixed(1) + ' MB y se guardará dentro del proyecto. ¿Continuar?')) return;
    const url = await readFile(f); let buf; try { buf = await dataUrlToBuffer(url); } catch (e) { return Blockbench.showQuickMessage('No se pudo leer ese audio', 2500); }
    edit(a, 'Audio de referencia', x => { x.bs_audio_name = f.name; x.bs_audio_data = url; x.bs_audio_offset = 0; });
    st.key = ''; await sync(); Blockbench.showQuickMessage('Audio de referencia: ' + f.name + ' (' + buf.duration.toFixed(2) + ' s)', 2500);
  });
  const remove = () => withAnim(a => { if (!a.bs_audio_data) return; edit(a, 'Quitar audio de referencia', x => { x.bs_audio_name = ''; x.bs_audio_data = ''; x.bs_audio_offset = 0; }); st.key = ''; sync(); draw(true); });
  const offsetDlg = () => withAnim(a => {
    if (!a.bs_audio_data) return Blockbench.showQuickMessage('Esta animación no tiene audio', 2000);
    new Dialog({ id: 'audio_ref_offset', title: 'Desfase del audio', form: { off: { label: 'Segundos (positivo = el audio empieza más tarde)', type: 'number', value: offsetOf(a), step: 0.01 } }, onConfirm(f) { edit(a, 'Desfase del audio', x => { x.bs_audio_offset = +f.off || 0; }); draw(true); } }).show();
  });
  const fit = () => withAnim(a => {
    if (!st.buf) return Blockbench.showQuickMessage('Esta animación no tiene audio', 2000);
    Undo.initEdit({ animations: [a] }); a.length = Math.round((st.buf.buf.duration + offsetOf(a) + 0.3) * 100) / 100; Undo.finishEdit('Ajustar duración al audio', { animations: [a] }); Timeline.updateSize && Timeline.updateSize(); draw(true);
  });

  Plugin.register(ID, {
    title: 'Audio de referencia', author: 'Blockstrike', icon: 'music_note', version: '1.0.0', min_version: '4.8.0', variant: 'both',
    description: 'Pone un audio en cada animación: onda sobre la línea de tiempo y sonido al reproducir, para sincronizar golpes y voces.',
    tags: ['Animation', 'Audio'],
    onload() {
      props = [new Property(Animation, 'string', 'bs_audio_name', { default: '' }), new Property(Animation, 'string', 'bs_audio_data', { default: '' }), new Property(Animation, 'number', 'bs_audio_offset', { default: 0 })];
      const mk = (id, o) => { const x = new Action(id, Object.assign({ category: 'animation' }, o)); actions.push(x); return x; };
      const aLoad = mk('audio_ref_load', { name: 'Cargar audio de referencia…', icon: 'audio_file', click: load });
      const aRem = mk('audio_ref_remove', { name: 'Quitar audio de referencia', icon: 'music_off', click: remove });
      const aOff = mk('audio_ref_offset', { name: 'Desfase del audio…', icon: 'timer', click: offsetDlg });
      const aFit = mk('audio_ref_fit', { name: 'Ajustar duración al audio', icon: 'straighten', click: fit });
      const aMute = new Toggle('audio_ref_mute', { name: 'Silenciar audio de referencia', icon: 'volume_off', category: 'animation', default: false, onChange(v) { st.muted = !!v; if (v) stop(); draw(true); } }); actions.push(aMute);
      const aScrub = new Toggle('audio_ref_scrub', { name: 'Sonar al arrastrar el cabezal', icon: 'hearing', category: 'animation', default: true, onChange(v) { st.scrub = !!v; } }); actions.push(aScrub);
      actions.forEach(x => MenuBar.addAction(x, 'animation'));
      const on = (e, f) => { Blockbench.on(e, f); handlers.push([e, f]); };
      on('timeline_play', () => { st.lastTime = Timeline.time || 0; play(Timeline.time || 0); });
      on('timeline_pause', () => stop());
      on('display_animation_frame', () => {
        const t = Timeline.time || 0;
        if (Timeline.playing) { if (t < st.lastTime - 0.05) play(t); }   // vuelta del bucle o salto atrás
        else if (st.scrub && st.buf && Math.abs(t - st.lastTime) > 1e-4) { const n = performance.now(); if (n - st.stutterT > 70) { st.stutterT = n; play(t, 0.12); } }
        st.lastTime = t;
      });
      for (const e of ['select_project', 'select_mode', 'finished_edit', 'undo', 'redo']) on(e, () => { st.key = ''; sync(); });
      timer = setInterval(() => { if (Project && Modes.animate) { sync(); draw(false); } }, 120);
      setTimeout(() => { st.key = ''; sync(); }, 400);
    },
    onunload() {
      handlers.forEach(([e, f]) => Blockbench.removeListener(e, f)); handlers = []; clearInterval(timer); stop();
      actions.forEach(x => x.delete()); actions = []; props.forEach(p => p.delete()); props = [];
      if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas); canvas = null;
    },
  });
})();
