import { clamp, lerp, rng, vnoise } from '../core/util.js';

// ================= sky: panorama of clouds and distant meadow =================
const PW=1024,PH=160,cloudM=new Uint8Array(PW*PH),silM=new Uint8Array(PW*PH);
(()=>{for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){const u=x/PW*16,v=y/PH*5;
  let n=0,a=.5,f=1;for(let o=0;o<5;o++){n+=a*vnoise(u*f+(o*13.1),v*f*2.2,40+o);a*=.5;f*=2;}
  // vnoise doesn't tile: blend the edges to close the loop
  const e=Math.min(1,Math.min(x,PW-x)/40);n=lerp(.4,n,e);
  const band=Math.sin(Math.PI*clamp((y/PH-.18)/.7,0,1));cloudM[y*PW+x]=clamp((n-.48)*5*band,0,1)*255;}
 // distant meadow silhouettes: giant stems and flowers
 const c=document.createElement('canvas');c.width=PW;c.height=PH;const x=c.getContext('2d');const r=rng(77);
 for(let layer=0;layer<2;layer++){x.fillStyle=layer?'rgba(0,0,0,1)':'rgba(0,0,0,.5)';
  for(let i=0;i<(layer?110:160);i++){const bx=r()*PW,top=PH-(layer?8+r()*34:10+r()*55),wd=2+r()*5,lean=(r()-.5)*14;
   x.beginPath();x.moveTo(bx-wd,PH);x.quadraticCurveTo(bx,(PH+top)/2,bx+lean,top);x.quadraticCurveTo(bx+wd*.4,(PH+top)/2,bx+wd,PH);x.fill();}
  for(let i=0;i<(layer?7:12);i++){const bx=r()*PW,top=PH-(layer?40+r()*30:60+r()*40);
   x.fillRect(bx-1,top,2.5,PH-top);const rr=5+r()*4;x.beginPath();x.arc(bx,top,rr,Math.PI,0);x.fill();x.beginPath();x.ellipse(bx,top,rr*1.25,2,0,0,7);x.fill();}
  x.fillRect(0,PH-(layer?6:12),PW,12);}
 const d=x.getImageData(0,0,PW,PH).data;for(let i=0;i<PW*PH;i++)silM[i]=d[i*4+3];})();

export { PW, PH, cloudM, silM };
