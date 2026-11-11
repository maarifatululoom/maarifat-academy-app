// Fees tab: editable amounts, combined family fee, reminder queue, printable receipts. Also the teacher's own "My earnings" tab.
let DUE=5,BRAND='Maarifat-ul-Uloom Academy';   // set from the Settings tab (extra.js applies them)
const PCSS='@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:14px/1.5 Arial,Helvetica,sans-serif;color:#1b2440;margin:0}.pg{border:3px double #d4a84b;border-radius:10px;padding:22px 26px}.hd{display:flex;align-items:center;gap:14px;border-bottom:2px solid #d4a84b;padding-bottom:12px;margin-bottom:14px}.hd img{width:70px;height:70px;border-radius:50%}.hd h1{margin:0;font:700 20px Georgia,serif}.hd small{color:#6b7289;letter-spacing:1.5px;font-size:10px}h2{text-align:center;letter-spacing:3px;margin:8px 0 14px;font-size:17px}table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #d9deea;padding:7px 10px;text-align:left}th{background:#f6f0e3;width:34%}.amt{font-size:22px;font-weight:700;color:#146c43}.sg{display:flex;justify-content:space-between;margin-top:46px;font-size:12px;color:#6b7289}.sg div{border-top:1px solid #1b2440;padding-top:4px;min-width:150px;text-align:center}.ft{margin-top:18px;text-align:center;color:#6b7289;font-size:11px}';
function printDoc(title,body){const w=window.open('','_blank');if(!w){toast('Please allow pop-ups to print',1);return null}
  w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title><style>'+PCSS+'</style></head><body>'+body+'<scr'+'ipt>onload=function(){setTimeout(function(){print()},500)}</scr'+'ipt></body></html>');w.document.close();return w}
const HDR=()=>'<div class="hd"><img src="'+(document.querySelector('.lgD')||{}).src+'" alt=""><div><h1>'+esc(BRAND)+'</h1><small>QURANIC EDUCATION · MODERN SKILLS · BRIGHT FUTURE</small></div></div>';
V.fees=async()=>{
  const m=S.fm||(S.fm=today().slice(0,7)),own=me.role==='owner';
  const [f,act]=await Promise.all([
    q(sb.from('fees').select('*,students(name,family_id,families(guardian_name,whatsapp,fee_mode))').eq('month',m).order('roll_no')),
    own?q(sb.from('students').select('roll_no,name,family_id,monthly_fee,families(guardian_name,fee_mode,combined_fee)').eq('status','Active').order('roll_no')):Promise.resolve([])]);
  const paid=sum(f.filter(x=>x.status==='Paid')),due=sum(f.filter(x=>x.status!=='Paid'));
  const G={};
  f.forEach(x=>{const s=x.students||{},fm=s.families||{};if(fm.fee_mode==='combined')(G[s.family_id]=G[s.family_id]||[]).push(x)});
  const inG=new Set();
  Object.keys(G).forEach(id=>{if(G[id].length>1)G[id].forEach(x=>inG.add(x.roll_no));else delete G[id]});
  const bd=(s,p)=>`<span class="badge ${esc(s)}">${esc(s)}${p?' · '+esc(p):''}</span>`;
  const wl=(ph,t)=>`https://wa.me/${wa(ph)}?text=${encodeURIComponent(t)}`;
  const lk=(h,t)=>`<a class="btn sm" style="text-decoration:none;display:inline-block" href="${h}" target="_blank" rel="noopener">${t}</a>`;
  const pr=r=>`<button class="btn sm" data-act="frcpt" data-rs="${r}">🧾 Print receipt</button>`;
  const REM=(n,a)=>'Assalamu alaikum! '+n+' ki '+m+' ki fees '+rs(a)+' abhi baqi hai. Meherbani karke '+DUE+' tareekh tak jama karwa dein. JazakAllah. - '+BRAND;
  const RCP=(n,a)=>'Assalamu alaikum! '+n+' ki '+m+' ki fees '+rs(a)+' mausool ho gayi hai. JazakAllah Khair. - '+BRAND;
  const one=x=>{const s=x.students||{},fm=s.families||{},p=x.status==='Paid';
    return `<div class="card"><div class="rowx"><span><b>${esc(s.name)}</b> <small class="mut">#${x.roll_no} · ${esc(fm.guardian_name||'')}</small></span>${bd(x.status,x.paid_on)}</div><div class="rowx"><span>`+
    (p?`<b>${rs(x.amount)}</b>`:`<input type="number" min="0" style="width:130px" data-chg="famt" data-r="${x.roll_no}" value="${x.amount}" title="Edit amount">`)+'</span><span>'+
    (p?`<button class="btn sm red" data-act="funpay" data-r="${x.roll_no}">Mark unpaid</button>`+pr(x.roll_no)+lk(wl(fm.whatsapp,RCP(s.name||'',x.amount)),'Send receipt'):`<button class="btn sm grn" data-act="fpay" data-r="${x.roll_no}">Mark paid</button>`+lk(wl(fm.whatsapp,REM(s.name||'',x.amount)),'WhatsApp reminder'))+'</span></div></div>'};
  const grp=(id,rows)=>{const s0=rows[0].students||{},fm=s0.families||{},tot=sum(rows),all=rows.every(x=>x.status==='Paid'),rolls=rows.map(x=>x.roll_no).join(','),names=rows.map(x=>(x.students||{}).name).join(', ');
    return `<div class="card" style="border-color:var(--gold)"><div class="rowx"><span><b>👨‍👩‍👧 ${esc(fm.guardian_name||'')}</b> <span class="badge">One combined fee</span></span>${bd(all?'Paid':'Unpaid')}</div><div class="mut">${esc(names)}</div><div class="rowx"><span>`+
    (all?`<b>${rs(tot)}</b>`:`<input type="number" min="0" style="width:140px" data-chg="fgrp" data-fam="${esc(id)}" value="${tot}" title="Edit total"> <small class="mut">total for ${rows.length} children</small>`)+'</span><span>'+
    (all?`<button class="btn sm red" data-act="fgunpay" data-rs="${rolls}">Mark all unpaid</button>`+pr(rolls)+lk(wl(fm.whatsapp,RCP(names,tot)),'Send receipt'):`<button class="btn sm grn" data-act="fgpay" data-rs="${rolls}">Mark all paid</button>`+lk(wl(fm.whatsapp,REM(names,tot)),'WhatsApp reminder'))+'</span></div></div>'};
  const D={};
  f.filter(x=>x.status!=='Paid').forEach(x=>{const s=x.students||{},fm=s.families||{},id=s.family_id;const d=D[id]=D[id]||{g:fm.guardian_name||'',w:fm.whatsapp,n:[],t:0};d.n.push(s.name);d.t+=x.amount});
  const dueIds=Object.keys(D).filter(id=>D[id].t>0),SENT=JSON.parse(sessionStorage.getItem('sentRem')||'{}'),sentN=dueIds.filter(id=>SENT[m+':'+id]).length;
  const remBox=dueIds.length?`<button class="btn" data-act="frem">📣 Remind all unpaid (${dueIds.length} families · ${rs(due)})</button><div id="rem" class="card hide"><div class="mut" id="remInfo">${sentN} of ${dueIds.length} sent. Tap "Send on WhatsApp" for each family; WhatsApp opens with the message ready, you only press send.</div>`+
    dueIds.map(id=>{const d=D[id],names=d.n.join(', '),done=!!SENT[m+':'+id];
      return `<div class="rowx rem-item" style="padding:8px 0;border-bottom:1px dashed var(--line);opacity:${done?.55:1}"><span><b>${esc(d.g)}</b><div class="mut">${esc(names)} · ${rs(d.t)}</div></span><a class="btn sm ${done?'':'grn'}" style="text-decoration:none" data-act="fsent" data-k="${esc(id)}" href="${wl(d.w,'Assalamu alaikum '+d.g+'! '+REM(names,d.t).replace('Assalamu alaikum! ',''))}" target="_blank" rel="noopener">${done?'Sent ✓ (send again)':'Send on WhatsApp'}</a></div>`}).join('')+'</div>':'';
  const FP={};act.forEach(s=>(FP[s.family_id]=FP[s.family_id]||[]).push(s));
  const plans=Object.keys(FP).filter(id=>FP[id].length>1);
  const list=[...Object.keys(G).map(id=>grp(id,G[id])),...f.filter(x=>!inG.has(x.roll_no)).map(one)];
  $('view').innerHTML=`<h2>Fees</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="fm"><button class="btn" data-act="fcreate">Create fee rows for ${m}</button><div class="mut">Edit a fee directly in its box and the change saves automatically. Paid fees are locked: press "Mark unpaid" first.</div></div><div class="kpis">${kpi('Collected',rs(paid))}${kpi('Pending',rs(due))}${kpi('Total',rs(paid+due))}</div>`+remBox+
  (list.length?list.join(''):'<div class="card">No fee rows for this month. Tap "Create fee rows".</div>')+
  (own&&plans.length?'<h2>Family fee plans</h2><div class="card mut">For families with more than one child you can set <b>one combined fee</b>. Enter the total once: it is split between the children automatically, shown as one card here, and paid with one tap. Future months follow the plan.</div>'+plans.map(id=>{const k=FP[id],fm=k[0].families||{},c=fm.fee_mode==='combined',tot=fm.combined_fee==null?k.reduce((n,s)=>n+(s.monthly_fee||0),0):fm.combined_fee;
    return `<div class="card"><b>${esc(fm.guardian_name||'')}</b><div class="mut">${esc(k.map(s=>s.name).join(', '))}</div><div class="g2"><select class="pm"><option value="separate"${c?'':' selected'}>Separate fee for each child</option><option value="combined"${c?' selected':''}>One combined fee</option></select><input type="number" min="0" class="pt" value="${tot}" placeholder="Total fee (Rs.)"></div><button class="btn sm" data-act="fplan" data-fam="${esc(id)}">Save plan</button></div>`}).join(''):'');
};

// ---- Teacher: My earnings (only their own students and payments) ----
TABS.teacher.push(['earnings','My earnings']);
V.earnings=async()=>{
  const m=S.em||(S.em=today().slice(0,7));
  const r=await q(sb.rpc('my_earnings',{p_month:m}));
  if(!r){$('view').innerHTML='<h2>My earnings</h2><div class="card">No teacher profile is linked to your account yet. Please ask the owner.</div>';return}
  const n2=x=>rs(Math.round(Number(x||0)*100)/100),pt=r.pay_type;
  const how=pt==='share'?'You receive <b>'+r.share_percent+'%</b> of the fees collected from your students.':pt==='fixed'?'You receive a <b>fixed salary</b> of '+rs(r.fixed_salary)+' per month.':'You receive a fixed salary of <b>'+rs(r.fixed_salary)+'</b> plus <b>'+r.share_percent+'%</b> of the fees collected from your students.';
  const st=r.students||[];
  $('view').innerHTML=`<h2>My earnings</h2><div class="card"><label>Month</label><input type="month" value="${m}" data-chg="em"><div class="mut" style="margin-top:8px">${how} Your share is counted only on fees that are marked <b>Paid</b>.</div></div>`+
  `<div class="kpis">${kpi('Students',st.length)}${kpi('Your share (fees)',rs(r.share_total))}${kpi('Fixed salary',rs(r.fixed_part))}${kpi('Received so far',rs(r.paid_out))}${kpi('Balance to receive',rs(r.balance))}</div>`+
  `<div class="card"><b>Your students</b>`+(st.length?st.map(s=>`<div class="ln"><span>${esc(s.name)} <small class="mut">#${s.roll_no}</small></span><span>${s.status==='Paid'?`${rs(s.fee)} · ${s.pct}% = <b>${n2(s.share)}</b>`:(s.fee==null?'No fee row yet':'Fee pending')}</span></div>`).join(''):'<div class="mut">No students are assigned to you yet.</div>')+'</div>'+
  `<div class="card"><b>Summary</b>${ln('Share from fees',rs(r.share_total))}${ln('Fixed salary',rs(r.fixed_part))}${ln('Bonus','+ '+rs(r.bonus))}${ln('Deduction','- '+rs(r.deduction))}${ln('Already received / advance','- '+rs(r.paid_out))}${ln('Balance to receive',rs(r.balance),1)}</div>`+
  `<div class="card"><b>Payments &amp; adjustments</b>`+((r.ledger||[]).length?r.ledger.map(p=>`<div class="ln"><span>${esc(p.date)} · ${esc(p.type)}${p.note?' · '+esc(p.note):''}</span><span>${rs(p.amount)}</span></div>`).join(''):'<div class="mut">Nothing recorded this month.</div>')+'</div>';
};

Object.assign(acts,{
  frem:()=>{const r=document.getElementById('rem');if(r)r.classList.toggle('hide')},
  fsent:(d,el)=>{const m=S.fm,SENT=JSON.parse(sessionStorage.getItem('sentRem')||'{}');SENT[m+':'+d.k]=1;sessionStorage.setItem('sentRem',JSON.stringify(SENT));
    const row=el.closest('.rem-item');if(row)row.style.opacity='.55';el.classList.remove('grn');el.textContent='Sent ✓ (send again)';
    const all=document.querySelectorAll('.rem-item'),n=[...all].filter(r=>r.style.opacity==='0.55').length,i=document.getElementById('remInfo');if(i)i.textContent=n+' of '+all.length+' sent. Tap "Send on WhatsApp" for each family; WhatsApp opens with the message ready, you only press send.'},
  frcpt:async d=>{const rolls=d.rs.split(',').map(Number),month=S.fm;
    const {data,error}=await sb.from('fees').select('*,students(name,families(guardian_name,whatsapp))').eq('month',month).in('roll_no',rolls).order('roll_no');
    if(error||!data||!data.length)return toast(error?error.message:'No fee record found',1);
    if(data.some(x=>x.status!=='Paid'))return toast('Receipt is only for paid fees',1);
    const g=((data[0].students||{}).families||{}).guardian_name||'',tot=sum(data),pd=data.map(x=>x.paid_on).filter(Boolean).sort().pop()||today(),no='R-'+month.replace('-','')+'-'+rolls[0];
    const lines=data.length>1?data.map(x=>'<tr><th>'+esc((x.students||{}).name)+'</th><td>'+rs(x.amount)+'</td></tr>').join(''):'';
    printDoc('Fee receipt '+no,'<div class="pg">'+HDR()+'<h2>FEE RECEIPT</h2><table><tr><th>Receipt No</th><td>'+esc(no)+'</td></tr><tr><th>Date</th><td>'+esc(pd)+'</td></tr><tr><th>Received from</th><td>'+esc(g)+'</td></tr><tr><th>Student(s)</th><td>'+esc(data.map(x=>(x.students||{}).name).join(', '))+'</td></tr><tr><th>Fee for month</th><td>'+esc(month)+'</td></tr>'+lines+'<tr><th>Total received</th><td class="amt">'+rs(tot)+'</td></tr></table><p>Received with thanks. JazakAllah Khair.</p><div class="sg"><div>Parent / Guardian</div><div>Academy stamp &amp; signature</div></div><div class="ft">Computer generated receipt · '+esc(BRAND)+'</div></div>')},
  fgpay:async d=>{const {error}=await sb.from('fees').update({status:'Paid',paid_on:today()}).eq('month',S.fm).in('roll_no',d.rs.split(',').map(Number));error?toast(error.message,1):(toast('Family fee marked paid ✓'),show('fees'))},
  fgunpay:async d=>{const {error}=await sb.from('fees').update({status:'Unpaid',paid_on:null}).eq('month',S.fm).in('roll_no',d.rs.split(',').map(Number));error?toast(error.message,1):(toast('Marked unpaid'),show('fees'))},
  fplan:async(d,el)=>{const c=el.closest('.card'),mode=c.querySelector('.pm').value,tot=parseInt(c.querySelector('.pt').value);
    if(mode==='combined'&&!(tot>=0))return toast('Enter the total fee',1);
    const {error}=await sb.rpc('apply_family_fee',{p_family:d.fam,p_mode:mode,p_total:mode==='combined'?tot:null,p_month:S.fm});error?toast(error.message,1):(toast('Fee plan saved ✓ (unpaid fees of '+S.fm+' updated)'),show('fees'))}
});
document.addEventListener('change',async e=>{
  const t=e.target,c=t.dataset.chg;
  if(c==='famt'){const n=parseInt(t.value);if(!(n>=0))return toast('Invalid amount',1);const {error}=await sb.from('fees').update({amount:n}).eq('month',S.fm).eq('roll_no',+t.dataset.r).eq('status','Unpaid');error?toast(error.message,1):(toast('Fee updated ✓'),show('fees'))}
  else if(c==='fgrp'){const n=parseInt(t.value);if(!(n>=0))return toast('Invalid amount',1);const {error}=await sb.rpc('set_family_month_total',{p_family:t.dataset.fam,p_month:S.fm,p_total:n});error?toast(error.message,1):(toast('Family fee updated ✓'),show('fees'))}
  else if(c==='em'){S.em=t.value;show('earnings')}
});
