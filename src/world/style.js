import { onWorld } from '../content/worlds.js';
import { rng } from '../core/util.js';
import { HEIGHT } from './constants.js';
import { TEX, mkTex } from './textures.js';

// ================= per-world look =================
// Every world reuses the same cell types, drawn its own way: where the meadow has mushrooms the desert has
// cacti, where it has clover the jungle has broad leaves, and so on. Switching world swaps the textures
// and a few heights in place.

const BASE_TEX = TEX.slice(), BASE_H = HEIGHT.slice();

// ---------- desert ----------
function dryGrass(seed){return mkTex(96,160,(x,w,h)=>{const r=rng(seed);
 for(let i=0;i<20;i++){const bx=6+r()*(w-12),bw=1.5+r()*3,top=h*(.05+r()*.55),lean=(r()-.5)*40;
  const g=x.createLinearGradient(0,h,0,top);g.addColorStop(0,`hsl(${36+r()*10},${30+r()*15}%,${30+r()*8}%)`);g.addColorStop(1,`hsl(${42+r()*10},${40+r()*20}%,${62+r()*14}%)`);
  x.fillStyle=g;x.beginPath();x.moveTo(bx-bw,h);x.quadraticCurveTo(bx-bw*.4,(h+top)/2,bx+lean,top);x.quadraticCurveTo(bx+bw*.4,(h+top)/2,bx+bw,h);x.fill();
  x.strokeStyle='rgba(90,60,30,.3)';x.lineWidth=.6;x.stroke();}});}
const sandstone=v=>mkTex(96,96,(x,w,h)=>{const r=rng(301+v);
 const pts=[];for(let i=0;i<=26;i++){const a=Math.PI*i/26;const rr=42+Math.sin(i*1.3+v)*4+Math.sin(i*3.7)*2;pts.push([48-Math.cos(a)*rr,96-Math.sin(a)*rr*(1.3+v*.25)]);}
 x.beginPath();x.moveTo(0,96);pts.forEach(p=>x.lineTo(Math.max(1,Math.min(95,p[0])),Math.max(3,p[1])));x.lineTo(96,96);x.closePath();
 const g=x.createRadialGradient(34,24,4,48,60,80);g.addColorStop(0,'#f2c68a');g.addColorStop(.5,'#c98a4e');g.addColorStop(1,'#6a3e20');x.fillStyle=g;x.fill();x.save();x.clip();
 for(let i=0;i<9;i++){const y=10+i*9+r()*4;x.strokeStyle=`rgba(${r()<.5?'120,60,25':'255,220,170'},${.25+r()*.25})`;x.lineWidth=1+r()*2;x.beginPath();x.moveTo(0,y);
  for(let k=0;k<=12;k++)x.lineTo(k*8,y+Math.sin(k*.9+i)*1.6);x.stroke();}
 for(let i=0;i<500;i++){x.fillStyle=r()<.5?'rgba(255,240,210,.14)':'rgba(70,35,15,.16)';x.fillRect(r()*96,r()*96,1,1);}
 const sh=x.createLinearGradient(0,70,0,96);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(40,20,5,.45)');x.fillStyle=sh;x.fillRect(0,0,96,96);x.restore();});
// columnar cactus: ribbed, with spines and an arm or two
const cactus=v=>mkTex(96,192,(x,w,h)=>{const r=rng(311+v);
 const col=(cx,cy0,cy1,rw)=>{const g=x.createLinearGradient(cx-rw,0,cx+rw,0);g.addColorStop(0,'#2f5a2a');g.addColorStop(.35,'#6aa04a');g.addColorStop(.6,'#4f8a3c');g.addColorStop(1,'#24461e');
  x.fillStyle=g;x.beginPath();x.moveTo(cx-rw,cy1);x.lineTo(cx-rw,cy0+rw);x.quadraticCurveTo(cx-rw,cy0,cx,cy0);x.quadraticCurveTo(cx+rw,cy0,cx+rw,cy0+rw);x.lineTo(cx+rw,cy1);x.fill();
  x.strokeStyle='rgba(20,50,20,.55)';x.lineWidth=.8;for(let k=-2;k<=2;k++){x.beginPath();x.moveTo(cx+k*rw*.38,cy0+rw*.6);x.lineTo(cx+k*rw*.38,cy1);x.stroke();}
  x.fillStyle='rgba(250,240,200,.85)';for(let y=cy0+4;y<cy1;y+=6)for(let k=-2;k<=2;k++){x.fillRect(cx+k*rw*.38-.5,y+(k&1)*3,1,1);}};
 col(48,8,192,13);
 const ay=60+r()*40;x.fillStyle='#4a8038';col(24,ay-34,ay+6,7);x.fillRect(24,ay-2,26,10);col(24,ay-34,ay+6,7);
 if(v){const by=90+r()*30;col(74,by-30,by+6,6.5);x.fillStyle='#4a8038';x.fillRect(48,by-2,26,9);col(74,by-30,by+6,6.5);}
 x.fillStyle='#f0d040';x.beginPath();x.arc(48,9,4,0,7);x.fill();x.fillStyle='#e85a8a';x.beginPath();x.arc(48,8,2.2,0,7);x.fill();});
const bleachedTwig=v=>mkTex(64,64,(x,w,h)=>{const r=rng(321+v);
 for(let y=0;y<64;y++){const l=.78+.06*Math.sin(y*.6);x.fillStyle=`rgb(${190*l|0},${178*l|0},${160*l|0})`;x.fillRect(0,y,64,1);}
 for(let i=0;i<22;i++){const y=2+r()*58,f=1+(r()*3|0),p=r()*6.28;x.strokeStyle=`rgba(${r()<.7?'90,80,65':'240,235,220'},${.3+r()*.3})`;x.lineWidth=.8+r();
  x.beginPath();for(let px=0;px<=64;px+=2){const yy=y+Math.sin(px/64*6.283*f+p);px?x.lineTo(px,yy):x.moveTo(px,yy);}x.stroke();}});
function desertFlower(petal,center){return mkTex(64,128,(x,w,h)=>{
 x.strokeStyle='#7a8a4a';x.lineWidth=2.5;x.beginPath();x.moveTo(32,128);x.bezierCurveTo(31,100,34,70,32,40);x.stroke();
 x.fillStyle='#8a9a5a';[[32,100,-1],[32,80,1]].forEach(([a,b,s])=>{x.beginPath();x.moveTo(a,b);x.quadraticCurveTo(a+s*14,b-6,a+s*18,b-16);x.quadraticCurveTo(a+s*8,b-4,a,b-3);x.fill();});
 for(let i=0;i<10;i++){const a=i/10*6.283;x.fillStyle=i%2?petal:petal;x.beginPath();x.ellipse(32+Math.cos(a)*9,36+Math.sin(a)*4,7,3,a,0,7);x.fill();
  x.strokeStyle='rgba(0,0,0,.15)';x.lineWidth=.5;x.stroke();}
 x.fillStyle=center;x.beginPath();x.ellipse(32,35,4.5,3,0,0,7);x.fill();});}
// agave-like rosette of thick blue-green leaves with spiny tips
const agave=v=>mkTex(96,96,(x,w,h)=>{const r=rng(331+v);
 const leaves=[];for(let i=0;i<14;i++)leaves.push({a:-Math.PI/2+(r()-.5)*2.6,l:30+r()*50,w:5+r()*4});leaves.sort((p,q)=>Math.abs(q.a+Math.PI/2)-Math.abs(p.a+Math.PI/2));
 for(const L of leaves){const ex=48+Math.cos(L.a)*L.l,ey=96+Math.sin(L.a)*L.l;
  const g=x.createLinearGradient(48,96,ex,ey);g.addColorStop(0,'#4a6a5a');g.addColorStop(1,'#9ac0a8');x.fillStyle=g;
  x.beginPath();x.moveTo(48-L.w,96);x.quadraticCurveTo((48+ex)/2-L.w*.6,(96+ey)/2,ex,ey);x.quadraticCurveTo((48+ex)/2+L.w*.6,(96+ey)/2,48+L.w,96);x.fill();
  x.strokeStyle='rgba(30,50,40,.45)';x.lineWidth=.6;x.stroke();x.fillStyle='#5a3a20';x.beginPath();x.arc(ex,ey,1,0,7);x.fill();}});
const sandMound=mkTex(96,96,(x,w,h)=>{const r=rng(341);
 x.beginPath();x.moveTo(0,96);x.bezierCurveTo(8,50,28,30,48,30);x.bezierCurveTo(68,30,88,50,96,96);x.closePath();
 const g=x.createLinearGradient(0,30,0,96);g.addColorStop(0,'#f0d098');g.addColorStop(1,'#a8784a');x.fillStyle=g;x.fill();x.save();x.clip();
 for(let i=0;i<900;i++){const l=.7+r()*.5;x.fillStyle=`rgba(${255*l|0},${220*l|0},${170*l|0},.5)`;x.fillRect(r()*96,28+r()*68,1,1);}x.restore();
 x.fillStyle='#4a2c14';x.beginPath();x.ellipse(48,74,20,15,0,0,7);x.fill();const hg=x.createRadialGradient(48,80,1,48,76,17);hg.addColorStop(0,'#000');hg.addColorStop(1,'#2a160a');
 x.fillStyle=hg;x.beginPath();x.ellipse(48,75,17,12.5,0,0,7);x.fill();x.fillRect(31,75,34,21);});
const sandWall=[0,1].map(v=>mkTex(64,96,(x,w,h)=>{const r=rng(351+v);x.fillStyle='#b8834a';x.fillRect(0,0,w,h);
 for(let i=0;i<12;i++){const y=r()*h,th=2+r()*6;x.fillStyle=`rgba(${r()<.5?'230,180,120':'130,80,40'},${.25+r()*.3})`;x.fillRect(0,y,64,th);}
 for(let i=0;i<500;i++){x.fillStyle=r()<.5?'rgba(255,230,190,.15)':'rgba(60,30,10,.2)';x.fillRect(r()*64,r()*96,1,1);}
 for(let i=0;i<6;i++){const px=r()*64,py=r()*96,rr=1.5+r()*3;x.fillStyle='#d8c8a8';x.beginPath();x.ellipse(px,py,rr,rr*.8,0,0,7);x.fill();}}));
// glowing quartz crystals (they replace the glowing mushrooms under the sand)
const crystals=mkTex(64,64,(x,w,h)=>{const r=rng(361);
 for(let k=0;k<6;k++){const bx=8+r()*48,top=8+r()*34,wd=3+r()*4,lean=(r()-.5)*10;
  const g=x.createLinearGradient(bx-wd,0,bx+wd,0);g.addColorStop(0,'#9ad8ff');g.addColorStop(.5,'#f4fdff');g.addColorStop(1,'#6ab0e8');x.fillStyle=g;
  x.beginPath();x.moveTo(bx-wd,64);x.lineTo(bx-wd+lean,top+5);x.lineTo(bx+lean,top);x.lineTo(bx+wd+lean,top+5);x.lineTo(bx+wd,64);x.fill();
  x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=.6;x.beginPath();x.moveTo(bx+lean,top);x.lineTo(bx+lean*.3,64);x.stroke();}});

// ---------- jungle ----------
// fern: arching fronds with paired leaflets
function fern(seed){return mkTex(128,192,(x,w,h)=>{const r=rng(seed);
 for(let f=0;f<9;f++){const bx=20+r()*88,len=90+r()*90,ang=-Math.PI/2+(r()-.5)*1.4,curve=(r()-.5)*.9,hue=95+r()*25,lit=22+r()*14;
  let px=bx,py=h,a=ang;const steps=26,st=len/steps;
  for(let i=0;i<steps;i++){const t=i/steps,nx=px+Math.cos(a)*st,ny=py+Math.sin(a)*st;
   x.strokeStyle=`hsl(${hue},45%,${lit-6}%)`;x.lineWidth=2.2*(1-t)+.5;x.beginPath();x.moveTo(px,py);x.lineTo(nx,ny);x.stroke();
   if(i>3){const ll=(1-t)*14+3;for(const s of[-1,1]){const la=a+s*1.25;x.fillStyle=`hsl(${hue+t*10},${50+t*10}%,${lit+t*18}%)`;
     x.beginPath();x.moveTo(nx,ny);x.quadraticCurveTo(nx+Math.cos(la-.3*s)*ll*.6,ny+Math.sin(la-.3*s)*ll*.6,nx+Math.cos(la)*ll,ny+Math.sin(la)*ll+2);
     x.quadraticCurveTo(nx+Math.cos(la+.3*s)*ll*.5,ny+Math.sin(la+.3*s)*ll*.5+2,nx,ny+1.5);x.fill();}}
   px=nx;py=ny;a+=curve/steps*2.2;}}});}
const mossyStone=v=>mkTex(96,96,(x,w,h)=>{const r=rng(401+v);
 const pts=[];for(let i=0;i<=28;i++){const a=Math.PI*i/28;const rr=42+Math.sin(i*1.6+v)*3;pts.push([48-Math.cos(a)*rr,96-Math.sin(a)*rr*1.25]);}
 x.beginPath();x.moveTo(0,96);pts.forEach(p=>x.lineTo(Math.max(1,Math.min(95,p[0])),Math.max(3,p[1])));x.lineTo(96,96);x.closePath();
 const g=x.createRadialGradient(34,26,4,48,60,78);g.addColorStop(0,'#9a9a8c');g.addColorStop(.6,'#5e5e52');g.addColorStop(1,'#2a2a22');x.fillStyle=g;x.fill();x.save();x.clip();
 for(let i=0;i<260;i++){const px=r()*96,py=r()*60,rr=1+r()*3.5;x.fillStyle=`hsla(${90+r()*30},${45+r()*20}%,${28+r()*22}%,.85)`;x.beginPath();x.arc(px,py,rr,0,7);x.fill();}
 const sh=x.createLinearGradient(0,70,0,96);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(5,10,5,.5)');x.fillStyle=sh;x.fillRect(0,0,96,96);x.restore();});
const jungleFungi=mkTex(96,128,(x,w,h)=>{const r=rng(411);
 for(let k=0;k<5;k++){const bx=14+k*17+(r()-.5)*6,top=40+r()*60,cw=8+r()*7;
  const sg=x.createLinearGradient(bx-3,0,bx+3,0);sg.addColorStop(0,'#c8b890');sg.addColorStop(.5,'#fff6dc');sg.addColorStop(1,'#a89870');x.fillStyle=sg;x.fillRect(bx-2.5,top,5,h-top);
  const cg=x.createRadialGradient(bx-cw*.3,top-cw*.4,1,bx,top,cw*1.2);cg.addColorStop(0,'#ffd27a');cg.addColorStop(.6,'#e07a1a');cg.addColorStop(1,'#7a3008');x.fillStyle=cg;
  x.beginPath();x.moveTo(bx-cw,top+2);x.quadraticCurveTo(bx-cw,top-cw*.9,bx,top-cw);x.quadraticCurveTo(bx+cw,top-cw*.9,bx+cw,top+2);x.closePath();x.fill();
  x.strokeStyle='rgba(120,60,20,.5)';x.lineWidth=.6;for(let i=-cw+2;i<cw;i+=2.2){x.beginPath();x.moveTo(bx+i,top+2);x.lineTo(bx+i*.5,top+4);x.stroke();}}});
// giant tree trunk: deep furrowed bark, moss patches, a hanging liana
const trunk=[0,1].map(v=>mkTex(96,256,(x,w,h)=>{const r=rng(421+v);
 const g=x.createLinearGradient(0,0,96,0);g.addColorStop(0,'#3a2c1e');g.addColorStop(.5,'#6a5440');g.addColorStop(1,'#2e2216');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<16;i++){let px=r()*96;x.strokeStyle=`rgba(${r()<.6?'20,14,8':'140,120,90'},${.35+r()*.3})`;x.lineWidth=1+r()*2.5;x.beginPath();x.moveTo(px,0);
  for(let y=0;y<=h;y+=8){px+=(r()-.5)*4;x.lineTo(px,y);}x.stroke();}
 for(let i=0;i<14;i++){const px=r()*96,py=h*.4+r()*h*.6,rr=4+r()*10;for(let k=0;k<14;k++){x.fillStyle=`hsla(${90+r()*30},50%,${25+r()*20}%,.8)`;x.beginPath();x.arc(px+(r()-.5)*rr*2,py+(r()-.5)*rr,1+r()*2.5,0,7);x.fill();}}
 const lx=20+r()*56;x.strokeStyle='#4a5a2a';x.lineWidth=3;x.beginPath();x.moveTo(lx,0);x.bezierCurveTo(lx+20,h*.3,lx-20,h*.6,lx+6,h);x.stroke();
 x.fillStyle='#4a8a3a';for(let y=10;y<h;y+=22){x.beginPath();x.ellipse(lx+Math.sin(y*.05)*10+6,y,5,2.6,.6,0,7);x.fill();}}));
const mossyBranch=v=>mkTex(64,64,(x,w,h)=>{const r=rng(431+v);
 for(let y=0;y<64;y++){const l=.6+.08*Math.sin(y*.7);x.fillStyle=`rgb(${110*l|0},${84*l|0},${58*l|0})`;x.fillRect(0,y,64,1);}
 for(let i=0;i<20;i++){const y=2+r()*58,f=1+(r()*3|0),p=r()*6.28;x.strokeStyle=`rgba(30,18,8,${.3+r()*.3})`;x.lineWidth=1;x.beginPath();
  for(let px=0;px<=64;px+=2){const yy=y+Math.sin(px/64*6.283*f+p)*1.2;px?x.lineTo(px,yy):x.moveTo(px,yy);}x.stroke();}
 for(let i=0;i<70;i++){x.fillStyle=`hsla(${90+r()*30},50%,${28+r()*20}%,.85)`;x.beginPath();x.arc(8+r()*48,r()*22,1+r()*2.4,0,7);x.fill();}});
// heliconia: zig-zag of red and yellow bracts on a green stem, with a big leaf
const heliconia=mkTex(80,192,(x,w,h)=>{
 x.fillStyle='#3e7a2e';x.beginPath();x.moveTo(40,192);x.quadraticCurveTo(14,140,6,90);x.quadraticCurveTo(26,120,42,170);x.fill();
 x.strokeStyle='#4a7a2a';x.lineWidth=3;x.beginPath();x.moveTo(40,192);x.lineTo(40,40);x.stroke();
 for(let i=0;i<7;i++){const y=48+i*15,s=i%2?1:-1;const g=x.createLinearGradient(40,y,40+s*18,y-8);g.addColorStop(0,'#c81a1a');g.addColorStop(.7,'#f04a2a');g.addColorStop(1,'#f8d03a');
  x.fillStyle=g;x.beginPath();x.moveTo(40,y);x.quadraticCurveTo(40+s*20,y+2,40+s*20,y-12);x.quadraticCurveTo(40+s*8,y-6,40,y-8);x.fill();}});
const orchid=mkTex(64,160,(x,w,h)=>{
 x.strokeStyle='#5a7a3a';x.lineWidth=2;x.beginPath();x.moveTo(32,160);x.bezierCurveTo(28,110,40,70,30,30);x.stroke();
 x.fillStyle='#3a6a2a';x.beginPath();x.ellipse(22,150,18,6,-.3,0,7);x.fill();x.beginPath();x.ellipse(42,148,18,5,.3,0,7);x.fill();
 [[30,32],[38,52],[26,66]].forEach(([cx,cy])=>{x.fillStyle='#e8a8e0';for(let i=0;i<5;i++){const a=i/5*6.283-1.57;x.beginPath();x.ellipse(cx+Math.cos(a)*6,cy+Math.sin(a)*6,6,3.4,a,0,7);x.fill();}
  x.fillStyle='#a02a8a';x.beginPath();x.ellipse(cx,cy+3,4,4.6,0,0,7);x.fill();x.fillStyle='#f8e070';x.beginPath();x.arc(cx,cy,1.6,0,7);x.fill();});});
// broad leaves (monstera-like) on long stalks
const broadLeaves=v=>mkTex(128,128,(x,w,h)=>{const r=rng(441+v);
 for(let k=0;k<4;k++){const bx=16+k*30+(r()-.5)*10,top=14+r()*50,lw=18+r()*8,lean=(r()-.5)*.6;
  x.strokeStyle='#3e6a26';x.lineWidth=2;x.beginPath();x.moveTo(bx,128);x.quadraticCurveTo(bx+lean*20,(128+top)/2,bx,top+lw*.8);x.stroke();
  x.save();x.translate(bx,top+lw*.6);x.rotate(lean);
  const g=x.createRadialGradient(-lw*.3,-lw*.4,2,0,0,lw*1.2);g.addColorStop(0,'#6ab84a');g.addColorStop(1,'#1e5a1e');x.fillStyle=g;
  x.beginPath();x.moveTo(0,lw*.6);x.bezierCurveTo(-lw*1.2,lw*.3,-lw*1.1,-lw*.9,0,-lw*.9);x.bezierCurveTo(lw*1.1,-lw*.9,lw*1.2,lw*.3,0,lw*.6);x.fill();
  x.strokeStyle='rgba(200,240,170,.5)';x.lineWidth=.8;x.beginPath();x.moveTo(0,lw*.6);x.lineTo(0,-lw*.85);x.stroke();
  for(let i=-3;i<=3;i++){if(!i)continue;x.beginPath();x.moveTo(0,i*lw*.2);x.lineTo(Math.sign(i)*lw*.9,i*lw*.2-lw*.25);x.stroke();}
  x.globalCompositeOperation='destination-out';for(let i=0;i<3;i++){x.beginPath();x.ellipse((r()-.5)*lw,(r()-.5)*lw,2.5,1.2,r()*3,0,7);x.fill();}x.globalCompositeOperation='source-over';
  x.restore();}});

const STYLE = {
  prato: { tex: {}, height: {} },
  deserto: {
    tex: { 1: [dryGrass(201), dryGrass(207), dryGrass(213)], 2: [sandstone(0), sandstone(1)], 3: [cactus(0), cactus(1)], 5: [bleachedTwig(0), bleachedTwig(1)],
      6: [desertFlower('#f8d040', '#c86a10')], 7: [desertFlower('#f07ab0', '#8a2a50')], 8: [agave(0), agave(1)], 9: [sandMound], 10: sandWall, 11: [crystals] },
    height: { 1: 1.5, 3: 2.6, 6: 2.0, 7: 2.0, 8: 1.2 },
  },
  giungla: {
    tex: { 1: [fern(501), fern(517), fern(533)], 2: [mossyStone(0), mossyStone(1)], 3: [jungleFungi], 4: trunk, 5: [mossyBranch(0), mossyBranch(1)],
      6: [heliconia], 7: [orchid], 8: [broadLeaves(0), broadLeaves(1)] },
    height: { 1: 3.4, 3: 1.3, 4: 7, 6: 3.4, 7: 2.4, 8: 2.4 },
  },
};

onWorld(w => {
  const st = STYLE[w.id] || STYLE.prato;
  for (let t = 0; t < BASE_TEX.length; t++) TEX[t] = (st.tex[t] || BASE_TEX[t]);
  for (let t = 0; t < BASE_H.length; t++) HEIGHT[t] = st.height[t] ?? BASE_H[t];
});
