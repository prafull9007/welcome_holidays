import os
import sys
import subprocess
import time
import socket
import json
import shutil
import requests
import tempfile
import signal

REPO_ROOT = os.path.abspath(os.path.dirname(__file__) + '/../')
DB_PATH = os.path.join(REPO_ROOT, 'db.json')
SERVER_PY = os.path.join(REPO_ROOT, 'server.py')


def find_free_port():
    s = socket.socket()
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port


class ServerProcess:
    def __init__(self, port):
        self.port = port
        self.proc = None

    def start(self):
        cmd = [sys.executable, SERVER_PY, str(self.port)]
        self.proc = subprocess.Popen(cmd, cwd=REPO_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # wait until server responds
        deadline = time.time() + 8
        url = f'http://127.0.0.1:{self.port}/index.html'
        while time.time() < deadline:
            try:
                r = requests.get(url, timeout=1)
                if r.status_code in (200, 304):
                    return True
            except Exception:
                pass
            if self.proc.poll() is not None:
                raise RuntimeError('server process exited unexpectedly')
            time.sleep(0.2)
        raise RuntimeError('server did not start in time')

    def stop(self):
        if not self.proc:
            return
        try:
            if os.name == 'nt':
                self.proc.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                self.proc.terminate()
            self.proc.wait(timeout=5)
        except Exception:
            try:
                self.proc.kill()
            except Exception:
                pass


import pytest


@pytest.fixture(scope='module')
def backup_db():
    # backup db.json and start with a clean one
    bak = DB_PATH + '.bak'
    if os.path.exists(bak):
        os.remove(bak)
    if os.path.exists(DB_PATH):
        shutil.copy2(DB_PATH, bak)
    # write empty db
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump({'users': []}, f)
    yield
    # restore
    try:
        if os.path.exists(bak):
            shutil.copy2(bak, DB_PATH)
            os.remove(bak)
    except Exception:
        pass


@pytest.fixture(scope='module')
def server(backup_db):
    port = find_free_port()
    sp = ServerProcess(port)
    sp.start()
    yield f'http://127.0.0.1:{port}'
    sp.stop()


def test_signup_and_persistence(server):
    url = server + '/api/signup'
    unique_email = f'test+{int(time.time())}@example.com'
    payload = {'name': 'pytest user', 'email': unique_email, 'password': 'pw12345'}
    r = requests.post(url, json=payload, timeout=5)
    assert r.status_code == 201

    # assert db.json contains the email
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        db = json.load(f)
    assert any(u.get('email') == unique_email for u in db.get('users', []))


def test_duplicate_signup(server):
    url = server + '/api/signup'
    email = 'dupe@example.com'
    payload = {'name': 'dupe', 'email': email, 'password': 'aaa'}
    r1 = requests.post(url, json=payload, timeout=5)
    assert r1.status_code == 201
    r2 = requests.post(url, json=payload, timeout=5)
    assert r2.status_code == 409


def test_login_success_and_failure(server):
    signup_url = server + '/api/signup'
    login_url = server + '/api/login'
    email = 'loginuser@example.com'
    payload = {'name': 'login user', 'email': email, 'password': 's3cret'}
    r = requests.post(signup_url, json=payload, timeout=5)
    assert r.status_code == 201

    r_ok = requests.post(login_url, json={'email': email, 'password': 's3cret'}, timeout=5)
    assert r_ok.status_code == 200
    j = r_ok.json()
    assert j.get('email') == email

    r_bad = requests.post(login_url, json={'email': email, 'password': 'wrong'}, timeout=5)
    assert r_bad.status_code == 401
