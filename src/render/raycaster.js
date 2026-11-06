import { $, clamp, hn, isTouch, lerp } from '../core/util.js';
import { ctl } from '../input/controls.js';
import { CEIL, EMIT, FULLH, GM, GS, HEIGHT, PASS, SWAY, WCEIL } from '../world/constants.js';
import { MOTES, SPR } from '../world/creatures.js';
import { G, SUN_AZ, cellAt, ground, insects, lv } from '../world/level.js';
import { PH, PW, cloudM, silM } from '../world/sky.js';
import { SOIL, TEX } from '../world/textures.js';

// ================= rendering (raycaster) =================
const view=$('view');const vctx=view.getContext('2d');
let W=0,H=0,img,u32,dbuf,vign;
function resize(){
 const px=isTouch?lerp(1.1,4.5,ctl.pixel.value):lerp(1.6,6,ctl.pixel.value);
 const nW=Math.max(160,Math.round(innerWidth/px)),nH=Math.max(100,Math.round(innerHeight/px));
 if(nW===W&&nH===H)return;
 W=nW;H=nH;view.width=W;view.height=H;img=vctx.createImageData(W,H);u32=new Uint32Array(img.data.buffer);dbuf=new Float32Array(W*H);
 vign=new Float32Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x/W-.5,dy=(y/H-.5)*.9;vign[y*W+x]=clamp(1.12-(dx*dx+dy*dy)*1.15,0,1);}
}
addEventListener('resize',resize);

const STARS=Array.from({length:220},(_,i)=>({a:hn(i,1,20)*6.283,e:.04+hn(i,2,21)*.9,b:.4+hn(i,3,22)*.6}));
const SKY=[ // day, sunset, night
 {top:[70,140,222],hor:[198,224,238],fog:[176,204,214],light:1,sun:[255,246,220],cloud:[255,255,255],cloudSh:[170,190,215],sil:[120,160,150],amb:[1,1,.97]},
 {top:[54,62,140],hor:[255,150,84],fog:[214,146,108],light:.74,sun:[255,190,110],cloud:[255,190,150],cloudSh:[140,90,120],sil:[90,70,90],amb:[1.12,.9,.78]},
 {top:[4,7,22],hor:[24,34,64],fog:[16,22,40],light:.22,sun:[200,210,255],cloud:[60,70,100],cloudSh:[20,24,40],sil:[10,14,24],amb:[.8,.9,1.25]}];
function env(t){const k=t*2,i=Math.min(1,Math.floor(k)),f=k-i,a=SKY[i],b=SKY[Math.min(2,i+1)];const o={};
 for(const key in a)o[key]=typeof a[key]==='number'?lerp(a[key],b[key],f):a[key].map((v,j)=>lerp(v,b[key][j],f));return o;}
const pack=(r,g,b)=>0xff000000|(clamp(b,0,255)<<16)|(clamp(g,0,255)<<8)|clamp(r,0,255);

// set up the camera and lighting functions for the current level
function makeCam(){
 const C={};
 const tod=ctl.tod.value;C.e=env(tod);C.night=lv.under?.5:clamp((tod-.45)*2.2,0,1);C.sunLight=0;
 C.fov=lerp(.9,2.0,ctl.fov.value);C.tanH=Math.tan(C.fov/2);C.proj=(W/2)/C.tanH;
 C.dX=Math.cos(G.ang);C.dY=Math.sin(G.ang);C.pX=-C.dY*C.tanH;C.pY=C.dX*C.tanH;
 C.hz=H/2+(ctl.pitch.value-.5)*H*1.1;C.cz=G.cz+Math.sin(G.bob)*.012;
 C.maxD=lv.under?22:lv.water?26:36;C.wind=lv.key==='surf'?ctl.wind.value:0;
 const sat=lerp(0,1.8,ctl.color.value),torch=G.torch;
 if(lv.water){
  const e=C.e,lightK=clamp(e.light*1.05,.18,1.05),fogD=.07+ctl.fog.value*.14;const f0=[14,60,70].map(v=>v*lightK+4);
  C.shade=function(r,g,b,dist,cx,lit){
   let lr=lit*lightK*.82,lg=lit*lightK*1.0,lb=lit*lightK*1.04;
   if(torch){const tc=Math.max(0,1-Math.abs(cx)*1.4)*clamp(2/(dist*.5+.4),0,1.5)*.9;lr+=tc;lg+=tc;lb+=tc*.95;}
   r*=lr;g*=lg;b*=lb;
   if(sat!==1){const y=.3*r+.59*g+.11*b;r=y+(r-y)*sat;g=y+(g-y)*sat;b=y+(b-y)*sat;}
   const fR=1-Math.exp(-dist*fogD*1.7),fG=1-Math.exp(-dist*fogD),fB=1-Math.exp(-dist*fogD*.85);
   r+=(f0[0]-r)*fR;g+=(f0[1]-g)*fG;b+=(f0[2]-b)*fB;return pack(r,g,b);};
  C.shadeAt=(r,g,b,dist,cx)=>C.shade(r,g,b,dist,cx,1);C.f0=f0;C.lightK=lightK;
 }else if(!lv.under){
  const e=C.e,[fr,fg,fb]=e.fog,amb=e.amb,fogD=.02+ctl.fog.value*.3;
  C.sunEl=lerp(.55,-.15,clamp(tod*1.6,0,1));C.sunLight=clamp(C.sunEl*3+.2,0,1);
  C.shade=function(r,g,b,dist,cx,lit){
   let l=e.light*lit;
   if(torch){l+=Math.max(0,1-Math.abs(cx)*1.4)*clamp(1.6/(dist*.6+.4),0,1.3)*.9;}
   r*=l*amb[0];g*=l*amb[1];b*=l*amb[2];
   if(sat!==1){const y=.3*r+.59*g+.11*b;r=y+(r-y)*sat;g=y+(g-y)*sat;b=y+(b-y)*sat;}
   const f=1-Math.exp(-dist*fogD);r+=(fr-r)*f;g+=(fg-g)*f;b+=(fb-b)*f;
   return pack(r,g,b);};
  C.shadeAt=(r,g,b,dist,cx)=>C.shade(r,g,b,dist,cx,1);
 }else{
  const Lm=lv.light,fogD=.09+ctl.fog.value*.16,fr=12,fg=8,fb=6;
  C.shade=function(r,g,b,dist,cx,lit,wx,wy,emit){
   let gx=(wx*GS)|0,gy=(wy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;const li=(gy*GM+gx)*3;
   const lant=1.05*Math.exp(-dist*.45);
   let lr=.05+Lm[li]+lant,lg=.045+Lm[li+1]+lant*.78,lb=.04+Lm[li+2]+lant*.52;
   if(torch){const tc=Math.max(0,1-Math.abs(cx)*1.4)*clamp(2/(dist*.5+.4),0,1.6);lr+=tc;lg+=tc*.95;lb+=tc*.82;}
   lr*=lit;lg*=lit;lb*=lit;
   if(emit){lr=Math.max(lr,1.25);lg=Math.max(lg,1.25);lb=Math.max(lb,1.25);}
   r*=lr;g*=lg;b*=lb;
   if(sat!==1){const y=.3*r+.59*g+.11*b;r=y+(r-y)*sat;g=y+(g-y)*sat;b=y+(b-y)*sat;}
   const f=emit?(1-Math.exp(-dist*fogD*.4)):(1-Math.exp(-dist*fogD));r+=(fr-r)*f;g+=(fg-g)*f;b+=(fb-b)*f;
   return pack(r,g,b);};
  C.shadeAt=(r,g,b,dist,cx,wx,wy)=>C.shade(r,g,b,dist,cx,1,wx,wy,0);
 }
 return C;
}

// walls and objects: nearest to farthest, only still-empty pixels are filled
function castWalls(C){
 const {dX,dY,pX,pY,hz,cz,proj,maxD,wind}=C,shade=C.shade,under=lv.key!=='surf',water=lv.water;
 const sunX=Math.cos(SUN_AZ),sunY=Math.sin(SUN_AZ),sunLight=C.sunLight||0,wt=G.t*1.8;
 for(let x=0;x<W;x++){
  const cx=2*x/W-1,rx=dX+pX*cx,ry=dY+pY*cx;
  let mx=G.px|0,my=G.py|0;const ddx=Math.abs(1/rx),ddy=Math.abs(1/ry);
  let sx,sy,sdx,sdy;
  if(rx<0){sx=-1;sdx=(G.px-mx)*ddx;}else{sx=1;sdx=(mx+1-G.px)*ddx;}
  if(ry<0){sy=-1;sdy=(G.py-my)*ddy;}else{sy=1;sdy=(my+1-G.py)*ddy;}
  let covered=0,nh=0;
  // standing inside a plant: its far side is drawn first, so the grass is all around you
  const inside=PASS[cellAt(mx,my)]&&!under;
  for(let s=0;s<80&&nh<14&&covered<H;s++){
   let side,dist;
   if(s===0&&inside){dist=Math.min(sdx,sdy);side=sdx<sdy?0:1;}
   else if(sdx<sdy){dist=sdx;sdx+=ddx;mx+=sx;side=0;}else{dist=sdy;sdy+=ddy;my+=sy;side=1;}
   if(dist>maxD)break;
   const t=cellAt(mx,my);if(!t||t===13||t===14)continue;nh++;
   dist=Math.max(.04,dist);
   let wx=side===0?G.py+dist*ry:G.px+dist*rx;wx-=Math.floor(wx);
   if((side===0&&sx<0)||(side===1&&sy>0))wx=1-wx;
   const vars=TEX[t],T=vars[((mx*7+my*13)>>>0)%vars.length],tw=T.w,th=T.h,td=T.d;
   const plant=PASS[t]&&!under;
   const h=FULLH[t]?lv.ceil:HEIGHT[t]*(t===1?(.55+hn(mx,my,3)*.9):(.85+hn(mx,my,3)*.3));
   const top=hz-(h-cz)*proj/dist,bot=hz+cz*proj/dist,span=bot-top;
   const y0=Math.max(0,Math.ceil(top)),y1=Math.min(H-1,Math.floor(bot));
   const nx=side===0?-sx:0,ny=side===1?-sy:0;
   const face=under?(.82+(side?-.1:0)):.72+.38*sunLight*Math.max(0,nx*sunX+ny*sunY)+(side?-.04:0);
   const sw=SWAY[t]*(water?.9:under?.25:wind)*.22*Math.sin((water?G.t*1.1:wt)+mx*1.3+my*.7);
   const tint=.9+hn(mx,my,5)*.2,emit=EMIT[t];
   // light through the leaves when looking towards the sun
   const back=plant?Math.pow(Math.max(0,(rx*sunX+ry*sunY)/Math.hypot(rx,ry)),2)*Math.max(.35,sunLight):0;
   const tr=1+.7*back,tg=1+1.15*back,tb=1+.2*back;
   const lx=G.px+rx*(dist-.04),ly=G.py+ry*(dist-.04);
   for(let y=y0;y<=y1;y++){
    const o=y*W+x;if(dbuf[o]<1e9)continue;
    const zz=(bot-y)/span;
    let u=wx+sw*zz*zz;u-=Math.floor(u);
    const tx=(u*tw)|0,ty=((1-zz)*(th-1))|0,i=(ty*tw+tx)*4;
    if(td[i+3]<110)continue;
    const ao=t===10?(.6+.4*Math.sin(Math.PI*clamp(zz,0,1))):water?(.5+.5*zz*h/WCEIL):plant?.68+.32*Math.min(1,zz*h*3):.5+.5*Math.min(1,zz*h*2.2);
    let cr=td[i]*tint*tr,cg=td[i+1]*tint*tg,cb=td[i+2]*tb;
    if(plant&&zz<.14){const k=(1-zz/.14)*.75;cr+=(78-cr)*k;cg+=(72-cg)*k;cb+=(40-cb)*k;} // base fades into the soil
    u32[o]=shade(cr,cg,cb,dist,cx,face*ao,lx,ly,emit);dbuf[o]=dist;covered++;
   }
   if(t===10||t===19)break; // solid soil and banks stop the ray
  }
 }
}

function drawSurface(C){
 const {dX,dY,pX,pY,hz,cz,proj,tanH,fov,night,e}=C,shade=C.shade;
 castWalls(C);
 const hzi=Math.floor(hz),wmask=lv.wmask,lmask=lv.leafMask,wHor=e.hor.map((v,i)=>lerp(v,e.top[i],.3));
 const r0x=dX-pX,r0y=dY-pY,r1x=dX+pX,r1y=dY+pY;
 for(let y=Math.max(0,hzi+1);y<H;y++){
  const rd=cz*proj/(y-hz);const stx=rd*(r1x-r0x)/W,sty=rd*(r1y-r0y)/W;
  let fx=G.px+rd*r0x,fy=G.py+rd*r0y;const o=y*W;
  for(let x=0;x<W;x++,fx+=stx,fy+=sty){
   if(dbuf[o+x]<1e9)continue;
   const ti=(((fy*72)&63)*64+((fx*72)&63))*3;
   let gx=(fx*GS)|0,gy=(fy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;const gi=(gy*GM+gx)*3;
   const wm=wmask[gy*GM+gx];
   if(wm===1){const rip=Math.sin(fx*7+G.t*2.1)*Math.sin(fy*6.3-G.t*1.7)+Math.sin((fx-fy)*11+G.t*3)*.4;
    const refl=clamp(.3+rd*.06,.3,.85);let r=lerp(34,wHor[0],refl),g=lerp(70,wHor[1],refl),b=lerp(62,wHor[2],refl);
    const sp=Math.max(0,rip)**3*.5*(.4+C.sunLight);r+=(255-r)*sp;g+=(250-g)*sp;b+=(235-b)*sp;
    u32[o+x]=shade(r*1.05,g*1.05,b*1.05,rd,x/W*2-1,1);dbuf[o+x]=rd;continue;}
   if(wm===2){const v=.85+.15*Math.sin(fx*40)*Math.sin(fy*40);u32[o+x]=shade(70*v,132*v,48*v,rd,x/W*2-1,1);dbuf[o+x]=rd;continue;}
   const d=lmask&&lmask[gy*GM+gx]?.93+SOIL[ti]/2100:SOIL[ti]/150;
   u32[o+x]=shade(ground[gi]*d,ground[gi+1]*d,ground[gi+2]*d,rd,x/W*2-1,1);dbuf[o+x]=rd;}}
 // sky (panorama)
 const [fr,fg,fb]=e.fog;
 const [tr,tg,tb]=e.top,[hr,hg,hb]=e.hor,[cr,cg,cb]=e.cloud,[sr,sg,sb]=e.sil,[csr,csg,csb]=e.cloudSh,[snr,sng,snb]=e.sun;
 const sunEl=C.sunEl;
 const colU=new Float32Array(W),colSun=new Float32Array(W),colA=new Float32Array(W);
 for(let x=0;x<W;x++){const a=G.ang+Math.atan((2*x/W-1)*tanH);colA[x]=a;colU[x]=((a/6.2832)%1+1)%1*PW;
  colSun[x]=((a-SUN_AZ+Math.PI)%6.2832+6.2832)%6.2832-Math.PI;}
 const moonAz=SUN_AZ+Math.PI;
 for(let y=0;y<Math.min(H,hzi+1);y++){
  const el=Math.atan((hz-y)/proj);const t=clamp(el/1.1,0,1);
  const br=lerp(hr,tr,Math.sqrt(t)),bg=lerp(hg,tg,Math.sqrt(t)),bb=lerp(hb,tb,Math.sqrt(t));
  const pv=clamp(PH-1-(el/.55)*PH,0,PH-1)|0;const row=pv*PW;const inPano=el<.55;
  const o=y*W;
  for(let x=0;x<W;x++){
   if(dbuf[o+x]<1e9)continue;
   let r=br,g=bg,b=bb;
   const dsx=colSun[x],dse=el-sunEl,sd=Math.sqrt(dsx*dsx+dse*dse);
   if(sunEl>-.1){const glow=Math.exp(-sd*5)*.55*(1-night)+(sd<.045?1:0);r+=(snr-r)*Math.min(1,glow);g+=(sng-g)*Math.min(1,glow);b+=(snb-b)*Math.min(1,glow);}
   if(night>.2){const dm=((colA[x]-moonAz+Math.PI)%6.2832+6.2832)%6.2832-Math.PI;const md=Math.hypot(dm,el-.5);
    if(md<.03){const k=night*(md<.025?1:.4);r+=(235-r)*k;g+=(235-g)*k;b+=(220-b)*k;}else{const k=Math.exp(-md*6)*.25*night;r+=120*k;g+=130*k;b+=160*k;}}
   if(inPano){const u=colU[x]|0,cm=cloudM[row+u]/255;
    if(cm>0){const shd=clamp(cm*1.6-.3,0,1);const k=cm*.9;r+=(lerp(cr,csr,shd*.6)-r)*k;g+=(lerp(cg,csg,shd*.6)-g)*k;b+=(lerp(cb,csb,shd*.6)-b)*k;}
    const sm=silM[row+u]/255;if(sm>0){const k=sm*.85;r+=(lerp(sr,fr,.35)-r)*k;g+=(lerp(sg,fg,.35)-g)*k;b+=(lerp(sb,fb,.35)-b)*k;}}
   u32[o+x]=pack(r,g,b);}
 }
 if(night>0){for(const s of STARS){let d=((s.a-G.ang+Math.PI)%6.283+6.283)%6.283-Math.PI;if(Math.abs(d)>fov/2)continue;
  const sx=(W/2+Math.tan(d)*proj)|0,sy=(hz-Math.tan(s.e)*proj)|0;if(sx<0||sx>=W||sy<0||sy>=H)continue;const o=sy*W+sx;if(dbuf[o]<1e9)continue;
  const v=(230*night*s.b*(.75+.25*Math.sin(G.t*3+s.a*40)))|0;const p=u32[o];u32[o]=0xff000000|(Math.max((p>>16)&255,v)<<16)|(Math.max((p>>8)&255,v)<<8)|Math.max(p&255,v);}}
}

function drawUnder(C){
 const {dX,dY,pX,pY,hz,cz,proj}=C,shade=C.shade;
 castWalls(C);
 const hzi=Math.floor(hz);
 const r0x=dX-pX,r0y=dY-pY,r1x=dX+pX,r1y=dY+pY;
 // soil floor
 for(let y=Math.max(0,hzi+1);y<H;y++){
  const rd=cz*proj/(y-hz);const stx=rd*(r1x-r0x)/W,sty=rd*(r1y-r0y)/W;
  let fx=G.px+rd*r0x,fy=G.py+rd*r0y;const o=y*W;
  for(let x=0;x<W;x++,fx+=stx,fy+=sty){
   if(dbuf[o+x]<1e9)continue;
   const ti=(((fy*72)&63)*64+((fx*72)&63))*3;
   let gx=(fx*GS)|0,gy=(fy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;const gi=(gy*GM+gx)*3;
   const d=SOIL[ti]/150;
   u32[o+x]=shade(ground[gi]*d,ground[gi+1]*d,ground[gi+2]*d,rd,x/W*2-1,1,fx,fy,0);dbuf[o+x]=rd;}}
 // tunnel ceiling; daylight shows above the exits
 const ch=CEIL-cz;
 for(let y=0;y<Math.min(H,hzi+1);y++){
  const rd=Math.min(300,ch*proj/(hz-y));if(!(rd>0))continue;const stx=rd*(r1x-r0x)/W,sty=rd*(r1y-r0y)/W;
  let fx=G.px+rd*r0x,fy=G.py+rd*r0y;const o=y*W;
  for(let x=0;x<W;x++,fx+=stx,fy+=sty){
   if(dbuf[o+x]<1e9)continue;
   const c=cellAt(fx,fy);
   if(c===13){const k=.85+.15*Math.sin(fx*9+G.t)*Math.sin(fy*7);const sk=env(ctl.tod.value).hor;
    u32[o+x]=pack(sk[0]*k+40,sk[1]*k+40,sk[2]*k+40);dbuf[o+x]=rd;continue;}
   const ti=(((fy*60)&63)*64+((fx*60)&63))*3;
   let gx=(fx*GS)|0,gy=(fy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;const gi=(gy*GM+gx)*3;
   const d=SOIL[ti]/150*.72;
   u32[o+x]=shade(ground[gi]*d,ground[gi+1]*d*.95,ground[gi+2]*d*.9,rd,x/W*2-1,.9,fx,fy,0);dbuf[o+x]=rd;}}
}

function drawWater(C){
 const {dX,dY,pX,pY,hz,cz,proj,lightK,f0}=C,shade=C.shade;
 castWalls(C);
 const hzi=Math.floor(hz),t=G.t,pm=lv.padMask;
 const r0x=dX-pX,r0y=dY-pY,r1x=dX+pX,r1y=dY+pY;
 // pond bed with sunlight caustics
 for(let y=Math.max(0,hzi+1);y<H;y++){
  const rd=cz*proj/(y-hz);const stx=rd*(r1x-r0x)/W,sty=rd*(r1y-r0y)/W;
  let fx=G.px+rd*r0x,fy=G.py+rd*r0y;const o=y*W;
  for(let x=0;x<W;x++,fx+=stx,fy+=sty){
   if(dbuf[o+x]<1e9)continue;
   const ti=(((fy*72)&63)*64+((fx*72)&63))*3;
   let gx=(fx*GS)|0,gy=(fy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;const gi=(gy*GM+gx)*3;
   const v=Math.sin(fx*3.1+t*1.3)+Math.sin(fy*2.7-t*1.1)+Math.sin((fx+fy)*2.2+t*.9)+Math.sin((fx-fy)*3.4-t*1.7);
   const c=1-Math.min(1,Math.abs(v)*1.1);const shadow=pm[gy*GM+gx]?.45:1;
   const d=SOIL[ti]/150,lit=(.62+c*c*1.1)*shadow;
   u32[o+x]=shade(ground[gi]*d,ground[gi+1]*d,ground[gi+2]*d,rd,x/W*2-1,lit);dbuf[o+x]=rd;}}
 // the surface seen from below: shimmering light and backlit water lilies
 const ch=WCEIL-cz,sk=env(ctl.tod.value).hor;
 for(let y=0;y<Math.min(H,hzi+1);y++){
  const rd=Math.min(300,ch*proj/(hz-y));if(!(rd>0))continue;const stx=rd*(r1x-r0x)/W,sty=rd*(r1y-r0y)/W;
  let fx=G.px+rd*r0x,fy=G.py+rd*r0y;const o=y*W;const fog=1-Math.exp(-rd*.09),win=clamp(1.4-rd*.12,0,1);
  for(let x=0;x<W;x++,fx+=stx,fy+=sty){
   if(dbuf[o+x]<1e9)continue;
   let gx=(fx*GS)|0,gy=(fy*GS)|0;gx=gx<0?0:gx>=GM?GM-1:gx;gy=gy<0?0:gy>=GM?GM-1:gy;
   let r,g,b;
   if(pm[gy*GM+gx]){r=24;g=46;b=22;}
   else{const w=.7+.3*Math.sin(fx*5+t*1.7)*Math.sin(fy*4.3-t*1.2);const k=(.55+.45*win)*w*lightK;
    r=(sk[0]*.55+70)*k;g=(sk[1]*.6+110)*k;b=(sk[2]*.6+110)*k;}
   r+=(f0[0]-r)*fog;g+=(f0[1]-g)*fog;b+=(f0[2]-b)*fog;
   u32[o+x]=pack(r,g,b);dbuf[o+x]=rd;}}
}

// insects (billboards with per-pixel depth)
function drawCreatures(C){
 const {dX,dY,pX,pY,hz,cz,proj,tanH,maxD,night}=C,shadeAt=C.shadeAt;
 const vis=[];
 for(const b of insects){const dx=b.x-G.px,dy=b.y-G.py;const depth=dx*dX+dy*dY;if(depth<.15||depth>maxD)continue;
  const lat=(dx*pX+dy*pY)/(tanH*tanH);vis.push([depth,b,lat]);}
 vis.sort((a,b)=>b[0]-a[0]);
 for(const[depth,b,lat]of vis){
  const sp=b.sp;let alpha=1;if(sp.night)alpha=night;if(alpha<.05)continue;
  const sx=W/2*(1+lat/depth);const size=sp.size*proj/depth;const baseY=hz+(cz-b.z)*proj/depth;const topY=baseY-size,left=sx-size/2;
  const data=SPR[sp.id].data;const flap=sp.flap?.25+.75*Math.abs(Math.sin(G.t*9+b.ph)):1;
  const x0=Math.max(0,Math.ceil(left)),x1=Math.min(W-1,Math.floor(left+size)),y0=Math.max(0,Math.ceil(topY)),y1=Math.min(H-1,Math.floor(baseY));
  const glow=sp.glow?(.55+.45*Math.sin(G.t*2.5+b.ph*3))*alpha:0;
  if(b.z<1.2){const sw=size*.9*(1-b.z*.5),shY=hz+cz*proj/depth,shx0=Math.max(0,sx-sw/2|0),shx1=Math.min(W-1,sx+sw/2|0),k=.35*(1-b.z*.7)*(1-night*.6);
   for(let x=shx0;x<=shx1;x++){const dxn=(x-sx)/(sw/2);const hh=Math.max(1,size*.08)*Math.sqrt(Math.max(0,1-dxn*dxn));
    for(let y=Math.max(0,shY-hh|0);y<=Math.min(H-1,shY+hh/2|0);y++){const o=y*W+x;if(dbuf[o]<depth-.05)continue;const p=u32[o],m=1-k;
     u32[o]=0xff000000|((((p>>16)&255)*m)<<16)|((((p>>8)&255)*m)<<8)|((p&255)*m);}}}
  for(let x=x0;x<=x1;x++){
   let u=(x-left)/size;if(sp.flap){u=.5+(u-.5)/flap;if(u<0||u>1)continue;}
   const tx=(u*63.99)|0;const cx=x/W*2-1;
   for(let y=y0;y<=y1;y++){
    const o=y*W+x;if(depth>=dbuf[o])continue;
    const ty=(((y-topY)/size)*63.99)|0;const i=(ty*64+tx)*4;const a=data[i+3];if(a<40)continue;
    let r=data[i],g=data[i+1],bb=data[i+2];let c;
    if(sp.glow&&g>200&&r>200){const k=.5+glow;c=pack(r*k,g*k,bb*k);}
    else c=shadeAt(r,g,bb,depth,cx,b.x,b.y);
    if(a<230||alpha<1){const k=(a/255)*alpha,p=u32[o];
     const pr=p&255,pg=(p>>8)&255,pb=(p>>16)&255;
     c=0xff000000|((pb+(((c>>16)&255)-pb)*k)<<16)|((pg+(((c>>8)&255)-pg)*k)<<8)|(pr+((c&255)-pr)*k);}
    u32[o]=c;if(a>200)dbuf[o]=depth;}}
  if(sp.glow&&glow>.05){
   const R=Math.max(3,size*2.4),gx=sx+size*.15,gy=baseY-size*.35;const ci=clamp(gy|0,0,H-1)*W+clamp(gx|0,0,W-1);
   if(depth<=dbuf[ci]+.01){const strength=glow*(.35+night*.9);
    for(let y=Math.max(0,gy-R|0);y<Math.min(H,gy+R);y++)for(let x=Math.max(0,gx-R|0);x<Math.min(W,gx+R);x++){
     const d=Math.hypot(x-gx,y-gy)/R;if(d>=1)continue;const k=(1-d)*(1-d)*strength;const o=y*W+x,p=u32[o];
     u32[o]=0xff000000|(clamp(((p>>16)&255)+40*k,0,255)<<16)|(clamp(((p>>8)&255)+230*k,0,255)<<8)|clamp((p&255)+200*k,0,255);}}}
 }
}

// pollen (on the surface) and dust (in the tunnels)
function drawMotes(C){
 const {dX,dY,pX,pY,hz,cz,proj,tanH,night,wind}=C;
 const mr=lv.water?[225,245,250]:lv.under?[200,170,130]:night>.5?[190,255,170]:[255,236,170],zmax=lv.water?WCEIL-.1:lv.under?CEIL-.1:2.2,amt=lv.water?.8:lv.under?.45:1;
 for(const m of MOTES){
  if(!m.init||m.lv!==lv||Math.hypot(m.x-G.px,m.y-G.py)>9){const a=Math.random()*6.28,d=1+Math.random()*8;m.x=G.px+Math.cos(a)*d;m.y=G.py+Math.sin(a)*d;m.z=Math.random()*zmax;m.init=true;m.lv=lv;}
  m.x+=(.15+wind*.6)*.016*Math.cos(G.t*.3+m.ph);m.y+=(.15+wind*.6)*.016*Math.sin(G.t*.4+m.ph);m.z+=lv.water?.012+(m.ph%1)*.01:Math.sin(G.t+m.ph)*.002;if(lv.water&&m.z>WCEIL-.05)m.z=0;
  const dx=m.x-G.px,dy=m.y-G.py,depth=dx*dX+dy*dY;if(depth<.2)continue;
  const lat=(dx*pX+dy*pY)/(tanH*tanH);const sx=(W/2*(1+lat/depth))|0,sy=(hz+(cz-m.z)*proj/depth)|0;
  if(sx<0||sx>=W||sy<0||sy>=H)continue;const o=sy*W+sx;if(depth>=dbuf[o])continue;
  const k=clamp(1.2/depth,0,.85)*(.5+.5*Math.sin(G.t*2+m.ph*5))*amt;
  const sz=depth<1.2?1:0;
  for(let yy=0;yy<=sz;yy++)for(let xx=0;xx<=sz;xx++){if(sy+yy>=H||sx+xx>=W)continue;const oo=o+yy*W+xx,q=u32[oo];
   u32[oo]=0xff000000|((((q>>16)&255)+(mr[2]-((q>>16)&255))*k)<<16)|((((q>>8)&255)+(mr[1]-((q>>8)&255))*k)<<8)|((q&255)+(mr[0]-(q&255))*k);}}
}

function render(){
 dbuf.fill(1e9);
 const C=makeCam();
 if(lv.water)drawWater(C);else if(lv.under)drawUnder(C);else drawSurface(C);
 drawCreatures(C);drawMotes(C);
 // post: vignette, flash, fade between levels
 const fl=G.flash,fade=1-G.fade,N2=W*H;
 for(let i=0;i<N2;i++){const p=u32[i],v=vign[i]*fade;let r=(p&255)*v,g=((p>>8)&255)*v,b=((p>>16)&255)*v;
  if(fl>0){r+=(255-r)*fl;g+=(255-g)*fl;b+=(255-b)*fl;}
  u32[i]=0xff000000|(b<<16)|(g<<8)|r;}
 vctx.putImageData(img,0,0);
 return C;
}

export { view, W, H, dbuf, u32, resize, render };
