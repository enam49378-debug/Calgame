"""Junta las carpetas de cada personaje en los archivos que lee el juego.

Cada personaje vive en personajes/<id>/ (ver personajes/LEEME.md). Este script lee esas carpetas y regenera:
  js/animations.js        todas las animaciones (los .json de cualquier carpeta "Animation")
  js/personajes.js        datos de cada personaje (personaje.js) + sus ataques básicos (Ataques basicos/Code)
  js/habilidades.js       el código de cada habilidad (los .js de Skills/Code/<habilidad>/ y Skills/Ulti/Code/)

Uso:
  python tools/actualizar_personajes.py            regenera lo que falte o haya cambiado
  python tools/actualizar_personajes.py --importar  si alguien editó js/animations.js a mano (o con otra herramienta),
                                                    vuelca esos cambios a las carpetas antes de regenerar
  python tools/actualizar_personajes.py --forzar    regenera aunque js/animations.js tenga cambios sin importar
También se ejecuta solo cuando se abre el juego con tools/dev-server.py (Iniciar_Editor.bat).
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PERS = os.path.join(ROOT, 'personajes')
ANIM_JS = os.path.join(ROOT, 'js', 'animations.js')
SHA_FILE = os.path.join(PERS, '.animaciones.sha')

# nombre de la variable global que usa game.js para las animaciones de cada personaje
GLOBAL_OF = {'jesuluto': 'JESULUTO_BBS', 'javi': 'JAVI_BB_DATA', 'redbird': 'RED_BB_DATA', 'gato': 'GATO_BB_DATA',
             'sekza': 'SEK_BB_DATA', 'rocket': 'RKT_BB_DATA', 'ukyo': 'UKY_BB_DATA', 'sebolla': 'SEB_BB_DATA', 'randi': 'RANDI_BB_DATA'}
MARK_OF = {'jesuluto': 'JESULUTO_BBS', 'javi': 'JAVI_BLOCKBENCH', 'redbird': 'RED_BLOCKBENCH', 'gato': 'GATO_BLOCKBENCH',
           'sekza': 'SEK_BLOCKBENCH', 'rocket': 'RKT_BLOCKBENCH', 'ukyo': 'UKY_BLOCKBENCH', 'sebolla': 'SEB_BLOCKBENCH', 'randi': 'RANDI_BLOCKBENCH'}
ORDEN = ['jesuluto', 'javi', 'redbird', 'gato', 'sekza', 'rocket', 'ukyo', 'sebolla', 'randi']


def clip_files(cid):
    """{nombre_del_clip: ruta} de todos los .json dentro de carpetas 'Animation' de ese personaje"""
    out = {}
    base = os.path.join(PERS, cid)
    for dp, dn, fn in os.walk(base):
        rel = os.path.relpath(dp, base).replace('\\', '/')
        if not any(part == 'Animation' for part in rel.split('/')):
            continue
        for f in fn:
            if f.endswith('.json') and not f.startswith('_'):
                stem = f[:-5]
                if stem in out:
                    print('AVISO: el clip "%s" de %s está repetido:\n  %s\n  %s' % (stem, cid, out[stem], os.path.join(dp, f)))
                out[stem] = os.path.join(dp, f)
    return out


def sha(path):
    # se normaliza el fin de línea: git en Windows puede convertir LF <-> CRLF y no debe contar como cambio
    return hashlib.sha256(open(path, 'rb').read().replace(bytes([13, 10]), bytes([10]))).hexdigest() if os.path.exists(path) else ''


def generar():
    partes = ['// ====================================================================',
              '// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano',
              '// Las animaciones viven en personajes/<id>/**/Animation/*.json (un archivo por animación).',
              '// Para cambiarlas edita esos archivos y vuelve a abrir el juego con Iniciar_Editor.bat',
              '// (o corre Actualizar_Personajes.bat).',
              '// ====================================================================', '']
    wins = []
    for cid in ORDEN:
        files = clip_files(cid)
        if not files:
            continue
        data = {}
        for stem in sorted(files, key=lambda s: (s != 'idle', s)):
            data[stem] = json.load(open(files[stem], encoding='utf-8'))
        g, m = GLOBAL_OF[cid], MARK_OF[cid]
        partes.append('/* %s_DATA_BEGIN */' % m)
        partes.append('const %s = %s;' % (g, json.dumps(data, ensure_ascii=False, separators=(',', ':'))))
        partes.append('/* %s_DATA_END */' % m)
        wins.append('window.%s = %s;' % (g, g))
    partes += wins
    return '\n'.join(partes) + '\n'


def _leer(path):
    return open(path, encoding='utf-8').read().replace('\r\n', '\n')


def _lista_orden():
    t = _leer(os.path.join(PERS, '_lista.js'))
    m = re.search(r'CF_ORDEN = (\[.*?\]);', t, re.S)
    return json.loads(m.group(1))


def sonidos_habilidades():
    """{personaje: {carpeta_de_habilidad: [archivos de audio]}} de Skills/Sound/<Habilidad>/"""
    out = {}
    for cid in _lista_orden():
        base = os.path.join(PERS, cid, 'Skills', 'Sound')
        if not os.path.isdir(base):
            continue
        for fold in sorted(os.listdir(base)):
            d = os.path.join(base, fold)
            if not os.path.isdir(d):
                continue
            files = sorted(f for f in os.listdir(d) if f.lower().endswith(('.mp3', '.ogg', '.wav')) and not f.startswith('_'))
            if files:
                out.setdefault(cid, {})[fold] = files
    return out


def generar_personajes():
    """js/personajes.js: registro + personaje.js de cada personaje (en el orden del menú) + sus ataques básicos"""
    cab = ('// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano\n'
           '// Edita personajes/<id>/personaje.js y personajes/<id>/Ataques basicos/Code/*.js\n\n')
    partes = [cab, _leer(os.path.join(PERS, '_lista.js')), '\n']
    for cid in _lista_orden():
        f = os.path.join(PERS, cid, 'personaje.js')
        if not os.path.exists(f):
            print('AVISO: falta personajes/%s/personaje.js' % cid)
            continue
        partes.append('\n/* ===== personajes/%s/personaje.js ===== */\n' % cid + _leer(f))
        d = os.path.join(PERS, cid, 'Ataques basicos', 'Code')
        if os.path.isdir(d):
            for fn in sorted(os.listdir(d)):
                if fn.endswith('.js'):
                    partes.append('\n/* ===== personajes/%s/Ataques basicos/Code/%s ===== */\n' % (cid, fn) + _leer(os.path.join(d, fn)))
    nl = chr(10)
    partes.append(nl + '/* ===== sonidos propios de cada habilidad (personajes/<id>/Skills/Sound/<Habilidad>/) ===== */' + nl +
                  'window.CF_SONIDOS_HAB = ' + json.dumps(sonidos_habilidades(), ensure_ascii=False, indent=1) + ';' + nl)
    return ''.join(partes)


def generar_habilidades():
    """js/habilidades.js: el código de cada habilidad. Se ejecuta dentro de game.js (con with(A)) para poder usar sus funciones."""
    archivos = []
    for cid in _lista_orden():
        base = os.path.join(PERS, cid)
        for dp, dn, fn in os.walk(base):
            dn.sort()
            rel = os.path.relpath(dp, base).replace(os.sep, '/')
            parts = rel.split('/')
            if 'Code' in parts and parts[0] == 'Skills':
                for f in sorted(fn):
                    if f.endswith('.js'):
                        archivos.append((cid, os.path.join(dp, f)))
    partes = ['// GENERADO por tools/actualizar_personajes.py  ·  NO editar a mano\n'
              '// El código de cada habilidad vive en personajes/<id>/Skills/Code/<habilidad>/*.js y Skills/Ulti/Code/*.js\n'
              '// game.js ejecuta esta función con todo lo suyo a mano (sin dejarlo accesible desde la consola).\n'
              '(window.CF_HABILIDADES = window.CF_HABILIDADES || []).push(function (A) {\n'
              '  with (A) {\n'
              '    const CF = { mover: function (nombre, fn) { MOVES[nombre] = fn; }, habilidad: function (nombre, fab) { MOVES[nombre] = fab(); } };\n']
    for cid, path in archivos:
        rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
        partes.append('\n/* ===== %s ===== */\n' % rel + _leer(path))
    partes.append('\n  }\n});\n')
    # coreografías (cinemáticas): personajes/<id>/**/Animation/**/*.coreografia.js  -> se registran antes que los movimientos
    coreos = []
    for cid in _lista_orden():
        base = os.path.join(PERS, cid)
        for dp, dn, fn in os.walk(base):
            dn.sort()
            rel = os.path.relpath(dp, base).replace(os.sep, '/')
            if 'Animation' in rel.split('/'):
                for f in sorted(fn):
                    if f.endswith('.coreografia.js'):
                        coreos.append(os.path.join(dp, f))
    partes.append('\n// ---- coreografías (cinemáticas) ----\n'
                  '(window.CF_COREOGRAFIAS = window.CF_COREOGRAFIAS || []).push(function (A) {\n'
                  '  with (A) {\n'
                  '    const CF = { coreografia: function (id, fn) { CHORE[id] = fn(); } };\n')
    for path in coreos:
        rel = os.path.relpath(path, ROOT).replace(os.sep, '/')
        partes.append('\n/* ===== %s ===== */\n' % rel + _leer(path))
    partes.append('\n  }\n});\n')
    return ''.join(partes)


def escribir_si_cambia(path, texto):
    ant = open(path, encoding='utf-8').read() if os.path.exists(path) else None
    if ant != texto:
        open(path, 'w', encoding='utf-8', newline='').write(texto)
        print(os.path.relpath(path, ROOT).replace(os.sep, '/') + ' regenerado')


def importar():
    """vuelca js/animations.js a las carpetas: actualiza los clips que ya existen y deja los nuevos en Animation/_importadas"""
    src = open(ANIM_JS, encoding='utf-8').read()
    n_upd = n_new = 0
    for cid, g in GLOBAL_OF.items():
        m = re.search(r'^const ' + g + r' = (\{.*\});$', src, re.M)
        if not m:
            continue
        data = json.loads(m.group(1))
        files = clip_files(cid)
        for stem, clip in data.items():
            if stem in files:
                dest = files[stem]
                new = json.dumps(clip, ensure_ascii=False, separators=(',', ':'))
                if open(dest, encoding='utf-8').read() != new:
                    open(dest, 'w', encoding='utf-8', newline='').write(new)
                    n_upd += 1
            else:
                d = os.path.join(PERS, cid, 'Animation', '_importadas')
                os.makedirs(d, exist_ok=True)
                open(os.path.join(d, stem + '.json'), 'w', encoding='utf-8', newline='').write(json.dumps(clip, ensure_ascii=False, separators=(',', ':')))
                n_new += 1
    print('importado: %d clips actualizados, %d nuevos (en personajes/<id>/Animation/_importadas)' % (n_upd, n_new))


def main():
    args = sys.argv[1:]
    last = open(SHA_FILE).read().strip() if os.path.exists(SHA_FILE) else ''
    cur = sha(ANIM_JS)
    if '--importar' in args:
        importar()
    elif last and cur and cur != last and '--forzar' not in args:
        print('js/animations.js tiene cambios que no vienen de las carpetas (¿otra herramienta o edición a mano?).\n'
              'Corre con --importar para pasarlos a personajes/<id>/ (o con --forzar para descartarlos).')
        return 1
    texto = generar()
    if texto != (open(ANIM_JS, encoding='utf-8').read() if os.path.exists(ANIM_JS) else ''):
        open(ANIM_JS, 'w', encoding='utf-8', newline='').write(texto)
        print('js/animations.js regenerado')
    open(SHA_FILE, 'w').write(sha(ANIM_JS))
    escribir_si_cambia(os.path.join(ROOT, 'js', 'personajes.js'), generar_personajes())
    escribir_si_cambia(os.path.join(ROOT, 'js', 'habilidades.js'), generar_habilidades())
    return 0


if __name__ == '__main__':
    sys.exit(main())
