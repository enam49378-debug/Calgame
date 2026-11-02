"""Voces de los personajes: mete los audios nuevos al juego sin tocar código.

Uso (desde la carpeta del juego):
    python tools/voces.py                      # mira la carpeta sonidos/entrada y arma todo
    python tools/voces.py "C:/ruta/mis audios" # o una carpeta cualquiera
    python tools/voces.py --solo-actualizar    # no copia nada, solo vuelve a leer sonidos/<personaje>/

Los audios se nombran como los de Javi:  <Personaje> <Evento> [número]
    Javi Consegir Ult_2.mp3     Rocket al matar.mp3     itsukio idle 1.mp3     Redbird Activar la Ulti.wav
Para otro personaje solo se cambia el nombre ("Javi" -> "Rocket"). Si no pones número, se agrega como el siguiente.
Eventos:  Activar la Ulti | Consegir Ulti | al matar | Cuando esta apunto de matar | Al morir | idle | daño | Habilidad Ulti
          Al golpear | Cuando llama las gaviotas | Cuando vuela | Variantes Menu (al elegir el personaje en el selector)
Si los archivos no llevan el nombre del personaje:  python tools/voces.py "carpeta" --personaje Sekza
Cada audio se pasa a mp3 en sonidos/<id>/<evento>_<n>.mp3 y se actualiza el bloque VOCES de index.html.
"""
import json, os, re, shutil, subprocess, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, 'index.html')
SND = os.path.join(ROOT, 'sonidos')

# nombre escrito en el archivo -> id del personaje en el juego
CHARS = {'javi': 'javi', 'javicubito': 'javi', 'redbird': 'redbird', 'sobrecargador': 'redbird', 'gato': 'gato', 'elgatopro300': 'gato', 'gatopro': 'gato',
         'sekza': 'sekza', 'rocket': 'rocket', 'ukyo': 'ukyo', 'itzukyo': 'ukyo', 'itsukio': 'ukyo', 'itsukyo': 'ukyo', 'sebolla': 'sebolla', 'seb0lla': 'sebolla',
         'randi': 'randi', 'elrandi': 'randi', 'capitan': 'capitan', 'capitanperu': 'capitan', 'jesuluto': 'jesuluto', 'kaiza': 'kaiza', 'nyx': 'nyx',
         'volt': 'volt', 'brasa': 'brasa', 'yuki': 'yuki', 'titan': 'titan'}
# texto del evento (sin tildes ni números) -> nombre del archivo
EVENTS = {'activar la ulti': 'activar_ulti', 'activar ulti': 'activar_ulti', 'activar la ult': 'activar_ulti', 'activar ult': 'activar_ulti', 'consegir ult': 'ulti_lista', 'conseguir ult': 'ulti_lista', 'consegir ulti': 'ulti_lista', 'conseguir ulti': 'ulti_lista', 'ulti lista': 'ulti_lista',
          'al matar': 'baja', 'matar': 'baja', 'cuando esta apunto de matar': 'casi_baja', 'cuando esta a punto de matar': 'casi_baja', 'apunto de matar': 'casi_baja',
          'al morir': 'muerte', 'morir': 'muerte', 'idle': 'reposo', 'reposo': 'reposo', 'dano': 'dano', 'al recibir dano': 'dano', 'recibir dano': 'dano',
          'habilidad ulti': 'habilidad_ulti',
          'al golpiar': 'golpe', 'al golpear': 'golpe', 'golpear': 'golpe', 'golpiar': 'golpe', 'cuandoactivoulti': 'activar_ulti', 'cuandoconsigoulti': 'ulti_lista',
          'matando a alguien': 'baja', 'apunto de matar a alguien': 'casi_baja', 'apunto de matar un jugador': 'casi_baja', 'variantes menu': 'menu', 'menu': 'menu'}
# eventos cuyo texto empieza así (nombres largos)
PREFIX_EVENTS = [('cuando llama las gaviotas', 'gaviotas'), ('cuando vuela', 'vuelo')]


def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return re.sub(r'[^a-z0-9 ]', ' ', ''.join(c for c in t if unicodedata.category(c) != 'Mn'))


def match_event(text):
    ev = EVENTS.get(text)
    if ev: return ev
    for pre, e in PREFIX_EVENTS:
        if text.startswith(pre): return e


def classify(fname, default=None):
    base = os.path.splitext(fname)[0]
    m = re.search(r'[ _]*(\d+)\s*$', base)
    num = int(m.group(1)) if m else None
    text = re.sub(r'\s+', ' ', norm(base[:m.start()] if m else base)).strip()
    words = text.split(' ')
    for k in range(min(2, len(words) - 1), 0, -1):   # prefijo de 1 o 2 palabras = personaje
        cid = CHARS.get(''.join(words[:k]))
        if cid:
            ev = match_event(' '.join(words[k:]))
            if ev: return cid, ev, num
    if default:   # el archivo no lleva el nombre del personaje: se usa el de --personaje
        ev = match_event(text)
        if ev: return default, ev, num
    return None


def duration(path):
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
        return round(float(out), 3)
    except Exception:
        return None


def ingest(folder, default=None):
    n = 0
    for fn in sorted(os.listdir(folder)):
        full = os.path.join(folder, fn)
        if not os.path.isfile(full) or not fn.lower().endswith(('.mp3', '.wav', '.ogg', '.m4a', '.flac')): continue
        c = classify(fn, default)
        if not c: print('  ? no entendí el nombre:', fn); continue
        cid, ev, num = c
        dest = os.path.join(SND, cid); os.makedirs(dest, exist_ok=True)
        used = {int(m.group(1)) for f in os.listdir(dest) for m in [re.fullmatch(re.escape(ev) + r'_(\d+)\.mp3', f)] if m}
        if num is None or num in used:
            num = 1
            while num in used: num += 1
        out = os.path.join(dest, '%s_%d.mp3' % (ev, num))
        if fn.lower().endswith('.mp3'): shutil.copyfile(full, out)
        else: subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', full, '-q:a', '4', out], check=True)
        print('  %s -> %s/%s_%d.mp3' % (fn, cid, ev, num)); n += 1
    return n


def scan():
    packs, durs = {}, {}
    for cid in sorted(os.listdir(SND)):
        d = os.path.join(SND, cid)
        if not os.path.isdir(d) or cid in ('clippy', 'entrada'): continue
        for f in sorted(os.listdir(d)):
            m = re.fullmatch(r'([a-z_]+?)_?(\d*)\.mp3', f)
            if not m or m.group(1) not in set(EVENTS.values()): continue
            packs.setdefault(cid, {}).setdefault(m.group(1), []).append(f[:-4])
            dur = duration(os.path.join(d, f))
            if dur: durs[cid + '/' + f[:-4]] = dur
    # el juego usa nombres de evento en inglés interno
    ev = {'golpe': 'hit', 'gaviotas': 'gulls', 'vuelo': 'fly', 'menu': 'menu', 'muerte': 'death', 'ulti_lista': 'ready', 'casi_baja': 'near', 'baja': 'kill', 'reposo': 'idle', 'activar_ulti': 'activate', 'dano': 'hurt', 'habilidad_ulti': 'skill'}
    return {c: {ev[k]: sorted(v, key=lambda x: int((re.search(r'(\d+)$', x) or [0, 0])[1])) for k, v in e.items()} for c, e in packs.items()}, durs


def write(packs, durs):
    s = open(HTML, encoding='utf-8').read()
    a, b = s.find('/* VOCES_BEGIN */'), s.find('/* VOCES_END */')
    if a < 0 or b < 0: sys.exit('No encuentro el bloque VOCES en ' + HTML)
    block = '/* VOCES_BEGIN */\nconst VOICE_PACKS=%s;\nconst VOICE_DUR=%s;\n' % (json.dumps(packs, separators=(',', ':')), json.dumps(durs, separators=(',', ':')))
    open(HTML, 'w', encoding='utf-8', newline='\n').write(s[:a] + block + s[b:])


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if '--html' in sys.argv: HTML = sys.argv[sys.argv.index('--html') + 1]; args = [a for a in args if a != HTML]
    DEFAULT = None
    if '--personaje' in sys.argv: DEFAULT = CHARS.get(norm(sys.argv[sys.argv.index('--personaje') + 1]).replace(' ', '')); args = [a for a in args if norm(a).replace(' ', '') != norm(sys.argv[sys.argv.index('--personaje') + 1]).replace(' ', '')]
    if '--solo-actualizar' not in sys.argv:
        folder = args[0] if args else os.path.join(SND, 'entrada')
        if os.path.isdir(folder): print('Leyendo', folder); print(ingest(folder, DEFAULT), 'audio(s) añadidos')
        else: print('No hay carpeta', folder)
    packs, durs = scan(); write(packs, durs)
    print('Listo:', {c: sum(len(v) for v in e.values()) for c, e in packs.items()})
