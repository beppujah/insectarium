import { clamp } from '../core/util.js';
import { N, WCEIL } from './constants.js';
import { G, blocked, cellAt, insects, lv } from './level.js';

const SPR={};
function sprite(id,draw){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');draw(x);
 const d=x.getImageData(0,0,64,64).data;SPR[id]={canvas:c,data:d,url:c.toDataURL()};}
const E=(x,cx,cy,rx,ry,col,rot=0)=>{x.fillStyle=col;x.beginPath();x.ellipse(cx,cy,rx,ry,rot,0,7);x.fill();};
const L=(x,pts,col,w=2)=>{x.strokeStyle=col;x.lineWidth=w;x.lineCap='round';x.beginPath();x.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)x.lineTo(pts[i],pts[i+1]);x.stroke();};
sprite('formica',x=>{const k='#2a1a10';[[22,48,30,61],[26,48,26,62],[30,48,36,61]].forEach(p=>L(x,[p[0],p[1],p[0]-4,p[1]+6,p[2],p[3]],k,2));
 E(x,44,46,12,9,'#3a2216');E(x,26,46,6,4.5,k);E(x,13,43,6,5.5,k);L(x,[10,39,4,28,1,30],k,1.6);L(x,[13,38,12,27,8,25],k,1.6);E(x,46,42,4,2,'#7a5640');});
sprite('coccinella',x=>{const k='#140d0a';[[22,52,16,62],[32,54,32,63],[42,52,48,62]].forEach(p=>L(x,[p[0],p[1],p[2],p[3]],k,2));
 E(x,14,50,8,7,k);E(x,34,46,21,15,'#cf2a1f');L(x,[34,32,34,61],k,1.6);
 [[25,40],[43,40],[22,52],[46,52],[34,50]].forEach(p=>E(x,p[0],p[1],3.4,3.4,k));E(x,27,37,5,2.5,'#ffffff99',-.4);E(x,11,47,2,1.6,'#fff');});
sprite('farfalla',x=>{const w=(cx,cy,rx,ry,rot,col)=>{E(x,cx,cy,rx+2,ry+2,'#1b120c',rot);E(x,cx,cy,rx,ry,col,rot);};
 w(18,22,15,13,-.5,'#ef8a1d');w(46,22,15,13,.5,'#ef8a1d');w(21,42,10,9,.4,'#e06a12');w(43,42,10,9,-.4,'#e06a12');
 [[10,14],[54,14],[14,26],[50,26]].forEach(p=>E(x,p[0],p[1],2.4,2.4,'#fff6e0'));E(x,32,32,2.5,18,'#1b120c');L(x,[31,14,24,4],'#1b120c',1.4);L(x,[33,14,40,4],'#1b120c',1.4);});
sprite('ape',x=>{E(x,30,22,12,7,'#d8f0ffaa',-.4);E(x,40,22,10,6,'#d8f0ff88',.4);
 x.save();x.beginPath();x.ellipse(36,40,17,12,0,0,7);x.clip();x.fillStyle='#f2b81c';x.fillRect(0,0,64,64);x.fillStyle='#1d140c';[28,38,48].forEach(s=>x.fillRect(s,20,5,40));x.restore();
 E(x,16,40,8,8,'#1d140c');E(x,13,38,3,3.5,'#3b2a1a');L(x,[12,33,6,24],'#1d140c',1.5);L(x,[53,40,58,42],'#1d140c',2);
 [[26,50,22,60],[34,51,34,61],[42,50,46,60]].forEach(p=>L(x,p,'#1d140c',1.6));});
sprite('cavalletta',x=>{const g='#5d9a2a',d='#3e6d1a';L(x,[24,48,18,62],d,2);L(x,[30,48,30,62],d,2);
 E(x,32,46,20,6,g);E(x,13,43,7,7.5,g,.2);E(x,10,41,2.2,2.6,'#1a2a0a');L(x,[9,36,2,8],d,1.3);L(x,[12,36,16,6],d,1.3);
 L(x,[38,46,50,28,58,60],d,4);L(x,[38,46,50,28],g,3);E(x,44,44,6,3,'#7bbf3a');});
sprite('scarabeo',x=>{const k='#0f1a14';[[20,54,14,63],[32,56,32,63],[44,54,50,63]].forEach(p=>L(x,p,k,2.2));
 const gr=x.createLinearGradient(14,30,50,60);gr.addColorStop(0,'#4fb38b');gr.addColorStop(.5,'#1e5e6f');gr.addColorStop(1,'#14283f');
 x.fillStyle=gr;x.beginPath();x.ellipse(36,46,20,14,0,0,7);x.fill();E(x,14,48,7,6,k);L(x,[10,46,4,36,8,30],k,3);L(x,[36,33,36,59],'#0a1410',1.4);E(x,30,38,7,3,'#ffffff55',-.3);});
sprite('libellula',x=>{[[22,28,9,24,-.2],[30,28,9,22,.15],[22,40,9,22,.2],[30,40,9,20,-.15]].forEach(w=>E(x,w[0],w[1]-((w[1]<34)?12:-12),w[2]-2,w[3]/2+2,'#cfe9ff66',w[4]));
 E(x,12,34,6,6,'#2e8d4f');E(x,10,32,3,3,'#9ff2b8');E(x,24,34,7,5,'#1d4f8f');
 for(let i=0;i<8;i++)E(x,32+i*4,34,2.6,2.2,i%2?'#2a76c8':'#1f5ea3');});
sprite('lucciola',x=>{E(x,40,40,10,9,'#e9ff6a');E(x,40,40,6,5,'#ffffd0');E(x,26,38,10,6,'#2c2016');E(x,16,36,5,4.5,'#d07a3a');L(x,[14,32,8,24],'#2c2016',1.4);
 [[22,43,18,52],[28,44,28,53]].forEach(p=>L(x,p,'#2c2016',1.6));E(x,26,32,8,4,'#ffffff44');});
function updateInsects(dt){
 for(const b of insects){const sp=b.sp;
  b.dir+=(Math.random()-.5)*dt*2.4;
  let sp2=sp.speed;if(sp.id==='coccinella'||sp.id==='scarabeo')sp2*=(.5+.5*Math.sin(G.t*.7+b.ph));
  const nx=b.x+Math.cos(b.dir)*sp2*dt,ny=b.y+Math.sin(b.dir)*sp2*dt;
  const zc=sp.fly?b.z:.01;
  const nt=cellAt(nx,ny),wrongWater=lv.key==='surf'&&!sp.fly&&(sp.habitat==='water'?nt!==14:nt===14);
  if(wrongWater||blocked(nx,ny,zc+.05)||nx<1.5||ny<1.5||nx>N-1.5||ny>N-1.5){b.dir+=Math.PI*(.5+Math.random());}
  else{b.x=nx;b.y=ny;}
  if(sp.fly){b.z=b.z0+Math.sin(G.t*1.3+b.ph)*(sp.swim?.35:.18);if(sp.swim)b.z=clamp(b.z,.1,WCEIL-.2);}
  if(sp.hop&&!lv.water){b.hopT-=dt;if(b.hopT<0&&b.z<=0){b.vz=2.2;b.hopT=1.5+Math.random()*3;b.dir+=Math.random()-.5;}
   b.vz-=6*dt;b.z=Math.max(0,b.z+b.vz*dt);if(b.z>0){const fx=b.x+Math.cos(b.dir)*1.6*dt,fy=b.y+Math.sin(b.dir)*1.6*dt;if(!blocked(fx,fy,b.z))(b.x=fx,b.y=fy);}}
 }
}
sprite('rana',x=>{const g='#5a9a3a',d='#2f5a1c';
 E(x,40,56,16,5,d);L(x,[50,52,58,60,46,62],d,4);E(x,34,46,20,13,g);E(x,30,40,14,7,'#7abf4a');
 for(const[px,py]of[[38,44],[44,50],[30,50]])E(x,px,py,2.5,2,d);E(x,18,46,9,7,g);E(x,30,56,10,3.5,'#e8e2a0');
 E(x,18,36,6,6,'#7abf4a');E(x,18,35,4,4,'#c8a020');E(x,18,35,2.6,1.4,'#111');E(x,16,33,1.2,1,'#fff');
 L(x,[10,50,22,52],'#1e3a10',1.2);L(x,[22,52,16,62,10,62],d,3);E(x,6,47,1,1,'#1e3a10');});
sprite('gerride',x=>{const k='#2a2418';E(x,32,46,13,3,'#4a3a26');E(x,20,45,4,3,k);
 [[26,46,6,30,2,60],[30,46,22,36,18,62],[38,47,52,34,60,62],[36,47,46,40,40,62],[24,45,14,40,12,50]].forEach(p=>L(x,p,k,1.3));
 [[2,60],[18,62],[60,62],[40,62]].forEach(p=>E(x,p[0],p[1]+1,4,1.2,'rgba(220,240,255,.6)'));L(x,[18,44,10,40],k,1);});
sprite('girino',x=>{x.fillStyle='#3a3a2a';x.beginPath();x.moveTo(30,40);for(let i=0;i<=12;i++){const t=i/12;x.lineTo(30+t*32,40+Math.sin(t*6)*5*t-4*(1-t));}
 for(let i=12;i>=0;i--){const t=i/12;x.lineTo(30+t*32,40+Math.sin(t*6)*5*t+4*(1-t));}x.fill();x.fillStyle='rgba(120,120,90,.5)';x.fillRect(34,39,26,2);
 E(x,24,40,12,10,'#2e2c20');E(x,22,36,6,3,'#ffffff30');E(x,17,37,2.4,2.4,'#d8c070');E(x,17,37,1.2,1.2,'#111');});
sprite('ditisco',x=>{const k='#1a1c0e';L(x,[40,46,56,40,62,46],k,3);L(x,[38,48,52,56,62,54],k,3);[[58,42],[60,52]].forEach(p=>E(x,p[0],p[1],4,2,'#4a4a2a'));
 E(x,32,40,22,14,'#d8b040');E(x,32,40,19,12,'#3a3e1c');E(x,28,35,9,3,'#ffffff40');L(x,[32,29,32,52],'#1a1c0e',1.2);
 E(x,12,42,7,6,'#3a3e1c');E(x,9,40,2,2,'#d8b040');L(x,[20,48,14,56],k,2);E(x,46,46,4,3,'rgba(220,240,255,.85)');E(x,47,45,1.5,1,'#fff');});
sprite('notonetta',x=>{const k='#3a3020';L(x,[40,30,54,16,62,22],k,2.6);L(x,[38,28,48,12,58,10],k,2.6);[[60,20],[56,10]].forEach(p=>E(x,p[0],p[1],5,1.6,'#6a5a3a'));
 x.fillStyle='#e8e0c8';x.beginPath();x.moveTo(8,30);x.quadraticCurveTo(30,14,52,28);x.quadraticCurveTo(30,40,8,30);x.fill();
 x.fillStyle='#8a6a3a';x.beginPath();x.moveTo(10,31);x.quadraticCurveTo(30,42,50,30);x.quadraticCurveTo(30,36,10,31);x.fill();
 E(x,10,30,5,4,'#b03a2a');L(x,[20,26,18,16],k,1.4);L(x,[26,26,26,15],k,1.4);});
sprite('ninfa',x=>{const k='#3a2e18';[[22,48,14,60],[30,50,30,62],[40,50,48,61],[24,46,12,40],[38,48,56,58]].forEach(p=>L(x,p,k,1.8));
 E(x,38,46,18,8,'#6a5a30');for(let i=0;i<5;i++)L(x,[30+i*6,39,30+i*6,53],'rgba(30,24,10,.4)',1);E(x,30,40,9,3.5,'#8a7a40');
 E(x,16,44,9,7.5,'#5a4a28');E(x,11,40,4,4,'#9a8a3a');E(x,19,39,4,4,'#9a8a3a');E(x,11,40,2,2,'#2a2010');L(x,[8,50,2,54],'#6a5a30',2.5);});
sprite('grillotalpa',x=>{const b='#6b4a2e',d='#3a2414';
 L(x,[40,50,48,60,58,62],d,2.6);L(x,[28,52,26,62],d,2);L(x,[56,46,63,43],d,1);L(x,[56,48,63,51],d,1);
 E(x,38,46,20,8,b);E(x,40,40,14,4,'#a07a50bb');for(let i=0;i<4;i++)L(x,[30+i*7,40,30+i*7,53],'rgba(40,25,12,.35)',1);
 E(x,19,43,10,8.5,'#7d5838');E(x,17,39,5,2.2,'#ffffff33');E(x,9,45,5.5,5,d);L(x,[7,42,1,35],d,1.2);L(x,[8,41,4,32],d,1.2);
 x.fillStyle=d;x.beginPath();x.moveTo(14,50);x.lineTo(5,59);x.lineTo(1,56);x.lineTo(8,49);x.fill();
 [[5,59,1,63],[3,58,0,61],[6,60,4,64]].forEach(p=>L(x,p,d,1.4));});
sprite('regina',x=>{const k='#3c1a0c';[[20,50,12,62],[25,50,24,63],[30,50,36,62]].forEach(p=>L(x,[p[0],p[1],p[2]-2,p[3]-6,p[2],p[3]],k,2));
 E(x,44,44,17,13,'#6a3118');for(let i=0;i<4;i++)E(x,36+i*6,44,1.3,11-Math.abs(i-1.5)*2,'rgba(30,10,4,.45)');E(x,40,38,8,3,'#ffffff30');
 E(x,25,43,7,6,'#7a3a1c');E(x,24,38,5,2,'#d8e6ff55');E(x,12,41,6.5,6,'#4a2010');L(x,[9,37,3,27,0,29],k,1.5);L(x,[12,36,11,26,7,24],k,1.5);
 [[56,59],[60,61],[52,61]].forEach(p=>E(x,p[0],p[1],3,2,'#f4f0e0'));});
sprite('larva',x=>{x.lineCap='round';x.strokeStyle='#efe4cc';x.lineWidth=17;x.beginPath();x.arc(30,40,14,-.15*Math.PI,1.25*Math.PI);x.stroke();
 x.strokeStyle='rgba(150,120,90,.45)';x.lineWidth=1;for(let i=0;i<9;i++){const a=-.15*Math.PI+i*.16*Math.PI;x.beginPath();x.moveTo(30+Math.cos(a)*6,40+Math.sin(a)*6);x.lineTo(30+Math.cos(a)*22,40+Math.sin(a)*22);x.stroke();}
 E(x,16,30,5,7,'rgba(110,100,95,.5)',-.6);E(x,44,32,8,7.5,'#c47a2a');E(x,46,30,3,2,'#ffffff55');L(x,[48,37,52,40],'#3a200c',2);
 [[38,44,40,50],[34,46,34,52],[30,47,28,53]].forEach(p=>L(x,p,'#b07030',1.5));});
sprite('cicala',x=>{const d='#6e4a20';L(x,[36,52,40,62],d,2);L(x,[46,50,52,61],d,2);
 E(x,38,44,17,11,'#a8743a');for(let i=0;i<4;i++)L(x,[38+i*5,35,38+i*5,54],'rgba(80,50,20,.4)',1);E(x,28,37,9,4,'#c08a48');
 E(x,17,41,9,8.5,'#9a6830');E(x,12,37,3.2,3.2,'#4a2c10');E(x,15,35,3,1.5,'#ffffff40');
 L(x,[18,48,10,58,4,53],d,3.2);L(x,[4,53,2,49],d,2);L(x,[26,51,22,62],d,2);
 x.fillStyle='rgba(70,45,20,.5)';[[44,50],[30,46],[50,40]].forEach(p=>x.fillRect(p[0],p[1],3,2));});
// pollen floating in the air
const MOTES=Array.from({length:140},()=>({x:0,y:0,z:0,ph:Math.random()*6.28,init:false}));

export { SPR, updateInsects, MOTES };
