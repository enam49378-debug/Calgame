"""Convierte el modelo de alas hecho en Blockbench (formato 5.0, con grupos aparte) al formato simple que lee js/bbmodelos.js.
Uso: python tools/convertir_alas_sekza.py "ruta/Alas de sekza.bbmodel"   ->  modelos/sekza/alas.bbmodel
Se conservan los huesos de las alas y las animaciones idle, walk, fly, flap, flyup, flydown, soar y dive."""
import json, os, sys
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.expanduser('~'), 'Downloads', 'Alas de sekza.bbmodel')
d = json.load(open(src, encoding='utf-8'))
G = {g['uuid']: g for g in d['groups']}; E = {e['uuid']: e for e in d['elements']}
KEEP = {'idle', 'walk', 'fly', 'flap', 'flyup', 'flydown', 'soar', 'dive'}


def node(n):
    if isinstance(n, str):
        return n if n in E and E[n].get('type', 'cube') == 'cube' else None
    g = G.get(n['uuid'], {}); ch = [c for c in (node(x) for x in n.get('children', [])) if c is not None]
    return {'name': g.get('name', 'g'), 'origin': g.get('origin', [0, 0, 0]), 'rotation': g.get('rotation', [0, 0, 0]), 'uuid': n['uuid'], 'children': ch}


def has_cube(n):
    return isinstance(n, str) or any(has_cube(c) for c in n['children'])


outl = [x for x in (node(n) for n in d['outliner']) if x and has_cube(x)]
used = set()
def collect(n):
    if isinstance(n, str): used.add(n)
    else:
        for c in n['children']: collect(c)
for n in outl: collect(n)
els = []
for u in used:
    e = E[u]; els.append({'name': e.get('name', 'cubo'), 'type': 'cube', 'uuid': u, 'from': e['from'], 'to': e['to'], 'origin': e.get('origin', e['from']), 'rotation': e.get('rotation') or [0, 0, 0], 'faces': e['faces']})
names = {}
def nm(n):
    if isinstance(n, dict):
        names[n['uuid']] = n['name']
        for c in n['children']: nm(c)
for n in outl: nm(n)
anims = []
for a in d['animations']:
    if a['name'] not in KEEP: continue
    an = {}
    for k, v in a['animators'].items():
        if k in names and v.get('keyframes'):
            an[k] = {'name': names[k], 'type': 'bone', 'keyframes': [{'channel': kf['channel'], 'data_points': [{k2: str(kf['data_points'][0].get(k2, 0)) for k2 in 'xyz'}], 'uuid': kf['uuid'], 'time': kf['time'], 'color': -1, 'interpolation': 'linear'} for kf in v['keyframes'] if kf['channel'] in ('rotation', 'position', 'scale')]}
    anims.append({'uuid': a['uuid'], 'name': a['name'], 'loop': a.get('loop', 'loop'), 'length': a['length'], 'animators': an})
out = {'meta': {'format_version': '4.5', 'model_format': 'free', 'box_uv': False}, 'name': 'alas_sekza', 'cf_uv': 'face', 'resolution': d['resolution'], 'elements': els, 'outliner': outl, 'textures': d['textures'], 'animations': anims}
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'modelos', 'sekza', 'alas.bbmodel'); os.makedirs(os.path.dirname(dst), exist_ok=True)
json.dump(out, open(dst, 'w', encoding='utf-8'), separators=(',', ':')); print('ok', len(els), 'cubos', len(anims), 'animaciones', os.path.getsize(dst) // 1024, 'KB')
