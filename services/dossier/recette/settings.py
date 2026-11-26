"""Prepare private configuration for a new, disposable, single-recipient trial."""
import argparse
import base64
import json
import os
from pathlib import Path
import re
import secrets


def main():
    p = argparse.ArgumentParser()
    p.add_argument("directory", type=Path)
    p.add_argument("hostname")
    p.add_argument("recipient")
    args = p.parse_args()
    if not re.fullmatch(r"[a-z0-9.-]+", args.hostname):
        p.error("Expected a DNS hostname")
    if not re.fullmatch(r"[-+.a-zA-Z0-9_]+@[-.a-zA-Z0-9]+\.[a-zA-Z]+", args.recipient):
        p.error("Expected a single e-mail address")
    os.umask(0o077)
    args.directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    password = secrets.token_hex(32)
    shared = dict(
        DOSSIER_DSN=f"dbname=guest_trial user=trial_runtime password={password} host=127.0.0.1",
        DOSSIER_HMAC_KEY=secrets.token_hex(32),
        DOSSIER_WEB_ORIGIN="https://" + args.hostname,
        DOSSIER_TEST_MAILBOXES=args.recipient.lower(),
        DOSSIER_ENABLED="1",
    )
    files = {
        "db.env": dict(POSTGRES_DB="guest_trial", POSTGRES_PASSWORD=secrets.token_hex(32),
                       POSTGRES_INITDB_ARGS="--auth-host=scram-sha-256 --auth-local=peer",
                       DOSSIER_TRIAL_PASSWORD=password),
        "api.env": dict(shared, DOSSIER_SCANNER_SOCKET="/run/dossier/validator.sock",
                        DOSSIER_CURRENT_KEY_ID="trial",
                        DOSSIER_FILE_KEYS=json.dumps({"trial": base64.b64encode(secrets.token_bytes(32)).decode()})),
        "worker.env": dict(shared, DOSSIER_MAIL_MODE="test"),
    }
    for name, values in files.items():
        (args.directory / name).write_text("".join(f"{k}={v}\n" for k, v in values.items()))


if __name__ == "__main__":
    main()
