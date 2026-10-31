"""Tiles dibujados directamente a 64 px (16 px por metro): materiales con detalle fino y a escala real."""
import gen_edificios as G
from gen_edificios import add_tile, hexrgb, shade, TS

NAT = ('marble', 'garage_floor', 'pegboard', 'tile_white', 'wall_wood', 'wallpaper_cream', 'carpet_red', 'carpet_arcade', 'counter_top',
       'books', 'books2', 'goods', 'fridge')


def native_tiles():
    def n(name, fn):
        add_tile(name, fn, True)

    def px(im, x, y, c, k=1.0):
        im.putpixel((x, y), shade(c, k))

    def marble(d, im, rng):
        bl = G.blotch(rng)
        base = hexrgb('#efe9dc')
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, base, 1 + bl(x / TS, y / TS) * .03 + rng.uniform(-.015, .015))
        for _ in range(5):
            x = rng.randint(0, TS - 1)
            for i in range(TS):
                x = max(0, min(TS - 1, x + rng.choice((-1, 0, 0, 1))))
                px(im, x, i, hexrgb('#bdb6a6'))
                if x + 1 < TS:
                    px(im, x + 1, i, hexrgb('#d6d0c2'))
        for i in range(TS):
            px(im, i, 0, hexrgb('#cbc5b6'))
            px(im, 0, i, hexrgb('#cbc5b6'))
    n('marble', marble)

    def garage(d, im, rng):
        bl = G.blotch(rng)
        base = hexrgb('#8c9194')
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, base, 1 + bl(x / TS, y / TS) * .07 + rng.uniform(-.05, .05))
        for _ in range(60):
            px(im, rng.randint(0, TS - 1), rng.randint(0, TS - 1), base, rng.choice((.82, 1.15)))
        for (cx, cy, r) in ((14, 40, 4), (46, 18, 3)):
            for y in range(TS):
                for x in range(TS):
                    if (x - cx) ** 2 + (y - cy) ** 2 < r * r + rng.randint(-2, 2):
                        px(im, x, y, hexrgb('#6b7074'), 1 + rng.uniform(-.04, .04))
        x = 8
        for i in range(TS):
            x = max(0, min(TS - 1, x + rng.choice((-1, 0, 1))))
            if i % 3:
                px(im, x, i, base, .72)
    n('garage_floor', garage)

    def pegb(d, im, rng):
        base = hexrgb('#b99a6c')
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, base, 1 + rng.uniform(-.04, .04))
        for y in range(2, TS, 4):
            for x in range(2, TS, 4):
                px(im, x, y, hexrgb('#4a3722'))
    n('pegboard', pegb)

    def tile_w(d, im, rng):
        base = hexrgb('#eceae2')
        for y in range(TS):
            for x in range(TS):
                k = 1 + rng.uniform(-.02, .02)
                if x % 8 == 0 or y % 8 == 0:
                    k = .78
                elif x % 8 == 1 or y % 8 == 1:
                    k = 1.04
                px(im, x, y, base, k)
    n('tile_white', tile_w)

    def wallw(d, im, rng):
        for bx in range(0, TS, 4):
            kb = 1 + rng.uniform(-.1, .1)
            for y in range(TS):
                for x in range(bx, bx + 4):
                    k = kb * (.72 if x == bx + 3 else (1.06 if x == bx else 1)) * (1 + rng.uniform(-.03, .03))
                    if (y * 5 + bx) % 13 == 0:
                        k *= .94
                    px(im, x, y, hexrgb('#c9a272'), k)
    n('wall_wood', wallw)

    def wallp(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                k = 1 + rng.uniform(-.015, .015)
                col = hexrgb('#f1e6cc') if (x // 4) % 2 == 0 else hexrgb('#e9dbba')
                if x % 8 == 0:
                    col = hexrgb('#d9c79c')
                if (x % 8 == 4) and (y % 8 == 3):
                    col = hexrgb('#d8b48a')
                px(im, x, y, col, k)
    n('wallpaper_cream', wallp)

    def carpet(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, hexrgb('#8d2f3b'), 1 + rng.uniform(-.08, .08) + (.05 if (x + y) % 4 == 0 else 0))
    n('carpet_red', carpet)

    def carpet_arc(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                col = hexrgb('#1c2146')
                if x % 16 == 0 or y % 16 == 0:
                    col = hexrgb('#2e3a78')
                px(im, x, y, col, 1 + rng.uniform(-.05, .05))
        for (x, y, c) in ((6, 6, '#ff5fc2'), (38, 22, '#5ff0ff'), (22, 46, '#ffe45f'), (52, 56, '#7dff7d'), (50, 8, '#ff5fc2')):
            for dx in range(2):
                for dy in range(2):
                    px(im, x + dx, y + dy, hexrgb(c))
    n('carpet_arcade', carpet_arc)

    def counter_top(d, im, rng):
        bl = G.blotch(rng)
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, hexrgb('#ebe7da'), 1 + bl(x / TS, y / TS) * .03 + rng.uniform(-.012, .012))
        for i in range(TS):
            px(im, i, 0, hexrgb('#c9c4b3'))
    n('counter_top', counter_top)

    def books(pal, name):
        def f(d, im, rng):
            for y in range(TS):
                for x in range(TS):
                    px(im, x, y, hexrgb('#3a2414'), 1 + rng.uniform(-.05, .05))
            x = 0
            while x < TS:
                w = rng.choice((2, 2, 3, 3, 4))
                c = hexrgb(rng.choice(pal))
                top = rng.randint(3, 16)
                band = rng.randint(top + 6, TS - 14)
                for xx in range(x, min(TS, x + w)):
                    for y in range(top, TS - 4):
                        k = (1.12 if xx == x else (.78 if xx == x + w - 1 else 1.0)) * (1 + rng.uniform(-.04, .04))
                        px(im, xx, y, hexrgb('#e8d08a') if band <= y <= band + 1 else c, k)
                x += w
            for y in range(TS - 4, TS):
                for xx in range(TS):
                    px(im, xx, y, hexrgb('#7a5030'), 1.1 if y == TS - 4 else .85)
        n(name, f)
    books(['#b23b3b', '#3b6fb2', '#3fa05a', '#d9ad4a', '#7a4cb0', '#e0e0d0', '#c2662c'], 'books')
    books(['#8e2f2f', '#2f5a8e', '#d0c9b0', '#4f7f5a', '#a85d2a', '#6a3e82'], 'books2')

    def goods(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, hexrgb('#d8d4c6'), 1 + rng.uniform(-.02, .02))
        x = 1
        while x < TS - 4:
            w = rng.choice((4, 5, 6, 7))
            h = rng.randint(22, 44)
            c = hexrgb(rng.choice(['#e25b4b', '#f2c94c', '#4b9ee2', '#58b368', '#f28fb0', '#f2f2f2', '#ff9d3a']))
            for xx in range(x, min(TS, x + w)):
                for y in range(TS - 6 - h, TS - 6):
                    k = (1.12 if xx == x else (.82 if xx == x + w - 1 else 1.0)) * (1.06 if y < TS - 6 - h + 3 else 1.0)
                    col = hexrgb('#ffffff') if TS - 6 - h // 2 - 3 <= y <= TS - 6 - h // 2 + 3 else c
                    px(im, xx, y, col, k * (1 + rng.uniform(-.02, .02)))
            x += w + 1
        for y in range(TS - 6, TS):
            for xx in range(TS):
                px(im, xx, y, hexrgb('#8f8a78'), 1.1 if y == TS - 6 else .9)
    n('goods', goods)

    def fridge(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, hexrgb('#bfe0ea'), 1 + rng.uniform(-.02, .02) - y / TS * .08)
        for row in range(3):
            y0 = 4 + row * 19
            for x in range(1, TS - 3, 5):
                c = hexrgb(rng.choice(['#e23b3b', '#3b9ee2', '#58c36a', '#f2c94c', '#f28f3a']))
                for xx in range(x, x + 3):
                    for y in range(y0 + 3, y0 + 15):
                        px(im, xx, y, c, 1.12 if xx == x else (.85 if xx == x + 2 else 1))
                    for y in range(y0, y0 + 3):
                        px(im, xx, y, hexrgb('#dcdcdc'))
            for xx in range(TS):
                px(im, xx, y0 + 16, hexrgb('#8fb0bb'))
    n('fridge', fridge)
    G.IMAGE_TILES.update(('paint_a', 'paint_b', 'paint_c', 'poster_a', 'poster_b', 'poster_c', 'menu_board', 'screen_a', 'screen_b', 'screen_c',
                          'marquee_a', 'marquee_b', 'cake', 'elev_door', 'mirror'))
    G.TALL_TILES.update(('books', 'books2', 'goods', 'fridge'))


def beach_tiles():
    """Arena, hojas de palmera, paja, rocas y cascos de barco (playa)."""
    def n(name, fn):
        add_tile(name, fn, True)

    def px(im, x, y, c, k=1.0):
        im.putpixel((x, y), shade(c, k))

    def sand(d, im, rng):
        bl = G.blotch(rng, 8)
        base = hexrgb('#e8d29a')
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, base, 1 + bl(x / TS, y / TS) * .05 + rng.uniform(-.045, .045))
        for _ in range(70):
            px(im, rng.randint(0, TS - 1), rng.randint(0, TS - 1), base, rng.choice((.88, 1.1)))
    n('sand', sand)

    def wet(d, im, rng):
        bl = G.blotch(rng, 8)
        base = hexrgb('#bfa271')
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, base, 1 + bl(x / TS, y / TS) * .07 + rng.uniform(-.04, .04))
    n('wet_sand', wet)

    def leaf(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                px(im, x, y, hexrgb('#3f8f3a'), .85 + rng.uniform(-.05, .05))
        for y in range(TS):
            px(im, 7, y, hexrgb('#2a6a2a')); px(im, 8, y, hexrgb('#a7cf6a'))
            for sgn in (-1, 1):
                for k in range(1, 7):
                    xx = 7 + sgn * k
                    if 0 <= xx < TS and (y + k) % 3 == 0:
                        px(im, xx, y, hexrgb('#66b04a'), 1.1)
                    if 0 <= xx < TS and (y + k) % 3 == 1:
                        px(im, xx, y, hexrgb('#2e7a30'))
    n('palm_leaf', leaf)

    def thatch(d, im, rng):
        for y in range(TS):
            for x in range(TS):
                k = 1 + rng.uniform(-.07, .07)
                if y % 4 == 0:
                    k *= .72
                elif y % 4 == 1:
                    k *= 1.08
                px(im, x, y, hexrgb('#c9a24a'), k * (.9 if (x // 3 + y // 4) % 2 else 1))
    n('thatch', thatch)
    G.solid('rock', '#7d8185', .09)
    G.solid('rock_dark', '#5b6065', .08)
    G.solid('hull_white', '#f2f0ea')
    G.solid('hull_blue', '#2f6fb0')
    G.solid('hull_red', '#c63b3b')
    G.solid('buoy_orange', '#f08a2a')
    G.solid('sail', '#f4efe2', .03)
