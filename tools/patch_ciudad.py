"""Arreglos puntuales a los modelos de la ciudad (se editan los .bbmodel y se regeneran sus .js sin tocar el resto):
 - Torre Aurora: la cabina del ascensor no tenía pared de fondo (se atravesaba la mirada hacia la calle): pared de mármol a todo lo alto con colisión.
 - Centro comercial: el directorio del fondo tapaba la salida hacia la playa: se quita."""
import json, copy, uuid, pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / 'ciudad'


def load(n): return json.loads((OUT / (n + '.bbmodel')).read_text(encoding='utf-8'))


def save(n, d):
    (OUT / (n + '.bbmodel')).write_text(json.dumps(d, ensure_ascii=False, indent=None, separators=(',', ':')), encoding='utf-8')
    c = copy.deepcopy(d); c['textures'][0]['source'] = ''
    (OUT / (n + '.js')).write_text("(window.BB_MODELS=window.BB_MODELS||{})['%s']=%s;" % (n, json.dumps(c, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')


def groups(nodes):
    for g in nodes:
        if isinstance(g, dict):
            yield g; yield from groups(g.get('children', []))


def remove(d, idxs):
    ids = {d['elements'][i]['uuid'] for i in idxs}
    d['elements'] = [e for e in d['elements'] if e['uuid'] not in ids]
    for g in groups(d['outliner']): g['children'] = [c for c in g['children'] if not (isinstance(c, str) and c in ids)]


def clone(d, src, frm, to, name):
    e = copy.deepcopy(d['elements'][src]); e['uuid'] = str(uuid.uuid4()); e['from'] = frm; e['to'] = to; e['name'] = name
    e['origin'] = [(frm[0] + to[0]) / 2, (frm[1] + to[1]) / 2, (frm[2] + to[2]) / 2]
    d['elements'].append(e); old = d['elements'][src]['uuid']
    for g in groups(d['outliner']):
        if old in g['children']: g['children'].append(e['uuid'])


# 1) centro comercial
m = load('centro_comercial')
idx = [i for i, e in enumerate(m['elements']) if abs(e['to'][0] - e['from'][0] - 28.8) < .2 and abs(e['to'][2] - e['from'][2] - 3.2) < .3 and e['from'][2] < -80]
idx += [i for i, e in enumerate(m['elements']) if abs(e['from'][0] + 12.8) < .1 and abs(e['to'][0] - 12.8) < .1 and abs(e['from'][2] + 86.48) < .1]
if idx: remove(m, idx); save('centro_comercial', m); print('mall: quitados', len(idx))
# 2) torre
t = load('torre_aurora')
if not any(e['name'] == 'pared_cabina' for e in t['elements']):
    wall = next(i for i, e in enumerate(t['elements']) if e['name'] == 'cubo_3063')
    col = next(i for i, e in enumerate(t['elements']) if e['name'] == 'col' and e['from'][0] == -28.8)
    clone(t, wall, [-24.0, 0, -105.6], [24.0, 54.4, -104.9], 'pared_cabina')
    clone(t, col, [-24.0, 0, -105.6], [24.0, 54.4, -104.9], 'col')
    save('torre_aurora', t); print('torre: pared de fondo añadida')
