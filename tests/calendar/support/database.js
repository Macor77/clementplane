import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
// A minimal PostgREST-shaped adapter over real PostgreSQL, only for contract tests.
// Every query runs with the actual service role grants, RLS and migration functions.
export async function calendarDatabase(){
 const sql=new PGlite();
 for(const file of ['tests/calendar/support/base.sql','supabase/migrations/20261008054625_google_calendar_sync.sql','supabase/migrations/20261008072003_google_calendar_service_read_access.sql','supabase/migrations/20261012045140_calendar_identity_read_access.sql','supabase/migrations/20261028065329_microsoft_calendar_sync.sql'])await sql.exec(fs.readFileSync(file,'utf8'));
 await sql.exec('set role service_role');
 const identifier=s=>{if(!/^[a-z_]+$/.test(s))throw new Error('Invalid identifier');return `"${s}"`;};
 class Query {
  constructor(table){this.table=identifier(table);this.filters=[];this.params=[];this.op='select';}
  select(columns='*'){this.columns=columns;this.returning=true;return this;}insert(v){this.op='insert';this.values=v;return this;}
  upsert(v,opts={}){this.op='insert';this.values=v;this.conflict=opts;return this;}
  update(v){this.op='update';this.values=v;return this;}delete(){this.op='delete';return this;}
  filter(k,op,v){this.params.push(v);this.filters.push(`${identifier(k)} ${op} $${this.params.length}`);return this;}
  eq(k,v){return this.filter(k,'=',v);}neq(k,v){return this.filter(k,'<>',v);}gt(k,v){return this.filter(k,'>',v);}lt(k,v){return this.filter(k,'<',v);}
  limit(n){this.limitValue=n;return this;}maybeSingle(){this.single=true;return this;}
  order(k){this.orderBy=identifier(k);return this;}range(start,end){this.offset=start;this.limitValue=end-start+1;return this;}
  then(ok,fail){return this.execute().then(ok,fail);}
  async execute(){
   try {
    const entries=Object.entries(this.values||{}),columns=entries.map(([k])=>identifier(k));
    const values=entries.map(([,v])=>{this.params.push(v);return `$${this.params.length}`;});
    let query=this.op==='select'?`select ${!this.columns||this.columns==='*'?'*':this.columns.split(',').map(identifier).join(',')} from ${this.table}`:this.op==='delete'?`delete from ${this.table}`:this.op==='update'?`update ${this.table} set ${columns.map((k,i)=>`${k}=${values[i]}`).join(',')}`:`insert into ${this.table} (${columns.join(',')}) values (${values.join(',')})`;
    if(this.filters.length)query+=' where '+this.filters.join(' and ');
    if(this.conflict)query+=` on conflict (${this.conflict.onConflict.split(',').map(identifier).join(',')}) do `+(this.conflict.ignoreDuplicates?'nothing':`update set ${columns.map(k=>`${k}=excluded.${k}`).join(',')}`);
    if(this.op==='select')query+=(this.orderBy?` order by ${this.orderBy}`:'')+(this.limitValue?` limit ${this.limitValue}`:'')+(this.offset?` offset ${this.offset}`:'');
    else if(this.returning)query+=' returning *';
    const result=await sql.query(query,this.params);return {data:this.single?result.rows[0]||null:result.rows};
   }catch(error){return {error};}
  }
 }
 return {sql,from:table=>new Query(table),rpc:async(name,args={})=>{
  try {const keys=Object.keys(args);const result=await sql.query(`select * from ${identifier(name)}(${keys.map((k,i)=>`${identifier(k)} => $${i+1}`).join(',')})`,Object.values(args));
   return {data:name==='calendar_source_snapshot'?result.rows[0].calendar_source_snapshot:name==='microsoft_calendar_finish'?result.rows[0].microsoft_calendar_finish:result.rows};
  }catch(error){return {error};}
 }};
}
