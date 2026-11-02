"""Genera la canción de la pantalla de inicio de CalFight: lo-fi chill de atardecer (piano eléctrico, bajo, batería suave, disco de vinilo y una melodía sencilla).
Uso:  python tools/make_intro_music.py        -> musica/calfight_intro.mp3 (necesita numpy y ffmpeg)
Se puede cambiar la progresión (CHORDS), el tempo (BPM) o la melodía (MELODY) y volver a generarla."""
import subprocess, wave, pathlib
import numpy as np

SR = 44100
BPM = 74
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(7)
OUT = pathlib.Path(__file__).resolve().parent.parent / 'musica'

N = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def hz(name, octave):
    n = N[name[0]] + (1 if '#' in name else 0) - (1 if 'b' in name else 0)
    return 440 * 2 ** ((n + 12 * (octave - 4) - 9) / 12)

# acordes (nota raíz, voicing en semitonos sobre la raíz, octava de la raíz)
CHORDS = {
    'Fmaj7': ('F', [4, 7, 11, 16], 3), 'Em7': ('E', [3, 7, 10, 15], 3), 'Dm7': ('D', [3, 7, 10, 15], 3), 'Cmaj7': ('C', [4, 7, 11, 16], 3),
    'Am7': ('A', [3, 7, 10, 15], 2), 'Dm9': ('D', [3, 7, 10, 14], 3), 'G13': ('G', [4, 10, 14, 16], 2), 'Cmaj9': ('C', [4, 7, 11, 14], 3),
}
A = ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7']
B = ['Am7', 'Dm9', 'G13', 'Cmaj9']
PROG = A + A + B + B + A    # 20 compases
BARS = len(PROG)
L = int(SR * BAR * BARS)
tail = int(SR * 3.0)
buf = np.zeros((L + tail, 2))

def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    n = min(len(sig), buf.shape[0] - i)
    if n <= 0: return
    buf[i:i + n, 0] += sig[:n] * gain * (1 - max(0, pan))
    buf[i:i + n, 1] += sig[:n] * gain * (1 + min(0, pan))

def env(n, a=.01, d=.3, s=0.0, r=.05):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1) * (s + (1 - s) * np.exp(-t / d))
    rel = np.minimum(1, (n / SR - t) / max(r, 1e-4))
    return e * np.clip(rel, 0, 1)

def rhodes(f, dur, vel=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    tine = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t * 7) * np.sin(2 * np.pi * f * 14 * t)) * np.exp(-t * 5.5)   # parte metálica del ataque
    body = (np.sin(2 * np.pi * f * t) + .55 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 1.6) + .33 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 2.4) + .2 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 3.2))
    trem = 1 + .12 * np.sin(2 * np.pi * 4.6 * t)
    return (body * env(n, .006, 1.4, .25, .25) * trem + tine * .45) * vel * .14

def bass(f, dur):
    n = int(SR * dur); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .6 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4)) * env(n, .01, .4, .1, .08) * .4

def pluck(f, dur, vel=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4) + .2 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 7)
    return x * env(n, .004, .45, .0, .1) * vel * .22

def kick(vel=1.0):
    n = int(SR * .35); t = np.arange(n) / SR
    f = 70 + 80 * np.exp(-t * 34)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14) * .38 * vel

def snare(vel=1.0):
    n = int(SR * .28); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    lp = np.convolve(noise, np.ones(4) / 4, 'same') - np.convolve(noise, np.ones(40) / 40, 'same')   # ruido en banda media
    return (lp * np.exp(-t * 17) * .7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22) * .35) * vel * .6

def hat(vel=1.0):
    n = int(SR * .07); t = np.arange(n) / SR
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * np.exp(-t * 60) * .45 * vel

# ---- batería con swing
SW = .12
for bar in range(BARS):
    b0 = bar * BAR
    if bar < 1: continue                      # el primer compás entra solo el piano
    kicks = [0, 2.5] if bar % 2 == 0 else [0, 1.75, 2.5]
    for k in kicks: add(kick(.85), b0 + k * BEAT, 0, .9)
    for s_ in (1, 3): add(snare(.7), b0 + s_ * BEAT + .004, .05, .8)
    for i in range(8):
        off = (SW * BEAT if i % 2 else 0)
        add(hat(1 if i % 2 == 0 else .55), b0 + i * BEAT / 2 + off, .25 if i % 4 else -.2, .8)

# ---- piano eléctrico, bajo y melodía
MELODY = {   # (compás, tiempo, nota, octava, duración en tiempos)
    16: [(0, 'E', 5, 1.5), (1.5, 'G', 5, .5), (2, 'A', 5, 1.5), (3.5, 'G', 5, .5)], 17: [(0, 'E', 5, 2), (2.5, 'D', 5, 1.5)],
    18: [(0, 'C', 5, 1.5), (1.5, 'D', 5, .5), (2, 'E', 5, 2)], 19: [(0, 'G', 5, 3), (3, 'E', 5, 1)],
    8: [(0, 'A', 4, 1), (1, 'C', 5, 1), (2, 'E', 5, 2)], 9: [(0, 'D', 5, 1.5), (1.5, 'C', 5, .5), (2, 'A', 4, 2)],
    10: [(0, 'G', 4, 1), (1, 'B', 4, 1), (2, 'D', 5, 2)], 11: [(0, 'E', 5, 3.5)],
    12: [(0, 'A', 4, 1), (1, 'C', 5, 1), (2, 'E', 5, 2)], 13: [(0, 'F', 5, 1.5), (1.5, 'E', 5, .5), (2, 'D', 5, 2)],
    14: [(0, 'B', 4, 1), (1, 'D', 5, 1), (2, 'G', 5, 2)], 15: [(0, 'E', 5, 3.5)],
}
for bar, name in enumerate(PROG):
    root, voicing, octv = CHORDS[name]
    b0 = bar * BAR
    f0 = hz(root, octv)
    for k, semi in enumerate(voicing):
        add(rhodes(2 * f0 * 2 ** (semi / 12), BAR * .98, .75 + .05 * k), b0 + k * .028 + (SW * BEAT * .3 if bar % 2 else 0), -.25 + .17 * k, 1.0)
    if bar % 2 == 1 and bar > 3:   # repetición suave del acorde a contratiempo
        for k, semi in enumerate(voicing[:3]):
            add(rhodes(2 * f0 * 2 ** (semi / 12), BEAT * 1.2, .35), b0 + 2.5 * BEAT + k * .02, -.1 + .12 * k, .6)
    add(bass(f0 if octv > 2 else f0 * 2, BEAT * 1.9), b0, 0, 1.0)
    add(bass(f0 if octv > 2 else f0 * 2, BEAT * 1.2), b0 + 2.5 * BEAT, 0, .8)
    for (tb, nn, oc, d) in MELODY.get(bar, []):
        add(pluck(hz(nn, oc), d * BEAT, .9), b0 + tb * BEAT, .15, 1.0)
        add(pluck(hz(nn, oc), d * BEAT, .9) * .35, b0 + tb * BEAT + BEAT * .75, -.3, 1.0)   # eco

# ---- vinilo: ruido de fondo y chasquidos
n = buf.shape[0]
hiss = np.diff(rng.standard_normal(n + 1)); hiss = np.convolve(hiss, np.ones(3) / 3, 'same') * .006
buf[:, 0] += hiss; buf[:, 1] += np.roll(hiss, 500)
for _ in range(int(n / SR * 2.2)):
    i = int(rng.integers(0, n - 200)); a = float(rng.uniform(.01, .05)) * float(rng.choice([-1, 1]))
    buf[i:i + 60, :] += a * np.exp(-np.arange(60) / 9)[:, None]

# ---- reverb (respuesta de ruido que decae) y calidez
ir_n = int(SR * 2.2); t = np.arange(ir_n) / SR
ir = rng.standard_normal(ir_n) * np.exp(-t * 2.4); ir = np.convolve(ir, np.ones(6) / 6, 'same')
def conv(x):
    m = len(x) + ir_n; Nf = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, Nf) * np.fft.rfft(ir, Nf), Nf)[:len(x)]
wet = np.stack([conv(buf[:, 0]), conv(buf[:, 1])], 1) * .04
def _lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s_ = 0.0
    for i in range(len(x)): s_ = (1 - a) * x[i] + a * s_; y[i] = s_
    return y
for ch in (0, 1): wet[:, ch] = wet[:, ch] - _lp(wet[:, ch], 350)   # la reverb sin graves: no embarra
mix = buf + wet
# filtro paso bajo suave (cinta) y saturación
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def highpass(x, fc):   # quita el retumbo grave
    return x - lowpass(x, fc)
for ch in (0, 1): mix[:, ch] = lowpass(highpass(mix[:, ch], 110), 9500)
# bucle sin corte: la cola del final se suma al principio
mix[:tail] += mix[L:L + tail]; mix = mix[:L]
fade = int(SR * .02); mix[:fade] *= np.linspace(0, 1, fade)[:, None]; mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
mix *= (10 ** (-19.5 / 20)) / max(1e-6, np.sqrt((mix ** 2).mean()))   # mismo volumen que las otras canciones (RMS -19 dB)
mix = np.clip(mix, -.9, .9)

OUT.mkdir(exist_ok=True)
wav = OUT / 'calfight_intro.wav'
with wave.open(str(wav), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-q:a', '4', str(OUT / 'calfight_intro.mp3')], check=True)
wav.unlink()
print('listo: musica/calfight_intro.mp3 (%.0f s)' % (L / SR))
