"""Copiar el rig de Jesuluto y hornear sus tomas BBS para Blockbench y CalFight."""
import argparse
import base64
import bisect
import json
import math
from pathlib import Path
from uuid import uuid5, NAMESPACE_URL

from bbsparse import load

TICKS = 20
FPS = 60
BODY_TRACKS = ('pose', 'pose_overlay', 'pose_overlay0', 'pose_overlay1', 'pose_overlay2')
FACE_MAP = dict(front='north', back='south', right='east', left='west', top='up', bottom='down')
FIELDS = ('t', 'r', 's')
DEFAULT = (0, 0, 0, 0, 0, 0, 1, 1, 1)


def uid(name):
    return str(uuid5(NAMESPACE_URL, 'calfight/jesuluto/' + name))


def texture(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def pose_value(frame, bone):
    value = frame['value']
    if bone is not None:
        value = value.get('pose', {}).get(bone, {})
    return tuple(v for field, start in zip(FIELDS, (0, 3, 6)) for v in value.get(field, DEFAULT[start:start + 3]))


def sample(frames, tick, bone):
    if not frames:
        return DEFAULT
    times = [frame['tick'] for frame in frames]
    i = bisect.bisect_right(times, tick) - 1
    if i < 0:
        return pose_value(frames[0], bone)
    if i == len(frames) - 1:
        return pose_value(frames[i], bone)
    a, b = pose_value(frames[i], bone), pose_value(frames[i + 1], bone)
    h = times[i + 1] - times[i]
    u = (tick - times[i]) / h
    if frames[i].get('interp') != 'hermite':
        return tuple(x + (y - x) * u for x, y in zip(a, b))
    before, after = max(i - 1, 0), min(i + 2, len(frames) - 1)
    prev, following = pose_value(frames[before], bone), pose_value(frames[after], bone)
    m = h / (times[i + 1] - times[before])
    n = h / (times[after] - times[i])
    return tuple(
        (2*u**3 - 3*u*u + 1)*x + (u**3 - 2*u*u + u)*(y-w)*m
        + (-2*u**3 + 3*u*u)*y + (u**3-u*u)*(z-x)*n
        for w, x, y, z in zip(prev, a, b, following)
    )


def combine(a, b):
    return tuple(x + y if i < 6 else x * y for i, (x, y) in enumerate(zip(a, b)))


def bake(path, length):
    film, consumed, total, _ = load(path)
    assert consumed == total and len(film['replays']) == 1
    replay = film['replays'][0]
    form = replay['form']
    assert form['model'] == 'Rigs personales/Yo'
    assert form['parts'][0]['form']['model'] == 'Bbs model/Ojos Rig/JesulutoXD'
    props = {key: value['keyframes'] for key, value in replay['properties'].items()}
    tracks = {}
    for prop in BODY_TRACKS:
        frames = props.get(prop, [])
        for bone in sorted({bone for frame in frames for bone in frame['value'].get('pose', {})}):
            tracks.setdefault(bone, []).append((frames, bone))
    for bone in sorted({bone for frame in props.get('0/pose', []) for bone in frame['value'].get('pose', {})}):
        tracks['eyes_' + bone] = [(props['0/pose'], bone)]
    if 'transform' in props:
        tracks['film_root'] = [(props.get(prop, []), None) for prop in ('transform', 'transform_overlay')]
    samples = {}
    count = round(length * FPS / TICKS)
    for bone, layers in tracks.items():
        rows = []
        for frame in range(count + 1):
            tick = frame * TICKS / FPS
            values = DEFAULT
            for frames, target in layers:
                values = combine(values, sample(frames, tick, target))
            rows.append(tuple(round(v, 6) for v in values))
        if any(row != DEFAULT for row in rows):
            samples[bone] = rows
    return samples


def add_eyes(model, eyes, texture_data):
    origin = next(group['origin'] for group in model['groups'] if group['name'] == 'head')
    shift = lambda v: [round(x + y, 6) for x, y in zip(v, origin)]
    nodes = {}
    for name, group in eyes.items():
        key = 'eyes_' + name
        model['groups'].append({'name': key, 'uuid': uid(key), 'origin': shift(group['origin']), 'rotation': [0, 0, 0], 'export': True, 'visibility': True})
        node = nodes[name] = {'uuid': uid(key), 'children': []}
        for i, cube in enumerate(group.get('cubes', [])):
            cube_id = uid(key + '/' + str(i))
            faces = {}
            for face, uv in cube['uvs'].items():
                # La cuadrícula del proyecto es de 64, la de la textura de ojos es de 16.
                faces[FACE_MAP[face]] = {'uv': [x * 4 for x in uv[:4]], 'texture': 1, 'rotation': uv[4] if len(uv) > 4 else 0}
            model['elements'].append({'name': key, 'uuid': cube_id, 'type': 'cube', 'box_uv': False,
                'from': shift(cube['from']), 'to': shift([x + y for x, y in zip(cube['from'], cube['size'])]),
                'origin': shift(cube['origin']), 'rotation': cube.get('rotate', [0, 0, 0]),
                'inflate': cube.get('offset', 0), 'faces': faces})
            node['children'].append(cube_id)
    for name, group in eyes.items():
        if group.get('parent'):
            nodes[group['parent']]['children'].append(nodes[name])
    head = next(group for group in model['groups'] if group['name'] == 'head')
    def attach(nodes_to_visit):
        for node in nodes_to_visit:
            if not isinstance(node, dict):
                continue
            if node['uuid'] == head['uuid']:
                node['children'].append(nodes['anchor'])
                return True
            if attach(node['children']):
                return True
        return False
    assert attach(model['outliner'])
    model['textures'].append({'name': 'Normal_mujer.png', 'uuid': uid('eye_texture'), 'id': '1',
        'width': 16, 'height': 16, 'uv_width': 64, 'uv_height': 64, 'internal': True, 'source': texture_data})


def blockbench_clip(model, name, samples):
    groups = {group['name']: group['uuid'] for group in model['groups']}
    animators = {}
    length = (len(next(iter(samples.values()))) - 1) / FPS
    for bone, rows in samples.items():
        keys = []
        for field, start in zip(('position', 'rotation', 'scale'), (0, 3, 6)):
            if all(row[start:start+3] == DEFAULT[start:start+3] for row in rows):
                continue
            for i, row in enumerate(rows):
                v = row[start:start+3]
                if 0 < i < len(rows)-1 and rows[i-1][start:start+3] == v == rows[i+1][start:start+3]:
                    continue
                # BBS Model Exporter 5+: invierte X en posición y X/Y en rotación.
                if field == 'position':
                    v = (-v[0], v[1], v[2])
                elif field == 'rotation':
                    v = tuple(math.degrees(x) * sign for x, sign in zip(v, (-1, -1, 1)))
                keys.append({'channel': field, 'uuid': uid(f'{name}/{bone}/{field}/{i}'), 'time': round(i / FPS, 6),
                    'interpolation': 'linear', 'data_points': [dict(zip('xyz', (round(x, 5) for x in v)))]})
        animators[groups[bone]] = {'name': bone, 'type': 'bone', 'keyframes': keys}
    return {'uuid': uid(name), 'name': name, 'loop': 'loop', 'length': length, 'snapping': FPS, 'animators': animators}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('assets', type=Path, help='config/bbs/assets/models')
    parser.add_argument('films', type=Path, help='Carpeta que contiene idle.dat y walkfront.dat')
    parser.add_argument('output', type=Path, help='Ruta de la copia editable .bbmodel')
    args = parser.parse_args()
    body_dir = args.assets / 'Rigs personales' / 'Yo'
    eye_dir = args.assets / 'Bbs model' / 'Ojos Rig' / 'JesulutoXD'
    repo = Path(__file__).resolve().parent.parent
    project = read_json(body_dir / 'Yo xd V2.bbmodel')
    project['name'] = 'Jesuluto CalFight'
    skin = texture(body_dir / 'Con ojos.png')
    eyes = texture(eye_dir / 'Normal_mujer.png')
    project['textures'][0].update(internal=True, source=skin)
    for key in ('path', 'relative_path'):
        project['textures'][0].pop(key, None)
    eye_groups = read_json(eye_dir / 'Jesuluto ojos rig mujer.bbs.json')['model']['groups']
    add_eyes(project, eye_groups, eyes)
    project['groups'].append({'name':'film_root', 'uuid':uid('film_root'), 'origin':[0,0,0], 'rotation':[0,0,0], 'export':True, 'visibility':True})
    project['outliner'] = [{'uuid':uid('film_root'), 'children':project['outliner']}]
    clips = {'Idle BBS': bake(args.films / 'idle.dat', 153), 'Walkfront': bake(args.films / 'walkfront.dat', 32)}
    project['animations'].extend(blockbench_clip(project, name, data) for name, data in clips.items())
    for anim in project['animations']:
        anim['selected'] = anim['name'] == 'Walkfront'
    output = args.output.resolve()
    if output == (body_dir / 'Yo xd V2.bbmodel').resolve():
        parser.error('Elegí una ruta nueva para la copia del modelo.')
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(project, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    rig = read_json(body_dir / 'model.bbs.json')['model']['groups']
    for name, group in eye_groups.items():
        rig['eyes_' + name] = {**group, 'parent': 'eyes_' + group['parent'] if group.get('parent') else 'head', 'eye': True}
    runtime = {'groups': rig, 'eyes': eyes, 'idle': clips['Idle BBS'], 'walk': clips['Walkfront']}
    html = repo / 'index.html'
    source = html.read_text(encoding='utf-8')
    start, end = '/* JESULUTO_BBS_DATA_BEGIN */', '/* JESULUTO_BBS_DATA_END */'
    payload = start + '\nconst JESULUTO_BBS = ' + json.dumps(runtime, separators=(',', ':')) + ';\n' + end
    if start in source:
        source = source[:source.index(start)] + payload + source[source.index(end) + len(end):]
    else:
        source = source.replace('// ===== Jesuluto: pantalla', payload + '\n// ===== Jesuluto: pantalla', 1)
    i = source.index('  jesuluto: {\n')
    skin_at = source.index('skinData: ', i)
    j = source.rfind('\n', i, skin_at) + 1
    k = source.index('\n', j)
    source = source[:j] + f'    slim: true, skinData: {json.dumps(skin)},' + source[k:]
    html.write_text(source, encoding='utf-8', newline='')
    print(output)
    print('Clips:', [(name, len(next(iter(data.values()))), sorted(data)) for name, data in clips.items()])


if __name__ == '__main__':
    main()
