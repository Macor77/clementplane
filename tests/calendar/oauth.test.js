import {it,expect,vi} from 'vitest';
import {buildAuthorization,validateGrant,validateReturn,publicStatus} from '../../supabase/functions/_shared/calendar/oauth.js';
import {createCalendarHandler} from '../../supabase/functions/_shared/calendar/handler.js';
it('requests only calendar.app.created and account identity with PKCE offline',async()=>{
 const url=new URL(await buildAuthorization({clientId:'test',redirectUri:'https://example.test/google-calendar-callback.html',state:'state',verifier:'verifier'}));
 expect(url.searchParams.get('scope').split(' ')).toEqual(['openid','email','https://www.googleapis.com/auth/calendar.app.created']);expect(url.searchParams.get('access_type')).toBe('offline');expect(url.searchParams.get('code_challenge_method')).toBe('S256');expect(url.searchParams.get('prompt')).toBe('consent select_account');
});
it('rejects partial consent and absence of durable grant',()=>{
 expect(()=>validateGrant({access_token:'x',refresh_token:'r',scope:'openid email'})).toThrow('MISSING_CALENDAR_SCOPE');
 expect(()=>validateGrant({access_token:'x',scope:'https://www.googleapis.com/auth/calendar.app.created'})).toThrow('MISSING_REFRESH_TOKEN');
});
it('requires callback bound to live state and same authenticated user',()=>{
 const state={user_id:'a',expires_at:'2026-10-08T10:00:00Z'};
 expect(()=>validateReturn(state,'b',new Date('2026-10-08T09:00:00Z'))).toThrow();expect(()=>validateReturn(state,'a',new Date('2026-10-08T11:00:00Z'))).toThrow();expect(()=>validateReturn(null,'a')).toThrow();
});
it('public status cannot leak tokens, subject, locks or IDs',()=>{
 const result=publicStatus({status:'active',account_email:'trainer@example.test',token_ciphertext:'SECRET',google_sub:'SUB',lock_id:'LOCK',calendar_id:'calendar'});
 expect(JSON.stringify(result)).not.toContain('SECRET');expect(result.google_sub).toBeUndefined();expect(result.lock_id).toBeUndefined();expect(result.account_email).toBe('trainer@example.test');
});
it('rejects unauthorized requests before any data operation and rejects wrong origins',async()=>{
 const db=new Proxy({}, {get(){throw new Error('DB_SHOULD_NOT_BE_USED');}});
 const handler=createCalendarHandler({db,authenticate:async()=>null,env:{APP_URL:'https://example.test'},fetch:vi.fn()});
 expect((await handler(new Request('https://edge.test',{method:'POST',headers:{Origin:'https://example.test'},body:'{"action":"status"}'}))).status).toBe(401);
 expect((await handler(new Request('https://edge.test',{method:'POST',headers:{Origin:'https://evil.test'},body:'{"action":"status"}'}))).status).toBe(403);
});
