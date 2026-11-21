"""Convierte la capucha de Javicubito (modelo BBS + textura) en personajes/javi/Accesorios/capucha/capucha.js.
Uso:  python tools/convertir_capucha.py      (después de cambiar model.bbs.json o texture.png en esa carpeta)"""
import json, base64
d = 'personajes/javi/Accesorios/capucha/'
m = json.load(open(d + 'model.bbs.json'))['model']['groups']
mesh = lambda g: m[g]['meshes'][0]
out = {'top': {'v': mesh('capucha arriba')['vertices'], 'uv': mesh('capucha arriba')['uvs']},
       'band': {'v': mesh('capucha abajo')['vertices'], 'uv': mesh('capucha abajo')['uvs']},
       'tex': 'data:image/png;base64,' + base64.b64encode(open(d + 'texture.png', 'rb').read()).decode()}
js = ("/* Capucha de Javicubito (accesorio). Datos del modelo BBS (model.bbs.json) y su textura (texture.png) en un solo archivo para que cargue también sin servidor.\n"
      "   Lo usa js/capucha.js. Si cambias el modelo, vuelve a generar este archivo con tools/convertir_capucha.py. */\n"
      "window.CF_CAPUCHA_DATA=" + json.dumps(out, separators=(',', ':')) + ";\n")
open(d + 'capucha.js', 'w', encoding='utf-8').write(js)
print('listo', len(js), 'bytes')
