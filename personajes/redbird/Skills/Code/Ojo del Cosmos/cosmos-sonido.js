/* Sonidos de "Ojo del Cosmos" (personaje: redbird), generados con el motor de audio del juego (no hacen falta archivos).
   Uso desde rbCosmos.js:  rbCosmosSnd.thud(); rbCosmosSnd.riser(1.4); const h = rbCosmosSnd.hum('sawtooth', 90, .5); h.set(1, 120); ... rbCosmosSnd.stopAll();
   Si quieres sonidos grabados, ponlos en Skills/Sound/Ojo del Cosmos/ (lanzar_1.mp3, voz_1.mp3...): el juego los reproduce solo. */
const rbCosmosSnd = (function () {
  const ok = () => !!AC && AC.state === 'running' && AUDIO_LEVELS.general > 0 && AUDIO_LEVELS.game > 0;
  const live = new Set();
  // sonido continuo con volumen/tono controlables
  const loopNoise = (type, freq, q, vol) => {
    if (!ok() || !NB) return null;
    const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = NB; s.loop = true; fl.type = type; fl.frequency.value = freq; fl.Q.value = q; g.gain.value = 0;
    s.connect(fl); fl.connect(g); connectOneShot(s, g, 'game', null, fl); s.start(); live.add(s);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) fl.frequency.setTargetAtTime(fr, t, dt); } };
  };
  const hum = (type, f0, vol) => {
    if (!ok()) return null;
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f0; g.gain.value = 0;
    o.connect(g); connectOneShot(o, g, 'game', null); o.start(); live.add(o);
    return { set(v, fr, dt = .12) { const t = AC.currentTime; g.gain.setTargetAtTime(v * vol, t, dt); if (fr) o.frequency.setTargetAtTime(fr, t, dt); } };
  };
  const api = {
    hum, loopNoise,
    stopAll() { for (const n of live) { try { n.stop(); } catch (e) { } } live.clear(); },
    step() { if (!ok()) return; const t = AC.currentTime; nz(t, .13, 200, 1, .35, 'lowpass'); tone(t, .1, 95, 50, 'sine', .3); },
    heart() { if (!ok()) return; const t = AC.currentTime; tone(t, .16, 62, 38, 'sine', .75); tone(t + .2, .13, 56, 36, 'sine', .55); },
    thud() { if (!ok()) return; const t = AC.currentTime; tone(t, .5, 90, 30, 'sine', .9); nz(t, .45, 500, 1, .7, 'lowpass'); nz(t + .05, .6, 3000, 1, .2, 'highpass'); },
    crackle() { if (!ok()) return; const t = AC.currentTime; nz(t, .035, 3500 + Math.random() * 2500, 5, .25, 'bandpass'); },
    chirp() { if (!ok()) return; const t = AC.currentTime, f = 2200 + Math.random() * 1400; tone(t, .07, f, f * 1.35, 'sine', .07); tone(t + .09, .06, f * 1.2, f * 1.5, 'sine', .06); },
    riser(dur, f0 = 160, f1 = 2400, vol = .5) {   // silbido de energía que sube
      if (!ok()) return; const t = AC.currentTime, o = AC.createOscillator(), fl = AC.createBiquadFilter(), g = AC.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.exponentialRampToValueAtTime(6000, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .9); g.gain.exponentialRampToValueAtTime(.001, t + dur + .08);
      o.connect(fl); fl.connect(g); connectOneShot(o, g, 'game', null, fl); o.start(t); o.stop(t + dur + .12);
    },
    whoosh(dur, f0, f1, vol = .5) {   // ráfaga de viento que sube o baja de tono
      if (!ok() || !NB) return; const t = AC.currentTime, s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain();
      s.buffer = NB; s.loop = true; fl.type = 'bandpass'; fl.Q.value = 1.2; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(.001, t); g.gain.linearRampToValueAtTime(vol, t + dur * .45); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(fl); fl.connect(g); connectOneShot(s, g, 'game', null, fl); s.start(t); s.stop(t + dur + .05);
    },
    boom(vol = 1) {   // explosión grande: golpe grave, ruido y cola
      if (!ok()) return; const t = AC.currentTime;
      tone(t, 1.4, 75, 24, 'sine', vol); tone(t, .8, 140, 40, 'triangle', vol * .5);
      nz(t, 1.6, 420, .8, vol * .9, 'lowpass'); nz(t, .7, 2600, 1, vol * .4, 'highpass'); nz(t + .12, 1.8, 900, .6, vol * .35, 'bandpass');
    },
    sting(vol = .8) {   // golpe de impacto con eco
      if (!ok()) return; const t = AC.currentTime;
      tone(t, .9, 110, 35, 'sine', vol); nz(t, .6, 1800, 1, vol * .5, 'bandpass'); tone(t + .35, .7, 98, 33, 'sine', vol * .35);
    },
  };
  return api;
})();
