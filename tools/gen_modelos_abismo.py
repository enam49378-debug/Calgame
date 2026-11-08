"""Genera los modelos de Blockbench (.bbmodel) del abismo: enemigos y barco fantasma, con huesos y animaciones.
Se pueden abrir y editar en Blockbench (Archivo > Abrir modelo). El juego los carga desde modelos/abismo/.
Uso:  python tools/gen_modelos_abismo.py
Convenciones: 1 píxel de Blockbench = 1/16 de bloque; el frente del modelo mira a +Z; los cubos cuyo nombre empieza por «glow_» brillan (sin sombreado)."""
import base64, io, json, math, os, random, uuid
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'modelos', 'abismo')
os.makedirs(OUT, exist_ok=True)
rnd = random.Random(7)
uid = lambda: str(uuid.UUID(int=rnd.getrandbits(128)))
FACES = ['north', 'east', 'south', 'west', 'up', 'down']


class Model:
    def __init__(self, name):
        self.name = name; self.els = []; self.top = []; self.bones = {}; self.pal = []; self.anims = []

    def color(self, c):
        if c not in self.pal: self.pal.append(c)
        return self.pal.index(c)

    def bone(self, name, origin, parent=None, rot=None):
        b = {'name': name, 'origin': list(origin), 'rotation': list(rot or [0, 0, 0]), 'uuid': uid(), 'children': [], 'export': True, 'isOpen': True, 'visibility': True}
        (self.bones[parent]['children'] if parent else self.top).append(b); self.bones[name] = b; return name

    def cube(self, bone, frm, to, color, name=None):
        ci = self.color(color); e = {'name': name or ('cubo%d' % len(self.els)), 'type': 'cube', 'uuid': uid(), 'from': [float(v) for v in frm], 'to': [float(v) for v in to], 'origin': [float(v) for v in frm], 'rotation': [0, 0, 0], 'color': ci, 'autouv': 0, 'faces': {}}
        e['_tile'] = ci; self.els.append(e); self.bones[bone]['children'].append(e['uuid']); return e

    def mirror(self, bone, frm, to, color, name=None):   # copia en X negativa
        return self.cube(bone, [-to[0], frm[1], frm[2]], [-frm[0], to[1], to[2]], color, name)

    def anim(self, name, length, tracks, loop='loop'):
        an = {}
        for bn, chans in tracks.items():
            kfs = []
            for ch, pts in chans.items():
                for t, v in pts:
                    kfs.append({'channel': ch, 'data_points': [{'x': str(round(v[0], 3)), 'y': str(round(v[1], 3)), 'z': str(round(v[2], 3))}], 'uuid': uid(), 'time': round(t, 4), 'color': -1, 'interpolation': 'linear'})
            an[self.bones[bn]['uuid']] = {'name': bn, 'type': 'bone', 'keyframes': kfs}
        self.anims.append({'uuid': uid(), 'name': name, 'loop': loop, 'override': False, 'length': length, 'snapping': 24, 'selected': False, 'anim_time_update': '', 'blend_weight': '', 'start_delay': '', 'loop_delay': '', 'animators': an})

    def save(self):
        n = max(1, len(self.pal)); cols = 8; rows = (n + cols - 1) // cols; W = cols * 16; H = max(16, rows * 16)
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for i, c in enumerate(self.pal):
            r, g, b = int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16); x0, y0 = (i % cols) * 16, (i // cols) * 16
            for x in range(16):
                for y in range(16):
                    j = rnd.randint(-7, 7) if 1 < x < 14 and 1 < y < 14 else -18
                    img.putpixel((x0 + x, y0 + y), (max(0, min(255, r + j)), max(0, min(255, g + j)), max(0, min(255, b + j)), 255))
        buf = io.BytesIO(); img.save(buf, 'PNG')
        for e in self.els:
            i = e.pop('_tile'); x0, y0 = (i % cols) * 16, (i // cols) * 16
            e['faces'] = {f: {'uv': [x0 + 2, y0 + 2, x0 + 14, y0 + 14], 'texture': 0} for f in FACES}
        data = {'meta': {'format_version': '4.5', 'model_format': 'free', 'box_uv': False}, 'name': self.name, 'model_identifier': '', 'visible_box': [1, 1, 0], 'variable_placeholders': '', 'variable_placeholder_buttons': [], 'timeline_setups': [], 'unhandled_root_fields': {},
                'resolution': {'width': W, 'height': H}, 'elements': self.els, 'outliner': self.top,
                'textures': [{'path': '', 'name': self.name + '.png', 'folder': '', 'namespace': '', 'id': '0', 'particle': False, 'render_mode': 'default', 'render_sides': 'auto', 'frame_time': 1, 'frame_order_type': 'loop', 'frame_order': '', 'frame_interpolate': False, 'visible': True, 'mode': 'bitmap', 'saved': True, 'uuid': uid(), 'relative_path': '', 'source': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}],
                'animations': self.anims}
        with open(os.path.join(OUT, self.name + '.bbmodel'), 'w', encoding='utf-8') as f: json.dump(data, f, separators=(',', ':'))
        print(self.name, len(self.els), 'cubos', len(self.anims), 'animaciones')


def wave(amp, phase=0, n=8, length=1.0, base=0.0, axis=0):
    """keyframes senoidales para un canal (valores en grados) sobre una vuelta de `length`"""
    pts = []
    for i in range(n + 1):
        t = length * i / n; v = base + amp * math.sin(2 * math.pi * i / n + phase); vec = [0, 0, 0]; vec[axis] = v; pts.append((t, vec))
    return pts


def loop_wave(tracks, bone, amp, phase, length, axis=0, chan='rotation', base=0.0):
    tracks.setdefault(bone, {}).setdefault(chan, [])
    tracks[bone][chan] = [(t, [a + b for a, b in zip(tracks[bone][chan][i][1], v)] if len(tracks[bone][chan]) > i else v) for i, (t, v) in enumerate(wave(amp, phase, 8, length, base, axis))]


def merge(*dicts):
    out = {}
    for d in dicts:
        for b, ch in d.items():
            for c, pts in ch.items():
                if c in out.get(b, {}):
                    out[b][c] = [(t, [x + y for x, y in zip(v1, v2)]) for (t, v1), (_, v2) in zip(out[b][c], pts)]
                else: out.setdefault(b, {})[c] = pts
    return out


def tr(bone, axis, amp, phase, length, chan='rotation', base=0.0):
    return {bone: {chan: wave(amp, phase, 8, length, base, axis)}}


# ============================================================ CANGREJO ABISAL
def crab():
    m = Model('cangrejo'); m.bone('root', [0, 0, 0]); m.bone('body', [0, 10, 0], 'root')
    m.cube('body', [-14, 10, -9], [14, 16, 10], '#8a2418', 'caparazon'); m.cube('body', [-11, 16, -7], [11, 19, 7], '#b8442a'); m.cube('body', [-12, 7, -8], [12, 10, 8], '#4a1a12')
    for i in range(6):
        x = -10 + i * 4; z = -5 + (i % 2) * 4; m.cube('body', [x, 19, z], [x + 2, 25 - (i % 2) * 2, z + 2], '#5a1810')
    for sx in (-1, 1):
        m.cube('body', [14 * sx if sx > 0 else -19, 12, 1], [19 if sx > 0 else -14, 14, 4], '#5a1810')
    for i in range(10):
        m.cube('body', [-12 + (i * 7) % 24, 19, -6 + (i * 5) % 12], [-10.8 + (i * 7) % 24, 20.2, -4.8 + (i * 5) % 12], '#9aa6a0')
    for i in range(6): m.cube('body', [-9 + i * 3.4, 19.05, -3 + (i % 3) * 2.5], [-7 + i * 3.4, 19.6, -2.2 + (i % 3) * 2.5], '#ff7a2a', 'glow_grieta%d' % i)
    m.cube('body', [-5, 8, 10], [5, 12, 12], '#1a0e0a', 'boca')
    for i in range(5): m.cube('body', [-4.5 + i * 2.2, 8, 12], [-3.5 + i * 2.2, 10.5, 13], '#e8dcc0')
    for sx, n in ((-1, 'eyeL'), (1, 'eyeR')):
        m.bone(n, [5 * sx, 16, 9], 'body'); x = 5 * sx
        m.cube(n, [x - 1, 16, 8], [x + 1, 23, 10], '#5a1810'); m.cube(n, [x - 2.5, 23, 7.5], [x + 2.5, 27, 12.5], '#ffe14a', 'glow_ojo' + n); m.cube(n, [x - 1, 24, 12.5], [x + 1, 26.5, 13.2], '#000000')
    for sx, n in ((-1, 'clawL'), (1, 'clawR')):
        m.bone(n, [15 * sx, 13, 8], 'body'); f = (lambda a, b: (a, b)) if sx > 0 else (lambda a, b: (-b, -a))
        def cb(parent, x0, y0, z0, x1, y1, z1, col, name=None):
            a, b = f(x0, x1); m.cube(parent, [a, y0, z0], [b, y1, z1], col, name)
        cb(n, 15, 10, 5, 22, 15, 12, '#8a2418'); cb(n, 20, 9, 11, 27, 16, 20, '#8a2418'); cb(n, 22, 8, 19, 34, 19, 29, '#b8442a')
        cb(n, 22, 8, 29, 28, 13, 39, '#8a2418'); cb(n, 28, 10, 28, 33, 12, 30, '#e8dcc0')
        fn = n + '_dedo'; m.bone(fn, [30 * sx, 14, 29], n); cb(fn, 28, 14, 29, 34, 19, 39, '#8a2418')
        for i in range(4): cb(fn, 28.5, 13, 30.5 + i * 2.2, 30, 14.2, 31.5 + i * 2.2, '#e8dcc0')
    for sx, side in ((-1, 'L'), (1, 'R')):
        for i, z in enumerate((-6, -2, 2, 6)):
            n = 'pata%s%d' % (side, i + 1); m.bone(n, [14 * sx, 11, z], 'body'); a, b = (14, 22) if sx > 0 else (-22, -14)
            m.cube(n, [a, 10, z - 1], [b, 13, z + 1], '#5a1810'); lo = n + '_baja'; m.bone(lo, [22 * sx, 11, z], n); a2, b2 = (21, 24) if sx > 0 else (-24, -21)
            m.cube(lo, [a2, 1, z - 1], [b2, 12, z + 1], '#4a1410')
    idle = merge(tr('body', 1, .6, 0, 2.0, 'position'), tr('eyeL', 2, 8, 0, 2.0), tr('eyeR', 2, 8, 1.5, 2.0), tr('clawL', 0, -5, 0, 2.0), tr('clawR', 0, -5, 1.0, 2.0), tr('clawL_dedo', 2, 14, 0, 2.0, base=14), tr('clawR_dedo', 2, -14, 1.0, 2.0, base=-14))
    walk = {}
    for side in 'LR':
        for i in range(4):
            ph = i * math.pi / 2 + (math.pi if side == 'R' else 0)
            walk = merge(walk, tr('pata%s%d' % (side, i + 1), 1, 28, ph, .55), tr('pata%s%d_baja' % (side, i + 1), 2, 18, ph + 1.2, .55))
    walk = merge(walk, tr('body', 1, 1.2, 0, .55, 'position'), tr('clawL', 0, -6, 0, .55), tr('clawR', 0, -6, 3, .55))
    atk = merge({'clawL': {'rotation': [(0, [0, 0, 0]), (.2, [-70, 0, 0]), (.35, [-70, 0, 0]), (.5, [10, 0, 0])]}, 'clawR': {'rotation': [(0, [0, 0, 0]), (.2, [-70, 0, 0]), (.35, [-70, 0, 0]), (.5, [10, 0, 0])]},
                 'clawL_dedo': {'rotation': [(0, [0, 0, 14]), (.18, [0, 0, 40]), (.28, [0, 0, 0]), (.38, [0, 0, 40]), (.5, [0, 0, 14])]}, 'clawR_dedo': {'rotation': [(0, [0, 0, -14]), (.18, [0, 0, -40]), (.28, [0, 0, 0]), (.38, [0, 0, -40]), (.5, [0, 0, -14])]}})
    m.anim('idle', 2.0, idle); m.anim('walk', .55, walk); m.anim('attack', .5, atk); m.save()


# ============================================================ MEDUSA ELÉCTRICA
def jelly():
    m = Model('medusa'); m.bone('root', [0, 0, 0]); m.bone('campana', [0, 28, 0], 'root')
    hw = [15, 14, 12.5, 10.5, 8, 5]
    for i, w in enumerate(hw): m.cube('campana', [-w, 28 + i * 3, -w], [w, 31 + i * 3, w], '#ff7fd0' if i % 2 else '#ff9fe0', 'campana%d' % i)
    m.cube('campana', [-16, 26, -16], [16, 28.5, 16], '#ffc8f0', 'borde')
    m.bone('nucleo', [0, 33, 0], 'campana'); m.cube('nucleo', [-4, 29, -4], [4, 37, 4], '#ffffff', 'glow_nucleo')
    for i in range(8):
        a = i / 8 * math.tau; x, z = math.cos(a) * 12, math.sin(a) * 12; m.cube('campana', [x - .8, 27, z - .8], [x + .8, 29, z + .8], '#7df9ff', 'glow_nodo%d' % i)
        for k in (0, 1): m.cube('campana', [math.cos(a) * 5 - .5, 31 + k * 3, math.sin(a) * 5 - .5], [math.cos(a) * 9 + .5, 32 + k * 3, math.sin(a) * 9 + .5], '#bff8ff', 'glow_vena%d_%d' % (i, k))
    for i in range(10):
        a = i / 10 * math.tau; x, z = math.cos(a) * 11, math.sin(a) * 11; n = 't%d' % i; m.bone(n, [x, 26, z], 'root'); m.cube(n, [x - 1, 19, z - 1], [x + 1, 26, z + 1], '#ff9ee0')
        n2 = n + 'b'; m.bone(n2, [x, 19, z], n); m.cube(n2, [x - .9, 12, z - .9], [x + .9, 19, z + .9], '#ff86d4'); n3 = n + 'c'; m.bone(n3, [x, 12, z], n2); m.cube(n3, [x - .7, 4, z - .7], [x + .7, 12, z + .7], '#ff70c8')
    for i in range(4):
        a = i / 4 * math.tau + .4; x, z = math.cos(a) * 4, math.sin(a) * 4; n = 'brazo%d' % i; m.bone(n, [x, 28, z], 'root'); m.cube(n, [x - 3, 14, z - .6], [x + 3, 28, z + .6], '#ffc2f4'); m.cube(n, [x - 2, 6, z - .5], [x + 2, 14, z + .5], '#ffb0ee')
    idle = {}; atk = {}; walk = {}
    for L, tgt in ((2.4, idle), (1.2, walk)):
        res = merge(tr('campana', 1, .07, 0, L, 'scale', 1.0))
        res['campana']['scale'] = [(t, [1 + .07 * math.sin(2 * math.pi * i / 8), 1 - .1 * math.sin(2 * math.pi * i / 8), 1 + .07 * math.sin(2 * math.pi * i / 8)]) for i, (t, _) in enumerate(wave(1, 0, 8, L))]
        for i in range(10):
            for suf, k in (('', 1), ('b', 1.4), ('c', 1.9)):
                res = merge(res, tr('t%d%s' % (i, suf), 0, 9 * k, -i * .6 - (0 if not suf else .5), L), tr('t%d%s' % (i, suf), 2, 8 * k, -i * .5, L))
        for i in range(4): res = merge(res, tr('brazo%d' % i, 2, 14, i, L), tr('brazo%d' % i, 0, 10, i * 1.3, L))
        tgt.update(res)
    atk = {'campana': {'scale': [(0, [1, 1, 1]), (.4, [1.28, .86, 1.28]), (.8, [1.28, .86, 1.28]), (1.0, [.9, 1.15, .9]), (1.2, [1, 1, 1])]}, 'nucleo': {'scale': [(0, [1, 1, 1]), (.4, [2.4, 2.4, 2.4]), (.8, [2.8, 2.8, 2.8]), (1.2, [1, 1, 1])]}}
    m.anim('idle', 2.4, idle); m.anim('walk', 1.2, walk); m.anim('attack', 1.2, atk); m.save()


# ============================================================ RAPE ABISAL
def angler():
    m = Model('rape'); m.bone('root', [0, 0, 0]); m.bone('cuerpo', [0, 14, 0], 'root')
    m.cube('cuerpo', [-9, 8, -14], [9, 22, 12], '#243a66', 'cuerpo'); m.cube('cuerpo', [-8, 6, -12], [8, 8, 10], '#6a7a98'); m.cube('cuerpo', [-7, 22, -12], [7, 24, 8], '#1a2a4c')
    m.cube('cuerpo', [-8, 12, 12], [8, 17, 24], '#243a66', 'mandibula_sup'); m.cube('cuerpo', [-7, 11.5, 12], [7, 12.5, 23], '#4a0a0e')
    for i in range(8):
        x = -7 + i * 2; m.cube('cuerpo', [x, 7.5, 21 + (i % 2) * 2], [x + 1, 12, 22.2 + (i % 2) * 2], '#f2f0e0', 'diente_sup%d' % i)
    m.bone('mandibula', [0, 10, 11], 'cuerpo'); m.cube('mandibula', [-7, 6, 11], [7, 10, 23], '#1c2c52'); m.cube('mandibula', [-6, 10, 12], [6, 10.8, 22], '#4a0a0e')
    for i in range(7):
        x = -6 + i * 2; m.cube('mandibula', [x, 10.5, 20 + (i % 2) * 2.5], [x + 1, 15 + (i % 3), 21.2 + (i % 2) * 2.5], '#f2f0e0', 'diente_inf%d' % i)
    for sx in (-1, 1):
        m.cube('cuerpo', [9 * sx - (0 if sx > 0 else 2), 15, 7], [9 * sx + (2 if sx > 0 else 0), 21, 13], '#ffd24a', 'glow_ojo%d' % sx); m.cube('cuerpo', [9.4 * sx - (0 if sx > 0 else 1.2), 16, 9.5], [9.4 * sx + (1.2 if sx > 0 else 0), 20, 10.8], '#000000')
    for n, org, frm, to in (('cebo1', (0, 24, 8), (-.7, 24, 7.3), (.7, 30, 8.7)), ('cebo2', (0, 30, 8), (-.6, 30, 8), (.6, 34, 14)), ('cebo3', (0, 33, 14), (-.5, 31, 14), (.5, 36, 20))):
        pass
    m.bone('cebo1', [0, 24, 8], 'cuerpo'); m.cube('cebo1', [-.8, 24, 7], [.8, 31, 9], '#162038'); m.bone('cebo2', [0, 31, 8], 'cebo1'); m.cube('cebo2', [-.7, 30, 8], [.7, 33, 15], '#162038'); m.bone('cebo3', [0, 32, 15], 'cebo2'); m.cube('cebo3', [-.6, 28, 14], [.6, 33, 16], '#162038'); m.cube('cebo3', [-2.5, 24, 14], [2.5, 29, 19], '#7dffb0', 'glow_señuelo')
    m.bone('colaA', [0, 15, -13], 'cuerpo'); m.cube('colaA', [-6, 10, -26], [6, 20, -13], '#1c2c52'); m.bone('colaB', [0, 15, -26], 'colaA'); m.cube('colaB', [-3.5, 11, -34], [3.5, 19, -26], '#1a2848'); m.cube('colaB', [-.8, 6, -42], [.8, 24, -33], '#2a4a7a', 'aleta_cola')
    for sx, n in ((-1, 'aletaL'), (1, 'aletaR')):
        m.bone(n, [9 * sx, 13, 3], 'cuerpo'); a, b = (9, 20) if sx > 0 else (-20, -9)
        m.cube(n, [a, 11.5, 1], [b, 13, 9], '#2a4a7a'); m.cube(n, [a + (1 if sx > 0 else 0), 11, 2], [b - (0 if sx > 0 else 1), 11.8, 6], '#385a8a')
    for i in range(7): m.cube('cuerpo', [-.8, 24, -10 + i * 2.6], [.8, 28 - abs(i - 3) * .8, -8.5 + i * 2.6], '#162038', 'espina%d' % i)
    for i in range(10): m.cube('cuerpo', [-9.3 + (0 if i % 2 else 18.3), 10 + (i * 3) % 9, -10 + i * 2], [-8.8 + (0 if i % 2 else 18.3), 11 + (i * 3) % 9, -9 + i * 2], '#7dffb0', 'glow_punto%d' % i)
    idle = merge(tr('mandibula', 0, 4, 0, 2.2, base=6), tr('colaA', 1, 10, 0, 2.2), tr('colaB', 1, 14, .8, 2.2), tr('cebo1', 0, 6, 0, 2.2), tr('cebo2', 0, 9, .7, 2.2), tr('cebo3', 0, 12, 1.4, 2.2), tr('aletaL', 2, 12, 0, 1.1), tr('aletaR', 2, -12, 0, 1.1), tr('cuerpo', 1, 1.2, 0, 2.2, 'position'))
    walk = merge(tr('mandibula', 0, 3, 0, 1.0, base=6), tr('colaA', 1, 20, 0, .8), tr('colaB', 1, 26, .9, .8), tr('cebo1', 0, 8, 0, .8), tr('cebo3', 0, 14, 1.2, .8), tr('aletaL', 2, 24, 0, .5), tr('aletaR', 2, -24, 0, .5), tr('cuerpo', 1, 2, 0, .8, 'position'))
    atk = {'mandibula': {'rotation': [(0, [6, 0, 0]), (.3, [48, 0, 0]), (.6, [48, 0, 0]), (.75, [-4, 0, 0]), (1.0, [6, 0, 0])]}, 'cuerpo': {'position': [(0, [0, 0, 0]), (.3, [0, 0, -3]), (.6, [0, 0, 3]), (1.0, [0, 0, 0])]}}
    m.anim('idle', 2.2, idle); m.anim('walk', .8, walk); m.anim('attack', 1.0, atk); m.save()


# ============================================================ MARINERO AHOGADO y CAPITÁN
def drowned(captain=False):
    m = Model('capitan' if captain else 'marinero'); m.bone('root', [0, 0, 0]); m.bone('cadera', [0, 12, 0], 'root'); m.bone('torso', [0, 12, 0], 'cadera')
    sk, cl, pn, bn = '#7f9a88', '#2e4252', '#22303c', '#e6e0cc'
    for sx, n in ((1, 'piernaL'), (-1, 'piernaR')):
        m.bone(n, [4 * sx, 12, 0], 'cadera'); a, b = (2, 6) if sx > 0 else (-6, -2)
        m.cube(n, [a, 6, -2], [b, 12, 2], pn); m.cube(n, [a - .3 * sx, 8, -2.3], [b + .3 * sx, 10, 2.3], cl, 'harapo' + n)
        k = n + '_rodilla'; m.bone(k, [4 * sx, 6, 0], n); a2, b2 = (2.3, 5.7) if sx > 0 else (-5.7, -2.3)
        m.cube(k, [a2, 0, -1.7], [b2, 6, 1.7], sk); m.cube(k, [a, 0, -2], [b, 1.6, 3.5], bn)
    m.cube('torso', [-5, 12, -2.5], [5, 24, 2.5], cl, 'torso'); m.cube('torso', [-5.4, 12, -2.9], [5.4, 14, 2.9], pn)
    for i in range(5): m.cube('torso', [-3.6, 14.5 + i * 1.7, 2.5], [3.6, 15.2 + i * 1.7, 3.1], bn, 'costilla%d' % i)
    m.cube('torso', [-.5, 14, 2.4], [.5, 24, 3.1], bn)
    for i in range(3): m.cube('torso', [-5 + i * 3.6, 6, 2.6], [-3 + i * 3.6, 14, 3.2], cl, 'jirón%d' % i)
    for i in range(5): m.cube('torso', [-4 + i * 1.8, 16 + i * 1.2, 3.1], [-3 + i * 1.8, 17 + i * 1.2, 3.8], '#6a5a4a', 'cadena%d' % i)
    m.bone('cabeza', [0, 25, 0], 'torso'); m.cube('cabeza', [-4, 25, -4], [4, 33, 4], sk, 'cabeza')
    for sx in (-1, 1):
        m.cube('cabeza', [sx * 2.6 - 1.2, 29, 3.6], [sx * 2.6 + 1.2, 31.5, 4.4], '#050806'); m.cube('cabeza', [sx * 2.6 - .7, 29.5, 4.2], [sx * 2.6 + .7, 31, 4.8], '#7dffb0', 'glow_ojo%d' % sx)
    m.bone('mandíbula', [0, 27, 2], 'cabeza'); m.cube('mandíbula', [-3, 24.6, -2], [3, 27, 4], bn);
    for i in range(5): m.cube('mandíbula', [-2.4 + i * 1.2, 27, 3.4], [-1.9 + i * 1.2, 28.4, 3.9], bn)
    for i in range(5):
        n = 'alga%d' % i; m.bone(n, [-3.2 + i * 1.6, 33, 0], 'cabeza'); m.cube(n, [-3.5 + i * 1.6, 33, -.4], [-2.9 + i * 1.6, 38 + (i % 2) * 2, .4], '#1d5a3c'); n2 = n + 'b'; m.bone(n2, [-3.2 + i * 1.6, 38, 0], n); m.cube(n2, [-3.4 + i * 1.6, 38, -.3], [-3 + i * 1.6, 42, .3], '#26704a')
    for sx, n in ((1, 'brazoL'), (-1, 'brazoR')):
        m.bone(n, [6.5 * sx, 23, 0], 'torso', [-55, 0, 0]); a, b = (5, 8) if sx > 0 else (-8, -5)
        m.cube(n, [a, 16, -1.5], [b, 23, 1.5], sk); m.cube(n, [a - .2, 16, -1.7], [b + .2, 17.2, 1.7], pn)
        e = n + '_codo'; m.bone(e, [6.5 * sx, 16, 0], n, [-25, 0, 0]); a2, b2 = (5.2, 7.8) if sx > 0 else (-7.8, -5.2)
        m.cube(e, [a2, 9, -1.3], [b2, 16, 1.3], sk)
        for f in range(3): m.cube(e, [a2 + f * .9 - (0 if sx > 0 else -.1), 6.5, -.5], [a2 + f * .9 + .6 - (0 if sx > 0 else -.1), 9, .5], bn, 'garra%s%d' % (n, f))
    for i in range(3): m.cube('brazoL' if False else 'torso', [5 + i * .3, 22 + i * .6, -1], [6.2 + i * .3, 23 + i * .6, 1], '#9aa6a0', 'percebe%d' % i)
    if not captain:
        m.cube('brazoR_codo', [-6.5, 3, 2.2], [-6.1, 9, 2.6], '#6a5a4a', 'gancho'); m.cube('brazoR_codo', [-6.5, 3, 2.2], [-6.1, 3.8, 4.4], '#6a5a4a')
    else:
        m.bone('sombrero', [0, 33, 0], 'cabeza'); m.cube('sombrero', [-6, 33, -6], [6, 34.4, 6], '#14161c'); m.cube('sombrero', [-3.5, 34.4, -3.5], [3.5, 38.5, 3.5], '#14161c'); m.cube('sombrero', [-3.7, 34.4, -3.7], [3.7, 35.4, 3.7], '#d4a017'); m.cube('sombrero', [-.8, 36, 3.6], [.8, 37.6, 4.2], '#eeeeee')
        for sx in (-1, 1): m.cube('torso', [sx * 6 - 2, 23.4, -2], [sx * 6 + 2, 24.6, 2], '#d4a017', 'hombrera%d' % sx); [m.cube('torso', [sx * (6.2 + k) - .3, 21, -.3], [sx * (6.2 + k) + .3, 23.4, .3], '#d4a017') for k in range(3)]
        for i in range(5): m.cube('torso', [-3 + (i % 2) * 4, 22 - (i // 2) * 2.4, 2.6], [-1.6 + (i % 2) * 4, 23.2 - (i // 2) * 2.4, 3.2], '#ffd54f', 'glow_medalla%d' % i)
        m.bone('capa', [0, 24, -2.8], 'torso')
        for i in range(5): m.cube('capa', [-6.5 + i * 2.6, 6, -3.4], [-4.1 + i * 2.6, 24, -2.8], '#7a1e26' if i % 2 else '#6a1a22', 'capa%d' % i)
        m.bone('capa2', [0, 12, -3], 'capa'); [m.cube('capa2', [-6.5 + i * 2.6, 0, -3.8], [-4.1 + i * 2.6, 6, -3.2], '#8a2430') for i in range(5)]
        m.bone('sable', [-7, 4, 2], 'brazoR_codo'); m.cube('sable', [-7.4, -12, 2], [-6.6, 4, 2.8], '#c8d4e0', 'hoja'); m.cube('sable', [-9, 3.5, 1.6], [-5, 4.6, 3.2], '#d4a017'); m.cube('sable', [-7.5, 4.6, 1.8], [-6.5, 9, 3], '#6a4a2a')
        m.cube('brazoL_codo', [6.3, 3, 1.5], [7.7, 5, 3], '#3a3a3a', 'farol'); m.cube('brazoL_codo', [5.9, -2, 1.1], [8.1, 3, 3.4], '#ffb347', 'glow_farol')
        m.cube('torso', [4, 12, 3], [4.8, 14, 3.4], '#ffd54f', 'glow_llave'); m.cube('torso', [4.2, 9, 3], [4.6, 12, 3.4], '#ffd54f', 'glow_llave2')
        for sx in (-1, 1):
            n = 'llama%d' % sx; m.bone(n, [sx * 9, 30, 0], 'torso'); m.cube(n, [sx * 9 - 1.5, 30, -1.5], [sx * 9 + 1.5, 36, 1.5], '#7dffb0', 'glow_llama%d' % sx); m.cube(n, [sx * 9 - .8, 36, -.8], [sx * 9 + .8, 40, .8], '#bfffe0', 'glow_llamab%d' % sx)
    def gait(L, k, A):
        t = merge(tr('piernaL', 0, 35 * k, 0, L), tr('piernaR', 0, 35 * k, math.pi, L), tr('piernaL_rodilla', 0, 25 * k, 1.2, L, base=18 * k), tr('piernaR_rodilla', 0, 25 * k, 1.2 + math.pi, L, base=18 * k),
                  tr('brazoL', 0, 28 * k, math.pi, L), tr('brazoR', 0, 28 * k, 0, L), tr('torso', 0, 4, 0, L, base=10 * k), tr('cadera', 1, 1.4 * k, 0, L, 'position'), tr('cabeza', 2, 10, 0, L), tr('mandíbula', 0, 8, 0, L, base=10))
        for i in range(5): t = merge(t, tr('alga%d' % i, 2, 14, i, L), tr('alga%d' % i, 0, 12, i * 1.4, L), tr('alga%db' % i, 2, 18, i + 1, L))
        if captain: t = merge(t, tr('capa', 0, 8 + 6 * k, 0, L, base=6), tr('capa2', 0, 10 + 8 * k, .8, L, base=4), tr('llama-1', 1, 2, 0, L, 'position'), tr('llama1', 1, 2, 1.5, L, 'position'))
        return t
    idle = gait(2.2, .12, 1); walk = gait(.9, 1, 1)
    atk = {'brazoR': {'rotation': [(0, [-55, 0, 0]), (.35, [-165, 0, 0]), (.55, [-165, 0, 0]), (.7, [-20, 0, 0]), (1.0, [-55, 0, 0])]}, 'torso': {'rotation': [(0, [0, 0, 0]), (.35, [-18, 0, 0]), (.55, [-18, 0, 0]), (.7, [26, 0, 0]), (1.0, [0, 0, 0])]}, 'mandíbula': {'rotation': [(0, [10, 0, 0]), (.35, [38, 0, 0]), (.7, [38, 0, 0]), (1.0, [10, 0, 0])]}}
    m.anim('idle', 2.2, idle); m.anim('walk', .9, walk); m.anim('attack', 1.0, atk); m.save()


# ============================================================ CALAMARÍN
def squid():
    m = Model('calamarin'); m.bone('root', [0, 0, 0]); m.bone('cuerpo', [0, 20, 0], 'root')
    for i, w in enumerate([7, 7.6, 7.4, 6.6, 5.6, 4.4, 3, 1.6]): m.cube('cuerpo', [-w, 20 + i * 4, -w], [w, 24 + i * 4, w], '#d8607c' if i % 2 else '#e87a94', 'manto%d' % i)
    m.cube('cuerpo', [-6.5, 13, -6.5], [6.5, 21, 6.5], '#f08aa4', 'cabeza')
    for sx in (-1, 1):
        m.cube('cuerpo', [sx * 6.4 - 1.5, 15, 3.5], [sx * 6.4 + 1.5, 20, 7.5], '#ffe14a', 'glow_ojo%d' % sx); m.cube('cuerpo', [sx * 6.4 - .5, 15.5, 7.4], [sx * 6.4 + .5, 19.5, 8], '#000000')
        m.bone('aleta%d' % sx, [sx * 7, 44, 0], 'cuerpo'); a, b = (7, 17) if sx > 0 else (-17, -7)
        m.cube('aleta%d' % sx, [a, 42, -4], [b, 43.6, 4], '#c85a78'); m.cube('aleta%d' % sx, [a + (3 if sx > 0 else -.0), 43.6, -3], [b - (0 if sx > 0 else 3), 44.4, 3], '#e06a88')
    for i in range(12): m.cube('cuerpo', [-6.2 + (i * 5) % 12, 22 + (i * 7) % 24, 6.9 if i % 2 else -7.3], [-5.2 + (i * 5) % 12, 23 + (i * 7) % 24, 7.5 if i % 2 else -6.7], '#7df9ff', 'glow_punto%d' % i)
    for i in range(8):
        a = i / 8 * math.tau; x, z = math.cos(a) * 5, math.sin(a) * 5; n = 'ten%d' % i; m.bone(n, [x, 14, z], 'cuerpo')
        m.cube(n, [x - 1.4, 7, z - 1.4], [x + 1.4, 14, z + 1.4], '#d8607c'); n2 = n + 'b'; m.bone(n2, [x, 7, z], n); m.cube(n2, [x - 1.1, 1, z - 1.1], [x + 1.1, 7, z + 1.1], '#cc5470'); n3 = n + 'c'; m.bone(n3, [x, 1, z], n2); m.cube(n3, [x - .8, -4, z - .8], [x + .8, 1, z + .8], '#c04864')
    def wv(L, k):
        t = merge(tr('cuerpo', 1, 1.6 * k, 0, L, 'position'), tr('cuerpo', 2, 4 * k, 0, L))
        for i in range(8):
            for suf, kk in (('', 1), ('b', 1.5), ('c', 2.1)): t = merge(t, tr('ten%d%s' % (i, suf), 0, 14 * kk * k, i * .8, L), tr('ten%d%s' % (i, suf), 2, 12 * kk * k, i * 1.1, L))
        return t
    atk = {}
    for i in range(8):
        atk['ten%d' % i] = {'rotation': [(0, [0, 0, 0]), (.35, [-55, 0, 0]), (.6, [-55, 0, 0]), (.9, [20, 0, 0]), (1.1, [0, 0, 0])]}
    atk['cuerpo'] = {'scale': [(0, [1, 1, 1]), (.35, [1.15, .9, 1.15]), (.6, [1.15, .9, 1.15]), (.9, [.92, 1.12, .92]), (1.1, [1, 1, 1])]}
    m.anim('idle', 2.4, wv(2.4, 1)); m.anim('walk', 1.0, wv(1.0, 1.7)); m.anim('attack', 1.1, atk); m.save()


# ============================================================ BARCO FANTASMA
def boat():
    m = Model('barco'); m.bone('root', [0, 0, 0]); m.bone('casco', [0, 0, 0], 'root')
    hd, hl, tm, dk = '#3e2a1c', '#5a4030', '#2a1e14', '#6a5238'
    m.cube('casco', [-60, -14, -14], [48, -7, 14], '#2f2a1c', 'quilla'); m.cube('casco', [-72, -7, -24], [56, 4, 24], hd, 'casco'); m.cube('casco', [-74, 4, -25], [58, 7, 25], tm, 'borde')
    for i, (x0, x1, w) in enumerate(((56, 66, 20), (66, 74, 14), (74, 80, 9), (80, 84, 4))): m.cube('casco', [x0, -7, -w], [x1, 4, w], hd, 'proa%d' % i); m.cube('casco', [x0, 4, -w - .5], [x1, 7, w + .5], tm)
    for i in range(10): m.cube('casco', [-70 + i * 13, -6, -24.4], [-68.4 + i * 13, 3, 24.4 if False else -23.6], '#7a5a3a'); m.cube('casco', [-70 + i * 13, -6, 23.6], [-68.4 + i * 13, 3, 24.4], '#7a5a3a')
    for i in range(14): m.cube('casco', [-72 + i * 10, -3 + (i % 3), -24.6], [-69 + i * 10, -1 + (i % 3), -24], '#3a5a3a'); m.cube('casco', [-72 + i * 10, -4 + (i % 4), 24], [-69 + i * 10, -2 + (i % 4), 24.6], '#3a5a3a')
    for i in range(10):
        m.cube('casco', [-72 + i * 13.2, 6, -22], [-60 + i * 13.2, 6.9, 22], dk if i % 2 else '#5e4830', 'cubierta%d' % i) if False else None
    m.cube('casco', [-72, 4, -22], [60, 6.4, 22], dk, 'cubierta')
    for i in range(22): m.cube('casco', [-72 + i * 6, 6.4, -22], [-71.5 + i * 6, 6.6, 22], '#2a1e14')
    for sx in (-1, 1):
        for i in range(12): m.cube('casco', [-66 + i * 10, 7, sx * 23 - .7], [-64.6 + i * 10, 16, sx * 23 + .7], hl)
        m.cube('casco', [-66, 15, sx * 23 - .7], [54, 16.4, sx * 23 + .7], hd); m.cube('casco', [-66, 10, sx * 23 - .5], [54, 11, sx * 23 + .5], '#8a7a52')
    m.cube('casco', [-62, 6, -18], [-26, 30, 18], '#6a7a62', 'cabina'); m.cube('casco', [-64, 30, -20], [-24, 33, 20], hd); m.cube('casco', [-58, 33, -14], [-30, 44, 14], '#6a7a62'); m.cube('casco', [-60, 44, -16], [-28, 46.5, 16], hd)
    for sx in (-1, 1):
        for wx in (-56, -40): m.cube('casco', [wx, 15, sx * 18 - .6 + (0 if sx > 0 else 0)], [wx + 9, 24, sx * 18 + .6], '#66ffb0', 'glow_ventana%d_%d' % (sx, wx)); m.cube('casco', [wx - .5, 19, sx * 18.6 - .3], [wx + 9.5, 20, sx * 18.6 + .3], '#14161a')
        m.cube('casco', [-52, 36, sx * 14 - .6], [-36, 42, sx * 14 + .6], '#66ffb0', 'glow_ventana_alta%d' % sx)
    m.cube('casco', [-26.4, 9, -2], [-25.6, 24, 6], '#22281e', 'puerta'); m.cube('casco', [-26.4, 15, -12], [-25.6, 24, -5], '#66ffb0', 'glow_ventana_proa')
    m.bone('chimenea', [-62, 46, 0], 'casco'); m.cube('chimenea', [-68, 46, -5], [-58, 66, 5], '#6a3a28', 'chimenea'); m.cube('chimenea', [-69, 66, -6], [-57, 69, 6], '#1a1a1c'); m.cube('chimenea', [-68.5, 54, -5.5], [-57.5, 57, 5.5], '#8a7a62')
    m.bone('mastil', [14, 6, 0], 'casco'); m.cube('mastil', [12, 6, -2], [16, 96, 2], '#4a3626', 'mastil'); m.cube('mastil', [12.5, 96, -1], [15.5, 108, 1], '#4a3626'); m.cube('mastil', [11, 84, -32], [17, 87, 32], '#4a3626', 'verga')
    m.bone('vela', [14, 86, 0], 'mastil')
    for i, (z0, z1, top) in enumerate(((-30, -22, 36), (-22, -13, 22), (-13, -4, 50), (-4, 5, 30), (5, 14, 44), (14, 22, 26), (22, 30, 38))):
        m.cube('vela', [14, 84 - (84 - 6 - top) - 0, z0], [15.6, 84, z1], '#cfc8b0' if i % 2 else '#bdb59c', 'vela%d' % i)
        m.cube('vela', [14, 70, z0], [15.7, 76, z1], '#7a1e1e', 'franja%d' % i)
    m.bone('vela2', [14, 100, 0], 'mastil'); m.cube('vela2', [14, 90, -10], [15.4, 100, 10], '#bdb59c'); m.cube('vela2', [14, 92, -6], [15.5, 97, -2], '#2a1e14')
    m.bone('bandera', [14, 108, 0], 'mastil'); m.cube('bandera', [13.5, 108, 0], [14.5, 114, 12], '#12161a', 'bandera'); m.cube('bandera', [13.4, 110, 4], [14.6, 112, 6], '#d8d2bf')
    for sx in (-1, 1):
        for k in range(5): m.cube('casco', [-4 + k * 6, 8 + k * 14, sx * (20 - k * 3.4) - .3], [-3.4 + k * 6, 22 + k * 14, sx * (20 - k * 3.4) + .3], '#8a7a52')
    m.bone('mascaron', [82, 8, 0], 'casco'); m.cube('mascaron', [80, 7, -4], [90, 17, 4], '#d8d2bf', 'calavera'); m.cube('mascaron', [88, 3, -3], [93, 8, 3], '#cfc9b6', 'mandibula')
    for sx in (-1, 1): m.cube('mascaron', [90, 12, sx * 2.4 - 1], [91.2, 15, sx * 2.4 + 1], '#66ffb0', 'glow_orbita%d' % sx); m.cube('mascaron', [82, 16, sx * 3.4 - .8], [84, 27, sx * 3.4 + .8], '#d8d2bf', 'cuerno%d' % sx)
    for i in range(7): m.cube('mascaron', [89 + (i % 2) * .5, 3.2, -2.4 + i * .8], [90.4 + (i % 2) * .5, 6.5, -1.9 + i * .8], '#f2eedc')
    for i, (x, y, z, c) in enumerate(((50, 20, 20, '#66ffb0'), (50, 20, -20, '#66ffb0'), (-70, 30, 14, '#66ffb0'), (-70, 30, -14, '#66ffb0'), (14, 100, 3, '#66ffb0'))):
        n = 'farol%d' % i; m.bone(n, [x, y, z], 'casco'); m.cube(n, [x - 2.2, y - 2.2, z - 2.2], [x + 2.2, y + 2.2, z + 2.2], c, 'glow_farol%d' % i); m.cube(n, [x - 3, y + 2.2, z - 3], [x + 3, y + 3, z + 3], '#14161a')
    for (x, z) in ((-14, 14), (-4, -16), (6, 14), (-34, -18), (30, 16)): m.cube('casco', [x - 5, 6.6, z - 5], [x + 5, 16.6, z + 5], '#5a4030'); m.cube('casco', [x - 5.2, 9, z - 5.2], [x + 5.2, 10, z + 5.2], '#6a6a6a')
    for (x, z) in ((-2, 10), (-14, -8)): m.cube('casco', [x - 4, 6.6, z - 4], [x + 4, 17, z + 4], '#4a3626'); m.cube('casco', [x - 4.3, 8, z - 4.3], [x + 4.3, 9, z + 4.3], '#3a3a3a'); m.cube('casco', [x - 4.3, 14, z - 4.3], [x + 4.3, 15, z + 4.3], '#3a3a3a')
    for i in range(9): m.cube('casco', [-82 + i * .6, 14 - i * 2.4, -8], [-80.6 + i * .6, 16 - i * 2.4, -6.5], '#5a4a3a')
    for i in range(7): m.cube('casco', [62 + i * 1.6, 3 - i * 2, 10], [64 + i * 1.6, 5 - i * 2, 12], '#5a4a3a')
    m.bone('esqueleto', [-30, 6, 12], 'casco'); m.cube('esqueleto', [-33, 6, 10], [-27, 8, 17], '#2a2e2a'); m.cube('esqueleto', [-31.5, 8, 12], [-28.5, 18, 15], '#2e3a2e'); m.cube('esqueleto', [-32, 18, 11.5], [-28, 22, 15.5], '#dcd6c2', 'calavera_timon')
    m.cube('esqueleto', [-30.5, 19.5, 15.5], [-29.5, 21, 16], '#66ffb0', 'glow_ojo_esq'); m.cube('esqueleto', [-33.6, 10, 12], [-32, 17, 13.2], '#dcd6c2'); m.cube('esqueleto', [-28, 10, 12], [-26.4, 17, 13.2], '#dcd6c2')
    idle = merge(tr('vela', 2, 2.2, 0, 3.0), tr('vela', 0, 1.2, 1.4, 3.0), tr('vela2', 2, 3.0, 1.0, 3.0), tr('bandera', 1, 16, 0, 1.2), tr('mastil', 2, .5, 0, 3.0), tr('mascaron', 2, 1.5, 0, 3.0), tr('casco', 1, .5, 0, 3.0, 'position'))
    for i in range(5): idle = merge(idle, tr('farol%d' % i, 1, .35, i, 2.0, 'scale', 1.0))
    for i in range(5): idle['farol%d' % i]['scale'] = [(t, [1 + .25 * math.sin(2 * math.pi * k / 8 + i), 1 + .25 * math.sin(2 * math.pi * k / 8 + i), 1 + .25 * math.sin(2 * math.pi * k / 8 + i)]) for k, (t, _) in enumerate(wave(1, 0, 8, 2.0))]
    m.anim('idle', 3.0, idle); m.save()


crab(); jelly(); angler(); drowned(False); drowned(True); squid(); boat()
