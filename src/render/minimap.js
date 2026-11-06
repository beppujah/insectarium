import { $ } from '../core/util.js';
import { N, TYPE_COL } from '../world/constants.js';
import { G, lv, map, seen } from '../world/level.js';

// ================= minimap =================
const mctx=$('mini').getContext('2d');const mimg=mctx.createImageData(N,N);
function drawMini(){
 const d=mimg.data,open=lv.water?'#2e6a74':lv.under?'#7a5a3c':'#7a5a38';
 for(let i=0;i<N*N;i++){const o=i*4;
  if(!seen[i]){d[o]=d[o+1]=d[o+2]=0;d[o+3]=150;continue;}
  const t=map[i];const c=t?TYPE_COL[t]:open;
  d[o]=parseInt(c.slice(1,3),16);d[o+1]=parseInt(c.slice(3,5),16);d[o+2]=parseInt(c.slice(5,7),16);d[o+3]=255;}
 mctx.putImageData(mimg,0,0);
 mctx.fillStyle='#fff';mctx.fillRect(G.px-1,G.py-1,2,2);
 mctx.strokeStyle='#d99a2b';mctx.lineWidth=.7;mctx.beginPath();mctx.moveTo(G.px,G.py);mctx.lineTo(G.px+Math.cos(G.ang)*4,G.py+Math.sin(G.ang)*4);mctx.stroke();
}

export { drawMini };
