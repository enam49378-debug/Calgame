/* Sonidos de "Ojo del Cosmos" (personaje: redbird), generados con el motor de audio del juego (no hacen falta archivos).
   Capas realistas: reverb de sala grande (respuesta de impulso generada), estéreo, graves profundos, ruido filtrado con variación,
   coro vocal (formantes) y texturas que cambian con el tiempo para que no suenen planos ni repetidos.
   Uso desde rbCosmos.js:  rbCosmosSnd.thud(); rbCosmosSnd.riser(1.4); const h = rbCosmosSnd.hum('sawtooth', 90, .5); h.set(1, 120); ... rbCosmosSnd.stopAll();
   Si quieres sonidos grabados, ponlos en Skills/Sound/Ojo del Cosmos/ (lanzar_1.mp3, voz_1.mp3...): el juego los reproduce solo. */
const rbCosmosSnd = (function () {
  const ok = () => !!AC && AC.state === 'running' && AUDIO_LEVELS.general > 0 && AUDIO_LEVELS.game > 0;
  const live = new Set(); let rev = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // ---- reverb de sala grande: ruido que se apaga y se oscurece con el tiempo
  const reverb = () => {
    if (rev || !ok()) return rev;
    const len = Math.floor(AC.sampleRate * 3.6), ir = AC.createBuffer(2, len, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const k = i / len; lp += ((Math.random() * 2 - 1) - lp) * (.4 - .32 * k); d[i] = lp * Math.pow(1 - k, 2.5) * (i < 1200 ? i / 1200 : 1); } }
    const conv = AC.createConvolver(); conv.buffer = ir;
    const inG = AC.createGain(), outG = AC.createGain(); outG.gain.value = .9; inG.connect(conv); conv.connect(outG); connectSpatial(outG, 'game', null);
    rev = { in: inG, nodes: [inG, conv, outG] }; return rev;
  };
  // ---- salida: panorama estéreo + envío a la reverb
  const route = (node, pan, wet) => {
    let n = node; const extra = [];
    if (pan && AC.createStereoPanner) { const p = AC.createStereoPanner(); p.pan.value = pan; node.connect(p); n = p; extra.push(p); }
    connectSpatial(n, 'game', null);
    if (wet > 0) { const r = reverb(); if (r) { const s = AC.createGain(); s.gain.value = wet; n.connect(s); s.connect(r.in); extra.push(s); } }
    return extra;
  };
  const cleanOnEnd = (src, nodes) => src.addEventListener('ended', () => { for (const n of nodes) { try { n.disconnect(); } catch (e) { } } }, { once: true });
  const env = (g, t, dur, vol, att) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t + att); g.gain.exponentialRampToValueAtTime(.0002, t + dur); };

  // ---- sonidos cortos
  const toneShot = (t, dur, o) => {
    const osc = AC.createOscillator(), g = AC.createGain(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t); if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f1), t + dur);
    env(g, t, dur, o.vol, o.att || .004); osc.connect(g); const ex = route(g, o.pan || 0, o.wet || 0);
    osc.start(t); osc.stop(t + dur + .05); cleanOnEnd(osc, [osc, g, ...ex]);
  };
  const noiseShot = (t, dur, o) => {
    if (!NB) return; const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = NB; fl.type = o.type || 'lowpass'; fl.Q.value = o.q || .8; fl.frequency.setValueAtTime(o.f0, t); if (o.f1) fl.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + dur);
    env(g, t, dur, o.vol, o.att || .006); s.connect(fl); fl.connect(g); const ex = route(g, o.pan || 0, o.wet || 0);
    s.start(t, rnd(0, .5)); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, ...ex]);
  };

  // ---- sonidos continuos (se controlan con .set(volumen, frecuencia))
  const loopNoise = (type, freq, q, vol) => {
    if (!ok() || !NB) return null;
    const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain();
    s.buffer = NB; s.loop = true; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; g.gain.value = 0;
    lfo.frequency.value = rnd(.09, .2); lg.gain.value = vol * .3; lfo.connect(lg); lg.connect(g.gain);   // el volumen respira lentamente
    s.connect(fl); fl.connect(g); route(g, 0, .25); s.start(); lfo.start(); live.add(s); live.add(lfo);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) fl.frequency.setTargetAtTime(fr, t, dt); } };
  };
  const hum = (type, f0, vol) => {
    if (!ok()) return null;
    const g = AC.createGain(), fl = AC.createBiquadFilter(), oscs = []; g.gain.value = 0; fl.type = 'lowpass'; fl.Q.value = .7; fl.frequency.value = type === 'sine' ? 520 : type === 'sawtooth' ? 1500 : 3600; fl.connect(g);
    const add = (ty, ratio, det, lv) => { const o = AC.createOscillator(), og = AC.createGain(); o.type = ty; o.frequency.value = f0 * ratio; o.detune.value = det; og.gain.value = lv; o.connect(og); og.connect(fl); o.start(); live.add(o); oscs.push([o, ratio]); };
    if (type === 'sine') { add('sine', 1, 0, .5); add('sine', 2.005, 4, .22); add('sawtooth', 1.5, -5, .08); add('sine', .5, 0, .35); }   // zumbido grave de tensión
    else if (type === 'sawtooth') { add('sawtooth', 1, 0, .34); add('sawtooth', 1, 9, .3); add('sawtooth', .5, -5, .36); add('sine', 2, 0, .2); }   // cuerpo del rayo
    else { add('sine', 1, 0, .3); add('sine', 2.01, 5, .2); add('triangle', .5, 0, .2); }   // brillo del rayo
    const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = type === 'sine' ? .2 : 5.5; lg.gain.value = type === 'sine' ? 6 : 14; lfo.connect(lg); oscs.forEach(([o]) => lg.connect(o.detune)); lfo.start(); live.add(lfo);
    route(g, 0, type === 'sine' ? .35 : .22);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) oscs.forEach(([o, r]) => o.frequency.setTargetAtTime(fr * r, t, dt)); } };
  };

  const api = {
    hum, loopNoise,
    stopAll() { for (const n of live) { try { n.stop(); } catch (e) { } } live.clear(); if (rev) { const r = rev; rev = null; setTimeout(() => { for (const n of r.nodes) { try { n.disconnect(); } catch (e) { } } }, 4200); } },
    step() {   // paso sobre el pavimento: golpe grave, roce y variación de un paso a otro
      if (!ok()) return; const t = AC.currentTime, side = Math.random() < .5 ? -.18 : .18;
      toneShot(t, .15, { type: 'sine', f0: rnd(95, 125), f1: 50, vol: rnd(.22, .32), pan: side, wet: .12 });
      noiseShot(t, .09, { type: 'lowpass', f0: 420, f1: 180, vol: rnd(.2, .3), pan: side, wet: .1 });
      noiseShot(t + .012, .07, { type: 'bandpass', f0: rnd(1100, 1900), q: 1.2, vol: .08, pan: side });
    },
    heart() {   // latido profundo (lub-dub) con eco
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, .22, { type: 'sine', f0: 72, f1: 40, vol: .62, wet: .3 }); noiseShot(t, .12, { type: 'lowpass', f0: 180, vol: .25, wet: .2 });
      toneShot(t + .21, .16, { type: 'sine', f0: 64, f1: 38, vol: .42, wet: .3 });
    },
    thud() {   // caída de rodillas: golpe, roce de ropa y polvo
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, .65, { type: 'sine', f0: 92, f1: 28, vol: .9, wet: .35 }); toneShot(t, .3, { type: 'triangle', f0: 170, f1: 60, vol: .35, wet: .2 });
      noiseShot(t, .4, { type: 'lowpass', f0: 650, f1: 160, vol: .7, wet: .25 }); noiseShot(t + .04, .7, { type: 'highpass', f0: 2800, vol: .1, wet: .4 }); noiseShot(t + .08, .5, { type: 'bandpass', f0: 1500, q: .7, vol: .12, wet: .3 });
    },
    crackle() {   // chasquido de roca o cristal que se rompe
      if (!ok()) return; const t = AC.currentTime, pan = rnd(-.7, .7);
      toneShot(t, .05, { type: 'triangle', f0: rnd(1500, 3800), f1: 500, vol: rnd(.06, .14), pan, wet: .3 });
      noiseShot(t, .035, { type: 'highpass', f0: 3000, vol: .12, pan, wet: .2 });
      if (Math.random() < .35) toneShot(t + .03, .12, { type: 'sine', f0: rnd(110, 220), f1: 60, vol: .12, pan, wet: .4 });
    },
    chirp() {   // pájaro lejano: dos o tres sílabas que suben de tono, con eco
      if (!ok()) return; const t = AC.currentTime, f = rnd(2200, 3600), pan = rnd(-.8, .8), n = 2 + Math.floor(rnd(0, 2));
      for (let i = 0; i < n; i++) toneShot(t + i * rnd(.08, .11), .075, { type: 'sine', f0: f * (1 + i * .08), f1: f * (1.3 + i * .1), vol: rnd(.04, .08), pan, wet: .35 });
    },
    riser(dur, f0 = 160, f1 = 2400, vol = .5) {   // energía que se acumula: ruido que sube, dos sierras desafinadas y armónicos
      if (!ok()) return; const t = AC.currentTime;
      noiseShot(t, dur + .1, { type: 'bandpass', f0: 300, f1: 6500, q: 1.1, vol: vol * .55, att: dur * .85, wet: .3 });
      for (const det of [-7, 8]) {
        const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.detune.value = det;
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.type = 'lowpass'; fl.frequency.setValueAtTime(380, t); fl.frequency.exponentialRampToValueAtTime(7000, t + dur);
        env(g, t, dur + .1, vol * .45, dur * .9); o.connect(fl); fl.connect(g); const ex = route(g, det < 0 ? -.3 : .3, .35); o.start(t); o.stop(t + dur + .15); cleanOnEnd(o, [o, fl, g, ...ex]);
      }
      for (const m of [2, 3, 4]) toneShot(t, dur + .08, { type: 'sine', f0: f0 * m, f1: f1 * m * .9, vol: vol * .1 / m * 2, att: dur * .9, wet: .4 });
    },
    whoosh(dur, f0, f1, vol = .5) {   // ráfaga de viento que pasa de un lado al otro
      if (!ok() || !NB) return; const t = AC.currentTime, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
      s.buffer = NB; s.loop = true; fl.type = 'bandpass'; fl.Q.value = .9; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .45); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(fl); fl.connect(g); let n = g; if (p) { p.pan.setValueAtTime(-.6, t); p.pan.linearRampToValueAtTime(.6, t + dur); g.connect(p); n = p; }
      connectSpatial(n, 'game', null); const r = reverb(); if (r) { const w = AC.createGain(); w.gain.value = .3; n.connect(w); w.connect(r.in); }
      s.start(t); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, p]);
      noiseShot(t, dur, { type: 'lowpass', f0: Math.min(f0, f1) * .5 + 80, f1: Math.max(f0, f1) * .3 + 80, vol: vol * .5, att: dur * .4 });
    },
    boom(vol = 1) {   // explosión grande: golpe grave, cuerpo, ruido que se apaga, restallido y eco
      if (!ok()) return; const t = AC.currentTime;
      toneShot(t, 1.8, { type: 'sine', f0: 78, f1: 22, vol, wet: .4 }); toneShot(t, .9, { type: 'triangle', f0: 150, f1: 42, vol: vol * .5, wet: .3 });
      noiseShot(t, 1.9, { type: 'lowpass', f0: 650, f1: 110, vol: vol * .9, wet: .45 }); noiseShot(t, .4, { type: 'highpass', f0: 4200, vol: vol * .35, wet: .3 });
      noiseShot(t + .12, 2, { type: 'bandpass', f0: 900, f1: 220, q: .6, vol: vol * .3, wet: .5 }); toneShot(t + .45, 1, { type: 'sine', f0: 62, f1: 26, vol: vol * .3, wet: .5 });
    },
    sting(vol = .8) {   // golpe orquestal grave (braam) con cola
      if (!ok()) return; const t = AC.currentTime;
      for (const [f, det] of [[55, -8], [55, 9], [82.4, 0], [110, -4]]) {
        const o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; fl.type = 'lowpass'; fl.Q.value = 1.2;
        fl.frequency.setValueAtTime(260, t); fl.frequency.exponentialRampToValueAtTime(1700, t + .35); fl.frequency.exponentialRampToValueAtTime(220, t + 1.6);
        env(g, t, 1.7, vol * .22, .05); o.connect(fl); fl.connect(g); const ex = route(g, det * .03, .45); o.start(t); o.stop(t + 1.75); cleanOnEnd(o, [o, fl, g, ...ex]);
      }
      toneShot(t, .8, { type: 'sine', f0: 100, f1: 36, vol: vol * .6, wet: .3 }); noiseShot(t, .5, { type: 'bandpass', f0: 1600, f1: 500, vol: vol * .3, wet: .4 });
    },
    choir(notes, dur, vol = .5) {   // coro de voces "ahh" (sierras desafinadas por filtros de vocal) que sube y se apaga
      if (!ok()) return; const t = AC.currentTime;
      notes.forEach((f, i) => {
        const g = AC.createGain(), mix = AC.createGain(), pan = (i - (notes.length - 1) / 2) * .35; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol / notes.length, t + dur * .55); g.gain.exponentialRampToValueAtTime(.0002, t + dur);
        const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = rnd(4.6, 5.6); vg.gain.value = 9; vib.connect(vg);
        for (const det of [-9, 0, 9]) { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; vg.connect(o.detune); o.connect(mix); o.start(t); o.stop(t + dur + .1); }
        for (const [ff, q, lv] of [[720, 4, .55], [1150, 6, .42], [2650, 9, .12]]) { const b = AC.createBiquadFilter(), bg = AC.createGain(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = q; bg.gain.value = lv; mix.connect(b); b.connect(bg); bg.connect(g); }
        vib.start(t); vib.stop(t + dur + .1); route(g, pan, .6);
      });
    },
    planetBoom() {   // la Tierra se rompe: silencio breve, golpe enorme, rugido que se apaga, escombros y zumbido de oídos
      if (!ok()) return; const t = AC.currentTime;
      api.boom(1.35); api.sting(.9);
      noiseShot(t, 3.4, { type: 'lowpass', f0: 1900, f1: 80, vol: .8, att: .08, wet: .55 });
      toneShot(t, 3.2, { type: 'sine', f0: 56, f1: 18, vol: .8, wet: .5 });
      for (let i = 0; i < 16; i++) { const d = rnd(.2, 2.8), pan = rnd(-.8, .8); toneShot(t + d, .22, { type: 'triangle', f0: rnd(350, 1800), f1: rnd(120, 400), vol: rnd(.05, .12), pan, wet: .4 }); noiseShot(t + d, .12, { type: 'bandpass', f0: rnd(900, 3200), q: 2, vol: .1, pan, wet: .3 }); }
      toneShot(t + .6, 3.4, { type: 'sine', f0: 3100, f1: 3000, vol: .035, att: 1.2, wet: .5 });
    },
    jet() {   // avión a reacción que cruza de un lado al otro (efecto Doppler)
      if (!ok() || !NB) return; const t = AC.currentTime, dur = 2.4;
      const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(), p = AC.createStereoPanner ? AC.createStereoPanner() : null;
      s.buffer = NB; s.loop = true; fl.type = 'bandpass'; fl.Q.value = .9; fl.frequency.setValueAtTime(1400, t); fl.frequency.exponentialRampToValueAtTime(2600, t + dur * .45); fl.frequency.exponentialRampToValueAtTime(520, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(.8, t + dur * .45); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(fl); fl.connect(g); let n = g; if (p) { p.pan.setValueAtTime(-.85, t); p.pan.linearRampToValueAtTime(.85, t + dur); g.connect(p); n = p; }
      connectSpatial(n, 'game', null); const r = reverb(); if (r) { const w = AC.createGain(); w.gain.value = .25; n.connect(w); w.connect(r.in); }
      s.start(t); s.stop(t + dur + .05); cleanOnEnd(s, [s, fl, g, p]);
      toneShot(t, dur, { type: 'sawtooth', f0: 120, f1: 70, vol: .12, att: dur * .4, wet: .2 });
      toneShot(t, dur, { type: 'sine', f0: 1500, f1: 850, vol: .05, att: dur * .4, wet: .3 });
    },
    ufo() {   // platillo: trino que sube y baja
      if (!ok()) return; const t = AC.currentTime;
      for (let i = 0; i < 6; i++) toneShot(t + i * .18, .22, { type: 'sine', f0: 380 + (i % 2) * 220, f1: 640 + (i % 3) * 120, vol: .09, pan: rnd(-.4, .4), wet: .45 });
    },
    reentry(dur = 1.4) {   // entrada en la atmósfera: rugido que sube de tono con chispazos
      if (!ok()) return; const t = AC.currentTime;
      noiseShot(t, dur, { type: 'bandpass', f0: 180, f1: 2600, q: .8, vol: .7, att: dur * .6, wet: .25 }); noiseShot(t, dur, { type: 'lowpass', f0: 140, f1: 320, vol: .6, att: dur * .4 });
      for (let i = 0; i < 18; i++) { const d = rnd(0, dur), pan = rnd(-.6, .6); toneShot(t + d, .05, { type: 'triangle', f0: rnd(1800, 4200), f1: 800, vol: .07, pan }); }
    },
  };
  return api;
})();
