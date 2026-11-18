"""Shared server primitives. Inputs never become log messages or SQL identifiers."""
import base64
import hashlib
import hmac
import os
import re
from contextlib import contextmanager
from datetime import date, datetime
from uuid import UUID
from zoneinfo import ZoneInfo

import httpx
import psycopg
from fastapi import HTTPException
from psycopg.rows import dict_row

PARIS = ZoneInfo('Europe/Paris')
MAX = 5 << 20
KINDS = {'cv','nda','sirene','rc','urssaf','habilitation','diplome','qualiopi','autre'}
META = 'v.id as version_id, v.kind,v.title,v.issued,v.expiry,v.expiry_mode,v.mime,v.created_at'
ACTIVE = "s.state='active'"

def today():
    return datetime.now(PARIS).date()

@contextmanager
def database():
    with psycopg.connect(os.environ['DOSSIER_DSN'],row_factory=dict_row,connect_timeout=5) as db:
        db.execute("set local search_path = pg_catalog,dossier")
        db.execute("set local statement_timeout = '8s'")
        yield db

def one(db, sql, args=()):
    row=db.execute(sql,args).fetchone()
    if not row:
        raise HTTPException(404,'Accès indisponible.')
    return row

def uuid(value):
    try:
        return UUID(str(value))
    except ValueError:
        raise HTTPException(422,'Référence incorrecte.') from None

def text_field(value, maximum, required=True):
    if not isinstance(value,str) or len(value)>maximum or (required and not value.strip()) or '\x00' in value:
        raise HTTPException(422,'Vérifiez les champs du formulaire.')
    return value.strip()

def date_field(value):
    if value in (None,''):
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        raise HTTPException(422,'Date incorrecte.') from None

def fields(body):
    kind=body.get('kind')
    mode=body.get('expiry_mode')
    expiry=date_field(body.get('expiry'))
    if kind not in KINDS or mode not in ('none','dated','unknown') or (mode=='dated') != bool(expiry):
        raise HTTPException(422,'Vérifiez le type et l’échéance.')
    return (kind,text_field(body.get('title'),140),date_field(body.get('issued')),expiry,mode,text_field(body.get('note',''),2000,False))

def digest(purpose, value):
    secret=os.environ['DOSSIER_HMAC_KEY'].encode()
    if len(secret)<32:
        raise HTTPException(503,'Service indisponible.')
    return hmac.new(secret,(purpose+':'+str(value)).encode(),hashlib.sha256).hexdigest()

def invitation(share):
    return str(share)+'.'+digest('invitation',share)

def code(nonce):
    return str(int(digest('code',nonce),16)%100000000).zfill(8)

def fixed_window(db, key, limit, seconds):
    result=db.execute("""insert into limits as l values (%s,now(),1) on conflict(key) do update set
        n=case when l.started<=now()-make_interval(secs=>%s) then 1 else l.n+1 end,
        started=case when l.started<=now()-make_interval(secs=>%s) then now() else l.started end
        where l.n<%s or l.started<=now()-make_interval(secs=>%s) returning n""",
        (key,seconds,seconds,limit,seconds)).fetchone()
    if not result:
        raise HTTPException(429,'Limite atteinte. Réessayez ultérieurement.')

def event(db, owner, action, share=None, doc=None):
    db.execute('insert into events(owner_id,action,share_id,doc_id) values(%s,%s,%s,%s)',(owner,action,share,doc))

def identity(bearer):
    if not bearer.startswith('Bearer ') or len(bearer)>16384:
        raise HTTPException(401)
    try:
        res=httpx.get(os.environ['SUPABASE_URL']+'/auth/v1/user',headers={'Authorization':bearer,'apikey':os.environ['SUPABASE_PUBLISHABLE_KEY']},timeout=6)
        if res.status_code!=200:
            raise HTTPException(401 if res.status_code in (401,403) else 503)
        token=bearer[7:].split('.')[1]
        import json
        claims=json.loads(base64.urlsafe_b64decode(token+'='*(-len(token)%4)))
        uid=uuid(res.json()['id'])
        if str(uid)!=claims['sub']:
            raise ValueError()
        return uid,uuid(claims['session_id']),claims.get('aal')
    except (httpx.HTTPError,KeyError,IndexError,ValueError):
        raise HTTPException(503,'Vérification indisponible.') from None

def check_login(db, identity_info):
    uid,sid,aal=identity_info
    account=one(db,'select platform_admin from logins where user_id=%s and id=%s',(uid,sid))
    if account['platform_admin'] and aal!='aal2':
        raise HTTPException(403,'Second facteur requis pour ce compte administrateur.')
    return uid

def guest_email(value):
    email=text_field(value,254).lower()
    if not re.fullmatch(r'[A-Za-z0-9.!#$%&\'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+',email):
        raise HTTPException(422,'Adresse e-mail incorrecte.')
    return email

def lock_owner(db, uid):
    db.execute('select pg_advisory_xact_lock(hashtextextended(%s,0))',(str(uid),))

def share_docs(db, sid):
    return [r['doc_id'] for r in db.execute('select doc_id from items where share_id=%s order by doc_id',(sid,))]

def active_recipients(db, doc):
    return {r['id'] for r in db.execute("""select s.id from today_shares s join items i on i.share_id=s.id
        where i.doc_id=%s and s.state='active'""",(doc,))}

def uuid_set(values, max_n=100):
    if not isinstance(values,list) or len(values)>max_n:
        raise HTTPException(422)
    return {uuid(v) for v in values}

def queue(db, kind, owner, key, share=None, version=None, challenge=None):
    db.execute("""insert into mail(kind,owner_id,unique_key,share_id,version_id,challenge)
        values(%s,%s,%s,%s,%s,%s) on conflict(unique_key) do nothing""",(kind,owner,key,share,version,challenge))


def scanner_client():
    socket = os.getenv('DOSSIER_SCANNER_SOCKET')
    if socket:
        return httpx.Client(transport=httpx.HTTPTransport(uds=socket), base_url='http://scanner', timeout=40)
    return httpx.Client(base_url='http://127.0.0.1:8261', trust_env=False, timeout=40)
