"""Operator-only commands for the guest trial. Never emits document access credentials."""
import argparse
import base64
import io
import os
import sys
from uuid import UUID

sys.path.insert(0, "/srv/dossier")
from core import database, today
from owner import owner_action, save_version, scan_file

OWNER, DOC, VERSION, SHARE = [UUID(int=0x4000a000000000000000 + i) for i in range(1, 5)]


def seed(db, recipient):
    from PIL import Image, ImageDraw

    image = Image.new("RGB", (800, 360), "white")
    drawing = ImageDraw.Draw(image)
    drawing.text((40, 64), "Clementplane - Document fictif", fill="black", font_size=34)
    drawing.text((40, 148), "Essai de partage sur invitation", fill="black", font_size=26)
    out = io.BytesIO()
    image.save(out, "PDF", resolution=100)
    payload = dict(doc=str(DOC), request=str(VERSION), kind="autre", title="Document fictif Clementplane",
                   expiry_mode="none", file=base64.b64encode(out.getvalue()).decode())
    save_version(db, OWNER, payload, scan_file(payload))
    owner_action(db, OWNER, "share", dict(request=str(SHARE), docs=[str(DOC)],
                                         ends=today().isoformat(), email=recipient))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("action", choices=("seed", "status", "send", "revoke"))
    action = p.parse_args().action
    address = os.environ["DOSSIER_TEST_MAILBOXES"]
    if not address or "," in address:
        raise SystemExit("A single trial mailbox is required.")
    with database() as db:
        identity = db.execute("select current_database() as db, current_user as role").fetchone()
        if identity != {"db": "guest_trial", "role": "trial_runtime"}:
            raise SystemExit("Wrong trial database or role.")
        if action == "seed":
            seed(db, address)
        if action == "revoke":
            owner_action(db, OWNER, "revoke", {"share": str(SHARE)})
        rows = db.execute("select kind,state,count(*) as n from mail group by kind,state order by kind,state").fetchall()
        for row in rows:
            print(row["kind"], row["state"], row["n"])
        if action == "send":
            if os.environ.get("DOSSIER_MAIL_MODE") != "test":
                raise SystemExit("Test mail mode is required.")
            shares = db.execute("select id,email,state from today_shares").fetchall()
            if shares != [{"id": SHARE, "email": address, "state": "active"}]:
                raise SystemExit("Expected one active share to the trial mailbox.")
    if action == "send":
        import worker
        key = sys.stdin.readline().strip()
        if not key:
            raise SystemExit("Missing provider key on private stdin.")
        os.environ["BREVO_API_KEY"] = key
        print("One due job processed." if worker.process_one() else "No due job.")


if __name__ == "__main__":
    main()
