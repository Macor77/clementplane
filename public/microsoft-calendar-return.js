// Deliberately separate from the SPA: no auth parser, analytics or third-party resource.
const params=new URLSearchParams(window.location.search);
window.history.replaceState(null,'','/microsoft-calendar-callback.html');
try{
 const intent=JSON.parse(sessionStorage.getItem('cp_microsoft_oauth_intent')||'null');
 const state=params.get('state');
 const result=intent&&intent.state===state&&intent.expires>Date.now()
  ? {state,code:params.get('code'),error:params.get('error')}
  : {error:'invalid_state'};
 sessionStorage.setItem('cp_microsoft_oauth_return',JSON.stringify(result));
 window.location.replace('/formateur/parametres#microsoft-agenda');
}catch{document.body.textContent='Revenez dans Clementplane et recommencez la connexion Microsoft dans ce navigateur.';}
