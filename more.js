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

// ---------- Academy balance: what is left for the academy after teachers are paid ----------
async function acadBal(m){
  const [s,e]=mr(m);
  const [ts,col,ex]=await Promise.all([
    q(sb.rpc('teacher_statement',{p_month:m})),
    q(sb.from('fees').select('amount').eq('month',m).eq('status','Paid')),
    q(sb.from('expenses').select('amount').gte('date',s).lt('date',e))]);
  const collected=sum(col),tcost=ts.reduce((n,r)=>n+r.share_earned+r.fixed_part+r.bonus-r.deduction,0),
    paidOut=ts.reduce((n,r)=>n+r.paid_out,0),owed=ts.reduce((n,r)=>n+r.balance,0),exps=sum(ex),
    afterT=collected-tcost,left=afterT-exps;
  return {m,collected,tcost,paidOut,owed,exps,afterT,left};
}
function acadCard(b){
  return '<div class="card" style="border-color:var(--gold)"><b>💰 Academy balance after teachers ('+esc(b.m)+')</b>'+
    ln('Fees collected',rs(b.collected))+
    ln('Teachers\' total earnings (share + fixed + bonus − deductions)','- '+rs(b.tcost))+
    ln('Academy keeps after teachers',rs(b.afterT),1)+
    ln('Other expenses (rent, bills, etc.)','- '+rs(b.exps))+
    ln(b.left>=0?'✅ Remaining with academy':'⚠️ Shortfall',rs(Math.abs(b.left)),1)+
    '<div class="mut" style="margin-top:8px">Already paid to teachers: '+rs(b.paidOut)+' · Still to pay teachers: '+rs(b.owed)+'. Counted only from fees marked <b>Paid</b> for this month.</div></div>';
}
const _finBal=V.finance;
V.finance=async()=>{
  await _finBal();
  try{const b=await acadBal(S.mm||today().slice(0,7)),k=$('view').querySelector('.kpis');if(k&&tab==='finance')k.insertAdjacentHTML('beforebegin',acadCard(b))}catch(e){}
};
const _homeBal=V.home;
V.home=async()=>{
  await _homeBal();
  try{if(me.role!=='owner')return;const b=await acadBal(today().slice(0,7)),k=$('view').querySelector('.kpis');
    if(k&&tab==='home'){k.insertAdjacentHTML('beforeend',kpi('Academy keeps after teachers',rs(b.afterT))+kpi(b.left>=0?'Remaining after expenses':'Shortfall after expenses',rs(Math.abs(b.left))))}}catch(e){}
};
