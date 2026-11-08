"""Genera los cosméticos del juego como modelos de Blockbench (.bbmodel) en modelos/cosmeticos/.
Los de cabeza y cara se montan en el hueso de la cabeza (origen: base de la cabeza, 8x8x8 px, frente a +Z);
los de espalda y hombros en el torso (origen: base del torso, 8x12x4 px). 1 px = 1/16 de bloque. Cubos «glow_*» brillan.
Uso: python tools/gen_modelos_cosmeticos.py"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_modelos_abismo import Model, tr, merge, wave

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'modelos', 'cosmeticos'); os.makedirs(OUT, exist_ok=True)


def new(name):
    m = Model(name); m.out = OUT; m.bone('root', [0, 0, 0]); return m


def idle_only(m, tracks, length=3.0, walk=None, wlen=.8):
    m.anim('idle', length, tracks)
    if walk: m.anim('walk', wlen, walk)
    m.save()


def halo():
    m = new('cos_halo'); m.bone('aro', [0, 12, 0], 'root')
    for i in range(16):
        a = i / 16 * math.tau; x, z = math.cos(a) * 5.4, math.sin(a) * 5.4
        m.cube('aro', [x - 1, 11.6, z - 1], [x + 1, 12.8, z + 1], '#ffd54f', 'glow_aro%d' % i)
    for i in range(8):
        a = i / 8 * math.tau + .2; x, z = math.cos(a) * 4, math.sin(a) * 4; m.cube('aro', [x - .5, 12, z - .5], [x + .5, 12.6, z + .5], '#ffffff', 'glow_brillo%d' % i)
    idle_only(m, merge(tr('aro', 1, 25, 0, 6.0), tr('aro', 1, .5, 0, 2.0, 'position')), 6.0)


def oni():
    m = new('cos_oni'); red, dk = '#c4262e', '#2a0f12'
    for sx, n in ((-1, 'cuernoL'), (1, 'cuernoR')):
        m.bone(n, [sx * 2.8, 8, 0], 'root')
        for k, (w, h) in enumerate(((2.6, 2), (2.2, 2), (1.8, 2), (1.3, 2), (.8, 1.5))):
            x = sx * (2.8 + k * .5); m.cube(n, [x - w / 2, 8 + k * 2, .0 - w / 2], [x + w / 2, 8 + k * 2 + h, w / 2], red if k < 4 else '#ff6a4a', 'cuerno%d' % k)
        m.cube(n, [sx * 2.8 - 1.8, 7.6, -1.8], [sx * 2.8 + 1.8, 8.4, 1.8], dk)
    m.cube('root', [-4.4, 7, 3], [4.4, 7.8, 4.2], dk, 'banda')
    idle_only(m, {'cuernoL': {'rotation': wave(2, 0, 8, 3.0, 0, 2)}, 'cuernoR': {'rotation': wave(2, 1, 8, 3.0, 0, 2)}})


def corona():
    m = new('cos_corona'); m.bone('c', [0, 8, 0], 'root')
    m.cube('c', [-4.6, 8, -4.6], [4.6, 9.6, 4.6], '#ffd54f', 'aro')
    for i in range(8):
        a = i / 8 * math.tau; x, z = math.cos(a) * 4.2, math.sin(a) * 4.2; h = 4 + (i % 2) * 2.5
        m.cube('c', [x - .9, 9.6, z - .9], [x + .9, 9.6 + h, z + .9], '#39e6ff', 'glow_pico%d' % i); m.cube('c', [x - .5, 9.6 + h, z - .5], [x + .5, 10.6 + h, z + .5], '#ffffff', 'glow_punta%d' % i)
    for i in range(4): m.cube('c', [-.8 + (i % 2) * 6 - 3, 8.4, 4.6], [.8 + (i % 2) * 6 - 3, 9.4, 5.1], '#ff4fd8', 'glow_gema%d' % i) if i < 2 else None
    idle_only(m, merge(tr('c', 1, 1.2, 0, 3.0, 'position')))


def kabuto():
    m = new('cos_kabuto'); m.bone('k', [0, 8, 0], 'root'); st, gd = '#2a3340', '#d4a017'
    m.cube('k', [-4.6, 8, -4.6], [4.6, 11.5, 4.6], st, 'casco'); m.cube('k', [-3.6, 11.5, -3.6], [3.6, 13, 3.6], st); m.cube('k', [-4.8, 7.2, -5.2], [4.8, 8.4, 5.2], '#1a212a', 'visera')
    for sx in (-1, 1): m.cube('k', [sx * 4.6 - (0 if sx > 0 else .8), 4, -4], [sx * 4.6 + (.8 if sx > 0 else 0), 8, 3], '#1a212a', 'oreja%d' % sx)
    m.cube('k', [-.8, 11.6, 4.6], [.8, 13, 5.2], gd, 'adorno'); m.bone('luna', [0, 12, 4.8], 'k')
    for sx in (-1, 1):
        for i in range(5): m.cube('luna', [sx * (1 + i * .9) - .4, 12 + i * 1.4, 5], [sx * (1 + i * .9) + .4, 13.2 + i * 1.4, 5.6], gd, 'luna%d_%d' % (sx, i))
    idle_only(m, merge(tr('luna', 2, 1.5, 0, 3.0)))


def gato():
    m = new('cos_gato'); m.bone('oL', [-2.6, 8, 0], 'root'); m.bone('oR', [2.6, 8, 0], 'root')
    for sx, n in ((-1, 'oL'), (1, 'oR')):
        for k, w in enumerate((2.6, 2.0, 1.4, .8)): x = sx * 2.6; m.cube(n, [x - w / 2, 8 + k * 1.3, -w / 2], [x + w / 2, 9.3 + k * 1.3, w / 2], '#e8e2d6' if k < 3 else '#f2a8b8')
        m.cube(n, [sx * 2.6 - .5, 8.6, .6], [sx * 2.6 + .5, 12, 1.0], '#f2a8b8')
    idle_only(m, merge(tr('oL', 2, 6, 0, 2.4), tr('oR', 2, -6, 1.5, 2.4)), 2.4)


def pirata():
    m = new('cos_pirata'); m.bone('p', [0, 8, 0], 'root'); bk = '#16181e'
    m.cube('p', [-6, 8, -6], [6, 9.2, 6], bk, 'ala'); m.cube('p', [-5, 9.2, -5], [5, 10.4, 5], bk); m.cube('p', [-3.6, 10.4, -3.6], [3.6, 13, 3.6], bk, 'copa')
    m.cube('p', [-3.8, 8.8, -5.9], [3.8, 9.6, -5.5], '#d4a017', 'galon'); m.cube('p', [-1.6, 10.8, 3.6], [1.6, 12.6, 3.9], '#eeeeee', 'calavera'); m.cube('p', [-1.1, 11.4, 3.95], [-.4, 11.9, 4.1], '#000000'); m.cube('p', [.4, 11.4, 3.95], [1.1, 11.9, 4.1], '#000000')
    for sx in (-1, 1): m.cube('p', [sx * 6 - .5, 9.2, -2], [sx * 6 + .5, 11.4, 2], bk)
    idle_only(m, merge(tr('p', 2, 1.2, 0, 3.0)))


def ciervo():
    m = new('cos_ciervo'); wd = '#8a6a44'
    for sx, n in ((-1, 'aL'), (1, 'aR')):
        m.bone(n, [sx * 2.6, 8, 0], 'root'); x = sx * 2.6
        m.cube(n, [x - .7, 8, -.7], [x + .7, 12, .7], wd); m.cube(n, [x + sx * 0 - .6, 12, -.6], [x + sx * 2.2 + .6, 13.2, .6], wd); m.cube(n, [x + sx * 2 - .5, 13, -.5], [x + sx * 2 + .5, 17, .5], wd)
        m.cube(n, [x - .5, 10, -.5], [x + sx * 3 + .5, 11, .5], wd); m.cube(n, [x + sx * 2.5 - .5, 11, -.5], [x + sx * 2.5 + .5, 14, .5], wd); m.cube(n, [x - .5, 12, 0 - .5], [x - sx * 1.2 + .5, 17, .5], wd)
    idle_only(m, merge(tr('aL', 2, 1.5, 0, 3.0), tr('aR', 2, -1.5, 0, 3.0)))


def kitsune():
    m = new('cos_kitsune'); m.bone('m', [0, 0, 0], 'root'); w = '#f6f2ea'
    m.cube('m', [-4.3, .8, 4], [4.3, 7.6, 4.8], w, 'mascara'); m.cube('m', [-.8, 2.8, 4.8], [.8, 5.2, 5.2], '#d6262c', 'franja'); m.cube('m', [-3, 1.2, 4.8], [3, 2, 5.2], '#d6262c')
    for sx in (-1, 1):
        m.cube('m', [sx * 2.2 - 1.2, 4.6, 4.8], [sx * 2.2 + 1.2, 5.6, 5.1], '#111111', 'ojo%d' % sx); m.cube('m', [sx * 3.4 - .5, 2, 4.8], [sx * 3.4 + .5, 5, 5.2], '#d6262c', 'marca%d' % sx)
        for k in range(3): m.cube('m', [sx * (3.4 + k * .4) - .6, 7.6 + k * 1.2, 4], [sx * (3.4 + k * .4) + .6, 8.8 + k * 1.2, 4.8], w, 'oreja%d_%d' % (sx, k))
    idle_only(m, {})


def ojos(name, col):
    m = new(name); m.bone('o', [0, 0, 0], 'root')
    for sx in (-1, 1):
        m.cube('o', [sx * 2 - 1.4, 3.8, 4.1], [sx * 2 + 1.4, 5.2, 4.6], col, 'glow_ojo%d' % sx); m.cube('o', [sx * 2 - 2, 3.2, 4.05], [sx * 2 + 2, 5.8, 4.2], col, 'glow_halo%d' % sx)
    idle_only(m, {'o': {'scale': [(0, [1, 1, 1]), (1.4, [1.04, 1.1, 1]), (2.8, [1, 1, 1])]}}, 2.8)


def gafas():
    m = new('cos_gafas'); m.bone('g', [0, 0, 0], 'root')
    for sx in (-1, 1): m.cube('g', [sx * 2.2 - 1.9, 3.4, 4.1], [sx * 2.2 + 1.9, 5.8, 4.7], '#0a0a0e', 'lente%d' % sx); m.cube('g', [sx * 2.2 - 1.5, 5, 4.7], [sx * 2.2 - .3, 5.5, 4.8], '#6fd8ff', 'glow_brillo%d' % sx)
    m.cube('g', [-.6, 4.6, 4.1], [.6, 5.2, 4.7], '#1a1a22'); m.cube('g', [-4.4, 4.6, -4], [-3.9, 5.2, 4.7], '#1a1a22'); m.cube('g', [3.9, 4.6, -4], [4.4, 5.2, 4.7], '#1a1a22')
    idle_only(m, {})


def antifaz():
    m = new('cos_antifaz'); m.bone('a', [0, 0, 0], 'root'); bk = '#14161c'
    m.cube('a', [-4.3, 3, 4], [4.3, 6.4, 4.7], bk, 'tela'); m.cube('a', [-4.4, 4, -4.4], [4.4, 5.6, -3.9], bk); m.cube('a', [-4.4, 3.2, -4.3], [-3.9, 6.2, 4.7], bk); m.cube('a', [3.9, 3.2, -4.3], [4.4, 6.2, 4.7], bk)
    for sx in (-1, 1): m.cube('a', [sx * 2.2 - 1, 4, 4.7], [sx * 2.2 + 1, 5.2, 4.9], '#ffffff', 'glow_ojo%d' % sx)
    m.bone('cola', [4.4, 5, -4], 'a'); m.cube('cola', [4.4, 4.4, -9], [5, 5.6, -4], '#c4262e'); m.cube('cola', [4.4, 3.4, -12], [5, 5, -9], '#c4262e')
    idle_only(m, merge(tr('cola', 1, 8, 0, 2.0), tr('cola', 0, 5, 1, 2.0)), 2.0)


def capa():
    m = new('cos_capa'); m.bone('c1', [0, 12, -2.2], 'root'); m.bone('c2', [0, 8, -2.6], 'c1'); m.bone('c3', [0, 4, -3.0], 'c2'); r1, r2, gd = '#a3121c', '#8a0e18', '#ffd54f'
    m.cube('c1', [-4.4, 8, -2.9], [4.4, 12, -2.2], r1, 'capa1'); m.cube('c1', [-5, 11.4, -2.5], [5, 12.6, -1.8], gd, 'cuello')
    m.cube('c2', [-5, 4, -3.3], [5, 8, -2.6], r2, 'capa2'); m.cube('c3', [-5.6, -1, -3.7], [5.6, 4, -3.0], r1, 'capa3'); m.cube('c3', [-5.6, -1.4, -3.9], [5.6, -.6, -3.1], gd, 'ribete')
    m.cube('c1', [-4.4, 8.1, -3.1], [-3.6, 12, -2.9], gd); m.cube('c1', [3.6, 8.1, -3.1], [4.4, 12, -2.9], gd)
    idle_only(m, merge(tr('c1', 0, 3, 0, 2.6, base=3), tr('c2', 0, 5, .8, 2.6, base=4), tr('c3', 0, 8, 1.6, 2.6, base=5)), 2.6,
              merge(tr('c1', 0, 6, 0, .7, base=10), tr('c2', 0, 10, .8, .7, base=16), tr('c3', 0, 14, 1.6, .7, base=22)))


def katana():
    m = new('cos_katana'); m.bone('k', [0, 6, -2.4], 'root'); m.cube('k', [-.6, 8, -3.4], [.6, 28, -2.6], '#cfd6dd', 'hoja'); m.cube('k', [-.7, 1, -3.5], [.7, 8, -2.5], '#17171c', 'mango')
    m.cube('k', [-1.8, 7.6, -3.7], [1.8, 8.6, -2.3], '#d4a73a', 'tsuba'); m.cube('k', [-.4, 2, -3.6], [.4, 7, -3.5], '#d62828', 'cinta')
    m.cube('k', [-1.2, -4, -3.4], [1.2, 1, -2.6], '#14141a', 'vaina'); m.cube('k', [-.5, 28, -3.3], [.5, 29, -2.7], '#ffffff', 'glow_punta')
    k = m.bones['k']; k['rotation'] = [0, 0, 38]
    idle_only(m, merge(tr('k', 2, 1.2, 0, 3.0)))


def alas(name, plumas, col1, col2, size):
    m = new(name)
    for sx, n in ((-1, 'alaL'), (1, 'alaR')):
        m.bone(n, [sx * 2.6, 10, -2.4], 'root', [0, sx * -22, 0])
        for k in range(plumas):
            L = size * (1 - abs(k - plumas * .3) / (plumas * 1.4)) + 3; y = 12 - k * 1.7
            m.cube(n, [sx * 2.8 if sx > 0 else sx * 2.8 - L, y - 1, -3.4 - k * .1], [sx * 2.8 + L if sx > 0 else sx * 2.8, y + 1, -2.7 - k * .1], col1 if k % 2 else col2, 'pluma%d_%d' % (sx, k))
        m.cube(n, [sx * 2.4 - .6, 3, -3.4], [sx * 2.4 + .6, 14, -2.8], col2)
    fl = {'alaL': {'rotation': wave(10, 0, 8, 2.4, 0, 1)}, 'alaR': {'rotation': wave(-10, 0, 8, 2.4, 0, 1)}}
    wk = {'alaL': {'rotation': wave(16, 0, 8, .9, 0, 1)}, 'alaR': {'rotation': wave(-16, 0, 8, .9, 0, 1)}}
    idle_only(m, fl, 2.4, wk, .9)


def alas_kraken():
    m = new('cos_alas_kraken'); col = '#a8325a'
    for sx in (-1, 1):
        for t in range(3):
            n = 'ten%d_%d' % (sx, t); m.bone(n, [sx * 2.6, 10 - t * 2, -2.4], 'root', [0, sx * -25 + t * sx * 8, 0]); b = n
            for k in range(4):
                nn = n + 's%d' % k
                if k: m.bone(nn, [sx * (2.8 + k * 3.2), 10 - t * 2, -3], b); b = nn
                m.cube(b, [sx * (2.6 + k * 3.2) - (3.4 if sx < 0 else 0), 9.2 - t * 2 - k * .5, -3.8], [sx * (2.6 + k * 3.2) + (3.4 if sx > 0 else 0), 10.8 - t * 2 - k * .3, -2.2], col if k < 3 else '#39e6ff', 'seg')
    tr_ = {}
    for sx in (-1, 1):
        for t in range(3):
            for k in range(4):
                nm = 'ten%d_%d' % (sx, t) + ('s%d' % k if k else ''); tr_ = merge(tr_, tr(nm, 1, 9 + k * 3, t + k * .7, 2.4), tr(nm, 2, 5 + k * 2, t * 1.3 + k, 2.4))
    idle_only(m, tr_, 2.4)


def mochila():
    m = new('cos_mochila'); m.bone('b', [0, 6, -2], 'root'); bw, dk = '#8a5a34', '#4a3020'
    m.cube('b', [-3.6, 1, -6.8], [3.6, 10.6, -2], bw, 'cuerpo'); m.cube('b', [-3.8, 8.4, -7], [3.8, 11, -2], dk, 'tapa'); m.cube('b', [-2.4, 2, -8.6], [2.4, 6, -6.8], dk, 'bolsillo')
    m.cube('b', [-.5, 3, -9], [.5, 5, -8.6], '#d4a017', 'hebilla'); m.cube('b', [-4.4, 4, -6.4], [-3.6, 9, -2], dk); m.cube('b', [3.6, 4, -6.4], [4.4, 9, -2], dk); m.cube('b', [-3, 10.8, -5.4], [3, 12.4, -4], '#c4262e', 'manta')
    for sx in (-1, 1): m.cube('b', [sx * 2.8 - .6, 4, -2.2], [sx * 2.8 + .6, 12.2, -1.6], dk, 'tirante%d' % sx)
    idle_only(m, {'b': {'rotation': wave(1, 0, 8, 2.6, 0, 0)}}, 2.6)


def escudo():
    m = new('cos_escudo'); m.bone('s', [0, 6, -2.4], 'root')
    m.cube('s', [-4.6, 1, -4.2], [4.6, 11, -3.2], '#2a3d5c', 'cara'); m.cube('s', [-3.4, -2, -4.2], [3.4, 1, -3.2], '#2a3d5c'); m.cube('s', [-2, -4, -4.2], [2, -2, -3.2], '#2a3d5c')
    m.cube('s', [-5, .6, -4.5], [5, 11.4, -4.1], '#d4a017', 'borde'); m.cube('s', [-.8, 1, -4.7], [.8, 10, -4.4], '#d4a017'); m.cube('s', [-3.6, 5, -4.7], [3.6, 6.4, -4.4], '#d4a017'); m.cube('s', [-1.2, 4.2, -5], [1.2, 7.2, -4.7], '#39e6ff', 'glow_gema')
    idle_only(m, {'s': {'rotation': wave(1.2, 0, 8, 3.0, 0, 2)}}, 3.0)


def hombreras(name, base, trim, glowcol):
    m = new(name)
    for sx, n in ((-1, 'hL'), (1, 'hR')):
        m.bone(n, [sx * 4, 12, 0], 'root'); x = sx * 4
        for k, (w, y) in enumerate(((6.4, 12.4), (5.6, 14), (4.6, 15.4))):
            a, b = (x - w * .2, x + w * .8) if sx > 0 else (x - w * .8, x + w * .2); m.cube(n, [a, y - 1.2, -3.2 - k * .1], [b, y + .6, 3.2 + k * .1], base, 'placa%d' % k)
        a, b = (x - 1, x + 6) if sx > 0 else (x - 6, x + 1); m.cube(n, [a, 12.2, -3.4], [b, 12.8, 3.4], trim, 'ribete')
        m.cube(n, [x + sx * 4 - .6, 13, -.6], [x + sx * 4 + .6, 14, .6], glowcol, 'glow_gema%d' % sx)
    idle_only(m, {'hL': {'rotation': wave(1.5, 0, 8, 2.6, 0, 2)}, 'hR': {'rotation': wave(-1.5, 0, 8, 2.6, 0, 2)}}, 2.6)


def pinchos():
    m = new('cos_hombreras_pinchos')
    for sx, n in ((-1, 'hL'), (1, 'hR')):
        m.bone(n, [sx * 4, 12, 0], 'root'); x = sx * 4
        a, b = (x - 1, x + 5.4) if sx > 0 else (x - 5.4, x + 1); m.cube(n, [a, 11.8, -3.2], [b, 13.8, 3.2], '#1a1a20', 'base')
        for i in range(5):
            px = x + sx * (1 + (i % 2) * 2.2); pz = -2.4 + i * 1.2; m.cube(n, [px - .7, 13.8, pz - .7], [px + .7, 17 + (i % 2), pz + .7], '#c8ccd4', 'pincho%d' % i); m.cube(n, [px - .3, 17 + (i % 2), pz - .3], [px + .3, 18 + (i % 2), pz + .3], '#ffffff', 'glow_punta%d' % i)
    idle_only(m, {'hL': {'rotation': wave(1.5, 0, 8, 2.6, 0, 2)}, 'hR': {'rotation': wave(-1.5, 0, 8, 2.6, 0, 2)}}, 2.6)


def bufanda():
    m = new('cos_bufanda'); m.bone('b', [0, 12, 0], 'root'); m.bone('cola', [3, 11, -2.2], 'b'); m.bone('cola2', [3.4, 6, -3], 'cola'); rd = '#b3261e'
    m.cube('b', [-5, 11.4, -3], [5, 13.4, 3], rd, 'vuelta'); m.cube('b', [-5.4, 11.8, -3.4], [5.4, 12.4, 3.4], '#7a1a14')
    m.cube('cola', [2, 6, -3], [5, 12, -2.2], rd, 'cola'); m.cube('cola2', [2.4, 0, -3.8], [5.4, 6, -3], rd, 'cola2'); m.cube('cola2', [2.4, -.8, -3.9], [5.4, 0, -3.1], '#ffd54f', 'fleco')
    idle_only(m, merge(tr('cola', 0, 6, 0, 2.2, base=4), tr('cola2', 0, 10, .8, 2.2, base=6)), 2.2, merge(tr('cola', 0, 12, 0, .7, base=18), tr('cola2', 0, 16, .8, .7, base=24)))


halo(); oni(); corona(); kabuto(); gato(); pirata(); ciervo(); kitsune(); ojos('cos_ojos_azul', '#6fd8ff'); ojos('cos_ojos_kraken', '#ff3b30'); gafas(); antifaz()
capa(); katana(); alas('cos_alas_angel', 6, '#ffffff', '#dff0ff', 13); alas('cos_alas_demonio', 5, '#3a0c18', '#7a1a2e', 12); alas_kraken(); mochila(); escudo()
hombreras('cos_hombreras_samurai', '#8a1620', '#d4a73a', '#d4a73a'); hombreras('cos_hombreras_abismo', '#0b3a4a', '#39e6ff', '#39e6ff'); pinchos(); bufanda()
