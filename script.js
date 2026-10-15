'use strict';
const $=s=>document.querySelector(s),TAU=Math.PI*2,R=300,NL=12;
const COL=['#00f5ff','#ff9f1c','#b967ff','#39ff88','#ff4d6d','#4d7cff'];
const ITEMS=[
{id:'speed',n:'Speed Boost',i:'⚡',c:40,d:'Selected ball ×1.8 speed for 6s'},
{id:'slow',n:'Slow Motion',i:'🐌',c:60,d:'World slows to 40% for 6s'},
{id:'shield',n:'Shield',i:'🛡️',c:50,d:'Selected ball survives one red hit'},
{id:'life',n:'Extra Life',i:'❤️',c:80,d:'Use to gain +1 life'},
{id:'multi',n:'Multi-Ball',i:'🔮',c:70,d:'Adds a new ball (max 6)'},
{id:'magnet',n:'Magnet',i:'🧲',c:45,d:'Coins fly to balls for 10s'},
{id:'explosion',n:'Explosion',i:'💥',c:90,d:'Destroys rings near selected ball'},
{id:'prec',n:'Precision',i:'🎯',c:35,d:'Aim guide + 60% speed for 8s'},
{id:'bonus',n:'Bonus Points',i:'✨',c:55,d:'Score ×2 for 10s'},
{id:'unlock',n:'Unlock Level',i:'🔓',c:150,d:'Unlocks the next locked level'}];
const def={coins:60,best:0,unlocked:1,level:1,stars:{},inv:{},mute:false};
let S=Object.assign({},def,JSON.parse(localStorage.getItem('nrb')||'{}'));
const save=()=>localStorage.setItem('nrb',JSON.stringify(S));
let AC;function snd(f,d=.08,t='sine',v=.05){if(S.mute)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(n+d)}catch(e){}}
let mode='classic',G={paused:true,over:true,balls:[],rings:[],reds:[],coins:[],parts:[],txt:[],fx:{}};
const MI={classic:'Clear every ring segment. Lose lives to red balls.',challenge:'Clear all rings before the timer runs out.',endless:'Waves never stop. Rings get faster each wave.'};
function go(id){document.querySelectorAll('.scr').forEach(e=>e.classList.toggle('on',e.id==id));if(id=='lv')drawLv();if(id=='menu')drawMenu();if(id=='set')drawSet()}
function drawMenu(){$('#mi').textContent=MI[mode];$('#mc').innerHTML='🪙 '+S.coins+' · Best '+S.best+' · Level '+S.level}
document.querySelectorAll('.mode').forEach(b=>b.onclick=()=>{mode=b.dataset.m;document.querySelectorAll('.mode').forEach(x=>x.classList.toggle('on',x==b));drawMenu()});
$('#play').onclick=()=>startGame(mode,S.level);
const diff=l=>l<4?'Easy':l<7?'Medium':l<10?'Hard':'Insane';
function drawLv(){$('#lvc').textContent='🪙 '+S.coins;let h='';for(let l=1;l<=NL;l++){const lk=l>S.unlocked,st=S.stars[l]||0;h+=`<div class="lc ${lk?'lock':st?'done':'cur'}" data-l="${l}"><h3>${lk?'🔒':l}</h3><small>${diff(l)}</small><div class="st">${'★'.repeat(st)}${'☆'.repeat(3-st)}</div><div class="bar"><i style="width:${st/3*100}%"></i></div><small>Reward 🪙${20+l*5}+</small></div>`}$('#lvg').innerHTML=h;
document.querySelectorAll('.lc').forEach(c=>c.onclick=()=>{const l=+c.dataset.l;if(l>S.unlocked){snd(120,.15,'square');return}S.level=l;save();startGame(mode,l)})}
function openShop(){go('shop');drawShop()}
function drawShop(){$('#shc').textContent='🪙 '+S.coins;$('#shg').innerHTML=ITEMS.map(t=>`<div class="sc ${S.coins<t.c?'lk':''}"><div class="ic">${t.i}</div><b>${t.n}</b><p>${t.d}</p><p>${t.id=='unlock'?'One-time':'Owned: '+(S.inv[t.id]||0)}</p><button class="b" data-id="${t.id}" ${S.coins<t.c?'disabled':''}>Buy 🪙${t.c}</button></div>`).join('');
document.querySelectorAll('#shg .b').forEach(b=>b.onclick=()=>{const t=ITEMS.find(x=>x.id==b.dataset.id);if(S.coins<t.c)return;
if(t.id=='unlock'){if(S.unlocked>=NL){alert('All levels unlocked');return}S.unlocked++}else S.inv[t.id]=(S.inv[t.id]||0)+1;
S.coins-=t.c;save();snd(660,.12,'triangle');snd(880,.15,'triangle');drawShop()})}
function drawSet(){$('#mute').textContent=S.mute?'🔇 Sound: OFF':'🔊 Sound: ON'}
$('#mute').onclick=()=>{S.mute=!S.mute;save();drawSet()};
$('#rst').onclick=()=>{if(confirm('Erase all progress?')){S=Object.assign({},def,{stars:{},inv:{}});save();drawSet();alert('Progress reset')}};

// ---------- game ----------
const cv=$('#cv'),ctx=cv.getContext('2d');let W=0,H=0,sc=1;
function rs(){const w=$('#wrap'),d=devicePixelRatio||1;W=w.clientWidth;H=w.clientHeight;cv.width=W*d;cv.height=H*d;sc=Math.min(W,H)/(2*(R+16))*d}
addEventListener('resize',rs);
function cfg(L){return{n:Math.min(8,3+(L>>1)),reds:Math.floor((L-1)/2),w:.3+.07*L,gap:Math.max(.08,.28-.02*L)}}
function mkRings(L){const c=cfg(L),a=[];for(let i=0;i<c.n;i++){const n=12+i*4,al=[];for(let k=0;k<n;k++)al.push(Math.random()>c.gap?1:0);al[0]=1;a.push({r:70+i*(185/Math.max(1,c.n-1)),t:11,n,al,rot:Math.random()*TAU,w:(i%2?-1:1)*c.w*(.6+Math.random()*.7)})}return a}
function mkBall(i){return{id:i+1,x:0,y:0,r:9,speed:140,dir:-Math.PI/2+i*.9,state:'ready',color:COL[i%6],points:0,boost:0,shield:0,inv:0}}
function mkReds(L){const a=[],n=cfg(L).reds;for(let i=0;i<n;i++){const t=Math.random()*TAU;a.push({x:Math.cos(t)*240,y:Math.sin(t)*240,r:8,speed:100+L*7,dir:t+Math.PI+(Math.random()-.5)});}return a}
function placeReady(){const n=G.balls.length;G.balls.forEach((b,i)=>{if(b.state=='ready'){b.x=0;b.y=(i-(n-1)/2)*20}})}
function startGame(m,L){G={mode:m,level:L,balls:[0,1,2].map(mkBall),rings:mkRings(L),reds:mkReds(L),coins:[],parts:[],txt:[],fx:{slow:0,magnet:0,bonus:0,prec:0},cd:0,score:0,disp:0,combo:1,comboT:0,lives:3,time:0,limit:40+cfg(L).n*9,hits:0,bounce:0,sel:0,paused:false,over:false,wave:1,dead:0,total:0,earned:0};
G.total=countSeg();placeReady();go('game');$('#pause').classList.remove('on');$('#res').classList.remove('on');rs();buildPanel();buildAbs()}
const countSeg=()=>G.rings.reduce((s,r)=>s+r.al.filter(x=>x).length,0);
function quit(){G.over=true;$('#pause').classList.remove('on');go('menu')}
function buildPanel(){$('#panel').innerHTML=G.balls.map((b,i)=>`<div class="card" data-i="${i}" style="--cc:${b.color}"><b style="color:${b.color}">● Ball ${b.id}</b> <span class="sts"></span><div><span class="sv">${b.speed}</span> <small>px/s</small></div><input type="range" min="40" max="400" value="${b.speed}"><div class="row"><button class="b" data-a="slow">🐢</button><button class="b" data-a="norm">●</button><button class="b" data-a="fast">🐇</button></div><div class="row"><button class="b" data-a="play">▶</button><button class="b" data-a="reset">↺</button><button class="b" data-a="l">⟲</button><button class="b" data-a="r">⟳</button></div></div>`).join('');updSel()}
const panel=$('#panel');
panel.addEventListener('input',e=>{if(e.target.type!='range')return;const i=+e.target.closest('.card').dataset.i;G.balls[i].speed=+e.target.value;G.sel=i;updSel()});
panel.addEventListener('click',e=>{const c=e.target.closest('.card');if(!c)return;const i=+c.dataset.i,b=G.balls[i];G.sel=i;updSel();const a=e.target.dataset.a;if(!a)return;
const setS=v=>{b.speed=v;c.querySelector('input').value=v};
if(a=='slow')setS(80);if(a=='norm')setS(140);if(a=='fast')setS(260);
if(a=='play'){if(b.state=='moving')b.state='paused';else if(b.state!='done'){b.state='moving';snd(440,.1,'square')}}
if(a=='reset'){b.state='ready';b.boost=b.shield=0;G.balls.length;placeReady();b.x=0;b.y=(i-(G.balls.length-1)/2)*20}
if(a=='l')b.dir-=.26;if(a=='r')b.dir+=.26});
function updSel(){document.querySelectorAll('.card').forEach((c,i)=>{c.classList.toggle('sel',i==G.sel);const b=G.balls[i];c.querySelector('.sv').textContent=b.speed*(b.boost>0?1.8:1)|0;c.querySelector('.sts').textContent=({ready:'⏺ ready',moving:'▶ moving',paused:'⏸ paused',done:'✔ done'})[b.state]+(b.shield?' 🛡':'')})}
function buildAbs(){$('#abs').innerHTML='<button class="b" id="gp">⏸</button>'+ITEMS.filter(t=>t.id!='unlock').map(t=>`<button class="b" data-id="${t.id}" title="${t.n}">${t.i}<em>${S.inv[t.id]||0}</em></button>`).join('');
$('#gp').onclick=()=>{G.paused=true;$('#pause').classList.add('on')};
document.querySelectorAll('#abs [data-id]').forEach(b=>b.onclick=()=>useAb(b.dataset.id))}
function useAb(id){const g=G;if(g.over||g.paused)return;if(g.cd>0||!(S.inv[id]>0)){snd(120,.1,'square');return}
const b=g.balls[g.sel];
if(id=='speed')b.boost=6;else if(id=='slow')g.fx.slow=6;else if(id=='shield')b.shield=1;else if(id=='life')g.lives++;
else if(id=='multi'){if(g.balls.length>=6){snd(120,.1,'square');return}g.balls.push(mkBall(g.balls.length));placeReady();buildPanel()}
else if(id=='magnet')g.fx.magnet=10;else if(id=='prec')g.fx.prec=8;else if(id=='bonus')g.fx.bonus=10;
else if(id=='explosion'){g.rings.forEach(r=>{for(let k=0;k<r.n;k++)if(r.al[k]){const a=r.rot+(k+.5)/r.n*TAU,x=Math.cos(a)*r.r,y=Math.sin(a)*r.r;if(Math.hypot(x-b.x,y-b.y)<100){r.al[k]=0;kill(r,k,b,1)}}});boom(b.x,b.y,'#ff9f1c',40);snd(80,.4,'sawtooth',.1)}
S.inv[id]--;save();g.cd=1.5;snd(900,.15,'triangle');buildAbs()}
function pop(x,y,s,c){G.txt.push({x,y,s,c,l:1})}
function boom(x,y,c,n){for(let i=0;i<n&&G.parts.length<500;i++){const a=Math.random()*TAU,v=40+Math.random()*160;G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,c})}}
function kill(r,k,b,silent){const a=r.rot+(k+.5)/r.n*TAU,x=Math.cos(a)*r.r,y=Math.sin(a)*r.r;
if(b){const pts=10*G.combo*(G.fx.bonus>0?2:1);G.score+=pts;b.points+=pts;G.combo=Math.min(10,G.combo+1);G.comboT=2.2;G.hits++;pop(x,y,'+'+pts,b.color)}
G.dead++;boom(x,y,'#00f5ff',10);if(Math.random()<.45)G.coins.push({x,y,l:9});if(!silent)snd(500+G.combo*40,.07,'triangle')}
function refl(e,a,inside){const vx=Math.cos(e.dir),vy=Math.sin(e.dir),nx=Math.cos(a),ny=Math.sin(a),dp=vx*nx+vy*ny;if((dp>0)==inside)e.dir=Math.atan2(vy-2*dp*ny,vx-2*dp*nx)}
function hitRings(e,pl){const d=Math.hypot(e.x,e.y),a=Math.atan2(e.y,e.x);
for(const r of G.rings){if(Math.abs(d-r.r)<e.r+r.t/2){const k=Math.floor((((a-r.rot)%TAU)+TAU)%TAU/TAU*r.n);
if(r.al[k]){r.al[k]=0;kill(r,k,pl?e:null);const ins=d<r.r;refl(e,a,ins);const p=r.r+(ins?-1:1)*(e.r+r.t/2+1);e.x=Math.cos(a)*p;e.y=Math.sin(a)*p;return}}}}
function mv(e,sp,dt,pl){const n=Math.max(1,Math.ceil(sp*dt/4)),h=dt/n;for(let i=0;i<n;i++){e.x+=Math.cos(e.dir)*sp*h;e.y+=Math.sin(e.dir)*sp*h;
if(Math.hypot(e.x,e.y)>R-e.r){const a=Math.atan2(e.y,e.x);refl(e,a,true);e.x=Math.cos(a)*(R-e.r-.5);e.y=Math.sin(a)*(R-e.r-.5);if(pl){G.bounce++;snd(220,.04)}}else hitRings(e,pl)}}
function upd(dt){const g=G;if(g.paused||g.over)return;g.time+=dt;const k=g.fx.slow>0?.4:1,sd=dt*k;
for(const f in g.fx)g.fx[f]=Math.max(0,g.fx[f]-dt);g.cd=Math.max(0,g.cd-dt);g.comboT-=dt;if(g.comboT<=0)g.combo=1;
g.rings.forEach(r=>r.rot+=r.w*sd*(1+(g.wave-1)*.15));
for(const b of g.balls){b.inv=Math.max(0,b.inv-dt);b.boost=Math.max(0,b.boost-dt);if(b.state=='moving')mv(b,b.speed*(b.boost>0?1.8:1)*(g.fx.prec>0?.6:1),sd,true)}
for(const e of g.reds){mv(e,e.speed,sd,false);for(const b of g.balls){if(b.state!='moving'||b.inv>0)continue;if(Math.hypot(b.x-e.x,b.y-e.y)<b.r+e.r){b.inv=1.5;e.dir+=Math.PI;boom(b.x,b.y,'#ff4d6d',20);
if(b.shield){b.shield=0;snd(700,.2,'triangle')}else{g.lives--;b.state='ready';b.boost=0;placeReady();g.combo=1;snd(110,.3,'sawtooth',.1);if(g.lives<=0)return finish(false)}}}}
for(const c of g.coins){c.l-=dt;if(g.fx.magnet>0){let m=null,md=1e9;for(const b of g.balls){const d=Math.hypot(b.x-c.x,b.y-c.y);if(d<md){md=d;m=b}}if(m&&md<200){c.x+=(m.x-c.x)/md*230*dt;c.y+=(m.y-c.y)/md*230*dt}}
for(const b of g.balls)if(b.state=='moving'&&Math.hypot(b.x-c.x,b.y-c.y)<b.r+9){c.l=0;S.coins++;g.earned++;g.score+=5;pop(c.x,c.y,'🪙','#ffd23f');snd(1000,.06,'triangle')}}
g.coins=g.coins.filter(c=>c.l>0);
for(const p of g.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt*1.6}g.parts=g.parts.filter(p=>p.l>0);for(const t of g.txt){t.y-=30*dt;t.l-=dt}g.txt=g.txt.filter(t=>t.l>0);
if(g.mode=='challenge'&&g.time>=g.limit)return finish(false);
if(g.rings.every(r=>!r.al.some(x=>x))){if(g.mode=='endless'){g.wave++;g.level++;g.rings=mkRings(Math.min(NL+g.wave,20));g.reds=mkReds(g.level);g.total=countSeg();g.dead=0;g.score+=100;pop(0,0,'WAVE '+g.wave,'#00f5ff');snd(880,.3,'triangle')}else finish(true)}}
function finish(win){const g=G;g.over=true;g.paused=true;const acc=Math.round(g.hits/Math.max(1,g.hits+g.bounce)*100);let stars=0,rew=0;
if(win){const par=cfg(g.level).n*14;stars=1+(g.lives>=3?1:0)+(g.time<par?1:0);g.score+=Math.max(0,Math.round((par-g.time)*5))+acc*2;rew=20+g.level*5+stars*10;S.coins+=rew;S.stars[g.level]=Math.max(S.stars[g.level]||0,stars);if(g.mode!='endless'&&g.level>=S.unlocked&&g.level<NL)S.unlocked=g.level+1;snd(660,.3,'triangle');setTimeout(()=>snd(990,.4,'triangle'),200)}else snd(100,.5,'sawtooth',.1);
const nb=g.score>S.best;if(nb)S.best=g.score;save();
$('#rb').innerHTML=`<h2>${win?'LEVEL CLEAR':'GAME OVER'}</h2>${win?`<div class="st" style="font-size:36px">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div>`:''}<p>Score <b>${g.score|0}</b>${nb?' 🏆 NEW BEST':''}<br>Accuracy ${acc}% · Time ${g.time.toFixed(1)}s${win?`<br>Reward 🪙${rew}`:''}</p><div class="row"><button class="b big" id="rp">Replay</button>${win&&g.level<NL&&g.mode!='endless'?'<button class="b big" id="nx">Next Level</button>':''}<button class="b big" id="lm">Levels</button></div>`;
$('#res').classList.add('on');$('#rp').onclick=()=>startGame(g.mode,g.mode=='endless'?1:g.level);const n=$('#nx');if(n)n.onclick=()=>{S.level=g.level+1;save();startGame(g.mode,g.level+1)};$('#lm').onclick=()=>{$('#res').classList.remove('on');go('lv')}}
function draw(){const g=G,d=devicePixelRatio||1;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);if(!g.rings.length)return;
ctx.setTransform(sc,0,0,sc,cv.width/2,cv.height/2);ctx.lineCap='round';
const pr=g.total?g.dead/g.total:0;const gr=ctx.createRadialGradient(0,0,0,0,0,R);gr.addColorStop(0,'rgba(30,90,255,.35)');gr.addColorStop(1,'rgba(30,90,255,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(0,0,R*(.15+.85*pr),0,TAU);ctx.fill();
ctx.shadowColor='#00f5ff';ctx.shadowBlur=18;ctx.strokeStyle='#00f5ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
g.rings.forEach((r,i)=>{ctx.strokeStyle=i%2?'#27d3ff':'#00ffd5';ctx.lineWidth=r.t;const s=TAU/r.n;for(let k=0;k<r.n;k++)if(r.al[k]){ctx.beginPath();ctx.arc(0,0,r.r,r.rot+k*s+.02,r.rot+(k+1)*s-.02);ctx.stroke()}});
ctx.shadowColor='#ffd23f';g.coins.forEach(c=>{ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(c.x,c.y,5,0,TAU);ctx.fill()});
g.parts.forEach(p=>{ctx.globalAlpha=Math.max(0,p.l);ctx.fillStyle=p.c;ctx.fillRect(p.x-2,p.y-2,4,4)});ctx.globalAlpha=1;
ctx.shadowColor='#ff2244';ctx.shadowBlur=14;g.reds.forEach(e=>{ctx.fillStyle='#ff2244';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,TAU);ctx.fill()});
g.balls.forEach((b,i)=>{ctx.shadowColor=b.color;ctx.shadowBlur=16;if(i==g.sel&&g.fx.prec>0||i==g.sel&&b.state=='ready'){ctx.strokeStyle=b.color+'88';ctx.setLineDash([6,6]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(b.dir)*140,b.y+Math.sin(b.dir)*140);ctx.stroke();ctx.setLineDash([])}
ctx.globalAlpha=b.inv>0&&((g.time*10|0)%2)?.4:1;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,TAU);ctx.fill();ctx.globalAlpha=1;
if(b.shield){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r+4,0,TAU);ctx.stroke()}
if(i==g.sel){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,b.r+(b.shield?8:3),0,TAU);ctx.stroke()}
ctx.shadowBlur=0;ctx.fillStyle='#001';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.id,b.x,b.y+1)});
ctx.shadowBlur=0;ctx.font='bold 16px sans-serif';g.txt.forEach(t=>{ctx.globalAlpha=Math.max(0,t.l);ctx.fillStyle=t.c;ctx.fillText(t.s,t.x,t.y)});ctx.globalAlpha=1}
function hud(){const g=G;g.disp+=(g.score-g.disp)*.2;const f=g.fx,tl=g.mode=='challenge'?`<div>⏱ <b>${Math.max(0,g.limit-g.time).toFixed(0)}s</b></div>`:`<div>⏱ <b>${g.time.toFixed(0)}s</b></div>`;
$('#hud').innerHTML=`<div>Score <b>${g.disp|0}</b></div><div>Best <b>${Math.max(S.best,g.score|0)}</b></div><div>🪙 <b>${S.coins}</b></div><div>Lvl <b>${g.level}</b> ${g.mode}</div><div>Combo <b>×${g.combo}${f.bonus>0?' ×2':''}</b></div><div>❤️ <b>${g.lives}</b></div>${tl}<div>Cleared <b>${g.total?Math.round(g.dead/g.total*100):0}%</b>${f.slow>0?' 🐌':''}${f.magnet>0?' 🧲':''}${f.prec>0?' 🎯':''}</div>`}
let last=0,hc=0;function loop(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(!G.over||G.rings.length){upd(dt);draw();if(++hc%6==0&&$('#game').classList.contains('on')){hud();if(G.balls.length&&document.querySelector('.card'))updSel()}}requestAnimationFrame(loop)}
cv.addEventListener('pointerdown',e=>{const r=cv.getBoundingClientRect(),s=sc/(devicePixelRatio||1),x=(e.clientX-r.left-W/2)/s,y=(e.clientY-r.top-H/2)/s;let bi=-1,bd=40;G.balls.forEach((b,i)=>{const d=Math.hypot(b.x-x,b.y-y);if(d<bd){bd=d;bi=i}});if(bi>=0){G.sel=bi;updSel()}});
addEventListener('keydown',e=>{if(!$('#game').classList.contains('on')||G.over)return;if(e.key>='1'&&e.key<='6'&&G.balls[e.key-1]){G.sel=e.key-1;updSel()}
const b=G.balls[G.sel];if(e.key=='ArrowLeft')b.dir-=.1;if(e.key=='ArrowRight')b.dir+=.1;if(e.key==' '){e.preventDefault();b.state=b.state=='moving'?'paused':'moving'}if(e.key=='p'){G.paused=true;$('#pause').classList.add('on')}});
drawMenu();requestAnimationFrame(loop);
