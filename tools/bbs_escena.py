"""Pasa una película de BBS con DOS réplicas (atacante y víctima) y su cámara a los datos de una coreografía del juego.
Escribe, entre las marcas  // <<BBS-ESCENA1 ... // BBS-ESCENA1>>  de la coreografía, las constantes:
    BB_APOS / BB_VPOS : recorrido del atacante y de la víctima  [t, x derecha, y altura, z adelante, giro]  (respecto de donde empieza la escena)
    BB_CAM            : cámara de la película             [t, x, y, z, giro, inclinación, roll, fov]   (mismo marco; ver el plano 'bb' de game.js)
Los clips de poses salen de tools/bbs_a_clip.py (replay=0 y replay=1, desde=<tick del agarre>, ruta=<archivo>); este script lee esas rutas.

Uso:  python tools/bbs_escena.py <pelicula.dat> <ruta_atacante.json> <ruta_victima.json> <coreografia.js> [desde=19] [cam=1]
Marco de la cámara: BBS da posición del mundo (x este, z sur, y altura con el piso en el y inicial del atacante) y ángulos en grados
(yaw de la cámara + 180 = dirección Minecraft, pitch + = mira abajo). Se pasa a "derecha / arriba / adelante" del atacante al empezar la escena."""
import json, math, os, re, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
film_path, rs_path, rv_path, out_path = sys.argv[1:5]
opts = sys.argv[5:]
DESDE = next((float(a.split('=')[1]) for a in opts if a.startswith('desde=')), 19.0)
CAMI = next((int(a.split('=')[1]) for a in opts if a.startswith('cam=')), 1)
# las interpolaciones y la clase Chan del conversor (se carga solo la parte de arriba del archivo)
src = open(os.path.join(HERE, 'bbs_a_clip.py'), encoding='utf-8').read().split('# ======================= lectura de pistas')[0]
sys.argv = ['x', film_path, '/dev/null']
ns = {'__file__': os.path.join(HERE, 'bbs_a_clip.py')}
exec(compile(src, 'bbs_a_clip_head', 'exec'), ns)
Chan = ns['Chan']; film = ns['film']
rp0 = film['replays'][0]['keyframes']
val = lambda n: rp0[n]['keyframes'][0]['value']
Y0 = val('yaw'); OX, OY, OZ = val('x'), val('y'), val('z')
sy, cy = math.sin(math.radians(Y0)), math.cos(math.radians(Y0))
ruta_s = json.load(open(rs_path)); ruta_v = json.load(open(rv_path))
Z0 = ruta_s[0][3]                                   # cuánto había avanzado el atacante al empezar la escena (tick DESDE)
f3 = lambda v: round(float(v), 3)


def path(ruta, step=.05):
    out = []; last = -1
    for r in ruta:
        if r[0] - last >= step - 1e-6 or r is ruta[-1]:
            out.append([f3(r[0]), f3(r[1]), f3(r[2]), f3(r[3] - Z0), 0]); last = r[0]
    return out


def to_local(wx, wy, wz):
    dx, dz = wx - OX, wz - OZ
    fwd = dx * -sy + dz * cy; left = dx * cy + dz * sy
    return -left, wy - OY, fwd - Z0                    # derecha, arriba, adelante


cam = film['camera'][CAMI]
ch = {k: Chan([(q['tick'], q.get('interp') or 'linear', q.get('duration') or 0, q['value']) for q in cam[k]['keyframes']]) for k in ('x', 'y', 'z', 'yaw', 'pitch', 'roll', 'fov')}
t_clip0 = (cam['tick'] - DESDE) / 20.0                # segundo de la escena en que empieza el clip de cámara
last = max(q['tick'] for q in cam['x']['keyframes'])
rows = []
n = int(round(last * 2)) + 1                          # 40 cuadros por segundo de la película
for i in range(n):
    tk = min(i * 0.5, last)
    x, y, z = to_local(ch['x'].sample(tk), ch['y'].sample(tk), ch['z'].sample(tk))
    rows.append([f3(t_clip0 + tk / 20.0), f3(x), f3(y), f3(z), f3(ch['yaw'].sample(tk) + 180.0 - Y0), f3(ch['pitch'].sample(tk)), f3(ch['roll'].sample(tk)), f3(ch['fov'].sample(tk))])
if t_clip0 > 0: rows.insert(0, [0.0] + rows[0][1:])  # antes de que empiece la cámara de la película: se queda en su primer cuadro


def lit(a): return json.dumps(a, separators=(',', ':'))


block = ('// <<BBS-ESCENA1  (generado por tools/bbs_escena.py a partir de %s: no editar a mano)\n' % os.path.basename(film_path) +
         '  const BB_APOS = %s;\n  const BB_VPOS = %s;\n  const BB_CAM = %s;\n' % (lit(path(ruta_s)), lit(path(ruta_v)), lit(rows)) +
         '  // BBS-ESCENA1>>')
js = open(out_path, encoding='utf-8').read()
new, k = re.subn(r'// <<BBS-ESCENA1.*?// BBS-ESCENA1>>', lambda m: block, js, flags=re.S)
if not k: sys.exit('faltan las marcas // <<BBS-ESCENA1 ... // BBS-ESCENA1>> en ' + out_path)
open(out_path, 'w', encoding='utf-8', newline='').write(new)
print('escena escrita: atacante %d puntos, víctima %d, cámara %d cuadros (desde t=%.2f)' % (len(path(ruta_s)), len(path(ruta_v)), len(rows), t_clip0))
print('yaw del atacante %.3f°, origen BBS (%.2f, %.2f, %.2f), avance al empezar %.3f m' % (Y0, OX, OY, OZ, Z0))
