"""Hojas de contacto de las fotos que deja tools/cap/harness.js en config/_frames/.
Uso:  python tools/cap/sheet.py [columnas=4] [ancho=400] [vista ...] [--out carpeta] [--video archivo.mp4 vista]
  - una hoja por vista (dir, side, opp, top, contact...) con la hora de escena escrita en cada foto;
  - metrics.txt: tabla de medidas por cuadro (distancias entre los cuerpos, manos y lanza);
  - --video: junta las fotos de una vista en un mp4 (a la velocidad real según la hora de cada foto)."""
import base64, glob, json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont
import io

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FR = os.path.join(ROOT, 'config', '_frames')
args = sys.argv[1:]
out = os.path.join(ROOT, 'scratch_cap')
video = None
if '--out' in args:
    i = args.index('--out'); out = args[i + 1]; del args[i:i + 2]
if '--video' in args:
    i = args.index('--video'); video = args[i + 1]; del args[i:i + 2]
cols = int(args[0]) if args else 4
W = int(args[1]) if len(args) > 1 else 400
want = args[2:]
os.makedirs(out, exist_ok=True)
for f in glob.glob(os.path.join(out, '*')):
    os.remove(f)
try:
    font = ImageFont.truetype('arialbd.ttf', 20)
except Exception:
    font = ImageFont.load_default()
groups = {}
for f in sorted(glob.glob(os.path.join(FR, '*.json'))):
    b = os.path.basename(f)
    if b == 'metrics.json':
        continue
    d = json.load(open(f))
    groups.setdefault(d['v'], []).append((b[len(d['v']) + 1:-5], d['t'], d['d']))
for v, items in groups.items():
    if want and v not in want:
        continue
    items.sort(key=lambda x: x[0])
    ims = []
    for n, t, d in items:
        im = Image.open(io.BytesIO(base64.b64decode(d.split(',')[1]))).convert('RGB')
        im = im.resize((W, round(im.height * W / im.width)))
        dr = ImageDraw.Draw(im); cap = ('%.2fs' % t) if n[:3] not in ('lab',) and not n.startswith('lab') else n[3:-5].strip('_') + ' ' + ('%.2f' % t); dr.rectangle([0, 0, 12 + 11 * len(cap), 26], fill=(0, 0, 0)); dr.text((4, 2), cap, fill=(255, 255, 0), font=font)
        ims.append(im)
    h = ims[0].height; rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * W, rows * h))
    for i, im in enumerate(ims):
        sheet.paste(im, ((i % cols) * W, (i // cols) * h))
    # varias hojas si es muy grande (para poder verla bien)
    per = cols * 4
    for k in range(0, len(ims), per):
        part = ims[k:k + per]; rr = (len(part) + cols - 1) // cols
        s2 = Image.new('RGB', (cols * W, rr * h))
        for i, im in enumerate(part):
            s2.paste(im, ((i % cols) * W, (i // cols) * h))
        p = os.path.join(out, '%s_%02d.jpg' % (v, k // per)); s2.save(p, quality=88); print(p)
    if video and (not want or v in want) and (v == (want[0] if want else v)):
        # video: cada foto dura lo que hay hasta la siguiente
        tmp = os.path.join(out, 'vid'); os.makedirs(tmp, exist_ok=True)
        lst = []
        for i, (n, t, d) in enumerate(items):
            fp = os.path.join(tmp, 'f%04d.jpg' % i); open(fp, 'wb').write(base64.b64decode(d.split(',')[1]))
            dt = (items[i + 1][1] - t) if i + 1 < len(items) else .3
            lst.append("file '%s'\nduration %.4f" % (fp.replace('\\', '/'), max(.02, dt)))
        lst.append("file '%s'" % fp.replace('\\', '/'))
        open(os.path.join(tmp, 'l.txt'), 'w').write('\n'.join(lst))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'l.txt'), '-vf', 'fps=30,format=yuv420p', video], check=True)
        print('video', video)
mp = os.path.join(FR, 'metrics.json')
if os.path.exists(mp):
    m = json.load(open(mp)); rows = m['rows']
    keys = ['t', 'flat', 'chest', 'tipChest', 'shaftChest', 'vHandL', 'vHandR', 'ay', 'vy']
    lines = ['\t'.join(keys)]
    step = max(1, len(rows) // 90)
    for r in rows[::step]:
        lines.append('\t'.join(str(r.get(k, '')) for k in keys) + '\tA=%s V=%s' % (r['A'], r['V']))
    open(os.path.join(out, 'metrics.txt'), 'w').write('\n'.join(lines)); print('metrics.txt', len(rows), 'cuadros')
