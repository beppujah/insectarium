import SPECIES from '../content/species.json';
import { clamp, lerp, rng, vnoise } from '../core/util.js';
import { CEIL, GM, GS, HEIGHT, N, SOLID, WCEIL } from './constants.js';

const mkLevel=(key,name,o)=>Object.assign({key,name,under:false,water:false,oob:1,ceil:0,map:new Uint8Array(N*N),seen:new Uint8Array(N*N),insects:[],ground:null,light:null},o);
const LV={surf:mkLevel('surf','Prato',{}),
          under:mkLevel('under','Gallerie',{under:true,oob:10,ceil:CEIL}),
          water:mkLevel('water','Stagno',{water:true,oob:19,ceil:WCEIL})};
let lv=LV.surf,map=lv.map,seen=lv.seen,insects=lv.insects,ground=null;
function setLevel(l){lv=l;map=l.map;seen=l.seen;insects=l.insects;ground=l.ground;const c=document.getElementById('levelChip');if(c)c.textContent=l.name;}
const G={lastCam:null,currentTarget:null,fade:0,portalLock:false,label:'',started:false,px:32.5,py:32.5,ang:0,cz:.25,vz:0,ground:.25,torch:false,showMap:true,soundOn:true,t:0,found:new Set(),bob:0,flash:0};
const SUN_AZ=-2.2; // sun direction (radians)

function newWorld(seed){
 G.seed=seed;
 const r=rng(seed);setLevel(LV.surf);map.fill(0);seen.fill(0);LV.under.seen.fill(0);LV.water.seen.fill(0);
 const set=(x,y,t)=>{if(x>0&&y>0&&x<N-1&&y<N-1)map[y*N+x]=t;};
 const blob=(n,t,rmin,rmax,dens)=>{for(let c=0;c<n;c++){const cx=r()*N|0,cy=r()*N|0,rad=rmin+r()*(rmax-rmin);
  for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++)if(x*x+y*y<=rad*rad&&r()<dens)set(cx+x,cy+y,t);}};
 for(let i=0;i<N;i++){map[i]=map[(N-1)*N+i]=map[i*N]=map[i*N+N-1]=1;}
 blob(70,1,1,2.8,.7);             // grass tufts
 blob(16,8,1,2.2,.6);             // clover patches
 for(let c=0;c<55;c++)set(r()*N|0,r()*N|0,2);
 blob(14,3,0,1.2,.6);             // mushroom clusters
 for(let c=0;c<22;c++)set(r()*N|0,r()*N|0,4);
 for(let c=0;c<14;c++){let x=r()*N|0,y=r()*N|0;const dx=r()<.5?1:0,dy=1-dx,l=3+r()*4|0;for(let i=0;i<l;i++)set(x+dx*i,y+dy*i,5);}
 for(let c=0;c<34;c++)set(r()*N|0,r()*N|0,6);
 for(let c=0;c<18;c++)set(r()*N|0,r()*N|0,7);
 for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)map[(32+y)*N+32+x]=0;
 // pond
 {let px=0,py=0;for(let k=0;k<200;k++){px=10+r()*(N-20);py=10+r()*(N-20);if(Math.hypot(px-32,py-32)>13)break;}
  const pr=4.2+r()*1.6;G.pond={x:px,y:py,r:pr};
  for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){const cx=(px|0)+x,cy=(py|0)+y;if(cx<2||cy<2||cx>N-3||cy>N-3)continue;
   const d=Math.hypot(cx+.5-px,cy+.5-py),edge=pr+(vnoise(cx*.5,cy*.5,63)-.5)*2.4;
   if(d<edge)map[cy*N+cx]=14;else if(d<edge+1.6)map[cy*N+cx]=r()<.3?16:0;}}
 // burrows: tunnel entrances
 const portals=[];
 for(let k=0;k<400&&portals.length<5;k++){const x=3+(r()*(N-6))|0,y=3+(r()*(N-6))|0;
  if(map[y*N+x]||Math.hypot(x-32,y-32)<6||Math.hypot(x-G.pond.x,y-G.pond.y)<G.pond.r+4||portals.some(p=>Math.hypot(p[0]-x,p[1]-y)<12))continue;
  for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)map[(y+yy)*N+x+xx]=0;
  map[y*N+x]=9;portals.push([x,y]);}
 G.portals=portals;
 buildGround(r);spawnInsects(r);
 setLevel(LV.under);genUnder(r,portals);buildUnder();spawnInsects(r);
 setLevel(LV.water);genPond(r);buildPond(r);spawnInsects(r);
 setLevel(LV.surf);
 G.px=32.5;G.py=32.5;G.portalLock=false;
}
const cellAt=(x,y)=>(x<0||y<0||x>=N||y>=N)?lv.oob:map[(y|0)*N+(x|0)];
const blocked=(x,y,z)=>{const t=cellAt(x,y);return SOLID[t]===1&&HEIGHT[t]>z-0.05;};

function genPond(r){
 map.fill(19);
 for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const a=Math.atan2(y-32,x-32);const rr=21+vnoise(Math.cos(a)*2+3,Math.sin(a)*2+3,61)*9;if(Math.hypot(x-32,y-32)<rr)map[y*N+x]=0;}
 const set=(x,y,t)=>{x|=0;y|=0;if(map[y*N+x]===0&&Math.hypot(x-32,y-32)>3)map[y*N+x]=t;};
 for(let c=0;c<26;c++){const cx=4+r()*(N-8),cy=4+r()*(N-8),rad=.8+r()*2.2;for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)if(x*x+y*y<=rad*rad&&r()<.6)set(cx+x,cy+y,17);}
 for(let c=0;c<26;c++)set(4+r()*(N-8),4+r()*(N-8),2);
 for(let c=0;c<6;c++){let x=4+r()*(N-8)|0,y=4+r()*(N-8)|0;const dx=r()<.5?1:0,dy=1-dx,l=3+r()*4|0;for(let i=0;i<l;i++)set(x+dx*i,y+dy*i,5);}
 // water lilies: pads on the surface with their stems
 lv.pads=[];for(let c=0;c<34;c++){const x=4+r()*(N-8),y=4+r()*(N-8),rad=1+r()*1.6;if(map[(y|0)*N+(x|0)]===19)continue;lv.pads.push([x,y,rad,r()*6.28]);set(x,y,18);}
}
function genUnder(r,portals){
 map.fill(10);
 const carve=(fx,fy,rad)=>{const R=Math.ceil(rad);for(let y=-R;y<=R;y++)for(let x=-R;x<=R;x++){if(x*x+y*y>rad*rad+.5)continue;
  const cx=(fx|0)+x,cy=(fy|0)+y;if(cx>1&&cy>1&&cx<N-2&&cy<N-2)map[cy*N+cx]=0;}};
 const chambers=[];for(let i=0;i<10;i++)chambers.push([5+r()*(N-10),5+r()*(N-10),1.8+r()*1.7]);
 const nodes=portals.map(p=>[p[0]+.5,p[1]+.5,1.6]).concat(chambers);
 nodes.forEach(n=>carve(n[0],n[1],n[2]));
 const worm=(a,b)=>{let x=a[0],y=a[1];for(let s=0;s<500;s++){const dx=b[0]-x,dy=b[1]-y;if(Math.hypot(dx,dy)<1)break;
  const ang=Math.atan2(dy,dx)+(r()-.5)*1.6;x=clamp(x+Math.cos(ang)*.7,2,N-3);y=clamp(y+Math.sin(ang)*.7,2,N-3);carve(x,y,r()<.12?1.5:.85);}};
 const done=[nodes[0]],todo=nodes.slice(1);
 while(todo.length){let bi=0,bj=0,bd=1e9;done.forEach((a,i)=>todo.forEach((b,j)=>{const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(d<bd){bd=d;bi=i;bj=j;}}));
  worm(done[bi],todo[bj]);done.push(todo.splice(bj,1)[0]);}
 for(let k=0;k<4;k++)worm(nodes[r()*nodes.length|0],nodes[r()*nodes.length|0]);
 const wallN=(x,y)=>(map[y*N+x-1]===10)+(map[y*N+x+1]===10)+(map[(y-1)*N+x]===10)+(map[(y+1)*N+x]===10);
 const nearPortal=(x,y)=>portals.some(p=>Math.abs(p[0]-x)<=1&&Math.abs(p[1]-y)<=1);
 chambers.forEach(c=>{for(let k=0;k<7;k++){const a=r()*6.28,d=c[2]-.3;const x=(c[0]+Math.cos(a)*d)|0,y=(c[1]+Math.sin(a)*d)|0;
   const wn=wallN(x,y);if(map[y*N+x]===0&&wn>=1&&wn<=2&&!nearPortal(x,y))map[y*N+x]=r()<.8?11:2;}});
 for(let k=0;k<90;k++){const x=2+(r()*(N-4))|0,y=2+(r()*(N-4))|0;if(map[y*N+x]===0&&wallN(x,y)>=1&&!nearPortal(x,y))map[y*N+x]=12;}
 portals.forEach(p=>map[p[1]*N+p[0]]=13);
}
function buildPond(r){
 ground=lv.ground=new Uint8ClampedArray(GM*GM*3);lv.padMask=new Uint8Array(GM*GM);
 const occ=new Float32Array(GM*GM);for(let y=0;y<GM;y++)for(let x=0;x<GM;x++)occ[y*GM+x]=cellAt(x/GS,y/GS)===19?1:0;
 const ao=boxBlur(boxBlur(occ,5),4);
 for(let y=0;y<GM;y++)for(let x=0;x<GM;x++){const wx=x/GS,wy=y/GS,i=(y*GM+x)*3;
  const mud=clamp((vnoise(wx*.2,wy*.2,71)-.45)*2.5,0,1),alg=clamp((vnoise(wx*.5,wy*.5,72)-.6)*3,0,1),sh=1-ao[y*GM+x]*.5;
  ground[i]=lerp(168,96,mud)*sh*(1-alg*.3);ground[i+1]=lerp(152,88,mud)*sh*(1+alg*.15);ground[i+2]=lerp(108,62,mud)*sh*(1-alg*.2);}
 for(const[px,py,rad,notch]of lv.pads){const R=rad*GS;for(let y=Math.max(0,py*GS-R|0);y<Math.min(GM,py*GS+R);y++)for(let x=Math.max(0,px*GS-R|0);x<Math.min(GM,px*GS+R);x++){
  const dx=x-px*GS,dy=y-py*GS;if(dx*dx+dy*dy>R*R)continue;let a=Math.atan2(dy,dx)-notch;a=((a+Math.PI)%6.283+6.283)%6.283-Math.PI;if(Math.abs(a)<.22)continue;lv.padMask[y*GM+x]=1;}}
}
function buildUnder(){
 ground=lv.ground=new Uint8ClampedArray(GM*GM*3);const Lm=lv.light=new Float32Array(GM*GM*3);
 const occ=new Float32Array(GM*GM);
 for(let y=0;y<GM;y++)for(let x=0;x<GM;x++)occ[y*GM+x]=cellAt(x/GS,y/GS)===10?1:0;
 const ao=boxBlur(boxBlur(occ,4),3);
 for(let y=0;y<GM;y++)for(let x=0;x<GM;x++){const wx=x/GS,wy=y/GS,i=(y*GM+x)*3;
  const n=vnoise(wx*.4,wy*.4,51),damp=clamp((vnoise(wx*.15,wy*.15,52)-.5)*3,0,1);
  const sh=1-ao[y*GM+x]*.55;
  ground[i]=(84+n*34-damp*22)*sh;ground[i+1]=(60+n*22-damp*14)*sh;ground[i+2]=(40+n*12-damp*4)*sh;}
 const addLight=(cx,cy,rad,cr,cg,cb)=>{const R=rad*GS,x0=Math.max(0,cx*GS-R|0),x1=Math.min(GM-1,cx*GS+R|0),y0=Math.max(0,cy*GS-R|0),y1=Math.min(GM-1,cy*GS+R|0);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const d=Math.hypot(x-cx*GS,y-cy*GS)/R;if(d>=1)continue;const f=(1-d)*(1-d),i=(y*GM+x)*3;Lm[i]+=cr*f;Lm[i+1]+=cg*f;Lm[i+2]+=cb*f;}};
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=map[y*N+x];
  if(t===11)addLight(x+.5,y+.5,3.4,.18,.95,.75);
  if(t===13)addLight(x+.5,y+.5,4.2,1.3,1.35,1.4);}
}
function boxBlur(a,rad){const b=new Float32Array(GM*GM);for(let y=0;y<GM;y++){let s=0;for(let x=-rad;x<GM+rad;x++){if(x+rad<GM)s+=a[y*GM+x+rad];if(x-rad-1>=0)s-=a[y*GM+x-rad-1];if(x>=0&&x<GM)b[y*GM+x]=s/(2*rad+1);}}
 const c=new Float32Array(GM*GM);for(let x=0;x<GM;x++){let s=0;for(let y=-rad;y<GM+rad;y++){if(y+rad<GM)s+=b[(y+rad)*GM+x];if(y-rad-1>=0)s-=b[(y-rad-1)*GM+x];if(y>=0&&y<GM)c[y*GM+x]=s/(2*rad+1);}}return c;}

function buildGround(r){
 ground=lv.ground=new Uint8ClampedArray(GM*GM*3);const wmask=lv.wmask=new Uint8Array(GM*GM);
 const occ=new Float32Array(GM*GM);
 const sx=Math.cos(SUN_AZ)*-.55,sy=Math.sin(SUN_AZ)*-.55; // shadow offset away from the sun
 for(let y=0;y<GM;y++)for(let x=0;x<GM;x++){const wx=x/GS-sx,wy=y/GS-sy;const t=cellAt(wx,wy);occ[y*GM+x]=t&&t!==14?Math.min(1,HEIGHT[t]*.6):0;}
 const blur=(a,rad)=>{const b=new Float32Array(GM*GM);for(let y=0;y<GM;y++){let s=0;for(let x=-rad;x<GM+rad;x++){if(x+rad<GM)s+=a[y*GM+x+rad];if(x-rad-1>=0)s-=a[y*GM+x-rad-1];if(x>=0&&x<GM)b[y*GM+x]=s/(2*rad+1);}}
  const c=new Float32Array(GM*GM);for(let x=0;x<GM;x++){let s=0;for(let y=-rad;y<GM+rad;y++){if(y+rad<GM)s+=b[(y+rad)*GM+x];if(y-rad-1>=0)s-=b[(y-rad-1)*GM+x];if(y>=0&&y<GM)c[y*GM+x]=s/(2*rad+1);}}return c;};
 const ao=blur(blur(occ,5),3);
 for(let y=0;y<GM;y++)for(let x=0;x<GM;x++){const wx=x/GS,wy=y/GS,i=(y*GM+x)*3;
  const moss=clamp((vnoise(wx*.18,wy*.18,31)*.7+vnoise(wx*.7,wy*.7,32)*.3-.42)*2.6,0,1);
  const dry=vnoise(wx*.35,wy*.35,33);
  let R=lerp(112,72,moss)+dry*14,Gc=lerp(84,104,moss)+dry*8,B=lerp(54,44,moss);
  const near=cellAt(wx,wy);
  const sh=1-ao[y*GM+x]*.62;R*=sh;Gc*=sh;B*=sh;
  ground[i]=R;ground[i+1]=Gc;ground[i+2]=B;}
 // pond water, wet banks and water lilies
 const wet=new Float32Array(GM*GM);for(let y=0;y<GM;y++)for(let x=0;x<GM;x++)if(cellAt(x/GS,y/GS)===14){wmask[y*GM+x]=1;wet[y*GM+x]=1;}
 const wb=boxBlur(wet,6);for(let i=0;i<GM*GM;i++){const k=wb[i]*.6;ground[i*3]*=1-k*.45;ground[i*3+1]*=1-k*.25;ground[i*3+2]*=1-k*.4;}
 for(let c=0;c<40;c++){const a=r()*6.28,d=r()*G.pond.r*.85,px=G.pond.x+Math.cos(a)*d,py=G.pond.y+Math.sin(a)*d,rad=.22+r()*.22,notch=r()*6.28;const R=rad*GS;
  for(let y=py*GS-R|0;y<py*GS+R;y++)for(let x=px*GS-R|0;x<px*GS+R;x++){if(x<0||y<0||x>=GM||y>=GM||!wmask[y*GM+x])continue;const dx=x-px*GS,dy=y-py*GS;if(dx*dx+dy*dy>R*R)continue;
   let an=Math.atan2(dy,dx)-notch;an=((an+Math.PI)%6.283+6.283)%6.283-Math.PI;if(Math.abs(an)<.25)continue;wmask[y*GM+x]=2;}}
 // fallen petals and leaflets near flowers
 for(let cy=0;cy<N;cy++)for(let cx=0;cx<N;cx++){const t=map[cy*N+cx];if(t!==6&&t!==7)continue;
  for(let k=0;k<26;k++){const px=((cx+.5+(r()-.5)*3)*GS)|0,py=((cy+.5+(r()-.5)*3)*GS)|0;if(px<0||py<0||px>=GM||py>=GM)continue;
   const i=(py*GM+px)*3;if(t===6){ground[i]=235;ground[i+1]=230;ground[i+2]=215;}else{ground[i]=200;ground[i+1]=40;ground[i+2]=30;}}}
}
const livesIn=(sp,k)=>sp.levels?sp.levels.includes(k):sp.both?(k==='surf'||k==='under'):sp.under?k==='under':k==='surf';
function spawnInsects(r){const list=[];
 const open=[],water=[],shore=[];
 for(let y=2;y<N-2;y++)for(let x=2;x<N-2;x++){const t=map[y*N+x];
  if(!t&&(lv.key!=='surf'||Math.hypot(x-32,y-32)>=5)){open.push([x,y]);if(lv.key==='surf'&&Math.hypot(x+.5-G.pond.x,y+.5-G.pond.y)<G.pond.r+2.6)shore.push([x,y]);}
  if(t===14)water.push([x,y]);}
 SPECIES.forEach(sp=>{if(!livesIn(sp,lv.key))return;const cnt=lv.key==='under'&&sp.both?8:lv.key==='water'&&sp.id==='rana'?3:sp.count;
  const pool=lv.key==='surf'&&sp.habitat==='water'?water:lv.key==='surf'&&sp.habitat==='shore'&&shore.length?shore:open;
  for(let i=0;i<cnt;i++){const c=pool[r()*pool.length|0],x=c[0]+.2+r()*.6,y=c[1]+.2+r()*.6;
  const z=sp.fly?lerp(sp.fly[0],sp.fly[1],r()):lv.water&&sp.id==='rana'?.4+r()*1.4:0;
  list.push({sp,x,y,z,z0:z,dir:r()*6.28,ph:r()*6.28,hopT:r()*3,vz:0});}});
 lv.insects=insects=list;}

export { LV, lv, map, seen, insects, ground, setLevel, G, SUN_AZ, newWorld, cellAt, blocked };
