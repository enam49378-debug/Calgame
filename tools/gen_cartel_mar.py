"""Genera assets/billboard/ad_mar.jpg: el cartel de la actualizacion del mar para el panel del centro comercial.
Uso: python tools/gen_cartel_mar.py   (necesita Pillow)"""
import math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rnd = random.Random(7)
img = Image.new('RGB', (W, H))
px = img.load()
# degradado: luz de superficie arriba -> negro abisal abajo
for y in range(H):
    t = y / (H - 1)
    for x in range(W):
        a = (1 - t) ** 1.6
        r = int(10 + 60 * a); g = int(40 + 150 * a); b = int(70 + 170 * a)
        r = int(r * (1 - t * .85)); g = int(g * (1 - t * .8)); b = int(b * (1 - t * .6))
        px[x, y] = (r, g, b)
d = ImageDraw.Draw(img, 'RGBA')
# rayos de luz
for i in range(7):
    x0 = 100 + i * 170 + rnd.randint(-30, 30)
    d.polygon([(x0, 0), (x0 + 90, 0), (x0 + 330, H), (x0 + 120, H)], fill=(255, 255, 255, 14))
# burbujas y plancton
for _ in range(120):
    x, y, r = rnd.randint(0, W), rnd.randint(0, H), rnd.randint(2, 7)
    d.ellipse([x - r, y - r, x + r, y + r], outline=(200, 240, 255, 90))
glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
for _ in range(90):
    x, y = rnd.randint(0, W), rnd.randint(int(H * .35), H)
    c = rnd.choice([(125, 249, 255), (255, 125, 233), (157, 125, 255)])
    gd.ellipse([x - 3, y - 3, x + 3, y + 3], fill=c + (230,))


def jelly(cx, cy, s, col):
    gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(gl)
    g.pieslice([cx - 60 * s, cy - 60 * s, cx + 60 * s, cy + 60 * s], 180, 360, fill=col + (150,))
    g.ellipse([cx - 22 * s, cy - 34 * s, cx + 22 * s, cy - 4 * s], fill=(255, 255, 255, 140))
    for k in range(-3, 4):
        x = cx + k * 16 * s
        pts = [(x + math.sin(j * .7 + k) * 7 * s, cy + j * 12 * s) for j in range(0, 11)]
        g.line(pts, fill=col + (170,), width=max(2, int(3 * s)))
    return gl


for (cx, cy, s, col) in [(210, 380, 1.5, (125, 249, 255)), (980, 300, 1.1, (255, 125, 233)), (860, 520, 1.3, (157, 125, 255)), (110, 150, .8, (125, 255, 176))]:
    glow = Image.alpha_composite(glow, jelly(cx, cy, s, col))
img = Image.alpha_composite(img.convert('RGBA'), glow.filter(ImageFilter.GaussianBlur(2)))
img = Image.alpha_composite(img, glow)
d = ImageDraw.Draw(img, 'RGBA')
# silueta de tiburon en lo profundo
sh = [(560, 470), (640, 452), (720, 456), (790, 470), (850, 440), (880, 410), (870, 470), (900, 520), (850, 500), (780, 494), (700, 500), (620, 498)]
SX, SY = 250, -215   # desplazamiento para que no tape el texto
d.polygon([(x + SX, y + SY) for x, y in sh], fill=(6, 12, 22, 235))
d.polygon([(700 + SX, 455 + SY), (722 + SX, 405 + SY), (742 + SX, 458 + SY)], fill=(6, 12, 22, 235))
d.ellipse([618 + SX, 466 + SY, 628 + SX, 476 + SY], fill=(255, 220, 90, 255))
# lampara del pez abisal
AX, AY = 640, -40
d.ellipse([430 + AX, 440 + AY, 462 + AX, 472 + AY], fill=(30, 40, 55, 255)); d.line([(430 + AX, 456 + AY), (400 + AX, 420 + AY), (360 + AX, 430 + AY)], fill=(30, 40, 55, 255), width=4)
d.ellipse([348 + AX, 418 + AY, 372 + AX, 442 + AY], fill=(255, 238, 140, 255))
# textos
def font(sz):
    for n in ('arialbd.ttf', 'Arial Bold.ttf', 'DejaVuSans-Bold.ttf'):
        try:
            return ImageFont.truetype(n, sz)
        except Exception:
            pass
    return ImageFont.load_default()


def text(xy, s, sz, fill, sh=(0, 0, 0, 200)):
    f = font(sz)
    d.text((xy[0] + 4, xy[1] + 4), s, font=f, fill=sh)
    d.text(xy, s, font=f, fill=fill)


text((60, 52), 'NUEVA ACTUALIZACIÓN', 34, (125, 249, 255, 255))
text((60, 100), 'MAR PROFUNDO', 104, (255, 255, 255, 255))
text((60, 212), 'Aguas oscuras · tiburones · medusas luminosas', 36, (210, 238, 255, 255))
for i, s in enumerate(['🦈 Tiburones solo en el mar más profundo', '🪼 Medusas, mantarrayas, tortugas y peces abisales', '🦑 Eventos: cardumen, frenesí, marea luminosa y calamar gigante']):
    text((60, 410 + i * 50), s.split(' ', 1)[1], 30, (255, 255, 255, 255))
text((60, 565), 'CALFIGHT · SOLO EN LA PLAYA', 26, (255, 213, 79, 255))
out = os.path.join(ROOT, 'assets', 'billboard', 'ad_mar.jpg')
img.convert('RGB').save(out, quality=90)
print('cartel guardado:', out, img.size)
