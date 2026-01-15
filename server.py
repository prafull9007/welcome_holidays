#!/usr/bin/env python3
"""
Small static file server with simple JSON API to manage `db.json` and a
`/set_session` helper page that sets `localStorage.wh_currentUser` and
redirects to `/index.html`. Designed for local automated test use only.

Usage: python server.py [port]
"""
import http.server
import socketserver
import json
import urllib.parse
import os
import sys

ROOT = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(ROOT, 'db.json')

class Handler(http.server.SimpleHTTPRequestHandler):
    def _set_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors()
        self.end_headers()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/signup':
            length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(raw)
            except Exception:
                self.send_response(400)
                self._set_cors()
                self.end_headers()
                self.wfile.write(b'Invalid JSON')
                return

            name = (data.get('name') or '').strip()
            email = (data.get('email') or '').strip().lower()
            password = data.get('password') or ''

            if not email or not password:
                self.send_response(400)
                self._set_cors()
                self.end_headers()
                self.wfile.write(b'Missing email or password')
                return

            db = { 'users': [] }
            if os.path.exists(DB_PATH):
                try:
                    with open(DB_PATH, 'r', encoding='utf-8') as f:
                        db = json.load(f)
                except Exception:
                    db = { 'users': [] }

            if any(u.get('email') == email for u in db.get('users', [])):
                self.send_response(409)
                self._set_cors()
                self.end_headers()
                self.wfile.write(b'Email already registered')
                return

            db.setdefault('users', []).append({ 'name': name, 'email': email, 'password': password })
            with open(DB_PATH, 'w', encoding='utf-8') as f:
                json.dump(db, f, indent=2)

            self.send_response(201)
            self._set_cors()
            self.end_headers()
            self.wfile.write(json.dumps({'status':'ok','email':email}).encode('utf-8'))
            return

        if parsed.path == '/api/login':
            length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(raw)
            except Exception:
                self.send_response(400)
                self._set_cors()
                self.end_headers()
                self.wfile.write(b'Invalid JSON')
                return

            email = (data.get('email') or '').strip().lower()
            password = data.get('password') or ''

            db = { 'users': [] }
            if os.path.exists(DB_PATH):
                try:
                    with open(DB_PATH, 'r', encoding='utf-8') as f:
                        db = json.load(f)
                except Exception:
                    db = { 'users': [] }

            user = next((u for u in db.get('users', []) if u.get('email')==email and u.get('password')==password), None)
            if not user:
                self.send_response(401)
                self._set_cors()
                self.end_headers()
                self.wfile.write(b'Invalid credentials')
                return

            # respond with user (without password)
            out = { 'email': user.get('email'), 'name': user.get('name') }
            self.send_response(200)
            self._set_cors()
            self.send_header('Content-Type','application/json')
            self.end_headers()
            self.wfile.write(json.dumps(out).encode('utf-8'))
            return

        # default to static file handling
        return super().do_POST()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/set_session':
            # helper page: ?email=... will set localStorage and redirect to index.html
            qs = urllib.parse.parse_qs(parsed.query)
            email = (qs.get('email',[''])[0] or '').strip().lower()
            # find name from db
            name = ''
            if os.path.exists(DB_PATH):
                try:
                    with open(DB_PATH, 'r', encoding='utf-8') as f:
                        db = json.load(f)
                        user = next((u for u in db.get('users',[]) if u.get('email')==email), None)
                        if user: name = user.get('name','')
                except Exception:
                    pass

            content = f'''<!doctype html>
<meta charset="utf-8">
<title>Set session</title>
<script>
  // sets wh_currentUser in localStorage then redirects
  (function(){{
    try{{
      localStorage.setItem('wh_currentUser', JSON.stringify({{ email: {json.dumps(email)}, name: {json.dumps(name)} }}));
    }}catch(e){{}}
    location.href = '/index.html';
  }})();
</script>
'''.encode('utf-8')
            self.send_response(200)
            self._set_cors()
            self.send_header('Content-Type','text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(content)
            return

        # otherwise serve static files
        return super().do_GET()


if __name__ == '__main__':
    start_port = 9000
    if len(sys.argv) > 1:
        try:
            start_port = int(sys.argv[1])
        except Exception:
            pass

    os.chdir(ROOT)
    # allow reuse to reduce "address already in use" during quick restarts
    socketserver.TCPServer.allow_reuse_address = True

    httpd = None
    chosen_port = None
    for p in range(start_port, start_port + 21):
        try:
            httpd = socketserver.ThreadingTCPServer(('0.0.0.0', p), Handler)
            chosen_port = p
            break
        except OSError:
            continue

    if httpd is None:
        print(f"Failed to bind any port in range {start_port}-{start_port+20}")
        sys.exit(1)

    try:
        print(f"Serving at http://localhost:{chosen_port} (bound 0.0.0.0:{chosen_port})")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Stopping')
    finally:
        try:
            httpd.server_close()
        except Exception:
            pass
