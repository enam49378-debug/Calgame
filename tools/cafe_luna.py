"""Rediseño artesanal desde cero de CAFÉ LUNA (ciudad/cafe.bbmodel).
Medidas exactas preservadas para compatibilidad 100% con el juego:
  - Huella exterior: W = 13.0 m, D = 13.0 m, altura base interior Hc = 4.5 m, altura techo H = 8.0 m
  - Puertas libres: Norte (-Z) y Sur (+Z) centradas en X = 0, ancho DW = 3.2 m, alto DH = 3.0 m.
Diseño: cafetería boutique anime/europea de 2 plantas con planta alta retranqueada,
balcón-terraza envolvente con pérgola y flores, tejado mansarda con 4 buhardillas,
emblema 3D de Media Luna dorada luminosa, taza de café 3D icónica y un interior barista acogedor.
"""
import math


def build_cafe_luna(m, rng, W, D, Hc, H, G, I):
    T = I.T      # grosor de muro (0.4 m)
    DW = I.DW    # ancho puerta (3.2 m)
    DH = I.DH    # alto puerta (3.0 m)
    hx = W / 2 - T
    hz = D / 2 - T

    # =========================================================================
    # 1. SUELO, ALFOMBRA Y ACERAS DE ENTRADA
    # =========================================================================
    m.group('Suelo')
    I.slab(m, -hx, hx, -hz, hz, 0, .05, 'oak_planks')
    # Cenefa de madera oscura alrededor del salón
    m.cube(0, .052, hz - .45, W - 2 * T, .015, .65, 'dark_planks')
    m.cube(0, .052, -hz + .45, W - 2 * T, .015, .65, 'dark_planks')
    m.cube(-hx + .45, .052, 0, .65, .015, D - 2 * T - 1.3, 'dark_planks')
    m.cube(hx - .45, .052, 0, .65, .015, D - 2 * T - 1.3, 'dark_planks')
    # Aceras de entrada (piedra + tapete rojo de bienvenida)
    for sg in (-1, 1):
        m.cube(0, 0, sg * (D / 2 + .55), DW + 2.2, .05, 1.15, 'trim_stone')
        m.cube(0, .05, sg * (D / 2 + .50), DW - .3, .025, .82, 'carpet_red')
        m.cube(0, .055, sg * (D / 2 + .50), DW - .1, .02, .92, 'gold')
    # Alfombra cálida en el pasillo central interior
    m.cube(0, .055, .4, 2.5, .02, 5.4, 'carpet_red')
    m.cube(0, .052, .4, 2.72, .018, 5.62, 'gold')

    # =========================================================================
    # 2. PLANTA BAJA: MUROS, VENTANALES PANORÁMICOS EN ARCO Y ZÓCALOS
    # =========================================================================
    m.group('Planta baja')

    def build_wall_bay(side, y0, y1, u0, u1, wall_t='pl_peach', inner_t='wallpaper_cream'):
        for s0, s1 in G.split(u0, u1):
            u, l = (s0 + s1) / 2, s1 - s0
            G.place(m, side, u, y0, y1 - y0, l, T, wall_t, W, D, 0)
            G.place(m, side, u, y0, y1 - y0, l, .06, inner_t, W, D, -T)

    def build_cafe_window(side, c, ww, sill, wh, has_awning=False):
        y0, y1 = sill, sill + wh
        # Cristal principal cálido en la parte superior y transparente abajo
        G.place(m, side, c, y0 + .06, wh - .12, ww - .10, .05, 'glass_clear', W, D, -.14)
        G.place(m, side, c, y1 - .55, .48, ww - .12, .06, 'glass_warm', W, D, -.12)
        # Marco perimetral de madera oscura noble
        for sg in (-1, 1):
            G.place(m, side, c + sg * (ww / 2 - .05), y0, wh, .11, .14, 'dark_planks', W, D, .05)
        G.place(m, side, c, y0, .10, ww, .14, 'dark_planks', W, D, .05)
        G.place(m, side, c, y1 - .10, .10, ww, .14, 'dark_planks', W, D, .05)
        # Cuadrícula fina (parteluces estilo café europeo)
        G.place(m, side, c, y1 - .62, .08, ww - .1, .11, 'dark_planks', W, D, .04)
        for k in (-1, 0, 1):
            if k != 0 or ww > 2.0:
                G.place(m, side, c + k * (ww * .26), y0, wh, .06, .10, 'dark_planks', W, D, .03)
        # Arco escalonado decorativo superior + clave dorada
        G.place(m, side, c, y1, .16, ww + .36, .28, 'trim_stone', W, D, .14)
        G.place(m, side, c, y1 + .16, .14, ww - .25, .24, 'trim_white', W, D, .12)
        G.place(m, side, c, y1 + .05, .28, .26, .34, 'gold', W, D, .17)
        # Alféizar saliente con ménsulas + jardinera de madera con flores
        G.place(m, side, c, y0 - .12, .12, ww + .34, .32, 'trim_stone', W, D, .16)
        for sg in (-1, 1):
            G.place(m, side, c + sg * (ww * .42), y0 - .30, .18, .16, .24, 'trim_stone', W, D, .12)
        # Jardinera de flores bajo el ventanal
        G.place(m, side, c, y0 - .34, .24, ww - .18, .26, 'dark_planks', W, D, .30)
        G.place(m, side, c, y0 - .10, .18, ww - .26, .24, 'plant', W, D, .30)
        for k in range(4):
            fx = c - (ww - .6) / 2 + k * (ww - .6) / 3
            G.place(m, side, fx, y0 + .06, .11, .13, .13, 'flower_pink' if k % 2 == 0 else 'flower_yellow', W, D, .32)
        # Panel decorativo de madera bajo el alféizar
        G.place(m, side, c, .48, y0 - .62, ww - .15, .07, 'dark_planks', W, D, .04)
        G.place(m, side, c, .56, y0 - .78, ww - .38, .05, 'oak_planks', W, D, .07)
        # Toldo escalonado curvo con caída a rayas y soportes metálicos
        if has_awning:
            G.place(m, side, c, y1 + .30, .12, ww + .56, .65, 'awn_red', W, D, .38)
            G.place(m, side, c, y1 + .14, .12, ww + .56, .62, 'awn_red', W, D, .86)
            G.place(m, side, c, y1 - .02, .18, ww + .56, .08, 'awn_red', W, D, 1.15)
            # Borde festoneado crema/dorado + bombillas cálidas
            for k in range(5):
                ux = c - (ww + .2) / 2 + k * (ww + .2) / 4
                if k % 2 == 0:
                    G.place(m, side, ux, y1 - .10, .10, .28, .06, 'trim_white', W, D, 1.16)
                G.place(m, side, ux, y1 - .06, .13, .14, .14, 'lamp', W, D, .88)
            for sg in (-1, 1):
                G.place(m, side, c + sg * (ww / 2 + .22), y1 - .38, .55, .06, .06, 'metal_dark', W, D, .48)

    # Fachada Sur (+Z) y Norte (-Z): puerta central 3.2m + 2 ventanales amplios
    for side in ('S', 'N'):
        is_front = (side == 'S')
        # Pilares y tramos macizos
        edges = [-W / 2, -5.65, -2.55, -DW / 2, DW / 2, 2.55, 5.65, W / 2]
        # Muros macizos entre aberturas
        build_wall_bay(side, 0, Hc, -W / 2, -5.65)
        build_wall_bay(side, 0, Hc, -2.55, -DW / 2)
        build_wall_bay(side, 0, Hc, DW / 2, 2.55)
        build_wall_bay(side, 0, Hc, 5.65, W / 2)
        # Dintel sobre puerta
        build_wall_bay(side, DH, Hc, -DW / 2, DW / 2)
        # Muros bajo y sobre ventanas (centros en -4.1 y +4.1, ancho 3.1)
        for cx in (-4.1, 4.1):
            build_wall_bay(side, 0, .95, cx - 1.55, cx + 1.55)
            build_wall_bay(side, 3.35, Hc, cx - 1.55, cx + 1.55)
            build_cafe_window(side, cx, 3.1, .95, 2.40, has_awning=is_front)
        # Marco noble de puerta (sin invadir el paso libre de 3.2 x 3.0 m!)
        for sg in (-1, 1):
            G.place(m, side, sg * (DW / 2 + .18), 0, DH + .15, .36, .34, 'dark_planks', W, D, .10)
            G.place(m, side, sg * (DW / 2 + .18), 0, .45, .44, .42, 'trim_stone', W, D, .14)
            G.place(m, side, sg * (DW / 2 + .18), DH + .10, .20, .44, .42, 'gold', W, D, .14)
        G.place(m, side, 0, DH, .26, DW + .72, .38, 'dark_planks', W, D, .12)
        G.place(m, side, 0, DH + .26, .10, DW + .84, .44, 'gold', W, D, .15)
        # Zócalo de piedra sin tapar la puerta
        for sg in (-1, 1):
            x0, x1 = DW / 2 + .02, W / 2 + .08
            G.place(m, side, sg * (x0 + x1) / 2, 0, .42, x1 - x0, .36, 'stone_dark', W, D, .10)
            G.place(m, side, sg * (x0 + x1) / 2, .42, .10, x1 - x0 + .06, .34, 'trim_stone', W, D, .11)

    # Fachada Este (+X, mira a la plaza!) y Oeste (-X): 3 grandes ventanales
    for side in ('E', 'W'):
        is_plaza = (side == 'E')
        win_cs = (-4.0, 0.0, 4.0)
        ww = 2.6
        # Tramos macizos entre ventanas
        build_wall_bay(side, 0, Hc, -D / 2, -5.3)
        build_wall_bay(side, 0, Hc, -2.7, -1.3)
        build_wall_bay(side, 0, Hc, 1.3, 2.7)
        build_wall_bay(side, 0, Hc, 5.3, D / 2)
        for cz in win_cs:
            build_wall_bay(side, 0, .95, cz - ww / 2, cz + ww / 2)
            build_wall_bay(side, 3.35, Hc, cz - ww / 2, cz + ww / 2)
            build_cafe_window(side, cz, ww, .95, 2.40, has_awning=is_plaza)
        G.place(m, side, 0, 0, .42, D + .12, .36, 'stone_dark', W, D, .10)
        G.place(m, side, 0, .42, .10, D + .16, .34, 'trim_stone', W, D, .11)

    # Pilastras de esquina robustas en mármol/piedra + faroles de bronce en las 4 esquinas
    m.group('Esquinas y Pórtico')
    for sx in (-1, 1):
        for sz in (-1, 1):
            cx, cz = sx * (W / 2 - .12), sz * (D / 2 - .12)
            m.cube(cx, 0, cz, .68, .55, .68, 'stone_dark')
            m.cube(cx, .55, cz, .58, Hc - .85, .58, 'trim_white')
            for yy in (1.3, 2.3, 3.3):
                m.cube(cx, yy, cz, .66, .12, .66, 'trim_stone')
            m.cube(cx, Hc - .30, cz, .72, .30, .72, 'gold')
            # Farol de pared en las esquinas frontales
            if sz > 0:
                m.cube(cx, 2.45, cz + .42, .14, .14, .32, 'brass')
                m.cube(cx, 2.22, cz + .52, .26, .34, .26, 'lamp')
                m.cube(cx, 2.58, cz + .52, .34, .09, .34, 'brass')

    # Pórtico de entrada Sur: marquesina de madera + vidrio + columnas elegantes + lámparas
    zF = D / 2
    m.cube(0, DH + .28, zF + .95, DW + 1.4, .18, 1.85, 'dark_planks')
    m.cube(0, DH + .46, zF + .95, DW + 1.1, .08, 1.55, 'glass')
    m.cube(0, DH + .20, zF + 1.84, DW + 1.5, .14, .12, 'gold')
    for ux in (-1.6, -.8, 0, .8, 1.6):
        m.cube(ux, DH + .08, zF + 1.72, .14, .14, .14, 'lamp')
    for sg in (-1, 1):
        px = sg * (DW / 2 + .58)
        m.cube(px, 0, zF + 1.65, .38, .42, .38, 'trim_stone')
        m.cube(px, .42, zF + 1.65, .24, DH - .14, .24, 'dark_planks')
        m.cube(px, DH + .12, zF + 1.65, .36, .18, .36, 'gold')
        # Macetero alto con arbolito decorativo junto a cada columna (fuera del paso)
        mx = sg * (DW / 2 + 1.25)
        m.cube(mx, 0, zF + .85, .64, .56, .64, 'pot')
        m.cube(mx, .56, zF + .85, .18, .48, .18, 'bark')
        m.cube(mx, 1.00, zF + .85, .72, .68, .72, 'plant')
        m.cube(mx, 1.58, zF + .85, .24, .22, .24, 'flower_pink' if sg < 0 else 'flower_yellow')

    # Pizarra caballete de menú en la esquina frontal derecha
    m.cube(DW / 2 + 2.15, 0, zF + .85, .82, 1.18, .12, 'dark_planks', rot=[-8, -18, 0])
    m.cube(DW / 2 + 2.15, .18, zF + .91, .66, .84, .05, 'menu_board', rot=[-8, -18, 0])

    # =========================================================================
    # 3. CORNISÓN DE ENTREPISO + BALCÓN-TERRAZA ENVOLVENTE (y = 4.5 m)
    # =========================================================================
    m.group('Balcón Perimetral')
    # Losa principal y cornisa escalonada con dentículos alrededor de toda la planta baja
    m.cube(0, Hc - .24, 0, W + .38, .16, D + .38, 'trim_white')
    m.cube(0, Hc - .08, 0, W + .76, .24, D + .76, 'trim_stone')
    m.cube(0, Hc + .16, 0, W + .52, .12, D + .52, 'oak_planks')
    # Dentículos arquitectónicos bajo la cornisa del balcón
    for k in range(11):
        u = -5.5 + k * 1.1
        for sz in (-1, 1):
            m.cube(u, Hc - .36, sz * (D / 2 + .24), .24, .18, .24, 'trim_stone')
        for sx in (-1, 1):
            m.cube(sx * (W / 2 + .24), Hc - .36, u, .24, .18, .24, 'trim_stone')

    # Baranda de hierro forjado perimetral en el borde del balcón (y = 4.78..5.65)
    by0 = Hc + .28
    bh = .88
    bx = W / 2 + .14
    bz = D / 2 + .14
    # Pasamanos superior e inferior en los 4 lados
    for sz in (-1, 1):
        m.cube(0, by0 + bh, sz * bz, W + .36, .08, .09, 'metal_dark')
        m.cube(0, by0 + .06, sz * bz, W + .32, .06, .06, 'metal_dark')
        for k in range(25):
            ux = -W / 2 + .1 + k * (W - .2) / 24
            m.cube(ux, by0 + .06, sz * bz, .05, bh - .06, .05, 'metal_dark')
    for sx in (-1, 1):
        m.cube(sx * bx, by0 + bh, 0, .09, .08, D + .36, 'metal_dark')
        m.cube(sx * bx, by0 + .06, 0, .06, .06, D + .32, 'metal_dark')
        for k in range(25):
            uz = -D / 2 + .1 + k * (D - .2) / 24
            m.cube(sx * bx, by0 + .06, uz, .05, bh - .06, .05, 'metal_dark')
    # Pilares de esquina de la baranda con globos de luz cálidos
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * bx, by0, sz * bz, .38, bh + .18, .38, 'trim_stone')
            m.cube(sx * bx, by0 + bh + .18, sz * bz, .26, .26, .26, 'lamp')
            m.cube(sx * bx, by0 + bh + .44, sz * bz, .18, .08, .18, 'gold')

    # Pérgola floral de madera en la esquina SE del balcón (lado plaza)
    for px, pz in ((4.9, 5.7), (5.7, 4.9), (5.7, 2.2), (2.2, 5.7)):
        m.cube(px, by0, pz, .16, 2.15, .16, 'dark_planks')
    for k in range(5):
        m.cube(4.0, by0 + 2.12, 2.2 + k * .9, 3.8, .10, .12, 'oak_planks')
    m.cube(4.8, by0 + 2.20, 4.4, 2.4, .22, 2.8, 'plant')
    for fx, fz, fc in ((4.1, 3.6, 'flower_pink'), (5.3, 4.7, 'flower_yellow'), (4.6, 5.4, 'flower_pink')):
        m.cube(fx, by0 + 2.34, fz, .22, .16, .22, fc)
    m.cube(4.6, by0 + 1.92, 4.4, .22, .22, .22, 'lamp')

    # =========================================================================
    # 4. SEGUNDA PLANTA RETRANQUEADA (10.6 x 10.6 m, y = 4.78 .. 7.10 m)
    # =========================================================================
    m.group('Planta alta')
    W2, D2 = 10.6, 10.6
    y2 = Hc + .28
    h2 = 2.35
    # Núcleo interior cálido de la segunda planta
    m.cube(0, y2, 0, W2 - .2, h2, D2 - .2, 'pl_cream')
    # Pilastras de esquina en madera oscura + remate dorado
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * (W2 / 2 - .12), y2, sz * (D2 / 2 - .12), .48, h2, .48, 'dark_planks')
            m.cube(sx * (W2 / 2 - .12), y2 + h2 - .16, sz * (D2 / 2 - .12), .56, .16, .56, 'gold')
    # Ventanas francesas cálidas con contraventanas verdes en los 4 lados
    for side in 'SNEW':
        for u in (-3.1, 0.0, 3.1):
            # Ventana francesa luminosa
            wy, wh2, ww2 = y2 + .35, 1.55, 1.45
            if side == 'S':
                m.cube(u, wy, D2 / 2 - .02, ww2, wh2, .12, 'glass_warm')
                m.cube(u, wy - .08, D2 / 2 + .06, ww2 + .24, .10, .20, 'trim_stone')
                m.cube(u, wy + wh2, D2 / 2 + .06, ww2 + .28, .12, .22, 'trim_stone')
                m.cube(u, wy + wh2 * .5, D2 / 2 + .03, ww2, .06, .08, 'dark_planks')
                m.cube(u, wy, D2 / 2 + .03, .06, wh2, .08, 'dark_planks')
                for sg in (-1, 1):
                    m.cube(u + sg * (ww2 / 2 + .24), wy, D2 / 2 + .04, .38, wh2, .07, 'awn_green')
            elif side == 'N':
                m.cube(u, wy, -D2 / 2 + .02, ww2, wh2, .12, 'glass_warm')
                m.cube(u, wy - .08, -D2 / 2 - .06, ww2 + .24, .10, .20, 'trim_stone')
                m.cube(u, wy + wh2, -D2 / 2 - .06, ww2 + .28, .12, .22, 'trim_stone')
                for sg in (-1, 1):
                    m.cube(u + sg * (ww2 / 2 + .24), wy, -D2 / 2 - .04, .38, wh2, .07, 'awn_green')
            elif side == 'E':
                m.cube(W2 / 2 - .02, wy, u, .12, wh2, ww2, 'glass_warm')
                m.cube(W2 / 2 + .06, wy - .08, u, .20, .10, ww2 + .24, 'trim_stone')
                m.cube(W2 / 2 + .06, wy + wh2, u, .22, .12, ww2 + .28, 'trim_stone')
                for sg in (-1, 1):
                    m.cube(W2 / 2 + .04, wy, u + sg * (ww2 / 2 + .24), .07, wh2, .38, 'awn_green')
            else:
                m.cube(-W2 / 2 + .02, wy, u, .12, wh2, ww2, 'glass_warm')
                m.cube(-W2 / 2 - .06, wy - .08, u, .20, .10, ww2 + .24, 'trim_stone')
                m.cube(-W2 / 2 - .06, wy + wh2, u, .22, .12, ww2 + .28, 'trim_stone')
                for sg in (-1, 1):
                    m.cube(-W2 / 2 - .04, wy, u + sg * (ww2 / 2 + .24), .07, wh2, .38, 'awn_green')

    # =========================================================================
    # 5. LETRERO ARTESANAL + EMBLEMA 3D DE MEDIA LUNA DORADA LUMINOSA
    # =========================================================================
    m.group('Emblema Luna')
    # Tablero principal de CAFÉ LUNA sobre el pórtico frontal
    m.cube(0, Hc + .12, zF + .34, 5.2, 1.15, .24, 'sign_dark')
    m.cube(0, Hc + .06, zF + .46, 5.45, .10, .12, 'gold')
    m.cube(0, Hc + 1.24, zF + .46, 5.45, .10, .12, 'gold')
    for sg in (-1, 1):
        m.cube(sg * 2.66, Hc + .06, zF + .46, .12, 1.28, .12, 'gold')
    # Medallón circular oscuro con Media Luna creciente en 3D (oro + glow)
    my = Hc + 1.55
    mz = zF + .38
    m.cube(0, my - .38, mz - .04, 1.75, 1.75, .18, 'night')
    m.cube(0, my - .44, mz - .04, 1.95, .12, .24, 'gold')
    m.cube(0, my + 1.32, mz - .04, 1.95, .12, .24, 'gold')
    # Escultura vóxel de la media luna creciente
    moon_pts = [
        (-.28, .08, .55, .22), (-.48, .28, .28, .26), (-.56, .52, .24, .34),
        (-.48, .82, .28, .26), (-.28, 1.02, .55, .22), (.18, .96, .28, .20),
        (.18, .14, .28, .20)
    ]
    for mx, dy, mw, mh in moon_pts:
        m.cube(mx, my - .12 + dy, mz + .10, mw, mh, .16, 'gold')
        m.cube(mx, my - .10 + dy, mz + .18, mw * .7, mh * .7, .06, 'glow')
    # Estrellitas doradas junto a la luna
    m.cube(.32, my + .55, mz + .14, .18, .18, .10, 'lamp')
    m.cube(.52, my + .26, mz + .14, .12, .12, .10, 'lamp')

    # =========================================================================
    # 6. TEJADO MANSARDA CON 4 BUHARDILLAS + CHIMENEA + TAZA DE CAFÉ 3D GIGANTE
    # =========================================================================
    m.group('Tejado Mansarda')
    yr = y2 + h2  # ~7.13 m
    # Cornisa de madera y piedra bajo el tejado
    m.cube(0, yr - .14, 0, W2 + .78, .18, D2 + .78, 'trim_stone')
    m.cube(0, yr + .04, 0, W2 + .56, .12, D2 + .56, 'gold')
    # 5 escalones del tejado mansarda de pizarra oscura
    levels = [
        (W2 + .42, D2 + .42, .38),
        (W2 - .28, D2 - .28, .40),
        (W2 - 1.04, D2 - 1.04, .42),
        (W2 - 1.84, D2 - 1.84, .40),
        (W2 - 2.60, D2 - 2.60, .32),
    ]
    cy = yr + .14
    for lw, ld, lh in levels:
        m.cube(0, cy, 0, lw, lh, ld, 'concrete_dark')
        # Ribetes de bronce en las 4 aristas de cada nivel
        for sx in (-1, 1):
            for sz in (-1, 1):
                m.cube(sx * (lw / 2 + .02), cy, sz * (ld / 2 + .02), .14, lh + .02, .14, 'brass')
        cy += lh
    # Remate superior plano con crestería de hierro y oro
    topW, topD = W2 - 2.60, D2 - 2.60
    m.cube(0, cy, 0, topW + .28, .14, topD + .28, 'trim_stone')
    m.cube(0, cy + .14, 0, topW - .2, .08, topD - .2, 'roof_tar')
    for sx in (-1, 1):
        for sz in (-1, 1):
            m.cube(sx * (topW / 2 + .06), cy + .14, sz * (topD / 2 + .06), .20, .55, .20, 'gold')
            m.cube(sx * (topW / 2 + .06), cy + .69, sz * (topD / 2 + .06), .14, .14, .14, 'lamp')

    # 4 Buhardillas (dormers) con tejadito propio y ventana iluminada
    m.group('Buhardillas')
    for side in 'SNEW':
        dy0 = yr + .28
        if side in 'SN':
            sg = 1 if side == 'S' else -1
            dz = sg * (D2 / 2 - .55)
            m.cube(0, dy0, dz, 2.2, 1.35, 1.15, 'pl_cream')
            m.cube(0, dy0 + .16, dz + sg * .59, 1.35, .92, .08, 'glass_warm')
            m.cube(0, dy0 + .12, dz + sg * .62, 1.55, .10, .16, 'dark_planks')
            # Tejadito triangular de la buhardilla
            for k in range(3):
                m.cube(0, dy0 + 1.35 + k * .22, dz, 2.5 - k * .65, .22, 1.35, 'concrete_dark')
            m.cube(0, dy0 + 2.00, dz, .30, .14, 1.42, 'gold')
        else:
            sg = 1 if side == 'E' else -1
            dx = sg * (W2 / 2 - .55)
            m.cube(dx, dy0, 0, 1.15, 1.35, 2.2, 'pl_cream')
            m.cube(dx + sg * .59, dy0 + .16, 0, .08, .92, 1.35, 'glass_warm')
            m.cube(dx + sg * .62, dy0 + .12, 0, .16, .10, 1.55, 'dark_planks')
            for k in range(3):
                m.cube(dx, dy0 + 1.35 + k * .22, 0, 1.35, .22, 2.5 - k * .65, 'concrete_dark')
            m.cube(dx, dy0 + 2.00, 0, 1.42, .14, .30, 'gold')

    # Chimenea artesanal de ladrillo en esquina trasera oeste
    m.group('Chimenea y Taza Icono')
    m.cube(-2.6, cy - .4, -2.2, 1.15, 2.1, 1.15, 'br_red')
    m.cube(-2.6, cy + 1.7, -2.2, 1.42, .20, 1.42, 'trim_stone')
    m.cube(-2.6, cy + 1.9, -2.2, .72, .35, .72, 'metal_dark')

    # ¡TAZA DE CAFÉ 3D ICÓNICA EN LA CIMA (visible desde toda la ciudad)!
    tx, ty, tz = 1.6, cy + .22, 1.4
    # Plato blanco con borde dorado
    m.cube(tx, ty, tz, 2.75, .14, 2.75, 'marble')
    m.cube(tx, ty + .12, tz, 2.85, .08, 2.85, 'gold')
    # Cuerpo de la taza (blanco/crema con franja dorada)
    m.cube(tx, ty + .16, tz, 1.65, .36, 1.65, 'trim_white')
    m.cube(tx, ty + .52, tz, 1.95, 1.15, 1.95, 'marble')
    m.cube(tx, ty + 1.38, tz, 2.02, .12, 2.02, 'gold')
    # Café oscuro humeante en el interior
    m.cube(tx, ty + 1.60, tz, 1.68, .12, 1.68, 'dark_planks')
    # Asa de la taza hacia el frente-este
    m.cube(tx + 1.18, ty + 1.35, tz, .48, .16, .24, 'marble')
    m.cube(tx + 1.18, ty + .68, tz, .48, .16, .24, 'marble')
    m.cube(tx + 1.38, ty + .68, tz, .18, .82, .24, 'marble')
    # Volutas de vapor estilizadas elevándose sobre la taza
    m.cube(tx - .25, ty + 1.95, tz - .10, .28, .48, .28, 'wool_white')
    m.cube(tx - .10, ty + 2.50, tz + .08, .26, .45, .26, 'wool_white')
    m.cube(tx + .28, ty + 2.15, tz + .22, .22, .42, .22, 'glow')
    m.cube(tx + .16, ty + 2.75, tz + .12, .20, .38, .20, 'wool_white')

    # =========================================================================
    # 7. TECHO INTERIOR ARTESONADO Y LÁMPARAS COLGANTES
    # =========================================================================
    m.group('Techo interior')
    I.slab(m, -hx, hx, -hz, hz, Hc - .28, .28, 'ceil_lit_wood')
    # Vigas cruzadas de madera oscura
    for z in (-3.6, 0.0, 3.6):
        m.cube(0, Hc - .50, z, W - 2 * T, .24, .26, 'dark_planks')
    for x in (-3.6, 0.0, 3.6):
        m.cube(x, Hc - .50, 0, .26, .24, D - 2 * T, 'dark_planks')

    # =========================================================================
    # 8. INTERIOR BARISTA ARTESANAL (con colisiones exactas en 'colision')
    # =========================================================================
    m.group('Barra Barista')
    # Mostrador en L con madera oscura + encimera de mármol
    I.counter(m, -3.9, -hz + 1.65, 4.8, 1.0, 'S')
    I.counter(m, -hx + 1.05, -hz + 3.9, 3.2, 1.0, 'E')
    # Encimera de mármol brillante encima de la barra
    m.cube(-3.9, 1.06, -hz + 1.65, 4.88, .08, 1.08, 'marble')
    m.cube(-hx + 1.05, 1.06, -hz + 3.9, 1.08, .08, 3.28, 'marble')
    # 4 taburetes de bar con cojín rojo
    for i in range(4):
        sx = -5.5 + i * 1.08
        I.stool(m, sx, -hz + 2.95)
        m.cube(sx, .78, -hz + 2.95, .44, .10, .44, 'cloth_red')
    # Cafetera Espresso profesional en cobre y acero
    I.lbox(m, -3.9, -hz + 1.65, 'S', .85, .0, 1.05, .64, 1.14, .76, 'copper')
    I.lbox(m, -3.9, -hz + 1.65, 'S', .85, .0, .92, .54, 1.90, .14, 'steel')
    I.lbox(m, -3.9, -hz + 1.65, 'S', .85, .32, .68, .08, 1.38, .32, 'brass')
    for k in range(3):
        I.cup(m, -4.85 + k * .28, 1.14, -hz + 1.50)
    # Vitrina iluminada de repostería con pasteles variados
    I.lbox(m, -3.9, -hz + 1.65, 'S', -1.55, .10, 1.45, .82, 1.14, .62, 'glass_clear')
    I.lbox(m, -3.9, -hz + 1.65, 'S', -1.55, .10, 1.32, .70, 1.14, .10, 'marble')
    for k, ct in enumerate(('icing_pink', 'icing_choc', 'cake')):
        I.lbox(m, -3.9, -hz + 1.65, 'S', -2.0 + k * .44, .10, .30, .30, 1.24, .24, ct)
    # Caja registradora + lámparas colgantes sobre la barra
    m.cube(-2.5, 1.14, -hz + 1.25, .48, .30, .40, 'metal_dark')
    m.cube(-2.5, 1.44, -hz + 1.25, .38, .16, .28, 'glow_cool')
    I.shelf_unit(m, -3.9, -hz + .42, 4.6, .58, 2.9, 'S', 4, 'goods', col=False)
    for u in (4.9, 3.7, 2.5):
        I.wall_item(m, W, D, 'N', u, 3.05, 1.0, .82, 'menu_board')
    for sx in (-5.0, -3.6, -2.2):
        I.pendant(m, sx, -hz + 2.4, Hc - .3, Hc - 1.35)

    # Zona Lounge y mesas acogedoras (dejando pasillo central de 3.2m completamente libre)
    m.group('Salón y Mesas')
    for (x, z) in ((-3.8, 1.6), (-3.8, 4.3), (3.8, -3.2), (3.8, .3), (3.8, 3.8)):
        I.round_table(m, x, z)
        I.chair(m, x - .92, z, 'E', 'cloth_red')
        I.chair(m, x + .92, z, 'W', 'cloth_cream')
        I.cup(m, x - .18, .88, z)
        I.potted_flower(m, x + .18, .88, z + .06)
        I.pendant(m, x, z, Hc - .3, Hc - 1.55, .58)

    m.group('Decoración Interior')
    for (x, z) in ((-hx + .55, hz - .55), (hx - .55, hz - .55), (hx - .55, -hz + .55)):
        I.plant(m, x, z, 1.75)
    I.shelf_unit(m, hx - .48, -hz + 3.2, 2.2, .56, 2.6, 'W', 4, 'books2')
    for u, t in ((-2.8, 'paint_a'), (2.4, 'paint_b')):
        I.wall_item(m, W, D, 'E', u, 2.2, 1.25, .95, t)
    for u, t in ((-1.4, 'paint_c'), (2.8, 'paint_a')):
        I.wall_item(m, W, D, 'W', u, 2.2, 1.25, .95, t)
