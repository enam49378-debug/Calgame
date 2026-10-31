"""Genera TODA la ciudad: atlas de texturas, edificios exteriores y edificios con interior (ciudad/*.bbmodel, copias .js y edificios.json).
Uso:  python tools/gen_ciudad.py        (¡sobrescribe los .bbmodel!)
"""
import json, random, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_edificios as G
import gen_interiores as I
import gen_playa as P

I.register()
tex = G.atlas()
info = {}
for i, (name, des, wall, trim, gl, acc) in enumerate(G.BUILDINGS):
    m = G.Model(name)
    G.DES[des](m, random.Random(i + 11), wall, trim, gl, acc)
    n = m.save(tex)
    info[name] = {'w': m.W, 'd': m.D, 'h': round(m.H, 2), 'cubos': n}
    print(f'{name:28s} {m.W:>5.1f} x {m.D:>5.1f} x {m.H:>5.1f}   {n} cubos')
info.update(I.build_all(tex))
info.update(P.build_all(tex))
(G.OUT / 'edificios.json').write_text(json.dumps(info, indent=1, ensure_ascii=False), encoding='utf-8')
G.export_js()
print('tiles:', len(G.TILES))
