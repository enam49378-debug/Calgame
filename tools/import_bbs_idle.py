"""Convierte la idle base de Javi hecha en BBS (idle.json, parseado de idle.dat) a un clip del juego (60 fps, bucle) y la mete en JAVI_BB_DATA.idle.
Unidades BBS: rotación en radianes, traslación en píxeles, 20 ticks por segundo, interpolación hermite. BBS mira a -Z y el juego a +Z (giro de 180° en Y): rot [-x,y,-z], pos [-x,y,-z]."""
import json, math, sys
S = 'C:/Users/jesul/AppData/Local/Temp/claude/F--ytm-auramusic/85d62d7c-802e-4302-ad22-a37f30982632/scratchpad'
SZ = int(sys.argv[1]) if len(sys.argv) > 1 else 1   # signo de la rotación z (para probar)
d = json.load(open(S + '/bbs/idle.json'))
pr = d['replays'][0]['properties']
LEN = 120 / 20.0
# bone -> (canales de rotación, canales de posición)
MAP = {'head': (['hx', 'hy', 'hz'], ['hpx', 'hpy', 'hpz']), 'low_body': (['ix', 'iy', 'iz'], ['bx', 'by', 'bz']),
       'left_arm': (['alx', 'aly', 'alz'], ['alpx', 'alpy', 'alpz']), 'right_arm': (['arx', 'ary', 'arz'], ['arpx', 'arpy', 'arpz']),
       'left_leg': (['llx', None, 'llz'], ['llpx', 'llpy', 'llpz']), 'right_leg': (['lrx', None, 'lrz'], ['lrpx', 'lrpy', 'lrpz'])}
tracks = {}   # canal -> [(t, v)]
for prop in pr.values():
    for kf in prop['keyframes']:
        t = kf['tick'] / 20.0
        for bone, bv in kf['value']['pose'].items():
            if bone not in MAP: continue
            rn, pn = MAP[bone]
            if 'r' in bv:
                v = [-bv['r'][0], bv['r'][1], -bv['r'][2]]   # BBS mira a -Z y el juego a +Z: giro de 180° en Y
                for n, x in zip(rn, v):
                    if n: tracks.setdefault(n, []).append((t, x))
            if 't' in bv:
                v = [-bv['t'][0], bv['t'][1], -bv['t'][2]]
                for n, x in zip(pn, v):
                    if n: tracks.setdefault(n, []).append((t, x))
for n in tracks: tracks[n].sort()


def at(keys, t):
    """Catmull-Rom periódico (el clip es un bucle: el último cuadro repite el primero)."""
    ts = [k[0] for k in keys]; vs = [k[1] for k in keys]
    if len(keys) == 1: return vs[0]
    if ts[-1] >= LEN - 1e-6 and abs(vs[-1] - vs[0]) < 1e-9: ts, vs = ts[:-1], vs[:-1]   # quita el cuadro repetido
    n = len(ts); t = t % LEN
    i = max([j for j in range(n) if ts[j] <= t] or [n - 1])
    t0 = ts[i]; t1 = ts[(i + 1) % n] + (LEN if i + 1 >= n else 0)
    tm = ts[(i - 1) % n] - (LEN if i - 1 < 0 else 0); tp = ts[(i + 2) % n] + (LEN if i + 2 >= n else 0) + (LEN if (i + 2) // n > 1 else 0)
    if t < t0: t += LEN
    p0, p1 = vs[i], vs[(i + 1) % n]; pm, pp = vs[(i - 1) % n], vs[(i + 2) % n]
    h = t1 - t0; u = (t - t0) / h
    m0 = (p1 - pm) / (t1 - tm) * h; m1 = (pp - p0) / (tp - t0) * h   # tangentes (no uniformes)
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1


chans = sorted(tracks)
rows = []
for i in range(int(LEN * 60) + 1):
    t = i / 60
    rows.append([round(t, 6)] + [round(at(tracks[c], t), 6) for c in chans])
clip = {'length': LEN, 'loop': True, 'contacts': [], 'channels': chans, 'samples': rows}

p = S + '/blockstrike.html'
s = open(p, encoding='utf-8').read()
a = s.index('const JAVI_BB_DATA = ') + len('const JAVI_BB_DATA = ')
b = s.index(';\n/* JAVI_BLOCKBENCH_DATA_END */')
D = json.loads(s[a:b])
if 'idle_anterior' not in D: D['idle_anterior'] = D['idle']
D['idle'] = clip
s = s[:a] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok', chans, len(rows), 'cuadros')
