"""Run as a supervised process. Due times use Europe/Paris, including change of clock."""

import os
import time
from datetime import timedelta
import httpx
from core import code, database, invitation, today


def maintain(db):
    db.execute("""delete from versions where retired_at <= now()-interval '30 days'""")
    db.execute("delete from events where at <= now()-interval '180 days'")
    db.execute("delete from sessions where expires<=now()")
    db.execute("delete from challenges where expires<=now()")
    db.execute("delete from limits where started<now()-interval '2 days'")
    db.execute("delete from mail where created_at<now()-interval '30 days'")
    db.execute(
        """delete from shares where revoked_at<now()-interval '30 days' or ends<%s""",
        (today() - timedelta(days=30),),
    )
    db.execute(
        """insert into mail(unique_key,owner_id,version_id,kind,expiry,days_before)
        select concat('reminder/',v.id,'/',v.expiry,'/',k.days), d.owner_id,v.id,'reminder',v.expiry,k.days
        from versions v join documents d on d.current_version=v.id
        cross join lateral (select case when v.expiry-%s::date <=7 then 7 else 30 end as days) k
        where v.expiry between %s::date+1 and %s::date+30 and v.expiry_set_on<=v.expiry-k.days
        on conflict(unique_key) do nothing""",
        (today(),) * 3,
    )


def message(db, j):
    origin = os.environ["DOSSIER_WEB_ORIGIN"]
    if j["kind"] == "reminder":
        doc = db.execute(
            """select a.email from versions v join documents d on d.current_version=v.id
            join accounts a on a.id=d.owner_id where v.id=%s and v.expiry=%s and v.expiry-%s::date between %s and %s and v.expiry_set_on<=v.expiry-%s""",
            (
                j["version_id"],
                j["expiry"],
                today(),
                1 if j["days_before"] == 7 else 8,
                j["days_before"],
                j["days_before"],
            ),
        ).fetchone()
        if doc:
            return (
                doc["email"],
                "Échéance de votre dossier professionnel",
                f"Un document arrive à échéance le {j['expiry'].strftime('%d/%m/%Y')}. {origin}/formateur/dossier",
            )
        return None
    s = db.execute(
        "select * from today_shares where id=%s and state='active'", (j["share_id"],)
    ).fetchone()
    if not s:
        return None
    if (
        j["kind"] == "replacement"
        and not db.execute(
            """select 1 from items i join documents d on d.id=i.doc_id
        where i.share_id=%s and d.current_version=%s""",
            (s["id"], j["version_id"]),
        ).fetchone()
    ):
        return None
    address = s["email"]
    if address:
        link = origin + "/dossier-invite.html#" + invitation(s["id"])
    else:
        manager = db.execute(
            """select a.email from managers m join accounts a on a.id=m.user_id where organization_id=%s
            order by case m.role when 'owner' then 0 when 'admin' then 1 else 2 end,m.user_id limit 1""",
            (s["org_id"],),
        ).fetchone()
        if not manager:
            return None
        address = manager["email"]
        link = origin + "/dossiers-recus"
    if j["kind"] == "code":
        c = db.execute(
            "select nonce from challenges where share_id=%s and nonce=%s and expires>now() and attempts<5",
            (s["id"], j["challenge"]),
        ).fetchone()
        return (
            (
                address,
                "Votre code Clementplane",
                f"Votre code temporaire est {code(c['nonce'])}.",
            )
            if c
            else None
        )
    subject = (
        "Invitation à consulter un dossier professionnel"
        if j["kind"] == "invite"
        else "Un document partagé a été remplacé"
    )
    return (
        address,
        subject,
        f"{subject}. Ouvrez votre espace sécurisé Clementplane.\n{link}",
    )


def deliver(j, payload):
    address, subject, content = payload
    mode = os.getenv("DOSSIER_MAIL_MODE", "off")
    if mode == "off":
        return "held"
    if mode == "test" and address.lower() not in os.getenv(
        "DOSSIER_TEST_MAILBOXES", ""
    ).lower().split(","):
        return "held"
    if mode not in ("test", "live"):
        return "held"
    try:
        result = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            timeout=8,
            headers={"api-key": os.environ["BREVO_API_KEY"]},
            json={
                "sender": {"email": "contact@clementplane.fr", "name": "Clementplane"},
                "to": [{"email": address}],
                "subject": subject,
                "textContent": content,
                "headers": {"idempotencyKey": str(j["id"])},
            },
        )
    except httpx.HTTPError:
        return "unknown"
    if result.status_code == 429:
        return "retry"
    return (
        "accepted"
        if result.is_success
        else ("unknown" if result.status_code >= 500 else "failed")
    )


def process_one():
    # Commit an in-flight marker before invoking Brevo. A crash leaves an ambiguous send for reconciliation.
    with database() as db:
        j = db.execute("""update mail set state='sending',attempts=attempts+1 where id=(
            select id from mail where state in ('queued','retry') and due<=now() order by due
            for update skip locked limit 1) returning *""").fetchone()
    if not j:
        return False
    with database() as db:
        payload = message(db, j)
        outcome = deliver(j, payload) if payload else "cancelled"
        if outcome == "retry" and j["attempts"] >= 4:
            outcome = "failed"
        db.execute(
            "update mail set state=%s,due=now()+make_interval(mins=>%s) where id=%s",
            (outcome, 2 ** j["attempts"], j["id"]),
        )
    return True


def run():
    last = 0
    while True:
        if os.getenv("DOSSIER_ENABLED") == "1":
            try:
                if time.monotonic() - last > 60 or not last:
                    with database() as db:
                        maintain(db)
                    last = time.monotonic()
                if process_one():
                    continue
            except Exception:
                print("dossier_worker_unavailable", flush=True)
        time.sleep(5)


if __name__ == "__main__":
    run()
