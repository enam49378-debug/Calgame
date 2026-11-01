"""Interiores para los edificios que no tenían (apartamentos, oficinas, casas, tiendas, torres, hotel, gimnasio, museo, art déco).
No se entra mientras el edificio está entero (su colisión es un bloque), pero al destruir los muros se ve el interior y, como la colisión
también se rompe, se puede pasar por donde se rompió.
Uso:  python tools/gen_interior_fill.py      (edita ciudad/*.bbmodel y regenera sus .js; se puede repetir sin duplicar)
"""
import copy, json, random, sys, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_edificios as G
import gen_interiores as I

I.register()
T = .4
# nombre -> (ancho, fondo, alto, tipo)
BUILDINGS = {
    'apartamentos_ladrillo': (9, 9, 12.1, 'casa'), 'apartamentos_menta': (9, 9, 12.1, 'casa'), 'apartamentos_cielo': (9, 9, 12.1, 'casa'),
    'oficinas_gris': (10, 9, 15.0, 'oficina'), 'oficinas_azules': (10, 9, 15.0, 'oficina'),
    'casa_tienda_durazno': (8, 7, 6.3, 'tienda'), 'casa_tienda_rosa': (8, 7, 6.3, 'tienda'),
    'tienda_amarilla': (8, 6, 6.3, 'tienda'), 'tienda_lila': (8, 6, 6.3, 'tienda'),
    'torre_residencial_salvia': (9, 9, 17.4, 'casa'), 'torre_residencial_naranja': (9, 9, 17.4, 'casa'),
    'artdeco_crema': (9, 8, 22.7, 'oficina'), 'hotel_rosa': (8, 9, 12.3, 'hotel'),
    'gimnasio': (12, 18, 7.5, 'gimnasio'), 'museo': (10, 16, 6.0, 'museo'),
}


class OffModel(G.Model):
    """Los muebles de gen_interiores se dibujan con el piso en y=0: se desplazan a la altura de cada planta."""
    oy = 0.0

    def cube(self, x, y, z, w, h, d, t, rot=None, label=None):
        super().cube(x, y + self.oy, z, w, h, d, t, rot, label)

    def col(self, *a, **k): pass


def furnish(m, kind, hx, hz, y, k, rng, fh):
    m.oy = y
    sx = 1 if k % 2 == 0 else -1
    I.pendant(m, 0, 0, fh - .2, fh - 1.1, .8)
    if kind == 'casa':
        I.rug(m, 0, .3, hx * 1.1, hz * .9, 'carpet_red', 'gold')
        I.sofa(m, -sx * (hx - 1.0), -hz + 1.3, 2.2, 'S', rng.choice(['cloth_blue', 'cloth_red', 'cloth_cream']))
        I.table(m, 0, .3, 1.3, .8, .5, collide=False)
        I.shelf_unit(m, sx * (hx - .5), hz - .45, 1.8, .45, 2.2, 'N', 4, col=False)
        I.plant(m, -sx * (hx - .6), hz - .6, 1.6, collide=False)
        for dz in (-1, 1): I.chair(m, hx - 1.2, dz * 1.4, 'W', 'cloth_red', collide=False)
        I.table(m, hx - 2.0, 0, .9, 1.2, .8, collide=False)
    elif kind == 'oficina':
        for i in range(2):
            for j in range(2):
                x, z = -hx / 2 + i * hx, -hz / 2 + j * hz * .9
                I.table(m, x, z, 1.5, .8, .78, 'marble', 'metal_dark', collide=False)
                m.cube(x, .78, z - .15, .5, .35, .06, 'screen_c'); m.cube(x, .78, z - .12, .2, .1, .2, 'metal_dark')
                I.chair(m, x, z + .8, 'N', 'cloth_blue', collide=False)
        I.plant(m, hx - .6, hz - .6, 1.6, collide=False); I.plant(m, -hx + .6, hz - .6, 1.6, collide=False)
        I.shelf_unit(m, 0, hz - .45, 2.4, .45, 2.2, 'N', 4, col=False)
    elif kind == 'tienda':
        I.counter(m, 0, -hz + 1.2, 2.6, .8, 'S', col=False)
        for dx in (-1, 1): I.shelf_unit(m, dx * (hx - .5), 0, .5, 2.6, 2.1, 'E' if dx > 0 else 'W', 4, 'goods', col=False)
        I.shelf_unit(m, 0, hz - .45, 2.6, .45, 2.2, 'N', 4, 'goods', col=False)
        I.round_table(m, hx - 1.5, -hz + 1.6, .5)
    elif kind == 'hotel':
        for sg in (-1, 1):
            m.cube(sg * (hx - 1.1), 0, -hz + 1.5, 1.6, .45, 2.1, 'dark_planks'); m.cube(sg * (hx - 1.1), .45, -hz + 1.6, 1.5, .25, 1.9, 'cloth_cream'); m.cube(sg * (hx - 1.1), .55, -hz + .75, 1.3, .3, .4, 'cloth_red')
            m.cube(sg * (hx - 2.2), 0, -hz + .6, .5, .5, .5, 'dark_planks')
        I.rug(m, 0, 0, 2.4, 3.0, 'carpet_red', 'gold'); I.plant(m, hx - .6, hz - .6, 1.5, collide=False)
        I.table(m, -hx + 1.0, hz - .8, 1.2, .6, .8, collide=False)
    elif kind == 'gimnasio':
        for i in range(3):
            z = -hz + 2.5 + i * 3.4
            m.cube(-hx + 1.4, 0, z, 1.2, .5, 2.4, 'cloth_red'); m.cube(-hx + 1.4, .5, z - 1.0, 1.2, 1.4, .12, 'metal_dark')
            m.cube(hx - 1.6, 0, z, .12, 1.8, .12, 'metal_dark'); m.cube(hx - 1.6, 1.7, z, 1.8, .12, .12, 'metal_dark')
            m.cube(hx - 2.4, 1.78, z, .1, .35, .35, 'metal_dark'); m.cube(hx - .8, 1.78, z, .1, .35, .35, 'metal_dark')
        I.rug(m, 0, 0, 5.0, hz * 1.4, 'cloth_blue', 'metal_dark')
        for k2 in range(4): m.cube(-1.0 + k2 * .7, 0, hz - 1.2, .3, .35, .3, 'metal_dark')
    elif kind == 'museo':
        for i in range(3):
            z = -hz + 2.5 + i * 4.8
            for dx in (-1, 1):
                m.cube(dx * 2.6, 0, z, 1.2, 1.0, 1.2, 'marble'); m.cube(dx * 2.6, 1.0, z, .6, .6, .6, 'gold' if (i + dx) % 2 else 'glow')
            I.wall_item(m, hx * 2 + 0.8, hz * 2 + 0.8, 'E', z, 1.6, 2.2, 1.4, 'paint_a' if i % 2 else 'paint_b', out=.0)
            I.wall_item(m, hx * 2 + 0.8, hz * 2 + 0.8, 'W', z, 1.6, 2.2, 1.4, 'paint_c', out=.0)
        I.rug(m, 0, 0, 3.0, hz * 1.6, 'carpet_red', 'gold')


def stairs(m, hx, hz, y0, fh, side):
    n = int(fh / .22)
    for i in range(n):
        m.oy = 0
        G.Model.cube(m, side * (hx - .65), y0 + i * (fh / n), hz - 1.0 - i * (2.0 / n) + .9, 1.1, (fh / n) * (1 + 0), 2.0 / n + .02, 'dark_planks') if False else None
        m.cube(side * (hx - .65), y0 + i * (fh / n), -hz + 1.0 + i * (2.4 / n), 1.1, fh / n, 2.4 / n + .02, 'dark_planks')


def fill(name, W, D, H, kind, idx):
    f = G.OUT / (name + '.bbmodel')
    d = json.loads(f.read_text(encoding='utf-8'))
    # quitar interior anterior
    old = [g for g in d['outliner'] if isinstance(g, dict) and g['name'].startswith('Interior')]
    ids = {c for g in old for c in g['children']}
    d['elements'] = [e for e in d['elements'] if e['uuid'] not in ids]
    d['outliner'] = [g for g in d['outliner'] if g not in old]
    rng = random.Random(500 + idx)
    m = OffModel(name); hx, hz = W / 2 - T - .1, D / 2 - T - .1
    ground = 3.4 if kind in ('casa', 'oficina', 'hotel') else H - .4
    fh = 3.2 if kind in ('casa', 'oficina', 'hotel') else H - .5
    floors = max(1, int((H - 1.0) // fh)) if kind in ('casa', 'oficina', 'hotel') else 1
    if kind == 'tienda': floors = 2; fh = (H - .5) / 2
    m.group('Interior')
    for k in range(floors):
        y = .06 + k * fh
        m.oy = 0
        if k > 0:   # losa con hueco de escalera
            m.cube(-.55, y - .2, 0, 2 * hx - 1.1, .2, 2 * hz, 'oak_planks')
            m.cube(hx - .55, y - .2, -hz + 1.0 + (hz - 1.0) * 0 + (2 * hz - 2.6) / 2 + 2.6 - 1.0 + 0, 1.1, .2, 2 * hz - 2.6, 'oak_planks') if False else None
            m.cube(hx - .55, y - .2, 1.3, 1.1, .2, 2 * hz - 2.6, 'oak_planks')
        furnish(m, kind, hx - 1.1, hz, y, k, rng, fh)
        if floors > 1 and k < floors - 1: stairs(m, hx, hz, y, fh, 1)
        if k > 0 or True:
            m.oy = 0; m.cube(0, y + fh - .22, 0, 2 * hx, .12, 2 * hz, 'ceil_white')
    m.oy = 0
    # divisiones interiores con hueco de puerta, para que no se vea una sola sala
    if kind in ('casa', 'hotel', 'oficina') and W > 8:
        for k in range(floors):
            y = .06 + k * fh
            m.cube(-hx * .25, y, -.2, .12, fh - .3, hz * .9, 'wall_sand')
    groups = {g: es for g, es in m.groups.items() if g != 'colision'}
    for gname, els in groups.items():
        d['outliner'].append({'name': 'Interior · ' + gname, 'origin': [0, 0, 0], 'rotation': [0, 0, 0], 'color': 0, 'uuid': str(uuid.uuid4()), 'export': True,
                              'mirror_uv': False, 'isOpen': False, 'locked': False, 'visibility': True, 'autouv': 0, 'children': [e['uuid'] for e in els]})
        d['elements'] += els
    f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    c = copy.deepcopy(d); c['textures'][0]['source'] = ''
    (G.OUT / (name + '.js')).write_text("(window.BB_MODELS=window.BB_MODELS||{})['%s']=%s;" % (name, json.dumps(c, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
    return sum(len(v) for v in groups.values())


if __name__ == '__main__':
    for i, (name, (W, D, H, kind)) in enumerate(BUILDINGS.items()):
        print('%-28s %s  %d cubos' % (name, kind, fill(name, W, D, H, kind, i)))
