"""Rediseño artesanal de precisión desde cero de CAFÉ LUNA (ciudad/cafe.bbmodel).
Regla estricta: CERO caras coplanares (0 Z-fighting), CERO muebles incrustados,
medidas exactas compatibles con CITY_MODEL_DIMS (13 x 13 x 8.0 m, Hc = 4.5 m, puertas libres 3.2 x 3.0 m).
Se verifica automáticamente con: python tools/verificar_bbmodel.py ciudad/cafe.bbmodel
"""


def build_cafe_luna(m, rng, W, D, Hc, H, G, I):
    T = I.T      # grosor del muro exterior: 0.40 m (cara exterior en ±6.50, interior en ±6.10)
    DW = I.DW    # ancho puerta libre: 3.20 m (x en -1.60 .. +1.60)
    DH = I.DH    # alto puerta libre: 3.00 m (y en 0.00 .. 3.00)
    hx = W / 2 - T   # 6.10
    hz = D / 2 - T   # 6.10
    FY = 0.04        # altura exacta de la superficie del suelo interior (todos los muebles apoyan en FY)

    # Helper para cubo por rango exacto [x0, x1], [y0, y1], [z0, z1] -> imposible equivocarse en medidas
    def rbox(x0, y0, z0, x1, y1, z1, tile, rot=None):
        if x1 - x0 < 1e-4 or y1 - y0 < 1e-4 or z1 - z0 < 1e-4:
            return
        m.cube((x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0, tile, rot=rot)

    # Helper de pared por lado (cara exterior en ±6.50, interior en ±6.10)
    def wall_box(side, u0, u1, y0, y1, d0, d1, tile):
        """d0..d1 medido desde la cara exterior hacia AFUERA (d=0 es el plano exterior ±6.50; d=-0.40 es el interior ±6.10)."""
        if u1 - u0 < 1e-4 or y1 - y0 < 1e-4 or d1 - d0 < 1e-4:
            return
        if side == 'S':
            rbox(u0, y0, D / 2 + d0, u1, y1, D / 2 + d1, tile)
        elif side == 'N':
            rbox(-u1, y0, -D / 2 - d1, -u0, y1, -D / 2 - d0, tile)
        elif side == 'E':
            rbox(W / 2 + d0, y0, -u1, W / 2 + d1, y1, -u0, tile)
        else:  # W
            rbox(-W / 2 - d1, y0, u0, -W / 2 - d0, y1, u1, tile)

    # =========================================================================
    # 1. SUELO INTERIOR (piezas exactas sin solaparse) + ACERAS + ALFOMBRA
    # =========================================================================
    m.group('Suelo')
    BDR = 0.55  # cenefa oscura alrededor del salón
    # Centro de parqué de roble (dividido en losetas <= 4m para UV nítido, sin tocar la cenefa)
    I.slab(m, -hx + BDR, hx - BDR, -hz + BDR, hz - BDR, 0.0, FY, 'oak_planks')
    # Cenefa perimetral en 4 piezas exactas (N y S abarcan todo X; E y W van entre N y S -> 0 solape!)
    rbox(-hx, 0.0, hz - BDR, hx, FY, hz, 'dark_planks')
    rbox(-hx, 0.0, -hz, hx, FY, -hz + BDR, 'dark_planks')
    rbox(-hx, 0.0, -hz + BDR, -hx + BDR, FY, hz - BDR, 'dark_planks')
    rbox(hx - BDR, 0.0, -hz + BDR, hx, FY, hz - BDR, 'dark_planks')

    # Alfombra central interior: apoyada sobre FY (0.04..0.065), marco dorado en 4 tiras sin solape
    rx0, rx1, rz0, rz1, rb = -1.20, 1.20, -2.20, 2.80, 0.14
    rbox(rx0 + rb, FY, rz0 + rb, rx1 - rb, FY + 0.024, rz1 - rb, 'carpet_red')
    rbox(rx0, FY, rz1 - rb, rx1, FY + 0.024, rz1, 'gold')
    rbox(rx0, FY, rz0, rx1, FY + 0.024, rz0 + rb, 'gold')
    rbox(rx0, FY, rz0 + rb, rx0 + rb, FY + 0.024, rz1 - rb, 'gold')
    rbox(rx1 - rb, FY, rz0 + rb, rx1, FY + 0.024, rz1 - rb, 'gold')

    # Aceras exteriores de entrada (Norte y Sur) + tapete rojo sin Z-fighting
    for sg in (-1, 1):
        za = sg * (D / 2 + 0.02)
        zb = sg * (D / 2 + 1.18)
        z0, z1 = min(za, zb), max(za, zb)
        rbox(-DW / 2 - 1.0, 0.0, z0, DW / 2 + 1.0, 0.04, z1, 'trim_stone')
        # Tapete rojo encima de la acera (y = 0.04..0.065)
        mz0, mz1 = (D / 2 + 0.14, D / 2 + 0.96) if sg > 0 else (-D / 2 - 0.96, -D / 2 - 0.14)
        rbox(-1.30, 0.04, mz0, 1.30, 0.065, mz1, 'carpet_red')

    # =========================================================================
    # 2. PLANTA BAJA: MUROS SIN SOLAPE EN ESQUINAS + VENTANALES CON ARCO
    # =========================================================================
    m.group('Planta baja')
    H_WALL = Hc - 0.30  # 4.20 m (la losa interior y cornisa ocupan 4.20..4.50 -> 0 solape con muros!)

    def solid_wall_seg(side, u0, u1, y0, y1, wall_t='pl_peach', inner_t='wallpaper_cream'):
        for s0, s1 in G.split(u0, u1):
            # Capa exterior de -0.34..0.00, papel tapiz interior de -0.40..-0.34 (¡0 solape!)
            wall_box(side, s0, s1, y0, y1, -0.34, 0.0, wall_t)
            wall_box(side, s0, s1, y0, y1, -0.40, -0.34, inner_t)

    def cafe_window(side, c, ww, sill, wh, has_awning=False):
        y0, y1 = sill, sill + wh
        u0, u1 = c - ww / 2, c + ww / 2
        ft = 0.10  # grosor de marco de madera
        # Cristal principal embutido dentro del muro (-0.22..-0.17), dividido en parte baja clara y banda alta cálida
        split_y = y1 - 0.56
        wall_box(side, u0 + ft, u1 - ft, y0 + ft, split_y - 0.04, -0.22, -0.17, 'glass_clear')
        wall_box(side, u0 + ft, u1 - ft, split_y + 0.04, y1 - ft, -0.22, -0.17, 'glass_warm')

        # Marco exterior de madera oscura (d = -0.10..+0.06): horizontal completo, verticales ENTRE rieles (0 solape!)
        wall_box(side, u0, u1, y0, y0 + ft, -0.10, 0.06, 'dark_planks')
        wall_box(side, u0, u1, y1 - ft, y1, -0.10, 0.06, 'dark_planks')
        wall_box(side, u0, u0 + ft, y0 + ft, y1 - ft, -0.10, 0.06, 'dark_planks')
        wall_box(side, u1 - ft, u1, y0 + ft, y1 - ft, -0.10, 0.06, 'dark_planks')

        # Travesaño horizontal (split_y) y parteluces verticales (entre rieles, 0 solape!)
        wall_box(side, u0 + ft, u1 - ft, split_y - 0.04, split_y + 0.04, -0.14, 0.03, 'dark_planks')
        for frac in (-0.26, 0.26):
            mu = c + frac * ww
            wall_box(side, mu - 0.03, mu + 0.03, y0 + ft, split_y - 0.04, -0.14, 0.02, 'dark_planks')
            wall_box(side, mu - 0.03, mu + 0.03, split_y + 0.04, y1 - ft, -0.14, 0.02, 'dark_planks')

        # Alféizar saliente de piedra debajo (y0-0.12..y0) + 2 ménsulas (y0-0.28..y0-0.12)
        wall_box(side, u0 - 0.14, u1 + 0.14, y0 - 0.12, y0, 0.0, 0.26, 'trim_stone')
        for sg in (-1, 1):
            cu = c + sg * (ww * 0.38)
            wall_box(side, cu - 0.08, cu + 0.08, y0 - 0.28, y0 - 0.12, 0.0, 0.20, 'trim_stone')

        # Dintel saliente de piedra arriba (y1..y1+0.14) + remate blanco (y1+0.14..y1+0.26) + clave dorada frontal
        wall_box(side, u0 - 0.16, u1 + 0.16, y1, y1 + 0.14, 0.0, 0.24, 'trim_stone')
        wall_box(side, u0 + 0.12, u1 - 0.12, y1 + 0.14, y1 + 0.25, 0.0, 0.18, 'trim_white')
        wall_box(side, c - 0.14, c + 0.14, y1 + 0.02, y1 + 0.28, 0.24, 0.32, 'gold')

        # Jardinera de madera con flores bajo el alféizar (bien separada de las ménsulas, 0 solape!)
        wall_box(side, u0 + 0.15, u1 - 0.15, y0 - 0.34, y0 - 0.12, 0.20, 0.44, 'dark_planks')
        wall_box(side, u0 + 0.20, u1 - 0.20, y0 - 0.12, y0 + 0.04, 0.26, 0.42, 'plant')
        for k in range(4):
            fx = (u0 + 0.42) + k * ((ww - 0.84) / 3)
            wall_box(side, fx - 0.07, fx + 0.07, y0 + 0.04, y0 + 0.15, 0.28, 0.40,
                     'flower_pink' if k % 2 == 0 else 'flower_yellow')

        # Toldo escalonado curvo a rayas (en frente Sur y costado Este hacia la plaza)
        if has_awning:
            # 2 faldones escalonados sin solaparse + faldón vertical + bombillas colgando
            wall_box(side, u0 - 0.22, u1 + 0.22, y1 + 0.26, y1 + 0.38, 0.0, 0.62, 'awn_red')
            wall_box(side, u0 - 0.22, u1 + 0.22, y1 + 0.14, y1 + 0.26, 0.56, 1.12, 'awn_red')
            wall_box(side, u0 - 0.22, u1 + 0.22, y1 - 0.04, y1 + 0.14, 1.06, 1.14, 'awn_red')
            for k in range(5):
                lu = (u0 - 0.06) + k * ((ww + 0.12) / 4)
                wall_box(side, lu - 0.06, lu + 0.06, y1 + 0.02, y1 + 0.14, 0.78, 0.90, 'lamp')
            for sg in (-1, 1):
                su = c + sg * (ww / 2 + 0.18)
                wall_box(side, su - 0.03, su + 0.03, y1 - 0.26, y1 + 0.26, 0.0, 0.06, 'metal_dark')

    # --- Lados Norte (-Z) y Sur (+Z): van de u = -6.10 .. +6.10 (las esquinas 6.10..6.50 son pilastras limpias!) ---
    for side in ('S', 'N'):
        is_front = (side == 'S')
        # Tramos macizos alrededor de puerta (-1.60..+1.60) y 2 ventanales (-5.20..-2.40 y +2.40..+5.20)
        solid_wall_seg(side, -hx, -5.20, 0.0, H_WALL)
        solid_wall_seg(side, -2.40, -DW / 2, 0.0, H_WALL)
        solid_wall_seg(side, DW / 2, 2.40, 0.0, H_WALL)
        solid_wall_seg(side, 5.20, hx, 0.0, H_WALL)
        # Dintel sobre la puerta (y = 3.00 .. 4.20)
        solid_wall_seg(side, -DW / 2, DW / 2, DH, H_WALL)
        # Ventanales (ancho 2.80 m, sill 0.92 m, alto 2.38 m -> y = 0.92..3.30)
        for cx in (-3.80, 3.80):
            solid_wall_seg(side, cx - 1.40, cx + 1.40, 0.0, 0.92)
            solid_wall_seg(side, cx - 1.40, cx + 1.40, 3.30, H_WALL)
            cafe_window(side, cx, 2.80, 0.92, 2.38, has_awning=is_front)

        # Marco de puerta (fuera del hueco libre -1.60..+1.60 x 0..3.00!)
        for sg in (-1, 1):
            p0 = DW / 2 if sg > 0 else -DW / 2 - 0.30
            p1 = DW / 2 + 0.30 if sg > 0 else -DW / 2
            wall_box(side, p0, p1, 0.0, 0.42, 0.0, 0.16, 'stone_dark')
            wall_box(side, p0, p1, 0.42, DH, 0.0, 0.14, 'dark_planks')
        wall_box(side, -DW / 2 - 0.34, DW / 2 + 0.34, DH, DH + 0.24, 0.0, 0.18, 'dark_planks')
        wall_box(side, -DW / 2 - 0.40, DW / 2 + 0.40, DH + 0.24, DH + 0.34, 0.0, 0.22, 'gold')

        # Zócalo exterior de piedra (sin tapar la puerta ni el marco)
        wall_box(side, -hx, -DW / 2 - 0.30, 0.0, 0.42, 0.0, 0.10, 'stone_dark')
        wall_box(side, -hx, -DW / 2 - 0.30, 0.42, 0.52, 0.0, 0.13, 'trim_stone')
        wall_box(side, DW / 2 + 0.30, hx, 0.0, 0.42, 0.0, 0.10, 'stone_dark')
        wall_box(side, DW / 2 + 0.30, hx, 0.42, 0.52, 0.0, 0.13, 'trim_stone')

    # --- Lados Este (+X, mira a la plaza) y Oeste (-X): van de u = -6.10 .. +6.10 ---
    for side in ('E', 'W'):
        is_plaza = (side == 'E')
        # 3 ventanales amplios: centros -3.80, 0.00, +3.80, ancho 2.40 m
        solid_wall_seg(side, -hx, -5.00, 0.0, H_WALL)
        solid_wall_seg(side, -2.60, -1.20, 0.0, H_WALL)
        solid_wall_seg(side, 1.20, 2.60, 0.0, H_WALL)
        solid_wall_seg(side, 5.00, hx, 0.0, H_WALL)
        for cu in (-3.80, 0.00, 3.80):
            solid_wall_seg(side, cu - 1.20, cu + 1.20, 0.0, 0.92)
            solid_wall_seg(side, cu - 1.20, cu + 1.20, 3.30, H_WALL)
            cafe_window(side, cu, 2.40, 0.92, 2.38, has_awning=is_plaza)
        wall_box(side, -hx, hx, 0.0, 0.42, 0.0, 0.10, 'stone_dark')
        wall_box(side, -hx, hx, 0.42, 0.52, 0.0, 0.13, 'trim_stone')

    # =========================================================================
    # 3. PILASTRAS DE ESQUINA EXACTAS (ocupan las 4 esquinas 6.10..6.62) + PÓRTICO SUR
    # =========================================================================
    m.group('Esquinas y Pórtico')
    for sx in (-1, 1):
        for sz in (-1, 1):
            x0, x1 = (hx, W / 2 + 0.14) if sx > 0 else (-W / 2 - 0.14, -hx)
            z0, z1 = (hz, D / 2 + 0.14) if sz > 0 else (-D / 2 - 0.14, -hz)
            rbox(x0, 0.0, z0, x1, 0.52, z1, 'stone_dark')
            rbox(x0, 0.52, z0, x1, H_WALL - 0.24, z1, 'trim_white')
            rbox(x0, H_WALL - 0.24, z0, x1, H_WALL, z1, 'gold')
            # Faroles de bronce en las esquinas del frente Sur
            if sz > 0:
                cx = (x0 + x1) / 2
                rbox(cx - 0.07, 2.40, z1, cx + 0.07, 2.52, z1 + 0.30, 'brass')
                rbox(cx - 0.13, 2.06, z1 + 0.18, cx + 0.13, 2.40, z1 + 0.44, 'lamp')
                rbox(cx - 0.17, 2.52, z1 + 0.14, cx + 0.17, 2.60, z1 + 0.48, 'brass')

    # Pórtico frontal Sur (+Z): marquesina limpia apoyada en 2 columnas fuera del hueco de 3.2m
    zF = D / 2  # 6.50
    rbox(-2.30, DH + 0.34, zF + 0.02, 2.30, DH + 0.50, zF + 1.72, 'dark_planks')
    rbox(-2.10, DH + 0.50, zF + 0.10, 2.10, DH + 0.58, zF + 1.62, 'glass')
    rbox(-2.36, DH + 0.26, zF + 1.72, 2.36, DH + 0.44, zF + 1.82, 'gold')
    for ux in (-1.50, -0.75, 0.0, 0.75, 1.50):
        rbox(ux - 0.07, DH + 0.18, zF + 1.54, ux + 0.07, DH + 0.34, zF + 1.68, 'lamp')
    for sg in (-1, 1):
        px = sg * 2.06
        rbox(px - 0.19, 0.04, zF + 1.36, px + 0.19, 0.44, zF + 1.74, 'trim_stone')
        rbox(px - 0.12, 0.44, zF + 1.43, px + 0.12, DH + 0.18, zF + 1.67, 'dark_planks')
        rbox(px - 0.18, DH + 0.18, zF + 1.37, px + 0.18, DH + 0.34, zF + 1.73, 'gold')
        # Macetero alto con arbolito fuera de las columnas
        mx = sg * 2.88
        rbox(mx - 0.30, 0.0, zF + 0.46, mx + 0.30, 0.54, zF + 1.06, 'pot')
        rbox(mx - 0.09, 0.54, zF + 0.67, mx + 0.09, 1.02, zF + 0.85, 'bark')
        rbox(mx - 0.36, 1.02, zF + 0.40, mx + 0.36, 1.68, zF + 1.12, 'plant')
        rbox(mx - 0.12, 1.68, zF + 0.64, mx + 0.12, 1.86, zF + 0.88,
             'flower_pink' if sg < 0 else 'flower_yellow')

    # Pizarra caballete de menú en la vereda derecha (apoyada limpia en y = 0)
    m.cube(3.75, 0.0, zF + 0.72, 0.76, 1.14, 0.12, 'dark_planks', rot=[-8, -18, 0])
    m.cube(3.75, 0.18, zF + 0.80, 0.62, 0.80, 0.04, 'menu_board', rot=[-8, -18, 0])

    # =========================================================================
    # 4. TECHO INTERIOR ARTESONADO (y = 4.20..4.50) + BALCÓN PERIMETRAL (y = 4.50..5.70)
    # =========================================================================
    m.group('Techo interior')
    I.slab(m, -hx, hx, -hz, hz, H_WALL, 0.22, 'ceil_lit_wood')
    # Vigas de techo: X-vigas completas, Z-vigas segmentadas ENTRE X-vigas (0 solape!)
    beam_y0, beam_y1 = H_WALL - 0.22, H_WALL
    for bz in (-3.6, 0.0, 3.6):
        rbox(-hx, beam_y0, bz - 0.12, hx, beam_y1, bz + 0.12, 'dark_planks')
    for bx in (-3.6, 0.0, 3.6):
        rbox(bx - 0.12, beam_y0, -hz, bx + 0.12, beam_y1, -3.72, 'dark_planks')
        rbox(bx - 0.12, beam_y0, -3.48, bx + 0.12, beam_y1, -0.12, 'dark_planks')
        rbox(bx - 0.12, beam_y0, 0.12, bx + 0.12, beam_y1, 3.48, 'dark_planks')
        rbox(bx - 0.12, beam_y0, 3.72, bx + 0.12, beam_y1, hz, 'dark_planks')

    m.group('Balcón Perimetral')
    # Anillo de cornisa en 4.20..4.42 rodeando el techo interior (0 solape con Techo interior!)
    rbox(-W / 2 - 0.18, H_WALL, hz, W / 2 + 0.18, H_WALL + 0.22, D / 2 + 0.18, 'trim_white')
    rbox(-W / 2 - 0.18, H_WALL, -D / 2 - 0.18, W / 2 + 0.18, H_WALL + 0.22, -hz, 'trim_white')
    rbox(-W / 2 - 0.18, H_WALL, -hz, -hx, H_WALL + 0.22, hz, 'trim_white')
    rbox(hx, H_WALL, -hz, W / 2 + 0.18, H_WALL + 0.22, hz, 'trim_white')
    # Losas completas encima de 4.42 (4.42..4.64 -> 4.64..4.76)
    rbox(-W / 2 - 0.36, H_WALL + 0.22, -D / 2 - 0.36, W / 2 + 0.36, H_WALL + 0.44, D / 2 + 0.36, 'trim_stone')
    rbox(-W / 2 - 0.26, H_WALL + 0.44, -D / 2 - 0.26, W / 2 + 0.26, H_WALL + 0.56, D / 2 + 0.26, 'oak_planks')
    # Dentículos debajo de la cornisa (y = 4.04..4.20, por fuera de los muros d=+0.14..+0.32)
    for k in range(11):
        u = -5.5 + k * 1.1
        for sz in (-1, 1):
            z0 = D / 2 + 0.14 if sz > 0 else -D / 2 - 0.32
            rbox(u - 0.11, H_WALL - 0.16, z0, u + 0.11, H_WALL, z0 + 0.18, 'trim_stone')
        for sx in (-1, 1):
            x0 = W / 2 + 0.14 if sx > 0 else -W / 2 - 0.32
            rbox(x0, H_WALL - 0.16, u - 0.11, x0 + 0.18, H_WALL, u + 0.11, 'trim_stone')

    # Baranda de hierro forjado perimetral (y = 4.76..5.66) — 0 solape en postes y rieles!
    by0 = H_WALL + 0.56   # 4.76
    bh = 0.86
    bp = W / 2 + 0.10     # centro de postes de esquina: ±6.60
    # 4 postes de esquina con globos de luz cálida
    for sx in (-1, 1):
        for sz in (-1, 1):
            px, pz = sx * bp, sz * bp
            rbox(px - 0.18, by0, pz - 0.18, px + 0.18, by0 + bh + 0.16, pz + 0.18, 'trim_stone')
            rbox(px - 0.13, by0 + bh + 0.16, pz - 0.13, px + 0.13, by0 + bh + 0.42, pz + 0.13, 'lamp')
            rbox(px - 0.09, by0 + bh + 0.42, pz - 0.09, px + 0.09, by0 + bh + 0.50, pz + 0.09, 'gold')
    # Rieles y barrotes entre postes (-6.42 .. +6.42)
    rail_lo0, rail_lo1 = by0 + 0.04, by0 + 0.10
    rail_hi0, rail_hi1 = by0 + bh - 0.06, by0 + bh + 0.02
    for sz in (-1, 1):
        cz = sz * bp
        rbox(-bp + 0.18, rail_lo0, cz - 0.03, bp - 0.18, rail_lo1, cz + 0.03, 'metal_dark')
        rbox(-bp + 0.18, rail_hi0, cz - 0.04, bp - 0.18, rail_hi1, cz + 0.04, 'metal_dark')
        for k in range(21):
            ux = -6.0 + k * 0.60
            rbox(ux - 0.025, rail_lo1, cz - 0.025, ux + 0.025, rail_hi0, cz + 0.025, 'metal_dark')
    for sx in (-1, 1):
        cx = sx * bp
        rbox(cx - 0.03, rail_lo0, -bp + 0.18, cx + 0.03, rail_lo1, bp - 0.18, 'metal_dark')
        rbox(cx - 0.04, rail_hi0, -bp + 0.18, cx + 0.04, rail_hi1, bp - 0.18, 'metal_dark')
        for k in range(21):
            uz = -6.0 + k * 0.60
            rbox(cx - 0.025, rail_lo1, uz - 0.025, cx + 0.025, rail_hi0, uz + 0.025, 'metal_dark')

    # Pérgola floral limpia en la esquina SE del balcón (sin tocar barandas, paredes ni cornisa del tejado)
    p_y1 = by0 + 1.88  # 6.64 (las flores terminan en 7.00 < 7.06)
    for px, pz in ((5.55, 5.55), (5.55, 2.85), (2.85, 5.55)):
        rbox(px - 0.08, by0, pz - 0.08, px + 0.08, p_y1, pz + 0.08, 'dark_planks')
    for k in range(4):
        zbeam = 2.85 + k * 0.90
        rbox(2.75, p_y1, zbeam - 0.06, 5.75, p_y1 + 0.12, zbeam + 0.06, 'oak_planks')
    rbox(3.30, p_y1 + 0.12, 3.20, 5.50, p_y1 + 0.32, 5.40, 'plant')
    for fx, fz, fc in ((3.8, 3.7, 'flower_pink'), (5.0, 4.6, 'flower_yellow'), (4.3, 5.38, 'flower_pink')):
        rbox(fx - 0.11, p_y1 + 0.32, fz - 0.11, fx + 0.11, p_y1 + 0.46, fz + 0.11, fc)

    # =========================================================================
    # 5. SEGUNDA PLANTA RETRANQUEADA (10.4 x 10.4 m, y = 4.76 .. 7.06 m)
    # =========================================================================
    m.group('Planta alta')
    W2, D2 = 10.4, 10.4
    h2 = 2.30
    y2_0, y2_1 = by0, by0 + h2  # 4.76 .. 7.06
    # Cuerpo central crema (10.2 x 10.2 para que las pilastras de esquina no se solapen)
    rbox(-W2 / 2, y2_0, -D2 / 2, W2 / 2, y2_1, D2 / 2, 'pl_cream')
    # Pilastras exteriores en las 4 esquinas (sobresaliendo fuera de ±5.20 -> 0 solape!)
    for sx in (-1, 1):
        for sz in (-1, 1):
            x0, x1 = (W2 / 2, W2 / 2 + 0.22) if sx > 0 else (-W2 / 2 - 0.22, -W2 / 2)
            z0, z1 = (D2 / 2, D2 / 2 + 0.22) if sz > 0 else (-D2 / 2 - 0.22, -D2 / 2)
            rbox(x0, y2_0, z0, x1, y2_1 - 0.18, z1, 'dark_planks')
            rbox(x0, y2_1 - 0.18, z0, x1, y2_1, z1, 'gold')

    # Ventanas francesas cálidas con contraventanas verdes en los 4 lados (salen fuera de ±5.20 -> 0 solape!)
    def upper_window(side, u):
        wy0, wy1, ww2 = y2_0 + 0.38, y2_0 + 1.86, 1.40
        hw2 = ww2 / 2
        if side == 'S':
            z = D2 / 2
            rbox(u - hw2, wy0, z, u + hw2, wy1, z + 0.08, 'glass_warm')
            rbox(u - hw2 - 0.12, wy0 - 0.10, z, u + hw2 + 0.12, wy0, z + 0.20, 'trim_stone')
            rbox(u - hw2 - 0.14, wy1, z, u + hw2 + 0.14, wy1 + 0.12, z + 0.22, 'trim_stone')
            for sg in (-1, 1):
                sx0 = u + hw2 + 0.04 if sg > 0 else u - hw2 - 0.42
                rbox(sx0, wy0, z, sx0 + 0.38, wy1, z + 0.07, 'awn_green')
        elif side == 'N':
            z = -D2 / 2
            rbox(u - hw2, wy0, z - 0.08, u + hw2, wy1, z, 'glass_warm')
            rbox(u - hw2 - 0.12, wy0 - 0.10, z - 0.20, u + hw2 + 0.12, wy0, z, 'trim_stone')
            rbox(u - hw2 - 0.14, wy1, z - 0.22, u + hw2 + 0.14, wy1 + 0.12, z, 'trim_stone')
            for sg in (-1, 1):
                sx0 = u + hw2 + 0.04 if sg > 0 else u - hw2 - 0.42
                rbox(sx0, wy0, z - 0.07, sx0 + 0.38, wy1, z, 'awn_green')
        elif side == 'E':
            x = W2 / 2
            rbox(x, wy0, u - hw2, x + 0.08, wy1, u + hw2, 'glass_warm')
            rbox(x, wy0 - 0.10, u - hw2 - 0.12, x + 0.20, wy0, u + hw2 + 0.12, 'trim_stone')
            rbox(x, wy1, u - hw2 - 0.14, x + 0.22, wy1 + 0.12, u + hw2 + 0.14, 'trim_stone')
            for sg in (-1, 1):
                sz0 = u + hw2 + 0.04 if sg > 0 else u - hw2 - 0.42
                rbox(x, wy0, sz0, x + 0.07, wy1, sz0 + 0.38, 'awn_green')
        else:
            x = -W2 / 2
            rbox(x - 0.08, wy0, u - hw2, x, wy1, u + hw2, 'glass_warm')
            rbox(x - 0.20, wy0 - 0.10, u - hw2 - 0.12, x, wy0, u + hw2 + 0.12, 'trim_stone')
            rbox(x - 0.22, wy1, u - hw2 - 0.14, x, wy1 + 0.12, u + hw2 + 0.14, 'trim_stone')
            for sg in (-1, 1):
                sz0 = u + hw2 + 0.04 if sg > 0 else u - hw2 - 0.42
                rbox(x - 0.07, wy0, sz0, x, wy1, sz0 + 0.38, 'awn_green')

    for side in 'SNEW':
        for u in (-3.0, 0.0, 3.0):
            if side == 'S' and abs(u) < 0.1:
                continue  # el centro frontal Sur lleva el Emblema de la Media Luna
            upper_window(side, u)

    # =========================================================================
    # 6. EMBLEMA 3D DE LA MEDIA LUNA DORADA (frente Sur, sobre el balcón)
    # =========================================================================
    m.group('Emblema Luna')
    # Letrero frontal apoyado sobre el borde de la marquesina (z = 6.72..6.96, y = 4.76..5.86)
    sz0, sz1 = D / 2 + 0.24, D / 2 + 0.44
    rbox(-2.40, by0 + 0.08, sz0, 2.40, by0 + 1.06, sz1, 'sign_dark')
    rbox(-2.52, by0, sz0 - 0.02, 2.52, by0 + 0.08, sz1 + 0.04, 'gold')
    rbox(-2.52, by0 + 1.06, sz0 - 0.02, 2.52, by0 + 1.14, sz1 + 0.04, 'gold')
    rbox(-2.52, by0 + 0.08, sz0 - 0.02, -2.40, by0 + 1.06, sz1 + 0.04, 'gold')
    rbox(2.40, by0 + 0.08, sz0 - 0.02, 2.52, by0 + 1.06, sz1 + 0.04, 'gold')

    # Medallón nocturno sobre la fachada alta (pegado a z = D2/2 = 5.20..5.38)
    mz0, mz1 = D2 / 2, D2 / 2 + 0.18
    my0 = y2_0 + 0.30
    rbox(-0.92, my0 + 0.10, mz0, 0.92, my0 + 1.74, mz1, 'night')
    rbox(-1.02, my0, mz0, 1.02, my0 + 0.10, mz1 + 0.06, 'gold')
    rbox(-1.02, my0 + 1.74, mz0, 1.02, my0 + 1.84, mz1 + 0.06, 'gold')
    # Media luna creciente 3D sin cubos solapados (y = my0+0.22..my0+1.62)
    moon_boxes = [
        (-0.34, 0.22, 0.22, 0.44),
        (-0.56, 0.44, -0.24, 0.68),
        (-0.62, 0.68, -0.34, 1.12),
        (-0.56, 1.12, -0.24, 1.36),
        (-0.34, 1.36, 0.22, 1.58),
    ]
    for mx0, dy0, mx1, dy1 in moon_boxes:
        rbox(mx0, my0 + dy0, mz1, mx1, my0 + dy1, mz1 + 0.12, 'gold')
        rbox(mx0 + 0.04, my0 + dy0 + 0.04, mz1 + 0.12, mx1 - 0.04, my0 + dy1 - 0.04, mz1 + 0.17, 'glow')
    rbox(0.24, my0 + 0.96, mz1, 0.44, my0 + 1.16, mz1 + 0.10, 'lamp')
    rbox(0.46, my0 + 0.62, mz1, 0.60, my0 + 0.76, mz1 + 0.10, 'lamp')

    # =========================================================================
    # 7. TEJADO MANSARDA LIMPIO + 4 BUHARDILLAS + CHIMENEA + TAZA DE CAFÉ 3D
    # =========================================================================
    m.group('Tejado Mansarda')
    yr = y2_1  # 7.06
    rbox(-W2 / 2 - 0.36, yr, -D2 / 2 - 0.36, W2 / 2 + 0.36, yr + 0.16, D2 / 2 + 0.36, 'trim_stone')
    rbox(-W2 / 2 - 0.24, yr + 0.16, -D2 / 2 - 0.24, W2 / 2 + 0.24, yr + 0.26, D2 / 2 + 0.24, 'gold')
    cy = yr + 0.26
    levels = [
        (10.4, 10.4, 0.36),
        (9.6, 9.6, 0.38),
        (8.8, 8.8, 0.38),
        (8.0, 8.0, 0.36),
        (7.2, 7.2, 0.32),
    ]
    for lw, ld, lh in levels:
        rbox(-lw / 2, cy, -ld / 2, lw / 2, cy + lh, ld / 2, 'concrete_dark')
        # Ribetes de bronce estrictamente POR FUERA de las 4 esquinas (0 solape!)
        for sx in (-1, 1):
            for sz in (-1, 1):
                rx_a = lw / 2 if sx > 0 else -lw / 2 - 0.12
                rz_a = ld / 2 if sz > 0 else -ld / 2 - 0.12
                rbox(rx_a, cy, rz_a, rx_a + 0.12, cy + lh, rz_a + 0.12, 'brass')
        cy += lh

    topW, topD = 7.2, 7.2
    rbox(-topW / 2 - 0.14, cy, -topD / 2 - 0.14, topW / 2 + 0.14, cy + 0.14, topD / 2 + 0.14, 'trim_stone')
    cy += 0.14
    rbox(-topW / 2 + 0.10, cy, -topD / 2 + 0.10, topW / 2 - 0.10, cy + 0.06, topD / 2 - 0.10, 'roof_tar')
    top_y = cy + 0.06
    for sx in (-1, 1):
        for sz in (-1, 1):
            cx_p, cz_p = sx * (topW / 2 - 0.02), sz * (topD / 2 - 0.02)
            rbox(cx_p - 0.10, cy, cz_p - 0.10, cx_p + 0.10, cy + 0.52, cz_p + 0.10, 'gold')
            rbox(cx_p - 0.07, cy + 0.52, cz_p - 0.07, cx_p + 0.07, cy + 0.66, cz_p + 0.07, 'lamp')

    # 4 Buhardillas en los costados (salen limpiamente fuera del nivel inferior del tejado)
    m.group('Buhardillas')
    dy0 = yr + 0.30
    for sg in (-1, 1):
        # Sur / Norte
        za = sg * 4.40
        zb = sg * 5.25
        z0, z1 = min(za, zb), max(za, zb)
        rbox(-1.05, dy0, z0, 1.05, dy0 + 1.25, z1, 'pl_cream')
        wz0, wz1 = (z1, z1 + 0.07) if sg > 0 else (z0 - 0.07, z0)
        rbox(-0.65, dy0 + 0.18, wz0, 0.65, dy0 + 1.04, wz1, 'glass_warm')
        rbox(-1.20, dy0 + 1.25, z0 - 0.06, 1.20, dy0 + 1.45, z1 + 0.06, 'concrete_dark')
        rbox(-0.80, dy0 + 1.45, z0 - 0.04, 0.80, dy0 + 1.65, z1 + 0.04, 'concrete_dark')
        rbox(-0.35, dy0 + 1.65, z0 - 0.02, 0.35, dy0 + 1.82, z1 + 0.02, 'gold')
        # Este / Oeste
        xa = sg * 4.40
        xb = sg * 5.25
        x0, x1 = min(xa, xb), max(xa, xb)
        rbox(x0, dy0, -1.05, x1, dy0 + 1.25, 1.05, 'pl_cream')
        wx0, wx1 = (x1, x1 + 0.07) if sg > 0 else (x0 - 0.07, x0)
        rbox(wx0, dy0 + 0.18, -0.65, wx1, dy0 + 1.04, 0.65, 'glass_warm')
        rbox(x0 - 0.06, dy0 + 1.25, -1.20, x1 + 0.06, dy0 + 1.45, 1.20, 'concrete_dark')
        rbox(x0 - 0.04, dy0 + 1.45, -0.80, x1 + 0.04, dy0 + 1.65, 0.80, 'concrete_dark')
        rbox(x0 - 0.02, dy0 + 1.65, -0.35, x1 + 0.02, dy0 + 1.82, 0.35, 'gold')

    # Chimenea de ladrillo + Taza de Café 3D icónica (apoyadas exactamente en top_y, 0 solape!)
    m.group('Chimenea y Taza Icono')
    rbox(-2.85, top_y, -2.55, -1.75, top_y + 1.75, -1.45, 'br_red')
    rbox(-2.98, top_y + 1.75, -2.68, -1.62, top_y + 1.95, -1.32, 'trim_stone')
    rbox(-2.65, top_y + 1.95, -2.35, -1.95, top_y + 2.28, -1.65, 'metal_dark')

    # Taza de café gigante 3D en la cima (esquina SE de la azotea)
    tx, tz = 1.10, 0.90
    rbox(tx - 1.35, top_y, tz - 1.35, tx + 1.35, top_y + 0.12, tz + 1.35, 'marble')
    rbox(tx - 1.42, top_y + 0.12, tz - 1.42, tx + 1.42, top_y + 0.20, tz + 1.42, 'gold')
    rbox(tx - 0.82, top_y + 0.20, tz - 0.82, tx + 0.82, top_y + 0.54, tz + 0.82, 'trim_white')
    rbox(tx - 0.96, top_y + 0.54, tz - 0.96, tx + 0.96, top_y + 1.54, tz + 0.96, 'marble')
    rbox(tx - 1.02, top_y + 1.54, tz - 1.02, tx + 1.02, top_y + 1.66, tz + 1.02, 'gold')
    rbox(tx - 0.82, top_y + 1.66, tz - 0.82, tx + 0.82, top_y + 1.72, tz + 0.82, 'dark_planks')
    # Asa de la taza (strictly outside x = tx + 0.96, 0 solape!)
    rbox(tx + 0.96, top_y + 1.30, tz - 0.12, tx + 1.46, top_y + 1.46, tz + 0.12, 'marble')
    rbox(tx + 0.96, top_y + 0.68, tz - 0.12, tx + 1.46, top_y + 0.84, tz + 0.12, 'marble')
    rbox(tx + 1.30, top_y + 0.84, tz - 0.12, tx + 1.46, top_y + 1.30, tz + 0.12, 'marble')
    # Volutas de vapor flotando
    rbox(tx - 0.36, top_y + 1.98, tz - 0.20, tx - 0.10, top_y + 2.42, tz + 0.06, 'wool_white')
    rbox(tx - 0.14, top_y + 2.54, tz + 0.04, tx + 0.10, top_y + 2.94, tz + 0.28, 'wool_white')
    rbox(tx + 0.22, top_y + 2.16, tz + 0.16, tx + 0.44, top_y + 2.54, tz + 0.38, 'glow')

    # =========================================================================
    # 8. INTERIOR BARISTA ARTESANAL (0 Z-fighting, 0 choques, vitrina abierta!)
    # =========================================================================
    m.group('Barra Barista')
    # Mostrador en L con geometría 100% limpia (ala Norte: x=-5.80..-1.75, z=-5.00..-4.05; ala Oeste: x=-5.80..-4.85, z=-4.05..-1.55)
    # Zócalo oscuro (FY..0.16), cuerpo de madera (0.16..1.04), encimera de mármol (1.04..1.14) — SIN solaparse en la esquina!
    # Ala Norte (completa)
    rbox(-5.80, FY, -5.00, -1.75, 0.16, -4.05, 'metal_dark')
    rbox(-5.80, 0.16, -5.00, -1.75, 1.04, -4.05, 'counter_front')
    rbox(-5.85, 1.04, -5.04, -1.70, 1.14, -4.00, 'marble')
    m.col(-3.775, -4.525, 4.10, 1.00, 1.14)

    # Ala Oeste (empieza exactamente en z = -4.00 para la encimera y z = -4.05 para el cuerpo -> 0 solape!)
    rbox(-5.80, FY, -4.05, -4.85, 0.16, -1.55, 'metal_dark')
    rbox(-5.80, 0.16, -4.05, -4.85, 1.04, -1.55, 'counter_front')
    rbox(-5.85, 1.04, -4.00, -4.80, 1.14, -1.50, 'marble')
    m.col(-5.325, -2.80, 1.00, 2.50, 1.14)

    # Taburetes de bar limpios (3 al frente del ala Norte + 2 junto al ala Oeste — 0 choques con la barra!)
    def cafe_stool(sx, sz):
        rbox(sx - 0.18, FY, sz - 0.18, sx + 0.18, FY + 0.05, sz + 0.18, 'metal_dark')
        rbox(sx - 0.05, FY + 0.05, sz - 0.05, sx + 0.05, 0.66, sz + 0.05, 'metal_dark')
        rbox(sx - 0.16, 0.28, sz - 0.16, sx + 0.16, 0.32, sz + 0.16, 'brass')
        rbox(sx - 0.23, 0.66, sz - 0.23, sx + 0.23, 0.76, sz + 0.23, 'cloth_red')
        m.col(sx, sz, 0.46, 0.46, 0.76)

    for sx in (-4.15, -3.15, -2.15):
        cafe_stool(sx, -3.40)
    for sz in (-2.95, -2.00):
        cafe_stool(-4.20, sz)

    # Cafetera Espresso profesional en cobre + acero + latón (apoyada limpia en y = 1.14)
    rbox(-3.55, 1.14, -4.82, -2.55, 1.82, -4.22, 'copper')
    rbox(-3.48, 1.82, -4.76, -2.62, 1.94, -4.28, 'steel')
    rbox(-3.40, 1.30, -4.22, -2.70, 1.66, -4.16, 'brass')
    for k in range(3):
        cx = -4.35 + k * 0.24
        rbox(cx - 0.07, 1.14, -4.55, cx + 0.07, 1.28, -4.41, 'marble')

    # Vitrina ABIERTA de repostería (sin caja azul opaca: pedestal + 4 postes finos de latón + techo + 3 pasteles visibles!)
    vx0, vx1, vz0, vz1 = -5.65, -4.55, -4.88, -4.18
    rbox(vx0, 1.14, vz0, vx1, 1.22, vz1, 'dark_planks')
    # 3 pasteles coloridos claramente visibles encima del pedestal
    rbox(-5.52, 1.22, -4.68, -5.22, 1.48, -4.38, 'icing_pink')
    rbox(-5.20, 1.22, -4.68, -4.90, 1.50, -4.38, 'icing_choc')
    rbox(-4.88, 1.22, -4.68, -4.60, 1.46, -4.38, 'cake')
    # 4 esquineros finos de latón + tapa superior con luz cálida
    for px in (vx0, vx1 - 0.05):
        for pz in (vz0, vz1 - 0.05):
            rbox(px, 1.22, pz, px + 0.05, 1.72, pz + 0.05, 'brass')
    rbox(vx0, 1.72, vz0, vx1, 1.78, vz1, 'gold')
    rbox(vx0 + 0.12, 1.68, vz0 + 0.12, vx1 - 0.12, 1.72, vz1 - 0.12, 'lamp')

    # Caja registradora (en el extremo derecho de la barra)
    rbox(-2.35, 1.14, -4.70, -1.88, 1.44, -4.30, 'metal_dark')
    rbox(-2.28, 1.44, -4.62, -1.94, 1.60, -4.38, 'glow_cool')

    # Estantería trasera de madera con frascos/tazas (contra pared Norte z = -6.10, sin solapar)
    rbox(-5.70, FY, -6.08, -1.90, 2.95, -5.98, 'dark_planks')
    rbox(-5.70, FY, -5.98, -5.58, 2.95, -5.55, 'dark_planks')
    rbox(-2.02, FY, -5.98, -1.90, 2.95, -5.55, 'dark_planks')
    rbox(-5.70, 2.95, -6.08, -1.90, 3.05, -5.55, 'dark_planks')
    for lv in range(4):
        sy = 0.55 + lv * 0.62
        rbox(-5.58, sy, -5.98, -2.02, sy + 0.07, -5.56, 'oak_planks')
        rbox(-5.48, sy + 0.07, -5.90, -2.12, sy + 0.48, -5.66, 'goods')

    # Pizarras de menú colgadas sobre la estantería (contra pared Norte, y = 3.12..3.88)
    for mx in (-5.0, -3.8, -2.6):
        rbox(mx - 0.48, 3.14, -6.08, mx + 0.48, 3.88, -6.02, 'menu_board')

    # Lámparas colgantes sobre la barra (colgando del techo H_WALL = 4.20)
    def cafe_pendant(px, pz, y_lamp):
        rbox(px - 0.025, y_lamp + 0.28, pz - 0.025, px + 0.025, H_WALL, pz + 0.025, 'metal_dark')
        rbox(px - 0.22, y_lamp + 0.16, pz - 0.22, px + 0.22, y_lamp + 0.28, pz + 0.22, 'brass')
        rbox(px - 0.30, y_lamp + 0.06, pz - 0.30, px + 0.30, y_lamp + 0.16, pz + 0.30, 'metal_dark')
        rbox(px - 0.22, y_lamp, pz - 0.22, px + 0.22, y_lamp + 0.06, pz + 0.22, 'glow')

    for px in (-4.80, -3.45, -2.15):
        cafe_pendant(px, -4.50, 3.05)

    # =========================================================================
    # 9. SALÓN DE MESAS Y SILLAS (geometría limpia 100%, 0 solapes!)
    # =========================================================================
    m.group('Salón y Mesas')

    def cafe_table(tx, tz):
        # Base y pedestal apoyados en FY = 0.04, tapa sólida única en 0.76..0.84 (0 Z-fighting!)
        rbox(tx - 0.34, FY, tz - 0.34, tx + 0.34, FY + 0.08, tz + 0.34, 'dark_planks')
        rbox(tx - 0.09, FY + 0.08, tz - 0.09, tx + 0.09, 0.76, tz + 0.09, 'dark_planks')
        rbox(tx - 0.50, 0.76, tz - 0.50, tx + 0.50, 0.84, tz + 0.50, 'oak_planks')
        # Taza y florero encima (y = 0.84+)
        rbox(tx - 0.26, 0.84, tz - 0.08, tx - 0.12, 0.98, tz + 0.06, 'marble')
        rbox(tx + 0.10, 0.84, tz - 0.10, tx + 0.28, 1.00, tz + 0.08, 'pot')
        rbox(tx + 0.08, 1.00, tz - 0.12, tx + 0.30, 1.14, tz + 0.10, 'plant')
        rbox(tx + 0.14, 1.14, tz - 0.06, tx + 0.24, 1.24, tz + 0.04, 'flower_pink')
        m.col(tx, tz, 1.00, 1.00, 0.84)

    def cafe_chair(cx, cz, face, seat_t):
        # 4 patas apoyadas en FY (0.04..0.44), asiento (0.44..0.52), respaldo (0.52..1.00) — 0 solape!
        for sx in (-0.19, 0.19):
            for sz in (-0.19, 0.19):
                rbox(cx + sx - 0.04, FY, cz + sz - 0.04, cx + sx + 0.04, 0.44, cz + sz + 0.04, 'dark_planks')
        rbox(cx - 0.24, 0.44, cz - 0.24, cx + 0.24, 0.52, cz + 0.24, seat_t)
        if face == 'E':
            rbox(cx - 0.24, 0.52, cz - 0.24, cx - 0.16, 1.00, cz + 0.24, seat_t)
        elif face == 'W':
            rbox(cx + 0.16, 0.52, cz - 0.24, cx + 0.24, 1.00, cz + 0.24, seat_t)
        elif face == 'N':
            rbox(cx - 0.24, 0.52, cz + 0.16, cx + 0.24, 1.00, cz + 0.24, seat_t)
        else:
            rbox(cx - 0.24, 0.52, cz - 0.24, cx + 0.24, 1.00, cz - 0.16, seat_t)
        m.col(cx, cz, 0.48, 0.48, 0.96)

    # 5 mesas bien espaciadas lejos de paredes (±6.10) y lejos del pasillo central (-1.60..+1.60)
    for (tx, tz) in ((-3.75, 1.20), (-3.75, 4.10), (3.75, -3.20), (3.75, 0.30), (3.75, 3.80)):
        cafe_table(tx, tz)
        cafe_chair(tx - 0.88, tz, 'E', 'cloth_red')
        cafe_chair(tx + 0.88, tz, 'W', 'cloth_cream')
        cafe_pendant(tx, tz, 2.85)

    # =========================================================================
    # 10. DECORACIÓN INTERIOR (librería, cuadros, plantas en esquinas)
    # =========================================================================
    m.group('Decoración Interior')
    # Plantas limpias en 3 esquinas (apoyadas en FY = 0.04, sin solapes internos!)
    def cafe_plant(px, pz):
        rbox(px - 0.28, FY, pz - 0.28, px + 0.28, 0.56, pz + 0.28, 'pot')
        rbox(px - 0.07, 0.56, pz - 0.07, px + 0.07, 1.05, pz + 0.07, 'bark')
        rbox(px - 0.44, 1.05, pz - 0.44, px + 0.44, 1.50, pz + 0.44, 'plant')
        rbox(px - 0.30, 1.50, pz - 0.30, px + 0.30, 1.88, pz + 0.30, 'green_dark')
        m.col(px, pz, 0.60, 0.60, 1.80)

    for (px, pz) in ((-5.45, 5.45), (5.45, 5.45), (5.45, -5.45)):
        cafe_plant(px, pz)

    # Librería acogedora contra pared Este (entre las ventanas, en z = -2.35..-1.45, x = 5.56..6.08)
    rbox(5.98, FY, -2.50, 6.08, 2.55, -1.30, 'dark_planks')
    rbox(5.58, FY, -2.50, 5.98, 2.55, -2.40, 'dark_planks')
    rbox(5.58, FY, -1.40, 5.98, 2.55, -1.30, 'dark_planks')
    rbox(5.58, 2.55, -2.50, 6.08, 2.65, -1.30, 'dark_planks')
    for lv in range(4):
        sy = 0.45 + lv * 0.52
        rbox(5.60, sy, -2.40, 5.98, sy + 0.06, -1.40, 'oak_planks')
        rbox(5.68, sy + 0.06, -2.36, 5.94, sy + 0.42, -1.44, 'books' if lv % 2 == 0 else 'books2')
    m.col(5.83, -1.90, 0.52, 1.20, 2.65)

    # Cuadros colgados en tramos de pared macizos (sin cruzar ventanas!)
    rbox(6.02, 2.05, 1.42, 6.08, 2.95, 2.38, 'paint_a')
    rbox(-6.08, 2.05, 1.42, -6.02, 2.95, 2.38, 'paint_b')
    rbox(-6.08, 2.05, -2.38, -6.02, 2.95, -1.42, 'paint_c')
