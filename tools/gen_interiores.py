"""Edificios con interior (café, arcade, mercado, biblioteca, ramen, taller, centro comercial y torre) como modelos de Blockbench.
Tamaño real: puertas de 3.2 m, techos de 4.8 a 6.5 m, muebles y detalles estilo Minecraft. 1 bloque = 1 metro. Frente = +Z.
Las colisiones de los muebles van en el grupo `colision` del propio modelo (se pueden editar en Blockbench).
"""
import math, random
from PIL import ImageDraw
import gen_edificios as G
from gen_edificios import Model, add_tile, solid, hexrgb, shade, TS, split, place, facade, core, roof, band, corners, base_plinth

T = .4          # grosor de los muros
DH = 3.0        # alto de la puerta
DW = 3.2        # ancho de la puerta


# ------------------------------------------------------------------ texturas nuevas ------------------
def pix(name, fn):
    add_tile(name, fn)


def noisy(c, k, rng):
    return shade(hexrgb(c), 1 + rng.uniform(-k, k))


def fill(im, col, noise=.05, rng=None):
    rng = rng or random.Random(5)
    for y in range(TS):
        for x in range(TS):
            im.putpixel((x, y), noisy(col, noise, rng))


def planks_t(name, col, rows=4, dark=.78):
    def f(d, im, rng):
        h = TS // rows
        for r in range(rows):
            off = (r * 11) % 16
            for x in range(TS):
                for y in range(h):
                    k = 1 + rng.uniform(-.05, .05) + (0.03 if (x + off) % 17 < 2 else 0)
                    im.putpixel((x, r * h + y), shade(hexrgb(col), k * (1 if y else dark)))
            d.line([(off), r * h, off, r * h + h - 1], fill=shade(hexrgb(col), dark))
    pix(name, f)


def register():
    # ---- suelos
    planks_t('oak_planks', '#b98a57', 4)
    planks_t('dark_planks', '#6b4527', 4)
    planks_t('ceil_wood', '#5a3a22', 2)
    pix('carpet_red', lambda d, im, r: (fill(im, '#8d2f3b', .06, r), [d.line([0, i, TS - 1, i], fill=hexrgb('#a13d49')) for i in range(0, TS, 4)]))
    def carpet_arc(d, im, r):
        fill(im, '#1c2146', .04, r)
        for i in range(0, TS, 8):
            d.line([i, 0, i, TS - 1], fill=hexrgb('#2c3470')); d.line([0, i, TS - 1, i], fill=hexrgb('#2c3470'))
        for (x, y, c) in ((4, 4, '#ff5fc2'), (20, 12, '#5ff0ff'), (12, 24, '#ffe45f'), (26, 28, '#7dff7d')):
            d.rectangle([x, y, x + 2, y + 2], fill=hexrgb(c))
    pix('carpet_arcade', carpet_arc)
    pix('tile_white', lambda d, im, r: (fill(im, '#eceae2', .025, r), d.line([0, 0, TS - 1, 0], fill=hexrgb('#b9b6aa')), d.line([0, 0, 0, TS - 1], fill=hexrgb('#b9b6aa')),
                                         d.line([TS // 2, 0, TS // 2, TS - 1], fill=hexrgb('#cfccc0')), d.line([0, TS // 2, TS - 1, TS // 2], fill=hexrgb('#cfccc0'))))
    def marble(d, im, r):
        fill(im, '#efe9dc', .03, r)
        for _ in range(3):
            x, y = r.randint(0, TS), r.randint(0, TS)
            for i in range(14):
                x += r.choice((-1, 0, 1, 1)); y += 1
                if 0 <= x < TS and 0 <= y < TS: im.putpixel((x, y), hexrgb('#b8b2a4'))
        d.line([0, 0, TS - 1, 0], fill=hexrgb('#cbc5b6')); d.line([0, 0, 0, TS - 1], fill=hexrgb('#cbc5b6'))
    pix('marble', marble)
    def garage(d, im, r):
        fill(im, '#8c9194', .06, r)
        for _ in range(26): im.putpixel((r.randint(0, 31), r.randint(0, 31)), hexrgb('#6c7174'))
        d.ellipse([6, 8, 17, 16], fill=hexrgb('#6e7478'))
    pix('garage_floor', garage)
    def tatami(d, im, r):
        fill(im, '#c8c27e', .04, r)
        for y in range(0, TS, 3): d.line([0, y, TS - 1, y], fill=hexrgb('#b2ac68'))
        d.line([0, 0, TS - 1, 0], fill=hexrgb('#4c5a35')); d.line([0, TS - 1, TS - 1, TS - 1], fill=hexrgb('#4c5a35'))
    pix('tatami', tatami)
    # ---- paredes y techos
    def wallp(d, im, r):
        fill(im, '#f1e6cc', .02, r)
        for x in range(0, TS, 8): d.line([x, 0, x, TS - 1], fill=hexrgb('#e4d4b0'))
    pix('wallpaper_cream', wallp)
    def wallp_dark(d, im, r):
        fill(im, '#2a2150', .03, r)
        for i in range(0, TS, 8):
            d.polygon([(i + 4, 0), (i + 8, 4), (i + 4, 8), (i, 4)], outline=hexrgb('#3d3076'))
            d.polygon([(i + 4, 16), (i + 8, 20), (i + 4, 24), (i, 20)], outline=hexrgb('#3d3076'))
    pix('wallpaper_dark', wallp_dark)
    def wallw(d, im, r):
        fill(im, '#c9a272', .04, r)
        for x in range(0, TS, 8): d.line([x, 0, x, TS - 1], fill=hexrgb('#9a7448'))
    pix('wall_wood', wallw)
    def pegb(d, im, r):
        fill(im, '#b99a6c', .03, r)
        for y in range(2, TS, 4):
            for x in range(2, TS, 4): im.putpixel((x, y), hexrgb('#5b4429'))
    pix('pegboard', pegb)
    pix('ceil_white', lambda d, im, r: (fill(im, '#f3efe4', .025, r), d.line([0, 0, TS - 1, 0], fill=hexrgb('#d9d4c4')), d.line([0, 0, 0, TS - 1], fill=hexrgb('#d9d4c4'))))
    pix('ceil_dark', lambda d, im, r: (fill(im, '#15122e', .03, r), d.line([0, 0, TS - 1, 0], fill=hexrgb('#262050'))))
    pix('wall_green', lambda d, im, r: fill(im, '#8fb89d', .03, r))
    pix('wall_red', lambda d, im, r: fill(im, '#a8473c', .04, r))
    pix('wall_blue', lambda d, im, r: fill(im, '#6f93b3', .03, r))
    pix('wall_sand', lambda d, im, r: fill(im, '#dccaa0', .03, r))
    # ---- muebles
    def books(pal, name):
        def f(d, im, r):
            d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#4a301c'))
            for row in range(2):
                y0 = row * 16 + 1
                x = 1
                while x < TS - 2:
                    w = r.choice((2, 3, 3, 4)); h = r.randint(10, 14)
                    c = hexrgb(r.choice(pal))
                    d.rectangle([x, y0 + 14 - h, x + w - 1, y0 + 14], fill=c)
                    d.line([x, y0 + 14 - h + 2, x + w - 1, y0 + 14 - h + 2], fill=shade(c, 1.25))
                    x += w
                d.line([0, y0 + 15, TS - 1, y0 + 15], fill=hexrgb('#8a5e36'))
        pix(name, f)
    books(['#b23b3b', '#3b6fb2', '#3fa05a', '#d9ad4a', '#7a4cb0', '#e0e0d0', '#c2662c'], 'books')
    books(['#8e2f2f', '#2f5a8e', '#d0c9b0', '#4f7f5a', '#a85d2a', '#6a3e82'], 'books2')
    def goods(d, im, r):
        d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#d8d4c6'))
        for row in range(3):
            y0 = row * 10 + 1
            d.rectangle([0, y0 + 8, TS - 1, y0 + 9], fill=hexrgb('#8f8a78'))
            x = 1
            while x < TS - 3:
                w = r.choice((3, 4, 4, 5)); h = r.randint(5, 8)
                c = hexrgb(r.choice(['#e25b4b', '#f2c94c', '#4b9ee2', '#58b368', '#f28fb0', '#f2f2f2', '#ff9d3a']))
                d.rectangle([x, y0 + 8 - h, x + w - 1, y0 + 7], fill=c)
                d.rectangle([x, y0 + 8 - h + 1, x + w - 1, y0 + 8 - h + 2], fill=shade(c, 1.25))
                x += w + 1
    pix('goods', goods)
    def fridge(d, im, r):
        d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#bfe0ea'))
        d.rectangle([0, 0, TS - 1, 1], fill=hexrgb('#e8f4f7'))
        for row in range(3):
            y0 = row * 10 + 3
            d.line([0, y0 + 7, TS - 1, y0 + 7], fill=hexrgb('#8fb0bb'))
            for x in range(2, TS - 3, 4):
                c = hexrgb(r.choice(['#e23b3b', '#3b9ee2', '#58c36a', '#f2c94c', '#f28f3a']))
                d.rectangle([x, y0, x + 2, y0 + 6], fill=c); d.rectangle([x, y0 - 1, x + 2, y0], fill=hexrgb('#dcdcdc'))
    pix('fridge', fridge)
    pix('counter_top', lambda d, im, r: (fill(im, '#ebe7da', .03, r), d.line([0, 0, TS - 1, 0], fill=hexrgb('#c9c4b3'))))
    def cfront(d, im, r):
        fill(im, '#8a5a36', .04, r)
        for x in range(0, TS, 8): d.rectangle([x + 1, 3, x + 6, TS - 4], outline=hexrgb('#6a4326'))
    pix('counter_front', cfront)
    def cab(d, im, r):
        fill(im, '#25336b', .03, r)
        d.rectangle([0, 0, 3, TS - 1], fill=hexrgb('#ff5fc2')); d.rectangle([TS - 4, 0, TS - 1, TS - 1], fill=hexrgb('#5ff0ff'))
    pix('cab_body', cab)
    def ctrl(d, im, r):
        fill(im, '#1a1a24', .03, r)
        d.ellipse([5, 10, 10, 15], fill=hexrgb('#d93a3a'))
        for i, c in enumerate(('#ffe45f', '#5ff0ff', '#7dff7d', '#ff5fc2')):
            d.ellipse([14 + i * 4, 10 + (i % 2) * 3, 17 + i * 4, 13 + (i % 2) * 3], fill=hexrgb(c))
    pix('cab_ctrl', ctrl)
    for nm, c in dict(cloth_red='#b3383f', cloth_blue='#3a5fa8', cloth_green='#3f8f5a', cloth_cream='#e9ddc0', wool_pink='#ef9bc0', wool_yellow='#f3d24b',
                      wool_white='#f2f2ee', wool_brown='#8a5a3a', wool_green='#6ccf6c', wool_blue='#5aa9e6', wool_purple='#9a5acb', wool_orange='#f08a3a',
                      glass_clear='#c6e6f0', water='#4fb3d9', tire='#23262a', car_red='#c93b3b', car_blue='#3b6fc9', steel='#aeb7bc', brass='#c9a24a',
                      sofa_dark='#5a4a6a', chalk='#2b3a33', fur='#e8dcc8', bark='#6a4a2d', stone='#8c9195', stone_light='#b8bcbc', fire='#f08a2a', coal='#2a2a2e',
                      cushion_red='#c64a4a', noren='#c9382c', curtain_red='#a8302e', cake_sponge='#e8c27a', icing_pink='#f4a3c1', icing_choc='#6b3b27',
                      tomato='#d93a2a', orange_fruit='#f0912a', lime='#8ccf4a', soup='#d8932f', bowl_white='#f2f0ea', rope='#b89a6a', green_dark='#3f6f45',
                      red_stripe='#b8332f', yellow_line='#e8c53a', oil='#2b2a30', copper='#b4693a').items():
        solid(nm, c, .045)
    def brick_floor(d, im, r):
        fill(im, '#9a5a45', .05, r)
    pix('redbrick_dull', brick_floor)
    def paint(name, sky, ground, accent):
        def f(d, im, r):
            d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#6b4a2d'))
            d.rectangle([3, 3, TS - 4, TS - 4], fill=hexrgb(sky))
            d.rectangle([3, 19, TS - 4, TS - 4], fill=hexrgb(ground))
            d.polygon([(6, 19), (13, 9), (20, 19)], fill=hexrgb(accent))
            d.ellipse([21, 6, 25, 10], fill=hexrgb('#ffe27a'))
        pix(name, f)
    paint('paint_a', '#8ec9ea', '#5f9a55', '#7a8f9c'); paint('paint_b', '#f3b27a', '#6a5a8a', '#b8566a'); paint('paint_c', '#a8d8c0', '#d8c88a', '#4f7f8a')
    def menu(d, im, r):
        d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#2b3a33'))
        d.rectangle([1, 1, TS - 2, TS - 2], outline=hexrgb('#8a5e36'))
        for y in range(5, TS - 4, 5):
            d.line([5, y, 5 + r.randint(10, 20), y], fill=hexrgb('#f0efe0'))
            d.line([TS - 9, y, TS - 5, y], fill=hexrgb('#e8c53a'))
    pix('menu_board', menu)
    def poster(name, bg, fg):
        def f(d, im, r):
            d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb(bg)); d.rectangle([2, 2, TS - 3, TS - 3], outline=hexrgb(fg))
            d.ellipse([9, 6, 22, 19], fill=hexrgb(fg)); d.rectangle([6, 22, 25, 25], fill=hexrgb(fg)); d.rectangle([10, 27, 21, 28], fill=hexrgb(fg))
        pix(name, f)
    poster('poster_a', '#3a2a6a', '#ff5fc2'); poster('poster_b', '#1f4a5a', '#5ff0ff'); poster('poster_c', '#6a3a1f', '#ffe45f')
    def elev(d, im, r):
        fill(im, '#b6bfc4', .03, r)
        d.line([TS // 2, 0, TS // 2, TS - 1], fill=hexrgb('#5a666c')); d.line([TS // 2 - 1, 0, TS // 2 - 1, TS - 1], fill=hexrgb('#5a666c'))
        d.rectangle([0, 0, TS - 1, 1], fill=hexrgb('#7a868c'))
    pix('elev_door', elev)
    def shoji(d, im, r):
        fill(im, '#f4ecd2', .02, r)
        for i in range(0, TS, 8): d.line([i, 0, i, TS - 1], fill=hexrgb('#8a6a3a')); d.line([0, i, TS - 1, i], fill=hexrgb('#8a6a3a'))
    pix('shoji', shoji)
    pix('mirror', lambda d, im, r: [d.line([0, y, TS - 1, y], fill=(int(190 + y * 1.2), int(215 + y * .8), 225)) for y in range(TS)])
    def apples(d, im, r):
        fill(im, '#7a5a35', .04, r)
        for y in range(2, TS - 3, 6):
            for x in range(2, TS - 3, 6):
                d.ellipse([x, y, x + 4, y + 4], fill=hexrgb(r.choice(['#d93a2a', '#e8c53a', '#7ac24a', '#f0912a'])))
    pix('produce', apples)
    def bread(d, im, r):
        fill(im, '#7a5a35', .04, r)
        for x in range(2, TS - 6, 9): d.ellipse([x, 8, x + 8, 18], fill=hexrgb('#d9a050')); d.line([x + 2, 11, x + 6, 14], fill=hexrgb('#b07a30'))
    pix('bakery', bread)
    def cake(d, im, r):
        fill(im, '#e8c27a', .03, r)
        d.rectangle([0, 0, TS - 1, 9], fill=hexrgb('#f4a3c1'))
        for x in range(0, TS, 4): d.ellipse([x, 8, x + 3, 12], fill=hexrgb('#f4a3c1'))
        d.ellipse([12, 2, 16, 6], fill=hexrgb('#c9302c'))
    pix('cake', cake)
    def hazard(d, im, r):
        for y in range(TS):
            for x in range(TS): im.putpixel((x, y), hexrgb('#e8c53a') if ((x + y) // 6) % 2 == 0 else hexrgb('#23262a'))
    pix('hazard', hazard)
    def dots(d, im, r):
        fill(im, '#5b3a22', .04, r)
        for _ in range(12):
            x, y = r.randint(0, 29), r.randint(0, 29); d.rectangle([x, y, x + r.randint(1, 3), y + 1], fill=hexrgb('#7a5030'))
    pix('barrel_wood', dots)
    # ---- emisivos (índice >= 160, o sea y >= 640 px en el atlas: el juego los hace brillar)
    G.pad_to(160)
    solid('ceil_lit', '#c9c4b2', .02); solid('ceil_lit_dark', '#2a2458', .02); solid('ceil_lit_wood', '#7a5a3a', .02)
    solid('glow', '#ffe9a8', .02); solid('glow_cool', '#d8f0ff', .02); solid('neon_pink', '#ff5fc2', .02); solid('neon_cyan', '#5ff0ff', .02)
    solid('neon_yellow', '#ffe45f', .02); solid('neon_green', '#7dff7d', .02); solid('lantern', '#ff6a3a', .04); solid('glow_orange', '#ffb04a', .03)
    def scr(name, kind):
        def f(d, im, r):
            d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb('#0a0a1e'))
            if kind == 'a':     # invasores
                for gy in range(3):
                    for gx in range(5):
                        x, y = 3 + gx * 5, 4 + gy * 5
                        d.rectangle([x, y, x + 2, y + 2], fill=hexrgb(('#7dff7d', '#5ff0ff', '#ff5fc2')[gy]))
                d.rectangle([14, 26, 18, 28], fill=hexrgb('#ffe45f'))
            elif kind == 'b':   # carrera
                d.polygon([(14, 0), (18, 0), (30, TS - 1), (2, TS - 1)], fill=hexrgb('#3a3a4a'))
                for y in range(2, TS, 8): d.rectangle([15, y, 16, y + 3], fill=hexrgb('#f0f0f0'))
                d.rectangle([13, 22, 18, 28], fill=hexrgb('#ff4a4a'))
            else:               # laberinto
                for y in range(2, TS, 8): d.line([2, y, TS - 3, y], fill=hexrgb('#4a6aff'))
                for x in range(2, TS, 10): d.line([x, 2, x, TS - 3], fill=hexrgb('#4a6aff'))
                d.ellipse([12, 12, 19, 19], fill=hexrgb('#ffe45f')); d.ellipse([4, 4, 7, 7], fill=hexrgb('#ff5fc2'))
        pix(name, f)
    scr('screen_a', 'a'); scr('screen_b', 'b'); scr('screen_c', 'c')
    def marq(name, a, b):
        def f(d, im, r):
            d.rectangle([0, 0, TS - 1, TS - 1], fill=hexrgb(a))
            for x in range(1, TS, 6): d.rectangle([x, 12, x + 3, 19], fill=hexrgb(b))
            d.rectangle([0, 0, TS - 1, 2], fill=hexrgb(b)); d.rectangle([0, TS - 3, TS - 1, TS - 1], fill=hexrgb(b))
        pix(name, f)
    marq('marquee_a', '#7a1f6a', '#ff9de0'); marq('marquee_b', '#1f4a6a', '#9df0ff')


# ------------------------------------------------------------------ utilidades -----------------------
def lbox(m, x, z, face, u, v, w, d, y, h, tile, col=False):
    """Caja en coordenadas locales de un mueble: (u,v) desplazamiento lateral/hacia el frente; w ancho, d fondo. face = hacia dónde mira (S=+z, N=-z, E=+x, W=-x)."""
    if face == 'S': wx, wz, ww, wd = x + u, z + v, w, d
    elif face == 'N': wx, wz, ww, wd = x - u, z - v, w, d
    elif face == 'E': wx, wz, ww, wd = x + v, z - u, d, w
    else: wx, wz, ww, wd = x - v, z + u, d, w
    m.cube(wx, y, wz, ww, h, wd, tile)


def lcol(m, x, z, face, u, v, w, d, h, y0=0):
    if face == 'S': wx, wz, ww, wd = x + u, z + v, w, d
    elif face == 'N': wx, wz, ww, wd = x - u, z - v, w, d
    elif face == 'E': wx, wz, ww, wd = x + v, z - u, d, w
    else: wx, wz, ww, wd = x - v, z + u, d, w
    m.col(wx, wz, ww, wd, h, y0)


def wall_item(m, W, D, side, u, y, w, h, tile, t=.06, out=0.0):
    """Cuadro/cartel pegado a la cara interior de un muro."""
    if side == 'S': m.cube(u, y, D / 2 - T - .06 - t / 2 - out, w, h, t, tile)
    elif side == 'N': m.cube(-u, y, -D / 2 + T + .06 + t / 2 + out, w, h, t, tile)
    elif side == 'E': m.cube(W / 2 - T - .06 - t / 2 - out, y, -u, t, h, w, tile)
    else: m.cube(-W / 2 + T + .06 + t / 2 + out, y, u, t, h, w, tile)


def table(m, x, z, w, d, h=.85, top='oak_planks', leg='dark_planks', collide=True):
    m.cube(x, h - .08, z, w, .08, d, top)
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(x + sx * (w / 2 - .09), 0, z + sz * (d / 2 - .09), .1, h - .08, .1, leg)
    m.cube(x, h - .2, z, w - .3, .12, d - .3, leg) if w > 1.3 else None
    if collide: m.col(x, z, w, d, h)


def round_table(m, x, z, r=.55, h=.8, top='oak_planks'):
    m.cube(x, h - .08, z, r * 2, .08, r * 1.5, top); m.cube(x, h - .08, z, r * 1.5, .08, r * 2, top)
    m.cube(x, .1, z, .16, h - .18, .16, 'dark_planks'); m.cube(x, 0, z, .7, .1, .7, 'dark_planks')
    m.col(x, z, r * 2, r * 2, h)


def chair(m, x, z, face='S', seat='cloth_red', collide=True):
    lbox(m, x, z, face, 0, 0, .5, .5, .42, .08, seat)
    for sx in (-1, 1):
        for sz in (-1, 1): lbox(m, x, z, face, sx * .2, sz * .2, .08, .08, 0, .42, 'dark_planks')
    lbox(m, x, z, face, 0, -.21, .5, .08, .5, .5, seat)
    if collide: m.col(x, z, .5, .5, .9)


def stool(m, x, z, h=.7, top='cloth_red', collide=True):
    m.cube(x, h - .08, z, .45, .08, .45, top); m.cube(x, 0, z, .1, h - .08, .1, 'metal_dark'); m.cube(x, 0, z, .4, .06, .4, 'metal_dark'); m.cube(x, h * .45, z, .36, .04, .36, 'metal_dark')
    if collide: m.col(x, z, .45, .45, h)


def sofa(m, x, z, w, face='S', tile='cloth_red', d=.95):
    lbox(m, x, z, face, 0, 0, w, d, 0, .4, 'dark_planks'); lbox(m, x, z, face, 0, .05, w - .2, d - .2, .4, .22, tile)
    lbox(m, x, z, face, 0, -d / 2 + .15, w, .3, .4, .55, tile)
    for sg in (-1, 1): lbox(m, x, z, face, sg * (w / 2 - .12), 0, .24, d, .4, .35, tile)
    lcol(m, x, z, face, 0, 0, w, d, .9)


def plant(m, x, z, h=1.5, collide=True):
    m.cube(x, 0, z, .6, .55, .6, 'pot'); m.cube(x, .55, z, .5, .08, .5, 'bark')
    m.cube(x, .6, z, .12, h - .6, .12, 'bark')
    m.cube(x, h - .5, z, .95, .5, .95, 'plant'); m.cube(x, h - .05, z, .65, .45, .65, 'green_dark'); m.cube(x + .1, h + .35, z - .05, .35, .3, .35, 'plant')
    m.cube(x - .45, h - .75, z, .4, .3, .5, 'green_dark'); m.cube(x, h - .75, z + .45, .5, .3, .4, 'plant')
    if collide: m.col(x, z, .65, .65, h)


def pendant(m, x, z, ytop, ylamp, w=.7, tile='glow', shade_t='metal_dark'):
    m.cube(x, ylamp + .3, z, .04, ytop - ylamp - .3, .04, 'metal_dark')
    m.cube(x, ylamp + .22, z, w * .6, .1, w * .6, shade_t); m.cube(x, ylamp + .06, z, w, .18, w, shade_t); m.cube(x, ylamp, z, w * .8, .08, w * .8, tile)


def rug(m, x, z, w, d, tile, border='gold'):
    m.cube(x, .01, z, w, .03, d, border); m.cube(x, .02, z, w - .3, .03, d - .3, tile)


def shelf_unit(m, x, z, w, d, h, face, levels=5, books='books', frame='dark_planks', col=True):
    """Estantería: marco de madera + lomos de libros (textura) en cada nivel."""
    lbox(m, x, z, face, 0, -d / 2 + .06, w, .12, 0, h, frame)
    for sg in (-1, 1): lbox(m, x, z, face, sg * (w / 2 - .06), 0, .12, d, 0, h, frame)
    lbox(m, x, z, face, 0, 0, w, d, h - .1, .1, frame); lbox(m, x, z, face, 0, 0, w, d, 0, .12, frame)
    step = (h - .22) / levels
    for i in range(levels):
        y = .12 + i * step
        lbox(m, x, z, face, 0, 0, w - .2, d - .1, y, .06, frame)
        lbox(m, x, z, face, 0, d / 2 - .22, w - .24, .12, y + .06, step - .14, books if i % 2 == 0 else (books + '' if books != 'books' else 'books2'))
    if col: lcol(m, x, z, face, 0, 0, w, d, h)


def counter(m, x, z, w, d, face='S', h=1.05, top='counter_top', front='counter_front', col=True):
    lbox(m, x, z, face, 0, 0, w, d, 0, .12, 'metal_dark')
    lbox(m, x, z, face, 0, -.04, w - .08, d - .1, .12, h - .12, 'dark_planks')
    lbox(m, x, z, face, 0, d / 2 - .04, w - .1, .06, .12, h - .2, front)
    lbox(m, x, z, face, 0, .02, w + .1, d + .1, h - .08, .1, top)
    if col: lcol(m, x, z, face, 0, 0, w, d, h)


def slab(m, x0, x1, z0, z1, y, h, tile):
    """Superficie grande en cuadros de hasta 4 m, para que la textura se repita a escala real (8 px por metro)."""
    for a0, a1 in split(x0, x1):
        for b0, b1 in split(z0, z1):
            m.cube((a0 + a1) / 2, y, (b0 + b1) / 2, a1 - a0, h, b1 - b0, tile)


def beams(m, W, D, y, tile='dark_planks', every=3.2):
    n = int((D - 1) / every)
    for i in range(n + 1):
        z = -D / 2 + T + (D - 2 * T) * (i / max(1, n))
        m.cube(0, y - .22, z, W - 2 * T, .22, .28, tile)


def strip_lights(m, W, D, y, tile, n=3, along='z', width=.22):
    for i in range(n):
        u = (-W / 2 + T + (W - 2 * T) * (i + .5) / n) if along == 'z' else (-D / 2 + T + (D - 2 * T) * (i + .5) / n)
        if along == 'z': m.cube(u, y - .04, 0, width, .04, D - 2 * T - .6, tile)
        else: m.cube(0, y - .04, u, W - 2 * T - .6, .04, width, tile)


def potted_flower(m, x, y, z, c='flower_pink'):
    m.cube(x, y, z, .22, .2, .22, 'pot'); m.cube(x, y + .2, z, .18, .12, .18, 'plant'); m.cube(x, y + .32, z, .08, .08, .08, c)


def cup(m, x, y, z, tile='bowl_white'):
    m.cube(x, y, z, .12, .14, .12, tile); m.cube(x, y + .14, z, .08, .02, .08, 'icing_choc')


# ------------------------------------------------------------------ cascarón del edificio -------------
def window_deco(m, W, D, side, c, ww, y0, y1, glass_t, frame='trim_white', awn=None):
    L = 0
    place(m, side, c, y0 + .04, y1 - y0 - .08, ww - .08, .05, glass_t, W, D, -.17)
    for uu in (c - ww / 2 + .05, c + ww / 2 - .05):
        place(m, side, uu, y0, y1 - y0, .1, .1, frame, W, D, .05)
    place(m, side, c, y0, .1, ww, .1, frame, W, D, .05); place(m, side, c, y1 - .1, .1, ww, .1, frame, W, D, .05)
    n = max(1, int(ww / 1.1)) - 1 + 1
    for k in range(1, n):
        place(m, side, c - ww / 2 + k * ww / n, y0, y1 - y0, .07, .08, frame, W, D, .04)
    place(m, side, c, (y0 + y1) / 2, .07, ww, .08, frame, W, D, .04)
    place(m, side, c, y0 - .11, .11, ww + .3, .3, 'trim_stone', W, D, .15)
    place(m, side, c, y1, .13, ww + .36, .26, 'trim_stone', W, D, .13)
    if awn:
        place(m, side, c, y1 + .14, .1, ww + .5, 1.0, awn, W, D, .6)
        place(m, side, c, y1 + .02, .14, ww + .5, .06, awn, W, D, 1.08)


def wall_side(m, W, D, side, y1, wall, inner, openings, glass_t, frame='trim_white', awn=None, rng=None):
    """Muro de planta baja con huecos: openings = [(centro, ancho, alféizar, alto, 'win'|'door')]."""
    L = W if side in 'SN' else D
    ops = sorted(openings, key=lambda o: o[0])
    edges = [-L / 2]
    for c, w, s0, h, kd in ops: edges += [c - w / 2, c + w / 2]
    edges.append(L / 2)

    def piece(a, b, ya, yb):
        for s0, s1 in split(a, b):
            u, l = (s0 + s1) / 2, s1 - s0
            place(m, side, u, ya, yb - ya, l, T, wall, W, D, 0)
            place(m, side, u, ya, yb - ya, l, .06, inner, W, D, -T)
    for i in range(0, len(edges), 2):
        if edges[i + 1] - edges[i] > .01: piece(edges[i], edges[i + 1], 0, y1)
    for c, w, s0, h, kd in ops:
        if s0 > .01: piece(c - w / 2, c + w / 2, 0, s0)
        if s0 + h < y1 - .01: piece(c - w / 2, c + w / 2, s0 + h, y1)
        if kd == 'win': window_deco(m, W, D, side, c, w, s0, s0 + h, glass_t, frame, awn)
        else:
            for sg in (-1, 1): place(m, side, c + sg * (w / 2 + .12), 0, s0 + h, .26, .3, 'trim_white', W, D, .06)
            place(m, side, c, s0 + h, .22, w + .5, .34, 'trim_white', W, D, .08)


def openings_for(L, ww, sill, wh, door=True, margin=.8, gapmin=1.0):
    ops = []
    if door:
        ops.append((0, DW, 0, DH, 'door'))
        half = L / 2 - DW / 2
        n = max(0, int((half - gapmin) // (ww + gapmin)))
        if n:
            g = (half - n * ww) / (n + 1)
            for k in range(n):
                c = DW / 2 + g + ww / 2 + k * (ww + g)
                ops += [(c, ww, sill, wh, 'win'), (-c, ww, sill, wh, 'win')]
    else:
        n = max(1, int((L - gapmin) // (ww + gapmin)))
        g = (L - n * ww) / (n + 1)
        for k in range(n): ops.append((-L / 2 + g + ww / 2 + k * (ww + g), ww, sill, wh, 'win'))
    return ops


def shell(m, rng, W, D, Hc, H, *, wall, inner, floor, ceil, trim='trim_white', glass_t='glass', ww=2.4, sill=.7, wh=2.5, awn='awn_red', board='sign_dark',
          upper_wall=None, beam='dark_planks', ground_tile='concrete', upper_ww=1.5, roof_kw=None, floor_h=2.9):
    """Suelo, muros con huecos (puerta delante y detrás), techo con vigas, planta alta decorativa y azotea."""
    m.group('Suelo')
    slab(m, -W / 2 + T, W / 2 - T, -D / 2 + T, D / 2 - T, 0, .04, floor)
    for sg in (-1, 1):
        m.cube(0, 0, sg * (D / 2 + .5), DW + 1.4, .03, 1.0, 'concrete')     # acera de la entrada
    m.group('Muros')
    for side in 'SNEW':
        L = W if side in 'SN' else D
        ops = openings_for(L, ww, sill, wh, door=side in 'SN')
        wall_side(m, W, D, side, Hc, wall, inner, ops, glass_t, trim, awn if side == 'S' else None, rng)
    for sz in (-1, 1):                      # zócalo exterior en anillo (sin tapar la puerta ni el interior)
        for sg in (-1, 1):
            x0, x1 = DW / 2, W / 2 + .07
            m.cube(sg * (x0 + x1) / 2, 0, sz * (D / 2 - .1), x1 - x0, .35, .34, 'stone_dark'); m.cube(sg * (x0 + x1) / 2, .35, sz * (D / 2 - .1), x1 - x0, .1, .3, 'trim_stone')
    for sx in (-1, 1):
        m.cube(sx * (W / 2 - .1), 0, 0, .34, .35, D - .5, 'stone_dark'); m.cube(sx * (W / 2 - .1), .35, 0, .3, .1, D - .5, 'trim_stone')
    corners(m, W, D, 0, Hc, trim, w=.45)
    m.group('Techo interior')
    slab(m, -W / 2 + T, W / 2 - T, -D / 2 + T, D / 2 - T, Hc - .3, .3, {'ceil_white': 'ceil_lit', 'ceil_dark': 'ceil_lit_dark', 'ceil_wood': 'ceil_lit_wood'}.get(ceil, ceil))
    beams(m, W, D, Hc - .3, beam)
    m.group('Cartel')
    m.cube(0, DH + .2, D / 2 + .1, 4.4, 1.15, .16, board); m.cube(0, DH + .2, D / 2 + .22, 4.6, .08, .1, 'gold'); m.cube(0, DH + 1.27, D / 2 + .22, 4.6, .08, .1, 'gold')
    m.cube(0, DH + .15, -D / 2 - .1, 2.6, .5, .12, 'neon_green') if False else None
    for sg in (-1, 1):
        m.cube(sg * (DW / 2 + .6), 2.0, D / 2 + .2, .16, .35, .16, 'metal_dark'); m.cube(sg * (DW / 2 + .6), 2.0, D / 2 + .36, .2, .2, .2, 'glow')
    # planta alta (decorativa, sólida)
    up = upper_wall or wall
    m.group('Planta alta')
    n = max(1, round((H - Hc) / floor_h))
    core(m, W, D, Hc, H)
    m.group('Fachada alta')
    fh = (H - Hc) / n
    for i in range(n):
        for side in 'SNEW':
            facade(m, W, D, Hc + i * fh, fh, side, up, trim, glass_t, ww=upper_ww, wh=min(1.5, fh - 1.1), sill=.75, rng=rng, minGap=.8)
    band(m, W, D, Hc - .08, .22, trim, .14)
    roof(m, W, D, H, up, rng, **dict(dict(ac=3, tank=False, stair=False, accent=trim), **(roof_kw or {})))


# ------------------------------------------------------------------ interiores -----------------------
def cafe(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Mostrador')
    counter(m, -4.0, -hz + 1.55, 4.8, 1.0, 'S')
    counter(m, -hx + 1.05, -hz + 4.0, 3.0, 1.0, 'E')      # ala lateral en L
    for i in range(4): stool(m, -5.6 + i * 1.1, -hz + 3.0)
    lbox(m, -4.0, -hz + 1.55, 'S', .8, 0, .9, .6, 1.13, .7, 'metal_dark'); lbox(m, -4.0, -hz + 1.55, 'S', .8, .0, .8, .5, 1.83, .12, 'metal')   # máquina de café
    lbox(m, -4.0, -hz + 1.55, 'S', .8, .3, .6, .06, 1.35, .3, 'door_glass')
    for k in range(3): cup(m, -4.9 + k * .28, 1.13, -hz + 1.45)
    lbox(m, -4.0, -hz + 1.55, 'S', -1.7, .1, 1.3, .8, 1.13, .55, 'glass_clear'); lbox(m, -4.0, -hz + 1.55, 'S', -1.7, .1, 1.2, .7, 1.13, .12, 'cake')
    for k in range(3): lbox(m, -4.0, -hz + 1.55, 'S', -2.1 + k * .4, .1, .26, .26, 1.25, .22, 'cake')
    m.cube(-2.6, 1.13, -hz + 1.2, .5, .3, .4, 'metal_dark'); m.cube(-2.6, 1.43, -hz + 1.2, .4, .15, .3, 'glow_cool')   # caja registradora
    shelf_unit(m, -4.0, -hz + .42, 4.6, .6, 2.8, 'S', 4, 'goods', col=False)
    for i in range(3): wall_item(m, W, D, 'N', 2.0 - i * 1.0 - 4.9 + 4.9 + 1.5 * 0, 3.0, .9, .75, 'menu_board') if False else None
    for i, u in enumerate((-4.8, -3.6, -2.4)): wall_item(m, W, D, 'N', -u, 3.1, 1.0, .8, 'menu_board', out=.02) if False else None
    for u in (4.9, 3.7, 2.5): wall_item(m, W, D, 'N', u, 3.0 + .0, 1.0, .85, 'menu_board')      # N invierte u
    for sx in (-3.2, -4.8): pendant(m, sx, -hz + 3.2, Hc - .3, Hc - 1.35)
    m.group('Mesas')
    for (x, z) in ((-3.4, 1.4), (-3.4, 4.2), (3.8, -3.0), (3.8, .4), (3.8, 3.8)):
        round_table(m, x, z)
        chair(m, x - .95, z, 'E', 'cloth_red'); chair(m, x + .95, z, 'W', 'cloth_cream'); chair(m, x, z + .95, 'N', 'cloth_green')
        cup(m, x - .2, .88, z); potted_flower(m, x + .15, .88, z + .05)
        pendant(m, x, z, Hc - .3, Hc - 1.6, .6)
    m.group('Reservados')
    for z in (-3.6, -.6, 2.4):
        pass
    sofa(m, hx - .6, -4.6, 2.6, 'W', 'cloth_red') if False else None
    m.group('Decoración')
    for (x, z) in ((-hx + .5, hz - .5), (hx - .5, hz - .5), (hx - .5, -hz + .5), (-hx + .5, 5.4)): plant(m, x, z, 1.7)
    for u, t in ((-3.0, 'paint_a'), (2.2, 'paint_b'), (4.6, 'paint_c')): wall_item(m, W, D, 'E', u, 2.0, 1.3, 1.0, t)
    for u, t in ((-1.5, 'paint_c'), (2.6, 'paint_a')): wall_item(m, W, D, 'W', u, 2.0, 1.3, 1.0, t)
    shelf_unit(m, hx - .5, -hz + 3.2, 2.2, .6, 2.6, 'W', 4, 'books2')
    rug(m, 0, 0, 2.8, 5.0, 'carpet_red')
    strip_lights(m, W, D, Hc - .3, 'glow', 2, 'z', .16)


def arcade(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    scr = ['screen_a', 'screen_b', 'screen_c']; mq = ['marquee_a', 'marquee_b']
    def cabinet(x, z, face, k):
        lbox(m, x, z, face, 0, -.2, .95, .6, 0, 2.05, 'cab_body'); lbox(m, x, z, face, 0, .2, .95, .4, 0, .95, 'cab_body')
        lbox(m, x, z, face, 0, .25, .95, .5, .95, .1, 'cab_ctrl'); lbox(m, x, z, face, 0, .0, .8, .05, 1.3, .62, scr[k % 3])
        lbox(m, x, z, face, 0, .02, .95, .08, 1.9, .3, mq[k % 2]); lbox(m, x, z, face, 0, .0, .95, .55, 2.05, .06, 'ceil_dark')
        lbox(m, x, z, face, -.2, .3, .07, .07, 1.05, .16, 'steel'); lbox(m, x, z, face, -.2, .3, .16, .16, 1.2, .14, 'cloth_red')
        lcol(m, x, z, face, 0, 0, .95, 1.0, 2.1)
    m.group('Máquinas recreativas')
    k = 0
    for i in range(6):          # pared oeste mirando al este
        cabinet(-hx + .65, -hz + 1.9 + i * 1.55, 'E', k); k += 1
    for i in range(6):          # pared este mirando al oeste
        cabinet(hx - .65, -hz + 1.9 + i * 1.55, 'W', k); k += 1
    for i in range(3):          # isla central (espalda con espalda)
        cabinet(-3.4, -3.2 + i * 1.7, 'W', k); cabinet(-4.5, -3.2 + i * 1.7, 'E', k + 1); k += 2
    for i in range(3):
        cabinet(3.4, -3.2 + i * 1.7, 'E', k); cabinet(4.5, -3.2 + i * 1.7, 'W', k + 1); k += 2
    m.group('Premios')
    counter(m, -3.9, -hz + 1.0, 4.4, 1.1, 'S', h=1.1, top='cab_ctrl', front='cab_body')
    shelf_unit(m, -3.9, -hz + .42, 4.2, .5, 3.4, 'S', 4, 'goods', col=False)
    pl = ['wool_pink', 'wool_yellow', 'wool_white', 'wool_blue', 'wool_green', 'wool_purple', 'wool_orange']
    for r in range(4):
        for i in range(7):
            m.cube(-5.8 + i * .62, .98 + r * .78 + .28, -hz + .48, .34, .34, .34, pl[(i + r) % 7])
            m.cube(-5.8 + i * .62, .98 + r * .78 + .6, -hz + .48, .22, .22, .22, pl[(i + r + 3) % 7])
    wall_item(m, W, D, 'N', 3.9, 4.0, 5.2, .6, 'marquee_b', out=.0)
    m.group('Garras y juegos')
    for (x, z) in ((-2.4, 4.4), (-2.4 + 0.0, 4.4 - 9.0)) if False else ((-2.4, 4.4), (2.4, 4.4)):
        m.cube(x, 0, z, 1.5, .9, 1.5, 'cab_body'); m.cube(x, .9, z, 1.5, 1.2, 1.5, 'glass_clear')
        for i in range(5): m.cube(x - .45 + (i % 3) * .4, .95, z - .4 + (i // 3) * .5, .32, .32, .32, pl[(i * 2) % 7])
        m.cube(x, 2.1, z, 1.5, .25, 1.5, mq[0]); m.cube(x, 1.8, z, .05, .3, .05, 'steel'); m.cube(x, 1.7, z, .22, .12, .22, 'metal_dark')
        m.col(x, z, 1.5, 1.5, 2.4)
    m.cube(4.3, .0, 5.2, 2.4, .8, 1.2, 'cab_body'); m.cube(4.3, .8, 5.2, 2.2, .06, 1.0, 'neon_cyan'); m.col(4.3, 5.2, 2.4, 1.2, .9)
    m.cube(4.3, .86, 5.2, .12, .03, .12, 'neon_yellow')
    for sx in (-1, 1): m.cube(sx * 1.4, .0, 4.6, .12, .9, .12, 'steel') if False else None
    for i, (x, z, t) in enumerate(((-hx + .5, hz - .5, 'wool_pink'),)):
        m.cube(x, 0, z, 1.0, .6, 1.0, t); m.cube(x, .45, z, .9, .35, .9, t); m.col(x, z, 1.0, 1.0, .8)
    m.group('Neón')
    strip_lights(m, W, D, Hc - .3, 'neon_pink', 2, 'z'); strip_lights(m, W, D, Hc - .3, 'neon_cyan', 1, 'z')
    for u, t in ((-4.0, 'poster_a'), (-1.2, 'poster_b'), (2.4, 'poster_c')): wall_item(m, W, D, 'S', u, 2.2, 1.4, 2.0, t)
    for side in 'EW': wall_item(m, W, D, side, 0, 3.9, 7.5, .1, 'neon_pink', t=.05)
    for side in 'EW': wall_item(m, W, D, side, 0, 3.6, 7.5, .1, 'neon_cyan', t=.05)


def market(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Góndolas')
    for sx in (-1, 1):
        for z in (-3.6, -.3, 3.0):
            shelf_unit(m, sx * 3.9, z, 1.0, 2.8, 2.0, 'E' if sx < 0 else 'W', 4, 'goods', frame='steel', col=False)
            shelf_unit(m, sx * 3.9 + sx * .9, z, 1.0, 2.8, 2.0, 'W' if sx < 0 else 'E', 4, 'goods', frame='steel', col=False)
            m.cube(sx * 3.9 + sx * .45, 2.0, z, 1.8, .6, 2.9, 'sign_teal') if False else None
            m.col(sx * 3.9 + sx * .45, z, 2.0, 2.8, 2.0)
            m.cube(sx * 3.9 + sx * .45, 2.05, z, .06, .5, 2.4, 'sign_teal')
    m.group('Refrigeradores')
    for sx in (-1, 1):
        for k in range(2):
            x = sx * (2.7 + k * 1.15) if False else sx * (3.2 + k * 1.1)
            m.cube(x, 0, -hz + .45, 1.0, 2.3, .8, 'steel'); m.cube(x, .15, -hz + .85, .9, 2.0, .05, 'fridge'); m.col(x, -hz + .45, 1.0, .8, 2.3)
            m.cube(x, 2.3, -hz + .45, 1.0, .2, .8, 'glow_cool')
    m.group('Verduras y panadería')
    for i in range(3):
        x = -hx + 1.1 + i * 1.7
        m.cube(x, 0, hz - 1.4, 1.5, .8, 1.0, 'dark_planks'); m.cube(x, .8, hz - 1.4, 1.5, .1, 1.0, 'produce'); m.cube(x, .5, hz - 1.9, 1.5, .3, .08, 'oak_planks')
        m.col(x, hz - 1.4, 1.5, 1.0, .9)
        m.cube(x, 1.7, hz - 1.0, 1.3, .6, .08, 'sign_teal') if False else None
    counter(m, -hx + 1.0, -hz + 2.6, 1.8, 3.4, 'E', h=1.05)
    m.cube(-hx + 1.0, 1.1, -hz + 1.8, 1.6, .06, .5, 'bakery'); m.cube(-hx + 1.0, 1.15, -hz + 3.3, 1.6, .06, .5, 'bakery')
    m.cube(-hx + .55, 1.1, -hz + 2.6, .5, 1.1, 2.6, 'glass_clear')
    m.group('Cajas')
    for z in (hz - 1.6, hz - 4.6):
        counter(m, hx - 1.6, z, 2.4, .9, 'S', h=.95, top='steel', front='steel')
        m.cube(hx - 1.6, .95, z - .2, .5, .35, .4, 'metal_dark'); m.cube(hx - 1.6, 1.3, z - .2, .4, .12, .3, 'glow_cool')
        m.cube(hx - 2.3, .95, z + .1, .5, .4, .5, 'cloth_red')
    for z in (-hz + 1.0, -hz + 1.6):
        for k in range(3): m.cube(hx - 1.0 - k * .9, .0, hz - 7.8, .5, .6, .4, 'cloth_red') if False else None
    for i in range(4):          # carritos
        x, z = -1.0 + (i % 2) * .8, hz - 1.2 - (i // 2) * 1.0
    for i in range(3):
        x = 2.6 + i * .7
        m.cube(x, .3, hz - 3.2, .6, .1, .9, 'steel'); m.cube(x, .4, hz - 3.2, .6, .5, .9, 'glass_clear'); m.cube(x, .95, hz - 3.65, .6, .06, .06, 'steel')
        m.cube(x, 0, hz - 3.0, .1, .3, .1, 'tire')
    m.col(3.3, hz - 3.2, 2.2, 1.0, 1.0)
    pendant(m, -3.9, -3.0, Hc - .3, Hc - 1.4, .5, 'glow_cool'); pendant(m, 3.9, 0, Hc - .3, Hc - 1.4, .5, 'glow_cool'); pendant(m, 3.9, -3.0, Hc - .3, Hc - 1.4, .5, 'glow_cool'); pendant(m, -3.9, 3.0, Hc - .3, Hc - 1.4, .5, 'glow_cool')
    strip_lights(m, W, D, Hc - .3, 'glow_cool', 3, 'z', .3)
    for (x, z) in ((hx - .5, hz - .5), (-hx + .5, hz - 4.0)): plant(m, x, z, 1.6)
    for u in (-3.0, 0.0, 3.0): wall_item(m, W, D, 'E', u, 3.0, 1.8, 1.0, 'menu_board') if False else None
    wall_item(m, W, D, 'N', 0, 3.4, 4.0, .9, 'sign_teal'); wall_item(m, W, D, 'N', 0, 3.45, 3.4, .5, 'tile_white')


def library(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Estanterías de pared')
    for i in range(6):
        shelf_unit(m, -hx + .45, -hz + 1.6 + i * 2.15, 2.0, .9, 3.9, 'E', 6, 'books' if i % 2 else 'books2')
    for i in range(5):
        shelf_unit(m, hx - .45, -hz + 1.6 + i * 2.15 + .6, 2.0, .9, 3.9, 'W', 6, 'books2' if i % 2 else 'books')
    for i, x in enumerate((-6.6, -4.4, 4.4, 6.6)):          # contra el fondo, dejando libre la puerta trasera
        shelf_unit(m, x, -hz + .45, 2.0, .9, 3.9, 'S', 6, 'books' if i % 2 else 'books2')
    m.group('Isla de estantes')
    for sx in (-3.6, 3.6):
        shelf_unit(m, sx, -1.0, 2.6, .55, 3.4, 'S', 5, 'books', col=False); shelf_unit(m, sx, -1.55, 2.6, .55, 3.4, 'N', 5, 'books2', col=False)
        m.col(sx, -1.28, 2.6, 1.1, 3.4)
    m.group('Lectura')
    for (x, z) in ((-3.4, 3.0), (3.4, 3.0)):
        table(m, x, z, 2.6, 1.2, h=.9, top='dark_planks')
        for dx in (-.8, .8): m.cube(x + dx, .9, z, .3, .35, .3, 'brass'); m.cube(x + dx, 1.25, z, .36, .22, .36, 'glow'); m.cube(x + dx, .9, z + .3, .5, .04, .4, 'books')
        for dx in (-.8, .8):
            chair(m, x + dx, z + 1.0, 'N', 'cloth_blue'); chair(m, x + dx, z - 1.0, 'S', 'cloth_green')
    m.group('Mostrador y rincón')
    counter(m, -4.6, hz - 1.5, 3.6, 1.0, 'N', h=1.1, top='dark_planks', front='counter_front')
    m.cube(-4.6, 1.1, hz - 1.5, .5, .1, .4, 'metal_dark'); m.cube(-4.6, 1.2, hz - 1.6, .4, .3, .06, 'screen_c')
    for dx in (-.9, .9): m.cube(-4.6 + dx, 1.1, hz - 1.5, .3, .1, .4, 'books')
    m.cube(5.2, 0, hz - 1.5, 1.8, .15, 1.8, 'carpet_red'); sofa(m, 5.2, hz - 1.0, 2.2, 'N', 'sofa_dark'); sofa(m, 6.7, hz - 2.6, 1.6, 'W', 'cloth_red') if False else None
    m.cube(5.2, 0, hz - 3.2, 1.0, .5, .7, 'dark_planks'); m.col(5.2, hz - 3.2, 1.0, .7, .5)
    m.cube(-1.2, 0, 5.0, .7, .9, .7, 'dark_planks'); m.cube(-1.2, .9, 5.0, .6, .6, .6, 'water'); m.cube(-1.2, 1.5, 5.0, .12, .5, .12, 'brass') if False else None
    m.col(-1.2, 5.0, .7, .7, 1.5)
    for (x, z) in ((hx - .5, hz - .5), (-hx + .5, hz - .5)): plant(m, x, z, 1.7)
    m.group('Techo')
    for sx in (-4.0, 4.0): pendant(m, sx, 0, Hc - .3, Hc - 1.8, .9)
    for sx in (-4.0, 4.0): pendant(m, sx, 4.0, Hc - .3, Hc - 1.8, .9)
    pendant(m, 0, -4.0, Hc - .3, Hc - 1.8, .9)
    beams(m, W, D, Hc - .3, 'dark_planks', 2.6)
    rug(m, 0, 2.6, 3.2, 6.0, 'carpet_red')
    wall_item(m, W, D, 'S', -4.8, 2.4, 1.4, 1.1, 'paint_a'); wall_item(m, W, D, 'S', 4.8, 2.4, 1.4, 1.1, 'paint_c')
    wall_item(m, W, D, 'N', 0, 4.4, 3.0, .8, 'menu_board') if False else None


def ramen(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Barra y cocina')
    counter(m, -3.9, -hz + 3.3, 6.2, 1.1, 'S', h=1.1, top='dark_planks', front='wall_wood')
    for i in range(6): stool(m, -6.6 + i * 1.05, -hz + 4.4, .75, 'cushion_red')
    # cocina detrás de la barra
    m.cube(-5.4, 0, -hz + .8, 2.4, 1.0, 1.0, 'steel'); m.cube(-5.4, 1.0, -hz + .8, 2.4, .1, 1.0, 'coal'); m.col(-5.4, -hz + .8, 2.4, 1.0, 1.1)
    for dx in (-.55, .55): m.cube(-5.4 + dx, 1.1, -hz + .8, .8, .55, .8, 'metal_dark'); m.cube(-5.4 + dx, 1.62, -hz + .8, .66, .06, .66, 'soup'); m.cube(-5.4 + dx, 1.65, -hz + .8, .1, .18, .1, 'glow_cool') if False else None
    m.cube(-5.4, 1.1, -hz + .8, .05, .05, .05, 'fire')
    m.cube(-3.0, 0, -hz + .8, 1.8, 1.0, 1.0, 'steel'); m.cube(-3.0, 1.0, -hz + .8, 1.8, .1, 1.0, 'counter_top'); m.col(-3.0, -hz + .8, 1.8, 1.0, 1.1)
    m.cube(-1.5 - 0.0, 0, -hz + .8, .9, 2.1, .9, 'steel') if False else None
    shelf_unit(m, -4.2, -hz + .35, 5.6, .5, 3.0, 'S', 3, 'goods', frame='wall_wood', col=False)
    for i in range(10): m.cube(-6.4 + i * .55, 2.6, -hz + .55, .3, .22, .3, 'bowl_white')
    for i in range(8): m.cube(-6.1 + i * .7, 1.2 + 0, -hz + 3.3 + 0, .0, 0, 0, 'bowl_white') if False else None
    for i in range(4):
        x = -6.0 + i * 1.6
        m.cube(x, 1.1, -hz + 3.3, .32, .16, .32, 'bowl_white'); m.cube(x, 1.26, -hz + 3.3, .26, .03, .26, 'soup'); m.cube(x + .45, 1.1, -hz + 3.2, .06, .02, .3, 'dark_planks')
    m.group('Mesas bajas')
    # plataforma de tatami con mesas bajas
    m.cube(4.6, 0, 0.6, 6.0, .35, 9.0, 'dark_planks'); m.cube(4.6, .35, .6, 5.8, .04, 8.8, 'tatami'); m.col(4.6, .6, 6.0, 9.0, .38)
    for z in (-2.6, .2, 3.0):
        m.cube(4.8, .39, z, 1.5, .4, 1.0, 'dark_planks'); m.cube(4.8, .79, z, 1.6, .06, 1.1, 'oak_planks')
        for dz in (-1.0, 1.0): m.cube(4.8, .39, z + dz, .7, .15, .7, 'cushion_red')
        for dx in (-.9, .9): m.cube(4.8 + dx, .39, z, .7, .15, .7, 'cushion_red')
        m.cube(4.7, .85, z, .28, .1, .28, 'bowl_white'); m.cube(4.7, .95, z, .22, .03, .22, 'soup'); m.cube(5.15, .85, z + .1, .12, .18, .12, 'cloth_cream')
    for z in (-2.6, .2, 3.0):
        m.cube(6.9, .39, z, .12, 2.2, 1.6, 'shoji') if False else None
    m.group('Cortinas y faroles')
    for u in (-2.4, -1.2, 0, 1.2, 2.4):
        m.cube(u, 2.2, hz - .25, 1.0, .8, .05, 'noren') if False else None
    m.cube(0, 2.9, hz - .1, 3.6, .1, .12, 'dark_planks')
    for i in range(6):
        m.cube(-1.5 + i * .6, 2.15, hz - .1, .5, .75, .05, 'noren' if i % 2 == 0 else 'cloth_cream')
    for (x, z) in ((-2.0, 1.0), (-6.0, 1.0), (-2.0, 5.0), (1.0, -3.0), (1.0, 4.0), (6.5, -4.0), (6.5, 4.5)):
        m.cube(x, Hc - 1.9, z, .04, 1.6, .04, 'rope'); m.cube(x, Hc - 2.35, z, .4, .55, .4, 'lantern'); m.cube(x, Hc - 2.35, z, .44, .06, .44, 'dark_planks'); m.cube(x, Hc - 1.84, z, .44, .06, .44, 'dark_planks')
    for u in (-3.5, 0.0, 3.5): wall_item(m, W, D, 'W', u, 2.6, 1.6, 1.1, 'menu_board')
    wall_item(m, W, D, 'E', 0.0, 2.2, 1.4, 1.4, 'paint_b') if False else None
    for u in (-3.0, 3.0): wall_item(m, W, D, 'S', u, 2.4, 1.4, .9, 'poster_c')
    for (x, z) in ((hx - .6, -hz + .6),):
        for k in range(3): m.cube(x - k * .8, 0, z, .7, .9, .7, 'barrel_wood'); m.cube(x - k * .8, .9, z, .72, .08, .72, 'rope')
        m.col(x - .8, z, 2.4, .8, 1.0)
    plant(m, hx - .5, hz - .5, 1.7); plant(m, -hx + .5, hz - .5, 1.7)
    strip_lights(m, W, D, Hc - .3, 'glow_orange', 2, 'z', .18)
    beams(m, W, D, Hc - .3, 'dark_planks', 2.4)


def workshop(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Elevador y auto')
    cx, cz = -3.2, 0.5
    m.cube(cx, 0, cz, 4.4, .25, 2.4, 'metal_dark'); m.cube(cx, .25, cz, 4.2, .1, 2.2, 'hazard')
    for sx in (-1, 1): m.cube(cx + sx * 2.3, 0, cz, .35, 3.8, .35, 'metal'); m.cube(cx + sx * 2.3, 3.8, cz, .5, .2, .5, 'hazard')
    m.cube(cx, 3.8, cz, 4.8, .2, .4, 'metal_dark') if False else None
    ycar = 1.0
    m.cube(cx, ycar + .2, cz, 3.8, .55, 1.8, 'car_red'); m.cube(cx + .2, ycar + .75, cz, 2.0, .55, 1.6, 'car_red'); m.cube(cx + .2, ycar + .8, cz, 1.9, .42, 1.62, 'glass')
    m.cube(cx + 1.95, ycar + .35, cz, .1, .12, 1.6, 'glow'); m.cube(cx - 1.95, ycar + .35, cz, .1, .12, 1.6, 'sign_red')
    for sx in (-1.15, 1.2):
        for sz in (-.95, .95): m.cube(cx + sx, ycar - .1, cz + sz, .7, .7, .22, 'tire'); m.cube(cx + sx, ycar + .05, cz + sz * 1.02, .3, .3, .06, 'steel')
    m.col(cx, cz, 4.4, 2.4, 3.9)
    m.group('Bancos de trabajo')
    for i in range(3):
        x = 2.0 + i * 2.2
        m.cube(x, 0, -hz + .6, 2.0, .95, .9, 'dark_planks'); m.cube(x, .95, -hz + .6, 2.1, .1, 1.0, 'steel'); m.cube(x, .5, -hz + .6, 1.8, .06, .8, 'oak_planks'); m.col(x, -hz + .6, 2.1, 1.0, 1.05)
        m.cube(x + .5, 1.05, -hz + .6, .25, .25, .25, 'metal_dark'); m.cube(x - .5, 1.05, -hz + .5, .5, .18, .3, 'cloth_red')
        pendant(m, x, -hz + 1.5, Hc - .3, Hc - 1.5, .6, 'glow')
    for u in (-6.0, -3.0, 0.0, 3.0): wall_item(m, W, D, 'N', u + 0.0, 1.6, 2.6, 2.4, 'pegboard') if (u > -1.0) else None
    for i in range(4):
        wall_item(m, W, D, 'N', 1.2 + i * 1.5 - 0.0, 2.6, .12, .8, 'steel', out=.07); wall_item(m, W, D, 'N', 1.2 + i * 1.5, 1.9, .5, .12, 'cloth_red', out=.07)
    m.group('Almacén')
    for i in range(3):
        shelf_unit(m, -hx + .45, -hz + 1.3 + i * 2.2, 2.0, .8, 3.0, 'E', 4, 'goods', frame='steel')
    for k in range(4): m.cube(hx - .7, k * .46, hz - 1.2 - 0 * k, 1.1, .46, 1.1, 'tire') if False else None
    for k in range(4): m.cube(hx - .7, k * .46, hz - 1.2, 1.1, .46, 1.1, 'tire')
    m.col(hx - .7, hz - 1.2, 1.1, 1.1, 1.85)
    for k in range(3): m.cube(hx - .7, k * .46, hz - 2.6, 1.1, .46, 1.1, 'tire')
    m.col(hx - .7, hz - 2.6, 1.1, 1.1, 1.4)
    m.cube(hx - 1.0, 0, -hz + 4.2, 1.6, 1.6, 1.0, 'cloth_red'); m.cube(hx - 1.0, 1.6, -hz + 4.2, 1.7, .1, 1.1, 'metal_dark'); m.col(hx - 1.0, -hz + 4.2, 1.7, 1.1, 1.7)
    for k in range(4): m.cube(hx - 1.0, .2 + k * .4, -hz + 3.69, 1.3, .06, .04, 'steel')
    for (x, z) in ((hx - .6, 1.0), (hx - .6, 2.0)): m.cube(x, 0, z, .8, 1.0, .8, 'barrel_wood'); m.cube(x, 1.0, z, .84, .06, .84, 'metal_dark'); m.col(x, z, .8, .8, 1.06)
    m.cube(-hx + 1.4, 0, hz - 1.2, 1.4, 1.6, .9, 'steel'); m.cube(-hx + 1.4, 1.6, hz - 1.2, 1.2, .5, .7, 'tank') if False else None
    m.cube(-hx + 1.2, .9, hz - 1.2, 1.4, .9, .9, 'tank'); m.cube(-hx + 1.2, 0, hz - 1.2, 1.6, .3, 1.0, 'metal_dark'); m.cube(-hx + 1.2, 1.8, hz - 1.2, .3, .3, .3, 'metal_dark')
    m.col(-hx + 1.2, hz - 1.2, 1.6, 1.0, 2.1)
    m.cube(2.0, 0, hz - 2.4, .9, .6, .6, 'metal_dark'); m.cube(2.0, .6, hz - 2.4, .5, .15, .35, 'steel'); m.col(2.0, hz - 2.4, .9, .6, .8)
    m.cube(3.8, 0, hz - 2.4, .6, 1.1, .6, 'cloth_red'); m.cube(3.8, 1.1, hz - 2.4, .65, .1, .65, 'metal_dark'); m.col(3.8, hz - 2.4, .65, .65, 1.2)
    for z in (-hz + .3, hz - .3):
        pass
    m.cube(0, 0.0, 0, 1.0, .02, 1.0, 'hazard') if False else None
    for u in (-4.5, 0.0, 4.5): m.cube(u, 0.0, 0.0, .01, .0, .0, 'hazard') if False else None
    wall_item(m, W, D, 'W', 0, 2.2, 3.0, 1.2, 'poster_c'); wall_item(m, W, D, 'S', -4.5, 2.4, 1.4, 1.0, 'poster_a')
    strip_lights(m, W, D, Hc - .3, 'glow', 3, 'z', .26)
    beams(m, W, D, Hc - .3, 'steel', 3.4)


def mall(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Fuente central')
    m.cube(0, 0, 0, 4.4, .6, 4.4, 'stone'); m.cube(0, .6, 0, 3.8, .1, 3.8, 'water'); m.cube(0, .6, 0, .7, 1.6, .7, 'stone_light'); m.cube(0, 2.2, 0, 1.6, .2, 1.6, 'stone')
    m.cube(0, 2.4, 0, 1.0, .12, 1.0, 'water'); m.cube(0, 2.4, 0, .16, .7, .16, 'glass_clear')
    m.col(0, 0, 4.4, 4.4, 1.2)
    m.group('Locales')
    tiles = [('goods', 'awn_red'), ('wool_pink', 'awn_blue'), ('goods', 'awn_green'), ('books', 'awn_gold')]
    for sx in (-1, 1):
        for i, z in enumerate((-4.2, -1.4, 1.4, 4.2)) if False else enumerate((-3.6, 0.0, 3.6)):
            x = sx * (hx - 1.3)
            m.cube(x + sx * .3, 0, z, 2.2, .12, 3.0, 'oak_planks') if False else None
            m.cube(sx * (hx - .45), 0, z, .6, 3.2, 3.4, 'stone_dark') if False else None
            # fondo del local: estantes y mostrador
            shelf_unit(m, sx * (hx - .35), z, 3.0, .6, 2.8, 'W' if sx > 0 else 'E', 4, tiles[i % 4][0] if tiles[i % 4][0] in ('goods', 'books') else 'goods', col=False)
            m.col(sx * (hx - .35), z, .6, 3.0, 2.8)
            counter(m, sx * (hx - 2.2), z, 1.0, 2.2, 'W' if sx > 0 else 'E', h=1.0)
            m.cube(sx * (hx - 3.2), 0, z, .15, 4.0, 3.5, 'stone_light') if False else None
            # pilares y marquesina del local
            for dz in (-1.75, 1.75): m.cube(sx * (hx - 3.5), 0, z + dz, .35, 3.6, .35, 'marble')
            m.cube(sx * (hx - 3.5), 3.6, z, .5, .1, 3.9, 'gold'); m.cube(sx * (hx - 3.5), 3.7, z, .5, .6, 3.9, 'sign_dark'); m.cube(sx * (hx - 3.6), 3.8, z, .16, .35, 3.0, 'neon_yellow' if i % 2 else 'neon_cyan')
            m.cube(sx * (hx - 3.9), 3.2, z, 1.0, .1, 3.5, tiles[(i + (0 if sx < 0 else 2)) % 4][1])
    m.group('Mobiliario')
    for z in (-5.2, 5.2):
        for sx in (-1, 1):
            x = sx * 3.8
            m.cube(x, 0, z, 2.4, .5, .7, 'dark_planks'); m.cube(x, .5, z - .25, 2.4, .6, .12, 'dark_planks'); m.cube(x, .45, z, 2.2, .06, .65, 'cloth_red'); m.col(x, z, 2.4, .8, .9)
    for (x, z) in ((-hx + 1.5, hz - .7), (hx - 1.5, hz - .7), (-hx + 1.5, -hz + .7), (hx - 1.5, -hz + .7)): plant(m, x, z, 2.3)
    for (x, z) in ((-7.0, 2.4), (-7.0, -2.4), (7.0, 2.4), (7.0, -2.4)):
        pass
    # patio de comidas
    for (x, z) in ((-8.0, hz - 2.2), (-5.0, hz - 2.2), (5.0, hz - 2.2), (8.0, hz - 2.2)):
        round_table(m, x, z, .6)
        chair(m, x - .9, z, 'E', 'cloth_blue'); chair(m, x + .9, z, 'W', 'cloth_blue'); chair(m, x, z - .9, 'S', 'cloth_cream') if False else None
        m.cube(x, 2.4, z, .06, .0, .06, 'metal_dark') if False else None
    for sx in (-1, 1):                      # directorio
        m.cube(sx * 2.6, 0, hz - .6, .2, 2.2, .2, 'metal_dark') if False else None
    m.cube(0, 0, -hz + .6, 1.8, 2.2, .2, 'metal_dark'); m.cube(0, .2, -hz + .72, 1.6, 1.8, .05, 'menu_board'); m.col(0, -hz + .6, 1.8, .3, 2.2) if False else None
    m.group('Claraboyas')
    for i in range(5):
        x = -W / 2 + 4.0 + i * (W - 8.0) / 4
        m.cube(x, Hc - .32, 0, 1.6, .04, D - 2 * T - 1.6, 'glow_cool')
    for i in range(4):
        m.cube(0, Hc - .55, -D / 2 + 2.0 + i * 3.0, W - 2 * T, .25, .3, 'steel')
    for x in (-5.0, 5.0): pendant(m, x, 0, Hc - .3, Hc - 2.0, 1.1, 'glow')
    rug(m, 0, 0, 7.0, 7.0, 'marble', 'gold') if False else None
    wall_item(m, W, D, 'N', -8.0, 3.2, 4.4, 1.0, 'neon_yellow') if False else None


def lobby(m, rng, W, D, Hc):
    hx, hz = W / 2 - T, D / 2 - T
    m.group('Columnas')
    for sx in (-1, 1):
        for z in (-3.6, 0.6, 4.8):
            x = sx * 7.4
            m.cube(x, 0, z, 1.0, .4, 1.0, 'stone'); m.cube(x, .4, z, .8, Hc - .9, .8, 'marble'); m.cube(x, Hc - .5, z, 1.0, .2, 1.0, 'gold'); m.cube(x, .4, z, .9, .15, .9, 'gold')
            m.col(x, z, 1.0, 1.0, Hc)
    m.group('Recepción')
    counter(m, 0, 2.0, 7.0, 1.4, 'S', h=1.2, top='marble', front='stone_light')
    m.cube(0, 1.2, 1.8, 7.0, .2, .1, 'gold') if False else None
    m.cube(0, 0, 2.0, 7.0, .08, 1.5, 'gold')
    for dx in (-2.0, 2.0): m.cube(dx, 1.2, 1.9, .6, .4, .08, 'screen_c'); m.cube(dx, 1.2, 1.9, .5, .4, .5, 'metal_dark') if False else None
    wall_item(m, W, D, 'N', 0, 3.3, 7.0, .8, 'gold') if False else None
    m.cube(0, 1.5, 1.4, 1.2, .3, .15, 'glow_warm') if False else None
    m.cube(0, 2.6, 1.7, 3.0, 1.0, .16, 'sign_dark') if False else None
    m.group('Ascensores')
    for i, x in enumerate((-4.4, 0.0, 4.4)):
        m.cube(x, 0, -hz + .05, 2.6, 3.4, .1, 'elev_door'); m.cube(x, 3.4, -hz + .05, 3.0, .3, .16, 'gold')
        m.cube(x, 3.1, -hz + .17, .9, .2, .06, 'neon_green' if i == 1 else 'glow');
        for sg in (-1, 1): m.cube(x + sg * 1.45, 0, -hz + .08, .3, 3.5, .16, 'gold')
    m.cube(0, 0, -hz + .45, 14.0, .3, .8, 'stone') if False else None
    m.group('Sala de espera')
    for z in (-3.4, 3.8):
        sofa(m, -5.2 if False else -hx + 2.4, z, 3.0, 'E', 'sofa_dark'); sofa(m, hx - 2.4, z, 3.0, 'W', 'sofa_dark')
        m.cube(-hx + 3.9 if False else -hx + 4.2, 0, z, 1.2, .5, 1.2, 'marble'); m.col(-hx + 4.2, z, 1.2, 1.2, .5)
        m.cube(hx - 4.2, 0, z, 1.2, .5, 1.2, 'marble'); m.col(hx - 4.2, z, 1.2, 1.2, .5)
    for (x, z) in ((-hx + .6, hz - .6), (hx - .6, hz - .6), (-hx + .6, -hz + .6), (hx - .6, -hz + .6), (-2.8, -hz + .8), (2.8, -hz + .8)): plant(m, x, z, 2.1)
    m.group('Lámpara')
    for dx, dz in ((0, 0), (-1.2, 0), (1.2, 0), (0, -1.2), (0, 1.2)):
        m.cube(dx, Hc - 2.4, dz, .5, .5, .5, 'glow'); m.cube(dx, Hc - 1.4, dz, .04, 1.1, .04, 'gold')
    m.cube(0, Hc - 2.0, 0, 3.2, .1, 3.2, 'gold') if False else None
    rug(m, 0, -.5, 3.6, 12.0, 'carpet_red', 'gold')
    wall_item(m, W, D, 'N', -7.8, 2.6, 1.8, 2.4, 'paint_a'); wall_item(m, W, D, 'N', 7.8, 2.6, 1.8, 2.4, 'paint_b')
    wall_item(m, W, D, 'E', 0, 2.6, 4.0, 2.2, 'paint_c'); wall_item(m, W, D, 'W', 0, 2.6, 4.0, 2.2, 'paint_c')
    strip_lights(m, W, D, Hc - .3, 'glow', 3, 'z', .3)
    beams(m, W, D, Hc - .3, 'gold', 4.0)


# nombre -> (función de mobiliario, W, D, Hc, H, pared, interior, suelo, techo, marco, alféizar, ancho/alto ventana, toldo, cartel)
SPECS = [
    ('cafe',     cafe,     13, 13, 4.8, 8.0,  'pl_peach',  'wallpaper_cream', 'checker',       'ceil_white', 'trim_white', 'awn_red',   'sign_teal'),
    ('arcade',   arcade,   13, 13, 4.8, 7.2,  'pl_rose',   'wallpaper_dark',  'carpet_arcade', 'ceil_dark',  'trim_white', 'awn_blue',  'sign_dark'),
    ('mercado',  market,   13, 13, 4.8, 7.2,  'pl_mint',   'wall_sand',       'tile_white',    'ceil_white', 'trim_white', 'awn_green', 'sign_teal'),
    ('biblioteca', library, 16, 14, 5.4, 8.4, 'pl_lilac',  'wall_wood',       'oak_planks',    'ceil_wood',  'trim_white', 'awn_gold',  'sign_dark'),
    ('ramen',    ramen,    16, 14, 4.8, 7.5,  'pl_orange', 'wall_red',        'oak_planks',    'ceil_wood',  'trim_white', 'awn_red',   'sign_red'),
    ('taller',   workshop, 14, 14, 5.0, 7.0,  'pl_sage',   'wall_sand',       'garage_floor',  'ceil_white', 'trim_white', 'awn_gold',  'sign_dark'),
    ('centro_comercial', mall, 28, 13, 6.0, 9.5, 'pl_yellow', 'wall_sand',    'marble',        'ceil_white', 'trim_white', 'awn_blue',  'sign_dark'),
    ('torre_aurora', lobby, 22, 14, 6.5, 46.0, 'pl_gray',  'wall_sand',       'marble',        'ceil_white', 'trim_stone', None,        'sign_dark'),
]


def tower_top(m, W, D, H):
    """Columnas doradas en las esquinas, cornisas, cuarto de máquinas y pararrayos con baliza (la azotea queda libre para el ascensor)."""
    m.group('Torre')
    for sx in (-1, 1):
        for sz in (-1, 1): m.cube(sx * (W / 2 + .05), 0, sz * (D / 2 + .05), .8, H, .8, 'gold')
    for y in range(7, int(H) - 1, 6): m.cube(0, y, 0, W + .5, .4, D + .5, 'trim_white')
    m.cube(0, H + .1, 0, W * .5, 1.6, D * .4, 'concrete_dark'); m.cube(0, H + 1.7, 0, W * .3, 1.2, D * .3, 'metal')
    m.cube(W * .25, H + .1, -D * .2, .2, 12.5, .2, 'steel'); m.cube(W * .25, H + 12.6, -D * .2, .5, .5, .5, 'lantern')
    for k in range(3): m.cube(W * .25, H + 3 + k * 2.8, -D * .2, 1.0 - k * .25, .08, .08, 'steel')


def build_all(tex_source):
    info = {}
    for i, (name, fn, W, D, Hc, H, wall, inner, floor, ceil, trim, awn, board) in enumerate(SPECS):
        rng = random.Random(100 + i)
        m = Model(name)
        glass_t = 'glass_dark' if name == 'torre_aurora' else 'glass'
        shell(m, rng, W, D, Hc, H, wall=wall, inner=inner, floor=floor, ceil=ceil, trim=trim, glass_t=glass_t, awn=awn, board=board,
              ww=2.6 if W > 20 else 2.4, upper_ww=1.5 if name != 'torre_aurora' else 1.9,
              floor_h=3.6 if name == 'torre_aurora' else 2.9,
              roof_kw=dict(ac=0, antenna=False, dish=False) if name == 'torre_aurora' else None)
        fn(m, rng, W, D, Hc)
        if name == 'torre_aurora': tower_top(m, W, D, H)
        m.W, m.D, m.H = W, D, H
        n = m.save(tex_source)
        info[name] = {'w': W, 'd': D, 'h': H, 'base': round(Hc - .3, 2), 'door': DW, 'cubos': n}
        print(f'{name:18s} {W:>4.0f} x {D:>3.0f} x {H:>5.1f}   {n} cubos')
    return info
