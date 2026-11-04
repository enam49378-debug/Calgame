# -*- coding: utf-8 -*-
import urllib.request
import threading
import re
from http.server import HTTPServer, SimpleHTTPRequestHandler

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def main():
    server = HTTPServer(('127.0.0.1', 8089), QuietHandler)
    t = threading.Thread(target=server.serve_forever)
    t.daemon = True
    t.start()

    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    scripts = re.findall(r'<script\s+src=[\'"](.*?)[\'"]', html)
    styles = re.findall(r'<link\s+[^>]*href=[\'"](.*?)[\'"]', html)
    images = re.findall(r'<img\s+[^>]*src=[\'"](.*?)[\'"]', html)

    all_urls = scripts + styles + images
    print("Checking", len(all_urls), "resources...")

    errors = 0
    for u in all_urls:
        if u.startswith('http'):
            continue
        url = "http://127.0.0.1:8089/" + u
        try:
            r = urllib.request.urlopen(url)
            data = r.read()
            print("OK [200]:", u, "Size:", len(data))
        except Exception as e:
            print("FAILED:", u, "Error:", e)
            errors += 1

    server.shutdown()
    print("Completed with", errors, "errors.")

if __name__ == '__main__':
    main()
