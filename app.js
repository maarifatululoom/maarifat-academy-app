const SB='https://yffwwdfdrqpexqfrcqmd.supabase.co', KEY='sb_publishable_oVBCGxvhVuUztj9Y35I4wA_7TYLn0Aw';
const sb=supabase.createClient(SB,KEY);
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date(Date.now()+18e6).toISOString().slice(0,10);
const rs=n=>'Rs. '+Number(n||0).toLocaleString('en-US');
const sum=a=>a.reduce((n,x)=>n+(x.amount||0),0);
const wa=p=>{const d=String(p||'').replace(/\D/g,'');return d.startsWith('0')?'92'+d.slice(1):d};
const mr=m=>{const [y,mo]=m.split('-').map(Number);return [m+'-01',new Date(Date.UTC(y,mo,1)).toISOString().slice(0,10)]};
const csv=(name,rows)=>{const t=rows.map(r=>r.map(c=>{let v=String(c==null?'':c).replace(/^([=+\-@])/,"'$1");return '"'+v.replace(/"/g,'""')+'"'}).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+t],{type:'text/csv'}));a.download=name;a.click()};
const LV=['Noorani Qaida','Nazra Quran','Hifz-ul-Quran','Tajweed'],CATS=['Salary','Rent','Utilities','Books & Supplies','Other'],PT=['share','fixed','mixed'];
let me=null,tab=null,S={},NT=[],RD=new Set();
const TABS={owner:[['home','Home'],['attendance','Attendance'],['students','Students'],['admissions','Admissions'],['fees','Fees'],['teachers','Teachers'],['finance','Finance'],['exams','Exams'],['staff','Staff']],teacher:[['attendance','Attendance'],['students','Students'],['exams','Exams']],accountant:[['fees','Fees'],['teachers','Teachers'],['finance','Finance']]};
function toast(m,bad){const t=$('toast');t.textContent=m;t.className=bad?'bad':'';t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',3200)}
async function q(p){const r=await p;if(r.error){toast(r.error.message,1);throw r.error}return r.data}
function setTheme(d){document.documentElement.dataset.theme=d?'dark':'light';$('bTh').textContent=d?'☀️':'🌙';localStorage.setItem('dark',d?'1':'0')}
$('bTh').onclick=()=>setTheme(document.documentElement.dataset.theme!=='dark');
setTheme(localStorage.getItem('dark')==='1');

// ---------- Auth ----------
function pane(n){['auth','wait','app'].forEach(x=>$(x).classList.toggle('hide',x!==n));$('bOut').classList.toggle('hide',n==='auth');$('bBell').classList.toggle('hide',n!=='app')}
$('tLogin').onclick=()=>{$('lf').classList.remove('hide');$('sf').classList.add('hide');$('tLogin').classList.add('on');$('tSign').classList.remove('on')};
$('tSign').onclick=()=>{$('sf').classList.remove('hide');$('lf').classList.add('hide');$('tSign').classList.add('on');$('tLogin').classList.remove('on')};
$('lf').onsubmit=async e=>{e.preventDefault();const {error}=await sb.auth.signInWithPassword({email:$('le').value.trim(),password:$('lp').value});if(error)return toast(error.message,1);boot()};
$('sf').onsubmit=async e=>{e.preventDefault();const {data,error}=await sb.auth.signUp({email:$('se').value.trim(),password:$('sp').value,options:{data:{name:$('sn').value.trim()}}});if(error)return toast(error.message,1);if(data.session)boot();else{toast('Account created. Confirm your email if asked, then wait for owner approval.');$('tLogin').click()}};
$('bOut').onclick=async()=>{await sb.auth.signOut();location.reload()};
$('bRe').onclick=()=>boot();
async function boot(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){pane('auth');return}
  const {data:row}=await sb.from('staff').select('*').eq('user_id',session.user.id).maybeSingle();
  if(!row||!row.active){me=null;pane('wait');return}
  me=row;$('who').textContent=(me.name+' · '+me.role).toUpperCase();
  const tabs=TABS[me.role]||[];
  $('nav').innerHTML=tabs.map(([k,l])=>`<button data-t="${k}">${l}</button>`).join('');
  pane('app');show(tabs[0][0]);loadNotifs();
  sb.channel('nt').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},()=>loadNotifs(true)).subscribe();
}
async function show(t){
  tab=t;document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  $('view').innerHTML='<div class="load">Loading...</div>';
  try{await V[t]()}catch(e){$('view').innerHTML='<div class="card">Error: '+esc(e.message||e)+'</div>'}
}

// ---------- Notifications ----------
async function loadNotifs(ping){
  const {data}=await sb.from('notifications').select('*').order('created_at',{ascending:false}).limit(30);
  const {data:rd}=await sb.from('notification_reads').select('notification_id');
  NT=data||[];RD=new Set((rd||[]).map(r=>r.notification_id));
  const un=NT.filter(n=>!RD.has(n.id)).length,d=$('dot');d.textContent=un;d.classList.toggle('hide',!un);
  if(ping&&un)toast('🔔 '+(NT[0]?NT[0].title:'New notification'));
  $('np').innerHTML=NT.length?NT.map(n=>`<div class="${RD.has(n.id)?'':'un'}" data-act="nOpen" data-id="${n.id}" data-type="${esc(n.type)}"><b>${esc(n.title)}</b><br><span class="mut">${esc(n.body||'')}</span></div>`).join(''):'<div>No notifications</div>';
}
$('bBell').onclick=e=>{if(e.target.closest('#np'))return;const p=$('np');p.style.display=p.style.display==='block'?'none':'block'};

// ---------- Views ----------
const V={};
const kpi=(l,v)=>`<div class="kpi"><div>${esc(v)}</div><small>${esc(l)}</small></div>`;
const ln=(l,v,big)=>`<div class="ln${big?' big':''}"><span>${esc(l)}</span><span>${esc(v)}</span></div>`;
const isT=()=>me.role==='teacher';
const none='<div class="card">No students assigned to you yet. The owner will assign students to you.</div>';

V.home=async()=>{
  const ym=today().slice(0,7);
  const [a,b,c,d,e]=await Promise.all([
    sb.from('students').select('roll_no',{count:'exact',head:true}).eq('status','Active'),
    sb.from('attendance').select('status').eq('date',today()),
    sb.from('fees').select('amount,status').eq('month',ym),
    sb.from('students').select('family_id').eq('status','Pending'),
    sb.from('staff').select('user_id',{count:'exact',head:true}).eq('active',false)]);
  const at=b.data||[],cnt=s=>at.filter(x=>x.status===s).length,fs=c.data||[];
  const fsum=st=>sum(fs.filter(x=>x.status===st));
  const fam=new Set((d.data||[]).map(x=>x.family_id)).size;
  $('view').innerHTML='<h2>Dashboard</h2><div class="kpis">'+kpi('Active students',a.count||0)+kpi('Present today',cnt('Present'))+kpi('Absent today',cnt('Absent'))+kpi('On leave today',cnt('Leave'))+kpi('Fees collected '+ym,rs(fsum('Paid')))+kpi('Fees pending '+ym,rs(fsum('Unpaid')))+'</div>'+
   `<button class="card link" data-act="go" data-t="admissions">📝 New admissions waiting: <b>${fam}</b></button><button class="card link" data-act="go" data-t="staff">👤 Staff waiting for approval: <b>${e.count||0}</b></button>`;
};

V.attendance=async()=>{
  const d=S.ad||(S.ad=today());
  const [st,at]=await Promise.all([q(sb.from('students').select('roll_no,name,level').eq('status','Active').order('roll_no')),q(sb.from('attendance').select('*').eq('date',d))]);
  const m={};at.forEach(r=>m[r.roll_no]=r);
  $('view').innerHTML=`<h2>Attendance</h2>`+(isT()?'<div class="card mut">Showing only the students assigned to you.</div>':'')+`<div class="card"><label>Date</label><input type="date" value="${d}" data-chg="ad"></div>`+
  (st.length?st.map(s=>{const r=m[s.roll_no]||{},isQ=s.level==='Noorani Qaida',num=isQ?r.takhti_no:r.para_no;
    return `<div class="card att" data-r="${s.roll_no}" data-l="${esc(s.level)}"><b>${esc(s.name)}</b> <small class="mut">#${s.roll_no} · ${esc(s.level||'')}</small><div class="g2"><select class="as"><option value="">— status —</option>${['Present','Absent','Leave'].map(x=>`<option${r.status===x?' selected':''}>${x}</option>`).join('')}</select><input class="an" type="number" min="0" placeholder="${isQ?'Takhti no':'Para no'}" value="${num==null?'':num}"></div><input class="at" placeholder="Notes / sabaq" value="${esc(r.notes||'')}"></div>`}).join('')+'<button class="btn full" data-act="saveAtt">Save attendance</button>':(isT()?none:'<div class="card">No active students.</div>'));
};

V.students=async()=>{
  const own=me.role==='owner';
  const [st,th]=await Promise.all([q(sb.from('students').select('roll_no,name,level,status,monthly_fee,timing,exact_time,teacher_id,teacher_share,families(guardian_name,whatsapp)').order('roll_no')),own?q(sb.from('teachers').select('id,name').eq('active',true).order('name')):Promise.resolve([])]);
  const un=own?st.filter(s=>s.status==='Active'&&!s.teacher_id).length:0;
  $('view').innerHTML='<h2>Students</h2>'+(isT()?'<div class="card mut">Showing only the students assigned to you.</div>':'')+(un?`<div class="card mut">⚠️ ${un} active student(s) have no teacher yet. Choose a teacher below.</div>`:'')+(isT()&&!st.length?none:'<input placeholder="Search name / roll / guardian" data-filter=".stu" style="margin-bottom:10px">')+st.map(s=>{const f=s.families||{};
   return `<div class="card stu" data-s="${esc((s.name+' '+s.roll_no+' '+(f.guardian_name||'')).toLowerCase())}"><div class="rowx"><span><b>${esc(s.name)}</b> <small class="mut">#${s.roll_no}</small></span><span class="badge ${esc(s.status)}">${esc(s.status)}</span></div><div class="mut">${esc(f.guardian_name||'')} · <a href="https://wa.me/${wa(f.whatsapp)}" target="_blank" rel="noopener">${esc(f.whatsapp||'')}</a></div>`+
   (own?`<div class="g3"><select data-chg="stu" data-r="${s.roll_no}" data-f="level">${LV.map(l=>`<option${s.level===l?' selected':''}>${l}</option>`).join('')}</select><select data-chg="stu" data-r="${s.roll_no}" data-f="status">${['Pending','Active','Left'].map(l=>`<option${s.status===l?' selected':''}>${l}</option>`).join('')}</select><input type="number" min="0" data-chg="stu" data-r="${s.roll_no}" data-f="monthly_fee" value="${s.monthly_fee==null?'':s.monthly_fee}" placeholder="Fee"></div><div class="g2"><select data-chg="stu" data-r="${s.roll_no}" data-f="teacher_id"><option value="">No teacher assigned</option>${th.map(t=>`<option value="${t.id}"${s.teacher_id===t.id?' selected':''}>${esc(t.name)}</option>`).join('')}</select><input type="number" min="0" max="100" step="0.5" data-chg="stu" data-r="${s.roll_no}" data-f="teacher_share" value="${s.teacher_share==null?'':s.teacher_share}" placeholder="Teacher % (blank = default)"></div>`:`<div class="mut">${esc(s.level||'')} · ${esc(s.timing||'')} ${esc(s.exact_time||'')}</div>`)+'</div>'}).join('');
};

V.admissions=async()=>{
  const st=await q(sb.from('students').select('roll_no,name,dob,gender,level,timing,exact_time,monthly_fee,fee_plan,family_id,families(guardian_name,whatsapp,emergency_contact,off_days,message)').eq('status','Pending').order('roll_no'));
  const g={};st.forEach(s=>(g[s.family_id]=g[s.family_id]||[]).push(s));
  const ids=Object.keys(g);
  $('view').innerHTML='<h2>New admissions</h2>'+(ids.length?ids.map(id=>{const k=g[id],f=k[0].families||{};
   return `<div class="card"><b>${esc(f.guardian_name)}</b><div class="mut"><a href="https://wa.me/${wa(f.whatsapp)}" target="_blank" rel="noopener">${esc(f.whatsapp)}</a> · Emergency: ${esc(f.emergency_contact||'-')} · Off day: ${esc(f.off_days||'-')}</div>${f.message?`<div class="mut">“${esc(f.message)}”</div>`:''}<hr style="border:0;border-top:1px dashed var(--line)">`+
   k.map(s=>`<div>• <b>${esc(s.name)}</b> · ${esc(s.gender||'')} · DOB ${esc(s.dob||'-')} · ${esc(s.level||'')} · ${esc(s.timing||'')} ${esc(s.exact_time||'')} · ${s.monthly_fee==null?'fee not set':rs(s.monthly_fee)}</div>`).join('')+
   `<div class="mut">Total: ${rs(k.reduce((n,s)=>n+(s.monthly_fee||0),0))} / month · ${esc(k[0].fee_plan||'')}</div><button class="btn grn" data-act="approve" data-id="${esc(id)}">Approve</button><button class="btn red" data-act="reject" data-id="${esc(id)}">Reject</button></div>`}).join(''):'<div class="card">No pending admissions.</div>');
};

V.fees=async()=>{
  const m=S.fm||(S.fm=today().slice(0,7));
  const f=await q(sb.from('fees').select('*,students(name,families(guardian_name,whatsapp))').eq('month',m).order('roll_no'));
  const paid=sum(f.filter(x=>x.status==='Paid')),due=sum(f.filter(x=>x.status!=='Paid'));
  $('view').innerHTML=`<h2>Fees</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="fm"><button class="btn" data-act="fcreate">Create fee rows for ${m}</button></div><div class="kpis">${kpi('Collected',rs(paid))}${kpi('Pending',rs(due))}${kpi('Total',rs(paid+due))}</div>`+
  (f.length?f.map(x=>{const s=x.students||{},fm=s.families||{},msg=encodeURIComponent('Assalamu alaikum! '+(s.name||'')+' ki '+m+' ki fees '+rs(x.amount)+' abhi baqi hai. Meherbani karke 5 tareekh tak jama karwa dein. JazakAllah. - Maarifat-ul-Uloom Academy'),rc=encodeURIComponent('Assalamu alaikum! '+(s.name||'')+' ki '+m+' ki fees '+rs(x.amount)+' mausool ho gayi hai. JazakAllah Khair. - Maarifat-ul-Uloom Academy');
   return `<div class="card"><div class="rowx"><span><b>${esc(s.name)}</b> <small class="mut">#${x.roll_no} · ${esc(fm.guardian_name||'')}</small></span><span class="badge ${esc(x.status)}">${esc(x.status)}${x.paid_on?' · '+esc(x.paid_on):''}</span></div><div class="rowx"><b>${rs(x.amount)}</b><span>`+
   (x.status==='Paid'?`<button class="btn sm red" data-act="funpay" data-r="${x.roll_no}">Mark unpaid</button><a class="btn sm" style="text-decoration:none;display:inline-block" href="https://wa.me/${wa(fm.whatsapp)}?text=${rc}" target="_blank" rel="noopener">Send receipt</a>`:`<button class="btn sm grn" data-act="fpay" data-r="${x.roll_no}">Mark paid</button><a class="btn sm" style="text-decoration:none;display:inline-block" href="https://wa.me/${wa(fm.whatsapp)}?text=${msg}" target="_blank" rel="noopener">WhatsApp reminder</a>`)+`<button class="btn sm" data-act="fedit" data-r="${x.roll_no}" data-a="${x.amount}">Edit amount</button></span></div></div>`}).join(''):'<div class="card">No fee rows for this month. Tap "Create fee rows".</div>');
};

V.teachers=async()=>{
  const m=S.tm||(S.tm=today().slice(0,7)),own=me.role==='owner';
  const [rows,th,pay,asg,unas,col]=await Promise.all([
    q(sb.rpc('teacher_statement',{p_month:m})),
    q(sb.from('teachers').select('*').order('name')),
    q(sb.from('teacher_payments').select('*,teachers(name)').eq('month',m).order('date',{ascending:false})),
    q(sb.from('students').select('name,teacher_id').not('teacher_id','is',null).eq('status','Active')),
    q(sb.from('students').select('name').is('teacher_id',null).eq('status','Active')),
    q(sb.from('fees').select('amount').eq('month',m).eq('status','Paid'))]);
  S.tr=rows;
  const collected=sum(col),tcost=rows.reduce((n,r)=>n+r.share_earned+r.fixed_part+r.bonus-r.deduction,0),owed=rows.reduce((n,r)=>n+r.balance,0);
  const nm={};asg.forEach(s=>(nm[s.teacher_id]=nm[s.teacher_id]||[]).push(s.name));
  const withS=rows.filter(r=>(nm[r.t_id]||[]).length),noS=rows.filter(r=>!(nm[r.t_id]||[]).length);
  const btn=(r,k,c)=>`<button class="btn sm ${c||''}" data-act="tpay" data-tid="${r.t_id}" data-k="${k}">${k==='Payment'?'Pay salary':k}</button>`;
  $('view').innerHTML=`<h2>Teachers &amp; salaries</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="tm"><div class="mut">Teacher share is calculated only on fees that are marked <b>Paid</b> for that month. Teachers appear here only after they sign up and you approve them in the Staff tab.</div></div>`+
  `<div class="kpis">${kpi('Fees collected (all)',rs(collected))}${kpi('Teacher cost (earned)',rs(tcost))}${kpi('Academy keeps',rs(collected-tcost))}${kpi('Still owed to teachers',rs(owed))}</div>`+
  `<div class="card"><b>Who teaches whom</b>`+
  (withS.length?withS.map(r=>ln(r.t_name+' ('+nm[r.t_id].length+')',nm[r.t_id].join(', '))).join(''):'<div class="mut">No teacher has students yet.</div>')+
  `<div class="ln"><span>🟡 Teachers without students</span><span>${noS.length?esc(noS.map(r=>r.t_name).join(', ')):'none'}</span></div>`+
  `<div class="ln"><span>⚠️ Students without a teacher (${unas.length})</span><span>${unas.length?esc(unas.map(s=>s.name).join(', ')):'none'}</span></div></div>`+
  (rows.length?rows.map(r=>{const t=th.find(x=>x.id===r.t_id)||{},ic=t.gender==='Male'?'👨‍🏫 ':t.gender==='Female'?'👩‍🏫 ':'';
    return `<div class="card"><div class="rowx"><span>${ic}<b>${esc(r.t_name)}</b> <span class="badge">${esc(r.t_pay_type)}</span>${t.gender?` <span class="badge">${esc(t.gender)}</span>`:''}</span><small class="mut">${(nm[r.t_id]||[]).length} students</small></div>${t.phone?`<div class="mut">${esc(t.phone)}</div>`:''}<div class="mut">${esc((nm[r.t_id]||[]).join(', ')||'No students assigned yet')}</div>`+
    ln('Fees of their students (collected / pending)',rs(r.fees_paid)+' / '+rs(r.fees_unpaid))+
    ln('Teacher share ('+r.t_share_percent+'% default)',rs(r.share_earned))+ln('Fixed salary',rs(r.fixed_part))+ln('Bonus',rs(r.bonus))+ln('Deduction','- '+rs(r.deduction))+ln('Already paid / advance','- '+rs(r.paid_out))+
    ln('Balance due to teacher',rs(r.balance),1)+ln('Academy share from these students',rs(r.academy_share))+
    `<div>${btn(r,'Payment','grn')}${btn(r,'Advance')}${btn(r,'Bonus')}${btn(r,'Deduction','red')}</div>`+
    (own?`<div class="g3"><select data-chg="th" data-id="${r.t_id}" data-f="pay_type">${PT.map(p=>`<option${r.t_pay_type===p?' selected':''}>${p}</option>`).join('')}</select><input type="number" min="0" max="100" step="0.5" data-chg="th" data-id="${r.t_id}" data-f="share_percent" value="${r.t_share_percent}" title="Share %" placeholder="Share %"><input type="number" min="0" data-chg="th" data-id="${r.t_id}" data-f="fixed_salary" value="${r.t_fixed_salary}" title="Fixed salary" placeholder="Fixed Rs."></div><div class="g2"><select data-chg="th" data-id="${r.t_id}" data-f="gender"><option value="">Gender</option><option${t.gender==='Male'?' selected':''}>Male</option><option${t.gender==='Female'?' selected':''}>Female</option></select></div><button class="btn sm red" data-act="tactive" data-id="${r.t_id}" data-v="0">Deactivate teacher</button>`:'')+'</div>'}).join(''):'<div class="card">No teachers yet. A teacher appears here after signing up and being approved in the Staff tab.</div>')+
  (own&&th.some(t=>!t.active)?'<h2>Inactive teachers</h2>'+th.filter(t=>!t.active).map(t=>`<div class="card rowx"><span>${esc(t.name)}</span><button class="btn sm grn" data-act="tactive" data-id="${t.id}" data-v="1">Activate</button></div>`).join(''):'')+
  '<h2>Payments &amp; adjustments this month</h2>'+(pay.length?pay.map(p=>`<div class="card"><div class="rowx"><span><b>${rs(p.amount)}</b> · ${esc(p.type)} · ${esc((p.teachers||{}).name)} <small class="mut">${esc(p.date)}</small><div class="mut">${esc(p.note||'')}</div></span><button class="btn sm red" data-act="tdel" data-id="${p.id}">Delete</button></div></div>`).join(''):'<div class="card">Nothing recorded yet.</div>')+
  (rows.length?'<button class="btn" data-act="csvT">Download statement (CSV)</button>':'');
};

V.finance=async()=>{
  const m=S.mm||(S.mm=today().slice(0,7)),[s,e]=mr(m),[y,mo]=m.split('-').map(Number);
  const s6=new Date(Date.UTC(y,mo-6,1)).toISOString().slice(0,10);
  const [paid6,exp6,due,po6]=await Promise.all([
    q(sb.from('fees').select('amount,paid_on').eq('status','Paid').gte('paid_on',s6).lt('paid_on',e)),
    q(sb.from('expenses').select('*').gte('date',s6).lt('date',e).order('date',{ascending:false})),
    q(sb.from('fees').select('amount').eq('month',m).eq('status','Unpaid')),
    q(sb.from('teacher_payments').select('amount,date').in('type',['Payment','Advance']).gte('date',s6).lt('date',e))]);
  const inM=paid6.filter(x=>x.paid_on>=s),exM=exp6.filter(x=>x.date>=s),poM=po6.filter(x=>x.date>=s);
  const income=sum(inM),exps=sum(exM),pout=sum(poM),net=income-exps-pout;
  S.fin={m,income,exps,pout,net,pending:sum(due),list:exM};
  const mons=[];for(let i=5;i>=0;i--)mons.push(new Date(Date.UTC(y,mo-1-i,1)).toISOString().slice(0,7));
  const inc=mons.map(k=>sum(paid6.filter(x=>x.paid_on.slice(0,7)===k))),exs=mons.map(k=>sum(exp6.filter(x=>x.date.slice(0,7)===k))+sum(po6.filter(x=>x.date.slice(0,7)===k))),mx=Math.max(1,...inc,...exs);
  $('view').innerHTML=`<h2>Finance</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="mm"></div><div class="kpis">${kpi('Income (fees received)',rs(income))}${kpi('Other expenses',rs(exps))}${kpi('Teacher payouts',rs(pout))}${kpi(net>=0?'Net profit':'Net loss',rs(Math.abs(net)))}${kpi('Fees still pending',rs(sum(due)))}</div>`+
  `<div class="card"><b>Last 6 months</b> <span class="mut">🟩 income 🟥 expenses + teacher payouts</span><div class="bars">${mons.map((k,i)=>`<div><div class="pair"><i class="in" style="height:${inc[i]/mx*100}%"></i><i class="ex" style="height:${exs[i]/mx*100}%"></i></div>${k.slice(5)}/${k.slice(2,4)}</div>`).join('')}</div></div>`+
  `<div class="card"><b>Add expense</b> <span class="mut">(teacher salaries are recorded in the Teachers tab)</span><div class="g2"><input type="date" id="xd" value="${today()}"><select id="xc">${CATS.map(c=>`<option>${esc(c)}</option>`).join('')}</select></div><div class="g2"><input type="number" id="xa" min="1" placeholder="Amount (Rs.)"><input id="xn" maxlength="300" placeholder="Note (optional)"></div><button class="btn" data-act="addExp">Add expense</button></div>`+
  '<h2>Expenses this month</h2>'+(exM.length?exM.map(x=>`<div class="card"><div class="rowx"><span><b>${rs(x.amount)}</b> · ${esc(x.category)} <small class="mut">${esc(x.date)}</small><div class="mut">${esc(x.note||'')}</div></span><button class="btn sm red" data-act="delExp" data-id="${x.id}">Delete</button></div></div>`).join(''):'<div class="card">No expenses recorded.</div>')+'<button class="btn" data-act="csvF">Download month report (CSV)</button>';
};

V.exams=async()=>{
  const [st,ex]=await Promise.all([q(sb.from('students').select('roll_no,name').eq('status','Active').order('roll_no')),q(sb.from('exam_results').select('*,students(name)').order('created_at',{ascending:false}).limit(30))]);
  $('view').innerHTML=`<h2>Exams</h2>`+(isT()?'<div class="card mut">Showing only the students assigned to you.</div>':'')+(st.length?`<div class="card"><label>Student</label><select id="er">${st.map(s=>`<option value="${s.roll_no}">#${s.roll_no} ${esc(s.name)}</option>`).join('')}</select><label>Exam name</label><input id="en" maxlength="80" placeholder="e.g. Monthly test"><div class="g2"><div><label>Date</label><input type="date" id="ed" value="${today()}"></div><div><label>Marks / Total</label><div class="g2" style="margin:0"><input type="number" id="em" min="0" placeholder="Marks"><input type="number" id="et" min="1" placeholder="Total"></div></div></div><label>Remarks</label><input id="ek" maxlength="200"><button class="btn" data-act="addExam">Save result</button></div>`:(isT()?none:'<div class="card">No active students.</div>'))+
  '<h2>Recent results</h2>'+(ex.length?ex.map(x=>`<div class="card"><div class="rowx"><span><b>${esc((x.students||{}).name)}</b> · ${esc(x.exam_name)} <small class="mut">${esc(x.exam_date||'')}</small></span><span class="badge ${x.result==='Pass'?'Paid':'Left'}">${esc(x.result||'')}</span></div><div>${esc(x.marks_obtained)} / ${esc(x.total_marks)}</div><div class="mut">${esc(x.remarks||'')}</div></div>`).join(''):'<div class="card">No results yet.</div>');
};

V.staff=async()=>{
  const s=await q(sb.from('staff').select('*').order('active').order('created_at'));
  $('view').innerHTML='<h2>Staff</h2><div class="card mut">New teachers sign up themselves. Choose a role and press Approve. A teacher only sees the students you assign to them. <b>Owner</b> role = full admin (can approve staff and make other admins).</div>'+s.map(x=>`<div class="card"><div class="rowx"><span><b>${esc(x.name)}</b> <small class="mut">${esc(x.role)}</small></span><span class="badge ${x.active?'Active':'Pending'}">${x.active?'Active':'Waiting approval'}</span></div>`+
   (x.user_id===me.user_id?'':(x.active?`<button class="btn sm red" data-act="sOff" data-id="${x.user_id}">Deactivate</button>`:`<select class="rs" style="width:auto;display:inline-block;height:38px"><option>teacher</option><option>accountant</option><option>owner</option></select> <button class="btn sm grn" data-act="sOn" data-id="${x.user_id}">Approve</button>`))+'</div>').join('');
};

// ---------- Actions ----------
const acts={
  go:d=>show(d.t),
  nOpen:async d=>{if(!RD.has(+d.id)){await sb.from('notification_reads').insert({notification_id:+d.id,user_id:me.user_id});}$('np').style.display='none';await loadNotifs();const t=d.type==='new_admission'?'admissions':d.type==='new_staff_request'?'staff':null;if(t&&TABS[me.role].some(x=>x[0]===t))show(t)},
  saveAtt:async()=>{const d=S.ad,rows=[];
    document.querySelectorAll('.att').forEach(c=>{const status=c.querySelector('.as').value;if(!status)return;
      const lv=c.dataset.l,n=parseInt(c.querySelector('.an').value)||null,notes=c.querySelector('.at').value.trim()||null,isQ=lv==='Noorani Qaida',pr=status==='Present'&&n;
      rows.push({date:d,roll_no:+c.dataset.r,status,level:isQ?'Qaida':lv,takhti_no:pr&&isQ?n:null,para_no:pr&&!isQ?n:null,lesson:pr?(isQ?'Qaida - Takhti ':'Para ')+n:null,notes,marked_by:me.user_id})});
    if(!rows.length)return toast('Select a status for at least one student',1);
    const {error}=await sb.from('attendance').upsert(rows,{onConflict:'date,roll_no'});error?toast(error.message,1):toast('Attendance saved ✓')},
  approve:async d=>{const {error}=await sb.rpc('approve_admission',{p_family_id:d.id,p_fee:null});if(error)return toast(error.message,1);toast('Admission approved ✓');show('admissions')},
  reject:async d=>{if(!confirm('Reject this admission?'))return;const {error}=await sb.rpc('reject_admission',{p_family_id:d.id});if(error)return toast(error.message,1);toast('Admission rejected');show('admissions')},
  fcreate:async()=>{const {data,error}=await sb.rpc('create_month_fees',{p_month:S.fm});if(error)return toast(error.message,1);toast(data+' new fee rows created');show('fees')},
  fpay:async d=>{const {error}=await sb.from('fees').update({status:'Paid',paid_on:today()}).eq('month',S.fm).eq('roll_no',+d.r);error?toast(error.message,1):(toast('Marked paid ✓'),show('fees'))},
  funpay:async d=>{const {error}=await sb.from('fees').update({status:'Unpaid',paid_on:null}).eq('month',S.fm).eq('roll_no',+d.r);error?toast(error.message,1):(toast('Marked unpaid'),show('fees'))},
  fedit:async d=>{const v=prompt('New amount (Rs.)',d.a);if(v===null)return;const n=parseInt(v);if(!(n>=0))return toast('Invalid amount',1);const {error}=await sb.from('fees').update({amount:n}).eq('month',S.fm).eq('roll_no',+d.r);error?toast(error.message,1):(toast('Amount updated'),show('fees'))},
  addExp:async()=>{const amount=parseInt($('xa').value);if(!(amount>0))return toast('Enter a valid amount',1);const {error}=await sb.from('expenses').insert({date:$('xd').value||today(),category:$('xc').value,amount,note:$('xn').value.trim()||null});if(error)return toast(error.message,1);toast('Expense added ✓');show('finance')},
  delExp:async d=>{if(!confirm('Delete this expense?'))return;const {error}=await sb.from('expenses').delete().eq('id',+d.id);error?toast(error.message,1):(toast('Deleted'),show('finance'))},
  tactive:async d=>{const {error}=await sb.from('teachers').update({active:d.v==='1'}).eq('id',+d.id);error?toast(error.message,1):(toast(d.v==='1'?'Teacher activated':'Teacher deactivated'),show('teachers'))},
  tpay:async d=>{const k=d.k,a=parseInt(prompt(k+' amount (Rs.) for '+S.tm));if(!(a>0))return;const note=prompt('Note (optional)')||null;
    const {error}=await sb.from('teacher_payments').insert({teacher_id:+d.tid,month:S.tm,type:k,amount:a,note:note?note.slice(0,300):null});error?toast(error.message,1):(toast(k+' recorded ✓'),show('teachers'))},
  tdel:async d=>{if(!confirm('Delete this record?'))return;const {error}=await sb.from('teacher_payments').delete().eq('id',+d.id);error?toast(error.message,1):(toast('Deleted'),show('teachers'))},
  csvT:()=>csv('teacher-statement-'+S.tm+'.csv',[['Teacher','Type','Share %','Students','Fees collected','Fees pending','Teacher share','Fixed','Bonus','Deduction','Paid out','Balance due','Academy share']].concat((S.tr||[]).map(r=>[r.t_name,r.t_pay_type,r.t_share_percent,r.n_students,r.fees_paid,r.fees_unpaid,r.share_earned,r.fixed_part,r.bonus,r.deduction,r.paid_out,r.balance,r.academy_share]))),
  csvF:()=>{const f=S.fin;if(!f)return;csv('finance-'+f.m+'.csv',[['Month',f.m],['Income (fees received)',f.income],['Other expenses',f.exps],['Teacher payouts',f.pout],['Net',f.net],['Fees pending',f.pending],[],['Date','Category','Amount','Note']].concat(f.list.map(x=>[x.date,x.category,x.amount,x.note])))},
  addExam:async()=>{const m=parseFloat($('em').value),t=parseFloat($('et').value),name=$('en').value.trim();if(!name||!(t>0)||!(m>=0)||m>t)return toast('Enter exam name, marks and total correctly',1);
    const {error}=await sb.from('exam_results').insert({roll_no:+$('er').value,exam_name:name,exam_date:$('ed').value||today(),marks_obtained:m,total_marks:t,result:m/t>=0.4?'Pass':'Fail',remarks:$('ek').value.trim()||null});error?toast(error.message,1):(toast('Result saved ✓'),show('exams'))},
  sOn:async(d,el)=>{const role=el.parentElement.querySelector('.rs').value;const {error}=await sb.rpc('approve_staff',{p_user_id:d.id,p_role:role});error?toast(error.message,1):(toast(role==='teacher'?'Teacher approved ✓ (added to Teachers tab)':'Staff approved ✓'),show('staff'))},
  sOff:async d=>{if(!confirm('Deactivate this staff member?'))return;const {error}=await sb.rpc('deactivate_staff',{p_user_id:d.id});error?toast(error.message,1):(toast('Deactivated'),show('staff'))}
};
document.addEventListener('click',e=>{
  const t=e.target.closest('#nav button');if(t){show(t.dataset.t);return}
  const a=e.target.closest('[data-act]');if(a&&acts[a.dataset.act])acts[a.dataset.act](a.dataset,a);
  if(!e.target.closest('#bBell'))$('np').style.display='none'});
document.addEventListener('change',async e=>{
  const t=e.target,c=t.dataset.chg;if(!c)return;
  if(c==='ad'){S.ad=t.value;show('attendance')}
  else if(c==='fm'){S.fm=t.value;show('fees')}
  else if(c==='mm'){S.mm=t.value;show('finance')}
  else if(c==='tm'){S.tm=t.value;show('teachers')}
  else if(c==='stu'){const f=t.dataset.f;let v=t.value;if(f==='monthly_fee')v=v===''?null:parseInt(v);else if(f==='teacher_id')v=v===''?null:parseInt(v);else if(f==='teacher_share')v=v===''?null:parseFloat(v);
    const {error}=await sb.from('students').update({[f]:v}).eq('roll_no',+t.dataset.r);error?toast(error.message,1):toast('Saved ✓')}
  else if(c==='th'){const f=t.dataset.f;let v=t.value;if(f==='share_percent')v=parseFloat(v)||0;else if(f==='fixed_salary')v=parseInt(v)||0;else if(f==='gender')v=v||null;
    const {error}=await sb.from('teachers').update({[f]:v}).eq('id',+t.dataset.id);error?toast(error.message,1):(toast('Saved ✓'),show('teachers'))}
});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.filter){const v=t.value.toLowerCase();document.querySelectorAll(t.dataset.filter).forEach(c=>c.style.display=c.dataset.s.includes(v)?'':'none')}});
boot();
