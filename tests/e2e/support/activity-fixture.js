export const id='00000000-0000-4000-8000-000000000031';
export async function fixture(page, origin='personal', organization=false) {
  let saved=null, fail=false, sends=0, privateReads=0, retained=false;
  const user={id:'20000000-0000-0000-0000-000000000001',email:'alex@example.invalid',aud:'authenticated',role:'authenticated'};
  const trainer='10000000-0000-0000-0000-000000000001';
  const token=[Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'),Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+36000,role:'authenticated'})).toString('base64url'),'test'].join('.');
  const personal={id,trainer_id:trainer,title:'Client fictif',formation:'SST fictive',client_name:'OF Démo',location:'Centre fictif',dates:[{date:'2026-11-01',heure_debut:'09:00',heure_fin:'17:00'},{date:'2026-11-02',heure_debut:'09:00',heure_fin:'17:00'}],private_notes:'',fee:700,fee_unit:'mission',status:'confirmed',revision:1,created_at:'2026-10-01T12:00:00Z',updated_at:'2026-10-01T12:00:00Z'};
  const proposal={mission_id:id,mission_formateur_id:'m-f',mission_title:'SST fictive',formation:'SST fictive',status:'affecte',organization_name:'OF Démo',offered_fee:700,dates:personal.dates};
  const ofMission={id,organization_id:'of-demo',formation:'SST fictive',intitule:'SST fictive',statut:'affectee',lieu:'Centre fictif',mission_dates:personal.dates,mission_formateurs:[],competences:[],materiel:[]};
  await page.addInitScript(({user,token,organization})=>{localStorage.setItem('sb-example-auth-token',JSON.stringify({access_token:token,refresh_token:'fake',expires_at:Math.floor(Date.now()/1000)+36000,expires_in:36000,token_type:'bearer',user}));sessionStorage.setItem('timeforma_active_space',organization?'organization':'trainer');localStorage.setItem('clementplane_pwa_install_dismissed_at',String(Date.now()));},{user,token,organization});
  await page.route('https://example.supabase.co/**',async route=>{
    const req=route.request(),url=new URL(req.url()),path=url.pathname;let data=[];
    if(path.includes('/functions/')) {const action=req.postDataJSON()?.action;if(['status'].includes(action)) data={mode:'disabled',status:'disconnected'};else {sends++;data={success:true};}}
    else if(path.endsWith('/auth/v1/user')) data=user;
    else if(path.endsWith('/profiles'))data={id:user.id,role:organization?'organization':'trainer',first_name:'Alex',last_name:'Démo'};
    else if(path.endsWith('/trainers'))data=organization?null:{id:trainer,prenom:'Alex',nom:'Démo',statut:'actif'};
    else if(path.endsWith('/organization_members'))data=organization?[{organization_id:'of-demo',role:'owner',status:'active',organization:{id:'of-demo',name:'OF Démo',status:'active'}}]:[];
    else if(path.endsWith('/trainer_personal_missions'))data=origin==='personal'&&!retained?(url.searchParams.has('id')?personal:[personal]):[];
    else if(path.endsWith('/get_my_mission_proposals')) data=origin==='organization'&&!retained?[proposal]:[];
    else if(path.endsWith('/missions'))data=ofMission;
    else if(path.endsWith('/is_platform_admin'))data=false;
    else if(path.endsWith('/trainer_activity_reports'))data=url.searchParams.has('trainer_id') && (url.searchParams.has('id')||url.searchParams.has('personal_mission_id')||url.searchParams.has('mission_id'))?saved?.report||null:saved?[saved.report]:[];
    else if(path.endsWith('/trainer_activity_private')){privateReads++;data=saved?.private;}
    else if(path.endsWith('/save_trainer_activity_report')){
      if(fail){fail=false;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'network failure'})});}
      const x=req.postDataJSON();const {expense_items,kilometers,difficulties,...shared}=x.p_data;
      saved={report:{...shared,report_mode:x.p_data.summary?'simple':'detailed',sessions:x.p_data.sessions||saved?.report.sessions||[],formation_title:'SST fictive',reference_dates:personal.dates.map(d=>d.date),activity_date:'2026-11-01',id:'report',trainer_id:trainer,trainer_name:'Alex Démo',mission_id:origin==='organization'?id:null,personal_mission_id:origin==='personal'?id:null,agreed_fee:{amount:700,unit:origin==='personal'?'mission':null,tax_basis:origin==='personal'?'HT':null},revision:(saved?.report.revision||0)+1,updated_at:'2026-11-12T09:00:00Z'},private:{...saved?.private,expense_items,expenses:expense_items.reduce((sum,row)=>sum+(row.amount_cents||0),0)/100,kilometers,difficulties}};data=saved;
    }
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  return {fail:()=>{fail=true;},saved:()=>saved,sends:()=>sends,privateReads:()=>privateReads,seed:data=>{saved=data;},retain:()=>{retained=true;}};
}
