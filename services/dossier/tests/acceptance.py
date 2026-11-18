"""Integration fixture. Creates a fresh database on loopback, never uses a configured production DSN."""
import base64
import io
import os
import socket
import subprocess
import sys
import tempfile
import unittest
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import httpx
import pikepdf
import psycopg
from fastapi import HTTPException
from fastapi.testclient import TestClient
from PIL import Image
from psycopg.conninfo import make_conninfo

ROOT = Path(__file__).resolve().parents[3]
SERVICE = ROOT/'services/dossier'
sys.path.insert(0,str(SERVICE))
os.environ.update(DOSSIER_WEB_ORIGIN='https://client.example.invalid',DOSSIER_ENABLED='1',
                  DOSSIER_HMAC_KEY='fictitious-test-only-'+str(uuid4()),DOSSIER_MAIL_MODE='off')
import api
import core
import worker

def postgres_binaries():
    import shutil
    if shutil.which('pg_config'):
        path=Path(subprocess.check_output(['pg_config','--bindir'],text=True).strip())
        if (path/'initdb').is_file():
            return path
    import pgserver
    return Path(pgserver.__file__).parent/'pginstall/bin'

def pdf_sample():
    with pikepdf.Pdf.new() as pdf:
        pdf.add_blank_page()
        pdf.add_blank_page()
        out=io.BytesIO()
        pdf.save(out)
        return out.getvalue()

def image_sample(fmt):
    out=io.BytesIO()
    Image.new('RGB',(40,22),'white').save(out,fmt)
    return out.getvalue()

class DossierTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.tmp.cleanup)
        root=Path(cls.tmp.name)
        pg=postgres_binaries()
        with socket.socket() as s:
            s.bind(('127.0.0.1',0))
            port=s.getsockname()[1]
        subprocess.run([pg/'initdb','-A','trust','-U','fixture','-D',root/'db'],stdout=subprocess.DEVNULL,check=True)
        subprocess.run([pg/'pg_ctl','-D',root/'db','-l',root/'postgres.log','-o',f"-h 127.0.0.1 -p {port} -c unix_socket_directories='' -c log_min_error_statement=panic",'start'],stdout=subprocess.DEVNULL,check=True)
        cls.addClassCleanup(subprocess.run,[pg/'pg_ctl','-D',root/'db','-m','immediate','stop'],stdout=subprocess.DEVNULL)
        cls.admin=psycopg.connect(host='127.0.0.1',port=port,user='fixture',dbname='postgres',autocommit=True)
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
        cls.admin.execute(next((ROOT/'supabase/migrations').glob('*professional_dossier.sql')).read_text())
        cls.admin.execute('create role dossier_test_login login; grant dossier_runtime to dossier_test_login')
        os.environ['DOSSIER_DSN']=make_conninfo(host='127.0.0.1',port=port,user='dossier_test_login',dbname='postgres')
        cls.client=TestClient(api.app)
        if os.getenv('DOSSIER_REAL_SCANNER')!='1':
            # Real parser subprocess; antivirus and scanner transport are simulated in this mode.
            def scan(body):
                raw=base64.b64decode(body['file'])
                if len(raw)>core.MAX:raise HTTPException(413)
                result=subprocess.run([sys.executable,'-I',SERVICE/'validator.py'],input=raw,capture_output=True)
                if result.returncode:raise HTTPException(422)
                mime,data=result.stdout.split(b'\n',1)
                return mime.decode(),data
            mock=patch('api.scan_file',side_effect=scan)
            mock.start();cls.addClassCleanup(mock.stop)

    def setUp(self):
        self.owner,self.other,self.of,self.viewer=users=[uuid4() for _ in range(4)]
        self.org,self.org2=uuid4(),uuid4()
        self.logins={}
        for i,u in enumerate(users):
            sid=uuid4()
            self.admin.execute("insert into auth.users values(%s,%s,now())",(u,f'{u}@example.invalid'))
            self.admin.execute('insert into auth.sessions values(%s,%s,null)',(sid,u))
            self.logins[str(u)]=(u,sid,'aal1')
            if i<2:self.admin.execute("insert into trainers values(%s,%s,'Camille','Démo')",(u,u))
        for org in (self.org,self.org2):self.admin.execute("insert into organizations values(%s,'OF fictif','active')",(org,))
        for uid,org,role in [(self.of,self.org,'manager'),(self.viewer,self.org,'viewer'),(self.other,self.org2,'owner')]:
            self.admin.execute("insert into organization_members values(%s,%s,'active',%s)",(uid,org,role))
        self.admin.execute('insert into organization_trainers values(%s,%s)',(self.owner,self.org))
        mock=patch('api.identity',side_effect=lambda token:self.logins[token[7:]] if token[7:] in self.logins else self.deny())
        mock.start();self.addCleanup(mock.stop)
        self.doc=str(uuid4())
        self.version=str(uuid4())
        self.b=dict(doc=self.doc,request=self.version,kind='cv',title='Pièce fictive',note='Note personnelle fictive',
                    expiry_mode='unknown',file=base64.b64encode(pdf_sample()).decode())

    @staticmethod
    def deny():
        raise HTTPException(401)

    def req(self,action,b=None,user=None,status=200):
        res=self.client.post('/v1/'+action,json=b or {},headers={'Authorization':'Bearer '+str(user or self.owner)})
        self.assertEqual(res.status_code,status,(action,res.text[:140] if res.status_code!=200 else 'ok'))
        self.assertIn('no-store',res.headers['cache-control'])
        return res

    def share(self,guest=False):
        sid=str(uuid4())
        b={'request':sid,'docs':[self.doc]}
        b.update({'email':sid+'@example.invalid'} if guest else {'org':str(self.org)})
        self.req('share',b);self.req('share',b)
        return sid

    def test_upload_and_owner_controls(self):
        self.req('upload',self.b,self.of,404)
        self.req('upload',self.b,status=200);self.req('upload',self.b)
        self.req('upload',{**self.b,'doc':str(uuid4()),'request':str(uuid4()),'file':base64.b64encode(b'ordinary text').decode()},status=422)
        self.req('upload',{**self.b,'request':str(uuid4()),'file':base64.b64encode(bytes(core.MAX+100)).decode()},status=413)
        for fmt in ('JPEG','PNG'):
            self.req('upload',{**self.b,'doc':str(uuid4()),'request':str(uuid4()),'expiry_mode':'none','file':base64.b64encode(image_sample(fmt)).decode()})
        data=self.req('overview').json()
        self.assertEqual(len(data['documents']),3)
        self.assertEqual(data['shares'],[])
        for actor in (self.of,self.other):
            for action in ('file','edit','delete','history'):
                self.req(action,{'doc':self.doc,'previous':self.version,'version':self.version},actor,404)
        self.req('upload',{**self.b,'previous':self.version,'recipients':[],'request':str(uuid4())},self.other,404)
        self.assertFalse(self.req('overview',user=self.other).json()['documents'])
        self.admin.execute('insert into platform_admins values(%s)',(self.owner,))
        self.req('overview',status=403)
        u,s,_=self.logins[str(self.owner)];self.logins[str(u)]=(u,s,'aal2')
        self.req('overview')
        self.admin.execute('delete from auth.sessions where id=%s',(s,))
        self.req('overview',status=404)

    def test_org_access_and_versions(self):
        self.req('upload',self.b);sid=self.share();sid_guest=self.share(True)
        target={'org':str(self.org),'share':sid,'doc':self.doc,'version':self.version,'download':True}
        self.assertEqual(self.req('contents',target,self.of).json()[0].get('note'),None)
        self.assertEqual(self.req('file',target,self.of).content,pdf_sample_bytes:=base64.b64decode(self.b['file']))
        self.assertTrue(pdf_sample_bytes.startswith(b'%PDF'))
        self.req('file',target,self.viewer,404)
        self.req('file',{**target,'org':str(self.org2)},self.other,404)
        self.req('history',{'doc':self.doc},self.of,404)
        self.req('upload',{**self.b,'doc':str(uuid4()),'request':str(uuid4())})
        self.assertEqual(len(self.req('contents',target,self.of).json()),1)
        ver2=str(uuid4())
        replacement={**self.b,'previous':self.version,'request':ver2,'recipients':[sid,sid_guest],'notify':[sid]}
        self.req('upload',{**replacement,'recipients':[]},status=409)
        self.req('upload',replacement);self.req('upload',replacement)
        self.req('file',target,self.of,404)
        history=self.req('history',{'doc':self.doc}).json()
        self.assertEqual([v['version_id'] for v in history],[self.version])
        self.req('file',{'doc':self.doc,'version':self.version,'download':True})
        rows=self.admin.execute("select share_id from dossier.mail where owner_id=%s and kind='replacement'",(self.owner,)).fetchall()
        self.assertEqual(rows,[(core.uuid(sid),)])
        ver3=str(uuid4())
        self.req('upload',{**replacement,'previous':ver2,'request':ver3,'notify':[]})
        self.admin.execute("update organization_members set status='inactive' where user_id=%s",(self.of,))
        self.req('file',{**target,'version':ver3},self.of,404)

    def test_guest_expiration_and_revocation(self):
        self.req('upload',self.b)
        sid=self.share(True);link=core.invitation(sid); request={'link':link}
        self.req('guest-list',request,status=403)
        self.req('request-code',request);self.req('request-code',request,status=429)
        nonce=self.admin.execute('select nonce from dossier.challenges where share_id=%s',(sid,)).fetchone()[0]
        for _ in range(5):self.req('verify-code',{**request,'code':'invalid'},status=403)
        self.req('verify-code',{**request,'code':core.code(nonce)},status=403)
        self.admin.execute("update dossier.limits set started=now()-interval '2 minutes' where key=%s",('otp/cooldown/'+sid,))
        self.req('request-code',request)
        nonce=self.admin.execute('select nonce from dossier.challenges where share_id=%s',(sid,)).fetchone()[0]
        self.admin.execute("update dossier.challenges set expires=now()-interval '1 second' where share_id=%s",(sid,))
        self.req('verify-code',{**request,'code':core.code(nonce)},status=403)
        self.admin.execute("update dossier.challenges set expires=now()+interval '1 minute' where share_id=%s",(sid,))
        ticket=self.req('verify-code',{**request,'code':core.code(nonce)}).json()
        self.assertEqual(self.req('guest-list',ticket).json()[0]['id'],self.doc)
        self.req('guest-file',{**ticket,'doc':self.doc,'version':self.version,'download':True})
        self.admin.execute("update dossier.shares set ends=%s where id=%s",(core.today()-timedelta(days=1),sid))
        self.req('guest-list',ticket,status=404)
        self.req('renew',{'share':sid,'ends':str(core.today()+timedelta(days=3))})
        self.req('guest-list',ticket,status=404)
        self.admin.execute("update dossier.limits set started=now()-interval '2 minutes' where key=%s",('otp/cooldown/'+sid,))
        self.req('request-code',request)
        nonce=self.admin.execute('select nonce from dossier.challenges where share_id=%s',(sid,)).fetchone()[0]
        ticket=self.req('verify-code',{**request,'code':core.code(nonce)}).json()
        self.req('revoke',{'share':sid})
        self.req('guest-file',{**ticket,'doc':self.doc,'version':self.version,'download':True},status=404)

    def test_reminders_purge_and_snapshot(self):
        self.req('upload',self.b)
        docs=[self.doc,str(uuid4())];self.req('upload',{**self.b,'doc':docs[1],'request':str(uuid4())})
        self.req('share',{'request':str(uuid4()),'docs':docs,'org':str(self.org)})
        def sweep():
            with core.database() as db:worker.maintain(db)
        for offset in (30,7,3,-1):
            expiry=core.today()+timedelta(days=offset)
            self.req('edit',{**self.b,'previous':self.version,'expiry_mode':'dated','expiry':str(expiry)})
            sweep();sweep()
            with core.database() as db:
                jobs=db.execute("select * from mail where owner_id=%s and kind='reminder'",(self.owner,)).fetchall()
                self.assertEqual(sum(worker.message(db,j) is not None for j in jobs),int(offset in (30,7)))
        shares=self.req('overview').json()['shares']
        self.req('file',{'org':str(self.org),'share':shares[0]['id'],'doc':self.doc,'version':self.version,'download':True},self.of)
        self.req('delete',{'doc':self.doc,'previous':self.version})
        self.assertEqual(self.admin.execute('select count(*) from dossier.versions where doc_id=%s',(self.doc,)).fetchone()[0],0)
        self.admin.execute('delete from auth.users where id=%s',(self.owner,))
        self.assertEqual(self.admin.execute('select count(*) from dossier.documents where owner_id=%s',(self.owner,)).fetchone()[0],0)

    def test_permissions_and_fail_closed(self):
        for role in ('anon','authenticated','service_role'):
            self.assertFalse(self.admin.execute("select has_schema_privilege(%s,'dossier','usage')",(role,)).fetchone()[0])
        with patch.dict(os.environ,DOSSIER_ENABLED='0'):
            self.req('overview',status=404)
        self.req('overview',user='absent',status=401)
        with patch('api.scan_file',side_effect=HTTPException(503)):
            self.req('upload',self.b,status=503)
        self.assertEqual(self.req('overview').json()['documents'],[])
        with core.database() as db:
            db.execute("select count(*) from documents")
            with self.assertRaises(psycopg.errors.InsufficientPrivilege):db.execute('select * from auth.users')
            db.rollback()

if __name__=='__main__':
    unittest.main(verbosity=2)
