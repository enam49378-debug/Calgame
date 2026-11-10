"""Sube al DOBLE la resolución de los atlas de la ciudad (512 -> 1024 px de ancho) sin cambiar el dibujo: cada píxel pasa a ser 2x2 (escalado limpio).
Las coordenadas UV de los modelos no cambian (se calculan sobre el tamaño del proyecto, 'resolution'), así que nada se mueve; en Blockbench y en el juego
puedes repintar encima con más detalle (32 px por metro). Es idempotente: lo que ya mide 1024 no se vuelve a ampliar.
Uso:  python tools/ampliar_atlas.py   (después se regeneran las copias .js)"""
import base64, io, json, sys
from pathlib import Path
from PIL import Image
OUT = Path(__file__).resolve().parent.parent / 'ciudad'
def up(b64):
    im = Image.open(io.BytesIO(base64.b64decode(b64.split(',', 1)[1]))).convert('RGBA')
    if im.width != 512: return None
    big = im.resize((im.width * 2, im.height * 2), Image.NEAREST); buf = io.BytesIO(); big.save(buf, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), big.size
cache, n = {}, 0
for f in sorted(OUT.glob('*.bbmodel')):
    d = json.loads(f.read_text(encoding='utf-8')); ch = False
    for t in d.get('textures', []):
        src = t.get('source') or ''
        if not src.startswith('data:image'): continue
        if src not in cache: cache[src] = up(src)
        r = cache[src]
        if not r: continue
        t['source'] = r[0]; t['width'], t['height'] = r[1]; ch = True   # uv_width / uv_height se quedan como estaban
    if ch: f.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8'); n += 1
a = OUT / 'atlas.png'
if a.exists():
    im = Image.open(a).convert('RGBA')
    if im.width == 512: im.resize((1024, im.height * 2), Image.NEAREST).save(a, optimize=True)
print('modelos ampliados:', n)
