"""Modelos de la costa (palmeras, sombrillas, torre de salvavidas, chiringuito, barcas, muelle, faro, rocas...) como proyectos de Blockbench.
1 bloque (16 px) = 1 metro. Los cubos del grupo `colision` son obstáculos invisibles en el juego."""
import math, random
from gen_edificios import Model


def palmera(m, rng):
    m.group('Tronco')
    n = 12
    x = z = 0.0
    top = 0.0
    for i in range(n):
        w = max(0.42, 0.62 - i * 0.016)
        bx = 0.45 * math.sin(i * 0.28)
        bz = 0.15 * math.sin(i * 0.4)
        m.cube(bx, i * 0.65, bz, w, 0.68, w, 'bark' if i % 3 != 1 else 'dark_planks')
        if i % 2 == 0:
            m.cube(bx, i * 0.65 + 0.48, bz, w + 0.06, 0.12, w + 0.06, 'wood')
        top = i * 0.65 + 0.68
        x, z = bx, bz
    m.col(0.1, 0, 0.6, 0.6, 7.5)

    # Racimo de cocos bajo la copa
    m.group('Cocos')
    for (cx, cz) in ((0.22, 0.2), (-0.2, 0.22), (-0.18, -0.22), (0.22, -0.18)):
        m.cube(x + cx, top - 0.45, z + cz, 0.32, 0.36, 0.32, 'wood')
        m.cube(x + cx * 1.1, top - 0.42, z + cz * 1.1, 0.28, 0.32, 0.28, 'trim_stone')

    # Corona de hojas de palmera (dos capas: superior extendida e inferior arqueada hacia abajo)
    m.group('Copa Superior')
    for k in range(10):
        yaw = k * 36 + rng.uniform(-6, 6)
        L = 3.8 + rng.uniform(-0.25, 0.25)
        tilt = 18 + rng.uniform(0, 10)
        rad = math.radians(yaw)
        dx, dz = math.sin(rad), math.cos(rad)
        h = L / 2 * math.cos(math.radians(tilt))
        v = L / 2 * math.sin(math.radians(tilt))
        # Base de la hoja
        m.cube(x + dx * (h * 0.45), top - v * 0.3 + 0.2, z + dz * (h * 0.45), 0.95, 0.08, L * 0.55, 'palm_leaf', rot=[tilt, yaw, 0])
        # Extremo curvado hacia abajo
        tipTilt = tilt + 22
        th = L * 0.85 * math.cos(math.radians(tipTilt))
        tv = L * 0.85 * math.sin(math.radians(tipTilt))
        m.cube(x + dx * th, top - tv + 0.1, z + dz * th, 0.75, 0.06, L * 0.55, 'palm_leaf', rot=[tipTilt, yaw, 0])

    m.group('Copa Inferior')
    for k in range(7):
        yaw = k * 51.4 + 25 + rng.uniform(-5, 5)
        L = 2.9 + rng.uniform(-0.2, 0.2)
        tilt = 34 + rng.uniform(0, 8)
        rad = math.radians(yaw)
        dx, dz = math.sin(rad), math.cos(rad)
        h = L / 2 * math.cos(math.radians(tilt))
        v = L / 2 * math.sin(math.radians(tilt))
        m.cube(x + dx * h, top - v - 0.1, z + dz * h, 0.85, 0.07, L, 'palm_leaf', rot=[tilt, yaw, 0])


def sombrilla(m, rng, tile, towel):
    m.group('Sombrilla')
    # Mástil de madera torneado
    m.cube(0, 0, 0, 0.12, 2.65, 0.12, 'wood')
    m.cube(0, 0, 0, 0.45, 0.14, 0.45, 'trim_stone')  # Base de piedra en la arena
    # Cúpula de 8 caras escalonada estilo parasol náutico
    m.cube(0, 2.25, 0, 3.4, 0.09, 3.4, tile)
    m.cube(0, 2.34, 0, 2.7, 0.1, 2.7, tile)
    m.cube(0, 2.44, 0, 1.9, 0.1, 1.9, tile)
    m.cube(0, 2.54, 0, 1.1, 0.1, 1.1, tile)
    m.cube(0, 2.64, 0, 0.35, 0.2, 0.35, 'trim_white')  # Remate superior
    # Faldón con festón blanco alrededor de la tela
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1), (0, -1), (0, 1), (-1, 0), (1, 0)):
        if sx != 0 and sz != 0:
            m.cube(sx * 1.62, 2.15, sz * 1.62, 0.16, 0.16, 0.16, 'trim_white')
        elif sx != 0:
            m.cube(sx * 1.68, 2.17, 0, 0.08, 0.14, 3.2, 'trim_white')
        else:
            m.cube(0, 2.17, sz * 1.68, 3.2, 0.14, 0.08, 'trim_white')

    m.group('Tumbonas')
    for sx in (-1, 1):
        x = sx * 1.35
        # Armazón de madera
        m.cube(x, 0.22, 1.15, 0.78, 0.1, 1.65, 'oak_planks')
        for lx in (-0.32, 0.32):
            for lz in (0.45, 1.85):
                m.cube(x + lx, 0, lz, 0.09, 0.24, 0.09, 'dark_planks')
        # Colchoneta reclinable suave con toalla
        m.cube(x, 0.31, 0.95, 0.72, 0.1, 1.25, towel)
        m.cube(x, 0.44, 0.32, 0.72, 0.1, 0.85, towel, rot=[-45, 0, 0])
        # Almohada / cabezal blanco
        m.cube(x, 0.62, 0.12, 0.65, 0.09, 0.32, 'trim_white', rot=[-45, 0, 0])

    m.col(0, 0, 0.3, 0.3, 2.7)
    m.col(-1.35, 1.15, 0.85, 1.7, 0.6)
    m.col(1.35, 1.15, 0.85, 1.7, 0.6)

    # Mesita auxiliar con cóctel tropical
    m.group('Mesita y Bebida')
    m.cube(0, 0, 1.75, 0.52, 0.48, 0.52, 'oak_planks')
    m.cube(0, 0.48, 1.75, 0.58, 0.05, 0.58, 'trim_white')
    # Vaso de cóctel de frutas con pajita
    m.cube(0.08, 0.53, 1.78, 0.14, 0.25, 0.14, 'glass')
    m.cube(0.08, 0.55, 1.78, 0.12, 0.18, 0.12, 'sign_teal')  # Bebida tropical
    m.cube(0.12, 0.72, 1.82, 0.04, 0.18, 0.04, 'sign_red')   # Pajita
    m.cube(-0.1, 0.53, 1.72, 0.14, 0.22, 0.14, 'gold')       # Lata refresco dorada

    m.group('Toalla en arena')
    m.cube(0, 0.01, 3.1, 1.4, 0.02, 1.9, towel)
    m.cube(0, 0.02, 3.1, 1.2, 0.01, 1.7, 'trim_white')


def torre_salvavidas(m, rng):
    m.group('Pilotes de soporte')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * 1.5, 0, sz * 1.5, 0.26, 2.8, 0.26, 'oak_planks')
            m.col(sx * 1.5, sz * 1.5, 0.28, 0.28, 2.8)
    for sx in (-1, 1):
        m.cube(sx * 1.5, 1.0, 0, 0.12, 0.12, 3.2, 'oak_planks')
        m.cube(sx * 1.5, 1.9, 0, 0.12, 0.12, 3.2, 'oak_planks')
    for sz in (-1, 1):
        m.cube(0, 1.4, sz * 1.5, 3.2, 0.12, 0.12, 'oak_planks')
        m.cube(0, 0.7, sz * 1.5, 3.2, 0.12, 0.12, 'oak_planks')

    m.group('Plataforma y barandas')
    m.cube(0, 2.7, 0, 4.1, 0.22, 4.1, 'dark_planks')
    # Barandilla perimetral
    for sx in (-1, 1):
        m.cube(sx * 1.95, 2.9, 0, 0.1, 1.0, 4.0, 'oak_planks')
    m.cube(0, 2.9, -1.95, 4.0, 1.0, 0.1, 'oak_planks')
    m.cube(-1.0, 2.9, 1.95, 2.0, 1.0, 0.1, 'oak_planks')  # Deja paso para la escalera

    m.group('Cabina')
    m.cube(0, 2.92, -0.3, 3.0, 2.3, 2.6, 'trim_white')
    m.cube(0, 3.75, -0.3, 3.06, 0.55, 2.66, 'sign_red')  # Franja roja de emergencia
    # Ventanal de vigilancia panorámico
    m.cube(0, 3.3, 1.02, 2.2, 1.2, 0.08, 'glass')
    m.cube(0, 3.3, 1.06, 2.3, 0.08, 0.06, 'trim_white')
    m.cube(0, 4.4, 1.06, 2.3, 0.08, 0.06, 'trim_white')
    for sx in (-1, 1):
        m.cube(sx * 1.52, 3.4, -0.3, 0.06, 1.0, 1.6, 'glass')

    m.group('Techo')
    m.cube(0, 5.2, -0.2, 4.4, 0.24, 3.6, 'sign_red')
    m.cube(0, 5.44, -0.2, 3.4, 0.2, 2.8, 'sign_red')
    m.cube(0, 5.18, 1.6, 4.4, 0.08, 0.08, 'trim_white')

    m.group('Salvavidas y Accesorios')
    # Aro salvavidas rojo y blanco colgado del frente
    m.cube(-1.2, 3.05, 2.02, 0.85, 0.85, 0.12, 'sign_red')
    m.cube(-1.2, 3.05, 2.04, 0.87, 0.22, 0.14, 'trim_white')
    m.cube(-1.2, 3.05, 2.04, 0.22, 0.87, 0.14, 'trim_white')
    # Hueco central del aro
    m.cube(-1.2, 3.05, 2.05, 0.35, 0.35, 0.16, 'trim_white')

    # Megáfono / bocina de alerta en el techo
    m.cube(1.3, 5.5, 0.8, 0.25, 0.25, 0.5, 'gold')
    # Prismáticos en la repisa
    m.cube(0.5, 3.3, 1.15, 0.25, 0.12, 0.2, 'metal_dark')

    m.group('Escalera')
    for i in range(8):
        m.cube(1.0, 0, 1.9 + (7 - i) * 0.42, 1.25, (i + 1) * 0.35, 0.4, 'oak_planks')
    m.cube(1.65, 0.7, 3.8, 0.09, 1.1, 0.09, 'oak_planks')
    m.cube(0.35, 0.7, 3.8, 0.09, 1.1, 0.09, 'oak_planks')

    # Mástil con bandera de rescate
    m.group('Bandera')
    m.cube(1.4, 5.5, -1.2, 0.1, 3.0, 0.1, 'steel')
    m.cube(2.1, 7.5, -1.2, 1.3, 0.75, 0.04, 'sign_red')
    m.cube(2.1, 7.6, -1.2, 0.45, 0.55, 0.05, 'trim_white')


def chiringuito(m, rng):
    m.group('Tarima de madera')
    m.cube(0, 0, 0, 9.8, 0.14, 7.0, 'oak_planks')

    m.group('Columnas de bambú')
    for sx in (-1, 1):
        for sz in (-1, 0, 1):
            m.cube(sx * 4.4, 0, sz * 3.0, 0.3, 3.4, 0.3, 'bark')
            m.cube(sx * 4.4, 1.7, sz * 3.0, 0.34, 0.1, 0.34, 'wood')
            m.col(sx * 4.4, sz * 3.0, 0.32, 0.32, 3.4)

    # Vigas de amarre
    m.cube(0, 3.35, 0, 9.6, 0.22, 0.24, 'bark')
    for sz in (-1, 1):
        m.cube(0, 3.35, sz * 3.0, 9.6, 0.22, 0.24, 'bark')

    m.group('Techo de paja tropical')
    m.cube(0, 3.55, 0, 10.8, 0.22, 8.0, 'thatch')
    m.cube(0, 3.77, 0, 9.4, 0.22, 6.8, 'thatch')
    m.cube(0, 3.99, 0, 7.8, 0.22, 5.4, 'thatch')
    m.cube(0, 4.21, 0, 6.0, 0.22, 4.0, 'thatch')
    m.cube(0, 4.43, 0, 4.0, 0.22, 2.8, 'thatch')
    m.cube(0, 4.65, 0, 2.0, 0.22, 1.6, 'thatch')
    # Flecos colgantes de paja en el borde
    for i in range(14):
        m.cube(-5.0 + i * 0.77, 3.35, 4.02, 0.28, 0.32, 0.28, 'thatch')

    m.group('Barra de bar')
    m.cube(0, 0.14, 0.6, 7.6, 1.08, 1.0, 'dark_planks')
    m.cube(0, 0.14, 1.12, 7.6, 1.05, 0.08, 'wood')
    m.cube(0, 1.22, 0.6, 8.0, 0.12, 1.35, 'oak_planks')
    m.col(0, 0.6, 8.0, 1.3, 1.2)

    # Taburetes de bar de playa
    m.group('Taburetes')
    for i in range(6):
        sx = -3.0 + i * 1.2
        m.cube(sx, 0.14, 1.95, 0.12, 0.68, 0.12, 'metal_dark')
        m.cube(sx, 0.82, 1.95, 0.52, 0.12, 0.52, ['sign_red', 'awn_blue', 'gold', 'awn_green', 'sign_teal', 'sign_red'][i])
        m.cube(sx, 0.14, 1.95, 0.44, 0.06, 0.44, 'metal_dark')
        m.col(sx, 1.95, 0.52, 0.52, 0.9)

    # Botellas y vasos en la barra
    for i in range(6):
        m.cube(-3.0 + i * 1.2, 1.34, 0.55, 0.14, 0.34, 0.14, ['sign_teal', 'sign_red', 'gold', 'awn_green', 'hull_blue', 'trim_white'][i])

    m.group('Fondo y Estantería')
    m.col(0, -3.0, 9.6, 0.45, 3.2)
    m.cube(0, 0.14, -3.0, 9.6, 3.0, 0.32, 'wall_wood')
    m.cube(0, 1.4, -2.8, 7.4, 1.6, 0.08, 'goods')
    for y in (1.3, 1.85, 2.4):
        m.cube(0, y, -2.75, 7.6, 0.09, 0.35, 'dark_planks')
    # Nevera de helados y bebidas
    m.cube(-3.8, 0.14, -2.2, 1.2, 2.2, 0.85, 'steel')
    m.cube(-3.8, 0.35, -1.75, 1.0, 1.8, 0.06, 'fridge')
    m.col(-3.8, -2.2, 1.2, 0.85, 2.2)

    # Pizarra con menú
    m.cube(3.5, 2.2, -2.75, 2.0, 1.0, 0.08, 'menu_board')

    m.group('Letrero Tiki y Luces')
    m.cube(0, 2.65, 3.15, 4.8, 0.95, 0.16, 'sign_dark')
    m.cube(0, 2.78, 3.25, 4.4, 0.7, 0.06, 'sign_gold')
    # Guirnalda de farolillos luminosos de colores
    for i in range(16):
        m.cube(-4.8 + i * 0.64, 3.1, 3.2, 0.16, 0.16, 0.16, 'glow')

    m.group('Tablas de surf')
    m.col(5.1, -0.6, 0.5, 2.6, 2.6)
    surf_colors = ('hull_blue', 'sign_red', 'gold')
    for k, tl in enumerate(surf_colors):
        m.cube(5.05, 0.14, -1.4 + k * 0.8, 0.52, 2.8, 0.1, tl, rot=[0, 0, -10])
        m.cube(5.05, 1.2, -1.4 + k * 0.8, 0.1, 1.2, 0.11, 'trim_white', rot=[0, 0, -10])


def barca(m, rng, tile):
    m.group('Casco Náutico')
    m.cube(0, 0, 0, 1.1, 0.14, 3.6, tile)
    for sx in (-1, 1):
        m.cube(sx * 0.58, 0.12, 0, 0.14, 0.55, 3.8, tile)
        # Proa afilada
        m.cube(sx * 0.44, 0.12, 2.15, 0.14, 0.54, 0.9, tile, rot=[0, sx * 26, 0])
        # Borda blanca decorativa
        m.cube(sx * 0.58, 0.65, 0, 0.18, 0.09, 3.8, 'trim_white')
    m.cube(0, 0.12, 2.5, 0.26, 0.54, 0.35, tile)
    m.cube(0, 0.12, -1.95, 1.3, 0.55, 0.16, tile)
    m.col(0, 0, 1.4, 3.9, 0.75)

    m.group('Interior y Bancos')
    for z in (-1.0, 0.1, 1.1):
        m.cube(0, 0.42, z, 1.05, 0.09, 0.4, 'oak_planks')
    m.cube(0, 0.14, 0, 0.85, 0.05, 3.2, 'dark_planks')  # Enjaretado del fondo

    m.group('Remos')
    for sx in (-1, 1):
        m.cube(sx * 0.92, 0.6, 0.1, 1.6, 0.07, 0.07, 'oak_planks', rot=[0, 0, sx * 14])
        m.cube(sx * 1.68, 0.65, 0.1, 0.55, 0.06, 0.22, 'oak_planks')


def velero(m, rng):
    m.group('Casco de Vela')
    m.cube(0, 0, 0, 1.7, 0.16, 5.6, 'hull_white')
    for sx in (-1, 1):
        m.cube(sx * 0.9, 0.12, -0.2, 0.16, 0.74, 5.6, 'hull_white')
        m.cube(sx * 0.9, 0.68, -0.2, 0.2, 0.12, 5.6, 'hull_blue')
        m.cube(sx * 0.66, 0.12, 3.15, 0.16, 0.7, 1.3, 'hull_white', rot=[0, sx * 27, 0])
    m.cube(0, 0.12, 3.8, 0.35, 0.65, 0.45, 'hull_white')
    m.cube(0, 0.12, -3.1, 1.8, 0.74, 0.18, 'hull_white')
    m.cube(0, 0.55, 1.7, 1.5, 0.09, 2.1, 'oak_planks')
    m.col(0, 0.2, 1.9, 5.8, 1.0)

    m.group('Mástil y Vela Mayor')
    m.cube(0, 0.14, 1.1, 0.16, 7.2, 0.16, 'wood')
    m.cube(0, 1.35, -0.7, 0.11, 0.11, 3.6, 'wood')
    # Vela mayor triangular ondeando
    for i in range(12):
        L = 3.6 - i * 0.28
        m.cube(0, 1.5 + i * 0.48, -0.15 - L / 2 + 0.55, 0.05, 0.48, L, 'sail')
    # Banderín rojo en la punta
    m.cube(0, 7.3, 1.1, 0.55, 0.32, 0.04, 'sign_red')
    # Timón en popa
    m.cube(0, 0.4, -3.2, 0.08, 0.9, 0.5, 'dark_planks')
    m.cube(0, 0.85, -2.6, 0.06, 0.06, 1.2, 'metal_dark')

    m.group('Cabina y Ojo de Buey')
    m.cube(0, 0.75, 2.5, 1.3, 0.55, 1.2, 'hull_blue')
    m.cube(0, 1.3, 2.5, 1.4, 0.09, 1.3, 'trim_white')
    m.cube(0, 0.92, 3.12, 0.45, 0.45, 0.06, 'glass')
    m.cube(0, 0.92, 3.14, 0.52, 0.52, 0.03, 'gold')  # Marco de bronce


_FONDO = [(96, .1), (99, .8), (102, 1.7), (105, 2.6), (108, 3.5), (111, 4.3), (114, 5.0), (117, 5.5), (120, 6.0), (124, 6.5)]
def _hondo(zz):
    zw = 78 + zz
    if zw <= _FONDO[0][0]: return 2.0
    for (z0, d0), (z1, d1) in zip(_FONDO, _FONDO[1:]):
        if zw <= z1: return max(2.0, d0 + (d1 - d0) * (zw - z0) / (z1 - z0) + .6)
    return _FONDO[-1][1] + .6


def muelle(m, rng):
    L, Wd = 34.0, 4.4
    m.group('Cubierta')
    z = 0.0
    while z < L - 0.01:
        d = min(4.0, L - z)
        m.cube(0, -0.07, z + d / 2, Wd, 0.14, d, 'oak_planks')
        for k in range(int(d / 1.0)):
            m.cube(0, 0.05, z + 0.5 + k * 1.0, Wd, 0.02, 0.05, 'dark_planks')
        z += d
    m.cube(0, -0.07, L + 3.0, 9.4, 0.14, 6.2, 'oak_planks')

    m.group('Pilotes y barandas')
    for i in range(0, int(L / 3) + 3):
        zz = i * 3.0 + 0.3
        for sx in (-1, 1):
            m.cube(sx * 2.0, -_hondo(zz), zz, 0.32, _hondo(zz), 0.32, 'bark')
            m.cube(sx * 2.18, 0, zz, 0.15, 1.15, 0.15, 'oak_planks')
    for sx in (-1, 1):
        m.cube(sx * 2.18, 1.05, L / 2, 0.13, 0.11, L, 'oak_planks')
        m.cube(sx * 2.18, 0.58, L / 2, 0.07, 0.07, L, 'oak_planks')
        m.col(sx * 2.2, L / 2, 0.24, L, 1.2)
    m.cube(0, 1.05, L + 6.0, 9.4, 0.11, 0.13, 'oak_planks')
    m.cube(0, 0.58, L + 6.0, 9.4, 0.07, 0.07, 'oak_planks')
    for sx in (-1, 1):
        m.cube(sx * 4.65, 1.05, L + 3.0, 0.13, 0.11, 6.2, 'oak_planks')
        m.cube(sx * 4.65, 0.58, L + 3.0, 0.07, 0.07, 6.2, 'oak_planks')
        for zz in (L + 0.5, L + 2.5, L + 4.5, L + 6.0):
            m.cube(sx * 4.65, 0, zz, 0.15, 1.15, 0.15, 'oak_planks')
        m.col(sx * 4.65, L + 3.0, 0.22, 6.2, 1.2)
    m.col(0, L + 6.0, 9.4, 0.22, 1.2)
    for zz in (L + 0.6, L + 3.0, L + 5.6):
        for sx in (-1, 0, 1):
            m.cube(sx * 4.2 - 0.15, -_hondo(zz), zz - 0.15, 0.32, _hondo(zz), 0.32, 'bark')

    m.group('Farolas de muelle')
    for zz in (4.0, 12.0, 20.0, 28.0):
        for sx in (-1, 1):
            m.cube(sx * 1.82, 0, zz, 0.14, 2.4, 0.14, 'metal_dark')
            m.cube(sx * 1.82, 2.4, zz, 0.36, 0.36, 0.36, 'glow')
            m.col(sx * 1.82, zz, 0.22, 0.22, 2.6)
    for sx in (-1, 1):
        m.cube(sx * 4.0, 0, L + 5.0, 0.14, 2.4, 0.14, 'metal_dark')
        m.cube(sx * 4.0, 2.4, L + 5.0, 0.36, 0.36, 0.36, 'glow')
        m.col(sx * 4.0, L + 5.0, 0.22, 0.22, 2.6)

    m.group('Bancos y Amarras')
    for sx in (-3.0, 3.0):
        m.cube(sx, 0, L + 3.2, 1.9, 0.48, 0.55, 'oak_planks')
        m.cube(sx, 0.48, L + 3.5, 1.9, 0.65, 0.12, 'oak_planks')
        m.col(sx, L + 3.3, 1.9, 0.65, 1.05)
    # Bolardos de amarre náuticos
    m.cube(0, 0, L + 5.8, 0.35, 0.55, 0.35, 'metal_dark')
    m.cube(1.6, 0, L + 5.8, 0.35, 0.55, 0.35, 'metal_dark')
    m.cube(-1.6, 0, L + 5.8, 0.35, 0.55, 0.35, 'metal_dark')


def faro(m, rng):
    m.group('Base de Roca')
    for (x, z, w, d, h) in ((0, 0, 9.4, 9.4, 1.8), (-2.5, 1.5, 5.2, 5.2, 2.4), (2.8, -2.2, 4.8, 4.8, 2.8), (3.5, 3.0, 3.8, 3.5, 1.7), (-3.8, -3.0, 3.2, 3.6, 2.1)):
        m.cube(x, 0, z, w, h, d, 'rock')
        m.cube(x, h, z, w * 0.65, 0.55, d * 0.65, 'rock_dark')
    m.col(0, 0, 9.4, 9.4, 2.2)

    m.group('Torre del Faro')
    y = 2.0
    for i in range(10):
        w = max(2.6, 4.6 - i * 0.2)
        m.cube(0, y, 0, w, 2.1, w, 'hull_white' if i % 2 == 0 else 'sign_red')
        for sx in (-1, 1):
            if i % 2 == 1:
                m.cube(sx * (w / 2 + 0.02), y + 0.8, 0, 0.07, 0.75, 0.45, 'glass_dark')
        y += 2.1

    # Puerta de entrada en la base
    m.cube(0, 2.0, 2.32, 1.1, 2.0, 0.12, 'door_navy')
    m.col(0, 0, 4.6, 4.6, 23.0)

    m.group('Galería y Balcón')
    m.cube(0, y, 0, 4.4, 0.28, 4.4, 'metal_dark')
    for sx, sz in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        m.cube(sx * 2.05, y, sz * 2.05, 0.14, 2.5, 0.14, 'metal_dark')
        m.cube(sx * 2.05, y + 0.28, sz * 2.05, 0.11, 0.95, 0.11, 'metal_dark')
    m.cube(0, y + 0.28, 2.15, 3.8, 0.11, 0.11, 'metal_dark')
    m.cube(0, y + 0.28, -2.15, 3.8, 0.11, 0.11, 'metal_dark')
    for sx in (-1, 1):
        m.cube(sx * 2.15, y + 0.28, 0, 0.11, 0.11, 3.8, 'metal_dark')

    m.group('Linterna y Foco')
    m.cube(0, y + 0.28, 0, 3.8, 2.1, 3.8, 'glass')
    # Foco giratorio central ultra brillante
    m.cube(0, y + 0.65, 0, 1.5, 1.3, 1.5, 'glow')
    m.cube(0, y + 0.55, 0, 1.1, 1.7, 1.1, 'neon_yellow')
    m.cube(0, y + 0.5, 0, 0.6, 1.8, 0.6, 'gold')

    m.group('Cúpula y Veleta')
    m.cube(0, y + 2.38, 0, 4.6, 0.32, 4.6, 'sign_red')
    m.cube(0, y + 2.7, 0, 3.4, 0.32, 3.4, 'sign_red')
    m.cube(0, y + 3.02, 0, 2.2, 0.32, 2.2, 'sign_red')
    m.cube(0, y + 3.34, 0, 0.9, 0.45, 0.9, 'metal_dark')
    # Pararrayos / Veleta
    m.cube(0, y + 3.79, 0, 0.08, 1.2, 0.08, 'gold')


def rocas(m, rng, seed):
    r = random.Random(seed)
    m.group('Rocas Costeras')
    for i in range(8):
        w = r.uniform(1.2, 3.2)
        d = r.uniform(1.2, 2.8)
        h = r.uniform(0.9, 2.6)
        x = r.uniform(-2.6, 2.6)
        z = r.uniform(-2.2, 2.2)
        m.cube(x, 0, z, w, h, d, 'rock' if i % 2 == 0 else 'rock_dark')
        m.cube(x + 0.1, h, z, w * 0.65, 0.35, d * 0.65, 'rock')
        m.col(x, z, w, d, h + 0.35)


def castillo(m, rng):
    m.group('Muralla y Foso')
    m.cube(0, 0, 0, 2.2, 0.5, 2.2, 'sand')
    m.cube(0, 0.5, 0, 1.6, 0.35, 1.6, 'sand')
    # 4 torreones esquineros con almenas
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * 0.85, 0, sz * 0.85, 0.55, 1.25, 0.55, 'sand')
            m.cube(sx * 0.85, 1.25, sz * 0.85, 0.65, 0.18, 0.65, 'sand')
    # Torre del homenaje central con puerta arqueada
    m.cube(0, 0.85, 0, 0.9, 0.9, 0.9, 'sand')
    m.cube(0, 1.75, 0, 0.6, 0.2, 0.6, 'sand')
    # Mástil con banderín de playa
    m.cube(0, 1.95, 0, 0.06, 0.7, 0.06, 'trim_white')
    m.cube(0.18, 2.4, 0, 0.35, 0.22, 0.04, 'sign_red')
    # Arena mojada alrededor
    m.cube(0, 0, 1.4, 0.7, 0.12, 0.9, 'wet_sand')
    m.col(0, 0, 2.2, 2.2, 1.6)


def voley(m, rng):
    m.group('Red y Postes')
    for sx in (-1, 1):
        m.cube(sx * 4.6, 0, 0, 0.16, 2.5, 0.16, 'steel')
        m.col(sx * 4.6, 0, 0.22, 0.22, 2.5)
    # Red blanca de vóley playa tensada con bordes
    m.cube(0, 1.65, 0, 9.0, 0.92, 0.04, 'vent')
    m.cube(0, 2.57, 0, 9.0, 0.09, 0.07, 'trim_white')
    m.cube(0, 1.6, 0, 9.0, 0.07, 0.07, 'trim_white')

    m.group('Líneas de Cancha')
    for (x, z, w, d) in ((0, 8.5, 9.0, 0.1), (0, -8.5, 9.0, 0.1), (-4.5, 0, 0.1, 17.1), (4.5, 0, 0.1, 17.1), (0, 0, 9.0, 0.1)):
        m.cube(x, 0, z, w, 0.02, d, 'trim_white')

    # Balón de vóley playa en la arena
    m.group('Pelota')
    m.cube(-2.2, 0, 1.8, 0.35, 0.35, 0.35, 'gold')
    m.cube(-2.2, 0.05, 1.8, 0.37, 0.25, 0.37, 'hull_blue')


def caseta(m, rng, tile, roof):
    m.group('Caseta')
    m.cube(0, 0, 0, 2.7, 2.6, 2.7, tile)
    # Puerta azul marina con manilla
    m.cube(0, 0, 1.36, 1.05, 2.1, 0.07, 'door_navy')
    m.cube(0.4, 1.05, 1.41, 0.08, 0.14, 0.06, 'gold')
    # Ventanitas laterales
    for sx in (-1, 1):
        m.cube(sx * 1.36, 1.15, 0, 0.07, 0.85, 0.95, 'glass')
    # Techo a cuatro aguas rayado
    m.cube(0, 2.6, 0, 3.3, 0.18, 3.3, roof)
    m.cube(0, 2.78, 0, 2.5, 0.18, 2.5, roof)
    m.cube(0, 2.96, 0, 1.7, 0.18, 1.7, roof)
    m.cube(0, 3.14, 0, 0.9, 0.18, 0.9, roof)
    m.col(0, 0, 2.8, 2.8, 2.7)


SOMBRILLAS = [
    ('sombrilla_roja', 'awn_red', 'awn_red'),
    ('sombrilla_azul', 'awn_blue', 'awn_blue'),
    ('sombrilla_amarilla', 'awn_gold', 'awn_gold'),
    ('sombrilla_verde', 'awn_green', 'awn_green')
]

SIZES = {
    'palmera': (4, 4, 8.0),
    'torre_salvavidas': (4.4, 7.2, 8.2),
    'chiringuito': (10.8, 8.0, 4.9),
    'barca_roja': (1.8, 5.2, 1.3),
    'barca_azul': (1.8, 5.2, 1.3),
    'velero': (2.2, 6.8, 7.6),
    'muelle': (9.4, 40.0, 2.6),
    'faro': (9.4, 9.4, 25.0),
    'rocas_a': (6.2, 5.2, 3.2),
    'rocas_b': (6.2, 5.2, 3.2),
    'castillo': (2.2, 2.2, 2.6),
    'voley': (9.4, 17.2, 2.7),
    'caseta_roja': (3.3, 3.3, 3.4),
    'caseta_azul': (3.3, 3.3, 3.4),
    'sombrilla_roja': (4.2, 5.2, 2.9),
    'sombrilla_azul': (4.2, 5.2, 2.9),
    'sombrilla_amarilla': (4.2, 5.2, 2.9),
    'sombrilla_verde': (4.2, 5.2, 2.9)
}


def build_all(tex):
    info = {}

    def save(name, fn):
        m = Model(name)
        fn(m)
        n = m.save(tex)
        w, d, h = SIZES[name]
        info[name] = {'w': w, 'd': d, 'h': h, 'cubos': n}
        print(f'{name:22s} {n:4d} cubos')

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
