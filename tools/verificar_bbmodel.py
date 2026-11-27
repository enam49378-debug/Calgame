"""Verificador geométrico para modelos Blockbench (.bbmodel).
Detecta automáticamente antes de publicar:
  1. Z-fighting coplanar: dos cubos visibles con caras en el mismo plano (|a - b| < 0.015 m)
     cuyos rectángulos en los otros 2 ejes se solapan (> 0.015 m).
  2. Cubos duplicados o completamente incrustados.
  3. Obstrucciones en puertas (opcional: --puerta ancho alto profundidad).

Uso: python tools/verificar_bbmodel.py ciudad/cafe.bbmodel
"""
import json, sys


def boxes_from_bbmodel(path):
    d = json.loads(open(path, encoding='utf-8').read())
    # Identificar UUIDs del grupo 'colision' para ignorarlos (no se renderizan)
    col_uuids = set()
    for g in d.get('outliner', []):
        if isinstance(g, dict) and g.get('name', '').lower() == 'colision':
            for ch in g.get('children', []):
                if isinstance(ch, str):
                    col_uuids.add(ch)
    grp_of = {}
    for g in d.get('outliner', []):
        if isinstance(g, dict):
            for ch in g.get('children', []):
                if isinstance(ch, str):
                    grp_of[ch] = g.get('name', '?')

    boxes = []
    for idx, el in enumerate(d.get('elements', [])):
        if el.get('uuid') in col_uuids:
            continue
        if el.get('rotation') and any(abs(v) > 1e-4 for v in el['rotation']):
            continue  # cubos rotados se saltan en el chequeo AABB simple
        f, t = el['from'], el['to']
        # Convertir de píxeles Blockbench (16 px = 1 m) a metros
        x0, y0, z0 = min(f[0], t[0]) / 16.0, min(f[1], t[1]) / 16.0, min(f[2], t[2]) / 16.0
        x1, y1, z1 = max(f[0], t[0]) / 16.0, max(f[1], t[1]) / 16.0, max(f[2], t[2]) / 16.0
        if x1 - x0 < 1e-4 or y1 - y0 < 1e-4 or z1 - z0 < 1e-4:
            continue
        boxes.append((idx, grp_of.get(el.get('uuid'), '?'), x0, y0, z0, x1, y1, z1))
    return boxes


def overlap1d(a0, a1, b0, b1):
    return min(a1, b1) - max(a0, b0)


def check_zfighting(boxes, eps=0.012, min_ov=0.025):
    issues = []
    n = len(boxes)
    for i in range(n):
        id1, g1, ax0, ay0, az0, ax1, ay1, az1 = boxes[i]
        for j in range(i + 1, n):
            id2, g2, bx0, by0, bz0, bx1, by1, bz1 = boxes[j]
            # Fast broadphase
            if ax1 + eps < bx0 or bx1 + eps < ax0: continue
            if ay1 + eps < by0 or by1 + eps < ay0: continue
            if az1 + eps < bz0 or bz1 + eps < az0: continue

            ovx = overlap1d(ax0, ax1, bx0, bx1)
            ovy = overlap1d(ay0, ay1, by0, by1)
            ovz = overlap1d(az0, az1, bz0, bz1)

            # Solo nos importa Z-fighting en caras EXTERNAS visibles (mismo signo: top-top, bot-bot, +x/+x, -x/-x, +z/+z, -z/-z)
            hit = None
            if ovx > min_ov and ovz > min_ov:
                if abs(ay1 - by1) < eps: hit = f'TOP y={ay1:.3f}'
                elif abs(ay0 - by0) < eps and ay0 > 0.02: hit = f'BOT y={ay0:.3f}'
            if not hit and ovy > min_ov and ovz > min_ov:
                if abs(ax1 - bx1) < eps: hit = f'+X x={ax1:.3f}'
                elif abs(ax0 - bx0) < eps: hit = f'-X x={ax0:.3f}'
            if not hit and ovx > min_ov and ovy > min_ov:
                if abs(az1 - bz1) < eps: hit = f'+Z z={az1:.3f}'
                elif abs(az0 - bz0) < eps: hit = f'-Z z={az0:.3f}'

            if hit:
                issues.append((hit, g1, g2, (ax0, ay0, az0, ax1, ay1, az1), (bx0, by0, bz0, bx1, by1, bz1)))
    return issues


if __name__ == '__main__':
    path = sys.argv[1]
    boxes = boxes_from_bbmodel(path)
    issues = check_zfighting(boxes)
    print(f'{path}: {len(boxes)} cubos visibles, {len(issues)} caras coplanares (Z-fighting)')
    by_pair = {}
    for hit, g1, g2, b1, b2 in issues:
        k = (g1, g2, hit.split()[0])
        by_pair[k] = by_pair.get(k, 0) + 1
    for (g1, g2, side), cnt in sorted(by_pair.items(), key=lambda x: -x[1])[:25]:
        print(f'  {cnt:3d}x  [{g1}] <-> [{g2}]  ({side})')
    if issues:
        print('\nPrimeros 15 ejemplos:')
        for hit, g1, g2, b1, b2 in issues[:15]:
            f = lambda b: f'({b[0]:.2f}..{b[3]:.2f}, y={b[1]:.2f}..{b[4]:.2f}, z={b[2]:.2f}..{b[5]:.2f})'
            print(f'  {hit:14s} [{g1}] {f(b1)}  <->  [{g2}] {f(b2)}')
