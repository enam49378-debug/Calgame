"""
Genera las 3 versiones de 'HYPNOTIC DATA' (Odetari) del emote de Fortnite 'Entranced'
para el juego BlockStrike / CalFight:

1. musica/hypnotic_data_original.mp3   : Versión fiel casi idéntica a la original, loop continuo y masterizado a -16 LUFS
2. musica/hypnotic_data_intermedio.mp3 : Versión intermedia (híbrido original + sintetizadores y bajo de juego arcade)
3. musica/hypnotic_data_arcade.mp3     : Recreación 100% instrumental estilo videojuego arcade / chiptune
"""

import numpy as np
import scipy.signal as signal
import scipy.io.wavfile as wavfile
import subprocess
import pathlib
import os

SR = 44100
BPM = 135.849
LOOP_SAMPLES = 623280          # Exactamente 8 compases (14.133333 s)
DOUBLE_LOOP = LOOP_SAMPLES * 2 # 16 compases (28.266667 s)
BEAT_DUR = 60.0 / BPM          # ~0.44167 s
STEP_DUR = BEAT_DUR / 4.0      # ~0.11042 s

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

def normalize_to_lufs(audio, target_lufs=-16.0):
    """Normaliza audio estéreo a nivel de LUFS estándar del juego con limitador suave"""
    rms = np.sqrt(np.mean(audio ** 2))
    target_rms = 10.0 ** (target_lufs / 20.0)
    if rms > 1e-5:
        audio = audio * (target_rms / rms)
    peak = np.max(np.abs(audio))
    if peak > 0.88:
        audio = np.tanh(audio / 0.90) * 0.88
    return audio

def save_mp3(audio, base_name):
    wav_path = OUT_DIR / f"{base_name}.wav"
    mp3_path = OUT_DIR / f"{base_name}.mp3"
    wavfile.write(str(wav_path), SR, (np.clip(audio, -1.0, 1.0) * 32767.0).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-i', str(wav_path), '-b:a', '192k', str(mp3_path)], check=True)
    if wav_path.exists():
        wav_path.unlink()
    return mp3_path

# ==================== 1. VERSIÓN ORIGINAL (LOOP PERFECTO) ====================

def make_version_original():
    """Versión super cercana y casi idéntica a la original: loop de 28.27s sin cortes, normalizado"""
    src_wav = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33\scratch\audio2.wav')
    sr, data = wavfile.read(str(src_wav))
    data_f = data.astype(np.float32) / 32768.0

    # 1 loop exacto de 8 compases
    loop1 = data_f[:LOOP_SAMPLES].copy()
    # Segundo ciclo del video si está disponible o repetido
    if len(data_f) >= DOUBLE_LOOP:
        loop2 = data_f[LOOP_SAMPLES : DOUBLE_LOOP].copy()
    else:
        loop2 = loop1.copy()

    # Concatenamos los dos ciclos para formar 28.267 segundos de track
    full = np.vstack([loop1, loop2])

    # Micro crossfade circular en la costura central y los extremos
    fade = int(SR * 0.015) # 15 ms
    tin = np.linspace(0, 1, fade)[:, None]
    tout = np.linspace(1, 0, fade)[:, None]

    # Suavizado en la unión entre compás 8 y 9
    full[LOOP_SAMPLES:LOOP_SAMPLES+fade] = full[LOOP_SAMPLES:LOOP_SAMPLES+fade] * tin + full[LOOP_SAMPLES-fade:LOOP_SAMPLES] * tout

    # Crossfade en bordes inicio-fin para loop infinito
    tail = full[-fade:].copy()
    head = full[:fade].copy()
    full[:fade] = head * tin + tail * tout

    # Limpieza de sub-frecuencias parásitas y normalización a -16 LUFS
    full[:, 0] = lp(hp(full[:, 0], 28.0), 18000.0)
    full[:, 1] = lp(hp(full[:, 1], 28.0), 18000.0)
    full = normalize_to_lufs(full, target_lufs=-16.0)

    mp3 = save_mp3(full, 'hypnotic_data_original')
    print(f"[1/3] Versión Original guardada: {mp3} ({len(full)/SR:.2f} s)")
    return mp3

# ==================== 2. VERSIÓN INTERMEDIA (HÍBRIDO JUEGO + VOCES ORIGINALES) ====================

def make_version_intermedia():
    """Versión intermedia: vocales y base original de Odetari + capas añadidas de sintetizadores, arpegios y bajo arcade"""
    src_wav = pathlib.Path(r'C:\Users\jesul\.gemini\antigravity\brain\e26a432e-2823-4399-8b3c-42d54762ee33\scratch\audio2.wav')
    sr, data = wavfile.read(str(src_wav))
    data_f = data.astype(np.float32) / 32768.0

    loop1 = data_f[:LOOP_SAMPLES].copy()
    loop2 = data_f[LOOP_SAMPLES : DOUBLE_LOOP].copy() if len(data_f) >= DOUBLE_LOOP else loop1.copy()
    base_audio = np.vstack([loop1, loop2])
    total_len = len(base_audio)

    # Creamos capas añadidas de sintetizador
    synth_layer = np.zeros_like(base_audio)

    # 1. Arpegio arcade estéreo sobre la progresión B minor / D# minor
    # Notas pentatónicas de apoyo: B3, D4, E4, F#4, A4, B4
    arp_notes = [59, 62, 64, 66, 69, 71, 74, 76]
    total_steps = int(DOUBLE_LOOP / (STEP_DUR * SR))
    
    for s in range(total_steps):
        t_start = s * STEP_DUR
        idx = int(t_start * SR)
        dur = STEP_DUR * 0.95
        n_samp = int(dur * SR)
        if idx + n_samp > total_len:
            break
        
        # Patrón rítmico punteado
        note = arp_notes[(s * 3) % len(arp_notes)]
        f0 = mtof(note)
        t_env = np.linspace(0, dur, n_samp, endpoint=False)
        # FM pluck
        mod = np.sin(2.0 * np.pi * f0 * 2.0 * t_env) * np.exp(-t_env * 25.0)
        carrier = np.sin(2.0 * np.pi * f0 * t_env + mod * 1.2) * np.exp(-t_env * 16.0)
        pan = np.sin(s * 0.9) * 0.6
        
        synth_layer[idx:idx+n_samp, 0] += carrier * (0.5 - pan * 0.5) * 0.22
        synth_layer[idx:idx+n_samp, 1] += carrier * (0.5 + pan * 0.5) * 0.22

    # 2. Refuerzo de Sub-Bajo 808 sintetizado en los tiempos fuertes
    # Caída suave en compases 1-4 y 9-12
    bar_dur = BEAT_DUR * 4.0
    for b in range(16):
        t_bar = b * bar_dur
        idx = int(t_bar * SR)
        dur_808 = BEAT_DUR * 2.0
        n_samp = int(dur_808 * SR)
        if idx + n_samp > total_len:
            break
        t_env = np.linspace(0, dur_808, n_samp, endpoint=False)
        f_808 = mtof(35 if b % 2 == 0 else 38) # B0 / D1
        sig_808 = np.sin(2.0 * np.pi * f_808 * t_env) * np.exp(-t_env * 3.5)
        sig_808 = np.tanh(sig_808 * 2.0) * 0.25
        synth_layer[idx:idx+n_samp, 0] += sig_808
        synth_layer[idx:idx+n_samp, 1] += sig_808

    # 3. Hi-Hat rolls arcade (32avos en compases pares)
    for b in range(16):
        if b % 2 == 1:
            t_roll = b * bar_dur + 14 * STEP_DUR
            idx = int(t_roll * SR)
            dur_hh = 0.04
            for roll_i in range(4):
                sub_idx = idx + int(roll_i * dur_hh * 0.6 * SR)
                n_hh = int(dur_hh * SR)
                if sub_idx + n_hh < total_len:
                    t_hh = np.linspace(0, dur_hh, n_hh, endpoint=False)
                    noise = hp(np.random.uniform(-1, 1, n_hh), 7500.0) * np.exp(-t_hh * 60.0) * 0.15
                    synth_layer[sub_idx:sub_idx+n_hh, 0] += noise
                    synth_layer[sub_idx:sub_idx+n_hh, 1] += noise

    # Mezcla balanceada: 75% pista original con voces + 25% capa de videojuego arcade
    mixed = base_audio * 0.78 + synth_layer * 0.65

    # Crossfade circular en extremos
    fade = int(SR * 0.015)
    tin = np.linspace(0, 1, fade)[:, None]
    tout = np.linspace(1, 0, fade)[:, None]
    mixed[:fade] = mixed[:fade] * tin + mixed[-fade:] * tout

    mixed[:, 0] = lp(hp(mixed[:, 0], 28.0), 17000.0)
    mixed[:, 1] = lp(hp(mixed[:, 1], 28.0), 17000.0)
    mixed = normalize_to_lufs(mixed, target_lufs=-16.0)

    mp3 = save_mp3(mixed, 'hypnotic_data_intermedio')
    print(f"[2/3] Versión Intermedia guardada: {mp3} ({len(mixed)/SR:.2f} s)")
    return mp3

# ==================== 3. VERSIÓN ARCADE / VIDEOJUEGO (100% SINTETIZADOR) ====================

def make_version_arcade():
    """Versión 100% sintetizada para videojuego: supersaws, arpegios retro, sub-bajo 808 y batería electrónica"""
    total_samples = DOUBLE_LOOP
    mix = np.zeros((total_samples, 2), dtype=np.float64)

    def add_sound(sound, start_time):
        idx = int(np.round(start_time * SR))
        end = idx + len(sound)
        if end > total_samples:
            sound = sound[:total_samples - idx]
            end = total_samples
        if idx < total_samples and len(sound) > 0:
            mix[idx:end] += sound

    # Batería electrónica estilo Dance / Phonk
    def kick_sound(dur=0.38):
        n = int(SR * dur)
        t = np.linspace(0, dur, n, endpoint=False)
        f_env = 190.0 * np.exp(-t * 38.0) + 52.0
        body = np.sin(2.0 * np.pi * np.cumsum(f_env) / SR)
        click = hp(np.random.uniform(-1, 1, n) * np.exp(-t * 140.0), 2000.0) * 0.4
        sig = np.tanh((body * 0.9 + click) * np.exp(-t * 9.0) * 1.8) * 0.85
        return np.column_stack([sig, sig])

    def snare_sound(dur=0.30):
        n = int(SR * dur)
        t = np.linspace(0, dur, n, endpoint=False)
        noise_l = bp(np.random.uniform(-1, 1, n), 800.0, 4200.0) * np.exp(-t * 22.0)
        noise_r = bp(np.random.uniform(-1, 1, n), 850.0, 4300.0) * np.exp(-t * 22.0)
        tone = np.sin(2.0 * np.pi * 230.0 * t) * np.exp(-t * 30.0) * 0.4
        return np.column_stack([(noise_l + tone) * 0.65, (noise_r + tone) * 0.65])

    def hat_sound(dur=0.06):
        n = int(SR * dur)
        t = np.linspace(0, dur, n, endpoint=False)
        sig = hp(np.random.uniform(-1, 1, n), 7000.0) * np.exp(-t * 70.0) * 0.35
        return np.column_stack([sig, sig])

    # Lead supersaw arcade
    def lead_supersaw(pitch, dur, vel=1.0, pan=0.0):
        n = int(SR * dur)
        t = np.linspace(0, dur, n, endpoint=False)
        f0 = mtof(pitch)
        out_l = np.zeros(n)
        out_r = np.zeros(n)
        for i, detune in enumerate([-0.015, 0.0, 0.015]):
            saw = signal.sawtooth(2.0 * np.pi * f0 * (1.0 + detune) * t)
            pan_v = (i - 1) * 0.35
            out_l += saw * (0.5 - pan_v * 0.5)
            out_r += saw * (0.5 + pan_v * 0.5)
        # ADSR
        env = np.exp(-t * 3.5)
        fc = min(f0 * 7.0, 13000.0)
        out_l = lp(out_l * env, fc) * vel * 0.35
        out_r = lp(out_r * env, fc) * vel * 0.35
        return np.column_stack([out_l * (0.5 - pan * 0.5), out_r * (0.5 + pan * 0.5)])

    # 1. Batería a 135.85 BPM
    bar_dur = BEAT_DUR * 4.0
    for bar in range(16):
        b_time = bar * bar_dur
        # Bombos en 1, 2, 3, 4 (Four on the floor / phonk drive)
        for beat in range(4):
            add_sound(kick_sound(), b_time + beat * BEAT_DUR)
        # Snares en 2 y 4
        add_sound(snare_sound(), b_time + 1 * BEAT_DUR)
        add_sound(snare_sound(), b_time + 3 * BEAT_DUR)
        # Hi-hats en corcheas y semicorcheas
        for s in range(16):
            vel = 1.0 if s % 2 == 1 else 0.5
            add_sound(hat_sound() * vel, b_time + s * STEP_DUR)
        # Redoble rápido al final de compases pares
        if bar % 2 == 1:
            add_sound(snare_sound(0.12) * 0.45, b_time + 15 * STEP_DUR)

    # 2. Bajo 808 pesado
    root_chords = [47, 47, 43, 45, 47, 47, 40, 42] # Bm, Bm, G, A, Bm, Bm, Em, F#m
    for bar in range(16):
        b_time = bar * bar_dur
        note = root_chords[bar % 8]
        # Bajo en tiempos 1, 2.5, 3, 4.5
        for s, dur_s in [(0, 3.5), (6, 2.0), (8, 3.5), (14, 2.0)]:
            t_s = b_time + s * STEP_DUR
            n_samp = int(dur_s * STEP_DUR * SR)
            t_env = np.linspace(0, dur_s * STEP_DUR, n_samp, endpoint=False)
            f_bass = mtof(note)
            sig = np.sin(2.0 * np.pi * f_bass * t_env) + 0.3 * np.sin(4.0 * np.pi * f_bass * t_env)
            sig = np.tanh(sig * 2.2) * np.exp(-t_env * 2.8) * 0.5
            add_sound(np.column_stack([sig, sig]), t_s)

    # 3. Melodía principal sintética (El gancho "Hypnotic Data")
    # Melodía de la frase vocal:
    # "Hyp-hyp-hyp... h-h-hypnotic, ah"
    # D5, D5, D5, C#5, B4, F#4, D5, B4...
    melody = [
        (0, 0, 74, 1.5, 1.0),  # D5 ("Hyp-")
        (0, 2, 74, 1.5, 0.9),  # D5 ("-hyp-")
        (0, 4, 74, 1.5, 1.0),  # D5 ("-hyp-")
        (0, 6, 73, 2.0, 0.95), # C#5 ("h-")
        (0, 8, 71, 3.0, 1.05), # B4  ("-hypnotic")
        (0, 12, 66, 2.0, 0.9), # F#4 ("ah")

        (1, 0, 74, 1.5, 1.0),  # D5 ("She")
        (1, 2, 73, 1.5, 0.9),  # C#5 ("not")
        (1, 4, 71, 2.0, 0.95), # B4  ("a gir-")
        (1, 6, 69, 2.0, 0.9),  # A4  ("-ly")
        (1, 8, 71, 3.0, 1.0),  # B4  ("girl")
        (1, 12, 73, 2.0, 0.95),# C#5 ("naughty")
        (1, 14, 74, 2.0, 1.0), # D5
    ]

    for cycle in range(4): # 4 frases de 2 compases = 8 compases (repetido en 16)
        base_b = cycle * 2
        for b_rel, s, note, dur_s, vel in melody:
            t = (base_b + b_rel) * bar_dur + s * STEP_DUR
            add_sound(lead_supersaw(note, dur_s * STEP_DUR * 1.2, vel=vel, pan=0.06), t)
            # Doblaje una octava abajo para grosor
            if cycle >= 1:
                add_sound(lead_supersaw(note - 12, dur_s * STEP_DUR, vel=vel * 0.45, pan=-0.06), t)

    # 4. Arpegios arcade de fondo
    scale = [59, 62, 64, 66, 69, 71, 74, 76]
    for bar in range(16):
        b_time = bar * bar_dur
        for s in range(16):
            if s % 2 == 1:
                t = b_time + s * STEP_DUR
                note = scale[(s * 2 + bar) % len(scale)] + 12
                dur = STEP_DUR * 0.8
                n = int(dur * SR)
                t_env = np.linspace(0, dur, n, endpoint=False)
                sig = np.sin(2.0 * np.pi * mtof(note) * t_env) * np.exp(-t_env * 20.0) * 0.18
                pan = np.sin(s * 1.2) * 0.6
                add_sound(np.column_stack([sig * (0.5 - pan * 0.5), sig * (0.5 + pan * 0.5)]), t)

    # Reverb sutil y masterizado
    ir_len = int(SR * 0.35)
    ir_t = np.linspace(0, 0.35, ir_len)
    ir = np.random.normal(0, 1, ir_len) * np.exp(-ir_t * 10.0)
    wet_l = signal.fftconvolve(hp(mix[:, 0], 350.0), ir)[:total_samples] * 0.05
    wet_r = signal.fftconvolve(hp(mix[:, 1], 350.0), ir)[:total_samples] * 0.05
    mix[:, 0] += wet_l
    mix[:, 1] += wet_r

    # Crossfade circular en extremos
    fade = int(SR * 0.015)
    tin = np.linspace(0, 1, fade)[:, None]
    tout = np.linspace(1, 0, fade)[:, None]
    mix[:fade] = mix[:fade] * tin + mix[-fade:] * tout

    mix[:, 0] = lp(hp(mix[:, 0], 28.0), 16500.0)
    mix[:, 1] = lp(hp(mix[:, 1], 28.0), 16500.0)
    mix = normalize_to_lufs(mix, target_lufs=-16.0)

    mp3 = save_mp3(mix, 'hypnotic_data_arcade')
    print(f"[3/3] Versión Arcade guardada: {mp3} ({len(mix)/SR:.2f} s)")
    return mp3

if __name__ == '__main__':
    print("Iniciando generación de las 3 versiones de HYPNOTIC DATA...")
    p1 = make_version_original()
    p2 = make_version_intermedia()
    p3 = make_version_arcade()
    print("¡Las 3 versiones fueron generadas exitosamente!")
