"""Convierte una animación hecha en el mod BBS (un .dat de película) en un clip del juego (personajes/<id>/.../Animation/<nombre>.json).

Uso:  python tools/bbs_a_clip.py <pelicula.dat> <salida.json> [loop|once|auto] [replay=0]

Qué lee del .dat (la película de BBS):
  - el replay del personaje (por defecto el 0): sus pistas `pose*` (huesos head, low_body, left_arm, right_arm, left_leg, right_leg)
    y las pistas `transform*` (movimiento y giro de TODO el cuerpo: agacharse, inclinarse, dar una voltereta, avanzar).
  - 20 ticks por segundo; interpolación suave (akima / hermite) y las pistas "overlay" se SUMAN a la base.
Cómo lo adapta al motor del juego:
  - BBS mira a -Z y el juego a +Z: rotaciones [-x, y, -z] y posiciones [-x, y, -z] (igual que tools/import_bbs_clip.py).
  - huesos -> canales del juego:  head hx/hy/hz · low_body ix/iy/iz (giro) y bx/by/bz (desplazamiento en píxeles) · brazos alx../arx.. · piernas llx/llz lrx/lrz
  - transform del cuerpo (espacio de la entidad, frente = +Z): el giro en X se suma a `ix` SIN invertir el signo (+ = hacia adelante) y la altura (bloques) se suma a `by` (×16 = píxeles).
    El avance hacia adelante (z) NO va en el clip: el juego mueve al luchador de verdad. Se imprime como "RECORRIDO" para copiarlo en el movimiento.
  - salida: {"length","loop","contacts","channels","samples":[[t, canal...]]} a 60 cuadros por segundo, el mismo formato de personajes/<id>/**/Animation/*.json."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bbsparse import load

src, out = sys.argv[1], sys.argv[2]
mode = sys.argv[3] if len(sys.argv) > 3 else 'auto'
ridx = int(sys.argv[4].split('=')[1]) if len(sys.argv) > 4 and sys.argv[4].startswith('replay=') else 0
film = load(src)[0]
pr = film['replays'][ridx]['properties']
TPS = 20.0

MAP = {'head': (['hx', 'hy', 'hz'], ['hpx', 'hpy', 'hpz']), 'low_body': (['ix', 'iy', 'iz'], ['bx', 'by', 'bz']),
       'left_arm': (['alx', 'aly', 'alz'], ['alpx', 'alpy', 'alpz']), 'right_arm': (['arx', 'ary', 'arz'], ['arpx', 'arpy', 'arpz']),
       'left_leg': (['llx', None, 'llz'], ['llpx', 'llpy', 'llpz']), 'right_leg': (['lrx', None, 'lrz'], ['lrpx', 'lrpy', 'lrpz'])}


def sample(keys, t):
    """valor de una pista (lista de (t, v)) en el instante t: curva suave tipo Catmull-Rom con tangentes de las pistas vecinas"""
    n = len(keys)
    if n == 0: return 0.0
    if t <= keys[0][0]: return keys[0][1]
    if t >= keys[-1][0]: return keys[-1][1]
    i = max(j for j in range(n) if keys[j][0] <= t)
    g = lambda j: keys[min(max(j, 0), n - 1)]
    (t0, p0), (t1, p1), (tm, pm), (tp, pp) = g(i), g(i + 1), g(i - 1), g(i + 2)
    h = t1 - t0; u = (t - t0) / h
    m0 = (p1 - pm) / ((t1 - tm) or 1) * h if i > 0 else 0
    m1 = (pp - p0) / ((tp - t0) or 1) * h if i + 2 < n else 0
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1


# ---- huesos: una pista por canal y por pista de BBS; las "overlay" se suman a la base
tracks = {}   # canal -> lista de pistas, cada una [(t, v)]
last = 0.0
for pname, prop in pr.items():
    base = pname.split('/')[0]
    if base.isdigit(): continue                       # pistas de las partes del formulario (ojos, objetos): no son del cuerpo
    if pname.startswith('pose'):
        per = {}
        # un cuadro clave sin datos (o sin ese hueso) significa pose NEUTRA (todo en 0): así la pista arranca y termina en reposo
        used = {bone for kf in prop['keyframes'] if isinstance(kf['value'], dict) for bone in (kf['value'].get('pose') or {}) if bone in MAP}
        for kf in prop['keyframes']:
            t = kf['tick'] / TPS; last = max(last, t)
            pose = (kf['value'].get('pose') if isinstance(kf['value'], dict) else None) or {}
            for bone in used:
                bv = pose.get(bone) or {}
                rn, pn = MAP[bone]
                r = bv.get('r', [0, 0, 0]); tt = bv.get('t', [0, 0, 0])
                for n, x in zip(rn, [-r[0], r[1], -r[2]]):
                    if n: per.setdefault(n, []).append((t, x))
                for n, x in zip(pn, [-tt[0], tt[1], -tt[2]]):
                    if n: per.setdefault(n, []).append((t, x))
        for n, keys in per.items(): tracks.setdefault(n, []).append(sorted(keys))

# ---- transform del cuerpo entero: giro en X -> ix, altura -> by (px), avance en z -> recorrido
root_rx, root_ty, root_tz = [], [], []
for pname, prop in pr.items():
    if not pname.startswith('transform') or pname.split('/')[0].isdigit(): continue
    rx, ty, tz = [], [], []
    for kf in prop['keyframes']:
        t = kf['tick'] / TPS; v = kf['value'] or {}; last = max(last, t)
        r = v.get('r', [0, 0, 0]); tt = v.get('t', [0, 0, 0])
        rx.append((t, r[0])); ty.append((t, tt[1] * 16.0)); tz.append((t, tt[2]))
    if len(rx) > 1 or any(abs(x[1]) > 1e-9 for x in rx + ty + tz):
        root_rx.append(sorted(rx)); root_ty.append(sorted(ty)); root_tz.append(sorted(tz))
LEN = last
tracks.setdefault('ix', []).extend(root_rx)
tracks.setdefault('by', []).extend(root_ty)
chans = sorted(tracks)


def value(c, t):
    return sum(sample(k, t) for k in tracks[c])


n_frames = int(LEN * 60 + 1e-6) + 1
rows = [[round(i / 60, 6)] + [round(value(c, i / 60), 6) for c in chans] for i in range(n_frames)]
if rows[-1][0] < LEN - 1e-6: rows.append([round(LEN, 6)] + [round(value(c, LEN), 6) for c in chans])
# una voltereta completa termina en -2π (o +2π): visualmente es la pose de reposo, pero el juego la "desenrollaría" al terminar. Al quedar quieta,
# se resta la vuelta entera (mismo aspecto, sin giro de regreso)
import math
for ci, c in enumerate(chans):
    if c[0] not in 'iahlt' and c not in ('ix', 'iy', 'iz'): continue
    if c.endswith(('px', 'py', 'pz')) or c in ('bx', 'by', 'bz'): continue
    fin = rows[-1][ci + 1]; k = round(fin / (2 * math.pi))
    if k == 0 or abs(fin - k * 2 * math.pi) > .25: continue
    i0 = len(rows) - 1
    while i0 > 0 and abs(rows[i0 - 1][ci + 1] - fin) < .03: i0 -= 1
    for i in range(i0, len(rows)): rows[i][ci + 1] = round(rows[i][ci + 1] - k * 2 * math.pi, 6)
    print('vuelta completa en', c, ': se quita', k, 'vuelta(s) desde t =', rows[i0][0])
if mode == 'auto': mode = 'once'
clip = {'length': round(LEN, 4), 'loop': mode == 'loop', 'contacts': [], 'channels': chans, 'samples': rows}
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
json.dump(clip, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', os.path.basename(out), mode, round(LEN, 3), 's', len(rows), 'cuadros', len(chans), 'canales:', ' '.join(chans))
# recorrido hacia adelante (suma de las pistas de transform), para copiarlo en el movimiento
zs = sorted({t for k in root_tz for t, _ in k})
prof = [[round(t, 3), round(sum(sample(k, t) for k in root_tz), 3)] for t in zs]
print('RECORRIDO (segundos, metros hacia adelante):', json.dumps(prof))
