import { clamp, rng } from '../core/util.js';
import { N, WCEIL } from './constants.js';
import { G, blocked, cellAt, insects, lv } from './level.js';

// ================= insect sprites =================
// Drawn at 128×128 in a 64-unit coordinate space (so 0.5 is one pixel). Seen from the side, head on the left,
// feet on the bottom edge. Body parts are lit from the upper left with a glossy highlight; legs are jointed,
// wings are translucent with veins.
const S=128;
const R=rng(4242); // sprite details are random but the same on every load
const SPR={};
function sprite(id,draw){const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
 x.scale(S/64,S/64);x.lineJoin='round';x.lineCap='round';draw(x);
 const d=x.getImageData(0,0,S,S).data;SPR[id]={canvas:c,data:d,url:c.toDataURL(),size:S};}
const hex=h=>{const n=parseInt(h.slice(1,7),16);return[(n>>16)&255,(n>>8)&255,n&255];};
const mix=(a,b,t)=>{const p=hex(a),q=hex(b);return`rgb(${p.map((v,i)=>Math.round(v+(q[i]-v)*t)).join(',')})`;};
// a body part: lit from the upper left, darker rim, optional gloss spot
function part(x,cx,cy,rx,ry,base,{rot=0,gloss=.35,dark=.5,light=.3}={}){
 const g=x.createRadialGradient(cx-rx*.35,cy-ry*.45,.3,cx,cy,Math.max(rx,ry)*1.08);
 g.addColorStop(0,mix(base,'#ffffff',light));g.addColorStop(.55,base);g.addColorStop(1,mix(base,'#000000',dark));
 x.fillStyle=g;x.beginPath();x.ellipse(cx,cy,rx,ry,rot,0,7);x.fill();
 if(gloss){x.fillStyle=`rgba(255,255,255,${gloss})`;x.beginPath();x.ellipse(cx-rx*.38,cy-ry*.5,rx*.32,ry*.16,rot-.3,0,7);x.fill();}}
// a jointed leg or antenna: thinner towards the tip, small knuckles at the joints
function limb(x,pts,col,w0=1.6,w1=.7){for(let i=0;i<pts.length-2;i+=2){const t=i/(pts.length-2);x.strokeStyle=col;x.lineWidth=w0+(w1-w0)*t;
  x.beginPath();x.moveTo(pts[i],pts[i+1]);x.lineTo(pts[i+2],pts[i+3]);x.stroke();
  if(i>0){x.fillStyle=col;x.beginPath();x.arc(pts[i],pts[i+1],(w0+(w1-w0)*t)*.62,0,7);x.fill();}}}
// compound eye: dark with a few facets and a highlight
function eye(x,cx,cy,r,col='#1a1410'){part(x,cx,cy,r,r,col,{gloss:0,dark:.4,light:.2});
 x.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<5;i++){const a=i*1.26;x.fillRect(cx+Math.cos(a)*r*.5-.25,cy+Math.sin(a)*r*.5-.25,.5,.5);}
 x.fillStyle='rgba(255,255,255,.75)';x.beginPath();x.ellipse(cx-r*.35,cy-r*.4,r*.28,r*.2,0,0,7);x.fill();}
// translucent wing with veins and a darker edge
function wing(x,cx,cy,rx,ry,rot,tint='rgba(225,240,255,.45)',veins='rgba(60,50,40,.45)',n=5){
 x.save();x.translate(cx,cy);x.rotate(rot);x.fillStyle=tint;x.beginPath();x.ellipse(0,0,rx,ry,0,0,7);x.fill();
 x.clip();x.strokeStyle=veins;x.lineWidth=.35;
 for(let i=0;i<n;i++){const yy=-ry+ry*2*(i+.5)/n;x.beginPath();x.moveTo(-rx,yy*.3);x.quadraticCurveTo(0,yy*.9,rx,yy);x.stroke();}
 for(let i=1;i<n+2;i++){const xx=-rx+rx*2*i/(n+2);x.beginPath();x.moveTo(xx,-ry);x.lineTo(xx+1,ry);x.stroke();}
 x.restore();x.save();x.translate(cx,cy);x.rotate(rot);x.strokeStyle=veins;x.lineWidth=.6;x.beginPath();x.ellipse(0,0,rx,ry,0,0,7);x.stroke();x.restore();}
const segs=(x,cx,cy,rx,ry,n,col,w=.5)=>{x.strokeStyle=col;x.lineWidth=w;for(let i=1;i<n;i++){const xx=cx-rx+2*rx*i/n,h=ry*Math.sqrt(1-((xx-cx)/rx)**2);x.beginPath();x.moveTo(xx,cy-h);x.quadraticCurveTo(xx+.8,cy,xx,cy+h);x.stroke();}};
const hairs=(x,cx,cy,rx,ry,n,col,len=1.2)=>{x.strokeStyle=col;x.lineWidth=.35;for(let i=0;i<n;i++){const a=R()*6.283,r=Math.sqrt(R());const px=cx+Math.cos(a)*rx*r,py=cy+Math.sin(a)*ry*r;x.beginPath();x.moveTo(px,py);x.lineTo(px+(R()-.5)*len,py-len*.8);x.stroke();}};

// red wood ant: red-brown head and thorax, petiole node, dark glossy gaster, elbowed antennae
sprite('formica',x=>{const k='#24140c',far='#4a2c1c';
 limb(x,[30,48,36,54,42,62],far,1.2,.6);limb(x,[25,48,26,55,24,62],far,1.2,.6);limb(x,[20,47,14,54,10,61],far,1.2,.6);
 part(x,46,45,12,9,'#3a2014',{gloss:.4});x.strokeStyle='rgba(10,5,2,.5)';x.lineWidth=.5;for(let i=0;i<3;i++){x.beginPath();x.arc(46,45,6+i*2.4,-1.2,1.2);x.stroke();}
 hairs(x,46,45,11,8,30,'rgba(220,180,140,.5)',1);
 part(x,33,44,2.4,3.4,'#5a2a14',{gloss:.2});
 part(x,26,45,7,4.6,'#8a3a1a',{gloss:.3});part(x,13,42,6.2,5.6,'#7a3418',{gloss:.25});eye(x,10,40,1.8);
 limb(x,[7,45,3,47,1,45],k,1,.6);limb(x,[11,37,7,29,2,30],k,1,.5);limb(x,[14,37,13,28,8,25],k,1,.5);
 limb(x,[32,48,38,55,45,62],k,1.5,.7);limb(x,[27,49,28,56,27,63],k,1.5,.7);limb(x,[22,49,16,55,12,62],k,1.5,.7);});

// seven-spot ladybird: glossy domed red elytra with black spots, black pronotum with white patches
sprite('coccinella',x=>{const k='#120c0a';
 limb(x,[22,52,17,57,14,62],k,1.4,.7);limb(x,[32,55,33,59,31,63],k,1.4,.7);limb(x,[42,53,47,57,50,62],k,1.4,.7);
 x.fillStyle='#1a1210';x.beginPath();x.ellipse(34,52,19,4,0,0,7);x.fill();
 const g=x.createRadialGradient(28,36,1,34,46,22);g.addColorStop(0,'#ff6a4a');g.addColorStop(.5,'#d8261a');g.addColorStop(1,'#6a0e08');
 x.fillStyle=g;x.beginPath();x.moveTo(13,52);x.bezierCurveTo(13,30,55,28,55,52);x.closePath();x.fill();
 [[24,40,3.6],[40,38,3.6],[34,46,3],[21,49,2.6],[47,48,2.8],[30,34,2.4]].forEach(([px,py,r])=>{part(x,px,py,r,r*.9,'#16100c',{gloss:.15,light:.15});});
 x.strokeStyle='rgba(40,8,4,.6)';x.lineWidth=.6;x.beginPath();x.moveTo(34,31);x.quadraticCurveTo(35,42,34,52);x.stroke();
 x.fillStyle='rgba(255,255,255,.7)';x.beginPath();x.ellipse(26,35,6,2,-.45,0,7);x.fill();
 part(x,14,47,6,6.5,'#15100e',{gloss:.3});x.fillStyle='#f4f0e6';x.beginPath();x.ellipse(13,44,2.2,1.6,0,0,7);x.fill();x.beginPath();x.ellipse(17,49,1.6,1.4,0,0,7);x.fill();
 part(x,9,51,3.6,3.2,'#15100e',{gloss:.2});eye(x,7.5,50,1.2,'#2a201a');limb(x,[7,48,4,45],k,.6,.4);});

// swallowtail, wings spread (seen from above): yellow with black veins and bands, blue spots, red eye-spot, tails
sprite('farfalla',x=>{const ink='#16100c';
 const fw=(sx)=>{x.save();x.translate(32,30);x.scale(sx,1);
  x.fillStyle='#f2d24a';x.beginPath();x.moveTo(1,-2);x.bezierCurveTo(6,-20,22,-24,30,-20);x.lineTo(26,-2);x.quadraticCurveTo(14,2,1,2);x.fill();
  x.fillStyle=ink;x.beginPath();x.moveTo(30,-20);x.lineTo(26,-2);x.lineTo(22,-3);x.lineTo(25,-19);x.fill();
  x.fillStyle='rgba(22,16,12,.85)';[[6,-14,3],[10,-17,3],[15,-19,2.6]].forEach(([a,b,w])=>x.fillRect(a,b,w,8));
  x.strokeStyle=ink;x.lineWidth=.5;for(let i=0;i<6;i++){x.beginPath();x.moveTo(2,0);x.quadraticCurveTo(10,-6-i*2,24,-18+i*3);x.stroke();}
  x.fillStyle='#fff3b0';for(let i=0;i<5;i++){x.beginPath();x.arc(24.5+i*.2,-17+i*3.4,1,0,7);x.fill();}
  // hindwing
  x.fillStyle='#f2d24a';x.beginPath();x.moveTo(1,2);x.bezierCurveTo(10,2,22,4,22,14);x.quadraticCurveTo(18,22,10,24);x.lineTo(9,32);x.lineTo(7,24);x.quadraticCurveTo(2,18,1,6);x.fill();
  x.fillStyle=ink;x.beginPath();x.moveTo(22,14);x.quadraticCurveTo(18,22,10,24);x.lineTo(9,32);x.lineTo(7,24);x.lineTo(8,19);x.quadraticCurveTo(16,18,19,10);x.fill();
  x.fillStyle='#5aa8e8';for(let i=0;i<4;i++){x.beginPath();x.arc(10+i*3,20.5-i*2.6,1.1,0,7);x.fill();}
  x.fillStyle='#e0402a';x.beginPath();x.arc(4,20,2,0,7);x.fill();x.fillStyle=ink;x.beginPath();x.arc(4,20.4,.9,0,7);x.fill();
  x.strokeStyle=ink;x.lineWidth=.45;for(let i=0;i<4;i++){x.beginPath();x.moveTo(2,4);x.quadraticCurveTo(10,8+i,16-i*2,16+i*1.5);x.stroke();}
  x.restore();};
 fw(1);fw(-1);
 part(x,32,32,2,14,'#2a2016',{gloss:.25});hairs(x,32,26,1.6,5,16,'rgba(240,220,160,.6)',.9);part(x,32,16,2.4,2.6,'#2a2016',{gloss:.2});
 limb(x,[31,15,27,6,25,4],ink,.6,.5);limb(x,[33,15,37,6,39,4],ink,.6,.5);[[25,4],[39,4]].forEach(([a,b])=>{x.fillStyle=ink;x.beginPath();x.arc(a,b,.9,0,7);x.fill();});});

// honey bee: fuzzy thorax, banded abdomen with hair, veined wings, pollen basket on the hind leg
sprite('ape',x=>{const k='#1c130c';
 wing(x,32,22,13,5.5,-.45,'rgba(225,240,255,.5)','rgba(80,70,60,.45)',4);wing(x,41,25,9,4,.25,'rgba(225,240,255,.42)','rgba(80,70,60,.4)',3);
 limb(x,[24,48,21,55,19,61],'#3a2a1a',1.1,.6);limb(x,[32,50,34,56,33,62],'#3a2a1a',1.1,.6);
 const g=x.createRadialGradient(36,34,1,40,42,18);g.addColorStop(0,'#f8d060');g.addColorStop(.6,'#d89a1a');g.addColorStop(1,'#6a4208');
 x.fillStyle=g;x.beginPath();x.ellipse(41,42,15,10.5,.1,0,7);x.fill();
 x.save();x.beginPath();x.ellipse(41,42,15,10.5,.1,0,7);x.clip();x.fillStyle='rgba(30,18,8,.88)';[33,40,47,53].forEach(s=>{x.beginPath();x.ellipse(s,42,2.2,12,.1,0,7);x.fill();});x.restore();
 hairs(x,41,42,14,9,60,'rgba(255,230,170,.5)',1);x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.ellipse(36,36,6,1.8,-.2,0,7);x.fill();
 limb(x,[55,43,58,45],k,1.2,.6);
 part(x,24,40,8.5,8,'#5a3a1a',{gloss:0});hairs(x,24,40,8,7.5,90,'rgba(230,190,110,.8)',1.6);
 part(x,13,41,6,6.5,'#24180e',{gloss:.2});eye(x,12,39,3,'#2a1e14');hairs(x,13,46,4,2,14,'rgba(240,210,150,.6)',1);
 limb(x,[10,35,6,28,3,25],k,.8,.5);
 limb(x,[22,48,18,55,15,61],k,1.3,.7);limb(x,[29,49,30,56,29,62],k,1.3,.7);limb(x,[36,49,44,54,48,61],k,1.5,.7);
 part(x,44,54,3,2.4,'#e8a020',{gloss:.3});});

// grasshopper: long body, saddle-shaped pronotum, big hind femur with chevrons, folded wings
sprite('cavalletta',x=>{const g='#6aa030',d='#3a6418';
 limb(x,[24,48,20,55,18,62],d,1.1,.6);limb(x,[30,48,31,55,30,62],d,1.1,.6);
 part(x,36,45,19,5.4,g,{gloss:.15});segs(x,40,46,13,4.6,7,'rgba(30,60,10,.45)');
 x.fillStyle='#86b850';x.beginPath();x.moveTo(26,40);x.quadraticCurveTo(42,36,58,42);x.quadraticCurveTo(42,42,26,44);x.fill();
 x.strokeStyle='rgba(40,70,20,.5)';x.lineWidth=.4;for(let i=0;i<5;i++){x.beginPath();x.moveTo(28,41+i*.5);x.lineTo(57,42);x.stroke();}
 part(x,21,42,6.5,6,'#78ac3c',{gloss:.2});x.strokeStyle='rgba(30,60,10,.6)';x.lineWidth=.5;x.beginPath();x.moveTo(17,38);x.lineTo(26,38);x.stroke();
 part(x,11,43,6,7,g,{rot:.25,gloss:.2});eye(x,10,40,2.2,'#3a2a14');
 limb(x,[9,37,6,26,4,14],d,.8,.4);limb(x,[11,36,13,25,15,13],d,.8,.4);limb(x,[7,49,6,52],d,1,.6);
 // hind leg: femur with herringbone pattern, thin tibia down to the ground
 x.save();x.translate(37,46);x.rotate(-.62);part(x,9,0,10,3.4,'#7ab43c',{gloss:.2});x.strokeStyle='rgba(40,80,20,.65)';x.lineWidth=.5;
 for(let i=0;i<8;i++){x.beginPath();x.moveTo(1+i*2.2,-2.6);x.lineTo(2+i*2.2,0);x.lineTo(1+i*2.2,2.6);x.stroke();}x.restore();
 limb(x,[52,33,58,62],d,1,.6);x.fillStyle='#c84a2a';x.beginPath();x.arc(58,60,.8,0,7);x.fill();
 limb(x,[22,48,18,56,15,62],d,1.3,.7);limb(x,[28,49,28,56,27,63],d,1.3,.7);});

// rose chafer: metallic green elytra with white flecks, copper sheen
sprite('scarabeo',x=>{const k='#0e1810';
 limb(x,[22,54,17,59,14,63],k,1.5,.8);limb(x,[33,56,33,60,32,63],k,1.5,.8);limb(x,[44,54,49,58,52,63],k,1.5,.8);
 const g=x.createRadialGradient(30,38,1,36,47,22);g.addColorStop(0,'#c8f0a0');g.addColorStop(.3,'#4ab468');g.addColorStop(.7,'#1e6a4a');g.addColorStop(1,'#0e2a26');
 x.fillStyle=g;x.beginPath();x.ellipse(36,47,20,13,0,0,7);x.fill();
 x.fillStyle='rgba(200,120,60,.18)';x.beginPath();x.ellipse(44,52,12,6,0,0,7);x.fill();
 x.fillStyle='rgba(250,250,240,.85)';[[40,46,1.6,.8],[47,42,1.2,.7],[44,52,1.5,.7],[33,52,1.1,.6],[50,49,.9,.5]].forEach(([a,b,c,d])=>{x.beginPath();x.ellipse(a,b,c,d,.3,0,7);x.fill();});
 x.strokeStyle='rgba(5,20,15,.6)';x.lineWidth=.6;x.beginPath();x.moveTo(26,36);x.quadraticCurveTo(38,40,55,47);x.stroke();
 x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(30,39,8,2.2,-.25,0,7);x.fill();
 part(x,17,45,6.5,6,'#2a7a54',{gloss:.4});part(x,10,48,4,3.4,'#1a4a36',{gloss:.25});eye(x,9,47,1.1);
 limb(x,[7,46,3,42,2,38],k,.7,.5);x.fillStyle=k;x.beginPath();x.ellipse(2,38,1.2,2,.3,0,7);x.fill();});

// dragonfly: big eyes, striped thorax, long segmented blue abdomen, four veined wings with a dark pterostigma
sprite('libellula',x=>{
 const wg=(cx,cy,rx,ry,rot)=>{wing(x,cx,cy,rx,ry,rot,'rgba(215,235,255,.42)','rgba(40,50,60,.45)',6);
  x.save();x.translate(cx,cy);x.rotate(rot);x.fillStyle='rgba(40,30,20,.8)';x.fillRect(rx*.62,-ry*.25,2.2,ry*.5);x.restore();};
 wg(22,15,6,15,-.12);wg(30,15,5.5,14,.12);wg(22,53,6,15,.12);wg(30,53,5.5,14,-.12);
 for(let i=0;i<9;i++){const px=31+i*3.6;part(x,px,34,2.2,1.9-i*.06,i%2?'#3a8ee0':'#2268b4',{gloss:.3,light:.35});}
 x.fillStyle='#14202c';x.fillRect(61,33,2,2);
 part(x,24,34,6.5,5,'#3a7a3e',{gloss:.3});x.strokeStyle='rgba(20,30,10,.7)';x.lineWidth=.7;x.beginPath();x.moveTo(21,30);x.lineTo(25,38);x.moveTo(25,30);x.lineTo(28,37);x.stroke();
 part(x,13,34,6,6,'#2e8a54',{gloss:0});eye(x,12,32,4.2,'#2a9a6a');x.fillStyle='rgba(180,255,210,.35)';x.beginPath();x.ellipse(10,30,2,1.2,-.4,0,7);x.fill();
 limb(x,[20,38,17,43,15,46],'#1a1a14',.7,.4);limb(x,[24,39,24,44,22,47],'#1a1a14',.7,.4);});

// firefly: dark beetle with an orange shield over the head and a glowing lantern at the tail
sprite('lucciola',x=>{const k='#241a12';
 limb(x,[22,43,19,49,18,53],k,1,.5);limb(x,[28,44,29,50,28,54],k,1,.5);
 x.fillStyle='rgba(255,255,170,.35)';x.beginPath();x.ellipse(41,40,13,12,0,0,7);x.fill();
 x.fillStyle='#ecff7a';x.beginPath();x.ellipse(40,41,8,7,0,0,7);x.fill();x.fillStyle='#ffffe0';x.beginPath();x.ellipse(40,41,4.8,4,0,0,7);x.fill();
 part(x,28,38,11,5.5,'#3a2c20',{gloss:.25});x.strokeStyle='rgba(200,170,120,.35)';x.lineWidth=.4;x.beginPath();x.moveTo(18,37);x.lineTo(38,38);x.stroke();
 wing(x,28,33,9,3,-.15,'rgba(220,220,200,.3)','rgba(80,70,50,.4)',3);
 part(x,16,36,5.5,4.8,'#d8823e',{gloss:.3});x.fillStyle='rgba(90,40,20,.6)';x.beginPath();x.ellipse(17,36,1.6,1.2,0,0,7);x.fill();
 part(x,11,40,2.6,2.4,k,{gloss:.15});eye(x,10,39,1);limb(x,[10,37,6,30,4,24],k,.7,.4);});

// edible frog: smooth green skin with dark spots and a pale ridge, golden eye, folded legs
sprite('rana',x=>{const g='#5a9a3a',d='#2f5a1c';
 part(x,44,56,14,4.6,d,{gloss:0,dark:.3});limb(x,[50,52,58,58,48,62,40,62],d,3.2,2);
 const b=x.createRadialGradient(28,38,1,34,46,22);b.addColorStop(0,'#9ad060');b.addColorStop(.55,g);b.addColorStop(1,'#25481a');
 x.fillStyle=b;x.beginPath();x.moveTo(8,50);x.quadraticCurveTo(10,34,30,34);x.quadraticCurveTo(52,34,54,48);x.quadraticCurveTo(48,58,30,58);x.quadraticCurveTo(14,58,8,50);x.fill();
 x.fillStyle='#ece4a8';x.beginPath();x.moveTo(10,52);x.quadraticCurveTo(28,60,46,56);x.quadraticCurveTo(28,57,10,52);x.fill();
 x.strokeStyle='#c8d890';x.lineWidth=1;x.beginPath();x.moveTo(16,38);x.quadraticCurveTo(34,34,50,42);x.stroke();
 [[30,42,2.4],[38,46,2.2],[44,42,1.8],[24,48,2],[34,52,1.6],[46,50,1.6]].forEach(([a,c,r])=>part(x,a,c,r,r*.8,'#2a4a18',{gloss:0,light:.1}));
 x.fillStyle='rgba(255,255,255,.4)';x.beginPath();x.ellipse(24,37,8,1.8,-.15,0,7);x.fill();
 part(x,17,36,5,5,'#7ab84a',{gloss:0});part(x,17,35,3.8,3.8,'#d8a020',{gloss:0,light:.4});x.fillStyle='#111';x.beginPath();x.ellipse(17,35,2.4,1.2,0,0,7);x.fill();
 x.fillStyle='#fff';x.beginPath();x.arc(15.6,33.8,.8,0,7);x.fill();
 x.strokeStyle='#1e3a10';x.lineWidth=.7;x.beginPath();x.moveTo(8,48);x.quadraticCurveTo(14,50,22,48);x.stroke();
 limb(x,[22,52,18,58,12,62],d,2.2,1.2);[[10,62],[13,63],[15,62]].forEach(([a,c])=>{x.fillStyle=d;x.beginPath();x.arc(a,c,.9,0,7);x.fill();});});

// pond skater: slim dark body, long middle and hind legs resting on dimples in the water
sprite('gerride',x=>{const k='#2a2418';
 [[2,61],[19,62],[61,62],[42,62]].forEach(([a,b])=>{x.fillStyle='rgba(220,240,255,.55)';x.beginPath();x.ellipse(a,b,4.2,1.1,0,0,7);x.fill();x.strokeStyle='rgba(255,255,255,.7)';x.lineWidth=.4;x.beginPath();x.ellipse(a,b,4.2,1.1,0,0,7);x.stroke();});
 limb(x,[27,46,7,30,2,60],k,1.1,.45);limb(x,[30,46,23,36,19,61],k,1.1,.45);limb(x,[37,47,52,34,61,61],k,1.1,.45);limb(x,[35,47,46,40,42,61],k,1.1,.45);
 part(x,33,46,13,3,'#4a3a26',{gloss:.3});x.strokeStyle='rgba(220,200,160,.4)';x.lineWidth=.4;x.beginPath();x.moveTo(22,45);x.lineTo(44,45);x.stroke();
 part(x,19,45,4,3,k,{gloss:.2});eye(x,17,44,1.2,'#4a3a2a');limb(x,[17,43,10,40,6,41],k,.6,.4);limb(x,[22,47,16,50,13,50],k,.8,.5);});

// tadpole: round speckled body, eye, long tail with a translucent fin
sprite('girino',x=>{
 x.fillStyle='rgba(150,150,110,.4)';x.beginPath();x.moveTo(30,40);for(let i=0;i<=14;i++){const t=i/14;x.lineTo(30+t*33,40+Math.sin(t*6)*5*t-7*(1-t*.8));}
 for(let i=14;i>=0;i--){const t=i/14;x.lineTo(30+t*33,40+Math.sin(t*6)*5*t+7*(1-t*.8));}x.fill();
 x.fillStyle='#3a3a2a';x.beginPath();x.moveTo(30,40);for(let i=0;i<=12;i++){const t=i/12;x.lineTo(30+t*32,40+Math.sin(t*6)*5*t-3.6*(1-t));}
 for(let i=12;i>=0;i--){const t=i/12;x.lineTo(30+t*32,40+Math.sin(t*6)*5*t+3.6*(1-t));}x.fill();
 part(x,24,40,12,10,'#34321f',{gloss:.25});
 x.fillStyle='rgba(200,190,140,.35)';for(let i=0;i<22;i++){x.beginPath();x.arc(16+R()*16,34+R()*12,.45,0,7);x.fill();}
 part(x,17,37,2.6,2.6,'#c8b060',{gloss:0});x.fillStyle='#111';x.beginPath();x.arc(17,37,1.3,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(16.3,36.3,.5,0,7);x.fill();});

// great diving beetle: olive-black oval with a yellow rim, fringed swimming legs, an air bubble at the tail
sprite('ditisco',x=>{const k='#1a1c0e';
 limb(x,[40,46,52,42,62,47],k,2,1);limb(x,[38,48,50,55,62,55],k,2,1);
 [[53,43,62,47],[51,54,62,55]].forEach(([a,b,c,d])=>{x.strokeStyle='rgba(200,180,120,.6)';x.lineWidth=.35;for(let i=0;i<10;i++){const t=i/9,px=a+(c-a)*t,py=b+(d-b)*t;x.beginPath();x.moveTo(px,py);x.lineTo(px+.4,py+2.2);x.stroke();}});
 part(x,32,40,22,14,'#d8b040',{gloss:0,dark:.4});part(x,32,40,19.5,12,'#3a4020',{gloss:.45,light:.25});
 x.strokeStyle='rgba(10,12,4,.6)';x.lineWidth=.6;x.beginPath();x.moveTo(30,29);x.quadraticCurveTo(36,40,52,44);x.stroke();
 x.strokeStyle='rgba(120,120,70,.25)';x.lineWidth=.35;for(let i=0;i<5;i++){x.beginPath();x.moveTo(20,33+i*3);x.quadraticCurveTo(34,32+i*3,50,37+i*2);x.stroke();}
 part(x,12,42,7,6,'#3a4020',{gloss:.3});x.fillStyle='#d8b040';x.beginPath();x.ellipse(13,38,4,1,0,0,7);x.fill();eye(x,8.5,41,1.6,'#2a2a14');
 limb(x,[18,48,13,55,10,57],k,1.3,.6);limb(x,[24,50,22,56],k,1.2,.6);limb(x,[7,39,2,36],k,.6,.4);
 part(x,52,46,3.4,2.8,'#cfe8ff',{gloss:.7,dark:.1,light:.6});});

// backswimmer, swimming upside down: pale keeled back underneath, oar-like hind legs with hair fringes, red eyes
sprite('notonetta',x=>{const k='#3a3020';
 limb(x,[40,30,52,17,62,22],k,1.8,1);limb(x,[38,28,47,13,58,10],k,1.8,1);
 [[52,17,62,22],[47,13,58,10]].forEach(([a,b,c,d])=>{x.strokeStyle='rgba(220,210,170,.6)';x.lineWidth=.35;for(let i=0;i<10;i++){const t=i/9,px=a+(c-a)*t,py=b+(d-b)*t;x.beginPath();x.moveTo(px,py);x.lineTo(px+.4,py-2.2);x.stroke();}});
 const g=x.createLinearGradient(0,18,0,38);g.addColorStop(0,'#f6f0dc');g.addColorStop(.6,'#d8ccb0');g.addColorStop(1,'#8a7a5a');
 x.fillStyle=g;x.beginPath();x.moveTo(8,30);x.quadraticCurveTo(30,14,52,28);x.quadraticCurveTo(30,40,8,30);x.fill();
 x.strokeStyle='rgba(120,100,70,.5)';x.lineWidth=.5;x.beginPath();x.moveTo(10,29);x.quadraticCurveTo(30,22,50,28);x.stroke();
 x.fillStyle='#7a5a32';x.beginPath();x.moveTo(10,31);x.quadraticCurveTo(30,42,50,30);x.quadraticCurveTo(30,36,10,31);x.fill();
 x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.ellipse(24,22,10,1.5,-.12,0,7);x.fill();
 part(x,10,30,5,4,'#c84030',{gloss:.4});limb(x,[20,27,19,20,17,16],k,.9,.5);limb(x,[26,27,26,20,25,15],k,.9,.5);
 x.fillStyle='rgba(220,240,255,.7)';[[56,32,1.4],[59,35,1],[54,36,.8]].forEach(([a,b,r])=>{x.beginPath();x.arc(a,b,r,0,7);x.fill();});});

// dragonfly nymph: stout mottled brown body, wing pads on the back, big eyes, folded mask under the head
sprite('ninfa',x=>{const k='#3a2e18';
 limb(x,[24,48,18,54,14,60],k,1.2,.6);limb(x,[32,50,33,56,30,62],k,1.2,.6);limb(x,[40,50,46,55,48,61],k,1.3,.6);
 part(x,39,46,18,8,'#6a5a30',{gloss:.15});segs(x,42,46,14,7.5,7,'rgba(30,24,10,.5)',.6);
 x.fillStyle='rgba(40,30,10,.35)';for(let i=0;i<20;i++){x.beginPath();x.arc(24+R()*30,40+R()*12,.5+R()*.8,0,7);x.fill();}
 part(x,30,40,9,3.4,'#8a7a40',{gloss:.2,rot:-.08});part(x,32,42,7,2.4,'#7a6a34',{gloss:.1,rot:-.05});
 part(x,16,44,9,7.5,'#5a4a28',{gloss:.2});eye(x,11,40,3.6,'#6a5a28');eye(x,19,39,3.2,'#6a5a28');
 x.fillStyle='#4a3a20';x.beginPath();x.moveTo(8,48);x.lineTo(16,51);x.lineTo(14,53);x.lineTo(6,51);x.fill();
 limb(x,[22,47,14,40,10,41],k,1,.5);limb(x,[4,40,1,36],k,.5,.3);});

// mole cricket: velvety brown, shovel-like front legs, short wings, tail cerci
sprite('grillotalpa',x=>{const b='#6b4a2e',d='#3a2414';
 limb(x,[40,50,48,60,58,62],d,2,1);limb(x,[28,52,26,62],d,1.6,.8);limb(x,[56,46,63,43],d,.7,.4);limb(x,[56,48,63,51],d,.7,.4);
 part(x,38,46,20,8,b,{gloss:.12,dark:.45});hairs(x,38,46,19,7.5,120,'rgba(200,170,130,.35)',.9);segs(x,44,46,13,7.5,6,'rgba(40,25,12,.45)',.5);
 wing(x,38,40,13,3.5,-.03,'rgba(170,130,90,.55)','rgba(60,40,20,.55)',3);
 part(x,19,43,10,8.5,'#7d5838',{gloss:.2});hairs(x,19,43,9,8,70,'rgba(220,190,150,.45)',.8);
 part(x,9,45,5.5,5,d,{gloss:.15});eye(x,8,43,1.3,'#1a100a');limb(x,[7,42,1,35],d,.7,.4);limb(x,[8,41,4,32],d,.7,.4);
 x.fillStyle='#4a2c18';x.beginPath();x.moveTo(14,50);x.lineTo(5,59);x.lineTo(1,56);x.lineTo(8,49);x.fill();
 [[5,59,1,63],[3,58,0,61],[6,60,4,64],[7,59,7,63]].forEach(p=>limb(x,p,'#2a180c',1.1,.6));});

// queen ant: large thorax with wing scars, heavy glossy gaster, elbowed antennae
sprite('regina',x=>{const k='#3c1a0c';
 limb(x,[30,50,36,56,42,62],'#5a2a16',1.2,.6);limb(x,[25,50,25,57,23,62],'#5a2a16',1.2,.6);
 part(x,44,44,17,13,'#5a2814',{gloss:.45});for(let i=0;i<4;i++){x.strokeStyle='rgba(20,8,2,.45)';x.lineWidth=.8;x.beginPath();x.arc(44,44,6+i*3,-1.25,1.25);x.stroke();}
 hairs(x,44,44,16,12,40,'rgba(230,190,150,.45)',1.1);
 part(x,29,44,2.6,4,'#6a3218',{gloss:.2});
 part(x,23,43,8,6.4,'#7a3a1c',{gloss:.3});x.fillStyle='#3a1a0a';[[21,38],[25,38]].forEach(([a,b])=>{x.beginPath();x.ellipse(a,b,1.4,.8,0,0,7);x.fill();});
 part(x,11,41,6.5,6,'#4a2010',{gloss:.25});eye(x,9,39,1.8);
 limb(x,[9,37,3,27,0,29],k,1,.5);limb(x,[12,36,11,26,7,24],k,1,.5);limb(x,[6,44,2,46],k,1,.6);
 limb(x,[28,49,36,56,42,63],k,1.5,.7);limb(x,[22,50,22,57,20,63],k,1.5,.7);limb(x,[18,48,12,55,8,62],k,1.5,.7);
 [[56,59],[60,61],[52,61]].forEach(([a,b])=>part(x,a,b,3,2,'#f4f0e0',{gloss:.4}));});

// cockchafer grub: plump white C-shaped body with folds, orange-brown head, little legs near the head
sprite('larva',x=>{
 x.lineCap='round';x.strokeStyle='#d8ccb0';x.lineWidth=18;x.beginPath();x.arc(30,40,14,-.15*Math.PI,1.25*Math.PI);x.stroke();
 x.strokeStyle='#f4ecd8';x.lineWidth=13;x.beginPath();x.arc(29,39,14,-.12*Math.PI,1.22*Math.PI);x.stroke();
 x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=3;x.beginPath();x.arc(28,37,17,.9*Math.PI,1.5*Math.PI);x.stroke();
 x.strokeStyle='rgba(150,120,90,.5)';x.lineWidth=.7;for(let i=0;i<11;i++){const a=-.15*Math.PI+i*.13*Math.PI;x.beginPath();x.moveTo(30+Math.cos(a)*6,40+Math.sin(a)*6);x.quadraticCurveTo(30+Math.cos(a+.05)*14,40+Math.sin(a+.05)*14,30+Math.cos(a)*22.5,40+Math.sin(a)*22.5);x.stroke();}
 x.fillStyle='rgba(90,80,90,.45)';x.beginPath();x.ellipse(16,30,4.5,6.5,-.6,0,7);x.fill();
 x.fillStyle='rgba(180,140,100,.5)';for(let i=0;i<6;i++){const a=-.1*Math.PI+i*.25*Math.PI;x.beginPath();x.arc(30+Math.cos(a)*21,40+Math.sin(a)*21,.6,0,7);x.fill();}
 part(x,44,32,8,7.5,'#c47a2a',{gloss:.35});limb(x,[48,37,52,40],'#3a200c',1.5,.8);limb(x,[50,35,54,36],'#3a200c',1,.6);
 limb(x,[38,44,40,48,39,51],'#b07030',1.2,.6);limb(x,[34,46,34,50,33,53],'#b07030',1.2,.6);limb(x,[30,47,28,51,27,54],'#b07030',1.2,.6);});

// cicada nymph: glossy brown, spiny digging forelegs, wing pads, bulging eyes
sprite('cicala',x=>{const d='#5e3e1a';
 limb(x,[36,52,40,62],d,1.6,.8);limb(x,[46,50,52,61],d,1.6,.8);
 part(x,38,44,17,11,'#a8743a',{gloss:.35});segs(x,42,45,12,10,6,'rgba(70,40,15,.5)',.6);
 part(x,29,38,9,4.2,'#c08a48',{gloss:.3,rot:-.15});part(x,31,41,8,3,'#b07a3c',{gloss:.15,rot:-.1});
 part(x,17,41,9,8.5,'#9a6830',{gloss:.3});eye(x,12,37,3,'#3a2410');
 limb(x,[18,48,10,58,4,53],d,2.6,1.4);[[8,56,6,59],[6,55,3,57],[10,57,9,60]].forEach(p=>limb(x,p,d,.8,.4));limb(x,[4,53,2,49],d,1.4,.8);
 limb(x,[26,51,22,62],d,1.6,.8);limb(x,[9,40,4,36],d,.6,.4);
 x.fillStyle='rgba(70,45,20,.35)';for(let i=0;i<14;i++){x.beginPath();x.arc(28+R()*24,38+R()*12,.4+R()*.6,0,7);x.fill();}});

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
// pollen floating in the air
const MOTES=Array.from({length:140},()=>({x:0,y:0,z:0,ph:Math.random()*6.28,init:false}));

export { SPR, updateInsects, MOTES };
