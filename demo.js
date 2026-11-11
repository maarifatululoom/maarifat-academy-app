// DEMO MODE: the whole Academy App runs on made-up sample data inside the visitor's browser.
// It never connects to the real database, so no real student / teacher / fee data can appear.
(function(){
const K=()=>new Date(Date.now()+18e6),iso=d=>d.toISOString().slice(0,10),dAgo=n=>iso(new Date(K().getTime()-n*864e5));
const todayS=iso(K()),ym=todayS.slice(0,7);
const addM=n=>{const d=K();return iso(new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1))).slice(0,7)};
const mths=[addM(-2),addM(-1),ym];
const ROLE=sessionStorage.getItem('demoRole')||'owner';
const UID={owner:'u-owner',teacher:'u-t1',accountant:'u-acc'}[ROLE]||'u-owner';
const now=()=>new Date().toISOString();
const DB={};
DB.families=[['F1','Ahmed Khan','0300-0000001'],['F2','Bilal Hussain','0300-0000002'],['F3','Saima Noor','0300-0000003'],['F4','Usman Ali','0300-0000004'],['F5','Farah Iqbal','0300-0000005'],['F6','Zubair Shah','0300-0000006']].map(([id,n,w],i)=>({family_id:id,guardian_name:n,whatsapp:w,emergency_contact:'0300-0000099',off_days:'Friday',message:id==='F6'?'Please tell me the class timings.':null,fee_mode:id==='F1'?'combined':'separate',combined_fee:id==='F1'?9000:null}));
DB.students=[
[101,'Hamza Khan','F1','Noorani Qaida',3000,1,'Male','Afternoon','Active'],[102,'Maryam Khan','F1','Nazra Quran',3000,2,'Female','Afternoon','Active'],[103,'Yusuf Khan','F1','Noorani Qaida',3000,1,'Male','Afternoon','Active'],
[104,'Ayesha Hussain','F2','Hifz-ul-Quran',4000,2,'Female','Morning','Active'],[105,'Zainab Noor','F3','Noorani Qaida',3200,2,'Female','Afternoon','Active'],[106,'Hassan Noor','F3','Nazra Quran',3200,1,'Male','Afternoon','Active'],
[107,'Ibrahim Ali','F4','Tajweed',4000,3,'Male','Evening','Active'],[108,'Fatima Iqbal','F5','Noorani Qaida',2800,2,'Female','Morning','Active'],[109,'Omar Iqbal','F5','Nazra Quran',2800,null,'Male','Morning','Active'],
[110,'Amna Shah','F6','Noorani Qaida',3200,null,'Female','Afternoon','Pending'],[111,'Talha Shah','F6','Noorani Qaida',3200,null,'Male','Afternoon','Pending']
].map(a=>({roll_no:a[0],name:a[1],family_id:a[2],level:a[3],monthly_fee:a[4],teacher_id:a[5],teacher_share:a[0]===106?60:null,gender:a[6],timing:a[7],exact_time:'16:00',status:a[8],dob:a[8]==='Pending'?'2017-03-12':'2016-05-20',fee_plan:a[8]==='Pending'?'20% discount (2 students)':null}));
DB.teachers=[
{id:1,name:'Ustaz Imran',gender:'Male',phone:'0300-1000001',pay_type:'share',share_percent:50,fixed_salary:0,active:true,user_id:'u-t1'},
{id:2,name:'Ustazah Hina',gender:'Female',phone:'0300-1000002',pay_type:'share',share_percent:40,fixed_salary:0,active:true,user_id:null},
{id:3,name:'Ustaz Bilal',gender:'Male',phone:'0300-1000003',pay_type:'mixed',share_percent:20,fixed_salary:8000,active:true,user_id:null},
{id:4,name:'Ustazah Sana',gender:'Female',phone:'0300-1000004',pay_type:'share',share_percent:50,fixed_salary:0,active:true,user_id:null}];
DB.staff=[
{user_id:'u-owner',name:'Demo Owner',role:'owner',active:true,created_at:'2026-01-01T00:00:00Z'},
{user_id:'u-t1',name:'Ustaz Imran',role:'teacher',active:true,created_at:'2026-01-02T00:00:00Z'},
{user_id:'u-acc',name:'Demo Accountant',role:'accountant',active:true,created_at:'2026-01-03T00:00:00Z'},
{user_id:'u-p1',name:'Ustazah Maryam (new)',role:'teacher',active:false,created_at:'2026-02-01T00:00:00Z'}];
DB.attendance=[];let aid=1;
DB.students.filter(s=>s.status==='Active').forEach(s=>{for(let i=0;i<14;i++){const dt=dAgo(i);if(new Date(dt+'T00:00:00Z').getUTCDay()===0)continue;const v=(s.roll_no*7+i*3)%10,st=v<7?'Present':v<9?'Leave':'Absent',isQ=s.level==='Noorani Qaida',p=st==='Present',n=(s.roll_no%9)+5+Math.floor((14-i)/3);
DB.attendance.push({id:aid++,date:dt,roll_no:s.roll_no,status:st,level:isQ?'Qaida':s.level,takhti_no:p&&isQ?n:null,para_no:p&&!isQ?n:null,lesson:p?(isQ?'Qaida - Takhti ':'Para ')+n:null,notes:p?'Sabaq acha raha':null})}});
DB.fees=[];
mths.forEach((m,mi)=>DB.students.filter(s=>s.status==='Active').forEach((s,i)=>{const paid=mi<2?(i%5!==2):(i%3!==0),pd=m+'-0'+(2+i%6);DB.fees.push({month:m,roll_no:s.roll_no,amount:s.monthly_fee,status:paid?'Paid':'Unpaid',paid_on:paid?(pd>todayS?todayS:pd):null})}));
DB.exam_results=[[101,'Monthly test',9,42,50,'Pass','Good effort'],[104,'Monthly test',9,47,50,'Pass','Excellent'],[107,'Tajweed test',16,24,50,'Fail','Needs more practice'],[105,'Qaida test',20,38,50,'Pass','']].map((a,i)=>({id:i+1,roll_no:a[0],exam_name:a[1],exam_date:dAgo(a[2]),marks_obtained:a[3],total_marks:a[4],result:a[5],remarks:a[6],created_at:now()}));
DB.expenses=[[ym+'-01','Rent',25000,'Building rent'],[ym+'-03','Utilities',6500,'Electricity and internet'],[mths[1]+'-04','Books & Supplies',3200,'Qaida books'],[mths[1]+'-01','Rent',25000,'Building rent']].map((a,i)=>({id:i+1,date:a[0],category:a[1],amount:a[2],note:a[3]}));
DB.teacher_payments=[{id:1,teacher_id:1,month:ym,date:dAgo(2),type:'Payment',amount:3000,note:'Part payment'},{id:2,teacher_id:2,month:ym,date:dAgo(1),type:'Bonus',amount:1000,note:'Good results'},{id:3,teacher_id:3,month:mths[1],date:mths[1]+'-28',type:'Payment',amount:9000,note:'Last month salary'}];
DB.notifications=[{id:1,type:'new_admission',title:'Naya admission aaya',body:'Zubair Shah ke 2 bache (approval ka intezar)',created_at:now(),audience:['owner']},{id:2,type:'new_staff_request',title:'Naya teacher login request',body:'Ustazah Maryam (new) ne login banaya hai (approval ka intezar)',created_at:now(),audience:['owner']}];
DB.notification_reads=[];
const REL={'students.families':{t:'families',fk:'family_id',pk:'family_id'},'fees.students':{t:'students',fk:'roll_no',pk:'roll_no'},'exam_results.students':{t:'students',fk:'roll_no',pk:'roll_no'},'teacher_payments.teachers':{t:'teachers',fk:'teacher_id',pk:'id'}};
let SEQ=100;
function scoped(t){const a=DB[t]||[];if(ROLE==='teacher'){const my=DB.students.filter(s=>s.teacher_id===1),rs=my.map(s=>s.roll_no),fs=my.map(s=>s.family_id);
  if(t==='students')return my;if(t==='families')return a.filter(f=>fs.includes(f.family_id));if(t==='attendance'||t==='exam_results')return a.filter(r=>rs.includes(r.roll_no));
  if(['fees','teachers','teacher_payments','expenses'].includes(t))return[];if(t==='staff')return a.filter(r=>r.user_id===UID)}
 if(ROLE==='accountant'&&['attendance','exam_results'].includes(t))return[];
 return a}
function parse(s){const out=[];let d=0,cur='';for(const ch of s){if(ch==='('){d++;cur+=ch}else if(ch===')'){d--;cur+=ch}else if(ch===','&&d===0){out.push(cur.trim());cur=''}else cur+=ch}if(cur.trim())out.push(cur.trim());return out.map(k=>{const i=k.indexOf('(');return i<0?{n:k}:{n:k.slice(0,i),sub:k.slice(i+1,k.lastIndexOf(')'))}})}
function proj(r,sel,t){const o={};parse(sel).forEach(c=>{if(c.n==='*')Object.assign(o,r);else if(c.sub!==undefined){const rel=REL[t+'.'+c.n],x=rel&&DB[rel.t].find(y=>y[rel.pk]==r[rel.fk]);o[c.n]=x?proj(x,c.sub,rel.t):null}else o[c.n]=r[c.n]});return o}
const cmp=(a,b)=>a==null?(b==null?0:-1):b==null?1:(a<b?-1:a>b?1:0);
function fill(t,r){const o=Object.assign({},r);if(['teachers','teacher_payments','expenses','exam_results','notifications'].includes(t))o.id=o.id||++SEQ;
 if(!o.created_at)o.created_at=now();if(t==='teachers'){o.active=true;o.pay_type=o.pay_type||'share'}if((t==='expenses'||t==='teacher_payments')&&!o.date)o.date=todayS;return o}
class Q{constructor(t){this.t=t;this.f=[];this.ord=[];this.op='select';this.sel='*';this.opts={};this.lim=null;this.one=false}
 select(s,o){this.sel=s||'*';this.opts=o||{};return this}insert(r){this.op='insert';this.p=r;return this}update(p){this.op='update';this.p=p;return this}delete(){this.op='delete';return this}upsert(r,o){this.op='upsert';this.p=r;this.uo=o||{};return this}
 eq(c,v){this.f.push(r=>r[c]==v);return this}neq(c,v){this.f.push(r=>r[c]!=v);return this}in(c,a){this.f.push(r=>a.some(x=>x==r[c]));return this}gte(c,v){this.f.push(r=>r[c]>=v);return this}lt(c,v){this.f.push(r=>r[c]<v);return this}
 is(c,v){this.f.push(r=>v===null?r[c]==null:r[c]===v);return this}not(c,o,v){this.f.push(r=>o==='is'&&v===null?r[c]!=null:r[c]!==v);return this}
 order(c,o){this.ord.push([c,!(o&&o.ascending===false)]);return this}limit(n){this.lim=n;return this}single(){this.one=true;return this}maybeSingle(){this.one=true;return this}
 then(a,b){return this.run().then(a,b)}
 async run(){const t=this.t,arr=DB[t];if(!arr)return{data:null,error:{message:'demo: unknown table '+t}};const m=r=>this.f.every(p=>p(r));
  if(this.op==='select'){let rows=scoped(t).filter(m);this.ord.forEach(([c,asc],i)=>{});if(this.ord.length)rows=rows.slice().sort((x,y)=>{for(const[c,asc]of this.ord){const v=cmp(x[c],y[c]);if(v)return asc?v:-v}return 0});
   const count=rows.length;if(this.lim!=null)rows=rows.slice(0,this.lim);if(this.opts.head)return{data:null,count,error:null};let data=rows.map(r=>proj(r,this.sel,t));if(this.one)data=data[0]||null;return{data,count,error:null}}
  if(this.op==='insert'){[].concat(this.p).forEach(r=>arr.push(fill(t,r)));return{data:null,error:null}}
  if(this.op==='update'){scoped(t).filter(m).forEach(r=>Object.assign(r,this.p));return{data:null,error:null}}
  if(this.op==='delete'){for(let i=arr.length-1;i>=0;i--)if(m(arr[i]))arr.splice(i,1);return{data:null,error:null}}
  if(this.op==='upsert'){const ks=String(this.uo.onConflict||'').split(',').filter(Boolean);[].concat(this.p).forEach(r=>{const ex=arr.find(x=>ks.every(k=>x[k]==r[k]));if(ex)Object.assign(ex,r);else arr.push(fill(t,r))});return{data:null,error:null}}
  return{data:null,error:null}}}
function split(total,rows,setter){const n=rows.length;rows.forEach((r,i)=>setter(r,Math.floor(total/n)+(i===0?total%n:0)))}
const RPC={
 create_month_fees:a=>{let n=0;DB.students.filter(s=>s.status==='Active').forEach(s=>{if(!DB.fees.some(f=>f.month===a.p_month&&f.roll_no===s.roll_no)){DB.fees.push({month:a.p_month,roll_no:s.roll_no,amount:s.monthly_fee||0,status:'Unpaid',paid_on:null});n++}});return{data:n,error:null}},
 approve_admission:a=>{let n=0;DB.students.filter(s=>s.family_id===a.p_family_id&&s.status==='Pending').forEach(s=>{s.status='Active';n++});RPC.create_month_fees({p_month:ym});return{data:n,error:null}},
 reject_admission:a=>{DB.students.filter(s=>s.family_id===a.p_family_id&&s.status==='Pending').forEach(s=>s.status='Left');return{data:1,error:null}},
 set_family_month_total:a=>{const rolls=DB.students.filter(s=>s.family_id===a.p_family).map(s=>s.roll_no),rows=DB.fees.filter(f=>f.month===a.p_month&&rolls.includes(f.roll_no));if(!rows.length)return{error:{message:'no fee rows for this family and month'}};if(rows.some(f=>f.status==='Paid'))return{error:{message:'Some fees are already paid. Mark them unpaid first.'}};split(a.p_total,rows,(r,v)=>r.amount=v);return{data:null,error:null}},
 apply_family_fee:a=>{const f=DB.families.find(x=>x.family_id===a.p_family);if(f){f.fee_mode=a.p_mode;f.combined_fee=a.p_mode==='combined'?a.p_total:null}const ks=DB.students.filter(s=>s.family_id===a.p_family&&s.status==='Active');if(a.p_mode==='combined')split(a.p_total,ks,(s,v)=>s.monthly_fee=v);
  if(a.p_month)DB.fees.filter(x=>x.month===a.p_month&&x.status==='Unpaid'&&ks.some(s=>s.roll_no===x.roll_no)).forEach(x=>x.amount=ks.find(s=>s.roll_no===x.roll_no).monthly_fee);return{data:null,error:null}},
 approve_staff:a=>{const s=DB.staff.find(x=>x.user_id===a.p_user_id);if(s){s.active=true;s.role=a.p_role;if(a.p_role==='teacher'&&!DB.teachers.some(t=>t.user_id===s.user_id))DB.teachers.push(fill('teachers',{name:s.name,user_id:s.user_id,gender:null,phone:null,share_percent:50,fixed_salary:0}))}return{data:null,error:null}},
 deactivate_staff:a=>{const s=DB.staff.find(x=>x.user_id===a.p_user_id);if(s)s.active=false;DB.teachers.filter(t=>t.user_id===a.p_user_id).forEach(t=>t.active=false);return{data:null,error:null}},
 teacher_statement:a=>{const m=a.p_month;const rows=DB.teachers.filter(t=>t.active).map(t=>{const ss=DB.students.filter(s=>s.teacher_id===t.id),fr=DB.fees.filter(f=>f.month===m&&ss.some(s=>s.roll_no===f.roll_no));let paid=0,unp=0,sh=0;
  fr.forEach(f=>{const s=ss.find(x=>x.roll_no===f.roll_no),pct=s.teacher_share!=null?s.teacher_share:t.share_percent;if(f.status==='Paid'){paid+=f.amount;sh+=f.amount*pct/100}else unp+=f.amount});sh=Math.round(sh);
  const led=DB.teacher_payments.filter(p=>p.teacher_id===t.id&&p.month===m),sm=k=>led.filter(p=>k.includes(p.type)).reduce((n,p)=>n+p.amount,0);
  const S1=['share','mixed'].includes(t.pay_type)?sh:0,F1=['fixed','mixed'].includes(t.pay_type)?t.fixed_salary:0,b=sm(['Bonus']),d=sm(['Deduction']),o=sm(['Payment','Advance']);
  return{t_id:t.id,t_name:t.name,t_pay_type:t.pay_type,t_share_percent:t.share_percent,t_fixed_salary:t.fixed_salary,n_students:fr.length,fees_paid:paid,fees_unpaid:unp,share_earned:S1,fixed_part:F1,bonus:b,deduction:d,paid_out:o,balance:S1+F1+b-d-o,academy_share:paid-S1}});
  rows.sort((x,y)=>x.t_name<y.t_name?-1:1);return{data:rows,error:null}},
 my_earnings:a=>{const t=DB.teachers.find(x=>x.user_id===UID&&x.active);if(!t)return{data:null,error:null};const m=a.p_month,ss=DB.students.filter(s=>s.teacher_id===t.id&&s.status==='Active');
  const rows=ss.map(s=>{const f=DB.fees.find(x=>x.month===m&&x.roll_no===s.roll_no),pct=s.teacher_share!=null?s.teacher_share:t.share_percent;return{roll_no:s.roll_no,name:s.name,fee:f?f.amount:null,status:f?f.status:null,pct,share:f&&f.status==='Paid'?f.amount*pct/100:0}});
  const led=DB.teacher_payments.filter(p=>p.teacher_id===t.id&&p.month===m),sm=k=>led.filter(p=>k.includes(p.type)).reduce((n,p)=>n+p.amount,0);
  const shr=['share','mixed'].includes(t.pay_type)?Math.round(rows.reduce((n,r)=>n+r.share,0)):0,fx=['fixed','mixed'].includes(t.pay_type)?t.fixed_salary:0,b=sm(['Bonus']),d=sm(['Deduction']),o=sm(['Payment','Advance']);
  return{data:{teacher:t.name,pay_type:t.pay_type,share_percent:t.share_percent,fixed_salary:t.fixed_salary,students:rows,share_total:shr,fixed_part:fx,bonus:b,deduction:d,paid_out:o,balance:shr+fx+b-d-o,ledger:led.map(p=>({date:p.date,type:p.type,amount:p.amount,note:p.note}))},error:null}}
};
const session={user:{id:UID}};
const client={from:t=>new Q(t),rpc:(n,a)=>Promise.resolve(RPC[n]?RPC[n](a||{}):{error:{message:'demo: '+n+' not available'}}),
 auth:{getSession:()=>Promise.resolve({data:{session}}),signInWithPassword:()=>Promise.resolve({data:{session},error:null}),signUp:()=>Promise.resolve({data:{session:null},error:null}),signOut:()=>Promise.resolve({})},
 channel:()=>({on(){return this},subscribe(){return this}})};
window.supabase={createClient:()=>client};
// banner + role switcher
const st=document.createElement('style');st.textContent='#dbar{position:fixed;top:0;left:0;right:0;z-index:99;background:#d4a84b;color:#1b2440;font:600 12.5px Poppins,sans-serif;padding:6px 10px;display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}#dbar select{height:26px;border-radius:8px;border:1px solid #1b2440;font:600 12px Poppins,sans-serif;padding:0 6px}#dbar a{color:#1b2440}';document.head.appendChild(st);
const bar=document.createElement('div');bar.id='dbar';bar.innerHTML='🎯 DEMO – sample data only, nothing is saved. View as: <select id="dr"><option value="owner">Owner (admin)</option><option value="teacher">Teacher</option><option value="accountant">Accountant</option></select>';document.body.prepend(bar);document.body.style.paddingTop='38px';
const sel=document.getElementById('dr');sel.value=ROLE;sel.onchange=()=>{sessionStorage.setItem('demoRole',sel.value);location.reload()};
})();
