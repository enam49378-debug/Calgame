/* ===== SONIDOS SINTÉTICOS DEL ABISMO, LAS CRIATURAS Y EL BARCO =====
   Se generan con WebAudio (no hacen falta archivos): rugido del Kraken, chasquidos de cangrejo, chispazos de medusa, gemidos de ahogados,
   gruñidos del rape, chirridos del calamarín, crujidos y bocina del barco... Cada sonido baja de volumen con la distancia a la cámara.
   Si pones un archivo en sonidos/<nombre>.mp3 el editor de audio del juego lo puede usar aparte; esto es el sonido de base.
   Este archivo se ejecuta dentro de game.js (como habilidades.js), con sus funciones a mano. */
(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {
  with (A) {
    let noiseBuf = null;
    const ok = () => !!(AC && AC.state === 'running' && master && AUDIO_LEVELS && AUDIO_LEVELS.general !== 0 && AUDIO_LEVELS.game !== 0);
    const noise = () => { if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; };
    function bus(vol, pos, range) {
      const g = AC.createGain(); let v = vol; if (pos && camera) v *= Math.max(0, 1 - camera.position.distanceTo(pos) / (range || 70)); if (v < .01) return null;
      g.gain.value = 0; g.connect(master); g._v = v; return g;
    }
    const env = (g, t0, a, d, s, r, peak) => { const p = g._v * peak; g.gain.cancelScheduledValues(t0); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(p, t0 + a); g.gain.linearRampToValueAtTime(p * s, t0 + a + d); g.gain.linearRampToValueAtTime(0, t0 + a + d + r); };
    function osc(type, f0, f1, dur, g, t0, peak, a, filt) {
      const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); let node = o;
      if (filt) { const f = AC.createBiquadFilter(); f.type = filt[0]; f.frequency.value = filt[1]; f.Q.value = filt[2] || 1; o.connect(f); node = f; }
      const e = AC.createGain(); node.connect(e); e.connect(g); const p = peak; e.gain.cancelScheduledValues(t0); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(g._v * p, t0 + (a || .01)); e.gain.linearRampToValueAtTime(g._v * p * .6, t0 + dur * .5); e.gain.linearRampToValueAtTime(0, t0 + dur);
      o.start(t0); o.stop(t0 + dur + .05); return o;
    }
    function nz(dur, g, t0, peak, ftype, f0, f1, q) {
      const n = noise(), f = AC.createBiquadFilter(); f.type = ftype; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur); f.Q.value = q || 1; const e = AC.createGain(); n.connect(f); f.connect(e); e.connect(g);
      e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(g._v * peak, t0 + .02); e.gain.exponentialRampToValueAtTime(.0008, t0 + dur); n.start(t0, Math.random()); n.stop(t0 + dur + .05);
    }
    const S = {
      roar(g, t) { osc('sawtooth', 120, 38, 1.9, g, t, .55, .08, ['lowpass', 520, 2]); osc('sawtooth', 128, 41, 1.9, g, t, .4, .08, ['lowpass', 480, 2]); osc('sine', 60, 28, 2.1, g, t, .7, .05); nz(1.7, g, t, .5, 'lowpass', 900, 160, 1); },
      roarShort(g, t) { osc('sawtooth', 150, 50, 1.0, g, t, .5, .04, ['lowpass', 600, 2]); osc('sine', 70, 34, 1.1, g, t, .6, .03); nz(.9, g, t, .4, 'lowpass', 800, 200, 1); },
      slam(g, t) { osc('sine', 90, 30, .6, g, t, .9, .005); nz(.5, g, t, .7, 'lowpass', 1200, 120, 1); },
      squelch(g, t) { nz(.35, g, t, .5, 'bandpass', 500, 160, 6); osc('sine', 220, 80, .3, g, t, .3, .01); },
      clack(g, t) { for (let i = 0; i < 3; i++) { osc('square', 1500 - i * 150, 700, .05, g, t + i * .07, .25, .002); nz(.04, g, t + i * .07, .25, 'highpass', 3000, 2000); } },
      zap(g, t) { for (let i = 0; i < 6; i++) osc('sawtooth', 600 + Math.random() * 1800, 300 + Math.random() * 600, .05, g, t + i * .045, .3, .002, ['bandpass', 1500, 3]); nz(.3, g, t, .3, 'highpass', 4000, 3000); },
      moan(g, t) { const o = osc('sawtooth', 120, 70, 1.3, g, t, .35, .2, ['lowpass', 420, 3]); const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 5; lg.gain.value = 8; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1.4); nz(1.0, g, t, .12, 'bandpass', 500, 300, 2); },
      growl(g, t) { const o = osc('sawtooth', 75, 55, .9, g, t, .5, .05, ['lowpass', 380, 2]); const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 28; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1); nz(.8, g, t, .25, 'lowpass', 500, 150, 1); },
      screech(g, t) { osc('sawtooth', 2100, 700, .5, g, t, .3, .01, ['bandpass', 1800, 2]); osc('square', 2300, 800, .45, g, t, .15, .01); },
      chirp(g, t) { osc('sine', 800, 1500, .12, g, t, .35, .005); osc('sine', 1100, 1700, .1, g, t + .13, .3, .005); },
      laugh(g, t) { for (let i = 0; i < 4; i++) osc('square', 110 - i * 9, 80 - i * 7, .16, g, t + i * .2, .3, .01, ['lowpass', 500, 2]); },
      creak(g, t) { const o = osc('sawtooth', 95, 135, 1.3, g, t, .35, .25, ['bandpass', 380, 5]); const lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 7; lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + 1.4); },
      horn(g, t) { osc('sawtooth', 110, 108, 1.7, g, t, .5, .08, ['lowpass', 700, 1]); osc('sawtooth', 138, 136, 1.7, g, t, .4, .08, ['lowpass', 700, 1]); osc('sine', 55, 54, 1.8, g, t, .5, .08); },
      thud(g, t) { osc('sine', 140, 50, .18, g, t, .6, .004); nz(.12, g, t, .3, 'lowpass', 1600, 300); },
      drip(g, t) { osc('sine', 1400, 900, .12, g, t, .25, .003); },
      bubble(g, t) { const f = 300 + Math.random() * 500; osc('sine', f, f * 2.2, .1, g, t, .2, .004); osc('sine', f * 1.3, f * 2.6, .09, g, t + .06, .15, .004); },
      key(g, t) { for (let i = 0; i < 4; i++) osc('triangle', 1200 + i * 330, 1400 + i * 330, .25, g, t + i * .07, .22, .004); },
      door(g, t) { osc('sine', 55, 30, 2.2, g, t, .8, .1); nz(2.0, g, t, .5, 'lowpass', 600, 80, 1); osc('sawtooth', 70, 50, 2, g, t, .3, .2, ['lowpass', 300, 1]); },
    };
    function play(kind, pos, vol, range) {
      try { if (!ok() || !S[kind]) return; const g = bus(vol == null ? 1 : vol, pos, range); if (!g) return; S[kind](g, AC.currentTime + .005); } catch (e) { }
    }
    window.CF_SND = { play, kinds: Object.keys(S) };
  }
});
