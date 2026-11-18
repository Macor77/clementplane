import hashlib
import hmac
import secrets
from uuid import uuid4
from fastapi import HTTPException
from core import META, code,digest,event,fixed_window,invitation,one,queue,uuid

def guest_share(db, link):
    if not isinstance(link,str) or len(link)!=101:
        raise HTTPException(403,'Invitation indisponible.')
    sid=uuid(link.split('.')[0])
    if not hmac.compare_digest(invitation(sid),link):
        raise HTTPException(403,'Invitation indisponible.')
    return one(db,"select * from today_shares where id=%s and email is not null and state='active'",(sid,))

def challenge(db,b):
    share=guest_share(db,b.get('link'))
    sid=share['id']
    fixed_window(db,'otp/cooldown/'+str(sid),1,60)
    fixed_window(db,'otp/hour/'+str(sid),3,3600)
    fixed_window(db,'otp/box/'+digest('box',share['email']),8,86400)
    nonce=uuid4()
    db.execute("""insert into challenges(share_id,nonce,expires) values(%s,%s,now()+interval '10 minutes')
        on conflict(share_id) do update set nonce=excluded.nonce,expires=excluded.expires,attempts=0""",(sid,nonce))
    queue(db,'code',share['owner_id'],f'code/{nonce}',sid,challenge=nonce)
    return {'status':'queued'}

def verify(db,b):
    share=guest_share(db,b.get('link'))
    sid=share['id']
    fixed_window(db,'otp/verify/'+str(sid),15,3600)
    row=db.execute("""update challenges set attempts=attempts+1 where share_id=%s and expires>now()
        and attempts<5 returning nonce""",(sid,)).fetchone()
    supplied=str(b.get('code',''))
    if not row or not supplied.isascii() or not hmac.compare_digest(code(row['nonce']),supplied):
        # Caller returns a refusal after commit, so failed guesses remain counted.
        return None
    db.execute('delete from challenges where share_id=%s',(sid,))
    token=secrets.token_urlsafe(32)
    db.execute("insert into sessions values (%s,%s,now()+interval '20 minutes')",(digest('session',token),sid))
    return {'session':token}

def permitted(db,identity,b,guest):
    if guest:
        token=b.get('session')
        if not isinstance(token,str) or len(token)!=43:
            raise HTTPException(403)
        return one(db,"""select s.id,s.owner_id from today_shares s join sessions t on t.share_id=s.id
            where t.digest=%s and t.expires>now() and s.state='active' and s.email is not null""",(digest('session',token),))
    sid=uuid(b.get('share'))
    return one(db,"""select s.id,s.owner_id from today_shares s join managers m on m.organization_id=s.org_id
        where s.id=%s and s.org_id=%s and m.user_id=%s and s.state='active'""",(sid,uuid(b.get('org')),identity))

def inbox(db,uid,b):
    org=uuid(b.get('org'))
    one(db,'select 1 from managers where user_id=%s and organization_id=%s',(uid,org))
    return db.execute("""select s.id,s.ends, count(i.doc_id) as count,
        coalesce(nullif(trim(concat_ws(' ',t.first_name,t.last_name)),''),'Formateur') as trainer
        from today_shares s join items i on i.share_id=s.id left join dossier.trainer_labels t on t.user_id=s.owner_id
        where s.org_id=%s and s.state='active' group by s.id,s.ends,t.first_name,t.last_name order by trainer""",(org,)).fetchall()

def contents(db,uid,b,guest):
    s=permitted(db,uid,b,guest)
    return db.execute(f"""select d.id,{META} from items i join documents d on i.doc_id=d.id
        join versions v on d.current_version=v.id where i.share_id=%s order by v.title""",(s['id'],)).fetchall()

def file_content(db,uid,b,guest):
    doc=uuid(b.get('doc'))
    if guest or b.get('share'):
        s=permitted(db,uid,b,guest)
        row=one(db,"""select v.bytes,v.mime from items i join documents d on i.doc_id=d.id
            join versions v on d.current_version=v.id where i.share_id=%s and d.id=%s and v.id=%s""",(s['id'],doc,uuid(b.get('version'))))
        owner=s['owner_id']
        sid=s['id']
    else:
        row=one(db,"""select v.bytes,v.mime from documents d join versions v on d.id=v.doc_id
            where d.owner_id=%s and d.id=%s and v.id=%s""",(uid,doc,uuid(b.get('version'))))
        owner=uid
        sid=None
    event(db,owner,'download' if b.get('download') else 'consult',sid,doc)
    return row
