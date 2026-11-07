"""
Generador de las 3 versiones INSTRUMENTALES (SIN VOZ) de HYPNOTIC DATA para BlockStrike / CalFight
con 'los choques' (bombos, claps, stabs distorsionados y bajos 808) mucho más idénticos y contundentes.

1. musica/hypnotic_choques_identico.mp3  : Instrumental Phonk de Máxima Pegada (Choques idénticos al tema de Odetari, sin voz)
2. musica/hypnotic_choques_intermedio.mp3 : Instrumental Intermedio (Choques pesados + capas melódicas arcade de juego)
3. musica/hypnotic_choques_arcade.mp3     : Instrumental Retro Chiptune Hardcore (Sonido 16-bit agresivo con choques pesados)
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

# ==================== SÍNTESIS DE LOS "CHOQUES" IDÉNTICOS ====================

def make_phonk_kick(dur=0.35):
    """El choque del bombo: pegada seca, transitorio afilado y sub-grave profundo con pegada de club"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    # Caída violenta de tono de 240Hz a 46Hz para el impacto ("choque")
    f_env = 240.0 * np.exp(-t * 45.0) + 46.0
    phase = 2.0 * np.pi * np.cumsum(f_env) / SR
    body = np.sin(phase)
    # Golpe transitorio (click agresivo de ataque a 2.4 kHz)
    click = hp(np.random.uniform(-1, 1, n) * np.exp(-t * 160.0), 2200.0) * 0.55
    # Envolvente
    amp = np.exp(-t * 8.5)
    sig = (body * 0.85 + click) * amp
    # Saturación dura para darle el golpe seco y pesado característico
    sig = np.tanh(sig * 2.4) * 0.90
    return np.column_stack([sig, sig])

def make_chord_stab(chord_midi, dur=0.28, brightness=1.0):
    """El choque armónico: acorde de sintetizador supersaw distorsionado que golpea junto con el bombo"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    sig_l = np.zeros(n)
    sig_r = np.zeros(n)
    
    # Voces desafinadas en estéreo para cada nota del acorde
    for pitch in chord_midi:
        f0 = mtof(pitch)
        for i, det in enumerate([-0.018, 0.0, 0.018]):
            saw = signal.sawtooth(2.0 * np.pi * f0 * (1.0 + det) * t)
            pan = (i - 1) * 0.45
            sig_l += saw * (0.5 - pan * 0.5)
            sig_r += saw * (0.5 + pan * 0.5)
            
    # Envolvente de choque: ataque instantáneo, caída rápida
    env = np.exp(-t * 12.0)
    fc = min(8000.0 * brightness, 14000.0)
    sig_l = lp(sig_l * env, fc)
    sig_r = lp(sig_r * env, fc)
    
    # Overdrive / distorsión cálida del phonk (el crunch del choque)
    sig_l = np.tanh(sig_l * 0.40 * 2.8) * 0.75
    sig_r = np.tanh(sig_r * 0.40 * 2.8) * 0.75
    return np.column_stack([sig_l, sig_r])

def make_phonk_clap(dur=0.30):
    """Clap estéreo cortante y brillante en tiempos 2 y 4"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    noise_l = bp(np.random.uniform(-1, 1, n), 750.0, 4800.0)
    noise_r = bp(np.random.uniform(-1, 1, n), 800.0, 5000.0)
    
    # Pre-claps múltiples (flam)
    env = np.zeros(n)
    for offset in [0.0, 0.010, 0.020]:
        idx = int(offset * SR)
        dur_s = 0.012
        sub_n = min(int(SR * dur_s), n - idx)
        if sub_n > 0:
            sub_t = np.linspace(0, dur_s, sub_n, endpoint=False)
            env[idx:idx+sub_n] += np.exp(-sub_t * 260.0) * 0.5
            
    main_idx = int(0.025 * SR)
    if main_idx < n:
        main_t = np.linspace(0, dur - 0.025, n - main_idx, endpoint=False)
        env[main_idx:] += np.exp(-main_t * 19.0) * 0.95
        
    tone = np.sin(2.0 * np.pi * 220.0 * t) * np.exp(-t * 32.0) * 0.35
    out_l = (noise_l * env + tone) * 0.75
    out_r = (noise_r * env + tone) * 0.75
    return np.column_stack([out_l, out_r])

def make_phonk_hat(dur=0.06, open_h=False):
    """Hi-hat metálico afilado"""
    dur_act = 0.22 if open_h else dur
    n = int(SR * dur_act)
    t = np.linspace(0, dur_act, n, endpoint=False)
    noise = hp(np.random.uniform(-1, 1, n), 8200.0)
    decay = 16.0 if open_h else 65.0
    sig = noise * np.exp(-t * decay) * 0.35
    return np.column_stack([sig, sig])

def make_808_sub(pitch, dur, slide_to=None):
    """Sub-bajo 808 analógico saturado que acompaña y sostiene los choques"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    f0 = mtof(pitch)
    if slide_to is not None:
        f_end = mtof(slide_to)
        freqs = np.linspace(f0, f_end, n)
    else:
        freqs = f0 * (1.0 + 0.25 * np.exp(-t * 35.0))
        
    phase = 2.0 * np.pi * np.cumsum(freqs) / SR
    sub = np.sin(phase) + 0.25 * np.sin(phase * 2.0)
    env = np.exp(-t * 2.2)
    sig = np.tanh(sub * env * 2.4) * 0.75
    sig = lp(sig, 380.0)
    return np.column_stack([sig, sig])

def make_instrumental_lead(pitch, dur, vel=1.0, pan=0.0):
    """Sintetizador solista que reemplaza la voz humana tocando la melodía de Hypnotic Data"""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    f0 = mtof(pitch)
    # Onda combinada pulse + saw
    pulse = signal.square(2.0 * np.pi * f0 * t, duty=0.35)
    saw = signal.sawtooth(2.0 * np.pi * (f0 * 1.008) * t)
    sig = pulse * 0.45 + saw * 0.55
    env = np.exp(-t * 4.0)
    sig = lp(sig * env, min(f0 * 6.0, 11000.0)) * vel * 0.30
    left_gain = (0.5 - pan * 0.5)
    right_gain = (0.5 + pan * 0.5)
    return np.column_stack([sig * left_gain, sig * right_gain])

# ==================== RENDERIZADORES DE LAS 3 VERSIONES INSTRUMENTALES ====================

def render_instrumental_version(style='identico'):
    """
    Construye la pista instrumental completa (16 compases, 28.27s en loop exacto).
    style:
      - 'identico'   : Choques súper idénticos, máxima pegada, acorde stab pesado, 100% instrumental
      - 'intermedio' : Choques pesados + capas de arpegios y sintetizadores arcade
      - 'arcade'     : Choques contundentes con sonido 16-bit / chiptune agresivo
    """
    total_samples = DOUBLE_LOOP
    mix = np.zeros((total_samples, 2), dtype=np.float64)

    def add(sound, start_time):
        idx = int(np.round(start_time * SR))
        end = idx + len(sound)
        if end > total_samples:
            sound = sound[:total_samples - idx]
            end = total_samples
        if idx < total_samples and len(sound) > 0:
            mix[idx:end] += sound

    bar_dur = BEAT_DUR * 4.0
    total_bars = 16

    # Acordes de HYPNOTIC DATA por compás (Bm -> Bm -> G -> A / F#m)
    # Bm: [B2 (47), B3 (59), D4 (62), F#4 (66), B4 (71)]
    # G : [G2 (43), G3 (55), B3 (59), D4 (62), G4 (67)]
    # Em: [E2 (40), E3 (52), G3 (55), B3 (59), E4 (64)]
    # F#: [F#2 (42), F#3 (54), A#3 (58), C#4 (61), F#4 (66)]
    chords = [
        [47, 59, 62, 66, 71], # Bm
        [47, 59, 62, 66, 71], # Bm
        [43, 55, 59, 62, 67], # G
        [42, 54, 58, 61, 66], # F#
        [47, 59, 62, 66, 71], # Bm
        [47, 59, 62, 66, 71], # Bm
        [40, 52, 55, 59, 64], # Em
        [42, 54, 58, 61, 66], # F#
    ]
    bass_roots = [47, 47, 43, 42, 47, 47, 40, 42]

    # 1. LOS CHOQUES (BOMBO + ACORDE STAB + SUB-BAJO EN CADA TIEMPO FUERTE)
    for bar in range(total_bars):
        b_time = bar * bar_dur
        chord = chords[bar % 8]
        root = bass_roots[bar % 8]

        for beat in range(4):
            t_beat = b_time + beat * BEAT_DUR
            
            # EL CHOQUE DEL BOMBO
            add(make_phonk_kick(), t_beat)
            
            # EL CHOQUE DEL ACORDE STAB (El golpe armónico que pedía el usuario)
            stab_gain = 1.1 if style == 'identico' else (0.9 if style == 'intermedio' else 0.75)
            brightness = 1.1 if style == 'identico' else 0.85
            add(make_chord_stab(chord, dur=0.26, brightness=brightness) * stab_gain, t_beat)
            
            # SUB-BAJO 808 EN CADA CHOQUE
            add(make_808_sub(root, dur=BEAT_DUR * 0.95), t_beat)

            # En el estilo idéntico o intermedio: contragolpe sincopado en paso 11 (tiempo 3.5)
            if beat == 2 and bar % 2 == 1:
                t_sub = b_time + 10 * STEP_DUR
                add(make_phonk_kick() * 0.85, t_sub)
                add(make_chord_stab(chord, dur=0.20) * 0.75, t_sub)
                add(make_808_sub(root + 3, dur=STEP_DUR * 2.0, slide_to=root), t_sub)

        # CLAPS EN TIEMPOS 2 Y 4
        add(make_phonk_clap(), b_time + 1 * BEAT_DUR)
        add(make_phonk_clap(), b_time + 3 * BEAT_DUR)

        # HI-HATS
        for s in range(16):
            vel = 0.9 if s % 2 == 1 else 0.45
            is_open = (s == 6 or s == 14) and (bar % 2 == 1)
            add(make_phonk_hat(open_h=is_open) * vel, b_time + s * STEP_DUR)

        # Redobles rápidos de hi-hats (32avos) en compases pares
        if bar % 2 == 1:
            for r in range(4):
                t_r = b_time + 14 * STEP_DUR + r * (STEP_DUR / 2.0)
                add(make_phonk_hat(dur=0.03) * 0.55, t_r)

    # 2. MELODÍA INSTRUMENTAL SINTETIZADA (REEMPLAZA LA VOZ AL 100%)
    # D5, D5, D5, C#5, B4, F#4, D5, B4...
    melody_pattern = [
        (0, 0, 74, 1.5, 1.0),  # D5 ("Hyp-")
        (0, 2, 74, 1.5, 0.95), # D5 ("-hyp-")
        (0, 4, 74, 1.5, 1.0),  # D5 ("-hyp-")
        (0, 6, 73, 2.0, 0.95), # C#5 ("h-")
        (0, 8, 71, 3.0, 1.1),  # B4  ("-hypnotic")
        (0, 12, 66, 2.0, 0.9), # F#4 ("ah")

        (1, 0, 74, 1.5, 1.0),  # D5 ("She")
        (1, 2, 73, 1.5, 0.9),  # C#5 ("not")
        (1, 4, 71, 2.0, 0.95), # B4  ("a gir-")
        (1, 6, 69, 2.0, 0.9),  # A4  ("-ly")
        (1, 8, 71, 3.0, 1.05), # B4  ("girl")
        (1, 12, 73, 2.0, 0.95),# C#5 ("naughty")
        (1, 14, 74, 2.0, 1.0), # D5
    ]

    for cycle in range(4): # 8 compases repetidos 2 veces = 16 compases
        base_b = cycle * 2
        for b_rel, s, note, dur_s, vel in melody_pattern:
            t = (base_b + b_rel) * bar_dur + s * STEP_DUR
            lead_pan = 0.08 if cycle % 2 == 0 else -0.08
            add(make_instrumental_lead(note, dur_s * STEP_DUR * 1.15, vel=vel, pan=lead_pan), t)
            # Doblaje en octava baja en la segunda mitad para cuerpo
            if cycle >= 2:
                add(make_instrumental_lead(note - 12, dur_s * STEP_DUR, vel=vel * 0.45, pan=-lead_pan), t)

    # 3. CAPAS ESPECIALES SEGÚN EL ESTILO
    if style == 'intermedio':
        # Arpegios de apoyo arcade
        arp_scale = [59, 62, 64, 66, 69, 71, 74, 76]
        for bar in range(total_bars):
            b_time = bar * bar_dur
            for s in range(16):
                if s % 2 == 1:
                    t = b_time + s * STEP_DUR
                    note = arp_scale[(s * 3 + bar) % len(arp_scale)]
                    f0 = mtof(note)
                    t_env = np.linspace(0, STEP_DUR * 0.9, int(STEP_DUR * 0.9 * SR), endpoint=False)
                    pluck = np.sin(2.0 * np.pi * f0 * t_env) * np.exp(-t_env * 22.0) * 0.16
                    pan = np.sin(s * 1.1) * 0.6
                    add(np.column_stack([pluck * (0.5 - pan * 0.5), pluck * (0.5 + pan * 0.5)]), t)

    elif style == 'arcade':
        # Añade textura de onda cuadrada y ruidos de salto/retro
        for bar in range(total_bars):
            b_time = bar * bar_dur
            if bar % 4 == 3:
                # Fill de redoble arcade
                for step in range(8, 16):
                    t = b_time + step * STEP_DUR
                    zap = signal.sawtooth(2.0 * np.pi * np.linspace(800, 150, int(0.04 * SR))) * 0.18
                    add(np.column_stack([zap, zap]), t)

    # 4. SIDECHAIN COMPRESSION (EL EFECTO BOMBA DE LOS CHOQUES)
    # Cada vez que pega el bombo/choque, la mezcla se comprime ligeramente para darle esa pegada brutal
    kick_track = np.abs(mix[:, 0])
    sidechain_env = lp(kick_track, 14.0)
    duck = (1.0 / (1.0 + 1.8 * sidechain_env))[:, None] ** 0.5
    mix = mix * duck

    # 5. REVERB Y MASTERIZACIÓN
    ir_len = int(SR * 0.32)
    ir_t = np.linspace(0, 0.32, ir_len)
    ir = np.random.normal(0, 1, ir_len) * np.exp(-ir_t * 11.0)
    wet_l = signal.fftconvolve(hp(mix[:, 0], 350.0), ir)[:total_samples] * 0.04
    wet_r = signal.fftconvolve(hp(mix[:, 1], 350.0), ir)[:total_samples] * 0.04
    mix[:, 0] += wet_l
    mix[:, 1] += wet_r

    # Crossfade circular en extremos para loop continuo sin cortes
    fade = int(SR * 0.015)
    tin = np.linspace(0, 1, fade)[:, None]
    tout = np.linspace(1, 0, fade)[:, None]
    mix[:fade] = mix[:fade] * tin + mix[-fade:] * tout

    mix[:, 0] = lp(hp(mix[:, 0], 28.0), 16800.0)
    mix[:, 1] = lp(hp(mix[:, 1], 28.0), 16800.0)

    # Normalización al estándar del juego (-16.0 LUFS)
    rms = np.sqrt(np.mean(mix ** 2))
    target_rms = 10.0 ** (-15.8 / 20.0)
    if rms > 1e-5:
        mix = mix * (target_rms / rms)
    peak = np.max(np.abs(mix))
    if peak > 0.88:
        mix = np.tanh(mix / 0.90) * 0.88

    return mix

def main():
    print("Iniciando generación de las 3 versiones INSTRUMENTALES (SIN VOZ) con choques idénticos...")

    # Versión 1: Choques idénticos Phonk puro
    v1 = render_instrumental_version('identico')
    p1_wav = OUT_DIR / 'hypnotic_choques_identico.wav'
    p1_mp3 = OUT_DIR / 'hypnotic_choques_identico.mp3'
    wavfile.write(str(p1_wav), SR, (v1 * 32767.0).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-i', str(p1_wav), '-b:a', '192k', str(p1_mp3)], check=True)
    if p1_wav.exists(): p1_wav.unlink()
    print("[1/3] Versión 1 (Choques Idénticos Sin Voz):", p1_mp3)

    # Versión 2: Intermedio (Choques + Arcade)
    v2 = render_instrumental_version('intermedio')
    p2_wav = OUT_DIR / 'hypnotic_choques_intermedio.wav'
    p2_mp3 = OUT_DIR / 'hypnotic_choques_intermedio.mp3'
    wavfile.write(str(p2_wav), SR, (v2 * 32767.0).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-i', str(p2_wav), '-b:a', '192k', str(p2_mp3)], check=True)
    if p2_wav.exists(): p2_wav.unlink()
    print("[2/3] Versión 2 (Intermedio Choques + Arcade Sin Voz):", p2_mp3)

    # Versión 3: Arcade Retro Hardcore
    v3 = render_instrumental_version('arcade')
    p3_wav = OUT_DIR / 'hypnotic_choques_arcade.wav'
    p3_mp3 = OUT_DIR / 'hypnotic_choques_arcade.mp3'
    wavfile.write(str(p3_wav), SR, (v3 * 32767.0).astype(np.int16))
    subprocess.run(['ffmpeg', '-y', '-i', str(p3_wav), '-b:a', '192k', str(p3_mp3)], check=True)
    if p3_wav.exists(): p3_wav.unlink()
    print("[3/3] Versión 3 (Arcade Hardcore Sin Voz):", p3_mp3)

    print("¡Las 3 versiones instrumentales con choques idénticos fueron generadas con éxito!")

if __name__ == '__main__':
    main()
