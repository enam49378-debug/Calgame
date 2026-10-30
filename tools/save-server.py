"""Servidor local para exportar a Blockbench.

Sirve la carpeta del juego en http://127.0.0.1:8767 y guarda en ./blockbench/ lo que
export-blockbench.js le manda por POST /save?p=<ruta relativa>.
Uso:  python tools/save-server.py   (desde la carpeta blockstrike)
"""
import http.server
import os
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "blockbench")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        # permite que Blockbench web (u otra herramienta local) lea los archivos exportados
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        super().end_headers()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        rel = urllib.parse.parse_qs(url.query).get("p", [""])[0]
        dest = os.path.normpath(os.path.join(OUT, rel))
        if url.path != "/save" or not rel or not dest.startswith(OUT + os.sep):
            self.send_error(400, "ruta invalida")
            return
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        data = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        with open(dest, "wb") as fh:
            fh.write(data)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    http.server.ThreadingHTTPServer(("127.0.0.1", 8767), Handler).serve_forever()
