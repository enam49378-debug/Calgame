"""Rehace desde cero las texturas de la ciudad en alta resolución (128 px por cuadro en vez de 64: 32 px por metro), sin el tramado de 256 colores del generador.
Cada cuadro conserva su sitio en el atlas, así que NINGÚN modelo se mueve ni cambia (las coordenadas UV van sobre el tamaño del proyecto, 512 px de ancho).
 - Ladrillos, vidrios, madera, suelo de ajedrez, toldos y rejillas se dibujan de nuevo con detalle (junta, biselado, vetas, reflejos, tela).
 - Los colores lisos (paredes, molduras, metal...) llevan grano y manchas suaves, no ruido de píxel.
 - El resto (carteles, cuadros, pantallas, objetos) usa el dibujo original limpio, ampliado sin tramado.
 - Los 24 cuadros extra del atlas de la costa (176-199) se amplían de la imagen que ya llevan los modelos.
Uso:  python tools/atlas_hq.py     (reemplaza la textura incrustada de los modelos y ciudad/atlas.png; luego se regeneran las copias .js)
Para volver atrás:  git revert del commit que lo aplicó."""
import base64, io, json, math, random, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_edificios as G
import gen_interiores as I

OUT = G.OUT
TS0, TS = G.TS, 128          # tamaño de cuadro: antes -> ahora
I.register()
COLS = 8

# ---------------------------------------------------------------- utilidades
def fbm(rng, h, w, octaves=((4, 1.0), (9, .5), (20, .25))):
    """Ruido suave de varias escalas, en -1..1."""
    acc = np.zeros((h, w)); tot = 0
    for n, a in octaves:
        g = rng.uniform(-1, 1, (n + 1, n + 1))
        im = Image.fromarray(((g + 1) * 127.5).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += (np.asarray(im).astype(float) / 127.5 - 1) * a; tot += a
    return acc / tot

def clamp(a): return np.clip(a, 0, 255)
def col(h): return np.array(G.hexrgb(h), float)
def tile_arr(c, noise): return None

def base_noise(rng, k=.025):
    return 1 + rng.uniform(-k, k, (TS, TS))

# ---------------------------------------------------------------- tipos de cuadro
def hq_solid(rgb, name, rng):
    img = np.ones((TS, TS, 3)) * np.array(rgb, float)
    soft = fbm(rng, TS, TS)[..., None]
    fine = rng.uniform(-1, 1, (TS, TS))[..., None]
    n = name.lower()
    amp_soft, amp_fine = .05, .018
    if n.startswith('pl_'): amp_soft, amp_fine = .06, .03                      # revoque: manchas y grano fino
    if n in ('concrete', 'concrete_dark', 'stone_dark', 'trim_stone'): amp_soft, amp_fine = .06, .045   # poros
    if n in ('roof_tar', 'rust', 'tank'): amp_soft, amp_fine = .08, .06
    img = img * (1 + soft * amp_soft + fine * amp_fine)
    if n in ('metal', 'metal_dark', 'pipe'):                                    # metal cepillado: vetas horizontales
        streak = rng.uniform(-1, 1, (TS, 1)) * .05
        img = img * (1 + streak[..., None] + fine * .01)
    if n in ('wood', 'door_red', 'door_navy', 'sign_dark'):                      # vetas suaves
        v = np.sin(np.arange(TS)[None, :] * .12 + fbm(rng, TS, TS) * 5) * .04
        img = img * (1 + v[..., None])
    if n.startswith('trim_'):                                                    # moldura: bisel de luz arriba y sombra abajo
        img[:3] *= 1.07; img[-3:] *= .9
    return clamp(img)

def hq_brick(c, m, rng):
    c, m = col(c), col(m); img = np.ones((TS, TS, 3)) * m * (1 + rng.uniform(-.04, .04, (TS, TS, 1)))
    bw, bh = 16, 8
    for row in range(TS // bh):
        off = bw // 2 if row % 2 else 0
        for bx in range(-bw, TS + bw, bw):
            x0 = bx + off + 1; x1 = bx + off + bw - 1; y0 = row * bh + 1; y1 = row * bh + bh - 1
            if x1 <= 0 or x0 >= TS: continue
            xa, xb = max(0, x0), min(TS, x1)
            k = 1 + rng.uniform(-.14, .14); tint = 1 + rng.uniform(-.05, .05, 3)
            body = np.ones((y1 - y0, xb - xa, 3)) * c * k * tint
            body *= 1 + rng.uniform(-.06, .06, (y1 - y0, xb - xa, 1))
            body *= 1 + fbm(rng, y1 - y0, xb - xa)[..., None] * .05
            body[0] *= 1.13; body[-1] *= .82                                      # bisel: luz arriba, sombra abajo
            if x0 >= 0: body[:, 0] *= 1.06
            if x1 <= TS: body[:, -1] *= .9
            img[y0:y1, xa:xb] = body
    return clamp(img)

def hq_glass(top, bot, bands, rng):
    t, b = col(top), col(bot); y = np.linspace(0, 1, TS)[:, None, None]
    img = t * (1 - y) + b * y; img = np.repeat(img, TS, axis=1)
    img *= 1 + rng.uniform(-.01, .01, (TS, TS, 1))
    if bands:
        yy, xx = np.mgrid[0:TS, 0:TS]
        for o, w, a in ((-12, 10, 55), (12, 4, 40), (40, 14, 45), (80, 6, 35)):  # reflejos diagonales con borde suave
            d = (xx - yy - o)
            m = np.clip(1 - np.abs(d - w / 2) / (w / 2 + 1.5), 0, 1) ** .7
            img += (m * a)[..., None] * np.array([1, 1, .9])
    img[-2:] *= .8; img[:2] *= 1.08                                              # marco: borde de abajo oscuro, de arriba claro
    return clamp(img)

def hq_planks(c, rng):
    c = col(c); img = np.ones((TS, TS, 3)) * c; rh = 8
    for r in range(TS // rh):
        kb = 1 + rng.uniform(-.09, .09); off = rng.randint(0, 80)
        rows = np.ones((rh, TS, 3)) * c * kb
        grain = np.sin(np.arange(TS)[None, :] * .09 + fbm(rng, rh, TS)[...] * 7) * .045
        rows *= 1 + grain[..., None] + rng.uniform(-.025, .025, (rh, TS, 1))
        rows[0] *= 1.08; rows[-1] *= .62; rows[-2] *= .85                        # bisel de la tabla
        for sx in range(-off % 80, TS, 80): rows[:, sx:sx + 1] *= .62            # junta entre tablas
        if rng.random() < .5:                                                    # nudo
            kx = rng.randint(8, TS - 8); rows[2:6, kx - 2:kx + 3] *= .78
        img[r * rh:(r + 1) * rh] = rows
    return clamp(img)

def hq_checker(a, b, rng):
    ca, cb = col(a), col(b); yy, xx = np.mgrid[0:TS, 0:TS]; cell = 32
    m = (((xx // cell) + (yy // cell)) % 2 == 0)[..., None]
    img = np.where(m, ca, cb) * (1 + rng.uniform(-.02, .02, (TS, TS, 1)))
    gl = (1 + .06 * np.sin((xx + yy) / 40.0))[..., None]; img *= gl               # brillo del suelo pulido
    edge = ((xx % cell < 2) | (yy % cell < 2))[..., None]; img = np.where(edge, img * .82, img)
    return clamp(img)

def hq_stripes(a, b, rng):
    ca, cb = col(a), col(b); xx = np.arange(TS)[None, :]; w = 16
    m = (((xx // w) % 2) == 0)[..., None]; img = np.repeat(np.where(m, ca, cb), TS, axis=0).astype(float)
    weave = 1 + .035 * np.sin(np.arange(TS)[:, None] * 1.7)[..., None] + .02 * np.sin(xx * 1.9)[..., None] * np.ones((TS, 1, 1))
    img *= weave * (1 + rng.uniform(-.02, .02, (TS, TS, 1)))
    y = np.linspace(1, .86, TS)[:, None, None]; img *= y                           # la tela se oscurece hacia abajo
    img[-5:] *= .85; img[-2:] *= .8
    return clamp(img)

def hq_vent(base, line, rng):
    cb, cl = col(base), col(line); img = np.ones((TS, TS, 3)) * cb
    for y in range(6, TS, 16):
        img[y:y + 4, 4:TS - 4] = cl; img[y - 1:y, 4:TS - 4] = cb * 1.12; img[y + 4:y + 5, 4:TS - 4] = cb * .85
    img *= 1 + rng.uniform(-.02, .02, (TS, TS, 1))
    return clamp(img)

SPECIAL = {
    'br_red': lambda r: hq_brick('#b5654f', '#d8d0c0', r), 'br_tan': lambda r: hq_brick('#c9a77c', '#d8d0c0', r), 'br_brown': lambda r: hq_brick('#8a5a44', '#bfb29c', r),
    'glass': lambda r: hq_glass('#9fd3e6', '#4f8fae', True, r), 'glass_dark': lambda r: hq_glass('#3d6f8a', '#1f3f55', True, r), 'glass_warm': lambda r: hq_glass('#ffe7a8', '#e0a45a', False, r),
    'planks': lambda r: hq_planks('#9a6a40', r), 'checker': lambda r: hq_checker('#f1ece0', '#3b4452', r),
    'awn_red': lambda r: hq_stripes('#c8473f', '#f2ecdc', r), 'awn_blue': lambda r: hq_stripes('#3d6fa8', '#f2ecdc', r),
    'awn_green': lambda r: hq_stripes('#3f8f5a', '#f2ecdc', r), 'awn_gold': lambda r: hq_stripes('#d9ad4a', '#f2ecdc', r), 'vent': lambda r: hq_vent('#8a979c', '#4b5a64', r),
}

# ---------------------------------------------------------------- atlas
def clean_tile(i):
    """Dibujo limpio (sin tramado) que hace el generador a 64 px."""
    name, fn, native = G.PAINT[i]; t = Image.new('RGB', (TS0, TS0)); rng = random.Random(i * 7919 + 3); k = TS0 // G.B
    if native: fn(ImageDraw.Draw(t), t, rng)
    else: fn(G.SD(ImageDraw.Draw(t), k), G.SI(t, k), rng)
    return t

def is_flat(arr):
    return float(arr.reshape(-1, 3).std(0).mean()) < 9      # casi un solo color: se rehace como superficie con grano

def build_atlas(n_tiles, extra=None):
    rows = math.ceil(n_tiles / COLS); atlas = np.zeros((rows * TS, COLS * TS, 3))
    for i in range(n_tiles):
        rng = np.random.RandomState(i * 131 + 7); name = G.PAINT[i][0] if i < len(G.PAINT) else None
        if name in SPECIAL: t = SPECIAL[name](rng)
        elif name is not None:
            c = clean_tile(i); a = np.asarray(c).astype(float)
            if is_flat(a) and name not in ('shadow', 'night'): t = hq_solid(a.reshape(-1, 3).mean(0), name, rng)
            else: t = np.asarray(c.resize((TS, TS), Image.NEAREST)).astype(float)
        else:
            t = extra(i) if extra else np.zeros((TS, TS, 3))
        atlas[(i // COLS) * TS:(i // COLS + 1) * TS, (i % COLS) * TS:(i % COLS + 1) * TS] = t
    return atlas

def to_png(arr):
    im = Image.fromarray(clamp(arr).astype(np.uint8), 'RGB')
    q = im.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)     # 256 colores SIN tramado
    buf = io.BytesIO(); q.save(buf, 'PNG', optimize=True)
    return buf.getvalue(), np.asarray(q.convert('RGB')).astype(float)

def src_of(png): return 'data:image/png;base64,' + base64.b64encode(png).decode()
def load_tex(name):
    d = json.loads((OUT / (name + '.bbmodel')).read_text(encoding='utf-8'))
    return Image.open(io.BytesIO(base64.b64decode(d['textures'][0]['source'].split(',', 1)[1]))).convert('RGB')

def main():
    n176 = len(G.PAINT); assert n176 == 176, n176
    old1600 = np.asarray(load_tex('muelle')).astype(float) if load_tex('muelle').size == (512, 1600) else None
    def extra(i):   # cuadros 176-199: se amplían del atlas de la costa que ya llevan los modelos
        r, c = i // COLS, i % COLS
        t = Image.fromarray(old1600[r * TS0:(r + 1) * TS0, c * TS0:(c + 1) * TS0].astype(np.uint8)).resize((TS, TS), Image.NEAREST)
        return np.asarray(t).astype(float)
    a176 = build_atlas(176); a200 = build_atlas(200, extra) if old1600 is not None else None
    png176, chk176 = to_png(a176); png200, _ = to_png(a200) if a200 is not None else (None, None)
    err = float(np.abs(chk176 - clamp(a176)).mean()); print('atlas 176: %dx%d, %d KB, error de color medio %.2f' % (a176.shape[1], a176.shape[0], len(png176) // 1024, err))
    if png200: print('atlas 200: %dx%d, %d KB' % (a200.shape[1], a200.shape[0], len(png200) // 1024))
    # imagen de comparación para mirarla a ojo: a la izquierda lo de antes, a la derecha lo nuevo
    old = load_tex('cafe'); names = ['br_red', 'br_tan', 'br_brown', 'glass', 'glass_dark', 'glass_warm', 'planks', 'checker', 'awn_red', 'awn_blue', 'vent', 'pl_cream', 'pl_peach', 'concrete', 'metal', 'wood']
    prev = Image.new('RGB', (TS * 2 * 4 + 30, TS * 4 + 15), (30, 30, 30))
    for j, nm in enumerate(names):
        i = [x[0] for x in G.PAINT].index(nm); r0, c0 = i // COLS, i % COLS; x0, y0 = (j % 4) * (TS * 2 + 10), (j // 4) * (TS + 5)
        prev.paste(old.crop((c0 * TS0, r0 * TS0, (c0 + 1) * TS0, (r0 + 1) * TS0)).resize((TS, TS), Image.NEAREST), (x0, y0))
        prev.paste(Image.fromarray(clamp(a176[r0 * TS:(r0 + 1) * TS, c0 * TS:(c0 + 1) * TS]).astype(np.uint8)), (x0 + TS, y0))
    prev.save(OUT / 'previa_texturas.png', optimize=True)
    s176, s200 = src_of(png176), (src_of(png200) if png200 else None); n = 0
    for f in sorted(OUT.glob('*.bbmodel')):
        d = json.loads(f.read_text(encoding='utf-8')); t = d['textures'][0]
        h = t.get('height'); w = t.get('width')
        if w != 512 or h not in (1408, 1600): continue
        src = s176 if h == 1408 else s200
        if not src: continue
        t['source'] = src; t['width'] = 1024; t['height'] = h * 2                  # uv_width / uv_height y 'resolution' no cambian
        f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8'); n += 1
    (OUT / 'atlas.png').write_bytes(png200 or png176)
    print('modelos actualizados:', n)

if __name__ == '__main__':
    main()
