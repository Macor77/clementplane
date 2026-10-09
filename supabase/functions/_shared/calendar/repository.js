export async function checked(query){const {data,error}=await query;if(error)throw new Error('CALENDAR_DATABASE_ERROR');return data;}
export async function connection(db,userId){return checked(db.from('calendar_connections').select('*').eq('user_id',userId).maybeSingle());}
export async function lock(db,userId){
 const rows=await checked(db.rpc('calendar_lock',{p_user_id:userId}));if(!rows?.length)throw new Error('SYNC_BUSY');return rows[0];
}
export async function unlock(db,row,values={}){
 const updated=await checked(db.from('calendar_connections').update({...values,lock_id:null,lock_until:null}).eq('id',row.id).eq('lock_id',row.lock_id).select('id'));
 if(!updated?.length)throw new Error('LEASE_LOST');
}
export async function guard(db,row,deadline){
 if(Date.now()>deadline)throw new Error('BUDGET_REACHED');
 const current=await connection(db,row.user_id);
 if(!current||current.status!=='active'||current.lock_id!==row.lock_id||Date.parse(current.lock_until)<=Date.now()||current.dirty_version!==row.dirty_version)throw new Error('LEASE_LOST');
}
export async function allMappings(db,id){
 const rows=[];for(let start=0;;start+=500){
  const batch=await checked(db.from('calendar_events').select('*').eq('connection_id',id).order('key').range(start,start+499));rows.push(...batch);if(batch.length<500)return rows;
 }
}
export function eventStore(db,row,deadline){return {owner:row.id,cycle:row.cycle_id,
 list:()=>allMappings(db,row.id),guard:()=>guard(db,row,deadline),
 save:async mapping=>{await guard(db,row,deadline);return checked(db.from('calendar_events').upsert({...mapping,connection_id:row.id},{onConflict:'connection_id,key'}));}
};}
