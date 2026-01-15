Plan: Pick and use `pytest` for Python + lightweight E2E

Goal
- Add testing to the repo focused on reliable, reproducible verification of the Python test server (`server.py`) and glass-box API behaviour. Use `pytest` as the primary test framework for Python code.

Why `pytest`
- Lightweight, no ceremony, works well with fixtures and parametrized tests.
- Easy to run locally and CI-friendly.
- Can call the running test server endpoints via `requests` and assert JSON and file changes (db.json).

High-level steps
1. Add test tooling and dependencies
   - Add a `requirements-dev.txt` with `pytest` and `requests` (and `pytest-asyncio` if needed).
2. Create pytest configuration
   - Add `pytest.ini` with minimal settings (testpaths=test, addopts=-q).
3. Write unit/integration tests for `server.py` API
   - New folder `tests/` with `test_server_api.py`.
   - Tests to include:
     - `test_health`: GET `/health` or `/` (or `/index.html`) returns 200 (server reachable).
     - `test_signup_and_persistence`: POST `/api/signup` with a unique email -> 201 and `db.json` contains the user.
     - `test_duplicate_signup`: same email returns 409.
     - `test_login_success_and_failure`: POST `/api/login` with valid/invalid credentials returns 200/401.
   - Use `requests` to call the running server. For db assertions, read `db.json` directly.
4. Add pytest fixtures
   - `server_process` fixture: spawn `python server.py <port>` in a subprocess for the test session; wait for startup; tear down after tests.
   - `tmp_db` fixture: copy `db.json` to a temp file and point server to use it (or run server in workspace but restore original `db.json` after tests).
5. Run tests locally
   - Example commands:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate  # Windows
     pip install -r requirements-dev.txt
     pytest -q
     ```
6. CI hints
   - In CI run server inside the job, then run `pytest`.
   - Use `pytest -k` to run subsets (signup, login) during iterative work.

Minimal test pseudocode (tests/test_server_api.py)

- setup: choose an available port (e.g., 9200), start `server.py 9200` subprocess, wait until HTTP responds.
- test_signup_and_persistence:
  - POST `/api/signup` JSON {name,email,password}
  - assert HTTP 201
  - read `db.json` and assert email present
- test_login_success:
  - POST `/api/login` with same credentials
  - assert HTTP 200 and body contains name/email
- teardown: stop server subprocess and restore `db.json`

Notes & constraints
- The repo is static + a small Python server; tests that modify `db.json` should operate on a copy or restore state to avoid polluting developer files.
- For true E2E (browser flows: `signup.html` -> redirect -> `index.html`), consider Playwright later; keep pytest for server/API tests now.

Next actions (pick one)
- I can scaffold the `tests/` folder, create `requirements-dev.txt`, `pytest.ini`, and a sample `tests/test_server_api.py` with fixtures that start/stop the server and run the API assertions.
- Or I can only generate a minimal `requirements-dev.txt` and instructions, leaving tests for you.

Which option do you want me to do now? (I recommend scaffolding the tests.)