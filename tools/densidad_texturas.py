"""Mide cuántos píxeles de textura le tocan a cada metro de superficie de un modelo de la ciudad (ideal: 16 px/m; menos de 8 se ve borroso o en bloques grandes).
Uso:  python tools/densidad_texturas.py              (todos los modelos, resumen)
      python tools/densidad_texturas.py museo        (un modelo: los grupos y cubos peores, para arreglarlos en Blockbench)
Las caras pequeñas (< 0.5 m) no cuentan. Los modelos con textura propia de 256 px usan 'resolution' 64: se multiplica por 4 solo."""
import json, sys, glob, os
from pathlib import Path
OUT = Path(__file__).resolve().parent.parent / 'ciudad'
FACES = {'north': (0, 1), 'south': (0, 1), 'east': (2, 1), 'west': (2, 1), 'up': (0, 2), 'down': (0, 2)}
def analizar(path):
    d = json.loads(path.read_text(encoding='utf-8')); gname = {g.get('uuid'): g.get('name', '') for g in d.get('groups', []) if isinstance(g, dict)}
    owner = {}
    def walk(nodes, name):
        for n in nodes:
            if isinstance(n, str): owner[n] = name
            else: walk(n.get('children', []), n.get('name') or gname.get(n.get('uuid'), '') or name)
    walk(d.get('outliner', []), '(sin grupo)')
    rw = (d.get('resolution') or {}).get('width', 512); tw = (d.get('textures') or [{}])[0].get('uv_width') or rw
    esc = 4 if rw <= 64 and (d.get('textures') or [{}])[0].get('width', 0) >= 256 else 1
    caras = []
    for e in d['elements']:
        if e.get('type', 'cube') != 'cube': continue
        nm = owner.get(e['uuid'], '(sin grupo)')
        if nm.lower().startswith(('colisi', 'collision', 'hitbox')): continue
        fr, to = e['from'], e['to']; sz = [abs(to[i] - fr[i]) for i in range(3)]
        for cara, (wa, ha) in FACES.items():
            fc = e.get('faces', {}).get(cara)
            if not fc or fc.get('texture') is None or not fc.get('uv'): continue
            u1, v1, u2, v2 = fc['uv']; sw, sh = sz[wa], sz[ha]
            if sw < 8 or sh < 8: continue
            dens = (16 * abs(u2 - u1) / sw + 16 * abs(v2 - v1) / sh) / 2 * esc
            caras.append((dens, sw * sh / 256.0, nm, e.get('name', ''), cara))
    return caras
def resumen(caras):
    tot = sum(a for _, a, *_ in caras) or 1
    return sum(dd * a for dd, a, *_ in caras) / tot, sum(a for dd, a, *_ in caras if dd < 8) / tot * 100, tot
if __name__ == '__main__':
    if len(sys.argv) > 1:
        c = analizar(OUT / (sys.argv[1] + '.bbmodel')); m, low, tot = resumen(c)
        print(f'{sys.argv[1]}: {m:.1f} px/m de media, {low:.0f}% de la superficie con menos de 8 px/m ({tot:.0f} m2)\nGrupos con más superficie borrosa (m2 con <8 px/m):')
        por = {}
        for dd, a, g, n, cara in c:
            if dd < 8: por[g] = por.get(g, 0) + a
        for g, a in sorted(por.items(), key=lambda x: -x[1])[:10]: print(f'  {a:7.0f} m2  {g}')
    else:
        print('modelo | px/m medio | % con <8 px/m')
        for f in sorted(OUT.glob('*.bbmodel')):
            c = analizar(f)
            if c: m, low, tot = resumen(c); print(f'{f.stem:28s} {m:5.1f}  {low:4.0f}%')
