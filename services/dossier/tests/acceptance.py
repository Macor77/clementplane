"""Integration fixture. Creates a fresh database on loopback, never uses a configured production DSN."""

import base64
import io
import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from urllib.parse import urlsplit
from uuid import uuid4

import httpx
import pikepdf
import psycopg
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from psycopg.conninfo import make_conninfo

ROOT = Path(__file__).resolve().parents[3]
SERVICE = ROOT / "services/dossier"
sys.path.insert(0, str(SERVICE))
os.environ.update(
    DOSSIER_WEB_ORIGIN="https://client.example.invalid",
    DOSSIER_ENABLED="1",
    DOSSIER_CURRENT_KEY_ID="test",
    DOSSIER_FILE_KEYS=json.dumps({"test": base64.b64encode(os.urandom(32)).decode()}),
    DOSSIER_HMAC_KEY="fictitious-test-only-" + str(uuid4()),
    DOSSIER_MAIL_MODE="off",
)
import api
import core
import owner
import worker


def postgres_binaries():
    import shutil

    if shutil.which("pg_config"):
        path = Path(
            subprocess.check_output(["pg_config", "--bindir"], text=True).strip()
        )
        if (path / "initdb").is_file():
            return path
    import pgserver

    return Path(pgserver.__file__).parent / "pginstall/bin"


def pdf_sample():
    with pikepdf.Pdf.new() as pdf:
        pdf.add_blank_page()
        pdf.add_blank_page()
        out = io.BytesIO()
        pdf.save(out)
        return out.getvalue()


def image_sample(fmt):
    out = io.BytesIO()
    Image.new("RGB", (40, 22), "white").save(out, fmt)
    return out.getvalue()


class DossierTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.tmp.cleanup)
        root = Path(cls.tmp.name)
        pg = postgres_binaries()
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]
        subprocess.run(
            [pg / "initdb", "-A", "trust", "-U", "fixture", "-D", root / "db"],
            stdout=subprocess.DEVNULL,
            check=True,
        )
        subprocess.run(
            [
                pg / "pg_ctl",
                "-D",
                root / "db",
                "-l",
                root / "postgres.log",
                "-o",
                f"-h 127.0.0.1 -p {port} -c unix_socket_directories='' -c log_min_error_statement=panic",
                "start",
            ],
            stdout=subprocess.DEVNULL,
            check=True,
        )
        cls.addClassCleanup(
            subprocess.run,
            [pg / "pg_ctl", "-D", root / "db", "-m", "immediate", "stop"],
            stdout=subprocess.DEVNULL,
        )
        cls.admin = psycopg.connect(
            host="127.0.0.1",
            port=port,
            user="fixture",
            dbname="postgres",
            autocommit=True,
        )
        cls.addClassCleanup(cls.admin.close)
        cls.admin.execute("""create role anon; create role authenticated; create role service_role;
        create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
        create table auth.sessions(id uuid,user_id uuid,not_after timestamptz);
        create table public.trainers(id uuid primary key,user_id uuid,prenom text,nom text);
        create table public.organizations(id uuid primary key,name text,status text);
        create table public.organization_members(user_id uuid,organization_id uuid,status text,role text);
        create table public.trainer_availability_contacts(trainer_id uuid,organization_id uuid,email text);
        create table public.organization_trainers(trainer_id uuid,organization_id uuid);
        create table public.platform_admins(user_id uuid);""")
        cls.admin.execute(
            next(
                (ROOT / "supabase/migrations").glob("*professional_dossier.sql")
            ).read_text()
        )
        cls.admin.execute(
            "create role dossier_test_login login; grant dossier_runtime to dossier_test_login"
        )
        os.environ["DOSSIER_DSN"] = make_conninfo(
            host="127.0.0.1", port=port, user="dossier_test_login", dbname="postgres"
        )
        cls.client = TestClient(api.app)
        if os.getenv("DOSSIER_REAL_SCANNER") != "1":
            # Real parser subprocess; antivirus and scanner transport are simulated in this mode.
            def scan(body):
                raw = base64.b64decode(body["file"])
                if len(raw) > core.MAX:
                    raise HTTPException(413)
                result = subprocess.run(
                    [sys.executable, "-I", SERVICE / "validator.py"],
                    input=raw,
                    capture_output=True,
                )
                if result.returncode:
                    raise HTTPException(422)
                mime, data = result.stdout.split(b"\n", 1)
                return mime.decode(), data

            mock = patch("api.scan_file", side_effect=scan)
            mock.start()
            cls.addClassCleanup(mock.stop)

    def setUp(self):
        self.owner, self.other, self.of, self.viewer = users = [
            uuid4() for _ in range(4)
        ]
        self.org, self.org2 = uuid4(), uuid4()
        self.logins = {}
        for i, u in enumerate(users):
            sid = uuid4()
            self.admin.execute(
                "insert into auth.users values(%s,%s,now())",
                (u, f"{u}@example.invalid"),
            )
            self.admin.execute("insert into auth.sessions values(%s,%s,null)", (sid, u))
            self.logins[str(u)] = (u, sid, "aal1")
            if i < 2:
                self.admin.execute(
                    "insert into trainers values(%s,%s,'Camille','Démo')", (u, u)
                )
        for org in (self.org, self.org2):
            self.admin.execute(
                "insert into organizations values(%s,'OF fictif','active')", (org,)
            )
        for uid, org, role in [
            (self.of, self.org, "manager"),
            (self.viewer, self.org, "viewer"),
            (self.other, self.org2, "owner"),
        ]:
            self.admin.execute(
                "insert into organization_members values(%s,%s,'active',%s)",
                (uid, org, role),
            )
        self.admin.execute(
            "insert into organization_trainers values(%s,%s)", (self.owner, self.org)
        )
        mock = patch(
            "api.identity",
            side_effect=lambda token: (
                self.logins[token[7:]] if token[7:] in self.logins else self.deny()
            ),
        )
        mock.start()
        self.addCleanup(mock.stop)
        self.doc = str(uuid4())
        self.version = str(uuid4())
        self.b = dict(
            doc=self.doc,
            request=self.version,
            kind="cv",
            title="Pièce fictive",
            note="Note personnelle fictive",
            expiry_mode="unknown",
            file=base64.b64encode(pdf_sample()).decode(),
        )

    @staticmethod
    def deny():
        raise HTTPException(401)

    def req(self, action, b=None, user=None, status=200):
        res = self.client.post(
            "/v1/" + action,
            json=b or {},
            headers={"Authorization": "Bearer " + str(user or self.owner)},
        )
        self.assertEqual(
            res.status_code,
            status,
            (action, res.text[:140] if res.status_code != 200 else "ok"),
        )
        self.assertIn("no-store", res.headers["cache-control"])
        return res

    def share(self, guest=False):
        sid = str(uuid4())
        b = {"request": sid, "docs": [self.doc]}
        b.update(
            {"email": sid + "@example.invalid"} if guest else {"org": str(self.org)}
        )
        self.req("share", b)
        self.req("share", b)
        return sid

    def test_upload_and_owner_controls(self):
        self.req("upload", self.b, self.of, 404)
        self.req("upload", self.b, status=200)
        self.req("upload", self.b)
        self.req(
            "upload",
            {
                **self.b,
                "doc": str(uuid4()),
                "request": str(uuid4()),
                "file": base64.b64encode(b"ordinary text").decode(),
            },
            status=422,
        )
        self.req(
            "upload",
            {
                **self.b,
                "request": str(uuid4()),
                "file": base64.b64encode(bytes(core.MAX + 100)).decode(),
            },
            status=413,
        )
        for fmt in ("JPEG", "PNG"):
            self.req(
                "upload",
                {
                    **self.b,
                    "doc": str(uuid4()),
                    "request": str(uuid4()),
                    "expiry_mode": "none",
                    "file": base64.b64encode(image_sample(fmt)).decode(),
                },
            )
        data = self.req("overview").json()
        self.assertEqual(len(data["documents"]), 3)
        self.assertEqual(data["shares"], [])
        for actor in (self.of, self.other):
            for action in ("file", "edit", "delete", "history"):
                self.req(
                    action,
                    {
                        "doc": self.doc,
                        "previous": self.version,
                        "version": self.version,
                    },
                    actor,
                    404,
                )
        self.req(
            "upload",
            {
                **self.b,
                "previous": self.version,
                "recipients": [],
                "request": str(uuid4()),
            },
            self.other,
            404,
        )
        self.assertFalse(self.req("overview", user=self.other).json()["documents"])
        self.admin.execute("insert into platform_admins values(%s)", (self.owner,))
        self.req("overview", status=403)
        u, s, _ = self.logins[str(self.owner)]
        self.logins[str(u)] = (u, s, "aal2")
        self.req("overview")
        self.admin.execute("delete from auth.sessions where id=%s", (s,))
        self.req("overview", status=404)

    def test_org_access_and_versions(self):
        self.req("upload", self.b)
        sid = self.share()
        sid_guest = self.share(True)
        target = {
            "org": str(self.org),
            "share": sid,
            "doc": self.doc,
            "version": self.version,
            "download": True,
        }
        self.assertEqual(
            self.req("contents", target, self.of).json()[0].get("note"), None
        )
        self.assertEqual(
            self.req("file", target, self.of).content,
            pdf_sample_bytes := base64.b64decode(self.b["file"]),
        )
        self.assertTrue(pdf_sample_bytes.startswith(b"%PDF"))
        stored = self.admin.execute(
            "select bytes from dossier.versions where id=%s", (self.version,)
        ).fetchone()[0]
        self.assertNotEqual(bytes(stored), pdf_sample_bytes)
        if os.getenv("DOSSIER_REAL_SCANNER") == "1":
            preview = self.req(
                "file", {**target, "download": False, "page": 2}, self.of
            )
            self.assertEqual(preview.headers["x-document-pages"], "2")
            self.assertTrue(preview.content.startswith(b"\xff\xd8"))
        self.req("file", target, self.viewer, 404)
        self.req("file", {**target, "org": str(self.org2)}, self.other, 404)
        self.req("history", {"doc": self.doc}, self.of, 404)
        self.req("upload", {**self.b, "doc": str(uuid4()), "request": str(uuid4())})
        self.assertEqual(len(self.req("contents", target, self.of).json()), 1)
        ver2 = str(uuid4())
        replacement = {
            **self.b,
            "previous": self.version,
            "request": ver2,
            "recipients": [sid, sid_guest],
            "notify": [sid],
        }
        self.req("upload", {**replacement, "recipients": []}, status=409)
        self.req("upload", replacement)
        self.req("upload", replacement)
        self.req("file", target, self.of, 404)
        history = self.req("history", {"doc": self.doc}).json()
        self.assertEqual([v["version_id"] for v in history], [self.version])
        self.req("file", {"doc": self.doc, "version": self.version, "download": True})
        rows = self.admin.execute(
            "select share_id from dossier.mail where owner_id=%s and kind='replacement'",
            (self.owner,),
        ).fetchall()
        self.assertEqual(rows, [(core.uuid(sid),)])
        ver3 = str(uuid4())
        self.req(
            "upload", {**replacement, "previous": ver2, "request": ver3, "notify": []}
        )
        self.admin.execute(
            "update organization_members set status='inactive' where user_id=%s",
            (self.of,),
        )
        self.req("file", {**target, "version": ver3}, self.of, 404)

    def test_org_download_after_revocation(self):
        self.req("upload", self.b)
        inbox = {"org": str(self.org)}
        self.assertEqual(self.req("inbox", inbox, self.of).json(), [])
        share_id = self.share()
        selected = {**inbox, "share": share_id}
        download = {
            **selected,
            "doc": self.doc,
            "version": self.version,
            "download": True,
        }
        self.assertEqual(len(self.req("inbox", inbox, self.of).json()), 1)
        self.assertEqual(
            self.req("file", download, self.of).content,
            base64.b64decode(self.b["file"]),
        )

        self.req("revoke", {"share": share_id})
        self.assertEqual(self.req("inbox", inbox, self.of).json(), [])
        self.req("file", download, self.of, 404)

    def test_guest_follows_mailed_invitation_and_code(self):
        # Only the provider transport is intercepted in the worker. Open the
        # invitation and use the code from its messages as an anonymous guest.
        self.admin.execute(
            "update dossier.mail set state='held' where owner_id<>%s", (self.owner,)
        )
        self.req("upload", self.b)
        self.req("upload", {
            **self.b, "doc": str(uuid4()), "request": str(uuid4()),
            "title": "Autre pièce privée",
        })
        allowed = self.share(guest=True)
        blocked = self.share(guest=True)
        mailbox = allowed + "@example.invalid"

        def guest(action, body, status=200):
            response = self.client.post("/v1/" + action, json=body)
            self.assertEqual(response.status_code, status, action)
            return response

        def check_message(call, subject):
            self.assertEqual(call.args, ("https://api.brevo.com/v3/smtp/email",))
            envelope = call.kwargs["json"]
            self.assertEqual(envelope["sender"]["email"], "contact@clementplane.fr")
            self.assertEqual(
                envelope["to"], [{"email": mailbox, "contactPixelTrackingConsent": False}]
            )
            self.assertTrue({"cc", "bcc", "attachment"}.isdisjoint(envelope))
            self.assertEqual(envelope["subject"], subject)
            self.assertNotIn(self.b["title"], envelope["textContent"])
            self.assertNotIn(self.b["note"], envelope["textContent"])
            return envelope["textContent"]

        settings = {
            "DOSSIER_MAIL_MODE": "test",
            "DOSSIER_TEST_MAILBOXES": mailbox,
            "BREVO_API_KEY": "fixture",
        }
        with patch.dict(os.environ, settings), patch(
            "worker.httpx.post", return_value=httpx.Response(201)
        ) as transport:
            while worker.process_one():
                pass
            self.assertEqual(transport.call_count, 1)
            invitation = check_message(
                transport.call_args, "Invitation à consulter un dossier professionnel"
            )
            url = urlsplit(invitation.splitlines()[-1])
            self.assertEqual(
                url._replace(fragment="").geturl(),
                os.environ["DOSSIER_WEB_ORIGIN"] + "/dossier-invite.html",
            )
            self.assertTrue(url.fragment)
            link = {"link": url.fragment}
            guest("guest-list", link, 403)
            guest("request-code", link)
            self.assertTrue(worker.process_one())
            self.assertFalse(worker.process_one())
            self.assertEqual(transport.call_count, 2)
            message = check_message(transport.call_args, "Votre code Clementplane")
            codes = re.findall(r"\b[0-9]{8}\b", message)
            self.assertEqual(len(codes), 1)
            self.assertNotIn(url.fragment, message)
            ticket = guest("verify-code", {**link, "code": codes[0]}).json()
            rows = guest("guest-list", ticket).json()
            self.assertEqual([row["id"] for row in rows], [self.doc])
            self.assertNotIn("note", rows[0])
            target = {**ticket, "doc": self.doc, "version": self.version, "download": True}
            self.assertEqual(
                guest("guest-file", target).content, base64.b64decode(self.b["file"])
            )
            self.req("revoke", {"share": allowed})
            guest("guest-file", target, 404)
            self.assertFalse(worker.process_one())
            self.assertEqual(transport.call_count, 2)
        blocked_job = self.admin.execute(
            "select state from dossier.mail where share_id=%s", (blocked,)
        ).fetchone()
        self.assertEqual(blocked_job, ("held",))

    def test_guest_expiration_and_revocation(self):
        self.req("upload", self.b)
        sid = self.share(True)
        link = core.invitation(sid)
        request = {"link": link}
        self.req("guest-list", request, status=403)
        self.req("request-code", request)
        self.req("request-code", request, status=429)
        nonce = self.admin.execute(
            "select nonce from dossier.challenges where share_id=%s", (sid,)
        ).fetchone()[0]
        for _ in range(5):
            self.req("verify-code", {**request, "code": "invalid"}, status=403)
        self.req("verify-code", {**request, "code": core.code(nonce)}, status=403)
        self.admin.execute(
            "update dossier.limits set started=now()-interval '2 minutes' where key=%s",
            ("otp/cooldown/" + sid,),
        )
        self.req("request-code", request)
        nonce = self.admin.execute(
            "select nonce from dossier.challenges where share_id=%s", (sid,)
        ).fetchone()[0]
        self.admin.execute(
            "update dossier.challenges set expires=now()-interval '1 second' where share_id=%s",
            (sid,),
        )
        self.req("verify-code", {**request, "code": core.code(nonce)}, status=403)
        self.admin.execute(
            "update dossier.challenges set expires=now()+interval '1 minute' where share_id=%s",
            (sid,),
        )
        ticket = self.req("verify-code", {**request, "code": core.code(nonce)}).json()
        self.assertEqual(self.req("guest-list", ticket).json()[0]["id"], self.doc)
        self.req(
            "guest-file",
            {**ticket, "doc": self.doc, "version": self.version, "download": True},
        )
        self.admin.execute(
            "update dossier.shares set ends=%s where id=%s",
            (core.today() - timedelta(days=1), sid),
        )
        self.req("guest-list", ticket, status=404)
        self.req("renew", {"share": sid, "ends": str(core.today() + timedelta(days=3))})
        self.req("guest-list", ticket, status=404)
        self.admin.execute(
            "update dossier.limits set started=now()-interval '2 minutes' where key=%s",
            ("otp/cooldown/" + sid,),
        )
        self.req("request-code", request)
        nonce = self.admin.execute(
            "select nonce from dossier.challenges where share_id=%s", (sid,)
        ).fetchone()[0]
        ticket = self.req("verify-code", {**request, "code": core.code(nonce)}).json()
        self.req("revoke", {"share": sid})
        self.req(
            "guest-file",
            {**ticket, "doc": self.doc, "version": self.version, "download": True},
            status=404,
        )

    def test_reminders_purge_and_snapshot(self):
        self.req("upload", self.b)
        docs = [self.doc, str(uuid4())]
        self.req("upload", {**self.b, "doc": docs[1], "request": str(uuid4())})
        self.req("share", {"request": str(uuid4()), "docs": docs, "org": str(self.org)})

        def sweep():
            with core.database() as db:
                worker.maintain(db)

        for offset in (30, 7, 3, -1):
            expiry = core.today() + timedelta(days=offset)
            self.req(
                "edit",
                {
                    **self.b,
                    "previous": self.version,
                    "expiry_mode": "dated",
                    "expiry": str(expiry),
                },
            )
            sweep()
            sweep()
            with core.database() as db:
                jobs = db.execute(
                    "select * from mail where owner_id=%s and kind='reminder'",
                    (self.owner,),
                ).fetchall()
                self.assertEqual(
                    sum(worker.message(db, j) is not None for j in jobs),
                    int(offset in (30, 7)),
                )
        shares = self.req("overview").json()["shares"]
        self.req(
            "file",
            {
                "org": str(self.org),
                "share": shares[0]["id"],
                "doc": self.doc,
                "version": self.version,
                "download": True,
            },
            self.of,
        )
        self.req("delete", {"doc": self.doc, "previous": self.version})
        self.assertEqual(
            self.admin.execute(
                "select count(*) from dossier.versions where doc_id=%s", (self.doc,)
            ).fetchone()[0],
            0,
        )
        self.admin.execute("delete from auth.users where id=%s", (self.owner,))
        self.assertEqual(
            self.admin.execute(
                "select count(*) from dossier.documents where owner_id=%s",
                (self.owner,),
            ).fetchone()[0],
            0,
        )

    def test_local_backup_restore_and_delete(self):
        import protection
        from psycopg import sql

        self.req("upload", self.b)
        pg = postgres_binaries()
        port = str(self.admin.info.port)
        backup = Path(self.tmp.name) / "fixture.dump"
        subprocess.run(
            [
                pg / "pg_dump",
                "-Fc",
                "-h",
                "127.0.0.1",
                "-p",
                port,
                "-U",
                "fixture",
                "-f",
                backup,
                "postgres",
            ],
            check=True,
        )
        self.req("delete", {"doc": self.doc, "previous": self.version})
        restored_name = "restore_" + uuid4().hex[:12]
        self.admin.execute(
            sql.SQL("create database {}").format(sql.Identifier(restored_name))
        )
        subprocess.run(
            [
                pg / "pg_restore",
                "--exit-on-error",
                "-h",
                "127.0.0.1",
                "-p",
                port,
                "-U",
                "fixture",
                "-d",
                restored_name,
                backup,
            ],
            check=True,
        )
        with psycopg.connect(
            host="127.0.0.1", port=port, user="fixture", dbname=restored_name
        ) as restored:
            row = restored.execute(
                "select key_id,mime,bytes from dossier.versions where id=%s",
                (self.version,),
            ).fetchone()
            self.assertEqual(
                protection.unseal(
                    row[0], self.doc, self.version, row[1], bytes(row[2])
                ),
                base64.b64decode(self.b["file"]),
            )
            restored.execute(
                "delete from dossier.documents where id=%s and owner_id=%s",
                (self.doc, self.owner),
            )
            self.assertIsNone(
                restored.execute(
                    "select id from dossier.versions where id=%s", (self.version,)
                ).fetchone()
            )
        backup.unlink()

    def test_limits_cleanup_and_worker(self):
        self.req("upload", self.b)
        extra = {**self.b, "doc": str(uuid4()), "request": str(uuid4())}
        for name in ("MAX_OWNER_BYTES", "MAX_TOTAL_BYTES", "MAX_DOCUMENTS"):
            with patch("owner." + name, 1):
                self.req("upload", extra, status=409)
        self.assertEqual(len(self.req("overview").json()["documents"]), 1)
        sid = self.share(True)
        command = {"share": sid, "request": str(uuid4())}
        self.req("resend", command)
        self.req("resend", command)
        self.req("resend", {**command, "request": str(uuid4())}, status=429)
        replacement = {
            **self.b,
            "previous": self.version,
            "request": str(uuid4()),
            "recipients": [sid],
            "notify": [],
        }
        self.req("upload", replacement)
        self.admin.execute(
            "update dossier.versions set retired_at=now()-interval '31 days' where id=%s",
            (self.version,),
        )
        self.admin.execute(
            "update dossier.events set at=now()-interval '181 days' where owner_id=%s",
            (self.owner,),
        )
        with core.database() as db:
            worker.maintain(db)
        self.assertEqual(self.req("history", {"doc": self.doc}).json(), [])
        self.assertEqual(
            self.admin.execute(
                "select count(*) from dossier.events where owner_id=%s", (self.owner,)
            ).fetchone()[0],
            0,
        )
        self.admin.execute(
            "update dossier.mail set state='held' where owner_id<>%s", (self.owner,)
        )
        sent = []

        def fake_send(job, payload):
            self.assertTrue(payload[0].endswith("@example.invalid"))
            self.assertNotIn("Note personnelle", payload[2])
            sent.append(job["id"])
            return "accepted"

        with patch("worker.deliver", side_effect=fake_send):
            while worker.process_one():
                pass
            self.assertFalse(worker.process_one())
        self.assertEqual(len(sent), 2)
        self.assertEqual(len(set(sent)), 2)
        self.assertEqual(
            self.req("overview").json()["shares"][0]["mail_state"], "accepted"
        )

    def test_expiry_catchup(self):
        self.req(
            "upload",
            {
                **self.b,
                "expiry_mode": "dated",
                "expiry": str(core.today() + timedelta(days=6)),
            },
        )
        with core.database() as db:
            worker.maintain(db)
        self.assertEqual(self.req("overview").json()["reminders"], [])
        self.admin.execute(
            "update dossier.versions set expiry_set_on=%s where id=%s",
            (core.today() - timedelta(days=40), self.version),
        )
        with core.database() as db:
            worker.maintain(db)
            worker.maintain(db)
            jobs = db.execute(
                "select * from mail where owner_id=%s and kind='reminder'",
                (self.owner,),
            ).fetchall()
            self.assertEqual([r["days_before"] for r in jobs], [7])
            self.assertIsNotNone(worker.message(db, jobs[0]))
        self.req("edit", {**self.b, "previous": self.version, "expiry_mode": "none"})
        with core.database() as db:
            self.assertIsNone(worker.message(db, jobs[0]))

    @unittest.skipUnless(
        os.getenv("DOSSIER_REAL_SCANNER") == "1", "requires a live ClamAV daemon"
    )
    def test_official_eicar_rejected_before_storage(self):
        import asyncio
        from scanner import clamd

        marker = (
            b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$"
            b"EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
        )
        verdict = asyncio.run(asyncio.wait_for(clamd(b"INSTREAM", marker), 15))
        self.assertIn(b"eicar", verdict.lower())
        self.assertTrue(verdict.endswith(b" FOUND"))
        self.req(
            "upload", {**self.b, "file": base64.b64encode(marker).decode()}, status=422
        )
        self.assertEqual(self.req("overview").json()["documents"], [])

    @unittest.skipUnless(
        os.getenv("DOSSIER_REAL_SCANNER") == "1"
        and os.getenv("DOSSIER_TEST_SIGNATURE") == "1",
        "requires isolated benign AV test signature",
    )
    def test_benign_detection(self):
        out = io.BytesIO()
        Image.new("RGB", (17, 13), "navy").save(out, "PNG")
        self.req(
            "upload",
            {**self.b, "file": base64.b64encode(out.getvalue()).decode()},
            status=422,
        )
        self.assertEqual(self.req("overview").json()["documents"], [])

    def test_scanner_outage_and_retry(self):
        missing_socket = str(Path(self.tmp.name) / "offline.sock")
        with (
            patch.dict(os.environ, DOSSIER_SCANNER_SOCKET=missing_socket),
            patch("api.scan_file", owner.scan_file),
        ):
            self.req("upload", self.b, status=503)
            self.assertEqual(self.req("overview").json()["documents"], [])

        self.req("upload", self.b)
        self.req("upload", self.b)
        self.assertEqual(len(self.req("overview").json()["documents"]), 1)
        share = self.share()
        target = {
            "org": str(self.org),
            "share": share,
            "doc": self.doc,
            "version": self.version,
            "download": True,
        }
        new_version = str(uuid4())
        new_bytes = image_sample("PNG")
        replacement = {
            **self.b,
            "request": new_version,
            "previous": self.version,
            "file": base64.b64encode(new_bytes).decode(),
            "recipients": [share],
            "notify": [share],
        }
        with (
            patch.dict(os.environ, DOSSIER_SCANNER_SOCKET=missing_socket),
            patch("api.scan_file", owner.scan_file),
        ):
            self.req("upload", replacement, status=503)
            self.assertEqual(
                self.req("file", target, self.of).content,
                base64.b64decode(self.b["file"]),
            )
            self.req("file", {**target, "version": new_version}, self.of, 404)
            self.assertEqual(self.req("history", {"doc": self.doc}).json(), [])
            self.assertFalse(
                self.admin.execute(
                    "select 1 from dossier.mail where owner_id=%s and kind='replacement'",
                    (self.owner,),
                ).fetchall()
            )

        self.req("upload", replacement)
        self.req("upload", replacement)
        self.req("file", target, self.of, 404)
        self.assertTrue(
            self.req(
                "file", {**target, "version": new_version}, self.of
            ).content.startswith(b"\x89PNG")
        )
        history = self.req("history", {"doc": self.doc}).json()
        self.assertEqual([v["version_id"] for v in history], [self.version])
        self.assertEqual(
            self.admin.execute(
                "select count(*) from dossier.mail where owner_id=%s and kind='replacement'",
                (self.owner,),
            ).fetchone()[0],
            1,
        )

    def test_permissions_and_fail_closed(self):
        for role in ("anon", "authenticated", "service_role"):
            self.assertFalse(
                self.admin.execute(
                    "select has_schema_privilege(%s,'dossier','usage')", (role,)
                ).fetchone()[0]
            )
        with patch.dict(os.environ, DOSSIER_ENABLED="0"):
            for action in api.ACTIONS:
                with self.subTest(action=action):
                    self.req(action, status=404)
        self.req("overview", user="absent", status=401)
        with core.database() as db:
            db.execute("select count(*) from documents")
            with self.assertRaises(psycopg.errors.InsufficientPrivilege):
                db.execute("select * from auth.users")
            db.rollback()


if __name__ == "__main__":
    unittest.main(verbosity=2)
