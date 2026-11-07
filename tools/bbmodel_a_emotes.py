"""Convierte las animaciones de un .bbmodel de Blockbench (esqueleto de BBS: anchor, low_body, head, left_arm, right_arm, left_leg, right_leg)
en emotes del juego:
    js/emote_list.js   catalogo (nombre, icono, kills que piden, duracion): se carga siempre, es chico.
    js/emote_clips.js  las animaciones (clips del mismo formato que los demas clips del juego): se carga solo cuando hace falta.
Cada animacion se muestrea a 30 cuadros por segundo y pasa por tools/bbs_a_clip.py (mismas matrices, suelo, hueso anchor...).
Uso:  python tools/bbmodel_a_emotes.py "C:/ruta/Emotes.bbmodel"
Para agregar/quitar emotes edita la lista EMOTES de abajo (nombre de la animacion en Blockbench -> nombre en el juego)."""
import json, os, sys, types, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\jesul\Downloads\Emotes.bbmodel'
FPS = 30
BONES = ['head', 'low_body', 'left_arm', 'right_arm', 'left_leg', 'right_leg']

# (animacion o (inicio, bucle), nombre en el juego, icono, kills que pide). Las 4 primeras vienen desbloqueadas.
EMOTES = [
    ('Baile cruzado', 'Baile cruzado', '🕺', 0), ('Sentarse', 'Sentarse', '🪑', 0), ('Aplaudir', 'Aplaudir', '👏', 0), ('Pies alegres', 'Pies alegres', '🦶', 0),
    ('Baile suave', 'Baile suave', '🎶', 2), ('Adorar', 'Adorar', '🙏', 4), ('Baile cruzado alt', 'Baile cruzado 2', '💃', 6), ('Pirueta', 'Pirueta', '🩰', 9),
    ('Dab 2', 'Dab', '😎', 12), ('Shuffle', 'Shuffle', '🔀', 15), ('Griddy', 'Griddy', '🏈', 18), ('Baile buzo', 'Baile buzo', '🤿', 22),
    ('Baile 3 fps', 'Baile 3 fps', '🎞️', 26), ('Baile anime', 'Baile anime', '🌸', 30), ('Baile Homero', 'Baile Homero', '🍩', 35), ('Meditar', 'Meditar (largo)', '🧘', 40),
    ('Acurrucarse', 'Acurrucarse', '🥶', 45), ('Dormir', 'Dormir', '😴', 50), ('Baile burla', 'Baile burla', '🤪', 56), ('Gusano', 'Gusano', '🐛', 62),
    ('Baile buzo viejo', 'Baile buzo viejo', '🕶️', 68), ('Travesura', 'Travesura', '😈', 75), ('Rascar oreja', 'Rascar oreja', '🙉', 82), ('Celular', 'Celular', '📱', 90),
    ('67', '67', '6️⃣', 98), ('Rueda', 'Rueda', '🤸', 106), ('Salto atrás', 'Salto atrás', '🔄', 115), ('Risa malvada', 'Risa malvada', '😈', 124),
    ('Aullar', 'Aullar', '🐺', 134), ('Señalar spiderman', 'Spiderman', '🕷️', 144), ('Breakdance', 'Breakdance pro', '🌀', 155), (('Enojo anime inicio', 'Enojo anime'), 'Enojo anime', '😡', 166),
    (('Amor anime inicio', 'Amor anime'), 'Amor anime', '💖', 178), ('Tektonik', 'Tektonik', '⚡', 190), ('Vuelta con pose inicio', 'Vuelta con pose', '🧍', 203), ('Thriller', 'Thriller', '🧟', 216),
    (('Carga oscura inicio', 'Carga oscura'), 'Carga oscura', '🌑', 230), ('Susto inicio', 'Susto', '😱', 245), ('Correr terror inicio', 'Correr con terror', '🏃', 260), ('Hyperpop', 'Hyperpop', '🎧', 275),
    ('Salto araña inicio', 'Salto araña', '🕸️', 290), ('Carga anime inicio', 'Carga anime', '🔥', 310), ('Necromancia inicio', 'Necromancia', '💀', 335), ('Vergüenza', 'Vergüenza', '🙈', 360),
    ('dying_2', 'Caer derrotado', '☠️', 390),
]
IDBASE = 100

d = json.load(open(SRC, encoding='utf-8'))
import re, unicodedata
norm = lambda t: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower())
_an = {norm(a['name']): a for a in d['animations']}


class _Anims(dict):
    def __getitem__(self, k):
        return _an[norm(k)]


anims = _Anims()


def num(v):
    try:
        return float(v)
    except Exception:
        return 0.0


def chans(a):
    """{hueso: {canal: [(tiempo, (x,y,z)), ...]}}"""
    out = {}
    for an in a['animators'].values():
        b = an.get('name')
        if b not in BONES + ['anchor']:
            continue
        for k in an.get('keyframes', []):
            p = (k.get('data_points') or [{}])[0]
            out.setdefault(b, {}).setdefault(k['channel'], []).append((float(k['time']), (num(p.get('x')), num(p.get('y')), num(p.get('z')))))
    for b in out:
        for c in out[b]:
            out[b][c].sort(key=lambda q: q[0])
    return out


def sample(keys, t, default):
    if not keys:
        return list(default)
    if t <= keys[0][0]:
        return list(keys[0][1])
    if t >= keys[-1][0]:
        return list(keys[-1][1])
    lo, hi = 0, len(keys) - 1
    while hi - lo > 1:
        m = (lo + hi) // 2
        if keys[m][0] <= t:
            lo = m
        else:
            hi = m
    (t0, v0), (t1, v1) = keys[lo], keys[hi]
    u = (t - t0) / (t1 - t0) if t1 > t0 else 0
    return [v0[i] + (v1[i] - v0[i]) * u for i in range(3)]


def fake_film(a):
    """pelicula falsa de BBS con una pista de pose (y otra para el hueso anchor) muestreada a FPS"""
    L = max(float(a.get('length') or 0), 0.5 if not a.get('length') else 0)
    ch = chans(a)
    if L <= 0:
        L = 1.0
    n = int(round(L * FPS))
    pose_k, anc_k = [], []
    for i in range(n + 1):
        t = min(i / FPS, L); tick = t * 20.0
        pv = {}
        for b in BONES:
            c = ch.get(b, {})
            r = sample(c.get('rotation'), t, (0, 0, 0)); p = sample(c.get('position'), t, (0, 0, 0)); s = sample(c.get('scale'), t, (1, 1, 1))
            pv[b] = {'r': [math.radians(x) for x in r], 't': p, 's': s}
        pose_k.append({'tick': tick, 'interp': 'linear', 'value': {'pose': pv}})
        c = ch.get('anchor', {})
        r = sample(c.get('rotation'), t, (0, 0, 0)); p = sample(c.get('position'), t, (0, 0, 0)); s = sample(c.get('scale'), t, (1, 1, 1))
        anc_k.append({'tick': tick, 'interp': 'linear', 'value': {'r': [math.radians(x) for x in r], 't': p, 's': s}})
    props = {'pose': {'keyframes': pose_k}}
    if 'anchor' in ch:
        props['pose.bones.anchor'] = {'keyframes': anc_k}
    return {'replays': [{'properties': props, 'actions': []}], 'camera': []}, L


def convert(a, loop):
    film, L = fake_film(a)
    mod = types.ModuleType('bbsparse'); mod.load = lambda p: [film]
    sys.modules['bbsparse'] = mod
    out = os.path.join(os.environ.get('TEMP', '.'), '_emote_tmp.json')
    sys.argv = ['bbs_a_clip.py', 'fake', out, 'loop' if loop else 'once']
    src = open(os.path.join(HERE, 'bbs_a_clip.py'), encoding='utf-8').read()
    ns = {'__file__': os.path.join(HERE, 'bbs_a_clip.py'), '__name__': '__main__'}
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(src, 'bbs_a_clip', 'exec'), ns)
    return json.load(open(out, encoding='utf-8'))


def slim(clip):
    """30 cuadros/s, sin los canales que valen siempre lo de por defecto"""
    ch = clip['channels']; rows = clip['samples']
    keep = [r for i, r in enumerate(rows) if i % 2 == 0]
    if keep[-1][0] != rows[-1][0]:
        keep.append(rows[-1])
    DEF = {'alz': .06, 'arz': -.06, 'als': 1, 'ars': 1, 'lls': 1, 'lrs': 1, 'tscx': 1, 'tscy': 1, 'tscz': 1, 'hscx': 1, 'hscy': 1, 'hscz': 1, 'bsx': 1, 'bsy': 1, 'bsz': 1, 'ssc': 1}
    use = [j for j, c in enumerate(ch) if any(abs(r[j + 1] - DEF.get(c, 0)) > 1e-3 for r in keep)]
    return {'length': clip['length'], 'loop': clip['loop'], 'contacts': [], 'channels': [ch[j] for j in use],
            'samples': [[round(r[0], 3)] + [round(r[j + 1], 3) for j in use] for r in keep]}


def merge(parts):
    """une clips uno detras de otro (inicio + bucle repetido); devuelve el clip unido"""
    chs = []
    for c in parts:
        for k in c['channels']:
            if k not in chs:
                chs.append(k)
    rows = []; t0 = 0.0
    for c in parts:
        idx = {k: i for i, k in enumerate(c['channels'])}
        for r in c['samples']:
            rows.append([round(t0 + r[0], 3)] + [r[idx[k] + 1] if k in idx else 0.0 for k in chs])
        t0 += c['length']
    return {'length': round(t0, 3), 'loop': False, 'contacts': [], 'channels': chs, 'samples': rows}


clips, lst = {}, []
for i, (src, name, ico, kills) in enumerate(EMOTES):
    if isinstance(src, tuple):
        ini, bucle = src
        c0 = slim(convert(anims[ini], False)); c1 = slim(convert(anims[bucle], False))
        clip = merge([c0, c1, c1]); loop = False
    else:
        a = anims[src]; loop = a.get('loop') == 'loop'
        clip = slim(convert(a, loop)); clip['loop'] = loop
        if not float(a.get('length') or 0):
            clip['length'] = 3.0; clip['loop'] = True; loop = True
    cid = 'em_%d' % (IDBASE + i)
    clips[cid] = clip
    lst.append({'id': IDBASE + i, 'n': name, 'ico': ico, 'k': kills, 'clip': cid, 'len': clip['length'], 'loop': bool(clip['loop'])})
    print('%-22s %5.2fs %3d canales %4d cuadros' % (name, clip['length'], len(clip['channels']), len(clip['samples'])))

hdr = '// GENERADO por tools/bbmodel_a_emotes.py a partir de Emotes.bbmodel: no editar a mano\n'
open(os.path.join(ROOT, 'js', 'emote_list.js'), 'w', encoding='utf-8').write(hdr + 'window.CF_EMOTE_LIST = ' + json.dumps(lst, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'emote_clips.js'), 'w', encoding='utf-8').write(hdr + 'window.CF_EMOTE_CLIPS = ' + json.dumps(clips, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('listo:', len(lst), 'emotes ·', round(os.path.getsize(os.path.join(ROOT, 'js', 'emote_clips.js')) / 1e6, 2), 'MB')
