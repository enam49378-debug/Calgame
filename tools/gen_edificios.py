"""Genera los edificios exteriores de la ciudad como proyectos de Blockbench (.bbmodel).
1 bloque de Minecraft (16 px en Blockbench) = 1 metro del juego. El frente del edificio mira a +Z (sur).
Biblioteca de piezas y exteriores. Se ejecuta con:  python tools/gen_ciudad.py
"""
import base64, io, json, math, random, uuid
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'ciudad'
OUT.mkdir(exist_ok=True)
B = 32                    # tamaño base con el que se dibujan la mayoría de los tiles (se amplían x2)
TS, COLS = 64, 8          # tile 64x64 px = 4 m x 4 m; atlas de 8 columnas (512 px de ancho; las filas crecen según los tiles)
AW, AH = TS * COLS, TS * COLS
PPM = 16                  # px de textura por metro (como Minecraft)


# ---------------------------------------------------------------- textura (atlas de tiles) ----------
def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c)


TILES = {}   # nombre -> indice
PAINT = []   # (nombre, funcion(draw, img, rng))


class SD:
    """Dibuja con coordenadas base (32 px) sobre un lienzo más grande."""
    def __init__(self, d, k): self.d, self.k = d, k
    def rectangle(self, xy, fill=None, outline=None, width=1):
        k = self.k; x0, y0, x1, y1 = xy
        self.d.rectangle([x0 * k, y0 * k, (x1 + 1) * k - 1, (y1 + 1) * k - 1], fill=fill, outline=outline, width=width * k)
    def line(self, xy, fill=None, width=1):
        k = self.k
        self.d.line([c * k + k // 2 for c in xy], fill=fill, width=max(1, width * k))
    def ellipse(self, xy, fill=None, outline=None):
        k = self.k; x0, y0, x1, y1 = xy
        self.d.ellipse([x0 * k, y0 * k, (x1 + 1) * k - 1, (y1 + 1) * k - 1], fill=fill, outline=outline, width=k)
    def polygon(self, xy, fill=None, outline=None):
        k = self.k
        self.d.polygon([(x * k, y * k) for x, y in xy], fill=fill, outline=outline)


class SI:
    def __init__(self, im, k): self.im, self.k = im, k
    def putpixel(self, xy, c):
        k = self.k
        for dx in range(k):
            for dy in range(k): self.im.putpixel((xy[0] * k + dx, xy[1] * k + dy), c)
    def getpixel(self, xy): return self.im.getpixel((xy[0] * self.k + self.k // 2, xy[1] * self.k + self.k // 2))


def blotch(rng, n=6):
    """Ruido suave de baja frecuencia (manchas): f(x, y) con x,y en 0..1 -> -1..1."""
    g = [[rng.uniform(-1, 1) for _ in range(n + 1)] for _ in range(n + 1)]
    def f(x, y):
        fx, fy = x * n, y * n; ix, iy = min(n - 1, int(fx)), min(n - 1, int(fy)); tx, ty = fx - ix, fy - iy
        a = g[iy][ix] * (1 - tx) + g[iy][ix + 1] * tx; b = g[iy + 1][ix] * (1 - tx) + g[iy + 1][ix + 1] * tx
        return a * (1 - ty) + b * ty
    return f


def add_tile(name, fn, native=False):
    TILES[name] = len(PAINT)
    PAINT.append((name, fn, native))

def solid(name, col, noise=.05):
    c = hexrgb(col)

    def f(d, im, rng):
        bl = blotch(rng)
        for y in range(TS):
            for x in range(TS):
                k = 1 + rng.uniform(-noise, noise) * .7 + bl(x / TS, y / TS) * noise * .9
                im.putpixel((x, y), shade(c, k))
    add_tile(name, f, True)

def brick(name, col, mortar='#d8d0c0'):
    c, m = hexrgb(col), hexrgb(mortar)

    def f(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                im.putpixel((x, y), shade(m, 1 + rng.uniform(-.05, .05)))
        for row in range(TS // 4):
            off = 4 if row % 2 else 0
            for bx in range(-8, TS, 8):
                x0 = bx + off
                k = 1 + rng.uniform(-.12, .12)
                for yy in range(3):
                    for xx in range(7):
                        x, y = x0 + xx, row * 4 + yy
                        if 0 <= x < TS:
                            sh = 1.1 if yy == 0 else (.9 if yy == 2 else 1.0)
                            im.putpixel((x, y), shade(c, k * sh * (1 + rng.uniform(-.05, .05))))
    add_tile(name, f, True)

def glass(name, top, bot, lines=True):
    t, b = hexrgb(top), hexrgb(bot)

    def f(d, im, rng):
        for y in range(TS):
            kk = y / (TS - 1)
            col = tuple(int(t[i] * (1 - kk) + b[i] * kk) for i in range(3))
            for x in range(TS): im.putpixel((x, y), col)
        if lines:
            for o, w, a in ((-6, 5, 55), (6, 2, 40), (20, 7, 45), (40, 3, 35)):
                for y in range(TS):
                    for xx in range(w):
                        x = o + y + xx
                        if 0 <= x < TS:
                            r, g, bl = im.getpixel((x, y)); im.putpixel((x, y), (min(255, r + a), min(255, g + a), min(255, bl + a - 8)))
            for x in range(TS):                      # borde inferior más oscuro
                im.putpixel((x, TS - 1), shade(b, .8))
    add_tile(name, f, True)

def stripes(name, a, b, n=4):
    ca, cb = hexrgb(a), hexrgb(b)

    def f(d, im, rng):
        w = B // (n * 2)
        for i in range(B):
            d.line([i, 0, i, B - 1], fill=ca if (i // w) % 2 == 0 else cb)
        d.line([0, B - 2, B - 1, B - 2], fill=shade(ca, .8))
        d.line([0, B - 1, B - 1, B - 1], fill=shade(ca, .65))
    add_tile(name, f)


def grille(name, base, line):
    cb, cl = hexrgb(base), hexrgb(line)

    def f(d, im, rng):
        d.rectangle([0, 0, B - 1, B - 1], fill=cb)
        for y in range(3, B, 4):
            d.line([2, y, B - 3, y], fill=cl)
    add_tile(name, f)


def planks(name, col):
    c = hexrgb(col)

    def f(d, im, rng):
        for r in range(TS // 4):
            off = rng.randint(0, 40); kb = 1 + rng.uniform(-.08, .08)
            for x in range(TS):
                seam = ((x + off) % 40) == 0
                for y in range(4):
                    k = kb * (.62 if y == 3 else (1.07 if y == 0 else 1.0)) * (.7 if seam else 1) * (1 + rng.uniform(-.035, .035))
                    if y == 1 and (x * 3 + r * 7) % 11 == 0: k *= .93      # veta
                    im.putpixel((x, r * 4 + y), shade(c, k))
    add_tile(name, f, True)

def checker(name, a, b):
    ca, cb = hexrgb(a), hexrgb(b)

    def f(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                base = ca if ((x // 16) + (y // 16)) % 2 == 0 else cb
                k = 1 + rng.uniform(-.025, .025)
                if x % 16 == 0 or y % 16 == 0: k *= .88
                im.putpixel((x, y), shade(base, k))
    add_tile(name, f, True)

for n, c in dict(pl_cream='#f0e6cf', pl_peach='#f0bf7b', pl_rose='#e49aab', pl_mint='#77beaa', pl_yellow='#e9cd83', pl_lilac='#b9a0db',
                 pl_orange='#eda777', pl_blue='#88b8dc', pl_sage='#a9cd86', pl_sky='#87c8d0', pl_gray='#b4bcc0',
                 trim_white='#ece7d8', trim_stone='#c8c2ae', stone_dark='#677681', concrete='#a9afb0', concrete_dark='#7f878b', roof_tar='#3f464d',
                 metal='#8f9ba0', metal_dark='#4b5a64', wood='#8a5a3a', door_navy='#263e50', door_red='#9b3b3b', door_glass='#5d8da0',
                 gold='#c9a24a', night='#1b2330', pot='#a36d58', plant='#5f9a55', flower_pink='#e87aa0', flower_yellow='#f2cf55',
                 lamp='#fff2c0', pipe='#657a80', sign_dark='#2a3b4a', sign_teal='#277d79', sign_red='#b0463c', sign_gold='#d9ad4a', rust='#9a5a3c',
                 curtain='#e8d9b8', tank='#c06a4a', water_blue='#4d7fa8', shadow='#1d2a36').items():
    solid(n, c)
brick('br_red', '#b5654f')
brick('br_tan', '#c9a77c')
brick('br_brown', '#8a5a44', '#bfb29c')
glass('glass', '#9fd3e6', '#4f8fae')
glass('glass_dark', '#3d6f8a', '#1f3f55')
glass('glass_warm', '#ffe7a8', '#e0a45a', False)
stripes('awn_red', '#c8473f', '#f2ecdc')
stripes('awn_blue', '#3d6fa8', '#f2ecdc')
stripes('awn_green', '#3f8f5a', '#f2ecdc')
stripes('awn_gold', '#d9ad4a', '#f2ecdc')
grille('vent', '#8a979c', '#4b5a64')
planks('planks', '#9a6a40')
checker('checker', '#f1ece0', '#3b4452')


def pad_to(n):
    while len(PAINT) < n:
        add_tile('_vacio%d' % len(PAINT), lambda d, im, rng: None, True)


def atlas():
    global AW, AH
    AW, AH = TS * COLS, TS * math.ceil(len(PAINT) / COLS)
    im = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    k = TS // B
    for i, (name, fn, native) in enumerate(PAINT):
        t = Image.new('RGB', (TS, TS))
        rng = random.Random(i * 7919 + 3)
        if native: fn(ImageDraw.Draw(t), t, rng)
        else: fn(SD(ImageDraw.Draw(t), k), SI(t, k), rng)
        im.paste(t, ((i % COLS) * TS, (i // COLS) * TS))
    b = io.BytesIO()
    im.save(b, 'PNG')
    im.save(OUT / 'atlas.png')
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

# ---------------------------------------------------------------- modelo ----------------------------
IMAGE_TILES = set()   # tiles que son una imagen completa (cuadros, pantallas, carteles): se estiran enteros sobre la cara
TALL_TILES = set()    # tiles de estantería: ocupan todo el alto del tile


class Model:
    def __init__(self, name):
        self.name, self.groups, self.cur, self.n = name, {}, None, 0
        self.W = self.D = self.H = 0

    def group(self, name):
        self.cur = self.groups.setdefault(name, [])
        return self

    def cube(self, x, y, z, w, h, d, t, rot=None, label=None):
        """x,z = centro; y = base (metros). t = nombre del tile."""
        if w <= 0 or h <= 0 or d <= 0:
            return
        self.n += 1
        el = {'name': label or f'cubo_{self.n}', 'box_uv': False,
              'from': [round((x - w / 2) * 16, 3), round(y * 16, 3), round((z - d / 2) * 16, 3)],
              'to': [round((x + w / 2) * 16, 3), round((y + h) * 16, 3), round((z + d / 2) * 16, 3)],
              'autouv': 0, 'color': 0, 'origin': [round(x * 16, 3), round((y + h / 2) * 16, 3), round(z * 16, 3)], 'type': 'cube',
              'uuid': str(uuid.uuid4())}
        if rot:
            el['rotation'] = list(rot)
        dims = {'north': (w, h), 'south': (w, h), 'east': (d, h), 'west': (d, h), 'up': (w, d), 'down': (w, d)}
        i = TILES[t]
        ox, oy = (i % COLS) * TS, (i // COLS) * TS
        fc = {}
        for f, (a, b) in dims.items():
            uw, uh = min(TS, max(2, round(a * PPM))), min(TS, max(2, round(b * PPM)))
            if t in IMAGE_TILES: uw = uh = TS
            elif t in TALL_TILES: uh = TS
            fc[f] = {'uv': [ox, oy, ox + uw, oy + uh], 'texture': 0}
        el['faces'] = fc
        self.cur.append(el)

    def col(self, x, z, w, d, h, y0=0.0):
        """Colisión (invisible en el juego): cubo del grupo 'colision'."""
        keep = self.cur
        self.cur = self.groups.setdefault('colision', [])
        self.cube(x, y0, z, w, h, d, 'shadow', label='col')
        self.cur = keep

    def save(self, tex):
        elements, outliner = [], []
        for gname, els in self.groups.items():
            outliner.append({'name': gname, 'origin': [0, 0, 0], 'rotation': [0, 0, 0], 'color': 0, 'uuid': str(uuid.uuid4()), 'export': True,
                             'mirror_uv': False, 'isOpen': False, 'locked': False, 'visibility': True, 'autouv': 0, 'children': [e['uuid'] for e in els]})
            elements += els
        data = {'meta': {'format_version': '4.10', 'model_format': 'free', 'box_uv': False}, 'name': self.name, 'model_identifier': self.name,
                'visible_box': [4, 4, 0], 'variable_placeholders': '', 'variable_placeholder_buttons': [], 'timeline_setups': [], 'unhandled_root_fields': {},
                'resolution': {'width': AW, 'height': AH}, 'elements': elements, 'outliner': outliner,
                'textures': [{'path': '', 'name': 'atlas.png', 'folder': '', 'namespace': '', 'id': '0', 'particle': False, 'render_mode': 'default',
                              'render_sides': 'auto', 'frame_time': 1, 'frame_order_type': 'loop', 'frame_order': '', 'frame_interpolate': False,
                              'visible': True, 'internal': True, 'saved': False, 'uuid': str(uuid.uuid4()), 'source': tex,
                              'width': AW, 'height': AH, 'uv_width': AW, 'uv_height': AH}],
                'animations': []}
        (OUT / (self.name + '.bbmodel')).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
        return len(elements)


# ---------------------------------------------------------------- piezas reutilizables --------------
def bays(L, ww, minGap=.8):
    """Cantidad (impar) de huecos y separación entre pilares."""
    best = 1
    for nb in range(1, 12, 2):
        if (L - nb * ww) / (nb + 1) >= minGap:
            best = nb
    return best, (L - best * ww) / (best + 1)


def split(a0, a1, mx=4.0):
    n = max(1, math.ceil((a1 - a0) / mx))
    st = (a1 - a0) / n
    return [(a0 + i * st, a0 + (i + 1) * st) for i in range(n)]


def place(m, side, u, y, h, L, t, tile, W, D, off=0.0):
    """Cubo de largo L (a lo largo del lado), grueso t, pegado a la pared `side` (S=+z, N=-z, E=+x, W=-x). off = hacia afuera."""
    if side == 'S':
        m.cube(u, y, D / 2 - t / 2 + off, L, h, t, tile)
    elif side == 'N':
        m.cube(-u, y, -D / 2 + t / 2 - off, L, h, t, tile)
    elif side == 'E':
        m.cube(W / 2 - t / 2 + off, y, -u, t, h, L, tile)
    else:
        m.cube(-W / 2 + t / 2 - off, y, u, t, h, L, tile)


def facade(m, W, D, y0, fh, side, wall, trim, glass_t, *, ww=1.25, wh=1.5, sill=.9, door=False, frame='trim_white', planter=False,
           balcony=False, ac=0, shutters=None, ribbon=False, shop=None, rng=None, minGap=.8):
    """Una planta de una fachada: pilares, antepechos, dinteles, marcos y cristales."""
    L = W if side in 'SN' else D
    nb, gap = bays(L, ww, minGap)
    t = .35

    def P(u, y, h, l, th, tl, off=0):
        place(m, side, u, y, h, l, th, tl, W, D, off)
    centers = [-L / 2 + gap + ww / 2 + i * (gap + ww) for i in range(nb)]
    edges = [-L / 2] + sum(([c - ww / 2, c + ww / 2] for c in centers), []) + [L / 2]
    for i in range(0, len(edges), 2):
        for s0, s1 in split(edges[i], edges[i + 1]):
            P((s0 + s1) / 2, y0, fh, s1 - s0, t, wall)
    for ci, c in enumerate(centers):
        isdoor = door and ci == nb // 2
        if isdoor:
            wy0, wy1 = y0, y0 + 2.6
        elif shop:
            wy0, wy1 = y0 + shop['sill'], y0 + shop['sill'] + shop['h']
        else:
            wy0, wy1 = y0 + sill, y0 + sill + wh
        for s0, s1 in split(c - ww / 2, c + ww / 2, 9):
            if wy0 > y0 + .01:
                P((s0 + s1) / 2, y0, wy0 - y0, s1 - s0, t, wall)
            P((s0 + s1) / 2, wy1, y0 + fh - wy1, s1 - s0, t, wall)
        if isdoor:
            place(m, side, c, wy0, wy1 - wy0, ww - .16, .06, 'door_glass', W, D, -.13 + .35 - .35)
            place(m, side, c - ww / 4, wy0, wy1 - wy0, .08, .09, 'door_navy', W, D, -.1 + .0)
            place(m, side, c + ww / 4, wy0, wy1 - wy0, .08, .09, 'door_navy', W, D, -.1 + .0)
            place(m, side, c, wy0, .9, ww - .16, .08, 'door_navy', W, D, -.12 + .0)
            continue
        gh = wy1 - wy0 - .12
        warm = rng is not None and rng.random() < .12
        place(m, side, c, wy0 + .06, gh, ww - .08, .05, 'glass_warm' if warm else glass_t, W, D, -.16 + .0)
        for uu in (c - ww / 2 + .04, c + ww / 2 - .04):
            place(m, side, uu, wy0, wy1 - wy0, .08, .09, frame, W, D, .045)
        place(m, side, c, wy0, .08, ww, .09, frame, W, D, .045)
        place(m, side, c, wy1 - .08, .08, ww, .09, frame, W, D, .045)
        place(m, side, c, (wy0 + wy1) / 2 - .03, .06, ww - .1, .07, frame, W, D, .035)
        if ww > 1.1 and not ribbon:
            place(m, side, c, wy0, wy1 - wy0, .06, .07, frame, W, D, .035)
        place(m, side, c, wy0 - .1, .1, ww + .24, .26, 'trim_stone', W, D, .13)
        place(m, side, c, wy1, .12, ww + .3, .24, 'trim_stone', W, D, .12)
        if planter and rng and rng.random() < .55:
            place(m, side, c, wy0 - .34, .26, ww + .1, .22, 'pot', W, D, .3)
            place(m, side, c, wy0 - .08, .1, ww, .2, 'plant', W, D, .3)
            for k in range(3):
                place(m, side, c + (k - 1) * .3, wy0, .08, .1, .1, 'flower_pink' if rng.random() < .5 else 'flower_yellow', W, D, .32)
        if shutters:
            for sg in (-1, 1):
                place(m, side, c + sg * (ww / 2 + .26), wy0, wy1 - wy0, .42, .07, shutters, W, D, .06)
        if ac and rng and rng.random() < ac:
            place(m, side, c, wy0 - .62, .5, .7, .38, 'metal', W, D, .21)
            place(m, side, c, wy0 - .56, .38, .58, .06, 'vent', W, D, .43)
        if balcony:
            bw = ww + 1.0
            place(m, side, c, y0, .16, bw, .95, 'concrete', W, D, .6)
            place(m, side, c, y0 + .16, .06, bw, .06, 'metal_dark', W, D, 1.05)
            place(m, side, c, y0 + .8, .06, bw, .06, 'metal_dark', W, D, 1.05)
            n = int(bw / .22)
            for k in range(n + 1):
                place(m, side, c - bw / 2 + .03 + k * (bw - .06) / n, y0 + .16, .65, .045, .045, 'metal_dark', W, D, 1.05)
            for sg in (-1, 1):
                place(m, side, c + sg * (bw / 2 - .03), y0 + .16, .65, .045, .95, 'metal_dark', W, D, .6)


def band(m, W, D, y, h, tile, out=.1):
    """Moldura horizontal que rodea el edificio."""
    for side in 'SN':
        place(m, side, 0, y, h, W + out * 2, out + .08, tile, W, D, out / 2 + .04)
    for side in 'EW':
        place(m, side, 0, y, h, D + out * 2 - .4, out + .08, tile, W, D, out / 2 + .04)


def corners(m, W, D, y0, y1, tile, w=.3, quoin=False, tile2=None):
    for sx in (-1, 1):
        for sz in (-1, 1):
            if not quoin:
                m.cube(sx * (W / 2 - w / 2 + .06), y0, sz * (D / 2 - w / 2 + .06), w + .12, y1 - y0, w + .12, tile)
            else:
                k, y = 0, y0
                while y < y1 - .01:
                    hh = min(.5, y1 - y)
                    big = k % 2 == 0
                    m.cube(sx * (W / 2 - .24), y, sz * (D / 2 - .24), .72 if big else .5, hh, .5 if big else .72, tile2 or tile)
                    y += hh
                    k += 1


def core(m, W, D, y0, y1, tile='shadow', inset=.3):
    m.cube(0, y0, 0, W - inset * 2, y1 - y0, D - inset * 2, tile)


def roof(m, W, D, y, wall, rng, *, parapet=.55, ac=2, tank=False, antenna=True, stair=True, dish=True, accent='trim_white', vents=True):
    m.group('Techo')
    m.cube(0, y - .02, 0, W - .2, .12, D - .2, 'roof_tar')
    m.cube(0, y - .35, 0, W + .5, .22, D + .5, 'trim_stone')
    m.cube(0, y - .15, 0, W + .3, .2, D + .3, accent)
    for sx in (-1, 1):
        m.cube(sx * (W / 2 - .09), y + .1, 0, .22, parapet, D + .3, wall)
    for sz in (-1, 1):
        m.cube(0, y + .1, sz * (D / 2 - .09), W + .3, parapet, .22, wall)
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * (W / 2 + .06), y + .1, sz * (D / 2 + .06), .34, parapet + .15, .34, 'trim_stone')
    for sx in (-1, 1):
        m.cube(sx * (W / 2 - .09), y + parapet + .1, 0, .3, .1, D + .36, 'trim_stone')
    for sz in (-1, 1):
        m.cube(0, y + parapet + .1, sz * (D / 2 - .09), W + .36, .1, .3, 'trim_stone')
    spots = []

    def put(r):
        for _ in range(40):
            px, pz = rng.uniform(-W / 2 + 1.2 + r, W / 2 - 1.2 - r), rng.uniform(-D / 2 + 1.2 + r, D / 2 - 1.2 - r)
            if all(abs(px - a) > r + rr or abs(pz - b) > r + rr for a, b, rr in spots):
                spots.append((px, pz, r))
                return px, pz
        return None
    for _ in range(ac):
        p = put(.8)
        if p:
            px, pz = p
            m.cube(px, y + .1, pz, 1.2, .7, 1.0, 'metal')
            m.cube(px, y + .8, pz, 1.25, .08, 1.05, 'metal_dark')
            m.cube(px + .2, y + .84, pz, .7, .1, .7, 'vent')
            m.cube(px - .4, y + .1, pz + .52, .3, .5, .06, 'vent')
    if stair:
        p = put(1.2)
        if p:
            px, pz = p
            m.cube(px, y + .1, pz, 2.0, 2.3, 1.7, wall)
            m.cube(px, y + 2.4, pz, 2.3, .22, 2.0, 'trim_stone')
            m.cube(px, y + .1, pz + .86, .9, 1.9, .08, 'door_navy')
            m.cube(px + .6, y + 1.2, pz + .88, .05, .08, .05, 'gold')
    if tank:
        p = put(1.0)
        if p:
            px, pz = p
            for sx in (-1, 1):
                for sz in (-1, 1):
                    m.cube(px + sx * .6, y + .1, pz + sz * .6, .14, 1.4, .14, 'metal_dark')
            m.cube(px, y + 1.5, pz, 1.7, 1.5, 1.7, 'tank')
            m.cube(px, y + 3.0, pz, 1.9, .14, 1.9, 'metal_dark')
            m.cube(px, y + 3.14, pz, 1.0, .3, 1.0, 'metal_dark')
            for yy in (1.9, 2.5):
                m.cube(px, y + yy, pz, 1.78, .07, 1.78, 'metal_dark')
    if antenna:
        p = put(.3)
        if p:
            px, pz = p
            m.cube(px, y + .1, pz, .07, 3.4, .07, 'metal_dark')
            for k, wd in enumerate((1.4, 1.0, .7)):
                m.cube(px, y + 1.6 + k * .55, pz, wd, .05, .05, 'metal_dark')
            m.cube(px, y + 3.5, pz, .12, .12, .12, 'sign_red')
    if dish:
        p = put(.5)
        if p:
            px, pz = p
            m.cube(px, y + .1, pz, .1, .6, .1, 'metal_dark')
            m.cube(px, y + .7, pz + .1, .8, .8, .1, 'trim_white', rot=[-25, 0, 0])
            m.cube(px, y + 1.0, pz + .28, .12, .12, .3, 'metal_dark')
    for _ in range(2 if vents else 0):
        p = put(.3)
        if p:
            px, pz = p
            m.cube(px, y + .1, pz, .22, .9, .22, 'pipe')
            m.cube(px, y + 1.0, pz, .34, .12, .34, 'pipe')


def door_entrance(m, W, D, *, canopy='awn_red', w=2.4, depth=1.4, steps=2, lamp=True, y_canopy=3.0, pots=True, pillars=False):
    """Entrada centrada en la fachada sur (+Z): escalones, marco, marquesina."""
    m.group('Entrada')
    z0 = D / 2
    for i in range(steps):
        m.cube(0, i * .12, z0 + .55 - i * .25, w + .4 + (steps - i) * .1, .12, .9 - i * .25 + .1, 'concrete')
    for sg in (-1, 1):
        m.cube(sg * (w / 2 + .0), 0, z0 + .06, .22, 2.9, .3, 'trim_white')
        m.cube(sg * (w / 2 + .0), 2.9, z0 + .06, .3, .1, .36, 'trim_stone')
    m.cube(0, 2.62, z0 + .0, w + .1, .18, .26, 'trim_white')
    if canopy:
        m.cube(0, y_canopy, z0 + depth / 2, w + 1.0, .1, depth, canopy)
        m.cube(0, y_canopy - .12, z0 + depth - .02, w + 1.0, .12, .06, canopy)
    if pillars:
        for sg in (-1, 1):
            m.cube(sg * (w / 2 + .4), 0, z0 + depth - .2, .22, y_canopy, .22, 'trim_white')
    if lamp:
        for sg in (-1, 1):
            m.cube(sg * (w / 2 + .35), 2.1, z0 + .2, .14, .22, .14, 'lamp')
    if pots:
        for sg in (-1, 1):
            m.cube(sg * (w / 2 + .85), 0, z0 + .55, .5, .5, .5, 'pot')
            m.cube(sg * (w / 2 + .85), .5, z0 + .55, .56, .5, .56, 'plant')
            m.cube(sg * (w / 2 + .85), .9, z0 + .55, .2, .2, .2, 'flower_yellow' if sg < 0 else 'flower_pink')


def base_plinth(m, W, D, tile='stone_dark', h=.5):
    m.group('Cimientos')
    m.cube(0, 0, 0, W + .14, h, D + .14, tile)
    m.cube(0, h, 0, W + .06, .1, D + .06, 'trim_stone')


def pipes(m, W, D, H):
    m.group('Instalaciones')
    x, z = W / 2 + .1, D / 2 - .5
    m.cube(x, 0, z, .16, H - .3, .16, 'pipe')
    m.cube(-x, 0, -z, .16, H - .3, .16, 'pipe')
    for yy in range(1, int(H), 3):
        m.cube(x, yy, z, .22, .08, .22, 'metal_dark')
        m.cube(-x, yy, -z, .22, .08, .22, 'metal_dark')


def floors_body(m, rng, W, D, floors, wall, trim, glass_t, *, ground_h=3.4, fh=2.9, shop_front=False, balcony_from=99, balcony_sides='S', **fk):
    y, ys = 0, []
    for i in range(floors):
        h = ground_h if i == 0 else fh
        ys.append((y, h))
        y += h
    m.group('Cuerpo')
    core(m, W, D, .3, y)
    m.group('Fachadas')
    for i, (y0, h) in enumerate(ys):
        for side in 'SNEW':
            kw = dict(fk)
            if i == 0:
                kw.update(sill=.9, wh=1.6, balcony=False, ac=0)
                if side == 'S':
                    kw.update(door=True, shop={'sill': .45, 'h': 2.15} if shop_front else {'sill': .9, 'h': 1.7})
            else:
                kw.update(balcony=(i >= balcony_from and side in balcony_sides))
            facade(m, W, D, y0, h, side, wall, trim, glass_t, rng=rng, **kw)
        if i > 0:
            band(m, W, D, y0 - .06, .14, trim, .08)
    return y


DES = {}


def design(fn):
    DES[fn.__name__] = fn
    return fn


@design
def A_ladrillo(m, rng, wall, trim, glass_t, accent):
    W = D = 9.0
    H = floors_body(m, rng, W, D, 4, wall, trim, glass_t, ww=1.25, ac=.35, planter=True)
    corners(m, W, D, 0, H, trim, quoin=True, tile2='br_tan' if wall != 'br_tan' else 'trim_stone')
    base_plinth(m, W, D)
    door_entrance(m, W, D, canopy=accent or 'awn_red')
    m.group('Escalera de incendios')
    x = W / 2 + .55
    for i in range(1, 4):
        y0 = 3.4 + (i - 1) * 2.9
        m.cube(x, y0 - .05, 0, 1.1, .08, 2.4, 'metal_dark')
        m.cube(x + .5, y0 + .05, 0, .05, .9, 2.4, 'metal_dark')
        m.cube(x, y0 + .05, 1.18, 1.1, .9, .05, 'metal_dark')
        m.cube(x, y0 + .05, -1.18, 1.1, .9, .05, 'metal_dark')
        for k in range(6):
            m.cube(x + .5, y0 + .05, -1.0 + k * .4, .06, .9, .06, 'metal_dark')
        m.cube(x - .3, y0 - 1.6, -.6, .05, 2.9, .05, 'metal_dark')
        m.cube(x, y0 - 1.6, -.6, .05, 2.9, .05, 'metal_dark')
        for k in range(12):
            m.cube(x - .15, y0 - 2.9 + k * .22, -.6, .3, .04, .04, 'metal_dark')
    m.cube(x, 0, 0, 1.1, .18, 2.4, 'concrete')
    roof(m, W, D, H, wall, rng, ac=2, tank=True)
    pipes(m, W, D, H)
    m.W, m.D, m.H = W, D, H


@design
def B_oficinas(m, rng, wall, trim, glass_t, accent):
    W, D = 10.0, 9.0
    H = floors_body(m, rng, W, D, 5, wall, 'trim_stone', 'glass_dark', ww=1.7, wh=1.7, sill=.85, ribbon=True, frame='metal_dark', minGap=.55)
    m.group('Pilastras')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * (W / 2 - .25), 0, sz * (D / 2 - .25), .6, H, .6, 'concrete_dark')
    base_plinth(m, W, D, 'concrete_dark', .6)
    door_entrance(m, W, D, canopy=None, w=2.6, pillars=False, pots=False)
    m.group('Marquesina')
    m.cube(0, 3.0, D / 2 + 1.0, 3.6, .22, 2.2, 'metal_dark')
    m.cube(0, 3.2, D / 2 + 1.0, 3.6, .07, 2.2, 'glass')
    for sg in (-1, 1):
        m.cube(sg * 1.7, 0, D / 2 + 2.0, .16, 3.0, .16, 'metal_dark')
    for xx in (-4, 4):
        m.cube(xx, 0, D / 2 + .35, .7, 1.3, .6, 'concrete')
        m.cube(xx, 1.3, D / 2 + .35, .8, .5, .7, 'plant')
    m.group('Rótulo')
    m.cube(0, 3.6, D / 2 + .1, 4.2, .6, .12, 'sign_dark')
    m.cube(0, 3.72, D / 2 + .17, 3.6, .36, .06, 'sign_gold')
    roof(m, W, D, H, wall, rng, ac=3, tank=False, accent='concrete_dark', stair=False)
    m.group('Techo')
    m.cube(0, H + .1, -D / 4, 5.0, 1.7, 3.0, 'concrete_dark')
    m.cube(0, H + 1.8, -D / 4, 5.4, .2, 3.4, 'trim_stone')
    for k in range(5):
        m.cube(-2 + k, H + .5, -D / 4 + 1.52, .6, .9, .05, 'glass_dark')
    pipes(m, W, D, H)
    m.W, m.D, m.H = W, D, H


@design
def C_casa_tienda(m, rng, wall, trim, glass_t, accent):
    W, D = 8.0, 7.0
    H = floors_body(m, rng, W, D, 2, wall, trim, glass_t, ground_h=3.4, fh=2.9, shop_front=True, ww=1.4, ac=.3, planter=True, shutters='awn_green')
    corners(m, W, D, 0, H, trim)
    base_plinth(m, W, D, 'br_brown', .55)
    door_entrance(m, W, D, canopy=None, w=2.2, steps=1, pots=True)
    m.group('Toldo')
    m.cube(0, 2.95, D / 2 + .45, W - .6, .1, .9, accent or 'awn_green')
    m.cube(0, 2.9, D / 2 + .91, W - .6, .14, .05, accent or 'awn_green')
    m.group('Balcón')
    m.cube(0, 3.4, D / 2 + .5, 3.4, .15, 1.0, 'concrete')
    for k in range(14):
        m.cube(-1.6 + k * .246, 3.55, D / 2 + .95, .05, .8, .05, 'metal_dark')
    m.cube(0, 4.35, D / 2 + .95, 3.4, .06, .06, 'metal_dark')
    for sg in (-1, 1):
        m.cube(sg * 1.65, 3.55, D / 2 + .5, .05, .8, .9, 'metal_dark')
    m.cube(0, 3.55, D / 2 + .86, 3.2, .3, .24, 'pot')
    m.cube(0, 3.85, D / 2 + .86, 3.2, .18, .26, 'plant')
    for k in range(7):
        m.cube(-1.5 + k * .5, 4.0, D / 2 + .86, .12, .12, .12, 'flower_pink' if k % 2 else 'flower_yellow')
    roof(m, W, D, H, wall, rng, ac=1, tank=False, stair=False)
    m.group('Chimenea')
    m.cube(-2.4, H + .1, -1.5, 1.0, 2.1, 1.0, 'br_red')
    m.cube(-2.4, H + 2.2, -1.5, 1.2, .2, 1.2, 'trim_stone')
    m.W, m.D, m.H = W, D, H


@design
def D_torre_res(m, rng, wall, trim, glass_t, accent):
    W = D = 9.0
    H = floors_body(m, rng, W, D, 6, wall, trim, glass_t, ground_h=3.4, fh=2.8, ww=1.25, balcony_from=1, balcony_sides='SN', ac=.25)
    corners(m, W, D, 0, H, 'trim_stone', w=.4)
    base_plinth(m, W, D)
    door_entrance(m, W, D, canopy='metal_dark', w=2.4, depth=1.6, pillars=True)
    m.group('Corona')
    m.cube(0, H + .1, 0, W - 2.2, 1.2, D - 2.2, wall)
    m.cube(0, H + 1.3, 0, W - 1.6, .22, D - 1.6, 'trim_stone')
    for sg in (-1, 1):
        m.cube(sg * 2.2, H + .4, (D - 2.2) / 2 + .01, 1.0, .6, .05, glass_t)
    m.cube(2.0, H + 1.5, 1.0, 1.8, 1.4, 1.8, 'tank')
    m.cube(2.0, H + 2.9, 1.0, 2.0, .12, 2.0, 'metal_dark')
    roof(m, W, D, H, wall, rng, ac=2, tank=False, stair=False)
    m.W, m.D, m.H = W, D, H


@design
def E_artdeco(m, rng, wall, trim, glass_t, accent):
    W, D = 9.0, 8.0
    H1 = floors_body(m, rng, W, D, 3, wall, 'gold', glass_t, ground_h=3.6, fh=3.0, ww=1.2, frame='gold')
    base_plinth(m, W, D, 'night', .6)
    door_entrance(m, W, D, canopy='sign_gold', w=2.4, depth=1.2, pillars=True)
    m.group('Pilastras doradas')
    for xx in (-3.3, -1.1, 1.1, 3.3):
        m.cube(xx, 3.6, D / 2 + .05, .26, 5.4, .22, 'gold')
    W2, D2 = 6.6, 5.8
    roof(m, W, D, H1, wall, rng, ac=0, stair=False, tank=False, antenna=False, dish=False, accent='gold')
    m.group('Cuerpo alto')
    core(m, W2, D2, H1, H1 + 7.0, inset=.0)
    m.group('Fachadas altas')
    y = H1
    for i in range(2):
        for side in 'SNEW':
            facade(m, W2, D2, y, 3.0, side, wall, 'gold', glass_t, ww=1.1, wh=2.0, sill=.5, rng=rng, frame='gold', minGap=.5)
        y += 3.0
    m.cube(0, y, 0, W2 + .4, .22, D2 + .4, 'gold')
    m.cube(0, y + .22, 0, W2 - .2, .8, D2 - .2, wall)
    W3, D3 = 4.2, 3.6
    m.cube(0, y + 1.0, 0, W3, 1.6, D3, wall)
    for sg in (-1, 1):
        m.cube(sg * 1.2, y + 1.2, D3 / 2 + .02, .8, 1.2, .05, 'glass_warm')
    m.cube(0, y + 2.6, 0, W3 + .3, .16, D3 + .3, 'gold')
    for k, s in enumerate((2.6, 1.8, 1.0, .5)):
        m.cube(0, y + 2.76 + k * .45, 0, s, .45, s, 'gold' if k % 2 == 0 else wall)
    m.cube(0, y + 4.6, 0, .1, 2.6, .1, 'gold')
    m.cube(0, y + 7.0, 0, .2, .2, .2, 'sign_red')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * (W2 / 2 - .1), H1, sz * (D2 / 2 - .1), .4, 6.4, .4, 'gold')
    m.W, m.D, m.H = W, D, y + 7.1


@design
def F_hotel(m, rng, wall, trim, glass_t, accent):
    W, D = 8.0, 9.0
    H = floors_body(m, rng, W, D, 4, wall, trim, glass_t, ground_h=3.6, fh=2.9, ww=1.2, balcony_from=1, balcony_sides='S', ac=.2, planter=True)
    corners(m, W, D, 0, H, trim, quoin=True, tile2='trim_stone')
    base_plinth(m, W, D)
    door_entrance(m, W, D, canopy=None, w=2.4, pots=True)
    m.group('Marquesina')
    m.cube(0, 2.9, D / 2 + 1.2, 4.6, .14, 2.4, 'sign_red')
    m.cube(0, 3.04, D / 2 + 1.2, 4.7, .08, 2.5, 'trim_white')
    for sg in (-1, 1):
        for zz in (.6, 2.1):
            m.cube(sg * 2.1, 0, D / 2 + zz, .22, 2.9, .22, 'trim_white')
    m.cube(0, 2.4, D / 2 + 2.35, 4.4, .45, .06, 'sign_gold')
    m.group('Rótulo')
    m.cube(0, H + .6, D / 2 - .3, 4.4, 1.3, .2, 'sign_dark')
    m.cube(0, H + .72, D / 2 - .18, 4.0, .9, .06, 'sign_red')
    for k in range(7):
        m.cube(-1.8 + k * .6, H + .85, D / 2 - .12, .3, .4, .04, 'lamp')
    for sg in (-1, 1):
        m.cube(sg * 2.0, H + .1, D / 2 - .3, .14, .6, .14, 'metal_dark')
    roof(m, W, D, H, wall, rng, ac=2, tank=True, stair=False)
    m.W, m.D, m.H = W, D, H


@design
def G_tienda_baja(m, rng, wall, trim, glass_t, accent):
    W, D = 8.0, 6.0
    H = floors_body(m, rng, W, D, 2, wall, trim, glass_t, ground_h=3.4, fh=2.9, shop_front=True, ww=1.5, ac=.5, planter=True)
    base_plinth(m, W, D, 'br_brown', .5)
    door_entrance(m, W, D, canopy=None, w=2.0, steps=1)
    m.group('Toldo')
    for sg in (-1, 1):
        m.cube(sg * 2.7, 2.95, D / 2 + .45, 2.2, .1, .9, accent or 'awn_blue')
        m.cube(sg * 2.7, 2.9, D / 2 + .91, 2.2, .14, .05, accent or 'awn_blue')
    m.group('Rótulo')
    m.cube(0, 3.4, D / 2 + .1, W - .8, .5, .1, 'sign_dark')
    m.cube(0, 3.46, D / 2 + .16, W - 1.2, .38, .05, 'sign_gold')
    roof(m, W, D, H, wall, rng, ac=2, tank=False, stair=True)
    m.W, m.D, m.H = W, D, H


@design
def H_pabellon(m, rng, wall, trim, glass_t, accent):
    W, D = 12.0, 18.0
    m.group('Cuerpo')
    core(m, W, D, .3, 7.5)
    m.group('Fachadas')
    for side in 'SNEW':
        facade(m, W, D, 0, 3.6, side, wall, trim, glass_t, ww=1.6, wh=1.6, sill=.9, rng=rng, door=(side == 'S'), minGap=1.0)
        facade(m, W, D, 3.6, 3.9, side, wall, trim, glass_t, ww=2.2, wh=1.8, sill=1.0, rng=rng, ribbon=True, minGap=.8)
    band(m, W, D, 3.55, .16, accent or 'sign_teal', .12)
    corners(m, W, D, 0, 7.5, 'trim_stone', w=.5)
    base_plinth(m, W, D)
    door_entrance(m, W, D, canopy='metal_dark', w=3.0, depth=1.8, pillars=True)
    m.group('Rótulo')
    m.cube(0, 3.8, D / 2 + .12, 6.0, 1.1, .14, accent or 'sign_teal')
    roof(m, W, D, 7.5, wall, rng, ac=4, tank=False, stair=True)
    m.W, m.D, m.H = W, D, 7.5


@design
def I_museo(m, rng, wall, trim, glass_t, accent):
    W, D = 10.0, 16.0
    m.group('Cuerpo')
    core(m, W, D, .3, 6.0)
    m.group('Fachadas')
    for side in 'SNEW':
        facade(m, W, D, 0, 3.4, side, wall, trim, glass_t, ww=1.2, wh=2.0, sill=.7, rng=rng, minGap=1.0, door=(side == 'S'))
        facade(m, W, D, 3.4, 2.6, side, wall, trim, glass_t, ww=1.2, wh=1.4, sill=.7, rng=rng, minGap=1.0)
    corners(m, W, D, 0, 6.0, trim, w=.5)
    m.group('Pórtico')
    for i in range(4):
        xx = -3.6 + i * 2.4
        m.cube(xx, .4, D / 2 + 1.4, .9, .3, .9, 'trim_stone')
        m.cube(xx, .7, D / 2 + 1.4, .7, 3.6, .7, 'trim_white')
        m.cube(xx, 4.3, D / 2 + 1.4, .9, .25, .9, 'trim_stone')
        for k in range(4):
            m.cube(xx, 1.0 + k * .8, D / 2 + 1.4, .78, .06, .78, 'trim_stone')
    m.cube(0, 4.55, D / 2 + 1.4, 10.4, .5, 1.5, 'trim_white')
    m.cube(0, 5.05, D / 2 + 1.4, 10.6, .2, 1.7, 'trim_stone')
    for k in range(5):
        m.cube(0, 5.25 + k * .3, D / 2 + 1.4, 9.6 - k * 1.8, .3, 1.5, 'trim_white')
    m.cube(0, 5.3, D / 2 + 2.15, 2.0, .9, .05, 'gold')
    for i in range(3):
        m.cube(0, i * .16, D / 2 + 2.5 + (2 - i) * .45, 8.4, .16, .9, 'concrete')
    for sg in (-1, 1):
        m.cube(sg * 4.7, 1.0, D / 2 + .15, .9, 2.6, .06, 'sign_red')
        m.cube(sg * 4.7, 3.6, D / 2 + .15, .9, .08, .08, 'gold')
    base_plinth(m, W, D)
    m.group('Rótulo')
    m.cube(0, 3.9, D / 2 + .1, 5.0, .55, .1, 'sign_dark')
    roof(m, W, D, 6.0, wall, rng, ac=3, tank=False, stair=False)
    m.group('Techo')
    m.cube(0, 6.2, 0, 4.0, 1.0, 5.0, 'glass')
    m.cube(0, 7.2, 0, 4.4, .2, 5.4, 'trim_stone')
    m.W, m.D, m.H = W, D, 6.0


# nombre, diseno, pared, marco, cristal, acento
BUILDINGS = [
    ('apartamentos_ladrillo',    'A_ladrillo',    'br_red',    'trim_white', 'glass',      'awn_red'),
    ('apartamentos_menta',       'A_ladrillo',    'pl_mint',   'trim_white', 'glass',      'awn_green'),
    ('apartamentos_cielo',       'A_ladrillo',    'pl_sky',    'trim_white', 'glass',      'awn_blue'),
    ('oficinas_gris',            'B_oficinas',    'pl_gray',   'trim_stone', 'glass_dark', None),
    ('oficinas_azules',          'B_oficinas',    'pl_blue',   'trim_stone', 'glass_dark', None),
    ('casa_tienda_durazno',      'C_casa_tienda', 'pl_peach',  'trim_white', 'glass',      'awn_green'),
    ('casa_tienda_rosa',         'C_casa_tienda', 'pl_rose',   'trim_white', 'glass',      'awn_blue'),
    ('tienda_amarilla',          'G_tienda_baja', 'pl_yellow', 'trim_white', 'glass',      'awn_blue'),
    ('tienda_lila',              'G_tienda_baja', 'pl_lilac',  'trim_white', 'glass',      'awn_gold'),
    ('torre_residencial_salvia', 'D_torre_res',   'pl_sage',   'trim_white', 'glass',      None),
    ('torre_residencial_naranja', 'D_torre_res',  'pl_orange', 'trim_white', 'glass',      None),
    ('artdeco_crema',            'E_artdeco',     'pl_cream',  'gold',       'glass_dark', None),
    ('hotel_rosa',               'F_hotel',       'pl_rose',   'trim_white', 'glass',      None),
    ('gimnasio',                 'H_pabellon',    'pl_rose',   'trim_white', 'glass',      'sign_red'),
    ('museo',                    'I_museo',       'pl_cream',  'trim_white', 'glass',      None),
]

def export_js():
    """Copia de cada .bbmodel como .js (sin textura) + atlas.js: el juego las usa cuando se abre index.html sin servidor (file://), donde fetch no funciona."""
    for f in OUT.glob('*.bbmodel'):
        d = json.loads(f.read_text(encoding='utf-8'))
        atlas_src = d['textures'][0]['source']
        d['textures'][0]['source'] = ''
        (OUT / (f.stem + '.js')).write_text("(window.BB_MODELS=window.BB_MODELS||{})['%s']=%s;" % (f.stem, json.dumps(d, ensure_ascii=False, separators=(',', ':'))), encoding='utf-8')
    (OUT / 'atlas.js').write_text("window.BB_ATLAS=%s;" % json.dumps(atlas_src), encoding='utf-8')
    print('js exportados')

