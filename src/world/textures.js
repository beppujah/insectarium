import { hn, rng } from '../core/util.js';

// ================= procedural textures (RGBA with transparency) =================
// every object is a cut-out shape: rays pass through the holes
function mkTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);
 return {w,h,d:x.getImageData(0,0,w,h).data};}
// grass: tapered blades with a lighter midrib and darker edges, some bent over, dry tips, the odd seed head
function grassTex(seed,heads){return mkTex(96,192,(x,w,h)=>{const r=rng(seed);
 const blades=[];for(let i=0;i<17;i++)blades.push({bx:4+r()*(w-8),bw:2.5+r()*5,top:h*(.04+r()*.5),lean:(r()-.5)*30,hue:84+r()*26,dark:r(),bend:r()<.18,dry:r()<.3});
 blades.sort((p,q)=>q.dark-p.dark); // darker (further back) first
 for(const B of blades){const {bx,bw,top,lean}=B;
  const L=12+B.dark*10,g1=`hsl(${B.hue},${48+B.dark*12}%,${14+B.dark*6}%)`,g2=`hsl(${B.hue-4},${52+B.dark*10}%,${30+L}%)`,g3=B.dry?`hsl(${48+r()*10},45%,${52+r()*10}%)`:g2;
  const gr=x.createLinearGradient(0,h,0,top);gr.addColorStop(0,g1);gr.addColorStop(.75,g2);gr.addColorStop(1,g3);x.fillStyle=gr;
  // blade outline: two curves meeting at a sharp tip; bent blades fold over halfway
  const tipX=B.bend?bx+lean*2.2:bx+lean,tipY=B.bend?top+(h-top)*.35:top,mid=(h+top)/2;
  x.beginPath();x.moveTo(bx-bw/2,h);x.quadraticCurveTo(bx-bw*.45,mid,B.bend?bx+lean:bx+lean*.6,B.bend?top:mid-(mid-top)*.4);
  x.quadraticCurveTo(B.bend?bx+lean*1.8:bx+lean*.9,B.bend?top-6:top+(mid-top)*.2,tipX,tipY);
  x.quadraticCurveTo(B.bend?bx+lean*1.5:bx+lean*.75,B.bend?top+2:top+(mid-top)*.25,B.bend?bx+lean+bw*.4:bx+lean*.6+bw*.35,B.bend?top+4:mid-(mid-top)*.4);
  x.quadraticCurveTo(bx+bw*.45,mid,bx+bw/2,h);x.closePath();x.fill();
  x.strokeStyle='rgba(20,40,10,.35)';x.lineWidth=.8;x.stroke();
  x.strokeStyle=`rgba(225,245,170,${.18+B.dark*.25})`;x.lineWidth=1;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx+lean*.1,mid,B.bend?bx+lean:bx+lean*.6,B.bend?top+2:mid-(mid-top)*.4);x.stroke();}
 if(heads)for(let k=0;k<2;k++){const bx=16+r()*(w-32),top=6+r()*30,lean=(r()-.5)*16;
  x.strokeStyle='#6e7a3a';x.lineWidth=1.4;x.beginPath();x.moveTo(bx,h);x.quadraticCurveTo(bx,(h+top)/2,bx+lean,top+18);x.stroke();
  for(let j=0;j<9;j++){const t=j/8,px=bx+lean+(r()-.5)*3,py=top+18-t*22;x.fillStyle=`hsl(${55+r()*15},${35+r()*15}%,${45+r()*15}%)`;
   x.beginPath();x.ellipse(px+(j%2?2.5:-2.5),py,1.6,3.2,(j%2?.5:-.5),0,7);x.fill();}}
});}
const TEX=[];
TEX[1]=[grassTex(11,false),grassTex(29,true),grassTex(53,false),grassTex(71,true)];
// stone: lit from above, with pits, speckles, a crack and lichen rosettes
TEX[2]=[0,1].map(v=>mkTex(96,96,(x,w,h)=>{const r=rng(7+v*13);
 const pts=[];for(let i=0;i<=30;i++){const a=Math.PI*i/30;const rr=43+Math.sin(i*1.7+v)*3+Math.sin(i*4.1)*2;pts.push([48-Math.cos(a)*rr,96-Math.sin(a)*rr*(1.55+v*.2)]);}
 x.beginPath();x.moveTo(0,96);pts.forEach(p=>x.lineTo(Math.max(1,Math.min(95,p[0])),Math.max(3,p[1])));x.lineTo(96,96);x.closePath();
 const base=v?['#cfc6b5','#958c7c','#4a443b']:['#c4c2bb','#8a8780','#45433e'];
 const g=x.createRadialGradient(34,22,4,48,60,78);g.addColorStop(0,base[0]);g.addColorStop(.5,base[1]);g.addColorStop(1,base[2]);x.fillStyle=g;x.fill();
 x.save();x.clip();
 for(let i=0;i<900;i++){const px=r()*96,py=r()*96,l=r();x.fillStyle=l<.45?'rgba(255,255,250,.13)':l<.9?'rgba(25,22,18,.16)':'rgba(70,60,50,.3)';x.fillRect(px,py,1,1);}
 for(let i=0;i<14;i++){const px=r()*96,py=10+r()*80,rr=1+r()*2.5;x.fillStyle='rgba(20,16,12,.35)';x.beginPath();x.ellipse(px,py,rr,rr*.7,0,0,7);x.fill();
  x.fillStyle='rgba(255,255,245,.25)';x.beginPath();x.ellipse(px,py+rr*.6,rr*.8,rr*.3,0,0,3.14);x.fill();}
 x.strokeStyle='rgba(25,20,15,.5)';x.lineWidth=1.2;x.beginPath();let cx=30+r()*30,cy=14;x.moveTo(cx,cy);while(cy<92){cx+=(r()-.5)*10;cy+=6+r()*6;x.lineTo(cx,cy);}x.stroke();
 x.strokeStyle='rgba(255,255,240,.18)';x.beginPath();x.moveTo(31,14);x.lineTo(33,40);x.stroke();
 for(let i=0;i<5;i++){const px=8+r()*80,py=8+r()*34,rr=3+r()*6,c=r()<.5?'150,170,70':'200,160,60';
  for(let k=0;k<10;k++){x.fillStyle=`rgba(${c},${.35+r()*.35})`;x.beginPath();x.arc(px+(r()-.5)*rr*1.6,py+(r()-.5)*rr,1+r()*rr*.45,0,7);x.fill();}}
 const sh=x.createLinearGradient(0,70,0,96);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(10,8,5,.45)');x.fillStyle=sh;x.fillRect(0,0,96,96);
 x.restore();}));
// fly agaric: fibrous stem with a ring, gills under the cap, raised warts that catch the light
TEX[3]=[mkTex(96,192,(x,w,h)=>{const r=rng(3);
 const sg=x.createLinearGradient(30,0,66,0);sg.addColorStop(0,'#a99c7c');sg.addColorStop(.35,'#f4ecd6');sg.addColorStop(.7,'#ddd2b6');sg.addColorStop(1,'#8f8264');x.fillStyle=sg;
 x.beginPath();x.moveTo(36,70);x.lineTo(60,70);x.quadraticCurveTo(58,150,70,192);x.lineTo(26,192);x.quadraticCurveTo(38,150,36,70);x.fill();
 x.strokeStyle='rgba(140,120,90,.35)';x.lineWidth=1;for(let i=0;i<10;i++){const px=36+r()*24;x.beginPath();x.moveTo(px,74);x.quadraticCurveTo(px+(r()-.5)*4,130,px+(px-48)*.6,192);x.stroke();}
 for(let i=0;i<18;i++){x.fillStyle='rgba(250,245,230,.7)';x.fillRect(28+r()*40,150+r()*40,2,1);}
 const ring=x.createLinearGradient(0,92,0,104);ring.addColorStop(0,'#fbf6e8');ring.addColorStop(1,'#b8aa88');x.fillStyle=ring;
 x.beginPath();x.moveTo(33,92);x.quadraticCurveTo(48,88,63,92);x.lineTo(67,104);x.quadraticCurveTo(48,110,29,104);x.closePath();x.fill();
 x.fillStyle='#d9cdb0';x.beginPath();x.ellipse(48,70,46,10,0,0,7);x.fill();
 x.strokeStyle='rgba(120,100,70,.55)';x.lineWidth=1;for(let i=-44;i<=44;i+=3){x.beginPath();x.moveTo(48+i,70);x.lineTo(48+i*.4,76);x.stroke();}
 const cg=x.createRadialGradient(34,22,4,48,46,60);cg.addColorStop(0,'#ff8a64');cg.addColorStop(.5,'#d0301e');cg.addColorStop(1,'#701308');x.fillStyle=cg;
 x.beginPath();x.moveTo(1,68);x.bezierCurveTo(0,8,96,8,95,68);x.quadraticCurveTo(48,62,1,68);x.closePath();x.fill();
 x.fillStyle='rgba(255,230,210,.25)';x.beginPath();x.ellipse(32,26,14,6,-.4,0,7);x.fill();
 [[18,44,5],[34,28,6],[52,20,5],[70,32,5.5],[84,50,4],[28,56,4],[46,44,5],[62,52,4.5],[10,58,3],[78,62,3]].forEach(([px,py,rr])=>{
  x.fillStyle='rgba(90,20,10,.4)';x.beginPath();x.ellipse(px+1,py+1.5,rr,rr*.8,0,0,7);x.fill();
  x.fillStyle='#f6eedb';x.beginPath();x.ellipse(px,py,rr,rr*.8,0,0,7);x.fill();
  x.fillStyle='#fffdf6';x.beginPath();x.ellipse(px-rr*.3,py-rr*.3,rr*.4,rr*.3,0,0,7);x.fill();});})];
TEX[4]=[mkTex(64,128,(x,w,h)=>{
 x.save();x.beginPath();x.moveTo(32,124);
 for(let i=0;i<=16;i++){const t=i/16,y=124-t*118,wd=Math.sin(t*Math.PI)**.8*28;x.lineTo(32+wd+((i%2)?2:0),y);}
 for(let i=16;i>=0;i--){const t=i/16,y=124-t*118,wd=Math.sin(t*Math.PI)**.8*28;x.lineTo(32-wd-((i%2)?2:0),y);}
 x.closePath();const g=x.createLinearGradient(0,0,64,0);g.addColorStop(0,'#8b8a2a');g.addColorStop(.5,'#a7a238');g.addColorStop(1,'#6d6a1f');x.fillStyle=g;x.fill();x.clip();
 const r=rng(3);for(let i=0;i<40;i++){x.fillStyle=`rgba(${120+r()*60|0},${60+r()*30|0},20,.35)`;x.beginPath();x.arc(r()*64,r()*128,2+r()*6,0,7);x.fill();}
 x.strokeStyle='rgba(240,230,160,.7)';x.lineWidth=1.5;x.beginPath();x.moveTo(32,128);x.lineTo(32,8);x.stroke();x.lineWidth=1;
 for(let y=110;y>16;y-=11){x.beginPath();x.moveTo(32,y);x.lineTo(6,y-14);x.moveTo(32,y);x.lineTo(58,y-14);x.stroke();}x.restore();
 x.fillStyle='#5b4a20';x.fillRect(31,118,3,10);})];
// fallen twig seen from the side: a round bar (lit on top, dark underneath), bark furrows along it, knots, lichen
TEX[5]=[0,1].map(v=>mkTex(64,64,(x,w,h)=>{const r=rng(5+v*11);
 for(let y=0;y<64;y++){const l=.62+.08*Math.sin(y*.7);
  x.fillStyle=`rgb(${(56+96*l)|0},${(37+64*l)|0},${(21+36*l)|0})`;x.fillRect(0,y,64,1);}
 // furrows are periodic along x, so the bark tiles seamlessly from cell to cell
 for(let i=0;i<26;i++){const y=2+r()*58,f1=1+(r()*3|0),f2=2+(r()*4|0),p1=r()*6.28,p2=r()*6.28,a1=.6+r()*1.2;x.strokeStyle=`rgba(${r()<.65?'30,18,8':'200,170,125'},${.28+r()*.3})`;x.lineWidth=r()<.7?1:1.6;
  x.beginPath();for(let px=0;px<=64;px+=2){const yy=y+a1*Math.sin(px/64*6.283*f1+p1)+.6*Math.sin(px/64*6.283*f2+p2);px?x.lineTo(px,yy):x.moveTo(px,yy);}x.stroke();}
 for(let i=0;i<2;i++){const px=12+r()*40,py=14+r()*30;x.fillStyle='#3a2414';x.beginPath();x.ellipse(px,py,3.5,2.6,0,0,7);x.fill();
  x.strokeStyle='rgba(200,170,120,.5)';x.beginPath();x.ellipse(px,py,5.5,4,0,0,7);x.stroke();}
 for(let i=0;i<4;i++){const px=8+r()*48,py=1+r()*12,c=r()<.6?'140,170,90':'190,190,150';
  for(let k=0;k<7;k++){x.fillStyle=`rgba(${c},.6)`;x.beginPath();x.arc(px+(r()-.5)*8,py+r()*4,1+r()*2,0,7);x.fill();}}}));
// the cut end of a twig: growth rings inside a ring of bark
const TWIG_END=mkTex(64,64,(x,w,h)=>{const r=rng(55);
 x.fillStyle='#4a3020';x.beginPath();x.arc(32,32,31,0,7);x.fill();
 const g=x.createRadialGradient(28,26,2,32,32,27);g.addColorStop(0,'#e2c08a');g.addColorStop(1,'#a77a48');x.fillStyle=g;x.beginPath();x.arc(32,32,26,0,7);x.fill();
 x.strokeStyle='rgba(120,80,40,.45)';x.lineWidth=1;for(let k=4;k<26;k+=3+r()*2){x.beginPath();x.ellipse(32+(r()-.5),32+(r()-.5),k,k*.96,0,0,7);x.stroke();}
 x.strokeStyle='rgba(80,50,25,.5)';x.beginPath();x.moveTo(32,32);x.lineTo(44,16);x.stroke();
 x.fillStyle='#6a4426';x.beginPath();x.arc(32,32,2.2,0,7);x.fill();});
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
// clover: thin stalks, three heart-shaped leaflets each with a pale V chevron, and a white flower head
function leaflet(x,cx,cy,rot,sz,col){x.save();x.translate(cx,cy);x.rotate(rot);
 x.fillStyle=col;x.beginPath();x.moveTo(0,0);x.bezierCurveTo(-sz*1.1,-sz*.2,-sz*.9,-sz*1.25,-sz*.2,-sz*1.05);x.quadraticCurveTo(0,-sz*.85,sz*.2,-sz*1.05);
 x.bezierCurveTo(sz*.9,-sz*1.25,sz*1.1,-sz*.2,0,0);x.fill();
 x.strokeStyle='rgba(225,245,215,.75)';x.lineWidth=1;x.beginPath();x.moveTo(-sz*.42,-sz*.75);x.lineTo(0,-sz*.42);x.lineTo(sz*.42,-sz*.75);x.stroke();
 x.strokeStyle='rgba(20,60,20,.45)';x.beginPath();x.moveTo(0,0);x.lineTo(0,-sz*.9);x.stroke();x.restore();}
TEX[8]=[0,1].map(v=>mkTex(80,80,(x,w,h)=>{const r=rng(9+v*7);
 for(let k=0;k<4;k++){const bx=8+k*20+(r()-.5)*8,top=10+r()*30,sz=6+r()*3.5,col=`hsl(${105+r()*20},${40+r()*15}%,${26+r()*12}%)`;
  x.strokeStyle='#3e6a26';x.lineWidth=1.6;x.beginPath();x.moveTo(bx,80);x.quadraticCurveTo(bx-4+r()*8,(80+top)/2,bx,top);x.stroke();
  const rot=(r()-.5)*.6;[-2.1,0,2.1].forEach(a=>leaflet(x,bx,top,a+rot,sz,col));}
 if(v){const bx=40+r()*12,top=6+r()*8;x.strokeStyle='#5a7a3a';x.lineWidth=1.4;x.beginPath();x.moveTo(bx,80);x.quadraticCurveTo(bx+5,40,bx,top+6);x.stroke();
  for(let i=0;i<34;i++){const a=r()*6.283,d=r()*6;x.fillStyle=r()<.8?'#f4f0e6':'#d8c9b8';x.beginPath();x.ellipse(bx+Math.cos(a)*d,top+Math.sin(a)*d*.8,1.4,2.4,a,0,7);x.fill();}}}));
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
// burrow: a mound of excavated soil crumbs, each lit on top, around a dark entrance
TEX[9]=[mkTex(96,96,(x,w,h)=>{const r=rng(91);
 x.beginPath();x.moveTo(0,96);x.bezierCurveTo(6,44,26,22,48,22);x.bezierCurveTo(70,22,90,44,96,96);x.closePath();
 const g=x.createLinearGradient(0,22,0,96);g.addColorStop(0,'#9c724a');g.addColorStop(1,'#4e3420');x.fillStyle=g;x.fill();x.save();x.clip();
 for(let i=0;i<700;i++){const px=r()*96,py=20+r()*76,rr=1+r()*2.6,l=.55+r()*.5-(py-20)/180;
  x.fillStyle=`rgb(${(150*l)|0},${(104*l)|0},${(64*l)|0})`;x.beginPath();x.ellipse(px,py,rr,rr*.8,0,0,7);x.fill();
  x.fillStyle=`rgba(255,230,190,${.25*l})`;x.beginPath();x.ellipse(px-rr*.25,py-rr*.35,rr*.5,rr*.3,0,0,7);x.fill();}
 for(let i=0;i<10;i++){const px=r()*96,py=30+r()*60;x.fillStyle='#9a958c';x.beginPath();x.ellipse(px,py,2+r()*2,1.6+r(),0,0,7);x.fill();}
 x.restore();
 x.fillStyle='#2e1c0e';x.beginPath();x.ellipse(48,72,24,18,0,0,7);x.fill();
 const hg=x.createRadialGradient(48,78,1,48,74,20);hg.addColorStop(0,'#000');hg.addColorStop(1,'#1a0e06');x.fillStyle=hg;x.beginPath();x.ellipse(48,73,20,15,0,0,7);x.fill();
 x.fillRect(28,73,40,23);})];
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
// soil detail (grey multiplier, 150 = neutral): fine grain plus scattered crumbs and pebbles lit from above
const SOIL=(()=>{const a=new Uint8ClampedArray(64*64*3);const r=rng(17);
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){const n=.9+hn(x,y,11)*.14+hn(x>>1,y>>1,12)*.06,i=(y*64+x)*3;a[i]=a[i+1]=a[i+2]=150*n;}
 const put=(px,py,v)=>{const i=(((py+64)&63)*64+((px+64)&63))*3;a[i]=a[i+1]=a[i+2]=v;};
 for(let k=0;k<46;k++){const cx=r()*64|0,cy=r()*64|0,rr=.8+r()*1.6,base=r()<.7?150+r()*22:128+r()*16;
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){const d=(x*x+y*y)/(rr*rr);if(d>1)continue;
   const lit=1+.22*(-y/rr)-.06*d;put(cx+x,cy+y,base*lit);}
  for(let x=-1;x<=1;x++)put(cx+x,cy+Math.ceil(rr)+1,128);}  // contact shadow under each crumb
 return a;})();


export { TEX, SOIL, TWIG_END };
