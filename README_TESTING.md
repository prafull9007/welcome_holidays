Testing server & running the app

Quick summary
- `server.py` serves the static app and provides a tiny JSON API (`/api/signup`, `/api/login`) that persists users into `db.json` (plaintext passwords — demo only).
- The server will try to bind the requested start port (default `9000`) and will auto-select the next available port in the 9000–9020 range if the requested port is busy. It prints the final URL when started.

Start the server
```powershell
Push-Location 'f:\Tranning\welcome-holidays'
python .\server.py 9000
# Example output: "Serving at http://localhost:9100 (bound 0.0.0.0:9100)"
```

Manual app flow (browser)
- Open `/signup.html` to create an account (form POSTs to `/api/signup`).
- Open `/login.html` to sign in (form POSTs to `/api/login`).
- After signup the app redirects to `/set_session?email=...` which writes `localStorage.wh_currentUser` and navigates to `/index.html`.

Commands for API + verification
- Create a user (curl):
```bash
curl -X POST http://localhost:<port>/api/signup \
	-H "Content-Type: application/json" \
	-d '{"name":"Test User","email":"test@example.com","password":"secret"}'
```
- Login (curl):
```bash
curl -X POST http://localhost:<port>/api/login \
	-H "Content-Type: application/json" \
	-d '{"email":"test@example.com","password":"secret"}'
```
- Programmatic sign-in (sets localStorage and redirects):
```
http://localhost:<port>/set_session?email=test@example.com
```
- Verify persistence:
```powershell
Get-Content db.json -Raw
# or (grep) Select-String -Path db.json -Pattern "test@example.com"
```

Running tests (pytest)
1. Install dev dependencies (recommended in a virtualenv):
```powershell
python -m venv .venv

     # Windows
pip install -r requirements-dev.txt
```
2. Run the full pytest suite:
```bash
pytest -q
# or
python -m pytest -q
```
3. Run a single test file (faster during development):
```bash
python -m pytest tests/test_server_api.py -q
```

What the tests do
- The `tests/test_server_api.py` module starts `server.py` on a free port, waits for `index.html` to respond, then exercises `/api/signup` and `/api/login`.
- Tests back up `db.json` to `db.json.bak` and restore it after the test module completes, so running tests won't permanently lose your data.

Troubleshooting & notes
- If you see "address already in use" or the server can't bind to a port, start with a different port:
```powershell
python .\server.py 9200
```
- The server prints the chosen port; use that port in subsequent `curl` calls or in the browser.
- This project is a static/demo app — do not use the `db.json` password handling in production.

Example E2E quick-run (PowerShell)
```powershell
# start server (background or separate terminal)
python .\server.py 9000
# in another terminal create user + verify
curl -X POST http://localhost:9000/api/signup -H "Content-Type: application/json" -d '{"name":"CI Tester","email":"ci@test.example","password":"pw"}' -v
# set the session in browser by visiting:
http://localhost:9000/set_session?email=ci@test.example
```
