import base64
from datetime import timedelta
from uuid import uuid4
import httpx
from fastapi import HTTPException
from core import scanner_client
from core import (MAX,META,active_recipients,date_field,event,fields,fixed_window,guest_email,
    lock_owner,one,queue,share_docs,today,uuid,uuid_set,digest)

def overview(db, uid):
    docs=db.execute(f"""select d.id,{META},v.note from documents d join versions v
        on d.current_version=v.id where d.owner_id=%s order by d.created_at desc""",(uid,)).fetchall()
    shares=db.execute("""select s.id,s.email,s.org_id,coalesce(p.name,s.email,'Organisme') as label,s.ends,s.state,
        array(select doc_id from items where share_id=s.id) as docs from today_shares s
        left join partners p on p.id=s.org_id and p.user_id=s.owner_id where s.owner_id=%s order by s.created_at desc""",(uid,)).fetchall()
    partners=db.execute('select id,name from partners where user_id=%s order by name',(uid,)).fetchall()
    reminders=db.execute("""select distinct m.days_before,v.title,m.expiry from mail m join versions v on v.id=m.version_id
        join documents d on d.current_version=v.id where m.owner_id=%s and m.kind='reminder' and m.expiry=v.expiry
        and m.expiry >= (now() at time zone 'Europe/Paris')::date order by m.expiry,m.days_before""",(uid,)).fetchall()
    return dict(documents=docs,shares=shares,partners=partners,reminders=reminders)

def scan_file(body):
    try:
        raw=base64.b64decode(body['file'],validate=True)
    except (ValueError,TypeError,KeyError):
        raise HTTPException(422,'Fichier illisible.') from None
    if not 0<len(raw)<=MAX:
        raise HTTPException(413,'Maximum 5 Mio par document.')
    import os
    try:
        with scanner_client() as scanner:
            res=scanner.post('/validate',content=raw)
    except httpx.HTTPError:
        raise HTTPException(503,'Contrôle du fichier indisponible. Réessayez.') from None
    if res.status_code!=200:
        raise HTTPException(422 if res.status_code in (413,422) else 503,'Fichier refusé ou contrôle indisponible.')
    mime=res.headers.get('content-type')
    if mime not in ('application/pdf','image/png','image/jpeg') or not 0<len(res.content)<=MAX:
        raise HTTPException(503)
    return mime,res.content

def save_version(db, uid, body, scanned):
    doc,version=uuid(body.get('doc')),uuid(body.get('request'))
    metadata=fields(body)
    replacing=body.get('previous') is not None
    # Global capacity check and insert share a transaction; all uploads use this lock order.
    db.execute('select pg_advisory_xact_lock(18112026)')
    lock_owner(db,uid)
    if db.execute('select 1 from versions v join documents d on d.id=v.doc_id where v.id=%s and d.id=%s and d.owner_id=%s',(version,doc,uid)).fetchone():
        return {'id':doc}
    if replacing:
        current=one(db,'select current_version from documents where id=%s and owner_id=%s for update',(doc,uid))
        recipients=active_recipients(db,doc)
        notify=uuid_set(body.get('notify',[]))
        if current['current_version']!=uuid(body['previous']) or recipients!=uuid_set(body.get('recipients',[])) or not notify<=recipients:
            raise HTTPException(409,'Le document ou ses destinataires ont changé. Actualisez la liste.')
    elif db.execute('select count(*) as n from documents where owner_id=%s',(uid,)).fetchone()['n']>=30:
        raise HTTPException(409,'Limite de 30 documents atteinte.')
    mime,data=scanned
    used=one(db,"""select coalesce(sum(octet_length(v.bytes)),0) as total,
        coalesce(sum(octet_length(v.bytes)) filter(where d.owner_id=%s),0) as mine from versions v join documents d on d.id=v.doc_id""",(uid,))
    if used['mine']+len(data)>64<<20 or used['total']+len(data)>512<<20:
        raise HTTPException(409,'Quota de stockage atteint.')
    if not replacing:
        db.execute('insert into documents(id,owner_id,current_version) values(%s,%s,%s)',(doc,uid,version))
    db.execute('insert into versions(id,doc_id,kind,title,issued,expiry,expiry_mode,note,mime,bytes) values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',(version,doc,*metadata,mime,data))
    if replacing:
        db.execute('update versions set retired_at=now() where id=%s',(current['current_version'],))
        db.execute('update documents set current_version=%s where id=%s',(version,doc))
        for sid in notify:
            queue(db,'replacement',uid,f'replace/{version}/{sid}',sid,version)
    return {'id':doc}

def share(db,uid,body):
    sid=uuid(body.get('request'))
    lock_owner(db,uid)
    if db.execute('select 1 from shares where owner_id=%s and id=%s',(uid,sid)).fetchone():
        return {'id':sid}
    docs=uuid_set(body.get('docs'),30)
    owned={r['id'] for r in db.execute('select id from documents where owner_id=%s',(uid,))}
    if not docs or not docs<=owned:
        raise HTTPException(422,'Sélectionnez des documents de votre dossier.')
    org=email=None
    end=date_field(body.get('ends'))
    if body.get('org'):
        org=uuid(body['org'])
        one(db,'select id from partners where user_id=%s and id=%s',(uid,org))
        one(db,'select m.user_id from managers m join accounts a on a.id=m.user_id where m.organization_id=%s limit 1',(org,))
    else:
        email=guest_email(body.get('email'))
        end=end or today()+timedelta(days=30)
    if end and end<today():
        raise HTTPException(422,'La fin doit être aujourd’hui ou ultérieure.')
    fixed_window(db,'invite/user/'+str(uid),20,86400)
    fixed_window(db,'invite/target/'+digest('target',email or org),15,86400)
    db.execute('insert into shares(id,owner_id,org_id,email,ends) values(%s,%s,%s,%s,%s)',(sid,uid,org,email,end))
    db.execute('insert into items select %s,unnest(%s::uuid[]),%s',(sid,list(docs),uid))
    queue(db,'invite',uid,'invite/'+str(sid),sid)
    event(db,uid,'share',sid)
    return {'id':sid}

def owner_action(db,uid,action,b):
    one(db,'select user_id from trainer_accounts where user_id=%s',(uid,))
    if action=='overview':
        return overview(db,uid)
    if action=='share':
        return share(db,uid,b)
    lock_owner(db,uid)
    if action in ('revoke','renew'):
        sid=uuid(b.get('share'))
        row=one(db,'select * from shares where owner_id=%s and id=%s for update',(uid,sid))
        if action=='revoke':
            db.execute('update shares set revoked_at=coalesce(revoked_at,now()) where id=%s',(sid,))
            if row['revoked_at'] is None:
                event(db,uid,'revoke',sid)
        else:
            end=date_field(b.get('ends'))
            if row['revoked_at'] or (not end and row['email']) or (end and end<today()):
                raise HTTPException(422,'Durée indisponible.')
            db.execute('update shares set ends=%s where id=%s',(end,sid))
        db.execute('delete from sessions where share_id=%s',(sid,))
        db.execute('delete from challenges where share_id=%s',(sid,))
        return {}
    doc=uuid(b.get('doc'))
    cur=one(db,'select current_version from documents where owner_id=%s and id=%s',(uid,doc))['current_version']
    if action=='history':
        return db.execute(f'select {META},v.note from versions v where doc_id=%s and retired_at is not null order by retired_at desc',(doc,)).fetchall()
    if action in ('edit','delete'):
        if cur!=uuid(b.get('previous')):
            raise HTTPException(409,'La version a changé.')
        if action=='delete':
            db.execute('delete from documents where id=%s',(doc,))
            db.execute("update shares s set revoked_at=now() where owner_id=%s and revoked_at is null and not exists(select from items where share_id=s.id)",(uid,))
        else:
            db.execute('update versions set kind=%s,title=%s,issued=%s,expiry=%s,expiry_mode=%s,note=%s where id=%s',(*fields(b),cur))
        return {}
    raise HTTPException(404)
