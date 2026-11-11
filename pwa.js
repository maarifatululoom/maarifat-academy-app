// Install popup: shown to anyone who opens the app and has not installed it yet.
(function(){
const me=document.currentScript,NAME=(me&&me.dataset.name)||document.title;
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
if(/[?&]demo\b/.test(location.search))return;                       // the demo can't be installed
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone===true)return;   // already installed
const KEY='pwaAsk',WAIT=7*864e5;
let ev=null,box=null;
const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
function css(){const s=document.createElement('style');s.textContent='@keyframes pwaUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}.pwa{position:fixed;left:12px;right:12px;bottom:12px;z-index:300;max-width:460px;margin:auto;background:#fffdf8;color:#1b2440;border:1.5px solid #d4a84b;border-radius:20px;padding:14px;box-shadow:0 18px 50px rgba(0,0,0,.4);display:flex;gap:12px;align-items:center;font:500 13.5px Poppins,system-ui,sans-serif;animation:pwaUp .5s both}[data-theme=dark] .pwa{background:#16203a;color:#e9edf7}.pwa img{width:54px;height:54px;border-radius:14px;flex:none}.pwa b{display:block;font-size:15px}.pwa small{display:block;opacity:.75;margin-top:2px}.pwa .bt{display:flex;gap:8px;margin-top:10px}.pwa button{border:0;border-radius:12px;padding:9px 16px;font:600 13px Poppins,system-ui,sans-serif;cursor:pointer}.pwa .go{background:linear-gradient(135deg,#1b2a55,#33477d);color:#fff;border-bottom:2px solid #d4a84b}.pwa .no{background:transparent;color:inherit;opacity:.75}';document.head.appendChild(s)}
function hide(later){if(box){box.remove();box=null}if(later)localStorage.setItem(KEY,String(Date.now()))}
function show(){
  if(box||Date.now()-(+localStorage.getItem(KEY)||0)<WAIT)return;
  css();box=document.createElement('div');box.className='pwa';
  const icon=document.createElement('img');icon.src='icon-192.webp';icon.alt='';
  const txt=document.createElement('div');
  txt.innerHTML='<b></b><small></small><div class="bt"></div>';
  txt.querySelector('b').textContent='Install '+NAME;
  txt.querySelector('small').textContent=ios?'Tap the Share button, then "Add to Home Screen". / Share dabayen, phir "Add to Home Screen".':'Open it like an app from your home screen. / App ki tarah home screen se kholein.';
  const bt=txt.querySelector('.bt');
  if(!ios){const g=document.createElement('button');g.className='go';g.textContent='Install';g.onclick=async()=>{if(!ev)return hide(true);ev.prompt();const r=await ev.userChoice;ev=null;hide(r.outcome!=='accepted')};bt.appendChild(g)}
  const n=document.createElement('button');n.className='no';n.textContent=ios?'OK':'Not now';n.onclick=()=>hide(true);bt.appendChild(n);
  box.append(icon,txt);document.body.appendChild(box);
}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ev=e;setTimeout(show,1200)});
addEventListener('appinstalled',()=>{ev=null;hide(true)});
if(ios)addEventListener('load',()=>setTimeout(show,2500));
})();
