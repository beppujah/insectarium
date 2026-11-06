import { hn, rng } from '../core/util.js';

// ================= procedural textures (RGBA with transparency) =================
// every object is a cut-out shape: rays pass through the holes
function mkTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);
 return {w,h,d:x.getImageData(0,0,w,h).data};}
function grassTex(seed){return mkTex(64,160,(x,w,h)=>{const r=rng(seed);
 x.fillStyle='#24401a';x.fillRect(0,h-14,w,14);
 const blades=11;
 for(let i=0;i<blades;i++){
  const bx=(i+.5)/blades*w+(r()-.5)*8,bw=4+r()*6,top=h*(.02+r()*.45),lean=(r()-.5)*26;
  const g1=`hsl(${88+r()*28},${45+r()*20}%,${18+r()*8}%)`,g2=`hsl(${78+r()*30},${50+r()*20}%,${42+r()*16}%)`;
  const gr=x.createLinearGradient(0,h,0,top);gr.addColorStop(0,g1);gr.addColorStop(1,g2);x.fillStyle=gr;
  x.beginPath();x.moveTo(bx-bw/2,h);x.quadraticCurveTo(bx-bw/3,(h+top)/2,bx+lean,top);x.quadraticCurveTo(bx+bw/3,(h+top)/2,bx+bw/2,h);x.fill();
  x.strokeStyle='rgba(225,245,170,.35)';x.lineWidth=1;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx,(h+top)/2,bx+lean,top+4);x.stroke();
 }});}
const TEX=[];
TEX[1]=[grassTex(11),grassTex(29),grassTex(53)];
TEX[2]=[mkTex(64,64,(x,w,h)=>{
 const pts=[];for(let i=0;i<=24;i++){const a=Math.PI*i/24;const rr=29+Math.sin(i*1.7)*2+Math.sin(i*4.1)*1.5;pts.push([32-Math.cos(a)*rr,64-Math.sin(a)*rr*1.75]);}
 x.beginPath();x.moveTo(0,64);pts.forEach(p=>x.lineTo(Math.max(1,Math.min(63,p[0])),Math.max(2,p[1])));x.lineTo(64,64);x.closePath();
 const g=x.createLinearGradient(0,6,0,64);g.addColorStop(0,'#c9c3b4');g.addColorStop(.55,'#8e887b');g.addColorStop(1,'#4d4840');x.fillStyle=g;x.fill();
 x.save();x.clip();const r=rng(7);
 for(let i=0;i<260;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.12)':'rgba(30,25,20,.18)';x.fillRect(r()*64,r()*64,1+r()*2,1+r()*2);}
 for(let i=0;i<5;i++){x.fillStyle='rgba(90,130,50,.55)';x.beginPath();x.ellipse(10+r()*44,8+r()*16,4+r()*7,2+r()*3,0,0,7);x.fill();}
 x.strokeStyle='rgba(30,25,20,.35)';x.beginPath();x.moveTo(20,20);x.lineTo(28,40);x.lineTo(24,58);x.stroke();x.restore();})];
TEX[3]=[mkTex(64,128,(x,w,h)=>{
 const sg=x.createLinearGradient(20,0,44,0);sg.addColorStop(0,'#bfb291');sg.addColorStop(.4,'#f1e9d2');sg.addColorStop(1,'#a99c7c');x.fillStyle=sg;
 x.beginPath();x.moveTo(23,48);x.lineTo(41,48);x.quadraticCurveTo(40,100,46,128);x.lineTo(18,128);x.quadraticCurveTo(24,100,23,48);x.fill();
 x.fillStyle='rgba(120,100,70,.5)';x.fillRect(22,64,20,3);
 x.fillStyle='#6e5a48';x.beginPath();x.ellipse(32,47,31,7,0,0,7);x.fill();
 const cg=x.createRadialGradient(24,14,4,32,30,40);cg.addColorStop(0,'#ff7a5a');cg.addColorStop(.6,'#c42a1c');cg.addColorStop(1,'#6e130c');x.fillStyle=cg;
 x.beginPath();x.moveTo(0,46);x.bezierCurveTo(0,6,64,6,64,46);x.closePath();x.fill();
 x.fillStyle='#fbf3e3';[[14,30,4],[30,17,5],[46,27,4],[22,40,3],[40,40,3],[54,40,2.5],[8,40,2.5]].forEach(p=>{x.beginPath();x.arc(p[0],p[1],p[2],0,7);x.fill();});})];
TEX[4]=[mkTex(64,128,(x,w,h)=>{
 x.save();x.beginPath();x.moveTo(32,124);
 for(let i=0;i<=16;i++){const t=i/16,y=124-t*118,wd=Math.sin(t*Math.PI)**.8*28;x.lineTo(32+wd+((i%2)?2:0),y);}
 for(let i=16;i>=0;i--){const t=i/16,y=124-t*118,wd=Math.sin(t*Math.PI)**.8*28;x.lineTo(32-wd-((i%2)?2:0),y);}
 x.closePath();const g=x.createLinearGradient(0,0,64,0);g.addColorStop(0,'#8b8a2a');g.addColorStop(.5,'#a7a238');g.addColorStop(1,'#6d6a1f');x.fillStyle=g;x.fill();x.clip();
 const r=rng(3);for(let i=0;i<40;i++){x.fillStyle=`rgba(${120+r()*60|0},${60+r()*30|0},20,.35)`;x.beginPath();x.arc(r()*64,r()*128,2+r()*6,0,7);x.fill();}
 x.strokeStyle='rgba(240,230,160,.7)';x.lineWidth=1.5;x.beginPath();x.moveTo(32,128);x.lineTo(32,8);x.stroke();x.lineWidth=1;
 for(let y=110;y>16;y-=11){x.beginPath();x.moveTo(32,y);x.lineTo(6,y-14);x.moveTo(32,y);x.lineTo(58,y-14);x.stroke();}x.restore();
 x.fillStyle='#5b4a20';x.fillRect(31,118,3,10);})];
TEX[5]=[mkTex(64,64,(x,w,h)=>{
 const g=x.createLinearGradient(0,14,0,64);g.addColorStop(0,'#a37a52');g.addColorStop(.35,'#7a5534');g.addColorStop(1,'#3a2716');x.fillStyle=g;
 x.beginPath();x.moveTo(0,64);x.lineTo(0,20);x.quadraticCurveTo(32,10,64,20);x.lineTo(64,64);x.fill();
 const r=rng(5);x.strokeStyle='rgba(30,18,10,.45)';for(let i=0;i<14;i++){const y=22+r()*40;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(20,y+r()*4-2,44,y+r()*4-2,64,y);x.stroke();}
 x.fillStyle='rgba(120,150,60,.6)';for(let i=0;i<6;i++){x.beginPath();x.ellipse(r()*64,18+r()*8,3+r()*5,2,0,0,7);x.fill();}
 x.strokeStyle='#6a4a2c';x.lineWidth=3;x.beginPath();x.moveTo(40,18);x.quadraticCurveTo(46,8,56,2);x.stroke();})];
function flowerTex(petal,center,poppy){return mkTex(64,192,(x,w,h)=>{
 x.strokeStyle='#4e7d2a';x.lineWidth=4;x.beginPath();x.moveTo(32,192);x.bezierCurveTo(30,140,36,90,32,44);x.stroke();
 x.fillStyle='#5a8f2f';x.beginPath();x.moveTo(32,150);x.quadraticCurveTo(10,128,4,104);x.quadraticCurveTo(22,118,33,138);x.fill();
 x.beginPath();x.moveTo(32,120);x.quadraticCurveTo(54,104,60,82);x.quadraticCurveTo(44,96,31,110);x.fill();
 if(poppy){const g=x.createRadialGradient(32,34,2,32,30,30);g.addColorStop(0,'#ff6a4a');g.addColorStop(1,'#a8170e');x.fillStyle=g;
  x.beginPath();x.moveTo(4,22);x.bezierCurveTo(0,52,24,58,32,56);x.bezierCurveTo(40,58,64,52,60,22);x.bezierCurveTo(50,30,44,14,32,20);x.bezierCurveTo(20,14,14,30,4,22);x.fill();
  x.fillStyle='#1d1410';x.beginPath();x.ellipse(32,24,9,4,0,0,7);x.fill();}
 else{for(let i=0;i<18;i++){const a=i/18*6.283;const px=32+Math.cos(a)*18,py=34+Math.sin(a)*6;
   x.fillStyle=i%2?petal:'#ffffff';x.beginPath();x.ellipse(px,py,10,3.4,a,0,7);x.fill();}
  const g=x.createRadialGradient(30,30,1,32,32,9);g.addColorStop(0,'#ffe36a');g.addColorStop(1,center);x.fillStyle=g;x.beginPath();x.ellipse(32,32,9,6,0,0,7);x.fill();}});}
TEX[6]=[flowerTex('#efe9dc','#d48a12',false)];
TEX[7]=[flowerTex('','',true)];
TEX[8]=[mkTex(64,64,(x,w,h)=>{const r=rng(9);
 for(let k=0;k<3;k++){const bx=10+k*22+(r()-.5)*6,top=8+r()*18;
  x.strokeStyle='#4a7a2a';x.lineWidth=2;x.beginPath();x.moveTo(bx,64);x.quadraticCurveTo(bx-3,(64+top)/2,bx,top+6);x.stroke();
  [[-7,0],[7,0],[0,-7]].forEach(o=>{x.fillStyle='#3f8f3a';x.beginPath();x.arc(bx+o[0],top+6+o[1],7,0,7);x.fill();
   x.strokeStyle='rgba(230,245,210,.7)';x.lineWidth=1;x.beginPath();x.arc(bx+o[0],top+6+o[1],3.5,0,3.14);x.stroke();});}})];
TEX[16]=[0,1].map(v=>mkTex(64,192,(x,w,h)=>{const r=rng(81+v);
 for(let k=0;k<7;k++){const bx=4+r()*56,top=h*(.02+r()*.4),lean=(r()-.5)*18,bw=2.5+r()*3;
  x.fillStyle=`hsl(${70+r()*30},${35+r()*20}%,${28+r()*14}%)`;x.beginPath();x.moveTo(bx-bw,h);x.quadraticCurveTo(bx,(h+top)/2,bx+lean,top);x.quadraticCurveTo(bx+bw*.3,(h+top)/2,bx+bw,h);x.fill();}
 for(let k=0;k<2;k++){const bx=18+k*26+r()*6,top=10+r()*30;x.strokeStyle='#6a7a3a';x.lineWidth=2.5;x.beginPath();x.moveTo(bx,h);x.lineTo(bx+(r()-.5)*4,top);x.stroke();
  const g=x.createLinearGradient(bx-5,0,bx+5,0);g.addColorStop(0,'#4a2a14');g.addColorStop(.5,'#8a5a30');g.addColorStop(1,'#3a200e');x.fillStyle=g;x.beginPath();x.ellipse(bx,top+18,5,16,0,0,7);x.fill();
  x.strokeStyle='#6a7a3a';x.lineWidth=1.5;x.beginPath();x.moveTo(bx,top+2);x.lineTo(bx,top-8);x.stroke();}}));
TEX[17]=[0,1,2].map(v=>mkTex(64,160,(x,w,h)=>{const r=rng(101+v*3);
 for(let k=0;k<6;k++){let px=6+r()*52;const top=h*(.05+r()*.5),wd=3+r()*4,ph=r()*6;
  const g=x.createLinearGradient(0,h,0,top);g.addColorStop(0,'#2e4a1c');g.addColorStop(1,`hsl(${80+r()*30},45%,${38+r()*14}%)`);x.fillStyle=g;
  x.beginPath();for(let y=h;y>=top;y-=4){const t=(h-y)/(h-top);x.lineTo(px+Math.sin(y*.06+ph)*6*t-wd*(1-t*.6),y);}
  for(let y=top;y<=h;y+=4){const t=(h-y)/(h-top);x.lineTo(px+Math.sin(y*.06+ph)*6*t+wd*(1-t*.6),y);}x.fill();}}));
TEX[18]=[mkTex(64,160,(x,w,h)=>{x.strokeStyle='#4f6a2a';x.lineWidth=4;x.beginPath();x.moveTo(30,h);x.bezierCurveTo(26,110,38,60,32,0);x.stroke();
 x.strokeStyle='rgba(200,230,150,.5)';x.lineWidth=1;x.beginPath();x.moveTo(31,h);x.bezierCurveTo(27,110,39,60,33,0);x.stroke();})];
TEX[19]=[0,1].map(v=>mkTex(64,160,(x,w,h)=>{const r=rng(121+v);
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6a5a3a');g.addColorStop(.6,'#4a3c24');g.addColorStop(1,'#2e3a1e');x.fillStyle=g;x.fillRect(0,0,w,h);
 for(let i=0;i<500;i++){x.fillStyle=r()<.5?'rgba(255,240,200,.1)':'rgba(10,8,4,.22)';x.fillRect(r()*64,r()*160,1+r()*2,1+r()*2);}
 for(let i=0;i<12;i++){const px=r()*64,py=r()*160,rr=2+r()*5;x.fillStyle=`rgba(${120+r()*40|0},${115+r()*30|0},${100+r()*20|0},.8)`;x.beginPath();x.ellipse(px,py,rr,rr*.7,r(),0,7);x.fill();}
 x.strokeStyle='rgba(150,120,80,.6)';for(let i=0;i<4;i++){let px=r()*64;x.lineWidth=1+r()*2;x.beginPath();x.moveTo(px,0);for(let y=0;y<120;y+=8){px+=(r()-.5)*6;x.lineTo(px,y);}x.stroke();}
 x.fillStyle='rgba(90,140,60,.35)';for(let i=0;i<30;i++)x.fillRect(r()*64,100+r()*60,2+r()*4,1+r()*3);}));
TEX[9]=[mkTex(64,64,(x,w,h)=>{
 const g=x.createLinearGradient(0,14,0,64);g.addColorStop(0,'#a57a4e');g.addColorStop(1,'#5a3c22');x.fillStyle=g;
 x.beginPath();x.moveTo(0,64);x.bezierCurveTo(4,30,18,16,32,16);x.bezierCurveTo(46,16,60,30,64,64);x.fill();
 const r=rng(91);for(let i=0;i<220;i++){x.fillStyle=r()<.5?'rgba(255,230,190,.18)':'rgba(40,25,10,.22)';x.fillRect(r()*64,18+r()*46,1+r()*2,1+r()*2);}
 x.fillStyle='#3a2414';x.beginPath();x.ellipse(32,49,17,13,0,0,7);x.fill();
 const hg=x.createRadialGradient(32,52,1,32,50,14);hg.addColorStop(0,'#000');hg.addColorStop(1,'#1c0f06');x.fillStyle=hg;x.beginPath();x.ellipse(32,50,14,11,0,0,7);x.fill();
 x.fillRect(18,50,28,14);})];
TEX[10]=[0,1].map(v=>mkTex(64,96,(x,w,h)=>{const r=rng(31+v*7);
 x.fillStyle='#5d4029';x.fillRect(0,0,w,h);
 for(let i=0;i<9;i++){const y=r()*h,th=2+r()*7;x.fillStyle=`rgba(${r()<.5?'120,88,58':'52,34,20'},${.25+r()*.35})`;x.beginPath();x.moveTo(0,y);
  for(let k=0;k<=8;k++)x.lineTo(k*8,y+Math.sin(k*1.3+i)*2);x.lineTo(64,y+th);for(let k=8;k>=0;k--)x.lineTo(k*8,y+th+Math.sin(k*1.1+i)*2);x.fill();}
 for(let i=0;i<380;i++){x.fillStyle=r()<.5?'rgba(255,220,180,.12)':'rgba(20,12,6,.25)';x.fillRect(r()*64,r()*96,1+r()*1.5,1+r()*1.5);}
 for(let i=0;i<10;i++){const px=r()*64,py=r()*96,rr=1.5+r()*4;const pg=x.createRadialGradient(px-rr/3,py-rr/3,.5,px,py,rr);pg.addColorStop(0,'#c8bfb0');pg.addColorStop(1,'#6d665c');x.fillStyle=pg;x.beginPath();x.ellipse(px,py,rr,rr*.8,r(),0,7);x.fill();}
 x.strokeStyle='rgba(170,130,90,.7)';for(let i=0;i<3;i++){let px=r()*64;x.lineWidth=1+r()*1.5;x.beginPath();x.moveTo(px,0);for(let y=0;y<96;y+=6){px+=(r()-.5)*5;x.lineTo(px,y);}x.stroke();}
 x.fillStyle='rgba(240,240,225,.55)';for(let i=0;i<14;i++)x.fillRect(r()*64,r()*96,1,1);}));
TEX[11]=[mkTex(64,64,(x,w,h)=>{const r=rng(13);
 for(let k=0;k<4;k++){const bx=10+k*14+(r()-.5)*6,top=14+r()*28,cw=6+r()*5;
  x.strokeStyle='#7fb8a8';x.lineWidth=2.4;x.beginPath();x.moveTo(bx,64);x.quadraticCurveTo(bx+(r()-.5)*8,(64+top)/2,bx,top);x.stroke();
  const g=x.createRadialGradient(bx,top-2,1,bx,top,cw);g.addColorStop(0,'#f2fffa');g.addColorStop(.5,'#7ff5d6');g.addColorStop(1,'#2fb79a');x.fillStyle=g;
  x.beginPath();x.moveTo(bx-cw,top+1);x.quadraticCurveTo(bx,top-cw*1.3,bx+cw,top+1);x.closePath();x.fill();}})];
TEX[12]=[0,1].map(v=>mkTex(64,96,(x,w,h)=>{const r=rng(71+v*5);
 for(let k=0;k<8;k++){let px=r()*64,wd=2+r()*3.5;const len=h*(.3+r()*.6);x.strokeStyle=`rgb(${120+r()*40|0},${86+r()*30|0},${56+r()*20|0})`;x.lineCap='round';
  let y=0;while(y<len){const ny=y+5,nx=px+(r()-.5)*5;x.lineWidth=Math.max(.8,wd*(1-y/len));x.beginPath();x.moveTo(px,y);x.lineTo(nx,ny);x.stroke();
   if(r()<.15){x.lineWidth=.8;x.beginPath();x.moveTo(nx,ny);x.lineTo(nx+(r()-.5)*14,ny+6+r()*6);x.stroke();}px=nx;y=ny;}}}));
const SOIL=(()=>{const a=new Uint8ClampedArray(64*64*3);const r=rng(17);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=.9+hn(x,y,11)*.16,i=(y*64+x)*3;a[i]=150*n;a[i+1]=150*n;a[i+2]=150*n;}
 for(let k=0;k<90;k++){const cx=r()*64,cy=r()*64,rr=.5+r()*1.3,l=r()<.75?175+r()*40:105;
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(x*x+y*y<=rr*rr){const px=(cx+x+64)&63,py=(cy+y+64)&63,i=(py*64+px)*3,s=1-(y+3)/9;a[i]=a[i+1]=a[i+2]=l*(.75+s*.4);}}
 return a;})();


export { TEX, SOIL };
