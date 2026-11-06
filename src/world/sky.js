import { onWorld } from '../content/worlds.js';
import { clamp, lerp, rng, vnoise } from '../core/util.js';

// ================= sky: panorama of clouds and distant scenery =================
// cloudM: cloud cover (in the jungle it is the canopy of leaves overhead); silM: distant silhouettes on the horizon.
const PW=1024,PH=160,cloudM=new Uint8Array(PW*PH),silM=new Uint8Array(PW*PH);

function clouds(cover){for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const u=x/PW*16,v=y/PH*5;
  let n=0,a=.5,f=1;for(let o=0;o<5;o++){n+=a*vnoise(u*f+(o*13.1),v*f*2.2,40+o);a*=.5;f*=2;}
  // vnoise doesn't tile: blend the edges to close the loop
  const e=Math.min(1,Math.min(x,PW-x)/40);n=lerp(.4,n,e);
  const band=cover>0.6?1:Math.sin(Math.PI*clamp((y/PH-.18)/.7,0,1));cloudM[y*PW+x]=clamp((n-(1-cover))*5*band,0,1)*255;}}

function silhouettes(draw){const c=document.createElement('canvas');c.width=PW;c.height=PH;const x=c.getContext('2d');draw(x,rng(77));
 const d=x.getImageData(0,0,PW,PH).data;for(let i=0;i<PW*PH;i++)silM[i]=d[i*4+3];}

const meadow=(x,r)=>{for(let layer=0;layer<2;layer++){x.fillStyle=layer?'rgba(0,0,0,1)':'rgba(0,0,0,.5)';
  for(let i=0;i<(layer?110:160);i++){const bx=r()*PW,top=PH-(layer?8+r()*34:10+r()*55),wd=2+r()*5,lean=(r()-.5)*14;
   x.beginPath();x.moveTo(bx-wd,PH);x.quadraticCurveTo(bx,(PH+top)/2,bx+lean,top);x.quadraticCurveTo(bx+wd*.4,(PH+top)/2,bx+wd,PH);x.fill();}
  for(let i=0;i<(layer?7:12);i++){const bx=r()*PW,top=PH-(layer?40+r()*30:60+r()*40);
   x.fillRect(bx-1,top,2.5,PH-top);const rr=5+r()*4;x.beginPath();x.arc(bx,top,rr,Math.PI,0);x.fill();x.beginPath();x.ellipse(bx,top,rr*1.25,2,0,0,7);x.fill();}
  x.fillRect(0,PH-(layer?6:12),PW,12);}};
const desert=(x,r)=>{for(let layer=0;layer<2;layer++){x.fillStyle=layer?'rgba(0,0,0,.9)':'rgba(0,0,0,.45)';
  x.beginPath();x.moveTo(0,PH);for(let px=0;px<=PW;px+=8){const h=(layer?10:22)+Math.sin(px/PW*6.283*(layer?5:3)+layer)*(layer?6:14)+Math.sin(px/PW*6.283*11)*3;x.lineTo(px,PH-h);}x.lineTo(PW,PH);x.fill();
  for(let i=0;i<(layer?6:10);i++){const bx=r()*PW,top=PH-(layer?30+r()*22:40+r()*30),wd=layer?3:2;
   x.fillRect(bx-wd,top,wd*2,PH-top);const ay=top+8+r()*10;x.fillRect(bx-wd-8,ay,8,wd*1.6);x.fillRect(bx-wd-8,ay-10,wd*1.5,12);}}};
const jungle=(x,r)=>{for(let layer=0;layer<2;layer++){x.fillStyle=layer?'rgba(0,0,0,1)':'rgba(0,0,0,.55)';
  for(let i=0;i<(layer?16:24);i++){const bx=r()*PW,wd=(layer?6:4)+r()*8;x.fillRect(bx-wd/2,0,wd,PH);}
  for(let i=0;i<(layer?70:110);i++){const bx=r()*PW,by=PH-(layer?10+r()*40:20+r()*90),rr=(layer?10:14)+r()*18;x.beginPath();x.ellipse(bx,by,rr*1.4,rr,0,0,7);x.fill();}
  x.fillRect(0,PH-(layer?14:26),PW,30);}};

function build(id){
  if(id==='giungla'){clouds(.88);silhouettes(jungle);}
  else if(id==='deserto'){clouds(.38);silhouettes(desert);}
  else{clouds(.52);silhouettes(meadow);}
}
build('prato');
onWorld(w=>build(w.id));

export { PW, PH, cloudM, silM };
