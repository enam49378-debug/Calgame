"""Modelos de la costa (palmeras, sombrillas, torre de salvavidas, chiringuito, barcas, muelle, faro, rocas...) como proyectos de Blockbench.
1 bloque (16 px) = 1 metro. Los cubos del grupo `colision` son obstáculos invisibles en el juego."""
import math, random
from gen_edificios import Model


def palmera(m, rng):
    m.group('Tronco')
    n = 9
    x = z = 0.0
    top = 0
    for i in range(n):
        w = .58 - i * .02
        bx = .38 * math.sin(i * .36)
        m.cube(bx, i * .78, 0, w, .8, w, 'bark')
        if i % 2 == 0:
            m.cube(bx, i * .78 + .55, 0, w + .06, .1, w + .06, 'dark_planks')
        top = i * .78 + .8
        x = bx
    m.col(.1, 0, .6, .6, 7.0)
    m.group('Copa')
    for k in range(9):
        yaw = k * 40 + rng.uniform(-8, 8)
        L = 3.6 + rng.uniform(-.3, .3)
        t = 22 + rng.uniform(0, 16)
        dx, dz = math.sin(math.radians(yaw)), math.cos(math.radians(yaw))
        h = L / 2 * math.cos(math.radians(t))
        v = L / 2 * math.sin(math.radians(t))
        m.cube(x + dx * h, top - v + .15, dz * h, .95, .07, L, 'palm_leaf', rot=[t, yaw, 0])
    for k in range(5):
        yaw = k * 72 + 20
        L = 2.4
        t = 8
        dx, dz = math.sin(math.radians(yaw)), math.cos(math.radians(yaw))
        h = L / 2 * math.cos(math.radians(t))
        m.cube(x + dx * h, top + .3, dz * h, .8, .06, L, 'palm_leaf', rot=[t, yaw, 0])
    for sx, sz in ((.2, .2), (-.2, .15), (0, -.25)):
        m.cube(x + sx, top - .45, sz, .3, .3, .3, 'wood')


def sombrilla(m, rng, tile, towel):
    m.group('Sombrilla')
    m.cube(0, 0, 0, .09, 2.55, .09, 'oak_planks')
    m.cube(0, 2.25, 0, 3.2, .1, 3.2, tile)
    m.cube(0, 2.35, 0, 2.4, .1, 2.4, tile)
    m.cube(0, 2.45, 0, 1.5, .1, 1.5, tile)
    m.cube(0, 2.55, 0, .35, .22, .35, 'trim_white')
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        m.cube(sx * 1.55, 2.12, sz * 1.55, 3.2 if sz == -1 and False else .08, .14, .08, tile)
    m.group('Tumbonas')
    for sx in (-1, 1):
        x = sx * 1.4
        m.cube(x, .22, 1.15, .75, .1, 1.55, 'oak_planks')
        for lx in (-.3, .3):
            for lz in (.5, 1.8):
                m.cube(x + lx, 0, lz, .08, .24, .08, 'dark_planks')
        m.cube(x, .3, 1.0, .68, .09, 1.2, towel)
        m.cube(x, .42, 0.35, .68, .09, .85, towel, rot=[-48, 0, 0])
    m.cube(0, 0, 1.7, .5, .45, .5, 'oak_planks')
    m.cube(0, .45, 1.7, .52, .05, .52, 'trim_white')
    m.cube(.1, .5, 1.75, .12, .22, .12, 'hull_blue')
    m.cube(-.1, .5, 1.65, .12, .18, .12, 'sign_red')
    m.group('Toalla')
    m.cube(0, .0, 3.0, 1.3, .02, 1.8, towel)
    m.cube(0, .02, 3.0, 1.1, .01, 1.6, 'trim_white')


def torre_salvavidas(m, rng):
    m.group('Soportes')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * 1.5, 0, sz * 1.5, .24, 2.7, .24, 'oak_planks')
            m.col(sx * 1.5, sz * 1.5, .26, .26, 2.7)
    for sx in (-1, 1):
        m.cube(sx * 1.5, .9, 0, .1, .1, 3.2, 'oak_planks')
    for sz in (-1, 1):
        m.cube(0, 1.3, sz * 1.5, 3.2, .1, .1, 'oak_planks')
        m.cube(0, .7, sz * 1.5, 3.2, .1, .1, 'oak_planks')
    m.group('Cabina')
    m.cube(0, 2.6, 0, 3.8, .2, 3.8, 'dark_planks')
    m.cube(0, 2.8, -.3, 3.0, 2.2, 2.6, 'trim_white')
    m.cube(0, 3.65, -.3, 3.06, .5, 2.66, 'sign_red')
    m.cube(0, 3.2, 1.0, 2.0, 1.1, .08, 'glass')
    m.cube(0, 3.2, 1.05, 2.1, .08, .06, 'trim_white'); m.cube(0, 4.3, 1.05, 2.1, .08, .06, 'trim_white')
    m.cube(0, 5.0, -.2, 4.2, .22, 3.4, 'sign_red'); m.cube(0, 5.22, -.2, 3.2, .18, 2.6, 'sign_red')
    m.cube(0, 4.98, 1.6, 4.2, .08, .08, 'trim_white')
    m.cube(-1.55, 2.8, 1.95, .1, 1.0, .1, 'oak_planks'); m.cube(1.55, 2.8, 1.95, .1, 1.0, .1, 'oak_planks')
    m.cube(0, 3.8, 1.95, 3.2, .08, .08, 'oak_planks'); m.cube(0, 3.3, 1.95, 3.2, .06, .06, 'oak_planks')
    m.group('Escalera')
    for i in range(8):
        m.cube(1.0, 0, 2.0 + (7 - i) * .42, 1.2, (i + 1) * .33, .4, 'oak_planks')
    m.cube(1.62, .6, 3.8, .08, 1.0, .08, 'oak_planks'); m.cube(.38, .6, 3.8, .08, 1.0, .08, 'oak_planks')
    m.group('Detalles')
    m.cube(1.4, 5.3, -1.2, .1, 2.8, .1, 'steel')
    m.cube(2.0, 7.2, -1.2, 1.1, .7, .04, 'sign_red'); m.cube(2.0, 7.3, -1.2, .4, .5, .05, 'trim_white')
    m.cube(-1.0, 2.9, 1.1, .7, .7, .1, 'sign_red'); m.cube(-1.0, 3.05, 1.12, .4, .4, .1, 'trim_white')
    m.cube(-1.0, 3.2, 1.14, .16, .16, .1, 'sign_red')
    m.cube(-1.3, 2.8, 1.5, 1.4, .1, .4, 'oak_planks')


def chiringuito(m, rng):
    m.group('Tarima')
    m.cube(0, 0, 0, 9.4, .1, 6.6, 'oak_planks')
    m.group('Estructura')
    for sx in (-1, 1):
        for sz in (-1, 0, 1):
            m.cube(sx * 4.3, 0, sz * 2.8, .28, 3.3, .28, 'bark')
    m.col(-4.3, -2.8, .3, .3, 3.3); m.col(4.3, -2.8, .3, .3, 3.3); m.col(-4.3, 2.8, .3, .3, 3.3); m.col(4.3, 2.8, .3, .3, 3.3)
    m.cube(0, 3.3, 0, 9.4, .2, .22, 'bark')
    for sz in (-1, 1): m.cube(0, 3.3, sz * 2.8, 9.4, .2, .22, 'bark')
    m.group('Techo de paja')
    m.cube(0, 3.45, 0, 10.4, .2, 7.6, 'thatch'); m.cube(0, 3.65, 0, 9.0, .2, 6.4, 'thatch'); m.cube(0, 3.85, 0, 7.4, .2, 5.0, 'thatch')
    m.cube(0, 4.05, 0, 5.6, .2, 3.8, 'thatch'); m.cube(0, 4.25, 0, 3.6, .2, 2.6, 'thatch'); m.cube(0, 4.45, 0, 1.6, .2, 1.4, 'thatch')
    for i in range(12): m.cube(-5.0 + i * .9, 3.2, 3.82, .26, .26, .26, 'thatch')
    m.group('Barra')
    m.cube(0, .1, 0.6, 7.4, 1.05, 1.0, 'dark_planks'); m.cube(0, .1, 1.12, 7.4, 1.0, .06, 'counter_front')
    m.cube(0, 1.15, 0.6, 7.8, .1, 1.3, 'oak_planks')
    m.col(0, .6, 7.8, 1.2, 1.2)
    for i in range(6):
        sx = -3.0 + i * 1.2
        m.cube(sx, 0.1, 1.9, .1, .65, .1, 'metal_dark'); m.cube(sx, .75, 1.9, .5, .1, .5, ['sign_red', 'awn_blue', 'wool_yellow'][i % 3]); m.cube(sx, .1, 1.9, .4, .05, .4, 'metal_dark')
        m.col(sx, 1.9, .5, .5, .85)
    for i in range(5): m.cube(-2.8 + i * 1.4, 1.25, 0.5, .14, .32, .14, ['hull_blue', 'sign_red', 'wool_green', 'wool_yellow', 'hull_white'][i])
    m.group('Trasera')
    m.cube(0, .1, -2.8, 9.4, 2.9, .3, 'wall_wood')
    m.cube(0, 1.3, -2.6, 7.2, 1.5, .06, 'goods')
    for y in (1.2, 1.7, 2.2): m.cube(0, y, -2.55, 7.4, .08, .3, 'dark_planks')
    m.cube(-3.8, .1, -2.0, 1.1, 2.1, .8, 'steel'); m.cube(-3.8, .3, -1.59, .95, 1.7, .05, 'fridge'); m.col(-3.8, -2.0, 1.1, .8, 2.1)
    m.cube(3.6, 2.3, -2.55, 1.8, .8, .06, 'menu_board')
    m.group('Letrero y luces')
    m.cube(0, 2.6, 3.05, 4.6, .9, .14, 'sign_dark'); m.cube(0, 2.72, 3.14, 4.2, .66, .06, 'sign_gold')
    for i in range(14): m.cube(-4.5 + i * .7, 3.0, 3.1, .13, .13, .13, 'glow')
    m.group('Tablas de surf')
    for k, tl in enumerate(('hull_blue', 'sign_red', 'wool_yellow')):
        m.cube(4.95, .1, -1.3 + k * .75, .5, 2.6, .09, tl, rot=[0, 0, -9])
        m.cube(4.95, 1.1, -1.3 + k * .75, .08, 1.0, .1, 'trim_white', rot=[0, 0, -9])
    m.group('Mesas')
    for sx in (-3.5, 3.5):
        m.cube(sx, .0, 3.9, 1.2, .8, 1.2, 'oak_planks') if False else None


def barca(m, rng, tile):
    m.group('Casco')
    m.cube(0, 0, 0, 1.0, .12, 3.4, tile)
    for sx in (-1, 1):
        m.cube(sx * .54, .1, 0, .12, .52, 3.6, tile)
        m.cube(sx * .42, .1, 2.05, .12, .5, .8, tile, rot=[0, sx * 24, 0])
        m.cube(sx * .54, .54, 0, .16, .08, 3.6, 'trim_white')
    m.cube(0, .1, 2.35, .24, .5, .3, tile)
    m.cube(0, .1, -1.85, 1.2, .52, .14, tile)
    m.group('Interior')
    for z in (-.9, .1, 1.0): m.cube(0, .38, z, 1.0, .08, .36, 'oak_planks')
    m.cube(0, .12, 0, .8, .04, 3.1, 'dark_planks')
    m.group('Remos')
    for sx in (-1, 1):
        m.cube(sx * .85, .55, .1, 1.5, .06, .06, 'oak_planks', rot=[0, 0, sx * 12]); m.cube(sx * 1.55, .6, .1, .5, .05, .2, 'oak_planks')


def velero(m, rng):
    m.group('Casco')
    m.cube(0, 0, 0, 1.6, .15, 5.4, 'hull_white')
    for sx in (-1, 1):
        m.cube(sx * .85, .1, -.2, .14, .7, 5.4, 'hull_white'); m.cube(sx * .85, .62, -.2, .18, .1, 5.4, 'hull_blue')
        m.cube(sx * .62, .1, 3.0, .14, .65, 1.2, 'hull_white', rot=[0, sx * 25, 0])
    m.cube(0, .1, 3.6, .3, .6, .4, 'hull_white'); m.cube(0, .1, -2.95, 1.7, .7, .16, 'hull_white')
    m.cube(0, .5, 1.6, 1.4, .08, 2.0, 'oak_planks')
    m.group('Mástil y vela')
    m.cube(0, .1, 1.0, .14, 6.8, .14, 'oak_planks')
    m.cube(0, 1.3, -.6, .1, .1, 3.4, 'oak_planks')
    for i in range(11):
        L = 3.4 - i * .3
        m.cube(0, 1.45 + i * .5, 1.0 - 1.0 - L / 2 + .45 if False else -.1 - L / 2 + .55, .05, .5, L, 'sail')
    m.cube(0, 6.9, 1.0, .5, .3, .04, 'sign_red')
    m.cube(0, 1.0, -2.0, .06, 2.0, .06, 'steel')
    m.group('Cabina')
    m.cube(0, .7, 2.4, 1.2, .5, 1.1, 'hull_blue'); m.cube(0, 1.2, 2.4, 1.3, .08, 1.2, 'trim_white'); m.cube(0, .85, 2.97, .8, .22, .05, 'glass')


def muelle(m, rng):
    L, Wd = 34.0, 4.4
    m.group('Cubierta')
    z = 0.0
    while z < L - .01:
        d = min(4.0, L - z)
        m.cube(0, -.07, z + d / 2, Wd, .12, d, 'oak_planks')
        for k in range(int(d / 1.0)):
            m.cube(0, .04, z + .5 + k * 1.0 + 0.0, Wd, .02, .04, 'dark_planks')
        z += d
    m.cube(0, -.07, L + 3.0, 9.0, .12, 6.0, 'oak_planks')
    m.group('Pilotes y barandas')
    for i in range(0, int(L / 3) + 3):
        zz = i * 3.0 + .3
        for sx in (-1, 1):
            m.cube(sx * 1.95, -2.0, zz, .3, 2.0, .3, 'bark')
            m.cube(sx * 2.15, -.0, zz, .14, 1.1, .14, 'oak_planks')
    for sx in (-1, 1):
        m.cube(sx * 2.15, 1.0, L / 2, .12, .1, L, 'oak_planks'); m.cube(sx * 2.15, .55, L / 2, .06, .06, L, 'oak_planks')
        m.col(sx * 2.2, L / 2, .22, L, 1.15)
    m.cube(0, 1.0, L + 6.0, 9.0, .1, .12, 'oak_planks'); m.cube(0, .55, L + 6.0, 9.0, .06, .06, 'oak_planks')
    for sx in (-1, 1):
        m.cube(sx * 4.5, 1.0, L + 3.0, .12, .1, 6.0, 'oak_planks'); m.cube(sx * 4.5, .55, L + 3.0, .06, .06, 6.0, 'oak_planks')
        for zz in (L + .5, L + 2.5, L + 4.5, L + 6.0): m.cube(sx * 4.5, 0, zz, .14, 1.1, .14, 'oak_planks')
        m.col(sx * 4.5, L + 3.0, .2, 6.0, 1.15)
    m.col(0, L + 6.0, 9.0, .2, 1.15)
    for zz in (L + 1, L + 3, L + 5): m.cube(0, -.0, zz, 8.8, .0, .0, 'oak_planks') if False else None
    m.group('Farolas y bancos')
    for zz in (4.0, 12.0, 20.0, 28.0):
        for sx in (-1, 1):
            m.cube(sx * 2.15, 0, zz, .12, 2.3, .12, 'metal_dark'); m.cube(sx * 2.15, 2.3, zz, .34, .34, .34, 'glow')
    for sx in (-1, 1):
        m.cube(sx * 4.3, 0, L + 5.0, .12, 2.3, .12, 'metal_dark'); m.cube(sx * 4.3, 2.3, L + 5.0, .34, .34, .34, 'glow')
    for sx in (-3.0, 3.0):
        m.cube(sx, .0, L + 3.2, 1.8, .45, .5, 'oak_planks'); m.cube(sx, .45, L + 3.45, 1.8, .6, .1, 'oak_planks')
        m.col(sx, L + 3.3, 1.8, .6, 1.0)
    m.cube(0, 0, L + 5.6, .5, .5, .5, 'barrel_wood'); m.cube(1.5, 0, L + 5.6, .5, .5, .5, 'rope'); m.cube(-1.5, 0, L + 5.6, .5, .5, .5, 'rope')
    m.cube(2.15, .0, L / 2 + 6, .5, .36, .5, 'sign_red') if False else None
    m.group('Cartel')
    m.cube(0, 2.9, 0.2, 4.8, .8, .14, 'sign_dark'); m.cube(-2.15, 0, 0.2, .14, 2.9, .14, 'bark'); m.cube(2.15, 0, 0.2, .14, 2.9, .14, 'bark')
    m.cube(0, 3.0, 0.3, 4.2, .6, .06, 'sign_gold')


def faro(m, rng):
    m.group('Rocas')
    for (x, z, w, d, h) in ((0, 0, 9, 9, 1.6), (-2.5, 1.5, 5, 5, 2.2), (2.8, -2.2, 4.5, 4.5, 2.6), (3.5, 3.0, 3.5, 3.2, 1.5), (-3.8, -3.0, 3.0, 3.4, 1.9)):
        m.cube(x, 0, z, w, h, d, 'rock')
        m.cube(x, h, z, w * .6, .5, d * .6, 'rock_dark')
    m.col(0, 0, 9, 9, 2.0)
    m.group('Torre')
    y = 1.8
    for i in range(9):
        w = 4.4 - i * .22
        m.cube(0, y, 0, w, 2.0, w, 'hull_white' if i % 2 == 0 else 'sign_red')
        for sx in (-1, 1):
            m.cube(sx * (w / 2 + .02), y + .8, 0, .06, .7, .4, 'glass_dark') if i % 2 == 0 else None
        y += 2.0
    m.cube(0, 1.8, 2.2, 1.0, 1.9, .1, 'door_navy')
    m.col(0, 0, 4.4, 4.4, 20.0)
    m.group('Linterna')
    m.cube(0, y, 0, 4.2, .25, 4.2, 'metal_dark')
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1)): m.cube(sx * 1.95, y, sz * 1.95, .12, 2.4, .12, 'metal_dark'); m.cube(sx * 1.95, y + .25, sz * 1.95, .1, .9, .1, 'metal_dark')
    m.cube(0, y + .25, 2.05, 3.6, .1, .1, 'metal_dark'); m.cube(0, y + .25, -2.05, 3.6, .1, .1, 'metal_dark')
    for sx in (-1, 1): m.cube(sx * 2.05, y + .25, 0, .1, .1, 3.6, 'metal_dark')
    m.cube(0, y + .25, 0, 3.7, 1.9, 3.7, 'glass')
    m.cube(0, y + .6, 0, 1.4, 1.2, 1.4, 'glow'); m.cube(0, y + .5, 0, 1.0, 1.6, 1.0, 'neon_yellow')
    m.cube(0, y + 2.15, 0, 4.4, .3, 4.4, 'sign_red'); m.cube(0, y + 2.45, 0, 3.2, .3, 3.2, 'sign_red'); m.cube(0, y + 2.75, 0, 2.0, .3, 2.0, 'sign_red'); m.cube(0, y + 3.05, 0, .8, .4, .8, 'metal_dark')


def rocas(m, rng, seed):
    r = random.Random(seed)
    m.group('Rocas')
    for i in range(6):
        w, d, h = r.uniform(1.0, 3.0), r.uniform(1.0, 2.6), r.uniform(.8, 2.4)
        x, z = r.uniform(-2.5, 2.5), r.uniform(-2, 2)
        m.cube(x, 0, z, w, h, d, 'rock' if i % 3 else 'rock_dark')
        m.cube(x + .1, h, z, w * .6, .3, d * .6, 'rock')
        m.col(x, z, w, d, h + .3)


def castillo(m, rng):
    m.group('Castillo')
    m.cube(0, 0, 0, 1.8, .45, 1.8, 'sand'); m.cube(0, .45, 0, 1.4, .3, 1.4, 'sand')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * .75, 0, sz * .75, .5, 1.1, .5, 'sand'); m.cube(sx * .75, 1.1, sz * .75, .6, .15, .6, 'sand')
    m.cube(0, .75, 0, .8, .8, .8, 'sand'); m.cube(0, 1.55, 0, .5, .15, .5, 'sand')
    m.cube(0, 1.7, 0, .05, .6, .05, 'trim_white'); m.cube(.15, 2.1, 0, .3, .2, .03, 'sign_red')
    m.cube(0, 0, 1.3, .6, .1, .8, 'wet_sand')


def voley(m, rng):
    m.group('Red')
    for sx in (-1, 1):
        m.cube(sx * 4.6, 0, 0, .14, 2.45, .14, 'steel'); m.col(sx * 4.6, 0, .2, .2, 2.45)
    m.cube(0, 1.65, 0, 9.0, .9, .03, 'vent'); m.cube(0, 2.5, 0, 9.0, .08, .06, 'trim_white'); m.cube(0, 1.6, 0, 9.0, .06, .06, 'trim_white')
    m.group('Cancha')
    for (x, z, w, d) in ((0, 8.5, 9.0, .1), (0, -8.5, 9.0, .1), (-4.5, 0, .1, 17.1), (4.5, 0, .1, 17.1), (0, 0, 9.0, .1), (0, 3, 9.0, .1), (0, -3, 9.0, .1)):
        m.cube(x, 0, z, w, .02, d, 'trim_white')
    m.cube(-4.6, .0, 0.0, .3, .0, .3, 'sand') if False else None


def caseta(m, rng, tile, roof):
    m.group('Caseta')
    m.cube(0, 0, 0, 2.6, 2.5, 2.6, tile)
    m.cube(0, .0, 1.31, 1.0, 2.0, .06, 'door_navy')
    m.cube(0, 1.4, 1.35, .2, .1, .06, 'gold') if False else None
    for sx in (-1, 1): m.cube(sx * 1.31, 1.1, 0, .06, .8, .9, 'glass')
    m.cube(0, 2.5, 0, 3.2, .16, 3.2, roof); m.cube(0, 2.66, 0, 2.4, .16, 2.4, roof); m.cube(0, 2.82, 0, 1.6, .16, 1.6, roof); m.cube(0, 2.98, 0, .8, .16, .8, roof)
    m.col(0, 0, 2.7, 2.7, 2.6)


SOMBRILLAS = [('sombrilla_roja', 'awn_red', 'awn_red'), ('sombrilla_azul', 'awn_blue', 'awn_blue'), ('sombrilla_amarilla', 'awn_gold', 'awn_gold'), ('sombrilla_verde', 'awn_green', 'awn_green')]
SIZES = {'palmera': (4, 4, 7.6), 'torre_salvavidas': (4.2, 7, 7.8), 'chiringuito': (10.4, 7.6, 4.7), 'barca_roja': (1.6, 5, 1.2), 'barca_azul': (1.6, 5, 1.2),
         'velero': (2, 6.5, 7.2), 'muelle': (9, 40, 2.4), 'faro': (9, 9, 24), 'rocas_a': (6, 5, 3), 'rocas_b': (6, 5, 3), 'castillo': (2, 2, 2.4), 'voley': (9.2, 17.2, 2.6),
         'caseta_roja': (3.2, 3.2, 3.2), 'caseta_azul': (3.2, 3.2, 3.2), 'sombrilla_roja': (4, 5, 2.8), 'sombrilla_azul': (4, 5, 2.8), 'sombrilla_amarilla': (4, 5, 2.8), 'sombrilla_verde': (4, 5, 2.8)}


def build_all(tex):
    info = {}

    def save(name, fn):
        m = Model(name)
        fn(m)
        n = m.save(tex)
        w, d, h = SIZES[name]
        info[name] = {'w': w, 'd': d, 'h': h, 'cubos': n}
        print(f'{name:20s} {n:4d} cubos')
    save('palmera', lambda m: palmera(m, random.Random(5)))
    for name, tile, towel in SOMBRILLAS:
        save(name, lambda m, t=tile, w=towel: sombrilla(m, random.Random(2), t, w))
    save('torre_salvavidas', lambda m: torre_salvavidas(m, random.Random(1)))
    save('chiringuito', lambda m: chiringuito(m, random.Random(1)))
    save('barca_roja', lambda m: barca(m, random.Random(1), 'hull_red'))
    save('barca_azul', lambda m: barca(m, random.Random(1), 'hull_blue'))
    save('velero', lambda m: velero(m, random.Random(1)))
    save('muelle', lambda m: muelle(m, random.Random(1)))
    save('faro', lambda m: faro(m, random.Random(1)))
    save('rocas_a', lambda m: rocas(m, random.Random(1), 11))
    save('rocas_b', lambda m: rocas(m, random.Random(1), 29))
    save('castillo', lambda m: castillo(m, random.Random(1)))
    save('voley', lambda m: voley(m, random.Random(1)))
    save('caseta_roja', lambda m: caseta(m, random.Random(1), 'awn_red', 'sign_red'))
    save('caseta_azul', lambda m: caseta(m, random.Random(1), 'awn_blue', 'hull_blue'))
    return info
