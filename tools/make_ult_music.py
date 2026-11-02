"""Genera la música de la ulti de cada personaje (musica/ulti/<id>.mp3, ~20 s): golpe de entrada, tema propio y golpe final.
Uso:  python tools/make_ult_music.py            -> todas (necesita numpy, scipy y ffmpeg)
      python tools/make_ult_music.py javi yuki  -> solo esas
Cada personaje tiene su receta en SPEC: tempo, tonalidad, escala, acordes, instrumentos y ritmos. Cambiar la semilla (seed) da otra melodía."""
import subprocess, wave, pathlib, sys
import numpy as np
from scipy import signal

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / 'musica' / 'ulti'

SCALES = {
    'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10], 'lydian': [0, 2, 4, 6, 7, 9, 11],
    'phrygian': [0, 1, 3, 5, 7, 8, 10], 'harmonic': [0, 2, 3, 5, 7, 8, 11], 'phrygdom': [0, 1, 4, 5, 7, 8, 10],
    'insen': [0, 1, 5, 7, 10], 'minpent': [0, 3, 5, 7, 10],
}

# ---------------------------------------------------------------- recetas
SPEC = {
    # Javicubito: lancero heroico -> épico orquestal (metales, cuerdas en ostinato, coro y taikos)
    'javi': dict(seed=11, bpm=152, root=50, scale='minor', prog=[1, 6, 3, 7, 1, 6, 4, 5], lead='brass', arp=('strings', 'ostinato'), pad='choir', bass=('saw', '8'),
                 drums=dict(kick='x.....x...x.....', snare='....x.......x...', taiko='x..x..x.x..x..x.', hat='x.x.x.x.x.x.x.x.'), mel='x...x.x.x...x...|x..x..x.x.......'),
    # Redbird: visor láser -> synthwave con arpegios y zaps
    'redbird': dict(seed=4, bpm=128, root=52, scale='minor', prog=[1, 6, 7, 5, 1, 6, 4, 5], lead='saw', arp=('square', 'up16'), pad='pad', bass=('saw', 'oct8'),
                    drums=dict(kick='x...x...x...x...', snare='....x.......x...', hat='..x...x...x...x.'), fx=['zap'], mel='x..x..x...x.x...|x.......x..x.x..'),
    # elGatopro300: ilusionista tramposo -> misterio con swing, vibráfono y pizzicato
    'gato': dict(seed=7, bpm=136, root=45, scale='harmonic', prog=[1, 4, 5, 1, 6, 4, 5, 5], lead='bell', arp=('pluck', 'stab'), pad='pad', bass=('sub', 'walk'), swing=.22,
                 drums=dict(kick='x.......x.......', clap='....x.......x...', hat='x..xx..xx..xx..x'), fx=['poof'], mel='x..x.x...x..x...|x.x.x.x.....x...'),
    # Sekza: águila -> vuelo épico en lidio, flauta, campanas y viento
    'sekza': dict(seed=3, bpm=140, root=53, scale='lydian', prog=[1, 2, 1, 5, 6, 2, 4, 5], lead='flute', arp=('bell', 'updown8'), pad='choir', bass=('sub', 'half'),
                  drums=dict(kick='x.......x.x.....', snare='....x.......x...', tom='...........x.xx.', hat='x.x.x.x.x.x.x.x.'), fx=['wind'], mel='x.......x...x...|x...x...x.......'),
    # Rocket: araña nocturna -> trap oscuro con 808 y caja de música inquietante
    'rocket': dict(seed=9, bpm=140, root=49, scale='phrygian', prog=[1, 2, 1, 7, 1, 2, 6, 7], lead='bell', pad='pad', bass=('808', 'trap'),
                   drums=dict(kick='x......x..x.....', snare='........x.......', hat='xxxxxxxxxxxxxxxx'), fx=['web'], mel='x..x..x.x.......|x..x..x...x.x...'),
    # ItzUkyo: espada de fuego -> japonés (escala in), koto, shakuhachi y taikos
    'ukyo': dict(seed=5, bpm=160, root=57, scale='insen', prog=[1, 1, 4, 5, 1, 1, 4, 2], lead='shaku', arp=('koto', 'updown8'), pad='pad', bass=('sub', '8'), chord='fifth',
                 drums=dict(taiko='x..x..x...x.x...', snare='....x.......x...', hat='x...x...x...x...'), fx=['fire'], mel='x.....x.x...x...|x...x.x.x.......'),
    # Mattux: velocista sónico -> eurobeat/chiptune a toda velocidad
    'mattux': dict(seed=2, bpm=176, root=52, scale='major', prog=[6, 4, 5, 1, 6, 4, 5, 5], lead='square', arp=('saw', 'stab'), pad='pad', bass=('saw', 'oct8'),
                   drums=dict(kick='x...x...x...x...', snare='....x.......x...', hat='..x...x...x...x.', hat2='x.x.x.x.x.x.x.x.'), fx=['chime'], mel='x.x.x.xx..x.x.x.|x.x.x...x.x.xx..'),
    # Seb0lla: humorista y su paquete misterioso -> marcha cómica saltarina con xilófono y kazoo
    'sebolla': dict(seed=6, bpm=128, root=48, scale='major', prog=[1, 6, 4, 5, 1, 6, 2, 5], lead='kazoo', arp=('bell', 'stab'), bass=('pluck', 'oompah'),
                    drums=dict(kick='x.......x.......', snare='....x.......x...', hat='..x...x...x...x.'), fx=['boing'], mel='x.xx.x..x.x.x...|x.x.x.x.x.......'),
    # ElRandi: sombras del Perú -> quena, charango rasgueado, cajón y coro oscuro
    'randi': dict(seed=8, bpm=112, root=50, scale='minor', prog=[1, 7, 6, 5, 1, 7, 6, 5], lead='flute', arp=('pluck', 'strum'), pad='choir', bass=('sub', 'half'),
                  drums=dict(cajon='x..x..x.x..x..x.', snare='....x.......x...', hat='x.x.x.x.x.x.x.x.'), fx=['shadow'], mel='x..x..x.x.......|x.x.x.x.x...x...'),
    # Jesuluto: computadora del caos -> chiptune con fallos (tartamudeos digitales)
    'jesuluto': dict(seed=10, bpm=150, root=57, scale='minor', prog=[1, 6, 3, 7, 1, 6, 4, 5], lead='square', arp=('square', 'chip'), bass=('tri', '8'),
                     drums=dict(kick='x.....x...x.....', snare='....x.......x...', hat='x.x.x.x.x.x.x.x.'), fx=['glitch'], chip=True, mel='x.x.x...x.x.x...|x..x..x.x.x.x...'),
}

# ---------------------------------------------------------------- utilidades
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)
def tt(dur): return np.arange(int(SR * dur)) / SR
def env(n, a=.01, d=.3, s=0.0, r=.05):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1) * (s + (1 - s) * np.exp(-t / max(d, 1e-4)))
    return e * np.clip((n / SR - t) / max(r, 1e-4), 0, 1)
def lp(x, fc, o=2): return signal.sosfilt(signal.butter(o, min(fc, SR * .45), 'low', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return signal.sosfilt(signal.butter(o, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return signal.sosfilt(signal.butter(2, [lo, min(hi, SR * .45)], 'band', fs=SR, output='sos'), x)

def additive(f, dur, amp_k, bright=0.0, vib=0.0, vib_delay=.15, maxk=40, top=9000, detune=0.0):
    t = tt(dur); out = np.zeros_like(t)
    vb = vib * np.clip((t - vib_delay) * 4, 0, 1) * np.sin(2 * np.pi * 5.2 * t)
    for d in ([0.0] if not detune else [-detune, detune]):
        ff = f * 2 ** (d / 1200)
        ph = 2 * np.pi * ff * t + 2 * np.pi * ff * np.cumsum(vb) / SR
        for k in range(1, maxk + 1):
            if ff * k > top: break
            a = amp_k(k)
            if a == 0: continue
            out += a * np.sin(k * ph) * (np.exp(-t * bright * (k - 1)) if bright else 1)
    return out / (2 if detune else 1)

SAW = lambda k: 1 / k
SQR = lambda k: (1 / k) if k % 2 else 0
TRI = lambda k: ((-1) ** ((k - 1) // 2)) / k ** 2 if k % 2 else 0

# ---------------------------------------------------------------- instrumentos melódicos
def inst(name, f, dur, vel=1.0):
    n = int(SR * dur)
    if n < 10: return np.zeros(1)
    if name == 'brass':
        x = additive(f, dur, SAW, bright=.9, vib=.004, maxk=24, detune=6); x = lp(x, 2600) * env(n, .05, .8, .7, .08); x = np.tanh(x * 1.6) * .7
    elif name == 'saw':
        x = additive(f, dur, SAW, vib=.005, maxk=30, detune=9); x = lp(x, 4200) * env(n, .008, .5, .6, .06)
    elif name == 'square':
        x = additive(f, dur, SQR, vib=.004, maxk=25, top=11000) * env(n, .003, .3, .55, .03) * .8
    elif name == 'tri':
        x = additive(f, dur, TRI, maxk=15) * env(n, .003, .4, .7, .03) * 1.4
    elif name in ('pluck', 'koto', 'harp', 'strings_p'):
        dec = {'pluck': 4.5, 'koto': 3.2, 'harp': 2.2}.get(name, 5)
        x = additive(f, dur, lambda k: 1 / k ** 1.15, bright=2.2, maxk=24) * env(n, .002, 1 / dec, 0, .04)
        if name == 'koto':   # el koto se dobla un poco hacia arriba al atacar
            x *= 1
    elif name == 'bell':
        t = tt(dur); x = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 6) * np.sin(2 * np.pi * f * 3.5 * t)) + .3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)
        x *= env(n, .002, .9, 0, .08) * .8
    elif name in ('flute', 'shaku'):
        t = tt(dur); vb = .006 * np.clip((t - .12) * 4, 0, 1) * np.sin(2 * np.pi * 5 * t)
        ph = 2 * np.pi * f * (t + np.cumsum(vb) / SR)
        x = np.sin(ph) + .22 * np.sin(2 * ph) + .08 * np.sin(3 * ph)
        br = bp(np.random.default_rng(int(f)).standard_normal(n), f * .9, f * 3.5) * (.5 if name == 'shaku' else .18)
        x = (x + br * (1.6 if name == 'shaku' else 1) * np.exp(-tt(dur) * 2)) * env(n, .05 if name == 'flute' else .09, 1.5, .8, .08) * .8
    elif name == 'kazoo':
        x = additive(f, dur, SAW, vib=.012, vib_delay=.05, maxk=30); x = bp(x, 500, 3200) * 2.4; x = np.tanh(x * 2) * env(n, .02, .5, .8, .05) * .55
    elif name == 'strings':
        x = additive(f, dur, SAW, maxk=20, detune=12); x = lp(x, 3000) * env(n, .01, .18, .25, .04)
    elif name == 'power':   # guitarra saturada: quinta y octava
        x = sum(additive(f * r, dur, SAW, maxk=14, detune=8) for r in (1, 1.5, 2)); x = lp(np.tanh(x * 4), 3200) * env(n, .003, .25, .5, .03) * .55
    elif name == 'pad':
        x = additive(f, dur, SAW, maxk=18, detune=14); x = lp(x, 1500) * env(n, .35, 2, .9, .4)
    elif name == 'choir':
        def vow(k):
            h = f * k; return (np.exp(-((h - 700) / 260) ** 2) + .6 * np.exp(-((h - 1150) / 300) ** 2) + .3 * np.exp(-((h - 2600) / 400) ** 2) + .15) / k ** .3
        x = additive(f, dur, vow, vib=.005, vib_delay=.3, maxk=30, detune=10) * env(n, .4, 2, .9, .45) * .9
    else:
        raise ValueError(name)
    return x * vel

def bass_note(kind, f, dur, vel=1.0):
    n = int(SR * dur); t = tt(dur)
    if kind == 'sub': return (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * env(n, .006, .6, .7, .05) * vel
    if kind == 'saw': return lp(additive(f, dur, SAW, maxk=20, detune=7), 900) * env(n, .004, .25, .6, .03) * 1.6 * vel
    if kind == 'tri': return additive(f, dur, TRI, maxk=11) * env(n, .003, .3, .8, .03) * 1.6 * vel
    if kind == 'pluck': return lp(additive(f, dur, lambda k: 1 / k ** 1.4, bright=1.5, maxk=12), 1200) * env(n, .004, .18, 0, .04) * 1.8 * vel
    if kind == 'dist': return lp(np.tanh(additive(f, dur, SAW, maxk=16, detune=10) * 4), 1100) * env(n, .005, .5, .8, .05) * .9 * vel
    if kind == 'reese': return lp(additive(f, dur, SAW, maxk=20, detune=22), 700) * env(n, .02, 1, .9, .06) * 1.8 * vel
    if kind == '808':
        fr = f * (1 + 1.5 * np.exp(-t * 30)); x = np.sin(2 * np.pi * np.cumsum(fr) / SR); return np.tanh(x * 1.6) * env(n, .002, .9, .4, .08) * vel
    if kind == 'wobble':
        lfo = .5 - .5 * np.cos(2 * np.pi * WOB_HZ * t)
        x = np.zeros(n)
        ph = 2 * np.pi * f * t
        for k in range(1, 30):
            cut = 120 + 2600 * lfo
            x += (1 / k) * np.sin(k * ph) / (1 + (f * k / cut) ** 4)
        return np.tanh(x * 2.2) * env(n, .01, 1, .9, .05) * .9 * vel
    raise ValueError(kind)
WOB_HZ = 4.0
import os
DEBUG = os.environ.get('ULT_DEBUG') == '1'

# ---------------------------------------------------------------- batería y efectos
rng0 = np.random.default_rng(1)
def noise(n): return rng0.standard_normal(n)
def drum(kind, vel=1.0, chip=False):
    if kind == 'kick':
        n = int(SR * .45); t = np.arange(n) / SR; fr = 48 + 110 * np.exp(-t * 28)
        x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 7) + hp(noise(n), 2000) * np.exp(-t * 90) * .25
        return np.tanh(x * 1.5) * vel
    if kind == 'snare':
        n = int(SR * .3); t = np.arange(n) / SR
        x = bp(noise(n), 1200, 8000) * np.exp(-t * 16) * .8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 22) * .6
        return x * vel
    if kind == 'clap':
        n = int(SR * .28); t = np.arange(n) / SR; e = np.zeros(n)
        for o in (0, .011, .022): e += (t >= o) * np.exp(-np.maximum(t - o, 0) * (60 if o < .02 else 14))
        return bp(noise(n), 900, 5000) * e * .7 * vel
    if kind in ('hat', 'hat2'):
        n = int(SR * .07); t = np.arange(n) / SR; return hp(noise(n), 7000) * np.exp(-t * 60) * .55 * vel
    if kind == 'tom':
        n = int(SR * .5); t = np.arange(n) / SR; fr = 95 + 80 * np.exp(-t * 12); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 6) * vel
    if kind == 'taiko':
        n = int(SR * .9); t = np.arange(n) / SR; fr = 62 + 50 * np.exp(-t * 14)
        return np.tanh((np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 4.5) + lp(noise(n), 900) * np.exp(-t * 25) * .5) * 1.8) * vel
    if kind == 'cajon':
        n = int(SR * .35); t = np.arange(n) / SR; fr = 80 + 60 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 10) + bp(noise(n), 1500, 5000) * np.exp(-t * 30) * .3) * vel
    raise ValueError(kind)

def chipify(x, bits=5, hold=3):   # suena a consola vieja: menos resolución y menos muestras
    y = np.repeat(x[::hold], hold)[:len(x)]; q = 2 ** bits; return np.round(y * q) / q

def fx(kind, dur):
    n = int(SR * dur); t = np.arange(n) / SR
    if kind == 'impact':
        fr = 30 + 90 * np.exp(-t * 6); boom = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 1.6)
        return np.tanh(boom * 2) * .9 + lp(noise(n), 3000) * np.exp(-t * 5) * .45 + hp(noise(n), 5000) * np.exp(-t * 1.4) * .12
    if kind == 'riser':
        x = noise(n); out = np.zeros(n); seg = 2048
        for i in range(0, n, seg):
            u = i / n; out[i:i + seg] = bp(x[i:i + seg], 300 + 5000 * u ** 2, 900 + 9000 * u ** 2)
        return out * (t / dur) ** 2 * .7
    if kind == 'zap': fr = 2400 * np.exp(-t * 14) + 120; return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 7) * .35
    if kind == 'poof': return bp(noise(n), 400, 3000) * np.exp(-t * 7) * (1 - np.exp(-t * 60)) * .45
    if kind == 'wind':
        lfo = .5 + .5 * np.sin(2 * np.pi * .25 * t); return lp(noise(n), 900) * (.15 + .25 * lfo) * .5
    if kind == 'web': return np.sin(2 * np.pi * (3200 - 2400 * t / dur) * t) * np.exp(-t * 12) * .12
    if kind == 'fire': return lp(noise(n), 1600) * (np.abs(lp(noise(n), 6)) * 6 + .2) * .12
    if kind == 'chime': return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 5) for f in (2093, 2637, 3136)) * .12
    if kind == 'boing': fr = 220 + 160 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 4) * .35
    if kind == 'shadow': return lp(noise(n), 300) * np.exp(-t * 1.5) * .35 + np.sin(2 * np.pi * 55 * t) * np.exp(-t * 2) * .2
    if kind == 'thunder': return lp(noise(n), 700) * (np.exp(-t * 1.8) * (1 + 2 * (np.abs(lp(noise(n), 8)) * 8))) * .25
    if kind == 'ice': return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (6 + i)) for i, f in enumerate((3520, 4186, 5274, 6272))) * .08
    if kind == 'rumble': return lp(noise(n), 160) * np.exp(-t * 1.2) * 1.2
    if kind == 'glitch': return np.zeros(n)
    raise ValueError(kind)

# ---------------------------------------------------------------- composición
def render(cid, S):
    rng = np.random.default_rng(S['seed'])
    meter = S.get('meter', 4); steps = 4 * meter            # semicorcheas por compás
    beat = 60 / S['bpm']; st = beat / 4; bar = beat * meter
    sc = SCALES[S['scale']]; nsc = len(sc); root = S['root']
    nbar = max(8, int(round(19 / bar / 4)) * 4)               # ~19 s de tema
    prog = (S['prog'] * 8)[:nbar]
    intro = bar; T0 = intro
    total = intro + nbar * bar + 3.2
    L = int(SR * total) + SR; mix = {k: np.zeros((L, 2)) for k in ('drums', 'bass', 'pad', 'arp', 'lead', 'fx', 'hit')}
    swing = S.get('swing', 0)
    def at(b, s): return T0 + b * bar + s * st + (swing * st if s % 2 else 0)
    def put(bus, x, t0, pan=0.0, g=1.0):
        i = int(t0 * SR); n = min(len(x), L - i)
        if n <= 0 or i < 0: return
        mix[bus][i:i + n, 0] += x[:n] * g * (1 - max(0, pan)); mix[bus][i:i + n, 1] += x[:n] * g * (1 + min(0, pan))
    def deg2midi(d, base):   # grado de la escala (0 = tónica) a nota MIDI
        o, r = divmod(d, nsc); return base + 12 * o + sc[r]
    def chord(dg):
        d = dg - 1
        if S.get('chord') == 'fifth' or nsc < 7: return [deg2midi(d, root), deg2midi(d, root) + 7, deg2midi(d, root) + 12]
        return [deg2midi(d, root), deg2midi(d + 2, root), deg2midi(d + 4, root)]
    chip = S.get('chip')
    def maybe_chip(x): return chipify(x) if chip else x

    # ---- entrada: golpe + subida
    put('hit', fx('impact', 2.4), 0, 0, .9)
    put('hit', fx('riser', intro), 0, 0, .5)
    c0 = chord(prog[0])
    for m in c0: put('pad', inst(S.get('pad') or 'pad', mtof(m + 12), intro + .2), 0, rng.uniform(-.4, .4), .16)
    for i in range(4): put('drums', drum('tom' if 'tom' in S['drums'] or 'taiko' not in S['drums'] else 'taiko', .6 + .1 * i), intro - beat + i * beat / 4, (-.3, .3, -.15, .15)[i], .7)

    # ---- batería
    G_DR = dict(kick=.9, snare=.55, clap=.5, hat=.16, hat2=.1, tom=.6, taiko=.75, cajon=.7)
    for b in range(nbar):
        last = b == nbar - 1
        for k, pat in S['drums'].items():
            kind = 'hat' if k == 'hat2' else k
            for s, ch in enumerate(pat):
                if ch != 'x': continue
                if last and s >= steps // 2 and kind in ('hat', 'hat2'): continue
                v = 1.0
                if kind in ('hat', 'hat2'): v = .7 + .3 * (s % 4 == 2) + rng.uniform(-.1, .1)
                x = drum(kind, v); x = maybe_chip(x)
                put('drums', x, at(b, s), {'hat': .25, 'hat2': -.25, 'tom': -.3, 'clap': .1}.get(k, 0), G_DR.get(k, .5))
        # redoble al final de cada frase de 4
        if b % 4 == 3:
            for s in range(steps - 4, steps): put('drums', maybe_chip(drum('snare', .4 + .15 * (s - steps + 4))), at(b, s), 0, .4)
    # ---- bajo
    bk, bp_ = S['bass']
    for b in range(nbar):
        r = chord(prog[b])[0]
        while r > root + 7: r -= 12
        r -= 12
        f = mtof(r); hits = []
        if bp_ == '8': hits = [(s, 2, f) for s in range(0, steps, 2)]
        elif bp_ == 'oct8': hits = [(s, 2, f * (2 if (s // 2) % 2 else 1)) for s in range(0, steps, 2)]
        elif bp_ == 'half': hits = [(0, steps // 2, f), (steps // 2, steps // 2, f)]
        elif bp_ in ('long', 'one'): hits = [(0, steps if bp_ == 'long' else steps, f)]
        elif bp_ == 'oompah': hits = [(0, 2, f), (4, 2, f * 1.5), (8, 2, f), (12, 2, f * 1.5)]
        elif bp_ == 'walk':
            nxt = chord(prog[(b + 1) % nbar])[0] - 12
            walk = [r, r + sc[2 % nsc], r + 7, nxt - 1 if nxt > r else nxt + 1]
            hits = [(i * 4, 3, mtof(w)) for i, w in enumerate(walk)]
        elif bp_ == 'trap':
            hits = [(s, 6, f) for s, ch in enumerate(S['drums']['kick']) if ch == 'x']
        for s, ln, ff in hits: put('bass', maybe_chip(bass_note(bk, ff, ln * st * .95)), at(b, s), 0, .5)
    # ---- acordes de fondo
    if S.get('pad'):
        for b in range(nbar):
            for i, m in enumerate(chord(prog[b])): put('pad', inst(S['pad'], mtof(m + 12), bar + .3), at(b, 0), (-.5, 0, .5)[i], .13)
    # ---- arpegio / ritmo de acompañamiento
    if S.get('arp'):
        ai, ap = S['arp']
        for b in range(nbar):
            c = chord(prog[b]); tones = [m + 12 for m in c] + [m + 24 for m in c]
            ev = []
            if ap == 'up16': ev = [(s, 1, [tones[s % 6]]) for s in range(steps)]
            elif ap == 'updown8': seq = tones[:4] + tones[4:2:-1] if len(tones) > 4 else tones; ev = [(s, 2, [seq[(s // 2) % len(seq)]]) for s in range(0, steps, 2)]
            elif ap == 'ostinato': seq = [c[0] + 12, c[0] + 12, c[0] + 19, c[0] + 24]; ev = [(s, 1, [seq[s % 4]]) for s in range(steps)]
            elif ap == 'stab': ev = [(s, 1, [m + 12 for m in c]) for s in range(2, steps, 4)]
            elif ap == 'strum': ev = [(s, 2, [m + 12 for m in c] + [c[0] + 24]) for s in range(0, steps, 2) if s % 8 != 6]
            elif ap == 'chip': ev = [(s, 1, [tones[(s * 2) % 3 + 3]]) for s in range(steps)]
            elif ap == 'sparse': ev = [(s, 4, [tones[(s // 3) % 6] + 12]) for s in (0, 3, 6, 10)]
            elif ap == '8': ev = [(s, 2, [c[0]]) for s in range(0, steps, 2)]
            for s, ln, ms in ev:
                for j, m in enumerate(ms):
                    x = inst(ai, mtof(m), ln * st * (1.6 if ai in ('bell', 'harp', 'koto', 'pluck') else .9), .9 - .1 * j)
                    put('arp', maybe_chip(x), at(b, s) + (j * .012 if ap == 'strum' else 0), (.35 if s % 4 < 2 else -.35), .13 / max(1, len(ms) ** .5))
    # ---- melodía: motivo de 2 compases que se repite sobre los acordes, la segunda mitad sube
    pat = S['mel'].split('|'); lo = S.get('lead_oct', 0)
    lead_base = root + 12 * (1 + lo) + (12 if root < 46 else 0)
    def onsets(p): return [i for i, ch in enumerate(p) if ch == 'x']
    motif = []; cur = 2 * nsc // 2 + 0
    for mb in range(2):
        os_ = onsets(pat[mb % len(pat)])
        ct = [(m - lead_base) for m in chord(prog[mb])]
        for i, s in enumerate(os_):
            nxt = os_[i + 1] if i + 1 < len(os_) else steps
            if s % 4 == 0:   # tiempo fuerte -> nota del acorde más cercana
                cands = []
                for o in (-12, 0, 12):
                    for c_ in ct:
                        for d in range(-nsc, 2 * nsc):
                            if deg2midi(d, 0) == c_ + o: cands.append(d)
                cur = min(cands, key=lambda d: abs(d - cur) + rng.uniform(0, 1.2)) if cands else cur
            else:
                cur += int(rng.choice([-2, -1, -1, 1, 1, 2]))
            cur = int(np.clip(cur, 0, int(nsc * 1.8)))
            motif.append((mb, s, nxt - s, cur))
    for b0 in range(0, nbar, 2):
        half = b0 >= nbar // 2
        shift = (prog[b0] - prog[0])
        if nsc < 7: shift = 0
        for mb, s, ln, d in motif:
            b = b0 + mb
            if b >= nbar: continue
            dd = d + (shift % nsc if shift else 0) + (2 if half else 0)
            if b == nbar - 1 and mb == 1 and s == motif[-1][1]: dd = nsc + (0 if not half else 0)   # cierre en la tónica
            m = deg2midi(dd, lead_base)
            dur = ln * st * (.92 if ln > 1 else .8)
            x = inst(S['lead'], mtof(m), dur + .08)
            put('lead', maybe_chip(x), at(b, s), rng.uniform(-.12, .12), .3)
            if half and S['lead'] in ('brass', 'saw', 'square', 'flute'):   # segunda mitad doblada una octava abajo: más grande
                put('lead', maybe_chip(inst(S['lead'], mtof(m - 12), dur + .08)), at(b, s), 0, .12)
    # ---- efectos propios
    for k in S.get('fx', []):
        for b in range(0, nbar, 2):
            if k == 'zap': put('fx', fx('zap', .4), at(b, 0), rng.uniform(-.6, .6), .9)
            elif k in ('poof', 'boing', 'chime', 'ice', 'web'): put('fx', fx(k, .8), at(b, steps - 4), rng.uniform(-.5, .5), .9)
            elif k in ('fire', 'wind') and b % 4 == 0: put('fx', fx(k, bar * 4), at(b, 0), 0, .8)
            elif k in ('shadow', 'thunder', 'rumble') and b % 4 == 0: put('fx', fx(k, bar * 2), at(b, 0), rng.uniform(-.3, .3), .8)
    # ---- final: golpe con el acorde de la tónica
    tend = at(nbar, 0)
    put('hit', fx('impact', 3), tend, 0, .9)
    for i, m in enumerate(chord(prog[0])):
        put('pad', inst(S.get('pad') or 'pad', mtof(m + 12), 2.8), tend, (-.5, 0, .5)[i], .18)
        put('lead', inst(S['lead'], mtof(m + 24 + 12 * lo), 1.6), tend, (-.3, 0, .3)[i], .14)
    put('drums', drum('taiko' if 'taiko' in S['drums'] else 'kick', 1), tend, 0, .9)
    put('drums', hp(noise(int(SR * 2.4)), 4000) * np.exp(-tt(2.4) * 1.7) * .3, tend, 0, 1)   # platillo

    # ---- mezcla
    # cada grupo a su volumen (medido en el tema, sin la entrada ni el final): la melodía al frente, batería y bajo detrás
    TGT = dict(drums=-15, bass=-17, pad=-22, arp=-21.5, lead=-14, fx=-23); TGT.update(S.get('mix', {}))
    a0, a1 = int(T0 * SR), int(at(nbar, 0) * SR)
    for k, db in TGT.items():
        r = np.sqrt((mix[k][a0:a1] ** 2).mean())
        if r > 1e-6: mix[k] *= 10 ** (db / 20) / r
    mix['hit'] *= .35
    out = sum(mix.values())
    if DEBUG: print(cid, {k: round(20 * np.log10(np.sqrt((mix[k] ** 2).mean()) + 1e-9), 1) for k in mix})
    # compresión lateral: todo baja un poco con cada bombo/taiko para que el golpe pegue
    side = np.abs(mix['drums'][:, 0]); side = lp(side, 12); out[:, 0] -= 0; out *= (1 / (1 + 1.2 * side))[:, None] ** .5
    # reverb
    irn = int(SR * 1.8); ti = np.arange(irn) / SR; ir = np.random.default_rng(3).standard_normal(irn) * np.exp(-ti * 3)
    wet = np.stack([signal.fftconvolve(hp(out[:, c] - mix['drums'][:, c] * .6, 300), ir)[:L] for c in (0, 1)], 1) * .025
    out = out + wet
    if 'glitch' in S.get('fx', []):   # tartamudeos digitales en algunos tiempos
        r2 = np.random.default_rng(S['seed'] + 1)
        for b in range(1, nbar, 2):
            s = int(r2.integers(8, steps - 2)); a = int(at(b, s) * SR); sl = int(st * SR / 2)
            piece = out[a:a + sl].copy()
            for k in range(1, 4): out[a + k * sl:a + (k + 1) * sl] = piece * (1 - .15 * k)
    for c in (0, 1): out[:, c] = lp(hp(out[:, c], 38), 15000)
    n_end = int(SR * (tend + 3.0)); out = out[:n_end]
    fade = int(SR * .6); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
    out *= (10 ** (-16.5 / 20)) / max(1e-6, np.sqrt((out[:int(SR * tend)] ** 2).mean()))   # un poco más fuerte que la música de pelea (-18)
    pk = np.abs(out).max()
    if pk > .85: out = np.tanh(out / .88) * .88   # limitador suave: igual en lo bajo, redondea solo los picos
    return out, tend + 3.0

def save(cid, out):
    OUT.mkdir(parents=True, exist_ok=True)
    wav = OUT / (cid + '.wav')
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1) * 32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(wav), '-q:a', '5', str(OUT / (cid + '.mp3'))], check=True)
    wav.unlink()

if __name__ == '__main__':
    ids = sys.argv[1:] or list(SPEC)
    for cid in ids:
        out, d = render(cid, SPEC[cid]); save(cid, out)
        print('listo: musica/ulti/%s.mp3 (%.1f s)' % (cid, d))
