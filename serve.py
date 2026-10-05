from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import time

root = Path(__file__).resolve().parent
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root / 'dist'), **kwargs)
    def do_POST(self):
        if self.path != '/runtime-log':
            self.send_error(404)
            return
        value = self.rfile.read(min(int(self.headers.get('Content-Length', 0)), 16384))
        with (root / 'browser-runtime.log').open('a', encoding='utf-8') as stream:
            stream.write(f'{time.strftime("%H:%M:%S")} {value.decode("utf-8", errors="replace")}\n')
        self.send_response(204)
        self.end_headers()

print('Game preview: http://127.0.0.1:5197', flush=True)
ThreadingHTTPServer(('127.0.0.1', 5197), Handler).serve_forever()
