// Only this whitelist may cross the service-role boundary to the browser.
export function microsoftPublicStatus(row,mode='disabled') {
 return {mode,status:row?.status||'disconnected',account_email:row?.account_email||null,calendar_name:row?.calendar_id?'Clementplane':null,calendar_url:null,last_success_at:row?.last_success_at||null,error_code:row?.error_code||null,include_fee:row?.include_fee===true,include_notes:row?.include_notes===true,pending:row?.status==='active'&&(row.dirty_version!==row.synced_version||!row.last_success_at)};
}
