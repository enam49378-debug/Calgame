"""Convierte una película BBS (json de bbsparse.py) en un clip de JAVI_BB_DATA (60 fps).
Uso: python import_bbs_clip.py <json> <nombre_clip> [loop|once|auto]
Unidades BBS: rotación en radianes, traslación en píxeles, 20 ticks/s, interpolación hermite.
BBS mira a -Z y el juego a +Z (giro de 180° en Y): rot [-x,y,-z], pos [-x,y,-z]."""
import json, sys
S = 'C:/Users/jesul/AppData/Local/Temp/claude/F--ytm-auramusic/85d62d7c-802e-4302-ad22-a37f30982632/scratchpad'
src, name = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else 'auto'
d = json.load(open(src))
pr = d['replays'][0]['properties']
MAP = {'head': (['hx', 'hy', 'hz'], ['hpx', 'hpy', 'hpz']), 'low_body': (['ix', 'iy', 'iz'], ['bx', 'by', 'bz']),
       'left_arm': (['alx', 'aly', 'alz'], ['alpx', 'alpy', 'alpz']), 'right_arm': (['arx', 'ary', 'arz'], ['arpx', 'arpy', 'arpz']),
       'left_leg': (['llx', None, 'llz'], ['llpx', 'llpy', 'llpz']), 'right_leg': (['lrx', None, 'lrz'], ['lrpx', 'lrpy', 'lrpz'])}
tracks = {}
last = 0
for pname, prop in pr.items():
    if pname.split('/')[0].isdigit(): continue   # pistas de las partes (ojos, lanza): no son del cuerpo
    for kf in prop['keyframes']:
        t = kf['tick'] / 20.0; last = max(last, t)
        pose = kf['value'].get('pose') if isinstance(kf['value'], dict) else None
        for bone, bv in (pose or {}).items():
            if bone not in MAP: continue
            rn, pn = MAP[bone]
            if 'r' in bv:
                for n, x in zip(rn, [-bv['r'][0], bv['r'][1], -bv['r'][2]]):
                    if n: tracks.setdefault(n, {})[t] = x
            if 't' in bv:
                for n, x in zip(pn, [-bv['t'][0], bv['t'][1], -bv['t'][2]]):
                    if n: tracks.setdefault(n, {})[t] = x
LEN = last
tr = {n: sorted(v.items()) for n, v in tracks.items()}
if mode == 'auto':   # es bucle si todos los canales con movimiento terminan donde empezaron
    mode = 'loop' if all(abs(k[0][1] - k[-1][1]) < 1e-4 for k in tr.values() if len(k) > 1 and abs(k[-1][0] - LEN) < 1e-6) else 'once'
LOOP = mode == 'loop'


def at(keys, t):
    ts = [k[0] for k in keys]; vs = [k[1] for k in keys]; n = len(ts)
    if n == 1: return vs[0]
    if LOOP and abs(ts[-1] - LEN) < 1e-6 and abs(vs[-1] - vs[0]) < 1e-4: ts, vs = ts[:-1], vs[:-1]; n -= 1
    if LOOP:
        t = t % LEN
        i = max([j for j in range(n) if ts[j] <= t] or [n - 1])
        g = lambda j: (ts[j % n] + LEN * (j // n), vs[j % n])
        if t < ts[i]: t += LEN
        (t0, p0), (t1, p1), (tm, pm), (tp, pp) = g(i), g(i + 1), g(i - 1), g(i + 2)
    else:
        if t <= ts[0]: return vs[0]
        if t >= ts[-1]: return vs[-1]
        i = max(j for j in range(n) if ts[j] <= t)
        g = lambda j: (ts[min(max(j, 0), n - 1)], vs[min(max(j, 0), n - 1)])
        (t0, p0), (t1, p1), (tm, pm), (tp, pp) = g(i), g(i + 1), g(i - 1), g(i + 2)
    h = t1 - t0; u = (t - t0) / h
    m0 = (p1 - pm) / ((t1 - tm) or 1) * h if i > 0 or LOOP else 0
    m1 = (pp - p0) / ((tp - t0) or 1) * h if i + 2 < n or LOOP else 0
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1


chans = sorted(tr)
rows = [[round(i / 60, 6)] + [round(at(tr[c], i / 60), 6) for c in chans] for i in range(int(LEN * 60 + 1e-6) + 1)]
if rows[-1][0] < LEN - 1e-6: rows.append([round(LEN, 6)] + [round(at(tr[c], LEN), 6) for c in chans])
clip = {'length': round(LEN, 4), 'loop': LOOP, 'contacts': [], 'channels': chans, 'samples': rows}
p = S + '/blockstrike.html'
s = open(p, encoding='utf-8').read()
a = s.index('const JAVI_BB_DATA = ') + len('const JAVI_BB_DATA = ')
b = s.index(';\n/* JAVI_BLOCKBENCH_DATA_END */')
D = json.loads(s[a:b])
D[name] = clip
s = s[:a] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[b:]
open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('ok', name, mode, LEN, 's', len(rows), 'cuadros', len(chans), 'canales')
