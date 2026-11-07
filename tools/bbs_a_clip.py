"""Convierte una animación hecha en el mod BBS (un .dat de película) en un clip del juego (personajes/<id>/.../Animation/<nombre>.json),
leyendo la película con las MISMAS reglas que usa BBS al reproducirla (sacadas del propio mod: bbs-cml-3.0-beta-5, clases Interpolations,
SplineMath, KeyframeChannel/KeyframeSegment, ModelFormRenderer.applyPose, FormRenderer.createTransform y Transform.setupMatrix).

Uso:  python tools/bbs_a_clip.py <pelicula.dat> <salida.json> [loop|once] [replay=0]

Qué se respeta (hasta el último detalle):
  - Los 20 ticks por segundo y el tick fraccionario: se muestrea a 60 cuadros por segundo reales.
  - Cada cuadro clave con SU interpolación (la del cuadro de la izquierda): linear, constant, step, smoothstep, smootherstep, cubic,
    hermite (Catmull-Rom por índice, no por tiempo), akima y makima (con las fórmulas exactas de BBS), y la "duración" de un cuadro clave.
    Antes del primer cuadro y después del último se mantiene el valor. Lo que falte en un cuadro clave (hueso, rotación…) es neutro.
  - Pistas de pose: `pose`, `pose_overlay`, `pose_overlay0..N` se SUMAN en ese orden (traslación suma, escala suma-1, rotación suma),
    salvo que un hueso tenga `fix` distinto de 0: entonces la capa REEMPLAZA con esa mezcla (igual que ModelFormRenderer.applyPose).
  - Pistas de transform del cuerpo entero: `transform`, `transform_overlay`, `transform_overlay0..N`, también sumadas.
  - Matriz de cada hueso = T(t)·T(p)·R·S·T(-p) (p = pivote), con la rotación en orden ZYX de BBS. BBS mira a -Z y el juego a +Z:
    se conjuga la rotación con el giro de 180° en Y, y el juego usa orden XYZ: se convierte la matriz completa (no ángulo por ángulo).
  - El cuerpo entero gira alrededor de LOS PIES en BBS y la cintura del juego está a 16 px: la cintura se mueve a donde quedaría.
    La rotación del cuerpo entero se compone con la de `low_body` (matriz por matriz).
  - El avance hacia adelante (z del cuerpo) lo hace el movimiento real del luchador: se imprime como RECORRIDO para copiarlo en el código.
Salida: {"length","loop","contacts","channels","samples":[[t, canal...]]} (el mismo formato de los demás clips) y un informe de lo que no se pudo usar."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bbsparse import load

TPS = 20.0
HIP = 16.0            # altura de la cintura del juego (px) = pivote de `inner`
src, out = sys.argv[1], sys.argv[2]
extra = sys.argv[3:]
mode = next((a for a in extra if a in ('loop', 'once')), 'once')
ridx = next((int(a.split('=')[1]) for a in extra if a.startswith('replay=')), 0)
film = load(src)[0]
rp = film['replays'][ridx]
props = rp['properties']
warn = []


# ======================= interpolaciones exactas de BBS =======================
def hermite(p0, p1, m0, m1, x):                         # SplineMath.hermite
    x2 = x * x; x3 = x2 * x
    return (2 * x3 - 3 * x2 + 1) * p0 + (-2 * x3 + 3 * x2) * p1 + (x3 - 2 * x2 + x) * m0 + (x3 - x2) * m1


def tangent(a, b, c, d):                                # SplineMath.tangent
    s = c + d
    return (a + b) / 2 if s < 1e-9 else (c * a + d * b) / s


def akima(a0, a, b, b0, x, modified=False):             # SplineMath.akima(ctx, modified)
    d0 = a - a0; d1 = b - a; d2 = b0 - b
    e0 = 2 * d0 - d1; e1 = 2 * d2 - d1
    if modified:
        t0 = tangent(d0, d1, abs(d2 - d1) + abs(d2 + d1) / 2, abs(d0 - e0) + abs(d0 + e0) / 2)
        t1 = tangent(d1, d2, abs(e1 - d2) + abs(e1 + d2) / 2, abs(d1 - d0) + abs(d1 + d0) / 2)
    else:
        t0 = tangent(d0, d1, abs(d1 - d0), abs(e0 - d0))
        t1 = tangent(d1, d2, abs(d2 - d1), abs(d1 - d0))
    return hermite(a, b, t0, t1, x)


def cubic(p0, p1, p2, p3, x):                           # Lerps.cubic
    A = p3 - p2 - p0 + p1; B = p0 - p1 - A; Cc = p2 - p0
    return ((A * x + B) * x + Cc) * x + p1


def cubic_hermite(p0, p1, p2, p3, x):                   # Lerps.cubicHermite (Catmull-Rom con tension .5)
    h = -.5 * p0 + 1.5 * p1 - 1.5 * p2 + .5 * p3
    j = p0 - 2.5 * p1 + 2 * p2 - .5 * p3
    k = -.5 * p0 + .5 * p2
    return ((h * x + j) * x + k) * x + p1


def interp(kind, a0, a, b, b0, x):
    if kind == 'linear': return a + (b - a) * x
    if kind in ('constant', 'const', 'step'): return a
    if kind == 'smoothstep': return a + (b - a) * (x * x * (3 - 2 * x))
    if kind == 'smootherstep': return a + (b - a) * (x * x * x * (x * (6 * x - 15) + 10))
    if kind == 'cubic': return cubic(a0, a, b, b0, x)
    if kind in ('hermite', 'monotone'): return cubic_hermite(a0, a, b, b0, x)
    if kind == 'akima': return akima(a0, a, b, b0, x, False)
    if kind == 'makima': return akima(a0, a, b, b0, x, True)
    warn.append('interpolación "%s" no soportada: se usa hermite' % kind)
    return cubic_hermite(a0, a, b, b0, x)


class Chan:
    """Una pista escalar: lista de cuadros clave (tick, interp, duracion, valor). sample(tick) sigue KeyframeChannel.findSegment/KeyframeSegment."""
    def __init__(self, keys): self.k = sorted(keys, key=lambda q: q[0])

    def sample(self, x):
        k = self.k; n = len(k)
        if n == 0: return 0.0
        if n == 1 or x < k[0][0]: return k[0][3]
        if x >= k[-1][0]: return k[-1][3]
        lo, hi = 0, n - 1
        while lo <= hi:                                    # primer cuadro con tick >= x
            mid = lo + (hi - lo) // 2
            if k[mid][0] < x: lo = mid + 1
            else: hi = mid - 1
        b_i = lo
        if k[b_i][0] == math.floor(x) and b_i < n - 1: b_i += 1       # justo sobre un cuadro entero: el segmento siguiente
        a_i = b_i - 1 if b_i - 1 >= 0 else b_i
        a, b = k[a_i], k[b_i]
        pre = k[a_i - 1] if a_i - 1 >= 0 else a                        # KeyframeSegment.fill: vecinos
        post = k[a_i + 2] if a_i + 2 < n else b
        dur = a[2] if a[2] > 0 else b[0] - a[0]
        t = 0.0 if dur == 0 else min(max((x - a[0]) / dur, 0.0), 1.0)
        return interp(a[1], pre[3], a[3], b[3], post[3], t)


# ======================= lectura de pistas =======================
DEF = {'r': 0.0, 't': 0.0, 's': 1.0, 'p': 0.0}


def comp_chans(prop, bone=None):
    """canales por componente de una pista: {('r',0): Chan, ...} y 'fix'"""
    kfs = prop['keyframes']; out_ = {}

    def val(kf):
        v = kf.get('value') or {}
        return ((v.get('pose') or {}).get(bone) or {}) if bone is not None else v
    for field in 'rtsp':
        for i in range(3):
            keys = []
            for kf in kfs:
                arr = val(kf).get(field)
                keys.append((kf['tick'], kf.get('interp') or 'linear', kf.get('duration') or 0, arr[i] if arr else DEF[field]))
            out_[(field, i)] = Chan(keys)
    out_['fix'] = Chan([(kf['tick'], kf.get('interp') or 'linear', kf.get('duration') or 0, float(val(kf).get('fix', 0.0))) for kf in kfs])
    for kf in kfs:
        if val(kf) and val(kf).get('visible', 1) in (0, False): warn.append('hueso %s con visible=0 (no se usa)' % bone)
    return out_


def order_key(name):
    if '_overlay' not in name: return -1
    suf = name.split('_overlay')[1]
    return 0 if suf == '' else int(suf) + 1


pose_props = sorted([n for n, p in props.items() if n.startswith('pose') and not n.split('/')[0].isdigit() and p['keyframes']], key=order_key)
tr_props = sorted([n for n, p in props.items() if n.startswith('transform') and not n.split('/')[0].isdigit() and p['keyframes']], key=order_key)
BONES = ['head', 'low_body', 'left_arm', 'right_arm', 'left_leg', 'right_leg']
bone_tracks = {b: [] for b in BONES}      # en orden: base y luego overlays
for n in pose_props:
    used = {bo for kf in props[n]['keyframes'] for bo in ((kf.get('value') or {}).get('pose') or {})}
    for bo in used:
        if bo not in bone_tracks:
            warn.append('hueso "%s" (pista %s) no existe en el juego: se ignora' % (bo, n)); continue
        bone_tracks[bo].append(comp_chans(props[n], bo))
root_tracks = [comp_chans(props[n]) for n in tr_props]
last_tick = max([kf['tick'] for n in pose_props + tr_props for kf in props[n]['keyframes']] + [0])
LEN = last_tick / TPS


def combine(chs, tick):
    """suma las capas de una lista de pistas en el orden de BBS: devuelve (t, s, r, p)"""
    t = np.zeros(3); s = np.ones(3); r = np.zeros(3); p = np.zeros(3)
    for k, ch in enumerate(chs):
        ot = np.array([ch[('t', i)].sample(tick) for i in range(3)]); os_ = np.array([ch[('s', i)].sample(tick) for i in range(3)])
        orr = np.array([ch[('r', i)].sample(tick) for i in range(3)]); op = np.array([ch[('p', i)].sample(tick) for i in range(3)])
        fix = ch['fix'].sample(tick) if k > 0 else 0.0
        if fix != 0:                                          # capa con `fix`: reemplaza mezclando
            t = t + (ot - t) * fix; s = s + (os_ - s) * fix; r = r + (orr - r) * fix
        else:
            t = t + ot; s = s + os_ - 1; r = r + orr
        p = p + op
    return t, s, r, p


def rot_zyx(r):                                           # BBS: toQuaternionZYXRadians -> matriz Rz·Ry·Rx
    cx, sx, cy, sy, cz, sz = math.cos(r[0]), math.sin(r[0]), math.cos(r[1]), math.sin(r[1]), math.cos(r[2]), math.sin(r[2])
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]); Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


C = np.diag([-1.0, 1.0, -1.0])                            # BBS (frente -Z) -> juego (frente +Z)


def euler_xyz(M):                                         # three.js Euler 'XYZ' desde matriz (m = Rx·Ry·Rz)
    y = math.asin(max(-1.0, min(1.0, M[0, 2])))
    if abs(M[0, 2]) < .9999999:
        x = math.atan2(-M[1, 2], M[2, 2]); z = math.atan2(-M[0, 1], M[0, 0])
    else:
        x = math.atan2(M[2, 1], M[1, 1]); z = 0.0
    return np.array([x, y, z])


ROT = {'head': ['hx', 'hy', 'hz'], 'low_body': ['ix', 'iy', 'iz'], 'left_arm': ['alx', 'aly', 'alz'], 'right_arm': ['arx', 'ary', 'arz'],
       'left_leg': ['llx', 'lly', 'llz'], 'right_leg': ['lrx', 'lry', 'lrz']}
POS = {'head': ['hpx', 'hpy', 'hpz'], 'low_body': ['bx', 'by', 'bz'], 'left_arm': ['alpx', 'alpy', 'alpz'], 'right_arm': ['arpx', 'arpy', 'arpz'],
       'left_leg': ['llpx', 'llpy', 'llpz'], 'right_leg': ['lrpx', 'lrpy', 'lrpz']}
SCALE = {'head': ('hscx', 'hscy', 'hscz'), 'low_body': ('bsx', 'bsy', 'bsz')}
SCALE1 = {'left_arm': 'als', 'right_arm': 'ars', 'left_leg': 'lls', 'right_leg': 'lrs'}   # el juego solo estira el largo de las extremidades
chan_names = []
for b in BONES:
    chan_names += ROT[b] + POS[b]
    if b in SCALE: chan_names += list(SCALE[b])
    if b in SCALE1: chan_names.append(SCALE1[b])
chan_names = sorted(set(chan_names))

n_frames = int(round(LEN * 60)) + 1
times = [min(i / 60.0, LEN) for i in range(n_frames)]
if times[-1] < LEN - 1e-9: times.append(LEN)
rows = []
unw = {}                                                    # continuidad de los ángulos (sin saltos de 2π)


def unwrap(key, v):
    prev = unw.get(key)
    if prev is not None:
        while v - prev > math.pi: v -= 2 * math.pi
        while v - prev < -math.pi: v += 2 * math.pi
    unw[key] = v
    return v


for tm in times:
    tick = tm * TPS
    vals = {}
    # ---- cuerpo entero (espacio de la entidad: frente +Z, sin conjugar). M = T(t)·T(p)·R·S·T(-p), en píxeles (1 bloque = 16)
    if root_tracks:
        rt, rs, rr, rpv = combine(root_tracks, tick)
        R_root = rot_zyx(rr)
        if np.any(np.abs(rs - 1) > 1e-6): warn.append('escala del cuerpo entero ignorada')
        hip0 = np.array([0.0, HIP, 0.0]); t_px = rt * 16.0; p_px = rpv * 16.0
        hip_new = t_px + p_px + R_root @ np.diag(rs) @ (hip0 - p_px)
        d_root = hip_new - hip0                             # cuánto se mueve la cintura (x lateral, y altura, z adelante)
        d_root[2] -= t_px[2]                                # el avance lo hace el luchador de verdad (ver RECORRIDO): queda solo el adelanto de la cintura por inclinarse
    else:
        R_root = np.eye(3); d_root = np.zeros(3)
    for b in BONES:
        chs = bone_tracks[b]
        if chs: t, s, r, p = combine(chs, tick)
        else: t = np.zeros(3); s = np.ones(3); r = np.zeros(3); p = np.zeros(3)
        Rb = rot_zyx(r)
        Rg = C @ Rb @ C                                     # rotación del hueso, ya en ejes del juego
        o_bbs = t + p - Rb @ (np.diag(s) @ p)               # donde queda el origen del hueso: t + p - R·S·p
        o_g = C @ o_bbs
        if b == 'low_body':
            Rg = R_root @ Rg                                # el cuerpo entero y la cintura se componen como matrices
            o_g = d_root + R_root @ o_g
        ang = euler_xyz(Rg)
        for i, nme in enumerate(ROT[b]): vals[nme] = unwrap(nme, float(ang[i]))
        for i, nme in enumerate(POS[b]): vals[nme] = float(o_g[i])
        if b in SCALE:
            for i, nme in enumerate(SCALE[b]): vals[nme] = float(s[i])
        if b in SCALE1:
            vals[SCALE1[b]] = float(s[1])
            if abs(s[0] - 1) > 1e-6 or abs(s[2] - 1) > 1e-6: warn.append('escala X/Z de %s ignorada (el juego solo estira el largo)' % b)
    rows.append([round(tm, 6)] + [round(vals.get(c, 0.0), 6) for c in chan_names])

# ---- una voltereta completa termina en ±2π: visualmente es la pose de reposo, pero el juego la "desenrollaría" al terminar
for ci, c in enumerate(chan_names):
    if c not in ('ix', 'iy', 'iz', 'hx', 'hy', 'hz', 'alx', 'aly', 'alz', 'arx', 'ary', 'arz', 'llx', 'lly', 'llz', 'lrx', 'lry', 'lrz'): continue
    fin = rows[-1][ci + 1]; k = round(fin / (2 * math.pi))
    if k == 0 or abs(fin - k * 2 * math.pi) > .25: continue
    i0 = len(rows) - 1
    while i0 > 0 and abs(rows[i0 - 1][ci + 1] - fin) < .03: i0 -= 1
    for i in range(i0, len(rows)): rows[i][ci + 1] = round(rows[i][ci + 1] - k * 2 * math.pi, 6)
    print('vuelta completa en', c, ': se quita', k, 'vuelta(s) desde t =', rows[i0][0])

# ---- ojos (parte 0 del formulario: pupilas, cejas y párpados): [t, x, y, escala y] por hueso
eyes = {}
ek = props.get('0/pose', {}).get('keyframes', [])
for b in sorted({b for kf in ek for b in ((kf.get('value') or {}).get('pose') or {})}):
    rows_e = []
    for kf in ek:
        v = ((kf.get('value') or {}).get('pose') or {}).get(b, {}); t = v.get('t', [0, 0, 0]); sc = v.get('s', [1, 1, 1])
        rows_e.append([round(kf['tick'] / TPS, 4), round(-t[0], 4), round(t[1], 4), round(sc[1], 4)])
    if any(abs(r_[1]) + abs(r_[2]) + abs(r_[3] - 1) > 1e-6 for r_ in rows_e): eyes[b] = rows_e

clip = {'length': round(LEN, 4), 'loop': mode == 'loop', 'contacts': [], 'channels': chan_names, 'samples': rows}
if eyes: clip['eyes'] = eyes
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
json.dump(clip, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('ok', os.path.basename(out), mode, round(LEN, 3), 's', len(rows), 'cuadros', len(chan_names), 'canales')
print('pistas de pose:', pose_props, '· pistas de transform:', tr_props)
extra_info = []
if film.get('camera'): extra_info.append('hay cámara de película (no se importa)')
if rp.get('actions') not in (None, '[]', []): extra_info.append('hay acciones/sonidos en el replay (no se importan)')
for m in sorted(set(warn)) + extra_info: print('AVISO:', m)
if root_tracks:
    zs = sorted({round(kf['tick'] / TPS, 3) for n in tr_props for kf in props[n]['keyframes']})
    prof = [[z, round(sum(ch[('t', 2)].sample(z * TPS) for ch in root_tracks), 3)] for z in zs]
    print('RECORRIDO (segundos, metros hacia adelante):', json.dumps(prof))
