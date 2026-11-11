// Small additions and fixes (loaded last). Staff tab: owner can delete a staff login.
V.staff=async()=>{
  const s=await q(sb.from('staff').select('*').order('active').order('created_at'));
  $('view').innerHTML='<h2>Staff</h2><div class="card mut">New teachers sign up themselves. Choose a role and press Approve. A teacher only sees the students you assign to them. <b>Owner</b> role = full admin (can approve staff and make other admins). <b>Delete</b> removes a login completely (use it for duplicate or wrong sign-ups); their old records stay.</div>'+
  s.map(x=>`<div class="card"><div class="rowx"><span><b>${esc(x.name)}</b> <small class="mut">${esc(x.role)} · joined ${esc(String(x.created_at||'').slice(0,10))}</small></span><span class="badge ${x.active?'Active':'Pending'}">${x.active?'Active':'Waiting approval'}</span></div>`+
  (x.user_id===me.user_id?'':(x.active?`<button class="btn sm red" data-act="sOff" data-id="${x.user_id}">Deactivate</button>`:`<select class="rs" style="width:auto;display:inline-block;height:38px"><option>teacher</option><option>accountant</option><option>owner</option></select> <button class="btn sm grn" data-act="sOn" data-id="${x.user_id}">Approve</button>`)+
   (DEMO_MODE?'':` <button class="btn sm red" data-act="sDel" data-id="${x.user_id}" data-n="${esc(x.name)}">🗑 Delete</button>`))+'</div>').join('');
};
acts.sDel=async d=>{
  if(!confirm('Delete "'+d.n+'" permanently?\n\nThey will not be able to log in any more. Their old records (attendance, fees, etc.) stay. This cannot be undone.'))return;
  const {data,error}=await sb.rpc('delete_staff',{p_user_id:d.id});
  error?toast(error.message,1):(toast(data||'Deleted \u2713'),show('staff'));
};
