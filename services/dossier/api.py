from core import digest
import json
import os
import psycopg
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware
from core import scanner_client
from core import MAX, check_login, database, fields, fixed_window, identity, one, uuid
from owner import agreement_status, owner_action, save_version, scan_file
from access import challenge, contents, file_content, inbox, verify

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
ORIGIN = os.environ["DOSSIER_WEB_ORIGIN"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ORIGIN],
    allow_methods=["POST"],
    allow_headers=["authorization", "content-type"],
    allow_credentials=False,
    expose_headers=["X-Document-Pages"],
)
HEADERS = {
    "Cache-Control": "private, no-store, max-age=0",
    "CDN-Cache-Control": "no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; sandbox",
}
GUEST = {"request-code", "verify-code", "guest-list", "guest-file", "guest-close"}
ACTIONS = GUEST | {
    "overview",
    "accept-agreement",
    "inbox",
    "contents",
    "file",
    "share",
    "revoke",
    "resend",
    "renew",
    "edit",
    "delete",
    "history",
    "upload",
}


@app.middleware("http")
async def protections(request, call_next):
    try:
        result = await call_next(request)
    except Exception:
        # Deliberately omit request data, SQL parameters, body and tokens from all diagnostics.
        result = JSONResponse(
            {"detail": "Service temporairement indisponible."}, status_code=503
        )
    result.headers.update(HEADERS)
    return result


def dispatch(action, b, bearer):
    guest = action in GUEST
    user = None if guest else identity(bearer)
    if action == "upload":
        fields(b)
        uid = user[0]
        with database() as db:
            check_login(db, user)
            one(db, "select 1 from trainer_accounts where user_id=%s", (uid,))
            previous = db.execute(
                "select 1 from versions v join documents d on d.id=v.doc_id where d.owner_id=%s and d.id=%s and v.id=%s",
                (uid, uuid(b.get("doc")), uuid(b.get("request"))),
            ).fetchone()
            if previous:
                return {"id": b["doc"]}
            if not agreement_status(db, uid)["accepted_at"]:
                raise HTTPException(428, "Actualisez le dossier et acceptez l’annexe avant de déposer une pièce.")
            fixed_window(db, "uploads/" + str(uid), 24, 3600)
        scanned = scan_file(b)
        with database() as db:
            check_login(db, user)
            one(db, "select 1 from trainer_accounts where user_id=%s", (uid,))
            return save_version(db, uid, b, scanned)
    with database() as db:
        uid = None if guest else check_login(db, user)
        if action == "request-code":
            return challenge(db, b)
        if action == "verify-code":
            result = verify(db, b)
            return result or JSONResponse(
                {"detail": "Code incorrect ou expiré."}, status_code=403
            )
        if action == "guest-close":
            token = b.get("session")
            if isinstance(token, str) and len(token) == 43:
                db.execute(
                    "delete from sessions where digest=%s", (digest("session", token),)
                )
            return {}
        if action == "inbox":
            return inbox(db, uid, b)
        if action in ("contents", "guest-list"):
            return contents(db, uid, b, guest)
        if action in ("file", "guest-file"):
            row = file_content(db, uid, b, guest)
            if not b.get("download") and row["mime"] == "application/pdf":
                page = b.get("page", 1)
                if not isinstance(page, int) or not 1 <= page <= 100:
                    raise HTTPException(422)
                with scanner_client() as renderer:
                    rendered = renderer.post(
                        "/validate", params={"page": page}, content=bytes(row["bytes"])
                    )
                if rendered.status_code != 200:
                    raise HTTPException(503, "Aperçu indisponible.")
                content_type = rendered.headers["content-type"].split(";pages=")
                if (
                    len(content_type) != 2
                    or content_type[0] != "image/jpeg"
                    or not content_type[1].isdigit()
                ):
                    raise HTTPException(503)
                return Response(
                    rendered.content,
                    media_type="image/jpeg",
                    headers={"X-Document-Pages": content_type[1]},
                )
            ext = {"application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png"}[
                row["mime"]
            ]
            return Response(
                bytes(row["bytes"]),
                media_type=row["mime"],
                headers={
                    "Content-Disposition": f'attachment; filename="document.{ext}"'
                },
            )
        return owner_action(db, uid, action, b)


@app.post("/v1/{action}")
async def endpoint(action: str, req: Request):
    if os.getenv("DOSSIER_ENABLED") != "1" or action not in ACTIONS:
        raise HTTPException(404)
    if (
        req.headers.get("origin", ORIGIN) != ORIGIN
        or req.headers.get("content-type", "").split(";")[0] != "application/json"
    ):
        raise HTTPException(403)
    limit = 4 * ((MAX + 2) // 3) + 16384 if action == "upload" else 16384
    data = bytearray()
    async for chunk in req.stream():
        if len(data) + len(chunk) > limit:
            raise HTTPException(413, "Fichier trop volumineux.")
        data.extend(chunk)
    try:
        body = json.loads(data)
        if not isinstance(body, dict):
            raise ValueError()
    except (ValueError, RecursionError):
        raise HTTPException(422, "Requête incorrecte.") from None
    try:
        result = await run_in_threadpool(
            dispatch, action, body, req.headers.get("authorization", "")
        )
    except psycopg.IntegrityError:
        raise HTTPException(409, "Conflit. Actualisez puis réessayez.") from None
    except psycopg.Error:
        raise HTTPException(503, "Service temporairement indisponible.") from None
    return (
        result
        if isinstance(result, Response)
        else JSONResponse(jsonable_encoder(result))
    )
