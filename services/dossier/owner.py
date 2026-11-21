import base64
from datetime import timedelta
import httpx
from fastapi import HTTPException
from protection import seal
from core import scanner_client
from core import (
    MAX,
    META,
    active_recipients,
    date_field,
    event,
    fields,
    fixed_window,
    guest_email,
    lock_owner,
    one,
    queue,
    today,
    uuid,
    uuid_set,
    digest,
)


MAX_DOCUMENTS = 30
MAX_OWNER_BYTES = 64 << 20
MAX_TOTAL_BYTES = 512 << 20


def overview(db, uid):
    docs = db.execute(
        f"""select d.id,{META},v.note from documents d join versions v
        on d.current_version=v.id where d.owner_id=%s order by d.created_at desc""",
        (uid,),
    ).fetchall()
    shares = db.execute(
        """select s.id,s.email,s.org_id,coalesce(p.name,s.org_name,s.email,'Organisme') as label,s.ends,s.state,
        (select m.state from mail m where m.share_id=s.id and m.kind='invite' order by m.created_at desc limit 1) as mail_state,
        array(select doc_id from items where share_id=s.id) as docs from today_shares s
        left join partners p on p.id=s.org_id and p.user_id=s.owner_id where s.owner_id=%s order by s.created_at desc""",
        (uid,),
    ).fetchall()
    partners = db.execute(
        "select id,name from partners where user_id=%s order by name", (uid,)
    ).fetchall()
    reminders = db.execute(
        """select distinct v.id as version_id,m.days_before,v.title,m.expiry from mail m join versions v on v.id=m.version_id
        join documents d on d.current_version=v.id where m.owner_id=%s and m.kind='reminder' and m.expiry=v.expiry
        and m.expiry >= (now() at time zone 'Europe/Paris')::date order by m.expiry,m.days_before""",
        (uid,),
    ).fetchall()
    return dict(documents=docs, shares=shares, partners=partners, reminders=reminders)


def scan_file(body):
    try:
        raw = base64.b64decode(body["file"], validate=True)
    except (ValueError, TypeError, KeyError):
        raise HTTPException(422, "Fichier illisible.") from None
    if not 0 < len(raw) <= MAX:
        raise HTTPException(413, "Maximum 5 Mio par document.")
    try:
        with scanner_client() as scanner:
            res = scanner.post("/validate", content=raw)
    except httpx.HTTPError:
        raise HTTPException(
            503, "Contrôle du fichier indisponible. Réessayez."
        ) from None
    if res.status_code != 200:
        raise HTTPException(
            422 if res.status_code in (413, 422) else 503,
            "Fichier refusé ou contrôle indisponible.",
        )
    mime = res.headers.get("content-type")
    if (
        mime not in ("application/pdf", "image/png", "image/jpeg")
        or not 0 < len(res.content) <= MAX
    ):
        raise HTTPException(503)
    return mime, res.content


def save_version(db, uid, body, scanned):
    doc, version = uuid(body.get("doc")), uuid(body.get("request"))
    metadata = fields(body)
    replacing = body.get("previous") is not None
    # Global capacity check and insert share a transaction; all uploads use this lock order.
    db.execute("select pg_advisory_xact_lock(18112026)")
    lock_owner(db, uid)
    if db.execute(
        "select 1 from versions v join documents d on d.id=v.doc_id where v.id=%s and d.id=%s and d.owner_id=%s",
        (version, doc, uid),
    ).fetchone():
        return {"id": doc}
    if replacing:
        current = one(
            db,
            "select current_version from documents where id=%s and owner_id=%s for update",
            (doc, uid),
        )
        recipients = active_recipients(db, doc)
        notify = uuid_set(body.get("notify", []))
        if (
            current["current_version"] != uuid(body["previous"])
            or recipients != uuid_set(body.get("recipients", []))
            or not notify <= recipients
        ):
            raise HTTPException(
                409, "Le document ou ses destinataires ont changé. Actualisez la liste."
            )
    elif (
        db.execute(
            "select count(*) as n from documents where owner_id=%s", (uid,)
        ).fetchone()["n"]
        >= MAX_DOCUMENTS
    ):
        raise HTTPException(409, "Limite de 30 documents atteinte.")
    mime, data = scanned
    used = one(
        db,
        """select coalesce(sum(octet_length(v.bytes)-28),0) as total,
        coalesce(sum(octet_length(v.bytes)-28) filter(where d.owner_id=%s),0) as mine from versions v join documents d on d.id=v.doc_id""",
        (uid,),
    )
    if (
        used["mine"] + len(data) > MAX_OWNER_BYTES
        or used["total"] + len(data) > MAX_TOTAL_BYTES
    ):
        raise HTTPException(409, "Quota de stockage atteint.")
    if not replacing:
        db.execute(
            "insert into documents(id,owner_id,current_version) values(%s,%s,%s)",
            (doc, uid, version),
        )
    kid, envelope = seal(doc, version, mime, data)
    db.execute(
        "insert into versions(id,doc_id,kind,title,issued,expiry,expiry_mode,note,mime,key_id,bytes) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
        (version, doc, *metadata, mime, kid, envelope),
    )
    skipped = 0
    if replacing:
        db.execute(
            "update versions set retired_at=now() where id=%s",
            (current["current_version"],),
        )
        db.execute(
            "update documents set current_version=%s where id=%s", (version, doc)
        )
        for sid in notify:
            try:
                fixed_window(db, "replacement/" + str(sid), 5, 86400)
            except HTTPException as error:
                if error.status_code != 429:
                    raise
                skipped += 1
                continue
            queue(db, "replacement", uid, f"replace/{version}/{sid}", sid, version)
    return {"id": doc, "notifications_limited": skipped}


def share(db, uid, body):
    sid = uuid(body.get("request"))
    lock_owner(db, uid)
    if db.execute(
        "select 1 from shares where owner_id=%s and id=%s", (uid, sid)
    ).fetchone():
        return {"id": sid}
    docs = uuid_set(body.get("docs"), MAX_DOCUMENTS)
    owned = {
        r["id"]
        for r in db.execute("select id from documents where owner_id=%s", (uid,))
    }
    if not docs or not docs <= owned:
        raise HTTPException(422, "Sélectionnez des documents de votre dossier.")
    org = email = org_name = None
    end = date_field(body.get("ends"))
    if body.get("org"):
        org = uuid(body["org"])
        org_name = one(
            db, "select name from partners where user_id=%s and id=%s", (uid, org)
        )["name"]
        one(
            db,
            "select m.user_id from managers m join accounts a on a.id=m.user_id where m.organization_id=%s limit 1",
            (org,),
        )
    else:
        email = guest_email(body.get("email"))
        end = end or today() + timedelta(days=30)
    if end and end < today():
        raise HTTPException(422, "La fin doit être aujourd’hui ou ultérieure.")
    if (
        one(
            db,
            "select count(*) n from today_shares where owner_id=%s and state='active'",
            (uid,),
        )["n"]
        >= 100
    ):
        raise HTTPException(409, "Limite de 100 partages actifs atteinte.")
    fixed_window(db, "invite/global", 200, 86400)
    fixed_window(db, "invite/user/" + str(uid), 20, 86400)
    fixed_window(db, "invite/target/" + digest("target", email or org), 15, 86400)
    db.execute(
        "insert into shares(id,owner_id,org_id,email,ends,org_name) values(%s,%s,%s,%s,%s,%s)",
        (sid, uid, org, email, end, org_name),
    )
    db.execute(
        "insert into items select %s,unnest(%s::uuid[]),%s", (sid, list(docs), uid)
    )
    queue(db, "invite", uid, "invite/" + str(sid), sid)
    event(db, uid, "share", sid, actor=uid)
    return {"id": sid}


def owner_action(db, uid, action, b):
    one(db, "select user_id from trainer_accounts where user_id=%s", (uid,))
    if action == "overview":
        return overview(db, uid)
    if action == "share":
        return share(db, uid, b)
    lock_owner(db, uid)
    if action == "resend":
        sid = uuid(b.get("share"))
        row = one(
            db,
            "select * from today_shares where id=%s and owner_id=%s and state='active'",
            (sid, uid),
        )
        request = uuid(b.get("request"))
        key = f"resend/{sid}/{request}"
        if db.execute("select 1 from mail where unique_key=%s", (key,)).fetchone():
            return {}
        fixed_window(db, "invite/resend/" + str(sid), 1, 3600)
        fixed_window(db, "invite/user/" + str(uid), 20, 86400)
        fixed_window(
            db,
            "invite/target/" + digest("target", row["email"] or row["org_id"]),
            15,
            86400,
        )
        fixed_window(db, "invite/global", 200, 86400)
        queue(db, "invite", uid, key, sid)
        return {}
    if action in ("revoke", "renew"):
        sid = uuid(b.get("share"))
        row = one(
            db,
            "select * from shares where owner_id=%s and id=%s for update",
            (uid, sid),
        )
        if action == "revoke":
            db.execute(
                "update shares set revoked_at=coalesce(revoked_at,now()) where id=%s",
                (sid,),
            )
            if row["revoked_at"] is None:
                event(db, uid, "revoke", sid, actor=uid)
        else:
            end = date_field(b.get("ends"))
            if (
                row["revoked_at"]
                or (not end and row["email"])
                or (end and end < today())
            ):
                raise HTTPException(422, "Durée indisponible.")
            db.execute("update shares set ends=%s where id=%s", (end, sid))
        db.execute("delete from sessions where share_id=%s", (sid,))
        db.execute("delete from challenges where share_id=%s", (sid,))
        return {}
    doc = uuid(b.get("doc"))
    cur = one(
        db,
        "select current_version from documents where owner_id=%s and id=%s",
        (uid, doc),
    )["current_version"]
    if action == "history":
        return db.execute(
            f"select {META},v.note from versions v where doc_id=%s and retired_at is not null order by retired_at desc",
            (doc,),
        ).fetchall()
    if action in ("edit", "delete"):
        if cur != uuid(b.get("previous")):
            raise HTTPException(409, "La version a changé.")
        if action == "delete":
            db.execute("delete from documents where id=%s", (doc,))
            db.execute(
                "update shares s set revoked_at=now() where owner_id=%s and revoked_at is null and not exists(select from items where share_id=s.id)",
                (uid,),
            )
        else:
            values = fields(b)
            db.execute(
                "update versions set expiry_set_on=case when expiry is distinct from %s::date then (now() at time zone 'Europe/Paris')::date else expiry_set_on end,kind=%s,title=%s,issued=%s,expiry=%s,expiry_mode=%s,note=%s where id=%s",
                (values[3], *values, cur),
            )
        return {}
    raise HTTPException(404)
