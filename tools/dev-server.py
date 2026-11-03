"""Servidor local del modo desarrollador de CalFight.

Sirve el juego en http://127.0.0.1:8767 y deja que los editores (mapa y audio) guarden archivos DENTRO de la carpeta del juego:
  POST /save?p=config/mapa.json        guarda un JSON (solo dentro de config/)
  POST /upload?p=sonidos/javi/x.mp3     sube un audio (mp3/wav/ogg/m4a; si no es mp3 y hay ffmpeg, lo convierte)
  GET  /ls?p=sonidos/javi               lista los archivos de una carpeta de audio
  GET  /ping                            para saber que este servidor está
Solo escucha en 127.0.0.1 (nadie más de tu red puede escribir) y no sale de config/, sonidos/ y musica/.
Uso:  python tools/dev-server.py   (o doble clic en Iniciar_Editor.bat)
"""
import http.server, json, os, shutil, subprocess, sys, tempfile, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITE_DIRS = {'config': {'.json'}, 'sonidos': {'.mp3', '.wav', '.ogg', '.m4a', '.json'}, 'musica': {'.mp3', '.wav', '.ogg', '.m4a'}}
MAX = 40 * 1024 * 1024


def safe(rel, exts=None):
    rel = urllib.parse.unquote(rel or '').replace('\\', '/').lstrip('/')
    if not rel or '..' in rel.split('/'):
        return None
    top = rel.split('/')[0]
    if top not in WRITE_DIRS:
        return None
    dest = os.path.normpath(os.path.join(ROOT, rel))
    if not dest.startswith(ROOT + os.sep):
        return None
    ext = os.path.splitext(dest)[1].lower()
    if ext not in (exts or WRITE_DIRS[top]):
        return None
    return dest


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, fmt, *a):
        if '/save' in (a[0] if a else '') or '/upload' in (a[0] if a else ''):
            sys.stderr.write('  ' + (fmt % a) + '\n')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def _json(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path == '/ping':
            b = b'calfight-dev'; self.send_response(200); self.send_header('Content-Type', 'text/plain'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b); return
        if u.path == '/ls':
            rel = urllib.parse.parse_qs(u.query).get('p', [''])[0].replace('\\', '/').strip('/')
            top = rel.split('/')[0]
            if top not in WRITE_DIRS or '..' in rel.split('/'):
                self._json(400, {'error': 'ruta no permitida'}); return
            d = os.path.normpath(os.path.join(ROOT, rel))
            if not d.startswith(ROOT) or not os.path.isdir(d):
                self._json(200, {'files': []}); return
            files = [{'name': n, 'size': os.path.getsize(os.path.join(d, n))} for n in sorted(os.listdir(d)) if os.path.isfile(os.path.join(d, n))]
            self._json(200, {'files': files}); return
        super().do_GET()

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        rel = urllib.parse.parse_qs(u.query).get('p', [''])[0]
        n = int(self.headers.get('Content-Length', 0))
        if n > MAX:
            self._json(413, {'error': 'archivo muy grande (máx 40 MB)'}); return
        data = self.rfile.read(n)
        if u.path == '/save':
            dest = safe(rel, {'.json'})
            if not dest:
                self._json(400, {'error': 'ruta no permitida'}); return
            if rel.endswith('.json'):
                try:
                    json.loads(data.decode('utf-8'))
                except Exception:
                    self._json(400, {'error': 'JSON inválido'}); return
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, 'wb') as f:
                f.write(data)
            self._json(200, {'ok': True, 'file': rel}); return
        if u.path == '/upload':
            dest = safe(rel, {'.mp3', '.wav', '.ogg', '.m4a'})
            if not dest:
                self._json(400, {'error': 'ruta o formato no permitido'}); return
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            ext = os.path.splitext(dest)[1].lower()
            if ext == '.mp3':
                with open(dest, 'wb') as f:
                    f.write(data)
                self._json(200, {'ok': True, 'file': rel}); return
            ff = shutil.which('ffmpeg')
            if not ff:
                self._json(415, {'error': 'Solo se aceptan .mp3 (para otros formatos hace falta ffmpeg instalado)'}); return
            tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False); tmp.write(data); tmp.close()
            out = os.path.splitext(dest)[0] + '.mp3'
            try:
                subprocess.run([ff, '-y', '-v', 'error', '-i', tmp.name, '-codec:a', 'libmp3lame', '-q:a', '4', out], check=True, timeout=120)
            except Exception as e:
                self._json(500, {'error': 'no se pudo convertir: ' + str(e)}); return
            finally:
                os.unlink(tmp.name)
            self._json(200, {'ok': True, 'file': os.path.relpath(out, ROOT).replace('\\', '/')}); return
        self._json(404, {'error': 'no existe'})

    def do_DELETE(self):
        u = urllib.parse.urlparse(self.path)
        rel = urllib.parse.parse_qs(u.query).get('p', [''])[0]
        dest = safe(rel, {'.mp3', '.wav', '.ogg', '.m4a'})
        if u.path == '/del' and dest and os.path.isfile(dest) and rel.replace('\\', '/').startswith('sonidos/'):
            os.unlink(dest); self._json(200, {'ok': True}); return
        self._json(400, {'error': 'no se puede borrar eso'})


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8767
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), H)
    print(f'CalFight · servidor del modo desarrollador en http://127.0.0.1:{port}  (Ctrl+C para cerrarlo)')
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
