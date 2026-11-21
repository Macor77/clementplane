"""Run the connected organization scenario on a fresh, loopback-only Docker Compose stack."""
import base64
import json
import os
import secrets
import socket
import subprocess
import sys
import tempfile
import time
from contextlib import ExitStack
from pathlib import Path
from uuid import uuid4

import httpx
import psycopg
import uvicorn
from psycopg.conninfo import make_conninfo

SERVICE = Path(__file__).resolve().parents[1]
ROOT = SERVICE.parents[1]
sys.path.insert(0, str(SERVICE))


def wait_for(url):
    with httpx.Client(trust_env=False, timeout=2) as http:
        for _ in range(120):
            try:
                if http.get(url).is_success:
                    return
            except httpx.TransportError:
                pass
            time.sleep(0.5)
    raise RuntimeError("Service de recette indisponible : " + url)


def serve_local(stack, app):
    import threading

    sock = stack.enter_context(socket.socket())
    sock.bind(("127.0.0.1", 0))
    server = uvicorn.Server(uvicorn.Config(app, log_level="error", access_log=False))
    thread = threading.Thread(target=server.run, kwargs={"sockets": [sock]}, daemon=True)
    thread.start()

    def stop():
        server.should_exit = True
        thread.join(10)
    stack.callback(stop)
    for _ in range(100):
        if server.started:
            return sock.getsockname()[1]
        if not thread.is_alive():
            break
        time.sleep(0.1)
    raise RuntimeError("Démarrage du service local impossible")


def browser_accounts(gateway, db):
    credentials = {}
    users = {}
    manager_headers = {}
    with httpx.Client(trust_env=False, timeout=15) as http:
        for role in ("OWNER", "OF"):
            email = f"recette-{uuid4().hex}@example.com"
            password = secrets.token_urlsafe(32)
            response = http.post(gateway + "/auth/v1/signup", json={"email": email, "password": password})
            if response.status_code != 200:
                raise RuntimeError(f"Création du compte fictif {role} : HTTP {response.status_code}")
            signup = response.json()
            users[role] = signup["user"]["id"]
            if role == "OF":
                manager_headers["Authorization"] = "Bearer " + signup["access_token"]
            credentials[f"DOSSIER_TEST_{role}_EMAIL"] = email
            credentials[f"DOSSIER_TEST_{role}_PASSWORD"] = password
    owner, manager = users["OWNER"], users["OF"]
    org = uuid4()
    with db.transaction():
        db.execute("insert into profiles values (%s,'Camille','Recette'),(%s,'Alex','Organisme')", (owner, manager))
        db.execute("insert into trainers(id,user_id,prenom,nom) values (%s,%s,'Camille','Recette')", (owner, owner))
        db.execute("insert into organizations(id,name,status) values (%s,'OF de recette','active')", (org,))
        db.execute("insert into organization_members(id,user_id,organization_id,status,role) values(%s,%s,%s,'active','manager')", (uuid4(), manager, org))
        db.execute("insert into organization_trainers values(%s,%s)", (owner, org))
    # Check the actual PostgREST projection used by the UI before starting Chromium.
    projections = {
        "profiles": {"select": "*", "id": "eq." + manager},
        "trainers": {"select": "id,prenom,nom,email,telephone,ville,code_postal,statut", "user_id": "eq." + manager},
        "organization_members": {"select": "id,role,status,joined_at,organization:organizations(id,name,legal_name,slug,logo_url,status)",
                                 "user_id": "eq." + manager, "status": "eq.active"},
    }
    with httpx.Client(trust_env=False, timeout=10, headers=manager_headers) as client:
        for relation, query in projections.items():
            response = client.get(gateway + "/rest/v1/" + relation, params=query)
            if not response.is_success:
                error = response.json()
                raise RuntimeError(f"PostgREST {relation} HTTP {response.status_code}: {error.get('code')} {error.get('message')}")
            if relation == "organization_members":
                assert len(response.json()) == 1 and response.json()[0]["organization"]["id"] == str(org), "Rattachement OF absent de PostgREST"
    return credentials


def run(stack):
    compose = ["docker", "compose", "-p", "dossier-browser-" + uuid4().hex[:12],
               "-f", str(SERVICE / "recette/browser-trial.compose.yaml")]
    # Every resource belongs to this run. No configured Supabase URL or DSN is reused.
    env = dict(os.environ, BROWSER_TRIAL_JWT=secrets.token_hex(40))
    stack.callback(subprocess.run, [*compose, "down", "--volumes"], env=env)
    subprocess.run([*compose, "up", "-d"], check=True, env=env)

    def port(service, target):
        binding = subprocess.check_output([*compose, "port", service, str(target)], text=True, env=env).strip()
        host, number = binding.split(":")
        if host != "127.0.0.1":
            raise RuntimeError("La recette exige une adresse de boucle locale")
        return int(number)

    gateway = "http://127.0.0.1:" + str(port("gateway", 80))
    wait_for(gateway + "/auth/v1/health")
    wait_for(gateway + "/rest/v1/")
    db_port = port("db", 5432)
    conn = dict(host="127.0.0.1", port=db_port, dbname="postgres")
    db = stack.enter_context(psycopg.connect(**conn, user="postgres", password="browser-fixture-only", autocommit=True))
    db.execute((ROOT / "supabase/migrations/20261118104552_professional_dossier.sql").read_text())
    db.execute("create role browser_runtime login password 'fixture-app'; grant dossier_runtime to browser_runtime")
    creds = browser_accounts(gateway, db)
    os.environ.update(
        DOSSIER_ENABLED="1", DOSSIER_MAIL_MODE="off", DOSSIER_WEB_ORIGIN="http://127.0.0.1:4173",
        DOSSIER_CURRENT_KEY_ID="fixture", DOSSIER_FILE_KEYS=json.dumps({"fixture": base64.b64encode(secrets.token_bytes(32)).decode()}),
        DOSSIER_HMAC_KEY=secrets.token_hex(32), SUPABASE_URL=gateway, SUPABASE_PUBLISHABLE_KEY="browser-fixture",
        DOSSIER_DSN=make_conninfo(**conn, user="browser_runtime", password="fixture-app"),
    )
    import api
    if not os.environ.get("DOSSIER_SCANNER_SOCKET"):
        # CI uses the real file parser, with a local test adapter in place of ClamAV.
        # A host with the real scanner socket exercises the normal scanner client unchanged.
        from unittest.mock import patch

        def parse(body):
            raw = base64.b64decode(body["file"], validate=True)
            result = subprocess.run([sys.executable, "-I", str(SERVICE / "validator.py")], input=raw, capture_output=True, check=True)
            mime, clean = result.stdout.split(b"\n", 1)
            return mime.decode(), clean
        stack.enter_context(patch.object(api, "scan_file", side_effect=parse))
    api_url = "http://127.0.0.1:" + str(serve_local(stack, api.app))
    frontend = dict(os.environ, VITE_SUPABASE_URL=gateway, VITE_SUPABASE_ANON_KEY="browser-fixture",
                    VITE_DOSSIER_ENABLED="true", VITE_DOSSIER_API=api_url)
    # Build to a temporary directory so an existing candidate build is never overwritten.
    with tempfile.TemporaryDirectory() as site:
        subprocess.run(["npm", "run", "build", "--", "--outDir", site], cwd=ROOT, env=frontend, check=True)
        browser = dict(frontend, **creds, DOSSIER_BROWSER_FIXTURE="1", DOSSIER_TEST_PREVIEW_DIR=site)
        subprocess.run([str(ROOT / "node_modules/.bin/playwright"), "test", "21-professional-dossier-connected",
                        "--grep", "un OF connecté", "--retries=0"], cwd=ROOT, env=browser, check=True)
    assert db.execute("select count(*) from dossier.today_shares where state='revoked'").fetchone()[0] == 1
    assert db.execute("select count(*) from dossier.mail where state in ('accepted','sending')").fetchone()[0] == 0


if __name__ == "__main__":
    os.umask(0o077)
    with ExitStack() as cleanup:
        run(cleanup)
