const API=window.QE_API||'http://localhost:8080/api';
const ls={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const setTok=t=>ls.set('qe_tok',t);
const blank=()=>({shop:{open:true,t:{s:3,p:5,b:8},opens:'9:00 AM'},price:{bw:2,color:5,spiral:30,thermal:40},items:[],q:[],notifs:[],serving:0});
let S=blank(),me=null,view='home',D={items:{},files:[],binding:'none',cover:'',spiral:'Black'},open=null,reg=false;
async function api(m,p,body){const h={},o={method:m,headers:h},t=ls.get('qe_tok');if(t)h.Authorization='Bearer '+t;
if(body instanceof FormData)o.body=body;else if(body){h['Content-Type']='application/json';o.body=JSON.stringify(body)}
let r;try{r=await fetch(API+p,o)}catch(e){throw new Error('Cannot reach the server. Is the backend running?')}
let j=null;try{j=await r.json()}catch(e){}
if(!r.ok||(j&&j.success===false)){if(r.status==401&&t&&p!='/auth/login'){setTok('');me=null;shell()}const er=new Error((j&&j.message)||'Something went wrong. Please try again.');er.status=r.status;er.data=j&&j.data;throw er}
return j?j.data:null}
async function sync(){if(!me)return;const [items,shop,price,q,notifs]=await Promise.all([api('GET','/items'),api('GET','/shop'),api('GET','/pricing'),api('GET','/orders'),api('GET','/notifications')]);S={items,shop,price,q,notifs,serving:shop.serving}}
const dt=o=>new Date(o.joined).toDateString().slice(4,10);
const $=id=>document.getElementById(id),R=n=>'₹'+n,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ACT=['pending','waiting','called','processing','printing','binding'];
const LBL={pending:'Under review',rejected:'Rejected',waiting:'Waiting',called:'Called',processing:'Processing',printing:'Printing',binding:'Binding',ready:'Ready',completed:'Completed',skipped:'Skipped',cancelled:'Cancelled'};
const tagc=s=>s=='ready'||s=='completed'?'ok':s=='called'||s=='pending'?'warn':s=='skipped'||s=='cancelled'||s=='rejected'?'err':'';
const tg=s=>`<span class="tag ${tagc(s)}">${LBL[s]}</span>`;
function toast(m){const t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),2800)}

const myQs=()=>S.q.filter(o=>o.sid==me.id&&(ACT.includes(o.status)||o.status=='ready')).sort((a,b)=>a.token-b.token);
const myQ=()=>S.q.find(o=>o.sid==me.id&&(ACT.includes(o.status)||o.status=='ready'));
const active=o=>ACT.includes(o.status);
const ordType=o=>o.files.length?(o.binding!='none'?'pb':'p'):'s';
const svc=o=>S.shop.t[ordType(o)=='pb'?'b':ordType(o)=='p'?'p':'s'];
const ahead=o=>o.ahead||0;
const wait=o=>o.wait||0;
// ---- pricing
function parseRange(r,tot){if(!r.trim())return tot;const set=new Set();for(const p of r.split(',')){const m=p.trim().match(/^(\d+)(?:-(\d+))?$/);if(!m)return null;const a=+m[1],b=m[2]?+m[2]:a;if(a<1||b<a||b>tot)return null;for(let i=a;i<=b;i++)set.add(i)}return set.size}
function fileCost(f){const n=parseRange(f.range,f.pages)||0;let r=f.color=='Color'?S.price.color:S.price.bw;if(f.paper=='A3')r*=2;if(f.type=='Thick')r+=1;if(f.type=='Glossy')r+=3;return n*f.copies*r}
function bindCost(b,files){return b=='none'?0:(b=='spiral'?S.price.spiral:S.price.thermal)*files.reduce((a,f)=>a+f.copies,0)}
const itemList=()=>Object.entries(D.items).filter(e=>e[1]>0).map(e=>({id:+e[0],qty:e[1]}));
const stCost=l=>l.reduce((a,i)=>a+S.items.find(x=>x.id==i.id).price*i.qty,0);
const total=(l,f,b)=>stCost(l)+f.reduce((a,x)=>a+fileCost(x),0)+(f.length?bindCost(b,f):0);
// ---- auth
async function enter(r){setTok(r.token);me=r.user;view=me.role=='STUDENT'?'home':'sdash';await sync();shell()}
async function login(){const u=$('lu').value.trim(),p=$('lp').value;if(!u||!p){$('le').textContent='Please enter your username or roll number and password.';return}
try{await enter(await api('POST','/auth/login',{identifier:u,password:p}))}catch(e){$('le').textContent=e.message}}
async function register(){const u=$('ru').value.trim(),r=$('rr').value.trim(),p=$('rpw').value;
if(!u||!r||!p){$('le').textContent='Please fill in username, roll number and password.';return}
try{await enter(await api('POST','/auth/register',{username:u,rollNo:r,password:p}))}catch(e){$('le').textContent=e.message}}
function logout(){setTok('');me=null;S=blank();reg=false;shell()}
function toggleReg(){reg=!reg;renderLogin()}
const EYE='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYEOFF='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 5c7 0 11 7 11 7a19.9 19.9 0 0 1-3.17 4.19M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
const pw=(id,ac,fn)=>`<div class="pw"><input id="${id}" type="password" autocomplete="${ac}" ${fn?`onkeydown="if(event.key=='Enter')${fn}()"`:''}><button type="button" class="eye" onclick="eye('${id}',this)" aria-label="Show password" aria-pressed="false">${EYE}</button></div>`;
function eye(id,b){const i=$(id),show=i.type=='password';i.type=show?'text':'password';b.innerHTML=show?EYEOFF:EYE;b.setAttribute('aria-label',show?'Hide password':'Show password');b.setAttribute('aria-pressed',String(show))}
// ---- shell
function shell(){const n=$('nav'),t=$('tr');
t.innerHTML=``+(me?`<span class="mut hide-m">${esc(me.name)}</span><button class="btn sec sm" onclick="logout()">Logout</button>`:'');
if(!me){n.className='hide';return renderLogin()}
const un=S.notifs.filter(x=>!x.r).length;
const items=me.role=='STUDENT'?[['home','🏠','Home'],['shop','🛒','Shop'],['print','🖨️','Print'],['queue','🎫','Queue'],['hist','🧾','Orders'],['alerts','🔔','Alerts'+(un?` (${un})`:'')]]:[['sdash','📋','Queue'],['inv','📦','Shop'],['ana','📊','Analytics']];
n.className='';n.innerHTML=items.map(i=>`<button class="${view==i[0]?'on':''}" onclick="go('${i[0]}')" ${view==i[0]?'aria-current="page"':''}><span aria-hidden="true">${i[1]}</span>${i[2]}</button>`).join('');
render()}
function go(v){view=v;shell();scrollTo(0,0)}
function renderLogin(){const hero=`<div class="hero"><h1>Skip the Line.<br>Save Your Time.</h1><p class="mut">Order stationery, upload documents, customize printing and track your queue.</p></div>`;
$('app').innerHTML=reg?`<div class="login">${hero}<div class="card"><h3>Create account</h3>
<label for="ru">Username</label><input id="ru" autocomplete="username"><label for="rr">Roll number</label><input id="rr" autocomplete="off"><label for="rpw">Password (min 6 characters)</label>${pw('rpw','new-password','register')}
<p class="err" id="le" role="alert"></p><button class="btn big" onclick="register()">Create account</button><p style="margin-top:10px"><a href="#" onclick="toggleReg();return false">Already have an account? Login</a></p></div></div>`
:`<div class="login">${hero}<div class="card"><h3>Login</h3><label for="lu">Username or roll number</label><input id="lu" autocomplete="username"><label for="lp">Password</label>${pw('lp','current-password','login')}<p class="err" id="le" role="alert"></p><button class="btn big" onclick="login()">Login</button><p style="margin-top:10px"><a href="#" onclick="toggleReg();return false">New student? Create an account</a></p></div></div>`}
function render(){const a=$('app');const f={home,shop,print:prt,queue,hist,alerts,sdash,inv,ana,profile}[view];a.innerHTML=f()}
// ---- student views
function qcard(o){if(!o)return `<div class="card"><h3>No active queue</h3><p class="mut">Order stationery or upload documents to get a token.</p></div>`;
const a=ahead(o),w=wait(o),msg=o.status=='pending'?'Staff is reviewing your documents.':o.status=='ready'?'Your order is ready for collection!':o.status=='called'?'Please proceed to the counter.':a==0?'You are next!':a<=3?'Almost your turn!':'Waiting in queue';
return `<div class="card"><div class="row sp"><h3>${{s:'Stationery order',p:'Print order',pb:'Print + binding order'}[ordType(o)]}</h3>${tg(o.status)}</div><div class="tok"><span class="mut">YOUR TOKEN</span><b>#${o.token}</b></div>
<div class="stats"><div><b>#${S.serving}</b><span>NOW SERVING</span></div><div><b>${active(o)?a:0}</b><span>PEOPLE AHEAD</span></div><div><b>${active(o)?'~'+w:0}</b><span>MIN WAIT</span></div></div><p><b>${msg}</b></p><div style="margin-top:8px">${leaveBtn(o)}</div></div>`}
function home(){const l=myQs();return `<h2>Hello, ${esc(me.name.split(' ')[0])} 👋</h2>${S.shop.open?'':`<div class="card" style="background:var(--wb)"><b>Stationery Shop Closed</b><p>Virtual queue is currently unavailable. Opening time: ${S.shop.opens}</p></div>`}
${l.length?l.map(qcard).join(''):qcard(null)}${l.length?`<button class="btn big" onclick="go('queue')" style="margin-bottom:14px">Track My Queue</button>`:''}
<div class="grid"><div class="card"><h3>🛒 Buy Stationery</h3><p class="mut">Order notebooks, pens, files and other stationery.</p><br><button class="btn" onclick="go('shop')">Shop Stationery</button></div>
<div class="card"><h3>🖨️ Print Documents</h3><p class="mut">Upload your documents and customize your printing.</p><br><button class="btn" onclick="go('print')">Print Documents</button></div></div>
<button class="btn sec sm" onclick="go('profile')">Profile</button>`}
function shop(){const cats=[...new Set(S.items.map(i=>i.cat))];return `<h2>Stationery Store</h2>`+cats.map(c=>`<h3 class="mut" style="margin-top:14px">${c}</h3><div class="grid">`+S.items.filter(i=>i.cat==c).map(i=>{const q=D.items[i.id]||0,ok=i.stock>0;return `<div class="card" style="margin:0"><div style="font-size:2rem" aria-hidden="true">${i.icon}</div><b>${i.name}</b><div class="row sp"><span>${R(i.price)}</span><span class="tag ${ok?'ok':'err'}">${ok?'Available · '+i.stock:'Out of stock'}</span></div><div class="qty" style="margin-top:8px"><button aria-label="Decrease ${i.name}" onclick="qt(${i.id},-1)" ${ok?'':'disabled'}>−</button><span>${q}</span><button aria-label="Increase ${i.name}" onclick="qt(${i.id},1)" ${ok?'':'disabled'}>+</button></div></div>`}).join('')+`</div>`).join('')+cartBar()}
function qt(id,d){const it=S.items.find(x=>x.id==id),q=(D.items[id]||0)+d;if(q>it.stock)return toast('Only '+it.stock+' in stock');D.items[id]=Math.max(0,q);render()}
function cartBar(){const l=itemList();if(!l.length)return '';return `<div class="card" style="position:sticky;bottom:80px;border-color:var(--sec)"><div class="row sp"><b>${l.reduce((a,i)=>a+i.qty,0)} items · ${R(stCost(l))}</b><button class="btn" onclick="go('print')">Review &amp; Join Queue</button></div></div>`}
const b64=b=>new Promise((r,j)=>{const x=new FileReader();x.onload=()=>r(x.result);x.onerror=j;x.readAsDataURL(b)});
async function fget(k,view){try{const r=await fetch(API+'/files/'+k+(view?'?view=true':''),{headers:{Authorization:'Bearer '+ls.get('qe_tok')}});return r.ok?await r.blob():null}catch(e){return null}}
async function inflate(u,fmt){const ds=new DecompressionStream(fmt),w=ds.writable.getWriter();w.write(u).catch(()=>{});w.close().catch(()=>{});return new Uint8Array(await new Response(ds.readable).arrayBuffer())}
async function pdfPages(blob){const u=new Uint8Array(await blob.arrayBuffer()),dec=new TextDecoder('latin1'),txt=dec.decode(u);
const cnt=t=>(t.match(/\/Type\s*\/Page(?![s\w])/g)||[]).length;
const cs=t=>{let m=0;for(const x of t.matchAll(/\/Type\s*\/Pages\b[^]{0,3000}?\/Count\s+(\d+)/g))m=Math.max(m,+x[1]);for(const x of t.matchAll(/\/Count\s+(\d+)[^]{0,300}?\/Type\s*\/Pages\b/g))m=Math.max(m,+x[1]);return m};
const a=cnt(txt);if(a)return a;let m=cs(txt),tot=0;
const re=/stream\r?\n/g;let x;while((x=re.exec(txt))){if(txt.slice(x.index-3,x.index)=='end')continue;const st=x.index+x[0].length,en=txt.indexOf('endstream',st);if(en<0)break;
let e2=en;if(u[e2-1]==10)e2--;if(u[e2-1]==13)e2--;let d=null;for(const q of [e2,en]){try{d=dec.decode(await inflate(u.subarray(st,q),'deflate'));break}catch(e){}}if(d){tot+=cnt(d);m=Math.max(m,cs(d))}re.lastIndex=en+9}
return Math.max(tot,m)}
function mkPdf(n,t){const o=[],k=[];o[1]='<</Type/Catalog/Pages 2 0 R>>';for(let i=0;i<n;i++)k.push((4+i*2)+' 0 R');o[2]=`<</Type/Pages/Kids[${k.join(' ')}]/Count ${n}>>`;o[3]='<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>';
for(let i=0;i<n;i++){const c=`BT /F1 24 Tf 72 700 Td (${t} - Page ${i+1}) Tj ET`;o[4+i*2]=`<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents ${5+i*2} 0 R/Resources<</Font<</F1 3 0 R>>>>>>`;o[5+i*2]=`<</Length ${c.length}>>\nstream\n${c}\nendstream`}
let s='%PDF-1.4\n',off=[];for(let i=1;i<o.length;i++){off[i]=s.length;s+=`${i} 0 obj\n${o[i]}\nendobj\n`}const x=s.length;
s+=`xref\n0 ${o.length}\n0000000000 65535 f \n`+off.slice(1).map(v=>String(v).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;return new Blob([s],{type:'application/pdf'})}
async function countPages(file,ext){try{if(/jpe?g|png/.test(ext))return 1;if(ext=='pdf'&&file.size<200*1048576)return (await pdfPages(file))||null}catch(e){}return null}
async function addFiles(list){const errs=[];
for(const f of [...list]){const ext=f.name.split('.').pop().toLowerCase();
if(!['pdf','jpg','jpeg','png'].includes(ext)){errs.push(f.name+': This file is not supported. Only PDF, JPG and PNG files can be uploaded.');continue}

const n=await countPages(f,ext);D.files.push({file:f,name:f.name,ext,size:f.size,pages:n||1,auto:!!n,range:'',color:'Black & White',sides:'Double-sided',copies:1,paper:'A4',type:'Normal'})}
D.err=errs.join(' ');render()}
async function sample(){const b=mkPdf(24,'Computer Networks Notes'),id=n=>(S.items.find(x=>x.name==n)||{}).id;
D.files.push({file:new File([b],'Computer_Networks_Notes.pdf',{type:'application/pdf'}),name:'Computer_Networks_Notes.pdf',ext:'pdf',size:b.size,pages:24,auto:true,range:'',color:'Black & White',sides:'Double-sided',copies:2,paper:'A4',type:'Normal'});D.binding='spiral';if(id('Record Book'))D.items[id('Record Book')]=1;if(id('Blue Pen'))D.items[id('Blue Pen')]=2;D.err='';render()}
const sz=b=>b>1073741824?(b/1073741824).toFixed(2)+' GB':b>1048576?(b/1048576).toFixed(1)+' MB':Math.ceil(b/1024)+' KB';
function fu(i,k,v){D.files[i][k]=['pages','copies'].includes(k)?Math.max(1,parseInt(v)||1):v;render()}
function sample(){D.files.push({name:'Computer_Networks_Notes.pdf',ext:'pdf',size:2411724,pages:24,range:'',color:'Black & White',sides:'Double-sided',copies:2,paper:'A4',type:'Normal'});D.binding='spiral';D.items[1]=1;D.items[3]=2;render()}
const sel=(i,k,opts)=>`<select onchange="fu(${i},'${k}',this.value)" aria-label="${k}">${opts.map(o=>`<option ${D.files[i][k]==o?'selected':''}>${o}</option>`).join('')}</select>`;
function prt(){const l=itemList(),bad=D.files.some(f=>f.auto&&parseRange(f.range,f.pages)===null),tot=total(l,D.files,D.binding),cl=!S.shop.open;
return `<h2>Print Documents</h2><div class="card"><label for="fi">Upload documents (PDF, JPG, PNG · any size)</label><input id="fi" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onchange="addFiles(this.files)">${D.err?`<p class="err" role="alert">${esc(D.err)}</p>`:''}<div style="margin-top:8px"><button class="btn sec sm" onclick="sample()">Load demo scenario</button></div></div>
${D.files.map((f,i)=>{const n=parseRange(f.range,f.pages);return `<div class="card"><div class="row sp"><div><b>📄 ${esc(f.name)}</b><div class="mut">${f.ext.toUpperCase()} · ${sz(f.size)} · <span style="color:var(--ok)">✓ Uploaded</span></div></div><button class="btn bad sm" onclick="D.files.splice(${i},1);render()">Remove</button></div>
<div class="grid"><div><label>Total pages</label><input type="number" value="${f.pages}" readonly aria-label="Total pages"><span class="mut" style="font-size:.75rem">${f.auto?'':'Pages will be counted when you submit (estimate may differ)'}</span></div>
<div><label>Pages to print (blank = all)</label><input value="${esc(f.range)}" placeholder="1-5, 8, 10-12" onchange="fu(${i},'range',this.value)"></div>
<div><label>Copies</label><input type="number" min="1" value="${f.copies}" onchange="fu(${i},'copies',this.value)"></div>
<div><label>Color</label>${sel(i,'color',['Black & White','Color'])}</div><div><label>Sides</label>${sel(i,'sides',['Single-sided','Double-sided'])}</div>
<div><label>Paper size</label>${sel(i,'paper',['A4','A3'])}</div><div><label>Paper type</label>${sel(i,'type',['Normal','Thick','Glossy'])}</div></div>
${n===null?`<p class="err" role="alert">Invalid page range. Use a format like 1-5, 8, 10-12 within ${f.pages} pages.</p>`:`<p class="mut">${n} page(s) × ${f.copies} copies = <b>${R(fileCost(f))}</b></p>`}</div>`}).join('')}
${D.files.length?`<div class="card"><h3>Binding</h3><div class="row">${[['none','No binding'],['spiral','Spiral'],['thermal','Thermal']].map(b=>`<label style="display:flex;gap:6px;align-items:center;margin:0"><input type="radio" name="bd" style="width:auto;min-height:0" ${D.binding==b[0]?'checked':''} onchange="D.binding='${b[0]}';render()"> ${b[1]}</label>`).join('')}</div>
${D.binding=='spiral'?`<div class="grid"><div><label>Spiral color</label><select onchange="D.spiral=this.value"><option>Black</option><option>Blue</option><option>Clear</option></select></div><div><label>Cover type</label><select onchange="D.cover=this.value"><option>Transparent</option><option>Colored</option></select></div></div>`:''}
${D.binding=='thermal'?`<div class="grid"><div><label>Front cover</label><select><option>Transparent</option><option>Colored</option></select></div><div><label>Back cover</label><select><option>Plain</option><option>Colored</option></select></div></div>`:''}</div>`:''}
<div class="card"><h3>Order summary</h3>${!D.files.length&&!l.length?'<p class="mut">Nothing added yet. Upload a document or add items from the <a href="#" onclick="go(\'shop\');return false">store</a>.</p>':`
${D.files.map(f=>`<div class="row sp"><span>${esc(f.name)} · ${f.copies}× ${f.color=='Color'?'Color':'B&amp;W'}</span><b>${R(fileCost(f))}</b></div>`).join('')}
${D.files.length&&D.binding!='none'?`<div class="row sp"><span>${D.binding=='spiral'?'Spiral':'Thermal'} binding</span><b>${R(bindCost(D.binding,D.files))}</b></div>`:''}
${l.map(i=>{const it=S.items.find(x=>x.id==i.id);return `<div class="row sp"><span>${it.name} × ${i.qty}</span><b>${R(it.price*i.qty)}</b></div>`}).join('')}
<hr style="border:0;border-top:1px solid var(--bd)"><div class="row sp"><b>Estimated Total</b><b style="font-size:1.3rem">${R(tot)}</b></div><p class="mut">Pay at the counter when you collect.</p>`}
${cl?`<p class="err">The shop is currently closed.</p>`:''}
<button class="btn big" style="margin-top:8px" ${(!D.files.length&&!l.length)||bad||cl?'disabled':''} onclick="join()">Confirm &amp; Join Queue</button></div>`}
async function join(){if(!S.shop.open)return toast('The shop is currently closed.');
const fd=new FormData();fd.append('order',new Blob([JSON.stringify({items:itemList().map(i=>({id:i.id,qty:i.qty})),binding:D.binding,bindingColor:D.spiral,coverType:D.cover,files:D.files.map(f=>({name:f.name,range:f.range,color:f.color,sides:f.sides,copies:f.copies,paper:f.paper,type:f.type}))})],{type:'application/json'}));
D.files.forEach(f=>fd.append('files',f.file));
try{const o=await api('POST','/orders',fd);D={items:{},files:[],binding:'none',cover:'',spiral:'Black'};await sync();toast('Token #'+o.token+' confirmed!');go('queue')}catch(e){toast(e.message)}}
function queue(){const l=myQs();if(!l.length){const o=S.q.filter(x=>x.sid==me.id).slice(-1)[0];if(!o)return `<h2>Queue</h2>${qcard(null)}<button class="btn" onclick="go('print')">Start an order</button>`;return `<h2>Queue Tracking</h2>`+qpanel(o)+`<button class="btn" onclick="go('print')">Place a new order</button>`}
return `<h2>Queue Tracking${l.length>1?' ('+l.length+' orders)':''}</h2>`+l.map(qpanel).join('')+`<button class="btn sec" onclick="go('print')">Place another order</button>`}
function qpanel(o){const pr=o.files.length,st=pr?['Review','Queued','Processing','Printing','Binding','Ready','Done']:['Queued','Processing','Ready','Done'];
const map=pr?{pending:0,waiting:1,called:1,processing:2,printing:3,binding:4,ready:5,completed:6}:{waiting:0,called:0,processing:1,ready:2,completed:3},idx=map[o.status]??0;
const dead=o.status=='skipped'||o.status=='cancelled'||o.status=='rejected';
return `${qcard(o)}${dead?`<div class="card"><b>This order was ${o.status}.</b></div>`:`<div class="card"><h3>Order status</h3><div class="steps">${st.map((s,i)=>`<div data-n="${i+1}" class="${i<idx||o.status=='completed'?'done':i==idx?'cur':''}">${s}</div>`).join('')}</div></div>`}
<div class="card"><h3>Order details</h3>${detail(o)}<p><b>${R(o.total)}</b> estimated · pay at counter</p></div>`}
function detail(o){return o.files.map(f=>`<p>📄 ${esc(f.name)} · ${parseRange(f.range,f.pages)} pg × ${f.copies} · ${f.color=='Color'?'Color':'B&W'} · ${f.sides} · ${f.paper}</p>`).join('')+(o.binding!='none'?`<p>Binding: ${o.binding}</p>`:'')+o.items.map(i=>`<p>${S.items.find(x=>x.id==i.id).name} ×${i.qty}</p>`).join('')}
function ask(msg,yes){return new Promise(res=>{const m=document.createElement('div');m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:40;display:flex;align-items:center;justify-content:center;padding:16px';m.setAttribute('role','dialog');
m.innerHTML=`<div class="card" style="max-width:360px;width:100%;margin:0"><p><b>${esc(msg)}</b></p><div class="row" style="margin-top:12px"><button class="btn bad" id="ask-yes">${yes}</button><button class="btn sec" id="ask-no">Cancel</button></div></div>`;
document.body.appendChild(m);const d=v=>{m.remove();res(v)};m.querySelector('#ask-yes').onclick=()=>d(true);m.querySelector('#ask-no').onclick=()=>d(false)})}
const leaveBtn=o=>{if(!['pending','waiting'].includes(o.status))return '';return o.files.some(f=>f.seen)?`<p class="mut">Staff has opened your document, so this order can no longer be cancelled.</p>`:`<button class="btn bad" onclick="leave(${o.id})">Leave queue</button>`};
async function rejectOrder(id){if(await ask('Reject this order?','Reject'))act(id,'reject')}
async function leave(id){if(!await ask('Leave the queue? Your order will be cancelled.','Leave queue'))return;try{await api('DELETE','/queue/'+id);await sync();toast('You left the queue');render()}catch(e){toast(e.message)}}
function hist(){const l=S.q.filter(x=>x.sid==me.id).reverse();return `<h2>Order History</h2>`+(l.length?`<div class="tw card"><table><tr><th>Token</th><th>Date</th><th>Items</th><th>Amount</th><th>Status</th></tr>${l.map(o=>`<tr><td>#${o.token}</td><td>${dt(o)}</td><td>${o.files.length?'Printing'+(o.binding!='none'?' + '+o.binding+' binding':''):''}${o.files.length&&o.items.length?' + ':''}${o.items.length?'Stationery':''}</td><td>${R(o.total)}</td><td>${tg(o.status)}</td></tr>`).join('')}</table></div>`:'<div class="card mut">No orders yet.</div>')}
function alerts(){const l=S.notifs;if(l.some(n=>!n.r))api('PUT','/notifications/read-all').then(sync).then(shell).catch(()=>{});
return `<h2>Notifications</h2>`+(l.length?l.map(n=>`<div class="card">${esc(n.m)}<div class="mut" style="font-size:.78rem">${new Date(n.t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div></div>`).join(''):'<div class="card mut">You\'re all caught up.</div>')}
function profile(){return `<h2>Profile</h2><div class="card"><p>Username: <b>${esc(me.name)}</b></p><p>Roll number: <b>${esc(me.id)}</b></p><br><button class="btn sec" onclick="go('home')">Back</button></div>`}
// ---- staff
async function act(id,a){try{await api('POST','/queue/'+id+'/'+a);await sync();render()}catch(e){toast(e.message)}}
async function callNext(){try{await api('POST','/queue/call-next');await sync();render()}catch(e){toast(e.message)}}
const PJ='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
async function pdfjs(){if(!window.pdfjsLib)await new Promise((r,j)=>{const x=document.createElement('script');x.src=PJ+'pdf.min.js';x.onload=r;x.onerror=j;document.head.appendChild(x)});pdfjsLib.GlobalWorkerOptions.workerSrc=PJ+'pdf.worker.min.js';return pdfjsLib}
async function showFile(b,f,box,alive){
if(f.ext=='pdf'){try{const L=await pdfjs(),pdf=await L.getDocument({data:new Uint8Array(await b.arrayBuffer()),isEvalSupported:false}).promise;
for(let i=1;i<=pdf.numPages&&alive();i++){const pg=await pdf.getPage(i),w=Math.min(box.clientWidth-20,900),v0=pg.getViewport({scale:1}),v=pg.getViewport({scale:w/v0.width*(devicePixelRatio||1)}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;c.style.cssText=`width:${w}px;max-width:100%;height:auto;background:#fff;margin:6px auto;display:block`;c.setAttribute('aria-label','Page '+i);box.appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:v}).promise}return}catch(err){const u=URL.createObjectURL(b);box.innerHTML=`<iframe src="${u}" title="Preview" style="width:100%;height:75vh;border:0;background:#fff;border-radius:8px"></iframe><p style="color:#fff;font-size:.85rem;margin:6px 0">If the document does not appear, <a href="${u}" target="_blank" rel="noopener" style="color:#fff">open it in a new tab</a> or use Download. (Viewer note: ${esc(err&&err.message||'pdf.js unavailable')})</p>`;return}}
if(/jpe?g|png/.test(f.ext)){const im=new Image();im.alt='Preview';im.src=await b64(b);im.style.cssText='max-width:100%;display:block;margin:auto;background:#fff';box.appendChild(im);return}
box.innerHTML='<div class="card">A visual preview isn\'t available for this file type here.</div>'}
async function prev(oid,i){const o=S.q.find(x=>x.id==oid),f=o.files[i];
const m=document.createElement('div');m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:30;display:flex;flex-direction:column;gap:8px;padding:12px';m.setAttribute('role','dialog');
m.innerHTML=`<div class="row sp" style="color:#fff"><b>${esc(f.name)}</b><button class="btn sm" id="pc">Close</button></div><div id="pb" style="flex:1;overflow:auto;background:#555;border-radius:8px;padding:8px"><p style="color:#fff">Loading preview…</p></div>`;
document.body.appendChild(m);let alive=true;m.querySelector('#pc').onclick=()=>{alive=false;m.remove()};
const box=m.querySelector('#pb'),b=await fget(f.fid,true);
if(!b){box.innerHTML='<div class="card">Could not load this file. Please try again.</div>';return}
box.innerHTML='';sync().then(render).catch(()=>{});await showFile(b,f,box,()=>alive)}
async function dl(oid,i){const f=S.q.find(x=>x.id==oid).files[i],b=await fget(f.fid,true);if(!b)return toast('File not available on this device');const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);toast('Downloading '+f.name)}
function sdet(o){return `<b>${R(o.total)}</b> estimated${detail(o)}`+o.files.map((f,i)=>`<div class="row sp card" style="margin:6px 0;padding:8px"><span>📄 ${esc(f.name)} · ${f.ext.toUpperCase()} · ${sz(f.size)} ${f.seen?'<span class="tag ok">✓ Previewed</span>':''}</span><div class="row"><button class="btn sec sm" onclick="prev(${o.id},${i})">Preview</button><button class="btn sec sm" onclick="dl(${o.id},${i})">⬇ Download</button></div></div>`).join('')+(o.status=='pending'?`<p class="mut">Preview every file, then accept or reject the order.</p>`:'')}
function sdash(){const c=s=>S.q.filter(x=>x.status==s).length,l=S.q.filter(x=>!['completed','cancelled','rejected'].includes(x.status)).sort((a,b)=>a.token-b.token),st=(b,t)=>`<div><b>${b}</b><span>${t}</span></div>`;
return `<h2>Staff Queue</h2><div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(78px,1fr))">${st(c('pending'),'TO REVIEW')}${st(c('waiting'),'WAITING')}${st(S.q.filter(x=>['called','processing','printing','binding'].includes(x.status)).length,'PROCESSING')}${st(c('ready'),'READY')}${st(c('completed'),'DONE')}</div>
<div class="card row sp"><div><span class="mut">Now serving</span><b style="font-size:2rem;display:block;color:var(--pri)">#${S.serving}</b></div><div class="row"><button class="btn" onclick="callNext()">Call Next</button><button class="btn ${S.shop.open?'bad':'sec'}" onclick="setOpen(!S.shop.open)">${S.shop.open?'Close shop':'Open shop'}</button></div></div>
<div class="card tw"><table><tr><th>Token</th><th>Student</th><th>Type</th><th>Joined</th><th>Status</th><th>Action</th></tr>${l.length?l.map(o=>`<tr><td><b>#${o.token}</b></td><td>${esc(o.name)}<br><span class="mut">${o.sid}</span></td><td>${{s:'Stationery',p:'Printing',pb:'Print + Bind'}[ordType(o)]}</td><td>${new Date(o.joined).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</td><td>${tg(o.status)}</td><td><div class="row">${btns(o)}</div></td></tr><tr><td colspan="6">${sdet(o)}</td></tr>`).join(''):'<tr><td colspan="6" class="mut">Queue is empty.</td></tr>'}</table></div>`}
function btns(o){const b=(a,t,d)=>`<button class="btn sm" ${d?'disabled title="Preview all files first"':''} onclick="act(${o.id},'${a}')">${t}</button>`,s=o.status,p=o.files.length>0;let r='';
if(s=='pending')r=b('accept','Accept',o.files.some(f=>!f.seen))+`<button class="btn bad sm" onclick="rejectOrder(${o.id})">Reject</button>`;
if(s=='waiting')r=b('call','Call')+`<button class="btn bad sm" onclick="act(${o.id},'skip')">Skip</button>`;
if(s=='called')r=b('process','Process')+`<button class="btn bad sm" onclick="act(${o.id},'skip')">Skip</button>`;
if(s=='processing')r=p?b('printing','Printing'):b('ready','Ready');
if(s=='printing')r=o.binding!='none'?b('binding','Binding'):b('ready','Ready');
if(s=='binding')r=b('ready','Ready');if(s=='ready')r=b('complete','Complete');return r}
function inv(){const p=S.price,t=S.shop.t,f=(l,o,k,r)=>`<div><label>${l}</label><input type="number" min="0" value="${o[k]}" onchange="${r}('${k}',this.value)"></div>`;
return `<h2>Shop Management</h2><div class="card row sp"><div><h3>Shop status</h3><span class="tag ${S.shop.open?'ok':'err'}">${S.shop.open?'OPEN':'CLOSED'}</span></div><button class="btn ${S.shop.open?'bad':'sec'}" onclick="setOpen(!S.shop.open)">${S.shop.open?'Close shop':'Open shop'}</button></div>
<div class="card"><h3>Printing &amp; binding prices (₹)</h3><div class="grid">${f('B&amp;W per page',p,'bw','setP')}${f('Color per page',p,'color','setP')}${f('Spiral binding (per copy)',p,'spiral','setP')}${f('Thermal binding (per copy)',p,'thermal','setP')}</div></div>
<div class="card"><h3>Average service time (min)</h3><div class="grid">${f('Stationery',t,'s','setT')}${f('Printing',t,'p','setT')}${f('Printing + binding',t,'b','setT')}</div></div>
<h3>Stationery inventory</h3><div class="card tw"><table><tr><th>Item</th><th>Category</th><th>Price (₹)</th><th>Stock</th><th>Status</th></tr>${S.items.map(i=>`<tr><td>${i.icon} ${i.name}</td><td>${i.cat}</td><td><input type="number" min="0" value="${i.price}" style="width:80px" onchange="ed(${i.id},'price',this.value)" aria-label="${i.name} price"></td><td><input type="number" min="0" value="${i.stock}" style="width:80px" onchange="ed(${i.id},'stock',this.value)" aria-label="${i.name} stock"></td><td><span class="tag ${i.stock>0?(i.stock<10?'warn':'ok'):'err'}">${i.stock>0?(i.stock<10?'Low stock':'Available'):'Unavailable'}</span></td></tr>`).join('')}</table></div>
<div class="card"><h3>Add item</h3><div class="grid"><input id="an" placeholder="Name" aria-label="Name"><input id="ac" placeholder="Category" aria-label="Category"><input id="ap" type="number" placeholder="Price" aria-label="Price"><input id="as" type="number" placeholder="Stock" aria-label="Stock"></div><br><button class="btn" onclick="addItem()">Add item</button></div>
`}
async function setP(k,v){try{await api('PUT','/pricing',{[k]:Math.max(0,+v||0)});await sync();toast('Saved')}catch(e){toast(e.message)}}
async function setT(k,v){try{await api('PUT','/shop',{[k]:Math.max(0,+v||0)});await sync();toast('Saved')}catch(e){toast(e.message)}}
async function setOpen(o){try{await api('PUT','/shop',{open:o});await sync();render()}catch(e){toast(e.message)}}
async function ed(id,k,v){try{await api('PUT','/items/'+id,{[k]:Math.max(0,+v||0)});await sync();render();toast('Updated')}catch(e){toast(e.message)}}
async function addItem(){const n=$('an').value.trim();if(!n)return toast('Please enter a name');try{await api('POST','/items',{name:n,category:$('ac').value||'Other',price:+$('ap').value||0,stock:+$('as').value||0});await sync();render()}catch(e){toast(e.message)}}
function ana(){const td=new Date().toDateString().slice(4,10),T=S.q.filter(o=>dt(o)==td),dn=T.filter(o=>o.status=='completed'),live=T.filter(o=>ACT.includes(o.status)||o.status=='ready'),sum=a=>a.reduce((x,o)=>x+o.total,0);
const scOf=o=>o.sc??stCost(o.items),earned=sum(dn),stR=dn.reduce((a,o)=>a+scOf(o),0),good=T.filter(o=>!['cancelled','rejected','skipped'].includes(o.status)),min=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)+' min':'—';
const cnt=k=>{const m={};k.forEach(x=>m[x]=(m[x]||0)+1);return Object.entries(m).sort((a,b)=>b[1]-a[1])};
const bars=(e,f=v=>v)=>{const mx=Math.max(1,...e.map(x=>x[1]));return e.length?e.map(x=>`<div class="row sp"><span>${x[0]}</span><b>${f(x[1])}</b></div><div class="bar"><i style="width:${x[1]/mx*100}%"></i></div>`).join(''):'<p class="mut">No data yet.</p>'};
const pg=(col)=>good.flatMap(o=>o.files).filter(f=>(f.color=='Color')==col).reduce((a,f)=>a+(parseRange(f.range,f.pages)||0)*f.copies,0);
const hrs=cnt(T.map(o=>new Date(o.joined).getHours())).sort((a,b)=>a[0]-b[0]),peak=cnt(T.map(o=>new Date(o.joined).getHours()))[0];
const st=(b,t)=>`<div><b>${b}</b><span>${t}</span></div>`;
const types=cnt(good.map(o=>({s:'Stationery',p:'Printing',pb:'Print + Binding'}[ordType(o)]))),bind=cnt(good.filter(o=>o.binding!='none').map(o=>o.binding)),its=cnt(good.flatMap(o=>o.items.flatMap(i=>Array(i.qty).fill(S.items.find(x=>x.id==i.id).name)))).slice(0,5);
return `<h2>Analytics · Today</h2><div class="card" style="background:var(--okb)"><span class="mut">TOTAL EARNED TODAY</span><b style="font-size:2.6rem;display:block;color:var(--ok)">${R(earned)}</b><span class="mut">From ${dn.length} completed order(s) · ${R(sum(live))} more expected from ${live.length} active order(s)</span></div>
<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${st(T.length,'ORDERS TODAY')}${st(dn.length,'COMPLETED')}${st(good.length?R(Math.round(sum(good)/good.length)):'—','AVG ORDER VALUE')}${st(min(T.filter(o=>o.ca).map(o=>(o.ca-o.joined)/6e4)),'AVG WAIT')}${st(min(T.filter(o=>o.ca&&o.ra).map(o=>(o.ra-o.ca)/6e4)),'AVG PROCESSING')}${st(peak?peak[0]+':00':'—','PEAK HOUR')}${st(pg(false),'B&amp;W PAGES')}${st(pg(true),'COLOR PAGES')}${st(T.filter(o=>o.status=='rejected').length+' / '+T.filter(o=>o.status=='skipped'||o.status=='cancelled').length,'REJECTED / SKIPPED')}</div>
<div class="grid"><div class="card"><h3>Revenue by category</h3>${bars([['Printing &amp; binding',earned-stR],['Stationery',stR]].filter(x=>earned),R)}</div><div class="card"><h3>Orders per hour</h3>${bars(hrs.map(h=>[h[0]+':00',h[1]]))}</div><div class="card"><h3>Order types</h3>${bars(types)}</div><div class="card"><h3>Binding types</h3>${bars(bind)}</div><div class="card"><h3>Top stationery</h3>${bars(its)}</div></div>`}
// ---- boot
(async()=>{try{if(ls.get('qe_tok')){me=await api('GET','/auth/me');view=me.role=='STUDENT'?'home':'sdash';await sync()}}catch(e){setTok('');me=null}shell()})();
setInterval(async()=>{if(!me)return;try{await sync()}catch(e){return}if(!['print','shop','inv'].includes(view)&&!(document.activeElement&&/INPUT|SELECT/.test(document.activeElement.tagName)))shell()},5000);
