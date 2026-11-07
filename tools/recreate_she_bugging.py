"""
Recreación de la música del emote de Fortnite 'She Bugging (Whatchu Gonna Do)' de Mr Flintstone & Khantrast
para el juego BlockStrike / CalFight.

Genera dos versiones:
1. musica/she_bugging_game.mp3 : Recreación musical estilo videojuego arcade / synthwave / chiptune
2. musica/she_bugging_loop.mp3 : Loop perfecto y masterizado extraído directamente del audio original del emote
"""

import numpy as np
import scipy.signal as signal
import scipy.io.wavfile as wavfile
import subprocess
import pathlib
import os

SR = 44100
BPM = 124.675
BEAT_DUR = 60.0 / BPM          # ~0.48125 s
BAR_DUR = BEAT_DUR * 4.0       # ~1.925 s
STEP_DUR = BEAT_DUR / 4.0      # ~0.1203 s (semicorchea / 16th note)

OUT_DIR = pathlib.Path(__file__).resolve().parent.parent / 'musica'
OUT_DIR.mkdir(parents=True, exist_ok=True)

def mtof(m):
    return 440.0 * (2.0 ** ((m - 69.0) / 12.0))

def lp(x, fc):
    fc = min(fc, SR * 0.48)
    b, a = signal.butter(2, fc / (SR / 2), btype='low')
    return signal.lfilter(b, a, x, axis=0)

def hp(x, fc):
    fc = max(fc, 10)
    b, a = signal.butter(2, fc / (SR / 2), btype='high')
    return signal.lfilter(b, a, x, axis=0)

def bp(x, f_low, f_high):
    b, a = signal.butter(2, [f_low / (SR / 2), f_high / (SR / 2)], btype='bandpass')
    return signal.lfilter(b, a, x, axis=0)

# ==================== SÍNTESIS DE INSTRUMENTOS ====================

def make_kick(dur=0.45):
    """Bombo Jersey Club / 808 con golpe seco y sub-grave profundo"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    # Caída exponencial rápida de tono para el golpe
    f_env = 180.0 * np.exp(-t * 35.0) + 48.0
    phase = 2.0 * np.pi * np.cumsum(f_env) / SR
    # Cuerpo seno
    body = np.sin(phase)
    # Click de ataque (transitorio)
    click = (np.random.uniform(-1, 1, n) * np.exp(-t * 120.0))
    click = hp(click, 1800.0)
    # Envolvente de amplitud
    amp = np.exp(-t * 8.5)
    sig = (body * 0.9 + click * 0.4) * amp
    # Saturación suave
    sig = np.tanh(sig * 1.6) * 0.85
    return np.column_stack([sig, sig])

def make_snare_clap(dur=0.35):
    """Clap / Snare estéreo con multi-transitorio típico de club"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    # Ruido estéreo no correlacionado
    noise_l = np.random.uniform(-1, 1, n)
    noise_r = np.random.uniform(-1, 1, n)
    # Filtro pasa banda centrado en 1.4 kHz
    noise_l = bp(noise_l, 600.0, 3800.0)
    noise_r = bp(noise_r, 650.0, 3900.0)
    
    # Pre-claps característicos (flam)
    env = np.zeros(n)
    for offset in [0.0, 0.012, 0.024]:
        idx = int(offset * SR)
        if idx < n:
            dur_sub = 0.015
            sub_n = min(int(SR * dur_sub), n - idx)
            sub_t = np.linspace(0, dur_sub, sub_n, endpoint=False)
            env[idx:idx+sub_n] += np.exp(-sub_t * 220.0) * 0.5
            
    # Cola principal
    main_idx = int(0.030 * SR)
    if main_idx < n:
        main_t = np.linspace(0, dur - 0.030, n - main_idx, endpoint=False)
        env[main_idx:] += np.exp(-main_t * 18.0) * 0.9
        
    # Tono corporal del snare (210 Hz)
    tone = np.sin(2.0 * np.pi * 210.0 * t) * np.exp(-t * 28.0) * 0.35
    
    out_l = (noise_l * env + tone) * 0.7
    out_r = (noise_r * env + tone) * 0.7
    return np.column_stack([out_l, out_r])

def make_hihat(dur=0.08, open_hat=False):
    """Hi-hat metálico crujiente"""
    dur_actual = 0.35 if open_hat else dur
    n = int(SR * dur_actual)
    t = np.linspace(0, dur_actual, n, endpoint=False)
    # Combinación de osciladores de onda cuadrada desafinadas + ruido (método 808/909)
    metallic = np.zeros(n)
    for freq in [205.3, 304.4, 369.6, 522.7, 540.0, 800.0]:
        metallic += signal.square(2.0 * np.pi * freq * t)
    noise = np.random.uniform(-1, 1, n)
    sig = hp(metallic * 0.4 + noise * 0.6, 6800.0)
    decay = 12.0 if open_hat else 55.0
    sig = sig * np.exp(-t * decay)
    return np.column_stack([sig, sig])

def make_808_bass(midi_pitch, dur, slide_midi=None):
    """Sub-bajo 808 con pegada y saturación analógica"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    f_start = mtof(midi_pitch)
    if slide_midi is not None:
        f_end = mtof(slide_midi)
        freqs = np.linspace(f_start, f_end, n)
    else:
        # Micro caída inicial de tono para el golpe del 808
        freqs = f_start * (1.0 + 0.35 * np.exp(-t * 40.0))
        
    phase = 2.0 * np.pi * np.cumsum(freqs) / SR
    # Onda seno fundamental + armónicos suaves
    sig = np.sin(phase) + 0.25 * np.sin(phase * 2.0) + 0.1 * np.sin(phase * 3.0)
    
    # ADSR
    attack = int(SR * 0.008)
    env = np.ones(n)
    if attack > 0:
        env[:attack] = np.linspace(0, 1, attack)
    env[attack:] = np.exp(-np.linspace(0, dur, n - attack) * 2.2)
    
    # Saturación cálida
    sig = np.tanh(sig * env * 2.2) * 0.75
    sig = lp(sig, 450.0)
    return np.column_stack([sig, sig])

def make_lead_synth(midi_pitch, dur, velocity=1.0, pan=0.0):
    """Sintetizador solista retro/arcade tipo supersaw con chorus y envolvente viva"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    f0 = mtof(midi_pitch)
    
    # Detune estéreo (supersaw con 3 voces)
    detunes = [-0.012, 0.0, 0.012]
    sig_l = np.zeros(n)
    sig_r = np.zeros(n)
    for i, d in enumerate(detunes):
        f = f0 * (1.0 + d)
        # Sawtooth enriquecida
        voice = signal.sawtooth(2.0 * np.pi * f * t)
        pan_voice = (i - 1) * 0.35
        sig_l += voice * (0.5 - pan_voice * 0.5)
        sig_r += voice * (0.5 + pan_voice * 0.5)
        
    # Envolvente ADSR
    a_time = 0.015
    d_time = 0.12
    s_level = 0.65
    r_time = 0.05
    
    a_len = int(a_time * SR)
    d_len = int(d_time * SR)
    r_len = int(r_time * SR)
    
    env = np.full(n, s_level)
    if a_len > 0:
        env[:a_len] = np.linspace(0, 1.0, a_len)
    if d_len > 0 and a_len + d_len <= n:
        env[a_len:a_len+d_len] = np.linspace(1.0, s_level, d_len)
    if r_len > 0 and n > r_len:
        env[-r_len:] = np.linspace(s_level, 0, r_len)
        
    # Filtro pasa bajos con envolvente
    fc = min(f0 * 6.0, 12000.0)
    sig_l = lp(sig_l * env, fc)
    sig_r = lp(sig_r * env, fc)
    
    # Paneo final y volumen
    left_gain = (0.5 - pan * 0.5) * velocity * 0.35
    right_gain = (0.5 + pan * 0.5) * velocity * 0.35
    return np.column_stack([sig_l * left_gain, sig_r * right_gain])

def make_pluck_arp(midi_pitch, dur, velocity=0.7, pan=0.0):
    """Pluck brillante tipo campana arcade/16-bit para arpegios rápidos"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    f0 = mtof(midi_pitch)
    # FM síntesis sutil (modulador y portador)
    f_mod = f0 * 2.0
    mod_env = np.exp(-t * 22.0)
    modulator = np.sin(2.0 * np.pi * f_mod * t) * mod_env * 1.5
    carrier = np.sin(2.0 * np.pi * f0 * t + modulator)
    # Envolvente rápida
    amp = np.exp(-t * 14.0) * velocity * 0.3
    sig = carrier * amp
    sig = hp(sig, 250.0)
    left_gain = (0.5 - pan * 0.5)
    right_gain = (0.5 + pan * 0.5)
    return np.column_stack([sig * left_gain, sig * right_gain])

# ==================== CONSTRUCCIÓN DE LA PISTA RECREADA ====================

def generate_she_bugging_game_recreation():
    """Compone la recreación completa para juego (16 compases en loop perfecto)"""
    total_bars = 16
    total_dur = BAR_DUR * total_bars
    total_samples = int(np.round(total_dur * SR))
    
    mix = np.zeros((total_samples, 2), dtype=np.float64)
    
    def add_sound(sound, start_time):
        idx = int(np.round(start_time * SR))
        end = idx + len(sound)
        if end > total_samples:
            sound = sound[:total_samples - idx]
            end = total_samples
        if idx < total_samples and len(sound) > 0:
            mix[idx:end] += sound

    print(f"Generando pista sintetizada: {total_bars} compases, {total_dur:.2f} s...")

    # Acordes por compás (F#m / D / Bm / A)
    # Progresión armónica del tema:
    # Compás 1: D mayor (D4, F#4, A4)
    # Compás 2: F# menor (F#3, C#4, F#4)
    # Compás 3: B menor (B3, D4, F#4)
    # Compás 4: A mayor / C# (C#4, E4, A4)
    root_chords = [50, 42, 47, 45]  # MIDI roots (D3, F#2, B2, A2)

    # 1. BATERÍA: RITMO JERSEY CLUB BOUNCE
    # En cada compás de 16 semicorcheas:
    # Kick: tiempo 1 (paso 0), tiempo 2 (paso 4), tiempo 3 (paso 8), paso 11 (3&), tiempo 4 (paso 12), paso 14 (4&)
    # Snare/Clap: tiempo 2 (paso 4) y tiempo 4 (paso 12)
    # Hi-hats: semicorcheas continuas con acentos y redobles
    kick_steps = [0, 4, 8, 11, 12, 14]
    clap_steps = [4, 12]

    for bar in range(total_bars):
        bar_start = bar * BAR_DUR
        
        # Bombos
        for s in kick_steps:
            add_sound(make_kick(), bar_start + s * STEP_DUR)
            
        # Claps / Snares
        for s in clap_steps:
            add_sound(make_snare_clap(), bar_start + s * STEP_DUR)
            # En la segunda mitad (a partir del compás 8), redoble rápido en paso 15
            if bar >= 4 and bar % 2 == 1:
                add_sound(make_snare_clap() * 0.45, bar_start + 15 * STEP_DUR)

        # Hi-Hats (semicorcheas)
        for s in range(16):
            pan = 0.25 if s % 2 == 0 else -0.25
            is_open = (s == 6 or s == 14) and (bar % 2 == 1)
            vel = 0.9 if s % 4 == 0 else (0.7 if s % 2 == 0 else 0.45)
            hh = make_hihat(open_hat=is_open) * vel
            add_sound(hh, bar_start + s * STEP_DUR)
            # Redoble rápido en semicorchea 10 y 11 en compases pares
            if bar >= 4 and s == 10 and bar % 2 == 0:
                add_sound(make_hihat(dur=0.04) * 0.5, bar_start + (s + 0.5) * STEP_DUR)

    # 2. LÍNEA DE BAJO 808
    # Rebota en la tónica y quinta siguiendo el patrón de bombo
    for bar in range(total_bars):
        bar_start = bar * BAR_DUR
        chord_root = root_chords[bar % 4]
        
        # Golpes de bajo sincronizados con el ritmo Jersey
        add_sound(make_808_bass(chord_root, STEP_DUR * 3.5), bar_start + 0 * STEP_DUR)
        add_sound(make_808_bass(chord_root, STEP_DUR * 3.5), bar_start + 4 * STEP_DUR)
        add_sound(make_808_bass(chord_root + 7, STEP_DUR * 2.5), bar_start + 8 * STEP_DUR)
        # Slide sincopado
        add_sound(make_808_bass(chord_root + 7, STEP_DUR * 1.5, slide_midi=chord_root + 12), bar_start + 11 * STEP_DUR)
        add_sound(make_808_bass(chord_root, STEP_DUR * 1.8), bar_start + 12 * STEP_DUR)
        add_sound(make_808_bass(chord_root - 2, STEP_DUR * 1.8), bar_start + 14 * STEP_DUR)

    # 3. ARPEGIO DE FONDO (Arcade Plucks)
    # Arpegia notas de la escala en semicorcheas creando textura de videojuego
    scale_d_maj = [62, 64, 66, 67, 69, 71, 73, 74] # D4 a D5
    for bar in range(total_bars):
        bar_start = bar * BAR_DUR
        for s in range(16):
            if bar < 2 or bar == 8: # Breve respiro o intro
                note = scale_d_maj[(s * 2) % len(scale_d_maj)]
                pan = np.sin(s * 0.8) * 0.4
                add_sound(make_pluck_arp(note, STEP_DUR * 0.9, velocity=0.5, pan=pan), bar_start + s * STEP_DUR)
            elif bar >= 2:
                # Patrón rítmico punteado
                if s % 2 == 1:
                    note = scale_d_maj[(s * 3 + bar) % len(scale_d_maj)] + 12
                    pan = np.cos(s * 0.7) * 0.5
                    add_sound(make_pluck_arp(note, STEP_DUR * 0.85, velocity=0.45, pan=pan), bar_start + s * STEP_DUR)

    # 4. MELODÍA PRINCIPAL (EL HOOK "SHE BUGGING / WHATCHU GONNA DO")
    # Melodía de la frase vocal recreada con sintetizador solista arcade:
    # Frase A: "Baby you bugging, bugging, bu-bu-bugging"
    # D5, C#5, C#5, A4, F#4, F#5, E5, D5, C#5...
    melody_pattern_1 = [
        # (compás_rel, paso, nota_midi, dur_pasos, vel)
        (0, 0, 74, 2, 1.0),   # D5 ("Ba-")
        (0, 2, 73, 2, 0.95),  # C#5 ("-by")
        (0, 4, 73, 2, 1.0),   # C#5 ("you")
        (0, 6, 73, 2, 0.9),   # C#5 ("bug-")
        (0, 8, 69, 2, 0.95),  # A4  ("-ging")
        (0, 11, 66, 1, 0.85), # F#4 ("bu-")
        (0, 12, 69, 2, 0.9),  # A4  ("-bu-")
        (0, 14, 73, 2, 1.0),  # C#5 ("-bugging")

        (1, 0, 78, 2, 1.0),   # F#5 ("She")
        (1, 2, 76, 2, 0.9),   # E5  ("got")
        (1, 4, 74, 2, 0.95),  # D5  ("me")
        (1, 6, 73, 2, 0.9),   # C#5 ("bug-")
        (1, 8, 69, 3, 1.0),   # A4  ("-ging")
        (1, 12, 73, 2, 0.95), # C#5 ("bug-")
        (1, 14, 74, 2, 1.0),  # D5  ("-ging")
    ]

    melody_pattern_2 = [
        # Frase B de respuesta:
        (0, 0, 74, 2, 1.0),   # D5
        (0, 2, 73, 2, 0.95),  # C#5
        (0, 4, 76, 2, 1.0),   # E5
        (0, 6, 74, 2, 0.9),   # D5
        (0, 8, 73, 2, 0.95),  # C#5
        (0, 11, 69, 1, 0.85), # A4
        (0, 12, 73, 2, 0.9),  # C#5
        (0, 14, 76, 2, 1.0),  # E5

        (1, 0, 78, 2, 1.05),  # F#5 (Clímax)
        (1, 2, 78, 2, 0.95),  # F#5
        (1, 4, 76, 2, 0.9),   # E5
        (1, 6, 74, 2, 0.9),   # D5
        (1, 8, 73, 4, 1.0),   # C#5
        (1, 13, 69, 1.5, 0.85),# A4
        (1, 15, 74, 1, 0.9),  # D5
    ]

    # Insertamos la melodía en compases 2-15
    for group in range(1, 4): # 3 repeticiones con variaciones
        base_bar = group * 4
        # Patrón 1 en compases base_bar y base_bar + 1
        for b_rel, step, note, dur_s, vel in melody_pattern_1:
            t = (base_bar + b_rel) * BAR_DUR + step * STEP_DUR
            add_sound(make_lead_synth(note, dur_s * STEP_DUR * 1.15, velocity=vel, pan=0.08), t)
            # Doblaje una octava abajo para más peso en el drop
            if group >= 2:
                add_sound(make_lead_synth(note - 12, dur_s * STEP_DUR, velocity=vel * 0.4, pan=-0.08), t)

        # Patrón 2 en compases base_bar + 2 y base_bar + 3
        for b_rel, step, note, dur_s, vel in melody_pattern_2:
            t = (base_bar + 2 + b_rel) * BAR_DUR + step * STEP_DUR
            add_sound(make_lead_synth(note, dur_s * STEP_DUR * 1.15, velocity=vel, pan=-0.08), t)
            if group >= 2:
                add_sound(make_lead_synth(note - 12, dur_s * STEP_DUR, velocity=vel * 0.4, pan=0.08), t)

    # ==================== MASTERIZACIÓN Y LIMITACIÓN ====================
    # Reverb sutil (convolución con respuesta estéreo)
    ir_len = int(SR * 0.4)
    ir_t = np.linspace(0, 0.4, ir_len)
    ir_l = np.random.normal(0, 1, ir_len) * np.exp(-ir_t * 9.0)
    ir_r = np.random.normal(0, 1, ir_len) * np.exp(-ir_t * 9.0)
    
    wet_l = signal.fftconvolve(hp(mix[:, 0], 400.0), ir_l)[:total_samples] * 0.05
    wet_r = signal.fftconvolve(hp(mix[:, 1], 400.0), ir_r)[:total_samples] * 0.05
    mix[:, 0] += wet_l
    mix[:, 1] += wet_r

    # Limpieza de frecuencias subsónicas y ultra altas
    mix[:, 0] = lp(hp(mix[:, 0], 28.0), 16000.0)
    mix[:, 1] = lp(hp(mix[:, 1], 28.0), 16000.0)

    # Normalización al estándar del juego BlockStrike (-16 LUFS / RMS equilibrado)
    rms = np.sqrt(np.mean(mix ** 2))
    target_rms = 10.0 ** (-17.8 / 20.0) # Ajustado para dar -16.0 LUFS integrado exacto
    if rms > 1e-5:
        mix = mix * (target_rms / rms)

    # Limitador suave para evitar cualquier recorte duro
    peak = np.max(np.abs(mix))
    if peak > 0.88:
        mix = np.tanh(mix / 0.90) * 0.88

    # Guardar en WAV y convertir a MP3
    out_wav = OUT_DIR / 'she_bugging_game.wav'
    out_mp3 = OUT_DIR / 'she_bugging_game.mp3'
    wavfile.write(str(out_wav), SR, (mix * 32767.0).astype(np.int16))
    
    subprocess.run(['ffmpeg', '-y', '-i', str(out_wav), '-b:a', '192k', str(out_mp3)], check=True)
    if out_wav.exists():
        out_wav.unlink()
    print(f"Recreación de videojuego guardada en: {out_mp3} ({total_dur:.2f} s)")
    return out_mp3

# ==================== EXTRACCIÓN Y MASTER DEL LOOP ORIGINAL ====================

def generate_she_bugging_original_loop():
    """Extrae y masteriza el loop perfecto de 4 u 8 compases del audio original subido"""
    src_wav = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33\scratch\audio.wav')
    if not src_wav.exists():
        src_mp4 = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33\.user_uploaded\media_1793917187877_84b08f9d.mp4')
        src_wav.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-i', str(src_mp4), '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', str(src_wav)], check=True)

    sr, data = wavfile.read(str(src_wav))
    data_f = data.astype(np.float32) / 32768.0

    # Puntos de corte exactos calculados matemáticamente:
    # Inicio en la caída del compás: sample 9251 (~0.2098s)
    # 4 compases = 339570 samples (~7.7000s)
    # 8 compases = 679140 samples (~15.4000s)
    # Tomamos 8 compases (15.4 segundos) para que tenga tanto la frase intro como la variación
    s0 = 9251
    period_8bars = 679140
    
    # Si tomamos desde s0 hasta s0 + period_8bars, creamos un micro crossfade (15ms)
    # entre el final y el principio para garantizar cero ruidos o clicks al hacer loop infinito
    fade_len = int(SR * 0.015) # 15ms
    loop_data = data_f[s0 : s0 + period_8bars].copy()

    # Crossfade suave de continuidad circular
    xfade_in = np.linspace(0, 1, fade_len)[:, None]
    xfade_out = np.linspace(1, 0, fade_len)[:, None]
    tail = loop_data[-fade_len:].copy()
    head = loop_data[:fade_len].copy()
    
    loop_data[:fade_len] = head * xfade_in + tail * xfade_out

    # Filtro de limpieza y normalización a -16 LUFS
    loop_data[:, 0] = lp(hp(loop_data[:, 0], 30.0), 18000.0)
    loop_data[:, 1] = lp(hp(loop_data[:, 1], 30.0), 18000.0)

    rms = np.sqrt(np.mean(loop_data ** 2))
    target_rms = 10.0 ** (-16.0 / 20.0)
    if rms > 1e-5:
        loop_data = loop_data * (target_rms / rms)

    peak = np.max(np.abs(loop_data))
    if peak > 0.88:
        loop_data = np.tanh(loop_data / 0.90) * 0.88

    out_wav = OUT_DIR / 'she_bugging_loop.wav'
    out_mp3 = OUT_DIR / 'she_bugging_loop.mp3'
    wavfile.write(str(out_wav), SR, (loop_data * 32767.0).astype(np.int16))
    
    subprocess.run(['ffmpeg', '-y', '-i', str(out_wav), '-b:a', '192k', str(out_mp3)], check=True)
    if out_wav.exists():
        out_wav.unlink()
    print(f"Loop original masterizado guardado en: {out_mp3} (15.40 s)")
    return out_mp3

if __name__ == '__main__':
    print("Iniciando recreación de audio para BlockStrike...")
    p1 = generate_she_bugging_game_recreation()
    p2 = generate_she_bugging_original_loop()
    print("¡Ambas pistas generadas exitosamente!")
