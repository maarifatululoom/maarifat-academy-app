// Extra Academy App features (loaded after fees.js): absence watch, settings, owner monthly report, audit log.
const DEMO_MODE=/[?&]demo\b/.test(location.search);
TABS.owner.push(['absence','Absence'],['report','Report']);
if(!DEMO_MODE)TABS.owner.push(['settings','Settings'],['audit','Audit log']);
TABS.teacher.push(['absence','Absence']);

// ---------- Branding / settings shared with the other apps ----------
function applyBrand(s){
  if(s.due_day)DUE=+s.due_day;
  if(s.academy_name){BRAND=s.academy_name;document.querySelectorAll('h1').forEach(e=>e.textContent=BRAND);document.title=document.title.replace('Maarifat-ul-Uloom Academy',BRAND)}
  if(s.logo_dark_url)document.querySelectorAll('.lgD').forEach(i=>i.src=s.logo_dark_url);
  if(s.logo_light_url)document.querySelectorAll('.lgL').forEach(i=>i.src=s.logo_light_url);
}
if(!DEMO_MODE)sb.rpc('public_settings').then(r=>{if(r&&r.data)applyBrand(r.data)});

// ---------- Absence watch ----------
V.absence=async()=>{
  if(!S.amin){const r=await sb.from('settings').select('*').eq('key','absence_alert_days').maybeSingle();const v=r&&r.data?Number(r.data.value):3;S.amin=v>0?v:3}
  const min=S.amin;
  const since=new Date(Date.now()+18e6-45*864e5).toISOString().slice(0,10);
  const [st,at]=await Promise.all([
    q(sb.from('students').select('roll_no,name,families(guardian_name,whatsapp)').eq('status','Active').order('roll_no')),
    q(sb.from('attendance').select('roll_no,date,status').gte('date',since).order('date',{ascending:false}))]);
  const by={};at.forEach(a=>(by[a.roll_no]=by[a.roll_no]||[]).push(a));
  const out=[];
  st.forEach(s=>{const rows=by[s.roll_no]||[],k=[];for(const a of rows){if(a.status==='Present')break;k.push(a)}
    if(k.length>=min){const lp=rows.find(a=>a.status==='Present');out.push({s,n:k.length,since:k[k.length-1].date,ab:k.filter(a=>a.status==='Absent').length,lv:k.filter(a=>a.status==='Leave').length,lp:lp?lp.date:null})}});
  out.sort((a,b)=>b.n-a.n);
  $('view').innerHTML=`<h2>Absence watch</h2>`+(me.role==='teacher'?'<div class="card mut">Showing only the students assigned to you.</div>':'')+
  `<div class="card"><label>Show students who have not attended for at least</label><select data-chg="amin">${[1,2,3,4,5,7,10].map(n=>`<option value="${n}"${n===min?' selected':''}>${n} class day${n>1?'s':''} in a row</option>`).join('')}</select><div class="mut" style="margin-top:8px">Counted from the last day the student was marked <b>Present</b>.${me.role==='owner'&&!DEMO_MODE?' The automatic notification 🔔 uses the number you set in the <b>Settings</b> tab.':''}</div></div>`+
  (out.length?out.map(o=>{const f=o.s.families||{},msg='Assalamu alaikum '+(f.guardian_name||'')+'! '+o.s.name+' pichhle '+o.n+' class din se hazir nahi hai. Khairiyat? Agar koi masla ho to meherbani karke bata dein. JazakAllah. - '+BRAND;
    return `<div class="card"><div class="rowx"><span><b>${esc(o.s.name)}</b> <small class="mut">#${o.s.roll_no} · ${esc(f.guardian_name||'')}</small></span><span class="badge Unpaid">${o.n} day${o.n>1?'s':''}</span></div><div class="mut">${o.ab} absent · ${o.lv} leave · since ${esc(o.since)} · last present ${esc(o.lp||'not in last 45 days')}</div>`+
    (f.whatsapp?`<a class="btn sm grn" style="text-decoration:none;display:inline-block" href="https://wa.me/${wa(f.whatsapp)}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp parent</a>`:'')+'</div>'}).join(''):'<div class="card">✅ No student has missed '+min+' class day'+(min>1?'s':'')+' in a row.</div>');
};
const _nOpen=acts.nOpen;
acts.nOpen=async d=>{await _nOpen(d);if(d.type==='long_absence'&&TABS[me.role].some(x=>x[0]==='absence'))show('absence')};

// ---------- Settings (owner) ----------
async function upBrand(file,kind){
  if(!file)return null;
  if(file.size>1048576)throw new Error('Logo must be smaller than 1 MB');
  if(!/^image\/(webp|png|jpeg)$/.test(file.type))throw new Error('Logo must be a PNG, JPG or WebP picture');
  const ext=file.type==='image/webp'?'webp':file.type==='image/png'?'png':'jpg',path=kind+'-'+Date.now()+'.'+ext;
  const {error}=await sb.storage.from('branding').upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  return sb.storage.from('branding').getPublicUrl(path).data.publicUrl;
}
V.settings=async()=>{
  const rows=await q(sb.from('settings').select('*'));
  const g=(k,d)=>{const r=rows.find(x=>x.key===k);return r&&r.value!=null?r.value:d};
  const d=Number(g('absence_alert_days',3)),l=!!g('absence_count_leave',true);
  const logo=(u,t)=>u?`<img src="${esc(u)}" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);background:#fff"><div class="mut">${t} (current)</div>`:`<div class="mut">${t}: default logo</div>`;
  $('view').innerHTML=`<h2>Settings</h2>`+
  `<div class="card"><b>Fees &amp; discounts</b><div class="mut">Used by the Admission Form for <b>new</b> admissions. Students who already joined keep their current fee (change it in the Students or Fees tab).</div>`+
  `<label>Monthly fee per student (Rs.)</label><input type="number" id="sfb" min="0" max="1000000" value="${Number(g('fee_base',4000))}">`+
  `<div class="g2"><div><label>Discount when 2 children join (%)</label><input type="number" id="sd2" min="0" max="100" value="${Number(g('discount_2',20))}"></div><div><label>Discount for 3 or more (%)</label><input type="number" id="sd3" min="0" max="100" value="${Number(g('discount_3',30))}"></div></div>`+
  `<label>Fees must be paid by this day of the month</label><input type="number" id="sdd" min="1" max="28" value="${Number(g('due_day',5))}"></div>`+
  `<div class="card"><b>Academy name &amp; logo</b><div class="mut">Shown in all three apps (admission form, parents app, this app) and on receipts. Logo: square picture, PNG/JPG/WebP, under 1 MB.</div>`+
  `<label>Academy name</label><input id="san" maxlength="80" value="${esc(g('academy_name','Maarifat-ul-Uloom Academy'))}">`+
  `<div class="g2"><div><label>Logo for LIGHT theme (dark / navy logo)</label>${logo(g('logo_dark_url',null),'Light theme')}<input type="file" id="sld" accept="image/png,image/jpeg,image/webp" style="height:auto;padding:8px"></div><div><label>Logo for DARK theme (light / white logo)</label>${logo(g('logo_light_url',null),'Dark theme')}<input type="file" id="slf" accept="image/png,image/jpeg,image/webp" style="height:auto;padding:8px"></div></div></div>`+
  `<div class="card"><b>Absence alert</b><div class="mut">The owner gets a notification when a student has not attended for this many class days in a row (counted from the last Present day).</div>`+
  `<label>Alert after</label><select id="sd">${[0,1,2,3,4,5,7,10].map(n=>`<option value="${n}"${n===d?' selected':''}>${n===0?'Off (no alerts)':n+' class day'+(n>1?'s':'')}</option>`).join('')}</select>`+
  `<label>Count "Leave" days as not attended?</label><select id="sl"><option value="yes"${l?' selected':''}>Yes: Absent and Leave both count</option><option value="no"${l?'':' selected'}>No: only Absent counts (Leave is ignored)</option></select></div>`+
  `<button class="btn full" data-act="setSave">Save all settings</button>`;
};
Object.assign(acts,{
  setSave:async()=>{
    try{
      const n=id=>parseInt($(id).value),fb=n('sfb'),d2=n('sd2'),d3=n('sd3'),dd=n('sdd'),name=$('san').value.trim();
      if(!(fb>=0)||!(d2>=0&&d2<=100)||!(d3>=0&&d3<=100))return toast('Please check the fee and discount numbers',1);
      if(!(dd>=1&&dd<=28))return toast('Due day must be between 1 and 28',1);
      if(!name)return toast('Please write the academy name',1);
      const t=new Date().toISOString(),up=[{key:'absence_alert_days',value:n('sd')},{key:'absence_count_leave',value:$('sl').value==='yes'},{key:'fee_base',value:fb},{key:'discount_2',value:d2},{key:'discount_3',value:d3},{key:'due_day',value:dd},{key:'academy_name',value:name}];
      const a=await upBrand($('sld').files[0],'logo-light-theme'),b=await upBrand($('slf').files[0],'logo-dark-theme');
      if(a)up.push({key:'logo_dark_url',value:a});
      if(b)up.push({key:'logo_light_url',value:b});
      const {error}=await sb.from('settings').upsert(up.map(x=>Object.assign(x,{updated_at:t})),{onConflict:'key'});
      if(error)throw error;
      const o={due_day:dd,academy_name:name};if(a)o.logo_dark_url=a;if(b)o.logo_light_url=b;applyBrand(o);
      toast('Settings saved ✓');show('settings');
    }catch(e){toast(e.message||String(e),1)}
  }
});

// ---------- Owner monthly report ----------
V.report=async()=>{
  const m=S.rm||(S.rm=today().slice(0,7)),[s,e]=mr(m);
  const c=async st=>{const r=await sb.from('attendance').select('roll_no',{count:'exact',head:true}).eq('status',st).gte('date',s).lt('date',e);return r.count||0};
  const [fees,inc,exp,pay,stu,aP,aA,aL,exm,ts]=await Promise.all([
    q(sb.from('fees').select('amount,status,students(name,families(guardian_name))').eq('month',m)),
    q(sb.from('fees').select('amount').eq('status','Paid').gte('paid_on',s).lt('paid_on',e)),
    q(sb.from('expenses').select('*').gte('date',s).lt('date',e)),
    q(sb.from('teacher_payments').select('amount').in('type',['Payment','Advance']).gte('date',s).lt('date',e)),
    q(sb.from('students').select('status,admission_date')),
    c('Present'),c('Absent'),c('Leave'),
    q(sb.from('exam_results').select('result').gte('exam_date',s).lt('exam_date',e)),
    q(sb.rpc('teacher_statement',{p_month:m}))]);
  const billed=sum(fees),coll=sum(fees.filter(x=>x.status==='Paid')),pend=billed-coll,income=sum(inc),exps=sum(exp),pout=sum(pay),net=income-exps-pout;
  const att=aP+aA+aL,pct=att?Math.round(aP*100/att):0,cp=billed?Math.round(coll*100/billed):0;
  const act_=stu.filter(x=>x.status==='Active').length,newA=stu.filter(x=>x.admission_date&&x.admission_date>=s&&x.admission_date<e).length,pen=stu.filter(x=>x.status==='Pending').length,left=stu.filter(x=>x.status==='Left').length;
  const cat={};exp.forEach(x=>cat[x.category]=(cat[x.category]||0)+x.amount);
  const U={};fees.filter(x=>x.status!=='Paid').forEach(x=>{const f=(x.students||{}).families||{},k=f.guardian_name||'?';const u=U[k]=U[k]||{n:[],t:0};u.n.push((x.students||{}).name);u.t+=x.amount});
  const ex={n:exm.length,p:exm.filter(x=>x.result==='Pass').length};
  S.rep={m,billed,coll,pend,income,exps,pout,net,att,aP,aA,aL,pct,cp,act_,newA,pen,left,cat,U,ex,ts};
  const exr=Object.keys(cat);
  $('view').innerHTML=`<h2>Monthly report</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="rpm"><button class="btn" data-act="rprint">🖨️ Print / PDF</button></div>`+
  `<div class="kpis">${kpi('Income (fees received)',rs(income))}${kpi('Other expenses',rs(exps))}${kpi('Teacher payouts',rs(pout))}${kpi(net>=0?'Net profit':'Net loss',rs(Math.abs(net)))}${kpi('Fees collected',cp+'%')}${kpi('Attendance',att?pct+'%':'-')}</div>`+
  `<div class="card"><b>Fees of ${m}</b>${ln('Billed',rs(billed))}${ln('Collected',rs(coll))}${ln('Pending',rs(pend))}${ln('Collection',cp+'%')}</div>`+
  `<div class="card"><b>Students</b>${ln('Active students',act_)}${ln('New admissions this month',newA)}${ln('Admissions waiting approval',pen)}${ln('Left (total)',left)}</div>`+
  `<div class="card"><b>Attendance</b>${ln('Present',aP)}${ln('Absent',aA)}${ln('Leave',aL)}${ln('Attendance %',att?pct+'%':'-')}</div>`+
  `<div class="card"><b>Exams</b>${ln('Results recorded',ex.n)}${ln('Passed',ex.n?ex.p+' ('+Math.round(ex.p*100/ex.n)+'%)':'-')}</div>`+
  `<div class="card"><b>Expenses by category</b>`+(exr.length?exr.map(k=>ln(k,rs(cat[k]))).join('')+ln('Total',rs(exps),1):'<div class="mut">No expenses recorded.</div>')+'</div>'+
  `<div class="card"><b>Teachers</b>`+(ts.length?ts.map(t=>ln(t.t_name+' ('+t.t_pay_type+')','earned '+rs(t.share_earned+t.fixed_part+t.bonus-t.deduction)+' · paid '+rs(t.paid_out)+' · due '+rs(t.balance))).join(''):'<div class="mut">No teachers.</div>')+'</div>'+
  `<div class="card"><b>Fees still unpaid</b>`+(Object.keys(U).length?Object.keys(U).map(k=>ln(k+' ('+U[k].n.join(', ')+')',rs(U[k].t))).join(''):'<div class="mut">Everyone has paid 🎉</div>')+'</div>';
};
Object.assign(acts,{
  rprint:()=>{const R=S.rep;if(!R)return;
    const T=rows=>'<table>'+rows.map(r=>'<tr><th>'+esc(r[0])+'</th><td>'+esc(r[1])+'</td></tr>').join('')+'</table>',H=t=>'<div class="sec">'+esc(t)+'</div>';
    const cats=Object.keys(R.cat),us=Object.keys(R.U);
    printDoc('Monthly report '+R.m,'<style>.sec{background:#f6f0e3;padding:6px 10px;font-weight:700;margin-top:14px;border-left:4px solid #d4a84b}.t5 th{width:auto}.t5 td,.t5 th{font-size:12px}</style><div class="pg">'+HDR()+'<h2>MONTHLY REPORT</h2><div style="text-align:center;color:#6b7289">'+esc(R.m)+'</div>'+
      H('Money')+T([['Income (fees received)',rs(R.income)],['Other expenses',rs(R.exps)],['Teacher payouts',rs(R.pout)],[R.net>=0?'Net profit':'Net loss',rs(Math.abs(R.net))]])+
      H('Fees of '+R.m)+T([['Billed',rs(R.billed)],['Collected',rs(R.coll)],['Pending',rs(R.pend)],['Collection',R.cp+'%']])+
      H('Students')+T([['Active students',R.act_],['New admissions this month',R.newA],['Admissions waiting approval',R.pen],['Left (total)',R.left]])+
      H('Attendance')+T([['Present',R.aP],['Absent',R.aA],['Leave',R.aL],['Attendance %',R.att?R.pct+'%':'-']])+
      H('Exams')+T([['Results recorded',R.ex.n],['Passed',R.ex.n?R.ex.p+' ('+Math.round(R.ex.p*100/R.ex.n)+'%)':'-']])+
      H('Expenses by category')+(cats.length?T(cats.map(k=>[k,rs(R.cat[k])])):'<p>No expenses recorded.</p>')+
      H('Teachers')+(R.ts.length?'<table class="t5"><tr><th>Teacher</th><th>Type</th><th>Earned</th><th>Paid</th><th>Due</th></tr>'+R.ts.map(t=>'<tr><td>'+esc(t.t_name)+'</td><td>'+esc(t.t_pay_type)+'</td><td>'+rs(t.share_earned+t.fixed_part+t.bonus-t.deduction)+'</td><td>'+rs(t.paid_out)+'</td><td>'+rs(t.balance)+'</td></tr>').join('')+'</table>':'<p>No teachers.</p>')+
      H('Fees still unpaid')+(us.length?T(us.map(k=>[k+' ('+R.U[k].n.join(', ')+')',rs(R.U[k].t)])):'<p>Everyone has paid.</p>')+
      '<div class="ft">Generated on '+esc(today())+' · '+esc(BRAND)+'</div></div>')}
});

// ---------- Audit log (owner): who changed what and when ----------
const ALBL={students:'Student',fees:'Fee',attendance:'Attendance',exam_results:'Exam result',expenses:'Expense',teachers:'Teacher',teacher_payments:'Teacher payment',settings:'Setting'};
const AACT={INSERT:['Added','Paid'],UPDATE:['Changed','Unpaid'],DELETE:['Deleted','Left']};
let AUD=[];
V.audit=async()=>{
  const F=S.af||(S.af={t:'',a:'',u:'',n:100,h:'1'});
  const [stf,stu,tch]=await Promise.all([q(sb.from('staff').select('user_id,name')),q(sb.from('students').select('roll_no,name')),q(sb.from('teachers').select('id,name'))]);
  let qq=sb.from('audit_log').select('*').order('at',{ascending:false}).limit(400);
  if(F.t)qq=qq.eq('table_name',F.t);if(F.a)qq=qq.eq('action',F.a);if(F.u)qq=qq.eq('user_id',F.u);
  const rows=await q(qq);
  const un={},sn={},tn={};stf.forEach(x=>un[x.user_id]=x.name);stu.forEach(x=>sn[x.roll_no]=x.name);tch.forEach(x=>tn[x.id]=x.name);
  const SKIP=['created_at','updated_at','marked_by','created_by','id'];
  const diff=r=>{const o=r.old_data||{},n=r.new_data||{};return Object.keys(n).filter(k=>!SKIP.includes(k)&&JSON.stringify(o[k])!==JSON.stringify(n[k])).map(k=>[k,o[k],n[k]])};
  const ident=r=>{const d=r.new_data||r.old_data||{};switch(r.table_name){case'students':return(d.name||'')+' #'+d.roll_no;case'fees':return(sn[d.roll_no]||'#'+d.roll_no)+' · '+d.month;case'attendance':return(sn[d.roll_no]||'#'+d.roll_no)+' · '+d.date;case'exam_results':return(sn[d.roll_no]||'#'+d.roll_no)+' · '+d.exam_name;case'expenses':return d.category+' '+rs(d.amount);case'teachers':return d.name;case'teacher_payments':return(tn[d.teacher_id]||'teacher')+' · '+d.type+' '+rs(d.amount)+' · '+d.month;case'settings':return d.key;default:return''}};
  const fmt=v=>v==null?'\u2014':typeof v==='object'?JSON.stringify(v):String(v);
  const tm=r=>new Date(r.at).toLocaleString('en-GB',{timeZone:'Asia/Karachi',dateStyle:'medium',timeStyle:'short'});
  let list=rows.map(r=>({r,d:r.action==='UPDATE'?diff(r):null}));
  if(F.h==='1')list=list.filter(x=>!(x.r.action==='UPDATE'&&x.d.length===0));
  list=list.slice(0,F.n);
  AUD=list.map(x=>{const r=x.r;return[tm(r),un[r.user_id]||(r.user_id?'Unknown user':'System'),AACT[r.action][0],ALBL[r.table_name]||r.table_name,ident(r),(x.d||[]).map(c=>c[0]+': '+fmt(c[1])+' -> '+fmt(c[2])).join('; ')]});
  const opt=(arr,v)=>arr.map(([k,l])=>`<option value="${esc(k)}"${String(v)===String(k)?' selected':''}>${esc(l)}</option>`).join('');
  $('view').innerHTML=`<h2>Audit log</h2><div class="card"><div class="mut">Every change to students, fees, attendance, exams, expenses, teachers, payments and settings is recorded here automatically. Nobody can edit or delete this list from the app.</div>`+
  `<div class="g2"><div><label>What</label><select data-chg="af" data-k="t">${opt([['','All'],...Object.keys(ALBL).map(k=>[k,ALBL[k]])],F.t)}</select></div><div><label>Action</label><select data-chg="af" data-k="a">${opt([['','All'],['INSERT','Added'],['UPDATE','Changed'],['DELETE','Deleted']],F.a)}</select></div></div>`+
  `<div class="g2"><div><label>Who</label><select data-chg="af" data-k="u">${opt([['','Everyone'],...stf.map(x=>[x.user_id,x.name])],F.u)}</select></div><div><label>Show</label><select data-chg="af" data-k="n">${opt([[50,'50 entries'],[100,'100 entries'],[200,'200 entries']],F.n)}</select></div></div>`+
  `<label>Saves that changed nothing</label><select data-chg="af" data-k="h">${opt([['1','Hide them'],['0','Show them']],F.h)}</select><button class="btn" data-act="auditCsv">Download (CSV)</button></div>`+
  (list.length?list.map(x=>{const r=x.r,a=AACT[r.action],snap=r.action==='UPDATE'?null:Object.entries(r.action==='INSERT'?r.new_data:r.old_data||{}).filter(([k,v])=>!SKIP.includes(k)&&v!=null).slice(0,7);
    return `<div class="card"><div class="rowx"><span><b>${esc(ALBL[r.table_name]||r.table_name)}</b> · ${esc(ident(r))}</span><span class="badge ${a[1]}">${a[0]}</span></div><div class="mut">${esc(tm(r))} · by <b>${esc(un[r.user_id]||(r.user_id?'Unknown user':'System (automatic)'))}</b></div>`+
    (x.d?x.d.slice(0,8).map(c=>`<div class="ln"><span>${esc(c[0])}</span><span>${esc(fmt(c[1]))} → <b>${esc(fmt(c[2]))}</b></span></div>`).join(''):'')+
    (snap?`<div class="mut">${snap.map(([k,v])=>esc(k)+': '+esc(fmt(v))).join(' · ')}</div>`:'')+'</div>'}).join(''):'<div class="card">No entries for this filter.</div>');
};
Object.assign(acts,{auditCsv:()=>csv('audit-log.csv',[['Time','Who','Action','What','Record','Changes']].concat(AUD))});
document.addEventListener('change',e=>{const t=e.target,c=t.dataset.chg;
  if(c==='amin'){S.amin=+t.value;show('absence')}
  else if(c==='rpm'){S.rm=t.value;show('report')}
  else if(c==='af'){const F=S.af||(S.af={t:'',a:'',u:'',n:100,h:'1'});F[t.dataset.k]=t.dataset.k==='n'?+t.value:t.value;show('audit')}});
